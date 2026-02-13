import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.h1`
  color: #333;
  margin-bottom: 2rem;
  font-size: 2.5rem;
`;

const Description = styled.p`
  color: #666;
  margin-bottom: 3rem;
  font-size: 1.1rem;
  line-height: 1.6;
`;

const ExamplesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const ExampleCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
`;

const ExampleTitle = styled.h3`
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.5rem;
`;

const ExampleDescription = styled.p`
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.5;
`;

const Button = styled.button`
  background: #007bff;
  color: #ffffff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  margin-right: 1rem;
  margin-bottom: 1rem;
  transition: background-color 0.2s ease;

  &:hover {
    background: #0056b3;
    color: #ffffff;
  }

  &:disabled {
    background: #6c757d;
    color: #ffffff;
    cursor: not-allowed;
  }
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #6c757d;
  color: #ffffff !important;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  margin-bottom: 2rem;
  transition: background-color 0.2s ease;

  &:hover {
    background: #545b62;
    color: #ffffff !important;
  }
`;

const ResultArea = styled.div`
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 1rem;
  margin-top: 1rem;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;
`;

const StatusMessage = styled.div<{ type: 'success' | 'error' | 'info' }>`
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  
  ${(props) =>
		props.type === 'success' &&
		`
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  `}
  
  ${(props) =>
		props.type === 'error' &&
		`
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  `}
  
  ${(props) =>
		props.type === 'info' &&
		`
    background: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
  `}
`;

const CodeBlock = styled.pre`
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 1rem;
  margin: 1rem 0;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
`;

const FixedStatusPanel = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid #e0e0e0;
  z-index: 1000;
`;

const StatusPanelHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
  font-weight: 600;
  color: #333;
`;

const StatusPanelContent = styled.div`
  padding: 1rem;
`;

const APILogEntry = styled.div`
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.875rem;
`;

const APILogTitle = styled.div`
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
`;

const APILogDetails = styled.div`
  margin-bottom: 0.5rem;
