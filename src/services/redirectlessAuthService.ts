// src/services/redirectlessAuthService.ts
// Reusable service for PingOne redirectless authentication flows (response_mode=pi.flow)
// Based on working implementations in PingOneAuthentication.tsx and RedirectlessFlowV7_Real.tsx

import { v4ToastManager } from '../utils/v4ToastManager';

export interface RedirectlessAuthCredentials {
	environmentId: string;
	clientId: string;
	clientSecret?: string;
	redirectUri?: string;
	scopes: string | string[];
	username?: string;
	password?: string;
}

export interface RedirectlessAuthConfig {
	credentials: RedirectlessAuthCredentials;
	flowKey?: string; // Optional flow key for sessionStorage isolation
	onAuthCodeReceived?: (code: string, state: string) => void | Promise<void>;
	onError?: (error: Error) => void;
	onSignOnPageRequired?: (signOnPageUrl: string) => void | Promise<void>;
}

export interface RedirectlessFlowResponse {
	flowId: string;
	status: string;
	resumeUrl?: string;
	signOnPage?: string;
	sessionId?: string;
	_links?: Record<string, { href?: string }>;
	authorizeResponse?: {
		code?: string;
		state?: string;
	};
}

export interface ResumeFlowResponse {
	code?: string;
	authorizeResponse?: {
		code?: string;
		state?: string;
	};
	status?: string;
	redirect?: boolean;
	location?: string;
}

/**
 * Service for handling PingOne redirectless authentication flows
 * Handles the complete flow: authorize -> authenticate -> resume -> extract code
 */
export class RedirectlessAuthService {
	private static readonly DEFAULT_STORAGE_PREFIX = 'redirectless_flow';
	private static readonly CREDENTIAL_REQUIRED_STATUSES = new Set([
		'USERNAME_PASSWORD_REQUIRED',
		'LOGIN_REQUIRED',
		'PASSWORD_REQUIRED',
	]);
	private static readonly MFA_REQUIRED_STATUSES = new Set([
		'MFA_REQUIRED',
		'MFA_ENROLLMENT_REQUIRED',
		'DEVICE_VERIFICATION_REQUIRED',
	]);

	private static getStoragePrefix(flowKey?: string): string {
		return flowKey || RedirectlessAuthService.DEFAULT_STORAGE_PREFIX;
	}

	private static updatePendingResume(
		flowKey: string | undefined,
		updates: Partial<{
			resumeUrl: string;
			sessionId: string;
			state: string;
			flowId: string;
		}>
	): void {
		const storagePrefix = RedirectlessAuthService.getStoragePrefix(flowKey);
		const raw = sessionStorage.getItem(`${storagePrefix}_pending_resume`);
		if (!raw) {
			return;
		}

		try {
			const parsed = JSON.parse(raw) as Record<string, unknown>;
			const next = {
				...parsed,
				...(updates.resumeUrl ? { resumeUrl: updates.resumeUrl } : {}),
				...(updates.sessionId ? { sessionId: updates.sessionId } : {}),
				...(updates.state ? { state: updates.state } : {}),
				...(updates.flowId ? { flowId: updates.flowId } : {}),
			};
			sessionStorage.setItem(`${storagePrefix}_pending_resume`, JSON.stringify(next));
		} catch (error) {
			console.warn('[RedirectlessAuthService] Failed to update pending resume data', error);
		}
	}

	private static requiresCredentialSubmission(status?: string | null): boolean {
		if (!status) {
			return false;
		}
		return RedirectlessAuthService.CREDENTIAL_REQUIRED_STATUSES.has(status.toUpperCase());
	}

	private static indicatesMfa(status?: string | null): boolean {
		if (!status) {
			return false;
		}
		return RedirectlessAuthService.MFA_REQUIRED_STATUSES.has(status.toUpperCase());
	}

