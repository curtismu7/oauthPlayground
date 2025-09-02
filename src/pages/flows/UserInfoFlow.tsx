import React, { useState } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { FiPlay, FiAlertCircle, FiUser, FiInfo, FiSend, FiDownload } from 'react-icons/fi';
import { useAuth } from '../../contexts/NewAuthContext';
import { getUserInfo, isTokenExpired } from '../../utils/oauth';
import type { UserInfo as OIDCUserInfo } from '../../types/oauth';

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
    flex-shink: 0;
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
  flex-wrap: wrap;
`;

const DemoButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;

  ${({ variant }) =>
    variant === 'primary'
      ? `
        background-color: #3b82f6;
        color: white;
        &:hover:not(:disabled) {
          background-color: #2563eb;
        }
        &:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
        }
      `
      : `
        background-color: #f3f4f6;
        color: #374151;
        &:hover:not(:disabled) {
          background-color: #e5e7eb;
        }
        &:disabled {
          background-color: #f3f4f6;
          color: #9ca3af;
          cursor: not-allowed;
        }
      `}
`;

const StatusIndicator = styled.div<{ className?: string }>`
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &.idle {
    background-color: #f3f4f6;
    color: #6b7280;
  }

  &.loading {
    background-color: #dbeafe;
    color: #1e40af;
  }

  &.success {
    background-color: #d1fae5;
    color: #065f46;
  }

  &.error {
    background-color: #fee2e2;
    color: #991b1b;
  }
`;

const ErrorMessage = styled.div`
  background-color: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: #991b1b;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  svg {
    flex-shink: 0;
    margin-top: 0.1rem;
  }
`;

const RequestResponseSection = styled.div`
  margin: 2rem 0;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.5rem;
  overflow: hidden;
`;

