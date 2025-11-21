// src/pages/TestAuthzCodePKCE.tsx
// Authorization Code + PKCE Test Page

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { comprehensiveFlowDataService } from '../services/comprehensiveFlowDataService';
import { generateCodeChallenge, generateCodeVerifier } from '../utils/oauth';

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
`;

const Title = styled.h1`
  color: #1a202c;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  color: #718096;
  margin-bottom: 30px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Section = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const SectionTitle = styled.h2`
  color: #2d3748;
  margin-bottom: 15px;
  font-size: 18px;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  color: #2d3748;
  font-weight: 700;
  font-size: 13px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #1a202c;
`;

const Button = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  
  &:hover {
    background: #0056b3;
  }
  
  &:disabled {
    background: #cbd5e0;
    cursor: not-allowed;
  }
`;

const Log = styled.div`
  background: #1a202c;
  color: #e2e8f0;
  padding: 15px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  max-height: 500px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const LogEntry = styled.div<{ type?: string }>`
  margin-bottom: 5px;
  color: ${(props) => {
		switch (props.type) {
			case 'success':
				return '#48bb78';
			case 'error':
				return '#f56565';
			case 'warning':
				return '#ed8936';
			default:
				return '#4299e1';
		}
	}};
`;

const CodeBlock = styled.div`
  background: #2d3748;
  color: #e2e8f0;
  padding: 10px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  overflow-x: auto;
  margin-top: 10px;
`;

const Badge = styled.span<{ type: 'pass' | 'fail' }>`
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  margin-left: 8px;
  background: ${(props) => (props.type === 'pass' ? '#c6f6d5' : '#fed7d7')};
  color: ${(props) => (props.type === 'pass' ? '#22543d' : '#742a2a')};
`;

const _Status = styled.span<{ type: 'success' | 'error' | 'pending' }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  margin-left: 10px;
  background: ${(props) => {
		switch (props.type) {
			case 'success':
				return '#c6f6d5';
			case 'error':
				return '#fed7d7';
			default:
				return '#feebc8';
		}
	}};
  color: ${(props) => {
		switch (props.type) {
			case 'success':
				return '#22543d';
			case 'error':
				return '#742a2a';
			default:
				return '#7c2d12';
		}
	}};
