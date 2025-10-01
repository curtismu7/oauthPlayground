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

const _TextArea = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const _Select = styled.select`
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

const InfoContainer = styled.div`
  background: #dbeafe;
  border: 1px solid #93c5fd;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: #1e40af;
`;

const ResumeContainer = styled.div`
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
`;

const ResumeTitle = styled.h4`
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.125rem;
  font-weight: 600;
`;

const ResumeDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const ResumeDetail = styled.div`
  display: flex;
  flex-direction: column;
`;

const ResumeLabel = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
`;

const ResumeValue = styled.span`
  font-size: 0.875rem;
  color: #1f2937;
  font-weight: 500;
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1.5rem;
`;

const Tab = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid ${({ $active }) => ($active ? '#3b82f6' : 'transparent')};
  color: ${({ $active }) => ($active ? '#3b82f6' : '#6b7280')};
  
  &:hover {
    color: #3b82f6;
  }
`;

interface ResumeFlowProps {
	credentials?: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		environmentId: string;
	};
}

const ResumeFlow: React.FC<ResumeFlowProps> = ({ credentials }) => {
	const [currentStep, setCurrentStep] = useState(0);
	const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
	const [activeTab, setActiveTab] = useState<'get' | 'post'>('get');
	const [formData, setFormData] = useState({
		clientId: credentials?.clientId || '',
		clientSecret: credentials?.clientSecret || '',
		redirectUri: credentials?.redirectUri || 'http://localhost:3000/callback',
		environmentId: credentials?.environmentId || '',
		scope: 'openid profile email',
		resumeToken: '',
		state: '',
		nonce: '',
		acrValues: '',
		prompt: '',
		maxAge: '',
		uiLocales: '',
		claims: '',
	});
	const [response, setResponse] = useState<Record<string, unknown> | null>(null);
	const [error, setError] = useState<string | null>(null);

	const generateState = useCallback(() => {
		const state =
			Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
		setFormData((prev) => ({ ...prev, state }));
		return state;
	}, []);

	const generateNonce = useCallback(() => {
		const nonce =
			Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
		setFormData((prev) => ({ ...prev, nonce }));
		return nonce;
	}, []);

	const generateResumeToken = useCallback(() => {
		const resumeToken = `resume_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
		setFormData((prev) => ({ ...prev, resumeToken }));
		return resumeToken;
	}, []);

	const steps = [
		{
			id: 'step-1',
			title: 'Configure Resume Flow Settings',
			description: 'Set up your OAuth client for resume flow.',
			code: `// Resume Flow Configuration
const resumeConfig = {
  clientId: '${formData.clientId}',
  clientSecret: '${formData.clientSecret}',
  redirectUri: '${formData.redirectUri}',
  environmentId: '${formData.environmentId}',
  scope: '${formData.scope}',
  resumeToken: '${formData.resumeToken}',
  acrValues: '${formData.acrValues}',
  prompt: '${formData.prompt}',
  maxAge: ${formData.maxAge},
  uiLocales: '${formData.uiLocales}',
  claims: ${formData.claims}
};

console.log('Resume flow configured:', resumeConfig);`,
			execute: async () => {
				logger.info('ResumeFlow', 'Configuring resume flow settings');
				generateResumeToken();
				generateState();
				generateNonce();
			},
		},
		{
			id: 'step-2',
			title: 'Generate Resume Token',
			description: 'Create a resume token for continuing the authorization flow.',
			code: `// Generate Resume Token
const resumeToken = generateResumeToken();
const state = generateState();
const nonce = generateNonce();

// Store resume token for later use
localStorage.setItem('resume_token', resumeToken);
localStorage.setItem('oauth_state', state);
localStorage.setItem('oauth_nonce', nonce);

console.log('Resume Token:', resumeToken);
console.log('State:', state);
console.log('Nonce:', nonce);`,
			execute: async () => {
				logger.info('ResumeFlow', 'Generating resume token');
				const resumeToken = generateResumeToken();
				const state = generateState();
				const nonce = generateNonce();

				return { resumeToken, state, nonce };
			},
		},
		{
			id: 'step-3',
			title: activeTab === 'get' ? 'Resume Authorization (GET)' : 'Resume Authorization (POST)',
			description:
				activeTab === 'get'
					? 'Resume the authorization flow using GET request with resume token.'
					: 'Resume the authorization flow using POST request with resume token.',
			code:
				activeTab === 'get'
					? `// Resume Authorization (GET)
const resumeUrl = \`https://auth.pingone.com/\${environmentId}/as/resume\`;

const resumeParams = new URLSearchParams({
  client_id: '${formData.clientId}',
  resume_token: '${formData.resumeToken}',
  state: '${formData.state}',
  nonce: '${formData.nonce}',
  scope: '${formData.scope}',
  acr_values: '${formData.acrValues}',
  prompt: '${formData.prompt}',
  max_age: '${formData.maxAge}',
  ui_locales: '${formData.uiLocales}',
  claims: '${formData.claims}'
});

const fullResumeUrl = \`\${resumeUrl}?\${resumeParams.toString()}\`;
console.log('Resume URL (GET):', fullResumeUrl);

// Redirect to resume URL
window.location.href = fullResumeUrl;`
					: `// Resume Authorization (POST)
const resumeUrl = \`https://auth.pingone.com/\${environmentId}/as/resume\`;

const formData = new FormData();
formData.append('client_id', '${formData.clientId}');
formData.append('resume_token', '${formData.resumeToken}');
formData.append('state', '${formData.state}');
formData.append('nonce', '${formData.nonce}');
formData.append('scope', '${formData.scope}');
formData.append('acr_values', '${formData.acrValues}');
formData.append('prompt', '${formData.prompt}');
formData.append('max_age', '${formData.maxAge}');
formData.append('ui_locales', '${formData.uiLocales}');
formData.append('claims', '${formData.claims}');

const response = await fetch(resumeUrl, {
  method: 'POST',
  body: formData,
  credentials: 'include'
});

if (response.ok) {
  const result = await response.text();
  console.log('Resume response:', result);
} else {
  throw new Error(\`Resume failed: \${response.status}\`);
}`,
			execute: async () => {
				logger.info('ResumeFlow', `Resuming authorization using ${activeTab.toUpperCase()}`);
				setDemoStatus('loading');

				try {
					const resumeUrl = `https://auth.pingone.com/${formData.environmentId}/as/resume`;

					const mockResponse = {
						success: true,
						message: `Resume authorization initiated using ${activeTab.toUpperCase()}`,
						resumeUrl: resumeUrl,
						resumeToken: formData.resumeToken,
						method: activeTab.toUpperCase(),
					};

					setResponse(mockResponse);
					setDemoStatus('success');
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					setError(errorMessage);
					setDemoStatus('error');
					throw error;
				}
			},
		},
		{
			id: 'step-4',
			title: 'Handle Resume Response',
			description: 'Process the response from the resume endpoint.',
			code: `// Handle Resume Response
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');
const error = urlParams.get('error');
const errorDescription = urlParams.get('error_description');

// Validate state parameter
const storedState = localStorage.getItem('oauth_state');
if (state !== storedState) {
  throw new Error('Invalid state parameter');
}

if (error) {
  console.error('Resume error:', error, errorDescription);
  throw new Error(\`Resume failed: \${error}\`);
}

console.log('Resume successful, authorization code:', code);
console.log('State validated:', state === storedState);`,
			execute: async () => {
				logger.info('ResumeFlow', 'Handling resume response');
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
tokenData.append('code', code);
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
  
  // Clear resume token
  localStorage.removeItem('resume_token');
}`,
			execute: async () => {
				logger.info('ResumeFlow', 'Exchanging code for tokens');

				try {
					// Simulate token exchange
					const mockTokens = {
						access_token: `mock_access_token_${Date.now()}`,
						id_token: `mock_id_token_${Date.now()}`,
						token_type: 'Bearer',
						expires_in: 3600,
						scope: formData.scope,
						refresh_token: `mock_refresh_token_${Date.now()}`,
						resumed: true,
						resumeToken: formData.resumeToken,
					};

					// Store tokens using the standardized method
					const success = storeOAuthTokens(mockTokens, 'resume', 'Resume Flow');

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
		logger.info('ResumeFlow', `Step ${step + 1} completed`, result);
	}, []);

	const handleResumeStart = async () => {
		try {
			setDemoStatus('loading');
			setError(null);

			const resumeUrl = `https://auth.pingone.com/${formData.environmentId}/as/resume`;

			const mockResponse = {
				success: true,
				message: `Resume authorization initiated using ${activeTab.toUpperCase()}`,
				resumeUrl: resumeUrl,
				resumeToken: formData.resumeToken,
				method: activeTab.toUpperCase(),
			};

			setResponse(mockResponse);
			setDemoStatus('success');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			setError(errorMessage);
			setDemoStatus('error');
		}
	};

	return (
		<FlowContainer>
			<FlowTitle>Resume Authorization Flow</FlowTitle>
			<FlowDescription>
				The Resume flow allows users to continue an interrupted authorization process using a resume
				token. This is useful when users need to complete authorization on a different device or
				after a session timeout.
			</FlowDescription>

			<InfoContainer>
				<h4> Resume Flow Benefits</h4>
				<p>
					The Resume flow enables users to continue interrupted authorization processes across
					devices or after timeouts. It supports both GET and POST methods, providing flexibility
					for different use cases and security requirements.
				</p>
			</InfoContainer>

			<FlowCredentials
				flowType="resume"
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

			<TabContainer>
				<Tab $active={activeTab === 'get'} onClick={() => setActiveTab('get')}>
					Resume (GET)
				</Tab>
				<Tab $active={activeTab === 'post'} onClick={() => setActiveTab('post')}>
					Resume (POST)
				</Tab>
			</TabContainer>

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
				}}
				status={demoStatus}
				disabled={demoStatus === 'loading'}
				title={`Resume Flow Steps (${activeTab.toUpperCase()})`}
			/>

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

			<ResumeContainer>
				<ResumeTitle>Resume Token Details</ResumeTitle>

				<ResumeDetails>
					<ResumeDetail>
						<ResumeLabel>Resume Token</ResumeLabel>
						<ResumeValue>{formData.resumeToken || 'Not generated yet'}</ResumeValue>
					</ResumeDetail>
					<ResumeDetail>
						<ResumeLabel>State</ResumeLabel>
						<ResumeValue>{formData.state || 'Not generated yet'}</ResumeValue>
					</ResumeDetail>
					<ResumeDetail>
						<ResumeLabel>Nonce</ResumeLabel>
						<ResumeValue>{formData.nonce || 'Not generated yet'}</ResumeValue>
					</ResumeDetail>
					<ResumeDetail>
						<ResumeLabel>Method</ResumeLabel>
						<ResumeValue>{activeTab.toUpperCase()}</ResumeValue>
					</ResumeDetail>
				</ResumeDetails>

				<Button $variant="primary" onClick={handleResumeStart}>
					Start Resume Flow
				</Button>
			</ResumeContainer>

			<FormContainer>
				<h3>Manual Resume Configuration</h3>
				<p>You can also manually configure the resume flow:</p>

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
						<Label>Resume Token</Label>
						<Input
							type="text"
							value={formData.resumeToken}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									resumeToken: e.target.value,
								}))
							}
							placeholder="Enter resume token"
						/>
					</FormGroup>

					<FormGroup>
						<Label>Scope</Label>
						<Input
							type="text"
							value={formData.scope}
							onChange={(e) => setFormData((prev) => ({ ...prev, scope: e.target.value }))}
						/>
					</FormGroup>
				</div>
			</FormContainer>
		</FlowContainer>
	);
};

export default ResumeFlow;
