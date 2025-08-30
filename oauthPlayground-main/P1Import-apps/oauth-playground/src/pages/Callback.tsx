import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { FiLoader, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const CallbackContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
  background-color: ${({ theme }) => theme.colors.gray50};
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
  const { handleOAuthCallback } = useAuth();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get the full URL with query parameters
        const params = {};
        for (const [key, value] of searchParams.entries()) {
          params[key] = value;
        }
        
        // Check for error in the URL (e.g., user denied permission)
        if (params.error) {
          throw new Error(params.error_description || 'Authorization failed');
        }
        
        // Process the OAuth callback
        const result = await handleOAuthCallback(window.location.href);
        
        if (result.success) {
          setStatus('success');
          // Redirect to the dashboard or the original URL after a short delay
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 2000);
        } else {
          throw new Error(result.error || 'Authentication failed');
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setError(err.message || 'An error occurred during authentication');
      }
    };
    
    processCallback();
  }, [searchParams, navigate, handleOAuthCallback]);

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
