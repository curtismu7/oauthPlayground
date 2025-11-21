// src/services/tokenIntrospectionService.ts
// Reusable Token Introspection Service with API Call Display Integration

import { EnhancedApiCallData } from './enhancedApiCallDisplayService';

export interface IntrospectionRequest {
	token: string;
	clientId: string;
	clientSecret?: string;
	tokenTypeHint?: 'access_token' | 'refresh_token';
}

export interface IntrospectionResponse {
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

export interface IntrospectionApiCallData extends EnhancedApiCallData {
	flowType:
		| 'authorization-code'
		| 'implicit'
		| 'client-credentials'
		| 'device-code'
		| 'rar'
		| 'hybrid'
		| 'ciba'
		| 'worker-token';
	stepName: 'Token Introspection';
}

export class TokenIntrospectionService {
	/**
	 * Create API call data for token introspection
	 */
	static createIntrospectionApiCall(
		request: IntrospectionRequest,
		flowType: IntrospectionApiCallData['flowType'],
		baseUrl: string = '/api/introspect-token'
	): IntrospectionApiCallData {
		return {
			flowType,
			stepName: 'Token Introspection',
			url: baseUrl,
			method: 'POST' as const,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json',
			},
			body: {
				token: request.token,
				token_type_hint: request.tokenTypeHint || 'access_token',
				client_id: request.clientId,
				...(request.clientSecret && { client_secret: '***REDACTED***' }),
			},
			timestamp: new Date(),
			description: 'Introspect access token to validate its current state and metadata',
		};
	}

	/**
	 * Execute token introspection with API call tracking
	 */
	static async introspectToken(
		request: IntrospectionRequest,
		flowType: IntrospectionApiCallData['flowType'],
		baseUrl: string = '/api/introspect-token',
		introspectionEndpoint?: string,
		tokenAuthMethod: string = 'client_secret_post'
	): Promise<{
		apiCall: IntrospectionApiCallData;
		response: IntrospectionResponse;
	}> {
		const apiCall = TokenIntrospectionService.createIntrospectionApiCall(
			request,
			flowType,
			baseUrl
		);

		try {
			const formData = new URLSearchParams();
			formData.append('token', request.token);
			formData.append('token_type_hint', request.tokenTypeHint || 'access_token');
			formData.append('client_id', request.clientId);
			if (request.clientSecret) {
				formData.append('client_secret', request.clientSecret);
			}
			// Add introspection endpoint if provided
			if (introspectionEndpoint) {
				formData.append('introspection_endpoint', introspectionEndpoint);
			}
			// Add authentication method
			formData.append('token_auth_method', tokenAuthMethod);

			const response = await fetch(baseUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					Accept: 'application/json',
				},
				body: formData,
			});

			const data = await response.json();

			// Update API call with response
			const updatedApiCall: IntrospectionApiCallData = {
				...apiCall,
				response: {
					status: response.status,
					statusText: response.statusText,
					headers: { 'Content-Type': 'application/json' },
					data: data,
				},
			};

			return {
				apiCall: updatedApiCall,
				response: data as IntrospectionResponse,
			};
		} catch (error) {
			// Update API call with error
			const errorApiCall: IntrospectionApiCallData = {
				...apiCall,
				response: {
					status: 500,
					statusText: 'Internal Server Error',
					headers: { 'Content-Type': 'application/json' },
					error: error instanceof Error ? error.message : 'Unknown error',
				},
			};

			throw {
				apiCall: errorApiCall,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Create introspection API call with success response
	 */
	static createSuccessApiCall(
		request: IntrospectionRequest,
		flowType: IntrospectionApiCallData['flowType'],
		response: IntrospectionResponse,
		baseUrl: string = '/api/introspect-token'
	): IntrospectionApiCallData {
		const apiCall = TokenIntrospectionService.createIntrospectionApiCall(
			request,
			flowType,
			baseUrl
		);

		return {
			...apiCall,
			response: {
				status: 200,
				statusText: 'OK',
				headers: { 'Content-Type': 'application/json' },
				data: response,
			},
		};
	}

	/**
	 * Create introspection API call with error response
	 */
	static createErrorApiCall(
		request: IntrospectionRequest,
		flowType: IntrospectionApiCallData['flowType'],
		error: string,
		status: number = 400,
		baseUrl: string = '/api/introspect'
	): IntrospectionApiCallData {
		const apiCall = TokenIntrospectionService.createIntrospectionApiCall(
			request,
			flowType,
			baseUrl
		);

		return {
			...apiCall,
			response: {
				status,
				statusText: status === 400 ? 'Bad Request' : 'Internal Server Error',
				headers: { 'Content-Type': 'application/json' },
				error,
			},
		};
	}
}

export default TokenIntrospectionService;
