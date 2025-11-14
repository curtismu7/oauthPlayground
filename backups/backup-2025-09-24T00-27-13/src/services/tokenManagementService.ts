// src/services/tokenManagementService.ts
import { logger } from '../utils/logger';

export interface TokenRequest {
	grantType:
		| 'authorization_code'
		| 'refresh_token'
		| 'client_credentials'
		| 'urn:ietf:params:oauth:grant-type:token-exchange';
	code?: string;
	refreshToken?: string;
	redirectUri?: string;
	scope?: string;
	clientId: string;
	clientSecret?: string;
	environmentId: string;
	audience?: string;
	subjectToken?: string;
	subjectTokenType?: string;
	actorToken?: string;
	actorTokenType?: string;
	requestedTokenType?: string;
}

export interface TokenAuthMethod {
	type:
		| 'NONE'
		| 'CLIENT_SECRET_POST'
		| 'CLIENT_SECRET_BASIC'
		| 'CLIENT_SECRET_JWT'
		| 'PRIVATE_KEY_JWT';
	clientId: string;
	clientSecret?: string;
	privateKey?: string;
	keyId?: string;
	jwksUri?: string;
}

export interface TokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	scope?: string;
	refresh_token?: string;
	id_token?: string;
	issued_token_type?: string;
}

export interface TokenIntrospectionResponse {
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

export interface TokenRevocationRequest {
	token: string;
	token_type_hint?: 'access_token' | 'refresh_token';
	clientId: string;
	clientSecret?: string;
	environmentId: string;
}

export class TokenManagementService {
	private baseUrl: string;

	constructor(environmentId: string) {
		this.baseUrl = `https://auth.pingone.com/${environmentId}`;
	}

