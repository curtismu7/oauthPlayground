// src/v8/flows/PingOnePARFlowV8/hooks/usePAROperations.ts
// PAR Operations - Direct API calls without service layer

import { useCallback, useState } from 'react';
import { generateCodeChallenge, generateCodeVerifier } from '../../../../utils/oauth';
import type {
	FlowCredentials,
	PARRequest,
	PARResponse,
	PKCECodes,
	TokenResponse,
} from '../types/parFlowTypes';

export const usePAROperations = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Generate PKCE codes
	const generatePKCE = useCallback(async (): Promise<PKCECodes> => {
		try {
			const verifier = generateCodeVerifier();
			const challenge = await generateCodeChallenge(verifier);

			return {
				codeVerifier: verifier,
				codeChallenge: challenge,
				codeChallengeMethod: 'S256',
			};
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to generate PKCE';
			setError(message);
			throw new Error(message);
		}
	}, []);

	// Push authorization request to PAR endpoint
	const pushAuthorizationRequest = useCallback(
		async (
			credentials: FlowCredentials,
			pkceCodes: PKCECodes,
			additionalParams?: Record<string, any>
		): Promise<PARResponse> => {
			setIsLoading(true);
			setError(null);

			try {
				const state = `par-${Date.now()}-${Math.random().toString(36).substring(7)}`;

				const requestBody: PARRequest = {
					clientId: credentials.clientId,
					clientSecret: credentials.clientSecret,
					environmentId: credentials.environmentId,
					responseType: 'code',
					redirectUri: credentials.redirectUri,
					scope: credentials.scope,
					state,
					codeChallenge: pkceCodes.codeChallenge,
					codeChallengeMethod: pkceCodes.codeChallengeMethod,
					...additionalParams,
				};

				// Add nonce for OIDC flows
				if (credentials.scope.includes('openid')) {
					requestBody.nonce = `n-${Date.now()}-${Math.random().toString(36).substring(7)}`;
				}

				const response = await fetch('/api/par', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Accept: 'application/json',
					},
					body: JSON.stringify({
						environment_id: credentials.environmentId,
						client_id: credentials.clientId,
						client_secret: credentials.clientSecret,
						redirect_uri: credentials.redirectUri,
						response_type: 'code',
						scope: credentials.scope,
						state,
						code_challenge: pkceCodes.codeChallenge,
						code_challenge_method: pkceCodes.codeChallengeMethod,
						...(requestBody.nonce && { nonce: requestBody.nonce }),
						...additionalParams,
					}),
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					throw new Error(
						errorData.error_description ||
							errorData.error ||
							`PAR request failed: ${response.status}`
					);
				}

				const data: PARResponse = await response.json();

				if (!data.request_uri) {
					throw new Error('No request_uri received from PAR endpoint');
				}

				return data;
			} catch (err) {
				const message = err instanceof Error ? err.message : 'PAR request failed';
				setError(message);
				throw new Error(message);
			} finally {
				setIsLoading(false);
			}
		},
		[]
	);

	// Generate authorization URL with request_uri
	const generateAuthorizationUrl = useCallback(
		(credentials: FlowCredentials, requestUri: string): string => {
			const authEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/authorize`;
			const params = new URLSearchParams({
				client_id: credentials.clientId,
				request_uri: requestUri,
			});
			return `${authEndpoint}?${params.toString()}`;
		},
		[]
	);

	// Exchange authorization code for tokens
	const exchangeCodeForTokens = useCallback(
		async (
			credentials: FlowCredentials,
			authCode: string,
			pkceCodes: PKCECodes
		): Promise<TokenResponse> => {
			setIsLoading(true);
			setError(null);

			try {
				const tokenEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/token`;

				const body = new URLSearchParams({
					grant_type: 'authorization_code',
					code: authCode,
					redirect_uri: credentials.redirectUri,
					client_id: credentials.clientId,
					client_secret: credentials.clientSecret,
					code_verifier: pkceCodes.codeVerifier,
				});

				const response = await fetch(tokenEndpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
					body: body.toString(),
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					throw new Error(
						errorData.error_description ||
							errorData.error ||
							`Token exchange failed: ${response.status}`
					);
				}

				const tokens: TokenResponse = await response.json();
				return tokens;
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Token exchange failed';
				setError(message);
				throw new Error(message);
			} finally {
				setIsLoading(false);
			}
		},
		[]
	);

	// Fetch user info (for OIDC flows)
	const fetchUserInfo = useCallback(
		async (credentials: FlowCredentials, accessToken: string): Promise<any> => {
			setIsLoading(true);
			setError(null);

			try {
				const userInfoEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/userinfo`;

				const response = await fetch(userInfoEndpoint, {
					method: 'GET',
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				});

				if (!response.ok) {
					throw new Error(`UserInfo request failed: ${response.status}`);
				}

				const userInfo = await response.json();
				return userInfo;
			} catch (err) {
				const message = err instanceof Error ? err.message : 'UserInfo request failed';
				setError(message);
				throw new Error(message);
			} finally {
				setIsLoading(false);
			}
		},
		[]
	);

	return {
		isLoading,
		error,
		generatePKCE,
		pushAuthorizationRequest,
		generateAuthorizationUrl,
		exchangeCodeForTokens,
		fetchUserInfo,
	};
};
