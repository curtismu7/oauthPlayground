import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { FiPlay, FiEye, FiCheckCircle, FiAlertCircle, FiCode, FiServer, FiKey } from 'react-icons/fi';
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
import ContextualHelp from '../../components/ContextualHelp';
import ConfigurationStatus from '../../components/ConfigurationStatus';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;



const FlowOverview = styled(Card)`
  margin-bottom: 2rem;
`;

const FlowDescription = styled.div`
  margin-bottom: 2rem;

  h2 {
    color: ${({ theme }) => theme.colors.gray900};
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  p {
    color: ${({ theme }) => theme.colors.gray600};
    line-height: 1.6;
    margin-bottom: 1rem;
  }
`;

const UseCaseHighlight = styled.div`
  background-color: ${({ theme }) => theme.colors.success}10;
  border: 1px solid ${({ theme }) => theme.colors.success}30;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  svg {
    color: ${({ theme }) => theme.colors.success};
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  h3 {
    color: ${({ theme }) => theme.colors.success};
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.success};
    font-size: 0.9rem;
  }
`;

const DemoSection = styled(Card)`
  margin-bottom: 2rem;
`;

const DemoControls = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const DemoButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &.primary {
    background-color: ${({ theme }) => theme.colors.primary};
    color: white;
    border: 1px solid transparent;

    &:hover {
      background-color: ${({ theme }) => theme.colors.primaryDark};
    }
  }

  &.secondary {
    background-color: transparent;
    color: ${({ theme }) => theme.colors.primary};
    border: 1px solid ${({ theme }) => theme.colors.primary};

    &:hover {
      background-color: ${({ theme }) => theme.colors.primary}10;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
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
    background-color: ${({ theme }) => theme.colors.danger}20;
    color: ${({ theme }) => theme.colors.danger};
  }
`;



const CodeBlock = styled.pre`
  background-color: ${({ theme }) => theme.colors.gray900};
  color: ${({ theme }) => theme.colors.gray100};
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  font-size: 0.875rem;
  margin: 1rem 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  border: 1px solid ${({ theme }) => theme.colors.gray800};
  white-space: pre-wrap;
`;

const TokenDisplay = styled.div`
  background-color: #000000;
  border: 2px solid #374151;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  font-family: monospace;
  font-size: 0.875rem;
  word-break: break-all;
  color: #ffffff;
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.3);
`;

const ErrorMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.danger}10;
  border: 1px solid ${({ theme }) => theme.colors.danger}30;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 0.9rem;
`;

const ResponseBox = styled.div<{ $backgroundColor?: string; $borderColor?: string }>`
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid ${({ $borderColor }) => $borderColor || '#374151'};
  background-color: ${({ $backgroundColor }) => $backgroundColor || '#1f2937'};
  font-family: monospace;
  font-size: 0.875rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
  overflow: visible;
  max-width: 100%;
  color: #f9fafb;

  h4 {
    margin: 0 0 0.5rem 0;
    font-family: inherit;
    font-size: 1rem;
    font-weight: 600;
    color: #f9fafb;
  }

  pre {
    margin: 0;
    background: none;
    padding: 0;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    white-space: pre-wrap;
    word-break: break-all;
    overflow: visible;
    color: #f9fafb !important;
  }
`;

