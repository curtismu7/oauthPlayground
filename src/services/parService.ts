// src/services/parService.ts
import { logger } from '../utils/logger';

export interface PARRequest {
	clientId: string;
	clientSecret?: string;
	environmentId: string;
	responseType: string;
	redirectUri: string;
	scope: string;
	state: string;
	nonce?: string;
	codeChallenge?: string;
	codeChallengeMethod?: string;
	acrValues?: string;
	prompt?: string;
	maxAge?: string;
	uiLocales?: string;
	claims?: string;
	requestUri?: string;
}

export interface PARResponse {
	requestUri: string;
	expiresIn: number;
	expiresAt: number;
}

export interface PARAuthMethod {
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

export class PARService {
	private baseUrl: string;

	constructor(environmentId: string) {
		this.baseUrl = `https://auth.pingone.com/${environmentId}`;
	}

	/**
	 * Generate a PAR request with the specified authentication method
	 */
	async generatePARRequest(request: PARRequest, authMethod: PARAuthMethod): Promise<PARResponse> {
		logger.info('PARService', 'Generating PAR request', {
			authMethod: authMethod.type,
			clientId: request.clientId,
		});

		try {
			const parUrl = '/api/par';

			const requestBody = this.buildPARRequestBody(request, authMethod);
			const jsonBody: Record<string, unknown> = {};

			for (const [key, value] of requestBody.entries()) {
				jsonBody[key] = value;
			}

			const environmentId = this.baseUrl.split('/').pop();
			const payload: Record<string, unknown> = {
				environment_id: environmentId,
				client_auth_method: authMethod.type,
				...jsonBody,
			};

			if (!payload.client_id) {
				payload.client_id = request.clientId;
			}

			if (authMethod.clientSecret && !payload.client_secret) {
				payload.client_secret = authMethod.clientSecret;
			}

			logger.info('PARService', 'Sending PAR request to backend', {
				parUrl,
				environmentId,
				requestBody: {
					...payload,
					client_secret: payload.client_secret ? '[REDACTED]' : undefined,
				},
			});

			const response = await fetch(parUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`PAR request failed: ${response.status} - ${errorText}`);
			}

			const parResponse: PARResponse = await response.json();

			logger.success('PARService', 'PAR request generated successfully', {
				requestUri: parResponse.requestUri,
				expiresIn: parResponse.expiresIn,
			});

			return parResponse;
		} catch (error) {
			logger.error('PARService', 'Failed to generate PAR request', undefined, error as Error);
			throw error;
		}
	}

	/**
	 * Build the request body for PAR based on authentication method
	 */
	private buildPARRequestBody(request: PARRequest, authMethod: PARAuthMethod): FormData {
		const formData = new FormData();

		formData.append('client_id', request.clientId);
		formData.append('response_type', request.responseType);
		formData.append('redirect_uri', request.redirectUri);
		formData.append('scope', request.scope);
		formData.append('state', request.state);

		if (request.nonce) {
			formData.append('nonce', request.nonce);
		}

		if (request.codeChallenge) {
			formData.append('code_challenge', request.codeChallenge);
			formData.append('code_challenge_method', request.codeChallengeMethod || 'S256');
		}

		if (request.acrValues) {
			formData.append('acr_values', request.acrValues);
		}

		if (request.prompt) {
			formData.append('prompt', request.prompt);
		}

		if (request.maxAge) {
			formData.append('max_age', request.maxAge);
		}

		if (request.uiLocales) {
			formData.append('ui_locales', request.uiLocales);
		}

		if (request.claims) {
			formData.append('claims', request.claims);
		}

		switch (authMethod.type) {
			case 'CLIENT_SECRET_POST':
				if (authMethod.clientSecret) {
					formData.append('client_secret', authMethod.clientSecret);
				}
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
				break;
		}

		return formData;
	}

