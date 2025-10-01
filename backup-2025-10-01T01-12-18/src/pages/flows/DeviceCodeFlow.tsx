import { useState } from 'react';
import { FiAlertCircle, FiMonitor, FiSmartphone } from 'react-icons/fi';
import styled from 'styled-components';
import { Card, CardBody, CardHeader } from '../../components/Card';
import ConfigurationButton from '../../components/ConfigurationButton';
import FlowCredentials from '../../components/FlowCredentials';
import FlowIntro from '../../components/flow/FlowIntro';
import PageTitle from '../../components/PageTitle';
import { type FlowStep, StepByStepFlow } from '../../components/StepByStepFlow';
import TokenDisplayComponent from '../../components/TokenDisplay';
import { useAuth } from '../../contexts/NewAuthContext';
import { showGlobalError, showGlobalSuccess } from '../../hooks/useNotifications';
import { usePageScroll } from '../../hooks/usePageScroll';
import { storeOAuthTokens } from '../../utils/tokenStorage';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const HeroSection = styled.section`
  margin-bottom: 2rem;
  padding: 2.5rem;
  border-radius: 16px;
  background: linear-gradient(135deg, #111827 0%, #1f2937 50%, #374151 100%);
  color: white;
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.22);
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

const _DemoControls = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const _DemoButton = styled.button`
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

const _StatusIndicator = styled.div`
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

const _CodeBlock = styled.pre`
  background-color: ${({ theme }) => theme.colors.gray900};
  color: ${({ theme }) => theme.colors.gray100};
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  font-size: 0.875rem;
  margin: 1rem 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  border: 1px solid ${({ theme }) => theme.colors.gray800};
  white-space: pre-wrap;
