/**
 * @file clientCredentialsIntegrationServiceV8.ts
 * @module v8/services
 * @description Real OAuth Client Credentials Flow integration with PingOne APIs
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Handles:
 * - Token request using client credentials grant
 * - No user interaction required (machine-to-machine)
 * - Token validation and decoding
 *
 * @example
 * const tokens = await ClientCredentialsIntegrationServiceV8.requestToken(credentials);
 */

import { pingOneFetch } from '@/utils/pingOneFetch';
import { ScopeFixServiceV8 } from './scopeFixServiceV8';

const MODULE_TAG = '[🔑 CLIENT-CREDENTIALS-V8]';

export type ClientAuthMethod =
	| 'none'
	| 'client_secret_basic'
	| 'client_secret_post'
	| 'client_secret_jwt'
	| 'private_key_jwt';

export interface ClientCredentialsCredentials {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	scopes?: string;
	clientAuthMethod?: ClientAuthMethod;
	privateKey?: string; // Required for private_key_jwt authentication
}

export interface TokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	scope?: string;
}

export interface DecodedToken {
	header: Record<string, unknown>;
	payload: Record<string, unknown>;
	signature: string;
}

export interface ScopeFixResult {
	fixedScopes: string;
	reason: string;
	requiresPingOneConfig: boolean;
	pingOneInstructions?: string;
}

/**
 * ClientCredentialsIntegrationServiceV8
 *
 * Real OAuth 2.0 Client Credentials Flow integration with PingOne APIs
 */
export class ClientCredentialsIntegrationServiceV8 {
	/**
	 * Get scope fix suggestions for client credentials flow
	 * @param credentials - Current credentials
	 * @returns Scope fix result with suggestions
	 */
	static getScopeFix(credentials: ClientCredentialsCredentials): ScopeFixResult {
		return ScopeFixServiceV8.analyzeAndFixScopes({
			currentScopes: credentials.scopes || '',
			flowType: 'client-credentials',
			environmentId: credentials.environmentId,
			applicationId: credentials.clientId,
		});
	}

