// Worker Token Flow V3 - Machine-to-machine authentication using client credentials

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { FiSettings, FiKey, FiShield, FiServer, FiRefreshCw, FiCheckCircle, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../../contexts/NewAuthContext';
import { logger } from '../../utils/logger';
import { showFlowSuccess, showFlowError } from '../../components/CentralizedSuccessMessage';
import { credentialManager } from '../../utils/credentialManager';
import { EnhancedStepFlowV2 } from '../../components/EnhancedStepFlowV2';
import { useFlowStepManager } from '../../utils/flowStepSystem';
import { createCredentialsStep, StepCredentials } from '../../components/steps/CommonSteps';
import CollapsibleSection from '../../components/CollapsibleSection';
import { getCallbackUrlForFlow } from '../../utils/callbackUrls';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  padding: 1rem;
  margin-top: 1rem;
  text-align: left;
  
  p {
    margin: 0.5rem 0;
    font-size: 1rem;
  }
  
  strong {
    font-weight: 600;
  }
`;

const TokenDisplay = styled.div`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1rem 0;
`;

const TokenInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const TokenItem = styled.div`
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 1rem;
`;

const TokenLabel = styled.div`
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
`;

const TokenValue = styled.div`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  color: #495057;
  word-break: break-all;
`;

const CopyButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: #0056b3;
  }
`;

const WorkerTokenFlowV3: React.FC = () => {
  const authContext = useAuth();
  const { config } = authContext;
  
  const stepManager = useFlowStepManager({
    flowType: 'worker-token-v3',
    persistKey: 'worker_token_v3_step_manager',
    defaultStep: 0,
    enableAutoAdvance: true
  });

  const [credentials, setCredentials] = useState<StepCredentials>({
    environmentId: '',
    clientId: '',
    clientSecret: '',
    redirectUri: '', // Worker tokens don't need redirect URI
    scopes: 'openid api:read'
  });

  const [showSecret, setShowSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<any>(null);
  const [introspection, setIntrospection] = useState<any>(null);

  // Load initial credentials following proper priority: flow-specific > global > defaults
  useEffect(() => {
    const loadInitialCredentials = async () => {
      try {
        // 1. Try worker flow-specific credentials first
        const workerCredentials = credentialManager.loadFlowCredentials('worker-token-v3');
        
        let initialCredentials: StepCredentials;
        
        if (workerCredentials.environmentId || workerCredentials.clientId) {
          // Use flow-specific credentials
          initialCredentials = {
            environmentId: workerCredentials.environmentId || '',
            clientId: workerCredentials.clientId || '',
            clientSecret: workerCredentials.clientSecret || '',
            redirectUri: '', // Worker tokens don't need redirect URI
            scopes: Array.isArray(workerCredentials.scopes) ? workerCredentials.scopes.join(' ') : (workerCredentials.scopes || 'openid api:read')
          };
          console.log('✅ [Worker-V3] Loaded flow-specific credentials:', workerCredentials);
        } else {
          // 2. Fall back to global config credentials
          const configCredentials = credentialManager.loadConfigCredentials();
          
          if (configCredentials.environmentId || configCredentials.clientId) {
            initialCredentials = {
              environmentId: configCredentials.environmentId || '',
              clientId: configCredentials.clientId || '',
              clientSecret: configCredentials.clientSecret || '',
              redirectUri: '', // Worker tokens don't need redirect URI
              scopes: Array.isArray(configCredentials.scopes) ? configCredentials.scopes.join(' ') : (configCredentials.scopes || 'openid api:read')
            };
            console.log('✅ [Worker-V3] Loaded global config credentials:', configCredentials);
          } else {
            // 3. Use environment variables as final fallback
            const envCredentials = {
              environmentId: config?.environmentId || '',
              clientId: config?.clientId || '',
              clientSecret: config?.clientSecret || '',
              redirectUri: '', // Worker tokens don't need redirect URI
              scopes: 'openid api:read'
            };
            initialCredentials = envCredentials;
            console.log('✅ [Worker-V3] Loaded environment credentials:', envCredentials);
          }
        }
        
        setCredentials(initialCredentials);
      } catch (error) {
        console.error('❌ [Worker-V3] Failed to load credentials:', error);
        setError('Failed to load credentials');
      }
    };

    loadInitialCredentials();
  }, [config]);

  // Save credentials function
  const saveCredentials = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate required fields
      if (!credentials.environmentId || !credentials.clientId || !credentials.clientSecret) {
        throw new Error('Please fill in all required fields: Environment ID, Client ID, and Client Secret');
      }

      // Save to flow-specific storage
      credentialManager.saveFlowCredentials('worker-token-v3', {
        environmentId: credentials.environmentId,
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        redirectUri: '', // Worker tokens don't need redirect URI
        scopes: credentials.scopes
      });

      showFlowSuccess('✅ Credentials Saved', 'Worker token credentials have been saved successfully');
      logger.auth('WorkerTokenFlowV3', 'Credentials saved successfully');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save credentials';
      setError(errorMessage);
      showFlowError('❌ Save Failed', errorMessage);
      logger.error('WorkerTokenFlowV3', 'Failed to save credentials', { error });
    } finally {
      setIsLoading(false);
    }
  }, [credentials]);

  // Request access token
  const requestAccessToken = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const tokenEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/token`;
      
      // Ensure we have a valid scope - fallback to api:read if empty
      const scopeValue = credentials.scopes?.trim() || 'api:read';
      
      const requestPayload = {
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        scope: scopeValue,
        environment_id: credentials.environmentId
      };

      console.log('🔧 [WorkerTokenV3] Sending request to /api/client-credentials:', {
        payload: { ...requestPayload, client_secret: '[REDACTED]' },
        tokenEndpoint,
        scopeValue: credentials.scopes,
        scopeType: typeof credentials.scopes
      });
      
      const response = await fetch('/api/client-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      console.log('🔧 [WorkerTokenV3] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [WorkerTokenV3] Backend error response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        
        // Provide helpful error message for scope issues
        let errorMessage = errorData.error_description || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        
        if (errorMessage.includes('scope') || errorMessage.includes('granted')) {
          errorMessage += '\n\n💡 Solution: Configure scopes in your PingOne application:\n' +
                         '1. Go to PingOne Admin Console\n' +
                         '2. Navigate to your Application\n' +
                         '3. Add required scopes (e.g., api:read, api:write)\n' +
                         '4. Ensure your client has the necessary permissions';
        }
        
        throw new Error(errorMessage);
      }

      const tokenData = await response.json();
      setTokens(tokenData);
      
      showFlowSuccess('🎉 Token Obtained', 'Worker token has been successfully obtained');
      logger.auth('WorkerTokenFlowV3', 'Worker token obtained successfully');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to obtain token';
      setError(errorMessage);
      showFlowError('❌ Token Request Failed', errorMessage);
      logger.error('WorkerTokenFlowV3', 'Failed to obtain worker token', { error });
    } finally {
      setIsLoading(false);
    }
  }, [credentials]);

  // Introspect token
  const introspectToken = useCallback(async () => {
    if (!tokens?.access_token) {
      setError('No access token available for introspection');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const introspectionEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/introspect`;
      
      const response = await fetch('/api/introspect-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: tokens.access_token,
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret,
          introspection_endpoint: introspectionEndpoint
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const introspectionData = await response.json();
      setIntrospection(introspectionData);
      
      showFlowSuccess('🔍 Token Introspected', 'Token has been successfully introspected');
      logger.auth('WorkerTokenFlowV3', 'Token introspected successfully');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to introspect token';
      setError(errorMessage);
      showFlowError('❌ Introspection Failed', errorMessage);
      logger.error('WorkerTokenFlowV3', 'Failed to introspect token', { error });
    } finally {
      setIsLoading(false);
    }
  }, [tokens, credentials]);

  // Copy to clipboard function
  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showFlowSuccess('📋 Copied', `${label} copied to clipboard`);
    } catch (error) {
      showFlowError('❌ Copy Failed', `Failed to copy ${label.toLowerCase()}`);
    }
  }, []);

  // Define steps
  const steps = useMemo(() => [
    {
      ...createCredentialsStep(
        credentials,
        setCredentials,
        saveCredentials,
        'PingOne Worker Token Flow',
        undefined,
        'worker_token_v3',
        showSecret,
        setShowSecret
      ),
      id: 'setup-credentials',
      title: 'Setup Worker Credentials',
      description: `Configure your PingOne client credentials for worker token authentication.

🤖 **Purpose**: Worker Tokens are designed for machine-to-machine (M2M) communication - no user interaction required.

🎯 **Perfect for**: 
• Background services and automation
• Server-to-server APIs  
• Data synchronization and ETL
• Monitoring and alerting
• Integration workflows

🔧 **How it works**: Your application authenticates using client credentials, receives an access token, and can call PingOne Management API endpoints.

⚠️ **Security**: Worker Tokens have broad permissions - use only trusted applications and store secrets securely.

📚 **Documentation**: [PingOne API Documentation](https://apidocs.pingidentity.com/pingone/platform/v1/api/#authentication)`,
      category: 'preparation' as const,
      canExecute: Boolean(
        credentials.environmentId &&
        credentials.clientId &&
        credentials.clientSecret
      ),
      completed: Boolean(
        credentials.environmentId &&
        credentials.clientId &&
        credentials.clientSecret
      ),
      execute: saveCredentials,
      hideDefaultButton: true // Hide Sign On button for Worker Tokens (no user interaction needed)
    },
    {
      id: 'request-token',
      title: 'Request Worker Token',
      description: 'Obtain access token using client credentials grant',
      category: 'token-exchange' as const,
      canExecute: !!credentials.environmentId && !!credentials.clientId && !!credentials.clientSecret,
      completed: !!tokens?.access_token,
      execute: requestAccessToken,
      content: tokens && (
        <TokenDisplay>
          <h4>🎉 Worker Token Obtained</h4>
          <TokenInfo>
            <TokenItem>
              <TokenLabel>Access Token</TokenLabel>
              <TokenValue>{tokens.access_token}</TokenValue>
              <CopyButton onClick={() => copyToClipboard(tokens.access_token, 'Access Token')}>
                <FiRefreshCw size={16} />
                Copy Token
              </CopyButton>
            </TokenItem>
            <TokenItem>
              <TokenLabel>Token Type</TokenLabel>
              <TokenValue>{tokens.token_type || 'Bearer'}</TokenValue>
            </TokenItem>
            <TokenItem>
              <TokenLabel>Expires In</TokenLabel>
              <TokenValue>{tokens.expires_in ? `${tokens.expires_in} seconds` : 'N/A'}</TokenValue>
            </TokenItem>
            <TokenItem>
              <TokenLabel>Scope</TokenLabel>
              <TokenValue>{tokens.scope || 'N/A'}</TokenValue>
            </TokenItem>
          </TokenInfo>
        </TokenDisplay>
      )
    },
    {
      id: 'introspect-token',
      title: 'Introspect Token',
      description: 'Validate and introspect the worker token',
      category: 'validation' as const,
      canExecute: !!tokens?.access_token,
      completed: !!introspection?.active,
      execute: introspectToken,
      content: introspection && (
        <TokenDisplay>
          <h4>🔍 Token Introspection Results</h4>
          <TokenInfo>
            <TokenItem>
              <TokenLabel>Active</TokenLabel>
              <TokenValue>{introspection.active ? '✅ Yes' : '❌ No'}</TokenValue>
            </TokenItem>
            <TokenItem>
              <TokenLabel>Client ID</TokenLabel>
              <TokenValue>{introspection.client_id || 'N/A'}</TokenValue>
            </TokenItem>
            <TokenItem>
              <TokenLabel>Scope</TokenLabel>
              <TokenValue>{introspection.scope || 'N/A'}</TokenValue>
            </TokenItem>
            <TokenItem>
              <TokenLabel>Token Type</TokenLabel>
              <TokenValue>{introspection.token_type || 'N/A'}</TokenValue>
            </TokenItem>
          </TokenInfo>
          <details style={{ marginTop: '1rem' }}>
            <summary style={{ cursor: 'pointer', fontWeight: '600' }}>View Full Response</summary>
            <pre style={{ 
              background: '#f8f9fa', 
              padding: '1rem', 
              borderRadius: '4px', 
              overflow: 'auto',
              fontSize: '0.875rem',
              marginTop: '0.5rem'
            }}>
              {JSON.stringify(introspection, null, 2)}
            </pre>
          </details>
        </TokenDisplay>
      )
    }
  ], [credentials, showSecret, tokens, introspection, saveCredentials, requestAccessToken, introspectToken, copyToClipboard]);

  return (
    <Container>
      <Header>
        <Title>🚀 PingOne Worker Token V3</Title>
        <Subtitle>Machine-to-machine authentication using client credentials</Subtitle>
        <InfoBox>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1.2rem' }}>🤖 What is a Worker Token?</h3>
            <p style={{ margin: '0 0 1rem 0', lineHeight: '1.5' }}>
              A Worker Token is an OAuth 2.0 Client Credentials flow that allows your application to authenticate 
              directly with PingOne APIs without any user interaction. It's perfect for server-to-server communication, 
              background services, and automated processes.
            </p>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1.2rem' }}>🎯 When to Use Worker Tokens</h3>
            <ul style={{ margin: '0', paddingLeft: '1.5rem', lineHeight: '1.6' }}>
              <li><strong>Background Services:</strong> Automated data synchronization, ETL processes</li>
              <li><strong>API Integration:</strong> Server-to-server communication between applications</li>
              <li><strong>Monitoring & Alerting:</strong> Health checks, system monitoring, automated reports</li>
              <li><strong>Workflow Automation:</strong> CI/CD pipelines, deployment automation</li>
              <li><strong>Data Management:</strong> Bulk user operations, directory synchronization</li>
            </ul>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1.2rem' }}>⚠️ Security Considerations</h3>
            <ul style={{ margin: '0', paddingLeft: '1.5rem', lineHeight: '1.6' }}>
              <li><strong>Broad Permissions:</strong> Worker Tokens can access all PingOne Management API endpoints</li>
              <li><strong>Secret Storage:</strong> Client secrets must be stored securely (environment variables, key vaults)</li>
              <li><strong>Limited Scope:</strong> Use only for trusted applications and services</li>
              <li><strong>Rotation:</strong> Regularly rotate client secrets for enhanced security</li>
            </ul>
          </div>

          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1.2rem' }}>📚 Documentation</h3>
            <p style={{ margin: '0', lineHeight: '1.5' }}>
              <a href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#authentication" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 style={{ color: '#fff', textDecoration: 'underline' }}>
                PingOne Management API Documentation
              </a> | 
              <a href="https://docs.pingidentity.com/bundle/pingone-sso/page/authentication/client-credentials-flow.html" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 style={{ color: '#fff', textDecoration: 'underline' }}>
                Client Credentials Flow Guide
              </a>
            </p>
          </div>
        </InfoBox>
      </Header>

      <CollapsibleSection title="📋 PingOne Setup Instructions" defaultExpanded={false}>
        <div style={{ padding: '1rem 0' }}>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div style={{ 
              background: '#f8f9fa', 
              border: '1px solid #e9ecef', 
              borderRadius: '8px', 
              padding: '1.5rem' 
            }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#495057' }}>Step 1: Create a Worker Application in PingOne</h4>
              <ol style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '1.6' }}>
                <li>Log in to your <strong>PingOne Admin Console</strong></li>
                <li>Navigate to <strong>Applications</strong> → <strong>Applications</strong></li>
                <li>Click <strong>"Add Application"</strong></li>
                <li>Select <strong>"Worker Application"</strong> as the application type</li>
                <li>Enter a descriptive name (e.g., "OAuth Playground Worker")</li>
                <li>Click <strong>"Save"</strong></li>
              </ol>
            </div>

            <div style={{ 
              background: '#f8f9fa', 
              border: '1px solid #e9ecef', 
              borderRadius: '8px', 
              padding: '1.5rem' 
            }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#495057' }}>Step 2: Configure Client Credentials</h4>
              <ol style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '1.6' }}>
                <li>In your Worker Application, go to the <strong>"Configuration"</strong> tab</li>
                <li>Note down the <strong>Client ID</strong> (this will be your client_id)</li>
                <li>Generate a <strong>Client Secret</strong>:
                  <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                    <li>Click <strong>"Generate Secret"</strong></li>
                    <li>Copy the secret immediately (it won't be shown again)</li>
                    <li>Store it securely</li>
                  </ul>
                </li>
                <li>Note your <strong>Environment ID</strong> from the URL or environment settings</li>
              </ol>
            </div>

            <div style={{ 
              background: '#f8f9fa', 
              border: '1px solid #e9ecef', 
              borderRadius: '8px', 
              padding: '1.5rem' 
            }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#495057' }}>Step 3: Configure Scopes</h4>
              <ol style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '1.6' }}>
                <li>In the <strong>"Scopes"</strong> tab, add the scopes your application needs:</li>
                <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                  <li><code style={{ background: '#e9ecef', padding: '0.2rem 0.4rem', borderRadius: '3px' }}>openid</code> - For OpenID Connect</li>
                  <li><code style={{ background: '#e9ecef', padding: '0.2rem 0.4rem', borderRadius: '3px' }}>api:read</code> - For reading API data</li>
                  <li><code style={{ background: '#e9ecef', padding: '0.2rem 0.4rem', borderRadius: '3px' }}>api:write</code> - For writing API data</li>
                </ul>
                <li>For this playground, use: <code style={{ background: '#e9ecef', padding: '0.2rem 0.4rem', borderRadius: '3px' }}>openid api:read</code></li>
              </ol>
            </div>
          </div>

          <div style={{ 
            marginTop: '2rem', 
            padding: '1.5rem', 
            background: '#fef3c7', 
            border: '1px solid #f59e0b', 
            borderRadius: '8px' 
          }}>
            <strong style={{ color: '#92400e', display: 'block', marginBottom: '1rem' }}>🔒 Security Best Practices:</strong>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#92400e', lineHeight: '1.6' }}>
              <li>Store client secrets securely (never in source code)</li>
              <li>Use environment variables for production deployments</li>
              <li>Rotate client secrets regularly</li>
              <li>Monitor worker application usage</li>
              <li>Limit scopes to only what's needed</li>
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      <EnhancedStepFlowV2
        steps={steps}
        title="🚀 Worker Token Flow (V3)"
        persistKey="worker-token-v3"
        autoAdvance={false}
        showDebugInfo={true}
        allowStepJumping={true}
        initialStepIndex={stepManager.currentStepIndex}
        onStepChange={(stepIndex) => {
          stepManager.setStep(stepIndex, 'user navigation');
        }}
        onStepComplete={(stepId, result) => {
          logger.auth('WorkerTokenFlowV3', 'Step completed', { stepId, result });
        }}
      />
    </Container>
  );
};

export default WorkerTokenFlowV3;