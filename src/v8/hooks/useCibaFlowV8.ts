/**
 * @file useCibaFlowV8.ts
 * @module v8/hooks
 * @description CIBA (Client Initiated Backchannel Authentication) Flow Hook V8
 * @version 8.0.0
 * @since 2026-02-17
 *
 * Provides comprehensive CIBA flow management with modern V8 patterns:
 * - Authentication request initiation
 * - Token polling with proper intervals
 * - Status management and error handling
 * - Integration with V8 services and spinners
 *
 * @example
 * const cibaFlow = useCibaFlowV8();
 * await cibaFlow.initiateAuthentication(credentials);
 * const tokens = await cibaFlow.pollForTokens(authReqId);
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useProductionSpinner } from '@/hooks/useProductionSpinner';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import {
	type CibaAuthRequest,
	type CibaCredentials,
	type CibaPollingResult,
	CibaServiceV8,
	type CibaStatus,
	type CibaTokens,
} from '@/v8/services/cibaServiceV8';
import { logger } from '../../utils/logger';

const MODULE_TAG = '[🔐 CIBA-FLOW-V8]';

export interface UseCibaFlowV8State {
	// Authentication request state
	authRequest: CibaAuthRequest | null;
	isInitiating: boolean;

	// Polling state
	isPolling: boolean;
	pollingResult: CibaPollingResult | null;
	pollingCount: number;

	// Token state
	tokens: CibaTokens | null;

	// Status tracking
	status: CibaStatus;
	error: string | null;

	// Configuration
	pollingInterval: number;
	maxPollingAttempts: number;
}

export interface UseCibaFlowV8Return {
	// State
	state: UseCibaFlowV8State;

	// Actions
	initiateAuthentication: (credentials: CibaCredentials) => Promise<CibaAuthRequest | null>;
	pollForTokens: (authReqId: string, credentials: CibaCredentials) => Promise<void>;
	startPolling: (authReqId: string, credentials: CibaCredentials) => void;
	stopPolling: () => void;
	reset: () => void;

	// Computed values
	isActive: boolean;
	canPoll: boolean;
	isSuccess: boolean;
	isError: boolean;
	statusMessage: string;

	// Utilities
	getRemainingTime: () => number;
	getPollingProgress: () => number;
}

/**
 * CIBA Flow Hook V8
 * Provides comprehensive CIBA flow management with modern React patterns
 */
