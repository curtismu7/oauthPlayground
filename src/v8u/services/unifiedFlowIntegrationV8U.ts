/**
 * @file unifiedFlowIntegrationV8U.ts
 * @module v8u/services
 * @description Unified flow integration service - delegates to V8 services (real PingOne APIs)
 * @version 8.0.0
 * @since 2024-11-16
 *
 * This service acts as a facade to V8 services, providing a unified interface
 * for V8U flows. All API calls use real PingOne endpoints.
 */

import {
	type ClientCredentialsCredentials,
	ClientCredentialsIntegrationServiceV8,
} from '@/v8/services/clientCredentialsIntegrationServiceV8';
import {
	type DeviceCodeCredentials,
	DeviceCodeIntegrationServiceV8,
} from '@/v8/services/deviceCodeIntegrationServiceV8';
import {
	type HybridFlowCredentials,
	HybridFlowIntegrationServiceV8,
} from '@/v8/services/hybridFlowIntegrationServiceV8';
import { ImplicitFlowIntegrationServiceV8 } from '@/v8/services/implicitFlowIntegrationServiceV8';
import {
	type OAuthCredentials,
	OAuthIntegrationServiceV8,
} from '@/v8/services/oauthIntegrationServiceV8';
import { RedirectUriServiceV8 } from '@/v8/services/redirectUriServiceV8';
import {
	type ROPCCredentials,
	ROPCIntegrationServiceV8,
} from '@/v8/services/ropcIntegrationServiceV8';
import {
	type FlowType,
	type SpecVersion,
	SpecVersionServiceV8,
} from '@/v8/services/specVersionServiceV8';
import { UnifiedFlowOptionsServiceV8 } from '@/v8/services/unifiedFlowOptionsServiceV8';

const MODULE_TAG = '[🔗 UNIFIED-FLOW-INTEGRATION-V8U]';

export interface UnifiedFlowCredentials {
	environmentId: string;
	clientId: string;
	clientSecret?: string;
	redirectUri?: string;
	postLogoutRedirectUri?: string;
	logoutUri?: string;
	scopes?: string;
	loginHint?: string;
	clientAuthMethod?:
		| 'none'
		| 'client_secret_basic'
		| 'client_secret_post'
		| 'client_secret_jwt'
		| 'private_key_jwt';
	responseType?: string;
	issuerUrl?: string;
	usePKCE?: boolean;
	enableRefreshToken?: boolean;
	prompt?: 'none' | 'login' | 'consent';
}

export interface UnifiedFlowState {
	specVersion: SpecVersion;
	flowType: FlowType;
	credentials: UnifiedFlowCredentials;
	authorizationUrl?: string;
	authorizationCode?: string;
	tokens?: {
		accessToken?: string;
		idToken?: string;
		refreshToken?: string;
		expiresIn?: number;
	};
	error?: string;
}

/**
 * UnifiedFlowIntegrationV8U
 *
 * Facade to V8 services providing unified flow integration with real PingOne APIs
 */
export class UnifiedFlowIntegrationV8U {
	/**
	 * Get available flows for a spec version
	 * Delegates to SpecVersionServiceV8
	 */
	static getAvailableFlows(specVersion: SpecVersion): FlowType[] {
		console.log(`${MODULE_TAG} Getting available flows for spec`, { specVersion });
		return SpecVersionServiceV8.getAvailableFlows(specVersion);
	}

	/**
	 * Check if a flow is available for a spec version
	 * Delegates to SpecVersionServiceV8
	 */
	static isFlowAvailable(specVersion: SpecVersion, flowType: FlowType): boolean {
		return SpecVersionServiceV8.isFlowAvailable(specVersion, flowType);
	}

	/**
	 * Get flow options for spec version + flow type
	 * Delegates to UnifiedFlowOptionsServiceV8
	 */
	static getFlowOptions(specVersion: SpecVersion, flowType: FlowType) {
		return UnifiedFlowOptionsServiceV8.getOptionsForFlow(specVersion, flowType);
	}

	/**
	 * Get field visibility for spec version + flow type
	 * Delegates to UnifiedFlowOptionsServiceV8
	 */
	static getFieldVisibility(specVersion: SpecVersion, flowType: FlowType) {
		return UnifiedFlowOptionsServiceV8.getFieldVisibility(specVersion, flowType);
	}

