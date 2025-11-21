// src/pages/test/ImplicitFlowTest.tsx
// Test page specifically for PingOne Implicit Flow API calls
// Tests URL generation, fragment parsing, and token validation

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import ClientCredentialManager from '../../components/ClientCredentialManager';
import { useCredentialStoreV8 } from '../../hooks/useCredentialStoreV8';
import {
	buildPingOneImplicitAuthUrl,
	generateNonce,
	generateState,
} from '../../utils/pingone-url-builders';

// Test Configuration
interface ImplicitTestConfig {
	environmentId: string;
	clientId: string;
	redirectUri: string;
	scopes: string;
	responseType: 'token' | 'oidc';
	responseMode: 'fragment' | 'form_post';
	state?: string;
	nonce?: string;
}

// Test Result
interface TestResult {
	testName: string;
	success: boolean;
	input: Record<string, unknown>;
	output: Record<string, unknown> | null;
	error?: string;
	duration: number;
	timestamp: Date;
}

const Container = styled.div`
  max-width: 1000px;
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

const TokenCard = styled.div`
  background: #f8fafc;
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 0.5rem 0;
  border: 1px solid #e2e8f0;
`;

const TokenLabel = styled.div`
  font-weight: 600;
  font-size: 0.875rem;
  color: #374151;
  margin-bottom: 0.25rem;
`;

const TokenValue = styled.div`
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 0.75rem;
  color: #1f2937;
  background: #ffffff;
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid #d1d5db;
  word-break: break-all;
