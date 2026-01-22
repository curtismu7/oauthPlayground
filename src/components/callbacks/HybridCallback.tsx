import React, { useEffect, useState } from 'react';
import { FiCheckCircle, FiLoader, FiXCircle } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/NewAuthContext';
import { logger } from '../../utils/logger';
import { getValidatedCurrentUrl } from '../../utils/urlValidation';

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

const HybridCallback: React.FC = () => {
	const navigate = useNavigate();
	const _location = useLocation();
	const { handleCallback } = useAuth();
	const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
	const [message, setMessage] = useState('Processing hybrid flow callback...');
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const processCallback = async () => {
			try {
				const currentUrl = getValidatedCurrentUrl('HybridCallback');
				logger.info('HybridCallback', 'Processing hybrid flow callback', { url: currentUrl });

		// #region agent log - Use safe analytics fetch
		(async () => {
			try {
				const { log } = await import('@/v8/utils/analyticsHelperV8');
				await log('HybridCallback.tsx:99', 'BEFORE parsing - raw URL components', { href: window.location.href, search: window.location.search, hash: window.location.hash, pathname: window.location.pathname }, 'debug-session', 'run1', 'A');
			} catch {
				// Silently ignore - analytics server not available
			}
		})();
		// #endregion
		
		// Parse URL parameters for hybrid flow
		// For hybrid flow: code is in query string, id_token is in fragment
		const urlParams = new URLSearchParams(window.location.search);
		const fragment = window.location.hash.substring(1);
		
		// #region agent log - Use safe analytics fetch
		(async () => {
			try {
				const { log } = await import('@/v8/utils/analyticsHelperV8');
				await log('HybridCallback.tsx:105', 'AFTER extracting fragment', { fragmentLength: fragment.length, fragmentExists: !!fragment, fragmentPreview: fragment.substring(0, 100), queryStringLength: window.location.search.length }, 'debug-session', 'run1', 'A');
			} catch {
				// Silently ignore - analytics server not available
			}
		})();
		// #endregion
		
		const fragmentParams = fragment ? new URLSearchParams(fragment) : null;
		
		// #region agent log
		// #endregion
		
		// For hybrid flow, code can be in EITHER query string OR fragment (depends on response_mode)
		// PingOne typically returns code in fragment when response_mode=fragment
		const code = fragmentParams?.get('code') || urlParams.get('code');
		const idToken = fragmentParams?.get('id_token') || urlParams.get('id_token'); // ID token is typically in fragment, fallback to query
		const accessToken = fragmentParams?.get('access_token') || null;
		const state = fragmentParams?.get('state') || urlParams.get('state'); // State can be in either
		const error = fragmentParams?.get('error') || urlParams.get('error');
		const errorDescription = fragmentParams?.get('error_description') || urlParams.get('error_description');
		
		// #region agent log
		// #endregion
		
		// #region agent log
		// #endregion

			// Log what we found for debugging
			logger.info('HybridCallback', 'Parsing hybrid callback', {
				hasCode: !!code,
				hasIdToken: !!idToken,
				hasAccessToken: !!accessToken,
				hasState: !!state,
				hasError: !!error,
				hasFragment: !!fragment,
				queryString: window.location.search,
				fragment: fragment ? fragment.substring(0, 200) : null,
				fullUrl: currentUrl.substring(0, 300),
			});

			if (error) {
				setStatus('error');
				setMessage('Hybrid flow failed');
				setError(errorDescription || error);
				logger.error('HybridCallback', 'OAuth error in hybrid callback', {
					error,
					errorDescription,
				});
				return;
			}

			// For hybrid flow, we need at least code OR id_token (not necessarily both)
			if (code || idToken) {
				// Determine if this is a unified flow callback
				const isUnifiedFlow = state && state.startsWith('v8u-hybrid-');
				
				// Store tokens in sessionStorage for the hybrid flow component to pick up
				const tokens: Record<string, string | null> = {
					state: state,
				};

				if (code) {
					tokens.authorization_code = code;
				}
				if (idToken) {
					tokens.id_token = idToken;
				}
				if (accessToken) {
					tokens.access_token = accessToken;
				}

				// Store in legacy format for backward compatibility
				sessionStorage.setItem('hybrid_tokens', JSON.stringify(tokens));
				sessionStorage.setItem(
					'oidc_hybrid_v3_callback_data',
					JSON.stringify({
						...(code && { code }),
						...(idToken && { id_token: idToken }),
						...(accessToken && { access_token: accessToken }),
						...(state && { state }),
						timestamp: Date.now(),
					})
				);
				
				// Store in unified flow format if this is a unified flow callback
				if (isUnifiedFlow) {
					const fullUrl = window.location.href;
					const callbackData = {
						code: code || undefined,
						state: state || undefined,
						error: undefined,
						errorDescription: undefined,
						fullUrl,
						timestamp: Date.now(),
						flowType: 'hybrid' as const,
					};
					
					// Also include tokens if present (for hybrid flow, tokens come in fragment)
					if (idToken || accessToken) {
						// Store tokens separately for unified flow
						const unifiedTokens = {
							access_token: accessToken || undefined,
							id_token: idToken || undefined,
							state: state || undefined,
							extractedAt: Date.now(),
						};
						sessionStorage.setItem('v8u_implicit_tokens', JSON.stringify(unifiedTokens));
					}
					
					sessionStorage.setItem('v8u_callback_data', JSON.stringify(callbackData));
					
					// #region agent log
					// #endregion
				}

				setStatus('success');
				if (code && idToken) {
					setMessage('Hybrid flow successful! Authorization code and ID token received. Redirecting to flow...');
				} else if (code) {
					setMessage('Authorization code received! Redirecting to flow...');
				} else if (idToken) {
					setMessage('ID token received! Redirecting to flow...');
				}

				logger.success('HybridCallback', 'Hybrid flow successful, stored tokens', {
					hasCode: !!code,
					hasIdToken: !!idToken,
					hasAccessToken: !!accessToken,
				});

				// Determine target route based on state prefix
				// Unified flow uses "v8u-hybrid-" prefix in state
				// Note: isUnifiedFlow is already declared above (line 162)
				let targetRoute: string;
				
				// #region agent log
				// #endregion
				
				if (isUnifiedFlow) {
					// Unified flow - redirect to step 3 (callback handling step)
					targetRoute = '/v8u/unified/hybrid/3';
					logger.info('HybridCallback', 'Detected unified flow, redirecting to unified route', {
						state,
						targetRoute,
					});
				} else {
					// Legacy flow - check which version is active
					const isV5Flow = sessionStorage.getItem('oidc-hybrid-v5-flow-active');
					targetRoute = isV5Flow ? '/flows/oidc-hybrid-v6' : '/flows/oidc-hybrid-v3';
					
					// Clean up flow-active flag
					if (isV5Flow) {
						sessionStorage.removeItem('oidc-hybrid-v5-flow-active');
					}
					
					logger.info('HybridCallback', 'Detected legacy flow, redirecting to legacy route', {
						targetRoute,
					});
				}
				
				// #region agent log
				// #endregion

				// Redirect to the appropriate hybrid flow page
				// For unified flow, preserve the fragment in the URL (tokens come in fragment)
				setTimeout(() => {
					// #region agent log
					// #endregion
					
					if (isUnifiedFlow && window.location.hash) {
						// Preserve fragment for unified flow (tokens are in fragment)
						const redirectUrl = `${targetRoute}${window.location.hash}`;
						logger.info('HybridCallback', 'Redirecting with fragment preserved', {
							redirectUrl: redirectUrl.substring(0, 200),
						});
						
						// #region agent log
						// #endregion
						
						// Use window.location.replace to preserve fragment (React Router navigate doesn't preserve fragments reliably)
						window.location.replace(redirectUrl);
					} else {
						// #region agent log
						// #endregion
						
						navigate(targetRoute);
					}
				}, 1500);
			} else {
				setStatus('error');
				setMessage('No authorization code or ID token found');
				setError('Expected authorization code and/or ID token in callback URL');
				logger.error('HybridCallback', 'No code or id_token in hybrid callback', {
					hasCode: !!code,
					hasIdToken: !!idToken,
					hasAccessToken: !!accessToken,
					url: currentUrl,
					queryString: window.location.search,
					fragment: fragment ? fragment.substring(0, 200) : null,
				});
			}
			} catch (err) {
				setStatus('error');
				setMessage('Hybrid flow failed');
				setError(err instanceof Error ? err.message : 'Unknown error occurred');
				logger.error('HybridCallback', 'Error processing hybrid callback', err);
			}
		};

		processCallback();
	}, [navigate]);

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

	return (
		<CallbackContainer>
			<StatusCard $status={status}>
				<StatusIcon $status={status}>{getStatusIcon()}</StatusIcon>
				<StatusTitle>
					{status === 'loading' && 'Processing Hybrid Flow'}
					{status === 'success' && 'Hybrid Flow Successful'}
					{status === 'error' && 'Hybrid Flow Failed'}
				</StatusTitle>
				<StatusMessage>{message}</StatusMessage>
				{error && <ErrorDetails>{error}</ErrorDetails>}
			</StatusCard>
		</CallbackContainer>
	);
};

export default HybridCallback;
