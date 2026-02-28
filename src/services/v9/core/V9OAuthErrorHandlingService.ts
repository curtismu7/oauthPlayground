// src/services/v9/core/V9OAuthErrorHandlingService.ts
// Minimal error shaping for V9 flows.
//
// Migrated from V7MOAuthErrorHandlingService.ts.

export type V9OAuthError = {
	error: string;
	error_description?: string;
	error_uri?: string;
};

export const V9OAuthErrorHandlingService = {
	format(error: V9OAuthError): string {
		const desc = error.error_description ? `: ${error.error_description}` : '';
		return `${error.error}${desc}`;
	},
	toDisplay(error: unknown): V9OAuthError {
		if (typeof error === 'string') return { error: 'error', error_description: error };
		if (error && typeof error === 'object' && 'error' in (error as Record<string, unknown>))
			return error as V9OAuthError;
		return { error: 'error', error_description: 'Unknown error' };
	},
};
