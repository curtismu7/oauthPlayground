import React, { useEffect, useState } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiLoader, FiXCircle } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FlowErrorConfig, FlowErrorService } from '../../services/flowErrorService';
import { logger } from '../../utils/logger';

const CallbackContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
  text-align: center;
`;

const StatusCard = styled.div<{ $status: 'loading' | 'success' | 'error' | 'warning' }>`
  background: ${({ $status }) => {
		switch ($status) {
			case 'success':
				return '#f0fdf4';
			case 'error':
				return '#fef2f2';
			case 'warning':
				return '#fffbeb';
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
			case 'warning':
				return '#fed7aa';
			default:
				return '#e2e8f0';
		}
	}};
  border-radius: 0.75rem;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
`;

const StatusIcon = styled.div<{ $status: 'loading' | 'success' | 'error' | 'warning' }>`
  font-size: 3rem;
  color: ${({ $status }) => {
		switch ($status) {
			case 'success':
				return '#16a34a';
			case 'error':
				return '#dc2626';
			case 'warning':
				return '#d97706';
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

const _WarningMessage = styled.div`
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
  text-align: left;
`;

const ErrorDetails = styled.pre`
  background: #f3f4f6;
  color: #1f2937;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 1rem;
  font-size: 0.875rem;
  text-align: left;
  overflow-x: auto;
  margin-top: 1rem;
`;

const ImplicitCallback: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'warning'>('loading');
	const [message, setMessage] = useState('Processing implicit grant callback...');
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const processCallback = async () => {
			try {
				logger.auth('ImplicitCallback', 'Processing implicit grant callback', {
					url: window.location.href,
				});

				// Check both query parameters and hash parameters (implicit flows can use either)
				const queryParams = new URLSearchParams(location.search);
				const hashParams = new URLSearchParams(window.location.hash.substring(1));

				// Debug logging to see what we're parsing
				console.log(' [ImplicitCallback] Debug parsing:', {
					hash: window.location.hash,
					hashSubstring: window.location.hash.substring(1),
					queryParams: Object.fromEntries(queryParams.entries()),
					hashParams: Object.fromEntries(hashParams.entries()),
				});

				// Get tokens from either query params or hash params
				const accessToken = queryParams.get('access_token') || hashParams.get('access_token');
				const idToken = queryParams.get('id_token') || hashParams.get('id_token');
				const error = queryParams.get('error') || hashParams.get('error');
				const errorDescription =
					queryParams.get('error_description') || hashParams.get('error_description');

				if (error) {
					setStatus('error');
					setMessage('Implicit grant failed');
					const errorMsg = errorDescription || error || 'Unknown error';
					setError(errorMsg);

					// DEBUG: Enhanced error logging with full URL details
					console.error('🔴 [ImplicitCallback] Implicit grant error:', {
						error,
						errorDescription,
						fullUrl: window.location.href,
						hash: window.location.hash,
						search: window.location.search,
						queryParams: Object.fromEntries(queryParams.entries()),
						hashParams: Object.fromEntries(hashParams.entries()),
					});

					logger.error('ImplicitCallback', 'Implicit grant error', {
						error,
						errorDescription,
						url: window.location.href,
						hash: window.location.hash?.substring(0, 200), // Limit hash length for logging
					});
					return;
				}

				if (accessToken || idToken) {
					// FIRST: Check if this is a V8U unified flow by checking state parameter
					// This must be done BEFORE checking flow contexts because V8U doesn't use sessionStorage contexts
					const stateParam = hashParams.get('state');
					if (stateParam?.startsWith('v8u-implicit-')) {
						// V8U Unified Flow - redirect to CallbackHandlerV8U with fragment preserved
						logger.auth(
							'ImplicitCallback',
							'V8U unified flow detected - redirecting to unified callback handler',
							{
								state: stateParam,
								hasAccessToken: !!accessToken,
								hasIdToken: !!idToken,
							}
						);

						// Use window.location.replace for immediate redirect with fragment
						window.location.replace(`/authz-callback${window.location.hash}`);
						return; // Exit early
					}

					// Check which flow this is from by looking for flow context
					// DEBUG: V8 flows store context as 'implicit-v8-flow-active'
					const v8Context = sessionStorage.getItem('implicit-v8-flow-active');
					const v7Context =
						sessionStorage.getItem('implicit-flow-v7-oauth-active') ||
						sessionStorage.getItem('implicit-flow-v7-oidc-active');
					const v6OAuthContext = sessionStorage.getItem('oauth-implicit-v6-flow-active');
					const v6OIDCContext = sessionStorage.getItem('oidc-implicit-v6-flow-active');
					const v5OAuthContext = sessionStorage.getItem('oauth-implicit-v5-flow-active');
					const v5OIDCContext = sessionStorage.getItem('oidc-implicit-v5-flow-active');
					const v3FlowContext =
						sessionStorage.getItem('oidc_implicit_v3_flow_context') ||
						sessionStorage.getItem('oauth2_implicit_v3_flow_context');

					if (v8Context) {
						// DEBUG: This is a V8 flow - redirect back to V8 flow with tokens
						setStatus('success');
						setMessage('Tokens received - returning to V8 flow');

						try {
							const parsedContext = JSON.parse(v8Context);

							logger.auth('ImplicitCallback', 'V8 implicit grant received, returning to flow', {
								hasAccessToken: !!accessToken,
								hasIdToken: !!idToken,
								responseType: parsedContext.responseType,
								flow: 'implicit-v8',
							});

							setTimeout(() => {
								// Redirect to V8 flow with fragment containing tokens
								const fragment = window.location.hash.substring(1); // Get full hash without #
								navigate(`/flows/implicit-v8?step=TOKENS#${fragment}`);
							}, 1500);
						} catch (parseError) {
							console.error('[ImplicitCallback] Failed to parse V8 flow context:', parseError);
							// Fall through to legacy handling
							setStatus('warning');
							setMessage('Implicit grant received (could not parse flow context)');
							setTimeout(() => {
								navigate('/flows/implicit-v8');
							}, 2000);
						}
					} else if (v7Context) {
						// This is a V7 flow - determine variant and redirect back
						setStatus('success');
						setMessage('Tokens received - returning to unified flow');

						const isOIDCFlow = v7Context === 'implicit-flow-v7-oidc-active';

						logger.auth(
							'ImplicitCallback',
							'V7 implicit grant received, returning to unified flow',
							{
								hasAccessToken: !!accessToken,
								hasIdToken: !!idToken,
								variant: isOIDCFlow ? 'oidc' : 'oauth',
							}
						);

						setTimeout(() => {
							// Redirect to the unified V7 flow with fragment
							const fragment = window.location.hash.substring(1);
							navigate(`/flows/implicit-v7#${fragment}`);
						}, 1500);
					} else if (v6OAuthContext || v6OIDCContext) {
						// This is a V6 flow - store tokens in hash and redirect back
						setStatus('success');
						setMessage('Tokens received - returning to flow');

						// Determine which flow this is from
						const isOIDCFlow = v6OIDCContext;

						logger.auth('ImplicitCallback', 'V6 implicit grant received, returning to flow', {
							hasAccessToken: !!accessToken,
							hasIdToken: !!idToken,
							flow: isOIDCFlow ? 'oidc-v6' : 'oauth-v6',
						});

						setTimeout(() => {
							// Reconstruct the hash with tokens and redirect back to flow
							const targetFlow = isOIDCFlow
								? '/flows/oidc-implicit-v6'
								: '/flows/oauth-implicit-v6';
							const fragment = window.location.hash.substring(1); // Get full hash without #
							navigate(`${targetFlow}#${fragment}`);
						}, 1500);
					} else if (v5OAuthContext || v5OIDCContext) {
						// This is a V5 flow - store tokens in hash and redirect back
						setStatus('success');
						setMessage('Tokens received - returning to flow');

						// Determine which flow this is from
						const isOIDCFlow = v5OIDCContext && !v5OAuthContext;

						logger.auth('ImplicitCallback', 'V5 implicit grant received, returning to flow', {
							hasAccessToken: !!accessToken,
							hasIdToken: !!idToken,
							flow: isOIDCFlow ? 'oidc-v5' : 'oauth-v5',
							oauthContext: !!v5OAuthContext,
							oidcContext: !!v5OIDCContext,
						});

						setTimeout(() => {
							// Reconstruct the hash with tokens and redirect back to flow
							// V5 flows now redirect to V6 flows
							const targetFlow = isOIDCFlow
								? '/flows/oidc-implicit-v6'
								: '/flows/oauth-implicit-v6';
							const fragment = window.location.hash.substring(1); // Get full hash without #
							navigate(`${targetFlow}#${fragment}`);
						}, 1500);
					} else if (v3FlowContext) {
						// This is a V3 flow - return to the flow page
						setStatus('success');
						setMessage('Implicit grant received - returning to flow');
						logger.auth('ImplicitCallback', 'V3 implicit grant received, returning to flow', {
							hasAccessToken: !!accessToken,
							hasIdToken: !!idToken,
						});

						// Store tokens and return to flow
						const tokens = { access_token: accessToken, id_token: idToken };
						sessionStorage.setItem('implicit_tokens', JSON.stringify(tokens));

						setTimeout(() => {
							// Return to the implicit flow page at step 4 (token processing)
							const currentPath = window.location.pathname;
							if (currentPath.includes('oidc')) {
								navigate('/flows/oidc-implicit-v3?step=4');
							} else {
								navigate('/flows/oauth2-implicit-v3?step=4');
							}
						}, 2000);
					} else {
						// Legacy flow - show success and redirect to dashboard
						setStatus('success');
						setMessage('Implicit grant received successfully');
						logger.auth('ImplicitCallback', 'Legacy implicit grant received', {
							hasAccessToken: !!accessToken,
							hasIdToken: !!idToken,
						});

						setTimeout(() => {
							navigate('/');
						}, 3000);
					}
				} else {
					setStatus('error');
					setMessage('No tokens received');
					setError('Expected access_token or id_token in callback URL');
					logger.error('ImplicitCallback', 'No tokens in callback', { url: window.location.href });
				}
			} catch (err) {
				setStatus('error');
				setMessage('Implicit grant failed');
				const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
				setError(errorMessage);
				logger.error('ImplicitCallback', 'Error processing implicit callback', {
					error: errorMessage,
					url: window.location.href,
				});
			}
		};

		processCallback();
	}, [location.search, navigate]);

	const getStatusIcon = () => {
		switch (status) {
			case 'success':
				return <FiCheckCircle />;
			case 'error':
				return <FiXCircle />;
			case 'warning':
				return <FiAlertTriangle />;
			default:
				return <FiLoader className="animate-spin" />;
		}
	};

	// If error status, use standardized error display
	if (status === 'error' && error) {
		// Extract OAuth error details from URL if present
		const queryParams = new URLSearchParams(location.search);
		const hashParams = new URLSearchParams(window.location.hash.substring(1));
		const oauthError = queryParams.get('error') || hashParams.get('error');
		const oauthErrorDescription =
			queryParams.get('error_description') || hashParams.get('error_description');

		// Determine flow type from session storage
		// DEBUG: Check for V8 flow context first (newest)
		let flowKey = 'implicit-v8';
		const v8Context = sessionStorage.getItem('implicit-v8-flow-active');
		const v6OAuthContext = sessionStorage.getItem('oauth-implicit-v6-flow-active');
		const v6OIDCContext = sessionStorage.getItem('oidc-implicit-v6-flow-active');
		const v5OAuthContext = sessionStorage.getItem('oauth-implicit-v5-flow-active');
		const v5OIDCContext = sessionStorage.getItem('oidc-implicit-v5-flow-active');

		if (v8Context) {
			// V8 flow - determine if OAuth or OIDC from context
			try {
				const parsed = JSON.parse(v8Context);
				flowKey = parsed.responseType === 'oidc' ? 'implicit-v8' : 'implicit-v8';
			} catch {
				flowKey = 'implicit-v8';
			}
		} else if (v6OIDCContext || v5OIDCContext) {
			flowKey = 'oidc-implicit-v6';
		} else if (v6OAuthContext || v5OAuthContext) {
			flowKey = 'oauth-implicit-v6';
		} else {
			flowKey = 'oauth-implicit-v6'; // Default fallback
		}

		const config: FlowErrorConfig = {
			flowType: 'implicit' as const,
			flowKey,
			title: 'Implicit Grant Failed',
			description: message,
			oauthError: oauthError || error,
			...(oauthErrorDescription && { oauthErrorDescription }),
			correlationId: FlowErrorService.generateCorrelationId(),
			onStartOver: () => {
				sessionStorage.removeItem('processed_auth_code');
				sessionStorage.removeItem('callback_processed');
				navigate(`/flows/${flowKey}`);
			},
			onRetry: () => window.location.reload(),
		};

		return FlowErrorService.getFullPageError(config);
	}

	return (
		<CallbackContainer>
			<StatusCard $status={status}>
				<StatusIcon $status={status}>{getStatusIcon()}</StatusIcon>
				<StatusTitle>
					{status === 'loading' && 'Processing Implicit Grant'}
					{status === 'success' && 'Implicit Grant Successful'}
					{status === 'error' && 'Implicit Grant Failed'}
				</StatusTitle>
				<StatusMessage>{message}</StatusMessage>
				{error && <ErrorDetails>{error}</ErrorDetails>}
			</StatusCard>
		</CallbackContainer>
	);
};

export default ImplicitCallback;
