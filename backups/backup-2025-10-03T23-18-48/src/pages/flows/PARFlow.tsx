import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import FlowCredentials from '../../components/FlowCredentials';
import { StepByStepFlow } from '../../components/StepByStepFlow';
import {
	type PARAuthMethod,
	type PARRequest,
	type PARResponse,
	PARService,
} from '../../services/parService';
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

const FlowBadge = styled.div`
  display: inline-block;
  background: #dbeafe;
  color: #1e40af;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 1rem;
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

const TextArea = styled.textarea`
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

const InfoContainer = styled.div`
  background: #dbeafe;
  border: 1px solid #93c5fd;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: #1e40af;
`;

const PARContainer = styled.div`
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
`;

const PARTitle = styled.h4`
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.125rem;
  font-weight: 600;
`;

const PARDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const PARDetail = styled.div`
  display: flex;
  flex-direction: column;
`;

const PARLabel = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
`;

const PARValue = styled.span`
  font-size: 0.875rem;
  color: #1f2937;
  font-weight: 500;
  word-break: break-all;
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

interface PARFlowProps {
	credentials?: {
		clientId: string;
		clientSecret: string;
		environmentId: string;
	};
}

const PARFlow: React.FC<PARFlowProps> = ({ credentials }) => {
	// Scroll to top when component mounts
	useEffect(() => {
		window.scrollTo(0, 0);
	}, []);

	const [currentStep, setCurrentStep] = useState(0);
	const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
	const [activeAuthMethod, setActiveAuthMethod] = useState<PARAuthMethod['type']>('NONE');
	const [formData, setFormData] = useState({
		clientId: credentials?.clientId || '',
		clientSecret: credentials?.clientSecret || '',
		environmentId: credentials?.environmentId || '',
		responseType: 'code',
		redirectUri: 'http://localhost:3000/callback',
		scope: 'openid profile email',
		state: '',
		nonce: '',
		codeChallenge: '',
		codeChallengeMethod: 'S256',
		acrValues: '',
		prompt: 'consent',
		maxAge: '3600',
		uiLocales: 'en',
		claims: '{"userinfo": {"email": null, "phone_number": null}}',
		privateKey: '',
		keyId: '',
		jwksUri: '',
	});
	const [response, setResponse] = useState<Record<string, unknown> | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [parResponse, setParResponse] = useState<PARResponse | null>(null);
	const [parService] = useState(() => new PARService(formData.environmentId));

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

	const generateCodeChallenge = useCallback(() => {
		const codeVerifier =
			Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
		const codeChallenge = btoa(codeVerifier)
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=/g, '');
		setFormData((prev) => ({ ...prev, codeChallenge }));
		return { codeVerifier, codeChallenge };
	}, []);

	const steps = [
		{
			id: 'step-1',
			title: 'Push PAR Request',
			description: 'Send the authorization request to the PAR endpoint via POST.',
			code: `// 🔹 Step 1: Client pushes the request (PAR)
// POST /as/par HTTP/1.1
// Host: idp.example.com
// Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW
// Content-Type: application/x-www-form-urlencoded

const parRequest = new URLSearchParams({
  response_type: '${formData.responseType}',
  client_id: '${formData.clientId}',
  redirect_uri: '${formData.redirectUri}',
  scope: '${formData.scope}',
  state: '${formData.state}',
  nonce: '${formData.nonce}',
  code_challenge: '${formData.codeChallenge}',
  code_challenge_method: '${formData.codeChallengeMethod}',
});

const parResponse = await fetch('/as/par', {
  method: 'POST',
  headers: {
    'Authorization': 'Basic ' + btoa('${formData.clientId}:${formData.clientSecret}'),
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: parRequest
});

if (parResponse.ok) {
  const { request_uri, expires_in } = await parResponse.json();
  console.log('PAR Response:', { request_uri, expires_in });
  return { request_uri, expires_in };
} else {
  throw new Error('PAR request failed');
}`,
			execute: async () => {
				logger.info('PARFlow', 'Pushing PAR request');
				generateState();
				generateNonce();
				generateCodeChallenge();
				setDemoStatus('loading');

				try {
					// Simulate Step 1: Push PAR Request
					const mockParResponse: PARResponse = {
						requestUri: `urn:ietf:params:oauth:request_uri:${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
						expiresIn: 600,
						expiresAt: Date.now() + 600000,
					};

					setParResponse(mockParResponse);
					setResponse({
						success: true,
						message: 'PAR request pushed successfully',
						parResponse: mockParResponse,
						step: 'step-1-par-push',
					});
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
			id: 'step-2',
			title: 'Generate Authorization URL',
			description: 'Generate the authorization URL using the request URI from PAR.',
			code: `// 🔹 Step 2: IdP responds with a request URI
// If successful, the Authorization Server responds with a request_uri handle:

{
  "request_uri": "urn:ietf:params:oauth:request_uri:8esc_3BYpZpQd1w6",
  "expires_in": 90
}

// 🔹 Step 3: Client redirects the user
// Now the client only needs to redirect the user with the request_uri:

const authorizationUrl = \`https://idp.example.com/as/authorize?\${new URLSearchParams({
  client_id: '${formData.clientId}',
  request_uri: '${parResponse?.requestUri || 'urn:ietf:params:oauth:request_uri:example'}'
})}\`;

console.log('Authorization URL:', authorizationUrl);
// Redirect: window.location.href = authorizationUrl;`,
			execute: async () => {
				logger.info('PARFlow', 'Generating authorization URL');

				if (parResponse) {
					const authUrl = parService.generateAuthorizationURL(parResponse.requestUri);
					setResponse((prev) => ({
						...prev,
						authorizationUrl: authUrl,
						message: 'Authorization URL generated successfully',
					}));
				}
			},
		},
		{
			id: 'step-3',
			title: 'Simulate User Redirect',
			description: 'Simulate redirecting the user to the authorization endpoint with request_uri.',
			code: `// 🔹 Step 3: Client redirects the user
// Now the client only needs to redirect the user with the request_uri (no long query string):

const authorizationUrl = 'https://idp.example.com/as/authorize?' + new URLSearchParams({
  client_id: '${formData.clientId}',
  request_uri: '${parResponse?.requestUri || 'urn:ietf:params:oauth:request_uri:example'}'
});

console.log('🔗 Redirecting user to:', authorizationUrl);
// In a real implementation: window.location.href = authorizationUrl;

// 🔹 Step 4: User authenticates & consents
// - The IdP authenticates the user
// - Shows consent screen with the pushed request details
// - User approves the authorization request

// 🔹 Step 5: Authorization response
// After approval, the IdP redirects back with an auth code:
const callbackUrl = '${formData.redirectUri}?code=SplxlOBeZQQYbYS6WxSbIA&state=${formData.state}';
console.log('✅ User redirected back with auth code');`,
			execute: async () => {
				logger.info('PARFlow', 'Simulating user redirect');

				if (parResponse) {
					const authUrl = parService.generateAuthorizationURL(parResponse.requestUri);
					setResponse((prev) => ({
						...prev,
						authorizationUrl: authUrl,
						message: 'User redirect simulated - in real flow, user would be redirected to authorization endpoint',
					}));
				}
			},
		},
		{
			id: 'step-4',
			title: 'Handle Authorization Response',
			description: 'Process the authorization response containing the auth code.',
			code: `// 🔹 Step 4: User authenticates & consents
// - The IdP authenticates the user
// - Shows consent screen with the pushed request details
// - User approves the authorization request

// 🔹 Step 5: Authorization response
// After approval, the IdP redirects back with an auth code:

const callbackUrl = '${formData.redirectUri}?code=SplxlOBeZQQYbYS6WxSbIA&state=${formData.state}';

// Handle Authorization Response
const urlParams = new URLSearchParams(callbackUrl.split('?')[1]);
const code = urlParams.get('code');
const state = urlParams.get('state');

// Validate state parameter
const storedState = '${formData.state}';
if (state !== storedState) {
  throw new Error('Invalid state parameter');
}

console.log('✅ Authorization successful, code:', code);
console.log('✅ State validated:', state === storedState);`,
			execute: async () => {
				logger.info('PARFlow', 'Handling authorization response');

				// Simulate receiving auth code
				const mockAuthCode = `SplxlOBeZQQYbYS6WxSbIA_${Date.now()}`;
				setResponse((prev) => ({
					...prev,
					authCode: mockAuthCode,
					message: 'Authorization response received with auth code',
				}));
			},
		},
		{
			id: 'step-5',
			title: 'Exchange Code for Tokens',
			description: 'Exchange the authorization code for access and ID tokens.',
			code: `// 🔹 Step 5: Authorization response (continued)
// From here, the flow continues as a normal Authorization Code flow:

const tokenUrl = \`https://auth.pingone.com/\${'${formData.environmentId}'}/as/token\`;

const tokenData = new URLSearchParams({
  grant_type: 'authorization_code',
  code: '${parResponse ? 'mock_auth_code' : 'auth_code_from_callback'}',
  redirect_uri: '${formData.redirectUri}',
  client_id: '${formData.clientId}',
  client_secret: '${formData.clientSecret}',
});

const tokenResponse = await fetch(tokenUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: tokenData
});

if (tokenResponse.ok) {
  const tokens = await tokenResponse.json();
  console.log('✅ Tokens received:', tokens);
  return tokens;
} else {
  throw new Error('Token exchange failed');
}`,
			execute: async () => {
				logger.info('PARFlow', 'Exchanging code for tokens');

				try {
					// Simulate token exchange
					const mockTokens = {
						access_token: `mock_access_token_${Date.now()}`,
						id_token: `mock_id_token_${Date.now()}`,
						token_type: 'Bearer',
						expires_in: 3600,
						scope: formData.scope,
						refresh_token: `mock_refresh_token_${Date.now()}`,
						par_used: true,
						auth_method: activeAuthMethod,
					};

					// Store tokens using the standardized method
					const success = storeOAuthTokens(mockTokens, 'par', `PAR Flow (${activeAuthMethod})`);

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
		logger.info('PARFlow', `Step ${step + 1} completed`, result);
	}, []);

	const handlePARStart = async () => {
		try {
			setDemoStatus('loading');
			setError(null);

			const mockParResponse: PARResponse = {
				requestUri: `urn:ietf:params:oauth:request_uri:${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
				expiresIn: 600,
				expiresAt: Date.now() + 600000,
			};

			setParResponse(mockParResponse);
			setResponse({
				success: true,
				message: 'PAR request generated successfully',
				parResponse: mockParResponse,
				authMethod: activeAuthMethod,
			});
			setDemoStatus('success');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			setError(errorMessage);
			setDemoStatus('error');
		}
	};

	return (
		<FlowContainer>
			<FlowBadge>RFC 9126 - Pushed Authorization Requests</FlowBadge>
			<FlowTitle>Pushed Authorization Request (PAR) Flow</FlowTitle>
			<FlowDescription>
				The Pushed Authorization Request (PAR) flow allows clients to push authorization request
				parameters to the authorization server in advance, receiving a request URI that can be used
				in the authorization request. This enhances security and reduces the risk of parameter
				tampering.
			</FlowDescription>

			<InfoContainer>
				<h4> PAR Security Benefits</h4>
				<p>
					PAR enhances security by allowing clients to push sensitive parameters to the
					authorization server in advance, reducing the risk of parameter tampering and providing
					better control over the authorization process.
				</p>
				<p>
					<strong> Official Documentation:</strong>
					<a
						href="https://apidocs.pingidentity.com/pingone/auth/v1/api/#pushed-authorization-request"
						target="_blank"
						rel="noopener noreferrer"
						style={{ color: '#1e40af', textDecoration: 'underline' }}
					>
						PingOne PAR API Documentation
					</a>
				</p>
			</InfoContainer>

			<FlowCredentials
				flowType="par"
				onCredentialsChange={(newCredentials) => {
					setFormData((prev) => ({
						...prev,
						clientId: newCredentials.clientId || prev.clientId,
						clientSecret: newCredentials.clientSecret || prev.clientSecret,
						environmentId: newCredentials.environmentId || prev.environmentId,
					}));
				}}
			/>

			<TabContainer>
				<Tab $active={activeAuthMethod === 'NONE'} onClick={() => setActiveAuthMethod('NONE')}>
					NONE
				</Tab>
				<Tab
					$active={activeAuthMethod === 'CLIENT_SECRET_POST'}
					onClick={() => setActiveAuthMethod('CLIENT_SECRET_POST')}
				>
					CLIENT_SECRET_POST
				</Tab>
				<Tab
					$active={activeAuthMethod === 'CLIENT_SECRET_BASIC'}
					onClick={() => setActiveAuthMethod('CLIENT_SECRET_BASIC')}
				>
					CLIENT_SECRET_BASIC
				</Tab>
				<Tab
					$active={activeAuthMethod === 'CLIENT_SECRET_JWT'}
					onClick={() => setActiveAuthMethod('CLIENT_SECRET_JWT')}
				>
					CLIENT_SECRET_JWT
				</Tab>
				<Tab
					$active={activeAuthMethod === 'PRIVATE_KEY_JWT'}
					onClick={() => setActiveAuthMethod('PRIVATE_KEY_JWT')}
				>
					PRIVATE_KEY_JWT
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
					setParResponse(null);
				}}
				status={demoStatus}
				disabled={demoStatus === 'loading'}
				title={`PAR Flow - Pushed Authorization Requests (${activeAuthMethod})`}
			/>

			{parResponse && (
				<PARContainer>
					<PARTitle>🔹 Step 2: PAR Response Details</PARTitle>

					<PARDetails>
						<PARDetail>
							<PARLabel>Request URI</PARLabel>
							<PARValue>{parResponse.requestUri}</PARValue>
						</PARDetail>
						<PARDetail>
							<PARLabel>Expires In</PARLabel>
							<PARValue>{parResponse.expiresIn} seconds</PARValue>
						</PARDetail>
						<PARDetail>
							<PARLabel>Expires At</PARLabel>
							<PARValue>{new Date(parResponse.expiresAt).toLocaleString()}</PARValue>
						</PARDetail>
					</PARDetails>

					{response?.authorizationUrl && (
						<>
							<PARTitle>🔹 Step 3: Authorization URL</PARTitle>
							<PARDetails>
								<PARDetail>
									<PARLabel>Authorization URL</PARLabel>
									<PARValue style={{ wordBreak: 'break-all' }}>
										{response.authorizationUrl}
									</PARValue>
								</PARDetail>
								<PARDetail>
									<PARLabel>Note</PARLabel>
									<PARValue>In a real implementation, the user would be redirected to this URL</PARValue>
								</PARDetail>
							</PARDetails>
						</>
					)}

					<Button $variant="primary" onClick={handlePARStart}>
						Generate New PAR Request
					</Button>
				</PARContainer>
			)}

			{response && (
				<ResponseContainer>
					<h4>Response:</h4>
					<CodeBlock>{JSON.stringify(response, null, 2)}</CodeBlock>
				</ResponseContainer>
			)}

			{error && (
				<ErrorContainer>
					<h4>Error:</h4>
					<p>{error}</p>
				</ErrorContainer>
			)}

			<FormContainer>
				<h3>Manual PAR Configuration</h3>
				<p>You can also manually configure the PAR flow:</p>

				<div
					style={{
						display: 'grid',
						gridTemplateColumns: '1fr 1fr',
						gap: '1rem',
						marginBottom: '1rem',
					}}
				>
					<FormGroup>
						<Label>Response Type</Label>
						<Select
							value={formData.responseType}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									responseType: e.target.value,
								}))
							}
						>
							<option value="code">code</option>
							<option value="token">token</option>
							<option value="id_token">id_token</option>
							<option value="code token">code token</option>
							<option value="code id_token">code id_token</option>
							<option value="token id_token">token id_token</option>
							<option value="code token id_token">code token id_token</option>
						</Select>
					</FormGroup>

					<FormGroup>
						<Label>Scope</Label>
						<Input
							type="text"
							value={formData.scope}
							onChange={(e) => setFormData((prev) => ({ ...prev, scope: e.target.value }))}
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

				{activeAuthMethod === 'PRIVATE_KEY_JWT' && (
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: '1fr 1fr',
							gap: '1rem',
							marginBottom: '1rem',
						}}
					>
						<FormGroup>
							<Label>Private Key</Label>
							<TextArea
								value={formData.privateKey}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										privateKey: e.target.value,
									}))
								}
								placeholder="Enter private key in PEM format"
							/>
						</FormGroup>

						<FormGroup>
							<Label>Key ID</Label>
							<Input
								type="text"
								value={formData.keyId}
								onChange={(e) => setFormData((prev) => ({ ...prev, keyId: e.target.value }))}
								placeholder="Enter key ID"
							/>
						</FormGroup>
					</div>
				)}

				<FormGroup>
					<Label>Claims (JSON)</Label>
					<TextArea
						value={formData.claims}
						onChange={(e) => setFormData((prev) => ({ ...prev, claims: e.target.value }))}
						placeholder='{"userinfo": {"email": null, "phone_number": null}}'
					/>
				</FormGroup>
			</FormContainer>
		</FlowContainer>
	);
};

export default PARFlow;
