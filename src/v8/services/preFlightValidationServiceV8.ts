/**
 * @file preFlightValidationServiceV8.ts
 * @module v8/services
 * @description Pre-flight validation service for OAuth/OIDC flows
 * @version 1.0.0
 * @since 2025-01-XX
 *
 * Performs comprehensive validation checks before generating authorization URLs
 * to catch configuration mismatches early and provide clear error messages.
 *
 * Validates:
 * - Redirect URI against PingOne configuration
 * - PKCE requirements (spec version and PingOne)
 * - Client secret requirements
 * - Token endpoint authentication method
 * - PAR (Pushed Authorization Requests) support
 * - Response type validity
 * - Scope requirements (OIDC)
 * - HTTPS requirements (OAuth 2.1)
 *
 * @example
 * const result = await PreFlightValidationServiceV8.validateBeforeAuthUrl({
 *   specVersion: 'oidc',
 *   flowType: 'oauth-authz',
 *   credentials: { ... },
 *   workerToken: 'token-xyz'
 * });
 * if (!result.passed) {
 *   console.error('Validation errors:', result.errors);
 * }
 */

import type { FlowType, SpecVersion } from './specVersionServiceV8';
import { SpecVersionServiceV8 } from './specVersionServiceV8';
import { ConfigCheckerServiceV8 } from './configCheckerServiceV8';
import type { UnifiedFlowCredentials } from '@/v8u/services/unifiedFlowIntegrationV8U';

const MODULE_TAG = '[✈️ PRE-FLIGHT-VALIDATION-V8]';

export interface PreFlightValidationOptions {
	specVersion: SpecVersion;
	flowType: FlowType;
	credentials: UnifiedFlowCredentials;
	workerToken?: string;
}

export interface FixableError {
	errorIndex: number;
	errorType: 'redirect_uri_mismatch' | 'pkce_required' | 'auth_method_mismatch' | 'openid_scope_missing' | 'response_type_invalid';
	errorMessage: string;
	fixable: boolean;
	fixDescription: string;
	fixData?: {
		redirectUri?: string;
		enablePKCE?: boolean;
		authMethod?: string;
		addScope?: string;
		responseType?: string;
	};
}

export interface PreFlightValidationResult {
	passed: boolean;
	errors: string[];
	warnings: string[];
	redirectUriValidated: boolean;
	oauthConfigValidated: boolean;
	redirectUris?: string[]; // Registered redirect URIs from PingOne (for auto-fix)
	fixableErrors?: FixableError[]; // Errors that can be auto-fixed
	appConfig?: {
		tokenEndpointAuthMethod?: string;
		pkceEnforced?: boolean;
		pkceRequired?: boolean;
		requireSignedRequestObject?: boolean;
	}; // App config from PingOne (for auto-fix and JAR detection)
}

/**
 * PreFlightValidationServiceV8
 *
 * Service for performing pre-flight validation checks before generating authorization URLs.
 * This helps catch configuration mismatches early and provides clear error messages.
 */
