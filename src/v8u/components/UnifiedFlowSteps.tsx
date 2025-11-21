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
 * - ROPC: Config → Username/Password → Token Request → Tokens
 * - Hybrid: Config → Auth URL → Fragment/Callback → Tokens
 */

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { FiArrowRight, FiRefreshCw } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import { ColoredUrlDisplay } from '@/components/ColoredUrlDisplay';
import DeviceTypeSelector from '@/components/DeviceTypeSelector';
import DynamicDeviceFlow from '@/components/DynamicDeviceFlow';
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

	// ROPC flow
	username?: string;
	password?: string;

	// Tokens (all flows)
	tokens?: {
		accessToken?: string;
		idToken?: string;
		refreshToken?: string;
		expiresIn?: number;
	};

	// UserInfo (OIDC)
	userInfo?: Record<string, unknown>;
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
}) => {
	// Generate flowKey dynamically (matches parent component's logic)
	const flowKey = `${flowType}-v8u`;
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
			usePKCE: credentials.usePKCE,
			enableRefreshToken: credentials.enableRefreshToken,
			allKeys: Object.keys(credentials),
		});
		console.log(`${MODULE_TAG} Full Credentials JSON:`, JSON.stringify(credentials, null, 2));
		console.log(`${MODULE_TAG} ========== UNIFIED-FLOW-STEPS CREDENTIALS END ==========`);
	}, [credentials, flowType]);

	// Determine number of steps based on flow type and PKCE setting
	const getTotalSteps = (): number => {
		switch (flowType) {
			case 'client-credentials':
				return 4; // Config → Token Request → Tokens → Introspection & UserInfo
			case 'ropc':
				return 5; // Config → Enter Credentials → Request Token → Tokens → Introspection & UserInfo
			case 'device-code':
				return 5; // Config → Device Auth → Poll → Tokens → Introspection & UserInfo
			case 'implicit':
				return 5; // Config → Auth URL → Fragment → Tokens → Introspection & UserInfo
			case 'hybrid':
				// If PKCE enabled: Config → PKCE → Auth URL → Parse Callback → Exchange → Tokens → Introspection & UserInfo (7 steps)
				// If PKCE disabled: Config → Auth URL → Parse Callback → Exchange → Tokens → Introspection & UserInfo (6 steps)
				return credentials.usePKCE ? 7 : 6;
			default:
				// oauth-authz flow
				// If PKCE enabled: Config → PKCE → Auth URL → Handle Callback → Exchange → Tokens → Introspection & UserInfo (7 steps)
				// If PKCE disabled: Config → Auth URL → Handle Callback → Exchange → Tokens → Introspection & UserInfo (6 steps)
				return credentials.usePKCE ? 7 : 6;
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
		} else if (flowType === 'ropc') {
			const storedTokens = sessionStorage.getItem('v8u_ropc_tokens');
			if (storedTokens) {
				try {
					const tokens = JSON.parse(storedTokens);
					console.log(`${MODULE_TAG} Restored ROPC tokens from sessionStorage`, {
						hasAccessToken: !!tokens.accessToken,
					});
					initialState.tokens = tokens;
				} catch (err) {
					console.error(`${MODULE_TAG} Failed to parse stored ROPC tokens`, err);
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
	const ropcUsernameId = useId();
	const ropcPasswordId = useId();
	const callbackUrlDisplayId = useId();
	const authzCodeInputId = useId();
	const fragmentUrlInputId = useId();
	const callbackSuccessModalTitleId = useId();

	// Helper function to show success modal with token details
	const showTokenSuccessModal = useCallback((tokens: TokenResponse) => {
		const allParams: Record<string, string> = {
			access_token: tokens.access_token,
			token_type: tokens.token_type || 'Bearer',
			expires_in: String(tokens.expires_in || 3600),
			scope: tokens.scope || credentials.scopes || '',
		};
		if (tokens.id_token) {
			allParams.id_token = tokens.id_token;
		}
		if (tokens.refresh_token) {
			allParams.refresh_token = tokens.refresh_token;
		}

		setCallbackDetails({
			url: '', // No callback URL for direct token requests
			code: '', // No code for direct token requests
			state: '',
			sessionState: '',
			allParams,
		});

		// Show success modal
		setShowCallbackSuccessModal(true);
	}, [credentials.scopes]);

	// Helper function to fetch UserInfo using OIDC discovery (used across all flows)
	const fetchUserInfoWithDiscovery = useCallback(
		async (accessToken: string, environmentId: string): Promise<Record<string, unknown> | null> => {
			try {
				// Discover the userinfo endpoint from OIDC well-known configuration
				const issuerUrl = `https://auth.pingone.com/${environmentId}`;
				const discoveryResult = await OidcDiscoveryServiceV8.discover(issuerUrl);

				if (!discoveryResult.success || !discoveryResult.data?.userInfoEndpoint) {
					throw new Error(discoveryResult.error || 'Failed to discover userinfo endpoint');
				}

				const userInfoEndpoint = discoveryResult.data.userInfoEndpoint;
				console.log(`${MODULE_TAG} Fetching UserInfo via backend proxy`, { userInfoEndpoint });

				// Use backend proxy to avoid CORS issues
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

	// Restart flow - clears OAuth tokens and flow state (but preserves credentials and worker token)
	const handleRestartFlow = useCallback(() => {
		console.log(
			`${MODULE_TAG} Restarting flow - clearing OAuth tokens and flow state (preserving credentials and worker token)`
		);

		// Clear flow state (OAuth tokens: access, ID, refresh tokens)
		// Also clears: authorization codes, device codes, PKCE codes, authorization URLs, userInfo
		setFlowState({});

		// Clear sessionStorage (all flow-specific data)
		// Clear PKCE codes from all storage locations using the service
		PKCEStorageServiceV8U.clearPKCECodes(flowKey).catch((err) => {
			console.error(`${MODULE_TAG} Failed to clear PKCE codes from all storage`, err);
		});
		sessionStorage.removeItem('v8u_callback_data');
		sessionStorage.removeItem('v8u_implicit_tokens');
		sessionStorage.removeItem('v8u_device_code_data');
		sessionStorage.removeItem('v8u_client_credentials_tokens');
		sessionStorage.removeItem('v8u_ropc_tokens');
		console.log(`${MODULE_TAG} Cleared sessionStorage (all flow-specific data)`);

		// Reset navigation to step 0
		reset();

		// Clear errors and validation state
		setError(null);
		setValidationErrorsState([]);
		setValidationWarningsState([]);
		setCompletedSteps([]);

		// Notify parent to reload credentials from storage (preserves credentials)
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

			// Client secret required for client credentials and ROPC flows
			if (flowType === 'client-credentials' || flowType === 'ropc') {
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
					!credentials.usePKCE; // Client secret not required when using PKCE
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
	useEffect(() => {
		// Only validate PKCE step for flows that use PKCE
		if (currentStep === 1 && (flowType === 'oauth-authz' || flowType === 'hybrid')) {
			const errors: string[] = [];

			// PKCE codes are required
			if (!flowState.codeVerifier?.trim()) {
				errors.push('PKCE Code Verifier is missing. Please generate PKCE codes in the configuration step.');
			}
			if (!flowState.codeChallenge?.trim()) {
				errors.push('PKCE Code Challenge is missing. Please generate PKCE codes in the configuration step.');
			}

			// Update validation errors
			setValidationErrorsState(errors);

			// Mark step as complete if no errors (both codes are present)
			if (
				errors.length === 0 &&
				flowState.codeVerifier &&
				flowState.codeChallenge &&
				!completedSteps.includes(1)
			) {
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
				usePKCE: credentials.usePKCE,
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
			if (credentials.usePKCE) {
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
			if (!credentials.usePKCE && (!credentials.redirectUri || !credentials.redirectUri.trim())) {
				errors.push(
					'Redirect URI is required for token exchange. Please check your configuration.'
				);
			}

			console.log(`${MODULE_TAG} Validation Errors Found:`, errors.length);
			// Set validation errors if any are found
			if (errors.length > 0) {
				console.warn(`${MODULE_TAG} Missing required fields on token exchange step`, {
					usePKCE: credentials.usePKCE,
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
			if (flowType === 'client-credentials' || flowType === 'ropc') {
				tokenStep = 2; // Step 3 (0-indexed: 0, 1, 2)
			} else if (flowType === 'device-code' || flowType === 'implicit') {
				tokenStep = 3; // Step 4 (0-indexed: 0, 1, 2, 3)
			} else if (flowType === 'oauth-authz' || flowType === 'hybrid') {
				tokenStep = credentials.usePKCE ? 5 : 4; // Step 6 or 5 depending on PKCE
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
	}, [flowState.tokens?.accessToken, flowType, credentials.usePKCE, completedSteps]);

	// Also mark current step as complete if we're on the tokens step and tokens are available
	useEffect(() => {
		if (flowState.tokens?.accessToken) {
			// Determine which step is the token display step based on flow type
			let tokenStep = -1;
			if (flowType === 'client-credentials' || flowType === 'ropc') {
				tokenStep = 2; // Step 3 (0-indexed: 0, 1, 2)
			} else if (flowType === 'device-code' || flowType === 'implicit') {
				tokenStep = 3; // Step 4 (0-indexed: 0, 1, 2, 3)
			} else if (flowType === 'oauth-authz' || flowType === 'hybrid') {
				tokenStep = credentials.usePKCE ? 5 : 4; // Step 6 or 5 depending on PKCE
			}

			// If we're currently on the tokens step and it's not marked complete, mark it
			if (currentStep === tokenStep && !completedSteps.includes(currentStep)) {
				console.log(`${MODULE_TAG} On tokens step with tokens available - marking step ${currentStep} as complete`);
				nav.markStepComplete();
			}
		}
	}, [flowState.tokens?.accessToken, currentStep, flowType, credentials.usePKCE, completedSteps, nav]);

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

					// DON'T auto-mark step complete - let user see the callback first
					// User can click "Next Step" when ready
					// nav.markStepComplete(); // REMOVED - user should manually proceed

					// Show success modal with callback details
					setShowCallbackSuccessModal(true);
					toastV8.success('Authorization code received from PingOne!');

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
			case 'ropc':
				return [
					'Configure',
					'Enter Credentials',
					'Request Token',
					'Tokens',
					'Introspection & UserInfo',
				];
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
				if (credentials.usePKCE) {
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
				if (credentials.usePKCE) {
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

	// Step 1 or 2: Generate Authorization URL (authz, implicit, hybrid)
	// For oauth-authz and hybrid, this is Step 2 (after PKCE)
	// For implicit, this is Step 1
	const renderStep1AuthUrl = () => {
		const handleGenerateAuthUrl = () => {
			console.log(`${MODULE_TAG} Generating authorization URL`, {
				flowType,
				hasPKCE: !!(flowState.codeVerifier && flowState.codeChallenge),
				redirectUri: credentials.redirectUri,
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				fullCredentials: credentials,
			});

			// Validate required fields
			if (!credentials.redirectUri) {
				const errorMsg =
					'Redirect URI is required. Please go back to Step 0 and ensure the Redirect URI field is populated.';
				setError(errorMsg);
				nav.setValidationErrors([errorMsg]);
				toastV8.error(errorMsg);
				return;
			}

			setIsLoading(true);
			setError(null);

			try {
				// For flows that use PKCE (oauth-authz, hybrid), use existing PKCE codes from flowState
				// For implicit flow, PKCE is not used
				const result = UnifiedFlowIntegrationV8U.generateAuthorizationUrl(
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

		// Step number depends on whether PKCE is enabled
		// If PKCE enabled: Step 2 (after PKCE generation)
		// If PKCE disabled: Step 1 (first step)
		const stepTitle =
			(flowType === 'oauth-authz' || flowType === 'hybrid') && credentials.usePKCE
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
				const newState: Partial<FlowState> = {
					...flowState,
					deviceCode: result.device_code,
					userCode: result.user_code,
					verificationUri: result.verification_uri,
					...(result.verification_uri_complete && { verificationUriComplete: result.verification_uri_complete }),
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

	// Step 1: Username/Password (ROPC flow)
	const renderStep1ROPC = () => {
		const hasCredentials = !!(flowState.username && flowState.password);
		const isComplete = hasCredentials && completedSteps.includes(currentStep);

		return (
			<div className="step-content">
				<h2>Step 1: Enter Resource Owner Credentials</h2>
				<p>Enter the username and password for the resource owner.</p>

				{/* Security Warning - ROPC is Deprecated */}
				<div
					style={{
						background: '#fee2e2',
						border: '2px solid #ef4444',
						borderRadius: '8px',
						padding: '16px',
						marginTop: '16px',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
						<span style={{ fontSize: '24px', flexShrink: 0 }}>⚠️</span>
						<div>
							<h3
								style={{
									margin: '0 0 8px 0',
									fontSize: '16px',
									fontWeight: '600',
									color: '#991b1b',
								}}
							>
								Security Warning: ROPC Flow is Deprecated
							</h3>
							<div style={{ fontSize: '14px', color: '#991b1b', lineHeight: '1.6' }}>
								<p style={{ margin: '0 0 8px 0' }}>
									<strong>The Resource Owner Password Credentials (ROPC) flow is deprecated</strong>{' '}
									in OAuth 2.1 and considered insecure:
								</p>
								<ul style={{ margin: '0 0 8px 0', paddingLeft: '20px' }}>
									<li style={{ marginBottom: '4px' }}>
										Applications must handle user credentials directly (security risk)
									</li>
									<li style={{ marginBottom: '4px' }}>
										No support for multi-factor authentication (MFA)
									</li>
									<li style={{ marginBottom: '4px' }}>
										No support for federated identity providers
									</li>
									<li style={{ marginBottom: '4px' }}>
										Credentials exposed to the application (violates OAuth principles)
									</li>
								</ul>
								<p
									style={{
										margin: '8px 0 0 0',
										padding: '8px',
										background: 'rgba(255, 255, 255, 0.5)',
										borderRadius: '4px',
									}}
								>
									<strong>✅ Recommended Alternative:</strong> Use the{' '}
									<strong>Authorization Code Flow</strong> with PKCE instead. It provides better
									security, MFA support, and follows OAuth best practices.
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Educational Info */}
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
									<strong>The ROPC Flow</strong> exchanges username and password directly for
									tokens:
								</p>
								<ol style={{ margin: '0 0 8px 0', paddingLeft: '20px' }}>
									<li style={{ marginBottom: '4px' }}>
										<strong>Step 1 (this step):</strong> Enter resource owner credentials (username
										and password)
									</li>
									<li style={{ marginBottom: '4px' }}>
										<strong>Step 2 (next):</strong> Application sends credentials to token endpoint
										to exchange for access token
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
									<strong>⚠️ Security Note:</strong> This flow is <strong>deprecated</strong> because
									it violates OAuth's core principle of not exposing user credentials to
									applications. Use only for trusted applications or testing.
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Show success if credentials were entered */}
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
									Credentials Entered
								</h3>
								<p style={{ margin: '0', fontSize: '14px', color: '#047857', fontWeight: '600' }}>
									→ Click "Next Step" below to request access token
								</p>
							</div>
						</div>
					</div>
				)}

				<div style={{ marginTop: '24px' }}>
					<div style={{ marginBottom: '16px' }}>
						<label
							htmlFor={ropcUsernameId}
							style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}
						>
							Username <span style={{ color: '#ef4444' }}>*</span>
						</label>
						<input
							id={ropcUsernameId}
							type="text"
							value={flowState.username || ''}
							onChange={(e) => setFlowState({ ...flowState, username: e.target.value })}
							placeholder="resource.owner@example.com"
							autoComplete="username"
							style={{
								width: '100%',
								padding: '10px 12px',
								borderRadius: '6px',
								border: '1px solid #cbd5e1',
								fontSize: '14px',
							}}
						/>
					</div>

					<div style={{ marginBottom: '16px' }}>
						<label
							htmlFor={ropcPasswordId}
							style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}
						>
							Password <span style={{ color: '#ef4444' }}>*</span>
						</label>
						<input
							id={ropcPasswordId}
							type="password"
							value={flowState.password || ''}
							onChange={(e) => setFlowState({ ...flowState, password: e.target.value })}
							placeholder="••••••••"
							autoComplete="current-password"
							style={{
								width: '100%',
								padding: '10px 12px',
								borderRadius: '6px',
								border: '1px solid #cbd5e1',
								fontSize: '14px',
							}}
						/>
					</div>

					{hasCredentials && !isComplete && (
						<button
							type="button"
							className="btn btn-next"
							onClick={() => nav.markStepComplete()}
							style={{ marginTop: '8px' }}
						>
							Continue
						</button>
					)}
				</div>
			</div>
		);
	};

	// Step 2: Handle Callback (authorization code and hybrid flows)
	const renderStep2Callback = () => {
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
								flowState.state || ''
							);

							const accessTokenValue = (fragmentResult as { access_token?: string }).access_token;
							const idTokenValue = (fragmentResult as { id_token?: string }).id_token;
							const tokens: NonNullable<FlowState['tokens']> = {
								accessToken: accessTokenValue || '',
								expiresIn: 3600,
							};
							if (idTokenValue) {
								tokens.idToken = idTokenValue;
							}

							updates.tokens = tokens;

							// Save tokens to sessionStorage
							sessionStorage.setItem(
								'v8u_implicit_tokens',
								JSON.stringify({
									...tokens,
									extractedAt: Date.now(),
								})
							);
							console.log(`${MODULE_TAG} Hybrid flow: Tokens extracted and saved`);

							// Fetch UserInfo if OIDC and access token available (using OIDC discovery)
							if (specVersion === 'oidc' && tokens.accessToken) {
								fetchUserInfoWithDiscovery(tokens.accessToken, credentials.environmentId)
									.then((userInfo: Record<string, unknown> | null) => {
										if (userInfo) {
											updates.userInfo = userInfo;
											setFlowState((prev) => ({ ...prev, userInfo }));
											toastV8.userInfoFetched();

											// Show success modal with user information
											setShowUserInfoModal(true);
										} else if (tokens.idToken) {
											// Still show modal if we have ID token with user info
											setShowUserInfoModal(true);
										}
									})
									.catch((err: unknown) => {
										console.warn(`${MODULE_TAG} Failed to fetch UserInfo`, err);

										// Still show modal if we have ID token with user info
										if (tokens.idToken) {
											setShowUserInfoModal(true);
										}
									});
							} else if (tokens.idToken) {
								// If we have ID token but no UserInfo, show modal with ID token data
								setShowUserInfoModal(true);
							}
						} catch (err) {
							console.error(`${MODULE_TAG} Failed to parse fragment for hybrid flow`, err);
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

		// Check if data was already extracted (for hybrid flow, check both code and tokens)
		const hasCode = !!flowState.authorizationCode;
		const hasTokens = flowType === 'hybrid' ? !!flowState.tokens?.accessToken : false;
		const isComplete = hasCode && (flowType === 'hybrid' ? hasTokens : true);

		return (
			<div className="step-content">
				<h2>Step 2: Handle Callback</h2>
				<p>
					After authenticating, you'll be redirected back with{' '}
					{flowType === 'hybrid' ? 'an authorization code and tokens' : 'an authorization code'}.
				</p>

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
				{isComplete && completedSteps.includes(currentStep) && (
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
									{flowType === 'hybrid' && hasTokens
										? 'Authorization Code and Tokens Extracted Successfully!'
										: 'Authorization Code Extracted Successfully!'}
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
										: 'The authorization code has been automatically extracted from the callback URL.'}
								</p>
								{hasCode && (
									<div
										style={{
											background: '#f0fdf4',
											border: '1px solid #86efac',
											borderRadius: '6px',
											padding: '12px',
											fontFamily: 'monospace',
											fontSize: '13px',
											color: '#166534',
											wordBreak: 'break-all',
											marginBottom: '12px',
										}}
									>
										<strong>Code:</strong> {flowState.authorizationCode?.substring(0, 50)}...
									</div>
								)}
								{flowType === 'hybrid' && hasTokens && (
									<div
										style={{
											background: '#f0fdf4',
											border: '1px solid #86efac',
											borderRadius: '6px',
											padding: '12px',
											fontFamily: 'monospace',
											fontSize: '13px',
											color: '#166534',
											wordBreak: 'break-all',
											marginBottom: '12px',
										}}
									>
										<strong>Tokens:</strong> Access Token received{' '}
										{flowState.tokens?.idToken ? '(+ ID Token)' : ''}
									</div>
								)}
								<p style={{ margin: '0', fontSize: '14px', color: '#047857', fontWeight: '600' }}>
									{flowType === 'hybrid' && hasTokens
										? '→ Click "Next Step" below to view tokens or exchange code for additional tokens (if needed)'
										: '→ Click "Next Step" below to exchange this code for access tokens'}
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
						<small style={{ display: 'block', marginTop: '4px', color: '#64748b' }}>
							Complete callback URL from PingOne (read-only)
						</small>
					</div>
				)}

				<div style={{ marginTop: '16px' }}>
					<label
						htmlFor={authzCodeInputId}
						style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}
					>
						{flowState.authorizationCode && flowState.authorizationCode.length < 100
							? '🔑 Authorization Code'
							: '📋 Callback URL'}
					</label>
					<input
						id={authzCodeInputId}
						type="text"
						placeholder={
							flowState.authorizationCode && flowState.authorizationCode.length < 100
								? 'Authorization code...'
								: `${redirectUri}?code=...&state=...`
						}
						value={flowState.authorizationCode || ''}
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
						{flowState.authorizationCode && flowState.authorizationCode.length < 100
							? 'Authorization code extracted and ready for token exchange'
							: flowState.authorizationCode
								? 'Paste the full callback URL here and click "Parse Callback URL"'
								: 'Paste the full callback URL here, or it will auto-detect from current URL'}
					</small>
				</div>

				{/* Show Parse button if code not extracted yet */}
				{!flowState.authorizationCode && (
					<button
						type="button"
						className="btn btn-next"
						onClick={handleParseCallback}
						disabled={isLoading || !flowState.authorizationCode}
						style={{ marginTop: '16px' }}
					>
						{isLoading ? 'Parsing...' : 'Parse Callback URL'}
					</button>
				)}

				{/* Show Continue button if code is extracted but step not complete */}
				{flowState.authorizationCode && !completedSteps.includes(currentStep) && (
					<button
						type="button"
						className="btn btn-next"
						onClick={() => {
							console.log(
								`${MODULE_TAG} User clicked Continue - marking step complete and navigating`
							);
							nav.markStepComplete();
							nav.goToNext();
							toastV8.success('Proceeding to token exchange...');
						}}
						style={{ marginTop: '16px', marginBottom: '24px' }}
					>
						Continue to Token Exchange
					</button>
				)}

				{/* Show success message if step is complete */}
				{completedSteps.includes(currentStep) && flowState.authorizationCode && (
					<div
						style={{
							marginTop: '16px',
							padding: '12px',
							background: '#d1fae5',
							borderRadius: '6px',
							color: '#065f46',
						}}
					>
						✅ Authorization code extracted! Click "Next Step" below to proceed.
					</div>
				)}

				{error && (
					<ErrorDisplayWithRetry
						error={error}
						onRetry={handleParseCallback}
						isLoading={isLoading}
					/>
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

		// Only trigger on step 2, and make sure we're not interfering with device authorization request
		if (
			flowType === 'device-code' &&
			currentStep === 2 &&
			flowState.deviceCode &&
			!flowState.tokens?.accessToken &&
			!flowState.pollingStatus?.isPolling &&
			!isLoading &&
			!autoPollTriggeredRef.current &&
			!isPollingExecutingRef.current
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
	}, [flowType, currentStep, flowState.deviceCode, flowState.tokens?.accessToken, flowState.pollingStatus?.isPolling, isLoading]);

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
					const tokenEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/token`;
					
					const headers: Record<string, string> = {
						'Content-Type': 'application/x-www-form-urlencoded',
					};

					// Validate device code before sending
					if (!flowState.deviceCode || flowState.deviceCode.trim() === '') {
						console.error(`${MODULE_TAG} Device code is missing or empty`, {
							deviceCode: flowState.deviceCode,
							hasDeviceCode: !!flowState.deviceCode,
						});
						throw new Error('Device code is missing. Please request a new device code.');
					}

					const body = new URLSearchParams({
						grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
						client_id: credentials.clientId,
						device_code: flowState.deviceCode.trim(),
					});

					console.log(`${MODULE_TAG} Polling request`, {
						endpoint: tokenEndpoint,
						clientId: credentials.clientId,
						deviceCodeLength: flowState.deviceCode.length,
						deviceCodePrefix: flowState.deviceCode.substring(0, 10) + '...',
					});

					// Handle Client Authentication
					if (credentials.clientSecret) {
						const authMethod = credentials.clientAuthMethod || 'client_secret_basic';
						if (authMethod === 'client_secret_basic') {
							const basicAuth = btoa(`${credentials.clientId}:${credentials.clientSecret}`);
							headers['Authorization'] = `Basic ${basicAuth}`;
						} else if (authMethod === 'client_secret_post') {
							body.append('client_secret', credentials.clientSecret);
						}
					}

					pollCount++;
					const response = await fetch(tokenEndpoint, {
						method: 'POST',
						headers,
						body: body.toString(),
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
						const tokensWithExtras = tokens as TokenResponse;
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
								
								{/* Stop Polling Button */}
								<button
									type="button"
									onClick={handleStopPolling}
									style={{
										marginTop: '12px',
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

	// Step 1 or 2: Request Token (client credentials, ROPC)
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
				} else if (flowType === 'ropc') {
					// Validate required fields for ROPC
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
					if (!flowState.username || !flowState.password) {
						throw new Error('Please provide both username and password to authenticate with ROPC flow.');
					}
					tokens = await UnifiedFlowIntegrationV8U.requestToken(
						flowType,
						credentials,
						flowState.username,
						flowState.password
					);
				} else {
					throw new Error(`The ${flowType} flow does not support direct token requests. Please use the appropriate flow steps.`);
				}

				const tokensWithExtras = tokens as TokenResponse;
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

				// Fetch UserInfo if OIDC and access token available (for ROPC flow only - client-credentials has no user, using OIDC discovery)
				if (flowType === 'ropc' && specVersion === 'oidc' && tokens.access_token) {
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
						} else if (tokensWithExtras.id_token) {
							// Still show modal if we have ID token with user info
							setShowUserInfoModal(true);
						}
					} catch (err) {
						console.warn(`${MODULE_TAG} Failed to fetch UserInfo`, err);

						// Still show modal if we have ID token with user info
						if (tokensWithExtras.id_token) {
							setShowUserInfoModal(true);
						}
					}
				} else if (flowType === 'ropc' && tokensWithExtras.id_token) {
					// If we have ID token but no UserInfo, show modal with ID token data
					setShowUserInfoModal(true);
				}

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

		// Validate required fields for ROPC
		const isValidForROPC =
			flowType === 'ropc'
				? !!(
						credentials.environmentId?.trim() &&
						credentials.clientId?.trim() &&
						credentials.clientSecret?.trim() &&
						credentials.scopes?.trim() &&
						flowState.username &&
						flowState.password
					)
				: true;

		const canRequest =
			flowType === 'client-credentials' ? isValidForClientCredentials : isValidForROPC;

		return (
			<div className="step-content">
				<h2>{stepTitle}</h2>
				<p>
					Request an access token using{' '}
					{flowType === 'client-credentials' ? 'client credentials' : 'resource owner credentials'}.
				</p>

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

				{/* Educational Info for ROPC Flow */}
				{flowType === 'ropc' && (
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
										<strong>The ROPC Flow</strong> exchanges username and password for tokens:
									</p>
									<ol style={{ margin: '0 0 8px 0', paddingLeft: '20px' }}>
										<li style={{ marginBottom: '4px' }}>
											<strong>Step 1 (completed):</strong> Resource owner credentials entered
										</li>
										<li style={{ marginBottom: '4px' }}>
											<strong>Step 2 (this step):</strong> Application exchanges credentials for
											access token
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
										<strong>⚠️ Note:</strong> This flow is <strong>deprecated</strong> in OAuth 2.1.
										Use Authorization Code Flow instead.
									</p>
								</div>
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
									{flowType === 'ropc' && !flowState.username && <li>Username</li>}
									{flowType === 'ropc' && !flowState.password && <li>Password</li>}
								</ul>
								<p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#7f1d1d' }}>
									{flowType === 'ropc'
										? 'Please complete all required fields in the configuration step above and enter credentials.'
										: 'Please complete all required fields in the configuration step above.'}
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
				if (credentials.usePKCE) {
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
				pkceEnabled: credentials.usePKCE,
				pkceCodesMissing: credentials.usePKCE && !effectiveCodeVerifier,
			});

			console.log(`${MODULE_TAG} Credentials:`, {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				hasClientSecret: !!credentials.clientSecret,
				clientSecretLength: credentials.clientSecret?.length,
				redirectUri: credentials.redirectUri,
				usePKCE: credentials.usePKCE,
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

			// CRITICAL: If PKCE is enabled, we MUST have a code verifier
			// The service layer will reject the request if PKCE is enabled but no verifier is provided
			if (credentials.usePKCE && !effectiveCodeVerifier) {
				console.error(`${MODULE_TAG} ❌ VALIDATION FAILED: PKCE enabled but code verifier missing`);
				const errorMsg =
					'PKCE is enabled but code verifier is missing. Please go back to Step 1 (PKCE) to generate PKCE codes, or disable PKCE in the configuration.';
				setError(errorMsg);
				nav.setValidationErrors([errorMsg]);
				toastV8.error(errorMsg);
				return;
			}

			if (credentials.usePKCE && effectiveCodeVerifier) {
				console.log(`${MODULE_TAG} ✅ PKCE enabled and code verifier present - will use PKCE flow`);
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

			// Redirect URI is only required when PKCE is NOT enabled
			if (!credentials.usePKCE && (!credentials.redirectUri || !credentials.redirectUri.trim())) {
				console.error(
					`${MODULE_TAG} ❌ VALIDATION FAILED: PKCE not enabled and missing redirect URI`
				);
				const errorMsg =
					'Redirect URI is required for token exchange when PKCE is not enabled. Please check your configuration.';
				setError(errorMsg);
				nav.setValidationErrors([errorMsg]);
				console.error(`${MODULE_TAG} Missing redirectUri in credentials (PKCE not enabled):`, {
					credentials,
					usePKCE: credentials.usePKCE,
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
				usePKCE: credentials.usePKCE,
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

				const tokensWithExtras = tokens as TokenResponse;
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
	}, [credentials.environmentId, flowState.tokens?.accessToken, fetchUserInfoWithDiscovery]);

	// Introspect access token
	const handleIntrospectToken = useCallback(async () => {
		console.log(`${MODULE_TAG} ========== TOKEN INTROSPECTION START ==========`);
		console.log(`${MODULE_TAG} Credentials check:`, {
			hasEnvironmentId: !!credentials.environmentId,
			hasClientId: !!credentials.clientId,
			hasClientSecret: !!credentials.clientSecret,
			hasAccessToken: !!flowState.tokens?.accessToken,
		});

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
			});

			let introspectionEndpoint = discoveryResult.data?.introspectionEndpoint;

			// Fallback to standard endpoint if not in discovery
			if (!introspectionEndpoint) {
				introspectionEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/introspect`;
				console.log(`${MODULE_TAG} Using fallback endpoint`, { introspectionEndpoint });
			}

			console.log(`${MODULE_TAG} Introspecting token at endpoint`, { introspectionEndpoint });

			// Token introspection requires client authentication
			const body = new URLSearchParams({
				token: flowState.tokens.accessToken,
				client_id: credentials.clientId,
				client_secret: credentials.clientSecret,
			});

			console.log(`${MODULE_TAG} Sending introspection request with:`, {
				tokenLength: flowState.tokens.accessToken.length,
				clientId: credentials.clientId,
				endpoint: introspectionEndpoint,
			});

			const response = await fetch(introspectionEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: body.toString(),
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
					showMaskToggle={true}
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
	const renderStep6IntrospectionUserInfo = () => {
		if (!flowState.tokens?.accessToken) {
			return (
				<div className="step-content">
					<p style={{ color: '#6b7280', fontSize: '14px' }}>
						No tokens available. Complete the previous steps to receive tokens first.
					</p>
				</div>
			);
		}

		// Determine step number dynamically based on flow type
		const introspectionStepNumber = (() => {
			switch (flowType) {
				case 'client-credentials':
					return 3; // Step 4 (0-indexed: 0, 1, 2, 3)
				case 'ropc':
				case 'implicit':
				case 'device-code':
					return 4; // Step 5 (0-indexed: 0, 1, 2, 3, 4)
				case 'hybrid':
					return credentials.usePKCE ? 6 : 5; // Step 7 or 6 depending on PKCE
				default:
					return credentials.usePKCE ? 6 : 5; // Step 7 or 6 depending on PKCE
			}
		})();

		return (
			<div className="step-content">
				<h2>Step {introspectionStepNumber + 1}: Token Introspection & UserInfo</h2>
				<p>Validate your access token and retrieve user information (optional).</p>

				{/* UserInfo Section - Available if we have an access token */}
				{flowState.tokens?.accessToken && (
					<div
						style={{
							marginTop: '24px',
							padding: '16px',
							background: '#f0f9ff',
							borderRadius: '8px',
							border: '1px solid #0ea5e9',
						}}
					>
						<div
							style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}
						>
							<span style={{ fontSize: '24px' }}>👤</span>
							<h3 style={{ margin: 0, fontSize: '18px', color: '#1e40af' }}>UserInfo</h3>
						</div>
						<p style={{ margin: '0 0 12px 0', color: '#1e3a8a', fontSize: '14px' }}>
							Retrieve authenticated user information using your access token.
							{specVersion !== 'oidc' && (
								<span style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
									Note: This is an OIDC endpoint. It requires the <code>openid</code> scope and OIDC support.
								</span>
							)}
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
								disabled={userInfoLoading}
								style={{
									padding: '10px 16px',
									background: '#0ea5e9',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									cursor: 'pointer',
									fontSize: '14px',
									fontWeight: '600',
								}}
							>
								{userInfoLoading ? 'Fetching...' : 'Fetch UserInfo'}
							</button>
						)}
					</div>
				)}

				{/* Token Introspection Section */}
				<div
					style={{
						marginTop: '24px',
						padding: '16px',
						background: '#fef3c7',
						borderRadius: '8px',
						border: '1px solid #f59e0b',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
						<span style={{ fontSize: '24px' }}>🔍</span>
						<h3 style={{ margin: 0, fontSize: '18px', color: '#92400e' }}>Token Introspection</h3>
					</div>
					<p style={{ margin: '0 0 12px 0', color: '#78350f', fontSize: '14px' }}>
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
							disabled={introspectionLoading}
							style={{
								padding: '10px 16px',
								background: '#f59e0b',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								cursor: 'pointer',
								fontSize: '14px',
								fontWeight: '600',
							}}
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
											👤 User Information
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
											{Object.entries(decoded.payload).map(([key, value]) => (
												<div key={key} style={{ marginBottom: '4px' }}>
													<span style={{ color: '#6366f1', fontWeight: '600' }}>{key}</span>
													<span style={{ color: '#6b7280' }}>: </span>
													<span style={{ color: '#1f2937' }}>
														{typeof value === 'object' ? JSON.stringify(value) : String(value)}
													</span>
												</div>
											))}
										</div>
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

	// Render step content based on current step and flow type
	const renderStepContent = () => {
		switch (currentStep) {
			case 0:
				return renderStep0();

			case 1:
				if (flowType === 'device-code') {
					return renderStep1DeviceAuth();
				}
				if (flowType === 'ropc') {
					return renderStep1ROPC();
				}
				if (flowType === 'client-credentials') {
					return renderStep2RequestToken();
				}
				// PKCE step for oauth-authz and hybrid flows (only if PKCE is enabled)
				if ((flowType === 'oauth-authz' || flowType === 'hybrid') && credentials.usePKCE) {
					return renderStep1PKCE();
				}
				// If PKCE not enabled, skip to Authorization URL step
				return renderStep1AuthUrl();

			case 2:
				// For oauth-authz and hybrid, Step 2 is Authorization URL (after PKCE)
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
				if (flowType === 'ropc') {
					return renderStep2RequestToken();
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
				if (flowType === 'ropc') {
					// ROPC: Step 3 is Tokens (after Request Token at step 2)
					return renderStep3Tokens();
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
				// For ROPC, Step 4 is Introspection & UserInfo (after Tokens at step 3)
				if (flowType === 'ropc') {
					return renderStep6IntrospectionUserInfo();
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

					{/* Next Button - Green with white text and arrow */}
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
				</div>
			</div>

			{/* UserInfo Success Modal */}
			{renderUserInfoModal()}

			{/* Callback Success Modal */}
			{renderCallbackSuccessModal()}

			{/* Polling Timeout Modal */}
			{renderPollingTimeoutModal()}
		</>
	);
};

export default UnifiedFlowSteps;