export const useCibaFlowV8 = (): UseCibaFlowV8Return => {
	// Spinner hooks for different operations
	const initiationSpinner = useProductionSpinner('ciba-initiation');
	const pollingSpinner = useProductionSpinner('ciba-polling');

	// State management
	const [state, setState] = useState<UseCibaFlowV8State>({
		authRequest: null,
		isInitiating: false,
		isPolling: false,
		pollingResult: null,
		pollingCount: 0,
		tokens: null,
		status: 'pending',
		error: null,
		pollingInterval: CibaServiceV8.getDefaultPollingInterval(),
		maxPollingAttempts: 60, // 5 minutes with 5-second intervals
	});

	// Refs for polling management
	const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const pollingStartTimeRef = useRef<number>(0);

	/**
	 * Initiate CIBA authentication request
	 */
	const initiateAuthentication = useCallback(
		async (credentials: CibaCredentials): Promise<CibaAuthRequest | null> => {
			logger.info(`${MODULE_TAG} Initiating CIBA authentication`, 'Logger info');

			// Validate credentials first
			const validation = CibaServiceV8.validateCredentials(credentials);
			if (!validation.valid) {
				const errorMessage = validation.errors.join(', ');
				logger.error(`${MODULE_TAG} Validation failed:`, validation.errors);
				modernMessaging.showBanner({
					type: 'error',
					title: 'Error',
					message: `Validation failed: ${errorMessage}`,
					dismissible: true,
				});
				setState((prev) => ({ ...prev, error: errorMessage, status: 'error' }));
				return null;
			}

			setState((prev) => ({ ...prev, isInitiating: true, error: null, status: 'pending' }));

			try {
				const authRequest = await initiationSpinner.withSpinner(async () => {
					return await CibaServiceV8.initiateAuthentication(credentials);
				}, 'Initiating CIBA authentication...');

				setState((prev) => ({
					...prev,
					authRequest,
					isInitiating: false,
					status: 'pending',
					error: null,
				}));

				logger.info(`${MODULE_TAG} CIBA authentication initiated successfully`, 'Logger info');
				return authRequest;
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				logger.error(`${MODULE_TAG} Failed to initiate CIBA authentication:`, error);

				setState((prev) => ({
					...prev,
					isInitiating: false,
					error: errorMessage,
					status: 'error',
					authRequest: null,
				}));

				modernMessaging.showBanner({
					type: 'error',
					title: 'Error',
					message: `Failed to initiate CIBA authentication: ${errorMessage}`,
					dismissible: true,
				});
				return null;
			}
		},
		[initiationSpinner]
	);

	/**
	 * Poll for tokens once
	 */
	const pollForTokens = useCallback(
		async (authReqId: string, credentials: CibaCredentials): Promise<void> => {
			logger.info(`${MODULE_TAG} Polling for CIBA tokens: ${authReqId.substring(0, 20)}...`);

			try {
				const result = await CibaServiceV8.pollForTokens(authReqId, credentials);

				setState((prev) => ({
					...prev,
					pollingResult: result,
					status: result.status,
					error: result.error || null,
					tokens: result.tokens || null,
				}));

				// Handle different statuses
				switch (result.status) {
					case 'approved':
						modernMessaging.showFooterMessage({
							type: 'info',
							message: 'CIBA authentication completed successfully!',
							duration: 3000,
						});
						logger.info(`${MODULE_TAG} CIBA authentication completed successfully`, 'Logger info');
						break;
					case 'denied':
						modernMessaging.showBanner({
							type: 'error',
							title: 'Error',
							message: 'Authentication denied by user',
							dismissible: true,
						});
						break;
					case 'expired':
						modernMessaging.showBanner({
							type: 'error',
							title: 'Error',
							message: 'Authentication request has expired',
							dismissible: true,
						});
						break;
					case 'error':
						modernMessaging.showBanner({
							type: 'error',
							title: 'Error',
							message: result.error_description || 'An error occurred during authentication',
							dismissible: true,
						});
						break;
					case 'pending':
						// Continue polling - update interval if provided
						if (result.interval) {
							setState((prev) => ({
								...prev,
								pollingInterval: result.interval || CibaServiceV8.getDefaultPollingInterval(),
							}));
						}
						break;
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				logger.error(`${MODULE_TAG} Error during token polling:`, error);

				setState((prev) => ({
					...prev,
					error: errorMessage,
					status: 'error',
				}));

				modernMessaging.showBanner({
					type: 'error',
					title: 'Error',
					message: `Error during token polling: ${errorMessage}`,
					dismissible: true,
				});
			}
		},
		[]
	);

	/**
	 * Stop polling
	 */
	const stopPolling = useCallback(() => {
		logger.info(`${MODULE_TAG} Stopping polling`, 'Logger info');

		if (pollingTimeoutRef.current) {
			clearTimeout(pollingTimeoutRef.current);
			pollingTimeoutRef.current = null;
		}

		setState((prev) => ({ ...prev, isPolling: false }));
	}, []);

	/**
	 * Start automatic polling for tokens
	 */
	const startPolling = useCallback(
		(authReqId: string, credentials: CibaCredentials) => {
			logger.info(`${MODULE_TAG} Starting automatic polling for: ${authReqId.substring(0, 20)}...`);

			// Clear any existing polling
			stopPolling();

			setState((prev) => ({
				...prev,
				isPolling: true,
				pollingCount: 0,
				status: 'pending',
				error: null,
			}));

			pollingStartTimeRef.current = Date.now();

			const poll = async () => {
				setState((prev) => ({ ...prev, pollingCount: prev.pollingCount + 1 }));

				// Check if we've exceeded max attempts
				if (state.pollingCount >= state.maxPollingAttempts) {
					logger.warn(`${MODULE_TAG} Max polling attempts reached`, 'Logger warning');
					setState((prev) => ({
						...prev,
						isPolling: false,
						error: 'Maximum polling time exceeded',
						status: 'error',
					}));
					modernMessaging.showBanner({
						type: 'error',
						title: 'Error',
						message: 'Authentication request timed out',
						dismissible: true,
					});
					return;
				}

				// Perform polling
				await pollingSpinner.withSpinner(async () => {
					await pollForTokens(authReqId, credentials);
				}, 'Checking authentication status...');

				// Continue polling if still pending
				setState((prev) => {
					if (prev.status === 'pending' && prev.isPolling) {
						pollingTimeoutRef.current = setTimeout(poll, prev.pollingInterval * 1000);
					}
					return prev;
				});
			};

			// Start first poll
			poll();
		},
		[pollForTokens, pollingSpinner, stopPolling, state.pollingCount, state.maxPollingAttempts]
	);

	/**
	 * Reset the entire flow state
	 */
	const reset = useCallback(() => {
		logger.info(`${MODULE_TAG} Resetting CIBA flow state`, 'Logger info');

		stopPolling();

		setState({
			authRequest: null,
			isInitiating: false,
			isPolling: false,
			pollingResult: null,
			pollingCount: 0,
			tokens: null,
			status: 'pending',
			error: null,
			pollingInterval: CibaServiceV8.getDefaultPollingInterval(),
			maxPollingAttempts: 60,
		});
	}, [stopPolling]);

	/**
	 * Get remaining time for authentication request
	 */
	const getRemainingTime = useCallback((): number => {
		if (!state.authRequest?.expires_in || !pollingStartTimeRef.current) {
			return 0;
		}

		const elapsed = (Date.now() - pollingStartTimeRef.current) / 1000;
		const remaining = state.authRequest.expires_in - elapsed;
		return Math.max(0, Math.floor(remaining));
	}, [state.authRequest?.expires_in]);

	/**
	 * Get polling progress as percentage
	 */
	const getPollingProgress = useCallback((): number => {
		const maxTime = state.authRequest?.expires_in || 300; // Default 5 minutes
		const elapsed = pollingStartTimeRef.current
			? (Date.now() - pollingStartTimeRef.current) / 1000
			: 0;
		return Math.min(100, (elapsed / maxTime) * 100);
	}, [state.authRequest?.expires_in]);

	// Computed values
	const isActive = state.isInitiating || state.isPolling || state.status === 'pending';
	const canPoll = !!state.authRequest && state.status === 'pending' && !state.isPolling;
	const isSuccess = state.status === 'approved' && !!state.tokens;
	const isError =
		state.status === 'error' || state.status === 'denied' || state.status === 'expired';
	const statusMessage = CibaServiceV8.formatStatus(state.status);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			stopPolling();
		};
	}, [stopPolling]);

	return {
		state,
		initiateAuthentication,
		pollForTokens,
		startPolling,
		stopPolling,
		reset,
		isActive,
		canPoll,
		isSuccess,
		isError,
		statusMessage,
		getRemainingTime,
		getPollingProgress,
	};
};

export default useCibaFlowV8;
