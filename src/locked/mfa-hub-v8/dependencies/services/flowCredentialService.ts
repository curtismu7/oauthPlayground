// src/services/flowCredentialService.ts
// Unified Credential Service for OAuth/OIDC Flows
// Provides consistent credential loading, saving, and synchronization across all flows

import type { StepCredentials } from '../components/steps/CommonSteps';
import { showGlobalError, showGlobalSuccess } from '../hooks/useNotifications';
import type { AllCredentials } from '../utils/credentialManager';
import { credentialManager } from '../utils/credentialManager';
import { safeJsonParse } from '../utils/secureJson';
import { flowCredentialIsolationService } from './flowCredentialIsolationService';

import { logger } from '../../../utils/logger';
export interface FlowCredentialConfig {
	flowKey: string; // Unique key for this flow (e.g., 'client-credentials-v6', 'oidc-hybrid-v6')
	flowType?: string; // Flow type for logging/tracking
	defaultCredentials?: Partial<StepCredentials>; // Default credentials for this flow
}

export interface FlowPersistentState<T = unknown> {
	credentials: StepCredentials;
	flowConfig?: T; // Flow-specific configuration
	tokens?: unknown; // Flow-specific tokens
	flowVariant?: string; // OAuth vs OIDC variant
	timestamp?: number; // When this was saved
}

/**
 * Load credentials from credentialManager (shared across all flows)
 * This is the primary source of truth for credentials
 */
export const loadSharedCredentials = async (
	flowKey: string,
	defaultCredentials?: Partial<StepCredentials>
): Promise<StepCredentials | null> => {
	try {
		const savedCreds = credentialManager.getAllCredentials();

		if (savedCreds.environmentId && savedCreds.clientId) {
			const clientAuthMethod =
				(savedCreds as Partial<StepCredentials>).clientAuthMethod ??
				savedCreds.tokenAuthMethod ??
				(defaultCredentials?.clientAuthMethod as string | undefined) ??
				'client_secret_post';
			const scopesValue = Array.isArray(savedCreds.scopes)
				? savedCreds.scopes.join(' ')
				: typeof savedCreds.scopes === 'string'
					? savedCreds.scopes
					: (defaultCredentials?.scopes ?? defaultCredentials?.scope ?? '');
			const mergedCreds: Partial<StepCredentials> = {
				...defaultCredentials,
				environmentId: savedCreds.environmentId ?? defaultCredentials?.environmentId ?? '',
				clientId: savedCreds.clientId ?? defaultCredentials?.clientId ?? '',
				clientSecret: savedCreds.clientSecret ?? defaultCredentials?.clientSecret ?? '',
				redirectUri: savedCreds.redirectUri ?? defaultCredentials?.redirectUri ?? '',
				postLogoutRedirectUri:
					savedCreds.postLogoutRedirectUri ?? defaultCredentials?.postLogoutRedirectUri,
				scope: scopesValue || defaultCredentials?.scope || '',
				scopes: scopesValue || defaultCredentials?.scopes || '',
				authorizationEndpoint: savedCreds.authEndpoint ?? defaultCredentials?.authorizationEndpoint,
				tokenEndpoint: savedCreds.tokenEndpoint ?? defaultCredentials?.tokenEndpoint,
				userInfoEndpoint: savedCreds.userInfoEndpoint ?? defaultCredentials?.userInfoEndpoint,
				clientAuthMethod,
				loginHint: savedCreds.loginHint ?? defaultCredentials?.loginHint,
			};
			const normalized: StepCredentials = {
				clientId: mergedCreds.clientId ?? '',
				clientSecret: mergedCreds.clientSecret ?? '',
				environmentId: mergedCreds.environmentId,
				redirectUri: mergedCreds.redirectUri ?? '',
				scope: mergedCreds.scope ?? '',
				scopes: mergedCreds.scopes ?? '',
				postLogoutRedirectUri: mergedCreds.postLogoutRedirectUri,
				authorizationEndpoint: mergedCreds.authorizationEndpoint,
				tokenEndpoint: mergedCreds.tokenEndpoint,
				userInfoEndpoint: mergedCreds.userInfoEndpoint,
				clientAuthMethod: mergedCreds.clientAuthMethod ?? 'client_secret_post',
				loginHint: mergedCreds.loginHint,
				grantType: mergedCreds.grantType,
				responseType: mergedCreds.responseType,
				responseMode: mergedCreds.responseMode,
				issuerUrl: mergedCreds.issuerUrl,
				introspectionEndpoint: mergedCreds.introspectionEndpoint,
				privateKey: mergedCreds.privateKey,
				keyId: mergedCreds.keyId,
				initiateLoginUri: mergedCreds.initiateLoginUri,
				targetLinkUri: mergedCreds.targetLinkUri,
				signoffUrls: mergedCreds.signoffUrls,
				requestParameterSignatureRequirement: mergedCreds.requestParameterSignatureRequirement,
				additionalRefreshTokenReplayProtection: mergedCreds.additionalRefreshTokenReplayProtection,
				includeX5tParameter: mergedCreds.includeX5tParameter,
				oidcSessionManagement: mergedCreds.oidcSessionManagement,
				requestScopesForMultipleResources: mergedCreds.requestScopesForMultipleResources,
				terminateUserSessionByIdToken: mergedCreds.terminateUserSessionByIdToken,
				corsOrigins: mergedCreds.corsOrigins,
				corsAllowAnyOrigin: mergedCreds.corsAllowAnyOrigin,
			};

			logger.info(
				`[FlowCredentialService:${flowKey}] Loaded shared credentials from credentialManager:`,
				{
					environmentId: savedCreds.environmentId,
					clientId: savedCreds.clientId,
					hasClientSecret: !!savedCreds.clientSecret,
					clientAuthMethod: normalized.clientAuthMethod,
				}
			);

			return normalized;
		}

		logger.info(
			`[FlowCredentialService:${flowKey}] No shared credentials found in credentialManager`
		);
		return null;
	} catch (error) {
		logger.error(`[FlowCredentialService:${flowKey}] Failed to load shared credentials:`, error);
		return null;
	}
};

