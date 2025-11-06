// src/services/passwordResetService.ts
// Password Reset Service for PingOne Platform API

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
		console.log('[🔐 PASSWORD] Sending recovery code...', {
			environmentId: request.environmentId?.substring(0, 20) + '...',
			userId: request.userId?.substring(0, 20) + '...',
		});

		const response = await trackedFetch('/api/pingone/password/send-recovery-code', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(request),
		});

		const data = await response.json();

		if (!response.ok) {
			console.error('[🔐 PASSWORD] Failed to send recovery code:', data);
			return {
				success: false,
				error: data.error || 'unknown_error',
				errorDescription: data.error_description || data.message || 'Failed to send recovery code',
			};
		}

		console.log('[🔐 PASSWORD] ✅ Recovery code sent successfully');
		return {
			success: true,
			message: data.message || 'Recovery code sent successfully',
		};
	} catch (error) {
		console.error('[🔐 PASSWORD] Error sending recovery code:', error);
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
		console.log('[🔐 PASSWORD] Recovering password...', {
			environmentId: environmentId?.substring(0, 20) + '...',
			userId: userId?.substring(0, 20) + '...',
		});

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
		});

		const data = await response.json();

		if (!response.ok) {
			console.error('[🔐 PASSWORD] Password recovery failed:', data);
			return {
				success: false,
				error: data.error || 'unknown_error',
				errorDescription: data.error_description || data.message || 'Password recovery failed',
			};
		}

		console.log('[🔐 PASSWORD] ✅ Password recovered successfully');
		return {
			success: true,
			message: data.message || 'Password recovered successfully',
			transactionId: data.transactionId,
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error('[🔐 PASSWORD] Error recovering password:', error);
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
		console.log('[🔐 PASSWORD] Forcing password change...', {
			environmentId: environmentId?.substring(0, 20) + '...',
			userId: userId?.substring(0, 20) + '...',
		});

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
		});

		const data = await response.json();

		if (!response.ok) {
			console.error('[🔐 PASSWORD] Force password change failed:', data);
			return {
				success: false,
				error: data.error || 'unknown_error',
				errorDescription: data.error_description || data.message || 'Force password change failed',
			};
		}

		console.log('[🔐 PASSWORD] ✅ Password change forced successfully');
		return {
			success: true,
			message: data.message || 'User will be required to change password on next sign-on',
			transactionId: data.transactionId,
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error('[🔐 PASSWORD] Error forcing password change:', error);
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
		console.log('[🔐 PASSWORD] Changing password...', {
			environmentId: environmentId?.substring(0, 20) + '...',
			userId: userId?.substring(0, 20) + '...',
		});

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
		});

		const data = await response.json();

		if (!response.ok) {
			console.error('[🔐 PASSWORD] Password change failed:', data);
			return {
				success: false,
				error: data.error || 'unknown_error',
				errorDescription: data.error_description || data.message || 'Password change failed',
			};
		}

		console.log('[🔐 PASSWORD] ✅ Password changed successfully');
		return {
			success: true,
			message: data.message || 'Password changed successfully',
			transactionId: data.transactionId,
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error('[🔐 PASSWORD] Error changing password:', error);
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
		console.log('[🔐 PASSWORD] Checking password...', {
			environmentId: environmentId?.substring(0, 20) + '...',
			userId: userId?.substring(0, 20) + '...',
		});

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
		});

		const data = await response.json();

		if (!response.ok) {
			console.error('[🔐 PASSWORD] Password check failed:', data);
			return {
				success: false,
				error: data.error || 'unknown_error',
				errorDescription: data.error_description || data.message || 'Password check failed',
			};
		}

		console.log('[🔐 PASSWORD] ✅ Password check successful');
		return {
			success: true,
			message: data.message || 'Password check successful',
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error('[🔐 PASSWORD] Error checking password:', error);
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
		console.log('[🔐 PASSWORD] Unlocking password...', {
			environmentId: environmentId?.substring(0, 20) + '...',
			userId: userId?.substring(0, 20) + '...',
		});

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
		});

		const data = await response.json();

		if (!response.ok) {
			console.error('[🔐 PASSWORD] Password unlock failed:', data);
			return {
				success: false,
				error: data.error || 'unknown_error',
				errorDescription: data.error_description || data.message || 'Password unlock failed',
			};
		}

		console.log('[🔐 PASSWORD] ✅ Password unlocked successfully');
		return {
			success: true,
			message: data.message || 'Password unlocked successfully',
			transactionId: data.transactionId,
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error('[🔐 PASSWORD] Error unlocking password:', error);
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
): Promise<{ success: boolean; passwordState?: any; error?: string; errorDescription?: string }> {
	try {
		console.log('[🔐 PASSWORD] Reading password state...', {
			environmentId: environmentId?.substring(0, 20) + '...',
			userId: userId?.substring(0, 20) + '...',
		});

		const response = await trackedFetch(
			`/api/pingone/password/state?environmentId=${encodeURIComponent(environmentId)}&userId=${encodeURIComponent(userId)}&workerToken=${encodeURIComponent(workerToken)}`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);

		const data = await response.json();

		if (!response.ok) {
			console.error('[🔐 PASSWORD] Failed to read password state:', data);
			return {
				success: false,
				error: data.error || 'unknown_error',
				errorDescription: data.error_description || data.message || 'Failed to read password state',
			};
		}

		console.log('[🔐 PASSWORD] ✅ Password state read successfully');
		return {
			success: true,
			passwordState: data.passwordState,
		};
	} catch (error) {
		console.error('[🔐 PASSWORD] Error reading password state:', error);
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
		console.log('[🔐 PASSWORD] Setting password (admin)...', {
			environmentId: environmentId?.substring(0, 20) + '...',
			userId: userId?.substring(0, 20) + '...',
		});

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
		});

		const data = await response.json();

		if (!response.ok) {
			console.error('[🔐 PASSWORD] Admin password set failed:', data);
			return {
				success: false,
				error: data.error || 'unknown_error',
				errorDescription: data.error_description || data.message || 'Admin password set failed',
			};
		}

		console.log('[🔐 PASSWORD] ✅ Password set successfully (admin)');
		return {
			success: true,
			message: data.message || 'Password set successfully',
			transactionId: data.transactionId,
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error('[🔐 PASSWORD] Error setting password (admin):', error);
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
		console.log('[🔐 PASSWORD] Setting password...', {
			environmentId: environmentId?.substring(0, 20) + '...',
			userId: userId?.substring(0, 20) + '...',
		});

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
		});

		const data = await response.json();

		if (!response.ok) {
			console.error('[🔐 PASSWORD] Password set failed:', data);
			return {
				success: false,
				error: data.error || 'unknown_error',
				errorDescription: data.error_description || data.message || 'Password set failed',
			};
		}

		console.log('[🔐 PASSWORD] ✅ Password set successfully');
		return {
			success: true,
			message: data.message || 'Password set successfully',
			transactionId: data.transactionId,
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error('[🔐 PASSWORD] Error setting password:', error);
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
		console.log('[🔐 PASSWORD] Setting password value...', {
			environmentId: environmentId?.substring(0, 20) + '...',
			userId: userId?.substring(0, 20) + '...',
		});

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
		});

		const data = await response.json();

		if (!response.ok) {
			console.error('[🔐 PASSWORD] Password value set failed:', data);
			return {
				success: false,
				error: data.error || 'unknown_error',
				errorDescription: data.error_description || data.message || 'Password value set failed',
			};
		}

		console.log('[🔐 PASSWORD] ✅ Password value set successfully');
		return {
			success: true,
			message: data.message || 'Password value set successfully',
			transactionId: data.transactionId,
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error('[🔐 PASSWORD] Error setting password value:', error);
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
		console.log('[🔐 PASSWORD] Setting password via LDAP Gateway...', {
			environmentId: environmentId?.substring(0, 20) + '...',
			userId: userId?.substring(0, 20) + '...',
		});

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
		});

		const data = await response.json();

		if (!response.ok) {
			console.error('[🔐 PASSWORD] LDAP Gateway password set failed:', data);
			return {
				success: false,
				error: data.error || 'unknown_error',
				errorDescription: data.error_description || data.message || 'LDAP Gateway password set failed',
			};
		}

		console.log('[🔐 PASSWORD] ✅ Password set successfully via LDAP Gateway');
		return {
			success: true,
			message: data.message || 'Password set successfully via LDAP Gateway',
			transactionId: data.transactionId,
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error('[🔐 PASSWORD] Error setting password via LDAP Gateway:', error);
		return {
			success: false,
			error: 'network_error',
			errorDescription: error instanceof Error ? error.message : 'Network error occurred',
		};
	}
}

