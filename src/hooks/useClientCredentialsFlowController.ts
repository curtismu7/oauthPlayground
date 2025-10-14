// src/hooks/useClientCredentialsFlowController.ts
// V5 Controller for Client Credentials Flow (OAuth 2.0 & OIDC-compatible)

import { useCallback, useEffect, useState } from 'react';
import type { StepCredentials } from '../components/steps/CommonSteps';
import { trackTokenOperation } from '../utils/activityTracker';
import { credentialManager } from '../utils/credentialManager';
import { useFlowStepManager } from '../utils/flowStepSystem';
import { safeJsonParse, safeLocalStorageParse } from '../utils/secureJson';
import { storeOAuthTokens } from '../utils/tokenStorage';
import { showGlobalError, showGlobalSuccess } from './useNotifications';
import { useAuthorizationFlowScroll } from './usePageScroll';
import { FlowCredentialService } from '../services/flowCredentialService';

export type FlowVariant = 'oauth' | 'oidc';

export type ClientAuthMethod =
	| 'client_secret_post'
	| 'client_secret_basic'
	| 'client_secret_jwt'
	| 'private_key_jwt'
	| 'tls_client_auth'
	| 'none';

export interface ClientCredentialsConfig {
	issuer: string;
	clientId: string;
	clientSecret?: string;
	authMethod: ClientAuthMethod;
	scopes: string;
	audience?: string;
	resource?: string;
	tokenEndpoint?: string;

	// JWT assertion settings
	jwtSigningAlg?: string;
	jwtSigningKid?: string;
	jwtPrivateKey?: string;

	// mTLS settings
	enableMtls?: boolean;
	mtlsCert?: string;
	mtlsKey?: string;

	// Token lifetime settings
	accessTokenLifetime?: number;
	refreshTokenLifetime?: number;

	// Security settings
	includeX5tParameter?: boolean;
}

export interface ClientCredentialsTokens {
	access_token: string;
	token_type: string;
	expires_in?: number;
	scope?: string;
	refresh_token?: string;
	issued_at?: number;
}

export interface DecodedJWT {
	header: {
		alg?: string;
		typ?: string;
		kid?: string;
		[key: string]: unknown;
	};
	payload: {
		iss?: string;
		sub?: string;
		aud?: string | string[];
		exp?: number;
		iat?: number;
		nbf?: number;
		jti?: string;
		scope?: string;
		client_id?: string;
		[key: string]: unknown;
	};
	signature: string;
}

export interface ClientCredentialsFlowController {
	flowVariant: FlowVariant;
	setFlowVariant: (variant: FlowVariant) => void;
	persistKey: string;
	credentials: StepCredentials;
	setCredentials: (creds: StepCredentials) => void;
	setFlowConfig: (config: ClientCredentialsConfig) => void;
	flowConfig: ClientCredentialsConfig;
	handleFlowConfigChange: (config: ClientCredentialsConfig) => void;

	// Token operations
	tokens: ClientCredentialsTokens | null;
	decodedToken: DecodedJWT | null;
	isRequesting: boolean;
	isLoading: boolean;
	setIsLoading: (value: boolean) => void;
	requestToken: () => Promise<void>;
	introspectToken: () => Promise<void>;
	setTokens: (tokens: ClientCredentialsTokens | null) => void;

	// Flow control
	resetFlow: () => void;
	reset: () => void;
	isSavingCredentials: boolean;
	hasCredentialsSaved: boolean;
	hasUnsavedCredentialChanges: boolean;
	saveCredentials: () => Promise<void>;
	hasValidCredentials: boolean;

	// Utilities
	handleCopy: (text: string, label: string) => void;
	copiedField: string | null;
	formatExpiry: (expiresIn: number) => string;
	isTokenExpired: () => boolean;

	// Step management
	stepManager: ReturnType<typeof useFlowStepManager>;
	saveStepResult: (stepId: string, result: unknown) => void;
	hasStepResult: (stepId: string) => boolean;
	clearStepResults: () => void;
}

