// src/hooks/useJWTBearerFlowController.ts
// JWT Bearer Token Flow state management and logic

import { useCallback, useEffect, useState } from 'react';
import { credentialManager } from '../utils/credentialManager';

export interface JWTBearerConfig {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	audience: string;
	subject: string;
	privateKey?: string;
	keyId?: string;
	tokenEndpoint?: string;
	redirectUri?: string;
	scopes?: string[];
	authEndpoint?: string;
	userInfoEndpoint?: string;
	endSessionEndpoint?: string;
	tokenAuthMethod?: string;
}

export interface JWTBearerResult {
	access_token: string;
	token_type: string;
	expires_in?: number;
	scope?: string;
}

interface UseJWTBearerFlowControllerReturn {
	// State
	credentials: JWTBearerConfig;
	tokens: JWTBearerResult | null;
	isRequesting: boolean;
	error: string | null;

	// Actions
	updateCredentials: (credentials: Partial<JWTBearerConfig>) => void;
	requestToken: () => Promise<JWTBearerResult>;
	saveCredentials: () => boolean;
	clearResults: () => void;
}

const LOG_PREFIX = '[🔑 JWT-BEARER]';
const FLOW_TYPE = 'jwt-bearer-token-v5';

export const useJWTBearerFlowController = (): UseJWTBearerFlowControllerReturn => {
	const [credentials, setCredentials] = useState<JWTBearerConfig>({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		audience: '',
		subject: '',
		tokenEndpoint: '',
		redirectUri: '',
		scopes: ['openid'],
	});
	const [tokens, setTokens] = useState<JWTBearerResult | null>(null);
	const [isRequesting, setIsRequesting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Load JWT Bearer Token specific credentials (no fallback to global config)
	useEffect(() => {
		try {
			// Load JWT Bearer Token specific credentials only
			const jwtBearerCredentials = credentialManager.loadFlowCredentials(FLOW_TYPE);

			// Use JWT Bearer specific credentials, or defaults if none exist
			const flowCredentials: JWTBearerConfig = {
				environmentId: jwtBearerCredentials?.environmentId || '',
				clientId: jwtBearerCredentials?.clientId || '',
				clientSecret: jwtBearerCredentials?.clientSecret || '',
				audience: jwtBearerCredentials?.audience || '',
				subject: jwtBearerCredentials?.subject || '',
				privateKey: jwtBearerCredentials?.privateKey || '',
				keyId: jwtBearerCredentials?.keyId || '',
				tokenEndpoint: jwtBearerCredentials?.tokenEndpoint || '',
				redirectUri:
					jwtBearerCredentials?.redirectUri || `${window.location.origin}/authz-callback`,
				scopes: jwtBearerCredentials?.scopes || ['openid'],
				authEndpoint: jwtBearerCredentials?.authEndpoint || '',
				userInfoEndpoint: jwtBearerCredentials?.userInfoEndpoint || '',
				endSessionEndpoint: jwtBearerCredentials?.endSessionEndpoint || '',
				tokenAuthMethod: jwtBearerCredentials?.tokenAuthMethod || '',
			};

			setCredentials(flowCredentials);
			console.log(`${LOG_PREFIX} Loaded JWT Bearer Token credentials`, {
				hasCredentials: !!jwtBearerCredentials?.clientId,
				hasPrivateKey: !!jwtBearerCredentials?.privateKey,
			});
		} catch (err) {
			console.error(`${LOG_PREFIX} Failed to load JWT Bearer Token credentials`, err);
		}
	}, []);

	const updateCredentials = useCallback((newCredentials: Partial<JWTBearerConfig>) => {
		setCredentials((prev) => ({ ...prev, ...newCredentials }));
	}, []);

	const requestToken = useCallback(async (): Promise<JWTBearerResult> => {
		if (!credentials.clientId || !credentials.privateKey || !credentials.environmentId) {
			throw new Error(
				'Missing required credentials: environmentId, clientId and privateKey are required'
			);
		}

		setIsRequesting(true);
		setError(null);

		try {
			console.log(`${LOG_PREFIX} [MOCK] Simulating JWT Bearer Token flow...`);

			// Simulate processing delay
			await new Promise((resolve) => setTimeout(resolve, 1500));

			// Validate private key format (basic check)
			const privateKeyPem = credentials.privateKey;
			if (
				!privateKeyPem.includes('-----BEGIN PRIVATE KEY-----') ||
				!privateKeyPem.includes('-----END PRIVATE KEY-----')
			) {
				throw new Error(
					'Invalid private key format. Please ensure it includes proper PEM headers.'
				);
			}

			// Generate mock JWT assertion (for display purposes)
			const now = Math.floor(Date.now() / 1000);
			const mockJWT = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJtb2NrLWNsaWVudC1pZCIsInN1YiI6Im1vY2stdXNlciIsImF1ZCI6Im1vY2stYXVkaWVuY2UiLCJqdGkiOiJtb2NrLWp0aSIsImV4cCI6${now + 3600}LCJpYXQiOi${now}}.mock-signature`;

			// Generate realistic mock token response
			const mockTokenResult: JWTBearerResult = {
				access_token: `mock_access_token_${Date.now()}_${Math.random().toString(36).substring(2)}`,
				token_type: 'Bearer',
				expires_in: 3600,
				scope: 'openid profile email',
			};

			setTokens(mockTokenResult);

			console.log(
				`${LOG_PREFIX} [MOCK SUCCESS] JWT Bearer token simulation completed:`,
				mockTokenResult
			);
			console.log(`${LOG_PREFIX} [MOCK INFO] Simulated JWT assertion:`, mockJWT);

			// Show success message
			v4ToastManager.showSuccess(
				'JWT Bearer Token flow completed successfully (Mock Implementation)'
			);

			return mockTokenResult;
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'JWT Bearer token request failed';
			setError(errorMessage);
			console.error(`${LOG_PREFIX} [MOCK ERROR] JWT Bearer token simulation failed:`, err);
			throw err;
		} finally {
			setIsRequesting(false);
		}
	}, [credentials]);

	const clearResults = useCallback(() => {
		setTokens(null);
		setError(null);
	}, []);

	const saveCredentials = useCallback(() => {
		try {
			// Save JWT Bearer Token specific credentials only (no global config)
			const jwtBearerSuccess = credentialManager.saveFlowCredentials(FLOW_TYPE, {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				clientSecret: credentials.clientSecret,
				privateKey: credentials.privateKey,
				keyId: credentials.keyId,
				audience: credentials.audience,
				subject: credentials.subject,
				tokenEndpoint: credentials.tokenEndpoint,
				redirectUri: credentials.redirectUri,
				scopes: credentials.scopes,
				authEndpoint: credentials.authEndpoint,
				userInfoEndpoint: credentials.userInfoEndpoint,
				endSessionEndpoint: credentials.endSessionEndpoint,
				tokenAuthMethod: credentials.tokenAuthMethod,
			});

			if (jwtBearerSuccess) {
				console.log(`${LOG_PREFIX} Saved JWT Bearer Token credentials to flow-specific storage`);
				return true;
			} else {
				console.error(`${LOG_PREFIX} Failed to save JWT Bearer Token credentials`);
				return false;
			}
		} catch (err) {
			console.error(`${LOG_PREFIX} Failed to save JWT Bearer Token credentials`, err);
			return false;
		}
	}, [credentials]);

	return {
		credentials,
		tokens,
		isRequesting,
		error,
		updateCredentials,
		requestToken,
		saveCredentials,
		clearResults,
	};
};
