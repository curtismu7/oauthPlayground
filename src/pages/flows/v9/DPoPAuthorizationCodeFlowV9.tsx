import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { usePageScroll } from '../../../hooks/usePageScroll';
import { V9CredentialStorageService } from '../../../services/v9/V9CredentialStorageService';
import V9FlowUIService from '../../../services/v9/v9FlowUIService';
import type { DiscoveredApp } from '../../../v8/components/AppPickerV8';
import { CompactAppPickerV8U } from '../../../v8u/components/CompactAppPickerV8U';

// V9 Flow Components
const {
	Container,
	StepHeader,
	StepHeaderLeft,
	StepHeaderRight,
	VersionBadge,
	StepHeaderTitle,
	StepHeaderSubtitle,
	StepNumber,
	StepTotal,
	Button,
} = V9FlowUIService.getFlowUIComponents();

// Mock DPoP server implementation
class MockDpopServer {
	private state: {
		isRunning: boolean;
		logs: Array<{ timestamp: number; level: string; message: string }>;
		nonce: string;
		authCodes: Map<string, { clientId: string; expiresAt: number }>;
		tokens: Map<string, { accessToken: string; tokenType: string; expiresIn: number; jkt: string }>;
	} = {
		isRunning: false,
		logs: [],
		nonce: 'demo-nonce-12345',
		authCodes: new Map(),
		tokens: new Map(),
	};

	addLog(level: string, message: string) {
		this.state.logs.push({
			timestamp: Date.now(),
			level,
			message,
		});
	}

	getLogs() {
		return this.state.logs;
	}

	getNonce() {
		return this.state.nonce;
	}

	generateAuthCode(clientId: string) {
		const authCode = `demo-auth-code-${Math.random().toString(36).substring(2, 15)}`;
		this.state.authCodes.set(authCode, {
			clientId,
			expiresAt: Date.now() + 60000, // 1 minute
		});
		this.addLog('info', `Generated auth code for client: ${clientId}`);
		return authCode;
	}

	exchangeCodeForToken(authCode: string, _dpopProof: string) {
		const codeData = this.state.authCodes.get(authCode);
		if (!codeData || codeData.expiresAt < Date.now()) {
			this.addLog('error', 'Invalid or expired auth code');
			return null;
		}

		// Mock token exchange with DPoP binding
		const accessToken = `dpop-access-token-${Math.random().toString(36).substring(2, 15)}`;
		const tokenData = {
			access_token: accessToken,
			token_type: 'DPoP',
			expires_in: 3600,
			scope: 'openid profile email',
		};

		// Store token with DPoP confirmation
		this.state.tokens.set(accessToken, {
			accessToken,
			tokenType: 'DPoP',
			expiresIn: 3600,
			jkt: 'demo-jkt-thumbprint',
		});

		this.state.authCodes.delete(authCode);
		this.addLog('success', 'Token exchanged successfully with DPoP binding');
		return tokenData;
	}

	introspectToken(accessToken: string, _dpopProof: string) {
		const tokenData = this.state.tokens.get(accessToken);
		if (!tokenData) {
			this.addLog('error', 'Token not found or invalid');
			return null;
		}

		// Mock introspection with DPoP confirmation
		const result = {
			active: true,
			client_id: 'demo-client-id',
			token_type: tokenData.tokenType,
			exp: Math.floor(Date.now() / 1000) + tokenData.expiresIn,
			iat: Math.floor(Date.now() / 1000),
			jkt: tokenData.jkt,
			dpop_confirmation: true,
		};

		this.addLog('success', 'Token introspection completed with DPoP confirmation');
		return result;
	}
}

