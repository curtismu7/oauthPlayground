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
import { LoadingSpinnerModalV8U } from './LoadingSpinnerModalV8U';
import { logger } from '@/v8u/services/unifiedFlowLoggerServiceV8U';
import { UnifiedFlowErrorHandler } from '@/v8u/services/unifiedFlowErrorHandlerV8U';

const MODULE_TAG = '[🔄 CALLBACK-HANDLER-V8U]';

export const CallbackHandlerV8U: React.FC = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	useEffect(() => {
		// Check if this is a user-login-callback or user-mfa-login-callback - if so, redirect back to MFA flow
		// IMPORTANT: This must be checked FIRST before any unified flow logic
		// CRITICAL: Both routes are required - /user-login-callback (generic) and /user-mfa-login-callback (MFA-specific)
		const currentPath = window.location.pathname;
		const isUserLoginCallback =
			currentPath === '/user-login-callback' ||
			currentPath.includes('user-login-callback') ||
			currentPath === '/user-mfa-login-callback' ||
			currentPath.includes('user-mfa-login-callback');

		logger.debug(Checking callback path:`, {
			currentPath,
			isUserLoginCallback,
			searchParams: window.location.search,
		});

		if (isUserLoginCallback) {
			// #region agent log
			sendAnalyticsLog({
				location: 'CallbackHandlerV8U.tsx:39',
				message: 'User login callback detected',
				data: {
					currentPath: window.location.pathname,
					currentSearch: window.location.search,
					currentHref: window.location.href,
				},
				timestamp: Date.now(),
				sessionId: 'debug-session',
				runId: 'run1',
				hypothesisId: 'E',
			});
			// #endregion

			logger.debug(✅ User login callback detected - redirecting back to MFA flow`);
			logger.debug(🔍 DEBUG: Current URL:`, window.location.href);
			logger.debug(🔍 DEBUG: Current pathname:`, window.location.pathname);
			logger.debug(🔍 DEBUG: Current search:`, window.location.search);

			// DEBUG: Log all sessionStorage keys to help diagnose cache issues
			const allKeys = Object.keys(sessionStorage);
			logger.debug(🔍 DEBUG: All sessionStorage keys (${allKeys.length}):`, allKeys);
			logger.debug(🔍 DEBUG: Checking for user_login_return_to_mfa...`);

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

			logger.debug(🔍 DEBUG: Return path value:`, returnToMfaFlow);
			logger.debug(🔍 DEBUG: Return path type:`, typeof returnToMfaFlow);
			logger.debug(🔍 DEBUG: Return path exists:`, !!returnToMfaFlow);

			// DEBUG: Check for other related keys
			logger.debug(🔍 DEBUG: user_login_state_v8:`,
				sessionStorage.getItem('user_login_state_v8') ? 'EXISTS' : 'MISSING'
			);
			logger.debug(🔍 DEBUG: user_login_redirect_uri_v8:`,
				sessionStorage.getItem('user_login_redirect_uri_v8')
			);

			if (returnToMfaFlow) {
				try {
					// Path is stored as a plain string (no JSON parsing needed)
					const mfaPath = returnToMfaFlow.trim();
					logger.debug(✅ Found stored return path: ${mfaPath}`);

					// Validate that the path looks correct
					if (!mfaPath.startsWith('/v8/mfa')) {
						logger.error(❌ Invalid return path (doesn't start with /v8/mfa): ${mfaPath}`
						);
						throw new Error(`Invalid return path: ${mfaPath}`);
					}

					// CRITICAL: Store a marker that we're returning from OAuth callback
					// This tells the MFA flow to restore state and auto-advance
					sessionStorage.setItem('mfa_oauth_callback_return', 'true');

					// Preserve callback parameters in the URL when redirecting
					const callbackParams = new URLSearchParams(window.location.search);
					const redirectPath = callbackParams.toString()
						? `${mfaPath}?${callbackParams.toString()}`
						: mfaPath;

					// Use absolute URL to ensure redirect works reliably
					const redirectUrl = `${window.location.origin}${redirectPath}`;

					logger.debug(🚀 Redirecting to MFA flow: ${redirectUrl}`);
					logger.debug(✅ Set mfa_oauth_callback_return marker for state restoration`
					);

					// #region agent log
					sendAnalyticsLog({
						location: 'CallbackHandlerV8U.tsx:93',
						message: 'About to execute redirect to MFA flow',
						data: { mfaPath, redirectUrl, redirectPath, callbackParams: window.location.search },
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
						logger.error(❌ CRITICAL: window.location.replace did not navigate - still on page after redirect attempt`
						);
					}, 100);

					return; // CRITICAL: Exit early to prevent unified flow logic
				} catch (error) {
					logger.error(❌ Failed to process return path:`, error);
					logger.error(❌ Return path value that failed:`, returnToMfaFlow);
					// Fall through to MFA hub redirect
				}
			}

			// If no return path, redirect to MFA hub as fallback
			logger.warn(⚠️ No return path found in sessionStorage!`);
			logger.warn(⚠️ This might indicate a cache issue or the return path was cleared prematurely.`
			);
			logger.warn(⚠️ Redirecting to MFA hub as fallback`);
			const callbackParams = new URLSearchParams(window.location.search);
			const redirectUrl = callbackParams.toString()
				? `/v8/mfa-hub?${callbackParams.toString()}`
				: '/v8/mfa-hub';
			logger.debug(🚀 Redirecting to MFA hub: ${redirectUrl}`);
			window.location.replace(redirectUrl);
			return; // CRITICAL: Exit early to prevent unified flow logic
		}

		// If we reach here, this is NOT a user-login-callback, continue with unified flow logic
		logger.debug(Not a user-login-callback, proceeding with unified flow logic`);

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

		logger.debug(Callback received`, {
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
			logger.error(❌ CONFIGURATION ERROR: Received authorization code for Implicit flow!`
			);
			logger.error(This means your PingOne application is not configured for Implicit flow.`
			);
			logger.error(Please enable Implicit grant type in your PingOne application settings.`
			);
		}

		// Detect flow type from state parameter or callback data
		// State format: "v8u-{flowType}-{random}" (e.g., "v8u-implicit-abc123")
		let flowType = 'oauth-authz'; // Default
		let detectedStep = 3; // Default to step 3 (callback handling)

		logger.debug(🔍 Analyzing state parameter`, {
			state,
			stateLength: state?.length,
			startsWithV8u: state?.startsWith('v8u-'),
			fullState: state,
		});

		if (state?.startsWith('v8u-')) {
			const parts = state.split('-');
			logger.debug(🔍 State parts (split by hyphen):`, parts);
			logger.debug(🔍 parts[0]="${parts[0]}", parts[1]="${parts[1]}", parts.length=${parts.length}`
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
						logger.debug(🔍 Detected two-part flow type: "${detectedFlowType}"`);
					}
				}

				// If no two-part match, check single-part flow types (implicit, hybrid, ropc)
				if (!detectedFlowType && parts.length >= 2) {
					const singlePartFlowType = parts[1];
					if (knownFlowTypes.includes(singlePartFlowType)) {
						detectedFlowType = singlePartFlowType;
						logger.debug(🔍 Detected single-part flow type: "${detectedFlowType}"`);
					}
				}

				if (detectedFlowType) {
					flowType = detectedFlowType;
					logger.debug(✅ Using detected flow type: "${flowType}"`);
				} else {
					logger.warn(⚠️ Unknown flow type in state, using default:`, {
						parts,
						detectedFlowType,
						defaultFlowType: flowType,
						state,
					});
				}
			}
		} else {
			logger.warn(⚠️ No v8u state prefix found, using default flow type:`, {
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
			logger.debug(🔍 Fragment detected, determining step based on flow type "${flowType}"`
			);
			if (flowType === 'implicit') {
				detectedStep = 2; // Parse fragment step for implicit
				logger.debug(✅ Implicit flow - will redirect to step 2 (parse fragment)`);
			} else if (flowType === 'hybrid') {
				detectedStep = 3; // Parse callback step for hybrid
				logger.debug(✅ Hybrid flow - will redirect to step 3 (parse callback)`);
			} else {
				logger.warn(⚠️ Has fragment but flow type is "${flowType}" (not implicit or hybrid)`
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
		logger.debug(Stored callback data in sessionStorage`, callbackData);

		// Redirect back to the flow at the appropriate step
		// CRITICAL: For implicit/hybrid flows, preserve the fragment (hash) in the URL
		const redirectPath = `/v8u/unified/${flowType}/${detectedStep}`;
		const redirectUrl = hasFragment ? `${redirectPath}${window.location.hash}` : redirectPath;

		logger.debug(🚀 ========== REDIRECTING TO FLOW ==========`);
		logger.debug(🚀 Flow Type: "${flowType}"`);
		logger.debug(🚀 Step: ${detectedStep}`);
		logger.debug(🚀 Redirect Path: ${redirectPath}`);
		logger.debug(🚀 Redirect URL: ${redirectUrl}`);
		logger.debug(🚀 Has Fragment: ${hasFragment}`);
		logger.debug(🚀 Will Preserve Fragment: ${hasFragment}`);
		logger.debug(🚀 State Used for Detection: "${state}"`);
		logger.debug(🚀 ========================================`);

		// Use window.location.replace to preserve the fragment
		// React Router's navigate() doesn't preserve fragments reliably
		if (hasFragment) {
			logger.debug(🚀 Using window.location.replace() to preserve fragment`);
			window.location.replace(redirectUrl);
		} else {
			logger.debug(🚀 Using React Router navigate()`);
			navigate(redirectPath, { replace: true });
		}
	}, [searchParams, navigate]);

	// Show a modal loading spinner while redirecting
	return <LoadingSpinnerModalV8U show={true} message="Processing OAuth Callback..." theme="blue" />;
};

export default CallbackHandlerV8U;
