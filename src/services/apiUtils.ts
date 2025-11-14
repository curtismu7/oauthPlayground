export interface ApiError extends Error {
    status: number | undefined;
    code: string | undefined;
    details: any;
}

export const createApiError = (message: string, status?: number, code?: string, details?: any): ApiError => {
    const error = new Error(message) as ApiError;
    error.status = status;
    error.code = code;
    error.details = details;
    return error;
};

export const handleApiResponse = async (response: Response): Promise<any> => {
    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            // If we can't parse JSON, use status text
            throw createApiError(
                response.statusText || 'API request failed',
                response.status
            );
        }

        throw createApiError(
            errorData.message || response.statusText,
            response.status,
            errorData.code,
            errorData.details
        );
    }

    // For 204 No Content responses, return empty object
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
            
            // Don't retry for 4xx errors except 429 (Too Many Requests)
            const errorStatus = (error as ApiError).status || 500;
    if (errorStatus >= 400 && errorStatus < 500 && errorStatus !== 429) {
                break;
            }

            // Calculate delay with exponential backoff (1s, 2s, 4s, etc.)
            const delay = baseDelay * Math.pow(2, attempt - 1);
            
            // Add jitter (0.5 to 1.5 * delay)
            const jitter = delay * 0.5 * (1 + Math.random());
            
            await new Promise(resolve => setTimeout(resolve, jitter));
        }
    }
    
    if (!lastError) {
        throw new Error('Unknown error occurred after retries');
    }
    throw lastError;
};
