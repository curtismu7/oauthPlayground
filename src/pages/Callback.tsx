import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/NewAuthContext';
import Spinner from '../components/Spinner';
import UserFriendlyError from '../components/UserFriendlyError';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const Card = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
  text-align: center;
`;

const Title = styled.h1`
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const Message = styled.p`
  color: #6b7280;
  font-size: 1rem;
  margin-bottom: 2rem;
`;

const ErrorMessage = styled.div`
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
`;

const ActionButton = styled.button`
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 1rem;

  &:hover {
    background-color: #2563eb;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const SuccessMessage = styled.div`
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #16a34a;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
`;

const Callback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleCallback } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authentication...');
  const [error, setError] = useState<string | null>(null);
  const [hasProcessed, setHasProcessed] = useState(false);

  const handleErrorDismiss = () => {
    // Clear the flow type and redirect to dashboard
    localStorage.removeItem('oauth_flow_type');
    navigate('/dashboard', { replace: true });
  };

  useEffect(() => {
    const processCallback = async () => {
      if (hasProcessed) {
        console.log('🔄 [Callback] Already processed, skipping...');
        return;
      }

      console.log('🚀 [Callback] Starting callback processing...');
      console.log('🔍 [Callback] Current URL:', window.location.href);
      console.log('🔍 [Callback] Search params:', searchParams.toString());

      setHasProcessed(true);

      try {
        // Extract parameters from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        console.log('🔍 [Callback] Extracted parameters:', { code, state, error, errorDescription });

        // Check for OAuth errors
        if (error) {
          throw new Error(`OAuth error: ${error}. ${errorDescription || ''}`);
        }

        // Check for required parameters
        if (!code || !state) {
          throw new Error('Missing required parameters (code or state)');
        }

        // Call the auth context to handle the callback
        console.log('🔍 [Callback] Calling handleCallback...');
        const result = await handleCallback(window.location.href);
        
        console.log('🔍 [Callback] handleCallback result:', result);

        if (result.success) {
          console.log('✅ [Callback] Authentication successful');
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          
          // Determine redirect destination
          const flowType = localStorage.getItem('oauth_flow_type');
          console.log('🔍 [Callback] Flow type from localStorage:', flowType);
          
          let redirectPath = '/dashboard'; // default
          
          if (flowType === 'authorization-code') {
            redirectPath = '/flows/authorization-code';
          } else if (flowType === 'simplified-auth-code') {
            redirectPath = '/flows/implicit';
          } else if (flowType === 'pkce') {
            redirectPath = '/flows/pkce';
          } else if (flowType === 'client-credentials') {
            redirectPath = '/flows/client-credentials';
          } else if (flowType === 'device-code') {
            redirectPath = '/flows/device-code';
          }
          
          console.log('🔄 [Callback] Redirecting to:', redirectPath);
          
          // Clear the flow type
          localStorage.removeItem('oauth_flow_type');
          
          // Redirect after a short delay
          setTimeout(() => {
            navigate(redirectPath, { replace: true });
          }, 1500);
          
        } else {
          throw new Error(result.error || 'Authentication failed');
        }

      } catch (err) {
        console.error('❌ [Callback] Error processing callback:', err);
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setMessage('Authentication failed');
        // Don't auto-redirect - let user read the error and click OK
      }
    };

    processCallback();
  }, [searchParams, navigate, handleCallback, hasProcessed]);

  return (
    <Container>
      <Card>
        <Title>Processing Authentication</Title>
        
        {status === 'processing' && (
          <>
            <Spinner />
            <Message>{message}</Message>
          </>
        )}
        
        {status === 'success' && (
          <>
            <SuccessMessage>
              ✅ {message}
            </SuccessMessage>
            <Spinner />
          </>
        )}
        
        {status === 'error' && (
          <>
            <UserFriendlyError 
              error={error} 
              onRetry={handleErrorDismiss}
              showTechnicalDetails={true}
            />
            <ActionButton onClick={handleErrorDismiss}>
              OK - Return to Dashboard
            </ActionButton>
          </>
        )}
      </Card>
    </Container>
  );
};

export default Callback;