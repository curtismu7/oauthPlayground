// src/hooks/useGlobalWorkerToken.ts
// Global Worker Token Hook - Provides access to the global worker token manager

import { useCallback, useEffect, useState } from 'react';
import { workerTokenManager } from '../services/workerTokenManager';

export interface GlobalWorkerTokenStatus {
	token: string | null;
	isValid: boolean;
	isLoading: boolean;
	error: string | null;
	message: string;
}

/**
 * Hook for accessing the global worker token manager
 * Provides status and access to the shared worker token across the application
 */
export const useGlobalWorkerToken = (): GlobalWorkerTokenStatus => {
	const [status, setStatus] = useState<GlobalWorkerTokenStatus>({
		token: null,
		isValid: false,
		isLoading: true,
		error: null,
		message: 'Checking global worker token status...',
	});

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

			console.error('[useGlobalWorkerToken] ❌ Failed to get token:', {
				error: errorMessage,
				errorType: error?.constructor?.name,
				stack: error instanceof Error ? error.stack : undefined,
			});

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
		checkTokenStatus();
	}, [checkTokenStatus]);

	return status;
};

export default useGlobalWorkerToken;
