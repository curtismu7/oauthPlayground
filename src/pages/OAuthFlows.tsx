import { useState } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../components/Card';
import { FiPlay, FiLock, FiUser, FiClock, FiShield } from 'react-icons/fi';
import { useOAuth } from '../contexts/OAuthContext';
import { OAuthFlow, OAuthFlowStep } from '../types/oauthFlows';

type DemoStatus = 'idle' | 'loading' | 'success' | 'error';

interface FlowCardProps {
  flow: OAuthFlow;
  isSelected: boolean;
  onSelect: (flow: OAuthFlow) => void;
}

interface DemoStepComponentProps {
  step: OAuthFlowStep;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
}

interface SecurityBadgeComponentProps {
  level: 'high' | 'medium' | 'low';
  children: React.ReactNode;
}


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

const StyledFlowCard = styled(Card)<{ $isSelected: boolean }>`
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid ${({ $isSelected, theme }) => 
    $isSelected ? theme.colors.primary : 'transparent'};
  background-color: ${({ $isSelected, theme }) => 
    $isSelected ? `${theme.colors.primary}05` : 'transparent'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const FlowIcon = styled.div<{ $bgColor: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  background-color: ${({ $bgColor }) => $bgColor};
  color: white;
  font-size: 1.5rem;
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
  margin-bottom: 1rem;
  font-size: 0.9375rem;
  line-height: 1.5;
`;

const SecurityBadge = styled.span<{ $level: 'high' | 'medium' | 'low' }>`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  background-color: ${({ $level, theme }) => {
    switch ($level) {
      case 'high': return theme.colors.green100;
      case 'medium': return theme.colors.yellow100;
      case 'low': return theme.colors.red100;
      default: return theme.colors.gray100;
    }
  }};
  
  color: ${({ $level, theme }) => {
    switch ($level) {
      case 'high': return theme.colors.green800;
      case 'medium': return theme.colors.yellow800;
      case 'low': return theme.colors.red800;
      default: return theme.colors.gray800;
    }
  }};
`;

const DemoContainer = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  border-radius: 0.5rem;
  background-color: ${({ theme }) => theme.colors.gray50};
`;

const DemoHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const DemoTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray900};
  margin: 0;
`;

const DemoSteps = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const DemoStep = styled.div<{ $active: boolean; $completed: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-radius: 0.375rem;
  background-color: ${({ $active, $completed, theme }) => {
    if ($completed) return `${theme.colors.green50}`;
    if ($active) return `${theme.colors.blue50}`;
    return theme.colors.white;
  }};
  border: 1px solid ${({ $active, $completed, theme }) => {
    if ($completed) return theme.colors.green200;
    if ($active) return theme.colors.blue200;
    return theme.colors.gray200;
  }};
  transition: all 0.2s ease;
`;

const StepNumber = styled.div<{ $active: boolean; $completed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
  
  background-color: ${({ $active, $completed, theme }) => {
    if ($completed) return theme.colors.green500;
    if ($active) return theme.colors.blue500;
    return theme.colors.gray200;
  }};
  
  color: ${({ $active, $completed, theme }) => {
    if ($completed || $active) return theme.colors.white;
    return theme.colors.gray600;
  }};
`;

const StepContent = styled.div`
  flex: 1;
`;

const StepTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: ${({ theme }) => theme.colors.gray900};
`;

const StepDescription = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray600};
  margin: 0 0 0.5rem 0;
  line-height: 1.5;
`;

const CodeBlock = styled.pre`
  margin: 0.5rem 0 0 0;
  padding: 0.75rem;
  background-color: ${({ theme }) => theme.colors.gray100};
  border-radius: 0.25rem;
  overflow-x: auto;
  font-family: ${({ theme }) => theme.fonts.monospace};
  font-size: 0.8125rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.gray800};
  white-space: pre-wrap;
  word-break: break-all;
`;

// Component implementations
const SecurityBadgeComponent: React.FC<SecurityBadgeComponentProps> = ({ level, children }) => (
  <SecurityBadge $level={level}>{children}</SecurityBadge>
);

const DemoStepComponent: React.FC<DemoStepComponentProps> = ({ step, index, isActive, isCompleted }) => (
  <DemoStep $active={isActive} $completed={isCompleted}>
    <StepNumber $active={isActive} $completed={isCompleted}>
      {isCompleted ? '✓' : index + 1}
    </StepNumber>
    <StepContent>
      <StepTitle>{step.title}</StepTitle>
      {step.description && <StepDescription>{step.description}</StepDescription>}
      {step.code && <CodeBlock>{step.code}</CodeBlock>}
    </StepContent>
  </DemoStep>
);

const FlowCardComponent: React.FC<FlowCardProps> = ({ flow, isSelected, onSelect }) => {
  const getFlowIcon = () => {
    switch (flow.id) {
      case 'auth-code':
        return <FiLock />;
      case 'implicit':
        return <FiUser />;
      case 'client-credentials':
        return <FiShield />;
      case 'device-code':
        return <FiClock />;
      default:
        return <FiPlay />;
    }
  };

  const getFlowColor = () => {
    switch (flow.id) {
      case 'auth-code':
        return '#3B82F6'; // blue-500
      case 'implicit':
        return '#8B5CF6'; // purple-500
      case 'client-credentials':
        return '#10B981'; // emerald-500
      case 'device-code':
        return '#F59E0B'; // amber-500
      default:
        return '#6B7280'; // gray-500
    }
  };

  return (
    <StyledFlowCard 
      key={flow.id} 
      $isSelected={isSelected}
      onClick={() => onSelect(flow)}
    >
      <CardHeader>
        <FlowIcon $bgColor={getFlowColor()}>
          {getFlowIcon()}
        </FlowIcon>
        <FlowTitle>{flow.title}</FlowTitle>
      </CardHeader>
      <CardBody>
        <FlowDescription>{flow.description}</FlowDescription>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <SecurityBadgeComponent level={flow.security}>
            {flow.security} security
          </SecurityBadgeComponent>
          {flow.useCases?.map((useCase, idx) => (
            <SecurityBadgeComponent key={idx} level="medium">
              {useCase}
            </SecurityBadgeComponent>
          ))}
        </div>
      </CardBody>
    </StyledFlowCard>
  );
};


  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const DemoTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray900};
  margin: 0;
