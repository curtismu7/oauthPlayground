/**
 * @file useMFAPolicy.ts
 * @module v8/flows/MFAAuthenticationMainPageV8/hooks
 * @description Hook for managing MFA device authentication policies
 * @version 1.0.0
 * @since 2026-01-31
 *
 * Extracted from MFAAuthenticationMainPageV8.tsx to improve maintainability.
 * This hook encapsulates policy-related logic including:
 * - Loading device authentication policies
 * - Policy selection
 * - Extracting allowed device types from policies
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import type { DeviceAuthenticationPolicy, DeviceType } from '../../shared/MFATypes';
import type { TokenStatusInfo } from '@/v8/services/workerTokenStatusServiceV8';

const MODULE_TAG = '[🔐 useMFAPolicy]';
const FLOW_KEY = 'mfa-flow-v8';

export interface MFAPolicyCredentials {
	environmentId: string;
	deviceAuthenticationPolicyId: string;
}

export interface MFAPolicyHookResult {
	// Policies
	deviceAuthPolicies: DeviceAuthenticationPolicy[];
	isLoadingPolicies: boolean;
	policiesError: string | null;
	
	// Actions
	loadPolicies: () => Promise<DeviceAuthenticationPolicy[]>;
	handlePolicySelect: (
		policyId: string,
		credentials: MFAPolicyCredentials,
		onCredentialsUpdate: (updated: MFAPolicyCredentials) => void
	) => Promise<void>;
	extractAllowedDeviceTypes: (policy: DeviceAuthenticationPolicy) => DeviceType[];
	
	// State setters
	setDeviceAuthPolicies: React.Dispatch<React.SetStateAction<DeviceAuthenticationPolicy[]>>;
	setIsLoadingPolicies: React.Dispatch<React.SetStateAction<boolean>>;
	setPoliciesError: React.Dispatch<React.SetStateAction<string | null>>;
}

export interface UseMFAPolicyOptions {
	environmentId: string;
	tokenStatus: TokenStatusInfo;
	currentPolicyId: string;
	onAutoSelect?: (policyId: string) => void;
}

/**
 * Hook for managing MFA device authentication policies
 * 
 * @example
 * ```tsx
 * const {
 *   deviceAuthPolicies,
 *   isLoadingPolicies,
 *   loadPolicies,
 *   handlePolicySelect,
 *   extractAllowedDeviceTypes
 * } = useMFAPolicy({
 *   environmentId: 'env-123',
 *   tokenStatus,
 *   currentPolicyId: credentials.deviceAuthenticationPolicyId,
 *   onAutoSelect: (policyId) => {
 *     setCredentials(prev => ({ ...prev, deviceAuthenticationPolicyId: policyId }))
 *   }
 * });
 * ```
 */