`;

const _TokenDisplay = styled.div`
  background-color: var(--color-surface, #000000);
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

const _ResponseBox = styled.div<{
	$backgroundColor?: string;
	$borderColor?: string;
}>`
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
	token_type: string;
	expires_in: number;
	scope: string;
};

const DeviceFlow = () => {
	// Centralized scroll management - ALL pages start at top
	usePageScroll({ pageName: 'Device Code Flow', force: true });

	const { config } = useAuth();
	const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
	const [currentStep, setCurrentStep] = useState<number>(0);
	const [tokensReceived, setTokensReceived] = useState<Tokens | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [deviceCodeData, setDeviceCodeData] = useState<DeviceCodeData | null>(null);
	const [_isLoading, _setIsLoading] = useState<boolean>(false);
	const [pollingInterval, setPollingInterval] = useState<ReturnType<typeof setInterval> | null>(
		null
	);

	// Track execution results for each step
	const [_stepResults, setStepResults] = useState<Record<number, unknown>>({});
	const [_executedSteps, setExecutedSteps] = useState<Set<number>>(new Set());
	const [stepsWithResults, setStepsWithResults] = useState<FlowStep[]>([]);

	const startDeviceCodeFlow = async () => {
		setDemoStatus('loading');
		setCurrentStep(0);
		setError(null);
		setTokensReceived(null);
		setDeviceCodeData(null);
		setStepResults({});
		setExecutedSteps(new Set());
		setStepsWithResults([]);
		setStepsWithResults([...steps]); // Initialize with copy of steps
		console.log(' [DeviceCodeFlow] Starting device code flow...');
	};

	const resetDemo = () => {
		setDemoStatus('idle');
		setCurrentStep(0);
		setTokensReceived(null);
		setError(null);
		setDeviceCodeData(null);
		setStepResults({});
		setExecutedSteps(new Set());
		if (pollingInterval) {
			clearInterval(pollingInterval);
			setPollingInterval(null);
		}
	};

	const handleStepResult = (stepIndex: number, result: unknown) => {
		setStepResults((prev) => ({ ...prev, [stepIndex]: result }));
		setStepsWithResults((prev) => {
			const newSteps = [...prev];
			if (newSteps[stepIndex]) {
				newSteps[stepIndex] = { ...newSteps[stepIndex], result };
			}
			return newSteps;
		});
	};

	const steps: FlowStep[] = [
		{
			title: 'Device Initiates Flow',
			description: 'Device requests device and user codes from authorization server',
			code: `// POST to device authorization endpoint
POST https://auth.pingone.com/${config?.environmentId || 'YOUR_ENV_ID'}/as/device_authorization
Content-Type: application/x-www-form-urlencoded

client_id=${config?.clientId || 'your_client_id'}&scope=read write

// Device sends minimal information:
// - client_id: identifies the device/app
// - scope: requested permissions`,
			execute: async () => {
				if (!config || !config.pingone) {
					setError('Configuration required. Please configure your PingOne settings first.');
					return;
				}

				// Simulate device authorization request
				const requestData = {
					method: 'POST',
					url: `${config.pingone.deviceAuthorizationEndpoint}?client_id=${config.pingone.clientId}&scope=read write`,
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
					body: `client_id=${config.pingone.clientId}&scope=read write`,
				};

				setStepResults((prev) => ({ ...prev, 0: { request: requestData } }));
				setExecutedSteps((prev) => new Set(prev).add(0));

				console.log(' [DeviceCodeFlow] Device authorization request prepared');
			},
		},
		{
			title: 'Server Generates Device & User Codes',
			description: 'Authorization server creates unique codes for device and user authentication',
			code: `// Server generates and stores device codes
const deviceCode = generateSecureRandomString();
const userCode = generateUserFriendlyCode(); // e.g., "WDJB-MJHT"

// Server response:
{
  "device_code": "GmRhmhcxhwAzkoEqiMEg_DnyE-oqGpZC9yIwBhLJrRgI",
  "user_code": "WDJB-MJHT",
  "verification_uri": "https://pingone.com/device",
  "verification_uri_complete": "https://pingone.com/device?user_code=WDJB-MJHT",
  "expires_in": 1800,
  "interval": 5
}`,
			execute: async () => {
				if (!config || !config.pingone) {
					setError('Configuration required. Please configure your PingOne settings first.');
					return;
				}

				try {
					// Make real device authorization request via backend proxy
					const backendUrl =
						process.env.NODE_ENV === 'production'
							? 'https://oauth-playground.vercel.app'
							: 'https://localhost:3001';

					const response = await fetch(`${backendUrl}/api/device-authorization`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Accept: 'application/json',
						},
						body: JSON.stringify({
							environment_id: config.pingone.environmentId,
							client_id: config.pingone.clientId,
							scope: 'read write',
						}),
					});

					if (!response.ok) {
						throw new Error(
							`Device authorization failed: ${response.status} ${response.statusText}`
						);
					}

					const deviceCodes = await response.json();
					setDeviceCodeData(deviceCodes);

					setStepResults((prev) => ({
						...prev,
						1: { response: deviceCodes, status: response.status },
					}));
					setExecutedSteps((prev) => new Set(prev).add(1));

					console.log(' [DeviceCodeFlow] Device codes received:', deviceCodes);
				} catch (error: unknown) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					setError(`Failed to get device codes: ${errorMessage}`);
					console.error(' [DeviceCodeFlow] Device code request error:', error);
				}
			},
		},
		{
			title: 'Device Displays User Code',
			description: 'Device shows user-friendly code and verification URL',
			code: `// Device displays to user:
console.log('Go to: https://pingone.com/device');
console.log('Enter code: WDJB-MJHT');

// Device can show:
// - Verification URL
// - User code (formatted nicely)
// - QR code (optional)
// - Instructions for user`,
			execute: () => {
				if (!deviceCodeData) {
					setError('Device codes not available. Please complete previous step first.');
					return;
				}

				setStepResults((prev) => ({
					...prev,
					2: {
						message: 'User code displayed for authentication',
						userCode: deviceCodeData.user_code,
						verificationUri: deviceCodeData.verification_uri,
					},
				}));
				setExecutedSteps((prev) => new Set(prev).add(2));

				console.log(' [DeviceCodeFlow] User code displayed for authentication');
			},
		},
		{
			title: 'Device Polls for Authorization',
			description: 'Device repeatedly polls token endpoint until user completes authentication',
			code: `// Device polls token endpoint
POST https://auth.pingone.com/${config?.environmentId || 'YOUR_ENV_ID'}/as/token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:device_code
&device_code=GmRhmhcxhwAzkoEqiMEg_DnyE-oqGpZC9yIwBhLJrRgI
&client_id=${config?.clientId || 'your_client_id'}

// Poll every 5 seconds (interval from device authorization)
// Continue polling until:
// - User completes authentication
// - Device code expires
// - Error occurs`,
			execute: () => {
				if (!deviceCodeData) {
					setError('Device codes not available. Please complete previous step first.');
					return;
				}

				// Start polling simulation
				const pollRequest = {
					method: 'POST',
					url: config?.tokenEndpoint || 'https://auth.pingone.com/token',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
					body: `grant_type=urn:ietf:params:oauth:grant-type:device_code&device_code=${deviceCodeData.device_code}&client_id=${config?.clientId || 'your_client_id'}`,
				};

				setStepResults((prev) => ({
					...prev,
					3: {
						request: pollRequest,
						message: 'Device started polling for tokens',
					},
				}));
				setExecutedSteps((prev) => new Set(prev).add(3));

				console.log(' [DeviceCodeFlow] Device started polling for authorization');
			},
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
// Marks device as authorized for token issuance`,
			execute: () => {
				if (!deviceCodeData) {
					setError('Device codes not available. Please complete previous step first.');
					return;
				}

				setStepResults((prev) => ({
					...prev,
					4: {
						message: 'User completed authentication on separate device',
						userCode: deviceCodeData.user_code,
						verificationUri: deviceCodeData.verification_uri,
					},
				}));
				setExecutedSteps((prev) => new Set(prev).add(4));

				console.log(' [DeviceCodeFlow] User authentication completed');
			},
		},
		{
			title: 'Device Receives Tokens',
			description: 'Once user completes authentication, device receives access tokens',
			code: `// Server returns tokens to device
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "read write"
}

// Device can now:
// - Store tokens securely
// - Make authenticated API calls
// - Access protected resources`,
			execute: async () => {
				if (!config || !config.pingone || !deviceCodeData) {
					setError(
						'Configuration or device codes not available. Please complete previous steps first.'
					);
					return;
				}

				try {
					// Make real token request via backend proxy
					const backendUrl =
						process.env.NODE_ENV === 'production'
							? 'https://oauth-playground.vercel.app'
							: 'https://localhost:3001';

					const response = await fetch(`${backendUrl}/api/token-exchange`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
							device_code: deviceCodeData.device_code,
							client_id: config.pingone.clientId,
							environment_id: config.pingone.environmentId,
						}),
					});

					if (!response.ok) {
						throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
					}

					const tokenData = await response.json();
					setTokensReceived(tokenData);
					setDemoStatus('success');

					// Show centralized success message
					showGlobalSuccess('Tokens copied', 'Device flow tokens copied to the clipboard.');

					setStepResults((prev) => ({
						...prev,
						5: { response: tokenData, status: response.status },
					}));
					setExecutedSteps((prev) => new Set(prev).add(5));

					// Store tokens using the shared utility
					const tokensForStorage = {
						access_token: tokenData.access_token,
						refresh_token: tokenData.refresh_token,
						token_type: tokenData.token_type,
						expires_in: tokenData.expires_in,
						scope: tokenData.scope || 'read write',
					};

					const success = storeOAuthTokens(tokensForStorage, 'device_code', 'Device Code Flow');
					if (success) {
						console.log(' [DeviceCodeFlow] Tokens received and stored successfully');
					} else {
						console.error(' [DeviceCodeFlow] Failed to store tokens');
					}
				} catch (error: unknown) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					setError(`Failed to receive tokens: ${errorMessage}`);
					console.error(' [DeviceCodeFlow] Token request error:', error);

					// Show centralized error message
					showGlobalError(
						'Authorization failed',
						`We couldn't complete the device flow: ${errorMessage}`
					);
				}
			},
		},
	];

	return (
		<Container>
			<HeroSection>
				<FlowIntro
					title="Device Code Flow"
					description="Authenticate constrained or shared-input devices by delegating sign-in to a secondary device while PingOne coordinates authorization."
					introCopy={
						<p>
							Present the user with a code and verification URL on the limited-input device. The
							user completes authentication on another device while this client polls PingOne until
							approval.
						</p>
					}
					bullets={[
						'Ideal for TVs, kiosks, IoT hardware, and CLI utilities',
						'No secrets ever live on the constrained device',
						'Polling cadence balances UX and security',
					]}
					warningTitle="Security Considerations"
					warningBody="Device and user codes expire quicklyalways confirm device status with PingOne before granting access."
					warningIcon={<FiAlertCircle />}
					illustration="/images/flows/device-code.svg"
					illustrationAlt="Device code flow"
				/>
			</HeroSection>

			<PageTitle
				title={
					<>
						<FiMonitor />
						Device Code Flow
					</>
				}
				subtitle="Learn how the Device Code flow works for devices with limited input capabilities with real API calls to PingOne."
			/>

			<FlowCredentials
				flowType="device_code"
				onCredentialsChange={(credentials) => {
					console.log('Device Code flow credentials updated:', credentials);
				}}
			/>

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
							directly on the device, users authenticate on a separate device (like a smartphone or
							computer) using a user-friendly code.
						</p>
						<p>
							<strong>How it works:</strong> The device requests codes from the authorization
							server, displays a user-friendly code to the user, who then authenticates on a
							different device using that code. The device polls for tokens until authentication is
							complete.
						</p>
					</FlowDescription>

					<UseCaseHighlight>
						<FiSmartphone size={20} />
						<div>
							<h3>Perfect For</h3>
							<p>
								Smart TVs, gaming consoles, IoT devices, printers, and any device without a proper
								keyboard or secure input method.
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
					<StepByStepFlow
						steps={stepsWithResults.length > 0 ? stepsWithResults : steps}
						onStart={startDeviceCodeFlow}
						onReset={resetDemo}
						status={demoStatus}
						currentStep={currentStep}
						onStepChange={setCurrentStep}
						onStepResult={handleStepResult}
						disabled={!config}
						title="Device Code Flow"
						configurationButton={<ConfigurationButton flowType="device_code" />}
					/>

					{!config && (
						<ErrorMessage>
							<FiAlertCircle />
							<strong>Configuration Required:</strong> Please configure your PingOne settings in the
							Configuration page before running this demo.
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
							<div className="device-codes">{deviceCodeData.user_code}</div>
							<div className="verification-url">
								Visit: {deviceCodeData.verification_uri}
								<br />
								Complete URL: {deviceCodeData.verification_uri_complete}
							</div>
							<div
								style={{
									marginTop: '0.5rem',
									fontSize: '0.8rem',
									color: '#6b7280',
								}}
							>
								Device Code: {deviceCodeData.device_code}
								<br />
								Expires in: {deviceCodeData.expires_in} seconds
								<br />
								Poll interval: {deviceCodeData.interval} seconds
							</div>
						</DeviceCodeDisplay>
					)}

					{tokensReceived && (
						<div>
							<h3>Tokens Received:</h3>
							<TokenDisplayComponent tokens={tokensReceived} />
						</div>
					)}
				</CardBody>
			</DemoSection>

			{/* Centralized Success/Error Messages */}
		</Container>
	);
};

export default DeviceFlow;
