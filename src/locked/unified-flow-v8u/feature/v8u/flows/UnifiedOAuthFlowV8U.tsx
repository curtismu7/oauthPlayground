/**
 * @file UnifiedOAuthFlowV8U.tsx
 * @module v8u/flows
 * @description Unified OAuth/OIDC Flow - Single UI for all flows using real PingOne APIs
 * @version 8.0.0
 * @since 2024-11-16
 *
 * This is the main unified flow page that adapts to:
 * - OAuth 2.0, OAuth 2.1 / OIDC 2.1, and OIDC Core 1.0 specifications
 * - All flow types (Authorization Code, Implicit, Client Credentials, etc.)
 * - Uses real PingOne APIs (no mocks)
 */

import { FiPackage } from '@icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { usePageScroll } from '@/hooks/usePageScroll';
import {
	downloadPostmanCollectionWithEnvironment,
	generateCompletePostmanCollection,
	generateComprehensiveUnifiedPostmanCollection,
} from '../../../dependencies/services/postmanCollectionGeneratorV8.ts';
import {
	ApiDisplayCheckbox,
	SuperSimpleApiDisplayV8,
} from '../../../dependencies/v8/components/SuperSimpleApiDisplayV8.tsx';
import { ConfigCheckerServiceV8 } from '../../../dependencies/v8/services/configCheckerServiceV8.ts';
import { CredentialsServiceV8 } from '../../../dependencies/v8/services/credentialsServiceV8.ts';
import { EnvironmentIdServiceV8 } from '../../../dependencies/v8/services/environmentIdServiceV8.ts';
import {
	type SharedCredentials,
	SharedCredentialsServiceV8,
} from '../../../dependencies/v8/services/sharedCredentialsServiceV8.ts';
import { SpecUrlServiceV8 } from '../../../dependencies/v8/services/specUrlServiceV8.ts';
import {
	type FlowType,
	type SpecVersion,
	SpecVersionServiceV8,
} from '../../../dependencies/v8/services/specVersionServiceV8.ts';
import { uiNotificationServiceV8 } from '../../../dependencies/v8/services/uiNotificationServiceV8.ts';
import { workerTokenServiceV8 } from '../../../dependencies/v8/services/workerTokenServiceV8.ts';
import { WorkerTokenStatusServiceV8 } from '../../../dependencies/v8/services/workerTokenStatusServiceV8.ts';
import { toastV8 } from '../../../dependencies/v8/utils/toastNotificationsV8.ts';
import { reloadCredentialsAfterReset } from '../../../dependencies/v8u/services/credentialReloadServiceV8U.ts';
import CredentialsFormV8U from '../components/CredentialsFormV8U';
// FlowNotAvailableModal removed - dropdown already filters flows by spec version
import { FlowTypeSelector } from '../components/FlowTypeSelector';
import { SpecVersionSelector } from '../components/SpecVersionSelector';
import { UnifiedFlowSteps } from '../components/UnifiedFlowSteps';
import { UnifiedNavigationV8U } from '../components/UnifiedNavigationV8U';
import { FlowSettingsServiceV8U } from '../services/flowSettingsServiceV8U';
import {
	type UnifiedFlowCredentials,
	UnifiedFlowIntegrationV8U,
} from '../services/unifiedFlowIntegrationV8U';

const MODULE_TAG = '[🎯 UNIFIED-OAUTH-FLOW-V8U]';

/**
 * UnifiedOAuthFlowV8U - Main container component for unified OAuth/OIDC flows
 *
 * This component orchestrates all OAuth 2.0 and OpenID Connect flows in a single unified interface.
 * It manages:
 * - Flow type selection (Authorization Code, Implicit, Client Credentials, Device Code, Hybrid)
 * - Spec version selection (OAuth 2.0, OAuth 2.1 / OIDC 2.1, OIDC Core 1.0)
 * - Step navigation and state management
 * - Credentials loading and persistence
 * - Flow availability validation
 *
 * @component
 * @returns {JSX.Element} The unified OAuth flow UI
 */