const APICallDemo = styled.div`
  background-color: ${({ theme }) => theme.colors.gray100};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;

  h4 {
    margin: 0 0 0.5rem 0;
    color: ${({ theme }) => theme.colors.gray900};
    font-size: 1rem;
  }

  .request {
    background-color: ${({ theme }) => theme.colors.gray100};
    padding: 0.5rem;
    border-radius: 0.25rem;
    margin-bottom: 0.5rem;
    font-family: monospace;
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.gray800};
  }

  .response {
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
    padding: 0.5rem;
    border-radius: 0.25rem;
    font-family: monospace;
    font-size: 0.8rem;
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

const ClientCredentialsFlow = () => {
  const { config } = useAuth();
  const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [tokensReceived, setTokensReceived] = useState<Tokens | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiCall, setApiCall] = useState<ApiCall | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Track execution results for each step
  const [stepResults, setStepResults] = useState<Record<number, unknown>>({});
  const [executedSteps, setExecutedSteps] = useState<Set<number>>(new Set());
  const [stepsWithResults, setStepsWithResults] = useState<FlowStep[]>([]);

  const startClientCredentialsFlow = async () => {
    setDemoStatus('loading');
    setCurrentStep(0);
    setError(null);
    setTokensReceived(null);
    setApiCall(null);
    setStepResults({});
    setExecutedSteps(new Set());
    setStepsWithResults([]);
    setStepsWithResults([...steps]); // Initialize with copy of steps
    console.log('🚀 [ClientCredentialsFlow] Starting client credentials flow...');
  };

  const makeAuthenticatedAPICall = async () => {
    if (!tokensReceived?.access_token) return;

    try {
      setCurrentStep(5);

      const apiRequest: ApiCall = {
        method: 'GET',
        url: 'https://api.example.com/data',
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
            message: 'Successfully accessed protected resource',
            timestamp: new Date().toISOString(),
            scope: tokensReceived.scope
          }
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

  const resetDemo = () => {
    setDemoStatus('idle');
    setCurrentStep(0);
    setTokensReceived(null);
    setError(null);
    setApiCall(null);
    setStepResults({});
    setExecutedSteps(new Set());
  };

  const handleStepResult = (stepIndex: number, result: unknown) => {
    setStepResults(prev => ({ ...prev, [stepIndex]: result }));
    setStepsWithResults(prev => {
      const newSteps = [...prev];
      if (newSteps[stepIndex]) {
        newSteps[stepIndex] = { ...newSteps[stepIndex], result };
      }
      return newSteps;
    });
  };

  const steps: FlowStep[] = [
    {
      title: 'Prepare Client Credentials',
      description: 'Server prepares client credentials for authentication',
      code: `// Base64 encode client credentials
const credentials = btoa(clientId + ':' + clientSecret);