	/**
	 * Request access token using client credentials grant
	 * @param credentials - OAuth credentials
	 * @returns Token response
	 */
	static async requestToken(credentials: ClientCredentialsCredentials): Promise<TokenResponse> {
		console.log(`${MODULE_TAG} Requesting access token`, {
			environmentId: credentials.environmentId,
			clientId: credentials.clientId,
			clientAuthMethod: credentials.clientAuthMethod || 'client_secret_post',
		});

		try {
			// Use backend proxy to avoid CORS issues
			// In development, use relative URL to leverage Vite proxy (proxies /api to http://localhost:3001)
			// In production, use absolute URL
			const tokenEndpoint =
				process.env.NODE_ENV === 'production'
					? 'https://oauth-playground.vercel.app/api/client-credentials'
					: '/api/client-credentials';

			// Client Credentials flow REQUIRES client authentication (RFC 6749 Section 4.4)
			// 'none' is NOT allowed - default to client_secret_post (most common) if none is specified
			// Normalize auth method to lowercase (PingOne may return uppercase like "CLIENT_SECRET_POST")
			const normalizedAuthMethod = credentials.clientAuthMethod
				? (credentials.clientAuthMethod.toLowerCase() as ClientAuthMethod)
				: 'client_secret_post';
			const authMethod: Exclude<ClientAuthMethod, 'none'> =
				normalizedAuthMethod && normalizedAuthMethod !== 'none'
					? (normalizedAuthMethod as Exclude<ClientAuthMethod, 'none'>)
					: 'client_secret_post';

			const headers: Record<string, string> = {};

			// Build request body for backend proxy
			// The backend proxy expects: environment_id, auth_method, body (with grant_type, client_id, etc.), headers (for Basic auth)
			const proxyRequestBody: Record<string, string> = {
				grant_type: 'client_credentials',
				client_id: credentials.clientId,
			};

			// #region agent log - log client_id being sent
			// #endregion

			// Add scope - REQUIRED for client credentials flow
			// NOTE: Client credentials is for machine-to-machine auth, NOT user auth
			// Scopes are required for client credentials flow
			if (!credentials.scopes || credentials.scopes.trim() === '') {
				console.error(`${MODULE_TAG} No scopes provided - client credentials flow requires scopes`);
				throw new Error(
					'Scopes are required for client credentials flow. Use custom resource server scopes (e.g., api:read, api:write) or Management API scopes (e.g., p1:read:user, p1:read:environments). See https://apidocs.pingidentity.com/pingone/main/v1/api/#access-services-through-scopes-and-roles'
				);
			}

			// Validate that scopes are appropriate for client credentials flow
			// Client credentials flow should NOT use OpenID Connect scopes (openid, profile, email)
			const scopesList = credentials.scopes.split(/\s+/).filter((s) => s.trim());
			const invalidScopes = scopesList.filter(
				(scope) =>
					scope === 'openid' ||
					scope === 'profile' ||
					scope === 'email' ||
					scope === 'address' ||
					scope === 'phone'
			);

			if (invalidScopes.length > 0) {
				console.error(`${MODULE_TAG} Invalid scopes for client credentials flow`, {
					invalidScopes,
					allScopes: scopesList,
					message: 'OpenID Connect scopes cannot be used with client credentials flow',
				});

				throw new Error(
					`Invalid scope configuration: The scope(s) "${invalidScopes.join(', ')}" are OpenID Connect scopes and cannot be used with client credentials flow.\n\n` +
						`Client credentials flow is for machine-to-machine authentication and should use PingOne resource server scopes.\n` +
						`• Default resource scope: CLAIMICFACILITY\n` +
						`• Custom resources: Add your own resource scopes in the PingOne Admin Console\n` +
						`• Remove OpenID Connect scopes: openid, profile, email, address, phone\n\n` +
						`To add custom resources:\n` +
						`1. Go to PingOne Admin Console → Applications → Your Application → Resources tab\n` +
						`2. Add Resource with your desired scopes (e.g., my-api:read, my-api:write)\n` +
						`3. Use those scopes in the client credentials flow\n\n` +
						`See: https://apidocs.pingidentity.com/pingone/main/v1/api/#access-services-through-scopes-and-roles`
				);
			}

			// Note: All scopes (including OIDC scopes like openid, profile, email, address, phone, offline_access)
			// are allowed for client credentials flow. The actual validation is done by PingOne based on
			// what scopes are enabled/granted to the application in the Resources tab.

			// #region agent log
			// #endregion

			proxyRequestBody.scope = credentials.scopes;

			// #region agent log
			// #endregion

			// Apply client authentication method
			switch (authMethod) {
				case 'client_secret_basic': {
					// HTTP Basic Authentication (RFC 7617) - pass via headers to backend
					const credentials_b64 = btoa(`${credentials.clientId}:${credentials.clientSecret}`);
					headers['Authorization'] = `Basic ${credentials_b64}`;
					break;
				}

				case 'client_secret_post': {
					// Client credentials in POST body (default)
					// CRITICAL: Ensure client secret is a string and trim any accidental whitespace
					if (!credentials.clientSecret) {
						throw new Error('Client secret is required for client_secret_post authentication');
					}
					const trimmedSecret = credentials.clientSecret.trim();
					if (trimmedSecret.length === 0) {
						throw new Error('Client secret cannot be empty or whitespace only');
					}
					proxyRequestBody.client_secret = trimmedSecret;
					break;
				}

				case 'client_secret_jwt': {
					// JWT assertion authentication using client secret (HS256)
					if (!credentials.clientSecret) {
						throw new Error('Client secret is required for client_secret_jwt authentication');
					}
					try {
						const { createClientAssertion } = await import('../../utils/clientAuthentication');
						const actualTokenEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/token`;
						const assertion = await createClientAssertion(
							credentials.clientId,
							actualTokenEndpoint,
							credentials.clientSecret,
							'HS256'
						);
						proxyRequestBody.client_id = credentials.clientId;
						proxyRequestBody.client_assertion_type =
							'urn:ietf:params:oauth:client-assertion-type:jwt-bearer';
						proxyRequestBody.client_assertion = assertion;
						console.log(`${MODULE_TAG} Using Client Secret JWT assertion authentication`);
					} catch (error) {
						console.error(`${MODULE_TAG} Failed to generate client secret JWT assertion`, {
							error,
						});
						throw new Error(
							`Failed to generate JWT assertion: ${error instanceof Error ? error.message : 'Unknown error'}`
						);
					}
					break;
				}

				case 'private_key_jwt': {
					// JWT assertion authentication using private key (RS256)
					const privateKey = (credentials as { privateKey?: string }).privateKey;
					if (!privateKey) {
						throw new Error('Private key is required for private_key_jwt authentication');
					}
					try {
						const { createClientAssertion } = await import('../../utils/clientAuthentication');
						const actualTokenEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/token`;
						const assertion = await createClientAssertion(
							credentials.clientId,
							actualTokenEndpoint,
							privateKey,
							'RS256'
						);
						proxyRequestBody.client_id = credentials.clientId;
						proxyRequestBody.client_assertion_type =
							'urn:ietf:params:oauth:client-assertion-type:jwt-bearer';
						proxyRequestBody.client_assertion = assertion;
						console.log(`${MODULE_TAG} Using Private Key JWT assertion authentication`);
					} catch (error) {
						console.error(`${MODULE_TAG} Failed to generate private key JWT assertion`, { error });
						throw new Error(
							`Failed to generate JWT assertion: ${error instanceof Error ? error.message : 'Unknown error'}`
						);
					}
					break;
				}

				default: {
					// Fallback to client_secret_post for any unexpected values
					console.warn(`${MODULE_TAG} Unknown authentication method, using client_secret_post`);
					proxyRequestBody.client_secret = credentials.clientSecret;
					break;
				}
			}

			// Verify grant_type is present
			if (!proxyRequestBody.grant_type || proxyRequestBody.grant_type !== 'client_credentials') {
				console.error(`${MODULE_TAG} ERROR: grant_type is missing or incorrect!`, {
					hasGrantType: !!proxyRequestBody.grant_type,
					grantType: proxyRequestBody.grant_type,
					expected: 'client_credentials',
					fullBody: proxyRequestBody,
				});
				throw new Error('Internal error: grant_type must be "client_credentials" for this flow');
			}

			// VERIFY: Ensure client_secret is a string and not corrupted
			if (authMethod === 'client_secret_post' && proxyRequestBody.client_secret) {
				if (typeof proxyRequestBody.client_secret !== 'string') {
					console.error(`${MODULE_TAG} ❌ ERROR: client_secret is not a string!`, {
						type: typeof proxyRequestBody.client_secret,
						value: proxyRequestBody.client_secret,
					});
					throw new Error('Client secret must be a string');
				}
				if (proxyRequestBody.client_secret.trim().length === 0) {
					console.error(`${MODULE_TAG} ❌ ERROR: client_secret is empty or whitespace!`);
					throw new Error('Client secret cannot be empty');
				}
			}

			// Build request for backend proxy
			const proxyRequest: {
				environment_id: string;
				auth_method?: string;
				body: Record<string, string>;
				headers?: Record<string, string>;
			} = {
				environment_id: credentials.environmentId,
				body: proxyRequestBody,
			};

			// #region agent log
			// #endregion

			// Add auth method and headers
			// IMPORTANT: For JWT-based authentication (client_secret_jwt, private_key_jwt),
			// the JWT assertion must be in the request body (client_assertion), NOT in headers.
			// Only Basic auth uses the Authorization header.
			if (authMethod === 'client_secret_basic') {
				proxyRequest.auth_method = 'client_secret_basic';
				proxyRequest.headers = headers; // Only include headers for Basic auth
			} else {
				proxyRequest.auth_method = authMethod;
				// Explicitly do NOT include headers for JWT methods - assertion is in body
			}

			// Track API call for display
			const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
			const startTime = Date.now();
			const actualPingOneUrl = `https://auth.pingone.com/${credentials.environmentId}/as/token`;
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: tokenEndpoint,
				actualPingOneUrl,
				isProxy: true,
				headers: {
					'Content-Type': 'application/json',
					...(headers['Authorization'] ? { Authorization: '***REDACTED***' } : {}),
				},
				body: {
					...proxyRequest,
					body: {
						...proxyRequest.body,
						client_secret: proxyRequest.body.client_secret ? '***REDACTED***' : undefined,
					},
				},
				step: 'unified-client-credentials-token',
				flowType: 'unified',
			});