`;

const DemoSteps = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const DemoStep = styled.div<{ $active: boolean; $completed: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-radius: 6px;
  background-color: ${({ $active, $completed, theme }) => {
    if ($completed) return `${theme.colors.green50}`;
    if ($active) return `${theme.colors.blue50}`;
    return theme.colors.white;
  }};
  border: 1px solid ${({ $active, $completed, theme }) => {
    if ($completed) return theme.colors.green200;
    if ($active) return theme.colors.blue200;
    return theme.colors.gray200;
  }};
  transition: all 0.2s ease;
`;

const StepNumber = styled.div<{ $active: boolean; $completed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
  
  background-color: ${({ $active, $completed, theme }) => {
    if ($completed) return theme.colors.green500;
    if ($active) return theme.colors.blue500;
    return theme.colors.gray200;
  }};
  
  color: ${({ $active, $completed, theme }) => {
    if ($completed || $active) return theme.colors.white;
    return theme.colors.gray600;
  }};
`;

const StepContent = styled.div`
  flex: 1;
`;

const StepTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: ${({ theme }) => theme.colors.gray900};
`;

const StepDescription = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray600};
  margin: 0 0 0.5rem 0;
  line-height: 1.5;
`;

const CodeBlock = styled.pre`
  margin: 0.5rem 0 0 0;
  padding: 0.75rem;
  background-color: ${({ theme }) => theme.colors.gray100};
  border-radius: 4px;
  overflow-x: auto;
  font-family: ${({ theme }) => theme.fonts.monospace};
  font-size: 0.8125rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.gray800};
`;

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

interface DemoStepProps {
  $active: boolean;
  $completed: boolean;
}

const DemoStep = styled.div<DemoStepProps>`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
  background-color: ${({ $active, $completed, theme }) => {
    if ($completed) return 'rgba(34, 197, 94, 0.1)';
    if ($active) return 'rgba(59, 130, 246, 0.1)';
    return 'transparent';
  }};
  border: 2px solid ${({ $active, $completed, theme }) => {
    if ($completed) return theme.colors.success;
    if ($active) return theme.colors.primary;
    return 'transparent';
  };
`;

const StepNumber = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
  
  ${({ active, completed }) => {
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

const flows = [
  {
    id: 'authorization-code',
    title: 'Authorization Code Flow',
    icon: <FiCode />,
    description: 'The most common OAuth 2.0 flow for web applications with a server-side component.',
    security: 'high',
    useCases: ['Web apps with backend', 'Mobile apps with backend', 'SPAs with backend'],
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
    useCases: ['Mobile apps', 'SPAs', 'Native apps'],
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
  &code_challenge=${codeChallenge}
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
  "code_verifier": "${codeVerifier}",
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
    useCases: ['Legacy SPAs', 'Client-side only apps'],
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
    useCases: ['Server-to-server', 'Background processes', 'API services'],
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
Authorization: Basic ${credentials}
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
    useCases: ['Smart TVs', 'IoT devices', 'Gaming consoles'],
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
&device_code=${device_code}
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
  }
];

const OAuthFlows = () => {
  const { startOAuthFlow, isAuthenticated, tokens, config } = useOAuth();
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [demoStatus, setDemoStatus] = useState('idle');
  const [currentStep, setCurrentStep] = useState(0);

  const handleFlowSelect = (flow) => {
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
      const success = await startOAuthFlow(selectedFlow.id);
      if (success) {
        setDemoStatus('success');
        // Simulate progress through steps
        const interval = setInterval(() => {
          setCurrentStep(prev => {
            if (prev < selectedFlow.steps.length - 1) {
              return prev + 1;
            } else {
              clearInterval(interval);
              return prev;
            }
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Demo failed:', error);
      setDemoStatus('error');
    }
  };

  const getSecurityBadgeColor = (security) => {
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
      </PageHeader>

      <FlowsGrid>
        {flows.map((flow) => (
          <FlowCard
            key={flow.id}
            className={selectedFlow?.id === flow.id ? 'active' : ''}
            onClick={() => handleFlowSelect(flow)}
          >
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
                {selectedFlow.useCases.map((useCase, index) => (
                  <li key={index}>{useCase}</li>
                ))}
              </ul>
            </div>

            <DemoSteps>
              <h3>Flow Steps</h3>
              {selectedFlow.steps.map((step, index) => (
                <DemoStep
                  key={index}
                  active={currentStep === index && demoStatus === 'loading'}
                  completed={currentStep > index}
                >
                  <StepNumber
                    active={currentStep === index && demoStatus === 'loading'}
                    completed={currentStep > index}
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
