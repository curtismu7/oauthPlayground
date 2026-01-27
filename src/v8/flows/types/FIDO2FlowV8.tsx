/**
 * @file FIDO2FlowV8.tsx
 * @module v8/flows/types
 * @description FIDO2-specific MFA flow component (Refactored with Controller Pattern)
 * @version 8.2.0
 */

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FiShield } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { FIDO2Service } from '@/services/fido2Service';
import { FIDODeviceExistsModalV8 } from '@/v8/components/FIDODeviceExistsModalV8';
import { MFAInfoButtonV8 } from '@/v8/components/MFAInfoButtonV8';
import { MFANavigationV8 } from '@/v8/components/MFANavigationV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { CollapsibleSectionV8 } from '@/v8/components/shared/CollapsibleSectionV8';
import {
	ErrorMessage,
	InfoMessage,
	MessageBoxV8,
	SuccessMessage,
	WarningMessage,
} from '@/v8/components/shared/MessageBoxV8';
import { WorkerTokenStatusDisplayV8 } from '@/v8/components/WorkerTokenStatusDisplayV8';
import { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import { apiDisplayServiceV8 } from '@/v8/services/apiDisplayServiceV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import {
	type DeviceAuthenticationResponse,
	MfaAuthenticationServiceV8,
} from '@/v8/services/mfaAuthenticationServiceV8';
import { MFAConfigurationServiceV8 } from '@/v8/services/mfaConfigurationServiceV8';
import { ValidationServiceV8 } from '@/v8/services/validationServiceV8';
import { WebAuthnAuthenticationServiceV8 } from '@/v8/services/webAuthnAuthenticationServiceV8';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { useMFALoadingStateManager } from '@/v8/utils/loadingStateManagerV8';
import { navigateToMfaHubWithCleanup } from '@/v8/utils/mfaFlowCleanupV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { UnifiedFlowErrorHandler } from '@/v8u/services/unifiedFlowErrorHandlerV8U';
import { UnifiedFlowLoggerService } from '@/v8u/services/unifiedFlowLoggerServiceV8U';
import { MFADeviceSelector } from '../components/MFADeviceSelector';
import { FIDO2FlowController } from '../controllers/FIDO2FlowController';
import { MFAFlowControllerFactory } from '../factories/MFAFlowControllerFactory';
import { type MFAFlowBaseRenderProps, MFAFlowBaseV8 } from '../shared/MFAFlowBaseV8';
import type { DeviceType, MFACredentials } from '../shared/MFATypes';
import { buildSuccessPageData, MFASuccessPageV8 } from '../shared/mfaSuccessPageServiceV8';

const MODULE_TAG = '[🔑 FIDO2-FLOW-V8]';

const PUBLIC_KEY_OPTION_KEYS = [
	'publicKeyCredentialRequestOptions',
	'publicKeyCredentialOptions',
	'publicKeyOptions',
	'webauthnGetOptions',
	'assertionOptions',
];

const normalizeBase64 = (value: string): string => {
	const sanitized = value.replace(/\s+/g, '').replace(/_/g, '/').replace(/-/g, '+');
	const padding = sanitized.length % 4 === 0 ? 0 : 4 - (sanitized.length % 4);
	return sanitized + '='.repeat(padding);
};

const decodeBase64ToUint8Array = (value: string): Uint8Array => {
	const normalized = normalizeBase64(value);
	if (typeof window !== 'undefined' && typeof window.atob === 'function') {
		const binary = window.atob(normalized);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i += 1) {
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes;
	}

	// biome-ignore lint/suspicious/noExplicitAny: Buffer type from globalThis is not available in all environments
	const bufferCtor = (globalThis as { Buffer?: any }).Buffer;
	if (bufferCtor) {
		const buffer = bufferCtor.from(normalized, 'base64');
		return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
	}

	throw new Error('Base64 decoding is not supported in this environment');
};

const toUint8Array = (value: unknown): Uint8Array | null => {
	if (!value) {
		return null;
	}

	if (value instanceof Uint8Array) {
		return value;
	}

	if (value instanceof ArrayBuffer) {
		return new Uint8Array(value);
	}

	if (ArrayBuffer.isView(value)) {
		return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
	}

	if (Array.isArray(value)) {
		return new Uint8Array(value as number[]);
	}

	if (typeof value === 'string') {
		try {
			return decodeBase64ToUint8Array(value);
		} catch (error) {
			console.warn(`${MODULE_TAG} Failed to decode base64 string`, error);
			return null;
		}
	}

	if (typeof value === 'object') {
		const bufferLike = value as { data?: number[] };
		if (Array.isArray(bufferLike.data)) {
			return new Uint8Array(bufferLike.data);
		}
	}

	return null;
};

const findNestedValue = (source: unknown, keys: string[]): unknown => {
	if (!source || typeof source !== 'object') {
		return undefined;
	}

	const visited = new Set<unknown>();
	const queue: Array<{ value: unknown; depth: number }> = [{ value: source, depth: 0 }];
	const MAX_DEPTH = 5;

	while (queue.length > 0) {
		const { value, depth } = queue.shift() as { value: unknown; depth: number };
		if (!value || typeof value !== 'object' || visited.has(value)) {
			continue;
		}
		visited.add(value);

		for (const key of keys) {
			if (Object.hasOwn(value, key)) {
				const result = (value as Record<string, unknown>)[key];
				if (result !== undefined) {
					return result;
				}
			}
		}

		if (depth >= MAX_DEPTH) {
			continue;
		}

		if (Array.isArray(value)) {
			value.forEach((child) => queue.push({ value: child, depth: depth + 1 }));
		} else {
			Object.values(value).forEach((child) => queue.push({ value: child, depth: depth + 1 }));
		}
	}

	return undefined;
};

const parseRawPublicKeyOptions = (raw: unknown): Record<string, unknown> | null => {
	if (typeof raw === 'string') {
		const trimmed = raw.trim();
		if (!trimmed) {
			return null;
		}

		const attempts = [trimmed];
		try {
			attempts.push(decodeURIComponent(trimmed));
		} catch {
			// ignore decodeURIComponent failures
		}

		for (const attempt of attempts) {
			try {
				return JSON.parse(attempt);
			} catch {
				// ignore
			}
		}

		try {
			const decoded = decodeBase64ToUint8Array(trimmed);
			const decodedString =
				typeof TextDecoder !== 'undefined'
					? new TextDecoder().decode(decoded)
					: Array.from(decoded)
							.map((code) => String.fromCharCode(code))
							.join('');
			return JSON.parse(decodedString);
		} catch (error) {
			console.warn(`${MODULE_TAG} Unable to parse publicKeyCredentialRequestOptions string`, error);
			return null;
		}
	}

	if (Array.isArray(raw)) {
		const candidate = raw.find((entry) => entry && typeof entry === 'object');
		return candidate && typeof candidate === 'object'
			? (candidate as Record<string, unknown>)
			: null;
	}

	if (raw && typeof raw === 'object') {
		return raw as Record<string, unknown>;
	}

	return null;
};

const normalizePublicKeyOptions = (
	rawOptions: Record<string, unknown>
): PublicKeyCredentialRequestOptions | null => {
	const challengeCandidate =
		rawOptions.challenge ?? rawOptions.rawChallenge ?? rawOptions.challengeData;
	const challengeBytes = toUint8Array(challengeCandidate);

	if (!challengeBytes || !challengeBytes.byteLength) {
		return null;
	}

	const allowCredentials = Array.isArray(rawOptions.allowCredentials)
		? (rawOptions.allowCredentials
				.map((entry) => {
					if (!entry || typeof entry !== 'object') {
						return null;
					}

					const descriptor = entry as Record<string, unknown>;
					const idBytes = toUint8Array(descriptor.id ?? descriptor.credentialId);
					if (!idBytes) {
						return null;
					}

					const transports = Array.isArray(descriptor.transports)
						? (descriptor.transports.filter(
								(transport): transport is AuthenticatorTransport => typeof transport === 'string'
							) as AuthenticatorTransport[])
						: undefined;

					return {
						type: (descriptor.type as PublicKeyCredentialType) || 'public-key',
						id: idBytes,
						transports,
					};
				})
				.filter((entry): entry is PublicKeyCredentialDescriptor =>
					Boolean(entry)
				) as PublicKeyCredentialDescriptor[])
		: undefined;

	const rpId =
		(typeof rawOptions.rpId === 'string' && rawOptions.rpId.trim()) ||
		(typeof (rawOptions.rp as { id?: string } | undefined)?.id === 'string' &&
			(rawOptions.rp as { id?: string }).id?.trim()) ||
		(typeof window !== 'undefined' ? window.location.hostname : undefined);

	const timeout =
		typeof rawOptions.timeout === 'number'
			? rawOptions.timeout
			: Number.isFinite(Number(rawOptions.timeout))
				? Number(rawOptions.timeout)
				: undefined;

	const userVerification =
		typeof rawOptions.userVerification === 'string'
			? (rawOptions.userVerification as UserVerificationRequirement)
			: undefined;

	return {
		challenge: challengeBytes,
		timeout,
		rpId,
		allowCredentials,
		userVerification,
		extensions: rawOptions.extensions as AuthenticationExtensionsClientInputs | undefined,
	};
};

const _extractFido2AssertionOptions = (
	response: DeviceAuthenticationResponse
): PublicKeyCredentialRequestOptions | null => {
	const rawOptions = findNestedValue(response, PUBLIC_KEY_OPTION_KEYS);
	if (!rawOptions) {
		return null;
	}

	const parsed = parseRawPublicKeyOptions(rawOptions);
	if (!parsed) {
		return null;
	}

	const normalized = normalizePublicKeyOptions(parsed);
	return normalized;
};

