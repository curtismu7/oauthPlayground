// src/services/v7m/core/V9MockOAuthErrorHandlingService.ts
// Minimal error shaping for V7M flows.

export type V9MockOAuthError = {
	error: string;
	error_description?: string;
	error_uri?: string;
};

export const V9MockOAuthErrorHandlingService = {
	format(error: V9MockOAuthError): string {
		const desc = error.error_description ? `: ${error.error_description}` : '';
		return `${error.error}${desc}`;
	},
	toDisplay(error: unknown): V9MockOAuthError {
		if (typeof error === 'string') return { error: 'error', error_description: error };
		if (error && typeof error === 'object' && 'error' in (error as any))
			return error as V9MockOAuthError;
		return { error: 'error', error_description: 'Unknown error' };
	},
};
