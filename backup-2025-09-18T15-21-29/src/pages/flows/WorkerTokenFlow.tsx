/* eslint-disable */
import React, { useState} from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { useAuth } from '../../contexts/NewAuthContext';
import { config } from '../../services/config';
import Spinner from '../../components/Spinner';
import { StepByStepFlow, FlowStep } from '../../components/StepByStepFlow';
import ConfigurationButton from '../../components/ConfigurationButton';
import TokenDisplayComponent from '../../components/TokenDisplay';
import { storeOAuthTokens } from '../../utils/tokenStorage';
import ColorCodedURL from '../../components/ColorCodedURL';
import PageTitle from '../../components/PageTitle';
import FlowCredentials from '../../components/FlowCredentials';
import { logger } from '../../utils/logger';
import AuthorizationRequestModal from '../../components/AuthorizationRequestModal';
import JSONHighlighter from '../../components/JSONHighlighter';
import CallbackUrlDisplay from '../../components/CallbackUrlDisplay';

const Container = styled.div`;
  max-width: 1200 px;
  margin: 0 auto;
  padding: 1.5 rem;
`;

const FlowOverview = styled(Card)`;
  margin-bottom: 2 rem;
`;

const FlowDescription = styled.div`;
  margin-bottom: 2 rem;

  h2 {
    color: ${({ theme }) => theme.colors.gray900};
    font-size: 1.5 rem;
    margin-bottom: 1 rem;
  }

  p {
    color: ${({ theme }) => theme.colors.gray600};
    line-height: 1.6;
    margin-bottom: 1 rem;
  }
`;

const UseCaseHighlight = styled.div`;
  background-color: ${({ theme }) => theme.colors.success}10;
  border: 1 px solid ${({ theme }) => theme.colors.success}30;
  border-radius: 0.5 rem;
  padding: 1 rem;
  margin-bottom: 2 rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75 rem;

  svg {
    color: ${({ theme }) => theme.colors.success};
    margin-top: 0.125 rem;
    flex-shrink: 0;
  }

  h3 {
    margin: 0 0 0.5 rem 0;
    color: ${({ theme }) => theme.colors.success};
    font-size: 1 rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.gray700};
    font-size: 0.875 rem;
    line-height: 1.5;
  }
`;

