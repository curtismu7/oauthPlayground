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
import { JWTConfigV8 } from '@/components/JWTConfigV8';
import { DraggableModal } from '@/components/DraggableModal';
import type { DiscoveredApp } from '@/v8/components/AppPickerV8';
import {
	OidcDiscoveryModalV8,
	type OidcDiscoveryResult,
} from '@/v8/components/OidcDiscoveryModalV8';
import { TooltipV8 } from '@/v8/components/TooltipV8';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';
import { ConfigCheckerServiceV8 } from '@/v8/services/configCheckerServiceV8';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
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
import { UnifiedFlowOptionsServiceV8 } from '@/v8/services/unifiedFlowOptionsServiceV8';
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
		loginHint?: string;
		clientAuthMethod?:
			| 'none'
			| 'client_secret_basic'
			| 'client_secret_post'
			| 'client_secret_jwt'
			| 'private_key_jwt';
		responseType?: string;
		issuerUrl?: string;
		prompt?: 'none' | 'login' | 'consent';
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
	const [isExpanded, setIsExpanded] = useState(true);
	const [showAdvancedSection, setShowAdvancedSection] = useState(true);
	const [showGeneralSection, setShowGeneralSection] = useState(true);
	const [discoveryInput, setDiscoveryInput] = useState('');
	const [isDiscovering, setIsDiscovering] = useState(false);
	const [usePKCE, setUsePKCE] = useState(() => {
		// Load from credentials if available
		return typeof credentials.usePKCE === 'boolean' ? credentials.usePKCE : false;
	});
	const [enableRefreshToken, setEnableRefreshToken] = useState(() => {
		// Load from credentials if available
		return typeof credentials.enableRefreshToken === 'boolean'
			? credentials.enableRefreshToken
			: false;
	});
	const [useRedirectless, setUseRedirectless] = useState(false);
	const [showClientSecret, setShowClientSecret] = useState(false);
	const [showRefreshTokenRules, setShowRefreshTokenRules] = useState(false);
	const [showPromptInfoModal, setShowPromptInfoModal] = useState(false);

	// ⚠️ CRITICAL ANTI-JITTER FLAG - DO NOT REMOVE OR MODIFY WITHOUT READING THIS:
	// This ref prevents UI jitter when toggling the "Enable Refresh Token" checkbox
	// The checkbox handler sets this to true, then resets it after 300ms
	// The sync effect (line ~220) checks this flag and skips if true
	// This breaks the infinite loop: checkbox -> save -> re-render -> sync -> save -> re-render...
	// If you modify this, test the refresh token checkbox thoroughly for jitter!
	const isUpdatingFromCheckbox = useRef(false);
	// Track previous scopes to detect if change came from checkbox or external source
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
		// Load from credentials if available, otherwise default to 'public'
		if (typeof credentials.clientType === 'string' && (credentials.clientType === 'public' || credentials.clientType === 'confidential')) {
			return credentials.clientType as ClientType;
		}
		return 'public';
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

	// Worker Token Modal
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	// App Discovery Modal
	const [showAppDiscoveryModal, setShowAppDiscoveryModal] = useState(false);
	const [hasDiscoveredApps, setHasDiscoveredApps] = useState(false);
	const [highlightEmptyFields, setHighlightEmptyFields] = useState(false);
	const [tokenStatus, setTokenStatus] = useState(() =>
		WorkerTokenStatusServiceV8.checkWorkerTokenStatus()
	);

	// JWT Configuration Modals
	const [showClientSecretJwtModal, setShowClientSecretJwtModal] = useState(false);
	const [showPrivateKeyJwtModal, setShowPrivateKeyJwtModal] = useState(false);
	const [allowedScopes, setAllowedScopes] = useState<string[]>([]);
	const [isLoadingScopes, setIsLoadingScopes] = useState(false);
	const [showResponseModeInfo, setShowResponseModeInfo] = useState(false);

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
		// Load usePKCE from credentials if available
		if (typeof credentials.usePKCE === 'boolean' && credentials.usePKCE !== usePKCE) {
			console.log(`${MODULE_TAG} Syncing usePKCE from credentials`, {
				usePKCE: credentials.usePKCE,
			});
			setUsePKCE(credentials.usePKCE);
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

		// Load clientType from credentials if available
		if (
			typeof credentials.clientType === 'string' &&
			(credentials.clientType === 'public' || credentials.clientType === 'confidential') &&
			credentials.clientType !== clientType
		) {
			console.log(`${MODULE_TAG} Syncing clientType from credentials`, {
				clientType: credentials.clientType,
			});
			setClientType(credentials.clientType as ClientType);
		}

		// Load appType from credentials if available
		if (typeof credentials.appType === 'string') {
			const validAppTypes: AppType[] = ['web', 'spa', 'mobile', 'desktop', 'cli', 'm2m', 'backend'];
			if (validAppTypes.includes(credentials.appType as AppType) && credentials.appType !== appType) {
				console.log(`${MODULE_TAG} Syncing appType from credentials`, {
					appType: credentials.appType,
				});
				setAppType(credentials.appType as AppType);
			}
		}
	}, [credentials.usePKCE, credentials.enableRefreshToken, credentials.clientType, credentials.appType, usePKCE, enableRefreshToken, clientType, appType]);

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

	// Initialize and update redirect URIs for the flow based on spec version and flow type
	// Use effectiveFlowKey which accounts for PKCE and spec version
	useEffect(() => {
		const redirectFlowKey = getRedirectFlowKey();

		// Get the correct redirect URI for this flow
		const correctRedirectUri = RedirectUriServiceV8.getRedirectUriForFlow(redirectFlowKey);
		const correctPostLogoutUri =
			RedirectUriServiceV8.getPostLogoutRedirectUriForFlow(redirectFlowKey);

		console.log(`${MODULE_TAG} Redirect URI check`, {
			redirectFlowKey,
			correctRedirectUri,
			currentRedirectUri: credentials.redirectUri,
			willAutoSet: !credentials.redirectUri && !!correctRedirectUri,
		});

		// Always update redirect URI to the correct one for this flow (not just when empty)
		// This ensures that when switching flows, the redirect URI is updated
		if (correctRedirectUri && credentials.redirectUri !== correctRedirectUri) {
			console.log(`${MODULE_TAG} Auto-updating redirect URI for flow (was incorrect)`, {
				redirectFlowKey,
				oldRedirectUri: credentials.redirectUri,
				newRedirectUri: correctRedirectUri,
			});
			onChange({ ...credentials, redirectUri: correctRedirectUri });
		}

		// Always update post-logout redirect URI to the correct one for this flow (not just when empty)
		if (correctPostLogoutUri && credentials.postLogoutRedirectUri !== correctPostLogoutUri) {
			console.log(`${MODULE_TAG} Auto-updating post-logout redirect URI for flow (was incorrect)`, {
				redirectFlowKey,
				oldPostLogoutUri: credentials.postLogoutRedirectUri,
				newPostLogoutUri: correctPostLogoutUri,
			});
			onChange({ ...credentials, postLogoutRedirectUri: correctPostLogoutUri });
		}
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
				const credsForSave = updated as unknown as Parameters<
					typeof CredentialsServiceV8.saveCredentials
				>[1];
				CredentialsServiceV8.saveCredentials(flowKey, credsForSave);

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
	const getFlowSpecificHelperText = useCallback((appType: AppType, flowType: FlowType): { title: string; description: string; alternatives?: string } => {
		const isRecommended = getRecommendedAppType(flowType) === appType;
		const recommendedAppType = getRecommendedAppType(flowType);

		// Base descriptions for each app type
		const baseDescriptions: Record<AppType, { icon: string; title: string; base: string }> = {
			web: { icon: '🌐', title: 'Web Application', base: 'Server-side web application running on a secure backend.' },
			spa: { icon: '⚛️', title: 'Single Page Application (SPA)', base: 'Browser-based JavaScript application (React, Angular, Vue).' },
			mobile: { icon: '📱', title: 'Mobile Application', base: 'iOS or Android application.' },
			desktop: { icon: '🖥️', title: 'Desktop Application', base: 'Native desktop application (Windows, macOS, Linux).' },
			cli: { icon: '⌨️', title: 'Command Line Interface (CLI)', base: 'Command-line tool or script.' },
			m2m: { icon: '🤖', title: 'Machine-to-Machine (M2M)', base: 'Service-to-service communication without user interaction.' },
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
				alternatives = 'Implicit flow is deprecated. Consider Authorization Code + PKCE for SPAs.';
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
	}, [getRecommendedAppType, getAppTypeLabel]);

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
		(field: string, value: string | boolean) => {
			console.log(`${MODULE_TAG} Credential changed`, { field, flowKey, value });
			// Handle boolean fields (usePKCE, enableRefreshToken)
			const updated =
				field === 'usePKCE' || field === 'enableRefreshToken'
					? { ...credentials, [field]: value === true || value === 'true' }
					: { ...credentials, [field]: value };

			// Save environment ID globally when changed
			if (field === 'environmentId' && typeof value === 'string' && value.trim()) {
				EnvironmentIdServiceV8.saveEnvironmentId(value);
			}

			// Save credentials directly to storage using V8U flowKey
			try {
				const credsForSave = updated as unknown as Parameters<
					typeof CredentialsServiceV8.saveCredentials
				>[1];
				CredentialsServiceV8.saveCredentials(flowKey, credsForSave);

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
		(app: DiscoveredApp) => {
			console.log(`${MODULE_TAG} App selected`, { appId: app.id, appName: app.name });
			setHasDiscoveredApps(true);
			setHighlightEmptyFields(true); // Enable highlighting for empty required fields
			console.log(`${MODULE_TAG} Highlighting enabled - checking Client Secret`, {
				hasClientSecret: !!credentials.clientSecret,
				requiresClientSecret: flowOptions.requiresClientSecret,
				willHighlight: !credentials.clientSecret && flowOptions.requiresClientSecret,
			});
			const updated = {
				...credentials,
				clientId: app.id,
				// Note: redirectUri is NOT applied - app dictates this (as user mentioned)
			};
			// Apply additional fields if available (from AppDiscoveryServiceV8.getAppConfig)
			if ('tokenEndpointAuthMethod' in app && app.tokenEndpointAuthMethod) {
				updated.clientAuthMethod = app.tokenEndpointAuthMethod as
					| 'none'
					| 'client_secret_basic'
					| 'client_secret_post'
					| 'client_secret_jwt'
					| 'private_key_jwt';
			}
			if ('scopes' in app && Array.isArray(app.scopes)) {
				updated.scopes = app.scopes.join(' ');
				// Note: We no longer auto-enable refresh token checkbox by default
				// User must explicitly enable it if they want refresh tokens
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
				const credsForSave = updated as unknown as Parameters<
					typeof CredentialsServiceV8.saveCredentials
				>[1];
				CredentialsServiceV8.saveCredentials(flowKey, credsForSave);

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
								{/* Client Type */}
								<div className="form-group">
									<label>
										Client Type
										<TooltipV8
											title={TooltipContentServiceV8.CLIENT_TYPE.title}
											content={TooltipContentServiceV8.CLIENT_TYPE.content}
										/>
									</label>
									<div
										style={{
											display: 'flex',
											flexDirection: 'column',
											gap: '10px',
											marginTop: '4px',
										}}
									>
										<label
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
												cursor: 'pointer',
												fontSize: '14px',
												fontWeight: 'normal',
											}}
										>
											<input
												type="radio"
												name="clientType"
												value="public"
												checked={clientType === 'public'}
												onChange={() => {
													setClientType('public');
													handleChange('clientType', 'public');
												}}
												style={{ margin: 0, cursor: 'pointer' }}
											/>
											<span>Public Client</span>
										</label>
										<label
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
												cursor: 'pointer',
												fontSize: '14px',
												fontWeight: 'normal',
											}}
										>
											<input
												type="radio"
												name="clientType"
												value="confidential"
												checked={clientType === 'confidential'}
												onChange={() => {
													setClientType('confidential');
													handleChange('clientType', 'confidential');
												}}
												style={{ margin: 0, cursor: 'pointer' }}
											/>
											<span>Confidential Client</span>
										</label>
									</div>
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
												background: getRecommendedAppType(effectiveFlowType) === appType ? '#f0fdf4' : '#fef3c7',
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
															style={{ fontSize: '12px', color: '#4b5563', lineHeight: '1.5', marginBottom: '6px' }}
															dangerouslySetInnerHTML={{ __html: helperText.description }}
														/>
														{helperText.alternatives && (
															<div style={{ fontSize: '11px', color: '#6b7280', lineHeight: '1.4', fontStyle: 'italic', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #e5e7eb' }}>
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
													: tokenStatus.status === 'expiring-soon'
														? '#fef3c7'
														: '#fee2e2',
											border: `1px solid ${WorkerTokenStatusServiceV8.getStatusColor(tokenStatus.status)}`,
											borderRadius: '6px',
											fontSize: '13px',
											color:
												tokenStatus.status === 'valid'
													? '#065f46'
													: tokenStatus.status === 'expiring-soon'
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
											onClick={() => setShowWorkerTokenModal(true)}
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
									/>
									<small>Public identifier for your application</small>
								</div>

								{/* Client Secret - Only if flow supports it */}
								{flowOptions.requiresClientSecret ||
								(!flowOptions.requiresClientSecret && config.includeClientSecret) ? (
									<div className="form-group">
										<label>
											Client Secret
											{flowOptions.requiresClientSecret && !credentials.usePKCE ? (
												<span className="required">*</span>
											) : (
												<span className="optional">
													(optional{credentials.usePKCE ? ' - not needed with PKCE' : ''})
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
												autoComplete="new-password"
												form="credentials-form-v8u"
												style={{
													paddingRight: '40px',
													...(highlightEmptyFields && !credentials.clientSecret
														? {
																border: '2px solid #ef4444',
																boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)',
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
										{highlightEmptyFields && !credentials.clientSecret && !credentials.usePKCE ? (
											<small style={{ color: '#ef4444', fontWeight: 600 }}>
												⚠️ Client Secret is{' '}
												{flowOptions.requiresClientSecret ? 'required' : 'recommended'} - please
												enter it to continue
											</small>
										) : credentials.usePKCE ? (
											<small style={{ color: '#10b981' }}>
												✓ PKCE enabled - client secret not required (public client flow)
											</small>
										) : (
											<small>Keep this secure - never expose in client-side code</small>
										)}
									</div>
								) : null}

								{/* PKCE Toggle - Only for Authorization Code and Hybrid Flows */}
								{(effectiveFlowType === 'oauth-authz' || effectiveFlowType === 'hybrid') && (
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
												checked={usePKCE}
												onChange={(e) => {
													const newValue = e.target.checked;
													setUsePKCE(newValue);

													// Save to credentials
													handleChange('usePKCE', newValue);

													if (newValue) {
														toastV8.info('PKCE enabled - using public client configuration');
													}
												}}
												style={{ cursor: 'pointer' }}
											/>
											<span style={{ fontWeight: '600', color: '#92400e' }}>
												🔐 Use PKCE (Proof Key for Code Exchange)
											</span>
										</label>
										<small style={{ display: 'block', marginTop: '6px', color: '#78350f' }}>
											{usePKCE
												? 'PKCE enabled - Client Secret not required (public client flow)'
												: 'Enable PKCE for enhanced security with public clients'}
										</small>
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
							<h3>🔍 OIDC Discovery (Optional)</h3>
						</div>
						<div className="section-content">
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
									<label>Token Endpoint Authentication Method</label>
									<select
										value={credentials.clientAuthMethod || defaultAuthMethod}
										onChange={(e) => handleChange('clientAuthMethod', e.target.value)}
										aria-label="Token Endpoint Authentication Method"
									>
										{allAuthMethodsWithStatus.map(({ method, label, enabled, disabledReason }) => (
											<option
												key={method}
												value={method}
												disabled={!enabled}
												style={{
													color: enabled ? 'inherit' : '#94a3b8',
													fontStyle: enabled ? 'normal' : 'italic',
												}}
												title={disabledReason}
											>
												{label}
												{!enabled && disabledReason ? ` - ${disabledReason}` : ''}
											</option>
										))}
									</select>
									<small>How the client authenticates with the token endpoint</small>

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
														HMAC-SHA256. More secure than sending the secret directly, as it's used
														only for signing.
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
									<label>Response Type</label>
									<select
										value={credentials.responseType || defaultResponseType}
										onChange={(e) => handleChange('responseType', e.target.value)}
										aria-label="Response Type"
									>
										{validResponseTypes.map((type) => (
											<option key={type} value={type}>
												{ResponseTypeServiceV8.getResponseTypeLabel(type)}
											</option>
										))}
									</select>
									<small>Response type for the authorization endpoint</small>
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

							{/* Redirectless Mode Checkbox */}
							{checkboxAvailability.showRedirectless && (
								<div
									className="form-group"
									style={{
										padding: '12px',
										background: '#dbeafe',
										borderRadius: '6px',
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
											checked={useRedirectless}
											onChange={(e) => {
												setUseRedirectless(e.target.checked);
												if (e.target.checked) {
													toastV8.info('Redirectless mode enabled - no redirect URI needed');
												}
											}}
											style={{ cursor: 'pointer' }}
										/>
										<span style={{ fontWeight: '600', color: '#0c4a6e' }}>
											🔌 Use Redirectless Mode
										</span>
									</label>
									<small style={{ display: 'block', marginTop: '6px', color: '#0c4a6e' }}>
										{useRedirectless
											? 'Redirectless mode enabled - flow does not require a redirect URI'
											: 'Enable for flows that do not use redirect URIs (e.g., Client Credentials, Device Code)'}
									</small>
								</div>
							)}

							{/* Response Mode Education (for flows with redirect URIs) */}
							{flowOptions.requiresRedirectUri && (
								<div
									style={{
										background: '#f0f9ff',
										border: '1px solid #bae6fd',
										borderRadius: '6px',
										padding: '12px',
										marginBottom: '16px',
									}}
								>
									<button
										type="button"
										onClick={() => setShowResponseModeInfo(!showResponseModeInfo)}
										style={{
											background: 'none',
											border: 'none',
											padding: 0,
											width: '100%',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'space-between',
											cursor: 'pointer',
											color: '#0c4a6e',
											fontWeight: '600',
											fontSize: '14px',
										}}
									>
										<span>📚 How does PingOne return the response?</span>
										{showResponseModeInfo ? <FiChevronUp /> : <FiChevronDown />}
									</button>

									{showResponseModeInfo && (
										<div style={{ marginTop: '12px', fontSize: '13px', color: '#0c4a6e' }}>
											<p style={{ margin: '0 0 12px 0', lineHeight: '1.6' }}>
												OAuth uses the <strong>response_mode</strong> parameter to control how PingOne
												returns authorization data to your application:
											</p>

											<div style={{ marginBottom: '12px' }}>
												<div
													style={{
														background: '#ffffff',
														border: '1px solid #bae6fd',
														borderRadius: '4px',
														padding: '10px',
														marginBottom: '8px',
													}}
												>
													<div style={{ fontWeight: '600', marginBottom: '4px' }}>
														🔗 query (Query String)
													</div>
													<div style={{ fontSize: '12px', color: '#475569', marginBottom: '6px' }}>
														Response parameters in URL query string
													</div>
													<code
														style={{
															display: 'block',
															background: '#f8fafc',
															padding: '6px 8px',
															borderRadius: '3px',
															fontSize: '11px',
															marginBottom: '6px',
															wordBreak: 'break-all',
														}}
													>
														https://app.com/callback?code=abc123&state=xyz
													</code>
													<div style={{ fontSize: '12px', color: '#64748b' }}>
														✅ Used by: <strong>Authorization Code Flow</strong> (default)
													</div>
												</div>

												<div
													style={{
														background: '#ffffff',
														border: '1px solid #bae6fd',
														borderRadius: '4px',
														padding: '10px',
														marginBottom: '8px',
													}}
												>
													<div style={{ fontWeight: '600', marginBottom: '4px' }}>
														# fragment (URL Fragment)
													</div>
													<div style={{ fontSize: '12px', color: '#475569', marginBottom: '6px' }}>
														Response parameters in URL fragment (after #)
													</div>
													<code
														style={{
															display: 'block',
															background: '#f8fafc',
															padding: '6px 8px',
															borderRadius: '3px',
															fontSize: '11px',
															marginBottom: '6px',
															wordBreak: 'break-all',
														}}
													>
														https://app.com/callback#access_token=xyz&token_type=Bearer
													</code>
													<div style={{ fontSize: '12px', color: '#64748b' }}>
														✅ Used by: <strong>Implicit Flow</strong> (required),{' '}
														<strong>Hybrid Flow</strong> (default)
														<br />
														🔒 More secure - fragment never sent to server
													</div>
												</div>

												<div
													style={{
														background: '#ffffff',
														border: '1px solid #bae6fd',
														borderRadius: '4px',
														padding: '10px',
													}}
												>
													<div style={{ fontWeight: '600', marginBottom: '4px' }}>
														📮 form_post (HTTP POST)
													</div>
													<div style={{ fontSize: '12px', color: '#475569', marginBottom: '6px' }}>
														Response parameters sent via HTTP POST to redirect URI
													</div>
													<code
														style={{
															display: 'block',
															background: '#f8fafc',
															padding: '6px 8px',
															borderRadius: '3px',
															fontSize: '11px',
															marginBottom: '6px',
														}}
													>
														POST /callback HTTP/1.1{'\n'}code=abc123&state=xyz
													</code>
													<div style={{ fontSize: '12px', color: '#64748b' }}>
														⚙️ Advanced option - requires server-side handling
														<br />
														🔒 Most secure - no data in URL at all
													</div>
												</div>
											</div>

											<div
												style={{
													background: '#dbeafe',
													padding: '8px 10px',
													borderRadius: '4px',
													fontSize: '12px',
													color: '#1e40af',
												}}
											>
												<strong>💡 This flow uses:</strong>{' '}
												{effectiveFlowType === 'implicit'
													? 'fragment (required for security)'
													: effectiveFlowType === 'hybrid'
														? 'fragment (default for hybrid)'
														: 'query (default for authorization code)'}
											</div>
										</div>
									)}
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
									<label>
										Scopes <span className="required">*</span>
										<TooltipV8
											title={TooltipContentServiceV8.SCOPES.title}
											content={TooltipContentServiceV8.SCOPES.content}
										/>
									</label>
									<input
										type="text"
										placeholder={providedFlowType === 'client-credentials' ? 'p1:read:users' : 'openid'}
										value={credentials.scopes || (providedFlowType === 'client-credentials' ? '' : 'openid')}
										onChange={(e) => {
											let newValue = e.target.value || (providedFlowType === 'client-credentials' ? '' : 'openid');
											
											// For client credentials flow, validate and fix scopes
											if (providedFlowType === 'client-credentials' && newValue) {
												const scopesArray = newValue.split(/\s+/).filter(s => s.trim());
												
												// Remove OIDC scopes that are invalid for client credentials (but allow 'openid' if user wants it)
												const invalidOidcScopes = ['offline_access', 'profile', 'email', 'address', 'phone'];
												const filteredScopes = scopesArray.filter(s => !invalidOidcScopes.includes(s.toLowerCase()));
												
												// Fix common singular/plural mistakes
												const fixedScopes = filteredScopes.map(scope => {
													// Fix singular to plural
													if (scope === 'p1:read:user') return 'p1:read:users';
													if (scope === 'p1:update:user') return 'p1:update:users';
													if (scope === 'p1:create:user') return 'p1:create:users';
													if (scope === 'p1:delete:user') return 'p1:delete:users';
													if (scope === 'p1:read:environment') return 'p1:read:environments';
													if (scope === 'p1:update:environment') return 'p1:update:environments';
													if (scope === 'p1:read:application') return 'p1:read:applications';
													if (scope === 'p1:create:application') return 'p1:create:applications';
													if (scope === 'p1:update:application') return 'p1:update:applications';
													if (scope === 'p1:delete:application') return 'p1:delete:applications';
													if (scope === 'p1:read:population') return 'p1:read:populations';
													if (scope === 'p1:update:population') return 'p1:update:populations';
													if (scope === 'p1:read:group') return 'p1:read:groups';
													if (scope === 'p1:update:group') return 'p1:update:groups';
													if (scope === 'p1:read:role') return 'p1:read:roles';
													if (scope === 'p1:update:role') return 'p1:update:roles';
													return scope;
												});
												
												newValue = fixedScopes.join(' ');
												
												// Log if we made corrections
												if (filteredScopes.length < scopesArray.length || fixedScopes.some((s, i) => s !== filteredScopes[i])) {
													console.log(`${MODULE_TAG} Auto-corrected scopes for client credentials flow`, {
														original: e.target.value,
														corrected: newValue,
													});
												}
											}
											
											handleChange('scopes', newValue);
										}}
										aria-label="Scopes"
									/>
									<small>
										{providedFlowType === 'client-credentials'
											? 'Management API scopes (e.g., p1:read:users, p1:read:environments) - must be enabled in PingOne app Resources tab. Note: Use plural forms (users, environments, applications, etc.)'
											: providedFlowType === 'device-code'
											? 'OIDC scopes for user authentication (e.g., openid profile email offline_access) - Device Flow is for user authorization, not machine-to-machine'
											: 'Space-separated permissions (must be enabled in PingOne app)'}
									</small>
									{/* Show warning if invalid scopes detected for device code flow */}
									{providedFlowType === 'device-code' && credentials.scopes && (() => {
										const scopesArray = credentials.scopes.split(/\s+/).filter(s => s.trim());
										const managementApiScopes = scopesArray.filter(s => 
											s.toLowerCase().startsWith('p1:read:') || 
											s.toLowerCase().startsWith('p1:update:') ||
											s.toLowerCase().startsWith('p1:create:') ||
											s.toLowerCase().startsWith('p1:delete:')
										);
										const hasOpenId = scopesArray.some(s => s.toLowerCase() === 'openid');
										
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
													<div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
														<span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
														<div>
															<strong style={{ color: '#92400e' }}>Scope Guidance for Device Authorization Flow:</strong>
															{managementApiScopes.length > 0 && (
																<p style={{ margin: '4px 0 0 0', color: '#78350f' }}>
																	• <strong>{managementApiScopes.join(', ')}</strong> are Management API scopes for machine-to-machine authentication (Client Credentials flow). Device Authorization Flow is for user authentication. Use OIDC scopes instead (e.g., openid profile email offline_access).
																</p>
															)}
															{!hasOpenId && (
																<p style={{ margin: '4px 0 0 0', color: '#78350f' }}>
																	• <strong>'openid' scope is missing.</strong> Device Authorization Flow is typically used for user authentication with OIDC. Without 'openid', you won't receive an ID token. Consider adding 'openid' to your scopes.
																</p>
															)}
															<div style={{ margin: '12px 0 0 0', padding: '10px', background: '#f0f9ff', border: '1px solid #0ea5e9', borderRadius: '4px' }}>
																<strong style={{ color: '#0c4a6e', fontSize: '12px', display: 'block', marginBottom: '6px' }}>📚 About OpenID Connect Scopes:</strong>
																<p style={{ margin: '4px 0', fontSize: '12px', color: '#075985', lineHeight: '1.5' }}>
																	Standard OpenID Connect scopes control which user claims are included in an <strong>id_token</strong> or in a <strong>/userinfo</strong> response. You must include <strong>openid</strong> in your requested scopes if you want to use the access token to call the <strong>/userinfo</strong> endpoint and get a <strong>sub</strong> attribute in the response.
																</p>
																<p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#075985', lineHeight: '1.5' }}>
																	You can include additional OpenID Connect scopes (e.g., <strong>profile</strong>, <strong>email</strong>, <strong>offline_access</strong>) in the scope parameter to add more user claims in the id_token and return more information about the user in the /userinfo response.
																</p>
															</div>
															<p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#92400e' }}>
																💡 <strong>Recommended scopes:</strong> openid profile email offline_access
															</p>
														</div>
													</div>
												</div>
											);
										}
										return null;
									})()}
									{/* Show warning if no scopes provided for device code */}
									{providedFlowType === 'device-code' && (!credentials.scopes || !credentials.scopes.trim()) && (
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
														For Device Authorization Flow with user authentication, consider using: <strong>openid profile email offline_access</strong>
													</p>
													<p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#1e40af' }}>
														These scopes allow the device to authenticate users and access their profile information.
													</p>
												</div>
											</div>
										</div>
									)}
									{/* Show warning if invalid scopes detected for client credentials */}
									{providedFlowType === 'client-credentials' && credentials.scopes && (() => {
										const scopesArray = credentials.scopes.split(/\s+/).filter(s => s.trim());
										const invalidOidcScopes = scopesArray.filter(s => 
											['offline_access', 'profile', 'email', 'address', 'phone'].includes(s.toLowerCase())
										);
										const singularScopes = scopesArray.filter(s => 
											s.match(/^p1:(read|update|create|delete):(user|environment|application|population|group|role)$/)
										);
										
										if (invalidOidcScopes.length > 0 || singularScopes.length > 0) {
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
													<div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
														<span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
														<div>
															<strong style={{ color: '#92400e' }}>Scope Issues Detected:</strong>
															{invalidOidcScopes.length > 0 && (
																<p style={{ margin: '4px 0 0 0', color: '#78350f' }}>
																	• <strong>{invalidOidcScopes.join(', ')}</strong> are user authentication scopes and may not work with client credentials flow. They have been automatically removed.
																</p>
															)}
															{singularScopes.length > 0 && (
																<p style={{ margin: '4px 0 0 0', color: '#78350f' }}>
																	• <strong>{singularScopes.join(', ')}</strong> should use plural forms: {singularScopes.map(s => {
																		const plural = s.replace(/:user$/, ':users')
																			.replace(/:environment$/, ':environments')
																			.replace(/:application$/, ':applications')
																			.replace(/:population$/, ':populations')
																			.replace(/:group$/, ':groups')
																			.replace(/:role$/, ':roles');
																		return plural;
																	}).join(', ')}. They have been automatically corrected.
																</p>
															)}
															<p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#92400e' }}>
																Client credentials flow typically uses Management API scopes (plural forms). See{' '}
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
											
											const scopesToShow = allowedScopes.length > 0 && !allowedScopes.some(s => s.startsWith('p1:'))
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
													<div style={{ width: '100%', marginBottom: '4px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
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
																style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
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
																		border: isSelected ? '2px solid #3b82f6' : '1px solid #d1d5db',
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
										// For client credentials flow, show Management API scopes
										if (providedFlowType === 'client-credentials') {
											// Most commonly used Management API scopes (from PingOne documentation)
											// Note: 'openid' is included as an option per user request
											const managementApiScopes = [
												'openid',
												'p1:read:users',
												'p1:update:users',
												'p1:create:users',
												'p1:delete:users',
												'p1:read:environments',
												'p1:update:environments',
												'p1:read:applications',
												'p1:create:applications',
												'p1:update:applications',
												'p1:delete:applications',
												'p1:read:populations',
												'p1:update:populations',
												'p1:read:groups',
												'p1:update:groups',
												'p1:read:roles',
												'p1:update:roles',
												'p1:read:audit',
												'p1:read:authenticators',
												'p1:update:authenticators',
											];
											const scopesToShow = allowedScopes.length > 0 && allowedScopes.some(s => s.startsWith('p1:'))
												? allowedScopes.filter(s => s.startsWith('p1:'))
												: managementApiScopes;
											
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
																	'openid': 'OpenID Connect scope. When used with client credentials flow, enables ID token issuance. Note: Typically used for user authentication flows, but can be included in client credentials if your PingOne application supports it.',
																	'p1:read:users': 'Read user information from the directory. The user schema attributes that can be read for this scope. The value is an array of schema attribute paths (such as username, name.given, shirtSize) that the scope controls. This property is supported for p1:read:users, p1:update:users and custom scopes like p1:read:user:{suffix} and p1:update:user:{suffix}. Any attributes not listed in the attribute array are excluded from the read action. The wildcard path (*) in the array includes all attributes and cannot be used in conjunction with any other user schema attribute paths.',
																	'p1:update:users': 'Update user attributes in the directory. Allows modifying user information such as profile data, email, phone, etc.',
																	'p1:create:users': 'Create new users in the directory. Required for user provisioning and onboarding workflows.',
																	'p1:delete:users': 'Delete users from the directory. Use with caution as this is a destructive operation.',
																	'p1:read:environments': 'Read environment-level information and configuration from the PingOne Management API. Includes environment metadata, settings, and configuration.',
																	'p1:update:environments': 'Modify environment configuration. Allows updating environment settings, policies, and other configuration.',
																	'p1:read:applications': 'Read application configurations. Required to view OAuth/OIDC application settings, redirect URIs, and other app details.',
																	'p1:create:applications': 'Create new applications. Required for programmatic application provisioning.',
																	'p1:update:applications': 'Update application settings. Allows modifying OAuth/OIDC app configuration, redirect URIs, scopes, etc.',
																	'p1:delete:applications': 'Delete applications. Use with caution as this permanently removes the application.',
																	'p1:read:populations': 'Read population definitions. Populations are collections of users with shared attributes or characteristics.',
																	'p1:update:populations': 'Modify population definitions. Allows creating, updating, or deleting user populations.',
																	'p1:read:groups': 'Read group information. Groups are collections of users used for access control and permissions.',
																	'p1:update:groups': 'Modify groups. Allows creating, updating, or deleting groups and managing group membership.',
																	'p1:read:roles': 'Read role assignments. Roles define collections of permissions for administrators or applications.',
																	'p1:update:roles': 'Modify role assignments. Allows assigning or removing roles from users or applications.',
																	'p1:read:audit': 'Read audit events. Required to access audit logs and security event history.',
																	'p1:read:authenticators': 'Read MFA authenticators and devices. Allows viewing registered MFA devices for users.',
																	'p1:update:authenticators': 'Modify or delete authenticators. Allows managing MFA devices, including registration and deletion.',
																};
																
																const description = scopeDescriptions[scope];
																if (!description) return null;
																
																return (
																	<div>
																		<strong>{scope}</strong>
																		<p style={{ margin: '8px 0 0 0' }}>{description}</p>
																		<p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
																			Reference: <a href="https://apidocs.pingidentity.com/pingone/main/v1/api/#access-services-through-scopes-and-roles" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>PingOne API Documentation</a>
																		</p>
																	</div>
																);
															};
															
															return (
																<div
																	key={scope}
																	style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
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
																			border: isSelected ? '2px solid #3b82f6' : '1px solid #d1d5db',
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
														const currentScopes = (credentials.scopes || 'openid')
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
																			Rule: If you don't request the right scope, you won't get the
																			token.
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
																			Rule: If you don't request the right scope, you won't get the
																			token.
																		</p>
																	</div>
																);
															}
															return null;
														};

														return (
															<div
																key={scope}
																style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
															>
																<button
																	type="button"
																	onClick={() => {
																		const scopesArray = (credentials.scopes || 'openid')
																			.split(/\s+/)
																			.filter((s) => s.trim());
																		let updatedScopes: string[];

																		if (isSelected) {
																			// Remove scope (but keep at least 'openid')
																			updatedScopes = scopesArray.filter((s) => s !== scope);
																			if (
																				updatedScopes.length === 0 ||
																				(updatedScopes.length === 1 &&
																					updatedScopes[0] === 'openid' &&
																					scope === 'openid')
																			) {
																				updatedScopes = ['openid'];
																			}
																		} else {
																			// Add scope
																			updatedScopes = [...scopesArray, scope];
																			// Ensure 'openid' is always present
																			if (!updatedScopes.includes('openid')) {
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
														const scopesArray = currentScopes.split(/\s+/).filter((s) => s.trim());
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
														const credsForSave = updatedCredentials as unknown as Parameters<
															typeof CredentialsServiceV8.saveCredentials
														>[1];
														CredentialsServiceV8.saveCredentials(flowKey, credsForSave);

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
										<small style={{ display: 'block', marginTop: '6px', color: '#0c4a6e' }}>
											{enableRefreshToken
												? 'Refresh tokens enabled - offline_access scope will be included in the request'
												: 'Enable to include offline_access scope and request refresh tokens'}
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
									<strong>Advanced Options:</strong> Configure additional OAuth/OIDC parameters for
									your flow
								</div>

								{/* PKCE Enforcement Info - Only show for flows that can use PKCE */}
								{(effectiveFlowType === 'oauth-authz' || effectiveFlowType === 'hybrid') && (
									<div className="form-group">
										<label>PKCE Enforcement</label>
										<div
											style={{
												padding: '8px 12px',
												background: '#f0f9ff',
												borderRadius: '4px',
												border: '1px solid #bfdbfe',
											}}
										>
											<strong>
												{FlowOptionsServiceV8.getPKCELabel(flowOptions.pkceEnforcement)}
											</strong>
											<small style={{ display: 'block', marginTop: '4px', color: '#0c4a6e' }}>
												{flowOptions.pkceEnforcement === 'REQUIRED' &&
													'PKCE is required for this flow'}
												{flowOptions.pkceEnforcement === 'OPTIONAL' &&
													'PKCE is optional but recommended'}
												{flowOptions.pkceEnforcement === 'NOT_REQUIRED' &&
													'PKCE is not used for this flow'}
											</small>
										</div>
									</div>
								)}

								{/* Issuer URL */}
								<div className="form-group">
									<label>
										Issuer URL <span className="optional">(optional)</span>
									</label>
									<input
										type="text"
										placeholder="https://auth.example.com"
										value={credentials.issuerUrl || ''}
										onChange={(e) => handleChange('issuerUrl', e.target.value)}
										aria-label="Issuer URL"
									/>
									<small>OIDC provider issuer URL</small>
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
								{flowOptions.supportsLoginHint && showLoginHint && (
									<div className="form-group">
										<label>
											Login Hint <span className="optional">(optional)</span>
										</label>
										<input
											type="text"
											placeholder="user@example.com"
											value={credentials.loginHint || ''}
											onChange={(e) => handleChange('loginHint', e.target.value)}
											aria-label="Login Hint"
										/>
										<small>Pre-fill login with user identifier</small>
									</div>
								)}

								{/* Prompt Parameter */}
								<div className="form-group">
									<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
										<label style={{ marginBottom: 0 }}>
											Prompt <span className="optional">(optional)</span>
										</label>
										<button
											type="button"
											onClick={() => setShowPromptInfoModal(true)}
											style={{
												border: 'none',
												background: 'none',
												cursor: 'pointer',
												color: '#3b82f6',
												padding: 0,
												display: 'flex',
												alignItems: 'center',
											}}
											title="Learn about prompt values"
										>
											<FiInfo />
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
									<small>
										Contextualizes the re-authentication and consent experience
									</small>
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

				<WorkerTokenModalV8
					isOpen={showWorkerTokenModal}
					onClose={() => setShowWorkerTokenModal(false)}
					onTokenGenerated={() => {
						// Force immediate refresh token status with a small delay to ensure storage is written
						setTimeout(() => {
							const newStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
							console.log(`${MODULE_TAG} Token generated, updating status`, newStatus);
							setTokenStatus(newStatus);
						}, 50);
						// Dispatch event for other components (they will also check status)
						window.dispatchEvent(new Event('workerTokenUpdated'));
						toastV8.success('Worker token generated and saved!');
					}}
					environmentId={credentials.environmentId}
				/>

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
							The <code>prompt</code> parameter specifies whether the Authorization Server prompts the End-User for reauthentication and consent.
						</p>

						<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
							<div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
								<strong style={{ color: '#1f2937' }}>none</strong>
								<p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
									The Authorization Server MUST NOT display any authentication or consent user interface pages. An error is returned if the End-User is not already authenticated.
								</p>
							</div>

							<div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
								<strong style={{ color: '#1f2937' }}>login</strong>
								<p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
									The Authorization Server SHOULD prompt the End-User for reauthentication. If successful, the End-User is logged in.
								</p>
							</div>

							<div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
								<strong style={{ color: '#1f2937' }}>consent</strong>
								<p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
									The Authorization Server SHOULD prompt the End-User for consent before returning information to the Client.
								</p>
							</div>

							<div style={{ background: '#fee2e2', padding: '12px', borderRadius: '8px', border: '1px solid #ef4444' }}>
								<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
									<strong style={{ color: '#991b1b' }}>select_account</strong>
									<span style={{ fontSize: '12px', background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>Not Supported by PingOne</span>
								</div>
								<p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#7f1d1d' }}>
									PingOne does not currently support the <code>select_account</code> value. Attempting to use it may result in an error or it being ignored.
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

				{/* Client Secret JWT Configuration Modal */}
				<DraggableModal
					isOpen={showClientSecretJwtModal}
					onClose={() => setShowClientSecretJwtModal(false)}
					title="Client Secret JWT Configuration"
					width="900px"
					maxHeight="90vh"
				>
					<div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
								directly in the request body or header, as the secret is used only for signing, not
								transmission.
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

						<div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
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
									Each token request generates a JWT signed with HMAC-SHA256 using the client secret
								</li>
								<li>
									The JWT assertion is sent in the request body as <code>client_assertion</code>
								</li>
								<li>
									The authorization server validates the JWT signature using the same client secret
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
					<div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
								leaves your application and only the public key is registered with the authorization
								server.
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
							<div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#92400e' }}>
								<strong>Important:</strong> After entering your private key in the generator above, make sure to save it in your credentials. The private key is used to sign JWT assertions for each token request.
							</div>
						</div>

						<div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
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
								<li>Register the corresponding public key with PingOne (via JWKS endpoint or manual upload)</li>
								<li>
									Each token request generates a JWT signed with RS256 using your private key
								</li>
								<li>
									The JWT assertion is sent in the request body as <code>client_assertion</code>
								</li>
								<li>
									The authorization server validates the JWT signature using the registered public key
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
							<strong>Security Advantage:</strong> Private Key JWT is the most secure authentication
							method because it uses asymmetric cryptography. The private key never leaves your
							application, and even if intercepted, the JWT cannot be forged without the private key.
						</div>
					</div>
				</DraggableModal>
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
