// src/pages/flows/EnhancedAuthorizationCodeFlow.tsx
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	FiAlertTriangle,
	FiCheck,
	FiEye,
	FiLock,
	FiRefreshCw,
	FiSave,
	FiSettings,
} from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import ConfigurationStatus from '../../components/ConfigurationStatus';
import ContextualHelp from '../../components/ContextualHelp';
import EnhancedStepFlow, { type EnhancedFlowStep } from '../../components/EnhancedStepFlow';
import PageTitle from '../../components/PageTitle';
import { useAuth } from '../../contexts/NewAuthContext';
import { getCallbackUrlForFlow } from '../../utils/callbackUrls';
import { getDefaultConfig } from '../../utils/flowConfigDefaults';
import { logger } from '../../utils/logger';
import { generateCodeChallenge, generateCodeVerifier } from '../../utils/oauth';
import {
	type FlowCredentials,
	loadFlowCredentials,
	persistentCredentials,
	saveFlowCredentials,
} from '../../utils/persistentCredentials';

// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const CredentialsPanel = styled.div<{ $isOpen: boolean }>`
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.5rem;
  margin-bottom: 2rem;
  overflow: hidden;
  transition: all 0.3s ease;
  
  ${({ $isOpen }) =>
		!$isOpen &&
		`
    max-height: 0;
    margin-bottom: 0;
    border: none;
  `}
`;

const CredentialsHeader = styled.div`
  padding: 1rem 1.5rem;
  background: ${({ theme }) => theme.colors.gray50};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray200};
  display: flex;
  justify-content: between;
  align-items: center;
`;

const CredentialsContent = styled.div`
  padding: 1.5rem;
`;

const CredentialsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
`;

const CredentialField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const CredentialLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.gray700};
`;

const CredentialInput = styled.input`
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray300};
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }
`;

const CredentialActions = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{
	$variant?: 'primary' | 'secondary' | 'success' | 'danger';
}>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  ${({ $variant, theme }) => {
		switch ($variant) {
			case 'primary':
				return `
          background-color: ${theme.colors.primary};
          color: white;
          &:hover { background-color: ${theme.colors.primaryDark}; }
        `;
			case 'success':
				return `
          background-color: ${theme.colors.success};
          color: white;
          &:hover { background-color: ${theme.colors.successDark}; }
        `;
			case 'danger':
				return `
          background-color: ${theme.colors.error};
          color: white;
          &:hover { background-color: ${theme.colors.errorDark}; }
        `;
			default:
				return `
          background-color: ${theme.colors.gray100};
          color: ${({ theme }) => theme.colors.gray700};
          border: 1px solid ${theme.colors.gray300};
          &:hover { background-color: ${theme.colors.gray200}; }
        `;
		}
	}}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SaveStatus = styled.div<{ $type: 'success' | 'error' }>`
  padding: 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  margin-top: 1rem;
  
  ${({ $type, theme }) =>
		$type === 'success'
			? `
        background-color: ${theme.colors.success}10;
        color: ${theme.colors.success};
        border: 1px solid ${theme.colors.success};
      `
			: `
        background-color: ${theme.colors.error}10;
        color: ${theme.colors.error};
        border: 1px solid ${theme.colors.error};
      `}
