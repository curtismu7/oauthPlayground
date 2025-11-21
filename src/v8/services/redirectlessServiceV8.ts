/**
 * @file redirectlessServiceV8.ts
 * @module v8/services
 * @description Redirectless authentication service for V8 flows using PingOne pi.flow
 * @version 8.0.0
 * @since 2024-11-19
 * 
 * Handles redirectless authentication for:
 * - OAuth Authorization Code Flow
 * - Implicit Flow
 * - Hybrid Flow
 * 
 * Uses PingOne's response_mode=pi.flow for authentication without browser redirects
 * 
 * @example
 * const result = await RedirectlessServiceV8.startFlow({
 *   credentials,
 *   flowType: 'authorization_code',
 *   onAuthCodeReceived: (code) => console.log(code)
 * });
 */

const MODULE_TAG = '[🔄 REDIRECTLESS-V8]';

export interface RedirectlessCredentials {
	environmentId: string;
	clientId: string;
	clientSecret?: string;
	redirectUri?: string;
	scopes: string;
	username?: string;
	password?: string;
}

export interface RedirectlessConfig {
	credentials: RedirectlessCredentials;
	flowType: 'authorization_code' | 'implicit' | 'hybrid';
	flowKey: string;
	codeChallenge?: string;
	codeChallengeMethod?: string;
	responseType?: string;
	onAuthCodeReceived?: (code: string, state: string) => void | Promise<void>;
	onTokensReceived?: (tokens: RedirectlessTokens) => void | Promise<void>;
	onError?: (error: Error) => void;
}

export interface RedirectlessTokens {
	accessToken: string;
	idToken?: string;
	tokenType: string;
	expiresIn?: number;
	scope?: string;
}

export interface RedirectlessFlowResponse {
	flowId: string;
	status: string;
	resumeUrl?: string;
	signOnPage?: string;
	sessionId?: string;
	_sessionId?: string;
	_links?: Record<string, { href?: string }>;
	authorizeResponse?: {
		code?: string;
		state?: string;
		access_token?: string;
		id_token?: string;
		token_type?: string;
		expires_in?: number;
	};
}

/**
 * RedirectlessServiceV8
 * 
 * Handles PingOne redirectless authentication flows using response_mode=pi.flow
 */
export class RedirectlessServiceV8 {
	/**
	 * Start redirectless authorization flow
	 */
	static async startFlow(config: RedirectlessConfig): Promise<RedirectlessFlowResponse> {
		console.log(`${MODULE_TAG} Starting redirectless flow`, {
			flowType: config.flowType,
			flowKey: config.flowKey,
		});

		const { credentials, flowType, codeChallenge, codeChallengeMethod, responseType } = config;

		// Generate state
		const state = `redirectless-${config.flowKey}-${Date.now()}`;
		sessionStorage.setItem(`${config.flowKey}_redirectless_state`, state);

		// Build request body based on flow type
		const requestBody: Record<string, unknown> = {
			environmentId: credentials.environmentId,
			clientId: credentials.clientId,
			scopes: credentials.scopes,
			state,
			responseMode: 'pi.flow', // Critical: enables redirectless mode
		};

		// Add flow-specific parameters
		if (flowType === 'authorization_code') {
			requestBody.responseType = 'code';
			if (codeChallenge) {
				requestBody.codeChallenge = codeChallenge;
				requestBody.codeChallengeMethod = codeChallengeMethod || 'S256';
			}
		} else if (flowType === 'implicit') {
			requestBody.responseType = responseType || 'id_token token';
		} else if (flowType === 'hybrid') {
			requestBody.responseType = responseType || 'code id_token token';
			if (codeChallenge) {
				requestBody.codeChallenge = codeChallenge;
				requestBody.codeChallengeMethod = codeChallengeMethod || 'S256';
			}
		}

		if (credentials.clientSecret) {
			requestBody.clientSecret = credentials.clientSecret;
		}

		if (credentials.redirectUri) {
			requestBody.redirectUri = credentials.redirectUri;
		}

		console.log(`${MODULE_TAG} Request details`, {
			environmentId: credentials.environmentId,
			clientId: `${credentials.clientId.substring(0, 8)}...`,
			responseType: requestBody.responseType,
			responseMode: requestBody.responseMode,
			hasCodeChallenge: !!codeChallenge,
		});

		const response = await fetch('/api/pingone/redirectless/authorize', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include',
			body: JSON.stringify(requestBody),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`${MODULE_TAG} Authorization failed`, {
				status: response.status,
				statusText: response.statusText,
				responseText: errorText,
			});

			let errorBody: { error_description?: string; message?: string; error?: string };
			try {
				errorBody = JSON.parse(errorText) as { error_description?: string; message?: string; error?: string };
			} catch {
				errorBody = { error: 'parse_failed', raw_response: errorText } as { error: string; raw_response: string };
			}

			const errorMessage =
				errorBody?.error_description ||
				errorBody?.message ||
				errorBody?.error ||
				`Authorization failed (status ${response.status})`;
			throw new Error(errorMessage);
		}

