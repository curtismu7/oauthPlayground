/**
 * @file workerTokenStatusServiceV8.ts
 * @module v8/services
 * @description Worker token status checking and formatting for V8
 * @version 8.0.0
 * @since 2024-11-16
 */

import { unifiedWorkerTokenService } from '../../services/unifiedWorkerTokenService';

export type TokenStatus = 'valid' | 'expiring-soon' | 'expired' | 'missing';

export interface TokenStatusInfo {
	status: TokenStatus;
	message: string;
	isValid: boolean;
	expiresAt?: number;
	minutesRemaining?: number;
	token?: string;
}

/**
 * Format time remaining for display
 */
export const formatTimeRemaining = (expiresAt: number): string => {
	const now = Date.now();
	const isExpired = now >= expiresAt;
	const timeRemaining = expiresAt - now;
	const minutesRemaining = Math.floor(timeRemaining / 60000);
	const hoursRemaining = Math.floor(timeRemaining / 3600000);

	if (isExpired) {
		return 'EXPIRED';
	} else if (minutesRemaining < 5) {
		return `${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}`;
	} else if (minutesRemaining < 60) {
		return `${minutesRemaining} minutes`;
	} else {
		return `${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''} ${minutesRemaining % 60} min`;
	}
};

/**
 * Check worker token status
 * Uses workerTokenServiceV8 as the single source of truth for worker token storage
 */
export const checkWorkerTokenStatus = async (): Promise<TokenStatusInfo> => {
	try {
		// Use the unified worker token service
		const status = await unifiedWorkerTokenService.getStatus();
		const token = await unifiedWorkerTokenService.getToken();

		if (!status.hasCredentials) {
			return {
				status: 'missing',
				message: 'No worker token credentials. Click "Get Worker Token" to generate one.',
				isValid: false,
			};
		}

		if (!status.hasToken) {
			return {
				status: 'missing',
				message: 'No worker token. Click "Get Worker Token" to generate one.',
				isValid: false,
			};
		}

		if (!status.tokenValid) {
			if (status.tokenExpiresIn !== undefined && status.tokenExpiresIn <= 0) {
				const result: TokenStatusInfo = {
					status: 'expired',
					message: 'Worker token expired. Click "Get Worker Token" to generate a new one.',
					isValid: false,
				};
				if (status.lastFetchedAt) {
					result.expiresAt = status.lastFetchedAt + status.tokenExpiresIn * 1000;
				}
				if (token) {
					result.token = token;
				}
				return result;
			} else {
				const result: TokenStatusInfo = {
					status: 'expiring-soon',
					message: `Worker token expires in ${status.tokenExpiresIn} minutes.`,
					isValid: true,
				};
				if (status.lastFetchedAt) {
					result.expiresAt = status.lastFetchedAt + status.tokenExpiresIn! * 1000;
				}
				if (status.tokenExpiresIn !== undefined) {
					result.minutesRemaining = status.tokenExpiresIn;
				}
				if (token) {
					result.token = token;
				}
				return result;
			}
		}

		// Token is valid
		const minutesRemaining = status.tokenExpiresIn;
		let message = 'Worker token is valid.';
		let tokenStatus: TokenStatus = 'valid';

		if (minutesRemaining !== undefined && minutesRemaining <= 5) {
			message = `Worker token expires in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`;
			tokenStatus = 'expiring-soon';
		}

		const result: TokenStatusInfo = {
			status: tokenStatus,
			message,
			isValid: true,
		};
		if (status.lastFetchedAt && status.tokenExpiresIn) {
			result.expiresAt = status.lastFetchedAt + status.tokenExpiresIn * 1000;
		}
		if (minutesRemaining !== undefined) {
			result.minutesRemaining = minutesRemaining;
		}
		if (token) {
			result.token = token;
		}
		return result;
	} catch (error) {
		console.error('Error checking worker token status:', error);
		return {
			status: 'missing',
			message: 'Error checking worker token status.',
			isValid: false,
		};
	}
};

/**
 * Synchronous check worker token status (for backward compatibility)
 * Uses memory cache only - may be stale but is fast
 */
export const checkWorkerTokenStatusSync = (): TokenStatusInfo => {
	try {
		// Quick synchronous check using localStorage only
		const stored = localStorage.getItem('unified_worker_token');
		if (!stored) {
			return {
				status: 'missing',
				message: 'No worker token data found.',
				isValid: false,
			};
		}

		const data = JSON.parse(stored);
		
		// Handle unified service data structure
		const token = data.token || data.data?.token;
		if (!token) {
			return {
				status: 'missing',
				message: 'No worker token found.',
				isValid: false,
			};
		}

		// Check expiration - handle both old and new data structures
		const now = Date.now();
		const expiresAt = data.expiresAt || data.data?.expiresAt || (data.savedAt || data.data?.savedAt || 0) + 3600 * 1000; // Default 1 hour
		const isExpired = now >= expiresAt;
		const minutesRemaining = Math.max(0, Math.floor((expiresAt - now) / 60000));

		let tokenStatus: TokenStatus = 'valid';
		let message = 'Worker token is valid and ready to use.';

		if (isExpired) {
			tokenStatus = 'expired';
			message = 'Worker token has expired. Please generate a new one.';
		} else if (minutesRemaining < 5) {
			tokenStatus = 'expiring-soon';
			message = `Worker token expires in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`;
		}

		return {
			status: tokenStatus,
			message,
			isValid: !isExpired,
			expiresAt,
			minutesRemaining,
			token: token, // Use the extracted token from either old or new structure
		};
	} catch (error) {
		console.error('Error checking worker token status (sync):', error);
		return {
			status: 'missing',
			message: 'Error checking worker token status.',
			isValid: false,
		};
	}
};