	/**
	 * Build headers for PAR request based on authentication method
	 */
	private buildPARHeaders(authMethod: PARAuthMethod): HeadersInit {
		const headers: HeadersInit = {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json',
		};

		if (authMethod.type === 'CLIENT_SECRET_BASIC' && authMethod.clientSecret) {
			const credentials = btoa(`${authMethod.clientId}:${authMethod.clientSecret}`);
			headers['Authorization'] = `Basic ${credentials}`;
		}

		return headers;
	}

	/**
	 * Generate client secret JWT for authentication
	 */
	private generateClientSecretJWT(request: PARRequest, _authMethod: PARAuthMethod): string {
		const now = Math.floor(Date.now() / 1000);
		const header = { alg: 'HS256', typ: 'JWT' };
		const payload = {
			iss: request.clientId,
			sub: request.clientId,
			aud: `${this.baseUrl}/as/par`,
			iat: now,
			exp: now + 300,
			jti: this.generateJTI(),
		};

		const mockJWT = `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}.mock_signature`;
		logger.info('PARService', 'Generated client secret JWT', { jti: payload.jti });
		return mockJWT;
	}

	/**
	 * Generate private key JWT for authentication
	 */
	private generatePrivateKeyJWT(request: PARRequest, authMethod: PARAuthMethod): string {
		const now = Math.floor(Date.now() / 1000);
		const header = { alg: 'RS256', typ: 'JWT', kid: authMethod.keyId || 'default-key' };
		const payload = {
			iss: request.clientId,
			sub: request.clientId,
			aud: `${this.baseUrl}/as/par`,
			iat: now,
			exp: now + 300,
			jti: this.generateJTI(),
		};

		const mockJWT =
			btoa(JSON.stringify(header)) +
			'.' +
			btoa(JSON.stringify(payload)) +
			'.' +
			'mock_rsa_signature';

		logger.info('PARService', 'Generated private key JWT', {
			jti: payload.jti,
			keyId: authMethod.keyId,
		});
		return mockJWT;
	}

	/**
	 * Generate a unique JTI (JWT ID)
	 */
	private generateJTI(): string {
		return `jti_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
	}

	/**
	 * Validate PAR request parameters
	 */
	validatePARRequest(request: PARRequest): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		if (!request.clientId) {
			errors.push('clientId is required');
		}

		if (!request.environmentId) {
			errors.push('environmentId is required');
		}

		if (!request.responseType) {
			errors.push('responseType is required');
		}

		if (!request.redirectUri) {
			errors.push('redirectUri is required');
		}

		if (!request.scope) {
			errors.push('scope is required');
		}

		if (!request.state) {
			errors.push('state is required');
		}

		try {
			new URL(request.redirectUri);
		} catch {
			errors.push('redirectUri must be a valid URL');
		}

		const validResponseTypes = [
			'code',
			'token',
			'id_token',
			'code token',
			'code id_token',
			'token id_token',
			'code token id_token',
		];
		if (!validResponseTypes.includes(request.responseType)) {
			errors.push(`responseType must be one of: ${validResponseTypes.join(', ')}`);
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Generate authorization URL using request URI
	 */
	generateAuthorizationURL(requestUri: string, additionalParams?: Record<string, string>): string {
		const authUrl = `${this.baseUrl}/as/authorize`;
		const params = new URLSearchParams({
			request_uri: requestUri,
			...additionalParams,
		});

		return `${authUrl}?${params.toString()}`;
	}

	/**
	 * Parse PAR response and extract request URI
	 */
	parsePARResponse(response: any): PARResponse {
		// Handle different response formats from PingOne
		const requestUri = response.request_uri || response.requestUri;
		const expiresIn = response.expires_in || response.expiresIn || 600; // Default 10 minutes

		if (!requestUri) {
			console.error('PAR Response Debug:', response);
			throw new Error('Invalid PAR response: missing request_uri. Response: ' + JSON.stringify(response));
		}

		return {
			requestUri: requestUri,
			expiresIn: expiresIn,
			expiresAt: Date.now() + expiresIn * 1000,
		};
	}
}

// Note: PAR service instance should be created with actual environment ID when needed
// export const parService = new PARService('default-environment');
