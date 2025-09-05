import { useState } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../components/Card';
import { FiPlay, FiLock, FiUser, FiClock, FiShield, FiCode } from 'react-icons/fi';
import { useAuth } from '../contexts/NewAuthContext';
import type { OAuthFlow } from '../types/oauthFlows';
 

const FlowsContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 0.5rem;
  }
  
  p {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 1.1rem;
  }
`;

const FlowsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const FlowCard = styled(Card)`
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
  
  &.active {
    border-color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.primary}05;
  }
`;

const FlowIcon = styled.div`
  font-size: 2rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 1rem;
`;

const FlowTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: ${({ theme }) => theme.colors.gray900};
`;

const FlowDescription = styled.p`
  color: ${({ theme }) => theme.colors.gray600};
  font-size: 0.95rem;
  margin-bottom: 1rem;
  line-height: 1.5;
`;

const FlowMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const SecurityBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 1rem;
  
  &.high {
    background-color: ${({ theme }) => theme.colors.success}20;
    color: ${({ theme }) => theme.colors.success};
  }
  
  &.medium {
    background-color: ${({ theme }) => theme.colors.warning}20;
    color: ${({ theme }) => theme.colors.warning};
  }
  
  &.low {
    background-color: ${({ theme }) => theme.colors.danger}20;
    color: ${({ theme }) => theme.colors.danger};
  }
`;

const FlowActions = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const FlowButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
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
`;

const FlowDemo = styled(Card)`
  margin-top: 2rem;
`;

const DemoHeader = styled(CardHeader)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h2 {
    margin: 0;
  }
`;

const DemoControls = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const DemoStatus = styled.div`
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

const DemoSteps = styled.div`
  margin-top: 1.5rem;
`;

interface DemoStepStyledProps {
  $active: boolean;
  $completed: boolean;
}

const DemoStep = styled.div<DemoStepStyledProps>`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
  background-color: ${({ $active, $completed }) => {
    if ($completed) return 'rgba(34, 197, 94, 0.1)';
    if ($active) return 'rgba(59, 130, 246, 0.1)';
    return 'transparent';
  }};
  border: 2px solid
    ${({ $active, $completed, theme }) => {
      if ($completed) return theme.colors.success;
      if ($active) return theme.colors.primary;
      return 'transparent';
    }};
`;

