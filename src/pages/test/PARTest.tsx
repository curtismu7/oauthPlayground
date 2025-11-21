// src/pages/test/PARTest.tsx
// Test page for PingOne Pushed Authorization Request (PAR) Flow
// Tests RFC 9126 PAR implementation with real PingOne API calls

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import ClientCredentialManager from '../../components/ClientCredentialManager';
import { useCredentialStoreV8 } from '../../hooks/useCredentialStoreV8';

// PAR Test Configuration
interface PARTestConfig {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scopes: string;
	responseType: 'code' | 'code id_token' | 'code token' | 'code id_token token';
	responseMode?: 'fragment' | 'form_post' | 'query';
	state?: string;
	nonce?: string;
	prompt?: string;
	loginHint?: string;
	audience?: string;
	claims?: string; // JSON string
}

// PAR Test Result
interface PARTestResult {
	testName: string;
	success: boolean;
	input: Record<string, unknown>;
	output: Record<string, unknown> | null;
	error?: string;
	duration: number;
	timestamp: Date;
}

const Container = styled.div`
  max-width: 1200px;
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

const TextArea = styled.textarea`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  min-height: 80px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
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
  padding: 1rem;
  border-radius: 0.5rem;
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

const ResultTitle = styled.h3`
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

const PARBadge = styled.span`
  background: #fef3c7;
  color: #92400e;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: 0.5rem;
