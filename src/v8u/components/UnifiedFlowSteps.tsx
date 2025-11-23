/**
 * @file UnifiedFlowSteps.tsx
 * @module v8u/components
 * @description Unified flow steps component that adapts to all flow types
 * @version 8.0.0
 * @since 2024-11-16
 *
 * This component renders flow-specific steps based on the selected flow type:
 * - Authorization Code: Config → Auth URL → Callback → Tokens
 * - Implicit: Config → Auth URL → Fragment → Tokens
 * - Client Credentials: Config → Token Request → Tokens
 * - Device Code: Config → Device Auth → Poll → Tokens
 * - Hybrid: Config → Auth URL → Fragment/Callback → Tokens
 * 
 * Note: ROPC flow is removed from unified flows as it's not supported by PingOne.
 * Use the mock ROPC flow instead.
 */

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { FiArrowRight, FiRefreshCw } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import { ColoredUrlDisplay } from '@/components/ColoredUrlDisplay';
import DeviceTypeSelector from '@/components/DeviceTypeSelector';
import DynamicDeviceFlow from '@/components/DynamicDeviceFlow';
import RedirectlessLoginModal from '@/components/RedirectlessLoginModal';
import { type PKCECodes, PKCEService } from '@/services/pkceService';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import type { TokenResponse } from '@/v8/services/oauthIntegrationServiceV8';
import { OidcDiscoveryServiceV8 } from '@/v8/services/oidcDiscoveryServiceV8';
import { TokenDisplayServiceV8 } from '@/v8/services/tokenDisplayServiceV8';
import { type FlowType, type SpecVersion } from '@/v8/services/specVersionServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { PKCEStorageServiceV8U } from '../services/pkceStorageServiceV8U';
import {
	type UnifiedFlowCredentials,
	UnifiedFlowIntegrationV8U,
} from '../services/unifiedFlowIntegrationV8U';
import { ErrorDisplayWithRetry } from './ErrorDisplayWithRetry';
import { TokenDisplayV8U } from './TokenDisplayV8U';
import { UserInfoSuccessModalV8U } from './UserInfoSuccessModalV8U';
import { TokenOperationsEducationModalV8 } from '@/v8/components/TokenOperationsEducationModalV8';
import { TokenOperationsServiceV8 } from '@/v8/services/tokenOperationsServiceV8';

// Note: Credentials form is rendered by parent component (UnifiedOAuthFlowV8U)

const MODULE_TAG = '[🔄 UNIFIED-FLOW-STEPS-V8U]';

export interface UnifiedFlowStepsProps {
	specVersion: SpecVersion;
	flowType: FlowType;
	credentials: UnifiedFlowCredentials;
	onCredentialsChange?: (credentials: UnifiedFlowCredentials) => void;
	onStepChange?: (step: number) => void;
	onCompletedStepsChange?: (steps: number[]) => void;
	onFlowReset?: () => void; // Callback when flow is reset to trigger credential reload
	appConfig?: {
		pkceRequired?: boolean;
		pkceEnforced?: boolean;
		[key: string]: unknown;
	}; // Optional app config to determine PKCE enforcement level
}

interface FlowState {
	// Authorization URL flows (authz, implicit, hybrid)
	authorizationUrl?: string;
	state?: string;
	nonce?: string;
	codeVerifier?: string;
	codeChallenge?: string;

	// Authorization Code flows
	authorizationCode?: string;

	// Device Code flow
	deviceCode?: string;
	userCode?: string;
	verificationUri?: string;
	verificationUriComplete?: string; // URI with user code pre-filled (RFC 8628)
	deviceCodeExpiresIn?: number;
	deviceCodeExpiresAt?: number; // Timestamp when device code expires
	pollingStatus?: {
		isPolling: boolean;
		pollCount: number;
		lastPolled?: number; // Timestamp of last poll
		error?: string;
	};

	// Tokens (all flows)
	tokens?: {
		accessToken?: string;
		idToken?: string;
		refreshToken?: string;
		expiresIn?: number;
	};

	// UserInfo (OIDC)
	userInfo?: Record<string, unknown>;
	
	// Redirectless flow state
	redirectlessFlowId?: string;
	redirectlessResumeUrl?: string;
}

// Format time remaining for countdown display
const formatTimeRemaining = (seconds: number): string => {
	if (seconds <= 0) return 'Expired';
	
	const minutes = Math.floor(seconds / 60);
	const secs = seconds % 60;
	
	if (minutes > 0) {
		return `${minutes}m ${secs}s`;
	}
	return `${secs}s`;
};

