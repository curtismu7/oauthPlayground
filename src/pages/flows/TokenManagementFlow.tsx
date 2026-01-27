import type React from 'react';
import { useCallback, useState } from 'react';
import styled from 'styled-components';
import FlowCredentials from '../../components/FlowCredentials';
import JSONHighlighter from '../../components/JSONHighlighter';
import { StepByStepFlow } from '../../components/StepByStepFlow';
import {
	type TokenAuthMethod,
	type TokenIntrospectionResponse,
	TokenManagementService,
	type TokenRequest,
	type TokenResponse,
} from '../../services/tokenManagementService';
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

const _TextArea = styled.textarea`
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
  background: #ffffff;
  color: #111111;
  border: 1px solid #d0d7de;
  padding: 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  overflow-x: auto;
  margin: 1rem 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
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

const TokenContainer = styled.div`
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
`;

const TokenTitle = styled.h4`
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.125rem;
  font-weight: 600;
`;

const TokenDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const TokenDetail = styled.div`
  display: flex;
  flex-direction: column;
`;

const TokenLabel = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
`;

const TokenValue = styled.span`
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

const SubTabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1rem;
`;

const SubTab = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid ${({ $active }) => ($active ? '#10b981' : 'transparent')};
  color: ${({ $active }) => ($active ? '#10b981' : '#6b7280')};
  
  &:hover {
    color: #10b981;
  }
`;

interface TokenManagementFlowProps {
	credentials?: {
		clientId: string;
		clientSecret: string;
		environmentId: string;
	};
}

const TokenManagementFlow: React.FC<TokenManagementFlowProps> = ({ credentials }) => {
	const [currentStep, setCurrentStep] = useState(0);
	const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
	const [activeTab, setActiveTab] = useState<'exchange' | 'refresh' | 'introspect' | 'revoke'>(
		'exchange'
	);
	const [activeSubTab, setActiveSubTab] = useState<'auth_code' | 'token_exchange'>('auth_code');
	const [activeAuthMethod, setActiveAuthMethod] =
		useState<TokenAuthMethod['type']>('CLIENT_SECRET_POST');
	const [formData, setFormData] = useState({
		clientId: credentials?.clientId || '',
		clientSecret: credentials?.clientSecret || '',
		environmentId: credentials?.environmentId || '',
		grantType: 'authorization_code' as TokenRequest['grantType'],
		code: '',
		refreshToken: '',
		redirectUri: 'http://localhost:3000/callback',
		scope: 'openid profile email',
		audience: '',
		subjectToken: '',
		subjectTokenType: 'urn:ietf:params:oauth:token-type:access_token',
		actorToken: '',
		actorTokenType: 'urn:ietf:params:oauth:token-type:access_token',
		requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
		privateKey: '',
		keyId: '',
		jwksUri: '',
		tokenToIntrospect: '',
		tokenTypeHint: 'access_token' as 'access_token' | 'id_token' | 'refresh_token',
		resourceId: '',
		resourceSecret: '',
		tokenToRevoke: '',
		revocationTokenTypeHint: 'access_token' as 'access_token' | 'refresh_token',
	});
	const [response, setResponse] = useState<Record<string, unknown> | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [tokenResponse, setTokenResponse] = useState<TokenResponse | null>(null);
	const [introspectionResponse, setIntrospectionResponse] =
		useState<TokenIntrospectionResponse | null>(null);
	const [_tokenService] = useState(() => new TokenManagementService(formData.environmentId));

	const steps = [
		{
			id: 'step-1',
			title: 'Configure Token Management Settings',
			description: 'Set up your OAuth client for token management operations.',
			code: `// Token Management Configuration
const tokenConfig = {
  clientId: '${formData.clientId}',
  clientSecret: '${formData.clientSecret}',
  environmentId: '${formData.environmentId}',
  grantType: '${formData.grantType}',
  authMethod: '${activeAuthMethod}',
  scope: '${formData.scope}',
  redirectUri: '${formData.redirectUri}'
};

