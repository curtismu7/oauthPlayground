import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/NewAuthContext';
import styled from 'styled-components';
import { FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi';
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const currentUrl = getValidatedCurrentUrl('AuthzCallback');
        logger.auth('AuthzCallback', 'Processing authorization callback', { url: currentUrl });
        
        // Check if this is a popup window
        const isPopup = window.opener && !window.opener.closed;
        
        if (isPopup) {
          console.log('📤 [AuthzCallback] Popup detected - extracting code/state and sending to parent');
          
          // For popups, extract the authorization code and state directly from URL
          // DO NOT call handleCallback as that would do token exchange in the popup
          const urlParams = new URL(currentUrl).searchParams;
          const code = urlParams.get('code');
          const state = urlParams.get('state');
          const error = urlParams.get('error');
          const errorDescription = urlParams.get('error_description');
          
          if (error) {
            console.error('❌ [AuthzCallback] Authorization error in popup:', error);
            setStatus('error');
            setMessage(`Authorization failed: ${errorDescription || error}`);
            
            // Send error to parent window
            window.opener.postMessage({
              type: 'oauth-callback',
              error: error,
              error_description: errorDescription || error
            }, window.location.origin);
            
            setTimeout(() => {
              window.close();
            }, 2000);
            return;
          }
          
          if (code && state) {
            console.log('✅ [AuthzCallback] Authorization successful in popup, sending code to parent');
            setStatus('success');
            setMessage('Authorization successful! Closing popup...');
            
            // Send success with code and state to parent window
            window.opener.postMessage({
              type: 'oauth-callback',
              code: code,
              state: state,
              success: true
            }, window.location.origin);
            
            setTimeout(() => {
              window.close();
            }, 1000);
            return;
          } else {
            console.error('❌ [AuthzCallback] Missing code or state in popup callback');
            setStatus('error');
            setMessage('Authorization failed: Missing authorization code');
            
            // Send error to parent window
            window.opener.postMessage({
              type: 'oauth-callback',
              error: 'invalid_request',
              error_description: 'Missing authorization code or state'
            }, window.location.origin);
            
            setTimeout(() => {
              window.close();
            }, 2000);
            return;
          }
        }
        
        // For non-popup flows, check if this is an Enhanced V3 flow that should defer token exchange
        console.log('🔄 [AuthzCallback] Non-popup flow, checking for Enhanced flow context...');
        
        const flowContextRaw = sessionStorage.getItem('flowContext');
        if (flowContextRaw) {
          try {
            const flowContext = JSON.parse(flowContextRaw);
            const isEnhancedV3 = flowContext?.flow === 'enhanced-authorization-code-v3';
            
            console.log('🔍 [AuthzCallback] Flow context found:', flowContext);
            console.log('🔍 [AuthzCallback] Is Enhanced V3:', isEnhancedV3);
            
            if (isEnhancedV3) {
              // For V3 full redirect, extract code and state, then redirect to V3 page
              const urlParams = new URL(currentUrl).searchParams;
              const code = urlParams.get('code');
              const state = urlParams.get('state');
              const error = urlParams.get('error');
              
              if (error) {
                console.error('❌ [AuthzCallback] Authorization error in V3 full redirect:', error);
                setStatus('error');
                setMessage(`Authorization failed: ${urlParams.get('error_description') || error}`);
                return;
              }
              
              if (code && state) {
                // Store the authorization code for V3 to use
                sessionStorage.setItem('oauth_auth_code', code);
                sessionStorage.setItem('oauth_state', state);
                
                console.log('✅ [AuthzCallback] V3 full redirect - stored code and redirecting to V3 page');
                setStatus('success');
                setMessage('Authorization successful! Redirecting to V3 flow...');
                
                // Redirect to V3 page
                const returnPath = flowContext.returnPath || '/flows/enhanced-authorization-code-v3?step=5';
                setTimeout(() => {
                  navigate(returnPath);
                }, 1500);
                return;
              } else {
                console.error('❌ [AuthzCallback] Missing code or state in V3 full redirect');
                setStatus('error');
                setMessage('Authorization failed: Missing authorization code');
                return;
              }
            }
          } catch (e) {
            console.warn('Failed to parse flow context in AuthzCallback:', e);
          }
        }
        
        // For non-Enhanced flows, proceed with normal handleCallback
        console.log('🔄 [AuthzCallback] Not an Enhanced V3 flow, proceeding with handleCallback');
        const result = await handleCallback(currentUrl);
        
        if (result.success) {
          setStatus('success');
          setMessage('Authorization successful! Redirecting...');
          logger.auth('AuthzCallback', 'Authorization successful', { redirectUrl: result.redirectUrl });
          
          console.log('🔍 [AuthzCallback] Redirect URL from result:', result.redirectUrl);
          console.log('🔍 [AuthzCallback] Current URL:', window.location.href);
          console.log('🔍 [AuthzCallback] SessionStorage keys:', Object.keys(sessionStorage));
          console.log('🔍 [AuthzCallback] Flow context in sessionStorage:', sessionStorage.getItem('flowContext'));
          
          // For non-popup flows, handle redirect with preserved parameters
          {
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
            
            // For Enhanced Authorization Code Flow V2 and V3, we don't need to preserve code and state in the URL
            // because the flow will handle them from the callback URL parameters
            if (code && (redirectUrl.includes('enhanced-authorization-code-v2') || 
                        redirectUrl.includes('enhanced-authorization-code-v3') || 
                        redirectUrl.includes('/flows/'))) {
              console.log('🔧 [AuthzCallback] Enhanced flow (V2/V3) detected, using return path as-is:', redirectUrl);
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
          
          // For non-popup flows, the error is displayed in the UI
        }
      } catch (err) {
        setStatus('error');
        setMessage('Authorization failed');
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        logger.error('AuthzCallback', 'Error processing callback', err);
        
        // For non-popup flows, the error is displayed in the UI
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
