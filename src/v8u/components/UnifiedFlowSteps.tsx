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
import {
	FiAlertCircle,
	FiArrowRight,
	FiBook,
	FiCheckCircle,
	FiChevronDown,
	FiCopy,
	FiGlobe,
	FiInfo,
	FiKey,
	FiShield,
} from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { ColoredUrlDisplay } from '@/components/ColoredUrlDisplay';
import DeviceTypeSelector from '@/components/DeviceTypeSelector';
import DynamicDeviceFlow from '@/components/DynamicDeviceFlow';
import EnhancedFlowInfoCard from '@/components/EnhancedFlowInfoCard';
import FlowConfigurationRequirements from '@/components/FlowConfigurationRequirements';
import FlowSequenceDisplay from '@/components/FlowSequenceDisplay';
import RedirectlessLoginModal from '@/components/RedirectlessLoginModal';
import { PasswordChangeModal } from '@/components/PasswordChangeModal';
import { type PKCECodes, PKCEService } from '@/services/pkceService';
import { WorkerTokenVsClientCredentialsEducationModalV8 } from '@/v8/components/WorkerTokenVsClientCredentialsEducationModalV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import type { TokenResponse } from '@/v8/services/oauthIntegrationServiceV8';
import { OidcDiscoveryServiceV8 } from '@/v8/services/oidcDiscoveryServiceV8';
import { type FlowType, type SpecVersion } from '@/v8/services/specVersionServiceV8';
import { TokenDisplayServiceV8 } from '@/v8/services/tokenDisplayServiceV8';
import { TokenOperationsServiceV8 } from '@/v8/services/tokenOperationsServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { PKCEStorageServiceV8U } from '../services/pkceStorageServiceV8U';
import {
	type UnifiedFlowCredentials,
	UnifiedFlowIntegrationV8U,
} from '../services/unifiedFlowIntegrationV8U';
import { ErrorDisplayWithRetry } from './ErrorDisplayWithRetry';
import { TokenDisplayV8U } from './TokenDisplayV8U';
import { UnifiedFlowDocumentationPageV8U } from './UnifiedFlowDocumentationPageV8U';
import { LoadingSpinnerModalV8U } from './LoadingSpinnerModalV8U';
import { UserInfoSuccessModalV8U } from './UserInfoSuccessModalV8U';
import { IDTokenValidationModalV8U } from './IDTokenValidationModalV8U';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';

// Note: Credentials form is rendered by parent component (UnifiedOAuthFlowV8U)

const MODULE_TAG = '[🔄 UNIFIED-FLOW-STEPS-V8U]';

// Styled components for educational content
const CollapsibleSection = styled.section`
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	margin-bottom: 1.5rem;
	background-color: #ffffff;
	box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
`;

