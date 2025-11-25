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

/**
 * ClientCredentialsIntegrationServiceV8
 *
 * Real OAuth 2.0 Client Credentials Flow integration with PingOne APIs
 */
export class ClientCredentialsIntegrationServiceV8 {
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
			// 'none' is NOT allowed - default to client_secret_basic (most common) if none is specified
			// Normalize auth method to lowercase (PingOne may return uppercase like "CLIENT_SECRET_POST")
			const normalizedAuthMethod = credentials.clientAuthMethod
				? (credentials.clientAuthMethod.toLowerCase() as ClientAuthMethod)
				: 'client_secret_basic';
			const authMethod: Exclude<ClientAuthMethod, 'none'> =
				normalizedAuthMethod && normalizedAuthMethod !== 'none'
					? (normalizedAuthMethod as Exclude<ClientAuthMethod, 'none'>)
					: 'client_secret_basic';

			const headers: Record<string, string> = {};

			// Build request body for backend proxy
			// The backend proxy expects: environment_id, auth_method, body (with grant_type, client_id, etc.), headers (for Basic auth)
			const proxyRequestBody: Record<string, string> = {
				grant_type: 'client_credentials',
				client_id: credentials.clientId,
			};

			// Add scope - REQUIRED for client credentials flow
			// NOTE: Client credentials is for machine-to-machine auth, NOT user auth
			// Scopes are required for client credentials flow
			if (!credentials.scopes || credentials.scopes.trim() === '') {
				console.error(`${MODULE_TAG} No scopes provided - client credentials flow requires scopes`);
				throw new Error(
					'Scopes are required for client credentials flow. Use custom resource server scopes (e.g., api:read, api:write) or Management API scopes (e.g., p1:read:user, p1:read:environments). See https://apidocs.pingidentity.com/pingone/main/v1/api/#access-services-through-scopes-and-roles'
				);
			}

			// Validate scopes for client credentials flow
			// Client credentials flow CANNOT use:
			// 1. User authentication scopes (profile, email, address, phone, offline_access) - these require a user context
			// 2. Self-management scopes (p1:read:user, p1:update:user, etc.) - singular "user" - these are for user self-management only
			//    NOTE: These are typically used with Worker tokens for PingOne Admin operations, not client_credentials
			// Client credentials SHOULD use:
			// - Custom resource server scopes (api:read, api:write, etc.) - for generic M2M scenarios
			// - Management API scopes (p1:read:user, p1:read:environments, etc.) - singular form, but typically used with Worker tokens
			// - "openid" scope - allowed if the user explicitly requests it (some PingOne configurations may support it)
			//
			// KEY DISTINCTION:
			// - p1:read:user (singular) = Management API scope for user operations (typically used with Worker tokens)
			// - Client credentials tokens are for generic M2M scenarios, not PingOne Admin operations
			// - Worker tokens are specifically for PingOne Admin/Management operations
			const scopeList = credentials.scopes.split(/\s+/).filter((s) => s.trim());
			
			// Note: "openid" scope is now allowed - user can include it if their PingOne configuration supports it
			// We no longer automatically remove it
			
			// User authentication scopes (require user context)
			const userAuthScopes = ['offline_access', 'profile', 'email', 'address', 'phone'];
			const foundUserAuthScopes = scopeList.filter((scope) =>
				userAuthScopes.includes(scope.toLowerCase())
			);

			// Self-management scopes (p1:read:user, p1:update:user, etc.) - singular "user"
			// These are for user self-management and cannot be granted on client_credentials flow
			// IMPORTANT: This pattern matches SINGULAR "user" only, not plural "users"
			const selfManagementScopePattern = /^p1:(read|update|delete|create):user$/i;
			const foundSelfManagementScopes = scopeList.filter((scope) =>
				selfManagementScopePattern.test(scope)
			);

			if (foundUserAuthScopes.length > 0) {
				console.warn(
					`${MODULE_TAG} WARNING: User authentication scopes detected for client credentials flow: ${foundUserAuthScopes.join(', ')}. ` +
						`These scopes require a user context and cannot be used with client_credentials flow. ` +
						`Use custom resource server scopes instead (e.g., api:read, api:write). ` +
						`Note: Management API scopes (p1:read:user, etc.) are typically used with Worker tokens for PingOne Admin operations. ` +
						`See https://apidocs.pingidentity.com/pingone/main/v1/api/#access-services-through-scopes-and-roles`
				);
			}

