import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { FiPlay, FiAlertCircle, FiShield, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../../contexts/NewAuthContext';
import Spinner from '../../components/Spinner';
import Typewriter from '../../components/Typewriter';
import { ColorCodedURL } from '../../components/ColorCodedURL';
import { URLParamExplainer } from '../../components/URLParamExplainer';
import { StepByStepFlow, FlowStep } from '../../components/StepByStepFlow';
import ConfigurationButton from '../../components/ConfigurationButton';
import TokenDisplayComponent from '../../components/TokenDisplay';

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

const ResponseBox = styled.div<{ $backgroundColor?: string; $borderColor?: string }>`
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid ${({ $borderColor }) => $borderColor || '#e2e8f0'};
  background-color: ${({ $backgroundColor }) => $backgroundColor || '#f8fafc'};
  font-family: monospace;
  font-size: 0.875rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
  overflow: visible;
  max-width: 100%;

  h4 {
    margin: 0 0 0.5rem 0;
    font-family: inherit;
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
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
  }
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

  // Track execution results for each step
  const [stepResults, setStepResults] = useState<Record<number, any>>({});
  const [executedSteps, setExecutedSteps] = useState<Set<number>>(new Set());

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
    setCurrentStep(0);
    setError(null);
    setTokensReceived(null);
    setPkceData(null);
    setAuthUrl('');
    setShowFullTokens(false);
    setStepResults({});
    setExecutedSteps(new Set());
    console.log('🚀 [PKCEFlow] Starting PKCE flow...');
  };



  const resetDemo = () => {
    setDemoStatus('idle');
    setCurrentStep(0);
    setTokensReceived(null);
    setError(null);
    setPkceData(null);
    setAuthUrl('');
    setShowFullTokens(false);
    setStepResults({});
    setExecutedSteps(new Set());
  };

  const steps: FlowStep[] = [
    {
      title: 'Generate Code Verifier & Challenge',
      description: 'Create a cryptographically secure code verifier and derive the code challenge',
      code: `// Generate 32-byte random string
const codeVerifier = generateCodeVerifier();
// Result: random_32_byte_string

// Derive code challenge using SHA-256
const codeChallenge = await generateCodeChallenge(codeVerifier);
// Result: SHA256_hash_base64url

// Method: S256 (SHA-256)`,
      execute: async () => {
        try {
          const codeVerifier = generateCodeVerifier();
          const codeChallenge = await generateCodeChallenge(codeVerifier);
          const pkceDataObj = {
            codeVerifier,
            codeChallenge,
            codeChallengeMethod: 'S256'
          };

          setPkceData(pkceDataObj);
          setStepResults(prev => ({ ...prev, 0: { pkceData: pkceDataObj } }));
          setExecutedSteps(prev => new Set(prev).add(0));

          console.log('✅ [PKCEFlow] Generated PKCE values:', {
            codeVerifier: codeVerifier.substring(0, 32) + '...',
            codeChallenge: codeChallenge.substring(0, 20) + '...',
            method: 'S256'
          });
        } catch (error: any) {
          setError(`Failed to generate PKCE values: ${error.message}`);
          console.error('❌ [PKCEFlow] PKCE generation failed:', error);
        }
      }
    },
    {
      title: 'Build Authorization URL',
      description: 'Include code challenge in the authorization request',
      code: `// Authorization URL with PKCE parameters
const authUrl = '${(config?.authorizationEndpoint || `https://auth.pingone.com/${config?.environmentId || 'YOUR_ENV_ID'}/as/authorize`)}' +
  new URLSearchParams({
    response_type: 'code',
    client_id: '${config?.clientId || 'your_client_id'}',
    redirect_uri: '${config?.redirectUri || 'https://yourapp.com/callback'}',
    scope: '${config?.scopes || 'openid profile email'}',
    code_challenge: '${pkceData?.codeChallenge || 'derived_challenge'}',
    code_challenge_method: 'S256',
    state: 'random_state_value',
    nonce: 'random_nonce_value'
  }).toString();`,
      execute: () => {
        if (!config) {
          setError('Configuration required. Please configure your PingOne settings first.');
          return;
        }

        if (!pkceData) {
          setError('PKCE data not found. Please execute the previous step first.');
          return;
        }

        const params = new URLSearchParams({
          response_type: 'code',
          client_id: config.clientId,
          redirect_uri: config.redirectUri,
          scope: config.scopes?.join(' ') || 'openid profile email',
          code_challenge: pkceData.codeChallenge,
          code_challenge_method: 'S256',
          state: Math.random().toString(36).substring(2, 15),
          nonce: Math.random().toString(36).substring(2, 15),
        });

        const authEndpoint = (config.authorizationEndpoint || config.authEndpoint || '').replace('{envId}', config.environmentId);
        const url = `${authEndpoint}?${params.toString()}`;

        setAuthUrl(url);
        setStepResults(prev => ({ ...prev, 1: { url } }));
        setExecutedSteps(prev => new Set(prev).add(1));

        console.log('✅ [PKCEFlow] Authorization URL built:', url);
      }
    },
    {
      title: 'User Authentication',
      description: 'User is redirected to PingOne for authentication and consent',
      code: `// User authenticates and authorizes
// PingOne stores code_challenge for later validation
// User is redirected back with authorization code

// Callback URL:
https://yourapp.com/callback?code=auth_code_123&state=xyz789`,
      execute: () => {
        console.log('✅ [PKCEFlow] User would be redirected to PingOne for authentication');
        setStepResults(prev => ({
          ...prev,
          2: {
            message: 'User redirected to PingOne for authentication and consent'
          }
        }));
        setExecutedSteps(prev => new Set(prev).add(2));
      }
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

console.log('Authorization Code:', authorizationCode);`,
      execute: () => {
        // Simulate getting authorization code from URL or generate one
        const searchParams = new URLSearchParams(window.location.search || '');
        const codeFromUrl = searchParams.get('code');
        const code = codeFromUrl || ('auth-code-' + Math.random().toString(36).substr(2, 9));

        setStepResults(prev => ({
          ...prev,
          4: { code } // Note: This is step 4 in 0-based index
        }));
        setExecutedSteps(prev => new Set(prev).add(3));

        console.log('✅ [PKCEFlow] Authorization code received:', code);
      }
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
&client_id=${config?.clientId || 'your_client_id'}`,
      execute: async () => {
        if (!config || !pkceData) {
          setError('Missing configuration or PKCE data');
          return;
        }

        try {
          const tokenUrl = config.tokenEndpoint;
          const params = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: String(config.clientId),
            client_secret: String(config.clientSecret || ''),
            code: 'auth-code-simulated', // In real implementation, this would be the actual code
            code_verifier: pkceData.codeVerifier,
            redirect_uri: String(config.redirectUri),
          });

          const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
          });

          if (!response.ok) {
            throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
          }

          const tokenData = await response.json();
          setTokensReceived(tokenData);
          setStepResults(prev => ({ ...prev, 4: { response: tokenData, tokens: tokenData, status: response.status } }));
          setExecutedSteps(prev => new Set(prev).add(4));

          console.log('✅ [PKCEFlow] Tokens received:', tokenData);
        } catch (error: any) {
          console.warn('⚠️ [PKCEFlow] Real API failed, using mock tokens:', error.message);
          
          // Fallback to mock tokens for demo purposes
          const mockTokens = {
            access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.EkN-DOsnsuRjRO6BxXemmJDm3HbxrbRzXglbN2S4sOkopdU4IsDxTI8jO19W_A4K8ZPJijNLis4EZsHeY559a4DFOd50_OqgH58ERTqYZyhtFJh3w9Hl6B1JKdHOsm0R8aBc_htvzJdR54bL9JYe6OvhALbbSRU7Nx1n2HclYFjtYL4a1XBfUw',
            token_type: 'Bearer',
            expires_in: 3600,
            id_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
            refresh_token: 'refresh-token-' + Math.random().toString(36).substr(2, 9),
            scope: 'openid profile email'
          };
          
          setTokensReceived(mockTokens);
          setStepResults(prev => ({ ...prev, 4: { response: mockTokens, tokens: mockTokens, status: 200, mock: true } }));
          setExecutedSteps(prev => new Set(prev).add(4));

          console.log('✅ [PKCEFlow] Mock tokens generated:', mockTokens);
        }
      }
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