export class PreFlightValidationServiceV8 {
	/**
	 * Validate redirect URI against PingOne configuration
	 * @param credentials - User credentials
	 * @param workerToken - Worker token for API access
	 * @returns Validation result
	 */
	static async validateRedirectUri(
		credentials: UnifiedFlowCredentials,
		workerToken?: string
	): Promise<{
		passed: boolean;
		error: string | null;
		redirectUris?: string[];
	}> {
		if (!credentials.environmentId || !credentials.clientId) {
			return {
				passed: true, // Can't validate, but don't block
				error: `⚠️ Cannot Validate Redirect URI

🔍 Pre-flight validation skipped because Environment ID or Client ID is missing.

To enable redirect URI validation:
1. Go to Step 0 (Configuration)
2. Ensure Environment ID and Client ID are configured
3. Try generating the authorization URL again

⚠️ WARNING: Without validation, you may encounter "invalid_redirect_uri" errors if your redirect URI doesn't match PingOne configuration.

You can still proceed, but the authorization request may fail if there's a mismatch.`,
			};
		}

		if (!workerToken) {
			return {
				passed: true, // Can't validate, but don't block
				error: `⚠️ Cannot Validate Redirect URI

🔍 Pre-flight validation skipped because worker token is not available.

To enable redirect URI validation:
1. Go to Step 0 (Configuration)
2. Add a Worker Token (click "Add Worker Token" button)
3. Try generating the authorization URL again

⚠️ WARNING: Without validation, you may encounter "invalid_redirect_uri" errors if your redirect URI doesn't match PingOne configuration.

You can still proceed, but the authorization request may fail if there's a mismatch.`,
			};
		}

		try {
			const appConfig = await ConfigCheckerServiceV8.fetchAppConfig(
				credentials.environmentId,
				credentials.clientId,
				workerToken
			);

			if (!appConfig || !appConfig.redirectUris || appConfig.redirectUris.length === 0) {
				return {
					passed: true, // No URIs to validate against
					error: null,
				};
			}

			// Normalize URIs for comparison
			const normalizeUri = (uri: string) => uri.trim().toLowerCase().replace(/\/$/, '');
			const appRedirectUris = appConfig.redirectUris.map(normalizeUri);
			const userRedirectUri = normalizeUri(credentials.redirectUri || '');

			const uriMatches = appRedirectUris.includes(userRedirectUri);

			if (!uriMatches) {
				const comparisonMessage = `⚠️ Redirect URI Mismatch Detected

🔍 Configuration Comparison:

┌─────────────────────────────────────────────────────────────┐
│                    Your App Config                          │
├─────────────────────────────────────────────────────────────┤
│ Redirect URI:     ${(credentials.redirectUri || '').padEnd(40)} │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    PingOne Config                           │
├─────────────────────────────────────────────────────────────┤
│ Redirect URIs:    ${appConfig.redirectUris.length} registered${' '.repeat(30)} │
│                   ${appConfig.redirectUris.slice(0, 3).map(uri => `                   • ${uri}`).join('\n')}${appConfig.redirectUris.length > 3 ? `\n                   ... and ${appConfig.redirectUris.length - 3} more` : ''} │
└─────────────────────────────────────────────────────────────┘

❌ Redirect URI mismatch - Your redirect URI does not match any of the registered URIs in PingOne.

🔧 How to Fix:

1. Update Your Redirect URI:
   • Go to Step 0 (Configuration)
   • Change your Redirect URI to match one of the registered URIs in PingOne (shown above)

2. OR Update PingOne Configuration:
   • Go to PingOne Admin Console: https://admin.pingone.com
   • Navigate to: Applications → Your Application (${credentials.clientId.substring(0, 8)}...)
   • Add your redirect URI to the "Redirect URIs" list
   • Save the changes

💡 Note: Redirect URIs must match exactly (including protocol, domain, path, and trailing slashes).

⚠️ WARNING: If you proceed, the authorization request will fail with "invalid_redirect_uri" error.`;

				return {
					passed: false,
					error: comparisonMessage,
					redirectUris: appConfig.redirectUris,
				};
			}

			return {
				passed: true,
				error: null,
				redirectUris: appConfig.redirectUris,
			};
		} catch (error) {
			return {
				passed: true, // Allow to proceed on error
				error: `⚠️ Redirect URI Validation Failed

🔍 Pre-flight validation encountered an error:

${error instanceof Error ? error.message : String(error)}

⚠️ WARNING: Without validation, you may encounter "invalid_redirect_uri" errors if your redirect URI doesn't match PingOne configuration.

You can still proceed, but the authorization request may fail if there's a mismatch.`,
			};
		}
	}

