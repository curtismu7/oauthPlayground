import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { FiPlay, FiEye, FiAlertCircle, FiKey, FiSettings, FiArrowRight } from 'react-icons/fi';
import TokenDisplayComponent from '../../components/TokenDisplay';
import ColorCodedURL from '../../components/ColorCodedURL';
import { useAuth } from '../../contexts/NewAuthContext';
import { FlowConfiguration, type FlowConfig } from '../../components/FlowConfiguration';
import { getDefaultConfig, validatePingOneConfig } from '../../utils/flowConfigDefaults';
import PageTitle from '../../components/PageTitle';
import { StepByStepFlow, FlowStep } from '../../components/StepByStepFlow';

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

const Step = styled.div<{$active?: boolean; $completed?: boolean; $error?: boolean}>`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  border-radius: 0.5rem;
  background-color: ${({ $active, $completed, $error }) => {
    if ($error) return 'rgba(239, 68, 68, 0.1)';
    if ($completed) return 'rgba(34, 197, 94, 0.1)';
    if ($active) return 'rgba(59, 130, 246, 0.1)';
    return 'transparent';
  }};
  border: 2px solid ${({ $active, $completed, $error }) => {
    if ($error) return '#ef4444';
    if ($completed) return '#22c55e';
    if ($active) return '#3b82f6';
    return 'transparent';
  }};
`;