// Example:
const credentials = btoa('${config?.pingone?.clientId || 'your_client_id'}:${config?.pingone?.clientSecret || 'your_client_secret'}');
// Result: ${config ? btoa(`${config.pingone.clientId}:${config.pingone.clientSecret}`).substring(0, 20) + '...' : 'Base64_encoded_credentials'}`,
      execute: () => {
        if (!config || !config.pingone) {
          setError('Configuration required. Please configure your PingOne settings first.');
          return;
        }

        const credentials = btoa(`${config.pingone.clientId}:${config.pingone.clientSecret}`);
        const result = { credentials: credentials.substring(0, 20) + '...' };
        setStepResults(prev => ({ ...prev, 0: result }));
        setExecutedSteps(prev => new Set(prev).add(0));
        console.log('✅ [ClientCredentialsFlow] Client credentials prepared:', credentials.substring(0, 20) + '...');
        return result;
      }
    },
    {
      title: 'Request Access Token',
      description: 'Server requests access token using client credentials',
      code: `// POST request to token endpoint
POST ${config?.pingone?.tokenEndpoint || 'https://auth.pingone.com/token'}
Authorization: Basic ${config ? btoa(`${config.pingone.clientId}:${config.pingone.clientSecret}`).substring(0, 20) + '...' : 'Base64_encoded_credentials'}
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&scope=api:read`,
      execute: async () => {
        if (!config || !config.pingone) {
          setError('Configuration required. Please configure your PingOne settings first.');
          return;
        }

        const credentials = btoa(`${config.pingone.clientId}:${config.pingone.clientSecret}`);
        const tokenRequest: ApiCall = {
          method: 'POST',
          url: config.pingone.tokenEndpoint,
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: 'grant_type=client_credentials&scope=api:read'
        };

        try {
          // Make real API call to PingOne via backend proxy
          const backendUrl = process.env.NODE_ENV === 'production' 
            ? 'https://oauth-playground.vercel.app' 
            : 'http://localhost:3001';
          
          const response = await fetch(`${backendUrl}/api/token-exchange`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              grant_type: 'client_credentials',
              client_id: config.pingone.clientId,
              client_secret: config.pingone.clientSecret,
              environment_id: config.pingone.environmentId,
              scope: 'api:read'
            })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Token request failed: ${response.status} ${response.statusText}. ${errorData.error_description || errorData.error || 'Please check your configuration and credentials.'}`);
          }

          const tokenData = await response.json();
          
          const realResponse = {
            status: response.status,
            statusText: response.statusText,
            data: tokenData,
            endpoint: config.pingone.tokenEndpoint,
            method: 'POST',
            authorization: `Basic ${credentials.substring(0, 20)}...`,
            body: 'grant_type=client_credentials&scope=api:read'
          };

          setApiCall(tokenRequest);
          const result = { 
            request: tokenRequest,
            response: realResponse,
            message: 'Token request sent successfully to PingOne'
          };
          setStepResults(prev => ({ ...prev, 1: result }));
          setExecutedSteps(prev => new Set(prev).add(1));
          console.log('✅ [ClientCredentialsFlow] Real token request completed');
          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setError(errorMessage);
          console.error('❌ [ClientCredentialsFlow] Token request failed:', error);
          return { error: errorMessage };
        }
      }
    },
    {
      title: 'Authorization Server Validates Credentials',
      description: 'Server validates client ID and secret',
      code: `// Server-side validation
const authHeader = request.headers.authorization;
const [type, credentials] = authHeader.split(' ');

if (type !== 'Basic') {
  return { error: 'invalid_request' };
}

const decoded = atob(credentials);
const [clientId, clientSecret] = decoded.split(':');

// Validate against stored credentials
if (clientId !== storedClientId || clientSecret !== storedClientSecret) {
  return { error: 'invalid_client' };
}

// Generate access token
const accessToken = generateAccessToken(clientId, scope);`,
      execute: () => {
        console.log('✅ [ClientCredentialsFlow] Server validation simulated');
        const result = { message: 'Server validated credentials successfully' };
        setStepResults(prev => ({ ...prev, 2: result }));
        setExecutedSteps(prev => new Set(prev).add(2));
        return result;
      }
    },
    {
      title: 'Receive Access Token',
      description: 'Server receives access token for API calls',
      code: `{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "api:read"
}

// Token contains:
// - sub: client_id (for client credentials)
// - scope: granted permissions
// - iat: issued at time
// - exp: expiration time`,
      execute: async () => {
        if (!config || !config.pingone) {
          setError('Configuration required. Please configure your PingOne settings first.');
          return;
        }

        try {
          const backendUrl = process.env.NODE_ENV === 'production' 
            ? 'https://oauth-playground.vercel.app' 
            : 'http://localhost:3001';

          const response = await fetch(`${backendUrl}/api/token-exchange`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              grant_type: 'client_credentials',
              client_id: config.pingone.clientId,
              client_secret: config.pingone.clientSecret,
              environment_id: config.pingone.environmentId,
              scope: 'api:read'
            })
          });

          if (!response.ok) {
            throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
          }

          const tokenData = await response.json();
          setTokensReceived(tokenData);
          const result = { response: tokenData, status: response.status };
          setStepResults(prev => ({ ...prev, 3: result }));
          setExecutedSteps(prev => new Set(prev).add(3));

          // Store tokens using the shared utility
          const tokensForStorage = {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            token_type: tokenData.token_type,
            expires_in: tokenData.expires_in,
            scope: tokenData.scope || 'api:read'
          };
          
          const success = storeOAuthTokens(tokensForStorage, 'client_credentials', 'Client Credentials Flow');
          if (success) {
            console.log('✅ [ClientCredentialsFlow] Tokens received and stored successfully');
          } else {
            console.error('❌ [ClientCredentialsFlow] Failed to store tokens');
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setError(`Failed to exchange credentials for tokens: ${errorMessage}`);
          console.error('❌ [ClientCredentialsFlow] Token exchange error:', error);
        }
      }
    },
    {
      title: 'Make Authenticated API Calls',
      description: 'Use access token to authenticate API requests',
      code: `// Include Bearer token in Authorization header
const headers = {
  'Authorization': 'Bearer ' + accessToken,
  'Content-Type': 'application/json'
};

fetch('/api/protected-resource', {
  method: 'GET',
  headers: headers
})
.then(response => response.json())
.then(data => {
  console.log('API Response:', data);
});`,
      execute: () => {
        if (!tokensReceived) {
          setError('No tokens received from previous step');
          return;
        }

        console.log('✅ [ClientCredentialsFlow] Ready to make authenticated API calls');
        const result = { tokens: tokensReceived };
        setStepResults(prev => ({ ...prev, 4: result }));
        setExecutedSteps(prev => new Set(prev).add(4));
        setDemoStatus('success');
        return result;
      }
    },
    {
      title: 'Handle API Response',
      description: 'Process the response from the protected resource',
      code: `// Successful response
{
  "data": "Protected resource content",
  "timestamp": "${new Date().toISOString()}",
  "scope": "api:read",
  "client_id": "${config?.clientId || 'your_client_id'}"
}

// Error response (if token invalid)
{
  "error": "invalid_token",
  "error_description": "The access token expired"
}`,
      execute: async () => {
        if (!tokensReceived?.access_token) {
          setError('No access token available');
          return;
        }

        try {
          // Simulate API call (in real implementation, this would be an actual API endpoint)
          const apiResponse = {
            data: "Protected resource content",
            timestamp: new Date().toISOString(),
            scope: "api:read",
            client_id: config?.clientId || 'your_client_id'
          };

          const result = { apiResponse };
          setStepResults(prev => ({ ...prev, 5: result }));
          setExecutedSteps(prev => new Set(prev).add(5));
          return result;

          console.log('✅ [ClientCredentialsFlow] API call completed');
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setError(`Failed to make API call: ${errorMessage}`);
          console.error('❌ [ClientCredentialsFlow] API call error:', error);
        }
      }
    }
  ];

  return (
    <Container>
      <PageTitle 
        title={
          <>
            <FiServer />
            Client Credentials Flow
          </>
        }
        subtitle="Learn how the Client Credentials flow works for machine-to-machine authentication with real API calls to PingOne."
      />

      <ConfigurationStatus 
        config={config} 
        onConfigure={() => {
          console.log('🔧 [ClientCredentialsFlow] Configuration button clicked');
        }}
        flowType="client-credentials"
      />

      <ContextualHelp flowId="client-credentials" />

      <FlowCredentials
        flowType="client_credentials"
        onCredentialsChange={(credentials) => {
          console.log('Client Credentials flow credentials updated:', credentials);
        }}
      />

      <FlowOverview>
        <CardHeader>
          <h2>Flow Overview</h2>
        </CardHeader>
        <CardBody>
          <FlowDescription>
            <h2>What is Client Credentials?</h2>
            <p>
              The Client Credentials flow is used for machine-to-machine authentication where
              there is no user interaction. The client application directly requests an access
              token using its client credentials (ID and secret).
            </p>
            <p>
              <strong>How it works:</strong> The client sends its credentials to the authorization
              server's token endpoint and receives an access token that can be used to authenticate
              API requests.
            </p>
          </FlowDescription>

          <UseCaseHighlight>
            <FiKey size={20} />
            <div>
              <h3>Perfect For</h3>
              <p>
                Server-to-server communication, background processes, automated API calls,
                and any scenario where user interaction isn't needed.
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
          <StepByStepFlow
            steps={stepsWithResults.length > 0 ? stepsWithResults : steps}
            onStart={startClientCredentialsFlow}
            onReset={resetDemo}
            status={demoStatus}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            onStepResult={handleStepResult}
            disabled={!config}
            title="Client Credentials Flow"
            configurationButton={
              <ConfigurationButton flowType="client_credentials" />
            }
          />

          {!config && (
            <ErrorMessage>
              <FiAlertCircle />
              <strong>Configuration Required:</strong> Please configure your PingOne settings
              in the Configuration page before running this demo.
            </ErrorMessage>
          )}

          {error && (
            <ErrorMessage>
              <FiAlertCircle />
              <strong>Error:</strong> {error}
            </ErrorMessage>
          )}

          {tokensReceived && (
            <div>
              <h3>Access Token Received:</h3>
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
                  {JSON.stringify(apiCall.response.data, null, 2)}
                </div>
              )}
            </APICallDemo>
          )}

          
        </CardBody>
      </DemoSection>
    </Container>
  );
};

export default ClientCredentialsFlow;