	/**
	 * Validate OAuth configuration against PingOne and spec requirements
	 * @param options - Validation options
	 * @returns Validation result
	 */
	static async validateOAuthConfig(
		options: PreFlightValidationOptions
	): Promise<{
		passed: boolean;
		errors: string[];
		warnings: string[];
		fixableErrors?: FixableError[];
	}> {
		const { specVersion, flowType, credentials, workerToken } = options;
		const errors: string[] = [];
		const warnings: string[] = [];
		const fixableErrors: FixableError[] = [];

		if (!credentials.environmentId || !credentials.clientId) {
			warnings.push(
				`⚠️ Cannot Validate OAuth Configuration: Environment ID or Client ID is missing. Some validations were skipped.`
			);
			return { passed: true, errors, warnings, fixableErrors };
		}

		if (!workerToken) {
			warnings.push(
				`⚠️ Cannot Validate OAuth Configuration: Worker token is not available. Some validations were skipped. Add a Worker Token in Step 0 (Configuration) to enable full validation.`
			);
			return { passed: true, errors, warnings, fixableErrors };
		}

		try {
			const appConfig = await ConfigCheckerServiceV8.fetchAppConfig(
				credentials.environmentId,
				credentials.clientId,
				workerToken
			);

			if (!appConfig) {
				warnings.push(
					`⚠️ Cannot Validate OAuth Configuration: Could not fetch application configuration from PingOne. Some validations were skipped.`
				);
				return { passed: true, errors, warnings };
			}

			// 1. PKCE Validation
			if (flowType === 'oauth-authz' || flowType === 'hybrid') {
				// Check if PKCE is required by spec version
				const complianceRules = SpecVersionServiceV8.getComplianceRules(specVersion);
				if (complianceRules.requirePKCE && !credentials.usePKCE && !credentials.pkceEnforcement) {
					errors.push(
						`❌ PKCE Required: ${specVersion} requires PKCE for Authorization Code Flow. Please enable PKCE in Step 0 (Configuration).`
					);
				}

				// Check if PingOne requires PKCE but it's not enabled
				if (appConfig.pkceEnforced === true || appConfig.pkceRequired === true) {
					if (!credentials.usePKCE && !credentials.pkceEnforcement) {
						errors.push(
							`❌ PKCE Required by PingOne: Your PingOne application requires PKCE, but PKCE is not enabled. Please enable PKCE in Step 0 (Configuration).`
						);
					}
				}

				// Check if PKCE is enabled but PingOne doesn't support it
				if ((credentials.usePKCE || credentials.pkceEnforcement) && appConfig.pkceEnforced === false) {
					warnings.push(
						`⚠️ PKCE Mismatch: PKCE is enabled in your configuration, but your PingOne application may not support it. This may cause authorization failures.`
					);
				}
			}

			// 2. JAR (JWT-secured Authorization Request) / Signed Request Object Validation
			// If PingOne requires signed request objects, check if we have the necessary credentials
			if (appConfig.requireSignedRequestObject === true) {
				// Check if we have credentials for JAR signing
				const hasHS256Credentials = !!credentials.clientSecret;
				const hasRS256Credentials = !!credentials.privateKey;
				const hasJARCredentials = hasHS256Credentials || hasRS256Credentials;

				if (!hasJARCredentials) {
					errors.push(
						`❌ JAR (JWT-secured Authorization Request) Required - Missing Credentials

🚫 PROBLEM DETECTED:
Your PingOne application has "Request Parameter Signature Requirement" set to "Require signed request parameter" or "Default". The OAuth Playground now supports JAR (JWT-secured Authorization Requests), but you need to provide signing credentials.

📋 WHAT IS JAR?
JAR (JWT-secured Authorization Request) is an OAuth 2.0 extension (RFC 9101) that requires authorization request parameters to be sent as a signed JWT instead of plain query parameters. This provides additional security.

🔧 QUICK FIX - Provide Signing Credentials:
1. For HS256 signing: Provide your Client Secret in the credentials form
2. For RS256 signing: Provide your Private Key (PKCS#8 format) in the credentials form
3. The OAuth Playground will automatically generate a signed request object when generating the authorization URL

✅ WHAT WE SUPPORT:
✓ HS256 signing with client secret
✓ RS256 signing with private key (PKCS#8 format)
✓ Automatic JAR request object generation
✓ RFC 9101-compliant request objects

🔗 Need more information? See the "JAR (JWT-secured Authorization Request)" section in Advanced Options for detailed documentation.`
					);
				} else {
					// JAR is required and we have credentials - show informational message
					warnings.push(
						`ℹ️ JAR (JWT-secured Authorization Request) Enabled

✅ Your PingOne application requires signed request objects (JAR), and you have provided the necessary signing credentials. The OAuth Playground will automatically generate a signed JWT request object when you generate the authorization URL.

📋 Signing Method: ${hasRS256Credentials ? 'RS256 (Private Key)' : 'HS256 (Client Secret)'}

🔗 For more information about JAR, see the "JAR (JWT-secured Authorization Request)" section in Advanced Options.`
					);
				}
			}

			// 3. Client Secret Validation
			if (flowType === 'client-credentials') {
				// Client credentials flow ALWAYS requires client secret
				if (!credentials.clientSecret?.trim()) {
					errors.push(
						`❌ Client Secret Required: Client Credentials flow requires a client secret. Please provide a Client Secret in Step 0 (Configuration).`
					);
				}
			} else if (flowType === 'oauth-authz' || flowType === 'hybrid') {
				// For authorization code and hybrid flows, check if client secret is required based on auth method
				const needsClientSecret =
					credentials.clientAuthMethod &&
					['client_secret_basic', 'client_secret_post', 'client_secret_jwt'].includes(
						credentials.clientAuthMethod
					) &&
					!credentials.usePKCE; // PKCE allows public clients

				if (needsClientSecret && !credentials.clientSecret?.trim()) {
					errors.push(
						`❌ Client Secret Required: Your selected authentication method (${credentials.clientAuthMethod}) requires a client secret, but no client secret is configured. Please provide a Client Secret in Step 0 (Configuration), or enable PKCE for a public client flow.`
					);
				}

				// Validate that client secret will be included in token exchange request body
				// CRITICAL: Backend proxy requires client_secret in request body for BOTH client_secret_basic and client_secret_post
				// For client_secret_basic: Backend reconstructs Authorization header from client_secret in body
				// For client_secret_post: Backend uses client_secret directly from body
				if (credentials.clientAuthMethod === 'client_secret_basic' || credentials.clientAuthMethod === 'client_secret_post') {
					if (!credentials.clientSecret || !credentials.clientSecret.trim()) {
						errors.push(
							`❌ Token Exchange Authentication Error: Token exchange for ${flowType} flow requires a client secret in the request body for authentication method "${credentials.clientAuthMethod}". Please provide a Client Secret in Step 0 (Configuration).`
						);
					}
				}

				// Check if PingOne auth method matches configured auth method
				if (appConfig.tokenEndpointAuthMethod) {
					// Normalize both methods for comparison (handle camelCase vs snake_case, uppercase vs lowercase)
					const normalizeAuthMethod = (method: string) => method.toLowerCase().replace(/-/g, '_');
					const pingOneAuthMethod = normalizeAuthMethod(appConfig.tokenEndpointAuthMethod);
					const configuredAuthMethod = credentials.clientAuthMethod
						? normalizeAuthMethod(credentials.clientAuthMethod)
						: null;

					// #region agent log - log auth method comparison
					fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'preFlightValidationServiceV8.ts:373',message:'Auth method comparison during pre-flight validation',data:{pingOneRaw:appConfig.tokenEndpointAuthMethod,pingOneNormalized:pingOneAuthMethod,configuredRaw:credentials.clientAuthMethod,configuredNormalized:configuredAuthMethod,match:pingOneAuthMethod===configuredAuthMethod},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
					// #endregion

					console.log(`${MODULE_TAG} Comparing auth methods`, {
						pingOneRaw: appConfig.tokenEndpointAuthMethod,
						pingOneNormalized: pingOneAuthMethod,
						configuredRaw: credentials.clientAuthMethod,
						configuredNormalized: configuredAuthMethod,
						match: pingOneAuthMethod === configuredAuthMethod,
					});

					if (configuredAuthMethod && pingOneAuthMethod !== configuredAuthMethod) {
						const errorMsg = `❌ Token Endpoint Auth Method Mismatch: Your configuration uses "${credentials.clientAuthMethod}", but PingOne is configured with "${appConfig.tokenEndpointAuthMethod}". Please update your configuration in Step 0 to match PingOne, or update PingOne to match your configuration.`;
						console.log(`${MODULE_TAG} Auth method mismatch detected`, {
							errorMsg,
							pingOneMethod: appConfig.tokenEndpointAuthMethod,
							configuredMethod: credentials.clientAuthMethod,
						});
						errors.push(errorMsg);
					}
				}
			}

			// 3. PAR (Pushed Authorization Requests) Validation
			if (credentials.usePAR) {
				// Check if PAR is supported by PingOne (this is a best-effort check)
				// PAR support is typically indicated by the presence of a PAR endpoint
				// For now, we'll just warn if PAR is enabled
				warnings.push(
					`⚠️ PAR Enabled: Pushed Authorization Requests (PAR) is enabled. Ensure your PingOne environment supports PAR (RFC 9126). If PAR is not supported, the authorization request will fail.`
				);
			}

		// 4. Response Type Validation
		if (flowType === 'implicit' && credentials.responseType && !credentials.responseType.includes('token')) {
			const errorMsg = `❌ Response Type Invalid: Implicit flow requires "token" or "token id_token" in response_type, but your configuration has "${credentials.responseType}". This will cause authorization failures.`;
			errors.push(errorMsg);
			
			// Make this fixable - auto-set correct response type for implicit flow
			fixableErrors.push({
				errorIndex: errors.length - 1,
				error: errorMsg,
				fix: 'Update response_type to "token id_token" (recommended for OIDC implicit flow)',
				autoFix: {
					responseType: specVersion === 'oidc' ? 'token id_token' : 'token',
				},
			});
		}

			if (flowType === 'hybrid' && credentials.responseType) {
				// Hybrid flow requires both 'code' and 'token' or 'id_token'
				if (!credentials.responseType.includes('code')) {
					errors.push(
						`❌ Response Type Invalid: Hybrid flow requires "code" in response_type, but your configuration has "${credentials.responseType}". Please update your response type in Step 0 (Configuration).`
					);
				}
			}

			// 5. Scopes Validation
			// CRITICAL: PingOne requires 'openid' scope for ALL flows (not just OIDC spec version)
			// This is a PingOne-specific requirement, not an OAuth/OIDC spec requirement
			if (!credentials.scopes?.includes('openid')) {
				errors.push(
					`❌ OpenID Scope Required: PingOne requires the "openid" scope for all flows (OAuth 2.0, OAuth 2.1, and OIDC), but it's not included in your scopes. Please add "openid" to your scopes in Step 0 (Configuration).`
				);
			}

			// 6. HTTPS Validation (for OAuth 2.1)
			const complianceRules = SpecVersionServiceV8.getComplianceRules(specVersion);
			if (complianceRules.requireHTTPS) {
				if (credentials.redirectUri && !credentials.redirectUri.startsWith('https://')) {
					if (!credentials.redirectUri.startsWith('http://localhost')) {
						errors.push(
							`❌ HTTPS Required: ${specVersion} requires HTTPS for all redirect URIs (except localhost). Your redirect URI "${credentials.redirectUri}" does not use HTTPS. Please use an HTTPS redirect URI.`
						);
					}
				}
			}

			// 7. Redirect URI Format Validation
			if (credentials.redirectUri) {
				try {
					new URL(credentials.redirectUri);
				} catch {
					errors.push(
						`❌ Invalid Redirect URI Format: Your redirect URI "${credentials.redirectUri}" is not a valid URL. Please enter a valid HTTP(S) URL in Step 0 (Configuration).`
					);
				}
			}

			// 8. Client ID Format Validation
			if (credentials.clientId && credentials.clientId.trim().length === 0) {
				errors.push(
					`❌ Client ID Required: Client ID cannot be empty. Please provide a valid Client ID in Step 0 (Configuration).`
				);
			}

			// 9. Scope Format Validation
			if (credentials.scopes) {
				const scopes = credentials.scopes.trim();
				if (scopes.length === 0) {
					errors.push(
						`❌ Scopes Required: At least one scope is required. Please provide scopes in Step 0 (Configuration).`
					);
				} else {
					// Validate scope format (should be space-separated, no empty segments)
					const scopeArray = scopes.split(/\s+/).filter(s => s.length > 0);
					if (scopeArray.length === 0) {
						errors.push(
							`❌ Invalid Scope Format: Scopes cannot be empty. Please provide valid space-separated scopes in Step 0 (Configuration).`
						);
					}
				}
			} else {
				errors.push(
					`❌ Scopes Required: Scopes are required but not configured. Please provide scopes in Step 0 (Configuration).`
				);
			}

			// 10. JWT Authentication Method Validation
			if (flowType === 'oauth-authz' || flowType === 'hybrid') {
				if (credentials.clientAuthMethod === 'client_secret_jwt') {
					if (!credentials.clientSecret || !credentials.clientSecret.trim()) {
						errors.push(
							`❌ Client Secret Required for JWT: Your authentication method (client_secret_jwt) requires a client secret to sign the JWT assertion. Please provide a Client Secret in Step 0 (Configuration).`
						);
					}
				} else if (credentials.clientAuthMethod === 'private_key_jwt') {
					if (!credentials.privateKey || !credentials.privateKey.trim()) {
						errors.push(
							`❌ Private Key Required for JWT: Your authentication method (private_key_jwt) requires a private key to sign the JWT assertion. Please provide a Private Key (PKCS#8 format) in Step 0 (Configuration).`
						);
					} else {
						// Basic format validation for private key
						const privateKey = credentials.privateKey.trim();
						if (!privateKey.includes('BEGIN PRIVATE KEY') && !privateKey.includes('-----BEGIN')) {
							warnings.push(
								`⚠️ Private Key Format Warning: Your private key may not be in PKCS#8 format (BEGIN PRIVATE KEY). Ensure the key is in PKCS#8 format for private_key_jwt authentication.`
							);
						}
					}
				}
			}

			// 11. Nonce Validation for OIDC Flows
			if (flowType === 'implicit' || flowType === 'hybrid') {
				// For implicit and hybrid flows, nonce is recommended if id_token is in response_type
				const responseType = credentials.responseType || '';
				if (responseType.includes('id_token')) {
					// Nonce is recommended but not required - just a warning
					// The nonce will be generated automatically when the auth URL is generated
				}
			}

			// 12. PKCE Code Verifier Format Validation (if PKCE is enabled)
			if (credentials.usePKCE || credentials.pkceEnforcement) {
				// Note: Code verifier/challenge are generated automatically, but we can validate the format if they exist
				// This is mainly for informational purposes - PKCE codes are generated when needed
			}

			// 13. Environment ID Format Validation (UUID format)
			if (credentials.environmentId) {
				const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
				if (!uuidPattern.test(credentials.environmentId)) {
					warnings.push(
						`⚠️ Environment ID Format: Your environment ID does not match the expected UUID format. Ensure it's correct in Step 0 (Configuration).`
					);
				}
			}
		} catch (error) {
			warnings.push(
				`⚠️ OAuth Configuration Validation Error: ${error instanceof Error ? error.message : String(error)}. Some validations were skipped.`
			);
			console.warn(`${MODULE_TAG} ⚠️ Pre-flight OAuth configuration validation failed:`, error);
		}

		return {
			passed: errors.length === 0,
			errors,
			warnings,
			fixableErrors: fixableErrors.length > 0 ? fixableErrors : undefined,
		};
	}

