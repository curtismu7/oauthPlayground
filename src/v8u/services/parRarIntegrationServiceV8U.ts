/**
 * @file parRarIntegrationServiceV8U.ts
 * @module v8u/services
 * @description PAR (Pushed Authorization Requests) and RAR (Rich Authorization Requests) integration for Unified Flow
 * @version 8.0.0
 * @since 2025-11-23
 *
 * Provides PAR (RFC 9126) and RAR (RFC 9396) support for Unified Flow:
 * - PAR: Push authorization parameters to server before redirect
 * - RAR: Fine-grained authorization using authorization_details
 * - PingOne-specific PAR endpoint integration
 * - Request URI management
 */

import type { FlowType, SpecVersion } from '@/v8/services/specVersionServiceV8';
import type { UnifiedFlowCredentials } from './unifiedFlowIntegrationV8U';
import { UnifiedFlowLoggerService } from './unifiedFlowLoggerServiceV8U';
import { apiCallTrackerService } from '@/services/apiCallTrackerService';

const MODULE_TAG = '[🔐 PAR-RAR-INTEGRATION-V8U]';

/**
 * PAR Request Interface (RFC 9126)
 */
export interface PARRequest {
	clientId: string;
	clientSecret?: string;
	privateKey?: string; // For private_key_jwt authentication
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
	maxAge?: number;
	uiLocales?: string;
	claims?: string;
	// RAR support: authorization_details (RFC 9396)
	authorizationDetails?: AuthorizationDetail[];
	// Additional PingOne-specific parameters
	loginHint?: string;
	display?: string;
}

/**
 * RAR Authorization Detail (RFC 9396)
 */
export interface AuthorizationDetail {
	type: string; // Authorization detail type (e.g., "payment_initiation", "account_access")
	locations?: string[]; // Resource locations
	actions?: string[]; // Actions to perform
	datatypes?: string[]; // Data types to access
	identifier?: string; // Resource identifier
	privileges?: string[]; // Privileges requested
	// Type-specific fields (flexible structure)
	[key: string]: unknown;
}

/**
 * PAR Response (RFC 9126)
 */
export interface PARResponse {
	requestUri: string; // URI to use in authorization request
	expiresIn: number; // Seconds until request_uri expires
	expiresAt: number; // Timestamp when request_uri expires
}

/**
 * Client Authentication Method for PAR
 */
export type PARAuthMethod =
	| 'none'
	| 'client_secret_basic'
	| 'client_secret_post'
	| 'client_secret_jwt'
	| 'private_key_jwt';

/**
 * PAR/RAR Integration Service
 *
 * Provides PAR (Pushed Authorization Requests) and RAR (Rich Authorization Requests)
 * support for Unified Flow with PingOne-specific integration.
 */
export class PARRARIntegrationServiceV8U {
	/**
	 * Generate PAR request from Unified Flow credentials
	 */
	static buildPARRequest(
		specVersion: SpecVersion,
		flowType: FlowType,
		credentials: UnifiedFlowCredentials,
		state: string,
		nonce?: string,
		pkceCodes?: {
			codeVerifier: string;
			codeChallenge: string;
			codeChallengeMethod: 'S256' | 'plain';
		},
		authorizationDetails?: AuthorizationDetail[]
	): PARRequest {
		UnifiedFlowLoggerService.info('Building PAR request', {
			flowType,
			specVersion,
			hasPKCE: !!pkceCodes,
			hasRAR: !!authorizationDetails && authorizationDetails.length > 0,
		});

		// Determine response type based on flow type
		let responseType: string;
		switch (flowType) {
			case 'oauth-authz':
				responseType = 'code';
				break;
			case 'implicit':
				responseType = 'token id_token';
				break;
			case 'hybrid':
				responseType = credentials.responseType || 'code id_token';
				break;
			default:
				throw new Error(`PAR is not supported for flow type: ${flowType}`);
		}

		const parRequest: PARRequest = {
			clientId: credentials.clientId,
			...(credentials.clientSecret && { clientSecret: credentials.clientSecret }),
			...((credentials as { privateKey?: string }).privateKey && {
				privateKey: (credentials as { privateKey?: string }).privateKey,
			}),
			environmentId: credentials.environmentId,
			responseType,
			redirectUri: credentials.redirectUri || '',
			scope: credentials.scopes || 'openid profile email',
			state,
			...(nonce && { nonce }),
			...(pkceCodes && {
				codeChallenge: pkceCodes.codeChallenge,
				codeChallengeMethod: pkceCodes.codeChallengeMethod,
			}),
			...(credentials.prompt && { prompt: credentials.prompt }),
			...(credentials.maxAge !== undefined && { maxAge: credentials.maxAge }),
			...(credentials.loginHint && { loginHint: credentials.loginHint }),
			...(credentials.display && { display: credentials.display }),
			...(authorizationDetails && authorizationDetails.length > 0 && { authorizationDetails }),
		};

		return parRequest;
	}

