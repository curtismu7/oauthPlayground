/* eslint-disable */
import React, { useState} from 'react';
import styled from 'styled-components';
import { StepByStepFlow } from '../../components/StepByStepFlow';
import FlowCredentials from '../../components/FlowCredentials';
import { storeOAuthTokens } from '../../utils/tokenStorage';
import { logger } from '../../utils/logger';
import JSONHighlighter from '../../components/JSONHighlighter';
import { 
  TokenManagementService, 
  TokenRequest, 
  TokenAuthMethod, 
  TokenResponse,
  TokenIntrospectionResponse,
  TokenRevocationRequest
} from '../../services/tokenManagementService';

const FlowContainer = styled.div`;
  max-width: 1200 px;
  margin: 0 auto;
  padding: 2 rem;
`;

const FlowTitle = styled.h1`;
  color: #1 f2937;
  font-size: 2 rem;
  font-weight: 700;
  margin-bottom: 0.5 rem;
`;

const FlowDescription = styled.p`;
  color: #6 b7280;
  font-size: 1.125 rem;
  margin-bottom: 2 rem;
  line-height: 1.6;
`;

const FormContainer = styled.div`;
  background: #f9 fafb;
  border: 1 px solid #e5 e7 eb;
  border-radius: 0.5 rem;
  padding: 1.5 rem;
  margin: 1 rem 0;
`;

`;

const Label = styled.label`;
  display: block;
  margin-bottom: 0.5 rem;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`;
  width: 100%;
  padding: 0.5 rem;
  border: 1 px solid #d1 d5 db;
  border-radius: 0.375 rem;
  font-size: 0.875 rem;
  
  &:focus {
    outline: none;
    border-color: #3 b82 f6;
    box-shadow: 0 0 0 3 px rgba(59, 130, 246, 0.1);
  }
`;

  padding: 0.5 rem;
  border: 1 px solid #d1 d5 db;
  border-radius: 0.375 rem;
  font-size: 0.875 rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  min-height: 100 px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #3 b82 f6;
    box-shadow: 0 0 0 3 px rgba(59, 130, 246, 0.1);
  }
`;

  padding: 0.5 rem;
  border: 1 px solid #d1 d5 db;
  border-radius: 0.375 rem;
  font-size: 0.875 rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3 b82 f6;
    box-shadow: 0 0 0 3 px rgba(59, 130, 246, 0.1);
  }
`;

