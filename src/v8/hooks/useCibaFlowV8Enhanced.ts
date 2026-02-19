/**
 * @file useCibaFlowV8Enhanced.ts
 * @module v8/hooks
 * @description Enhanced CIBA Flow Hook V8 - OpenID Connect Core 1.0 Compliant
 * @version 8.0.0
 * @since 2026-02-17
 *
 * Enhanced CIBA flow hook with full OpenID Connect Core 1.0 compliance:
 * - Complete login hint support (login_hint, id_token_hint, login_hint_token)
 * - Token delivery modes (poll, ping, push)
 * - Discovery metadata integration
 * - Proper error handling per specification
 * - Integration with enhanced CIBA service
 *
 * @example
 * const cibaFlow = useCibaFlowV8Enhanced();
 * await cibaFlow.initiateAuthentication(credentials);
 * const tokens = await cibaFlow.pollForTokens(authReqId, credentials);
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useProductionSpinner } from '@/hooks/useProductionSpinner';
import {
	type CibaAuthRequest,
	type CibaCredentials,
	type CibaDiscoveryMetadata,
	type CibaPollingResult,
	CibaServiceV8Enhanced,
	type CibaStatus,
	type CibaTokens,
} from '@/v8/services/cibaServiceV8Enhanced';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[🔐 CIBA-FLOW-V8-ENHANCED]';

export interface UseCibaFlowV8EnhancedState {
	// Discovery metadata
	discoveryMetadata: CibaDiscoveryMetadata | null;
	isLoadingDiscovery: boolean;
	discoveryError: string | null;

	// Authentication request state
	authRequest: CibaAuthRequest | null;
	isInitiating: boolean;

	// Polling state
	isPolling: boolean;
	pollingResult: CibaPollingResult | null;
	pollingCount: number;
	pollingInterval: number;

	// Token state
	tokens: CibaTokens | null;

	// Status tracking
	status: CibaStatus;
	error: string | null;

	// Configuration
	tokenDeliveryMode: 'poll' | 'ping' | 'push';
	clientNotificationEndpoint: string | null;
}

export interface UseCibaFlowV8EnhancedActions {
	// Discovery
	loadDiscoveryMetadata: (environmentId: string) => Promise<void>;

	// Authentication flow
	initiateAuthentication: (credentials: CibaCredentials) => Promise<CibaAuthRequest>;
	pollForTokens: (authReqId: string, credentials: CibaCredentials) => Promise<CibaPollingResult>;
	pollForTokensWithRetry: (
		authReqId: string,
		credentials: CibaCredentials,
		maxRetries?: number
	) => Promise<CibaPollingResult>;

	// Configuration
	setTokenDeliveryMode: (mode: 'poll' | 'ping' | 'push') => void;
	setClientNotificationEndpoint: (endpoint: string) => void;

	// State management
	reset: () => void;
	clearError: () => void;
}

// Default polling interval per OpenID Connect spec
const DEFAULT_POLLING_INTERVAL = 5;
const MAX_POLLING_ATTEMPTS = 120; // 10 minutes at 5-second intervals

/**
 * Enhanced CIBA Flow Hook V8 - OpenID Connect Core 1.0 Compliant
 */
