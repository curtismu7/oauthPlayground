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

const MODULE_TAG = '[🔄 CALLBACK-HANDLER-V8U]';

export const CallbackHandlerV8U: React.FC = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	useEffect(() => {
		// Check if this is a user-login-callback or user-mfa-login-callback - if so, redirect back to MFA flow
		// IMPORTANT: This must be checked FIRST before any unified flow logic
		// CRITICAL: Both routes are required - /user-login-callback (generic) and /user-mfa-login-callback (MFA-specific)
		const currentPath = window.location.pathname;
		const isUserLoginCallback = currentPath === '/user-login-callback' || 
			currentPath.includes('user-login-callback') ||
			currentPath === '/user-mfa-login-callback' ||
			currentPath.includes('user-mfa-login-callback');
		
		console.log(`${MODULE_TAG} Checking callback path:`, {
			currentPath,
			isUserLoginCallback,
			searchParams: window.location.search,
		});
		
		if (isUserLoginCallback) {
			console.log(`${MODULE_TAG} ✅ User login callback detected - redirecting back to MFA flow`);
			
			// DEBUG: Log all sessionStorage keys to help diagnose cache issues
			console.log(`${MODULE_TAG} 🔍 DEBUG: All sessionStorage keys:`, Object.keys(sessionStorage));
			console.log(`${MODULE_TAG} 🔍 DEBUG: Checking for user_login_return_to_mfa...`);
			
			// Check if we have a stored return path
			const returnToMfaFlow = sessionStorage.getItem('user_login_return_to_mfa');
			
			console.log(`${MODULE_TAG} 🔍 DEBUG: Return path value:`, returnToMfaFlow);
			console.log(`${MODULE_TAG} 🔍 DEBUG: Return path type:`, typeof returnToMfaFlow);
			console.log(`${MODULE_TAG} 🔍 DEBUG: Return path exists:`, !!returnToMfaFlow);
			
			if (returnToMfaFlow) {
				try {
					// Path is stored as a plain string (no JSON parsing needed)
					const mfaPath = returnToMfaFlow.trim();
					console.log(`${MODULE_TAG} ✅ Found stored return path: ${mfaPath}`);
					
					// Validate that the path looks correct
					if (!mfaPath.startsWith('/v8/mfa')) {
						console.error(`${MODULE_TAG} ❌ Invalid return path (doesn't start with /v8/mfa): ${mfaPath}`);
						throw new Error(`Invalid return path: ${mfaPath}`);
					}
					
					// CRITICAL: Store a marker that we're returning from OAuth callback
					// This tells the MFA flow to restore state and auto-advance
					sessionStorage.setItem('mfa_oauth_callback_return', 'true');
					
					// Preserve callback parameters in the URL when redirecting
					const callbackParams = new URLSearchParams(window.location.search);
					const redirectUrl = callbackParams.toString() 
						? `${mfaPath}?${callbackParams.toString()}`
						: mfaPath;
					
					console.log(`${MODULE_TAG} 🚀 Redirecting to MFA flow: ${redirectUrl}`);
					console.log(`${MODULE_TAG} ✅ Set mfa_oauth_callback_return marker for state restoration`);
					
					// Clean up the return path marker AFTER logging but BEFORE redirect
					// This ensures we have the path even if there's a race condition
					sessionStorage.removeItem('user_login_return_to_mfa');
					
					// Use window.location.replace for immediate redirect (more reliable than navigate)
					window.location.replace(redirectUrl);
					return; // CRITICAL: Exit early to prevent unified flow logic
				} catch (error) {
					console.error(`${MODULE_TAG} ❌ Failed to process return path:`, error);
					console.error(`${MODULE_TAG} ❌ Return path value that failed:`, returnToMfaFlow);
					// Fall through to MFA hub redirect
				}
			}
			
			// If no return path, redirect to MFA hub as fallback
			console.warn(`${MODULE_TAG} ⚠️ No return path found in sessionStorage!`);
			console.warn(`${MODULE_TAG} ⚠️ This might indicate a cache issue or the return path was cleared prematurely.`);
			console.warn(`${MODULE_TAG} ⚠️ Redirecting to MFA hub as fallback`);
			const callbackParams = new URLSearchParams(window.location.search);
			const redirectUrl = callbackParams.toString() 
				? `/v8/mfa-hub?${callbackParams.toString()}`
				: '/v8/mfa-hub';
			console.log(`${MODULE_TAG} 🚀 Redirecting to MFA hub: ${redirectUrl}`);
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
			console.log(`${MODULE_TAG} 🔍 parts[0]="${parts[0]}", parts[1]="${parts[1]}"`);

			if (parts.length >= 2) {
				const detectedFlowType = parts[1];
				console.log(`${MODULE_TAG} 🔍 Detected flow type from state: "${detectedFlowType}"`);
				console.log(`${MODULE_TAG} 🔍 Checking if "${detectedFlowType}" is in known flow types:`, [
					'oauth-authz',
					'implicit',
					'hybrid',
					'client-credentials',
					'device-code',
					'ropc',
				]);

				// Validate it's a known flow type
				if (
					[
						'oauth-authz',
						'implicit',
						'hybrid',
						'client-credentials',
						'device-code',
						'ropc',
					].includes(detectedFlowType)
				) {
					flowType = detectedFlowType;
					console.log(`${MODULE_TAG} ✅ Using detected flow type: "${flowType}"`);
				} else {
					console.warn(`${MODULE_TAG} ⚠️ Unknown flow type in state, using default:`, {
						detectedFlowType,
						defaultFlowType: flowType,
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

	// Show a loading state while redirecting
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				minHeight: '100vh',
				background: '#f8fafc',
				padding: '2rem',
			}}
		>
			<div
				style={{
					background: 'white',
					padding: '2rem',
					borderRadius: '12px',
					boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
					textAlign: 'center',
					maxWidth: '500px',
				}}
			>
				<div
					style={{
						fontSize: '48px',
						marginBottom: '1rem',
					}}
				>
					🔄
				</div>
				<h2
					style={{
						margin: '0 0 0.5rem 0',
						fontSize: '24px',
						color: '#1f2937',
					}}
				>
					Processing OAuth Callback
				</h2>
				<p
					style={{
						margin: 0,
						color: '#6b7280',
						fontSize: '14px',
					}}
				>
					Redirecting you back to the flow...
				</p>
			</div>
		</div>
	);
};

export default CallbackHandlerV8U;
