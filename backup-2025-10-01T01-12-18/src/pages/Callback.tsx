import { useEffect, useState } from 'react';
import { FiAlertCircle, FiCheckCircle, FiLoader } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/NewAuthContext';
import { v4ToastManager } from '../utils/v4ToastMessages';

const CallbackContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
  background-color: ${({ theme }) => theme.colors.gray100};
`;

const Card = styled.div`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 3rem 2rem;
  width: 100%;
  max-width: 500px;
`;

const Spinner = styled(FiLoader)`
  animation: spin 1s linear infinite;
  font-size: 3rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 1.5rem;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const SuccessIcon = styled(FiCheckCircle)`
  font-size: 3rem;
  color: ${({ theme }) => theme.colors.success};
  margin-bottom: 1.5rem;
`;

const ErrorIcon = styled(FiAlertCircle)`
  font-size: 3rem;
  color: ${({ theme }) => theme.colors.danger};
  margin-bottom: 1.5rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray900};
  margin-bottom: 1rem;
`;

const Message = styled.p`
  color: ${({ theme }) => theme.colors.gray600};
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  color: white;
  background-color: ${({ theme }) => theme.colors.primary};
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s;
  text-decoration: none;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
    text-decoration: none;
  }
`;

const Callback = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { handleCallback } = useAuth();
	const [status, setStatus] = useState('processing');
	const [error, setError] = useState('');
	const [hasProcessed, setHasProcessed] = useState(false);

	useEffect(() => {
		const processCallback = async () => {
			// Prevent multiple processing attempts
			if (hasProcessed) {
				console.log(' [Callback] Callback already processed, skipping...');
				return;
			}

			setHasProcessed(true);

			try {
				console.log(' [Callback] Starting OAuth callback processing...');
				console.log(' [Callback] Current URL:', window.location.href);
				console.log(' [Callback] Location details:', {
					href: window.location.href,
					pathname: window.location.pathname,
					search: window.location.search,
					hash: window.location.hash,
					origin: window.location.origin,
				});

				// Get the full URL with query parameters
				const urlParams: Record<string, string> = {};
				for (const [key, value] of searchParams.entries()) {
					urlParams[key] = value;
				}

				console.log(' [Callback] URL parameters:', urlParams);

				// Check sessionStorage for stored values
				const storedState = sessionStorage.getItem('oauth_state');
				const storedCodeVerifier = sessionStorage.getItem('code_verifier');
				const storedRedirectAfterLogin = sessionStorage.getItem('oauth_redirect_after_login');

				console.log(' [Callback] SessionStorage values:', {
					hasStoredState: !!storedState,
					hasStoredCodeVerifier: !!storedCodeVerifier,
					hasStoredRedirectAfterLogin: !!storedRedirectAfterLogin,
					storedState: storedState?.substring(0, 8) + '...',
					storedCodeVerifier: storedCodeVerifier?.substring(0, 20) + '...',
					storedRedirectAfterLogin,
				});

				// Check for error in the URL (e.g., user denied permission)
				if (urlParams.error) {
					console.error(
						' [Callback] OAuth error in URL:',
						urlParams.error,
						urlParams.error_description
					);
					let errorMessage = urlParams.error_description || 'Authorization failed';

					// Handle PingOne-specific errors with user-friendly messages
					if (urlParams.error === 'NOT_FOUND') {
						errorMessage =
							'Configuration Issue: The PingOne environment or application could not be found. Please check your Environment ID and ensure your PingOne application is properly configured.';
					} else if (urlParams.error === 'invalid_request') {
						errorMessage =
							'Invalid Request: The authorization request was malformed. Please try again or contact support if the issue persists.';
					} else if (urlParams.error === 'unauthorized_client') {
						errorMessage =
							'Unauthorized Client: Your application is not authorized to make this request. Please check your Client ID configuration.';
					} else if (urlParams.error === 'access_denied') {
						errorMessage =
							'Access Denied: The user denied the authorization request or the request was cancelled.';
					} else if (urlParams.error === 'unsupported_response_type') {
						errorMessage =
							'Configuration Error: The requested response type is not supported. Please contact support.';
					} else if (urlParams.error === 'invalid_scope') {
						errorMessage =
							'Invalid Scope: The requested permissions are not valid. Please check your scope configuration.';
					} else if (urlParams.error === 'server_error') {
						errorMessage =
							'Server Error: PingOne encountered an internal error. Please try again later.';
					} else if (urlParams.error === 'temporarily_unavailable') {
						errorMessage =
							'Service Unavailable: PingOne is temporarily unavailable. Please try again later.';
					}

					// If this is a popup, send error to parent and close
					if (window.opener && !window.opener.closed) {
						console.log(' [Callback] Sending error message to parent window');
						window.opener.postMessage(
							{
								type: 'oauth-callback',
								error: urlParams.error,
								error_description: errorMessage,
							},
							window.location.origin
						);
						setTimeout(() => {
							window.close();
						}, 1000);
						setStatus('error');
						setError(errorMessage);
						v4ToastManager.showError('networkError');
						return;
					}

					throw new Error(errorMessage);
				}

				// Check if we have the required parameters
				if (!urlParams.code) {
					console.error(' [Callback] No authorization code in URL parameters');
					console.error(' [Callback] Available parameters:', Object.keys(urlParams));

					// If we're on the callback page but have no OAuth parameters, this might be a direct navigation
					if (Object.keys(urlParams).length === 0) {
						throw new Error(
							'This appears to be a direct navigation to the callback page. Please start the OAuth flow from the Authorization Code Flow page.'
						);
					}

					throw new Error(
						'No authorization code received. The OAuth flow may have been interrupted.'
					);
				}

				console.log(' [Callback] Authorization code found, processing callback...');

				// Check if this is a popup window and send message to parent
				if (window.opener && !window.opener.closed) {
					console.log(' [Callback] Sending message to parent window');
					window.opener.postMessage(
						{
							type: 'oauth-callback',
							code: urlParams.code,
							state: urlParams.state,
							error: urlParams.error,
							error_description: urlParams.error_description,
						},
						window.location.origin
					);

					// Close the popup after a brief delay
					setTimeout(() => {
						window.close();
					}, 1000);

					setStatus('success');
					return;
				}

				// Ensure minimum spinner time while processing callback
				const start = Date.now();

				// Validate the current URL before passing to handleCallback
				const currentUrl = getValidatedCurrentUrl('Callback');
				console.log(' [Callback] Current URL for handleCallback:', currentUrl);

				const result = await handleCallback(currentUrl);
				const elapsed = Date.now() - start;
				const remaining = Math.max(2000 - elapsed, 0);
				if (remaining > 0) {
					await new Promise((res) => setTimeout(res, remaining));
				}

				// If we reach here, authentication was successful
				console.log(' [Callback] Authentication successful');
				setStatus('success');

				// Get the redirect URL from the callback result
				const redirectUrl = result.redirectUrl || '/dashboard';

				console.log(' [Callback] Redirecting to:', redirectUrl);

				// Brief success state before navigating
				setTimeout(() => {
					navigate(redirectUrl, { replace: true });
				}, 1500);
			} catch (err) {
				console.error(' [Callback] OAuth callback error:', err);
				setStatus('error');
				const errorMessage =
					err instanceof Error ? err.message : 'An error occurred during authentication';
				setError(errorMessage);
				v4ToastManager.showError('networkError');
			}
		};

		processCallback();
	}, [searchParams, navigate, handleCallback, hasProcessed]);

	const handleRetry = () => {
		// Redirect to the login page to start the flow again
		navigate('/login');
	};

	const handleGoToDashboard = () => {
		navigate('/dashboard', { replace: true });
	};

	if (status === 'processing') {
		return (
			<CallbackContainer>
				<Card>
					<Spinner />
					<Title>Completing Authentication</Title>
					<Message>Please wait while we complete your login...</Message>
				</Card>
			</CallbackContainer>
		);
	}

	if (status === 'success') {
		return (
			<CallbackContainer>
				<Card>
					<SuccessIcon />
					<Title>Authentication Successful</Title>
					<Message>
						You have been successfully authenticated. Redirecting to the dashboard...
					</Message>
					<Button onClick={handleGoToDashboard}>Go to Dashboard</Button>
				</Card>
			</CallbackContainer>
		);
	}

	// Error state
	return (
		<CallbackContainer>
			<Card>
				<ErrorIcon />
				<Title>Authentication Failed</Title>
				<Message>
					{error || 'An error occurred during the authentication process. Please try again.'}
				</Message>
				<Button onClick={handleRetry}>Try Again</Button>
			</Card>
		</CallbackContainer>
	);
};

export default Callback;
