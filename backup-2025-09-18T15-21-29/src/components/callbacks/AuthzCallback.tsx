/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/NewAuthContext';
import styled from 'styled-components';
import {  FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { logger } from '../../utils/logger';
import { getValidatedCurrentUrl } from '../../utils/urlValidation';
import OAuthErrorHelper from '../OAuthErrorHelper';

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

const AuthzCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleCallback } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authorization callback...');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const currentUrl = getValidatedCurrentUrl('AuthzCallback');
        logger.auth('AuthzCallback', 'Processing authorization callback', { url: currentUrl });
        
        // Check if this is a popup window and send message to parent
        const isPopup = window.opener && !window.opener.closed;
        if (isPopup) {
          console.log('📤 [AuthzCallback] Popup detected, sending message to parent window');
        }

        if (result.success) {
          setStatus('success');
          setMessage('Authorization successful! Redirecting...');
          logger.auth('AuthzCallback', 'Authorization successful', { redirectUrl: result.redirectUrl });
          
          console.log('🔍 [AuthzCallback] Redirect URL from result:', result.redirectUrl);
          console.log('🔍 [AuthzCallback] Is popup:', isPopup);
          console.log('🔍 [AuthzCallback] Current URL:', window.location.href);
          console.log('🔍 [AuthzCallback] SessionStorage keys:', Object.keys(sessionStorage));
          console.log('🔍 [AuthzCallback] Flow context in sessionStorage:', sessionStorage.getItem('flowContext'));
          
          // If this is a popup, send success message to parent and close
          if (isPopup) {
            console.log('📤 [AuthzCallback] Sending success message to parent window');
            window.opener.postMessage({
              type: 'oauth-callback',
              code: new URL(currentUrl).searchParams.get('code'),
              state: new URL(currentUrl).searchParams.get('state'),
              success: true
            }, window.location.origin);
            setTimeout(() => {
              window.close();
            }, 1000);
          } else {
            // For non-popup, preserve the authorization code and state in the redirect URL
            const urlParams = new URL(currentUrl).searchParams;
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            
            let redirectUrl = result.redirectUrl || '/';
            
            console.log('🔍 [AuthzCallback] Debug redirect info:', {
              code: code ? `${code.substring(0, 10)}...` : 'none',
              state: state ? `${state.substring(0, 10)}...` : 'none',
              redirectUrl,
              hasEnhancedV2: redirectUrl.includes('enhanced-authorization-code-v2'),
              hasFlows: redirectUrl.includes('/flows/')
            });
            
            // For Enhanced Authorization Code Flow V2, we don't need to preserve code and state in the URL
            // because the flow will handle them from the callback URL parameters
            if (code && (redirectUrl.includes('enhanced-authorization-code-v2') || redirectUrl.includes('/flows/'))) {
              console.log('🔧 [AuthzCallback] Enhanced flow detected, using return path as-is:', redirectUrl);
              // Don't modify the redirectUrl - let the flow handle the code and state from the callback
            }
            
            // Redirect after a short delay for non-popup
            console.log('🔄 [AuthzCallback] Redirecting to:', redirectUrl);
            setTimeout(() => {
              navigate(redirectUrl);
            }, 1500);
          }
        } else {
          setStatus('error');
          setMessage('Authorization failed');
          setError(result.error || 'Unknown error occurred');
          logger.error('AuthzCallback', 'Authorization failed', { error: result.error });
          
          // If this is a popup, send error message to parent and close
          if (isPopup) {
            console.log('📤 [AuthzCallback] Sending error message to parent window');
            window.opener.postMessage({
              type: 'oauth-callback',
              error: result.error || 'Authorization failed',
              error_description: result.error || 'Unknown error occurred'
            }, window.location.origin);
            setTimeout(() => {
              window.close();
            }, 2000);
          }
        }
      } catch (err) {
        setStatus('error');
        setMessage('Authorization failed');
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        logger.error('AuthzCallback', 'Error processing callback', err);
        
        // If this is a popup, send error message to parent and close
        if (window.opener && !window.opener.closed) {
          console.log('📤 [AuthzCallback] Sending error message to parent window');
          window.opener.postMessage({
            type: 'oauth-callback',
            error: 'callback_error',
            error_description: err instanceof Error ? err.message : 'Unknown error occurred'
          }, window.location.origin);
          setTimeout(() => {
            window.close();
          }, 2000);
        }
      }
    };

    processCallback();
  }, [location.href, handleCallback, navigate]);

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
          {status === 'loading' && 'Processing Authorization'}
          {status === 'success' && 'Authorization Successful'}
          {status === 'error' && 'Authorization Failed'}
        </StatusTitle>
        <StatusMessage>{message}</StatusMessage>
        {error && status === 'error' && (
          <OAuthErrorHelper
            error={error}
            errorDescription={error}
            correlationId={new URLSearchParams(location.search).get('correlation_id') || undefined}
            onRetry={() => window.location.reload()}
            onGoToConfig={() => window.location.href = '/configuration'}
          />
        )}
      </StatusCard>
    </CallbackContainer>
  );
};

export default AuthzCallback;