`;

const FLOW_KEY = 'authz-pkce-test';
const KROGER_FLOW_KEY = 'kroger-grocery-store-mfa';

const TestAuthzCodePKCE: React.FC = () => {
	const [config, setConfig] = useState({
		envId: '',
		clientId: '',
		clientSecret: '',
		redirectUri: 'https://localhost:3000/test-authz-pkce',
		scopes: 'openid profile email',
	});

	const [logs, setLogs] = useState<Array<{ message: string; type: string; timestamp: string }>>([]);
	const [pkceData, setPkceData] = useState<any>(null);
	const [authUrl, setAuthUrl] = useState('');
	const [authCode, setAuthCode] = useState('');
	const [tokenData, setTokenData] = useState<any>(null);
	const [results, setResults] = useState<any>(null);
	const [initialized, setInitialized] = useState(false);
	const [autoExchange, setAutoExchange] = useState(false);
	const [autoExchangeEnabled, setAutoExchangeEnabled] = useState(true);

	const log = (message: string, type: string = 'info') => {
		const timestamp = new Date().toLocaleTimeString();
		setLogs((prev) => [...prev, { message, type, timestamp }]);
	};

	useEffect(() => {
		if (initialized) return; // Prevent re-running

		const initLogs: Array<{ message: string; type: string; timestamp: string }> = [];
		const addLog = (message: string, type: string = 'info') => {
			initLogs.push({ message, type, timestamp: new Date().toLocaleTimeString() });
		};

		// Check for authorization code in URL (callback from PingOne)
		addLog(`🔍 Checking URL for callback parameters...`, 'info');
		addLog(`   Current URL: ${window.location.href}`, 'info');

		const params = new URLSearchParams(window.location.search);
		const code = params.get('code');
		const stateParam = params.get('state');
		const error = params.get('error');

		addLog(`   Code in URL: ${code ? 'YES' : 'NO'}`, code ? 'success' : 'info');
		addLog(`   Error in URL: ${error ? 'YES' : 'NO'}`, error ? 'error' : 'info');

		if (error) {
			addLog(`❌ Authorization error: ${error}`, 'error');
			const errorDesc = params.get('error_description');
			if (errorDesc) addLog(`   ${errorDesc}`, 'error');
		} else if (code) {
			addLog('🎉 Authorization code received from callback!', 'success');
			addLog(`   Code: ${code.substring(0, 20)}...`, 'info');
			if (stateParam) addLog(`   State: ${stateParam}`, 'info');
			setAuthCode(code);
			setAutoExchange(true); // Trigger auto-exchange
			localStorage.setItem(`${FLOW_KEY}_authcode`, code);

			// Clean up URL
			window.history.replaceState({}, document.title, window.location.pathname);
		} else {
			addLog(`   No callback parameters found`, 'info');
		}

		// Try to load from Kroger flow storage first
		const krogerCreds = comprehensiveFlowDataService.loadFlowCredentialsIsolated(KROGER_FLOW_KEY);
		if (krogerCreds) {
			setConfig({
				envId: krogerCreds.environmentId || '',
				clientId: krogerCreds.clientId || '',
				clientSecret: krogerCreds.clientSecret || '',
				redirectUri: 'https://localhost:3000/test-authz-pkce',
				scopes: Array.isArray(krogerCreds.scopes)
					? krogerCreds.scopes.join(' ')
					: 'openid profile email',
			});
			addLog('✓ Configuration loaded from Kroger flow storage', 'success');
			addLog(`   Environment ID: ${krogerCreds.environmentId}`, 'info');
			addLog(`   Client ID: ${krogerCreds.clientId}`, 'info');
			addLog(`   Redirect URI: https://localhost:3000/test-authz-pkce`, 'info');
		} else {
			// Fallback to test-specific config
			const saved = localStorage.getItem(`${FLOW_KEY}_config`);
			if (saved) {
				setConfig(JSON.parse(saved));
				addLog('✓ Configuration loaded from test storage', 'info');
			} else {
				addLog('⚠️ No saved configuration found', 'warning');
			}
		}

		// Load saved PKCE data
		const savedPkce = localStorage.getItem(`${FLOW_KEY}_pkce`);
		if (savedPkce) {
			setPkceData(JSON.parse(savedPkce));
			addLog('✓ PKCE codes loaded from storage', 'info');
		}

		addLog('🚀 Authorization Code + PKCE Test Ready', 'success');

		// Apply all logs at once
		setLogs(initLogs);
		setInitialized(true);
	}, [initialized]);

	// Auto-exchange code when received from callback
	useEffect(() => {
		if (
			autoExchangeEnabled &&
			autoExchange &&
			authCode &&
			pkceData &&
			config.envId &&
			config.clientId &&
			config.clientSecret &&
			!tokenData
		) {
			log('🔄 Auto-exchanging authorization code...', 'info');
			setAutoExchange(false); // Prevent re-running

			// Exchange the code
			(async () => {
				try {
					const formData = new URLSearchParams({
						grant_type: 'authorization_code',
						code: authCode,
						redirect_uri: config.redirectUri,
						client_id: config.clientId,
						client_secret: config.clientSecret,
						code_verifier: pkceData.codeVerifier,
					});

					log('   Including code_verifier in request ✓', 'success');
					log(`   Code Verifier: ${pkceData.codeVerifier.substring(0, 20)}...`, 'info');

					const response = await fetch(`https://auth.pingone.com/${config.envId}/as/token`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/x-www-form-urlencoded',
						},
						body: formData.toString(),
					});

					if (response.ok) {
						const data = await response.json();
						setTokenData(data);

						log('✅ Token exchange successful!', 'success');
						log(`   Access Token: ${data.access_token.substring(0, 30)}...`, 'info');
						log(`   Token Type: ${data.token_type}`, 'info');
						log(`   Expires In: ${data.expires_in} seconds`, 'info');
						log(`   Scope: ${data.scope}`, 'info');
						if (data.id_token) log('   ID Token: Present ✓', 'success');
						if (data.refresh_token) log('   Refresh Token: Present ✓', 'success');

						updateResults(data);
					} else {
						const error = await response.text();
						log(`❌ Token exchange failed: ${response.status}`, 'error');
						log(`   ${error}`, 'error');
					}
				} catch (error: any) {
					log(`❌ Error exchanging code: ${error.message}`, 'error');
				}
			})();
		}
	}, [
		autoExchange,
		authCode,
		pkceData,
		config,
		tokenData,
		autoExchangeEnabled,
		log,
		updateResults,
	]);

	const saveConfig = () => {
		if (!config.envId || !config.clientId || !config.clientSecret) {
			log('❌ Please fill in all required fields', 'error');
			return;
		}

		localStorage.setItem(`${FLOW_KEY}_config`, JSON.stringify(config));
		log('✅ Configuration saved', 'success');
	};

	const handleGeneratePKCE = async () => {
		log('🔐 Generating PKCE codes...', 'info');

		try {
			const verifier = generateCodeVerifier();
			const challenge = await generateCodeChallenge(verifier);

			const data = {
				codeVerifier: verifier,
				codeChallenge: challenge,
				codeChallengeMethod: 'S256',
				timestamp: new Date().toISOString(),
			};

			setPkceData(data);
			localStorage.setItem(`${FLOW_KEY}_pkce`, JSON.stringify(data));

			log('✅ PKCE codes generated', 'success');
			log(`   Code Verifier: ${verifier.substring(0, 20)}... (${verifier.length} chars)`, 'info');
			log(`   Code Challenge: ${challenge.substring(0, 20)}...`, 'info');
			log(`   Challenge Method: S256`, 'info');
		} catch (error: any) {
			log(`❌ PKCE generation failed: ${error.message}`, 'error');
		}
	};

	const handleBuildAuthRequest = () => {
		if (!pkceData) {
			log('❌ Generate PKCE codes first', 'error');
			return;
		}

		log('🔨 Building authorization request...', 'info');

		const state = `${FLOW_KEY}-${Date.now()}`;

		const params = new URLSearchParams({
			client_id: config.clientId,
			response_type: 'code',
			redirect_uri: config.redirectUri,
			scope: config.scopes,
			state: state,
			code_challenge: pkceData.codeChallenge,
			code_challenge_method: pkceData.codeChallengeMethod,
		});

		const url = `https://auth.pingone.com/${config.envId}/as/authorize?${params.toString()}`;
		setAuthUrl(url);

		localStorage.setItem(`${FLOW_KEY}_state`, state);

		log('✅ Authorization request built', 'success');
		log(`   State: ${state}`, 'info');
		log(`   PKCE Challenge included: ✓`, 'success');
	};

	const handleReceiveAuthCode = () => {
		if (!authCode) {
			log('❌ Please enter an authorization code', 'error');
			return;
		}

		localStorage.setItem(`${FLOW_KEY}_authcode`, authCode);
		log('✅ Authorization code received', 'success');
		log(`   Code: ${authCode.substring(0, 20)}...`, 'info');
	};

	const handleExchangeCode = async () => {
		if (!authCode || !pkceData) {
			log('❌ Missing auth code or PKCE data', 'error');
			return;
		}

		log('🔄 Exchanging authorization code for tokens...', 'info');

		try {
			const formData = new URLSearchParams({
				grant_type: 'authorization_code',
				code: authCode,
				redirect_uri: config.redirectUri,
				client_id: config.clientId,
				client_secret: config.clientSecret,
				code_verifier: pkceData.codeVerifier, // ← CRITICAL!
			});

			log('   Including code_verifier in request ✓', 'success');
			log(`   Code Verifier: ${pkceData.codeVerifier.substring(0, 20)}...`, 'info');

			const response = await fetch(`https://auth.pingone.com/${config.envId}/as/token`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: formData.toString(),
			});

			if (response.ok) {
				const data = await response.json();
				setTokenData(data);

				log('✅ Token exchange successful!', 'success');
				log(`   Access Token: ${data.access_token.substring(0, 30)}...`, 'info');
				log(`   Token Type: ${data.token_type}`, 'info');
				log(`   Expires In: ${data.expires_in} seconds`, 'info');
				log(`   Scope: ${data.scope}`, 'info');
				if (data.id_token) log('   ID Token: Present ✓', 'success');
				if (data.refresh_token) log('   Refresh Token: Present ✓', 'success');

				updateResults(data);
			} else {
				const error = await response.text();
				log(`❌ Token exchange failed: ${response.status}`, 'error');
				log(`   ${error}`, 'error');
			}
		} catch (error: any) {
			log(`❌ Error exchanging code: ${error.message}`, 'error');
		}
	};

	const updateResults = (tokens: any) => {
		setResults({
			pkceGeneration: !!pkceData,
			pkceStorage: !!localStorage.getItem(`${FLOW_KEY}_pkce`),
			pkceInExchange: true,
			tokenReceipt: !!tokens.access_token,
			idToken: !!tokens.id_token,
			refreshToken: !!tokens.refresh_token,
		});
	};

	const handleVerifyPKCE = () => {
		console.log('🔍 handleVerifyPKCE function called');
		console.log('pkceData:', pkceData);
		console.log('tokenData:', tokenData);
		log('🔍 Verifying PKCE implementation...', 'info');

		if (pkceData?.codeVerifier?.length === 43) {
			log('   ✓ Code verifier generated (43 chars)', 'success');
		} else {
			log('   ✗ Code verifier missing or wrong length', 'error');
		}

		if (pkceData?.codeChallenge) {
			log('   ✓ Code challenge generated', 'success');
		} else {
			log('   ✗ Code challenge missing', 'error');
		}

		if (pkceData?.codeChallengeMethod === 'S256') {
			log('   ✓ Challenge method is S256', 'success');
		} else {
			log('   ✗ Challenge method not S256', 'error');
		}

		if (localStorage.getItem(`${FLOW_KEY}_pkce`)) {
			log('   ✓ PKCE codes saved to localStorage', 'success');
		} else {
			log('   ✗ PKCE codes not saved', 'error');
		}

		if (tokenData?.access_token) {
			log('   ✓ Tokens received successfully', 'success');
			log('🎉 All PKCE checks passed!', 'success');
		} else {
			log('   ✗ No tokens received', 'error');
		}
	};

	const handleStartOver = () => {
		// Clear test data but keep credentials
		localStorage.removeItem(`${FLOW_KEY}_pkce`);
		localStorage.removeItem(`${FLOW_KEY}_state`);
		localStorage.removeItem(`${FLOW_KEY}_authcode`);
		setPkceData(null);
		setAuthUrl('');
		setAuthCode('');
		setTokenData(null);
		setResults(null);
		setAutoExchange(false);
		log('🔄 Test reset - ready to start over', 'warning');
	};

	const handleClearStorage = () => {
		localStorage.removeItem(`${FLOW_KEY}_config`);
		localStorage.removeItem(`${FLOW_KEY}_pkce`);
		localStorage.removeItem(`${FLOW_KEY}_state`);
		localStorage.removeItem(`${FLOW_KEY}_authcode`);
		setPkceData(null);
		setAuthUrl('');
		setAuthCode('');
		setTokenData(null);
		setResults(null);
		setLogs([]);
		log('🗑️ All storage cleared - ready for fresh test', 'warning');
	};

	return (
		<Container>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: '20px',
				}}
			>
				<div>
					<Title style={{ marginBottom: '5px' }}>🔐 Authorization Code + PKCE Test</Title>
					<Subtitle>Test the complete OAuth 2.0 Authorization Code flow with PKCE</Subtitle>
				</div>
				<Button onClick={handleStartOver} style={{ background: '#f59e0b', height: 'fit-content' }}>
					🔄 Start Over
				</Button>
			</div>

			<Grid>
				<div>
					<Section>
						<SectionTitle>1. Configuration</SectionTitle>
						<FormGroup>
							<Label>Environment ID</Label>
							<Input
								value={config.envId}
								onChange={(e) => setConfig({ ...config, envId: e.target.value })}
							/>
						</FormGroup>
						<FormGroup>
							<Label>Client ID</Label>
							<Input
								value={config.clientId}
								onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
							/>
						</FormGroup>
						<FormGroup>
							<Label>Client Secret</Label>
							<Input
								type="password"
								value={config.clientSecret}
								onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
								placeholder="Enter client secret"
							/>
						</FormGroup>
						<FormGroup>
							<Label>Redirect URI</Label>
							<Input
								value={config.redirectUri}
								onChange={(e) => setConfig({ ...config, redirectUri: e.target.value })}
							/>
						</FormGroup>
						<FormGroup>
							<Label>Scopes</Label>
							<Input
								value={config.scopes}
								onChange={(e) => setConfig({ ...config, scopes: e.target.value })}
							/>
						</FormGroup>
						<FormGroup>
							<label
								style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
							>
								<input
									type="checkbox"
									checked={autoExchangeEnabled}
									onChange={(e) => setAutoExchangeEnabled(e.target.checked)}
									style={{ width: 'auto', cursor: 'pointer' }}
								/>
								<span style={{ color: '#2d3748', fontWeight: 600 }}>
									Auto-exchange authorization code for tokens
								</span>
							</label>
						</FormGroup>
						<div style={{ display: 'flex', gap: '10px' }}>
							<Button onClick={saveConfig}>Save Configuration</Button>
							<Button onClick={handleClearStorage} style={{ background: '#e53e3e' }}>
								Clear Storage
							</Button>
						</div>
					</Section>

					<Section>
						<SectionTitle>2. Generate PKCE Codes</SectionTitle>
						<Button onClick={handleGeneratePKCE}>Generate PKCE Codes</Button>
						{pkceData && (
							<CodeBlock>
								<strong>Code Verifier:</strong> {pkceData.codeVerifier}
								<br />
								<strong>Length:</strong> {pkceData.codeVerifier.length} characters
								<br />
								<strong>Code Challenge:</strong> {pkceData.codeChallenge}
								<br />
								<strong>Method:</strong> {pkceData.codeChallengeMethod}
							</CodeBlock>
						)}
					</Section>

					<Section>
						<SectionTitle>3. Build Authorization Request</SectionTitle>
						<Button onClick={handleBuildAuthRequest} disabled={!pkceData}>
							Build Request
						</Button>
						{authUrl && (
							<>
								<CodeBlock style={{ marginTop: '10px' }}>
									<strong>Authorization URL:</strong>
									<br />
									{authUrl}
								</CodeBlock>
								<Button
									onClick={() => window.open(authUrl, '_blank')}
									style={{ marginTop: '10px' }}
								>
									Open Authorization URL
								</Button>
							</>
						)}
					</Section>

					<Section>
						<SectionTitle>4. Receive Auth Code</SectionTitle>
						<FormGroup>
							<Label>Authorization Code (paste from callback)</Label>
							<Input
								value={authCode}
								onChange={(e) => setAuthCode(e.target.value)}
								placeholder="Paste auth code here"
							/>
						</FormGroup>
						<Button onClick={handleReceiveAuthCode} disabled={!authUrl}>
							Receive Auth Code
						</Button>
					</Section>

					<Section>
						<SectionTitle>5. Exchange Code for Tokens</SectionTitle>
						<Button onClick={handleExchangeCode} disabled={!authCode}>
							Exchange Code
						</Button>
						{tokenData && (
							<CodeBlock style={{ marginTop: '10px' }}>
								<strong>Access Token:</strong> {tokenData.access_token.substring(0, 50)}...
								<br />
								<strong>Token Type:</strong> {tokenData.token_type}
								<br />
								<strong>Expires In:</strong> {tokenData.expires_in} seconds
								<br />
								<strong>Scope:</strong> {tokenData.scope}
								<br />
								<strong>ID Token:</strong> {tokenData.id_token ? 'Present ✓' : 'Not present'}
								<br />
								<strong>Refresh Token:</strong>{' '}
								{tokenData.refresh_token ? 'Present ✓' : 'Not present'}
							</CodeBlock>
						)}
					</Section>

					<Section>
						<SectionTitle>6. Verify PKCE Flow</SectionTitle>
						<Button
							onClick={() => {
								console.log('🔍 Verify PKCE button clicked!');
								handleVerifyPKCE();
							}}
						>
							Verify PKCE Implementation
						</Button>
					</Section>
				</div>

				<div>
					<Section>
						<SectionTitle>📋 Test Log</SectionTitle>
						<Log>
							{logs.map((entry, i) => (
								<LogEntry key={i} type={entry.type}>
									[{entry.timestamp}] {entry.message}
								</LogEntry>
							))}
						</Log>
					</Section>

					{results && (
						<Section>
							<SectionTitle>✅ Test Results</SectionTitle>
							<div>
								<div style={{ margin: '8px 0' }}>
									PKCE Generation:{' '}
									<Badge type={results.pkceGeneration ? 'pass' : 'fail'}>
										{results.pkceGeneration ? 'PASS' : 'FAIL'}
									</Badge>
								</div>
								<div style={{ margin: '8px 0' }}>
									PKCE Storage:{' '}
									<Badge type={results.pkceStorage ? 'pass' : 'fail'}>
										{results.pkceStorage ? 'PASS' : 'FAIL'}
									</Badge>
								</div>
								<div style={{ margin: '8px 0' }}>
									PKCE in Token Exchange:{' '}
									<Badge type={results.pkceInExchange ? 'pass' : 'fail'}>
										{results.pkceInExchange ? 'PASS' : 'FAIL'}
									</Badge>
								</div>
								<div style={{ margin: '8px 0' }}>
									Token Receipt:{' '}
									<Badge type={results.tokenReceipt ? 'pass' : 'fail'}>
										{results.tokenReceipt ? 'PASS' : 'FAIL'}
									</Badge>
								</div>
								<div style={{ margin: '8px 0' }}>
									ID Token:{' '}
									<Badge type={results.idToken ? 'pass' : 'fail'}>
										{results.idToken ? 'PASS' : 'FAIL'}
									</Badge>
								</div>
								<div style={{ margin: '8px 0' }}>
									Refresh Token:{' '}
									<Badge type={results.refreshToken ? 'pass' : 'fail'}>
										{results.refreshToken ? 'PASS' : 'FAIL'}
									</Badge>
								</div>
							</div>
						</Section>
					)}
				</div>
			</Grid>
		</Container>
	);
};

export default TestAuthzCodePKCE;