console.log('Token management configured:', tokenConfig);`,
			execute: async () => {
				logger.info('TokenManagementFlow', 'Configuring token management settings');
			},
		},
		{
			id: 'step-2',
			title:
				activeTab === 'exchange'
					? activeSubTab === 'auth_code'
						? 'Exchange Authorization Code'
						: 'Exchange Tokens'
					: activeTab === 'refresh'
						? 'Refresh Access Token'
						: activeTab === 'introspect'
							? 'Introspect Token'
							: 'Revoke Token',
			description:
				activeTab === 'exchange'
					? activeSubTab === 'auth_code'
						? 'Exchange authorization code for access and ID tokens.'
						: 'Exchange tokens using token exchange grant.'
					: activeTab === 'refresh'
						? 'Refresh an expired access token using refresh token.'
						: activeTab === 'introspect'
							? 'Get information about a token.'
							: 'Revoke a token to invalidate it.',
			code:
				activeTab === 'exchange'
					? activeSubTab === 'auth_code'
						? `// Exchange Authorization Code
const tokenRequest: TokenRequest = {
  grantType: 'authorization_code',
  code: '${formData.code}',
  redirectUri: '${formData.redirectUri}',
  scope: '${formData.scope}',
  clientId: '${formData.clientId}',
  clientSecret: '${formData.clientSecret}',
  environmentId: '${formData.environmentId}'
};

const authMethod: TokenAuthMethod = {
  type: '${activeAuthMethod}',
  clientId: '${formData.clientId}',
  clientSecret: '${formData.clientSecret}',
  privateKey: '${formData.privateKey}',
  keyId: '${formData.keyId}',
  jwksUri: '${formData.jwksUri}'
};

const tokenService = new TokenManagementService('${formData.environmentId}');
const tokenResponse = await tokenService.exchangeAuthorizationCode(tokenRequest, authMethod);
console.log('Token Response:', tokenResponse);`
						: `// Exchange Tokens
const tokenRequest: TokenRequest = {
  grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
  audience: '${formData.audience}',
  subjectToken: '${formData.subjectToken}',
  subjectTokenType: '${formData.subjectTokenType}',
  actorToken: '${formData.actorToken}',
  actorTokenType: '${formData.actorTokenType}',
  requestedTokenType: '${formData.requestedTokenType}',
  clientId: '${formData.clientId}',
  clientSecret: '${formData.clientSecret}',
  environmentId: '${formData.environmentId}'
};

const authMethod: TokenAuthMethod = {
  type: '${activeAuthMethod}',
  clientId: '${formData.clientId}',
  clientSecret: '${formData.clientSecret}',
  privateKey: '${formData.privateKey}',
  keyId: '${formData.keyId}',
  jwksUri: '${formData.jwksUri}'
};

const tokenService = new TokenManagementService('${formData.environmentId}');
const tokenResponse = await tokenService.exchangeToken(tokenRequest, authMethod);
console.log('Token Exchange Response:', tokenResponse);`
					: activeTab === 'refresh'
						? `// Refresh Access Token
const tokenRequest: TokenRequest = {
  grantType: 'refresh_token',
  refreshToken: '${formData.refreshToken}',
  scope: '${formData.scope}',
  clientId: '${formData.clientId}',
  clientSecret: '${formData.clientSecret}',
  environmentId: '${formData.environmentId}'
};

const authMethod: TokenAuthMethod = {
  type: '${activeAuthMethod}',
  clientId: '${formData.clientId}',
  clientSecret: '${formData.clientSecret}',
  privateKey: '${formData.privateKey}',
  keyId: '${formData.keyId}',
  jwksUri: '${formData.jwksUri}'
};

const tokenService = new TokenManagementService('${formData.environmentId}');
const tokenResponse = await tokenService.refreshToken(tokenRequest, authMethod);
console.log('Token Refresh Response:', tokenResponse);`
						: activeTab === 'introspect'
							? `// Introspect Token
