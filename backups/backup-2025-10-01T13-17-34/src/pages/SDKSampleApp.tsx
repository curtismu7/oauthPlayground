import { OidcClient } from '@pingidentity-developers-experience/ping-oidc-client-sdk';
import React, { useEffect, useRef, useState } from 'react';
import { FiExternalLink, FiInfo, FiLogOut, FiRefreshCw, FiSettings, FiUser } from 'react-icons/fi';
import styled from 'styled-components';

// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: #f8f9fa;
  min-height: 100vh;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, #ffffff, #e0e7ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.9;
`;

const ContentCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-right: 0.75rem;
  margin-bottom: 0.75rem;
  
  ${({ variant = 'primary' }) => {
		switch (variant) {
			case 'primary':
				return `
          background: #3b82f6;
          color: white;
          &:hover {
            background: #2563eb;
          }
        `;
			case 'secondary':
				return `
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          &:hover {
            background: #e5e7eb;
          }
        `;
			case 'danger':
				return `
          background: #ef4444;
          color: white;
          &:hover {
            background: #dc2626;
          }
        `;
		}
	}}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatusCard = styled.div<{ type: 'success' | 'error' | 'info' | 'warning' }>`
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  ${({ type }) => {
		switch (type) {
			case 'success':
				return `
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        `;
			case 'error':
				return `
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
        `;
			case 'warning':
				return `
          background: #fffbeb;
          border: 1px solid #fed7aa;
          color: #d97706;
        `;
			case 'info':
				return `
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
        `;
		}
	}}
`;

const TokenDisplay = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.8rem;
  word-break: break-all;
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;
`;