const Button = styled.button<{ $variant: 'primary' | 'secondary' | 'success' | 'danger' }>`;
  padding: 0.75 rem 1.5 rem;
  border: none;
  border-radius: 0.375 rem;
  font-size: 0.875 rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2 s;
  margin-right: 0.5 rem;
  margin-bottom: 0.5 rem;
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'primary':
        return `
          background-color: #3 b82 f6;
          color: white;
          &:hover { background-color: #2563 eb; }
        `;
      case 'secondary':
        return `
          background-color: #6 b7280;
          color: white;
          &:hover { background-color: #4 b5563; }
        `;
      case 'success':
        return `
          background-color: #10 b981;
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

const CodeBlock = styled.pre`;
  background: #ffffff;
  color: #111111;
  border: 1 px solid #d0 d7 de;
  padding: 1 rem;
  border-radius: 0.375 rem;
  font-size: 0.875 rem;
  overflow-x: auto;
  margin: 1 rem 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const ResponseContainer = styled.div`;
  background: #f0 fdf4;
  border: 1 px solid #86 efac;
  border-radius: 0.375 rem;
  padding: 1 rem;
  margin: 1 rem 0;
`;

const ErrorContainer = styled.div`;
  background: #fef2 f2;
  border: 1 px solid #fecaca;
  border-radius: 0.375 rem;
  padding: 1 rem;
  margin: 1 rem 0;
  color: #991 b1 b;
`;

  border: 1 px solid #93 c5 fd;
  border-radius: 0.375 rem;
  padding: 1 rem;
  margin: 1 rem 0;
  color: #1 e40 af;
`;

const TokenContainer = styled.div`;
  background: #f8 fafc;
  border: 2 px solid #e2 e8 f0;
  border-radius: 0.5 rem;
  padding: 1.5 rem;
  margin: 1 rem 0;
`;

const TokenTitle = styled.h4`;
  margin: 0 0 1 rem 0;
  color: #1 f2937;
  font-size: 1.125 rem;
  font-weight: 600;
`;

const TokenDetails = styled.div`;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200 px, 1 fr));
  gap: 1 rem;
  margin-bottom: 1 rem;
`;

const TokenDetail = styled.div`;
  display: flex;
  flex-direction: column;
`;

const TokenLabel = styled.span`;
  font-size: 0.75 rem;
  color: #6 b7280;
  font-weight: 500;
  text-transform: uppercase;
  margin-bottom: 0.25 rem;
`;

const TokenValue = styled.span`;
  font-size: 0.875 rem;
  color: #1 f2937;
  font-weight: 500;
  word-break: break-all;
`;

const TabContainer = styled.div`;
  display: flex;
  border-bottom: 1 px solid #e5 e7 eb;
  margin-bottom: 1.5 rem;
`;

const Tab = styled.button<{ $active: boolean }>`;
  background: none;
  border: none;
  padding: 0.75 rem 1 rem;
  font-size: 0.875 rem;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2 px solid ${({ $active }) => $active ? '#3 b82 f6' : 'transparent'};
  color: ${({ $active }) => $active ? '#3 b82 f6' : '#6 b7280'};
  
  &:hover {
    color: #3 b82 f6;
  }
`;

const SubTabContainer = styled.div`;
  display: flex;
  border-bottom: 1 px solid #e5 e7 eb;
  margin-bottom: 1 rem;
`;

const SubTab = styled.button<{ $active: boolean }>`;
  background: none;
  border: none;
  padding: 0.5 rem 0.75 rem;
  font-size: 0.75 rem;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2 px solid ${({ $active }) => $active ? '#10 b981' : 'transparent'};
  color: ${({ $active }) => $active ? '#10 b981' : '#6 b7280'};
  
  &:hover {
    color: #10 b981;
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
  const [activeTab, setActiveTab] = useState<'exchange' | 'refresh' | 'introspect' | 'revoke'>('exchange');
  const [activeSubTab, setActiveSubTab] = useState<'auth_code' | 'token_exchange'>('auth_code');
  const [activeAuthMethod, setActiveAuthMethod] = useState<TokenAuthMethod['type']>('CLIENT_SECRET_POST');
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
    revocationTokenTypeHint: 'access_token' as 'access_token' | 'refresh_token'
  });

  const [tokenResponse, setTokenResponse] = useState<TokenResponse | null>(null);
  const [introspectionResponse, setIntrospectionResponse] = useState<TokenIntrospectionResponse | null>(null);
  const [tokenService] = useState(() => new TokenManagementService(formData.environmentId));

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
  redirectUri: '${formData.redirectUri}';
};

console.log('Token management configured:', tokenConfig);`,
      execute: async () => {
        logger.info('TokenManagementFlow', 'Configuring token management settings');
      }
    },
    {
      id: 'step-2',
      title: activeTab === 'exchange' ? 
        (activeSubTab === 'auth_code' ? 'Exchange Authorization Code' : 'Exchange Tokens') :
        activeTab === 'refresh' ? 'Refresh Access Token' :
        activeTab === 'introspect' ? 'Introspect Token' : 'Revoke Token',
      description: activeTab === 'exchange' ? 
        (activeSubTab === 'auth_code' ? 'Exchange authorization code for access and ID tokens.' : 'Exchange tokens using token exchange grant.') :
        activeTab === 'refresh' ? 'Refresh an expired access token using refresh token.' :
        activeTab === 'introspect' ? 'Get information about a token.' : 'Revoke a token to invalidate it.',
      code: activeTab === 'exchange' ? 
        (activeSubTab === 'auth_code' ? 
          `// Exchange Authorization Code
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
console.log('Token Response:', tokenResponse);` :
          `// Exchange Tokens
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
console.log('Token Exchange Response:', tokenResponse);`) :
        activeTab === 'refresh' ?
          `// Refresh Access Token
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
console.log('Token Refresh Response:', tokenResponse);` :
        activeTab === 'introspect' ?
          `// Introspect Token
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
  '${formData.resourceSecret}';
);
console.log('Token Introspection Response:', introspectionResponse);` :
          `// Revoke Token
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
          authMethod: activeAuthMethod 
        });
        setDemoStatus('loading');
        
        try {
          let result: unknown;
          
          if (activeTab === 'exchange') {
            if (activeSubTab === 'auth_code') {
              // Simulate authorization code exchange
              const mockTokenResponse: TokenResponse = {
                access_token: 'mock_access_token_' + Date.now(),
                token_type: 'Bearer',
                expires_in: 3600,
                scope: formData.scope,
                refresh_token: 'mock_refresh_token_' + Date.now(),
                id_token: 'mock_id_token_' + Date.now()
              };
              result = mockTokenResponse;
              setTokenResponse(mockTokenResponse);
            } else {
              // Simulate token exchange
              const mockTokenResponse: TokenResponse = {
                access_token: 'mock_exchanged_token_' + Date.now(),
                token_type: 'Bearer',
                expires_in: 3600,
                scope: formData.scope,
                issued_token_type: 'urn:ietf:params:oauth:token-type:access_token'
              };
              result = mockTokenResponse;
              setTokenResponse(mockTokenResponse);
            }
          } else if (activeTab === 'refresh') {
            // Simulate token refresh
            const mockTokenResponse: TokenResponse = {
              access_token: 'mock_refreshed_token_' + Date.now(),
              token_type: 'Bearer',
              expires_in: 3600,
              scope: formData.scope,
              refresh_token: 'mock_new_refresh_token_' + Date.now()
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
              jti: 'jti_' + Date.now()
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
            authMethod: activeAuthMethod
          });
          setDemoStatus('success');
        } catch (_error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setError(errorMessage);
          setDemoStatus('error');
          throw error;
        }
      }
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
          const success = storeOAuthTokens(tokenResponse, 'token-management', `Token Management (${activeTab})`);
          
          if (success) {
            setResponse(prev => ({ 
              ...prev, 
              message: 'Tokens stored successfully',
              stored: true
            }));
          }
        }
      }
    }
  ];

  const handleStepChange = useCallback((step: number) => {;
    setCurrentStep(step);
    setDemoStatus('idle');
    setResponse(null);
    setError(null);
  }, []);

  const handleStepResult = useCallback((step: number, result: unknown) => {;
    logger.info('TokenManagementFlow', `Step ${step + 1} completed`, result);
  }, []);

  const handleOperationStart = async () => {
    try {;
      setDemoStatus('loading');
      setError(null);
      
      let result: unknown;
      
      if (activeTab === 'exchange') {
        if (activeSubTab === 'auth_code') {
          const mockTokenResponse: TokenResponse = {
            access_token: 'mock_access_token_' + Date.now(),
            token_type: 'Bearer',
            expires_in: 3600,
            scope: formData.scope,
            refresh_token: 'mock_refresh_token_' + Date.now(),
            id_token: 'mock_id_token_' + Date.now()
          };
          result = mockTokenResponse;
          setTokenResponse(mockTokenResponse);
        } else {
          const mockTokenResponse: TokenResponse = {
            access_token: 'mock_exchanged_token_' + Date.now(),
            token_type: 'Bearer',
            expires_in: 3600,
            scope: formData.scope,
            issued_token_type: 'urn:ietf:params:oauth:token-type:access_token'
          };
          result = mockTokenResponse;
          setTokenResponse(mockTokenResponse);
        }
      } else if (activeTab === 'refresh') {
        const mockTokenResponse: TokenResponse = {
          access_token: 'mock_refreshed_token_' + Date.now(),
          token_type: 'Bearer',
          expires_in: 3600,
          scope: formData.scope,
          refresh_token: 'mock_new_refresh_token_' + Date.now()
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
          jti: 'jti_' + Date.now()
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
        authMethod: activeAuthMethod
      });
      setDemoStatus('success');
    } catch (_error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      setDemoStatus('error');
    }
  };

  return (
    <FlowContainer>
      <FlowTitle>Token Management Flow</FlowTitle>
      <FlowDescription>
        This flow demonstrates comprehensive token management operations including 
        token exchange, refresh, introspection, and revocation with multiple 
        authentication methods.
      </FlowDescription>

      <InfoContainer>
        <h4>🔑 Token Management Features</h4>
        <p>
          The Token Management flow provides comprehensive token operations including 
          authorization code exchange, token refresh, token introspection, and token 
          revocation. It supports all major OAuth client authentication methods.
        </p>
      </InfoContainer>

      <FlowCredentials
        flowType="token-management"
        onCredentialsChange={(newCredentials) => {
          setFormData(prev => ({
            ...prev,
            clientId: newCredentials.clientId || prev.clientId,
            clientSecret: newCredentials.clientSecret || prev.clientSecret,
            environmentId: newCredentials.environmentId || prev.environmentId
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
          <SubTab $active={activeSubTab === 'auth_code'} onClick={() => setActiveSubTab('auth_code')}>
            Authorization Code
          </SubTab>
          <SubTab $active={activeSubTab === 'token_exchange'} onClick={() => setActiveSubTab('token_exchange')}>
            Token Exchange
          </SubTab>
        </SubTabContainer>
      )}

      <div style={{ display: 'flex', gap: '1 rem', marginBottom: '1.5 rem' }}>
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
                {introspectionResponse.exp ? 
                  new Date(introspectionResponse.exp * 1000).toLocaleString() : 
                  'Not specified'
                }
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
        
        <div style={{ display: 'grid', gridTemplateColumns: '1 fr 1 fr', gap: '1 rem', marginBottom: '1 rem' }}>
          <FormGroup>
            <Label>Client ID</Label>
            <Input
              type="text"
              value={formData.clientId}
              onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Environment ID</Label>
            <Input
              type="text"
              value={formData.environmentId}
              onChange={(e) => setFormData(prev => ({ ...prev, environmentId: e.target.value }))}
            />
          </FormGroup>
          
          {activeTab === 'exchange' && activeSubTab === 'auth_code' && (
            <FormGroup>
              <Label>Authorization Code</Label>
              <Input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, refreshToken: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, tokenToIntrospect: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, tokenToRevoke: e.target.value }))}
                placeholder="Enter token to revoke"
              />
            </FormGroup>
          )}
        </div>
        
        <Button $variant="primary" onClick={handleOperationStart}>
          Execute {activeTab === 'exchange' ? (activeSubTab === 'auth_code' ? 'Authorization Code Exchange' : 'Token Exchange') : 
                   activeTab === 'refresh' ? 'Token Refresh' :
                   activeTab === 'introspect' ? 'Token Introspection' : 'Token Revocation'}
        </Button>
      </FormContainer>
    </FlowContainer>
  );
};

export default TokenManagementFlow;