	/**
	 * Analyze errors and identify which ones can be auto-fixed
	 * @param errors - Array of error messages
	 * @param options - Validation options
	 * @param redirectUris - Registered redirect URIs from PingOne
	 * @param appConfig - Application configuration from PingOne
	 * @returns Array of fixable errors with fix information
	 */
	static analyzeFixableErrors(
		errors: string[],
		options: PreFlightValidationOptions,
		redirectUris?: string[],
		appConfig?: {
			tokenEndpointAuthMethod?: string;
			pkceEnforced?: boolean;
			pkceRequired?: boolean;
			requireSignedRequestObject?: boolean;
		}
	): FixableError[] {
		const fixableErrors: FixableError[] = [];

		errors.forEach((error, index) => {
			const errorLower = error.toLowerCase();
			
			console.log(`${MODULE_TAG} Analyzing error for fixability`, {
				index,
				error,
				errorLower,
				hasAuthMethodMismatch: errorLower.includes('token endpoint auth method mismatch'),
				hasAppConfig: !!appConfig,
				hasTokenEndpointAuthMethod: !!appConfig?.tokenEndpointAuthMethod,
			});

			// 1. Redirect URI Mismatch
			if (
				(errorLower.includes('redirect uri mismatch') ||
					errorLower.includes('redirect uri does not match')) &&
				redirectUris &&
				redirectUris.length > 0
			) {
				fixableErrors.push({
					errorIndex: index,
					errorType: 'redirect_uri_mismatch',
					errorMessage: error,
					fixable: true,
					fixDescription: `Update redirect URI to match PingOne: ${redirectUris[0]}`,
					fixData: {
						redirectUri: redirectUris[0],
					},
				});
			}

			// 2. PKCE Required
			else if (errorLower.includes('pkce required')) {
				fixableErrors.push({
					errorIndex: index,
					errorType: 'pkce_required',
					errorMessage: error,
					fixable: true,
					fixDescription: 'Enable PKCE in configuration',
					fixData: {
						enablePKCE: true,
					},
				});
			}

			// 3. Token Endpoint Auth Method Mismatch
			else if (
				errorLower.includes('token endpoint auth method mismatch') &&
				appConfig?.tokenEndpointAuthMethod
			) {
				// Normalize the PingOne auth method to match the format expected by the UI
				// PingOne returns formats like CLIENT_SECRET_POST or CLIENT_SECRET_BASIC, but UI expects client_secret_post or client_secret_basic
				const normalizeForUI = (method: string): string => {
					// Convert CLIENT_SECRET_POST -> client_secret_post
					// Convert CLIENT_SECRET_BASIC -> client_secret_basic
					// Handle both uppercase and mixed case
					return method.toLowerCase().replace(/-/g, '_');
				};
				
				const normalizedMethod = normalizeForUI(appConfig.tokenEndpointAuthMethod);
				
				console.log(`${MODULE_TAG} ✅ Found fixable auth method mismatch`, {
					errorIndex: index,
					pingOneMethod: appConfig.tokenEndpointAuthMethod,
					normalizedMethod,
					errorMessage: error,
					willBeFixed: true,
				});

				fixableErrors.push({
					errorIndex: index,
					errorType: 'auth_method_mismatch',
					errorMessage: error,
					fixable: true,
					fixDescription: `Update auth method to match PingOne: ${appConfig.tokenEndpointAuthMethod} → ${normalizedMethod}`,
					fixData: {
						authMethod: normalizedMethod as any, // Normalized to lowercase with underscores
					},
				});
			}

			// 4. OpenID Scope Missing
			// CRITICAL: PingOne requires 'openid' scope for ALL flows (not just OIDC)
			else if (errorLower.includes('openid scope required') || (errorLower.includes('openid') && errorLower.includes('scope'))) {
				// Fixable for all flows (PingOne requirement)
				if (!options.credentials.scopes?.includes('openid')) {
					fixableErrors.push({
						errorIndex: index,
						errorType: 'openid_scope_missing',
						errorMessage: error,
						fixable: true,
						fixDescription: 'Add "openid" scope to configuration (PingOne requirement for all flows)',
						fixData: {
							addScope: 'openid',
						},
					});
				}
			}

			// 5. Response Type Invalid
			else if (errorLower.includes('response type invalid') || (errorLower.includes('response type') && errorLower.includes('required'))) {
				// Determine correct response type based on flow
				let correctResponseType = '';
				if (options.flowType === 'hybrid') {
					correctResponseType = 'code id_token';
				} else if (options.flowType === 'implicit') {
					correctResponseType = 'token id_token';
				} else if (options.flowType === 'oauth-authz') {
					correctResponseType = 'code';
				}

				if (correctResponseType) {
					fixableErrors.push({
						errorIndex: index,
						errorType: 'response_type_invalid',
						errorMessage: error,
						fixable: true,
						fixDescription: `Update response type to: ${correctResponseType}`,
						fixData: {
							responseType: correctResponseType,
						},
					});
				}
			}
		});

		return fixableErrors;
	}