	/**
	 * Exchange authorization code for tokens with specified authentication method
	 */
	async exchangeAuthorizationCode(
		request: TokenRequest,
		authMethod: TokenAuthMethod
	): Promise<TokenResponse> {
		logger.info('TokenManagementService', 'Exchanging authorization code for tokens', {
			authMethod: authMethod.type,
			clientId: request.clientId,
		});

		try {
			const tokenUrl = `${this.baseUrl}/as/token`;
			const requestBody = this.buildTokenRequestBody(request, authMethod);
			const headers = this.buildTokenHeaders(authMethod);

			const response = await fetch(tokenUrl, {
				method: 'POST',
				headers,
				body: requestBody,
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
			}

			const tokenResponse: TokenResponse = await response.json();

			logger.success('TokenManagementService', 'Authorization code exchanged successfully', {
				tokenType: tokenResponse.token_type,
				expiresIn: tokenResponse.expires_in,
			});

			return tokenResponse;
		} catch (error) {
			logger.error('TokenManagementService', 'Failed to exchange authorization code', error);
			throw error;
		}
	}

	/**
	 * Refresh access token with specified authentication method
	 */
	async refreshToken(request: TokenRequest, authMethod: TokenAuthMethod): Promise<TokenResponse> {
		logger.info('TokenManagementService', 'Refreshing access token', {
			authMethod: authMethod.type,
			clientId: request.clientId,
		});

		try {
			const tokenUrl = `${this.baseUrl}/as/token`;
			const requestBody = this.buildTokenRequestBody(request, authMethod);
			const headers = this.buildTokenHeaders(authMethod);

			const response = await fetch(tokenUrl, {
				method: 'POST',
				headers,
				body: requestBody,
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Token refresh failed: ${response.status} - ${errorText}`);
			}

			const tokenResponse: TokenResponse = await response.json();

			logger.success('TokenManagementService', 'Token refreshed successfully', {
				tokenType: tokenResponse.token_type,
				expiresIn: tokenResponse.expires_in,
			});

			return tokenResponse;
		} catch (error) {
			logger.error('TokenManagementService', 'Failed to refresh token', error);
			throw error;
		}
	}

	/**
	 * Exchange tokens using token exchange grant
	 */
	async exchangeToken(request: TokenRequest, authMethod: TokenAuthMethod): Promise<TokenResponse> {
		logger.info('TokenManagementService', 'Exchanging tokens', {
			authMethod: authMethod.type,
			clientId: request.clientId,
		});

		try {
			// Use backend proxy to avoid CORS issues
			const backendUrl =
				process.env.NODE_ENV === 'production'
					? 'https://oauth-playground.vercel.app'
					: 'http://localhost:3001';

			const tokenUrl = `${backendUrl}/api/token-exchange`;

			// Convert to JSON format for backend proxy
			const requestBody = this.buildTokenRequestBody(request, authMethod);
			const headers = this.buildTokenHeaders(authMethod);

			// Convert FormData to JSON if needed
			let jsonBody: any = {};
			if (requestBody instanceof FormData) {
				for (const [key, value] of requestBody.entries()) {
					jsonBody[key] = value;
				}
			} else {
				jsonBody = requestBody;
			}

			const response = await fetch(tokenUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify({
					environment_id: this.baseUrl.split('/').pop(), // Extract environment ID from baseUrl
					...jsonBody,
				}),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
			}

			const tokenResponse: TokenResponse = await response.json();

			logger.success('TokenManagementService', 'Token exchange completed successfully', {
				tokenType: tokenResponse.token_type,
				expiresIn: tokenResponse.expires_in,
			});

			return tokenResponse;
		} catch (error) {
			logger.error('TokenManagementService', 'Failed to exchange tokens', error);
			throw error;
		}
	}

	/**
	 * Introspect a token to get its information
	 */
	async introspectToken(
		token: string,
		tokenTypeHint: 'access_token' | 'id_token' | 'refresh_token',
		authMethod: TokenAuthMethod,
		resourceId?: string,
		resourceSecret?: string
	): Promise<TokenIntrospectionResponse> {
		logger.info('TokenManagementService', 'Introspecting token', {
			tokenTypeHint,
			authMethod: authMethod.type,
		});

		try {
			const introspectionUrl = `${this.baseUrl}/as/introspect`;
			const requestBody = this.buildIntrospectionRequestBody(
				token,
				tokenTypeHint,
				resourceId,
				resourceSecret
			);
			const headers = this.buildIntrospectionHeaders(authMethod);

			const response = await fetch(introspectionUrl, {
				method: 'POST',
				headers,
				body: requestBody,
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Token introspection failed: ${response.status} - ${errorText}`);
			}

			const introspectionResponse: TokenIntrospectionResponse = await response.json();

			logger.success('TokenManagementService', 'Token introspection completed', {
				active: introspectionResponse.active,
				tokenType: introspectionResponse.token_type,
			});

			return introspectionResponse;
		} catch (error) {
			logger.error('TokenManagementService', 'Failed to introspect token', error);
			throw error;
		}
	}

	/**
	 * Revoke a token
	 */
	async revokeToken(request: TokenRevocationRequest): Promise<boolean> {
		logger.info('TokenManagementService', 'Revoking token', {
			tokenTypeHint: request.token_type_hint,
		});

		try {
			const revocationUrl = `https://auth.pingone.com/${request.environmentId}/as/revoke`;
			const requestBody = this.buildRevocationRequestBody(request);
			const headers = this.buildRevocationHeaders(request);

			const response = await fetch(revocationUrl, {
				method: 'POST',
				headers,
				body: requestBody,
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Token revocation failed: ${response.status} - ${errorText}`);
			}

			logger.success('TokenManagementService', 'Token revoked successfully');
			return true;
		} catch (error) {
			logger.error('TokenManagementService', 'Failed to revoke token', error);
			throw error;
		}
	}

	/**
	 * Build request body for token requests
	 */
	private buildTokenRequestBody(
		request: TokenRequest,
		authMethod: TokenAuthMethod
	): FormData | string {
		const formData = new FormData();

		// Add grant type
		formData.append('grant_type', request.grantType);

		// Add grant-specific parameters
		if (request.grantType === 'authorization_code' && request.code) {
			formData.append('code', request.code);
			if (request.redirectUri) {
				formData.append('redirect_uri', request.redirectUri);
			}
		}

		if (request.grantType === 'refresh_token' && request.refreshToken) {
			formData.append('refresh_token', request.refreshToken);
		}

		if (request.scope) {
			formData.append('scope', request.scope);
		}

		if (request.grantType === 'urn:ietf:params:oauth:grant-type:token-exchange') {
			if (request.audience) {
				formData.append('audience', request.audience);
			}
			if (request.subjectToken) {
				formData.append('subject_token', request.subjectToken);
			}
			if (request.subjectTokenType) {
				formData.append('subject_token_type', request.subjectTokenType);
			}
			if (request.actorToken) {
				formData.append('actor_token', request.actorToken);
			}
			if (request.actorTokenType) {
				formData.append('actor_token_type', request.actorTokenType);
			}
			if (request.requestedTokenType) {
				formData.append('requested_token_type', request.requestedTokenType);
			}
		}

		// Add authentication parameters based on method
		switch (authMethod.type) {
			case 'CLIENT_SECRET_POST':
				if (authMethod.clientSecret) {
					formData.append('client_secret', authMethod.clientSecret);
				}
				formData.append('client_id', request.clientId);
				break;

			case 'CLIENT_SECRET_JWT':
				if (authMethod.clientSecret) {
					const clientSecretJWT = this.generateClientSecretJWT(request, authMethod);
					formData.append('client_assertion', clientSecretJWT);
					formData.append(
						'client_assertion_type',
						'urn:ietf:params:oauth:client-assertion-type:jwt-bearer'
					);
				}
				formData.append('client_id', request.clientId);
				break;

			case 'PRIVATE_KEY_JWT':
				if (authMethod.privateKey) {
					const privateKeyJWT = this.generatePrivateKeyJWT(request, authMethod);
					formData.append('client_assertion', privateKeyJWT);
					formData.append(
						'client_assertion_type',
						'urn:ietf:params:oauth:client-assertion-type:jwt-bearer'
					);
				}
				formData.append('client_id', request.clientId);
				break;

			case 'NONE':
				formData.append('client_id', request.clientId);
				break;
		}

		return formData;
	}

	/**
	 * Build headers for token requests
	 */
	private buildTokenHeaders(authMethod: TokenAuthMethod): HeadersInit {
		const headers: HeadersInit = {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json',
		};

		// Add basic authentication header if needed
		if (authMethod.type === 'CLIENT_SECRET_BASIC' && authMethod.clientSecret) {
			const credentials = btoa(`${authMethod.clientId}:${authMethod.clientSecret}`);
			headers['Authorization'] = `Basic ${credentials}`;
		}

		return headers;
	}

	/**
	 * Build request body for token introspection
	 */
	private buildIntrospectionRequestBody(
		token: string,
		tokenTypeHint: string,
		resourceId?: string,
		resourceSecret?: string
	): FormData {
		const formData = new FormData();
		formData.append('token', token);
		formData.append('token_type_hint', tokenTypeHint);

		if (resourceId) {
			formData.append('resource', resourceId);
		}
		if (resourceSecret) {
			formData.append('resource_secret', resourceSecret);
		}

		return formData;
	}

	/**
	 * Build headers for token introspection
	 */
	private buildIntrospectionHeaders(authMethod: TokenAuthMethod): HeadersInit {
		const headers: HeadersInit = {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json',
		};

		// Add basic authentication header
		if (authMethod.clientSecret) {
			const credentials = btoa(`${authMethod.clientId}:${authMethod.clientSecret}`);
			headers['Authorization'] = `Basic ${credentials}`;
		}

		return headers;
	}

	/**
	 * Build request body for token revocation
	 */
	private buildRevocationRequestBody(request: TokenRevocationRequest): FormData {
		const formData = new FormData();
		formData.append('token', request.token);

		if (request.token_type_hint) {
			formData.append('token_type_hint', request.token_type_hint);
		}

		formData.append('client_id', request.clientId);

		if (request.clientSecret) {
			formData.append('client_secret', request.clientSecret);
		}

		return formData;
	}

	/**
	 * Build headers for token revocation
	 */
	private buildRevocationHeaders(request: TokenRevocationRequest): HeadersInit {
		const headers: HeadersInit = {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json',
		};

		// Add basic authentication header if client secret is provided
		if (request.clientSecret) {
			const credentials = btoa(`${request.clientId}:${request.clientSecret}`);
			headers['Authorization'] = `Basic ${credentials}`;
		}

		return headers;
	}

	/**
	 * Generate client secret JWT for authentication
	 */
	private generateClientSecretJWT(request: TokenRequest, authMethod: TokenAuthMethod): string {
		const now = Math.floor(Date.now() / 1000);
		const header = {
			alg: 'HS256',
			typ: 'JWT',
		};

		const payload = {
			iss: request.clientId,
			sub: request.clientId,
			aud: `${this.baseUrl}/as/token`,
			iat: now,
			exp: now + 300, // 5 minutes
			jti: this.generateJTI(),
		};

		// In a real implementation, you would use a JWT library
		// For demo purposes, we'll return a mock JWT
		const mockJWT =
			btoa(JSON.stringify(header)) + '.' + btoa(JSON.stringify(payload)) + '.' + 'mock_signature';

		logger.info('TokenManagementService', 'Generated client secret JWT', { jti: payload.jti });
		return mockJWT;
	}

	/**
	 * Generate private key JWT for authentication
	 */
	private generatePrivateKeyJWT(request: TokenRequest, authMethod: TokenAuthMethod): string {
		const now = Math.floor(Date.now() / 1000);
		const header = {
			alg: 'RS256',
			typ: 'JWT',
			kid: authMethod.keyId || 'default-key',
		};

		const payload = {
			iss: request.clientId,
			sub: request.clientId,
			aud: `${this.baseUrl}/as/token`,
			iat: now,
			exp: now + 300, // 5 minutes
			jti: this.generateJTI(),
		};

		// In a real implementation, you would use a JWT library with the private key
		// For demo purposes, we'll return a mock JWT
		const mockJWT =
			btoa(JSON.stringify(header)) +
			'.' +
			btoa(JSON.stringify(payload)) +
			'.' +
			'mock_rsa_signature';

		logger.info('TokenManagementService', 'Generated private key JWT', {
			jti: payload.jti,
			keyId: authMethod.keyId,
		});
		return mockJWT;
	}

	/**
	 * Generate a unique JTI (JWT ID)
	 */
	private generateJTI(): string {
		return 'jti_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
	}

	/**
	 * Validate token request parameters
	 */
	validateTokenRequest(request: TokenRequest): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		if (!request.clientId) {
			errors.push('clientId is required');
		}

		if (!request.environmentId) {
			errors.push('environmentId is required');
		}

		if (!request.grantType) {
			errors.push('grantType is required');
		}

		if (request.grantType === 'authorization_code' && !request.code) {
			errors.push('code is required for authorization_code grant type');
		}

		if (request.grantType === 'refresh_token' && !request.refreshToken) {
			errors.push('refreshToken is required for refresh_token grant type');
		}

		if (request.grantType === 'urn:ietf:params:oauth:grant-type:token-exchange') {
			if (!request.subjectToken) {
				errors.push('subjectToken is required for token exchange');
			}
			if (!request.subjectTokenType) {
				errors.push('subjectTokenType is required for token exchange');
			}
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}
}

export const tokenManagementService = new TokenManagementService('default-environment');
