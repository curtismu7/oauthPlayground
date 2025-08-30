import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { FiPlay, FiEye, FiCheckCircle, FiAlertCircle, FiCode, FiServer, FiKey } from 'react-icons/fi';
import { useOAuth } from '../../contexts/OAuthContext';
import Spinner from '../../components/Spinner';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const Header = styled.div`
  margin-bottom: 2rem;

  h1 {
    font-size: 2.5rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  p {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 1.1rem;
    line-height: 1.6;
  }
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

const StepsContainer = styled.div`
  margin-top: 2rem;
`;

const Step = styled.div<{ $active?: boolean; $completed?: boolean; $error?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  border-radius: 0.5rem;
  background-color: ${({ $active: active, $completed: completed, $error: error }) => {
    if (error) return 'rgba(239, 68, 68, 0.1)';
    if (completed) return 'rgba(34, 197, 94, 0.1)';
    if (active) return 'rgba(59, 130, 246, 0.1)';
    return 'transparent';
  }};
  border: 2px solid ${({ $active: active, $completed: completed, $error: error }) => {
    if (error) return '#ef4444';
    if (completed) return '#22c55e';
    if (active) return '#3b82f6';
    return 'transparent';
  }};
`;

const StepNumber = styled.div<{ $active?: boolean; $completed?: boolean; $error?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  font-weight: 600;
  font-size: 1rem;
  flex-shrink: 0;

  ${({ $active: active, $completed: completed, $error: error }) => {
    if (error) {
      return `
        background-color: #ef4444;
        color: white;
      `;
    }
    if (completed) {
      return `
        background-color: #22c55e;
        color: white;
      `;
    }
    if (active) {
      return `
        background-color: #3b82f6;
        color: white;
      `;
    }
    return `
      background-color: #e5e7eb;
      color: #6b7280;
    `;
  }}
`;

const StepContent = styled.div`
  flex: 1;

  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
  }

  p {
    margin: 0 0 1rem 0;
    color: ${({ theme }) => theme.colors.gray600};
    line-height: 1.5;
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
`;

const TokenDisplay = styled.div`
  background-color: ${({ theme }) => theme.colors.gray100};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  font-family: monospace;
  font-size: 0.875rem;
  word-break: break-all;
  color: ${({ theme }) => theme.colors.gray800};
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
  const { config } = useOAuth() as any;
  const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [tokensReceived, setTokensReceived] = useState<Tokens | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiCall, setApiCall] = useState<ApiCall | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const startClientCredentialsFlow = async () => {
    setDemoStatus('loading');
    setIsLoading(true);
    setError(null);
    setTokensReceived(null);
    setApiCall(null);

    try {
      setCurrentStep(1);

      // Simulate preparing credentials
      const credentials = btoa(`${config.clientId}:${config.clientSecret}`);
      setCurrentStep(2);

      // Simulate the API call
      const tokenRequest: ApiCall = {
        method: 'POST',
        url: `${config.apiUrl}/token`,
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials&scope=api:read'
      };

      setApiCall(tokenRequest);
      setCurrentStep(3);

      // Simulate receiving tokens
      setTimeout(() => {
        const mockTokens: Tokens = {
          access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbGllbnRfY3JlZGVudGlhbHMiLCJzY29wZSI6ImFwaTpyZWFkIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNzUwMjJ9.machine_access_token_signature',
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'api:read'
        };

        setTokensReceived(mockTokens);
        setCurrentStep(4);
        setDemoStatus('success');
      }, 2000);

    } catch (err) {
      console.error('Client credentials flow failed:', err);
      setError('Failed to execute client credentials flow. Please check your configuration.');
      setDemoStatus('error');
      setIsLoading(false);
    }
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
  };

  const steps = [
    {
      title: 'Prepare Client Credentials',
      description: 'Server prepares client credentials for authentication',
      code: `// Base64 encode client credentials
const credentials = btoa(clientId + ':' + clientSecret);

// Example:
const credentials = btoa('${config?.clientId || 'your_client_id'}:${config?.clientSecret || 'your_client_secret'}');
// Result: ${config ? btoa(`${config.clientId}:${config.clientSecret}`).substring(0, 20) + '...' : 'Base64_encoded_credentials'}`
    },
    {
      title: 'Request Access Token',
      description: 'Server requests access token using client credentials',
      code: `// POST request to token endpoint
POST ${config?.apiUrl || 'https://auth.pingone.com'}/token
Authorization: Basic ${config ? btoa(`${config.clientId}:${config.clientSecret}`).substring(0, 20) + '...' : 'Base64_encoded_credentials'}
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&scope=api:read`
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
const accessToken = generateAccessToken(clientId, scope);`
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
// - exp: expiration time`
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
});`
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
}`
    }
  ];

  return (
    <Container>
      <Header>
        <h1>
          <FiServer />
          Client Credentials Flow
        </h1>
        <p>
          Learn how the Client Credentials flow works for machine-to-machine authentication
          with real API calls to PingOne.
        </p>
      </Header>

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
          <DemoControls>
            <StatusIndicator className={demoStatus}>
              {demoStatus === 'idle' && 'Ready to start'}
              {demoStatus === 'loading' && 'Executing client credentials flow...'}
              {demoStatus === 'success' && 'Flow completed successfully'}
              {demoStatus === 'error' && 'Flow failed'}
            </StatusIndicator>
            <DemoButton
              className="primary"
              onClick={startClientCredentialsFlow}
              disabled={demoStatus === 'loading' || !config || isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner size={16} />
                  Running Flow...
                </>
              ) : (
                <>
                  <FiPlay />
                  Start Client Credentials Flow
                </>
              )}
            </DemoButton>
            {tokensReceived && (
              <DemoButton
                className="primary"
                onClick={makeAuthenticatedAPICall}
                disabled={currentStep < 4}
              >
                <FiCode />
                Test API Call
              </DemoButton>
            )}
            <DemoButton
              className="secondary"
              onClick={resetDemo}
              disabled={demoStatus === 'idle'}
            >
              Reset Demo
            </DemoButton>
          </DemoControls>

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
              <TokenDisplay>
                <strong>Access Token:</strong><br />
                {tokensReceived.access_token}
                <br /><br />
                <strong>Token Type:</strong> {tokensReceived.token_type}<br />
                <strong>Expires In:</strong> {tokensReceived.expires_in} seconds<br />
                <strong>Scope:</strong> {tokensReceived.scope}
              </TokenDisplay>
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

          <StepsContainer>
            <h3>Flow Steps</h3>
            {steps.map((step, index) => (
              <Step
                key={index}
                $active={currentStep === index && demoStatus === 'loading'}
                $completed={currentStep > index}
                $error={currentStep === index && demoStatus === 'error'}
              >
                <StepNumber
                  $active={currentStep === index && demoStatus === 'loading'}
                  $completed={currentStep > index}
                  $error={currentStep === index && demoStatus === 'error'}
                >
                  {index + 1}
                </StepNumber>
                <StepContent>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  <CodeBlock>{step.code}</CodeBlock>
                </StepContent>
              </Step>
            ))}
          </StepsContainer>

          {/* Manual navigation controls */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <DemoButton
              className="secondary"
              onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
              disabled={demoStatus !== 'loading' || currentStep === 0}
            >
              Previous
            </DemoButton>
            <DemoButton
              className="primary"
              onClick={() => setCurrentStep(s => Math.min(steps.length - 1, s + 1))}
              disabled={demoStatus !== 'loading' || currentStep >= steps.length - 1}
            >
              Next
            </DemoButton>
          </div>
        </CardBody>
      </DemoSection>
    </Container>
  );
};

export default ClientCredentialsFlow;