export const useMFAPolicy = (options: UseMFAPolicyOptions): MFAPolicyHookResult => {
	const { environmentId, tokenStatus, currentPolicyId, onAutoSelect } = options;

	// MFA Policy State
	const [deviceAuthPolicies, setDeviceAuthPolicies] = useState<DeviceAuthenticationPolicy[]>([]);
	const [isLoadingPolicies, setIsLoadingPolicies] = useState(false);
	const [policiesError, setPoliciesError] = useState<string | null>(null);

	// Track last fetched environment to prevent duplicate calls
	const lastFetchedPolicyEnvIdRef = useRef<string | null>(null);
	const isFetchingPoliciesRef = useRef(false);

	/**
	 * Extract allowed device types from policy
	 */
	const extractAllowedDeviceTypes = useCallback(
		(policy: DeviceAuthenticationPolicy): DeviceType[] => {
			const allowed: DeviceType[] = [];

			// Check for allowedDeviceTypes in deviceSelection
			if (policy.authentication?.deviceSelection) {
				const deviceSelection = policy.authentication.deviceSelection;
				if (typeof deviceSelection === 'object' && deviceSelection !== null) {
					const allowedTypes = (deviceSelection as { allowedDeviceTypes?: string[] })
						.allowedDeviceTypes;
					if (Array.isArray(allowedTypes) && allowedTypes.length > 0) {
						allowed.push(...(allowedTypes as DeviceType[]));
					}
				}
			}

			// Check for deviceAuthentication.required
			if (policy.authentication?.deviceAuthentication) {
				const deviceAuth = policy.authentication.deviceAuthentication;
				if (typeof deviceAuth === 'object' && deviceAuth !== null) {
					const required = (deviceAuth as { required?: string[] }).required;
					if (Array.isArray(required) && required.length > 0) {
						allowed.push(...(required as DeviceType[]));
					}
					// Also check optional device types
					const optional = (deviceAuth as { optional?: string[] }).optional;
					if (Array.isArray(optional) && optional.length > 0) {
						allowed.push(...(optional as DeviceType[]));
					}
				}
			}

			// Remove duplicates
			const uniqueAllowed = [...new Set(allowed)];

			// If no explicit restrictions found, default to all common device types
			if (uniqueAllowed.length === 0) {
				return ['FIDO2', 'TOTP', 'SMS', 'EMAIL', 'VOICE', 'MOBILE', 'WHATSAPP'] as DeviceType[];
			}

			return uniqueAllowed;
		},
		[]
	);

	/**
	 * Load MFA Policies
	 */
	const loadPolicies = useCallback(async (): Promise<DeviceAuthenticationPolicy[]> => {
		const envId = environmentId?.trim();

		if (!envId || !tokenStatus.isValid) {
			return [];
		}

		// Prevent duplicate calls
		if (isFetchingPoliciesRef.current || lastFetchedPolicyEnvIdRef.current === envId) {
			return deviceAuthPolicies;
		}

		isFetchingPoliciesRef.current = true;
		setIsLoadingPolicies(true);
		setPoliciesError(null);

		try {
			const policies = await MFAServiceV8.listDeviceAuthenticationPolicies(envId);
			lastFetchedPolicyEnvIdRef.current = envId;
			setDeviceAuthPolicies(policies);

			// Auto-select if only one policy
			if (!currentPolicyId && policies.length === 1 && onAutoSelect) {
				onAutoSelect(policies[0].id);
				
				// Also save to storage
				const stored = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
					flowKey: FLOW_KEY,
					flowType: 'oidc',
					includeClientSecret: false,
					includeRedirectUri: false,
					includeLogoutUri: false,
					includeScopes: false,
				});
				CredentialsServiceV8.saveCredentials(FLOW_KEY, {
					...stored,
					deviceAuthenticationPolicyId: policies[0].id,
				});
			}

			return policies;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to load policies';

			// Check if this is a server connection error
			const isServerError =
				errorMessage.toLowerCase().includes('failed to connect') ||
				errorMessage.toLowerCase().includes('server is running') ||
				errorMessage.toLowerCase().includes('network error') ||
				errorMessage.toLowerCase().includes('connection refused') ||
				errorMessage.toLowerCase().includes('econnrefused');

			// Check if this is a worker token error
			const isWorkerTokenError =
				errorMessage.toLowerCase().includes('worker token') ||
				errorMessage.toLowerCase().includes('not available') ||
				errorMessage.toLowerCase().includes('has expired');

			if (isServerError) {
				setPoliciesError(
					'⚠️ Backend server is not running or unreachable. Please ensure the server is running on port 3001 and try again.'
				);
			} else if (isWorkerTokenError) {
				setPoliciesError(
					'⚠️ Worker token is required to load device authentication policies. Please generate a worker token using the "Get Worker Token" button above.'
				);
			} else {
				setPoliciesError(errorMessage);
			}

			console.error(`${MODULE_TAG} Failed to load policies:`, error);
			return [];
		} finally {
			isFetchingPoliciesRef.current = false;
			setIsLoadingPolicies(false);
		}
	}, [
		environmentId,
		currentPolicyId,
		tokenStatus.isValid,
		deviceAuthPolicies,
		onAutoSelect,
	]);

	/**
	 * Handle MFA Policy Selection
	 */
	const handlePolicySelect = useCallback(
		async (
			policyId: string,
			credentials: MFAPolicyCredentials,
			onCredentialsUpdate: (updated: MFAPolicyCredentials) => void
		) => {
			// Update credentials first
			const updatedCredentials = {
				...credentials,
				deviceAuthenticationPolicyId: policyId,
			};
			onCredentialsUpdate(updatedCredentials);
			
			// Save to storage
			const stored = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
				flowKey: FLOW_KEY,
				flowType: 'oidc',
				includeClientSecret: false,
				includeRedirectUri: false,
				includeLogoutUri: false,
				includeScopes: false,
			});
			CredentialsServiceV8.saveCredentials(FLOW_KEY, {
				...stored,
				deviceAuthenticationPolicyId: policyId,
			});

			// Reload policies to get the latest data
			const reloadedPolicies = await loadPolicies();

			// Get the updated policy from the reloaded list
			const updatedPolicy = reloadedPolicies.find((p) => p.id === policyId);
			if (updatedPolicy) {
				// Extract and log allowed device types
				const allowedTypes = extractAllowedDeviceTypes(updatedPolicy);

				toastV8.success(
					`Selected policy: ${updatedPolicy.name} (${allowedTypes.length} device type${allowedTypes.length !== 1 ? 's' : ''} allowed)`
				);
			}
		},
		[extractAllowedDeviceTypes, loadPolicies]
	);

	// Load policies when environment or token changes
	useEffect(() => {
		const envId = environmentId?.trim();

		// Only fetch if environment changed or we haven't fetched yet
		if (envId && tokenStatus.isValid && lastFetchedPolicyEnvIdRef.current !== envId) {
			void loadPolicies();
		}
	}, [environmentId, tokenStatus.isValid, loadPolicies]);

	return {
		// Policies
		deviceAuthPolicies,
		isLoadingPolicies,
		policiesError,
		
		// Actions
		loadPolicies,
		handlePolicySelect,
		extractAllowedDeviceTypes,
		
		// State setters
		setDeviceAuthPolicies,
		setIsLoadingPolicies,
		setPoliciesError,
	};
};
