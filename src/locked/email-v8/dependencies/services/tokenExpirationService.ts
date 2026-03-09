// src/services/tokenExpirationService.ts
import { logger } from '../../../../utils/logger';

// Unified service for checking worker token expiration and showing appropriate messages

// Simple console fallback for locked components
const modernMessaging = {
	showBanner: (options: { type: string; title: string; message: string; dismissible: boolean }) => {
		logger.info(`[TokenExpirationService] ${options.type.toUpperCase()}: ${options.message}`);
	},
};

export interface TokenExpirationInfo {
	token: string | null;
	isExpired: boolean;
	isExpiringSoon: boolean;
	minutesRemaining: number;
	expiresAt: number | null;
	expiresAtFormatted: string | null;
}

export interface TokenCheckResult {
	isValid: boolean;
	token: string | null;
	expirationInfo: TokenExpirationInfo | null;
	errorMessage?: string;
}

/**
 * Check if a worker token is expired or expiring soon
 */
export const checkTokenExpiration = (
	token: string | null,
	tokenExpiryKey: string
): TokenExpirationInfo | null => {
	if (!token || !tokenExpiryKey) {
		return null;
	}

	try {
		const expiresAtStr = localStorage.getItem(tokenExpiryKey);
		if (!expiresAtStr) {
			return {
				token,
				isExpired: false,
				isExpiringSoon: false,
				minutesRemaining: 0,
				expiresAt: null,
				expiresAtFormatted: null,
			};
		}

		const expiresAt = parseInt(expiresAtStr, 10);
		const now = Date.now();
		const isExpired = now >= expiresAt;
		const timeRemaining = expiresAt - now;
		const minutesRemaining = Math.floor(timeRemaining / 60000);
		const isExpiringSoon = !isExpired && minutesRemaining < 15;

		return {
			token,
			isExpired,
			isExpiringSoon,
			minutesRemaining: isExpired ? 0 : minutesRemaining,
			expiresAt,
			expiresAtFormatted: new Date(expiresAt).toLocaleString(),
		};
	} catch (error) {
		logger.warn('[TokenExpirationService] Error checking token expiration:', error);
		return null;
	}
};

/**
 * Get worker token with expiration checking
 * Returns null if token is expired or missing
 */
export const getValidWorkerToken = (
	tokenStorageKey: string,
	tokenExpiryKey: string,
	options: {
		clearExpired?: boolean;
		showToast?: boolean;
		requiredScopes?: string[];
	} = {}
): TokenCheckResult => {
	const { clearExpired = true, showToast = true, requiredScopes } = options;

	try {
		const token = localStorage.getItem(tokenStorageKey);
		if (!token) {
			return {
				isValid: false,
				token: null,
				expirationInfo: null,
				errorMessage: 'No worker token found. Please generate a new worker token.',
			};
		}

		const expirationInfo = checkTokenExpiration(token, tokenExpiryKey);
		if (!expirationInfo) {
			// Token exists but no expiration data - assume it might be expired
			if (showToast) {
				modernMessaging.showBanner({
					type: 'warning',
					title: 'Warning',
					message: 'Worker token found but expiration data is missing. The token may be expired.',
					dismissible: true,
				});
			}
			return {
				isValid: false,
				token,
				expirationInfo: null,
				errorMessage:
					'Worker token expiration data is missing. Please generate a new worker token.',
			};
		}

		if (expirationInfo.isExpired) {
			if (clearExpired) {
				localStorage.removeItem(tokenStorageKey);
				localStorage.removeItem(tokenExpiryKey);
			}
			if (showToast) {
				modernMessaging.showBanner({
					type: 'error',
					title: 'Error',
					message: `Worker token has EXPIRED (expired at ${expirationInfo.expiresAtFormatted}). Please generate a new worker token.`,
					dismissible: true,
				});
			}
			return {
				isValid: false,
				token: null,
				expirationInfo,
				errorMessage: `Worker token expired at ${expirationInfo.expiresAtFormatted}. Please generate a new token${requiredScopes ? ` with scopes: ${requiredScopes.join(', ')}` : ''}.`,
			};
		}

		if (expirationInfo.isExpiringSoon && showToast) {
			modernMessaging.showBanner({
				type: 'warning',
				title: 'Warning',
				message: `Worker token expires in ${expirationInfo.minutesRemaining} minutes (${expirationInfo.expiresAtFormatted}). Consider refreshing soon.`,
				dismissible: true,
			});
		}

		return {
			isValid: true,
			token,
			expirationInfo,
		};
	} catch (error) {
		logger.error('[TokenExpirationService] Error getting valid worker token:', error);
		return {
			isValid: false,
			token: null,
			expirationInfo: null,
			errorMessage: 'Error checking worker token. Please try generating a new token.',
		};
	}
};

/**
 * Show success message when token is generated
 */
export const showTokenSuccessMessage = (expiresIn: number, requiredScopes?: string[]): void => {
	const minutes = Math.floor(expiresIn / 60);
	const hours = Math.floor(minutes / 60);
	const timeText =
		hours > 0
			? `${hours} hour${hours !== 1 ? 's' : ''}`
			: `${minutes} minute${minutes !== 1 ? 's' : ''}`;

	const scopeText =
		requiredScopes && requiredScopes.length > 0 ? ` with scopes: ${requiredScopes.join(', ')}` : '';

	modernMessaging.showBanner({
		type: 'success',
		title: 'Success',
		message: `Worker token generated successfully! Expires in ${timeText}.${scopeText}`,
		dismissible: true,
	});
};

/**
 * Show expiration warning message
 */
export const showExpirationWarning = (expirationInfo: TokenExpirationInfo): void => {
	if (expirationInfo.isExpired) {
		modernMessaging.showBanner({
			type: 'error',
			title: 'Error',
			message: `Worker token has EXPIRED (expired at ${expirationInfo.expiresAtFormatted}). Please generate a new token.`,
			dismissible: true,
		});
	} else if (expirationInfo.isExpiringSoon) {
		modernMessaging.showBanner({
			type: 'warning',
			title: 'Warning',
			message: `Worker token expires soon (${expirationInfo.minutesRemaining} minutes remaining, expires at ${expirationInfo.expiresAtFormatted}). Consider generating a new token.`,
			dismissible: true,
		});
	}
};

/**
 * Format time remaining for display
 */
export const formatTimeRemaining = (expiresAt: number | null): string => {
	if (!expiresAt) {
		return 'Unknown expiration';
	}

	const now = Date.now();
	const isExpired = now >= expiresAt;
	const timeRemaining = expiresAt - now;
	const minutesRemaining = Math.floor(timeRemaining / 60000);
	const hoursRemaining = Math.floor(timeRemaining / 3600000);

	if (isExpired) {
		return 'EXPIRED';
	} else if (minutesRemaining < 5) {
		return `Expires in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}`;
	} else if (minutesRemaining < 60) {
		return `Expires in ${minutesRemaining} minutes`;
	} else {
		return `Expires in ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''} ${minutesRemaining % 60} min`;
	}
};

export default {
	checkTokenExpiration,
	getValidWorkerToken,
	showTokenSuccessMessage,
	showExpirationWarning,
	formatTimeRemaining,
};
