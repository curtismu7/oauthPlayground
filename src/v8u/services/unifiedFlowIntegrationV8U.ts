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

import type { ResponseMode } from '@/services/responseModeService';
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
// ROPC flow removed - not supported by PingOne, use mock flows instead
import {
	type FlowType,
	type SpecVersion,
	SpecVersionServiceV8,
} from '@/v8/services/specVersionServiceV8';
import { UnifiedFlowOptionsServiceV8 } from '@/v8/services/unifiedFlowOptionsServiceV8';
import { UnifiedFlowErrorHandler } from './unifiedFlowErrorHandlerV8U';
import { logger } from './unifiedFlowLoggerServiceV8U';

const _MODULE_TAG = '[🔗 UNIFIED-FLOW-INTEGRATION-V8U]';

export interface UnifiedFlowCredentials {
	environmentId: string;
	clientId: string;
	clientSecret?: string;
	privateKey?: string; // For private_key_jwt authentication
	redirectUri?: string;
	postLogoutRedirectUri?: string;
	logoutUri?: string;
	scopes?: string;
	clientAuthMethod?:
		| 'none'
		| 'client_secret_basic'
		| 'client_secret_post'
		| 'client_secret_jwt'
		| 'private_key_jwt';
	responseType?: string;
	issuerUrl?: string;
	usePKCE?: boolean; // Legacy field - kept for backward compatibility
	pkceEnforcement?: 'OPTIONAL' | 'REQUIRED' | 'S256_REQUIRED'; // PKCE enforcement level from PingOne
	enableRefreshToken?: boolean;
	refreshTokenType?: 'JWT' | 'OPAQUE'; // Refresh token type: JWT (default) or OPAQUE (more secure)
	flowKey?: string; // Flow identifier for PKCE storage
	responseMode?: ResponseMode; // How authorization response is returned (query, fragment, form_post, pi.flow)
	useRedirectless?: boolean; // DEPRECATED: Use responseMode='pi.flow' instead. Kept for backward compatibility.
	prompt?: 'none' | 'login' | 'consent';
	loginHint?: string; // Pre-fills username/email in login form
	maxAge?: number; // Maximum authentication age in seconds - forces re-auth if session is older
	display?: 'page' | 'popup' | 'touch' | 'wap'; // Controls how authentication UI is displayed
	usePAR?: boolean; // Enable Pushed Authorization Requests (RFC 9126) - PAR pushes auth parameters to server before redirect
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
		logger.debug(`Getting available flows for spec`, { specVersion });
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
	 * Generate authorization URL for OAuth/OIDC flows
	 *
	 * This is a unified entry point that delegates to flow-specific services:
	 * - Implicit flow → ImplicitFlowIntegrationServiceV8
	 * - Authorization Code flow → OAuthIntegrationServiceV8
	 * - Hybrid flow → HybridFlowIntegrationServiceV8
	 *
	 * CRITICAL: State prefixing for callback handling
	 * All flows prefix the state parameter with their flow type (e.g., "v8u-oauth-authz-{state}").
	 * This allows the callback handler to identify which flow initiated the request,
	 * enabling proper routing and state validation.
	 *
	 * @param specVersion - OAuth/OIDC specification version (oauth2.0, oauth2.1, oidc)
	 * @param flowType - Flow type (oauth-authz, implicit, hybrid, etc.)
	 * @param credentials - OAuth credentials (clientId, environmentId, redirectUri, etc.)
	 * @param pkceCodes - Optional PKCE codes for secure public client flows
	 *                    If provided, these will be used instead of generating new ones
	 *                    Required for OAuth 2.1 public clients
	 * @returns Promise resolving to authorization URL and associated parameters
	 * @throws Error if flow type doesn't support authorization URLs (e.g., client-credentials, device-code)
	 *
	 * @example
	 * const result = await UnifiedFlowIntegrationV8U.generateAuthorizationUrl(
	 *   'oidc',
	 *   'oauth-authz',
	 *   credentials,
	 *   { codeVerifier: '...', codeChallenge: '...', codeChallengeMethod: 'S256' }
	 * );
	 * // result.authorizationUrl contains the full URL to redirect user to
	 * // result.state contains the prefixed state parameter for callback validation
	 */
	static async generateAuthorizationUrl(
		specVersion: SpecVersion,
		flowType: FlowType,
		credentials: UnifiedFlowCredentials,
		pkceCodes?: {
			codeVerifier: string;
			codeChallenge: string;
			codeChallengeMethod: 'S256' | 'plain';
		},
		appConfig?: { requireSignedRequestObject?: boolean }
	) {
		logger.debug(`🔍 Generating authorization URL`, {
			specVersion,
			flowType,
			flowTypeType: typeof flowType,
			flowTypeValue: JSON.stringify(flowType),
			hasPKCE: !!pkceCodes,
			isImplicit: flowType === 'implicit',
			isOAuthAuthz: flowType === 'oauth-authz',
			responseMode:
				credentials.responseMode || (credentials.useRedirectless ? 'pi.flow' : 'fragment'),
		});

		/**
		 * CRITICAL FIX: Use user's configured redirect URI if set, otherwise use flow-specific default
		 *
		 * Problem: We were prioritizing the auto-generated redirect URI over the user's configured URI,
		 * causing "invalid redirect URI" errors when the user's URI (which matches PingOne) was different.
		 *
		 * Solution: Prioritize credentials.redirectUri if set (user knows what's configured in PingOne),
		 * only fall back to auto-generated URI if credentials.redirectUri is empty.
		 */
		const flowKey = `${flowType}-v8u`;
		const defaultRedirectUri = RedirectUriServiceV8.getRedirectUriForFlow(flowKey);
		// Prioritize user's configured redirect URI (matches PingOne config) over auto-generated default
		const redirectUriToUse = credentials.redirectUri?.trim() || defaultRedirectUri || '';

		logger.debug(`Redirect URI validation`, {
			flowType,
			flowKey,
			credentialsRedirectUri: credentials.redirectUri,
			defaultRedirectUri,
			redirectUriToUse,
			usingConfigured: !!credentials.redirectUri?.trim(),
		});

		// Implicit flow
		if (flowType === 'implicit') {
			logger.debug(`✅ Using IMPLICIT FLOW - generating URL with response_type=token id_token`);
			// Ensure offline_access is included if enableRefreshToken is true (though implicit flow doesn't support refresh tokens)
			let scopesToUse = credentials.scopes || 'openid profile email';
			if (credentials.enableRefreshToken && !scopesToUse.includes('offline_access')) {
				scopesToUse = `${scopesToUse.trim()} offline_access`;
				logger.debug(
					`⚠️ Note: Implicit flow doesn't support refresh tokens, but adding offline_access scope anyway`
				);
			}

			const startTime = Date.now();
			const authorizationEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/authorize`;

			const result = await ImplicitFlowIntegrationServiceV8.generateAuthorizationUrl(
				{
					environmentId: credentials.environmentId,
					clientId: credentials.clientId,
					clientSecret: credentials.clientSecret,
					privateKey: credentials.privateKey,
					redirectUri: redirectUriToUse,
					scopes: scopesToUse,
					clientAuthMethod: credentials.clientAuthMethod,
				},
				appConfig
			);

			// CRITICAL FIX: Use the exact redirect_uri from the generated URL, not from storage
			// Parse the generated URL to extract the redirect_uri that was actually used
			const generatedUrl = new URL(result.authorizationUrl);
			const redirectUriFromUrl = generatedUrl.searchParams.get('redirect_uri') || '';

			logger.debug(`Using redirect_uri from generated URL:`, {
				redirectUriFromUrl,
				redirectUriToUse,
				match: redirectUriFromUrl === redirectUriToUse,
				generatedUrlPreview: result.authorizationUrl.substring(0, 200),
			});

			// Prefix state with flow type for callback routing
			const prefixedState = `v8u-implicit-${result.state}`;

			// Rebuild URL using ALL params from generated URL, then update only state
			// This preserves the exact redirect_uri and all other params from the generated URL
			const params = new URLSearchParams(generatedUrl.searchParams); // Copy all params from generated URL
			params.set('state', prefixedState); // Update only the state parameter

			// Add prompt parameter if specified
			if (credentials.prompt) {
				params.set('prompt', credentials.prompt);
			}

			// Add login_hint parameter if specified
			if (credentials.loginHint) {
				params.set('login_hint', credentials.loginHint);
				logger.debug(`👤 Added login_hint: ${credentials.loginHint}`);
			}

			// Add max_age parameter if specified
			if (credentials.maxAge !== undefined) {
				params.set('max_age', credentials.maxAge.toString());
				logger.debug(`⏱️ Added max_age: ${credentials.maxAge}s`);
			}

			// Add display parameter if specified
			if (credentials.display) {
				params.set('display', credentials.display);
				logger.debug(`🖥️ Added display: ${credentials.display}`);
			}

			// Add response_mode parameter (supports query, fragment, form_post, pi.flow)
			const responseMode =
				credentials.responseMode || (credentials.useRedirectless ? 'pi.flow' : 'fragment');
			params.set('response_mode', responseMode);

			// Track authorization URL generation as an API call for documentation
			const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
			const apiCallId = apiCallTrackerService.trackApiCall({
				method: 'GET',
				url: authorizationEndpoint,
				actualPingOneUrl: authorizationEndpoint,
				isProxy: false,
				headers: {},
				body: Object.fromEntries(params.entries()),
				step: 'unified-authorization-url',
				flowType: 'unified',
			});

			// Update with "response" (authorization URL generated)
			apiCallTrackerService.updateApiCallResponse(
				apiCallId,
				{
					status: 200,
					statusText: 'OK',
					data: {
						authorization_url: `${authorizationEndpoint}?${params.toString()}`,
						note: 'Authorization URL generated. User will be redirected to PingOne for authentication.',
						flow: 'implicit',
						returns_tokens_in: responseMode === 'fragment' ? 'URL Fragment' : 'Query Parameters',
					},
				},
				Date.now() - startTime
			);
			logger.debug(`🔗 Response mode set to: ${responseMode}`);

			const authorizationUrl = `${authorizationEndpoint}?${params.toString()}`;

			logger.debug(`✅ Implicit flow URL generated with prefixed state`, {
				hasAuthUrl: !!authorizationUrl,
				originalState: result.state,
				prefixedState: prefixedState,
				authUrlPreview: authorizationUrl.substring(0, 200),
				responseMode: responseMode,
			});
			logger.debug(`🔑 STATE FOR IMPLICIT FLOW: "${prefixedState}"`);
			logger.debug(`🔑 This prefixed state is now in the authorization URL`);

			return {
				authorizationUrl,
				state: prefixedState,
				nonce: result.nonce,
			};
		}

		/**
		 * AUTHORIZATION CODE FLOW - Generate authorization URL
		 *
		 * This is the most secure and recommended OAuth flow. It uses a two-step process:
		 * 1. User authenticates and receives an authorization code (not tokens)
		 * 2. Application exchanges the code for tokens using client secret
		 *
		 * Flow steps:
		 * 1. Generate authorization URL with PKCE (if enabled)
		 * 2. User authenticates on PingOne
		 * 3. PingOne redirects with authorization code in query string (?code=...)
		 * 4. Application exchanges code for tokens using token endpoint
		 *
		 * PKCE (Proof Key for Code Exchange):
		 * - Required for OAuth 2.1 public clients
		 * - Recommended for all clients (even confidential ones)
		 * - Prevents authorization code interception attacks
		 * - Uses code_verifier (secret) and code_challenge (public) pair
		 *
		 * PAR (Pushed Authorization Requests):
		 * - If enabled, push authorization parameters to server first
		 * - Use request_uri instead of all parameters in authorization URL
		 * - More secure and supports larger/complex requests
		 */
		if (flowType === 'oauth-authz') {
			// Generate state for PAR or regular flow
			const baseState = `state-${Date.now()}-${Math.random().toString(36).substring(7)}`;
			const prefixedState = `v8u-oauth-authz-${baseState}`;

			// If PAR is enabled, push PAR request and use request_uri in authorization URL
			if (credentials.usePAR) {
				logger.debug(`📤 PAR enabled - pushing authorization request first`, {
					usePAR: credentials.usePAR,
					clientId: credentials.clientId,
					hasClientSecret: !!credentials.clientSecret,
					clientAuthMethod: credentials.clientAuthMethod,
				});

				try {
					// Import PAR service
					const { PARRARIntegrationServiceV8U } = await import('./parRarIntegrationServiceV8U');

					// Build PAR request
					const parRequest = PARRARIntegrationServiceV8U.buildPARRequest(
						specVersion,
						flowType,
						{
							...credentials,
							redirectUri: redirectUriToUse,
						},
						prefixedState,
						undefined, // nonce - not needed for authz code flow
						pkceCodes
					);

					logger.debug(`📋 PAR request built`, {
						hasClientSecret: !!parRequest.clientSecret,
						redirectUri: parRequest.redirectUri,
						scope: parRequest.scope,
						state: parRequest.state,
					});

					// Determine auth method for PAR request
					const parAuthMethod =
						credentials.clientAuthMethod === 'client_secret_basic' ||
						credentials.clientAuthMethod === 'client_secret_post' ||
						credentials.clientAuthMethod === 'private_key_jwt' ||
						credentials.clientAuthMethod === 'client_secret_jwt'
							? credentials.clientAuthMethod
							: 'client_secret_post';

					logger.debug(`🔐 Using PAR auth method: ${parAuthMethod}`);

					// Push PAR request
					const parResponse = await PARRARIntegrationServiceV8U.pushPARRequest(
						parRequest,
						parAuthMethod as
							| 'client_secret_basic'
							| 'client_secret_post'
							| 'private_key_jwt'
							| 'client_secret_jwt'
					);

					if (!parResponse.requestUri) {
						throw new Error('PAR request succeeded but no request_uri was returned');
					}

					logger.debug(`✅ PAR request pushed successfully`, {
						requestUri: `${parResponse.requestUri?.substring(0, 50)}...`,
						fullRequestUri: parResponse.requestUri,
						expiresIn: parResponse.expiresIn,
					});

					// Generate authorization URL with request_uri (minimal parameters)
					const authorizationUrl = PARRARIntegrationServiceV8U.generateAuthorizationUrlWithPAR(
						credentials.environmentId,
						parResponse.requestUri,
						{
							client_id: credentials.clientId,
							// Note: state is included in the PAR request, but we can also add it here for consistency
							// However, according to RFC 9126, request_uri contains all parameters, so we only need client_id
						}
					);

					logger.debug(`✅ OAuth authz URL generated with PAR`, {
						prefixedState,
						hasPKCE: !!pkceCodes,
						requestUri: `${parResponse.requestUri?.substring(0, 50)}...`,
						authorizationUrl: `${authorizationUrl.substring(0, 200)}...`,
						urlContainsRequestUri: authorizationUrl.includes('request_uri'),
					});

					return {
						authorizationUrl,
						state: prefixedState,
						parRequestUri: parResponse.requestUri,
						parExpiresIn: parResponse.expiresIn,
						...(pkceCodes && {
							codeVerifier: pkceCodes.codeVerifier,
							codeChallenge: pkceCodes.codeChallenge,
						}),
					};
				} catch (parError) {
					// Use enhanced error handler with retry support
					UnifiedFlowErrorHandler.handleError(
						parError,
						{
							flowType,
							operation: 'pushPARRequest',
							credentials: {
								usePAR: credentials.usePAR,
								clientId: credentials.clientId,
								hasClientSecret: !!credentials.clientSecret,
								clientAuthMethod: credentials.clientAuthMethod,
							},
						},
						{
							showToast: false, // Don't show toast, we'll re-throw for UI handling
							logError: true,
						}
					);

					// Re-throw with user-friendly message
					const errorMsg = parError instanceof Error ? parError.message : 'Unknown PAR error';
					throw new Error(
						`PAR request failed: ${errorMsg}. This client requires PAR. Please ensure your client secret is correct and PAR is enabled in PingOne.`
					);
				}
			}

			// Regular flow (no PAR) - use existing logic
			// Ensure offline_access is included if enableRefreshToken is true
			let scopesToUse = credentials.scopes || 'openid profile email';
			if (credentials.enableRefreshToken && !scopesToUse.includes('offline_access')) {
				scopesToUse = `${scopesToUse.trim()} offline_access`;
				logger.debug(`✅ Added offline_access scope for refresh token`);
			}

			const oauthCredentials: OAuthCredentials = {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				redirectUri: redirectUriToUse,
				scopes: scopesToUse,
			};
			// Client secret is optional for public clients (PKCE is used instead)
			if (credentials.clientSecret) {
				oauthCredentials.clientSecret = credentials.clientSecret;
			}
			// Add private key for JAR RS256 signing if available
			if (credentials.privateKey) {
				oauthCredentials.privateKey = credentials.privateKey;
			}
			if (credentials.clientAuthMethod) {
				oauthCredentials.clientAuthMethod = credentials.clientAuthMethod;
			}
			const result = await OAuthIntegrationServiceV8.generateAuthorizationUrl(
				oauthCredentials,
				pkceCodes,
				appConfig
			);

			/**
			 * CRITICAL FIX: Prefix state with flow type for callback routing
			 *
			 * See implicit flow comment above for explanation of why state prefixing is needed.
			 * The prefix "v8u-oauth-authz-" identifies this as an authorization code flow request.
			 */
			const prefixedStateRegular = `v8u-oauth-authz-${result.state}`;
			const authorizationEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/authorize`;
			// Reuse scopesToUse that was already calculated above

			const params = new URLSearchParams({
				client_id: credentials.clientId,
				response_type: 'code',
				redirect_uri: redirectUriToUse,
				scope: scopesToUse, // Reuse scopesToUse from above (includes offline_access if enableRefreshToken is true)
				state: prefixedStateRegular, // Use prefixed state
			});

			// Debug logging for scope verification
			logger.debug(`[AUTHZ URL] Scope verification`, {
				enableRefreshToken: credentials.enableRefreshToken,
				originalScopes: credentials.scopes,
				finalScopes: scopesToUse,
				hasOfflineAccess: scopesToUse.includes('offline_access'),
				scopeParam: params.get('scope'),
			});

			// Add prompt parameter if specified
			if (credentials.prompt) {
				params.set('prompt', credentials.prompt);
			}

			// Add login_hint parameter if specified
			if (credentials.loginHint) {
				params.set('login_hint', credentials.loginHint);
				logger.debug(`👤 Added login_hint: ${credentials.loginHint}`);
			}

			// Add max_age parameter if specified
			if (credentials.maxAge !== undefined) {
				params.set('max_age', credentials.maxAge.toString());
				logger.debug(`⏱️ Added max_age: ${credentials.maxAge}s`);
			}

			// Add display parameter if specified
			if (credentials.display) {
				params.set('display', credentials.display);
				logger.debug(`🖥️ Added display: ${credentials.display}`);
			}

			// Add PKCE parameters if provided
			if (pkceCodes) {
				params.set('code_challenge', pkceCodes.codeChallenge);
				params.set('code_challenge_method', pkceCodes.codeChallengeMethod);
			}

			// Add response_mode parameter (supports query, fragment, form_post, pi.flow)
			const responseModeOAuth =
				credentials.responseMode || (credentials.useRedirectless ? 'pi.flow' : 'query');
			params.set('response_mode', responseModeOAuth);
			logger.debug(`🔗 Response mode set to: ${responseModeOAuth}`);

			const authorizationUrl = `${authorizationEndpoint}?${params.toString()}`;

			// Track authorization URL generation for API documentation
			console.log(`${_MODULE_TAG} 🔄 TRACKING: About to track authorization URL generation`);
			const startTime = Date.now();
			const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
			const apiCallId = apiCallTrackerService.trackApiCall({
				method: 'GET',
				url: authorizationEndpoint,
				actualPingOneUrl: authorizationEndpoint,
				isProxy: false,
				headers: {},
				body: {
					query_parameters: Object.fromEntries(params.entries()),
					query_string: params.toString(),
					note: 'GET request with query parameters - these are sent as URL parameters, not POST body',
				},
				step: 'unified-authorization-url',
				flowType: 'unified',
			});

			apiCallTrackerService.updateApiCallResponse(
				apiCallId,
				{
					status: 200,
					statusText: 'OK',
					data: {
						authorization_url: authorizationUrl,
						note: 'Authorization URL generated. User will be redirected to PingOne for authentication.',
						flow: 'oauth-authz',
						response_type: 'code',
						has_pkce: !!pkceCodes,
						response_mode: responseModeOAuth,
					},
				},
				Date.now() - startTime
			);

			logger.debug(`✅ OAuth authz URL generated with prefixed state`, {
				prefixedState: prefixedStateRegular,
				hasPKCE: !!pkceCodes,
				responseMode: responseModeOAuth,
			});

			return {
				authorizationUrl,
				state: prefixedStateRegular,
				...(pkceCodes && {
					codeVerifier: pkceCodes.codeVerifier,
					codeChallenge: pkceCodes.codeChallenge,
				}),
			};
		}

		/**
		 * HYBRID FLOW - Generate authorization URL
		 *
		 * Hybrid flow combines authorization code and implicit flow:
		 * - Returns both authorization code AND tokens in the callback
		 * - Tokens are in URL fragment (#access_token=...)
		 * - Authorization code is in query string (?code=...)
		 *
		 * Response types:
		 * - 'code id_token': Returns code + ID token (most common)
		 * - 'code token': Returns code + access token
		 * - 'code token id_token': Returns code + access token + ID token
		 *
		 * Use cases:
		 * - When you need immediate tokens (like implicit) but also want secure token exchange (like authz code)
		 * - Common in OpenID Connect scenarios where ID token is needed immediately
		 *
		 * Note: Not part of OAuth 2.1 specification, but supported in OAuth 2.0 and OpenID Connect
		 */
		if (flowType === 'hybrid') {
			const hybridCredentials: HybridFlowCredentials = {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				redirectUri: redirectUriToUse,
				scopes: credentials.scopes || 'openid profile email',
				// Default to 'code id_token' if not specified (most common hybrid response type)
				responseType:
					(credentials.responseType as 'code id_token' | 'code token' | 'code token id_token') ||
					'code id_token',
			};
			if (credentials.clientSecret) {
				hybridCredentials.clientSecret = credentials.clientSecret;
			}
			if (credentials.privateKey) {
				hybridCredentials.privateKey = credentials.privateKey;
			}
			if (credentials.clientAuthMethod) {
				hybridCredentials.clientAuthMethod = credentials.clientAuthMethod;
			}
			const result = await HybridFlowIntegrationServiceV8.generateAuthorizationUrl(
				hybridCredentials,
				pkceCodes,
				appConfig
			);

			/**
			 * CRITICAL FIX: Prefix state with flow type for callback routing
			 *
			 * See implicit flow comment above for explanation.
			 * The prefix "v8u-hybrid-" identifies this as a hybrid flow request.
			 */
			const prefixedState = `v8u-hybrid-${result.state}`;
			const authorizationEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/authorize`;
			const params = new URLSearchParams();
			// Ensure offline_access is included if enableRefreshToken is true
			let scopesToUse = credentials.scopes || 'openid profile email';
			if (credentials.enableRefreshToken && !scopesToUse.includes('offline_access')) {
				scopesToUse = `${scopesToUse.trim()} offline_access`;
				logger.debug(`✅ Added offline_access scope for refresh token`);
			}

			params.set('client_id', credentials.clientId);
			params.set('response_type', hybridCredentials.responseType || 'code id_token');
			params.set('redirect_uri', redirectUriToUse);
			params.set('scope', scopesToUse);
			params.set('state', prefixedState); // Use prefixed state
			params.set('nonce', result.nonce);

			// Add response_mode parameter (supports query, fragment, form_post, pi.flow)
			const responseModeHybrid =
				credentials.responseMode || (credentials.useRedirectless ? 'pi.flow' : 'fragment');
			params.set('response_mode', responseModeHybrid);
			logger.debug(`🔗 Response mode set to: ${responseModeHybrid}`);

			// Add prompt parameter if specified
			if (credentials.prompt) {
				params.set('prompt', credentials.prompt);
			}

			// Add login_hint parameter if specified
			if (credentials.loginHint) {
				params.set('login_hint', credentials.loginHint);
				logger.debug(`👤 Added login_hint: ${credentials.loginHint}`);
			}

			// Add max_age parameter if specified
			if (credentials.maxAge !== undefined) {
				params.set('max_age', credentials.maxAge.toString());
				logger.debug(`⏱️ Added max_age: ${credentials.maxAge}s`);
			}

			// Add display parameter if specified
			if (credentials.display) {
				params.set('display', credentials.display);
				logger.debug(`🖥️ Added display: ${credentials.display}`);
			}

			const authorizationUrl = `${authorizationEndpoint}?${params.toString()}`;

			// Track authorization URL generation for API documentation
			const hybridStartTime = Date.now();
			const { apiCallTrackerService: apiCallTrackerServiceHybrid } = await import(
				'@/services/apiCallTrackerService'
			);
			const hybridApiCallId = apiCallTrackerServiceHybrid.trackApiCall({
				method: 'GET',
				url: authorizationEndpoint,
				actualPingOneUrl: authorizationEndpoint,
				isProxy: false,
				headers: {},
				body: {
					query_parameters: Object.fromEntries(params.entries()),
					query_string: params.toString(),
					note: 'GET request with query parameters - these are sent as URL parameters, not POST body',
				},
				step: 'unified-authorization-url',
				flowType: 'unified',
			});

			apiCallTrackerServiceHybrid.updateApiCallResponse(
				hybridApiCallId,
				{
					status: 200,
					statusText: 'OK',
					data: {
						authorization_url: authorizationUrl,
						note: 'Authorization URL generated. User will be redirected to PingOne.',
						flow: 'hybrid',
						response_type: hybridCredentials.responseType || 'code id_token',
						has_pkce: !!pkceCodes,
						response_mode: responseModeHybrid,
						returns_in_fragment: 'id_token, access_token (if requested)',
						returns_in_query: 'code',
					},
				},
				Date.now() - hybridStartTime
			);

			logger.debug(`✅ Hybrid flow URL generated with prefixed state`, {
				prefixedState,
				responseMode: responseModeHybrid,
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

		// Client credentials doesn't use authorization URLs
		if (flowType === 'client-credentials') {
			throw new Error(
				'Client Credentials flow does not use authorization URLs. Please use the "Request Token" button instead.'
			);
		}

		throw new Error(`The ${flowType} flow is not supported for authorization URL generation.`);
	}

	/**
	 * Request device authorization (for device code flow - RFC 8628)
	 *
	 * Device code flow is designed for devices without browsers or input capabilities:
	 * - Smart TVs, IoT devices, command-line tools
	 * - User authenticates on a separate device (phone, computer)
	 * - Device polls for tokens after user authorizes
	 *
	 * Flow steps:
	 * 1. Device requests authorization → receives device_code and user_code
	 * 2. User visits verification_uri and enters user_code
	 * 3. User authenticates and authorizes on separate device
	 * 4. Device polls token endpoint with device_code until authorized
	 * 5. Device receives tokens when user completes authorization
	 *
	 * Authentication methods:
	 * - Only supports basic auth methods (client_secret_basic, client_secret_post, none)
	 * - JWT-based auth (client_secret_jwt, private_key_jwt) is not supported
	 *
	 * @param credentials - OAuth credentials (environmentId, clientId, clientSecret, scopes)
	 * @returns Promise resolving to device authorization response containing:
	 *          - device_code: Code used for polling token endpoint
	 *          - user_code: Code displayed to user for verification
	 *          - verification_uri: URL where user enters user_code
	 *          - verification_uri_complete: Full URL with user_code pre-filled
	 *          - expires_in: How long device_code is valid (usually 15 minutes)
	 *          - interval: Recommended polling interval in seconds
	 *
	 * @throws Error if environmentId or clientId is missing
	 *
	 * @example
	 * const deviceAuth = await UnifiedFlowIntegrationV8U.requestDeviceAuthorization(credentials);
	 * logger.debug(`User code: ${deviceAuth.user_code}`);
	 * logger.debug(`Visit: ${deviceAuth.verification_uri_complete}`);
	 */
	static async requestDeviceAuthorization(credentials: UnifiedFlowCredentials) {
		logger.debug(`Requesting device authorization`);

		// Validate required credentials
		if (!credentials.environmentId || !credentials.clientId) {
			throw new Error(
				'Please provide both Environment ID and Client ID in the configuration section above.'
			);
		}

		/**
		 * Device code flow authentication method validation
		 *
		 * Device code flow only supports basic authentication methods:
		 * - client_secret_basic: HTTP Basic Auth (Authorization header)
		 * - client_secret_post: Client secret in POST body
		 * - none: No authentication (public clients)
		 *
		 * JWT-based methods (client_secret_jwt, private_key_jwt) are not supported
		 * because device code flow uses a simpler token endpoint that doesn't support
		 * client assertions.
		 */
		const validAuthMethod =
			credentials.clientAuthMethod === 'client_secret_basic' ||
			credentials.clientAuthMethod === 'client_secret_post' ||
			credentials.clientAuthMethod === 'none'
				? credentials.clientAuthMethod
				: undefined;

		const deviceCredentials: DeviceCodeCredentials = {
			environmentId: credentials.environmentId,
			clientId: credentials.clientId,
			...(validAuthMethod && { clientAuthMethod: validAuthMethod }),
		};
		if (credentials.clientSecret) {
			deviceCredentials.clientSecret = credentials.clientSecret;
		}
		if (credentials.scopes) {
			deviceCredentials.scopes = credentials.scopes;
		}
		return DeviceCodeIntegrationServiceV8.requestDeviceAuthorization(deviceCredentials);
	}

	/**
	 * Poll for tokens (for device code flow - RFC 8628)
	 *
	 * After the user authorizes the device on a separate device, the application
	 * must poll the token endpoint to check if authorization is complete.
	 *
	 * Polling behavior:
	 * - Polls at the interval specified in device authorization response (usually 5 seconds)
	 * - Continues until user authorizes or maxAttempts is reached
	 * - Returns tokens immediately when user completes authorization
	 * - Returns "authorization_pending" error while user hasn't authorized yet
	 *
	 * Error handling:
	 * - "authorization_pending": User hasn't authorized yet, continue polling
	 * - "slow_down": Server is rate-limiting, increase polling interval
	 * - "expired_token": Device code expired, user took too long
	 * - "access_denied": User denied authorization
	 *
	 * @param credentials - OAuth credentials (environmentId, clientId, clientSecret, scopes)
	 * @param deviceCode - Device code from authorization response (used to poll token endpoint)
	 * @param interval - Polling interval in seconds (optional, from device authorization response, default: 5)
	 *                   RFC 8628 Section 3.5: Use interval from device authorization response
	 * @param maxAttempts - Maximum polling attempts before giving up (optional, calculated from expires_in if not provided)
	 * @returns Promise resolving to token response when user completes authorization
	 *
	 * @throws Error if environmentId or clientId is missing
	 * @throws Error if polling times out (maxAttempts reached)
	 *
	 * @example
	 * const tokens = await UnifiedFlowIntegrationV8U.pollForTokens(
	 *   credentials,
	 *   deviceAuth.device_code,
	 *   5,  // Poll every 5 seconds
	 *   60  // Try up to 60 times (5 minutes total)
	 * );
	 */
	static async pollForTokens(
		credentials: UnifiedFlowCredentials,
		deviceCode: string,
		interval?: number, // Optional - from device authorization response
		maxAttempts?: number // Optional - calculated from expires_in if not provided
	) {
		logger.debug(`Polling for tokens`, {
			deviceCode: `${deviceCode.substring(0, 20)}...`,
			interval,
			maxAttempts,
		});

		if (!credentials.environmentId || !credentials.clientId) {
			throw new Error(
				'Please provide both Environment ID and Client ID in the configuration section above.'
			);
		}

		// Device code flow only supports basic auth methods, not JWT-based
		const validAuthMethod =
			credentials.clientAuthMethod === 'client_secret_basic' ||
			credentials.clientAuthMethod === 'client_secret_post' ||
			credentials.clientAuthMethod === 'none'
				? credentials.clientAuthMethod
				: undefined;

		const deviceCredentials: DeviceCodeCredentials = {
			environmentId: credentials.environmentId,
			clientId: credentials.clientId,
			...(validAuthMethod && { clientAuthMethod: validAuthMethod }),
		};
		if (credentials.clientSecret) {
			deviceCredentials.clientSecret = credentials.clientSecret;
		}
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
	 * Request token (for client credentials flow)
	 *
	 * Client credentials flow is used for server-to-server authentication where
	 * there is no user involved. The application authenticates using its own
	 * credentials (client ID and secret) to obtain an access token.
	 *
	 * Use cases:
	 * - API-to-API communication
	 * - Background jobs and scheduled tasks
	 * - Service accounts
	 * - Machine-to-machine authentication
	 *
	 * Authentication methods supported:
	 * - client_secret_basic: HTTP Basic Auth (Authorization header)
	 * - client_secret_post: Client secret in POST body
	 * - client_secret_jwt: Client secret used to sign JWT assertion (HS256)
	 * - private_key_jwt: Private key used to sign JWT assertion (RS256)
	 *
	 * Flow steps:
	 * 1. Application sends client credentials to token endpoint
	 * 2. Server validates credentials
	 * 3. Server returns access token (no refresh token, no user context)
	 *
	 * Security notes:
	 * - Client secret must be kept secure (never expose in client-side code)
	 * - JWT-based auth is more secure than basic auth (no secret in headers/body)
	 * - Private key JWT is most secure (asymmetric cryptography)
	 *
	 * @param flowType - Flow type (must be 'client-credentials')
	 * @param credentials - OAuth credentials containing:
	 *                     - environmentId: PingOne environment ID (required)
	 *                     - clientId: Application client ID (required)
	 *                     - clientSecret: Client secret (required for basic/post/JWT auth)
	 *                     - scopes: Requested scopes (optional, but recommended)
	 *                     - clientAuthMethod: Authentication method (optional, defaults to basic)
	 *                     - privateKey: Private key for private_key_jwt (required if using that method)
	 * @returns Promise resolving to token response containing:
	 *          - access_token: Access token for API calls
	 *          - token_type: Usually "Bearer"
	 *          - expires_in: Token lifetime in seconds
	 *          - scope: Granted scopes (may differ from requested)
	 *
	 * @throws Error if required credentials are missing
	 * @throws Error if authentication fails
	 * @throws Error if scopes are invalid (check PingOne application configuration)
	 *
	 * @example
	 * const tokens = await UnifiedFlowIntegrationV8U.requestToken('client-credentials', {
	 *   environmentId: 'env-123',
	 *   clientId: 'client-456',
	 *   clientSecret: 'secret-789',
	 *   scopes: 'api:read api:write',
	 *   clientAuthMethod: 'client_secret_basic'
	 * });
	 */
	static async requestToken(flowType: 'client-credentials', credentials: UnifiedFlowCredentials) {
		logger.debug(`Requesting token`, {
			flowType,
			authMethod: credentials.clientAuthMethod || 'client_secret_basic',
			hasPrivateKey: !!(credentials as { privateKey?: string }).privateKey,
		});

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
				logger.debug(`Passing scopes to client credentials service:`, credentials.scopes);
			} else {
				logger.warn(`No scopes provided in credentials for client credentials flow`);
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
			logger.debug(`Client credentials request config:`, {
				environmentId: ccCredentials.environmentId,
				clientId: ccCredentials.clientId,
				hasClientSecret: !!ccCredentials.clientSecret,
				scopes: ccCredentials.scopes || '(none)',
				authMethod: ccCredentials.clientAuthMethod || 'client_secret_basic',
			});
			return ClientCredentialsIntegrationServiceV8.requestToken(ccCredentials);
		}

		throw new Error(
			`The ${flowType} flow does not support direct token requests. Please use the appropriate flow steps.`
		);
	}

	/**
	 * Exchange authorization code for tokens (for authorization code and hybrid flows)
	 *
	 * This is the second step of the authorization code flow. After the user authenticates
	 * and the authorization server redirects back with an authorization code, the application
	 * exchanges that code for actual access tokens.
	 *
	 * Security features:
	 * - Authorization code is single-use (can only be exchanged once)
	 * - Authorization code expires quickly (usually 1-10 minutes)
	 * - PKCE code_verifier must match the code_challenge from authorization request
	 * - Client secret (or JWT assertion) required for confidential clients
	 *
	 * Flow steps:
	 * 1. User authenticates → receives authorization code
	 * 2. Application sends code + client credentials to token endpoint
	 * 3. Server validates code, client credentials, and PKCE (if used)
	 * 4. Server returns access token, ID token (if OIDC), and refresh token (if requested)
	 *
	 * PKCE validation:
	 * - If PKCE was used in authorization request, code_verifier is required here
	 * - Server hashes code_verifier and compares to code_challenge from authorization request
	 * - Prevents authorization code interception attacks
	 *
	 * Token response:
	 * - access_token: Used to authenticate API requests
	 * - id_token: User identity information (OIDC only)
	 * - refresh_token: Used to obtain new access tokens (if requested)
	 * - expires_in: Access token lifetime in seconds
	 * - token_type: Usually "Bearer"
	 *
	 * @param flowType - Flow type ('oauth-authz' for authorization code, 'hybrid' for hybrid flow)
	 * @param credentials - OAuth credentials containing:
	 *                     - environmentId: PingOne environment ID (required)
	 *                     - clientId: Application client ID (required)
	 *                     - clientSecret: Client secret (required for confidential clients)
	 *                     - redirectUri: Must match the redirect URI from authorization request (required)
	 * @param code - Authorization code from callback URL (required)
	 * @param codeVerifier - PKCE code verifier (required if PKCE was used in authorization request)
	 *                      This is the secret that was used to generate code_challenge
	 * @returns Promise resolving to token response
	 *
	 * @throws Error if required parameters are missing
	 * @throws Error if authorization code is invalid or expired
	 * @throws Error if PKCE code_verifier doesn't match code_challenge
	 * @throws Error if redirect URI doesn't match authorization request
	 * @throws Error if client authentication fails
	 *
	 * @example
	 * // Without PKCE
	 * const tokens = await UnifiedFlowIntegrationV8U.exchangeCodeForTokens(
	 *   'oauth-authz',
	 *   credentials,
	 *   authorizationCode
	 * );
	 *
	 * // With PKCE
	 * const tokens = await UnifiedFlowIntegrationV8U.exchangeCodeForTokens(
	 *   'oauth-authz',
	 *   credentials,
	 *   authorizationCode,
	 *   pkceCodes.codeVerifier
	 * );
	 */
	static async exchangeCodeForTokens(
		flowType: 'oauth-authz' | 'hybrid',
		credentials: UnifiedFlowCredentials,
		code: string,
		codeVerifier?: string
	) {
		logger.debug(`========== SERVICE LAYER: exchangeCodeForTokens ==========`);
		logger.debug(`Flow Type:`, flowType);
		logger.debug(`Credentials received:`, {
			environmentId: credentials.environmentId,
			clientId: credentials.clientId,
			hasClientSecret: !!credentials.clientSecret,
			clientSecretLength: credentials.clientSecret?.length,
			redirectUri: credentials.redirectUri,
			usePKCE: credentials.usePKCE,
			scopes: credentials.scopes,
			clientAuthMethod: credentials.clientAuthMethod,
		});
		logger.debug(`Code length:`, code?.length);
		logger.debug(`Code verifier length:`, codeVerifier?.length);
		logger.debug(`Has code verifier:`, !!codeVerifier);

		if (flowType === 'oauth-authz') {
			logger.debug(`Processing OAuth Authorization Code flow`);

			// Validate required fields based on PKCE usage
			if (!credentials.environmentId || !credentials.clientId) {
				logger.error(`❌ Missing required fields:`, {
					hasEnvironmentId: !!credentials.environmentId,
					hasClientId: !!credentials.clientId,
				});
				throw new Error(
					'Please provide both Environment ID and Client ID in the configuration section above.'
				);
			}

			// Redirect URI is only required when PKCE is NOT enabled
			if (!credentials.usePKCE && !credentials.redirectUri) {
				logger.error(`❌ PKCE not enabled and redirect URI missing`);
				throw new Error(
					'Redirect URI is required when PKCE is not enabled. Please go back to the configuration step and provide a Redirect URI.'
				);
			}

			// Code verifier is only required when PKCE IS enabled
			if (credentials.usePKCE && !codeVerifier) {
				logger.error(`❌ PKCE enabled but code verifier missing`);
				throw new Error(
					'PKCE is enabled but the code verifier is missing. Please go back and generate PKCE parameters first.'
				);
			}

			logger.debug(`✅ Validation passed, building OAuth credentials object`);
			const oauthCredentials: OAuthCredentials = {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				redirectUri: credentials.redirectUri || '',
				scopes: credentials.scopes || 'openid profile email',
				clientAuthMethod: credentials.clientAuthMethod || 'client_secret_post',
			};

			if (credentials.clientSecret) {
				oauthCredentials.clientSecret = credentials.clientSecret;
				logger.debug(`Client secret included (length: ${credentials.clientSecret.length})`);
			} else {
				logger.debug(`No client secret provided`);
			}

			// Add private key for private_key_jwt authentication
			if (credentials.clientAuthMethod === 'private_key_jwt' && credentials.privateKey) {
				oauthCredentials.privateKey = credentials.privateKey;
				logger.debug(`Private key included for private_key_jwt authentication`);
			}

			logger.debug(
				`OAuth credentials created with auth method: ${oauthCredentials.clientAuthMethod}`
			);

			logger.debug(`OAuth credentials prepared:`, {
				environmentId: oauthCredentials.environmentId,
				clientId: oauthCredentials.clientId,
				redirectUri: oauthCredentials.redirectUri,
				scopes: oauthCredentials.scopes,
				hasClientSecret: !!oauthCredentials.clientSecret,
				clientAuthMethod: oauthCredentials.clientAuthMethod,
				authMethodSource: credentials.clientAuthMethod
					? 'from credentials'
					: 'default (client_secret_post)',
			});

			// Track token exchange API call for unified flow visibility
			console.log(`${_MODULE_TAG} 🔄 TRACKING: About to track token exchange API call`);
			const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
			const tokenEndpoint = `https://auth.pingone.com/${oauthCredentials.environmentId}/as/token`;
			const startTime = Date.now();
			
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: tokenEndpoint,
				actualPingOneUrl: tokenEndpoint,
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Authorization': `Basic ${btoa(`${oauthCredentials.clientId}:${oauthCredentials.clientSecret || ''}`)}`,
				},
				body: new URLSearchParams({
					grant_type: 'authorization_code',
					code: code.substring(0, 20) + '...',
					redirect_uri: oauthCredentials.redirectUri || '',
					...(codeVerifier && { code_verifier: '***REDACTED***' }),
					client_id: oauthCredentials.clientId,
					client_secret: '***REDACTED***',
				}).toString(),
				flowType: 'unified',
				step: 'unified-token-exchange',
			});

			logger.debug(`🚀 Calling OAuthIntegrationServiceV8.exchangeCodeForTokens...`);
			logger.debug(`Parameters:`, {
				hasCredentials: !!oauthCredentials,
				codeLength: code.length,
				codeVerifierLength: codeVerifier?.length,
				hasCodeVerifier: !!codeVerifier,
			});

			try {
				const result = await OAuthIntegrationServiceV8.exchangeCodeForTokens(
					oauthCredentials,
					code,
					codeVerifier || ''
				);

				// Update API call with successful response
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 200,
						statusText: 'OK',
						data: {
							access_token: result.access_token ? '***REDACTED***' : undefined,
							token_type: result.token_type,
							expires_in: result.expires_in,
							refresh_token: result.refresh_token ? '***REDACTED***' : undefined,
							id_token: result.id_token ? '***REDACTED***' : undefined,
							scope: result.scope,
						},
					},
					Date.now() - startTime
				);

				return result;
			} catch (error) {
				// Update API call with error response
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 400,
						statusText: 'Bad Request',
						data: {
							error: error instanceof Error ? error.message : 'Token exchange failed',
						},
					},
					Date.now() - startTime
				);
				throw error;
			}
		}

		if (flowType === 'hybrid') {
			// Validate required fields based on PKCE usage
			if (!credentials.environmentId || !credentials.clientId) {
				throw new Error(
					'Please provide both Environment ID and Client ID in the configuration section above.'
				);
			}

			// Redirect URI is only required when PKCE is NOT enabled
			if (!credentials.usePKCE && !credentials.redirectUri) {
				throw new Error(
					'Redirect URI is required when PKCE is not enabled. Please go back to the configuration step and provide a Redirect URI.'
				);
			}

			const hybridCredentials: HybridFlowCredentials = {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				redirectUri: credentials.redirectUri || '',
				scopes: credentials.scopes || 'openid profile email',
				responseType:
					(credentials.responseType as 'code id_token' | 'code token' | 'code token id_token') ||
					'code id_token',
				clientAuthMethod: credentials.clientAuthMethod || 'client_secret_post',
			};
			if (credentials.clientSecret) {
				hybridCredentials.clientSecret = credentials.clientSecret;
			}
			// Add private key for private_key_jwt authentication
			if (credentials.clientAuthMethod === 'private_key_jwt' && credentials.privateKey) {
				hybridCredentials.privateKey = credentials.privateKey;
				logger.debug(`Private key included for hybrid flow private_key_jwt authentication`);
			}

			// Track hybrid token exchange API call for unified flow visibility
			const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
			const tokenEndpoint = `https://auth.pingone.com/${hybridCredentials.environmentId}/as/token`;
			const startTime = Date.now();
			
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: tokenEndpoint,
				actualPingOneUrl: tokenEndpoint,
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Authorization': `Basic ${btoa(`${hybridCredentials.clientId}:${hybridCredentials.clientSecret || ''}`)}`,
				},
				body: new URLSearchParams({
					grant_type: 'authorization_code',
					code: code.substring(0, 20) + '...',
					redirect_uri: hybridCredentials.redirectUri || '',
					...(codeVerifier && { code_verifier: '***REDACTED***' }),
					client_id: hybridCredentials.clientId,
					client_secret: '***REDACTED***',
				}).toString(),
				flowType: 'unified',
				step: 'unified-hybrid-token-exchange',
			});

			try {
				const result = await HybridFlowIntegrationServiceV8.exchangeCodeForTokens(
					hybridCredentials,
					code,
					codeVerifier
				);

				// Update API call with successful response
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 200,
						statusText: 'OK',
						data: {
							access_token: result.access_token ? '***REDACTED***' : undefined,
							token_type: result.token_type,
							expires_in: result.expires_in,
							refresh_token: result.refresh_token ? '***REDACTED***' : undefined,
							id_token: result.id_token ? '***REDACTED***' : undefined,
							scope: result.scope,
						},
					},
					Date.now() - startTime
				);

				return result;
			} catch (error) {
				// Update API call with error response
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 400,
						statusText: 'Bad Request',
						data: {
							error: error instanceof Error ? error.message : 'Hybrid token exchange failed',
						},
					},
					Date.now() - startTime
				);
				throw error;
			}
		}

		throw new Error(
			`The ${flowType} flow does not support code exchange. This is likely a configuration error.`
		);
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
		logger.debug(`Parsing callback fragment`, { flowType });

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
					throw new Error(
						'Security validation failed: The nonce in the ID token does not match the expected value. This could indicate a security issue or replay attack.'
					);
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
					throw new Error(
						'Security validation failed: The nonce in the ID token does not match the expected value. This could indicate a security issue or replay attack.'
					);
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