/**
 * Get status color for UI
 */
export const getStatusColor = (status: TokenStatus): string => {
	switch (status) {
		case 'valid':
			return '#10b981'; // Green
		case 'expiring-soon':
			return '#f59e0b'; // Orange
		case 'expired':
			return '#f59e0b'; // Orange/Yellow (not an error, just informational)
		case 'missing':
			return '#ef4444'; // Red
	}
};

/**
 * Get status icon for UI
 */
export const getStatusIcon = (status: TokenStatus): string => {
	switch (status) {
		case 'valid':
			return '✓';
		case 'expiring-soon':
			return '⚠️';
		case 'expired':
		case 'missing':
			return '✗';
	}
};

// ============================================================================
// NEW METHODS - Phase 1 Enhancements (Additive Only, Non-Breaking)
// ============================================================================

/**
 * Check if worker token is expiring soon
 * Returns warning if token expires within threshold
 * 
 * @param thresholdMinutes - Warning threshold in minutes (default: 5)
 * @returns Expiration warning details
 * 
 * @example
 * const warning = await getExpirationWarning(10);
 * if (warning.isExpiringSoon) {
 *   toastV8.warn(warning.message);
 * }
 */
export const getExpirationWarning = async (
	thresholdMinutes: number = 5
): Promise<{
	isExpiringSoon: boolean;
	minutesRemaining?: number;
	message?: string;
	severity: 'info' | 'warning' | 'error';
}> => {
	const status = await checkWorkerTokenStatus();

	if (!status.isValid) {
		return {
			isExpiringSoon: false,
			severity: 'info',
			message: 'No valid worker token',
		};
	}

	if (!status.expiresAt) {
		return {
			isExpiringSoon: false,
			severity: 'info',
		};
	}

	const now = Date.now();
	const expiresAt = status.expiresAt;
	const minutesRemaining = Math.floor((expiresAt - now) / 60000);

	if (minutesRemaining <= 0) {
		return {
			isExpiringSoon: true,
			minutesRemaining: 0,
			message: 'Worker token has expired. Please refresh your token.',
			severity: 'error',
		};
	}

	if (minutesRemaining <= thresholdMinutes) {
		return {
			isExpiringSoon: true,
			minutesRemaining,
			message: `Worker token expires in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}. Consider refreshing soon.`,
			severity: minutesRemaining <= 2 ? 'error' : 'warning',
		};
	}

	return {
		isExpiringSoon: false,
		minutesRemaining,
		severity: 'info',
	};
};

/**
 * Comprehensive health check for worker token
 * Provides detailed status and actionable recommendations
 * 
 * @returns Health check results with issues and recommendations
 * 
 * @example
 * const health = await getHealthCheck();
 * if (!health.healthy) {
 *   health.issues.forEach(issue => console.error(issue));
 *   health.recommendations.forEach(rec => console.log(rec));
 * }
 */
export const getHealthCheck = async (): Promise<{
	healthy: boolean;
	status: TokenStatus;
	issues: string[];
	recommendations: string[];
	details: {
		hasToken: boolean;
		isValid: boolean;
		isExpired: boolean;
		minutesRemaining?: number;
		expiresAt?: number;
	};
}> => {
	const status = await checkWorkerTokenStatus();
	const issues: string[] = [];
	const recommendations: string[] = [];

	// Check if token exists
	if (!status.isValid) {
		issues.push('No worker token available');
		recommendations.push('Generate a worker token to access PingOne APIs');
		recommendations.push('Click "Get Worker Token" button to generate one');
	}

	// Check expiration
	if (status.isValid && status.status === 'expired') {
		issues.push('Worker token has expired');
		recommendations.push('Refresh your worker token immediately');
		recommendations.push('Expired tokens cannot be used for API calls');
	}

	// Check if expiring soon
	const warning = await getExpirationWarning(10);
	if (warning.isExpiringSoon && status.isValid) {
		issues.push(`Token expires in ${warning.minutesRemaining} minutes`);
		recommendations.push('Consider refreshing your token soon to avoid interruption');
	}

	// Check token age (if very old, might want to refresh)
	if (status.expiresAt && status.isValid) {
		const now = Date.now();
		const age = now - (status.expiresAt - (status.minutesRemaining || 0) * 60000);
		const ageHours = Math.floor(age / 3600000);

		if (ageHours > 12) {
			recommendations.push(`Token is ${ageHours} hours old. Consider refreshing for best security.`);
		}
	}

	return {
		healthy: issues.length === 0,
		status: status.status,
		issues,
		recommendations,
		details: {
			hasToken: !!status.token,
			isValid: status.isValid,
			isExpired: status.status === 'expired',
			minutesRemaining: status.minutesRemaining,
			expiresAt: status.expiresAt,
		},
	};
};

export const WorkerTokenStatusServiceV8 = {
	checkWorkerTokenStatus,
	checkWorkerTokenStatusSync,
	formatTimeRemaining,
	getStatusColor,
	getStatusIcon,
	// New methods
	getExpirationWarning,
	getHealthCheck,
};

export default WorkerTokenStatusServiceV8;
