/**
 * @file useWorkerToken.ts
 * @module v8/hooks
 * @description Custom hook for managing worker token state and operations
 * @version 3.0.0
 * 
 * Extracted from MFAAuthenticationMainPageV8.tsx as part of V3 refactoring.
 * Centralizes all worker token-related logic including:
 * - Token status monitoring
 * - Token refresh/update
 * - Modal state management
 * - Configuration settings
 * - Event listeners for token updates
 */

import { useCallback, useEffect, useState } from 'react';
import { MFAConfigurationServiceV8 } from '@/v8/services/mfaConfigurationServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import type { TokenStatusInfo } from '@/v8/services/workerTokenStatusServiceV8';

export interface UseWorkerTokenConfig {
	/** Auto-refresh interval in milliseconds (default: 5000) */
	refreshInterval?: number;
	/** Enable auto-refresh when token is about to expire */
	enableAutoRefresh?: boolean;
}

export interface UseWorkerTokenReturn {
	// State
	tokenStatus: TokenStatusInfo;
	showWorkerTokenModal: boolean;
	silentApiRetrieval: boolean;
	showTokenAtEnd: boolean;
	isRefreshing: boolean;

	// Actions
	setShowWorkerTokenModal: (show: boolean) => void;
	setSilentApiRetrieval: (silent: boolean) => void;
	setShowTokenAtEnd: (show: boolean) => void;
	refreshTokenStatus: () => Promise<void>;
	checkAndRefreshToken: () => Promise<void>;

	// Computed
	showTokenOnly: boolean;
}

const MODULE_TAG = '[🔐 USE-WORKER-TOKEN]';

/**
 * Custom hook for managing worker token state and operations
 */
export const useWorkerToken = (config: UseWorkerTokenConfig = {}): UseWorkerTokenReturn => {
	const { refreshInterval = 5000, enableAutoRefresh = true } = config;

	// State
	const [tokenStatus, setTokenStatus] = useState<TokenStatusInfo>({
		status: 'missing',
		message: 'Checking worker token status...',
		isValid: false,
	});
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	const [silentApiRetrieval, setSilentApiRetrieval] = useState(false);
	const [showTokenAtEnd, setShowTokenAtEnd] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);

	// Initialize token status
	useEffect(() => {
		const initializeTokenStatus = async () => {
			try {
				const status = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
				setTokenStatus(status);
			} catch (error) {
				console.error(`${MODULE_TAG} Failed to initialize token status:`, error);
				setTokenStatus({
					status: 'missing',
					message: 'Failed to check worker token status',
					isValid: false,
				});
			}
		};

		initializeTokenStatus();
	}, []);

	// Load worker token settings from config service
	useEffect(() => {
		const loadConfig = () => {
			try {
				const config = MFAConfigurationServiceV8.loadConfiguration();
				setSilentApiRetrieval(config.workerToken.silentApiRetrieval);
				setShowTokenAtEnd(config.workerToken.showTokenAtEnd);
			} catch (error) {
				console.error(`${MODULE_TAG} Failed to load worker token config:`, error);
			}
		};

		loadConfig();
	}, []);

	// Refresh token status
	const refreshTokenStatus = useCallback(async () => {
		try {
			const status = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
			setTokenStatus(status);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to refresh token status:`, error);
		}
	}, []);

	// Update token status on events
	useEffect(() => {
		const handleTokenUpdate = async () => {
			try {
				const status = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
				setTokenStatus(status);
			} catch (error) {
				console.error(`${MODULE_TAG} Failed to check token status in event handler:`, error);
			}
		};

		window.addEventListener('workerTokenUpdated', handleTokenUpdate);
		window.addEventListener('storage', handleTokenUpdate);
		const interval = setInterval(handleTokenUpdate, refreshInterval);

		return () => {
			window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
			window.removeEventListener('storage', handleTokenUpdate);
			clearInterval(interval);
		};
	}, [refreshInterval]);

	// Auto-refresh worker token when it's about to expire
	const checkAndRefreshToken = useCallback(async () => {
		if (!enableAutoRefresh) return;

		try {
			const config = MFAConfigurationServiceV8.loadConfiguration();
			if (!config.workerToken.silentApiRetrieval) return;

			const status = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
			
			// If token expires in less than 5 minutes, refresh it
			if (status.expiresAt) {
				const expiresIn = status.expiresAt - Date.now();
				const fiveMinutes = 5 * 60 * 1000;
				
				if (expiresIn > 0 && expiresIn < fiveMinutes && !isRefreshing) {
					setIsRefreshing(true);
					console.log(`${MODULE_TAG} Token expiring soon, auto-refreshing...`);
					
					// Trigger token refresh by dispatching event
					window.dispatchEvent(new CustomEvent('refreshWorkerToken'));
					
					// Wait a bit then check status again
					setTimeout(async () => {
						await refreshTokenStatus();
						setIsRefreshing(false);
					}, 2000);
				}
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to check/refresh token:`, error);
			setIsRefreshing(false);
		}
	}, [enableAutoRefresh, isRefreshing, refreshTokenStatus]);

	// Auto-refresh check interval
	useEffect(() => {
		if (!enableAutoRefresh) return;

		const interval = setInterval(checkAndRefreshToken, 60000); // Check every minute
		return () => clearInterval(interval);
	}, [enableAutoRefresh, checkAndRefreshToken]);

	// Compute showTokenOnly for modal
	const showTokenOnly = (() => {
		if (!showWorkerTokenModal) return false;
		try {
			const config = MFAConfigurationServiceV8.loadConfiguration();
			return config.workerToken.showTokenAtEnd && tokenStatus.isValid;
		} catch {
			return false;
		}
	})();

	return {
		// State
		tokenStatus,
		showWorkerTokenModal,
		silentApiRetrieval,
		showTokenAtEnd,
		isRefreshing,

		// Actions
		setShowWorkerTokenModal,
		setSilentApiRetrieval,
		setShowTokenAtEnd,
		refreshTokenStatus,
		checkAndRefreshToken,

		// Computed
		showTokenOnly,
	};
};
