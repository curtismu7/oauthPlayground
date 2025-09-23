import React, { useState, useCallback, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import {
  FiServer, FiKey, FiShield, FiCheckCircle, FiCopy, FiRefreshCw, FiAlertTriangle, FiGlobe, FiSettings, FiUser, FiClock, FiChevronDown, FiChevronRight, FiEye, FiEyeOff
} from 'react-icons/fi';
import { useAuth } from '../../contexts/NewAuthContext';
import { EnhancedStepFlowV2 } from '../../components/EnhancedStepFlowV2';
import { useFlowStepManager } from '../../utils/flowStepSystem';
import { useAuthorizationFlowScroll } from '../../hooks/usePageScroll';
import { enhancedDebugger } from '../../utils/enhancedDebug';
import { usePerformanceTracking } from '../../hooks/useAnalytics';
import { logger } from '../../utils/logger';
import { copyToClipboard } from '../../utils/clipboard';
import { discoveryService } from '../../services/discoveryService';
import { storeOAuthTokens } from '../../utils/tokenStorage';
import { showFlowSuccess, showFlowError } from '../../components/CentralizedSuccessMessage';
import ConfirmationModal from '../../components/ConfirmationModal';
import { InfoBox } from '../../components/steps/CommonSteps';
import { FormField, FormLabel, FormInput } from '../../components/steps/CommonSteps';
import TokenDisplay from '../../components/TokenDisplay';
import ColorCodedURL from '../../components/ColorCodedURL';

// Types
interface ClientCredentialsCredentials {
  environmentId: string;
  clientId: string;
  clientSecret: string;
  authMethod: 'client_secret_basic' | 'client_secret_post' | 'private_key_jwt';
  scopes: string;
  audience?: string;
  tokenEndpoint: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  padding: 2rem 1rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  color: #1f2937;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  color: #1f2937;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: #6b7280;
  margin: 0;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
`;

const FlowCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  max-width: 1200px;
  margin: 0 auto;
  border: 1px solid #e5e7eb;
`;

const SecurityWarning = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 1rem;
  margin: 1.5rem 0;
  color: #dc2626;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const FlowControlSection = styled.div`
  padding: 2rem;
  border-top: 1px solid #e5e7eb;
  background: #f8fafc;
`;

const FlowControlTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1.125rem;
  font-weight: 600;
`;

const FlowControlButtons = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const FlowControlButton = styled.button<{ className?: string }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &.primary {
    background: #3b82f6;
    color: white;
    
    &:hover {
      background: #2563eb;
    }
  }

  &.secondary {
    background: #6b7280;
    color: white;
    
    &:hover {
      background: #4b5563;
    }
  }

  &.danger {
    background: #ef4444;
    color: white;
    
    &:hover {
      background: #dc2626;
    }
  }

  &.clear {
    background: #f59e0b;
    color: white;
    
    &:hover {
      background: #d97706;
    }
  }

  &.reset {
    background: #8b5cf6;
    color: white;
    
    &:hover {
      background: #7c3aed;
    }
  }
`;

const JsonDisplay = styled.div`
  background: #f9fafb;
  color: #1f2937;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  position: relative;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid #3b82f6;
  color: #3b82f6;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;

  &:hover {
    background: rgba(59, 130, 246, 0.2);
  }
`;

// Main Component
const OAuth2ClientCredentialsFlowV3: React.FC = () => {
  const authContext = useAuth();
  const { config } = authContext;
  
  // Flow state management
  const stepManager = useFlowStepManager('oauth2-client-credentials-v3');
  const { scrollToTopAfterAction } = useAuthorizationFlowScroll();
  const performanceTracking = usePerformanceTracking();

  // Credentials state
  const [credentials, setCredentials] = useState<ClientCredentialsCredentials>({
    environmentId: '',
    clientId: '',
    clientSecret: '',
    authMethod: 'client_secret_basic',
    scopes: '',
    audience: '',
    tokenEndpoint: ''
  });

  // Flow state
  const [tokens, setTokens] = useState<TokenResponse | null>(null);
  const [isRequestingToken, setIsRequestingToken] = useState(false);
  const [showClearCredentialsModal, setShowClearCredentialsModal] = useState(false);
  const [isClearingCredentials, setIsClearingCredentials] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showEducationalContent, setShowEducationalContent] = useState(false);
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);
  const [credentialsSavedSuccessfully, setCredentialsSavedSuccessfully] = useState(false);
  const [isResettingFlow, setIsResettingFlow] = useState(false);
  const [flowResetSuccessfully, setFlowResetSuccessfully] = useState(false);
  const [lastError, setLastError] = useState<any>(null);
  const [showErrorSection, setShowErrorSection] = useState(false);
  const [showUrlCallBox, setShowUrlCallBox] = useState(true);
  const [showClientSecret, setShowClientSecret] = useState(false);

  // Load credentials from storage
  useEffect(() => {
    const storedCredentials = localStorage.getItem('oauth2_client_credentials_v3_credentials');
    if (storedCredentials) {
      try {
        const parsed = JSON.parse(storedCredentials);
        
        // Migration: Update old scopes to new default scopes
        if (parsed.scopes === 'p1:read:users' || parsed.scopes === 'p1:read:users p1:write:users') {
          parsed.scopes = '';
          console.log('🔄 [OAuth2ClientCredentialsV3] Migrating old scopes to empty (no scopes)');
          
          // Save updated credentials back to storage
          localStorage.setItem('oauth2_client_credentials_v3_credentials', JSON.stringify(parsed));
        }
        
        setCredentials(prev => ({ ...prev, ...parsed }));
        logger.info('OAuth2ClientCredentialsV3', 'Loaded stored credentials', { 
          environmentId: parsed.environmentId,
          clientId: parsed.clientId,
          authMethod: parsed.authMethod,
          scopes: parsed.scopes
        });
      } catch (error) {
        logger.error('OAuth2ClientCredentialsV3', 'Failed to parse stored credentials', { error });
      }
    }
  }, []);

  // Update token endpoint when environment ID changes
  useEffect(() => {
    if (credentials.environmentId) {
      const tokenEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/token`;
      setCredentials(prev => ({ ...prev, tokenEndpoint }));
    }
  }, [credentials.environmentId]);

  // Clear credentials
  const clearCredentials = useCallback(async () => {
    setIsClearingCredentials(true);
    try {
      localStorage.removeItem('oauth2_client_credentials_v3_credentials');
      setCredentials({
        environmentId: '',
        clientId: '',
        clientSecret: '',
        authMethod: 'client_secret_basic',
        scopes: '',
        audience: '',
        tokenEndpoint: ''
      });
      setTokens(null);
      showFlowSuccess('OAuth 2.0 Client Credentials credentials cleared successfully!');
    } catch (error) {
      logger.error('OAuth2ClientCredentialsV3', 'Failed to clear credentials', { error });
      showFlowError('Failed to clear credentials');
    } finally {
      setIsClearingCredentials(false);
      setShowClearCredentialsModal(false);
    }
  }, []);

  // Request token
  const requestToken = useCallback(async () => {
    if (!credentials.environmentId || !credentials.clientId || !credentials.clientSecret || !credentials.tokenEndpoint) {
      throw new Error('Missing required credentials. Please configure Environment ID, Client ID, and Client Secret.');
    }

    setIsRequestingToken(true);

    try {
      logger.info('OAuth2ClientCredentialsV3', '🏗️ CC request built', { 
        authMethod: credentials.authMethod,
        environmentId: credentials.environmentId,
        clientId: credentials.clientId,
        scopes: credentials.scopes,
        audience: credentials.audience
      });

    // Build request body - PingOne Client Credentials uses HTTP Basic Auth (per curl example)
    const requestBody = new URLSearchParams({
      grant_type: 'client_credentials'
    });
    
    // Only add scope if it's not empty
    if (credentials.scopes && credentials.scopes.trim()) {
      requestBody.append('scope', credentials.scopes);
    }

    if (credentials.audience) {
      requestBody.append('audience', credentials.audience);
    }

    // Build headers with HTTP Basic Authentication (per curl example)
    const credentials_b64 = btoa(`${credentials.clientId}:${credentials.clientSecret}`);
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials_b64}`
    };

      logger.info('OAuth2ClientCredentialsV3', '📤 CC POST /token', { 
        endpoint: credentials.tokenEndpoint,
        authMethod: 'http_basic_auth'
      });

      // Make the request
      const response = await fetch(credentials.tokenEndpoint, {
        method: 'POST',
        headers,
        body: requestBody.toString(),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(`Token request failed: ${responseData.error || response.statusText} - ${responseData.error_description || 'Unknown error'}`);
      }

      const tokenData: TokenResponse = {
        access_token: responseData.access_token,
        token_type: responseData.token_type || 'Bearer',
        expires_in: responseData.expires_in,
        scope: responseData.scope
      };

      setTokens(tokenData);

      // Store tokens
      await storeOAuthTokens('oauth2-client-credentials-v3', tokenData);

      logger.info('OAuth2ClientCredentialsV3', '✅ CC token acquired', { 
        exp: tokenData.expires_in,
        tokenType: tokenData.token_type,
        scope: tokenData.scope
      });

      showFlowSuccess('Access token acquired successfully!');

      return tokenData;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('OAuth2ClientCredentialsV3', '⛔ CC failure', { 
        error: errorMessage,
        authMethod: credentials.authMethod
      });
      showFlowError(`Token request failed: ${errorMessage}`);
      throw error;
    } finally {
      setIsRequestingToken(false);
    }
  }, [credentials]);

  // Reset flow
  const resetFlow = useCallback(async () => {
    console.log('🔄 [OAuth2ClientCredentialsV3] Reset flow initiated');
    
    setIsResettingFlow(true);
    setFlowResetSuccessfully(false);
    
    try {
      // Simulate a brief delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setTokens(null);
      stepManager.resetFlow();
      
      // Show visual feedback
      setFlowResetSuccessfully(true);
      showFlowSuccess('🔄 OAuth 2.0 Client Credentials flow reset successfully! You can now begin a new flow.');
      
      // Scroll to top
      scrollToTopAfterAction();
      
    } catch (error) {
      console.error('❌ [OAuth2ClientCredentialsV3] Reset flow failed:', error);
      showFlowError('Failed to reset flow');
    } finally {
      setIsResettingFlow(false);
    }
  }, [stepManager, scrollToTopAfterAction]);

  // Save credentials
  const saveCredentials = useCallback(async () => {
    console.log('🔧 [OAuth2ClientCredentialsV3] Save credentials clicked', { credentials });
    setIsSavingCredentials(true);
    
    try {
      // Simulate a brief delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      localStorage.setItem('oauth2_client_credentials_v3_credentials', JSON.stringify(credentials));
      
      // Show multiple forms of feedback
      showFlowSuccess('OAuth 2.0 Client Credentials saved successfully!');
      setCredentialsSavedSuccessfully(true);
      console.log('✅ [OAuth2ClientCredentialsV3] Credentials saved successfully');
      
      logger.info('OAuth2ClientCredentialsV3', 'Credentials saved', { 
        environmentId: credentials.environmentId,
        clientId: credentials.clientId,
        authMethod: credentials.authMethod
      });
      
      // Auto-advance to next step after successful save
      setTimeout(() => {
        stepManager.setStep(1, 'credentials saved, advancing to token request step');
      }, 1000);
      
    } catch (error) {
      logger.error('OAuth2ClientCredentialsV3', 'Failed to save credentials', { error });
      showFlowError('Failed to save credentials');
      console.error('❌ [OAuth2ClientCredentialsV3] Failed to save credentials:', error);
    } finally {
      setIsSavingCredentials(false);
    }
  }, [credentials, stepManager]);

  // Define steps
  const steps = useMemo(() => [
    {
      id: 'setup-credentials',
      title: 'Setup OAuth 2.0 Client Credentials',
      description: 'Configure your PingOne OAuth 2.0 client credentials for machine-to-machine authentication.',
      icon: <FiSettings />,
      category: 'preparation',
      content: (
        <div>
          <InfoBox type="info">
            <FiKey />
            <div>
              <strong>OAuth 2.0 Client Credentials Flow</strong>
              <br />
              This flow is designed for machine-to-machine authentication where no user interaction is required.
              Configure your client credentials and authentication method below.
            </div>
          </InfoBox>

          <FormField>
            <FormLabel>Environment ID *</FormLabel>
            <FormInput
              type="text"
              value={credentials.environmentId}
              onChange={(e) => setCredentials(prev => ({ ...prev, environmentId: e.target.value }))}
              placeholder="e.g., b9817c16-9910-4415-b67e-4ac687da74d9"
            />
          </FormField>

          <FormField>
            <FormLabel>Client ID *</FormLabel>
            <FormInput
              type="text"
              value={credentials.clientId}
              onChange={(e) => setCredentials(prev => ({ ...prev, clientId: e.target.value }))}
              placeholder="Your PingOne Client ID"
            />
          </FormField>

          <FormField>
            <FormLabel>Client Secret *</FormLabel>
            <div style={{ position: 'relative' }}>
              <FormInput
                type={showClientSecret ? "text" : "password"}
                value={credentials.clientSecret}
                onChange={(e) => setCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
                placeholder="Your PingOne Client Secret"
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowClientSecret(!showClientSecret)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={showClientSecret ? 'Hide Client Secret' : 'Show Client Secret'}
              >
                {showClientSecret ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </FormField>

          <FormField>
            <FormLabel>Authentication Method *</FormLabel>
            <select
              value={credentials.authMethod}
              onChange={(e) => setCredentials(prev => ({ ...prev, authMethod: e.target.value as any }))}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="client_secret_basic">Client Secret Basic (HTTP Basic Auth)</option>
              <option value="client_secret_post">Client Secret Post (Form Body)</option>
              <option value="private_key_jwt">Private Key JWT (Recommended)</option>
            </select>
          </FormField>

          <FormField>
            <FormLabel>Scopes</FormLabel>
            <FormInput
              type="text"
              value={credentials.scopes}
              onChange={(e) => setCredentials(prev => ({ ...prev, scopes: e.target.value }))}
              placeholder="e.g., (leave empty for no scopes)"
            />
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#6b7280', 
              marginTop: '0.5rem',
              padding: '0.75rem',
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '6px'
            }}>
              <strong>💡 Why Empty Scopes?</strong>
              <br />
              OAuth 2.0 Client Credentials is for machine-to-machine authentication where no user is involved. 
              Scopes typically represent user permissions, but here the application itself is granted access.
              <br /><br />
              <strong>Best Practice:</strong> Leave empty to let the authorization server grant default application permissions, 
              or specify application-specific scopes like <code>api:read</code> or <code>system:admin</code>.
            </div>
          </FormField>

          <FormField>
            <FormLabel>Audience (Optional)</FormLabel>
            <FormInput
              type="text"
              value={credentials.audience || ''}
              onChange={(e) => setCredentials(prev => ({ ...prev, audience: e.target.value }))}
              placeholder="e.g., https://api.pingone.com"
            />
          </FormField>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              onClick={() => {
                console.log('🔧 [OAuth2ClientCredentialsV3] Button clicked, credentials:', credentials);
                saveCredentials();
              }}
              disabled={!credentials.environmentId || !credentials.clientId || !credentials.clientSecret || isSavingCredentials}
              style={{
                background: (!credentials.environmentId || !credentials.clientId || !credentials.clientSecret) ? '#9ca3af' : (isSavingCredentials ? '#059669' : '#10b981'),
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: (!credentials.environmentId || !credentials.clientId || !credentials.clientSecret || isSavingCredentials) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: isSavingCredentials ? 0.8 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              {isSavingCredentials ? (
                <>
                  <div style={{ 
                    width: '16px', 
                    height: '16px', 
                    border: '2px solid white', 
                    borderTop: '2px solid transparent', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite' 
                  }} />
                  Saving...
                </>
              ) : (
                <>
                  <FiCheckCircle />
                  Save Credentials
                </>
              )}
            </button>
            
            {credentialsSavedSuccessfully && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                color: '#166534',
                fontSize: '0.875rem',
                fontWeight: '500',
                animation: 'fadeIn 0.3s ease-in'
              }}>
                <FiCheckCircle style={{ color: '#22c55e' }} />
                ✅ Credentials saved successfully!
              </div>
            )}
          </div>
        </div>
      ),
      execute: saveCredentials,
      canExecute: Boolean(credentials.environmentId && credentials.clientId && credentials.clientSecret),
      completed: Boolean(credentials.environmentId && credentials.clientId && credentials.clientSecret)
    },
    {
      id: 'request-token',
      title: 'Request Access Token',
      description: 'Send a client credentials request to the token endpoint to obtain an access token.',
      icon: <FiKey />,
      category: 'execution',
      content: (
        <div>
          <InfoBox type="info">
            <FiServer />
            <div>
              <strong>Token Request</strong>
              <br />
              This step will send a POST request to the token endpoint using your configured credentials and authentication method.
            </div>
          </InfoBox>

          {credentials.tokenEndpoint && (
            <div style={{ 
              marginTop: '1.5rem',
              padding: '1rem',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px'
            }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#166534' }}>Token Endpoint:</h4>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem' 
              }}>
                <div style={{ flex: 1 }}>
                  <ColorCodedURL url={credentials.tokenEndpoint} />
                </div>
                <button
                  onClick={() => copyToClipboard(credentials.tokenEndpoint, 'Token Endpoint')}
                  style={{
                    background: 'none',
                    border: '1px solid #007bff',
                    color: '#007bff',
                    cursor: 'pointer',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <FiCopy size={16} />
                </button>
              </div>
            </div>
          )}

          <div style={{ 
            marginTop: '1.5rem',
            padding: '1rem',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px'
          }}>
            <h4 style={{ margin: '0 0 0.75rem 0', color: '#374151' }}>Request Details:</h4>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              <div><strong>Grant Type:</strong> client_credentials</div>
              <div><strong>Authentication Method:</strong> {credentials.authMethod}</div>
              <div><strong>Scopes:</strong> {credentials.scopes || 'none'}</div>
              {credentials.audience && <div><strong>Audience:</strong> {credentials.audience}</div>}
            </div>
          </div>

          {/* Full URL Call Box */}
          <div style={{ 
            marginTop: '1.5rem',
            padding: '1rem',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px'
          }}>
            <button
              onClick={() => setShowUrlCallBox(!showUrlCallBox)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                width: '100%',
                color: '#1e40af',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              {showUrlCallBox ? <FiChevronDown /> : <FiChevronRight />}
              <FiGlobe />
              Full URL Call
            </button>
            
            {showUrlCallBox && (
              <div style={{ 
                background: '#ffffff',
                border: '1px solid #dbeafe',
                borderRadius: '6px',
                padding: '0.75rem',
                fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
                fontSize: '0.875rem',
                lineHeight: '1.5',
                overflowX: 'auto',
                marginTop: '0.75rem'
              }}>
                <div style={{ marginBottom: '0.5rem', color: '#1e40af', fontWeight: '600' }}>
                  POST {credentials.tokenEndpoint}
                </div>
                <div style={{ color: '#374151', marginBottom: '0.5rem' }}>
                  <strong>Headers:</strong>
                </div>
                <div style={{ color: '#6b7280', marginLeft: '1rem', marginBottom: '0.5rem' }}>
                  Content-Type: application/x-www-form-urlencoded
                </div>
                <div style={{ color: '#6b7280', marginLeft: '1rem', marginBottom: '1rem' }}>
                  Authorization: Basic [Base64(ClientID:ClientSecret)]
                </div>
                <div style={{ color: '#374151', marginBottom: '0.5rem' }}>
                  <strong>Body:</strong>
                </div>
                <div style={{ color: '#6b7280', marginLeft: '1rem' }}>
                  grant_type=client_credentials{credentials.scopes && credentials.scopes.trim() ? `&scope=${credentials.scopes}` : ''}{credentials.audience ? `&audience=${credentials.audience}` : ''}
                </div>
              </div>
            )}
          </div>
        </div>
      ),
      execute: requestToken,
      canExecute: Boolean(credentials.environmentId && credentials.clientId && credentials.clientSecret && credentials.tokenEndpoint && !isRequestingToken),
      completed: Boolean(tokens?.access_token)
    },
    {
      id: 'token-validation',
      title: 'Token Validation & Storage',
      description: 'Validate the received access token and store it securely.',
      icon: <FiShield />,
      category: 'validation',
      content: (
        <div>
          {tokens ? (
            <div>
              <InfoBox type="success">
                <FiCheckCircle />
                <div>
                  <strong>Token Acquired Successfully!</strong>
                  <br />
                  Your access token has been received and stored securely.
                </div>
              </InfoBox>

              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', color: '#1f2937' }}>Access Token:</h3>
                <TokenDisplay tokens={tokens} />

                <div style={{ 
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px'
                }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiClock />
                    Token Details
                  </h4>
                  <div style={{ fontSize: '0.875rem', color: '#166534' }}>
                    <div><strong>Token Type:</strong> {tokens.token_type}</div>
                    <div><strong>Expires In:</strong> {tokens.expires_in} seconds ({Math.round(tokens.expires_in / 60)} minutes)</div>
                    {tokens.scope && <div><strong>Scope:</strong> {tokens.scope}</div>}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <InfoBox type="info">
              <FiShield />
              <div>
                <strong>Token Validation</strong>
                <br />
                Complete the token request step to validate and store your access token.
              </div>
            </InfoBox>
          )}
        </div>
      ),
      canExecute: false,
      completed: Boolean(tokens?.access_token)
    }
  ], [credentials, tokens, isRequestingToken, requestToken, saveCredentials]);

  return (
    <Container>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes fadeIn {
            0% { opacity: 0; transform: translateY(-10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
      <Header>
        <Title>OAuth 2.0 Client Credentials Flow V3</Title>
        <Subtitle>
          Machine-to-machine authentication using OAuth 2.0 Client Credentials grant
        </Subtitle>
      </Header>

      <FlowCard>
        {/* Educational Overview - Only show on first step */}
        {stepManager.currentStepIndex === 0 && (
          <div style={{ 
            padding: '2rem', 
            borderBottom: '1px solid #e5e7eb',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
          }}>
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                cursor: 'pointer',
                marginBottom: showEducationalContent ? '1.5rem' : '0'
              }}
              onClick={() => setShowEducationalContent(!showEducationalContent)}
            >
              <h2 style={{ margin: 0, color: '#1f2937', fontSize: '1.5rem' }}>
                🤖 What is OAuth 2.0 Client Credentials Flow?
              </h2>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '8px',
                background: '#fef2f2',
                border: '2px solid #ef4444',
                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)',
                transition: 'all 0.2s ease',
                transform: showEducationalContent ? 'rotate(0deg)' : 'rotate(90deg)',
                cursor: 'pointer'
              }}>
                {showEducationalContent ? 
                  <FiChevronDown size={16} style={{ color: '#3b82f6' }} /> : 
                  <FiChevronRight size={16} style={{ color: '#3b82f6' }} />
                }
              </div>
            </div>
        
            {showEducationalContent && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                  <div>
                    <h3 style={{ color: '#374151', marginBottom: '1rem' }}>Why Use Client Credentials?</h3>
                    <ul style={{ color: '#6b7280', lineHeight: '1.6', paddingLeft: '1.5rem' }}>
                      <li><strong>Machine-to-Machine Authentication:</strong> Enables secure communication between services without human intervention</li>
                      <li><strong>API Access:</strong> Allows backend services to access protected APIs and resources</li>
                      <li><strong>Automated Processes:</strong> Perfect for scheduled jobs, batch processing, and system integrations</li>
                      <li><strong>Service Orchestration:</strong> Enables microservices to authenticate with each other securely</li>
                      <li><strong>No User Context:</strong> Works when no user is present or when acting on behalf of the application itself</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 style={{ color: '#374151', marginBottom: '1rem' }}>When to Use This Flow</h3>
                    <ul style={{ color: '#6b7280', lineHeight: '1.6', paddingLeft: '1.5rem' }}>
                      <li><strong>Backend Services:</strong> Server-to-server API calls and integrations</li>
                      <li><strong>Automated Scripts:</strong> Cron jobs, data synchronization, and batch operations</li>
                      <li><strong>IoT Devices:</strong> Connected devices authenticating to cloud platforms</li>
                      <li><strong>AI/ML Systems:</strong> Machine learning pipelines accessing data sources</li>
                      <li><strong>Webhook Handlers:</strong> Services processing incoming webhooks</li>
                      <li><strong>Monitoring Systems:</strong> Health checks and metrics collection</li>
                    </ul>
                  </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ color: '#374151', marginBottom: '1rem' }}>AI and Machine Learning Use Cases</h3>
                  <div style={{ 
                    background: '#f0f9ff', 
                    border: '1px solid #0ea5e9', 
                    borderRadius: '8px', 
                    padding: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ color: '#0c4a6e', fontSize: '0.875rem', lineHeight: '1.6' }}>
                      <p style={{ margin: '0 0 0.75rem 0', fontWeight: '600' }}>
                        <strong>🤖 AI Systems & Client Credentials:</strong>
                      </p>
                      <ul style={{ margin: '0', paddingLeft: '1.5rem' }}>
                        <li><strong>Model Training Pipelines:</strong> AI systems authenticating to data lakes and GPU services for training</li>
                        <li><strong>Inference APIs:</strong> AI models accessing external APIs for enhanced capabilities</li>
                        <li><strong>Data Ingestion:</strong> Automated AI agents collecting data from multiple sources</li>
                        <li><strong>Autonomous Agents:</strong> AI-powered bots and assistants interacting with backend services</li>
                        <li><strong>MLOps Workflows:</strong> Automated model deployment and monitoring systems</li>
                        <li><strong>AI Analytics:</strong> Machine learning systems accessing business intelligence platforms</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ color: '#374151', marginBottom: '1rem' }}>Understanding PingOne Endpoints</h3>
                  <div style={{ 
                    background: '#f0fdf4', 
                    border: '1px solid #22c55e', 
                    borderRadius: '8px', 
                    padding: '1rem'
                  }}>
                    <div style={{ color: '#166534', fontSize: '0.875rem', lineHeight: '1.6' }}>
                      <p style={{ margin: '0 0 0.75rem 0', fontWeight: '600' }}>
                        <strong>🌐 PingOne Token Endpoint Structure:</strong>
                      </p>
                      <div style={{ 
                        background: '#ffffff', 
                        border: '1px solid #d1fae5', 
                        borderRadius: '4px', 
                        padding: '0.75rem', 
                        margin: '0.5rem 0',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem'
                      }}>
                        <span style={{ color: '#059669' }}>https://auth.pingone.com/</span>
                        <span style={{ color: '#dc2626', fontWeight: 'bold' }}>{'<environment-id>'}</span>
                        <span style={{ color: '#059669' }}>/as/token</span>
                      </div>
                      <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
                        <li><strong>Environment ID:</strong> A UUID (like <code>b9817c16-9910-4415-b67e-4ac687da74d9</code>) that identifies your specific PingOne environment where your application is configured</li>
                        <li><strong>/as/token Endpoint:</strong> The authorization server's token endpoint where OAuth requests are sent to exchange credentials for access tokens</li>
                        <li><strong>Base URL:</strong> The foundation for all PingOne authentication and authorization operations</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div style={{ 
                  background: '#fef3c7', 
                  border: '1px solid #f59e0b', 
                  borderRadius: '8px', 
                  padding: '1rem'
                }}>
                  <h4 style={{ color: '#92400e', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center' }}>
                    <FiAlertTriangle style={{ marginRight: '0.5rem' }} />
                    Security Considerations
                  </h4>
                  <div style={{ color: '#92400e', fontSize: '0.875rem', lineHeight: '1.5' }}>
                    <p style={{ margin: '0 0 0.5rem 0' }}>
                      <strong>🔐 Credential Security:</strong> Client secrets must be stored securely (environment variables, secret management systems).
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0' }}>
                      <strong>🔑 Strong Authentication:</strong> Use private_key_jwt when possible for enhanced security.
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0' }}>
                      <strong>⏰ Token Management:</strong> Implement proper token refresh and expiration handling.
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0' }}>
                      <strong>🛡️ Scope Limitation:</strong> For OAuth 2.0 Client Credentials, use empty scopes or minimal application-specific scopes since there's no user context.
                    </p>
                    <p style={{ margin: '0' }}>
                      <strong>📋 Scope Best Practices:</strong> Leave empty for default app permissions, or use specific scopes like <code>api:read</code>, <code>system:admin</code>, or <code>users:manage</code>.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Security Warning */}
        <SecurityWarning>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <FiAlertTriangle />
            <strong>Client Credentials Flow</strong>
          </div>
          <div style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
            This flow is designed for <strong>machine-to-machine authentication</strong> where no user interaction is required.
            Use strong authentication methods like <strong>private_key_jwt</strong> when possible, and ensure your client credentials are stored securely.
          </div>
        </SecurityWarning>

        {/* Main Step Flow */}
        <EnhancedStepFlowV2 
          steps={steps}
          title="🔐 OAuth 2.0 Client Credentials Flow V3"
          persistKey="oauth2_client_credentials_v3_flow_steps"
          initialStepIndex={stepManager.currentStepIndex}
          onStepChange={stepManager.setStep}
          autoAdvance={false}
          showDebugInfo={true}
          allowStepJumping={true}
          onStepComplete={(stepId, result) => {
            console.log('✅ [OAuth2ClientCredentialsV3] Step completed:', stepId, result);
          }}
        />

        {/* Flow Control Actions */}
        <FlowControlSection>
          <FlowControlTitle>
            ⚙️ Flow Control Actions
          </FlowControlTitle>
          <FlowControlButtons>
            <FlowControlButton 
              className="clear"
              onClick={() => setShowClearCredentialsModal(true)}
            >
              🧹 Clear Credentials
            </FlowControlButton>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <FlowControlButton 
                className="reset"
                onClick={resetFlow}
                disabled={isResettingFlow}
                style={{
                  background: isResettingFlow ? '#9ca3af' : undefined,
                  cursor: isResettingFlow ? 'not-allowed' : 'pointer'
                }}
              >
                <FiRefreshCw style={{ 
                  animation: isResettingFlow ? 'spin 1s linear infinite' : 'none',
                  marginRight: '0.5rem'
                }} />
                {isResettingFlow ? 'Resetting...' : 'Reset Flow'}
              </FlowControlButton>
              
              {flowResetSuccessfully && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  color: '#166534',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  animation: 'fadeIn 0.3s ease-in'
                }}>
                  <FiCheckCircle style={{ color: '#22c55e' }} />
                  ✅ Flow reset successfully!
                </div>
              )}
            </div>
          </FlowControlButtons>
        </FlowControlSection>
      </FlowCard>

      {/* Clear Credentials Modal */}
      <ConfirmationModal
        isOpen={showClearCredentialsModal}
        onClose={() => setShowClearCredentialsModal(false)}
        onConfirm={clearCredentials}
        title="Clear OAuth 2.0 Client Credentials"
        message="Are you sure you want to clear all saved credentials? This will remove your Environment ID, Client ID, Client Secret, and other configuration data."
        confirmText="Clear Credentials"
        cancelText="Cancel"
        variant="danger"
        isLoading={isClearingCredentials}
      />
    </Container>
  );
};

export default OAuth2ClientCredentialsFlowV3;
