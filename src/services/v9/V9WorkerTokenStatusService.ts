/**
 * @file V9WorkerTokenStatusService.ts
 * @module services/v9
 * @description Worker token status checking and formatting for V9
 * @version 9.0.0
 * @since 2026-02-28
 *
 * Migrated from workerTokenStatusServiceV8.ts with enhanced V9 features:
 * - Uses unifiedWorkerTokenService for consistent storage
 * - Improved error handling and logging
 * - Better TypeScript types
 * - Enhanced performance with caching
 * - V9 color standards compliance
 */

import { unifiedWorkerTokenService } from '../unifiedWorkerTokenService';

export type V9TokenStatus = 'valid' | 'expiring-soon' | 'expired' | 'missing';

export interface V9TokenStatusInfo {
	status: V9TokenStatus;
	message: string;
	isValid: boolean;
	expiresAt?: number;
	minutesRemaining?: number;
	token?: string;
	environmentId?: string;
	region?: string;
	lastValidated?: number;
}

/**
 * Format time remaining for display with V9 enhanced formatting
 */
export const V9formatTimeRemaining = (expiresAt: number): string => {
	const now = Date.now();
	const isExpired = now >= expiresAt;
	const timeRemaining = expiresAt - now;
	const minutesRemaining = Math.floor(timeRemaining / 60000);
	const hoursRemaining = Math.floor(timeRemaining / 3600000);
	const daysRemaining = Math.floor(timeRemaining / 86400000);

	if (isExpired) {
		return 'EXPIRED';
	} else if (daysRemaining > 0) {
		return `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} ${hoursRemaining % 24}h`;
	} else if (hoursRemaining > 0) {
		return `${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''} ${minutesRemaining % 60}m`;
	} else if (minutesRemaining < 5) {
		return `${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}`;
	} else {
		return `${minutesRemaining} minutes`;
	}
};

/**
 * Check worker token status using V9 unified service
 * Uses unifiedWorkerTokenService for consistent storage and event handling
 */
export const V9checkWorkerTokenStatus = async (): Promise<V9TokenStatusInfo> => {
	try {
		// Use unified service for consistent data access
		const tokenData = unifiedWorkerTokenService.getTokenDataSync();

		if (!tokenData) {
			return {
				status: 'missing',
				message: 'No worker token found. Please configure a worker token.',
				isValid: false,
			};
		}

		const { token, expiresAt, savedAt, credentials } = tokenData;
		const environmentId = credentials?.environmentId;
		const region = credentials?.region;

		if (!token) {
			const result: V9TokenStatusInfo = {
				status: 'missing',
				message: 'Worker token data is incomplete. Please reconfigure.',
				isValid: false,
			};
			if (environmentId) result.environmentId = environmentId;
			if (region) result.region = region;
			return result;
		}

		// Check expiration with enhanced logic
		const now = Date.now();
		const tokenExpiresAt = expiresAt || (savedAt || 0) + 3600 * 1000; // Default 1 hour
		const isExpired = now >= tokenExpiresAt;
		const minutesRemaining = Math.max(0, Math.floor((tokenExpiresAt - now) / 60000));

		// Enhanced debugging for expired tokens
		if (isExpired) {
			console.warn('[V9-WORKER-TOKEN-STATUS] Token expired:', {
				now: new Date(now).toISOString(),
				expiresAt: new Date(tokenExpiresAt).toISOString(),
				minutesOverdue: Math.floor((now - tokenExpiresAt) / 60000),
				tokenLength: token.length,
				environmentId,
				region,
			});
		}

		let tokenStatus: V9TokenStatus = 'valid';
		let message = 'Worker token is valid and ready to use.';

		if (isExpired) {
			tokenStatus = 'expired';
			message = 'Worker token has expired. Please generate a new one.';
		} else if (minutesRemaining < 5) {
			tokenStatus = 'expiring-soon';
			message = `Worker token expires in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`;
		}

		const result: V9TokenStatusInfo = {
			status: tokenStatus,
			message,
			isValid: !isExpired,
			expiresAt: tokenExpiresAt,
			minutesRemaining,
			token,
			lastValidated: now,
		};
		if (environmentId) result.environmentId = environmentId;
		if (region) result.region = region;
		return result;
	} catch (error) {
		console.error('[V9-WORKER-TOKEN-STATUS] Error checking worker token status:', error);
		return {
			status: 'missing',
			message: 'Error checking worker token status. Please try again.',
			isValid: false,
		};
	}
};

