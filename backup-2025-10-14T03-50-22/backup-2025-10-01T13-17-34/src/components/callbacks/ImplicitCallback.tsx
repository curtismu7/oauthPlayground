import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FiCheckCircle, FiXCircle, FiLoader, FiAlertTriangle } from 'react-icons/fi';
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

const WarningMessage = styled.div`
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
					setError(errorDescription || error);
					logger.error('ImplicitCallback', 'Implicit grant error', { error, errorDescription });
					return;
				}

				if (accessToken || idToken) {
					// Check which flow this is from by looking for flow context
					const v5OAuthContext = sessionStorage.getItem('oauth-implicit-v5-flow-active');
					const v5OIDCContext = sessionStorage.getItem('oidc-implicit-v5-flow-active');
					const v3FlowContext =
						sessionStorage.getItem('oidc_implicit_v3_flow_context') ||
						sessionStorage.getItem('oauth2_implicit_v3_flow_context');

					if (v5OAuthContext || v5OIDCContext) {
						// This is a V5 flow - store tokens in hash and redirect back
						setStatus('success');
						setMessage('Tokens received - returning to flow');
						logger.auth('ImplicitCallback', 'V5 implicit grant received, returning to flow', {
							hasAccessToken: !!accessToken,
							hasIdToken: !!idToken,
							flow: v5OIDCContext ? 'oidc-v5' : 'oauth-v5',
						});

						setTimeout(() => {
							// Reconstruct the hash with tokens and redirect back to flow
							const targetFlow = v5OIDCContext
								? '/flows/oidc-implicit-v5'
								: '/flows/oauth-implicit-v5';
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
						// Legacy flow - show warning and redirect to dashboard
						setStatus('warning');
						setMessage('Implicit grant received (deprecated flow)');
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
				setError(err instanceof Error ? err.message : 'Unknown error occurred');
				logger.error('ImplicitCallback', 'Error processing implicit callback', err);
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

	return (
		<CallbackContainer>
			<StatusCard $status={status}>
				<StatusIcon $status={status}>{getStatusIcon()}</StatusIcon>
				<StatusTitle>
					{status === 'loading' && 'Processing Implicit Grant'}
					{status === 'success' && 'Implicit Grant Successful'}
					{status === 'error' && 'Implicit Grant Failed'}
					{status === 'warning' && 'Implicit Grant Received (Deprecated)'}
				</StatusTitle>
				<StatusMessage>{message}</StatusMessage>
				{status === 'warning' && (
					<WarningMessage>
						<strong>Security Warning:</strong> The Implicit Grant flow is deprecated and not
						recommended for new applications. Consider using the Authorization Code flow with PKCE
						instead.
					</WarningMessage>
				)}
				{error && <ErrorDetails>{error}</ErrorDetails>}
			</StatusCard>
		</CallbackContainer>
	);
};

export default ImplicitCallback;