			if (foundSelfManagementScopes.length > 0) {
				console.warn(
					`${MODULE_TAG} WARNING: Management API scopes detected for client credentials flow: ${foundSelfManagementScopes.join(', ')}. ` +
						`Management API scopes (p1:read:user, p1:update:user, etc. - note: singular "user") are typically used with Worker tokens ` +
						`for PingOne Admin/Management operations, not with standard client_credentials tokens. ` +
						`Client credentials tokens are for generic machine-to-machine scenarios with custom APIs. ` +
						`If you need PingOne Admin operations, consider using a Worker token instead. ` +
						`See https://apidocs.pingidentity.com/pingone/main/v1/api/#pingone-self-management-scopes for details.`
				);
			}


			console.log(`${MODULE_TAG} Requesting token with scopes: ${credentials.scopes}`);
			proxyRequestBody.scope = credentials.scopes;

			// Apply client authentication method
			switch (authMethod) {
				case 'client_secret_basic': {
					// HTTP Basic Authentication (RFC 7617) - pass via headers to backend
					const credentials_b64 = btoa(`${credentials.clientId}:${credentials.clientSecret}`);
					headers['Authorization'] = `Basic ${credentials_b64}`;
					console.log(`${MODULE_TAG} Using Basic authentication`);
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
					console.log(`${MODULE_TAG} Using POST body authentication`, {
						clientSecretLength: trimmedSecret.length,
						hasSpecialChars: /[^a-zA-Z0-9._~-]/.test(trimmedSecret),
					});
					break;
				}

				case 'client_secret_jwt': {
					// JWT assertion authentication using client secret (HS256)
					if (!credentials.clientSecret) {
						throw new Error('Client secret is required for client_secret_jwt authentication');
					}
					try {
						const { createClientAssertion } = await import('@/utils/clientAuthentication');
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
						const { createClientAssertion } = await import('@/utils/clientAuthentication');
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

			// Log the complete request body for debugging
			console.log(`${MODULE_TAG} ========== CLIENT CREDENTIALS REQUEST ==========`);
			console.log(`${MODULE_TAG} Request body (what we're sending to backend):`, {
				grant_type: proxyRequestBody.grant_type,
				client_id: proxyRequestBody.client_id,
				scope: proxyRequestBody.scope,
				hasClientSecret: !!proxyRequestBody.client_secret,
				clientSecretLength: proxyRequestBody.client_secret?.length || 0,
				clientSecretFirstChars: proxyRequestBody.client_secret ? `${proxyRequestBody.client_secret.substring(0, 10)}...` : 'none',
				clientSecretLastChars: proxyRequestBody.client_secret ? `...${proxyRequestBody.client_secret.substring(proxyRequestBody.client_secret.length - 10)}` : 'none',
				authMethod,
			});
			
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
				console.log(`${MODULE_TAG} ✅ Verified client_secret is valid string (length: ${proxyRequestBody.client_secret.length})`);
			}
			
			console.log(`${MODULE_TAG} ✅ Verified grant_type: ${proxyRequestBody.grant_type}`);
			console.log(`${MODULE_TAG} Request URL:`, tokenEndpoint);
			console.log(`${MODULE_TAG} Request headers:`, headers);
			console.log(`${MODULE_TAG} ===============================================`);

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
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: tokenEndpoint,
				body: {
					...proxyRequest,
					body: {
						...proxyRequest.body,
						client_secret: proxyRequest.body.client_secret ? '***REDACTED***' : undefined,
					},
				},
				step: 'unified-client-credentials-token',
			});