		const flowData: RedirectlessFlowResponse = await response.json();
		console.log(`${MODULE_TAG} Authorization response`, {
			flowId: flowData.flowId,
			status: flowData.status,
			hasResumeUrl: !!flowData.resumeUrl,
			hasSessionId: !!(flowData._sessionId || flowData.sessionId),
		});

		// Store flow data for resume
		if (flowData.flowId && flowData.resumeUrl) {
			const sessionId = flowData._sessionId || flowData.sessionId;
			const pendingResumeData = {
				resumeUrl: flowData.resumeUrl,
				flowId: flowData.flowId,
				state,
				sessionId,
				flowType,
			};
			sessionStorage.setItem(
				`${config.flowKey}_redirectless_pending`,
				JSON.stringify(pendingResumeData)
			);
		}

		return flowData;
	}

	/**
	 * Submit username and password for authentication
	 */
	static async submitCredentials(params: {
		flowKey: string;
		environmentId: string;
		flowId: string;
		sessionId?: string;
		username: string;
		password: string;
		clientId?: string;
		clientSecret?: string;
	}): Promise<RedirectlessFlowResponse> {
		console.log(`${MODULE_TAG} Submitting credentials`, {
			flowKey: params.flowKey,
			flowId: params.flowId,
			hasSessionId: !!params.sessionId,
		});

		const flowUrl = `https://auth.pingone.com/${params.environmentId}/flows/${params.flowId}`;
		const payload: Record<string, unknown> = {
			environmentId: params.environmentId,
			flowUrl,
			username: params.username,
			password: params.password,
			sessionId: params.sessionId,
		};

		if (params.clientId) {
			payload.clientId = params.clientId;
		}

		if (params.clientSecret) {
			payload.clientSecret = params.clientSecret;
		}

		const response = await fetch('/api/pingone/flows/check-username-password', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			const errorPayload = await response.json().catch(() => ({}));
			const description =
				errorPayload?.error_description ||
				errorPayload?.message ||
				errorPayload?.error ||
				'PingOne rejected the username/password check.';
			throw new Error(description);
		}

		const result: RedirectlessFlowResponse = await response.json();

		// Update pending resume data with new session info
		if (result.resumeUrl || result._sessionId) {
			const pendingRaw = sessionStorage.getItem(`${params.flowKey}_redirectless_pending`);
			if (pendingRaw) {
				try {
					const pending = JSON.parse(pendingRaw);
					pending.resumeUrl = result.resumeUrl || pending.resumeUrl;
					pending.sessionId = result._sessionId || result.sessionId || pending.sessionId;
					sessionStorage.setItem(
						`${params.flowKey}_redirectless_pending`,
						JSON.stringify(pending)
					);
				} catch (error) {
					console.warn(`${MODULE_TAG} Failed to update pending resume data`, error);
				}
			}
		}

		return result;
	}

	/**
	 * Resume flow to get authorization code or tokens
	 */
	static async resumeFlow(config: RedirectlessConfig): Promise<{
		code?: string;
		tokens?: RedirectlessTokens;
		state: string;
	} | null> {
		console.log(`${MODULE_TAG} Resuming flow`, { flowKey: config.flowKey });

		const pendingRaw = sessionStorage.getItem(`${config.flowKey}_redirectless_pending`);
		if (!pendingRaw) {
			console.warn(`${MODULE_TAG} No pending resume data found`);
			return null;
		}

		let resumeData: {
			resumeUrl: string;
			flowId: string;
			state: string;
			sessionId?: string;
			flowType: string;
		};

		try {
			resumeData = JSON.parse(pendingRaw);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to parse pending resume data`, error);
			sessionStorage.removeItem(`${config.flowKey}_redirectless_pending`);
			return null;
		}

		if (!resumeData.sessionId) {
			console.error(`${MODULE_TAG} Missing sessionId before resume`);
			throw new Error('PingOne session context is missing. Please restart the flow.');
		}

		const requestBody = {
			resumeUrl: resumeData.resumeUrl,
			flowId: resumeData.flowId,
			clientId: config.credentials.clientId,
			clientSecret: config.credentials.clientSecret,
			flowState: resumeData.state,
			sessionId: resumeData.sessionId,
		};

		const response = await fetch('/api/pingone/resume', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include',
			body: JSON.stringify(requestBody),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`${MODULE_TAG} Resume failed`, {
				status: response.status,
				statusText: response.statusText,
				responseText: errorText,
			});

			let errorBody: { error_description?: string; message?: string; error?: string };
			try {
				errorBody = JSON.parse(errorText) as { error_description?: string; message?: string; error?: string };
			} catch {
				errorBody = { error: 'parse_failed', raw_response: errorText } as { error: string; raw_response: string };
			}

			const errorMessage =
				errorBody?.error_description ||
				errorBody?.message ||
				errorBody?.error ||
				`Resume failed (status ${response.status})`;
			throw new Error(errorMessage);
		}

		const resumeResult: RedirectlessFlowResponse = await response.json();
		console.log(`${MODULE_TAG} Resume response`, {
			hasCode: !!resumeResult.authorizeResponse?.code,
			hasAccessToken: !!resumeResult.authorizeResponse?.access_token,
			status: resumeResult.status,
		});

		// Extract code or tokens based on flow type
		const authResponse = resumeResult.authorizeResponse;
		if (!authResponse) {
			return null;
		}

		const result: { code?: string; tokens?: RedirectlessTokens; state: string } = {
			state: resumeData.state,
		};

		// Authorization code (for authorization_code and hybrid flows)
		if (authResponse.code) {
			result.code = authResponse.code;
			sessionStorage.setItem(`${config.flowKey}_redirectless_code`, authResponse.code);

			if (config.onAuthCodeReceived) {
				await config.onAuthCodeReceived(authResponse.code, resumeData.state);
			}
		}

		// Tokens (for implicit and hybrid flows)
		if (authResponse.access_token) {
			result.tokens = {
				accessToken: authResponse.access_token,
				idToken: authResponse.id_token,
				tokenType: authResponse.token_type || 'Bearer',
				expiresIn: authResponse.expires_in,
			};

			sessionStorage.setItem(
				`${config.flowKey}_redirectless_tokens`,
				JSON.stringify(result.tokens)
			);

			if (config.onTokensReceived) {
				await config.onTokensReceived(result.tokens);
			}
		}

		// Clear pending resume
		sessionStorage.removeItem(`${config.flowKey}_redirectless_pending`);

		return result;
	}

	/**
	 * Complete redirectless flow with username/password
	 */
	static async completeFlow(
		config: RedirectlessConfig & { username: string; password: string }
	): Promise<{ code?: string; tokens?: RedirectlessTokens; state: string }> {
		try {
			// Step 1: Start authorization
			const flowResponse = await RedirectlessServiceV8.startFlow(config);
			const flowId = flowResponse.flowId;

			if (!flowId) {
				throw new Error('PingOne did not return a flowId');
			}

			// Step 2: Check if flow completed immediately
			if (flowResponse.status === 'COMPLETED' && flowResponse.authorizeResponse) {
				const authResponse = flowResponse.authorizeResponse;
				const result: { code?: string; tokens?: RedirectlessTokens; state: string } = {
					state: sessionStorage.getItem(`${config.flowKey}_redirectless_state`) || '',
				};

				if (authResponse.code) {
					result.code = authResponse.code;
					if (config.onAuthCodeReceived) {
						await config.onAuthCodeReceived(authResponse.code, result.state);
					}
				}

				if (authResponse.access_token) {
					result.tokens = {
						accessToken: authResponse.access_token,
						idToken: authResponse.id_token,
						tokenType: authResponse.token_type || 'Bearer',
						expiresIn: authResponse.expires_in,
					};
					if (config.onTokensReceived) {
						await config.onTokensReceived(result.tokens);
					}
				}

				return result;
			}

			// Step 3: Submit credentials if required
			if (
				flowResponse.status === 'USERNAME_PASSWORD_REQUIRED' ||
				flowResponse.status === 'LOGIN_REQUIRED'
			) {
				const credentialResponse = await RedirectlessServiceV8.submitCredentials({
					flowKey: config.flowKey,
					environmentId: config.credentials.environmentId,
					flowId,
					sessionId: flowResponse._sessionId || flowResponse.sessionId,
					username: config.username,
					password: config.password,
					clientId: config.credentials.clientId,
					clientSecret: config.credentials.clientSecret,
				});

				// Check if credentials submission completed the flow
				if (credentialResponse.status === 'COMPLETED' && credentialResponse.authorizeResponse) {
					const authResponse = credentialResponse.authorizeResponse;
					const result: { code?: string; tokens?: RedirectlessTokens; state: string } = {
						state: sessionStorage.getItem(`${config.flowKey}_redirectless_state`) || '',
					};

					if (authResponse.code) {
						result.code = authResponse.code;
						if (config.onAuthCodeReceived) {
							await config.onAuthCodeReceived(authResponse.code, result.state);
						}
					}

					if (authResponse.access_token) {
						result.tokens = {
							accessToken: authResponse.access_token,
							idToken: authResponse.id_token,
							tokenType: authResponse.token_type || 'Bearer',
							expiresIn: authResponse.expires_in,
						};
						if (config.onTokensReceived) {
							await config.onTokensReceived(result.tokens);
						}
					}

					return result;
				}
			}

			// Step 4: Resume flow to get code/tokens
			const resumeResult = await RedirectlessServiceV8.resumeFlow(config);
			if (!resumeResult) {
				throw new Error('Failed to resume flow and retrieve authorization code/tokens');
			}

			return resumeResult;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			console.error(`${MODULE_TAG} Flow failed`, errorMessage);

			if (config.onError) {
				config.onError(error instanceof Error ? error : new Error(errorMessage));
			}

			throw error;
		}
	}

	/**
	 * Get stored authorization code
	 */
	static getStoredCode(flowKey: string): { code: string; state: string } | null {
		const code = sessionStorage.getItem(`${flowKey}_redirectless_code`);
		const state = sessionStorage.getItem(`${flowKey}_redirectless_state`);

		if (code) {
			return { code, state: state || '' };
		}

		return null;
	}

	/**
	 * Get stored tokens
	 */
	static getStoredTokens(flowKey: string): RedirectlessTokens | null {
		const tokensRaw = sessionStorage.getItem(`${flowKey}_redirectless_tokens`);
		if (tokensRaw) {
			try {
				return JSON.parse(tokensRaw);
			} catch {
				return null;
			}
		}
		return null;
	}

	/**
	 * Clear all redirectless flow data
	 */
	static clearFlowData(flowKey: string): void {
		sessionStorage.removeItem(`${flowKey}_redirectless_pending`);
		sessionStorage.removeItem(`${flowKey}_redirectless_code`);
		sessionStorage.removeItem(`${flowKey}_redirectless_tokens`);
		sessionStorage.removeItem(`${flowKey}_redirectless_state`);
	}
}