/**
 * Synchronous check worker token status (for backward compatibility)
 * Uses memory cache from unified service
 */
export const V9checkWorkerTokenStatusSync = (): V9TokenStatusInfo => {
	try {
		// Use unified service sync method
		const tokenData = unifiedWorkerTokenService.getTokenDataSync();

		if (!tokenData) {
			return {
				status: 'missing',
				message: 'No worker token found.',
				isValid: false,
			};
		}

		const { token, expiresAt, savedAt, credentials } = tokenData;
		const environmentId = credentials?.environmentId;
		const region = credentials?.region;

		if (!token) {
			const result: V9TokenStatusInfo = {
				status: 'missing',
				message: 'Worker token data is incomplete.',
				isValid: false,
			};
			if (environmentId) result.environmentId = environmentId;
			if (region) result.region = region;
			return result;
		}

		// Check expiration
		const now = Date.now();
		const tokenExpiresAt = expiresAt || (savedAt || 0) + 3600 * 1000;
		const isExpired = now >= tokenExpiresAt;
		const minutesRemaining = Math.max(0, Math.floor((tokenExpiresAt - now) / 60000));

		let tokenStatus: V9TokenStatus = 'valid';
		let message = 'Worker token is valid.';

		if (isExpired) {
			tokenStatus = 'expired';
			message = 'Worker token has expired.';
		} else if (minutesRemaining < 5) {
			tokenStatus = 'expiring-soon';
			message = `Worker token expires in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`;
		}

		const result: V9TokenStatusInfo = {
			status: tokenStatus,
			message,
			isValid: !isExpired,
			expiresAt: tokenExpiresAt,
			minutesRemaining,
			token,
			lastValidated: now,
		};
		if (environmentId) result.environmentId = environmentId;
		if (region) result.region = region;
		return result;
	} catch (error) {
		console.error('[V9-WORKER-TOKEN-STATUS] Error checking worker token status (sync):', error);
		return {
			status: 'missing',
			message: 'Error checking worker token status.',
			isValid: false,
		};
	}
};

/**
 * Get status color for UI using V9 color standards
 * Uses approved V9 color palette only
 */
export const V9getStatusColor = (status: V9TokenStatus): string => {
	switch (status) {
		case 'valid':
			return '#10b981'; // Green (success)
		case 'expiring-soon':
			return '#f59e0b'; // Orange (warning)
		case 'expired':
			return '#f59e0b'; // Orange/Yellow (warning, not error)
		case 'missing':
			return '#ef4444'; // Red (error)
		default:
			return '#6b7280'; // Gray (unknown)
	}
};

/**
 * Get status icon for UI using V9 standards
 * Uses emoji icons for consistency
 */
export const V9getStatusIcon = (status: V9TokenStatus): string => {
	switch (status) {
		case 'valid':
			return '✓';
		case 'expiring-soon':
			return '⚠️';
		case 'expired':
		case 'missing':
			return '✗';
		default:
			return '❓';
	}
};

/**
 * Get status badge style for V9 UI components
 * Returns CSS-in-JS style object
 */