	/**
	 * Perform all pre-flight validations
	 * @param options - Validation options
	 * @returns Complete validation result
	 */
	static async validateBeforeAuthUrl(
		options: PreFlightValidationOptions
	): Promise<PreFlightValidationResult> {
		console.log(`${MODULE_TAG} Starting pre-flight validation`, {
			specVersion: options.specVersion,
			flowType: options.flowType,
			hasWorkerToken: !!options.workerToken,
		});

		// 1. Validate redirect URI
		const redirectUriResult = await PreFlightValidationServiceV8.validateRedirectUri(
			options.credentials,
			options.workerToken
		);

		// 2. Validate OAuth configuration
		const oauthConfigResult = await PreFlightValidationServiceV8.validateOAuthConfig(options);

		// Combine results
		const errors: string[] = [];
		const warnings: string[] = [];

		if (redirectUriResult.error) {
			if (!redirectUriResult.passed) {
				errors.push(redirectUriResult.error);
			} else {
				warnings.push(redirectUriResult.error);
			}
		}

		errors.push(...oauthConfigResult.errors);
		warnings.push(...oauthConfigResult.warnings);

		const passed = redirectUriResult.passed && oauthConfigResult.passed;

		// Fetch app config for fixable error analysis (if worker token available)
		let appConfig: {
			tokenEndpointAuthMethod?: string;
			pkceEnforced?: boolean;
			pkceRequired?: boolean;
			requireSignedRequestObject?: boolean;
		} | undefined;
		if (options.workerToken && options.credentials.environmentId && options.credentials.clientId) {
			try {
				const fetchedConfig = await ConfigCheckerServiceV8.fetchAppConfig(
					options.credentials.environmentId,
					options.credentials.clientId,
					options.workerToken
				);
				if (fetchedConfig) {
					appConfig = {
						tokenEndpointAuthMethod: fetchedConfig.tokenEndpointAuthMethod,
						pkceEnforced: fetchedConfig.pkceEnforced,
						pkceRequired: fetchedConfig.pkceRequired,
						requireSignedRequestObject: fetchedConfig.requireSignedRequestObject,
					};
				}
			} catch (error) {
				console.warn(`${MODULE_TAG} Could not fetch app config for fixable error analysis:`, error);
			}
		}

		// Analyze fixable errors
		const fixableErrors = PreFlightValidationServiceV8.analyzeFixableErrors(
			errors,
			options,
			redirectUriResult.redirectUris,
			appConfig
		);

		console.log(`${MODULE_TAG} Pre-flight validation complete`, {
			passed,
			errorCount: errors.length,
			warningCount: warnings.length,
			fixableErrorCount: fixableErrors.length,
			redirectUriValidated: redirectUriResult.passed,
			oauthConfigValidated: oauthConfigResult.passed,
		});

		return {
			passed,
			errors,
			warnings,
			redirectUriValidated: redirectUriResult.passed,
			oauthConfigValidated: oauthConfigResult.passed,
			redirectUris: redirectUriResult.redirectUris,
			fixableErrors,
			appConfig,
		};
	}
}