const InfoBox = styled.div`
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SDKSampleApp: React.FC = () => {
	const [client, setClient] = useState<OidcClient | null>(null);
	const [token, setToken] = useState<any>(null);
	const [userInfo, setUserInfo] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	// Configuration state
	const [config, setConfig] = useState({
		clientId: '',
		environmentId: '',
		redirectUri: window.location.origin + '/sdk-sample-app',
		scopes: 'openid profile email',
		usePopup: false,
	});

	// Track if configuration has been saved
	const [configSaved, setConfigSaved] = useState(false);

	// Load saved configuration on component mount
	useEffect(() => {
		const savedConfig = localStorage.getItem('sdk-sample-config');
		if (savedConfig) {
			try {
				const parsed = JSON.parse(savedConfig);
				setConfig(parsed);
				setConfigSaved(true);
				console.log(' [SDK] Loaded saved configuration');
			} catch (error) {
				console.error(' [SDK] Failed to parse saved configuration:', error);
			}
		} else {
			// Try to load from global configuration
			try {
				const globalConfig = localStorage.getItem('pingone_permanent_credentials');
				if (globalConfig) {
					const parsed = JSON.parse(globalConfig);
					const newConfig = {
						clientId: parsed.clientId || '',
						environmentId: parsed.environmentId || '',
						redirectUri: parsed.redirectUri || window.location.origin + '/sdk-sample-app',
						scopes: Array.isArray(parsed.scopes)
							? parsed.scopes.join(' ')
							: parsed.scopes || 'openid profile email',
						usePopup: false,
					};
					setConfig(newConfig);
					console.log(' [SDK] Loaded configuration from global settings');
				}
			} catch (error) {
				console.log('Could not load global configuration for SDK sample');
			}
		}
	}, []);

	// Save configuration function
	const saveConfiguration = () => {
		try {
			localStorage.setItem('sdk-sample-config', JSON.stringify(config));
			setConfigSaved(true);
			setSuccess('Configuration saved successfully! It will persist across browser restarts.');
			console.log(' [SDK] Configuration saved to localStorage');
		} catch (error) {
			setError('Failed to save configuration. Please check your browser settings.');
			console.error(' [SDK] Failed to save configuration:', error);
		}
	};

	// Clear saved configuration
	const clearConfiguration = () => {
		try {
			localStorage.removeItem('sdk-sample-config');
			setConfigSaved(false);
			setSuccess('Configuration cleared. You can now enter new settings.');
			console.log(' [SDK] Configuration cleared from localStorage');
		} catch (error) {
			setError('Failed to clear configuration.');
			console.error(' [SDK] Failed to clear configuration:', error);
		}
	};

	const initializeClient = async () => {
		try {
			setLoading(true);
			setError(null);

			if (!config.clientId || !config.environmentId) {
				throw new Error('Client ID and Environment ID are required');
			}

			// Validate environment ID format (should be a UUID)
			const uuidRegex =
				/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
			if (!uuidRegex.test(config.environmentId)) {
				throw new Error(
					'Environment ID must be a valid UUID format (e.g., abc12345-6789-4abc-def0-1234567890ab)'
				);
			}

			const wellKnownUrl = `https://auth.pingone.com/${config.environmentId}/as/.well-known/openid_configuration`;

			console.log(' [SDK] Initializing client with:', {
				clientId: config.clientId,
				environmentId: config.environmentId,
				redirectUri: config.redirectUri,
				scopes: config.scopes,
				wellKnownUrl,
			});

			const client = await OidcClient.initializeFromOpenIdConfig(
				{
					client_id: config.clientId,
					redirect_uri: config.redirectUri,
					scope: config.scopes,
					usePkce: true,
					logLevel: 'info',
				},
				wellKnownUrl
			);

			setClient(client);
			setSuccess('SDK Client initialized successfully!');

			// Check if we have tokens from a previous session
			const existingToken = await client.getToken();
			if (existingToken) {
				setToken(existingToken);
				setSuccess('Found existing tokens from previous session');
			}
		} catch (err: any) {
			console.error(' [SDK] Initialization error:', err);
			let errorMessage = 'Failed to initialize SDK: ';

			if (err.message) {
				errorMessage += err.message;
			} else if (err.toString && err.toString() !== '[object Object]') {
				errorMessage += err.toString();
			} else {
				errorMessage += 'Unknown error occurred. Please check your configuration.';
			}

			setError(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	const handleLogin = async () => {
		try {
			setLoading(true);
			setError(null);

			if (!client) {
				throw new Error('Please initialize the SDK client first');
			}

			let tokenResponse;

			if (config.usePopup) {
				// Create popup window
				const popup = window.open(
					'',
					'auth-popup',
					'width=500,height=600,scrollbars=yes,resizable=yes'
				);

				if (!popup) {
					throw new Error('Popup blocked. Please allow popups for this site.');
				}

				tokenResponse = await client.authorizeWithPopup(popup);
			} else {
				// Full page redirect
				await client.authorize();
				return; // This will redirect the page
			}

			setToken(tokenResponse);
			setSuccess('Login successful!');
		} catch (err: any) {
			console.error(' [SDK] Login error:', err);
			let errorMessage = 'Login failed: ';

			if (err.message) {
				errorMessage += err.message;
			} else if (err.toString && err.toString() !== '[object Object]') {
				errorMessage += err.toString();
			} else {
				errorMessage += 'Unknown error occurred during login.';
			}

			setError(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = async () => {
		try {
			setLoading(true);
			setError(null);

			if (!client) {
				throw new Error('No client initialized');
			}

			if (config.usePopup) {
				const popup = window.open(
					'',
					'logout-popup',
					'width=500,height=600,scrollbars=yes,resizable=yes'
				);
				if (popup) {
					await client.endSessionWithPopup(popup);
				}
			} else {
				await client.endSession();
				return; // This will redirect the page
			}

			setToken(null);
			setUserInfo(null);
			setSuccess('Logout successful!');
		} catch (err: any) {
			setError(`Logout failed: ${err.message}`);
		} finally {
			setLoading(false);
		}
	};

	const fetchUserInfo = async () => {
		try {
			setLoading(true);
			setError(null);

			if (!client || !token) {
				throw new Error('Please login first');
			}

			const info = await client.fetchUserInfo();
			setUserInfo(info);
			setSuccess('User info fetched successfully!');
		} catch (err: any) {
			setError(`Failed to fetch user info: ${err.message}`);
		} finally {
			setLoading(false);
		}
	};

	const refreshToken = async () => {
		try {
			setLoading(true);
			setError(null);

			if (!client) {
				throw new Error('No client initialized');
			}

			const newToken = await client.getToken();
			setToken(newToken);
			setSuccess('Token refreshed successfully!');
		} catch (err: any) {
			setError(`Token refresh failed: ${err.message}`);
		} finally {
			setLoading(false);
		}
	};

	const clearTokens = () => {
		setToken(null);
		setUserInfo(null);
		setSuccess('Tokens cleared from memory');
	};

	// Check for tokens on page load (handles redirect from auth server)
	useEffect(() => {
		const checkForTokens = async () => {
			if (client) {
				try {
					const existingToken = await client.getToken();
					if (existingToken) {
						setToken(existingToken);
						setSuccess('Found tokens from redirect');
					}
				} catch (err) {
					// No tokens found, that's okay
				}
			}
		};

		checkForTokens();
	}, [client]);

	return (
		<Container>
			<Header>
				<Title> PingOne OIDC SDK Sample App</Title>
				<Subtitle>
					Interactive demonstration of the PingOne OIDC Client SDK with real authentication flows
				</Subtitle>
			</Header>

			<InfoBox>
				<strong> About this Sample App:</strong>
				<p>
					This sample application demonstrates how to use the PingOne OIDC Client SDK in a real web
					application. It includes authentication, token management, user info fetching, and logout
					functionality.
				</p>

				<div style={{ marginTop: '1rem' }}>
					<strong> Related Resources:</strong>
					<ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
						<li>
							<a
								href="https://github.com/ForgeRock/sdk-sample-apps"
								target="_blank"
								rel="noopener noreferrer"
							>
								ForgeRock SDK Sample Apps{' '}
								<FiExternalLink style={{ display: 'inline', marginLeft: '4px' }} />
							</a>
							<span style={{ fontSize: '0.875rem', color: '#6b7280', marginLeft: '0.5rem' }}>
								- Collection of SDK sample applications from ForgeRock
							</span>
						</li>
						<li>
							<a
								href="https://github.com/pingidentity-developers-experience/ping-oidc-client-sdk"
								target="_blank"
								rel="noopener noreferrer"
							>
								PingOne OIDC Client SDK{' '}
								<FiExternalLink style={{ display: 'inline', marginLeft: '4px' }} />
							</a>
							<span style={{ fontSize: '0.875rem', color: '#6b7280', marginLeft: '0.5rem' }}>
								- Official PingOne OIDC Client SDK repository
							</span>
						</li>
						<li>
							<a
								href="https://docs.pingidentity.com/sdks/latest/oidc/tutorials/javascript/pingone/index.html"
								target="_blank"
								rel="noopener noreferrer"
							>
								PingOne SDK Documentation{' '}
								<FiExternalLink style={{ display: 'inline', marginLeft: '4px' }} />
							</a>
							<span style={{ fontSize: '0.875rem', color: '#6b7280', marginLeft: '0.5rem' }}>
								- Official documentation and tutorials
							</span>
						</li>
					</ul>
				</div>

				<div
					style={{
						marginTop: '1rem',
						padding: '0.75rem',
						backgroundColor: '#fef3c7',
						borderRadius: '6px',
						border: '1px solid #f59e0b',
					}}
				>
					<strong> Need Credentials?</strong>
					<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
						If you have configured the OAuth Playground with your PingOne credentials, they will be
						automatically loaded. Otherwise, you can find your Environment ID and Client ID in the
						PingOne Admin Console under Applications Your App Configuration.
					</p>
				</div>
			</InfoBox>

			{error && (
				<StatusCard type="error">
					<FiInfo />
					{error}
				</StatusCard>
			)}

			{success && (
				<StatusCard type="success">
					<FiInfo />
					{success}
				</StatusCard>
			)}

			<Grid>
				<ContentCard>
					<SectionTitle>
						<FiSettings />
						SDK Configuration
					</SectionTitle>

					<FormGroup>
						<Label>Environment ID *</Label>
						<Input
							type="text"
							value={config.environmentId}
							onChange={(e) => setConfig({ ...config, environmentId: e.target.value })}
							placeholder="e.g., abc12345-6789-4abc-def0-1234567890ab"
						/>
						<div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
							Your PingOne Environment ID (UUID format)
						</div>
					</FormGroup>

					<FormGroup>
						<Label>Client ID *</Label>
						<Input
							type="text"
							value={config.clientId}
							onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
							placeholder="e.g., def67890-1234-5def-0123-4567890abcdef"
						/>
						<div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
							Your PingOne Application Client ID (UUID format)
						</div>
					</FormGroup>

					<FormGroup>
						<Label>Redirect URI</Label>
						<Input
							type="text"
							value={config.redirectUri}
							onChange={(e) => setConfig({ ...config, redirectUri: e.target.value })}
							placeholder="Redirect URI for your application"
						/>
					</FormGroup>

					<FormGroup>
						<Label>Scopes</Label>
						<Input
							type="text"
							value={config.scopes}
							onChange={(e) => setConfig({ ...config, scopes: e.target.value })}
							placeholder="openid profile email"
						/>
					</FormGroup>

					<FormGroup>
						<label
							style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
						>
							<input
								type="checkbox"
								checked={config.usePopup}
								onChange={(e) => setConfig({ ...config, usePopup: e.target.checked })}
							/>
							Use popup for authentication (instead of full page redirect)
						</label>
					</FormGroup>

					{/* Configuration Status */}
					{configSaved && (
						<div
							style={{
								background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
								border: '1px solid #10b981',
								borderRadius: '8px',
								padding: '0.75rem',
								marginBottom: '1rem',
							}}
						>
							<div
								style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#065f46' }}
							>
								<span style={{ fontSize: '1.25rem' }}></span>
								<strong>Configuration Saved</strong>
							</div>
							<p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#047857' }}>
								Your configuration is saved and will persist across browser restarts.
							</p>
						</div>
					)}

					<div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
						<Button onClick={saveConfiguration} variant="primary">
							Save Configuration
						</Button>

						<Button onClick={clearConfiguration} variant="secondary">
							Clear Saved Config
						</Button>

						<Button onClick={initializeClient} disabled={loading}>
							<FiRefreshCw />
							Initialize SDK Client
						</Button>

						<Button
							onClick={async () => {
								if (!config.environmentId) {
									setError('Please enter an Environment ID first');
									return;
								}

								try {
									setLoading(true);
									setError(null);
									const wellKnownUrl = `https://auth.pingone.com/${config.environmentId}/as/.well-known/openid_configuration`;
									const response = await fetch(wellKnownUrl);

									if (response.ok) {
										const config = await response.json();
										setSuccess(
											`Well-known configuration loaded successfully! Found ${Object.keys(config).length} endpoints.`
										);
										console.log(' [SDK] Well-known config:', config);
									} else {
										throw new Error(`HTTP ${response.status}: ${response.statusText}`);
									}
								} catch (err: any) {
									setError(`Failed to fetch well-known configuration: ${err.message}`);
								} finally {
									setLoading(false);
								}
							}}
							disabled={loading || !config.environmentId}
							variant="secondary"
						>
							<FiInfo />
							Test Well-Known Config
						</Button>
					</div>
				</ContentCard>

				<ContentCard>
					<SectionTitle>
						<FiUser />
						Authentication Actions
					</SectionTitle>

					<div style={{ marginBottom: '1rem' }}>
						<Button onClick={handleLogin} disabled={loading || !client} variant="primary">
							<FiUser />
							Login
						</Button>

						<Button onClick={handleLogout} disabled={loading || !token} variant="danger">
							<FiLogOut />
							Logout
						</Button>

						<Button onClick={refreshToken} disabled={loading || !client} variant="secondary">
							<FiRefreshCw />
							Refresh Token
						</Button>

						<Button onClick={clearTokens} disabled={loading} variant="secondary">
							Clear Tokens
						</Button>
					</div>

					<div style={{ marginBottom: '1rem' }}>
						<Button onClick={fetchUserInfo} disabled={loading || !token} variant="secondary">
							<FiUser />
							Fetch User Info
						</Button>
					</div>

					<StatusCard type={client ? 'success' : 'warning'}>
						<FiInfo />
						SDK Status: {client ? 'Initialized' : 'Not Initialized'}
					</StatusCard>

					<StatusCard type={token ? 'success' : 'info'}>
						<FiInfo />
						Authentication: {token ? 'Authenticated' : 'Not Authenticated'}
					</StatusCard>
				</ContentCard>
			</Grid>

			{token && (
				<ContentCard>
					<SectionTitle>
						<FiInfo />
						Access Token
					</SectionTitle>
					<TokenDisplay>{JSON.stringify(token, null, 2)}</TokenDisplay>
				</ContentCard>
			)}

			{userInfo && (
				<ContentCard>
					<SectionTitle>
						<FiUser />
						User Information
					</SectionTitle>
					<TokenDisplay>{JSON.stringify(userInfo, null, 2)}</TokenDisplay>
				</ContentCard>
			)}

			<ContentCard>
				<SectionTitle>
					<FiInfo />
					Implementation Notes
				</SectionTitle>
				<div style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#374151' }}>
					<p>
						<strong>Key Features Demonstrated:</strong>
					</p>
					<ul>
						<li> SDK initialization from OpenID Connect configuration</li>
						<li> PKCE (Proof Key for Code Exchange) for enhanced security</li>
						<li> Both popup and redirect authentication methods</li>
						<li> Token management and refresh</li>
						<li> User info endpoint integration</li>
						<li> Proper logout with session termination</li>
						<li> Error handling and user feedback</li>
					</ul>

					<p>
						<strong>Security Features:</strong>
					</p>
					<ul>
						<li> PKCE is enabled by default for enhanced security</li>
						<li> Tokens are stored securely by the SDK</li>
						<li> Automatic token refresh when needed</li>
						<li> Proper state parameter handling</li>
					</ul>

					<p>
						<strong>Browser Compatibility:</strong>
					</p>
					<ul>
						<li> Mobile devices will use redirect (popups not supported)</li>
						<li> Desktop browsers support both popup and redirect</li>
						<li> HTTPS required for production use</li>
					</ul>
				</div>
			</ContentCard>
		</Container>
	);
};

export default SDKSampleApp;
