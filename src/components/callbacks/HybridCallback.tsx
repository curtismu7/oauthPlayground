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

		// #region agent log
		fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HybridCallback.tsx:99',message:'BEFORE parsing - raw URL components',data:{href:window.location.href,search:window.location.search,hash:window.location.hash,pathname:window.location.pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
		// #endregion
		
		// Parse URL parameters for hybrid flow
		// For hybrid flow: code is in query string, id_token is in fragment
		const urlParams = new URLSearchParams(window.location.search);
		const fragment = window.location.hash.substring(1);
		
		// #region agent log
		fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HybridCallback.tsx:105',message:'AFTER extracting fragment',data:{fragmentLength:fragment.length,fragmentExists:!!fragment,fragmentPreview:fragment.substring(0,100),queryStringLength:window.location.search.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
		// #endregion
		
		const fragmentParams = fragment ? new URLSearchParams(fragment) : null;
		
		// #region agent log
		fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HybridCallback.tsx:108',message:'AFTER creating URLSearchParams',data:{fragmentParamsExists:!!fragmentParams,urlParamsSize:urlParams.size,fragmentParamsSize:fragmentParams?.size||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
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
		fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HybridCallback.tsx:118',message:'AFTER fix - code extraction',data:{codeFromFragment:fragmentParams?.get('code')||null,codeFromQuery:urlParams.get('code'),finalCode:code,codeSource:fragmentParams?.get('code')?'fragment':'query'},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'FIX'})}).catch(()=>{});
		// #endregion
		
		// #region agent log
		fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HybridCallback.tsx:115',message:'AFTER extracting all parameters',data:{hasCode:!!code,codeLength:code?.length||0,hasIdToken:!!idToken,idTokenLength:idToken?.length||0,hasAccessToken:!!accessToken,hasState:!!state,hasError:!!error,allQueryParams:Array.from(urlParams.keys()),allFragmentParams:fragmentParams?Array.from(fragmentParams.keys()):[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
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
					fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HybridCallback.tsx:200',message:'Stored unified flow callback data',data:{hasCode:!!code,hasIdToken:!!idToken,hasAccessToken:!!accessToken,flowType:'hybrid'},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'STORAGE'})}).catch(()=>{});
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
				fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HybridCallback.tsx:239',message:'Determining redirect route',data:{state,isUnifiedFlow,stateStartsWithV8u:state?.startsWith('v8u-hybrid-')},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'REDIRECT'})}).catch(()=>{});
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
				fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HybridCallback.tsx:225',message:'Redirect route determined',data:{targetRoute,isUnifiedFlow},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'REDIRECT'})}).catch(()=>{});
				// #endregion

				// Redirect to the appropriate hybrid flow page
				// For unified flow, preserve the fragment in the URL (tokens come in fragment)
				setTimeout(() => {
					// #region agent log
					fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HybridCallback.tsx:270',message:'BEFORE navigation',data:{targetRoute,isUnifiedFlow,hasFragment:!!window.location.hash,fragment:window.location.hash.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'NAVIGATION'})}).catch(()=>{});
					// #endregion
					
					if (isUnifiedFlow && window.location.hash) {
						// Preserve fragment for unified flow (tokens are in fragment)
						const redirectUrl = `${targetRoute}${window.location.hash}`;
						logger.info('HybridCallback', 'Redirecting with fragment preserved', {
							redirectUrl: redirectUrl.substring(0, 200),
						});
						
						// #region agent log
						fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HybridCallback.tsx:278',message:'Calling window.location.replace',data:{redirectUrl:redirectUrl.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'NAVIGATION'})}).catch(()=>{});
						// #endregion
						
						// Use window.location.replace to preserve fragment (React Router navigate doesn't preserve fragments reliably)
						window.location.replace(redirectUrl);
					} else {
						// #region agent log
						fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HybridCallback.tsx:283',message:'Calling navigate',data:{targetRoute},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'NAVIGATION'})}).catch(()=>{});
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