export const UnifiedFlowSteps: React.FC<UnifiedFlowStepsProps> = ({
	specVersion,
	flowType,
	credentials,
	onStepChange,
	onCompletedStepsChange,
	onFlowReset,
	appConfig,
}) => {
	// Generate flowKey dynamically (matches parent component's logic)
	// Format: {flowType}_{specVersion}_{uniqueIdentifier}
	// Example: implicit_oauth20_v8u
	const flowKey = useMemo(() => {
		// Normalize spec version for storage key (remove dots, lowercase)
		const normalizedSpecVersion = specVersion.replace(/\./g, '').toLowerCase();
		return `${flowType}_${normalizedSpecVersion}_v8u`;
	}, [flowType, specVersion]);
	// CRITICAL DEBUG: Log credentials received by UnifiedFlowSteps
	useEffect(() => {
		console.log(`${MODULE_TAG} ========== UNIFIED-FLOW-STEPS CREDENTIALS RECEIVED ==========`);
		console.log(`${MODULE_TAG} Flow Type:`, flowType);
		console.log(`${MODULE_TAG} Credentials Object:`, {
			environmentId: credentials.environmentId || 'MISSING',
			clientId: credentials.clientId || 'MISSING',
			hasClientSecret:
				credentials.clientSecret !== undefined
					? credentials.clientSecret
						? 'PRESENT'
						: 'EMPTY'
					: 'UNDEFINED',
			clientSecretLength: credentials.clientSecret?.length || 0,
			redirectUri: credentials.redirectUri || 'MISSING',
			scopes: credentials.scopes || 'MISSING',
			usePKCE: isPKCERequired,
			pkceEnforcement: credentials.pkceEnforcement,
			enableRefreshToken: credentials.enableRefreshToken,
			allKeys: Object.keys(credentials),
		});
		console.log(`${MODULE_TAG} Full Credentials JSON:`, JSON.stringify(credentials, null, 2));
		console.log(`${MODULE_TAG} ========== UNIFIED-FLOW-STEPS CREDENTIALS END ==========`);
	}, [credentials, flowType]);

	// Helper: Check if PKCE is required based on enforcement level
	const isPKCERequired = useMemo(() => {
		if (credentials.pkceEnforcement) {
			return credentials.pkceEnforcement !== 'OPTIONAL';
		}
		// Legacy: fallback to usePKCE boolean
		return credentials.usePKCE === true;
	}, [credentials.pkceEnforcement, credentials.usePKCE]);

	/**
	 * Calculate total number of steps for the current flow type
	 * 
	 * Step counts vary by flow type:
	 * 
	 * Client Credentials (4 steps):
	 *   0: Configuration
	 *   1: Request Token
	 *   2: Display Tokens
	 *   3: Introspection & UserInfo
	 * 
	 * Device Code (5 steps):
	 *   0: Configuration
	 *   1: Request Device Authorization
	 *   2: Poll for Tokens
	 *   3: Display Tokens
	 *   4: Introspection & UserInfo
	 * 
	 * Implicit (5 steps):
	 *   0: Configuration
	 *   1: Generate Authorization URL
	 *   2: Parse Fragment (extract tokens from URL)
	 *   3: Display Tokens
	 *   4: Introspection & UserInfo
	 * 
	 * Authorization Code / Hybrid (7 steps - PKCE step always included):
	 *   0: Configuration
	 *   1: Generate PKCE Parameters (always shown)
	 *   2: Generate Authorization URL (with or without PKCE)
	 *   3: Handle Callback (extract authorization code)
	 *   4: Exchange Code for Tokens (with or without code_verifier)
	 *   5: Display Tokens
	 *   6: Introspection & UserInfo
	 * 
	 * @returns {number} Total number of steps for the current flow
	 */
	const getTotalSteps = (): number => {
		switch (flowType) {
			case 'client-credentials':
				return 4; // Config → Token Request → Tokens → Introspection & UserInfo
			case 'device-code':
				return 5; // Config → Device Auth → Poll → Tokens → Introspection & UserInfo
			case 'implicit':
				return 5; // Config → Auth URL → Fragment → Tokens → Introspection & UserInfo
			case 'hybrid':
				// Always 7 steps: Config → PKCE → Auth URL → Parse Callback → Exchange → Tokens → Introspection & UserInfo
				return 7;
			default:
				// oauth-authz flow
				// Always 7 steps: Config → PKCE → Auth URL → Handle Callback → Exchange → Tokens → Introspection & UserInfo
				return 7;
		}
	};

	const totalSteps = getTotalSteps();
	const navigate = useNavigate();
	const { step: urlStep } = useParams<{ step?: string }>();

	// Get current step from URL
	const currentStep = useMemo(() => {
		if (urlStep) {
			const stepNum = parseInt(urlStep, 10);
			if (!Number.isNaN(stepNum) && stepNum >= 0 && stepNum < totalSteps) {
				return stepNum;
			}
		}
		return 0;
	}, [urlStep, totalSteps]);

	// Track completed steps and validation
	const [completedSteps, setCompletedSteps] = useState<number[]>([]);
	const [validationErrors, setValidationErrors] = useState<string[]>([]);
	
	// Redirectless authentication state
	const [showRedirectlessModal, setShowRedirectlessModal] = useState(false);
	const [redirectlessAuthError, setRedirectlessAuthError] = useState<string | null>(null);
	const [isRedirectlessAuthenticating, setIsRedirectlessAuthenticating] = useState(false);
	const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

	// Navigation functions using React Router
	const navigateToStep = useCallback(
		(step: number) => {
			if (step < 0 || step >= totalSteps) {
				console.warn(`${MODULE_TAG} Invalid step`, { step, totalSteps });
				return;
			}
			const path = `/v8u/unified/${flowType}/${step}`;
			console.log(`${MODULE_TAG} Navigating to step`, { from: currentStep, to: step, path });
			navigate(path, { replace: true });
			onStepChange?.(step);
		},
		[flowType, totalSteps, currentStep, navigate, onStepChange]
	);

	const goToNext = useCallback(() => {
		if (currentStep < totalSteps - 1) {
			navigateToStep(currentStep + 1);
		}
	}, [currentStep, totalSteps, navigateToStep]);

	const goToPrevious = useCallback(() => {
		if (currentStep > 0) {
			navigateToStep(currentStep - 1);
		}
	}, [currentStep, navigateToStep]);

	const reset = useCallback(() => {
		navigateToStep(0);
	}, [navigateToStep]);

	const markStepComplete = useCallback(() => {
		if (!completedSteps.includes(currentStep)) {
			console.log(`${MODULE_TAG} Marking step as complete`, { step: currentStep });
			setCompletedSteps((prev) => [...prev, currentStep]);
		}
	}, [currentStep, completedSteps]);

	const setValidationErrorsState = useCallback((errors: string[]) => {
		console.log(`${MODULE_TAG} Setting validation errors`, { errorCount: errors.length });
		setValidationErrors(errors);
	}, []);

	const setValidationWarningsState = useCallback((warnings: string[]) => {
		console.log(`${MODULE_TAG} Setting validation warnings`, { warningCount: warnings.length });
		setValidationWarnings(warnings);
	}, []);

	// Create nav object for compatibility with breadcrumbs and action buttons
	const nav = useMemo(
		() => ({
			currentStep,
			completedSteps,
			validationErrors,
			validationWarnings,
			canGoNext:
				currentStep < totalSteps - 1 &&
				validationErrors.length === 0 &&
				completedSteps.includes(currentStep),
			canGoPrevious: currentStep > 0,
			goToStep: navigateToStep,
			goToNext,
			goToPrevious,
			reset,
			markStepComplete,
			setValidationErrors: setValidationErrorsState,
			setValidationWarnings: setValidationWarningsState,
		}),
		[
			currentStep,
			completedSteps,
			validationErrors,
			validationWarnings,
			totalSteps,
			navigateToStep,
			goToNext,
			goToPrevious,
			reset,
			markStepComplete,
			setValidationErrorsState,
			setValidationWarningsState,
		]
	);

	const [flowState, setFlowState] = useState<FlowState>(() => {
		// Try to restore flow-specific data from sessionStorage on mount
		const initialState: FlowState = {};

		// REMOVED: Auto-restoration of PKCE codes on mount
		// Users should manually generate PKCE codes by clicking the button in Step 1
		// This is an educational tool - users need to learn the steps themselves

		// Restore tokens based on flow type
		if (flowType === 'implicit' || flowType === 'hybrid') {
			const storedTokens = sessionStorage.getItem('v8u_implicit_tokens');
			if (storedTokens) {
				try {
					const tokens = JSON.parse(storedTokens);
					console.log(`${MODULE_TAG} Restored ${flowType} tokens from sessionStorage`, {
						hasAccessToken: !!tokens.accessToken,
					});
					initialState.tokens = tokens;
				} catch (err) {
					console.error(`${MODULE_TAG} Failed to parse stored ${flowType} tokens`, err);
				}
			}
		} else if (flowType === 'client-credentials') {
			const storedTokens = sessionStorage.getItem('v8u_client_credentials_tokens');
			if (storedTokens) {
				try {
					const tokens = JSON.parse(storedTokens);
					console.log(`${MODULE_TAG} Restored client-credentials tokens from sessionStorage`, {
						hasAccessToken: !!tokens.accessToken,
					});
					initialState.tokens = tokens;
				} catch (err) {
					console.error(`${MODULE_TAG} Failed to parse stored client-credentials tokens`, err);
				}
			}
		} else if (flowType === 'device-code') {
			const storedDeviceCode = sessionStorage.getItem('v8u_device_code_data');
			if (storedDeviceCode) {
				try {
					const deviceData = JSON.parse(storedDeviceCode);
					console.log(`${MODULE_TAG} Restored device code data from sessionStorage`, {
						hasDeviceCode: !!deviceData.deviceCode,
					});
					initialState.deviceCode = deviceData.deviceCode;
					initialState.userCode = deviceData.userCode;
					initialState.verificationUri = deviceData.verificationUri;
					initialState.verificationUriComplete = deviceData.verificationUriComplete;
					initialState.deviceCodeExpiresIn = deviceData.deviceCodeExpiresIn;
				} catch (err) {
					console.error(`${MODULE_TAG} Failed to parse stored device code data`, err);
				}
			}
		}

		return initialState;
	});
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showUserInfoModal, setShowUserInfoModal] = useState(false);
	const [showCallbackSuccessModal, setShowCallbackSuccessModal] = useState(false);
	const [showPollingTimeoutModal, setShowPollingTimeoutModal] = useState(false);
	const [callbackDetails, setCallbackDetails] = useState<{
		url: string;
		code?: string;
		state?: string;
		sessionState?: string;
		allParams: Record<string, string>;
	} | null>(null);
	// Token display hooks (moved to top level to fix React Hooks rule)
	const [userInfoLoading, setUserInfoLoading] = useState(false);
	const [userInfoError, setUserInfoError] = useState<string | null>(null);
	const [introspectionLoading, setIntrospectionLoading] = useState(false);
	const [introspectionError, setIntrospectionError] = useState<string | null>(null);
	/**
	 * Token operations modal state
	 * 
	 * This modal shows educational content about token operations (introspection, UserInfo, etc.).
	 * Currently the modal component is not rendered, but the onClick handlers are kept for future use.
	 * When the modal is implemented, uncomment this state and the modal component.
	 */
	// const [showTokenOperationsModal, setShowTokenOperationsModal] = useState(false);
	
	// Device type selector for device code flow
	const [selectedDeviceType, setSelectedDeviceType] = useState<string>(() => {
		const saved = localStorage.getItem('device_flow_selected_device');
		return saved || 'apple-tv';
	});
	
	// Countdown timer for device code expiration
	const [timeRemaining, setTimeRemaining] = useState<number>(0);
	const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const pollingAbortRef = useRef<boolean>(false);
	
	// Countdown timer effect for device code expiration
	useEffect(() => {
		if (flowType !== 'device-code' || !flowState.deviceCodeExpiresAt) {
			setTimeRemaining(0);
			if (countdownIntervalRef.current) {
				clearInterval(countdownIntervalRef.current);
				countdownIntervalRef.current = null;
			}
			return;
		}
		
		const updateCountdown = () => {
			const now = Date.now();
			const expiresAt = flowState.deviceCodeExpiresAt!;
			const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
			setTimeRemaining(remaining);
			
			if (remaining <= 0) {
				if (countdownIntervalRef.current) {
					clearInterval(countdownIntervalRef.current);
					countdownIntervalRef.current = null;
				}
			}
		};
		
		updateCountdown();
		countdownIntervalRef.current = setInterval(updateCountdown, 1000);
		
		return () => {
			if (countdownIntervalRef.current) {
				clearInterval(countdownIntervalRef.current);
				countdownIntervalRef.current = null;
			}
		};
	}, [flowType, flowState.deviceCodeExpiresAt]);

	// Ensure PKCE codes are generated before proceeding to Authorization URL step
	// Only redirect if PKCE is required (REQUIRED or S256_REQUIRED)
	// If OPTIONAL, user can proceed without codes
	useEffect(() => {
		if (
			currentStep === 2 &&
			(flowType === 'oauth-authz' || flowType === 'hybrid') &&
			isPKCERequired &&
			(!flowState.codeVerifier || !flowState.codeChallenge)
		) {
			console.log(`${MODULE_TAG} [PKCE VALIDATION] PKCE codes required but missing - redirecting to PKCE step`, {
				currentStep,
				hasCodeVerifier: !!flowState.codeVerifier,
				hasCodeChallenge: !!flowState.codeChallenge,
				isPKCERequired,
			});
			navigateToStep(1);
		}
	}, [currentStep, flowType, flowState.codeVerifier, flowState.codeChallenge, navigateToStep, isPKCERequired]);
	
	// Track active polling timeout to allow cancellation
	const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	// Track auto-poll timeout to allow cleanup
	const autoPollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	
	// Cleanup intervals and stop polling on unmount or step change
	useEffect(() => {
		return () => {
			// Stop polling when component unmounts or step changes
			pollingAbortRef.current = true;
			isPollingExecutingRef.current = false;
			
			// Clear any pending timeouts
			if (pollingTimeoutRef.current) {
				clearTimeout(pollingTimeoutRef.current);
				pollingTimeoutRef.current = null;
			}
			
			// Clear auto-poll timeout
			if (autoPollTimeoutRef.current) {
				clearTimeout(autoPollTimeoutRef.current);
				autoPollTimeoutRef.current = null;
			}
			
			// Clear intervals
			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current);
				pollingIntervalRef.current = null;
			}
			if (countdownIntervalRef.current) {
				clearInterval(countdownIntervalRef.current);
				countdownIntervalRef.current = null;
			}
			
			// Reset auto-poll flags
			autoPollTriggeredRef.current = false;
			autoPollInitiatedRef.current = false;
		};
	}, [currentStep]); // Re-run cleanup when step changes
	const [introspectionData, setIntrospectionData] = useState<Record<string, unknown> | null>(null);

	// Generate unique IDs for form inputs and modals (accessibility)
	const callbackUrlDisplayId = useId();
	const fragmentUrlInputId = useId();
	const callbackSuccessModalTitleId = useId();

	/**
	 * Filter tokens based on spec version to ensure spec compliance
	 * 
	 * OAuth 2.0/2.1: Only access_token and refresh_token (NO id_token)
	 * OIDC: access_token, id_token, and refresh_token
	 * 
	 * PingOne may return id_token even for OAuth 2.0/2.1 requests because it uses
	 * OpenID for all apps, but we filter it out to follow the spec correctly.
	 */
	const filterTokensBySpec = useCallback((tokens: TokenResponse): TokenResponse => {
		// For OAuth 2.0 and 2.1, remove id_token to follow spec
		if (specVersion === 'oauth2.0' || specVersion === 'oauth2.1') {
			if (tokens.id_token) {
				console.log(
					`${MODULE_TAG} 🔒 SPEC COMPLIANCE: Filtering out id_token for ${specVersion}. ` +
					`OAuth 2.0/2.1 only returns access_token and refresh_token. ` +
					`ID tokens are only part of OIDC (OpenID Connect).`
				);
				const { id_token, ...filteredTokens } = tokens;
				return filteredTokens as TokenResponse;
			}
		}
		// For OIDC, keep all tokens including id_token
		return tokens;
	}, [specVersion]);

	// Helper function to handle token success - skip modal and proceed to next step
	const showTokenSuccessModal = useCallback((tokens: TokenResponse) => {
		console.log(`${MODULE_TAG} ✅ Tokens received - proceeding to next step`);
		
		// Filter tokens based on spec version
		const filteredTokens = filterTokensBySpec(tokens);
		
		// Store tokens in callback details for display (but don't show modal)
		const allParams: Record<string, string> = {
			access_token: filteredTokens.access_token,
			token_type: filteredTokens.token_type || 'Bearer',
			expires_in: String(filteredTokens.expires_in || 3600),
			scope: filteredTokens.scope || credentials.scopes || '',
		};
		if (filteredTokens.id_token) {
			allParams.id_token = filteredTokens.id_token;
		}
		if (filteredTokens.refresh_token) {
			allParams.refresh_token = filteredTokens.refresh_token;
		}

		setCallbackDetails({
			url: '', // No callback URL for direct token requests
			code: '', // No code for direct token requests
			state: '',
			sessionState: '',
			allParams,
		});

		// Skip modal - tokens are already displayed in the flow state
		// Modal was redundant since user can see tokens on the next step
	}, [credentials.scopes, filterTokensBySpec]);

	/**
	 * Fetch UserInfo using OIDC discovery (used across all flows)
	 * 
	 * This function:
	 * 1. Discovers the UserInfo endpoint from OIDC well-known configuration
	 * 2. Falls back to standard PingOne endpoint if discovery fails
	 * 3. Uses backend proxy to avoid CORS issues
	 * 
	 * OIDC Discovery:
	 * - Queries /.well-known/openid-configuration endpoint
	 * - Extracts userinfo_endpoint from the configuration
	 * - This ensures we use the correct endpoint even if PingOne changes it
	 * 
	 * CORS Handling:
	 * - Direct browser requests to PingOne UserInfo endpoint may fail due to CORS
	 * - Backend proxy (/api/pingone/userinfo) forwards the request server-side
	 * - Server-to-server requests don't have CORS restrictions
	 * 
	 * @param accessToken - OAuth access token (Bearer token for UserInfo request)
	 * @param environmentId - PingOne environment ID (used to construct issuer URL)
	 * @returns Promise resolving to user info object or null if fetch fails
	 * 
	 * @example
	 * const userInfo = await fetchUserInfoWithDiscovery(accessToken, environmentId);
	 * if (userInfo) {
	 *   console.log('User email:', userInfo.email);
	 *   console.log('User name:', userInfo.name);
	 * }
	 */
	const fetchUserInfoWithDiscovery = useCallback(
		async (accessToken: string, environmentId: string): Promise<Record<string, unknown> | null> => {
			try {
				/**
				 * Step 1: Discover UserInfo endpoint using OIDC discovery
				 * 
				 * OIDC discovery allows clients to automatically find endpoints
				 * without hardcoding them. This makes the code more resilient to
				 * PingOne configuration changes.
				 */
				const issuerUrl = `https://auth.pingone.com/${environmentId}`;
				const discoveryResult = await OidcDiscoveryServiceV8.discover(issuerUrl);

				let userInfoEndpoint: string;

				/**
				 * Step 2: Determine UserInfo endpoint
				 * 
				 * If discovery succeeds, use the discovered endpoint.
				 * If discovery fails, fall back to standard PingOne endpoint format.
				 * This ensures the function always has a valid endpoint to use.
				 */
				if (!discoveryResult.success || !discoveryResult.data?.userInfoEndpoint) {
					// Fallback to standard PingOne UserInfo endpoint format
					// This is the default endpoint format for PingOne environments
					userInfoEndpoint = `https://auth.pingone.com/${environmentId}/as/userinfo`;
					console.warn(`${MODULE_TAG} Discovery failed, using fallback UserInfo endpoint`, { 
						userInfoEndpoint,
						discoveryError: discoveryResult.error 
					});
				} else {
					userInfoEndpoint = discoveryResult.data.userInfoEndpoint;
					console.log(`${MODULE_TAG} Fetching UserInfo via backend proxy`, { userInfoEndpoint });
				}

				/**
				 * Step 3: Fetch UserInfo via backend proxy
				 * 
				 * Why use a proxy?
				 * - Browser CORS policy may block direct requests to PingOne
				 * - Backend proxy makes server-to-server request (no CORS restrictions)
				 * - Proxy can also add additional security headers if needed
				 * 
				 * The proxy endpoint expects:
				 * - userInfoEndpoint: The discovered or fallback endpoint URL
				 * - accessToken: The OAuth access token to authenticate the request
				 */
				const response = await fetch('/api/pingone/userinfo', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						userInfoEndpoint,
						accessToken,
					}),
				});

				if (!response.ok) {
					const errorText = await response.text();
					let errorBody: { error?: string; message?: string };
					try {
						errorBody = JSON.parse(errorText) as { error?: string; message?: string };
					} catch {
						errorBody = { error: errorText };
					}
					throw new Error(errorBody.error || errorBody.message || `UserInfo request failed: ${response.status} ${response.statusText}`);
				}

				const userInfo = await response.json();
				return userInfo;
			} catch (err) {
				console.warn(`${MODULE_TAG} Failed to fetch UserInfo`, err);
				return null;
			}
		},
		[]
	);

	/**
	 * Restart flow - clears OAuth tokens and flow state (but preserves credentials and worker token)
	 * 
	 * This function is called when the user clicks "Restart Flow" button.
	 * It performs a complete reset of the OAuth flow while preserving:
	 * - User credentials (clientId, clientSecret, environmentId, etc.)
	 * - Worker token (for PingOne API access)
	 * 
	 * What gets cleared:
	 * - OAuth tokens (access_token, id_token, refresh_token)
	 * - Authorization codes
	 * - Device codes and polling state
	 * - PKCE codes (code_verifier, code_challenge)
	 * - Authorization URLs
	 * - UserInfo data
	 * - Flow state (step completion, validation errors, etc.)
	 * - Session storage (all flow-specific temporary data)
	 * 
	 * What gets preserved:
	 * - Credentials (loaded from localStorage via onFlowReset callback)
	 * - Worker token (stored separately, not flow-specific)
	 * 
	 * After restart:
	 * - User is returned to step 0 (configuration)
	 * - All credentials are reloaded from storage
	 * - User can start the flow again with the same or updated credentials
	 * 
	 * @callback
	 */
	const handleRestartFlow = useCallback(() => {
		console.log(
			`${MODULE_TAG} Restarting flow - clearing OAuth tokens and flow state (preserving credentials and worker token)`
		);

		/**
		 * Step 1: Clear React flow state
		 * 
		 * This clears all OAuth-related state in the component:
		 * - Tokens (access, ID, refresh)
		 * - Authorization codes
		 * - Device codes
		 * - PKCE codes
		 * - Authorization URLs
		 * - UserInfo
		 * - Callback data
		 * - Token introspection data
		 */
		setFlowState({});
		
		// Clear token introspection and UserInfo state
		setIntrospectionData(null);
		setUserInfoLoading(false);
		setUserInfoError(null);
		setIntrospectionLoading(false);
		setIntrospectionError(null);

		/**
		 * Step 2: Clear session storage
		 * 
		 * Session storage contains temporary flow-specific data that should
		 * not persist across flow restarts. This includes:
		 * - PKCE codes (stored in multiple locations for redundancy)
		 * - Callback data (authorization codes, state parameters)
		 * - Implicit flow tokens (extracted from URL fragment)
		 * - Device code data (device_code, user_code, polling state)
		 * - Client credentials tokens (if flow was completed)
		 * 
		 * Note: Credentials are NOT stored in sessionStorage, they're in localStorage
		 * and are preserved across restarts.
		 */
		PKCEStorageServiceV8U.clearPKCECodes(flowKey).catch((err) => {
			console.error(`${MODULE_TAG} Failed to clear PKCE codes from all storage`, err);
		});
		sessionStorage.removeItem('v8u_callback_data');
		sessionStorage.removeItem('v8u_implicit_tokens');
		sessionStorage.removeItem('v8u_device_code_data');
		sessionStorage.removeItem('v8u_client_credentials_tokens');
		console.log(`${MODULE_TAG} Cleared sessionStorage (all flow-specific data)`);

		/**
		 * Step 3: Reset navigation to step 0
		 * 
		 * Returns user to the configuration step where they can:
		 * - Review/update credentials
		 * - Change flow type or spec version
		 * - Start a new flow
		 */
		reset();

		/**
		 * Step 4: Clear validation and error state
		 * 
		 * Removes any error messages, validation errors, warnings, and
		 * step completion markers so the user starts with a clean slate.
		 */
		setError(null);
		setValidationErrorsState([]);
		setValidationWarningsState([]);
		setCompletedSteps([]);

		/**
		 * Step 5: Notify parent to reload credentials
		 * 
		 * The parent component (UnifiedOAuthFlowV8U) handles credential persistence.
		 * This callback triggers a reload of credentials from localStorage, ensuring
		 * the user's saved credentials are restored after the restart.
		 * 
		 * This is important because:
		 * - Credentials might have been updated in another tab/window
		 * - Credentials are stored separately from flow state
		 * - We want to ensure we have the latest saved credentials
		 */
		if (onFlowReset) {
			console.log(`${MODULE_TAG} Notifying parent to reload credentials from storage`);
			onFlowReset();
		}

		// Show success toast
		toastV8.success(
			'Flow restarted - OAuth tokens and state cleared (credentials and worker token preserved)'
		);

		console.log(
			`${MODULE_TAG} Flow restarted successfully - OAuth tokens and state cleared, credentials and worker token preserved`
		);
	}, [reset, setValidationErrorsState, setValidationWarningsState, onFlowReset, flowKey]);

	// Notify parent of step changes
	useEffect(() => {
		if (onStepChange) {
			onStepChange(currentStep);
		}
	}, [currentStep, onStepChange]);

	// Notify parent of completed steps changes
	useEffect(() => {
		if (onCompletedStepsChange) {
			onCompletedStepsChange(completedSteps);
		}
	}, [completedSteps, onCompletedStepsChange]);

	// Note: nav object is already created above using useMemo - duplicate removed

	// Save credentials on change (validation removed per user request - was showing false positives)
	useEffect(() => {
		const credsForSave = credentials as unknown as Parameters<
			typeof CredentialsServiceV8.saveCredentials
		>[1];
		CredentialsServiceV8.saveCredentials(`${flowType}-v8u`, credsForSave);
	}, [credentials, flowType]);

	// Validate step 0 (credentials) and mark complete when all required fields are filled
	useEffect(() => {
		if (currentStep === 0) {
			const errors: string[] = [];

			// Always required
			if (!credentials.environmentId?.trim()) {
				errors.push('Please provide an Environment ID in the configuration above.');
			}
			if (!credentials.clientId?.trim()) {
				errors.push('Please provide a Client ID in the configuration above.');
			}

			// Flow-specific required fields
			const needsRedirectUri = ['oauth-authz', 'implicit', 'hybrid'].includes(flowType);
			if (needsRedirectUri && !credentials.redirectUri?.trim()) {
				errors.push('Please provide a Redirect URI in the configuration above.');
			}

			const needsScopes = true; // All flows need scopes
			if (needsScopes && !credentials.scopes?.trim()) {
				errors.push('Please provide at least one scope in the configuration above.');
			}

			// Client secret required for client credentials flow
			if (flowType === 'client-credentials') {
				if (!credentials.clientSecret?.trim()) {
					errors.push('Please provide a Client Secret in the configuration above. This flow requires confidential client credentials.');
				}
			} else {
				// Client secret may be required depending on auth method and PKCE usage for other flows
				// PKCE allows public clients (no client secret) for authorization code flow
				const needsClientSecret =
					credentials.clientAuthMethod &&
					['client_secret_basic', 'client_secret_post', 'client_secret_jwt'].includes(
						credentials.clientAuthMethod
					) &&
					!isPKCERequired; // Client secret not required when using PKCE
				if (needsClientSecret && !credentials.clientSecret?.trim()) {
					errors.push(
						'Please provide a Client Secret for the selected authentication method, or enable PKCE for a public client flow.'
					);
				}
			}

			// Update validation errors
			setValidationErrorsState(errors);

			// Mark step as complete if no errors
			if (errors.length === 0 && !completedSteps.includes(0)) {
				console.log(`${MODULE_TAG} Step 0 validation passed - marking as complete`);
				setCompletedSteps((prev) => [...prev, 0]);
			} else if (errors.length > 0 && completedSteps.includes(0)) {
				// Remove from completed steps if errors appear
				console.log(`${MODULE_TAG} Step 0 validation failed - removing from completed steps`);
				setCompletedSteps((prev) => prev.filter((step) => step !== 0));
			}
		}
	}, [currentStep, credentials, flowType, completedSteps, setValidationErrorsState]);

	// Validate step 1 (PKCE) for oauth-authz and hybrid flows
	// Validation is conditional based on PKCE enforcement level
	useEffect(() => {
		// Always validate PKCE step for oauth-authz and hybrid flows
		if (currentStep === 1 && (flowType === 'oauth-authz' || flowType === 'hybrid')) {
			const errors: string[] = [];

			// PKCE codes are required only if enforcement is REQUIRED or S256_REQUIRED
			// If OPTIONAL, codes are not required but can still be generated
			if (isPKCERequired) {
				if (!flowState.codeVerifier?.trim()) {
					errors.push('PKCE Code Verifier is missing. Please generate PKCE codes in the configuration step.');
				}
				if (!flowState.codeChallenge?.trim()) {
					errors.push('PKCE Code Challenge is missing. Please generate PKCE codes in the configuration step.');
				}
			}

			// Update validation errors
			setValidationErrorsState(errors);

			// Mark step as complete if:
			// - No errors AND codes are present (when required), OR
			// - PKCE is optional (can proceed without codes)
			const canProceed =
				isPKCERequired
					? errors.length === 0 && flowState.codeVerifier && flowState.codeChallenge
					: errors.length === 0; // Optional: can proceed even without codes

			if (canProceed && !completedSteps.includes(1)) {
				console.log(`${MODULE_TAG} Step 1 (PKCE) validation passed - marking as complete`);
				setCompletedSteps((prev) => [...prev, 1]);
			} else if (errors.length > 0 && completedSteps.includes(1)) {
				// Remove from completed steps if codes are missing
				console.log(
					`${MODULE_TAG} Step 1 (PKCE) validation failed - removing from completed steps`
				);
				setCompletedSteps((prev) => prev.filter((step) => step !== 1));
			}
		}
	}, [
		currentStep,
		flowType,
		flowState.codeVerifier,
		flowState.codeChallenge,
		completedSteps,
		setValidationErrorsState,
	]);

	// Ensure credentials and PKCE codes are loaded when on token exchange step (in case they were lost during redirect)
	// Note: The parent component (UnifiedOAuthFlowV8U) handles credential loading from storage
	// This effect restores PKCE codes from sessionStorage and validates readiness for token exchange
	useEffect(() => {
		if (currentStep === 4 && (flowType === 'oauth-authz' || flowType === 'hybrid')) {
			// REMOVED: Auto-restoration of PKCE codes
			// Users should manually generate PKCE codes in Step 1 - this is an educational tool

			// CRITICAL DEBUG: Log what we're checking
			console.log(`${MODULE_TAG} ========== TOKEN EXCHANGE VALIDATION DEBUG ==========`);
			console.log(`${MODULE_TAG} Current Step:`, currentStep);
			console.log(`${MODULE_TAG} Flow Type:`, flowType);
			console.log(`${MODULE_TAG} Credentials at validation time:`, {
				environmentId: credentials.environmentId || 'MISSING',
				clientId: credentials.clientId || 'MISSING',
				hasClientSecret: credentials.clientSecret !== undefined,
				redirectUri: credentials.redirectUri || 'MISSING',
				usePKCE: isPKCERequired,
				pkceEnforcement: credentials.pkceEnforcement,
				allKeys: Object.keys(credentials),
			});
			console.log(`${MODULE_TAG} Flow State:`, {
				hasAuthorizationCode: !!flowState.authorizationCode,
				authorizationCode: `${flowState.authorizationCode?.substring(0, 30)}...`,
				hasCodeVerifier: !!flowState.codeVerifier,
				codeVerifier: `${flowState.codeVerifier?.substring(0, 30)}...`,
				hasCodeChallenge: !!flowState.codeChallenge,
			});

			// Validate readiness for token exchange - check all required fields
			const errors: string[] = [];

			if (!flowState.authorizationCode) {
				errors.push('Authorization code is required. Please complete the callback step first.');
			}

			// CRITICAL: If PKCE is enabled, we MUST have a code verifier
			// Check both flowState and bulletproof storage (storage is source of truth)
			if (isPKCERequired) {
				let hasCodeVerifier = !!flowState.codeVerifier;

				// Check bulletproof storage if flowState doesn't have it
				if (!hasCodeVerifier) {
					const storedPKCE = PKCEStorageServiceV8U.loadPKCECodes(flowKey);
					hasCodeVerifier = !!storedPKCE?.codeVerifier;
				}

				if (!hasCodeVerifier) {
					errors.push(
						'PKCE is enabled but code verifier is missing. Please go back to Step 1 (PKCE) to generate PKCE codes, or disable PKCE in the configuration.'
					);
				}
			}

			if (!credentials.clientId || !credentials.clientId.trim()) {
				errors.push('Client ID is required for token exchange. Please check your configuration.');
			}

			if (!credentials.environmentId || !credentials.environmentId.trim()) {
				errors.push(
					'Environment ID is required for token exchange. Please check your configuration.'
				);
			}

			// Redirect URI is only required when PKCE is NOT enabled
			if (!isPKCERequired && (!credentials.redirectUri || !credentials.redirectUri.trim())) {
				errors.push(
					'Redirect URI is required for token exchange. Please check your configuration.'
				);
			}

			console.log(`${MODULE_TAG} Validation Errors Found:`, errors.length);
			// Set validation errors if any are found
			if (errors.length > 0) {
				console.warn(`${MODULE_TAG} Missing required fields on token exchange step`, {
					usePKCE: isPKCERequired,
					pkceEnforcement: credentials.pkceEnforcement,
					hasAuthorizationCode: !!flowState.authorizationCode,
					authorizationCode: `${flowState.authorizationCode?.substring(0, 20)}...`,
					hasCodeVerifier: !!flowState.codeVerifier,
					codeVerifier: `${flowState.codeVerifier?.substring(0, 20)}...`,
					hasClientId: !!credentials.clientId,
					clientId: credentials.clientId,
					hasEnvironmentId: !!credentials.environmentId,
					environmentId: credentials.environmentId,
					hasRedirectUri: !!credentials.redirectUri,
					redirectUri: credentials.redirectUri,
					errors,
				});
				setValidationErrorsState(errors);
			} else {
				// Clear errors if all required fields are present
				console.log(`${MODULE_TAG} ✅ All validation checks passed`);
				setValidationErrorsState([]);
			}
			console.log(`${MODULE_TAG} ========== TOKEN EXCHANGE VALIDATION DEBUG END ==========`);
		}
	}, [
		currentStep,
		flowType,
		credentials,
		flowState.authorizationCode,
		flowState.codeVerifier,
		flowState.codeChallenge,
		setValidationErrorsState,
		flowKey,
	]);

	// CRITICAL: Persist PKCE codes using bulletproof storage service whenever they change in flowState
	// This ensures codes survive navigation and page refreshes with quadruple redundancy
	useEffect(() => {
		if (flowState.codeVerifier && flowState.codeChallenge) {
			PKCEStorageServiceV8U.savePKCECodes(flowKey, {
				codeVerifier: flowState.codeVerifier,
				codeChallenge: flowState.codeChallenge,
				codeChallengeMethod: 'S256',
			});
		}
	}, [flowState.codeVerifier, flowState.codeChallenge, flowKey]);

	// Auto-mark token step complete when tokens are available
	useEffect(() => {
		if (flowState.tokens?.accessToken) {
				// Determine which step is the token display step based on flow type
				let tokenStep = -1;
				if (flowType === 'client-credentials') {
					tokenStep = 2; // Step 3 (0-indexed: 0, 1, 2)
				} else if (flowType === 'device-code' || flowType === 'implicit') {
					tokenStep = 3; // Step 4 (0-indexed: 0, 1, 2, 3)
				} else if (flowType === 'oauth-authz' || flowType === 'hybrid') {
					tokenStep = isPKCERequired ? 5 : 4; // Step 6 or 5 depending on PKCE
				}

				// Mark the token step as complete if tokens are available
				if (tokenStep >= 0 && !completedSteps.includes(tokenStep)) {
					console.log(`${MODULE_TAG} Tokens available - auto-marking step ${tokenStep} as complete`, {
						flowType,
						tokenStep,
						hasTokens: !!flowState.tokens?.accessToken,
					});
					setCompletedSteps((prev) => [...prev, tokenStep]);
				}
			}
		}, [flowState.tokens?.accessToken, flowType, isPKCERequired, completedSteps]);

	// Also mark current step as complete if we're on the tokens step and tokens are available
	useEffect(() => {
			if (flowState.tokens?.accessToken) {
				// Determine which step is the token display step based on flow type
				let tokenStep = -1;
				if (flowType === 'client-credentials') {
					tokenStep = 2; // Step 3 (0-indexed: 0, 1, 2)
				} else if (flowType === 'device-code' || flowType === 'implicit') {
					tokenStep = 3; // Step 4 (0-indexed: 0, 1, 2, 3)
				} else if (flowType === 'oauth-authz' || flowType === 'hybrid') {
					tokenStep = isPKCERequired ? 5 : 4; // Step 6 or 5 depending on PKCE
				}

				// If we're currently on the tokens step and it's not marked complete, mark it
				if (currentStep === tokenStep && !completedSteps.includes(currentStep)) {
					console.log(`${MODULE_TAG} On tokens step with tokens available - marking step ${currentStep} as complete`);
					nav.markStepComplete();
				}
			}
		}, [flowState.tokens?.accessToken, currentStep, flowType, isPKCERequired, completedSteps, nav]);

	// CRITICAL: Save tokens to sessionStorage when extracted (all flows that receive tokens)
	useEffect(() => {
		if (flowState.tokens?.accessToken) {
			const tokenStorageKey =
				flowType === 'implicit' || flowType === 'hybrid'
					? 'v8u_implicit_tokens'
					: `v8u_${flowType}_tokens`;

			try {
				sessionStorage.setItem(
					tokenStorageKey,
					JSON.stringify({
						...flowState.tokens,
						extractedAt: Date.now(),
						flowType,
					})
				);
				console.log(`${MODULE_TAG} Tokens auto-saved to sessionStorage`, {
					flowType,
					hasAccessToken: !!flowState.tokens.accessToken,
					hasIdToken: !!flowState.tokens.idToken,
					hasRefreshToken: !!flowState.tokens.refreshToken,
				});
			} catch (err) {
				console.error(`${MODULE_TAG} Failed to save tokens to sessionStorage`, err);
			}
		}
	}, [flowState.tokens, flowType]);

	// CRITICAL: Save device code data to sessionStorage (device code flow)
	useEffect(() => {
		if (flowType === 'device-code' && flowState.deviceCode) {
			try {
				sessionStorage.setItem(
					'v8u_device_code_data',
					JSON.stringify({
						deviceCode: flowState.deviceCode,
						userCode: flowState.userCode,
						verificationUri: flowState.verificationUri,
						verificationUriComplete: flowState.verificationUriComplete,
						deviceCodeExpiresIn: flowState.deviceCodeExpiresIn,
						savedAt: Date.now(),
					})
				);
				console.log(`${MODULE_TAG} Device code data auto-saved to sessionStorage`, {
					hasDeviceCode: !!flowState.deviceCode,
					hasUserCode: !!flowState.userCode,
					hasVerificationUri: !!flowState.verificationUri,
				});
			} catch (err) {
				console.error(`${MODULE_TAG} Failed to save device code data to sessionStorage`, err);
			}
		}
	}, [
		flowState.deviceCode,
		flowState.userCode,
		flowState.verificationUri,
		flowState.deviceCodeExpiresIn,
		flowType,
	]);

	// CRITICAL: Save authorization code to sessionStorage when extracted (to prevent loss during redirects)
	useEffect(() => {
		if (flowState.authorizationCode && (flowType === 'oauth-authz' || flowType === 'hybrid')) {
			try {
				// Get existing callback data or create new
				const existingCallbackData = sessionStorage.getItem('v8u_callback_data');
				let callbackData: Record<string, unknown> = {};

				if (existingCallbackData) {
					try {
						callbackData = JSON.parse(existingCallbackData);
					} catch {
						// Ignore parse errors, create new object
					}
				}

				// Update with extracted authorization code
				callbackData.code = flowState.authorizationCode;
				callbackData.extractedCode = flowState.authorizationCode;
				callbackData.codeExtractedAt = Date.now();
				if (flowState.state) {
					callbackData.state = flowState.state;
				}

				sessionStorage.setItem('v8u_callback_data', JSON.stringify(callbackData));
				console.log(`${MODULE_TAG} Authorization code auto-saved to sessionStorage`, {
					hasCode: !!flowState.authorizationCode,
					hasState: !!flowState.state,
				});
			} catch (err) {
				console.error(`${MODULE_TAG} Failed to save authorization code to sessionStorage`, err);
			}
		}
	}, [flowState.authorizationCode, flowState.state, flowType]);

	// REMOVED: Auto-restoration of PKCE codes
	// Users should manually generate PKCE codes by clicking the "Generate PKCE Parameters" button
	// This is an educational tool - users need to learn the steps themselves

	// Auto-detect callback URL with authorization code when on step 3 (callback handling step)
	// For hybrid flow, also check for tokens in fragment
	// Check both sessionStorage (set by CallbackHandlerV8U) AND window.location.search/fragment directly
	// Then automatically parse and extract the code (and tokens for hybrid)
	useEffect(() => {
		// Only run on step 3 (callback handling step) for authorization code and hybrid flows
		if (currentStep === 3 && (flowType === 'oauth-authz' || flowType === 'hybrid')) {
			console.log(`${MODULE_TAG} Step 3 mounted - checking for callback data`, { flowType });

			let callbackUrl: string | null = null;
			let detectedCode: string | null = null;
			let detectedState: string | null = null;
			let hasFragment = false;
			let fragmentTokens: { access_token?: string; id_token?: string } | null = null;

			// For hybrid flow, check fragment first (tokens come in fragment)
			if (flowType === 'hybrid' && !flowState.tokens?.accessToken) {
				const fragment = window.location.hash.substring(1);
				if (fragment && (fragment.includes('access_token') || fragment.includes('id_token'))) {
					console.log(`${MODULE_TAG} Hybrid flow: Fragment detected in URL`, {
						fragmentLength: fragment.length,
					});
					hasFragment = true;

					try {
						// Parse fragment for tokens
						const fragmentResult = UnifiedFlowIntegrationV8U.parseCallbackFragment(
							'hybrid',
							window.location.href,
							flowState.state || ''
						);

						const accessToken = (fragmentResult as { access_token?: string }).access_token;
						const idToken = (fragmentResult as { id_token?: string }).id_token;
						if (accessToken || idToken) {
							fragmentTokens = {};
							if (accessToken) {
								fragmentTokens.access_token = accessToken;
							}
							if (idToken) {
								fragmentTokens.id_token = idToken;
							}
						}

						console.log(`${MODULE_TAG} Hybrid flow: Tokens extracted from fragment`, {
							hasAccessToken: !!fragmentTokens?.access_token,
							hasIdToken: !!fragmentTokens?.id_token,
						});
					} catch (err) {
						console.error(`${MODULE_TAG} Failed to parse fragment for hybrid flow`, err);
					}
				}
			}

			// First, try sessionStorage (set by CallbackHandlerV8U if callback goes through /authz-callback)
			const callbackDataStr = sessionStorage.getItem('v8u_callback_data');
			console.log(`${MODULE_TAG} Checking sessionStorage`, { hasData: !!callbackDataStr });

			if (callbackDataStr) {
				try {
					const callbackData = JSON.parse(callbackDataStr);
					console.log(`${MODULE_TAG} Found callback data in sessionStorage`, callbackData);

					if (callbackData.code) {
						callbackUrl = callbackData.fullUrl || window.location.href;
						detectedCode = callbackData.code;
						detectedState = callbackData.state;
						console.log(`${MODULE_TAG} Extracted from sessionStorage`, {
							code: detectedCode,
							state: detectedState,
						});
						// Don't remove from sessionStorage yet - we'll do it after parsing
					}
				} catch (err) {
					console.error(`${MODULE_TAG} Failed to parse callback data from sessionStorage`, err);
				}
			}

			// Fallback: Check window.location.search directly (callback might go directly to this page)
			if (!detectedCode) {
				const urlParams = new URLSearchParams(window.location.search);
				const code = urlParams.get('code');
				const state = urlParams.get('state');

				console.log(`${MODULE_TAG} Checking URL params`, { hasCode: !!code, hasState: !!state });

				if (code) {
					console.log(`${MODULE_TAG} Found authorization code in URL params`);
					callbackUrl = window.location.href;
					detectedCode = code;
					detectedState = state;

					// Clean up URL parameters after detection
					const cleanUrl = new URL(window.location.href);
					cleanUrl.searchParams.delete('code');
					cleanUrl.searchParams.delete('state');
					window.history.replaceState({}, document.title, cleanUrl.toString());
				}
			}

			// For hybrid flow: Extract both authorization code and tokens
			if (flowType === 'hybrid') {
				const updates: Partial<FlowState> = {};
				let hasUpdates = false;

				// Extract authorization code if found
				if (detectedCode && callbackUrl && !flowState.authorizationCode) {
					try {
						const parsed = UnifiedFlowIntegrationV8U.parseCallbackUrl(
							callbackUrl,
							flowState.state || detectedState || ''
						);

						updates.authorizationCode = parsed.code;
						if (detectedState) {
							updates.state = detectedState;
						}
						hasUpdates = true;
						console.log(`${MODULE_TAG} Hybrid flow: Authorization code extracted`, {
							code: parsed.code,
						});
					} catch (err) {
						console.error(`${MODULE_TAG} Failed to parse authorization code for hybrid flow`, err);
					}
				}

				// Extract tokens from fragment if found
				if (fragmentTokens && !flowState.tokens?.accessToken) {
					const tokens: NonNullable<FlowState['tokens']> = {
						accessToken: fragmentTokens.access_token || flowState.tokens?.accessToken || '',
						expiresIn: 3600,
					};
					if (fragmentTokens.id_token) {
						tokens.idToken = fragmentTokens.id_token;
					}
					updates.tokens = tokens;
					hasUpdates = true;

					// Save tokens to sessionStorage
					try {
						sessionStorage.setItem(
							'v8u_implicit_tokens',
							JSON.stringify({
								...tokens,
								extractedAt: Date.now(),
							})
						);
						console.log(`${MODULE_TAG} Hybrid flow: Tokens saved to sessionStorage`);
					} catch (err) {
						console.error(`${MODULE_TAG} Failed to save hybrid tokens to sessionStorage`, err);
					}
				}

				// Update state if we have updates
				if (hasUpdates) {
					setFlowState((prev) => ({ ...prev, ...updates }));
					nav.markStepComplete();

					if (updates.authorizationCode && updates.tokens) {
						toastV8.success('Authorization code and tokens extracted automatically!');
					} else if (updates.authorizationCode) {
						toastV8.success('Authorization code extracted automatically!');
					} else if (updates.tokens) {
						toastV8.success('Tokens extracted automatically!');
					}

					// Clean up sessionStorage
					if (callbackDataStr) {
						sessionStorage.removeItem('v8u_callback_data');
					}

					console.log(
						`${MODULE_TAG} Hybrid flow: Callback data extracted and step marked complete`
					);
					return;
				}
			}

			// For authorization code flow: Extract authorization code only
			if (
				flowType === 'oauth-authz' &&
				detectedCode &&
				callbackUrl &&
				!flowState.authorizationCode
			) {
				console.log(`${MODULE_TAG} Auto-parsing callback URL and extracting code`, { callbackUrl });

				try {
					// Parse the callback URL to extract the authorization code
					const parsed = UnifiedFlowIntegrationV8U.parseCallbackUrl(
						callbackUrl,
						flowState.state || detectedState || ''
					);

					console.log(`${MODULE_TAG} Successfully parsed callback`, { extractedCode: parsed.code });

					// Extract all parameters from callback URL
					const url = new URL(callbackUrl);
					const allParams: Record<string, string> = {};
					url.searchParams.forEach((value, key) => {
						allParams[key] = value;
					});

					// Store callback details for modal
					setCallbackDetails({
						url: callbackUrl,
						code: parsed.code,
						...(detectedState && { state: detectedState }),
						...(allParams.session_state && { sessionState: allParams.session_state }),
						allParams,
					});

					// Update flow state with the extracted code
					setFlowState((prev) => ({
						...prev,
						authorizationCode: parsed.code,
						...(detectedState ? { state: detectedState } : prev.state ? { state: prev.state } : {}),
					}));

					// Auto-mark step complete so success banner shows
					nav.markStepComplete();

					// Show success modal with callback details
					setShowCallbackSuccessModal(true);
					toastV8.success('✅ Callback URL parsed automatically! Authorization code extracted.');

					// Clean up sessionStorage
					if (callbackDataStr) {
						sessionStorage.removeItem('v8u_callback_data');
					}

					console.log(`${MODULE_TAG} Authorization code extracted - showing success modal`);
				} catch (err) {
					console.error(`${MODULE_TAG} Failed to auto-parse callback URL`, err);
					// If auto-parsing fails, just set the URL so user can manually parse
					setFlowState((prev) => ({
						...prev,
						authorizationCode: callbackUrl,
						...(detectedState ? { state: detectedState } : prev.state ? { state: prev.state } : {}),
					}));
					toastV8.warning('Callback URL detected - click "Parse Callback URL" to continue');
				}
			} else if (!detectedCode && !hasFragment) {
				console.log(`${MODULE_TAG} No callback data found - user will need to paste URL manually`);
			}
		}
	}, [currentStep, flowType, flowState.authorizationCode, flowState.tokens, flowState.state, nav]);

	// Step 2: Parse Fragment handler (moved to top level to fix React hooks error)
	const handleParseFragment = useCallback(async () => {
		console.log(`${MODULE_TAG} Parsing callback fragment`);
		setIsLoading(true);
		setError(null);

		try {
			const fragment = window.location.hash.substring(1);
			if (!fragment) {
				// Use manual input
				if (!flowState.authorizationCode) {
					throw new Error('No fragment found in URL and no callback URL provided');
				}
				// Parse from input
				const result = UnifiedFlowIntegrationV8U.parseCallbackFragment(
					flowType as 'implicit' | 'hybrid',
					flowState.authorizationCode,
					flowState.state || '',
					flowState.nonce
				);

				const resultWithToken = result as { access_token: string; id_token?: string };
				const tokens: NonNullable<FlowState['tokens']> = {
					accessToken: resultWithToken.access_token,
					expiresIn: 3600,
				};
				if (resultWithToken.id_token) {
					tokens.idToken = resultWithToken.id_token;
				}
				setFlowState((prev) => ({
					...prev,
					tokens,
				}));
			} else {
				// Parse from URL fragment
				const result = UnifiedFlowIntegrationV8U.parseCallbackFragment(
					flowType as 'implicit' | 'hybrid',
					window.location.href,
					flowState.state || '',
					flowState.nonce
				);

				const resultWithToken = result as { 
					access_token: string; 
					id_token?: string; 
					token_type?: string;
					expires_in?: number;
					scope?: string;
					state?: string;
				};
				const tokens: NonNullable<FlowState['tokens']> = {
					accessToken: resultWithToken.access_token,
					expiresIn: resultWithToken.expires_in || 3600,
				};
				if (resultWithToken.id_token) {
					tokens.idToken = resultWithToken.id_token;
				}
				setFlowState((prev) => ({
					...prev,
					tokens,
				}));

				// Extract all parameters from fragment for success modal
				const fragmentParams = new URLSearchParams(fragment);
				const allParams: Record<string, string> = {};
				fragmentParams.forEach((value, key) => {
					allParams[key] = value;
				});

				// Set callback details for success modal
				setCallbackDetails({
					url: window.location.href,
					code: '', // No code in implicit flow
					state: resultWithToken.state || '',
					sessionState: allParams.session_state || '',
					allParams,
				});

				// Show success modal with token details
				console.log(`${MODULE_TAG} 🎉 SHOWING SUCCESS MODAL`, {
					hasCallbackDetails: !!callbackDetails,
					allParamsKeys: Object.keys(allParams),
					accessToken: allParams.access_token ? `${allParams.access_token.substring(0, 20)}...` : 'MISSING',
					idToken: allParams.id_token ? 'PRESENT' : 'MISSING',
				});
				setShowCallbackSuccessModal(true);

				// CRITICAL: Save tokens to sessionStorage to prevent loss during redirects/page refreshes
				try {
					sessionStorage.setItem(
						'v8u_implicit_tokens',
						JSON.stringify({
							...tokens,
							extractedAt: Date.now(),
						})
					);
					console.log(`${MODULE_TAG} Tokens saved to sessionStorage`, {
						hasAccessToken: !!tokens.accessToken,
						hasIdToken: !!tokens.idToken,
					});
				} catch (err) {
					console.error(`${MODULE_TAG} Failed to save tokens to sessionStorage`, err);
				}

				// Fetch UserInfo if OIDC and access token available (using OIDC discovery)
				if (specVersion === 'oidc' && tokens.accessToken) {
					try {
						const userInfo = await fetchUserInfoWithDiscovery(
							tokens.accessToken,
							credentials.environmentId
						);

						if (userInfo) {
							setFlowState((prev) => ({ ...prev, userInfo }));
							toastV8.userInfoFetched();

							// Show success modal with user information
							setShowUserInfoModal(true);
						} else if (tokens.idToken) {
							// Still show modal if we have ID token with user info
							setShowUserInfoModal(true);
						}
					} catch (err) {
						console.warn(`${MODULE_TAG} Failed to fetch UserInfo`, err);

						// Still show modal if we have ID token with user info
						if (tokens.idToken) {
							setShowUserInfoModal(true);
						}
					}
				} else if (tokens.idToken) {
					// If we have ID token but no UserInfo, show modal with ID token data
					setShowUserInfoModal(true);
				}
			}
			nav.markStepComplete();
			toastV8.tokenExchangeSuccess();
			toastV8.stepCompleted(2);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to parse callback fragment';
			setError(message);
			nav.setValidationErrors([message]);
			toastV8.error(message);
		} finally {
			setIsLoading(false);
		}
	}, [
		flowType,
		flowState.authorizationCode,
		flowState.state,
		flowState.nonce,
		nav,
		credentials.environmentId,
		specVersion,
		fetchUserInfoWithDiscovery,
	]);

	// CRITICAL: Auto-parse fragment on step 2 mount (implicit/hybrid flows) - like authz code auto-detection
	// This ensures tokens are extracted immediately when user lands on fragment step after redirect
	useEffect(() => {
		// Only run on step 2 (fragment parsing step) for implicit/hybrid flows
		// And only if we haven't already extracted tokens
		if (
			currentStep === 2 &&
			(flowType === 'implicit' || flowType === 'hybrid') &&
			!flowState.tokens?.accessToken
		) {
			console.log(
				`${MODULE_TAG} Step 2 mounted for implicit/hybrid flow - checking for fragment in URL`
			);

			// CRITICAL: Load callback data from sessionStorage to restore state
			// This is set by CallbackHandlerV8U when redirecting from the callback URL
			const callbackDataStr = sessionStorage.getItem('v8u_callback_data');
			let restoredState = flowState.state;
			
			if (callbackDataStr) {
				try {
					const callbackData = JSON.parse(callbackDataStr);
					console.log(`${MODULE_TAG} Restoring callback data from sessionStorage`, {
						hasState: !!callbackData.state,
						flowType: callbackData.flowType,
					});
					// Restore state from callback data (needed for fragment validation)
					if (callbackData.state) {
						restoredState = callbackData.state;
						if (!flowState.state) {
							setFlowState((prev) => ({
								...prev,
								state: callbackData.state,
							}));
						}
					}
				} catch (err) {
					console.error(`${MODULE_TAG} Failed to parse callback data from sessionStorage`, err);
				}
			}

			const fragment = window.location.hash.substring(1);

			// Check if fragment contains tokens
			if (fragment && (fragment.includes('access_token') || fragment.includes('id_token'))) {
				console.log(`${MODULE_TAG} 🎯 Fragment detected in URL - auto-parsing tokens`, {
					fragmentLength: fragment.length,
					fragmentPreview: `${fragment.substring(0, 100)}...`,
					currentStep,
					flowType,
					hasState: !!restoredState,
				});

				try {
					// Auto-parse the fragment immediately using restored state from sessionStorage
					// This avoids timing issues with React state updates
					const result = UnifiedFlowIntegrationV8U.parseCallbackFragment(
						flowType as 'implicit' | 'hybrid',
						window.location.href,
						restoredState || '',
						flowState.nonce
					);

					const resultWithToken = result as { 
						access_token: string; 
						id_token?: string; 
						token_type?: string;
						expires_in?: number;
						scope?: string;
						state?: string;
					};
					const tokens: NonNullable<FlowState['tokens']> = {
						accessToken: resultWithToken.access_token,
						expiresIn: resultWithToken.expires_in || 3600,
					};
					if (resultWithToken.id_token) {
						tokens.idToken = resultWithToken.id_token;
					}
					setFlowState((prev) => {
						const newState = resultWithToken.state || restoredState || prev.state;
						return {
							...prev,
							tokens,
							...(newState && { state: newState }),
						};
					});

					// Extract all parameters from fragment for success modal
					const fragmentParams = new URLSearchParams(fragment);
					const allParams: Record<string, string> = {};
					fragmentParams.forEach((value, key) => {
						allParams[key] = value;
					});

					// Set callback details for success modal
					setCallbackDetails({
						url: window.location.href,
						code: '',
						state: resultWithToken.state || restoredState || '',
						sessionState: allParams.session_state || '',
						allParams,
					});

					// Show success modal
					setShowCallbackSuccessModal(true);

					// Save tokens to sessionStorage
					try {
						sessionStorage.setItem(
							'v8u_implicit_tokens',
							JSON.stringify({
								...tokens,
								extractedAt: Date.now(),
							})
						);
					} catch (err) {
						console.error(`${MODULE_TAG} Failed to save tokens to sessionStorage`, err);
					}

					nav.markStepComplete();
					toastV8.success('Tokens extracted automatically from URL fragment');
				} catch (err) {
					console.error(`${MODULE_TAG} ❌ Failed to auto-parse fragment`, err);
					// Fall back to manual parsing via handleParseFragment
					handleParseFragment();
				}
			} else {
				// Check sessionStorage for previously extracted tokens
				const storedTokens = sessionStorage.getItem('v8u_implicit_tokens');
				if (storedTokens) {
					try {
						const tokens = JSON.parse(storedTokens);
						console.log(`${MODULE_TAG} Restoring tokens from sessionStorage on step 2`, {
							hasAccessToken: !!tokens.accessToken,
						});
						setFlowState((prev) => ({
							...prev,
							tokens,
						}));
						nav.markStepComplete();
						toastV8.success('Tokens restored from previous session');
					} catch (err) {
						console.error(`${MODULE_TAG} Failed to restore tokens from sessionStorage`, err);
					}
				}
			}
		}
	}, [currentStep, flowType, flowState.tokens?.accessToken, flowState.state, handleParseFragment, nav]);

	// Step labels based on flow type
	const getStepLabels = (): string[] => {
		switch (flowType) {
			case 'client-credentials':
				return ['Configure', 'Request Token', 'Tokens', 'Introspection & UserInfo'];
			case 'device-code':
				return [
					'Configure',
					'Device Authorization',
					'Poll for Tokens',
					'Tokens',
					'Introspection & UserInfo',
				];
			case 'implicit':
				return [
					'Configure',
					'Authorization URL',
					'Parse Fragment',
					'Tokens',
					'Introspection & UserInfo',
				];
			case 'hybrid':
				// Hybrid flow with PKCE: Config → PKCE → Auth URL → Parse Callback → Exchange → Tokens → Introspection
				// Hybrid flow without PKCE: Config → Auth URL → Parse Callback → Exchange → Tokens → Introspection
				if (isPKCERequired) {
					return [
						'Configure',
						'PKCE Parameters',
						'Authorization URL',
						'Parse Callback',
						'Exchange',
						'Tokens',
						'Introspection & UserInfo',
					];
				}
				return [
					'Configure',
					'Authorization URL',
					'Parse Callback',
					'Exchange',
					'Tokens',
					'Introspection & UserInfo',
				];
			default:
				// oauth-authz flow
				// With PKCE: Config → PKCE → Auth URL → Handle Callback → Exchange → Tokens → Introspection
				// Without PKCE: Config → Auth URL → Handle Callback → Exchange → Tokens → Introspection
				if (isPKCERequired) {
					return [
						'Configure',
						'PKCE Parameters',
						'Authorization URL',
						'Handle Callback',
						'Exchange',
						'Tokens',
						'Introspection & UserInfo',
					];
				}
				return [
					'Configure',
					'Authorization URL',
					'Handle Callback',
					'Exchange',
					'Tokens',
					'Introspection & UserInfo',
				];
		}
	};

	// Get step labels (for future use with step navigation if needed)
	const stepLabels = getStepLabels();
	// Suppress unused variable warning - may be used when StepNavigationV8U is re-enabled
	void stepLabels;

	// Step 0: Configure Credentials (all flows)
	const renderStep0 = () => {
		return (
			<div className="step-content">
				{/* Credentials form is rendered by parent */}
				<p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
					Configure your credentials above to begin the flow.
				</p>
			</div>
		);
	};

	// Step 1: Generate PKCE Parameters (oauth-authz, hybrid flows)
	const renderStep1PKCE = () => {
		const pkceCodes: PKCECodes =
			flowState.codeVerifier && flowState.codeChallenge
				? {
						codeVerifier: flowState.codeVerifier,
						codeChallenge: flowState.codeChallenge,
						codeChallengeMethod: 'S256',
					}
				: {
						codeVerifier: '',
						codeChallenge: '',
						codeChallengeMethod: 'S256',
					};

		const handlePKCEChange = (codes: PKCECodes) => {
			console.log(`${MODULE_TAG} 🔑 handlePKCEChange called`, {
				hasVerifier: !!codes.codeVerifier,
				hasChallenge: !!codes.codeChallenge,
				verifierLength: codes.codeVerifier?.length,
				challengeLength: codes.codeChallenge?.length,
			});

			setFlowState((prev) => ({
				...prev,
				codeVerifier: codes.codeVerifier,
				codeChallenge: codes.codeChallenge,
			}));

			// Use bulletproof storage service with quadruple redundancy
			if (codes.codeVerifier && codes.codeChallenge) {
				PKCEStorageServiceV8U.savePKCECodes(flowKey, {
					codeVerifier: codes.codeVerifier,
					codeChallenge: codes.codeChallenge,
					codeChallengeMethod: codes.codeChallengeMethod || 'S256',
				});
			} else {
				console.warn(`${MODULE_TAG} ⚠️ handlePKCEChange called but codes are incomplete`);
			}
		};

		const handlePKCEGenerate = async () => {
			console.log(`${MODULE_TAG} PKCE codes generated`);
			// PKCE codes are already updated via handlePKCEChange, which uses bulletproof storage
			// No need for additional save here - the service handles all 4 storage locations
			if (pkceCodes.codeVerifier && pkceCodes.codeChallenge) {
				nav.markStepComplete();
				toastV8.success('PKCE parameters generated successfully');
			}
		};

		return (
			<div className="step-content">
				<h2>Step 1: Generate PKCE Parameters</h2>
				<p>
					Generate secure PKCE (Proof Key for Code Exchange) parameters to protect your
					authorization flow.
				</p>

				<PKCEService
					value={pkceCodes}
					onChange={handlePKCEChange}
					onGenerate={handlePKCEGenerate}
					isGenerating={false}
					showDetails={true}
					title="Generate PKCE Parameters"
					subtitle="Create secure code verifier and challenge for enhanced security"
				/>

				{flowState.codeVerifier && flowState.codeChallenge && (
					<div
						style={{
							background: '#d1fae5',
							border: '1px solid #22c55e',
							borderRadius: '8px',
							padding: '12px 16px',
							marginTop: '16px',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
					>
						<span style={{ fontSize: '20px' }}>✅</span>
						<div>
							<strong style={{ color: '#065f46' }}>PKCE parameters generated!</strong>
							<p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#047857' }}>
								You can now proceed to generate the authorization URL with PKCE protection.
							</p>
						</div>
					</div>
				)}
			</div>
		);
	};

	/**
	 * Resume redirectless flow after credentials are submitted
	 * Step 3: Resume flow to get authorization code
	 */
	const handleResumeRedirectlessFlow = useCallback(async (
		flowId: string,
		stateValue: string,
		resumeUrl?: string
	) => {
		setIsLoading(true);
		setError(null);

		try {
			if (!resumeUrl) {
				const storedResumeUrl = sessionStorage.getItem(`${flowKey}-redirectless-resumeUrl`);
				if (!storedResumeUrl) {
					throw new Error('No resumeUrl available. Please restart the flow.');
				}
				resumeUrl = storedResumeUrl;
			}

			const codeVerifier = sessionStorage.getItem(`${flowKey}-redirectless-codeVerifier`);
			if (!codeVerifier) {
				throw new Error('PKCE code verifier not found. Please restart the flow.');
			}

			console.log(`${MODULE_TAG} 🔌 Resuming redirectless flow`, { flowId, resumeUrl: resumeUrl.substring(0, 100) + '...' });

			const resumeResponse = await fetch('/api/pingone/resume', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					resumeUrl,
					flowId,
					flowState: stateValue,
					clientId: credentials.clientId,
					clientSecret: credentials.clientSecret,
					codeVerifier,
				}),
			});

			if (!resumeResponse.ok) {
				const errorData = (await resumeResponse.json().catch(() => ({}))) as Record<string, unknown>;
				const errorMsg = (errorData.error_description || errorData.error || `Resume failed (${resumeResponse.status})`) as string;
				throw new Error(errorMsg);
			}

			const resumeData = (await resumeResponse.json()) as Record<string, unknown>;
			console.log(`${MODULE_TAG} 🔌 Resume response:`, resumeData);

			const authCode = resumeData.code as string | undefined;
			if (!authCode) {
				throw new Error('Authorization code not found in resume response');
			}

			// Store authorization code in flow state for display (similar to callback parsing)
			console.log(`${MODULE_TAG} 🔌 Authorization code received from resume`, { code: authCode.substring(0, 20) + '...' });
			
			// Update flow state with authorization code (same as callback step would do)
			const updatedFlowState: FlowState = {
				...flowState,
				authorizationCode: authCode,
				state: stateValue,
			};
			if (flowId) {
				updatedFlowState.redirectlessFlowId = flowId;
			}
			if (resumeUrl) {
				updatedFlowState.redirectlessResumeUrl = resumeUrl;
			}
			setFlowState(updatedFlowState);

			// Store callback details for display (similar to normal callback flow)
			if (setCallbackDetails) {
				setCallbackDetails({
					url: resumeUrl || '',
					code: authCode,
					state: stateValue,
					allParams: {
						code: authCode,
						state: stateValue,
					},
				});
			}

			// Show success toast
			toastV8.success('✅ Authorization code received from PingOne redirectless flow!');

			// Show callback success modal with authorization code (similar to normal callback flow)
			setShowCallbackSuccessModal(true);

			// Navigate to callback step to show the authorization code before exchanging for tokens
			// For oauth-authz: Step 2 is callback (without PKCE), Step 3 is callback (with PKCE)
			// For hybrid: Step 3 is callback (without PKCE), Step 4 is callback (with PKCE)
			const callbackStepIndex = (flowType === 'oauth-authz' || flowType === 'hybrid')
				? (isPKCERequired ? 3 : 2)
				: 2; // Default fallback
			
			console.log(`${MODULE_TAG} 🔌 Navigating to callback step to display authorization code`, {
				callbackStepIndex,
				flowType,
				usePKCE: isPKCERequired,
				pkceEnforcement: credentials.pkceEnforcement,
			});
			
			// Navigate to callback step - user will see the authorization code, then can proceed to exchange
			navigateToStep(callbackStepIndex);
			
			// The exchange step will handle token exchange when user clicks "Exchange Code for Tokens"
			// The authorization code is already stored in flowState.authorizationCode
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to resume redirectless flow';
			setError(message);
			toastV8.error(message);
		} finally {
			setIsLoading(false);
		}
	}, [credentials, flowKey]);

	/**
	 * Exchange authorization code for tokens in redirectless flow
	 * Step 4: Exchange authorization code for tokens
	 */
	const handleRedirectlessTokenExchange = useCallback(async (
		authCode: string,
		codeVerifier: string
	) => {
		setIsLoading(true);
		setError(null);

		try {
			console.log(`${MODULE_TAG} 🔌 Exchanging authorization code for tokens`);

			const backendUrl = process.env.NODE_ENV === 'production'
				? 'https://oauth-playground.vercel.app'
				: 'https://localhost:3001';

			const tokenRequestBody = {
				grant_type: 'authorization_code',
				code: authCode,
				redirect_uri: credentials.redirectUri || 'urn:pingidentity:redirectless',
				client_id: credentials.clientId,
				client_secret: credentials.clientSecret,
				environment_id: credentials.environmentId,
				code_verifier: codeVerifier,
			};

			const tokenResponse = await fetch(`${backendUrl}/api/token-exchange`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(tokenRequestBody),
			});

			if (!tokenResponse.ok) {
				const errorData = (await tokenResponse.json().catch(() => ({}))) as Record<string, unknown>;
				const errorMsg = (errorData.error_description || errorData.error || `Token exchange failed (${tokenResponse.status})`) as string;
				throw new Error(errorMsg);
			}

			const tokenData = (await tokenResponse.json()) as Record<string, unknown>;
			console.log(`${MODULE_TAG} 🔌 Token exchange successful`);

			// Store tokens in flow state (conditionally include optional properties)
			const updatedState: FlowState = {
				...flowState,
				tokens: {
					accessToken: tokenData.access_token as string,
					...(tokenData.id_token ? { idToken: tokenData.id_token as string } : {}),
					...(tokenData.refresh_token ? { refreshToken: tokenData.refresh_token as string } : {}),
					...(tokenData.expires_in ? { expiresIn: tokenData.expires_in as number } : {}),
				},
				authorizationCode: authCode,
			};
			setFlowState(updatedState);

			// Auto-mark current step as complete
			nav.markStepComplete();

			// Close modal and show success
			setShowRedirectlessModal(false);
			setIsRedirectlessAuthenticating(false);
			toastV8.success('✅ Tokens obtained successfully via redirectless authentication!');

			// Navigate to tokens step
			// Find the tokens step index (varies by flow type)
			const tokensStepIndex = totalSteps - 2; // Second to last step is tokens
			navigateToStep(tokensStepIndex);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to exchange authorization code for tokens';
			setError(message);
			toastV8.error(message);
		} finally {
			setIsLoading(false);
		}
	}, [credentials, flowState, nav, flowKey, totalSteps, navigateToStep]);

	/**
	 * Submit credentials to PingOne Flow API
	 * Step 2: Submit credentials when USERNAME_PASSWORD_REQUIRED is returned
	 */
	const handleSubmitRedirectlessCredentials = useCallback(async (
		username: string,
		password: string
	) => {
		setIsRedirectlessAuthenticating(true);
		setRedirectlessAuthError(null);

		try {
			const flowId = sessionStorage.getItem(`${flowKey}-redirectless-flowId`);
			const stateValue = sessionStorage.getItem(`${flowKey}-redirectless-state`);

			if (!flowId || !stateValue) {
				throw new Error('Flow state not found. Please restart the flow.');
			}

			console.log(`${MODULE_TAG} 🔌 Submitting credentials to PingOne Flow API`, { flowId, username });

			const flowApiUrl = `https://auth.pingone.com/${credentials.environmentId}/flows/${flowId}`;

			const credentialsResponse = await fetch('/api/pingone/flows/check-username-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId: credentials.environmentId,
					flowUrl: flowApiUrl,
					username,
					password,
					clientId: credentials.clientId,
					clientSecret: credentials.clientSecret,
				}),
			});

			if (!credentialsResponse.ok) {
				const errorText = await credentialsResponse.text();
				throw new Error(
					`Credentials submission failed: ${credentialsResponse.status} ${credentialsResponse.statusText}. ${errorText}`
				);
			}

			const credentialsData = (await credentialsResponse.json()) as Record<string, unknown>;
			console.log(`${MODULE_TAG} 🔌 Credentials response:`, credentialsData);

			const status = String(credentialsData.status || '').toUpperCase();
			const resumeUrl = credentialsData.resumeUrl as string | undefined;

			if (status === 'READY_TO_RESUME' && resumeUrl) {
				sessionStorage.setItem(`${flowKey}-redirectless-resumeUrl`, resumeUrl);
				await handleResumeRedirectlessFlow(flowId, stateValue, resumeUrl);
			} else if (status === 'COMPLETED') {
				// Flow completed immediately - check for authorization code or tokens
				// Log full response structure for debugging
				console.log(`${MODULE_TAG} 🔌 COMPLETED flow response structure:`, {
					hasAuthorizeResponse: !!credentialsData.authorizeResponse,
					hasCode: !!credentialsData.code,
					keys: Object.keys(credentialsData),
					fullResponse: credentialsData,
				});

				const authorizeResponse = credentialsData.authorizeResponse as Record<string, unknown> | undefined;
				
				// Check multiple possible locations for code and tokens
				const authCode = (
					authorizeResponse?.code ||
					credentialsData.code ||
					(authorizeResponse as any)?.authorization_code ||
					credentialsData.authorization_code
				) as string | undefined;
				
				const accessToken = (
					authorizeResponse?.access_token ||
					credentialsData.access_token ||
					(authorizeResponse as any)?.accessToken ||
					credentialsData.accessToken
				) as string | undefined;

				console.log(`${MODULE_TAG} 🔌 Extracted from COMPLETED flow:`, {
					hasAuthCode: !!authCode,
					hasAccessToken: !!accessToken,
					authCodePreview: authCode ? `${authCode.substring(0, 20)}...` : 'none',
				});

				if (accessToken) {
					// Tokens received directly - store them and navigate to tokens step
					console.log(`${MODULE_TAG} 🔌 Tokens received directly from COMPLETED flow`);
					const updatedState: FlowState = {
						...flowState,
						tokens: {
							accessToken,
							...(authorizeResponse?.id_token || credentialsData.id_token
								? { idToken: (authorizeResponse?.id_token || credentialsData.id_token) as string }
								: {}),
							...(authorizeResponse?.refresh_token || credentialsData.refresh_token
								? { refreshToken: (authorizeResponse?.refresh_token || credentialsData.refresh_token) as string }
								: {}),
							...(authorizeResponse?.expires_in || credentialsData.expires_in
								? { expiresIn: (authorizeResponse?.expires_in || credentialsData.expires_in) as number }
								: {}),
						},
						...(authCode ? { authorizationCode: authCode } : {}),
					};
					setFlowState(updatedState);
					setShowRedirectlessModal(false);
					setIsRedirectlessAuthenticating(false);
					toastV8.success('✅ Authentication completed successfully! Tokens received.');
					
					// Navigate to tokens step
					const tokensStepIndex = totalSteps - 2;
					navigateToStep(tokensStepIndex);
				} else if (authCode) {
					// Authorization code received - proceed to token exchange
					console.log(`${MODULE_TAG} 🔌 Authorization code received from COMPLETED flow`);
					const codeVerifier = sessionStorage.getItem(`${flowKey}-redirectless-codeVerifier`);
					if (codeVerifier) {
						await handleRedirectlessTokenExchange(authCode, codeVerifier);
					} else {
						// Store code and navigate to callback step for manual exchange
						const updatedFlowState: FlowState = {
							...flowState,
							authorizationCode: authCode,
							state: stateValue,
						};
						if (flowId) {
							updatedFlowState.redirectlessFlowId = flowId;
						}
						setFlowState(updatedFlowState);
						setShowRedirectlessModal(false);
						setIsRedirectlessAuthenticating(false);
						toastV8.success('✅ Authorization code received! Proceeding to token exchange.');
						
						// Navigate to callback step
						const callbackStepIndex = (flowType === 'oauth-authz' || flowType === 'hybrid')
							? (isPKCERequired ? 3 : 2)
							: 2;
						navigateToStep(callbackStepIndex);
					}
				} else {
					// COMPLETED but no code or tokens - might need to resume flow
					// Check if there's a resumeUrl even though status is COMPLETED
					const resumeUrl = credentialsData.resumeUrl as string | undefined;
					if (resumeUrl) {
						console.log(`${MODULE_TAG} 🔌 COMPLETED status but resumeUrl present - attempting resume`);
						sessionStorage.setItem(`${flowKey}-redirectless-resumeUrl`, resumeUrl);
						await handleResumeRedirectlessFlow(flowId, stateValue, resumeUrl);
					} else {
						// COMPLETED but no code, tokens, or resumeUrl - log full response for debugging
						console.warn(`${MODULE_TAG} 🔌 Flow COMPLETED but no code, tokens, or resumeUrl found`, {
							responseKeys: Object.keys(credentialsData),
							authorizeResponseKeys: authorizeResponse ? Object.keys(authorizeResponse) : null,
							fullResponse: credentialsData,
						});
						setShowRedirectlessModal(false);
						setIsRedirectlessAuthenticating(false);
						toastV8.warning('⚠️ Flow completed but no authorization code or tokens found. Please check the response.');
					}
				}
			} else {
				throw new Error(`Unexpected status after credentials: ${status || 'UNKNOWN'}`);
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error';
			console.error(`${MODULE_TAG} 🔌 Failed to submit credentials:`, errorMessage);
			setRedirectlessAuthError(errorMessage);
			toastV8.error(`❌ Authentication failed: ${errorMessage}`);
		} finally {
			setIsRedirectlessAuthenticating(false);
		}
	}, [credentials, flowKey, handleResumeRedirectlessFlow, flowState, totalSteps, navigateToStep, isPKCERequired, handleRedirectlessTokenExchange, flowType]);

	// Step 1 or 2: Generate Authorization URL (authz, implicit, hybrid)
	// For oauth-authz and hybrid, this is Step 2 (after PKCE)
	// For implicit, this is Step 1
	const renderStep1AuthUrl = () => {
		const handleGenerateAuthUrl = async () => {
			console.log(`${MODULE_TAG} Generating authorization URL`, {
				flowType,
				hasPKCE: !!(flowState.codeVerifier && flowState.codeChallenge),
				redirectUri: credentials.redirectUri,
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				responseMode: credentials.responseMode || (credentials.useRedirectless ? 'pi.flow' : undefined),
				fullCredentials: credentials,
			});
			
			// Debug: Check if redirectless mode (pi.flow) is enabled
			const isRedirectless = credentials.responseMode === 'pi.flow' || credentials.useRedirectless;
			if (isRedirectless) {
				console.log(`${MODULE_TAG} ✅ Redirectless mode (response_mode=pi.flow) is ENABLED - will make POST request instead of generating URL`);
			} else {
				console.log(`${MODULE_TAG} ⚠️ Standard redirect mode - will generate URL normally (response_mode=${credentials.responseMode || 'default'})`);
			}

			// Validate required fields
			if (!credentials.redirectUri) {
				const errorMsg =
					'Redirect URI is required. Please go back to Step 0 and ensure the Redirect URI field is populated.';
				setError(errorMsg);
				nav.setValidationErrors([errorMsg]);
				toastV8.error(errorMsg);
				return;
			}

			// Validate PKCE codes - required only if enforcement is REQUIRED or S256_REQUIRED
			// If OPTIONAL, user can proceed without codes
			if (
				(flowType === 'oauth-authz' || flowType === 'hybrid') &&
				isPKCERequired &&
				(!flowState.codeVerifier || !flowState.codeChallenge)
			) {
				const errorMsg =
					'PKCE codes are required but missing. Please go back to Step 1 and generate PKCE parameters first.';
				setError(errorMsg);
				nav.setValidationErrors([errorMsg]);
				toastV8.error(errorMsg);
				return;
			}

			setIsLoading(true);
			setError(null);

			try {
				// Redirectless mode (pi.flow): Make POST request to PingOne Flow API instead of generating URL
				if (isRedirectless) {
					console.log(`${MODULE_TAG} 🔌 Redirectless mode (response_mode=pi.flow) enabled - making POST request to PingOne Flow API`);
					
					// Ensure we have PKCE codes for redirectless flow
					if (!flowState.codeVerifier || !flowState.codeChallenge) {
						throw new Error('PKCE codes are required for redirectless flow. Please generate PKCE parameters first.');
					}

					// Step 1: POST /as/authorize with response_mode=pi.flow
					const stateValue = flowState.state || `v8u-${flowType}-${Date.now()}`;
					const authorizeRequestBody: Record<string, unknown> = {
						environmentId: credentials.environmentId,
						clientId: credentials.clientId,
						redirectUri: credentials.redirectUri,
						scopes: credentials.scopes || 'openid profile email',
						codeChallenge: flowState.codeChallenge,
						codeChallengeMethod: 'S256',
						state: stateValue,
					};

					// Only include client secret for confidential clients (not public clients with clientAuthMethod: "none")
					if (credentials.clientAuthMethod !== 'none' && credentials.clientSecret) {
						authorizeRequestBody.clientSecret = credentials.clientSecret;
					}

					const authorizeResponse = await fetch('/api/pingone/redirectless/authorize', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						credentials: 'include',
						body: JSON.stringify(authorizeRequestBody),
					});

					if (!authorizeResponse.ok) {
						const errorData = (await authorizeResponse.json().catch(() => ({}))) as Record<string, unknown>;
						const errorMsg = (errorData.error_description || errorData.error || `Authorization request failed (${authorizeResponse.status})`) as string;
						throw new Error(errorMsg);
					}

					const flowData = (await authorizeResponse.json()) as Record<string, unknown>;
					console.log(`${MODULE_TAG} 🔌 Redirectless flow response:`, flowData);

					const flowId = flowData.id as string | undefined;
					const flowStatus = (flowData.status as string | undefined)?.toUpperCase();
					
					console.log(`${MODULE_TAG} 🔌 Redirectless flow status check:`, {
						flowId,
						flowStatus,
						willShowModal: flowStatus === 'USERNAME_PASSWORD_REQUIRED' || flowStatus === 'IN_PROGRESS',
						rawStatus: flowData.status,
					});

					// Store flow state for subsequent steps
					sessionStorage.setItem(`${flowKey}-redirectless-flowId`, flowId || '');
					sessionStorage.setItem(`${flowKey}-redirectless-state`, stateValue);
					sessionStorage.setItem(`${flowKey}-redirectless-codeVerifier`, flowState.codeVerifier);
					sessionStorage.setItem(`${flowKey}-redirectless-codeChallenge`, flowState.codeChallenge);

					// Store flow state first
					const updatedFlowState: FlowState = {
						...flowState,
						state: stateValue,
					};
					if (flowId) {
						updatedFlowState.redirectlessFlowId = flowId;
					}
					setFlowState(updatedFlowState);

					if (flowStatus === 'USERNAME_PASSWORD_REQUIRED' || flowStatus === 'IN_PROGRESS') {
						// Show login modal - user needs to enter credentials
						console.log(`${MODULE_TAG} 🔌 Credentials required - showing login modal`);
						console.log(`${MODULE_TAG} 🔌 Modal state before:`, { showRedirectlessModal });
						
						// Set modal state - ensure it's visible
						setShowRedirectlessModal(true);
						setIsLoading(false);
						
						console.log(`${MODULE_TAG} 🔌 Modal state after setShowRedirectlessModal(true) - modal should now be visible`);
						console.log(`${MODULE_TAG} 🔌 Flow ID stored:`, flowId);
						console.log(`${MODULE_TAG} 🔌 Flow Status:`, flowStatus);
						
						// Force re-render check
						setTimeout(() => {
							console.log(`${MODULE_TAG} 🔌 Modal visibility check after timeout - showRedirectlessModal should be true`);
						}, 100);
						
						return;
					}

					if (flowStatus === 'READY_TO_RESUME' || flowData.resumeUrl) {
						// Flow is ready to resume - proceed directly (skip modal)
						const resumeUrl = flowData.resumeUrl as string | undefined;
						console.log(`${MODULE_TAG} 🔌 Flow ready to resume - skipping modal, resuming directly`);
						await handleResumeRedirectlessFlow(flowId || '', stateValue, resumeUrl);
						return;
					}

					// Fallback: If we have a flowId but unexpected status, still show modal for manual entry
					// This handles edge cases where PingOne might return a different status format
					if (flowId) {
						console.warn(`${MODULE_TAG} ⚠️ Unexpected flow status "${flowStatus}" but have flowId - showing modal as fallback to allow manual credential entry`);
						setShowRedirectlessModal(true);
						setIsLoading(false);
						return;
					}

					// If we don't have a flowId, something went wrong
					console.error(`${MODULE_TAG} ❌ No flowId in redirectless response:`, flowData);
					throw new Error(`Unexpected flow response: No flow ID. Status: ${flowStatus || 'UNKNOWN'}`);
				}

				// Standard mode: Generate authorization URL
				// For flows that use PKCE (oauth-authz, hybrid), use existing PKCE codes from flowState
				// For implicit flow, PKCE is not used
				const result = await UnifiedFlowIntegrationV8U.generateAuthorizationUrl(
					specVersion,
					flowType,
					credentials,
					flowState.codeVerifier && flowState.codeChallenge
						? {
								codeVerifier: flowState.codeVerifier,
								codeChallenge: flowState.codeChallenge,
								codeChallengeMethod: 'S256',
							}
						: undefined
				);

				const resultWithExtras = result as {
					nonce?: string;
					codeVerifier?: string;
					codeChallenge?: string;
				};
				const updatedState: FlowState = {
					...flowState,
					authorizationUrl: result.authorizationUrl,
					state: result.state,
					...(resultWithExtras.nonce && { nonce: resultWithExtras.nonce }),
					// Preserve existing PKCE codes if they were provided, otherwise use generated ones
					...(resultWithExtras.codeVerifier &&
						!flowState.codeVerifier && { codeVerifier: resultWithExtras.codeVerifier }),
					...(resultWithExtras.codeChallenge &&
						!flowState.codeChallenge && { codeChallenge: resultWithExtras.codeChallenge }),
				};
				setFlowState(updatedState);
				// DON'T auto-mark step complete - user should click "Authenticate on PingOne" first
				// nav.markStepComplete(); // REMOVED - user should manually proceed after authentication
				toastV8.authUrlGenerated();
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Failed to generate authorization URL';
				setError(message);
				nav.setValidationErrors([message]);
				toastV8.error(message);
			} finally {
				setIsLoading(false);
			}
		};

		// Step number - always Step 2 for oauth-authz and hybrid (after PKCE step)
		// Step 1 is always PKCE generation for these flows
		const stepTitle =
			flowType === 'oauth-authz' || flowType === 'hybrid'
				? 'Step 2: Generate Authorization URL'
				: 'Step 1: Generate Authorization URL';

		return (
			<div className="step-content">
				<h2>{stepTitle}</h2>
				<p style={{ marginBottom: '24px', color: '#6b7280' }}>
					Generate the authorization URL to redirect the user to authenticate.
				</p>

				{(flowType === 'oauth-authz' || flowType === 'hybrid') &&
					flowState.codeVerifier &&
					flowState.codeChallenge && (
						<div
							style={{
								background: '#dbeafe',
								border: '1px solid #3b82f6',
								borderRadius: '8px',
								padding: '12px 16px',
								marginBottom: '32px',
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
							}}
						>
							<span style={{ fontSize: '20px' }}>🔐</span>
							<div>
								<strong style={{ color: '#1e40af' }}>PKCE protection enabled</strong>
								<p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#1e3a8a' }}>
									Your authorization URL will include PKCE parameters for enhanced security.
								</p>
							</div>
						</div>
					)}

				{/* Action Section */}
				<div
					style={{
						background: '#f9fafb',
						border: '1px solid #e5e7eb',
						borderRadius: '12px',
						padding: '32px',
						marginBottom: '32px',
						textAlign: 'center',
					}}
				>
					<div style={{ marginBottom: '16px' }}>
						<div style={{ fontSize: '48px', marginBottom: '8px' }}>🔗</div>
						<h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
							Ready to Generate Authorization URL
						</h3>
						<p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
							Click the button below to create your authorization URL
						</p>
					</div>

					<button
						type="button"
						className="btn btn-next"
						onClick={handleGenerateAuthUrl}
						disabled={isLoading}
						style={{
							minWidth: '280px',
							padding: '14px 28px',
							fontSize: '16px',
							fontWeight: '600',
							display: 'inline-flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: '8px',
						}}
					>
						{isLoading ? (
							<>
								<span>⏳</span>
								<span>Generating...</span>
							</>
						) : (
							<>
								<span>🔗</span>
								<span>Generate Authorization URL</span>
							</>
						)}
					</button>
				</div>

				{flowState.authorizationUrl && (
					<div style={{ marginTop: '24px' }}>
						<ColoredUrlDisplay
							url={flowState.authorizationUrl}
							label="Authorization URL"
							showCopyButton={true}
							showInfoButton={true}
							showOpenButton={false}
							height="200px"
							editable={true}
							onChange={(newUrl) => {
								console.log(`${MODULE_TAG} Authorization URL edited`, { newUrl });
								setFlowState((prev) => ({
									...prev,
									authorizationUrl: newUrl,
								}));
							}}
						/>

						<div
							style={{
								marginTop: '16px',
								display: 'flex',
								flexDirection: 'column',
								gap: '12px',
								alignItems: 'center',
							}}
						>
							<button
								type="button"
								className="btn btn-next"
								onClick={() => {
									console.log(`${MODULE_TAG} Opening authorization URL for authentication`);
									const urlToOpen = flowState.authorizationUrl || '';
									if (urlToOpen) {
										window.open(urlToOpen, '_blank', 'noopener,noreferrer');
										// Mark step complete after opening PingOne
										if (!completedSteps.includes(currentStep)) {
											console.log(`${MODULE_TAG} User opened PingOne - marking step complete`);
											nav.markStepComplete();
											toastV8.success(
												"PingOne opened! Complete authentication and you'll be redirected back."
											);
										}
									}
								}}
								style={{
									fontSize: '16px',
									padding: '12px 24px',
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
								}}
							>
								<span style={{ fontSize: '20px' }}>🔐</span>
								<span>Authenticate on PingOne</span>
								<span style={{ fontSize: '16px' }}>→</span>
							</button>

							{completedSteps.includes(currentStep) && (
								<div
									style={{
										padding: '12px',
										background: '#d1fae5',
										borderRadius: '6px',
										color: '#065f46',
										textAlign: 'center',
									}}
								>
									✅ PingOne opened! Complete authentication there and you'll be redirected back.
								</div>
							)}
						</div>

						<div
							style={{
								marginTop: '16px',
								padding: '12px 16px',
								background: '#dbeafe',
								border: '1px solid #3b82f6',
								borderRadius: '8px',
							}}
						>
							<div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
								<span style={{ fontSize: '20px', flexShrink: 0 }}>ℹ️</span>
								<div>
									<strong style={{ color: '#1e40af' }}>What happens next:</strong>
									<ol
										style={{
											margin: '8px 0 0 0',
											paddingLeft: '20px',
											fontSize: '14px',
											color: '#1e3a8a',
											lineHeight: '1.6',
										}}
									>
										<li>Click the button above to open PingOne in a new tab</li>
										<li>Sign in with your PingOne credentials</li>
										<li>You'll be automatically redirected back to this app</li>
										<li>The authorization code will be captured automatically</li>
										<li>Then you can proceed to exchange it for tokens</li>
									</ol>
								</div>
							</div>
						</div>
					</div>
				)}

				{error && (
					<ErrorDisplayWithRetry
						error={error}
						onRetry={handleGenerateAuthUrl}
						isLoading={isLoading}
					/>
				)}
			</div>
		);
	};

	// Step 1: Device Authorization (device code flow)
	const renderStep1DeviceAuth = () => {
		const handleRequestDeviceAuth = async () => {
			// Validate required fields before requesting device authorization
			if (!credentials.environmentId?.trim()) {
				setError('Please provide an Environment ID in the configuration above.');
				nav.setValidationErrors(['Please provide an Environment ID in the configuration above.']);
				return;
			}
			if (!credentials.clientId?.trim()) {
				setError('Please provide a Client ID in the configuration above.');
				nav.setValidationErrors(['Please provide a Client ID in the configuration above.']);
				return;
			}
			if (!credentials.scopes?.trim()) {
				setError('Please provide at least one scope in the configuration above.');
				nav.setValidationErrors(['Please provide at least one scope in the configuration above.']);
				return;
			}

			console.log(`${MODULE_TAG} Requesting device authorization`);
			// Reset auto-poll trigger before starting request to prevent interference
			autoPollTriggeredRef.current = false;
			autoPollInitiatedRef.current = false;
			isPollingExecutingRef.current = false; // Reset polling execution flag
			
			// Clear any pending auto-poll timeout
			if (autoPollTimeoutRef.current) {
				clearTimeout(autoPollTimeoutRef.current);
				autoPollTimeoutRef.current = null;
			}
			
			// Clear any pending polling timeouts
			if (pollingTimeoutRef.current) {
				clearTimeout(pollingTimeoutRef.current);
				pollingTimeoutRef.current = null;
			}
			
			setIsLoading(true);
			setError(null);

			try {
				const result = await UnifiedFlowIntegrationV8U.requestDeviceAuthorization(credentials);

				// Calculate expiration timestamp
				const expiresAt = Date.now() + result.expires_in * 1000;
				
				// Reset polling state when requesting a new code
				// Construct verificationUriComplete if not provided by server (RFC 8628 Section 3.2)
				const verificationUriComplete = result.verification_uri_complete || 
					(result.verification_uri && result.user_code 
						? `${result.verification_uri}?user_code=${result.user_code}`
						: undefined);
				
				const newState: Partial<FlowState> = {
					...flowState,
					deviceCode: result.device_code,
					userCode: result.user_code,
					verificationUri: result.verification_uri,
					...(verificationUriComplete && { verificationUriComplete }),
					deviceCodeExpiresIn: result.expires_in,
					deviceCodeExpiresAt: expiresAt,
					pollingStatus: {
						isPolling: false,
						pollCount: 0,
					},
				};
				// Clear any previous tokens
				delete newState.tokens;
				setFlowState(newState as FlowState);
				
				// Reset auto-poll trigger so it can trigger again when user navigates to step 2
				// But don't trigger immediately - wait for user to navigate to step 2
				autoPollTriggeredRef.current = false;
				autoPollInitiatedRef.current = false;
				isPollingExecutingRef.current = false;
				
				nav.markStepComplete();
				toastV8.success('Device authorization request successful');
			} catch (err) {
				const message =
					err instanceof Error ? err.message : 'Failed to request device authorization';
				setError(message);
				nav.setValidationErrors([message]);
				toastV8.error(message);
			} finally {
				setIsLoading(false);
				// Ensure flags are reset even on error
				if (!flowState.deviceCode) {
					autoPollTriggeredRef.current = false;
					autoPollInitiatedRef.current = false;
					isPollingExecutingRef.current = false;
				}
			}
		};

		// Check if device authorization was already requested
		const hasDeviceCode = !!flowState.deviceCode;
		const isComplete = hasDeviceCode && completedSteps.includes(currentStep);

		// Validate required fields
		const isValid = !!(
			credentials.environmentId?.trim() &&
			credentials.clientId?.trim() &&
			credentials.scopes?.trim()
		);

		return (
			<div className="step-content">
				<style>{`
					@keyframes spin {
						from { transform: rotate(0deg); }
						to { transform: rotate(360deg); }
					}
				`}</style>
				<h2>Step 1: Request Device Authorization</h2>
				<p>Request device authorization to get a device code and user code.</p>

				{/* Educational Info for Device Code Flow */}
				<div
					style={{
						background: '#fef3c7',
						border: '2px solid #f59e0b',
						borderRadius: '8px',
						padding: '16px',
						marginTop: '16px',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
						<span style={{ fontSize: '24px', flexShrink: 0 }}>📚</span>
						<div>
							<h3
								style={{
									margin: '0 0 8px 0',
									fontSize: '16px',
									fontWeight: '600',
									color: '#92400e',
								}}
							>
								What's Happening Here?
							</h3>
							<div style={{ fontSize: '14px', color: '#92400e', lineHeight: '1.6' }}>
								<p style={{ margin: '0 0 8px 0' }}>
									<strong>The Device Authorization Flow (RFC 8628)</strong> is designed for devices
									with limited input capabilities:
								</p>
								<ol style={{ margin: '0 0 8px 0', paddingLeft: '20px' }}>
									<li style={{ marginBottom: '4px' }}>
										<strong>Step 1 (this step):</strong> Your device requests authorization and
										receives a device code and user code
									</li>
									<li style={{ marginBottom: '4px' }}>
										<strong>Step 2 (next):</strong> User enters the user code on a separate
										device/browser to authorize
									</li>
									<li style={{ marginBottom: '4px' }}>
										<strong>Step 3 (after auth):</strong> Your device polls the token endpoint until
										authorization completes
									</li>
								</ol>
								<p
									style={{
										margin: '8px 0 0 0',
										padding: '8px',
										background: 'rgba(255, 255, 255, 0.5)',
										borderRadius: '4px',
									}}
								>
									<strong>🔒 Why this way?</strong> Devices like smart TVs, printers, or IoT devices
									can't easily display login forms. This flow allows users to authorize on a
									separate device while the limited device polls for the result.
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Show success if device code was received */}
				{isComplete && (
					<div
						style={{
							background: '#d1fae5',
							border: '2px solid #22c55e',
							borderRadius: '8px',
							padding: '16px',
							marginTop: '16px',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
							<span style={{ fontSize: '32px', flexShrink: 0 }}>✅</span>
							<div style={{ flex: 1 }}>
								<h3
									style={{
										margin: '0 0 8px 0',
										fontSize: '16px',
										fontWeight: '600',
										color: '#065f46',
									}}
								>
									Device Authorization Request Successful!
								</h3>
								<p
									style={{
										margin: '0 0 12px 0',
										fontSize: '14px',
										color: '#047857',
										lineHeight: '1.6',
									}}
								>
									Your device has received the device code and user code. Next, you'll authorize the
									device using the verification URI.
								</p>
								<p style={{ margin: '0', fontSize: '14px', color: '#047857', fontWeight: '600' }}>
									→ Click "Next Step" below to poll for tokens after authorization
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Show validation errors if fields are missing */}
				{!isValid && !isLoading && !isComplete && (
					<div
						style={{
							background: '#fee2e2',
							border: '1px solid #ef4444',
							borderRadius: '8px',
							padding: '12px 16px',
							marginTop: '16px',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
							<span style={{ fontSize: '20px', flexShrink: 0 }}>⚠️</span>
							<div>
								<strong style={{ color: '#991b1b' }}>Missing Required Fields</strong>
								<ul
									style={{
										margin: '4px 0 0 0',
										paddingLeft: '20px',
										fontSize: '14px',
										color: '#7f1d1d',
									}}
								>
									{!credentials.environmentId?.trim() && <li>Environment ID</li>}
									{!credentials.clientId?.trim() && <li>Client ID</li>}
									{!credentials.scopes?.trim() && <li>Scopes</li>}
								</ul>
								<p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#7f1d1d' }}>
									Please complete all required fields in the configuration step above.
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Device Authorization Request URL Display */}
				{isValid && !isComplete && (
					<div style={{ marginTop: '24px' }}>
						<h3
							style={{
								margin: '0 0 12px 0',
								fontSize: '16px',
								fontWeight: '600',
								color: '#1f2937',
							}}
						>
							📡 Device Authorization Request Details
						</h3>
						<p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280' }}>
							This is the POST request that will be sent to PingOne to request device authorization:
						</p>
						{(() => {
							const deviceAuthEndpoint = `https://auth.pingone.com/${credentials.environmentId?.trim()}/as/device_authorization`;
							const authMethod = credentials.clientAuthMethod || (credentials.clientSecret ? 'client_secret_basic' : 'none');
							
							// Build request body parameters
							const params = new URLSearchParams();
							params.append('client_id', credentials.clientId?.trim() || '');
							
							if (credentials.scopes?.trim()) {
								params.append('scope', credentials.scopes.trim());
							}
							
							if (authMethod === 'client_secret_post' && credentials.clientSecret) {
								params.append('client_secret', credentials.clientSecret);
							}
							
							const requestBody = params.toString();
							const hasAuthHeader = authMethod === 'client_secret_basic' && credentials.clientSecret;
							
							return (
								<div
									style={{
										background: '#f9fafb',
										border: '2px solid #e5e7eb',
										borderRadius: '8px',
										padding: '16px',
									}}
								>
									<div style={{ marginBottom: '16px' }}>
										<div style={{ marginBottom: '8px' }}>
											<strong style={{ color: '#374151', fontSize: '13px' }}>Method:</strong>{' '}
											<span style={{ color: '#059669', fontWeight: '600' }}>POST</span>
										</div>
										<div style={{ marginBottom: '8px' }}>
											<strong style={{ color: '#374151', fontSize: '13px' }}>Endpoint:</strong>
										</div>
										<ColoredUrlDisplay
											url={deviceAuthEndpoint}
											label="Device Authorization Endpoint"
											showCopyButton={true}
											showInfoButton={false}
											showOpenButton={false}
											height="auto"
											editable={false}
										/>
									</div>
									
									{hasAuthHeader && (
										<div style={{ marginBottom: '16px', padding: '12px', background: '#fef3c7', borderRadius: '6px' }}>
											<strong style={{ color: '#92400e', fontSize: '13px' }}>Authorization Header:</strong>
											<div style={{ marginTop: '4px', fontSize: '13px', color: '#78350f', fontFamily: 'monospace' }}>
												Basic {btoa(`${credentials.clientId?.trim()}:${credentials.clientSecret?.trim()}`).substring(0, 20)}...
											</div>
											<p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#92400e' }}>
												Client credentials are sent in the Authorization header using HTTP Basic Authentication.
											</p>
										</div>
									)}
									
									<div>
										<strong style={{ color: '#374151', fontSize: '13px' }}>Request Body (application/x-www-form-urlencoded):</strong>
										<div
											style={{
												marginTop: '8px',
												padding: '12px',
												background: '#ffffff',
												border: '1px solid #d1d5db',
												borderRadius: '6px',
												fontFamily: 'monospace',
												fontSize: '13px',
												color: '#1f2937',
												whiteSpace: 'pre-wrap',
												wordBreak: 'break-all',
											}}
										>
											{requestBody.split('&').map((param, idx) => {
												const [key, value] = param.split('=');
												// Decode and replace + with spaces (URL encoding for form data)
												let decodedValue = decodeURIComponent(value || '').replace(/\+/g, ' ');
												const isSecret = key === 'client_secret';
												return (
													<div key={idx} style={{ marginBottom: idx < requestBody.split('&').length - 1 ? '4px' : '0' }}>
														<span style={{ color: '#dc2626', fontWeight: '600' }}>{key}</span>
														<span style={{ color: '#1f2937' }}>=</span>
														<span style={{ color: '#2563eb' }}>
															{isSecret ? '***' : decodedValue}
														</span>
													</div>
												);
											})}
										</div>
										
										{/* JSON Format Display */}
										<div style={{ marginTop: '16px' }}>
											<strong style={{ color: '#374151', fontSize: '13px' }}>Request Body (JSON format for reference):</strong>
											<div
												style={{
													marginTop: '8px',
													padding: '12px',
													background: '#ffffff',
													border: '1px solid #d1d5db',
													borderRadius: '6px',
													fontFamily: 'monospace',
													fontSize: '13px',
													color: '#1f2937',
													whiteSpace: 'pre-wrap',
													wordBreak: 'break-all',
													maxHeight: '300px',
													overflowY: 'auto',
												}}
											>
												{(() => {
													// Build JSON object from form parameters
													const jsonBody: Record<string, string> = {
														client_id: credentials.clientId?.trim() || '',
													};
													
													if (credentials.scopes?.trim()) {
														jsonBody.scope = credentials.scopes.trim();
													}
													
													if (authMethod === 'client_secret_post' && credentials.clientSecret) {
														jsonBody.client_secret = '***';
													}
													
													return JSON.stringify(jsonBody, null, 2)
														.split('\n')
														.map((line, idx) => {
															// Color code JSON
															if (line.includes('"client_id"') || line.includes('"scope"') || line.includes('"client_secret"')) {
																const keyMatch = line.match(/^(\s*)"([^"]+)":/);
																if (keyMatch) {
																	const indent = keyMatch[1];
																	const key = keyMatch[2];
																	const value = line.substring(keyMatch[0].length).trim();
																	return (
																		<div key={idx}>
																			<span style={{ color: '#1f2937' }}>{indent}</span>
																			<span style={{ color: '#dc2626', fontWeight: '600' }}>"{key}"</span>
																			<span style={{ color: '#1f2937' }}>: </span>
																			<span style={{ color: '#2563eb' }}>{value}</span>
																		</div>
																	);
																}
															}
															return <div key={idx} style={{ color: '#1f2937' }}>{line}</div>;
														});
												})()}
											</div>
											<p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#6b7280', fontStyle: 'italic' }}>
												Note: This is for reference only. The actual request uses application/x-www-form-urlencoded format above.
											</p>
										</div>
										
										<div style={{ marginTop: '12px', fontSize: '12px', color: '#6b7280' }}>
											<strong>Parameters:</strong>
											<ul style={{ margin: '4px 0 0 20px', padding: 0 }}>
												<li><strong style={{ color: '#dc2626' }}>client_id</strong>: Your application's client ID (required)</li>
												{credentials.scopes?.trim() && (
													<li><strong style={{ color: '#dc2626' }}>scope</strong>: Space-separated list of requested scopes</li>
												)}
												{authMethod === 'client_secret_post' && (
													<li><strong style={{ color: '#dc2626' }}>client_secret</strong>: Your application's client secret (if using client_secret_post authentication)</li>
												)}
											</ul>
											<p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
												<strong>Response:</strong> Returns device_code, user_code, verification_uri, and expires_in. The user must visit the verification_uri and enter the user_code to authorize the device.
											</p>
										</div>
									</div>
								</div>
							);
						})()}
					</div>
				)}

				{/* Request Device Authorization Button */}
				{!isComplete && (
					<button
						type="button"
						className="btn btn-next"
						onClick={handleRequestDeviceAuth}
						disabled={isLoading || !isValid}
						style={{ marginTop: '16px', marginBottom: '20px' }}
					>
						{isLoading ? 'Requesting...' : 'Request Device Authorization'}
					</button>
				)}

				{flowState.userCode && flowState.verificationUri && (
					<div
						style={{
							marginTop: '24px',
							padding: '16px',
							background: '#f0f9ff',
							borderRadius: '8px',
							border: '1px solid #0ea5e9',
						}}
					>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
							<h3 style={{ marginTop: 0, marginBottom: 0 }}>✅ Device Authorization Request Complete</h3>
							<button
								type="button"
								onClick={handleRequestDeviceAuth}
								disabled={isLoading}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '6px',
									padding: '8px 12px',
									background: '#0ea5e9',
									color: '#ffffff',
									border: 'none',
									borderRadius: '6px',
									cursor: isLoading ? 'not-allowed' : 'pointer',
									fontSize: '14px',
									fontWeight: '600',
									opacity: isLoading ? 0.6 : 1,
									transition: 'all 0.2s ease',
								}}
								title="Request a new authorization code"
							>
								<FiRefreshCw size={16} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
								{isLoading ? 'Refreshing...' : 'Refresh Code'}
							</button>
						</div>
						<div style={{ marginTop: '12px' }}>
							<div style={{ marginBottom: '8px' }}>
								<strong>User Code:</strong>
								<div
									style={{
										fontSize: '24px',
										fontWeight: 'bold',
										letterSpacing: '4px',
										color: '#0ea5e9',
										fontFamily: 'monospace',
										marginTop: '4px',
									}}
								>
									{flowState.userCode}
								</div>
							</div>
							<div style={{ marginBottom: '8px' }}>
								<strong>Verification URI:</strong>
								<div
									style={{
										padding: '8px',
										background: '#ffffff',
										borderRadius: '4px',
										marginTop: '4px',
										fontFamily: 'monospace',
										fontSize: '12px',
										wordBreak: 'break-all',
									}}
								>
									{flowState.verificationUri}
								</div>
							</div>
							{flowState.deviceCodeExpiresIn && (
								<div style={{ fontSize: '12px', color: '#64748b' }}>
									Expires in: {flowState.deviceCodeExpiresIn} seconds
								</div>
							)}
							<div
								style={{
									marginTop: '12px',
									padding: '12px',
									background: '#fffbeb',
									borderRadius: '4px',
									border: '1px solid #fbbf24',
								}}
							>
								<strong>⚠️ Next Steps:</strong>
								<ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
									<li>Hit Next Step button (Poll for Tokens) to see the QR code and device display</li>
									<li>Scan the QR code or open the verification URI in a browser</li>
									<li>
										Enter the user code: <strong>{flowState.userCode}</strong>
									</li>
									<li>Authorize the device</li>
									<li>The page will automatically update when authorization completes</li>
								</ol>
							</div>
						</div>
					</div>
				)}

				{error && (
					<ErrorDisplayWithRetry
						error={error}
						onRetry={handleRequestDeviceAuth}
						isLoading={isLoading}
					/>
				)}
			</div>
		);
	};

	// Step 1: Username/Password (ROPC flow) - REMOVED: ROPC is not supported by PingOne, use mock flows instead
	// The renderStep1ROPC function has been removed as ROPC is not supported by PingOne.
	// Use the mock ROPC flow at /v7m/ropc instead.

	// Step 2: Handle Callback (authorization code and hybrid flows)
	const renderStep2Callback = () => {
		// Check if redirectless mode (pi.flow) is enabled - if so, show special message
		// Redirectless mode doesn't use redirects, so this step shouldn't normally be reached
		const isRedirectlessCallback = credentials.responseMode === 'pi.flow' || credentials.useRedirectless;
		if (isRedirectlessCallback) {
			console.warn(`${MODULE_TAG} ⚠️ Redirectless mode (response_mode=pi.flow) is enabled but user is on callback step - this shouldn't happen in redirectless mode`);
			
			return (
				<div className="step-content">
					<h2>Step 2: Handle Callback</h2>
					
					{/* Redirectless Mode Warning */}
					<div
						style={{
							background: '#fef2f2',
							border: '2px solid #ef4444',
							borderRadius: '8px',
							padding: '20px',
							marginTop: '16px',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
							<span style={{ fontSize: '24px', flexShrink: 0 }}>⚠️</span>
							<div style={{ flex: 1 }}>
								<h3
									style={{
										margin: '0 0 8px 0',
										fontSize: '16px',
										fontWeight: '600',
										color: '#991b1b',
									}}
								>
									Redirectless Mode Detected
								</h3>
								<p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#7f1d1d', lineHeight: '1.6' }}>
									You have <strong>redirectless mode enabled</strong>, which means there should be <strong>no redirect</strong> to a callback URL.
									Instead, a login modal should have appeared after generating the authorization URL.
								</p>
								<p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#7f1d1d', lineHeight: '1.6' }}>
									<strong>What to do:</strong>
								</p>
								<ol style={{ margin: '0 0 12px 0', paddingLeft: '20px', fontSize: '14px', color: '#7f1d1d', lineHeight: '1.6' }}>
									<li>Go back to Step 1 (Generate Authorization URL)</li>
									<li>Click "Generate Authorization URL" again</li>
									<li>A login modal should appear for username/password input</li>
									<li>If the modal doesn't appear, check the browser console for errors</li>
								</ol>
								<button
									type="button"
									className="btn btn-next"
									onClick={() => {
										// Navigate back to authorization URL step
										const authUrlStep = isPKCERequired ? 2 : 1;
										navigateToStep(authUrlStep);
										toastV8.info('Navigate back to Authorization URL step and click "Generate Authorization URL" again');
									}}
									style={{
										marginTop: '8px',
									}}
								>
									Go Back to Authorization URL Step
								</button>
							</div>
						</div>
					</div>
				</div>
			);
		}
		
		const handleParseCallback = () => {
			console.log(`${MODULE_TAG} Parsing callback URL`, { flowType });
			setIsLoading(true);
			setError(null);

			try {
				// For hybrid flow, also check fragment for tokens
				if (flowType === 'hybrid') {
					const fragment = window.location.hash.substring(1);
					const hasFragment =
						fragment && (fragment.includes('access_token') || fragment.includes('id_token'));

					// Parse authorization code
					const callbackUrlForParsing = flowState.authorizationCode || window.location.href;
					const parsed = UnifiedFlowIntegrationV8U.parseCallbackUrl(
						callbackUrlForParsing,
						flowState.state || ''
					);

					const updates: Partial<FlowState> = {
						authorizationCode: parsed.code,
					};

					// Parse fragment for tokens if present
					if (hasFragment && !flowState.tokens?.accessToken) {
						try {
							const fragmentResult = UnifiedFlowIntegrationV8U.parseCallbackFragment(
								'hybrid',
								window.location.href,
								flowState.state || '',
								flowState.nonce
							);
							// parseCallbackFragment returns tokens directly for implicit/hybrid
							const fragmentTokens = fragmentResult as {
								access_token?: string;
								id_token?: string;
								refresh_token?: string;
							};
							if (fragmentTokens.access_token || fragmentTokens.id_token) {
								const tokens: NonNullable<FlowState['tokens']> = {
									accessToken: fragmentTokens.access_token || flowState.tokens?.accessToken || '',
									expiresIn: 3600,
								};
								if (fragmentTokens.id_token) {
									tokens.idToken = fragmentTokens.id_token;
								}
								if (fragmentTokens.refresh_token) {
									tokens.refreshToken = fragmentTokens.refresh_token;
								}
								updates.tokens = tokens;
							}
						} catch (fragmentErr) {
							console.warn(`${MODULE_TAG} Failed to parse fragment for hybrid flow`, fragmentErr);
						}
					}

					setFlowState((prev) => ({ ...prev, ...updates }));
					nav.markStepComplete();

					if (updates.tokens) {
						toastV8.success('Authorization code and tokens extracted successfully!');
					} else {
						toastV8.success('Authorization code extracted successfully!');
					}
				} else {
					// Authorization code flow only
					const parsed = UnifiedFlowIntegrationV8U.parseCallbackUrl(
						flowState.authorizationCode || '',
						flowState.state || ''
					);

					setFlowState({
						...flowState,
						authorizationCode: parsed.code,
					});
					nav.markStepComplete();
					toastV8.success('Authorization code extracted successfully');
				}
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Failed to parse callback URL';
				setError(message);
				nav.setValidationErrors([message]);
				toastV8.error(message);
			} finally {
				setIsLoading(false);
			}
		};

		// Get the redirect URI that was configured (this is where PingOne will redirect to)
		const redirectUri = credentials.redirectUri || `${window.location.origin}/authz-callback`;

		// Check for errors in callback data (from sessionStorage)
		const callbackDataStr = sessionStorage.getItem('v8u_callback_data');
		let callbackError: string | null = null;
		let callbackErrorDescription: string | null = null;
		
		if (callbackDataStr) {
			try {
				const callbackData = JSON.parse(callbackDataStr) as {
					error?: string;
					errorDescription?: string;
					code?: string;
					state?: string;
					fullUrl?: string;
				};
				if (callbackData.error) {
					callbackError = callbackData.error;
					callbackErrorDescription = callbackData.errorDescription || callbackData.error;
					console.error(`${MODULE_TAG} ❌ Error in callback:`, callbackError, callbackErrorDescription);
				}
			} catch (err) {
				console.error(`${MODULE_TAG} Failed to parse callback data:`, err);
			}
		}

		// Check if data was already extracted (for hybrid flow, check both code and tokens)
		const hasCode = !!flowState.authorizationCode;
		const hasTokens = flowType === 'hybrid' ? !!flowState.tokens?.accessToken : false;

		return (
			<div className="step-content">
				<h2>Step 2: Handle Callback</h2>
				<p>
					After authenticating, you'll be redirected back with{' '}
					{flowType === 'hybrid' ? 'an authorization code and tokens' : 'an authorization code'}.
				</p>

				{/* Show error if callback contains an error */}
				{callbackError && (
					<div
						style={{
							background: '#fef2f2',
							border: '2px solid #ef4444',
							borderRadius: '8px',
							padding: '20px',
							marginTop: '16px',
							marginBottom: '16px',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
							<span style={{ fontSize: '24px', flexShrink: 0 }}>❌</span>
							<div style={{ flex: 1 }}>
								<h3
									style={{
										margin: '0 0 8px 0',
										fontSize: '16px',
										fontWeight: '600',
										color: '#991b1b',
									}}
								>
									Authentication Error
								</h3>
								<p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#7f1d1d', lineHeight: '1.6' }}>
									<strong>Error:</strong> {callbackError}
								</p>
								{callbackErrorDescription && (
									<p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#7f1d1d', lineHeight: '1.6' }}>
										<strong>Description:</strong> {decodeURIComponent(callbackErrorDescription)}
									</p>
								)}
								{callbackError === 'unsupported_response_type' && (
									<div style={{ marginTop: '12px', padding: '12px', background: '#fef3c7', borderRadius: '4px' }}>
										<p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#92400e', fontWeight: '600' }}>
											🔧 Troubleshooting Steps (Configuration looks correct):
										</p>
										<p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#92400e', lineHeight: '1.6' }}>
											Your authorization URL is correctly formatted with <code style={{ background: '#fff3cd', padding: '2px 6px', borderRadius: '3px' }}>response_type=code</code> and PKCE parameters. 
											Since both Grant Types and Response Types are configured correctly, try these steps:
										</p>
										<ol style={{ margin: '0 0 12px 0', paddingLeft: '20px', fontSize: '14px', color: '#92400e', lineHeight: '1.6' }}>
											<li style={{ marginBottom: '4px' }}>
												<strong>Wait for propagation:</strong> After saving PingOne settings, wait 30-60 seconds for changes to propagate
											</li>
											<li style={{ marginBottom: '4px' }}>
												<strong>Check application status:</strong> Ensure the application is <strong>Enabled</strong> (not Draft or Disabled)
											</li>
											<li style={{ marginBottom: '4px' }}>
												<strong>Verify PKCE settings:</strong> Check if your PingOne app has specific PKCE requirements (some apps require PKCE to be explicitly enabled)
											</li>
											<li style={{ marginBottom: '4px' }}>
												<strong>Check application type:</strong> Ensure the app type is appropriate (Web App or Single Page App) - some types have restrictions
											</li>
											<li style={{ marginBottom: '4px' }}>
												<strong>Check policies:</strong> Look for any application-level policies or rules that might be blocking the Authorization Code flow
											</li>
											<li style={{ marginBottom: '4px' }}>
												<strong>Verify redirect URI:</strong> Double-check that <code style={{ background: '#fff3cd', padding: '2px 6px', borderRadius: '3px' }}>{credentials.redirectUri || 'Not configured'}</code> exactly matches (case-sensitive, trailing slash matters)
											</li>
											<li style={{ marginBottom: '4px' }}>
												<strong>Check Correlation ID:</strong> The error includes a Correlation ID - use it to check PingOne logs for more details
											</li>
										</ol>
										<div style={{ padding: '8px', background: '#fff3cd', borderRadius: '4px', marginTop: '8px' }}>
											<p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#92400e', fontWeight: '600' }}>
												🔍 Request Details (for debugging):
											</p>
											<ul style={{ margin: '0', paddingLeft: '20px', fontSize: '12px', color: '#92400e', lineHeight: '1.4' }}>
												<li><strong>Response Type:</strong> <code>code</code></li>
												<li><strong>Grant Type:</strong> authorization_code</li>
												<li><strong>PKCE:</strong> {isPKCERequired ? `Yes (${credentials.pkceEnforcement || 'REQUIRED'})` : 'No (OPTIONAL)'}</li>
												<li><strong>Client ID:</strong> <code>{credentials.clientId}</code></li>
												<li><strong>Redirect URI:</strong> <code>{credentials.redirectUri || 'Not configured'}</code></li>
												<li><strong>Scope:</strong> <code>{credentials.scopes || 'openid'}</code></li>
											</ul>
										</div>
									</div>
								)}
								<button
									type="button"
									className="btn btn-next"
									onClick={handleRestartFlow}
									style={{
										marginTop: '12px',
									}}
								>
									Go Back to Fix Configuration
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Educational Info - Only for Authorization Code and Hybrid flows */}
				{(flowType === 'oauth-authz' || flowType === 'hybrid') && (
					<div
						style={{
							background: '#fef3c7',
							border: '2px solid #f59e0b',
							borderRadius: '8px',
							padding: '16px',
							marginTop: '16px',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
							<span style={{ fontSize: '24px', flexShrink: 0 }}>📚</span>
							<div>
								<h3
									style={{
										margin: '0 0 8px 0',
										fontSize: '16px',
										fontWeight: '600',
										color: '#92400e',
									}}
								>
									What's Happening Here?
								</h3>
								<div style={{ fontSize: '14px', color: '#92400e', lineHeight: '1.6' }}>
									{flowType === 'oauth-authz' ? (
										<>
											<p style={{ margin: '0 0 8px 0' }}>
												<strong>The Authorization Code Flow</strong> is a two-step process for
												security:
											</p>
											<ol style={{ margin: '0 0 8px 0', paddingLeft: '20px' }}>
												<li style={{ marginBottom: '4px' }}>
													<strong>Step 1 (just completed):</strong> User authenticated on PingOne
													and received an <strong>authorization code</strong>
												</li>
												<li style={{ marginBottom: '4px' }}>
													<strong>Step 2 (this step):</strong> Your app extracts the code from the
													callback URL
												</li>
												<li style={{ marginBottom: '4px' }}>
													<strong>Step 3 (next):</strong> Exchange the code for actual access tokens
												</li>
											</ol>
											<p
												style={{
													margin: '8px 0 0 0',
													padding: '8px',
													background: 'rgba(255, 255, 255, 0.5)',
													borderRadius: '4px',
												}}
											>
												<strong>🔒 Why this way?</strong> The authorization code is useless by
												itself - it can only be exchanged for tokens by your app using the client
												secret. This prevents token theft if the callback URL is intercepted.
											</p>
										</>
									) : (
										<>
											<p style={{ margin: '0 0 8px 0' }}>
												<strong>The Hybrid Flow</strong> combines authorization code and implicit
												flow:
											</p>
											<ol style={{ margin: '0 0 8px 0', paddingLeft: '20px' }}>
												<li style={{ marginBottom: '4px' }}>
													<strong>Step 1 (just completed):</strong> User authenticated and received
													both an <strong>authorization code</strong> and tokens in the URL
												</li>
												<li style={{ marginBottom: '4px' }}>
													<strong>Step 2 (this step):</strong> Your app extracts the code and tokens
													from the callback URL
												</li>
												<li style={{ marginBottom: '4px' }}>
													<strong>Step 3 (next):</strong> Exchange the code for additional tokens
													(if needed)
												</li>
											</ol>
											<p
												style={{
													margin: '8px 0 0 0',
													padding: '8px',
													background: 'rgba(255, 255, 255, 0.5)',
													borderRadius: '4px',
												}}
											>
												<strong>🔒 Why this way?</strong> Hybrid flow provides immediate tokens
												(like implicit) while also allowing secure token exchange (like
												authorization code).
											</p>
										</>
									)}
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Show success if authorization code (and tokens for hybrid) was extracted */}
				{hasCode && (
					<div
						style={{
							background: '#d1fae5',
							border: '2px solid #22c55e',
							borderRadius: '8px',
							padding: '16px',
							marginTop: '16px',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
							<span style={{ fontSize: '32px', flexShrink: 0 }}>✅</span>
							<div style={{ flex: 1 }}>
								<h3
									style={{
										margin: '0 0 8px 0',
										fontSize: '16px',
										fontWeight: '600',
										color: '#065f46',
									}}
								>
									Callback URL Parsed Automatically
								</h3>
								<p
									style={{
										margin: '0 0 12px 0',
										fontSize: '14px',
										color: '#047857',
										lineHeight: '1.6',
									}}
								>
									{flowType === 'hybrid' && hasTokens
										? 'Both the authorization code and tokens have been automatically extracted from the callback URL.'
										: 'The callback URL was automatically detected and parsed. Here\'s what was extracted:'}
								</p>
								
								{/* Show extracted authorization code */}
								{hasCode && flowState.authorizationCode && (
									<div
										style={{
											background: '#f0fdf4',
											border: '1px solid #86efac',
											borderRadius: '6px',
											padding: '12px',
											marginBottom: '8px',
										}}
									>
										<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
											<span style={{ fontSize: '16px' }}>🔑</span>
											<strong style={{ color: '#166534', fontSize: '13px' }}>Authorization Code:</strong>
										</div>
										<div
											style={{
												fontFamily: 'monospace',
												fontSize: '12px',
												color: '#166534',
												wordBreak: 'break-all',
												background: 'white',
												padding: '8px',
												borderRadius: '4px',
												border: '1px solid #86efac',
											}}
										>
											{flowState.authorizationCode}
										</div>
									</div>
								)}

								{/* Show extracted state */}
								{flowState.state && (
									<div
										style={{
											background: '#f0fdf4',
											border: '1px solid #86efac',
											borderRadius: '6px',
											padding: '12px',
											marginBottom: '8px',
										}}
									>
										<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
											<span style={{ fontSize: '16px' }}>🔐</span>
											<strong style={{ color: '#166534', fontSize: '13px' }}>State (validated):</strong>
										</div>
										<div
											style={{
												fontFamily: 'monospace',
												fontSize: '12px',
												color: '#166534',
												wordBreak: 'break-all',
												background: 'white',
												padding: '8px',
												borderRadius: '4px',
												border: '1px solid #86efac',
											}}
										>
											{flowState.state}
										</div>
									</div>
								)}

								{/* Show tokens if hybrid flow */}
								{flowType === 'hybrid' && hasTokens && (
									<div
										style={{
											background: '#f0fdf4',
											border: '1px solid #86efac',
											borderRadius: '6px',
											padding: '12px',
											marginBottom: '8px',
										}}
									>
										<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
											<span style={{ fontSize: '16px' }}>🎫</span>
											<strong style={{ color: '#166534', fontSize: '13px' }}>Tokens:</strong>
										</div>
										<div style={{ fontSize: '13px', color: '#166534' }}>
											✅ Access Token received
											{flowState.tokens?.idToken ? ' (+ ID Token)' : ''}
										</div>
									</div>
								)}

								{/* Show callback URL that was parsed */}
								{callbackDetails?.url && (
									<div
										style={{
											background: '#eff6ff',
											border: '1px solid #93c5fd',
											borderRadius: '6px',
											padding: '12px',
											marginTop: '12px',
										}}
									>
										<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
											<span style={{ fontSize: '16px' }}>🌐</span>
											<strong style={{ color: '#1e40af', fontSize: '13px' }}>Callback URL (parsed):</strong>
										</div>
										<ColoredUrlDisplay
											url={callbackDetails.url}
											height="80px"
											showInfoButton={false}
										/>
									</div>
								)}

								<p style={{ margin: '16px 0 0 0', fontSize: '14px', color: '#047857', fontWeight: '600' }}>
									{flowType === 'hybrid' && hasTokens
										? '→ Click "Next Step" below to view tokens or exchange code for additional tokens (if needed)'
										: '→ Click "Next Step" below to exchange this authorization code for access tokens'}
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Show in-progress if code detected but not yet extracted */}
				{flowState.authorizationCode && !completedSteps.includes(currentStep) && (
					<div
						style={{
							background: '#fef3c7',
							border: '1px solid #fbbf24',
							borderRadius: '8px',
							padding: '12px 16px',
							marginTop: '16px',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
					>
						<span style={{ fontSize: '20px' }}>⏳</span>
						<div>
							<strong style={{ color: '#92400e' }}>Callback URL detected</strong>
							<p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#78350f' }}>
								Click "Parse Callback URL" to extract the authorization code.
							</p>
						</div>
					</div>
				)}

				{/* Show instructions if callback URL was NOT auto-detected */}
				{!flowState.authorizationCode && (
					<div
						style={{
							background: '#dbeafe',
							border: '2px solid #3b82f6',
							borderRadius: '8px',
							padding: '16px',
							marginTop: '16px',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
							<span style={{ fontSize: '24px', flexShrink: 0 }}>📋</span>
							<div style={{ flex: 1 }}>
								<h3
									style={{
										margin: '0 0 8px 0',
										fontSize: '16px',
										fontWeight: '600',
										color: '#1e40af',
									}}
								>
									After Authentication, Paste Your Callback URL Here
								</h3>
								<p
									style={{
										margin: '0 0 12px 0',
										fontSize: '14px',
										color: '#1e3a8a',
										lineHeight: '1.6',
									}}
								>
									After you authenticate on PingOne, you'll be redirected to a URL that looks like
									this:
								</p>
								<div
									style={{
										background: '#f0f9ff',
										border: '1px solid #93c5fd',
										borderRadius: '6px',
										padding: '12px',
										fontFamily: 'monospace',
										fontSize: '13px',
										color: '#1e40af',
										wordBreak: 'break-all',
										marginBottom: '12px',
									}}
								>
									{redirectUri}?code=AUTHORIZATION_CODE&state=STATE_VALUE
								</div>
								<p
									style={{
										margin: '0 0 8px 0',
										fontSize: '14px',
										color: '#1e3a8a',
										lineHeight: '1.6',
									}}
								>
									<strong>Copy the entire URL from your browser's address bar</strong> and paste it
									in the field below.
								</p>
								<p style={{ margin: '0', fontSize: '13px', color: '#64748b', lineHeight: '1.6' }}>
									💡 <strong>Tip:</strong> Make sure your PingOne application's redirect URI is set
									to:{' '}
									<code style={{ background: '#e0f2fe', padding: '2px 6px', borderRadius: '3px' }}>
										{redirectUri}
									</code>
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Show Callback URL if we have it stored */}
				{callbackDetails?.url && (
					<div style={{ marginTop: '24px' }}>
						<label
							htmlFor={callbackUrlDisplayId}
							style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}
						>
							🌐 Full Callback URL
						</label>
						<input
							id={callbackUrlDisplayId}
							type="text"
							value={callbackDetails.url}
							readOnly
							style={{
								width: '100%',
								padding: '10px 12px',
								borderRadius: '6px',
								border: '1px solid #cbd5e1',
								fontSize: '12px',
								fontFamily: 'monospace',
								background: '#f8fafc',
								color: '#1f2937',
							}}
						/>
					</div>
				)}


				{/* Parse button - only show if step is not complete (auto-parsing failed or manual entry needed) */}
				{!completedSteps.includes(currentStep) && (
					<div style={{ marginTop: '24px' }}>
						<button
							type="button"
							className="btn btn-next"
							onClick={handleParseCallback}
							disabled={isLoading || !flowState.authorizationCode}
							style={{ marginTop: '8px' }}
						>
							{isLoading ? 'Parsing...' : 'Parse Callback URL'}
						</button>
					</div>
				)}
			</div>
		);
	};

	// Step 2: Parse Fragment (implicit/hybrid flow)
	const renderStep2Fragment = () => {
		// Check if tokens were already extracted
		const hasTokens = flowState.tokens?.accessToken;
		const fragment = window.location.hash.substring(1);
		const hasFragmentInUrl =
			fragment && (fragment.includes('access_token') || fragment.includes('id_token'));

		return (
			<div className="step-content">
				<h2>Step 2: Parse Callback Fragment</h2>
				<p>After authenticating, tokens will be returned in the URL fragment.</p>

				{/* Show success if tokens were extracted */}
				{hasTokens && completedSteps.includes(currentStep) && (
					<div
						style={{
							background: '#d1fae5',
							border: '2px solid #22c55e',
							borderRadius: '8px',
							padding: '16px',
							marginTop: '16px',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
							<span style={{ fontSize: '32px', flexShrink: 0 }}>✅</span>
							<div style={{ flex: 1 }}>
								<h3
									style={{
										margin: '0 0 8px 0',
										fontSize: '16px',
										fontWeight: '600',
										color: '#065f46',
									}}
								>
									Tokens Extracted Successfully!
								</h3>
								<p
									style={{
										margin: '0 0 12px 0',
										fontSize: '14px',
										color: '#047857',
										lineHeight: '1.6',
									}}
								>
									Tokens have been automatically extracted from the URL fragment.
								</p>
								<p style={{ margin: '0', fontSize: '14px', color: '#047857', fontWeight: '600' }}>
									→ Click "Next Step" below to view your tokens
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Show in-progress if fragment detected but not yet parsed */}
				{hasFragmentInUrl && !hasTokens && (
					<div
						style={{
							background: '#fef3c7',
							border: '1px solid #fbbf24',
							borderRadius: '8px',
							padding: '12px 16px',
							marginTop: '16px',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
					>
						<span style={{ fontSize: '20px' }}>⏳</span>
						<div>
							<strong style={{ color: '#92400e' }}>Fragment detected in URL</strong>
							<p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#78350f' }}>
								Click "Parse Fragment" to extract tokens, or wait for auto-parsing.
							</p>
						</div>
					</div>
				)}

				<div style={{ marginTop: '24px' }}>
					<label
						htmlFor={fragmentUrlInputId}
						style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}
					>
						Callback URL (with fragment)
					</label>
					<input
						id={fragmentUrlInputId}
						type="text"
						placeholder="http://localhost:3000/callback#access_token=...&id_token=..."
						value={hasFragmentInUrl ? window.location.href : flowState.authorizationCode || ''}
						onChange={(e) => setFlowState({ ...flowState, authorizationCode: e.target.value })}
						style={{
							width: '100%',
							padding: '10px 12px',
							borderRadius: '6px',
							border: '1px solid #cbd5e1',
							fontSize: '14px',
							fontFamily: 'monospace',
						}}
					/>
					<small style={{ display: 'block', marginTop: '4px', color: '#64748b' }}>
						{hasFragmentInUrl
							? 'Auto-detected from URL (you can edit if needed)'
							: 'Paste the full callback URL with fragment, or it will auto-detect from current URL'}
					</small>
				</div>

				{/* Hide Parse button if tokens already extracted */}
				{!hasTokens && (
					<button
						type="button"
						className="btn btn-next"
						onClick={handleParseFragment}
						disabled={isLoading}
						style={{ marginTop: '16px' }}
					>
						{isLoading ? 'Parsing...' : 'Parse Fragment'}
					</button>
				)}

				{error && (
					<ErrorDisplayWithRetry
						error={error}
						onRetry={handleParseFragment}
						isLoading={isLoading}
					/>
				)}
			</div>
		);
	};

	// Calculate polling timeout (when polling will error)
	const pollInterval = 5; // seconds
	const maxAttempts = 120; // 120 attempts * 5 seconds = 600 seconds = 10 minutes
	const pollingTimeoutSeconds = maxAttempts * pollInterval; // 600 seconds = 10 minutes
	const [pollingTimeoutRemaining, setPollingTimeoutRemaining] = useState<number | null>(null);
	const autoPollTriggeredRef = useRef<boolean>(false);

	// Update polling timeout countdown
	useEffect(() => {
		if (flowState.pollingStatus?.isPolling && !flowState.tokens?.accessToken) {
			// Start countdown from when polling started
			const startTime = flowState.pollingStatus.lastPolled || Date.now();
			const updateTimeout = () => {
				const elapsed = Math.floor((Date.now() - startTime) / 1000);
				const remaining = Math.max(0, pollingTimeoutSeconds - elapsed);
				setPollingTimeoutRemaining(remaining);
				
				if (remaining <= 0) {
					setPollingTimeoutRemaining(null);
				}
			};
			
			updateTimeout();
			const interval = setInterval(updateTimeout, 1000);
			
			return () => clearInterval(interval);
		} else {
			setPollingTimeoutRemaining(null);
			return undefined;
		}
	}, [flowState.pollingStatus?.isPolling, flowState.tokens?.accessToken, pollingTimeoutSeconds]);

	// Store handlePollForTokens ref so we can call it from useEffect
	const handlePollForTokensRef = useRef<(() => Promise<void>) | null>(null);
	// Track if auto-polling has been initiated to prevent multiple calls
	const autoPollInitiatedRef = useRef<boolean>(false);
	// Track if polling is currently executing to prevent race conditions
	const isPollingExecutingRef = useRef<boolean>(false);

	// Auto-start polling when step 2 loads (device code flow)
	useEffect(() => {
		// Clear any pending auto-poll timeout
		if (autoPollTimeoutRef.current) {
			clearTimeout(autoPollTimeoutRef.current);
			autoPollTimeoutRef.current = null;
		}

		// CRITICAL FIX: Don't auto-start if there are validation errors (polling failed)
		// This prevents infinite loop when polling fails
		const hasErrors = validationErrors && validationErrors.length > 0;

		// Only trigger on step 2, and make sure we're not interfering with device authorization request
		if (
			flowType === 'device-code' &&
			currentStep === 2 &&
			flowState.deviceCode &&
			!flowState.tokens?.accessToken &&
			!flowState.pollingStatus?.isPolling &&
			!isLoading &&
			!autoPollTriggeredRef.current &&
			!isPollingExecutingRef.current &&
			!hasErrors // Don't auto-start if there are errors
		) {
			console.log(`${MODULE_TAG} Auto-starting polling on step 2 load - will trigger via ref`);
			autoPollTriggeredRef.current = true;
			autoPollInitiatedRef.current = false; // Reset initiation flag
			// The actual polling will be triggered in a useEffect below when handlePollForTokens is defined
		}
		// Reset auto-poll trigger if we're not on step 2 or if loading starts (device auth request)
		else if (currentStep !== 2 || isLoading) {
			if (autoPollTriggeredRef.current) {
				autoPollTriggeredRef.current = false;
				autoPollInitiatedRef.current = false;
			}
		}

		// Cleanup function
		return () => {
			if (autoPollTimeoutRef.current) {
				clearTimeout(autoPollTimeoutRef.current);
				autoPollTimeoutRef.current = null;
			}
		};
	}, [flowType, currentStep, flowState.deviceCode, flowState.tokens?.accessToken, flowState.pollingStatus?.isPolling, isLoading, validationErrors]);

	// Reset auto-poll trigger when device code changes or step changes
	// Also reset when loading starts (device auth request) to prevent interference
	// Stop polling if we leave step 2
	useEffect(() => {
		if (currentStep !== 2) {
			// Stop polling when leaving step 2
			pollingAbortRef.current = true;
			isPollingExecutingRef.current = false;
			
			// Clear any pending timeouts
			if (pollingTimeoutRef.current) {
				clearTimeout(pollingTimeoutRef.current);
				pollingTimeoutRef.current = null;
			}
			
			// Clear auto-poll timeout
			if (autoPollTimeoutRef.current) {
				clearTimeout(autoPollTimeoutRef.current);
				autoPollTimeoutRef.current = null;
			}
			
			// Update state to stop polling UI
			setFlowState((prev) => ({
				...prev,
				pollingStatus: prev.pollingStatus
					? { ...prev.pollingStatus, isPolling: false }
					: { isPolling: false, pollCount: 0 },
			}));
		}
		
		if (currentStep !== 2 || !flowState.deviceCode || isLoading) {
			autoPollTriggeredRef.current = false;
			autoPollInitiatedRef.current = false;
		}
	}, [currentStep, flowState.deviceCode, isLoading]);

	// Actually trigger polling when handlePollForTokens is available and conditions are met
	useEffect(() => {
		// Clear any pending auto-poll timeout
		if (autoPollTimeoutRef.current) {
			clearTimeout(autoPollTimeoutRef.current);
			autoPollTimeoutRef.current = null;
		}

		if (
			flowType === 'device-code' &&
			currentStep === 2 &&
			flowState.deviceCode &&
			!flowState.tokens?.accessToken &&
			!flowState.pollingStatus?.isPolling &&
			!isLoading &&
			autoPollTriggeredRef.current &&
			!autoPollInitiatedRef.current &&
			!isPollingExecutingRef.current &&
			handlePollForTokensRef.current
		) {
			console.log(`${MODULE_TAG} Auto-starting polling - calling handlePollForTokens now`);
			autoPollInitiatedRef.current = true; // Mark as initiated to prevent multiple calls
			// Use setTimeout to avoid calling during render, and store it for cleanup
			autoPollTimeoutRef.current = setTimeout(() => {
				autoPollTimeoutRef.current = null;
				// Double-check conditions before calling (in case state changed)
				if (
					currentStep === 2 &&
					flowState.deviceCode &&
					!flowState.tokens?.accessToken &&
					!flowState.pollingStatus?.isPolling &&
					!isLoading &&
					!isPollingExecutingRef.current &&
					handlePollForTokensRef.current
				) {
					handlePollForTokensRef.current();
				} else {
					// Conditions changed, reset flags
					autoPollTriggeredRef.current = false;
					autoPollInitiatedRef.current = false;
				}
			}, 100);
		}

		// Cleanup function
		return () => {
			if (autoPollTimeoutRef.current) {
				clearTimeout(autoPollTimeoutRef.current);
				autoPollTimeoutRef.current = null;
			}
		};
	}, [
		flowType,
		currentStep,
		flowState.deviceCode,
		flowState.tokens?.accessToken,
		flowState.pollingStatus?.isPolling,
		isLoading,
	]);

	// Step 2: Poll for Tokens (device code flow)
	const renderStep2Poll = () => {
		const handleStopPolling = () => {
			console.log(`${MODULE_TAG} User requested to stop polling`);
			pollingAbortRef.current = true;
			isPollingExecutingRef.current = false;
			
			// Clear any pending timeouts
			if (pollingTimeoutRef.current) {
				clearTimeout(pollingTimeoutRef.current);
				pollingTimeoutRef.current = null;
			}
			
			// Clear intervals
			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current);
				pollingIntervalRef.current = null;
			}
			
			setIsLoading(false);
			setFlowState((prev) => ({
				...prev,
				pollingStatus: prev.pollingStatus
					? { ...prev.pollingStatus, isPolling: false }
					: { isPolling: false, pollCount: 0 },
			}));
			toastV8.info('Polling stopped');
		};

		const handlePollForTokens = async () => {
			if (!flowState.deviceCode) {
				setError('Please request a device code first by clicking the "Request Device Code" button above.');
				return;
			}

			// Prevent multiple simultaneous calls using ref (immediate check) and state (React state check)
			if (isPollingExecutingRef.current || isLoading || flowState.pollingStatus?.isPolling) {
				console.log(`${MODULE_TAG} Polling already in progress, skipping duplicate call`, {
					isPollingExecutingRef: isPollingExecutingRef.current,
					isLoading,
					isPolling: flowState.pollingStatus?.isPolling,
				});
				return;
			}

			// Mark as executing immediately to prevent race conditions
			isPollingExecutingRef.current = true;
			console.log(`${MODULE_TAG} Starting polling for tokens`);
			setIsLoading(true);
			setError(null);
			autoPollTriggeredRef.current = true;
			autoPollInitiatedRef.current = true; // Mark as initiated
			
			// Initialize polling status
			setFlowState((prev) => ({
				...prev,
				pollingStatus: {
					isPolling: true,
					pollCount: 0,
					lastPolled: Date.now(),
				},
			}));

			// Non-blocking polling with real-time updates
			const pollInterval = 5; // seconds
			const maxAttempts = 120; // 120 attempts * 5 seconds = 600 seconds = 10 minutes
			let pollCount = 0;
			let currentInterval = pollInterval;

			const performPoll = async (): Promise<TokenResponse | null> => {
				try {
					// Use backend proxy to avoid CORS issues
					const backendUrl = process.env.NODE_ENV === 'production'
						? 'https://oauth-playground.vercel.app'
						: 'https://localhost:3001';
					const tokenEndpoint = `${backendUrl}/api/token-exchange`;
					
					// Validate device code before sending
					if (!flowState.deviceCode || flowState.deviceCode.trim() === '') {
						console.error(`${MODULE_TAG} Device code is missing or empty`, {
							deviceCode: flowState.deviceCode,
							hasDeviceCode: !!flowState.deviceCode,
						});
						throw new Error('Device code is missing. Please request a new device code.');
					}

					// Build request body for backend proxy (JSON format)
					const requestBody: Record<string, string> = {
						grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
						client_id: credentials.clientId,
						device_code: flowState.deviceCode.trim(),
						environment_id: credentials.environmentId,
					};

					// Handle Client Authentication
					if (credentials.clientSecret) {
						const authMethod = credentials.clientAuthMethod || 'client_secret_basic';
						if (authMethod === 'client_secret_basic') {
							requestBody.client_secret = credentials.clientSecret;
							requestBody.client_auth_method = 'client_secret_basic';
						} else if (authMethod === 'client_secret_post') {
							requestBody.client_secret = credentials.clientSecret;
							requestBody.client_auth_method = 'client_secret_post';
						}
					}

					console.log(`${MODULE_TAG} Polling request via backend proxy`, {
						endpoint: tokenEndpoint,
						clientId: credentials.clientId,
						deviceCodeLength: flowState.deviceCode.length,
						deviceCodePrefix: flowState.deviceCode.substring(0, 10) + '...',
					});

					pollCount++;
					const response = await fetch(tokenEndpoint, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Accept: 'application/json',
						},
						body: JSON.stringify(requestBody),
					});

					// Update polling status
					setFlowState((prev) => ({
						...prev,
						pollingStatus: {
							isPolling: true,
							pollCount,
							lastPolled: Date.now(),
						},
					}));

					if (response.ok) {
						const tokens: TokenResponse = await response.json();
						console.log(`${MODULE_TAG} ✅ Tokens received successfully on attempt ${pollCount}`);
						return tokens;
					}

					// Handle non-200 responses
					let errorData;
					try {
						errorData = await response.json();
					} catch {
						const text = await response.text();
						console.error(`${MODULE_TAG} Failed to parse error response:`, text);
						throw new Error(`Token polling failed: HTTP ${response.status} ${response.statusText}`);
					}

					console.log(`${MODULE_TAG} Poll response (attempt ${pollCount}):`, {
						status: response.status,
						error: errorData.error,
						errorDescription: errorData.error_description,
					});

					// Check for authorization_pending (user hasn't approved yet) - this is EXPECTED and normal
					if (errorData.error === 'authorization_pending') {
						console.log(`${MODULE_TAG} ⏳ Authorization pending (attempt ${pollCount}/${maxAttempts}) - user hasn't authorized yet, will continue polling in ${currentInterval}s...`);
						// Update status to show we're waiting
						setFlowState((prev) => ({
							...prev,
							pollingStatus: {
								isPolling: true,
								pollCount,
								lastPolled: Date.now(),
							},
						}));
						return null; // Continue polling - this is normal!
					}

					// Check for slow_down (rate limiting)
					if (errorData.error === 'slow_down' && errorData.interval) {
						currentInterval = errorData.interval;
						console.log(`${MODULE_TAG} Rate limited, adjusting interval to ${currentInterval}s`);
						return null; // Continue polling with adjusted interval
					}

					// Handle expired_token or invalid_grant (device code expired/invalid)
					if (errorData.error === 'expired_token' || errorData.error === 'invalid_grant') {
						console.error(`${MODULE_TAG} Device code expired or invalid`, {
							error: errorData.error,
							description: errorData.error_description,
						});
						throw new Error(
							`Device code expired or invalid: ${errorData.error_description || errorData.error}. Please request a new device code.`
						);
					}

					// Other errors (access_denied, etc.)
					console.error(`${MODULE_TAG} Token polling error`, {
						error: errorData.error,
						description: errorData.error_description,
					});
					throw new Error(
						`Token polling failed: ${errorData.error} - ${errorData.error_description || ''}`
					);
				} catch (error) {
					if (error instanceof Error && error.message.includes('Token polling failed')) {
						throw error;
					}
					console.warn(`${MODULE_TAG} Polling error (attempt ${pollCount}/${maxAttempts})`, error);
					return null; // Retry on network errors
				}
			};

			// Reset abort flag
			pollingAbortRef.current = false;
			
			// Start polling loop
			const pollLoop = async () => {
				// Do first poll immediately
				for (let attempt = 0; attempt < maxAttempts; attempt++) {
					// Check if polling was stopped (before each operation)
					if (pollingAbortRef.current) {
						console.log(`${MODULE_TAG} Polling stopped by user`);
						setIsLoading(false);
						isPollingExecutingRef.current = false; // Reset execution flag
						setFlowState((prev) => ({
							...prev,
							pollingStatus: prev.pollingStatus
								? { ...prev.pollingStatus, isPolling: false }
								: { isPolling: false, pollCount: 0 },
						}));
						return;
					}

					console.log(`${MODULE_TAG} Polling attempt ${attempt + 1}/${maxAttempts}`);
					const tokens = await performPoll();
					
					// Check again after async operation
					if (pollingAbortRef.current) {
						console.log(`${MODULE_TAG} Polling stopped after poll attempt`);
						setIsLoading(false);
						isPollingExecutingRef.current = false;
						setFlowState((prev) => ({
							...prev,
							pollingStatus: prev.pollingStatus
								? { ...prev.pollingStatus, isPolling: false }
								: { isPolling: false, pollCount: 0 },
						}));
						return;
					}
					
					if (tokens) {
						// Success! Tokens received
						// Filter tokens based on spec version (OAuth 2.0/2.1 should not have id_token)
						const filteredTokens = filterTokensBySpec(tokens);
						const tokensWithExtras = filteredTokens;
						
						const tokenState: NonNullable<FlowState['tokens']> = {
							accessToken: tokensWithExtras.access_token,
							expiresIn: tokensWithExtras.expires_in,
						};
						if (tokensWithExtras.id_token) {
							tokenState.idToken = tokensWithExtras.id_token;
						}
						if (tokensWithExtras.refresh_token) {
							tokenState.refreshToken = tokensWithExtras.refresh_token;
						}
						
						setFlowState((prev) => ({
							...prev,
							tokens: tokenState,
							pollingStatus: prev.pollingStatus
								? { ...prev.pollingStatus, isPolling: false }
								: { isPolling: false, pollCount: 0 },
						}));
						
						setIsLoading(false);
						isPollingExecutingRef.current = false; // Reset execution flag
						nav.markStepComplete();
						showTokenSuccessModal(tokensWithExtras);
						
						// Fetch UserInfo if OIDC
						if (specVersion === 'oidc' && tokens.access_token) {
							try {
								const userInfo = await fetchUserInfoWithDiscovery(
									tokens.access_token,
									credentials.environmentId
								);
								if (userInfo) {
									setFlowState((prev) => ({ ...prev, userInfo }));
									toastV8.userInfoFetched();
									setShowUserInfoModal(true);
								} else if (tokensWithExtras.id_token) {
									setShowUserInfoModal(true);
								}
							} catch (err) {
								console.warn(`${MODULE_TAG} Failed to fetch UserInfo`, err);
								if (tokensWithExtras.id_token) {
									setShowUserInfoModal(true);
								}
							}
						} else if (tokensWithExtras.id_token) {
							setShowUserInfoModal(true);
						}

						toastV8.tokenExchangeSuccess();
						toastV8.stepCompleted(2);
						return; // Exit polling loop
					}

					// Wait before next poll (but not after the last attempt)
					if (attempt < maxAttempts - 1) {
						// Check abort before waiting
						if (pollingAbortRef.current) {
							console.log(`${MODULE_TAG} Polling stopped before wait`);
							setIsLoading(false);
							isPollingExecutingRef.current = false;
							setFlowState((prev) => ({
								...prev,
								pollingStatus: prev.pollingStatus
									? { ...prev.pollingStatus, isPolling: false }
									: { isPolling: false, pollCount: 0 },
							}));
							return;
						}
						
						console.log(`${MODULE_TAG} Waiting ${currentInterval}s before next poll...`);
						// Use a cancellable timeout
						await new Promise<void>((resolve) => {
							pollingTimeoutRef.current = setTimeout(() => {
								pollingTimeoutRef.current = null;
								resolve();
							}, currentInterval * 1000);
						});
						
						// Check abort after wait
						if (pollingAbortRef.current) {
							console.log(`${MODULE_TAG} Polling stopped after wait`);
							setIsLoading(false);
							isPollingExecutingRef.current = false;
							setFlowState((prev) => ({
								...prev,
								pollingStatus: prev.pollingStatus
									? { ...prev.pollingStatus, isPolling: false }
									: { isPolling: false, pollCount: 0 },
							}));
							return;
						}
					}
				}

				// Timeout
				setIsLoading(false);
				isPollingExecutingRef.current = false; // Reset execution flag
				setError('Token polling timeout - user did not authorize within time limit');
				setFlowState((prev) => ({
					...prev,
					pollingStatus: prev.pollingStatus
						? { ...prev.pollingStatus, isPolling: false }
						: { isPolling: false, pollCount: 0 },
				}));
				toastV8.error('Polling timeout - authorization not completed');
				setShowPollingTimeoutModal(true);
			};

			// Start polling (non-blocking)
			pollLoop().catch((err) => {
				const message = err instanceof Error ? err.message : 'Failed to poll for tokens';
				setError(message);
				setIsLoading(false);
				isPollingExecutingRef.current = false; // Reset execution flag
				setFlowState((prev) => ({
					...prev,
					pollingStatus: prev.pollingStatus
						? { ...prev.pollingStatus, isPolling: false, error: message }
						: { isPolling: false, pollCount: 0, error: message },
				}));
				nav.setValidationErrors([message]);
				toastV8.error(message);
			});
		};


		// Store handlePollForTokens in ref so it can be called from useEffect
		handlePollForTokensRef.current = handlePollForTokens;

		// Check if tokens were already received
		const hasTokens = !!flowState.tokens?.accessToken;
		const isComplete = hasTokens && completedSteps.includes(currentStep);

		return (
			<div className="step-content">
				<h2>Step 2: Poll for Tokens</h2>
				<p>Poll the token endpoint until the user authorizes the device.</p>

				{/* Show success if tokens were received */}
				{isComplete && (
					<div
						style={{
							background: '#d1fae5',
							border: '2px solid #22c55e',
							borderRadius: '8px',
							padding: '16px',
							marginTop: '16px',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
							<span style={{ fontSize: '32px', flexShrink: 0 }}>✅</span>
							<div style={{ flex: 1 }}>
								<h3
									style={{
										margin: '0 0 8px 0',
										fontSize: '16px',
										fontWeight: '600',
										color: '#065f46',
									}}
								>
									Access Token Received Successfully!
								</h3>
								<p
									style={{
										margin: '0 0 12px 0',
										fontSize: '14px',
										color: '#047857',
										lineHeight: '1.6',
									}}
								>
									The device has been authorized and tokens have been received.
								</p>
								{flowState.tokens?.expiresIn && (
									<p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#047857' }}>
										<strong>Token expires in:</strong> {flowState.tokens.expiresIn} seconds
									</p>
								)}
								<p style={{ margin: '0', fontSize: '14px', color: '#047857', fontWeight: '600' }}>
									→ Click "Next Step" below to view your tokens
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Start Polling Button - Above Device Display */}
				{flowState.deviceCode && (
					<>
						{!isComplete && (
							<button
								type="button"
								className="btn btn-next"
								onClick={handlePollForTokens}
								disabled={isLoading || flowState.pollingStatus?.isPolling}
								style={{ marginTop: '16px', marginBottom: '24px' }}
							>
								{isLoading || flowState.pollingStatus?.isPolling
									? 'Polling...'
									: 'Start Polling for Tokens'}
							</button>
						)}
					</>
				)}

				{/* Device Type Selector */}
				{flowState.deviceCode && (
					<div style={{ marginTop: '24px', marginBottom: '24px' }}>
						<DeviceTypeSelector
							selectedDevice={selectedDeviceType}
							onDeviceChange={(deviceType) => {
								setSelectedDeviceType(deviceType);
								localStorage.setItem('device_flow_selected_device', deviceType);
							}}
							variant="compact"
						/>
					</div>
				)}

				{/* Dynamic Device Display */}
				{flowState.deviceCode && flowState.userCode && (
					<div style={{ marginTop: '24px', marginBottom: '24px' }}>
						<DynamicDeviceFlow
							deviceType={selectedDeviceType}
							state={{
								deviceCode: flowState.deviceCode,
								userCode: flowState.userCode,
								verificationUri: flowState.verificationUri || '',
								verificationUriComplete: flowState.verificationUriComplete || '',
								expiresIn: flowState.deviceCodeExpiresIn || 0,
								interval: 5,
								expiresAt: flowState.deviceCodeExpiresAt ? new Date(flowState.deviceCodeExpiresAt) : new Date(),
								status: flowState.tokens?.accessToken
									? 'authorized'
									: flowState.pollingStatus?.isPolling
										? 'pending'
										: 'pending',
								...(flowState.tokens?.accessToken && {
									tokens: {
										access_token: flowState.tokens.accessToken,
										token_type: 'Bearer',
										expires_in: flowState.tokens.expiresIn || 3600,
										...(flowState.tokens.idToken && { id_token: flowState.tokens.idToken }),
										...(flowState.tokens.refreshToken && { refresh_token: flowState.tokens.refreshToken }),
									},
								}),
								...(flowState.pollingStatus?.lastPolled && {
									lastPolled: new Date(flowState.pollingStatus.lastPolled),
								}),
								pollCount: flowState.pollingStatus?.pollCount || 0,
							}}
							onStateUpdate={(newState: unknown) => {
								console.log(`${MODULE_TAG} Device flow state updated`, newState);
							}}
							onComplete={(tokens: unknown) => {
								console.log(`${MODULE_TAG} Device authorization completed`, tokens);
							}}
							onError={(error: string) => {
								console.error(`${MODULE_TAG} Device authorization error`, error);
								setError(error);
							}}
						/>
					</div>
				)}

				{flowState.deviceCode ? (
					<>
						{/* Countdown Timer */}
						{timeRemaining > 0 && flowState.deviceCodeExpiresAt && (
							<div
								style={{
									marginTop: '16px',
									padding: '12px',
									background: timeRemaining < 60 ? '#fef3c7' : '#f0f9ff',
									border: `2px solid ${timeRemaining < 60 ? '#fbbf24' : '#0ea5e9'}`,
									borderRadius: '6px',
								}}
							>
								<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
									<span style={{ fontSize: '20px' }}>⏱️</span>
									<div>
										<strong style={{ color: timeRemaining < 60 ? '#92400e' : '#0c4a6e' }}>
											Code expires in: {formatTimeRemaining(timeRemaining)}
										</strong>
										{timeRemaining < 60 && (
											<div style={{ fontSize: '12px', color: '#78350f', marginTop: '4px' }}>
												⚠️ Code is expiring soon! Make sure to authorize quickly.
											</div>
										)}
									</div>
								</div>
							</div>
						)}

						{/* Polling Status */}
						{(isLoading || flowState.pollingStatus?.isPolling) && (
							<div
								style={{
									marginTop: '16px',
									padding: '16px',
									background: '#f0f9ff',
									border: '2px solid #0ea5e9',
									borderRadius: '8px',
								}}
							>
								<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
									<span style={{ fontSize: '24px' }}>⏳</span>
									<div style={{ flex: 1 }}>
										<strong style={{ color: '#0c4a6e', fontSize: '16px' }}>
											Polling token endpoint...
										</strong>
										{flowState.pollingStatus && flowState.pollingStatus.pollCount > 0 && (
											<div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
												Poll attempt #{flowState.pollingStatus.pollCount}
												{flowState.pollingStatus.lastPolled && (
													<span style={{ marginLeft: '8px' }}>
														(Last poll: {new Date(flowState.pollingStatus.lastPolled).toLocaleTimeString()})
													</span>
												)}
											</div>
										)}
									</div>
								</div>
								
								{/* Polling Timeout Timer */}
								{pollingTimeoutRemaining !== null && pollingTimeoutRemaining > 0 && (
									<div
										style={{
											marginTop: '12px',
											padding: '10px',
											background: pollingTimeoutRemaining < 60 ? '#fef3c7' : '#dbeafe',
											border: `2px solid ${pollingTimeoutRemaining < 60 ? '#fbbf24' : '#3b82f6'}`,
											borderRadius: '6px',
										}}
									>
										<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
											<span style={{ fontSize: '18px' }}>⏱️</span>
											<div>
												<strong style={{ color: pollingTimeoutRemaining < 60 ? '#92400e' : '#1e40af' }}>
													Polling will timeout in: {formatTimeRemaining(pollingTimeoutRemaining)}
												</strong>
												{pollingTimeoutRemaining < 60 && (
													<div style={{ fontSize: '12px', color: '#78350f', marginTop: '4px' }}>
														⚠️ Polling will stop soon if authorization is not completed
													</div>
												)}
											</div>
										</div>
									</div>
								)}
								
								<div style={{ fontSize: '13px', color: '#64748b', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #bfdbfe' }}>
									💡 Make sure you've authorized the device on the verification page
								</div>
								
								{/* Action Buttons */}
								<div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
									<button
										type="button"
										onClick={handleStopPolling}
										style={{
											padding: '8px 16px',
											background: '#ef4444',
											color: '#ffffff',
											border: 'none',
											borderRadius: '6px',
											cursor: 'pointer',
											fontSize: '14px',
											fontWeight: '600',
										}}
									>
										⏹️ Stop Polling
									</button>
									
									{/* Request New Code Button - RFC 8628 allows multiple device code requests */}
									<button
										type="button"
										onClick={handleRequestDeviceAuth}
										disabled={isLoading}
										style={{
											padding: '8px 16px',
											background: isLoading ? '#9ca3af' : '#3b82f6',
											color: '#ffffff',
											border: 'none',
											borderRadius: '6px',
											cursor: isLoading ? 'not-allowed' : 'pointer',
											fontSize: '14px',
											fontWeight: '600',
										}}
									>
										{isLoading ? '⏳ Requesting...' : '🔄 Request New Code'}
									</button>
								</div>
							</div>
						)}
						
						{/* Request New Code Section - Always visible when device code exists */}
						{!isLoading && !flowState.pollingStatus?.isPolling && (
							<div
								style={{
									marginTop: '16px',
									padding: '16px',
									background: '#f0f9ff',
									border: '2px solid #0ea5e9',
									borderRadius: '8px',
								}}
							>
								<div style={{ marginBottom: '12px' }}>
									<strong style={{ color: '#0c4a6e', fontSize: '16px' }}>
										Need a new code?
									</strong>
									<div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
										You can request a new device code at any time. The old code will be invalidated.
									</div>
								</div>
								<button
									type="button"
									onClick={handleRequestDeviceAuth}
									disabled={isLoading}
									style={{
										padding: '10px 20px',
										background: isLoading ? '#9ca3af' : '#3b82f6',
										color: '#ffffff',
										border: 'none',
										borderRadius: '6px',
										cursor: isLoading ? 'not-allowed' : 'pointer',
										fontSize: '14px',
										fontWeight: '600',
										width: '100%',
									}}
								>
									{isLoading ? '⏳ Requesting New Code...' : '🔄 Request New Device Code & QR Code'}
								</button>
							</div>
						)}
					</>
				) : (
					<div
						style={{
							padding: '12px',
							background: '#fef3c7',
							borderRadius: '6px',
							color: '#92400e',
							marginTop: '16px',
						}}
					>
						⚠️ Please complete device authorization first
					</div>
				)}

				{error && (
					<ErrorDisplayWithRetry
						error={error}
						onRetry={handlePollForTokens}
						isLoading={isLoading}
					/>
				)}
			</div>
		);
	};

	// Step 1 or 2: Request Token (client credentials)
	const renderStep2RequestToken = () => {
		const handleRequestToken = async () => {
			// Validate required fields before requesting token
			if (flowType === 'client-credentials') {
				if (!credentials.environmentId?.trim()) {
					setError('Please provide an Environment ID in the configuration above.');
					nav.setValidationErrors(['Please provide an Environment ID in the configuration above.']);
					return;
				}
				if (!credentials.clientId?.trim()) {
					setError('Please provide a Client ID in the configuration above.');
					nav.setValidationErrors(['Please provide a Client ID in the configuration above.']);
					return;
				}
				if (!credentials.clientSecret?.trim()) {
					setError('Please provide a Client Secret in the configuration above.');
					nav.setValidationErrors(['Please provide a Client Secret in the configuration above.']);
					return;
				}
				if (!credentials.scopes?.trim()) {
					setError('Please provide at least one scope in the configuration above.');
					nav.setValidationErrors(['Please provide at least one scope in the configuration above.']);
					return;
				}
			}

			console.log(`${MODULE_TAG} Requesting token`, { flowType });
			setIsLoading(true);
			setError(null);

			try {
				let tokens: TokenResponse;

				if (flowType === 'client-credentials') {
					tokens = await UnifiedFlowIntegrationV8U.requestToken(flowType, credentials);
				} else {
					throw new Error(`The ${flowType} flow does not support direct token requests. Please use the appropriate flow steps.`);
				}

				// Filter tokens based on spec version (OAuth 2.0/2.1 should not have id_token)
				const filteredTokens = filterTokensBySpec(tokens);
				const tokensWithExtras = filteredTokens;
				
				const tokenState: NonNullable<FlowState['tokens']> = {
					accessToken: tokensWithExtras.access_token,
					expiresIn: tokensWithExtras.expires_in,
				};
				if (tokensWithExtras.id_token) {
					tokenState.idToken = tokensWithExtras.id_token;
				}
				if (tokensWithExtras.refresh_token) {
					tokenState.refreshToken = tokensWithExtras.refresh_token;
				}
				setFlowState({
					...flowState,
					tokens: tokenState,
				});
				nav.markStepComplete();

				// Show success modal with token details
				showTokenSuccessModal(tokensWithExtras);

				// Note: ROPC flow removed - it's not supported by PingOne

				toastV8.tokenExchangeSuccess();
				toastV8.stepCompleted(currentStep);
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Failed to request token';
				setError(message);
				nav.setValidationErrors([message]);
				toastV8.error(message);
			} finally {
				setIsLoading(false);
			}
		};

		// Determine step title based on flow type
		const stepTitle =
			flowType === 'client-credentials'
				? 'Step 1: Request Access Token'
				: 'Step 2: Request Access Token';

		// Check if tokens were already received
		const hasTokens = !!flowState.tokens?.accessToken;
		const isComplete = hasTokens && completedSteps.includes(currentStep);

		// Validate required fields for client credentials
		const isValidForClientCredentials =
			flowType === 'client-credentials'
				? !!(
						credentials.environmentId?.trim() &&
						credentials.clientId?.trim() &&
						credentials.clientSecret?.trim() &&
						credentials.scopes?.trim()
					)
				: true;

		const canRequest = isValidForClientCredentials;

		return (
			<div className="step-content">
				<h2>{stepTitle}</h2>
				<p>Request an access token using client credentials.</p>

				{/* Educational Info for Client Credentials Flow */}
				{flowType === 'client-credentials' && (
					<div
						style={{
							background: '#fef3c7',
							border: '2px solid #f59e0b',
							borderRadius: '8px',
							padding: '16px',
							marginTop: '16px',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
							<span style={{ fontSize: '24px', flexShrink: 0 }}>📚</span>
							<div>
								<h3
									style={{
										margin: '0 0 8px 0',
										fontSize: '16px',
										fontWeight: '600',
										color: '#92400e',
									}}
								>
									What's Happening Here?
								</h3>
								<div style={{ fontSize: '14px', color: '#92400e', lineHeight: '1.6' }}>
									<p style={{ margin: '0 0 8px 0' }}>
										<strong>The Client Credentials Flow</strong> is made directly to the token endpoint and is used to request an access token for:
									</p>
									<ul style={{ margin: '0 0 8px 0', paddingLeft: '20px' }}>
										<li style={{ marginBottom: '4px' }}>
											<strong>Resources owned by the client</strong> rather than any specific end user
										</li>
										<li style={{ marginBottom: '4px' }}>
											<strong>Resources belonging to multiple end users</strong>
										</li>
									</ul>
									<ol style={{ margin: '0 0 8px 0', paddingLeft: '20px' }}>
										<li style={{ marginBottom: '4px' }}>
											<strong>Step 1 (this step):</strong> Your application authenticates using HTTP Basic Authentication with its client ID and client secret, sending a POST request with <code>Content-Type: application/x-www-form-urlencoded</code>
										</li>
										<li style={{ marginBottom: '4px' }}>
											<strong>Step 2 (next):</strong> PingOne validates your credentials and returns an access token
										</li>
									</ol>
									<p
										style={{
											margin: '8px 0 0 0',
											padding: '8px',
											background: 'rgba(255, 255, 255, 0.5)',
											borderRadius: '4px',
										}}
									>
										<strong>🔒 Why this way?</strong> This flow is designed for machine-to-machine (M2M) authentication where no user interaction is required. Your application authenticates directly using its own credentials to access resources on behalf of the application itself or multiple users. <strong>Note:</strong> Client Credentials flow typically does not return refresh tokens or ID tokens (unless <code>openid</code> scope is included and supported).
									</p>
									<p style={{ margin: '8px 0 0 0', fontSize: '12px', fontStyle: 'italic' }}>
										Reference: <a href="https://apidocs.pingidentity.com/pingone/main/v1/api/" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>PingOne Platform API Reference</a>
									</p>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Show success if tokens were received */}
				{isComplete && (
					<div
						style={{
							background: '#d1fae5',
							border: '2px solid #22c55e',
							borderRadius: '8px',
							padding: '16px',
							marginTop: '16px',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
							<span style={{ fontSize: '32px', flexShrink: 0 }}>✅</span>
							<div style={{ flex: 1 }}>
								<h3
									style={{
										margin: '0 0 8px 0',
										fontSize: '16px',
										fontWeight: '600',
										color: '#065f46',
									}}
								>
									Access Token Received Successfully!
								</h3>
								<p
									style={{
										margin: '0 0 12px 0',
										fontSize: '14px',
										color: '#047857',
										lineHeight: '1.6',
									}}
								>
									Your application has been authenticated and received an access token.
								</p>
								{flowState.tokens?.expiresIn && (
									<p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#047857' }}>
										<strong>Token expires in:</strong> {flowState.tokens.expiresIn} seconds
									</p>
								)}
								<p style={{ margin: '0', fontSize: '14px', color: '#047857', fontWeight: '600' }}>
									→ Click "Next Step" below to view your access token
								</p>
							</div>
						</div>
					</div>
				)}


				{/* Show validation errors if fields are missing */}
				{!canRequest && !isLoading && !isComplete && (
					<div
						style={{
							background: '#fee2e2',
							border: '1px solid #ef4444',
							borderRadius: '8px',
							padding: '12px 16px',
							marginTop: '16px',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
							<span style={{ fontSize: '20px', flexShrink: 0 }}>⚠️</span>
							<div>
								<strong style={{ color: '#991b1b' }}>Missing Required Fields</strong>
								<ul
									style={{
										margin: '4px 0 0 0',
										paddingLeft: '20px',
										fontSize: '14px',
										color: '#7f1d1d',
									}}
								>
									{!credentials.environmentId?.trim() && <li>Environment ID</li>}
									{!credentials.clientId?.trim() && <li>Client ID</li>}
									{!credentials.clientSecret?.trim() && <li>Client Secret</li>}
									{!credentials.scopes?.trim() && <li>Scopes</li>}
								</ul>
								<p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#7f1d1d' }}>
									Please complete all required fields in the configuration step above.
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Token Request URI Display for Client Credentials */}
				{flowType === 'client-credentials' && canRequest && !isComplete && (
					<div style={{ marginTop: '24px' }}>
						<h3
							style={{
								margin: '0 0 12px 0',
								fontSize: '16px',
								fontWeight: '600',
								color: '#1f2937',
							}}
						>
							📡 Token Request Details
						</h3>
						<p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280' }}>
							This is the POST request that will be sent to PingOne to request an access token:
						</p>
						{(() => {
							const tokenEndpoint = `https://auth.pingone.com/${credentials.environmentId?.trim()}/as/token`;
							const authMethod = credentials.clientAuthMethod || 'client_secret_post';
							
							// Build request body parameters
							const params = new URLSearchParams();
							params.append('grant_type', 'client_credentials');
							params.append('scope', credentials.scopes?.trim() || '');
							
							// Add client credentials based on auth method
							if (authMethod === 'client_secret_post') {
								params.append('client_id', credentials.clientId?.trim() || '');
								params.append('client_secret', credentials.clientSecret?.trim() || '');
							}
							
							const requestBody = params.toString();
							const hasAuthHeader = authMethod === 'client_secret_basic';
							
							return (
								<div
									style={{
										background: '#f9fafb',
										border: '2px solid #e5e7eb',
										borderRadius: '8px',
										padding: '16px',
									}}
								>
									<div style={{ marginBottom: '16px' }}>
										<div style={{ marginBottom: '8px' }}>
											<strong style={{ color: '#374151', fontSize: '13px' }}>Method:</strong>{' '}
											<span style={{ color: '#059669', fontWeight: '600' }}>POST</span>
										</div>
										<div style={{ marginBottom: '8px' }}>
											<strong style={{ color: '#374151', fontSize: '13px' }}>Endpoint:</strong>
										</div>
										<ColoredUrlDisplay
											url={tokenEndpoint}
											label="Token Endpoint"
											showCopyButton={true}
											showInfoButton={false}
											showOpenButton={false}
											height="auto"
											editable={false}
										/>
									</div>
									
									{hasAuthHeader && (
										<div style={{ marginBottom: '16px', padding: '12px', background: '#fef3c7', borderRadius: '6px' }}>
											<strong style={{ color: '#92400e', fontSize: '13px' }}>Authorization Header:</strong>
											<div style={{ marginTop: '4px', fontSize: '13px', color: '#78350f', fontFamily: 'monospace' }}>
												Basic {btoa(`${credentials.clientId?.trim()}:${credentials.clientSecret?.trim()}`).substring(0, 20)}...
											</div>
											<p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#92400e' }}>
												Client credentials are sent in the Authorization header using HTTP Basic Authentication.
											</p>
										</div>
									)}
									
									<div>
										<strong style={{ color: '#374151', fontSize: '13px' }}>Request Body (application/x-www-form-urlencoded):</strong>
										<div
											style={{
												marginTop: '8px',
												padding: '12px',
												background: '#ffffff',
												border: '1px solid #d1d5db',
												borderRadius: '6px',
												fontFamily: 'monospace',
												fontSize: '13px',
												color: '#1f2937',
												whiteSpace: 'pre-wrap',
												wordBreak: 'break-all',
											}}
										>
											{requestBody.split('&').map((param, idx) => {
												const [key, value] = param.split('=');
												// Decode and replace + with spaces (URL encoding for form data)
												let decodedValue = decodeURIComponent(value || '').replace(/\+/g, ' ');
												const isSecret = key === 'client_secret';
												return (
													<div key={idx} style={{ marginBottom: idx < requestBody.split('&').length - 1 ? '4px' : '0' }}>
														<span style={{ color: '#dc2626', fontWeight: '600' }}>{key}</span>
														<span style={{ color: '#1f2937' }}>=</span>
														<span style={{ color: '#2563eb' }}>
															{isSecret ? '***' : decodedValue}
														</span>
													</div>
												);
											})}
										</div>
										
										{/* JSON Format Display */}
										<div style={{ marginTop: '16px' }}>
											<strong style={{ color: '#374151', fontSize: '13px' }}>Request Body (JSON format for reference):</strong>
											<div
												style={{
													marginTop: '8px',
													padding: '12px',
													background: '#ffffff',
													border: '1px solid #d1d5db',
													borderRadius: '6px',
													fontFamily: 'monospace',
													fontSize: '13px',
													color: '#1f2937',
													whiteSpace: 'pre-wrap',
													wordBreak: 'break-all',
													maxHeight: '300px',
													overflowY: 'auto',
												}}
											>
												{(() => {
													// Build JSON object from form parameters
													const jsonBody: Record<string, string> = {
														grant_type: 'client_credentials',
													};
													
													// Parse scope and show as space-separated
													const scopeValue = credentials.scopes?.trim() || '';
													if (scopeValue) {
														jsonBody.scope = scopeValue;
													}
													
													if (authMethod === 'client_secret_post') {
														jsonBody.client_id = credentials.clientId?.trim() || '';
														jsonBody.client_secret = '***';
													}
													
													return JSON.stringify(jsonBody, null, 2)
														.split('\n')
														.map((line, idx) => {
															// Color code JSON
															if (line.includes('"grant_type"') || line.includes('"scope"') || line.includes('"client_id"') || line.includes('"client_secret"')) {
																const keyMatch = line.match(/^(\s*)"([^"]+)":/);
																if (keyMatch) {
																	const indent = keyMatch[1];
																	const key = keyMatch[2];
																	const value = line.substring(keyMatch[0].length).trim();
																	return (
																		<div key={idx}>
																			<span style={{ color: '#1f2937' }}>{indent}</span>
																			<span style={{ color: '#dc2626', fontWeight: '600' }}>"{key}"</span>
																			<span style={{ color: '#1f2937' }}>: </span>
																			<span style={{ color: '#2563eb' }}>{value}</span>
																		</div>
																	);
																}
															}
															return <div key={idx} style={{ color: '#1f2937' }}>{line}</div>;
														});
												})()}
											</div>
											<p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#6b7280', fontStyle: 'italic' }}>
												Note: This is for reference only. The actual request uses application/x-www-form-urlencoded format above.
											</p>
										</div>
										
										<div style={{ marginTop: '12px', fontSize: '12px', color: '#6b7280' }}>
											<strong>Parameters:</strong>
											<ul style={{ margin: '4px 0 0 20px', padding: 0 }}>
												<li><strong style={{ color: '#dc2626' }}>grant_type</strong>: Must be "client_credentials"</li>
												<li><strong style={{ color: '#dc2626' }}>scope</strong>: Space-separated list of requested scopes (Management API scopes like p1:read:users, p1:read:environments)</li>
												{authMethod === 'client_secret_post' && (
													<>
														<li><strong style={{ color: '#dc2626' }}>client_id</strong>: Your application's client ID</li>
														<li><strong style={{ color: '#dc2626' }}>client_secret</strong>: Your application's client secret</li>
													</>
												)}
											</ul>
										</div>
									</div>
								</div>
							);
						})()}
					</div>
				)}

				{/* Request Token Button */}
				{!isComplete && (
					<button
						type="button"
						className="btn btn-next"
						onClick={handleRequestToken}
						disabled={isLoading || !canRequest}
						style={{ marginTop: '16px' }}
					>
						{isLoading ? 'Requesting...' : 'Request Access Token'}
					</button>
				)}

				{error && (
					<ErrorDisplayWithRetry error={error} onRetry={handleRequestToken} isLoading={isLoading} />
				)}
			</div>
		);
	};

	// Step 3: Exchange Code for Tokens (authorization code, hybrid)
	const renderStep3ExchangeTokens = () => {
		const handleExchangeTokens = async () => {
			console.log(`${MODULE_TAG} ========== TOKEN EXCHANGE DEBUG START ==========`);

			// CRITICAL: ALWAYS use sessionStorage as source of truth for PKCE codes
			// flowState can get lost during navigation, but sessionStorage persists
			let effectiveCodeVerifier = flowState.codeVerifier;
			let effectiveCodeChallenge = flowState.codeChallenge;

			// BULLETPROOF: Load PKCE codes from quadruple-redundant storage
			// Try sync first (fast), then async (includes IndexedDB)
			let storedPKCE = PKCEStorageServiceV8U.loadPKCECodes(flowKey);

			if (!storedPKCE) {
				console.log(`${MODULE_TAG} 🔄 Sync load failed, trying async load (IndexedDB)...`);
				storedPKCE = await PKCEStorageServiceV8U.loadPKCECodesAsync(flowKey);
			}

			if (storedPKCE) {
				effectiveCodeVerifier = storedPKCE.codeVerifier;
				effectiveCodeChallenge = storedPKCE.codeChallenge;
				console.log(`${MODULE_TAG} ✅ Loaded PKCE codes from bulletproof storage`, {
					codeVerifierLength: effectiveCodeVerifier.length,
					codeChallengeLength: effectiveCodeChallenge.length,
					savedAt: new Date(storedPKCE.savedAt).toISOString(),
				});

				// Sync flowState
				if (
					flowState.codeVerifier !== effectiveCodeVerifier ||
					flowState.codeChallenge !== effectiveCodeChallenge
				) {
					console.log(`${MODULE_TAG} 🔄 Syncing flowState with storage`);
					setFlowState((prev) => ({
						...prev,
						...(effectiveCodeVerifier ? { codeVerifier: effectiveCodeVerifier } : {}),
						...(effectiveCodeChallenge ? { codeChallenge: effectiveCodeChallenge } : {}),
					}));
				}
			} else {
				console.error(
					`${MODULE_TAG} ❌ CRITICAL: No PKCE codes found in ANY of 4 storage locations!`
				);
				// If PKCE is enabled but codes are missing, this is a critical error
				if (isPKCERequired) {
					console.error(
						`${MODULE_TAG} ❌ CRITICAL: PKCE enabled but no codes found in sessionStorage or flowState`
					);
					console.error(
						`${MODULE_TAG} User must either: 1) Go to Step 1 and generate PKCE codes, or 2) Disable PKCE in configuration`
					);
				}
			}

			console.log(`${MODULE_TAG} Flow State:`, {
				authorizationCode: `${flowState.authorizationCode?.substring(0, 20)}...`,
				codeVerifier: `${effectiveCodeVerifier?.substring(0, 20)}...`,
				codeChallenge: `${effectiveCodeChallenge?.substring(0, 20)}...`,
				hasAuthCode: !!flowState.authorizationCode,
				hasCodeVerifier: !!effectiveCodeVerifier,
				hasCodeChallenge: !!effectiveCodeChallenge,
				fullCodeVerifierLength: effectiveCodeVerifier?.length,
				fullCodeChallengeLength: effectiveCodeChallenge?.length,
				pkceEnabled: isPKCERequired,
				pkceEnforcement: credentials.pkceEnforcement,
				pkceCodesMissing: isPKCERequired && !effectiveCodeVerifier,
			});

			console.log(`${MODULE_TAG} Credentials:`, {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				hasClientSecret: !!credentials.clientSecret,
				clientSecretLength: credentials.clientSecret?.length,
				redirectUri: credentials.redirectUri,
				usePKCE: isPKCERequired,
				pkceEnforcement: credentials.pkceEnforcement,
				scopes: credentials.scopes,
				clientAuthMethod: credentials.clientAuthMethod,
				responseType: credentials.responseType,
			});

			console.log(`${MODULE_TAG} Flow Type:`, flowType);
			console.log(`${MODULE_TAG} Spec Version:`, specVersion);

			// Validate required fields before attempting token exchange
			if (!flowState.authorizationCode) {
				console.error(`${MODULE_TAG} ❌ VALIDATION FAILED: Missing authorization code`);
				setError('Authorization code is required. Please complete the callback step first.');
				nav.setValidationErrors(['Authorization code is required']);
				return;
			}

			// CRITICAL: If PKCE is required, we MUST have a code verifier
			// The service layer will reject the request if PKCE is required but no verifier is provided
			if (isPKCERequired && !effectiveCodeVerifier) {
				console.error(`${MODULE_TAG} ❌ VALIDATION FAILED: PKCE required but code verifier missing`);
				const errorMsg =
					`PKCE is ${credentials.pkceEnforcement || 'REQUIRED'} but code verifier is missing. Please go back to Step 1 (PKCE) to generate PKCE codes.`;
				setError(errorMsg);
				nav.setValidationErrors([errorMsg]);
				toastV8.error(errorMsg);
				return;
			}

			if (isPKCERequired && effectiveCodeVerifier) {
				console.log(`${MODULE_TAG} ✅ PKCE required and code verifier present - will use PKCE flow`);
			}

			// Validate credentials are present
			if (!credentials.clientId || !credentials.clientId.trim()) {
				console.error(`${MODULE_TAG} ❌ VALIDATION FAILED: Missing client ID`);
				const errorMsg =
					'Client ID is required for token exchange. Credentials may have been lost. Please check your configuration.';
				setError(errorMsg);
				nav.setValidationErrors([errorMsg]);
				console.error(`${MODULE_TAG} Missing clientId in credentials:`, {
					credentials,
					hasClientId: !!credentials.clientId,
					clientIdValue: credentials.clientId,
				});
				return;
			}

			if (!credentials.environmentId || !credentials.environmentId.trim()) {
				console.error(`${MODULE_TAG} ❌ VALIDATION FAILED: Missing environment ID`);
				const errorMsg =
					'Environment ID is required for token exchange. Please check your configuration.';
				setError(errorMsg);
				nav.setValidationErrors([errorMsg]);
				console.error(`${MODULE_TAG} Missing environmentId in credentials:`, {
					credentials,
					hasEnvironmentId: !!credentials.environmentId,
				});
				return;
			}

			// Redirect URI is only required when PKCE is NOT required
			if (!isPKCERequired && (!credentials.redirectUri || !credentials.redirectUri.trim())) {
				console.error(
					`${MODULE_TAG} ❌ VALIDATION FAILED: PKCE not required and missing redirect URI`
				);
				const errorMsg =
					'Redirect URI is required for token exchange when PKCE is not required. Please check your configuration.';
				setError(errorMsg);
				nav.setValidationErrors([errorMsg]);
				console.error(`${MODULE_TAG} Missing redirectUri in credentials (PKCE not required):`, {
					credentials,
					usePKCE: isPKCERequired,
					pkceEnforcement: credentials.pkceEnforcement,
					hasRedirectUri: !!credentials.redirectUri,
				});
				return;
			}

			console.log(`${MODULE_TAG} ✅ All validations passed`);
			console.log(`${MODULE_TAG} Preparing token exchange request with:`, {
				flowType,
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				hasClientSecret: !!credentials.clientSecret,
				redirectUri: credentials.redirectUri,
				usePKCE: isPKCERequired,
				pkceEnforcement: credentials.pkceEnforcement,
				hasCodeVerifier: !!effectiveCodeVerifier,
				authCodeLength: flowState.authorizationCode.length,
				codeVerifierLength: effectiveCodeVerifier?.length,
			});

			setIsLoading(true);
			setError(null);
			nav.setValidationErrors([]);

			try {
				console.log(`${MODULE_TAG} 🚀 Calling UnifiedFlowIntegrationV8U.exchangeCodeForTokens...`);
				console.log(`${MODULE_TAG} 🔑 Using code verifier:`, {
					hasCodeVerifier: !!effectiveCodeVerifier,
					codeVerifierLength: effectiveCodeVerifier?.length,
					codeVerifierPreview: `${effectiveCodeVerifier?.substring(0, 20)}...`,
				});
				const tokens = await UnifiedFlowIntegrationV8U.exchangeCodeForTokens(
					flowType as 'oauth-authz' | 'hybrid',
					credentials,
					flowState.authorizationCode,
					effectiveCodeVerifier // Use the effective code verifier (from flowState or sessionStorage)
				);

				console.log(`${MODULE_TAG} ✅ Token exchange successful!`, {
					hasAccessToken: !!tokens.access_token,
					hasIdToken: !!tokens.id_token,
					hasRefreshToken: !!tokens.refresh_token,
					expiresIn: tokens.expires_in,
					tokenType: tokens.token_type,
				});

				// Filter tokens based on spec version (OAuth 2.0/2.1 should not have id_token)
				const filteredTokens = filterTokensBySpec(tokens as TokenResponse);
				const tokensWithExtras = filteredTokens;
				
				const tokenState: NonNullable<FlowState['tokens']> = {
					accessToken: tokensWithExtras.access_token,
					expiresIn: tokensWithExtras.expires_in,
				};
				if (tokensWithExtras.id_token) {
					tokenState.idToken = tokensWithExtras.id_token;
				}
				if (tokensWithExtras.refresh_token) {
					tokenState.refreshToken = tokensWithExtras.refresh_token;
				}
				setFlowState({
					...flowState,
					tokens: tokenState,
				});
				nav.markStepComplete();

				// Fetch UserInfo if OIDC and access token available (using OIDC discovery)
				if (specVersion === 'oidc' && tokens.access_token) {
					try {
						const userInfo = await fetchUserInfoWithDiscovery(
							tokens.access_token,
							credentials.environmentId
						);

						if (userInfo) {
							setFlowState((prev) => ({ ...prev, userInfo }));
							toastV8.userInfoFetched();

							// Show success modal with user information
							setShowUserInfoModal(true);
						} else {
							toastV8.warning('UserInfo could not be fetched, but tokens were received');

							// Still show modal if we have ID token with user info
							if (tokensWithExtras.id_token) {
								setShowUserInfoModal(true);
							}
						}
					} catch (err) {
						console.warn(`${MODULE_TAG} Failed to fetch UserInfo`, err);
						toastV8.warning('UserInfo could not be fetched, but tokens were received');

						// Still show modal if we have ID token with user info
						if (tokensWithExtras.id_token) {
							setShowUserInfoModal(true);
						}
					}
				} else if (tokensWithExtras.id_token) {
					// If we have ID token but no UserInfo, show modal with ID token data
					setShowUserInfoModal(true);
				}
				toastV8.tokenExchangeSuccess();
				toastV8.stepCompleted(3);
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Failed to exchange code for tokens';

				// Check if error is about missing code_verifier (PKCE required by server)
				if (message.includes('code_verifier') || message.includes('PKCE')) {
					const enhancedMessage = `${message}\n\n💡 This error means your PingOne application requires PKCE. Please:\n1. Go back to Step 0 (Configuration)\n2. Enable the "Use PKCE" checkbox\n3. Complete Step 1 to generate PKCE parameters\n4. Start the flow again from Step 2`;
					setError(enhancedMessage);
					nav.setValidationErrors([enhancedMessage]);
					toastV8.error('PKCE required - please enable PKCE and restart the flow');
				} else {
					setError(message);
					nav.setValidationErrors([message]);
					toastV8.error(message);
				}
			} finally {
				setIsLoading(false);
			}
		};

		return (
			<div className="step-content">
				<h2>Step 3: Exchange Code for Tokens</h2>
				<p>Exchange the authorization code for access token and ID token.</p>

				{flowState.tokens?.accessToken ? (
					<div
						style={{
							padding: '16px',
							background: '#d1fae5',
							borderRadius: '6px',
							color: '#065f46',
							marginBottom: '24px',
						}}
					>
						✅ Tokens already exchanged successfully! Authorization codes are single-use only.
					</div>
				) : flowState.authorizationCode ? (
					<button
						type="button"
						className="btn btn-next"
						onClick={handleExchangeTokens}
						disabled={isLoading}
						style={{ marginBottom: '24px' }}
					>
						{isLoading ? 'Exchanging...' : 'Exchange Code for Tokens'}
					</button>
				) : (
					<div
						style={{
							padding: '12px',
							background: '#fef3c7',
							borderRadius: '6px',
							color: '#92400e',
							marginBottom: '24px',
						}}
					>
						⚠️ Please complete the callback step first
					</div>
				)}

				{error && !flowState.tokens?.accessToken && (
					<ErrorDisplayWithRetry
						error={error}
						onRetry={handleExchangeTokens}
						isLoading={isLoading}
					/>
				)}
			</div>
		);
	};

	// Fetch UserInfo from OIDC endpoint (Step 6)
	const handleFetchUserInfo = useCallback(async () => {
		if (!credentials.environmentId || !flowState.tokens?.accessToken) {
			return;
		}

		// Check if UserInfo is allowed for this flow
		const canCallUserInfo = TokenOperationsServiceV8.isOperationAllowed(
			flowType,
			credentials.scopes,
			'userinfo'
		);

		if (!canCallUserInfo) {
			const rules = TokenOperationsServiceV8.getOperationRules(flowType, credentials.scopes);
			const errorMsg = `UserInfo endpoint is not available. ${rules.userInfoReason}`;
			console.warn(`${MODULE_TAG} ${errorMsg}`);
			toastV8.error(errorMsg);
			setUserInfoError(errorMsg);
			return;
		}

		setUserInfoLoading(true);
		setUserInfoError(null);

		try {
			const userInfo = await fetchUserInfoWithDiscovery(
				flowState.tokens.accessToken,
				credentials.environmentId
			);

			if (userInfo) {
				setFlowState((prev) => ({ ...prev, userInfo }));
				toastV8.success('UserInfo fetched successfully!');
			} else {
				throw new Error('Unable to fetch user information from the server. Please verify your access token is valid and has the required permissions.');
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to fetch UserInfo';
			setUserInfoError(message);
			toastV8.error(message);
		} finally {
			setUserInfoLoading(false);
		}
	}, [credentials.environmentId, credentials.scopes, flowType, flowState.tokens?.accessToken, fetchUserInfoWithDiscovery]);

	// Introspect access token
	const handleIntrospectToken = useCallback(async () => {
		console.log(`${MODULE_TAG} ========== TOKEN INTROSPECTION START ==========`);
		console.log(`${MODULE_TAG} Credentials check:`, {
			hasEnvironmentId: !!credentials.environmentId,
			hasClientId: !!credentials.clientId,
			hasClientSecret: !!credentials.clientSecret,
			hasAccessToken: !!flowState.tokens?.accessToken,
			clientAuthMethod: credentials.clientAuthMethod,
		});

		// Check if introspection is allowed for this flow
		const canIntrospect = TokenOperationsServiceV8.isOperationAllowed(
			flowType,
			credentials.scopes,
			'introspect-access'
		);

		if (!canIntrospect) {
			const rules = TokenOperationsServiceV8.getOperationRules(flowType, credentials.scopes);
			const errorMsg = `Token introspection is not available for this flow. ${rules.introspectionReason}`;
			console.warn(`${MODULE_TAG} ${errorMsg}`);
			toastV8.error(errorMsg);
			setIntrospectionError(errorMsg);
			return;
		}

		// Check for public client (no authentication)
		if (credentials.clientAuthMethod === 'none') {
			const errorMsg = 'Token introspection requires client authentication. Public clients (clientAuthMethod: "none") cannot authenticate to the introspection endpoint. To use introspection, configure your application with client_secret_basic or client_secret_post authentication.';
			console.warn(`${MODULE_TAG} ${errorMsg}`);
			toastV8.error(errorMsg);
			setIntrospectionError(errorMsg);
			return;
		}

		if (
			!credentials.environmentId ||
			!credentials.clientId ||
			!credentials.clientSecret ||
			!flowState.tokens?.accessToken
		) {
			const errorMsg = 'Missing required credentials for token introspection';
			console.error(`${MODULE_TAG} ${errorMsg}`, {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				clientSecret: credentials.clientSecret ? 'present' : 'missing',
				accessToken: flowState.tokens?.accessToken ? 'present' : 'missing',
			});
			toastV8.error(errorMsg);
			return;
		}

		setIntrospectionLoading(true);
		setIntrospectionError(null);

		try {
			// Discover the introspection endpoint from OIDC well-known configuration
			const issuerUrl = `https://auth.pingone.com/${credentials.environmentId}`;
			console.log(`${MODULE_TAG} Discovering endpoints from`, { issuerUrl });

			const discoveryResult = await OidcDiscoveryServiceV8.discover(issuerUrl);
			console.log(`${MODULE_TAG} Discovery result:`, {
				success: discoveryResult.success,
				hasIntrospectionEndpoint: !!discoveryResult.data?.introspectionEndpoint,
				introspectionEndpoint: discoveryResult.data?.introspectionEndpoint,
				discoveryError: discoveryResult.error,
			});

			let introspectionEndpoint: string;

			// Fallback to standard endpoint if discovery fails or endpoint not found
			if (!discoveryResult.success || !discoveryResult.data?.introspectionEndpoint) {
				introspectionEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/introspect`;
				console.warn(`${MODULE_TAG} Discovery failed or no introspection endpoint, using fallback`, { 
					introspectionEndpoint,
					discoveryError: discoveryResult.error 
				});
			} else {
				introspectionEndpoint = discoveryResult.data.introspectionEndpoint;
			}

			console.log(`${MODULE_TAG} Introspecting token at endpoint`, { introspectionEndpoint });

			// Use backend proxy to avoid CORS issues
			const backendUrl = process.env.NODE_ENV === 'production'
				? 'https://oauth-playground.vercel.app'
				: 'https://localhost:3001';
			const proxyEndpoint = `${backendUrl}/api/introspect-token`;

			console.log(`${MODULE_TAG} Sending introspection request via proxy:`, {
				tokenLength: flowState.tokens.accessToken.length,
				clientId: credentials.clientId,
				introspectionEndpoint,
				proxyEndpoint,
			});

			const response = await fetch(proxyEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					token: flowState.tokens.accessToken,
					client_id: credentials.clientId,
					client_secret: credentials.clientSecret,
					introspection_endpoint: introspectionEndpoint,
					token_auth_method: credentials.clientAuthMethod || 'client_secret_post',
				}),
			});

			console.log(`${MODULE_TAG} Introspection response status:`, {
				status: response.status,
				statusText: response.statusText,
				ok: response.ok,
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error(`${MODULE_TAG} Introspection error response:`, errorText);
				throw new Error(`Token introspection failed: ${response.status} ${response.statusText} - ${errorText}`);
			}

			const data = await response.json();
			console.log(`${MODULE_TAG} Introspection data received:`, data);

			setIntrospectionData(data);
			toastV8.success('Token introspected successfully!');
			console.log(`${MODULE_TAG} ========== TOKEN INTROSPECTION SUCCESS ==========`);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to introspect token';
			console.error(`${MODULE_TAG} Introspection error:`, err);
			setIntrospectionError(message);
			toastV8.error(message);
			console.log(`${MODULE_TAG} ========== TOKEN INTROSPECTION FAILED ==========`);
		} finally {
			setIntrospectionLoading(false);
		}
	}, [
		credentials.environmentId,
		credentials.clientId,
		credentials.clientSecret,
		credentials.clientAuthMethod,
		flowState.tokens?.accessToken,
	]);

	// Step 3: Display Tokens (all flows - final step)
	const renderStep3Tokens = () => {
		if (!flowState.tokens?.accessToken) {
			return (
				<div className="step-content">
					<p style={{ color: '#6b7280', fontSize: '14px' }}>
						No tokens received yet. Complete the previous steps to receive tokens.
					</p>
				</div>
			);
		}

		return (
			<div className="step-content">
				{/* Spec Compliance Notice */}
				{(specVersion === 'oauth2.0' || specVersion === 'oauth2.1') && (
					<div
						style={{
							marginBottom: '16px',
							padding: '12px 16px',
							background: '#fef3c7', // Light yellow background
							border: '2px solid #f59e0b',
							borderRadius: '8px',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
							<span style={{ fontSize: '20px', flexShrink: 0 }}>📋</span>
							<div>
								<strong style={{ color: '#92400e', fontSize: '14px' }}>Spec Compliance Notice</strong>
								<p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#78350f', lineHeight: '1.5' }}>
									{specVersion === 'oauth2.0' && (
										<>
											<strong>OAuth 2.0</strong> only returns: <code style={{ background: '#fde68a', padding: '2px 6px', borderRadius: '3px' }}>access_token</code> and <code style={{ background: '#fde68a', padding: '2px 6px', borderRadius: '3px' }}>refresh_token</code>
										</>
									)}
									{specVersion === 'oauth2.1' && (
										<>
											<strong>OAuth 2.1</strong> only returns: <code style={{ background: '#fde68a', padding: '2px 6px', borderRadius: '3px' }}>access_token</code> and <code style={{ background: '#fde68a', padding: '2px 6px', borderRadius: '3px' }}>refresh_token</code>
										</>
									)}
								</p>
								<p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#92400e' }}>
									<strong>Note:</strong> PingOne may return an <code style={{ background: '#fde68a', padding: '2px 4px', borderRadius: '3px' }}>id_token</code>, but it's filtered out to follow the {specVersion === 'oauth2.0' ? 'OAuth 2.0' : 'OAuth 2.1'} spec. ID tokens are only part of <strong>OIDC (OpenID Connect)</strong>.
								</p>
							</div>
						</div>
					</div>
				)}
				
				{specVersion === 'oidc' && (
					<div
						style={{
							marginBottom: '16px',
							padding: '12px 16px',
							background: '#dbeafe', // Light blue background
							border: '2px solid #3b82f6',
							borderRadius: '8px',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
							<span style={{ fontSize: '20px', flexShrink: 0 }}>🔐</span>
							<div>
								<strong style={{ color: '#1e40af', fontSize: '14px' }}>OIDC Token Set</strong>
								<p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#1e3a8a', lineHeight: '1.5' }}>
									<strong>OpenID Connect</strong> returns: <code style={{ background: '#bfdbfe', padding: '2px 6px', borderRadius: '3px' }}>access_token</code>, <code style={{ background: '#bfdbfe', padding: '2px 6px', borderRadius: '3px' }}>id_token</code>, and <code style={{ background: '#bfdbfe', padding: '2px 6px', borderRadius: '3px' }}>refresh_token</code>
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Token Display Component with Decode */}
				<TokenDisplayV8U
					tokens={{
						accessToken: flowState.tokens.accessToken,
						...(flowState.tokens.idToken && { idToken: flowState.tokens.idToken }),
						...(flowState.tokens.refreshToken && { refreshToken: flowState.tokens.refreshToken }),
						...(flowState.tokens.expiresIn && { expiresIn: flowState.tokens.expiresIn }),
					}}
					showDecodeButtons={true}
					showCopyButtons={true}
				/>

				{/* Info Box - Introspection and UserInfo moved to Step 6 */}
				<div
					style={{
						marginTop: '24px',
						padding: '12px 16px',
						background: '#dbeafe',
						border: '1px solid #3b82f6',
						borderRadius: '8px',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
						<span style={{ fontSize: '20px', flexShrink: 0 }}>ℹ️</span>
						<div>
							<strong style={{ color: '#1e40af' }}>Next Step:</strong>
							<p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#1e3a8a' }}>
								Click "Next Step" to proceed to Token Introspection & UserInfo (optional).
							</p>
						</div>
					</div>
				</div>
			</div>
		);
	};

	// UserInfo Success Modal - shown after successful authentication
	const renderUserInfoModal = () => {
		return (
			<UserInfoSuccessModalV8U
				isOpen={showUserInfoModal}
				onClose={() => setShowUserInfoModal(false)}
				{...(flowState.userInfo ? { userInfo: flowState.userInfo } : {})}
				{...(flowState.tokens?.idToken ? { idToken: flowState.tokens.idToken } : {})}
			/>
		);
	};

	// Token Introspection & UserInfo (all flows - final step after tokens)
	// Step number varies by flow type
	// ALWAYS SHOWS - even without tokens, to inform users what they can/cannot do
	const renderStep6IntrospectionUserInfo = () => {
		// Get operation rules to determine what's allowed
		const operationRules = TokenOperationsServiceV8.getOperationRules(flowType, credentials.scopes);
		
		// Check if we have tokens (needed for actual operations)
		const hasAccessToken = !!flowState.tokens?.accessToken;
		const hasRefreshToken = !!flowState.tokens?.refreshToken;
		const hasIdToken = !!flowState.tokens?.idToken;

		// Determine step number dynamically based on flow type
		const introspectionStepNumber = (() => {
			switch (flowType) {
				case 'client-credentials':
					return 3; // Step 4 (0-indexed: 0, 1, 2, 3)
				case 'implicit':
				case 'device-code':
					return 4; // Step 5 (0-indexed: 0, 1, 2, 3, 4)
				case 'hybrid':
					return isPKCERequired ? 6 : 5; // Step 7 or 6 depending on PKCE
				default:
					return isPKCERequired ? 6 : 5; // Step 7 or 6 depending on PKCE
			}
		})();

		return (
			<div className="step-content">
				<h2>Step {introspectionStepNumber + 1}: Token Introspection & UserInfo</h2>
				<p>Validate your access token and retrieve user information (optional).</p>
				
				{/* Status indicator - show if tokens are missing */}
				{!hasAccessToken && (
					<div
						style={{
							marginTop: '16px',
							padding: '12px 16px',
							background: '#fef3c7',
							border: '1px solid #f59e0b',
							borderRadius: '8px',
							color: '#92400e',
						}}
					>
						<strong>⚠️ Tokens not yet available</strong>
						<p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
							Complete the previous steps to receive tokens. The buttons below will be enabled once tokens are available.
						</p>
					</div>
				)}

				{/* UserInfo Section - ALWAYS SHOWS with status and disabled buttons */}
				<div
					style={{
						marginTop: '24px',
						padding: '16px',
						background: operationRules.canCallUserInfo ? '#f0f9ff' : '#f3f4f6', // Light blue if allowed, gray if not
						borderRadius: '8px',
						border: `1px solid ${operationRules.canCallUserInfo ? '#0ea5e9' : '#9ca3af'}`,
					}}
				>
					<div
						style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}
					>
						<span style={{ fontSize: '24px' }}>👤</span>
						<h3 style={{ margin: 0, fontSize: '18px', color: operationRules.canCallUserInfo ? '#1e40af' : '#6b7280', flex: 1 }}>
							UserInfo
							{operationRules.canCallUserInfo ? (
								<span style={{ marginLeft: '8px', fontSize: '14px', color: '#22c55e', fontWeight: 'normal' }}>✅ Available</span>
							) : (
								<span style={{ marginLeft: '8px', fontSize: '14px', color: '#ef4444', fontWeight: 'normal' }}>❌ Not Available</span>
							)}
						</h3>
					</div>
					
					{/* Status explanation */}
					<div
						style={{
							padding: '12px',
							background: operationRules.canCallUserInfo ? '#dbeafe' : '#fee2e2',
							border: `1px solid ${operationRules.canCallUserInfo ? '#3b82f6' : '#ef4444'}`,
							borderRadius: '6px',
							marginBottom: '12px',
							color: operationRules.canCallUserInfo ? '#1e3a8a' : '#991b1b',
							fontSize: '14px',
						}}
					>
						<strong>{operationRules.canCallUserInfo ? '✅ ' : '❌ '}</strong>
						{operationRules.userInfoReason}
						{operationRules.userInfoExplanation && (
							<div style={{ marginTop: '8px', fontSize: '13px', opacity: 0.9 }}>
								{operationRules.userInfoExplanation}
							</div>
						)}
					</div>
					
					<p style={{ margin: '0 0 12px 0', color: operationRules.canCallUserInfo ? '#1e3a8a' : '#6b7280', fontSize: '14px' }}>
						Retrieve authenticated user information using your access token.
					</p>
						{userInfoError && (
							<div
								style={{
									padding: '12px',
									background: '#fee2e2',
									border: '1px solid #ef4444',
									borderRadius: '6px',
									color: '#991b1b',
									marginBottom: '12px',
								}}
							>
								❌ {userInfoError}
							</div>
						)}
						{flowState.userInfo ? (
							<>
								<div
									style={{
										padding: '12px',
										background: '#d1fae5',
										border: '1px solid #22c55e',
										borderRadius: '6px',
										color: '#065f46',
										marginBottom: '12px',
									}}
								>
									✅ UserInfo retrieved successfully
								</div>
								<div
									style={{
										padding: '16px',
										background: '#ffffff',
										border: '1px solid #e5e7eb',
										borderRadius: '6px',
										marginBottom: '12px',
									}}
								>
									<div
										style={{
											fontWeight: '600',
											marginBottom: '8px',
											color: '#1f2937',
											fontSize: '14px',
										}}
									>
										UserInfo Data:
									</div>
									<pre
										style={{
											margin: 0,
											padding: '12px',
											background: '#f9fafb',
											borderRadius: '4px',
											border: '1px solid #e5e7eb',
											fontSize: '12px',
											fontFamily: 'monospace',
											overflow: 'auto',
											maxHeight: '300px',
											color: '#1f2937',
										}}
									>
										{JSON.stringify(flowState.userInfo, null, 2)}
									</pre>
								</div>
							</>
						) : (
							<button
								type="button"
								onClick={handleFetchUserInfo}
								disabled={!hasAccessToken || !operationRules.canCallUserInfo || userInfoLoading}
								style={{
									padding: '10px 16px',
									background: (!hasAccessToken || !operationRules.canCallUserInfo) ? '#9ca3af' : '#0ea5e9',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									cursor: (!hasAccessToken || !operationRules.canCallUserInfo) ? 'not-allowed' : 'pointer',
									fontSize: '14px',
									fontWeight: '600',
									opacity: (!hasAccessToken || !operationRules.canCallUserInfo) ? 0.6 : 1,
								}}
								title={
									!hasAccessToken
										? 'Access token required - complete previous steps first'
										: !operationRules.canCallUserInfo
											? operationRules.userInfoReason
											: 'Fetch user information'
								}
							>
								{userInfoLoading ? 'Fetching...' : 'Fetch UserInfo'}
							</button>
						)}
					</div>

				{/* Token Introspection Section - ALWAYS SHOWS with status and disabled buttons */}
				<div
					style={{
						marginTop: '24px',
						padding: '16px',
						background: operationRules.canIntrospectAccessToken ? '#fef3c7' : '#f3f4f6', // Light yellow if allowed, gray if not
						borderRadius: '8px',
						border: `1px solid ${operationRules.canIntrospectAccessToken ? '#f59e0b' : '#9ca3af'}`,
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
						<span style={{ fontSize: '24px' }}>🔍</span>
						<h3 style={{ margin: 0, fontSize: '18px', color: operationRules.canIntrospectAccessToken ? '#92400e' : '#6b7280', flex: 1 }}>
							Token Introspection
							{operationRules.canIntrospectAccessToken ? (
								<span style={{ marginLeft: '8px', fontSize: '14px', color: '#22c55e', fontWeight: 'normal' }}>✅ Available</span>
							) : (
								<span style={{ marginLeft: '8px', fontSize: '14px', color: '#ef4444', fontWeight: 'normal' }}>❌ Not Available</span>
							)}
						</h3>
					</div>
					
					{/* Status explanation */}
					<div
						style={{
							padding: '12px',
							background: operationRules.canIntrospectAccessToken ? '#fef3c7' : '#fee2e2',
							border: `1px solid ${operationRules.canIntrospectAccessToken ? '#f59e0b' : '#ef4444'}`,
							borderRadius: '6px',
							marginBottom: '12px',
							color: operationRules.canIntrospectAccessToken ? '#78350f' : '#991b1b',
							fontSize: '14px',
						}}
					>
						<strong>{operationRules.canIntrospectAccessToken ? '✅ ' : '❌ '}</strong>
						{operationRules.introspectionReason}
						{operationRules.introspectionExplanation && (
							<div style={{ marginTop: '8px', fontSize: '13px', opacity: 0.9 }}>
								{operationRules.introspectionExplanation}
							</div>
						)}
						
						{/* Show what tokens can be introspected */}
						<div style={{ marginTop: '12px', fontSize: '13px', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
							<strong>What can be introspected:</strong>
							<ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
								<li style={{ marginTop: '4px' }}>
									{operationRules.canIntrospectAccessToken ? '✅' : '❌'} Access Token
								</li>
								<li style={{ marginTop: '4px' }}>
									{operationRules.canIntrospectRefreshToken ? '✅' : '❌'} Refresh Token
									{hasRefreshToken ? ' (available)' : ' (not issued in this flow)'}
								</li>
								<li style={{ marginTop: '4px' }}>
									{operationRules.canIntrospectIdToken ? '✅' : '❌'} ID Token
									{hasIdToken ? ' (available)' : ' (not issued in this flow)'}
									{!operationRules.canIntrospectIdToken && ' - Validate locally instead'}
								</li>
							</ul>
						</div>
					</div>
					
					<p style={{ margin: '0 0 12px 0', color: operationRules.canIntrospectAccessToken ? '#78350f' : '#6b7280', fontSize: '14px' }}>
						Validate your access token and retrieve its metadata.
					</p>
					{introspectionError && (
						<div
							style={{
								padding: '12px',
								background: '#fee2e2',
								border: '1px solid #ef4444',
								borderRadius: '6px',
								color: '#991b1b',
								marginBottom: '12px',
							}}
						>
							❌ {introspectionError}
						</div>
					)}
					{introspectionData ? (
						<>
							<div
								style={{
									padding: '12px',
									background: '#d1fae5',
									border: '1px solid #22c55e',
									borderRadius: '6px',
									color: '#065f46',
									marginBottom: '12px',
								}}
							>
								✅ Token introspected successfully
							</div>
							<div
								style={{
									padding: '16px',
									background: '#ffffff',
									border: '1px solid #e5e7eb',
									borderRadius: '6px',
									marginBottom: '12px',
								}}
							>
								<div
									style={{
										fontWeight: '600',
										marginBottom: '8px',
										color: '#1f2937',
										fontSize: '14px',
									}}
								>
									Introspection Data:
								</div>
								<pre
									style={{
										margin: 0,
										padding: '12px',
										background: '#f9fafb',
										borderRadius: '4px',
										border: '1px solid #e5e7eb',
										fontSize: '12px',
										fontFamily: 'monospace',
										overflow: 'auto',
										maxHeight: '300px',
										color: '#1f2937',
									}}
								>
									{JSON.stringify(introspectionData, null, 2)}
								</pre>
							</div>
						</>
					) : (
						<button
							type="button"
							onClick={handleIntrospectToken}
							disabled={!hasAccessToken || !operationRules.canIntrospectAccessToken || introspectionLoading}
							style={{
								padding: '10px 16px',
								background: (!hasAccessToken || !operationRules.canIntrospectAccessToken) ? '#9ca3af' : '#f59e0b',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								cursor: (!hasAccessToken || !operationRules.canIntrospectAccessToken) ? 'not-allowed' : 'pointer',
								fontSize: '14px',
								fontWeight: '600',
								opacity: (!hasAccessToken || !operationRules.canIntrospectAccessToken) ? 0.6 : 1,
							}}
							title={
								!hasAccessToken
									? 'Access token required - complete previous steps first'
									: !operationRules.canIntrospectAccessToken
										? operationRules.introspectionReason
										: 'Introspect access token'
							}
						>
							{introspectionLoading ? 'Introspecting...' : 'Introspect Token'}
						</button>
					)}
				</div>

				{/* Info Box */}
				<div
					style={{
						marginTop: '24px',
						padding: '12px 16px',
						background: '#dbeafe',
						border: '1px solid #3b82f6',
						borderRadius: '8px',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
						<span style={{ fontSize: '20px', flexShrink: 0 }}>ℹ️</span>
						<div>
							<strong style={{ color: '#1e40af' }}>What's the difference?</strong>
							<ul
								style={{
									margin: '8px 0 0 0',
									paddingLeft: '20px',
									fontSize: '14px',
									color: '#1e3a8a',
									lineHeight: '1.6',
								}}
							>
								<li>
									<strong>UserInfo:</strong> Returns user profile information (name, email, etc.)
								</li>
								<li>
									<strong>Introspection:</strong> Returns token metadata (expiration, scopes, etc.)
								</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		);
	};

	// Polling Timeout Modal - shown when polling times out
	const renderPollingTimeoutModal = () => {
		if (!showPollingTimeoutModal) return null;

		return (
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="polling-timeout-title"
				style={{
					display: showPollingTimeoutModal ? 'flex' : 'none',
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundColor: 'rgba(0, 0, 0, 0.6)',
					alignItems: 'center',
					justifyContent: 'center',
					zIndex: 10000,
					padding: '20px',
				}}
				onClick={() => setShowPollingTimeoutModal(false)}
				onKeyDown={(e) => {
					if (e.key === 'Escape') {
						setShowPollingTimeoutModal(false);
					}
				}}
			>
				<div
					style={{
						backgroundColor: 'white',
						borderRadius: '12px',
						padding: '32px',
						maxWidth: '500px',
						width: '100%',
						boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
						position: 'relative',
					}}
					onClick={(e) => e.stopPropagation()}
					onKeyDown={(e) => e.stopPropagation()}
				>
					{/* Header */}
					<div style={{ textAlign: 'center', marginBottom: '24px' }}>
						<div style={{ fontSize: '64px', marginBottom: '16px' }}>⏱️</div>
						<h2
							id="polling-timeout-title"
							style={{
								margin: 0,
								fontSize: '24px',
								fontWeight: '700',
								color: '#dc2626',
							}}
						>
							Polling Timeout
						</h2>
					</div>

					{/* Message */}
					<div
						style={{
							marginBottom: '24px',
							padding: '20px',
							background: '#fef2f2',
							borderRadius: '8px',
							border: '2px solid #fecaca',
						}}
					>
						<div
							style={{
								fontSize: '16px',
								fontWeight: '600',
								color: '#991b1b',
								marginBottom: '12px',
							}}
						>
							Authorization Timeout
						</div>
						<div
							style={{
								fontSize: '14px',
								color: '#7f1d1d',
								lineHeight: '1.6',
							}}
						>
							The device authorization request has timed out. The user did not complete the authorization within the allowed time limit.
						</div>
					</div>

					{/* Details */}
					<div
						style={{
							marginBottom: '24px',
							padding: '16px',
							background: '#f0f9ff',
							borderRadius: '8px',
							border: '1px solid #bfdbfe',
						}}
					>
						<div
							style={{
								fontSize: '14px',
								color: '#1e40af',
								lineHeight: '1.6',
							}}
						>
							<strong>What happened?</strong>
							<br />
							The device code expired before the user completed authorization. This can happen if:
							<ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
								<li>The user took too long to scan the QR code or enter the code</li>
								<li>The user closed the authorization page without completing it</li>
								<li>The device code expiration time was too short</li>
							</ul>
						</div>
					</div>

					{/* Actions */}
					<div
						style={{
							display: 'flex',
							gap: '12px',
							justifyContent: 'flex-end',
						}}
					>
						<button
							type="button"
							onClick={() => setShowPollingTimeoutModal(false)}
							style={{
								padding: '10px 20px',
								background: '#6b7280',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								fontSize: '14px',
								fontWeight: '500',
								cursor: 'pointer',
								transition: 'all 0.2s ease',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = '#4b5563';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = '#6b7280';
							}}
						>
							Close
						</button>
						<button
							type="button"
							onClick={() => {
								setShowPollingTimeoutModal(false);
								// Navigate back to step 1 to request a new device code
								if (onStepChange) {
									onStepChange(1);
								}
							}}
							style={{
								padding: '10px 20px',
								background: '#2196f3',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								fontSize: '14px',
								fontWeight: '500',
								cursor: 'pointer',
								transition: 'all 0.2s ease',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = '#1976d2';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = '#2196f3';
							}}
						>
							Request New Device Code
						</button>
					</div>
				</div>
			</div>
		);
	};

	// Callback Success Modal - shown after successful callback from PingOne
	const renderCallbackSuccessModal = () => {
		// Only render if modal should be shown and callback details exist
		if (!showCallbackSuccessModal || !callbackDetails) {
			return null;
		}

		return (
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby={callbackSuccessModalTitleId}
				style={{
					display: showCallbackSuccessModal ? 'flex' : 'none',
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundColor: 'rgba(0, 0, 0, 0.5)',
					alignItems: 'center',
					justifyContent: 'center',
					zIndex: 9999,
				}}
				onClick={() => setShowCallbackSuccessModal(false)}
				onKeyDown={(e) => {
					if (e.key === 'Escape') {
						setShowCallbackSuccessModal(false);
					}
				}}
			>
				<div
					style={{
						backgroundColor: 'white',
						borderRadius: '12px',
						padding: '20px',
						maxWidth: '550px',
						width: '90%',
						maxHeight: '90vh',
						display: 'flex',
						flexDirection: 'column',
						boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
					}}
					onClick={(e) => e.stopPropagation()}
					onKeyDown={(e) => e.stopPropagation()}
				>
					{/* Header - Compact */}
					<div style={{ marginBottom: '16px', textAlign: 'center', flexShrink: 0 }}>
						<div style={{ fontSize: '40px', marginBottom: '8px' }}>✅</div>
						<h2
							id={callbackSuccessModalTitleId}
							style={{ margin: 0, fontSize: '20px', color: '#1f2937' }}
						>
							Authentication Successful!
						</h2>
						<p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '13px' }}>
							PingOne has redirected you back successfully
						</p>
					</div>

					{/* Scrollable Content */}
					<div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', minHeight: 0 }}>
						{/* What was received (summary without showing tokens) */}
						<div
							style={{
								background: '#d1fae5',
								border: '1px solid #22c55e',
								borderRadius: '8px',
								padding: '12px',
								marginBottom: '12px',
							}}
						>
						<div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
							<span style={{ fontSize: '18px' }}>🎉</span>
							<strong style={{ color: '#065f46', fontSize: '14px' }}>Callback Processed</strong>
						</div>
						<ul style={{ margin: '4px 0 0 0', paddingLeft: '20px', color: '#047857', fontSize: '13px', lineHeight: '1.5' }}>
							{callbackDetails.code && <li>✅ Authorization code received</li>}
							{callbackDetails.allParams.access_token && <li>✅ Access token received</li>}
							{callbackDetails.allParams.id_token && <li>✅ ID token received</li>}
							{callbackDetails.allParams.refresh_token && <li>✅ Refresh token received</li>}
							{callbackDetails.state && <li>✅ State validated</li>}
						</ul>
					</div>

					{/* User Info (if ID token available) */}
					{(() => {
						if (callbackDetails.allParams.id_token) {
							const decoded = TokenDisplayServiceV8.decodeJWT(callbackDetails.allParams.id_token);
							if (decoded && decoded.payload) {
								const payload = decoded.payload as Record<string, unknown>;
								const username = payload.preferred_username || payload.name || payload.email || payload.sub;
								const sub = payload.sub;
								
								return (
									<div
										style={{
											background: '#d1fae5',
											border: '1px solid #10b981',
											borderRadius: '8px',
											padding: '12px',
											marginBottom: '12px',
										}}
									>
										<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
											<div
												style={{
													width: '36px',
													height: '36px',
													borderRadius: '50%',
													background: '#10b981',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													fontSize: '18px',
													flexShrink: 0,
												}}
											>
												👤
											</div>
											<div style={{ flex: 1, minWidth: 0 }}>
												<div style={{ fontSize: '13px', color: '#065f46', fontWeight: '600', marginBottom: '2px' }}>
													👋 USERNAME
												</div>
												<div style={{ fontSize: '14px', color: '#047857', fontWeight: '600', wordBreak: 'break-word' }}>
													{String(username)}
												</div>
												{sub && (
													<div style={{ fontSize: '11px', color: '#059669', marginTop: '4px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
														# {String(sub)}
													</div>
												)}
											</div>
										</div>
									</div>
								);
							}
						}
						return null;
					})()}

					{/* Info about where to see tokens */}
					<div
						style={{
							background: '#dbeafe',
							border: '1px solid #3b82f6',
							borderRadius: '8px',
							padding: '10px 12px',
							fontSize: '13px',
							color: '#1e3a8a',
							marginBottom: '12px',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
							<span>💡</span>
							<span>View and decode tokens on the next step</span>
						</div>
					</div>

					{/* User Claims (from ID Token) */}
					{(() => {
						if (callbackDetails.allParams.id_token) {
							const decoded = TokenDisplayServiceV8.decodeJWT(callbackDetails.allParams.id_token);
							if (decoded && decoded.payload) {
								const payload = decoded.payload as Record<string, unknown>;
								
								// Extract common user claims
								const name = payload.name || payload.given_name || payload.preferred_username || payload.sub;
								const email = payload.email;
								const username = payload.preferred_username;
								
								return (
									<div style={{ marginBottom: '12px' }}>
										{/* Basic User Info Card */}
										<div
											style={{
												background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
												borderRadius: '8px',
												padding: '14px',
												marginBottom: '12px',
												color: '#ffffff', // White text on dark background
											}}
										>
											<div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
												<div
													style={{
														width: '40px',
														height: '40px',
														borderRadius: '50%',
														background: 'rgba(255, 255, 255, 0.2)',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														fontSize: '20px',
													}}
												>
													👤
												</div>
												<div style={{ flex: 1 }}>
													<div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '2px' }}>
														{String(name || 'User')}
													</div>
													{email && (
														<div style={{ fontSize: '12px', opacity: 0.9 }}>
															📧 {String(email)}
														</div>
													)}
													{username && username !== email && (
														<div style={{ fontSize: '12px', opacity: 0.9 }}>
															🔑 {String(username)}
														</div>
													)}
												</div>
											</div>
										</div>

										{/* All Claims (Expandable) */}
										<details style={{ marginTop: '8px' }}>
											<summary
												style={{
													cursor: 'pointer',
													fontWeight: '600',
													marginBottom: '8px',
													color: '#1f2937', // Dark text on light background
													fontSize: '13px',
													padding: '6px',
													background: '#f3f4f6', // Light grey background
													borderRadius: '4px',
												}}
											>
												🔍 View All Claims
											</summary>
											<div
												style={{
													padding: '12px',
													background: '#f8fafc', // Light background
													borderRadius: '6px',
													border: '1px solid #e2e8f0',
													fontFamily: 'monospace',
													fontSize: '11px',
													maxHeight: '150px',
													overflow: 'auto',
												}}
											>
												{Object.entries(payload).map(([key, value]) => (
													<div key={key} style={{ marginBottom: '4px' }}>
														<span style={{ color: '#6366f1', fontWeight: '600' }}>{key}</span>
														<span style={{ color: '#6b7280' }}>: </span>
														<span style={{ color: '#1f2937' }}>
															{typeof value === 'object' ? JSON.stringify(value) : String(value)}
														</span>
													</div>
												))}
											</div>
										</details>
									</div>
								);
							}
						}
						return null;
					})()}

					{/* Additional Parameters (Safe Only) */}
					{(() => {
						const safeParams = Object.entries(callbackDetails.allParams).filter(
							([key]) =>
								!['access_token', 'id_token', 'refresh_token', 'code', 'state', 'session_state'].includes(key)
						);

						if (safeParams.length > 0) {
							return (
								<div style={{ marginBottom: '20px' }}>
									<div
										style={{
											fontWeight: '600',
											marginBottom: '8px',
											color: '#1f2937',
											fontSize: '14px',
										}}
									>
										📋 Additional Parameters
									</div>
									<div
										style={{
											padding: '12px',
											background: '#f8fafc',
											borderRadius: '6px',
											border: '1px solid #e2e8f0',
											fontFamily: 'monospace',
											fontSize: '11px',
											maxHeight: '150px',
											overflow: 'auto',
										}}
									>
										{safeParams.map(([key, value]) => (
											<div key={key} style={{ marginBottom: '4px' }}>
												<span style={{ color: '#6366f1', fontWeight: '600' }}>{key}</span>
												<span style={{ color: '#6b7280' }}>: </span>
												<span style={{ color: '#1f2937' }}>{value}</span>
											</div>
										))}
									</div>
								</div>
							);
						}
						return null;
					})()}

					{/* Next Steps */}
					<div
						style={{
							padding: '12px',
							background: '#dbeafe',
							borderRadius: '6px',
							marginBottom: '20px',
							fontSize: '13px',
							color: '#1e40af',
						}}
					>
						<strong>Next Steps:</strong>
						{callbackDetails.code ? (
							<ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
								<li>Click "Close" below to continue</li>
								<li>Then click "Next Step" to proceed</li>
								<li>Exchange the authorization code for tokens</li>
							</ol>
						) : (
							<ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
								<li>Click "Close" below to continue</li>
								<li>Tokens have been automatically extracted!</li>
								<li>Click "Next Step" to view and use your tokens</li>
							</ol>
						)}
					</div>
					</div>

					{/* Fixed Footer - Close Button */}
					<button
						type="button"
						onClick={() => setShowCallbackSuccessModal(false)}
						style={{
							width: '100%',
							padding: '12px',
							background: '#22c55e',
							color: 'white',  // White text on green background
							border: 'none',
							borderRadius: '8px',
							fontSize: '16px',
							fontWeight: '600',
							cursor: 'pointer',
							flexShrink: 0,
						}}
					>
						Close
					</button>
				</div>
			</div>
		);
	};

	/**
	 * Render step content based on current step and flow type
	 * 
	 * This is the main routing function that determines which step UI to display.
	 * The step number and flow type determine which render function is called.
	 * 
	 * Step routing logic:
	 * - Step 0: Always configuration (handled by parent component)
	 * - Step 1+: Flow-specific steps (PKCE, Auth URL, Callback, Exchange, Tokens, etc.)
	 * 
	 * Flow-specific step mappings:
	 * 
	 * Client Credentials (4 steps):
	 *   0: Config (parent)
	 *   1: Request Token
	 *   2: Display Tokens
	 *   3: Introspection & UserInfo
	 * 
	 * Device Code (5 steps):
	 *   0: Config (parent)
	 *   1: Request Device Authorization
	 *   2: Poll for Tokens
	 *   3: Display Tokens
	 *   4: Introspection & UserInfo
	 * 
	 * Implicit (5 steps):
	 *   0: Config (parent)
	 *   1: Generate Authorization URL
	 *   2: Parse Fragment (extract tokens from URL)
	 *   3: Display Tokens
	 *   4: Introspection & UserInfo
	 * 
	 * Authorization Code / Hybrid (7 steps - PKCE step always shown):
	 *   0: Config (parent)
	 *   1: Generate PKCE Parameters (always shown)
	 *   2: Generate Authorization URL (with or without PKCE based on setting)
	 *   3: Handle Callback (extract authorization code)
	 *   4: Exchange Code for Tokens (with or without code_verifier based on PKCE setting)
	 *   5: Display Tokens
	 *   6: Introspection & UserInfo
	 * 
	 * @returns {JSX.Element | null} The rendered step content, or null if step is invalid
	 */
	const renderStepContent = () => {
		// Debug logging for step routing
		console.log(`${MODULE_TAG} [STEP ROUTING] Rendering step content`, {
			currentStep,
			flowType,
			usePKCE: isPKCERequired,
			pkceEnforcement: credentials.pkceEnforcement,
			alwaysShowPKCE: flowType === 'oauth-authz' || flowType === 'hybrid',
		});

		switch (currentStep) {
			case 0:
				return renderStep0();

			case 1:
				if (flowType === 'device-code') {
					return renderStep1DeviceAuth();
				}
				if (flowType === 'client-credentials') {
					return renderStep2RequestToken();
				}
				// PKCE step for oauth-authz and hybrid flows - ALWAYS show regardless of PKCE setting
				if (flowType === 'oauth-authz' || flowType === 'hybrid') {
					console.log(`${MODULE_TAG} [STEP ROUTING] Showing PKCE step (Step 1) - always shown for ${flowType}`);
					return renderStep1PKCE();
				}
				// For implicit flow, show Authorization URL step
				console.log(`${MODULE_TAG} [STEP ROUTING] Showing Auth URL step for ${flowType}`);
				return renderStep1AuthUrl();

			case 2:
				// For oauth-authz and hybrid, Step 2 is Authorization URL (always after PKCE step)
				if (flowType === 'oauth-authz' || flowType === 'hybrid') {
					return renderStep1AuthUrl();
				}
				// For other flows, Step 2 is callback/fragment handling
				if (flowType === 'implicit') {
					return renderStep2Fragment();
				}
				if (flowType === 'device-code') {
					return renderStep2Poll();
				}
				// Client credentials - go to tokens
				return renderStep3Tokens();

			case 3:
				// For oauth-authz and hybrid, Step 3 is callback handling (after Auth URL)
				if (flowType === 'oauth-authz') {
					return renderStep2Callback();
				}
				if (flowType === 'hybrid') {
					// Hybrid flow can have both callback and fragment - show callback handler
					return renderStep2Callback();
				}
				if (flowType === 'client-credentials') {
					// Client Credentials: Step 3 is Introspection & UserInfo (after Tokens at step 2)
					return renderStep6IntrospectionUserInfo();
				}
				// For implicit and device-code, Step 3 is Tokens
				if (flowType === 'implicit' || flowType === 'device-code') {
					return renderStep3Tokens();
				}
				// All other flows - show tokens
				return renderStep3Tokens();

			case 4:
				// For oauth-authz and hybrid, Step 4 is token exchange (after callback)
				if (flowType === 'oauth-authz' || flowType === 'hybrid') {
					return renderStep3ExchangeTokens();
				}
				// For implicit and device-code, Step 4 is Introspection & UserInfo (after Tokens at step 3)
				if (flowType === 'implicit' || flowType === 'device-code') {
					return renderStep6IntrospectionUserInfo();
				}
				// All other flows - show tokens (shouldn't reach here for flows with 4 steps)
				return renderStep3Tokens();

			case 5:
				// For oauth-authz and hybrid, Step 5 is display tokens (after exchange)
				return renderStep3Tokens();

			case 6:
				// For oauth-authz and hybrid, Step 6 is introspection & userinfo
				return renderStep6IntrospectionUserInfo();

			default:
				// For other flows, check if we're on the last step (introspection & userinfo)
				if (currentStep === totalSteps - 1) {
					return renderStep6IntrospectionUserInfo();
				}
				return null;
		}
	};

	return (
		<>
			<style>{`
				.unified-flow-steps-v8u .btn {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					gap: 8px;
					padding: 10px 20px;
					border: none;
					border-radius: 6px;
					font-size: 14px;
					font-weight: 500;
					cursor: pointer;
					transition: all 0.2s ease;
					outline: none;
				}

				.unified-flow-steps-v8u .btn:focus-visible {
					outline: 2px solid #3b82f6;
					outline-offset: 2px;
				}

				.unified-flow-steps-v8u .btn-primary {
					background: #3b82f6;
					color: white;
				}

				.unified-flow-steps-v8u .btn-primary:hover:not(:disabled) {
					background: #2563eb;
					box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
					transform: translateY(-1px);
				}

				.unified-flow-steps-v8u .btn-primary:active:not(:disabled) {
					transform: translateY(0);
				}

				.unified-flow-steps-v8u .btn-primary:disabled {
					background: #9ca3af;
					color: #ffffff;
					cursor: not-allowed;
					opacity: 0.6;
				}

				.unified-flow-steps-v8u .btn-secondary {
					background: #f3f4f6;
					color: #374151;
					border: 1px solid #d1d5db;
				}

				.unified-flow-steps-v8u .btn-secondary:hover:not(:disabled) {
					background: #e5e7eb;
					border-color: #9ca3af;
				}

				.unified-flow-steps-v8u .btn-secondary:active:not(:disabled) {
					transform: translateY(1px);
				}

				.unified-flow-steps-v8u .btn-secondary:disabled {
					background: #f3f4f6;
					color: #9ca3af;
					cursor: not-allowed;
					opacity: 0.5;
				}

				.unified-flow-steps-v8u .step-content {
					padding: 0;
				}

				.unified-flow-steps-v8u .step-content h2 {
					font-size: 18px;
					font-weight: 600;
					margin: 0 0 8px 0;
					color: #1f2937;
				}

				.unified-flow-steps-v8u .step-content p {
					font-size: 14px;
					color: #6b7280;
					margin: 0 0 16px 0;
					line-height: 1.5;
				}
			`}</style>
			<div
				className="unified-flow-steps-v8u"
				style={{
					padding: '24px',
					background: '#ffffff',
					borderRadius: '12px',
					border: '1px solid #e2e8f0',
					boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
					marginTop: '24px',
				}}
			>
				{/* Modern Flow Step Breadcrumbs - Replaces old progress bar */}
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						flexWrap: 'wrap',
						padding: '16px',
						background:
							'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
						borderRadius: '12px',
						border: '1px solid rgba(102, 126, 234, 0.2)',
						marginBottom: '24px',
					}}
				>
					{stepLabels.map((label, index) => {
						const isActive = index === nav.currentStep;
						const isCompleted = nav.completedSteps.includes(index);
						const isUpcoming = index > nav.currentStep;

						return (
							<React.Fragment key={index}>
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '8px',
										padding: '8px 16px',
										background: isCompleted
											? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
											: isActive
												? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
												: '#f3f4f6',
										borderRadius: '20px',
										fontSize: '14px',
										fontWeight: isActive ? '600' : '500',
										color: isCompleted || isActive ? '#ffffff' : '#6b7280',
										opacity: isUpcoming ? 0.5 : 1,
										boxShadow: isActive
											? '0 4px 12px rgba(102, 126, 234, 0.3)'
											: isCompleted
												? '0 2px 8px rgba(16, 185, 129, 0.2)'
												: 'none',
										transition: 'all 0.3s ease',
										cursor: isUpcoming ? 'not-allowed' : 'default',
									}}
								>
									{isCompleted ? (
										<span style={{ fontSize: '16px', fontWeight: 'bold' }}>✓</span>
									) : (
										<span
											style={{
												display: 'inline-flex',
												alignItems: 'center',
												justifyContent: 'center',
												width: '22px',
												height: '22px',
												borderRadius: '50%',
												background: isActive
													? 'rgba(255, 255, 255, 0.25)'
													: isCompleted
														? 'rgba(255, 255, 255, 0.25)'
														: 'rgba(107, 114, 128, 0.15)',
												fontSize: '12px',
												fontWeight: '700',
											}}
										>
											{index + 1}
										</span>
									)}
									<span>{label}</span>
								</div>
								{index < stepLabels.length - 1 && (
									<span
										style={{
											fontSize: '18px',
											color: isCompleted ? '#10b981' : '#9ca3af',
											fontWeight: '300',
										}}
									>
										→
									</span>
								)}
							</React.Fragment>
						);
					})}
				</div>

				{/* Validation Feedback - Removed per user request (was showing false positives) */}

				{/* Step Content */}
				<div style={{ marginTop: '24px' }}>{renderStepContent()}</div>

				{/* Step Action Buttons with Restart Flow in the middle - All buttons same size and color scheme */}
				<div
					style={{
						display: 'flex',
						gap: '12px',
						justifyContent: 'space-between',
						alignItems: 'center',
						padding: '16px 0',
						marginTop: '24px',
					}}
				>
					{/* Previous Button */}
					<button
						type="button"
						onClick={nav.goToPrevious}
						disabled={!nav.canGoPrevious}
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: '8px',
							padding: '10px 20px',
							minWidth: '120px',
							background: nav.canGoPrevious ? '#2196f3' : '#9ca3af',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							fontSize: '14px',
							fontWeight: '500',
							cursor: nav.canGoPrevious ? 'pointer' : 'not-allowed',
							transition: 'all 0.2s ease',
							opacity: nav.canGoPrevious ? 1 : 0.6,
						}}
						onMouseEnter={(e) => {
							if (nav.canGoPrevious) {
								e.currentTarget.style.background = '#1976d2';
							}
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = nav.canGoPrevious ? '#2196f3' : '#9ca3af';
						}}
						title={nav.canGoPrevious ? 'Go to previous step' : 'Cannot go to previous step'}
					>
						<span>◀</span>
						<span>Previous</span>
					</button>

					{/* Restart Flow Button - In the middle */}
					<button
						type="button"
						onClick={handleRestartFlow}
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: '8px',
							padding: '10px 20px',
							minWidth: '120px',
							background: '#2196f3',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							fontSize: '14px',
							fontWeight: '500',
							cursor: 'pointer',
							transition: 'all 0.2s ease',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = '#1976d2';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = '#2196f3';
						}}
						title="Clear OAuth tokens and flow state (credentials and worker token will be preserved)"
					>
						<span>🔄</span>
						<span>Restart Flow</span>
					</button>

					{/* Next Button - Green with white text and arrow - Hidden on last step */}
					{currentStep < totalSteps - 1 && (
						<button
							type="button"
							className="btn btn-next"
							onClick={nav.goToNext}
							disabled={!nav.canGoNext}
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: '8px',
								minWidth: '120px',
							}}
							title={nav.canGoNext ? 'Proceed to next step' : 'Complete the current step first'}
						>
							<span>Next Step</span>
							<FiArrowRight size={16} style={{ marginLeft: '4px' }} />
						</button>
					)}
				</div>
			</div>

			{/* UserInfo Success Modal */}
			{renderUserInfoModal()}

			{/* Callback Success Modal */}
			{renderCallbackSuccessModal()}

			{/* Polling Timeout Modal */}
			{renderPollingTimeoutModal()}
			{/* Redirectless Login Modal */}
			<RedirectlessLoginModal
				isOpen={showRedirectlessModal}
				onClose={() => {
					setShowRedirectlessModal(false);
					setRedirectlessAuthError(null);
					setIsRedirectlessAuthenticating(false);
				}}
				onLogin={handleSubmitRedirectlessCredentials}
				title="PingOne Redirectless Authentication"
				subtitle="Enter your credentials to continue with redirectless authentication"
				isLoading={isRedirectlessAuthenticating}
				error={redirectlessAuthError}
			/>
		</>
	);
};

export default UnifiedFlowSteps;
