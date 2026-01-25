/**
 * @file CredentialsFormV8U.tsx
 * @module v8u/components
 * @description Full-featured credentials form with all V7 functionality
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Features:
 * - OIDC Discovery integration
 * - All credential fields (environmentId, clientId, secret, redirect URIs, scopes, etc.)
 * - Advanced configuration (response type, client auth method, JWKS)
 * - Flow-specific field visibility
 * - Smart defaults to minimize user input
 * - Light blue header styling
 * - Full V7 feature parity
 *
 * @example
 * <CredentialsFormV8U
 *   flowKey="oauth-authz-v8"
 *   credentials={credentials}
 *   onChange={setCredentials}
 *   flowType="oauth"
 * />
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiChevronDown, FiChevronUp, FiEye, FiEyeOff, FiInfo } from 'react-icons/fi';
import { DraggableModal } from '@/components/DraggableModal';
import { JWTConfigV8 } from '@/components/JWTConfigV8';
import type { ResponseMode } from '@/services/responseModeService';
import type { DiscoveredApp } from '@/v8/components/AppPickerV8';
import { ClientTypeRadioV8 } from '@/v8/components/ClientTypeRadioV8';
import { type DisplayMode, DisplayModeDropdownV8 } from '@/v8/components/DisplayModeDropdownV8';
import { IssuerURLInputV8 } from '@/v8/components/IssuerURLInputV8';
import { LoginHintInputV8 } from '@/v8/components/LoginHintInputV8';
import { MaxAgeInputV8 } from '@/v8/components/MaxAgeInputV8';
import {
	OidcDiscoveryModalV8,
	type OidcDiscoveryResult,
} from '@/v8/components/OidcDiscoveryModalV8';
import { PKCEEnforcementDropdownV8 } from '@/v8/components/PKCEEnforcementDropdownV8';
import { PKCEInputV8, type PKCEMode } from '@/v8/components/PKCEInputV8';
import { ResponseModeDropdownV8 } from '@/v8/components/ResponseModeDropdownV8';
import { ResponseTypeDropdownV8 } from '@/v8/components/ResponseTypeDropdownV8';
import { TokenEndpointAuthMethodDropdownV8 } from '@/v8/components/TokenEndpointAuthMethodDropdownV8';
import { TooltipV8 } from '@/v8/components/TooltipV8';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';
import { WorkerTokenVsClientCredentialsEducationModalV8 } from '@/v8/components/WorkerTokenVsClientCredentialsEducationModalV8';
import { AppDiscoveryServiceV8 } from '@/v8/services/appDiscoveryServiceV8';
import { ConfigCheckerServiceV8 } from '@/v8/services/configCheckerServiceV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { FeatureFlagService } from '@/services/featureFlagService';
import { CredentialsRepository } from '@/services/credentialsRepository';
import { EnvironmentIdServiceV8 } from '@/v8/services/environmentIdServiceV8';
import { FlowOptionsServiceV8 } from '@/v8/services/flowOptionsServiceV8';
import { OidcDiscoveryServiceV8 } from '@/v8/services/oidcDiscoveryServiceV8';
import { RedirectUriServiceV8 } from '@/v8/services/redirectUriServiceV8';
import { ResponseTypeServiceV8 } from '@/v8/services/responseTypeServiceV8';
import { SharedCredentialsServiceV8 } from '@/v8/services/sharedCredentialsServiceV8';
import {
	type FlowType,
	type SpecVersion,
	SpecVersionServiceV8,
} from '@/v8/services/specVersionServiceV8';
import { TokenEndpointAuthMethodServiceV8 } from '@/v8/services/tokenEndpointAuthMethodServiceV8';
import { TooltipContentServiceV8 } from '@/v8/services/tooltipContentServiceV8';
import { MFAConfigurationServiceV8 } from '@/v8/services/mfaConfigurationServiceV8';
import { UnifiedFlowOptionsServiceV8 } from '@/v8/services/unifiedFlowOptionsServiceV8';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { AppDiscoveryModalV8U } from './AppDiscoveryModalV8U';

type ClientType = 'public' | 'confidential';
type AppType = 'web' | 'spa' | 'mobile' | 'desktop' | 'cli' | 'm2m' | 'backend';

const MODULE_TAG = '[📋 CREDENTIALS-FORM-V8]';

export interface CredentialsFormV8UProps {
	flowKey: string;
	flowType?: FlowType;
	credentials: {
		environmentId: string;
		clientId: string;
		clientSecret?: string;
		redirectUri?: string;
		postLogoutRedirectUri?: string;
		logoutUri?: string;
		scopes?: string;
		clientAuthMethod?:
			| 'none'
			| 'client_secret_basic'
			| 'client_secret_post'
			| 'client_secret_jwt'
			| 'private_key_jwt';
		responseType?: string;
		issuerUrl?: string;
		prompt?: 'none' | 'login' | 'consent';
		loginHint?: string;
		maxAge?: number;
		display?: 'page' | 'popup' | 'touch' | 'wap';
		responseMode?: string;
		[key: string]: unknown;
	};
	onChange: (credentials: unknown) => void;
	appConfig?: {
		clientId?: string;
		redirectUris?: string[];
		logoutUris?: string[];
		scopes?: string[];
	};
	title?: string;
	subtitle?: string;
	showRedirectUri?: boolean;
	showPostLogoutRedirectUri?: boolean;
	showLoginHint?: boolean;
	showClientAuthMethod?: boolean;
	onRedirectUriChange?: (needsUpdate: boolean) => void;
	onLogoutUriChange?: (needsUpdate: boolean) => void;
	onDiscoveryComplete?: (result: unknown) => void;
	onAppTypeChange?: (appType: AppType, suggestedFlowType?: FlowType) => void;
}

/**
 * CredentialsFormV8U - Unified credentials form component for all OAuth flows
 *
 * This component provides a single, unified interface for configuring OAuth credentials
 * across all flow types. It handles:
 * - Credential input and validation
 * - OIDC discovery for automatic configuration
 * - Application type selection and flow recommendations
 * - PKCE configuration
 * - Client authentication method selection (basic, post, JWT)
 * - Advanced options (refresh tokens, redirect URIs, scopes)
 *
 * Key features:
 * - Auto-suggests flow type based on application type
 * - Auto-enables PKCE for recommended flows
 * - Validates credentials against spec version requirements
 * - Persists credentials to localStorage
 * - Integrates with worker token service for PingOne API access
 *
 * @component
 * @param {CredentialsFormV8UProps} props - Component props
 * @returns {JSX.Element} The credentials form UI
 */
