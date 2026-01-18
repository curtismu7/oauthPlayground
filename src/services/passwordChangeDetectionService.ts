/**
 * @file passwordChangeDetectionService.ts
 * @description Service to detect MUST_CHANGE_PASSWORD status from PingOne responses
 * @version 1.0.0
 */

/**
 * Detects if a PingOne response indicates that password change is required
 * Checks multiple locations where PingOne might indicate MUST_CHANGE_PASSWORD:
 * - Error responses (error_description, details, message)
 * - ID token claims (password_state, password_status)
 * - Authorization flow responses (status, passwordChangeRequired)
 */
export class PasswordChangeDetectionService {
	/**
	 * Check if an error response indicates MUST_CHANGE_PASSWORD
	 */
	static isPasswordChangeRequired(errorResponse: {
		error?: string;
		error_description?: string;
		details?: unknown;
		message?: string;
		code?: string;
	}): boolean {
		if (!errorResponse) return false;

		const errorText = JSON.stringify(errorResponse).toLowerCase();
		const indicators = [
			'must_change_password',
			'must change password',
			'password_change_required',
			'password change required',
			'password must be changed',
			'force_password_change',
			'force password change',
		];

		return indicators.some((indicator) => errorText.includes(indicator));
	}

	/**
	 * Extract password change information from error response
	 */
	static extractPasswordChangeInfo(errorResponse: {
		error?: string;
		error_description?: string;
		details?: unknown;
		message?: string;
		code?: string;
		userId?: string;
	}): {
		requiresPasswordChange: boolean;
		userId?: string;
		message?: string;
	} {
		const requiresPasswordChange = PasswordChangeDetectionService.isPasswordChangeRequired(errorResponse);

		return {
			requiresPasswordChange,
			userId: errorResponse.userId,
			message:
				errorResponse.error_description ||
				errorResponse.message ||
				(requiresPasswordChange ? 'Password change is required' : undefined),
		};
	}

	/**
	 * Check ID token for password change indicators
	 */
	static checkIdToken(idToken: string): {
		requiresPasswordChange: boolean;
		passwordState?: string;
	} {
		if (!idToken) {
			return { requiresPasswordChange: false };
		}

		try {
			const parts = idToken.split('.');
			if (parts.length !== 3) {
				return { requiresPasswordChange: false };
			}

			const payload = JSON.parse(atob(parts[1]));
			const passwordState = payload.password_state || payload.password_status || payload.pwd_state;

			return {
				requiresPasswordChange: passwordState === 'MUST_CHANGE_PASSWORD',
				passwordState,
			};
		} catch {
			return { requiresPasswordChange: false };
		}
	}

	/**
	 * Check authorization flow response (pi.flow) for password change indicators
	 */
	static checkAuthorizationResponse(authResponse: {
		status?: string;
		passwordChangeRequired?: boolean;
		password_state?: string;
		error?: string;
		error_description?: string;
	}): {
		requiresPasswordChange: boolean;
		status?: string;
	} {
		if (!authResponse) {
			return { requiresPasswordChange: false };
		}

		const requiresPasswordChange =
			authResponse.passwordChangeRequired === true ||
			authResponse.password_state === 'MUST_CHANGE_PASSWORD' ||
			authResponse.status === 'PASSWORD_CHANGE_REQUIRED' ||
			PasswordChangeDetectionService.isPasswordChangeRequired(authResponse);

		return {
			requiresPasswordChange,
			status: authResponse.status,
		};
	}

	/**
	 * Comprehensive check - combines all detection methods
	 */
	static detectPasswordChangeRequired(data: {
		errorResponse?: {
			error?: string;
			error_description?: string;
			details?: unknown;
			message?: string;
			code?: string;
			userId?: string;
		};
		idToken?: string;
		authorizationResponse?: {
			status?: string;
			passwordChangeRequired?: boolean;
			password_state?: string;
			error?: string;
			error_description?: string;
		};
	}): {
		requiresPasswordChange: boolean;
		userId?: string;
		message?: string;
		passwordState?: string;
		source?: 'error' | 'id_token' | 'authorization';
	} {
		// Check error response first (most common)
		if (data.errorResponse) {
			const errorInfo = PasswordChangeDetectionService.extractPasswordChangeInfo(data.errorResponse);
			if (errorInfo.requiresPasswordChange) {
				return {
					...errorInfo,
					source: 'error',
				};
			}
		}

		// Check ID token
		if (data.idToken) {
			const idTokenInfo = PasswordChangeDetectionService.checkIdToken(data.idToken);
			if (idTokenInfo.requiresPasswordChange) {
				return {
					requiresPasswordChange: true,
					passwordState: idTokenInfo.passwordState,
					message: 'Password change required (detected in ID token)',
					source: 'id_token',
				};
			}
		}

		// Check authorization response
		if (data.authorizationResponse) {
			const authInfo = PasswordChangeDetectionService.checkAuthorizationResponse(data.authorizationResponse);
			if (authInfo.requiresPasswordChange) {
				return {
					requiresPasswordChange: true,
					message: 'Password change required (detected in authorization response)',
					source: 'authorization',
				};
			}
		}

		return { requiresPasswordChange: false };
	}
}
