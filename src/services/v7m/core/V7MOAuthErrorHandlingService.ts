// src/services/v7m/core/V7MOAuthErrorHandlingService.ts
// Minimal error shaping for V7M flows.

export type V7MOAuthError = {
	error: string;
	error_description?: string;
	error_uri?: string;
};

export const V7MOAuthErrorHandlingService = {
	format(error: V7MOAuthError): string {
		const desc = error.error_description ? `: ${error.error_description}` : '';
		return `${error.error}${desc}`;
	},
	toDisplay(error: unknown): V7MOAuthError {
		if (typeof error === 'string') return { error: 'error', error_description: error };
		if (error && typeof error === 'object' && 'error' in (error as any))
			return error as V7MOAuthError;
		return { error: 'error', error_description: 'Unknown error' };
	},
};
