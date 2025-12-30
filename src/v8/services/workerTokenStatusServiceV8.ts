/**
 * @file workerTokenStatusServiceV8.ts
 * @module v8/services
 * @description Worker token status checking and formatting for V8
 * @version 8.0.0
 * @since 2024-11-16
 */

import { workerTokenServiceV8 } from './workerTokenServiceV8';

const _MODULE_TAG = '[🔑 WORKER-TOKEN-STATUS-V8]';

export type TokenStatus = 'valid' | 'expiring-soon' | 'expired' | 'missing';

export interface TokenStatusInfo {
	status: TokenStatus;
	message: string;
	isValid: boolean;
	expiresAt?: number;
	minutesRemaining?: number;
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
export const checkWorkerTokenStatus = (
	token?: string | null,
	expiresAt?: number | null
): TokenStatusInfo => {
	// Get token from parameter or from workerTokenServiceV8 (global storage)
	let resolvedToken = token ?? '';
	let resolvedExpiry = typeof expiresAt === 'number' ? expiresAt : undefined;

	// If token not provided, get from global storage (sync version for backwards compatibility)
	if (!token) {
		// Use workerTokenServiceV8 sync method
		const credentials = workerTokenServiceV8.loadCredentialsSync();
		if (credentials) {
			// Try to get token from browser storage (service stores it there)
			try {
				const stored = localStorage.getItem('v8:worker_token');
				if (stored) {
					const data = JSON.parse(stored) as { token?: string };
					if (data.token) {
						resolvedToken = data.token;
					}
				}
			} catch {
				// Ignore errors
			}
		}
	}

	// If expiry not provided, get from global storage
	if (typeof expiresAt !== 'number') {
		// Read from global service storage
		try {
			const stored = localStorage.getItem('v8:worker_token');
			if (stored) {
				const data = JSON.parse(stored) as { expiresAt?: number };
				if (data.expiresAt) {
					resolvedExpiry = data.expiresAt;
				}
			}
		} catch {
			// Ignore errors
		}
	}

	// No token
	if (!resolvedToken) {
		return {
			status: 'missing',
			message: 'No worker token. Click "Add Token" to generate one.',
			isValid: false,
		};
	}

	// Token exists but no expiry
	if (!resolvedExpiry) {
		return {
			status: 'valid',
			message: 'Worker token present (expiry unknown)',
			isValid: true,
		};
	}

	// Check if expired
	const now = Date.now();
	if (resolvedExpiry <= now) {
		return {
			status: 'expired',
			message:
				'Worker token expired. A valid worker token is required for MFA device registration and management operations.',
			isValid: false,
			expiresAt: resolvedExpiry,
		};
	}

	// Calculate time remaining
	const minutesRemaining = Math.floor((resolvedExpiry - now) / 60000);
	const timeLabel = formatTimeRemaining(resolvedExpiry);

	// Expiring soon (within 15 minutes)
	if (minutesRemaining <= 15) {
		return {
			status: 'expiring-soon',
			message: `Worker token expires in ${timeLabel}`,
			isValid: true,
			expiresAt: resolvedExpiry,
			minutesRemaining,
		};
	}

	// Valid
	return {
		status: 'valid',
		message: `Worker token valid (${timeLabel} remaining)`,
		isValid: true,
		expiresAt: resolvedExpiry,
		minutesRemaining,
	};
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
