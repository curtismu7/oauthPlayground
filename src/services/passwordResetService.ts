// src/services/passwordResetService.ts
// Password Reset Service for PingOne Platform API

import { logger } from '../utils/logger';
import { trackedFetch } from '../utils/trackedFetch';

export enum PasswordOperationType {
	RECOVER = 'recover',
	FORCE_CHANGE = 'forceChange',
	CHANGE = 'change',
}

export enum PasswordContentType {
	RECOVER = 'application/vnd.pingidentity.password.recover+json',
	FORCE_CHANGE = 'application/vnd.pingidentity.password.forceChange+json',
	CHANGE = 'application/vnd.pingidentity.password.change+json',
}

export interface PasswordRecoverRequest {
	recoveryCode: string;
	newPassword: string;
}

export interface PasswordForceChangeRequest {
	forceChange: boolean;
}

export interface PasswordChangeRequest {
	oldPassword: string;
	newPassword: string;
}

export interface PasswordOperationResponse {
	success: boolean;
	message?: string;
	transactionId?: string;
	timestamp?: string;
	error?: string;
	errorDescription?: string;
}

export interface SendRecoveryCodeRequest {
	environmentId: string;
	userId: string;
	workerToken: string;
}

export interface SendRecoveryCodeResponse {
	success: boolean;
	message?: string;
	error?: string;
	errorDescription?: string;
}

/**
 * Send recovery code to user (triggers email/SMS per tenant config)
 */
export async function sendRecoveryCode(
	request: SendRecoveryCodeRequest
): Promise<SendRecoveryCodeResponse> {
	try {
		logger.info('[🔐 PASSWORD] Sending recovery code...', {
			environmentId: `${request.environmentId?.substring(0, 20)}...`,
			userId: `${request.userId?.substring(0, 20)}...`,
		});

		const actualPingOneUrl = `/pingone-api/v1/environments/${encodeURIComponent(request.environmentId)}/users/${encodeURIComponent(request.userId)}/password/recovery`;

		const response = await trackedFetch('/api/pingone/password/send-recovery-code', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(request),
			actualPingOneUrl,
		});

		const data = await response.json();

		if (!response.ok) {
			logger.error('PasswordResetService', 'Failed to send recovery code', { data });
			return {
				success: false,
				error: data.error || 'unknown_error',
				errorDescription: data.error_description || data.message || 'Failed to send recovery code',
			};
		}

		logger.info('[🔐 PASSWORD] ✅ Recovery code sent successfully', "Logger info");
		return {
			success: true,
			message: data.message || 'Recovery code sent successfully',
		};
	} catch (error) {
		logger.error('PasswordResetService', 'Error sending recovery code', undefined, error as Error);
		return {
			success: false,
			error: 'network_error',
			errorDescription: error instanceof Error ? error.message : 'Network error occurred',
		};
	}
}

/**
 * Recover password (forgot password flow)
 */
export async function recoverPassword(
	environmentId: string,
	userId: string,
	workerToken: string,
	recoveryCode: string,
	newPassword: string
): Promise<PasswordOperationResponse> {
	try {
		logger.info('[🔐 PASSWORD] Recovering password...', {
			environmentId: `${environmentId?.substring(0, 20)}...`,
			userId: `${userId?.substring(0, 20)}...`,
		});

		const actualPingOneUrl = `/pingone-api/v1/environments/${encodeURIComponent(environmentId)}/users/${encodeURIComponent(userId)}/password`;

		const response = await trackedFetch('/api/pingone/password/recover', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				environmentId,
				userId,
				workerToken,
				recoveryCode,
				newPassword,
			}),
			actualPingOneUrl,
		});

		const data = await response.json();

		if (!response.ok) {
			logger.error('PasswordResetService', 'Password recovery failed', { data });
			return {
				success: false,
				error: data.error || 'unknown_error',
				errorDescription: data.error_description || data.message || 'Password recovery failed',
			};
		}

		logger.info('[🔐 PASSWORD] ✅ Password recovered successfully', "Logger info");
		return {
			success: true,
			message: data.message || 'Password recovered successfully',
			transactionId: data.transactionId,
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		logger.error('PasswordResetService', 'Error recovering password', undefined, error as Error);
		return {
			success: false,
			error: 'network_error',
			errorDescription: error instanceof Error ? error.message : 'Network error occurred',
		};
	}
}

/**
 * Force password change on next sign-on (admin operation)
 */
