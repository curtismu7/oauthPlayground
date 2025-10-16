import type React from 'react';
import { useCallback, useState } from 'react';
import styled from 'styled-components';
import FlowCredentials from '../../components/FlowCredentials';
import JSONHighlighter from '../../components/JSONHighlighter';
import { StepByStepFlow } from '../../components/StepByStepFlow';
import { logger } from '../../utils/logger';
import { storeOAuthTokens } from '../../utils/tokenStorage';

const FlowContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const FlowTitle = styled.h1`
  color: #1f2937;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const FlowDescription = styled.p`
  color: #6b7280;
  font-size: 1.125rem;
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const FormContainer = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Button = styled.button<{
	$variant: 'primary' | 'secondary' | 'success' | 'danger';
}>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  
  ${({ $variant }) => {
		switch ($variant) {
			case 'primary':
				return `
          background-color: #3b82f6;
          color: white;
          &:hover { background-color: #2563eb; }
        `;
			case 'secondary':
				return `
          background-color: #6b7280;
          color: white;
          &:hover { background-color: #4b5563; }
        `;
			case 'success':
				return `
          background-color: #10b981;
          color: white;
          &:hover { background-color: #059669; }
        `;
			case 'danger':
				return `
          background-color: #ef4444;
          color: white;
          &:hover { background-color: #dc2626; }
        `;
		}
	}}
`;

const CodeBlock = styled.pre`
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  overflow-x: auto;
  margin: 1rem 0;
`;

const ResponseContainer = styled.div`
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
`;

const ErrorContainer = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: #991b1b;
`;

const WarningContainer = styled.div`
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: #92400e;
`;

const MFAStepContainer = styled.div`
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
`;

const MFAStepTitle = styled.h4`
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.125rem;
  font-weight: 600;
`;

const MFAStepDescription = styled.p`
  margin: 0 0 1rem 0;
  color: #6b7280;
  font-size: 0.875rem;
`;

const MFAOption = styled.div`
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f9fafb;
  }
`;

const MFAOptionInput = styled.input`
  margin-right: 0.75rem;
`;

const MFAOptionLabel = styled.label`
  flex: 1;
  cursor: pointer;
  font-size: 0.875rem;
  color: #374151;
`;

interface MFAFlowProps {
	credentials?: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		environmentId: string;
	};
}

