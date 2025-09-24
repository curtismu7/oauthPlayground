// Worker Token Flow V3 - Machine-to-machine authentication using client credentials

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { FiSettings, FiKey, FiShield, FiServer, FiRefreshCw, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../contexts/NewAuthContext';
import { logger } from '../../utils/logger';
import { showFlowSuccess, showFlowError } from '../../components/CentralizedSuccessMessage';
import { credentialManager } from '../../utils/credentialManager';
import { storeOAuthTokens } from '../../utils/tokenStorage';
import { EnhancedStepFlowV2 } from '../../components/EnhancedStepFlowV2';
import { useFlowStepManager } from '../../utils/flowStepSystem';
import { WorkerTokenDisplay } from '../../components/worker/WorkerTokenDisplay';
import { createCredentialsStep, StepCredentials } from '../../components/steps/CommonSteps';
import CollapsibleSection from '../../components/CollapsibleSection';
import { 
  requestClientCredentialsToken,
  introspectToken,
  validateWorkerCredentials,
  generateTokenEndpoint,
  generateIntrospectionEndpoint,
  createTokenCacheKey,
  getDefaultWorkerScopes,
  validateEnvironmentId
} from '../../utils/workerToken';
import {
  secureStore,
  secureRetrieve,
  validateCredentialFormat,
  clearCredentials as clearStoredCredentials,
  loadCredentialsFromEnv
} from '../../utils/clientCredentials';
import {
  createPingOneClient,
  discoverWorkerApp,
  getEnvironmentInfo,
  testApiAccess
} from '../../utils/apiClient';
import {
  getCachedToken,
  setCachedToken,
  shouldRefreshToken,
  autoRefreshTokenIfNeeded
} from '../../utils/tokenCache';
import { WorkerTokenFlowState, WorkerTokenCredentials, WorkerTokenStep } from '../../types/workerToken';

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

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SuccessMessage = styled.div`
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #16a34a;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const WorkerTokenFlowV3: React.FC = () => {
  const authContext = useAuth();
  const { config } = authContext;
  
  const stepManager = useFlowStepManager({
    flowType: 'worker-token',
    persistKey: 'worker_token_flow_step_manager',
    defaultStep: 0,
    enableAutoAdvance: true
  });

  const [flowState, setFlowState] = useState<WorkerTokenFlowState>({
    config: {
      environmentId: '',
      tokenEndpoint: '',
      introspectionEndpoint: '',
      clientId: '',
      clientSecret: '',
      scopes: getDefaultWorkerScopes()
    }
  });

  const [credentials, setCredentials] = useState<StepCredentials>({
    environmentId: '',
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    scopes: getDefaultWorkerScopes()
  });

  const [showSecret, setShowSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
            scopes: Array.isArray(workerCredentials.scopes) ? workerCredentials.scopes.join(' ') : (workerCredentials.scopes || getDefaultWorkerScopes())
          };
          logger.info('WORKER-FLOW-V3', 'Loaded worker flow-specific credentials');
        } else {
          // 2. Fall back to global configuration
          const configCredentials = credentialManager.loadConfigCredentials();
          if (configCredentials.environmentId || configCredentials.clientId) {
            initialCredentials = {
              environmentId: configCredentials.environmentId || '',
              clientId: configCredentials.clientId || '',
              clientSecret: configCredentials.clientSecret || '',
              redirectUri: '', // Worker tokens don't need redirect URI
              scopes: Array.isArray(configCredentials.scopes) ? configCredentials.scopes.join(' ') : (configCredentials.scopes || getDefaultWorkerScopes())
            };
            logger.info('WORKER-FLOW-V3', 'Loaded global config credentials');
          } else {
            // 3. Fall back to environment variables and legacy storage
            const envCredentials = loadCredentialsFromEnv();
            const storedCredentials = await secureRetrieve();
            
            initialCredentials = {
              environmentId: envCredentials.environmentId || storedCredentials?.environmentId || '',
              clientId: envCredentials.clientId || storedCredentials?.clientId || '',
              clientSecret: envCredentials.clientSecret || storedCredentials?.clientSecret || '',
              redirectUri: '', // Worker tokens don't need redirect URI
              scopes: envCredentials.scopes || storedCredentials?.scopes || getDefaultWorkerScopes()
            };
            logger.info('WORKER-FLOW-V3', 'Loaded from environment/legacy storage');
          }
        }

        setCredentials(initialCredentials);
        
        // Auto-generate endpoints
        if (initialCredentials.environmentId && validateEnvironmentId(initialCredentials.environmentId)) {
          const tokenEndpoint = generateTokenEndpoint(initialCredentials.environmentId);
          const introspectionEndpoint = generateIntrospectionEndpoint(initialCredentials.environmentId);
          
          setFlowState(prev => ({
            ...prev,
            config: {
              environmentId: initialCredentials.environmentId,
              tokenEndpoint,
              introspectionEndpoint,
              clientId: initialCredentials.clientId,
              clientSecret: initialCredentials.clientSecret,
              scopes: initialCredentials.scopes
            }
          }));
        }

        logger.info('WORKER-FLOW-V3', 'Initial credentials loaded', {
          hasClientId: !!initialCredentials.clientId,
          hasSecret: !!initialCredentials.clientSecret,
          hasEnvironmentId: !!initialCredentials.environmentId,
          scopes: initialCredentials.scopes.length
        });
      } catch (error) {
        logger.error('WORKER-FLOW-V3', 'Failed to load initial credentials', error);
      }
    };

    loadInitialCredentials();
  }, []);

  // Save credentials
  const saveCredentials = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate credentials
      const validation = validateCredentialFormat(credentials.clientId, credentials.clientSecret);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Validate environment ID
      if (!validateEnvironmentId(credentials.environmentId)) {
        throw new Error('Invalid environment ID format');
      }

      // Auto-generate endpoints
      const tokenEndpoint = generateTokenEndpoint(credentials.environmentId);
      const introspectionEndpoint = generateIntrospectionEndpoint(credentials.environmentId);

      // Update flow state
      setFlowState(prev => ({
        ...prev,
        config: {
          environmentId: credentials.environmentId,
          tokenEndpoint,
          introspectionEndpoint,
          clientId: credentials.clientId,
          clientSecret: credentials.clientSecret,
          scopes: credentials.scopes
        }
      }));

      // Store credentials securely (convert to WorkerTokenCredentials format)
      const workerCredentials: WorkerTokenCredentials = {
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        environmentId: credentials.environmentId,
        scopes: credentials.scopes
      };
      await secureStore(workerCredentials);

      showFlowSuccess('✅ Worker Credentials Saved', 'Configuration saved successfully. Ready to request token.');
      setSuccess('Credentials saved successfully!');
      
      logger.success('WORKER-FLOW-V3', 'Credentials saved', {
        clientId: credentials.clientId.substring(0, 8) + '...',
        environmentId: credentials.environmentId,
        scopes: credentials.scopes.length
      });

      // Auto-advance to token request step
      stepManager.setStep(1, 'credentials saved, ready for token request');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save credentials';
      setError(errorMessage);
      showFlowError(errorMessage);
      logger.error('WORKER-FLOW-V3', 'Failed to save credentials', error);
    } finally {
      setIsLoading(false);
    }
  }, [credentials, stepManager, showFlowSuccess, showFlowError]);

  // Request access token
  const requestAccessToken = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      showFlowSuccess('🚀 Requesting Worker Token', 'Sending client credentials request to PingOne...');

      // Check cache first
      const cacheKey = createTokenCacheKey(credentials.clientId, credentials.scopes);
      const cachedToken = getCachedToken(cacheKey);
      
      if (cachedToken && !shouldRefreshToken(cachedToken)) {
        logger.info('WORKER-FLOW-V3', 'Using cached token', { cacheKey });
        setFlowState(prev => ({
          ...prev,
          tokens: cachedToken.token,
          lastRequestTime: Date.now()
        }));
        
        showFlowSuccess('✅ Cached Token Retrieved', 'Using previously cached worker token.');
        stepManager.setStep(2, 'token retrieved from cache');
        return cachedToken.token;
      }

      // Request new token
      const tokenResponse = await requestClientCredentialsToken(
        flowState.config.tokenEndpoint,
        credentials.clientId,
        credentials.clientSecret,
        credentials.scopes
      );

      // Cache the token
      setCachedToken(cacheKey, tokenResponse);

      // Update flow state
      setFlowState(prev => ({
        ...prev,
        tokens: tokenResponse,
        lastRequestTime: Date.now()
      }));

      // Store tokens for the app
      const tokensToStore = {
        access_token: tokenResponse.access_token,
        token_type: tokenResponse.token_type,
        expires_in: tokenResponse.expires_in,
        scope: tokenResponse.scope
      };

      await storeOAuthTokens(tokensToStore, 'worker_token');

      showFlowSuccess('✅ Worker Token Received', `Successfully obtained worker token. Expires in ${tokenResponse.expires_in} seconds.`);
      
      logger.success('WORKER-FLOW-V3', 'Worker token received', {
        tokenType: tokenResponse.token_type,
        expiresIn: tokenResponse.expires_in,
        scopes: tokenResponse.scope
      });

      // Auto-advance to validation step
      stepManager.setStep(2, 'token received, ready for validation');

      return tokenResponse;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to obtain worker token';
      setError(errorMessage);
      showFlowError(errorMessage);
      logger.error('WORKER-FLOW-V3', 'Token request failed', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [credentials, flowState.config.tokenEndpoint, stepManager, showFlowSuccess, showFlowError]);

  // Validate token
  const validateToken = useCallback(async () => {
    if (!flowState.tokens) {
      throw new Error('No token to validate');
    }

    setIsLoading(true);
    setError(null);

    try {
      showFlowSuccess('🔍 Validating Token', 'Introspecting worker token...');

      // Introspect token
      const introspection = await introspectToken(
        flowState.config.introspectionEndpoint,
        flowState.tokens.access_token,
        {
          clientId: credentials.clientId,
          clientSecret: credentials.clientSecret,
          environmentId: credentials.environmentId,
          scopes: credentials.scopes
        }
      );

      // Update flow state
      setFlowState(prev => ({
        ...prev,
        introspection
      }));

      if (introspection.active) {
        showFlowSuccess('✅ Token Valid', 'Worker token is active and valid.');
        stepManager.setStep(3, 'token validated successfully');
      } else {
        showFlowError('Token is not active or has expired');
        setError('Token validation failed: token is not active');
      }

      logger.success('WORKER-FLOW-V3', 'Token introspection completed', {
        active: introspection.active,
        scopes: introspection.scope,
        clientId: introspection.clientId
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token validation failed';
      setError(errorMessage);
      showFlowError(errorMessage);
      logger.error('WORKER-FLOW-V3', 'Token validation failed', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [flowState.tokens, flowState.config.introspectionEndpoint, credentials, stepManager, showFlowSuccess, showFlowError]);

  // Test API access
  const testApiAccess = useCallback(async () => {
    if (!flowState.tokens) {
      throw new Error('No token available for API testing');
    }

    setIsLoading(true);
    setError(null);

    try {
      showFlowSuccess('🧪 Testing API Access', 'Testing worker token with PingOne Management API...');

      // Create API client
      const apiClient = createPingOneClient(
        flowState.tokens.access_token,
        credentials.environmentId
      );

      // Test API access
      const scopesArray = credentials.scopes ? credentials.scopes.split(' ') : [];
      const apiAccessResult = await testApiAccess(apiClient, scopesArray);

      // Discover worker app
      const workerApp = await discoverWorkerApp(apiClient, credentials.clientId);

      // Get environment info
      const environment = await getEnvironmentInfo(apiClient);

      // Update flow state
      setFlowState(prev => ({
        ...prev,
        apiAccess: {
          ...apiAccessResult,
          testedAt: Date.now()
        },
        workerApp,
        environment
      }));

      if (apiAccessResult.success) {
        showFlowSuccess('✅ API Access Confirmed', `Successfully accessed ${apiAccessResult.accessibleEndpoints.length} API endpoints.`);
        stepManager.setStep(4, 'API access confirmed, flow complete');
      } else {
        showFlowError('API access failed. Check your scopes and permissions.');
        setError('API access test failed');
      }

      logger.success('WORKER-FLOW-V3', 'API access test completed', {
        success: apiAccessResult.success,
        accessibleEndpoints: apiAccessResult.accessibleEndpoints.length,
        errors: apiAccessResult.errors.length
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'API access test failed';
      setError(errorMessage);
      showFlowError(errorMessage);
      logger.error('WORKER-FLOW-V3', 'API access test failed', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [flowState.tokens, credentials, stepManager, showFlowSuccess, showFlowError]);

  // Clear credentials
  const clearCredentials = useCallback(() => {
    clearStoredCredentials();
    setCredentials({
      environmentId: '',
      clientId: '',
      clientSecret: '',
      redirectUri: '',
      scopes: getDefaultWorkerScopes()
    });
    setFlowState(prev => ({
      ...prev,
      tokens: null,
      introspection: null,
      workerApp: null,
      environment: null,
      apiAccess: null
    }));
    setError(null);
    setSuccess(null);
      stepManager.resetFlow();
    
    logger.info('WORKER-FLOW-V3', 'Credentials and flow state cleared');
  }, [stepManager]);

  // Define steps
  const steps = useMemo((): WorkerTokenStep[] => [
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
      id: 'configure',
      title: 'Setup Worker Credentials',
      description: `Configure your PingOne client credentials for worker token authentication.

🤖 **Purpose**: Worker Tokens are designed for machine-to-machine (M2M) communication - no user interaction required.

🎯 **Perfect for**: 
• Background services
• Server-to-server APIs  
• Data synchronization
• Monitoring
• Integration workflows

🔧 **How it works**: Your application authenticates using client credentials, receives an access token, and can call PingOne Management API endpoints.

⚠️ **Security**: Worker Tokens have broad permissions - use only trusted applications and store secrets securely.

📚 **Documentation**: [PingOne API Documentation](https://apidocs.pingidentity.com/pingone/platform/v1/api/#authentication)`,
      category: 'preparation',
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
      // Hide Sign On button for Worker Tokens (no user interaction needed)
      hideDefaultButton: true
    },
    {
      id: 'request-token',
      title: 'Request Worker Token',
      description: 'Obtain access token using client credentials grant',
      category: 'token-exchange',
      canExecute: !!flowState.config.tokenEndpoint && !!credentials.clientId && !!credentials.clientSecret,
      completed: !!flowState.tokens,
      execute: requestAccessToken
    },
    {
      id: 'validate-token',
      title: 'Validate Token',
      description: 'Introspect and validate the worker token',
      category: 'validation',
      canExecute: !!flowState.tokens,
      completed: !!flowState.introspection?.active,
      execute: validateToken
    },
    {
      id: 'test-api',
      title: 'Test API Access',
      description: 'Test worker token with PingOne Management API',
      category: 'validation',
      canExecute: !!flowState.tokens && !!flowState.introspection?.active,
      completed: !!flowState.apiAccess?.success,
      execute: testApiAccess
    }
  ], [credentials, flowState, saveCredentials, requestAccessToken, validateToken, testApiAccess]);

  return (
    <Container>
      <Header>
        <Title>🚀 PingOne Worker Token V3</Title>
        <Subtitle>Machine-to-machine authentication using client credentials</Subtitle>
        <div style={{ marginTop: '1rem', fontSize: '1rem', opacity: 0.95 }}>
          <p style={{ margin: '0.5rem 0' }}>
            <strong>No User Interaction Required</strong> - Worker Tokens are designed for automated systems, 
            background services, and server-to-server communication.
          </p>
          <p style={{ margin: '0.5rem 0' }}>
            Perfect for: API integrations, data synchronization, monitoring, and automated workflows.
          </p>
        </div>
      </Header>

      {error && (
        <ErrorMessage>
          <FiAlertCircle size={20} />
          {error}
        </ErrorMessage>
      )}

      {success && (
        <SuccessMessage>
          <FiCheckCircle size={20} />
          {success}
        </SuccessMessage>
      )}

      <CollapsibleSection title="📋 PingOne Setup Instructions" defaultExpanded={false}>
        <SetupInstructionsContainer>
          <SetupStep>
            <StepNumber>1</StepNumber>
            <StepContent>
              <StepTitle>Create a Worker Application in PingOne</StepTitle>
              <StepDescription>
                Worker applications are designed for machine-to-machine authentication and don't require user interaction.
              </StepDescription>
              <StepDetails>
                <ol>
                  <li>Log in to your <strong>PingOne Admin Console</strong></li>
                  <li>Navigate to <strong>Applications</strong> → <strong>Applications</strong></li>
                  <li>Click <strong>"Add Application"</strong></li>
                  <li>Select <strong>"Worker Application"</strong> as the application type</li>
                  <li>Enter a descriptive name (e.g., "OAuth Playground Worker")</li>
                  <li>Click <strong>"Save"</strong></li>
                </ol>
              </StepDetails>
            </StepContent>
          </SetupStep>

          <SetupStep>
            <StepNumber>2</StepNumber>
            <StepContent>
              <StepTitle>Configure Client Credentials</StepTitle>
              <StepDescription>
                Worker applications use client credentials for authentication instead of user credentials.
              </StepDescription>
              <StepDetails>
                <ol>
                  <li>In your Worker Application, go to the <strong>"Configuration"</strong> tab</li>
                  <li>Note down the <strong>Client ID</strong> (this will be your client_id)</li>
                  <li>Generate a <strong>Client Secret</strong>:
                    <ul>
                      <li>Click <strong>"Generate Secret"</strong></li>
                      <li>Copy the secret immediately (it won't be shown again)</li>
                      <li>Store it securely</li>
                    </ul>
                  </li>
                  <li>Note your <strong>Environment ID</strong> from the URL or environment settings</li>
                </ol>
              </StepDetails>
            </StepContent>
          </SetupStep>

          <SetupStep>
            <StepNumber>3</StepNumber>
            <StepContent>
              <StepTitle>Configure Scopes and Permissions</StepTitle>
              <StepDescription>
                Define what your worker application can access through OAuth scopes.
              </StepDescription>
              <StepDetails>
                <ol>
                  <li>In the <strong>"Scopes"</strong> tab, add the scopes your application needs:</li>
                  <ul>
                    <li><code>openid</code> - For OpenID Connect (if using OIDC)</li>
                    <li><code>api:read</code> - For reading API data</li>
                    <li><code>api:write</code> - For writing API data</li>
                    <li><code>management:read</code> - For reading management data</li>
                  </ul>
                  <li>For this playground, use: <code>openid api:read</code></li>
                </ol>
              </StepDetails>
            </StepContent>
          </SetupStep>

          <SetupStep>
            <StepNumber>4</StepNumber>
            <StepContent>
              <StepTitle>Get Your Environment Information</StepTitle>
              <StepDescription>
                You'll need your Environment ID to construct the token endpoint URLs.
              </StepDescription>
              <StepDetails>
                <ol>
                  <li>Your <strong>Environment ID</strong> can be found in:</li>
                  <ul>
                    <li>The URL when logged into PingOne Admin Console</li>
                    <li>Environment settings page</li>
                  </ul>
                  <li>Format: <code>https://auth.pingone.com/&#123;environment-id&#125;/as/token</code></li>
                  <li>Example: <code>https://auth.pingone.com/b9817c16-9910-4415-b67e-4ac687da74d9/as/token</code></li>
                </ol>
              </StepDetails>
            </StepContent>
          </SetupStep>

          <SetupStep>
            <StepNumber>5</StepNumber>
            <StepContent>
              <StepTitle>Test Your Configuration</StepTitle>
              <StepDescription>
                Use the credentials above to test your Worker Token flow in this playground.
              </StepDescription>
              <StepDetails>
                <ol>
                  <li>Enter your <strong>Environment ID</strong> in the field above</li>
                  <li>Enter your <strong>Client ID</strong> from step 2</li>
                  <li>Enter your <strong>Client Secret</strong> from step 2</li>
                  <li>Click <strong>"Save Credentials"</strong></li>
                  <li>Proceed to the next step to request a token</li>
                </ol>
              </StepDetails>
            </StepContent>
          </SetupStep>

          <SecurityNote>
            <strong>🔒 Security Best Practices:</strong>
            <ul>
              <li>Store client secrets securely (never in source code)</li>
              <li>Use environment variables for production deployments</li>
              <li>Rotate client secrets regularly</li>
              <li>Monitor worker application usage</li>
              <li>Limit scopes to only what's needed</li>
            </ul>
          </SecurityNote>
        </SetupInstructionsContainer>
      </CollapsibleSection>

      <EnhancedStepFlowV2
        steps={steps.map(step => ({
          id: step.id,
          title: step.title,
          description: step.description,
          icon: step.id === 'configure' ? <FiSettings /> :
                step.id === 'request-token' ? <FiKey /> :
                step.id === 'validate-token' ? <FiShield /> :
                step.id === 'test-api' ? <FiServer /> :
                <FiCheckCircle />,
          category: step.category as 'preparation' | 'token-exchange' | 'validation' | 'cleanup',
          content: step.id !== 'configure' ? (
            <div>
              {step.id === 'request-token' && flowState.tokens && (
                <WorkerTokenDisplay
                  token={flowState.tokens}
                  introspection={flowState.introspection}
                  onRefresh={requestAccessToken}
                />
              )}
              
              {step.id === 'validate-token' && flowState.introspection && (
                <div>
                  <h4>Token Introspection Results</h4>
                  <pre>{JSON.stringify(flowState.introspection, null, 2)}</pre>
                </div>
              )}
              
              {step.id === 'test-api' && flowState.apiAccess && (
                <div>
                  <h4>API Access Test Results</h4>
                  <p>Accessible Endpoints: {flowState.apiAccess.accessibleEndpoints.join(', ')}</p>
                  {flowState.apiAccess.errors.length > 0 && (
                    <div>
                      <h5>Errors:</h5>
                      <ul>
                        {flowState.apiAccess.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : undefined,
          execute: step.execute,
          canExecute: step.canExecute,
          completed: step.completed
        }))}
        stepManager={stepManager}
        onStepComplete={() => {}}
        showDebugInfo={false}
      />
    </Container>
  );
};

// Styled components for setup instructions
const SetupInstructionsContainer = styled.div`
  padding: 1rem 0;
`;

const SetupStep = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  border-left: 4px solid #3b82f6;
`;

const StepNumber = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  font-weight: 600;
  font-size: 1.1rem;
  flex-shrink: 0;
`;

const StepContent = styled.div`
  flex: 1;
`;

const StepTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-size: 1.2rem;
  font-weight: 600;
`;

const StepDescription = styled.p`
  margin: 0 0 1rem 0;
  color: #6b7280;
  font-size: 0.95rem;
  line-height: 1.5;
`;

const StepDetails = styled.div`
  color: #374151;
  font-size: 0.9rem;
  line-height: 1.6;

  ol {
    margin: 0;
    padding-left: 1.5rem;
  }

  ul {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }

  li {
    margin-bottom: 0.5rem;
  }

  code {
    background: #f1f5f9;
    padding: 0.2rem 0.4rem;
    border-radius: 0.25rem;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.85rem;
    color: #e11d48;
  }

  strong {
    color: #1f2937;
    font-weight: 600;
  }
`;

const SecurityNote = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 0.75rem;
  border-left: 4px solid #f59e0b;

  strong {
    color: #92400e;
    display: block;
    margin-bottom: 1rem;
  }

  ul {
    margin: 0;
    padding-left: 1.5rem;
    color: #92400e;
  }

  li {
    margin-bottom: 0.5rem;
    line-height: 1.5;
  }
`;

export default WorkerTokenFlowV3;
