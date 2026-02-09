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
import { sendAnalyticsLog } from '@/v8/utils/analyticsLoggerV8';
import { ReturnTargetServiceV8U } from '@/v8u/services/returnTargetServiceV8U';
import { checkPingOneAuthentication, performDetailedAuthenticationCheck } from '@/v8/services/pingOneAuthenticationServiceV8';
import { LoadingSpinnerModalV8U } from './LoadingSpinnerModalV8U';

const MODULE_TAG = '[🔄 CALLBACK-HANDLER-V8U]';

export const CallbackHandlerV8U: React.FC = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	useEffect(() => {
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

		console.log(`${MODULE_TAG} Checking callback path:`, {
			currentPath,
			isUserLoginCallback,
			searchParams: window.location.search,
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
			console.log(`${MODULE_TAG} ✅ User login callback detected - checking for return targets`);

			// NEW: Flow-aware routing priority - check return targets first
			const allReturnTargets = ReturnTargetServiceV8U.getAllReturnTargets();
			console.log(`${MODULE_TAG} 🔍 All return targets:`, allReturnTargets);

			// Check for device registration return target
			const deviceRegTarget = ReturnTargetServiceV8U.peekReturnTarget('mfa_device_registration');
			if (deviceRegTarget) {
				console.log(`${MODULE_TAG} 🎯 Found device registration return target:`, deviceRegTarget);

				// Preserve callback parameters and add step parameter
				const callbackParams = new URLSearchParams(window.location.search);
				callbackParams.set('step', deviceRegTarget.step.toString());
				const redirectUrl = buildRedirectUrl(deviceRegTarget.path, callbackParams);

				// Consume the return target
				ReturnTargetServiceV8U.consumeReturnTarget('mfa_device_registration');

				console.log(`${MODULE_TAG} 🚀 Redirecting to device registration flow: ${redirectUrl}`);
				window.location.replace(redirectUrl);
				return;
			}

			// Check for device authentication return target
			const deviceAuthTarget = ReturnTargetServiceV8U.peekReturnTarget('mfa_device_authentication');
			if (deviceAuthTarget) {
				console.log(
					`${MODULE_TAG} 🎯 Found device authentication return target:`,
					deviceAuthTarget
				);

				// Preserve callback parameters and add step parameter
				const callbackParams = new URLSearchParams(window.location.search);
				callbackParams.set('step', deviceAuthTarget.step.toString());
				const redirectUrl = buildRedirectUrl(deviceAuthTarget.path, callbackParams);

				// Consume the return target
				ReturnTargetServiceV8U.consumeReturnTarget('mfa_device_authentication');

				console.log(`${MODULE_TAG} 🚀 Redirecting to device authentication flow: ${redirectUrl}`);
				window.location.replace(redirectUrl);
				return;
			}

			// Check for OAuth V8U return target
			const oauthTarget = ReturnTargetServiceV8U.peekReturnTarget('oauth_v8u');
			if (oauthTarget) {
				console.log(`${MODULE_TAG} 🎯 Found OAuth V8U return target:`, oauthTarget);

				// Preserve callback parameters and add step parameter
				const callbackParams = new URLSearchParams(window.location.search);
				callbackParams.set('step', oauthTarget.step.toString());
				const redirectUrl = buildRedirectUrl(oauthTarget.path, callbackParams);

				// Consume the return target
				ReturnTargetServiceV8U.consumeReturnTarget('oauth_v8u');

				console.log(`${MODULE_TAG} 🚀 Redirecting to OAuth V8U flow: ${redirectUrl}`);
				window.location.replace(redirectUrl);
				return;
			}

			// FALLBACK: No return target found - use existing logic
			console.warn(`${MODULE_TAG} ⚠️ No return target found, falling back to legacy logic`);

			// #region agent log
			sendAnalyticsLog({
				location: 'CallbackHandlerV8U.tsx:39',
				message: 'User login callback detected - no return target, using fallback',
				data: {
					currentPath: window.location.pathname,
					currentSearch: window.location.search,
					currentHref: window.location.href,
					allReturnTargets,
				},
				timestamp: Date.now(),
				sessionId: 'debug-session',
				runId: 'run1',
				hypothesisId: 'E',
			});
			// #endregion

			console.log(`${MODULE_TAG} ✅ User login callback detected - redirecting back to MFA flow`);
			console.log(`${MODULE_TAG} 🔍 DEBUG: Current URL:`, window.location.href);
			console.log(`${MODULE_TAG} 🔍 DEBUG: Current pathname:`, window.location.pathname);
			console.log(`${MODULE_TAG} 🔍 DEBUG: Current search:`, window.location.search);

			// DEBUG: Log all sessionStorage keys to help diagnose cache issues
			const allKeys = Object.keys(sessionStorage);
			console.log(`${MODULE_TAG} 🔍 DEBUG: All sessionStorage keys (${allKeys.length}):`, allKeys);
			console.log(`${MODULE_TAG} 🔍 DEBUG: Checking for user_login_return_to_mfa...`);

			// Check if we have a stored return path
			const returnToMfaFlow = sessionStorage.getItem('user_login_return_to_mfa');

			// #region agent log
			sendAnalyticsLog({
				location: 'CallbackHandlerV8U.tsx:51',
				message: 'Checking for return path in sessionStorage',
				data: { returnToMfaFlow, hasReturnPath: !!returnToMfaFlow, allSessionKeys: allKeys },
				timestamp: Date.now(),
				sessionId: 'debug-session',
				runId: 'run1',
				hypothesisId: 'B',
			});
			// #endregion

			console.log(`${MODULE_TAG} 🔍 DEBUG: Return path value:`, returnToMfaFlow);
			console.log(`${MODULE_TAG} 🔍 DEBUG: Return path type:`, typeof returnToMfaFlow);
			console.log(`${MODULE_TAG} 🔍 DEBUG: Return path exists:`, !!returnToMfaFlow);

			// DEBUG: Check for other related keys
			console.log(
				`${MODULE_TAG} 🔍 DEBUG: user_login_state_v8:`,
				sessionStorage.getItem('user_login_state_v8') ? 'EXISTS' : 'MISSING'
			);
			console.log(
				`${MODULE_TAG} 🔍 DEBUG: user_login_redirect_uri_v8:`,
				sessionStorage.getItem('user_login_redirect_uri_v8')
			);

			// Enhanced fallback logic - try multiple approaches
			let fallbackPath = '/v8/unified-mfa'; // Default fallback to unified flow

			if (returnToMfaFlow) {
				try {
					// Path is stored as a plain string (no JSON parsing needed)
					const mfaPath = returnToMfaFlow.trim();
					console.log(`${MODULE_TAG} ✅ Found stored return path: ${mfaPath}`);

					// Validate that the path looks correct
					if (!mfaPath.startsWith('/v8/mfa')) {
						console.error(
							`${MODULE_TAG} ❌ Invalid return path (doesn't start with /v8/mfa): ${mfaPath}`
						);
						throw new Error(`Invalid return path: ${mfaPath}`);
					}

					// CRITICAL: Store a marker that we're returning from OAuth callback
					// This tells the MFA flow to restore state and auto-advance
					sessionStorage.setItem('mfa_oauth_callback_return', 'true');

					// Preserve callback parameters in the URL when redirecting
					const callbackParams = new URLSearchParams(window.location.search);
					const redirectUrl = buildRedirectUrl(mfaPath, callbackParams);

					console.log(`${MODULE_TAG} 🚀 Redirecting to MFA flow: ${redirectUrl}`);
					console.log(
						`${MODULE_TAG} ✅ Set mfa_oauth_callback_return marker for state restoration`
					);

					// #region agent log
					sendAnalyticsLog({
						location: 'CallbackHandlerV8U.tsx:93',
						message: 'About to execute redirect to MFA flow',
						data: { mfaPath, redirectUrl, callbackParams: window.location.search },
						timestamp: Date.now(),
						sessionId: 'debug-session',
						runId: 'run2',
						hypothesisId: 'B',
					});
					// #endregion

					// CRITICAL: Do NOT remove user_login_return_to_mfa here - let the target page clean it up
					// This ensures if the redirect fails or there's a race condition, the path is still available
					// The target page (MFAFlowBaseV8 or MFAAuthenticationMainPageV8) will clean it up after successful navigation

					// Use window.location.replace for immediate redirect (more reliable than navigate)
					// Store redirect intent in sessionStorage as a backup in case redirect fails
					sessionStorage.setItem('mfa_redirect_intent', redirectUrl);

					// #region agent log
					sendAnalyticsLog({
						location: 'CallbackHandlerV8U.tsx:110',
						message: 'Executing window.location.replace',
						data: { redirectUrl },
						timestamp: Date.now(),
						sessionId: 'debug-session',
						runId: 'run2',
						hypothesisId: 'B',
					});
					// #endregion

					window.location.replace(redirectUrl);

					// This code should never execute due to navigation, but adding as safety check
					setTimeout(() => {
						// #region agent log
						sendAnalyticsLog({
							location: 'CallbackHandlerV8U.tsx:120',
							message: 'WARNING: window.location.replace did not navigate away',
							data: { currentUrl: window.location.href, expectedRedirect: redirectUrl },
							timestamp: Date.now(),
							sessionId: 'debug-session',
							runId: 'run2',
							hypothesisId: 'B',
						});
						// #endregion
						console.error(
							`${MODULE_TAG} ❌ CRITICAL: window.location.replace did not navigate - still on page after redirect attempt`
						);
					}, 100);

					return; // CRITICAL: Exit early to prevent unified flow logic
				} catch (error) {
					console.error(`${MODULE_TAG} ❌ Failed to process return path:`, error);
					console.error(`${MODULE_TAG} ❌ Return path value that failed:`, returnToMfaFlow);
					// Fall through to MFA hub redirect
				}
			} else {
				// Enhanced fallback logic - try to detect the most recent MFA page
				console.warn(`${MODULE_TAG} ⚠️ No return path found in sessionStorage!`);
				console.warn(
					`${MODULE_TAG} ⚠️ This might indicate a cache issue or the return path was cleared prematurely.`
				);

				// Check if we have any MFA-related sessionStorage keys to infer the last page
				const mfaRelatedKeys = allKeys.filter((key) => key.includes('mfa') || key.includes('MFA'));

				console.log(`${MODULE_TAG} 🔍 MFA-related sessionStorage keys:`, mfaRelatedKeys);

				// Check if current path is a unified MFA callback and redirect accordingly
				if (
					currentPath === '/mfa-unified-callback' ||
					currentPath.includes('mfa-unified-callback') ||
					currentPath === '/v8/unified-mfa-callback' ||
					currentPath.includes('v8/unified-mfa-callback') ||
					currentPath === '/v8/mfa-unified-callback' ||
					currentPath.includes('v8/mfa-unified-callback')
				) {
					// FIXED: Use return target service to determine correct step instead of hardcoding step 3
					// NOTE: Return targets may have been consumed above in user login callback section
					// Use peekReturnTarget to check without consuming (since they might already be consumed)
					const deviceRegistrationTarget = ReturnTargetServiceV8U.peekReturnTarget('mfa_device_registration');
					const deviceAuthenticationTarget = ReturnTargetServiceV8U.peekReturnTarget('mfa_device_authentication');
					
					if (deviceRegistrationTarget) {
						fallbackPath = deviceRegistrationTarget.path;
						console.log(
							`${MODULE_TAG} 🔄 Device Registration return target found: ${fallbackPath} (step ${deviceRegistrationTarget.step})`
						);
					} else if (deviceAuthenticationTarget) {
						fallbackPath = deviceAuthenticationTarget.path;
						console.log(
							`${MODULE_TAG} 🔄 Device Authentication return target found: ${fallbackPath} (step ${deviceAuthenticationTarget.step})`
						);
					} else {
						// FOOLPROOF: If no return target, advance to step 3 (Device Actions) as fallback
						fallbackPath = '/v8/unified-mfa?step=3';
						console.log(
							`${MODULE_TAG} 🔄 No return target found, using fallback step 3 (Device Actions): ${fallbackPath}`
						);
					}
					
					// Store callback marker and step advancement info
					sessionStorage.setItem('mfa_oauth_callback_return', 'true');
					sessionStorage.setItem('mfa_oauth_callback_step', fallbackPath.includes('step=') ? fallbackPath.split('step=')[1] : '3');
					sessionStorage.setItem('mfa_oauth_callback_timestamp', Date.now().toString());
				}
				// If we have unified MFA keys, prefer the unified page
				else if (mfaRelatedKeys.some((key) => key.includes('unified'))) {
					fallbackPath = '/v8/unified-mfa';
					console.log(
						`${MODULE_TAG} 🔍 Detected unified MFA activity, using fallback: ${fallbackPath}`
					);
				}

				console.warn(`${MODULE_TAG} ⚠️ Redirecting to fallback MFA page: ${fallbackPath}`);
			}

			const normalizedFallback = normalizeFallbackStep(fallbackPath);
			const callbackParams = new URLSearchParams(window.location.search);
			const redirectUrl = buildRedirectUrl(normalizedFallback.path, callbackParams);
			console.log(`${MODULE_TAG} 🚀 Redirecting to fallback: ${redirectUrl}`);

			// Store callback marker even for fallback
			sessionStorage.setItem('mfa_oauth_callback_return', 'true');
			sessionStorage.setItem('mfa_oauth_callback_step', normalizedFallback.step.toString());
			sessionStorage.setItem('mfa_oauth_callback_timestamp', Date.now().toString());
			window.location.replace(redirectUrl);
			return; // CRITICAL: Exit early to prevent unified flow logic
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