export const UnifiedOAuthFlowV8U: React.FC = () => {
	// Scroll to top on page load for better UX
	usePageScroll({ pageName: 'Unified OAuth Flow V8U', force: true });

	// Extract flow type and step from URL parameters
	// URL format: /v8u/unified/:flowType/:step
	const { flowType: urlFlowType, step: urlStep } = useParams<{
		flowType?: FlowType;
		step?: string;
	}>();
	const navigate = useNavigate();
	const location = useLocation();

	/**
	 * Parse current step from URL parameter
	 *
	 * The step is stored in the URL to enable:
	 * - Direct navigation to specific steps
	 * - Browser back/forward navigation
	 * - Bookmarkable step URLs
	 *
	 * @returns {number} Current step number (0-indexed), defaults to 0 if invalid
	 */
	const currentStep = useMemo(() => {
		if (urlStep) {
			const stepNum = parseInt(urlStep, 10);
			// Validate step number is a valid non-negative integer
			if (!Number.isNaN(stepNum) && stepNum >= 0) {
				return stepNum;
			}
		}
		// Default to step 0 (configuration) if no valid step in URL
		return 0;
	}, [urlStep]);

	/**
	 * Flow type state - determines which OAuth flow is currently active
	 *
	 * Supported flows:
	 * - 'oauth-authz': Authorization Code Flow (most secure, recommended)
	 * - 'implicit': Implicit Flow (deprecated in OAuth 2.1 / OIDC 2.1, but still supported in OAuth 2.0)
	 * - 'client-credentials': Client Credentials Flow (for server-to-server)
	 * - 'device-code': Device Code Flow (for devices without browsers)
	 * - 'hybrid': Hybrid Flow (combines authorization code and implicit)
	 *
	 * Note: 'ropc' (Resource Owner Password Credentials) is removed - it's a mock-only flow
	 * not supported by PingOne. Use /v7m/ropc for mock ROPC flow.
	 *
	 * Initializes from URL parameter if valid, otherwise defaults to 'oauth-authz'
	 */
	const [flowType, setFlowType] = useState<FlowType>(() => {
		// Validate URL flow type against supported flows
		// This prevents invalid flow types from being set
		if (
			urlFlowType &&
			['oauth-authz', 'implicit', 'client-credentials', 'device-code', 'hybrid'].includes(
				urlFlowType
			)
		) {
			return urlFlowType as FlowType;
		}
		// Default to authorization code flow (most common and secure)
		return 'oauth-authz';
	});

	/**
	 * Spec version state - determines which OAuth/OIDC specification version to use
	 *
	 * Supported spec versions:
	 * - 'oauth2.0': OAuth 2.0 (RFC 6749) - original specification
	 * - 'oauth2.1': OAuth 2.1 / OIDC 2.1 (draft) - removes deprecated flows (implicit, ROPC)
	 * - 'oidc': OIDC Core 1.0 - adds identity layer on top of OAuth 2.0
	 *
	 * Each flow type can have its own saved spec version preference.
	 * This allows users to use OAuth 2.0 for one flow and OIDC for another.
	 */
	const [specVersion, setSpecVersion] = useState<SpecVersion>(() => {
		// Load saved spec version preference for this specific flow type
		// This ensures each flow remembers its own spec version setting
		const savedSpecVersion = FlowSettingsServiceV8U.getSpecVersion(flowType);
		return savedSpecVersion;
	});

	/**
	 * Sync flow type state with URL parameter changes
	 *
	 * This effect ensures that when the URL changes (e.g., user navigates directly to a flow),
	 * the component state updates to match. This enables:
	 * - Direct URL navigation to specific flows
	 * - Browser back/forward button support
	 * - Bookmarkable flow URLs
	 *
	 * Only syncs if the URL flow type is valid and different from current state.
	 */
	// Track last synced URL flow type to prevent loops
	const lastSyncedUrlFlowTypeRef = useRef<string | null>(null);

	useEffect(() => {
		// Prevent syncing the same URL flow type multiple times
		if (lastSyncedUrlFlowTypeRef.current === urlFlowType) {
			return;
		}

		// Validate URL flow type and sync if different from current state
		// Note: 'ropc' is removed - it's a mock flow, not supported by PingOne
		// CRITICAL: Only sync FROM URL if URL has a valid flow type and it's different
		// Don't sync if the URL flow type is the same as current (prevents loops)
		if (
			urlFlowType &&
			['oauth-authz', 'implicit', 'client-credentials', 'device-code', 'hybrid'].includes(
				urlFlowType
			) &&
			urlFlowType !== flowType
		) {
			// Mark as synced BEFORE updating to prevent re-runs
			lastSyncedUrlFlowTypeRef.current = urlFlowType;
			// Reset the last processed flow type ref so spec version loading can run
			lastProcessedFlowTypeRef.current = null;
			setFlowType(urlFlowType as FlowType);
		} else if (urlFlowType === flowType) {
			// URL and state are in sync - mark as synced
			lastSyncedUrlFlowTypeRef.current = urlFlowType;
		} else if (!urlFlowType) {
			// URL doesn't have a flow type - mark current flow as synced to prevent loops
			lastSyncedUrlFlowTypeRef.current = flowType;
		}
	}, [urlFlowType, flowType, currentStep, location.pathname]);

	/**
	 * Load spec version when flow type changes and update last used timestamp
	 *
	 * This effect:
	 * 1. Loads the saved spec version preference for the new flow type
	 * 2. Updates state if different from current spec version
	 * 3. Updates the "last used" timestamp for analytics/tracking
	 *
	 * Important: Only depends on flowType, not specVersion, to avoid infinite loops.
	 * The specVersion dependency is intentionally omitted because we're setting it here.
	 *
	 * CRITICAL: Use a ref to track the last flowType we processed to prevent loops.
	 */
	const lastProcessedFlowTypeRef = useRef<FlowType | null>(null);

	useEffect(() => {
		// Prevent processing the same flowType multiple times
		if (lastProcessedFlowTypeRef.current === flowType) {
			return;
		}

		const savedSpecVersion = FlowSettingsServiceV8U.getSpecVersion(flowType);

		// Mark as processed BEFORE any state updates to prevent re-runs
		lastProcessedFlowTypeRef.current = flowType;

		// Only update state if the saved version differs from current
		// This prevents unnecessary re-renders
		if (savedSpecVersion !== specVersion) {
			setSpecVersion(savedSpecVersion);
		}

		// Update last used timestamp for analytics/tracking
		// This helps identify which flows are most commonly used
		FlowSettingsServiceV8U.saveSettings(flowType, {
			specVersion: savedSpecVersion,
		});
		// CRITICAL: Only depend on flowType, NOT specVersion to avoid loops
		// Intentionally omitting specVersion from dependencies to prevent loops
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [flowType]);

	// Credentials section collapsed state - collapsed by default after step 0
	const [isCredentialsCollapsed, setIsCredentialsCollapsed] = useState(() => {
		// Initialize based on current step: expanded on step 0, collapsed on other steps
		return currentStep > 0;
	});

	// Track previous step to detect step changes
	const prevStepRef = useRef(currentStep);

	// Flow not available modal state - REMOVED: Dropdown already filters flows, so modal is not needed
	// All modal-related state and logic has been removed since FlowTypeSelector filters flows by spec version

	// Auto-collapse credentials after step 0, but always expand on step 0
	useEffect(() => {
		const prevStep = prevStepRef.current;
		prevStepRef.current = currentStep;

		if (currentStep === 0) {
			// Always expanded on step 0 (configuration step)
			setIsCredentialsCollapsed(false);
		} else if (prevStep === 0 && currentStep > 0) {
			// Auto-collapse only when transitioning FROM step 0 TO step > 0
			// This allows manual expansion on other steps
			setIsCredentialsCollapsed(true);
		}
		// Don't auto-collapse on other step changes - let user control it
	}, [currentStep]);

	// Navigate to step
	const navigateToStep = useCallback(
		(step: number, newFlowType?: FlowType) => {
			const targetFlowType = newFlowType || flowType;
			const path = `/v8u/unified/${targetFlowType}/${step}`;
			navigate(path, { replace: true });
		},
		[flowType, navigate]
	);

	// Redirect base route to step 0
	useEffect(() => {
		if (location.pathname === '/v8u/unified') {
			navigateToStep(0, flowType);
		}
	}, [location.pathname, navigateToStep, flowType]);

	// Credentials state - load from storage synchronously on mount to prevent empty initial state
	// Redirect URI will be auto-initialized by CredentialsFormV8U based on flow type
	const getInitialFlowKey = () => {
		// Note: 'ropc' is removed - it's a mock flow, not supported by PingOne
		const urlFlow =
			urlFlowType &&
			['oauth-authz', 'implicit', 'client-credentials', 'device-code', 'hybrid'].includes(
				urlFlowType
			)
				? urlFlowType
				: 'oauth-authz';
		return `${urlFlow}-v8u`;
	};

	const [credentials, setCredentials] = useState<UnifiedFlowCredentials>(() => {
		try {
			const storedEnvId = EnvironmentIdServiceV8.getEnvironmentId();
			const initialFlowKey = getInitialFlowKey();

			// Load flow-specific credentials synchronously (from localStorage)
			const config = CredentialsServiceV8.getFlowConfig(initialFlowKey) || {
				flowKey: initialFlowKey,
				flowType: 'oauth' as const,
				includeClientSecret: true,
				includeScopes: true,
				includeRedirectUri: true,
				includeLogoutUri: false,
			};
			const flowSpecific = CredentialsServiceV8.loadCredentials(initialFlowKey, config);

			// Load shared credentials synchronously (from localStorage)
			const shared = SharedCredentialsServiceV8.loadSharedCredentialsSync();

			// Merge credentials for initial state
			// Priority: flow-specific > shared credentials > defaults
			// CRITICAL: Flow-specific credentials take priority to allow per-flow clientId/environmentId
			// This allows users to use different PingOne applications for different flow types
			const initial: UnifiedFlowCredentials = {
				// Flow-specific credentials take priority (allows per-flow clientId/environmentId)
				// Fall back to shared credentials if flow-specific not available
				environmentId: (
					flowSpecific.environmentId?.trim() ||
					shared.environmentId?.trim() ||
					storedEnvId?.trim() ||
					''
				).trim(),
				clientId: (flowSpecific.clientId?.trim() || shared.clientId?.trim() || '').trim(),
				// Client secret: prefer flow-specific, then shared, but only if not empty
				...(flowSpecific.clientSecret?.trim()
					? { clientSecret: flowSpecific.clientSecret.trim() }
					: shared.clientSecret?.trim()
						? { clientSecret: shared.clientSecret.trim() }
						: {}),
				// Issuer URL: prefer flow-specific, then shared
				...(flowSpecific.issuerUrl?.trim()
					? { issuerUrl: flowSpecific.issuerUrl.trim() }
					: shared.issuerUrl?.trim()
						? { issuerUrl: shared.issuerUrl.trim() }
						: {}),
				// Client auth method: prefer flow-specific, then shared
				...(flowSpecific.clientAuthMethod
					? { clientAuthMethod: flowSpecific.clientAuthMethod }
					: shared.clientAuthMethod
						? { clientAuthMethod: shared.clientAuthMethod }
						: {}),
				// Flow-specific credentials
				...(flowSpecific.redirectUri?.trim()
					? { redirectUri: flowSpecific.redirectUri.trim() }
					: {}),
				...(flowSpecific.postLogoutRedirectUri?.trim()
					? { postLogoutRedirectUri: flowSpecific.postLogoutRedirectUri.trim() }
					: {}),
				scopes: (flowSpecific.scopes?.trim() || 'openid').trim(),
				...(flowSpecific.responseType?.trim()
					? { responseType: flowSpecific.responseType.trim() }
					: {}),
				...(flowSpecific.loginHint?.trim() ? { loginHint: flowSpecific.loginHint.trim() } : {}),
				// Checkbox values - load from flow-specific storage
				...(typeof flowSpecific.usePKCE === 'boolean' ? { usePKCE: flowSpecific.usePKCE } : {}),
				...(typeof flowSpecific.enableRefreshToken === 'boolean'
					? { enableRefreshToken: flowSpecific.enableRefreshToken }
					: {}),
				...(typeof flowSpecific.useRedirectless === 'boolean'
					? { useRedirectless: flowSpecific.useRedirectless }
					: {}),
			};

			// Initial credential loading completed

			return initial;
		} catch (err) {
			console.error(`${MODULE_TAG} Error loading initial credentials (using defaults):`, err);
			const storedEnvId = EnvironmentIdServiceV8.getEnvironmentId();
			return {
				environmentId: storedEnvId || '',
				clientId: '',
				clientSecret: '',
				scopes: 'openid',
			};
		}
	});

	// App configuration state - used to determine PKCE enforcement level
	const [appConfig, setAppConfig] = useState<{
		pkceRequired?: boolean;
		pkceEnforced?: boolean;
		[key: string]: unknown;
	} | null>(null);

	// Fetch app configuration when credentials are available
	useEffect(() => {
		const fetchAppConfig = async () => {
			if (!credentials.environmentId || !credentials.clientId) {
				setAppConfig(null);
				return;
			}

			// Check worker token status
			const tokenStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
			if (!tokenStatus.isValid) {
				setAppConfig(null);
				return;
			}

			// Get the actual token from the service
			const token = await workerTokenServiceV8.getToken();
			if (!token) {
				setAppConfig(null);
				return;
			}

			try {
				const config = await ConfigCheckerServiceV8.fetchAppConfig(
					credentials.environmentId,
					credentials.clientId,
					token
				);

				if (config) {
					setAppConfig({
						...(config.pkceRequired !== undefined && { pkceRequired: config.pkceRequired }),
						...(config.pkceEnforced !== undefined && { pkceEnforced: config.pkceEnforced }),
					});
				} else {
					setAppConfig(null);
				}
			} catch (error) {
				console.error(`${MODULE_TAG} Error fetching app config:`, error);
				setAppConfig(null);
			}
		};

		fetchAppConfig();
	}, [credentials.environmentId, credentials.clientId]);

	// Listen for environment ID updates
	useEffect(() => {
		const handleEnvIdUpdate = () => {
			const storedEnvId = EnvironmentIdServiceV8.getEnvironmentId();
			if (storedEnvId && storedEnvId !== credentials.environmentId) {
				setCredentials((prev) => ({ ...prev, environmentId: storedEnvId }));
			}
		};
		window.addEventListener('environmentIdUpdated', handleEnvIdUpdate);
		return () => window.removeEventListener('environmentIdUpdated', handleEnvIdUpdate);
	}, [credentials.environmentId]);

	// Get available flows for current spec version
	const availableFlows = useMemo(() => {
		const flows = UnifiedFlowIntegrationV8U.getAvailableFlows(specVersion);
		return flows;
	}, [specVersion]);

	/**
	 * Determine effective flow type - ensures selected flow is available for current spec version
	 *
	 * Some flows are not available in certain spec versions:
	 * - Implicit flow: Removed in OAuth 2.1 (security concerns)
	 * - ROPC flow: Removed in OAuth 2.1 (security concerns)
	 * - Hybrid flow: Not part of OAuth 2.1 spec
	 *
	 * This memoized value:
	 * 1. Checks if the selected flow type is available for the current spec version
	 * 2. Returns the selected flow if available
	 * 3. Falls back to the first available flow (usually 'oauth-authz') if not available
	 *
	 * The fallback prevents errors when switching spec versions that don't support the current flow.
	 *
	 * @returns {FlowType} The effective flow type (either selected or fallback)
	 */
	const effectiveFlowType = useMemo(() => {
		const isAvailable = availableFlows.includes(flowType);
		// Return selected flow if it's available for the current spec version
		if (isAvailable) {
			return flowType;
		}

		// Fallback to first available flow (usually 'oauth-authz')
		// This ensures we always have a valid flow type
		const fallback = availableFlows[0] || 'oauth-authz';
		console.warn(`${MODULE_TAG} ⚠️ Flow type not available, using fallback`, {
			requested: flowType,
			fallback,
		});
		return fallback;
	}, [flowType, availableFlows, specVersion]);

	/**
	 * Show modal when selected flow is not available for current spec version
	 *
	 * This effect detects when the user has selected a flow type that's not available
	 * for the current spec version (e.g., implicit flow with OAuth 2.1).
	 *
	 * Instead of automatically switching flows, we show a modal that:
	 * 1. Explains why the flow is not available
	 * 2. Offers to use a fallback flow
	 * 3. Allows user to change spec version instead
	 *
	 * The modal only shows once per flow/spec combination to avoid annoying the user.
	 *
	 * CRITICAL: This effect must NOT depend on requestedFlow or showFlowNotAvailableModal
	 * to prevent infinite loops. We use a ref to track what we've already handled.
	 */
	/**
	 * Auto-correct flow type when spec version changes and current flow becomes invalid
	 *
	 * Since the FlowTypeSelector dropdown already filters flows by spec version,
	 * users can only select valid flows. This effect only runs when the spec version
	 * changes (not when flowType changes), to prevent resetting user selections.
	 *
	 * This ensures the flow type is always valid for the current spec version,
	 * but only when the spec version changes, not when the user selects a flow.
	 */
	const lastSpecVersionRef = useRef<SpecVersion | null>(null);
	const isUserChangingFlowRef = useRef(false);

	useEffect(() => {
		// Only auto-correct when spec version changes, not when flow type changes
		if (lastSpecVersionRef.current === specVersion) {
			return;
		}

		// Don't auto-correct if user is actively changing the flow type
		if (isUserChangingFlowRef.current) {
			lastSpecVersionRef.current = specVersion;
			return;
		}

		const currentAvailableFlows = UnifiedFlowIntegrationV8U.getAvailableFlows(specVersion);
		const isFlowAvailable = currentAvailableFlows.includes(flowType);

		// Mark this spec version as processed
		lastSpecVersionRef.current = specVersion;

		// If flow is not available, automatically switch to first available flow
		// This only happens when spec version changes, not when user selects a flow
		if (!isFlowAvailable && currentAvailableFlows.length > 0) {
			const fallbackFlow = currentAvailableFlows[0];
			setFlowType(fallbackFlow);
			// Update URL to reflect new flow type
			if (currentStep !== undefined) {
				const path = `/v8u/unified/${fallbackFlow}/${currentStep}`;
				navigate(path, { replace: true });
			}
		}
	}, [specVersion, flowType, currentStep, navigate]);

	// Field visibility and checkbox availability are computed by UnifiedFlowIntegrationV8U
	// but not currently used in this component - kept for potential future use
	// const fieldVisibility = useMemo(() => {
	// 	return UnifiedFlowIntegrationV8U.getFieldVisibility(specVersion, effectiveFlowType);
	// }, [specVersion, effectiveFlowType]);
	//
	// const checkboxAvailability = useMemo(() => {
	// 	return UnifiedFlowIntegrationV8U.getCheckboxAvailability(specVersion, effectiveFlowType);
	// }, [specVersion, effectiveFlowType]);

	const complianceErrors = useMemo(() => {
		return UnifiedFlowIntegrationV8U.getComplianceErrors(specVersion, effectiveFlowType);
	}, [specVersion, effectiveFlowType]);

	const complianceWarnings = useMemo(() => {
		return UnifiedFlowIntegrationV8U.getComplianceWarnings(specVersion, effectiveFlowType);
	}, [specVersion, effectiveFlowType]);

	// Flow key for CredentialsFormV8U - includes flow type, spec version, and unique identifier
	// Format: {flowType}_{specVersion}_{uniqueIdentifier}
	// Example: implicit_oauth2.0_v8u
	const flowKey = useMemo(() => {
		// Normalize spec version for storage key (remove dots, lowercase)
		const normalizedSpecVersion = specVersion.replace(/\./g, '').toLowerCase();
		return `${effectiveFlowType}_${normalizedSpecVersion}_v8u`;
	}, [effectiveFlowType, specVersion]);

	// Load credentials from storage on mount, when flow type changes, and on page visibility
	// IMPORTANT: Credentials are independent of worker token - they persist regardless of token status
	const lastLoadedFlowKeyRef = useRef<string | null>(null);

	useEffect(() => {
		// Prevent loading credentials multiple times for the same flowKey
		if (lastLoadedFlowKeyRef.current === flowKey && isLoadingCredentialsRef.current) {
			return;
		}

		const loadCredentials = async () => {
			// Set loading flag to prevent save effect from running during load
			isLoadingCredentialsRef.current = true;
			lastLoadedFlowKeyRef.current = flowKey;

			try {
				const config = CredentialsServiceV8.getFlowConfig(flowKey) || {
					flowKey,
					flowType: 'oauth' as const,
					includeClientSecret: true,
					includeScopes: true,
					includeRedirectUri: true,
					includeLogoutUri: false,
				};

				// Load flow-specific credentials (does not depend on worker token)
				// Try sync first for immediate results, then async with IndexedDB backup fallback
				const flowSpecificSync = CredentialsServiceV8.loadCredentials(flowKey, config);
				const flowSpecific = await CredentialsServiceV8.loadCredentialsWithBackup(
					flowKey,
					config
				).catch((err) => {
					console.warn(
						`${MODULE_TAG} Error loading flow-specific credentials with backup (using sync result)`,
						err
					);
					return flowSpecificSync; // Use sync result as fallback
				});

				// Load shared credentials (environmentId, clientId, clientSecret, etc.) - independent of worker token
				// Try sync first for immediate results, then async for disk fallback
				const sharedSync = SharedCredentialsServiceV8.loadSharedCredentialsSync();

				const shared: SharedCredentials =
					await SharedCredentialsServiceV8.loadSharedCredentials().catch((err) => {
						console.warn(
							`${MODULE_TAG} Error loading shared credentials async (using sync result)`,
							err
						);
						return sharedSync; // Use sync result as fallback
					});

				// Get stored environment ID from global service
				const storedEnvId = EnvironmentIdServiceV8.getEnvironmentId();

				// Merge credentials: flow-specific takes priority (allows per-flow clientId/environmentId)
				// Fall back to shared credentials if flow-specific not available
				// Use explicit trimming and fallback logic
				const merged: UnifiedFlowCredentials = {
					// Flow-specific credentials take priority (allows per-flow clientId/environmentId)
					// Fall back to shared credentials if flow-specific not available
					environmentId: (
						flowSpecific.environmentId?.trim() ||
						shared.environmentId?.trim() ||
						storedEnvId?.trim() ||
						''
					).trim(),
					clientId: (flowSpecific.clientId?.trim() || shared.clientId?.trim() || '').trim(),
					// Client secret: prefer flow-specific, then shared, but only if not empty
					...(flowSpecific.clientSecret?.trim()
						? { clientSecret: flowSpecific.clientSecret.trim() }
						: shared.clientSecret?.trim()
							? { clientSecret: shared.clientSecret.trim() }
							: {}),
					// Issuer URL: prefer flow-specific, then shared
					...(flowSpecific.issuerUrl?.trim()
						? { issuerUrl: flowSpecific.issuerUrl.trim() }
						: shared.issuerUrl?.trim()
							? { issuerUrl: shared.issuerUrl.trim() }
							: {}),
					// Client auth method: prefer flow-specific, then shared
					...(flowSpecific.clientAuthMethod
						? { clientAuthMethod: flowSpecific.clientAuthMethod }
						: shared.clientAuthMethod
							? { clientAuthMethod: shared.clientAuthMethod }
							: {}),
					// Flow-specific credentials
					...(flowSpecific.redirectUri?.trim()
						? { redirectUri: flowSpecific.redirectUri.trim() }
						: {}),
					...(flowSpecific.postLogoutRedirectUri?.trim()
						? { postLogoutRedirectUri: flowSpecific.postLogoutRedirectUri.trim() }
						: {}),
					scopes: (flowSpecific.scopes?.trim() || 'openid').trim(),
					...(flowSpecific.responseType?.trim()
						? { responseType: flowSpecific.responseType.trim() }
						: {}),
					...(flowSpecific.loginHint?.trim() ? { loginHint: flowSpecific.loginHint.trim() } : {}),
					// Checkbox values - load from flow-specific storage
					...(typeof flowSpecific.usePKCE === 'boolean' ? { usePKCE: flowSpecific.usePKCE } : {}),
					...(typeof flowSpecific.enableRefreshToken === 'boolean'
						? { enableRefreshToken: flowSpecific.enableRefreshToken }
						: {}),
					...(typeof flowSpecific.useRedirectless === 'boolean'
						? { useRedirectless: flowSpecific.useRedirectless }
						: {}),
				};

				// Update credentials from storage if we have any data
				// Always use storage data if it exists, as it's the source of truth
				setCredentials((prev) => {
					// Check if we have any meaningful data in storage (after trimming)
					const hasStorageData = !!(
						merged.environmentId?.trim() ||
						merged.clientId?.trim() ||
						merged.clientSecret?.trim() ||
						flowSpecific.environmentId?.trim() ||
						flowSpecific.clientId?.trim() ||
						flowSpecific.clientSecret?.trim() ||
						shared.environmentId?.trim() ||
						shared.clientId?.trim() ||
						shared.clientSecret?.trim()
					);

					// Check if current state has any meaningful data
					const hasExistingData = !!(
						prev.environmentId?.trim() ||
						prev.clientId?.trim() ||
						prev.clientSecret?.trim()
					);

					// Check if credentials actually changed by comparing serialized values
					const prevString = JSON.stringify(prev);
					const mergedString = JSON.stringify(merged);
					const credentialsChanged = prevString !== mergedString;

					// If credentials haven't changed, return previous to prevent unnecessary updates
					if (!credentialsChanged && hasExistingData) {
						return prev;
					}

					// If we have storage data, always use it (storage is source of truth)
					if (hasStorageData) {
						return merged;
					} else if (hasExistingData) {
						// No storage data but we have existing - preserve it
						return prev; // Preserve existing credentials
					} else {
						// No data anywhere - use defaults (first time load)
						const storedEnvId = EnvironmentIdServiceV8.getEnvironmentId();
						return {
							environmentId: storedEnvId || '',
							clientId: '',
							scopes: 'openid',
						};
					}
				});
			} catch (err) {
				console.error(
					`${MODULE_TAG} ❌ Error loading credentials (will preserve existing state):`,
					err
				);
				console.error(
					`${MODULE_TAG} Error stack:`,
					err instanceof Error ? err.stack : 'No stack trace'
				);
				// Don't clear credentials on error - preserve what we have
			} finally {
				// Clear loading flag after load completes (use setTimeout to ensure state updates have flushed)
				setTimeout(() => {
					isLoadingCredentialsRef.current = false;
				}, 0);
			}
		};

		// Load credentials immediately on mount and when flow key changes
		// Only load if flowKey actually changed (prevents loops)
		if (lastLoadedFlowKeyRef.current !== flowKey) {
			loadCredentials();
		}

		// Reload credentials when page becomes visible (in case storage was cleared/updated in another tab)
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				loadCredentials();
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [flowKey]); // Reload when flow key changes

	/**
	 * Credential persistence refs - prevent infinite save loops
	 *
	 * These refs are critical for preventing infinite loops when saving credentials:
	 *
	 * lastSavedCredsRef:
	 * - Stores JSON string of last saved credentials
	 * - Used to detect if credentials actually changed before saving
	 * - Prevents saving identical credentials repeatedly
	 *
	 * saveTimeoutRef:
	 * - Stores debounce timeout ID
	 * - Used to debounce credential saves (wait 500ms after last change)
	 * - Prevents rapid-fire saves when user is typing
	 *
	 * isLoadingCredentialsRef:
	 * - Flag to indicate credentials are currently being loaded
	 * - Prevents save effect from running during load
	 * - Breaks the loop: load → setCredentials → save → load → ...
	 */
	const lastSavedCredsRef = useRef<string>('');
	const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const isLoadingCredentialsRef = useRef<boolean>(false);

	/**
	 * Save credentials when they change (debounced to prevent rapid saves)
	 *
	 * This effect watches for credential changes and saves them to storage.
	 *
	 * Debouncing:
	 * - Waits 500ms after last credential change before saving
	 * - Prevents saving on every keystroke
	 * - Improves performance and reduces storage writes
	 *
	 * Deep comparison:
	 * - Compares JSON string of credentials to detect actual changes
	 * - Prevents saving if credentials haven't actually changed
	 * - Avoids unnecessary storage writes and re-renders
	 *
	 * Loading guard:
	 * - Skips save if credentials are currently being loaded
	 * - Prevents save → load → save → load infinite loop
	 * - Uses ref instead of state to avoid dependency issues
	 *
	 * Error handling:
	 * - Catches and logs save errors without breaking the UI
	 * - Credentials remain in React state even if save fails
	 * - User can retry by making another change
	 */
	useEffect(() => {
		// Skip save if we're currently loading credentials (prevents loop)
		if (isLoadingCredentialsRef.current) {
			return;
		}

		// Clear any pending save
		if (saveTimeoutRef.current) {
			clearTimeout(saveTimeoutRef.current);
		}

		// Debounce saves by 100ms to prevent rapid-fire saves during form updates
		saveTimeoutRef.current = setTimeout(() => {
			const saveCredentials = async () => {
				// Double-check we're not loading (async check)
				if (isLoadingCredentialsRef.current) {
					return;
				}

				if (credentials.environmentId || credentials.clientId || credentials.clientSecret) {
					// Serialize credentials to check if they actually changed
					const credsString = JSON.stringify(credentials);
					if (credsString === lastSavedCredsRef.current) {
						// No actual change, skip save to prevent loops
						return;
					}
					lastSavedCredsRef.current = credsString;

					// Save flow-specific credentials (redirectUri, scopes, responseType, etc.)
					const credsForSave = credentials as unknown as Parameters<
						typeof CredentialsServiceV8.saveCredentials
					>[1];
					CredentialsServiceV8.saveCredentials(flowKey, credsForSave);

					// Save shared credentials (environmentId, clientId, clientSecret, etc.) to shared storage
					// Important: Always save shared credentials if any shared field is present, including clientSecret
					// This ensures client secret persists across browser refreshes
					const sharedCreds = SharedCredentialsServiceV8.extractSharedCredentials(
						credentials as unknown as Record<string, unknown>
					);
					if (
						sharedCreds.environmentId ||
						sharedCreds.clientId ||
						sharedCreds.clientSecret !== undefined
					) {
						await SharedCredentialsServiceV8.saveSharedCredentials(sharedCreds);
					}
				}
			};

			saveCredentials().catch((err) => {
				console.error(`${MODULE_TAG} Error saving credentials:`, err);
			});
		}, 100);

		// Cleanup timeout on unmount
		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}
		};
	}, [credentials, flowKey]);

	/**
	 * Calculate total number of steps for the current flow type
	 * Matches the logic in UnifiedFlowSteps component
	 */
	const getTotalSteps = useCallback((): number => {
		switch (effectiveFlowType) {
			case 'client-credentials':
				return 4; // Config → Token Request → Tokens → Introspection & UserInfo
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
	}, [effectiveFlowType, credentials.usePKCE]);

	/**
	 * Manual save credentials function (for keyboard shortcut)
	 */
	const handleManualSaveCredentials = useCallback(async () => {
		try {
			if (credentials.environmentId || credentials.clientId || credentials.clientSecret) {
				// Save flow-specific credentials
				const credsForSave = credentials as unknown as Parameters<
					typeof CredentialsServiceV8.saveCredentials
				>[1];
				CredentialsServiceV8.saveCredentials(flowKey, credsForSave);

				// Save shared credentials
				const sharedCreds = SharedCredentialsServiceV8.extractSharedCredentials(
					credentials as unknown as Record<string, unknown>
				);
				if (
					sharedCreds.environmentId ||
					sharedCreds.clientId ||
					sharedCreds.clientSecret !== undefined
				) {
					await SharedCredentialsServiceV8.saveSharedCredentials(sharedCreds);
				}

				// Update last saved reference to prevent duplicate saves
				lastSavedCredsRef.current = JSON.stringify(credentials);

				toastV8.success('Credentials saved successfully');
			} else {
				toastV8.warning('No credentials to save');
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Error manually saving credentials:`, error);
			toastV8.error('Failed to save credentials');
		}
	}, [credentials, flowKey]);

	/**
	 * Navigate to next step
	 */
	const handleNextStep = useCallback(() => {
		const totalSteps = getTotalSteps();
		if (currentStep < totalSteps - 1) {
			navigateToStep(currentStep + 1);
		} else {
			toastV8.info('Already on the last step');
		}
	}, [currentStep, getTotalSteps, navigateToStep]);

	/**
	 * Keyboard shortcuts handler
	 * - Cmd/Ctrl+N: Next step
	 * - Cmd/Ctrl+S: Save credentials
	 */
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// Skip if user is typing in an input, textarea, or contenteditable element
			const target = event.target as HTMLElement;
			if (
				target instanceof HTMLInputElement ||
				target instanceof HTMLTextAreaElement ||
				target.isContentEditable
			) {
				return;
			}

			// Check for Cmd (Mac) or Ctrl (Windows/Linux)
			const isModifierPressed = event.metaKey || event.ctrlKey;

			if (isModifierPressed) {
				// Cmd/Ctrl+N: Next step
				if (event.key === 'n' || event.key === 'N') {
					event.preventDefault();
					handleNextStep();
					return;
				}

				// Cmd/Ctrl+S: Save credentials
				if (event.key === 's' || event.key === 'S') {
					event.preventDefault();
					handleManualSaveCredentials();
					return;
				}
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [handleNextStep, handleManualSaveCredentials]);

	const handleCredentialsChange = (updatedCredentials: unknown) => {
		setCredentials(updatedCredentials as UnifiedFlowCredentials);
	};

	const handleSpecVersionChange = (newSpec: SpecVersion) => {
		// Modal state removed - dropdown already filters flows

		// Validate flow type is still available BEFORE changing spec version
		const newAvailableFlows = UnifiedFlowIntegrationV8U.getAvailableFlows(newSpec);
		if (!newAvailableFlows.includes(flowType)) {
			const newFlowType = newAvailableFlows[0] || 'oauth-authz';
			// Update flow type FIRST, then spec version
			setFlowType(newFlowType);
		}

		// Now update spec version
		setSpecVersion(newSpec);

		// Save spec version for this flow type
		FlowSettingsServiceV8U.saveSpecVersion(flowType, newSpec);
	};

	const handleFlowTypeChange = async (newFlowType: FlowType) => {
		// Prevent changing to the same flow type (prevents loops)
		if (newFlowType === flowType) {
			return;
		}

		// CRITICAL: Validate that the new flow type is available for the current spec version
		// If not, automatically switch to a compatible spec version
		const currentAvailableFlows = UnifiedFlowIntegrationV8U.getAvailableFlows(specVersion);
		if (!currentAvailableFlows.includes(newFlowType)) {
			// Find a spec version that supports this flow type
			const compatibleSpecVersions: SpecVersion[] = ['oauth2.0', 'oauth2.1', 'oidc'];
			const compatibleSpec = compatibleSpecVersions.find((spec) => {
				const flows = UnifiedFlowIntegrationV8U.getAvailableFlows(spec);
				return flows.includes(newFlowType);
			});

			if (compatibleSpec) {
				// Switch spec version first, then flow type
				setSpecVersion(compatibleSpec);
				FlowSettingsServiceV8U.saveSpecVersion(newFlowType, compatibleSpec);
			} else {
				console.error(`${MODULE_TAG} ❌ No compatible spec version found for flow type`, {
					newFlowType,
				});
				toastV8.error(`${newFlowType} flow is not supported. Please select a different flow type.`);
				return;
			}
		}

		// Check if there are API calls to clear
		const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
		const apiCalls = apiCallTrackerService.getApiCalls();
		const hasApiCalls = apiCalls.length > 0;

		// If there are API calls, ask for confirmation before clearing
		if (hasApiCalls) {
			const confirmed = await uiNotificationServiceV8.confirm({
				title: 'Clear API Calls?',
				message: `Changing the flow type will clear all ${apiCalls.length} API call${apiCalls.length !== 1 ? 's' : ''} from the display. This action cannot be undone.`,
				confirmText: 'Clear and Change Flow',
				cancelText: 'Cancel',
				severity: 'warning',
			});

			if (!confirmed) {
				// Reset the dropdown to the current flow type
				// Note: The FlowTypeSelector component should handle this automatically
				// by being controlled by the flowType state
				return;
			}
		}

		// Clear API calls when flow type changes (only if confirmed or no calls exist)
		if (hasApiCalls) {
			apiCallTrackerService.clearApiCalls();
		}

		// CRITICAL: Mark that user is changing flow type to prevent auto-correct from interfering
		isUserChangingFlowRef.current = true;

		// CRITICAL: Mark URL as synced BEFORE updating flow type and URL
		// This prevents the URL sync effect from resetting the flow type
		lastSyncedUrlFlowTypeRef.current = newFlowType;
		lastProcessedFlowTypeRef.current = null;

		// Update flow type state
		setFlowType(newFlowType);

		// Navigate to current step with new flow type to update URL
		if (currentStep !== undefined) {
			const path = `/v8u/unified/${newFlowType}/${currentStep}`;
			navigate(path, { replace: true });
		}

		// Reset the flag after a short delay to allow state updates to complete
		setTimeout(() => {
			isUserChangingFlowRef.current = false;
		}, 100);
	};

	// Get API documentation URL for the current flow type
	const getApiDocsUrl = (flow: FlowType): string => {
		const baseUrl = 'https://apidocs.pingidentity.com/pingone/platform/v1/api/';
		// #region agent log
		method: 'POST', headers;
		: 'Content-Type': 'application/json' ,
			body: JSON.stringify(
				location: 'UnifiedOAuthFlowV8U.tsx:1103',
				message: 'Generating PingOne API documentation URL',
				data: flowType: flow, baseUrl ,
				timestamp: Date.now(),
				sessionId: 'debug-session',
				hypothesisId: 'A',),
	};
	).catch(() => )
	// #endregion

	let url: string;
	switch (flow) {
		case 'oauth-authz':
			url = `${baseUrl}#authorization-and-authentication-apis-authorize-authorization-code`;
			break;
		case 'implicit':
			url = `${baseUrl}#authorization-and-authentication-apis-authorize-implicit`;
			break;
		case 'client-credentials':
			url = `${baseUrl}#authorization-and-authentication-apis-token-client-credentials`;
			break;
		case 'device-code':
			url = `${baseUrl}#authorization-and-authentication-apis-device-authorization-request`;
			break;
		case 'hybrid':
			url = `${baseUrl}#openid-connect`;
			break;
		default:
			url = baseUrl;
	}

	// #region agent log
	method: 'POST', headers;
	: 'Content-Type': 'application/json' ,
			body: JSON.stringify(
				location: 'UnifiedOAuthFlowV8U.tsx:1125',
				message: 'Generated PingOne API documentation URL',
				data: flowType: flow, url, hasAnchor: url.includes('#') ,
				timestamp: Date.now(),
				sessionId: 'debug-session',
				hypothesisId: 'A',),
};
).catch(() =>
{
}
)
// #endregion

return url;
}

return (
		<div
			style={{
				maxWidth: '1200px',
				margin: '0 auto',
				padding: '2rem',
				background: '#f8fafc',
				minHeight: '100vh',
			}}
		>
			{/* Navigation Bar - At the very top */}
			<UnifiedNavigationV8U currentFlowType={effectiveFlowType} showBackToMain={true} />

			{/* Header with Flow Step Breadcrumbs at Top */}
			<div
				style={{
					marginBottom: '32px',
					padding: '24px',
					background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
					borderRadius: '12px',
					color: '#0c4a6e',
					position: 'relative',
					overflow: 'hidden',
				}}
			>
				{/* Decorative background pattern */}
				<div
					style={{
						position: 'absolute',
						top: 0,
						right: 0,
						width: '300px',
						height: '100%',
						background:
							'radial-gradient(circle at top right, rgba(255,255,255,0.3) 0%, transparent 70%)',
						pointerEvents: 'none',
					}}
				/>

				{/* Flow Step Breadcrumbs - Rendered here by UnifiedFlowSteps */}
				<div
					id="v8u-flow-breadcrumbs"
					style={{
						marginBottom: '16px',
						position: 'relative',
						zIndex: 1,
						minHeight: '40px',
					}}
				>
					{/* Breadcrumbs will be injected here */}
				</div>

				<h1
					style={{
						fontSize: '32px',
						fontWeight: '700',
						margin: '0 0 8px 0',
						position: 'relative',
						zIndex: 1,
					}}
				>
					🎯 Unified OAuth/OIDC Flow
				</h1>
				<p
					style={{
						fontSize: '16px',
						margin: 0,
						opacity: 0.9,
						position: 'relative',
						zIndex: 1,
					}}
				>
					Single UI for all OAuth 2.0, OAuth 2.1 / OIDC 2.1, and OIDC Core 1.0 flows using real PingOne APIs
				</p>
			</div>

			{/* Compact Selectors Row with API Docs Link */}
			<div
				style={{
					padding: '16px',
					background: '#ffffff',
					borderRadius: '8px',
					border: '1px solid #e2e8f0',
					marginBottom: '24px',
				}}
			>
				<div
					style={{
						display: 'flex',
						gap: '32px',
						flexWrap: 'wrap',
						alignItems: 'flex-start',
						marginBottom: '12px',
					}}
				>
					<SpecVersionSelector specVersion={specVersion} onChange={handleSpecVersionChange} />
					<FlowTypeSelector
						specVersion={specVersion}
						flowType={flowType}
						onChange={handleFlowTypeChange}
					/>
				</div>

					{/* Postman Collection Download Button */}
					<div
						style={{
							marginBottom: '12px',
						}}
					>
						<button
							type="button"
							onClick={() => {
								const collection = generateComprehensiveUnifiedPostmanCollection({
									environmentId: credentials.environmentId,
									clientId: credentials.clientId,
									clientSecret: credentials.clientSecret,
								});
								const date = new Date().toISOString().split('T')[0];
								const filename = `pingone-unified-flows-complete-${date}-collection.json`;
								downloadPostmanCollectionWithEnvironment(collection, filename, 'PingOne Unified Flows Environment');
								toastV8.success('Postman collection and environment downloaded! Import both into Postman to test all Unified flows.');
							}}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								padding: '12px 24px',
								background: '#8b5cf6',
								color: 'white',
								border: 'none',
								borderRadius: '8px',
								fontSize: '15px',
								fontWeight: '600',
								cursor: 'pointer',
								boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
								transition: 'all 0.2s ease',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = '#7c3aed';
								e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = '#8b5cf6';
								e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.3)';
							}}
							title="Download comprehensive Postman collection for all Unified flows (Authorization Code, Implicit, Client Credentials, Device Code, Hybrid) grouped by Registration and Authentication"
						>
							<FiPackage size={18} />
							Download All Unified Flows Postman Collection
						</button>
						<button
							type="button"
							onClick={() => {
								// Get MFA credentials
								const mfaCreds = CredentialsServiceV8.loadCredentials('mfa-v8', {
									flowKey: 'mfa-v8',
									flowType: 'oauth' as const,
									includeClientSecret: false,
									includeScopes: false,
									includeRedirectUri: false,
									includeLogoutUri: false,
								});
								
								const collection = generateCompletePostmanCollection({
									environmentId: credentials.environmentId,
									clientId: credentials.clientId,
									clientSecret: credentials.clientSecret,
									username: mfaCreds?.username,
								});
								const date = new Date().toISOString().split('T')[0];
								const filename = `pingone-complete-unified-mfa-${date}-collection.json`;
								downloadPostmanCollectionWithEnvironment(collection, filename, 'PingOne Complete Collection Environment');
								toastV8.success('Complete Postman collection (Unified + MFA) downloaded! Import both files into Postman.');
							}}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								padding: '12px 24px',
								background: '#10b981',
								color: 'white',
								border: 'none',
								borderRadius: '8px',
								fontSize: '15px',
								fontWeight: '600',
								cursor: 'pointer',
								boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
								transition: 'all 0.2s ease',
								marginTop: '12px',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = '#059669';
								e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = '#10b981';
								e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
							}}
							title="Download complete Postman collection for all Unified OAuth/OIDC flows AND all MFA device types in one collection"
						>
							<FiPackage size={18} />
							Download Complete Collection (Unified + MFA)
						</button>
					</div>

					{/* API Documentation and Specification Links */}
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						gap: '8px',
					}}
				>
					{/* PingOne API Documentation Link */}
					<div
						style={{
							padding: '8px 12px',
							background: '#f0f9ff',
							borderRadius: '4px',
							border: '1px solid #bae6fd',
							fontSize: '13px',
							color: '#0369a1',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
					>
						<span>📖</span>
						<span>
							<strong>API Documentation:</strong>{' '}
							<a
								href={getApiDocsUrl(effectiveFlowType)}
								target="_blank"
								rel="noopener noreferrer"
								style={{
									color: '#0284c7',
									textDecoration: 'underline',
									fontWeight: '500',
								}}
							>
								View PingOne API Docs for {SpecVersionServiceV8.getFlowLabel(effectiveFlowType)}
							</a>
						</span>
					</div>

					{/* OAuth/OIDC Specification Links */}
					{(() => {
						const specUrls = SpecUrlServiceV8.getCombinedSpecUrls(specVersion, effectiveFlowType);
						// #region agent log (silently fail - analytics server not available)
						// Suppress all errors to prevent console spam
						try {
								method: 'POST',
								headers: 'Content-Type': 'application/json' ,
								body: JSON.stringify(
									location: 'UnifiedOAuthFlowV8U.tsx:1369',
									message: 'Generating specification URLs',
									data: 
										specVersion,
										flowType: effectiveFlowType,
										primaryUrl: specUrls.primary,
										primaryLabel: specUrls.primaryLabel,
										allSpecsCount: specUrls.allSpecs.length,
										allSpecs: specUrls.allSpecs.map((s) => (label: s.label, url: s.url, isPrimary: s.isPrimary )),,
									timestamp: Date.now(),
									sessionId: 'debug-session',
									hypothesisId: 'B',),
							}).catch(() => );
						} catch {
							// Silently ignore - analytics server not available
						}
						// #endregion
						return (
							<div
								style={{
									padding: '8px 12px',
									background: '#f0fdf4',
									borderRadius: '4px',
									border: '1px solid #86efac',
									fontSize: '13px',
									color: '#166534',
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
									<span>📋</span>
									<span>
										<strong>Specification:</strong>{' '}
										<a
											href={specUrls.primary}
											target="_blank"
											rel="noopener noreferrer"
											style={{
												color: '#16a34a',
												textDecoration: 'underline',
												fontWeight: '500',
											}}
										>
											{specUrls.primaryLabel}
										</a>
									</span>
								</div>
								{specUrls.allSpecs.length > 1 && (
									<div
										style={{
											marginLeft: '24px',
											paddingTop: '4px',
											fontSize: '12px',
											color: '#15803d',
										}}
									>
										{specUrls.allSpecs.slice(0, 3).map((spec, index) => (
											<div key={index} style={{ marginBottom: '4px' }}>
												{spec.isPrimary && '→ '}
												<a
													href={spec.url}
													target="_blank"
													rel="noopener noreferrer"
													style={{
														color: '#16a34a',
														textDecoration: 'underline',
													}}
												>
													{spec.label}
												</a>
											</div>
										))}
									</div>
								)}
							</div>
						);
					})()}
				</div>
			</div>

			{/* Compliance Errors (Critical - Block Execution) */}
			{complianceErrors.length > 0 && (
				<div
					style={{
						marginBottom: '24px',
						padding: '16px 20px',
						background: '#fee2e2',
						borderRadius: '8px',
						border: '2px solid #dc2626',
						boxShadow: '0 2px 8px rgba(220, 38, 38, 0.2)',
					}}
				>
					<div
						style={{
							fontSize: '16px',
							fontWeight: '700',
							color: '#991b1b',
							marginBottom: '12px',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
					>
						<span>🚫</span>
						<span>OAuth 2.1 / OIDC 2.1 Compliance Error</span>
					</div>
					{complianceErrors.map((error, index) => (
						<div
							key={index}
							style={{
								fontSize: '14px',
								color: '#991b1b',
								marginBottom: index < complianceErrors.length - 1 ? '12px' : '0',
								lineHeight: '1.6',
							}}
						>
							{error}
						</div>
					))}
					<div
						style={{
							marginTop: '12px',
							padding: '8px 12px',
							background: 'rgba(220, 38, 38, 0.1)',
							borderRadius: '6px',
							fontSize: '13px',
							color: '#991b1b',
						}}
					>
						<strong>Action Required:</strong> Please select a compliant flow type to proceed.
					</div>
				</div>
			)}

			{/* Compliance Warnings (Non-Critical) */}
			{complianceWarnings.length > 0 && !complianceErrors.length && (
				<div
					style={{
						marginBottom: '24px',
						padding: '12px 16px',
						background: '#fef3c7',
						borderRadius: '8px',
						border: '1px solid #fbbf24',
					}}
				>
					{complianceWarnings.map((warning, index) => (
						<div
							key={index}
							style={{
								fontSize: '14px',
								color: '#92400e',
								marginBottom: index < complianceWarnings.length - 1 ? '8px' : '0',
							}}
						>
							{warning}
						</div>
					))}
				</div>
			)}

			{/* API Display Toggle - Show/Hide API Calls */}
			<div
				style={{
					display: 'flex',
					justifyContent: 'flex-end',
					marginBottom: '16px',
				}}
			>
				<ApiDisplayCheckbox />
			</div>

			{/* Credentials Form - Collapsible */}
			<div
				style={{
					background: '#ffffff',
					borderRadius: '12px',
					border: '1px solid #e2e8f0',
					boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
					marginBottom: '24px',
				}}
			>
				{/* Collapse/Expand Header */}
				<button
					type="button"
					onClick={() => {
						console.log(`${MODULE_TAG} 🔄 Toggling credentials collapse`, {
							from: isCredentialsCollapsed,
							to: !isCredentialsCollapsed,
						});
						setIsCredentialsCollapsed(!isCredentialsCollapsed);
					}}
					style={{
						width: '100%',
						padding: '16px 24px',
						background: isCredentialsCollapsed ? '#f8fafc' : '#ffffff',
						border: 'none',
						borderBottom: isCredentialsCollapsed ? 'none' : '1px solid #e2e8f0',
						borderRadius: isCredentialsCollapsed ? '12px' : '12px 12px 0 0',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						transition: 'all 0.2s ease',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
						<span style={{ fontSize: '20px' }}>{isCredentialsCollapsed ? '▶️' : '🔽'}</span>
						<div style={{ textAlign: 'left' }}>
							<div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
								Configuration & Credentials
							</div>
							<div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
								{isCredentialsCollapsed ? 'Click to expand' : 'Click to collapse'}
							</div>
						</div>
					</div>
					<div
						style={{
							padding: '4px 12px',
							background: isCredentialsCollapsed ? '#dbeafe' : '#f0fdf4',
							borderRadius: '4px',
							fontSize: '12px',
							fontWeight: '600',
							color: isCredentialsCollapsed ? '#1e40af' : '#166534',
						}}
					>
						{isCredentialsCollapsed ? 'Collapsed' : 'Expanded'}
					</div>
				</button>

				{/* Credentials Form Content */}
				{!isCredentialsCollapsed && (
					<div style={{ padding: '24px' }}>
						<CredentialsFormV8U
							flowKey={flowKey}
							flowType={effectiveFlowType}
							credentials={
								credentials as unknown as Parameters<typeof CredentialsFormV8U>[0]['credentials']
							}
							onChange={handleCredentialsChange}
							title={`${SpecVersionServiceV8.getSpecLabel(specVersion)} - ${SpecVersionServiceV8.getFlowLabel(effectiveFlowType)}`}
							subtitle={SpecVersionServiceV8.getSpecDescription(specVersion)}
							onAppTypeChange={(appType, suggestedFlowType) => {
								console.log(`${MODULE_TAG} App type changed`, { appType, suggestedFlowType });

								// Check if suggested flow type is available for current spec
								if (suggestedFlowType) {
									const availableFlows = UnifiedFlowIntegrationV8U.getAvailableFlows(specVersion);
									if (availableFlows.includes(suggestedFlowType)) {
										console.log(`${MODULE_TAG} Auto-selecting suggested flow type`, {
											from: flowType,
											to: suggestedFlowType,
											appType,
										});
										setFlowType(suggestedFlowType);

										// Also enable PKCE for public client app types if Authorization Code flow
										if (
											suggestedFlowType === 'oauth-authz' &&
											(appType === 'spa' || appType === 'mobile' || appType === 'desktop')
										) {
											const updatedCredentials = {
												...credentials,
												usePKCE: true,
											};
											handleCredentialsChange(updatedCredentials);
											console.log(
												`${MODULE_TAG} Auto-enabled PKCE for ${appType} application type`
											);
										}
									} else {
										console.log(`${MODULE_TAG} Suggested flow not available for spec`, {
											suggestedFlowType,
											specVersion,
											availableFlows,
										});
									}
								}
							}}
						/>
					</div>
				)}
			</div>

			{/* Unified Flow Steps - Blocked if compliance errors exist */}
			{complianceErrors.length === 0 && (
				<UnifiedFlowSteps
					specVersion={specVersion}
					flowType={effectiveFlowType}
					credentials={credentials}
					onCredentialsChange={handleCredentialsChange}
					appConfig={appConfig ?? undefined}
					onFlowReset={() => {
						// Flow reset - preserve credentials, spec version, and flow type
						console.log(
							`${MODULE_TAG} 🔄 Flow reset detected - preserving credentials, spec version, and flow type`,
							{
								specVersion,
								flowType: effectiveFlowType,
								flowKey,
							}
						);

						// Use standardized credential reload service
						const reloaded = reloadCredentialsAfterReset(flowKey);
						setCredentials(reloaded);

						// Spec version and flow type are already preserved in React state
						// No need to do anything - they will remain as-is
						console.log(
							`${MODULE_TAG} ✅ Flow reset complete - spec version and flow type preserved`,
							{
								specVersion,
								flowType: effectiveFlowType,
							}
						);
					}}
				/>
			)}

			{/* Flow Not Available Modal - REMOVED: Dropdown already filters flows by spec version */}

			{/* Super Simple API Display - Toggleable, hidden by default - Only shows Unified flow calls */}
			<SuperSimpleApiDisplayV8 flowFilter="unified" />
		</div>
	);
}

export default UnifiedOAuthFlowV8U;
