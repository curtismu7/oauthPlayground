/**
 * @file deviceCodeIntegrationServiceV8.ts
 * @module v8/services
 * @description Real OAuth Device Authorization Flow integration with PingOne APIs (RFC 8628)
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Handles:
 * - Device authorization request
 * - Device code and user code generation
 * - Token polling with device code
 * - Token validation and decoding
 *
 * @example
 * const deviceAuth = await DeviceCodeIntegrationServiceV8.requestDeviceAuthorization(credentials);
 * const tokens = await DeviceCodeIntegrationServiceV8.pollForTokens(credentials, deviceAuth.device_code);
 */

const MODULE_TAG = '[📱 DEVICE-CODE-V8]';

export interface DeviceCodeCredentials {
	environmentId: string;
	clientId: string;
	clientSecret?: string;
	clientAuthMethod?: 'client_secret_basic' | 'client_secret_post' | 'none';
	scopes?: string;
}

export interface DeviceAuthorizationResponse {
	device_code: string;
	user_code: string;
	verification_uri: string;
	verification_uri_complete?: string;
	expires_in: number;
	interval?: number; // Polling interval in seconds
}

export interface TokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token?: string;
	id_token?: string;
	scope?: string;
}

export interface DecodedToken {
	header: Record<string, unknown>;
	payload: Record<string, unknown>;
	signature: string;
}

/**
 * DeviceCodeIntegrationServiceV8
 *
 * Real OAuth 2.0 Device Authorization Flow integration with PingOne APIs (RFC 8628)
 */
export class DeviceCodeIntegrationServiceV8 {
	/**
	 * Request device authorization
	 * @param credentials - OAuth credentials
	 * @returns Device authorization response with device code and user code
	 */
	static async requestDeviceAuthorization(
		credentials: DeviceCodeCredentials
	): Promise<DeviceAuthorizationResponse> {
		console.log(`${MODULE_TAG} Requesting device authorization`, {
			environmentId: credentials.environmentId,
			clientId: credentials.clientId,
			authMethod:
				credentials.clientAuthMethod || (credentials.clientSecret ? 'client_secret_basic' : 'none'),
		});

		try {
			// Use backend proxy to avoid CORS issues
			// Use relative URL in development to go through Vite proxy (avoids SSL errors)
			const deviceAuthEndpoint =
				process.env.NODE_ENV === 'production'
					? 'https://oauth-playground.vercel.app/api/device-authorization'
					: '/api/device-authorization';

			// Validate and handle scopes for Device Authorization Flow
			const finalScopes = credentials.scopes?.trim() || '';

			if (finalScopes) {
				const scopeList = finalScopes.split(/\s+/).filter((s) => s.trim());

				// Warn if Management API scopes are detected (these are for machine-to-machine, not user auth)
				const managementApiScopes = scopeList.filter(
					(scope) =>
						scope.toLowerCase().startsWith('p1:read:') ||
						scope.toLowerCase().startsWith('p1:update:') ||
						scope.toLowerCase().startsWith('p1:create:') ||
						scope.toLowerCase().startsWith('p1:delete:')
				);

				if (managementApiScopes.length > 0) {
					console.warn(
						`${MODULE_TAG} WARNING: Management API scopes detected: ${managementApiScopes.join(', ')}. ` +
							`Device Authorization Flow is for user authentication, not machine-to-machine. ` +
							`Management API scopes (p1:read:*, p1:update:*, etc.) are intended for Client Credentials flow. ` +
							`For Device Flow, use OIDC scopes like 'openid', 'profile', 'email', 'offline_access'. ` +
							`See https://apidocs.pingidentity.com/pingone/main/v1/api/`
					);
				}

				// Warn if 'openid' is missing (Device Flow is typically used for user authentication with OIDC)
				if (!scopeList.some((scope) => scope.toLowerCase() === 'openid')) {
					console.warn(
						`${MODULE_TAG} WARNING: 'openid' scope is missing. ` +
							`Device Authorization Flow is typically used for user authentication with OIDC. ` +
							`Without 'openid', you won't receive an ID token. ` +
							`Consider adding 'openid' to your scopes (e.g., 'openid profile email').`
					);
				}

				// Log scopes being requested
				console.log(`${MODULE_TAG} Requesting device authorization with scopes: ${finalScopes}`);
			} else {
				// Suggest default scopes if none provided
				console.warn(
					`${MODULE_TAG} No scopes provided. ` +
						`For Device Authorization Flow with user authentication, consider using: 'openid profile email offline_access'. ` +
						`These scopes allow the device to authenticate users and access their profile information.`
				);
			}

			// Build request body for backend proxy
			const requestBody: Record<string, string> = {
				environment_id: credentials.environmentId,
				client_id: credentials.clientId,
			};

			// Handle Client Authentication - pass to backend proxy
			// Always send client_auth_method if client_secret is provided, or if explicitly set to 'none'
			if (credentials.clientSecret) {
				requestBody.client_secret = credentials.clientSecret;
				requestBody.client_auth_method = credentials.clientAuthMethod || 'client_secret_basic';
				console.log(`${MODULE_TAG} Including client authentication`, {
					authMethod: requestBody.client_auth_method,
					hasSecret: !!requestBody.client_secret,
					secretLength: requestBody.client_secret?.length || 0,
				});
			} else if (credentials.clientAuthMethod === 'none') {
				// Explicitly set to 'none' for public clients
				requestBody.client_auth_method = 'none';
				console.log(`${MODULE_TAG} Public client (no authentication)`);
			} else {
				// No client secret and no explicit 'none' - this might cause 403 if app requires auth
				console.warn(`${MODULE_TAG} No client secret provided and auth method not set to 'none'`, {
					clientAuthMethod: credentials.clientAuthMethod,
					note: 'This may cause 403 Forbidden if your PingOne application requires client authentication',
				});
			}

			// Add scope if provided
			if (finalScopes) {
				requestBody.scope = finalScopes;
			}

			// Log the complete request being sent (without exposing full secret)
			console.log(`${MODULE_TAG} 📤 Request being sent to backend:`, {
				endpoint: deviceAuthEndpoint,
				environment_id: requestBody.environment_id,
				client_id: requestBody.client_id?.substring(0, 8) + '...',
				client_auth_method: requestBody.client_auth_method,
				has_client_secret: !!requestBody.client_secret,
				client_secret_length: requestBody.client_secret?.length || 0,
				client_secret_preview: requestBody.client_secret
					? `${requestBody.client_secret.substring(0, 4)}...${requestBody.client_secret.substring(requestBody.client_secret.length - 4)}`
					: 'none',
				scope: requestBody.scope || 'none',
				fullRequestBody: {
					...requestBody,
					client_secret: requestBody.client_secret
						? `${requestBody.client_secret.substring(0, 4)}...${requestBody.client_secret.substring(requestBody.client_secret.length - 4)}`
						: undefined,
				},
			});

			// Track API call for display
			const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: deviceAuthEndpoint,
				body: requestBody,
				step: 'unified-device-authorization',
			});

