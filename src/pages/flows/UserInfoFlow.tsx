import React, { useState } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { FiPlay, FiAlertCircle, FiUser, FiInfo } from 'react-icons/fi';
import { useOAuth } from '../../contexts/OAuthContext';
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

const Step = styled.div<{
  active?: boolean;
  completed?: boolean;
  error?: boolean;
}>`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  border-radius: 0.5rem;
  background-color: ${({ active, completed, error }) => {
    if (error) return 'rgba(239, 68, 68, 0.1)';
    if (completed) return 'rgba(34, 197, 94, 0.1)';
    if (active) return 'rgba(59, 130, 246, 0.1)';
    return 'transparent';
  }};
  border: 2px solid ${({ active, completed, error }) => {
    if (error) return '#ef4444';
    if (completed) return '#22c55e';
    if (active) return '#3b82f6';
    return 'transparent';
  }};
`;

const StepNumber = styled.div<{
  active?: boolean;
  completed?: boolean;
  error?: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  font-weight: 600;
  font-size: 1rem;
  flex-shrink: 0;

  ${({ active, completed, error }) => {
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

const UserInfoDisplay = styled.div`
  background-color: ${({ theme }) => theme.colors.info}10;
  border: 1px solid ${({ theme }) => theme.colors.info}30;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;

  h4 {
    margin: 0 0 0.5rem 0;
    color: ${({ theme }) => theme.colors.info};
    font-size: 1rem;
    font-weight: 600;
  }

  .userinfo-json {
    background-color: white;
    border: 1px solid ${({ theme }) => theme.colors.gray200};
    border-radius: 0.25rem;
    padding: 1rem;
    font-family: monospace;
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.gray800};
    overflow-x: auto;
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

const UserInfoFlow = () => {
  const { config, tokens } = useOAuth();
  const [demoStatus, setDemoStatus] = useState('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [userInfo, setUserInfo] = useState<OIDCUserInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState('');

  const callUserInfoEndpoint = async () => {
    setDemoStatus('loading');
    setCurrentStep(0);
    setError(null);
    setUserInfo(null);

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
              className="primary"
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

          {userInfo && (
            <UserInfoDisplay>
              <h4>User Information Retrieved:</h4>
              <div className="userinfo-json">
                {JSON.stringify(userInfo, null, 2)}
              </div>

              <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#6b7280' }}>
                <strong>Standard Claims:</strong><br />
                • <strong>sub:</strong> Subject identifier ({userInfo?.sub || '—'})<br />
                • <strong>name:</strong> Full name ({userInfo?.name || '—'})<br />
                • <strong>email:</strong> Email address ({userInfo?.email || '—'})<br />
                • <strong>email_verified:</strong> Email verification status ({userInfo?.email_verified ? 'Verified' : 'Unverified'})<br />
                • <strong>updated_at:</strong> Last update ({userInfo?.updated_at ? new Date((userInfo.updated_at as number) * 1000).toLocaleString() : '—'})
              </div>
            </UserInfoDisplay>
          )}

          <StepsContainer>
            <h3>UserInfo Flow Steps</h3>
            {steps.map((step, index) => (
              <Step
                key={index}
                active={currentStep === index && demoStatus === 'loading'}
                completed={currentStep > index}
                error={currentStep === index && demoStatus === 'error'}
              >
                <StepNumber
                  active={currentStep === index && demoStatus === 'loading'}
                  completed={currentStep > index}
                  error={currentStep === index && demoStatus === 'error'}
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
        </CardBody>
      </DemoSection>
    </Container>
  );
};

export default UserInfoFlow;