	/**
	 * Start a redirectless authorization flow
	 */
	static async startAuthorization(
		config: RedirectlessAuthConfig
	): Promise<RedirectlessFlowResponse> {
		const { credentials, flowKey } = config;
		const storagePrefix = flowKey || RedirectlessAuthService.DEFAULT_STORAGE_PREFIX;

		// Generate PKCE codes
		const { generateCodeVerifier, generateCodeChallenge } = await import('../utils/oauth');
		const codeVerifier = generateCodeVerifier();
		const codeChallenge = await generateCodeChallenge(codeVerifier);

		// Store PKCE codes using credentialStorageManager (persists across redirects)
		const { credentialStorageManager } = await import('./credentialStorageManager');
		credentialStorageManager.savePKCECodes(flowKey || 'redirectless-default', {
			codeVerifier,
			codeChallenge,
			codeChallengeMethod: 'S256',
		});

		const state = `${storagePrefix}-${Date.now()}`;
		sessionStorage.setItem('oauth_state', state);
		if (flowKey) {
			sessionStorage.setItem(`${flowKey}_state`, state);
		}

		// Step 1: POST /api/pingone/redirectless/authorize
		const scopes = Array.isArray(credentials.scopes)
			? credentials.scopes.join(' ')
			: credentials.scopes || 'openid';

		const requestBody: Record<string, unknown> = {
			environmentId: credentials.environmentId,
			clientId: credentials.clientId,
			scopes,
			codeChallenge: codeChallenge,
			codeChallengeMethod: 'S256',
			state: state,
		};

		if (credentials.clientSecret) {
			requestBody.clientSecret = credentials.clientSecret;
		}

		if (credentials.redirectUri) {
			requestBody.redirectUri = credentials.redirectUri;
		}

		console.log(
			`[RedirectlessAuthService] Starting authorization flow for ${flowKey || 'default'}`
		);
		console.log(`[RedirectlessAuthService] 🐛 DEBUG - Request details:`, {
			environmentId: credentials.environmentId,
			clientId: credentials.clientId ? `${credentials.clientId.substring(0, 8)}...` : 'MISSING',
			hasClientSecret: !!credentials.clientSecret,
			redirectUri: credentials.redirectUri,
			scopes,
			codeChallenge: `${codeChallenge.substring(0, 20)}...`,
			state: state,
		});

		const response = await fetch('/api/pingone/redirectless/authorize', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include',
			body: JSON.stringify(requestBody),
		});

		console.log(`[RedirectlessAuthService] 🐛 DEBUG - Authorization response:`, {
			status: response.status,
			statusText: response.statusText,
			ok: response.ok,
			headers: Object.fromEntries(response.headers.entries()),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`[RedirectlessAuthService] 🐛 DEBUG - Authorization failed:`, {
				status: response.status,
				statusText: response.statusText,
				responseText: errorText,
				responseHeaders: Object.fromEntries(response.headers.entries()),
			});

			let errorBody;
			try {
				errorBody = JSON.parse(errorText);
			} catch {
				errorBody = { error: 'parse_failed', raw_response: errorText };
			}
			const errorMessage =
				errorBody?.error_description ||
				errorBody?.message ||
				errorBody?.error ||
				`Authorization failed (status ${response.status})`;
			throw new Error(errorMessage);
		}

		const flowData: RedirectlessFlowResponse = await response.json();
		console.log(`[RedirectlessAuthService] Authorization response:`, {
			flowId: flowData.flowId,
			status: flowData.status,
			hasResumeUrl: !!flowData.resumeUrl,
			hasSessionId:
				!!(flowData as unknown as { _sessionId?: string })._sessionId || !!flowData.sessionId,
		});

		// Store flow data for resume
		if (flowData.flowId && flowData.resumeUrl) {
			// Server returns _sessionId (with underscore) - extract it from response
			const sessionId =
				(flowData as unknown as { _sessionId?: string })._sessionId || flowData.sessionId;
			console.log(
				`[RedirectlessAuthService] Storing resume data with sessionId:`,
				sessionId ? `${sessionId.substring(0, 8)}...` : 'MISSING'
			);

			const pendingResumeData = {
				resumeUrl: flowData.resumeUrl,
				flowId: flowData.flowId,
				state: state,
				codeVerifier: codeVerifier,
				sessionId: sessionId,
			};
			sessionStorage.setItem(`${storagePrefix}_pending_resume`, JSON.stringify(pendingResumeData));
		} else {
			console.warn(
				`[RedirectlessAuthService] Missing flowId or resumeUrl - cannot store resume data`
			);
		}