`;

// Flow Configuration Interface
interface FlowConfig {
	enablePKCE: boolean;
	codeChallengeMethod: 'S256' | 'plain';
	responseType: string;
	scopes: string[];
	state: string;
	nonce: string;
	maxAge: number;
	prompt: string;
	loginHint: string;
	acrValues: string[];
	customParams: Record<string, string>;
}

const EnhancedAuthorizationCodeFlow: React.FC = () => {
	const { config } = useAuth();
	const _navigate = useNavigate();
	const location = useLocation();

	// State management
	const [credentials, setCredentials] = useState<FlowCredentials>({});
	const [flowConfig, _setFlowConfig] = useState<FlowConfig>(() =>
		getDefaultConfig('authorization-code')
	);
	const [showCredentials, setShowCredentials] = useState(false);
	const [saveStatus, setSaveStatus] = useState<{
		type: 'success' | 'error';
		message: string;
	} | null>(null);
	const [pkceData, setPkceData] = useState<{
		verifier: string;
		challenge: string;
	} | null>(null);
	const [authUrl, setAuthUrl] = useState<string>('');
	const [authCode, setAuthCode] = useState<string>('');
	const [tokens, setTokens] = useState<any>(null);

	// Load persisted credentials and state on mount
	useEffect(() => {
		const savedCredentials = loadFlowCredentials('authorization-code');
		if (savedCredentials) {
			setCredentials(savedCredentials);
			logger.info('EnhancedAuthCodeFlow', 'Loaded saved credentials', {
				hasClientId: !!savedCredentials.clientId,
				hasEnvironmentId: !!savedCredentials.environmentId,
			});
		} else if (config) {
			// Fallback to global config
			setCredentials({
				environmentId: config.environmentId,
				clientId: config.clientId,
				clientSecret: config.clientSecret,
				redirectUri: getCallbackUrlForFlow('authorization-code'),
				scopes: Array.isArray(config.scopes)
					? config.scopes
					: config.scopes?.split(' ') || ['openid', 'profile', 'email'],
				authEndpoint:
					config.authorizationEndpoint ||
					`https://auth.pingone.com/${config.environmentId}/as/authorize`,
				tokenEndpoint:
					config.tokenEndpoint || `https://auth.pingone.com/${config.environmentId}/as/token`,
				userInfoEndpoint:
					config.userInfoEndpoint || `https://auth.pingone.com/${config.environmentId}/as/userinfo`,
			});
		}
	}, [config]);

	// Handle URL parameters (for OAuth callback)
	useEffect(() => {
		const urlParams = new URLSearchParams(location.search);
		const code = urlParams.get('code');
		const error = urlParams.get('error');
		const state = urlParams.get('state');

		if (code) {
			setAuthCode(code);
			logger.info('EnhancedAuthCodeFlow', 'Authorization code received from callback', {
				code: `${code.substring(0, 10)}...`,
				state,
			});
		} else if (error) {
			logger.error('EnhancedAuthCodeFlow', 'Authorization error received', {
				error,
				errorDescription: urlParams.get('error_description'),
			});
		}
	}, [location]);

	// Save credentials
	const handleSaveCredentials = useCallback(() => {
		try {
			const success = saveFlowCredentials('authorization-code', credentials);
			if (success) {
				setSaveStatus({
					type: 'success',
					message: 'Credentials saved successfully!',
				});
				logger.success('EnhancedAuthCodeFlow', 'Credentials saved');
			} else {
				setSaveStatus({ type: 'error', message: 'Failed to save credentials' });
			}

			setTimeout(() => setSaveStatus(null), 3000);
		} catch (error) {
			logger.error('EnhancedAuthCodeFlow', 'Error saving credentials', error);
			setSaveStatus({ type: 'error', message: 'Error saving credentials' });
			setTimeout(() => setSaveStatus(null), 3000);
		}
	}, [credentials]);

	// Generate PKCE codes
	const generatePKCECodes = useCallback(async () => {
		try {
			const verifier = generateCodeVerifier();
			const challenge = await generateCodeChallenge(verifier);
			const codes = { verifier, challenge };
			setPkceData(codes);

			logger.info('EnhancedAuthCodeFlow', 'PKCE codes generated', {
				verifier: `${verifier.substring(0, 10)}...`,
				challenge: `${challenge.substring(0, 10)}...`,
			});

			return codes;
		} catch (error) {
			logger.error('EnhancedAuthCodeFlow', 'Failed to generate PKCE codes', error);
			throw error;
		}
	}, []);

	// Build authorization URL
	const buildAuthorizationUrl = useCallback(() => {
		if (!credentials.clientId || !credentials.environmentId) {
			throw new Error('Client ID and Environment ID are required');
		}

		const params = new URLSearchParams({
			response_type: flowConfig.responseType,
			client_id: credentials.clientId,
			redirect_uri: credentials.redirectUri || getCallbackUrlForFlow('authorization-code'),
			scope: flowConfig.scopes.join(' '),
			state: flowConfig.state || Math.random().toString(36).substring(2, 15),
			nonce: flowConfig.nonce || Math.random().toString(36).substring(2, 15),
		});

		// Add PKCE parameters if enabled
		if (flowConfig.enablePKCE && pkceData) {
			params.append('code_challenge', pkceData.challenge);
			params.append('code_challenge_method', flowConfig.codeChallengeMethod);
		}

		// Add optional parameters
		if (flowConfig.maxAge > 0) {
			params.append('max_age', flowConfig.maxAge.toString());
		}
		if (flowConfig.prompt) {
			params.append('prompt', flowConfig.prompt);
		}
		if (flowConfig.loginHint) {
			params.append('login_hint', flowConfig.loginHint);
		}
		if (flowConfig.acrValues.length > 0) {
			// Filter out invalid ACR values before adding to URL
			const validAcrValues = flowConfig.acrValues.filter(
				(acr) =>
					acr &&
					acr.trim() !== '' &&
					!/^[0-9]+$/.test(acr) && // Remove single digits like '1', '2', '3'
					(acr.startsWith('urn:') || acr.length > 3) // Must be URN or meaningful string
			);

			if (validAcrValues.length > 0) {
				params.append('acr_values', validAcrValues.join(' '));
				console.log(' [EnhancedAuthorizationCodeFlow] Added valid ACR values:', validAcrValues);
			} else {
				console.warn(
					' [EnhancedAuthorizationCodeFlow] No valid ACR values found, skipping acr_values parameter'
				);
			}
		}

		// Add custom parameters
		Object.entries(flowConfig.customParams).forEach(([key, value]) => {
			if (value) {
				params.append(key, value);
			}
		});

		const authEndpoint =
			credentials.authEndpoint ||
			`https://auth.pingone.com/${credentials.environmentId}/as/authorize`;
		const url = `${authEndpoint}?${params.toString()}`;

		setAuthUrl(url);
		logger.info('EnhancedAuthCodeFlow', 'Authorization URL built', {
			endpoint: authEndpoint,
			paramsCount: Array.from(params.keys()).length,
		});

		return url;
	}, [credentials, flowConfig, pkceData]);

	// Exchange code for tokens
	const exchangeCodeForTokens = useCallback(async () => {
		if (!authCode) {
			throw new Error('Authorization code is required');
		}

		if (!credentials.clientId || !credentials.clientSecret || !credentials.environmentId) {
			throw new Error('Client credentials are required');
		}

		const tokenEndpoint =
			credentials.tokenEndpoint || `https://auth.pingone.com/${credentials.environmentId}/as/token`;

		const body = new URLSearchParams({
			grant_type: 'authorization_code',
			code: authCode,
			redirect_uri: credentials.redirectUri || getCallbackUrlForFlow('authorization-code'),
			client_id: credentials.clientId,
			client_secret: credentials.clientSecret,
		});

		// Add PKCE verifier if used
		if (flowConfig.enablePKCE && pkceData) {
			body.append('code_verifier', pkceData.verifier);
		}

		logger.info('EnhancedAuthCodeFlow', 'Exchanging code for tokens', {
			endpoint: tokenEndpoint,
			code: `${authCode.substring(0, 10)}...`,
		});

		const response = await fetch(tokenEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: body.toString(),
		});

		if (!response.ok) {
			const errorText = await response.text();
			logger.error('EnhancedAuthCodeFlow', 'Token exchange failed', {
				status: response.status,
				statusText: response.statusText,
				error: errorText,
			});
			throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
		}

		const tokenData = await response.json();
		setTokens(tokenData);

		logger.success('EnhancedAuthCodeFlow', 'Tokens received', {
			hasAccessToken: !!tokenData.access_token,
			hasRefreshToken: !!tokenData.refresh_token,
			hasIdToken: !!tokenData.id_token,
			expiresIn: tokenData.expires_in,
		});

		return tokenData;
	}, [authCode, credentials, flowConfig, pkceData]);

	// Validate tokens
	const validateTokens = useCallback(async () => {
		if (!tokens || !tokens.access_token) {
			throw new Error('Access token is required');
		}

		const userInfoEndpoint =
			credentials.userInfoEndpoint ||
			`https://auth.pingone.com/${credentials.environmentId}/as/userinfo`;

		logger.info('EnhancedAuthCodeFlow', 'Validating tokens with UserInfo endpoint', {
			endpoint: userInfoEndpoint,
		});

		const response = await fetch(userInfoEndpoint, {
			headers: {
				Authorization: `Bearer ${tokens.access_token}`,
			},
		});

		if (!response.ok) {
			const errorText = await response.text();
			logger.error('EnhancedAuthCodeFlow', 'Token validation failed', {
				status: response.status,
				statusText: response.statusText,
				error: errorText,
			});
			throw new Error(`Token validation failed: ${response.status} ${response.statusText}`);
		}

		const userInfo = await response.json();

		logger.success('EnhancedAuthCodeFlow', 'Tokens validated successfully', {
			userId: userInfo.sub,
			email: userInfo.email,
		});

		return userInfo;
	}, [tokens, credentials]);

	// Define enhanced flow steps
	const steps: EnhancedFlowStep[] = useMemo(
		() => [
			{
				id: 'setup-credentials',
				title: 'Setup Credentials',
				description: 'Configure your PingOne OAuth credentials for the authorization flow.',
				category: 'preparation',
				canSkip: false,
				isOptional: false,
				code: `// Required Credentials
const credentials = {
  environmentId: '${credentials.environmentId || 'YOUR_ENVIRONMENT_ID'}',
  clientId: '${credentials.clientId || 'YOUR_CLIENT_ID'}',
  clientSecret: '${credentials.clientSecret || 'YOUR_CLIENT_SECRET'}',
  redirectUri: '${credentials.redirectUri || getCallbackUrlForFlow('authorization-code')}',
  scopes: ${JSON.stringify(credentials.scopes || ['openid', 'profile', 'email'], null, 2)}
};`,
				execute: async () => {
					if (!credentials.clientId || !credentials.environmentId || !credentials.clientSecret) {
						throw new Error('Please configure your credentials first');
					}
					return {
						status: 'Credentials configured',
						credentials: { ...credentials, clientSecret: '***' },
					};
				},
				debugInfo: {
					credentials: {
						...credentials,
						clientSecret: credentials.clientSecret ? '***' : undefined,
					},
				},
				tips: [
					'You can get these credentials from your PingOne admin console',
					'The redirect URI must be registered in your PingOne application',
					'Credentials are automatically saved and restored across browser sessions',
				],
				securityNotes: [
					'Client secret should be kept secure in production environments',
					'Use PKCE for public clients (SPAs, mobile apps)',
				],
			},
			{
				id: 'generate-pkce',
				title: 'Generate PKCE Codes (Optional)',
				description: 'Generate Proof Key for Code Exchange (PKCE) codes for enhanced security.',
				category: 'preparation',
				canSkip: !flowConfig.enablePKCE,
				isOptional: !flowConfig.enablePKCE,
				dependencies: ['setup-credentials'],
				code: `// Generate PKCE Codes
const codeVerifier = generateCodeVerifier();
const codeChallenge = await generateCodeChallenge(codeVerifier);

console.log('Code Verifier:', codeVerifier);
console.log('Code Challenge:', codeChallenge);
console.log('Challenge Method:', '${flowConfig.codeChallengeMethod}');`,
				execute: flowConfig.enablePKCE ? generatePKCECodes : undefined,
				debugInfo: {
					pkceEnabled: flowConfig.enablePKCE,
					method: flowConfig.codeChallengeMethod,
					hasCodes: !!pkceData,
				},
				tips: [
					'PKCE adds security by using a dynamically generated secret',
					'Recommended for all OAuth flows, especially public clients',
					'The code verifier is kept secret, only the challenge is sent',
				],
			},
			{
				id: 'build-auth-url',
				title: 'Build Authorization URL',
				description: 'Construct the authorization URL with all required parameters.',
				category: 'authorization',
				canSkip: false,
				dependencies: ['setup-credentials'],
				code: `// Authorization URL
const authUrl = '${credentials.authEndpoint || `https://auth.pingone.com/${credentials.environmentId}/as/authorize`}?' +
  new URLSearchParams({
    response_type: '${flowConfig.responseType}',
    client_id: '${credentials.clientId || 'YOUR_CLIENT_ID'}',
    redirect_uri: '${credentials.redirectUri || getCallbackUrlForFlow('authorization-code')}',
    scope: '${flowConfig.scopes.join(' ')}',
    state: '${flowConfig.state || 'RANDOM_STATE'}',
    nonce: '${flowConfig.nonce || 'RANDOM_NONCE'}'${
			flowConfig.enablePKCE && pkceData
				? `,
    code_challenge: '${pkceData.challenge}',
    code_challenge_method: '${flowConfig.codeChallengeMethod}'`
				: ''
		}
  }).toString();

console.log('Authorization URL:', authUrl);`,
				execute: async () => {
					const url = buildAuthorizationUrl();
					return { authorizationUrl: url };
				},
				debugInfo: {
					flowConfig,
					hasPkce: flowConfig.enablePKCE && !!pkceData,
					paramsCount: Object.keys(flowConfig.customParams).length,
				},
				tips: [
					'The state parameter helps prevent CSRF attacks',
					'The nonce parameter helps prevent replay attacks',
					'Custom parameters can be added for specific use cases',
				],
			},
			{
				id: 'redirect-user',
				title: 'Redirect User to Authorization Server',
				description: 'Redirect the user to PingOne for authentication and authorization.',
				category: 'authorization',
				canSkip: false,
				dependencies: ['build-auth-url'],
				code: `// Redirect to Authorization Server
window.location.href = authUrl;

// Or open in new window for testing
window.open(authUrl, '_blank');`,
				execute: async () => {
					if (!authUrl) {
						throw new Error('Authorization URL not built yet');
					}

					// Set up flow context for popup callback
					const currentPath = window.location.pathname;
					const returnPath = `${currentPath}?step=4`; // Return to step 4 (token exchange)

					console.log(' [EnhancedAuthorizationCodeFlow] Popup - Current path:', currentPath);
					console.log(' [EnhancedAuthorizationCodeFlow] Popup - Return path:', returnPath);

					const flowContext = {
						flow: 'enhanced-authorization-code',
						step: 4,
						returnPath: returnPath,
						timestamp: Date.now(),
					};
					sessionStorage.setItem('flowContext', JSON.stringify(flowContext));

					console.log(
						' [EnhancedAuthorizationCodeFlow] Stored flow context for callback:',
						flowContext
					);

					// Open in new window for testing
					window.open(authUrl, '_blank', 'width=600,height=700');

					return {
						message: 'User redirected to authorization server',
						authUrl,
						instruction: 'Complete authentication in the popup window, then return here',
					};
				},
				debugInfo: { authUrl: authUrl ? 'Generated' : 'Not available' },
				tips: [
					'In production, this would be a full page redirect',
					'For testing, we open a popup window',
					'After authentication, user will be redirected back with an authorization code',
				],
			},
			{
				id: 'handle-callback',
				title: 'Handle Authorization Callback',
				description: 'Process the authorization code returned from PingOne.',
				category: 'authorization',
				canSkip: false,
				dependencies: ['redirect-user'],
				code: `// Handle Authorization Callback
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');
const error = urlParams.get('error');

if (error) {
  throw new Error(\`Authorization failed: \${error}\`);
}

if (!code) {
  throw new Error('No authorization code received');
}

console.log('Authorization Code:', code);
console.log('State:', state);`,
				execute: async () => {
					if (!authCode) {
						throw new Error(
							'No authorization code available. Please complete the authorization step first.'
						);
					}

					return {
						authorizationCode: `${authCode.substring(0, 10)}...`,
						message: 'Authorization code received successfully',
					};
				},
				debugInfo: {
					hasAuthCode: !!authCode,
					authCodeLength: authCode?.length,
				},
				tips: [
					'The authorization code is single-use and short-lived',
					'Validate the state parameter to prevent CSRF attacks',
					'Handle errors gracefully and provide user feedback',
				],
			},
			{
				id: 'exchange-tokens',
				title: 'Exchange Code for Tokens',
				description: 'Exchange the authorization code for access and refresh tokens.',
				category: 'token-exchange',
				canSkip: false,
				dependencies: ['handle-callback'],
				code: `// Exchange Code for Tokens
const tokenResponse = await fetch('${credentials.tokenEndpoint || `https://auth.pingone.com/${credentials.environmentId}/as/token`}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: authorizationCode,
    redirect_uri: '${credentials.redirectUri || getCallbackUrlForFlow('authorization-code')}',
    client_id: '${credentials.clientId || 'YOUR_CLIENT_ID'}',
    client_secret: '${credentials.clientSecret ? '***' : 'YOUR_CLIENT_SECRET'}'${
			flowConfig.enablePKCE && pkceData
				? `,
    code_verifier: codeVerifier`
				: ''
		}
  })
});

const tokens = await tokenResponse.json();
console.log('Tokens received:', tokens);`,
				execute: exchangeCodeForTokens,
				debugInfo: {
					hasAuthCode: !!authCode,
					hasPkceVerifier: flowConfig.enablePKCE && !!pkceData?.verifier,
					tokenEndpoint: credentials.tokenEndpoint,
				},
				tips: [
					'This is a server-to-server call in production',
					'Include the PKCE code verifier if PKCE was used',
					'Store tokens securely and handle refresh appropriately',
				],
				securityNotes: [
					'Never expose client secret in client-side code',
					'Use secure storage for tokens',
					'Implement proper token refresh logic',
				],
			},
			{
				id: 'validate-tokens',
				title: 'Validate Tokens',
				description: 'Validate the received tokens by calling the UserInfo endpoint.',
				category: 'validation',
				canSkip: true,
				isOptional: true,
				dependencies: ['exchange-tokens'],
				code: `// Validate Tokens with UserInfo
const userInfoResponse = await fetch('${credentials.userInfoEndpoint || `https://auth.pingone.com/${credentials.environmentId}/as/userinfo`}', {
  headers: {
    'Authorization': \`Bearer \${accessToken}\`
  }
});

const userInfo = await userInfoResponse.json();
console.log('User Info:', userInfo);`,
				execute: validateTokens,
				debugInfo: {
					hasTokens: !!tokens,
					hasAccessToken: !!tokens?.access_token,
					userInfoEndpoint: credentials.userInfoEndpoint,
				},
				tips: [
					'UserInfo endpoint validates the access token',
					'Returns user profile information',
					'Useful for testing token validity',
				],
			},
		],
		[
			credentials,
			flowConfig,
			pkceData,
			authUrl,
			authCode,
			tokens,
			buildAuthorizationUrl,
			exchangeCodeForTokens,
			generatePKCECodes,
			validateTokens,
		]
	);

	return (
		<Container>
			<PageTitle
				title={
					<>
						<FiLock />
						Enhanced Authorization Code Flow
					</>
				}
				subtitle="Redesigned OAuth 2.0 Authorization Code flow with better UX, persistent credentials, and step-by-step debugging capabilities."
			/>

			<ConfigurationStatus
				config={credentials}
				onConfigure={() => setShowCredentials(!showCredentials)}
				flowType="authorization-code"
			/>

			<ContextualHelp flowId="authorization-code" />

			{/* Credentials Panel */}
			<CredentialsPanel $isOpen={showCredentials}>
				<CredentialsHeader>
					<h3
						style={{
							margin: 0,
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
						}}
					>
						<FiSettings />
						OAuth Credentials Configuration
					</h3>
				</CredentialsHeader>
				<CredentialsContent>
					<CredentialsGrid>
						<CredentialField>
							<CredentialLabel>Environment ID</CredentialLabel>
							<CredentialInput
								type="text"
								value={credentials.environmentId || ''}
								onChange={(e) =>
									setCredentials((prev) => ({
										...prev,
										environmentId: e.target.value,
									}))
								}
								placeholder="12345678-1234-1234-1234-123456789012"
							/>
						</CredentialField>

						<CredentialField>
							<CredentialLabel>Client ID</CredentialLabel>
							<CredentialInput
								type="text"
								value={credentials.clientId || ''}
								onChange={(e) =>
									setCredentials((prev) => ({
										...prev,
										clientId: e.target.value,
									}))
								}
								placeholder="12345678-1234-1234-1234-123456789012"
							/>
						</CredentialField>

						<CredentialField>
							<CredentialLabel>Client Secret</CredentialLabel>
							<CredentialInput
								type="password"
								value={credentials.clientSecret || ''}
								onChange={(e) =>
									setCredentials((prev) => ({
										...prev,
										clientSecret: e.target.value,
									}))
								}
								placeholder="your-client-secret"
							/>
						</CredentialField>

						<CredentialField>
							<CredentialLabel>Redirect URI</CredentialLabel>
							<CredentialInput
								type="url"
								value={credentials.redirectUri || getCallbackUrlForFlow('authorization-code')}
								onChange={(e) =>
									setCredentials((prev) => ({
										...prev,
										redirectUri: e.target.value,
									}))
								}
								placeholder="https://localhost:3000/callback"
							/>
						</CredentialField>
					</CredentialsGrid>

					<CredentialActions>
						<ActionButton $variant="primary" onClick={handleSaveCredentials}>
							<FiSave />
							Save Credentials
						</ActionButton>
						<ActionButton onClick={() => setShowCredentials(false)}>
							<FiEye />
							Hide Panel
						</ActionButton>
						<ActionButton
							$variant="danger"
							onClick={() => {
								setCredentials({});
								persistentCredentials.removeFlowCredentials('authorization-code');
							}}
						>
							<FiRefreshCw />
							Clear All
						</ActionButton>
					</CredentialActions>

					{saveStatus && (
						<SaveStatus $type={saveStatus.type}>
							{saveStatus.type === 'success' ? <FiCheck /> : <FiAlertTriangle />}
							{saveStatus.message}
						</SaveStatus>
					)}
				</CredentialsContent>
			</CredentialsPanel>

			{/* Enhanced Step Flow */}
			<EnhancedStepFlow
				steps={steps}
				title="OAuth 2.0 Authorization Code Flow"
				persistKey="enhanced_auth_code_flow"
				autoAdvance={false}
				showDebugInfo={true}
				allowStepJumping={true}
				onStepComplete={(stepId, result) => {
					logger.info('EnhancedAuthCodeFlow', `Step completed: ${stepId}`, JSON.stringify(result));
				}}
				onStepError={(stepId, error) => {
					logger.error('EnhancedAuthCodeFlow', `Step failed: ${stepId}`, error);
				}}
				onFlowComplete={(results) => {
					logger.success(
						'EnhancedAuthCodeFlow',
						'Flow completed successfully',
						JSON.stringify(results)
					);
				}}
			/>
		</Container>
	);
};

export default EnhancedAuthorizationCodeFlow;