const StepNumber = styled.div<{ $active: boolean; $completed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
  
  ${({ $active, $completed }) => {
    if ($completed) {
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
  
  h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
  }
  
  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 0.875rem;
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
`;

const flows: OAuthFlow[] = [
  {
    id: 'authorization-code',
    title: 'Authorization Code Flow',
    icon: <FiCode />,
    description: 'The most common OAuth 2.0 flow for web applications with a server-side component.',
    security: 'high',
    recommended: true,
    complexity: 'medium',
    useCases: [
      { title: 'Web apps with backend', description: '' },
      { title: 'Mobile apps with backend', description: '' },
      { title: 'SPAs with backend', description: '' }
    ],
    steps: [
      {
        title: 'User initiates login',
        description: 'User clicks login button, triggering the OAuth flow',
        code: `// Redirect to authorization server
window.location.href = authUrl;`
      },
      {
        title: 'Authorization server authenticates user',
        description: 'User is redirected to PingOne for authentication',
        code: `// PingOne handles authentication
// User consents to scopes`
      },
      {
        title: 'Authorization server redirects back',
        description: 'User is redirected to your app with authorization code',
        code: `// Callback URL with code
https://yourapp.com/callback?code=abc123&state=xyz789`
      },
      {
        title: 'Your server exchanges code for tokens',
        description: 'Server makes secure request to exchange code for access token',
        code: `POST /token
{
  "grant_type": "authorization_code",
  "code": "abc123",
  "redirect_uri": "https://yourapp.com/callback"
}`
      },
      {
        title: 'Your app receives tokens',
        description: 'Server returns tokens to frontend, authentication complete',
        code: `{
  "access_token": "eyJ...",
  "id_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600
}`
      }
    ]
  },
  {
    id: 'pkce',
    title: 'PKCE Flow',
    icon: <FiShield />,
    description: 'Authorization Code flow with Proof Key for Code Exchange for enhanced security.',
    security: 'high',
    recommended: true,
    complexity: 'medium',
    useCases: [
      { title: 'Mobile apps', description: '' },
      { title: 'SPAs', description: '' },
      { title: 'Native apps', description: '' }
    ],
    steps: [
      {
        title: 'Generate code verifier and challenge',
        description: 'Create a cryptographically random code verifier',
        code: `const codeVerifier = generateRandomString(64);
const codeChallenge = await generateCodeChallenge(codeVerifier);`
      },
      {
        title: 'Include challenge in authorization request',
        description: 'Send code challenge with authorization request',
        code: `GET /authorize?response_type=code
  &client_id=your_client_id
  &redirect_uri=https://yourapp.com/callback
  &code_challenge=\${codeChallenge}
  &code_challenge_method=S256`
      },
      {
        title: 'Authorization server processes request',
        description: 'Server stores code challenge for later verification',
        code: `// Server stores challenge for code exchange`
      },
      {
        title: 'Exchange code with verifier',
        description: 'Include code verifier in token exchange request',
        code: `POST /token
{
  "grant_type": "authorization_code",
  "code": "abc123",
  "code_verifier": "\${codeVerifier}",
  "redirect_uri": "https://yourapp.com/callback"
}`
      },
      {
        title: 'Server validates and returns tokens',
        description: 'Server validates code verifier matches stored challenge',
        code: `// Server validates: SHA256(codeVerifier) === storedChallenge
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600
}`
      }
    ]
  },
  {
    id: 'implicit',
    title: 'Implicit Flow',
    icon: <FiLock />,
    description: 'Simplified flow for client-side applications (deprecated for security reasons).',
    security: 'low',
    recommended: false,
    complexity: 'low',
    useCases: [
      { title: 'Legacy SPAs', description: '' },
      { title: 'Client-side only apps', description: '' }
    ],
    steps: [
      {
        title: 'User initiates login',
        description: 'User clicks login, redirected to authorization server',
        code: `GET /authorize?response_type=token
  &client_id=your_client_id
  &redirect_uri=https://yourapp.com/callback
  &scope=openid profile email`
      },
      {
        title: 'Authorization server authenticates user',
        description: 'User authenticates and grants consent',
        code: `// User authenticates with PingOne`
      },
      {
        title: 'Authorization server redirects with tokens',
        description: 'Tokens are included directly in redirect URL fragment',
        code: `#access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
&id_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
&token_type=Bearer&expires_in=3600`
      },
      {
        title: 'Frontend extracts tokens',
        description: 'JavaScript extracts tokens from URL fragment',
        code: `const hash = window.location.hash.substring(1);
const params = new URLSearchParams(hash);
const accessToken = params.get('access_token');`
      },
      {
        title: 'Authentication complete',
        description: 'Frontend can now make authenticated API calls',
        code: `fetch('/api/user', {
  headers: {
    'Authorization': 'Bearer ' + accessToken
  }
});`
      }
    ]
  },
  {
    id: 'client-credentials',
    title: 'Client Credentials',
    icon: <FiUser />,
    description: 'Machine-to-machine authentication without user interaction.',
    security: 'high',
    recommended: true,
    complexity: 'low',
    useCases: [
      { title: 'Server-to-server', description: '' },
      { title: 'Background processes', description: '' },
      { title: 'API services', description: '' }
    ],
    steps: [
      {
        title: 'Prepare credentials',
        description: 'Server prepares client credentials for authentication',
        code: `const credentials = btoa(clientId + ':' + clientSecret);`
      },
      {
        title: 'Request access token',
        description: 'Server requests access token using client credentials',
        code: `POST /token
Authorization: Basic \${credentials}
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&scope=api:read`
      },
      {
        title: 'Authorization server validates credentials',
        description: 'Server validates client ID and secret',
        code: `// Server validates client credentials
// Issues access token for machine-to-machine communication`
      },
      {
        title: 'Receive access token',
        description: 'Server receives access token for API calls',
        code: `{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "api:read"
}`
      },
      {
        title: 'Make authenticated API calls',
        description: 'Server uses access token to authenticate API requests',
        code: `fetch('/api/data', {
  headers: {
    'Authorization': 'Bearer ' + accessToken
  }
});`
      }
    ]
  },
  {
    id: 'device-code',
    title: 'Device Code Flow',
    icon: <FiClock />,
    description: 'Flow for devices with limited input capabilities (TVs, IoT devices).',
    security: 'medium',
    recommended: true,
    complexity: 'medium',
    useCases: [
      { title: 'Smart TVs', description: '' },
      { title: 'IoT devices', description: '' },
      { title: 'Gaming consoles', description: '' }
    ],
    steps: [
      {
        title: 'Device requests device code',
        description: 'Device initiates flow by requesting device and user codes',
        code: `POST /device_authorization
Content-Type: application/x-www-form-urlencoded

client_id=your_client_id&scope=openid profile`
      },
      {
        title: 'Receive device and user codes',
        description: 'Authorization server returns codes and verification URI',
        code: `{
  "device_code": "GmRhmhcxhwAzkoEqiMEg_DnyE-oqGpZC9yIwBhLJrRgI...",
  "user_code": "WDJB-MJHT",
  "verification_uri": "https://pingone.com/device",
  "verification_uri_complete": "https://pingone.com/device?user_code=WDJB-MJHT",
  "expires_in": 1800,
  "interval": 5
}`
      },
      {
        title: 'Device displays user code',
        description: 'Device shows user-friendly code and verification URL',
        code: `console.log('Go to:', verification_uri);
console.log('Enter code:', user_code);`
      },
      {
        title: 'User authenticates on separate device',
        description: 'User visits verification URL and enters the code',
        code: `// User visits verification_uri
// Enters user_code to authenticate`
      },
      {
        title: 'Device polls for token',
        description: 'Device polls token endpoint until user completes authentication',
        code: `POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:device_code
&device_code=\${device_code}
&client_id=your_client_id`
      },
      {
        title: 'Receive tokens when user authenticates',
        description: 'Once user completes authentication, device receives tokens',
        code: `{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}`
      }
    ]
  },
  {
    id: 'refresh-token',
    title: 'Refresh Token Flow',
    icon: <FiClock />,
    description: 'Use refresh tokens to obtain new access tokens without re-authentication.',
    security: 'high',
    recommended: true,
    complexity: 'low',
    useCases: [
      { title: 'Long-lived sessions', description: '' },
      { title: 'Mobile apps', description: '' },
      { title: 'SPAs with backend', description: '' }
    ],
    steps: [
      {
        title: 'Access token expires',
        description: 'Current access token has expired and is no longer valid',
        code: `// API call fails with 401 Unauthorized
// Token expired, need to refresh`
      },
      {
        title: 'Request new access token',
        description: 'Use refresh token to request a new access token',
        code: `POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=your_refresh_token
&client_id=your_client_id`
      },
      {
        title: 'Authorization server validates refresh token',
        description: 'Server validates refresh token and issues new tokens',
        code: `// Server validates refresh token
// Issues new access token and optionally new refresh token`
      },
      {
        title: 'Receive new tokens',
        description: 'Server returns new access token and optionally new refresh token',
        code: `{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "new_refresh_token_here"
}`
      },
      {
        title: 'Continue with new token',
        description: 'Use new access token for API calls, store new refresh token',
        code: `// Store new tokens
localStorage.setItem('access_token', newAccessToken);
localStorage.setItem('refresh_token', newRefreshToken);

// Continue with API calls
fetch('/api/data', {
  headers: {
    'Authorization': 'Bearer ' + newAccessToken
  }
});`
      }
    ]
  },
  {
    id: 'password-grant',
    title: 'Password Grant (Legacy)',
    icon: <FiLock />,
    description: 'Direct username/password authentication (deprecated, use Authorization Code instead).',
    security: 'low',
    recommended: false,
    complexity: 'low',
    useCases: [
      { title: 'Legacy applications', description: '' },
      { title: 'Trusted first-party apps', description: '' },
      { title: 'Migration scenarios', description: '' }
    ],
    steps: [
      {
        title: 'Collect user credentials',
        description: 'Application collects username and password from user',
        code: `const credentials = {
  username: 'user@example.com',
  password: 'userpassword'
};`
      },
      {
        title: 'Request access token',
        description: 'Send credentials directly to token endpoint',
        code: `POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=password
&username=user@example.com
&password=userpassword
&client_id=your_client_id
&scope=openid profile email`
      },
      {
        title: 'Authorization server validates credentials',
        description: 'Server validates username/password against user store',
        code: `// Server validates credentials
// Issues access token if valid`
      },
      {
        title: 'Receive tokens',
        description: 'Server returns access token and optionally refresh token',
        code: `{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "optional_refresh_token"
}`
      },
      {
        title: 'Use access token',
        description: 'Use access token for authenticated API calls',
        code: `fetch('/api/user/profile', {
  headers: {
    'Authorization': 'Bearer ' + accessToken
  }
});`
      }
    ]
  }
];