	/**
	 * Get checkbox availability for spec version + flow type
	 * Delegates to UnifiedFlowOptionsServiceV8
	 */
	static getCheckboxAvailability(specVersion: SpecVersion, flowType: FlowType) {
		return UnifiedFlowOptionsServiceV8.getCheckboxAvailability(specVersion, flowType);
	}

	/**
	 * Get compliance errors (critical violations that block execution)
	 * @param specVersion - Spec version
	 * @param flowType - Flow type
	 * @returns Array of error messages for critical violations
	 */
	static getComplianceErrors(specVersion: SpecVersion, flowType: FlowType): string[] {
		return UnifiedFlowOptionsServiceV8.getComplianceErrors(specVersion, flowType);
	}

	/**
	 * Get compliance warnings for spec version + flow type
	 * Delegates to UnifiedFlowOptionsServiceV8
	 */
	static getComplianceWarnings(specVersion: SpecVersion, flowType: FlowType): string[] {
		return UnifiedFlowOptionsServiceV8.getComplianceWarnings(specVersion, flowType);
	}

	/**
	 * Generate authorization URL
	 * Delegates to appropriate V8 integration service based on flow type
	 * @param specVersion - Spec version
	 * @param flowType - Flow type
	 * @param credentials - Flow credentials
	 * @param pkceCodes - Optional PKCE codes (if provided, will be used instead of generating new ones)
	 */
	static generateAuthorizationUrl(
		specVersion: SpecVersion,
		flowType: FlowType,
		credentials: UnifiedFlowCredentials,
		pkceCodes?: {
			codeVerifier: string;
			codeChallenge: string;
			codeChallengeMethod: 'S256' | 'plain';
		}
	) {
		console.log(`${MODULE_TAG} 🔍 Generating authorization URL`, {
			specVersion,
			flowType,
			flowTypeType: typeof flowType,
			flowTypeValue: JSON.stringify(flowType),
			hasPKCE: !!pkceCodes,
			isImplicit: flowType === 'implicit',
			isOAuthAuthz: flowType === 'oauth-authz',
		});

		// CRITICAL FIX: Always use the correct redirect URI for the flow type
		// Don't trust credentials.redirectUri as it might be from a different flow
		const flowKey = `${flowType}-v8u`;
		const correctRedirectUri = RedirectUriServiceV8.getRedirectUriForFlow(flowKey);
		
		console.log(`${MODULE_TAG} Redirect URI validation`, {
			flowType,
			flowKey,
			credentialsRedirectUri: credentials.redirectUri,
			correctRedirectUri,
			willUseCorrect: !!correctRedirectUri,
		});

		// Implicit flow
		if (flowType === 'implicit') {
			console.log(`${MODULE_TAG} ✅ Using IMPLICIT FLOW - generating URL with response_type=token id_token`);
			const result = ImplicitFlowIntegrationServiceV8.generateAuthorizationUrl({
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				redirectUri: correctRedirectUri || credentials.redirectUri || '',
				scopes: credentials.scopes || 'openid profile email',
			});
			
			// CRITICAL FIX: Prefix state with flow type BEFORE building the URL
			// We need to rebuild the authorization URL with the prefixed state
			const prefixedState = `v8u-implicit-${result.state}`;
			const authorizationEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/authorize`;
			const params = new URLSearchParams({
				client_id: credentials.clientId,
				response_type: 'token id_token',
				redirect_uri: correctRedirectUri || credentials.redirectUri || '',
				scope: credentials.scopes || 'openid profile email',
				state: prefixedState, // Use prefixed state here!
				nonce: result.nonce,
				response_mode: 'fragment',
			});

			// Add prompt parameter if specified
			if (credentials.prompt) {
				params.set('prompt', credentials.prompt);
			}

			const authorizationUrl = `${authorizationEndpoint}?${params.toString()}`;
			
			console.log(`${MODULE_TAG} ✅ Implicit flow URL generated with prefixed state`, {
				hasAuthUrl: !!authorizationUrl,
				originalState: result.state,
				prefixedState: prefixedState,
				authUrlPreview: authorizationUrl.substring(0, 200),
			});
			console.log(`${MODULE_TAG} 🔑 STATE FOR IMPLICIT FLOW: "${prefixedState}"`);
			console.log(`${MODULE_TAG} 🔑 This prefixed state is now in the authorization URL`);
			
			return {
				authorizationUrl,
				state: prefixedState,
				nonce: result.nonce,
			};
		}

		// Authorization code flow
		if (flowType === 'oauth-authz') {
			const oauthCredentials: OAuthCredentials = {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				redirectUri: correctRedirectUri || credentials.redirectUri || '',
				scopes: credentials.scopes || 'openid profile email',
			};
			if (credentials.clientSecret) {
				oauthCredentials.clientSecret = credentials.clientSecret;
			}
			const result = OAuthIntegrationServiceV8.generateAuthorizationUrl(oauthCredentials, pkceCodes);
			
			// CRITICAL FIX: Prefix state with flow type BEFORE building the URL
			// We need to rebuild the authorization URL with the prefixed state
			const prefixedState = `v8u-oauth-authz-${result.state}`;
			const authorizationEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/authorize`;
			const params = new URLSearchParams({
				client_id: credentials.clientId,
				response_type: 'code',
				redirect_uri: correctRedirectUri || credentials.redirectUri || '',
				scope: credentials.scopes || 'openid profile email',
				state: prefixedState, // Use prefixed state
			});
			
			// Add prompt parameter if specified
			if (credentials.prompt) {
				params.set('prompt', credentials.prompt);
			}
			
			// Add PKCE parameters if provided
			if (pkceCodes) {
				params.set('code_challenge', pkceCodes.codeChallenge);
				params.set('code_challenge_method', pkceCodes.codeChallengeMethod);
			}
			
			const authorizationUrl = `${authorizationEndpoint}?${params.toString()}`;
			
			console.log(`${MODULE_TAG} ✅ OAuth authz URL generated with prefixed state`, {
				prefixedState,
				hasPKCE: !!pkceCodes,
			});
			
			return {
				authorizationUrl,
				state: prefixedState,
				...(pkceCodes && {
					codeVerifier: pkceCodes.codeVerifier,
					codeChallenge: pkceCodes.codeChallenge,
				}),
			};
		}

		// Hybrid flow
		if (flowType === 'hybrid') {
			const hybridCredentials: HybridFlowCredentials = {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				redirectUri: correctRedirectUri || credentials.redirectUri || '',
				scopes: credentials.scopes || 'openid profile email',
				responseType:
					(credentials.responseType as 'code id_token' | 'code token' | 'code token id_token') ||
					'code id_token',
			};
			if (credentials.clientSecret) {
				hybridCredentials.clientSecret = credentials.clientSecret;
			}
			const result = HybridFlowIntegrationServiceV8.generateAuthorizationUrl(hybridCredentials, pkceCodes);
			
			// CRITICAL FIX: Prefix state with flow type BEFORE building the URL
			// We need to rebuild the authorization URL with the prefixed state
			const prefixedState = `v8u-hybrid-${result.state}`;
			const authorizationEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/authorize`;
			const params = new URLSearchParams({
				client_id: credentials.clientId,
				response_type: hybridCredentials.responseType,
				redirect_uri: correctRedirectUri || credentials.redirectUri || '',
				scope: credentials.scopes || 'openid profile email',
				state: prefixedState, // Use prefixed state
				nonce: result.nonce,
				response_mode: 'fragment',
			});

			// Add prompt parameter if specified
			if (credentials.prompt) {
				params.set('prompt', credentials.prompt);
			}

			const authorizationUrl = `${authorizationEndpoint}?${params.toString()}`;
			
			console.log(`${MODULE_TAG} ✅ Hybrid flow URL generated with prefixed state`, {
				prefixedState,
			});
			
			return {
				authorizationUrl,
				state: prefixedState,
				nonce: result.nonce,
			};
		}

		// Device code flow - returns device authorization response (not authorization URL)
		if (flowType === 'device-code') {
			// This returns device authorization, not an authorization URL
			// The UI should handle this differently
			throw new Error(
				'Device Code flow does not use authorization URLs. Please use the "Request Device Code" button instead.'
			);
		}

		// Client credentials and ROPC don't use authorization URLs
		if (flowType === 'client-credentials' || flowType === 'ropc') {
			const flowName = flowType === 'client-credentials' ? 'Client Credentials' : 'Resource Owner Password Credentials';
			throw new Error(
				`${flowName} flow does not use authorization URLs. Please use the "Request Token" button instead.`
			);
		}

		throw new Error(`The ${flowType} flow is not supported for authorization URL generation.`);
	}

	/**
	 * Request device authorization (for device code flow)
	 * @param credentials - OAuth credentials
	 * @returns Device authorization response
	 */
	static async requestDeviceAuthorization(credentials: UnifiedFlowCredentials) {
		console.log(`${MODULE_TAG} Requesting device authorization`);

		if (!credentials.environmentId || !credentials.clientId) {
			throw new Error('Please provide both Environment ID and Client ID in the configuration section above.');
		}

		const deviceCredentials: DeviceCodeCredentials = {
			environmentId: credentials.environmentId,
			clientId: credentials.clientId,
			clientSecret: credentials.clientSecret,
			clientAuthMethod: credentials.clientAuthMethod,
		};
		if (credentials.scopes) {
			deviceCredentials.scopes = credentials.scopes;
		}
		return DeviceCodeIntegrationServiceV8.requestDeviceAuthorization(deviceCredentials);
	}

	/**
	 * Poll for tokens (for device code flow)
	 * @param credentials - OAuth credentials
	 * @param deviceCode - Device code from authorization response
	 * @param interval - Polling interval in seconds
	 * @param maxAttempts - Maximum polling attempts
	 * @returns Token response
	 */
	static async pollForTokens(
		credentials: UnifiedFlowCredentials,
		deviceCode: string,
		interval: number = 5,
		maxAttempts: number = 60
	) {
		console.log(`${MODULE_TAG} Polling for tokens`);

		if (!credentials.environmentId || !credentials.clientId) {
			throw new Error('Please provide both Environment ID and Client ID in the configuration section above.');
		}

		const deviceCredentials: DeviceCodeCredentials = {
			environmentId: credentials.environmentId,
			clientId: credentials.clientId,
			clientSecret: credentials.clientSecret,
			clientAuthMethod: credentials.clientAuthMethod,
		};
		if (credentials.scopes) {
			deviceCredentials.scopes = credentials.scopes;
		}
		return DeviceCodeIntegrationServiceV8.pollForTokens(
			deviceCredentials,
			deviceCode,
			interval,
			maxAttempts
		);
	}

	/**
	 * Request token (for client credentials or ROPC flows)
	 * @param flowType - Flow type (client-credentials or ropc)
	 * @param credentials - OAuth credentials
	 * @param username - Username (for ROPC only)
	 * @param password - Password (for ROPC only)
	 * @returns Token response
	 */
	static async requestToken(
		flowType: 'client-credentials' | 'ropc',
		credentials: UnifiedFlowCredentials,
		username?: string,
		password?: string
	) {
		console.log(`${MODULE_TAG} Requesting token`, { flowType });

		if (flowType === 'client-credentials') {
			if (!credentials.environmentId || !credentials.clientId || !credentials.clientSecret) {
				throw new Error(
					'Client Credentials flow requires Environment ID, Client ID, and Client Secret. Please fill in all required fields in the configuration section above.'
				);
			}

			const ccCredentials: ClientCredentialsCredentials = {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				clientSecret: credentials.clientSecret,
			};
			if (credentials.scopes) {
				ccCredentials.scopes = credentials.scopes;
				console.log(`${MODULE_TAG} Passing scopes to client credentials service:`, credentials.scopes);
			} else {
				console.warn(`${MODULE_TAG} No scopes provided in credentials for client credentials flow`);
			}
			// Pass clientAuthMethod if available and valid (service will default to client_secret_basic if 'none' or invalid)
			if (credentials.clientAuthMethod && credentials.clientAuthMethod !== 'none') {
				ccCredentials.clientAuthMethod = credentials.clientAuthMethod;
			}
			// Pass private key if available (required for private_key_jwt authentication)
			const privateKey = (credentials as { privateKey?: string }).privateKey;
			if (privateKey) {
				ccCredentials.privateKey = privateKey;
			}
			console.log(`${MODULE_TAG} Client credentials request config:`, {
				environmentId: ccCredentials.environmentId,
				clientId: ccCredentials.clientId,
				hasClientSecret: !!ccCredentials.clientSecret,
				scopes: ccCredentials.scopes || '(none)',
				authMethod: ccCredentials.clientAuthMethod || 'client_secret_basic',
			});
			return ClientCredentialsIntegrationServiceV8.requestToken(ccCredentials);
		}

		if (flowType === 'ropc') {
			if (!credentials.environmentId || !credentials.clientId || !credentials.clientSecret) {
				throw new Error('Resource Owner Password Credentials flow requires Environment ID, Client ID, and Client Secret. Please fill in all required fields in the configuration section above.');
			}

			if (!username || !password) {
				throw new Error('Please provide both username and password to authenticate with ROPC flow.');
			}

			const ropcCredentials: ROPCCredentials = {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				clientSecret: credentials.clientSecret,
			};
			if (credentials.scopes) {
				ropcCredentials.scopes = credentials.scopes;
			}
			return ROPCIntegrationServiceV8.requestToken(ropcCredentials, username, password);
		}

		throw new Error(`The ${flowType} flow does not support direct token requests. Please use the appropriate flow steps.`);
	}

	/**
	 * Exchange authorization code for tokens (for authorization code and hybrid flows)
	 * @param flowType - Flow type (oauth-authz or hybrid)
	 * @param credentials - OAuth credentials
	 * @param code - Authorization code
	 * @param codeVerifier - PKCE code verifier (if used)
	 * @returns Token response
	 */
	static async exchangeCodeForTokens(
		flowType: 'oauth-authz' | 'hybrid',
		credentials: UnifiedFlowCredentials,
		code: string,
		codeVerifier?: string
	) {
		console.log(`${MODULE_TAG} ========== SERVICE LAYER: exchangeCodeForTokens ==========`);
		console.log(`${MODULE_TAG} Flow Type:`, flowType);
		console.log(`${MODULE_TAG} Credentials received:`, {
			environmentId: credentials.environmentId,
			clientId: credentials.clientId,
			hasClientSecret: !!credentials.clientSecret,
			clientSecretLength: credentials.clientSecret?.length,
			redirectUri: credentials.redirectUri,
			usePKCE: credentials.usePKCE,
			scopes: credentials.scopes,
			clientAuthMethod: credentials.clientAuthMethod,
		});
		console.log(`${MODULE_TAG} Code length:`, code?.length);
		console.log(`${MODULE_TAG} Code verifier length:`, codeVerifier?.length);
		console.log(`${MODULE_TAG} Has code verifier:`, !!codeVerifier);

		if (flowType === 'oauth-authz') {
			console.log(`${MODULE_TAG} Processing OAuth Authorization Code flow`);

			// Validate required fields based on PKCE usage
			if (!credentials.environmentId || !credentials.clientId) {
				console.error(`${MODULE_TAG} ❌ Missing required fields:`, {
					hasEnvironmentId: !!credentials.environmentId,
					hasClientId: !!credentials.clientId,
				});
				throw new Error('Please provide both Environment ID and Client ID in the configuration section above.');
			}

			// Redirect URI is only required when PKCE is NOT enabled
			if (!credentials.usePKCE && !credentials.redirectUri) {
				console.error(`${MODULE_TAG} ❌ PKCE not enabled and redirect URI missing`);
				throw new Error('Redirect URI is required when PKCE is not enabled. Please go back to the configuration step and provide a Redirect URI.');
			}

			// Code verifier is only required when PKCE IS enabled
			if (credentials.usePKCE && !codeVerifier) {
				console.error(`${MODULE_TAG} ❌ PKCE enabled but code verifier missing`);
				throw new Error('PKCE is enabled but the code verifier is missing. Please go back and generate PKCE parameters first.');
			}

			console.log(`${MODULE_TAG} ✅ Validation passed, building OAuth credentials object`);
			const oauthCredentials: OAuthCredentials = {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				redirectUri: credentials.redirectUri || '',
				scopes: credentials.scopes || 'openid profile email',
			};
			if (credentials.clientSecret) {
				oauthCredentials.clientSecret = credentials.clientSecret;
				console.log(
					`${MODULE_TAG} Client secret included (length: ${credentials.clientSecret.length})`
				);
			} else {
				console.log(`${MODULE_TAG} No client secret provided`);
			}

			console.log(`${MODULE_TAG} OAuth credentials prepared:`, {
				environmentId: oauthCredentials.environmentId,
				clientId: oauthCredentials.clientId,
				redirectUri: oauthCredentials.redirectUri,
				scopes: oauthCredentials.scopes,
				hasClientSecret: !!oauthCredentials.clientSecret,
			});

			console.log(`${MODULE_TAG} 🚀 Calling OAuthIntegrationServiceV8.exchangeCodeForTokens...`);
			console.log(`${MODULE_TAG} Parameters:`, {
				hasCredentials: !!oauthCredentials,
				codeLength: code.length,
				codeVerifierLength: codeVerifier?.length,
				hasCodeVerifier: !!codeVerifier,
			});

			return OAuthIntegrationServiceV8.exchangeCodeForTokens(oauthCredentials, code, codeVerifier || '');
		}

		if (flowType === 'hybrid') {
			// Validate required fields based on PKCE usage
			if (!credentials.environmentId || !credentials.clientId) {
				throw new Error('Please provide both Environment ID and Client ID in the configuration section above.');
			}

			// Redirect URI is only required when PKCE is NOT enabled
			if (!credentials.usePKCE && !credentials.redirectUri) {
				throw new Error('Redirect URI is required when PKCE is not enabled. Please go back to the configuration step and provide a Redirect URI.');
			}

			const hybridCredentials: HybridFlowCredentials = {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				redirectUri: credentials.redirectUri || '',
				scopes: credentials.scopes || 'openid profile email',
				responseType:
					(credentials.responseType as 'code id_token' | 'code token' | 'code token id_token') ||
					'code id_token',
			};
			if (credentials.clientSecret) {
				hybridCredentials.clientSecret = credentials.clientSecret;
			}
			return HybridFlowIntegrationServiceV8.exchangeCodeForTokens(
				hybridCredentials,
				code,
				codeVerifier
			);
		}

		throw new Error(`The ${flowType} flow does not support code exchange. This is likely a configuration error.`);
	}

	/**
	 * Parse callback fragment (for implicit and hybrid flows)
	 * @param flowType - Flow type (implicit or hybrid)
	 * @param callbackUrl - Full callback URL with fragment
	 * @param expectedState - Expected state parameter for validation
	 * @param expectedNonce - Expected nonce (for OIDC)
	 * @returns Parsed tokens and/or code
	 */
	static parseCallbackFragment(
		flowType: 'implicit' | 'hybrid',
		callbackUrl: string,
		expectedState: string,
		expectedNonce?: string
	) {
		console.log(`${MODULE_TAG} Parsing callback fragment`, { flowType });

		if (flowType === 'implicit') {
			const result = ImplicitFlowIntegrationServiceV8.parseCallbackFragment(
				callbackUrl,
				expectedState
			);

			// Validate nonce if provided
			if (expectedNonce && result.id_token) {
				const nonceValid = ImplicitFlowIntegrationServiceV8.validateNonce(
					result.id_token,
					expectedNonce
				);
				if (!nonceValid) {
					throw new Error('Security validation failed: The nonce in the ID token does not match the expected value. This could indicate a security issue or replay attack.');
				}
			}

			return result;
		}

		if (flowType === 'hybrid') {
			const result = HybridFlowIntegrationServiceV8.parseCallbackFragment(
				callbackUrl,
				expectedState
			);

			// Validate nonce if provided
			if (expectedNonce && result.id_token) {
				const nonceValid = HybridFlowIntegrationServiceV8.validateNonce(
					result.id_token,
					expectedNonce
				);
				if (!nonceValid) {
					throw new Error('Security validation failed: The nonce in the ID token does not match the expected value. This could indicate a security issue or replay attack.');
				}
			}

			return result;
		}

		throw new Error(`Invalid flow type for parseCallbackFragment: ${flowType}`);
	}

	/**
	 * Parse callback URL (for authorization code flow)
	 * Delegates to OAuthIntegrationServiceV8
	 */
	static parseCallbackUrl(callbackUrl: string, expectedState: string) {
		return OAuthIntegrationServiceV8.parseCallbackUrl(callbackUrl, expectedState);
	}

	/**
	 * Validate configuration
	 * Delegates to SpecVersionServiceV8
	 */
	static validateConfiguration(
		specVersion: SpecVersion,
		flowType: FlowType,
		credentials: UnifiedFlowCredentials
	) {
		return SpecVersionServiceV8.validateConfiguration(specVersion, flowType, credentials);
	}
}
