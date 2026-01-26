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

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiBook, FiChevronDown, FiPackage } from 'react-icons/fi';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { usePageScroll } from '@/hooks/usePageScroll';
import { useUnifiedSharedCredentials } from '@/hooks/useUnifiedSharedCredentials';
import {
	downloadPostmanCollectionWithEnvironment,
	generateCompletePostmanCollection,
	generateComprehensiveUnifiedPostmanCollection,
} from '@/services/postmanCollectionGeneratorV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import {
	PageHeaderGradients,
	PageHeaderTextColors,
	PageHeaderV8,
} from '@/v8/components/shared/PageHeaderV8';
import { fetchAppConfig } from '@/v8/services/configCheckerServiceV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { EnvironmentIdServiceV8 } from '@/v8/services/environmentIdServiceV8';
import {
	type SharedCredentials,
	SharedCredentialsServiceV8,
} from '@/v8/services/sharedCredentialsServiceV8';
import { SpecUrlServiceV8 } from '@/v8/services/specUrlServiceV8';
import {
	type FlowType,
	type SpecVersion,
	SpecVersionServiceV8,
} from '@/v8/services/specVersionServiceV8';
import { uiNotificationServiceV8 } from '@/v8/services/uiNotificationServiceV8';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { WorkerTokenUIServiceV8 } from '@/v8/services/workerTokenUIServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { reloadCredentialsAfterReset } from '@/v8u/services/credentialReloadServiceV8U';
import { AdvancedOAuthFeatures } from '../components/AdvancedOAuthFeatures';
import CredentialsFormV8U from '../components/CredentialsFormV8U';
import { FlowGuidanceSystem } from '../components/FlowGuidanceSystem';
// FlowNotAvailableModal removed - dropdown already filters flows by spec version
import { FlowTypeSelector } from '../components/FlowTypeSelector';
import { MobileResponsiveWrapper } from '../components/MobileResponsiveWrapper';
import { SecurityScorecard } from '../components/SecurityScorecard';
import { SpecVersionSelector } from '../components/SpecVersionSelector';
import UnifiedFlowSteps from '../components/UnifiedFlowStepsRefactored';
import { UnifiedNavigationV8U } from '../components/UnifiedNavigationV8U';
import {
	FlowSettingsServiceV8U,
	getAdvancedFeatures,
	saveAdvancedFeatures,
} from '../services/flowSettingsServiceV8U';
import {
	type UnifiedFlowCredentials,
	UnifiedFlowIntegrationV8U,
} from '../services/unifiedFlowIntegrationV8U';

const MODULE_TAG = '[🎯 UNIFIED-OAUTH-FLOW-V8U]';

/**
 * Safe analytics helper - prevents connection errors when analytics server is unavailable
 */
