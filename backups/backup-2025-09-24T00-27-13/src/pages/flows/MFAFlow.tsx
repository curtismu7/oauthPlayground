import React, { useCallback, useState } from 'react';
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

const Button = styled.button<{ $variant: 'primary' | 'secondary' | 'success' | 'danger' }>`
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

const InfoContainer = styled.div`
  background: #dbeafe;
  border: 1px solid #93c5fd;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: #1e40af;
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
		clientId: credentials?.clientId || '',
		clientSecret: credentials?.clientSecret || '',
		redirectUri: credentials?.redirectUri || 'http://localhost:3000/callback',
		environmentId: credentials?.environmentId || '',
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
		{ id: 'sms', label: 'SMS Verification', description: 'Receive a code via SMS' },
		{ id: 'email', label: 'Email Verification', description: 'Receive a code via email' },
		{ id: 'totp', label: 'TOTP Authenticator', description: 'Use your authenticator app' },
		{ id: 'push', label: 'Push Notification', description: 'Approve via mobile app' },
		{ id: 'voice', label: 'Voice Call', description: 'Receive a call with verification code' },
	];

	const steps = [
		{
			id: 'step-1',
			title: 'Configure MFA Settings',
			description: 'Set up your OAuth client for MFA-enabled authorization flow.',
			code: `// MFA Flow Configuration
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

console.log('MFA flow configured:', mfaConfig);`,
			execute: async () => {
				logger.info('MFAFlow', 'Configuring MFA flow settings');
			},
		},
		{
			id: 'step-2',
			title: 'Start MFA Authorization',
			description: 'Initiate the MFA-enabled authorization flow.',
			code: `// Start MFA Authorization
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
console.log('MFA Authorization URL:', fullAuthUrl);`,
			execute: async () => {
				logger.info('MFAFlow', 'Starting MFA authorization');
				setDemoStatus('loading');

				try {
					// Simulate MFA authorization start
					const mockResponse = {
						success: true,
						message: 'MFA authorization initiated',
						authUrl: `https://auth.pingone.com/${formData.environmentId}/as/authorize`,
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
			description: 'Choose the preferred multi-factor authentication method.',
			code: `// MFA Method Selection
const mfaMethods = [
  { id: 'sms', name: 'SMS Verification' },
  { id: 'email', name: 'Email Verification' },
  { id: 'totp', name: 'TOTP Authenticator' },
  { id: 'push', name: 'Push Notification' },
  { id: 'voice', name: 'Voice Call' }
];

const selectedMethod = '${formData.selectedMFA}';
console.log('Selected MFA method:', selectedMethod);

// Send MFA method selection to PingOne
const mfaSelectionResponse = await fetch('/mfa/select', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ method: selectedMethod })
});`,
			execute: async () => {
				logger.info('MFAFlow', 'Selecting MFA method', { method: formData.selectedMFA });
			},
		},
		{
			id: 'step-4',
			title: 'Verify MFA Code',
			description: 'Enter and verify the MFA code received.',
			code: `// MFA Code Verification
const mfaCode = '${mfaCode}';
const selectedMethod = '${formData.selectedMFA}';

const verificationResponse = await fetch('/mfa/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    method: selectedMethod,
    code: mfaCode,
    sessionId: 'current-session-id'
  })
});

if (verificationResponse.ok) {
  console.log('MFA verification successful');
  // Continue with token exchange
} else {
  console.error('MFA verification failed');
}`,
			execute: async () => {
				logger.info('MFAFlow', 'Verifying MFA code', { method: formData.selectedMFA });

				try {
					// Simulate MFA verification
					const mockResponse = {
						success: true,
						message: 'MFA verification successful',
						method: formData.selectedMFA,
						verified: true,
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
			description: 'Exchange the authorization code for access and ID tokens.',
			code: `// Exchange authorization code for tokens
const tokenUrl = \`https://auth.pingone.com/\${environmentId}/as/token\`;

const tokenData = new FormData();
tokenData.append('grant_type', 'authorization_code');
tokenData.append('code', authorizationCode);
tokenData.append('redirect_uri', '${formData.redirectUri}');
tokenData.append('client_id', '${formData.clientId}');
tokenData.append('client_secret', '${formData.clientSecret}');

const tokenResponse = await fetch(tokenUrl, {
  method: 'POST',
  body: tokenData
});

if (tokenResponse.ok) {
  const tokens = await tokenResponse.json();
  console.log('Tokens received:', tokens);
  
  // Store tokens
  localStorage.setItem('oauth_tokens', JSON.stringify(tokens));
}`,
			execute: async () => {
				logger.info('MFAFlow', 'Exchanging code for tokens');

				try {
					// Simulate token exchange
					const mockTokens = {
						access_token: 'mock_access_token_' + Date.now(),
						id_token: 'mock_id_token_' + Date.now(),
						token_type: 'Bearer',
						expires_in: 3600,
						scope: formData.scope,
						refresh_token: 'mock_refresh_token_' + Date.now(),
						mfa_verified: true,
						mfa_method: formData.selectedMFA,
					};

					// Store tokens using the standardized method
					const success = storeOAuthTokens(mockTokens, 'mfa', 'MFA Flow');

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
		logger.info('MFAFlow', `Step ${step + 1} completed`, result);
	}, []);

	const handleMFAStart = () => {
		setMfaStep('verify');
		logger.info('MFAFlow', 'MFA verification started', { method: formData.selectedMFA });
	};

	const handleMFAVerify = () => {
		if (!mfaCode.trim()) {
			setError('Please enter the MFA code');
			return;
		}

		setMfaStep('complete');
		logger.info('MFAFlow', 'MFA code submitted', { method: formData.selectedMFA });
	};

	const handleMFAComplete = () => {
		setMfaStep('select');
		setMfaCode('');
		setResponse(null);
		setError(null);
	};

	return (
		<FlowContainer>
			<FlowTitle>MFA-Only Authorization Flow</FlowTitle>
			<FlowDescription>
				This flow demonstrates Multi-Factor Authentication (MFA) specific authorization. It requires
				users to complete MFA before receiving tokens, ensuring enhanced security for sensitive
				operations.
			</FlowDescription>

			<WarningContainer>
				<h4>🔐 MFA Security Features</h4>
				<p>
					This flow enforces MFA completion before token issuance. Users must select and verify
					their preferred MFA method (SMS, Email, TOTP, Push, or Voice) before receiving access
					tokens.
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
								onChange={(e) => setFormData((prev) => ({ ...prev, selectedMFA: e.target.value }))}
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
						<JSONHighlighter data={response} />
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
							onChange={(e) => setFormData((prev) => ({ ...prev, environmentId: e.target.value }))}
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