const DPoPAuthorizationCodeFlowV9: React.FC = () => {
	// Initialize V9 services
	usePageScroll();

	const [params, setParams] = useState({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		redirectUri: 'http://localhost:3000/callback',
		scope: 'openid profile email',
		dpopJwk: '',
		dpopPrivateKey: '',
		authCode: '',
		accessToken: '',
		idToken: '',
		tokenType: '',
		expiresIn: 0,
		currentStep: 0,
	});

	const [mockServer] = useState(() => new MockDpopServer());
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	// Load saved credentials on mount
	useEffect(() => {
		const synced = V9CredentialStorageService.loadSync('v9:dpop-auth-code');
		if (synced) {
			setParams((p) => ({ ...p, ...synced }));
		}
		V9CredentialStorageService.load('v9:dpop-auth-code').then((creds) => {
			if (creds) {
				setParams((p) => ({ ...p, ...creds }));
			}
		});
	}, []);

	// Save credentials when they change
	const saveCredentials = useCallback(async () => {
		if (!params.environmentId) return;

		const credentials: Record<string, unknown> = {
			environmentId: params.environmentId,
			clientId: params.clientId,
			clientSecret: params.clientSecret,
			redirectUri: params.redirectUri,
			scope: params.scope,
		};

		await V9CredentialStorageService.save('v9:dpop-auth-code', credentials, {
			environmentId: credentials.environmentId as string,
		});
	}, [params]);

	const resetFlow = useCallback(() => {
		setParams((p) => ({
			...p,
			authCode: '',
			accessToken: '',
			idToken: '',
			tokenType: '',
			expiresIn: 0,
			currentStep: 0,
		}));
		setError('');
		mockServer.addLog('info', 'Flow reset');
	}, [mockServer]);

	const generateDPoPKey = useCallback(async (): Promise<void> => {
		setIsLoading(true);
		setError('');

		try {
			// Mock key generation - in real implementation, use proper crypto libraries
			const jwk = {
				kty: 'RSA',
				e: 'AQAB',
				n: 'mock_public_key_for_demo_purposes',
				kid: 'demo-key-id',
			};

			const privateKey = 'mock_private_key_for_demo_purposes';

			const newParams = {
				...params,
				dpopJwk: JSON.stringify(jwk, null, 2),
				dpopPrivateKey: privateKey,
				currentStep: 1,
			};

			setParams(newParams);
			await saveCredentials();
			mockServer.addLog('success', 'Generated DPoP key pair');
		} catch (err) {
			setError(`Failed to generate DPoP keys: ${err}`);
			mockServer.addLog('error', `Key generation failed: ${err}`);
		} finally {
			setIsLoading(false);
		}
	}, [params, saveCredentials, mockServer]);

	const createDPoPProof = useCallback(
		async (url: string, httpMethod: string): Promise<string> => {
			if (!params.dpopPrivateKey) {
				throw new Error('DPoP private key not generated');
			}

			// Mock DPoP proof generation
			const header = {
				alg: 'RS256',
				typ: 'dpop+jwt',
				jwk: JSON.parse(params.dpopJwk),
			};

			const payload = {
				htm: httpMethod,
				htu: url,
				nonce: mockServer.getNonce(),
				iat: Math.floor(Date.now() / 1000),
			};

			// In real implementation, sign with private key
			const dpopProof = `mock_dpop_proof_${JSON.stringify(header)}.${JSON.stringify(payload)}.mock_signature`;

			mockServer.addLog('info', `Generated DPoP proof for ${httpMethod} ${url}`);
			return dpopProof;
		},
		[params.dpopJwk, params.dpopPrivateKey, mockServer]
	);

	const initiateAuthorization = useCallback(async () => {
		setIsLoading(true);
		setError('');

		try {
			const authCode = mockServer.generateAuthCode(params.clientId);
			const newParams = {
				...params,
				authCode,
				currentStep: 2,
			};

			setParams(newParams);
			await saveCredentials();
			mockServer.addLog('success', 'Authorization initiated');
		} catch (err) {
			setError(`Authorization failed: ${err}`);
			mockServer.addLog('error', `Authorization failed: ${err}`);
		} finally {
			setIsLoading(false);
		}
	}, [params, saveCredentials, mockServer]);

	const exchangeToken = useCallback(async () => {
		setIsLoading(true);
		setError('');

		try {
			const dpopProof = await createDPoPProof('/token', 'POST');
			const tokenData = mockServer.exchangeCodeForToken(params.authCode, dpopProof);

			if (!tokenData) {
				throw new Error('Token exchange failed');
			}

			const newParams = {
				...params,
				accessToken: tokenData.access_token,
				tokenType: tokenData.token_type,
				expiresIn: tokenData.expires_in,
				currentStep: 3,
			};

			setParams(newParams);
			await saveCredentials();
			mockServer.addLog('success', 'Token exchange completed');
		} catch (err) {
			setError(`Token exchange failed: ${err}`);
			mockServer.addLog('error', `Token exchange failed: ${err}`);
		} finally {
			setIsLoading(false);
		}
	}, [params, saveCredentials, mockServer, createDPoPProof]);

	const introspectToken = useCallback(async () => {
		setIsLoading(true);
		setError('');

		try {
			const dpopProof = await createDPoPProof('/introspect', 'POST');
			const introspectionResult = mockServer.introspectToken(params.accessToken, dpopProof);

			if (!introspectionResult) {
				throw new Error('Token introspection failed');
			}

			setParams((p) => ({ ...p, currentStep: 4 }));
			mockServer.addLog('success', 'Token introspection completed');
		} catch (err) {
			setError(`Token introspection failed: ${err}`);
			mockServer.addLog('error', `Token introspection failed: ${err}`);
		} finally {
			setIsLoading(false);
		}
	}, [params, mockServer, createDPoPProof]);

	const handleParamsChange = useCallback(
		async (newParams: Record<string, unknown>) => {
			const updated = { ...params, ...newParams };
			setParams(updated);
			if (updated.environmentId) {
				await saveCredentials();
			}
		},
		[params, saveCredentials]
	);

	const handleAppSelected = useCallback(
		(app: DiscoveredApp) => {
			handleParamsChange({
				clientId: app.id,
				environmentId: params.environmentId || app.id, // Use app.id as fallback
			});
		},
		[handleParamsChange, params.environmentId]
	);

	const steps = [
		{ title: 'Configure Credentials', description: 'Set up OAuth client and DPoP keys' },
		{ title: 'Generate DPoP Keys', description: 'Create DPoP key pair for proof generation' },
		{ title: 'Authorize with DPoP', description: 'Initiate authorization with DPoP binding' },
		{
			title: 'Exchange for Token',
			description: 'Exchange authorization code for DPoP-bound token',
		},
		{ title: 'Verify Token', description: 'Introspect token with DPoP proof' },
	];

	return (
		<Container>
			<StepHeader>
				<StepHeaderLeft>
					<VersionBadge>V9</VersionBadge>
					<StepHeaderTitle>DPoP Authorization Code Flow</StepHeaderTitle>
					<StepHeaderSubtitle>
						OAuth 2.0 Demonstrating Proof of Possession (RFC 9449)
					</StepHeaderSubtitle>
				</StepHeaderLeft>
				<StepHeaderRight>
					<StepNumber>{String(params.currentStep + 1).padStart(2, '0')}</StepNumber>
					<StepTotal>of {String(steps.length).padStart(2, '0')}</StepTotal>
				</StepHeaderRight>
			</StepHeader>

			<div>
				{/* Credentials Panel */}
				<div style={{ marginBottom: '2rem' }}>
					<h3 style={{ color: 'V9_COLORS.PRIMARY.BLUE_DARK', marginBottom: '1rem' }}>Credentials Configuration</h3>

					<CompactAppPickerV8U
						environmentId={params.environmentId}
						onAppSelected={handleAppSelected}
					/>

					<div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
						<div>
							<label
								htmlFor="environmentId"
								style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}
							>
								Environment ID
							</label>
							<input
								id="environmentId"
								type="text"
								value={params.environmentId}
								onChange={(e) => handleParamsChange({ environmentId: e.target.value })}
								placeholder="Enter Environment ID"
								style={{
									width: '100%',
									padding: '0.5rem',
									border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
									borderRadius: '0.375rem',
									fontSize: '0.875rem',
								}}
							/>
						</div>

						<div>
							<label
								htmlFor="clientId"
								style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}
							>
								Client ID
							</label>
							<input
								id="clientId"
								type="text"
								value={params.clientId}
								onChange={(e) => handleParamsChange({ clientId: e.target.value })}
								placeholder="Enter Client ID"
								style={{
									width: '100%',
									padding: '0.5rem',
									border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
									borderRadius: '0.375rem',
									fontSize: '0.875rem',
								}}
							/>
						</div>

						<div>
							<label
								htmlFor="clientSecret"
								style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}
							>
								Client Secret
							</label>
							<input
								id="clientSecret"
								type="password"
								value={params.clientSecret}
								onChange={(e) => handleParamsChange({ clientSecret: e.target.value })}
								placeholder="Enter Client Secret"
								style={{
									width: '100%',
									padding: '0.5rem',
									border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
									borderRadius: '0.375rem',
									fontSize: '0.875rem',
								}}
							/>
						</div>

						<div>
							<label
								htmlFor="redirectUri"
								style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}
							>
								Redirect URI
							</label>
							<input
								id="redirectUri"
								type="text"
								value={params.redirectUri}
								onChange={(e) => handleParamsChange({ redirectUri: e.target.value })}
								placeholder="Enter Redirect URI"
								style={{
									width: '100%',
									padding: '0.5rem',
									border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
									borderRadius: '0.375rem',
									fontSize: '0.875rem',
								}}
							/>
						</div>

						<div>
							<label
								htmlFor="scope"
								style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}
							>
								Scope
							</label>
							<input
								id="scope"
								type="text"
								value={params.scope}
								onChange={(e) => handleParamsChange({ scope: e.target.value })}
								placeholder="Enter scopes (space-separated)"
								style={{
									width: '100%',
									padding: '0.5rem',
									border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
									borderRadius: '0.375rem',
									fontSize: '0.875rem',
								}}
							/>
						</div>
					</div>

					<Button onClick={generateDPoPKey} disabled={isLoading} style={{ marginTop: '1rem' }}>
						{isLoading ? 'Generating...' : 'Generate DPoP Keys'}
					</Button>
				</div>

				{/* Step 1: DPoP Keys Generated */}
				{params.currentStep === 1 && (
					<div>
						<h3 style={{ color: 'V9_COLORS.PRIMARY.BLUE_DARK', marginBottom: '1rem' }}>DPoP Key Pair Generated</h3>
						<p style={{ marginBottom: '1rem', color: 'V9_COLORS.TEXT.GRAY_MEDIUM' }}>
							Your DPoP key pair has been generated. The public key is:
						</p>
						<p style={{ marginBottom: '1rem' }}>
							<code
								style={{
									background: '#f3f4f6',
									padding: '0.25rem 0.5rem',
									borderRadius: '0.25rem',
									fontSize: '0.875rem',
								}}
							>
								{params.dpopJwk.substring(0, 100)}...
							</code>
						</p>

						<Button onClick={initiateAuthorization} disabled={isLoading}>
							{isLoading ? 'Authorizing...' : 'Initiate Authorization'}
						</Button>
					</div>
				)}

				{/* Step 2: Authorization Code Received */}
				{params.currentStep === 2 && (
					<div>
						<h3 style={{ color: 'V9_COLORS.PRIMARY.BLUE_DARK', marginBottom: '1rem' }}>Authorization Code Received</h3>
						<p style={{ marginBottom: '1rem', color: 'V9_COLORS.TEXT.GRAY_MEDIUM' }}>
							Authorization Code:{' '}
							<code
								style={{
									background: '#f3f4f6',
									padding: '0.25rem 0.5rem',
									borderRadius: '0.25rem',
								}}
							>
								{params.authCode}
							</code>
						</p>

						<Button onClick={exchangeToken} disabled={isLoading}>
							{isLoading ? 'Exchanging...' : 'Exchange for Access Token'}
						</Button>
					</div>
				)}

				{/* Step 3: Token Received */}
				{params.currentStep === 3 && (
					<div>
						<h3 style={{ color: 'V9_COLORS.PRIMARY.BLUE_DARK', marginBottom: '1rem' }}>DPoP-Bound Access Token</h3>
						<p style={{ marginBottom: '1rem', color: 'V9_COLORS.TEXT.GRAY_MEDIUM' }}>
							Access Token:{' '}
							<code
								style={{
									background: '#f3f4f6',
									padding: '0.25rem 0.5rem',
									borderRadius: '0.25rem',
								}}
							>
								{params.accessToken.substring(0, 20)}...
							</code>
						</p>
						<p style={{ marginBottom: '1rem', color: 'V9_COLORS.TEXT.GRAY_MEDIUM' }}>
							Token Type: <strong>{params.tokenType}</strong>
						</p>
						<p style={{ marginBottom: '1rem', color: 'V9_COLORS.TEXT.GRAY_MEDIUM' }}>
							Expires in: <strong>{params.expiresIn} seconds</strong>
						</p>

						<Button onClick={introspectToken} disabled={isLoading}>
							{isLoading ? 'Introspecting...' : 'Verify Token'}
						</Button>
					</div>
				)}

				{/* Step 4: Complete */}
				{params.currentStep === 4 && (
					<div>
						<h3 style={{ color: 'V9_COLORS.PRIMARY.GREEN', marginBottom: '1rem' }}>
							✅ DPoP Flow Completed Successfully!
						</h3>
						<p style={{ marginBottom: '1rem', color: 'V9_COLORS.TEXT.GRAY_MEDIUM' }}>
							You have successfully completed the DPoP Authorization Code Flow. The access token is
							cryptographically bound to your DPoP key pair.
						</p>

						<Button onClick={resetFlow} $variant="secondary">
							Start Over
						</Button>
					</div>
				)}

				{/* Error Display */}
				{error && (
					<div
						style={{
							background: 'V9_COLORS.BG.ERROR',
							border: '1px solid V9_COLORS.BG.ERROR_BORDER',
							borderRadius: '0.5rem',
							padding: '1rem',
							marginBottom: '1rem',
							color: 'V9_COLORS.PRIMARY.RED_DARK',
						}}
					>
						<strong>Error:</strong> {error}
					</div>
				)}

				{/* Server Logs */}
				<div style={{ marginTop: '2rem' }}>
					<h3 style={{ color: 'V9_COLORS.PRIMARY.BLUE_DARK', marginBottom: '1rem' }}>Mock Server Logs</h3>
					<div
						style={{
							background: 'V9_COLORS.TEXT.GRAY_DARK',
							color: '#f3f4f6',
							borderRadius: '0.5rem',
							padding: '1rem',
							maxHeight: '300px',
							overflow: 'auto',
							fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
							fontSize: '0.75rem',
							lineHeight: '1.4',
						}}
					>
						{mockServer
							.getLogs()
							.map((log: { timestamp: number; level: string; message: string }, index: number) => (
								<div key={index} style={{ marginBottom: '0.5rem' }}>
									<span style={{ color: 'V9_COLORS.TEXT.GRAY_LIGHT' }}>
										{new Date(log.timestamp).toLocaleTimeString()}
									</span>{' '}
									<span
										style={{
											color:
												log.level === 'error'
													? 'V9_COLORS.PRIMARY.RED'
													: log.level === 'success'
														? 'V9_COLORS.PRIMARY.GREEN'
														: 'V9_COLORS.PRIMARY.BLUE',
										}}
									>
										[{log.level.toUpperCase()}]
									</span>{' '}
									{log.message}
								</div>
							))}
					</div>
				</div>

				{/* Educational Content */}
				<div style={{ marginTop: '2rem' }}>
					<h3 style={{ color: 'V9_COLORS.PRIMARY.BLUE_DARK', marginBottom: '1rem' }}>Learn More About DPoP</h3>

					<div
						style={{
							background: 'V9_COLORS.BG.GRAY_LIGHT',
							border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
							borderRadius: '0.5rem',
							padding: '1rem',
							marginBottom: '1rem',
						}}
					>
						<h4 style={{ color: 'V9_COLORS.PRIMARY.BLUE_DARK', marginBottom: '0.5rem' }}>Official Resources:</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
							<li>
								<a
									href="https://www.rfc-editor.org/rfc/rfc9449.html"
									target="_blank"
									rel="noopener noreferrer"
									style={{ color: 'V9_COLORS.PRIMARY.BLUE_DARK', textDecoration: 'underline' }}
								>
									RFC 9449 - OAuth 2.0 Demonstrating Proof of Possession (DPoP)
								</a>
							</li>
							<li>
								<a
									href="https://www.pingidentity.com/pingone/"
									target="_blank"
									rel="noopener noreferrer"
									style={{ color: 'V9_COLORS.PRIMARY.BLUE_DARK', textDecoration: 'underline' }}
								>
									PingOne Documentation
								</a>
							</li>
						</ul>
					</div>

					<div
						style={{
							background: 'V9_COLORS.BG.GRAY_LIGHT',
							border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
							borderRadius: '0.5rem',
							padding: '1rem',
							marginBottom: '1rem',
						}}
					>
						<h4 style={{ color: 'V9_COLORS.PRIMARY.BLUE_DARK', marginBottom: '0.5rem' }}>Key Concepts:</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
							<li>
								<strong>DPoP Proof JWT:</strong> Signed JWT demonstrating key possession
							</li>
							<li>
								<strong>Token Binding:</strong> Access tokens bound to public keys
							</li>
							<li>
								<strong>Nonce:</strong> Server-provided value to prevent pre-computed proofs
							</li>
							<li>
								<strong>HTM:</strong> HTTP method and target URI
							</li>
							<li>
								<strong>JKT:</strong> JSON Web Key Thumbprint for key identification
							</li>
						</ul>
					</div>

					<div
						style={{
							background: '#fefce8',
							border: '1px solid #fde047',
							borderRadius: '0.5rem',
							padding: '1rem',
						}}
					>
						<h4 style={{ color: '#a16207', marginBottom: '0.5rem' }}>Implementation Notes:</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#a16207' }}>
							<li>This demo uses mock cryptography for educational purposes</li>
							<li>Real implementations should use proper crypto libraries</li>
							<li>DPoP complements but does not replace TLS security</li>
							<li>PingOne does not currently support DPoP natively</li>
						</ul>
					</div>
				</div>
			</div>
		</Container>
	);
};

export default DPoPAuthorizationCodeFlowV9;