export async function forcePasswordChange(
	environmentId: string,
	userId: string,
	workerToken: string
): Promise<PasswordOperationResponse> {
	try {
		logger.info('[🔐 PASSWORD] Forcing password change...', {
			environmentId: `${environmentId?.substring(0, 20)}...`,
			userId: `${userId?.substring(0, 20)}...`,
		});

		const actualPingOneUrl = `/pingone-api/v1/environments/${encodeURIComponent(environmentId)}/users/${encodeURIComponent(userId)}/password`;

		const response = await trackedFetch('/api/pingone/password/force-change', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				environmentId,
				userId,
				workerToken,
			}),
			actualPingOneUrl,
		});

		const data = await response.json();

		if (!response.ok) {
			logger.error('PasswordResetService', 'Force password change failed', { data });
			return {
				success: false,
				error: data.error || 'unknown_error',
				errorDescription: data.error_description || data.message || 'Force password change failed',
			};
		}

		logger.info('[🔐 PASSWORD] ✅ Password change forced successfully', "Logger info");
		return {
			success: true,
			message: data.message || 'User will be required to change password on next sign-on',
			transactionId: data.transactionId,
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		logger.error(
			'PasswordResetService',
			'Error forcing password change',
			undefined,
			error as Error
		);
		return {
			success: false,
			error: 'network_error',
			errorDescription: error instanceof Error ? error.message : 'Network error occurred',
		};
	}
}

/**
 * Change password (user knows current password)
 */
export async function changePassword(
	environmentId: string,
	userId: string,
	accessToken: string,
	oldPassword: string,
	newPassword: string
): Promise<PasswordOperationResponse> {
	try {
		logger.info('[🔐 PASSWORD] Changing password...', {
			environmentId: `${environmentId?.substring(0, 20)}...`,
			userId: `${userId?.substring(0, 20)}...`,
		});

		const actualPingOneUrl = `/pingone-api/v1/environments/${encodeURIComponent(environmentId)}/users/${encodeURIComponent(userId)}/password`;

		const response = await trackedFetch('/api/pingone/password/change', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				environmentId,
				userId,
				accessToken,
				oldPassword,
				newPassword,
			}),
			actualPingOneUrl,
		});

		const data = await response.json();

		if (!response.ok) {
			logger.error('PasswordResetService', 'Password change failed', { data });
			return {
				success: false,
				error: data.error || 'unknown_error',
				errorDescription: data.error_description || data.message || 'Password change failed',
			};
		}

		logger.info('[🔐 PASSWORD] ✅ Password changed successfully', "Logger info");
		return {
			success: true,
			message: data.message || 'Password changed successfully',
			transactionId: data.transactionId,
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		logger.error('PasswordResetService', 'Error changing password', undefined, error as Error);
		return {
			success: false,
			error: 'network_error',
			errorDescription: error instanceof Error ? error.message : 'Network error occurred',
		};
	}
}

/**
 * Check password (verify password for a user)
 */
export async function checkPassword(
	environmentId: string,
	userId: string,
	workerToken: string,
	password: string
): Promise<PasswordOperationResponse> {
	try {
		logger.info('[🔐 PASSWORD] Checking password...', {
			environmentId: `${environmentId?.substring(0, 20)}...`,
			userId: `${userId?.substring(0, 20)}...`,
		});

		const actualPingOneUrl = `/pingone-api/v1/environments/${encodeURIComponent(environmentId)}/users/${encodeURIComponent(userId)}/password/check`;

		const response = await trackedFetch('/api/pingone/password/check', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				environmentId,
				userId,
				workerToken,
				password,
			}),
			actualPingOneUrl,
		});

		const data = await response.json();

		if (!response.ok) {
			logger.error('PasswordResetService', 'Password check failed', { data });
			return {
				success: false,
				error: data.error || 'unknown_error',
				errorDescription: data.error_description || data.message || 'Password check failed',
			};
		}

		logger.info('[🔐 PASSWORD] ✅ Password check successful', "Logger info");
		return {
			success: true,
			message: data.message || 'Password check successful',
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		logger.error('PasswordResetService', 'Error checking password', undefined, error as Error);
		return {
			success: false,
			error: 'network_error',
			errorDescription: error instanceof Error ? error.message : 'Network error occurred',
		};
	}
}

/**
 * Unlock password (unlock a locked user account)
 */