`;

const APILogCode = styled.pre`
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 0.5rem;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
`;

interface APILog {
	id: string;
	timestamp: Date;
	method: string;
	url: string;
	requestHeaders?: Record<string, string>;
	requestBody?: unknown;
	responseStatus?: number;
	responseHeaders?: Record<string, string>;
	responseBody?: unknown;
	error?: string;
}

const OIDCExamples: React.FC = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);
	const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
	const [tokens, setTokens] = useState<{
		access_token: string;
		id_token: string;
		refresh_token: string;
		expires_in: number;
		token_type: string;
		scope: string;
	} | null>(null);
	const [apiLogs, setApiLogs] = useState<APILog[]>([]);

	const showStatus = (type: 'success' | 'error' | 'info', message: string) => {
		setStatus({ type, message });
		setTimeout(() => setStatus(null), 5000);
	};

	const addAPILog = (log: Omit<APILog, 'id' | 'timestamp'>) => {
		const newLog: APILog = {
			...log,
			id: Date.now().toString(),
			timestamp: new Date(),
		};
		setApiLogs((prev) => [newLog, ...prev].slice(0, 50)); // Keep last 50 logs
	};

	const handleOAuthCallback = async (code: string, state: string) => {
		setIsLoading(true);
		
		addAPILog({
			method: 'POST',
			url: 'https://auth.pingone.com/oauth2/token',
			requestHeaders: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Authorization': 'Basic ...', // Base64 encoded client credentials
			},
			requestBody: {
				grant_type: 'authorization_code',
				code: code,
				redirect_uri: 'https://localhost:3000/sdk-examples/oidc-centralized-login',
				state: state,
			},
		});
		
		try {
			// In a real implementation, this would exchange the code for tokens
			// For demo purposes, we'll simulate the token exchange
			const mockTokens = {
				access_token: `mock-access-token-${Date.now()}`,
				id_token: `mock-id-token-${Date.now()}`,
				refresh_token: `mock-refresh-token-${Date.now()}`,
				expires_in: 3600,
				token_type: 'Bearer',
				scope: 'openid profile email',
			};

			// Log the received parameters for debugging
			console.log('OAuth callback received:', { code, state });

			setTokens(mockTokens);
			showStatus('success', 'OAuth callback processed successfully!');
			
			addAPILog({
				method: 'POST',
				url: 'https://auth.pingone.com/oauth2/token',
				responseStatus: 200,
				responseBody: mockTokens,
			});
		} catch (error) {
			showStatus('error', `Failed to process OAuth callback: ${error}`);
			addAPILog({
				method: 'POST',
				url: 'https://auth.pingone.com/oauth2/token',
				responseStatus: 500,
				error: String(error),
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Check for OAuth callback parameters
	useEffect(() => {
		const code = searchParams.get('code');
		const state = searchParams.get('state');
		const error = searchParams.get('error');

		if (error) {
			setStatus({ type: 'error', message: `OAuth Error: ${error}` });
			setTimeout(() => setStatus(null), 5000);
		} else if (code && state) {
			handleOAuthCallback(code, state);
		}
	}, [searchParams]);

	const initiateCentralizedLogin = () => {
		showStatus('info', 'Initiating centralized login - redirecting to PingOne server UI...');
		
		const authUrl = 'https://auth.pingone.com/oauth2/authorize';
		const params = new URLSearchParams({
			response_type: 'code',
			client_id: 'test-client-id',
			redirect_uri: 'https://localhost:3000/sdk-examples/oidc-centralized-login',
			scope: 'openid profile email',
			state: 'mock-state-' + Date.now(),
		});
		
		addAPILog({
			method: 'GET',
			url: authUrl + '?' + params.toString(),
			requestHeaders: {
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			},
		});

		// In a real implementation, this would use TokenManager.getTokens({ login: 'redirect' })
		// For demo purposes, we'll simulate the redirect
		setTimeout(() => {
			// Simulate redirect with mock parameters
			navigate('/sdk-examples/oidc-centralized-login?code=mock-auth-code&state=mock-state');
		}, 2000);
	};

	const initiateBackgroundRenewal = () => {
		showStatus('info', 'Attempting background token renewal...');

		// In a real implementation, this would use TokenManager.getTokens with skipBackgroundRequest: false
		setTimeout(() => {
			const renewedTokens = {
				...tokens,
				access_token: `renewed-access-token-${Date.now()}`,
				expires_in: 3600,
			};

			setTokens(renewedTokens);
			showStatus('success', 'Background token renewal successful!');
		}, 1500);
	};

	const clearTokens = () => {
		setTokens(null);
		showStatus('info', 'Tokens cleared');
	};

	return (
		<Container>
			<BackButton to="/sdk-examples">← Back to SDK Examples</BackButton>
			<Header>OIDC Centralized Login Examples</Header>
			<Description>
				Explore OpenID Connect centralized login implementation using the PingOne OIDC SDK. This
				demonstrates server-side UI authentication, token management, and background renewal
				patterns for secure user authentication.
			</Description>

			{status && <StatusMessage type={status.type}>{status.message}</StatusMessage>}

			<FixedStatusPanel>
				<StatusPanelHeader>API Activity Log</StatusPanelHeader>
				<StatusPanelContent>
					{apiLogs.length === 0 ? (
						<div style={{ color: '#666', textAlign: 'center', padding: '2rem 0' }}>
							No API calls yet. Perform an action to see the logs.
						</div>
					) : (
						apiLogs.map((log) => (
							<APILogEntry key={log.id}>
								<APILogTitle>
									{log.method} {log.url}
									{log.responseStatus && (
										<span style={{
											color: log.responseStatus < 400 ? '#28a745' : log.responseStatus < 500 ? '#ffc107' : '#dc3545',
											marginLeft: '0.5rem',
										}}>
											[{log.responseStatus}]
										</span>
									)}
								</APILogTitle>
								<div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>
									{log.timestamp.toLocaleTimeString()}
								</div>
								{log.requestHeaders && (
									<APILogDetails>
										<strong>Request Headers:</strong>
										<APILogCode>{JSON.stringify(log.requestHeaders, null, 2)}</APILogCode>
									</APILogDetails>
								)}
								{log.requestBody && (
									<APILogDetails>
										<strong>Request Body:</strong>
										<APILogCode>{JSON.stringify(log.requestBody, null, 2)}</APILogCode>
									</APILogDetails>
								)}
								{log.responseHeaders && (
									<APILogDetails>
										<strong>Response Headers:</strong>
										<APILogCode>{JSON.stringify(log.responseHeaders, null, 2)}</APILogCode>
									</APILogDetails>
								)}
								{log.responseBody && (
									<APILogDetails>
										<strong>Response Body:</strong>
										<APILogCode>{JSON.stringify(log.responseBody, null, 2)}</APILogCode>
									</APILogDetails>
								)}
								{log.error && (
									<APILogDetails>
										<strong>Error:</strong>
										<APILogCode style={{ color: '#dc3545' }}>{log.error}</APILogCode>
									</APILogDetails>
								)}
							</APILogEntry>
						))
					)}
				</StatusPanelContent>
			</FixedStatusPanel>

			<ExamplesGrid>
				<ExampleCard>
					<ExampleTitle>Centralized Login Initiation</ExampleTitle>
					<ExampleDescription>
						Initiate OIDC centralized login by redirecting users to the PingOne server UI. The
						server handles authentication and redirects back with authorization code.
					</ExampleDescription>

					<Button onClick={initiateCentralizedLogin} disabled={isLoading}>
						{isLoading ? 'Redirecting...' : 'Start Centralized Login'}
					</Button>

					<CodeBlock>{`// Implementation using TokenManager
