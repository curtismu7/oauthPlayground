/**
 * @file UnifiedOAuthFlowV8U.tsx
 * @module v8u/flows
 * @description Unified OAuth/OIDC Flow - Single UI for all flows using real PingOne APIs
 * @version 8.0.0
 * @since 2024-11-16
 *
 * This is the main unified flow page that adapts to:
 * - OAuth 2.0, OAuth 2.1, and OpenID Connect specifications
 * - All flow types (Authorization Code, Implicit, Client Credentials, etc.)
 * - Uses real PingOne APIs (no mocks)
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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
import { reloadCredentialsAfterReset } from '@/v8u/services/credentialReloadServiceV8U';
import CredentialsFormV8U from '../components/CredentialsFormV8U';
import { FlowTypeSelector } from '../components/FlowTypeSelector';
import { SpecVersionSelector } from '../components/SpecVersionSelector';
import { UnifiedFlowSteps } from '../components/UnifiedFlowSteps';
import {
	type UnifiedFlowCredentials,
	UnifiedFlowIntegrationV8U,
} from '../services/unifiedFlowIntegrationV8U';
import { FlowNotAvailableModal } from '../components/FlowNotAvailableModal';
import { FlowSettingsServiceV8U } from '../services/flowSettingsServiceV8U';

const MODULE_TAG = '[🎯 UNIFIED-OAUTH-FLOW-V8U]';

export const UnifiedOAuthFlowV8U: React.FC = () => {
	console.log(`${MODULE_TAG} Initializing unified flow`);

	const { flowType: urlFlowType, step: urlStep } = useParams<{
		flowType?: FlowType;
		step?: string;
	}>();
	const navigate = useNavigate();
	const location = useLocation();

	// Current step from URL - define early so it can be used in other hooks
	const currentStep = useMemo(() => {
		if (urlStep) {
			const stepNum = parseInt(urlStep, 10);
			if (!Number.isNaN(stepNum) && stepNum >= 0) {
				return stepNum;
			}
		}
		return 0;
	}, [urlStep]);

	// Flow type state - initialize from URL params if available
	const [flowType, setFlowType] = useState<FlowType>(() => {
		// Use URL param if valid, otherwise default
		if (
			urlFlowType &&
			['oauth-authz', 'implicit', 'client-credentials', 'device-code', 'ropc', 'hybrid'].includes(
				urlFlowType
			)
		) {
			return urlFlowType as FlowType;
		}
		return 'oauth-authz';
	});

	// Spec version state - initialize from flow-specific settings
	const [specVersion, setSpecVersion] = useState<SpecVersion>(() => {
		// Load spec version for the current flow type
		const savedSpecVersion = FlowSettingsServiceV8U.getSpecVersion(flowType);
		console.log(`${MODULE_TAG} Initializing spec version for flow`, {
			flowType,
			savedSpecVersion,
		});
		return savedSpecVersion;
	});

	// Sync flow type state with URL param changes
	useEffect(() => {
		console.log(`${MODULE_TAG} 🔍 URL sync check`, {
			urlFlowType,
			currentFlowType: flowType,
			needsSync: urlFlowType !== flowType,
			url: location.pathname,
		});
		
		if (
			urlFlowType &&
			['oauth-authz', 'implicit', 'client-credentials', 'device-code', 'ropc', 'hybrid'].includes(
				urlFlowType
			) &&
			urlFlowType !== flowType
		) {
			console.log(`${MODULE_TAG} 🔄 Syncing flow type from URL`, {
				from: flowType,
				to: urlFlowType,
				currentStep,
				url: location.pathname,
			});
			setFlowType(urlFlowType as FlowType);
		}
	}, [urlFlowType, flowType, currentStep, location.pathname]);

	// Load spec version when flow type changes and update last used timestamp
	useEffect(() => {
		const savedSpecVersion = FlowSettingsServiceV8U.getSpecVersion(flowType);
		if (savedSpecVersion !== specVersion) {
			console.log(`${MODULE_TAG} 🔄 Loading spec version for flow type`, {
				flowType,
				savedSpecVersion,
				currentSpecVersion: specVersion,
			});
			setSpecVersion(savedSpecVersion);
		}

		// Update last used timestamp for this flow type
		FlowSettingsServiceV8U.saveSettings(flowType, {
			specVersion: savedSpecVersion,
		});
		console.log(`${MODULE_TAG} ✅ Updated last used timestamp for flow`, { flowType });
	}, [flowType]); // Only depend on flowType, not specVersion to avoid loops

	// Credentials section collapsed state - collapsed by default after step 0
	const [isCredentialsCollapsed, setIsCredentialsCollapsed] = useState(() => {
		// Initialize based on current step: expanded on step 0, collapsed on other steps
		return currentStep > 0;
	});

	// Track previous step to detect step changes
	const prevStepRef = useRef(currentStep);

	// Flow not available modal state
	const [showFlowNotAvailableModal, setShowFlowNotAvailableModal] = useState(false);
	const [requestedFlow, setRequestedFlow] = useState<FlowType | null>(null);

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
			console.log(`${MODULE_TAG} Navigating to step`, { step, flowType: targetFlowType, path });
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
		const urlFlow =
			urlFlowType &&
			['oauth-authz', 'implicit', 'client-credentials', 'device-code', 'ropc', 'hybrid'].includes(
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
			// Priority: shared credentials > flow-specific > defaults
			// CRITICAL: Use explicit trimming and ensure we don't lose values (same logic as async loading)
			const initial: UnifiedFlowCredentials = {
				// Shared credentials (global across all flows) - with explicit trimming
				environmentId: (
					shared.environmentId?.trim() ||
					flowSpecific.environmentId?.trim() ||
					storedEnvId?.trim() ||
					''
				).trim(),
				clientId: (shared.clientId?.trim() || flowSpecific.clientId?.trim() || '').trim(),
				// Client secret: prefer shared, then flow-specific, but only if not empty
				...(shared.clientSecret?.trim()
					? { clientSecret: shared.clientSecret.trim() }
					: flowSpecific.clientSecret?.trim()
						? { clientSecret: flowSpecific.clientSecret.trim() }
						: {}),
				// Issuer URL
				...(shared.issuerUrl?.trim()
					? { issuerUrl: shared.issuerUrl.trim() }
					: flowSpecific.issuerUrl?.trim()
						? { issuerUrl: flowSpecific.issuerUrl.trim() }
						: {}),
				// Client auth method
				...(shared.clientAuthMethod
					? { clientAuthMethod: shared.clientAuthMethod }
					: flowSpecific.clientAuthMethod
						? { clientAuthMethod: flowSpecific.clientAuthMethod }
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
			};

			console.log(`${MODULE_TAG} ========== INITIAL CREDENTIAL LOADING (SYNC) ==========`);
			console.log(`${MODULE_TAG} Flow Key:`, initialFlowKey);
			console.log(`${MODULE_TAG} Shared Credentials:`, {
				environmentId: shared.environmentId || 'MISSING',
				clientId: shared.clientId || 'MISSING',
				hasClientSecret:
					shared.clientSecret !== undefined
						? shared.clientSecret
							? 'PRESENT'
							: 'EMPTY'
						: 'UNDEFINED',
			});
			console.log(`${MODULE_TAG} Flow-Specific Credentials:`, {
				environmentId: flowSpecific.environmentId || 'MISSING',
				clientId: flowSpecific.clientId || 'MISSING',
				hasClientSecret:
					flowSpecific.clientSecret !== undefined
						? flowSpecific.clientSecret
							? 'PRESENT'
							: 'EMPTY'
						: 'UNDEFINED',
			});
			console.log(`${MODULE_TAG} Initial Merged Credentials:`, {
				environmentId: initial.environmentId || 'MISSING',
				clientId: initial.clientId || 'MISSING',
				hasClientSecret:
					initial.clientSecret !== undefined
						? initial.clientSecret
							? 'PRESENT'
							: 'EMPTY'
						: 'UNDEFINED',
				scopes: initial.scopes || 'MISSING',
			});
			console.log(`${MODULE_TAG} ========== INITIAL CREDENTIAL LOADING END ==========`);

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
		return UnifiedFlowIntegrationV8U.getAvailableFlows(specVersion);
	}, [specVersion]);

	// Ensure selected flow is available for current spec
	const effectiveFlowType = useMemo(() => {
		const isAvailable = availableFlows.includes(flowType);
		console.log(`${MODULE_TAG} 🔍 Checking flow type availability`, {
			flowType,
			specVersion,
			availableFlows,
			isAvailable,
		});
		if (isAvailable) {
			return flowType;
		}
		const fallback = availableFlows[0] || 'oauth-authz';
		console.warn(`${MODULE_TAG} ⚠️ Flow type not available, using fallback`, {
			requested: flowType,
			fallback,
		});
		return fallback;
	}, [flowType, availableFlows, specVersion]);

	// Update flow type if current selection is not available - show modal to user
	useEffect(() => {
		if (effectiveFlowType !== flowType) {
			console.log(`${MODULE_TAG} ⚠️ Flow type not available for spec - showing modal`, {
				from: flowType,
				to: effectiveFlowType,
				specVersion,
				availableFlows,
			});
			// Store the requested flow and show modal
			setRequestedFlow(flowType);
			setShowFlowNotAvailableModal(true);
			// Don't auto-change - let user decide via modal
		}
	}, [effectiveFlowType, flowType, specVersion, availableFlows]);

	const _fieldVisibility = useMemo(() => {
		return UnifiedFlowIntegrationV8U.getFieldVisibility(specVersion, effectiveFlowType);
	}, [specVersion, effectiveFlowType]);

	const _checkboxAvailability = useMemo(() => {
		return UnifiedFlowIntegrationV8U.getCheckboxAvailability(specVersion, effectiveFlowType);
	}, [specVersion, effectiveFlowType]);

	const complianceErrors = useMemo(() => {
		return UnifiedFlowIntegrationV8U.getComplianceErrors(specVersion, effectiveFlowType);
	}, [specVersion, effectiveFlowType]);

	const complianceWarnings = useMemo(() => {
		return UnifiedFlowIntegrationV8U.getComplianceWarnings(specVersion, effectiveFlowType);
	}, [specVersion, effectiveFlowType]);

	// Flow key for CredentialsFormV8U - use V8U suffix for storage isolation
	const flowKey = useMemo(() => {
		return `${effectiveFlowType}-v8u`;
	}, [effectiveFlowType]);

	// Load credentials from storage on mount, when flow type changes, and on page visibility
	// IMPORTANT: Credentials are independent of worker token - they persist regardless of token status
	useEffect(() => {
		const loadCredentials = async () => {
			// Set loading flag to prevent save effect from running during load
			isLoadingCredentialsRef.current = true;
			
			try {
				console.log(`${MODULE_TAG} ========== CREDENTIAL LOADING DEBUG START ==========`);
				console.log(`${MODULE_TAG} Loading credentials from storage`, {
					flowKey,
					timestamp: new Date().toISOString(),
				});

				// DEBUG: Check localStorage directly
				const sharedStorageKey = 'v8_shared_credentials';
				const sharedStorageRaw = localStorage.getItem(sharedStorageKey);
				console.log(`${MODULE_TAG} [DEBUG] Direct localStorage check for shared credentials:`, {
					key: sharedStorageKey,
					hasValue: !!sharedStorageRaw,
					rawValue: sharedStorageRaw ? `${sharedStorageRaw.substring(0, 200)}...` : null,
				});

				// DEBUG: Check flow-specific storage (using the actual storage prefix from CredentialsServiceV8)
				const flowStorageKey = `v8_credentials_${flowKey}`;
				const flowStorageRaw = localStorage.getItem(flowStorageKey);
				console.log(
					`${MODULE_TAG} [DEBUG] Direct localStorage check for flow-specific credentials:`,
					{
						key: flowStorageKey,
						hasValue: !!flowStorageRaw,
						rawValue: flowStorageRaw ? `${flowStorageRaw.substring(0, 200)}...` : null,
					}
				);

				const config = CredentialsServiceV8.getFlowConfig(flowKey) || {
					flowKey,
					flowType: 'oauth' as const,
					includeClientSecret: true,
					includeScopes: true,
					includeRedirectUri: true,
					includeLogoutUri: false,
				};

				// Load flow-specific credentials (does not depend on worker token)
				const flowSpecific = CredentialsServiceV8.loadCredentials(flowKey, config);
				console.log(`${MODULE_TAG} [DEBUG] Flow-specific credentials loaded:`, {
					keys: Object.keys(flowSpecific),
					environmentId: flowSpecific.environmentId || 'MISSING',
					clientId: flowSpecific.clientId || 'MISSING',
					hasClientSecret:
						flowSpecific.clientSecret !== undefined
							? flowSpecific.clientSecret
								? 'PRESENT'
								: 'EMPTY'
							: 'UNDEFINED',
					clientSecretLength: flowSpecific.clientSecret?.length || 0,
					scopes: flowSpecific.scopes || 'MISSING',
					redirectUri: flowSpecific.redirectUri || 'MISSING',
				});

				// Load shared credentials (environmentId, clientId, clientSecret, etc.) - independent of worker token
				// Try sync first for immediate results, then async for disk fallback
				const sharedSync = SharedCredentialsServiceV8.loadSharedCredentialsSync();
				console.log(`${MODULE_TAG} [DEBUG] Shared credentials (sync) loaded:`, {
					keys: Object.keys(sharedSync),
					environmentId: sharedSync.environmentId || 'MISSING',
					clientId: sharedSync.clientId || 'MISSING',
					hasClientSecret:
						sharedSync.clientSecret !== undefined
							? sharedSync.clientSecret
								? 'PRESENT'
								: 'EMPTY'
							: 'UNDEFINED',
					clientSecretLength: sharedSync.clientSecret?.length || 0,
				});

				const shared: SharedCredentials =
					await SharedCredentialsServiceV8.loadSharedCredentials().catch((err) => {
						console.warn(
							`${MODULE_TAG} Error loading shared credentials async (using sync result)`,
							err
						);
						return sharedSync; // Use sync result as fallback
					});

				console.log(`${MODULE_TAG} [DEBUG] Shared credentials (async) loaded:`, {
					keys: Object.keys(shared),
					environmentId: shared.environmentId || 'MISSING',
					clientId: shared.clientId || 'MISSING',
					hasClientSecret:
						shared.clientSecret !== undefined
							? shared.clientSecret
								? 'PRESENT'
								: 'EMPTY'
							: 'UNDEFINED',
					clientSecretLength: shared.clientSecret?.length || 0,
				});

				// Get stored environment ID from global service
				const storedEnvId = EnvironmentIdServiceV8.getEnvironmentId();
				console.log(`${MODULE_TAG} [DEBUG] Global environment ID:`, {
					hasValue: !!storedEnvId,
					value: `${storedEnvId?.substring(0, 20)}...`,
				});

				// Merge credentials: shared (global) takes precedence for env/client, flow-specific for flow settings
				// Use explicit trimming and fallback logic
				const merged: UnifiedFlowCredentials = {
					// Shared credentials (global across all flows) - with explicit trimming
					environmentId: (
						shared.environmentId?.trim() ||
						flowSpecific.environmentId?.trim() ||
						storedEnvId?.trim() ||
						''
					).trim(),
					clientId: (shared.clientId?.trim() || flowSpecific.clientId?.trim() || '').trim(),
					// Client secret: prefer shared, then flow-specific, but only if not empty
					...(shared.clientSecret?.trim()
						? { clientSecret: shared.clientSecret.trim() }
						: flowSpecific.clientSecret?.trim()
							? { clientSecret: flowSpecific.clientSecret.trim() }
							: {}),
					// Issuer URL
					...(shared.issuerUrl?.trim()
						? { issuerUrl: shared.issuerUrl.trim() }
						: flowSpecific.issuerUrl?.trim()
							? { issuerUrl: flowSpecific.issuerUrl.trim() }
							: {}),
					// Client auth method
					...(shared.clientAuthMethod
						? { clientAuthMethod: shared.clientAuthMethod }
						: flowSpecific.clientAuthMethod
							? { clientAuthMethod: flowSpecific.clientAuthMethod }
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
				};

				console.log(`${MODULE_TAG} [DEBUG] Merged credentials:`, {
					environmentId: merged.environmentId?.trim() || 'MISSING',
					clientId: merged.clientId?.trim() || 'MISSING',
					hasClientSecret:
						merged.clientSecret !== undefined
							? merged.clientSecret?.trim()
								? 'PRESENT'
								: 'EMPTY'
							: 'UNDEFINED',
					clientSecretLength: merged.clientSecret?.length || 0,
					scopes: merged.scopes || 'MISSING',
					redirectUri: merged.redirectUri || 'MISSING',
					allKeys: Object.keys(merged),
				});

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

					console.log(`${MODULE_TAG} [DEBUG] Credential update decision:`, {
						hasStorageData,
						hasExistingData,
						credentialsChanged,
						storageEnvId: merged.environmentId?.trim() || 'EMPTY',
						storageClientId: merged.clientId?.trim() || 'EMPTY',
						storageClientSecret:
							merged.clientSecret !== undefined
								? merged.clientSecret?.trim()
									? 'PRESENT'
									: 'EMPTY'
								: 'UNDEFINED',
						currentEnvId: prev.environmentId?.trim() || 'EMPTY',
						currentClientId: prev.clientId?.trim() || 'EMPTY',
						currentClientSecret:
							prev.clientSecret !== undefined
								? prev.clientSecret?.trim()
									? 'PRESENT'
									: 'EMPTY'
								: 'UNDEFINED',
						willUpdate: hasStorageData && credentialsChanged,
						willPreserve: !hasStorageData && hasExistingData,
					});

					// CRITICAL DEBUG: Log the actual merged object to see all values
					console.log(
						`${MODULE_TAG} [DEBUG] FULL MERGED CREDENTIALS OBJECT:`,
						JSON.stringify(merged, null, 2)
					);

					// If credentials haven't changed, return previous to prevent unnecessary updates
					if (!credentialsChanged && hasExistingData) {
						console.log(`${MODULE_TAG} ✅ Credentials unchanged - skipping update`);
						return prev;
					}

					// If we have storage data, always use it (storage is source of truth)
					if (hasStorageData) {
						console.log(`${MODULE_TAG} ✅ Updating credentials from storage (storage has data)`, {
							storage: {
								hasEnvId: !!merged.environmentId?.trim(),
								hasClientId: !!merged.clientId?.trim(),
								hasClientSecret: merged.clientSecret !== undefined && !!merged.clientSecret?.trim(),
							},
							current: {
								hasEnvId: !!prev.environmentId?.trim(),
								hasClientId: !!prev.clientId?.trim(),
								hasClientSecret: prev.clientSecret !== undefined && !!prev.clientSecret?.trim(),
							},
							willUpdate: true,
						});
						return merged;
					} else if (hasExistingData) {
						// No storage data but we have existing - preserve it
						console.log(
							`${MODULE_TAG} ⚠️ No credentials in storage but preserving existing credentials`,
							{
								hasEnvId: !!prev.environmentId?.trim(),
								hasClientId: !!prev.clientId?.trim(),
								hasClientSecret: prev.clientSecret !== undefined && !!prev.clientSecret?.trim(),
							}
						);
						return prev; // Preserve existing credentials
					} else {
						// No data anywhere - use defaults (first time load)
						console.log(
							`${MODULE_TAG} ⚠️ No credentials found in storage or state - using defaults`
						);
						const storedEnvId = EnvironmentIdServiceV8.getEnvironmentId();
						return {
							environmentId: storedEnvId || '',
							clientId: '',
							scopes: 'openid',
						};
					}
				});

				console.log(`${MODULE_TAG} ========== CREDENTIAL LOADING DEBUG END ==========`);
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
		loadCredentials();

		// Reload credentials when page becomes visible (in case storage was cleared/updated in another tab)
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				console.log(`${MODULE_TAG} Page became visible - checking for credential updates`);
				loadCredentials();
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [flowKey]); // Reload when flow key changes

	// Track last saved credentials to prevent infinite save loops
	const lastSavedCredsRef = useRef<string>('');
	const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const isLoadingCredentialsRef = useRef<boolean>(false);

	// Save credentials when they change (debounced to prevent rapid saves)
	useEffect(() => {
		// Skip save if we're currently loading credentials (prevents loop)
		if (isLoadingCredentialsRef.current) {
			console.log(`${MODULE_TAG} Skipping save - credentials are being loaded`);
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
					console.log(`${MODULE_TAG} Skipping save - credentials are being loaded (async check)`);
					return;
				}

				if (credentials.environmentId || credentials.clientId || credentials.clientSecret) {
					// Serialize credentials to check if they actually changed
					const credsString = JSON.stringify(credentials);
					if (credsString === lastSavedCredsRef.current) {
						// No actual change, skip save to prevent loops
						console.log(`${MODULE_TAG} Skipping save - credentials unchanged`);
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
						console.log(`${MODULE_TAG} Saved shared credentials to storage`, {
							flowKey,
							hasEnvId: !!sharedCreds.environmentId,
							hasClientId: !!sharedCreds.clientId,
							hasClientSecret: sharedCreds.clientSecret !== undefined,
						});
					}

					console.log(`${MODULE_TAG} Saved credentials to storage`, {
						flowKey,
						hasSharedCreds: !!(
							sharedCreds.environmentId ||
							sharedCreds.clientId ||
							sharedCreds.clientSecret !== undefined
						),
					});
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

	const handleCredentialsChange = (updatedCredentials: unknown) => {
		setCredentials(updatedCredentials as UnifiedFlowCredentials);
	};

	const handleSpecVersionChange = (newSpec: SpecVersion) => {
		console.log(`${MODULE_TAG} Spec version changed`, { from: specVersion, to: newSpec });
		setSpecVersion(newSpec);

		// Save spec version for this flow type
		FlowSettingsServiceV8U.saveSpecVersion(flowType, newSpec);
		console.log(`${MODULE_TAG} ✅ Saved spec version for flow`, { flowType, specVersion: newSpec });

		// Validate flow type is still available
		const newAvailableFlows = UnifiedFlowIntegrationV8U.getAvailableFlows(newSpec);
		if (!newAvailableFlows.includes(flowType)) {
			const newFlowType = newAvailableFlows[0] || 'oauth-authz';
			console.log(`${MODULE_TAG} Flow type not available in new spec, switching`, {
				from: flowType,
				to: newFlowType,
			});
			setFlowType(newFlowType);
		}
	};

	const handleFlowTypeChange = (newFlowType: FlowType) => {
		console.log(`${MODULE_TAG} 🔄 Flow type changed via selector`, {
			specVersion,
			from: flowType,
			to: newFlowType,
			currentStep,
		});
		setFlowType(newFlowType);
		
		// Navigate to current step with new flow type to update URL
		if (currentStep !== undefined) {
			const path = `/v8u/unified/${newFlowType}/${currentStep}`;
			console.log(`${MODULE_TAG} Updating URL for new flow type`, { path });
			navigate(path, { replace: true });
		}
	};

	// Get API documentation URL for the current flow type
	const getApiDocsUrl = (flow: FlowType): string => {
		const baseUrl = 'https://apidocs.pingidentity.com/pingone/platform/v1/api/';

		switch (flow) {
			case 'oauth-authz':
				return `${baseUrl}#authorization-and-authentication-apis-authorize-authorization-code`;
			case 'implicit':
				return `${baseUrl}#authorization-and-authentication-apis-authorize-implicit`;
			case 'client-credentials':
				return `${baseUrl}#authorization-and-authentication-apis-token-client-credentials`;
			case 'device-code':
				return `${baseUrl}#authorization-and-authentication-apis-device-authorization-request`;
			case 'ropc':
				return `${baseUrl}#authorization-and-authentication-apis-token-resource-owner-password-credentials`;
			case 'hybrid':
				return `${baseUrl}#openid-connect`;
			default:
				return baseUrl;
		}
	};

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
					Single UI for all OAuth 2.0, OAuth 2.1, and OpenID Connect flows using real PingOne APIs
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
						<span>OAuth 2.1 Compliance Error</span>
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
											console.log(`${MODULE_TAG} Auto-enabled PKCE for ${appType} application type`);
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

			{/* Flow Not Available Modal */}
			{requestedFlow && (
				<FlowNotAvailableModal
					isOpen={showFlowNotAvailableModal}
					onClose={() => {
						setShowFlowNotAvailableModal(false);
						// Revert to previous flow type if user cancels
						// The effectiveFlowType will handle the fallback
					}}
					requestedFlow={requestedFlow}
					specVersion={specVersion}
					fallbackFlow={effectiveFlowType}
					onAccept={() => {
						// User accepted the fallback flow
						console.log(`${MODULE_TAG} User accepted fallback flow`, {
							from: requestedFlow,
							to: effectiveFlowType,
						});
						setFlowType(effectiveFlowType);
						setRequestedFlow(null);
					}}
					onChangeSpec={() => {
						// User wants to change spec version - focus on spec selector
						console.log(`${MODULE_TAG} User wants to change spec version`);
						setRequestedFlow(null);
						// Optionally scroll to spec selector or highlight it
					}}
				/>
			)}
		</div>
	);
};

export default UnifiedOAuthFlowV8U;