const CollapsibleHeaderButton = styled.button<{ $collapsed?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: 1.25rem 1.5rem;
	background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf3 100%);
	border: none;
	border-radius: 0.75rem;
	cursor: pointer;
	font-size: 1.1rem;
	font-weight: 600;
	color: #14532d;
	transition: background 0.2s ease;

	&:hover {
		background: linear-gradient(135deg, #dcfce7 0%, #ecfdf3 100%);
	}
`;

// All educational sections use CollapsibleHeaderButton for consistent Unified styling

const CollapsibleTitle = styled.span`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const CollapsibleToggleIcon = styled.span<{ $collapsed?: boolean }>`
	display: inline-flex;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')};
	transition: transform 0.2s ease;

	svg {
		width: 16px;
		height: 16px;
	}
`;

const CollapsibleContent = styled.div`
	padding: 1.5rem;
	padding-top: 0;
	animation: fadeIn 0.2s ease;

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
`;

const InfoBox = styled.div<{ $variant?: 'info' | 'warning' | 'success' }>`
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
	display: flex;
	gap: 1rem;
	align-items: flex-start;
	border: 1px solid
		${({ $variant }) => {
			if ($variant === 'warning') return '#f59e0b';
			if ($variant === 'success') return '#22c55e';
			return '#3b82f6';
		}};
	background-color:
		${({ $variant }) => {
			if ($variant === 'warning') return '#fef3c7';
			if ($variant === 'success') return '#dcfce7';
			return '#dbeafe';
		}};
`;

const InfoTitle = styled.h3`
	font-size: 1rem;
	font-weight: 600;
	color: #0f172a;
	margin: 0;
`;

const InfoText = styled.p`
	font-size: 0.95rem;
	color: #3f3f46;
	line-height: 1.7;
	margin: 0;
`;

const InfoList = styled.ul`
	font-size: 0.875rem;
	color: #334155;
	line-height: 1.5;
	margin: 0.5rem 0 0;
	padding-left: 1.5rem;
`;

const ParameterGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: 1rem;
	margin: 1.5rem 0;
`;

const GeneratedContentBox = styled.div`
	background-color: #dcfce7;
	border: 1px solid #22c55e;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin: 1.5rem 0;
	position: relative;
`;

const GeneratedLabel = styled.div`
	position: absolute;
	top: -10px;
	left: 16px;
	background-color: #16a34a;
	color: white;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
`;

export interface UnifiedFlowStepsProps {
	specVersion: SpecVersion;
	flowType: FlowType;
	credentials: UnifiedFlowCredentials;
	onCredentialsChange?: (credentials: UnifiedFlowCredentials) => void;
	onStepChange?: (step: number) => void;
	onCompletedStepsChange?: (steps: number[]) => void;
	onFlowReset?: () => void; // Callback when flow is reset to trigger credential reload
	appConfig?:
		| {
				pkceRequired?: boolean;
				pkceEnforced?: boolean;
				[key: string]: unknown;
		  }
		| undefined; // Optional app config to determine PKCE enforcement level
}

interface FlowState {
	// Authorization URL flows (authz, implicit, hybrid)
	authorizationUrl?: string;
	state?: string;
	nonce?: string;
	codeVerifier?: string;
	codeChallenge?: string;
	// PAR (Pushed Authorization Request) information
	parRequestUri?: string;
	parExpiresIn?: number;

	// Authorization Code flows
	authorizationCode?: string;

	// Device Code flow
	deviceCode?: string;
	userCode?: string;
	verificationUri?: string;
	verificationUriComplete?: string; // URI with user code pre-filled (RFC 8628)
	deviceCodeExpiresIn?: number;
	deviceCodeExpiresAt?: number; // Timestamp when device code expires
	deviceCodeInterval?: number; // Polling interval from server response (RFC 8628 Section 3.2)
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
	onCredentialsChange,
	onStepChange,
	onCompletedStepsChange,
	onFlowReset,
	appConfig: _appConfig, // Unused but kept for API compatibility
}) => {
	// Generate flowKey dynamically (matches parent component's logic)
	// Format: {flowType}_{specVersion}_{uniqueIdentifier}
	// Example: implicit_oauth20_v8u
	const flowKey = useMemo(() => {
		// Normalize spec version for storage key (remove dots, lowercase)
		const normalizedSpecVersion = specVersion.replace(/\./g, '').toLowerCase();
		return `${flowType}_${normalizedSpecVersion}_v8u`;
	}, [flowType, specVersion]);

	// Helper: Check if PKCE is required based on enforcement level.
	// PKCE only applies to flows that use an authorization code (authz-code / hybrid).
	// Device Authorization (RFC 8628) does NOT use PKCE.
	// CRITICAL: Declare this BEFORE any useEffect that uses it
	const isPKCERequired = useMemo(() => {
		const flowSupportsPkce = flowType === 'oauth-authz' || flowType === 'hybrid';
		if (!flowSupportsPkce) {
			return false;
		}
		if (credentials.pkceEnforcement) {
			return credentials.pkceEnforcement !== 'OPTIONAL';
		}
		// Legacy: fallback to usePKCE boolean
		return credentials.usePKCE === true;
	}, [flowType, credentials.pkceEnforcement, credentials.usePKCE]);

	// Credentials received - no verbose logging needed

	/**
	 * Calculate total number of steps for the current flow type
	 *
	 * Step counts vary by flow type:
	 *
	 * Client Credentials (5 steps):
	 *   0: Configuration
	 *   1: Request Token
	 *   2: Display Tokens
	 *   3: Introspection & UserInfo
	 *   4: API Documentation
	 *
	 * Device Code (6 steps):
	 *   0: Configuration
	 *   1: Request Device Authorization
	 *   2: Poll for Tokens
	 *   3: Display Tokens
	 *   4: Introspection & UserInfo
	 *   5: API Documentation
	 *
	 * Implicit (6 steps):
	 *   0: Configuration
	 *   1: Generate Authorization URL
	 *   2: Parse Fragment (extract tokens from URL)
	 *   3: Display Tokens
	 *   4: Introspection & UserInfo
	 *   5: API Documentation
	 *
	 * Authorization Code / Hybrid (8 steps):
	 *   0: Configuration
	 *   1: Generate PKCE Parameters
	 *   2: Generate Authorization URL (with PKCE)
	 *   3: Handle Callback (extract authorization code)
	 *   4: Exchange Code for Tokens (with code_verifier)
	 *   5: Display Tokens
	 *   6: Introspection & UserInfo
	 *   7: API Documentation
	 *
	 * @returns {number} Total number of steps for the current flow
	 */
	const getTotalSteps = (): number => {
		switch (flowType) {
			case 'client-credentials':
				return 5; // Config → Token Request → Tokens → Introspection & UserInfo → Documentation
			case 'device-code':
				return 6; // Config → Device Auth → Poll → Tokens → Introspection & UserInfo → Documentation
			case 'implicit':
				return 6; // Config → Auth URL → Fragment → Tokens → Introspection & UserInfo → Documentation
			case 'hybrid':
				// 8 steps: Config → PKCE → Auth URL → Parse Callback → Exchange → Tokens → Introspection & UserInfo → Documentation
				return 8;
			default:
				// oauth-authz flow
				// 8 steps: Config → PKCE → Auth URL → Handle Callback → Exchange → Tokens → Introspection & UserInfo → Documentation
				return 8;
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

	// CRITICAL: Declare refs early so they can be used in useState initializers
	// Ref to track current device code to avoid stale closures in polling
	const deviceCodeRef = useRef<string | undefined>(undefined);
	// Ref to track previous flow type for cleanup
	const prevFlowTypeRef = useRef<FlowType>(flowType);

	// Track completed steps and validation
	const [completedSteps, setCompletedSteps] = useState<number[]>([]);
	const [validationErrors, setValidationErrors] = useState<string[]>([]);

	// Redirectless authentication state
	const [showRedirectlessModal, setShowRedirectlessModal] = useState(false);
	const [redirectlessAuthError, setRedirectlessAuthError] = useState<string | null>(null);
	const [isRedirectlessAuthenticating, setIsRedirectlessAuthenticating] = useState(false);
	const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	const [passwordChangeUserId, setPasswordChangeUserId] = useState<string | null>(null);
	// Note: passwordChangeFlowId and passwordChangeState are reserved for future use
	// @ts-expect-error - Reserved for future use
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [passwordChangeFlowId, setPasswordChangeFlowId] = useState<string | null>(null);
	// @ts-expect-error - Reserved for future use
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [passwordChangeState, setPasswordChangeState] = useState<string | null>(null);
	const [passwordChangeUsername, setPasswordChangeUsername] = useState<string | null>(null);
	const [showPingOneRequestModal, setShowPingOneRequestModal] = useState(false);
	const [pendingPingOneRequest, setPendingPingOneRequest] = useState<{
		url: string;
		method: string;
		body: Record<string, unknown>;
	} | null>(null);
	const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
	const [preFlightValidationResult, setPreFlightValidationResult] = useState<{
		passed: boolean;
		errors: string[];
		warnings: string[];
		fixableErrors?: Array<{
			errorIndex: number;
			errorType: string;
			errorMessage: string;
			fixable: boolean;
			fixDescription: string;
			fixData?: {
				redirectUri?: string;
				enablePKCE?: boolean;
				authMethod?: string;
				addScope?: string;
				responseType?: string;
			};
		}>;
		appConfig?: {
			tokenEndpointAuthMethod?: string;
			pkceEnforced?: boolean;
			pkceRequired?: boolean;
			requireSignedRequestObject?: boolean;
		};
	} | null>(null);

	// Educational content collapsed state
	const [isQuickStartCollapsed, setIsQuickStartCollapsed] = useState(false);
	const [pkceOverviewCollapsed, setPkceOverviewCollapsed] = useState(false);
	const [pkceDetailsCollapsed, setPkceDetailsCollapsed] = useState(false);
	const [authRequestOverviewCollapsed, setAuthRequestOverviewCollapsed] = useState(false);
	const [authRequestDetailsCollapsed, setAuthRequestDetailsCollapsed] = useState(false);
	const [deviceCodeOverviewCollapsed, setDeviceCodeOverviewCollapsed] = useState(false);
	const [deviceCodeDetailsCollapsed, setDeviceCodeDetailsCollapsed] = useState(false);
	const [clientCredentialsOverviewCollapsed, setClientCredentialsOverviewCollapsed] = useState(false);
	const [clientCredentialsDetailsCollapsed, setClientCredentialsDetailsCollapsed] = useState(false);
	const [authzCodeOverviewCollapsed, setAuthzCodeOverviewCollapsed] = useState(false);
	const [authzCodeDetailsCollapsed, setAuthzCodeDetailsCollapsed] = useState(false);
	const [hybridOverviewCollapsed, setHybridOverviewCollapsed] = useState(false);
	const [hybridDetailsCollapsed, setHybridDetailsCollapsed] = useState(false);
	const [implicitOverviewCollapsed, setImplicitOverviewCollapsed] = useState(false);
	const [implicitDetailsCollapsed, setImplicitDetailsCollapsed] = useState(false);
	const [preflightValidationCollapsed, setPreflightValidationCollapsed] = useState(false);

	// Navigation functions using React Router
	const navigateToStep = useCallback(
		(step: number) => {
			if (step < 0 || step >= totalSteps) {
				console.warn(`${MODULE_TAG} Invalid step`, { step, totalSteps });
				return;
			}
			const path = `/v8u/unified/${flowType}/${step}`;
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
			setCompletedSteps((prev) => [...prev, currentStep]);
		}
	}, [currentStep, completedSteps]);

	const setValidationErrorsState = useCallback((errors: string[]) => {
		setValidationErrors(errors);
	}, []);

	const setValidationWarningsState = useCallback((warnings: string[]) => {
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
					// Restored client-credentials tokens from sessionStorage
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
					// Restored device code data from sessionStorage
					initialState.deviceCode = deviceData.deviceCode;
					initialState.userCode = deviceData.userCode;
					initialState.verificationUri = deviceData.verificationUri;
					initialState.verificationUriComplete = deviceData.verificationUriComplete;
					initialState.deviceCodeExpiresIn = deviceData.deviceCodeExpiresIn;
					initialState.deviceCodeInterval = deviceData.deviceCodeInterval || 5;
					// CRITICAL: Initialize ref with restored device code
					deviceCodeRef.current = deviceData.deviceCode;
				} catch (err) {
					console.error(`${MODULE_TAG} Failed to parse stored device code data`, err);
				}
			}
		}

		return initialState;
	});
	const [isLoading, setIsLoading] = useState(false);
	const [loadingMessage, setLoadingMessage] = useState('');
	const [isPreFlightValidating, setIsPreFlightValidating] = useState(false);
	const [preFlightStatus, setPreFlightStatus] = useState<string>('');
	const [error, setError] = useState<string | null>(null);
	const [showUserInfoModal, setShowUserInfoModal] = useState(false);
	const [showCallbackSuccessModal, setShowCallbackSuccessModal] = useState(false);
	const [showIdTokenValidationModal, setShowIdTokenValidationModal] = useState(false);
	const [showPollingTimeoutModal, setShowPollingTimeoutModal] = useState(false);
	const [showDeviceCodeSuccessModal, setShowDeviceCodeSuccessModal] = useState(false);
	const [showWorkerTokenVsClientCredentialsModal, setShowWorkerTokenVsClientCredentialsModal] =
		useState(false);
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
			console.log(
				`${MODULE_TAG} [PKCE VALIDATION] PKCE codes required but missing - redirecting to PKCE step`,
				{
					currentStep,
					hasCodeVerifier: !!flowState.codeVerifier,
					hasCodeChallenge: !!flowState.codeChallenge,
					isPKCERequired,
				}
			);
			navigateToStep(1);
		}
	}, [
		currentStep,
		flowType,
		flowState.codeVerifier,
		flowState.codeChallenge,
		navigateToStep,
		isPKCERequired,
	]);

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
	}, []); // Re-run cleanup when step changes
	const [introspectionData, setIntrospectionData] = useState<Record<string, unknown> | null>(null);
	const [selectedTokenType, setSelectedTokenType] = useState<'access' | 'refresh' | 'id'>('access');
	const [introspectionTokenType, setIntrospectionTokenType] = useState<
		'access' | 'refresh' | 'id' | null
	>(null); // Track which token type was introspected

	// Token refresh state
	const [refreshLoading, setRefreshLoading] = useState(false);
	const [refreshError, setRefreshError] = useState<string | null>(null);
	const [refreshResult, setRefreshResult] = useState<{
		oldTokens: { accessToken?: string; refreshToken?: string };
		newTokens: { accessToken?: string; refreshToken?: string; expiresIn?: number };
	} | null>(null);

	// Generate unique IDs for form inputs and modals (accessibility)
	// Note: callbackUrlDisplayId is reserved for future use
	// @ts-expect-error - Reserved for future use
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const callbackUrlDisplayId = useId();
	const fragmentUrlInputId = useId();
	const callbackSuccessModalTitleId = useId();

	/**
	 * Filter tokens based on spec version to ensure spec compliance
	 *
	 * OAuth 2.0 Authorization Framework (RFC 6749) / OAuth 2.1 Authorization Framework (draft): Only access_token and refresh_token (NO id_token)
	 * OpenID Connect Core 1.0: access_token, id_token, and refresh_token
	 *
	 * Note: OAuth 2.1 (draft) with OpenID Connect Core 1.0 means "OIDC Core 1.0 using OAuth 2.1 (draft) baseline", which includes id_token.
	 *
	 * PingOne may return id_token even for OAuth 2.0 / OAuth 2.1 (draft) requests because it uses
	 * OpenID for all apps, but we filter it out to follow the spec correctly.
	 */
	const filterTokensBySpec = useCallback(
		(tokens: TokenResponse): TokenResponse => {
			// For OAuth 2.0 Authorization Framework (RFC 6749) and OAuth 2.1 Authorization Framework (draft), remove id_token to follow spec
			// Note: OAuth 2.1 (draft) without OpenID Connect only returns access_token and refresh_token.
			// However, when OAuth 2.1 (draft) is combined with OpenID Connect Core 1.0, it includes id_token (OIDC Core 1.0 using OAuth 2.1 (draft) baseline).
			if (specVersion === 'oauth2.0' || specVersion === 'oauth2.1') {
				if (tokens.id_token) {
					console.log(
						`${MODULE_TAG} 🔒 SPEC COMPLIANCE: Filtering out id_token for ${specVersion}. ` +
							`OAuth 2.0 Authorization Framework (RFC 6749) / OAuth 2.1 Authorization Framework (draft) only returns access_token and refresh_token when used without OpenID Connect. ` +
							`ID tokens are only part of OpenID Connect Core 1.0.`
					);
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const { id_token: _idToken, ...filteredTokens } = tokens;
					return filteredTokens as TokenResponse;
				}
			}
			// For OIDC Core 1.0, keep all tokens including id_token
			return tokens;
		},
		[specVersion]
	);

	// Helper function to handle token success - skip modal and proceed to next step
	const showTokenSuccessModal = useCallback(
		(tokens: TokenResponse) => {
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
		},
		[credentials.scopes, filterTokensBySpec]
	);

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
						discoveryError: discoveryResult.error,
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
				// Track API call for display
				const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
				const startTime = Date.now();
				const requestBody = {
					userInfoEndpoint,
					accessToken: '***REDACTED***',
				};

				const callId = apiCallTrackerService.trackApiCall({
					method: 'POST',
					url: '/api/pingone/userinfo',
					actualPingOneUrl: userInfoEndpoint,
					isProxy: true,
					headers: {
						'Content-Type': 'application/json',
						Authorization: 'Bearer ***REDACTED***',
					},
					body: requestBody,
					step: 'unified-userinfo',
					flowType: 'unified',
				});

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

				// Parse response once (clone first to avoid consuming the body)
				const responseClone = response.clone();
				let responseData: unknown;
				try {
					responseData = await responseClone.json();
					} catch {
					responseData = { error: 'Failed to parse response' };
				}

				// Update API call with response
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: response.status,
						statusText: response.statusText,
						data: responseData,
					},
					Date.now() - startTime
				);

				if (!response.ok) {
					const errorData = responseData as { error?: string; message?: string };
					throw new Error(
						errorData.error ||
							errorData.message ||
							`UserInfo request failed: ${response.status} ${response.statusText}`
					);
				}

				const userInfo = responseData as Record<string, unknown>;
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

		/**
		 * Step 3: Reset navigation to step 0
		 *
		 * Returns user to the configuration step where they can:
		 * - Review/update credentials
		 * - Change flow type or spec version
		 * - Start a new flow
		 */
		// Navigate to step 0 explicitly to ensure URL is updated
		navigateToStep(0);

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
		setPreFlightValidationResult({
			passed: false,
			errors: [],
			warnings: [],
			fixableErrors: [],
		});
		setIsPreFlightValidating(false);
		setPreFlightStatus('');

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
			onFlowReset();
		}

		// Show success toast
		toastV8.success(
			'Flow restarted - OAuth tokens and state cleared (credentials and worker token preserved)'
		);

		console.log(
			`${MODULE_TAG} Flow restarted successfully - OAuth tokens and state cleared, credentials and worker token preserved`
		);
	}, [navigateToStep, setValidationErrorsState, setValidationWarningsState, onFlowReset, flowKey]);

	// CRITICAL: Initialize with clean error state on mount
	// This ensures errors are cleared when component first loads or when navigating back
	// Note: When "Back to Main" is clicked, the component unmounts and all state is lost.
	// When navigating back to a flow, this effect ensures a clean start.
	useEffect(() => {
		// Clear all error and validation state on mount
		setError(null);
		setValidationErrors([]);
		setValidationWarnings([]);
		setPreFlightValidationResult({
			passed: false,
			errors: [],
			warnings: [],
			fixableErrors: [],
		});
		setIsPreFlightValidating(false);
		setPreFlightStatus('');
		// Only run on mount - empty dependency array is intentional
		// biome-ignore lint/correctness/useExhaustiveDependencies: Only run on mount to clear errors
	}, []);

	// CRITICAL: Clear tokens and flow state when flow type changes
	// This ensures tokens from a previous flow type don't persist when switching flows
	// Note: prevFlowTypeRef and deviceCodeRef are declared earlier (before useState initializers)
	useEffect(() => {
		if (prevFlowTypeRef.current !== flowType) {
			console.log(`${MODULE_TAG} Flow type changed - clearing tokens and flow state`, {
				from: prevFlowTypeRef.current,
				to: flowType,
			});

			// Clear React flow state (tokens, codes, etc.)
			setFlowState({});

			// Clear token introspection and UserInfo state
			setIntrospectionData(null);
			setUserInfoLoading(false);
			setUserInfoError(null);
			setIntrospectionLoading(false);
			setIntrospectionError(null);

			// Clear all token-related sessionStorage items
			// Note: This clears tokens for all flows (implicit, hybrid, client-credentials, oauth-authz, etc.)
			// We need to clear both shared keys (v8u_implicit_tokens) and flow-specific keys (v8u_${flowType}_tokens)
			const allPossibleTokenKeys = [
				'v8u_implicit_tokens', // Shared by implicit and hybrid flows
				'v8u_client_credentials_tokens',
				'v8u_device_code_data',
				'v8u_oauth-authz_tokens', // Flow-specific key for oauth-authz
				'v8u_hybrid_tokens', // Flow-specific key for hybrid (if not using shared key)
				'v8u_callback_data',
			];
			
			allPossibleTokenKeys.forEach((key) => {
				sessionStorage.removeItem(key);
			});
			
			// Also clear any flow-specific token keys using the pattern v8u_${flowType}_tokens
			const flowTypes: FlowType[] = [
				'oauth-authz',
				'implicit',
				'hybrid',
				'client-credentials',
				'device-code',
			];
			flowTypes.forEach((ft) => {
				const key = `v8u_${ft}_tokens`;
				sessionStorage.removeItem(key);
			});
			
			// Clear PKCE codes for the previous flow type
			const prevFlowKey = `${prevFlowTypeRef.current}-${specVersion}-v8u`;
			PKCEStorageServiceV8U.clearPKCECodes(prevFlowKey).catch((err) => {
				console.error(`${MODULE_TAG} Failed to clear PKCE codes for previous flow type`, err);
			});

			console.log(`${MODULE_TAG} Cleared tokens and flow state due to flow type change`);

			// Update the ref to track the current flow type
			prevFlowTypeRef.current = flowType;
		}
	}, [flowType, specVersion]);

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
					errors.push(
						'Please provide a Client Secret in the configuration above. This flow requires confidential client credentials.'
					);
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
	}, [
		currentStep,
		credentials,
		flowType,
		completedSteps,
		setValidationErrorsState,
		isPKCERequired,
	]);

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
					errors.push(
						'PKCE Code Verifier is missing. Please generate PKCE codes in the configuration step.'
					);
				}
				if (!flowState.codeChallenge?.trim()) {
					errors.push(
						'PKCE Code Challenge is missing. Please generate PKCE codes in the configuration step.'
					);
				}
			}

			// Update validation errors
			setValidationErrorsState(errors);

			// Mark step as complete if:
			// - No errors AND codes are present (when required), OR
			// - PKCE is optional (can proceed without codes)
			const canProceed = isPKCERequired
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
		isPKCERequired,
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
		isPKCERequired,
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
				tokenStep = 5; // Step 6 (0-indexed: 0=Config, 1=PKCE, 2=AuthURL, 3=Callback, 4=Exchange, 5=Tokens)
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
	}, [flowState.tokens?.accessToken, flowType, completedSteps]);

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
				tokenStep = 5; // Step 6 (0-indexed: 0=Config, 1=PKCE, 2=AuthURL, 3=Callback, 4=Exchange, 5=Tokens)
			}

			// If we're currently on the tokens step and it's not marked complete, mark it
			if (currentStep === tokenStep && !completedSteps.includes(currentStep)) {
				console.log(
					`${MODULE_TAG} On tokens step with tokens available - marking step ${currentStep} as complete`
				);
				nav.markStepComplete();
				// Clear validation errors when tokens are successfully displayed
				setValidationErrors([]);
			}
		}
	}, [flowState.tokens?.accessToken, currentStep, flowType, completedSteps, nav]);

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
	// Also update ref whenever device code changes
	useEffect(() => {
		if (flowType === 'device-code' && flowState.deviceCode) {
			// CRITICAL: Update ref whenever device code changes in state
			deviceCodeRef.current = flowState.deviceCode;

			try {
				sessionStorage.setItem(
					'v8u_device_code_data',
					JSON.stringify({
						deviceCode: flowState.deviceCode,
						userCode: flowState.userCode,
						verificationUri: flowState.verificationUri,
						verificationUriComplete: flowState.verificationUriComplete,
						deviceCodeExpiresIn: flowState.deviceCodeExpiresIn,
						deviceCodeInterval: flowState.deviceCodeInterval || 5,
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
		flowState.deviceCodeInterval,
		flowType,
		flowState.verificationUriComplete,
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
		// #region agent log
		fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UnifiedFlowSteps.tsx:1622',message:'Step 3 useEffect triggered',data:{currentStep,flowType,isStep3:currentStep === 3,isHybridOrAuthz:(flowType === 'oauth-authz' || flowType === 'hybrid'),pathname:window.location.pathname,hash:window.location.hash.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'hybrid-redirect',hypothesisId:'STEP3_EFFECT'})}).catch(()=>{});
		// #endregion
		
		// Only run on step 3 (callback handling step) for authorization code and hybrid flows
		if (currentStep === 3 && (flowType === 'oauth-authz' || flowType === 'hybrid')) {
			console.log(`${MODULE_TAG} Step 3 mounted - checking for callback data`, { flowType });

			let callbackUrl: string | null = null;
			let detectedCode: string | null = null;
			let detectedState: string | null = null;
			let hasFragment = false;
			let fragmentTokens: { access_token?: string; id_token?: string } | null = null;

			// For hybrid flow, check fragment first (tokens come in fragment, code in query)
			if (flowType === 'hybrid') {
				const fragment = window.location.hash.substring(1);
				const hasFragmentTokens = fragment && (fragment.includes('access_token') || fragment.includes('id_token'));
				const hasQueryCode = window.location.search.includes('code=');
				
				// For hybrid flow, we need to parse the full callback URL which includes both query and fragment
				if ((hasFragmentTokens || hasQueryCode) && (!flowState.tokens?.accessToken || !flowState.authorizationCode)) {
					console.log(`${MODULE_TAG} Hybrid flow: Parsing full callback URL`, {
						hasFragmentTokens,
						hasQueryCode,
						url: window.location.href.substring(0, 200),
					});
					hasFragment = !!hasFragmentTokens;

					try {
						// Parse full callback URL (checks both query string for code and fragment for tokens)
						const fragmentResult = UnifiedFlowIntegrationV8U.parseCallbackFragment(
							'hybrid',
							window.location.href,
							flowState.state || ''
						);

						// Extract code from result (now includes code from query string)
						const codeFromResult = (fragmentResult as { code?: string }).code;
						if (codeFromResult && !detectedCode) {
							detectedCode = codeFromResult;
							callbackUrl = window.location.href;
							detectedState = (fragmentResult as { state?: string }).state || detectedState;
							console.log(`${MODULE_TAG} Hybrid flow: Code extracted from parseCallbackFragment`, {
								code: codeFromResult,
							});
						}

						// Extract tokens from fragment
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

						console.log(`${MODULE_TAG} Hybrid flow: Callback parsed successfully`, {
							hasCode: !!codeFromResult,
							hasAccessToken: !!fragmentTokens?.access_token,
							hasIdToken: !!fragmentTokens?.id_token,
						});
					} catch (err) {
						console.error(`${MODULE_TAG} Failed to parse callback for hybrid flow`, err);
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
				let extractedCode: string | null = null;
				let extractedTokens: NonNullable<FlowState['tokens']> | null = null;

				// Extract authorization code if found
				// For hybrid flow, the code might already be in detectedCode (from sessionStorage or URL params)
				// or we need to parse it from callbackUrl. Use detectedCode directly if available.
				if (detectedCode && !flowState.authorizationCode) {
					// Use detectedCode directly - it's already been extracted from sessionStorage or URL params
					extractedCode = detectedCode;
					updates.authorizationCode = detectedCode;
					if (detectedState) {
						updates.state = detectedState;
					}
					hasUpdates = true;
					console.log(`${MODULE_TAG} Hybrid flow: Authorization code extracted from detectedCode`, {
						code: detectedCode,
					});
				} else if (callbackUrl && !flowState.authorizationCode && !detectedCode) {
					// Fallback: Try to parse from callbackUrl if detectedCode is not available
					try {
						const parsed = UnifiedFlowIntegrationV8U.parseCallbackUrl(
							callbackUrl,
							flowState.state || detectedState || ''
						);

						extractedCode = parsed.code;
						updates.authorizationCode = parsed.code;
						if (detectedState) {
							updates.state = detectedState;
						}
						hasUpdates = true;
						console.log(`${MODULE_TAG} Hybrid flow: Authorization code extracted from callbackUrl`, {
							code: parsed.code,
						});
					} catch (err) {
						console.error(`${MODULE_TAG} Failed to parse authorization code for hybrid flow`, err);
						// Don't set hasUpdates = true here - let the error be logged but don't fail the flow
					}
				}

				// Extract tokens from fragment if found
				if (fragmentTokens && !flowState.tokens?.accessToken) {
					extractedTokens = {
						accessToken: fragmentTokens.access_token || flowState.tokens?.accessToken || '',
						expiresIn: 3600,
					};
					if (fragmentTokens.id_token) {
						extractedTokens.idToken = fragmentTokens.id_token;
					}
					updates.tokens = extractedTokens;
					hasUpdates = true;

					// Save tokens to sessionStorage
					try {
						sessionStorage.setItem(
							'v8u_implicit_tokens',
							JSON.stringify({
								...extractedTokens,
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

					// Extract all parameters from callback URL for success modal (similar to authorization code flow)
					const allParams: Record<string, string> = {};
					
					// Extract from query string (authorization code)
					if (callbackUrl) {
						try {
							const url = new URL(callbackUrl);
							url.searchParams.forEach((value, key) => {
								allParams[key] = value;
							});
						} catch (err) {
							console.warn(`${MODULE_TAG} Failed to parse callback URL for allParams`, err);
						}
					}
					
					// Extract from fragment (tokens)
					if (fragmentTokens) {
						if (fragmentTokens.access_token) {
							allParams.access_token = fragmentTokens.access_token;
						}
						if (fragmentTokens.id_token) {
							allParams.id_token = fragmentTokens.id_token;
						}
					}

					// Set callback details for success modal (matching authorization code flow)
					setCallbackDetails({
						url: callbackUrl || window.location.href,
						code: extractedCode || '',
						...(detectedState && { state: detectedState }),
						...(allParams.session_state && { sessionState: allParams.session_state }),
						allParams,
					});

					// Show success modal with callback details (matching authorization code flow)
					setShowCallbackSuccessModal(true);

					if (updates.authorizationCode && updates.tokens) {
						toastV8.success('✅ Callback URL parsed automatically! Authorization code and tokens extracted.');
					} else if (updates.authorizationCode) {
						toastV8.success('✅ Callback URL parsed automatically! Authorization code extracted.');
					} else if (updates.tokens) {
						toastV8.success('✅ Tokens extracted automatically!');
					}

					// Clean up sessionStorage
					if (callbackDataStr) {
						sessionStorage.removeItem('v8u_callback_data');
					}

					console.log(
						`${MODULE_TAG} Hybrid flow: Callback data extracted, success modal shown, step marked complete`
					);
					return;
				} else {
					// If no updates, log what we found for debugging
					console.warn(`${MODULE_TAG} Hybrid flow: No updates applied`, {
						hasDetectedCode: !!detectedCode,
						hasCallbackUrl: !!callbackUrl,
						hasFragmentTokens: !!fragmentTokens,
						hasExistingCode: !!flowState.authorizationCode,
						hasExistingTokens: !!flowState.tokens?.accessToken,
						currentUrl: window.location.href.substring(0, 200),
					});
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
					accessToken: allParams.access_token
						? `${allParams.access_token.substring(0, 20)}...`
						: 'MISSING',
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
			setValidationErrors([message]);
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
		callbackDetails,
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
					const callbackStartTime = Date.now();

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

					// Track callback as an API call for documentation
					const callbackUrl = `https://auth.pingone.com/${credentials.environmentId}/as/authorize/callback`;
					const apiCallId = apiCallTrackerService.trackApiCall({
						method: 'GET',
						url: callbackUrl,
						actualPingOneUrl: callbackUrl,
						isProxy: false,
						headers: {},
						body: allParams,
						step: 'unified-authorization-callback',
						flowType: 'unified',
					});

					// Update with callback response (tokens extracted)
					apiCallTrackerService.updateApiCallResponse(
						apiCallId,
						{
							status: 200,
							statusText: 'OK',
							data: {
								note: 'PingOne redirected user back with tokens in URL fragment after successful authentication',
								access_token: resultWithToken.access_token ? '[REDACTED - view in tokens section]' : undefined,
								id_token: resultWithToken.id_token ? '[REDACTED - view in tokens section]' : undefined,
								token_type: resultWithToken.token_type,
								expires_in: resultWithToken.expires_in,
								scope: resultWithToken.scope,
								state: resultWithToken.state,
								flow: flowType === 'implicit' ? 'implicit' : 'hybrid',
								received_in: 'URL Fragment (#access_token=...)',
							},
						},
						Date.now() - callbackStartTime
					);

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
	}, [
		currentStep,
		flowType,
		flowState.tokens?.accessToken,
		flowState.state,
		handleParseFragment,
		nav,
		flowState.nonce,
	]);

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
		// Determine required fields based on flow type
		const needsRedirectUri = ['oauth-authz', 'implicit', 'hybrid'].includes(flowType);
		const needsClientSecret =
			flowType === 'client-credentials' ||
			(credentials.clientAuthMethod &&
				['client_secret_basic', 'client_secret_post', 'client_secret_jwt'].includes(
					credentials.clientAuthMethod
				) &&
				!isPKCERequired);

		// Build dynamic list of missing required fields
		const missingFields: string[] = [];

		if (!credentials.environmentId?.trim()) {
			missingFields.push('Environment ID');
		}

		if (!credentials.clientId?.trim()) {
			missingFields.push('Client ID');
		}

		if (!credentials.scopes?.trim()) {
			missingFields.push('Scopes');
		}

		if (needsRedirectUri && !credentials.redirectUri?.trim()) {
			missingFields.push('Redirect URI');
		}

		if (needsClientSecret && !credentials.clientSecret?.trim()) {
			missingFields.push('Client Secret');
		}

		// Determine if all fields are configured
		const allConfigured = missingFields.length === 0;

		// Map Unified flow types to EnhancedFlowInfoCard flow types
		const getFlowInfoCardType = (): string => {
			switch (flowType) {
				case 'oauth-authz':
					return specVersion === 'oidc' ? 'oidc-authorization-code' : 'oauth-authorization-code';
				case 'implicit':
					return 'implicit';
				case 'client-credentials':
					return 'client-credentials';
				case 'device-code':
					return 'device-authorization';
				case 'hybrid':
					return 'oidc-hybrid';
				default:
					return 'oauth-authorization-code';
			}
		};

		// Map Unified flow types to FlowConfigurationRequirements flow types
		const getFlowConfigReqType = ():
			| 'device-authorization'
			| 'implicit'
			| 'authorization-code'
			| 'client-credentials'
			| 'hybrid' => {
			switch (flowType) {
				case 'oauth-authz':
					return 'authorization-code';
				case 'implicit':
					return 'implicit';
				case 'client-credentials':
					return 'client-credentials';
				case 'device-code':
					return 'device-authorization';
				case 'hybrid':
					return 'hybrid';
				default:
					return 'authorization-code';
			}
		};

		// Determine if flow supports both OAuth and OIDC
		const supportsOAuthAndOIDC = flowType === 'oauth-authz' || flowType === 'hybrid';
		const isOIDCMode = specVersion === 'oidc';

		// Get flow-specific educational content
		const getWhatYoullGet = (): string => {
			switch (flowType) {
				case 'oauth-authz':
					return isOIDCMode
						? '🎯 User authentication + API authorization with ID token and access token'
						: '🔑 API authorization with access token (PingOne requires openid scope)';
				case 'implicit':
					return '🔑 Access token + ID token returned directly in URL fragment (legacy flow)';
				case 'client-credentials':
					return '🔑 Machine-to-machine access token (no user interaction)';
				case 'device-code':
					return '🔑 Access token via device code and user verification (for TVs, IoT, CLI)';
				case 'hybrid':
					return '🎯 Authorization code + ID token (some tokens in front channel, others via back channel)';
				default:
					return '🔑 Access token for API authorization';
			}
		};

		const getPerfectFor = (): string[] => {
			switch (flowType) {
				case 'oauth-authz':
					return ['Web apps with secure backends', 'SPAs using PKCE', 'Apps needing refresh tokens'];
				case 'implicit':
					return ['Legacy SPAs (deprecated)', 'Simple token retrieval', 'No backend required'];
				case 'client-credentials':
					return ['API-to-API communication', 'Backend services', 'Scheduled jobs', 'Machine-to-machine'];
				case 'device-code':
					return ['Smart TVs', 'IoT devices', 'CLI tools', 'Devices without browsers'];
				case 'hybrid':
					return ['OIDC Core 1.0 flows needing immediate ID token', 'Combined front/back channel flows'];
				default:
					return ['Web applications'];
			}
		};

		return (
			<div className="step-content">
				{/* Quick Start & Overview - Educational Section */}
				<CollapsibleSection>
					<CollapsibleHeaderButton
						onClick={() => setIsQuickStartCollapsed(!isQuickStartCollapsed)}
						aria-expanded={!isQuickStartCollapsed}
					>
						<CollapsibleTitle>
							<FiBook />
							<span>
								Quick Start & Overview -{' '}
								{flowType === 'oauth-authz'
									? isOIDCMode
										? 'OIDC Core 1.0'
										: 'OAuth 2.0'
									: flowType === 'implicit'
										? 'OAuth 2.0 Implicit'
										: flowType === 'client-credentials'
											? 'OAuth 2.0 Client Credentials'
											: flowType === 'device-code'
												? 'OAuth 2.0 Device Code'
												: flowType === 'hybrid'
													? 'OIDC Core 1.0 Hybrid'
													: 'OAuth 2.0'}{' '}
								{flowType === 'oauth-authz' ? 'Authorization Code' : ''}
							</span>
						</CollapsibleTitle>
						<CollapsibleToggleIcon $collapsed={isQuickStartCollapsed}>
							<FiChevronDown />
						</CollapsibleToggleIcon>
					</CollapsibleHeaderButton>
					{!isQuickStartCollapsed && (
						<CollapsibleContent>
							{/* Compact Overview - InfoBox Grid */}
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
									gap: '1rem',
									marginBottom: '1.5rem',
								}}
							>
								<InfoBox $variant="info">
									<FiInfo size={20} />
									<div>
										<InfoTitle>What You'll Get</InfoTitle>
										<InfoText>{getWhatYoullGet()}</InfoText>
									</div>
								</InfoBox>
								<InfoBox $variant="success">
									<FiCheckCircle size={20} />
									<div>
										<InfoTitle>Perfect For</InfoTitle>
										<InfoText>
											{getPerfectFor().map((item, idx) => (
												<React.Fragment key={idx}>
													{idx > 0 && <br />}• {item}
												</React.Fragment>
											))}
										</InfoText>
									</div>
								</InfoBox>
								<InfoBox $variant="warning" style={{ marginBottom: 0 }}>
									<FiAlertCircle size={20} />
									<div>
										<InfoTitle>Required for Full Functionality</InfoTitle>
										<InfoText>
											{flowType === 'client-credentials' ? (
												<>
													<strong>Client Secret:</strong> Required for token request
													<br />
													<strong>Scopes:</strong> Resource server scopes (e.g., ClaimScope, custom:read)
													<br />
													<strong>Environment ID:</strong> Must match your PingOne environment
												</>
											) : flowType === 'device-code' ? (
												<>
													<strong>Client ID:</strong> Required for device authorization request
													<br />
													<strong>Scopes:</strong> Include "openid" for OIDC Core 1.0 flows
													<br />
													<strong>Environment ID:</strong> Must match your PingOne environment
												</>
											) : (
												<>
													<strong>Client Secret:</strong> Required for token introspection and refresh
													<br />
													<strong>Scopes:</strong> Include "profile" scope for user info endpoint
													<br />
													<strong>Environment ID:</strong> Must match your PingOne environment
												</>
											)}
										</InfoText>
									</div>
								</InfoBox>
							</div>

							{/* OAuth vs OIDC Comparison (for flows that support both) */}
							{supportsOAuthAndOIDC && (
								<GeneratedContentBox>
									<GeneratedLabel>OAuth vs OIDC - Key Differences</GeneratedLabel>
									<div
										style={{
											display: 'grid',
											gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
											gap: '1rem',
										}}
									>
										<div
											style={{
												padding: '1rem',
												border: `2px solid ${!isOIDCMode ? '#3b82f6' : '#e2e8f0'}`,
												borderRadius: '0.5rem',
												background: !isOIDCMode ? '#eff6ff' : 'white',
											}}
										>
											<h4>OAuth 2.0 Mode</h4>
											<p>
												<strong>Tokens:</strong> Access + Refresh
											</p>
											<p>
												<strong>Purpose:</strong> API access only
											</p>
											<p>
												<strong>PingOne:</strong> Requires openid scope
											</p>
										</div>
										<div
											style={{
												padding: '1rem',
												border: `2px solid ${isOIDCMode ? '#3b82f6' : '#e2e8f0'}`,
												borderRadius: '0.5rem',
												background: isOIDCMode ? '#eff6ff' : 'white',
											}}
										>
											<h4>OIDC Core 1.0 Mode</h4>
											<p>
												<strong>Tokens:</strong> Access + ID + Refresh
											</p>
											<p>
												<strong>Purpose:</strong> Authentication + API access
											</p>
											<p>
												<strong>Standard:</strong> Requires openid scope
											</p>
										</div>
									</div>
								</GeneratedContentBox>
							)}

							{/* Enhanced Flow Info Card */}
							<EnhancedFlowInfoCard flowType={getFlowInfoCardType()} />

							{/* Flow Configuration Requirements */}
							<FlowConfigurationRequirements
								flowType={getFlowConfigReqType()}
								variant={isOIDCMode ? 'oidc' : 'oauth'}
							/>

							{/* Flow Sequence Display */}
							<FlowSequenceDisplay flowType={getFlowConfigReqType()} />
						</CollapsibleContent>
					)}
				</CollapsibleSection>

				{/* Credentials form is rendered by parent */}
				<div
					style={{
						padding: '20px 24px',
						background: '#ffffff',
						border: allConfigured ? '2px solid #10b981' : '2px solid #3b82f6',
						borderRadius: '8px',
						boxShadow: allConfigured
							? '0 2px 8px rgba(16, 185, 129, 0.15)'
							: '0 2px 8px rgba(59, 130, 246, 0.15)',
						marginBottom: '16px',
					}}
				>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '12px',
							marginBottom: '12px',
						}}
					>
						<span style={{ fontSize: '20px' }}>{allConfigured ? '✅' : '⚙️'}</span>
						<h3
							style={{
								margin: 0,
								fontSize: '16px',
								fontWeight: '600',
								color: allConfigured ? '#059669' : '#1e40af',
							}}
						>
							{allConfigured ? 'Configuration Complete' : 'Configuration Required'}
						</h3>
					</div>
					{allConfigured ? (
						<p
							style={{
								color: '#059669',
								fontSize: '14px',
								margin: 0,
								lineHeight: '1.6',
								fontWeight: '500',
							}}
						>
							✓ All required fields are configured. You can proceed to the next step.
						</p>
					) : (
						<>
							<p
								style={{
									color: '#374151',
									fontSize: '14px',
									margin: '0 0 12px 0',
									lineHeight: '1.6',
								}}
							>
								Please configure the following required fields in the form above to begin the flow:
							</p>
							<ul
								style={{
									margin: 0,
									paddingLeft: '24px',
									fontSize: '14px',
									lineHeight: '1.8',
								}}
							>
								{missingFields.map((field, index) => (
									<li key={index}>
										<strong style={{ color: '#ef4444' }}>{field}</strong>
									</li>
								))}
							</ul>
						</>
					)}
					{needsClientSecret && flowType !== 'client-credentials' && !allConfigured && (
						<div
							style={{
								marginTop: '12px',
								padding: '10px 14px',
								background: '#fef3c7',
								border: '1px solid #fbbf24',
								borderRadius: '6px',
								fontSize: '13px',
								color: '#92400e',
							}}
						>
							<strong>Note:</strong> Client Secret is required for your selected authentication
							method. Alternatively, you can enable PKCE for a public client flow.
						</div>
					)}
				</div>

				{/* Pre-flight Validation Results Section - Collapsible and positioned after errors */}
				{preFlightValidationResult && (
					<CollapsibleSection>
						<CollapsibleHeaderButton
							onClick={() => setPreflightValidationCollapsed(!preflightValidationCollapsed)}
							aria-expanded={!preflightValidationCollapsed}
							style={{
								background: preFlightValidationResult.errors.length > 0
									? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
									: preFlightValidationResult.warnings.length > 0
										? 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)'
										: 'linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%)',
								color:
									preFlightValidationResult.errors.length > 0
										? '#991b1b'
										: preFlightValidationResult.warnings.length > 0
											? '#c2410c'
											: '#166534',
							}}
						>
							<CollapsibleTitle>
								<span style={{ fontSize: '20px', marginRight: '8px' }}>
									{preFlightValidationResult.errors.length > 0
										? '❌'
										: preFlightValidationResult.warnings.length > 0
											? '⚠️'
											: '✅'}
								</span>
								🔍 Pre-flight Validation Results
								{preFlightValidationResult.errors.length > 0 && (
									<span style={{ marginLeft: '8px', fontSize: '0.9em' }}>
										({preFlightValidationResult.errors.length} error{preFlightValidationResult.errors.length !== 1 ? 's' : ''})
									</span>
								)}
								{preFlightValidationResult.errors.length === 0 && preFlightValidationResult.warnings.length > 0 && (
									<span style={{ marginLeft: '8px', fontSize: '0.9em' }}>
										({preFlightValidationResult.warnings.length} warning{preFlightValidationResult.warnings.length !== 1 ? 's' : ''})
									</span>
								)}
							</CollapsibleTitle>
							<CollapsibleToggleIcon $collapsed={preflightValidationCollapsed}>
								<FiChevronDown />
							</CollapsibleToggleIcon>
						</CollapsibleHeaderButton>
						{!preflightValidationCollapsed && (
							<CollapsibleContent>
								<div
									style={{
										padding: '20px',
										background: preFlightValidationResult.errors.length > 0
											? '#fee2e2'
											: preFlightValidationResult.warnings.length > 0
												? '#fff7ed'
												: '#f0fdf4',
										border: `2px solid ${
											preFlightValidationResult.errors.length > 0
												? '#dc2626'
												: preFlightValidationResult.warnings.length > 0
													? '#fb923c'
													: '#22c55e'
										}`,
										borderRadius: '12px',
										marginBottom: '24px',
										boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
									}}
								>
						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
							<span style={{ fontSize: '24px', flexShrink: 0 }}>
								{preFlightValidationResult.errors.length > 0
									? '❌'
									: preFlightValidationResult.warnings.length > 0
										? '⚠️'
										: '✅'}
							</span>
							<div style={{ flex: 1 }}>
								<strong
									style={{
										color:
											preFlightValidationResult.errors.length > 0
												? '#991b1b'
												: preFlightValidationResult.warnings.length > 0
													? '#c2410c'
													: '#166534',
										fontSize: '18px',
										display: 'block',
										marginBottom: '12px',
									}}
								>
									🔍 Pre-flight Validation Results
								</strong>
								
								{/* Summary */}
								<div style={{ marginBottom: '16px', fontSize: '14px', color: '#4b5563' }}>
									{preFlightValidationResult.errors.length > 0 && (
										<span style={{ color: '#991b1b', fontWeight: '600' }}>
											{preFlightValidationResult.errors.length} error(s) found
										</span>
									)}
									{preFlightValidationResult.errors.length > 0 && preFlightValidationResult.warnings.length > 0 && (
										<span style={{ margin: '0 8px' }}>•</span>
									)}
									{preFlightValidationResult.warnings.length > 0 && (
										<span style={{ color: '#c2410c', fontWeight: '600' }}>
											{preFlightValidationResult.warnings.length} warning(s)
										</span>
									)}
									{preFlightValidationResult.errors.length === 0 && preFlightValidationResult.warnings.length === 0 && (
										<span style={{ color: '#166534', fontWeight: '600' }}>
											All validations passed! Configuration matches PingOne settings.
										</span>
									)}
								</div>

								{/* Errors Section */}
								{preFlightValidationResult.errors.length > 0 && (
									<div
										style={{
											marginBottom: '16px',
											padding: '12px',
											background: '#fee2e2',
											border: '1px solid #dc2626',
											borderRadius: '8px',
										}}
									>
										<strong
											style={{
												color: '#991b1b',
												fontSize: '15px',
												display: 'block',
												marginBottom: '8px',
											}}
										>
											❌ ERRORS (must be fixed before proceeding):
										</strong>
										<div
											style={{
												color: '#991b1b',
												fontSize: '14px',
												lineHeight: '1.8',
											}}
										>
											{preFlightValidationResult.errors.map((err, idx) => (
												<div key={idx} style={{ marginTop: idx > 0 ? '8px' : '0', marginLeft: '8px' }}>
													• {err}
												</div>
											))}
										</div>
										{preFlightValidationResult.fixableErrors && preFlightValidationResult.fixableErrors.length > 0 && (
											<button
												type="button"
												onClick={async () => {
													try {
														setIsLoading(true);
														setLoadingMessage('🔧 Fixing errors...');
														
														const { uiNotificationServiceV8 } = await import('@/v8/services/uiNotificationServiceV8');
														const { PreFlightValidationServiceV8 } = await import('@/v8/services/preFlightValidationServiceV8');
														const { workerTokenServiceV8 } = await import('@/v8/services/workerTokenServiceV8');
														const { CredentialsServiceV8 } = await import('@/v8/services/credentialsServiceV8');
														
														const fixableErrors = preFlightValidationResult.fixableErrors || [];
														const fixDescriptions = fixableErrors.map(fe => `  • ${fe.fixDescription}`).join('\n');
														const fixableCount = fixableErrors.length;
														const totalErrors = preFlightValidationResult.errors.length;
														
														let message = `Found ${fixableCount} fixable error(s) out of ${totalErrors} total error(s).\n\n`;
														message += `The following can be automatically fixed:\n${fixDescriptions}\n\n`;
														message += `Would you like to automatically fix all fixable errors?`;
														
														const confirmed = await uiNotificationServiceV8.confirm({
															title: '🔧 Fix All Errors?',
															message: message,
															confirmText: 'Yes, Fix All',
															cancelText: 'No, I\'ll Fix Manually',
															severity: 'warning',
														});
														
														if (confirmed) {
															const updatedCredentials = { ...credentials };
															const fixesApplied: string[] = [];
															
															for (const fixableError of fixableErrors) {
																if (fixableError.fixData) {
																	if (fixableError.fixData.redirectUri) {
																		updatedCredentials.redirectUri = fixableError.fixData.redirectUri;
																		fixesApplied.push(`Redirect URI: ${fixableError.fixData.redirectUri}`);
																	}
																	if (fixableError.fixData.enablePKCE) {
																		updatedCredentials.usePKCE = true;
																		fixesApplied.push('PKCE enabled');
																	}
																	if (fixableError.fixData.authMethod) {
																		updatedCredentials.clientAuthMethod = fixableError.fixData.authMethod as 'none' | 'client_secret_basic' | 'client_secret_post' | 'client_secret_jwt' | 'private_key_jwt';
																		fixesApplied.push(`Auth method: ${fixableError.fixData.authMethod}`);
																	}
																	if (fixableError.fixData.addScope) {
																		const currentScopes = updatedCredentials.scopes || '';
																		if (!currentScopes.includes(fixableError.fixData.addScope)) {
																			updatedCredentials.scopes = currentScopes.trim()
																				? `${currentScopes.trim()} ${fixableError.fixData.addScope}`
																				: fixableError.fixData.addScope;
																			fixesApplied.push(`Added scope: ${fixableError.fixData.addScope}`);
																		}
																	}
																	if (fixableError.fixData.responseType) {
																		updatedCredentials.responseType = fixableError.fixData.responseType as 'code' | 'token' | 'id_token' | 'code token' | 'code id_token' | 'token id_token' | 'code token id_token';
																		fixesApplied.push(`Response type: ${fixableError.fixData.responseType}`);
																	}
																}
															}
															
															const flowKey = `${specVersion}-${flowType}-v8u`;
															CredentialsServiceV8.saveCredentials(flowKey, updatedCredentials);
															
															// Also save shared credentials (environmentId, clientId, clientAuthMethod) to backup storage
															// This ensures fixes persist across all flows and browser restarts
															const { SharedCredentialsServiceV8 } = await import('@/v8/services/sharedCredentialsServiceV8');
															const sharedCreds = SharedCredentialsServiceV8.extractSharedCredentials(updatedCredentials);
															if (sharedCreds.environmentId || sharedCreds.clientId || sharedCreds.clientAuthMethod) {
																// Use sync version for immediate browser storage
																SharedCredentialsServiceV8.saveSharedCredentialsSync(sharedCreds);
																// Also save to disk asynchronously (non-blocking)
																SharedCredentialsServiceV8.saveSharedCredentials(sharedCreds).catch((err) => {
																	console.warn(`[UnifiedFlowSteps] Background disk save failed (non-critical):`, err);
																});
															}
															
															if (onCredentialsChange) {
																onCredentialsChange(updatedCredentials);
															}
															
															toastV8.success(`Fixed ${fixesApplied.length} error(s): ${fixesApplied.join(', ')}`);
															
															// Re-run validation
															setLoadingMessage('🔍 Re-validating configuration...');
															const workerToken = await workerTokenServiceV8.getToken();
															const newValidationResult = await PreFlightValidationServiceV8.validateBeforeAuthUrl({
																specVersion,
																flowType,
																credentials: updatedCredentials,
																...(workerToken && { workerToken }),
															});
															
															setPreFlightValidationResult({
																passed: newValidationResult.passed,
																errors: newValidationResult.errors,
																warnings: newValidationResult.warnings,
																fixableErrors: newValidationResult.fixableErrors || [],
																...(newValidationResult.appConfig && { appConfig: newValidationResult.appConfig }),
															});
															
															if (newValidationResult.errors.length > 0) {
																setValidationErrors(newValidationResult.errors);
																setValidationWarnings([]);
																toastV8.error('Some errors remain after fixes');
															} else if (newValidationResult.warnings.length > 0) {
																setValidationWarnings(newValidationResult.warnings);
																setValidationErrors([]);
																toastV8.warning('Pre-flight validation warnings remain');
															} else {
																setValidationWarnings([]);
																setValidationErrors([]);
																toastV8.success('✅ All errors fixed! Pre-flight validation passed!');
															}
														}
													} catch (error) {
														console.error(`${MODULE_TAG} Error fixing errors:`, error);
														toastV8.error('Failed to fix errors');
													} finally {
														setIsLoading(false);
														setLoadingMessage('');
													}
												}}
												disabled={isLoading}
												style={{
													marginTop: '12px',
													padding: '8px 16px',
													background: '#dc2626',
													border: 'none',
													borderRadius: '6px',
													color: 'white',
													fontSize: '14px',
													fontWeight: '500',
													cursor: isLoading ? 'not-allowed' : 'pointer',
													opacity: isLoading ? 0.6 : 1,
													display: 'inline-flex',
													alignItems: 'center',
													gap: '6px',
												}}
											>
												🔧 Fix All Errors
											</button>
										)}
									</div>
								)}

								{/* Warnings Section */}
								{preFlightValidationResult.warnings.length > 0 && (
									<div
										style={{
											marginBottom: '16px',
											padding: '12px',
											background: '#fff7ed',
											border: '1px solid #fb923c',
											borderRadius: '8px',
										}}
									>
										<strong
											style={{
												color: '#c2410c',
												fontSize: '15px',
												display: 'block',
												marginBottom: '8px',
											}}
										>
											⚠️ WARNINGS (you can still proceed):
										</strong>
										<div
											style={{
												color: '#9a3412',
												fontSize: '14px',
												lineHeight: '1.8',
											}}
										>
											{preFlightValidationResult.warnings.map((warn, idx) => (
												<div key={idx} style={{ marginTop: idx > 0 ? '8px' : '0', marginLeft: '8px' }}>
													• {warn}
												</div>
											))}
										</div>
									</div>
								)}

								{/* Success Section - Show what matched */}
								{preFlightValidationResult.errors.length === 0 && preFlightValidationResult.warnings.length === 0 && (
									<div
										style={{
											padding: '12px',
											background: '#dcfce7',
											border: '1px solid #22c55e',
											borderRadius: '8px',
										}}
									>
										<div
											style={{
												color: '#166534',
												fontSize: '14px',
												lineHeight: '1.8',
												fontWeight: '500',
											}}
										>
											✅ All pre-flight checks passed! Your configuration is valid and matches PingOne settings.
										</div>
										<div
											style={{
												marginTop: '12px',
												padding: '10px',
												background: 'white',
												borderRadius: '6px',
												fontSize: '13px',
												color: '#166534',
												lineHeight: '1.6',
											}}
										>
											<strong>Validated:</strong>
											<ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
												<li>✓ Redirect URI matches PingOne configuration</li>
												<li>✓ Client authentication method matches</li>
												<li>✓ PKCE requirements satisfied</li>
												<li>✓ Required scopes present</li>
												<li>✓ Response type valid for flow</li>
												{preFlightValidationResult.appConfig?.requireSignedRequestObject && (
													<li>✓ JAR (signed request object) credentials configured</li>
												)}
											</ul>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
							</CollapsibleContent>
						)}
					</CollapsibleSection>
				)}
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

				{/* PKCE Educational Sections */}
				<CollapsibleSection>
					<CollapsibleHeaderButton
						onClick={() => setPkceOverviewCollapsed(!pkceOverviewCollapsed)}
						aria-expanded={!pkceOverviewCollapsed}
					>
						<CollapsibleTitle>
							<FiBook /> What is PKCE?
						</CollapsibleTitle>
						<CollapsibleToggleIcon $collapsed={pkceOverviewCollapsed}>
							<FiChevronDown />
						</CollapsibleToggleIcon>
					</CollapsibleHeaderButton>
					{!pkceOverviewCollapsed && (
						<CollapsibleContent>
							<InfoBox $variant="info">
								<FiShield size={20} />
								<div>
									<InfoTitle>PKCE (Proof Key for Code Exchange)</InfoTitle>
									<InfoText>
										PKCE is a security extension for OAuth 2.0 that prevents authorization code
										interception attacks. It's required for public clients (like mobile apps)
										and highly recommended for all OAuth flows.
									</InfoText>
								</div>
							</InfoBox>

							<InfoBox $variant="warning">
								<FiAlertCircle size={20} />
								<div>
									<InfoTitle>The Security Problem PKCE Solves</InfoTitle>
									<InfoText>
										Without PKCE, if an attacker intercepts your authorization code (through app
										redirects, network sniffing, or malicious apps), they could exchange it for
										tokens. PKCE prevents this by requiring proof that the same client that
										started the flow is finishing it.
									</InfoText>
								</div>
							</InfoBox>
						</CollapsibleContent>
					)}
				</CollapsibleSection>

				<CollapsibleSection>
					<CollapsibleHeaderButton
						onClick={() => setPkceDetailsCollapsed(!pkceDetailsCollapsed)}
						aria-expanded={!pkceDetailsCollapsed}
					>
						<CollapsibleTitle>
							<FiBook /> Understanding Code Verifier & Code Challenge
						</CollapsibleTitle>
						<CollapsibleToggleIcon $collapsed={pkceDetailsCollapsed}>
							<FiChevronDown />
						</CollapsibleToggleIcon>
					</CollapsibleHeaderButton>
					{!pkceDetailsCollapsed && (
						<CollapsibleContent>
							<ParameterGrid>
								<InfoBox $variant="success">
									<FiKey size={20} />
									<div>
										<InfoTitle>Code Verifier</InfoTitle>
										<InfoText>
											A high-entropy cryptographic random string (43-128 chars) that stays
											secret in your app. Think of it as a temporary password that proves you're
											the same client that started the OAuth flow.
										</InfoText>
										<InfoList>
											<li>Generated fresh for each OAuth request</li>
											<li>Uses characters: A-Z, a-z, 0-9, -, ., _, ~</li>
											<li>Never sent in the authorization request</li>
											<li>Only revealed during token exchange</li>
										</InfoList>
									</div>
								</InfoBox>

								<InfoBox $variant="info">
									<FiShield size={20} />
									<div>
										<InfoTitle>Code Challenge</InfoTitle>
										<InfoText>
											A SHA256 hash of the code verifier, encoded in base64url format. This is
											sent publicly in the authorization URL but can't be reversed to get the
											original verifier.
										</InfoText>
										<InfoList>
											<li>Derived from: SHA256(code_verifier)</li>
											<li>Encoded in base64url (URL-safe)</li>
											<li>Safe to include in authorization URLs</li>
											<li>Used by PingOne to verify the verifier later</li>
										</InfoList>
									</div>
								</InfoBox>
							</ParameterGrid>

							<InfoBox $variant="warning">
								<FiAlertCircle size={20} />
								<div>
									<InfoTitle>Security Best Practices</InfoTitle>
									<InfoList>
										<li>
											<strong>Generate Fresh Values:</strong> Create new PKCE parameters for
											every authorization request
										</li>
										<li>
											<strong>Secure Storage:</strong> Keep the code verifier in memory or
											secure storage, never log it
										</li>
										<li>
											<strong>Use S256 Method:</strong> Always use SHA256 hashing
											(code_challenge_method=S256)
										</li>
										<li>
											<strong>Sufficient Entropy:</strong> Use at least 43 characters of
											high-entropy randomness
										</li>
									</InfoList>
								</div>
							</InfoBox>
						</CollapsibleContent>
					)}
				</CollapsibleSection>

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
	const handleResumeRedirectlessFlow = useCallback(
		async (flowId: string, stateValue: string, resumeUrl?: string) => {
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

				// CRITICAL: Get sessionId for cookie retrieval
				const sessionId = sessionStorage.getItem(`${flowKey}-redirectless-sessionId`);
				if (!sessionId) {
					throw new Error('Session ID not found. Please restart the flow.');
				}

				console.log(`${MODULE_TAG} 🔌 Resuming redirectless flow`, {
					flowId,
					hasSessionId: !!sessionId,
					resumeUrl: `${resumeUrl.substring(0, 100)}...`,
				});

				// Track API call for display
				const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
				const startTime = Date.now();
				const requestBody = {
					resumeUrl,
					flowId,
					flowState: stateValue,
					clientId: credentials.clientId,
					clientSecret: '***REDACTED***',
					codeVerifier: '***REDACTED***',
					sessionId,
				};

				const callId = apiCallTrackerService.trackApiCall({
					method: 'POST',
					url: '/api/pingone/resume',
					actualPingOneUrl: resumeUrl,
					isProxy: true,
					headers: {
						'Content-Type': 'application/json',
					},
					body: requestBody,
					step: 'unified-resume-flow',
					flowType: 'unified',
				});

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
						sessionId, // CRITICAL: Include sessionId to retrieve cookies from cookie jar
					}),
				});

				// Parse response once (clone first to avoid consuming the body)
				const responseClone = resumeResponse.clone();
				let responseData: unknown;
				try {
					responseData = await responseClone.json();
				} catch {
					responseData = { error: 'Failed to parse response' };
				}

				// Update API call with response
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: resumeResponse.status,
						statusText: resumeResponse.statusText,
						data: responseData,
					},
					Date.now() - startTime
				);

				if (!resumeResponse.ok) {
					const errorData = responseData as Record<string, unknown>;
					const errorMsg = (errorData.error_description ||
						errorData.error ||
						`Resume failed (${resumeResponse.status})`) as string;
					throw new Error(errorMsg);
				}

				const resumeData = responseData as Record<string, unknown>;
				console.log(`${MODULE_TAG} 🔌 Resume response:`, resumeData);

				// Try to extract code from various possible locations
				// PingOne might return code directly, or nested in a flow object, or in authorizeResponse
				let authCode: string | undefined;

				// First try: direct code field
				if (resumeData.code && typeof resumeData.code === 'string') {
					authCode = resumeData.code;
				}
				// Second try: nested in flow object (pi.flow format)
				else if (
					resumeData.flow &&
					typeof resumeData.flow === 'object' &&
					resumeData.flow !== null &&
					'code' in resumeData.flow &&
					typeof (resumeData.flow as Record<string, unknown>).code === 'string'
				) {
					authCode = (resumeData.flow as Record<string, unknown>).code as string;
				}
				// Third try: in authorizeResponse (pi.flow format)
				else if (
					resumeData.authorizeResponse &&
					typeof resumeData.authorizeResponse === 'object' &&
					resumeData.authorizeResponse !== null &&
					'code' in resumeData.authorizeResponse &&
					typeof (resumeData.authorizeResponse as Record<string, unknown>).code === 'string'
				) {
					authCode = (resumeData.authorizeResponse as Record<string, unknown>).code as string;
				}
				// Fourth try: alternative field names
				else if (
					resumeData.authorization_code &&
					typeof resumeData.authorization_code === 'string'
				) {
					authCode = resumeData.authorization_code;
				} else if (resumeData.authCode && typeof resumeData.authCode === 'string') {
					authCode = resumeData.authCode;
				}

				if (!authCode) {
					// Log full response for debugging
					console.error(`${MODULE_TAG} 🔌 Authorization code not found in resume response`, {
						responseKeys: Object.keys(resumeData),
						hasCode: !!resumeData.code,
						hasFlow: !!resumeData.flow,
						hasAuthorizeResponse: !!resumeData.authorizeResponse,
						hasAuthorizationCode: !!resumeData.authorization_code,
						hasAuthCode: !!resumeData.authCode,
						fullResponse: resumeData,
					});
					throw new Error(
						'Authorization code not found in resume response. Check console for full response details.'
					);
				}

				// Store authorization code in flow state for display (similar to callback parsing)
				console.log(`${MODULE_TAG} 🔌 Authorization code received from resume`, {
					code: `${authCode.substring(0, 20)}...`,
				});

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
				// For oauth-authz and hybrid: Step 2 is callback (PKCE is in Advanced Options, not a separate step)
				const callbackStepIndex = 2; // Step 2 for oauth-authz and hybrid

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
		},
		[
			credentials,
			flowKey,
			flowState,
			flowType,
			isPKCERequired, // Navigate to callback step - user will see the authorization code, then can proceed to exchange
			navigateToStep,
		]
	);

	/**
	 * Exchange authorization code for tokens in redirectless flow
	 * Step 4: Exchange authorization code for tokens
	 */
	const handleRedirectlessTokenExchange = useCallback(
		async (authCode: string, codeVerifier: string) => {
			setIsLoading(true);
			setLoadingMessage('🔄 Exchanging Authorization Code for Tokens...');
			setError(null);

			try {
				console.log(`${MODULE_TAG} 🔌 Exchanging authorization code for tokens`);

				// Use relative URL to go through Vite proxy (avoids certificate issues)
				// In development: Vite proxy routes /api/* to http://localhost:3001
				// In production: Vite proxy routes /api/* to the production backend
				const tokenEndpoint = '/api/token-exchange';

				const tokenRequestBody = {
					grant_type: 'authorization_code',
					code: authCode,
					redirect_uri: credentials.redirectUri || 'urn:pingidentity:redirectless',
					client_id: credentials.clientId,
					client_secret: credentials.clientSecret,
					environment_id: credentials.environmentId,
					code_verifier: codeVerifier,
				};

				// Track API call for display
				const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
				const startTime = Date.now();
				const callId = apiCallTrackerService.trackApiCall({
					method: 'POST',
					url: tokenEndpoint,
					body: {
						...tokenRequestBody,
						code: '***REDACTED***',
						code_verifier: '***REDACTED***',
						client_secret: '***REDACTED***',
					},
					step: 'unified-redirectless-token-exchange',
				});

				const tokenResponse = await fetch(tokenEndpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(tokenRequestBody),
				});

				// Update API call with response
				const responseClone = tokenResponse.clone();
				let responseData: unknown;
				try {
					responseData = await responseClone.json();
				} catch {
					responseData = { error: 'Failed to parse response' };
				}

				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: tokenResponse.status,
						statusText: tokenResponse.statusText,
						data: responseData,
					},
					Date.now() - startTime
				);

				if (!tokenResponse.ok) {
					const errorData = responseData as Record<string, unknown>;
					const errorMsg = (errorData.error_description ||
						errorData.error ||
						`Token exchange failed (${tokenResponse.status})`) as string;
					throw new Error(errorMsg);
				}

				const tokenData = responseData as Record<string, unknown>;
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

				// Mark this as a redirectless flow to prevent dashboard redirects
				sessionStorage.setItem('v8u_redirectless_flow_active', 'true');

				toastV8.success('✅ Tokens obtained successfully via redirectless authentication!');

				// Navigate to tokens step
				// Find the tokens step index (varies by flow type)
				const tokensStepIndex = totalSteps - 2; // Second to last step is tokens
				navigateToStep(tokensStepIndex);
			} catch (err) {
				const message =
					err instanceof Error ? err.message : 'Failed to exchange authorization code for tokens';
				setError(message);
				toastV8.error(message);
			} finally {
				setIsLoading(false);
				setLoadingMessage('');
			}
		},
		[credentials, flowState, nav, totalSteps, navigateToStep]
	);

	/**
	 * Submit credentials to PingOne Flow API
	 * Step 2: Submit credentials when USERNAME_PASSWORD_REQUIRED is returned
	 */
	const handleSubmitRedirectlessCredentials = useCallback(
		async (username: string, password: string) => {
			setIsRedirectlessAuthenticating(true);
			setRedirectlessAuthError(null);

			try {
				const flowId = sessionStorage.getItem(`${flowKey}-redirectless-flowId`);
				const stateValue = sessionStorage.getItem(`${flowKey}-redirectless-state`);
				const sessionId = sessionStorage.getItem(`${flowKey}-redirectless-sessionId`);

				if (!flowId || !stateValue) {
					throw new Error('Flow state not found. Please restart the flow.');
				}

				console.log(`${MODULE_TAG} 🔌 Submitting credentials to PingOne Flow API`, {
					flowId,
					username,
					hasSessionId: !!sessionId,
				});

				const flowApiUrl = `https://auth.pingone.com/${credentials.environmentId}/flows/${flowId}`;

				// Track API call for display
				const { apiCallTrackerService: apiCallTrackerService2 } = await import('@/services/apiCallTrackerService');
				const startTime2 = Date.now();
				const requestBody2 = {
					environmentId: credentials.environmentId,
					flowUrl: flowApiUrl,
					username,
					password: '***REDACTED***',
					clientId: credentials.clientId,
					clientSecret: '***REDACTED***',
					sessionId,
				};

				const callId2 = apiCallTrackerService2.trackApiCall({
					method: 'POST',
					url: '/api/pingone/flows/check-username-password',
					actualPingOneUrl: flowApiUrl,
					isProxy: true,
					headers: {
						'Content-Type': 'application/json',
					},
					body: requestBody2,
					step: 'unified-check-credentials',
					flowType: 'unified',
				});

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
						sessionId, // CRITICAL: Pass sessionId to maintain cookie session
					}),
				});

				// Parse response once (clone first to avoid consuming the body)
				const responseClone2 = credentialsResponse.clone();
				let responseData2: unknown;
				try {
					responseData2 = await responseClone2.json();
				} catch {
					responseData2 = { error: 'Failed to parse response' };
				}

				// Update API call with response
				apiCallTrackerService2.updateApiCallResponse(
					callId2,
					{
						status: credentialsResponse.status,
						statusText: credentialsResponse.statusText,
						data: responseData2,
					},
					Date.now() - startTime2
				);

				if (!credentialsResponse.ok) {
					const errorData = responseData2 as { error?: string; message?: string };
					throw new Error(
						errorData.error ||
							errorData.message ||
							`Credentials submission failed: ${credentialsResponse.status} ${credentialsResponse.statusText}`
					);
				}

				const credentialsData = responseData2 as Record<string, unknown>;
				console.log(`${MODULE_TAG} 🔌 Credentials response:`, credentialsData);

				// Extract and update sessionId from credentials response
				const updatedSessionId = credentialsData._sessionId as string | undefined;
				if (updatedSessionId) {
					sessionStorage.setItem(`${flowKey}-redirectless-sessionId`, updatedSessionId);
					console.log(`${MODULE_TAG} 🔌 Updated sessionId from credentials response`);
				}

				const status = String(credentialsData.status || '').toUpperCase();
				const resumeUrl = credentialsData.resumeUrl as string | undefined;

				// Handle MUST_CHANGE_PASSWORD status
				if (status === 'MUST_CHANGE_PASSWORD') {
					console.log(`${MODULE_TAG} 🔌 Password change required detected`);
					
					// Extract userId from response if available, otherwise we'll need to look it up
					const credentialsDataTyped = credentialsData as {
						userId?: string;
						user?: { id?: string };
						_embedded?: { user?: { id?: string } };
					};
					const userId = (credentialsDataTyped.userId || 
						credentialsDataTyped.user?.id || 
						credentialsDataTyped._embedded?.user?.id) as string | undefined;
					
					// Store username for user lookup if needed
					setPasswordChangeUsername(username);
					
					if (userId) {
						setPasswordChangeUserId(userId);
						setPasswordChangeFlowId(flowId);
						setPasswordChangeState(stateValue);
						setShowPasswordChangeModal(true);
						setShowRedirectlessModal(false);
						setIsRedirectlessAuthenticating(false);
						toastV8.warning('⚠️ Password change is required. Please update your password to continue.');
					} else {
						// If userId is not available, try to look it up by username
						try {
							// Get worker token for user lookup
							const { workerTokenServiceV8 } = await import('@/v8/services/workerTokenServiceV8');
							const workerToken = await workerTokenServiceV8.getToken();
							
							// Look up user by username
							const lookupResponse = await fetch('/api/pingone/mfa/lookup-user', {
								method: 'POST',
								headers: {
									'Content-Type': 'application/json',
								},
								body: JSON.stringify({
									environmentId: credentials.environmentId,
									username,
									workerToken,
								}),
							});
							
							if (lookupResponse.ok) {
								const userData = await lookupResponse.json();
								const foundUserId = userData.id;
								if (foundUserId) {
									setPasswordChangeUserId(foundUserId);
									setPasswordChangeFlowId(flowId);
									setPasswordChangeState(stateValue);
									setShowPasswordChangeModal(true);
									setShowRedirectlessModal(false);
									setIsRedirectlessAuthenticating(false);
									toastV8.warning('⚠️ Password change is required. Please update your password to continue.');
								} else {
									throw new Error('User ID not found in lookup response');
								}
							} else {
								throw new Error('Failed to lookup user');
							}
						} catch (lookupError) {
							console.error(`${MODULE_TAG} 🔌 Failed to lookup user:`, lookupError);
							const errorMsg = 'Password change is required, but user ID could not be determined. Please contact your administrator.';
							setRedirectlessAuthError(errorMsg);
							toastV8.error(`❌ ${errorMsg}`);
							setIsRedirectlessAuthenticating(false);
						}
					}
					return; // Stop further processing
				}

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

					const authorizeResponse = credentialsData.authorizeResponse as
						| Record<string, unknown>
						| undefined;

					// Check multiple possible locations for code and tokens
					const authCode = (authorizeResponse?.code ||
						credentialsData.code ||
						(authorizeResponse as Record<string, unknown>)?.authorization_code ||
						credentialsData.authorization_code) as string | undefined;

					const accessToken = (authorizeResponse?.access_token ||
						credentialsData.access_token ||
						(authorizeResponse as Record<string, unknown>)?.accessToken ||
						credentialsData.accessToken) as string | undefined;

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
									? {
											refreshToken: (authorizeResponse?.refresh_token ||
												credentialsData.refresh_token) as string,
										}
									: {}),
								...(authorizeResponse?.expires_in || credentialsData.expires_in
									? {
											expiresIn: (authorizeResponse?.expires_in ||
												credentialsData.expires_in) as number,
										}
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
							const callbackStepIndex =
								flowType === 'oauth-authz' || flowType === 'hybrid' ? (isPKCERequired ? 3 : 2) : 2;
							navigateToStep(callbackStepIndex);
						}
					} else {
						// COMPLETED but no code or tokens - might need to resume flow
						// Check if there's a resumeUrl even though status is COMPLETED
						const resumeUrl = credentialsData.resumeUrl as string | undefined;
						if (resumeUrl) {
							console.log(
								`${MODULE_TAG} 🔌 COMPLETED status but resumeUrl present - attempting resume`
							);
							sessionStorage.setItem(`${flowKey}-redirectless-resumeUrl`, resumeUrl);
							await handleResumeRedirectlessFlow(flowId, stateValue, resumeUrl);
						} else {
							// COMPLETED but no code, tokens, or resumeUrl - log full response for debugging
							console.warn(
								`${MODULE_TAG} 🔌 Flow COMPLETED but no code, tokens, or resumeUrl found`,
								{
									responseKeys: Object.keys(credentialsData),
									authorizeResponseKeys: authorizeResponse ? Object.keys(authorizeResponse) : null,
									fullResponse: credentialsData,
								}
							);
							setShowRedirectlessModal(false);
							setIsRedirectlessAuthenticating(false);
							toastV8.warning(
								'⚠️ Flow completed but no authorization code or tokens found. Please check the response.'
							);
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
		},
		[
			credentials,
			flowKey,
			handleResumeRedirectlessFlow,
			flowState,
			totalSteps,
			navigateToStep,
			isPKCERequired,
			handleRedirectlessTokenExchange,
			flowType,
		]
	);

	// Handle password change when MUST_CHANGE_PASSWORD is detected
	const handlePasswordChange = useCallback(
		async (_oldPassword: string, newPassword: string) => {
			if (!passwordChangeUserId || !credentials.environmentId) {
				throw new Error('Missing user ID or environment ID for password change');
			}

			try {
				// For MUST_CHANGE_PASSWORD during login, we need to use worker token
				// since we don't have user access token yet
				const { workerTokenServiceV8 } = await import('@/v8/services/workerTokenServiceV8');
				const workerToken = await workerTokenServiceV8.getToken();

				// Use PUT endpoint to set new password (admin operation with worker token)
				const response = await fetch('/api/pingone/password/set', {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						environmentId: credentials.environmentId,
						userId: passwordChangeUserId,
						workerToken,
						newPassword,
						forceChange: false, // Password is being changed, not forced
					}),
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					throw new Error(
						errorData.error_description || errorData.message || 'Failed to change password'
					);
				}

				toastV8.success('✅ Password changed successfully!');
				
				// Close modal and clear state
				setShowPasswordChangeModal(false);
				setPasswordChangeUserId(null);
				setPasswordChangeFlowId(null);
				setPasswordChangeState(null);
				setPasswordChangeUsername(null);
				
				// Show message to retry login
				toastV8.info('Please try signing in again with your new password.');
				
				// Re-open the login modal so user can try again
				setShowRedirectlessModal(true);
			} catch (error) {
				console.error(`${MODULE_TAG} 🔌 Password change failed:`, error);
				throw error; // Re-throw to let modal handle the error display
			}
		},
		[passwordChangeUserId, passwordChangeUsername, credentials.environmentId, handleSubmitRedirectlessCredentials]
	);

	// Handler for starting redirectless authentication after URL is displayed
	const handleStartRedirectlessAuth = useCallback(async () => {
		const isRedirectless = credentials.responseMode === 'pi.flow' || credentials.useRedirectless;
		if (!isRedirectless || !flowState.authorizationUrl) {
			console.warn(
				`${MODULE_TAG} ⚠️ Cannot start redirectless auth - missing URL or not in redirectless mode`
			);
			return;
		}

		// Ensure we have PKCE codes for redirectless flow
		if (!flowState.codeVerifier || !flowState.codeChallenge) {
			toastV8.error(
				'PKCE codes are required for redirectless flow. Please generate PKCE parameters first.'
			);
			return;
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

		// Add optional OIDC parameters
		if (credentials.prompt) {
			authorizeRequestBody.prompt = credentials.prompt;
		}
		if (credentials.loginHint) {
			authorizeRequestBody.loginHint = credentials.loginHint;
		}
		if (credentials.maxAge !== undefined) {
			authorizeRequestBody.maxAge = credentials.maxAge;
		}
		if (credentials.display) {
			authorizeRequestBody.display = credentials.display;
		}

		// Only include client secret for confidential clients (not public clients with clientAuthMethod: "none")
		if (credentials.clientAuthMethod !== 'none' && credentials.clientSecret) {
			authorizeRequestBody.clientSecret = credentials.clientSecret;
		}

		// Show modal with request details before making the request
		// Build the actual request body that will be sent to PingOne (including response_mode=pi.flow)
		const pingOneUrl = `https://auth.pingone.com/${credentials.environmentId}/as/authorize`;
		// Note: The backend converts this to form-encoded URLSearchParams, but we show it as JSON for readability
		const pingOneRequestBody: Record<string, unknown> = {
			response_type: 'code',
			response_mode: 'pi.flow', // CRITICAL: This is what makes it redirectless
			client_id: credentials.clientId,
			redirect_uri: credentials.redirectUri,
			scope: credentials.scopes || 'openid profile email',
			code_challenge: flowState.codeChallenge,
			code_challenge_method: 'S256',
			state: stateValue,
		};

		// Add optional OIDC parameters
		if (credentials.prompt) {
			pingOneRequestBody.prompt = credentials.prompt;
		}
		if (credentials.loginHint) {
			pingOneRequestBody.login_hint = credentials.loginHint;
		}
		if (credentials.maxAge !== undefined) {
			pingOneRequestBody.max_age = credentials.maxAge;
		}
		if (credentials.display) {
			pingOneRequestBody.display = credentials.display;
		}

		setPendingPingOneRequest({
			url: pingOneUrl,
			method: 'POST',
			body: pingOneRequestBody,
		});
		setShowPingOneRequestModal(true);
	}, [credentials, flowState, flowType]);

	// Handler for actually making the PingOne request (called after user confirms in modal)
	const handleProceedWithPingOneRequest = useCallback(async () => {
		if (!pendingPingOneRequest) {
			return;
		}

		setShowPingOneRequestModal(false);
		setIsLoading(true);
		setError(null);

		try {
			// Redirectless mode (pi.flow): Make POST request to PingOne Flow API
			console.log(
				`${MODULE_TAG} 🔌 Redirectless mode (response_mode=pi.flow) enabled - making POST request to PingOne Flow API`
			);

			// If PAR is enabled, check if request_uri is already in the authorization URL
			// (PAR was pushed when generating the URL)
			let parRequestUri: string | undefined;
			if (credentials.usePAR && flowState.authorizationUrl) {
				try {
					const url = new URL(flowState.authorizationUrl);
					parRequestUri = url.searchParams.get('request_uri') || undefined;
					if (parRequestUri) {
						console.log(
							`${MODULE_TAG} 🔌 PAR request_uri found in authorization URL (already pushed):`,
							`${parRequestUri.substring(0, 50)}...`
						);
					} else {
						console.warn(
							`${MODULE_TAG} ⚠️ PAR enabled but no request_uri in authorization URL - PAR may not have been pushed during URL generation`
						);
					}
				} catch (error) {
					console.warn(
						`${MODULE_TAG} ⚠️ Failed to parse authorization URL for PAR request_uri:`,
						error
					);
				}
			}

			// Build the backend proxy request body (NOT the PingOne-formatted body)
			// The backend expects: environmentId, clientId, redirectUri, scopes, codeChallenge, etc.
			// NOT: response_mode, client_id, redirect_uri, scope, etc. (those are for direct PingOne calls)
			const backendRequestBody: Record<string, unknown> = {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
			};

			// If PAR is used, only send request_uri (other params are in the PAR request)
			if (parRequestUri) {
				backendRequestBody.requestUri = parRequestUri;
				backendRequestBody.state = pendingPingOneRequest.body.state as string;
				console.log(`${MODULE_TAG} 🔌 Using PAR request_uri for redirectless authorize`);
			} else {
				// Regular flow - send all parameters
				backendRequestBody.redirectUri = credentials.redirectUri;
				backendRequestBody.scopes = credentials.scopes || 'openid profile email';
				backendRequestBody.codeChallenge = flowState.codeChallenge;
				backendRequestBody.codeChallengeMethod = 'S256';
				backendRequestBody.state = pendingPingOneRequest.body.state as string;
			}

			// Add optional OIDC parameters (only if not using PAR)
			if (!parRequestUri) {
				if (credentials.prompt) {
					backendRequestBody.prompt = credentials.prompt;
				}
				if (credentials.loginHint) {
					backendRequestBody.loginHint = credentials.loginHint;
				}
				if (credentials.maxAge !== undefined) {
					backendRequestBody.maxAge = credentials.maxAge;
				}
				if (credentials.display) {
					backendRequestBody.display = credentials.display;
				}
			}

			// Only include client secret for confidential clients (not needed for PAR as auth is in PAR request)
			if (!parRequestUri && credentials.clientAuthMethod !== 'none' && credentials.clientSecret) {
				backendRequestBody.clientSecret = credentials.clientSecret;
			}

			// Track API call for display
			const { apiCallTrackerService: apiCallTrackerService3 } = await import('@/services/apiCallTrackerService');
			const startTime3 = Date.now();
			const actualPingOneUrl = `https://auth.pingone.com/${credentials.environmentId}/as/authorize`;
			const requestBody3 = {
				...backendRequestBody,
				clientSecret: backendRequestBody.clientSecret ? '***REDACTED***' : undefined,
			};

			const callId3 = apiCallTrackerService3.trackApiCall({
				method: 'POST',
				url: '/api/pingone/redirectless/authorize',
				actualPingOneUrl,
				isProxy: true,
				headers: {
					'Content-Type': 'application/json',
				},
				body: requestBody3,
				step: 'unified-redirectless-authorize',
				flowType: 'unified',
			});

			const authorizeResponse = await fetch('/api/pingone/redirectless/authorize', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify(backendRequestBody),
			});

			// Parse response once (clone first to avoid consuming the body)
			const responseClone3 = authorizeResponse.clone();
			let responseData3: unknown;
			try {
				responseData3 = await responseClone3.json();
			} catch {
				responseData3 = { error: 'Failed to parse response' };
			}

			// Update API call with response
			apiCallTrackerService3.updateApiCallResponse(
				callId3,
				{
					status: authorizeResponse.status,
					statusText: authorizeResponse.statusText,
					data: responseData3,
				},
				Date.now() - startTime3
			);

			if (!authorizeResponse.ok) {
				const errorData = responseData3 as Record<string, unknown>;
				const errorMsg = (errorData.error_description ||
					errorData.error ||
					`Authorization request failed (${authorizeResponse.status})`) as string;
				throw new Error(errorMsg);
			}

			const flowData = responseData3 as Record<string, unknown>;
			console.log(`${MODULE_TAG} 🔌 Redirectless flow response:`, flowData);

			const flowId = flowData.id as string | undefined;
			const flowStatus = (flowData.status as string | undefined)?.toUpperCase();
			const sessionId = flowData._sessionId as string | undefined;

			console.log(`${MODULE_TAG} 🔌 Redirectless flow status check:`, {
				flowId,
				flowStatus,
				hasSessionId: !!sessionId,
				willShowModal: flowStatus === 'USERNAME_PASSWORD_REQUIRED' || flowStatus === 'IN_PROGRESS',
				rawStatus: flowData.status,
			});

			// Store flow state for subsequent steps
			const stateValue = (pendingPingOneRequest.body.state as string) || '';
			sessionStorage.setItem(`${flowKey}-redirectless-flowId`, flowId || '');
			sessionStorage.setItem(`${flowKey}-redirectless-state`, stateValue);
			if (flowState.codeVerifier) {
				sessionStorage.setItem(`${flowKey}-redirectless-codeVerifier`, flowState.codeVerifier);
			}
			if (flowState.codeChallenge) {
				sessionStorage.setItem(`${flowKey}-redirectless-codeChallenge`, flowState.codeChallenge);
			}
			if (sessionId) {
				sessionStorage.setItem(`${flowKey}-redirectless-sessionId`, sessionId);
				console.log(`${MODULE_TAG} 🔌 Stored sessionId from authorize response`);
			}

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

				console.log(
					`${MODULE_TAG} 🔌 Modal state after setShowRedirectlessModal(true) - modal should now be visible`
				);
				console.log(`${MODULE_TAG} 🔌 Flow ID stored:`, flowId);
				console.log(`${MODULE_TAG} 🔌 Flow Status:`, flowStatus);

				// Force re-render check
				setTimeout(() => {
					console.log(
						`${MODULE_TAG} 🔌 Modal visibility check after timeout - showRedirectlessModal should be true`
					);
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
				console.warn(
					`${MODULE_TAG} ⚠️ Unexpected flow status "${flowStatus}" but have flowId - showing modal as fallback to allow manual credential entry`
				);
				setShowRedirectlessModal(true);
				setIsLoading(false);
				return;
			}

			// If we don't have a flowId, something went wrong
			console.error(`${MODULE_TAG} ❌ No flowId in redirectless response:`, flowData);
			throw new Error(`Unexpected flow response: No flow ID. Status: ${flowStatus || 'UNKNOWN'}`);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : 'Failed to start redirectless authentication';
			setError(message);
			setValidationErrors([message]);
			toastV8.error(message);
		} finally {
			setIsLoading(false);
		}
	}, [
		pendingPingOneRequest,
		flowState,
		flowKey,
		handleResumeRedirectlessFlow,
		nav,
		credentials.clientAuthMethod,
		credentials.clientId,
		credentials.clientSecret,
		credentials.display,
		credentials.environmentId,
		credentials.loginHint,
		credentials.maxAge,
		credentials.prompt,
		credentials.redirectUri,
		credentials.scopes,
		credentials.usePAR,
		showRedirectlessModal,
	]);

	// Step 1 or 2: Generate Authorization URL (authz, implicit, hybrid)
	// For oauth-authz and hybrid, this is Step 2 (after PKCE)
	// For implicit, this is Step 1
	const renderStep1AuthUrl = () => {
		const handleGenerateAuthUrl = async () => {
			// Use a local variable to track current credentials (may be updated during auto-fix)
			let currentCredentials = credentials;
			
			console.log(`${MODULE_TAG} Generating authorization URL`, {
				flowType,
				hasPKCE: !!(flowState.codeVerifier && flowState.codeChallenge),
				redirectUri: currentCredentials.redirectUri,
				environmentId: currentCredentials.environmentId,
				clientId: currentCredentials.clientId,
				responseMode:
					currentCredentials.responseMode || (currentCredentials.useRedirectless ? 'pi.flow' : undefined),
				fullCredentials: currentCredentials,
			});

			// Debug: Check if redirectless mode (pi.flow) is enabled
			const isRedirectless = currentCredentials.responseMode === 'pi.flow' || currentCredentials.useRedirectless;
			if (isRedirectless) {
				console.log(
					`${MODULE_TAG} ✅ Redirectless mode (response_mode=pi.flow) is ENABLED - will generate URL first, then make POST request`
				);
			} else {
				console.log(
					`${MODULE_TAG} ⚠️ Standard redirect mode - will generate URL normally (response_mode=${credentials.responseMode || 'default'})`
				);
			}

			// Validate required fields
			if (!currentCredentials.redirectUri) {
				const errorMsg =
					'Redirect URI is required. Please go back to Step 0 and ensure the Redirect URI field is populated.';
				setError(errorMsg);
				setValidationErrors([errorMsg]);
				toastV8.error(errorMsg);
				// Clear any pre-flight validation state that might have been set
				setIsPreFlightValidating(false);
				setPreFlightStatus('');
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
					'PKCE codes are required but missing. Please go back to Step 0 (Configuration) and generate PKCE parameters in Advanced Options.';
				setError(errorMsg);
				setValidationErrors([errorMsg]);
				toastV8.error(errorMsg);
				// Clear any pre-flight validation state that might have been set
				setIsPreFlightValidating(false);
				setPreFlightStatus('');
				return;
			}

			// Pre-flight validation: Use service to validate before generating authorization URL
			setIsPreFlightValidating(true);
			setPreFlightStatus('🔍 Starting pre-flight validation...');
			setError(null);
			toastV8.info('🔍 Starting pre-flight validation...');

			let validationResult: {
				passed: boolean;
				errors: string[];
				warnings: string[];
				redirectUriValidated: boolean;
				oauthConfigValidated: boolean;
				redirectUris?: string[];
				fixableErrors?: Array<{
					errorIndex: number;
					errorType: string;
					errorMessage: string;
					fixable: boolean;
					fixDescription: string;
					fixData?: {
						redirectUri?: string;
						enablePKCE?: boolean;
						authMethod?: string;
						addScope?: string;
						responseType?: string;
					};
				}>;
				appConfig?: {
					tokenEndpointAuthMethod?: string;
					pkceEnforced?: boolean;
					pkceRequired?: boolean;
				};
			} | null = null;
			try {
				const { PreFlightValidationServiceV8 } = await import('@/v8/services/preFlightValidationServiceV8');
				const { workerTokenServiceV8 } = await import('@/v8/services/workerTokenServiceV8');
				
				setPreFlightStatus('🔑 Retrieving worker token...');
				let workerToken = await workerTokenServiceV8.getToken();
				
				// If no worker token, try silent retrieval (will ask for credentials if missing)
				if (!workerToken) {
					try {
						const { handleShowWorkerTokenModal } = await import('@/v8/utils/workerTokenModalHelperV8');
						// Attempt silent retrieval (will show modal if credentials are missing)
						await handleShowWorkerTokenModal(
							setShowWorkerTokenModal,
							undefined, // setTokenStatus
							true, // silentApiRetrieval - enable silent retrieval
							false, // showTokenAtEnd
							false, // forceShowModal - allow silent retrieval (will show modal if credentials needed)
							setIsLoading // setIsLoading - for spinner during silent retrieval
						);
						// Try again after silent retrieval attempt
						await new Promise(resolve => setTimeout(resolve, 500));
						workerToken = await workerTokenServiceV8.getToken();
					} catch (error) {
						console.warn(`${MODULE_TAG} Silent worker token retrieval failed:`, error);
						// Continue without worker token - validation will show warnings
					}
				}
				
				setPreFlightStatus('✅ Validating configuration against PingOne...');
				
				// Add timeout to prevent hanging (30 seconds max)
				const validationPromise = PreFlightValidationServiceV8.validateBeforeAuthUrl({
					specVersion,
					flowType,
					credentials: currentCredentials, // Use currentCredentials (may be updated by auto-fix)
					...(workerToken && { workerToken }),
				});
				
				const timeoutPromise = new Promise<never>((_, reject) => {
					setTimeout(() => reject(new Error('Pre-flight validation timed out after 30 seconds')), 30000);
				});
				
				validationResult = await Promise.race([validationPromise, timeoutPromise]);

				if (!validationResult) {
					throw new Error('Validation result is null');
				}

				console.log(`${MODULE_TAG} Pre-flight validation result:`, {
					passed: validationResult.passed,
					errorCount: validationResult.errors.length,
					warningCount: validationResult.warnings.length,
					hasErrors: validationResult.errors.length > 0,
					hasWarnings: validationResult.warnings.length > 0,
				});

				// Store validation result for display (include appConfig)
				setPreFlightValidationResult({
					passed: validationResult.passed,
					errors: validationResult.errors,
					warnings: validationResult.warnings,
					fixableErrors: validationResult.fixableErrors || [],
					...(validationResult.appConfig && { appConfig: validationResult.appConfig }),
				});

				// Build combined error and warning messages separately
				if (validationResult.errors.length > 0 || validationResult.warnings.length > 0) {
					// Errors: Block progression
					if (validationResult.errors.length > 0) {
						// Check if there are any fixable errors
						const fixableErrors = validationResult.fixableErrors || [];
						
						// If there are fixable errors, offer to fix them
						if (fixableErrors.length > 0) {
							const { uiNotificationServiceV8 } = await import('@/v8/services/uiNotificationServiceV8');
							
							// Build fix description message
							const fixDescriptions = fixableErrors.map(fe => `  • ${fe.fixDescription}`).join('\n');
							const fixableCount = fixableErrors.length;
							const totalErrors = validationResult.errors.length;
							const nonFixableCount = totalErrors - fixableCount;
							
							let message = `Found ${fixableCount} fixable error(s) out of ${totalErrors} total error(s).\n\n`;
							message += `The following can be automatically fixed:\n${fixDescriptions}\n\n`;
							if (nonFixableCount > 0) {
								message += `Note: ${nonFixableCount} error(s) cannot be auto-fixed and will need manual attention.\n\n`;
							}
							message += `Would you like to automatically fix all fixable errors?`;
							
							const confirmed = await uiNotificationServiceV8.confirm({
								title: '🔧 Fix All Errors?',
								message: message,
								confirmText: 'Yes, Fix All',
								cancelText: 'No, I\'ll Fix Manually',
								severity: 'warning',
							});
							
							if (confirmed) {
								// Apply all fixes
								const updatedCredentials = { ...currentCredentials };
								const fixesApplied: string[] = [];
								
								for (const fixableError of fixableErrors) {
									if (fixableError.fixData) {
										if (fixableError.fixData.redirectUri) {
											updatedCredentials.redirectUri = fixableError.fixData.redirectUri;
											fixesApplied.push(`Redirect URI: ${fixableError.fixData.redirectUri}`);
										}
										if (fixableError.fixData.enablePKCE) {
											updatedCredentials.usePKCE = true;
											fixesApplied.push('PKCE enabled');
										}
									if (fixableError.fixData.authMethod) {
										updatedCredentials.clientAuthMethod = fixableError.fixData.authMethod as 'none' | 'client_secret_basic' | 'client_secret_post' | 'client_secret_jwt' | 'private_key_jwt';
										fixesApplied.push(`Auth method: ${fixableError.fixData.authMethod}`);
									}
										if (fixableError.fixData.addScope) {
											const currentScopes = updatedCredentials.scopes || '';
											if (!currentScopes.includes(fixableError.fixData.addScope)) {
												updatedCredentials.scopes = currentScopes.trim()
													? `${currentScopes.trim()} ${fixableError.fixData.addScope}`
													: fixableError.fixData.addScope;
												fixesApplied.push(`Added scope: ${fixableError.fixData.addScope}`);
											}
										}
									if (fixableError.fixData.responseType) {
										updatedCredentials.responseType = fixableError.fixData.responseType as 'code' | 'token' | 'id_token' | 'code token' | 'code id_token' | 'token id_token' | 'code token id_token';
										fixesApplied.push(`Response type: ${fixableError.fixData.responseType}`);
									}
									}
								}
								
								// Save updated credentials to flow-specific storage (IndexedDB, localStorage, backend)
								const { CredentialsServiceV8 } = await import('@/v8/services/credentialsServiceV8');
								const flowKey = `${specVersion}-${flowType}-v8u`;
								// updatedCredentials is compatible with Credentials interface
								CredentialsServiceV8.saveCredentials(flowKey, updatedCredentials);
								
								// Also save shared credentials (environmentId, clientId, clientAuthMethod) to backup storage
								// This ensures fixes persist across all flows and browser restarts
								const { SharedCredentialsServiceV8 } = await import('@/v8/services/sharedCredentialsServiceV8');
								const sharedCreds = SharedCredentialsServiceV8.extractSharedCredentials(updatedCredentials);
								if (sharedCreds.environmentId || sharedCreds.clientId || sharedCreds.clientAuthMethod) {
									// Use sync version for immediate browser storage
									SharedCredentialsServiceV8.saveSharedCredentialsSync(sharedCreds);
									// Also save to disk asynchronously (non-blocking)
									SharedCredentialsServiceV8.saveSharedCredentials(sharedCreds).catch((err) => {
										console.warn(`[UnifiedFlowSteps] Background disk save failed (non-critical):`, err);
									});
								}
								
								// Update current credentials for URL generation
								currentCredentials = updatedCredentials;
								
								// Update parent component's credentials
								if (onCredentialsChange) {
									onCredentialsChange(updatedCredentials);
								}
								
								toastV8.success(`Fixed ${fixesApplied.length} error(s): ${fixesApplied.join(', ')}`);
								
								// Re-run validation with updated credentials
								setPreFlightStatus('🔍 Re-validating configuration...');
								toastV8.info('🔍 Re-validating after fixes...');
								const newValidationResult = await PreFlightValidationServiceV8.validateBeforeAuthUrl({
									specVersion,
									flowType,
									credentials: updatedCredentials,
									...(workerToken && { workerToken }),
								});
								
								// Update validation result state (include appConfig)
								setPreFlightValidationResult({
									passed: newValidationResult.passed,
									errors: newValidationResult.errors,
									warnings: newValidationResult.warnings,
									fixableErrors: newValidationResult.fixableErrors || [],
									...(newValidationResult.appConfig && { appConfig: newValidationResult.appConfig }),
								});
								
								// Update validation results
								if (newValidationResult.errors.length > 0) {
									const errorMessage = [
										'🔍 Pre-flight Validation Results:',
										'',
										'❌ ERRORS (must be fixed before proceeding):',
										...newValidationResult.errors.map(err => `  ${err}`),
										'',
										'🔧 How to Fix:',
										'1. Go to Step 0 (Configuration)',
										'2. Review and fix the errors listed above',
										'3. Try generating the authorization URL again',
										'',
										'⚠️ WARNING: If you proceed with errors, the authorization request will likely fail.'
									].join('\n');
									setError(errorMessage);
									setValidationErrors([errorMessage]);
									toastV8.error('Pre-flight validation failed - check error details below');
									setIsPreFlightValidating(false);
									setPreFlightStatus('');
									setIsLoading(false);
									setLoadingMessage('');
									return;
								} else if (newValidationResult.warnings.length > 0) {
									const warningMessage = [
										'🔍 Pre-flight Validation Results:',
										'',
										'⚠️ WARNINGS (you can still proceed):',
										...newValidationResult.warnings.map(warn => `  ${warn}`),
										'',
										'✅ You can continue with the flow, but be aware that some validations were skipped.'
									].join('\n');
									setValidationWarnings([warningMessage]);
									setValidationErrors([]);
									toastV8.warning('Pre-flight validation warnings - check details below');
									setIsPreFlightValidating(false);
									setPreFlightStatus('');
									// Continue with flow generation using updated credentials
								} else {
									// No errors or warnings - validation passed
									setValidationWarnings([]);
									setValidationErrors([]);
									toastV8.success(`✅ Pre-flight validation passed! Fixed ${fixesApplied.length} error(s).`);
									setIsPreFlightValidating(false);
									setPreFlightStatus('');
									// Continue with flow generation using updated credentials
								}
							} else {
								// User declined auto-fix, show error as normal
								const errorMessage = [
									'🔍 Pre-flight Validation Results:',
									'',
									'❌ ERRORS (must be fixed before proceeding):',
									...validationResult.errors.map(err => `  ${err}`),
									'',
									'🔧 How to Fix:',
									'1. Go to Step 0 (Configuration)',
									'2. Review and fix the errors listed above',
									'3. Try generating the authorization URL again',
									'',
									'⚠️ WARNING: If you proceed with errors, the authorization request will likely fail.'
								].join('\n');

								setError(errorMessage);
								setValidationErrors([errorMessage]);
								// Store validation result so "Fix All Errors" button is visible (include appConfig)
								setPreFlightValidationResult({
									passed: false,
									errors: validationResult.errors,
									warnings: validationResult.warnings,
									fixableErrors: validationResult.fixableErrors || [],
									...(validationResult.appConfig && { appConfig: validationResult.appConfig }),
								});
								toastV8.error('Pre-flight validation failed - check error details below');
								setIsPreFlightValidating(false);
								setPreFlightStatus('');
								setIsLoading(false);
								setLoadingMessage('');
								return;
							}
						} else {
							// Regular error handling (not redirect URI mismatch or no registered URIs available)
							const errorMessage = [
								'🔍 Pre-flight Validation Results:',
								'',
								'❌ ERRORS (must be fixed before proceeding):',
								...validationResult.errors.map(err => `  ${err}`),
								'',
								'🔧 How to Fix:',
								'1. Go to Step 0 (Configuration)',
								'2. Review and fix the errors listed above',
								'3. Try generating the authorization URL again',
								'',
								'⚠️ WARNING: If you proceed with errors, the authorization request will likely fail.'
							].join('\n');

							setError(errorMessage);
							setValidationErrors([errorMessage]);
							// Store validation result so "Fix All Errors" button is visible (include appConfig)
							setPreFlightValidationResult({
								passed: false,
								errors: validationResult.errors,
								warnings: validationResult.warnings,
								fixableErrors: validationResult.fixableErrors || [],
								...(validationResult.appConfig && { appConfig: validationResult.appConfig }),
							});
							toastV8.error('Pre-flight validation failed - check error details below');
							setIsPreFlightValidating(false);
							setPreFlightStatus('');
							setIsLoading(false);
							setLoadingMessage('');
							return;
						}
					}
					
					// Warnings only: Allow continuation, show with orange background
					if (validationResult.warnings.length > 0) {
						const warningMessage = [
							'🔍 Pre-flight Validation Results:',
							'',
							'⚠️ WARNINGS (you can still proceed):',
							...validationResult.warnings.map(warn => `  ${warn}`),
							'',
							'✅ You can continue with the flow, but be aware that some validations were skipped.'
						].join('\n');

						// Set warning (not error) - this will be displayed with orange background
						// Don't set error state for warnings - only set validation warnings
						setValidationWarnings([warningMessage]);
						toastV8.warning('⚠️ Pre-flight validation warnings - check details below');
						setIsPreFlightValidating(false);
						setPreFlightStatus('');
						// Continue with flow generation (don't return)
					} else {
						// No errors or warnings - validation passed
						toastV8.success('✅ Pre-flight validation passed!');
						setIsPreFlightValidating(false);
						setPreFlightStatus('');
						// Still show success message in validation results
						setValidationWarnings([]);
						setValidationErrors([]);
					}
				} else {
					// No errors and no warnings - validation passed completely
					console.log(`${MODULE_TAG} Pre-flight validation passed with no errors or warnings`);
					toastV8.success('✅ Pre-flight validation passed!');
					setValidationWarnings([]);
					setValidationErrors([]);
					setIsPreFlightValidating(false);
					setPreFlightStatus('');
					// Store success result for display (include appConfig if available)
					setPreFlightValidationResult({
						passed: true,
						errors: [],
						warnings: [],
						fixableErrors: [],
						...(validationResult?.appConfig && { appConfig: validationResult.appConfig }),
					});
				}
			} catch (validationError) {
				console.error(`${MODULE_TAG} ⚠️ Pre-flight validation error:`, validationError);
				const errorMessage = validationError instanceof Error ? validationError.message : 'Unknown error';
				if (errorMessage.includes('timed out')) {
					toastV8.error('Pre-flight validation timed out - continuing anyway');
				} else {
					toastV8.error('Pre-flight validation encountered an error - continuing anyway');
				}
				// Clear spinner and continue
				setIsPreFlightValidating(false);
				setPreFlightStatus('');
				setValidationWarnings([]);
				setValidationErrors([]);
				// Store error result for display
				setPreFlightValidationResult({
					passed: false,
					errors: [errorMessage],
					warnings: [],
					fixableErrors: [],
				});
				// Continue on validation error - don't block user
			} finally {
				// Ensure spinner is always cleared, even if something unexpected happens
				if (isPreFlightValidating) {
					console.warn(`${MODULE_TAG} ⚠️ Pre-flight validation spinner still active in finally block - clearing it`);
					setIsPreFlightValidating(false);
					setPreFlightStatus('');
				}
			}

			setLoadingMessage('🔗 Generating Authorization URL...');

			try {
				// For redirectless mode, first generate the authorization URL to show the user
				// Then make POST request when they click "Start Redirectless Authentication"
				if (isRedirectless) {
					// Generate authorization URL first (for display/educational purposes)
					// This shows what URL would be used in standard redirect mode
					const urlResult = await UnifiedFlowIntegrationV8U.generateAuthorizationUrl(
						specVersion,
						flowType,
						currentCredentials, // Use currentCredentials (may have been updated by auto-fix)
						flowState.codeVerifier && flowState.codeChallenge
							? {
									codeVerifier: flowState.codeVerifier,
									codeChallenge: flowState.codeChallenge,
									codeChallengeMethod: 'S256',
								}
							: undefined,
						preFlightValidationResult?.appConfig // Pass appConfig for JAR detection
					);

					// Store the authorization URL in flow state so it can be displayed
					const urlResultWithExtras = urlResult as {
						nonce?: string;
						codeVerifier?: string;
						codeChallenge?: string;
					};
					const updatedStateWithUrl: FlowState = {
						...flowState,
						authorizationUrl: urlResult.authorizationUrl,
						state: urlResult.state,
						...(urlResultWithExtras.nonce && { nonce: urlResultWithExtras.nonce }),
						// Preserve existing PKCE codes if they were provided
						...(urlResultWithExtras.codeVerifier &&
							!flowState.codeVerifier && { codeVerifier: urlResultWithExtras.codeVerifier }),
						...(urlResultWithExtras.codeChallenge &&
							!flowState.codeChallenge && { codeChallenge: urlResultWithExtras.codeChallenge }),
					};
					setFlowState(updatedStateWithUrl);

					console.log(
						`${MODULE_TAG} 🔌 Authorization URL generated for redirectless flow (display only):`,
						{
							url: `${urlResult.authorizationUrl.substring(0, 100)}...`,
							hasState: !!urlResult.state,
						}
					);

					toastV8.authUrlGenerated();
					setIsLoading(false);
					// Don't make POST request yet - wait for user to click "Start Redirectless Authentication"
					return;
				}

				// Standard mode: Generate authorization URL
				// For flows that use PKCE (oauth-authz, hybrid), use existing PKCE codes from flowState
				// For implicit flow, PKCE is not used
				// Load PKCE codes from storage to get the correct codeChallengeMethod
				let pkceCodesForUrl: { codeVerifier: string; codeChallenge: string; codeChallengeMethod: 'S256' | 'plain' } | undefined;
				if (flowState.codeVerifier && flowState.codeChallenge) {
					// Try to load from storage first to check if stored codes have 'plain' method (old version)
					const storedPKCE = PKCEStorageServiceV8U.loadPKCECodes(flowKey);
					// CRITICAL: Always use 'S256' - if stored codes have 'plain', they're from an old version and should be regenerated
					// Using 'plain' would cause PKCE mismatch errors during token exchange
					if (storedPKCE?.codeChallengeMethod && storedPKCE.codeChallengeMethod !== 'S256') {
						console.warn(
							`${MODULE_TAG} ⚠️ Stored PKCE codes have codeChallengeMethod='${storedPKCE.codeChallengeMethod}' instead of 'S256'. ` +
							`Using 'S256' for authorization URL. If you get PKCE mismatch errors, please regenerate PKCE codes in Step 1.`
						);
					}
					const codeChallengeMethod = 'S256' as const;
					pkceCodesForUrl = {
						codeVerifier: flowState.codeVerifier,
						codeChallenge: flowState.codeChallenge,
						codeChallengeMethod,
					};
				}
				const result = await UnifiedFlowIntegrationV8U.generateAuthorizationUrl(
					specVersion,
					flowType,
					currentCredentials, // Use currentCredentials (may have been updated by auto-fix)
					pkceCodesForUrl,
					preFlightValidationResult?.appConfig // Pass appConfig for JAR detection
				);

				const resultWithExtras = result as {
					nonce?: string;
					codeVerifier?: string;
					codeChallenge?: string;
					parRequestUri?: string;
					parExpiresIn?: number;
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
					// PAR information
					...(resultWithExtras.parRequestUri && { parRequestUri: resultWithExtras.parRequestUri }),
					...(resultWithExtras.parExpiresIn && { parExpiresIn: resultWithExtras.parExpiresIn }),
				};
				setFlowState(updatedState);
				// DON'T auto-mark step complete - user should click "Authenticate on PingOne" first
				// nav.markStepComplete(); // REMOVED - user should manually proceed after authentication
				toastV8.authUrlGenerated();
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Failed to generate authorization URL';
				setError(message);
				setValidationErrors([message]);
				toastV8.error(message);
			} finally {
				// CRITICAL: Always clear both loading states in finally block
				setIsPreFlightValidating(false);
				setPreFlightStatus('');
				setIsLoading(false);
				setLoadingMessage('');
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
				<style>{`
					@keyframes spin {
						from { transform: rotate(0deg); }
						to { transform: rotate(360deg); }
					}
				`}</style>
				<h2>{stepTitle}</h2>
				<p style={{ marginBottom: '24px', color: '#6b7280' }}>
					Generate the authorization URL to redirect the user to authenticate.
				</p>

				{/* Pre-flight validation status section */}
				{(isPreFlightValidating || preFlightStatus) && (
					<div
						style={{
							padding: '16px',
							background: '#eff6ff',
							border: '1px solid #3b82f6',
							borderRadius: '8px',
							marginBottom: '24px',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
							{isPreFlightValidating && (
								<div
									style={{
										width: '20px',
										height: '20px',
										border: '3px solid #3b82f6',
										borderTop: '3px solid transparent',
										borderRadius: '50%',
										animation: 'spin 1s linear infinite',
									}}
								/>
							)}
							<span style={{ fontSize: '20px', flexShrink: 0 }}>
								{isPreFlightValidating ? '🔍' : '✅'}
							</span>
							<div style={{ flex: 1 }}>
								<strong
									style={{
										color: '#1e40af',
										fontSize: '15px',
										display: 'block',
										marginBottom: '4px',
									}}
								>
									Pre-flight Validation Status
								</strong>
								<div
									style={{
										color: '#1e3a8a',
										fontSize: '14px',
										lineHeight: '1.6',
									}}
								>
									{preFlightStatus || (isPreFlightValidating ? 'Validating configuration...' : '')}
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Display validation warnings with orange background (non-blocking) */}
				{validationWarnings.length > 0 && (
					<div
						style={{
							padding: '16px',
							background: '#fff7ed',
							border: '1px solid #fb923c',
							borderRadius: '8px',
							marginBottom: '24px',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
							<span style={{ fontSize: '20px', flexShrink: 0 }}>⚠️</span>
							<div style={{ flex: 1 }}>
								<strong style={{ color: '#c2410c', fontSize: '15px', display: 'block', marginBottom: '8px' }}>
									Pre-flight Validation Warnings
								</strong>
								<div style={{ color: '#9a3412', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
									{validationWarnings.map((warning, idx) => (
										<div key={idx} style={{ marginBottom: idx < validationWarnings.length - 1 ? '8px' : '0' }}>
											{warning}
										</div>
									))}
								</div>
								{/* Check if any warning mentions worker token - show Get Worker Token button */}
								{validationWarnings.some(warn => warn.toLowerCase().includes('worker token is not available')) && (
									<div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
										<button
											type="button"
											onClick={async () => {
												try {
													setIsLoading(true);
													setLoadingMessage('🔑 Retrieving Worker Token...');
													
													// Import worker token modal helper
													const { handleShowWorkerTokenModal } = await import('@/v8/utils/workerTokenModalHelperV8');
													const { WorkerTokenStatusServiceV8 } = await import('@/v8/services/workerTokenStatusServiceV8');
													
													// Attempt silent retrieval (silentApiRetrieval=true, forceShowModal=false)
													await handleShowWorkerTokenModal(
														setShowWorkerTokenModal,
														undefined, // setTokenStatus
														true, // silentApiRetrieval - enable silent retrieval
														false, // showTokenAtEnd
														false, // forceShowModal - allow silent retrieval
														setIsLoading // setIsLoading - for spinner during silent retrieval
													);
													
													// Wait a moment for token to be saved, then check if token is now available
													await new Promise(resolve => setTimeout(resolve, 500));
													const tokenStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
													if (tokenStatus.isValid) {
														toastV8.success('Worker token retrieved successfully');
														
														// Re-run pre-flight validation
														setLoadingMessage('🔍 Re-validating Configuration...');
														const { PreFlightValidationServiceV8 } = await import('@/v8/services/preFlightValidationServiceV8');
														const { workerTokenServiceV8 } = await import('@/v8/services/workerTokenServiceV8');
														
														const newWorkerToken = await workerTokenServiceV8.getToken();
														const newValidationResult = await PreFlightValidationServiceV8.validateBeforeAuthUrl({
															specVersion,
															flowType,
															credentials,
															...(newWorkerToken && { workerToken: newWorkerToken }),
														});
														
														// Update preFlightValidationResult state (CRITICAL: include fixableErrors and appConfig for Fix button)
														setPreFlightValidationResult({
															passed: newValidationResult.passed,
															errors: newValidationResult.errors,
															warnings: newValidationResult.warnings,
															fixableErrors: newValidationResult.fixableErrors || [],
															...(newValidationResult.appConfig && { appConfig: newValidationResult.appConfig }),
														});
														
														// Update validation results
														if (newValidationResult.errors.length > 0) {
															const errorMessage = [
																'🔍 Pre-flight Validation Results:',
																'',
																'❌ ERRORS (must be fixed before proceeding):',
																...newValidationResult.errors.map(err => `  ${err}`),
																'',
																'🔧 How to Fix:',
																'1. Go to Step 0 (Configuration)',
																'2. Review and fix the errors listed above',
																'3. Try generating the authorization URL again',
																'',
																'⚠️ WARNING: If you proceed with errors, the authorization request will likely fail.'
															].join('\n');
															setError(errorMessage);
															setValidationErrors([errorMessage]);
															setValidationWarnings([]);
															toastV8.error('Pre-flight validation failed - check error details below');
														} else if (newValidationResult.warnings.length > 0) {
															const warningMessage = [
																'🔍 Pre-flight Validation Results:',
																'',
																'⚠️ WARNINGS (you can still proceed):',
																...newValidationResult.warnings.map(warn => `  ${warn}`),
																'',
																'✅ You can continue with the flow, but be aware that some validations were skipped.'
															].join('\n');
															setValidationWarnings([warningMessage]);
															setValidationErrors([]);
															toastV8.warning('Pre-flight validation warnings - check details below');
														} else {
															// No errors or warnings - validation passed
															setValidationWarnings([]);
															setValidationErrors([]);
															toastV8.success('Pre-flight validation passed!');
														}
													} else {
														// Token still not available - user may have cancelled modal or silent retrieval failed
														// If modal is not showing, silent retrieval failed and user needs to add token manually
														// If modal is showing, user will handle it in the modal's onClose callback
														// Don't show warning here - let the modal handle it
													}
												} catch (error) {
													console.error(`${MODULE_TAG} Error retrieving worker token:`, error);
													toastV8.error('Failed to retrieve worker token. Please try again.');
												} finally {
													setIsLoading(false);
													setLoadingMessage('');
												}
											}}
											disabled={isLoading}
											style={{
												padding: '8px 16px',
												background: '#fb923c',
												border: 'none',
												borderRadius: '6px',
												color: 'white',
												fontSize: '14px',
												fontWeight: '500',
												cursor: isLoading ? 'not-allowed' : 'pointer',
												opacity: isLoading ? 0.6 : 1,
												display: 'inline-flex',
												alignItems: 'center',
												gap: '6px',
											}}
										>
											{isLoading ? (
												<>
													<span>⏳</span>
													<span>Retrieving...</span>
												</>
											) : (
												<>
													<span>🔑</span>
													<span>Get Worker Token</span>
												</>
											)}
										</button>
									</div>
								)}
								<p style={{ margin: '12px 0 0 0', fontSize: '13px', color: '#c2410c', fontWeight: '500' }}>
									✅ You can continue with the flow, but be aware that some validations were skipped.
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Implicit Flow Educational Sections (only for implicit flow) */}
				{flowType === 'implicit' && (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => setImplicitOverviewCollapsed(!implicitOverviewCollapsed)}
								aria-expanded={!implicitOverviewCollapsed}
							>
								<CollapsibleTitle>
									<FiBook /> What is Implicit Flow?
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={implicitOverviewCollapsed}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!implicitOverviewCollapsed && (
								<CollapsibleContent>
					<InfoBox $variant="info">
						<FiInfo size={20} />
						<div>
							<InfoTitle>OAuth 2.0 / OIDC Implicit Flow - Educational Purpose</InfoTitle>
							<InfoText>
								<strong>This flow is included for educational purposes.</strong> The Implicit Flow (RFC 6749 Section 4.2) is 
								<strong> deprecated in OAuth 2.1</strong> (draft) and should not be used for new applications. 
								However, it is <strong>still valid in OAuth 2.0 and OIDC Core 1.0</strong> specifications.
								<br /><br />
								<strong>Important:</strong> To use this flow, you must enable the <strong>Implicit grant type</strong> in your PingOne application settings. 
								If not enabled, PingOne will reject the authorization request.
							</InfoText>
						</div>
					</InfoBox>

					<InfoBox $variant="success">
						<FiCheckCircle size={20} />
						<div>
							<InfoTitle>How Implicit Flow Works</InfoTitle>
							<InfoText>
								In the Implicit Flow, tokens are returned directly in the URL fragment
								after user authorization. The client never receives an authorization code;
								instead, the access token (and optionally ID token) is returned
								immediately in the redirect URI fragment. This was designed for SPAs that
								couldn't use a backend, but Authorization Code + PKCE is now the recommended approach.
							</InfoText>
						</div>
					</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => setImplicitDetailsCollapsed(!implicitDetailsCollapsed)}
								aria-expanded={!implicitDetailsCollapsed}
							>
								<CollapsibleTitle>
									<FiBook /> Security Considerations & Modern Alternatives
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={implicitDetailsCollapsed}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!implicitDetailsCollapsed && (
								<CollapsibleContent>
									<InfoBox $variant="warning">
										<FiAlertCircle size={20} />
										<div>
											<InfoTitle>Implicit Flow Security Considerations</InfoTitle>
											<InfoList>
												<li>
													<strong>Token Exposure:</strong> Tokens are exposed in the URL fragment,
													which can be logged in browser history, server logs, or shared URLs
												</li>
												<li>
													<strong>No Refresh Tokens:</strong> Implicit flow cannot return refresh
													tokens, requiring users to re-authenticate frequently
												</li>
												<li>
													<strong>Limited Security:</strong> No PKCE support, making it vulnerable to
													authorization code interception attacks
												</li>
												<li>
													<strong>OAuth 2.1 Authorization Framework (draft) Deprecation:</strong> Removed from OAuth 2.1 Authorization Framework (IETF draft-ietf-oauth-v2-1) due to security concerns. Note: OAuth 2.1 is still an Internet-Draft, not yet an RFC.
												</li>
											</InfoList>
										</div>
									</InfoBox>

									<InfoBox $variant="success">
										<FiCheckCircle size={20} />
										<div>
											<InfoTitle>Modern Alternative: PKCE with Authorization Code Flow</InfoTitle>
											<InfoText>
												For single-page applications (SPAs) and browser-based apps, use the
												Authorization Code Flow with PKCE instead of Implicit Flow. This provides:
											</InfoText>
											<InfoList>
												<li>
													<strong>Better Security:</strong> Tokens never appear in URLs, PKCE
													prevents code interception
												</li>
												<li>
													<strong>Refresh Tokens:</strong> Can obtain refresh tokens for long-lived
													sessions
												</li>
												<li>
													<strong>OAuth 2.1 Authorization Framework (draft) Compliant:</strong> Recommended approach in current
													specifications. When combined with OpenID Connect Core 1.0, this means "OIDC Core 1.0 using Authorization Code + PKCE (OAuth 2.1 (draft) baseline)".
												</li>
												<li>
													<strong>Same Use Case:</strong> Works perfectly for SPAs and public
													clients
												</li>
											</InfoList>
										</div>
									</InfoBox>

									<InfoBox $variant="warning">
										<FiAlertCircle size={20} />
										<div>
											<InfoTitle>⚙️ PingOne Configuration Required</InfoTitle>
											<InfoText>
												<strong>Before using this flow:</strong> Ensure the <strong>Implicit grant type</strong> is enabled 
												in your PingOne application configuration:
											</InfoText>
											<InfoList style={{ fontSize: '13px', marginTop: '8px' }}>
												<li>Log into PingOne Admin Console</li>
												<li>Go to Applications → Your Application → Configuration</li>
												<li>Under Grant Types, enable <strong>Implicit</strong></li>
												<li>Ensure your Redirect URI is registered: <code style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: '3px' }}>{credentials.redirectUri || `${window.location.origin}/authz-callback`}</code></li>
												<li>Save changes</li>
											</InfoList>
											<InfoText style={{ marginTop: '12px', color: '#dc2626', fontWeight: 600 }}>
												❌ <strong>If Implicit is not enabled:</strong> PingOne will reject the request with a "grant type not enabled" or "deprecated" message.
											</InfoText>
										</div>
									</InfoBox>

									<InfoBox $variant="info">
										<FiInfo size={20} />
										<div>
											<InfoTitle>When to Use Implicit Flow (Educational Purpose)</InfoTitle>
											<InfoList>
												<li>
													<strong>Legacy SPAs:</strong> Existing applications that haven't migrated
													yet
												</li>
												<li>
													<strong>Educational Purposes:</strong> Understanding deprecated patterns,
													OAuth history, and why Authorization Code + PKCE is now preferred
												</li>
												<li>
													<strong>Learning:</strong> Comparing security models between old and new approaches
												</li>
											</InfoList>
											<InfoText style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
												<strong>Note:</strong> This flow is <strong>deprecated in OAuth 2.1</strong> (draft) but 
												<strong> still valid in OAuth 2.0 and OIDC Core 1.0</strong>. 
												For all new applications, use Authorization Code Flow with PKCE instead.
											</InfoText>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>
					</>
				)}

				{/* Authorization Code Flow Educational Sections (only for authorization code flow) */}
				{flowType === 'oauth-authz' && (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => setAuthzCodeOverviewCollapsed(!authzCodeOverviewCollapsed)}
								aria-expanded={!authzCodeOverviewCollapsed}
							>
								<CollapsibleTitle>
									<FiBook /> What is Authorization Code Flow?
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={authzCodeOverviewCollapsed}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!authzCodeOverviewCollapsed && (
								<CollapsibleContent>
									<InfoBox $variant="success">
										<FiCheckCircle size={20} />
										<div>
											<InfoTitle>Recommended OAuth 2.0 Flow</InfoTitle>
											<InfoText>
												The Authorization Code Flow (RFC 6749 Section 4.1) is the most secure and
												recommended OAuth 2.0 flow for web applications, single-page applications (SPAs),
												and mobile apps. It's the standard flow used by modern OAuth implementations
												and is required for OAuth 2.1 / OIDC 2.1 compliance.
											</InfoText>
										</div>
									</InfoBox>

									<InfoBox $variant="info">
										<FiInfo size={20} />
										<div>
											<InfoTitle>How Authorization Code Flow Works</InfoTitle>
											<InfoText>
												The Authorization Code Flow is a two-step process that separates the
												authorization request from the token exchange. This design prevents tokens from
												being exposed in URLs or browser history.
											</InfoText>
											<InfoList>
												<li>
													<strong>Step 1:</strong> User is redirected to PingOne's authorization
													server where they authenticate and consent
												</li>
												<li>
													<strong>Step 2:</strong> PingOne redirects back with an authorization code
													(not tokens)
												</li>
												<li>
													<strong>Step 3:</strong> Your application exchanges the code for tokens
													using a secure back-channel request with your client secret
												</li>
											</InfoList>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => setAuthzCodeDetailsCollapsed(!authzCodeDetailsCollapsed)}
								aria-expanded={!authzCodeDetailsCollapsed}
							>
								<CollapsibleTitle>
									<FiBook /> Security Features & Best Practices
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={authzCodeDetailsCollapsed}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!authzCodeDetailsCollapsed && (
								<CollapsibleContent>
									<InfoBox $variant="success">
										<FiShield size={20} />
										<div>
											<InfoTitle>Why Authorization Code Flow is Secure</InfoTitle>
											<InfoList>
												<li>
													<strong>No Tokens in URLs:</strong> Tokens are never exposed in browser
													history, server logs, or shared URLs
												</li>
												<li>
													<strong>PKCE Support:</strong> Can use PKCE (Proof Key for Code Exchange)
													for additional security, especially for public clients
												</li>
												<li>
													<strong>Refresh Tokens:</strong> Supports refresh tokens for long-lived
													sessions (with offline_access scope)
												</li>
												<li>
													<strong>Client Secret Protection:</strong> Client secret is only used in
													secure back-channel token exchange, never in browser
												</li>
												<li>
													<strong>OAuth 2.1 / OIDC 2.1 Compliant:</strong> This is the recommended
													flow in current specifications
												</li>
											</InfoList>
										</div>
									</InfoBox>

									<InfoBox $variant="info">
										<FiInfo size={20} />
										<div>
											<InfoTitle>PingOne-Specific Requirements</InfoTitle>
											<InfoList>
												<li>
													<strong>openid Scope:</strong> PingOne requires the <code>openid</code> scope
													even for pure OAuth 2.0 flows when using OIDC-enabled applications
												</li>
												<li>
													<strong>PKCE Recommended:</strong> While optional in OAuth 2.0, PingOne
													recommends using PKCE for all public clients (SPAs, mobile apps)
												</li>
												<li>
													<strong>Token Endpoint Authentication:</strong> Supports multiple methods:
													client_secret_basic, client_secret_post, client_secret_jwt, private_key_jwt
												</li>
												<li>
													<strong>Exact Redirect URI Match:</strong> The redirect_uri in the
													authorization request must exactly match what's registered in PingOne
												</li>
											</InfoList>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>
					</>
				)}

				{/* Hybrid Flow Educational Sections (only for hybrid flow) */}
				{flowType === 'hybrid' && (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => setHybridOverviewCollapsed(!hybridOverviewCollapsed)}
								aria-expanded={!hybridOverviewCollapsed}
							>
								<CollapsibleTitle>
									<FiBook /> What is Hybrid Flow?
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={hybridOverviewCollapsed}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!hybridOverviewCollapsed && (
								<CollapsibleContent>
									<InfoBox $variant="info">
										<FiInfo size={20} />
										<div>
											<InfoTitle>Hybrid Flow Overview</InfoTitle>
											<InfoText>
												The Hybrid Flow (OpenID Connect Core 1.0 Section 3.3) combines elements of
												both Authorization Code Flow and Implicit Flow. It's designed for OIDC flows
												where you need immediate access to an ID token while still maintaining the
												security benefits of the Authorization Code Flow.
											</InfoText>
										</div>
									</InfoBox>

									<InfoBox $variant="success">
										<FiCheckCircle size={20} />
										<div>
											<InfoTitle>How Hybrid Flow Works</InfoTitle>
											<InfoText>
												Hybrid Flow uses a <code>response_type</code> that includes both <code>code</code>{' '}
												and <code>id_token</code>, allowing some tokens to be returned immediately in
												the front channel (URL fragment or query) while others are obtained via secure
												back-channel exchange.
											</InfoText>
											<InfoList>
												<li>
													<strong>Step 1:</strong> User is redirected to PingOne's authorization
													server with <code>response_type=code id_token</code>
												</li>
												<li>
													<strong>Step 2:</strong> PingOne redirects back with both an authorization
													code AND an ID token (in URL fragment or query, depending on response_mode)
												</li>
												<li>
													<strong>Step 3:</strong> Your application can use the ID token immediately
													for user identification
												</li>
												<li>
													<strong>Step 4:</strong> Your application exchanges the authorization code
													for access token and refresh token via secure back-channel
												</li>
											</InfoList>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => setHybridDetailsCollapsed(!hybridDetailsCollapsed)}
								aria-expanded={!hybridDetailsCollapsed}
							>
								<CollapsibleTitle>
									<FiBook /> Hybrid Flow vs Authorization Code Flow
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={hybridDetailsCollapsed}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!hybridDetailsCollapsed && (
								<CollapsibleContent>
									<InfoBox $variant="info">
										<FiInfo size={20} />
										<div>
											<InfoTitle>Key Similarities</InfoTitle>
											<InfoList>
												<li>
													<strong>Same Security Model:</strong> Both use authorization code exchange
													for access tokens
												</li>
												<li>
													<strong>PKCE Support:</strong> Both support PKCE for enhanced security
												</li>
												<li>
													<strong>Refresh Tokens:</strong> Both support refresh tokens (with
													offline_access scope)
												</li>
												<li>
													<strong>Client Secret Protection:</strong> Both use secure back-channel
													for token exchange
												</li>
											</InfoList>
										</div>
									</InfoBox>

									<InfoBox $variant="warning">
										<FiAlertCircle size={20} />
										<div>
											<InfoTitle>Key Differences</InfoTitle>
											<InfoList>
												<li>
													<strong>Response Type:</strong> Hybrid uses <code>code id_token</code> while
													Authorization Code uses <code>code</code>
												</li>
												<li>
													<strong>Immediate ID Token:</strong> Hybrid returns ID token immediately in
													URL fragment/query, while Authorization Code requires token exchange first
												</li>
												<li>
													<strong>Use Case:</strong> Hybrid is useful when you need immediate user
													identification (ID token) while still getting access/refresh tokens securely
												</li>
												<li>
													<strong>OIDC Only:</strong> Hybrid Flow is an OIDC-specific flow (requires
													OIDC Core 1.0 specification)
												</li>
											</InfoList>
										</div>
									</InfoBox>

									<InfoBox $variant="success">
										<FiShield size={20} />
										<div>
											<InfoTitle>When to Use Hybrid Flow</InfoTitle>
											<InfoList>
												<li>
													<strong>OIDC Flows:</strong> When you need both user authentication (ID token)
													and API authorization (access token)
												</li>
												<li>
													<strong>Immediate User Info:</strong> When you need to identify the user
													immediately without waiting for token exchange
												</li>
												<li>
													<strong>SPAs with OIDC:</strong> Single-page applications that need ID token
													for user session management
												</li>
											</InfoList>
											<InfoText style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
												<strong>Note:</strong> For most use cases, Authorization Code Flow with PKCE is
												sufficient. Use Hybrid Flow only when you specifically need immediate ID token
												access.
											</InfoText>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>
					</>
				)}

				{/* Authorization URL Educational Sections (for authz, hybrid, and implicit flows) */}
				<CollapsibleSection>
					<CollapsibleHeaderButton
						onClick={() => setAuthRequestOverviewCollapsed(!authRequestOverviewCollapsed)}
						aria-expanded={!authRequestOverviewCollapsed}
					>
						<CollapsibleTitle>
							<FiBook /> Understanding Authorization Requests
						</CollapsibleTitle>
						<CollapsibleToggleIcon $collapsed={authRequestOverviewCollapsed}>
							<FiChevronDown />
						</CollapsibleToggleIcon>
					</CollapsibleHeaderButton>
					{!authRequestOverviewCollapsed && (
						<CollapsibleContent>
							<InfoBox $variant="info">
								<FiGlobe size={20} />
								<div>
									<InfoTitle>What is an Authorization Request?</InfoTitle>
									<InfoText>
										An authorization request redirects users to PingOne's authorization server
										where they authenticate and consent to sharing their information with your
										application. This is the first step in obtaining an authorization code.
									</InfoText>
								</div>
							</InfoBox>

							<InfoBox $variant="warning">
								<FiAlertCircle size={20} />
								<div>
									<InfoTitle>Critical Security Considerations</InfoTitle>
									<InfoList>
										<li>
											<strong>State Parameter:</strong> Always include a unique state parameter
											to prevent CSRF attacks
										</li>
										<li>
											<strong>HTTPS Only:</strong> Authorization requests must use HTTPS in
											production
										</li>
										<li>
											<strong>Validate Redirect URI:</strong> Ensure redirect_uri exactly
											matches what's registered in PingOne
										</li>
										<li>
											<strong>Scope Limitation:</strong> Only request the minimum scopes your
											application needs
										</li>
									</InfoList>
								</div>
							</InfoBox>
						</CollapsibleContent>
					)}
				</CollapsibleSection>

				<CollapsibleSection>
					<CollapsibleHeaderButton
						onClick={() => setAuthRequestDetailsCollapsed(!authRequestDetailsCollapsed)}
						aria-expanded={!authRequestDetailsCollapsed}
					>
						<CollapsibleTitle>
							<FiBook /> Authorization URL Parameters Deep Dive
						</CollapsibleTitle>
						<CollapsibleToggleIcon $collapsed={authRequestDetailsCollapsed}>
							<FiChevronDown />
						</CollapsibleToggleIcon>
					</CollapsibleHeaderButton>
					{!authRequestDetailsCollapsed && (
						<CollapsibleContent>
							<ParameterGrid>
								<InfoBox $variant="info">
									<FiKey size={20} />
									<div>
										<InfoTitle>Required Parameters</InfoTitle>
										<InfoList>
											<li>
												<strong>response_type:</strong>{' '}
												{flowType === 'implicit'
													? 'Must be "token" for implicit flow (tokens returned in fragment)'
													: flowType === 'hybrid'
														? 'Must be "code id_token" for hybrid flow (code + ID token)'
														: 'Must be "code" for authorization code flow'}
											</li>
											<li>
												<strong>client_id:</strong> Your application's unique identifier in
												PingOne
											</li>
											<li>
												<strong>redirect_uri:</strong> Exact URL where PingOne sends the user
												back after authorization
											</li>
											<li>
												<strong>scope:</strong> Permissions you're requesting (openid, profile,
												email, etc.)
											</li>
										</InfoList>
									</div>
								</InfoBox>

								<InfoBox $variant="success">
									<FiShield size={20} />
									<div>
										<InfoTitle>Security Parameters</InfoTitle>
										<InfoList>
											<li>
												<strong>state:</strong> Random value to prevent CSRF attacks and
												maintain session state
											</li>
											{(flowType === 'oauth-authz' || flowType === 'hybrid') && (
												<>
													<li>
														<strong>code_challenge:</strong> PKCE parameter for secure code exchange
													</li>
													<li>
														<strong>code_challenge_method:</strong> Always "S256" for SHA256 hashing
													</li>
												</>
											)}
											{(flowType === 'hybrid' || (flowType === 'oauth-authz' && specVersion === 'oidc')) && (
												<li>
													<strong>nonce:</strong> Random value to prevent replay attacks on ID tokens
												</li>
											)}
										</InfoList>
									</div>
								</InfoBox>
							</ParameterGrid>

							<InfoBox $variant="warning">
								<FiAlertCircle size={20} />
								<div>
									<InfoTitle>Optional But Recommended Parameters</InfoTitle>
									<InfoList>
										<li>
											<strong>prompt:</strong> Controls authentication behavior (none, login,
											consent, select_account)
										</li>
										<li>
											<strong>max_age:</strong> Maximum age of authentication session before
											re-auth required
										</li>
										<li>
											<strong>acr_values:</strong> Requested Authentication Context Class
											Reference values
										</li>
										<li>
											<strong>login_hint:</strong> Hint about the user identifier (email,
											username)
										</li>
									</InfoList>
								</div>
							</InfoBox>
						</CollapsibleContent>
					)}
				</CollapsibleSection>

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

			{/* Pre-flight Validation Results Section - Positioned before Action Section */}
			{preFlightValidationResult && (
				<CollapsibleSection style={{ marginBottom: '24px' }}>
					<CollapsibleHeaderButton
						onClick={() => setPreflightValidationCollapsed(!preflightValidationCollapsed)}
						aria-expanded={!preflightValidationCollapsed}
						style={{
							background: preFlightValidationResult.errors.length > 0
								? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
								: preFlightValidationResult.warnings.length > 0
									? 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)'
									: 'linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%)',
							color:
								preFlightValidationResult.errors.length > 0
									? '#991b1b'
									: preFlightValidationResult.warnings.length > 0
										? '#c2410c'
										: '#166534',
						}}
					>
						<CollapsibleTitle>
							<span style={{ fontSize: '20px', marginRight: '8px' }}>
								{preFlightValidationResult.errors.length > 0
									? '❌'
									: preFlightValidationResult.warnings.length > 0
										? '⚠️'
										: '✅'}
							</span>
							🔍 Pre-flight Validation Results
							{preFlightValidationResult.errors.length > 0 && (
								<span style={{ marginLeft: '8px', fontSize: '0.9em' }}>
									({preFlightValidationResult.errors.length} error{preFlightValidationResult.errors.length !== 1 ? 's' : ''})
								</span>
							)}
							{preFlightValidationResult.errors.length === 0 && preFlightValidationResult.warnings.length > 0 && (
								<span style={{ marginLeft: '8px', fontSize: '0.9em' }}>
									({preFlightValidationResult.warnings.length} warning{preFlightValidationResult.warnings.length !== 1 ? 's' : ''})
								</span>
							)}
						</CollapsibleTitle>
						<CollapsibleToggleIcon $collapsed={preflightValidationCollapsed}>
							<FiChevronDown />
						</CollapsibleToggleIcon>
					</CollapsibleHeaderButton>
					{!preflightValidationCollapsed && (
						<CollapsibleContent>
							{/* Same content as in renderStep0 - errors, warnings, fix button */}
							{preFlightValidationResult.errors.length > 0 && (
								<div style={{ marginBottom: '16px' }}>
									<strong style={{ color: '#dc2626', fontSize: '15px', display: 'block', marginBottom: '8px' }}>
										❌ ERRORS (must be fixed before continuing):
									</strong>
									<ul style={{ margin: 0, paddingLeft: '24px', color: '#991b1b' }}>
										{preFlightValidationResult.errors.map((error, index) => (
											<li key={index} style={{ marginBottom: '8px', lineHeight: '1.6' }}>
												{error}
											</li>
										))}
									</ul>
								</div>
							)}
							{preFlightValidationResult.warnings.length > 0 && (
								<div style={{ marginBottom: '16px' }}>
									<strong style={{ color: '#ea580c', fontSize: '15px', display: 'block', marginBottom: '8px' }}>
										⚠️ WARNINGS (you can still proceed):
									</strong>
									<ul style={{ margin: 0, paddingLeft: '24px', color: '#c2410c' }}>
										{preFlightValidationResult.warnings.map((warning, index) => (
											<li key={index} style={{ marginBottom: '8px', lineHeight: '1.6' }}>
												{warning}
											</li>
										))}
									</ul>
								</div>
							)}
							{preFlightValidationResult.fixableErrors && preFlightValidationResult.fixableErrors.length > 0 && (
								<button
									type="button"
									onClick={async () => {
										try {
											setIsLoading(true);
											setLoadingMessage('🔧 Fixing errors...');
											
											const { uiNotificationServiceV8 } = await import('@/v8/services/uiNotificationServiceV8');
											const { CredentialsServiceV8 } = await import('@/v8/services/credentialsServiceV8');
											const { SharedCredentialsServiceV8 } = await import('@/v8/services/sharedCredentialsServiceV8');
											
											const fixableErrors = preFlightValidationResult.fixableErrors || [];
											const fixDescriptions = fixableErrors.map(fe => fe.fix || 'Fix error').join('\n  • ');
											const fixableCount = fixableErrors.length;
											
											const confirmed = await uiNotificationServiceV8.confirm({
												title: '🔧 Fix All Errors?',
												message: `Found ${fixableCount} fixable error(s).\n\nThe following will be fixed:\n  • ${fixDescriptions}\n\nWould you like to automatically fix all fixable errors?`,
												confirmText: 'Yes, Fix All',
												cancelText: 'No, I\'ll Fix Manually',
												severity: 'warning',
											});
											
											if (confirmed) {
												const updatedCredentials = { ...credentials };
												const fixesApplied: string[] = [];
												
												for (const fixableError of fixableErrors) {
													if (fixableError.autoFix) {
														if (fixableError.autoFix.redirectUri) {
															updatedCredentials.redirectUri = fixableError.autoFix.redirectUri;
															fixesApplied.push(`Redirect URI: ${fixableError.autoFix.redirectUri}`);
														}
														if (fixableError.autoFix.enablePKCE) {
															updatedCredentials.usePKCE = true;
															fixesApplied.push('PKCE enabled');
														}
														if (fixableError.autoFix.authMethod) {
															updatedCredentials.clientAuthMethod = fixableError.autoFix.authMethod;
															fixesApplied.push(`Auth Method: ${fixableError.autoFix.authMethod}`);
														}
														if (fixableError.autoFix.responseType) {
															updatedCredentials.responseType = fixableError.autoFix.responseType;
															fixesApplied.push(`Response Type: ${fixableError.autoFix.responseType}`);
														}
														if (fixableError.autoFix.addScope) {
															const currentScopes = updatedCredentials.scopes || '';
															if (!currentScopes.includes(fixableError.autoFix.addScope)) {
																updatedCredentials.scopes = currentScopes ? `${currentScopes} ${fixableError.autoFix.addScope}` : fixableError.autoFix.addScope;
																fixesApplied.push(`Added scope: ${fixableError.autoFix.addScope}`);
															}
														}
													}
												}
												
												// Apply fixes
												onCredentialsChange(updatedCredentials);
												
												// Save to storage
												await CredentialsServiceV8.saveCredentials(flowKey, updatedCredentials, {
													flowType: flowType as 'oauth' | 'oidc',
													includeClientSecret: true,
													includeScopes: true,
													includeRedirectUri: true,
												});
												
												// Save shared credentials
												await SharedCredentialsServiceV8.saveCredentials({
													environmentId: updatedCredentials.environmentId,
													clientId: updatedCredentials.clientId,
													clientSecret: updatedCredentials.clientSecret,
													clientAuthMethod: updatedCredentials.clientAuthMethod,
												});
												
												// Clear pre-flight validation result to trigger re-validation
												setPreFlightValidationResult(null);
												
												toastV8.success(`✅ Fixed ${fixesApplied.length} error(s): ${fixesApplied.join(', ')}`);
											}
										} catch (error) {
											console.error(`${MODULE_TAG} Error fixing errors:`, error);
											toastV8.error(`❌ Failed to fix errors: ${error instanceof Error ? error.message : 'Unknown error'}`);
										} finally {
											setIsLoading(false);
											setLoadingMessage('');
										}
									}}
									disabled={isLoading}
									style={{
										marginTop: '16px',
										padding: '12px 24px',
										background: '#dc2626',
										color: 'white',
										border: 'none',
										borderRadius: '6px',
										fontSize: '14px',
										fontWeight: '600',
										cursor: isLoading ? 'not-allowed' : 'pointer',
										opacity: isLoading ? 0.6 : 1,
										display: 'flex',
										alignItems: 'center',
										gap: '8px',
									}}
								>
									<span>🔧</span>
									<span>Fix All Errors Automatically</span>
								</button>
							)}
							{preFlightValidationResult.errors.length === 0 && preFlightValidationResult.warnings.length === 0 && (
								<div style={{ color: '#166534', fontSize: '14px' }}>
									✅ All validation checks passed! You can proceed with confidence.
								</div>
							)}
						</CollapsibleContent>
					)}
				</CollapsibleSection>
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
						{credentials.usePAR && (
							<div
								style={{
									marginTop: '12px',
									padding: '12px',
									background: '#fef3c7',
									border: '1px solid #fbbf24',
									borderRadius: '8px',
									fontSize: '13px',
									color: '#92400e',
								}}
							>
								<strong>📤 PAR Enabled:</strong> This will push authorization parameters to PingOne
								via PAR request first, then generate the authorization URL with{' '}
								<code>request_uri</code>.
							</div>
						)}
					</div>

					<div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
						<button
							type="button"
							className="btn btn-next"
							onClick={handleGenerateAuthUrl}
							disabled={isLoading || isPreFlightValidating}
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
							{isPreFlightValidating ? (
								<>
									<span
										style={{
											display: 'inline-block',
											animation: 'spin 1s linear infinite',
										}}
									>
										🔍
									</span>
									<span>Validating...</span>
								</>
							) : isLoading ? (
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
						{isPreFlightValidating && preFlightStatus && (
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
									padding: '8px 12px',
									background: '#eff6ff',
									border: '1px solid #3b82f6',
									borderRadius: '6px',
									fontSize: '13px',
									color: '#1e40af',
								}}
							>
								<span
									style={{
										display: 'inline-block',
										animation: 'spin 1s linear infinite',
										fontSize: '14px',
									}}
								>
									🔍
								</span>
								<span>{preFlightStatus}</span>
							</div>
						)}
					</div>
				</div>

				{flowState.authorizationUrl && (
					<div style={{ marginTop: '24px' }}>
						{/* PAR Information Display */}
						{credentials.usePAR && flowState.parRequestUri && (
							<div
								style={{
									background: '#ecfdf5',
									border: '1px solid #10b981',
									borderRadius: '8px',
									padding: '16px',
									marginBottom: '16px',
								}}
							>
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '8px',
										marginBottom: '12px',
									}}
								>
									<span style={{ fontSize: '20px' }}>📤</span>
									<strong style={{ color: '#065f46', fontSize: '15px' }}>
										PAR Request Completed
									</strong>
								</div>
								<div style={{ marginBottom: '12px' }}>
									<div
										style={{
											fontSize: '13px',
											color: '#047857',
											marginBottom: '4px',
											fontWeight: '500',
										}}
									>
										PAR Request URI:
									</div>
									<div
										style={{
											background: 'white',
											border: '1px solid #d1d5db',
											borderRadius: '6px',
											padding: '8px 12px',
											fontFamily: 'monospace',
											fontSize: '12px',
											color: '#1f2937',
											wordBreak: 'break-all',
										}}
									>
										{flowState.parRequestUri}
									</div>
								</div>
								{flowState.parExpiresIn && (
									<div style={{ fontSize: '13px', color: '#047857' }}>
										<strong>Expires in:</strong> {flowState.parExpiresIn} seconds
									</div>
								)}
								<div style={{ marginTop: '8px', fontSize: '12px', color: '#059669' }}>
									💡 The authorization URL below uses this <code>request_uri</code> instead of
									individual parameters. Check the <strong>⚡ Show API Calls</strong> section to see
									the full PAR request details.
								</div>
							</div>
						)}

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

						{/* Show different buttons based on redirectless mode */}
						{credentials.responseMode === 'pi.flow' || credentials.useRedirectless ? (
							// Redirectless mode: Show button to start redirectless authentication
							<div
								style={{
									marginTop: '16px',
									display: 'flex',
									flexDirection: 'column',
									gap: '12px',
									alignItems: 'center',
								}}
							>
								<div
									style={{
										background: '#fef3c7',
										border: '1px solid #f59e0b',
										borderRadius: '8px',
										padding: '12px 16px',
										marginBottom: '8px',
										width: '100%',
										maxWidth: '600px',
									}}
								>
									<p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
										<strong>Redirectless Mode:</strong> This URL shows what would be used in
										standard redirect mode. In redirectless mode, we'll make a POST request instead
										of redirecting and add response_mode=pi.flow to the Authorization URL.
									</p>
								</div>
								<button
									type="button"
									className="btn btn-next"
									onClick={handleStartRedirectlessAuth}
									disabled={isLoading}
									style={{
										fontSize: '16px',
										padding: '12px 24px',
										display: 'flex',
										alignItems: 'center',
										gap: '8px',
										minWidth: '280px',
										justifyContent: 'center',
									}}
								>
									{isLoading ? (
										<>
											<span>⏳</span>
											<span>Starting Redirectless Authentication...</span>
										</>
									) : (
										<>
											<span>🚀</span>
											<span>Start Redirectless Authentication</span>
										</>
									)}
								</button>
							</div>
						) : (
							// Standard mode: Show button to open URL in browser
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
						)}

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

				{/* Device Code Flow Educational Sections */}
				<CollapsibleSection>
					<CollapsibleHeaderButton
						onClick={() => setDeviceCodeOverviewCollapsed(!deviceCodeOverviewCollapsed)}
						aria-expanded={!deviceCodeOverviewCollapsed}
				>
						<CollapsibleTitle>
							<FiBook /> What is Device Authorization Flow?
						</CollapsibleTitle>
						<CollapsibleToggleIcon $collapsed={deviceCodeOverviewCollapsed}>
							<FiChevronDown />
						</CollapsibleToggleIcon>
					</CollapsibleHeaderButton>
					{!deviceCodeOverviewCollapsed && (
						<CollapsibleContent>
							<InfoBox $variant="info">
								<FiInfo size={20} />
						<div>
									<InfoTitle>Device Authorization Flow (RFC 8628)</InfoTitle>
									<InfoText>
										The Device Authorization Flow is designed for devices with limited input
										capabilities, such as smart TVs, IoT devices, printers, and CLI tools. It allows
										users to authorize devices using a separate device (like a smartphone or
										computer) while the limited device polls for the authorization result.
									</InfoText>
								</div>
							</InfoBox>

							<InfoBox $variant="success">
								<FiCheckCircle size={20} />
								<div>
									<InfoTitle>How Device Code Flow Works</InfoTitle>
									<InfoList>
										<li>
											<strong>Step 1 (this step):</strong> Device requests authorization and receives
											a device code and user code
									</li>
										<li>
											<strong>Step 2:</strong> User enters the user code on a separate
										device/browser to authorize
									</li>
										<li>
											<strong>Step 3:</strong> Device polls the token endpoint until authorization
											completes
									</li>
									</InfoList>
								</div>
							</InfoBox>
						</CollapsibleContent>
					)}
				</CollapsibleSection>

				<CollapsibleSection>
					<CollapsibleHeaderButton
						onClick={() => setDeviceCodeDetailsCollapsed(!deviceCodeDetailsCollapsed)}
						aria-expanded={!deviceCodeDetailsCollapsed}
					>
						<CollapsibleTitle>
							<FiBook /> Device Code vs Authorization Code & Use Cases
						</CollapsibleTitle>
						<CollapsibleToggleIcon $collapsed={deviceCodeDetailsCollapsed}>
							<FiChevronDown />
						</CollapsibleToggleIcon>
					</CollapsibleHeaderButton>
					{!deviceCodeDetailsCollapsed && (
						<CollapsibleContent>
							<ParameterGrid>
								<InfoBox $variant="info">
									<FiInfo size={20} />
									<div>
										<InfoTitle>Device Code Flow</InfoTitle>
										<InfoList>
											<li>No browser redirect required</li>
											<li>User authorizes on separate device</li>
											<li>Device polls for tokens</li>
											<li>Perfect for limited-input devices</li>
										</InfoList>
							</div>
								</InfoBox>

								<InfoBox $variant="success">
									<FiCheckCircle size={20} />
									<div>
										<InfoTitle>Authorization Code Flow</InfoTitle>
										<InfoList>
											<li>Requires browser redirect</li>
											<li>User authorizes in same browser</li>
											<li>Code exchanged for tokens immediately</li>
											<li>Perfect for web and mobile apps</li>
										</InfoList>
						</div>
								</InfoBox>
							</ParameterGrid>

							<InfoBox $variant="warning">
								<FiAlertCircle size={20} />
								<div>
									<InfoTitle>Use Cases for Device Code Flow</InfoTitle>
									<InfoList>
										<li>
											<strong>Smart TVs:</strong> Users authorize on their phone, TV gets access
										</li>
										<li>
											<strong>IoT Devices:</strong> Sensors, cameras, and other devices without
											keyboards
										</li>
										<li>
											<strong>CLI Tools:</strong> Command-line applications that can't open
											browsers
										</li>
										<li>
											<strong>Printers & Scanners:</strong> Office equipment needing cloud access
										</li>
									</InfoList>
					</div>
							</InfoBox>
						</CollapsibleContent>
					)}
				</CollapsibleSection>

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

				{/* Device Authorization Request URL Display - Show after request is made */}
				{isComplete && flowState.deviceCode && (
					<div style={{ marginTop: '24px' }}>
						<h3
							style={{
								margin: '0 0 12px 0',
								fontSize: '16px',
								fontWeight: '600',
								color: '#1f2937',
							}}
						>
							📡 Device Authorization Request
						</h3>
						<p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280' }}>
							This is the POST request that was sent to request device authorization:
						</p>
						{(() => {
							const backendUrl =
								process.env.NODE_ENV === 'production'
									? 'https://oauth-playground.vercel.app'
									: 'https://localhost:3001';
							const deviceAuthEndpoint = `${backendUrl}/api/device-authorization`;
							const authMethod =
								credentials.clientAuthMethod ||
								(credentials.clientSecret ? 'client_secret_basic' : 'none');

							// Build request body (JSON format sent to backend proxy)
							const requestBody: Record<string, string> = {
								environment_id: credentials.environmentId?.trim() || '',
								client_id: credentials.clientId?.trim() || '',
							};

							if (credentials.scopes?.trim()) {
								requestBody.scope = credentials.scopes.trim();
							}

							if (credentials.clientSecret) {
								requestBody.client_secret = credentials.clientSecret;
								requestBody.client_auth_method = authMethod;
							} else if (authMethod === 'none') {
								requestBody.client_auth_method = 'none';
							}

							const hasAuthHeader =
								authMethod === 'client_secret_basic' && credentials.clientSecret;

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
											label="Device Authorization Endpoint (Backend Proxy)"
											showCopyButton={true}
											showInfoButton={true}
											showOpenButton={false}
											height="auto"
											editable={false}
										/>
									</div>

									{/* Request Body */}
									<div style={{ marginBottom: '16px' }}>
										<strong
											style={{
												color: '#374151',
												fontSize: '13px',
												marginBottom: '8px',
												display: 'block',
											}}
										>
											Request Body (JSON):
										</strong>
										<pre
											style={{
												background: '#f3f4f6',
												border: '1px solid #e5e7eb',
												borderRadius: '6px',
												padding: '12px',
												fontSize: '12px',
												overflow: 'auto',
												margin: 0,
												color: '#1f2937',
											}}
										>
											{JSON.stringify(
												{
													...requestBody,
													client_secret: requestBody.client_secret ? '***REDACTED***' : undefined,
												},
												null,
												2
											)}
										</pre>
									</div>

									{hasAuthHeader && (
										<div
											style={{
												marginBottom: '16px',
												padding: '12px',
												background: '#fef3c7',
												borderRadius: '6px',
											}}
										>
											<strong style={{ color: '#92400e', fontSize: '13px' }}>
												Authorization Header:
											</strong>
											<div
												style={{
													marginTop: '4px',
													fontSize: '13px',
													color: '#78350f',
													fontFamily: 'monospace',
												}}
											>
												Basic{' '}
												{btoa(
													`${credentials.clientId?.trim()}:${credentials.clientSecret?.trim()}`
												).substring(0, 20)}
												...
											</div>
											<p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#92400e' }}>
												Client credentials are sent in the Authorization header using HTTP Basic
												Authentication.
											</p>
										</div>
									)}

									<div style={{ marginTop: '12px', fontSize: '12px', color: '#6b7280' }}>
										<strong>Parameters:</strong>
										<ul style={{ margin: '4px 0 0 20px', padding: 0 }}>
											<li>
												<strong style={{ color: '#dc2626' }}>environment_id</strong>: Your PingOne
												environment ID (required)
											</li>
											<li>
												<strong style={{ color: '#dc2626' }}>client_id</strong>: Your application's
												client ID (required)
											</li>
											{credentials.scopes?.trim() && (
												<li>
													<strong style={{ color: '#dc2626' }}>scope</strong>: Space-separated list
													of requested scopes
												</li>
											)}
											{credentials.clientSecret && (
												<li>
													<strong style={{ color: '#dc2626' }}>client_secret</strong>: Your
													application's client secret (required for confidential clients)
												</li>
											)}
											{credentials.clientSecret && (
												<li>
													<strong style={{ color: '#dc2626' }}>client_auth_method</strong>:
													Authentication method ({authMethod})
												</li>
											)}
										</ul>
										<p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
											<strong>Response:</strong> Returns device_code, user_code, verification_uri,
											and expires_in. The user must visit the verification_uri and enter the
											user_code to authorize the device.
										</p>
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
		const isRedirectlessCallback =
			credentials.responseMode === 'pi.flow' || credentials.useRedirectless;
		if (isRedirectlessCallback) {
			console.warn(
				`${MODULE_TAG} ⚠️ Redirectless mode (response_mode=pi.flow) is enabled but user is on callback step - this shouldn't happen in redirectless mode`
			);

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
								<p
									style={{
										margin: '0 0 12px 0',
										fontSize: '14px',
										color: '#7f1d1d',
										lineHeight: '1.6',
									}}
								>
									You have <strong>redirectless mode enabled</strong>, which means there should be{' '}
									<strong>no redirect</strong> to a callback URL. Instead, a login modal should have
									appeared after generating the authorization URL.
								</p>
								<p
									style={{
										margin: '0 0 12px 0',
										fontSize: '14px',
										color: '#7f1d1d',
										lineHeight: '1.6',
									}}
								>
									<strong>What to do:</strong>
								</p>
								<ol
									style={{
										margin: '0 0 12px 0',
										paddingLeft: '20px',
										fontSize: '14px',
										color: '#7f1d1d',
										lineHeight: '1.6',
									}}
								>
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
										toastV8.info(
											'Navigate back to Authorization URL step and click "Generate Authorization URL" again'
										);
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
			setLoadingMessage('📋 Parsing Callback URL...');
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
				setValidationErrors([message]);
				toastV8.error(message);
			} finally {
				setIsLoading(false);
				setLoadingMessage('');
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
					console.error(
						`${MODULE_TAG} ❌ Error in callback:`,
						callbackError,
						callbackErrorDescription
					);
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
								<p
									style={{
										margin: '0 0 8px 0',
										fontSize: '14px',
										color: '#7f1d1d',
										lineHeight: '1.6',
									}}
								>
									<strong>Error:</strong> {callbackError}
								</p>
								{callbackErrorDescription && (
									<p
										style={{
											margin: '0 0 12px 0',
											fontSize: '14px',
											color: '#7f1d1d',
											lineHeight: '1.6',
										}}
									>
										<strong>Description:</strong> {decodeURIComponent(callbackErrorDescription)}
									</p>
								)}
								{callbackError === 'unsupported_response_type' && (
									<div
										style={{
											marginTop: '12px',
											padding: '12px',
											background: '#fef3c7',
											borderRadius: '4px',
										}}
									>
										<p
											style={{
												margin: '0 0 8px 0',
												fontSize: '14px',
												color: '#92400e',
												fontWeight: '600',
											}}
										>
											🔧 Troubleshooting Steps (Configuration looks correct):
										</p>
										<p
											style={{
												margin: '0 0 8px 0',
												fontSize: '13px',
												color: '#92400e',
												lineHeight: '1.6',
											}}
										>
											Your authorization URL is correctly formatted with{' '}
											<code
												style={{ background: '#fff3cd', padding: '2px 6px', borderRadius: '3px' }}
											>
												response_type=code
											</code>{' '}
											and PKCE parameters. Since both Grant Types and Response Types are configured
											correctly, try these steps:
										</p>
										<ol
											style={{
												margin: '0 0 12px 0',
												paddingLeft: '20px',
												fontSize: '14px',
												color: '#92400e',
												lineHeight: '1.6',
											}}
										>
											<li style={{ marginBottom: '4px' }}>
												<strong>Wait for propagation:</strong> After saving PingOne settings, wait
												30-60 seconds for changes to propagate
											</li>
											<li style={{ marginBottom: '4px' }}>
												<strong>Check application status:</strong> Ensure the application is{' '}
												<strong>Enabled</strong> (not Draft or Disabled)
											</li>
											<li style={{ marginBottom: '4px' }}>
												<strong>Verify PKCE settings:</strong> Check if your PingOne app has
												specific PKCE requirements (some apps require PKCE to be explicitly enabled)
											</li>
											<li style={{ marginBottom: '4px' }}>
												<strong>Check application type:</strong> Ensure the app type is appropriate
												(Web App or Single Page App) - some types have restrictions
											</li>
											<li style={{ marginBottom: '4px' }}>
												<strong>Check policies:</strong> Look for any application-level policies or
												rules that might be blocking the Authorization Code flow
											</li>
											<li style={{ marginBottom: '4px' }}>
												<strong>Verify redirect URI:</strong> Double-check that{' '}
												<code
													style={{ background: '#fff3cd', padding: '2px 6px', borderRadius: '3px' }}
												>
													{credentials.redirectUri || 'Not configured'}
												</code>{' '}
												exactly matches (case-sensitive, trailing slash matters)
											</li>
											<li style={{ marginBottom: '4px' }}>
												<strong>Check Correlation ID:</strong> The error includes a Correlation ID -
												use it to check PingOne logs for more details
											</li>
										</ol>
										<div
											style={{
												padding: '8px',
												background: '#fff3cd',
												borderRadius: '4px',
												marginTop: '8px',
											}}
										>
											<p
												style={{
													margin: '0 0 4px 0',
													fontSize: '13px',
													color: '#92400e',
													fontWeight: '600',
												}}
											>
												🔍 Request Details (for debugging):
											</p>
											<ul
												style={{
													margin: '0',
													paddingLeft: '20px',
													fontSize: '12px',
													color: '#92400e',
													lineHeight: '1.4',
												}}
											>
												<li>
													<strong>Response Type:</strong> <code>code</code>
												</li>
												<li>
													<strong>Grant Type:</strong> authorization_code
												</li>
												<li>
													<strong>PKCE:</strong>{' '}
													{isPKCERequired
														? `Yes (${credentials.pkceEnforcement || 'REQUIRED'})`
														: 'No (OPTIONAL)'}
												</li>
												<li>
													<strong>Client ID:</strong> <code>{credentials.clientId}</code>
												</li>
												<li>
													<strong>Redirect URI:</strong>{' '}
													<code>{credentials.redirectUri || 'Not configured'}</code>
												</li>
												<li>
													<strong>Scope:</strong> <code>{credentials.scopes || 'openid'}</code>
												</li>
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
										: "The callback URL was automatically detected and parsed. Here's what was extracted:"}
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
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
												marginBottom: '6px',
											}}
										>
											<span style={{ fontSize: '16px' }}>🔑</span>
											<strong style={{ color: '#166534', fontSize: '13px' }}>
												Authorization Code:
											</strong>
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
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
												marginBottom: '6px',
											}}
										>
											<span style={{ fontSize: '16px' }}>🔐</span>
											<strong style={{ color: '#166534', fontSize: '13px' }}>
												State (validated):
											</strong>
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
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
												marginBottom: '6px',
											}}
										>
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
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
												marginBottom: '6px',
											}}
										>
											<span style={{ fontSize: '16px' }}>🌐</span>
											<strong style={{ color: '#1e40af', fontSize: '13px' }}>
												Callback URL (parsed):
											</strong>
										</div>
										<ColoredUrlDisplay
											url={callbackDetails.url}
											height="80px"
											showInfoButton={false}
										/>
									</div>
								)}

								<p
									style={{
										margin: '16px 0 0 0',
										fontSize: '14px',
										color: '#047857',
										fontWeight: '600',
									}}
								>
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
						<ColoredUrlDisplay
							url={callbackDetails.url}
							label="🌐 Full Callback URL"
							showCopyButton={true}
							showInfoButton={false}
							showOpenButton={false}
							height="auto"
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
	const [timeUntilNextPoll, setTimeUntilNextPoll] = useState<number | null>(null);
	const autoPollTriggeredRef = useRef<boolean>(false);

	// Update polling timeout countdown and time until next poll
	useEffect(() => {
		if (flowState.pollingStatus?.isPolling && !flowState.tokens?.accessToken) {
			// Start countdown from when polling started
			const startTime = flowState.pollingStatus.lastPolled || Date.now();
			const currentInterval = flowState.deviceCodeInterval || 5; // Get current polling interval
			
			const updateTimers = () => {
				const now = Date.now();
				const elapsed = Math.floor((now - startTime) / 1000);
				
				// Calculate polling timeout remaining
				const remaining = Math.max(0, pollingTimeoutSeconds - elapsed);
				setPollingTimeoutRemaining(remaining > 0 ? remaining : null);

				// Calculate time until next poll
				if (flowState.pollingStatus?.lastPolled) {
					const timeSinceLastPoll = Math.floor((now - flowState.pollingStatus.lastPolled) / 1000);
					const nextPollIn = Math.max(0, currentInterval - timeSinceLastPoll);
					setTimeUntilNextPoll(nextPollIn > 0 ? nextPollIn : null);
				} else {
					setTimeUntilNextPoll(null);
				}
			};

			updateTimers();
			const interval = setInterval(updateTimers, 1000);

			return () => clearInterval(interval);
		} else {
			setPollingTimeoutRemaining(null);
			setTimeUntilNextPoll(null);
			return undefined;
		}
	}, [
		flowState.pollingStatus?.isPolling,
		flowState.pollingStatus?.lastPolled,
		flowState.tokens?.accessToken,
		flowState.deviceCodeInterval,
		pollingTimeoutSeconds,
	]);

	// Store handlePollForTokens ref so we can call it from useEffect
	const handlePollForTokensRef = useRef<(() => Promise<void>) | null>(null);
	// Track if auto-polling has been initiated to prevent multiple calls
	const autoPollInitiatedRef = useRef<boolean>(false);
	// Track if polling is currently executing to prevent race conditions
	const isPollingExecutingRef = useRef<boolean>(false);

	// Shared handler for device authorization requests (used in both Step 1 and Step 2)
	const handleRequestDeviceAuth = useCallback(async () => {
		

		// Validate required fields before requesting device authorization
		if (!credentials.environmentId?.trim()) {
			setError('Please provide an Environment ID in the configuration above.');
			setValidationErrors(['Please provide an Environment ID in the configuration above.']);
			return;
		}
		if (!credentials.clientId?.trim()) {
			setError('Please provide a Client ID in the configuration above.');
			setValidationErrors(['Please provide a Client ID in the configuration above.']);
			return;
		}
		if (!credentials.scopes?.trim()) {
			setError('Please provide at least one scope in the configuration above.');
			setValidationErrors(['Please provide at least one scope in the configuration above.']);
			return;
		}

		console.log(`${MODULE_TAG} Requesting device authorization`);
		// CRITICAL: Stop any running polling before requesting new device code
		// This ensures old polling loops don't continue with stale device codes
		pollingAbortRef.current = true;

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

		// Pre-flight validation for device code flow
		setIsPreFlightValidating(true);
		setPreFlightStatus('🔍 Starting pre-flight validation...');
		setError(null);
		toastV8.info('🔍 Starting pre-flight validation...');

		let validationResult: {
			passed: boolean;
			errors: string[];
			warnings: string[];
			fixableErrors?: Array<{
				errorIndex: number;
				errorType: string;
				errorMessage: string;
				fixable: boolean;
				fixDescription: string;
				fixData?: {
					addScope?: string;
				};
			}>;
		} | null = null;

		try {
			const { PreFlightValidationServiceV8 } = await import('@/v8/services/preFlightValidationServiceV8');
			const { workerTokenServiceV8 } = await import('@/v8/services/workerTokenServiceV8');
			
			setPreFlightStatus('🔑 Retrieving worker token...');
			const workerToken = await workerTokenServiceV8.getToken();
			
			setPreFlightStatus('✅ Validating configuration against PingOne...');
			
			// For device code, only validate OAuth config (no redirect URI needed)
			const oauthConfigResult = await PreFlightValidationServiceV8.validateOAuthConfig({
				specVersion,
				flowType,
				credentials,
				...(workerToken && { workerToken }),
			});

			// Analyze fixable errors
			const fixableErrors = PreFlightValidationServiceV8.analyzeFixableErrors(
				oauthConfigResult.errors,
				{ specVersion, flowType, credentials, ...(workerToken && { workerToken }) },
				undefined, // No redirect URIs for device code
				undefined // No app config needed for device code
			);

			validationResult = {
				passed: oauthConfigResult.passed,
				errors: oauthConfigResult.errors,
				warnings: oauthConfigResult.warnings,
				fixableErrors,
			};

			console.log(`${MODULE_TAG} Pre-flight validation result:`, {
				passed: validationResult.passed,
				errorCount: validationResult.errors.length,
				warningCount: validationResult.warnings.length,
			});

			// Store validation result for display
			setPreFlightValidationResult({
				passed: validationResult.passed,
				errors: validationResult.errors,
				warnings: validationResult.warnings,
				fixableErrors: validationResult.fixableErrors || [],
			});

			// Handle errors and warnings
			if (validationResult.errors.length > 0) {
				const fixableErrors = validationResult.fixableErrors || [];
				
				if (fixableErrors.length > 0) {
					const { uiNotificationServiceV8 } = await import('@/v8/services/uiNotificationServiceV8');
					const fixDescriptions = fixableErrors.map(fe => `  • ${fe.fixDescription}`).join('\n');
					const fixableCount = fixableErrors.length;
					
					let message = `Found ${fixableCount} fixable error(s).\n\n`;
					message += `The following can be automatically fixed:\n${fixDescriptions}\n\n`;
					message += `Would you like to automatically fix all fixable errors?`;
					
					const confirmed = await uiNotificationServiceV8.confirm({
						title: '🔧 Fix All Errors?',
						message: message,
						confirmText: 'Yes, Fix All',
						cancelText: 'No, I\'ll Fix Manually',
						severity: 'warning',
					});
					
					if (confirmed) {
						const updatedCredentials = { ...credentials };
						const fixesApplied: string[] = [];
						
						for (const fixableError of fixableErrors) {
							if (fixableError.fixData?.addScope) {
								const currentScopes = updatedCredentials.scopes || '';
								if (!currentScopes.includes(fixableError.fixData.addScope)) {
									updatedCredentials.scopes = currentScopes.trim()
										? `${currentScopes.trim()} ${fixableError.fixData.addScope}`
										: fixableError.fixData.addScope;
									fixesApplied.push(`Added scope: ${fixableError.fixData.addScope}`);
								}
							}
						}
						
						const { CredentialsServiceV8 } = await import('@/v8/services/credentialsServiceV8');
						const flowKey = `${specVersion}-${flowType}-v8u`;
						CredentialsServiceV8.saveCredentials(flowKey, updatedCredentials);
						
						if (onCredentialsChange) {
							onCredentialsChange(updatedCredentials);
						}
						
						toastV8.success(`Fixed ${fixesApplied.length} error(s): ${fixesApplied.join(', ')}`);
						
						// Re-run validation
						setPreFlightStatus('🔍 Re-validating configuration...');
						const newOAuthConfigResult = await PreFlightValidationServiceV8.validateOAuthConfig({
							specVersion,
							flowType,
							credentials: updatedCredentials,
							...(workerToken && { workerToken }),
						});
						
					const newFixableErrors = PreFlightValidationServiceV8.analyzeFixableErrors(
						newOAuthConfigResult.errors,
						{ specVersion, flowType, credentials: updatedCredentials, ...(workerToken && { workerToken }) },
						undefined,
						undefined
					);
						
						setPreFlightValidationResult({
							passed: newOAuthConfigResult.passed,
							errors: newOAuthConfigResult.errors,
							warnings: newOAuthConfigResult.warnings,
							fixableErrors: newFixableErrors,
						});
						
						if (newOAuthConfigResult.errors.length > 0) {
							setValidationErrors(newOAuthConfigResult.errors);
							setValidationWarnings([]);
							toastV8.error('Some errors remain after fixes');
							setIsPreFlightValidating(false);
							setPreFlightStatus('');
							setIsLoading(false);
							setLoadingMessage('');
							return;
						} else if (newOAuthConfigResult.warnings.length > 0) {
							setValidationWarnings(newOAuthConfigResult.warnings);
							setValidationErrors([]);
							toastV8.warning('Pre-flight validation warnings remain');
						} else {
							setValidationWarnings([]);
							setValidationErrors([]);
							toastV8.success('✅ All errors fixed! Pre-flight validation passed!');
						}
					} else {
						// User declined auto-fix
						setValidationErrors(validationResult.errors);
						setValidationWarnings([]);
						toastV8.error('Pre-flight validation failed - check error details below');
						setIsPreFlightValidating(false);
						setPreFlightStatus('');
						setIsLoading(false);
						setLoadingMessage('');
						return;
					}
				} else {
					// Errors but not fixable
					setValidationErrors(validationResult.errors);
					setValidationWarnings([]);
					toastV8.error('Pre-flight validation failed - check error details below');
					setIsPreFlightValidating(false);
					setPreFlightStatus('');
					setIsLoading(false);
					setLoadingMessage('');
					return;
				}
			}
			
			// Warnings only
			if (validationResult.warnings.length > 0) {
				setValidationWarnings(validationResult.warnings);
				setValidationErrors([]);
				toastV8.warning('⚠️ Pre-flight validation warnings - check details below');
			} else {
				// No errors or warnings - validation passed
				setValidationWarnings([]);
				setValidationErrors([]);
				toastV8.success('✅ Pre-flight validation passed!');
			}
		} catch (validationError) {
			console.error(`${MODULE_TAG} ⚠️ Pre-flight validation error:`, validationError);
			toastV8.error('Pre-flight validation encountered an error - continuing anyway');
			setValidationWarnings([]);
			setValidationErrors([]);
			setPreFlightValidationResult({
				passed: false,
				errors: [validationError instanceof Error ? validationError.message : 'Unknown error'],
				warnings: [],
				fixableErrors: [],
			});
		} finally {
			setIsPreFlightValidating(false);
			setPreFlightStatus('');
		}

		setIsLoading(true);
		setLoadingMessage('📱 Requesting Device Authorization...');
		setError(null);

		try {
			

			// Add timeout to prevent infinite hanging (30 seconds max)
			const timeoutPromise = new Promise<never>((_, reject) => {
				setTimeout(() => {
					reject(new Error('Device authorization request timed out after 30 seconds'));
				}, 30000);
			});

			const result = await Promise.race([
				UnifiedFlowIntegrationV8U.requestDeviceAuthorization(credentials),
				timeoutPromise,
			]);

			

			// CRITICAL: Update ref with new device code IMMEDIATELY (FIRST THING after receiving result)
			// This must happen before ANY other operations to ensure polling uses the new device code
			deviceCodeRef.current = result.device_code;

			

			// Calculate expiration timestamp
			const expiresAt = Date.now() + result.expires_in * 1000;

			

			// CRITICAL: Clear old device code from sessionStorage after ref is updated
			// This prevents stale device codes from being restored
			sessionStorage.removeItem('v8u_device_code_data');

			// Reset polling state when requesting a new code
			// Construct verificationUriComplete if not provided by server (RFC 8628 Section 3.2)
			const verificationUriComplete =
				result.verification_uri_complete ||
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
				// RFC 8628 Section 3.2: Store interval from server response (default to 5 seconds if not provided)
				deviceCodeInterval: result.interval || 5,
				pollingStatus: {
					isPolling: false,
					pollCount: 0,
				},
			};
			// Clear any previous tokens
			delete newState.tokens;

			

			

			setFlowState(newState as FlowState);

			// CRITICAL: Reset abort flag so new polling can start with the new device code
			// But add a small delay to ensure any old polling has stopped
			pollingAbortRef.current = false;

			// Reset polling execution flag
			isPollingExecutingRef.current = false;

			// CRITICAL: If we're already on step 1 or 2, trigger auto-polling immediately
			// Otherwise, set to false and let the useEffect trigger it when user navigates to step 2
			if (currentStep === 1 || currentStep === 2) {
				autoPollTriggeredRef.current = true;
				autoPollInitiatedRef.current = false; // Reset so useEffect can trigger it
			} else {
			// Reset auto-poll trigger so it can trigger again when user navigates to step 2
			autoPollTriggeredRef.current = false;
			autoPollInitiatedRef.current = false;
			}

			

			nav.markStepComplete();
			toastV8.success('Device authorization request successful');
		} catch (err) {
			

			const message = err instanceof Error ? err.message : 'Failed to request device authorization';
			setError(message);
			setValidationErrors([message]);
			toastV8.error(message);
		} finally {
			

			

			setIsLoading(false);
			setLoadingMessage('');

			

			// Ensure flags are reset even on error
			if (!flowState.deviceCode) {
				autoPollTriggeredRef.current = false;
				autoPollInitiatedRef.current = false;
				isPollingExecutingRef.current = false;
			}
		}
	}, [credentials, flowState, nav, currentStep, isLoading]);

	// Auto-start polling when device code is received (device code flow)
	// This runs on both step 1 and step 2 - polling starts automatically after device code is received
	useEffect(() => {
		// Clear any pending auto-poll timeout
		if (autoPollTimeoutRef.current) {
			clearTimeout(autoPollTimeoutRef.current);
			autoPollTimeoutRef.current = null;
		}

		// CRITICAL FIX: Don't auto-start if there are validation errors (polling failed)
		// This prevents infinite loop when polling fails
		const hasErrors = validationErrors && validationErrors.length > 0;

		// Trigger on step 1 OR step 2 when device code is available
		// This makes polling automatic as soon as device code is received
		const isOnDeviceCodeStep = currentStep === 1 || currentStep === 2;
		if (
			flowType === 'device-code' &&
			isOnDeviceCodeStep &&
			flowState.deviceCode &&
			!flowState.tokens?.accessToken &&
			!flowState.pollingStatus?.isPolling &&
			!isLoading &&
			!autoPollTriggeredRef.current &&
			!isPollingExecutingRef.current &&
			!hasErrors // Don't auto-start if there are errors
		) {
			console.log(
				`${MODULE_TAG} Auto-starting polling on step ${currentStep} - will trigger via ref`
			);
			autoPollTriggeredRef.current = true;
			autoPollInitiatedRef.current = false; // Reset initiation flag
			// The actual polling will be triggered in a useEffect below when handlePollForTokens is defined
		}
		// Reset auto-poll trigger if we're not on device code steps or if loading starts (device auth request)
		else if (!isOnDeviceCodeStep || isLoading) {
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
	}, [
		flowType,
		currentStep,
		flowState.deviceCode,
		flowState.tokens?.accessToken,
		flowState.pollingStatus?.isPolling,
		isLoading,
		validationErrors,
	]);

	// Reset auto-poll trigger when device code changes or step changes
	// Also reset when loading starts (device auth request) to prevent interference
	// Stop polling if we leave device code steps (step 1 or 2)
	useEffect(() => {
		const isOnDeviceCodeStep = currentStep === 1 || currentStep === 2;
		if (!isOnDeviceCodeStep) {
			// Stop polling when leaving device code steps
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

		if (!isOnDeviceCodeStep || !flowState.deviceCode || isLoading) {
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

		// Trigger polling on step 1 OR step 2 when device code is available
		const isOnDeviceCodeStep = currentStep === 1 || currentStep === 2;
		if (
			flowType === 'device-code' &&
			isOnDeviceCodeStep &&
			flowState.deviceCode &&
			!flowState.tokens?.accessToken &&
			!flowState.pollingStatus?.isPolling &&
			!isLoading &&
			autoPollTriggeredRef.current &&
			!autoPollInitiatedRef.current &&
			!isPollingExecutingRef.current &&
			handlePollForTokensRef.current
		) {
			console.log(
				`${MODULE_TAG} Auto-starting polling on step ${currentStep} - calling handlePollForTokens now`
			);
			autoPollInitiatedRef.current = true; // Mark as initiated to prevent multiple calls
			// Use setTimeout to avoid calling during render, and store it for cleanup
			autoPollTimeoutRef.current = setTimeout(() => {
				autoPollTimeoutRef.current = null;
				// Double-check conditions before calling (in case state changed)
				if (
					isOnDeviceCodeStep &&
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
			setLoadingMessage('');
			setFlowState((prev) => ({
				...prev,
				pollingStatus: prev.pollingStatus
					? { ...prev.pollingStatus, isPolling: false }
					: { isPolling: false, pollCount: 0 },
			}));
			toastV8.info('Polling stopped');
		};

		const handlePollForTokens = async () => {
			

			// CRITICAL: Check abort flag FIRST - if polling was stopped, don't start new polling
			if (pollingAbortRef.current) {
				console.log(`${MODULE_TAG} Polling aborted - not starting new polling`);
				
				return;
			}

			// CRITICAL: Verify device code exists in ref (always use ref, not state)
			// The ref is the source of truth and is updated synchronously, so we only check the ref
			// State updates are asynchronous and may lag behind, causing race conditions
			if (!deviceCodeRef.current) {
				
				setError(
					'Please request a device code first by clicking the "Request Device Code" button above.'
				);
				return;
			}

			// Note: We only check the ref, not the state, because:
			// 1. The ref is the source of truth and is updated synchronously
			// 2. State updates are asynchronous and may lag behind, causing race conditions
			// 3. The ref is what we actually use for polling, so if the ref exists, we can proceed
			// If state is missing but ref exists, it's just a timing issue and will resolve on next render

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
			// RFC 8628 Section 3.5: Use server-provided interval from device authorization response
			const pollInterval = flowState.deviceCodeInterval || 5; // Use stored interval, default to 5 seconds
			// Calculate max attempts based on expiration time and interval
			const expiresIn = flowState.deviceCodeExpiresIn || 900; // Default 15 minutes
			const maxAttempts = Math.ceil(expiresIn / pollInterval) + 10; // Add buffer for safety
			let pollCount = 0;
			let currentInterval = pollInterval; // Start with stored interval

			const performPoll = async (): Promise<TokenResponse | null> => {
				// CRITICAL: Check abort flag FIRST - if polling was stopped, exit immediately
				if (pollingAbortRef.current) {
					console.log(`${MODULE_TAG} Polling aborted at start of performPoll`);
					return null;
				}

				try {
					// Use relative URL to go through Vite proxy (avoids certificate issues)
					// In development: Vite proxy routes /api/* to http://localhost:3001
					// In production: Vite proxy routes /api/* to the production backend
					const tokenEndpoint = '/api/token-exchange';

					// CRITICAL: Read device code from ref (always current, not from stale closure)
					const currentDeviceCode = deviceCodeRef.current?.trim();

					// CRITICAL: Check abort flag again after reading device code
					if (pollingAbortRef.current) {
						console.log(`${MODULE_TAG} Polling aborted after reading device code`);
						return null;
					}

					

					// Validate device code before sending
					if (!currentDeviceCode || currentDeviceCode === '') {
						console.error(`${MODULE_TAG} Device code is missing or empty`, {
							deviceCode: currentDeviceCode,
							hasDeviceCode: !!currentDeviceCode,
							refValue: deviceCodeRef.current,
							stateValue: flowState.deviceCode,
						});
						throw new Error('Device code is missing. Please request a new device code.');
					}

					console.log(
						`${MODULE_TAG} [DEBUG] Using device code for poll: ${currentDeviceCode.substring(0, 20)}... (length: ${currentDeviceCode.length})`
					);

					// Build request body for backend proxy (JSON format)
					// CRITICAL: Use currentDeviceCode (from latest state) not flowState.deviceCode (from closure)
					const requestBody: Record<string, string> = {
						grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
						client_id: credentials.clientId,
						device_code: currentDeviceCode!, // Use the device code from latest state
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
						deviceCodeLength: currentDeviceCode.length,
						deviceCodePrefix: `${currentDeviceCode.substring(0, 10)}...`,
					});

					

					pollCount++;
					let response: Response;
					try {
						// Track API call for display
						const { apiCallTrackerService: apiCallTrackerService4 } = await import('@/services/apiCallTrackerService');
						const startTime4 = Date.now();
						const actualPingOneUrl = `https://auth.pingone.com/${credentials.environmentId}/as/token`;
						const requestBodyForTracking = {
							...requestBody,
							device_code: '***REDACTED***',
						};

						const callId4 = apiCallTrackerService4.trackApiCall({
							method: 'POST',
							url: tokenEndpoint,
							actualPingOneUrl,
							isProxy: true,
							headers: {
								'Content-Type': 'application/json',
								Accept: 'application/json',
							},
							body: requestBodyForTracking,
							step: 'unified-device-code-poll',
							flowType: 'unified',
						});

						response = await fetch(tokenEndpoint, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								Accept: 'application/json',
							},
							body: JSON.stringify(requestBody),
						});

						// Parse response once (clone first to avoid consuming the body)
						const responseClone4 = response.clone();
						let responseData4: unknown;
						try {
							responseData4 = await responseClone4.json();
						} catch {
							responseData4 = { error: 'Failed to parse response' };
						}

						// Update API call with response
						apiCallTrackerService4.updateApiCallResponse(
							callId4,
							{
									status: response.status,
									statusText: response.statusText,
								data: responseData4,
							},
							Date.now() - startTime4
						);
					} catch (fetchError) {
						

						// Log to console with full details
						console.error(`${MODULE_TAG} ❌ Fetch error during polling (attempt ${pollCount}):`, {
							error: fetchError,
							tokenEndpoint,
							windowLocation: window.location.href,
							expectedUrl: window.location.origin + tokenEndpoint,
						});

						throw fetchError;
					}

					

					// Update polling status
					setFlowState((prev) => ({
						...prev,
						pollingStatus: {
							isPolling: true,
							pollCount,
							lastPolled: Date.now(),
						},
					}));

					// CRITICAL DEBUG: Log response status before checking
					

					if (response.ok) {
						console.log(`${MODULE_TAG} [DEBUG] Response is OK (200) - attempting to parse tokens`);
						let tokens: TokenResponse;
						let responseText = '';
						try {
							responseText = await response.text();
							
							tokens = JSON.parse(responseText);

							
						} catch (parseError) {
							
							throw new Error(
								`Failed to parse token response: ${parseError instanceof Error ? parseError.message : String(parseError)}`
							);
						}
						console.log(`${MODULE_TAG} ✅ Tokens received successfully on attempt ${pollCount}`);
						

						

						return tokens;
					}

					// Handle non-200 responses
					let errorData;
					let responseText = '';
					try {
						responseText = await response.text();
						
						errorData = JSON.parse(responseText);
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					} catch (_parseErr) {
						
						console.error(`${MODULE_TAG} Failed to parse error response:`, responseText);
						throw new Error(`Token polling failed: HTTP ${response.status} ${response.statusText}`);
					}

					console.log(`${MODULE_TAG} Poll response (attempt ${pollCount}):`, {
						status: response.status,
						error: errorData.error,
						errorDescription: errorData.error_description,
					});
					console.log(
						`${MODULE_TAG} [DEBUG] Full error response data:`,
						JSON.stringify(errorData, null, 2)
					);
					

					// Check for authorization_pending (user hasn't approved yet) - this is EXPECTED and normal
					if (errorData.error === 'authorization_pending') {
						console.log(
							`${MODULE_TAG} ⏳ Authorization pending (attempt ${pollCount}/${maxAttempts}) - user hasn't authorized yet, will continue polling in ${currentInterval}s...`
						);
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
					// RFC 8628 Section 3.5: On slow_down, client MUST wait the new interval seconds
					// Best practice: Increase by minimum 5 seconds to respect server rate limiting
					if (errorData.error === 'slow_down' && errorData.interval) {
						const newInterval = Math.max(errorData.interval, currentInterval + 5); // RFC 8628: minimum increase
						currentInterval = newInterval;
						console.log(
							`${MODULE_TAG} Rate limited, adjusting interval from ${pollInterval}s to ${currentInterval}s`
						);
						// Persist adjusted interval to state
						setFlowState((prev) => ({
							...prev,
							deviceCodeInterval: currentInterval,
							pollingStatus: {
								isPolling: true,
								pollCount,
								lastPolled: Date.now(),
							},
						}));
						return null; // Continue polling with adjusted interval
					}

					// Handle access_denied (user denied authorization) - RFC 8628 Section 3.5
					if (errorData.error === 'access_denied') {
						console.error(`${MODULE_TAG} User denied authorization`, {
							error: errorData.error,
							description: errorData.error_description,
						});
						throw new Error(
							`Authorization denied: ${errorData.error_description || 'User denied the authorization request'}. Please try again or request a new device code.`
						);
					}

					// Handle expired_token or invalid_grant (device code expired/invalid) - RFC 8628 Section 3.5
					if (errorData.error === 'expired_token' || errorData.error === 'invalid_grant') {
						console.error(`${MODULE_TAG} Device code expired or invalid`, {
							error: errorData.error,
							description: errorData.error_description,
						});
						throw new Error(
							`Device code expired or invalid: ${errorData.error_description || errorData.error}. Please request a new device code.`
						);
					}

					// Other errors (unknown errors)
					console.error(`${MODULE_TAG} Token polling error`, {
						error: errorData.error,
						description: errorData.error_description,
					});
					throw new Error(
						`Token polling failed: ${errorData.error} - ${errorData.error_description || 'Unknown error'}`
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
						setLoadingMessage('');
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
						setLoadingMessage('');
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
						
						
						// Filter tokens based on spec version (OAuth 2.0 Authorization Framework (RFC 6749) / OAuth 2.1 Authorization Framework (draft) should not have id_token when used without OpenID Connect)
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

						

						setFlowState((prev) => {
							
							const newState = {
								...prev,
								tokens: tokenState,
								pollingStatus: prev.pollingStatus
									? { ...prev.pollingStatus, isPolling: false }
									: { isPolling: false, pollCount: 0 },
							};

							

							return newState;
						});

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
						
						// Show success modal for device code flow
						setShowDeviceCodeSuccessModal(true);
						
						
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
				setValidationErrors([message]);
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

				{/* Authorization Link - Open in Browser */}
				{flowState.verificationUriComplete && (
					<div
						style={{
							marginTop: '16px',
							marginBottom: '16px',
							padding: '16px',
							background: '#fef3c7',
							border: '2px solid #fbbf24',
							borderRadius: '8px',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
							<span style={{ fontSize: '20px' }}>🌐</span>
							<div style={{ flex: 1, minWidth: '200px' }}>
								<strong style={{ color: '#92400e', fontSize: '14px', display: 'block', marginBottom: '4px' }}>
									Authorize Device in Browser
								</strong>
								<p style={{ margin: '0', fontSize: '13px', color: '#78350f' }}>
									Click the button below to open the authorization page in a new browser tab.
									Enter the user code shown below to authorize this device.
								</p>
							</div>
							<a
								href={flowState.verificationUriComplete}
								target="_blank"
								rel="noopener noreferrer"
								style={{
									padding: '10px 20px',
									background: '#f59e0b',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									fontSize: '14px',
									fontWeight: '600',
									textDecoration: 'none',
									display: 'inline-flex',
									alignItems: 'center',
									gap: '8px',
									cursor: 'pointer',
									whiteSpace: 'nowrap',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = '#d97706';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = '#f59e0b';
								}}
							>
								<span>🔗</span>
								<span>Open Authorization Page</span>
							</a>
						</div>
					</div>
				)}

				{/* Start Polling Button - Above Device Display */}
				{flowState.deviceCode && !isComplete && (
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
						{(() => {
							

							try {
								return (
						<DynamicDeviceFlow
							deviceType={selectedDeviceType}
							state={{
											deviceCode: flowState.deviceCode || '',
											userCode: flowState.userCode || '',
								verificationUri: flowState.verificationUri || '',
								verificationUriComplete: flowState.verificationUriComplete || '',
								expiresIn: flowState.deviceCodeExpiresIn || 0,
								interval: 5,
											expiresAt:
												flowState.deviceCodeExpiresAt &&
												typeof flowState.deviceCodeExpiresAt === 'number'
									? new Date(flowState.deviceCodeExpiresAt)
									: new Date(),
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
										...(flowState.tokens.refreshToken && {
											refresh_token: flowState.tokens.refreshToken,
										}),
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
								);
							} catch (error) {
								

								console.error(`${MODULE_TAG} Error rendering DynamicDeviceFlow:`, error);
								return (
									<div
										style={{
											padding: '20px',
											background: '#fee2e2',
											border: '2px solid #ef4444',
											borderRadius: '8px',
										}}
									>
										<strong style={{ color: '#dc2626' }}>Error rendering device display:</strong>
										<div style={{ marginTop: '8px', color: '#991b1b' }}>
											{error instanceof Error ? error.message : String(error)}
										</div>
									</div>
								);
							}
						})()}
					</div>
				)}

				{/* User Code Section - Added from step 1 */}
				{flowState.userCode && (
					<div
						style={{
							marginTop: '24px',
							padding: '20px',
							background: '#f0f9ff',
							borderRadius: '8px',
							border: '2px solid #0ea5e9',
						}}
					>
						<div style={{ marginBottom: '12px' }}>
							<strong style={{ color: '#0c4a6e', fontSize: '14px' }}>User Code:</strong>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
									marginTop: '8px',
								}}
							>
								<div
									style={{
										fontSize: '32px',
										fontWeight: 'bold',
										letterSpacing: '6px',
										color: '#0ea5e9',
										fontFamily: 'monospace',
										padding: '12px 16px',
										background: '#ffffff',
										borderRadius: '6px',
										border: '2px solid #0ea5e9',
									}}
								>
									{flowState.userCode}
								</div>
								<button
									type="button"
									onClick={async () => {
										try {
											await navigator.clipboard.writeText(flowState.userCode || '');
											toastV8.success('User code copied to clipboard');
										// eslint-disable-next-line @typescript-eslint/no-unused-vars
										} catch (_err) {
											toastV8.error('Failed to copy user code');
										}
									}}
									style={{
										padding: '8px 12px',
										background: '#0ea5e9',
										color: '#ffffff',
										border: 'none',
										borderRadius: '6px',
										cursor: 'pointer',
										display: 'flex',
										alignItems: 'center',
										gap: '4px',
									}}
									title="Copy user code"
								>
									<FiCopy size={16} />
									Copy
								</button>
							</div>
						</div>
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
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '12px',
										marginBottom: '12px',
									}}
								>
									<span style={{ fontSize: '24px' }}>⏳</span>
									<div style={{ flex: 1 }}>
										<strong style={{ color: '#0c4a6e', fontSize: '16px' }}>
											Polling token endpoint...
										</strong>
										{flowState.pollingStatus && flowState.pollingStatus.pollCount > 0 && (
											<div
												style={{
													fontSize: '13px',
													color: '#64748b',
													marginTop: '8px',
													display: 'flex',
													flexWrap: 'wrap',
													gap: '12px',
												}}
											>
												<div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
													<span style={{ fontWeight: '600' }}>Attempt:</span>
													<span style={{ fontFamily: 'monospace' }}>
														#{flowState.pollingStatus.pollCount}
													</span>
												</div>
												{flowState.deviceCodeInterval && (
													<div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
														<span style={{ fontWeight: '600' }}>Interval:</span>
														<span style={{ fontFamily: 'monospace', color: '#0ea5e9' }}>
															{flowState.deviceCodeInterval}s
														</span>
													</div>
												)}
												{timeUntilNextPoll !== null && timeUntilNextPoll > 0 && (
													<div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
														<span style={{ fontWeight: '600' }}>Next poll in:</span>
														<span
															style={{
																fontFamily: 'monospace',
																color: '#10b981',
																fontWeight: '600',
															}}
														>
															{timeUntilNextPoll}s
														</span>
													</div>
												)}
												{flowState.pollingStatus.lastPolled && (
													<div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
														<span style={{ fontWeight: '600' }}>Last poll:</span>
														<span style={{ fontFamily: 'monospace' }}>
															{new Date(flowState.pollingStatus.lastPolled).toLocaleTimeString()}
														</span>
													</div>
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
												<strong
													style={{ color: pollingTimeoutRemaining < 60 ? '#92400e' : '#1e40af' }}
												>
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

								<div
									style={{
										fontSize: '13px',
										color: '#64748b',
										marginTop: '8px',
										paddingTop: '8px',
										borderTop: '1px solid #bfdbfe',
									}}
								>
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
									<strong style={{ color: '#0c4a6e', fontSize: '16px' }}>Need a new code?</strong>
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
					setValidationErrors(['Please provide an Environment ID in the configuration above.']);
					return;
				}
				if (!credentials.clientId?.trim()) {
					setError('Please provide a Client ID in the configuration above.');
					setValidationErrors(['Please provide a Client ID in the configuration above.']);
					return;
				}
				if (!credentials.clientSecret?.trim()) {
					setError('Please provide a Client Secret in the configuration above.');
					setValidationErrors(['Please provide a Client Secret in the configuration above.']);
					return;
				}
				if (!credentials.scopes?.trim()) {
					setError('Please provide at least one scope in the configuration above.');
					setValidationErrors([
						'Please provide at least one scope in the configuration above.',
					]);
					return;
				}
			}

			// Pre-flight validation for client credentials flow
			if (flowType === 'client-credentials') {
				setIsPreFlightValidating(true);
				setPreFlightStatus('🔍 Starting pre-flight validation...');
				setError(null);
				toastV8.info('🔍 Starting pre-flight validation...');

				let validationResult: {
					passed: boolean;
					errors: string[];
					warnings: string[];
					fixableErrors?: Array<{
						errorIndex: number;
						errorType: string;
						errorMessage: string;
						fixable: boolean;
						fixDescription: string;
						fixData?: {
							authMethod?: string;
							addScope?: string;
						};
					}>;
					appConfig?: {
						tokenEndpointAuthMethod?: string;
					};
				} | null = null;

				try {
					const { PreFlightValidationServiceV8 } = await import('@/v8/services/preFlightValidationServiceV8');
					const { workerTokenServiceV8 } = await import('@/v8/services/workerTokenServiceV8');
					
					setPreFlightStatus('🔑 Retrieving worker token...');
					const workerToken = await workerTokenServiceV8.getToken();
					
					setPreFlightStatus('✅ Validating configuration against PingOne...');
					
					// For client credentials, only validate OAuth config (no redirect URI needed)
					const oauthConfigResult = await PreFlightValidationServiceV8.validateOAuthConfig({
						specVersion,
						flowType,
						credentials,
						...(workerToken && { workerToken }),
					});

					// Fetch app config for fixable error analysis
					let appConfig: {
						tokenEndpointAuthMethod?: string;
					} | undefined;
					if (workerToken && credentials.environmentId && credentials.clientId) {
						try {
							const { ConfigCheckerServiceV8 } = await import('@/v8/services/configCheckerServiceV8');
							const fetchedConfig = await ConfigCheckerServiceV8.fetchAppConfig(
								credentials.environmentId,
								credentials.clientId,
								workerToken
							);
							if (fetchedConfig) {
								appConfig = {
									tokenEndpointAuthMethod: fetchedConfig.tokenEndpointAuthMethod,
								};
							}
						} catch (error) {
							console.warn(`${MODULE_TAG} Could not fetch app config for fixable error analysis:`, error);
						}
					}

					// Analyze fixable errors
					const fixableErrors = PreFlightValidationServiceV8.analyzeFixableErrors(
						oauthConfigResult.errors,
						{ specVersion, flowType, credentials, ...(workerToken && { workerToken }) },
						undefined, // No redirect URIs for client credentials
						appConfig
					);

					validationResult = {
						passed: oauthConfigResult.passed,
						errors: oauthConfigResult.errors,
						warnings: oauthConfigResult.warnings,
						fixableErrors,
						...(appConfig && { appConfig }),
					};

					console.log(`${MODULE_TAG} Pre-flight validation result:`, {
						passed: validationResult.passed,
						errorCount: validationResult.errors.length,
						warningCount: validationResult.warnings.length,
					});

					// Store validation result for display
					if (validationResult) {
						setPreFlightValidationResult({
							passed: validationResult.passed,
							errors: validationResult.errors,
							warnings: validationResult.warnings,
							fixableErrors: validationResult.fixableErrors || [],
							...(validationResult.appConfig && { appConfig: validationResult.appConfig }),
						});
					}

					// Handle errors and warnings
					if (validationResult && validationResult.errors.length > 0) {
						const fixableErrors = validationResult.fixableErrors || [];
						
						if (fixableErrors.length > 0) {
							const { uiNotificationServiceV8 } = await import('@/v8/services/uiNotificationServiceV8');
							const fixDescriptions = fixableErrors.map(fe => `  • ${fe.fixDescription}`).join('\n');
							const fixableCount = fixableErrors.length;
							const totalErrors = validationResult.errors.length;
							
							let message = `Found ${fixableCount} fixable error(s) out of ${totalErrors} total error(s).\n\n`;
							message += `The following can be automatically fixed:\n${fixDescriptions}\n\n`;
							message += `Would you like to automatically fix all fixable errors?`;
							
							const confirmed = await uiNotificationServiceV8.confirm({
								title: '🔧 Fix All Errors?',
								message: message,
								confirmText: 'Yes, Fix All',
								cancelText: 'No, I\'ll Fix Manually',
								severity: 'warning',
							});
							
							if (confirmed) {
								const updatedCredentials = { ...credentials };
								const fixesApplied: string[] = [];
								
								for (const fixableError of fixableErrors) {
									if (fixableError.fixData) {
										if (fixableError.fixData.authMethod) {
											updatedCredentials.clientAuthMethod = fixableError.fixData.authMethod as 'none' | 'client_secret_basic' | 'client_secret_post' | 'client_secret_jwt' | 'private_key_jwt';
											fixesApplied.push(`Auth method: ${fixableError.fixData.authMethod}`);
										}
										if (fixableError.fixData.addScope) {
											const currentScopes = updatedCredentials.scopes || '';
											if (!currentScopes.includes(fixableError.fixData.addScope)) {
												updatedCredentials.scopes = currentScopes.trim()
													? `${currentScopes.trim()} ${fixableError.fixData.addScope}`
													: fixableError.fixData.addScope;
												fixesApplied.push(`Added scope: ${fixableError.fixData.addScope}`);
											}
										}
									}
								}
								
								const { CredentialsServiceV8 } = await import('@/v8/services/credentialsServiceV8');
								const flowKey = `${specVersion}-${flowType}-v8u`;
								CredentialsServiceV8.saveCredentials(flowKey, updatedCredentials);
								
								if (onCredentialsChange) {
									onCredentialsChange(updatedCredentials);
								}
								
								toastV8.success(`Fixed ${fixesApplied.length} error(s): ${fixesApplied.join(', ')}`);
								
								// Re-run validation
								setPreFlightStatus('🔍 Re-validating configuration...');
								const newOAuthConfigResult = await PreFlightValidationServiceV8.validateOAuthConfig({
									specVersion,
									flowType,
									credentials: updatedCredentials,
									...(workerToken && { workerToken }),
								});
								
								const newFixableErrors = PreFlightValidationServiceV8.analyzeFixableErrors(
									newOAuthConfigResult.errors,
									{ specVersion, flowType, credentials: updatedCredentials, ...(workerToken && { workerToken }) },
									undefined,
									appConfig
								);
								
								setPreFlightValidationResult({
									passed: newOAuthConfigResult.passed,
									errors: newOAuthConfigResult.errors,
									warnings: newOAuthConfigResult.warnings,
									fixableErrors: newFixableErrors,
								});
								
								if (newOAuthConfigResult.errors.length > 0) {
									setValidationErrors(newOAuthConfigResult.errors);
									setValidationWarnings([]);
									toastV8.error('Some errors remain after fixes');
									setIsPreFlightValidating(false);
									setPreFlightStatus('');
									setIsLoading(false);
									setLoadingMessage('');
									return;
								} else if (newOAuthConfigResult.warnings.length > 0) {
									setValidationWarnings(newOAuthConfigResult.warnings);
									setValidationErrors([]);
									toastV8.warning('Pre-flight validation warnings remain');
								} else {
									setValidationWarnings([]);
									setValidationErrors([]);
									toastV8.success('✅ All errors fixed! Pre-flight validation passed!');
								}
							} else {
								// User declined auto-fix
								if (validationResult) {
									setValidationErrors(validationResult.errors);
									setValidationWarnings([]);
								}
								toastV8.error('Pre-flight validation failed - check error details below');
								setIsPreFlightValidating(false);
								setPreFlightStatus('');
								setIsLoading(false);
								setLoadingMessage('');
								return;
							}
						} else {
							// Errors but not fixable
							if (validationResult) {
								setValidationErrors(validationResult.errors);
								setValidationWarnings([]);
							}
							toastV8.error('Pre-flight validation failed - check error details below');
							setIsPreFlightValidating(false);
							setPreFlightStatus('');
							setIsLoading(false);
							setLoadingMessage('');
							return;
						}
					}
					
					// Warnings only
					if (validationResult && validationResult.warnings.length > 0) {
						setValidationWarnings(validationResult.warnings);
						setValidationErrors([]);
						toastV8.warning('⚠️ Pre-flight validation warnings - check details below');
					} else {
						// No errors or warnings - validation passed
						setValidationWarnings([]);
						setValidationErrors([]);
						toastV8.success('✅ Pre-flight validation passed!');
					}
				} catch (validationError) {
					console.error(`${MODULE_TAG} ⚠️ Pre-flight validation error:`, validationError);
					toastV8.error('Pre-flight validation encountered an error - continuing anyway');
					setValidationWarnings([]);
					setValidationErrors([]);
					setPreFlightValidationResult({
						passed: false,
						errors: [validationError instanceof Error ? validationError.message : 'Unknown error'],
						warnings: [],
						fixableErrors: [],
					});
				} finally {
					setIsPreFlightValidating(false);
					setPreFlightStatus('');
				}
			}

			console.log(`${MODULE_TAG} Requesting token`, { flowType });
			setIsLoading(true);
			setLoadingMessage('🔑 Requesting Access Token...');
			setError(null);

			try {
				let tokens: TokenResponse;

				if (flowType === 'client-credentials') {
					tokens = await UnifiedFlowIntegrationV8U.requestToken(flowType, credentials);
				} else {
					throw new Error(
						`The ${flowType} flow does not support direct token requests. Please use the appropriate flow steps.`
					);
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
				setValidationErrors([message]);
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

				{/* Client Credentials Flow Educational Sections */}
				{flowType === 'client-credentials' && (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => setClientCredentialsOverviewCollapsed(!clientCredentialsOverviewCollapsed)}
								aria-expanded={!clientCredentialsOverviewCollapsed}
					>
								<CollapsibleTitle>
									<FiBook /> What is Client Credentials Flow?
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={clientCredentialsOverviewCollapsed}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!clientCredentialsOverviewCollapsed && (
								<CollapsibleContent>
									<InfoBox $variant="info">
										<FiInfo size={20} />
							<div>
											<InfoTitle>Machine-to-Machine Authentication</InfoTitle>
											<InfoText>
												The Client Credentials Flow (RFC 6749 Section 4.4) is used for
												machine-to-machine (M2M) authentication where no user is involved. The
												client authenticates using its own credentials and receives an access token
												for resources owned by the client or shared across multiple users.
											</InfoText>
										</div>
									</InfoBox>

									<InfoBox $variant="success">
										<FiCheckCircle size={20} />
										<div>
											<InfoTitle>When to Use Client Credentials</InfoTitle>
											<InfoList>
												<li>
													<strong>Resources owned by the client:</strong> Access to data or services
													belonging to the application itself
										</li>
												<li>
													<strong>Resources belonging to multiple users:</strong> Batch operations,
													aggregated data, or system-level access
										</li>
												<li>
													<strong>No user context:</strong> Background jobs, scheduled tasks, or
													automated processes
										</li>
											</InfoList>
									</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => setClientCredentialsDetailsCollapsed(!clientCredentialsDetailsCollapsed)}
								aria-expanded={!clientCredentialsDetailsCollapsed}
							>
								<CollapsibleTitle>
									<FiBook /> Client Credentials vs User Flows & Resource Server Scopes
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={clientCredentialsDetailsCollapsed}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!clientCredentialsDetailsCollapsed && (
								<CollapsibleContent>
									<ParameterGrid>
										<InfoBox $variant="info">
											<FiInfo size={20} />
											<div>
												<InfoTitle>Client Credentials Flow</InfoTitle>
												<InfoList>
													<li>No user authentication required</li>
													<li>Direct token request with client credentials</li>
													<li>Uses resource server scopes</li>
													<li>Perfect for backend services</li>
												</InfoList>
								</div>
										</InfoBox>

										<InfoBox $variant="success">
											<FiCheckCircle size={20} />
											<div>
												<InfoTitle>User Flows (Auth Code, Implicit)</InfoTitle>
												<InfoList>
													<li>Requires user authentication</li>
													<li>User grants permission to application</li>
													<li>Uses OIDC scopes (openid, profile, email)</li>
													<li>Perfect for user-facing applications</li>
												</InfoList>
							</div>
										</InfoBox>
									</ParameterGrid>

									<InfoBox $variant="warning">
										<FiAlertCircle size={20} />
										<div>
											<InfoTitle>Resource Server Scopes Required</InfoTitle>
											<InfoText>
												Client Credentials flow requires resource server scopes (e.g., "ClaimScope",
												"custom:read", "api:read"). OIDC scopes (openid, profile, email) and
												self-management scopes (p1:read:user) do not work with Client Credentials.
											</InfoText>
											<InfoList>
												<li>
													<strong>Why?</strong> Client Credentials is for accessing resources, not
													user identity
												</li>
												<li>
													<strong>How to configure:</strong> Create a resource server in PingOne,
													add scopes, and associate it with your application
												</li>
												<li>
													<strong>Example scopes:</strong> ClaimScope, custom:read, api:read,
													api:write
												</li>
											</InfoList>
						</div>
									</InfoBox>

									<InfoBox $variant="info">
										<FiInfo size={20} />
										<div>
											<InfoTitle>Use Cases for Client Credentials</InfoTitle>
											<InfoList>
												<li>
													<strong>API-to-API communication:</strong> Microservices authenticating to
													each other
												</li>
												<li>
													<strong>Backend services:</strong> Server-side applications accessing APIs
												</li>
												<li>
													<strong>Scheduled jobs:</strong> Cron jobs, batch processors, data sync
													tasks
												</li>
												<li>
													<strong>System integrations:</strong> Third-party integrations, webhooks,
													automated workflows
												</li>
											</InfoList>
					</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>
					</>
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

							// @ts-expect-error - Reserved for future use
							// eslint-disable-next-line @typescript-eslint/no-unused-vars
							const _requestBody = params.toString();
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
										<div
											style={{
												marginBottom: '16px',
												padding: '12px',
												background: '#fef3c7',
												borderRadius: '6px',
											}}
										>
											<strong style={{ color: '#92400e', fontSize: '13px' }}>
												Authorization Header:
											</strong>
											<div
												style={{
													marginTop: '4px',
													fontSize: '13px',
													color: '#78350f',
													fontFamily: 'monospace',
												}}
											>
												Basic{' '}
												{btoa(
													`${credentials.clientId?.trim()}:${credentials.clientSecret?.trim()}`
												).substring(0, 20)}
												...
											</div>
											<p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#92400e' }}>
												Client credentials are sent in the Authorization header using HTTP Basic
												Authentication.
											</p>
										</div>
									)}
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
			let effectiveCodeChallengeMethod: 'S256' | 'plain' = 'S256'; // Default to S256

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
				// CRITICAL: Always use 'S256' - if stored codes have 'plain', they're from an old version
				// Using 'plain' would cause PKCE mismatch errors since we now always generate with S256
				// If the stored method is 'plain', we should regenerate codes, but for now force S256 to avoid immediate errors
				if (storedPKCE.codeChallengeMethod && storedPKCE.codeChallengeMethod !== 'S256') {
					console.warn(
						`${MODULE_TAG} ⚠️ Stored PKCE codes have codeChallengeMethod='${storedPKCE.codeChallengeMethod}' instead of 'S256'. ` +
						`This may cause PKCE mismatch. Please regenerate PKCE codes in Step 1.`
					);
				}
				effectiveCodeChallengeMethod = 'S256' as const;
				console.log(`${MODULE_TAG} ✅ Loaded PKCE codes from bulletproof storage`, {
					codeVerifierLength: effectiveCodeVerifier.length,
					codeChallengeLength: effectiveCodeChallenge.length,
					savedAt: new Date(storedPKCE.savedAt).toISOString(),
					storedMethod: storedPKCE.codeChallengeMethod,
					usingMethod: effectiveCodeChallengeMethod,
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
						`${MODULE_TAG} User must either: 1) Go to Step 0 (Configuration) and generate PKCE codes in Advanced Options, or 2) Disable PKCE in configuration`
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
				setValidationErrors(['Authorization code is required']);
				return;
			}

			// CRITICAL: If PKCE is required, we MUST have a code verifier
			// The service layer will reject the request if PKCE is required but no verifier is provided
			if (isPKCERequired && !effectiveCodeVerifier) {
				console.error(
					`${MODULE_TAG} ❌ VALIDATION FAILED: PKCE required but code verifier missing`
				);
				const errorMsg = `PKCE is ${credentials.pkceEnforcement || 'REQUIRED'} but code verifier is missing. Please go back to Step 0 (Configuration) and generate PKCE codes in Advanced Options.`;
				setError(errorMsg);
				setValidationErrors([errorMsg]);
				toastV8.error(errorMsg);
				return;
			}

			if (isPKCERequired && effectiveCodeVerifier) {
				console.log(
					`${MODULE_TAG} ✅ PKCE required and code verifier present - will use PKCE flow`
				);
			}

			// Validate credentials are present
			if (!credentials.clientId || !credentials.clientId.trim()) {
				console.error(`${MODULE_TAG} ❌ VALIDATION FAILED: Missing client ID`);
				const errorMsg =
					'Client ID is required for token exchange. Credentials may have been lost. Please check your configuration.';
				setError(errorMsg);
				setValidationErrors([errorMsg]);
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
				setValidationErrors([errorMsg]);
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
				setValidationErrors([errorMsg]);
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
				clientAuthMethod: credentials.clientAuthMethod || 'client_secret_post (default)',
			});

			// Final safety check: Ensure clientAuthMethod is synced from PingOne before token exchange
			// This catches cases where app config wasn't fetched earlier or credentials were loaded before app config
			let effectiveCredentials = credentials;
			if (credentials.clientId && credentials.environmentId && (!credentials.clientAuthMethod || credentials.clientAuthMethod === 'client_secret_post')) {
				try {
					const { workerTokenServiceV8 } = await import('@/v8/services/workerTokenServiceV8');
					const { ConfigCheckerServiceV8 } = await import('@/v8/services/configCheckerServiceV8');
					const workerToken = await workerTokenServiceV8.getToken();
					
					if (workerToken) {
						console.log(`${MODULE_TAG} 🔍 Final check: Fetching app config to ensure correct auth method...`);
						const appConfig = await ConfigCheckerServiceV8.fetchAppConfig(
							credentials.environmentId,
							credentials.clientId,
							workerToken
						);
						
						if (appConfig?.tokenEndpointAuthMethod && credentials.clientAuthMethod !== appConfig.tokenEndpointAuthMethod) {
							console.log(`${MODULE_TAG} ✅ Updating clientAuthMethod from PingOne before token exchange:`, {
								from: credentials.clientAuthMethod || 'client_secret_post (default)',
								to: appConfig.tokenEndpointAuthMethod,
							});
							// Create updated credentials with correct auth method from PingOne
							effectiveCredentials = {
								...credentials,
								clientAuthMethod: appConfig.tokenEndpointAuthMethod as 'client_secret_basic' | 'client_secret_post' | 'client_secret_jwt' | 'private_key_jwt' | 'none',
							};
						}
					}
				} catch (configError) {
					console.warn(`${MODULE_TAG} ⚠️ Failed to fetch app config before token exchange (continuing with current auth method):`, configError);
					// Continue with current auth method - don't fail token exchange
				}
			}

			setIsLoading(true);
			setError(null);
			setValidationErrors([]);

			try {
				console.log(`${MODULE_TAG} 🚀 Calling UnifiedFlowIntegrationV8U.exchangeCodeForTokens...`);
				console.log(`${MODULE_TAG} 🔑 Using code verifier:`, {
					hasCodeVerifier: !!effectiveCodeVerifier,
					codeVerifierLength: effectiveCodeVerifier?.length,
					codeVerifierPreview: `${effectiveCodeVerifier?.substring(0, 20)}...`,
				});
				console.log(`${MODULE_TAG} 🔐 Using auth method:`, {
					clientAuthMethod: effectiveCredentials.clientAuthMethod || 'client_secret_post (default)',
					source: effectiveCredentials.clientAuthMethod !== credentials.clientAuthMethod ? 'from PingOne (just fetched)' : credentials.clientAuthMethod ? 'from credentials' : 'default',
				});
				const tokens = await UnifiedFlowIntegrationV8U.exchangeCodeForTokens(
					flowType as 'oauth-authz' | 'hybrid',
					effectiveCredentials, // Use effective credentials with correct auth method
					flowState.authorizationCode,
					effectiveCodeVerifier // Use the effective code verifier (from flowState or sessionStorage)
				);

				console.log(`${MODULE_TAG} ✅ Token exchange successful!`, {
					hasAccessToken: !!tokens.access_token,
					hasIdToken: !!tokens.id_token,
					hasRefreshToken: !!tokens.refresh_token,
					expiresIn: tokens.expires_in,
					tokenType: tokens.token_type,
					enableRefreshToken: credentials.enableRefreshToken,
					scopesRequested: credentials.scopes,
					refreshTokenInResponse: !!tokens.refresh_token,
				});

				// Warn if refresh token was expected but not received
				if (credentials.enableRefreshToken && !tokens.refresh_token) {
					console.warn(`${MODULE_TAG} ⚠️ Refresh token expected but not received`, {
						enableRefreshToken: credentials.enableRefreshToken,
						scopesRequested: credentials.scopes,
						hasOfflineAccessScope: credentials.scopes?.includes('offline_access'),
						note: 'Check that Refresh Token grant is enabled in PingOne application settings',
					});
					toastV8.warning('Refresh token not received. Ensure Refresh Token grant is enabled in PingOne and offline_access scope is in allowed scopes.');
				}

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
				// Clear validation errors when tokens are successfully received
				setValidationErrors([]);

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

				// Check for specific PKCE mismatch error with 'plain' code_challenge_method
				// This happens when old PKCE codes with 'plain' method were used to generate the authorization URL
				if (message.includes('plain code_challenge_method') || (message.includes('code_verifier') && message.includes('plain'))) {
					console.error(`${MODULE_TAG} ❌ PKCE mismatch detected: Authorization URL was generated with 'plain' method`);
					
					// Automatically clear old PKCE codes with 'plain' method
					try {
						const storedPKCE = PKCEStorageServiceV8U.loadPKCECodes(flowKey);
						if (storedPKCE?.codeChallengeMethod === 'plain') {
							console.log(`${MODULE_TAG} 🗑️ Clearing old PKCE codes with 'plain' method...`);
							await PKCEStorageServiceV8U.clearPKCECodes(flowKey);
							// Also clear from flowState by creating new state without PKCE properties
							setFlowState((prev) => {
								// eslint-disable-next-line @typescript-eslint/no-unused-vars
								const { codeVerifier: _codeVerifier, codeChallenge: _codeChallenge, ...rest } = prev;
								return rest;
							});
							console.log(`${MODULE_TAG} ✅ Old PKCE codes cleared`);
						}
					} catch (clearError) {
						console.error(`${MODULE_TAG} Failed to clear old PKCE codes:`, clearError);
					}
					
					const enhancedMessage = `${message}\n\n🔧 FIX: Your authorization URL was generated with old PKCE codes using 'plain' method.\n\nPlease:\n1. Go back to Step 1 (Generate PKCE Parameters)\n2. Click "Generate PKCE Parameters" to create new codes with 'S256' method\n3. Go to Step 2 and click "Generate Authorization URL" again\n4. Complete authentication and try token exchange again\n\nNote: Old PKCE codes have been automatically cleared.`;
					setError(enhancedMessage);
					setValidationErrors([enhancedMessage]);
					toastV8.error('PKCE method mismatch - old codes cleared, please regenerate');
				} else if (message.includes('code_verifier') || message.includes('PKCE')) {
					const enhancedMessage = `${message}\n\n💡 This error means your PingOne application requires PKCE. Please:\n1. Go back to Step 0 (Configuration)\n2. Open Advanced Options\n3. Generate PKCE parameters\n4. Start the flow again from Step 1`;
					setError(enhancedMessage);
					setValidationErrors([enhancedMessage]);
					toastV8.error('PKCE required - please enable PKCE and restart the flow');
				} else {
					setError(message);
					setValidationErrors([message]);
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
				throw new Error(
					'Unable to fetch user information from the server. Please verify your access token is valid and has the required permissions.'
				);
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to fetch UserInfo';
			setUserInfoError(message);
			toastV8.error(message);
		} finally {
			setUserInfoLoading(false);
		}
	}, [
		credentials.environmentId,
		credentials.scopes,
		flowType,
		flowState.tokens?.accessToken,
		fetchUserInfoWithDiscovery,
	]);

	// Introspect token (access, refresh, or ID token)
	const handleIntrospectToken = useCallback(
		async (tokenType: 'access' | 'refresh' | 'id' = selectedTokenType) => {
			console.log(`${MODULE_TAG} ========== TOKEN INTROSPECTION START ==========`);
			console.log(`${MODULE_TAG} Introspecting ${tokenType} token`);
			console.log(`${MODULE_TAG} Credentials check:`, {
				hasEnvironmentId: !!credentials.environmentId,
				hasClientId: !!credentials.clientId,
				hasClientSecret: !!credentials.clientSecret,
				hasAccessToken: !!flowState.tokens?.accessToken,
				hasRefreshToken: !!flowState.tokens?.refreshToken,
				hasIdToken: !!flowState.tokens?.idToken,
				clientAuthMethod: credentials.clientAuthMethod,
			});

			// Check if introspection is allowed for this specific token type
			let operation: 'introspect-access' | 'introspect-refresh' | 'introspect-id';
			switch (tokenType) {
				case 'access':
					operation = 'introspect-access';
					break;
				case 'refresh':
					operation = 'introspect-refresh';
					break;
				case 'id':
					operation = 'introspect-id';
					break;
			}

			const canIntrospect = TokenOperationsServiceV8.isOperationAllowed(
				flowType,
				credentials.scopes,
				operation
			);

			if (!canIntrospect) {
				const rules = TokenOperationsServiceV8.getOperationRules(flowType, credentials.scopes);
				let errorMsg: string;
				if (tokenType === 'refresh') {
					errorMsg = `Refresh token introspection is not available for this flow. ${rules.introspectionReason}`;
				} else if (tokenType === 'id') {
					errorMsg = `ID token introspection is not recommended. ID tokens should be validated locally using JWT verification, not via the introspection endpoint.`;
				} else {
					errorMsg = `Access token introspection is not available for this flow. ${rules.introspectionReason}`;
				}
				console.warn(`${MODULE_TAG} ${errorMsg}`);
				toastV8.error(errorMsg);
				setIntrospectionError(errorMsg);
				return;
			}

			// Check for public client (no authentication)
			if (credentials.clientAuthMethod === 'none') {
				const errorMsg =
					'Token introspection requires client authentication. Public clients (clientAuthMethod: "none") cannot authenticate to the introspection endpoint. To use introspection, configure your application with client_secret_basic or client_secret_post authentication.';
				console.warn(`${MODULE_TAG} ${errorMsg}`);
				toastV8.error(errorMsg);
				setIntrospectionError(errorMsg);
				return;
			}

			// Get the token to introspect based on token type
			let tokenToIntrospect: string | undefined;
			let tokenName: string;
			switch (tokenType) {
				case 'access':
					tokenToIntrospect = flowState.tokens?.accessToken;
					tokenName = 'Access Token';
					break;
				case 'refresh':
					tokenToIntrospect = flowState.tokens?.refreshToken;
					tokenName = 'Refresh Token';
					break;
				case 'id':
					tokenToIntrospect = flowState.tokens?.idToken;
					tokenName = 'ID Token';
					break;
			}

			if (
				!credentials.environmentId ||
				!credentials.clientId ||
				!credentials.clientSecret ||
				!tokenToIntrospect
			) {
				const errorMsg = `Missing required ${tokenName.toLowerCase()} for token introspection`;
				console.error(`${MODULE_TAG} ${errorMsg}`, {
					environmentId: credentials.environmentId,
					clientId: credentials.clientId,
					clientSecret: credentials.clientSecret ? 'present' : 'missing',
					tokenType,
					tokenAvailable: !!tokenToIntrospect,
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
					console.warn(
						`${MODULE_TAG} Discovery failed or no introspection endpoint, using fallback`,
						{
							introspectionEndpoint,
							discoveryError: discoveryResult.error,
						}
					);
				} else {
					introspectionEndpoint = discoveryResult.data.introspectionEndpoint;
				}

				console.log(`${MODULE_TAG} Introspecting token at endpoint`, { introspectionEndpoint });

				// Use backend proxy to avoid CORS issues
				// Use relative URL in development to go through Vite proxy (avoids SSL errors)
				const proxyEndpoint =
					process.env.NODE_ENV === 'production'
						? 'https://oauth-playground.vercel.app/api/introspect-token'
						: '/api/introspect-token';

				console.log(`${MODULE_TAG} Sending introspection request via proxy:`, {
					tokenType,
					tokenLength: tokenToIntrospect.length,
					clientId: credentials.clientId,
					introspectionEndpoint,
					proxyEndpoint,
				});

				// Track API call for display
				const { apiCallTrackerService: apiCallTrackerService5 } = await import('@/services/apiCallTrackerService');
				const startTime5 = Date.now();
				const requestBody5 = {
					token: '***REDACTED***',
					token_type_hint:
						tokenType === 'refresh'
							? 'refresh_token'
							: tokenType === 'id'
								? 'id_token'
								: 'access_token',
					client_id: credentials.clientId,
					client_secret: '***REDACTED***',
					introspection_endpoint: introspectionEndpoint,
					token_auth_method: credentials.clientAuthMethod || 'client_secret_post',
				};

				const callId5 = apiCallTrackerService5.trackApiCall({
					method: 'POST',
					url: proxyEndpoint,
					actualPingOneUrl: introspectionEndpoint,
					isProxy: true,
					headers: {
						'Content-Type': 'application/json',
					},
					body: requestBody5,
					step: `unified-introspect-${tokenType}`,
					flowType: 'unified',
				});

				const response = await fetch(proxyEndpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						token: tokenToIntrospect,
						token_type_hint:
							tokenType === 'refresh'
								? 'refresh_token'
								: tokenType === 'id'
									? 'id_token'
									: 'access_token',
						client_id: credentials.clientId,
						client_secret: credentials.clientSecret,
						introspection_endpoint: introspectionEndpoint,
						token_auth_method: credentials.clientAuthMethod || 'client_secret_post',
					}),
				});

				// Parse response once (clone first to avoid consuming the body)
				const responseClone5 = response.clone();
				let responseData5: unknown;
				try {
					responseData5 = await responseClone5.json();
				} catch {
					responseData5 = { error: 'Failed to parse response' };
				}

				// Update API call with response
				apiCallTrackerService5.updateApiCallResponse(
					callId5,
					{
						status: response.status,
						statusText: response.statusText,
						data: responseData5,
					},
					Date.now() - startTime5
				);

				console.log(`${MODULE_TAG} Introspection response status:`, {
					status: response.status,
					statusText: response.statusText,
					ok: response.ok,
				});

				if (!response.ok) {
					const errorData = responseData5 as { error?: string; message?: string };
					const errorText = errorData.error || errorData.message || 'Unknown error';
					console.error(`${MODULE_TAG} Introspection error response:`, errorText);
					throw new Error(
						`Token introspection failed: ${response.status} ${response.statusText} - ${errorText}`
					);
				}

				const data = responseData5 as Record<string, unknown>;
				console.log(`${MODULE_TAG} Introspection data received:`, data);

				setIntrospectionData(data);
				setIntrospectionTokenType(tokenType);
				toastV8.success(`${tokenName} introspected successfully!`);
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
		},
		[
			selectedTokenType,
			credentials.environmentId,
			credentials.clientId,
			credentials.clientSecret,
			credentials.clientAuthMethod,
			flowState.tokens?.accessToken,
			flowState.tokens?.refreshToken,
			flowState.tokens?.idToken,
		]
	);

	// Handle token refresh
	const handleRefreshToken = useCallback(async () => {
		if (!flowState.tokens?.refreshToken) {
			toastV8.error('Refresh token not available');
			return;
		}

		if (!credentials.environmentId || !credentials.clientId) {
			toastV8.error('Missing credentials required for token refresh');
			return;
		}

		setRefreshLoading(true);
		setRefreshError(null);
		setRefreshResult(null);

		try {
			const { OAuthIntegrationServiceV8 } = await import('@/v8/services/oauthIntegrationServiceV8');

			// Store old tokens for comparison
			const oldTokens = {
				...(flowState.tokens?.accessToken && { accessToken: flowState.tokens.accessToken }),
				...(flowState.tokens?.refreshToken && { refreshToken: flowState.tokens.refreshToken }),
			};

			// Refresh the token
			if (!flowState.tokens?.refreshToken) {
				throw new Error('No refresh token available to refresh access token');
			}
			
			if (!credentials.redirectUri || !credentials.scopes) {
				throw new Error('Redirect URI and scopes are required for token refresh');
			}

			const newTokenResponse = await OAuthIntegrationServiceV8.refreshAccessToken(
				{
					environmentId: credentials.environmentId,
					clientId: credentials.clientId,
					...(credentials.clientSecret && { clientSecret: credentials.clientSecret }),
					redirectUri: credentials.redirectUri,
					scopes: credentials.scopes,
					clientAuthMethod: credentials.clientAuthMethod || 'client_secret_post',
				},
				flowState.tokens.refreshToken
			);

			// Update flow state with new tokens
			const newTokens = {
				accessToken: newTokenResponse.access_token,
				refreshToken: newTokenResponse.refresh_token || flowState.tokens.refreshToken, // May reuse refresh token
				expiresIn: newTokenResponse.expires_in,
			};

			// Update flow state
			setFlowState((prev) => ({
				...prev,
				tokens: {
					...prev.tokens,
					...(newTokens.accessToken && { accessToken: newTokens.accessToken }),
					...(newTokens.refreshToken && { refreshToken: newTokens.refreshToken }),
					...(newTokenResponse.id_token && { idToken: newTokenResponse.id_token }),
					...(newTokens.expiresIn && { expiresIn: newTokens.expiresIn }),
				},
			}));

			// Store result for visualization
			setRefreshResult({
				oldTokens,
				newTokens: {
					...(newTokens.accessToken && { accessToken: newTokens.accessToken }),
					...(newTokens.refreshToken && { refreshToken: newTokens.refreshToken }),
				},
			});

			toastV8.success('Access token refreshed successfully!');
			console.log(`${MODULE_TAG} ✅ Token refresh successful`, {
				hasNewAccessToken: !!newTokens.accessToken,
				hasNewRefreshToken: !!newTokens.refreshToken,
				expiresIn: newTokens.expiresIn,
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to refresh token';
			console.error(`${MODULE_TAG} ❌ Token refresh failed`, { error: message });
			setRefreshError(message);
			toastV8.error(message);
		} finally {
			setRefreshLoading(false);
		}
	}, [
		flowState.tokens,
		credentials.environmentId,
		credentials.clientId,
		credentials.clientSecret,
		credentials.clientAuthMethod,
		setFlowState,
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
								<strong style={{ color: '#92400e', fontSize: '14px' }}>
									Spec Compliance Notice
								</strong>
								<p
									style={{
										margin: '6px 0 0 0',
										fontSize: '13px',
										color: '#78350f',
										lineHeight: '1.5',
									}}
								>
									{specVersion === 'oauth2.0' && (
										<>
											<strong>OAuth 2.0</strong> only returns:{' '}
											<code
												style={{ background: '#fde68a', padding: '2px 6px', borderRadius: '3px' }}
											>
												access_token
											</code>{' '}
											and{' '}
											<code
												style={{ background: '#fde68a', padding: '2px 6px', borderRadius: '3px' }}
											>
												refresh_token
											</code>
										</>
									)}
									{specVersion === 'oauth2.1' && (
										<>
											<strong>OAuth 2.1 Authorization Framework (draft)</strong> only returns:{' '}
											<code
												style={{ background: '#fde68a', padding: '2px 6px', borderRadius: '3px' }}
											>
												access_token
											</code>{' '}
											and{' '}
											<code
												style={{ background: '#fde68a', padding: '2px 6px', borderRadius: '3px' }}
											>
												refresh_token
											</code>
										</>
									)}
								</p>
								<p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#92400e' }}>
									<strong>Note:</strong> PingOne may return an{' '}
									<code style={{ background: '#fde68a', padding: '2px 4px', borderRadius: '3px' }}>
										id_token
									</code>
									, but it's filtered out to follow the{' '}
									{specVersion === 'oauth2.0' ? 'OAuth 2.0 Authorization Framework (RFC 6749)' : 'OAuth 2.1 Authorization Framework (draft)'} spec. ID tokens are only
									part of <strong>OpenID Connect Core 1.0</strong>. Note: When OAuth 2.1 (draft) is combined with OpenID Connect Core 1.0, it means "OIDC Core 1.0 using OAuth 2.1 (draft) baseline" and includes id_token.
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
								<p
									style={{
										margin: '6px 0 0 0',
										fontSize: '13px',
										color: '#1e3a8a',
										lineHeight: '1.5',
									}}
								>
									<strong>OIDC Core 1.0</strong> returns:{' '}
									<code style={{ background: '#bfdbfe', padding: '2px 6px', borderRadius: '3px' }}>
										access_token
									</code>
									,{' '}
									<code style={{ background: '#bfdbfe', padding: '2px 6px', borderRadius: '3px' }}>
										id_token
									</code>
									, and{' '}
									<code style={{ background: '#bfdbfe', padding: '2px 6px', borderRadius: '3px' }}>
										refresh_token
									</code>
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
								Click "Next Step" or "View Introspection" to proceed to Token Introspection &
								UserInfo step. The introspection step will show you what operations are available
								for your flow, even if introspection or UserInfo cannot be used.
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
		// Use the actual scopes that were sent (including offline_access if enableRefreshToken was true)
		const scopesForRules = credentials.scopes || '';
		const operationRules = TokenOperationsServiceV8.getOperationRules(flowType, scopesForRules);
		
		// Debug logging
		console.log(`${MODULE_TAG} [INTROSPECTION] Operation rules check`, {
			flowType,
			scopes: scopesForRules,
			canIntrospectAccessToken: operationRules.canIntrospectAccessToken,
			canIntrospectRefreshToken: operationRules.canIntrospectRefreshToken,
			hasAccessToken: !!flowState.tokens?.accessToken,
			hasRefreshToken: !!flowState.tokens?.refreshToken,
			clientAuthMethod: credentials.clientAuthMethod,
			introspectionReason: operationRules.introspectionReason,
		});

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
					return 5; // Step 6 (PKCE is in Advanced Options, not a separate step)
				default:
					return 5; // Step 6 (PKCE is in Advanced Options, not a separate step)
			}
		})();

		return (
			<div className="step-content">
				<h2>Step {introspectionStepNumber + 1}: Token Introspection & UserInfo</h2>
				<p>
					Validate your access token and retrieve user information (optional). This step is always
					available to show you what operations are supported for your flow type and configuration.
				</p>

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
							Complete the previous steps to receive tokens. The buttons below will be enabled once
							tokens are available.
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
					<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
						<span style={{ fontSize: '24px' }}>👤</span>
						<h3
							style={{
								margin: 0,
								fontSize: '18px',
								color: operationRules.canCallUserInfo ? '#1e40af' : '#6b7280',
								flex: 1,
							}}
						>
							UserInfo
							{operationRules.canCallUserInfo ? (
								<span
									style={{
										marginLeft: '8px',
										fontSize: '14px',
										color: '#22c55e',
										fontWeight: 'normal',
									}}
								>
									✅ Available
								</span>
							) : (
								<span
									style={{
										marginLeft: '8px',
										fontSize: '14px',
										color: '#ef4444',
										fontWeight: 'normal',
									}}
								>
									❌ Not Available
								</span>
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

					<p
						style={{
							margin: '0 0 12px 0',
							color: operationRules.canCallUserInfo ? '#1e3a8a' : '#6b7280',
							fontSize: '14px',
						}}
					>
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
								background:
									!hasAccessToken || !operationRules.canCallUserInfo ? '#9ca3af' : '#0ea5e9',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								cursor:
									!hasAccessToken || !operationRules.canCallUserInfo ? 'not-allowed' : 'pointer',
								fontSize: '14px',
								fontWeight: '600',
								opacity: !hasAccessToken || !operationRules.canCallUserInfo ? 0.6 : 1,
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
						background: operationRules.canIntrospectAccessToken && hasAccessToken ? '#fef3c7' : '#f3f4f6', // Light yellow if allowed and token available, gray if not
						borderRadius: '8px',
						border: `1px solid ${operationRules.canIntrospectAccessToken && hasAccessToken ? '#f59e0b' : '#9ca3af'}`,
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
						<span style={{ fontSize: '24px' }}>🔍</span>
						<h3
							style={{
								margin: 0,
								fontSize: '18px',
								color: operationRules.canIntrospectAccessToken && hasAccessToken ? '#92400e' : '#6b7280',
								flex: 1,
							}}
						>
							Token Introspection
							{operationRules.canIntrospectAccessToken && hasAccessToken ? (
								<span
									style={{
										marginLeft: '8px',
										fontSize: '14px',
										color: '#22c55e',
										fontWeight: 'normal',
									}}
								>
									✅ Available
								</span>
							) : (
								<span
									style={{
										marginLeft: '8px',
										fontSize: '14px',
										color: '#ef4444',
										fontWeight: 'normal',
									}}
								>
									❌ {!hasAccessToken ? 'Access Token Required' : 'Not Available'}
								</span>
							)}
						</h3>
					</div>

					{/* Status explanation */}
					<div
						style={{
							padding: '12px',
							background: operationRules.canIntrospectAccessToken && hasAccessToken ? '#fef3c7' : '#fee2e2',
							border: `1px solid ${operationRules.canIntrospectAccessToken && hasAccessToken ? '#f59e0b' : '#ef4444'}`,
							borderRadius: '6px',
							marginBottom: '12px',
							color: operationRules.canIntrospectAccessToken && hasAccessToken ? '#78350f' : '#991b1b',
							fontSize: '14px',
						}}
					>
						<strong>{operationRules.canIntrospectAccessToken && hasAccessToken ? '✅ ' : '❌ '}</strong>
						{!hasAccessToken 
							? 'Access token required - complete the token exchange step first'
							: !operationRules.canIntrospectAccessToken
								? operationRules.introspectionReason
								: operationRules.introspectionReason
						}
						{operationRules.introspectionExplanation && (
							<div style={{ marginTop: '8px', fontSize: '13px', opacity: 0.9 }}>
								{operationRules.introspectionExplanation}
								{!hasAccessToken && (
									<div style={{ marginTop: '8px', fontWeight: '600' }}>
										💡 Complete Step 3 (Exchange Code for Tokens) to receive an access token.
									</div>
								)}
							</div>
						)}

						{/* Show what tokens can be introspected */}
						<div
							style={{
								marginTop: '12px',
								fontSize: '13px',
								paddingTop: '12px',
								borderTop: '1px solid rgba(0,0,0,0.1)',
							}}
						>
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
								{!operationRules.canIntrospectIdToken && hasIdToken && (
									<>
										{' - '}
										<span style={{ fontWeight: 600, color: '#dc2626' }}>
											Do not introspect ID tokens
										</span>
										<div style={{ 
											marginTop: '8px', 
											marginLeft: '20px',
											padding: '8px 12px',
											background: '#fef3c7',
											border: '1px solid #fbbf24',
											borderRadius: '6px',
											fontSize: '13px',
											lineHeight: '1.6'
										}}>
											<strong>Why?</strong> ID tokens are JWTs designed to be validated locally by your application, not by calling the introspection endpoint.
											<br /><br />
											<strong>How to validate:</strong>
											<ol style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
												<li>Verify the JWT signature using the JWKS endpoint</li>
												<li>Validate claims (iss, aud, exp, iat, nonce)</li>
												<li>Check the token hasn't expired</li>
											</ol>
											<div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
												<button
													type="button"
													onClick={() => setShowIdTokenValidationModal(true)}
													style={{
														padding: '10px 16px',
														background: '#667eea',
														color: 'white',
														border: 'none',
														borderRadius: '6px',
														fontSize: '13px',
														fontWeight: '500',
														cursor: 'pointer',
														display: 'inline-flex',
														alignItems: 'center',
														gap: '6px',
														alignSelf: 'flex-start',
													}}
												>
													🔐 Validate ID Token Locally
												</button>
												<a 
													href="https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation" 
													target="_blank" 
													rel="noopener noreferrer"
													style={{ 
														color: '#2563eb', 
														textDecoration: 'underline',
														fontWeight: 500,
														fontSize: '13px'
													}}
												>
													📖 Learn more: OIDC ID Token Validation Spec →
												</a>
											</div>
										</div>
									</>
								)}
							</li>
							</ul>
						</div>
					</div>

					<p
						style={{
							margin: '0 0 12px 0',
							color: operationRules.canIntrospectAccessToken ? '#78350f' : '#6b7280',
							fontSize: '14px',
						}}
					>
						Validate your tokens and retrieve their metadata.
					</p>

					{/* Token Type Selector */}
					<div
						style={{
							marginBottom: '12px',
							display: 'flex',
							gap: '8px',
							flexWrap: 'wrap',
						}}
					>
						<button
							type="button"
							onClick={() => {
								setSelectedTokenType('access');
								setIntrospectionData(null); // Clear previous introspection when switching
								setIntrospectionTokenType(null);
							}}
							disabled={!hasAccessToken}
							style={{
								padding: '8px 16px',
								background: selectedTokenType === 'access' ? '#f59e0b' : '#e5e7eb',
								color: selectedTokenType === 'access' ? 'white' : '#6b7280',
								border: `2px solid ${selectedTokenType === 'access' ? '#d97706' : '#d1d5db'}`,
								borderRadius: '6px',
								cursor: !hasAccessToken ? 'not-allowed' : 'pointer',
								fontSize: '14px',
								fontWeight: selectedTokenType === 'access' ? '600' : '400',
								opacity: !hasAccessToken ? 0.5 : 1,
							}}
							title={!hasAccessToken ? 'Access token not available' : 'Select Access Token'}
						>
							Access Token {hasAccessToken && '✓'}
						</button>
						<button
							type="button"
							onClick={() => {
								setSelectedTokenType('refresh');
								setIntrospectionData(null);
								setIntrospectionTokenType(null);
							}}
							disabled={!hasRefreshToken || !operationRules.canIntrospectRefreshToken}
							style={{
								padding: '8px 16px',
								background: selectedTokenType === 'refresh' ? '#f59e0b' : '#e5e7eb',
								color: selectedTokenType === 'refresh' ? 'white' : '#6b7280',
								border: `2px solid ${selectedTokenType === 'refresh' ? '#d97706' : '#d1d5db'}`,
								borderRadius: '6px',
								cursor:
									!hasRefreshToken || !operationRules.canIntrospectRefreshToken
										? 'not-allowed'
										: 'pointer',
								fontSize: '14px',
								fontWeight: selectedTokenType === 'refresh' ? '600' : '400',
								opacity: !hasRefreshToken || !operationRules.canIntrospectRefreshToken ? 0.5 : 1,
							}}
							title={
								!hasRefreshToken
									? 'Refresh token not available'
									: !operationRules.canIntrospectRefreshToken
										? 'Refresh token introspection not supported'
										: 'Select Refresh Token'
							}
						>
							Refresh Token {hasRefreshToken && operationRules.canIntrospectRefreshToken && '✓'}
						</button>
						<button
							type="button"
							onClick={() => {
								setSelectedTokenType('id');
								setIntrospectionData(null);
								setIntrospectionTokenType(null);
							}}
							disabled={!hasIdToken || !operationRules.canIntrospectIdToken}
							style={{
								padding: '8px 16px',
								background: selectedTokenType === 'id' ? '#f59e0b' : '#e5e7eb',
								color: selectedTokenType === 'id' ? 'white' : '#6b7280',
								border: `2px solid ${selectedTokenType === 'id' ? '#d97706' : '#d1d5db'}`,
								borderRadius: '6px',
								cursor:
									!hasIdToken || !operationRules.canIntrospectIdToken ? 'not-allowed' : 'pointer',
								fontSize: '14px',
								fontWeight: selectedTokenType === 'id' ? '600' : '400',
								opacity: !hasIdToken || !operationRules.canIntrospectIdToken ? 0.5 : 1,
							}}
							title={
								!hasIdToken
									? 'ID token not available'
									: !operationRules.canIntrospectIdToken
										? 'ID token introspection not recommended - validate locally instead'
										: 'Select ID Token'
							}
						>
							ID Token {hasIdToken && operationRules.canIntrospectIdToken && '✓'}
						</button>
					</div>

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
								✅{' '}
								{introspectionTokenType === 'access'
									? 'Access Token'
									: introspectionTokenType === 'refresh'
										? 'Refresh Token'
										: 'ID Token'}{' '}
								introspected successfully
							</div>
							{introspectionTokenType !== selectedTokenType && (
								<div
									style={{
										padding: '8px 12px',
										background: '#fef3c7',
										border: '1px solid #f59e0b',
										borderRadius: '6px',
										color: '#78350f',
										marginBottom: '12px',
										fontSize: '13px',
									}}
								>
									💡 Showing introspection for{' '}
									{introspectionTokenType === 'access'
										? 'Access Token'
										: introspectionTokenType === 'refresh'
											? 'Refresh Token'
											: 'ID Token'}
									. Select a different token type above to introspect it.
								</div>
							)}
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
							onClick={() => handleIntrospectToken(selectedTokenType)}
							disabled={
								(selectedTokenType === 'access' &&
									(!hasAccessToken || !operationRules.canIntrospectAccessToken)) ||
								(selectedTokenType === 'refresh' &&
									(!hasRefreshToken || !operationRules.canIntrospectRefreshToken)) ||
								(selectedTokenType === 'id' &&
									(!hasIdToken || !operationRules.canIntrospectIdToken)) ||
								introspectionLoading
							}
							style={{
								padding: '10px 16px',
								background:
									(selectedTokenType === 'access' &&
										(!hasAccessToken || !operationRules.canIntrospectAccessToken)) ||
									(selectedTokenType === 'refresh' &&
										(!hasRefreshToken || !operationRules.canIntrospectRefreshToken)) ||
									(selectedTokenType === 'id' &&
										(!hasIdToken || !operationRules.canIntrospectIdToken))
										? '#9ca3af'
										: '#22c55e', // Green color when enabled
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								cursor:
									(selectedTokenType === 'access' &&
										(!hasAccessToken || !operationRules.canIntrospectAccessToken)) ||
									(selectedTokenType === 'refresh' &&
										(!hasRefreshToken || !operationRules.canIntrospectRefreshToken)) ||
									(selectedTokenType === 'id' &&
										(!hasIdToken || !operationRules.canIntrospectIdToken))
										? 'not-allowed'
										: 'pointer',
								fontSize: '14px',
								fontWeight: '600',
								opacity:
									(selectedTokenType === 'access' &&
										(!hasAccessToken || !operationRules.canIntrospectAccessToken)) ||
									(selectedTokenType === 'refresh' &&
										(!hasRefreshToken || !operationRules.canIntrospectRefreshToken)) ||
									(selectedTokenType === 'id' &&
										(!hasIdToken || !operationRules.canIntrospectIdToken))
										? 0.6
										: 1,
							}}
							title={
								selectedTokenType === 'access' && !hasAccessToken
									? 'Access token required - complete previous steps first'
									: selectedTokenType === 'refresh' && !hasRefreshToken
										? 'Refresh token not available'
										: selectedTokenType === 'id' && !hasIdToken
											? 'ID token not available'
											: selectedTokenType === 'access' && !operationRules.canIntrospectAccessToken
												? operationRules.introspectionReason
												: selectedTokenType === 'refresh' &&
														!operationRules.canIntrospectRefreshToken
													? 'Refresh token introspection not supported'
													: selectedTokenType === 'id' && !operationRules.canIntrospectIdToken
														? 'ID token introspection not recommended'
														: `Introspect ${selectedTokenType === 'access' ? 'Access' : selectedTokenType === 'refresh' ? 'Refresh' : 'ID'} Token`
							}
						>
							{introspectionLoading
								? 'Introspecting...'
								: `Introspect ${selectedTokenType === 'access' ? 'Access' : selectedTokenType === 'refresh' ? 'Refresh' : 'ID'} Token`}
						</button>
					)}
				</div>

				{/* Token Refresh Section */}
				{hasRefreshToken && (
					<div
						style={{
							marginTop: '32px',
							padding: '16px',
							background: '#f0f9ff',
							borderRadius: '8px',
							border: '1px solid #0ea5e9',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
							<span style={{ fontSize: '24px' }}>🔄</span>
							<h3
								style={{
									margin: 0,
									fontSize: '18px',
									color: '#0c4a6e',
									flex: 1,
								}}
							>
								Token Refresh Flow
							</h3>
						</div>

						<p
							style={{
								margin: '0 0 12px 0',
								color: '#0c4a6e',
								fontSize: '14px',
							}}
						>
							Demonstrate token refresh: Use your refresh token to obtain a new access token without
							requiring the user to authenticate again.
						</p>

						{refreshError && (
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
								❌ {refreshError}
							</div>
						)}

						{refreshResult ? (
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
									✅ Token refreshed successfully!
								</div>

								{/* Token Comparison */}
								<div
									style={{
										display: 'grid',
										gridTemplateColumns: '1fr 1fr',
										gap: '12px',
										marginBottom: '12px',
									}}
								>
									{/* Old Token */}
									<div
										style={{
											padding: '12px',
											background: '#fef3c7',
											border: '1px solid #f59e0b',
											borderRadius: '6px',
										}}
									>
										<div
											style={{
												fontWeight: '600',
												marginBottom: '8px',
												color: '#78350f',
												fontSize: '13px',
											}}
										>
											Before Refresh:
										</div>
										<div style={{ fontSize: '12px', color: '#92400e', fontFamily: 'monospace' }}>
											Access Token: {refreshResult.oldTokens.accessToken?.substring(0, 20)}...
										</div>
									</div>

									{/* New Token */}
									<div
										style={{
											padding: '12px',
											background: '#d1fae5',
											border: '1px solid #22c55e',
											borderRadius: '6px',
										}}
									>
										<div
											style={{
												fontWeight: '600',
												marginBottom: '8px',
												color: '#065f46',
												fontSize: '13px',
											}}
										>
											After Refresh:
										</div>
										<div style={{ fontSize: '12px', color: '#047857', fontFamily: 'monospace' }}>
											Access Token: {refreshResult.newTokens.accessToken?.substring(0, 20)}...
										</div>
										{refreshResult.newTokens.expiresIn && (
											<div style={{ fontSize: '11px', color: '#047857', marginTop: '4px' }}>
												Expires in: {refreshResult.newTokens.expiresIn} seconds
											</div>
										)}
									</div>
								</div>

								{/* Educational Info */}
								<div
									style={{
										padding: '12px',
										background: '#dbeafe',
										border: '1px solid #3b82f6',
										borderRadius: '6px',
										fontSize: '13px',
										color: '#1e3a8a',
									}}
								>
									<strong>💡 Token Refresh Lifecycle:</strong>
									<ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', lineHeight: '1.6' }}>
										<li>
											Access tokens expire (typically 1 hour) and need to be refreshed
										</li>
										<li>
											Refresh tokens are long-lived and used to obtain new access tokens
										</li>
										<li>
											The refresh token may be rotated (new one issued) or reused depending on
											server configuration
										</li>
										<li>
											This allows users to stay authenticated without re-entering credentials
										</li>
									</ul>
								</div>

								<button
									type="button"
									onClick={() => {
										setRefreshResult(null);
										setRefreshError(null);
									}}
									style={{
										marginTop: '12px',
										padding: '8px 16px',
										background: '#6b7280',
										color: 'white',
										border: 'none',
										borderRadius: '6px',
										cursor: 'pointer',
										fontSize: '13px',
									}}
								>
									Clear Results
								</button>
							</>
						) : (
							<button
								type="button"
								onClick={handleRefreshToken}
								disabled={refreshLoading || !hasRefreshToken}
								style={{
									padding: '10px 16px',
									background: refreshLoading || !hasRefreshToken ? '#9ca3af' : '#0ea5e9',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									cursor: refreshLoading || !hasRefreshToken ? 'not-allowed' : 'pointer',
									fontSize: '14px',
									fontWeight: '600',
									opacity: refreshLoading || !hasRefreshToken ? 0.6 : 1,
								}}
								title={
									!hasRefreshToken
										? 'Refresh token not available'
										: refreshLoading
											? 'Refreshing token...'
											: 'Refresh access token using refresh token'
								}
							>
								{refreshLoading ? '🔄 Refreshing...' : '🔄 Refresh Access Token'}
							</button>
						)}
					</div>
				)}

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
								<li>
									<strong>Token Refresh:</strong> Obtains new access token using refresh token
								</li>
							</ul>
						</div>
					</div>
				</div>

				{/* View Documentation Button - At bottom of introspection step */}
				<div
					style={{
						marginTop: '32px',
						padding: '20px',
						background: '#f9fafb',
						borderRadius: '8px',
						border: '1px solid #e5e7eb',
						textAlign: 'center',
					}}
				>
					<p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280' }}>
						View complete API call documentation with all requests and responses
					</p>
					<button
						type="button"
						onClick={() => {
							// Navigate to documentation step
							nav.goToStep(totalSteps - 1);
						}}
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: '8px',
							padding: '12px 24px',
							background: '#3b82f6',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							fontSize: '14px',
							fontWeight: '600',
							cursor: 'pointer',
							transition: 'all 0.2s ease',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = '#2563eb';
							e.currentTarget.style.transform = 'translateY(-1px)';
							e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = '#3b82f6';
							e.currentTarget.style.transform = 'translateY(0)';
							e.currentTarget.style.boxShadow = 'none';
						}}
					>
						<FiBook size={18} />
						<span>View API Documentation</span>
					</button>
				</div>
			</div>
		);
	};

	// Step 7: API Documentation
	const renderStep7Documentation = () => {
		return (
			<UnifiedFlowDocumentationPageV8U
				flowType={flowType}
				specVersion={specVersion}
				credentials={credentials}
				currentStep={currentStep}
				totalSteps={totalSteps}
			/>
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
							The device authorization request has timed out. The user did not complete the
							authorization within the allowed time limit.
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

	// Device Code Success Modal - shown after successful device authorization
	const renderDeviceCodeSuccessModal = () => {
		if (!showDeviceCodeSuccessModal || !flowState.tokens?.accessToken) return null;

		return (
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="device-code-success-title"
				style={{
					display: showDeviceCodeSuccessModal ? 'flex' : 'none',
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
				onClick={() => setShowDeviceCodeSuccessModal(false)}
				onKeyDown={(e) => {
					if (e.key === 'Escape') {
						setShowDeviceCodeSuccessModal(false);
					}
				}}
			>
				<div
					style={{
						backgroundColor: 'white',
						borderRadius: '12px',
						padding: '32px',
						maxWidth: '550px',
						width: '100%',
						boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
						position: 'relative',
					}}
					onClick={(e) => e.stopPropagation()}
					onKeyDown={(e) => e.stopPropagation()}
				>
					{/* Header */}
					<div style={{ textAlign: 'center', marginBottom: '24px' }}>
						<div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
						<h2
							id="device-code-success-title"
							style={{
								margin: 0,
								fontSize: '24px',
								fontWeight: '700',
								color: '#059669',
							}}
						>
							Device Authorization Successful!
						</h2>
					</div>

					{/* Success Message */}
					<div
						style={{
							marginBottom: '24px',
							padding: '20px',
							background: '#d1fae5',
							borderRadius: '8px',
							border: '2px solid #10b981',
						}}
					>
						<div
							style={{
								fontSize: '16px',
								fontWeight: '600',
								color: '#065f46',
								marginBottom: '12px',
							}}
						>
							🎉 Access Token Received
						</div>
						<div
							style={{
								fontSize: '14px',
								color: '#047857',
								lineHeight: '1.6',
							}}
						>
							The device has been authorized successfully and tokens have been received. You can
							now proceed to view your tokens and use them for API calls.
						</div>
						{flowState.tokens?.expiresIn && (
							<div
								style={{
									marginTop: '12px',
									padding: '8px 12px',
									background: '#ecfdf5',
									borderRadius: '6px',
									fontSize: '13px',
									color: '#047857',
								}}
							>
								<strong>Token expires in:</strong> {flowState.tokens.expiresIn} seconds
							</div>
						)}
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
							onClick={() => setShowDeviceCodeSuccessModal(false)}
							style={{
								padding: '12px 24px',
								background: '#10b981',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								fontSize: '14px',
								fontWeight: '600',
								cursor: 'pointer',
								transition: 'all 0.2s ease',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = '#059669';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = '#10b981';
							}}
						>
							Continue to Tokens
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
							<div
								style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}
							>
								<span style={{ fontSize: '18px' }}>🎉</span>
								<strong style={{ color: '#065f46', fontSize: '14px' }}>Callback Processed</strong>
							</div>
							<ul
								style={{
									margin: '4px 0 0 0',
									paddingLeft: '20px',
									color: '#047857',
									fontSize: '13px',
									lineHeight: '1.5',
								}}
							>
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
								if (decoded?.payload) {
									const payload = decoded.payload as Record<string, unknown>;
									const username =
										payload.preferred_username || payload.name || payload.email || payload.sub;
									const sub = payload.sub;
									const subStr = typeof sub === 'string' ? sub : String(sub || '');

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
													<div
														style={{
															fontSize: '13px',
															color: '#065f46',
															fontWeight: '600',
															marginBottom: '2px',
														}}
													>
														👋 USERNAME
													</div>
													<div
														style={{
															fontSize: '14px',
															color: '#047857',
															fontWeight: '600',
															wordBreak: 'break-word',
														}}
													>
														{String(username)}
													</div>
													{subStr && (
														<div
															style={{
																fontSize: '11px',
																color: '#059669',
																marginTop: '4px',
																fontFamily: 'monospace',
																wordBreak: 'break-all',
															}}
														>
															# {subStr}
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
								if (decoded?.payload) {
									const payload = decoded.payload as Record<string, unknown>;

									// Extract common user claims
									const name =
										payload.name || payload.given_name || payload.preferred_username || payload.sub;
									const email = typeof payload.email === 'string' ? payload.email : undefined;
									const username =
										typeof payload.preferred_username === 'string'
											? payload.preferred_username
											: undefined;

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
												<div
													style={{
														display: 'flex',
														alignItems: 'center',
														gap: '10px',
														marginBottom: '8px',
													}}
												>
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
														<div
															style={{ fontSize: '16px', fontWeight: '600', marginBottom: '2px' }}
														>
															{String(name || 'User')}
														</div>
														{email && (
															<div style={{ fontSize: '12px', opacity: 0.9 }}>📧 {email}</div>
														)}
														{username && username !== email && (
															<div style={{ fontSize: '12px', opacity: 0.9 }}>🔑 {username}</div>
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
									![
										'access_token',
										'id_token',
										'refresh_token',
										'code',
										'state',
										'session_state',
									].includes(key)
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
							color: 'white', // White text on green background
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

	// Track previous step to only log when step changes (prevFlowTypeRef already exists above)
	const prevStepRef = useRef<number>(-1);

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
	 * Authorization Code / Hybrid (6 steps - PKCE in Advanced Options):
	 *   0: Config (parent) - PKCE configuration is in Advanced Options
	 *   1: Generate Authorization URL (with or without PKCE based on setting)
	 *   2: Handle Callback (extract authorization code)
	 *   3: Exchange Code for Tokens (with or without code_verifier based on PKCE setting)
	 *   4: Display Tokens
	 *   5: Introspection & UserInfo
	 *
	 * @returns {JSX.Element | null} The rendered step content, or null if step is invalid
	 */
	const renderStepContent = () => {
		// Only log when step or flow type changes (not on every render)
		if (prevStepRef.current !== currentStep || prevFlowTypeRef.current !== flowType) {
		console.log(`${MODULE_TAG} [STEP ROUTING] Rendering step content`, {
			currentStep,
			flowType,
			usePKCE: isPKCERequired,
			pkceEnforcement: credentials.pkceEnforcement,
			alwaysShowPKCE: flowType === 'oauth-authz' || flowType === 'hybrid',
		});
			prevStepRef.current = currentStep;
			// Note: prevFlowTypeRef is updated in the useEffect above, so we don't update it here
		}

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
				// For oauth-authz and hybrid, Step 1 is PKCE generation
				if (flowType === 'oauth-authz' || flowType === 'hybrid') {
					console.log(`${MODULE_TAG} [STEP ROUTING] Showing PKCE step (Step 1) for ${flowType}`);
					return renderStep1PKCE();
				}
				// For implicit flow, show Authorization URL step
				console.log(`${MODULE_TAG} [STEP ROUTING] Showing Auth URL step for ${flowType}`);
				return renderStep1AuthUrl();

			case 2:
				// For oauth-authz and hybrid, Step 2 is Authorization URL (after PKCE)
				if (flowType === 'oauth-authz' || flowType === 'hybrid') {
					console.log(
						`${MODULE_TAG} [STEP ROUTING] Showing Auth URL step (Step 2) for ${flowType}`
					);
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
				if (flowType === 'oauth-authz' || flowType === 'hybrid') {
					return renderStep2Callback();
				}
				// For implicit and device-code, Step 3 is Tokens
				if (flowType === 'implicit' || flowType === 'device-code') {
					return renderStep3Tokens();
				}
				// Client credentials - Step 3 is Introspection & UserInfo (after Tokens at step 2)
				if (flowType === 'client-credentials') {
					return renderStep6IntrospectionUserInfo();
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
				// Client credentials - Step 4 is Documentation (after Introspection at step 3)
				if (flowType === 'client-credentials') {
					return renderStep7Documentation();
				}
				// All other flows - shouldn't reach here
				return renderStep3Tokens();

			case 5:
				// For oauth-authz and hybrid, Step 5 is display tokens (after exchange)
				if (flowType === 'oauth-authz' || flowType === 'hybrid') {
					return renderStep3Tokens();
				}
				// For implicit and device-code, Step 5 is Documentation (after Introspection at step 4)
				if (flowType === 'implicit' || flowType === 'device-code') {
					return renderStep7Documentation();
				}
				return renderStep3Tokens();

			case 6:
				// For oauth-authz and hybrid, Step 6 is introspection & userinfo
				if (flowType === 'oauth-authz' || flowType === 'hybrid') {
					return renderStep6IntrospectionUserInfo();
				}
				// Implicit and device-code only have 6 steps (0-5), so step 6 doesn't exist for them
				// This case should not be reached for implicit/device-code flows
				return renderStep6IntrospectionUserInfo();

			case 7:
				// For oauth-authz and hybrid, Step 7 is documentation (after Introspection at step 6)
				if (flowType === 'oauth-authz' || flowType === 'hybrid') {
					return renderStep7Documentation();
				}
				return renderStep7Documentation();

			default:
				// Check if we're on the documentation step (last step)
				if (currentStep === totalSteps - 1) {
					return renderStep7Documentation();
				}
				// Check if we're on the introspection step (second to last)
				if (currentStep === totalSteps - 2) {
					return renderStep6IntrospectionUserInfo();
				}
				return null;
		}
	};

	return (
		<>
			<LoadingSpinnerModalV8U
				show={isLoading && !!loadingMessage && !(flowState.deviceCode && flowState.verificationUriComplete)}
				message={loadingMessage}
				theme="blue"
			/>
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

					{/* Next Button - Green with white text and arrow - Always show except on last step */}
					{currentStep < totalSteps - 1 && (() => {
						// Determine if we're on the token display step
						let isTokenStep = false;
						if (flowType === 'client-credentials') {
							isTokenStep = currentStep === 2; // Step 3 (0-indexed: 0, 1, 2)
						} else if (flowType === 'device-code' || flowType === 'implicit') {
							isTokenStep = currentStep === 3; // Step 4 (0-indexed: 0, 1, 2, 3)
						} else if (flowType === 'oauth-authz' || flowType === 'hybrid') {
							isTokenStep = currentStep === 5; // Step 6 (0-indexed: 0=Config, 1=PKCE, 2=AuthURL, 3=Callback, 4=Exchange, 5=Tokens)
						}
						
						// Enable button if tokens are present on token step, or if no validation errors
						const canProceed = isTokenStep && flowState.tokens?.accessToken 
							? true 
							: nav.canGoNext;
						
						return (
						<button
							type="button"
							className="btn btn-next"
							onClick={nav.goToNext}
								disabled={!canProceed}
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: '8px',
								minWidth: '120px',
							}}
								title={canProceed ? 'Proceed to next step' : 'Complete the current step first'}
						>
							<span>Next Step</span>
							<FiArrowRight size={16} style={{ marginLeft: '4px' }} />
						</button>
						);
					})()}
					{/* Always show navigation to introspection step from tokens step, even if validation errors exist */}
					{currentStep === totalSteps - 2 && flowState.tokens?.accessToken && (
						<button
							type="button"
							className="btn btn-next"
							onClick={() => navigateToStep(totalSteps - 1)}
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: '8px',
								minWidth: '120px',
								marginLeft: '8px',
							}}
							title="Go to Token Introspection & UserInfo step"
						>
							<span>View Introspection</span>
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

			{/* Device Code Success Modal */}
			{renderDeviceCodeSuccessModal()}

			{/* PingOne Request Details Modal */}
			{showPingOneRequestModal && pendingPingOneRequest && (
				<div
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: 'rgba(0, 0, 0, 0.5)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 10000,
					}}
					onClick={() => setShowPingOneRequestModal(false)}
				>
					<div
						style={{
							backgroundColor: 'white',
							borderRadius: '8px',
							padding: '24px',
							maxWidth: '800px',
							maxHeight: '90vh',
							overflow: 'auto',
							boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
						}}
						onClick={(e) => e.stopPropagation()}
					>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								marginBottom: '16px',
							}}
						>
							<h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
								PingOne Authorization Request
							</h2>
							<button
								type="button"
								onClick={() => setShowPingOneRequestModal(false)}
								style={{
									background: 'none',
									border: 'none',
									fontSize: '24px',
									cursor: 'pointer',
									color: '#6b7280',
								}}
							>
								×
							</button>
						</div>

						<div
							style={{
								marginBottom: '16px',
								padding: '12px',
								backgroundColor: '#eff6ff',
								borderRadius: '6px',
							}}
						>
							<p style={{ margin: 0, fontSize: '14px', color: '#1e40af' }}>
								<strong>What happens next?</strong> You're about to make a POST request to PingOne's
								authorization endpoint. This modal shows the request details that will be sent.
								After you click "Proceed", the request will be made and you may be prompted to enter
								your credentials.
							</p>
						</div>

						<div style={{ marginBottom: '16px' }}>
							<h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
								Request URL
							</h3>
							<div
								style={{
									padding: '12px',
									backgroundColor: '#f3f4f6',
									borderRadius: '6px',
									fontFamily: 'monospace',
									fontSize: '14px',
									wordBreak: 'break-all',
								}}
							>
								{pendingPingOneRequest.method} {pendingPingOneRequest.url}
							</div>
						</div>

						<div style={{ marginBottom: '16px' }}>
							<h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
								Request Body
							</h3>
							<div
								style={{
									padding: '12px',
									backgroundColor: '#f3f4f6',
									borderRadius: '6px',
									fontFamily: 'monospace',
									fontSize: '12px',
									overflow: 'auto',
									maxHeight: '400px',
								}}
							>
								<pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
									{JSON.stringify(pendingPingOneRequest.body, null, 2)}
								</pre>
							</div>
						</div>

						<div
							style={{
								display: 'flex',
								gap: '12px',
								justifyContent: 'flex-end',
								marginTop: '24px',
							}}
						>
							<button
								type="button"
								onClick={() => setShowPingOneRequestModal(false)}
								style={{
									padding: '10px 20px',
									background: '#6b7280',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									cursor: 'pointer',
									fontSize: '14px',
									fontWeight: '500',
								}}
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleProceedWithPingOneRequest}
								style={{
									padding: '10px 20px',
									background: '#2196f3',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									cursor: 'pointer',
									fontSize: '14px',
									fontWeight: '500',
								}}
							>
								Proceed to PingOne
							</button>
						</div>
					</div>
				</div>
			)}

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

			{/* Worker Token vs Client Credentials Education Modal */}
			<WorkerTokenVsClientCredentialsEducationModalV8
				isOpen={showWorkerTokenVsClientCredentialsModal}
				onClose={() => setShowWorkerTokenVsClientCredentialsModal(false)}
				context={flowType === 'client-credentials' ? 'client-credentials' : 'general'}
			/>

			{/* Password Change Modal */}
			{passwordChangeUserId && credentials.environmentId && (
				<PasswordChangeModal
					isOpen={showPasswordChangeModal}
					onClose={() => {
						setShowPasswordChangeModal(false);
						setPasswordChangeUserId(null);
						setPasswordChangeFlowId(null);
						setPasswordChangeState(null);
						setPasswordChangeUsername(null);
					}}
					onPasswordChange={handlePasswordChange}
					userId={passwordChangeUserId}
					environmentId={credentials.environmentId}
					message="Your password must be changed before you can continue. Please enter your current password and choose a new one."
				/>
			)}

			{/* Worker Token Modal */}
			{showWorkerTokenModal && (
				<WorkerTokenModalV8
					isOpen={showWorkerTokenModal}
					onClose={async () => {
						setShowWorkerTokenModal(false);
						// After modal closes, check if token is available and re-run validation
						const { WorkerTokenStatusServiceV8 } = await import('@/v8/services/workerTokenStatusServiceV8');
						const tokenStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
						if (tokenStatus.isValid) {
							// Re-run pre-flight validation
							setIsLoading(true);
							setLoadingMessage('🔍 Re-validating Configuration...');
							try {
								const { PreFlightValidationServiceV8 } = await import('@/v8/services/preFlightValidationServiceV8');
								const { workerTokenServiceV8 } = await import('@/v8/services/workerTokenServiceV8');
								
								const newWorkerToken = await workerTokenServiceV8.getToken();
								const newValidationResult = await PreFlightValidationServiceV8.validateBeforeAuthUrl({
									specVersion,
									flowType,
									credentials,
									...(newWorkerToken && { workerToken: newWorkerToken }),
								});
								
								// Update validation results
								if (newValidationResult.errors.length > 0) {
									const errorMessage = [
										'🔍 Pre-flight Validation Results:',
										'',
										'❌ ERRORS (must be fixed before proceeding):',
										...newValidationResult.errors.map(err => `  ${err}`),
										'',
										'🔧 How to Fix:',
										'1. Go to Step 0 (Configuration)',
										'2. Review and fix the errors listed above',
										'3. Try generating the authorization URL again',
										'',
										'⚠️ WARNING: If you proceed with errors, the authorization request will likely fail.'
									].join('\n');
									setError(errorMessage);
									setValidationErrors([errorMessage]);
									setValidationWarnings([]);
									toastV8.error('Pre-flight validation failed - check error details below');
								} else if (newValidationResult.warnings.length > 0) {
									const warningMessage = [
										'🔍 Pre-flight Validation Results:',
										'',
										'⚠️ WARNINGS (you can still proceed):',
										...newValidationResult.warnings.map(warn => `  ${warn}`),
										'',
										'✅ You can continue with the flow, but be aware that some validations were skipped.'
									].join('\n');
									setValidationWarnings([warningMessage]);
									setValidationErrors([]);
									toastV8.warning('Pre-flight validation warnings - check details below');
								} else {
									// No errors or warnings - validation passed
									setValidationWarnings([]);
									setValidationErrors([]);
									toastV8.success('Pre-flight validation passed!');
								}
							} catch (error) {
								console.error(`${MODULE_TAG} Error re-running validation after token retrieval:`, error);
								toastV8.error('Failed to re-run validation. Please try again.');
							} finally {
								setIsLoading(false);
								setLoadingMessage('');
							}
						}
					}}
				/>
			)}

			{/* ID Token Validation Modal */}
			<IDTokenValidationModalV8U
				isOpen={showIdTokenValidationModal}
				onClose={() => setShowIdTokenValidationModal(false)}
				idToken={flowState.tokens?.idToken || ''}
				clientId={credentials.clientId}
				environmentId={credentials.environmentId}
				nonce={flowState.nonce}
			/>
		</>
	);
};

export default UnifiedFlowSteps;