const DemoSection = styled(Card)`;
  margin-bottom: 2 rem;
`;

  align-items: center;
  gap: 0.5 rem;
  padding: 0.75 rem 1.5 rem;
  border-radius: 0.5 rem;
  font-size: 0.875 rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2 s;
  border: none;

  &.primary {
    background-color: ${({ theme }) => theme.colors.primary};
    color: white;

    &:hover {
      background-color: ${({ theme }) => theme.colors.primaryDark};
    }
  }

  &.secondary {
    background-color: transparent;
    color: ${({ theme }) => theme.colors.primary};
    border: 1 px solid ${({ theme }) => theme.colors.primary};

    &:hover {
      background-color: ${({ theme }) => theme.colors.primary}10;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 18 px;
    height: 18 px;
  }
`;

  align-items: center;
  gap: 0.5 rem;
  padding: 0.5 rem 1 rem;
  border-radius: 0.375 rem;
  font-size: 0.875 rem;
  font-weight: 500;

  &.idle {
    background-color: ${({ theme }) => theme.colors.gray100};
    color: ${({ theme }) => theme.colors.gray700};
  }

  &.loading {
    background-color: ${({ theme }) => theme.colors.info}20;
    color: ${({ theme }) => theme.colors.info};
  }

  &.success {
    background-color: ${({ theme }) => theme.colors.success}20;
    color: ${({ theme }) => theme.colors.success};
  }

  &.error {
    background-color: ${({ theme }) => theme.colors.error}20;
    color: ${({ theme }) => theme.colors.error};
  }
`;

const ErrorMessage = styled.div`;
  display: flex;
  align-items: center;
  gap: 0.5 rem;
  padding: 1 rem;
  background-color: ${({ theme }) => theme.colors.error}10;
  border: 1 px solid ${({ theme }) => theme.colors.error}30;
  border-radius: 0.5 rem;
  color: ${({ theme }) => theme.colors.error};
  font-size: 0.875 rem;
  margin: 1 rem 0;

  svg {
    flex-shrink: 0;
  }
`;

const APICallDemo = styled.div`;
  background-color: ${({ theme }) => theme.colors.gray100};
  border: 1 px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.375 rem;
  padding: 1 rem;
  margin: 1 rem 0;

  h4 {
    margin: 0 0 0.5 rem 0;
    color: ${({ theme }) => theme.colors.gray900};
    font-size: 1 rem;
  }

  .request {
    background-color: ${({ theme }) => theme.colors.gray100};
    padding: 0.5 rem;
    border-radius: 0.25 rem;
    margin-bottom: 0.5 rem;
    font-family: monospace;
    font-size: 0.8 rem;
    color: ${({ theme }) => theme.colors.gray800};
  }

  .response {
    background-color: #f0 fdf4;
    border: 1 px solid #bbf7 d0;
    padding: 0.5 rem;
    border-radius: 0.25 rem;
    font-family: monospace;
    font-size: 0.8 rem;
    color: #166534;
  }
`;

type Tokens = {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
};

type ApiCall = {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  response?: { status: number; data: unknown };
};

const WorkerTokenFlow = () => {;
  const { config } = useAuth();
  const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [currentStep, setCurrentStep] = useState<number>(0);

  const [apiCall, setApiCall] = useState<ApiCall | null>(null);

  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('');
  const [redirectParams, setRedirectParams] = useState<Record<string, string>>({});

  // Track execution results for each step
  const [stepResults, setStepResults] = useState<Record<number, unknown>>({});
  const [executedSteps, setExecutedSteps] = useState<Set<number>>(new Set());
  const [stepsWithResults, setStepsWithResults] = useState<FlowStep[]>([]);

  const startWorkerTokenFlow = async () => {;
    setDemoStatus('loading');
    setCurrentStep(0);
    setError(null);
    setTokensReceived(null);
    setApiCall(null);
    setStepResults({});
    setExecutedSteps(new Set());
    setStepsWithResults([]);
    setStepsWithResults([...steps]); // Initialize with copy of steps
    logger.flow('WorkerTokenFlow', 'Starting worker token flow...');
  };

  const makeAuthenticatedAPICall = async () => {;
    if (!tokensReceived?.access_token) return;

    try {
      setCurrentStep(5);

      const apiRequest: ApiCall = {
        method: 'GET',
        url: `${config?.apiUrl}/environments/${config?.environmentId}/populations`,
        headers: {
          'Authorization': `Bearer ${tokensReceived.access_token}`,
          'Content-Type': 'application/json'
        }
      };

      setApiCall(apiRequest);

      // Simulate API response
      setTimeout(() => {
        const apiResponse = {
          status: 200,
          data: {
            message: 'Successfully accessed PingOne Management API',
            timestamp: new Date().toISOString(),
            scope: tokensReceived.scope,
            environment_id: config?.environmentId
          };
        };

        setApiCall({ ...apiRequest, response: apiResponse });
        setCurrentStep(6);
      }, 1500);

    } catch (err) {
      console.error('API call failed:', err);
      setError('Failed to make authenticated API call.');
      setDemoStatus('error');
    }
  };

  const resetDemo = () => {;
    setDemoStatus('idle');
    setCurrentStep(0);
    setTokensReceived(null);
    setError(null);
    setApiCall(null);
    setStepResults({});
    setExecutedSteps(new Set());
    setStepsWithResults([]);
    logger.success('WorkerTokenFlow', 'Demo reset completed');
  };

  const handleStepResult = (stepIndex: number, result: unknown) => {;
    setStepResults(prev => ({ ...prev, [stepIndex]: result }));
    setStepsWithResults(prev => {
      const newSteps = [...prev];
      if (newSteps[stepIndex]) {
        newSteps[stepIndex] = { ...newSteps[stepIndex], result };
      }
      return newSteps;
    });
  };

  const handleRedirectModalClose = () => {;
    setShowRedirectModal(false);
    setRedirectUrl('');
    setRedirectParams({});
  };

  const handleRedirectModalProceed = () => {;
    logger.flow('WorkerTokenFlow', 'Proceeding with redirect to PingOne', { url: redirectUrl });
    
    // Store the return path for after callback
    const currentPath = window.location.pathname;
    // Ensure we use the correct route path regardless of current path
    const correctPath = currentPath.includes('/oidc/') ? '/flows-old/worker-token' : currentPath;
    const returnPath = `${correctPath}?step=1`; // Return to step 1 (token request)
    sessionStorage.setItem('redirect_after_login', returnPath);
    
    // Store flow context in state parameter
    const stateParam = new URLSearchParams(redirectUrl.split('?')[1]?.split('#')[0] || '').get('state');
    if (stateParam) {
      // Encode flow context in the state parameter
      const flowContext = {
        flow: 'worker-token',
        step: 1,
        returnPath: returnPath,
        timestamp: Date.now();
      };
      sessionStorage.setItem(`flow_context_${stateParam}`, JSON.stringify(flowContext));
    }
    
    console.log('🔄 [WorkerTokenFlow] Stored return path:', returnPath);
    window.location.href = redirectUrl;
  };

  const steps: FlowStep[] = [
    {
      title: 'Prepare Worker Token Request',
      description: 'Create the token request with Worker app credentials using Basic authentication',
      code: `// Worker Token Request

const tokenRequest = {
  method: 'POST',
  url: 'https://auth.pingone.com/{{environmentId}}/as/token',
  headers: {
    'Authorization': \`Basic \${credentials}\`,
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: 'grant_type=client_credentials&scope=pingone:read pingone:write';
};`,
      execute: () => {
        if (!config || !config.pingone) {
          setError('Configuration required. Please configure your PingOne settings first.');
          return { error: 'Configuration required' };
        }

        const tokenRequest: ApiCall = {
          method: 'POST',
          url: `${config.pingone.tokenEndpoint}`,
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: 'grant_type=client_credentials&scope=pingone:read pingone:write'
        };

        const mockResponse = {
          status: 'Token request prepared successfully',
          endpoint: config.pingone.tokenEndpoint,
          method: 'POST',
          authorization: `Basic ${credentials.substring(0, 20)}...`,
          body: 'grant_type=client_credentials&scope=pingone:read pingone:write';
        };

        setApiCall(tokenRequest);

        setStepResults(prev => ({ ...prev, 0: result }));
        setExecutedSteps(prev => new Set(prev).add(0));
        logger.flow('WorkerTokenFlow', 'Worker token request prepared');
        return result;
      }
    },
    {
      title: 'Send Token Request to PingOne',
      description: 'Send the token request to PingOne authorization server',
      code: `// Send request to PingOne

const tokenData = await response.json();`,
      execute: async () => {
        if (!config || !config.pingone) {
          setError('Configuration required. Please configure your PingOne settings first.');
          return { error: 'Configuration required' };
        }

        try {
          setCurrentStep(1);
          setIsLoading(true);

          // Validate configuration
          if (!config.pingone.clientId || !config.pingone.clientSecret || !config.pingone.tokenEndpoint) {
            const missingFields = [];
            if (!config.pingone.clientId) missingFields.push('clientId');
            if (!config.pingone.clientSecret) missingFields.push('clientSecret');
            if (!config.pingone.tokenEndpoint) missingFields.push('tokenEndpoint');
            
            const errorMsg = `Missing required configuration: ${missingFields.join(', ')}. Please configure your PingOne settings first.`;
            logger.error('WorkerTokenFlow', 'Configuration validation failed', {
              missingFields,
              config: {
                hasClientId: !!config.pingone.clientId,
                hasClientSecret: !!config.pingone.clientSecret,
                hasTokenEndpoint: !!config.pingone.tokenEndpoint,
                tokenEndpoint: config.pingone.tokenEndpoint
              }
            });
            throw new Error(errorMsg);
          }

          // Validate token endpoint format
          try {
            new URL(config.pingone.tokenEndpoint);
          } catch (urlError) {
            const errorMsg = `Invalid token endpoint URL: ${config.pingone.tokenEndpoint}. Please check your PingOne configuration.`;
            logger.error('WorkerTokenFlow', 'Invalid token endpoint', {
              tokenEndpoint: config.pingone.tokenEndpoint,
              error: urlError
            });
            throw new Error(errorMsg);
          }

          logger.flow('WorkerTokenFlow', 'Making real API call to PingOne', {
            tokenEndpoint: config.pingone.tokenEndpoint,
            clientId: config.pingone.clientId,
            hasClientSecret: !!config.pingone.clientSecret
          });
          
          // Make actual request to PingOne via backend proxy
          const backendUrl = process.env.NODE_ENV === 'production' 
            ? 'https://oauth-playground.vercel.app' ;
            : 'http://localhost:3001';

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            logger.error('WorkerTokenFlow', 'PingOne API call failed', {
              status: response.status,
              statusText: response.statusText,
              error: errorData,
              tokenEndpoint: config.pingone.tokenEndpoint,
              clientId: config.pingone.clientId
            });
            
            let errorMessage = `PingOne API call failed: ${response.status} ${response.statusText}`;
            
            if (response.status === 401) {
              errorMessage += '. Authentication failed. Please check:';
              errorMessage += '\n1. Client ID is correct';
              errorMessage += '\n2. Client Secret is correct';
              errorMessage += '\n3. Environment ID is correct';
              errorMessage += '\n4. Token endpoint URL is correct';
              errorMessage += `\n\nCurrent configuration:`;
              errorMessage += `\n- Client ID: ${config.pingone.clientId}`;
              errorMessage += `\n- Token Endpoint: ${config.pingone.tokenEndpoint}`;
              errorMessage += `\n- Environment ID: ${config.pingone.environmentId}`;
            } else if (response.status === 400) {
              errorMessage += '. Bad request. Please check:';
              errorMessage += '\n1. Grant type is correct (client_credentials)';
              errorMessage += '\n2. Scope is valid for your application';
              errorMessage += '\n3. Request format is correct';
            } else if (response.status === 403) {
              errorMessage += '. Access forbidden. Please check:';
              errorMessage += '\n1. Application has proper permissions';
              errorMessage += '\n2. Scope is authorized for your application';
            }
            
            if (errorData.error_description) {
              errorMessage += `\n\nPingOne Error: ${errorData.error_description}`;
            }
            if (errorData.error) {
              errorMessage += `\n\nError Code: ${errorData.error}`;
            }
            
            throw new Error(errorMessage);
          }

          const tokenData = await response.json();
          
          // Store tokens
          setTokensReceived(tokenData);
          await storeOAuthTokens('worker_token', tokenData);

          setStepResults(prev => ({ ...prev, 1: result }));
          setExecutedSteps(prev => new Set(prev).add(1));
          setDemoStatus('success');
          setCurrentStep(2);
          
          logger.success('WorkerTokenFlow', 'Worker token obtained successfully', { 
            token_type: tokenData.token_type,
            expires_in: tokenData.expires_in,
            scope: tokenData.scope
          });
          
          return result;
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setError(`Failed to get worker token: ${errorMessage}`);
          setDemoStatus('error');
          logger.error('WorkerTokenFlow', 'Failed to get worker token', { error: error.message });
          return { error: error.message };
        } finally {
          setIsLoading(false);
        }
      }
    },
    {
      title: 'Use Token for API Calls',
      description: 'Use the worker token to make authenticated calls to PingOne Management API',
      code: `// Make authenticated API call
const apiResponse = await fetch('https://api.pingone.com/v1/environments/{{environmentId}}/populations', {
  method: 'GET',
  headers: {
    'Authorization': \`Bearer \${access_token}\`,
    'Content-Type': 'application/json'
  };
});

const data = await apiResponse.json();`,
      execute: () => {
        if (!tokensReceived?.access_token) {
          setError('No access token available. Please complete previous steps first.');
          return { error: 'No access token available' };
        }

        makeAuthenticatedAPICall();

        setStepResults(prev => ({ ...prev, 2: result }));
        setExecutedSteps(prev => new Set(prev).add(2));
        logger.flow('WorkerTokenFlow', 'API call initiated with worker token');
        return result;
      }
    }
  ];

  return (
    <Container>
      <PageTitle 
        title={
          <>
            <FiServer />
            Worker Token Flow
          </>
        }
        subtitle="Learn how to use PingOne Worker apps to get admin-level access tokens for machine-to-machine authentication."
      />

      <FlowCredentials
        flowType="worker_token"
        onCredentialsChange={(credentials) => {
          logger.config('WorkerTokenFlow', 'Worker credentials updated', credentials);
        }}
      />

      <CallbackUrlDisplay flowType="worker-token" />

      <FlowOverview>
        <CardHeader>
          <h2>Flow Overview</h2>
        </CardHeader>
        <CardBody>
          <FlowDescription>
            <h2>What is a Worker Token?</h2>
            <p>
              A Worker Token is an admin-level access token obtained from a PingOne Worker app. 
              Worker apps are designed for machine-to-machine authentication and have admin-level 
              permissions to access PingOne Management APIs.
            </p>
            <p>
              <strong>How it works:</strong> The Worker app sends its credentials (Client ID and Secret) 
              to PingOne's token endpoint using Basic authentication. PingOne validates the credentials 
              and returns an access token that can be used to make authenticated calls to the Management API.
            </p>
          </FlowDescription>

          <UseCaseHighlight>
            <FiKey size={20} />
            <div>
              <h3>Perfect For</h3>
              <p>
                Admin operations, environment management, user provisioning, application management, 
                and any scenario requiring elevated permissions in PingOne.
              </p>
            </div>
          </UseCaseHighlight>
        </CardBody>
      </FlowOverview>

      <DemoSection>
        <CardHeader>
          <h2>Interactive Demo</h2>
        </CardHeader>
        <CardBody>
          <div style={{ marginBottom: '1.5 rem' }}>
            <StatusIndicator className={demoStatus}>
              {demoStatus === 'idle' && <FiPlay size={16} />}
              {demoStatus === 'loading' && <Spinner size={16} />}
              {demoStatus === 'success' && <FiCheckCircle size={16} />}
              {demoStatus === 'error' && <FiAlertCircle size={16} />}
              {demoStatus === 'idle' && 'Ready to start Worker Token flow'}
              {demoStatus === 'loading' && 'Processing...'}
              {demoStatus === 'success' && 'Worker token obtained successfully!'}
              {demoStatus === 'error' && 'Error occurred'}
            </StatusIndicator>
          </div>

          <div style={{ display: 'flex', gap: '1 rem', marginBottom: '1.5 rem' }}>
            <DemoButton
              className="primary"
              onClick={startWorkerTokenFlow}
              disabled={!config || demoStatus === 'loading'}
            >
              <FiPlay />
              Start Worker Token Flow
            </DemoButton>
            
            <DemoButton
              className="secondary"
              onClick={resetDemo}
              disabled={demoStatus === 'loading'}
            >
              <FiRefreshCw />
              Reset Demo
            </DemoButton>
          </div>

          {!config && (
            <ErrorMessage>
              <FiAlertCircle />
              <strong>Configuration Required:</strong> Please configure your PingOne settings first.
            </ErrorMessage>
          )}

          {error && (
            <ErrorMessage>
              <FiAlertCircle />
              <strong>Error:</strong> {error}
            </ErrorMessage>
          )}

          <StepByStepFlow
            steps={steps}
            onStart={startWorkerTokenFlow}
            onReset={resetDemo}
            status={demoStatus}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            onStepResult={handleStepResult}
            disabled={!config}
            title="Worker Token Flow"
            configurationButton={
              <ConfigurationButton flowType="worker_token" />
            }
          />

          {tokensReceived && (
            <div style={{ marginTop: '2 rem' }}>
              <h3>Received Tokens</h3>
              <TokenDisplayComponent tokens={tokensReceived} />
            </div>
          )}

          {apiCall && (
            <APICallDemo>
              <h4>API Call Details:</h4>
              <div className="request">
                <strong>{apiCall.method}</strong> {apiCall.url}<br />
                {Object.entries(apiCall.headers).map(([key, value]) => (
                  <div key={key}>{key}: {key === 'Authorization' ? value.substring(0, 20) + '...' : value}</div>
                ))}
                {apiCall.body && <div><br />{apiCall.body}</div>}
              </div>
              {apiCall.response && (
                <div className="response">
                  Status: {apiCall.response.status}<br />
                  <JSONHighlighter data={apiCall.response.data} />
                </div>
              )}
            </APICallDemo>
          )}
        </CardBody>
      </DemoSection>

      {/* Redirect Modal */}
      <AuthorizationRequestModal
        isOpen={showRedirectModal}
        onClose={handleRedirectModalClose}
        onProceed={handleRedirectModalProceed}
        authorizationUrl={redirectUrl}
        requestParams={redirectParams}
      />
    </Container>
  );
};

export default WorkerTokenFlow;


