export interface ApiError extends Error {
	status: number | undefined;
	code: string | undefined;
	details: unknown;
}

export const createApiError = (
	message: string,
	status?: number,
	code?: string,
	details?: unknown
): ApiError => {
	const error = new Error(message) as ApiError;
	error.status = status;
	error.code = code;
	error.details = details;
	return error;
};

export const handleApiResponse = async (response: Response): Promise<unknown> => {
	if (!response.ok) {
		let errorData: Record<string, unknown> | null = null;
		try {
			errorData = (await response.json()) as Record<string, unknown>;
		} catch {
			throw createApiError(response.statusText || 'API request failed', response.status);
		}

		const message =
			typeof errorData.message === 'string'
				? errorData.message
				: response.statusText || 'API request failed';
		const code = typeof errorData.code === 'string' ? errorData.code : undefined;
		const details = errorData.details ?? errorData;

		throw createApiError(message, response.status, code, details);
	}

	if (response.status === 204) {
		return {};
	}

	return response.json();
};

export const withRetry = async <T>(
	fn: () => Promise<T>,
	maxRetries = 3,
	baseDelay = 1000
): Promise<T> => {
	let lastError: Error = new Error('No error occurred');

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error as Error;

			const errorStatus = (error as ApiError).status || 500;
			if (errorStatus >= 400 && errorStatus < 500 && errorStatus !== 429) {
				break;
			}

			const delay = baseDelay * 2 ** (attempt - 1);
			const jitter = delay * 0.5 * (1 + Math.random());

			await new Promise((resolve) => setTimeout(resolve, jitter));
		}
	}

	throw lastError;
};