			const response = await fetch(deviceAuthEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			// Parse response once (clone first to avoid consuming the body)
			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			// Update API call with response
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
				// Use already parsed responseData instead of parsing again
				const errorData = responseData as Record<string, unknown>;
				const errorMessage = (errorData.error_description || errorData.error || 'Unknown error') as string;
				const errorCode = (errorData.error || 'unknown_error') as string;

				// Extract correlation ID from error data or error message
				let correlationId = errorData.correlation_id || errorData.correlationId;
				if (!correlationId && typeof errorMessage === 'string') {
					const correlationMatch = errorMessage.match(/\(Correlation ID:\s*([^)]+)\)/i);
					if (correlationMatch) {
						correlationId = correlationMatch[1].trim();
					}
				}

				// Check if error indicates missing grant type
				const isMissingGrantType =
					errorMessage.toLowerCase().includes('missing required grant type') ||
					(errorMessage.toLowerCase().includes('grant type') &&
						errorMessage.toLowerCase().includes('device_code'));

				// Check for 403 Forbidden - often means missing client authentication or grant type
				if (response.status === 403) {
					const hasClientSecret = !!credentials.clientSecret;
					const authMethod = credentials.clientAuthMethod || (hasClientSecret ? 'client_secret_basic' : 'none');
					
					console.error(`${MODULE_TAG} 403 Forbidden - Possible causes:`, {
						errorCode,
						errorMessage,
						correlationId,
						clientId: credentials.clientId?.substring(0, 8) + '...',
						hasClientSecret,
						authMethod,
						possibleCauses: [
							!hasClientSecret && authMethod !== 'none' ? 'Missing client secret (app may require authentication)' : null,
							'Device Code grant type not enabled in PingOne application',
							'Invalid client credentials',
							'Application configuration mismatch',
						].filter(Boolean),
					});

					let helpfulMessage = `403 Forbidden: ${errorMessage}\n\n`;
					
					if (!hasClientSecret && authMethod !== 'none') {
						helpfulMessage += `🔐 Client Authentication Issue:\n`;
						helpfulMessage += `Your PingOne application appears to require client authentication, but no client secret was provided.\n\n`;
						helpfulMessage += `🔧 How to Fix:\n`;
						helpfulMessage += `1. Check if your application requires client authentication\n`;
						helpfulMessage += `2. If yes, enter your Client Secret in the configuration section above\n`;
						helpfulMessage += `3. If your application is a public client, set Client Auth Method to "None"\n\n`;
					}
					
					helpfulMessage += `📋 Grant Type Configuration:\n`;
					helpfulMessage += `1. Go to PingOne Admin Console: https://admin.pingone.com\n`;
					helpfulMessage += `2. Navigate to: Applications → Your Application (${credentials.clientId?.substring(0, 8)}...)\n`;
					helpfulMessage += `3. Click the "Configuration" tab\n`;
					helpfulMessage += `4. Under "Grant Types", ensure "Device Code" (or "DEVICE_CODE") is checked\n`;
					helpfulMessage += `5. Under "Token Endpoint Authentication Method", verify it matches your selection\n`;
					helpfulMessage += `6. Click "Save"\n`;
					helpfulMessage += `7. Try the request again\n\n`;
					helpfulMessage += `📚 Documentation: https://apidocs.pingidentity.com/pingone/main/v1/api/\n`;
					helpfulMessage += `🔍 Correlation ID: ${correlationId || 'N/A'}`;

					throw new Error(helpfulMessage);
				}

