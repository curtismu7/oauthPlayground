// src/hooks/useClientCredentialsFlow.ts
// Client Credentials Flow state management and logic (OAuth 2.0 & OIDC-compatible)
import { useCallback, useEffect, useRef, useState } from 'react';
import { safeJsonParse } from '../utils/secureJson';
import { v4ToastManager } from '../utils/v4ToastMessages';

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
}

export interface ClientCredentialsTokens {
	access_token: string;
	token_type: string;
	expires_in?: number;
	scope?: string;
	refresh_token?: string; // Rare but some implementations support it
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

interface UseClientCredentialsFlowReturn {
	// State
	config: ClientCredentialsConfig | null;
	tokens: ClientCredentialsTokens | null;
	decodedToken: DecodedJWT | null;
	isRequesting: boolean;
	error: string | null;

	// Actions
	setConfig: (config: ClientCredentialsConfig) => void;
	requestToken: () => Promise<void>;
	introspectToken: () => Promise<void>;
	reset: () => void;

	// Utilities
	formatExpiry: (expiresIn: number) => string;
	isTokenExpired: () => boolean;
}

const LOG_PREFIX = '[🤝 CLIENT-CREDS]';

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
		if (parts.length !== 3) {
			console.warn(`${LOG_PREFIX} [WARN] Invalid JWT format`);
			return null;
		}

		const header = JSON.parse(base64UrlDecode(parts[0]));
		const payload = JSON.parse(base64UrlDecode(parts[1]));
		const signature = parts[2];

		return { header, payload, signature };
	} catch (error) {
		console.warn(`${LOG_PREFIX} [WARN] Failed to decode JWT:`, error);
		return null;
	}
};