const StepNumber = styled.div<{$active?: boolean; $completed?: boolean; $error?: boolean}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  font-weight: 600;
  font-size: 1rem;
  flex-shrink: 0;

  ${({ $active, $completed, $error }) => {
    if ($error) {
      return `
        background-color: #ef4444;
        color: white;
      `;
    }
    if ($completed) {
      return `
        background-color: #22c55e;
        color: white;
      `;
    }
    if ($active) {
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
`;

const CodeBlock = styled.pre`
  background-color: ${({ theme }) => theme.colors.gray100};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  overflow-x: auto;
  font-size: 0.875rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  color: ${({ theme }) => theme.colors.gray800};
  white-space: pre-wrap;
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
  white-space: pre-wrap;
  overflow: visible;
  max-height: none;
  height: auto;
`;

const ErrorMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.danger}10;
  border: 1px solid ${({ theme }) => theme.colors.danger}30;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 0.9rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  svg {
    flex-shrink: 0;
    margin-top: 0.1rem;
  }
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

// Type guard to check if an object has a specific property
const hasProperty = <T extends object, K extends string>(
  obj: T | null | undefined,
  prop: K
): obj is T & Record<K, unknown> => {
  return obj != null && prop in obj;
};

const AuthorizationCodeFlow = () => {
  const { isAuthenticated } = useAuth();
  const { config, tokens: contextTokens } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [demoStatus, setDemoStatus] = useState('idle');
  const [currentStep, setCurrentStep] = useState(0);
  
  // Debug currentStep changes
  useEffect(() => {
    console.log('🔄 [AuthorizationCodeFlow] currentStep changed to:', currentStep);
  }, [currentStep]);
  
  // Flow configuration state
  const [flowConfig, setFlowConfig] = useState<FlowConfig>(() => getDefaultConfig('authorization-code'));
  const [showConfig, setShowConfig] = useState(false);
  interface TokenResponse {
    access_token?: string;
    id_token?: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
    [key: string]: unknown;
  }

  const [tokensReceived, setTokensReceived] = useState<TokenResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authCode, setAuthCode] = useState<string>('');
  const [authUrl, setAuthUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);



  // Track execution results for each step
  const [stepResults, setStepResults] = useState<Record<number, any>>({});
  const [executedSteps, setExecutedSteps] = useState<Set<number>>(new Set());

  // If we already have tokens from the real OAuth flow, surface them in the demo
  useEffect(() => {
    if (contextTokens && !tokensReceived) {
      setTokensReceived(contextTokens as Record<string, unknown> | null);
      setCurrentStep(5);
      setDemoStatus('success');
      setIsLoading(false);
    }
  }, [contextTokens, tokensReceived]);

  // Define steps with real URLs from config
  const steps: FlowStep[] = [
    {
      title: 'Client Prepares Authorization Request',
      description: 'The client application prepares an authorization request with required parameters.',
      code: `GET /authorize?
  client_id=${config?.clientId || 'your-client-id'}
  &redirect_uri=${config?.redirectUri || 'https://your-app.com/callback'}
  &response_type=${flowConfig.responseType}
  &scope=${flowConfig.scopes.join(' ')}
  &state=${flowConfig.state || 'xyz123'}
  &nonce=${flowConfig.nonce || 'abc456'}${flowConfig.enablePKCE ? `
  &code_challenge=YOUR_CODE_CHALLENGE
  &code_challenge_method=${flowConfig.codeChallengeMethod}` : ''}${flowConfig.maxAge > 0 ? `
  &max_age=${flowConfig.maxAge}` : ''}${flowConfig.prompt ? `
  &prompt=${flowConfig.prompt}` : ''}${flowConfig.loginHint ? `
  &login_hint=${flowConfig.loginHint}` : ''}${flowConfig.acrValues.length > 0 ? `
  &acr_values=${flowConfig.acrValues.join(' ')}` : ''}${Object.keys(flowConfig.customParams).length > 0 ? `
  ${Object.entries(flowConfig.customParams).map(([k, v]) => `&${k}=${v}`).join('\n  ')}` : ''}`,
      execute: () => {
        console.log('🔄 [AuthCodeFlow] Authorization code step executing', { config: !!config });
        if (!config) {
          console.error('❌ [AuthCodeFlow] Configuration required');
          setError('Configuration required. Please configure your PingOne settings first.');
          return;
        }

        const url = `${config.authorizationEndpoint || config.authEndpoint || ''}?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&response_type=${flowConfig.responseType}&scope=${encodeURIComponent(flowConfig.scopes.join(' '))}&state=${flowConfig.state || 'xyz123'}&nonce=${flowConfig.nonce || 'abc456'}${flowConfig.enablePKCE ? `&code_challenge=YOUR_CODE_CHALLENGE&code_challenge_method=${flowConfig.codeChallengeMethod}` : ''}${flowConfig.maxAge > 0 ? `&max_age=${flowConfig.maxAge}` : ''}${flowConfig.prompt ? `&prompt=${flowConfig.prompt}` : ''}${flowConfig.loginHint ? `&login_hint=${flowConfig.loginHint}` : ''}${flowConfig.acrValues.length > 0 ? `&acr_values=${encodeURIComponent(flowConfig.acrValues.join(' '))}` : ''}${Object.keys(flowConfig.customParams).length > 0 ? Object.entries(flowConfig.customParams).map(([k, v]) => `&${k}=${encodeURIComponent(v)}`).join('') : ''}`;

        setAuthUrl(url);
        setStepResults(prev => ({ ...prev, 0: { url } }));
        setExecutedSteps(prev => new Set(prev).add(0));

        console.log('✅ [AuthCodeFlow] Authorization URL generated:', url);
      }
    },
    {
      title: 'User is Redirected to Authorization Server',
      description: 'The user is redirected to the authorization server where they authenticate and authorize the client.',
      code: `// User clicks the authorization URL and is redirected to PingOne
window.location.href = authUrl;

// PingOne handles:
// - User authentication
// - Consent for requested scopes
// - Redirect back to client with authorization code`,
      execute: () => {
        console.log('✅ [AuthCodeFlow] User would be redirected to PingOne for authentication');
        setStepResults(prev => ({ ...prev, 1: { message: 'User redirected to authorization server' } }));
        setExecutedSteps(prev => new Set(prev).add(1));
      }
    },
    {
      title: 'Authorization Server Redirects Back',
      description: 'After successful authentication, the authorization server redirects back to the client with an authorization code.',
      code: `GET ${config?.redirectUri || 'https://your-app.com/callback'}?
  code=authorization-code-here
  &state=${flowConfig.state || 'xyz123'}`,
      execute: () => {
        // Simulate getting authorization code from URL or generate one
        const searchParams = new URLSearchParams(location.search || '');
        const codeFromUrl = searchParams.get('code');
        const code = codeFromUrl || ('auth-code-' + Math.random().toString(36).substr(2, 9));

        setAuthCode(code);
        const stepResult = {
          url: `${config?.redirectUri || 'https://your-app.com/callback'}?code=${code}&state=${flowConfig.state || 'xyz123'}`,
          code: code
        };
        
        setStepResults(prev => ({
          ...prev,
          2: stepResult
        }));
        setExecutedSteps(prev => new Set(prev).add(2));

        console.log('✅ [AuthCodeFlow] Authorization code received:', code);
        console.log('🔍 [AuthCodeFlow] Step result set:', stepResult);
      }
    },
    {
      title: 'Client Exchanges Code for Tokens',
      description: 'The client sends the authorization code to the token endpoint to receive access and ID tokens.',
      code: `POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&client_id=${config?.clientId || 'your-client-id'}
&client_secret=${config?.clientSecret ? '••••••••' : 'your-client-secret'}
&code=${authCode || 'authorization-code-here'}
&redirect_uri=${config?.redirectUri || 'https://your-app.com/callback'}${flowConfig.enablePKCE ? `
&code_verifier=YOUR_CODE_VERIFIER` : ''}`,
      execute: async () => {
        console.log('🔄 [AuthCodeFlow] Token exchange step executing', { config: !!config, authCode: !!authCode });
        if (!config || !authCode) {
          console.error('❌ [AuthCodeFlow] Missing configuration or authorization code', { config: !!config, authCode: !!authCode });
          setError('Missing configuration or authorization code');
          return;
        }

        try {
          // Try real API call first
          const tokenUrl = config.tokenEndpoint;
          const params = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: String(config.clientId),
            client_secret: String(config.clientSecret || ''),
            code: authCode,
            redirect_uri: String(config.redirectUri),
          });

          const savedCodeVerifier = localStorage.getItem('oauth_code_verifier');
          if (savedCodeVerifier) {
            params.append('code_verifier', savedCodeVerifier);
          }

          console.log('🔄 [AuthCodeFlow] Attempting token exchange with:', {
            tokenUrl,
            clientId: config.clientId,
            code: authCode.substring(0, 10) + '...',
            redirectUri: config.redirectUri
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
          setStepResults(prev => ({ ...prev, 3: { response: tokenData, status: response.status } }));
          setExecutedSteps(prev => new Set(prev).add(3));

          console.log('✅ [AuthCodeFlow] Tokens received from API:', tokenData);
        } catch (error: any) {
          console.warn('⚠️ [AuthCodeFlow] Real API failed, using mock tokens:', error.message);
          
          // Fallback to mock tokens for demo purposes
          const mockTokens = {
            access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.EkN-DOsnsuRjRO6BxXemmJDm3HbxrbRzXglbN2S4sOkopdU4IsDxTI8jO19W_A4K8ZPJijNLis4EZsHeY559a4DFOd50_OqgH58ERTqYZyhtFJh3w9Hl6B1JKdHOsm0R8aBc_htvzJdR54bL9JYe6OvhALbbSRU7Nx1n2HclYFjtYL4a1XBfUw',
            token_type: 'Bearer',
            expires_in: 3600,
            id_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
            refresh_token: 'refresh-token-' + Math.random().toString(36).substr(2, 9)
          };
          
          setTokensReceived(mockTokens);
          setStepResults(prev => ({ ...prev, 3: { response: mockTokens, status: 200, mock: true } }));
          setExecutedSteps(prev => new Set(prev).add(3));

          console.log('✅ [AuthCodeFlow] Mock tokens generated:', mockTokens);
        }
      }
    },
    {
      title: 'Client Receives Tokens',
      description: 'The authorization server validates the code and returns access token, ID token, and optionally refresh token.',
      code: `{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "id_token": "eyJhbGciOiJSUzI1NiIs...",
  "refresh_token": "refresh-token-here"
}`,
      execute: () => {
        if (!tokensReceived) {
          setError('No tokens received from previous step');
          return;
        }

        setStepResults(prev => ({ ...prev, 4: { tokens: tokensReceived } }));
        setExecutedSteps(prev => new Set(prev).add(4));
        setDemoStatus('success');

        console.log('✅ [AuthCodeFlow] Tokens processed successfully');
      }
    }
  ];


  const startAuthFlow = () => {
    setDemoStatus('loading');
    setCurrentStep(0);
    setError('');
    setTokensReceived(null);
    setStepResults({});
    setExecutedSteps(new Set());
    console.log('🚀 [AuthCodeFlow] Starting authorization code flow...');
  };



  const resetDemo = () => {
    setDemoStatus('idle');
    setCurrentStep(0);
    setTokensReceived(null);
    setError('');
    setStepResults({});
    setExecutedSteps(new Set());
  };

  return (
    <Container>
      <PageTitle 
        title="Authorization Code Flow"
        subtitle="The most secure and widely used OAuth 2.0 flow for web applications. Perfect for server-side applications that can securely store client secrets."
      />

      <FlowOverview>
        <CardHeader>
          <h2>Flow Overview</h2>
        </CardHeader>
        <CardBody>
          <FlowDescription>
            <h2>What is the Authorization Code Flow?</h2>
            <p>
              The Authorization Code flow is the most secure OAuth 2.0 flow for applications that can
              securely store client secrets. It's designed for web applications with a backend server
              that can make secure API calls.
            </p>
            <p>
              <strong>How it works:</strong> Instead of returning tokens directly in the redirect,
              the authorization server returns a temporary authorization code. The client then
              exchanges this code for tokens by making a secure server-to-server request.
            </p>
          </FlowDescription>

          <SecurityHighlight>
              <FiKey size={20} />
            <div>
              <h3>Why It's Secure</h3>
              <p>
                The authorization code is short-lived and can only be used once.
                The actual token exchange happens server-side, keeping sensitive
                information away from the user's browser.
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
            onStart={startAuthFlow}
            onReset={resetDemo}
            status={demoStatus}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            disabled={!config}
            title="Authorization Code Flow"
          />

          {/* Configuration Toggle */}
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <DemoButton
              className="secondary"
              onClick={() => setShowConfig(!showConfig)}
            >
              <FiSettings />
              {showConfig ? 'Hide' : 'Show'} Configuration
            </DemoButton>
          </div>

          {/* Flow Configuration Panel */}
          {showConfig && (
            <>
              <FlowConfiguration
                config={flowConfig}
                onConfigChange={setFlowConfig}
                flowType="authorization-code"
              />
              
              {/* Configuration Validation */}
              {(() => {
                const validation = validatePingOneConfig(flowConfig);
                if (!validation.isValid) {
                  return (
                    <Card style={{ marginBottom: '1rem', borderColor: '#ef4444' }}>
                      <CardHeader>
                        <h4 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FiAlertCircle />
                          Configuration Issues
                        </h4>
                      </CardHeader>
                      <CardBody>
                        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#ef4444' }}>
                          {validation.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </CardBody>
                    </Card>
                  );
                }
                return null;
              })()}
            </>
          )}

          {/* Configuration Status */}
          {!config?.clientId && (
            <ErrorMessage>
              <FiAlertCircle />
              <strong>Configuration Required:</strong> PingOne settings are not configured. 
              Please check the Configuration page or browser console for details.
              <br />
              <button 
                onClick={() => {
                  console.log('🔍 [AuthorizationCodeFlow] Current config:', config);
                  console.log('🔍 [AuthorizationCodeFlow] localStorage keys:', Object.keys(localStorage));
                  console.log('🔍 [AuthorizationCodeFlow] pingone_config:', localStorage.getItem('pingone_config'));
                  console.log('🔍 [AuthorizationCodeFlow] Environment variables:', {
                    envId: (window as any).__PINGONE_ENVIRONMENT_ID__,
                    apiUrl: (window as any).__PINGONE_API_URL__,
                    clientId: (window as any).__PINGONE_CLIENT_ID__
                  });
                }}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                🔍 Debug Configuration Loading
              </button>
            </ErrorMessage>
          )}
          
          {config?.clientId && (
            <div style={{ 
              background: '#f0f9ff', 
              border: '1px solid #0ea5e9', 
              borderRadius: '8px', 
              padding: '1rem', 
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              <strong>✅ PingOne Configuration Loaded:</strong>
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                <div><strong>Client ID:</strong> {config.clientId}</div>
                <div><strong>Environment ID:</strong> {config.environmentId}</div>
                <div><strong>API URL:</strong> {config.authorizationEndpoint || config.authEndpoint || 'Not configured'}</div>
              </div>
            </div>
          )}

          {!isAuthenticated && (
            <ErrorMessage>
              <FiAlertCircle />
              <strong>Note:</strong> This demo shows the flow conceptually.
              For a real implementation, configure your PingOne environment first.
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
              <CodeBlock>{authUrl}</CodeBlock>
              <p><em>In a real app, the user would be redirected to this URL</em></p>
            </div>
          )}

          {authCode && (
            <div>
              <h3>Authorization Code Received:</h3>
              <CodeBlock>{authCode}</CodeBlock>
              <p><em>This code would be exchanged for tokens server-side</em></p>
            </div>
          )}

          {tokensReceived && (
            <div>
              <h3>Tokens Received:</h3>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <strong>Full Token Response (JSON):</strong>
                  <button
                    onClick={() => {
                      const accessToken = tokensReceived && 'access_token' in tokensReceived ? 
                        String(tokensReceived.access_token) : '';
                      navigator.clipboard.writeText(accessToken);
                      alert('Access token copied to clipboard!');
                    }}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                    title="Copy Access Token"
                  >
                    📋 Copy Token
                  </button>
                </div>
                <TokenDisplay style={{
                  fontSize: '0.85rem',
                  lineHeight: '1.4',
                  overflow: 'visible',
                  maxHeight: 'none',
                  height: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {tokensReceived ? JSON.stringify(tokensReceived, null, 2) : 'No tokens received'}
                </TokenDisplay>
              </div>

              {/* Individual Token Boxes */}
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem', color: '#374151' }}>Individual Tokens:</h4>

                {/* Access Token Box */}
                <div style={{
                  marginBottom: '1rem',
                  padding: '1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  backgroundColor: '#f8fafc'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <strong style={{ color: '#059669' }}>Access Token:</strong>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText((tokensReceived.access_token as string) || '');
                        alert('Access token copied to clipboard!');
                      }}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#059669',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                      title="Copy Access Token"
                    >
                      📋 Copy
                    </button>
                  </div>
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    backgroundColor: 'white',
                    padding: '0.5rem',
                    borderRadius: '0.25rem',
                    border: '1px solid #e5e7eb',
                    wordBreak: 'break-all',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {hasProperty(tokensReceived, 'access_token') ? String(tokensReceived.access_token) : 'Not available'}
                  </div>
                </div>

                {/* ID Token Box */}
                {hasProperty(tokensReceived, 'id_token') && tokensReceived.id_token && (
                  <div style={{
                    marginBottom: '1rem',
                    padding: '1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    backgroundColor: '#f8fafc'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <strong style={{ color: '#7c3aed' }}>ID Token:</strong>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText((tokensReceived.id_token as string) || '');
                          alert('ID token copied to clipboard!');
                        }}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#7c3aed',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                        title="Copy ID Token"
                      >
                        📋 Copy
                      </button>
                    </div>
                    <div style={{
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      backgroundColor: 'white',
                      padding: '0.5rem',
                      borderRadius: '0.25rem',
                      border: '1px solid #e5e7eb',
                      wordBreak: 'break-all',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {hasProperty(tokensReceived, 'id_token') ? String(tokensReceived.id_token) : 'Not available'}
                    </div>
                  </div>
                )}

                {/* Refresh Token Box */}
                {hasProperty(tokensReceived, 'refresh_token') && tokensReceived.refresh_token && (
                  <div style={{
                    marginBottom: '1rem',
                    padding: '1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    backgroundColor: '#f8fafc'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <strong style={{ color: '#dc2626' }}>Refresh Token:</strong>
                      <button
                        onClick={() => {
                          const refreshToken = hasProperty(tokensReceived, 'refresh_token') && tokensReceived.refresh_token 
                            ? String(tokensReceived.refresh_token) 
                            : '';
                          navigator.clipboard.writeText(refreshToken);
                          alert('Refresh token copied to clipboard!');
                        }}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                        title="Copy Refresh Token"
                      >
                        📋 Copy
                      </button>
                    </div>
                    <div style={{
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      backgroundColor: 'white',
                      padding: '0.5rem',
                      borderRadius: '0.25rem',
                      border: '1px solid #e5e7eb',
                      wordBreak: 'break-all',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {hasProperty(tokensReceived, 'refresh_token') ? String(tokensReceived.refresh_token) : 'Not available'}
                    </div>
                  </div>
                )}

                {/* Token Metadata */}
                <div style={{
                  padding: '1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  backgroundColor: '#f8fafc'
                }}>
                  <h4 style={{ marginBottom: '0.5rem', color: '#374151' }}>Token Metadata:</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
                    <div>
                      <strong style={{ fontSize: '0.875rem' }}>Token Type:</strong>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        {tokensReceived.token_type || 'Not available'}
                      </div>
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.875rem' }}>Expires In:</strong>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        {tokensReceived.expires_in ? `${tokensReceived.expires_in} seconds` : 'Not available'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => navigate(`/token-management`)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <FiEye size={16} />
                  View Token Management
                </button>
                {hasProperty(tokensReceived, 'id_token') && tokensReceived.id_token && (
                  <button
                    onClick={() => navigate(`/token-management`)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#059669',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <FiEye size={16} />
                    View ID Token in Management
                  </button>
                )}
              </div>
            </div>
          )}

          <StepsContainer>
            <h3>Flow Steps</h3>
            {steps.map((step, index) => {
              const stepResult = stepResults[index];
              const isExecuted = executedSteps.has(index);
              
              // Debug logging for step 2 (authorization code step)
              if (index === 2) {
                console.log('🔍 [AuthCodeFlow] Rendering step 2:', {
                  stepTitle: step.title,
                  stepResult,
                  isExecuted,
                  allStepResults: stepResults
                });
              }

              return (
                <Step
                  key={index}
                  id={`step-${index}`}
                  $active={currentStep === index && demoStatus === 'loading'}
                  $completed={currentStep > index}
                  $error={currentStep === index && demoStatus === 'error'}
                  style={{
                    backgroundColor: step.backgroundColor,
                    borderColor: step.borderColor,
                    border: `2px solid ${step.borderColor}`
                  }}
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

                    {/* Show request code section always (this is the template/example) */}
                    {step.code && step.code.trim() && (
                      <CodeBlock style={{ marginTop: '1rem' }}>
                        {step.code}
                      </CodeBlock>
                    )}
                    {/* Debug: Show if step.code is empty */}
                    {(!step.code || !step.code.trim()) && (
                      <div style={{ 
                        marginTop: '1rem', 
                        padding: '1rem', 
                        backgroundColor: '#fef3c7', 
                        border: '1px solid #f59e0b', 
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        color: '#92400e'
                      }}>
                        ⚠️ No code content available for this step (Step {index + 1}: {step.title})
                        <br />
                        <small>Debug: step.code = "{step.code}"</small>
                      </div>
                    )}

                    {/* Show response/result only after step is executed */}
                    {isExecuted && stepResult && (
                      <ResponseBox
                        $backgroundColor={step.backgroundColor || '#f8fafc'}
                        $borderColor={step.borderColor || '#e2e8f0'}
                      >
                        <h4>Response:</h4>
                        {stepResult.url && (
                          <div>
                            <strong>URL:</strong><br />
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
                            console.log('🔄 [AuthorizationCodeFlow] Next Step button clicked', { 
                              currentIndex: index, 
                              nextStep: nextStepIndex, 
                              currentStepBefore: currentStep
                            });
                            setCurrentStep(nextStepIndex);
                            console.log('🔄 [AuthorizationCodeFlow] setCurrentStep called with:', nextStepIndex);
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

export default AuthorizationCodeFlow;