const RequestSection = styled.div`
  background-color: #f0f9ff;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray200};
  padding: 1.5rem;

  h3 {
    margin: 0 0 1rem 0;
    color: #0369a1;
    font-size: 1.125rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const ResponseSection = styled.div`
  background-color: #f0fdf4;
  padding: 1.5rem;

  h3 {
    margin: 0 0 1rem 0;
    color: #166534;
    font-size: 1.125rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
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
  position: relative;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const JsonResponse = styled.div`
  background-color: white;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.375rem;
  padding: 1.5rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray800};
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
`;

const JsonKey = styled.span`
  color: #059669;
  font-weight: 600;
`;

const JsonString = styled.span`
  color: #dc2626;
`;

const JsonNumber = styled.span`
  color: #7c3aed;
`;

const JsonBoolean = styled.span`
  color: #ea580c;
`;

const JsonNull = styled.span`
  color: #6b7280;
  font-style: italic;
`;

const StepsContainer = styled.div`
  margin-top: 2rem;
`;

const Step = styled.div<{
  $active?: boolean;
  $completed?: boolean;
  $error?: boolean;
}>`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 2px solid transparent;
  transition: all 0.2s;

  ${({ $active: active, $completed: completed, $error: error }) => {
    if (error) {
      return `
        border-color: #ef4444;
        background-color: #fef2f2;
      `;
    }
    if (completed) {
      return `
        border-color: #22c55e;
        background-color: #f0fdf4;
      `;
    }
    if (active) {
      return `
        border-color: #3b82f6;
        background-color: #eff6ff;
      `;
    }
    return `
      border-color: #e5e7eb;
      background-color: #f9fafb;
    `;
  }}
`;

const StepNumber = styled.div<{
  $active?: boolean;
  $completed?: boolean;
  $error?: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  font-weight: 600;
  font-size: 1rem;
  flex-shink: 0;

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

const TokenDisplay = styled.div`
  background-color: ${({ theme }) => theme.colors.gray50};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  font-family: monospace;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray700};
  word-break: break-all;
`;

const UserInfoFlow: React.FC = () => {
  const { tokens, config } = useAuth();
  const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [userInfo, setUserInfo] = useState<OIDCUserInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState('');
  const [requestDetails, setRequestDetails] = useState<{
    url: string;
    headers: Record<string, string>;
    method: string;
  } | null>(null);

  // Function to format JSON with color coding
  const formatJson = (obj: any, indent: number = 0): React.ReactNode[] => {
    const spaces = '  '.repeat(indent);
    const elements: React.ReactNode[] = [];
    
    if (obj === null) {
      elements.push(<JsonNull>null</JsonNull>);
      return elements;
    }
    
    if (typeof obj === 'string') {
      elements.push(<JsonString>"{obj}"</JsonString>);
      return elements;
    }
    
    if (typeof obj === 'number') {
      elements.push(<JsonNumber>{obj}</JsonNumber>);
      return elements;
    }
    
    if (typeof obj === 'boolean') {
      elements.push(<JsonBoolean>{obj.toString()}</JsonBoolean>);
      return elements;
    }
    
    if (Array.isArray(obj)) {
      elements.push('[\n');
      obj.forEach((item, index) => {
        elements.push(spaces + '  ');
        elements.push(...formatJson(item, indent + 1));
        if (index < obj.length - 1) elements.push(',');
        elements.push('\n');
      });
      elements.push(spaces + ']');
      return elements;
    }
    
    if (typeof obj === 'object') {
      elements.push('{\n');
      const keys = Object.keys(obj);
      keys.forEach((key, index) => {
        elements.push(spaces + '  ');
        elements.push(<JsonKey>"{key}"</JsonKey>);
        elements.push(': ');
        elements.push(...formatJson(obj[key], indent + 1));
        if (index < keys.length - 1) elements.push(',');
        elements.push('\n');
      });
      elements.push(spaces + '}');
      return elements;
    }
    
    return elements;
  };

  // Function to copy text to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const callUserInfoEndpoint = async () => {
    setDemoStatus('loading');
    setCurrentStep(0);
    setError(null);
    setUserInfo(null);
    setRequestDetails(null);

    try {
      setCurrentStep(1);
      if (!tokens?.access_token) {
        throw new Error('No access token available. Complete an OAuth flow with openid scope first.');
      }
      if (isTokenExpired(tokens.access_token)) {
        throw new Error('Access token is expired. Please sign in again.');
      }
      setAccessToken(tokens.access_token);

      setCurrentStep(2);
      // Build real UserInfo endpoint from config
      const userInfoUrl = config?.userInfoEndpoint?.replace('{envId}', config.environmentId);
      if (!userInfoUrl) {
        throw new Error('UserInfo endpoint is not configured. Check Configuration page.');
      }

      // Prepare request details for display
      const headers = {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };

      setRequestDetails({
        url: userInfoUrl,
        headers,
        method: 'GET'
      });

      setCurrentStep(3);
      // Real API call
      const info = await getUserInfo(userInfoUrl, tokens.access_token);
      setUserInfo(info);
      setCurrentStep(4);
      setDemoStatus('success');

    } catch (err: unknown) {
      console.error('UserInfo call failed:', err);
      const msg = err instanceof Error ? err.message : 'Failed to call UserInfo endpoint. Please check your configuration.';
      setError(msg);
      setDemoStatus('error');
    }
  };

  const resetDemo = () => {
    setDemoStatus('idle');
    setCurrentStep(0);
    setUserInfo(null);
    setError(null);
    setAccessToken('');
    setRequestDetails(null);
  };

  const maskedToken = accessToken ? `${accessToken.slice(0, 16)}...${accessToken.slice(-8)}` : '';

  const steps = [
    {
      title: 'Obtain Access Token',
      description: 'First, obtain an access token through any OAuth flow',
      code: `// Access token obtained from OAuth flow
const accessToken = '${maskedToken || 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...'}';

// This token contains:
// - User identity information
// - Granted scopes (including 'openid')
// - Expiration time
// - Token type (Bearer)`
    },
    {
      title: 'Prepare UserInfo Request',
      description: 'Prepare GET request to UserInfo endpoint with Bearer token',
      code: `// UserInfo endpoint URL (from OpenID Connect discovery)
const userInfoUrl = '${(config?.userInfoEndpoint || 'https://auth.pingone.com/{envId}/as/userinfo')}'.replace('{envId}', '${config?.environmentId || 'YOUR_ENV_ID'}');

// Prepare request headers
const headers = {
  'Authorization': 'Bearer ${maskedToken || 'your_access_token'}',
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

// Optional: Include DPoP proof for enhanced security
// headers['DPoP'] = generateDPoPProof(userInfoUrl, 'GET', accessToken);`
    },
    {
      title: 'Make UserInfo API Call',
      description: 'Send authenticated request to UserInfo endpoint',
      code: `// Make authenticated GET request
const response = await fetch(userInfoUrl, {
  method: 'GET',
  headers: headers,
  credentials: 'same-origin' // For CORS considerations
});

// Handle response
if (!response.ok) {
  if (response.status === 401) {
    // Token expired or invalid
    throw new Error('Access token expired or invalid');
  }
  if (response.status === 403) {
    // Insufficient scope
    throw new Error('Access token does not have openid scope');
  }
  throw new Error('UserInfo request failed');
}

const userInfo = await response.json();`
    },
    {
      title: 'Process UserInfo Response',
      description: 'Handle and validate the user information returned',
      code: `// Validate response structure
if (!userInfo.sub) {
  throw new Error('Invalid UserInfo response: missing subject');
}

// Standard OpenID Connect claims
const user = {
  id: userInfo.sub,                    // Subject identifier
  name: userInfo.name,                 // Full name
  givenName: userInfo.given_name,      // First name
  familyName: userInfo.family_name,    // Last name
  email: userInfo.email,               // Email address
  emailVerified: userInfo.email_verified, // Email verification status
  picture: userInfo.picture,           // Profile picture URL
  locale: userInfo.locale,             // User locale
  updatedAt: userInfo.updated_at       // Last update timestamp
};

// Store user information securely
// Avoid storing tokens; store minimal, non-sensitive user profile if needed
localStorage.setItem('user_profile', JSON.stringify({ id: user.id, name: user.name, email: user.email }));

// Use user information in your application
console.log('Welcome, ' + user.name + '!');`
    }
  ];

  return (
    <Container>
      <Header>
        <h1>
          <FiUser />
          OpenID Connect UserInfo
        </h1>
        <p>
          Learn how to use the OpenID Connect UserInfo endpoint to retrieve
          additional user information with real API calls to PingOne.
        </p>
      </Header>

      <FlowOverview>
        <CardHeader>
          <h2>UserInfo Endpoint Overview</h2>
        </CardHeader>
        <CardBody>
          <FlowDescription>
            <h2>What is the UserInfo Endpoint?</h2>
            <p>
              The UserInfo endpoint is a protected resource in OpenID Connect that allows
              clients to retrieve additional information about the authenticated user beyond
              what's included in the ID token. It's particularly useful when you need more
              detailed profile information or when the ID token is too large for browser-based flows.
            </p>
            <p>
              <strong>How it works:</strong> After obtaining an access token with the 'openid' scope,
              you can make an authenticated request to the UserInfo endpoint to get detailed user
              profile information including name, email, profile picture, and other claims.
            </p>
          </FlowDescription>

          <UseCaseHighlight>
            <FiInfo size={20} />
            <div>
              <h3>Perfect For</h3>
              <p>
                Getting detailed user profiles, email addresses, profile pictures,
                and other user attributes beyond the basic ID token claims.
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
              {demoStatus === 'loading' && 'Calling UserInfo endpoint...'}
              {demoStatus === 'success' && 'UserInfo retrieved successfully'}
              {demoStatus === 'error' && 'UserInfo call failed'}
            </StatusIndicator>
            <DemoButton
              variant="primary"
              onClick={callUserInfoEndpoint}
              disabled={
                demoStatus === 'loading' ||
                !config ||
                !tokens?.access_token ||
                isTokenExpired(tokens.access_token)
              }
            >
              <FiPlay />
              Call UserInfo Endpoint
            </DemoButton>
            <DemoButton
              variant="secondary"
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

          {config && (!tokens?.access_token || (tokens?.access_token && isTokenExpired(tokens.access_token))) && (
            <ErrorMessage>
              <FiAlertCircle />
              <strong>Sign-in Required:</strong> Complete an OAuth login with openid scope to obtain a valid access token before calling UserInfo.
            </ErrorMessage>
          )}

          {error && (
            <ErrorMessage>
              <FiAlertCircle />
              <strong>Error:</strong> {error}
            </ErrorMessage>
          )}

          {accessToken && (
            <div>
              <h3>Access Token:</h3>
              <TokenDisplay>
                <strong>Bearer Token (masked):</strong><br />
                {maskedToken}
              </TokenDisplay>
            </div>
          )}

          {/* Request/Response Section */}
          {(requestDetails || userInfo) && (
            <RequestResponseSection>
              {requestDetails && (
                <RequestSection>
                  <h3>
                    <FiSend />
                    Request Details
                  </h3>
                  <CodeBlock>
                    <CopyButton onClick={() => copyToClipboard(JSON.stringify(requestDetails, null, 2))}>
                      Copy
                    </CopyButton>
                    <strong>URL:</strong> {requestDetails.url}
                    <br />
                    <strong>Method:</strong> {requestDetails.method}
                    <br />
                    <strong>Headers:</strong>
                    <br />
                    {Object.entries(requestDetails.headers).map(([key, value]) => (
                      <div key={key} style={{ marginLeft: '1rem' }}>
                        {key}: {key === 'Authorization' ? 'Bearer [REDACTED]' : value}
                      </div>
                    ))}
                  </CodeBlock>
                </RequestSection>
              )}

              {userInfo && (
                <ResponseSection>
                  <h3>
                    <FiDownload />
                    Response Data
                  </h3>
                  <JsonResponse>
                    {formatJson(userInfo)}
                  </JsonResponse>
                  
                  <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#6b7280' }}>
                    <strong>Standard Claims:</strong><br />
                    • <strong>sub:</strong> Subject identifier ({userInfo?.sub || '—'})<br />
                    • <strong>name:</strong> Full name ({userInfo?.name || '—'})<br />
                    • <strong>email:</strong> Email address ({userInfo?.email || '—'})<br />
                    • <strong>email_verified:</strong> Email verification status ({userInfo?.email_verified ? 'Verified' : 'Unverified'})<br />
                    • <strong>updated_at:</strong> Last update ({userInfo?.updated_at ? new Date((userInfo.updated_at as number) * 1000).toLocaleString() : '—'})
                  </div>
                </ResponseSection>
              )}
            </RequestResponseSection>
          )}

          <StepsContainer>
            <h3>UserInfo Flow Steps</h3>
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
                  <CodeBlock>
                    <CopyButton onClick={() => copyToClipboard(step.code)}>
                      Copy
                    </CopyButton>
                    {step.code}
                  </CodeBlock>
                </StepContent>
              </Step>
            ))}
          </StepsContainer>
        </CardBody>
      </DemoSection>
    </Container>
  );
};

export default UserInfoFlow;
