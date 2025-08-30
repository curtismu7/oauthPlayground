import { useState } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { FiPlay, FiAlertCircle, FiLock } from 'react-icons/fi';
import { useOAuth } from '../../contexts/OAuthContext';
import { ColorCodedURL } from '../../components/ColorCodedURL';
import { URLParamExplainer } from '../../components/URLParamExplainer';
import Typewriter from '../../components/Typewriter';

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

const SecurityWarning = styled.div`
  background-color: ${({ theme }) => theme.colors.warning}10;
  border: 1px solid ${({ theme }) => theme.colors.warning}30;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  svg {
    color: ${({ theme }) => theme.colors.warning};
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  h3 {
    color: ${({ theme }) => theme.colors.warning};
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.warning};
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

// (Removed unused CodeBlock styled component)

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

const ImplicitGrantFlow = () => {
  const { config } = useOAuth() as any;
  const [demoStatus, setDemoStatus] = useState('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [authUrl, setAuthUrl] = useState('');
  const [tokensReceived, setTokensReceived] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  

  // Generate authorization URL
  const generateAuthUrl = () => {
    if (!config) return '';

    const params = new URLSearchParams({
      response_type: 'token id_token',
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: 'openid profile email',
      state: Math.random().toString(36).substring(2, 15),
      nonce: Math.random().toString(36).substring(2, 15)
    });

    return `${config.apiUrl}/authorize?${params.toString()}`;
  };

  const startImplicitFlow = async () => {
    setDemoStatus('loading');
    setCurrentStep(0);
    setError(null);
    setTokensReceived(null);

    try {
      const url = generateAuthUrl();
      setAuthUrl(url);
      setCurrentStep(1);

      // Simulate user clicking the link and being redirected back with tokens
      // In a real implementation, this would redirect to PingOne
      setTimeout(() => {
        setCurrentStep(2);

        // Simulate receiving tokens from the redirect
        const mockTokens = {
          access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
          id_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'openid profile email'
        };

        setTokensReceived(mockTokens);
        setCurrentStep(3);
        setDemoStatus('success');
      }, 3000);

    } catch (err) {
      console.error('Implicit flow failed:', err);
      setError('Failed to start implicit flow. Please check your configuration.');
      setDemoStatus('error');
    }
  };

  const resetDemo = () => {
    setDemoStatus('idle');
    setCurrentStep(0);
    setTokensReceived(null);
    setError(null);
    setAuthUrl('');
  };

  const steps = [
    {
      title: 'Generate Authorization URL',
      description: 'Create the authorization URL with the implicit grant parameters',
      code: `// Authorization URL for Implicit Grant
const authUrl = '${generateAuthUrl()}';

// Parameters:
response_type: 'token id_token'
client_id: '${config?.clientId || 'your_client_id'}'
redirect_uri: '${config?.redirectUri || 'https://yourapp.com/callback'}'
scope: 'openid profile email'
state: 'random_state_value'
nonce: 'random_nonce_value'`
    },
    {
      title: 'Redirect User to Authorization Server',
      description: 'User is redirected to PingOne to authenticate and consent',
      code: `// User clicks login link or is redirected
window.location.href = authUrl;

// PingOne handles:
// - User authentication
// - Consent for requested scopes
// - Redirect back with tokens in URL fragment`
    },
    {
      title: 'Handle Redirect with Tokens',
      description: 'PingOne redirects back with access token and ID token in URL fragment',
      code: `// Callback URL with tokens in fragment
https://yourapp.com/callback#access_token=eyJ...

// JavaScript extracts tokens from URL fragment
const hash = window.location.hash.substring(1);
const params = new URLSearchParams(hash);

const accessToken = params.get('access_token');
const idToken = params.get('id_token');
const tokenType = params.get('token_type');
const expiresIn = params.get('expires_in');

// Store tokens securely
localStorage.setItem('access_token', accessToken);
localStorage.setItem('id_token', idToken);`
    },
    {
      title: 'Use Tokens for API Calls',
      description: 'Use the access token to authenticate API requests',
      code: `// Make authenticated API calls
const headers = {
  'Authorization': 'Bearer ' + accessToken,
  'Content-Type': 'application/json'
};

fetch('/api/user/profile', { headers })
  .then(response => response.json())
  .then(data => console.log('User profile:', data));

// Validate ID token if needed
const decodedIdToken = parseJwt(idToken);
console.log('User ID:', decodedIdToken.sub);`
    }
  ];

  return (
    <Container>
      <Header>
        <h1>
          <FiLock />
          Implicit Grant Flow
        </h1>
        <p>
          Learn how the Implicit Grant flow works with real API calls to PingOne.
          This flow is suitable for client-side applications but has security limitations.
        </p>
      </Header>

      <FlowOverview>
        <CardHeader>
          <h2>Flow Overview</h2>
        </CardHeader>
        <CardBody>
          <FlowDescription>
            <h2>What is Implicit Grant?</h2>
            <p>
              The Implicit Grant flow is a simplified OAuth 2.0 flow designed for public clients
              (typically browser-based applications) that cannot securely store client secrets.
              Access tokens are returned immediately without an extra authorization code exchange step.
            </p>
            <p>
              <strong>How it works:</strong> The client redirects the user to the authorization server,
              which authenticates the user and immediately returns access tokens in the redirect URL fragment.
            </p>
          </FlowDescription>

          <SecurityWarning>
            <FiAlertCircle size={20} />
            <div>
              <h3>Security Warning</h3>
              <p>
                The Implicit Grant flow has security limitations and is generally not recommended
                for new applications. Consider using the Authorization Code flow with PKCE instead.
              </p>
            </div>
          </SecurityWarning>
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
              {demoStatus === 'loading' && 'Running implicit flow...'}
              {demoStatus === 'success' && 'Flow completed successfully'}
              {demoStatus === 'error' && 'Flow failed'}
            </StatusIndicator>
            <DemoButton
              className="primary"
              onClick={startImplicitFlow}
              disabled={demoStatus === 'loading' || !config}
            >
              <FiPlay />
              Start Implicit Flow
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

          {error && (
            <ErrorMessage>
              <FiAlertCircle />
              <strong>Error:</strong> {error}
            </ErrorMessage>
          )}

          {authUrl && (
            <div>
              <h3>Authorization URL Generated:</h3>
              <ColorCodedURL url={authUrl} />
              <URLParamExplainer url={authUrl} />
            </div>
          )}

          {tokensReceived && (
            <div>
              <h3>Tokens Received:</h3>
              <TokenDisplay>
                <strong>Access Token:</strong><br />
                {tokensReceived.access_token}
                <br /><br />
                <strong>ID Token:</strong><br />
                {tokensReceived.id_token}
                <br /><br />
                <strong>Token Type:</strong> {tokensReceived.token_type}<br />
                <strong>Expires In:</strong> {tokensReceived.expires_in} seconds<br />
                <strong>Scope:</strong> {tokensReceived.scope}
              </TokenDisplay>
            </div>
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
                  <Typewriter text={step.code} speed={8} />
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

export default ImplicitGrantFlow;
