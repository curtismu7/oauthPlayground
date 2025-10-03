// src/hooks/useTokenRevocationFlowController.ts
// Token Revocation Flow state management and logic

import { useCallback, useState } from 'react';

export interface TokenRevocationConfig {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	accessToken?: string;
	refreshToken?: string;
	tokenEndpoint?: string;
}

export interface TokenRevocationResult {
	success: boolean;
	revokedTokens: string[];
	message: string;
}

interface UseTokenRevocationFlowControllerReturn {
	// State
	credentials: TokenRevocationConfig;
	tokens: TokenRevocationResult | null;
	isRequesting: boolean;
	error: string | null;

	// Actions
	updateCredentials: (credentials: Partial<TokenRevocationConfig>) => void;
	revokeToken: () => Promise<TokenRevocationResult>;
	clearResults: () => void;
}

const LOG_PREFIX = '[🔄 TOKEN-REVOCATION]';

export const useTokenRevocationFlowController = (): UseTokenRevocationFlowControllerReturn => {
	const [credentials, setCredentials] = useState<TokenRevocationConfig>({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		accessToken: '',
		refreshToken: '',
		tokenEndpoint: '',
	});
	const [tokens, setTokens] = useState<TokenRevocationResult | null>(null);
	const [isRequesting, setIsRequesting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const updateCredentials = useCallback((newCredentials: Partial<TokenRevocationConfig>) => {
		setCredentials((prev) => ({ ...prev, ...newCredentials }));
	}, []);

	const revokeToken = useCallback(async (): Promise<TokenRevocationResult> => {
		if (!credentials.environmentId || !credentials.clientId || !credentials.clientSecret) {
			throw new Error('Missing required credentials');
		}

		if (!credentials.accessToken && !credentials.refreshToken) {
			throw new Error('No tokens provided for revocation');
		}

		setIsRequesting(true);
		setError(null);

		try {
			const tokenEndpoint =
				credentials.tokenEndpoint ||
				`https://auth.pingone.com/${credentials.environmentId}/as/revoke`;

			const revokedTokens: string[] = [];

			// Revoke access token if provided
			if (credentials.accessToken) {
				const accessTokenResponse = await fetch(tokenEndpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						Authorization: `Basic ${btoa(`${credentials.clientId}:${credentials.clientSecret}`)}`,
					},
					body: new URLSearchParams({
						token: credentials.accessToken,
						token_type_hint: 'access_token',
					}),
				});

				if (accessTokenResponse.ok) {
					revokedTokens.push('access_token');
				}
			}

			// Revoke refresh token if provided
			if (credentials.refreshToken) {
				const refreshTokenResponse = await fetch(tokenEndpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						Authorization: `Basic ${btoa(`${credentials.clientId}:${credentials.clientSecret}`)}`,
					},
					body: new URLSearchParams({
						token: credentials.refreshToken,
						token_type_hint: 'refresh_token',
					}),
				});

				if (refreshTokenResponse.ok) {
					revokedTokens.push('refresh_token');
				}
			}

			const result: TokenRevocationResult = {
				success: revokedTokens.length > 0,
				revokedTokens,
				message: `Successfully revoked ${revokedTokens.length} token(s)`,
			};

			setTokens(result);
			console.log(`${LOG_PREFIX} [SUCCESS] Token revocation completed:`, result);
			return result;
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Token revocation failed';
			setError(errorMessage);
			console.error(`${LOG_PREFIX} [ERROR] Token revocation failed:`, err);
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
		revokeToken,
		clearResults,
	};
};