export async function unlockPassword(
	environmentId: string,
	userId: string,
	workerToken: string
): Promise<PasswordOperationResponse> {
	try {
		logger.info('[🔐 PASSWORD] Unlocking password...', {
			environmentId: `${environmentId?.substring(0, 20)}...`,
			userId: `${userId?.substring(0, 20)}...`,
		});

		const actualPingOneUrl = `/pingone-api/v1/environments/${encodeURIComponent(environmentId)}/users/${encodeURIComponent(userId)}/password/unlock`;

		const response = await trackedFetch('/api/pingone/password/unlock', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				environmentId,
				userId,
				workerToken,
			}),
			actualPingOneUrl,
		});

		const data = await response.json();

		if (!response.ok) {
			logger.error('PasswordResetService', 'Password unlock failed', { data });
			return {
				success: false,
				error: data.error || 'unknown_error',
				errorDescription: data.error_description || data.message || 'Password unlock failed',
			};
		}

		logger.info('[🔐 PASSWORD] ✅ Password unlocked successfully', "Logger info");
		return {
			success: true,
			message: data.message || 'Password unlocked successfully',
			transactionId: data.transactionId,
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		logger.error('PasswordResetService', 'Error unlocking password', undefined, error as Error);
		return {
			success: false,
			error: 'network_error',
			errorDescription: error instanceof Error ? error.message : 'Network error occurred',
		};
	}
}

/**
 * Read password state (get password status information)
 */
export async function readPasswordState(
	environmentId: string,
	userId: string,
	workerToken: string
): Promise<{
	success: boolean;
	passwordState?: Record<string, unknown>;
	error?: string;
	errorDescription?: string;
}> {
	try {
		logger.info('[🔐 PASSWORD] Reading password state...', {
			environmentId: `${environmentId?.substring(0, 20)}...`,
			userId: `${userId?.substring(0, 20)}...`,
		});

		const actualPingOneUrl = `/pingone-api/v1/environments/${encodeURIComponent(environmentId)}/users/${encodeURIComponent(userId)}/password`;

		const response = await trackedFetch(
			`/api/pingone/password/state?environmentId=${encodeURIComponent(environmentId)}&userId=${encodeURIComponent(userId)}&workerToken=${encodeURIComponent(workerToken)}`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
				actualPingOneUrl,
			}
		);

		const data = await response.json();

		if (!response.ok) {
			logger.error('PasswordResetService', 'Failed to read password state', { data });
			return {
				success: false,
				error: data.error || 'unknown_error',
				errorDescription: data.error_description || data.message || 'Failed to read password state',
			};
		}

		logger.info('[🔐 PASSWORD] ✅ Password state read successfully', "Logger info");
		return {
			success: true,
			passwordState: data.passwordState,
		};
	} catch (error) {
		logger.error('PasswordResetService', 'Error reading password state', undefined, error as Error);
		return {
			success: false,
			error: 'network_error',
			errorDescription: error instanceof Error ? error.message : 'Network error occurred',
		};
	}
}

/**
 * Set password (admin operation - set password directly)
 */
export async function setPasswordAdmin(
	environmentId: string,
	userId: string,
	workerToken: string,
	newPassword: string,
	options?: { forceChange?: boolean; bypassPasswordPolicy?: boolean }
): Promise<PasswordOperationResponse> {
	try {
		logger.info('[🔐 PASSWORD] Setting password (admin)...', {
			environmentId: `${environmentId?.substring(0, 20)}...`,
			userId: `${userId?.substring(0, 20)}...`,
		});

		const actualPingOneUrl = `/pingone-api/v1/environments/${encodeURIComponent(environmentId)}/users/${encodeURIComponent(userId)}/password`;

		const response = await trackedFetch('/api/pingone/password/admin-set', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				environmentId,
				userId,
				workerToken,
				newPassword,
				forceChange: options?.forceChange || false,
				bypassPasswordPolicy: options?.bypassPasswordPolicy || false,
			}),
			actualPingOneUrl,
		});

		const data = await response.json();

		if (!response.ok) {
			logger.error('PasswordResetService', 'Admin password set failed', { data });
			return {
				success: false,
				error: data.error || 'unknown_error',
				errorDescription: data.error_description || data.message || 'Admin password set failed',
			};
		}

		logger.info('[🔐 PASSWORD] ✅ Password set successfully (admin)');
		return {
			success: true,
			message: data.message || 'Password set successfully',
			transactionId: data.transactionId,
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		logger.error(
			'PasswordResetService',
			'Error setting password (admin)',
			undefined,
			error as Error
		);
		return {
			success: false,
			error: 'network_error',
			errorDescription: error instanceof Error ? error.message : 'Network error occurred',
		};
	}
}

/**
 * Set password (general set operation)
 */
