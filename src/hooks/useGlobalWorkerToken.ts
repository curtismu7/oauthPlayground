// src/hooks/useGlobalWorkerToken.ts
// Global Worker Token Hook - Provides access to the global worker token manager

import { useCallback, useEffect, useState } from 'react';
import { unifiedWorkerTokenService } from '../services/unifiedWorkerTokenService';
import { workerTokenManager } from '../services/workerTokenManager';

export interface GlobalWorkerTokenStatus {
	token: string | null;
	isValid: boolean;
	isLoading: boolean;
	error: string | null;
	message: string;
}

export interface UseGlobalWorkerTokenOptions {
	/**
	 * When false, only reads the existing stored token — no API fetch.
	 * Use this on pages where the user should explicitly request a token via button.
	 * Defaults to true (auto-fetch when credentials are configured).
	 */
	autoFetch?: boolean;
}

/**
 * Hook for accessing the global worker token manager.
 *
 * @param options.autoFetch - Set to `false` to skip automatic token fetching on mount.
 *   The hook will still reactively update when a token is generated or cleared.
 */
export const useGlobalWorkerToken = (
	options: UseGlobalWorkerTokenOptions = {}
): GlobalWorkerTokenStatus => {
	const { autoFetch = true } = options;

	const [status, setStatus] = useState<GlobalWorkerTokenStatus>({
		token: null,
		isValid: false,
		isLoading: true,
		error: null,
		message: 'Checking global worker token status...',
	});

	/** Read stored token from localStorage/memory — no API call. */
	const checkTokenStatusSilent = useCallback(() => {
		const data = unifiedWorkerTokenService.getTokenDataSync();
		const isValid = unifiedWorkerTokenService.hasValidTokenSync();
		if (isValid && data?.token) {
			setStatus({
				token: data.token,
				isValid: true,
				isLoading: false,
				error: null,
				message: 'Worker token is valid and ready',
			});
		} else {
			setStatus({
				token: null,
				isValid: false,
				isLoading: false,
				error: null,
				message: 'No valid worker token. Use the Get Worker Token button.',
			});
		}
	}, []);

	/** Fetch or return cached token — may make an API call. */
	const checkTokenStatus = useCallback(async () => {
		try {
			setStatus((prev) => ({ ...prev, isLoading: true, error: null }));

			// Debug localStorage before attempting to get token
			const storedToken = localStorage.getItem('unified_worker_token');
			console.log('[useGlobalWorkerToken] 🔍 Debug - Stored token in localStorage:', {
				hasToken: !!storedToken,
				tokenLength: storedToken?.length || 0,
				tokenPreview: storedToken ? `${storedToken.substring(0, 100)}...` : 'none',
			});

			const token = await workerTokenManager.getWorkerToken();

			console.log('[useGlobalWorkerToken] ✅ Token retrieved successfully:', {
				hasToken: !!token,
				tokenLength: token?.length || 0,
				tokenPrefix: token ? `${token.substring(0, 20)}...` : 'none',
			});

			setStatus({
				token,
				isValid: true,
				isLoading: false,
				error: null,
				message: 'Global worker token is valid and ready',
			});
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to get global worker token';
			const isNotConfigured = errorMessage.includes('credentials not configured');

			// Expected when user hasn't set up worker token; avoid noisy error log
			if (isNotConfigured) {
				console.debug('[useGlobalWorkerToken] Worker Token not configured (optional).');
			} else {
				console.error('[useGlobalWorkerToken] ❌ Failed to get token:', {
					error: errorMessage,
					errorType: error?.constructor?.name,
					stack: error instanceof Error ? error.stack : undefined,
				});
			}

			setStatus({
				token: null,
				isValid: false,
				isLoading: false,
				error: errorMessage,
				message: errorMessage,
			});
		}
	}, []);

	// Check token status on mount
	useEffect(() => {
		if (autoFetch) {
			checkTokenStatus();
		} else {
			checkTokenStatusSilent();
		}
	}, [autoFetch, checkTokenStatus, checkTokenStatusSilent]);

	// Reactively update when another tab or component generates/clears a token
	useEffect(() => {
		const handleTokenUpdate = () => {
			if (autoFetch) {
				checkTokenStatus();
			} else {
				checkTokenStatusSilent();
			}
		};
		window.addEventListener('workerTokenUpdated', handleTokenUpdate);
		return () => window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
	}, [autoFetch, checkTokenStatus, checkTokenStatusSilent]);

	return status;
};

export default useGlobalWorkerToken;
