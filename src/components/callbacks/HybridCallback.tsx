import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/NewAuthContext';
import styled from 'styled-components';
import { FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi';
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
      case 'success': return '#f0fdf4';
      case 'error': return '#fef2f2';
      default: return '#f8fafc';
    }
  }};
  border: 1px solid ${({ $status }) => {
    switch ($status) {
      case 'success': return '#bbf7d0';
      case 'error': return '#fecaca';
      default: return '#e2e8f0';
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
      case 'success': return '#16a34a';
      case 'error': return '#dc2626';
      default: return '#6b7280';
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
  const location = useLocation();
  const { handleCallback } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing hybrid flow callback...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const currentUrl = getValidatedCurrentUrl('HybridCallback');
        logger.info('HybridCallback', 'Processing hybrid flow callback', { url: currentUrl });
        
        // Parse URL parameters for hybrid flow
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const idToken = urlParams.get('id_token');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        if (error) {
          setStatus('error');
          setMessage('Hybrid flow failed');
          setError(errorDescription || error);
          logger.error('HybridCallback', 'OAuth error in hybrid callback', { error, errorDescription });
          return;
        }

        if (code && idToken) {
          // Store tokens in sessionStorage for the hybrid flow component to pick up
          const tokens = {
            authorization_code: code,
            id_token: idToken,
            state: state
          };
          
          sessionStorage.setItem('hybrid_tokens', JSON.stringify(tokens));
          sessionStorage.setItem('oidc_hybrid_v3_callback_data', JSON.stringify({
            code,
            id_token: idToken,
            state,
            timestamp: Date.now()
          }));
          
          setStatus('success');
          setMessage('Hybrid flow successful! Redirecting to flow...');
          logger.success('HybridCallback', 'Hybrid flow successful, stored tokens', { hasCode: !!code, hasIdToken: !!idToken });
          
          // Redirect to the hybrid flow page
          setTimeout(() => {
            navigate('/flows/oidc-hybrid-v3');
          }, 1500);
        } else if (code) {
          // Store authorization code only
          const tokens = {
            authorization_code: code,
            state: state
          };
          
          sessionStorage.setItem('hybrid_tokens', JSON.stringify(tokens));
          sessionStorage.setItem('oidc_hybrid_v3_callback_data', JSON.stringify({
            code,
            state,
            timestamp: Date.now()
          }));
          
          setStatus('success');
          setMessage('Authorization code received! Redirecting to flow...');
          logger.success('HybridCallback', 'Authorization code received', { hasCode: !!code });
          
          // Redirect to the hybrid flow page
          setTimeout(() => {
            navigate('/flows/oidc-hybrid-v3');
          }, 1500);
        } else {
          setStatus('error');
          setMessage('No authorization code or ID token found');
          setError('Expected authorization code and/or ID token in callback URL');
          logger.error('HybridCallback', 'No code or id_token in hybrid callback', { 
            hasCode: !!code, 
            hasIdToken: !!idToken,
            url: currentUrl 
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
  }, [location.href, navigate]);

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
        <StatusIcon $status={status}>
          {getStatusIcon()}
        </StatusIcon>
        <StatusTitle>
          {status === 'loading' && 'Processing Hybrid Flow'}
          {status === 'success' && 'Hybrid Flow Successful'}
          {status === 'error' && 'Hybrid Flow Failed'}
        </StatusTitle>
        <StatusMessage>{message}</StatusMessage>
        {error && (
          <ErrorDetails>{error}</ErrorDetails>
        )}
      </StatusCard>
    </CallbackContainer>
  );
};

export default HybridCallback;
