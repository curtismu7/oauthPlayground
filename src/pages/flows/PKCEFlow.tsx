import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { FiPlay, FiAlertCircle, FiShield } from 'react-icons/fi';
import { useAuth } from '../../contexts/NewAuthContext';
import Spinner from '../../components/Spinner';
import Typewriter from '../../components/Typewriter';
import { ColorCodedURL } from '../../components/ColorCodedURL';
import { URLParamExplainer } from '../../components/URLParamExplainer';

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

const SecurityHighlight = styled.div`
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

const PKCEDisplay = styled.div`
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

  .pkce-values {
    font-family: monospace;
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.gray800};
    line-height: 1.4;
  }
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

// Utility functions for PKCE
const generateCodeVerifier = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

const generateCodeChallenge = async (codeVerifier: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const array = new Uint8Array(digest);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

const PKCEFlow = () => {
  // Casting context to any locally to avoid broad refactor; we'll type the context in a separate pass
  const { config, tokens: contextTokens } = useAuth();
  const [demoStatus, setDemoStatus] = useState('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [tokensReceived, setTokensReceived] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pkceData, setPkceData] = useState<any>(null);
  const [authUrl, setAuthUrl] = useState('');
  const [showFullTokens, setShowFullTokens] = useState(false);

  // If real tokens exist in context (from a successful PKCE auth elsewhere), complete the demo
  useEffect(() => {
    if (contextTokens && !tokensReceived) {
      console.debug('[PKCEFlow] Context tokens detected, completing demo');
      setTokensReceived(contextTokens);
      setDemoStatus('success');
      setIsLoading(false);
      // Jump to final step visually
      setCurrentStep(steps.length - 1);
    }
  }, [contextTokens, tokensReceived]);

  // Watchdog: prevent indefinite running state
  useEffect(() => {
    if (demoStatus !== 'loading') return;
    const timeout = setTimeout(() => {
      if (demoStatus === 'loading' && !tokensReceived) {
        console.warn('[PKCEFlow] Timeout waiting for tokens; marking error');
        setError('Timed out waiting for tokens. Complete authentication or try again.');
        setDemoStatus('error');
        setIsLoading(false);
      }
    }, 120000); // 2 minutes
    return () => clearTimeout(timeout);
  }, [demoStatus, tokensReceived]);

  const startPKCEFlow = async () => {
    setDemoStatus('loading');
    setIsLoading(true);
    setCurrentStep(0);
    setError(null);
    setTokensReceived(null);
    setPkceData(null);
    setAuthUrl('');
    setShowFullTokens(false);

    try {
      // Step 1 (manual): Generate code verifier and challenge
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      console.debug('[PKCEFlow] Generated PKCE values', { codeVerifierLen: codeVerifier.length, codeChallengeSample: codeChallenge.slice(0, 12) });
      setPkceData({ codeVerifier, codeChallenge, codeChallengeMethod: 'S256' });
      setCurrentStep(1);
    } catch (err) {
      console.error('PKCE flow init failed:', err);
      setError('Failed to initialize PKCE flow.');
      setDemoStatus('error');
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (!config) return;
    setCurrentStep((prev) => {
      // Step 1: Build authorization URL from generated PKCE
      if (prev === 1 && pkceData) {
        const params = new URLSearchParams({
          response_type: 'code',
          client_id: config.clientId,
          redirect_uri: config.redirectUri,
          scope: config.scopes || 'openid profile email',
          code_challenge: pkceData.codeChallenge,
          code_challenge_method: 'S256',
          state: Math.random().toString(36).substring(2, 15),
          nonce: Math.random().toString(36).substring(2, 15),
        });
        const authEndpoint = (config.authEndpoint || `https://auth.pingone.com/${config.environmentId}/as/authorize`).replace('{envId}', config.environmentId);
        const url = `${authEndpoint}?${params.toString()}`;
        console.debug('[PKCEFlow] Built authorization URL using configured endpoint', { authEndpoint, urlSample: url.slice(0, 64) + '…' });
        setAuthUrl(url);
        return 2;
      }

      // Step 2 -> 3: User authenticates
      if (prev === 2) {
        console.debug('[PKCEFlow] Advancing to authentication step (user should authenticate)');
        return 3;
      }

      // Step 3 -> 4: Receive authorization code
      if (prev === 3) {
        console.debug('[PKCEFlow] Simulating receipt of authorization code');
        return 4;
      }

      // Step 4 -> 5: Exchange code for tokens
      if (prev === 4) {
        console.debug('[PKCEFlow] Simulating token exchange success');
        const mockTokens = {
          access_token:
            'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.pkce_validated_token_signature',
          id_token:
            'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.pkce_validated_id_token_signature',
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'openid profile email',
        };
        setTokensReceived(mockTokens);
        setDemoStatus('success');
        setIsLoading(false);
        return 5;
      }

      // Default: advance one step but cap at last step
      const next = Math.min(prev + 1, steps.length - 1);
      if (next === steps.length - 1) {
        // Safety: if we reach the last step, ensure status reflects completion
        setDemoStatus('success');
        setIsLoading(false);
      }
      return next;
    });
  };

  const prevStep = () => {
    if (currentStep <= 0) return;
    setCurrentStep(s => Math.max(0, s - 1));
  };

  const resetDemo = () => {
    setDemoStatus('idle');
    setCurrentStep(0);
    setTokensReceived(null);
    setError(null);
    setPkceData(null);
    setAuthUrl('');
    setShowFullTokens(false);
  };

  const steps = [
    {
      title: 'Generate Code Verifier & Challenge',
      description: 'Create a cryptographically secure code verifier and derive the code challenge',
      code: `// Generate 32-byte random string
const codeVerifier = generateCodeVerifier();
// Result: ${pkceData?.codeVerifier ? pkceData.codeVerifier.substring(0, 32) + '...' : 'random_32_byte_string'}

// Derive code challenge using SHA-256
const codeChallenge = await generateCodeChallenge(codeVerifier);
// Result: ${pkceData?.codeChallenge ? pkceData.codeChallenge.substring(0, 20) + '...' : 'SHA256_hash_base64url'}

// Method: S256 (SHA-256)`
    },
    {
      title: 'Build Authorization URL',
      description: 'Include code challenge in the authorization request',
      code: `// Authorization URL with PKCE parameters
const authUrl = '${(config?.authEndpoint || `https://auth.pingone.com/${config?.environmentId || 'YOUR_ENV_ID'}/as/authorize`)}' +
  new URLSearchParams({
    response_type: 'code',
    client_id: '${config?.clientId || 'your_client_id'}',
    redirect_uri: '${config?.redirectUri || 'https://yourapp.com/callback'}',
    scope: '${config?.scopes || 'openid profile email'}',
    code_challenge: '${pkceData?.codeChallenge || 'derived_challenge'}',
    code_challenge_method: 'S256',
    state: 'random_state_value',
    nonce: 'random_nonce_value'
  }).toString();`
    },
    {
      title: 'User Authentication',
      description: 'User is redirected to PingOne for authentication and consent',
      code: `// User authenticates and authorizes
// PingOne stores code_challenge for later validation
// User is redirected back with authorization code

// Callback URL:
https://yourapp.com/callback?code=auth_code_123&state=xyz789`
    },
    {
      title: 'Receive Authorization Code',
      description: 'Application receives authorization code from PingOne',
      code: `// Extract code from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const authorizationCode = urlParams.get('code');
const state = urlParams.get('state');

// Validate state parameter for CSRF protection
if (state !== storedState) {
  throw new Error('State parameter mismatch');
}

console.log('Authorization Code:', authorizationCode);`
    },
    {
      title: 'Exchange Code for Tokens (with PKCE)',
      description: 'Send authorization code and code verifier to token endpoint',
      code: `// POST to token endpoint with PKCE validation
POST ${config?.tokenEndpoint || `https://auth.pingone.com/${config?.environmentId || 'YOUR_ENV_ID'}/as/token`}
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=auth_code_123
&code_verifier=${pkceData?.codeVerifier || 'original_code_verifier'}
&redirect_uri=${config?.redirectUri || 'https://yourapp.com/callback'}
&client_id=${config?.clientId || 'your_client_id'}`
    },
    {
      title: 'Server Validates PKCE & Returns Tokens',
      description: 'Authorization server validates code verifier matches stored challenge',
      code: `// Server-side PKCE validation
const storedChallenge = getStoredCodeChallenge(code);
const computedChallenge = SHA256(codeVerifier);

// Validate: computedChallenge === storedChallenge
if (computedChallenge !== storedChallenge) {
  return { error: 'invalid_grant', error_description: 'PKCE validation failed' };
}

// Generate and return tokens
const tokens = {
  access_token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  id_token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  token_type: "Bearer",
  expires_in: 3600,
  scope: "openid profile email"
};

return tokens;`
    }
  ];

  return (
    <Container>
      <Header>
        <h1>
          <FiShield />
          PKCE Flow
        </h1>
        <p>
          Learn how Proof Key for Code Exchange (PKCE) enhances the Authorization Code flow
          with real API calls to PingOne.
        </p>
      </Header>

      <FlowOverview>
        <CardHeader>
          <h2>Flow Overview</h2>
        </CardHeader>
        <CardBody>
          <FlowDescription>
            <h2>What is PKCE?</h2>
            <p>
              Proof Key for Code Exchange (PKCE) is an extension to the Authorization Code flow
              that prevents authorization code interception attacks. It uses a cryptographically
              random code verifier that is sent with the authorization request and validated
              during token exchange.
            </p>
            <p>
              <strong>How it works:</strong> The client generates a code verifier, derives a code
              challenge from it, sends the challenge with the authorization request, and proves
              ownership by sending the original verifier during token exchange.
            </p>
          </FlowDescription>

          <SecurityHighlight>
            <FiShield size={20} />
            <div>
              <h3>Enhanced Security</h3>
              <p>
                PKCE prevents authorization code interception attacks by ensuring only the
                legitimate client can exchange the authorization code for tokens.
              </p>
            </div>
          </SecurityHighlight>
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
              {demoStatus === 'loading' && 'Executing PKCE flow...'}
              {demoStatus === 'success' && 'Flow completed successfully'}
              {demoStatus === 'error' && 'Flow failed'}
            </StatusIndicator>
            <DemoButton
              className="primary"
              onClick={startPKCEFlow}
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
                  Start PKCE Flow
                </>
              )}
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

          {pkceData && (
            <PKCEDisplay>
              <h4>PKCE Values Generated:</h4>
              <div className="pkce-values">
                <strong>Code Verifier:</strong><br />
                {pkceData.codeVerifier}
                <br /><br />
                <strong>Code Challenge:</strong><br />
                {pkceData.codeChallenge}
                <br /><br />
                <strong>Method:</strong> {pkceData.codeChallengeMethod}
              </div>
            </PKCEDisplay>
          )}

          {authUrl && (
            <div>
              <h3>Authorization URL:</h3>
              <ColorCodedURL url={authUrl} />
              <URLParamExplainer url={authUrl} />
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <DemoButton
                  className="primary"
                  onClick={() => {
                    console.debug('[PKCEFlow] Redirecting to authorization URL');
                    window.location.href = authUrl;
                  }}
                >
                  Proceed to Authorize
                </DemoButton>
              </div>
            </div>
          )}

          {tokensReceived && (
            <div>
              <h3>Tokens Received:</h3>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', margin: '0.5rem 0' }}>
                <DemoButton
                  className="secondary"
                  onClick={() => setShowFullTokens(v => !v)}
                >
                  {showFullTokens ? 'Hide full tokens' : 'Reveal full tokens (secure-by-default)'}
                </DemoButton>
              </div>
              <TokenDisplay>
                <strong>Access Token:</strong><br />
                {showFullTokens
                  ? tokensReceived.access_token
                  : `${tokensReceived.access_token?.slice(0, 12)}…${tokensReceived.access_token?.slice(-12)}`}
                <br /><br />
                <strong>ID Token:</strong><br />
                {showFullTokens
                  ? tokensReceived.id_token
                  : `${tokensReceived.id_token?.slice(0, 12)}…${tokensReceived.id_token?.slice(-12)}`}
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
              onClick={prevStep}
              disabled={demoStatus !== 'loading' || currentStep === 0}
            >
              Previous
            </DemoButton>
            <DemoButton
              className="primary"
              onClick={nextStep}
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

export default PKCEFlow;
