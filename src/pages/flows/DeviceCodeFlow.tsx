import { useState } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { FiPlay, FiAlertCircle, FiMonitor, FiSmartphone } from 'react-icons/fi';
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

const UseCaseHighlight = styled.div`
  background-color: ${({ theme }) => theme.colors.info}10;
  border: 1px solid ${({ theme }) => theme.colors.info}30;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  svg {
    color: ${({ theme }) => theme.colors.info};
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  h3 {
    color: ${({ theme }) => theme.colors.info};
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.info};
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

const DeviceCodeDisplay = styled.div`
  background-color: ${({ theme }) => theme.colors.warning}10;
  border: 1px solid ${({ theme }) => theme.colors.warning}30;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;

  h4 {
    margin: 0 0 0.5rem 0;
    color: ${({ theme }) => theme.colors.warning};
    font-size: 1rem;
    font-weight: 600;
  }

  .device-codes {
    font-family: monospace;
    font-size: 1.2rem;
    font-weight: bold;
    color: ${({ theme }) => theme.colors.warning};
    text-align: center;
    padding: 1rem;
    background-color: white;
    border-radius: 0.25rem;
    margin-bottom: 0.5rem;
  }

  .verification-url {
    font-family: monospace;
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.gray700};
    word-break: break-all;
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

type DeviceCodeData = {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
};

type Tokens = {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
};

