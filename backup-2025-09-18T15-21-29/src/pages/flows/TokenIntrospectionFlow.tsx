/* eslint-disable */
import React, { useState} from 'react';
import styled from 'styled-components';
import { StepByStepFlow } from '../../components/StepByStepFlow';
import FlowCredentials from '../../components/FlowCredentials';
import { logger } from '../../utils/logger';
import JSONHighlighter from '../../components/JSONHighlighter';
import { 
  TokenManagementService, 
  TokenAuthMethod, 
  TokenIntrospectionResponse
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
  background: #1 f2937;
  color: #f9 fafb;
  padding: 1 rem;
  border-radius: 0.375 rem;
  font-size: 0.875 rem;
  overflow-x: auto;
  margin: 1 rem 0;
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

const IntrospectionContainer = styled.div`;
  background: #f8 fafc;
  border: 2 px solid #e2 e8 f0;
  border-radius: 0.5 rem;
  padding: 1.5 rem;
  margin: 1 rem 0;
`;

const IntrospectionTitle = styled.h4`;
  margin: 0 0 1 rem 0;
  color: #1 f2937;
  font-size: 1.125 rem;
  font-weight: 600;
`;

const IntrospectionDetails = styled.div`;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250 px, 1 fr));
  gap: 1 rem;
  margin-bottom: 1 rem;
`;

const IntrospectionDetail = styled.div`;
  display: flex;
  flex-direction: column;
`;

const IntrospectionLabel = styled.span`;
  font-size: 0.75 rem;
  color: #6 b7280;
  font-weight: 500;
  text-transform: uppercase;
  margin-bottom: 0.25 rem;
`;

const IntrospectionValue = styled.span<{ $active?: boolean }>`;
  font-size: 0.875 rem;
  color: ${({ $active }) => $active ? '#10 b981' : '#1 f2937'};
  font-weight: ${({ $active }) => $active ? '600' : '500'};
  word-break: break-all;
`;

const StatusBadge = styled.span<{ $active: boolean }>`;
  display: inline-block;
  padding: 0.25 rem 0.5 rem;
  border-radius: 0.25 rem;
  font-size: 0.75 rem;
  font-weight: 500;
  text-transform: uppercase;
  background-color: ${({ $active }) => $active ? '#dcfce7' : '#fef2 f2'};
  color: ${({ $active }) => $active ? '#166534' : '#991 b1 b'};
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

interface TokenIntrospectionFlowProps {
  credentials?: {
    clientId: string;
    clientSecret: string;
    environmentId: string;
  };
}

const TokenIntrospectionFlow: React.FC<TokenIntrospectionFlowProps> = ({ credentials }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'access_token' | 'id_token' | 'refresh_token' | 'resource_based'>('access_token');
  const [activeAuthMethod, setActiveAuthMethod] = useState<TokenAuthMethod['type']>('CLIENT_SECRET_BASIC');
  const [formData, setFormData] = useState({
    clientId: credentials?.clientId || '',
    clientSecret: credentials?.clientSecret || '',
    environmentId: credentials?.environmentId || '',
    tokenToIntrospect: '',
    tokenTypeHint: 'access_token' as 'access_token' | 'id_token' | 'refresh_token',
    resourceId: '',
    resourceSecret: '',
    privateKey: '',
    keyId: '',
    jwksUri: ''
  });

  const [introspectionResponse, setIntrospectionResponse] = useState<TokenIntrospectionResponse | null>(null);
  const [tokenService] = useState(() => new TokenManagementService(formData.environmentId));

  const steps = [
    {
      id: 'step-1',
      title: 'Configure Token Introspection Settings',
      description: 'Set up your OAuth client for token introspection operations.',
      code: `// Token Introspection Configuration
const introspectionConfig = {
  clientId: '${formData.clientId}',
  clientSecret: '${formData.clientSecret}',
  environmentId: '${formData.environmentId}',
  tokenTypeHint: '${formData.tokenTypeHint}',
  authMethod: '${activeAuthMethod}',
  resourceId: '${formData.resourceId}',
  resourceSecret: '${formData.resourceSecret}';
};

console.log('Token introspection configured:', introspectionConfig);`,
      execute: async () => {
        logger.info('TokenIntrospectionFlow', 'Configuring token introspection settings');
      }
    },
    {
      id: 'step-2',
      title: `Introspect ${activeTab === 'resource_based' ? 'Token (Resource-based)' : activeTab.toUpperCase()}`,
      description: `Get detailed information about the ${activeTab === 'resource_based' ? 'token using resource-based authentication' : activeTab}.`,
      code: `// Token Introspection
const tokenService = new TokenManagementService('${formData.environmentId}');

const authMethod: TokenAuthMethod = {
  type: '${activeAuthMethod}',
  clientId: '${formData.clientId}',
  clientSecret: '${formData.clientSecret}',
  privateKey: '${formData.privateKey}',
  keyId: '${formData.keyId}',
  jwksUri: '${formData.jwksUri}'
};

const introspectionResponse = await tokenService.introspectToken(
  '${formData.tokenToIntrospect}',
  '${formData.tokenTypeHint}',
  authMethod,
  '${formData.resourceId}',
  '${formData.resourceSecret}';
);

console.log('Token introspection response:', introspectionResponse);
console.log('Token active:', introspectionResponse.active);
console.log('Token scope:', introspectionResponse.scope);
console.log('Token expires at:', new Date(introspectionResponse.exp! * 1000));`,
      execute: async () => {
        logger.info('TokenIntrospectionFlow', 'Introspecting token', { 
          tokenType: activeTab,
          authMethod: activeAuthMethod 
        });
        setDemoStatus('loading');
        
        try {
          // Simulate token introspection based on token type
          let mockIntrospectionResponse: TokenIntrospectionResponse;
          
          if (activeTab === 'access_token') {
            mockIntrospectionResponse = {
              active: true,
              scope: 'openid profile email',
              client_id: formData.clientId,
              token_type: 'Bearer',
              exp: Math.floor(Date.now() / 1000) + 3600,
              iat: Math.floor(Date.now() / 1000) - 300,
              sub: 'user_123456789',
              aud: formData.clientId,
              iss: `https://auth.pingone.com/${formData.environmentId}`,
              jti: 'jti_' + Date.now(),
              username: 'john.doe@example.com',
              auth_time: Math.floor(Date.now() / 1000) - 600
            };
          } else if (activeTab === 'id_token') {
            mockIntrospectionResponse = {
              active: true,
              scope: 'openid profile email',
              client_id: formData.clientId,
              token_type: 'Bearer',
              exp: Math.floor(Date.now() / 1000) + 3600,
              iat: Math.floor(Date.now() / 1000) - 300,
              sub: 'user_123456789',
              aud: formData.clientId,
              iss: `https://auth.pingone.com/${formData.environmentId}`,
              jti: 'jti_' + Date.now(),
              username: 'john.doe@example.com',
              auth_time: Math.floor(Date.now() / 1000) - 600,
              nonce: 'nonce_' + Date.now(),
              at_hash: 'at_hash_' + Date.now()
            };
          } else if (activeTab === 'refresh_token') {
            mockIntrospectionResponse = {
              active: true,
              scope: 'openid profile email',
              client_id: formData.clientId,
              token_type: 'Bearer',
              exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
              iat: Math.floor(Date.now() / 1000) - 3600,
              sub: 'user_123456789',
              aud: formData.clientId,
              iss: `https://auth.pingone.com/${formData.environmentId}`,
              jti: 'jti_' + Date.now(),
              username: 'john.doe@example.com',
              auth_time: Math.floor(Date.now() / 1000) - 3600
            };
          } else {
            // Resource-based introspection
            mockIntrospectionResponse = {
              active: true,
              scope: 'openid profile email',
              client_id: formData.clientId,
              token_type: 'Bearer',
              exp: Math.floor(Date.now() / 1000) + 3600,
              iat: Math.floor(Date.now() / 1000) - 300,
              sub: 'user_123456789',
              aud: formData.clientId,
              iss: `https://auth.pingone.com/${formData.environmentId}`,
              jti: 'jti_' + Date.now(),
              username: 'john.doe@example.com',
              auth_time: Math.floor(Date.now() / 1000) - 600,
              resource: formData.resourceId
            };
          }

          setIntrospectionResponse(mockIntrospectionResponse);
          setResponse({
            success: true,
            message: 'Token introspection completed successfully',
            introspection: mockIntrospectionResponse,
            authMethod: activeAuthMethod,
            tokenType: activeTab
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
      title: 'Analyze Token Information',
      description: 'Analyze the token information and validate its properties.',
      code: `// Analyze Token Information
if (introspectionResponse.active) {
  console.log('✅ Token is active and valid');
  
  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (introspectionResponse.exp && introspectionResponse.exp > now) {
    const timeLeft = introspectionResponse.exp - now;
    console.log(\`⏰ Token expires in \${timeLeft} seconds\`);
  } else {
    console.log('⚠️ Token has expired');
  }
  
  // Check scope
  if (introspectionResponse.scope) {
    const scopes = introspectionResponse.scope.split(' ');
    console.log(\`🔐 Token has \${scopes.length} scopes:\`, scopes);
  }
  
  // Check audience
  if (introspectionResponse.aud) {
    console.log('🎯 Token audience:', introspectionResponse.aud);
  }
  
  // Check issuer
  if (introspectionResponse.iss) {
    console.log('🏢 Token issuer:', introspectionResponse.iss);
  }
} else {
  console.log('❌ Token is inactive or invalid');
}`,
      execute: async () => {
        logger.info('TokenIntrospectionFlow', 'Analyzing token information');
        
        if (introspectionResponse) {
          const analysis = {
            isActive: introspectionResponse.active,
            isExpired: introspectionResponse.exp ? introspectionResponse.exp < Math.floor(Date.now() / 1000) : false,
            timeLeft: introspectionResponse.exp ? Math.max(0, introspectionResponse.exp - Math.floor(Date.now() / 1000)) : 0,
            scopeCount: introspectionResponse.scope ? introspectionResponse.scope.split(' ').length : 0,
            hasAudience: !!introspectionResponse.aud,
            hasIssuer: !!introspectionResponse.iss;
          };

          setResponse(prev => ({ 
            ...prev, 
            analysis: analysis,
            message: 'Token analysis completed'
          }));
        }
      }
    },
    {
      id: 'step-4',
      title: 'Handle Token Validation',
      description: 'Validate the token and handle different validation scenarios.',
      code: `// Handle Token Validation
const validateToken = (introspectionResponse) => {;
  const validations = [];
  
  // Check if token is active
  if (!introspectionResponse.active) {
    validations.push({ type: 'error', message: 'Token is inactive' });
    return { valid: false, validations };
  }
  
  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (introspectionResponse.exp && introspectionResponse.exp <= now) {
    validations.push({ type: 'error', message: 'Token has expired' });
    return { valid: false, validations };
  }
  
  // Check if token is not yet valid
  if (introspectionResponse.nbf && introspectionResponse.nbf > now) {
    validations.push({ type: 'warning', message: 'Token is not yet valid' });
  }
  
  // Check required scopes
  const requiredScopes = ['openid'];
  if (introspectionResponse.scope) {
    const tokenScopes = introspectionResponse.scope.split(' ');
    const missingScopes = requiredScopes.filter(scope => !tokenScopes.includes(scope));
    if (missingScopes.length > 0) {
      validations.push({ type: 'warning', message: \`Missing required scopes: \${missingScopes.join(', ')}\` });
    }
  }
  
  // Check audience
  if (!introspectionResponse.aud) {
    validations.push({ type: 'warning', message: 'Token has no audience' });
  }
  
  validations.push({ type: 'success', message: 'Token validation passed' });
  
  return { valid: true, validations };
};

const validation = validateToken(introspectionResponse);
console.log('Token validation result:', validation);`,
      execute: async () => {
        logger.info('TokenIntrospectionFlow', 'Validating token');
        
        if (introspectionResponse) {
          const validations = [];
          
          if (!introspectionResponse.active) {
            validations.push({ type: 'error', message: 'Token is inactive' });
          } else {
            const now = Math.floor(Date.now() / 1000);
            if (introspectionResponse.exp && introspectionResponse.exp <= now) {
              validations.push({ type: 'error', message: 'Token has expired' });
            } else {
              validations.push({ type: 'success', message: 'Token validation passed' });
            }
          }

          setResponse(prev => ({ 
            ...prev, 
            validation: { valid: validations.every(v => v.type !== 'error'), validations },
            message: 'Token validation completed'
          }));
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
    logger.info('TokenIntrospectionFlow', `Step ${step + 1} completed`, result);
  }, []);

  const handleIntrospectionStart = async () => {
    try {;
      setDemoStatus('loading');
      setError(null);
      
      // Simulate token introspection
      let mockIntrospectionResponse: TokenIntrospectionResponse;
      
      if (activeTab === 'access_token') {
        mockIntrospectionResponse = {
          active: true,
          scope: 'openid profile email',
          client_id: formData.clientId,
          token_type: 'Bearer',
          exp: Math.floor(Date.now() / 1000) + 3600,
          iat: Math.floor(Date.now() / 1000) - 300,
          sub: 'user_123456789',
          aud: formData.clientId,
          iss: `https://auth.pingone.com/${formData.environmentId}`,
          jti: 'jti_' + Date.now(),
          username: 'john.doe@example.com',
          auth_time: Math.floor(Date.now() / 1000) - 600
        };
      } else if (activeTab === 'id_token') {
        mockIntrospectionResponse = {
          active: true,
          scope: 'openid profile email',
          client_id: formData.clientId,
          token_type: 'Bearer',
          exp: Math.floor(Date.now() / 1000) + 3600,
          iat: Math.floor(Date.now() / 1000) - 300,
          sub: 'user_123456789',
          aud: formData.clientId,
          iss: `https://auth.pingone.com/${formData.environmentId}`,
          jti: 'jti_' + Date.now(),
          username: 'john.doe@example.com',
          auth_time: Math.floor(Date.now() / 1000) - 600,
          nonce: 'nonce_' + Date.now(),
          at_hash: 'at_hash_' + Date.now()
        };
      } else if (activeTab === 'refresh_token') {
        mockIntrospectionResponse = {
          active: true,
          scope: 'openid profile email',
          client_id: formData.clientId,
          token_type: 'Bearer',
          exp: Math.floor(Date.now() / 1000) + 86400,
          iat: Math.floor(Date.now() / 1000) - 3600,
          sub: 'user_123456789',
          aud: formData.clientId,
          iss: `https://auth.pingone.com/${formData.environmentId}`,
          jti: 'jti_' + Date.now(),
          username: 'john.doe@example.com',
          auth_time: Math.floor(Date.now() / 1000) - 3600
        };
      } else {
        mockIntrospectionResponse = {
          active: true,
          scope: 'openid profile email',
          client_id: formData.clientId,
          token_type: 'Bearer',
          exp: Math.floor(Date.now() / 1000) + 3600,
          iat: Math.floor(Date.now() / 1000) - 300,
          sub: 'user_123456789',
          aud: formData.clientId,
          iss: `https://auth.pingone.com/${formData.environmentId}`,
          jti: 'jti_' + Date.now(),
          username: 'john.doe@example.com',
          auth_time: Math.floor(Date.now() / 1000) - 600,
          resource: formData.resourceId
        };
      }

      setIntrospectionResponse(mockIntrospectionResponse);
      setResponse({
        success: true,
        message: 'Token introspection completed successfully',
        introspection: mockIntrospectionResponse,
        authMethod: activeAuthMethod,
        tokenType: activeTab
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
      <FlowTitle>Token Introspection Flow</FlowTitle>
      <FlowDescription>
        This flow demonstrates token introspection operations to get detailed 
        information about access tokens, ID tokens, and refresh tokens. It supports 
        both client-based and resource-based introspection.
      </FlowDescription>

      <InfoContainer>
        <h4>🔍 Token Introspection Features</h4>
        <p>
          Token introspection allows you to get detailed information about tokens 
          including their validity, expiration, scope, and other claims. This is 
          essential for token validation and security analysis.
        </p>
      </InfoContainer>

      <FlowCredentials
        flowType="token-introspection"
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
        <Tab $active={activeTab === 'access_token'} onClick={() => setActiveTab('access_token')}>
          Access Token
        </Tab>
        <Tab $active={activeTab === 'id_token'} onClick={() => setActiveTab('id_token')}>
          ID Token
        </Tab>
        <Tab $active={activeTab === 'refresh_token'} onClick={() => setActiveTab('refresh_token')}>
          Refresh Token
        </Tab>
        <Tab $active={activeTab === 'resource_based'} onClick={() => setActiveTab('resource_based')}>
          Resource-based
        </Tab>
      </TabContainer>

      <div style={{ display: 'flex', gap: '1 rem', marginBottom: '1.5 rem' }}>
        <div style={{ flex: 1 }}>
          <Label>Authentication Method</Label>
          <Select
            value={activeAuthMethod}
            onChange={(e) => setActiveAuthMethod(e.target.value as TokenAuthMethod['type'])}
          >
            <option value="CLIENT_SECRET_BASIC">CLIENT_SECRET_BASIC</option>
            <option value="CLIENT_SECRET_POST">CLIENT_SECRET_POST</option>
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
          setIntrospectionResponse(null);
        }}
        status={demoStatus}
        disabled={demoStatus === 'loading'}
        title={`Token Introspection Steps (${activeTab})`}
      />

      {introspectionResponse && (
        <IntrospectionContainer>
          <IntrospectionTitle>
            Token Introspection Results
            <StatusBadge $active={introspectionResponse.active}>
              {introspectionResponse.active ? 'Active' : 'Inactive'}
            </StatusBadge>
          </IntrospectionTitle>
          
          <IntrospectionDetails>
            <IntrospectionDetail>
              <IntrospectionLabel>Token Type</IntrospectionLabel>
              <IntrospectionValue>{introspectionResponse.token_type || 'Not specified'}</IntrospectionValue>
            </IntrospectionDetail>
            <IntrospectionDetail>
              <IntrospectionLabel>Scope</IntrospectionLabel>
              <IntrospectionValue>{introspectionResponse.scope || 'Not specified'}</IntrospectionValue>
            </IntrospectionDetail>
            <IntrospectionDetail>
              <IntrospectionLabel>Client ID</IntrospectionLabel>
              <IntrospectionValue>{introspectionResponse.client_id || 'Not specified'}</IntrospectionValue>
            </IntrospectionDetail>
            <IntrospectionDetail>
              <IntrospectionLabel>Subject</IntrospectionLabel>
              <IntrospectionValue>{introspectionResponse.sub || 'Not specified'}</IntrospectionValue>
            </IntrospectionDetail>
            <IntrospectionDetail>
              <IntrospectionLabel>Username</IntrospectionLabel>
              <IntrospectionValue>{introspectionResponse.username || 'Not specified'}</IntrospectionValue>
            </IntrospectionDetail>
            <IntrospectionDetail>
              <IntrospectionLabel>Audience</IntrospectionLabel>
              <IntrospectionValue>
                {Array.isArray(introspectionResponse.aud) ? 
                  introspectionResponse.aud.join(', ') : 
                  introspectionResponse.aud || 'Not specified'
                }
              </IntrospectionValue>
            </IntrospectionDetail>
            <IntrospectionDetail>
              <IntrospectionLabel>Issuer</IntrospectionLabel>
              <IntrospectionValue>{introspectionResponse.iss || 'Not specified'}</IntrospectionValue>
            </IntrospectionDetail>
            <IntrospectionDetail>
              <IntrospectionLabel>JTI</IntrospectionLabel>
              <IntrospectionValue>{introspectionResponse.jti || 'Not specified'}</IntrospectionValue>
            </IntrospectionDetail>
            <IntrospectionDetail>
              <IntrospectionLabel>Issued At</IntrospectionLabel>
              <IntrospectionValue>
                {introspectionResponse.iat ? 
                  new Date(introspectionResponse.iat * 1000).toLocaleString() : 
                  'Not specified'
                }
              </IntrospectionValue>
            </IntrospectionDetail>
            <IntrospectionDetail>
              <IntrospectionLabel>Expires At</IntrospectionLabel>
              <IntrospectionValue>
                {introspectionResponse.exp ? 
                  new Date(introspectionResponse.exp * 1000).toLocaleString() : 
                  'Not specified'
                }
              </IntrospectionValue>
            </IntrospectionDetail>
            <IntrospectionDetail>
              <IntrospectionLabel>Auth Time</IntrospectionLabel>
              <IntrospectionValue>
                {introspectionResponse.auth_time ? 
                  new Date(introspectionResponse.auth_time * 1000).toLocaleString() : 
                  'Not specified'
                }
              </IntrospectionValue>
            </IntrospectionDetail>
            {introspectionResponse.nonce && (
              <IntrospectionDetail>
                <IntrospectionLabel>Nonce</IntrospectionLabel>
                <IntrospectionValue>{introspectionResponse.nonce}</IntrospectionValue>
              </IntrospectionDetail>
            )}
            {introspectionResponse.at_hash && (
              <IntrospectionDetail>
                <IntrospectionLabel>AT Hash</IntrospectionLabel>
                <IntrospectionValue>{introspectionResponse.at_hash}</IntrospectionValue>
              </IntrospectionDetail>
            )}
            {introspectionResponse.resource && (
              <IntrospectionDetail>
                <IntrospectionLabel>Resource</IntrospectionLabel>
                <IntrospectionValue>{introspectionResponse.resource}</IntrospectionValue>
              </IntrospectionDetail>
            )}
          </IntrospectionDetails>
        </IntrospectionContainer>
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
        <h3>Manual Token Introspection Configuration</h3>
        <p>You can also manually configure the token introspection:</p>
        
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
          
          <FormGroup>
            <Label>Token to Introspect</Label>
            <Input
              type="text"
              value={formData.tokenToIntrospect}
              onChange={(e) => setFormData(prev => ({ ...prev, tokenToIntrospect: e.target.value }))}
              placeholder="Enter token to introspect"
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Token Type Hint</Label>
            <Select
              value={formData.tokenTypeHint}
              onChange={(e) => setFormData(prev => ({ ...prev, tokenTypeHint: e.target.value as 'access_token' | 'id_token' | 'refresh_token' }))}
            >
              <option value="access_token">Access Token</option>
              <option value="id_token">ID Token</option>
              <option value="refresh_token">Refresh Token</option>
            </Select>
          </FormGroup>
          
          {activeTab === 'resource_based' && (
            <>
              <FormGroup>
                <Label>Resource ID</Label>
                <Input
                  type="text"
                  value={formData.resourceId}
                  onChange={(e) => setFormData(prev => ({ ...prev, resourceId: e.target.value }))}
                  placeholder="Enter resource ID"
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Resource Secret</Label>
                <Input
                  type="password"
                  value={formData.resourceSecret}
                  onChange={(e) => setFormData(prev => ({ ...prev, resourceSecret: e.target.value }))}
                  placeholder="Enter resource secret"
                />
              </FormGroup>
            </>
          )}
        </div>
        
        <Button $variant="primary" onClick={handleIntrospectionStart}>
          Introspect Token
        </Button>
      </FormContainer>
    </FlowContainer>
  );
};

export default TokenIntrospectionFlow;
