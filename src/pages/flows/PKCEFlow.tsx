import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { FiPlay, FiAlertCircle, FiShield } from 'react-icons/fi';
import { useAuth } from '../../contexts/NewAuthContext';
import { config } from '../../services/config';
import Spinner from '../../components/Spinner';
import Typewriter from '../../components/Typewriter';
import { ColorCodedURL } from '../../components/ColorCodedURL';
import { URLParamExplainer } from '../../components/URLParamExplainer';
import { StepByStepFlow, FlowStep } from '../../components/StepByStepFlow';
import ConfigurationButton from '../../components/ConfigurationButton';
import TokenDisplayComponent from '../../components/TokenDisplay';
import { storeOAuthTokens } from '../../utils/tokenStorage';
import PageTitle from '../../components/PageTitle';
import FlowCredentials from '../../components/FlowCredentials';

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



// (Removed unused CodeBlock styled component)

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
  const { config, tokens: contextTokens } = useAuth();
  const [demoStatus, setDemoStatus] = useState('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [tokensReceived, setTokensReceived] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pkceData, setPkceData] = useState<Record<string, unknown> | null>(null);
  const [authUrl, setAuthUrl] = useState('');
  const [showFullTokens, setShowFullTokens] = useState(false);

  // Track execution results for each step
  const [stepResults, setStepResults] = useState<Record<number, unknown>>({});
  const [executedSteps, setExecutedSteps] = useState<Set<number>>(new Set());
  const [stepsWithResults, setStepsWithResults] = useState<FlowStep[]>([]);

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
    setStepsWithResults([...steps]); // Initialize with copy of steps
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
    setStepsWithResults([]);
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
          const result = { pkceData: pkceDataObj };
          setStepResults(prev => ({ ...prev, 0: result }));
          setExecutedSteps(prev => new Set(prev).add(0));

          console.log('✅ [PKCEFlow] Generated PKCE values:', {
            codeVerifier: codeVerifier.substring(0, 32) + '...',
            codeChallenge: codeChallenge.substring(0, 20) + '...',
            method: 'S256'
          });
          return result;
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setError(`Failed to generate PKCE values: ${errorMessage}`);
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
    scope: '${config?.scopes || 'read write'}',
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
          client_id: config.pingone.clientId,
          redirect_uri: config.pingone.redirectUri,
          scope: config.scopes?.join(' ') || 'read write',
          code_challenge: pkceData.codeChallenge,
          code_challenge_method: 'S256',
          state: Math.random().toString(36).substring(2, 15),
          nonce: Math.random().toString(36).substring(2, 15),
        });

        // Construct authorization endpoint if not available
        const authEndpoint = config.pingone.authEndpoint;
        const url = `${authEndpoint}?${params.toString()}`;

        setAuthUrl(url);
        const result = { url };
        setStepResults(prev => ({ ...prev, 1: result }));
        setExecutedSteps(prev => new Set(prev).add(1));

        console.log('✅ [PKCEFlow] Authorization URL built:', url);
        return result;
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
        if (!authUrl) {
          setError('Authorization URL not found. Please execute step 1 first.');
          return { error: 'Authorization URL not found' };
        }
        
        logger.flow('PKCEFlow', 'Redirecting to PingOne for authentication', { authUrl });
        console.log('✅ [PKCEFlow] Redirecting to PingOne for authentication:', authUrl);
        
        // Actually redirect to PingOne
        window.location.href = authUrl;
        
        const result = {
          message: 'Redirecting to PingOne...',
          url: authUrl
        };
        setStepResults(prev => ({
          ...prev,
          2: result
        }));
        setExecutedSteps(prev => new Set(prev).add(2));
        return result;
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

        const result = { code };
        setStepResults(prev => ({
          ...prev,
          3: result // Note: This is step 3 in 0-based index
        }));
        setExecutedSteps(prev => new Set(prev).add(3));

        console.log('✅ [PKCEFlow] Authorization code received:', code);
        return result;
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
          const tokenUrl = config.pingone.tokenEndpoint;
          const params = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: String(config.pingone.clientId),
            client_secret: String(config.pingone.clientSecret || ''),
            code: 'auth-code-simulated', // In real implementation, this would be the actual code
            code_verifier: pkceData.codeVerifier,
            redirect_uri: String(config.pingone.redirectUri),
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
          const result = { response: tokenData, tokens: tokenData, status: response.status };
          setStepResults(prev => ({ ...prev, 4: result }));
          setExecutedSteps(prev => new Set(prev).add(4));

          console.log('✅ [PKCEFlow] Tokens received:', tokenData);
          return result;
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('❌ [PKCEFlow] Real API call failed:', errorMessage);
          setError(errorMessage);
          return { error: errorMessage };
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
  token_type: "Bearer",
  expires_in: 3600,
  scope: "read write"
};

return tokens;`,
      execute: () => {
        if (!tokensReceived) {
          setError('No tokens received from previous step');
          return { error: 'No tokens received from previous step' };
        }

        const result = { tokens: tokensReceived };
        setStepResults(prev => ({ ...prev, 5: result }));
        setExecutedSteps(prev => new Set(prev).add(5));
        setDemoStatus('success');

        console.log('✅ [PKCEFlow] PKCE validation completed successfully');
        return result;
      }
    }
  ];

  return (
    <Container>
      <PageTitle 
        title={
          <>
            <FiShield />
            PKCE Flow
          </>
        }
        subtitle="Learn how Proof Key for Code Exchange (PKCE) enhances the Authorization Code flow with real API calls to PingOne."
      />

      <FlowCredentials
        flowType="pkce"
        onCredentialsChange={(credentials) => {
          console.log('PKCE flow credentials updated:', credentials);
        }}
      />

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
            steps={stepsWithResults.length > 0 ? stepsWithResults : steps}
            onStart={startPKCEFlow}
            onReset={resetDemo}
            status={demoStatus}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            onStepResult={handleStepResult}
            disabled={!config}
            title="PKCE Flow"
            configurationButton={
              <ConfigurationButton flowType="pkce" />
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
              <TokenDisplayComponent tokens={tokensReceived} />
            </div>
          )}


        </CardBody>
      </DemoSection>
    </Container>
  );
};

export default PKCEFlow;