export interface ClientCredentialsFlowControllerOptions {
	flowKey?: string;
	defaultFlowVariant?: FlowVariant;
}

const DEFAULT_FLOW_KEY = 'client-credentials-v5';

const createEmptyCredentials = (): StepCredentials => ({
	environmentId: '',
	clientId: '',
	clientSecret: '',
	redirectUri: '', // Not used in Client Credentials
	scope: 'openid',
	scopes: 'openid',
	responseType: '', // Not used in Client Credentials
	grantType: 'client_credentials',
	authorizationEndpoint: '', // Not used in Client Credentials
	tokenEndpoint: '',
	clientAuthMethod: 'client_secret_post',
});

const createEmptyConfig = (): ClientCredentialsConfig => ({
	issuer: 'https://auth.pingone.com/',
	clientId: '',
	clientSecret: '',
	authMethod: 'client_secret_post',
	scopes: 'openid',
	audience: '',
	resource: '',
	tokenEndpoint: '',
	jwtSigningAlg: 'HS256',
	jwtSigningKid: '',
	jwtPrivateKey: '',
	enableMtls: false,
	mtlsCert: '',
	mtlsKey: '',
	accessTokenLifetime: 3600,
	refreshTokenLifetime: 86400,
});

// Helper: Base64 URL decode
const base64UrlDecode = (str: string): string => {
	let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
	while (base64.length % 4) {
		base64 += '=';
	}
	return atob(base64);
};

// Helper: Decode JWT
const decodeJWT = (token: string): DecodedJWT | null => {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) return null;

		const header = JSON.parse(base64UrlDecode(parts[0]));
		const payload = JSON.parse(base64UrlDecode(parts[1]));
		const signature = parts[2];

		return { header, payload, signature };
	} catch (error) {
		console.error('Failed to decode JWT:', error);
		return null;
	}
};

// Helper: Apply client authentication
const applyClientAuthentication = async (
	config: ClientCredentialsConfig,
	requestBody: URLSearchParams
): Promise<{ headers: Record<string, string>; body: string }> => {
	const headers: Record<string, string> = {
		'Content-Type': 'application/x-www-form-urlencoded',
	};

	let body = requestBody.toString();

	switch (config.authMethod) {
		case 'client_secret_basic': {
			const credentials = btoa(`${config.clientId}:${config.clientSecret || ''}`);
			headers['Authorization'] = `Basic ${credentials}`;
			break;
		}
		case 'client_secret_post': {
			requestBody.append('client_id', config.clientId);
			if (config.clientSecret) {
				requestBody.append('client_secret', config.clientSecret);
			}
			body = requestBody.toString();
			break;
		}
		case 'client_secret_jwt':
		case 'private_key_jwt': {
			requestBody.append('client_id', config.clientId);
			requestBody.append(
				'client_assertion_type',
				'urn:ietf:params:oauth:client-assertion-type:jwt-bearer'
			);
			// In a real implementation, you would generate the JWT assertion here
			requestBody.append('client_assertion', '[JWT_ASSERTION_PLACEHOLDER]');
			body = requestBody.toString();
			break;
		}
		case 'tls_client_auth': {
			requestBody.append('client_id', config.clientId);
			body = requestBody.toString();
			break;
		}
		case 'none': {
			requestBody.append('client_id', config.clientId);
			body = requestBody.toString();
			break;
		}
	}

	return { headers, body };
};