export async function setPassword(
	environmentId: string,
	userId: string,
	workerToken: string,
	newPassword: string,
	options?: { forceChange?: boolean; bypassPasswordPolicy?: boolean }
): Promise<PasswordOperationResponse> {
	try {
		logger.info('[🔐 PASSWORD] Setting password...', {
			environmentId: `${environmentId?.substring(0, 20)}...`,
			userId: `${userId?.substring(0, 20)}...`,
		});

		const actualPingOneUrl = `/pingone-api/v1/environments/${encodeURIComponent(environmentId)}/users/${encodeURIComponent(userId)}/password`;

		const response = await trackedFetch('/api/pingone/password/set', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				environmentId,
				userId,
				workerToken,
				newPassword,
				forceChange: options?.forceChange || false,
				bypassPasswordPolicy: options?.bypassPasswordPolicy || false,
			}),
			actualPingOneUrl,
		});

		const data = await response.json();

		if (!response.ok) {
			logger.error('PasswordResetService', 'Password set failed', { data });
			return {
				success: false,
				error: data.error || 'unknown_error',
				errorDescription: data.error_description || data.message || 'Password set failed',
			};
		}

		logger.info('[🔐 PASSWORD] ✅ Password set successfully', "Logger info");
		return {
			success: true,
			message: data.message || 'Password set successfully',
			transactionId: data.transactionId,
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		logger.error('PasswordResetService', 'Error setting password', undefined, error as Error);
		return {
			success: false,
			error: 'network_error',
			errorDescription: error instanceof Error ? error.message : 'Network error occurred',
		};
	}
}

/**
 * Set password value (set password with value field)
 */
export async function setPasswordValue(
	environmentId: string,
	userId: string,
	workerToken: string,
	passwordValue: string,
	options?: { forceChange?: boolean; bypassPasswordPolicy?: boolean }
): Promise<PasswordOperationResponse> {
	try {
		logger.info('[🔐 PASSWORD] Setting password value...', {
			environmentId: `${environmentId?.substring(0, 20)}...`,
			userId: `${userId?.substring(0, 20)}...`,
		});

		const actualPingOneUrl = `/pingone-api/v1/environments/${encodeURIComponent(environmentId)}/users/${encodeURIComponent(userId)}/password`;

		const response = await trackedFetch('/api/pingone/password/set-value', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				environmentId,
				userId,
				workerToken,
				passwordValue,
				forceChange: options?.forceChange || false,
				bypassPasswordPolicy: options?.bypassPasswordPolicy || false,
			}),
			actualPingOneUrl,
		});

		const data = await response.json();

		if (!response.ok) {
			logger.error('PasswordResetService', 'Password value set failed', { data });
			return {
				success: false,
				error: data.error || 'unknown_error',
				errorDescription: data.error_description || data.message || 'Password value set failed',
			};
		}

		logger.info('[🔐 PASSWORD] ✅ Password value set successfully', "Logger info");
		return {
			success: true,
			message: data.message || 'Password value set successfully',
			transactionId: data.transactionId,
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		logger.error('PasswordResetService', 'Error setting password value', undefined, error as Error);
		return {
			success: false,
			error: 'network_error',
			errorDescription: error instanceof Error ? error.message : 'Network error occurred',
		};
	}
}

/**
 * Set password via LDAP Gateway
 */
export async function setPasswordLdapGateway(
	environmentId: string,
	userId: string,
	workerToken: string,
	newPassword: string,
	ldapGatewayId?: string,
	options?: { forceChange?: boolean; bypassPasswordPolicy?: boolean }
): Promise<PasswordOperationResponse> {
	try {
		logger.info('[🔐 PASSWORD] Setting password via LDAP Gateway...', {
			environmentId: `${environmentId?.substring(0, 20)}...`,
			userId: `${userId?.substring(0, 20)}...`,
		});

		const actualPingOneUrl = `/pingone-api/v1/environments/${encodeURIComponent(environmentId)}/users/${encodeURIComponent(userId)}/password`;

		const response = await trackedFetch('/api/pingone/password/ldap-gateway', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				environmentId,
				userId,
				workerToken,
				newPassword,
				ldapGatewayId: ldapGatewayId || undefined,
				forceChange: options?.forceChange || false,
				bypassPasswordPolicy: options?.bypassPasswordPolicy || false,
			}),
			actualPingOneUrl,
		});

		const data = await response.json();

		if (!response.ok) {
			logger.error('PasswordResetService', 'LDAP Gateway password set failed', { data });
			return {
				success: false,
				error: data.error || 'unknown_error',
				errorDescription:
					data.error_description || data.message || 'LDAP Gateway password set failed',
			};
		}

		logger.info('[🔐 PASSWORD] ✅ Password set successfully via LDAP Gateway', "Logger info");
		return {
			success: true,
			message: data.message || 'Password set successfully via LDAP Gateway',
			transactionId: data.transactionId,
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		logger.error(
			'PasswordResetService',
			'Error setting password via LDAP Gateway',
			undefined,
			error as Error
		);
		return {
			success: false,
			error: 'network_error',
			errorDescription: error instanceof Error ? error.message : 'Network error occurred',
		};
	}
}
