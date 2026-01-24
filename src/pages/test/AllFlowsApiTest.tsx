// src/pages/test/AllFlowsApiTest.tsx
// Comprehensive test page for ALL OAuth/OIDC flow types
// Tests PingOne API implementations across Authorization Code, Implicit, Hybrid, Device Auth, etc.
// Allows manual testing without auto-submission

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useCredentialStoreV8 } from '../../hooks/useCredentialStoreV8';

// Test Configuration for all flow types
interface AllFlowsTestConfig {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scopes: string;
	flowType: 'authorization_code' | 'implicit' | 'hybrid' | 'device_code' | 'client_credentials';
	responseType?:
		| 'code'
		| 'token'
		| 'id_token token'
		| 'code token'
		| 'code id_token'
		| 'code id_token token';
	responseMode?: 'fragment' | 'form_post' | 'query';
	usePkce: boolean;
	usePar: boolean;
	nonce?: string;
	state?: string;
}

// Test Result
interface TestResult {
	testName: string;
	flowType: string;
	success: boolean;
	input: Record<string, unknown>;
	output: Record<string, unknown> | null;
	error?: string;
	duration: number;
	timestamp: Date;
}

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 1.1rem;
`;

const TestSection = styled.div`
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: #ffffff;
`;

const SectionTitle = styled.h2`
  color: #1f2937;
  margin-bottom: 1rem;
  font-size: 1.25rem;
`;

const Form = styled.div`
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 0.5rem;
  align-items: center;
`;

const Label = styled.label`
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Checkbox = styled.input`
  margin-right: 0.5rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${(props) => {
		switch (props.variant) {
			case 'primary':
				return `
          background: #3b82f6;
          color: white;
          border: 1px solid #3b82f6;

          &:hover:not(:disabled) {
            background: #2563eb;
            border-color: #2563eb;
          }
        `;
			case 'danger':
				return `
          background: #ef4444;
          color: white;
          border: 1px solid #ef4444;

          &:hover:not(:disabled) {
            background: #dc2626;
            border-color: #dc2626;
          }
        `;
			default:
				return `
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;

          &:hover:not(:disabled) {
            background: #f9fafb;
            border-color: #9ca3af;
          }
        `;
		}
	}}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`;

const ResultsContainer = styled.div`
  margin-top: 2rem;
`;

const ResultCard = styled.div<{ success: boolean }>`
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  border-left: 4px solid ${(props) => (props.success ? '#10b981' : '#ef4444')};
  background: ${(props) => (props.success ? '#f0fdf4' : '#fef2f2')};
`;

const ResultHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const ResultTitle = styled.h3<{ success: boolean }>`
  margin: 0;
  color: ${(props) => (props.success ? '#065f46' : '#991b1b')};
`;

const ResultTime = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
`;

const CodeBlock = styled.pre`
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.25rem;
  overflow-x: auto;
  font-size: 0.75rem;
  margin: 0.5rem 0;
  max-height: 300px;
  overflow-y: auto;
