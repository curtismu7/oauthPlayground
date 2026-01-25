/**
 * @file useAuthorizationCodeFlowV7ControllerUnified.ts
 * @description Authorization Code Flow V7 Controller with Unified Shared Credentials
 * @version 9.0.0
 * @since 2025-01-25
 * 
 * This controller implements the V7 authorization code flow with unified shared credentials.
 * It uses the unified shared credentials service to ensure Environment ID and Worker Token
 * credentials are shared across all flows, while maintaining flow-specific settings.
 */

import {
	type Dispatch,
	type SetStateAction,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';
import type { FlowConfig } from '../components/FlowConfiguration';
import type { PKCECodes, StepCredentials } from '../components/steps/CommonSteps';
import { FlowCredentialService } from '../services/flowCredentialService';
import { trackTokenOperation } from '../utils/activityTracker';
import { getCallbackUrlForFlow } from '../utils/callbackUrls';
import { applyClientAuthentication } from '../utils/clientAuthentication';
import { credentialManager } from '../utils/credentialManager';
import { enhancedDebugger } from '../utils/enhancedDebug';
import { getDefaultConfig } from '../utils/flowConfigDefaults';
import { useFlowStepManager } from '../utils/flowStepSystem';
import { generateCodeChallenge, generateCodeVerifier } from '../utils/oauth';
import {
	auditRedirectUri,
	clearRedirectUri,
	getStoredRedirectUri,
	storeRedirectUriFromAuthUrl,
} from '../utils/redirectUriHelpers';
import { useUnifiedSharedCredentials } from './useUnifiedSharedCredentials';

const MODULE_TAG = '[🔐 AUTH-CODE-FLOW-CONTROLLER-V7-UNIFIED]';

export interface AuthorizationCodeFlowV7ControllerConfig {
	flowKey: string;
	defaultFlowVariant?: 'oauth' | 'oidc';
	enableDebugger?: boolean;
	disableSharedFallback?: boolean; // For testing isolation
}

export interface AuthorizationCodeFlowV7ControllerState {
	credentials: StepCredentials;
	pkceCodes: PKCECodes;
	loading: boolean;
	error: string | null;
	flowVariant: 'oauth' | 'oidc';
	config: FlowConfig;
	debugInfo: any;
}

export interface AuthorizationCodeFlowV7ControllerReturn {
	state: AuthorizationCodeFlowV7ControllerState;
	actions: {
		updateCredentials: (updates: Partial<StepCredentials>) => void;
		updateConfig: (updates: Partial<FlowConfig>) => void;
		setError: (error: string | null) => void;
		clearError: () => void;
		reset: () => void;
		generatePKCECodes: () => Promise<void>;
		validateAndProceed: () => Promise<boolean>;
	};
}

/**
 * Authorization Code Flow V7 Controller with Unified Shared Credentials
 */
export function useAuthorizationCodeFlowV7Controller(
	config: AuthorizationCodeFlowV7ControllerConfig
): AuthorizationCodeFlowV7ControllerReturn {
	const { flowKey, defaultFlowVariant = 'oauth', enableDebugger = true, disableSharedFallback = false } = config;

	// Unified shared credentials
	const {
		credentials: sharedCredentials,
		saveEnvironmentId,
		saveOAuthCredentials,
		saveWorkerTokenCredentials,
		hasAnyCredentials,
		hasOAuthCredentials,
		hasWorkerTokenCredentials,
		getCredentialStatus,
		refreshCredentials,
	} = useUnifiedSharedCredentials();

	// Flow-specific state
	const [flowVariant, setFlowVariant] = useState<'oauth' | 'oidc'>(defaultFlowVariant);
	const [pkceCodes, setPkceCodes] = useState<PKCECodes>({ codeVerifier: '', codeChallenge: '' });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [debugInfo, setDebugInfo] = useState<any>(null);

	// Flow configuration
	const [flowConfig, setFlowConfig] = useState<FlowConfig>(() => 
		getDefaultConfig(flowKey, flowVariant)
	);

	// Initialize credentials with shared credentials
	const initializeCredentials = useCallback(async (): Promise<StepCredentials> => {
		console.log(`${MODULE_TAG} Initializing credentials with unified shared service`);
		
		try {
			// Get flow-specific defaults
			const flowDefaults = FlowCredentialService.loadCredentials(flowKey, {
				flowKey,
				flowType: flowVariant,
				includeClientSecret: true,
				includeRedirectUri: true,
				includeLogoutUri: false,
				includeScopes: true,
				defaultScopes: flowVariant === 'oidc' ? 'openid profile email' : '',
				defaultRedirectUri: 'http://localhost:3000/callback',
			});

			// Merge with shared credentials
			const mergedCredentials: StepCredentials = {
				...flowDefaults,
				// Override with shared credentials if available
				...(sharedCredentials.environmentId && { environmentId: sharedCredentials.environmentId }),
				...(sharedCredentials.clientId && { clientId: sharedCredentials.clientId }),
				...(sharedCredentials.clientSecret && { clientSecret: sharedCredentials.clientSecret }),
				...(sharedCredentials.issuerUrl && { issuerUrl: sharedCredentials.issuerUrl }),
				...(sharedCredentials.clientAuthMethod && { clientAuthMethod: sharedCredentials.clientAuthMethod }),
			};

			console.log(`${MODULE_TAG} ✅ Initialized credentials:`, {
				flowKey,
				hasEnvironmentId: !!mergedCredentials.environmentId,
				hasClientId: !!mergedCredentials.clientId,
				hasClientSecret: !!mergedCredentials.clientSecret,
				hasIssuerUrl: !!mergedCredentials.issuerUrl,
				flowVariant,
			});

			return mergedCredentials;

		} catch (error) {
			console.error(`${MODULE_TAG} ❌ Failed to initialize credentials:`, error);
			// Return empty defaults as fallback
			return FlowCredentialService.loadCredentials(flowKey, {
				flowKey,
				flowType: flowVariant,
				includeClientSecret: true,
				includeRedirectUri: true,
				includeLogoutUri: false,
				includeScopes: true,
				defaultScopes: flowVariant === 'oidc' ? 'openid profile email' : '',
				defaultRedirectUri: 'http://localhost:3000/callback',
			});
		}
	}, [flowKey, flowVariant, sharedCredentials]);

	// Initialize state
	const [credentials, setCredentials] = useState<StepCredentials>(() => {
		// Return empty state initially, will be populated by useEffect
		return FlowCredentialService.loadCredentials(flowKey, {
			flowKey,
			flowType: flowVariant,
			includeClientSecret: true,
			includeRedirectUri: true,
			includeLogoutUri: false,
			includeScopes: true,
			defaultScopes: flowVariant === 'oidc' ? 'openid profile email' : '',
			defaultRedirectUri: 'http://localhost:3000/callback',
		});
	});

	// Load initial credentials on mount
	useEffect(() => {
		const loadInitialCredentials = async () => {
			setLoading(true);
			try {
				const initialCreds = await initializeCredentials();
				setCredentials(initialCreds);
				setError(null);
			} catch (err) {
				console.error(`${MODULE_TAG} Failed to load initial credentials:`, err);
				setError('Failed to load credentials');
			} finally {
				setLoading(false);
			}
		};

		loadInitialCredentials();
	}, [flowKey, flowVariant, initializeCredentials]);

	// Listen for shared credential updates
	useEffect(() => {
		const handleSharedCredentialUpdate = async () => {
			console.log(`${MODULE_TAG} Shared credentials updated, refreshing flow credentials`);
			try {
				const updatedCreds = await initializeCredentials();
				setCredentials(updatedCreds);
			} catch (error) {
				console.error(`${MODULE_TAG} Failed to refresh credentials after shared update:`, error);
			}
		};

		window.addEventListener('unifiedSharedCredentialsUpdated', handleSharedCredentialUpdate as EventListener);

		return () => {
			window.removeEventListener('unifiedSharedCredentialsUpdated', handleSharedCredentialUpdate as EventListener);
		};
	}, [flowKey, flowVariant, initializeCredentials]);

	// Update credentials
	const updateCredentials = useCallback((updates: Partial<StepCredentials>) => {
		const updatedCredentials = { ...credentials, ...updates };
		setCredentials(updatedCredentials);

		// Save flow-specific credentials
		FlowCredentialService.saveCredentials(flowKey, updatedCredentials);

		// Save shared credentials if OAuth credentials are updated
		if (updates.environmentId || updates.clientId || updates.clientSecret || updates.issuerUrl) {
			saveOAuthCredentials({
				clientId: updatedCredentials.clientId,
				clientSecret: updatedCredentials.clientSecret,
				issuerUrl: updatedCredentials.issuerUrl,
				clientAuthMethod: updatedCredentials.clientAuthMethod,
			}, `AuthorizationCodeFlowV7-${flowKey}`);
		}

		// Save Environment ID if updated
		if (updates.environmentId) {
			saveEnvironmentId(updates.environmentId, `AuthorizationCodeFlowV7-${flowKey}`);
		}

		// Debug logging
		if (enableDebugger) {
			enhancedDebugger.log('Credentials Updated', {
				flowKey,
				updates,
				fullCredentials: updatedCredentials,
				credentialStatus: getCredentialStatus(),
			});
		}
	}, [credentials, flowKey, saveEnvironmentId, saveOAuthCredentials, enableDebugger, getCredentialStatus]);

	// Update configuration
	const updateConfig = useCallback((updates: Partial<FlowConfig>) => {
		const updatedConfig = { ...flowConfig, ...updates };
		setFlowConfig(updatedConfig);

		if (enableDebugger) {
			enhancedDebugger.log('Configuration Updated', {
				flowKey,
				updates,
				fullConfig: updatedConfig,
			});
		}
	}, [flowConfig, flowKey, enableDebugger]);

	// Generate PKCE codes
	const generatePKCECodes = useCallback(async () => {
		try {
			setLoading(true);
			const codeVerifier = generateCodeVerifier();
			const codeChallenge = await generateCodeChallenge(codeVerifier);
			
			setPkceCodes({ codeVerifier, codeChallenge });
			
			// Save PKCE codes
			credentialManager.savePKCECodes(flowKey, { codeVerifier, codeChallenge });
			
			console.log(`${MODULE_TAG} PKCE codes generated and saved`);
			
			if (enableDebugger) {
				enhancedDebugger.log('PKCE Codes Generated', {
					flowKey,
					codeVerifier: codeVerifier.substring(0, 10) + '...',
					codeChallenge: codeChallenge.substring(0, 20) + '...',
				});
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to generate PKCE codes:`, error);
			setError('Failed to generate PKCE codes');
			throw error;
		} finally {
			setLoading(false);
		}
	}, [flowKey, enableDebugger]);

	// Validate and proceed
	const validateAndProceed = useCallback(async (): Promise<boolean> => {
		try {
			setLoading(true);
			setError(null);

			// Validate required fields
			if (!credentials.environmentId) {
				setError('Environment ID is required');
				return false;
			}

			if (!credentials.clientId) {
				setError('Client ID is required');
				return false;
			}

			// Validate redirect URI if required
			if (flowVariant === 'oauth' && !credentials.redirectUri) {
				setError('Redirect URI is required for OAuth flow');
				return false;
			}

			// Validate PKCE for OAuth
			if (flowVariant === 'oauth' && !pkceCodes.codeVerifier) {
				setError('PKCE codes are required for OAuth flow');
				return false;
			}

			// Validate scopes for OIDC
			if (flowVariant === 'oidc' && (!credentials.scopes || credentials.scopes.length === 0)) {
				setError('Scopes are required for OIDC flow');
				return false;
			}

			// Additional validation can be added here
			console.log(`${MODULE_TAG} ✅ Validation passed`);
			return true;

		} catch (error) {
			console.error(`${MODULE_TAG} Validation failed:`, error);
			setError('Validation failed');
			return false;
		} finally {
			setLoading(false);
		}
	}, [credentials, flowVariant, pkceCodes.codeVerifier]);

	// Set error
	const setErrorState = useCallback((error: string | null) => {
		setError(error);
	}, []);

	// Clear error
	const clearError = useCallback(() => {
		setError(null);
	}, []);

	// Reset flow
	const reset = useCallback(() => {
		console.log(`${MODULE_TAG} Resetting flow`);
		
		// Reset to initial state
		const initialCreds = FlowCredentialService.loadCredentials(flowKey, {
			flowKey,
			flowType: flowVariant,
			includeClientSecret: true,
			includeRedirectUri: true,
			includeLogoutUri: false,
			includeScopes: true,
			defaultScopes: flowVariant === 'oidc' ? 'openid profile email' : '',
			defaultRedirectUri: 'http://localhost:3000/callback',
		});
		
		setCredentials(initialCreds);
		setPkceCodes({ codeVerifier: '', codeChallenge: '' });
		setError(null);
		setLoading(false);
		
		// Clear PKCE codes
		credentialManager.clearPKCECodes(flowKey);
		
		// Clear redirect URI
		clearRedirectUri(flowKey);
		
		if (enableDebugger) {
			enhancedDebugger.log('Flow Reset', { flowKey, flowVariant });
		}
	}, [flowKey, flowVariant, enableDebugger]);

	return {
		state: {
			credentials,
			pkceCodes,
			loading,
			error,
			flowVariant,
			config: flowConfig,
			debugInfo,
		},
		actions: {
			updateCredentials,
			updateConfig,
			setError: setErrorState,
			clearError,
			reset,
			generatePKCECodes,
			validateAndProceed,
		},
	};
}
