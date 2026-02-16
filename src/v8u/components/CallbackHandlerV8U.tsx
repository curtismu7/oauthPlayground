/**
 * @file CallbackHandlerV8U.tsx
 * @module v8u/components
 * @description OAuth callback handler for V8U unified flows
 * @version 8.0.0
 * @since 2024-11-17
 *
 * This component automatically captures OAuth callback parameters and redirects
 * back to the flow. This is how real OAuth applications work - the callback URL
 * is handled automatically, not manually pasted by users.
 */

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MFARedirectUriServiceV8 } from '@/v8/services/mfaRedirectUriServiceV8';
import {
	checkPingOneAuthentication,
	performDetailedAuthenticationCheck,
} from '@/v8/services/pingOneAuthenticationServiceV8';
import { ReturnTargetServiceV8U } from '@/v8u/services/returnTargetServiceV8U';
import { LoadingSpinnerModalV8U } from './LoadingSpinnerModalV8U';

const MODULE_TAG = '[🔄 CALLBACK-HANDLER-V8U]';
const AUTHZ_REDIRECT_LOG_ENDPOINT = '/api/logs/authz-redirect';

const extractStepFromPath = (path: string): string | null => {
	try {
		const url = new URL(path, window.location.origin);
		return url.searchParams.get('step');
	} catch {
		return null;
	}
};

// Enhanced logging function that saves to disk via API
const logToDisk = (event: string, data: Record<string, unknown>) => {
	try {
		const logEntry = {
			timestamp: new Date().toISOString(),
			event,
			data,
			url: window.location.href,
			userAgent: navigator.userAgent,
			sessionId: sessionStorage.getItem('mfa_redirect_log_session_id') || 'unknown',
		};

		// Use sendBeacon for reliable logging even during redirect
		const body = JSON.stringify(logEntry);
		
		if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
			const blob = new Blob([body], { type: 'application/json' });
			navigator.sendBeacon('/api/logs/callback-debug', blob);
		} else {
			// Fallback for older browsers
			void fetch('/api/logs/callback-debug', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body,
				keepalive: true,
			});
		}
	} catch (error) {
		console.error('Failed to log to disk:', error);
	}
};

const postAuthzRedirectLog = (payload: Record<string, unknown>) => {
	try {
		const body = JSON.stringify(payload);

		if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
			const blob = new Blob([body], { type: 'application/json' });
			navigator.sendBeacon(AUTHZ_REDIRECT_LOG_ENDPOINT, blob);
			return;
		}

		void fetch(AUTHZ_REDIRECT_LOG_ENDPOINT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body,
			keepalive: true,
		});
	} catch {
		// Intentionally no-op: diagnostics should never break callback flow.
	}
};