`;

const ImplicitFlowTest: React.FC = () => {
	const { apps, selectedAppId, selectApp, getActiveAppConfig } = useCredentialStoreV8();
	const { hasWorkerToken, showWorkerTokenModal, setShowWorkerTokenModal } = useWorkerTokenState();

	const [config, setConfig] = useState<ImplicitTestConfig>({
		environmentId: '',
		clientId: '',
		redirectUri: 'http://localhost:3000/test-callback',
		scopes: 'openid profile email',
		responseType: 'oidc',
		responseMode: 'fragment',
	});

	const [results, setResults] = useState<TestResult[]>([]);
	const [generatedUrl, setGeneratedUrl] = useState<string>('');
	const [testFragment, setTestFragment] = useState<string>('');
	const [parsedTokens, setParsedTokens] = useState<Record<string, string | number> | null>(null);

	// Load credentials from selected app
	useEffect(() => {
		const activeApp = getActiveAppConfig();
		if (activeApp) {
			// Ensure openid is always included in scopes
			let scopes = activeApp.scopes?.join(' ') || prev.scopes;
			if (!scopes.includes('openid')) {
				scopes = `openid ${scopes}`.trim();
			}

			setConfig((prev) => ({
				...prev,
				environmentId: activeApp.environmentId || '',
				clientId: activeApp.clientId || '',
				redirectUri: activeApp.redirectUris?.[0] || prev.redirectUri,
				scopes,
			}));
		}
	}, [getActiveAppConfig]);

	const addResult = useCallback((result: Omit<TestResult, 'timestamp'>) => {
		setResults((prev) => [...prev, { ...result, timestamp: new Date() }]);
	}, []);

	const handleConfigChange = (field: keyof ImplicitTestConfig, value: string | undefined) => {
		setConfig((prev) => ({ ...prev, [field]: value }));
	};

	// Test 1: Authorization URL Generation
	const testUrlGeneration = useCallback(() => {
		const startTime = Date.now();

		try {
			console.log('🧪 Testing Implicit Flow URL Generation...');

			// Generate state and nonce if not provided
			const state = config.state || generateState();
			const nonce = config.nonce || (config.responseType === 'oidc' ? generateNonce() : undefined);

			const urlParams = {
				environmentId: config.environmentId,
				clientId: config.clientId,
				redirectUri: config.redirectUri,
				scopes: config.scopes,
				responseType: config.responseType,
				responseMode: config.responseMode,
				state,
				nonce,
			};

			const url = buildPingOneImplicitAuthUrl(urlParams);
			setGeneratedUrl(url);

			const duration = Date.now() - startTime;

			addResult({
				testName: 'Authorization URL Generation',
				success: true,
				input: urlParams,
				output: {
					url,
					length: url.length,
					parsedParams: Object.fromEntries(new URLSearchParams(url.split('?')[1] || '')),
				},
				duration,
			});

			console.log('✅ URL generated successfully:', url);
			return url;
		} catch (error) {
			const duration = Date.now() - startTime;
			addResult({
				testName: 'Authorization URL Generation',
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

	// Test 2: Fragment Parsing
	const testFragmentParsing = useCallback(() => {
		const startTime = Date.now();

		try {
			console.log('🧪 Testing Fragment Parsing...');

			if (!testFragment.trim()) {
				throw new Error('No fragment provided to parse');
			}

			// Parse fragment (remove leading # if present)
			const fragmentToParse = testFragment.startsWith('#') ? testFragment.slice(1) : testFragment;
			const fragmentParams = new URLSearchParams(fragmentToParse);

			const tokens: Record<string, string | number> = {};

			// Extract OAuth/OIDC tokens and parameters
			for (const [key, value] of fragmentParams.entries()) {
				if (key === 'access_token') {
					tokens.access_token = value;
				} else if (key === 'id_token') {
					tokens.id_token = value;
				} else if (key === 'token_type') {
					tokens.token_type = value;
				} else if (key === 'expires_in') {
					tokens.expires_in = parseInt(value, 10);
				} else if (key === 'scope') {
					tokens.scope = value;
				} else if (key === 'state') {
					tokens.state = value;
				} else {
					tokens[key] = value;
				}
			}

			// Validate tokens
			const hasAccessToken = !!tokens.access_token;
			const hasIdToken = !!tokens.id_token;
			const isValidResponseType =
				(config.responseType === 'token' && hasAccessToken) ||
				(config.responseType === 'oidc' && hasAccessToken && hasIdToken);

			setParsedTokens(tokens);

			const duration = Date.now() - startTime;

			addResult({
				testName: 'Fragment Parsing',
				success: isValidResponseType,
				input: { fragment: testFragment },
				output: {
					parsedTokens: tokens,
					validation: {
						hasAccessToken,
						hasIdToken,
						expectedResponseType: config.responseType,
						isValidResponseType,
						tokenType: tokens.token_type,
						expiresIn: tokens.expires_in,
						state: tokens.state,
					},
				},
				duration,
			});

			console.log('✅ Fragment parsed successfully:', tokens);
			return tokens;
		} catch (error) {
			const duration = Date.now() - startTime;
			addResult({
				testName: 'Fragment Parsing',
				success: false,
				input: { fragment: testFragment },
				output: null,
				error: error instanceof Error ? error.message : 'Unknown error',
				duration,
			});
			console.error('❌ Fragment parsing failed:', error);
			return null;
		}
	}, [config.responseType, testFragment, addResult]);

	// Test 3: Token Validation
	const testTokenValidation = useCallback(() => {
		const startTime = Date.now();

		try {
			console.log('🧪 Testing Token Validation...');

			if (!parsedTokens) {
				throw new Error('No tokens to validate - parse a fragment first');
			}

			const validation: Record<string, any> = {
				access_token: {},
				id_token: {},
				overall: {},
			};

			// Validate access token
			if (parsedTokens.access_token) {
				const parts = parsedTokens.access_token.split('.');
				validation.access_token.isJwt = parts.length === 3;
				validation.access_token.length = parsedTokens.access_token.length;

				if (validation.access_token.isJwt) {
					try {
						const header = JSON.parse(atob(parts[0]));
						const payload = JSON.parse(atob(parts[1]));
						validation.access_token.header = header;
						validation.access_token.payload = payload;
						validation.access_token.expiresAt = payload.exp
							? new Date(payload.exp * 1000).toISOString()
							: null;
						validation.access_token.isExpired = payload.exp
							? Date.now() / 1000 > payload.exp
							: null;
					} catch (e) {
						validation.access_token.decodeError = e instanceof Error ? e.message : 'Unknown error';
					}
				}
			}

			// Validate ID token
			if (parsedTokens.id_token) {
				const parts = parsedTokens.id_token.split('.');
				validation.id_token.isJwt = parts.length === 3;
				validation.id_token.length = parsedTokens.id_token.length;

				if (validation.id_token.isJwt) {
					try {
						const header = JSON.parse(atob(parts[0]));
						const payload = JSON.parse(atob(parts[1]));
						validation.id_token.header = header;
						validation.id_token.payload = payload;
						validation.id_token.expiresAt = payload.exp
							? new Date(payload.exp * 1000).toISOString()
							: null;
						validation.id_token.isExpired = payload.exp ? Date.now() / 1000 > payload.exp : null;
						validation.id_token.hasNonce = !!payload.nonce;
					} catch (e) {
						validation.id_token.decodeError = e instanceof Error ? e.message : 'Unknown error';
					}
				}
			}

			// Overall validation
			validation.overall.hasRequiredTokens =
				(config.responseType === 'token' && parsedTokens.access_token) ||
				(config.responseType === 'oidc' && parsedTokens.access_token && parsedTokens.id_token);

			validation.overall.correctTokenType = parsedTokens.token_type === 'Bearer';
			validation.overall.hasValidExpiry = parsedTokens.expires_in && parsedTokens.expires_in > 0;

			const duration = Date.now() - startTime;

			addResult({
				testName: 'Token Validation',
				success: validation.overall.hasRequiredTokens,
				input: { tokens: parsedTokens },
				output: validation,
				duration,
			});

			console.log('✅ Token validation completed:', validation);
			return validation;
		} catch (error) {
			const duration = Date.now() - startTime;
			addResult({
				testName: 'Token Validation',
				success: false,
				input: { tokens: parsedTokens },
				output: null,
				error: error instanceof Error ? error.message : 'Unknown error',
				duration,
			});
			console.error('❌ Token validation failed:', error);
			return null;
		}
	}, [parsedTokens, config.responseType, addResult]);

	// Generate sample fragment for testing
	const generateSampleFragment = useCallback(() => {
		const sampleTokens: Record<string, string | number> = {
			access_token:
				'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.sample_access_token_signature',
			token_type: 'Bearer',
			expires_in: 3600,
			scope: config.scopes,
			state: config.state || 'sample_state',
		};

		if (config.responseType === 'oidc') {
			sampleTokens.id_token =
				'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwibmFtZSI6IkpvaG4gRG9lIiwiaXNzIjoiaHR0cHM6Ly9hdXRoLnBpbmdvbmUuY29tL2VudiIsImF1ZCI6ImNsaWVudF9pZCIsIm5vbmNlIjoic2FtcGxlX25vbmNlIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNzUwMjJ9.sample_id_token_signature';
		}

		const params = new URLSearchParams();
		Object.entries(sampleTokens).forEach(([key, value]) => {
			params.set(key, String(value));
		});

		const fragment = params.toString();
		setTestFragment(`#${fragment}`);

		return fragment;
	}, [config]);

	return (
		<Container>
			<Header>
				<Title>PingOne Implicit Flow Test</Title>
				<Subtitle>
					Test PingOne Implicit Flow URL generation, fragment parsing, and token validation
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
								handleConfigChange('responseType', e.target.value as 'token' | 'oidc')
							}
						>
							<option value="token">token (OAuth 2.0)</option>
							<option value="oidc">id_token token (OIDC)</option>
						</Select>
					</FormGroup>

					<FormGroup>
						<Label>Response Mode:</Label>
						<Select
							value={config.responseMode}
							onChange={(e) =>
								handleConfigChange('responseMode', e.target.value as 'fragment' | 'form_post')
							}
						>
							<option value="fragment">fragment (standard)</option>
							<option value="form_post">form_post (uncommon)</option>
						</Select>
					</FormGroup>

					<FormGroup>
						<Label>State (optional):</Label>
						<Input
							type="text"
							value={config.state || ''}
							onChange={(e) => handleConfigChange('state', e.target.value)}
							placeholder="Auto-generated if empty"
						/>
					</FormGroup>

					{config.responseType === 'oidc' && (
						<FormGroup>
							<Label>Nonce (optional):</Label>
							<Input
								type="text"
								value={config.nonce || ''}
								onChange={(e) => handleConfigChange('nonce', e.target.value)}
								placeholder="Auto-generated if empty (required for OIDC)"
							/>
						</FormGroup>
					)}
				</Form>

				<ButtonGroup>
					<Button variant="primary" onClick={testUrlGeneration}>
						Generate Authorization URL
					</Button>
					<Button variant="secondary" onClick={generateSampleFragment}>
						Generate Sample Fragment
					</Button>
				</ButtonGroup>
			</TestSection>

			{generatedUrl && (
				<TestSection>
					<SectionTitle>Generated Authorization URL</SectionTitle>
					<CodeBlock>{generatedUrl}</CodeBlock>
					<ButtonGroup>
						<Button variant="secondary" onClick={() => window.open(generatedUrl, '_blank')}>
							Open URL (will redirect to PingOne)
						</Button>
						<Button variant="secondary" onClick={() => navigator.clipboard.writeText(generatedUrl)}>
							Copy URL
						</Button>
					</ButtonGroup>
				</TestSection>
			)}

			<TestSection>
				<SectionTitle>Test Fragment Parsing</SectionTitle>
				<Form>
					<FormGroup>
						<Label>URL Fragment:</Label>
						<Input
							type="text"
							value={testFragment}
							onChange={(e) => setTestFragment(e.target.value)}
							placeholder="#access_token=...&token_type=Bearer&..."
						/>
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
									redirectUri: activeApp.redirectUris?.[0] || prev.redirectUri,
									scopes: activeApp.scopes?.join(' ') || prev.scopes,
								}));
							}
						}, 100);
					}}
				/>

				<ButtonGroup>
					<Button variant="primary" onClick={testFragmentParsing}>
						Parse Fragment
					</Button>
					{parsedTokens && (
						<Button variant="secondary" onClick={testTokenValidation}>
							Validate Tokens
						</Button>
					)}
				</ButtonGroup>
			</TestSection>

			{parsedTokens && (
				<TestSection>
					<SectionTitle>Parsed Tokens</SectionTitle>
					{parsedTokens.access_token && (
						<TokenCard>
							<TokenLabel>Access Token</TokenLabel>
							<TokenValue>{parsedTokens.access_token}</TokenValue>
						</TokenCard>
					)}

					{parsedTokens.id_token && (
						<TokenCard>
							<TokenLabel>ID Token</TokenLabel>
							<TokenValue>{parsedTokens.id_token}</TokenValue>
						</TokenCard>
					)}

					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
							gap: '1rem',
							marginTop: '1rem',
						}}
					>
						{parsedTokens.token_type && (
							<TokenCard>
								<TokenLabel>Token Type</TokenLabel>
								<TokenValue>{parsedTokens.token_type}</TokenValue>
							</TokenCard>
						)}

						{parsedTokens.expires_in && (
							<TokenCard>
								<TokenLabel>Expires In</TokenLabel>
								<TokenValue>{parsedTokens.expires_in} seconds</TokenValue>
							</TokenCard>
						)}

						{parsedTokens.state && (
							<TokenCard>
								<TokenLabel>State</TokenLabel>
								<TokenValue>{parsedTokens.state}</TokenValue>
							</TokenCard>
						)}
					</div>
				</TestSection>
			)}

			<ResultsContainer>
				<SectionTitle>Test Results ({results.length})</SectionTitle>

				{results.map((result, index) => (
					<ResultCard key={index} success={result.success}>
						<ResultHeader>
							<div style={{ display: 'flex', alignItems: 'center' }}>
								<ResultTitle>
									{result.success ? '✅' : '❌'} {result.testName}
								</ResultTitle>
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

			<WorkerTokenModal
				isOpen={showWorkerTokenModal}
				onClose={() => setShowWorkerTokenModal(false)}
			/>
		</Container>
	);
};

export default ImplicitFlowTest;