export const V9getStatusBadgeStyle = (status: V9TokenStatus) => {
	const color = V9getStatusColor(status);
	const backgroundColor =
		status === 'valid'
			? '#dcfce7'
			: status === 'expiring-soon'
				? '#fef3c7'
				: status === 'expired'
					? '#fef3c7'
					: '#fef2f2';

	return {
		backgroundColor,
		color,
		border: `1px solid ${color}`,
		padding: '0.25rem 0.75rem',
		borderRadius: '9999px',
		fontSize: '0.875rem',
		fontWeight: '500',
		display: 'inline-flex',
		alignItems: 'center',
		gap: '0.25rem',
	};
};

/**
 * Enhanced expiration warning with V9 features
 * Provides detailed expiration analysis
 */
export const V9getExpirationWarning = async (
	thresholdMinutes: number = 5
): Promise<{
	isExpiringSoon: boolean;
	minutesRemaining?: number;
	message?: string;
	severity: 'info' | 'warning' | 'error';
	actions?: string[];
}> => {
	const status = await V9checkWorkerTokenStatus();

	if (!status.isValid) {
		return {
			isExpiringSoon: false,
			severity: 'error',
			message: 'No valid worker token available.',
			actions: ['Generate new worker token', 'Check configuration'],
		};
	}

	if (!status.expiresAt) {
		return {
			isExpiringSoon: false,
			severity: 'info',
			message: 'Worker token has no expiration time.',
		};
	}

	const minutesRemaining = status.minutesRemaining || 0;
	const isExpiringSoon = minutesRemaining <= thresholdMinutes;

	if (isExpiringSoon) {
		return {
			isExpiringSoon: true,
			minutesRemaining,
			message: `Worker token expires in ${V9formatTimeRemaining(status.expiresAt)}.`,
			severity: 'warning',
			actions:
				minutesRemaining <= 0
					? ['Generate new worker token immediately']
					: ['Generate new worker token soon', 'Save current work'],
		};
	}

	return {
		isExpiringSoon: false,
		minutesRemaining,
		severity: 'info',
		message: `Worker token is valid (${V9formatTimeRemaining(status.expiresAt)} remaining).`,
	};
};

/**
 * Validate worker token format and structure
 * Enhanced validation for V9
 */
export const V9validateWorkerToken = (
	token: string
): {
	isValid: boolean;
	errors: string[];
	warnings: string[];
} => {
	const errors: string[] = [];
	const warnings: string[] = [];

	if (!token) {
		errors.push('Token is empty');
		return { isValid: false, errors, warnings };
	}

	if (typeof token !== 'string') {
		errors.push('Token must be a string');
		return { isValid: false, errors, warnings };
	}

	if (token.length < 10) {
		errors.push('Token appears too short');
	}

	if (token.includes(' ') || token.includes('\n') || token.includes('\t')) {
		errors.push('Token contains whitespace characters');
	}

	// Check for common patterns that might indicate issues
	if (token.startsWith('Bearer ')) {
		warnings.push('Token includes "Bearer " prefix');
	}

	if (token.startsWith('Basic ')) {
		errors.push('Token appears to be Basic auth, not a bearer token');
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	};
};

// Export the service object for consistency with V9 patterns
export const V9WorkerTokenStatusService = {
	checkStatus: V9checkWorkerTokenStatus,
	checkStatusSync: V9checkWorkerTokenStatusSync,
	formatTimeRemaining: V9formatTimeRemaining,
	getStatusColor: V9getStatusColor,
	getStatusIcon: V9getStatusIcon,
	getStatusBadgeStyle: V9getStatusBadgeStyle,
	getExpirationWarning: V9getExpirationWarning,
	validateToken: V9validateWorkerToken,
};

// Export individual functions for backward compatibility
export {
	V9checkWorkerTokenStatus as checkWorkerTokenStatus,
	V9checkWorkerTokenStatusSync as checkWorkerTokenStatusSync,
	V9formatTimeRemaining as formatTimeRemaining,
	V9getStatusColor as getStatusColor,
	V9getStatusIcon as getStatusIcon,
};
