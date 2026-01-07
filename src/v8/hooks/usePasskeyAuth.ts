/**
 * @file usePasskeyAuth.ts
 * @module v8/hooks
 * @description React hook for username-less passkey authentication
 * @version 8.0.0
 * @since 2025-01-XX
 *
 * This hook provides a simple interface for username-less passkey authentication:
 * - Attempts authentication first (discoverable credentials)
 * - Falls back to registration if no passkey found
 * - Handles loading states and errors
 */

import { useCallback, useState } from 'react';
import {
	PasskeyAuthOptions,
	PasskeyRegistrationOptions,
	PasskeyServiceV8,
} from '@/v8/services/passkeyServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

export interface UsePasskeyAuthResult {
	isLoading: boolean;
	error: string | null;
	authenticate: (options: PasskeyAuthOptions) => Promise<{
		success: boolean;
		userId?: string;
		username?: string;
		requiresRegistration?: boolean;
	}>;
	register: (
		options: PasskeyRegistrationOptions
	) => Promise<{ success: boolean; deviceId?: string; userId?: string }>;
	reset: () => void;
}

/**
 * React hook for username-less passkey authentication
 *
 * @example
 * const { isLoading, error, authenticate, register } = usePasskeyAuth();
 *
 * // Try authentication first
 * const result = await authenticate({ environmentId, deviceAuthenticationPolicyId });
 * if (!result.success && result.requiresRegistration) {
 *   // Fall back to registration
 *   await register({ environmentId, username, deviceAuthenticationPolicyId });
 * }
 */
export function usePasskeyAuth(): UsePasskeyAuthResult {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const authenticate = useCallback(async (options: PasskeyAuthOptions) => {
		setIsLoading(true);
		setError(null);

		try {
			// Check WebAuthn support
			if (!PasskeyServiceV8.isSupported()) {
				const errorMsg =
					'WebAuthn is not supported in this browser. Please use a modern browser that supports passkeys.';
				setError(errorMsg);
				toastV8.error(errorMsg);
				return { success: false, requiresRegistration: false };
			}

			const result = await PasskeyServiceV8.authenticateUsernameless(options);

			if (result.success) {
				toastV8.success(`Authenticated successfully as ${result.username || result.userId}`);
				return result;
			} else {
				setError(result.error || 'Authentication failed');
				if (result.requiresRegistration) {
					// Don't show error toast for "requires registration" - this is expected
					return result;
				} else {
					toastV8.error(result.error || 'Authentication failed');
					return result;
				}
			}
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Authentication failed';
			setError(errorMsg);
			toastV8.error(errorMsg);
			return { success: false, requiresRegistration: false };
		} finally {
			setIsLoading(false);
		}
	}, []);

	const register = useCallback(async (options: PasskeyRegistrationOptions) => {
		setIsLoading(true);
		setError(null);

		try {
			// Check WebAuthn support
			if (!PasskeyServiceV8.isSupported()) {
				const errorMsg =
					'WebAuthn is not supported in this browser. Please use a modern browser that supports passkeys.';
				setError(errorMsg);
				toastV8.error(errorMsg);
				return { success: false };
			}

			const result = await PasskeyServiceV8.registerPasskey(options);

			if (result.success) {
				toastV8.success('Passkey registered successfully!');
				return result;
			} else {
				const errorMsg = result.error || 'Registration failed';
				setError(errorMsg);
				toastV8.error(errorMsg);
				return result;
			}
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Registration failed';
			setError(errorMsg);
			toastV8.error(errorMsg);
			return { success: false };
		} finally {
			setIsLoading(false);
		}
	}, []);

	const reset = useCallback(() => {
		setError(null);
		setIsLoading(false);
	}, []);

	return {
		isLoading,
		error,
		authenticate,
		register,
		reset,
	};
}