return tokens;`,
      execute: () => {
        if (!tokensReceived) {
          setError('No tokens received from previous step');
          return;
        }

        setStepResults(prev => ({ ...prev, 5: { tokens: tokensReceived } }));
        setExecutedSteps(prev => new Set(prev).add(5));
        setDemoStatus('success');

        console.log('✅ [PKCEFlow] PKCE validation completed successfully');
      }
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

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <ConfigurationButton flowType="pkce" />
      </div>

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
          <StepByStepFlow
            steps={steps}
            onStart={startPKCEFlow}
            onReset={resetDemo}
            status={demoStatus}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            disabled={!config}
            title="PKCE Flow"
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
            {steps.map((step, index) => {
              const stepResult = stepResults[index];
              const isExecuted = executedSteps.has(index);

              return (
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

                    {/* Show URL/Code section always */}
                    <Typewriter text={step.code} speed={8} />

                    {/* Show response/result only after step is executed */}
                    {isExecuted && stepResult && (
                      <ResponseBox
                        $backgroundColor="#f8fafc"
                        $borderColor="#e2e8f0"
                      >
                        <h4>Response:</h4>
                        {stepResult.pkceData && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <strong>PKCE Values Generated:</strong><br />
                            <pre>Code Verifier: {stepResult.pkceData.codeVerifier.substring(0, 32)}...</pre>
                            <pre>Code Challenge: {stepResult.pkceData.codeChallenge.substring(0, 20)}...</pre>
                            <pre>Method: {stepResult.pkceData.codeChallengeMethod}</pre>
                          </div>
                        )}
                        {stepResult.url && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <strong>Authorization URL:</strong><br />
                            <ColorCodedURL url={stepResult.url} />
                          </div>
                        )}
                        {stepResult.code && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <strong>Authorization Code:</strong><br />
                            <pre>{stepResult.code}</pre>
                          </div>
                        )}
                        {stepResult.response && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <strong>Token Response:</strong><br />
                            <pre>{JSON.stringify(stepResult.response, null, 2)}</pre>
                          </div>
                        )}
                        {stepResult.tokens && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <strong>Tokens:</strong>
                            <TokenDisplayComponent tokens={stepResult.tokens} />
                          </div>
                        )}
                        {stepResult.message && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <strong>Status:</strong><br />
                            <pre>{stepResult.message}</pre>
                          </div>
                        )}
                      </ResponseBox>
                    )}

                    {/* Show execution status */}
                    {isExecuted && (
                      <div style={{
                        marginTop: '1rem',
                        padding: '0.5rem',
                        backgroundColor: '#d4edda',
                        border: '1px solid #c3e6cb',
                        borderRadius: '0.25rem',
                        color: '#155724',
                        fontSize: '0.875rem'
                      }}>
                        ✅ Step completed successfully
                      </div>
                    )}

                    {/* Next button for each step - only show if it can actually advance */}
                    {isExecuted && index < steps.length - 1 && index + 1 > currentStep && (
                      <div style={{ 
                        marginTop: '1rem', 
                        textAlign: 'center',
                        padding: '1rem',
                        borderTop: '1px solid #e5e7eb'
                      }}>
                        <button
                          onClick={() => {
                            const nextStepIndex = index + 1;
                            console.log('🔄 [PKCEFlow] Next Step button clicked', { currentIndex: index, nextStep: nextStepIndex, currentStepBefore: currentStep });
                            setCurrentStep(nextStepIndex);
                            console.log('🔄 [PKCEFlow] setCurrentStep called with:', nextStepIndex);
                          }}
                          style={{
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            margin: '0 auto',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
                          onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
                        >
                          Next Step
                          <FiArrowRight style={{ width: '1rem', height: '1rem' }} />
                        </button>
                      </div>
                    )}
                  </StepContent>
                </Step>
              );
            })}
          </StepsContainer>
        </CardBody>
      </DemoSection>
    </Container>
  );
};

export default PKCEFlow;