/**
 * Load flow-specific state from localStorage
 * This includes flow-specific config, tokens, and other state
 */
export const loadFlowState = <T = unknown>(flowKey: string): FlowPersistentState<T> | null => {
	try {
		const savedState = localStorage.getItem(flowKey);
		if (!savedState) {
			return null;
		}

		const parsed = safeJsonParse(savedState) as FlowPersistentState<T>;
		if (parsed) {
			logger.info(
				`[FlowCredentialService:${flowKey}] Loaded flow-specific state from localStorage`
			);
			return parsed;
		}

		return null;
	} catch (error) {
		logger.error(`[FlowCredentialService:${flowKey}] Failed to load flow state:`, error);
		return null;
	}
};

/**
 * Save credentials to credentialManager (shared across all flows)
 * This is the primary source of truth for credentials
 */
export const saveSharedCredentials = async (
	flowKey: string,
	credentials: StepCredentials,
	options: { showToast?: boolean } = { showToast: true }
): Promise<boolean> => {
	try {
		logger.info(`[FlowCredentialService:${flowKey}] Starting saveSharedCredentials...`);
		logger.info(`[FlowCredentialService:${flowKey}] Credentials to save:`, {
			environmentId: credentials.environmentId,
			clientId: credentials.clientId,
			hasClientSecret: !!credentials.clientSecret,
			redirectUri: credentials.redirectUri,
		});

		const scopesForStorage = Array.isArray(credentials.scopes)
			? credentials.scopes
			: typeof credentials.scopes === 'string'
				? credentials.scopes.split(/\s+/).filter(Boolean)
				: typeof credentials.scope === 'string'
					? credentials.scope.split(/\s+/).filter(Boolean)
					: undefined;
		const credentialsForStorage: Partial<AllCredentials> = {};
		if (credentials.environmentId) {
			credentialsForStorage.environmentId = credentials.environmentId;
		}
		if (credentials.clientId) {
			credentialsForStorage.clientId = credentials.clientId;
		}
		if (credentials.clientSecret) {
			credentialsForStorage.clientSecret = credentials.clientSecret;
		}
		if (credentials.redirectUri) {
			credentialsForStorage.redirectUri = credentials.redirectUri;
		}
		if (credentials.postLogoutRedirectUri) {
			credentialsForStorage.postLogoutRedirectUri = credentials.postLogoutRedirectUri;
		}
		if (scopesForStorage && scopesForStorage.length > 0) {
			credentialsForStorage.scopes = scopesForStorage;
		}
		credentialsForStorage.tokenAuthMethod =
			(credentials as any).tokenAuthMethod ?? credentials.clientAuthMethod ?? 'client_secret_post';
		if (credentials.authorizationEndpoint) {
			credentialsForStorage.authEndpoint = credentials.authorizationEndpoint;
		}
		if (credentials.tokenEndpoint) {
			credentialsForStorage.tokenEndpoint = credentials.tokenEndpoint;
		}
		if (credentials.userInfoEndpoint) {
			credentialsForStorage.userInfoEndpoint = credentials.userInfoEndpoint;
		}
		if (credentials.postLogoutRedirectUri) {
			credentialsForStorage.endSessionEndpoint = credentials.postLogoutRedirectUri;
		}
		if (credentials.loginHint) {
			credentialsForStorage.loginHint = credentials.loginHint;
		}
		// Use saveAllCredentials to save to all credential stores
		const success = credentialManager.saveAllCredentials(credentialsForStorage);

		logger.info(
			`[FlowCredentialService:${flowKey}] credentialManager.saveAllCredentials result:`,
			success
		);

		if (!success) {
			throw new Error('Failed to save credentials to credentialManager');
		}

		logger.info(
			`[FlowCredentialService:${flowKey}] Saved shared credentials to credentialManager:`,
			{
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				hasClientSecret: !!credentials.clientSecret,
			}
		);

		if (options.showToast) {
			showGlobalSuccess('Credentials saved successfully!');
		}

		return true;
	} catch (error) {
		logger.error(`[FlowCredentialService:${flowKey}] Failed to save shared credentials:`, error);
		if (options.showToast) {
			showGlobalError('Failed to save credentials');
		}
		return false;
	}
};