		return flowData;
	}

	private static async submitCredentials(params: {
		flowKey?: string;
		environmentId: string;
		flowId: string;
		sessionId?: string;
		username: string;
		password: string;
		clientId?: string;
		clientSecret?: string;
	}): Promise<Record<string, any>> {
		const {
			flowKey,
			environmentId,
			flowId,
			sessionId,
			username,
			password,
			clientId,
			clientSecret,
		} = params;

		const flowUrl = `https://auth.pingone.com/${environmentId}/flows/${flowId}`;
		const payload: Record<string, unknown> = {
			environmentId,
			flowUrl,
			username,
			password,
			sessionId,
		};

		if (clientId) {
			payload.clientId = clientId;
		}

		if (clientSecret) {
			payload.clientSecret = clientSecret;
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

		const result = (await response.json()) as Record<string, any>;

		if (result.resumeUrl || result._sessionId) {
			RedirectlessAuthService.updatePendingResume(flowKey, {
				resumeUrl: result.resumeUrl,
				sessionId: result._sessionId,
			});
		}

		return result;
	}

	/**
	 * Handle USERNAME_PASSWORD_REQUIRED status by redirecting to sign-on page
	 */
	static async handleSignOnPageRequired(
		flowResponse: RedirectlessFlowResponse,
		config: RedirectlessAuthConfig
	): Promise<void> {
		const { flowKey } = config;
		const _storagePrefix = flowKey || RedirectlessAuthService.DEFAULT_STORAGE_PREFIX;

		// Extract sign-on page URL from _links
		const signOnPageUrl =
			flowResponse.signOnPage ||
			flowResponse._links?.signOnPage?.href ||
			flowResponse._links?.['signOnPage']?.href;

		if (!signOnPageUrl) {
			throw new Error(
				'Authentication required but no sign-on page URL provided. Please authenticate with PingOne first.'
			);
		}

		console.log(`[RedirectlessAuthService] Redirecting to sign-on page:`, signOnPageUrl);
		console.log(`[RedirectlessAuthService] Flow details:`, {
			flowId: flowResponse.flowId,
			status: flowResponse.status,
			hasSessionId:
				!!(flowResponse as unknown as { _sessionId?: string })._sessionId ||
				!!flowResponse.sessionId,
			signOnPageUrl,
		});

		// CRITICAL: Redirect immediately to prevent flow expiration
		// PingOne flows expire after ~15 minutes, so we need to redirect ASAP
		console.log(
			`[RedirectlessAuthService] ⚠️ IMPORTANT: Redirecting immediately to prevent flow expiration`
		);

		// Call optional callback
		if (config.onSignOnPageRequired) {
			await config.onSignOnPageRequired(signOnPageUrl);
		} else {
			// Default: redirect to sign-on page
			window.location.href = signOnPageUrl;
		}
	}

	/**
	 * Resume flow after authentication to get authorization code
	 */
	static async resumeFlow(config: RedirectlessAuthConfig): Promise<string | null> {
		const { credentials, flowKey } = config;
		const storagePrefix = flowKey || RedirectlessAuthService.DEFAULT_STORAGE_PREFIX;

		// Get pending resume data
		const pendingResumeRaw = sessionStorage.getItem(`${storagePrefix}_pending_resume`);
		if (!pendingResumeRaw) {
			console.warn(`[RedirectlessAuthService] No pending resume data found for ${storagePrefix}`);
			return null;
		}

		let resumeData: {
			resumeUrl: string;
			flowId: string;
			state: string;
			codeVerifier: string;
			sessionId?: string;
		};

		try {
			resumeData = JSON.parse(pendingResumeRaw);
		} catch (error) {
			console.error(`[RedirectlessAuthService] Failed to parse pending resume data:`, error);
			sessionStorage.removeItem(`${storagePrefix}_pending_resume`);
			return null;
		}

		console.log(`[RedirectlessAuthService] Resuming flow:`, {
			flowId: resumeData.flowId,
			hasResumeUrl: !!resumeData.resumeUrl,
			hasSessionId: !!resumeData.sessionId,
			sessionIdPreview: resumeData.sessionId
				? `${resumeData.sessionId.substring(0, 8)}...`
				: 'MISSING',
		});

		// CRITICAL: Validate sessionId exists before resume (matches PingOneAuthentication pattern)
		if (!resumeData.sessionId) {
			console.error(`[RedirectlessAuthService] ❌ Missing sessionId before resume step. Aborting.`);
			console.error(
				`[RedirectlessAuthService] Backend must manage PingOne cookies server-side and return _sessionId.`
			);
			throw new Error('PingOne session context is missing. Please restart the redirectless flow.');
		}

		const requestBody = {
			resumeUrl: resumeData.resumeUrl,
			flowId: resumeData.flowId,
			clientId: credentials.clientId,
			clientSecret: credentials.clientSecret,
			codeVerifier: resumeData.codeVerifier,
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

		console.log(`[RedirectlessAuthService] 🐛 DEBUG - Resume response:`, {
			status: response.status,
			statusText: response.statusText,
			ok: response.ok,
			headers: Object.fromEntries(response.headers.entries()),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`[RedirectlessAuthService] 🐛 DEBUG - Resume failed:`, {
				status: response.status,
				statusText: response.statusText,
				responseText: errorText,
				responseHeaders: Object.fromEntries(response.headers.entries()),
				resumeUrl: requestBody.resumeUrl,
				hasSessionId: !!requestBody.sessionId,
				sessionIdPreview: requestBody.sessionId
					? `${requestBody.sessionId.substring(0, 8)}...`
					: 'MISSING',
			});

			let errorBody;
			try {
				errorBody = JSON.parse(errorText);
			} catch {
				errorBody = { error: 'parse_failed', raw_response: errorText };
			}

			// Extract error details from PingOne response
			const errorCode = errorBody?.error_code || errorBody?.error || 'UNKNOWN_ERROR';
			const errorDescription =
				errorBody?.error_description ||
				errorBody?.message ||
				errorBody?.error ||
				`Resume failed (status ${response.status})`;
			const pingoneError = errorBody?.pingone_error || errorBody?.details;

			// Check if this is a flow expiration/timeout error
			const isFlowExpired =
				errorCode === 'NOT_FOUND' ||
				errorDescription?.includes('does not exist') ||
				errorDescription?.includes('timeout') ||
				errorDescription?.includes('expired') ||
				pingoneError?.details?.some(
					(d: { message?: string }) =>
						d?.message?.includes('does not exist') || d?.message?.includes('timeout')
				);

			if (isFlowExpired) {
				const friendlyMessage = `The authentication flow expired. Flows expire after ~15 minutes. Please start a new flow by clicking "Start Login" again.`;
				throw new Error(friendlyMessage);
			}

			// For other errors, use the error description from PingOne
			throw new Error(errorDescription);
		}

		const resumeResult: ResumeFlowResponse = await response.json();
		console.log(`[RedirectlessAuthService] Resume response:`, {
			hasCode: !!resumeResult.code || !!resumeResult.authorizeResponse?.code,
			status: resumeResult.status,
		});

		// Extract authorization code from various response formats
		const authCode =
			resumeResult.code ||
			resumeResult.authorizeResponse?.code ||
			(resumeResult as unknown as { authorizeResponse?: { code?: string } })?.authorizeResponse
				?.code ||
			null;

		if (authCode) {
			// Store code and state
			sessionStorage.setItem(`${storagePrefix}_auth_code`, authCode);
			sessionStorage.setItem(`${storagePrefix}_state`, resumeData.state);

			// Clear pending resume
			sessionStorage.removeItem(`${storagePrefix}_pending_resume`);

			// Call optional callback
			if (config.onAuthCodeReceived) {
				await config.onAuthCodeReceived(authCode, resumeData.state);
			}

			return authCode;
		}

		return null;
	}

	/**
	 * Extract authorization code from JSON response on page (when PingOne returns JSON directly)
	 */
	static extractCodeFromPageJson(flowKey?: string): { code: string; state: string } | null {
		const storagePrefix = flowKey || RedirectlessAuthService.DEFAULT_STORAGE_PREFIX;

		try {
			console.log(`[RedirectlessAuthService] 🔍 Checking page for completed flow JSON...`);
			console.log(`[RedirectlessAuthService] 🔍 Current URL:`, window.location.href);
			console.log(`[RedirectlessAuthService] 🔍 Page hostname:`, window.location.hostname);

			// Check if page content contains JSON
			const pageText = document.body?.textContent || document.documentElement?.textContent || '';
			console.log(`[RedirectlessAuthService] 🔍 Page content preview:`, pageText.substring(0, 200));

			if (!pageText.trim()) {
				console.log(`[RedirectlessAuthService] 🔍 No page content found`);
				return null;
			}

			let flowData: any = null;

			// Method 1: Try parsing entire text as JSON (if it's pure JSON)
			if (pageText.trim().startsWith('{') && pageText.trim().endsWith('}')) {
				try {
					flowData = JSON.parse(pageText.trim());
					console.log(`[RedirectlessAuthService] ✅ Page is pure JSON:`, {
						status: flowData?.status,
						hasAuthorizeResponse: !!flowData?.authorizeResponse,
						hasCode: !!(flowData?.authorizeResponse?.code || flowData?.code),
					});
				} catch (parseError) {
					console.log(`[RedirectlessAuthService] 🔍 Failed to parse as pure JSON:`, parseError);
				}
			}

			// Method 2: If not pure JSON, search for JSON patterns within HTML content
			if (!flowData && pageText.includes('authorizeResponse')) {
				console.log(`[RedirectlessAuthService] 🔍 Searching for JSON patterns in HTML content...`);

				// Find JSON objects that contain "authorizeResponse" and "COMPLETED"
				const jsonMatches = pageText.match(
					/\{[\s\S]*?"status"\s*:\s*"COMPLETED"[\s\S]*?"authorizeResponse"[\s\S]*?\}/g
				);

				if (jsonMatches && jsonMatches.length > 0) {
					try {
						flowData = JSON.parse(jsonMatches[0]);
						console.log(`[RedirectlessAuthService] ✅ Extracted JSON from HTML content:`, {
							matchLength: jsonMatches[0].length,
							status: flowData?.status,
							hasAuthorizeResponse: !!flowData?.authorizeResponse,
						});
					} catch (extractError) {
						console.warn(`[RedirectlessAuthService] Failed to parse extracted JSON:`, extractError);
					}
				} else {
					console.log(
						`[RedirectlessAuthService] 🔍 No COMPLETED + authorizeResponse JSON patterns found`
					);
				}
			}

			// Method 3: Fallback - search for any JSON with authorizeResponse
			if (!flowData && pageText.includes('authorizeResponse')) {
				console.log(
					`[RedirectlessAuthService] 🔍 Fallback: searching for any authorizeResponse JSON...`
				);

				const broadMatches = pageText.match(/\{[\s\S]*?"authorizeResponse"[\s\S]*?\}/g);
				if (broadMatches && broadMatches.length > 0) {
					try {
						flowData = JSON.parse(broadMatches[0]);
						console.log(
							`[RedirectlessAuthService] ✅ Found JSON with authorizeResponse (fallback):`,
							{
								status: flowData?.status,
								hasCode: !!flowData?.authorizeResponse?.code,
							}
						);
					} catch (extractError) {
						console.warn(`[RedirectlessAuthService] Fallback extraction failed:`, extractError);
					}
				}
			}

			if (!flowData) {
				console.log(`[RedirectlessAuthService] 🔍 No valid JSON found in page content`);
				return null;
			}

			// Extract authorization code using the SAME logic as working PingOne authentication
			let authCode: string | undefined;
			let authState: string | undefined;

			if (flowData?.status === 'COMPLETED') {
				// First try: authorizeResponse.code (pi.flow format) - same as PingOne auth
				if (
					flowData.authorizeResponse?.code &&
					typeof flowData.authorizeResponse.code === 'string'
				) {
					authCode = flowData.authorizeResponse.code;
					authState = flowData.authorizeResponse.state || '';
					console.log(
						'✅ [RedirectlessAuthService] Found code in authorizeResponse.code (pi.flow format):',
						{
							codeLength: authCode.length,
							codePreview: `${authCode.substring(0, 20)}...`,
							state: authState ? `${authState.substring(0, 30)}...` : 'none',
						}
					);
				}
				// Second try: direct code field
				else if (flowData.code && typeof flowData.code === 'string' && flowData.code !== 'null') {
					authCode = flowData.code;
					authState = flowData.state || '';
					console.log('✅ [RedirectlessAuthService] Found code in direct code field:', {
						codeLength: authCode.length,
						codePreview: `${authCode.substring(0, 20)}...`,
					});
				}

				if (authCode) {
					console.log(`[RedirectlessAuthService] ✅ Successfully extracted authorization code:`, {
						flowId: flowData.id,
						codePreview: `${authCode.substring(0, 20)}...`,
						state: authState ? `${authState.substring(0, 30)}...` : 'none',
						flowStatus: flowData.status,
					});

					// Store the code and state
					sessionStorage.setItem(`${storagePrefix}_auth_code`, authCode);
					if (authState) {
						sessionStorage.setItem(`${storagePrefix}_state`, authState);
					}

					// Clear pending resume
					sessionStorage.removeItem(`${storagePrefix}_pending_resume`);

					return { code: authCode, state: authState || '' };
				}
			}

			console.log(`[RedirectlessAuthService] 🔍 JSON found but no authorization code:`, {
				status: flowData?.status,
				hasAuthorizeResponse: !!flowData?.authorizeResponse,
				hasDirectCode: !!flowData?.code,
				keys: Object.keys(flowData),
			});
		} catch (error) {
			console.error(`[RedirectlessAuthService] Error extracting code from page JSON:`, error);
		}

		return null;
	}

	/**
	 * Complete redirectless flow: start -> handle sign-on -> resume -> extract code
	 */
	static async completeFlow(config: RedirectlessAuthConfig): Promise<string | null> {
		try {
			// Step 1: Start authorization
			const flowResponse = await RedirectlessAuthService.startAuthorization(config);
			const flowId = flowResponse.flowId || (flowResponse as Record<string, any>)?.id;

			if (!flowId) {
				throw new Error('PingOne did not return a flowId for the redirectless request.');
			}

			// Step 2: Handle flow status
			if (flowResponse.status === 'COMPLETED' && flowResponse.authorizeResponse?.code) {
				// Flow completed immediately - extract code directly
				const code = flowResponse.authorizeResponse.code;
				const state = flowResponse.authorizeResponse.state || '';

				if (config.onAuthCodeReceived) {
					await config.onAuthCodeReceived(code, state);
				}

				return code;
			}

			if (RedirectlessAuthService.indicatesMfa(flowResponse.status)) {
				throw new Error(
					'PingOne responded with an MFA requirement. Complete the MFA step via the Flow API (mfa.check / otp.check) before resuming (see PingOne workflow Step 7: Assign the MFA sign-on policy).'
				);
			}

			if (RedirectlessAuthService.requiresCredentialSubmission(flowResponse.status)) {
				const username = config.credentials.username?.trim();
				const password = config.credentials.password;

				if (!username || !password) {
					throw new Error(
						'PingOne requires username/password for this redirectless flow, but no credentials were provided. Pass credentials to RedirectlessAuthService.completeFlow().'
					);
				}

				const credentialResponse = await RedirectlessAuthService.submitCredentials({
					flowKey: config.flowKey,
					environmentId: config.credentials.environmentId,
					flowId,
					sessionId: (flowResponse as Record<string, any>)?._sessionId,
					username,
					password,
					clientId: config.credentials.clientId,
					clientSecret: config.credentials.clientSecret,
				});

				if (RedirectlessAuthService.indicatesMfa(credentialResponse.status)) {
					throw new Error(
						'PingOne sign-on policy requires MFA after password verification. Extend the flow to call mfa.check / otp.check (see PingOne workflow Step 7: Assign the MFA sign-on policy).'
					);
				}

				const directCode =
					credentialResponse.authorizeResponse?.code || credentialResponse.code || null;
				const directState =
					credentialResponse.authorizeResponse?.state || credentialResponse.state || '';

				if (directCode) {
					if (config.onAuthCodeReceived) {
						await config.onAuthCodeReceived(directCode, directState);
					}
					return directCode;
				}
			}

			// Step 3: Resume the flow to retrieve the authorization code
			const resumedCode = await RedirectlessAuthService.resumeFlow(config);
			if (resumedCode) {
				return resumedCode;
			}

			throw new Error(
				'PingOne did not return an authorization code after resume. Verify policy assignments and follow the redirectless workflow library steps (see PingOne workflow Step 7: Assign the MFA sign-on policy).'
			);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			console.error(`[RedirectlessAuthService] Flow failed:`, errorMessage);

			if (config.onError) {
				config.onError(error instanceof Error ? error : new Error(errorMessage));
			} else {
				v4ToastManager.showError(`Redirectless authentication failed: ${errorMessage}`);
			}

			throw error;
		}
	}

	/**
	 * Check for and handle pending resume when returning to app after authentication
	 */
	static async handlePendingResume(config: RedirectlessAuthConfig): Promise<string | null> {
		const { flowKey } = config;
		const _storagePrefix = flowKey || RedirectlessAuthService.DEFAULT_STORAGE_PREFIX;

		// Check if we're back on our app (not on PingOne's domain)
		const currentUrl = window.location.href;
		const isOnOurApp =
			!currentUrl.includes('apps.pingone.com') && !currentUrl.includes('auth.pingone.com');

		if (!isOnOurApp) {
			// Still on PingOne's domain - try to extract JSON from page
			const extracted = RedirectlessAuthService.extractCodeFromPageJson(flowKey);
			if (extracted) {
				if (config.onAuthCodeReceived) {
					await config.onAuthCodeReceived(extracted.code, extracted.state);
				}
				return extracted.code;
			}
			return null;
		}

		// We're back on our app - resume the flow
		try {
			return await RedirectlessAuthService.resumeFlow(config);
		} catch (error) {
			console.error(`[RedirectlessAuthService] Resume failed:`, error);

			// Fallback: try to extract from page JSON
			const extracted = RedirectlessAuthService.extractCodeFromPageJson(flowKey);
			if (extracted) {
				if (config.onAuthCodeReceived) {
					await config.onAuthCodeReceived(extracted.code, extracted.state);
				}
				return extracted.code;
			}

			if (config.onError) {
				config.onError(error instanceof Error ? error : new Error('Resume failed'));
			}

			return null;
		}
	}

	/**
	 * Get stored authorization code from sessionStorage
	 */
	static getStoredAuthCode(flowKey?: string): { code: string; state: string } | null {
		const storagePrefix = flowKey || RedirectlessAuthService.DEFAULT_STORAGE_PREFIX;
		const code = sessionStorage.getItem(`${storagePrefix}_auth_code`);
		const state = sessionStorage.getItem(`${storagePrefix}_state`);

		if (code) {
			return { code, state: state || '' };
		}

		return null;
	}

	/**
	 * Clear all stored flow data
	 */
	static async clearFlowData(flowKey?: string): Promise<void> {
		const storagePrefix = flowKey || RedirectlessAuthService.DEFAULT_STORAGE_PREFIX;

		sessionStorage.removeItem(`${storagePrefix}_pending_resume`);
		sessionStorage.removeItem(`${storagePrefix}_auth_code`);
		sessionStorage.removeItem(`${storagePrefix}_state`);

		// Clear PKCE codes from credentialStorageManager
		const { credentialStorageManager } = await import('./credentialStorageManager');
		credentialStorageManager.clearPKCECodes(flowKey || 'redirectless-default');

		// Also clear state if this is the active flow
		if (!flowKey) {
			sessionStorage.removeItem('oauth_state');
		}
	}
}
