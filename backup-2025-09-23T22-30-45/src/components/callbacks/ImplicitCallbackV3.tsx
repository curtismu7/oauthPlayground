// src/components/callbacks/ImplicitCallbackV3.tsx - Enhanced Implicit Flow Callback Handler V3
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { 
  FiCheckCircle, 
  FiXCircle, 
  FiAlertTriangle, 
  FiCopy,
  FiShield,
  FiKey,
  FiUser
} from 'react-icons/fi';
import { logger } from '../../utils/logger';
import { copyToClipboard } from '../../utils/clipboard';
import { storeOAuthTokens } from '../../utils/tokenStorage';
import { showFlowSuccess, showFlowError } from '../CentralizedSuccessMessage';
import { 
  validateIdToken, 
  validateStateParameter, 
  clearSecurityData,
  ImplicitFlowSecurityOptions 
} from '../../utils/implicitFlowSecurity';
import TokenDisplay from '../TokenDisplay';
import { InfoBox } from '../steps/CommonSteps';

// Styled components
const JsonDisplay = styled.div`
  background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%);
  color: #1f2937;
  border: 1px solid #d1e7ff;
  border-radius: 0.5rem;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: relative;
`;

const CopyButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
  
  &:hover {
    background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const CallbackContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
`;

const StatusCard = styled.div<{ type: 'success' | 'error' | 'warning' | 'info' }>`
  background: ${props => {
    switch (props.type) {
      case 'success': return '#f0fdf4';
      case 'error': return '#fef2f2';
      case 'warning': return '#fef3c7';
      case 'info': return '#eff6ff';
      default: return '#f8fafc';
    }
  }};
  border: 1px solid ${props => {
    switch (props.type) {
      case 'success': return '#bbf7d0';
      case 'error': return '#fecaca';
      case 'warning': return '#fcd34d';
      case 'info': return '#bfdbfe';
      default: return '#e2e8f0';
    }
  }};
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const StatusHeader = styled.div<{ type: 'success' | 'error' | 'warning' | 'info' }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  color: ${props => {
    switch (props.type) {
      case 'success': return '#15803d';
      case 'error': return '#dc2626';
      case 'warning': return '#92400e';
      case 'info': return '#1e40af';
      default: return '#1f2937';
    }
  }};
`;

const StatusTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
`;

const StatusMessage = styled.p`
  margin: 0;
  font-size: 1rem;
  line-height: 1.5;
`;

const TokenSection = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const TokenHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const TokenTitle = styled.h4`
  margin: 0;
  color: #1f2937;
  font-size: 0.9rem;
  font-weight: 600;
`;

const ActionButton = styled.button`
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background: #059669;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const NavigationSection = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
  flex-wrap: wrap;
`;

const ErrorDetails = styled.pre`
  background: #f3f4f6;
  color: #1f2937;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 1rem;
  font-size: 0.875rem;
  overflow-x: auto;
  margin-top: 1rem;
`;

interface TokenData {
  access_token?: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

interface FlowContext {
  environmentId: string;
  clientId: string;
  redirectUri: string;
  scopes: string;
  responseType?: string;
  timestamp: number;
}

const ImplicitCallbackV3: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'warning'>('loading');
  const [message, setMessage] = useState('Processing implicit grant callback...');
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<TokenData | null>(null);
  const [flowType, setFlowType] = useState<'oauth2' | 'oidc'>('oauth2');
  const [isStoringTokens, setIsStoringTokens] = useState(false);
  const [troubleshootingSteps, setTroubleshootingSteps] = useState<string[]>([]);

  useEffect(() => {
    const processCallback = async () => {
      try {
        console.log('🚀 [ImplicitCallbackV3] Processing implicit grant callback...');
        console.log('🔍 [ImplicitCallbackV3] Current URL:', window.location.href);
        console.log('🔍 [ImplicitCallbackV3] Hash:', window.location.hash);

        // Parse hash parameters (implicit flow uses hash, not query params)
        const hash = window.location.hash.substring(1); // Remove the # symbol
        const hashParams = new URLSearchParams(hash);
        
        console.log('🔍 [ImplicitCallbackV3] Hash parameters:', Object.fromEntries(hashParams.entries()));

        // Check for error in hash
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');
        
        if (error) {
          setStatus('error');
          setMessage('Implicit grant failed');
          
          // Provide specific error guidance based on the error type
          let detailedError = errorDescription || error;
          let troubleshootingSteps: string[] = [];
          
          switch (error) {
            case 'invalid_request':
              detailedError = `Invalid Request: ${errorDescription || 'The authorization request was malformed'}`;
              troubleshootingSteps = [
                'Check that your Client ID is correct in PingOne Admin Console',
                'Verify the Redirect URI matches exactly (including protocol and port)',
                'Ensure the application is configured for Implicit Flow',
                'Check that the requested scopes are valid'
              ];
              break;
            case 'unauthorized_client':
              detailedError = `Unauthorized Client: ${errorDescription || 'The client is not authorized to use this flow'}`;
              troubleshootingSteps = [
                'Verify your Client ID exists in PingOne',
                'Check that Implicit Flow is enabled for this application',
                'Ensure the application is in the correct environment'
              ];
              break;
            case 'access_denied':
              detailedError = `Access Denied: ${errorDescription || 'The user denied the authorization request'}`;
              troubleshootingSteps = [
                'The user clicked "Deny" on the authorization page',
                'Try the authorization flow again and click "Allow"',
                'Check if the user has the necessary permissions'
              ];
              break;
            case 'unsupported_response_type':
              detailedError = `Unsupported Response Type: ${errorDescription || 'The response type is not supported'}`;
              troubleshootingSteps = [
                'Verify that Implicit Flow is enabled in PingOne',
                'Check that the response_type parameter is correct',
                'Ensure the application supports the requested response type'
              ];
              break;
            case 'invalid_scope':
              detailedError = `Invalid Scope: ${errorDescription || 'The requested scope is invalid'}`;
              troubleshootingSteps = [
                'Check that the requested scopes are valid for your application',
                'Verify scopes are properly configured in PingOne',
                'Use standard OAuth scopes like "openid", "profile", "email"'
              ];
              break;
            default:
              troubleshootingSteps = [
                'Check your PingOne application configuration',
                'Verify the Client ID and Environment ID are correct',
                'Ensure the Redirect URI matches exactly',
                'Check that Implicit Flow is enabled for your application'
              ];
          }
          
          setError(detailedError);
          setTroubleshootingSteps(troubleshootingSteps);
          logger.error('ImplicitCallbackV3', 'Implicit grant error', { 
            error, 
            errorDescription, 
            troubleshootingSteps,
            url: window.location.href,
            hash: window.location.hash
          });
          
          console.log('🔧 [ImplicitCallbackV3] Troubleshooting Steps:', troubleshootingSteps);
          return;
        }

        // Extract tokens from hash
        const tokenData: TokenData = {
          access_token: hashParams.get('access_token') || undefined,
          id_token: hashParams.get('id_token') || undefined,
          token_type: hashParams.get('token_type') || undefined,
          expires_in: hashParams.get('expires_in') ? parseInt(hashParams.get('expires_in')!) : undefined,
          scope: hashParams.get('scope') || undefined,
          state: hashParams.get('state') || undefined
        };

        console.log('🔍 [ImplicitCallbackV3] Extracted token data:', {
          hasAccessToken: !!tokenData.access_token,
          hasIdToken: !!tokenData.id_token,
          tokenType: tokenData.token_type,
          expiresIn: tokenData.expires_in,
          scope: tokenData.scope,
          state: tokenData.state ? 'present' : 'missing'
        });

        // Validate that we have at least one token
        if (!tokenData.access_token && !tokenData.id_token) {
          setStatus('error');
          setMessage('No tokens received');
          setError('Expected access_token or id_token in callback URL hash');
          logger.error('ImplicitCallbackV3', 'No tokens in callback hash', { hash });
          return;
        }

        // Determine flow type based on tokens received
        const detectedFlowType = tokenData.id_token ? 'oidc' : 'oauth2';
        setFlowType(detectedFlowType);

        // Load flow context from session storage
        const flowContextKey = detectedFlowType === 'oidc' ? 'oidc_implicit_v3_flow_context' : 'oauth2_implicit_v3_flow_context';
        const storedContext = sessionStorage.getItem(flowContextKey);
        
        if (!storedContext) {
          setStatus('warning');
          setMessage('Flow context not found');
          setError('Unable to validate state parameter - flow context missing');
          logger.warn('ImplicitCallbackV3', 'Flow context missing', { flowContextKey });
          setTokens(tokenData);
          return;
        }

        let flowContext: FlowContext;
        try {
          flowContext = JSON.parse(storedContext);
        } catch (parseError) {
          setStatus('error');
          setMessage('Invalid flow context');
          setError('Failed to parse stored flow context');
          logger.error('ImplicitCallbackV3', 'Failed to parse flow context', { parseError });
          return;
        }

        // Validate state parameter using security utility
        const stateValidation = validateStateParameter(
          tokenData.state,
          sessionStorage.getItem(detectedFlowType === 'oidc' ? 'oidc_implicit_v3_state' : 'oauth2_implicit_v3_state')
        );

        if (!stateValidation.success) {
          setStatus('error');
          setMessage('Invalid state parameter');
          setError(stateValidation.error || 'State parameter validation failed');
          logger.error('ImplicitCallbackV3', 'State validation failed', { error: stateValidation.error });
          return;
        }

        console.log('✅ [ImplicitCallbackV3] State parameter validated successfully');

        // For OIDC flows, validate ID token and nonce if present
        if (detectedFlowType === 'oidc' && tokenData.id_token) {
          const expectedNonce = sessionStorage.getItem('oidc_implicit_v3_nonce');
          
          const securityOptions: ImplicitFlowSecurityOptions = {
            environmentId: flowContext.environmentId,
            clientId: flowContext.clientId,
            expectedNonce: expectedNonce || undefined
          };

          console.log('🔐 [ImplicitCallbackV3] Validating OIDC ID token...');
          console.log('🔍 [ImplicitCallbackV3] Security options for validation:', {
            environmentId: securityOptions.environmentId,
            clientId: securityOptions.clientId,
            hasExpectedNonce: !!securityOptions.expectedNonce,
            expectedNonce: securityOptions.expectedNonce ? securityOptions.expectedNonce.substring(0, 10) + '...' : 'none'
          });
          const idTokenValidation = await validateIdToken(tokenData.id_token, securityOptions);

          if (!idTokenValidation.success) {
            setStatus('error');
            setMessage('ID token validation failed');
            setError(idTokenValidation.error || 'Invalid ID token');
            logger.error('ImplicitCallbackV3', 'ID token validation failed', { error: idTokenValidation.error });
            return;
          }

          console.log('✅ [ImplicitCallbackV3] OIDC ID token validated successfully');
          logger.security('ImplicitCallbackV3', 'ID token validation successful', {
            subject: idTokenValidation.validatedClaims?.sub,
            issuer: idTokenValidation.validatedClaims?.iss,
            audience: idTokenValidation.validatedClaims?.aud
          });
        }

        // Store tokens using the token storage system
        setIsStoringTokens(true);
        try {
          const flowName = detectedFlowType === 'oidc' ? 'OIDC Implicit Flow V3' : 'OAuth 2.0 Implicit Flow V3';
          const flowKey = detectedFlowType === 'oidc' ? 'oidc-implicit-v3' : 'oauth2-implicit-v3';
          
          const success = storeOAuthTokens(tokenData, flowKey, flowName);
          
          if (success) {
            console.log('✅ [ImplicitCallbackV3] Tokens stored successfully');
          } else {
            console.warn('⚠️ [ImplicitCallbackV3] Failed to store tokens');
          }
        } catch (storageError) {
          console.error('❌ [ImplicitCallbackV3] Token storage error:', storageError);
        } finally {
          setIsStoringTokens(false);
        }

        // Clear hash from URL for security
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        console.log('🔒 [ImplicitCallbackV3] Hash cleared from URL for security');

        // Clear security-sensitive data from session storage
        clearSecurityData(detectedFlowType);

        // Set success status
        setStatus('success');
        setMessage(`${detectedFlowType.toUpperCase()} Implicit Flow completed successfully`);
        setTokens(tokenData);
        
        logger.success('ImplicitCallbackV3', 'Implicit grant successful', {
          flowType: detectedFlowType,
          hasAccessToken: !!tokenData.access_token,
          hasIdToken: !!tokenData.id_token,
          tokenType: tokenData.token_type,
          expiresIn: tokenData.expires_in
        });

      } catch (error) {
        console.error('❌ [ImplicitCallbackV3] Callback processing failed:', error);
        setStatus('error');
        setMessage('Callback processing failed');
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        logger.error('ImplicitCallbackV3', 'Callback processing error', { error });
      }
    };

    processCallback();
  }, []);

  const handleNavigateToFlow = () => {
    const flowPath = flowType === 'oidc' ? '/flows/oidc-implicit-v3' : '/flows/oauth2-implicit-v3';
    navigate(flowPath);
  };

  const handleNavigateToTokenManagement = () => {
    navigate('/token-management');
  };

  const handleNavigateHome = () => {
    navigate('/');
  };

  return (
    <CallbackContainer>
      <StatusCard type={status}>
        <StatusHeader type={status}>
          {status === 'success' && <FiCheckCircle size={24} />}
          {status === 'error' && <FiXCircle size={24} />}
          {status === 'warning' && <FiAlertTriangle size={24} />}
          {status === 'loading' && <FiShield size={24} />}
          <StatusTitle>{message}</StatusTitle>
        </StatusHeader>
        
        <StatusMessage>
          {status === 'loading' && 'Please wait while we process your callback...'}
          {status === 'success' && `Your ${flowType.toUpperCase()} implicit flow has completed successfully. Tokens have been received and stored.`}
          {status === 'error' && 'An error occurred during the implicit grant flow.'}
          {status === 'warning' && 'The flow completed but with some warnings.'}
        </StatusMessage>

        {error && (
          <ErrorDetails>
            Error: {error}
          </ErrorDetails>
        )}

        {status === 'error' && troubleshootingSteps.length > 0 && (
          <div style={{ 
            marginTop: '1.5rem',
            padding: '1rem',
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px'
          }}>
            <h4 style={{ 
              margin: '0 0 1rem 0', 
              color: '#92400e',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FiAlertTriangle />
              Troubleshooting Steps
            </h4>
            <ul style={{ 
              margin: 0, 
              paddingLeft: '1.5rem',
              color: '#92400e',
              fontSize: '0.875rem',
              lineHeight: '1.6'
            }}>
              {troubleshootingSteps.map((step, index) => (
                <li key={index} style={{ marginBottom: '0.5rem' }}>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        )}
      </StatusCard>

      {tokens && (
        <div>
          <h3 style={{ marginBottom: '1rem', color: '#1f2937' }}>Received Tokens:</h3>
          <TokenDisplay tokens={tokens} />

          {/* Token Details */}
          <TokenSection>
            <TokenHeader>
              <FiUser size={16} />
              <TokenTitle>Token Details</TokenTitle>
            </TokenHeader>
            <JsonDisplay>
              <pre>{JSON.stringify({
                token_type: tokens.token_type,
                expires_in: tokens.expires_in,
                scope: tokens.scope,
                state: tokens.state ? 'validated' : 'not provided'
              }, null, 2)}</pre>
            </JsonDisplay>
          </TokenSection>

          {/* Security Notice */}
          <InfoBox type="warning">
            <FiAlertTriangle />
            <div>
              <strong>Security Notice</strong>
              <br />
              Implicit flow tokens are exposed in the URL fragment and should be handled with care.
              The hash has been cleared from the URL for security. Consider migrating to Authorization Code flow with PKCE for better security.
            </div>
          </InfoBox>
        </div>
      )}

      <NavigationSection>
        <ActionButton onClick={handleNavigateToFlow}>
          🔄 Return to Flow
        </ActionButton>
        <ActionButton onClick={handleNavigateToTokenManagement}>
          🔍 Token Management
        </ActionButton>
        <ActionButton onClick={handleNavigateHome}>
          🏠 Home
        </ActionButton>
      </NavigationSection>
    </CallbackContainer>
  );
};

export default ImplicitCallbackV3;
