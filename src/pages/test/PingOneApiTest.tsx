// src/pages/test/PingOneApiTest.tsx
// Test page for PingOne OAuth Authorization Code and Implicit API calls
// Validates the real PingOne API implementations

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import ClientCredentialManager from '../../components/ClientCredentialManager';
import { WorkerTokenModal } from '../../components/WorkerTokenModal';
import { useCredentialStoreV8 } from '../../hooks/useCredentialStoreV8';
import { useWorkerTokenState } from '../../services/workerTokenUIService';

// Test Configuration Interface
interface TestConfig {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scopes: string;
	responseType: 'code' | 'token' | 'oidc';
	responseMode?: 'fragment' | 'form_post';
	usePkce: boolean;
}

// Test Result Interface
interface TestResult {
	testName: string;
	success: boolean;
	request: Record<string, unknown>;
	response: Record<string, unknown> | null;
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

const Form = styled.form`
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const FormGroup = styled.div`
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 0.5rem;
  align-items: center;
`;

const Label = styled.label`
  font-weight: 500;
  color: #374151;
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

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${(props) =>
		props.variant === 'primary'
			? `
    background: #3b82f6;
    color: white;
    border: 1px solid #3b82f6;

    &:hover:not(:disabled) {
      background: #2563eb;
      border-color: #2563eb;
    }
  `
			: `
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;

    &:hover:not(:disabled) {
      background: #f9fafb;
      border-color: #9ca3af;
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
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
`;

const PingOneApiTest: React.FC = () => {
	const { apps, selectedAppId, selectApp, getActiveAppConfig } = useCredentialStoreV8();
	const {
		hasValidToken: hasWorkerToken,
		showWorkerTokenModal,
		setShowWorkerTokenModal,
	} = useWorkerTokenState();

	const [config, setConfig] = useState<TestConfig>({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		redirectUri: 'http://localhost:3000/test-callback',
		scopes: 'openid profile email',
		responseType: 'code',
		responseMode: 'fragment',
		usePkce: true,
	});

	const [results, setResults] = useState<TestResult[]>([]);
	const [isRunning, setIsRunning] = useState(false);

	// Load credentials from selected app
	useEffect(() => {
		const activeApp = getActiveAppConfig();
		if (activeApp) {
			// Ensure openid is always included in scopes
			setConfig((prev) => {
				let scopes = activeApp.scopes?.join(' ') || prev.scopes;
				if (!scopes.includes('openid')) {
					scopes = `openid ${scopes}`.trim();
				}

				return {
					...prev,
					environmentId: activeApp.environmentId || '',
					clientId: activeApp.clientId || '',
					clientSecret: activeApp.clientSecret || '',
					redirectUri: activeApp.redirectUris?.[0] || prev.redirectUri,
					scopes,
				};
			});
		}
	}, [getActiveAppConfig]);

	const addResult = useCallback((result: Omit<TestResult, 'timestamp'>) => {
		setResults((prev) => [...prev, { ...result, timestamp: new Date() }]);
	}, []);

	const handleConfigChange = (field: keyof TestConfig, value: string | boolean | undefined) => {
		setConfig((prev) => ({ ...prev, [field]: value }));
	};

	// Test 1: Authorization URL Generation
	const testAuthUrlGeneration = useCallback(async () => {
		const startTime = Date.now();

		try {
			console.log('🧪 Testing Authorization URL Generation...');

			const params = new URLSearchParams();
			params.set('client_id', config.clientId);
			params.set('redirect_uri', config.redirectUri);
			params.set('scope', config.scopes);
			params.set(
				'response_type',
				config.responseType === 'oidc' ? 'id_token token' : config.responseType
			);
			params.set('state', `test_state_${Date.now()}`);

			if (config.responseMode) {
				params.set('response_mode', config.responseMode);
			}

			if (config.responseType === 'oidc') {
				params.set('nonce', `test_nonce_${Date.now()}`);
			}

			if (config.usePkce && config.responseType === 'code') {
				// Generate PKCE codes
				const codeVerifier = generateCodeVerifier();
				const codeChallenge = await generateCodeChallenge(codeVerifier);
				params.set('code_challenge', codeChallenge);
				params.set('code_challenge_method', 'S256');
			}

			const authUrl = `https://auth.pingone.com/${config.environmentId}/as/authorize?${params.toString()}`;

			const duration = Date.now() - startTime;

			addResult({
				testName: 'Authorization URL Generation',
				success: true,
				request: {
					method: 'GET',
					url: authUrl,
					params: Object.fromEntries(params),
				},
				response: {
					url: authUrl,
					length: authUrl.length,
					validUrl: isValidUrl(authUrl),
				},
				duration,
			});

			console.log('✅ Authorization URL generated successfully:', authUrl);
			return authUrl;
		} catch (error) {
			const duration = Date.now() - startTime;
			addResult({
				testName: 'Authorization URL Generation',
				success: false,
				request: config,
				response: null,
				error: error instanceof Error ? error.message : 'Unknown error',
				duration,
			});
			console.error('❌ Authorization URL generation failed:', error);
			return null;
		}
	}, [config, addResult]);

	// Test 2: Token Exchange (Authorization Code)
	const _testTokenExchange = useCallback(
		async (authCode: string) => {
			const startTime = Date.now();

			try {
				console.log('🧪 Testing Token Exchange...');

				const codeVerifier = config.usePkce ? generateCodeVerifier() : undefined;

				const requestBody = {
					grant_type: 'authorization_code',
					code: authCode,
					redirect_uri: config.redirectUri,
					client_id: config.clientId,
					client_secret: config.clientSecret,
					environment_id: config.environmentId,
					...(codeVerifier && { code_verifier: codeVerifier }),
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
					success: response.ok,
					request: {
						url: '/api/token-exchange',
						method: 'POST',
						body: requestBody,
					},
					response: {
						status: response.status,
						statusText: response.statusText,
						data: responseData,
						hasAccessToken: !!responseData.access_token,
						hasRefreshToken: !!responseData.refresh_token,
						tokenType: responseData.token_type,
						expiresIn: responseData.expires_in,
					},
					duration,
				});

				if (response.ok) {
					console.log('✅ Token exchange successful:', responseData);
				} else {
					console.error('❌ Token exchange failed:', responseData);
				}

				return responseData;
			} catch (error) {
				const duration = Date.now() - startTime;
				addResult({
					testName: 'Token Exchange',
					success: false,
					request: { authCode, config },
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

	// Test 3: Implicit Flow Token Parsing
	const _testImplicitTokenParsing = useCallback(
		async (fragment: string) => {
			const startTime = Date.now();

			try {
				console.log('🧪 Testing Implicit Token Parsing...');

				// Parse fragment (remove leading #)
				const fragmentParams = new URLSearchParams(
					fragment.startsWith('#') ? fragment.slice(1) : fragment
				);
				const tokens: Record<string, string> = {};

				for (const [key, value] of fragmentParams.entries()) {
					if (key === 'access_token' || key === 'id_token' || key === 'refresh_token') {
						tokens[key] = value;
					} else if (key === 'expires_in') {
						tokens[key] = parseInt(value, 10);
					} else if (key === 'token_type') {
						tokens[key] = value;
					} else {
						tokens[key] = value;
					}
				}

				const duration = Date.now() - startTime;

				addResult({
					testName: 'Implicit Token Parsing',
					success: true,
					request: { fragment },
					response: {
						parsedTokens: tokens,
						hasAccessToken: !!tokens.access_token,
						hasIdToken: !!tokens.id_token,
						tokenType: tokens.token_type,
						expiresIn: tokens.expires_in,
						state: tokens.state,
					},
					duration,
				});

				console.log('✅ Implicit tokens parsed successfully:', tokens);
				return tokens;
			} catch (error) {
				const duration = Date.now() - startTime;
				addResult({
					testName: 'Implicit Token Parsing',
					success: false,
					request: { fragment },
					response: null,
					error: error instanceof Error ? error.message : 'Unknown error',
					duration,
				});
				console.error('❌ Implicit token parsing failed:', error);
				return null;
			}
		},
		[addResult]
	);

	// Test 2: Token Exchange (Authorization Code)
	const testTokenExchange = useCallback(async () => {
		const startTime = Date.now();

		try {
			console.log('🧪 Testing Token Exchange...');

			if (!hasWorkerToken) {
				throw new Error('Worker token required for token exchange test');
			}

			// For testing purposes, we'll use a mock authorization code
			const testAuthCode = 'test_authorization_code_' + Date.now();

			const requestBody = {
				grant_type: 'authorization_code',
				code: testAuthCode,
				redirect_uri: config.redirectUri,
				client_id: config.clientId,
				client_secret: config.clientSecret,
			};

			if (config.usePkce) {
				const codeVerifier = generateCodeVerifier();
				(requestBody as any).code_verifier = codeVerifier;
			}

			const response = await fetch('/api/token-exchange', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			const duration = Date.now() - startTime;

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(`Token exchange failed: ${response.status} - ${errorData.error_description || errorData.error || 'Unknown error'}`);
			}

			const tokenData = await response.json();

			addResult({
				testName: 'Token Exchange',
				success: true,
				request: {
					method: 'POST',
					url: '/api/token-exchange',
					body: requestBody,
				},
				response: tokenData,
				duration,
			});
		} catch (error) {
			const duration = Date.now() - startTime;
			addResult({
				testName: 'Token Exchange',
				success: false,
				request: {
					method: 'POST',
					url: '/api/token-exchange',
					body: {
						grant_type: 'authorization_code',
						code: '[TEST_AUTH_CODE]',
						redirect_uri: config.redirectUri,
						client_id: config.clientId,
						client_secret: '[REDACTED]',
						...(config.usePkce && { code_verifier: '[GENERATED]' }),
					},
				},
				response: null,
				error: error instanceof Error ? error.message : 'Unknown error',
				duration,
			});
		}
	}, [config, hasWorkerToken, addResult]);

	// Test 3: User Info Endpoint
	const testUserInfoEndpoint = useCallback(async () => {
		const startTime = Date.now();

		try {
			console.log('🧪 Testing User Info Endpoint...');

			if (!hasWorkerToken) {
				throw new Error('Worker token required for user info test');
			}

			// Mock access token for testing
			const testAccessToken = 'test_access_token_' + Date.now();

			const response = await fetch(`/api/pingone/userinfo?access_token=${testAccessToken}`, {
				method: 'GET',
			});

			const duration = Date.now() - startTime;

			// This will likely fail with a real test, but that's expected
			const responseData = await response.json().catch(() => ({ error: 'Response parsing failed' }));

			addResult({
				testName: 'User Info Endpoint',
				success: response.ok,
				request: {
					method: 'GET',
					url: `/api/pingone/userinfo?access_token=${testAccessToken}`,
				},
				response: responseData,
				duration,
			});
		} catch (error) {
			const duration = Date.now() - startTime;
			addResult({
				testName: 'User Info Endpoint',
				success: false,
				request: {
					method: 'GET',
					url: '/api/pingone/userinfo?access_token=[TEST_ACCESS_TOKEN]',
				},
				response: null,
				error: error instanceof Error ? error.message : 'Unknown error',
				duration,
			});
		}
	}, [hasWorkerToken, addResult]);

	// Test 4: Token Introspection
	const testTokenIntrospection = useCallback(async () => {
		const startTime = Date.now();

		try {
			console.log('🧪 Testing Token Introspection...');

			if (!hasWorkerToken) {
				throw new Error('Worker token required for token introspection test');
			}

			// Mock token for testing
			const testToken = 'test_token_' + Date.now();

			const requestBody = {
				token: testToken,
				token_type_hint: 'access_token',
			};

			const response = await fetch('/api/pingone/introspect', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams(requestBody),
			});

			const duration = Date.now() - startTime;

			const responseData = await response.json().catch(() => ({ error: 'Response parsing failed' }));

			addResult({
				testName: 'Token Introspection',
				success: response.ok,
				request: {
					method: 'POST',
					url: '/api/pingone/introspect',
					body: requestBody,
				},
				response: responseData,
				duration,
			});
		} catch (error) {
			const duration = Date.now() - startTime;
			addResult({
				testName: 'Token Introspection',
				success: false,
				request: {
					method: 'POST',
					url: '/api/pingone/introspect',
					body: {
						token: '[TEST_TOKEN]',
						token_type_hint: 'access_token',
					},
				},
				response: null,
				error: error instanceof Error ? error.message : 'Unknown error',
				duration,
			});
		}
	}, [hasWorkerToken, addResult]);

	// Test 5: JWKS Endpoint
	const testJwksEndpoint = useCallback(async () => {
		const startTime = Date.now();

		try {
			console.log('🧪 Testing JWKS Endpoint...');

			if (!config.environmentId) {
				throw new Error('Environment ID required for JWKS test');
			}

			const jwksUrl = `https://auth.pingone.com/${config.environmentId}/as/jwks`;
			const response = await fetch(`/api/pingone/jwks?environmentId=${config.environmentId}`, {
				method: 'GET',
			});

			const duration = Date.now() - startTime;

			const responseData = await response.json().catch(() => ({ error: 'Response parsing failed' }));

			addResult({
				testName: 'JWKS Endpoint',
				success: response.ok,
				request: {
					method: 'GET',
					url: `/api/pingone/jwks?environmentId=${config.environmentId}`,
				},
				response: responseData,
				duration,
			});
		} catch (error) {
			const duration = Date.now() - startTime;
			addResult({
				testName: 'JWKS Endpoint',
				success: false,
				request: {
					method: 'GET',
					url: `/api/pingone/jwks?environmentId=${config.environmentId}`,
				},
				response: null,
				error: error instanceof Error ? error.message : 'Unknown error',
				duration,
			});
		}
	}, [config.environmentId, addResult]);

	// Run all tests
	const runAllTests = useCallback(async () => {
		setIsRunning(true);
		setResults([]);

		try {
			console.log('🚀 Starting PingOne API Tests...');

			// Test 1: Authorization URL Generation
			await testAuthUrlGeneration();

			// Test 2: Token Exchange
			await testTokenExchange();

			// Test 3: User Info Endpoint
			await testUserInfoEndpoint();

			// Test 4: Token Introspection
			await testTokenIntrospection();

			// Test 5: JWKS Endpoint
			await testJwksEndpoint();

			console.log('✅ All PingOne API tests completed!');
		} catch (error) {
			console.error('❌ Test suite failed:', error);
		} finally {
			setIsRunning(false);
		}
	}, [testAuthUrlGeneration, testTokenExchange, testUserInfoEndpoint, testTokenIntrospection, testJwksEndpoint]);

	return (
		<Container>
			<Header>
				<Title>PingOne OAuth API Test Suite</Title>
				<Subtitle>
					Test real PingOne OAuth 2.0 and OpenID Connect API calls for Authorization Code and
					Implicit flows
				</Subtitle>
				<ButtonGroup style={{ marginTop: '1rem' }}>
					<Button
						variant={hasWorkerToken ? 'secondary' : 'primary'}
						onClick={() => setShowWorkerTokenModal(true)}
					>
						{hasWorkerToken ? '✓ Worker Token Set' : 'Set Worker Token'}
					</Button>
				</ButtonGroup>
			</Header>

			<TestSection>
				<SectionTitle>Test Configuration</SectionTitle>
				<Form>
					<FormGroup>
						<Label>Select App:</Label>
						<Select
							value={selectedAppId || ''}
							onChange={(e) => selectApp(e.target.value || null)}
							disabled={!hasWorkerToken}
						>
							<option value="">
								{hasWorkerToken ? 'Manual Configuration' : 'Set Worker Token to load apps'}
							</option>
							{apps.map((app) => (
								<option key={app.id} value={app.id}>
									{app.name} ({app.clientId?.substring(0, 8)}...)
								</option>
							))}
						</Select>
					</FormGroup>

					<FormGroup>
						<Label>Environment ID:</Label>
						<Input
							type="text"
							value={config.environmentId}
							onChange={(e) => handleConfigChange('environmentId', e.target.value)}
							placeholder="e.g. 12345678-1234-1234-1234-123456789012"
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

					<FormGroup>
						<Label>Client Secret:</Label>
						<Input
							type="password"
							value={config.clientSecret}
							onChange={(e) => handleConfigChange('clientSecret', e.target.value)}
							placeholder="Required for Authorization Code flow"
						/>
					</FormGroup>

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
						<Label>Scopes:</Label>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
							<Input
								type="text"
								value={config.scopes}
								onChange={(e) => handleConfigChange('scopes', e.target.value)}
								placeholder="openid profile email"
							/>
							<span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
								Note: 'openid' scope is required and will be added automatically if missing
							</span>
						</div>
					</FormGroup>

					<FormGroup>
						<Label>Response Type:</Label>
						<Select
							value={config.responseType}
							onChange={(e) =>
								handleConfigChange('responseType', e.target.value as TestConfig['responseType'])
							}
						>
							<option value="code">code (Authorization Code)</option>
							<option value="token">token (OAuth 2.0 Implicit)</option>
							<option value="oidc">id_token token (OIDC Implicit)</option>
						</Select>
					</FormGroup>

					<FormGroup>
						<Label>Response Mode:</Label>
						<Select
							value={config.responseMode}
							onChange={(e) =>
								handleConfigChange('responseMode', e.target.value as TestConfig['responseMode'])
							}
						>
							<option value="fragment">fragment</option>
							<option value="form_post">form_post</option>
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
							Required for Authorization Code flow with public clients
						</span>
					</FormGroup>
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
					<Button variant="primary" onClick={runAllTests} disabled={isRunning}>
						{isRunning ? 'Running Tests...' : 'Run API Tests'}
					</Button>
					<Button variant="secondary" onClick={() => setResults([])}>
						Clear Results
					</Button>
				</ButtonGroup>
			</TestSection>

			<ResultsContainer>
				<SectionTitle>Test Results ({results.length})</SectionTitle>

				{results.map((result, index) => (
					<ResultCard key={index} success={result.success}>
						<ResultHeader>
							<ResultTitle success={result.success}>
								{result.success ? '✅' : '❌'} {result.testName}
							</ResultTitle>
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
							<strong>Request:</strong>
						</div>
						<CodeBlock>{JSON.stringify(result.request, null, 2)}</CodeBlock>

						<div style={{ marginBottom: '0.5rem' }}>
							<strong>Response:</strong>
						</div>
						<CodeBlock>{JSON.stringify(result.response, null, 2)}</CodeBlock>
					</ResultCard>
				))}

				{results.length === 0 && (
					<div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
						No test results yet. Configure your PingOne credentials and run the tests.
					</div>
				)}
			</ResultsContainer>

			<WorkerTokenModal
				isOpen={showWorkerTokenModal}
				onClose={() => setShowWorkerTokenModal(false)}
				onContinue={() => setShowWorkerTokenModal(false)}
			/>
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

function isValidUrl(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

export default PingOneApiTest;
