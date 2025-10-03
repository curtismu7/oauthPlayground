// src/hooks/useTokenIntrospectionFlowController.ts
// Token Introspection Flow state management and logic

import { useCallback, useState } from 'react';

export interface TokenIntrospectionConfig {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	token: string;
	introspectionEndpoint?: string;
}

export interface TokenIntrospectionResult {
	active: boolean;
	scope?: string;
	client_id?: string;
	username?: string;
	token_type?: string;
	exp?: number;
	iat?: number;
	nbf?: number;
	sub?: string;
	aud?: string | string[];
	iss?: string;
	jti?: string;
	[key: string]: unknown;
}

interface UseTokenIntrospectionFlowControllerReturn {
	// State
	credentials: TokenIntrospectionConfig;
	introspectionResult: TokenIntrospectionResult | null;
	isRequesting: boolean;
	error: string | null;

	// Actions
	updateCredentials: (credentials: Partial<TokenIntrospectionConfig>) => void;
	introspectToken: () => Promise<TokenIntrospectionResult>;
	clearResults: () => void;
}

const LOG_PREFIX = '[🔍 TOKEN-INTROSPECTION]';

export const useTokenIntrospectionFlowController =
	(): UseTokenIntrospectionFlowControllerReturn => {
		const [credentials, setCredentials] = useState<TokenIntrospectionConfig>({
			environmentId: '',
			clientId: '',
			clientSecret: '',
			token: '',
			introspectionEndpoint: '',
		});
		const [introspectionResult, setIntrospectionResult] = useState<TokenIntrospectionResult | null>(
			null
		);
		const [isRequesting, setIsRequesting] = useState(false);
		const [error, setError] = useState<string | null>(null);

		const updateCredentials = useCallback((newCredentials: Partial<TokenIntrospectionConfig>) => {
			setCredentials((prev) => ({ ...prev, ...newCredentials }));
		}, []);

		const introspectToken = useCallback(async (): Promise<TokenIntrospectionResult> => {
			if (
				!credentials.environmentId ||
				!credentials.clientId ||
				!credentials.clientSecret ||
				!credentials.token
			) {
				throw new Error('Missing required credentials or token');
			}

			setIsRequesting(true);
			setError(null);

			try {
				const introspectionEndpoint =
					credentials.introspectionEndpoint ||
					`https://auth.pingone.com/${credentials.environmentId}/as/introspect`;

				const response = await fetch(introspectionEndpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						Authorization: `Basic ${btoa(`${credentials.clientId}:${credentials.clientSecret}`)}`,
					},
					body: new URLSearchParams({
						token: credentials.token,
						token_type_hint: 'access_token',
					}),
				});

				if (!response.ok) {
					throw new Error(`Token introspection failed: ${response.status} ${response.statusText}`);
				}

				const result: TokenIntrospectionResult = await response.json();
				setIntrospectionResult(result);

				console.log(`${LOG_PREFIX} [SUCCESS] Token introspection completed:`, result);
				return result;
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Token introspection failed';
				setError(errorMessage);
				console.error(`${LOG_PREFIX} [ERROR] Token introspection failed:`, err);
				throw err;
			} finally {
				setIsRequesting(false);
			}
		}, [credentials]);

		const clearResults = useCallback(() => {
			setIntrospectionResult(null);
			setError(null);
		}, []);

		return {
			credentials,
			introspectionResult: introspectionResult,
			isRequesting,
			error,
			updateCredentials,
			introspectToken,
			clearResults,
		};
	};