`;

const FlowTypeBadge = styled.span<{ flowtype: string }>`
  background: ${(props) => {
		switch (props.flowtype) {
			case 'authorization_code':
				return '#dbeafe';
			case 'implicit':
				return '#fef3c7';
			case 'hybrid':
				return '#fce7f3';
			case 'device_code':
				return '#ecfdf5';
			case 'client_credentials':
				return '#f3f4f6';
			default:
				return '#f3f4f6';
		}
	}};
  color: ${(props) => {
		switch (props.flowtype) {
			case 'authorization_code':
				return '#1e40af';
			case 'implicit':
				return '#92400e';
			case 'hybrid':
				return '#be185d';
			case 'device_code':
				return '#166534';
			case 'client_credentials':
				return '#374151';
			default:
				return '#374151';
		}
	}};
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: 0.5rem;
`;

const AllFlowsApiTest: React.FC = () => {
	const { apps, selectedAppId, selectApp, getActiveAppConfig } = useCredentialStoreV8();

	const [config, setConfig] = useState<AllFlowsTestConfig>({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		redirectUri: 'http://localhost:3000/test-callback',
		scopes: 'openid profile email',
		flowType: 'authorization_code',
		responseType: 'code',
		responseMode: 'fragment',
		usePkce: true,
		usePar: false,
	});

	const [results, setResults] = useState<TestResult[]>([]);
	const [isRunning, setIsRunning] = useState(false);
	const [generatedUrl, setGeneratedUrl] = useState<string>('');

	// Load credentials from selected app
	useEffect(() => {
		const activeApp = getActiveAppConfig();
		if (activeApp) {
			setConfig((prev) => ({
				...prev,
				environmentId: activeApp.environmentId || '',
				clientId: activeApp.clientId || '',
				clientSecret: activeApp.clientSecret || '',
				redirectUri: activeApp.redirectUris?.[0] || prev.redirectUri,
				scopes: activeApp.scopes?.join(' ') || prev.scopes,
			}));
		}
	}, [getActiveAppConfig]);

	const addResult = useCallback((result: Omit<TestResult, 'timestamp'>) => {
		setResults((prev) => [...prev, { ...result, timestamp: new Date() }]);
	}, []);

	const handleConfigChange = (
		field: keyof AllFlowsTestConfig,
		value: string | boolean | undefined
	) => {
		setConfig((prev) => ({ ...prev, [field]: value }));
	};

	// Update config based on flow type
	useEffect(() => {
		setConfig((prev) => {
			const newConfig = { ...prev };

			switch (prev.flowType) {
				case 'authorization_code':
					newConfig.responseType = 'code';
					newConfig.responseMode = 'fragment';
					newConfig.usePkce = true;
					break;
				case 'implicit':
					newConfig.responseType = prev.responseType === 'code' ? 'token' : prev.responseType;
					newConfig.responseMode = 'fragment';
					newConfig.usePkce = false;
					break;
				case 'hybrid':
					newConfig.responseType = 'code id_token';
					newConfig.responseMode = 'fragment';
					newConfig.usePkce = true;
					break;
				case 'device_code':
					newConfig.responseType = 'code';
					newConfig.responseMode = 'fragment';
					newConfig.usePkce = true;
					break;
				case 'client_credentials':
					newConfig.responseType = undefined;
					newConfig.responseMode = undefined;
					newConfig.usePkce = false;
					break;
			}

			return newConfig;
		});
	}, []);

	// Test 1: URL Generation
	const testUrlGeneration = useCallback(async () => {
		const startTime = Date.now();

		try {
			console.log('🧪 Testing URL Generation for:', config.flowType);

			// Generate state and nonce
			const state = config.state || generateState();
			const nonce =
				config.nonce || (config.responseType?.includes('id_token') ? generateNonce() : undefined);

			const params = new URLSearchParams();

			// Common parameters
			if (config.clientId) params.set('client_id', config.clientId);
			if (config.redirectUri) params.set('redirect_uri', config.redirectUri);
			if (config.scopes) params.set('scope', config.scopes);
			if (state) params.set('state', state);
			if (nonce) params.set('nonce', nonce);

			// Flow-specific parameters
			switch (config.flowType) {
				case 'authorization_code':
				case 'hybrid':
					params.set('response_type', config.responseType || 'code');
					if (config.usePkce) {
						// Generate PKCE codes
						const codeVerifier = generateCodeVerifier();
						const codeChallenge = await generateCodeChallenge(codeVerifier);
						params.set('code_challenge', codeChallenge);
						params.set('code_challenge_method', 'S256');
					}
					break;

				case 'implicit':
					params.set('response_type', config.responseType || 'token');
					break;

				case 'device_code':
					// Device code flow uses device authorization endpoint, not authorize
					break;
			}

			if (config.responseMode) {
				params.set('response_mode', config.responseMode);
			}

			let endpoint: string;
			switch (config.flowType) {
				case 'device_code':
					endpoint = `https://auth.pingone.com/${config.environmentId}/as/device_authorization`;
					break;
				default:
					endpoint = `https://auth.pingone.com/${config.environmentId}/as/authorize`;
			}

			const url = config.flowType === 'device_code' ? endpoint : `${endpoint}?${params.toString()}`;

			setGeneratedUrl(url);

			const duration = Date.now() - startTime;

			addResult({
				testName: 'URL Generation',
				flowType: config.flowType,
				success: true,
				input: { ...config, state, nonce },
				output: {
					url,
					endpoint,
					params: Object.fromEntries(params),
					length: url.length,
					validUrl: isValidUrl(url),
				},
				duration,
			});

			console.log('✅ URL generated successfully:', url);
			return url;
		} catch (error) {
			const duration = Date.now() - startTime;
			addResult({
				testName: 'URL Generation',
				flowType: config.flowType,
				success: false,
				input: config,
				output: null,
				error: error instanceof Error ? error.message : 'Unknown error',
				duration,
			});
			console.error('❌ URL generation failed:', error);
			return null;
		}
	}, [config, addResult]);

	// Test 2: Token Exchange (for auth code flows)
	const testTokenExchange = useCallback(
		async (authCode?: string) => {
			const startTime = Date.now();

			try {
				console.log('🧪 Testing Token Exchange...');

				const codeVerifier = config.usePkce ? generateCodeVerifier() : undefined;

				const requestBody = {
					grant_type: 'authorization_code',
					code: authCode || 'test_auth_code',
					redirect_uri: config.redirectUri,
					client_id: config.clientId,
					environment_id: config.environmentId,
					...(codeVerifier && { code_verifier: codeVerifier }),
					...(config.clientSecret && { client_secret: config.clientSecret }),
				};

				const response = await fetch('/api/token-exchange', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Accept: 'application/json',
					},
					body: JSON.stringify(requestBody),
				});

				const responseData = await response.json();
				const duration = Date.now() - startTime;

				addResult({
					testName: 'Token Exchange',
					flowType: config.flowType,
					success: response.ok,
					input: {
						url: '/api/token-exchange',
						method: 'POST',
						body: requestBody,
					},
					output: {
						status: response.status,
						statusText: response.statusText,
						data: responseData,
						hasAccessToken: !!responseData.access_token,
						hasRefreshToken: !!responseData.refresh_token,
						hasIdToken: !!responseData.id_token,
						tokenType: responseData.token_type,
						expiresIn: responseData.expires_in,
						scope: responseData.scope,
					},
					duration,
				});

				if (response.ok) {
					console.log('✅ Token exchange successful');
				} else {
					console.log(
						'ℹ️ Token exchange failed (expected for test without real auth code):',
						responseData
					);
				}

				return responseData;
			} catch (error) {
				const duration = Date.now() - startTime;
				addResult({
					testName: 'Token Exchange',
					flowType: config.flowType,
					success: false,
					input: { authCode },
					response: null,
					error: error instanceof Error ? error.message : 'Unknown error',
					duration,
				});
				console.error('❌ Token exchange failed:', error);
				return null;
			}
		},
		[config, addResult]
	);

	// Test 3: Client Credentials Flow
	const testClientCredentials = useCallback(async () => {
		const startTime = Date.now();

		try {
			console.log('🧪 Testing Client Credentials Flow...');

			const requestBody = {
				grant_type: 'client_credentials',
				client_id: config.clientId,
				client_secret: config.clientSecret,
				scope: config.scopes,
				environment_id: config.environmentId,
			};

			const response = await fetch('/api/client-credentials', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			const responseData = await response.json();
			const duration = Date.now() - startTime;

			addResult({
				testName: 'Client Credentials',
				flowType: config.flowType,
				success: response.ok,
				input: {
					url: '/api/client-credentials',
					method: 'POST',
					body: requestBody,
				},
				output: {
					status: response.status,
					statusText: response.statusText,
					data: responseData,
					hasAccessToken: !!responseData.access_token,
					tokenType: responseData.token_type,
					expiresIn: responseData.expires_in,
					scope: responseData.scope,
				},
				duration,
			});

			if (response.ok) {
				console.log('✅ Client credentials successful');
			} else {
				console.log('ℹ️ Client credentials failed:', responseData);
			}

			return responseData;
		} catch (error) {
			const duration = Date.now() - startTime;
			addResult({
				testName: 'Client Credentials',
				flowType: config.flowType,
				success: false,
				input: config,
				response: null,
				error: error instanceof Error ? error.message : 'Unknown error',
				duration,
			});
			console.error('❌ Client credentials failed:', error);
			return null;
		}
	}, [config, addResult]);

	// Test 4: Device Code Flow
	const testDeviceCode = useCallback(async () => {
		const startTime = Date.now();

		try {
			console.log('🧪 Testing Device Code Flow...');

			const requestBody = {
				client_id: config.clientId,
				scope: config.scopes,
				environment_id: config.environmentId,
			};

			const response = await fetch('/api/device-authorization', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			const responseData = await response.json();
			const duration = Date.now() - startTime;

			addResult({
				testName: 'Device Code',
				flowType: config.flowType,
				success: response.ok,
				input: {
					url: '/api/device-authorization',
					method: 'POST',
					body: requestBody,
				},
				output: {
					status: response.status,
					statusText: response.statusText,
					data: responseData,
					hasDeviceCode: !!responseData.device_code,
					hasUserCode: !!responseData.user_code,
					hasVerificationUri: !!responseData.verification_uri,
					expiresIn: responseData.expires_in,
					interval: responseData.interval,
				},
				duration,
			});

			if (response.ok) {
				console.log('✅ Device code successful');
			} else {
				console.log('ℹ️ Device code failed:', responseData);
			}

			return responseData;
		} catch (error) {
			const duration = Date.now() - startTime;
			addResult({
				testName: 'Device Code',
				flowType: config.flowType,
				success: false,
				input: config,
				response: null,
				error: error instanceof Error ? error.message : 'Unknown error',
				duration,
			});
			console.error('❌ Device code failed:', error);
			return null;
		}
	}, [config, addResult]);

	// Run tests based on flow type
	const runTests = useCallback(async () => {
		setIsRunning(true);
		setResults([]);

		try {
			console.log('🚀 Starting API Tests for:', config.flowType);

			// Test URL generation for all flows except client credentials
			if (config.flowType !== 'client_credentials') {
				await testUrlGeneration();
			}

			// Test flow-specific endpoints
			switch (config.flowType) {
				case 'authorization_code':
				case 'hybrid':
					await testTokenExchange();
					break;
				case 'client_credentials':
					await testClientCredentials();
					break;
				case 'device_code':
					await testDeviceCode();
					break;
				case 'implicit':
					console.log('ℹ️ Implicit flow requires manual redirect - URL generated above');
					break;
			}
		} catch (error) {
			console.error('❌ Test suite failed:', error);
		} finally {
			setIsRunning(false);
		}
	}, [config, testUrlGeneration, testTokenExchange, testClientCredentials, testDeviceCode]);

	return (
		<Container>
			<Header>
				<Title>Complete OAuth/OIDC Flow API Test Suite</Title>
				<Subtitle>
					Test ALL PingOne OAuth 2.0 and OpenID Connect flow types: Authorization Code, Implicit,
					Hybrid, Device Code, Client Credentials
				</Subtitle>
			</Header>

			<TestSection>
				<SectionTitle>Test Configuration</SectionTitle>
				<Form>
					<FormRow>
						<FormGroup>
							<Label>Select App:</Label>
							<Select
								value={selectedAppId || ''}
								onChange={(e) => selectApp(e.target.value || null)}
							>
								<option value="">Manual Configuration</option>
								{apps.map((app) => (
									<option key={app.id} value={app.id}>
										{app.name} ({app.clientId?.substring(0, 8)}...)
									</option>
								))}
							</Select>
						</FormGroup>

						<FormGroup>
							<Label>Flow Type:</Label>
							<Select
								value={config.flowType}
								onChange={(e) => handleConfigChange('flowType', e.target.value)}
							>
								<option key="auth_code" value="authorization_code">Authorization Code</option>
								<option key="implicit" value="implicit">Implicit</option>
								<option key="hybrid" value="hybrid">Hybrid</option>
								<option key="device_code" value="device_code">Device Code</option>
								<option key="client_credentials" value="client_credentials">Client Credentials</option>
							</Select>
						</FormGroup>
					</FormRow>

					<FormRow>
						<FormGroup>
							<Label>Environment ID:</Label>
							<Input
								type="text"
								value={config.environmentId}
								onChange={(e) => handleConfigChange('environmentId', e.target.value)}
								placeholder="e.g. f9d1e21a-54dc-4b3d-990e-fa36191730d4"
							/>
						</FormGroup>

						<FormGroup>
							<Label>Client ID:</Label>
							<Input
								type="text"
								value={config.clientId}
								onChange={(e) => handleConfigChange('clientId', e.target.value)}
								placeholder="e.g. a1b2c3d4..."
							/>
						</FormGroup>
					</FormRow>

					{(config.flowType === 'authorization_code' ||
						config.flowType === 'hybrid' ||
						config.flowType === 'client_credentials') && (
						<FormRow>
							<FormGroup>
								<Label>Client Secret:</Label>
								<Input
									type="password"
									value={config.clientSecret}
									onChange={(e) => handleConfigChange('clientSecret', e.target.value)}
									placeholder="Required for confidential clients"
								/>
							</FormGroup>

							<FormGroup>
								<Label>Scopes:</Label>
								<Input
									type="text"
									value={config.scopes}
									onChange={(e) => handleConfigChange('scopes', e.target.value)}
									placeholder="openid profile email"
								/>
							</FormGroup>
						</FormRow>
					)}

					{config.flowType !== 'client_credentials' && config.flowType !== 'device_code' && (
						<FormRow>
							<FormGroup>
								<Label>Redirect URI:</Label>
								<Input
									type="url"
									value={config.redirectUri}
									onChange={(e) => handleConfigChange('redirectUri', e.target.value)}
									placeholder="http://localhost:3000/test-callback"
								/>
							</FormGroup>

							<FormGroup>
								<Label>Response Type:</Label>
								<Select
									value={config.responseType}
									onChange={(e) => handleConfigChange('responseType', e.target.value)}
								>
									<option key="code" value="code">code</option>
									<option key="token" value="token">token</option>
									<option key="id_token token" value="id_token token">id_token token</option>
									<option key="code token" value="code token">code token</option>
									<option key="code id_token" value="code id_token">code id_token</option>
									<option key="code id_token token" value="code id_token token">code id_token token</option>
								</Select>
							</FormGroup>

							<FormGroup>
								<Label>Response Mode:</Label>
								<Select
									value={config.responseMode}
									onChange={(e) => handleConfigChange('responseMode', e.target.value)}
								>
									<option key="fragment" value="fragment">fragment</option>
									<option key="form_post" value="form_post">form_post</option>
									<option key="query" value="query">query</option>
								</Select>
							</FormGroup>

							<FormGroup>
								<Label>
									<Checkbox
										type="checkbox"
										checked={config.usePkce}
										onChange={(e) => handleConfigChange('usePkce', e.target.checked)}
									/>
									Use PKCE
								</Label>
								<span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
									{config.flowType === 'implicit'
										? 'Not used in implicit flow'
										: config.flowType === 'client_credentials'
											? 'Not applicable'
											: 'Secure code exchange'}
								</span>
							</FormGroup>
						</FormRow>
					)}

					{(config.flowType === 'implicit' || config.flowType === 'hybrid') &&
						config.responseType?.includes('id_token') && (
							<FormRow>
								<FormGroup>
									<Label>Nonce:</Label>
									<Input
										type="text"
										value={config.nonce || ''}
										onChange={(e) => handleConfigChange('nonce', e.target.value)}
										placeholder="Auto-generated if empty"
									/>
								</FormGroup>

								<FormGroup>
									<Label>State:</Label>
									<Input
										type="text"
										value={config.state || ''}
										onChange={(e) => handleConfigChange('state', e.target.value)}
										placeholder="Auto-generated if empty"
									/>
								</FormGroup>
							</FormRow>
						)}
				</Form>

				<ButtonGroup>
					<Button variant="primary" onClick={runTests} disabled={isRunning}>
						{isRunning
							? 'Running Tests...'
							: `Test ${config.flowType.replace('_', ' ').toUpperCase()} Flow`}
					</Button>
					<Button variant="secondary" onClick={() => setResults([])}>
						Clear Results
					</Button>
					<Button variant="secondary" onClick={testUrlGeneration}>
						Generate URL Only
					</Button>
				</ButtonGroup>
			</TestSection>

			{generatedUrl && (
				<TestSection>
					<SectionTitle>Generated Authorization URL</SectionTitle>
					<CodeBlock>{generatedUrl}</CodeBlock>
					<ButtonGroup>
						<Button variant="secondary" onClick={() => navigator.clipboard.writeText(generatedUrl)}>
							Copy URL
						</Button>
						<Button variant="danger" onClick={() => window.open(generatedUrl, '_blank')}>
							Open URL (Redirect to PingOne)
						</Button>
					</ButtonGroup>
				</TestSection>
			)}

			<ResultsContainer>
				<SectionTitle>Test Results ({results.length})</SectionTitle>

				{results.map((result, index) => (
					<ResultCard key={index} success={result.success}>
						<ResultHeader>
							<div style={{ display: 'flex', alignItems: 'center' }}>
								<ResultTitle success={result.success}>
									{result.success ? '✅' : '❌'} {result.testName}
								</ResultTitle>
								<FlowTypeBadge flowtype={result.flowType}>
									{result.flowType.replace('_', ' ')}
								</FlowTypeBadge>
							</div>
							<ResultTime>
								{result.timestamp.toLocaleTimeString()} ({result.duration}ms)
							</ResultTime>
						</ResultHeader>

						{!result.success && result.error && (
							<div style={{ marginBottom: '1rem' }}>
								<strong>Error:</strong> {result.error}
							</div>
						)}

						<div style={{ marginBottom: '0.5rem' }}>
							<strong>Input:</strong>
						</div>
						<CodeBlock>{JSON.stringify(result.input, null, 2)}</CodeBlock>

						<div style={{ marginBottom: '0.5rem' }}>
							<strong>Output:</strong>
						</div>
						<CodeBlock>{JSON.stringify(result.output, null, 2)}</CodeBlock>
					</ResultCard>
				))}

				{results.length === 0 && (
					<div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
						No test results yet. Configure your settings and run the tests.
					</div>
				)}
			</ResultsContainer>
		</Container>
	);
};

// Utility functions
function generateCodeVerifier(): string {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return btoa(String.fromCharCode(...array))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(verifier);
	const hash = await crypto.subtle.digest('SHA-256', data);
	const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
	return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function generateNonce(): string {
	return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateState(): string {
	return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function isValidUrl(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

export default AllFlowsApiTest;