				if (errorCode === 'unauthorized_client' && isMissingGrantType) {
					console.error(`${MODULE_TAG} Missing grant type error`, {
						errorCode,
						errorMessage,
						correlationId,
						clientId: credentials.clientId,
					});
					throw new Error(
						`Grant Type Configuration Error: Your PingOne application is missing the DEVICE_CODE grant type.\n\n` +
							`🔧 How to Fix:\n` +
							`1. Go to PingOne Admin Console: https://admin.pingone.com\n` +
							`2. Navigate to: Applications → Your Application (${credentials.clientId?.substring(0, 8)}...)\n` +
							`3. Click the "Configuration" tab\n` +
							`4. Under "Grant Types", check the box for "Device Code" (or "DEVICE_CODE")\n` +
							`5. Click "Save"\n` +
							`6. Try the request again\n\n` +
							`📚 Documentation: https://apidocs.pingidentity.com/pingone/main/v1/api/\n` +
							`🔍 Correlation ID: ${correlationId || 'N/A'}`
					);
				}

				console.error(`${MODULE_TAG} Device authorization failed`, {
					status: response.status,
					statusText: response.statusText,
					errorCode,
					errorMessage,
					correlationId,
				});

				throw new Error(
					`Device authorization failed: ${errorCode} - ${errorMessage}${correlationId ? ` (Correlation ID: ${correlationId})` : ''}`
				);
			}

			const deviceAuth: DeviceAuthorizationResponse = await response.json();

			console.log(`${MODULE_TAG} Device authorization received successfully`, {
				hasDeviceCode: !!deviceAuth.device_code,
				hasUserCode: !!deviceAuth.user_code,
				verificationUri: deviceAuth.verification_uri,
				expiresIn: deviceAuth.expires_in,
				interval: deviceAuth.interval,
			});

			return deviceAuth;
		} catch (error) {
			console.error(`${MODULE_TAG} Error requesting device authorization`, { error });
			throw error;
		}
	}

	/**
	 * Poll token endpoint with device code
	 * @param credentials - OAuth credentials
	 * @param deviceCode - Device code from authorization response
	 * @param interval - Polling interval in seconds (default: 5)
	 * @param maxAttempts - Maximum polling attempts (default: 60)
	 * @returns Token response
	 */
	static async pollForTokens(
		credentials: DeviceCodeCredentials,
		deviceCode: string,
		interval: number = 5,
		maxAttempts: number = 60
	): Promise<TokenResponse> {
		console.log(`${MODULE_TAG} Polling for tokens`, {
			environmentId: credentials.environmentId,
			clientId: credentials.clientId,
			interval,
			maxAttempts,
		});

		// Use backend proxy to avoid CORS issues
			// Use relative URL for development (same origin), absolute for production
			const tokenEndpoint =
				process.env.NODE_ENV === 'production'
					? 'https://oauth-playground.vercel.app/api/token-exchange'
					: '/api/token-exchange';

		// Track API call for display
		const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');

		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			try {
				// Build request body for backend proxy (JSON format)
				const requestBody: Record<string, string> = {
					grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
					client_id: credentials.clientId,
					device_code: deviceCode,
					environment_id: credentials.environmentId,
				};

				// Handle Client Authentication - pass to backend proxy
				if (credentials.clientSecret) {
					requestBody.client_secret = credentials.clientSecret;
					requestBody.client_auth_method = credentials.clientAuthMethod || 'client_secret_basic';
				}

				// Track API call for display
				const pollStartTime = Date.now();
				const pollCallId = apiCallTrackerService.trackApiCall({
					method: 'POST',
					url: tokenEndpoint,
					body: {
						...requestBody,
						device_code: '***REDACTED***', // Don't expose device code in display
					},
					step: 'unified-device-token-poll',
				});

				const response = await fetch(tokenEndpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
				});

				// Update API call with response
				const responseClone = response.clone();
				let pollResponseData: unknown;
				try {
					pollResponseData = await responseClone.json();
				} catch {
					pollResponseData = { error: 'Failed to parse response' };
				}

				apiCallTrackerService.updateApiCallResponse(
					pollCallId,
					{
						status: response.status,
						statusText: response.statusText,
						data: pollResponseData,
					},
					Date.now() - pollStartTime
				);

				if (response.ok) {
					const tokens: TokenResponse = await response.json();

					console.log(`${MODULE_TAG} Tokens received successfully`, {
						hasAccessToken: !!tokens.access_token,
						hasIdToken: !!tokens.id_token,
						hasRefreshToken: !!tokens.refresh_token,
						expiresIn: tokens.expires_in,
					});

					return tokens;
				}

				const errorData = await response.json();

				// Check for authorization_pending (user hasn't approved yet)
				if (errorData.error === 'authorization_pending') {
					console.log(`${MODULE_TAG} Authorization pending, waiting ${interval}s before retry`, {
						attempt: attempt + 1,
						maxAttempts,
					});
					await DeviceCodeIntegrationServiceV8.sleep(interval * 1000); // Convert to milliseconds
					continue;
				}

				// Check for slow_down (rate limiting)
				if (errorData.error === 'slow_down' && errorData.interval) {
					const newInterval = errorData.interval;
					console.log(`${MODULE_TAG} Rate limited, adjusting interval to ${newInterval}s`, {
						attempt: attempt + 1,
						maxAttempts,
					});
					await DeviceCodeIntegrationServiceV8.sleep(newInterval * 1000);
					continue;
				}

				// Other errors (expired_token, access_denied, etc.)
				throw new Error(
					`Token polling failed: ${errorData.error} - ${errorData.error_description || ''}`
				);
			} catch (error) {
				// If it's our own error (from the throw above), re-throw it
				if (error instanceof Error && error.message.includes('Token polling failed')) {
					throw error;
				}

				// Network or other errors - log and retry
				console.warn(`${MODULE_TAG} Polling error (attempt ${attempt + 1}/${maxAttempts})`, {
					error,
				});

				// On last attempt, throw the error
				if (attempt === maxAttempts - 1) {
					throw error;
				}

				await DeviceCodeIntegrationServiceV8.sleep(interval * 1000);
			}
		}

		throw new Error('Token polling timeout - user did not authorize within time limit');
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

			const header = JSON.parse(DeviceCodeIntegrationServiceV8.base64UrlDecode(parts[0]));
			const payload = JSON.parse(DeviceCodeIntegrationServiceV8.base64UrlDecode(parts[1]));
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
			const decoded = DeviceCodeIntegrationServiceV8.decodeToken(token);
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
			const decoded = DeviceCodeIntegrationServiceV8.decodeToken(token);
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
	 * Sleep utility for polling
	 * @param ms - Milliseconds to sleep
	 */
	private static sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
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

export default DeviceCodeIntegrationServiceV8;