export const useClientCredentialsFlowController = (
	options: ClientCredentialsFlowControllerOptions = {}
): ClientCredentialsFlowController => {
	const { flowKey = DEFAULT_FLOW_KEY, defaultFlowVariant = 'oauth' } = options;

	const persistKey = `client-credentials-${flowKey}`;
	const { scrollToTopAfterAction } = useAuthorizationFlowScroll('Client Credentials Flow V5');

	// Flow state
	const [flowVariant, setFlowVariant] = useState<FlowVariant>(defaultFlowVariant);
	const [credentials, setCredentials] = useState<StepCredentials>(createEmptyCredentials);
	const [flowConfig, setFlowConfig] = useState<ClientCredentialsConfig>(createEmptyConfig);
	const [tokens, setTokens] = useState<ClientCredentialsTokens | null>(null);
	const [decodedToken, setDecodedToken] = useState<DecodedJWT | null>(null);
	const [isRequesting, setIsRequesting] = useState(false);
	const [isSavingCredentials, setIsSavingCredentials] = useState(false);
	const [hasCredentialsSaved, setHasCredentialsSaved] = useState(false);
	const [hasUnsavedCredentialChanges, setHasUnsavedCredentialChanges] = useState(false);
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const [hasValidCredentials, setHasValidCredentials] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	// Step management
	const stepManager = useFlowStepManager({
		flowType: 'client-credentials',
		persistKey,
		defaultStep: 0,
	});

	// Load credentials and flow state on mount using FlowCredentialService
	useEffect(() => {
		const loadData = async () => {
			try {
				const { credentials: loadedCreds, flowState, hasSharedCredentials } = 
					await FlowCredentialService.loadFlowCredentials<ClientCredentialsConfig>({
						flowKey: persistKey,
						defaultCredentials: {
							...createEmptyCredentials(),
							grantType: 'client_credentials',
						},
					});

				// Load credentials
				if (loadedCreds) {
					setCredentials(loadedCreds);
					setHasCredentialsSaved(true);
				}

				// Load flow-specific state
				if (flowState) {
					if (flowState.flowConfig) setFlowConfig(flowState.flowConfig);
					if (flowState.tokens) setTokens(flowState.tokens as ClientCredentialsTokens);
					if (flowState.flowVariant) setFlowVariant(flowState.flowVariant as FlowVariant);
				}
				
				console.log('[ClientCredsController] Loaded data:', {
					hasSharedCredentials,
					hasFlowState: !!flowState,
					environmentId: loadedCreds?.environmentId,
					clientId: loadedCreds?.clientId,
				});
			} catch (error) {
				console.error('[ClientCredsController] Failed to load data:', error);
			}
		};

		loadData();
	}, [persistKey]);

	// Save state when it changes (debounced)
	useEffect(() => {
		const debounceTimer = setTimeout(() => {
			const state = {
				credentials,
				flowConfig,
				tokens,
				flowVariant,
			};
			localStorage.setItem(persistKey, JSON.stringify(state));
		}, 500); // Debounce by 500ms
		
		return () => clearTimeout(debounceTimer);
	}, [credentials, flowConfig, tokens, flowVariant, persistKey]);

	// Track credential changes
	useEffect(() => {
		const hasChanges =
			credentials.clientId !== '' ||
			credentials.clientSecret !== '' ||
			credentials.environmentId !== '' ||
			flowConfig.issuer !== createEmptyConfig().issuer ||
			flowConfig.scopes !== createEmptyConfig().scopes;

		setHasUnsavedCredentialChanges(hasChanges);
	}, [credentials, flowConfig]);

	// Handle flow config changes
	const handleFlowConfigChange = useCallback((config: ClientCredentialsConfig) => {
		setFlowConfig(config);

		// Update credentials to match config
		setCredentials((prev) => ({
			...prev,
			clientId: config.clientId,
			clientSecret: config.clientSecret || '',
			environmentId: config.issuer.includes('pingone.com')
				? config.issuer.split('/').slice(-2, -1)[0] || ''
				: '',
			tokenEndpoint: config.tokenEndpoint || `${config.issuer}/as/token`,
			scope: config.scopes,
			scopes: config.scopes,
		}));
	}, []);

	// Request token
	const requestToken = useCallback(async () => {
		if (!flowConfig.clientId || !flowConfig.clientSecret) {
			showGlobalError('Client ID and Client Secret are required');
			return;
		}

		setIsRequesting(true);
		console.log('Requesting access token...', {
			authMethod: flowConfig.authMethod,
			scopes: flowConfig.scopes,
			audience: flowConfig.audience,
			resource: flowConfig.resource,
		});

		try {
			const tokenEndpoint = flowConfig.tokenEndpoint || `${flowConfig.issuer}/as/token`;

			// Build request body
			const requestBody = new URLSearchParams();
			requestBody.append('grant_type', 'client_credentials');
			if (flowConfig.scopes) requestBody.append('scope', flowConfig.scopes);
			if (flowConfig.audience) requestBody.append('audience', flowConfig.audience);
			if (flowConfig.resource) requestBody.append('resource', flowConfig.resource);
			if (flowConfig.includeX5tParameter) requestBody.append('request_x5t', 'true');

			// Apply client authentication
			const { headers, body } = await applyClientAuthentication(flowConfig, requestBody);

			console.log('Token endpoint:', tokenEndpoint);
			console.log('Request headers:', headers);
			console.log('Request body:', body);

			const response = await fetch(tokenEndpoint, {
				method: 'POST',
				headers,
				body,
			});

			const responseData = await response.json();

			if (!response.ok) {
				throw new Error(
					responseData.error_description || responseData.error || 'Token request failed'
				);
			}

			// Store tokens
			const tokenData: ClientCredentialsTokens = {
				access_token: responseData.access_token,
				token_type: responseData.token_type || 'Bearer',
				expires_in: responseData.expires_in,
				scope: responseData.scope,
				refresh_token: responseData.refresh_token,
				issued_at: Math.floor(Date.now() / 1000),
			};

			setTokens(tokenData);
			setDecodedToken(decodeJWT(tokenData.access_token));

			// Store in global token storage
			await storeOAuthTokens(
				{
					...tokenData,
					expires_in: tokenData.expires_in || 3600,
					scope: tokenData.scope || '',
				},
				'client-credentials'
			);

			// Track the operation
			trackTokenOperation(
				'client-credentials',
				true,
				JSON.stringify({
					tokenType: tokenData.token_type,
					expiresIn: tokenData.expires_in || 3600,
					scope: tokenData.scope || '',
				})
			);

			showGlobalSuccess('Access token retrieved successfully!');
			console.log('Token request successful:', tokenData);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			showGlobalError(`Token request failed: ${errorMessage}`);
			console.error('Token request failed:', error);
		} finally {
			setIsRequesting(false);
		}
	}, [flowConfig]);

	// Introspect token
	const introspectToken = useCallback(async () => {
		if (!tokens?.access_token) {
			showGlobalError('No access token available for introspection');
			return;
		}

		// This would typically call a token introspection endpoint
		// For now, we'll just decode the JWT if it's a JWT
		if (decodedToken) {
			showGlobalSuccess('Token introspection completed (JWT decoded)');
		} else {
			showGlobalError('Token introspection not available for opaque tokens');
		}
	}, [tokens, decodedToken]);

	// Save credentials using FlowCredentialService
	const saveCredentials = useCallback(async () => {
		setIsSavingCredentials(true);

		try {
			const success = await FlowCredentialService.saveFlowCredentials(
				persistKey,
				credentials,
				flowConfig,
				{
					flowVariant,
					tokens,
				}
			);

			if (success) {
				setHasCredentialsSaved(true);
			}
		} catch (error) {
			showGlobalError('Failed to save credentials');
			console.error('[ClientCredsController] Save credentials error:', error);
		} finally {
			setIsSavingCredentials(false);
		}
	}, [credentials, flowConfig, flowVariant, tokens, persistKey]);

	// Reset flow
	const resetFlow = useCallback(() => {
		// Reset flow state but preserve credentials
		setFlowConfig(createEmptyConfig());
		setTokens(null);
		setDecodedToken(null);
		setHasUnsavedCredentialChanges(false);
		stepManager.resetFlow();
		scrollToTopAfterAction();
		showGlobalSuccess('Flow reset successfully. Credentials preserved.');
	}, [stepManager, scrollToTopAfterAction]);

	// Copy handler
	const handleCopy = useCallback((text: string, label: string) => {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				setCopiedField(label);
				showGlobalSuccess(`${label} copied to clipboard!`);
				setTimeout(() => setCopiedField(null), 2000);
			})
			.catch(() => {
				showGlobalError('Failed to copy to clipboard');
			});
	}, []);

	// Utility functions
	const formatExpiry = useCallback((expiresIn: number): string => {
		const now = Math.floor(Date.now() / 1000);
		const expiry = now + expiresIn;
		return new Date(expiry * 1000).toLocaleString();
	}, []);

	const isTokenExpired = useCallback((): boolean => {
		if (!tokens?.expires_in || !tokens?.issued_at) return false;
		const now = Math.floor(Date.now() / 1000);
		return now >= tokens.issued_at + tokens.expires_in;
	}, [tokens]);

	// Step management functions
	const saveStepResult = useCallback(
		(stepId: string, result: unknown) => {
			// Store step result in localStorage for persistence
			const stepResults = safeLocalStorageParse<Record<string, unknown>>(
				`${persistKey}-step-results`,
				{}
			);
			stepResults[stepId] = result;
			localStorage.setItem(`${persistKey}-step-results`, JSON.stringify(stepResults));
		},
		[persistKey]
	);

	const hasStepResult = useCallback(
		(stepId: string): boolean => {
			const stepResults = safeLocalStorageParse<Record<string, unknown>>(
				`${persistKey}-step-results`,
				{}
			);
			return stepResults[stepId] !== undefined;
		},
		[persistKey]
	);

	const clearStepResults = useCallback(() => {
		localStorage.removeItem(`${persistKey}-step-results`);
	}, [persistKey]);

	useEffect(() => {
		const trimmedEnv = credentials.environmentId?.trim();
		const trimmedClientId = credentials.clientId?.trim();
		const trimmedClientSecret = credentials.clientSecret?.trim();
		const trimmedConfigSecret = flowConfig.clientSecret?.trim();
		const trimmedPrivateKey = flowConfig.jwtPrivateKey?.trim();
		const trimmedMtlsCert = flowConfig.mtlsCert?.trim();
		const trimmedMtlsKey = flowConfig.mtlsKey?.trim();
		const authMethod = (credentials.clientAuthMethod || flowConfig.authMethod || 'client_secret_post') as ClientAuthMethod;

		const baseRequirementsMet = Boolean(trimmedEnv && trimmedClientId);

		let authRequirementsMet = false;
		switch (authMethod) {
			case 'client_secret_post':
			case 'client_secret_basic':
			case 'client_secret_jwt':
				authRequirementsMet = Boolean(trimmedClientSecret || trimmedConfigSecret);
				break;
			case 'private_key_jwt':
				authRequirementsMet = Boolean(trimmedPrivateKey);
				break;
			case 'tls_client_auth':
				authRequirementsMet = Boolean(trimmedMtlsCert && trimmedMtlsKey);
				break;
			case 'none':
			default:
				authRequirementsMet = true;
		}

		setHasValidCredentials(baseRequirementsMet && authRequirementsMet);
	}, [credentials, flowConfig]);

	return {
		flowVariant,
		setFlowVariant,
		persistKey,
		credentials,
		setCredentials,
		setFlowConfig,
		flowConfig,
		handleFlowConfigChange,
		tokens,
		decodedToken,
		isRequesting,
		requestToken,
		introspectToken,
		setTokens,
		isLoading,
		setIsLoading,
		resetFlow,
		reset: resetFlow,
		isSavingCredentials,
		hasCredentialsSaved,
		hasUnsavedCredentialChanges,
		saveCredentials,
		hasValidCredentials,
		handleCopy,
		copiedField,
		formatExpiry,
		isTokenExpired,
		stepManager,
		saveStepResult,
		hasStepResult,
		clearStepResults,
	};
};