const tokenService = new TokenManagementService('${formData.environmentId}');
const introspectionResponse = await tokenService.introspectToken(
  '${formData.tokenToIntrospect}',
  '${formData.tokenTypeHint}',
  {
    type: '${activeAuthMethod}',
    clientId: '${formData.clientId}',
    clientSecret: '${formData.clientSecret}',
    privateKey: '${formData.privateKey}',
    keyId: '${formData.keyId}',
    jwksUri: '${formData.jwksUri}'
  },
  '${formData.resourceId}',
  '${formData.resourceSecret}'
);
console.log('Token Introspection Response:', introspectionResponse);`
							: `// Revoke Token
const revocationRequest: TokenRevocationRequest = {
  token: '${formData.tokenToRevoke}',
  token_type_hint: '${formData.revocationTokenTypeHint}',
  clientId: '${formData.clientId}',
  clientSecret: '${formData.clientSecret}',
  environmentId: '${formData.environmentId}'
};

const tokenService = new TokenManagementService('${formData.environmentId}');
const revoked = await tokenService.revokeToken(revocationRequest);
console.log('Token Revoked:', revoked);`,
			execute: async () => {
				logger.info('TokenManagementFlow', `Executing ${activeTab} operation`, {
					subTab: activeSubTab,
					authMethod: activeAuthMethod,
				});
				setDemoStatus('loading');

				try {
					let result: unknown;

					if (activeTab === 'exchange') {
						if (activeSubTab === 'auth_code') {
							// Simulate authorization code exchange
							const mockTokenResponse: TokenResponse = {
								access_token: `mock_access_token_${Date.now()}`,
								token_type: 'Bearer',
								expires_in: 3600,
								scope: formData.scope,
								refresh_token: `mock_refresh_token_${Date.now()}`,
								id_token: `mock_id_token_${Date.now()}`,
							};
							result = mockTokenResponse;
							setTokenResponse(mockTokenResponse);
						} else {
							// Simulate token exchange
							const mockTokenResponse: TokenResponse = {
								access_token: `mock_exchanged_token_${Date.now()}`,
								token_type: 'Bearer',
								expires_in: 3600,
								scope: formData.scope,
								issued_token_type: 'urn:ietf:params:oauth:token-type:access_token',
							};
							result = mockTokenResponse;
							setTokenResponse(mockTokenResponse);
						}
					} else if (activeTab === 'refresh') {
						// Simulate token refresh
						const mockTokenResponse: TokenResponse = {
							access_token: `mock_refreshed_token_${Date.now()}`,
							token_type: 'Bearer',
							expires_in: 3600,
							scope: formData.scope,
							refresh_token: `mock_new_refresh_token_${Date.now()}`,
						};
						result = mockTokenResponse;
						setTokenResponse(mockTokenResponse);
					} else if (activeTab === 'introspect') {
						// Simulate token introspection
						const mockIntrospectionResponse: TokenIntrospectionResponse = {
							active: true,
							scope: formData.scope,
							client_id: formData.clientId,
							token_type: 'Bearer',
							exp: Math.floor(Date.now() / 1000) + 3600,
							iat: Math.floor(Date.now() / 1000),
							sub: 'user_123456789',
							aud: formData.clientId,
							iss: `https://auth.pingone.com/${formData.environmentId}`,
							jti: `jti_${Date.now()}`,
						};
						result = mockIntrospectionResponse;
						setIntrospectionResponse(mockIntrospectionResponse);
					} else {
						// Simulate token revocation
						result = { success: true, message: 'Token revoked successfully' };
					}

					setResponse({
						success: true,
						message: `${activeTab} operation completed successfully`,
						result: result,
						authMethod: activeAuthMethod,
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
			id: 'step-3',
			title: 'Process Response',
			description: 'Process and validate the response from the token management operation.',
			code: `// Process Response
if (tokenResponse) {
  console.log('Token received:', tokenResponse);
  
  // Store tokens if applicable
  if (tokenResponse.access_token) {
    localStorage.setItem('oauth_tokens', JSON.stringify(tokenResponse));
    console.log('Tokens stored successfully');
  }
}

if (introspectionResponse) {
  console.log('Token introspection result:', introspectionResponse);
  console.log('Token active:', introspectionResponse.active);
  console.log('Token scope:', introspectionResponse.scope);
  console.log('Token expires at:', new Date(introspectionResponse.exp! * 1000));
}`,
			execute: async () => {
				logger.info('TokenManagementFlow', 'Processing response');

				if (tokenResponse) {
					// Store tokens using the standardized method
					const success = storeOAuthTokens(
						tokenResponse,
						'token-management',
						`Token Management (${activeTab})`
					);

					if (success) {
						setResponse((prev) => ({
							...prev,
							message: 'Tokens stored successfully',
							stored: true,
						}));
					}
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
		logger.info('TokenManagementFlow', `Step ${step + 1} completed`, result);
	}, []);

	const handleOperationStart = async () => {
		try {
			setDemoStatus('loading');
			setError(null);

			let result: unknown;

			if (activeTab === 'exchange') {
				if (activeSubTab === 'auth_code') {
					const mockTokenResponse: TokenResponse = {
						access_token: `mock_access_token_${Date.now()}`,
						token_type: 'Bearer',
						expires_in: 3600,
						scope: formData.scope,
						refresh_token: `mock_refresh_token_${Date.now()}`,
						id_token: `mock_id_token_${Date.now()}`,
					};
					result = mockTokenResponse;
					setTokenResponse(mockTokenResponse);
				} else {
					const mockTokenResponse: TokenResponse = {
						access_token: `mock_exchanged_token_${Date.now()}`,
						token_type: 'Bearer',
						expires_in: 3600,
						scope: formData.scope,
						issued_token_type: 'urn:ietf:params:oauth:token-type:access_token',
					};
					result = mockTokenResponse;
					setTokenResponse(mockTokenResponse);
				}
			} else if (activeTab === 'refresh') {
				const mockTokenResponse: TokenResponse = {
					access_token: `mock_refreshed_token_${Date.now()}`,
					token_type: 'Bearer',
					expires_in: 3600,
					scope: formData.scope,
					refresh_token: `mock_new_refresh_token_${Date.now()}`,
				};
				result = mockTokenResponse;
				setTokenResponse(mockTokenResponse);
			} else if (activeTab === 'introspect') {
				const mockIntrospectionResponse: TokenIntrospectionResponse = {
					active: true,
					scope: formData.scope,
					client_id: formData.clientId,
					token_type: 'Bearer',
					exp: Math.floor(Date.now() / 1000) + 3600,
					iat: Math.floor(Date.now() / 1000),
					sub: 'user_123456789',
					aud: formData.clientId,
					iss: `https://auth.pingone.com/${formData.environmentId}`,
					jti: `jti_${Date.now()}`,
				};
				result = mockIntrospectionResponse;
				setIntrospectionResponse(mockIntrospectionResponse);
			} else {
				result = { success: true, message: 'Token revoked successfully' };
			}

			setResponse({
				success: true,
				message: `${activeTab} operation completed successfully`,
				result: result,
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
			<FlowTitle>Token Management Flow</FlowTitle>
			<FlowDescription>
				This flow demonstrates comprehensive token management operations including token exchange,
				refresh, introspection, and revocation with multiple authentication methods.
			</FlowDescription>

			<InfoContainer>
				<h4> Token Management Features</h4>
				<p>
					The Token Management flow provides comprehensive token operations including authorization
					code exchange, token refresh, token introspection, and token revocation. It supports all
					major OAuth client authentication methods.
				</p>
			</InfoContainer>

			<FlowCredentials
				flowType="token-management"
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
				<Tab $active={activeTab === 'exchange'} onClick={() => setActiveTab('exchange')}>
					Token Exchange
				</Tab>
				<Tab $active={activeTab === 'refresh'} onClick={() => setActiveTab('refresh')}>
					Token Refresh
				</Tab>
				<Tab $active={activeTab === 'introspect'} onClick={() => setActiveTab('introspect')}>
					Token Introspection
				</Tab>
				<Tab $active={activeTab === 'revoke'} onClick={() => setActiveTab('revoke')}>
					Token Revocation
				</Tab>
			</TabContainer>

			{activeTab === 'exchange' && (
				<SubTabContainer>
					<SubTab
						$active={activeSubTab === 'auth_code'}
						onClick={() => setActiveSubTab('auth_code')}
					>
						Authorization Code
					</SubTab>
					<SubTab
						$active={activeSubTab === 'token_exchange'}
						onClick={() => setActiveSubTab('token_exchange')}
					>
						Token Exchange
					</SubTab>
				</SubTabContainer>
			)}

			<div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
				<div style={{ flex: 1 }}>
					<Label>Authentication Method</Label>
					<Select
						value={activeAuthMethod}
						onChange={(e) => setActiveAuthMethod(e.target.value as TokenAuthMethod['type'])}
					>
						<option value="NONE">NONE</option>
						<option value="CLIENT_SECRET_POST">CLIENT_SECRET_POST</option>
						<option value="CLIENT_SECRET_BASIC">CLIENT_SECRET_BASIC</option>
						<option value="CLIENT_SECRET_JWT">CLIENT_SECRET_JWT</option>
						<option value="PRIVATE_KEY_JWT">PRIVATE_KEY_JWT</option>
					</Select>
				</div>
			</div>

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
					setTokenResponse(null);
					setIntrospectionResponse(null);

					// Clear any potential ConfigChecker-related state or cached data
					try {
						// Clear any comparison results or cached application data
						sessionStorage.removeItem('config-checker-diffs');
						sessionStorage.removeItem('config-checker-last-check');
						sessionStorage.removeItem('pingone-app-cache');
						localStorage.removeItem('pingone-applications-cache');

						// Clear any worker token related cache that might be used for pre-flight checks
						sessionStorage.removeItem('worker-token-cache');
						localStorage.removeItem('worker-apps-cache');

						console.log(
							'🔄 [TokenManagementFlow] Reset: cleared ConfigChecker and pre-flight cache data'
						);
					} catch (error) {
						console.warn('[TokenManagementFlow] Failed to clear cache data:', error);
					}
				}}
				status={demoStatus}
				disabled={demoStatus === 'loading'}
				title={`Token Management Steps (${activeTab}${activeTab === 'exchange' ? ` - ${activeSubTab}` : ''})`}
			/>

			{tokenResponse && (
				<TokenContainer>
					<TokenTitle>Token Response</TokenTitle>

					<TokenDetails>
						<TokenDetail>
							<TokenLabel>Access Token</TokenLabel>
							<TokenValue>{tokenResponse.access_token}</TokenValue>
						</TokenDetail>
						<TokenDetail>
							<TokenLabel>Token Type</TokenLabel>
							<TokenValue>{tokenResponse.token_type}</TokenValue>
						</TokenDetail>
						<TokenDetail>
							<TokenLabel>Expires In</TokenLabel>
							<TokenValue>{tokenResponse.expires_in} seconds</TokenValue>
						</TokenDetail>
						<TokenDetail>
							<TokenLabel>Scope</TokenLabel>
							<TokenValue>{tokenResponse.scope || 'Not specified'}</TokenValue>
						</TokenDetail>
						{tokenResponse.refresh_token && (
							<TokenDetail>
								<TokenLabel>Refresh Token</TokenLabel>
								<TokenValue>{tokenResponse.refresh_token}</TokenValue>
							</TokenDetail>
						)}
						{tokenResponse.id_token && (
							<TokenDetail>
								<TokenLabel>ID Token</TokenLabel>
								<TokenValue>{tokenResponse.id_token}</TokenValue>
							</TokenDetail>
						)}
					</TokenDetails>
				</TokenContainer>
			)}

			{introspectionResponse && (
				<TokenContainer>
					<TokenTitle>Token Introspection Response</TokenTitle>

					<TokenDetails>
						<TokenDetail>
							<TokenLabel>Active</TokenLabel>
							<TokenValue>{introspectionResponse.active ? 'Yes' : 'No'}</TokenValue>
						</TokenDetail>
						<TokenDetail>
							<TokenLabel>Token Type</TokenLabel>
							<TokenValue>{introspectionResponse.token_type || 'Not specified'}</TokenValue>
						</TokenDetail>
						<TokenDetail>
							<TokenLabel>Scope</TokenLabel>
							<TokenValue>{introspectionResponse.scope || 'Not specified'}</TokenValue>
						</TokenDetail>
						<TokenDetail>
							<TokenLabel>Client ID</TokenLabel>
							<TokenValue>{introspectionResponse.client_id || 'Not specified'}</TokenValue>
						</TokenDetail>
						<TokenDetail>
							<TokenLabel>Subject</TokenLabel>
							<TokenValue>{introspectionResponse.sub || 'Not specified'}</TokenValue>
						</TokenDetail>
						<TokenDetail>
							<TokenLabel>Expires At</TokenLabel>
							<TokenValue>
								{introspectionResponse.exp
									? new Date(introspectionResponse.exp * 1000).toLocaleString()
									: 'Not specified'}
							</TokenValue>
						</TokenDetail>
					</TokenDetails>
				</TokenContainer>
			)}

			{response && (
				<ResponseContainer>
					<h4>Response:</h4>
					<CodeBlock>
						<JSONHighlighter data={response} />
					</CodeBlock>
				</ResponseContainer>
			)}

			{error && (
				<ErrorContainer>
					<h4>Error:</h4>
					<p>{error}</p>
				</ErrorContainer>
			)}

			<FormContainer>
				<h3>Manual Token Management Configuration</h3>
				<p>You can also manually configure the token management operations:</p>

				<div
					style={{
						display: 'grid',
						gridTemplateColumns: '1fr 1fr',
						gap: '1rem',
						marginBottom: '1rem',
					}}
				>
					<FormGroup>
						<Label>Client ID</Label>
						<Input
							type="text"
							value={formData.clientId}
							onChange={(e) => setFormData((prev) => ({ ...prev, clientId: e.target.value }))}
						/>
					</FormGroup>

					<FormGroup>
						<Label>Environment ID</Label>
						<Input
							type="text"
							value={formData.environmentId}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									environmentId: e.target.value,
								}))
							}
						/>
					</FormGroup>

					{activeTab === 'exchange' && activeSubTab === 'auth_code' && (
						<FormGroup>
							<Label>Authorization Code</Label>
							<Input
								type="text"
								value={formData.code}
								onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
								placeholder="Enter authorization code"
							/>
						</FormGroup>
					)}

					{activeTab === 'refresh' && (
						<FormGroup>
							<Label>Refresh Token</Label>
							<Input
								type="text"
								value={formData.refreshToken}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										refreshToken: e.target.value,
									}))
								}
								placeholder="Enter refresh token"
							/>
						</FormGroup>
					)}

					{activeTab === 'introspect' && (
						<FormGroup>
							<Label>Token to Introspect</Label>
							<Input
								type="text"
								value={formData.tokenToIntrospect}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										tokenToIntrospect: e.target.value,
									}))
								}
								placeholder="Enter token to introspect"
							/>
						</FormGroup>
					)}

					{activeTab === 'revoke' && (
						<FormGroup>
							<Label>Token to Revoke</Label>
							<Input
								type="text"
								value={formData.tokenToRevoke}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										tokenToRevoke: e.target.value,
									}))
								}
								placeholder="Enter token to revoke"
							/>
						</FormGroup>
					)}
				</div>

				<Button $variant="primary" onClick={handleOperationStart}>
					Execute{' '}
					{activeTab === 'exchange'
						? activeSubTab === 'auth_code'
							? 'Authorization Code Exchange'
							: 'Token Exchange'
						: activeTab === 'refresh'
							? 'Token Refresh'
							: activeTab === 'introspect'
								? 'Token Introspection'
								: 'Token Revocation'}
				</Button>
			</FormContainer>
		</FlowContainer>
	);
};

export default TokenManagementFlow;