const MFAFlow: React.FC<MFAFlowProps> = ({ credentials }) => {
	const [currentStep, setCurrentStep] = useState(0);
	const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
	const [formData, setFormData] = useState({
		clientId: credentials?.clientId || 'mock_mfa_client_id_demo_12345',
		clientSecret: credentials?.clientSecret || 'mock_mfa_client_secret_demo_67890',
		redirectUri: credentials?.redirectUri || 'http://localhost:3000/callback',
		environmentId: credentials?.environmentId || 'b9817c16-9910-4415-b67e-4ac687da74d9',
		scope: 'openid profile email',
		acrValues: 'urn:mace:pingidentity.com:loc:1',
		prompt: 'consent',
		maxAge: '3600',
		uiLocales: 'en',
		claims: '{"userinfo": {"email": null, "phone_number": null}}',
		mfaRequired: true,
		selectedMFA: 'sms',
	});
	const [response, setResponse] = useState<Record<string, unknown> | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [mfaStep, setMfaStep] = useState<'select' | 'verify' | 'complete'>('select');
	const [mfaCode, setMfaCode] = useState('');

	const mfaOptions = [
		{
			id: 'sms',
			label: 'SMS Verification',
			description: 'Receive a code via SMS',
		},
		{
			id: 'email',
			label: 'Email Verification',
			description: 'Receive a code via email',
		},
		{
			id: 'totp',
			label: 'TOTP Authenticator',
			description: 'Use your authenticator app',
		},
		{
			id: 'push',
			label: 'Push Notification',
			description: 'Approve via mobile app',
		},
		{
			id: 'voice',
			label: 'Voice Call',
			description: 'Receive a call with verification code',
		},
	];

	const steps = [
		{
			id: 'step-1',
			title: 'Configure MFA Settings',
			description:
				'Set up your OAuth client for MFA-enabled authorization flow using PingOne MFA API.',
			code: `// PingOne MFA API Configuration
const mfaConfig = {
  clientId: '${formData.clientId}',
  clientSecret: '${formData.clientSecret}',
  redirectUri: '${formData.redirectUri}',
  environmentId: '${formData.environmentId}',
  scope: '${formData.scope}',
  acrValues: '${formData.acrValues}',
  prompt: '${formData.prompt}',
  maxAge: ${formData.maxAge},
  uiLocales: '${formData.uiLocales}',
  claims: ${formData.claims},
  mfaRequired: ${formData.mfaRequired}
};

// PingOne MFA API Base URL
const mfaApiBaseUrl = \`https://api.pingone.com/v1/environments/\${environmentId}\`;

console.log('MFA flow configured with PingOne MFA API:', mfaConfig);`,
			execute: async () => {
				logger.info('MFAFlow', 'Configuring MFA flow settings with PingOne MFA API');
			},
		},
		{
			id: 'step-2',
			title: 'Start MFA Authorization',
			description: 'Initiate the MFA-enabled authorization flow using PingOne MFA API.',
			code: `// Start MFA Authorization with PingOne MFA API
const authUrl = \`https://auth.pingone.com/\${environmentId}/as/authorize\`;

const authParams = new URLSearchParams({
  client_id: '${formData.clientId}',
  response_type: 'code',
  redirect_uri: '${formData.redirectUri}',
  scope: '${formData.scope}',
  acr_values: '${formData.acrValues}',
  prompt: '${formData.prompt}',
  max_age: '${formData.maxAge}',
  ui_locales: '${formData.uiLocales}',
  claims: '${formData.claims}',
  state: generateState(),
  nonce: generateNonce()
});

const fullAuthUrl = \`\${authUrl}?\${authParams.toString()}\`;

// Get access token for PingOne MFA API
const tokenResponse = await fetch('https://auth.pingone.com/${formData.environmentId}/as/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: '${formData.clientId}',
    client_secret: '${formData.clientSecret}'
  })
});

const { access_token } = await tokenResponse.json();
console.log('MFA Authorization URL:', fullAuthUrl);
console.log('Access token for MFA API:', access_token);`,
			execute: async () => {
				logger.info('MFAFlow', 'Starting MFA authorization with PingOne MFA API');
				setDemoStatus('loading');

				try {
					// Get access token for PingOne MFA API
					const tokenResponse = await fetch(
						`https://auth.pingone.com/${formData.environmentId}/as/token`,
						{
							method: 'POST',
							headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
							body: new URLSearchParams({
								grant_type: 'client_credentials',
								client_id: formData.clientId,
								client_secret: formData.clientSecret,
							}),
						}
					);

					if (!tokenResponse.ok) {
						throw new Error('Failed to get access token for MFA API');
					}

					const { access_token } = await tokenResponse.json();

					const mockResponse = {
						success: true,
						message: 'MFA authorization initiated with PingOne MFA API',
						authUrl: `https://auth.pingone.com/${formData.environmentId}/as/authorize`,
						accessToken: access_token,
						requiresMFA: true,
						mfaOptions: mfaOptions.map((opt) => opt.id),
					};

					setResponse(mockResponse);
					setDemoStatus('success');
					setMfaStep('select');
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					setError(errorMessage);
					setDemoStatus('error');
					throw error;
				}
			},
		},
		{
			id: 'step-3',
			title: 'Select MFA Method',
			description: 'Choose the preferred multi-factor authentication method using PingOne MFA API.',
			code: `// PingOne MFA Method Selection
const mfaMethods = [
  { id: 'sms', name: 'SMS Verification' },
  { id: 'email', name: 'Email Verification' },
  { id: 'totp', name: 'TOTP Authenticator' },
  { id: 'push', name: 'Push Notification' },
  { id: 'voice', name: 'Voice Call' }
];

const selectedMethod = '${formData.selectedMFA}';
console.log('Selected MFA method:', selectedMethod);

// Get available MFA methods from PingOne MFA API
const mfaMethodsResponse = await fetch(\`https://api.pingone.com/v1/environments/\${environmentId}/mfa/methods\`, {
  method: 'GET',
  headers: {
    'Authorization': \`Bearer \${access_token}\`,
    'Content-Type': 'application/json'
  }
});

const availableMethods = await mfaMethodsResponse.json();
console.log('Available MFA methods:', availableMethods);

// Select MFA method
const mfaSelectionResponse = await fetch(\`https://api.pingone.com/v1/environments/\${environmentId}/mfa/methods/\${selectedMethod}/select\`, {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${access_token}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    method: selectedMethod,
    userId: 'current-user-id' // This would be the actual user ID
  })
});

const selectionResult = await mfaSelectionResponse.json();
console.log('MFA method selection result:', selectionResult);`,
			execute: async () => {
				logger.info('MFAFlow', 'Selecting MFA method with PingOne MFA API', {
					method: formData.selectedMFA,
				});

				try {
					// Get access token from previous step
					const accessToken = (response as { accessToken?: string })?.accessToken;
					if (!accessToken) {
						throw new Error('Access token not available for MFA API');
					}

					// Get available MFA methods from PingOne MFA API
					const mfaMethodsResponse = await fetch(
						`https://api.pingone.com/v1/environments/${formData.environmentId}/mfa/methods`,
						{
							method: 'GET',
							headers: {
								Authorization: `Bearer ${accessToken}`,
								'Content-Type': 'application/json',
							},
						}
					);

					if (!mfaMethodsResponse.ok) {
						throw new Error('Failed to get available MFA methods');
					}

					const availableMethods = await mfaMethodsResponse.json();

					// Select MFA method
					const mfaSelectionResponse = await fetch(
						`https://api.pingone.com/v1/environments/${formData.environmentId}/mfa/methods/${formData.selectedMFA}/select`,
						{
							method: 'POST',
							headers: {
								Authorization: `Bearer ${accessToken}`,
								'Content-Type': 'application/json',
							},
							body: JSON.stringify({
								method: formData.selectedMFA,
								userId: 'current-user-id', // This would be the actual user ID
							}),
						}
					);

					if (!mfaSelectionResponse.ok) {
						throw new Error('Failed to select MFA method');
					}

					const selectionResult = await mfaSelectionResponse.json();

					const mockResponse = {
						success: true,
						message: 'MFA method selected using PingOne MFA API',
						selectedMethod: formData.selectedMFA,
						availableMethods: availableMethods,
						selectionResult: selectionResult,
						requiresVerification: true,
					};

					setResponse((prev) => ({ ...prev, mfaSelection: mockResponse }));
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					setError(errorMessage);
					throw error;
				}
			},
		},
		{
			id: 'step-4',
			title: 'Verify MFA Code',
			description: 'Enter and verify the MFA code received using PingOne MFA API.',
			code: `// PingOne MFA Code Verification
const mfaCode = '${mfaCode}';
const selectedMethod = '${formData.selectedMFA}';

// Verify MFA code using PingOne MFA API
const verificationResponse = await fetch(\`https://api.pingone.com/v1/environments/\${environmentId}/mfa/methods/\${selectedMethod}/verify\`, {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${access_token}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    method: selectedMethod,
    code: mfaCode,
    userId: 'current-user-id',
    sessionId: 'current-session-id'
  })
});

const verificationResult = await verificationResponse.json();

if (verificationResponse.ok) {
  console.log('MFA verification successful:', verificationResult);
  // Continue with token exchange
} else {
  console.error('MFA verification failed:', verificationResult);
}`,
			execute: async () => {
				logger.info('MFAFlow', 'Verifying MFA code with PingOne MFA API', {
					method: formData.selectedMFA,
				});

				try {
					// Get access token from previous step
					const accessToken = (response as { accessToken?: string })?.accessToken;
					if (!accessToken) {
						throw new Error('Access token not available for MFA API');
					}

					// Verify MFA code using PingOne MFA API
					const verificationResponse = await fetch(
						`https://api.pingone.com/v1/environments/${formData.environmentId}/mfa/methods/${formData.selectedMFA}/verify`,
						{
							method: 'POST',
							headers: {
								Authorization: `Bearer ${accessToken}`,
								'Content-Type': 'application/json',
							},
							body: JSON.stringify({
								method: formData.selectedMFA,
								code: mfaCode,
								userId: 'current-user-id',
								sessionId: 'current-session-id',
							}),
						}
					);

					if (!verificationResponse.ok) {
						throw new Error('MFA verification failed');
					}

					const verificationResult = await verificationResponse.json();

					const mockResponse = {
						success: true,
						message: 'MFA verification successful using PingOne MFA API',
						method: formData.selectedMFA,
						verified: true,
						verificationResult: verificationResult,
					};

					setResponse((prev) => ({ ...prev, mfaVerification: mockResponse }));
					setMfaStep('complete');
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					setError(errorMessage);
					throw error;
				}
			},
		},
		{
			id: 'step-5',
			title: 'Exchange Code for Tokens',
			description:
				'Exchange the authorization code for access and ID tokens after MFA verification.',
			code: `// Exchange authorization code for tokens with MFA verification
const tokenUrl = \`https://auth.pingone.com/\${environmentId}/as/token\`;

const tokenData = new FormData();
tokenData.append('grant_type', 'authorization_code');
tokenData.append('code', authorizationCode);
tokenData.append('redirect_uri', '${formData.redirectUri}');
tokenData.append('client_id', '${formData.clientId}');
tokenData.append('client_secret', '${formData.clientSecret}');
// Include MFA verification context
tokenData.append('mfa_verified', 'true');
tokenData.append('mfa_method', '${formData.selectedMFA}');

const tokenResponse = await fetch(tokenUrl, {
  method: 'POST',
  body: tokenData
});

if (tokenResponse.ok) {
  const tokens = await tokenResponse.json();
  console.log('Tokens received with MFA verification:', tokens);
  
  // Store tokens with MFA context
  const tokensWithMFA = {
    ...tokens,
    mfa_verified: true,
    mfa_method: '${formData.selectedMFA}',
    mfa_timestamp: new Date().toISOString()
  };
  
  localStorage.setItem('oauth_tokens', JSON.stringify(tokensWithMFA));
}`,
			execute: async () => {
				logger.info('MFAFlow', 'Exchanging code for tokens with MFA verification');

				try {
					// Simulate token exchange with MFA verification
					const mockTokens = {
						access_token: `mock_access_token_${Date.now()}`,
						id_token: `mock_id_token_${Date.now()}`,
						token_type: 'Bearer',
						expires_in: 3600,
						scope: formData.scope,
						refresh_token: `mock_refresh_token_${Date.now()}`,
						mfa_verified: true,
						mfa_method: formData.selectedMFA,
						mfa_timestamp: new Date().toISOString(),
					};

					// Store tokens using the standardized method
					const success = storeOAuthTokens(mockTokens, 'mfa', 'MFA Flow with PingOne MFA API');

					if (success) {
						setResponse((prev) => ({ ...prev, tokens: mockTokens }));
					} else {
						throw new Error('Failed to store tokens');
					}
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					setError(errorMessage);
					throw error;
				}
			},
		},
	];

	const handleStepChange = useCallback((step: number) => {
		setCurrentStep(step);
		setDemoStatus('idle');
		setResponse(null);
		setError(null);
	}, []);

	const handleStepResult = useCallback((step: number, result: unknown) => {
		logger.info('MFAFlow', `Step ${step + 1} completed`, { result });
	}, []);

	const handleMFAStart = () => {
		setMfaStep('verify');
		logger.info('MFAFlow', 'MFA verification started', {
			method: formData.selectedMFA,
		});
	};

	const handleMFAVerify = () => {
		if (!mfaCode.trim()) {
			setError('Please enter the MFA code');
			return;
		}

		setMfaStep('complete');
		logger.info('MFAFlow', 'MFA code submitted', {
			method: formData.selectedMFA,
		});
	};

	const handleMFAComplete = () => {
		setMfaStep('select');
		setMfaCode('');
		setResponse(null);
		setError(null);
	};

	return (
		<FlowContainer>
			<FlowTitle>MFA-Only Authorization Flow with PingOne MFA API</FlowTitle>
			<FlowDescription>
				This flow demonstrates Multi-Factor Authentication (MFA) specific authorization using the
				PingOne MFA API. It requires users to complete MFA before receiving tokens, ensuring
				enhanced security for sensitive operations. The flow integrates with PingOne's MFA API for
				method selection, verification, and token issuance.
			</FlowDescription>

			<WarningContainer>
				<h4>🔐 PingOne MFA API Integration</h4>
				<p>
					This flow uses the PingOne MFA API to enforce MFA completion before token issuance. Users
					must select and verify their preferred MFA method (SMS, Email, TOTP, Push, or Voice) using
					PingOne's MFA API before receiving access tokens. The API provides real-time MFA method
					availability, verification, and secure token exchange.
				</p>
			</WarningContainer>

			<FlowCredentials
				flowType="mfa"
				onCredentialsChange={(newCredentials) => {
					setFormData((prev) => ({
						...prev,
						clientId: newCredentials.clientId || prev.clientId,
						clientSecret: newCredentials.clientSecret || prev.clientSecret,
						redirectUri: newCredentials.redirectUri || prev.redirectUri,
						environmentId: newCredentials.environmentId || prev.environmentId,
					}));
				}}
			/>

			<StepByStepFlow
				steps={steps}
				currentStep={currentStep}
				onStepChange={handleStepChange}
				onStepResult={handleStepResult}
				onStart={() => setDemoStatus('loading')}
				onReset={() => {
					setCurrentStep(0);
					setDemoStatus('idle');
					setResponse(null);
					setError(null);
					setMfaStep('select');
					setMfaCode('');
				}}
				status={demoStatus}
				disabled={demoStatus === 'loading'}
				title="MFA Flow Steps"
			/>

			{mfaStep === 'select' && response && (
				<MFAStepContainer>
					<MFAStepTitle>Select MFA Method</MFAStepTitle>
					<MFAStepDescription>
						Choose your preferred multi-factor authentication method:
					</MFAStepDescription>

					{mfaOptions.map((option) => (
						<MFAOption key={option.id}>
							<MFAOptionInput
								type="radio"
								id={option.id}
								name="mfaMethod"
								value={option.id}
								checked={formData.selectedMFA === option.id}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										selectedMFA: e.target.value,
									}))
								}
							/>
							<MFAOptionLabel htmlFor={option.id}>
								<div style={{ fontWeight: '500' }}>{option.label}</div>
								<div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{option.description}</div>
							</MFAOptionLabel>
						</MFAOption>
					))}

					<Button $variant="primary" onClick={handleMFAStart}>
						Start MFA Verification
					</Button>
				</MFAStepContainer>
			)}

			{mfaStep === 'verify' && (
				<MFAStepContainer>
					<MFAStepTitle>Verify MFA Code</MFAStepTitle>
					<MFAStepDescription>
						Enter the verification code sent to your{' '}
						{mfaOptions.find((opt) => opt.id === formData.selectedMFA)?.label.toLowerCase()}:
					</MFAStepDescription>

					<FormGroup>
						<Label>Verification Code</Label>
						<Input
							type="text"
							value={mfaCode}
							onChange={(e) => setMfaCode(e.target.value)}
							placeholder="Enter verification code"
							maxLength={6}
						/>
					</FormGroup>

					<div>
						<Button $variant="primary" onClick={handleMFAVerify}>
							Verify Code
						</Button>
						<Button $variant="secondary" onClick={() => setMfaStep('select')}>
							Back to Method Selection
						</Button>
					</div>
				</MFAStepContainer>
			)}

			{mfaStep === 'complete' && (
				<MFAStepContainer>
					<MFAStepTitle>MFA Verification Complete</MFAStepTitle>
					<MFAStepDescription>
						Your MFA verification was successful. You can now proceed with the authorization flow.
					</MFAStepDescription>

					<Button $variant="success" onClick={handleMFAComplete}>
						Continue to Token Exchange
					</Button>
				</MFAStepContainer>
			)}

			{response && (
				<ResponseContainer>
					<h4>Response:</h4>
					<CodeBlock>
						<JSONHighlighter data={JSON.parse(JSON.stringify(response))} />
					</CodeBlock>
				</ResponseContainer>
			)}

			{error && (
				<ErrorContainer>
					<h4>Error:</h4>
					<p>{error}</p>
				</ErrorContainer>
			)}

			<FormContainer>
				<h3>Manual MFA Configuration</h3>
				<p>You can also manually configure the MFA flow:</p>

				<div
					style={{
						display: 'grid',
						gridTemplateColumns: '1fr 1fr',
						gap: '1rem',
						marginBottom: '1rem',
					}}
				>
					<FormGroup>
						<Label>Client ID</Label>
						<Input
							type="text"
							value={formData.clientId}
							onChange={(e) => setFormData((prev) => ({ ...prev, clientId: e.target.value }))}
						/>
					</FormGroup>

					<FormGroup>
						<Label>Environment ID</Label>
						<Input
							type="text"
							value={formData.environmentId}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									environmentId: e.target.value,
								}))
							}
						/>
					</FormGroup>

					<FormGroup>
						<Label>ACR Values</Label>
						<Input
							type="text"
							value={formData.acrValues}
							onChange={(e) => setFormData((prev) => ({ ...prev, acrValues: e.target.value }))}
						/>
					</FormGroup>

					<FormGroup>
						<Label>Prompt</Label>
						<Select
							value={formData.prompt}
							onChange={(e) => setFormData((prev) => ({ ...prev, prompt: e.target.value }))}
						>
							<option value="consent">consent</option>
							<option value="login">login</option>
							<option value="select_account">select_account</option>
						</Select>
					</FormGroup>
				</div>
			</FormContainer>
		</FlowContainer>
	);
};

export default MFAFlow;