			// #region agent log
			// #endregion

			const response = await pingOneFetch(tokenEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(proxyRequest),
			});

			// Update API call with response
			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as Record<string, unknown>;
				const errorMessage = (errorData.error_description ||
					errorData.error ||
					'Unknown error') as string;
				const errorCode = (errorData.error || 'unknown_error') as string;

				// #region agent log
				// #endregion

				// Log the FULL error response for debugging
				console.error(`${MODULE_TAG} Full PingOne error response:`, {
					status: response.status,
					statusText: response.statusText,
					errorCode,
					errorMessage,
					fullErrorData: errorData,
					requestBody: {
						grant_type: proxyRequestBody.grant_type,
						client_id: proxyRequestBody.client_id,
						scope: proxyRequestBody.scope,
						hasClientSecret: !!proxyRequestBody.client_secret,
						authMethod,
					},
				});

				// Extract correlation ID from error data or error message
				let correlationId = errorData.correlation_id || errorData.correlationId;
				if (!correlationId && typeof errorMessage === 'string') {
					// Try to extract from error message format: "... (Correlation ID: ...)"
					const correlationMatch = errorMessage.match(/\(Correlation ID:\s*([^)]+)\)/i);
					if (correlationMatch) {
						correlationId = correlationMatch[1].trim();
					}
				}

				// Enhanced error handling for invalid_client with diagnostic info
				if (errorCode === 'invalid_client') {
					const diagnosticInfo = (errorData as { diagnostic?: unknown }).diagnostic;
					console.error(`${MODULE_TAG} Invalid client error with diagnostics:`, {
						errorCode,
						errorMessage,
						correlationId,
						diagnosticInfo,
					});

					// Build comprehensive error message
					let errorMsg = `Invalid Client Credentials Error\n\n`;
					errorMsg += `🔍 Error Details:\n`;
					errorMsg += `- Error Code: ${errorCode}\n`;
					errorMsg += `- Message: ${errorMessage}\n`;
					errorMsg += `- Correlation ID: ${correlationId || 'N/A'}\n\n`;

					if (diagnosticInfo && typeof diagnosticInfo === 'object') {
						const diag = diagnosticInfo as Record<string, unknown>;
						if (diag.whatWeSent) {
							const sent = diag.whatWeSent as Record<string, unknown>;
							errorMsg += `📤 What We Sent:\n`;
							errorMsg += `- Client ID: ${sent.clientId || 'N/A'}\n`;
							errorMsg += `- Auth Method: ${sent.authMethod || 'N/A'}\n`;
							errorMsg += `- Client Secret Length: ${sent.clientSecretLength || 0} characters\n`;
							errorMsg += `- Grant Type: ${sent.grantType || 'N/A'}\n\n`;
						}

						if (diag.recommendation) {
							const rec = diag.recommendation as Record<string, string>;
							errorMsg += `🔧 How to Fix:\n`;
							Object.values(rec).forEach((step, idx) => {
								errorMsg += `${idx + 1}. ${step}\n`;
							});
							errorMsg += `\n`;
						}
					} else {
						// Fallback if no diagnostic info
						errorMsg += `🔧 How to Fix:\n`;
						errorMsg += `1. Go to PingOne Admin Console: https://admin.pingone.com\n`;
						errorMsg += `2. Navigate to: Applications → Your Application (${credentials.clientId?.substring(0, 8)}...)\n`;
						errorMsg += `3. ⚠️ CRITICAL: Check the "Grant Type" - it MUST be "Client Credentials" (not "Implicit", "Authorization Code", etc.)\n`;
						errorMsg += `4. If Grant Type is NOT "Client Credentials", you have two options:\n`;
						errorMsg += `   a) Enable "Client Credentials" grant type in the OIDC Settings tab\n`;
						errorMsg += `   b) Use a different application that has Client Credentials enabled\n`;
						errorMsg += `5. Verify the Client ID matches exactly: ${credentials.clientId}\n`;
						errorMsg += `6. Copy the Client Secret directly from PingOne (do not modify)\n`;
						errorMsg += `7. ⚠️ CRITICAL: Check "Token Endpoint Authentication Method" in the OIDC Settings tab\n`;
						errorMsg += `   - Your PingOne app is configured for: Check the "OIDC Settings" tab in PingOne\n`;
						errorMsg += `   - This app is using: "${authMethod}"\n`;
						errorMsg += `   - These MUST match! Common options:\n`;
						errorMsg += `     * "Client Secret Post (Form Body)" = client_secret_post\n`;
						errorMsg += `     * "Client Secret Basic (HTTP Basic)" = client_secret_basic\n`;
						errorMsg += `   - Either change PingOne to match this app, or change this app's auth method to match PingOne\n`;
						errorMsg += `8. Try the request again\n\n`;
					}

					errorMsg += `📚 Documentation: https://apidocs.pingidentity.com/pingone/main/v1/api/#client-credentials-flow\n`;
					errorMsg += `🔍 Correlation ID: ${correlationId || 'N/A'}`;

					throw new Error(errorMsg);
				}

				// Provide helpful error message for invalid_grant errors (grant type not enabled)
				if (errorCode === 'invalid_grant') {
					console.error(`${MODULE_TAG} Invalid grant type error`, {
						grantTypeRequested: 'client_credentials',
						errorCode,
						errorMessage,
						correlationId,
					});

					// Check if error indicates grant type is not enabled
					const isGrantTypeNotEnabled =
						errorMessage.toLowerCase().includes('grant type') ||
						errorMessage.toLowerCase().includes('grant_type') ||
						errorMessage.toLowerCase().includes('not supported') ||
						errorMessage.toLowerCase().includes('not enabled') ||
						errorMessage.toLowerCase().includes('invalid grant');

					if (isGrantTypeNotEnabled) {
						throw new Error(
							`Grant Type Configuration Error: The "Client Credentials" grant type is not enabled for your application in PingOne.\n\n` +
								`🔧 How to Fix:\n` +
								`1. Go to PingOne Admin Console: https://admin.pingone.com\n` +
								`2. Navigate to: Applications → Your Application (${credentials.clientId?.substring(0, 8)}...)\n` +
								`3. Click the "General" tab (or "OIDC Settings" tab)\n` +
								`4. Under "Grant Types", check the box for "Client Credentials"\n` +
								`5. Click "Save"\n` +
								`6. Wait a few seconds for changes to propagate, then try the request again\n\n` +
								`💡 Note: Your application is currently configured for "${errorMessage.includes('implicit') ? 'Implicit' : 'other'} grant type(s)". ` +
								`You need to enable "Client Credentials" grant type to use this flow.\n\n` +
								`📚 Documentation: https://apidocs.pingidentity.com/pingone/main/v1/api/#client-credentials-flow\n` +
								`🔍 Correlation ID: ${correlationId || 'N/A'}`
						);
					}

					throw new Error(
						`Invalid grant type: ${errorMessage}\n\n` +
							`The "client_credentials" grant type is not enabled or not supported for this application.\n\n` +
							`🔧 How to Fix:\n` +
							`1. Go to PingOne Admin Console: https://admin.pingone.com\n` +
							`2. Navigate to: Applications → Your Application\n` +
							`3. Enable the "Client Credentials" grant type in the application settings\n` +
							`4. Save the changes and try again\n\n` +
							`📚 Documentation: https://apidocs.pingidentity.com/pingone/main/v1/api/#client-credentials-flow\n` +
							`🔍 Correlation ID: ${correlationId || 'N/A'}`
					);
				}

				// Provide helpful error message for invalid_scope errors
				if (errorCode === 'invalid_scope') {
					console.error(`${MODULE_TAG} Invalid scope error`, {
						scopesRequested: credentials.scopes,
						errorCode,
						errorMessage,
						correlationId,
					});

					const scopesList = credentials.scopes.split(/\s+/).filter((s) => s.trim());

					// Check if error indicates scopes are not granted (common issue)
					const isScopeNotGranted =
						errorMessage.toLowerCase().includes('at least one scope must be granted') ||
						errorMessage.toLowerCase().includes('scope must be granted') ||
						errorMessage.toLowerCase().includes('no scope granted') ||
						errorMessage.toLowerCase().includes('not enabled') ||
						errorMessage.toLowerCase().includes('not granted');

					// #region agent log
					// #endregion

					if (isScopeNotGranted) {
						let errorMsg = `Configuration Error: The scope(s) "${scopesList.join(', ')}" request failed.\n\n`;

						errorMsg += `📋 Root Cause\n\n`;
						errorMsg += `The error "At least one scope must be granted" from PingOne indicates that the requested scope(s) are not enabled or granted for your application.\n\n`;

						errorMsg += `💡 Critical: What Scopes Work with Client Credentials?\n\n`;
						errorMsg += `For Client Credentials flow, you MUST use PingOne resource server scopes.\n\n`;
						errorMsg += `❌ OIDC scopes (like "openid", "profile", "email") do NOT work with Client Credentials\n`;
						errorMsg += `❌ Self-management scopes (like "p1:read:user") do NOT work with Client Credentials\n`;
						errorMsg += `✅ Resource server scopes (like "ClaimScope", "my-api:read") DO work with Client Credentials\n\n`;

						errorMsg += `⚠️ Authentication Method Mismatch\n\n`;
						errorMsg += `Your PingOne app's "Token Endpoint Authentication Method" (in OIDC Settings tab) must match this app's auth method.\n\n`;
						errorMsg += `• This app is using: "${authMethod}"\n`;
						errorMsg += `• Common PingOne options:\n`;
						errorMsg += `  - "Client Secret Post (Form Body)" = client_secret_post\n`;
						errorMsg += `  - "Client Secret Basic (HTTP Basic)" = client_secret_basic\n`;
						errorMsg += `• If they don't match, either change PingOne or change this app's auth method\n\n`;

						errorMsg += `🔧 How to Fix: Create and Configure Resource Server Scopes\n\n`;
						errorMsg += `Step 1: Create a Resource Server (if you don't have one)\n\n`;
						errorMsg += `1. Go to PingOne Admin Console:\n`;
						errorMsg += `   https://admin.pingone.com\n\n`;
						errorMsg += `2. Navigate to: Resources → Resource Servers\n\n`;
						errorMsg += `3. Click "Add Resource Server"\n\n`;
						errorMsg += `4. Fill in the details:\n`;
						errorMsg += `   • Name: "My API Server" (or any name you prefer)\n`;
						errorMsg += `   • Description: "Resource server for client credentials flow" (optional)\n\n`;
						errorMsg += `5. Click "Save"\n\n`;
						errorMsg += `Step 2: Add Scopes to Your Resource Server\n\n`;
						errorMsg += `1. In the Resource Server you just created, click "Scopes"\n\n`;
						errorMsg += `2. Click "Add Scope"\n\n`;
						errorMsg += `3. Fill in the scope details:\n`;
						errorMsg += `   • Scope Name: "ClaimScope" (this is the scope you'll use in your request)\n`;
						errorMsg += `   • Description: "Access to claim data" (optional)\n\n`;
						errorMsg += `4. Click "Save"\n\n`;
						errorMsg += `Step 3: Associate Resource Server with Your Application\n\n`;
						errorMsg += `1. Navigate to: Applications → Your Application (${credentials.clientId?.substring(0, 8)}...)\n\n`;
						errorMsg += `2. Click the "Resources" tab\n\n`;
						errorMsg += `3. Under "Resource Servers", find your resource server (e.g., "My API Server")\n\n`;
						errorMsg += `4. Check the box next to your resource server to enable it\n\n`;
						errorMsg += `5. Under the resource server, check the box next to the scope (e.g., "ClaimScope")\n\n`;
						errorMsg += `6. Click "Save"\n\n`;
						errorMsg += `Step 4: Use the Resource Server Scope in Your Request\n\n`;
						errorMsg += `1. In this app, use the scope name you created (e.g., "ClaimScope")\n\n`;
						errorMsg += `2. Example: Enter "ClaimScope" in the Scopes field\n\n`;
						errorMsg += `3. Wait a few seconds for changes to propagate, then try the request again\n\n`;

						errorMsg += `📝 Example\n\n`;
						errorMsg += `Instead of "openid", use a resource server scope like "ClaimScope" or "my-api:read" (whatever is available in your Resources tab under a resource server)\n\n`;

						// Check for OIDC scopes - these don't work with client_credentials
						const oidcScopes = scopesList.filter((s) =>
							['openid', 'profile', 'email', 'address', 'phone', 'offline_access'].includes(
								s.toLowerCase()
							)
						);
						if (oidcScopes.length > 0) {
							errorMsg += `⚠️ OIDC Scopes Detected (${oidcScopes.join(', ')})\n\n`;
							errorMsg += `OIDC scopes cannot be used with Client Credentials flow. You need resource server scopes instead.\n\n`;
							errorMsg += `✅ Use resource server scopes like "ClaimScope" or "my-api:read" (check your Resources tab for available scopes)\n\n`;
						}

						// Check for self-management scopes - these cannot be used with client_credentials
						const selfManagementScopes = scopesList.filter((s) => s.startsWith('p1:'));
						if (selfManagementScopes.length > 0) {
							errorMsg += `⚠️ Self-Management Scopes Detected (${selfManagementScopes.join(', ')})\n\n`;
							errorMsg += `PingOne self-management scopes (like "p1:read:user") cannot be granted on a client_credentials flow.\n\n`;
							errorMsg += `✅ Use resource server scopes instead (like "ClaimScope" or "my-api:read")\n\n`;
						}

						errorMsg += `📚 Documentation\n\n`;
						errorMsg += `• Custom Scopes:\n`;
						errorMsg += `  https://apidocs.pingidentity.com/pingone/main/v1/api/#custom-scopes\n\n`;
						errorMsg += `• Roles, Scopes, and Permissions:\n`;
						errorMsg += `  https://apidocs.pingidentity.com/pingone/main/v1/api/#roles-scopes-and-permissions\n\n`;
						errorMsg += `🔍 Correlation ID: ${correlationId || 'N/A'}`;

						throw new Error(errorMsg);
					}

					throw new Error(
						`Invalid scopes: ${errorMessage}\n\n` +
							`The scopes "${credentials.scopes}" are not valid or not enabled for this application.\n\n` +
							`🔧 How to Fix:\n` +
							`1. Verify the scopes are correct for your resource server\n` +
							`2. Ensure the scopes are enabled in your PingOne application's Resources tab\n` +
							`3. Check that the correct resource is enabled (e.g., "PingOne API" for Management API scopes)\n\n` +
							`📚 Documentation: https://apidocs.pingidentity.com/pingone/main/v1/api/#access-services-through-scopes-and-roles\n` +
							`🔍 Correlation ID: ${correlationId || 'N/A'}`
					);
				}

				console.error(`${MODULE_TAG} Token request failed`, {
					status: response.status,
					statusText: response.statusText,
					errorCode,
					errorMessage,
					scopesRequested: credentials.scopes,
					correlationId,
				});

				throw new Error(`Token request failed: ${errorCode} - ${errorMessage}`);
			}

			const tokens: TokenResponse = responseData as TokenResponse;

			console.log(`${MODULE_TAG} Access token received successfully`, {
				hasAccessToken: !!tokens.access_token,
				expiresIn: tokens.expires_in,
				scope: tokens.scope,
			});

			return tokens;
		} catch (error) {
			// Log detailed error information
			const errorDetails: Record<string, unknown> = {
				error: error instanceof Error ? error.message : String(error),
			};

			if (error instanceof Error) {
				errorDetails.stack = error.stack;
				errorDetails.name = error.name;
			}

			// Include request details for debugging
			errorDetails.environmentId = credentials.environmentId;
			errorDetails.clientId = credentials.clientId;
			errorDetails.scopes = credentials.scopes;
			errorDetails.authMethod = credentials.clientAuthMethod || 'client_secret_post';

			console.error(`${MODULE_TAG} Error requesting access token`, errorDetails);
			throw error;
		}
	}

	/**
	 * Decode JWT token (without verification)
	 * @param token - JWT token to decode
	 * @returns Decoded token with header, payload, and signature
	 */
	static decodeToken(token: string): DecodedToken {
		console.log(`${MODULE_TAG} Decoding JWT token`);

		try {
			const parts = token.split('.');

			if (parts.length !== 3) {
				throw new Error('Invalid JWT format');
			}

			const header = JSON.parse(ClientCredentialsIntegrationServiceV8.base64UrlDecode(parts[0]));
			const payload = JSON.parse(ClientCredentialsIntegrationServiceV8.base64UrlDecode(parts[1]));
			const signature = parts[2];

			console.log(`${MODULE_TAG} Token decoded successfully`);

			return { header, payload, signature };
		} catch (error) {
			console.error(`${MODULE_TAG} Error decoding token`, { error });
			throw error;
		}
	}

	/**
	 * Validate token expiry
	 * @param token - JWT token
	 * @returns True if token is not expired
	 */
	static isTokenValid(token: string): boolean {
		try {
			const decoded = ClientCredentialsIntegrationServiceV8.decodeToken(token);
			const payload = decoded.payload as { exp?: number };

			if (!payload.exp) {
				return true; // No expiry claim
			}

			const expiryTime = payload.exp * 1000; // Convert to milliseconds
			const currentTime = Date.now();

			return currentTime < expiryTime;
		} catch {
			return false;
		}
	}

	/**
	 * Get token expiry time
	 * @param token - JWT token
	 * @returns Expiry time in milliseconds from now, or null if no expiry
	 */
	static getTokenExpiryTime(token: string): number | null {
		try {
			const decoded = ClientCredentialsIntegrationServiceV8.decodeToken(token);
			const payload = decoded.payload as { exp?: number };

			if (!payload.exp) {
				return null;
			}

			const expiryTime = payload.exp * 1000;
			const currentTime = Date.now();

			return Math.max(0, expiryTime - currentTime);
		} catch {
			return null;
		}
	}

	/**
	 * Base64 URL decode
	 * @param str - Base64 URL encoded string
	 * @returns Decoded string
	 */
	private static base64UrlDecode(str: string): string {
		let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

		// Add padding if needed
		const padding = 4 - (base64.length % 4);
		if (padding !== 4) {
			base64 += '='.repeat(padding);
		}

		return Buffer.from(base64, 'base64').toString('utf-8');
	}
}

export default ClientCredentialsIntegrationServiceV8;