const safeLogAnalytics = async (
	location: string,
	message: string,
	data: Record<string, unknown> = {},
	sessionId: string = 'debug-session',
	runId: string = 'flow-debug',
	hypothesisId?: string
): Promise<void> => {
	try {
		const { log } = await import('@/v8/utils/analyticsHelperV8');
		await log(location, message, data, sessionId, runId, hypothesisId);
	} catch (_error) {
		// Silently fail - analytics not available
	}
};

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

	// Unified shared credentials - sync with global Environment ID and OAuth credentials
	const { saveEnvironmentId, saveOAuthCredentials } = useUnifiedSharedCredentials();

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
		// #region agent log - Use safe analytics fetch
		(async () => {
			try {
				const { log } = await import('@/v8/utils/analyticsHelperV8');
				await log(
					'UnifiedOAuthFlowV8U.tsx:97',
					'Parsing currentStep from URL',
					{
						urlStep,
						urlFlowType,
						pathname: location.pathname,
						hash: window.location.hash.substring(0, 100),
					},
					'debug-session',
					'hybrid-redirect',
					'STEP_PARSING'
				);
			} catch {
				// Silently ignore - analytics server not available
			}
		})();
		// #endregion

		if (urlStep) {
			const stepNum = parseInt(urlStep, 10);
			// Validate step number is a valid non-negative integer
			if (!Number.isNaN(stepNum) && stepNum >= 0) {
				// #region agent log - Use safe analytics fetch
				(async () => {
					try {
						const { log } = await import('@/v8/utils/analyticsHelperV8');
						await log(
							'UnifiedOAuthFlowV8U.tsx:102',
							'Step parsed successfully',
							{ stepNum, urlStep },
							'debug-session',
							'hybrid-redirect',
							'STEP_PARSING'
						);
					} catch {
						// Silently ignore - analytics server not available
					}
				})();
				// #endregion
				return stepNum;
			}
		}
		// Default to step 0 (configuration) if no valid step in URL
		// #region agent log - Use safe analytics fetch
		(async () => {
			try {
				const { log } = await import('@/v8/utils/analyticsHelperV8');
				await log(
					'UnifiedOAuthFlowV8U.tsx:106',
					'Defaulting to step 0',
					{ urlStep, reason: urlStep ? 'Invalid step number' : 'No step in URL' },
					'debug-session',
					'hybrid-redirect',
					'STEP_PARSING'
				);
			} catch (_error) {
				// Silently fail - analytics not available
			}
		})();
		// #endregion
		return 0;
	}, [urlStep, location.pathname, urlFlowType]);

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
		// #region agent log - Use safe analytics fetch
		safeLogAnalytics(
			'UnifiedOAuthFlowV8U.tsx:181',
			'URL sync effect - ENTRY',
			{
				urlFlowType,
				flowType,
				specVersion,
				lastSynced: lastSyncedUrlFlowTypeRef.current,
				isUserChanging: isUserChangingFlowRef.current,
				pathname: location.pathname,
			},
			'debug-session',
			'flow-type-debug',
			'A'
		);
		// #endregion

		// Prevent syncing the same URL flow type multiple times
		if (lastSyncedUrlFlowTypeRef.current === urlFlowType) {
			// #region agent log - Use safe analytics fetch
			safeLogAnalytics(
				'UnifiedOAuthFlowV8U.tsx:184',
				'URL sync effect - SKIP (already synced)',
				{ urlFlowType, lastSynced: lastSyncedUrlFlowTypeRef.current },
				'debug-session',
				'flow-type-debug',
				'A'
			);
			// #endregion
			return;
		}

		// Don't sync if user is actively changing flow type (prevents interference)
		if (isUserChangingFlowRef.current) {
			// #region agent log - Use safe analytics fetch
			safeLogAnalytics(
				'UnifiedOAuthFlowV8U.tsx:189',
				'URL sync effect - SKIP (user changing)',
				{ urlFlowType, flowType, isUserChanging: isUserChangingFlowRef.current },
				'debug-session',
				'flow-type-debug',
				'B'
			);
			// #endregion
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
			// #region agent log - Use safe analytics fetch
			safeLogAnalytics(
				'UnifiedOAuthFlowV8U.tsx:196',
				'URL sync effect - CHECKING COMPATIBILITY',
				{ urlFlowType, flowType, specVersion },
				'debug-session',
				'flow-type-debug',
				'C'
			);
			// #endregion

			// CRITICAL: Check if the URL flow type is available for the current spec version
			// If not, automatically switch to a compatible spec version (just like handleFlowTypeChange does)
			const currentAvailableFlows = UnifiedFlowIntegrationV8U.getAvailableFlows(specVersion);
			// #region agent log - Use safe analytics fetch
			safeLogAnalytics(
				'UnifiedOAuthFlowV8U.tsx:205',
				'URL sync effect - AVAILABLE FLOWS CHECK',
				{
					specVersion,
					currentAvailableFlows,
					urlFlowType,
					isAvailable: currentAvailableFlows.includes(urlFlowType as FlowType),
				},
				'debug-session',
				'flow-type-debug',
				'C'
			);
			// #endregion

			if (!currentAvailableFlows.includes(urlFlowType as FlowType)) {
				// #region agent log - Use safe analytics fetch
				safeLogAnalytics(
					'UnifiedOAuthFlowV8U.tsx:207',
					'URL sync effect - FLOW NOT AVAILABLE, FINDING COMPATIBLE SPEC',
					{ urlFlowType, specVersion, currentAvailableFlows },
					'debug-session',
					'flow-type-debug',
					'D'
				);
				// #endregion

				// Find a spec version that supports this flow type
				const compatibleSpecVersions: SpecVersion[] = ['oauth2.0', 'oauth2.1', 'oidc'];
				const compatibleSpec = compatibleSpecVersions.find((spec) => {
					const flows = UnifiedFlowIntegrationV8U.getAvailableFlows(spec);
					return flows.includes(urlFlowType as FlowType);
				});

				if (compatibleSpec) {
					// #region agent log - Use safe analytics fetch
					safeLogAnalytics(
						'UnifiedOAuthFlowV8U.tsx:214',
						'URL sync effect - SWITCHING SPEC VERSION',
						{ urlFlowType, fromSpec: specVersion, toSpec: compatibleSpec },
						'debug-session',
						'flow-type-debug',
						'D'
					);
					// #endregion

					// Switch spec version first, then flow type
					setSpecVersion(compatibleSpec);
					FlowSettingsServiceV8U.saveSpecVersion(urlFlowType as FlowType, compatibleSpec);
				} else {
					// #region agent log - Use safe analytics fetch
					safeLogAnalytics(
						'UnifiedOAuthFlowV8U.tsx:219',
						'URL sync effect - NO COMPATIBLE SPEC FOUND',
						{ urlFlowType },
						'debug-session',
						'flow-type-debug',
						'D'
					);
					// #endregion

					console.warn(`${MODULE_TAG} ⚠️ No compatible spec version found for URL flow type`, {
						urlFlowType,
					});
					// Mark as synced to prevent loops, but don't change flow type
					lastSyncedUrlFlowTypeRef.current = urlFlowType;
					return;
				}
			}

			// #region agent log - Use safe analytics fetch
			safeLogAnalytics(
				'UnifiedOAuthFlowV8U.tsx:228',
				'URL sync effect - SETTING FLOW TYPE',
				{ urlFlowType, flowType, specVersion },
				'debug-session',
				'flow-type-debug',
				'C'
			);
			// #endregion

			// Mark as synced BEFORE updating to prevent re-runs
			lastSyncedUrlFlowTypeRef.current = urlFlowType;
			// Reset the last processed flow type ref so spec version loading can run
			lastProcessedFlowTypeRef.current = null;
			setFlowType(urlFlowType as FlowType);
		} else if (urlFlowType === flowType) {
			// #region agent log - Use safe analytics fetch
			safeLogAnalytics(
				'UnifiedOAuthFlowV8U.tsx:233',
				'URL sync effect - IN SYNC',
				{ urlFlowType, flowType },
				'debug-session',
				'flow-type-debug',
				'A'
			);
			// #endregion

			// URL and state are in sync - mark as synced
			lastSyncedUrlFlowTypeRef.current = urlFlowType;
		} else if (!urlFlowType) {
			// #region agent log - Use safe analytics fetch
			safeLogAnalytics(
				'UnifiedOAuthFlowV8U.tsx:237',
				'URL sync effect - NO URL FLOW TYPE',
				{ flowType },
				'debug-session',
				'flow-type-debug',
				'A'
			);
			// #endregion

			// URL doesn't have a flow type - mark current flow as synced to prevent loops
			lastSyncedUrlFlowTypeRef.current = flowType;
		}
	}, [urlFlowType, flowType, specVersion, location.pathname]);

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
		// #region agent log
		// #endregion

		// Prevent processing the same flowType multiple times
		if (lastProcessedFlowTypeRef.current === flowType) {
			// #region agent log
			// #endregion
			return;
		}

		const savedSpecVersion = FlowSettingsServiceV8U.getSpecVersion(flowType);

		// #region agent log
		// #endregion

		// Mark as processed BEFORE any state updates to prevent re-runs
		lastProcessedFlowTypeRef.current = flowType;

		// CRITICAL: Only update spec version if the saved version:
		// 1. Differs from current spec version
		// 2. Supports the current flow type (prevents auto-correct from switching flows)
		// This prevents the saved spec from overriding a valid spec that was set during flow type change
		if (savedSpecVersion !== specVersion) {
			// Check if saved spec version supports the current flow type
			const savedSpecAvailableFlows = UnifiedFlowIntegrationV8U.getAvailableFlows(savedSpecVersion);
			const savedSpecSupportsFlow = savedSpecAvailableFlows.includes(flowType);

			// #region agent log
			// #endregion

			if (savedSpecSupportsFlow) {
				// #region agent log
				// #endregion

				setSpecVersion(savedSpecVersion);
			} else {
				// #region agent log
				// #endregion

				// Don't update spec version - keep current spec that supports the flow type
				// Also save current spec version as the new preference for this flow type
				FlowSettingsServiceV8U.saveSpecVersion(flowType, specVersion);
			}
		}

		// Update last used timestamp for analytics/tracking
		// This helps identify which flows are most commonly used
		// Use current spec version (either unchanged, or updated from saved)
		// This ensures we save the correct spec version preference
		const finalSpecVersion =
			savedSpecVersion !== specVersion &&
			UnifiedFlowIntegrationV8U.getAvailableFlows(savedSpecVersion).includes(flowType)
				? savedSpecVersion
				: specVersion;

		FlowSettingsServiceV8U.saveSettings(flowType, {
			specVersion: finalSpecVersion,
		});
		// CRITICAL: Only depend on flowType, NOT specVersion to avoid loops
		// Intentionally omitting specVersion from dependencies to prevent loops
	}, [flowType, specVersion]);

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
		// #region agent log
		// #endregion

		if (location.pathname === '/v8u/unified') {
			// #region agent log
			// #endregion
			navigateToStep(0, flowType);
		}
	}, [location.pathname, navigateToStep, flowType]);

	/**
	 * Generate storage key that includes specVersion + flowType
	 * Format: {specVersion}-{flowType}-v8u
	 * Example: oidc-oauth-authz-v8u, oauth2.0-implicit-v8u
	 */
	const getFlowKey = useCallback((spec: SpecVersion, flow: FlowType): string => {
		return `${spec}-${flow}-v8u`;
	}, []);

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
		// Use default spec version for initial load (will be updated when specVersion state loads)
		const defaultSpec: SpecVersion = 'oidc';
		return getFlowKey(defaultSpec, urlFlow as FlowType);
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
		const fetchAndSetAppConfig = async () => {
			if (!credentials.environmentId || !credentials.clientId) {
				setAppConfig(null);
				return;
			}

			// Check worker token status
			const tokenStatus = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
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
				const config = await fetchAppConfig(credentials.environmentId, credentials.clientId, token);

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

		fetchAndSetAppConfig();
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

	// Listen for worker token updates
	useEffect(() => {
		const handleWorkerTokenUpdate = () => {
			console.log(`${MODULE_TAG} 🔑 Worker token updated event received!`);
			console.log(`${MODULE_TAG} 🔑 Current credentials:`, {
				hasEnvironmentId: !!credentials.environmentId,
				hasClientId: !!credentials.clientId,
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
			});

			// Re-fetch app configuration to reflect worker token status
			if (credentials.environmentId && credentials.clientId) {
				console.log(`${MODULE_TAG} 🔑 Clearing app config to trigger re-fetch`);
				setAppConfig(null); // Clear current config to trigger re-fetch
			} else {
				console.log(`${MODULE_TAG} ⚠️ Cannot refresh app config - missing credentials`);
			}
		};

		console.log(`${MODULE_TAG} 🔑 Setting up worker token event listener`);
		window.addEventListener('workerTokenUpdated', handleWorkerTokenUpdate);

		// Test if event listener is working
		console.log(`${MODULE_TAG} 🔑 Worker token listener setup complete`);

		return () => {
			console.log(`${MODULE_TAG} 🔑 Cleaning up worker token event listener`);
			window.removeEventListener('workerTokenUpdated', handleWorkerTokenUpdate);
		};
	}, [credentials.environmentId, credentials.clientId]);

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
	}, [flowType, availableFlows]);

	// Calculate current flow key (specVersion + flowType) - MUST be after effectiveFlowType is defined
	const flowKey = useMemo(() => {
		const key = getFlowKey(specVersion, effectiveFlowType);
		// #region agent log
		import('@/v8/utils/analyticsV8')
			.then(({ analytics }) => {
				analytics.log({
					location: 'UnifiedOAuthFlowV8U.tsx:509',
					message: 'FlowKey calculated',
					data: { flowKey: key, specVersion, effectiveFlowType },
				});
			})
			.catch(() => {});
		// #endregion
		return key;
	}, [specVersion, effectiveFlowType, getFlowKey]);

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
		// #region agent log
		// #endregion

		// Only auto-correct when spec version changes, not when flow type changes
		if (lastSpecVersionRef.current === specVersion) {
			// #region agent log
			// #endregion
			return;
		}

		// Don't auto-correct if user is actively changing the flow type
		if (isUserChangingFlowRef.current) {
			// #region agent log
			// #endregion

			lastSpecVersionRef.current = specVersion;
			return;
		}

		const currentAvailableFlows = UnifiedFlowIntegrationV8U.getAvailableFlows(specVersion);
		const isFlowAvailable = currentAvailableFlows.includes(flowType);

		// #region agent log
		// #endregion

		// Mark this spec version as processed
		lastSpecVersionRef.current = specVersion;

		// If flow is not available, automatically switch to first available flow
		// This only happens when spec version changes, not when user selects a flow
		if (!isFlowAvailable && currentAvailableFlows.length > 0) {
			const fallbackFlow = currentAvailableFlows[0];

			// #region agent log
			// #endregion

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

	// flowKey is already declared above (line 403) using getFlowKey() function
	// Format: {specVersion}-{flowType}-v8u (e.g., oidc-oauth-authz-v8u)

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
				// IMPORTANT: Load ALL fields from UnifiedFlowCredentials to ensure nothing is lost
				// #region agent log
				import('@/v8/utils/analyticsV8')
					.then(({ analytics }) => {
						analytics.log({
							location: 'UnifiedOAuthFlowV8U.tsx:650',
							message: 'Loading credentials - flowSpecific advanced options',
							data: {
								flowKey,
								hasResponseMode: !!flowSpecific.responseMode,
								hasUsePAR: flowSpecific.usePAR !== undefined,
								hasMaxAge: flowSpecific.maxAge !== undefined,
								hasDisplay: !!flowSpecific.display,
								hasPrompt: !!flowSpecific.prompt,
								hasPkceEnforcement: !!flowSpecific.pkceEnforcement,
								hasPrivateKey: !!flowSpecific.privateKey,
								responseMode: flowSpecific.responseMode,
								usePAR: flowSpecific.usePAR,
								pkceEnforcement: flowSpecific.pkceEnforcement,
							},
						});
					})
					.catch(() => {});
				// #endregion
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
					...(flowSpecific.logoutUri?.trim() ? { logoutUri: flowSpecific.logoutUri.trim() } : {}),
					scopes: (flowSpecific.scopes?.trim() || 'openid').trim(),
					...(flowSpecific.responseType?.trim()
						? { responseType: flowSpecific.responseType.trim() }
						: {}),
					// Advanced options - include in merge (CRITICAL: Load ALL advanced options)
					// IMPORTANT: Load ALL advanced options to ensure they persist across flow type changes
					...(flowSpecific.responseMode ? { responseMode: flowSpecific.responseMode } : {}),
					...(flowSpecific.usePAR !== undefined ? { usePAR: flowSpecific.usePAR } : {}),
					...(flowSpecific.maxAge !== undefined && flowSpecific.maxAge !== null
						? { maxAge: flowSpecific.maxAge }
						: {}),
					...(flowSpecific.display ? { display: flowSpecific.display } : {}),
					...(flowSpecific.prompt ? { prompt: flowSpecific.prompt } : {}),
					...(flowSpecific.loginHint?.trim() ? { loginHint: flowSpecific.loginHint.trim() } : {}),
					...(flowSpecific.loginHint === '' ? { loginHint: '' } : {}), // Explicitly handle empty string
					// Checkbox values - load from flow-specific storage
					...(typeof flowSpecific.usePKCE === 'boolean' ? { usePKCE: flowSpecific.usePKCE } : {}),
					...(typeof flowSpecific.enableRefreshToken === 'boolean'
						? { enableRefreshToken: flowSpecific.enableRefreshToken }
						: {}),
					...(typeof flowSpecific.useRedirectless === 'boolean'
						? { useRedirectless: flowSpecific.useRedirectless }
						: {}),
					// PKCE enforcement - load from flow-specific storage (CRITICAL: was missing!)
					...(flowSpecific.pkceEnforcement
						? { pkceEnforcement: flowSpecific.pkceEnforcement }
						: {}),
					// Private key for private_key_jwt authentication
					...(flowSpecific.privateKey ? { privateKey: flowSpecific.privateKey } : {}),
				};
				// #region agent log
				import('@/v8/utils/analyticsV8')
					.then(({ analytics }) => {
						analytics.log({
							location: 'UnifiedOAuthFlowV8U.tsx:698',
							message: 'Merged credentials - ALL fields in merged object',
							data: {
								flowKey,
								hasResponseMode: !!merged.responseMode,
								hasUsePAR: merged.usePAR !== undefined,
								hasMaxAge: merged.maxAge !== undefined,
								hasDisplay: !!merged.display,
								hasPrompt: !!merged.prompt,
								hasPkceEnforcement: !!merged.pkceEnforcement,
								hasPrivateKey: !!merged.privateKey,
								hasLoginHint: merged.loginHint !== undefined,
								responseMode: merged.responseMode,
								usePAR: merged.usePAR,
								pkceEnforcement: merged.pkceEnforcement,
								allKeys: Object.keys(merged),
							},
						});
					})
					.catch(() => {});
				// #endregion

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

				// Save credentials if any field has a value (more permissive than before)
				const hasAnyValue = Object.values(credentials).some(
					(value) => value !== undefined && value !== null && value !== ''
				);

				if (hasAnyValue) {
					// Serialize credentials to check if they actually changed
					const credsString = JSON.stringify(credentials);
					if (credsString === lastSavedCredsRef.current) {
						// No actual change, skip save to prevent loops
						return;
					}
					lastSavedCredsRef.current = credsString;

					// Save flow-specific credentials (redirectUri, scopes, responseType, etc.)
					// IMPORTANT: Save ALL fields from UnifiedFlowCredentials to ensure nothing is lost
					const credsForSave = credentials as unknown as Parameters<
						typeof CredentialsServiceV8.saveCredentials
					>[1];
					// #region agent log
					import('@/v8/utils/analyticsV8')
						.then(({ analytics }) => {
							analytics.log({
								location: 'UnifiedOAuthFlowV8U.tsx:897',
								message: 'Auto-saving credentials - ALL fields',
								data: {
									flowKey,
									hasResponseMode: !!credentials.responseMode,
									hasUsePAR: credentials.usePAR !== undefined,
									hasMaxAge: credentials.maxAge !== undefined,
									hasDisplay: !!credentials.display,
									hasPrompt: !!credentials.prompt,
									hasPkceEnforcement: !!credentials.pkceEnforcement,
									hasPrivateKey: !!credentials.privateKey,
									hasLoginHint: credentials.loginHint !== undefined,
									hasRedirectUri: !!credentials.redirectUri,
									hasClientAuthMethod: !!credentials.clientAuthMethod,
									allKeys: Object.keys(credentials),
								},
							});
						})
						.catch(() => {});
					// #endregion
					CredentialsServiceV8.saveCredentials(flowKey, credsForSave);

					// Save shared credentials (environmentId, clientId, clientSecret, etc.) to unified shared storage
					// Important: Always save shared credentials if any shared field is present, including clientSecret
					if (
						credentials.environmentId ||
						credentials.clientId ||
						credentials.clientSecret ||
						credentials.issuerUrl ||
						credentials.clientAuthMethod
					) {
						// Save Environment ID separately
						if (credentials.environmentId) {
							await saveEnvironmentId(credentials.environmentId, `UnifiedOAuthFlowV8U-${flowKey}`);
						}

						// Save OAuth credentials
						const oauthCreds: {
							clientId?: string;
							clientSecret?: string;
							issuerUrl?: string;
							clientAuthMethod?: string;
						} = {};

						if (credentials.clientId) oauthCreds.clientId = credentials.clientId;
						if (credentials.clientSecret) oauthCreds.clientSecret = credentials.clientSecret;
						if (credentials.issuerUrl) oauthCreds.issuerUrl = credentials.issuerUrl;
						if (credentials.clientAuthMethod)
							oauthCreds.clientAuthMethod = credentials.clientAuthMethod;

						await saveOAuthCredentials(oauthCreds, `UnifiedOAuthFlowV8U-${flowKey}`);
					}

					// Show success notification for credential save
					toastV8.success('Configuration saved successfully');
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
	}, [credentials, flowKey, saveEnvironmentId, saveOAuthCredentials]);

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

				// Save shared credentials using unified service
				if (
					credentials.environmentId ||
					credentials.clientId ||
					credentials.clientSecret ||
					credentials.issuerUrl ||
					credentials.clientAuthMethod
				) {
					// Save Environment ID separately
					if (credentials.environmentId) {
						await saveEnvironmentId(credentials.environmentId, `UnifiedOAuthFlowV8U-manual-save`);
					}

					// Save OAuth credentials
					const oauthCreds: {
						clientId?: string;
						clientSecret?: string;
						issuerUrl?: string;
						clientAuthMethod?: string;
					} = {};

					if (credentials.clientId) oauthCreds.clientId = credentials.clientId;
					if (credentials.clientSecret) oauthCreds.clientSecret = credentials.clientSecret;
					if (credentials.issuerUrl) oauthCreds.issuerUrl = credentials.issuerUrl;
					if (credentials.clientAuthMethod)
						oauthCreds.clientAuthMethod = credentials.clientAuthMethod;

					await saveOAuthCredentials(oauthCreds, `UnifiedOAuthFlowV8U-manual-save`);
				}

				// Update last saved reference to prevent duplicate saves
				lastSavedCredsRef.current = JSON.stringify(credentials);

				toastV8.unifiedFlowSuccess('Credentials saved', 'OAuth configuration stored successfully');
			} else {
				toastV8.warning('No credentials to save');
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Error manually saving credentials:`, error);
			toastV8.unifiedFlowError('Credentials save', 'Failed to store OAuth configuration');
		}
	}, [credentials, flowKey, saveEnvironmentId, saveOAuthCredentials]);

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

	const handleAppSelected = (app: {
		id: string;
		name: string;
		description?: string;
		enabled?: boolean;
		redirectUris?: string[];
		logoutUris?: string[];
	}) => {
		console.log(`${MODULE_TAG} App selected:`, app);
		// For now, just show a toast since DiscoveredApp doesn't contain clientId/clientSecret
		// The actual app discovery and credential filling will be handled by the AppDiscoveryModalV8U
		toastV8.success(`App "${app.name}" selected! Use the app discovery modal to fill credentials.`);
	};

	const handleTogglePKCE = (enabled: boolean) => {
		setCredentials((prev) => ({ ...prev, usePKCE: enabled }));
	};

	const handleToggleRefreshToken = (enabled: boolean) => {
		setCredentials((prev) => ({ ...prev, enableRefreshToken: enabled }));
	};

	const handleToggleScopes = (scopes: string[]) => {
		setCredentials((prev) => ({ ...prev, scopes: scopes.join(' ') }));
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
		// #region agent log
		// #endregion

		// Prevent changing to the same flow type (prevents loops)
		if (newFlowType === flowType) {
			// #region agent log
			// #endregion
			return;
		}

		// CRITICAL: Validate that the new flow type is available for the current spec version
		// If not, automatically switch to a compatible spec version
		const currentAvailableFlows = UnifiedFlowIntegrationV8U.getAvailableFlows(specVersion);

		// #region agent log
		// #endregion

		if (!currentAvailableFlows.includes(newFlowType)) {
			// #region agent log
			// #endregion

			// Find a spec version that supports this flow type
			const compatibleSpecVersions: SpecVersion[] = ['oauth2.0', 'oauth2.1', 'oidc'];
			const compatibleSpec = compatibleSpecVersions.find((spec) => {
				const flows = UnifiedFlowIntegrationV8U.getAvailableFlows(spec);
				return flows.includes(newFlowType);
			});

			if (compatibleSpec) {
				// #region agent log
				// #endregion

				// Switch spec version first, then flow type
				setSpecVersion(compatibleSpec);
				FlowSettingsServiceV8U.saveSpecVersion(newFlowType, compatibleSpec);
			} else {
				// #region agent log
				// #endregion

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

		// #region agent log
		// #endregion

		// CRITICAL: Mark URL as synced BEFORE updating flow type and URL
		// This prevents the URL sync effect from resetting the flow type
		lastSyncedUrlFlowTypeRef.current = newFlowType;
		lastProcessedFlowTypeRef.current = null;

		// Update flow type state
		setFlowType(newFlowType);

		// Navigate to current step with new flow type to update URL
		if (currentStep !== undefined) {
			const path = `/v8u/unified/${newFlowType}/${currentStep}`;

			// #region agent log
			// #endregion

			navigate(path, { replace: true });
		}

		// Reset the flag after a short delay to allow state updates to complete
		setTimeout(() => {
			// #region agent log
			// #endregion

			isUserChangingFlowRef.current = false;
		}, 100);
	};

	// Get API documentation URL for the current flow type
	const getApiDocsUrl = (flow: FlowType): string => {
		const baseUrl = 'https://apidocs.pingidentity.com/pingone/platform/v1/api/';
		// #region agent log
		import('@/v8/utils/analyticsV8')
			.then(({ analytics }) => {
				analytics.log({
					location: 'UnifiedOAuthFlowV8U.tsx:1103',
					message: 'Generating PingOne API documentation URL',
					data: { flowType: flow, baseUrl },
					sessionId: 'debug-session',
					runId: 'run2',
					hypothesisId: 'A',
				});
			})
			.catch(() => {});
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
		import('@/v8/utils/analyticsV8')
			.then(({ analytics }) => {
				analytics.log({
					location: 'UnifiedOAuthFlowV8U.tsx:1125',
					message: 'Generated PingOne API documentation URL',
					data: { flowType: flow, url, hasAnchor: url.includes('#') },
					sessionId: 'debug-session',
					runId: 'run2',
					hypothesisId: 'A',
				});
			})
			.catch(() => {});
		// #endregion

		return url;
	};

	return (
		<MobileResponsiveWrapper>
			{/* Header with Flow Step Breadcrumbs at Top */}
			<PageHeaderV8
				title="🎯 Unified OAuth/OIDC Flow"
				subtitle="Single UI for all OAuth 2.0, OAuth 2.1 / OIDC 2.1, and OIDC Core 1.0 flows using real PingOne APIs"
				gradient={PageHeaderGradients.unifiedOAuth}
				textColor={PageHeaderTextColors.darkBlue}
			>
				{/* Flow Step Breadcrumbs */}
				<div
					id="v8u-flow-breadcrumbs"
					style={{
						minHeight: '40px',
					}}
				>
					{/* Breadcrumbs will be injected here */}
				</div>

				{/* Helper Page Button */}
				<div
					style={{
						display: 'flex',
						gap: '12px',
						flexWrap: 'wrap',
						marginTop: '16px',
					}}
				>
					<button
						type="button"
						onClick={() => navigate('/v8u/unified/helper')}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '6px',
							padding: '8px 16px',
							background: '#f59e0b',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							fontSize: '13px',
							fontWeight: '600',
							cursor: 'pointer',
							boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)',
							transition: 'all 0.2s ease',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = '#d97706';
							e.currentTarget.style.boxShadow = '0 3px 10px rgba(245, 158, 11, 0.4)';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = '#f59e0b';
							e.currentTarget.style.boxShadow = '0 2px 6px rgba(245, 158, 11, 0.3)';
						}}
						title="View comprehensive comparison guide for OAuth/OIDC specifications and flow types"
					>
						<FiBook size={16} />📚 Flow & Spec Comparison Guide
					</button>
				</div>

				{/* Postman Collection Download Buttons - Compact in Header */}
				<div
					style={{
						display: 'flex',
						gap: '12px',
						flexWrap: 'wrap',
						position: 'relative',
						zIndex: 1,
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
							downloadPostmanCollectionWithEnvironment(
								collection,
								filename,
								'PingOne Unified Flows Environment'
							);
							toastV8.success(
								'Postman collection and environment downloaded! Import both into Postman to test all Unified flows.'
							);
						}}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '6px',
							padding: '8px 16px',
							background: '#8b5cf6',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							fontSize: '13px',
							fontWeight: '600',
							cursor: 'pointer',
							boxShadow: '0 2px 6px rgba(139, 92, 246, 0.3)',
							transition: 'all 0.2s ease',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = '#7c3aed';
							e.currentTarget.style.boxShadow = '0 3px 10px rgba(139, 92, 246, 0.4)';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = '#8b5cf6';
							e.currentTarget.style.boxShadow = '0 2px 6px rgba(139, 92, 246, 0.3)';
						}}
						title="Download comprehensive Postman collection for all Unified flows (Authorization Code, Implicit, Client Credentials, Device Code, Hybrid) grouped by Registration and Authentication"
					>
						<FiPackage size={16} />
						Postman Unified Flows
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
							downloadPostmanCollectionWithEnvironment(
								collection,
								filename,
								'PingOne Complete Collection Environment'
							);
							toastV8.success(
								'Complete Postman collection (Unified + MFA) downloaded! Import both files into Postman.'
							);
						}}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '6px',
							padding: '8px 16px',
							background: '#10b981',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							fontSize: '13px',
							fontWeight: '600',
							cursor: 'pointer',
							boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
							transition: 'all 0.2s ease',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = '#059669';
							e.currentTarget.style.boxShadow = '0 3px 10px rgba(16, 185, 129, 0.4)';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = '#10b981';
							e.currentTarget.style.boxShadow = '0 2px 6px rgba(16, 185, 129, 0.3)';
						}}
						title="Download complete Postman collection for all Unified OAuth/OIDC flows AND all MFA device types in one collection"
					>
						<FiPackage size={16} />
						Postman Complete (Unified + MFA)
					</button>
				</div>
			</PageHeaderV8>

			{/* Unified Navigation with API Display Checkbox */}
			<UnifiedNavigationV8U />

			{/* Compact Selectors Row with API Docs Link */}
			<div
				style={{
					padding: '16px',
					background: '#ffffff',
					borderRadius: '8px',
					border: '1px solid #e2e8f0',
					marginBottom: '32px',
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
					<SpecVersionSelector
						specVersion={specVersion}
						onChange={handleSpecVersionChange}
						disabled={currentStep > 0}
					/>
					<FlowTypeSelector
						specVersion={specVersion}
						flowType={flowType}
						onChange={handleFlowTypeChange}
						disabled={currentStep > 0}
					/>
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
						// #region agent log
						import('@/v8/utils/analyticsV8')
							.then(({ analytics }) => {
								analytics.log({
									location: 'UnifiedOAuthFlowV8U.tsx:1369',
									message: 'Generating specification URLs',
									data: {
										specVersion,
										flowType: effectiveFlowType,
										primaryUrl: specUrls.primary,
										primaryLabel: specUrls.primaryLabel,
										allSpecsCount: specUrls.allSpecs.length,
										allSpecs: specUrls.allSpecs.map((s) => ({
											label: s.label,
											url: s.url,
											isPrimary: s.isPrimary,
										})),
									},
									sessionId: 'debug-session',
									runId: 'run2',
									hypothesisId: 'B',
								});
							})
							.catch(() => {});
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
						marginBottom: '32px',
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
						marginBottom: '32px',
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

			{/* Worker Token Settings - Moved above Choose the Right OAuth Flow */}
			{currentStep === 0 && (
				<div style={{ marginBottom: '32px' }}>
					<WorkerTokenUIServiceV8
						mode="detailed"
						showRefresh={true}
						context="unified"
						environmentId={credentials.environmentId}
						onAppSelected={handleAppSelected}
					/>
				</div>
			)}

			{/* User Guidance System - Help users choose the right flow */}
			{currentStep === 0 && (
				<FlowGuidanceSystem
					currentFlowType={effectiveFlowType}
					currentSpecVersion={specVersion}
					onFlowSelect={(selectedFlowType, selectedSpecVersion) => {
						console.log(`${MODULE_TAG} 🎯 User selected recommended flow`, {
							selectedFlowType,
							selectedSpecVersion,
						});
						console.log(`${MODULE_TAG} 🎯 Current state`, {
							currentFlowType: flowType,
							currentSpec: specVersion,
						});

						// Update spec version if different
						if (selectedSpecVersion !== specVersion) {
							console.log(
								`${MODULE_TAG} 🎯 Updating spec version from ${specVersion} to ${selectedSpecVersion}`
							);
							setSpecVersion(selectedSpecVersion);
							FlowSettingsServiceV8U.saveSpecVersion(selectedFlowType, selectedSpecVersion);
						} else {
							console.log(`${MODULE_TAG} 🎯 Spec version already matches, no update needed`);
						}

						// Update flow type if different
						if (selectedFlowType !== flowType) {
							console.log(
								`${MODULE_TAG} 🎯 Updating flow type from ${flowType} to ${selectedFlowType}`
							);
							handleFlowTypeChange(selectedFlowType);
						} else {
							console.log(`${MODULE_TAG} 🎯 Flow type already matches, no update needed`);
						}

						// Add user feedback
						toastV8.success(
							`Applied recommendation: ${selectedFlowType} flow with ${selectedSpecVersion}`
						);
					}}
				/>
			)}

			{/* Security Scorecard - Visual compliance feedback */}
			{currentStep === 0 && (
				<SecurityScorecard
					key={`${effectiveFlowType}-${specVersion}`}
					flowType={effectiveFlowType}
					specVersion={specVersion}
					credentials={{
						usePKCE: credentials.usePKCE || false,
						enableRefreshToken: credentials.enableRefreshToken || false,
						scopes: credentials.scopes ? credentials.scopes.split(' ') : [],
					}}
					onTogglePKCE={handleTogglePKCE}
					onToggleRefreshToken={handleToggleRefreshToken}
					onToggleScopes={handleToggleScopes}
				/>
			)}

			{/* Advanced OAuth Features - PAR, JAR, MTLS support */}
			{currentStep === 0 && (
				<AdvancedOAuthFeatures
					flowType={effectiveFlowType}
					specVersion={specVersion}
					enabledFeatures={getAdvancedFeatures(effectiveFlowType)}
					onFeatureToggle={(featureId, enabled) => {
						console.log(`${MODULE_TAG} 🔧 Advanced feature toggled`, { featureId, enabled });

						// Save advanced feature preference to settings service
						if (enabled) {
							saveAdvancedFeatures(effectiveFlowType, [
								...getAdvancedFeatures(effectiveFlowType),
								featureId,
							]);
						} else {
							saveAdvancedFeatures(
								effectiveFlowType,
								getAdvancedFeatures(effectiveFlowType).filter((f: string) => f !== featureId)
							);
						}
					}}
				/>
			)}

			{/* Credentials Form - Collapsible */}
			<div
				style={{
					background: '#ffffff',
					borderRadius: '12px',
					border: '1px solid #e2e8f0',
					boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
					marginBottom: '32px',
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
						padding: '1.5rem 1.75rem',
						background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf3 100%)',
						border: '3px solid transparent',
						borderRadius: '1rem',
						cursor: 'pointer',
						fontSize: '1.2rem',
						fontWeight: '700',
						color: '#14532d',
						transition: 'all 0.3s ease',
						position: 'relative',
						boxShadow: '0 2px 8px rgba(34, 197, 94, 0.1)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.background = 'linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%)';
						e.currentTarget.style.borderColor = '#86efac';
						e.currentTarget.style.transform = 'translateY(-2px)';
						e.currentTarget.style.boxShadow = '0 8px 24px rgba(34, 197, 94, 0.2)';
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.background = 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf3 100%)';
						e.currentTarget.style.borderColor = 'transparent';
						e.currentTarget.style.transform = 'translateY(0)';
						e.currentTarget.style.boxShadow = '0 2px 8px rgba(34, 197, 94, 0.1)';
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
						<span style={{ fontSize: '20px' }}>🔧</span>
						<span style={{ fontSize: '1.2rem', fontWeight: '700' }}>
							Configuration & Credentials
						</span>
					</div>

					{/* Enhanced Toggle Icon */}
					<span
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							justifyContent: 'center',
							width: '48px',
							height: '48px',
							borderRadius: '12px',
							background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
							border: '3px solid #3b82f6',
							transform: isCredentialsCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
							transition: 'all 0.3s ease',
							color: '#3b82f6',
							boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)',
						}}
					>
						<FiChevronDown
							style={{
								width: '24px',
								height: '24px',
								strokeWidth: '3px',
								filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
							}}
						/>
					</span>
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

			{/* Unified Flow Steps - Always show navigation, but block content if compliance errors exist */}
			<UnifiedFlowSteps
				specVersion={specVersion}
				flowType={effectiveFlowType}
				credentials={credentials}
				onCredentialsChange={handleCredentialsChange}
				appConfig={appConfig ?? undefined}
				blockContent={complianceErrors.length > 0}
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

					// Use standardized credential reload service (now async)
					reloadCredentialsAfterReset(flowKey)
						.then((reloaded) => {
							console.log(`${MODULE_TAG} ✅ Credentials reloaded after reset`, {
								flowKey,
								hasRedirectUri: !!reloaded.redirectUri,
								redirectUri: reloaded.redirectUri,
								hasClientAuthMethod: !!reloaded.clientAuthMethod,
								clientAuthMethod: reloaded.clientAuthMethod,
							});
							setCredentials(reloaded);
						})
						.catch((error) => {
							console.error(`${MODULE_TAG} ❌ Error reloading credentials after reset`, {
								flowKey,
								error,
							});
							// Fall back to current credentials if reload fails
						});

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

			{/* Super Simple API Display - Toggleable, hidden by default - Only shows Unified flow calls */}
			<SuperSimpleApiDisplayV8 flowFilter="unified" />
		</MobileResponsiveWrapper>
	);
};

export default UnifiedOAuthFlowV8U;
