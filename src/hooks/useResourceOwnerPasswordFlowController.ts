// src/hooks/useResourceOwnerPasswordFlowController.ts
// Resource Owner Password Credentials Flow state management and logic

import { useCallback, useState } from 'react';

export interface ResourceOwnerPasswordConfig {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	username: string;
	password: string;
	scopes: string;
	tokenEndpoint?: string;
}

export interface ResourceOwnerPasswordResult {
	access_token: string;
	token_type: string;
	expires_in?: number;
	refresh_token?: string;
	scope?: string;
	id_token?: string;
}

interface UseResourceOwnerPasswordFlowControllerReturn {
	// State
	credentials: ResourceOwnerPasswordConfig;
	tokens: ResourceOwnerPasswordResult | null;
	isRequesting: boolean;
	error: string | null;

	// Actions
	updateCredentials: (credentials: Partial<ResourceOwnerPasswordConfig>) => void;
	requestToken: () => Promise<ResourceOwnerPasswordResult>;
	clearResults: () => void;
}

const LOG_PREFIX = '[👤 RESOURCE-OWNER-PASSWORD]';

export const useResourceOwnerPasswordFlowController = (): UseResourceOwnerPasswordFlowControllerReturn => {
	const [credentials, setCredentials] = useState<ResourceOwnerPasswordConfig>({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		username: '',
		password: '',
		scopes: 'openid profile email',
		tokenEndpoint: '',
	});
	const [tokens, setTokens] = useState<ResourceOwnerPasswordResult | null>(null);
	const [isRequesting, setIsRequesting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const updateCredentials = useCallback((newCredentials: Partial<ResourceOwnerPasswordConfig>) => {
		setCredentials(prev => ({ ...prev, ...newCredentials }));
	}, []);

	const requestToken = useCallback(async (): Promise<ResourceOwnerPasswordResult> => {
		if (!credentials.environmentId || !credentials.clientId || !credentials.clientSecret || !credentials.username || !credentials.password) {
			throw new Error('Missing required credentials');
		}

		setIsRequesting(true);
		setError(null);

		try {
			const tokenEndpoint = credentials.tokenEndpoint || 
				`https://auth.pingone.com/${credentials.environmentId}/as/token`;

			const response = await fetch(tokenEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Authorization': `Basic ${btoa(`${credentials.clientId}:${credentials.clientSecret}`)}`,
				},
				body: new URLSearchParams({
					grant_type: 'password',
					username: credentials.username,
					password: credentials.password,
					scope: credentials.scopes,
				}),
			});

			if (!response.ok) {
				throw new Error(`Resource Owner Password token request failed: ${response.status} ${response.statusText}`);
			}

			const result: ResourceOwnerPasswordResult = await response.json();
			setTokens(result);
			
			console.log(`${LOG_PREFIX} [SUCCESS] Resource Owner Password token obtained:`, result);
			return result;

		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Resource Owner Password token request failed';
			setError(errorMessage);
			console.error(`${LOG_PREFIX} [ERROR] Resource Owner Password token request failed:`, err);
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
