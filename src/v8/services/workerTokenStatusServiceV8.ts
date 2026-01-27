/**
 * @file workerTokenStatusServiceV8.ts
 * @module v8/services
 * @description Worker token status checking and formatting for V8
 * @version 8.0.0
 * @since 2024-11-16
 */

import { unifiedWorkerTokenServiceV2 } from '../../services/unifiedWorkerTokenServiceV2';

const _MODULE_TAG = '[🔑 WORKER-TOKEN-STATUS-V8]';

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
	if (process.env.NODE_ENV === 'development') {
		console.log(`${_MODULE_TAG} 🔍 Checking worker token status using unified service V2`);
	}

	try {
		// Use the new unified worker token service V2
		const status = await unifiedWorkerTokenServiceV2.getStatus();
		const token = await unifiedWorkerTokenServiceV2.getToken();

		if (process.env.NODE_ENV === 'development') {
			console.log(`${_MODULE_TAG} 🔍 Unified service status:`, status);
			console.log(`${_MODULE_TAG} 🔍 Token available:`, !!token);
		}

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
		console.error(`${_MODULE_TAG} ❌ Error checking worker token status:`, error);
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

export const WorkerTokenStatusServiceV8 = {
	checkWorkerTokenStatus,
	formatTimeRemaining,
	getStatusColor,
	getStatusIcon,
};

export default WorkerTokenStatusServiceV8;