const DeviceFlow = () => {
  const { config } = useOAuth() as any;
  const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [tokensReceived, setTokensReceived] = useState<Tokens | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deviceCodeData, setDeviceCodeData] = useState<DeviceCodeData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pollingInterval, setPollingInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  const startDeviceCodeFlow = async () => {
    setDemoStatus('loading');
    setIsLoading(true);
    setCurrentStep(0);
    setError(null);
    setTokensReceived(null);
    setDeviceCodeData(null);

    try {
      setCurrentStep(1);

      // Simulate device authorization request (correct endpoint includes environment ID)
      // Example:
      // POST https://auth.pingone.com/{envId}/as/device_authorization
      // Content-Type: application/x-www-form-urlencoded
      // client_id=...&scope=openid profile email

      setCurrentStep(2);

      // Simulate receiving device codes
      setTimeout(() => {
        const mockDeviceCodes = {
          device_code: 'GmRhmhcxhwAzkoEqiMEg_DnyE-oqGpZC9yIwBhLJrRgI',
          user_code: 'WDJB-MJHT',
          verification_uri: 'https://pingone.com/device',
          verification_uri_complete: 'https://pingone.com/device?user_code=WDJB-MJHT',
          expires_in: 1800,
          interval: 5
        };

        setDeviceCodeData(mockDeviceCodes);
        setCurrentStep(3);

        // Simulate polling for tokens
        setCurrentStep(4);
        let pollCount = 0;
        const pollInterval = setInterval(() => {
          pollCount++;

          if (pollCount >= 3) { // Simulate user completing authentication after 3 polls
            clearInterval(pollInterval);
            setPollingInterval(null);

            setCurrentStep(5);
            // Simulate receiving tokens
            const mockTokens = {
              access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.device_flow_token_signature',
              id_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.device_flow_id_token_signature',
              token_type: 'Bearer',
              expires_in: 3600,
              scope: 'openid profile email'
            };

            setTokensReceived(mockTokens);
            setCurrentStep(6);
            setDemoStatus('success');
          }
        }, 3000);

        setPollingInterval(pollInterval);
      }, 2000);

    } catch (err) {
      console.error('Device code flow failed:', err);
      setError('Failed to execute device code flow. Please check your configuration.');
      setDemoStatus('error');
      setIsLoading(false);
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
  };

  const resetDemo = () => {
    setDemoStatus('idle');
    setCurrentStep(0);
    setTokensReceived(null);
    setError(null);
    setDeviceCodeData(null);
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  const steps = [
    {
      title: 'Device Initiates Flow',
      description: 'Device requests device and user codes from authorization server',
      code: `// POST to device authorization endpoint
POST https://auth.pingone.com/${config?.environmentId || 'YOUR_ENV_ID'}/as/device_authorization
Content-Type: application/x-www-form-urlencoded

client_id=${config?.clientId || 'your_client_id'}&scope=openid profile email

// Device sends minimal information:
// - client_id: identifies the device/app
// - scope: requested permissions`
    },
    {
      title: 'Server Generates Device & User Codes',
      description: 'Authorization server creates unique codes for device and user authentication',
      code: `// Server generates and stores device codes
const deviceCode = generateSecureRandomString();
const userCode = generateUserFriendlyCode(); // e.g., "WDJB-MJHT"

// Server response:
{
  "device_code": "${deviceCodeData?.device_code || 'GmRhmhcxhwAzkoEqiMEg_DnyE-oqGpZC9yIwBhLJrRgI'}",
  "user_code": "${deviceCodeData?.user_code || 'WDJB-MJHT'}",
  "verification_uri": "https://pingone.com/device",
  "verification_uri_complete": "https://pingone.com/device?user_code=${deviceCodeData?.user_code || 'WDJB-MJHT'}",
  "expires_in": 1800,
  "interval": 5
}`
    },
    {
      title: 'Device Displays User Code',
      description: 'Device shows user-friendly code and verification URL',
      code: `// Device displays to user:
console.log('Go to: ${deviceCodeData?.verification_uri || 'https://pingone.com/device'}');
console.log('Enter code: ${deviceCodeData?.user_code || 'WDJB-MJHT'}');

// Device can show:
// - Verification URL
// - User code (formatted nicely)
// - QR code (optional)
// - Instructions for user`
    },
    {
      title: 'Device Polls for Authorization',
      description: 'Device repeatedly polls token endpoint until user completes authentication',
      code: `// Device polls token endpoint
POST https://auth.pingone.com/${config?.environmentId || 'YOUR_ENV_ID'}/as/token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:device_code
&device_code=${deviceCodeData?.device_code || 'GmRhmhcxhwAzkoEqiMEg_DnyE-oqGpZC9yIwBhLJrRgI'}
&client_id=${config?.clientId || 'your_client_id'}

// Poll every 5 seconds (interval from device authorization)
// Continue polling until:
// - User completes authentication
// - Device code expires
// - Error occurs`
    },
    {
      title: 'User Authenticates on Separate Device',
      description: 'User visits verification URL and enters the code on a different device',
      code: `// User workflow:
// 1. Visit verification_uri
// 2. Enter user_code
// 3. Authenticate with PingOne
// 4. Grant consent for requested scopes
// 5. Complete authentication

// Server associates user_code with device_code
// Marks device as authorized for token issuance`
    },
    {
      title: 'Device Receives Tokens',
      description: 'Once user completes authentication, device receives access tokens',
      code: `// Server returns tokens to device
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile email"
}

// Device can now:
// - Store tokens securely
// - Make authenticated API calls
// - Access protected resources`
    }
  ];

  return (
    <Container>
      <Header>
        <h1>
          <FiMonitor />
          Device Code Flow
        </h1>
        <p>
          Learn how the Device Code flow works for devices with limited input capabilities
          with real API calls to PingOne.
        </p>
      </Header>

      <FlowOverview>
        <CardHeader>
          <h2>Flow Overview</h2>
        </CardHeader>
        <CardBody>
          <FlowDescription>
            <h2>What is Device Code Flow?</h2>
            <p>
              The Device Code flow is designed for devices that have limited input capabilities
              (like smart TVs, gaming consoles, or IoT devices). Instead of entering credentials
              directly on the device, users authenticate on a separate device (like a smartphone
              or computer) using a user-friendly code.
            </p>
            <p>
              <strong>How it works:</strong> The device requests codes from the authorization server,
              displays a user-friendly code to the user, who then authenticates on a different device
              using that code. The device polls for tokens until authentication is complete.
            </p>
          </FlowDescription>

          <UseCaseHighlight>
            <FiSmartphone size={20} />
            <div>
              <h3>Perfect For</h3>
              <p>
                Smart TVs, gaming consoles, IoT devices, printers, and any device
                without a proper keyboard or secure input method.
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
              {demoStatus === 'loading' && 'Executing device code flow...'}
              {demoStatus === 'success' && 'Flow completed successfully'}
              {demoStatus === 'error' && 'Flow failed'}
            </StatusIndicator>
            <DemoButton
              className="primary"
              onClick={startDeviceCodeFlow}
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
                  Start Device Code Flow
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

          {deviceCodeData && (
            <DeviceCodeDisplay>
              <h4>Device Codes Generated:</h4>
              <div className="device-codes">
                {deviceCodeData.user_code}
              </div>
              <div className="verification-url">
                Visit: {deviceCodeData.verification_uri}<br />
                Complete URL: {deviceCodeData.verification_uri_complete}
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
                Device Code: {deviceCodeData.device_code}<br />
                Expires in: {deviceCodeData.expires_in} seconds<br />
                Poll interval: {deviceCodeData.interval} seconds
              </div>
            </DeviceCodeDisplay>
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
                  <CodeBlock>{step.code}</CodeBlock>
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

export default DeviceFlow;
