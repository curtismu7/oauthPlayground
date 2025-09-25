// Implicit Flow V3 - OAuth 2.0 Implicit Grant (deprecated, for educational purposes)
// Following Worker Token V3 patterns for consistency and code reuse

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { FiSettings, FiKey, FiShield, FiRefreshCw, FiCheckCircle, FiDownload, FiEye, FiEyeOff, FiCopy, FiAlertTriangle } from 'react-icons/fi';
import { useAuth } from '../../contexts/NewAuthContext';
import { logger } from '../../utils/logger';
import { showFlowSuccess, showFlowError, showDetailedError } from '../../components/CentralizedSuccessMessage';
import { credentialManager } from '../../utils/credentialManager';
import { EnhancedStepFlowV2 } from '../../components/EnhancedStepFlowV2';
import { useFlowStepManager } from '../../utils/flowStepSystem';
import { StepCredentials, FormField, FormLabel, FormInput } from '../../components/steps/CommonSteps';
import CollapsibleSection from '../../components/CollapsibleSection';
import { TokenSurface } from '../../components/TokenSurface';
import { getCallbackUrlForFlow } from '../../utils/callbackUrls';
import ConfirmationModal from '../../components/ConfirmationModal';

// Implicit Flow specific authentication method type (excludes 'none' and JWT methods)
type ImplicitAuthMethod = 'none';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  text-align: center;
`;

const Title = styled.h1`
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 1.125rem;
  opacity: 0.9;
`;

const InfoBox = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1.5rem;
  text-align: left;
`;

const WarningBox = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
`;

const WarningIcon = styled.div`
  color: #ef4444;
  margin-top: 0.125rem;
  flex-shrink: 0;
`;

const WarningContent = styled.div`
  h3 {
    margin: 0 0 0.5rem 0;
    color: #ef4444;
    font-size: 1rem;
    font-weight: 600;
  }
  
  p {
    margin: 0;
    color: #dc2626;
    font-size: 0.875rem;
    line-height: 1.5;
  }
