// src/hooks/useJWTBearerFlowController.ts
// JWT Bearer Token Flow state management and logic

import { useCallback, useState } from 'react';

export interface JWTBearerConfig {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	audience: string;
	subject: string;
	privateKey?: string;
	keyId?: string;
	tokenEndpoint?: string;
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
	clearResults: () => void;
}

const LOG_PREFIX = '[🔑 JWT-BEARER]';

export const useJWTBearerFlowController = (): UseJWTBearerFlowControllerReturn => {
	const [credentials, setCredentials] = useState<JWTBearerConfig>({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		audience: '',
		subject: '',
		tokenEndpoint: '',
	});
	const [tokens, setTokens] = useState<JWTBearerResult | null>(null);
	const [isRequesting, setIsRequesting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const updateCredentials = useCallback((newCredentials: Partial<JWTBearerConfig>) => {
		setCredentials(prev => ({ ...prev, ...newCredentials }));
	}, []);

	const requestToken = useCallback(async (): Promise<JWTBearerResult> => {
		if (!credentials.environmentId || !credentials.clientId || !credentials.clientSecret || !credentials.audience || !credentials.subject) {
			throw new Error('Missing required credentials');
		}

		setIsRequesting(true);
		setError(null);

		try {
			const tokenEndpoint = credentials.tokenEndpoint || 
				`https://auth.pingone.com/${credentials.environmentId}/as/token`;

			// Generate JWT assertion
			const now = Math.floor(Date.now() / 1000);
			const header = {
				alg: 'HS256',
				typ: 'JWT',
			};

			const payload = {
				iss: credentials.clientId,
				sub: credentials.subject,
				aud: credentials.audience,
				jti: crypto.randomUUID(),
				exp: now + 300, // 5 minutes
				iat: now,
			};

			// Create JWT (simplified for demo - in production use proper JWT library)
			const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
			const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
			const assertion = `${headerB64}.${payloadB64}.signature_placeholder`;

			const response = await fetch(tokenEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
					assertion: assertion,
					scope: 'openid profile email',
				}),
			});

			if (!response.ok) {
				throw new Error(`JWT Bearer token request failed: ${response.status} ${response.statusText}`);
			}

			const result: JWTBearerResult = await response.json();
			setTokens(result);
			
			console.log(`${LOG_PREFIX} [SUCCESS] JWT Bearer token obtained:`, result);
			return result;

		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'JWT Bearer token request failed';
			setError(errorMessage);
			console.error(`${LOG_PREFIX} [ERROR] JWT Bearer token request failed:`, err);
			throw err;
		} finally {
			setIsRequesting(false);
		}
	}, [credentials]);

	const clearResults = useCallback(() => {
		setTokens(null);
		setError(null);
	}, []);

	return {
		credentials,
		tokens,
		isRequesting,
		error,
		updateCredentials,
		requestToken,
		clearResults,
	};
};
