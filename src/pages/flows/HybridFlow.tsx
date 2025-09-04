import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { FiPlay, FiEye, FiAlertCircle, FiCode, FiKey, FiShield } from 'react-icons/fi';
import { useAuth } from '../../contexts/NewAuthContext';
import { StepByStepFlow, FlowStep } from '../../components/StepByStepFlow';
import ConfigurationButton from '../../components/ConfigurationButton';
import ColorCodedURL from '../../components/ColorCodedURL';
import { storeOAuthTokens } from '../../utils/tokenStorage';

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
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  svg {
    color: #dc2626;
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  h3 {
    color: #dc2626;
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: #dc2626;
    font-size: 0.9rem;
  }
`;

const DemoSection = styled(Card)`
  margin-bottom: 2rem;
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









const CodeBlock = styled.pre`
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  overflow-x: auto;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #374151;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  white-space: pre-wrap;
`;

const HybridFlow: React.FC = () => {
  const { config } = useAuth();
  const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState('');
  const [redirectParams, setRedirectParams] = useState<any>(null);
  const [tokensReceived, setTokensReceived] = useState<any>(null);

  // Track execution results for each step
  const [stepResults, setStepResults] = useState<Record<number, any>>({});
  const [executedSteps, setExecutedSteps] = useState<Set<number>>(new Set());
  const [stepsWithResults, setStepsWithResults] = useState<FlowStep[]>([]);

  const generateAuthUrl = () => {
    if (!config) return '';

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code id_token token', // Hybrid flow returns code + tokens
      scope: 'openid profile email',
      state: Math.random().toString(36).substring(2, 15),
      nonce: Math.random().toString(36).substring(2, 15),
      code_challenge: 'mock_code_challenge', // In real implementation, generate proper PKCE
      code_challenge_method: 'S256'
    });

    return `${config.authorizationEndpoint || config.authEndpoint || ''}?${params.toString()}`;
  };

  const startHybridFlow = async () => {
    setDemoStatus('loading');
    setCurrentStep(0);
    setError(null);
    setAuthUrl('');
    setRedirectParams(null);
    setTokensReceived(null);
    setStepResults({});
    setExecutedSteps(new Set());
    setStepsWithResults([]);
    setStepsWithResults([...steps]); // Initialize with copy of steps
    console.log('🚀 [HybridFlow] Starting hybrid flow...');
  };

  const resetDemo = () => {
    setDemoStatus('idle');
    setCurrentStep(0);
    setAuthUrl('');
    setRedirectParams(null);
    setTokensReceived(null);
    setError('');
    setStepResults({});
    setExecutedSteps(new Set());
  };

  const handleStepResult = (stepIndex: number, result: any) => {
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
      title: 'Client Prepares Authorization Request',
      description: 'Client creates authorization URL with hybrid response type requesting code + tokens',
      code: `GET ${config?.authorizationEndpoint || 'https://auth.pingone.com/authorize'}?
  client_id=${config?.clientId || 'your_client_id'}
  &redirect_uri=${config?.redirectUri || 'https://your-app.com/callback'}
  &response_type=code id_token token
  &scope=openid profile email
  &state=xyz123
  &nonce=abc456
  &code_challenge=YOUR_CODE_CHALLENGE
  &code_challenge_method=S256`,
      execute: () => {
        if (!config) {
          setError('Configuration required. Please configure your PingOne settings first.');
          return { error: 'Configuration required' };
        }

        const url = generateAuthUrl();
        setAuthUrl(url);
        setStepResults(prev => ({ ...prev, 0: { url } }));
        setExecutedSteps(prev => new Set(prev).add(0));

        console.log('✅ [HybridFlow] Authorization URL generated:', url);
        return { url };
      }
    },
    {
      title: 'User is Redirected to Authorization Server',
      description: 'User authenticates and consents, receiving code and tokens in redirect',
      code: `// User authenticates and is redirected back
// URL fragment contains tokens, query contains code
${config?.redirectUri || 'https://your-app.com/callback'}?
  code=authorization-code-here
  &state=xyz123
#access_token=eyJhbGciOiJSUzI1NiIs...
&id_token=eyJhbGciOiJSUzI1NiIs...`,
      execute: () => {
        if (!authUrl) {
          setError('Authorization URL not available. Please complete step 1 first.');
          return { error: 'Authorization URL not available' };
        }
        
        console.log('✅ [HybridFlow] Redirecting user to PingOne for authentication');
        const result = { message: 'Redirecting to authorization server...' };
        setStepResults(prev => ({ ...prev, 1: result }));
        setExecutedSteps(prev => new Set(prev).add(1));
        
        // Actually redirect to PingOne
        setTimeout(() => {
          window.location.href = authUrl;
        }, 1000); // Small delay to show the message
        
        return result;
      }
    },
    {
      title: 'Authorization Server Redirects with Code + Tokens',
      description: 'Server redirects back with authorization code in query and tokens in fragment',
      code: `// Redirect URL structure:
${config?.redirectUri || 'https://your-app.com/callback'}?code=abc123&state=xyz123#access_token=eyJ...&id_token=eyJ...&token_type=Bearer&expires_in=3600&scope=openid profile email

// JavaScript extracts:
const urlParams = new URLSearchParams(window.location.search);
const hashParams = new URLSearchParams(window.location.hash.substring(1));

const code = urlParams.get('code');
const accessToken = hashParams.get('access_token');
const idToken = hashParams.get('id_token');`,
      execute: () => {
        // Simulate receiving code and tokens in redirect
        const mockParams = {
          code: 'hybrid-auth-code-' + Math.random().toString(36).substr(2, 9),
          state: 'xyz123',
          access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.hybrid_access_token_signature',
          id_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.hybrid_id_token_signature',
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'openid profile email'
        };

        setRedirectParams(mockParams);
        const result = {
          redirectUrl: `${config?.redirectUri || 'https://your-app.com/callback'}?code=${mockParams.code}&state=${mockParams.state}#access_token=${mockParams.access_token}&id_token=${mockParams.id_token}&token_type=${mockParams.token_type}&expires_in=${mockParams.expires_in}&scope=${mockParams.scope}`,
          params: mockParams
        };
        setStepResults(prev => ({ ...prev, 2: result }));
        setExecutedSteps(prev => new Set(prev).add(2));

        console.log('✅ [HybridFlow] Received code and tokens in redirect');
        return result;
      }
    },
    {
      title: 'Client Processes Tokens from Fragment',
      description: 'Client extracts and stores access token and ID token from URL fragment',
      code: `// Extract tokens from URL fragment
const hash = window.location.hash.substring(1);
const hashParams = new URLSearchParams(hash);

const tokens = {
  access_token: hashParams.get('access_token'),
  id_token: hashParams.get('id_token'),
  token_type: hashParams.get('token_type'),
  expires_in: parseInt(hashParams.get('expires_in')),
  scope: hashParams.get('scope')
};

// Store tokens securely using shared utility
const tokensForStorage = {
  access_token: tokens.access_token,
  id_token: tokens.id_token,
  token_type: tokens.token_type,
  expires_in: tokens.expires_in,
  scope: tokens.scope
};
          storeOAuthTokens(tokensForStorage, 'hybrid', 'Hybrid Flow');

// Validate ID token (signature, claims, nonce)
const isValid = validateIdToken(tokens.id_token);`,
      execute: () => {
        if (!redirectParams) {
          setError('No redirect parameters available. Please complete previous step first.');
          return;
        }

        const tokens = {
          access_token: redirectParams.access_token,
          id_token: redirectParams.id_token,
          token_type: redirectParams.token_type,
          expires_in: redirectParams.expires_in,
          scope: redirectParams.scope
        };

        setTokensReceived(tokens);
        const result = { tokens, message: 'Tokens extracted from URL fragment' };
        setStepResults(prev => ({ ...prev, 3: result }));
        setExecutedSteps(prev => new Set(prev).add(3));

        console.log('✅ [HybridFlow] Tokens processed from fragment');
        return result;
      }
    },
    {
      title: 'Client Exchanges Code for Refresh Token (Optional)',
      description: 'Client can exchange authorization code for additional tokens like refresh token',
      code: `// Exchange authorization code for refresh token
POST ${config?.tokenEndpoint || 'https://auth.pingone.com/token'}
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&client_id=${config?.clientId || 'your_client_id'}
&client_secret=${config?.clientSecret ? '••••••••' : 'your_client_secret'}
&code=${redirectParams?.code || 'authorization-code-here'}
&redirect_uri=${config?.redirectUri || 'https://your-app.com/callback'}
&code_verifier=YOUR_CODE_VERIFIER`,
      execute: async () => {
        if (!config) {
          setError('Configuration required. Please configure your PingOne settings first.');
          return { error: 'Configuration required' };
        }

        // Check if we have authorization code from previous steps
        const step2Result = stepResults[2];
        const authCode = step2Result?.params?.code || redirectParams?.code;
        
        if (!authCode) {
          setError('Authorization code not available. Please complete step 2 first.');
          return { error: 'Authorization code not available' };
        }

        try {
          // Make real token exchange request
          const response = await fetch(config.tokenEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              client_id: config.clientId,
              client_secret: config.clientSecret || '',
              code: authCode,
              redirect_uri: config.redirectUri,
              code_verifier: 'mock_code_verifier' // In real implementation, use actual code verifier
            })
          });

          if (!response.ok) {
            throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
          }

          const tokenData = await response.json();
          setTokensReceived((prev: any) => ({ ...prev, ...tokenData }));
          const result = { response: tokenData, status: response.status };
          setStepResults(prev => ({ ...prev, 4: result }));
          setExecutedSteps(prev => new Set(prev).add(4));
          setDemoStatus('success');

          // Store tokens using the shared utility
          const tokensForStorage = {
            access_token: tokenData.access_token,
            id_token: tokenData.id_token,
            refresh_token: tokenData.refresh_token,
            token_type: tokenData.token_type,
            expires_in: tokenData.expires_in,
            scope: tokenData.scope || 'openid profile email'
          };
          
          const success = storeOAuthTokens(tokensForStorage, 'hybrid', 'Hybrid Flow');
          if (success) {
            console.log('✅ [HybridFlow] Code exchanged for additional tokens and stored successfully');
          } else {
            console.error('❌ [HybridFlow] Failed to store tokens');
          }
          return result;
        } catch (error: any) {
          setError(`Failed to exchange code for tokens: ${error.message}`);
          console.error('❌ [HybridFlow] Token exchange error:', error);
          return { error: error.message };
        }
      }
    },
    {
      title: 'Client Validates ID Token',
      description: 'Client validates ID token signature and claims for security',
      code: `// Validate ID token
const payload = decodeIdToken(tokens.id_token);

// Validate issuer
if (payload.iss !== '${config?.authorizationEndpoint?.replace('/as/authorize', '') || 'https://auth.pingone.com/your-env'}') {
  throw new Error('Invalid issuer');
}

// Validate audience
if (payload.aud !== '${config?.clientId || 'your_client_id'}') {
  throw new Error('Invalid audience');
}

// Validate nonce (if present in original request)
if (payload.nonce !== 'abc456') {
  throw new Error('Invalid nonce');
}

// Check expiration
if (Date.now() / 1000 > payload.exp) {
  throw new Error('Token expired');
}`,
      execute: () => {
        // Check if we have ID token from previous steps
        const step3Result = stepResults[3];
        const idToken = step3Result?.tokens?.id_token || tokensReceived?.id_token;
        
        if (!idToken) {
          setError('No ID token available for validation. Please complete step 3 first.');
          return { error: 'No ID token available for validation' };
        }

        // Simulate ID token validation
        const validationResult = {
          issuer: config?.authorizationEndpoint?.replace('/as/authorize', '') || 'https://auth.pingone.com/your-env',
          audience: config?.clientId || 'your_client_id',
          nonce: 'abc456',
          expiration: 'Valid',
          signature: 'Valid'
        };

        const result = {
          validation: validationResult,
          message: 'ID token validated successfully'
        };
        setStepResults(prev => ({ ...prev, 5: result }));
        setExecutedSteps(prev => new Set(prev).add(5));

        console.log('✅ [HybridFlow] ID token validated');
        return result;
      }
    }
  ];

  return (
    <Container>
      <Header>
        <h1>
          <FiShield />
          Hybrid Flow (OpenID Connect)
        </h1>
        <p>
          Hybrid Flow combines elements of Authorization Code and Implicit flows. The client receives an authorization code
          and access/id tokens directly in the redirect URI. This flow is useful for SPAs that need immediate access to
          tokens while maintaining security through PKCE and server-side code exchange.
        </p>
      </Header>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', marginBottom: '3rem', padding: '1.5rem 0' }}>
        <ConfigurationButton flowType="hybrid" />
      </div>

      <FlowOverview>
        <CardHeader>
          <h2>Flow Overview</h2>
        </CardHeader>
        <CardBody>
          <FlowDescription>
            <h2>What is Hybrid Flow?</h2>
            <p>
              The Hybrid Flow is a combination of the Authorization Code Flow and Implicit Flow. It allows clients to
              receive both an authorization code (for secure server-side token exchange) and tokens directly in the
              redirect URI (for immediate client-side use).
            </p>
            <p>
              <strong>Response Types:</strong> <code>code id_token</code> or <code>code id_token token</code>
            </p>
          </FlowDescription>

          <SecurityHighlight>
            <FiShield size={20} />
            <div>
              <h3>Security Best Practices</h3>
              <p>
                Always use PKCE, validate ID tokens, use HTTPS, and implement proper token storage.
                The hybrid nature provides both immediate access and long-term security.
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
            onStart={startHybridFlow}
            onReset={resetDemo}
            status={demoStatus}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            onStepResult={handleStepResult}
            disabled={!config}
            title="Hybrid Flow"
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

          {authUrl && (
            <div>
              <h3>Authorization URL Generated:</h3>
              <ColorCodedURL url={authUrl} />
            </div>
          )}

          {redirectParams && (
            <div>
              <h3>Redirect Parameters:</h3>
              <CodeBlock>
                {JSON.stringify(redirectParams, null, 2)}
              </CodeBlock>
            </div>
          )}

          {tokensReceived && (
            <div>
              <h3>Tokens Received:</h3>
              <CodeBlock>
                {JSON.stringify(tokensReceived, null, 2)}
              </CodeBlock>
            </div>
          )}


        </CardBody>
      </DemoSection>
    </Container>
  );
};

export default HybridFlow;
