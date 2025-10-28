import React, { useEffect, useRef, useState, useMemo } from 'react';
import { FiCheckCircle, FiLoader, FiXCircle } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/NewAuthContext';
import { logger } from '../../utils/logger';
import { getValidatedCurrentUrl } from '../../utils/urlValidation';
import { FlowErrorService, FlowErrorConfig } from '../../services/flowErrorService';

const CallbackContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
  text-align: center;
`;

const StatusCard = styled.div<{ $status: 'loading' | 'success' | 'error' }>`
  background: ${({ $status }) => {
		switch ($status) {
			case 'success':
				return '#f0fdf4';
			case 'error':
				return '#fef2f2';
			default:
				return '#f8fafc';
		}
	}};
  border: 1px solid ${({ $status }) => {
		switch ($status) {
			case 'success':
				return '#bbf7d0';
			case 'error':
				return '#fecaca';
			default:
				return '#e2e8f0';
		}
	}};
  border-radius: 0.75rem;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
`;

const StatusIcon = styled.div<{ $status: 'loading' | 'success' | 'error' }>`
  font-size: 3rem;
  color: ${({ $status }) => {
		switch ($status) {
			case 'success':
				return '#16a34a';
			case 'error':
				return '#dc2626';
			default:
				return '#6b7280';
		}
	}};
  margin-bottom: 1rem;
`;

const StatusTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1f2937;
`;

const StatusMessage = styled.p`
  color: #6b7280;
  margin-bottom: 1rem;
`;