export const CallbackHandlerV8U: React.FC = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	useEffect(() => {
		const flowId = crypto.randomUUID();
		const mfaRedirectSessionKey = 'mfa_redirect_log_session_id';
		const sessionId = sessionStorage.getItem(mfaRedirectSessionKey) || crypto.randomUUID();
		sessionStorage.setItem(mfaRedirectSessionKey, sessionId);

		const logRedirectEvent = (event: string, details: Record<string, unknown> = {}) => {
			postAuthzRedirectLog({
				event,
				sessionId,
				flowId,
				currentUrl: window.location.href,
				currentPath: window.location.pathname,
				currentSearch: window.location.search,
				referrer: document.referrer,
				hasCode: !!searchParams.get('code'),
				hasState: !!searchParams.get('state'),
				...details,
			});
		};

		logRedirectEvent('callback_received', {
			startedStep: searchParams.get('step') || 'callback-entry',
			targetStep: 'pending_resolution',
		});

		MFARedirectUriServiceV8.logDebugEvent('CALLBACK_HANDLER', 'Callback handler started', {
			path: window.location.pathname,
			search: window.location.search,
			hash: window.location.hash,
		});

		// Check PingOne authentication status and show success message
		const authResult = checkPingOneAuthentication();
		console.log(`${MODULE_TAG} PingOne authentication result:`, authResult);

		// Perform detailed authentication check for debugging
		const { result, diagnostics } = performDetailedAuthenticationCheck();
		console.log(`${MODULE_TAG} Detailed authentication diagnostics:`, { result, diagnostics });

		// Check if this is a user-login-callback or user-mfa-login-callback - if so, redirect back to MFA flow
		// IMPORTANT: This must be checked FIRST before any unified flow logic
		// CRITICAL: Both routes are required - /user-login-callback (generic) and /user-mfa-login-callback (MFA-specific)
		const currentPath = window.location.pathname;
		const isUserLoginCallback =
			currentPath === '/user-login-callback' ||
			currentPath.includes('user-login-callback') ||
			currentPath === '/user-mfa-login-callback' ||
			currentPath.includes('user-mfa-login-callback') ||
			// Also handle unified MFA callbacks
			currentPath === '/mfa-unified-callback' ||
			currentPath.includes('mfa-unified-callback') ||
			currentPath === '/v8/unified-mfa-callback' ||
			currentPath.includes('/v8/unified-mfa-callback') ||
			currentPath === '/v8/mfa-unified-callback' ||
			currentPath.includes('/v8/mfa-unified-callback') ||
			// Handle V8U unified flow callbacks that should return to V8 Unified MFA
			currentPath === '/v8u/unified/oauth-authz' ||
			currentPath.includes('/v8u/unified/oauth-authz') ||
			currentPath.startsWith('/v8u/unified/oauth-authz/');

		// Don't handle debug callback page here - it has its own component
		// Note: Temporarily disabling this to fix the stuck callback issue
		const isDebugCallbackPage = false; // currentPath === '/v8/unified-mfa-callback';

		if (isDebugCallbackPage) {
			console.log(`${MODULE_TAG} Debug callback page detected - skipping CallbackHandlerV8U logic`);
			return;
		}

		console.log(`${MODULE_TAG} 🔍 CHECKING CALLBACK PATH:`, {
			currentPath,
			isUserLoginCallback,
			searchParams: window.location.search,
			hasCode: !!searchParams.get('code'),
			hasState: !!searchParams.get('state'),
			hasError: !!searchParams.get('error'),
			errorDescription: searchParams.get('error_description'),
		});

		// Log to disk for persistent debugging
		logToDisk('callback_path_check', {
			currentPath,
			isUserLoginCallback,
			searchParams: Object.fromEntries(searchParams.entries()),
			hasCode: !!searchParams.get('code'),
			hasState: !!searchParams.get('state'),
			hasError: !!searchParams.get('error'),
			errorDescription: searchParams.get('error_description'),
		});

		// See UNIFIED_MFA_INVENTORY.md: Callback Step Fallback Table
		const CALLBACK_STEP_FALLBACK_TABLE = [
			{
				fromStep: 0,
				toStep: 2,
				reason: 'Avoid returning to configuration after OAuth callback',
			},
			{
				fromStep: 1,
				toStep: 2,
				reason: 'After user login, resume device selection',
			},
		] as const;

		const buildRedirectUrl = (path: string, params: URLSearchParams): string => {
			const url = new URL(path, window.location.origin);
			params.forEach((value, key) => {
				url.searchParams.set(key, value);
			});
			return url.toString();
		};

		const normalizeFallbackStep = (path: string): { path: string; step: number } => {
			const url = new URL(path, window.location.origin);
			const rawStep = parseInt(url.searchParams.get('step') ?? '0', 10);
			const fallbackEntry = CALLBACK_STEP_FALLBACK_TABLE.find(
				(entry) => entry.fromStep === rawStep
			);
			const resolvedStep = fallbackEntry ? fallbackEntry.toStep : rawStep;
			if (resolvedStep !== rawStep) {
				url.searchParams.set('step', resolvedStep.toString());
			}
			return { path: `${url.pathname}${url.search}`, step: resolvedStep };
		};

		if (isUserLoginCallback) {
			logRedirectEvent('user_login_callback_detected', {
				startedStep: searchParams.get('step') || 'callback-entry',
				targetStep: 'pending_resolution',
				callbackPath: currentPath,
			});

			MFARedirectUriServiceV8.logDebugEvent(
				'CALLBACK_HANDLER',
				'Detected MFA/user login callback path',
				{
					currentPath,
					hasCode: !!searchParams.get('code'),
					hasState: !!searchParams.get('state'),
				}
			);

			console.log(`${MODULE_TAG} ✅ User login callback detected - using URL-based detection`);

			// NEW: Unified OAuth pattern - retrieve flow context from sessionStorage
			// This is set by the flow before redirecting to PingOne for authentication
			const flowContextKey = 'mfa_flow_callback_context';
			const storedContext = sessionStorage.getItem(flowContextKey);

			console.log(`${MODULE_TAG} 🔍 Checking for stored flow context:`, {
				hasContext: !!storedContext,
				contextKey: flowContextKey,
			});

			// Try to consume return target first (preferred method)
			const mfaReturnTarget =
				ReturnTargetServiceV8U.consumeReturnTarget('mfa_device_registration') ||
				ReturnTargetServiceV8U.consumeReturnTarget('mfa_device_authentication');

			if (mfaReturnTarget) {
				MFARedirectUriServiceV8.logDebugEvent(
					'CALLBACK_HANDLER',
					'Using return target from ReturnTargetService',
					{
						kind: mfaReturnTarget.kind,
						path: mfaReturnTarget.path,
						step: mfaReturnTarget.step,
					}
				);

				console.log(`${MODULE_TAG} 🎯 Found MFA return target:`, mfaReturnTarget);

				// Preserve callback parameters
				const callbackParams = new URLSearchParams(window.location.search);
				if (mfaReturnTarget.step) {
					callbackParams.set('step', mfaReturnTarget.step.toString());
				}

				const redirectUrl = buildRedirectUrl(mfaReturnTarget.path, callbackParams);
				const targetStep =
					(mfaReturnTarget.step ? String(mfaReturnTarget.step) : null) ||
					extractStepFromPath(mfaReturnTarget.path) ||
					'unknown';
				logRedirectEvent('redirecting_to_return_target', {
					startedStep: searchParams.get('step') || 'callback-entry',
					targetStep,
					targetPath: mfaReturnTarget.path,
					targetUrl: redirectUrl,
					reason: 'return_target_service',
					returnTargetKind: mfaReturnTarget.kind,
				});

				MFARedirectUriServiceV8.logDebugEvent(
					'CALLBACK_HANDLER',
					'Navigating to return target URL',
					{
						redirectUrl,
					}
				);

				console.log(`${MODULE_TAG} 🚀 Redirecting to MFA flow using return target: ${redirectUrl}`);
				navigate(redirectUrl);
				return;
			}

			// IMPROVED: Check for stored context with better error handling
			if (storedContext) {
				try {
					const context = JSON.parse(storedContext) as {
						returnPath: string;
						returnStep: number;
						flowType: 'registration' | 'authentication';
						timestamp: number;
					};

					console.log(`${MODULE_TAG} 🎯 Found stored flow context:`, context);

					// Validate context age (should be recent, within 10 minutes)
					const contextAge = Date.now() - context.timestamp;
					const maxAge = 10 * 60 * 1000; // 10 minutes

					if (contextAge > maxAge) {
						logRedirectEvent('stored_context_stale', {
							startedStep: searchParams.get('step') || 'callback-entry',
							targetStep: 'fallback_resolution',
							contextReturnStep: context.returnStep,
							contextAgeMs: contextAge,
						});
						console.warn(
							`${MODULE_TAG} ⚠️ Flow context is stale (${Math.round(contextAge / 1000)}s old), removing and using fallback`
						);
						sessionStorage.removeItem(flowContextKey);
					} else {
						// Preserve callback parameters and add step parameter
						const callbackParams = new URLSearchParams(window.location.search);
						callbackParams.set('step', context.returnStep.toString());
						const redirectUrl = buildRedirectUrl(context.returnPath, callbackParams);
						logRedirectEvent('redirecting_to_stored_context', {
							startedStep: searchParams.get('step') || 'callback-entry',
							targetStep: String(context.returnStep),
							targetPath: context.returnPath,
							targetUrl: redirectUrl,
							reason: 'stored_flow_context',
							flowType: context.flowType,
							contextAgeMs: contextAge,
						});

						// Clear the context after consuming it (single-use)
						sessionStorage.removeItem(flowContextKey);

						console.log(`${MODULE_TAG} 🚀 Redirecting to ${context.flowType} flow: ${redirectUrl}`);

						// Store callback data for the flow to process
						sessionStorage.setItem(
							'oauth_callback_data',
							JSON.stringify({
								code: searchParams.get('code'),
								state: searchParams.get('state'),
								fullUrl: window.location.href,
								timestamp: Date.now(),
							})
						);

						window.location.replace(redirectUrl);
						return;
					}
				} catch (error) {
					console.error(`${MODULE_TAG} ❌ Failed to parse flow context:`, error);
					// Remove corrupted context
					sessionStorage.removeItem(flowContextKey);
				}
			}

			// IMPROVED FALLBACK: Use path-based detection with better logic
			console.log(`${MODULE_TAG} 🔍 No valid stored context, using path-based detection`);

			let fallbackPath = '/v8/unified-mfa?step=2'; // Default: return to device selection
			let fallbackReason = 'default';

			// Check for MFA-specific callback paths first
			if (
				currentPath.includes('mfa-unified-callback') ||
				currentPath.includes('unified-mfa-callback')
			) {
				fallbackPath = '/v8/unified-mfa?step=2'; // MFA flow: device selection step
				fallbackReason = 'mfa-callback-path';
			} else if (currentPath.includes('mfa-hub-callback')) {
				fallbackPath = '/v8/mfa-hub?step=2'; // MFA hub: authentication flow
				fallbackReason = 'mfa-hub-path';
			} else if (
				currentPath.includes('user-login-callback') ||
				currentPath.includes('user-mfa-login-callback')
			) {
				// For user-login-callback, check if we have OAuth callback data that suggests MFA flow
				const code = searchParams.get('code');
				const state = searchParams.get('state');

				if (code && state) {
					// This looks like an OAuth callback, likely from MFA flow
					fallbackPath = '/v8/unified-mfa?step=2'; // Return to MFA flow
					fallbackReason = 'user-login-oauth-callback';
				} else {
					fallbackPath = '/v8/unified-mfa?step=2'; // Default to MFA flow
					fallbackReason = 'user-login-default';
				}
			}

			console.log(`${MODULE_TAG} 🔄 Using fallback redirect:`, {
				path: fallbackPath,
				reason: fallbackReason,
				currentPath,
				hasCode: !!searchParams.get('code'),
				hasState: !!searchParams.get('state'),
			});

			const normalizedFallback = normalizeFallbackStep(fallbackPath);
			const callbackParams = new URLSearchParams(window.location.search);
			const redirectUrl = buildRedirectUrl(normalizedFallback.path, callbackParams);

			// Log redirect decision to disk
			logToDisk('redirect_decision', {
				fallbackPath,
				fallbackReason,
				redirectUrl,
				hasCode: !!searchParams.get('code'),
				hasState: !!searchParams.get('state'),
				allSearchParams: Object.fromEntries(searchParams.entries()),
				normalizedFallback,
				callbackParams: Object.fromEntries(callbackParams.entries())
			});

			// Log redirect execution to disk
			logToDisk('redirect_execution', {
				redirectUrl,
				currentUrl: window.location.href,
				timestamp: Date.now(),
				sessionStorageData: {
					oauthCallbackData: sessionStorage.getItem('oauth_callback_data'),
					mfaRedirectSession: sessionStorage.getItem('mfa_redirect_log_session_id')
				}
			});

			logRedirectEvent('redirecting_to_fallback', {
				startedStep: searchParams.get('step') || 'callback-entry',
				targetStep: String(normalizedFallback.step),
				targetPath: normalizedFallback.path,
				targetUrl: redirectUrl,
				reason: fallbackReason,
			});

			MFARedirectUriServiceV8.logDebugEvent(
				'CALLBACK_HANDLER',
				'Using fallback redirect path for MFA callback',
				{
					fallbackPath,
					fallbackReason,
					redirectUrl,
					hasCode: !!searchParams.get('code'),
					hasState: !!searchParams.get('state'),
				}
			);

			// Store callback data for the flow to process
			sessionStorage.setItem(
				'oauth_callback_data',
				JSON.stringify({
					code: searchParams.get('code'),
					state: searchParams.get('state'),
					fullUrl: window.location.href,
					timestamp: Date.now(),
				})
			);

			window.location.replace(redirectUrl);
			return;
		}

		// If we reach here, this is NOT a user-login-callback, continue with unified flow logic
		console.log(`${MODULE_TAG} Not a user-login-callback, proceeding with unified flow logic`);

		// Check for both query parameters (authorization code flow) and fragment (implicit/hybrid flow)
		const fragment = window.location.hash.substring(1);
		const hasFragment =
			fragment && (fragment.includes('access_token') || fragment.includes('id_token'));

		// Parse fragment parameters if present (for implicit/hybrid flows)
		const fragmentParams = hasFragment ? new URLSearchParams(fragment) : null;

		// Get the authorization code and state from URL parameters
		// For implicit/hybrid flows, state is in the fragment, not query params
		const code = searchParams.get('code');
		const state = fragmentParams?.get('state') || searchParams.get('state'); // Fragment first, then query params
		const error = fragmentParams?.get('error') || searchParams.get('error');
		const errorDescription =
			fragmentParams?.get('error_description') || searchParams.get('error_description');

		console.log(`${MODULE_TAG} Callback received`, {
			url: window.location.href,
			hasCode: searchParams.has('code'),
			hasState: searchParams.has('state'),
			hasError: searchParams.has('error'),
			hasFragment,
			fragmentLength: fragment?.length,
			hasFragmentState: fragmentParams?.has('state'),
			extractedState: state,
			stateSource: fragmentParams?.has('state')
				? 'fragment'
				: searchParams.has('state')
					? 'query'
					: 'none',
		});

		// CRITICAL: Check if we got a code when we expected tokens in fragment (implicit flow)
		if (code && state && state.includes('v8u-implicit')) {
			console.error(
				`${MODULE_TAG} ❌ CONFIGURATION ERROR: Received authorization code for Implicit flow!`
			);
			console.error(
				`${MODULE_TAG} This means your PingOne application is not configured for Implicit flow.`
			);
			console.error(
				`${MODULE_TAG} Please enable Implicit grant type in your PingOne application settings.`
			);
		}

		// Detect flow type from state parameter or callback data
		// State format: "v8u-{flowType}-{random}" (e.g., "v8u-implicit-abc123")
		let flowType = 'oauth-authz'; // Default
		let detectedStep = 3; // Default to step 3 (callback handling)

		console.log(`${MODULE_TAG} 🔍 Analyzing state parameter`, {
			state,
			stateLength: state?.length,
			startsWithV8u: state?.startsWith('v8u-'),
			fullState: state,
		});

		if (state?.startsWith('v8u-')) {
			const parts = state.split('-');
			console.log(`${MODULE_TAG} 🔍 State parts (split by hyphen):`, parts);
			console.log(
				`${MODULE_TAG} 🔍 parts[0]="${parts[0]}", parts[1]="${parts[1]}", parts.length=${parts.length}`
			);

			if (parts.length >= 2) {
				// Known flow types (some have hyphens, so we need to check combinations)
				const knownFlowTypes = [
					'oauth-authz', // Requires parts[1] + '-' + parts[2]
					'client-credentials', // Requires parts[1] + '-' + parts[2]
					'device-code', // Requires parts[1] + '-' + parts[2]
					'implicit',
					'hybrid',
					'ropc',
				];

				// Try to detect flow type by checking various combinations
				let detectedFlowType: string | null = null;

				// Check for multi-part flow types first (oauth-authz, client-credentials, device-code)
				// State format: "v8u-{flowType}-{random}"
				if (parts.length >= 3) {
					const twoPartFlowType = `${parts[1]}-${parts[2]}`;
					if (knownFlowTypes.includes(twoPartFlowType)) {
						detectedFlowType = twoPartFlowType;
						console.log(`${MODULE_TAG} 🔍 Detected two-part flow type: "${detectedFlowType}"`);
					}
				}

				// If no two-part match, check single-part flow types (implicit, hybrid, ropc)
				if (!detectedFlowType && parts.length >= 2) {
					const singlePartFlowType = parts[1];
					if (knownFlowTypes.includes(singlePartFlowType)) {
						detectedFlowType = singlePartFlowType;
						console.log(`${MODULE_TAG} 🔍 Detected single-part flow type: "${detectedFlowType}"`);
					}
				}

				if (detectedFlowType) {
					flowType = detectedFlowType;
					console.log(`${MODULE_TAG} ✅ Using detected flow type: "${flowType}"`);
				} else {
					console.warn(`${MODULE_TAG} ⚠️ Unknown flow type in state, using default:`, {
						parts,
						detectedFlowType,
						defaultFlowType: flowType,
						state,
					});
				}
			}
		} else {
			console.warn(`${MODULE_TAG} ⚠️ No v8u state prefix found, using default flow type:`, {
				state,
				stateIsNull: state === null,
				stateIsUndefined: state === undefined,
				stateIsEmpty: state === '',
				defaultFlowType: flowType,
			});
		}

		// For implicit flow, tokens come in fragment, so redirect to step 2 (parse fragment)
		// For hybrid flow, both code and tokens come, so redirect to step 3 (parse callback)
		if (hasFragment) {
			console.log(
				`${MODULE_TAG} 🔍 Fragment detected, determining step based on flow type "${flowType}"`
			);
			if (flowType === 'implicit') {
				detectedStep = 2; // Parse fragment step for implicit
				console.log(`${MODULE_TAG} ✅ Implicit flow - will redirect to step 2 (parse fragment)`);
			} else if (flowType === 'hybrid') {
				detectedStep = 3; // Parse callback step for hybrid
				console.log(`${MODULE_TAG} ✅ Hybrid flow - will redirect to step 3 (parse callback)`);
			} else {
				console.warn(
					`${MODULE_TAG} ⚠️ Has fragment but flow type is "${flowType}" (not implicit or hybrid)`
				);
			}
		}

		// Build the full callback URL with all parameters
		// We need to do this because window.location.href might not have the params after React Router processes it
		const fullUrl = `${window.location.origin}${window.location.pathname}?${searchParams.toString()}${window.location.hash}`;

		// Store callback data in sessionStorage for the flow to retrieve
		const callbackData = {
			code,
			state,
			error,
			errorDescription,
			fullUrl,
			timestamp: Date.now(),
			flowType, // Store detected flow type
		};

		sessionStorage.setItem('v8u_callback_data', JSON.stringify(callbackData));
		console.log(`${MODULE_TAG} Stored callback data in sessionStorage`, callbackData);

		// Redirect back to the flow at the appropriate step
		// CRITICAL: For implicit/hybrid flows, preserve the fragment (hash) in the URL
		const redirectPath = `/v8u/unified/${flowType}/${detectedStep}`;
		const redirectUrl = hasFragment ? `${redirectPath}${window.location.hash}` : redirectPath;
		logRedirectEvent('redirecting_to_unified_flow', {
			startedStep: searchParams.get('step') || 'callback-entry',
			targetStep: String(detectedStep),
			targetPath: redirectPath,
			targetUrl: `${window.location.origin}${redirectUrl}`,
			reason: hasFragment ? 'preserve_fragment' : 'standard_unified_flow',
			flowType,
			hasFragment,
		});

		console.log(`${MODULE_TAG} 🚀 ========== REDIRECTING TO FLOW ==========`);
		console.log(`${MODULE_TAG} 🚀 Flow Type: "${flowType}"`);
		console.log(`${MODULE_TAG} 🚀 Step: ${detectedStep}`);
		console.log(`${MODULE_TAG} 🚀 Redirect Path: ${redirectPath}`);
		console.log(`${MODULE_TAG} 🚀 Redirect URL: ${redirectUrl}`);
		console.log(`${MODULE_TAG} 🚀 Has Fragment: ${hasFragment}`);
		console.log(`${MODULE_TAG} 🚀 Will Preserve Fragment: ${hasFragment}`);
		console.log(`${MODULE_TAG} 🚀 State Used for Detection: "${state}"`);
		console.log(`${MODULE_TAG} 🚀 ========================================`);

		// Use window.location.replace to preserve the fragment
		// React Router's navigate() doesn't preserve fragments reliably
		if (hasFragment) {
			console.log(`${MODULE_TAG} 🚀 Using window.location.replace() to preserve fragment`);
			window.location.replace(redirectUrl);
		} else {
			console.log(`${MODULE_TAG} 🚀 Using React Router navigate()`);
			navigate(redirectPath, { replace: true });
		}
	}, [searchParams, navigate]);

	// Show a modal loading spinner while redirecting
	return <LoadingSpinnerModalV8U show={true} message="Processing OAuth Callback..." theme="blue" />;
};

export default CallbackHandlerV8U;