// Helper: Generate JWT assertion for client_secret_jwt or private_key_jwt
const generateJWTAssertion = async (
	config: ClientCredentialsConfig,
	tokenEndpoint: string
): Promise<string> => {
	const now = Math.floor(Date.now() / 1000);
	const header = {
		alg: config.jwtSigningAlg || 'HS256',
		typ: 'JWT',
		...(config.jwtSigningKid && { kid: config.jwtSigningKid }),
	};

	const payload = {
		iss: config.clientId,
		sub: config.clientId,
		aud: tokenEndpoint,
		jti: crypto.randomUUID(),
		exp: now + 300, // 5 minutes
		iat: now,
	};

	// For production: use proper JWT library (jose, jsonwebtoken)
	// For demo: create unsigned or minimally signed JWT
	console.warn(`${LOG_PREFIX} [WARN] JWT assertion generation requires backend implementation`);

	// Placeholder implementation - in production this should use proper crypto
	const headerB64 = btoa(JSON.stringify(header))
		.replace(/=/g, '')
		.replace(/\+/g, '-')
		.replace(/\//g, '_');
	const payloadB64 = btoa(JSON.stringify(payload))
		.replace(/=/g, '')
		.replace(/\+/g, '-')
		.replace(/\//g, '_');

	return `${headerB64}.${payloadB64}.placeholder-signature`;
};

export const useClientCredentialsFlow = (): UseClientCredentialsFlowReturn => {
	const [config, setConfigState] = useState<ClientCredentialsConfig | null>(null);
	const [tokens, setTokens] = useState<ClientCredentialsTokens | null>(null);
	const [decodedToken, setDecodedToken] = useState<DecodedJWT | null>(null);
	const [isRequesting, setIsRequesting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const requestAbortController = useRef<AbortController | null>(null);

	// Load config from localStorage on mount
	useEffect(() => {
		try {
			const savedConfig = localStorage.getItem('client_credentials_config');
			if (savedConfig) {
				const config = safeJsonParse<ClientCredentialsConfig>(savedConfig);
				if (config) {
					setConfigState(config);
					console.log(`${LOG_PREFIX} [INFO] Loaded config from localStorage`);
				}
			}
		} catch (e) {
			console.warn(`${LOG_PREFIX} [WARN] Failed to load config from localStorage:`, e);
		}
	}, []);

	// Load tokens from localStorage on mount
	useEffect(() => {
		try {
			const savedTokens = localStorage.getItem('client_credentials_tokens');
			if (savedTokens) {
				const tokens = safeJsonParse<ClientCredentialsTokens>(savedTokens);
				if (tokens) {
					setTokens(tokens);

					// Decode JWT if it's a JWT
					if (tokens.access_token && tokens.access_token.split('.').length === 3) {
						const decoded = decodeJWT(tokens.access_token);
						setDecodedToken(decoded);
					}

					console.log(`${LOG_PREFIX} [INFO] Loaded tokens from localStorage`);
				}
			}
		} catch (e) {
			console.warn(`${LOG_PREFIX} [WARN] Failed to load tokens from localStorage:`, e);
		}
	}, []);

	const saveDebounceRef = useRef<NodeJS.Timeout | null>(null);

	// Wrapper to persist config to localStorage with debouncing
	const setConfig = useCallback((newConfig: ClientCredentialsConfig) => {
		// Update state immediately for UI responsiveness
		setConfigState(newConfig);

		// Debounce localStorage save to prevent excessive writes
		if (saveDebounceRef.current) {
			clearTimeout(saveDebounceRef.current);
		}

		saveDebounceRef.current = setTimeout(() => {
			try {
				localStorage.setItem('client_credentials_config', JSON.stringify(newConfig));
				console.log(`${LOG_PREFIX} [INFO] Config saved to localStorage`);
			} catch (e) {
				console.warn(`${LOG_PREFIX} [WARN] Failed to save config to localStorage:`, e);
			}
		}, 500); // Wait 500ms after last keystroke before saving
	}, []);

	// Request access token using client credentials
	const requestToken = useCallback(async () => {
		if (!config) {
			const errorMsg = 'Configuration is required';
			console.error(`${LOG_PREFIX} [ERROR] ${errorMsg}`);
			setError(errorMsg);
			v4ToastManager.showError(errorMsg);
			return;
		}

		// Validate required fields
		if (!config.clientId) {
			const errorMsg = 'Client ID is required';
			console.error(`${LOG_PREFIX} [ERROR] ${errorMsg}`);
			setError(errorMsg);
			v4ToastManager.showError(errorMsg);
			return;
		}

		if (config.authMethod !== 'none' && !config.clientSecret && !config.jwtPrivateKey) {
			const errorMsg = 'Client secret or private key is required for authentication';
			console.error(`${LOG_PREFIX} [ERROR] ${errorMsg}`);
			setError(errorMsg);
			v4ToastManager.showError(errorMsg);
			return;
		}

		setIsRequesting(true);
		setError(null);

		// Cancel any existing request
		if (requestAbortController.current) {
			requestAbortController.current.abort();
		}
		requestAbortController.current = new AbortController();

		const timestamp = new Date().toISOString();
		console.log(`${LOG_PREFIX} [INFO] [${timestamp}] Requesting access token...`);
		console.log(`${LOG_PREFIX} [INFO] Auth method: ${config.authMethod}`);
		console.log(`${LOG_PREFIX} [INFO] Scopes: ${config.scopes}`);
		console.log(`${LOG_PREFIX} [INFO] Audience: ${config.audience || 'N/A'}`);
		console.log(`${LOG_PREFIX} [INFO] Resource: ${config.resource || 'N/A'}`);

		try {
			// Determine token endpoint
			const tokenEndpoint = config.tokenEndpoint || `${config.issuer}/as/token`;
			console.log(`${LOG_PREFIX} [INFO] Token endpoint: ${tokenEndpoint}`);

			// Build request body
			const body = new URLSearchParams();
			body.append('grant_type', 'client_credentials');

			if (config.scopes) {
				body.append('scope', config.scopes);
			}

			if (config.audience) {
				body.append('audience', config.audience);
			}

			if (config.resource) {
				body.append('resource', config.resource);
			}

			// Build request headers
			const headers: Record<string, string> = {
				'Content-Type': 'application/x-www-form-urlencoded',
			};

			// Apply client authentication method
			switch (config.authMethod) {
				case 'client_secret_basic': {
					const credentials = btoa(`${config.clientId}:${config.clientSecret}`);
					headers['Authorization'] = `Basic ${credentials}`;
					console.log(`${LOG_PREFIX} [INFO] Using Basic authentication`);
					break;
				}

				case 'client_secret_post': {
					body.append('client_id', config.clientId);
					body.append('client_secret', config.clientSecret || '');
					console.log(`${LOG_PREFIX} [INFO] Using POST body authentication`);
					break;
				}

				case 'client_secret_jwt':
				case 'private_key_jwt': {
					const assertion = await generateJWTAssertion(config, tokenEndpoint);
					body.append('client_id', config.clientId);
					body.append(
						'client_assertion_type',
						'urn:ietf:params:oauth:client-assertion-type:jwt-bearer'
					);
					body.append('client_assertion', assertion);
					console.log(`${LOG_PREFIX} [INFO] Using JWT assertion authentication`);
					break;
				}

				case 'tls_client_auth': {
					body.append('client_id', config.clientId);
					console.log(`${LOG_PREFIX} [INFO] Using mTLS authentication`);
					console.warn(`${LOG_PREFIX} [WARN] mTLS requires proper certificate configuration`);
					break;
				}

				case 'none': {
					body.append('client_id', config.clientId);
					console.log(`${LOG_PREFIX} [INFO] Using no authentication (public client)`);
					break;
				}
			}

			// Make token request
			console.log(`${LOG_PREFIX} [INFO] Sending token request...`);
			const response = await fetch(tokenEndpoint, {
				method: 'POST',
				headers,
				body: body.toString(),
				signal: requestAbortController.current.signal,
			});

			const responseData = await response.json();

			if (!response.ok) {
				const errorMsg =
					responseData.error_description || responseData.error || `HTTP ${response.status}`;
				console.error(`${LOG_PREFIX} [ERROR] Token request failed:`, errorMsg);
				console.error(`${LOG_PREFIX} [ERROR] Response:`, responseData);
				setError(errorMsg);
				v4ToastManager.showError(`Token request failed: ${errorMsg}`);
				return;
			}

			// Success! Store tokens
			const tokenData: ClientCredentialsTokens = {
				...responseData,
				issued_at: Date.now(),
			};

			setTokens(tokenData);

			// Decode JWT if it's a JWT
			if (tokenData.access_token && tokenData.access_token.split('.').length === 3) {
				const decoded = decodeJWT(tokenData.access_token);
				setDecodedToken(decoded);
				console.log(`${LOG_PREFIX} [INFO] JWT decoded successfully`);
				console.log(`${LOG_PREFIX} [INFO] Issuer: ${decoded?.payload.iss || 'N/A'}`);
				console.log(`${LOG_PREFIX} [INFO] Subject: ${decoded?.payload.sub || 'N/A'}`);
				console.log(`${LOG_PREFIX} [INFO] Audience: ${decoded?.payload.aud || 'N/A'}`);
				console.log(
					`${LOG_PREFIX} [INFO] Expiry: ${decoded?.payload.exp ? new Date(decoded.payload.exp * 1000).toISOString() : 'N/A'}`
				);
			} else {
				setDecodedToken(null);
				console.log(`${LOG_PREFIX} [INFO] Access token is opaque (not a JWT)`);
			}

			// Store tokens in localStorage
			try {
				localStorage.setItem('client_credentials_tokens', JSON.stringify(tokenData));
				console.log(`${LOG_PREFIX} [INFO] Tokens saved to localStorage`);
			} catch (e) {
				console.warn(`${LOG_PREFIX} [WARN] Failed to save tokens to localStorage:`, e);
			}

			// Store flow source for Token Management page
			try {
				localStorage.setItem('oauth_tokens', JSON.stringify(tokenData));
				localStorage.setItem('flow_source', 'client-credentials-v5');
				sessionStorage.setItem('flow_source', 'client-credentials-v5');

				// Store comprehensive flow context
				const flowContext = {
					flow: 'client-credentials-v5',
					tokens: tokenData,
					credentials: config,
					timestamp: Date.now(),
				};
				sessionStorage.setItem('tokenManagementFlowContext', JSON.stringify(flowContext));
				localStorage.setItem('tokenManagementFlowContext', JSON.stringify(flowContext));

				console.log(`${LOG_PREFIX} [INFO] Flow source and context saved for Token Management`);
			} catch (e) {
				console.warn(`${LOG_PREFIX} [WARN] Failed to save flow context:`, e);
			}

			console.log(`${LOG_PREFIX} [INFO] ✅ Token request successful!`);
			console.log(`${LOG_PREFIX} [INFO] Token type: ${tokenData.token_type}`);
			console.log(`${LOG_PREFIX} [INFO] Expires in: ${tokenData.expires_in || 'N/A'} seconds`);
			console.log(`${LOG_PREFIX} [INFO] Scope: ${tokenData.scope || 'N/A'}`);

			v4ToastManager.showSuccess('Access token received successfully!');
		} catch (error) {
			if (error instanceof Error) {
				if (error.name === 'AbortError') {
					console.log(`${LOG_PREFIX} [INFO] Token request cancelled`);
					return;
				}
				console.error(`${LOG_PREFIX} [ERROR] Token request failed:`, error.message);
				setError(error.message);
				v4ToastManager.showError(`Token request failed: ${error.message}`);
			} else {
				console.error(`${LOG_PREFIX} [ERROR] Unknown error:`, error);
				setError('Unknown error occurred');
				v4ToastManager.showError('An unknown error occurred');
			}
		} finally {
			setIsRequesting(false);
		}
	}, [config]);

	// Introspect token (for opaque tokens or validation)
	const introspectToken = useCallback(async () => {
		if (!tokens || !config) {
			v4ToastManager.showError('No token available to introspect');
			return;
		}

		console.log(`${LOG_PREFIX} [INFO] Token introspection not yet implemented`);
		v4ToastManager.showSuccess('Navigate to Token Management page for introspection');
	}, [tokens, config]);

	// Reset flow
	const reset = useCallback(() => {
		setTokens(null);
		setDecodedToken(null);
		setError(null);

		try {
			localStorage.removeItem('client_credentials_tokens');
			console.log(`${LOG_PREFIX} [INFO] Tokens cleared from localStorage`);
		} catch (e) {
			console.warn(`${LOG_PREFIX} [WARN] Failed to clear tokens from localStorage:`, e);
		}

		v4ToastManager.showSuccess('Flow reset');
	}, []);

	// Format expiry time
	const formatExpiry = useCallback((expiresIn: number): string => {
		if (expiresIn < 60) {
			return `${expiresIn}s`;
		} else if (expiresIn < 3600) {
			return `${Math.floor(expiresIn / 60)}m`;
		} else {
			return `${Math.floor(expiresIn / 3600)}h`;
		}
	}, []);

	// Check if token is expired
	const isTokenExpired = useCallback((): boolean => {
		if (!tokens || !tokens.issued_at || !tokens.expires_in) {
			return false;
		}

		const expiryTime = tokens.issued_at + tokens.expires_in * 1000;
		return Date.now() >= expiryTime;
	}, [tokens]);

	return {
		config,
		tokens,
		decodedToken,
		isRequesting,
		error,
		setConfig,
		requestToken,
		introspectToken,
		reset,
		formatExpiry,
		isTokenExpired,
	};
};