`;

const PARTest: React.FC = () => {
	const { apps, selectedAppId, selectApp, getActiveAppConfig } = useCredentialStoreV8();

	const [config, setConfig] = useState<PARTestConfig>({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		redirectUri: 'http://localhost:3000/test-callback',
		scopes: 'openid profile email',
		responseType: 'code',
		responseMode: 'fragment',
	});

	const [results, setResults] = useState<PARTestResult[]>([]);
	const [parRequestUri, setParRequestUri] = useState<string>('');
	const [authorizationUrl, setAuthorizationUrl] = useState<string>('');
	const [isRunning, setIsRunning] = useState(false);

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

	const addResult = useCallback((result: Omit<PARTestResult, 'timestamp'>) => {
		setResults((prev) => [...prev, { ...result, timestamp: new Date() }]);
	}, []);

	const handleConfigChange = (field: keyof PARTestConfig, value: string | null | undefined) => {
		setConfig((prev) => ({ ...prev, [field]: value || undefined }));
	};

	// Test 1: PAR Request
	const testPARRequest = useCallback(async () => {
		const startTime = Date.now();

		try {
			console.log('🧪 Testing PAR Request...');

			// Generate state and nonce
			const state = config.state || generateState();
			const nonce =
				config.nonce || (config.responseType.includes('id_token') ? generateNonce() : undefined);

			const parRequestBody = {
				client_id: config.clientId,
				response_type: config.responseType,
				redirect_uri: config.redirectUri,
				scope: config.scopes,
				state,
				...(nonce && { nonce }),
				...(config.responseMode && { response_mode: config.responseMode }),
				...(config.prompt && { prompt: config.prompt }),
				...(config.loginHint && { login_hint: config.loginHint }),
				...(config.audience && { audience: config.audience }),
				...(config.claims && { claims: JSON.parse(config.claims) }),
			};

			console.log('PAR Request Body:', parRequestBody);

			const response = await fetch('/api/par-request', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify(parRequestBody),
			});

			const responseData = await response.json();
			const duration = Date.now() - startTime;

			addResult({
				testName: 'PAR Request',
				success: response.ok && responseData.request_uri,
				input: {
					url: '/api/par-request',
					method: 'POST',
					body: parRequestBody,
				},
				output: {
					status: response.status,
					statusText: response.statusText,
					data: responseData,
					hasRequestUri: !!responseData.request_uri,
					expiresIn: responseData.expires_in,
				},
				duration,
			});

			if (response.ok && responseData.request_uri) {
				setParRequestUri(responseData.request_uri);
				console.log('✅ PAR request successful, got request_uri:', responseData.request_uri);
				return responseData.request_uri;
			} else {
				console.error('❌ PAR request failed:', responseData);
				return null;
			}
		} catch (error) {
			const duration = Date.now() - startTime;
			addResult({
				testName: 'PAR Request',
				success: false,
				input: { config },
				output: null,
				error: error instanceof Error ? error.message : 'Unknown error',
				duration,
			});
			console.error('❌ PAR request failed:', error);
			return null;
		}
	}, [config, addResult]);

	// Test 2: Authorization URL Generation with request_uri
	const testAuthorizationUrl = useCallback(
		async (requestUri?: string) => {
			const startTime = Date.now();

			try {
				console.log('🧪 Testing Authorization URL Generation with request_uri...');

				const requestUriToUse = requestUri || parRequestUri;
				if (!requestUriToUse) {
					throw new Error('No request_uri available. Run PAR request first.');
				}

				const authParams = new URLSearchParams({
					client_id: config.clientId,
					request_uri: requestUriToUse,
				});

				const authUrl = `https://auth.pingone.com/${config.environmentId}/as/authorize?${authParams.toString()}`;

				setAuthorizationUrl(authUrl);

				const duration = Date.now() - startTime;

				addResult({
					testName: 'Authorization URL with request_uri',
					success: true,
					input: {
						requestUri: requestUriToUse,
						clientId: config.clientId,
						environmentId: config.environmentId,
					},
					output: {
						url: authUrl,
						length: authUrl.length,
						validUrl: isValidUrl(authUrl),
						params: Object.fromEntries(authParams),
					},
					duration,
				});

				console.log('✅ Authorization URL generated successfully:', authUrl);
				return authUrl;
			} catch (error) {
				const duration = Date.now() - startTime;
				addResult({
					testName: 'Authorization URL with request_uri',
					success: false,
					input: { requestUri: parRequestUri, config },
					output: null,
					error: error instanceof Error ? error.message : 'Unknown error',
					duration,
				});
				console.error('❌ Authorization URL generation failed:', error);
				return null;
			}
		},
		[config, parRequestUri, addResult]
	);

	// Test 3: Full PAR Flow
	const testFullPARFlow = useCallback(async () => {
		const startTime = Date.now();

		try {
			console.log('🧪 Testing Full PAR Flow...');

			// Step 1: PAR Request
			const requestUri = await testPARRequest();
			if (!requestUri) {
				throw new Error('PAR request failed, cannot continue with authorization');
			}

			// Step 2: Authorization URL
			const authUrl = await testAuthorizationUrl(requestUri);
			if (!authUrl) {
				throw new Error('Authorization URL generation failed');
			}

			const duration = Date.now() - startTime;

			addResult({
				testName: 'Full PAR Flow',
				success: true,
				input: {
					parConfig: config,
				},
				output: {
					parRequestUri: requestUri,
					authorizationUrl: authUrl,
					flowComplete: true,
					steps: [
						'PAR request sent to /api/par-request',
						'request_uri received from PingOne',
						'Authorization URL built with request_uri',
						'Ready for user authorization',
					],
				},
				duration,
			});

			console.log('✅ Full PAR flow test completed successfully');
			return { requestUri, authUrl };
		} catch (error) {
			const duration = Date.now() - startTime;
			addResult({
				testName: 'Full PAR Flow',
				success: false,
				input: { config },
				output: null,
				error: error instanceof Error ? error.message : 'Unknown error',
				duration,
			});
			console.error('❌ Full PAR flow test failed:', error);
			return null;
		}
	}, [config, testPARRequest, testAuthorizationUrl, addResult]);

	// Run tests
	const runPARRequest = useCallback(async () => {
		setIsRunning(true);
		await testPARRequest();
		setIsRunning(false);
	}, [testPARRequest]);

	const runAuthUrlTest = useCallback(async () => {
		setIsRunning(true);
		await testAuthorizationUrl();
		setIsRunning(false);
	}, [testAuthorizationUrl]);

	const runFullFlow = useCallback(async () => {
		setIsRunning(true);
		setResults([]);
		await testFullPARFlow();
		setIsRunning(false);
	}, [testFullPARFlow]);

	return (
		<Container>
			<Header>
				<Title>PingOne PAR (Pushed Authorization Request) Test</Title>
				<Subtitle>
					Test RFC 9126 PAR implementation - Send authorization parameters securely to PingOne
					before redirecting users
				</Subtitle>
			</Header>

			<TestSection>
				<SectionTitle>PAR Test Configuration</SectionTitle>
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
							<Select value="par" disabled>
								<option value="par">PAR (Pushed Authorization Request)</option>
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

					<FormRow>
						<FormGroup>
							<Label>Client Secret:</Label>
							<Input
								type="password"
								value={config.clientSecret}
								onChange={(e) => handleConfigChange('clientSecret', e.target.value)}
								placeholder="Required for PAR"
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
								onChange={(e) =>
									handleConfigChange(
										'responseType',
										e.target.value as PARTestConfig['responseType']
									)
								}
							>
								<option value="code">code</option>
								<option value="code id_token">code id_token</option>
								<option value="code token">code token</option>
								<option value="code id_token token">code id_token token</option>
							</Select>
						</FormGroup>
					</FormRow>

					<FormRow>
						<FormGroup>
							<Label>Response Mode:</Label>
							<Select
								value={config.responseMode}
								onChange={(e) =>
									handleConfigChange(
										'responseMode',
										e.target.value as PARTestConfig['responseMode']
									)
								}
							>
								<option value="fragment">fragment</option>
								<option value="form_post">form_post</option>
								<option value="query">query</option>
							</Select>
						</FormGroup>

						<FormGroup>
							<Label>Prompt:</Label>
							<Select
								value={config.prompt || ''}
								onChange={(e) => handleConfigChange('prompt', e.target.value || undefined)}
							>
								<option value="">None</option>
								<option value="login">login</option>
								<option value="consent">consent</option>
								<option value="select_account">select_account</option>
							</Select>
						</FormGroup>
					</FormRow>

					<FormRow>
						<FormGroup>
							<Label>Login Hint:</Label>
							<Input
								type="text"
								value={config.loginHint || ''}
								onChange={(e) => handleConfigChange('loginHint', e.target.value)}
								placeholder="Optional user hint"
							/>
						</FormGroup>

						<FormGroup>
							<Label>Audience:</Label>
							<Input
								type="text"
								value={config.audience || ''}
								onChange={(e) => handleConfigChange('audience', e.target.value)}
								placeholder="Optional audience"
							/>
						</FormGroup>
					</FormRow>

					<FormRow>
						<FormGroup>
							<Label>State:</Label>
							<Input
								type="text"
								value={config.state || ''}
								onChange={(e) => handleConfigChange('state', e.target.value)}
								placeholder="Auto-generated if empty"
							/>
						</FormGroup>

						<FormGroup>
							<Label>Nonce:</Label>
							<Input
								type="text"
								value={config.nonce || ''}
								onChange={(e) => handleConfigChange('nonce', e.target.value)}
								placeholder="Required for id_token"
							/>
						</FormGroup>
					</FormRow>

					{config.responseType.includes('id_token') && (
						<FormRow>
							<FormGroup style={{ gridColumn: '1 / -1' }}>
								<Label>Claims (JSON):</Label>
								<TextArea
									value={config.claims || ''}
									onChange={(e) => handleConfigChange('claims', e.target.value)}
									placeholder='{"id_token": {"email": null, "email_verified": null}}'
								/>
							</FormGroup>
						</FormRow>
					)}
				</Form>

				<ClientCredentialManager
					onCredentialsUpdated={() => {
						// Refresh the app list after credentials are updated
						setTimeout(() => {
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
						}, 100);
					}}
				/>

				<ButtonGroup>
					<Button variant="primary" onClick={runFullFlow} disabled={isRunning}>
						{isRunning ? 'Running...' : 'Test Full PAR Flow'}
					</Button>
					<Button variant="secondary" onClick={runPARRequest} disabled={isRunning}>
						Test PAR Request Only
					</Button>
					<Button
						variant="secondary"
						onClick={runAuthUrlTest}
						disabled={isRunning || !parRequestUri}
					>
						Test Auth URL Only
					</Button>
					<Button variant="secondary" onClick={() => setResults([])}>
						Clear Results
					</Button>
				</ButtonGroup>
			</TestSection>

			{parRequestUri && (
				<TestSection>
					<SectionTitle>Pushed Authorization Request URI</SectionTitle>
					<CodeBlock>{parRequestUri}</CodeBlock>
					<p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
						This request_uri is valid for a limited time (typically 5-10 minutes) and can only be
						used once.
					</p>
				</TestSection>
			)}

			{authorizationUrl && (
				<TestSection>
					<SectionTitle>Authorization URL</SectionTitle>
					<CodeBlock>{authorizationUrl}</CodeBlock>
					<ButtonGroup>
						<Button
							variant="secondary"
							onClick={() => navigator.clipboard.writeText(authorizationUrl)}
						>
							Copy URL
						</Button>
						<Button variant="danger" onClick={() => window.open(authorizationUrl, '_blank')}>
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
								<PARBadge>PAR</PARBadge>
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
						No test results yet. Configure your PingOne credentials and run PAR tests.
					</div>
				)}
			</ResultsContainer>
		</Container>
	);
};

// Utility functions
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

export default PARTest;