/**
 * Save flow-specific state to localStorage
 * This includes flow-specific config, tokens, and other state
 */
export const saveFlowState = <T = unknown>(
	flowKey: string,
	state: FlowPersistentState<T>
): boolean => {
	try {
		const stateWithTimestamp: FlowPersistentState<T> = {
			...state,
			timestamp: Date.now(),
		};

		localStorage.setItem(flowKey, JSON.stringify(stateWithTimestamp));

		logger.info(`[FlowCredentialService:${flowKey}] Saved flow-specific state to localStorage`);
		return true;
	} catch (error) {
		logger.error(`[FlowCredentialService:${flowKey}] Failed to save flow state:`, error);
		return false;
	}
};

/**
 * Save both shared credentials and flow-specific state
 * This is the recommended method for saving all flow data
 */
export const saveFlowCredentials = async <T = unknown>(
	flowKey: string,
	credentials: StepCredentials,
	flowConfig?: T,
	additionalState?: Partial<FlowPersistentState<T>>,
	options: { showToast?: boolean } = { showToast: true }
): Promise<boolean> => {
	try {
		// 🔍 INSTRUMENTATION: Track credential saving behavior
		console.group(`🔍 [CREDENTIAL AUDIT] Saving credentials for flow: ${flowKey}`);
		logger.info(`📋 Flow Key: ${flowKey}`);
		logger.info(`📋 Credentials to Save:`, credentials);
		logger.info(`📋 Flow Config:`, flowConfig);

		// 🔍 INSTRUMENTATION: Check localStorage before saving
		const beforeKeys = Object.keys(localStorage).filter((key) => key.includes('pingone'));
		logger.info(`📋 localStorage Keys BEFORE Save:`, beforeKeys);

		// Save to credentialManager (shared across flows)
		logger.info(`📋 Saving to shared credentialManager...`);
		const sharedSaved = await saveSharedCredentials(flowKey, credentials, { showToast: false });
		logger.info(`📋 Shared Save Result:`, sharedSaved);

		// Save flow-specific state to localStorage
		logger.info(`📋 Saving to flow-specific localStorage...`);
		const flowState: FlowPersistentState<T> = {
			credentials,
			flowConfig,
			...additionalState,
		};
		const flowStateSaved = saveFlowState(flowKey, flowState);
		logger.info(`📋 Flow State Save Result:`, flowStateSaved);

		// 🔍 INSTRUMENTATION: Check localStorage after saving
		const afterKeys = Object.keys(localStorage).filter((key) => key.includes('pingone'));
		logger.info(`📋 localStorage Keys AFTER Save:`, afterKeys);
		logger.info(
			`📋 New Keys Added:`,
			afterKeys.filter((key) => !beforeKeys.includes(key))
		);

		const success = sharedSaved && flowStateSaved;

		if (success && options.showToast) {
			showGlobalSuccess('Credentials and configuration saved successfully!');
		} else if (!success && options.showToast) {
			showGlobalError('Failed to save credentials and configuration');
		}

		logger.info(`📋 Overall Save Success:`, success);
		console.groupEnd();

		return success;
	} catch (error) {
		logger.error(`[FlowCredentialService:${flowKey}] Failed to save flow credentials:`, error);
		if (options.showToast) {
			showGlobalError('Failed to save credentials');
		}
		return false;
	}
};

