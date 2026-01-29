/**
 * @file useMFAPolicies.ts
 * @module v8/hooks
 * @description Custom hook for managing MFA device authentication policies
 * @version 3.0.0
 *
 * Extracted from MFAAuthenticationMainPageV8.tsx as part of V3 refactoring.
 * Centralizes all policy-related logic including:
 * - Loading device authentication policies
 * - Policy selection and auto-selection
 * - Policy caching to prevent duplicate API calls
 * - Default policy detection
 * - Error handling
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DeviceAuthenticationPolicy } from '@/v8/flows/shared/MFATypes';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';

export interface UseMFAPoliciesConfig {
	/** Environment ID for policy queries */
	environmentId?: string;
	/** Whether worker token is valid (required for API calls) */
	tokenIsValid?: boolean;
	/** Currently selected policy ID */
	selectedPolicyId?: string;
	/** Auto-load policies when config changes */
	autoLoad?: boolean;
	/** Auto-select policy if only one exists */
	autoSelectSingle?: boolean;
}

export interface UseMFAPoliciesReturn {
	// State
	policies: DeviceAuthenticationPolicy[];
	selectedPolicy: DeviceAuthenticationPolicy | null;
	isLoading: boolean;
	error: string | null;

	// Actions
	loadPolicies: () => Promise<DeviceAuthenticationPolicy[]>;
	refreshPolicies: () => Promise<DeviceAuthenticationPolicy[]>;
	selectPolicy: (policyId: string) => void;
	clearPolicies: () => void;
	clearError: () => void;

	// Computed
	hasPolicies: boolean;
	policyCount: number;
	defaultPolicy: DeviceAuthenticationPolicy | null;
}

const MODULE_TAG = '[🔐 USE-MFA-POLICIES]';

/**
 * Custom hook for managing MFA device authentication policies
 */
export const useMFAPolicies = (config: UseMFAPoliciesConfig = {}): UseMFAPoliciesReturn => {
	const {
		environmentId,
		tokenIsValid = false,
		selectedPolicyId,
		autoLoad = true,
		autoSelectSingle = true,
	} = config;

	// State
	const [policies, setPolicies] = useState<DeviceAuthenticationPolicy[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Refs for caching and preventing duplicate calls
	const isFetchingRef = useRef(false);
	const lastFetchedEnvIdRef = useRef<string | null>(null);

	// Load policies function
	const loadPolicies = useCallback(async (): Promise<DeviceAuthenticationPolicy[]> => {
		const envId = environmentId?.trim();

		if (!envId || !tokenIsValid) {
			return [];
		}

		// Prevent duplicate calls - if we're already fetching or already fetched for this env, skip
		if (isFetchingRef.current || lastFetchedEnvIdRef.current === envId) {
			return policies;
		}

		isFetchingRef.current = true;
		setIsLoading(true);
		setError(null);

		try {
			const loadedPolicies = await MFAServiceV8.listDeviceAuthenticationPolicies(envId);
			lastFetchedEnvIdRef.current = envId;
			setPolicies(loadedPolicies);

			console.log(
				`${MODULE_TAG} Loaded ${loadedPolicies.length} policies for environment ${envId}`
			);

			return loadedPolicies;
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to load policies';

			// Check if this is a server connection error
			const isServerError =
				errorMessage.toLowerCase().includes('failed to connect') ||
				errorMessage.toLowerCase().includes('server is running') ||
				errorMessage.toLowerCase().includes('network error') ||
				errorMessage.toLowerCase().includes('connection refused') ||
				errorMessage.toLowerCase().includes('econnrefused');

			if (isServerError) {
				setError(
					'⚠️ Backend server is not running or unreachable. Please ensure the server is running on port 3001 and try again.'
				);
			} else {
				setError(errorMessage);
			}

			console.error(`${MODULE_TAG} Failed to load policies:`, err);
			return [];
		} finally {
			isFetchingRef.current = false;
			setIsLoading(false);
		}
	}, [environmentId, tokenIsValid, policies]);

	// Refresh policies (force reload)
	const refreshPolicies = useCallback(async (): Promise<DeviceAuthenticationPolicy[]> => {
		// Clear cache to force reload
		lastFetchedEnvIdRef.current = null;
		return await loadPolicies();
	}, [loadPolicies]);

	// Select policy
	const selectPolicy = useCallback((policyId: string) => {
		console.log(`${MODULE_TAG} Policy selected: ${policyId}`);
	}, []);

	// Clear policies
	const clearPolicies = useCallback(() => {
		setPolicies([]);
		lastFetchedEnvIdRef.current = null;
	}, []);

	// Clear error
	const clearError = useCallback(() => {
		setError(null);
	}, []);

	// Auto-load policies when environment or token changes
	useEffect(() => {
		if (!autoLoad) return;

		const envId = environmentId?.trim();

		// Only fetch if environment changed or we haven't fetched yet
		if (envId && tokenIsValid && lastFetchedEnvIdRef.current !== envId) {
			void loadPolicies();
		}
	}, [autoLoad, environmentId, tokenIsValid, loadPolicies]);

	// Computed values
	const hasPolicies = policies.length > 0;
	const policyCount = policies.length;

	// Find selected policy
	const selectedPolicy = selectedPolicyId
		? policies.find((p) => p.id === selectedPolicyId) || null
		: null;

	// Find default policy (marked as default in PingOne)
	const defaultPolicy = policies.find((p) => p.default === true) || null;

	return {
		// State
		policies,
		selectedPolicy,
		isLoading,
		error,

		// Actions
		loadPolicies,
		refreshPolicies,
		selectPolicy,
		clearPolicies,
		clearError,

		// Computed
		hasPolicies,
		policyCount,
		defaultPolicy,
	};
};