import { TokenManager } from '@pingidentity-developers-experience/ping-oidc-client-sdk';

const tokens = await TokenManager.getTokens({
  login: 'redirect',        // Redirect to server UI
  forceRenew: false,        // Use existing tokens if available
  skipBackgroundRequest: false // Allow background renewal
});`}</CodeBlock>
				</ExampleCard>

				<ExampleCard>
					<ExampleTitle>OAuth Callback Handling</ExampleTitle>
					<ExampleDescription>
						Handle OAuth 2.0 callback with authorization code and state parameters. Exchange the
						code for access tokens and store them securely.
					</ExampleDescription>

					{tokens ? (
						<div>
							<p>
								<strong>Tokens Received:</strong>
							</p>
							<ResultArea>{JSON.stringify(tokens, null, 2)}</ResultArea>
							<Button onClick={clearTokens}>Clear Tokens</Button>
						</div>
					) : (
						<p>No tokens available. Initiate login first.</p>
					)}

					<CodeBlock>{`// Handle OAuth callback
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');

if (code && state) {
  const tokens = await TokenManager.getTokens({
    query: { code, state }
  });
  // Store tokens securely
  localStorage.setItem('access_token', tokens.access_token);
}`}</CodeBlock>
				</ExampleCard>

				<ExampleCard>
					<ExampleTitle>Background Token Renewal</ExampleTitle>
					<ExampleDescription>
						Implement silent token renewal in iframe to maintain user sessions without requiring
						re-authentication. Prevents session timeouts.
					</ExampleDescription>

					<Button onClick={initiateBackgroundRenewal} disabled={!tokens}>
						Renew Tokens in Background
					</Button>

					<CodeBlock>{`// Background token renewal
const renewTokensSilently = async () => {
  try {
    const tokens = await TokenManager.getTokens({
      login: 'redirect',
      forceRenew: false,
      skipBackgroundRequest: false // Allow iframe renewal
    });
    
    if (tokens) {
      localStorage.setItem('access_token', tokens.access_token);
      return true;
    }
  } catch (error) {
    console.warn('Silent renewal failed:', error);
    return false;
  }
};`}</CodeBlock>
				</ExampleCard>

				<ExampleCard>
					<ExampleTitle>Token Management</ExampleTitle>
					<ExampleDescription>
						Comprehensive token management including storage, validation, expiration checking, and
						secure token handling.
					</ExampleDescription>

					<Button onClick={() => tokens && showStatus('info', 'Token validation implemented')}>
						Check Token Status
					</Button>

					<CodeBlock>{`// Token management utilities
const isTokenExpired = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch (error) {
    return true; // Assume expired if can't parse
  }
};

const refreshTokenIfNeeded = async () => {
  const token = localStorage.getItem('access_token');
  if (!token || isTokenExpired(token)) {
    await renewTokensSilently();
  }
};

// Secure token storage
const secureStorage = {
  set: (key: string, value: string) => {
    localStorage.setItem(key, value);
  },
  get: (key: string) => localStorage.getItem(key),
  remove: (key: string) => localStorage.removeItem(key)
};`}</CodeBlock>
				</ExampleCard>
			</ExamplesGrid>

			<div
				style={{ background: '#f8f9fa', padding: '2rem', borderRadius: '8px', marginTop: '3rem' }}
			>
				<h2>Centralized Login Benefits</h2>
				<ul style={{ color: '#666', lineHeight: '1.6' }}>
					<li>
						<strong>Consistent UI</strong>: All apps use the same server-side login interface
					</li>
					<li>
						<strong>Security</strong>: User credentials never handled by client applications
					</li>
					<li>
						<strong>Maintenance</strong>: Authentication journeys updated server-side, no client
						changes needed
					</li>
					<li>
						<strong>Compliance</strong>: Centralized audit logs and security monitoring
					</li>
					<li>
						<strong>SSO Support</strong>: Browser-based single sign-on across applications
					</li>
				</ul>

				<h3>Implementation Requirements</h3>
				<ul style={{ color: '#666', lineHeight: '1.6' }}>
					<li>PingOne application with OIDC configuration</li>
					<li>
						Redirect URI: <code>/sdk-examples/oidc-centralized-login</code>
					</li>
					<li>
						Response Type: <code>code</code>
					</li>
					<li>
						Grant Type: <code>authorization_code</code>
					</li>
					<li>
						Token Auth Method: <code>None</code> (for centralized login)
					</li>
				</ul>
			</div>
		</Container>
	);
};

export default OIDCExamples;
