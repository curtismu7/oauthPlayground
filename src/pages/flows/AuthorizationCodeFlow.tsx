import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { FiPlay, FiEye, FiAlertCircle, FiKey } from 'react-icons/fi';
import ColorCodedURL from '../../components/ColorCodedURL';
import { useAuth } from '../../contexts/NewAuthContext';

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
  const [isLoading, setIsLoading] = useState(false);
  const [waitingForUser, setWaitingForUser] = useState(false);
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

  const [authUrl, setAuthUrl] = useState('');
  const [authCode, setAuthCode] = useState('');

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
  const steps = [
    {
      title: 'Client Prepares Authorization Request',
      description: 'The client application prepares an authorization request with required parameters.',
      code: `GET /authorize?
  client_id=${config?.clientId || 'your-client-id'}
  &redirect_uri=${config?.redirectUri || 'https://your-app.com/callback'}
  &response_type=code
  &scope=${config?.scopes || 'openid profile email'}
  &state=xyz123
  &nonce=abc456`,
      url: config ? `${config.authEndpoint.replace('{envId}', config.environmentId)}?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&response_type=code&scope=${encodeURIComponent(config.scopes)}&state=xyz123&nonce=abc456` : 'Configure PingOne settings to see real URL',
      backgroundColor: '#f0f9ff',
      borderColor: '#0ea5e9'
    },
    {
      title: 'User is Redirected to Authorization Server',
      description: 'The user is redirected to the authorization server where they authenticate and authorize the client.',
      code: 'User authenticates and grants permission',
      url: config ? `${config.authEndpoint.replace('{envId}', config.environmentId)}?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&response_type=code&scope=${encodeURIComponent(config.scopes)}&state=xyz123&nonce=abc456` : 'Configure PingOne settings to see real URL',
      backgroundColor: '#fef3c7',
      borderColor: '#f59e0b'
    },
    {
      title: 'Authorization Server Redirects Back',
      description: 'After successful authentication, the authorization server redirects back to the client with an authorization code.',
      code: `GET ${config?.redirectUri || 'https://your-app.com/callback'}?
  code=authorization-code-here
  &state=xyz123`,
      url: config ? `${config.redirectUri}?code=auth-code-123&state=xyz123` : 'Configure PingOne settings to see real URL',
      backgroundColor: '#eff6ff',
      borderColor: '#3b82f6'
    },
    {
      title: 'Client Exchanges Code for Tokens',
      description: 'The client sends the authorization code to the token endpoint to receive access and ID tokens.',
      code: `POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&client_id=${config?.clientId || 'your-client-id'}
&client_secret=${config?.clientSecret ? '••••••••' : 'your-client-secret'}
&code=authorization-code-here
&redirect_uri=${config?.redirectUri || 'https://your-app.com/callback'}`,
      url: config ? config.tokenEndpoint.replace('{envId}', config.environmentId) : 'Configure PingOne settings to see real URL',
      backgroundColor: '#fef2f2',
      borderColor: '#ef4444'
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
      url: 'Tokens received in response',
      backgroundColor: '#f5f3ff',
      borderColor: '#8b5cf6'
    }
  ];


  const startAuthFlow = () => {
    setDemoStatus('loading');
    setIsLoading(true);
    setCurrentStep(0);
    setError('');
    setAuthUrl('');
    setAuthCode('');
    setTokensReceived(null);
    // Start the first step automatically
    executeStep(0);
  };

  const executeStep = (stepIndex: number) => {
    setWaitingForUser(false);
    setIsLoading(true);

    switch (stepIndex) {
      case 0:
        // Step 1: Generate authorization URL
        setTimeout(() => {
          if (config) {
            const authUrl = `${config.authEndpoint.replace('{envId}', config.environmentId)}?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&response_type=code&scope=${encodeURIComponent(config.scopes)}&state=xyz123&nonce=abc456`;
            setAuthUrl(authUrl);
            setCurrentStep(1);
            setWaitingForUser(true);
            setIsLoading(false);
          } else {
            setError('OAuth configuration is missing. Please configure PingOne settings first.');
            setIsLoading(false);
          }
        }, 1000);
        break;

      case 1:
        // Step 2: User is redirected to authorization server (simulate)
        setTimeout(() => {
          setCurrentStep(2);
          setWaitingForUser(true);
          setIsLoading(false);
        }, 1000);
        break;

      case 2:
        // Step 3: Authorization server redirects back with code
        setTimeout(() => {
          // Prefer a real code if present in the URL (useful when user lands here after redirect)
          const searchParams = new URLSearchParams(location.search || '');
          const codeFromUrl = searchParams.get('code');
          const code = codeFromUrl || ('auth-code-' + Math.random().toString(36).substr(2, 9));
          setAuthCode(code);
          setCurrentStep(3);
          setWaitingForUser(true);
          setIsLoading(false);
        }, 1000);
        break;

      case 3:
        // Step 4: Client exchanges code for tokens (REAL API CALL)
        if (config && authCode) {
          const tokenUrl = config.tokenEndpoint.replace('{envId}', config.environmentId);

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

          fetch(tokenUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
          })
          .then(response => {
            if (!response.ok) {
              throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
            }
            return response.json();
          })
          .then((tokenData: unknown) => {
            if (tokenData && typeof tokenData === 'object') {
              setTokensReceived(tokenData as TokenResponse);
            } else {
              setTokensReceived(null);
            }
            setCurrentStep(4);
            setWaitingForUser(true);
            setIsLoading(false);
          })
          .catch((error: Error) => {
            console.error('Token exchange error:', error);
            setError(`Failed to exchange authorization code for tokens: ${error.message}`);
            setIsLoading(false);
          });
        } else {
          setError('Missing configuration or authorization code');
          setIsLoading(false);
        }
        break;

      case 4:
        // Step 5: Client makes authenticated API call (REAL API CALL)
        if (tokensReceived?.access_token) {
          const userInfoUrl = config?.userInfoEndpoint?.replace('{envId}', config.environmentId);

          if (userInfoUrl) {
            fetch(userInfoUrl, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${tokensReceived.access_token}`,
              },
            })
            .then(response => {
              if (!response.ok) {
                throw new Error(`UserInfo call failed: ${response.status} ${response.statusText}`);
              }
              return response.json();
            })
            .then((userInfo: unknown) => {
              setTokensReceived((prev: Record<string, unknown> | null) => ({
                ...prev,
                user_info: userInfo
              }));
              setCurrentStep(5);
              setDemoStatus('success');
              setIsLoading(false);
            })
            .catch((error: Error) => {
              console.error('UserInfo call error:', error);
              // Still mark as success since we got tokens, just note the UserInfo error
              setCurrentStep(5);
              setDemoStatus('success');
              setIsLoading(false);
              setError(`Tokens received successfully, but UserInfo call failed: ${error.message}`);
            });
          } else {
            setCurrentStep(5);
            setDemoStatus('success');
            setIsLoading(false);
          }
        } else {
          setError('No access token available for API call');
          setIsLoading(false);
        }
        break;

      default:
        break;
    }
  };

  const resetDemo = () => {
    setDemoStatus('idle');
    setCurrentStep(0);
    setAuthUrl('');
    setAuthCode('');
    setTokensReceived(null);
    setError('');
  };

  return (
    <Container>
      <Header>
        <h1>
          <FiKey />
          Authorization Code Flow
        </h1>
        <p>
          The most secure and widely used OAuth 2.0 flow for web applications.
          Perfect for server-side applications that can securely store client secrets.
        </p>
      </Header>

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
          <DemoControls>
            <StatusIndicator className={demoStatus}>
              {demoStatus === 'idle' && 'Ready to start'}
              {demoStatus === 'loading' && 'Executing authorization code flow...'}
              {demoStatus === 'success' && 'Flow completed successfully'}
              {demoStatus === 'error' && 'Flow failed'}
            </StatusIndicator>
            <DemoButton
              className="primary"
              onClick={startAuthFlow}
              disabled={demoStatus === 'loading' || isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner size={16} />
                  Running Flow...
                </>
              ) : (
                <>
                  <FiPlay />
                  Start Authorization Code Flow
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
            {steps.map((step, index) => (
              <Step
                key={index}
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
                  <div style={{ marginTop: '1rem' }}>
                    <strong>URL:</strong>
                    <div style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.375rem',
                      padding: '0.5rem',
                      fontSize: '0.875rem',
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                      whiteSpace: 'pre-wrap',
                      overflow: 'visible',
                      textOverflow: 'clip',
                      marginTop: '0.5rem',
                      maxWidth: 'none',
                      width: '100%'
                    }}>
                      <strong>URL:</strong><br />
                      <ColorCodedURL url={step.url} />
                    </div>
                  </div>
                  <CodeBlock style={{ marginTop: '1rem' }}>
                    {step.code}
                  </CodeBlock>
                  {currentStep === index && waitingForUser && index < 4 && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <button
                        onClick={() => executeStep(index)}
                        style={{
                          padding: '0.75rem 1.5rem',
                          backgroundColor: '#059669',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <FiPlay size={16} />
                        Continue to Next Step
                      </button>
                    </div>
                  )}
                </StepContent>
              </Step>
            ))}
          </StepsContainer>
        </CardBody>
      </DemoSection>
    </Container>
  );
};

export default AuthorizationCodeFlow;