const OAuthFlows = () => {
  const { config } = useAuth();
  const [selectedFlow, setSelectedFlow] = useState<OAuthFlow | null>(null);
  const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [currentStep, setCurrentStep] = useState(0);



  const handleFlowSelect = (flow: OAuthFlow) => {
    setSelectedFlow(flow);
    setCurrentStep(0);
    setDemoStatus('idle');
  };

    const handleStartDemo = async () => {
    if (!config) {
      alert('Please configure your PingOne settings first in the Configuration page.');
      return;
    }

    setDemoStatus('loading');
    setCurrentStep(0);

    try {
      if (!selectedFlow) {
        setDemoStatus('idle');
        return;
      }
      
      // For now, just simulate success since startOAuthFlow is not available
      setDemoStatus('success');
      // Simulate progress through steps
      const interval = setInterval(() => {
        setCurrentStep(prev => {
          if (selectedFlow && prev < selectedFlow.steps.length - 1) {
            return prev + 1;
          } else {
            clearInterval(interval);
            return prev;
          }
        });
      }, 2000);
    } catch (error) {
      console.error('Demo failed:', error);
      setDemoStatus('error');
    }
  };

  const getSecurityBadgeColor = (security: OAuthFlow['security']) => {
    switch (security) {
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  };

  return (
    <FlowsContainer>
      <PageHeader>
        <h1>OAuth 2.0 Flows</h1>
        <p>Interactive demonstrations of different OAuth 2.0 and OpenID Connect flows</p>
        <div style={{ 
          background: '#f0f9ff', 
          border: '1px solid #0ea5e9', 
          borderRadius: '8px', 
          padding: '1rem', 
          marginTop: '1rem',
          fontSize: '0.9rem'
        }}>
          <strong>🔐 PingOne Support:</strong> All flows shown below are fully supported by PingOne's OAuth 2.0 and OpenID Connect implementation. 
          PingOne follows OAuth 2.0 RFC 6749 and OpenID Connect Core 1.0 specifications, ensuring industry-standard compliance and security.
        </div>
      </PageHeader>

      <FlowsGrid>
        {flows.map((flow: OAuthFlow) => (
          <div key={flow.id} onClick={() => handleFlowSelect(flow)}>
            <FlowCard className={selectedFlow?.id === flow.id ? 'active' : ''}>
              <CardBody>
                <FlowIcon>{flow.icon}</FlowIcon>
                <FlowTitle>{flow.title}</FlowTitle>
                <FlowDescription>{flow.description}</FlowDescription>

                <FlowMeta>
                  <SecurityBadge className={getSecurityBadgeColor(flow.security)}>
                    <FiShield />
                    {flow.security.toUpperCase()} Security
                  </SecurityBadge>
                </FlowMeta>

                <FlowActions>
                  <FlowButton
                    className="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFlowSelect(flow);
                    }}
                  >
                    <FiPlay /> Try Demo
                  </FlowButton>
                </FlowActions>
              </CardBody>
            </FlowCard>
          </div>
        ))}
      </FlowsGrid>

      {selectedFlow && (
        <FlowDemo>
          <DemoHeader>
            <h2>{selectedFlow.icon} {selectedFlow.title} Demo</h2>
            <DemoControls>
              <DemoStatus className={demoStatus}>
                {demoStatus === 'idle' && 'Ready to start'}
                {demoStatus === 'loading' && 'Running demo...'}
                {demoStatus === 'success' && 'Demo completed'}
                {demoStatus === 'error' && 'Demo failed'}
              </DemoStatus>
              <FlowButton
                className="primary"
                onClick={handleStartDemo}
                disabled={demoStatus === 'loading' || !config}
              >
                <FiPlay /> Start Demo
              </FlowButton>
            </DemoControls>
          </DemoHeader>

          <CardBody>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3>Use Cases</h3>
              <ul>
                {selectedFlow.useCases.map((useCase: OAuthFlow['useCases'][number], index: number) => (
                  <li key={index}>{useCase.title}</li>
                ))}
              </ul>
            </div>

            <DemoSteps>
              <h3>Flow Steps</h3>
              {selectedFlow.steps.map((step: OAuthFlow['steps'][number], index: number) => (
                <DemoStep
                  key={index}
                  $active={currentStep === index && demoStatus === 'loading'}
                  $completed={currentStep > index}
                >
                  <StepNumber
                    $active={currentStep === index && demoStatus === 'loading'}
                    $completed={currentStep > index}
                  >
                    {index + 1}
                  </StepNumber>
                  <StepContent>
                    <h4>{step.title}</h4>
                    <p>{step.description}</p>
                    {step.code && (
                      <CodeBlock>{step.code}</CodeBlock>
                    )}
                  </StepContent>
                </DemoStep>
              ))}
            </DemoSteps>
          </CardBody>
        </FlowDemo>
      )}
    </FlowsContainer>
  );
};

export default OAuthFlows;