`;

const ImplicitFlowV3: React.FC = () => {
  console.log('🎨 [ImplicitFlowV3] COMPONENT RENDER:', { timestamp: Date.now() });

  const { config } = useAuth();
  const stepManager = useFlowStepManager('implicit-flow-v3');

  // Core flow state (following Worker Token patterns)
  const [credentials, setCredentials] = useState({
    environmentId: '',
    clientId: '',
    clientSecret: '', // Not used in implicit flow but kept for consistency
    scopes: 'openid profile email',
    redirectUri: getCallbackUrlForFlow('implicit'),
    responseType: 'id_token token' as 'id_token' | 'id_token token' | 'token',
    state: '',
    nonce: ''
  });

  const [tokens, setTokens] = useState<Record<string, unknown> | null>(null);
  const [userInfo, setUserInfo] = useState<Record<string, unknown> | null>(null);
  const [authUrl, setAuthUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load initial credentials
  const loadInitialCredentials = useCallback(async () => {
    try {
      console.log('🔧 [ImplicitFlowV3] Loading initial credentials...');
      const allCredentials = credentialManager.getAllCredentials();
      
      if (allCredentials.environmentId && allCredentials.clientId) {
        setCredentials(prev => ({
          ...prev,
          environmentId: allCredentials.environmentId,
          clientId: allCredentials.clientId,
          clientSecret: allCredentials.clientSecret || '',
          scopes: allCredentials.scopes || prev.scopes,
          redirectUri: allCredentials.redirectUri || prev.redirectUri
        }));
        console.log('✅ [ImplicitFlowV3] Credentials loaded successfully');
      }
    } catch (error) {
      console.error('❌ [ImplicitFlowV3] Failed to load credentials:', error);
    }
  }, []);

  // Load credentials on mount
  useEffect(() => {
    loadInitialCredentials();
  }, [loadInitialCredentials]);

  // Save credentials
  const saveCredentials = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('💾 [ImplicitFlowV3] Saving credentials...');
      
      await credentialManager.saveAllCredentials({
        environmentId: credentials.environmentId,
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        scopes: credentials.scopes,
        redirectUri: credentials.redirectUri
      });

      showFlowSuccess('✅ Credentials Saved', 'Your Implicit Flow credentials have been saved successfully!');
      console.log('✅ [ImplicitFlowV3] Credentials saved successfully');
    } catch (error) {
      console.error('❌ [ImplicitFlowV3] Failed to save credentials:', error);
      showFlowError('❌ Save Failed', 'Failed to save credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [credentials]);

  // Generate authorization URL
  const generateAuthUrl = useCallback(() => {
    try {
      console.log('🔗 [ImplicitFlowV3] Generating authorization URL...');
      
      if (!credentials.environmentId || !credentials.clientId) {
        throw new Error('Environment ID and Client ID are required');
      }

      // Generate state and nonce
      const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      setCredentials(prev => ({ ...prev, state, nonce }));

      const params = new URLSearchParams({
        client_id: credentials.clientId,
        redirect_uri: credentials.redirectUri,
        response_type: credentials.responseType,
        scope: credentials.scopes,
        state,
        nonce
      });

      const authEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/authorize`;
      const url = `${authEndpoint}?${params.toString()}`;
      
      setAuthUrl(url);
      showFlowSuccess('🔗 Authorization URL Generated', 'Your authorization URL has been generated successfully!');
      console.log('✅ [ImplicitFlowV3] Authorization URL generated:', url);
      
      return url;
    } catch (error) {
      console.error('❌ [ImplicitFlowV3] Failed to generate authorization URL:', error);
      showFlowError('❌ URL Generation Failed', error instanceof Error ? error.message : 'Failed to generate authorization URL');
      return null;
    }
  }, [credentials]);

  // Handle authorization redirect
  const handleAuthorization = useCallback(() => {
    if (!authUrl) {
      showFlowError('❌ No Authorization URL', 'Please generate the authorization URL first');
      return;
    }

    console.log('🚀 [ImplicitFlowV3] Starting authorization redirect...');
    
    // Open in new window for better UX
    const authWindow = window.open(
      authUrl,
      'pingone-auth',
      'width=600,height=700,scrollbars=yes,resizable=yes'
    );

    if (!authWindow) {
      showFlowError('❌ Popup Blocked', 'Please allow popups for this site and try again');
      return;
    }

    // Listen for the window to close or receive tokens
    const checkClosed = setInterval(() => {
      if (authWindow.closed) {
        clearInterval(checkClosed);
        console.log('🔒 [ImplicitFlowV3] Authorization window closed');
      }
    }, 1000);

    showFlowSuccess('🚀 Authorization Started', 'Authorization window opened. Complete the login process.');
  }, [authUrl]);

  // Copy to clipboard utility
  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showFlowSuccess('📋 Copied', `${label} copied to clipboard!`);
    } catch {
      showFlowError('❌ Copy Failed', `Failed to copy ${label.toLowerCase()}`);
    }
  }, []);

  // Reset flow
  const resetFlow = useCallback(() => {
    console.log('🔄 [ImplicitFlowV3] Resetting flow...');
    setTokens(null);
    setUserInfo(null);
    setAuthUrl('');
    setError(null);
    setCredentials(prev => ({
      ...prev,
      state: '',
      nonce: ''
    }));
    stepManager.reset();
    showFlowSuccess('🔄 Flow Reset', 'Implicit flow has been reset successfully!');
  }, [stepManager]);

  // Handle step change
  const handleStepChange = useCallback((stepIndex: number, reason: 'user navigation' | 'auto-advance' | 'reset') => {
    console.log('📝 [ImplicitFlowV3] Step changed:', { stepIndex, reason });
    stepManager.setStep(stepIndex, reason);
  }, [stepManager]);

  // Define steps following Worker Token patterns
  const steps = useMemo(() => [
    {
      id: 'setup-credentials',
      title: 'Setup Implicit Flow Credentials',
      description: 'Configure your PingOne environment and client settings for the Implicit Flow',
      content: (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <WarningBox>
            <WarningIcon>
              <FiAlertTriangle size={20} />
            </WarningIcon>
            <WarningContent>
              <h3>⚠️ Security Warning</h3>
              <p>
                The Implicit Flow is <strong>deprecated</strong> and should not be used in production. 
                It's included here for educational purposes only. Use Authorization Code Flow with PKCE instead.
              </p>
            </WarningContent>
          </WarningBox>

          <CollapsibleSection
            title="📚 Implicit Flow Details"
            isExpanded={true}
            onToggle={() => {}}
            icon={<FiSettings />}
          >
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1.2rem' }}>🔓 What is the Implicit Flow?</h3>
              <p style={{ margin: '0 0 1rem 0', lineHeight: '1.5' }}>
                The Implicit Flow is a simplified OAuth 2.0 flow where tokens are returned directly in the URL fragment 
                after user authorization. It was designed for client-side applications but is now deprecated due to security concerns.
              </p>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1.2rem' }}>⚠️ Why is it Deprecated?</h3>
              <ul style={{ margin: '0', paddingLeft: '1.5rem', lineHeight: '1.6' }}>
                <li><strong>Token Exposure:</strong> Tokens are visible in the URL and browser history</li>
                <li><strong>No Refresh Tokens:</strong> Cannot securely refresh expired tokens</li>
                <li><strong>CSRF Vulnerabilities:</strong> Susceptible to cross-site request forgery attacks</li>
                <li><strong>No Client Authentication:</strong> Cannot verify client identity</li>
              </ul>
            </div>

            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1.2rem' }}>✅ Modern Alternative</h3>
              <p style={{ margin: '0', lineHeight: '1.5' }}>
                Use <strong>Authorization Code Flow with PKCE</strong> for secure client-side applications. 
                It provides the same functionality with much better security.
              </p>
            </div>
          </CollapsibleSection>

          <FormField>
            <FormLabel>Environment ID *</FormLabel>
            <FormInput
              type="text"
              value={credentials.environmentId}
              onChange={(e) => setCredentials({ ...credentials, environmentId: e.target.value })}
              placeholder="e.g., 12345678-1234-1234-1234-123456789012"
              required
            />
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Found in PingOne Admin Console URL or Environment settings
            </div>
          </FormField>
          
          <FormField>
            <FormLabel>Client ID *</FormLabel>
            <FormInput
              type="text"
              value={credentials.clientId}
              onChange={(e) => setCredentials({ ...credentials, clientId: e.target.value })}
              placeholder="e.g., 87654321-4321-4321-4321-210987654321"
              required
            />
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Unique identifier for your application in PingOne
            </div>
          </FormField>

          <FormField>
            <FormLabel>Client Secret</FormLabel>
            <div style={{ position: 'relative' }}>
              <FormInput
                type={showSecret ? "text" : "password"}
                value={credentials.clientSecret}
                onChange={(e) => setCredentials({ ...credentials, clientSecret: e.target.value })}
                placeholder="Your client secret (optional for implicit flow)"
                style={{ paddingRight: showSecret ? '2.5rem' : undefined }}
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
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
                  justifyContent: 'center',
                  zIndex: 10
                }}
                aria-label={showSecret ? "Hide client secret" : "Show client secret"}
              >
                {showSecret ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Client secret (not used in implicit flow but kept for consistency)
            </div>
          </FormField>

          <FormField>
            <FormLabel>Scopes</FormLabel>
            <FormInput
              type="text"
              value={credentials.scopes}
              onChange={(e) => setCredentials({ ...credentials, scopes: e.target.value })}
              placeholder="e.g., openid profile email"
            />
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Space-separated list of scopes for the tokens
            </div>
          </FormField>

          <FormField>
            <FormLabel>Response Type</FormLabel>
            <select
              value={credentials.responseType}
              onChange={(e) => setCredentials({ ...credentials, responseType: e.target.value as any })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                backgroundColor: '#fff',
                fontSize: '1rem',
                color: '#374151'
              }}
            >
              <option value="id_token">ID Token Only</option>
              <option value="id_token token">ID Token + Access Token</option>
              <option value="token">Access Token Only</option>
            </select>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Type of tokens to request from the authorization server
            </div>
          </FormField>

          <FormField>
            <FormLabel>Redirect URI</FormLabel>
            <FormInput
              type="text"
              value={credentials.redirectUri}
              onChange={(e) => setCredentials({ ...credentials, redirectUri: e.target.value })}
              placeholder="e.g., http://localhost:3000/callback"
              required
            />
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Where to redirect after authorization (must match PingOne configuration)
            </div>
          </FormField>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={saveCredentials}
              disabled={isLoading || !credentials.environmentId || !credentials.clientId}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {isLoading ? <FiRefreshCw className="animate-spin" size={16} /> : <FiCheckCircle size={16} />}
              {isLoading ? 'Saving...' : 'Save Credentials'}
            </button>
          </div>
        </div>
      )
    },
    {
      id: 'generate-auth-url',
      title: 'Generate Authorization URL',
      description: 'Create the authorization URL with all required parameters',
      content: (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px',
            padding: '1rem'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e40af', fontSize: '1rem' }}>
              🔗 Authorization URL Generation
            </h3>
            <p style={{ margin: '0', fontSize: '0.875rem', color: '#1e40af', lineHeight: '1.5' }}>
              Generate the authorization URL that will redirect users to PingOne for authentication.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={generateAuthUrl}
              disabled={!credentials.environmentId || !credentials.clientId}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <FiKey size={16} />
              Generate Authorization URL
            </button>
          </div>

          {authUrl && (
            <div style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: '0', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                  Generated Authorization URL:
                </h4>
                <button
                  type="button"
                  onClick={() => copyToClipboard(authUrl, 'Authorization URL')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.75rem'
                  }}
                >
                  <FiCopy size={14} />
                  Copy
                </button>
              </div>
              <pre style={{
                background: '#1f2937',
                color: '#f9fafb',
                padding: '1rem',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                overflow: 'auto',
                margin: '0',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                {authUrl}
              </pre>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'user-authorization',
      title: 'User Authorization',
      description: 'Redirect user to PingOne for authentication',
      content: (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            padding: '1rem'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#065f46', fontSize: '1rem' }}>
              🚀 User Authorization Step
            </h3>
            <p style={{ margin: '0', fontSize: '0.875rem', color: '#065f46', lineHeight: '1.5' }}>
              Click the button below to redirect the user to PingOne for authentication. 
              The user will be redirected back to your application with tokens in the URL fragment.
            </p>
          </div>

          {!authUrl ? (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '1rem',
              textAlign: 'center'
            }}>
              <p style={{ margin: '0', color: '#dc2626', fontSize: '0.875rem' }}>
                Please generate the authorization URL first in the previous step.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleAuthorization}
                style={{
                  padding: '1rem 2rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <FiShield size={20} />
                Start Authorization
              </button>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'parse-tokens',
      title: 'Parse Tokens from URL',
      description: 'Extract and validate tokens from the URL fragment',
      content: (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '8px',
            padding: '1rem'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#6b21a8', fontSize: '1rem' }}>
              🔍 Token Parsing
            </h3>
            <p style={{ margin: '0', fontSize: '0.875rem', color: '#6b21a8', lineHeight: '1.5' }}>
              After user authorization, tokens will be returned in the URL fragment. 
              This step demonstrates how to parse and validate those tokens.
            </p>
          </div>

          {tokens ? (
            <TokenSurface
              tokens={tokens}
              onCopy={copyToClipboard}
              showIntrospection={false}
              showUserInfo={false}
            />
          ) : (
            <div style={{
              background: 'rgba(107, 114, 128, 0.1)',
              border: '1px solid rgba(107, 114, 128, 0.3)',
              borderRadius: '8px',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <p style={{ margin: '0', color: '#6b7280', fontSize: '0.875rem' }}>
                Complete the authorization step to see tokens here.
              </p>
            </div>
          )}
        </div>
      )
    }
  ], [credentials, showSecret, authUrl, tokens, isLoading, saveCredentials, generateAuthUrl, handleAuthorization, copyToClipboard]);

  return (
    <Container>
      <Header>
        <Title>🔓 PingOne Implicit Flow V3</Title>
        <Subtitle>OAuth 2.0 Implicit Grant (Deprecated - Educational Use Only)</Subtitle>
        <InfoBox>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1.2rem' }}>⚠️ Important Notice</h3>
            <p style={{ margin: '0 0 1rem 0', lineHeight: '1.5' }}>
              The Implicit Flow is <strong>deprecated</strong> by OAuth 2.1 and should not be used in production applications. 
              It's included here for educational purposes only.
            </p>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1.2rem' }}>✅ Modern Alternative</h3>
            <p style={{ margin: '0', lineHeight: '1.5' }}>
              Use <strong>Authorization Code Flow with PKCE</strong> for secure client-side applications. 
              It provides the same functionality with much better security.
            </p>
          </div>
        </InfoBox>
      </Header>

      <EnhancedStepFlowV2
        steps={steps}
        title="🔓 Implicit Flow (V3)"
        persistKey="implicit-flow-v3"
        autoAdvance={false}
        showDebugInfo={false}
        allowStepJumping={true}
        initialStepIndex={stepManager.currentStepIndex}
        onStepChange={handleStepChange}
        onStepComplete={(stepId, result) => {
          logger.info('ImplicitFlowV3', `✅ Step completed: ${stepId}`, result);
          if (stepId === 'parse-tokens' && result && typeof result === 'object' && 'tokens' in result) {
            setTokens(result.tokens as Record<string, unknown>);
          }
        }}
        onStepError={(stepId, error) => {
          logger.error('ImplicitFlowV3', `❌ Step failed: ${stepId}`, error);
          setError(error instanceof Error ? error.message : String(error));
          showFlowError('Flow Error', error instanceof Error ? error.message : String(error));
        }}
      />

      <ConfirmationModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={resetFlow}
        title="Reset Implicit Flow"
        message="Are you sure you want to reset the flow? This will clear all progress and tokens."
        confirmText="Reset Flow"
        cancelText="Cancel"
      />
    </Container>
  );
};

export default ImplicitFlowV3;