const AuthzCallback: React.FC = () => {
	console.log('🎯 [AuthzCallback] Component loaded!', {
		url: window.location.href,
		search: window.location.search,
		timestamp: new Date().toISOString(),
	});

	const navigate = useNavigate();
	const location = useLocation();
	const { handleCallback } = useAuth();
	const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
	const [message, setMessage] = useState('Processing authorization callback...');
	const [error, setError] = useState<string | null>(null);
	const processedRef = useRef(false);

	useEffect(() => {
		// Prevent duplicate processing (especially in React Strict Mode)
		if (processedRef.current) {
			console.log('[AuthzCallback] Already processed, skipping duplicate call');
			return;
		}

		// Also check if we've already processed this specific authorization code
		const urlParams = new URLSearchParams(window.location.search);
		const code = urlParams.get('code');
		const processedCode = sessionStorage.getItem('processed_auth_code');
		
		if (code && processedCode === code) {
			console.log('[AuthzCallback] This authorization code has already been processed, skipping');
			setStatus('error');
			setMessage('This authorization code has already been used. Please start the authorization flow again.');
			return;
		}

		const processCallback = async () => {
			// Mark as processed immediately to prevent duplicate calls
			processedRef.current = true;
			
			// Store the code as processed
			if (code) {
				sessionStorage.setItem('processed_auth_code', code);
			}
			
			try {
				const currentUrl = getValidatedCurrentUrl('AuthzCallback');
				logger.auth('AuthzCallback', 'Processing authorization callback', { url: currentUrl });

				const urlObj = new URL(currentUrl);
				const queryParams = urlObj.searchParams;
				const hashParams = new URLSearchParams(
					urlObj.hash.startsWith('#') ? urlObj.hash.substring(1) : urlObj.hash
				);
				const implicitAccessToken =
					queryParams.get('access_token') || hashParams.get('access_token');
				const implicitIdToken = queryParams.get('id_token') || hashParams.get('id_token');
				const implicitError = queryParams.get('error') || hashParams.get('error');
				const implicitErrorDescription =
					queryParams.get('error_description') || hashParams.get('error_description');

				const hasCodeParam = queryParams.has('code');
				const hasImplicitPayload =
					!hasCodeParam &&
					(Boolean(implicitAccessToken) || Boolean(implicitIdToken) || Boolean(implicitError));

				if (hasImplicitPayload) {
					logger.auth('AuthzCallback', 'Implicit flow payload detected, redirecting', {
						hasAccessToken: Boolean(implicitAccessToken),
						hasIdToken: Boolean(implicitIdToken),
						hasError: Boolean(implicitError),
						fragmentLength: urlObj.hash?.length || 0,
					});

					if (implicitError) {
						logger.error('AuthzCallback', 'Implicit flow returned error parameters', {
							error: implicitError,
							errorDescription: implicitErrorDescription,
						});
					}

					navigate(
						{
							pathname: '/implicit-callback',
							search: urlObj.search,
							hash: urlObj.hash,
						},
						{ replace: true }
					);
					return;
				}

				// Check flow context first (needed for both popup and redirect flows)
				const flowContext = sessionStorage.getItem('flowContext');
				let isOAuthV3 = false;
				let isEnhancedV3 = false;
				let isV5 = false;
				let isV7 = false;
				let isMFA = false;
				let context = null;

				try {
					context = flowContext ? JSON.parse(flowContext) : null;
					isOAuthV3 = context?.flow === 'oauth-authorization-code-v3';
					isEnhancedV3 =
						context?.flow === 'enhanced-authorization-code-v3' ||
						context?.flow === 'oidc-authorization-code-v3';
					isV5 =
						context?.flow === 'oauth-authorization-code-v5' ||
						context?.flow === 'oidc-authorization-code-v5';
					isV7 =
						context?.flow === 'oauth-authorization-code-v7' ||
						context?.flow === 'oidc-authorization-code-v7';
					isMFA = context?.flow === 'pingone-complete-mfa-v7';

					console.log(' [AuthzCallback] Flow context parsing successful:', {
						flowContext: context?.flow,
						isOAuthV3,
						isEnhancedV3,
						isV5,
						isV7,
						isMFA,
						contextExists: !!context,
						rawFlowContext: flowContext,
					});
				} catch (e) {
					console.error(' [AuthzCallback] Flow context parsing failed:', e);
					console.log(' [AuthzCallback] Raw flowContext string:', flowContext);

					// Try to detect flow type from URL or other means
					const currentPath = window.location.pathname;
					if (
						currentPath.includes('enhanced-authorization-code-v3') ||
						currentPath.includes('oidc')
					) {
						isEnhancedV3 = true;
						console.log(' [AuthzCallback] Detected OIDC V3 flow from URL path');
					} else if (currentPath.includes('oauth-authorization-code-v3')) {
						isOAuthV3 = true;
						console.log(' [AuthzCallback] Detected OAuth V3 flow from URL path');
					}
				}

				console.log(' [AuthzCallback] Flow detection:', { isOAuthV3, isEnhancedV3, flowContext });

				// Check if this is a popup window
				const isPopup = window.opener && !window.opener.closed;

				if (isPopup) {
					console.log(
						' [AuthzCallback] Popup detected - extracting code/state and sending to parent'
					);

					// For popups, extract the authorization code and state directly from URL
					// DO NOT call handleCallback as that would do token exchange in the popup
					const urlParams = new URL(currentUrl).searchParams;
					const code = urlParams.get('code');
					const state = urlParams.get('state');
					const error = urlParams.get('error');
					const errorDescription = urlParams.get('error_description');

					if (error) {
						console.error(' [AuthzCallback] Authorization error in popup:', error);
						setStatus('error');
						setMessage(`Authorization failed: ${errorDescription || error}`);

						// Send error to parent window
						window.opener.postMessage(
							{
								type: isOAuthV3 ? 'OAUTH_CALLBACK' : 'oauth-callback',
								error: error,
								error_description: errorDescription || error,
							},
							window.location.origin
						);

						setTimeout(() => {
							window.close();
						}, 2000);
						return;
					}

					if (code && state) {
						console.log(
							' [AuthzCallback] Authorization successful in popup, sending code to parent'
						);
						setStatus('success');
						setMessage('Authorization successful! Closing popup...');

						// Send success with code and state to parent window
						window.opener.postMessage(
							{
								type: isOAuthV3 ? 'OAUTH_CALLBACK' : 'oauth-callback',
								code: code,
								state: state,
								success: true,
							},
							window.location.origin
						);

						setTimeout(() => {
							window.close();
						}, 1000);
						return;
					} else {
						console.error(' [AuthzCallback] Missing code or state in popup callback');
						setStatus('error');
						setMessage('Authorization failed: Missing authorization code');

						// Send error to parent window
						window.opener.postMessage(
							{
								type: isOAuthV3 ? 'OAUTH_CALLBACK' : 'oauth-callback',
								error: 'invalid_request',
								error_description: 'Missing authorization code or state',
							},
							window.location.origin
						);

						setTimeout(() => {
							window.close();
						}, 2000);
						return;
					}

					// For OAuth V3 flows, we should ONLY handle popups, not full redirects
					// OAuth V3 full redirects should be handled by the OAuth V3 flow itself
					if (isOAuthV3) {
						console.log(' [AuthzCallback] OAuth V3 flow should only use popup authorization');
						setStatus('error');
						setMessage(
							'OAuth V3 flow detected but not in popup mode. Please use popup authorization.'
						);
						return;
					}
				}

				// For non-popup flows, check if this is an Enhanced V3 or OAuth V3 flow that should defer token exchange
				console.log(' [AuthzCallback] Non-popup flow, checking for Enhanced/OAuth flow context...');

				if (flowContext) {
					try {
						console.log(' [AuthzCallback] Flow context found:', flowContext);
						console.log(' [AuthzCallback] Is Enhanced V3:', isEnhancedV3);
						console.log(' [AuthzCallback] Is OAuth V3:', isOAuthV3);

						if (isOAuthV3) {
							// For OAuth V3 full redirect, extract code and state, store them, then redirect to OAuth V3 page
							const urlParams = new URL(currentUrl).searchParams;
							const code = urlParams.get('code');
							const state = urlParams.get('state');
							const error = urlParams.get('error');

							if (error) {
								console.error(' [AuthzCallback] OAuth V3 authorization error:', error);
								setStatus('error');
								setMessage(`Authorization failed: ${urlParams.get('error_description') || error}`);
								// Redirect back to OAuth V3 flow with error
								setTimeout(() => {
									navigate(`/flows/oauth-authorization-code-v3?error=${encodeURIComponent(error)}`);
								}, 2000);
								return;
							}

							if (code && state) {
								console.log(
									' [AuthzCallback] OAuth V3 authorization successful, storing code and redirecting'
								);

								// Store the authorization code and state for OAuth V3 flow
								sessionStorage.setItem('oauth_v3_auth_code', code);
								sessionStorage.setItem('oauth_v3_state', state);

								setStatus('success');
								setMessage('Authorization successful! Redirecting back to OAuth flow...');

								// Redirect back to OAuth V3 flow at step 5 (token exchange)
								setTimeout(() => {
									navigate('/flows/oauth-authorization-code-v3?step=5');
								}, 1500);
								return;
							}
						}

						if (isV5) {
							// For V5 full redirect, extract code and state, then redirect to V5 page
							const urlParams = new URL(currentUrl).searchParams;
							const code = urlParams.get('code');
							const state = urlParams.get('state');
							const error = urlParams.get('error');

							if (error) {
								console.error(' [AuthzCallback] V5 authorization error:', error);
								setStatus('error');
								// Determine correct V5 flow based on context
								const isOIDCFlow = context?.flow === 'oidc-authorization-code-v5';
								const errorPath = isOIDCFlow
									? `/flows/oidc-authorization-code-v6?error=${encodeURIComponent(error)}`
									: `/flows/oauth-authorization-code-v6?error=${encodeURIComponent(error)}`;
								setTimeout(() => {
									navigate(errorPath);
								}, 2000);
								return;
							}

							if (code && state) {
								console.log(
									' [AuthzCallback] V5 authorization successful, redirecting with URL parameters intact'
								);

								setStatus('success');

								// Determine correct V5 flow based on context
								const isOIDCFlow = context?.flow === 'oidc-authorization-code-v5';
								const flowName = isOIDCFlow ? 'OIDC V5' : 'OAuth V5';
								setMessage(`Authorization successful! Redirecting back to ${flowName} flow...`);

								// Redirect back to correct V5 flow at step 4 (token exchange) with code and state as URL parameters
								const returnPath =
									context?.returnPath ||
									(isOIDCFlow
										? '/flows/oidc-authorization-code-v6?step=4'
										: '/flows/oauth-authorization-code-v6?step=4');
								const separator = returnPath.includes('?') ? '&' : '?';
								const fullReturnPath = `${returnPath}${separator}code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;

								setTimeout(() => {
									navigate(fullReturnPath);
								}, 1500);
								return;
							}
						}

						if (isV7) {
							// For V7 full redirect, extract code and state, then redirect to V7 page
							const urlParams = new URL(currentUrl).searchParams;
							const code = urlParams.get('code');
							const state = urlParams.get('state');
							const error = urlParams.get('error');

							if (error) {
								console.error(' [AuthzCallback] V7 authorization error:', error);
								setStatus('error');
								// Determine correct V7 flow based on context
								const isOIDCFlow = context?.flow === 'oidc-authorization-code-v7';
								const errorPath = isOIDCFlow
									? `/flows/oauth-authorization-code-v7?error=${encodeURIComponent(error)}`
									: `/flows/oauth-authorization-code-v7?error=${encodeURIComponent(error)}`;
								setTimeout(() => {
									navigate(errorPath);
								}, 2000);
								return;
							}

							if (code && state) {
								console.log(
									' [AuthzCallback] V7 authorization successful, storing code and redirecting'
								);

								// Store the authorization code and state for V7 flow
								sessionStorage.setItem('oauth_v7_auth_code', code);
								sessionStorage.setItem('oauth_v7_state', state);

								setStatus('success');

								// Determine correct V7 flow based on context
								const isOIDCFlow = context?.flow === 'oidc-authorization-code-v7';
								const flowName = isOIDCFlow ? 'OIDC V7' : 'OAuth V7';
								setMessage(`Authorization successful! Redirecting back to ${flowName} flow...`);

								// Redirect back to correct V7 flow at step 4 (token exchange)
								const returnPath =
									context?.returnPath ||
									'/flows/oauth-authorization-code-v7?step=4';

								setTimeout(() => {
									navigate(returnPath);
								}, 1500);
								return;
							}
						}

						if (isMFA) {
							// For MFA flow, extract code and state, then redirect to MFA page
							const urlParams = new URL(currentUrl).searchParams;
							const code = urlParams.get('code');
							const state = urlParams.get('state');
							const error = urlParams.get('error');
							
							// Debug: Log all URL parameters received
							console.log(' [AuthzCallback] MFA callback URL parameters:', {
								code: code ? `${code.substring(0, 10)}...` : 'MISSING',
								state: state ? `${state.substring(0, 10)}...` : 'MISSING',
								error: error || 'none',
								fullUrl: currentUrl,
								allParams: Object.fromEntries(urlParams.entries())
							});

							if (error) {
								console.error(' [AuthzCallback] MFA authorization error:', error);
								setStatus('error');
								setMessage(`Authorization failed: ${urlParams.get('error_description') || error}`);
								// Redirect back to MFA flow with error
								setTimeout(() => {
									navigate('/pingone-authentication?error=' + encodeURIComponent(error));
								}, 2000);
								return;
							}

							if (code && state) {
								console.log(' [AuthzCallback] MFA authorization successful, storing code and redirecting');
								
								// Store the authorization code and state for MFA flow
								sessionStorage.setItem('mfa_v7_auth_code', code);
								sessionStorage.setItem('mfa_v7_state', state);
								
								setStatus('success');
								setMessage('Authorization successful! Redirecting back to MFA flow...');
								
								// Redirect back to MFA flow - use the returnPath from context or default to MFA page
								// The returnPath should be set by the MFA flow when it initiates the redirect
								const returnPath = context?.returnPath || '/pingone-authentication';
								console.log(' [AuthzCallback] MFA redirecting to:', returnPath);
								setTimeout(() => {
									navigate(returnPath);
								}, 1500);
								return;
							} else {
								console.error(' [AuthzCallback] Missing code or state in MFA callback');
								setStatus('error');
								setMessage('Authorization failed: Missing authorization code');
								return;
							}
						}

						if (isEnhancedV3) {
							// Check if we've already processed this callback to prevent loops
							const callbackProcessed = sessionStorage.getItem('v3_callback_processed');
							if (callbackProcessed) {
								console.log(
									' [AuthzCallback] V3 callback already processed, preventing duplicate processing'
								);
								const returnPath =
									context?.returnPath || '/flows/enhanced-authorization-code-v3?step=5';
								navigate(returnPath);
								return;
							}

							// For V3 full redirect, extract code and state, then redirect to V3 page
							const urlParams = new URL(currentUrl).searchParams;
							const code = urlParams.get('code');
							const state = urlParams.get('state');
							const error = urlParams.get('error');

							if (error) {
								const errorDescription = urlParams.get('error_description');
								const allParams = Object.fromEntries(urlParams.entries());

								console.error(' [AuthzCallback] Authorization error in V3 full redirect:', {
									error,
									errorDescription,
									fullUrl: currentUrl,
									allParams,
									flowContext: context,
									sessionStorageKeys: Object.keys(sessionStorage),
									relevantSessionData: {
										flowContext: sessionStorage.getItem('flowContext'),
										codeVerifier: sessionStorage.getItem('oidc_v3_code_verifier'),
										state: sessionStorage.getItem('oidc_v3_state'),
										redirectUri: sessionStorage.getItem('oidc_v3_redirect_uri'),
									},
								});

								setStatus('error');
								setMessage(`Authorization failed: ${errorDescription || error}`);

								// Show user-friendly error message based on error type
								if (error === 'invalid_request') {
									console.log(' [AuthzCallback] invalid_request error details:', {
										possibleCauses: [
											'Invalid client_id',
											'Invalid redirect_uri',
											'Missing or invalid response_type',
											'Invalid scope parameters',
											'Missing PKCE parameters (code_challenge)',
											'Invalid acr_values parameter',
											'Malformed authorization URL',
										],
										checkThese: [
											'PingOne application configuration',
											'Redirect URI matches exactly',
											'Client ID is correct',
											'PKCE is enabled in PingOne',
											'Scopes are valid for your application',
											'ACR values are valid and supported by PingOne',
										],
									});

									let errorMessage = `Authorization failed: Invalid request parameters. This usually means there's an issue with the authorization URL parameters sent to PingOne. 

Common causes:
 Invalid Client ID or Redirect URI
 PKCE not enabled in PingOne application  
 Invalid scopes for your application
 Malformed authorization URL parameters`;

									// Check if this is specifically an ACR values error
									if (errorDescription?.toLowerCase().includes('acr_values')) {
										errorMessage += `

 ACR Values Error Detected:
 Invalid or unsupported acr_values parameter
 Check your Flow Configuration ACR Values settings
 Use only valid ACR values like 'urn:pingone:loa:1', 'urn:pingone:loa:2', etc.
 Remove any invalid values like '1', '2', '3' or empty strings`;
									}

									errorMessage += `

Check your PingOne application configuration and ensure all parameters match exactly.`;

									setMessage(errorMessage);
								}

								return;
							}

							if (code && state) {
								// Mark callback as processed to prevent loops
								sessionStorage.setItem('v3_callback_processed', 'true');

								// Store the authorization code for V3 to use - use flow-specific keys
								const flowType = context?.flow === 'oidc-authorization-code-v3' ? 'oidc' : 'oidc'; // Both enhanced-authorization-code-v3 and oidc-authorization-code-v3 use 'oidc'
								sessionStorage.setItem(`${flowType}_v3_auth_code`, code);
								sessionStorage.setItem(`${flowType}_v3_state`, state);

								console.log(
									` [AuthzCallback] Stored authorization code with key: ${flowType}_v3_auth_code`,
									{
										flowContext: context?.flow,
										flowType,
										codeStored: true,
										stateStored: true,
										callbackMarkedProcessed: true,
									}
								);

								console.log(
									' [AuthzCallback] V3 full redirect - stored code and redirecting to V3 page'
								);
								setStatus('success');
								setMessage('Authorization successful! Redirecting to V3 flow...');

								// Redirect to V3 page
								const returnPath =
									context?.returnPath || '/flows/enhanced-authorization-code-v3?step=5';
								setTimeout(() => {
									navigate(returnPath);
								}, 1500);
								return;
							} else {
								console.error(' [AuthzCallback] Missing code or state in V3 full redirect');
								setStatus('error');
								setMessage('Authorization failed: Missing authorization code');
								return;
							}
						}
					} catch (e) {
						console.warn('Failed to parse flow context in AuthzCallback:', e);
					}
				}

				// For non-Enhanced flows, proceed with normal handleCallback
				console.log(' [AuthzCallback] Not an Enhanced V3 flow, proceeding with handleCallback');
				const result = await handleCallback(currentUrl);

				if (result.success) {
					setStatus('success');
					setMessage('Authorization successful! Redirecting...');
					logger.auth('AuthzCallback', 'Authorization successful', {
						redirectUrl: result.redirectUrl,
					});

					console.log(' [AuthzCallback] Redirect URL from result:', result.redirectUrl);
					console.log(' [AuthzCallback] Current URL:', window.location.href);
					console.log(' [AuthzCallback] SessionStorage keys:', Object.keys(sessionStorage));
					console.log(
						' [AuthzCallback] Flow context in sessionStorage:',
						sessionStorage.getItem('flowContext')
					);

					// For non-popup flows, handle redirect with preserved parameters
					{
						// For non-popup, preserve the authorization code and state in the redirect URL
						const urlParams = new URL(currentUrl).searchParams;
						const code = urlParams.get('code');
						const state = urlParams.get('state');

						const redirectUrl = result.redirectUrl || '/';

						console.log(' [AuthzCallback] Debug redirect info:', {
							code: code ? `${code.substring(0, 10)}...` : 'none',
							state: state ? `${state.substring(0, 10)}...` : 'none',
							redirectUrl,
							hasEnhancedV2: redirectUrl.includes('enhanced-authorization-code-v2'),
							hasFlows: redirectUrl.includes('/flows/'),
						});

						// For Enhanced Authorization Code Flow V2 and V3, we don't need to preserve code and state in the URL
						// because the flow will handle them from the callback URL parameters
						if (
							code &&
							(redirectUrl.includes('enhanced-authorization-code-v2') ||
								redirectUrl.includes('enhanced-authorization-code-v3') ||
								redirectUrl.includes('/flows/'))
						) {
							console.log(
								' [AuthzCallback] Enhanced flow (V2/V3) detected, using return path as-is:',
								redirectUrl
							);
							// Don't modify the redirectUrl - let the flow handle the code and state from the callback
						}

						// Redirect after a short delay for non-popup
						console.log(' [AuthzCallback] Redirecting to:', redirectUrl);
						setTimeout(() => {
							navigate(redirectUrl);
						}, 1500);
					}
				} else {
					setStatus('error');
					setMessage('Authorization failed');
					setError(result.error || 'Unknown error occurred');
					logger.error('AuthzCallback', 'Authorization failed', { error: result.error });

					// For non-popup flows, the error is displayed in the UI
				}
			} catch (err) {
				setStatus('error');
				setMessage('Authorization failed');
				setError(err instanceof Error ? err.message : 'Unknown error occurred');
				logger.error('AuthzCallback', 'Error processing callback', err instanceof Error ? { error: err.message, stack: err.stack } : { error: String(err) });

				// For non-popup flows, the error is displayed in the UI
			}
		};

		processCallback();
	}, [handleCallback, navigate]);

	const getStatusIcon = () => {
		switch (status) {
			case 'success':
				return <FiCheckCircle />;
			case 'error':
				return <FiXCircle />;
			default:
				return <FiLoader className="animate-spin" />;
		}
	};

	// Detect which flow was being used to provide navigation back
	const flowInfo = useMemo(() => {
		const activeFlow = sessionStorage.getItem('active_oauth_flow');
		
		if (activeFlow) {
			return {
				path: `/flows/${activeFlow}`,
				name: activeFlow.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
			};
		}
		
		// Fallback to homepage
		return {
			path: '/',
			name: 'Home'
		};
	}, []);

	const handleStartOver = () => {
		// Clear any error state in sessionStorage
		sessionStorage.removeItem('processed_auth_code');
		sessionStorage.removeItem('callback_processed');
		
		// Navigate back to the flow
		navigate(flowInfo.path);
	};

	// If error status, use standardized error display
	if (status === 'error' && error) {
		// Extract OAuth error details from URL if present
		const urlParams = new URLSearchParams(location.search);
		const oauthError = urlParams.get('error');
		const oauthErrorDescription = urlParams.get('error_description');
		
		// Determine flow type from active_oauth_flow or flowContext
		let flowType: 'authorization-code' | 'implicit' | 'device-authorization' | 'client-credentials' | 'resource-owner-password' | 'jwt-bearer' | 'saml-bearer' | 'par' | 'rar' | 'redirectless' = 'authorization-code';
		let flowKey = 'oauth-authorization-code-v6';
		
		const activeFlow = sessionStorage.getItem('active_oauth_flow');
		if (activeFlow) {
			flowKey = activeFlow;
			
			// Determine flow type from flow key
			if (activeFlow.includes('implicit')) {
				flowType = 'implicit';
			} else if (activeFlow.includes('device')) {
				flowType = 'device-authorization';
			} else if (activeFlow.includes('par')) {
				flowType = 'par';
			} else if (activeFlow.includes('rar')) {
				flowType = 'rar';
			} else if (activeFlow.includes('redirectless')) {
				flowType = 'redirectless';
			}
		}
		
		const config: FlowErrorConfig = {
			flowType,
			flowKey,
			title: 'Authorization Failed',
			description: message,
			oauthError: oauthError || error,
			...(oauthErrorDescription && { oauthErrorDescription }),
			correlationId: urlParams.get('correlation_id') || FlowErrorService.generateCorrelationId(),
			onStartOver: handleStartOver,
			onRetry: () => window.location.reload(),
		};
		
		return FlowErrorService.getFullPageError(config);
	}

	return (
		<CallbackContainer>
			<StatusCard $status={status}>
				<StatusIcon $status={status}>{getStatusIcon()}</StatusIcon>
				<StatusTitle>
					{status === 'loading' && 'Processing Authorization'}
					{status === 'success' && 'Authorization Successful'}
					{status === 'error' && 'Authorization Failed'}
				</StatusTitle>
				<StatusMessage>{message}</StatusMessage>
			</StatusCard>
		</CallbackContainer>
	);
};

export default AuthzCallback;
