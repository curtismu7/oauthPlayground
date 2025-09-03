import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { FiLoader, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../contexts/NewAuthContext';

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
        console.log('🔄 [Callback] Callback already processed, skipping...');
        return;
      }
      
      setHasProcessed(true);
      
      try {
        console.log('🚀 [Callback] ===== OAUTH CALLBACK DEBUG START =====');
        console.log('🔍 [Callback] Processing OAuth callback...');
        console.log('🔍 [Callback] Current URL:', window.location.href);
        console.log('🔍 [Callback] URL pathname:', window.location.pathname);
        console.log('🔍 [Callback] URL search:', window.location.search);
        console.log('🔍 [Callback] URL hash:', window.location.hash);
        console.log('🔍 [Callback] SearchParams entries:', Array.from(searchParams.entries()));
        
        // Get parameters from both query string and URL fragment
        const urlParams: Record<string, string> = {};
        const queryParams: Record<string, string> = {};
        const fragmentParams: Record<string, string> = {};
        
        // Get query parameters (Authorization Code Flow)
        console.log('🔍 [Callback] Parsing query parameters...');
        for (const [key, value] of searchParams.entries()) {
          urlParams[key] = value;
          queryParams[key] = value;
          console.log(`  📝 Query param: ${key} = ${value}`);
        }
        
        // Get URL fragment parameters (Implicit Grant Flow)
        console.log('🔍 [Callback] Parsing URL fragment...');
        if (window.location.hash) {
          const fragment = window.location.hash.substring(1); // Remove the #
          console.log('🔍 [Callback] Raw fragment (without #):', fragment);
          const fragmentParamsObj = new URLSearchParams(fragment);
          for (const [key, value] of fragmentParamsObj.entries()) {
            urlParams[key] = value;
            fragmentParams[key] = value;
            console.log(`  📝 Fragment param: ${key} = ${value}`);
          }
        } else {
          console.log('🔍 [Callback] No URL fragment found');
        }
        
        console.log('🔍 [Callback] ===== PARSED PARAMETERS =====');
        console.log('🔍 [Callback] All URL parameters (merged):', urlParams);
        console.log('🔍 [Callback] Query parameters only:', queryParams);
        console.log('🔍 [Callback] Fragment parameters only:', fragmentParams);
        console.log('🔍 [Callback] Parameter count - Total:', Object.keys(urlParams).length, 'Query:', Object.keys(queryParams).length, 'Fragment:', Object.keys(fragmentParams).length);
        
        // Check for error in the URL (e.g., user denied permission)
        if (urlParams.error) {
          console.error('❌ [Callback] OAuth error in URL:', urlParams.error, urlParams.error_description);
          let errorMessage = urlParams.error_description || 'Authorization failed';
          
          // Handle PingOne-specific errors with user-friendly messages
          if (urlParams.error === 'NOT_FOUND') {
            errorMessage = 'Configuration Issue: The PingOne environment or application could not be found. Please check your Environment ID and ensure your PingOne application is properly configured.';
          } else if (urlParams.error === 'invalid_request') {
            errorMessage = 'Invalid Request: The authorization request was malformed. Please try again or contact support if the issue persists.';
          } else if (urlParams.error === 'unauthorized_client') {
            errorMessage = 'Unauthorized Client: Your application is not authorized to make this request. Please check your Client ID configuration.';
          } else if (urlParams.error === 'access_denied') {
            errorMessage = 'Access Denied: The user denied the authorization request or the request was cancelled.';
          } else if (urlParams.error === 'unsupported_response_type') {
            errorMessage = 'Configuration Error: The requested response type is not supported. Please contact support.';
          } else if (urlParams.error === 'invalid_scope') {
            errorMessage = 'Invalid Scope: The requested permissions are not valid. Please check your scope configuration.';
          } else if (urlParams.error === 'server_error') {
            errorMessage = 'Server Error: PingOne encountered an internal error. Please try again later.';
          } else if (urlParams.error === 'temporarily_unavailable') {
            errorMessage = 'Service Unavailable: PingOne is temporarily unavailable. Please try again later.';
          }
          
          throw new Error(errorMessage);
        }
        
        // Check if we have the required parameters for either flow type
        console.log('🔍 [Callback] ===== FLOW TYPE DETECTION =====');
        const hasAuthorizationCode = !!urlParams.code;
        const hasAccessToken = !!urlParams.access_token;
        const hasIdToken = !!urlParams.id_token;
        const hasState = !!urlParams.state;
        const hasTokenType = !!urlParams.token_type;
        const hasExpiresIn = !!urlParams.expires_in;
        
        console.log('🔍 [Callback] Flow detection results:');
        console.log(`  🔑 Authorization Code: ${hasAuthorizationCode} ${urlParams.code ? `(${urlParams.code.substring(0, 10)}...)` : ''}`);
        console.log(`  🎫 Access Token: ${hasAccessToken} ${urlParams.access_token ? `(${urlParams.access_token.substring(0, 20)}...)` : ''}`);
        console.log(`  🆔 ID Token: ${hasIdToken} ${urlParams.id_token ? `(${urlParams.id_token.substring(0, 20)}...)` : ''}`);
        console.log(`  🔒 State: ${hasState} ${urlParams.state ? `(${urlParams.state})` : ''}`);
        console.log(`  📝 Token Type: ${hasTokenType} ${urlParams.token_type ? `(${urlParams.token_type})` : ''}`);
        console.log(`  ⏰ Expires In: ${hasExpiresIn} ${urlParams.expires_in ? `(${urlParams.expires_in})` : ''}`);
        
        if (!hasAuthorizationCode && !hasAccessToken) {
          console.error('❌ [Callback] ===== VALIDATION FAILED =====');
          console.error('❌ [Callback] No authorization code or access token found');
          console.error('❌ [Callback] Available parameters:', Object.keys(urlParams));
          console.error('❌ [Callback] Parameter values:', urlParams);
          console.error('❌ [Callback] This suggests the OAuth flow was interrupted or malformed');
          throw new Error('No authorization code or access token received. The OAuth flow may have been interrupted.');
        }
        
        console.log('🔍 [Callback] ===== FLOW TYPE IDENTIFIED =====');
        if (hasAuthorizationCode) {
          console.log('✅ [Callback] Authorization Code Flow detected');
          console.log('✅ [Callback] Code value:', urlParams.code);
          console.log('✅ [Callback] State value:', urlParams.state);
          console.log('✅ [Callback] Processing Authorization Code Flow callback...');
        } else if (hasAccessToken) {
          console.log('✅ [Callback] Implicit Grant Flow detected');
          console.log('✅ [Callback] Access token value:', urlParams.access_token);
          console.log('✅ [Callback] Token type:', urlParams.token_type);
          console.log('✅ [Callback] Expires in:', urlParams.expires_in);
          console.log('✅ [Callback] ID token:', urlParams.id_token ? 'Present' : 'Not present');
          console.log('✅ [Callback] Processing Implicit Grant Flow callback...');
        }
        
        // Ensure minimum spinner time while processing callback
        console.log('🔍 [Callback] ===== CALLING HANDLECALLBACK =====');
        console.log('🔍 [Callback] About to call handleCallback with URL:', window.location.href);
        
        const start = Date.now();
        try {
          await handleCallback(window.location.href);
          console.log('✅ [Callback] handleCallback completed successfully');
        } catch (handleCallbackError) {
          console.error('❌ [Callback] handleCallback failed:', handleCallbackError);
          throw handleCallbackError; // Re-throw to be caught by outer try-catch
        }
        
        const elapsed = Date.now() - start;
        console.log(`🔍 [Callback] handleCallback took ${elapsed}ms`);
        
        const remaining = Math.max(2000 - elapsed, 0);
        if (remaining > 0) {
          console.log(`🔍 [Callback] Waiting additional ${remaining}ms for minimum spinner time`);
          await new Promise((res) => setTimeout(res, remaining));
        }

        // If we reach here, authentication was successful
        console.log('✅ [Callback] ===== AUTHENTICATION SUCCESSFUL =====');
        console.log('✅ [Callback] Setting status to success and navigating to dashboard');
        setStatus('success');
        // Brief success state before navigating
        setTimeout(() => {
          console.log('🔄 [Callback] Navigating to /dashboard');
          navigate('/dashboard', { replace: true });
        }, 1500);
        console.log('✅ [Callback] ===== OAUTH CALLBACK DEBUG END (SUCCESS) =====');
        
      } catch (err) {
        console.error('❌ [Callback] ===== OAUTH CALLBACK ERROR =====');
        console.error('❌ [Callback] Error type:', typeof err);
        console.error('❌ [Callback] Error message:', err instanceof Error ? err.message : 'Unknown error');
        console.error('❌ [Callback] Error stack:', err instanceof Error ? err.stack : 'No stack trace');
        console.error('❌ [Callback] Full error object:', err);
        console.error('❌ [Callback] Setting status to error and showing error message');
        setStatus('error');
        setError(err instanceof Error ? err.message : 'An error occurred during authentication');
        console.error('❌ [Callback] ===== OAUTH CALLBACK DEBUG END =====');
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
          <Message>You have been successfully authenticated. Redirecting to the dashboard...</Message>
          <Button onClick={handleGoToDashboard}>
            Go to Dashboard
          </Button>
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
        <Button onClick={handleRetry}>
          Try Again
        </Button>
      </Card>
    </CallbackContainer>
  );
};

export default Callback;