			const response = await fetch(tokenEndpoint, {
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
				const errorMessage = (errorData.error_description || errorData.error || 'Unknown error') as string;
				const errorCode = (errorData.error || 'unknown_error') as string;

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
						errorMsg += `7. Check "Token Endpoint Authentication Method" - should be "${authMethod}"\n`;
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
					
					// Check for problematic scopes
					const hasUserAuthScopes = scopesList.some(s => 
						['profile', 'email', 'address', 'phone', 'offline_access'].includes(s)
					);
					
					// Check if error indicates scopes are not granted (common issue)
					const isScopeNotGranted =
						errorMessage.toLowerCase().includes('at least one scope must be granted') ||
						errorMessage.toLowerCase().includes('scope must be granted') ||
						errorMessage.toLowerCase().includes('no scope granted') ||
						errorMessage.toLowerCase().includes('not enabled') ||
						errorMessage.toLowerCase().includes('not granted');

					if (isScopeNotGranted) {
						let errorMsg = `Scope Configuration Error: The scope(s) "${scopesList.join(', ')}" are not enabled/granted to your application in PingOne.\n\n`;
						
						// Check for invalid scopes for client credentials
						const invalidScopes = [];
						const openIdScope = scopesList.find(s => s.toLowerCase() === 'openid');
						if (openIdScope) {
							invalidScopes.push(openIdScope);
						}
						
						// Check for self-management scopes (singular "user")
						const selfManagementScopes = scopesList.filter(s => /^p1:(read|update|delete|create):user$/i.test(s));
						if (selfManagementScopes.length > 0) {
							invalidScopes.push(...selfManagementScopes);
						}
						
						// Warn about user authentication scopes
						if (hasUserAuthScopes) {
							const userScopes = scopesList.filter(s => 
								['profile', 'email', 'address', 'phone', 'offline_access'].includes(s)
							);
							invalidScopes.push(...userScopes);
						}
						
						if (invalidScopes.length > 0) {
							errorMsg += `❌ INVALID SCOPES FOR CLIENT CREDENTIALS:\n`;
							errorMsg += `The following scope(s) cannot be used with Client Credentials flow:\n`;
							errorMsg += `- "${invalidScopes.join('", "')}"\n\n`;
							errorMsg += `Client Credentials flow requires custom resource server scopes.\n`;
							errorMsg += `You cannot use:\n`;
							errorMsg += `- "openid" (OIDC scope for user authentication)\n`;
							errorMsg += `- Self-management scopes like "p1:read:user" (singular "user" - these are for user self-service)\n`;
							errorMsg += `- User authentication scopes (profile, email, address, phone, offline_access)\n\n`;
							errorMsg += `✅ You MUST use custom resource server scopes instead.\n`;
							errorMsg += `Examples: custom:scope, CLAIM_IC_FACILITY, or other scopes defined in your resource server.\n\n`;
						}
						
						// Check for Management API scopes (plural "users") - these might be valid if available
						const managementApiScopes = scopesList.filter(s => s.startsWith('p1:') && !/^p1:(read|update|delete|create):user$/i.test(s));
						if (managementApiScopes.length > 0) {
							errorMsg += `📋 For Management API scopes (${managementApiScopes.join(', ')}):\n`;
							errorMsg += `⚠️ NOTE: Management API scopes (p1:*) may not be available in all PingOne environments.\n`;
							errorMsg += `If the "PingOne API" resource is not visible in your Resources tab, use custom resource server scopes instead.\n\n`;
						}
						
						errorMsg += `🔧 How to Fix:\n`;
						errorMsg += `1. Go to PingOne Admin Console: https://admin.pingone.com\n`;
						errorMsg += `2. Navigate to: Applications → Your Application (${credentials.clientId?.substring(0, 8)}...)\n`;
						errorMsg += `3. Click the "Resources" tab\n`;
						errorMsg += `4. Enable a custom resource server (or "PingOne API" if available for Management API scopes)\n`;
						errorMsg += `5. Under "Scopes", check the boxes for your custom scopes\n`;
						errorMsg += `6. Click "Save"\n`;
						errorMsg += `7. Wait a few seconds for changes to propagate, then try the request again\n\n`;
						
						errorMsg += `💡 Important: For Client Credentials flow, you MUST use custom resource server scopes.\n`;
						errorMsg += `- ✅ Valid: Custom resource scopes (custom:scope, CLAIM_IC_FACILITY, or other scopes defined in your resource server)\n`;
						errorMsg += `- ❌ Invalid: "openid" (OIDC scope)\n`;
						errorMsg += `- ❌ Invalid: Self-management scopes like "p1:read:user" (singular "user")\n`;
						errorMsg += `- ❌ Invalid: User authentication scopes (profile, email, address, phone, offline_access)\n\n`;
						
						errorMsg += `📚 Documentation:\n`;
						errorMsg += `- Custom Scopes: https://apidocs.pingidentity.com/pingone/main/v1/api/#custom-scopes\n`;
						errorMsg += `- Roles, Scopes, and Permissions: https://apidocs.pingidentity.com/pingone/main/v1/api/#roles-scopes-and-permissions\n`;
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