	/**
	 * Push PAR request to PingOne
	 */
	static async pushPARRequest(
		parRequest: PARRequest,
		authMethod: PARAuthMethod = 'client_secret_post'
	): Promise<PARResponse> {
		UnifiedFlowLoggerService.info('Pushing PAR request to PingOne', {
			authMethod,
			hasRAR: !!parRequest.authorizationDetails && parRequest.authorizationDetails.length > 0,
		});

		const parEndpoint = `/api/par`;

		// Build request body
		const requestBody: Record<string, unknown> = {
			environment_id: parRequest.environmentId,
			client_auth_method: authMethod,
			client_id: parRequest.clientId,
			response_type: parRequest.responseType,
			redirect_uri: parRequest.redirectUri,
			scope: parRequest.scope,
			state: parRequest.state,
		};

		// Log what we're sending for debugging
		UnifiedFlowLoggerService.debug('PAR request body (before adding secret)', {
			hasClientSecret: !!parRequest.clientSecret,
			clientSecretLength: parRequest.clientSecret?.length || 0,
			authMethod,
			clientId: parRequest.clientId,
		});

		// Add optional parameters
		if (parRequest.nonce) {
			requestBody.nonce = parRequest.nonce;
		}
		if (parRequest.codeChallenge) {
			requestBody.code_challenge = parRequest.codeChallenge;
			requestBody.code_challenge_method = parRequest.codeChallengeMethod || 'S256';
		}
		if (parRequest.prompt) {
			requestBody.prompt = parRequest.prompt;
		}
		if (parRequest.maxAge !== undefined) {
			requestBody.max_age = parRequest.maxAge;
		}
		if (parRequest.loginHint) {
			requestBody.login_hint = parRequest.loginHint;
		}
		if (parRequest.display) {
			requestBody.display = parRequest.display;
		}

		// Add RAR authorization_details if provided
		if (parRequest.authorizationDetails && parRequest.authorizationDetails.length > 0) {
			requestBody.authorization_details = JSON.stringify(parRequest.authorizationDetails);
			UnifiedFlowLoggerService.debug('Added RAR authorization_details', {
				count: parRequest.authorizationDetails.length,
			});
		}

		// Handle authentication based on method
		if (authMethod === 'client_secret_jwt' || authMethod === 'private_key_jwt') {
			// JWT-based authentication: Generate client assertion
			try {
				const { createClientAssertion } = await import('@/utils/clientAuthentication');
				const parEndpointUrl = `https://auth.pingone.com/${parRequest.environmentId}/as/par`;
				
				let assertion: string;
				if (authMethod === 'client_secret_jwt') {
					if (!parRequest.clientSecret) {
						throw new Error('Client secret is required for client_secret_jwt authentication');
					}
					assertion = await createClientAssertion(
						parRequest.clientId,
						parEndpointUrl,
						parRequest.clientSecret,
						'HS256'
					);
				} else {
					// private_key_jwt
					const privateKey = (parRequest as { privateKey?: string }).privateKey;
					if (!privateKey) {
						throw new Error('Private key is required for private_key_jwt authentication');
					}
					assertion = await createClientAssertion(
						parRequest.clientId,
						parEndpointUrl,
						privateKey,
						'RS256'
					);
				}
				
				requestBody.client_assertion_type = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer';
				requestBody.client_assertion = assertion;
				
				UnifiedFlowLoggerService.debug('Generated JWT assertion for PAR', {
					authMethod,
					assertionLength: assertion.length,
				});
			} catch (error) {
				UnifiedFlowLoggerService.error('Failed to generate JWT assertion for PAR', {
					authMethod,
					error: error instanceof Error ? error.message : 'Unknown error',
				});
				throw new Error(
					`Failed to generate JWT assertion for PAR: ${error instanceof Error ? error.message : 'Unknown error'}`
				);
			}
		} else {
			// Basic authentication methods: Add client secret
			// For client_secret_basic, server uses it in Authorization header
			// For client_secret_post, server includes it in form data
			if (parRequest.clientSecret) {
				requestBody.client_secret = parRequest.clientSecret;
			} else {
				UnifiedFlowLoggerService.warn('PAR request missing client secret', {
					authMethod,
					hasClientSecret: !!parRequest.clientSecret,
				});
			}
		}

		// Make PAR request
		const startPerformance = UnifiedFlowLoggerService.startPerformance('PAR Request', {});

		// Build the actual PingOne PAR endpoint URL for display
		const actualPingOneUrl = `https://auth.pingone.com/${parRequest.environmentId}/as/par`;

		// Track API call
		const apiCallId = apiCallTrackerService.trackApiCall({
			method: 'POST',
			url: parEndpoint,
			actualPingOneUrl,
			body: {
				...requestBody,
				client_secret: requestBody.client_secret ? '[REDACTED]' : undefined,
			},
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			step: 'unified-par-push',
		});

		try {
			UnifiedFlowLoggerService.debug('Sending PAR request', {
				endpoint: parEndpoint,
				actualPingOneUrl,
				authMethod,
				hasClientSecret: !!requestBody.client_secret,
				clientSecretLength: typeof requestBody.client_secret === 'string' ? requestBody.client_secret.length : 0,
				hasClientAssertion: !!requestBody.client_assertion,
				clientAssertionLength: typeof requestBody.client_assertion === 'string' ? requestBody.client_assertion.length : 0,
				clientId: requestBody.client_id,
				environmentId: requestBody.environment_id,
			});

			const startTime = Date.now();
			const response = await fetch(parEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			const duration = Date.now() - startTime;
			startPerformance();

			const responseText = await response.text();
			let responseData: unknown = {};

			if (!response.ok) {
				let errorData: unknown = {};
				try {
					errorData = JSON.parse(responseText);
					responseData = errorData;
				} catch {
					errorData = { message: responseText };
					responseData = errorData;
				}

				// Update API call with error response
				apiCallTrackerService.updateApiCallResponse(
					apiCallId,
					{
						status: response.status,
						statusText: response.statusText,
						data: responseData,
						error: responseText.substring(0, 500),
					},
					duration
				);

				UnifiedFlowLoggerService.error('PAR request failed', {
					status: response.status,
					statusText: response.statusText,
					authMethod,
					hasClientSecret: !!parRequest.clientSecret,
					clientSecretLength: parRequest.clientSecret?.length || 0,
					error: errorData,
					errorText: responseText.substring(0, 500),
				});
				throw new Error(`PAR request failed: ${response.status} - ${responseText}`);
			}

			// Parse successful response
			try {
				responseData = JSON.parse(responseText);
			} catch {
				responseData = { message: responseText };
			}

			// Update API call with success response
			apiCallTrackerService.updateApiCallResponse(
				apiCallId,
				{
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				},
				duration
			);

			const parResponse = responseData as {
				request_uri?: string;
				requestUri?: string;
				expires_in?: number;
				expiresIn?: number;
			};

			// Parse response (handle both snake_case and camelCase)
			const requestUri = parResponse.request_uri || parResponse.requestUri;
			const expiresIn = parResponse.expires_in || parResponse.expiresIn || 600; // Default 10 minutes

			if (!requestUri) {
				throw new Error(
					`Invalid PAR response: missing request_uri. Response: ${JSON.stringify(parResponse)}`
				);
			}

			const result: PARResponse = {
				requestUri,
				expiresIn,
				expiresAt: Date.now() + expiresIn * 1000,
			};

			UnifiedFlowLoggerService.success('PAR request pushed successfully', {
				requestUri: requestUri.substring(0, 50) + '...',
				expiresIn,
			});

			return result;
		} catch (error) {
			startPerformance();
			UnifiedFlowLoggerService.error('Failed to push PAR request', {}, error instanceof Error ? error : undefined);
			throw error;
		}
	}

	/**
	 * Generate authorization URL using PAR request_uri
	 */
	static generateAuthorizationUrlWithPAR(
		environmentId: string,
		requestUri: string,
		additionalParams?: Record<string, string>
	): string {
		const authEndpoint = `https://auth.pingone.com/${environmentId}/as/authorize`;
		const params = new URLSearchParams({
			request_uri: requestUri,
			...(additionalParams || {}),
		});

		const authorizationUrl = `${authEndpoint}?${params.toString()}`;

		UnifiedFlowLoggerService.debug('Generated authorization URL with PAR', {
			requestUri: requestUri.substring(0, 50) + '...',
		});

		return authorizationUrl;
	}

	/**
	 * Validate PAR request
	 */
	static validatePARRequest(parRequest: PARRequest): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		if (!parRequest.clientId) {
			errors.push('clientId is required');
		}

		if (!parRequest.environmentId) {
			errors.push('environmentId is required');
		}

		if (!parRequest.responseType) {
			errors.push('responseType is required');
		}

		if (!parRequest.redirectUri) {
			errors.push('redirectUri is required');
		}

		if (!parRequest.scope) {
			errors.push('scope is required');
		}

		if (!parRequest.state) {
			errors.push('state is required');
		}

		// Validate redirect URI format
		try {
			new URL(parRequest.redirectUri);
		} catch {
			errors.push('redirectUri must be a valid URL');
		}

		// Validate response type
		const validResponseTypes = [
			'code',
			'token',
			'id_token',
			'code token',
			'code id_token',
			'token id_token',
			'code token id_token',
		];
		if (!validResponseTypes.includes(parRequest.responseType)) {
			errors.push(`responseType must be one of: ${validResponseTypes.join(', ')}`);
		}

		// Validate RAR authorization_details if provided
		if (parRequest.authorizationDetails) {
			for (const detail of parRequest.authorizationDetails) {
				if (!detail.type) {
					errors.push('Each authorization_detail must have a type');
				}
			}
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Build RAR authorization_details for common use cases
	 */
	static buildRARAuthorizationDetails(
		type: 'payment_initiation' | 'account_access' | 'openid_credential',
		details: Record<string, unknown>
	): AuthorizationDetail {
		const baseDetail: AuthorizationDetail = {
			type,
			...details,
		};

		return baseDetail;
	}

	/**
	 * Check if PAR is supported for flow type
	 */
	static isPARSupported(flowType: FlowType): boolean {
		return ['oauth-authz', 'implicit', 'hybrid'].includes(flowType);
	}

	/**
	 * Check if RAR is supported (preparation for future PingOne support)
	 */
	static isRARSupported(): boolean {
		// Note: PingOne does not currently support RAR, but we prepare the infrastructure
		// Return false for now, but keep the infrastructure ready
		return false;
	}
}