// Device selection state management wrapper
const FIDO2FlowV8WithDeviceSelection: React.FC = () => {
	const location = useLocation();

	// Initialize loading state manager
	const loadingManager = useMFALoadingStateManager();

	// Extended location state type to include policy IDs and FIDO2 config from configuration page
	const locationState = location.state as {
		deviceType?: string;
		fido2PolicyId?: string;
		deviceAuthPolicyId?: string;
		configured?: boolean;
		fido2Config?: {
			preferredAuthenticatorType: 'platform' | 'cross-platform' | 'both';
			userVerification: 'discouraged' | 'preferred' | 'required';
			discoverableCredentials: 'discouraged' | 'preferred' | 'required';
			relyingPartyId: string;
			relyingPartyIdType: 'pingone' | 'custom' | 'other';
			fidoDeviceAggregation: boolean;
			publicKeyCredentialHints: Array<'security-key' | 'client-device' | 'hybrid'>;
			backupEligibility: 'allow' | 'disallow';
			enforceBackupEligibilityDuringAuth: boolean;
			attestationRequest: 'none' | 'direct' | 'enterprise';
			includeEnvironmentName: boolean;
			includeOrganizationName: boolean;
		};
	} | null;

	const isConfigured = locationState?.configured === true;

	// Get deviceType from location.state (passed from previous page) or from stored credentials
	// Priority: location.state (what was selected) > stored credentials > 'FIDO2' as last resort only
	const storedCredentials = CredentialsServiceV8.loadCredentials('mfa-flow-v8', {
		flowKey: 'mfa-flow-v8',
		flowType: 'oidc',
		includeClientSecret: false,
		includeRedirectUri: false,
		includeLogoutUri: false,
		includeScopes: false,
	});

	// Use what was selected on previous page (location.state), fallback to stored, then default
	const deviceType = (locationState?.deviceType ||
		storedCredentials.deviceType ||
		'FIDO2') as DeviceType;

	// Merge policies from location.state into stored credentials
	// This ensures the selected FIDO2 policy and Device Auth policy from the config page are used
	// Use ref to track if we've already merged to avoid duplicate saves
	const policiesMergedRef = useRef(false);
	useEffect(() => {
		if (!locationState || policiesMergedRef.current) return;

		const stored = CredentialsServiceV8.loadCredentials('mfa-flow-v8', {
			flowKey: 'mfa-flow-v8',
			flowType: 'oidc',
			includeClientSecret: false,
			includeRedirectUri: false,
			includeLogoutUri: false,
			includeScopes: false,
		});

		const updates: Partial<MFACredentials> = {};
		let needsUpdate = false;

		// Merge deviceAuthPolicyId from location.state if provided and not already set
		if (locationState.deviceAuthPolicyId && !stored.deviceAuthenticationPolicyId) {
			updates.deviceAuthenticationPolicyId = locationState.deviceAuthPolicyId;
			needsUpdate = true;
		}

		// Merge fido2PolicyId from location.state if provided and not already set
		if (
			locationState.fido2PolicyId &&
			!(stored as MFACredentials & { fido2PolicyId?: string }).fido2PolicyId
		) {
			(updates as MFACredentials & { fido2PolicyId?: string }).fido2PolicyId =
				locationState.fido2PolicyId;
			needsUpdate = true;
		}

		// Save updated credentials if any changes were made
		if (needsUpdate) {
			const updated = { ...stored, ...updates } as MFACredentials;
			CredentialsServiceV8.saveCredentials('mfa-flow-v8', updated);
			policiesMergedRef.current = true;
			console.log(`${MODULE_TAG} Merged policies from location.state into credentials:`, {
				deviceAuthPolicyId: updates.deviceAuthenticationPolicyId,
				fido2PolicyId: (updates as MFACredentials & { fido2PolicyId?: string }).fido2PolicyId,
			});
		} else {
			policiesMergedRef.current = true; // Mark as processed even if no update needed
		}
	}, [locationState]);

	// Ref to track if we've already skipped step 0 and store nav callback
	const hasSkippedStep0Ref = useRef(false);
	const skipStep0NavRef = useRef<((step: number) => void) | null>(null);

	// Initialize controller using factory with dynamic device type
	const controller = useMemo(
		() =>
			MFAFlowControllerFactory.create({
				deviceType: deviceType as DeviceType,
			}) as FIDO2FlowController,
		[deviceType]
	);

	// Handle skip step 0 navigation in useEffect to avoid render-phase updates
	useLayoutEffect(() => {
		if (isConfigured && skipStep0NavRef.current && !hasSkippedStep0Ref.current) {
			hasSkippedStep0Ref.current = true;
			skipStep0NavRef.current(1);
		}
	}, [isConfigured]);

	// Device selection state
	const [deviceSelection, setDeviceSelection] = useState({
		existingDevices: [] as Array<Record<string, unknown>>,
		loadingDevices: false,
		selectedExistingDevice: '',
		showRegisterForm: false,
	});

	// FIDO2-specific state
	const [credentialId, setCredentialId] = useState<string>('');
	const [isRegistering, setIsRegistering] = useState(false);

	// FIDO2 Policy state
	const [fido2Policies, setFido2Policies] = useState<
		Array<{ id: string; name: string; default?: boolean; description?: string }>
	>([]);
	const [isLoadingFido2Policies, setIsLoadingFido2Policies] = useState(false);
	const [fido2PoliciesError, setFido2PoliciesError] = useState<string | null>(null);
	const lastFetchedFido2EnvIdRef = useRef<string | null>(null);
	const isFetchingFido2PoliciesRef = useRef(false);

	// Worker Token Settings - Load from config service
	const [silentApiRetrieval, setSilentApiRetrieval] = useState(() => {
		try {
			return MFAConfigurationServiceV8.loadConfiguration().workerToken.silentApiRetrieval || false;
		} catch {
			return false;
		}
	});
	const [showTokenAtEnd, setShowTokenAtEnd] = useState(() => {
		try {
			return MFAConfigurationServiceV8.loadConfiguration().workerToken.showTokenAtEnd || true;
		} catch {
			return true;
		}
	});

	// Listen for config updates
	useEffect(() => {
		const handleConfigUpdate = (event: CustomEvent) => {
			if (event.detail?.workerToken) {
				setSilentApiRetrieval(event.detail.workerToken.silentApiRetrieval || false);
				setShowTokenAtEnd(event.detail.workerToken.showTokenAtEnd !== false);
			}
		};
		window.addEventListener('mfaConfigurationUpdated', handleConfigUpdate as EventListener);
		return () => {
			window.removeEventListener('mfaConfigurationUpdated', handleConfigUpdate as EventListener);
		};
	}, []);

	// Ref to track if deviceType has been synced (to avoid infinite loops)
	const deviceTypeSyncedRef = React.useRef(false);

	// Store setCredentials and credentials in refs for useEffect to use (to avoid setState during render)
	const setCredentialsRef = React.useRef<
		((credentials: MFACredentials | ((prev: MFACredentials) => MFACredentials)) => void) | null
	>(null);
	const credentialsRef = React.useRef<MFACredentials | null>(null);

	// Store nav in ref for modal handlers
	const navRef = React.useRef<ReturnType<typeof useStepNavigationV8> | null>(null);

	// Sync deviceType and set default device name in useEffect to avoid setState during render
	// This runs after render and updates credentials if deviceType doesn't match
	// We use refs to track the last checked values to avoid infinite loops
	const lastCheckedDeviceTypeRef = React.useRef<string | null>(null);
	const deviceNameSyncedRef = React.useRef(false);
	useEffect(() => {
		// Use setTimeout to ensure this runs after render is complete
		const timeoutId = setTimeout(() => {
			// Only sync if deviceType changed or if we haven't synced yet
			if (setCredentialsRef.current && credentialsRef.current) {
				const currentCredentials = credentialsRef.current;
				const targetDeviceType = deviceType;
				let needsUpdate = false;
				const updates: Partial<MFACredentials> = {};

				// Check if deviceType needs to be synced
				if (
					currentCredentials.deviceType !== targetDeviceType &&
					(lastCheckedDeviceTypeRef.current !== targetDeviceType || !deviceTypeSyncedRef.current)
				) {
					deviceTypeSyncedRef.current = true;
					lastCheckedDeviceTypeRef.current = targetDeviceType;
					updates.deviceType = targetDeviceType as DeviceType;
					needsUpdate = true;
				} else if (currentCredentials.deviceType === targetDeviceType) {
					// If they match, mark as synced
					deviceTypeSyncedRef.current = true;
					lastCheckedDeviceTypeRef.current = targetDeviceType;
				}

				// Set default device name if not already set (only once)
				if (!deviceNameSyncedRef.current && !currentCredentials.deviceName?.trim()) {
					deviceNameSyncedRef.current = true;
					updates.deviceName = currentCredentials.deviceType || targetDeviceType;
					needsUpdate = true;
				}

				// Apply updates if any
				if (needsUpdate) {
					setCredentialsRef.current((prev) => ({
						...prev,
						...updates,
					}));
				}
			}
		}, 0);

		return () => clearTimeout(timeoutId);
	}, [deviceType]);

	// State to trigger device loading - updated from render function
	const [deviceLoadTrigger, setDeviceLoadTrigger] = useState<{
		currentStep: number;
		environmentId: string;
		username: string;
		tokenValid: boolean;
	} | null>(null);

	// Hooks for Step 2 (WebAuthn assertion) - moved to component level
	const navigate = useNavigate();
	const [isAuthenticating, setIsAuthenticating] = useState(false);
	const [assertionError, setAssertionError] = useState<string | null>(null);

	// Hooks for Step 0 - moved to component level
	const [webAuthnSupported, setWebAuthnSupported] = useState(false);
	const [webAuthnCapabilities, setWebAuthnCapabilities] = useState<ReturnType<
		typeof FIDO2Service.getCapabilities
	> | null>(null);

	// Modal state for existing FIDO device
	const [showFIDODeviceExistsModal, setShowFIDODeviceExistsModal] = useState(false);
	const [existingFIDODevice, setExistingFIDODevice] = useState<{
		id: string;
		nickname?: string;
	} | null>(null);

	// Initialize WebAuthn support check
	useEffect(() => {
		const initializeWebAuthn = async () => {
			const supported = FIDO2Service.isWebAuthnSupported();
			setWebAuthnSupported(supported);

			if (supported) {
				// Get basic capabilities first
				const capabilities = FIDO2Service.getCapabilities();

				// Check platform authenticator availability asynchronously
				try {
					const platformAvailable = await FIDO2Service.isPlatformAuthenticatorAvailable();
					setWebAuthnCapabilities({
						...capabilities,
						platformAuthenticator: platformAvailable,
					});
				} catch (error) {
					console.warn('Failed to check platform authenticator availability:', error);
					setWebAuthnCapabilities(capabilities);
				}
			}
		};

		initializeWebAuthn();
	}, []);

	// Load FIDO2 policies
	const fetchFido2Policies = useCallback(async () => {
		const storedCredentials = CredentialsServiceV8.loadCredentials('mfa-flow-v8', {
			flowKey: 'mfa-flow-v8',
			flowType: 'oidc',
			includeClientSecret: false,
			includeRedirectUri: false,
			includeLogoutUri: false,
			includeScopes: false,
		});
		const envId = storedCredentials.environmentId?.trim();
		const tokenValid = WorkerTokenStatusServiceV8.checkWorkerTokenStatus().isValid;
		// #region agent log - Use safe analytics fetch
		(async () => {
			try {
				const { log } = await import('@/v8/utils/analyticsHelperV8');
				await log(
					'FIDO2FlowV8.tsx:569',
					'fetchFido2Policies entry',
					{ envId, hasToken: tokenValid },
					'debug-session',
					'run1',
					'A'
				);
			} catch {
				// Silently ignore - analytics server not available
			}
		})();
		// #endregion

		if (!envId || !tokenValid) {
			// #region agent log
			// #endregion
			setFido2Policies([]);
			setFido2PoliciesError(null);
			lastFetchedFido2EnvIdRef.current = null;
			return;
		}

		// Prevent duplicate calls
		if (isFetchingFido2PoliciesRef.current || lastFetchedFido2EnvIdRef.current === envId) {
			// #region agent log
			// #endregion
			return;
		}

		isFetchingFido2PoliciesRef.current = true;
		setIsLoadingFido2Policies(true);
		setFido2PoliciesError(null);

		try {
			const workerToken = await workerTokenServiceV8.getToken();
			// #region agent log
			// #endregion
			if (!workerToken) {
				throw new Error('Worker token not found');
			}

			const credentialsData = await workerTokenServiceV8.loadCredentials();
			const region = credentialsData?.region || 'na';

			const params = new URLSearchParams({
				environmentId: envId,
				workerToken: workerToken.trim(),
				region,
			});
			const apiUrl = `/api/pingone/mfa/fido2-policies?${params.toString()}`;
			// #region agent log
			// #endregion

			const response = await fetch(apiUrl, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			});

			// #region agent log
			// #endregion

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
				// #region agent log
				// #endregion
				throw new Error(
					errorData.message ||
						errorData.error ||
						`Failed to load FIDO2 policies: ${response.status}`
				);
			}

			const data = await response.json();
			// #region agent log
			// #endregion
			const policiesList = data._embedded?.fido2Policies || [];
			// #region agent log
			// #endregion
			lastFetchedFido2EnvIdRef.current = envId;
			setFido2Policies(policiesList);

			// Auto-select default policy if no policy is set
			if (policiesList.length > 0) {
				const stored = CredentialsServiceV8.loadCredentials('mfa-flow-v8', {
					flowKey: 'mfa-flow-v8',
					flowType: 'oidc',
					includeClientSecret: false,
					includeRedirectUri: false,
					includeLogoutUri: false,
					includeScopes: false,
				});
				const currentPolicyId = (stored as MFACredentials & { fido2PolicyId?: string })
					.fido2PolicyId;

				if (!currentPolicyId) {
					const defaultPolicy =
						policiesList.find((p: { default?: boolean }) => p.default) || policiesList[0];
					if (defaultPolicy.id) {
						const updated = { ...stored, fido2PolicyId: defaultPolicy.id } as MFACredentials;
						CredentialsServiceV8.saveCredentials('mfa-flow-v8', updated);
					}
				}
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to load FIDO2 policies';
			setFido2PoliciesError(errorMessage);
			console.error(`${MODULE_TAG} Failed to load FIDO2 policies:`, error);
		} finally {
			isFetchingFido2PoliciesRef.current = false;
			setIsLoadingFido2Policies(false);
		}
	}, []);

	// Fetch FIDO2 policies when environment and token are ready
	useEffect(() => {
		const storedCredentials = CredentialsServiceV8.loadCredentials('mfa-flow-v8', {
			flowKey: 'mfa-flow-v8',
			flowType: 'oidc',
			includeClientSecret: false,
			includeRedirectUri: false,
			includeLogoutUri: false,
			includeScopes: false,
		});
		const envId = storedCredentials.environmentId?.trim();
		const tokenValid = WorkerTokenStatusServiceV8.checkWorkerTokenStatus().isValid;

		if (envId && tokenValid) {
			void fetchFido2Policies();
		}
	}, [fetchFido2Policies]);

	// Also fetch when token status changes
	useEffect(() => {
		const checkTokenAndFetch = () => {
			const storedCredentials = CredentialsServiceV8.loadCredentials('mfa-flow-v8', {
				flowKey: 'mfa-flow-v8',
				flowType: 'oidc',
				includeClientSecret: false,
				includeRedirectUri: false,
				includeLogoutUri: false,
				includeScopes: false,
			});
			const envId = storedCredentials.environmentId?.trim();
			const tokenValid = WorkerTokenStatusServiceV8.checkWorkerTokenStatus().isValid;

			if (envId && tokenValid && lastFetchedFido2EnvIdRef.current !== envId) {
				void fetchFido2Policies();
			}
		};

		const interval = setInterval(checkTokenAndFetch, 5000);
		window.addEventListener('workerTokenUpdated', checkTokenAndFetch);

		return () => {
			clearInterval(interval);
			window.removeEventListener('workerTokenUpdated', checkTokenAndFetch);
		};
	}, [fetchFido2Policies]);

	// Step 0: Configure Credentials (FIDO2-specific - no phone/email needed)
	// NO HOOKS INSIDE - all hooks moved to component level
	const renderStep0 = useMemo(() => {
		return (props: MFAFlowBaseRenderProps) => {
			const {
				credentials,
				setCredentials,
				tokenStatus,
				deviceAuthPolicies,
				isLoadingPolicies,
				policiesError,
				refreshDeviceAuthPolicies,
				nav,
			} = props;

			// Store nav callback in ref for useEffect to use
			if (isConfigured && nav.currentStep === 0) {
				skipStep0NavRef.current = nav.goToStep;
				return null;
			}

			// Use config-selected Device Auth policy as default (from credentials or location.state)
			// Priority: credentials.deviceAuthenticationPolicyId > location.state.deviceAuthPolicyId > empty
			// This ensures the policy selected on the config page is shown as the default in Step 0
			const effectivePolicyId =
				credentials.deviceAuthenticationPolicyId || locationState?.deviceAuthPolicyId || '';

			return (
				<div className="step-content">
					<h2>
						Configure MFA Settings
						<MFAInfoButtonV8 contentKey="device.enrollment" displayMode="modal" />
					</h2>
					<p>Enter your PingOne environment details and user information</p>

					{/* WebAuthn Support Check - using component-level state */}
					{!webAuthnSupported && (
						<div
							className="info-box"
							style={{
								background: '#fef2f2',
								border: '1px solid #fecaca',
								color: '#991b1b',
								marginBottom: '20px',
							}}
						>
							<h4 style={{ margin: '0 0 8px 0', fontSize: '15px' }}>⚠️ WebAuthn Not Supported</h4>
							<p style={{ margin: '0', fontSize: '14px' }}>
								Your browser does not support WebAuthn. Please use a modern browser (Chrome,
								Firefox, Safari, Edge) to register FIDO2 devices.
							</p>
						</div>
					)}

					{webAuthnCapabilities && (
						<div className="info-box" style={{ marginBottom: '20px' }}>
							<h4 style={{ margin: '0 0 8px 0', fontSize: '15px' }}>🔐 WebAuthn Capabilities</h4>
							<ul style={{ margin: '0', paddingLeft: '20px' }}>
								<li>WebAuthn Supported: ✅</li>
								{webAuthnCapabilities.platformAuthenticator && (
									<li>Platform Authenticator (Touch ID, Face ID, Windows Hello): ✅</li>
								)}
								{webAuthnCapabilities.crossPlatformAuthenticator && (
									<li>Cross-Platform Authenticator (YubiKey, etc.): ✅</li>
								)}
								{webAuthnCapabilities.userVerification && <li>User Verification: ✅</li>}
							</ul>
						</div>
					)}

					{/* Worker Token Status */}
					<div style={{ marginBottom: '20px' }}>
						<div
							style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}
						>
							{/* New Worker Token Status Display */}
							<WorkerTokenStatusDisplayV8 mode="compact" showRefresh={true} />

							<button
								type="button"
								onClick={async () => {
									if (tokenStatus.isValid) {
										// #region agent log
										// #endregion
										const { workerTokenServiceV8 } = await import(
											'@/v8/services/workerTokenServiceV8'
										);
										await workerTokenServiceV8.clearToken();
										// #region agent log
										// #endregion
										window.dispatchEvent(new Event('workerTokenUpdated'));
										const newStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
										// #region agent log
										// #endregion
										toastV8.success('Worker token removed');
									} else {
										// Use helper to check silentApiRetrieval before showing modal
										// Pass current checkbox values to override config (page checkboxes take precedence)
										// forceShowModal=true because user explicitly clicked the button - always show modal
										const { handleShowWorkerTokenModal } = await import(
											'@/v8/utils/workerTokenModalHelperV8'
										);
										await handleShowWorkerTokenModal(
											props.setShowWorkerTokenModal,
											undefined,
											silentApiRetrieval, // Page checkbox value takes precedence
											showTokenAtEnd, // Page checkbox value takes precedence
											true // Force show modal - user clicked button
										);
									}
								}}
								className="token-button"
								style={{
									padding: '10px 16px',
									background: tokenStatus.isValid ? '#10b981' : '#6366f1',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									fontSize: '14px',
									fontWeight: '600',
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
									boxShadow: tokenStatus.isValid
										? '0 2px 4px rgba(16, 185, 129, 0.2)'
										: '0 2px 4px rgba(59, 130, 246, 0.2)',
									transition: 'all 0.2s ease',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.transform = 'translateY(-1px)';
									e.currentTarget.style.boxShadow = tokenStatus.isValid
										? '0 4px 8px rgba(16, 185, 129, 0.3)'
										: '0 4px 8px rgba(59, 130, 246, 0.3)';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.transform = 'translateY(0)';
									e.currentTarget.style.boxShadow = tokenStatus.isValid
										? '0 2px 4px rgba(16, 185, 129, 0.2)'
										: '0 2px 4px rgba(59, 130, 246, 0.2)';
								}}
							>
								<span>🔑</span>
								<span>Get Worker Token</span>
							</button>

							<button
								type="button"
								onClick={() => {
									// Navigate to MFA config page with return path in state
									navigate('/v8/mfa-config', {
										state: {
											returnPath: location.pathname,
											returnState: location.state,
										},
									});
								}}
								className="token-button"
								style={{
									padding: '10px 16px',
									background:
										!tokenStatus.isValid || !credentials.environmentId ? '#e5e7eb' : '#6366f1',
									color: !tokenStatus.isValid || !credentials.environmentId ? '#9ca3af' : 'white',
									border: 'none',
									borderRadius: '6px',
									fontSize: '14px',
									fontWeight: '600',
									cursor:
										!tokenStatus.isValid || !credentials.environmentId ? 'not-allowed' : 'pointer',
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
								}}
								disabled={!credentials.environmentId || !tokenStatus.isValid}
							>
								<span>⚙️</span>
								<span>MFA Settings</span>
							</button>

							<div
								style={{
									flex: 1,
									padding: '10px 12px',
									background: tokenStatus.isValid
										? tokenStatus.status === 'expiring-soon'
											? '#fef3c7'
											: '#d1fae5'
										: '#fee2e2',
									border: `1px solid ${WorkerTokenStatusServiceV8.getStatusColor(tokenStatus.status)}`,
									borderRadius: '4px',
									fontSize: '12px',
									fontWeight: '500',
									color: tokenStatus.isValid
										? tokenStatus.status === 'expiring-soon'
											? '#92400e'
											: '#065f46'
										: '#991b1b',
								}}
							>
								<span>{WorkerTokenStatusServiceV8.getStatusIcon(tokenStatus.status)}</span>
								<span style={{ marginLeft: '6px' }}>{tokenStatus.message}</span>
							</div>
						</div>

						{!tokenStatus.isValid && (
							<div className="info-box" style={{ marginBottom: '0' }}>
								<p>
									<strong>⚠️ Worker Token Required:</strong> This flow uses a worker token to look up
									users and manage MFA devices. Please click "Add Token" to configure your worker
									token credentials.
								</p>
							</div>
						)}

						{/* Worker Token Settings Checkboxes */}
						<div
							style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}
						>
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
										window.dispatchEvent(
											new CustomEvent('mfaConfigurationUpdated', {
												detail: { workerToken: config.workerToken },
											})
										);
										toastV8.info(`Silent API Token Retrieval set to: ${newValue}`);

										// If enabling silent retrieval and token is missing/expired, attempt silent retrieval now
										if (newValue) {
											const currentStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
											if (!currentStatus.isValid) {
												console.log(
													'[FIDO2-FLOW-V8] Silent API retrieval enabled, attempting to fetch token now...'
												);
												const { handleShowWorkerTokenModal } = await import(
													'@/v8/utils/workerTokenModalHelperV8'
												);
												await handleShowWorkerTokenModal(
													props.setShowWorkerTokenModal,
													undefined,
													newValue, // Use new value
													showTokenAtEnd,
													false // Not forced - respect silent setting
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
									onChange={async (e) => {
										const newValue = e.target.checked;
										setShowTokenAtEnd(newValue);
										// Update config service immediately (no cache)
										const config = MFAConfigurationServiceV8.loadConfiguration();
										config.workerToken.showTokenAtEnd = newValue;
										MFAConfigurationServiceV8.saveConfiguration(config);
										// Dispatch event to notify other components
										window.dispatchEvent(
											new CustomEvent('mfaConfigurationUpdated', {
												detail: { workerToken: config.workerToken },
											})
										);
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

					<div className="credentials-grid">
						<div className="form-group">
							<label htmlFor="mfa-env-id">
								Environment ID <span className="required">*</span>
							</label>
							<input
								id="mfa-env-id"
								type="text"
								value={credentials.environmentId}
								onChange={(e) => setCredentials({ ...credentials, environmentId: e.target.value })}
								placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
							/>
							<small>PingOne environment ID</small>
						</div>

						<div className="form-group">
							<label
								htmlFor="mfa-device-auth-policy"
								style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
							>
								Device Authentication Policy <span className="required">*</span>
								<MFAInfoButtonV8 contentKey="device.authentication.policy" displayMode="modal" />
							</label>

							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '12px',
									flexWrap: 'wrap',
									marginBottom: '12px',
								}}
							>
								<button
									type="button"
									onClick={() => void refreshDeviceAuthPolicies()}
									className="token-button"
									style={{
										padding: '8px 18px',
										background: '#0284c7',
										color: 'white',
										border: 'none',
										borderRadius: '999px',
										fontSize: '13px',
										fontWeight: '700',
										cursor: isLoadingPolicies ? 'not-allowed' : 'pointer',
										opacity: isLoadingPolicies ? 0.6 : 1,
										boxShadow: '0 8px 18px rgba(2,132,199,0.25)',
										transition: 'transform 0.15s ease, box-shadow 0.15s ease',
									}}
									disabled={isLoadingPolicies || !tokenStatus.isValid || !credentials.environmentId}
									onMouseEnter={(e) => {
										if (!isLoadingPolicies) {
											e.currentTarget.style.transform = 'translateY(-1px)';
										}
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.transform = 'translateY(0)';
									}}
								>
									{isLoadingPolicies ? 'Refreshing…' : 'Refresh Policies'}
								</button>
								<span style={{ fontSize: '13px', color: '#475569' }}>
									Select which PingOne policy governs FIDO2 authentications.
								</span>
							</div>

							{policiesError && (
								<div
									className="info-box"
									style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}
								>
									<strong>Failed to load policies:</strong> {policiesError}. Retry after verifying
									access.
								</div>
							)}

							{deviceAuthPolicies.length > 0 ? (
								<select
									id="mfa-device-auth-policy"
									value={effectivePolicyId}
									onChange={(e) =>
										setCredentials({
											...credentials,
											deviceAuthenticationPolicyId: e.target.value,
										})
									}
								>
									{deviceAuthPolicies.map((policy) => (
										<option key={policy.id} value={policy.id}>
											{policy.name || policy.id} ({policy.id})
										</option>
									))}
								</select>
							) : (
								<input
									id="mfa-device-auth-policy"
									type="text"
									value={effectivePolicyId}
									onChange={(e) =>
										setCredentials({
											...credentials,
											deviceAuthenticationPolicyId: e.target.value.trim(),
										})
									}
									placeholder="Enter a Device Authentication Policy ID"
								/>
							)}

							<div
								style={{
									marginTop: '12px',
									padding: '12px 14px',
									background: '#f1f5f9',
									borderRadius: '10px',
									fontSize: '12px',
									color: '#475569',
									lineHeight: 1.5,
								}}
							>
								Policies are fetched from PingOne Device Authentication Policies.
							</div>
						</div>

						<div className="form-group">
							<label
								htmlFor="fido2-policy-select"
								style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
							>
								FIDO2 Policy <span className="required">*</span>
								<MFAInfoButtonV8 contentKey="device.fido2.policy" displayMode="modal" />
							</label>

							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '12px',
									flexWrap: 'wrap',
									marginBottom: '12px',
								}}
							>
								<button
									type="button"
									onClick={() => void fetchFido2Policies()}
									className="token-button"
									style={{
										padding: '8px 18px',
										background: '#0284c7',
										color: 'white',
										border: 'none',
										borderRadius: '999px',
										fontSize: '13px',
										fontWeight: '700',
										cursor: isLoadingFido2Policies ? 'not-allowed' : 'pointer',
										opacity: isLoadingFido2Policies ? 0.6 : 1,
										boxShadow: '0 8px 18px rgba(2,132,199,0.25)',
										transition: 'transform 0.15s ease, box-shadow 0.15s ease',
									}}
									disabled={
										isLoadingFido2Policies || !tokenStatus.isValid || !credentials.environmentId
									}
									onMouseEnter={(e) => {
										if (!isLoadingFido2Policies) {
											e.currentTarget.style.transform = 'translateY(-1px)';
										}
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.transform = 'translateY(0)';
									}}
								>
									{isLoadingFido2Policies ? 'Refreshing…' : 'Refresh Policies'}
								</button>
								<span style={{ fontSize: '13px', color: '#475569' }}>
									Select which PingOne FIDO2 policy governs device registration.
								</span>
							</div>

							{fido2PoliciesError && (
								<div
									className="info-box"
									style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}
								>
									<strong>Failed to load FIDO2 policies:</strong> {fido2PoliciesError}. Retry after
									verifying access.
								</div>
							)}

							{(() => {
								// #region agent log
								// #endregion
								return fido2Policies.length > 0 ? (
									<select
										id="fido2-policy-select"
										value={
											(credentials as MFACredentials & { fido2PolicyId?: string }).fido2PolicyId ||
											''
										}
										onChange={(e) => {
											const updated = {
												...credentials,
												fido2PolicyId: e.target.value,
											} as MFACredentials & { fido2PolicyId?: string };
											setCredentials(updated);
											CredentialsServiceV8.saveCredentials('mfa-flow-v8', updated);
										}}
										style={{
											width: '100%',
											padding: '10px',
											border: '1px solid #d1d5db',
											borderRadius: '6px',
											fontSize: '14px',
											background: 'white',
										}}
									>
										<option value="">-- Select a FIDO2 policy --</option>
										{fido2Policies.map((policy) => (
											<option key={policy.id} value={policy.id}>
												{policy.name} {policy.default ? '(Default)' : ''}
											</option>
										))}
									</select>
								) : (
									<input
										id="fido2-policy-select"
										type="text"
										value={
											(credentials as MFACredentials & { fido2PolicyId?: string }).fido2PolicyId ||
											''
										}
										onChange={(e) => {
											const updated = {
												...credentials,
												fido2PolicyId: e.target.value.trim(),
											} as MFACredentials & { fido2PolicyId?: string };
											setCredentials(updated);
											CredentialsServiceV8.saveCredentials('mfa-flow-v8', updated);
										}}
										placeholder="Enter a FIDO2 Policy ID"
										style={{
											width: '100%',
											padding: '10px',
											border: '1px solid #d1d5db',
											borderRadius: '6px',
											fontSize: '14px',
										}}
									/>
								);
							})()}

							{(credentials as MFACredentials & { fido2PolicyId?: string }).fido2PolicyId && (
								<div style={{ marginTop: '12px' }}>
									{fido2Policies.find(
										(p) =>
											p.id ===
											(credentials as MFACredentials & { fido2PolicyId?: string }).fido2PolicyId
									)?.description && (
										<p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
											{
												fido2Policies.find(
													(p) =>
														p.id ===
														(credentials as MFACredentials & { fido2PolicyId?: string })
															.fido2PolicyId
												)?.description
											}
										</p>
									)}
								</div>
							)}

							<div
								style={{
									marginTop: '12px',
									padding: '12px 14px',
									background: '#f1f5f9',
									borderRadius: '10px',
									fontSize: '12px',
									color: '#475569',
									lineHeight: 1.5,
								}}
							>
								FIDO2 policies are fetched from PingOne FIDO2 Policies API.
							</div>
						</div>

						<div className="form-group">
							<label htmlFor="mfa-username">
								Username <span className="required">*</span>
							</label>
							<input
								id="mfa-username"
								type="text"
								value={credentials.username}
								onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
								placeholder="john.doe"
							/>
							<small>PingOne username to register MFA device for</small>
						</div>
					</div>
				</div>
			);
		};
	}, [
		isConfigured,
		webAuthnSupported,
		webAuthnCapabilities,
		fido2Policies,
		isLoadingFido2Policies,
		fido2PoliciesError,
		fetchFido2Policies,
		location,
	]);

	// Ref to store pending trigger update (to avoid setState during render)
	const pendingTriggerRef = React.useRef<{
		currentStep: number;
		environmentId: string;
		username: string;
		tokenValid: boolean;
	} | null>(null);

	// Effect to apply pending trigger updates (runs after render)
	useEffect(() => {
		if (pendingTriggerRef.current) {
			const trigger = pendingTriggerRef.current;
			pendingTriggerRef.current = null; // Clear pending update

			// Only update if values actually changed
			if (
				!deviceLoadTrigger ||
				deviceLoadTrigger.currentStep !== trigger.currentStep ||
				deviceLoadTrigger.environmentId !== trigger.environmentId ||
				deviceLoadTrigger.username !== trigger.username ||
				deviceLoadTrigger.tokenValid !== trigger.tokenValid
			) {
				setDeviceLoadTrigger(trigger);
			}
		}
	});

	// Load devices when entering step 1 - moved to parent component level
	// Skip loading devices if coming from config page (registration flow)
	useEffect(() => {
		if (!deviceLoadTrigger) return;

		// If coming from config page, skip device loading and go straight to registration
		if (isConfigured && deviceLoadTrigger.currentStep === 1) {
			setDeviceSelection({
				existingDevices: [],
				loadingDevices: false,
				selectedExistingDevice: 'new',
				showRegisterForm: true,
			});
			return;
		}

		const loadDevices = async () => {
			if (
				!deviceLoadTrigger.environmentId ||
				!deviceLoadTrigger.username ||
				!deviceLoadTrigger.tokenValid
			) {
				return;
			}

			if (
				deviceLoadTrigger.currentStep === 1 &&
				deviceSelection.existingDevices.length === 0 &&
				!deviceSelection.loadingDevices
			) {
				setDeviceSelection((prev) => ({ ...prev, loadingDevices: true }));

				try {
					const credentials: MFACredentials = {
						environmentId: deviceLoadTrigger.environmentId,
						clientId: '',
						username: deviceLoadTrigger.username,
						deviceType: deviceType as DeviceType,
						countryCode: '+1',
						phoneNumber: '',
						email: '',
						deviceName: '',
					};
					const tokenStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
					const devices = await controller.loadExistingDevices(credentials, tokenStatus);
					setDeviceSelection({
						existingDevices: devices,
						loadingDevices: false,
						selectedExistingDevice: devices.length === 0 ? 'new' : '',
						showRegisterForm: devices.length === 0,
					});
				} catch (error) {
					console.error(`${MODULE_TAG} Failed to load devices`, error);
					setDeviceSelection((prev) => ({
						...prev,
						loadingDevices: false,
						selectedExistingDevice: 'new',
						showRegisterForm: true,
					}));
				}
			}
		};

		loadDevices();
	}, [
		deviceLoadTrigger?.currentStep,
		deviceLoadTrigger?.environmentId,
		deviceLoadTrigger?.username,
		deviceLoadTrigger?.tokenValid,
		isConfigured,
		deviceType,
		controller,
	]);

	// Effect to handle auto-showing registration form when configured (moved from render to avoid setState during render)
	useEffect(() => {
		if (isConfigured && !deviceSelection.showRegisterForm) {
			setDeviceSelection((prev) => ({
				...prev,
				showRegisterForm: true,
				selectedExistingDevice: 'new',
			}));
		}
	}, [isConfigured, deviceSelection.showRegisterForm]);

	// Step 1: Device Selection/Registration (using controller)
	const renderStep1WithSelection = (props: MFAFlowBaseRenderProps) => {
		const {
			credentials,
			setCredentials,
			mfaState,
			setMfaState,
			nav,
			setIsLoading,
			isLoading,
			setShowDeviceLimitModal,
			tokenStatus,
		} = props;

		// Store credentials and setCredentials in refs for useEffect to use (to avoid setState during render)
		credentialsRef.current = credentials;
		setCredentialsRef.current = setCredentials;

		// Store nav in ref for modal handlers
		navRef.current = nav;

		// Update trigger state for device loading effect (only when on step 1 and values changed)
		// Store in ref to avoid setState during render - useEffect will pick it up
		if (nav.currentStep === 1) {
			const newTrigger = {
				currentStep: nav.currentStep,
				environmentId: credentials.environmentId || '',
				username: credentials.username || '',
				tokenValid: tokenStatus.isValid,
			};
			// Only update if values actually changed to avoid infinite loops
			if (
				!deviceLoadTrigger ||
				deviceLoadTrigger.currentStep !== newTrigger.currentStep ||
				deviceLoadTrigger.environmentId !== newTrigger.environmentId ||
				deviceLoadTrigger.username !== newTrigger.username ||
				deviceLoadTrigger.tokenValid !== newTrigger.tokenValid
			) {
				pendingTriggerRef.current = newTrigger;
			}
		}

		// Handle selecting an existing device
		const handleSelectExistingDevice = (deviceId: string) => {
			setDeviceSelection((prev) => ({
				...prev,
				selectedExistingDevice: deviceId,
				showRegisterForm: false,
			}));
			const device = deviceSelection.existingDevices.find(
				(d: Record<string, unknown>) => d.id === deviceId
			);
			if (device) {
				setMfaState({
					...mfaState,
					deviceId: deviceId,
					deviceStatus: (device.status as string) || 'ACTIVE',
					nickname: (device.nickname as string) || (device.name as string) || '',
				});
			}
		};

		// Handle selecting "new device"
		const handleSelectNewDevice = () => {
			setDeviceSelection((prev) => ({
				...prev,
				selectedExistingDevice: 'new',
				showRegisterForm: true,
			}));
			setMfaState({
				...mfaState,
				deviceId: '',
				deviceStatus: '',
			});
			// Note: Setting default device name moved to useEffect to avoid setState during render
		};

		// Handle using selected existing device - trigger authentication flow
		const handleUseSelectedDevice = async () => {
			if (
				deviceSelection.selectedExistingDevice &&
				deviceSelection.selectedExistingDevice !== 'new'
			) {
				const device = deviceSelection.existingDevices.find(
					(d: Record<string, unknown>) => d.id === deviceSelection.selectedExistingDevice
				);
				if (!device) {
					toastV8.error('Device not found');
					return;
				}

				setIsLoading(true);
				try {
					// Initialize device authentication for existing device
					const authResult = await controller.initializeDeviceAuthentication(
						credentials,
						deviceSelection.selectedExistingDevice
					);

					// Update state with authentication info
					// Store challengeId if provided (needed for WebAuthn assertion)
					setMfaState((prev) => ({
						...prev,
						deviceId: deviceSelection.selectedExistingDevice,
						nickname: (device.nickname as string) || (device.name as string) || '',
						authenticationId: authResult.authenticationId,
						deviceAuthId: authResult.authenticationId,
						environmentId: credentials.environmentId,
						nextStep: authResult.nextStep || '',
						...(authResult.challengeId && { fido2ChallengeId: authResult.challengeId }),
					}));

					// Handle nextStep response
					if (authResult.nextStep === 'COMPLETED') {
						// Authentication already complete
						nav.markStepComplete();
						nav.goToStep(3); // Go to success step
						toastV8.success('Authentication successful!');
					} else if (authResult.nextStep === 'ASSERTION_REQUIRED') {
						// For FIDO2, user needs to complete WebAuthn assertion
						nav.markStepComplete();
						nav.goToStep(2); // Go to WebAuthn assertion step
						toastV8.info(
							'Please complete WebAuthn authentication using your security key or Passkey.'
						);
					} else if (authResult.nextStep === 'SELECTION_REQUIRED') {
						// Shouldn't happen if deviceId is provided, but handle it
						nav.setValidationErrors(['Multiple devices found. Please select a specific device.']);
						toastV8.warning('Please select a specific device');
					} else {
						nav.markStepComplete();
						nav.goToStep(2); // Default to assertion step
						toastV8.success('Device selected successfully!');
					}
				} catch (error) {
					console.error(`${MODULE_TAG} Failed to initialize authentication:`, error);
					const formattedError = ValidationServiceV8.formatMFAError(error as Error, {
						operation: 'authenticate',
						deviceType: 'FIDO2',
					});
					nav.setValidationErrors([formattedError.userFriendlyMessage]);
					toastV8.error(`Authentication failed: ${formattedError.userFriendlyMessage}`);
				} finally {
					setIsLoading(false);
				}
			}
		};

		// Handle device registration with WebAuthn
		const handleRegisterDevice = async () => {
			if (!FIDO2Service.isWebAuthnSupported()) {
				nav.setValidationErrors([
					'WebAuthn is not supported in this browser. Please use a modern browser.',
				]);
				return;
			}

			// Check if pairing is disabled in the policy
			const selectedPolicy = props.deviceAuthPolicies?.find(
				(p) => p.id === credentials.deviceAuthenticationPolicyId
			);
			if (selectedPolicy?.pairingDisabled === true) {
				nav.setValidationErrors([
					'Device pairing is disabled for the selected Device Authentication Policy. Please select a different policy or contact your administrator.',
				]);
				toastV8.error('Device pairing is disabled for this policy');
				return;
			}

			// Validate device name
			const finalDeviceName = credentials.deviceName?.trim() || deviceType;
			if (!finalDeviceName) {
				nav.setValidationErrors(['Device name is required. Please enter a name for this device.']);
				return;
			}

			// Note: Setting device name moved to useEffect to avoid setState during render
			// Device name will be set when registration starts

			// Ensure device name is set before registration
			const registrationCredentials = {
				...credentials,
				deviceName: finalDeviceName,
			};

			setIsLoading(true);
			setIsRegistering(true);
			try {
				// Check if user already has a FIDO device registered
				// PingOne allows only one FIDO device per user
				try {
					const existingDevices = await controller.loadExistingDevices(
						registrationCredentials,
						tokenStatus
					);
					const hasExistingFIDODevice = existingDevices.length > 0;

					if (hasExistingFIDODevice) {
						const firstDevice = existingDevices[0] as Record<string, unknown>;
						console.log(`${MODULE_TAG} User already has a FIDO device registered:`, {
							deviceCount: existingDevices.length,
							devices: existingDevices.map((d: Record<string, unknown>) => ({
								id: d.id,
								nickname: d.nickname || d.name,
								status: d.status,
							})),
						});
						// Store device info for the modal
						setExistingFIDODevice({
							id: firstDevice.id as string,
							nickname: (firstDevice.nickname || firstDevice.name) as string | undefined,
						});
						setShowFIDODeviceExistsModal(true);
						setIsLoading(false);
						setIsRegistering(false);
						return;
					}
				} catch (checkError) {
					// If checking for existing devices fails, log but don't block registration
					// The backend will handle duplicate device errors
					console.warn(`${MODULE_TAG} Failed to check for existing devices:`, checkError);
					// Continue with registration - backend will catch duplicate device errors
				}

				// First, create the device in PingOne with ACTIVATION_REQUIRED status
				// FIDO2 devices must be created with ACTIVATION_REQUIRED to get publicKeyCredentialCreationOptions
				const deviceParams = controller.getDeviceRegistrationParams(
					registrationCredentials,
					'ACTIVATION_REQUIRED'
				);
				const deviceResult = await controller.registerDevice(registrationCredentials, deviceParams);

				// Extract publicKeyCredentialCreationOptions from device result
				// Per fido2-2.md section 4: Get WebAuthn options (challenge, RP ID, etc.) from PingOne
				console.log(`${MODULE_TAG} Device creation result:`, {
					deviceId: deviceResult.deviceId,
					status: deviceResult.status,
					type: deviceResult.type,
					hasPublicKeyCredentialCreationOptions:
						'publicKeyCredentialCreationOptions' in deviceResult,
					deviceResultKeys: Object.keys(deviceResult),
					deviceResultType: typeof deviceResult,
					// Try multiple ways to access the field
					// biome-ignore lint/suspicious/noExplicitAny: Device result type is dynamic from API
					directAccess:
						(deviceResult as any).publicKeyCredentialCreationOptions?.substring(0, 50) ||
						'NOT FOUND',
					typedAccess:
						(
							deviceResult as { publicKeyCredentialCreationOptions?: string }
						).publicKeyCredentialCreationOptions?.substring(0, 50) || 'NOT FOUND',
				});

				// Try multiple ways to extract the field
				// biome-ignore lint/suspicious/noExplicitAny: Device result type is dynamic from API
				const publicKeyCredentialCreationOptions =
					(deviceResult as any).publicKeyCredentialCreationOptions ||
					(deviceResult as { publicKeyCredentialCreationOptions?: string })
						.publicKeyCredentialCreationOptions ||
					undefined;

				if (!publicKeyCredentialCreationOptions) {
					console.error(
						`${MODULE_TAG} Missing publicKeyCredentialCreationOptions in device result:`,
						{
							deviceResult,
							deviceResultKeys: Object.keys(deviceResult),
							deviceId: deviceResult.deviceId,
							status: deviceResult.status,
							type: deviceResult.type,
							// Log the full deviceResult as JSON to see what we actually have
							deviceResultJSON: JSON.stringify(deviceResult, null, 2).substring(0, 1000),
						}
					);
					throw new Error(
						'PingOne did not return publicKeyCredentialCreationOptions. The device may not have been created correctly. Check the API logs to see the actual PingOne response.'
					);
				}

				console.log(`${MODULE_TAG} ✅ Successfully extracted publicKeyCredentialCreationOptions:`, {
					length: publicKeyCredentialCreationOptions.length,
					preview: publicKeyCredentialCreationOptions.substring(0, 100),
				});

				// Per fido2-2.md section 4: Implementation flow for FIDO2
				// 1. Create FIDO2 device for the user via the MFA API ✓
				// 2. Get WebAuthn options (challenge, RP ID, etc.) from PingOne ✓
				// 3. Run WebAuthn registration in browser with navigator.credentials.create()
				// 4. Send WebAuthn result to backend
				// 5. Backend calls FIDO2 activation endpoint with WebAuthn result
				// 6. PingOne marks device ACTIVE and it becomes usable
				// Note: FIDO2 activation is WebAuthn-based, NOT OTP-based (per fido2-2.md section 1)
				// This is all handled by registerFIDO2Device method
				// Pass FIDO2 config from location state if available
				const fido2Result = await controller.registerFIDO2Device(
					registrationCredentials,
					deviceResult.deviceId,
					publicKeyCredentialCreationOptions,
					locationState?.fido2Config
				);

				setMfaState({
					...mfaState,
					deviceId: deviceResult.deviceId,
					deviceStatus: fido2Result.status || 'ACTIVE',
					nickname: registrationCredentials.deviceName || deviceType || 'FIDO2',
					userId: mfaState.userId || credentials.username,
					environmentId: mfaState.environmentId || credentials.environmentId,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					verificationResult: {
						status: 'COMPLETED',
						message: 'FIDO2 device registered and activated successfully',
					},
					...(fido2Result.credentialId && { fido2CredentialId: fido2Result.credentialId }),
				});

				if (fido2Result.credentialId) {
					setCredentialId(fido2Result.credentialId);
				}

				// Refresh device list
				const devices = await controller.loadExistingDevices(registrationCredentials, tokenStatus);
				setDeviceSelection((prev) => ({
					...prev,
					existingDevices: devices,
				}));

				nav.markStepComplete();
				nav.goToStep(3); // Navigate to success step
				toastV8.success('FIDO2 device registered and activated successfully!');
			} catch (error) {
				// Normalize error to user-friendly message
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				const errorName = error instanceof Error ? error.name : 'Unknown';
				const normalizedMessage = errorMessage.toLowerCase();

				// Check for specific error types and provide user-friendly messages
				let userFriendlyMessage = 'Failed to register FIDO2 device. Please try again.';
				let shouldShowDeviceLimitModal = false;
				let shouldShowFIDODeviceExistsModal = false;

				// Device limit errors
				if (
					normalizedMessage.includes('exceed') ||
					normalizedMessage.includes('limit') ||
					normalizedMessage.includes('maximum')
				) {
					userFriendlyMessage = 'Device limit exceeded. Please delete an existing device first.';
					shouldShowDeviceLimitModal = true;
				}
				// Existing FIDO device errors (should be caught earlier, but handle gracefully)
				else if (
					normalizedMessage.includes('already') ||
					normalizedMessage.includes('existing') ||
					normalizedMessage.includes('duplicate')
				) {
					userFriendlyMessage =
						'You already have a FIDO2 device registered. PingOne allows only one FIDO device per user.';
					shouldShowFIDODeviceExistsModal = true;
				}
				// WebAuthn not supported
				else if (
					(normalizedMessage.includes('webauthn') && normalizedMessage.includes('not supported')) ||
					normalizedMessage.includes('webauthn is not supported')
				) {
					userFriendlyMessage =
						'WebAuthn is not supported in this browser. Please use a modern browser like Chrome, Firefox, Safari, or Edge.';
				}
				// WebAuthn cancelled by user
				else if (
					normalizedMessage.includes('cancelled') ||
					normalizedMessage.includes('not allowed') ||
					errorName === 'NotAllowedError'
				) {
					userFriendlyMessage =
						'Registration was cancelled. Please try again and complete the authentication prompt.';
				}
				// WebAuthn not supported (authenticator)
				else if (
					normalizedMessage.includes('authenticator is not supported') ||
					errorName === 'NotSupportedError'
				) {
					userFriendlyMessage =
						'This authenticator is not supported. Please try a different security key or use TouchID/FaceID if available.';
				}
				// Security error
				else if (normalizedMessage.includes('security error') || errorName === 'SecurityError') {
					userFriendlyMessage =
						"Security error during registration. Please check your browser settings and ensure you're using HTTPS.";
				}
				// Missing publicKeyCredentialCreationOptions
				else if (
					normalizedMessage.includes('publickeycredentialcreationoptions') ||
					normalizedMessage.includes('device may not have been created correctly')
				) {
					userFriendlyMessage =
						'Device registration failed. The device may not have been created correctly. Please try again.';
				}
				// Invalid options format
				else if (
					(normalizedMessage.includes('invalid') && normalizedMessage.includes('format')) ||
					normalizedMessage.includes('parse')
				) {
					userFriendlyMessage = 'Invalid device configuration. Please try registering again.';
				}
				// Token errors
				else if (
					normalizedMessage.includes('token') &&
					(normalizedMessage.includes('expired') ||
						normalizedMessage.includes('invalid') ||
						normalizedMessage.includes('missing'))
				) {
					userFriendlyMessage =
						'Worker token has expired or is invalid. Please generate a new worker token and try again.';
				}
				// Network errors
				else if (
					normalizedMessage.includes('network') ||
					normalizedMessage.includes('fetch') ||
					normalizedMessage.includes('connection')
				) {
					userFriendlyMessage =
						'Network error. Please check your internet connection and try again.';
				}
				// RP ID validation errors
				else if (
					normalizedMessage.includes('rp id') ||
					(normalizedMessage.includes('origin') && normalizedMessage.includes('mismatch'))
				) {
					userFriendlyMessage =
						'Configuration error. Please ensure your FIDO2 policy RP ID matches your application domain.';
				}
				// Activation errors
				else if (
					normalizedMessage.includes('activation') ||
					normalizedMessage.includes('activate')
				) {
					userFriendlyMessage = 'Device activation failed. Please try registering again.';
				}
				// User didn't complete WebAuthn
				else if (
					normalizedMessage.includes('did not complete') ||
					normalizedMessage.includes('user did not complete')
				) {
					userFriendlyMessage =
						'Registration was not completed. Please try again and complete the authentication prompt.';
				}
				// Generic error - use original message if it's already user-friendly, otherwise use generic
				else if (
					errorMessage &&
					errorMessage.length < 100 &&
					!errorMessage.includes('Error:') &&
					!errorMessage.includes('at ')
				) {
					userFriendlyMessage = errorMessage;
				}

				// Log the original error for debugging (but don't show to user)
				console.error(`${MODULE_TAG} FIDO2 registration error:`, {
					errorName,
					errorMessage,
					userFriendlyMessage,
				});

				// Show appropriate modal or error message
				if (shouldShowDeviceLimitModal) {
					setShowDeviceLimitModal(true);
				} else if (shouldShowFIDODeviceExistsModal) {
					setShowFIDODeviceExistsModal(true);
				}

				nav.setValidationErrors([userFriendlyMessage]);
				toastV8.error(userFriendlyMessage);
			} finally {
				setIsLoading(false);
				setIsRegistering(false);
			}
		};

		// During registration flow (from config page), skip device selection and go straight to registration
		// Note: Auto-showing registration form is now handled in useEffect above to avoid setState during render

		return (
			<div className="step-content">
				{/* Only show device selector during authentication flow, not registration */}
				{!isConfigured && (
					<>
						<h2>Select or Register FIDO2 Device</h2>
						<p>Choose an existing device or register a new security key</p>

						<MFADeviceSelector
							devices={
								deviceSelection.existingDevices as Array<{
									id: string;
									type: string;
									nickname?: string;
									name?: string;
									status?: string;
								}>
							}
							loading={deviceSelection.loadingDevices}
							selectedDeviceId={deviceSelection.selectedExistingDevice}
							deviceType={deviceType as DeviceType}
							onSelectDevice={handleSelectExistingDevice}
							onSelectNew={handleSelectNewDevice}
							onUseSelected={handleUseSelectedDevice}
							renderDeviceInfo={(device) => <>{device.status && `Status: ${device.status}`}</>}
						/>
					</>
				)}

				{/* Show registration form during registration flow OR when user selects "new device" */}
				{(isConfigured || deviceSelection.showRegisterForm) && (
					<div>
						{isConfigured && (
							<>
								<h2>Register FIDO2 Device</h2>
								<p>Register a new security key or passkey</p>
							</>
						)}
						<div className="info-box">
							<p>
								<strong>Username:</strong> {credentials.username}
							</p>
						</div>

						<div className="form-group" style={{ marginTop: '0' }}>
							<label htmlFor="mfa-device-type-register">
								Device Type <span className="required">*</span>
								<MFAInfoButtonV8 contentKey="device.enrollment" displayMode="tooltip" />
							</label>
							<select
								id="mfa-device-type-register"
								value={credentials.deviceType || deviceType}
								onChange={(e) => {
									const newDeviceType = e.target.value as DeviceType;
									// Set default device name based on device type if not already set
									const defaultDeviceName = newDeviceType;
									const updatedCredentials = {
										...credentials,
										deviceType: newDeviceType,
										deviceName: credentials.deviceName || defaultDeviceName,
									};
									setCredentials(updatedCredentials);
									// Save credentials and trigger flow reload
									CredentialsServiceV8.saveCredentials('mfa-flow-v8', updatedCredentials);
									// Dispatch event to notify router
									window.dispatchEvent(
										new CustomEvent('mfaDeviceTypeChanged', { detail: newDeviceType })
									);
									// Reload to switch to new device type flow
									setTimeout(() => {
										window.location.reload();
									}, 100);
								}}
								style={{
									padding: '10px 12px',
									border: '1px solid #d1d5db',
									borderRadius: '6px',
									fontSize: '14px',
									color: '#1f2937',
									background: 'white',
									width: '100%',
									cursor: 'pointer',
								}}
							>
								<option value="SMS">📱 SMS (Text Message)</option>
								<option value="EMAIL">📧 Email</option>
								<option value="TOTP">🔐 TOTP (Authenticator App)</option>
								<option value="FIDO2">🔑 FIDO2 (Security Key / Passkey)</option>
								<option value="MOBILE">📲 Mobile (PingID)</option>
								<option value="OATH_TOKEN">🎫 OATH Token (PingID)</option>
								<option value="VOICE">📞 Voice</option>
								<option value="WHATSAPP">💬 WhatsApp</option>
							</select>
							<small>Select the type of MFA device you want to register</small>
						</div>

						<div className="form-group">
							<label htmlFor="mfa-device-name-register">
								Device Name (Nickname) <span className="required">*</span>
								<MFAInfoButtonV8 contentKey="device.name" displayMode="tooltip" />
							</label>
							<input
								id="mfa-device-name-register"
								type="text"
								value={credentials.deviceName || deviceType}
								onChange={(e) => setCredentials({ ...credentials, deviceName: e.target.value })}
								placeholder={deviceType}
								style={{
									padding: '10px 12px',
									border: `1px solid ${credentials.deviceName ? '#10b981' : '#d1d5db'}`,
									borderRadius: '6px',
									fontSize: '14px',
									color: '#1f2937',
									background: 'white',
									width: '100%',
								}}
							/>
							<small>
								Enter a friendly name to identify this device (e.g., "My Security Key", "Work
								Passkey")
								{credentials.deviceName && (
									<span
										style={{
											marginLeft: '8px',
											color: '#10b981',
											fontWeight: '500',
										}}
									>
										✓ Device will be registered as: "{credentials.deviceName}"
									</span>
								)}
							</small>
						</div>

						<div
							className="info-box"
							style={{ marginTop: '20px', background: '#eff6ff', border: '1px solid #bfdbfe' }}
						>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									marginBottom: '8px',
								}}
							>
								<h4 style={{ margin: '0', fontSize: '15px', color: '#1e40af' }}>
									🔐 FIDO2 Activation Flow
								</h4>
								<MFAInfoButtonV8 contentKey="fido2.activation" displayMode="modal" />
							</div>
							<p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#1e40af' }}>
								<strong>FIDO2 uses WebAuthn-based activation, NOT OTP codes.</strong> This is
								different from SMS/Email devices.
							</p>
							<p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
								When you click the button below, your browser will prompt you to:
							</p>
							<ul style={{ margin: '0 0 8px 0', paddingLeft: '20px', fontSize: '14px' }}>
								<li>Use your security key, Touch ID, Face ID, or Windows Hello</li>
								<li>Follow the on-screen prompts to complete WebAuthn registration</li>
								<li>Confirm the registration when prompted</li>
							</ul>
							<p style={{ margin: '0', fontSize: '13px', color: '#475569', fontStyle: 'italic' }}>
								After WebAuthn registration, the device will be automatically activated via
								PingOne's FIDO2 activation endpoint.
							</p>
						</div>

						{/* Validation feedback */}
						{nav.validationErrors.length > 0 && (
							<div
								className="error-box"
								style={{
									marginTop: '16px',
									background: '#fee2e2',
									border: '1px solid #fca5a5',
									borderRadius: '6px',
									padding: '12px',
								}}
							>
								{nav.validationErrors.map((error, idx) => (
									<p key={idx} style={{ margin: '4px 0', color: '#991b1b', fontSize: '14px' }}>
										❌ {error}
									</p>
								))}
							</div>
						)}

						{/* Button disabled reason */}
						{(isLoading ||
							isRegistering ||
							!credentials.deviceName?.trim() ||
							!credentials.username?.trim() ||
							!credentials.environmentId?.trim() ||
							!tokenStatus.isValid) && (
							<div
								style={{
									marginTop: '12px',
									padding: '10px',
									background: '#fef3c7',
									border: '1px solid #fbbf24',
									borderRadius: '6px',
									fontSize: '13px',
									color: '#92400e',
								}}
							>
								<strong>Button disabled because:</strong>
								<ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
									{isLoading && <li>⏳ Currently loading...</li>}
									{isRegistering && <li>🔐 Currently registering...</li>}
									{!credentials.deviceName?.trim() && <li>❌ Device name is required</li>}
									{!credentials.username?.trim() && <li>❌ Username is required</li>}
									{!credentials.environmentId?.trim() && <li>❌ Environment ID is required</li>}
									{!tokenStatus.isValid && <li>❌ Worker token is invalid or missing</li>}
								</ul>
							</div>
						)}

						<div style={{ marginTop: '24px', textAlign: 'center' }}>
							<button
								type="button"
								className="btn btn-primary"
								disabled={
									isLoading ||
									isRegistering ||
									!credentials.deviceName?.trim() ||
									!credentials.username?.trim() ||
									!credentials.environmentId?.trim() ||
									!tokenStatus.isValid
								}
								onClick={handleRegisterDevice}
								style={{
									background:
										isLoading ||
										isRegistering ||
										!credentials.deviceName?.trim() ||
										!credentials.username?.trim() ||
										!credentials.environmentId?.trim() ||
										!tokenStatus.isValid
											? '#9ca3af'
											: '#10b981',
									color: 'white',
									padding: '14px 32px',
									fontSize: '16px',
									fontWeight: '600',
									borderRadius: '8px',
									border: 'none',
									cursor:
										isLoading ||
										isRegistering ||
										!credentials.deviceName?.trim() ||
										!credentials.username?.trim() ||
										!credentials.environmentId?.trim() ||
										!tokenStatus.isValid
											? 'not-allowed'
											: 'pointer',
									boxShadow:
										isLoading ||
										isRegistering ||
										!credentials.deviceName?.trim() ||
										!credentials.username?.trim() ||
										!credentials.environmentId?.trim() ||
										!tokenStatus.isValid
											? 'none'
											: '0 4px 12px rgba(16, 185, 129, 0.3)',
									transition: 'all 0.2s ease',
									minWidth: '280px',
									opacity:
										isLoading ||
										isRegistering ||
										!credentials.deviceName?.trim() ||
										!credentials.username?.trim() ||
										!credentials.environmentId?.trim() ||
										!tokenStatus.isValid
											? 0.6
											: 1,
								}}
								onMouseEnter={(e) => {
									if (!e.currentTarget.disabled) {
										e.currentTarget.style.background = '#059669';
										e.currentTarget.style.borderColor = '#059669';
										e.currentTarget.style.transform = 'translateY(-2px)';
										e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
									}
								}}
								onMouseLeave={(e) => {
									if (!e.currentTarget.disabled) {
										e.currentTarget.style.background = '#10b981';
										e.currentTarget.style.borderColor = '#10b981';
										e.currentTarget.style.transform = 'translateY(0)';
										e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
									}
								}}
							>
								{isRegistering
									? '🔐 Registering with WebAuthn...'
									: isLoading
										? '🔄 Registering...'
										: 'Register FIDO2 Device'}
							</button>
							{isLoading && !isRegistering && (
								<div
									className="info-box"
									style={{ marginTop: '16px', background: '#f0f9ff', border: '1px solid #bae6fd' }}
								>
									<p
										style={{
											margin: '0 0 8px 0',
											fontSize: '14px',
											color: '#0c4a6e',
											fontWeight: '600',
										}}
									>
										Step 1: Creating FIDO2 device in PingOne...
									</p>
									<p style={{ margin: '0', fontSize: '13px', color: '#475569' }}>
										PingOne will return WebAuthn registration options (challenge, RP ID, etc.)
									</p>
								</div>
							)}
							{isRegistering && (
								<div
									className="info-box"
									style={{ marginTop: '16px', background: '#f0fdf4', border: '1px solid #86efac' }}
								>
									<p
										style={{
											margin: '0 0 8px 0',
											fontSize: '14px',
											color: '#166534',
											fontWeight: '600',
										}}
									>
										Step 2: WebAuthn Registration in Progress
									</p>
									<p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#166534' }}>
										Your browser is performing the WebAuthn registration ceremony. You may be
										prompted to:
									</p>
									<ul
										style={{
											margin: '0 0 8px 0',
											paddingLeft: '20px',
											fontSize: '13px',
											color: '#166534',
										}}
									>
										<li>Use your security key, Touch ID, Face ID, or Windows Hello</li>
										<li>Follow on-screen prompts to complete registration</li>
									</ul>
									<p
										style={{ margin: '0', fontSize: '13px', color: '#166534', fontStyle: 'italic' }}
									>
										After WebAuthn completes, the device will be activated via PingOne's FIDO2
										activation endpoint.
									</p>
								</div>
							)}
							{!isLoading && !isRegistering && (
								<p
									style={{
										marginTop: '12px',
										fontSize: '14px',
										color: '#6b7280',
										fontStyle: 'italic',
									}}
								>
									Click this button to start the FIDO2 registration flow (WebAuthn-based, not
									OTP-based)
								</p>
							)}
						</div>
					</div>
				)}

				{mfaState.deviceId && (
					<SuccessMessage title="Device Ready">
						<p>
							<strong>Device ID:</strong> {mfaState.deviceId}
						</p>
						<p>
							<strong>Status:</strong> {mfaState.deviceStatus}
						</p>
						{credentialId && (
							<p
								style={{
									marginTop: '12px',
									fontSize: '13px',
									fontFamily: 'monospace',
									wordBreak: 'break-all',
								}}
							>
								<strong>Credential ID:</strong> {credentialId.substring(0, 40)}...
							</p>
						)}
					</SuccessMessage>
				)}
			</div>
		);
	};

	// Step 2: FIDO2 Device Ready / WebAuthn Assertion (skip OTP sending - uses WebAuthn)
	// Memoize the render function to ensure stable hook calls
	const renderStep2 = useMemo(() => {
		return (props: MFAFlowBaseRenderProps) => {
			const { mfaState, credentials, setMfaState, nav, setIsLoading, isLoading } = props;
			// Hooks moved to component level - use the ones defined above

			// Check if we need to perform WebAuthn assertion
			const needsAssertion =
				mfaState.nextStep === 'ASSERTION_REQUIRED' && mfaState.fido2ChallengeId;

			// Handle WebAuthn assertion
			const handleWebAuthnAssertion = async () => {
				if (!mfaState.fido2ChallengeId || !mfaState.authenticationId) {
					setAssertionError('Missing challenge ID or authentication ID');
					return;
				}

				if (!WebAuthnAuthenticationServiceV8.isWebAuthnSupported()) {
					setAssertionError('WebAuthn is not supported in this browser');
					return;
				}

				setIsAuthenticating(true);
				setAssertionError(null);
				setIsLoading(true);

				try {
					// Check for session cookies and native app context to prefer FIDO2 platform devices
					// Per PingOne MFA API:
					// 1. If session cookie exists, use FIDO2 platform device even if not default
					// 2. If native app with device authorization, use native device
					const { shouldPreferFIDO2PlatformDevice } = await import(
						'@/v8/services/fido2SessionCookieServiceV8'
					);
					const platformPreference = shouldPreferFIDO2PlatformDevice();

					// Detect if we're on macOS to prefer Passkeys (platform authenticators)
					const isMac =
						typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');

					// Perform WebAuthn authentication
					const webAuthnParams = {
						challengeId: mfaState.fido2ChallengeId,
						rpId: window.location.hostname,
						userName: credentials.username || '',
						userVerification: 'preferred' as const,
						// Prefer platform authenticators if:
						// 1. Session cookie exists (FIDO2 platform device should be used even if not default)
						// 2. Native app with device authorization enabled
						// 3. macOS (Passkeys)
						...((platformPreference.prefer || isMac) && {
							authenticatorSelection: {
								authenticatorAttachment: 'platform' as const,
								userVerification: 'preferred' as const,
							},
						}),
					};

					if (platformPreference.prefer) {
						console.log(
							`[🔑 FIDO2-FLOW-V8] Using FIDO2 platform device preference: ${platformPreference.reason}`
						);
					}

					const webAuthnResult =
						await WebAuthnAuthenticationServiceV8.authenticateWithWebAuthn(webAuthnParams);

					if (!webAuthnResult.success) {
						throw new Error(webAuthnResult.error || 'WebAuthn authentication failed');
					}

					// Check Assertion (FIDO Device) - Send WebAuthn assertion to PingOne
					// According to fido2.md spec: POST {{authPath}}/{{envID}}/deviceAuthentications/{{deviceAuthID}}
					// Content-Type: application/vnd.pingidentity.assertion.check+json
					if (!mfaState.authenticationId) {
						throw new Error('Missing authentication ID for assertion check');
					}

					// Build assertion object from WebAuthn result
					// According to fido2.md, the assertion body should match PingOne API spec
					const assertion = {
						id: webAuthnResult.credentialId || '',
						rawId: webAuthnResult.rawId || webAuthnResult.credentialId || '', // Use rawId if available, fallback to credentialId
						type: 'public-key',
						response: {
							clientDataJSON: webAuthnResult.clientDataJSON || '',
							authenticatorData: webAuthnResult.authenticatorData || '',
							signature: webAuthnResult.signature || '',
							...(webAuthnResult.userHandle && { userHandle: webAuthnResult.userHandle }),
						},
					};

					// Call Check Assertion endpoint
					// Pass environmentId from credentials to avoid loading from storage
					const assertionResult = await MfaAuthenticationServiceV8.checkFIDO2Assertion(
						mfaState.authenticationId,
						assertion,
						credentials.environmentId,
						credentials.region // Pass region from credentials
					);

					console.log(`${MODULE_TAG} FIDO2 assertion checked`, {
						status: assertionResult.status,
						nextStep: assertionResult.nextStep,
					});

					// Update state with result
					setMfaState((prev) => ({
						...prev,
						nextStep: assertionResult.nextStep || assertionResult.status || 'COMPLETED',
					}));

					// Handle result based on status
					if (assertionResult.status === 'COMPLETED' || assertionResult.nextStep === 'COMPLETED') {
						nav.markStepComplete();
						nav.goToStep(3); // Go to success step
						toastV8.success('FIDO2 authentication successful!');
					} else if (assertionResult.status === 'ASSERTION_REQUIRED') {
						// Assertion failed, allow retry
						throw new Error('Assertion validation failed. Please try again.');
					} else {
						// Other status, proceed to next step
						nav.markStepComplete();
						nav.goToStep(3);
						toastV8.success('FIDO2 authentication completed!');
					}
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					console.error(`${MODULE_TAG} WebAuthn assertion failed:`, error);
					setAssertionError(errorMessage);
					toastV8.error(`Authentication failed: ${errorMessage}`);
				} finally {
					setIsAuthenticating(false);
					setIsLoading(false);
				}
			};

			// If assertion is required, show assertion UI
			if (needsAssertion) {
				return (
					<div className="step-content">
						<h2>
							Complete WebAuthn Authentication
							<MFAInfoButtonV8 contentKey="factor.fido2" displayMode="modal" />
						</h2>
						<p>Please authenticate using your security key, Touch ID, Face ID, or Windows Hello</p>

						{assertionError && (
							<div
								className="info-box"
								style={{
									background: '#fef2f2',
									border: '1px solid #fecaca',
									color: '#991b1b',
									marginBottom: '20px',
								}}
							>
								<strong>Error:</strong> {assertionError}
							</div>
						)}

						<div className="info-box" style={{ marginBottom: '20px' }}>
							<p>
								<strong>Device ID:</strong> {mfaState.deviceId}
							</p>
							<p>
								<strong>Authentication ID:</strong> {mfaState.authenticationId}
							</p>
						</div>

						<button
							type="button"
							className="btn btn-primary"
							disabled={isLoading || isAuthenticating}
							onClick={handleWebAuthnAssertion}
							style={{
								padding: '12px 24px',
								fontSize: '16px',
								fontWeight: '600',
							}}
						>
							{isAuthenticating ? '🔐 Authenticating...' : '🔑 Authenticate with Passkey'}
						</button>
					</div>
				);
			}

			// Otherwise, show device ready (registration completion)
			return (
				<div className="step-content">
					<h2>
						FIDO2 Device Ready
						<MFAInfoButtonV8 contentKey="factor.fido2" displayMode="modal" />
					</h2>
					<p>Your security key is set up and ready to use</p>

					<div className="info-box">
						<p>
							<strong>Device ID:</strong> {mfaState.deviceId}
						</p>
						<p>
							<strong>Status:</strong> {mfaState.deviceStatus || 'Ready'}
						</p>
					</div>

					{mfaState.authenticationId && (
						<div
							style={{
								marginBottom: '16px',
								padding: '14px 16px',
								background: '#f0f9ff',
								border: '1px solid #bae6fd',
								borderRadius: '10px',
								display: 'flex',
								flexDirection: 'column',
								gap: '8px',
							}}
						>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									flexWrap: 'wrap',
									gap: '8px',
								}}
							>
								<div>
									<p style={{ margin: 0, fontSize: '14px', color: '#0c4a6e', fontWeight: 600 }}>
										Device Authentication ID
									</p>
									<p style={{ margin: '2px 0 0', fontFamily: 'monospace', color: '#1f2937' }}>
										{mfaState.authenticationId}
									</p>
								</div>
								<button
									type="button"
									onClick={() => {
										const params = new URLSearchParams({
											environmentId: credentials.environmentId?.trim() || '',
											authenticationId: mfaState.authenticationId!,
										});

										if (credentials.deviceAuthenticationPolicyId?.trim()) {
											params.set('policyId', credentials.deviceAuthenticationPolicyId.trim());
										}

										if (credentials.username?.trim()) {
											params.set('username', credentials.username.trim());
										}

										if (mfaState.deviceId) {
											params.set('deviceId', mfaState.deviceId);
										}

										navigate(`/v8/mfa/device-authentication-details?${params.toString()}`, {
											state: { autoFetch: true },
										});
									}}
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: '6px',
										padding: '8px 12px',
										borderRadius: '8px',
										border: '1px solid #3b82f6',
										background: '#ffffff',
										color: '#1d4ed8',
										fontWeight: 600,
										cursor: 'pointer',
									}}
								>
									<FiShield />
									View Session Details
								</button>
							</div>
							<p style={{ margin: 0, fontSize: '13px', color: '#0c4a6e' }}>
								Dig into the PingOne device authentication record if you need to confirm WebAuthn
								registration status.
							</p>
						</div>
					)}

					<div className="success-box" style={{ marginTop: '20px' }}>
						<h3>✅ Setup Complete</h3>
						<p>Your FIDO2 device has been registered successfully.</p>
						<p style={{ marginTop: '12px', fontSize: '14px' }}>
							This device can now be used for MFA authentication. When authenticating, you'll be
							prompted to use your security key, Touch ID, Face ID, or Windows Hello.
						</p>
						<p style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>
							💡 <strong>Tip:</strong> FIDO2 authentication uses WebAuthn, which provides strong
							security without requiring codes.
						</p>
					</div>
				</div>
			);
		};
	}, [navigate, isAuthenticating, assertionError, setIsAuthenticating, setAssertionError]);

	// Step 3: Success screen (FIDO2 doesn't need OTP validation)
	// Memoize renderStep3 to ensure stable function reference
	const renderStep3 = useMemo(() => {
		return (props: MFAFlowBaseRenderProps) => {
			const { mfaState, credentials } = props;

			// Ensure deviceType is set to FIDO2 for success page
			// Pass modified credentials to buildSuccessPageData but keep original in props
			const credentialsWithDeviceType = {
				...credentials,
				deviceType: 'FIDO2' as DeviceType,
			};

			// Ensure mfaState has all required fields for success page
			// FIDO2 registration should have deviceId, nickname, deviceStatus, etc.
			const enrichedMfaState = {
				...mfaState,
				deviceId: mfaState.deviceId || '',
				deviceStatus: mfaState.deviceStatus || 'ACTIVE',
				nickname: mfaState.nickname || credentials.deviceName || 'FIDO2',
				environmentId: mfaState.environmentId || credentials.environmentId,
				userId: mfaState.userId || '',
			};

			// Use shared success page service
			// FIDO2 flow doesn't use useUnifiedOTPFlow hook, so default to admin flow
			const successData = buildSuccessPageData(
				credentialsWithDeviceType,
				enrichedMfaState,
				'admin',
				'ACTIVE',
				credentials.tokenType || 'worker'
			);

			// Ensure successData has FIDO2 deviceType explicitly set
			successData.deviceType = 'FIDO2' as DeviceType;

			// Debug logging to verify data is being passed correctly
			console.log('[FIDO2FlowV8] renderStep3 - Success page data:', {
				deviceId: successData.deviceId,
				deviceType: successData.deviceType,
				deviceStatus: successData.deviceStatus,
				nickname: successData.nickname,
				username: successData.username,
				userId: successData.userId,
			});

			// Pass modified credentials with deviceType to ensure documentation button shows
			// The original credentials from props might not have deviceType set
			return (
				<MFASuccessPageV8
					{...props}
					credentials={credentialsWithDeviceType}
					successData={successData}
					onStartAgain={() => navigateToMfaHubWithCleanup(navigate)}
				/>
			);
		};
	}, [navigate]);

	// Validation function for Step 0
	const validateStep0 = (
		credentials: MFACredentials,
		tokenStatus: ReturnType<typeof WorkerTokenStatusServiceV8.checkWorkerTokenStatus>,
		nav: ReturnType<typeof useStepNavigationV8>
	): boolean => {
		return controller.validateCredentials(credentials, tokenStatus, nav);
	};

	// Track API display visibility and height for dynamic padding
	const [isApiDisplayVisible, setIsApiDisplayVisible] = useState(false);
	const [apiDisplayHeight, setApiDisplayHeight] = useState(0);

	useEffect(() => {
		const checkVisibility = () => {
			setIsApiDisplayVisible(apiDisplayServiceV8.isVisible());
		};

		// Check initial state
		checkVisibility();

		// Subscribe to visibility changes
		const unsubscribe = apiDisplayServiceV8.subscribe(checkVisibility);

		return () => unsubscribe();
	}, []);

	// Observe API Display height changes for dynamic padding
	useEffect(() => {
		if (!isApiDisplayVisible) {
			setApiDisplayHeight(0);
			return;
		}

		const updateHeight = () => {
			const apiDisplayElement = document.querySelector('.super-simple-api-display') as HTMLElement;
			if (apiDisplayElement) {
				const rect = apiDisplayElement.getBoundingClientRect();
				const height = rect.height;
				setApiDisplayHeight(height > 0 ? height : apiDisplayElement.offsetHeight);
			}
		};

		const initialTimeout = setTimeout(updateHeight, 100);

		const resizeObserver = new ResizeObserver(() => {
			updateHeight();
		});

		const apiDisplayElement = document.querySelector('.super-simple-api-display');
		if (apiDisplayElement) {
			resizeObserver.observe(apiDisplayElement);
		}

		return () => {
			clearTimeout(initialTimeout);
			resizeObserver.disconnect();
		};
	}, [isApiDisplayVisible]);

	return (
		<div
			style={{
				minHeight: '100vh',
				paddingBottom:
					isApiDisplayVisible && apiDisplayHeight > 0 ? `${apiDisplayHeight + 60}px` : '0',
				transition: 'padding-bottom 0.3s ease',
				overflow: 'visible',
			}}
		>
			<MFANavigationV8 currentPage="registration" showBackToMain={true} />

			<MFAFlowBaseV8
				deviceType={deviceType as DeviceType}
				renderStep0={renderStep0}
				renderStep1={renderStep1WithSelection}
				renderStep2={renderStep2}
				renderStep3={renderStep3}
				renderStep4={() => null}
				validateStep0={validateStep0}
				stepLabels={['Configure', 'Select/Register Device', 'Device Ready', 'Complete']}
				shouldHideNextButton={(props) => {
					// Hide Next button on step 1 when registration form is shown
					// The "Register FIDO2 Device" button is the primary action
					if (props.nav.currentStep === 1) {
						return deviceSelection.showRegisterForm;
					}
					// Hide final button on success step (step 3) - we have our own "Start Again" button
					if (props.nav.currentStep === 3) {
						return true;
					}
					return false;
				}}
			/>

			<SuperSimpleApiDisplayV8 flowFilter="mfa" />

			<FIDODeviceExistsModalV8
				isOpen={showFIDODeviceExistsModal}
				onClose={() => {
					setShowFIDODeviceExistsModal(false);
					setExistingFIDODevice(null);
				}}
				onBackToSelection={() => {
					setShowFIDODeviceExistsModal(false);
					setExistingFIDODevice(null);
					// Navigate back to device selection step
					if (navRef.current) {
						navRef.current.goToStep(1);
						navRef.current.setValidationErrors([]);
						navRef.current.setValidationWarnings([]);
					}
				}}
				onBackToHub={() => {
					setShowFIDODeviceExistsModal(false);
					setExistingFIDODevice(null);
					navigateToMfaHubWithCleanup(navigate);
				}}
				onDeviceDeleted={() => {
					setShowFIDODeviceExistsModal(false);
					setExistingFIDODevice(null);
					// Refresh device list and allow registration
					if (navRef.current) {
						navRef.current.setValidationErrors([]);
						navRef.current.setValidationWarnings([]);
					}
					// Trigger device reload by updating device selection state
					setDeviceSelection((prev) => ({
						...prev,
						existingDevices: [],
						selectedExistingDevice: 'new',
						showRegisterForm: true,
					}));
				}}
				environmentId={credentialsRef.current?.environmentId}
				username={credentialsRef.current?.username}
				deviceId={existingFIDODevice?.id}
				deviceNickname={existingFIDODevice?.nickname}
			/>
		</div>
	);
};

// Main FIDO2 Flow Component
export const FIDO2FlowV8: React.FC = () => {
	return <FIDO2FlowV8WithDeviceSelection />;
};