/**
 * Load all credentials and flow state
 * This is the recommended method for loading all flow data on mount
 */
export const loadFlowCredentials = async <T = unknown>(
	config: FlowCredentialConfig & { disableSharedFallback?: boolean }
): Promise<{
	credentials: StepCredentials | null;
	flowState: FlowPersistentState<T> | null;
	hasSharedCredentials: boolean;
	hasFlowState: boolean;
}> => {
	const { flowKey, defaultCredentials, disableSharedFallback } = config;

	// 🔍 INSTRUMENTATION: Track credential loading behavior
	console.group(`🔍 [CREDENTIAL AUDIT] Loading credentials for flow: ${flowKey}`);
	logger.info(`📋 Flow Key: ${flowKey}`);
	logger.info(`📋 Default Credentials:`, defaultCredentials);

	// Load flow-specific state from localStorage - PRIMARY SOURCE
	const flowState = loadFlowState<T>(flowKey);
	logger.info(`📋 Flow State Found:`, !!flowState);
	logger.info(`📋 Flow State Credentials:`, flowState?.credentials);

	// Load from credentialManager (shared across flows) - FALLBACK ONLY
	const sharedCredentials = disableSharedFallback
		? null
		: await loadSharedCredentials(flowKey, defaultCredentials);
	logger.info(`📋 Shared Credentials Found:`, !!sharedCredentials);
	logger.info(`📋 Shared Credentials:`, sharedCredentials);

	// 🔍 INSTRUMENTATION: Check all localStorage keys for this flow
	const allKeys = Object.keys(localStorage).filter(
		(key) => key.includes('pingone') || key.includes(flowKey)
	);
	logger.info(`📋 All PingOne/Flow Keys:`, allKeys);

	// Priority: flow-specific credentials take precedence over shared credentials
	// This ensures each flow maintains its own credentials on refresh
	let finalCredentials: StepCredentials | null = null;
	let credentialSource = 'none';

	if (
		flowState?.credentials &&
		(flowState.credentials.environmentId || flowState.credentials.clientId)
	) {
		// Use flow-specific credentials if they exist and have data
		finalCredentials = flowState.credentials;
		credentialSource = 'flow-specific';
		logger.info(
			`✅ [FlowCredentialService:${flowKey}] Using flow-specific credentials from localStorage`
		);
	} else if (sharedCredentials) {
		// Fall back to shared credentials only if no flow-specific credentials exist
		finalCredentials = sharedCredentials;
		credentialSource = 'shared-fallback';
		logger.info(
			`⚠️ [FlowCredentialService:${flowKey}] Using shared credentials (no flow-specific credentials found)`
		);
		logger.info(
			`🚨 POTENTIAL CREDENTIAL BLEEDING DETECTED! Flow ${flowKey} is using shared credentials`
		);
	}

	logger.info(`📋 Final Credentials Source: ${credentialSource}`);
	logger.info(`📋 Final Credentials:`, finalCredentials);
	console.groupEnd();

	return {
		credentials: finalCredentials,
		flowState,
		hasSharedCredentials: !!sharedCredentials,
		hasFlowState: !!flowState,
	};
};

/**
 * Clear flow-specific state (but preserve shared credentials)
 */
export const clearFlowState = (flowKey: string): boolean => {
	try {
		localStorage.removeItem(flowKey);
		logger.info(`[FlowCredentialService:${flowKey}] Cleared flow-specific state`);
		return true;
	} catch (error) {
		logger.error(`[FlowCredentialService:${flowKey}] Failed to clear flow state:`, error);
		return false;
	}
};

// ============================================
// ISOLATED CREDENTIAL METHODS (NEW)
// ============================================

/**
 * Save credentials using isolated storage (per-flow-first, no shared contamination)
 * This is the NEW recommended method for V7 flows
 */