export const useCibaFlowV8Enhanced = (): UseCibaFlowV8EnhancedState &
	UseCibaFlowV8EnhancedActions => {
	// Spinners for different operations
	const discoverySpinner = useProductionSpinner('ciba-discovery');
	const authSpinner = useProductionSpinner('ciba-auth');
	const pollingSpinner = useProductionSpinner('ciba-polling');

	// Discovery metadata state
	const [discoveryMetadata, setDiscoveryMetadata] = useState<CibaDiscoveryMetadata | null>(null);
	const [isLoadingDiscovery, setIsLoadingDiscovery] = useState(false);
	const [discoveryError, setDiscoveryError] = useState<string | null>(null);

	// Authentication request state
	const [authRequest, setAuthRequest] = useState<CibaAuthRequest | null>(null);
	const [isInitiating, setIsInitiating] = useState(false);

	// Polling state
	const [isPolling, setIsPolling] = useState(false);
	const [pollingResult, setPollingResult] = useState<CibaPollingResult | null>(null);
	const [pollingCount, setPollingCount] = useState(0);
	const [pollingInterval, setPollingInterval] = useState(DEFAULT_POLLING_INTERVAL);

	// Token state
	const [tokens, setTokens] = useState<CibaTokens | null>(null);

	// Status tracking
	const [status, setStatus] = useState<CibaStatus>('pending');
	const [error, setError] = useState<string | null>(null);

	// Configuration
	const [tokenDeliveryMode, setTokenDeliveryMode] = useState<'poll' | 'ping' | 'push'>('poll');
	const [clientNotificationEndpoint, setClientNotificationEndpoint] = useState<string | null>(null);

	// Refs for polling control
	const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);

	// ============================================================================
	// DISCOVERY METADATA
	// ============================================================================

	/**
	 * Load CIBA discovery metadata
	 */
	const loadDiscoveryMetadata = useCallback(
		async (environmentId: string) => {
			console.log(
				`${MODULE_TAG} Loading CIBA discovery metadata for environment: ${environmentId}`
			);

			setIsLoadingDiscovery(true);
			setDiscoveryError(null);

			try {
				const metadata = await discoverySpinner.withSpinner(
					async () => CibaServiceV8Enhanced.getDiscoveryMetadata(environmentId),
					'Loading CIBA discovery metadata...'
				);

				setDiscoveryMetadata(metadata);

				// Set default token delivery mode based on server capabilities
				if (metadata.backchannel_token_delivery_modes_supported.includes('poll')) {
					setTokenDeliveryMode('poll');
				} else if (metadata.backchannel_token_delivery_modes_supported.includes('ping')) {
					setTokenDeliveryMode('ping');
				} else if (metadata.backchannel_token_delivery_modes_supported.includes('push')) {
					setTokenDeliveryMode('push');
				}

				toastV8.success('CIBA discovery metadata loaded successfully');
				console.log(`${MODULE_TAG} Discovery metadata loaded:`, {
					supportedModes: metadata.backchannel_token_delivery_modes_supported,
					userCodeSupported: metadata.backchannel_user_code_parameter_supported,
					signingAlgs: metadata.backchannel_authentication_request_signing_alg_values_supported,
				});
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : 'Failed to load discovery metadata';
				setDiscoveryError(errorMessage);
				toastV8.error(errorMessage);
				console.error(`${MODULE_TAG} Failed to load discovery metadata:`, err);
			} finally {
				setIsLoadingDiscovery(false);
			}
		},
		[discoverySpinner]
	);

	// ============================================================================
	// AUTHENTICATION FLOW
	// ============================================================================

	/**
	 * Initiate CIBA authentication request
	 */
	const initiateAuthentication = useCallback(
		async (credentials: CibaCredentials): Promise<CibaAuthRequest> => {
			console.log(`${MODULE_TAG} Initiating CIBA authentication`);

			setIsInitiating(true);
			setError(null);
			setStatus('pending');
			setPollingCount(0);

			try {
				// Ensure credentials have proper token delivery mode
				const enhancedCredentials: CibaCredentials = {
					...credentials,
					tokenDeliveryMode: credentials.tokenDeliveryMode || tokenDeliveryMode,
					clientNotificationEndpoint:
						credentials.clientNotificationEndpoint || clientNotificationEndpoint || undefined,
				};

				const authReq = await authSpinner.withSpinner(
					async () => CibaServiceV8Enhanced.initiateAuthentication(enhancedCredentials),
					'Initiating CIBA authentication...'
				);

				setAuthRequest(authReq);
				setStatus('pending');

				// Set polling interval from server response
				if (authReq.interval && authReq.interval > 0) {
					setPollingInterval(authReq.interval);
				}

				toastV8.success('CIBA authentication request initiated');
				console.log(`${MODULE_TAG} Authentication initiated:`, {
					authReqId: `${authReq.auth_req_id.substring(0, 20)}...`,
					expiresIn: authReq.expires_in,
					interval: authReq.interval,
					tokenDeliveryMode: enhancedCredentials.tokenDeliveryMode,
				});

				return authReq;
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : 'Failed to initiate authentication';
				setError(errorMessage);
				setStatus('error');
				toastV8.error(errorMessage);
				console.error(`${MODULE_TAG} Failed to initiate authentication:`, err);
				throw err;
			} finally {
				setIsInitiating(false);
			}
		},
		[authSpinner, tokenDeliveryMode, clientNotificationEndpoint]
	);

	/**
	 * Poll for CIBA tokens (single attempt)
	 */
	const pollForTokens = useCallback(
		async (authReqId: string, credentials: CibaCredentials): Promise<CibaPollingResult> => {
			console.log(`${MODULE_TAG} Polling for tokens: ${authReqId.substring(0, 20)}...`);

			try {
				const enhancedCredentials: CibaCredentials = {
					...credentials,
					tokenDeliveryMode: credentials.tokenDeliveryMode || tokenDeliveryMode,
					clientNotificationEndpoint:
						credentials.clientNotificationEndpoint || clientNotificationEndpoint || undefined,
				};

				const result = await CibaServiceV8Enhanced.pollForTokens(authReqId, enhancedCredentials);

				setPollingResult(result);
				setPollingCount((prev) => prev + 1);
				setStatus(result.status);

				if (result.status === 'approved' && result.tokens) {
					setTokens(result.tokens);
					toastV8.success('CIBA authentication completed successfully!');
				} else if (result.status === 'denied') {
					toastV8.error('Authentication denied by user');
				} else if (result.status === 'expired') {
					toastV8.error('Authentication request expired');
				} else if (result.error === 'slow_down') {
					// Update polling interval if server requested slower polling
					if (result.interval && result.interval > pollingInterval) {
						setPollingInterval(result.interval);
						toastV8.warning(`Polling interval increased to ${result.interval} seconds`);
					}
				}

				return result;
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Polling failed';
				setError(errorMessage);
				setStatus('error');
				toastV8.error(errorMessage);
				console.error(`${MODULE_TAG} Polling failed:`, err);

				return {
					status: 'error',
					error: 'network_error',
					error_description: errorMessage,
				};
			}
		},
		[tokenDeliveryMode, clientNotificationEndpoint, pollingInterval]
	);

	/**
	 * Poll for tokens with automatic retry (for poll mode)
	 */
	const pollForTokensWithRetry = useCallback(
		async (
			authReqId: string,
			credentials: CibaCredentials,
			maxRetries: number = MAX_POLLING_ATTEMPTS
		): Promise<CibaPollingResult> => {
			console.log(`${MODULE_TAG} Starting polling with retry: ${authReqId.substring(0, 20)}...`);

			setIsPolling(true);
			abortControllerRef.current = new AbortController();

			try {
				for (let attempt = 1; attempt <= maxRetries; attempt++) {
					// Check if polling was cancelled
					if (abortControllerRef.current.signal.aborted) {
						console.log(`${MODULE_TAG} Polling cancelled`);
						break;
					}

					console.log(`${MODULE_TAG} Polling attempt ${attempt}/${maxRetries}`);

					const result = await pollingSpinner.withSpinner(
						() => pollForTokens(authReqId, credentials),
						`Polling for tokens... (Attempt ${attempt}/${maxRetries})`
					);

					// If we got a final result, return it
					if (result.status !== 'pending') {
						console.log(`${MODULE_TAG} Final result received: ${result.status}`);
						return result;
					}

					// For pending status, wait before next poll
					if (result.status === 'pending' && attempt < maxRetries) {
						const interval = result.interval || pollingInterval;
						console.log(`${MODULE_TAG} Waiting ${interval} seconds before next poll...`);

						await new Promise((resolve) => {
							const timeout = setTimeout(resolve, interval * 1000);

							// Handle cancellation during wait
							abortControllerRef.current?.signal.addEventListener('abort', () => {
								clearTimeout(timeout);
							});
						});
					}
				}

				// Max retries reached
				console.warn(`${MODULE_TAG} Maximum polling attempts reached`);
				toastV8.warning('Maximum polling time reached. Please try again.');

				return {
					status: 'expired',
					error: 'timeout',
					error_description: 'Maximum polling time reached',
				};
			} finally {
				setIsPolling(false);
				abortControllerRef.current = null;
			}
		},
		[pollForTokens, pollingSpinner, pollingInterval]
	);

	// ============================================================================
	// STATE MANAGEMENT
	// ============================================================================

	/**
	 * Reset all state
	 */
	const reset = useCallback(() => {
		console.log(`${MODULE_TAG} Resetting CIBA flow state`);

		// Cancel any ongoing polling
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}
		if (pollingTimeoutRef.current) {
			clearTimeout(pollingTimeoutRef.current);
		}

		// Reset all state
		setAuthRequest(null);
		setPollingResult(null);
		setTokens(null);
		setStatus('pending');
		setError(null);
		setPollingCount(0);
		setPollingInterval(DEFAULT_POLLING_INTERVAL);
		setIsInitiating(false);
		setIsPolling(false);
	}, []);

	/**
	 * Clear error state
	 */
	const clearError = useCallback(() => {
		setError(null);
		if (status === 'error') {
			setStatus('pending');
		}
	}, [status]);

	// ============================================================================
	// CLEANUP
	// ============================================================================

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
			if (pollingTimeoutRef.current) {
				clearTimeout(pollingTimeoutRef.current);
			}
		};
	}, []);

	return {
		// State
		discoveryMetadata,
		isLoadingDiscovery,
		discoveryError,
		authRequest,
		isInitiating,
		isPolling,
		pollingResult,
		pollingCount,
		pollingInterval,
		tokens,
		status,
		error,
		tokenDeliveryMode,
		clientNotificationEndpoint,

		// Actions
		loadDiscoveryMetadata,
		initiateAuthentication,
		pollForTokens,
		pollForTokensWithRetry,
		setTokenDeliveryMode,
		setClientNotificationEndpoint,
		reset,
		clearError,
	};
};

export default useCibaFlowV8Enhanced;