export const CredentialsFormV8U: React.FC<CredentialsFormV8UProps> = ({
	flowKey,
	flowType: providedFlowType,
	credentials,
	onChange,
	appConfig,
	title,
	subtitle,
	showLoginHint = true,
	showClientAuthMethod = true,
	onDiscoveryComplete,
	onAppTypeChange,
}) => {
	// UI state - controls section visibility
	const [isExpanded, setIsExpanded] = useState(true);
	const [showAdvancedSection, setShowAdvancedSection] = useState(true);
	const [showGeneralSection, setShowGeneralSection] = useState(true);

	// OIDC discovery state
	const [discoveryInput, setDiscoveryInput] = useState('');
	const [isDiscovering, setIsDiscovering] = useState(false);

	/**
	 * PKCE (Proof Key for Code Exchange) enforcement state
	 *
	 * PKCE is a security extension for OAuth 2.0 that:
	 * - Prevents authorization code interception attacks
	 * - Required for OAuth 2.1 public clients
	 * - Recommended for all clients (even confidential ones)
	 *
	 * Enforcement levels:
	 * - OPTIONAL: PKCE is optional, can proceed without codes
	 * - REQUIRED: PKCE must be used (allows S256 or plain)
	 * - S256_REQUIRED: PKCE must be used with S256 method only (most secure)
	 *
	 * Loads initial value from credentials or app config to preserve user preference.
	 */
	const [pkceEnforcement, setPkceEnforcement] = useState<'OPTIONAL' | 'REQUIRED' | 'S256_REQUIRED'>(
		(): 'OPTIONAL' | 'REQUIRED' | 'S256_REQUIRED' => {
			// Priority: credentials.pkceEnforcement > appConfig > legacy usePKCE > default OPTIONAL
			if (
				credentials.pkceEnforcement &&
				(credentials.pkceEnforcement === 'OPTIONAL' ||
					credentials.pkceEnforcement === 'REQUIRED' ||
					credentials.pkceEnforcement === 'S256_REQUIRED')
			) {
				return credentials.pkceEnforcement;
			}
			// Check app config from PingOne
			if (appConfig) {
				const appConfigExtended = appConfig as {
					pkceEnforced?: boolean;
					pkceRequired?: boolean;
					[key: string]: unknown;
				};
				if (appConfigExtended.pkceEnforced === true) {
					return 'S256_REQUIRED'; // pkceEnforced typically means S256_REQUIRED
				}
				if (appConfigExtended.pkceRequired === true) {
					return 'REQUIRED';
				}
			}
			// Legacy: check usePKCE boolean (backward compatibility)
			if (credentials.usePKCE === true) {
				return 'REQUIRED'; // Default to REQUIRED if usePKCE was true
			}
			return 'OPTIONAL'; // Default to OPTIONAL
		}
	);

	// Legacy usePKCE computed from pkceEnforcement (for backward compatibility)
	const usePKCE = pkceEnforcement !== 'OPTIONAL';

	/**
	 * Refresh token state
	 *
	 * Refresh tokens allow applications to obtain new access tokens without
	 * requiring user re-authentication. They are:
	 * - Optional in OAuth 2.0
	 * - Recommended for long-lived applications
	 * - Required for offline access scenarios
	 *
	 * Loads initial value from credentials to preserve user preference.
	 * Auto-enables if offline_access scope is present.
	 */
	const [enableRefreshToken, setEnableRefreshToken] = useState(() => {
		// Check if offline_access is in scopes
		const hasOfflineAccess = credentials.scopes?.split(/\s+/).includes('offline_access');

		// Load from credentials if available, otherwise check scopes, default to false
		if (typeof credentials.enableRefreshToken === 'boolean') {
			return credentials.enableRefreshToken;
		}
		return hasOfflineAccess || false;
	});

	/**
	 * Redirectless authentication state
	 *
	 * Redirectless authentication allows token exchange without browser redirects.
	 * This is useful for:
	 * - Server-side applications
	 * - Mobile apps with custom URL schemes
	 * - Applications that can't handle redirects
	 *
	 * Loads initial value from credentials to preserve user preference.
	 */
	const [responseMode, setResponseMode] = useState<ResponseMode>(() => {
		// Load from credentials if available
		if (credentials.responseMode) {
			return credentials.responseMode as ResponseMode;
		}
		// Legacy: Convert useRedirectless to response_mode
		if (credentials.useRedirectless) {
			return 'pi.flow';
		}
		// Default: query for authz flows, fragment for implicit/hybrid
		// Use providedFlowType since flowType is not yet defined at this point
		const currentFlowType = providedFlowType || 'oauth-authz';
		return currentFlowType === 'implicit' || currentFlowType === 'hybrid' ? 'fragment' : 'query';
	});

	/**
	 * OAuth/OIDC advanced parameters state
	 */
	const [loginHint, setLoginHint] = useState<string>(credentials.loginHint || '');
	const [maxAge, setMaxAge] = useState<number | undefined>(credentials.maxAge);
	const [display, setDisplay] = useState<DisplayMode | undefined>(
		credentials.display as DisplayMode | undefined
	);

	/**
	 * PAR (Pushed Authorization Requests) state
	 * PAR (RFC 9126) allows clients to push authorization parameters to the server
	 * via an authenticated POST request before redirecting the user, enhancing security
	 * by preventing parameter tampering and supporting large/complex requests.
	 */
	const [usePAR, setUsePAR] = useState<boolean>(() => {
		return credentials.usePAR === true;
	});

	// UI state for modals and visibility toggles
	const [showClientSecret, setShowClientSecret] = useState(false);
	const [showRefreshTokenRules, setShowRefreshTokenRules] = useState(false);
	const [showPromptInfoModal, setShowPromptInfoModal] = useState(false);
	const [showPARInfoModal, setShowPARInfoModal] = useState(false);
	const [showScopesEducationModal, setShowScopesEducationModal] = useState(false);

	/**
	 * ⚠️ CRITICAL ANTI-JITTER FLAG - DO NOT REMOVE OR MODIFY WITHOUT READING THIS:
	 *
	 * This ref prevents UI jitter when toggling the "Enable Refresh Token" checkbox.
	 *
	 * Problem:
	 * - User toggles checkbox → onChange fires → saves to storage → component re-renders
	 * - Re-render triggers sync effect → detects change → saves again → infinite loop
	 * - This causes UI jitter and performance issues
	 *
	 * Solution:
	 * - Checkbox handler sets this flag to true before updating state
	 * - Sync effect checks this flag and skips save if true
	 * - Flag is reset after 300ms (enough time for state update to complete)
	 *
	 * If you modify this, test the refresh token checkbox thoroughly for jitter!
	 */
	const isUpdatingFromCheckbox = useRef(false);

	/**
	 * Track previous scopes to detect if change came from checkbox or external source
	 *
	 * This helps distinguish between:
	 * - User manually editing scopes (should save)
	 * - Checkbox auto-updating scopes (should use anti-jitter flag)
	 * - External credential updates (should sync)
	 */
	const previousScopesRef = useRef<string | undefined>(credentials.scopes);

	// Get config - use a default if not found to avoid breaking hooks
	const config = CredentialsServiceV8.getFlowConfig(flowKey) || {
		flowType: 'oauth' as const,
		includeClientSecret: true,
		includeScopes: true,
		includeRedirectUri: true,
	};

	const flowType = providedFlowType || config?.flowType || 'oauth';

	// Spec version derived from flowType prop (oidc -> 'oidc', otherwise 'oauth2.0')
	const specVersion: SpecVersion = useMemo(() => {
		// If flowType string is 'oidc', use 'oidc' spec version
		// Note: flowType is a string that can be 'oidc', while providedFlowType is FlowType enum
		if (flowType === 'oidc') {
			return 'oidc';
		}
		return 'oauth2.0';
	}, [flowType]);

	// Map flowType string to FlowType enum
	const selectedFlowType: FlowType = useMemo(() => {
		// Map string flowType to FlowType enum
		if (flowType === 'oauth' || flowType === 'oauth-authz') return 'oauth-authz';
		if (flowType === 'implicit') return 'implicit';
		if (flowType === 'hybrid') return 'hybrid';
		if (flowType === 'client-credentials') return 'client-credentials';
		if (flowType === 'device-code') return 'device-code';
		if (flowType === 'ropc') return 'ropc';
		return 'oauth-authz'; // default
	}, [flowType]);

	// Get available flows for current spec version
	const availableFlows = useMemo(
		() => SpecVersionServiceV8.getAvailableFlows(specVersion),
		[specVersion]
	);

	// Ensure selected flow is available for current spec
	const effectiveFlowType = useMemo(() => {
		if (availableFlows.includes(selectedFlowType)) {
			return selectedFlowType;
		}
		return availableFlows[0] || 'oauth-authz';
	}, [selectedFlowType, availableFlows]);

	/**
	 * Helper function to determine if PKCE is supported for the current flow type
	 * PKCE is only supported for flows that use authorization codes:
	 * - Authorization Code (oauth-authz) - YES
	 * - Hybrid - YES
	 * - Implicit - NO (uses tokens directly, no authorization code)
	 * - Client Credentials - NO (server-to-server, no user authorization)
	 * - Device Code - NO (uses device code, not authorization code)
	 */
	const supportsPKCE = useMemo(() => {
		return effectiveFlowType === 'oauth-authz' || effectiveFlowType === 'hybrid';
	}, [effectiveFlowType]);

	/**
	 * Determine recommended client type based on flow type and spec version
	 * - Client Credentials: Always confidential (requires client secret)
	 * - ROPC: Always confidential (requires client secret)
	 * - Implicit: Always public (no client secret)
	 * - Device Authorization: Usually public (but can be confidential)
	 * - Authorization Code:
	 *   - OAuth 2.1: Typically public with PKCE (best practice)
	 *   - OAuth 2.0/OIDC: Can be either, default to public
	 * - Hybrid: Usually public
	 */
	const getRecommendedClientType = useCallback(
		(flowType: FlowType, spec: SpecVersion): ClientType => {
			// Flows that always require confidential clients
			if (flowType === 'client-credentials' || flowType === 'ropc') {
				return 'confidential';
			}

			// Flows that are always public
			if (flowType === 'implicit') {
				return 'public';
			}

			// OAuth 2.1 best practice: public clients with PKCE
			if (spec === 'oauth2.1') {
				if (flowType === 'oauth-authz' || flowType === 'hybrid') {
					return 'public';
				}
			}

			// Device Authorization: typically public
			if (flowType === 'device-code') {
				return 'public';
			}

			// Hybrid: typically public
			if (flowType === 'hybrid') {
				return 'public';
			}

			// Default for Authorization Code: public (can be changed by user)
			if (flowType === 'oauth-authz') {
				return 'public';
			}

			// Default fallback
			return 'public';
		},
		[]
	);

	// Get application type label
	const getAppTypeLabel = useCallback((appType: AppType): string => {
		const labels: Record<AppType, string> = {
			web: 'Web Application',
			spa: 'Single Page Application (SPA)',
			mobile: 'Mobile Application',
			desktop: 'Desktop Application',
			cli: 'Command Line Interface (CLI)',
			m2m: 'Machine-to-Machine (M2M)',
			backend: 'Backend Service',
		};
		return labels[appType] || appType;
	}, []);

	// Get recommended application type for a flow type
	const getRecommendedAppType = useCallback((flowType: FlowType): AppType => {
		switch (flowType) {
			case 'client-credentials':
				return 'm2m'; // Machine-to-Machine
			case 'device-code':
				return 'cli'; // Command Line Interface
			case 'ropc':
				return 'mobile'; // Resource Owner Password Credentials (legacy, often mobile)
			case 'implicit':
				return 'spa'; // Implicit flow was designed for SPAs (now deprecated)
			case 'hybrid':
				return 'web'; // Hybrid flow for web apps
			case 'oauth-authz':
			default:
				return 'web'; // Authorization Code is most common for web apps
		}
	}, []);

	// Critical UI additions - Initialize from credentials if available
	const [clientType, setClientType] = useState<ClientType>(() => {
		// Load from credentials if available, otherwise use recommended based on flow type
		if (
			typeof credentials.clientType === 'string' &&
			(credentials.clientType === 'public' || credentials.clientType === 'confidential')
		) {
			return credentials.clientType as ClientType;
		}
		// Auto-select based on flow type and spec version
		return getRecommendedClientType(effectiveFlowType, specVersion);
	});
	const [appType, setAppType] = useState<AppType>(() => {
		// Load from credentials if available, otherwise default to 'web'
		if (typeof credentials.appType === 'string') {
			const validAppTypes: AppType[] = ['web', 'spa', 'mobile', 'desktop', 'cli', 'm2m', 'backend'];
			if (validAppTypes.includes(credentials.appType as AppType)) {
				return credentials.appType as AppType;
			}
		}
		return 'web';
	});

	// OIDC Discovery Modal
	const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
	const [discoveryResult, setDiscoveryResult] = useState<OidcDiscoveryResult | null>(null);
	const [showDiscoveryInfo, setShowDiscoveryInfo] = useState(false);

	// Worker Token Modal
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	// App Discovery Modal
	const [showAppDiscoveryModal, setShowAppDiscoveryModal] = useState(false);
	const [hasDiscoveredApps, setHasDiscoveredApps] = useState(false);
	const [highlightEmptyFields, setHighlightEmptyFields] = useState(false);
	const [tokenStatus, setTokenStatus] = useState(() =>
		WorkerTokenStatusServiceV8.checkWorkerTokenStatus()
	);
	
	// Worker Token Settings
	const [silentApiRetrieval, setSilentApiRetrieval] = useState(() => {
		try {
			const config = MFAConfigurationServiceV8.loadConfiguration();
			return config.workerToken.silentApiRetrieval;
		} catch {
			return false;
		}
	});
	const [showTokenAtEnd, setShowTokenAtEnd] = useState(() => {
		try {
			const config = MFAConfigurationServiceV8.loadConfiguration();
			return config.workerToken.showTokenAtEnd;
		} catch {
			return false;
		}
	});

	// Helper function to determine if a required field should have red outline
	const shouldHighlightField = useCallback(
		(fieldValue: string | undefined, isRequired: boolean): boolean => {
			if (!isRequired) return false;
			const isEmpty = !fieldValue || !fieldValue.trim();
			// Always highlight empty required fields
			return isEmpty;
		},
		[]
	);

	// Get red outline style for a field
	const getFieldErrorStyle = useCallback(
		(fieldValue: string | undefined, isRequired: boolean) => {
			if (shouldHighlightField(fieldValue, isRequired)) {
				return {
					border: '2px solid #ef4444',
					boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)',
				};
			}
			return {};
		},
		[shouldHighlightField]
	);

	// JWT Configuration Modals
	const [showClientSecretJwtModal, setShowClientSecretJwtModal] = useState(false);
	const [showPrivateKeyJwtModal, setShowPrivateKeyJwtModal] = useState(false);
	const [allowedScopes, setAllowedScopes] = useState<string[]>([]);
	const [isLoadingScopes, setIsLoadingScopes] = useState(false);

	// Load environment ID from global storage on mount (only once)
	useEffect(() => {
		const storedEnvId = EnvironmentIdServiceV8.getEnvironmentId();
		if (storedEnvId && !credentials.environmentId) {
			const updated = { ...credentials, environmentId: storedEnvId };
			onChange(updated);
		}
		// biome-ignore lint/correctness/useExhaustiveDependencies: Only run once on mount to prevent infinite loop
	}, []);

	// Sync checkbox values with credentials (for loading from storage)
	useEffect(() => {
		// If flow doesn't support PKCE, clear PKCE enforcement
		if (!supportsPKCE && pkceEnforcement !== 'OPTIONAL') {
			console.log(
				`${MODULE_TAG} Flow ${effectiveFlowType} does not support PKCE - clearing PKCE enforcement`
			);
			setPkceEnforcement('OPTIONAL');
			onChange({ ...credentials, pkceEnforcement: 'OPTIONAL', usePKCE: false });
		}

		// Load pkceEnforcement from credentials if available (priority over legacy usePKCE)
		// Only load if flow supports PKCE
		if (
			supportsPKCE &&
			credentials.pkceEnforcement &&
			(credentials.pkceEnforcement === 'OPTIONAL' ||
				credentials.pkceEnforcement === 'REQUIRED' ||
				credentials.pkceEnforcement === 'S256_REQUIRED') &&
			credentials.pkceEnforcement !== pkceEnforcement
		) {
			console.log(`${MODULE_TAG} Syncing pkceEnforcement from credentials`, {
				pkceEnforcement: credentials.pkceEnforcement,
			});
			setPkceEnforcement(credentials.pkceEnforcement);
		} else if (
			supportsPKCE &&
			!credentials.pkceEnforcement &&
			typeof credentials.usePKCE === 'boolean'
		) {
			// Legacy: sync from usePKCE boolean if pkceEnforcement is not set
			const legacyEnforcement = credentials.usePKCE ? 'REQUIRED' : 'OPTIONAL';
			if (legacyEnforcement !== pkceEnforcement) {
				console.log(`${MODULE_TAG} Syncing pkceEnforcement from legacy usePKCE`, {
					usePKCE: credentials.usePKCE,
					legacyEnforcement,
				});
				setPkceEnforcement(legacyEnforcement);
				// Note: Migration to pkceEnforcement will happen when user saves credentials
			}
		}

		// Load enableRefreshToken from credentials if available
		if (
			typeof credentials.enableRefreshToken === 'boolean' &&
			credentials.enableRefreshToken !== enableRefreshToken
		) {
			console.log(`${MODULE_TAG} Syncing enableRefreshToken from credentials`, {
				enableRefreshToken: credentials.enableRefreshToken,
			});
			setEnableRefreshToken(credentials.enableRefreshToken);
		}

		// Load responseMode from credentials if available
		if (credentials.responseMode && credentials.responseMode !== responseMode) {
			console.log(`${MODULE_TAG} Syncing responseMode from credentials`, {
				responseMode: credentials.responseMode,
			});
			setResponseMode(credentials.responseMode as ResponseMode);
		}
		// Legacy: Convert useRedirectless to responseMode
		else if (credentials.useRedirectless && responseMode !== 'pi.flow') {
			console.log(`${MODULE_TAG} Converting legacy useRedirectless to responseMode=pi.flow`);
			setResponseMode('pi.flow');
		}

		// Load loginHint from credentials if available
		if (credentials.loginHint !== undefined && credentials.loginHint !== loginHint) {
			console.log(`${MODULE_TAG} Syncing loginHint from credentials`, {
				loginHint: credentials.loginHint,
			});
			setLoginHint(credentials.loginHint);
		}

		// Load maxAge from credentials if available
		if (credentials.maxAge !== undefined && credentials.maxAge !== maxAge) {
			console.log(`${MODULE_TAG} Syncing maxAge from credentials`, {
				maxAge: credentials.maxAge,
			});
			setMaxAge(credentials.maxAge);
		}

		// Load display from credentials if available
		if (credentials.display && credentials.display !== display) {
			console.log(`${MODULE_TAG} Syncing display from credentials`, {
				display: credentials.display,
			});
			setDisplay(credentials.display as DisplayMode);
		}

		// Load usePAR from credentials if available
		if (credentials.usePAR !== undefined && credentials.usePAR !== usePAR) {
			console.log(`${MODULE_TAG} Syncing usePAR from credentials`, {
				usePAR: credentials.usePAR,
			});
			setUsePAR(credentials.usePAR === true);
		}

		// Auto-update client type when flow type or spec version changes
		const recommendedClientType = getRecommendedClientType(effectiveFlowType, specVersion);
		const requiresConfidential =
			effectiveFlowType === 'client-credentials' || effectiveFlowType === 'ropc';
		const requiresPublic = effectiveFlowType === 'implicit';

		// Only auto-update if:
		// 1. Flow requires a specific type (client-credentials/ropc = confidential, implicit = public), OR
		// 2. No clientType is set in credentials and we have a recommendation
		if (
			clientType !== recommendedClientType &&
			(requiresConfidential || requiresPublic || !credentials.clientType)
		) {
			console.log(`${MODULE_TAG} Auto-updating client type based on flow and spec`, {
				flowType: effectiveFlowType,
				specVersion,
				recommendedClientType,
				currentClientType: clientType,
				reason: requiresConfidential
					? 'flow requires confidential'
					: requiresPublic
						? 'flow requires public'
						: 'recommended for flow/spec',
			});
			setClientType(recommendedClientType);
			onChange({ ...credentials, clientType: recommendedClientType });
		}
		// Load clientType from credentials if available (only if not auto-updating)
		else if (
			typeof credentials.clientType === 'string' &&
			(credentials.clientType === 'public' || credentials.clientType === 'confidential') &&
			credentials.clientType !== clientType &&
			!requiresConfidential &&
			!requiresPublic
		) {
			console.log(`${MODULE_TAG} Syncing clientType from credentials`, {
				clientType: credentials.clientType,
			});
			setClientType(credentials.clientType as ClientType);
		}

		// Load appType from credentials if available
		if (typeof credentials.appType === 'string') {
			const validAppTypes: AppType[] = ['web', 'spa', 'mobile', 'desktop', 'cli', 'm2m', 'backend'];
			if (
				validAppTypes.includes(credentials.appType as AppType) &&
				credentials.appType !== appType
			) {
				console.log(`${MODULE_TAG} Syncing appType from credentials`, {
					appType: credentials.appType,
				});
				setAppType(credentials.appType as AppType);
			}
		}
	}, [
		credentials.pkceEnforcement,
		credentials.usePKCE,
		credentials.enableRefreshToken,
		credentials.responseMode,
		credentials.useRedirectless,
		credentials.loginHint,
		credentials.maxAge,
		credentials.display,
		credentials.clientType,
		credentials.appType,
		credentials.usePAR,
		pkceEnforcement,
		usePKCE,
		enableRefreshToken,
		responseMode,
		loginHint,
		supportsPKCE,
		effectiveFlowType,
		specVersion,
		onChange,
		credentials,
		maxAge,
		display,
		clientType,
		appType,
		usePAR,
		getRecommendedClientType,
		credentials.usePKCE,
		credentials.enableRefreshToken,
		credentials.responseMode,
		credentials.useRedirectless,
		credentials.loginHint,
		credentials.maxAge,
		credentials.display,
		credentials.clientType,
		credentials.appType,
		credentials.usePAR,
		pkceEnforcement,
		usePKCE,
		enableRefreshToken,
		responseMode,
		loginHint,
		supportsPKCE,
		effectiveFlowType,
		onChange,
		credentials,
		maxAge,
		display,
		clientType,
		appType,
		usePAR,
	]);

	// Auto-select recommended application type when flow type changes
	useEffect(() => {
		const recommendedAppType = getRecommendedAppType(effectiveFlowType);
		if (recommendedAppType !== appType) {
			console.log(`${MODULE_TAG} 🔄 Auto-selecting recommended app type for flow`, {
				flowType: effectiveFlowType,
				from: appType,
				to: recommendedAppType,
			});
			setAppType(recommendedAppType);

			// Update credentials with new app type
			onChange((prev: typeof credentials) => ({
				...prev,
				appType: recommendedAppType,
			}));

			// Notify parent about app type change
			if (onAppTypeChange) {
				onAppTypeChange(recommendedAppType, effectiveFlowType);
			}
		}
	}, [effectiveFlowType, getRecommendedAppType]); // Only run when flow type changes

	// Listen for environment ID updates
	useEffect(() => {
		const handleEnvIdUpdate = () => {
			const storedEnvId = EnvironmentIdServiceV8.getEnvironmentId();
			if (storedEnvId) {
				onChange((prev: typeof credentials) => {
					if (prev.environmentId !== storedEnvId) {
						return { ...prev, environmentId: storedEnvId };
					}
					return prev;
				});
			}
		};
		window.addEventListener('environmentIdUpdated', handleEnvIdUpdate);
		return () => window.removeEventListener('environmentIdUpdated', handleEnvIdUpdate);
		// biome-ignore lint/correctness/useExhaustiveDependencies: onChange uses functional update to prevent loops
	}, [credentials.environmentId]);

	// Check token status and listen for updates
	useEffect(() => {
		const checkStatus = () => {
			const status = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
			console.log(`${MODULE_TAG} Token status updated`, status);
			setTokenStatus(status);
		};

		// Check immediately
		checkStatus();

		// Check periodically
		const interval = setInterval(checkStatus, 60000);

		// Listen for token updates
		const handleTokenUpdate = () => {
			console.log(`${MODULE_TAG} Token update event received`);
			// Use a small delay to ensure storage is fully written
			setTimeout(() => {
				checkStatus();
			}, 50);
		};
		window.addEventListener('workerTokenUpdated', handleTokenUpdate);
		window.addEventListener('storage', handleTokenUpdate);

		return () => {
			clearInterval(interval);
			window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
			window.removeEventListener('storage', handleTokenUpdate);
		};
	}, []);

	// Listen for configuration updates
	useEffect(() => {
		const handleConfigUpdate = (event: Event) => {
			const customEvent = event as CustomEvent<{ workerToken?: { silentApiRetrieval?: boolean; showTokenAtEnd?: boolean } }>;
			if (customEvent.detail?.workerToken) {
				if (customEvent.detail.workerToken.silentApiRetrieval !== undefined) {
					setSilentApiRetrieval(customEvent.detail.workerToken.silentApiRetrieval);
				}
				if (customEvent.detail.workerToken.showTokenAtEnd !== undefined) {
					setShowTokenAtEnd(customEvent.detail.workerToken.showTokenAtEnd);
				}
			}
		};

		window.addEventListener('mfaConfigurationUpdated', handleConfigUpdate);

		return () => {
			window.removeEventListener('mfaConfigurationUpdated', handleConfigUpdate);
		};
	}, []);

	// ⚠️ CRITICAL: Sync refresh token checkbox with offline_access scope in scopes field
	// This effect keeps the checkbox in sync when scopes are changed externally (e.g., from scope buttons)
	// DO NOT MODIFY THIS WITHOUT UNDERSTANDING THE JITTER ISSUE:
	// - The checkbox onChange handler sets isUpdatingFromCheckbox.current = true
	// - This effect MUST skip when that flag is true to prevent infinite loops
	// - The flag is reset after 300ms to allow the update to propagate through React
	useEffect(() => {
		// CRITICAL: Skip sync if the change came from the checkbox itself
		// This prevents jitter by avoiding a save loop: checkbox -> onChange -> save -> re-render -> this effect -> save -> re-render...
		if (isUpdatingFromCheckbox.current) {
			console.log(`${MODULE_TAG} ⏭️ Skipping sync - update came from checkbox (preventing jitter)`);
			// Update the previous scopes ref so we don't trigger on next render
			previousScopesRef.current = credentials.scopes;
			return; // DO NOT reset the flag here - it's reset by setTimeout in the checkbox handler
		}

		// ADDITIONAL CHECK: Only sync if scopes actually changed from an external source
		// This prevents the effect from running when credentials object changes but scopes didn't
		if (previousScopesRef.current === credentials.scopes) {
			// Scopes didn't change, no need to sync
			return;
		}

		// Update the ref to track this value
		previousScopesRef.current = credentials.scopes;

		if (credentials.scopes) {
			const scopesArray = credentials.scopes.split(/\s+/).filter((s) => s.trim());
			const hasOfflineAccess = scopesArray.includes('offline_access');
			// Only update if state is out of sync
			if (hasOfflineAccess !== enableRefreshToken) {
				console.log(
					`${MODULE_TAG} 🔄 Syncing refresh token checkbox with scopes: ${hasOfflineAccess}`
				);
				setEnableRefreshToken(hasOfflineAccess);
			}
		} else {
			// If scopes is empty, ensure checkbox is unchecked
			if (enableRefreshToken) {
				console.log(`${MODULE_TAG} ❌ Clearing refresh token checkbox - no scopes`);
				setEnableRefreshToken(false);
			}
		}
	}, [credentials.scopes, enableRefreshToken]);

	// Fetch allowed scopes from PingOne when clientId and environmentId are available
	useEffect(() => {
		const fetchAllowedScopes = async () => {
			if (!credentials.clientId || !credentials.environmentId || !tokenStatus.isValid) {
				setAllowedScopes([]);
				return;
			}

			setIsLoadingScopes(true);
			try {
				// Get worker token directly from global service
				const workerTokenValue = await workerTokenServiceV8.getToken();
				if (!workerTokenValue) {
					console.log(`${MODULE_TAG} No worker token available to fetch allowed scopes`);
					setIsLoadingScopes(false);
					setAllowedScopes([]);
					return;
				}

				const appConfig = await ConfigCheckerServiceV8.fetchAppConfig(
					credentials.environmentId,
					credentials.clientId,
					workerTokenValue
				);

				if (appConfig?.allowedScopes) {
					console.log(`${MODULE_TAG} Fetched allowed scopes:`, appConfig.allowedScopes);
					setAllowedScopes(appConfig.allowedScopes);
				} else {
					// If no allowedScopes in response, use common OIDC scopes as fallback
					setAllowedScopes(['openid', 'profile', 'email', 'address', 'phone', 'offline_access']);
				}

				// Update clientAuthMethod from fetched app config if available
				// PingOne's tokenEndpointAuthMethod is the source of truth - always use it when available
				if (appConfig?.tokenEndpointAuthMethod) {
					const pingOneAuthMethod = appConfig.tokenEndpointAuthMethod;
					// Only update if different to avoid unnecessary state changes
					if (credentials.clientAuthMethod !== pingOneAuthMethod) {
						console.log(`${MODULE_TAG} Updating clientAuthMethod from PingOne app config:`, {
							pingOne: pingOneAuthMethod,
							current: credentials.clientAuthMethod,
						});
						handleChange('clientAuthMethod', pingOneAuthMethod);
					}
				}
			} catch (error) {
				console.error(`${MODULE_TAG} Error fetching allowed scopes:`, error);
				// Use common OIDC scopes as fallback
				setAllowedScopes(['openid', 'profile', 'email', 'address', 'phone', 'offline_access']);
			} finally {
				setIsLoadingScopes(false);
			}
		};

		fetchAllowedScopes();
	}, [credentials.clientId, credentials.environmentId, tokenStatus.isValid]);

	// Determine effective flow key based on PKCE toggle - use V8U suffix for V8U flows
	const effectiveFlowKey =
		usePKCE && effectiveFlowType === 'oauth-authz' ? 'pkce-v8u' : `${effectiveFlowType}-v8u`;

	// Get unified flow options - use base flow key (without -v8u suffix) for FlowOptionsServiceV8
	const flowOptionsKey =
		usePKCE && effectiveFlowType === 'oauth-authz' ? 'pkce-v8' : `${effectiveFlowType}-v8`;
	const flowOptions = useMemo(
		() => FlowOptionsServiceV8.getOptionsForFlow(flowOptionsKey),
		[flowOptionsKey]
	);

	// Get all auth methods with enabled/disabled status
	const allAuthMethodsWithStatus = useMemo(
		() =>
			TokenEndpointAuthMethodServiceV8.getAllAuthMethodsWithStatus(
				effectiveFlowType,
				specVersion,
				usePKCE
			),
		[effectiveFlowType, specVersion, usePKCE]
	);
	const validResponseTypes = useMemo(
		() => ResponseTypeServiceV8.getResponseTypes(effectiveFlowType, specVersion),
		[effectiveFlowType, specVersion]
	);
	const defaultAuthMethod = useMemo(
		() =>
			TokenEndpointAuthMethodServiceV8.getDefaultAuthMethod(
				effectiveFlowType,
				specVersion,
				usePKCE
			),
		[effectiveFlowType, specVersion, usePKCE]
	);
	const defaultResponseType = useMemo(
		() => ResponseTypeServiceV8.getDefaultResponseType(effectiveFlowType, specVersion),
		[effectiveFlowType, specVersion]
	);
	const checkboxAvailability = useMemo(
		() => UnifiedFlowOptionsServiceV8.getCheckboxAvailability(specVersion, effectiveFlowType),
		[specVersion, effectiveFlowType]
	);
	// Compliance warnings computed but not currently displayed in UI
	// const complianceWarnings = useMemo(
	// 	() => UnifiedFlowOptionsServiceV8.getComplianceWarnings(specVersion, effectiveFlowType),
	// 	[specVersion, effectiveFlowType]
	// );

	// Helper function to get the correct redirect flow key based on spec version and flow type
	const getRedirectFlowKey = useCallback(() => {
		let redirectFlowKey = effectiveFlowKey;

		// For OIDC flows, need to prefix with 'oidc-' for redirect URI service
		if (specVersion === 'oidc') {
			if (effectiveFlowType === 'oauth-authz') {
				redirectFlowKey = 'oidc-authz-v8';
			} else if (effectiveFlowType === 'implicit') {
				redirectFlowKey = 'oidc-implicit-v8';
			} else if (effectiveFlowType === 'hybrid') {
				redirectFlowKey = 'oidc-hybrid-v8';
			}
		}
		return redirectFlowKey;
	}, [effectiveFlowKey, effectiveFlowType, specVersion]);

	// Track the last flow key to detect flow changes (for auto-updating redirect URI only on flow change)
	const lastRedirectFlowKeyRef = useRef<string | null>(null);

	// Initialize and update redirect URIs for the flow based on spec version and flow type
	// Use effectiveFlowKey which accounts for PKCE and spec version
	// Only auto-update when:
	// 1. Redirect URI is empty (initial load)
	// 2. Flow key changes (user switched flows)
	// This allows users to manually edit the redirect URI without it being overwritten
	useEffect(() => {
		const redirectFlowKey = getRedirectFlowKey();

		// Get the correct redirect URI for this flow
		const correctRedirectUri = RedirectUriServiceV8.getRedirectUriForFlow(redirectFlowKey);
		const correctPostLogoutUri =
			RedirectUriServiceV8.getPostLogoutRedirectUriForFlow(redirectFlowKey);

		const flowKeyChanged = lastRedirectFlowKeyRef.current !== redirectFlowKey;
		const redirectUriEmpty = !credentials.redirectUri?.trim();
		const postLogoutUriEmpty = !credentials.postLogoutRedirectUri?.trim();

		console.log(`${MODULE_TAG} Redirect URI check`, {
			redirectFlowKey,
			correctRedirectUri,
			currentRedirectUri: credentials.redirectUri,
			flowKeyChanged,
			redirectUriEmpty,
			willAutoSet: (flowKeyChanged || redirectUriEmpty) && !!correctRedirectUri,
		});

		// Only auto-update redirect URI if:
		// 1. It's empty (initial load), OR
		// 2. The flow key changed (user switched flows)
		// This prevents overwriting user's manual edits
		if (correctRedirectUri && (redirectUriEmpty || flowKeyChanged)) {
			// Only update if it's different from current value
			if (credentials.redirectUri !== correctRedirectUri) {
				console.log(`${MODULE_TAG} Auto-updating redirect URI for flow`, {
					redirectFlowKey,
					oldRedirectUri: credentials.redirectUri,
					newRedirectUri: correctRedirectUri,
					reason: redirectUriEmpty ? 'empty' : 'flow changed',
				});
				onChange({ ...credentials, redirectUri: correctRedirectUri });
			}
		}

		// Only auto-update post-logout redirect URI if:
		// 1. It's empty (initial load), OR
		// 2. The flow key changed (user switched flows)
		if (correctPostLogoutUri && (postLogoutUriEmpty || flowKeyChanged)) {
			// Only update if it's different from current value
			if (credentials.postLogoutRedirectUri !== correctPostLogoutUri) {
				console.log(`${MODULE_TAG} Auto-updating post-logout redirect URI for flow`, {
					redirectFlowKey,
					oldPostLogoutUri: credentials.postLogoutRedirectUri,
					newPostLogoutUri: correctPostLogoutUri,
					reason: postLogoutUriEmpty ? 'empty' : 'flow changed',
				});
				onChange({ ...credentials, postLogoutRedirectUri: correctPostLogoutUri });
			}
		}

		// Update the ref to track the current flow key
		lastRedirectFlowKeyRef.current = redirectFlowKey;
	}, [
		getRedirectFlowKey,
		credentials.redirectUri,
		credentials.postLogoutRedirectUri,
		onChange,
		credentials,
	]);

	// Set default auth method and response type when flow options change (if not already set)
	useEffect(() => {
		const updated = { ...credentials };
		let hasChanges = false;

		if (defaultAuthMethod && !credentials.clientAuthMethod) {
			updated.clientAuthMethod = defaultAuthMethod;
			hasChanges = true;
		}
		if (defaultResponseType && !credentials.responseType) {
			updated.responseType = defaultResponseType;
			hasChanges = true;
		}

		if (hasChanges) {
			// Save credentials directly to storage using V8U flowKey
			try {
				if (FeatureFlagService.isEnabled('USE_NEW_CREDENTIALS_REPO')) {
					// Convert scopes string to array for new repository
					const credsForNew = {
						...updated,
						scopes: typeof updated.scopes === 'string' ? updated.scopes.split(' ').filter(Boolean) : updated.scopes
					};
					CredentialsRepository.setFlowCredentials(flowKey, credsForNew as any);
				} else {
					const credsForSave = updated as unknown as Parameters<
						typeof CredentialsServiceV8.saveCredentials
					>[1];
					CredentialsServiceV8.saveCredentials(flowKey, credsForSave);
				}

				// Save shared credentials (environmentId, clientId, clientSecret, etc.) to shared storage
				const sharedCreds = SharedCredentialsServiceV8.extractSharedCredentials(updated);
				if (sharedCreds.environmentId || sharedCreds.clientId) {
					SharedCredentialsServiceV8.saveSharedCredentials(sharedCreds);
				}

				console.log(`${MODULE_TAG} Credentials saved after setting defaults`, {
					flowKey,
					hasSharedCreds: !!(sharedCreds.environmentId || sharedCreds.clientId),
				});
			} catch (error) {
				console.error(`${MODULE_TAG} Error saving credentials after setting defaults`, {
					flowKey,
					error,
				});
			}
			onChange(updated);
		}
	}, [defaultAuthMethod, defaultResponseType, credentials, onChange, flowKey]);

	console.log(`${MODULE_TAG} Rendering credentials form`, { flowKey, flowType, flowOptions });

	// Get flow-specific helper text for application type
	const getFlowSpecificHelperText = useCallback(
		(
			appType: AppType,
			flowType: FlowType
		): { title: string; description: string; alternatives?: string } => {
			const isRecommended = getRecommendedAppType(flowType) === appType;
			const recommendedAppType = getRecommendedAppType(flowType);

			// Base descriptions for each app type
			const baseDescriptions: Record<AppType, { icon: string; title: string; base: string }> = {
				web: {
					icon: '🌐',
					title: 'Web Application',
					base: 'Server-side web application running on a secure backend.',
				},
				spa: {
					icon: '⚛️',
					title: 'Single Page Application (SPA)',
					base: 'Browser-based JavaScript application (React, Angular, Vue).',
				},
				mobile: { icon: '📱', title: 'Mobile Application', base: 'iOS or Android application.' },
				desktop: {
					icon: '🖥️',
					title: 'Desktop Application',
					base: 'Native desktop application (Windows, macOS, Linux).',
				},
				cli: {
					icon: '⌨️',
					title: 'Command Line Interface (CLI)',
					base: 'Command-line tool or script.',
				},
				m2m: {
					icon: '🤖',
					title: 'Machine-to-Machine (M2M)',
					base: 'Service-to-service communication without user interaction.',
				},
				backend: { icon: '🔧', title: 'Backend Service', base: 'Backend API or microservice.' },
			};

			const base = baseDescriptions[appType];
			let description = base.base;
			let alternatives = '';

			// Add flow-specific context
			if (isRecommended) {
				description += ` ✅ <strong>Recommended for ${SpecVersionServiceV8.getFlowLabel(flowType)}</strong>.`;
			} else {
				description += ` ⚠️ <strong>Not typically used with ${SpecVersionServiceV8.getFlowLabel(flowType)}</strong>. Consider <strong>${getAppTypeLabel(recommendedAppType)}</strong> instead.`;
			}

			// Add alternatives based on flow type
			switch (flowType) {
				case 'oauth-authz':
					alternatives = 'Also works with: SPA, Mobile, Desktop (all with PKCE).';
					break;
				case 'implicit':
					alternatives =
						'Implicit flow is deprecated. Consider Authorization Code + PKCE for SPAs.';
					break;
				case 'client-credentials':
					alternatives = 'Only for M2M/Backend services. No user interaction.';
					break;
				case 'device-code':
					alternatives = 'Best for CLI/TV apps. Also works with IoT devices.';
					break;
				case 'ropc':
					alternatives = 'ROPC is deprecated. Use Authorization Code + PKCE instead.';
					break;
				case 'hybrid':
					alternatives = 'Hybrid flow combines Authorization Code and Implicit. Best for web apps.';
					break;
			}

			return {
				title: `${base.icon} ${base.title}`,
				description,
				alternatives,
			};
		},
		[getRecommendedAppType, getAppTypeLabel]
	);

	// Get application-type-specific tooltip content
	const getAppTypeTooltipContent = useCallback((appType: AppType): string => {
		switch (appType) {
			case 'web':
				return `Server-side web application running on a secure backend.

Recommended: Authorization Code Flow
Client Type: Confidential (can securely store client secret)

Why it matters: Web applications run on servers where credentials can be kept secure. This allows you to use the Authorization Code Flow with client authentication for maximum security.`;
			case 'spa':
				return `Browser-based JavaScript application (React, Angular, Vue, etc.).

Recommended: Authorization Code Flow + PKCE
Client Type: Public (cannot store client secret securely)

Why it matters: SPAs run entirely in the browser, making it impossible to securely store a client secret. PKCE provides security equivalent to a client secret without requiring one.`;
			case 'mobile':
				return `iOS or Android application.

Recommended: Authorization Code Flow + PKCE
Client Type: Public (app code is accessible, cannot secure client secret)

Why it matters: Mobile app binaries can be reverse-engineered, so client secrets cannot be kept secure. PKCE ensures security without relying on secrets.`;
			case 'desktop':
				return `Windows, macOS, or Linux application.

Recommended: Authorization Code Flow + PKCE
Client Type: Public (executable can be reverse-engineered)

Why it matters: Desktop applications can be disassembled, exposing any embedded secrets. PKCE provides cryptographic protection without requiring a secret.`;
			case 'cli':
				return `Command-line tool or script.

Recommended: Device Code Flow or Authorization Code Flow + PKCE
Client Type: Public (no browser for redirects, Device Code enables separate auth)

Why it matters: CLI tools often lack a browser for OAuth redirects. Device Code Flow allows users to authenticate on a separate device, while PKCE secures Authorization Code Flow for CLI apps with browser capabilities.`;
			case 'm2m':
				return `Service-to-service communication with no user interaction.

Recommended: Client Credentials Flow
Client Type: Confidential (runs on secure backend, can store client secret)

Why it matters: Machine-to-machine applications authenticate without user involvement. They run on secure backends where client secrets can be safely stored, enabling direct token exchange.`;
			case 'backend':
				return `Microservice or backend API.

Recommended: Client Credentials Flow
Client Type: Confidential (server-side, can securely store credentials)

Why it matters: Backend services communicate server-to-server without user context. They can securely store credentials on the server, making Client Credentials Flow the most efficient option.`;
			default:
				return TooltipContentServiceV8.APPLICATION_TYPE.content;
		}
	}, []);

	const handleChange = useCallback(
		(field: string, value: string | boolean | number | undefined) => {
			console.log(`${MODULE_TAG} Credential changed`, { field, flowKey, value });
			// Handle boolean fields (usePKCE, enableRefreshToken, usePAR)
			// Handle pkceEnforcement as a string (OPTIONAL, REQUIRED, S256_REQUIRED)
			// Handle responseMode as a string (query, fragment, form_post, pi.flow)
			// Handle number fields (maxAge)
			const updated =
				field === 'usePKCE' || field === 'enableRefreshToken' || field === 'usePAR'
					? { ...credentials, [field]: value === true || value === 'true' }
					: field === 'pkceEnforcement' || field === 'responseMode'
						? { ...credentials, [field]: value as 'OPTIONAL' | 'REQUIRED' | 'S256_REQUIRED' }
						: field === 'maxAge'
							? { ...credentials, [field]: typeof value === 'number' ? value : undefined }
							: { ...credentials, [field]: value };

			// Save environment ID globally when changed
			if (field === 'environmentId' && typeof value === 'string' && value.trim()) {
				EnvironmentIdServiceV8.saveEnvironmentId(value);
			}

			// Save credentials directly to storage using V8U flowKey
			try {
				if (FeatureFlagService.isEnabled('USE_NEW_CREDENTIALS_REPO')) {
					// Convert scopes string to array for new repository
					const credsForNew = {
						...updated,
						scopes: typeof updated.scopes === 'string' ? updated.scopes.split(' ').filter(Boolean) : updated.scopes
					};
					CredentialsRepository.setFlowCredentials(flowKey, credsForNew as any);
				} else {
					// Convert scopes string to array for new repository
					const credsForSave = {
						...updated,
						scopes: typeof updated.scopes === 'string' ? updated.scopes.split(' ').filter(Boolean) : updated.scopes
					};
					CredentialsServiceV8.saveCredentials(flowKey, credsForSave);
				}

				// Save shared credentials (environmentId, clientId, clientSecret, etc.) to shared storage (async with disk)
				const sharedCreds = SharedCredentialsServiceV8.extractSharedCredentials(updated);
				if (sharedCreds.environmentId || sharedCreds.clientId) {
					// Use sync version for immediate browser storage, async disk save happens in background
					SharedCredentialsServiceV8.saveSharedCredentialsSync(sharedCreds);
					// Also save to disk asynchronously (non-blocking)
					SharedCredentialsServiceV8.saveSharedCredentials(sharedCreds).catch((err) => {
						console.warn(`${MODULE_TAG} Background disk save failed (non-critical):`, err);
					});
				}

				console.log(`${MODULE_TAG} Credentials saved to storage`, {
					field,
					flowKey,
					hasClientId: !!updated.clientId,
					hasSharedCreds: !!(sharedCreds.environmentId || sharedCreds.clientId),
				});
			} catch (error) {
				console.error(`${MODULE_TAG} Error saving credentials`, { field, flowKey, error });
			}

			onChange(updated);

			// Note: Redirect URI and Logout URI change callbacks removed - functionality can be handled by parent via onChange
		},
		[credentials, onChange, flowKey]
	);

	const handleAppSelected = useCallback(
		async (app: DiscoveredApp) => {
			console.log(`${MODULE_TAG} App selected`, { appId: app.id, appName: app.name });
			setHasDiscoveredApps(true);
			setHighlightEmptyFields(true); // Enable highlighting for empty required fields

			// Fetch the application with its client secret from PingOne API
			// According to PingOne Workflow Library: https://apidocs.pingidentity.com/pingone/workflow-library/v1/api/#get-step-19-get-the-application-secret
			let appWithSecret = app;
			if (credentials.environmentId) {
				try {
					const workerToken = await AppDiscoveryServiceV8.getStoredWorkerToken();
					if (workerToken) {
						console.log(`${MODULE_TAG} Fetching application secret from PingOne API...`);
						const fetchedApp = await AppDiscoveryServiceV8.fetchApplicationWithSecret(
							credentials.environmentId,
							app.id,
							workerToken
						);
						if (fetchedApp) {
							console.log(`${MODULE_TAG} Application fetched`, {
								hasClientSecret: 'clientSecret' in fetchedApp,
								clientSecretType: typeof fetchedApp.clientSecret,
								clientSecretLength: fetchedApp.clientSecret?.length || 0,
								clientSecretValue: fetchedApp.clientSecret
									? `${fetchedApp.clientSecret.substring(0, 10)}...`
									: 'none',
							});
							if (
								fetchedApp.clientSecret &&
								typeof fetchedApp.clientSecret === 'string' &&
								fetchedApp.clientSecret.trim().length > 0
							) {
								appWithSecret = fetchedApp;
								console.log(`${MODULE_TAG} ✅ Application secret fetched successfully`);
								toastV8.success('Application secret retrieved from PingOne');
							} else {
								console.log(`${MODULE_TAG} Application secret not returned from API or is empty`, {
									hasClientSecret: 'clientSecret' in fetchedApp,
									clientSecretValue: fetchedApp.clientSecret,
								});
							}
						} else {
							console.log(`${MODULE_TAG} Application fetch returned null`);
						}
					} else {
						console.log(`${MODULE_TAG} No worker token available, using app data without secret`);
					}
				} catch (error) {
					console.error(`${MODULE_TAG} Error fetching application secret`, {
						error: error instanceof Error ? error.message : String(error),
					});
					// Continue with app data even if secret fetch fails
				}
			}

			const updated = {
				...credentials,
				clientId: appWithSecret.id,
				// Set client secret if available from PingOne API
				...('clientSecret' in appWithSecret &&
				appWithSecret.clientSecret &&
				typeof appWithSecret.clientSecret === 'string' &&
				appWithSecret.clientSecret.trim().length > 0
					? { clientSecret: appWithSecret.clientSecret as string }
					: {}),
				// Note: redirectUri is NOT applied - app dictates this (as user mentioned)
			};

			console.log(`${MODULE_TAG} Updated credentials`, {
				hasClientSecret: !!updated.clientSecret,
				clientSecretLength: updated.clientSecret?.length || 0,
			});
			// Apply additional fields if available (from AppDiscoveryServiceV8.getAppConfig)
			// Use appWithSecret for tokenEndpointAuthMethod if available, otherwise fall back to app
			// Type assertion needed because DiscoveredApp interface doesn't include all PingOne app properties
			type AppWithExtendedProps = DiscoveredApp & {
				tokenEndpointAuthMethod?:
					| 'none'
					| 'client_secret_basic'
					| 'client_secret_post'
					| 'client_secret_jwt'
					| 'private_key_jwt';
				scopes?: string[];
				pkceEnforced?: boolean;
				pkceRequired?: boolean;
			};

			const appWithSecretExtended = appWithSecret as AppWithExtendedProps;
			const appExtended = app as AppWithExtendedProps;

			// Type assertion for updated to include pkceEnforcement
			const updatedWithPKCE = updated as typeof updated & {
				pkceEnforcement?: 'OPTIONAL' | 'REQUIRED' | 'S256_REQUIRED';
			};

			if (appWithSecretExtended.tokenEndpointAuthMethod) {
				updated.clientAuthMethod = appWithSecretExtended.tokenEndpointAuthMethod;
			} else if (appExtended.tokenEndpointAuthMethod) {
				updated.clientAuthMethod = appExtended.tokenEndpointAuthMethod;
			}
			if (appWithSecretExtended.scopes && Array.isArray(appWithSecretExtended.scopes)) {
				updated.scopes = appWithSecretExtended.scopes.join(' ');
			} else if (appExtended.scopes && Array.isArray(appExtended.scopes)) {
				updated.scopes = appExtended.scopes.join(' ');
			}
			// Set PKCE enforcement from PingOne app configuration
			if (
				appWithSecretExtended.pkceEnforced !== undefined ||
				appWithSecretExtended.pkceRequired !== undefined
			) {
				if (appWithSecretExtended.pkceEnforced === true) {
					updatedWithPKCE.pkceEnforcement = 'S256_REQUIRED';
				} else if (appWithSecretExtended.pkceRequired === true) {
					updatedWithPKCE.pkceEnforcement = 'REQUIRED';
				} else {
					updatedWithPKCE.pkceEnforcement = 'OPTIONAL';
				}
				// Update local state to match
				setPkceEnforcement(updatedWithPKCE.pkceEnforcement);
				console.log(`${MODULE_TAG} PKCE enforcement set from app config`, {
					pkceEnforcement: updatedWithPKCE.pkceEnforcement,
					pkceEnforced: appWithSecretExtended.pkceEnforced,
					pkceRequired: appWithSecretExtended.pkceRequired,
				});
			} else if (appExtended.pkceEnforced !== undefined || appExtended.pkceRequired !== undefined) {
				if (appExtended.pkceEnforced === true) {
					updatedWithPKCE.pkceEnforcement = 'S256_REQUIRED';
				} else if (appExtended.pkceRequired === true) {
					updatedWithPKCE.pkceEnforcement = 'REQUIRED';
				} else {
					updatedWithPKCE.pkceEnforcement = 'OPTIONAL';
				}
				// Update local state to match
				setPkceEnforcement(updatedWithPKCE.pkceEnforcement);
				console.log(`${MODULE_TAG} PKCE enforcement set from app config`, {
					pkceEnforcement: updatedWithPKCE.pkceEnforcement,
					pkceEnforced: appExtended.pkceEnforced,
					pkceRequired: appExtended.pkceRequired,
				});
			}
			// Check if app has refreshTokenDuration (indicates refresh token support)
			if ('refreshTokenDuration' in app && app.refreshTokenDuration) {
				console.log(
					`${MODULE_TAG} App supports refresh tokens (duration: ${app.refreshTokenDuration}s)`
				);
				// Note: We no longer auto-enable refresh token checkbox by default
			}

			// Save credentials directly to storage using V8U flowKey
			try {
				if (FeatureFlagService.isEnabled('USE_NEW_CREDENTIALS_REPO')) {
					const credsForNew = {
						...updated,
						scopes: typeof updated.scopes === 'string' ? updated.scopes.split(' ').filter(Boolean) : updated.scopes
					};
					CredentialsRepository.setFlowCredentials(flowKey, credsForNew as any);
				} else {
					const credsForSave = updated as unknown as Parameters<
						typeof CredentialsServiceV8.saveCredentials
					>[1];
					CredentialsServiceV8.saveCredentials(flowKey, credsForSave);
				}

				// Save shared credentials (environmentId, clientId, clientSecret, etc.) to shared storage (async with disk)
				const sharedCreds = SharedCredentialsServiceV8.extractSharedCredentials(updated);
				if (sharedCreds.environmentId || sharedCreds.clientId) {
					// Use sync version for immediate browser storage, async disk save happens in background
					SharedCredentialsServiceV8.saveSharedCredentialsSync(sharedCreds);
					// Also save to disk asynchronously (non-blocking)
					SharedCredentialsServiceV8.saveSharedCredentials(sharedCreds).catch((err) => {
						console.warn(`${MODULE_TAG} Background disk save failed (non-critical):`, err);
					});
				}

				console.log(`${MODULE_TAG} Credentials saved after app selection`, {
					flowKey,
					clientId: updated.clientId,
					hasSharedCreds: !!(sharedCreds.environmentId || sharedCreds.clientId),
				});
			} catch (error) {
				console.error(`${MODULE_TAG} Error saving credentials after app selection`, {
					flowKey,
					error,
				});
			}

			onChange(updated);
			toastV8.success(`Applied settings from ${app.name}`);
		},
		[credentials, onChange, flowKey, flowOptions.requiresClientSecret]
	);

	const handleDiscovery = useCallback(async () => {
		// Use discoveryInput if provided, otherwise fall back to credentials.environmentId
		const inputToUse = discoveryInput.trim() || credentials.environmentId?.trim() || '';

		if (!inputToUse) {
			toastV8.error('Please enter an issuer URL or environment ID in the General section');
			return;
		}

		setIsDiscovering(true);
		try {
			console.log(`${MODULE_TAG} Starting OIDC discovery`, {
				input: inputToUse,
				fromCredentials: !discoveryInput.trim() && !!credentials.environmentId,
			});
			const result = await OidcDiscoveryServiceV8.discoverFromInput(inputToUse);

			if (result.success && result.data) {
				console.log(`${MODULE_TAG} Discovery successful`, result.data);
				setDiscoveryResult(result.data);
				setShowDiscoveryModal(true);
				onDiscoveryComplete?.(result.data);
			} else {
				console.error(`${MODULE_TAG} Discovery failed`, result.error);
				toastV8.error(result.error || 'Discovery failed');
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Discovery error`, error);
			toastV8.error('Discovery failed - check the issuer URL');
		} finally {
			setIsDiscovering(false);
		}
	}, [discoveryInput, credentials.environmentId, onDiscoveryComplete]);

	const handleApplyDiscovery = useCallback(
		(result: OidcDiscoveryResult) => {
			console.log(`${MODULE_TAG} Applying discovery result`, result);
			const updated = {
				...credentials,
				issuerUrl: result.issuer,
				scopes: result.scopesSupported?.join(' ') || credentials.scopes,
			};
			onChange(updated);
			toastV8.success('OIDC configuration applied!');
			setDiscoveryInput('');
		},
		[credentials, onChange]
	);

	const defaultTitle = title || 'OAuth 2.0 Configure App & Environment';
	const defaultSubtitle = subtitle || `Configure credentials for ${flowType} flow`;

	return (
		<div className="credentials-form-v8">
			<div className="collapsible-header" onClick={() => setIsExpanded(!isExpanded)}>
				<div className="header-content">
					<h2>{defaultTitle}</h2>
					<span className={`chevron ${isExpanded ? 'open' : ''}`}>›</span>
				</div>
				{defaultSubtitle && <p>{defaultSubtitle}</p>}
			</div>

			{isExpanded && (
				<>
					<form id="credentials-form-v8u" className="form-sections">
						{/* GENERAL SECTION - Matches PingOne Console */}
						<div className="form-section" data-section="general">
							<div
								className="section-header"
								onClick={() => setShowGeneralSection(!showGeneralSection)}
								style={{ cursor: 'pointer' }}
							>
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										width: '100%',
									}}
								>
									<h3>⚡ General</h3>
									<span
										style={{
											fontSize: '18px',
											transform: showGeneralSection ? 'rotate(90deg)' : 'rotate(0deg)',
											transition: 'transform 0.3s ease',
										}}
									>
										›
									</span>
								</div>
							</div>
							{showGeneralSection && (
								<div className="section-content">
									{/* Client Type - Educational Component */}
									<div className="form-group" style={{ marginBottom: '16px' }}>
										<ClientTypeRadioV8
											value={clientType}
											onChange={(type) => {
												console.log(`${MODULE_TAG} Client type changed to ${type}`);
												setClientType(type);
												handleChange('clientType', type);
												toastV8.info(
													`Client type set to: ${type === 'public' ? 'Public Client' : 'Confidential Client'}`
												);
											}}
										/>
									</div>

									{/* Application Type */}
									<div className="form-group">
										<label>
											Application Type
											<TooltipV8
												title={`${TooltipContentServiceV8.APPLICATION_TYPE.title} - ${getAppTypeLabel(appType)}`}
												content={getAppTypeTooltipContent(appType)}
											/>
										</label>
										<div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
											{/* Dropdown - Half Width */}
											<div style={{ flex: '0 0 50%' }}>
												<select
													value={appType}
													onChange={(e) => {
														const newAppType = e.target.value as AppType;
														setAppType(newAppType);

														// Save appType to credentials
														handleChange('appType', newAppType);

														// Map application type to recommended flow type
														let suggestedFlowType: FlowType | undefined;
														if (newAppType === 'm2m' || newAppType === 'backend') {
															suggestedFlowType = 'client-credentials';
														} else if (newAppType === 'cli') {
															suggestedFlowType = 'device-code';
														} else {
															// web, spa, mobile, desktop -> Authorization Code
															suggestedFlowType = 'oauth-authz';
														}

														// Notify parent component about app type change and suggested flow
														if (onAppTypeChange) {
															onAppTypeChange(newAppType, suggestedFlowType);
														}
													}}
													style={{ width: '100%' }}
												>
													<option value="web">Web Application</option>
													<option value="spa">Single Page Application (SPA)</option>
													<option value="mobile">Mobile Application</option>
													<option value="desktop">Desktop Application</option>
													<option value="cli">Command Line Interface (CLI)</option>
													<option value="m2m">Machine-to-Machine (M2M)</option>
													<option value="backend">Backend Service</option>
												</select>
											</div>

											{/* Educational Content - Half Width - Dynamic based on flow type */}
											<div
												style={{
													flex: '0 0 50%',
													padding: '12px 16px',
													background:
														getRecommendedAppType(effectiveFlowType) === appType
															? '#f0fdf4'
															: '#fef3c7',
													border: `1px solid ${getRecommendedAppType(effectiveFlowType) === appType ? '#86efac' : '#fcd34d'}`,
													borderRadius: '6px',
													minHeight: '40px',
												}}
											>
												{(() => {
													const helperText = getFlowSpecificHelperText(appType, effectiveFlowType);
													return (
														<div>
															<div
																style={{
																	fontWeight: '600',
																	fontSize: '13px',
																	color: '#1f2937',
																	marginBottom: '6px',
																}}
															>
																{helperText.title}
															</div>
															<div
																style={{
																	fontSize: '12px',
																	color: '#4b5563',
																	lineHeight: '1.5',
																	marginBottom: '6px',
																}}
																dangerouslySetInnerHTML={{ __html: helperText.description }}
															/>
															{helperText.alternatives && (
																<div
																	style={{
																		fontSize: '11px',
																		color: '#6b7280',
																		lineHeight: '1.4',
																		fontStyle: 'italic',
																		marginTop: '6px',
																		paddingTop: '6px',
																		borderTop: '1px solid #e5e7eb',
																	}}
																>
																	{helperText.alternatives}
																</div>
															)}
														</div>
													);
												})()}
											</div>
										</div>
									</div>

									{/* Environment ID */}
									<div className="form-group">
										<label>
											Environment ID <span className="required">*</span>
										</label>
										<input
											type="text"
											placeholder="12345678-1234-1234-1234-123456789012"
											value={credentials.environmentId}
											onChange={(e) => handleChange('environmentId', e.target.value)}
											aria-label="Environment ID"
											style={getFieldErrorStyle(credentials.environmentId, true)}
										/>
										<small>Your PingOne environment identifier (saved globally once entered)</small>
									</div>

									{/* Worker Token Status */}
									<div className="form-group">
										<label>Worker Token Status</label>
										<div
											style={{
												padding: '10px 14px',
												background:
													tokenStatus.status === 'valid'
														? '#d1fae5'
														: tokenStatus.status === 'expiring-soon' ||
																tokenStatus.status === 'expired'
															? '#fef3c7'
															: '#fee2e2',
												border: `1px solid ${WorkerTokenStatusServiceV8.getStatusColor(tokenStatus.status)}`,
												borderRadius: '6px',
												fontSize: '13px',
												color:
													tokenStatus.status === 'valid'
														? '#065f46'
														: tokenStatus.status === 'expiring-soon' ||
																tokenStatus.status === 'expired'
															? '#92400e'
															: '#991b1b',
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
												wordWrap: 'break-word',
												overflowWrap: 'break-word',
												minHeight: '38px',
												marginBottom: '8px',
											}}
										>
											<span style={{ fontSize: '16px', flexShrink: 0 }}>
												{WorkerTokenStatusServiceV8.getStatusIcon(tokenStatus.status)}
											</span>
											<span style={{ flex: 1 }}>{tokenStatus.message}</span>
										</div>
										<small style={{ marginBottom: '8px', display: 'block' }}>
											Worker token is required to discover applications
										</small>
										<div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
											<button
												type="button"
												className={tokenStatus.isValid ? 'btn-token-has' : 'btn-token-none'}
												onClick={async () => {
													// Pass current checkbox values to override config (page checkboxes take precedence)
													// forceShowModal=true because user explicitly clicked the button - always show modal
													const { handleShowWorkerTokenModal } = await import('@/v8/utils/workerTokenModalHelperV8');
													await handleShowWorkerTokenModal(
														setShowWorkerTokenModal,
														setTokenStatus,
														silentApiRetrieval,  // Page checkbox value takes precedence
														showTokenAtEnd,      // Page checkbox value takes precedence
														true                  // Force show modal - user clicked button
													);
												}}
												title={
													tokenStatus.isValid
														? 'Worker token is stored - click to manage'
														: 'No worker token - click to get one'
												}
												style={{
													flex: '1',
													minWidth: '140px',
												}}
											>
												{tokenStatus.isValid ? '🔑 Manage Token' : '🔑 Get Worker Token'}
											</button>
											<button
												type="button"
												className={
													tokenStatus.isValid && credentials.environmentId.trim()
														? 'btn-success'
														: 'btn-primary'
												}
												onClick={() => setShowAppDiscoveryModal(true)}
												disabled={!credentials.environmentId.trim() || !tokenStatus.isValid}
												style={{
													flex: '1',
													minWidth: '140px',
												}}
											>
												{hasDiscoveredApps ? '🔍 Discover Apps AGAIN' : '🔍 Discover Apps'}
											</button>
										</div>
										
										{/* Worker Token Settings Checkboxes */}
										<div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
											<label
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: '12px',
													cursor: 'pointer',
													userSelect: 'none',
													padding: '8px',
													borderRadius: '6px',
													transition: 'background-color 0.2s ease',
												}}
												onMouseEnter={(e) => {
													e.currentTarget.style.backgroundColor = '#f3f4f6';
												}}
												onMouseLeave={(e) => {
													e.currentTarget.style.backgroundColor = 'transparent';
												}}
											>
												<input
													type="checkbox"
													checked={silentApiRetrieval}
													onChange={async (e) => {
														const newValue = e.target.checked;
														setSilentApiRetrieval(newValue);
														// Update config service immediately (no cache)
														const config = MFAConfigurationServiceV8.loadConfiguration();
														config.workerToken.silentApiRetrieval = newValue;
														MFAConfigurationServiceV8.saveConfiguration(config);
														// Dispatch event to notify other components
														window.dispatchEvent(new CustomEvent('mfaConfigurationUpdated', { detail: { workerToken: config.workerToken } }));
														toastV8.info(`Silent API Token Retrieval set to: ${newValue}`);
														
														// If enabling silent retrieval and token is missing/expired, attempt silent retrieval now
														if (newValue) {
															const currentStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
															if (!currentStatus.isValid) {
																console.log('[CREDENTIALS-FORM-V8U] Silent API retrieval enabled, attempting to fetch token now...');
																const { handleShowWorkerTokenModal } = await import('@/v8/utils/workerTokenModalHelperV8');
																await handleShowWorkerTokenModal(
																	setShowWorkerTokenModal,
																	setTokenStatus,
																	newValue,  // Use new value
																	showTokenAtEnd,
																	false      // Not forced - respect silent setting
																);
															}
														}
													}}
													style={{
														width: '20px',
														height: '20px',
														cursor: 'pointer',
														accentColor: '#6366f1',
														flexShrink: 0,
													}}
												/>
												<div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
													<span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
														Silent API Token Retrieval
													</span>
													<span style={{ fontSize: '12px', color: '#6b7280' }}>
														Automatically fetch worker token in the background without showing modals
													</span>
												</div>
											</label>

											<label
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: '12px',
													cursor: 'pointer',
													userSelect: 'none',
													padding: '8px',
													borderRadius: '6px',
													transition: 'background-color 0.2s ease',
												}}
												onMouseEnter={(e) => {
													e.currentTarget.style.backgroundColor = '#f3f4f6';
												}}
												onMouseLeave={(e) => {
													e.currentTarget.style.backgroundColor = 'transparent';
												}}
											>
												<input
													type="checkbox"
													checked={showTokenAtEnd}
													onChange={(e) => {
														const newValue = e.target.checked;
														setShowTokenAtEnd(newValue);
														// Update config service immediately (no cache)
														const config = MFAConfigurationServiceV8.loadConfiguration();
														config.workerToken.showTokenAtEnd = newValue;
														MFAConfigurationServiceV8.saveConfiguration(config);
														// Dispatch event to notify other components
														window.dispatchEvent(new CustomEvent('mfaConfigurationUpdated', { detail: { workerToken: config.workerToken } }));
														toastV8.info(`Show Token After Generation set to: ${newValue}`);
													}}
													style={{
														width: '20px',
														height: '20px',
														cursor: 'pointer',
														accentColor: '#6366f1',
														flexShrink: 0,
													}}
												/>
												<div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
													<span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
														Show Token After Generation
													</span>
													<span style={{ fontSize: '12px', color: '#6b7280' }}>
														Display the generated worker token in a modal after successful retrieval
													</span>
												</div>
											</label>
										</div>
									</div>

									{/* Client ID */}
									<div className="form-group">
										<label>
											Client ID <span className="required">*</span>
										</label>
										<input
											type="text"
											placeholder="abc123def456..."
											value={credentials.clientId}
											onChange={(e) => handleChange('clientId', e.target.value)}
											aria-label="Client ID"
											style={getFieldErrorStyle(credentials.clientId, true)}
										/>
										<small>Public identifier for your application</small>
									</div>

									{/* Client Secret - Only if flow supports it */}
									{flowOptions.requiresClientSecret ||
									(!flowOptions.requiresClientSecret && config.includeClientSecret) ? (
										<div className="form-group">
											<label>
												Client Secret
												{flowOptions.requiresClientSecret && pkceEnforcement === 'OPTIONAL' ? (
													<span className="required">*</span>
												) : (
													<span className="optional">
														(optional
														{pkceEnforcement !== 'OPTIONAL' ? ' - not needed with PKCE' : ''})
													</span>
												)}
											</label>
											<div style={{ position: 'relative' }}>
												<input
													type={showClientSecret ? 'text' : 'password'}
													placeholder="••••••••••••••••"
													value={credentials.clientSecret || ''}
													onChange={(e) => {
														handleChange('clientSecret', e.target.value);
														// Clear highlighting once user starts typing
														if (e.target.value && highlightEmptyFields) {
															setHighlightEmptyFields(false);
														}
													}}
													aria-label="Client Secret"
													autoComplete="off"
													form="credentials-form-v8u"
													style={{
														paddingRight: '40px',
														...getFieldErrorStyle(
															credentials.clientSecret,
															flowOptions.requiresClientSecret && pkceEnforcement === 'OPTIONAL'
														),
														...(highlightEmptyFields && !credentials.clientSecret
															? {
																	animation: 'shake 0.5s',
																}
															: {}),
													}}
												/>
												<button
													type="button"
													onClick={() => setShowClientSecret(!showClientSecret)}
													style={{
														position: 'absolute',
														right: '8px',
														top: '50%',
														transform: 'translateY(-50%)',
														background: 'none',
														border: 'none',
														cursor: 'pointer',
														padding: '4px',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														color: '#6b7280',
														transition: 'color 0.2s ease',
													}}
													title={showClientSecret ? 'Hide client secret' : 'Show client secret'}
													onMouseEnter={(e) => {
														e.currentTarget.style.color = '#3b82f6';
													}}
													onMouseLeave={(e) => {
														e.currentTarget.style.color = '#6b7280';
													}}
												>
													{showClientSecret ? <FiEyeOff size={18} /> : <FiEye size={18} />}
												</button>
											</div>
											{highlightEmptyFields &&
											!credentials.clientSecret &&
											pkceEnforcement === 'OPTIONAL' ? (
												<small style={{ color: '#ef4444', fontWeight: 600 }}>
													⚠️ Client Secret is{' '}
													{flowOptions.requiresClientSecret ? 'required' : 'recommended'} - please
													enter it to continue
												</small>
											) : pkceEnforcement !== 'OPTIONAL' ? (
												<small style={{ color: '#10b981' }}>
													✓ PKCE enabled ({pkceEnforcement}) - client secret not required (public
													client flow)
												</small>
											) : (
												<small>Keep this secure - never expose in client-side code</small>
											)}
										</div>
									) : null}

									{/* PKCE Enforcement Dropdown - Only for flows that support PKCE */}
									{supportsPKCE && (
										<div
											className="form-group"
											style={{
												marginTop: '16px',
												padding: '12px',
												background: '#fef3c7',
												borderRadius: '4px',
												border: '1px solid #fcd34d',
											}}
										>
											<PKCEEnforcementDropdownV8
												value={pkceEnforcement}
												onChange={(newEnforcement) => {
													setPkceEnforcement(newEnforcement);
													// Save to credentials
													handleChange('pkceEnforcement', newEnforcement);
													// Also update legacy usePKCE for backward compatibility
													handleChange('usePKCE', newEnforcement !== 'OPTIONAL');
													console.log(`${MODULE_TAG} PKCE enforcement changed`, {
														from: pkceEnforcement,
														to: newEnforcement,
													});
												}}
											/>
										</div>
									)}

									{/* When Do I Get What Tokens - Educational Info (Collapsible) - MOVED BELOW PKCE */}
									{flowOptions.supportsRefreshToken && (
										<div
											style={{
												marginTop: '16px',
												marginBottom: '12px',
												background: '#f0fdf4',
												borderRadius: '6px',
												border: '1px solid #86efac',
												fontSize: '13px',
												overflow: 'hidden',
											}}
										>
											{/* Collapsible Header */}
											<button
												type="button"
												onClick={() => setShowRefreshTokenRules(!showRefreshTokenRules)}
												style={{
													width: '100%',
													padding: '12px',
													background: 'none',
													border: 'none',
													cursor: 'pointer',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'space-between',
													fontWeight: '600',
													color: '#166534',
													textAlign: 'left',
													transition: 'background 0.2s ease',
												}}
												onMouseEnter={(e) => {
													e.currentTarget.style.background = '#dcfce7';
												}}
												onMouseLeave={(e) => {
													e.currentTarget.style.background = 'none';
												}}
											>
												<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
													<span>📚</span>
													<span>When Do I Get What Tokens</span>
												</div>
												{showRefreshTokenRules ? (
													<FiChevronUp size={18} />
												) : (
													<FiChevronDown size={18} />
												)}
											</button>

											{/* Collapsible Content */}
											{showRefreshTokenRules && (
												<div
													style={{
														padding: '12px',
														paddingTop: '0',
														color: '#15803d',
														lineHeight: '1.6',
													}}
												>
													<div style={{ marginBottom: '12px' }}>
														<strong
															style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}
														>
															Authorization Code Flow: Why You Sometimes Don't Get All the Tokens
														</strong>
														<p style={{ marginBottom: '8px' }}>
															You only receive certain tokens if you ask for them:
														</p>
													</div>

													<div
														style={{
															marginBottom: '12px',
															padding: '10px',
															background: '#dcfce7',
															borderRadius: '4px',
															border: '1px solid #86efac',
														}}
													>
														<strong style={{ display: 'block', marginBottom: '6px' }}>
															ID Token
														</strong>
														<p style={{ margin: '0 0 8px 0' }}>
															You get an ID Token only when your request includes the{' '}
															<code
																style={{
																	background: '#fef3c7',
																	padding: '2px 6px',
																	borderRadius: '3px',
																}}
															>
																openid
															</code>{' '}
															scope.
														</p>
														<p style={{ margin: '0', fontWeight: '600', color: '#dc2626' }}>
															No{' '}
															<code
																style={{
																	background: '#fef3c7',
																	padding: '2px 6px',
																	borderRadius: '3px',
																}}
															>
																openid
															</code>{' '}
															→ no ID Token.
														</p>
													</div>

													<div
														style={{
															marginBottom: '12px',
															padding: '10px',
															background: '#dcfce7',
															borderRadius: '4px',
															border: '1px solid #86efac',
														}}
													>
														<strong style={{ display: 'block', marginBottom: '6px' }}>
															Refresh Token
														</strong>
														<p style={{ margin: '0 0 8px 0' }}>
															You get a Refresh Token only when your request includes{' '}
															<code
																style={{
																	background: '#fef3c7',
																	padding: '2px 6px',
																	borderRadius: '3px',
																}}
															>
																offline_access
															</code>{' '}
															and the application is allowed to use refresh tokens.
														</p>
														<p style={{ margin: '0', fontWeight: '600', color: '#dc2626' }}>
															No{' '}
															<code
																style={{
																	background: '#fef3c7',
																	padding: '2px 6px',
																	borderRadius: '3px',
																}}
															>
																offline_access
															</code>{' '}
															→ no Refresh Token.
														</p>
													</div>

													<div
														style={{
															marginBottom: '12px',
															padding: '10px',
															background: '#dcfce7',
															borderRadius: '4px',
															border: '1px solid #86efac',
														}}
													>
														<strong style={{ display: 'block', marginBottom: '6px' }}>
															Access Token
														</strong>
														<p style={{ margin: '0' }}>Always included.</p>
													</div>

													<div
														style={{
															marginBottom: '12px',
															padding: '10px',
															background: '#f0fdf4',
															borderRadius: '4px',
															border: '1px solid #86efac',
														}}
													>
														<strong style={{ display: 'block', marginBottom: '6px' }}>
															So the flow works like this:
														</strong>
														<ol style={{ margin: '4px 0 0 20px', padding: 0 }}>
															<li style={{ marginBottom: '4px' }}>Send the user to sign in.</li>
															<li style={{ marginBottom: '4px' }}>
																Request scopes like{' '}
																<code
																	style={{
																		background: '#fef3c7',
																		padding: '2px 6px',
																		borderRadius: '3px',
																	}}
																>
																	openid
																</code>{' '}
																and{' '}
																<code
																	style={{
																		background: '#fef3c7',
																		padding: '2px 6px',
																		borderRadius: '3px',
																	}}
																>
																	offline_access
																</code>{' '}
																if you need those tokens.
															</li>
															<li style={{ marginBottom: '4px' }}>
																Exchange the authorization code at the token endpoint.
															</li>
															<li style={{ marginBottom: '4px' }}>
																The server returns only the tokens allowed by your scopes and your
																app's configuration.
															</li>
														</ol>
													</div>

													<div
														style={{
															padding: '10px',
															background: '#fee2e2',
															borderRadius: '4px',
															border: '1px solid #fca5a5',
														}}
													>
														<strong
															style={{ display: 'block', marginBottom: '4px', color: '#dc2626' }}
														>
															Simple rule:
														</strong>
														<p style={{ margin: '0', fontWeight: '600', color: '#991b1b' }}>
															If the scope isn't included—or the app isn't allowed to receive it—the
															token won't be returned.
														</p>
													</div>
												</div>
											)}
										</div>
									)}
								</div>
							)}
						</div>

						{/* OIDC Discovery Section */}
						<div className="form-section" data-section="discovery">
							<div className="section-header">
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										width: '100%',
									}}
								>
									<h3>🔍 OIDC Discovery (Optional)</h3>
									<button
										type="button"
										onClick={() => setShowDiscoveryInfo(!showDiscoveryInfo)}
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '4px',
											padding: '4px 8px',
											background: '#eff6ff', // Light blue background
											border: '1px solid #93c5fd',
											borderRadius: '4px',
											fontSize: '12px',
											color: '#1e40af', // Dark blue text - high contrast
											cursor: 'pointer',
											transition: 'all 0.2s ease',
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.background = '#dbeafe';
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.background = '#eff6ff';
										}}
									>
										<FiInfo size={14} />
										{showDiscoveryInfo ? 'Hide Info' : "What's this?"}
									</button>
								</div>
							</div>
							<div className="section-content">
								{/* Educational info panel */}
								{showDiscoveryInfo && (
									<div
										style={{
											marginBottom: '16px',
											padding: '16px',
											background: '#eff6ff', // Light blue background
											border: '1px solid #93c5fd',
											borderRadius: '6px',
										}}
									>
										{/* Main Title Section */}
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
												marginBottom: '12px',
												padding: '12px',
												background: '#dbeafe',
												borderRadius: '6px',
											}}
										>
											<span style={{ fontSize: '18px' }}>📚</span>
											<h4
												style={{
													fontSize: '14px',
													fontWeight: '600',
													color: '#1e40af', // Dark blue text - high contrast
													margin: 0,
													flex: 1,
												}}
											>
												What is OIDC Discovery?
											</h4>
										</div>
										<p
											style={{
												fontSize: '13px',
												color: '#1e40af', // Dark blue text
												marginBottom: '16px',
												lineHeight: '1.5',
											}}
										>
											<strong>OIDC Discovery</strong> (OpenID Connect Discovery) automatically
											retrieves your OAuth/OIDC provider's configuration by querying the{' '}
											<code
												style={{
													background: '#f3f4f6',
													padding: '2px 4px',
													borderRadius: '3px',
												}}
											>
												.well-known/openid-configuration
											</code>{' '}
											endpoint. This eliminates the need to manually configure endpoints.
										</p>

										<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
											{/* How It Works */}
											<div
												style={{
													padding: '12px',
													background: '#ffffff',
													border: '1px solid #93c5fd',
													borderRadius: '6px',
												}}
											>
												<div
													style={{
														display: 'flex',
														alignItems: 'center',
														gap: '8px',
														marginBottom: '8px',
													}}
												>
													<span style={{ fontSize: '16px' }}>⚙️</span>
													<span
														style={{
															fontSize: '13px',
															fontWeight: '600',
															color: '#1e40af', // Dark blue text
														}}
													>
														How It Works
													</span>
												</div>
												<div
													style={{
														fontSize: '12px',
														color: '#374151', // Dark text
														marginBottom: '8px',
													}}
												>
													<ol
														style={{
															margin: '0 0 8px 0',
															paddingLeft: '20px',
															lineHeight: '1.6',
														}}
													>
														<li>
															Enter your <strong>Issuer URL</strong> or{' '}
															<strong>Environment ID</strong>
														</li>
														<li>
															Click <strong>"🔍 OIDC Discovery"</strong> to fetch configuration
														</li>
														<li>
															The system queries{' '}
															<code
																style={{
																	background: '#f3f4f6',
																	padding: '2px 4px',
																	borderRadius: '3px',
																}}
															>
																{credentials.environmentId
																	? `https://auth.pingone.com/${credentials.environmentId}/as/.well-known/openid-configuration`
																	: '{issuer-url}/.well-known/openid-configuration'}
															</code>
														</li>
														<li>Review discovered endpoints and apply to your configuration</li>
													</ol>
												</div>
											</div>

											{/* What Gets Discovered */}
											<div
												style={{
													padding: '12px',
													background: '#ffffff',
													border: '1px solid #93c5fd',
													borderRadius: '6px',
												}}
											>
												<div
													style={{
														display: 'flex',
														alignItems: 'center',
														gap: '8px',
														marginBottom: '8px',
													}}
												>
													<span style={{ fontSize: '16px' }}>🔍</span>
													<span
														style={{
															fontSize: '13px',
															fontWeight: '600',
															color: '#1e40af', // Dark blue text
														}}
													>
														What Gets Discovered
													</span>
												</div>
												<div
													style={{
														fontSize: '12px',
														color: '#374151', // Dark text
														display: 'flex',
														flexDirection: 'column',
														gap: '6px',
													}}
												>
													<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
														<span>✅</span>
														<span>
															<strong>Authorization endpoint</strong> - Where users authenticate
														</span>
													</div>
													<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
														<span>✅</span>
														<span>
															<strong>Token endpoint</strong> - Where tokens are exchanged
														</span>
													</div>
													<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
														<span>✅</span>
														<span>
															<strong>UserInfo endpoint</strong> - Where user information is
															retrieved
														</span>
													</div>
													<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
														<span>✅</span>
														<span>
															<strong>JWKS endpoint</strong> - Public keys for token validation
														</span>
													</div>
													<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
														<span>✅</span>
														<span>
															<strong>Supported scopes</strong> - Available OAuth/OIDC scopes
														</span>
													</div>
													<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
														<span>✅</span>
														<span>
															<strong>Response types</strong> - Supported OAuth response types
														</span>
													</div>
												</div>
											</div>

											{/* PingOne Example */}
											<div
												style={{
													padding: '12px',
													background: '#ffffff',
													border: '1px solid #93c5fd',
													borderRadius: '6px',
												}}
											>
												<div
													style={{
														display: 'flex',
														alignItems: 'center',
														gap: '8px',
														marginBottom: '8px',
													}}
												>
													<span style={{ fontSize: '16px' }}>🌐</span>
													<span
														style={{
															fontSize: '13px',
															fontWeight: '600',
															color: '#1e40af', // Dark blue text
														}}
													>
														PingOne Example
													</span>
												</div>
												<div
													style={{
														fontSize: '12px',
														color: '#374151', // Dark text
														marginBottom: '8px',
													}}
												>
													For PingOne, you can use either:
												</div>
												<div
													style={{
														display: 'flex',
														flexDirection: 'column',
														gap: '8px',
														marginBottom: '8px',
													}}
												>
													<div
														style={{
															padding: '8px',
															background: '#f3f4f6',
															borderRadius: '4px',
															fontFamily: 'monospace',
															fontSize: '11px',
															color: '#1f2937',
															wordBreak: 'break-all',
														}}
													>
														<strong>Environment ID:</strong>{' '}
														{credentials.environmentId || '{your-environment-id}'}
													</div>
													<div
														style={{
															padding: '8px',
															background: '#f3f4f6',
															borderRadius: '4px',
															fontFamily: 'monospace',
															fontSize: '11px',
															color: '#1f2937',
															wordBreak: 'break-all',
														}}
													>
														<strong>Issuer URL:</strong>{' '}
														{credentials.environmentId
															? `https://auth.pingone.com/${credentials.environmentId}/as`
															: 'https://auth.pingone.com/{environment-id}/as'}
													</div>
												</div>
												<div
													style={{
														fontSize: '11px',
														color: '#1e40af',
														display: 'flex',
														alignItems: 'center',
														gap: '6px',
													}}
												>
													<span>💡</span>
													<span>
														If you provide an Environment ID, the issuer URL will be auto-generated
													</span>
												</div>
											</div>
										</div>

										{/* RFC Reference */}
										<div
											style={{
												marginTop: '12px',
												padding: '12px',
												background: '#fef3c7', // Light yellow background
												border: '1px solid #fbbf24',
												borderRadius: '6px',
											}}
										>
											<div
												style={{
													fontSize: '12px',
													color: '#92400e', // Dark brown text - high contrast
													lineHeight: '1.5',
												}}
											>
												<strong>📖 RFC Reference:</strong> OIDC Discovery is defined in{' '}
												<strong>OpenID Connect Discovery 1.0</strong> (OIDC Discovery). The
												well-known configuration endpoint provides a standardized way to discover
												OAuth/OIDC provider capabilities.
											</div>
										</div>
									</div>
								)}
								<div className="form-group">
									<label>Issuer URL or Environment ID</label>
									<div style={{ display: 'flex', gap: '8px' }}>
										<input
											type="text"
											placeholder={
												credentials.environmentId
													? `Using: ${credentials.environmentId} (or enter custom)`
													: 'https://auth.example.com or environment-id'
											}
											value={discoveryInput}
											onChange={(e) => setDiscoveryInput(e.target.value)}
											aria-label="Discovery input"
											style={{ flex: 1 }}
										/>
										<button
											type="button"
											onClick={handleDiscovery}
											disabled={
												isDiscovering ||
												(!discoveryInput.trim() && !credentials.environmentId?.trim())
											}
											style={{
												padding: '10px 16px',
												background:
													isDiscovering ||
													(!discoveryInput.trim() && !credentials.environmentId?.trim())
														? '#9ca3af'
														: '#3b82f6',
												color: 'white',
												border: 'none',
												borderRadius: '4px',
												fontSize: '14px',
												fontWeight: '600',
												cursor:
													isDiscovering ||
													(!discoveryInput.trim() && !credentials.environmentId?.trim())
														? 'not-allowed'
														: 'pointer',
												transition: 'background 0.2s ease',
												whiteSpace: 'nowrap',
											}}
											onMouseEnter={(e) => {
												if (
													!isDiscovering &&
													(discoveryInput.trim() || credentials.environmentId?.trim())
												) {
													e.currentTarget.style.background = '#2563eb';
												}
											}}
											onMouseLeave={(e) => {
												if (
													!isDiscovering &&
													(discoveryInput.trim() || credentials.environmentId?.trim())
												) {
													e.currentTarget.style.background = '#3b82f6';
												}
											}}
										>
											{isDiscovering ? '🔄 Discovering...' : '🔍 OIDC Discovery'}
										</button>
									</div>
									<small>
										{credentials.environmentId ? (
											<span>
												✅ Will use Environment ID from General section:{' '}
												<strong>{credentials.environmentId}</strong>
												{discoveryInput.trim() && ` (or enter custom issuer URL above)`}
											</span>
										) : (
											'Auto-populate configuration from OIDC metadata. Enter issuer URL or environment ID.'
										)}
									</small>
								</div>
							</div>
						</div>

						{/* OIDC SETTINGS SECTION - Matches PingOne Console */}
						<div className="form-section" data-section="oidc-settings">
							<div className="section-header">
								<h3>⚙️ OIDC Settings</h3>
							</div>
							<div className="section-content">
								{/* Educational note for implicit flow - no token endpoint */}
								{effectiveFlowType === 'implicit' && (
									<div
										style={{
											background: '#f0f9ff',
											border: '1px solid #bae6fd',
											borderRadius: '6px',
											padding: '12px',
											marginBottom: '16px',
										}}
									>
										<div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
											<span style={{ fontSize: '20px', flexShrink: 0 }}>ℹ️</span>
											<div style={{ fontSize: '13px', color: '#0c4a6e', lineHeight: '1.6' }}>
												<strong>Implicit Flow doesn't use the token endpoint</strong>
												<p style={{ margin: '6px 0 0 0' }}>
													Tokens are returned directly in the authorization response (URL fragment).
													There's no token exchange step, so no client authentication is needed.
												</p>
											</div>
										</div>
									</div>
								)}

								{/* Token Endpoint Authentication Method - Moved from Advanced */}
								{showClientAuthMethod && allAuthMethodsWithStatus.length > 0 && (
									<div className="form-group">
										<TokenEndpointAuthMethodDropdownV8
											value={
												(credentials.clientAuthMethod || defaultAuthMethod) as
													| 'none'
													| 'client_secret_basic'
													| 'client_secret_post'
													| 'client_secret_jwt'
													| 'private_key_jwt'
											}
											onChange={(method) => handleChange('clientAuthMethod', method)}
											flowType={(effectiveFlowType as FlowType) || 'oauth-authz'}
											specVersion={specVersion}
											usePKCE={usePKCE}
										/>

										{/* JWT Configuration Button and Description */}
										{(credentials.clientAuthMethod === 'client_secret_jwt' ||
											credentials.clientAuthMethod === 'private_key_jwt') && (
											<div style={{ marginTop: '8px' }}>
												{credentials.clientAuthMethod === 'client_secret_jwt' && (
													<>
														<p
															style={{
																fontSize: '12px',
																color: '#475569',
																marginBottom: '8px',
																lineHeight: '1.5',
															}}
														>
															Client Secret JWT uses a JWT signed with the client secret using
															HMAC-SHA256. More secure than sending the secret directly, as it's
															used only for signing.
														</p>
														<button
															type="button"
															onClick={() => setShowClientSecretJwtModal(true)}
															style={{
																padding: '6px 12px',
																fontSize: '13px',
																fontWeight: '500',
																borderRadius: '6px',
																border: '1px solid #3b82f6',
																background: '#3b82f6',
																color: 'white',
																cursor: 'pointer',
																transition: 'all 0.2s ease',
															}}
															onMouseEnter={(e) => {
																e.currentTarget.style.background = '#2563eb';
																e.currentTarget.style.borderColor = '#1d4ed8';
															}}
															onMouseLeave={(e) => {
																e.currentTarget.style.background = '#3b82f6';
																e.currentTarget.style.borderColor = '#3b82f6';
															}}
														>
															🔧 Configure Client Secret JWT
														</button>
													</>
												)}
												{credentials.clientAuthMethod === 'private_key_jwt' && (
													<>
														<p
															style={{
																fontSize: '12px',
																color: '#475569',
																marginBottom: '8px',
																lineHeight: '1.5',
															}}
														>
															Private Key JWT uses asymmetric cryptography with a private key for
															signing. The most secure method, as the private key never leaves your
															application.
														</p>
														<button
															type="button"
															onClick={() => setShowPrivateKeyJwtModal(true)}
															style={{
																padding: '6px 12px',
																fontSize: '13px',
																fontWeight: '500',
																borderRadius: '6px',
																border: '1px solid #3b82f6',
																background: '#3b82f6',
																color: 'white',
																cursor: 'pointer',
																transition: 'all 0.2s ease',
															}}
															onMouseEnter={(e) => {
																e.currentTarget.style.background = '#2563eb';
																e.currentTarget.style.borderColor = '#1d4ed8';
															}}
															onMouseLeave={(e) => {
																e.currentTarget.style.background = '#3b82f6';
																e.currentTarget.style.borderColor = '#3b82f6';
															}}
														>
															🔧 Configure Private Key JWT
														</button>
													</>
												)}
											</div>
										)}
									</div>
								)}

								{/* Response Type - Moved from Advanced */}
								{validResponseTypes.length > 0 && (
									<div className="form-group">
										<ResponseTypeDropdownV8
											value={credentials.responseType || defaultResponseType}
											onChange={(type) => handleChange('responseType', type)}
											flowType={
												flowType === 'oauth-authz'
													? 'oauth-authz'
													: flowType === 'implicit'
														? 'implicit'
														: 'hybrid'
											}
											specVersion={specVersion}
										/>
									</div>
								)}

								{/* Grant Type (read-only, informational) */}
								<div className="form-group">
									<label>Grant Type</label>
									<div
										style={{
											padding: '10px 12px',
											background: '#f9fafb',
											border: '1px solid #e5e7eb',
											borderRadius: '6px',
											fontSize: '14px',
											color: '#374151',
											width: '100%',
											boxSizing: 'border-box',
										}}
									>
										{SpecVersionServiceV8.getFlowLabel(effectiveFlowType)}
									</div>
									<small>Based on selected flow type</small>
								</div>

								{/* Redirect URIs */}
								{flowOptions.requiresRedirectUri && (
									<div className="form-group">
										<label>
											Redirect URIs <span className="required">*</span>
											<TooltipV8
												title={TooltipContentServiceV8.REDIRECT_URI.title}
												content={TooltipContentServiceV8.REDIRECT_URI.content}
											/>
										</label>
										<input
											type="text"
											placeholder={RedirectUriServiceV8.getRedirectUriPlaceholder(
												getRedirectFlowKey()
											)}
											value={credentials.redirectUri || ''}
											onChange={(e) => handleChange('redirectUri', e.target.value)}
											aria-label="Redirect URI"
										/>
										<small>⚠️ Must EXACTLY match PingOne app config (flow-specific endpoint)</small>
										{appConfig?.redirectUris &&
											!appConfig.redirectUris.includes(credentials.redirectUri || '') && (
												<small style={{ color: '#ff9800' }}>
													⚠️ Not registered in app - update app config
												</small>
											)}
										<small style={{ display: 'block', marginTop: '8px' }}>
											💡{' '}
											<a
												href={`/configuration#redirect-uri-catalog-${effectiveFlowType}`}
												style={{
													color: '#0ea5e9',
													textDecoration: 'none',
													fontWeight: 500,
												}}
												onMouseEnter={(e) => {
													e.currentTarget.style.textDecoration = 'underline';
												}}
												onMouseLeave={(e) => {
													e.currentTarget.style.textDecoration = 'none';
												}}
											>
												View all redirect URIs in Setup page
											</a>
										</small>
									</div>
								)}

								{/* Response Mode Dropdown */}
								{checkboxAvailability.showRedirectless && (
									<div className="form-group" style={{ marginBottom: '16px' }}>
										<ResponseModeDropdownV8
											value={responseMode}
											onChange={(mode) => {
												console.log(`${MODULE_TAG} Response mode changed to ${mode}`);
												setResponseMode(mode);
												handleChange('responseMode', mode);

												// Also update legacy useRedirectless for backward compatibility
												const isRedirectless = mode === 'pi.flow';
												handleChange('useRedirectless', isRedirectless);

												// Show toast notification
												const modeNames: Record<ResponseMode, string> = {
													query: 'Query String',
													fragment: 'URL Fragment',
													form_post: 'Form POST',
													'pi.flow': 'Redirectless (PingOne)',
												};
												toastV8.info(`Response mode set to: ${modeNames[mode]}`);
											}}
											flowType={
												flowType === 'oauth-authz'
													? 'oauth-authz'
													: flowType === 'implicit'
														? 'implicit'
														: 'hybrid'
											}
										/>
									</div>
								)}

								{/* Sign Off URLs (Post-Logout Redirect URIs) */}
								{flowOptions.supportsPostLogoutRedirectUri && (
									<div className="form-group">
										<label>
											Sign Off URLs (Post-Logout Redirect URIs){' '}
											<span className="optional">(optional)</span>
											<TooltipV8
												title={TooltipContentServiceV8.POST_LOGOUT_REDIRECT_URI.title}
												content={TooltipContentServiceV8.POST_LOGOUT_REDIRECT_URI.content}
											/>
										</label>
										<input
											type="text"
											placeholder={RedirectUriServiceV8.getPostLogoutRedirectUriPlaceholder(
												getRedirectFlowKey()
											)}
											value={credentials.postLogoutRedirectUri || ''}
											onChange={(e) => handleChange('postLogoutRedirectUri', e.target.value)}
											aria-label="Post-Logout Redirect URI"
										/>
										<small>⚠️ Must match PingOne "Sign Off URLs" (OIDC only)</small>
										{appConfig?.logoutUris &&
											credentials.postLogoutRedirectUri &&
											!appConfig.logoutUris.includes(credentials.postLogoutRedirectUri) && (
												<small style={{ color: '#ff9800' }}>
													⚠️ Not registered in app - update app config
												</small>
											)}
									</div>
								)}

								{/* Scopes */}
								{config.includeScopes && (
									<div className="form-group">
										<label
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
												flexWrap: 'wrap',
											}}
										>
											<span style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
												<span>
													Scopes <span className="required">*</span>
												</span>
												<TooltipV8
													title={TooltipContentServiceV8.SCOPES.title}
													content={TooltipContentServiceV8.SCOPES.content}
												/>
											</span>
											<button
												type="button"
												onClick={() => setShowScopesEducationModal(true)}
												style={{
													display: 'inline-flex',
													alignItems: 'center',
													gap: '4px',
													padding: '4px 8px',
													background: '#eff6ff',
													border: '1px solid #93c5fd',
													borderRadius: '4px',
													fontSize: '12px',
													color: '#1e40af',
													cursor: 'pointer',
													transition: 'all 0.2s ease',
													fontWeight: '500',
													marginLeft: 'auto',
												}}
												onMouseEnter={(e) => {
													e.currentTarget.style.background = '#dbeafe';
												}}
												onMouseLeave={(e) => {
													e.currentTarget.style.background = '#eff6ff';
												}}
											>
												<FiInfo size={14} />
												What is this?
											</button>
										</label>
										<input
											type="text"
											placeholder={
												providedFlowType === 'client-credentials'
													? 'api:read api:write custom:scope (space-separated)'
													: 'openid'
											}
											value={
												credentials.scopes ||
												(providedFlowType === 'client-credentials' ? '' : 'openid')
											}
											style={getFieldErrorStyle(credentials.scopes, true)}
											onChange={(e) => {
												// Allow users to type freely - no filtering during typing
												// All custom scopes are allowed and preserved exactly as typed
												const newValue = e.target.value;

												// Update scopes immediately - allows any custom scope to be entered
												handleChange('scopes', newValue);
											}}
											onBlur={(e) => {
												// Optional: Only filter invalid scopes on blur (when user finishes typing)
												// Allow all scopes to be typed freely
											}}
											aria-label="Scopes"
										/>
										<small>
											{providedFlowType === 'client-credentials'
												? 'Use resource server scopes (e.g., ClaimScope, custom:read, api:read). Space-separated. Must be enabled in PingOne app Resources tab under a resource server. Note: OIDC scopes (openid, profile, email) and self-management scopes (p1:read:user) do NOT work with client_credentials - you need resource server scopes like "ClaimScope".'
												: providedFlowType === 'device-code'
													? 'OIDC scopes for user authentication (e.g., openid profile email offline_access) - Device Flow is for user authorization, not machine-to-machine'
													: 'Type space-separated scopes (e.g., openid profile email). Custom scopes are allowed. Must be enabled in PingOne app.'}
										</small>
										{/* Show warning if invalid scopes detected for device code flow */}
										{providedFlowType === 'device-code' &&
											credentials.scopes &&
											(() => {
												const scopesArray = credentials.scopes.split(/\s+/).filter((s) => s.trim());
												const managementApiScopes = scopesArray.filter(
													(s) =>
														s.toLowerCase().startsWith('p1:read:') ||
														s.toLowerCase().startsWith('p1:update:') ||
														s.toLowerCase().startsWith('p1:create:') ||
														s.toLowerCase().startsWith('p1:delete:')
												);
												const hasOpenId = scopesArray.some((s) => s.toLowerCase() === 'openid');

												if (managementApiScopes.length > 0 || !hasOpenId) {
													return (
														<div
															style={{
																marginTop: '8px',
																padding: '12px',
																background: '#fef3c7',
																border: '1px solid #f59e0b',
																borderRadius: '6px',
																fontSize: '13px',
															}}
														>
															<div
																style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}
															>
																<span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
																<div>
																	<strong style={{ color: '#92400e' }}>
																		Scope Guidance for Device Authorization Flow:
																	</strong>
																	{managementApiScopes.length > 0 && (
																		<p style={{ margin: '4px 0 0 0', color: '#78350f' }}>
																			• <strong>{managementApiScopes.join(', ')}</strong> are
																			Management API scopes for machine-to-machine authentication
																			(Client Credentials flow). Device Authorization Flow is for
																			user authentication. Use OIDC scopes instead (e.g., openid
																			profile email offline_access).
																		</p>
																	)}
																	{!hasOpenId && (
																		<p style={{ margin: '4px 0 0 0', color: '#78350f' }}>
																			• <strong>'openid' scope is missing.</strong> Device
																			Authorization Flow is typically used for user authentication
																			with OIDC. Without 'openid', you won't receive an ID token.
																			Consider adding 'openid' to your scopes.
																		</p>
																	)}
																	<div
																		style={{
																			margin: '12px 0 0 0',
																			padding: '10px',
																			background: '#f0f9ff',
																			border: '1px solid #0ea5e9',
																			borderRadius: '4px',
																		}}
																	>
																		<strong
																			style={{
																				color: '#0c4a6e',
																				fontSize: '12px',
																				display: 'block',
																				marginBottom: '6px',
																			}}
																		>
																			📚 About OpenID Connect Scopes:
																		</strong>
																		<p
																			style={{
																				margin: '4px 0',
																				fontSize: '12px',
																				color: '#075985',
																				lineHeight: '1.5',
																			}}
																		>
																			Standard OpenID Connect scopes control which user claims are
																			included in an <strong>id_token</strong> or in a{' '}
																			<strong>/userinfo</strong> response. You must include{' '}
																			<strong>openid</strong> in your requested scopes if you want
																			to use the access token to call the <strong>/userinfo</strong>{' '}
																			endpoint and get a <strong>sub</strong> attribute in the
																			response.
																		</p>
																		<p
																			style={{
																				margin: '4px 0 0 0',
																				fontSize: '12px',
																				color: '#075985',
																				lineHeight: '1.5',
																			}}
																		>
																			You can include additional OpenID Connect scopes (e.g.,{' '}
																			<strong>profile</strong>, <strong>email</strong>,{' '}
																			<strong>offline_access</strong>) in the scope parameter to add
																			more user claims in the id_token and return more information
																			about the user in the /userinfo response.
																		</p>
																	</div>
																	<p
																		style={{
																			margin: '8px 0 0 0',
																			fontSize: '12px',
																			color: '#92400e',
																		}}
																	>
																		💡 <strong>Recommended scopes:</strong> openid profile email
																		offline_access
																	</p>
																</div>
															</div>
														</div>
													);
												}
												return null;
											})()}
										{/* Show warning if no scopes provided for device code */}
										{providedFlowType === 'device-code' &&
											(!credentials.scopes || !credentials.scopes.trim()) && (
												<div
													style={{
														marginTop: '8px',
														padding: '12px',
														background: '#eff6ff',
														border: '1px solid #3b82f6',
														borderRadius: '6px',
														fontSize: '13px',
													}}
												>
													<div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
														<span style={{ fontSize: '18px', flexShrink: 0 }}>ℹ️</span>
														<div>
															<strong style={{ color: '#1e40af' }}>Scope Recommendation:</strong>
															<p style={{ margin: '4px 0 0 0', color: '#1e3a8a' }}>
																For Device Authorization Flow with user authentication, consider
																using: <strong>openid profile email offline_access</strong>
															</p>
															<p
																style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#1e40af' }}
															>
																These scopes allow the device to authenticate users and access their
																profile information.
															</p>
														</div>
													</div>
												</div>
											)}
										{/* Show warning if invalid scopes detected for client credentials */}
										{providedFlowType === 'client-credentials' &&
											credentials.scopes &&
											(() => {
												const scopesArray = credentials.scopes.split(/\s+/).filter((s) => s.trim());
												const invalidOidcScopes = scopesArray.filter((s) =>
													['offline_access', 'profile', 'email', 'address', 'phone'].includes(
														s.toLowerCase()
													)
												);

												// Note: Singular forms (p1:read:user) are CORRECT - no warning needed
												// Management API scopes use singular forms, not plural

												if (invalidOidcScopes.length > 0) {
													return (
														<div
															style={{
																marginTop: '8px',
																padding: '12px',
																background: '#fef3c7',
																border: '1px solid #f59e0b',
																borderRadius: '6px',
																fontSize: '13px',
															}}
														>
															<div
																style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}
															>
																<span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
																<div>
																	<strong style={{ color: '#92400e' }}>
																		Scope Issues Detected:
																	</strong>
																	{invalidOidcScopes.length > 0 && (
																		<p style={{ margin: '4px 0 0 0', color: '#78350f' }}>
																			• <strong>{invalidOidcScopes.join(', ')}</strong> are user
																			authentication scopes and may not work with client credentials
																			flow. They have been automatically removed.
																		</p>
																	)}
																	<p
																		style={{
																			margin: '8px 0 0 0',
																			fontSize: '12px',
																			color: '#92400e',
																		}}
																	>
																		<strong>Important:</strong> Client credentials flow should only
																		use <strong>custom resource server scopes</strong> (e.g.,{' '}
																		<code>api:read</code>, <code>api:write</code>,{' '}
																		<code>custom:scope</code>). Management API scopes (p1:*) are for
																		Worker tokens only, not client_credentials. See{' '}
																		<a
																			href="https://apidocs.pingidentity.com/pingone/main/v1/api/#access-services-through-scopes-and-roles"
																			target="_blank"
																			rel="noopener noreferrer"
																			style={{ color: '#3b82f6', textDecoration: 'underline' }}
																		>
																			PingOne API Documentation
																		</a>
																	</p>
																</div>
															</div>
														</div>
													);
												}
												return null;
											})()}
										{/* Clickable scope buttons */}
										{(() => {
											// For device code flow, show OIDC scopes
											if (providedFlowType === 'device-code') {
												const oidcScopes = [
													'openid',
													'profile',
													'email',
													'address',
													'phone',
													'offline_access',
												];

												const scopesToShow =
													allowedScopes.length > 0 &&
													!allowedScopes.some((s) => s.startsWith('p1:'))
														? allowedScopes
														: oidcScopes;

												return (
													<div
														style={{
															marginTop: '8px',
															display: 'flex',
															flexWrap: 'wrap',
															gap: '6px',
															padding: '8px',
															background: '#f9fafb',
															borderRadius: '4px',
															border: '1px solid #e5e7eb',
														}}
													>
														<div
															style={{
																width: '100%',
																marginBottom: '4px',
																fontSize: '12px',
																color: '#6b7280',
																fontWeight: '500',
															}}
														>
															Quick Add OIDC Scopes:
														</div>
														{scopesToShow.map((scope) => {
															const currentScopes = (credentials.scopes || '')
																.split(/\s+/)
																.filter((s) => s.trim());
															const isSelected = currentScopes.includes(scope);

															return (
																<div
																	key={scope}
																	style={{
																		display: 'inline-flex',
																		alignItems: 'center',
																		gap: '4px',
																	}}
																>
																	<button
																		type="button"
																		onClick={() => {
																			const scopesArray = (credentials.scopes || '')
																				.split(/\s+/)
																				.filter((s) => s.trim());
																			let updatedScopes: string[];

																			if (isSelected) {
																				// Remove scope
																				updatedScopes = scopesArray.filter((s) => s !== scope);
																			} else {
																				// Add scope
																				updatedScopes = [...scopesArray, scope];
																			}

																			handleChange('scopes', updatedScopes.join(' '));
																		}}
																		style={{
																			padding: '4px 8px',
																			borderRadius: '4px',
																			fontSize: '12px',
																			fontWeight: '500',
																			cursor: 'pointer',
																			border: isSelected
																				? '2px solid #3b82f6'
																				: '1px solid #d1d5db',
																			background: isSelected ? '#dbeafe' : '#ffffff',
																			color: isSelected ? '#1e40af' : '#6b7280',
																			transition: 'all 0.2s ease',
																			display: 'inline-block',
																		}}
																		onMouseEnter={(e) => {
																			if (!isSelected) {
																				e.currentTarget.style.background = '#f3f4f6';
																				e.currentTarget.style.borderColor = '#9ca3af';
																			}
																		}}
																		onMouseLeave={(e) => {
																			if (!isSelected) {
																				e.currentTarget.style.background = '#ffffff';
																				e.currentTarget.style.borderColor = '#d1d5db';
																			}
																		}}
																	>
																		{scope}
																	</button>
																</div>
															);
														})}
													</div>
												);
											}
											// For client credentials flow, filter out self-management scopes (p1:*)
											// OIDC scopes (openid, profile, email, etc.) are allowed
											// Self-management scopes (p1:read:user, etc.) cannot be granted on client_credentials
											if (providedFlowType === 'client-credentials') {
												// Filter out self-management scopes (p1:*)
												// Allow OIDC scopes and custom scopes
												const scopesToShow =
													allowedScopes.length > 0
														? allowedScopes.filter((s) => !s.startsWith('p1:'))
														: [];

												// Show OIDC scopes and custom scopes if available
												if (scopesToShow.length === 0) {
													return null; // Don't show any scope buttons if no scopes available
												}

												return (
													<div
														style={{
															marginTop: '8px',
															display: 'flex',
															flexWrap: 'wrap',
															gap: '6px',
															padding: '8px',
															background: '#f9fafb',
															borderRadius: '4px',
															border: '1px solid #e5e7eb',
														}}
													>
														{isLoadingScopes ? (
															<span style={{ fontSize: '12px', color: '#6b7280' }}>
																Loading allowed scopes...
															</span>
														) : (
															scopesToShow.map((scope) => {
																const currentScopes = (credentials.scopes || '')
																	.split(/\s+/)
																	.filter((s) => s.trim());
																const isSelected = currentScopes.includes(scope);

																// Tooltip content for Management API scopes
																const getTooltipContent = () => {
																	const scopeDescriptions: Record<string, string> = {
																		'p1:read:user':
																			'Read user information from the directory. The user schema attributes that can be read for this scope. The value is an array of schema attribute paths (such as username, name.given, shirtSize) that the scope controls. This property is supported for p1:read:user, p1:update:user and custom scopes like p1:read:user:{suffix} and p1:update:user:{suffix}. Any attributes not listed in the attribute array are excluded from the read action. The wildcard path (*) in the array includes all attributes and cannot be used in conjunction with any other user schema attribute paths.',
																		'p1:update:user':
																			'Update user attributes in the directory. Allows modifying user information such as profile data, email, phone, etc.',
																		'p1:create:user':
																			'Create new users in the directory. Required for user provisioning and onboarding workflows.',
																		'p1:delete:user':
																			'Delete users from the directory. Use with caution as this is a destructive operation.',
																		'p1:read:environment':
																			'Read environment-level information and configuration from the PingOne Management API. Includes environment metadata, settings, and configuration.',
																		'p1:update:environment':
																			'Modify environment configuration. Allows updating environment settings, policies, and other configuration.',
																		'p1:read:application':
																			'Read application configurations. Required to view OAuth/OIDC application settings, redirect URIs, and other app details.',
																		'p1:create:application':
																			'Create new applications. Required for programmatic application provisioning.',
																		'p1:update:application':
																			'Update application settings. Allows modifying OAuth/OIDC app configuration, redirect URIs, scopes, etc.',
																		'p1:delete:application':
																			'Delete applications. Use with caution as this permanently removes the application.',
																		'p1:read:population':
																			'Read population definitions. Populations are collections of users with shared attributes or characteristics.',
																		'p1:update:population':
																			'Modify population definitions. Allows creating, updating, or deleting user populations.',
																		'p1:read:group':
																			'Read group information. Groups are collections of users used for access control and permissions.',
																		'p1:update:group':
																			'Modify groups. Allows creating, updating, or deleting groups and managing group membership.',
																		'p1:read:role':
																			'Read role assignments. Roles define collections of permissions for administrators or applications.',
																		'p1:update:role':
																			'Modify role assignments. Allows assigning or removing roles from users or applications.',
																		'p1:read:audit':
																			'Read audit events. Required to access audit logs and security event history.',
																		'p1:read:authenticator':
																			'Read MFA authenticators and devices. Allows viewing registered MFA devices for users.',
																		'p1:update:authenticator':
																			'Modify or delete authenticators. Allows managing MFA devices, including registration and deletion.',
																	};

																	const description = scopeDescriptions[scope];
																	if (!description) return null;

																	return (
																		<div>
																			<strong>{scope}</strong>
																			<p style={{ margin: '8px 0 0 0' }}>{description}</p>
																			<p
																				style={{
																					margin: '8px 0 0 0',
																					fontSize: '12px',
																					color: '#6b7280',
																					fontStyle: 'italic',
																				}}
																			>
																				Reference:{' '}
																				<a
																					href="https://apidocs.pingidentity.com/pingone/main/v1/api/#access-services-through-scopes-and-roles"
																					target="_blank"
																					rel="noopener noreferrer"
																					style={{ color: '#3b82f6' }}
																				>
																					PingOne API Documentation
																				</a>
																			</p>
																		</div>
																	);
																};

																return (
																	<div
																		key={scope}
																		style={{
																			display: 'inline-flex',
																			alignItems: 'center',
																			gap: '4px',
																		}}
																	>
																		<button
																			type="button"
																			onClick={() => {
																				const scopesArray = (credentials.scopes || '')
																					.split(/\s+/)
																					.filter((s) => s.trim());
																				let updatedScopes: string[];

																				if (isSelected) {
																					// Remove scope
																					updatedScopes = scopesArray.filter((s) => s !== scope);
																				} else {
																					// Add scope
																					updatedScopes = [...scopesArray, scope];
																				}

																				handleChange('scopes', updatedScopes.join(' '));
																			}}
																			style={{
																				padding: '4px 8px',
																				borderRadius: '4px',
																				fontSize: '12px',
																				fontWeight: '500',
																				cursor: 'pointer',
																				border: isSelected
																					? '2px solid #3b82f6'
																					: '1px solid #d1d5db',
																				background: isSelected ? '#dbeafe' : '#ffffff',
																				color: isSelected ? '#1e40af' : '#6b7280',
																				transition: 'all 0.2s ease',
																				display: 'inline-block',
																			}}
																			onMouseEnter={(e) => {
																				if (!isSelected) {
																					e.currentTarget.style.background = '#f3f4f6';
																					e.currentTarget.style.borderColor = '#9ca3af';
																				}
																			}}
																			onMouseLeave={(e) => {
																				if (!isSelected) {
																					e.currentTarget.style.background = '#ffffff';
																					e.currentTarget.style.borderColor = '#d1d5db';
																				}
																			}}
																			title={
																				isSelected
																					? `Click to remove ${scope}`
																					: `Click to add ${scope}`
																			}
																		>
																			{scope}
																		</button>
																		{getTooltipContent() && (
																			<TooltipV8
																				title={scope}
																				content={getTooltipContent()}
																				position="top"
																			/>
																		)}
																	</div>
																);
															})
														)}
													</div>
												);
											}

											// Use allowedScopes if available, otherwise use common OIDC scopes as fallback
											const scopesToShow =
												allowedScopes.length > 0
													? allowedScopes
													: ['openid', 'profile', 'email', 'address', 'phone', 'offline_access'];

											return (
												<div
													style={{
														marginTop: '8px',
														display: 'flex',
														flexWrap: 'wrap',
														gap: '6px',
														padding: '8px',
														background: '#f9fafb',
														borderRadius: '4px',
														border: '1px solid #e5e7eb',
													}}
												>
													{isLoadingScopes ? (
														<span style={{ fontSize: '12px', color: '#6b7280' }}>
															Loading allowed scopes...
														</span>
													) : (
														scopesToShow.map((scope) => {
															// For client-credentials flow, don't default to 'openid'
															const defaultScope = providedFlowType === 'client-credentials' ? '' : 'openid';
															const currentScopes = (credentials.scopes || defaultScope)
																.split(/\s+/)
																.filter((s) => s.trim());
															const isSelected = currentScopes.includes(scope);
															const isOfflineAccess = scope === 'offline_access';
															const isOpenId = scope === 'openid';

															// Tooltip content for specific scopes
															const getTooltipContent = () => {
																if (isOpenId) {
																	return (
																		<div>
																			<strong>Why am I not getting certain tokens?</strong>
																			<ul
																				style={{
																					margin: '8px 0 0 16px',
																					padding: 0,
																					listStyle: 'disc',
																				}}
																			>
																				<li style={{ marginBottom: '4px' }}>
																					<strong>ID Token</strong> only appears if you request{' '}
																					<code>openid</code>.
																				</li>
																				<li style={{ marginBottom: '4px' }}>
																					<strong>Refresh Token</strong> only appears if you request{' '}
																					<code>offline_access</code> and your app is allowed to use
																					refresh tokens.
																				</li>
																				<li style={{ marginBottom: '4px' }}>
																					<strong>Access Token</strong> is always returned.
																				</li>
																			</ul>
																			<p style={{ margin: '8px 0 0 0', fontWeight: '600' }}>
																				Rule: If you don't request the right scope, you won't get
																				the token.
																			</p>
																		</div>
																	);
																}
																if (isOfflineAccess) {
																	return (
																		<div>
																			<strong>Why am I not getting certain tokens?</strong>
																			<ul
																				style={{
																					margin: '8px 0 0 16px',
																					padding: 0,
																					listStyle: 'disc',
																				}}
																			>
																				<li style={{ marginBottom: '4px' }}>
																					<strong>ID Token</strong> only appears if you request{' '}
																					<code>openid</code>.
																				</li>
																				<li style={{ marginBottom: '4px' }}>
																					<strong>Refresh Token</strong> only appears if you request{' '}
																					<code>offline_access</code> and your app is allowed to use
																					refresh tokens.
																				</li>
																				<li style={{ marginBottom: '4px' }}>
																					<strong>Access Token</strong> is always returned.
																				</li>
																			</ul>
																			<p style={{ margin: '8px 0 0 0', fontWeight: '600' }}>
																				Rule: If you don't request the right scope, you won't get
																				the token.
																			</p>
																		</div>
																	);
																}
																return null;
															};

															return (
																<div
																	key={scope}
																	style={{
																		display: 'inline-flex',
																		alignItems: 'center',
																		gap: '4px',
																	}}
																>
																	<button
																		type="button"
																		onClick={() => {
																			// For client-credentials flow, don't default to 'openid'
																			const defaultScope = providedFlowType === 'client-credentials' ? '' : 'openid';
																			const scopesArray = (credentials.scopes || defaultScope)
																				.split(/\s+/)
																				.filter((s) => s.trim());
																			let updatedScopes: string[];

																			if (isSelected) {
																				// Remove scope
																				updatedScopes = scopesArray.filter((s) => s !== scope);
																				// For non-client-credentials flows, keep at least 'openid' if it was there
																				if (
																					providedFlowType !== 'client-credentials' &&
																					(updatedScopes.length === 0 ||
																					(updatedScopes.length === 1 &&
																						updatedScopes[0] === 'openid' &&
																							scope === 'openid'))
																				) {
																					updatedScopes = ['openid'];
																				}
																			} else {
																				// Add scope
																				updatedScopes = [...scopesArray, scope];
																				// For non-client-credentials flows, ensure 'openid' is always present
																				if (
																					providedFlowType !== 'client-credentials' &&
																					!updatedScopes.includes('openid')
																				) {
																					updatedScopes = [
																						'openid',
																						...updatedScopes.filter((s) => s !== 'openid'),
																					];
																				}
																			}

																			handleChange('scopes', updatedScopes.join(' '));
																		}}
																		style={{
																			padding: '4px 8px',
																			borderRadius: '4px',
																			fontSize: '12px',
																			fontWeight: '500',
																			cursor: 'pointer',
																			border: isSelected
																				? isOfflineAccess
																					? '2px solid #dc2626'
																					: '2px solid #3b82f6'
																				: '1px solid #d1d5db',
																			background: isSelected
																				? isOfflineAccess
																					? '#fee2e2'
																					: '#dbeafe'
																				: '#ffffff',
																			color: isSelected
																				? isOfflineAccess
																					? '#dc2626'
																					: '#1e40af'
																				: '#6b7280',
																			transition: 'all 0.2s ease',
																			display: 'inline-block',
																		}}
																		onMouseEnter={(e) => {
																			if (!isSelected) {
																				e.currentTarget.style.background = '#f3f4f6';
																				e.currentTarget.style.borderColor = '#9ca3af';
																			}
																		}}
																		onMouseLeave={(e) => {
																			if (!isSelected) {
																				e.currentTarget.style.background = '#ffffff';
																				e.currentTarget.style.borderColor = '#d1d5db';
																			}
																		}}
																		title={
																			isSelected
																				? `Click to remove ${scope}`
																				: `Click to add ${scope}`
																		}
																	>
																		{scope}
																	</button>
																	{(isOpenId || isOfflineAccess) && getTooltipContent() && (
																		<TooltipV8
																			title="Token Requirements"
																			content={getTooltipContent()}
																			position="top"
																		/>
																	)}
																</div>
															);
														})
													)}
												</div>
											);
										})()}
									</div>
								)}

								{/* Refresh Token Support - Moved below Scopes */}
								{flowOptions.supportsRefreshToken && (
									<div className="form-group" style={{ marginTop: '16px' }}>
										<div
											style={{
												padding: '12px',
												background: '#dbeafe',
												borderRadius: '4px',
												border: '1px solid #93c5fd',
											}}
										>
											<label
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: '8px',
													cursor: 'pointer',
													margin: 0,
												}}
											>
												<input
													type="checkbox"
													checked={enableRefreshToken}
													onChange={(e) => {
														const newValue = e.target.checked;

														// CRITICAL: Set flag IMMEDIATELY to prevent sync effect from running
														isUpdatingFromCheckbox.current = true;

														// Update local state immediately for UI responsiveness
														setEnableRefreshToken(newValue);

														// BATCH UPDATE: Combine all changes into a single credentials object
														const updatedCredentials = {
															...credentials,
															enableRefreshToken: newValue,
														};

														// Update scopes based on checkbox state
														if (newValue) {
															// Enabling: add offline_access if not present
															const currentScopes = credentials.scopes || '';
															const scopesArray = currentScopes
																.split(/\s+/)
																.filter((s) => s.trim());
															if (!scopesArray.includes('offline_access')) {
																updatedCredentials.scopes =
																	scopesArray.length > 0
																		? [...scopesArray, 'offline_access'].join(' ')
																		: 'offline_access';
																toastV8.info('Added offline_access scope to request refresh token');
															}
														} else {
															// Disabling: remove offline_access if present
															if (credentials.scopes) {
																const scopesArray = credentials.scopes
																	.split(/\s+/)
																	.filter((s) => s.trim());
																if (scopesArray.includes('offline_access')) {
																	updatedCredentials.scopes = scopesArray
																		.filter((s) => s !== 'offline_access')
																		.join(' ');
																	toastV8.info('Removed offline_access scope');
																}
															}
														}

														// SINGLE SAVE: Save to storage once with all changes
														try {
															if (FeatureFlagService.isEnabled('USE_NEW_CREDENTIALS_REPO')) {
																const credsForNew = {
																	...updatedCredentials,
																	scopes: typeof updatedCredentials.scopes === 'string' ? updatedCredentials.scopes.split(' ').filter(Boolean) : updatedCredentials.scopes
																};
																CredentialsRepository.setFlowCredentials(flowKey, credsForNew as any);
															} else {
																const credsForSave = updatedCredentials as unknown as Parameters<
																	typeof CredentialsServiceV8.saveCredentials
																>[1];
																CredentialsServiceV8.saveCredentials(flowKey, credsForSave);
															}

															// Save shared credentials (non-blocking)
															const sharedCreds =
																SharedCredentialsServiceV8.extractSharedCredentials(
																	updatedCredentials
																);
															if (sharedCreds.environmentId || sharedCreds.clientId) {
																SharedCredentialsServiceV8.saveSharedCredentialsSync(sharedCreds);
																SharedCredentialsServiceV8.saveSharedCredentials(sharedCreds).catch(
																	(err) => {
																		console.warn(
																			`${MODULE_TAG} Background disk save failed (non-critical):`,
																			err
																		);
																	}
																);
															}

															console.log(
																`${MODULE_TAG} ✅ Batched save complete for refresh token toggle`,
																{
																	flowKey,
																	enableRefreshToken: newValue,
																	scopesUpdated: updatedCredentials.scopes !== credentials.scopes,
																}
															);
														} catch (error) {
															console.error(
																`${MODULE_TAG} ❌ Error saving credentials for refresh token toggle`,
																{ flowKey, error }
															);
														}

														// SINGLE ONCHANGE: Notify parent once with all changes
														onChange(updatedCredentials);

														// EXTENDED TIMEOUT: Keep flag set longer to prevent sync effect from running during re-renders
														// This prevents the jitter by ensuring the sync effect skips multiple render cycles
														setTimeout(() => {
															isUpdatingFromCheckbox.current = false;
															console.log(`${MODULE_TAG} 🔓 Checkbox update flag cleared`);
														}, 300); // Increased from 100ms to 300ms for more safety
													}}
													style={{ cursor: 'pointer' }}
												/>
												<span style={{ fontWeight: '600', color: '#0c4a6e' }}>
													🔄 Enable Refresh Token
												</span>
											</label>
											<small
												style={{
													display: 'block',
													marginTop: '6px',
													color: '#0c4a6e',
													lineHeight: '1.5',
												}}
											>
												{enableRefreshToken ? (
													<>
														<strong>Refresh tokens enabled:</strong> The <code>offline_access</code>{' '}
														scope will be automatically included in your authorization request. This
														allows your application to receive a refresh token along with the access
														token. Refresh tokens are long-lived credentials that can be used to
														obtain new access tokens without requiring the user to re-authenticate,
														enabling your app to maintain user sessions even after access tokens
														expire. This is essential for applications that need to access protected
														resources in the background or when the user is not actively using the
														app.
													</>
												) : (
													<>
														<strong>Enable this option</strong> to automatically include the{' '}
														<code>offline_access</code> scope in your authorization request. When
														enabled, PingOne will issue a refresh token along with the access token.
														Refresh tokens allow your application to obtain new access tokens
														without user interaction, enabling seamless session management and
														background API access. Without this, you'll only receive short-lived
														access tokens that expire quickly, requiring users to re-authenticate
														frequently.
													</>
												)}
											</small>
											{credentials.scopes?.split(/\s+/).includes('offline_access') &&
												!enableRefreshToken && (
													<small
														style={{
															display: 'block',
															marginTop: '4px',
															color: '#dc2626',
															fontWeight: '500',
														}}
													>
														⚠️ offline_access scope is present - refresh token will be requested
													</small>
												)}
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Advanced Options Section - Collapsible */}
						<div className="form-section" data-section="advanced">
							<div
								className="section-header"
								onClick={() => setShowAdvancedSection(!showAdvancedSection)}
								style={{ cursor: 'pointer' }}
							>
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										width: '100%',
									}}
								>
									<h3>🔧 Advanced Options</h3>
									<span
										style={{
											fontSize: '18px',
											transform: showAdvancedSection ? 'rotate(90deg)' : 'rotate(0deg)',
											transition: 'transform 0.3s ease',
										}}
									>
										›
									</span>
								</div>
							</div>
							{showAdvancedSection && (
								<div className="section-content">
									<div
										style={{
											padding: '12px',
											background: '#f0f9ff',
											borderRadius: '4px',
											marginBottom: '12px',
											fontSize: '13px',
											color: '#0c4a6e',
										}}
									>
										<strong>Advanced Options:</strong> Configure additional OAuth/OIDC parameters
										for your flow
									</div>

									{/* PKCE - Educational Component - Only for flows that support PKCE */}
									{supportsPKCE && (
										<div className="form-group" style={{ marginBottom: '16px' }}>
											<PKCEInputV8
												value={pkceEnforcement as PKCEMode}
												onChange={(mode) => {
													console.log(`${MODULE_TAG} PKCE mode changed to ${mode}`);
													// Map PKCEMode to PKCEEnforcement (filter out DISABLED)
													const enforcement: 'OPTIONAL' | 'REQUIRED' | 'S256_REQUIRED' =
														mode === 'DISABLED' ? 'OPTIONAL' : mode;
													setPkceEnforcement(enforcement);
													handleChange('pkceEnforcement', enforcement);

													// Also update legacy usePKCE for backward compatibility
													handleChange('usePKCE', mode !== 'DISABLED');

													const modeNames: Record<PKCEMode, string> = {
														DISABLED: 'Disabled',
														OPTIONAL: 'Optional',
														REQUIRED: 'Required (Any Method)',
														S256_REQUIRED: 'Required (S256 Only)',
													};
													toastV8.info(`PKCE set to: ${modeNames[mode]}`);
												}}
												clientType={clientType}
												flowType={flowType}
											/>
										</div>
									)}

									{/* PAR (Pushed Authorization Requests) - Only for flows that support PAR */}
									{supportsPKCE && (
										<div className="form-group" style={{ marginBottom: '16px' }}>
											<div
												style={{
													padding: '12px',
													background: '#f0fdf4',
													borderRadius: '6px',
													border: '1px solid #86efac',
												}}
											>
												<label
													style={{
														display: 'flex',
														alignItems: 'center',
														gap: '8px',
														cursor: 'pointer',
														margin: 0,
													}}
												>
													<input
														type="checkbox"
														checked={usePAR}
														onChange={(e) => {
															const newValue = e.target.checked;
															setUsePAR(newValue);
															handleChange('usePAR', newValue);
															toastV8.info(
																newValue
																	? 'PAR (Pushed Authorization Requests) enabled'
																	: 'PAR disabled'
															);
														}}
														style={{
															width: '18px',
															height: '18px',
															cursor: 'pointer',
														}}
													/>
													<span
														style={{
															fontSize: '14px',
															fontWeight: '500',
															color: '#166534',
															flex: 1,
														}}
													>
														Enable PAR (Pushed Authorization Requests)
													</span>
													<button
														type="button"
														onClick={() => setShowPARInfoModal(true)}
														style={{
															display: 'inline-flex',
															alignItems: 'center',
															gap: '4px',
															padding: '4px 8px',
															background: '#eff6ff',
															border: '1px solid #93c5fd',
															borderRadius: '4px',
															fontSize: '12px',
															color: '#1e40af',
															cursor: 'pointer',
															transition: 'all 0.2s ease',
															fontWeight: '500',
															marginLeft: 'auto',
														}}
														onMouseEnter={(e) => {
															e.currentTarget.style.background = '#dbeafe';
														}}
														onMouseLeave={(e) => {
															e.currentTarget.style.background = '#eff6ff';
														}}
														title="Learn more about PAR (Pushed Authorization Requests)"
													>
														<FiInfo size={14} />
														What is this?
													</button>
												</label>
												{usePAR && (
													<p
														style={{
															margin: '8px 0 0 26px',
															fontSize: '12px',
															color: '#15803d',
															lineHeight: '1.5',
														}}
													>
														PAR will push authorization parameters to the server via POST before
														redirecting, enhancing security and supporting large requests.
													</p>
												)}
											</div>
										</div>
									)}

									{/* Issuer URL */}
									<div className="form-group">
										<IssuerURLInputV8
											value={credentials.issuerUrl || ''}
											onChange={(url) => handleChange('issuerUrl', url)}
											environmentId={credentials.environmentId}
											placeholder="https://auth.example.com"
										/>
									</div>
								</div>
							)}
						</div>

						{/* Additional Options Section - Only if flow supports them */}
						{flowOptions.supportsLoginHint && (
							<div className="form-section" data-section="additional">
								<div className="section-header">
									<h3>📋 Additional Options</h3>
								</div>
								<div className="section-content">
									{/* Login Hint Input - Educational Component */}
									{flowOptions.supportsLoginHint && showLoginHint && (
										<div className="form-group" style={{ marginBottom: '16px' }}>
											<LoginHintInputV8
												value={loginHint}
												onChange={(value) => {
													console.log(`${MODULE_TAG} Login hint changed to ${value}`);
													setLoginHint(value);
													handleChange('loginHint', value);
													// Removed toast message - LoginHintInputV8 component shows visual feedback
												}}
											/>
										</div>
									)}

									{/* Max Age Input */}
									{flowOptions.requiresRedirectUri && (
										<div className="form-group" style={{ marginBottom: '16px' }}>
											<MaxAgeInputV8
												value={maxAge}
												onChange={(value) => {
													console.log(`${MODULE_TAG} Max age changed to ${value}`);
													setMaxAge(value);
													handleChange('maxAge', value);
													if (value !== undefined) {
														const formatDuration = (seconds: number): string => {
															if (seconds === 0) return 'immediate re-authentication';
															if (seconds < 60) return `${seconds} seconds`;
															if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
															const hours = Math.floor(seconds / 3600);
															const mins = Math.floor((seconds % 3600) / 60);
															return mins > 0
																? `${hours}h ${mins}m`
																: `${hours} hour${hours > 1 ? 's' : ''}`;
														};
														toastV8.info(`Max authentication age set to: ${formatDuration(value)}`);
													}
												}}
											/>
										</div>
									)}

									{/* Display Mode Dropdown */}
									{flowOptions.requiresRedirectUri && (
										<div className="form-group" style={{ marginBottom: '16px' }}>
											<DisplayModeDropdownV8
												value={display}
												onChange={(value) => {
													console.log(`${MODULE_TAG} Display mode changed to ${value}`);
													setDisplay(value);
													handleChange('display', value);
													if (value) {
														const modeNames: Record<DisplayMode, string> = {
															page: 'Full Page',
															popup: 'Popup Window',
															touch: 'Touch Interface',
															wap: 'WAP Interface',
														};
														toastV8.info(`Display mode set to: ${modeNames[value]}`);
													}
												}}
											/>
										</div>
									)}

									{/* Prompt Parameter */}
									<div className="form-group">
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
												marginBottom: '4px',
											}}
										>
											<label style={{ marginBottom: 0, flex: 1 }}>
												Prompt <span className="optional">(optional)</span>
											</label>
											<button
												type="button"
												onClick={() => setShowPromptInfoModal(true)}
												style={{
													display: 'inline-flex',
													alignItems: 'center',
													gap: '4px',
													padding: '4px 8px',
													background: '#eff6ff',
													border: '1px solid #93c5fd',
													borderRadius: '4px',
													fontSize: '12px',
													color: '#1e40af',
													cursor: 'pointer',
													transition: 'all 0.2s ease',
													fontWeight: '500',
													marginLeft: 'auto',
												}}
												onMouseEnter={(e) => {
													e.currentTarget.style.background = '#dbeafe';
												}}
												onMouseLeave={(e) => {
													e.currentTarget.style.background = '#eff6ff';
												}}
												title="Learn about prompt values"
											>
												<FiInfo size={14} />
												What is this?
											</button>
										</div>
										<div className="select-wrapper">
											<select
												value={(credentials.prompt as string) || ''}
												onChange={(e) => handleChange('prompt', e.target.value)}
												aria-label="Prompt Parameter"
											>
												<option value="">Default (server decides)</option>
												<option value="none">none (no UI)</option>
												<option value="login">login (force authentication)</option>
												<option value="consent">consent (force consent)</option>
											</select>
											<FiChevronDown className="select-icon" />
										</div>
										<small>Contextualizes the re-authentication and consent experience</small>
									</div>
								</div>
							</div>
						)}

						{/* Save Button */}
						<div className="form-actions">
							<button
								type="button"
								className="btn-save"
								onClick={() => {
									toastV8.credentialsSaved();
									console.log(`${MODULE_TAG} Credentials saved`, { flowKey });
								}}
							>
								💾 Save Credentials
							</button>
						</div>
					</form>

					{/* Modals - Outside form to avoid nested form warnings */}
					<OidcDiscoveryModalV8
						isOpen={showDiscoveryModal}
						result={discoveryResult}
						onClose={() => setShowDiscoveryModal(false)}
						onApply={handleApplyDiscovery}
					/>

					{showWorkerTokenModal && (() => {
						// Check if we should show token only (matches MFA pattern)
						try {
							const config = MFAConfigurationServiceV8.loadConfiguration();
							const tokenStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
							
							// Show token-only if showTokenAtEnd is ON and token is valid
							const showTokenOnly = config.workerToken.showTokenAtEnd && tokenStatus.isValid;
							
							return (
					<WorkerTokenModalV8
						isOpen={showWorkerTokenModal}
									onClose={() => {
										setShowWorkerTokenModal(false);
										// Refresh token status when modal closes (matches MFA pattern)
										setTokenStatus(WorkerTokenStatusServiceV8.checkWorkerTokenStatus());
									}}
						onTokenGenerated={() => {
										// Match MFA pattern exactly
										window.dispatchEvent(new Event('workerTokenUpdated'));
								const newStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
								setTokenStatus(newStatus);
										toastV8.success('Worker token generated and saved!');
									}}
									environmentId={credentials.environmentId}
									showTokenOnly={showTokenOnly}
								/>
							);
						} catch {
							return (
								<WorkerTokenModalV8
									isOpen={showWorkerTokenModal}
									onClose={() => {
										setShowWorkerTokenModal(false);
										setTokenStatus(WorkerTokenStatusServiceV8.checkWorkerTokenStatus());
									}}
									onTokenGenerated={() => {
							window.dispatchEvent(new Event('workerTokenUpdated'));
										const newStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
										setTokenStatus(newStatus);
							toastV8.success('Worker token generated and saved!');
						}}
						environmentId={credentials.environmentId}
					/>
							);
						}
					})()}

					<AppDiscoveryModalV8U
						isOpen={showAppDiscoveryModal}
						onClose={() => setShowAppDiscoveryModal(false)}
						environmentId={credentials.environmentId}
						onAppSelected={handleAppSelected}
					/>

					{/* Prompt Info Modal */}
					<DraggableModal
						isOpen={showPromptInfoModal}
						onClose={() => setShowPromptInfoModal(false)}
						title="Authorization Prompt Values"
						width="600px"
					>
						<div style={{ padding: '24px' }}>
							<p style={{ marginBottom: '16px', color: '#4b5563' }}>
								The <code>prompt</code> parameter specifies whether the Authorization Server prompts
								the End-User for reauthentication and consent.
							</p>

							<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
								<div
									style={{
										background: '#f8fafc',
										padding: '12px',
										borderRadius: '8px',
										border: '1px solid #e2e8f0',
									}}
								>
									<strong style={{ color: '#1f2937' }}>none</strong>
									<p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
										The Authorization Server MUST NOT display any authentication or consent user
										interface pages. An error is returned if the End-User is not already
										authenticated.
									</p>
								</div>

								<div
									style={{
										background: '#f8fafc',
										padding: '12px',
										borderRadius: '8px',
										border: '1px solid #e2e8f0',
									}}
								>
									<strong style={{ color: '#1f2937' }}>login</strong>
									<p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
										The Authorization Server SHOULD prompt the End-User for reauthentication. If
										successful, the End-User is logged in.
									</p>
								</div>

								<div
									style={{
										background: '#f8fafc',
										padding: '12px',
										borderRadius: '8px',
										border: '1px solid #e2e8f0',
									}}
								>
									<strong style={{ color: '#1f2937' }}>consent</strong>
									<p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
										The Authorization Server SHOULD prompt the End-User for consent before returning
										information to the Client.
									</p>
								</div>

								<div
									style={{
										background: '#fee2e2',
										padding: '12px',
										borderRadius: '8px',
										border: '1px solid #ef4444',
									}}
								>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '8px',
											marginBottom: '4px',
										}}
									>
										<strong style={{ color: '#991b1b' }}>select_account</strong>
										<span
											style={{
												fontSize: '12px',
												background: '#ef4444',
												color: 'white',
												padding: '2px 6px',
												borderRadius: '4px',
											}}
										>
											Not Supported by PingOne
										</span>
									</div>
									<p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#7f1d1d' }}>
										PingOne does not currently support the <code>select_account</code> value.
										Attempting to use it may result in an error or it being ignored.
									</p>
								</div>
							</div>

							<button
								onClick={() => setShowPromptInfoModal(false)}
								style={{
									marginTop: '24px',
									width: '100%',
									padding: '10px',
									background: '#3b82f6',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									cursor: 'pointer',
									fontWeight: '600',
								}}
							>
								Close
							</button>
						</div>
					</DraggableModal>

					{/* PAR (Pushed Authorization Requests) Info Modal */}
					<DraggableModal
						isOpen={showPARInfoModal}
						onClose={() => setShowPARInfoModal(false)}
						title="PAR (Pushed Authorization Requests)"
						width="700px"
					>
						<div style={{ padding: '24px' }}>
							<p style={{ marginBottom: '16px', color: '#4b5563', lineHeight: '1.6' }}>
								<strong>PAR (Pushed Authorization Requests)</strong> is an OAuth 2.0 extension (RFC
								9126) that allows clients to push authorization parameters to the Authorization
								Server via an authenticated POST request before redirecting the user to the
								authorization endpoint.
							</p>

							<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
								<div
									style={{
										background: '#f0fdf4',
										padding: '16px',
										borderRadius: '8px',
										border: '1px solid #86efac',
									}}
								>
									<h3
										style={{
											margin: '0 0 8px 0',
											fontSize: '16px',
											fontWeight: '600',
											color: '#166534',
										}}
									>
										🔒 Security Benefits
									</h3>
									<ul
										style={{ margin: 0, paddingLeft: '20px', color: '#15803d', lineHeight: '1.8' }}
									>
										<li>
											<strong>Prevents Parameter Tampering:</strong> Parameters are sent via
											authenticated POST, not exposed in browser URL
										</li>
										<li>
											<strong>Reduces URL Length:</strong> Authorization URLs become shorter and
											more manageable
										</li>
										<li>
											<strong>Supports Large Requests:</strong> Can handle complex authorization
											requests with many parameters
										</li>
										<li>
											<strong>Request URI Expiration:</strong> Short-lived request URIs enhance
											security
										</li>
									</ul>
								</div>

								<div
									style={{
										background: '#f8fafc',
										padding: '16px',
										borderRadius: '8px',
										border: '1px solid #e2e8f0',
									}}
								>
									<h3
										style={{
											margin: '0 0 8px 0',
											fontSize: '16px',
											fontWeight: '600',
											color: '#1f2937',
										}}
									>
										📋 How PAR Works
									</h3>
									<ol
										style={{ margin: 0, paddingLeft: '20px', color: '#6b7280', lineHeight: '1.8' }}
									>
										<li>
											<strong>Push Request:</strong> Client sends authorization parameters to{' '}
											<code>/as/par</code> endpoint via POST
										</li>
										<li>
											<strong>Receive Request URI:</strong> Server validates parameters and returns
											a short-lived <code>request_uri</code> (e.g.,{' '}
											<code>urn:ietf:params:oauth:request_uri:abc123</code>)
										</li>
										<li>
											<strong>Redirect User:</strong> Client redirects user to authorization
											endpoint with only the <code>request_uri</code> parameter
										</li>
										<li>
											<strong>Server Retrieves:</strong> Authorization server retrieves the original
											parameters using the <code>request_uri</code>
										</li>
									</ol>
								</div>

								<div
									style={{
										background: '#fef3c7',
										padding: '16px',
										borderRadius: '8px',
										border: '1px solid #fbbf24',
									}}
								>
									<h3
										style={{
											margin: '0 0 8px 0',
											fontSize: '16px',
											fontWeight: '600',
											color: '#92400e',
										}}
									>
										⚠️ Requirements
									</h3>
									<ul
										style={{ margin: 0, paddingLeft: '20px', color: '#78350f', lineHeight: '1.8' }}
									>
										<li>
											PAR is only supported for <strong>Authorization Code</strong> and{' '}
											<strong>Hybrid</strong> flows
										</li>
										<li>
											Client authentication is required (<code>client_secret_basic</code> or{' '}
											<code>client_secret_post</code>)
										</li>
										<li>PingOne application must have PAR enabled in its configuration</li>
										<li>
											<strong>Important:</strong> Some PingOne applications are configured to{' '}
											<strong>require</strong> PAR. If you see an error like{' '}
											<code>"PAR is required for this client"</code>, you must enable PAR and use{' '}
											<code>request_uri</code> in your authorization URL instead of individual
											parameters.
										</li>
										<li>Request URIs typically expire within 60-90 seconds</li>
										<li>
											Works with both standard redirect flows and redirectless flows (
											<code>pi.flow</code>)
										</li>
									</ul>
								</div>

								<div
									style={{
										background: '#f8fafc',
										padding: '16px',
										borderRadius: '8px',
										border: '1px solid #e2e8f0',
									}}
								>
									<h3
										style={{
											margin: '0 0 12px 0',
											fontSize: '16px',
											fontWeight: '600',
											color: '#1f2937',
										}}
									>
										💡 Real-World Example
									</h3>
									<p
										style={{
											margin: '0 0 12px 0',
											fontSize: '14px',
											color: '#6b7280',
											lineHeight: '1.6',
										}}
									>
										Here's a complete, working example you can use with PingOne:
									</p>

									<div style={{ marginBottom: '12px' }}>
										<strong
											style={{
												fontSize: '13px',
												color: '#374151',
												display: 'block',
												marginBottom: '6px',
											}}
										>
											1. PAR Request (POST to /as/par)
										</strong>
										<div
											style={{
												background: '#1f2937',
												color: '#f3f4f6',
												padding: '12px',
												borderRadius: '6px',
												fontFamily: 'monospace',
												fontSize: '12px',
												overflowX: 'auto',
												lineHeight: '1.6',
											}}
										>
											<div style={{ color: '#60a5fa' }}>POST</div>
											<div style={{ color: '#34d399' }}>
												https://auth.pingone.com/
												<span style={{ color: '#fbbf24' }}>{'{environment-id}'}</span>/as/par
											</div>
											<div style={{ marginTop: '8px', color: '#a78bfa' }}>Headers:</div>
											<div style={{ marginLeft: '12px' }}>
												<div>Content-Type: application/x-www-form-urlencoded</div>
												<div>Authorization: Basic {'{base64(client_id:client_secret)}'}</div>
											</div>
											<div style={{ marginTop: '8px', color: '#a78bfa' }}>Body:</div>
											<div style={{ marginLeft: '12px', whiteSpace: 'pre-wrap' }}>
												{`client_id=your-client-id
&response_type=code
&redirect_uri=https://your-app.com/callback
&scope=openid profile email
&state=xyz123abc456
&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
&code_challenge_method=S256
&nonce=random-nonce-value`}
											</div>
										</div>
									</div>

									<div style={{ marginBottom: '12px' }}>
										<strong
											style={{
												fontSize: '13px',
												color: '#374151',
												display: 'block',
												marginBottom: '6px',
											}}
										>
											2. PAR Response
										</strong>
										<div
											style={{
												background: '#1f2937',
												color: '#f3f4f6',
												padding: '12px',
												borderRadius: '6px',
												fontFamily: 'monospace',
												fontSize: '12px',
												overflowX: 'auto',
											}}
										>
											<div style={{ color: '#60a5fa' }}>{'{'}</div>
											<div style={{ marginLeft: '12px' }}>
												<div>
													<span style={{ color: '#f87171' }}>"request_uri"</span>:
													<span style={{ color: '#34d399' }}>
														"urn:ietf:params:oauth:request_uri:abc123def456"
													</span>
													,
												</div>
												<div>
													<span style={{ color: '#f87171' }}>"expires_in"</span>:
													<span style={{ color: '#fbbf24' }}>90</span>
												</div>
											</div>
											<div style={{ color: '#60a5fa' }}>{'}'}</div>
										</div>
									</div>

									<div>
										<strong
											style={{
												fontSize: '13px',
												color: '#374151',
												display: 'block',
												marginBottom: '6px',
											}}
										>
											3. Authorization URL (using request_uri)
										</strong>
										<div
											style={{
												background: '#1f2937',
												color: '#f3f4f6',
												padding: '12px',
												borderRadius: '6px',
												fontFamily: 'monospace',
												fontSize: '12px',
												overflowX: 'auto',
												wordBreak: 'break-all',
											}}
										>
											<div style={{ color: '#34d399' }}>
												https://auth.pingone.com/
												<span style={{ color: '#fbbf24' }}>{'{environment-id}'}</span>
												/as/authorize?
												<span style={{ color: '#60a5fa' }}>request_uri</span>=
												<span style={{ color: '#fbbf24' }}>
													urn:ietf:params:oauth:request_uri:abc123def456
												</span>
												&<span style={{ color: '#60a5fa' }}>client_id</span>=
												<span style={{ color: '#fbbf24' }}>your-client-id</span>
											</div>
										</div>
										<p
											style={{
												margin: '8px 0 0 0',
												fontSize: '12px',
												color: '#6b7280',
												fontStyle: 'italic',
											}}
										>
											Notice how the authorization URL is much shorter - only the request_uri and
											client_id are needed!
										</p>
									</div>
								</div>

								<div
									style={{
										background: '#eff6ff',
										padding: '16px',
										borderRadius: '8px',
										border: '1px solid #93c5fd',
									}}
								>
									<h3
										style={{
											margin: '0 0 8px 0',
											fontSize: '16px',
											fontWeight: '600',
											color: '#1e40af',
										}}
									>
										📚 RFC Reference
									</h3>
									<p style={{ margin: 0, color: '#1e3a8a', lineHeight: '1.6' }}>
										PAR is defined in{' '}
										<strong>RFC 9126 - OAuth 2.0 Pushed Authorization Requests</strong>. It's an
										extension to OAuth 2.0 that enhances security and supports complex authorization
										scenarios.
									</p>
									<p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#3b82f6' }}>
										<a
											href="https://datatracker.ietf.org/doc/html/rfc9126"
											target="_blank"
											rel="noopener noreferrer"
											style={{ textDecoration: 'underline' }}
										>
											View RFC 9126 Specification →
										</a>
									</p>
								</div>
							</div>

							<button
								onClick={() => setShowPARInfoModal(false)}
								style={{
									marginTop: '24px',
									width: '100%',
									padding: '10px',
									background: '#3b82f6',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									cursor: 'pointer',
									fontWeight: '600',
								}}
							>
								Close
							</button>
						</div>
					</DraggableModal>

					{/* Client Secret JWT Configuration Modal */}
					<DraggableModal
						isOpen={showClientSecretJwtModal}
						onClose={() => setShowClientSecretJwtModal(false)}
						title="Client Secret JWT Configuration"
						width="900px"
						maxHeight="90vh"
					>
						<div
							style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
						>
							<div>
								<h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>
									About Client Secret JWT
								</h3>
								<p
									style={{
										fontSize: '0.875rem',
										color: '#475569',
										lineHeight: 1.6,
										marginBottom: '1rem',
									}}
								>
									Client Secret JWT authentication uses a JWT signed with the client secret using
									HMAC-SHA256. This method provides better security than sending the client secret
									directly in the request body or header, as the secret is used only for signing,
									not transmission.
								</p>
							</div>

							<div>
								<h4
									style={{
										marginBottom: '0.75rem',
										fontSize: '0.875rem',
										fontWeight: 600,
										color: '#1e293b',
									}}
								>
									JWT Generator
								</h4>
								<JWTConfigV8
									type="client_secret_jwt"
									initialConfig={{
										clientId: credentials.clientId || '',
										tokenEndpoint: credentials.issuerUrl
											? `${credentials.issuerUrl}/token`
											: credentials.environmentId
												? `https://auth.pingone.com/${credentials.environmentId}/as/token`
												: '',
										clientSecret: credentials.clientSecret || '',
										...(credentials.issuerUrl ? { issuer: credentials.issuerUrl } : {}),
										...(credentials.clientId ? { subject: credentials.clientId } : {}),
									}}
									onJWTGenerated={(jwt, result) => {
										if (result.success && result.jwt) {
											console.log(`${MODULE_TAG} Client Secret JWT generated:`, jwt);
											toastV8.success('JWT generated successfully!');
										}
									}}
								/>
							</div>

							<div
								style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}
							>
								<h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
									How it works:
								</h4>
								<ol
									style={{
										fontSize: '0.875rem',
										color: '#475569',
										lineHeight: 1.8,
										paddingLeft: '1.5rem',
									}}
								>
									<li>Enter your client secret (must match PingOne application)</li>
									<li>
										Each token request generates a JWT signed with HMAC-SHA256 using the client
										secret
									</li>
									<li>
										The JWT assertion is sent in the request body as <code>client_assertion</code>
									</li>
									<li>
										The authorization server validates the JWT signature using the same client
										secret
									</li>
								</ol>
							</div>

							<div
								style={{
									marginTop: '1rem',
									padding: '0.75rem',
									background: '#eff6ff',
									border: '1px solid #bfdbfe',
									borderRadius: '0.5rem',
									fontSize: '0.875rem',
									color: '#1e40af',
									lineHeight: 1.6,
								}}
							>
								<strong>Note:</strong> Client Secret JWT is more secure than{' '}
								<code>client_secret_post</code> because the secret is used for signing, not sent
								directly. However, Private Key JWT provides even better security through asymmetric
								cryptography.
							</div>
						</div>
					</DraggableModal>

					{/* Private Key JWT Configuration Modal */}
					<DraggableModal
						isOpen={showPrivateKeyJwtModal}
						onClose={() => setShowPrivateKeyJwtModal(false)}
						title="Private Key JWT Configuration"
						width="900px"
						maxHeight="90vh"
					>
						<div
							style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
						>
							<div>
								<h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>
									About Private Key JWT
								</h3>
								<p
									style={{
										fontSize: '0.875rem',
										color: '#475569',
										lineHeight: 1.6,
										marginBottom: '1rem',
									}}
								>
									Private Key JWT authentication uses asymmetric cryptography with a private key for
									signing JWT assertions. This is the most secure method, as the private key never
									leaves your application and only the public key is registered with the
									authorization server.
								</p>
							</div>

							<div>
								<h4
									style={{
										marginBottom: '0.75rem',
										fontSize: '0.875rem',
										fontWeight: 600,
										color: '#1e293b',
									}}
								>
									JWT Generator
								</h4>
								<JWTConfigV8
									type="private_key_jwt"
									initialConfig={{
										clientId: credentials.clientId || '',
										tokenEndpoint: credentials.issuerUrl
											? `${credentials.issuerUrl}/token`
											: credentials.environmentId
												? `https://auth.pingone.com/${credentials.environmentId}/as/token`
												: '',
										privateKey: (credentials as { privateKey?: string }).privateKey || '',
										...(credentials.issuerUrl ? { issuer: credentials.issuerUrl } : {}),
										...(credentials.clientId ? { subject: credentials.clientId } : {}),
									}}
									onJWTGenerated={(jwt, result) => {
										if (result.success && result.jwt) {
											console.log(`${MODULE_TAG} Private Key JWT generated:`, jwt);
											toastV8.success('JWT generated successfully!');
											// Note: The private key should be saved separately in the credentials form
											// The JWT is generated fresh for each token request, not stored
										}
									}}
								/>
								<div
									style={{
										marginTop: '1rem',
										padding: '0.75rem',
										background: '#fef3c7',
										border: '1px solid #fcd34d',
										borderRadius: '0.5rem',
										fontSize: '0.875rem',
										color: '#92400e',
									}}
								>
									<strong>Important:</strong> After entering your private key in the generator
									above, make sure to save it in your credentials. The private key is used to sign
									JWT assertions for each token request.
								</div>
							</div>

							<div
								style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}
							>
								<h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
									How it works:
								</h4>
								<ol
									style={{
										fontSize: '0.875rem',
										color: '#475569',
										lineHeight: 1.8,
										paddingLeft: '1.5rem',
									}}
								>
									<li>Generate or obtain an RSA private key (PEM format)</li>
									<li>
										Register the corresponding public key with PingOne (via JWKS endpoint or manual
										upload)
									</li>
									<li>
										Each token request generates a JWT signed with RS256 using your private key
									</li>
									<li>
										The JWT assertion is sent in the request body as <code>client_assertion</code>
									</li>
									<li>
										The authorization server validates the JWT signature using the registered public
										key
									</li>
								</ol>
							</div>

							<div
								style={{
									marginTop: '1rem',
									padding: '0.75rem',
									background: '#f0fdf4',
									border: '1px solid #bbf7d0',
									borderRadius: '0.5rem',
									fontSize: '0.875rem',
									color: '#166534',
									lineHeight: 1.6,
								}}
							>
								<strong>Security Advantage:</strong> Private Key JWT is the most secure
								authentication method because it uses asymmetric cryptography. The private key never
								leaves your application, and even if intercepted, the JWT cannot be forged without
								the private key.
							</div>
						</div>
					</DraggableModal>

					{/* Worker Token vs Client Credentials Education Modal (for Scopes) */}
					<WorkerTokenVsClientCredentialsEducationModalV8
						isOpen={showScopesEducationModal}
						onClose={() => setShowScopesEducationModal(false)}
						context={providedFlowType === 'client-credentials' ? 'client-credentials' : 'general'}
					/>
				</>
			)}

			<style>{`
				.credentials-form-v8 {
					width: 100%;
					border: 1px solid #cbd5e1;
					border-radius: 6px;
					overflow: hidden;
					background: white;
				}

				.collapsible-header {
					background: linear-gradient(to right, #dbeafe 0%, #e0f2fe 100%);
					padding: 16px 20px;
					cursor: pointer;
					user-select: none;
					border-bottom: 2px solid #3b82f6;
					transition: background 0.2s ease;
				}

				.collapsible-header:hover {
					background: linear-gradient(to right, #bfdbfe 0%, #cffafe 100%);
				}

				.header-content {
					display: flex;
					align-items: center;
					justify-content: space-between;
					gap: 12px;
				}

				.collapsible-header h2 {
					font-size: 16px;
					font-weight: 700;
					margin: 0;
					color: #1e40af;
				}

				.chevron {
					font-size: 24px;
					color: #3b82f6;
					transition: transform 0.3s ease;
					display: flex;
					align-items: center;
					justify-content: center;
					width: 24px;
					height: 24px;
					font-weight: bold;
				}

				.chevron.open {
					transform: rotate(90deg);
				}

				.collapsible-header p {
					font-size: 13px;
					color: #1e3a8a;
					margin: 4px 0 0 0;
					opacity: 0.9;
				}

				.form-sections {
					padding: 0;
					display: flex;
					flex-direction: column;
				}

				.form-section {
					border-bottom: 1px solid #e2e8f0;
				}

				.form-section:last-child {
					border-bottom: none;
				}

				/* Subtle color coding for each section */
				.form-section[data-section="app-picker"] .section-header {
					background: linear-gradient(to right, #f0fdf4 0%, #dcfce7 100%);
					border-bottom: 1px solid #bbf7d0;
				}
				.form-section[data-section="app-picker"] .section-header h3 {
					color: #166534;
				}

				.form-section[data-section="general"] .section-header {
					background: linear-gradient(to right, #fef3c7 0%, #fde68a 100%);
					border-bottom: 1px solid #fcd34d;
				}
				.form-section[data-section="general"] .section-header h3 {
					color: #92400e;
				}

				.form-section[data-section="spec"] .section-header {
					background: linear-gradient(to right, #e0e7ff 0%, #c7d2fe 100%);
					border-bottom: 1px solid #a5b4fc;
				}
				.form-section[data-section="spec"] .section-header h3 {
					color: #3730a3;
				}

				.form-section[data-section="discovery"] .section-header {
					background: linear-gradient(to right, #dbeafe 0%, #bfdbfe 100%);
					border-bottom: 1px solid #93c5fd;
				}
				.form-section[data-section="discovery"] .section-header h3 {
					color: #1e40af;
				}

				.form-section[data-section="oidc-settings"] .section-header {
					background: linear-gradient(to right, #f0fdf4 0%, #dcfce7 100%);
					border-bottom: 1px solid #bbf7d0;
				}
				.form-section[data-section="oidc-settings"] .section-header h3 {
					color: #166534;
				}

				.form-section[data-section="advanced"] .section-header {
					background: linear-gradient(to right, #f5f3ff 0%, #ede9fe 100%);
					border-bottom: 1px solid #ddd6fe;
				}
				.form-section[data-section="advanced"] .section-header h3 {
					color: #5b21b6;
				}

				.form-section[data-section="additional"] .section-header {
					background: linear-gradient(to right, #ecfeff 0%, #cffafe 100%);
					border-bottom: 1px solid #a5f3fc;
				}
				.form-section[data-section="additional"] .section-header h3 {
					color: #155e75;
				}

				.section-header {
					padding: 12px 20px;
				}

				.section-header h3 {
					font-size: 14px;
					font-weight: 600;
					margin: 0;
				}

				.section-content {
					padding: 20px 24px;
					display: flex;
					flex-direction: column;
					gap: 20px;
					background: #ffffff;
				}

				.form-actions {
					padding: 16px 20px;
					border-top: 1px solid #e2e8f0;
					background: #f8fafc;
					display: flex;
					gap: 12px;
				}

				.btn-save {
					padding: 10px 20px;
					background: #3b82f6;
					color: white;
					border: none;
					border-radius: 4px;
					font-size: 14px;
					font-weight: 600;
					cursor: pointer;
					transition: background 0.2s ease;
				}

				.btn-save:hover {
					background: #2563eb;
				}

				.btn-save:active {
					background: #1d4ed8;
				}

				.form-group {
					display: flex;
					flex-direction: column;
					gap: 6px;
					width: 100%;
				}

				.form-group > label:first-child {
					font-size: 14px;
					font-weight: 600;
					color: #374151;
					line-height: 1.5;
					display: flex;
					align-items: center;
					gap: 2px;
				}

				.required {
					color: #ef5350;
					margin-left: 2px;
				}

				.optional {
					color: #999;
					font-size: 11px;
					margin-left: 2px;
				}

				.form-group input[type="text"],
				.form-group input[type="password"],
				.form-group input[type="url"],
				.form-group select,
				.form-group textarea {
					width: 100%;
					padding: 8px 12px;
					border: 1px solid #d1d5db;
					border-radius: 6px;
					font-size: 14px;
					font-family: inherit;
					background: white;
					color: #1f2937;
					box-sizing: border-box;
					word-wrap: break-word;
					overflow-wrap: break-word;
					min-height: 38px;
				}

				.form-group input[type="text"]:not([readonly]),
				.form-group input[type="password"]:not([readonly]),
				.form-group input[type="url"]:not([readonly]) {
					white-space: pre-wrap;
				}

				.form-group input[type="text"]:focus,
				.form-group input[type="password"]:focus,
				.form-group input[type="url"]:focus,
				.form-group select:focus,
				.form-group textarea:focus {
					outline: none;
					border-color: #3b82f6;
					box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
				}

				.form-group button {
					padding: 8px 14px;
					font-size: 13px;
					font-weight: 500;
					border: none;
					border-radius: 6px;
					cursor: pointer;
					transition: all 0.2s ease;
					margin-top: 2px;
					align-self: flex-start;
					min-width: 130px;
				}

				.form-group button:disabled {
					cursor: not-allowed;
					opacity: 0.6;
				}

				.btn-primary {
					background: #3b82f6;
					color: white;
				}

				.btn-primary:hover:not(:disabled) {
					background: #2563eb;
				}

				.btn-primary:disabled {
					background: #9ca3af;
				}

				.btn-success {
					background: #10b981;
					color: white;
				}

				.btn-success:hover:not(:disabled) {
					background: #059669;
				}

				.btn-success:disabled {
					background: #9ca3af;
				}

				.form-group small {
					font-size: 11px;
					color: #6b7280;
					line-height: 1.4;
					word-wrap: break-word;
					overflow-wrap: break-word;
					margin-top: -2px;
				}

				@media (max-width: 600px) {
					.credentials-grid {
						grid-template-columns: 1fr;
					}
				}

				@keyframes shake {
					0%, 100% { transform: translateX(0); }
					10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
					20%, 40%, 60%, 80% { transform: translateX(4px); }
				}
			`}</style>
		</div>
	);
};

export default CredentialsFormV8U;