export const saveFlowCredentialsIsolated = async <T = unknown>(
	flowKey: string,
	credentials: StepCredentials,
	flowConfig?: T,
	additionalState?: Partial<FlowPersistentState<T>>,
	options: {
		showToast?: boolean;
		useSharedFallback?: boolean;
	} = { showToast: true, useSharedFallback: false }
): Promise<boolean> => {
	try {
		console.group(`🔒 [ISOLATED CREDENTIALS] Saving credentials for flow: ${flowKey}`);
		logger.info(`📋 Flow Key: ${flowKey}`);
		logger.info(`📋 Credentials:`, credentials);
		logger.info(`📋 Use Shared Fallback: ${options.useSharedFallback}`);

		// Save to isolated storage (per-flow-first)
		const isolatedSaved = flowCredentialIsolationService.saveFlowCredentials(flowKey, credentials, {
			showToast: false,
			useSharedFallback: options.useSharedFallback,
		});

		// Save flow-specific state to localStorage (for backward compatibility)
		const flowState: FlowPersistentState<T> = {
			credentials,
			flowConfig,
			...additionalState,
		};
		const flowStateSaved = saveFlowState(flowKey, flowState);

		const success = isolatedSaved && flowStateSaved;

		if (success && options.showToast) {
			showGlobalSuccess(`Credentials saved for ${flowKey} (isolated)`);
		} else if (!success && options.showToast) {
			showGlobalError(`Failed to save credentials for ${flowKey}`);
		}

		logger.info(`📋 Overall Save Success:`, success);
		console.groupEnd();

		return success;
	} catch (error) {
		logger.error(`[FlowCredentialService:${flowKey}] Failed to save isolated credentials:`, error);
		if (options.showToast) {
			showGlobalError('Failed to save credentials');
		}
		return false;
	}
};

/**
 * Load credentials using isolated storage (per-flow-first, optional shared fallback)
 * This is the NEW recommended method for V7 flows
 */
export const loadFlowCredentialsIsolated = async <T = unknown>(
	config: FlowCredentialConfig & { useSharedFallback?: boolean }
): Promise<{
	credentials: StepCredentials | null;
	flowState: FlowPersistentState<T> | null;
	hasSharedCredentials: boolean;
	hasFlowState: boolean;
	credentialSource: 'flow-specific' | 'shared-fallback' | 'none';
}> => {
	const { flowKey, defaultCredentials, useSharedFallback = false } = config;

	// Load from isolated storage (per-flow-first)
	const isolatedResult = flowCredentialIsolationService.loadFlowCredentials({
		flowKey,
		defaultCredentials,
		useSharedFallback,
	});

	// Load flow-specific state from localStorage (for backward compatibility)
	const flowState = loadFlowState<T>(flowKey);

	return {
		credentials: isolatedResult.credentials,
		flowState,
		hasSharedCredentials: isolatedResult.hasSharedCredentials,
		hasFlowState: !!flowState,
		credentialSource: isolatedResult.credentialSource,
	};
};

/**
 * Migrate existing shared credentials to isolated storage for a flow
 */
export const migrateFlowToIsolated = (flowKey: string): boolean => {
	return flowCredentialIsolationService.migrateSharedToFlowSpecific(flowKey);
};

/**
 * Clear isolated credentials for a flow
 */
export const clearFlowCredentialsIsolated = (flowKey: string): boolean => {
	return flowCredentialIsolationService.clearFlowCredentials(flowKey);
};

/**
 * Clear shared credentials (affects all flows)
 */
export const clearSharedCredentials = async (flowKey: string): Promise<boolean> => {
	try {
		await credentialManager.clearAllCredentials();
		logger.info(`[FlowCredentialService:${flowKey}] Cleared shared credentials`);
		return true;
	} catch (error) {
		logger.error(`[FlowCredentialService:${flowKey}] Failed to clear shared credentials:`, error);
		return false;
	}
};

/**
 * Clear both flow state and shared credentials
 */
export const clearAllFlowData = async (flowKey: string): Promise<boolean> => {
	try {
		clearFlowState(flowKey);
		await clearSharedCredentials(flowKey);
		logger.info(`[FlowCredentialService:${flowKey}] Cleared all flow data`);
		return true;
	} catch (error) {
		logger.error(`[FlowCredentialService:${flowKey}] Failed to clear all flow data:`, error);
		return false;
	}
};

/**
 * Check if credentials are valid (have required fields)
 */
export const validateCredentials = (
	credentials: StepCredentials | null,
	requireClientSecret = false
): boolean => {
	if (!credentials) return false;

	const hasEnvironmentId = !!credentials.environmentId?.trim();
	const hasClientId = !!credentials.clientId?.trim();
	const hasClientSecret = requireClientSecret ? !!credentials.clientSecret?.trim() : true;

	return hasEnvironmentId && hasClientId && hasClientSecret;
};

/**
 * Unified Flow Credential Service
 */
export const FlowCredentialService = {
	// Load methods
	loadSharedCredentials,
	loadFlowState,
	loadFlowCredentials,

	// Save methods
	saveSharedCredentials,
	saveFlowState,
	saveFlowCredentials,

	// Clear methods
	clearFlowState,
	clearSharedCredentials,
	clearAllFlowData,

	// Validation
	validateCredentials,
};

export default FlowCredentialService;
