import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { StepByStepFlow } from '../../components/StepByStepFlow';
import FlowCredentials from '../../components/FlowCredentials';
import { logger } from '../../utils/logger';
import JSONHighlighter from '../../components/JSONHighlighter';
import {
	TokenManagementService,
	TokenAuthMethod,
	TokenIntrospectionResponse,
} from '../../services/tokenManagementService';

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

const TextArea = styled.textarea`
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

const Button = styled.button<{ $variant: 'primary' | 'secondary' | 'success' | 'danger' }>`
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
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  overflow-x: auto;
  margin: 1rem 0;
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

const IntrospectionContainer = styled.div`
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
`;

const IntrospectionTitle = styled.h4`
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.125rem;
  font-weight: 600;
`;

const IntrospectionDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const IntrospectionDetail = styled.div`
  display: flex;
  flex-direction: column;
`;

const IntrospectionLabel = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
`;

const IntrospectionValue = styled.span<{ $active?: boolean }>`
  font-size: 0.875rem;
  color: ${({ $active }) => ($active ? '#10b981' : '#1f2937')};
  font-weight: ${({ $active }) => ($active ? '600' : '500')};
  word-break: break-all;
`;

const StatusBadge = styled.span<{ $active: boolean }>`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  background-color: ${({ $active }) => ($active ? '#dcfce7' : '#fef2f2')};
  color: ${({ $active }) => ($active ? '#166534' : '#991b1b')};
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
	const [activeTab, setActiveTab] = useState<
		'access_token' | 'id_token' | 'refresh_token' | 'resource_based'
	>('access_token');
	const [activeAuthMethod, setActiveAuthMethod] =
		useState<TokenAuthMethod['type']>('CLIENT_SECRET_BASIC');
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
		jwksUri: '',
	});
	const [response, setResponse] = useState<Record<string, unknown> | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [introspectionResponse, setIntrospectionResponse] =
		useState<TokenIntrospectionResponse | null>(null);
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
  resourceSecret: '${formData.resourceSecret}'
};

console.log('Token introspection configured:', introspectionConfig);`,
			execute: async () => {
				logger.info('TokenIntrospectionFlow', 'Configuring token introspection settings');
			},
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
  '${formData.resourceSecret}'
);

console.log('Token introspection response:', introspectionResponse);
console.log('Token active:', introspectionResponse.active);
console.log('Token scope:', introspectionResponse.scope);
console.log('Token expires at:', new Date(introspectionResponse.exp! * 1000));`,
			execute: async () => {
				logger.info('TokenIntrospectionFlow', 'Introspecting token', {
					tokenType: activeTab,
					authMethod: activeAuthMethod,
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
							auth_time: Math.floor(Date.now() / 1000) - 600,
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
							at_hash: 'at_hash_' + Date.now(),
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
							auth_time: Math.floor(Date.now() / 1000) - 3600,
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
							resource: formData.resourceId,
						};
					}

					setIntrospectionResponse(mockIntrospectionResponse);
					setResponse({
						success: true,
						message: 'Token introspection completed successfully',
						introspection: mockIntrospectionResponse,
						authMethod: activeAuthMethod,
						tokenType: activeTab,
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
						isExpired: introspectionResponse.exp
							? introspectionResponse.exp < Math.floor(Date.now() / 1000)
							: false,
						timeLeft: introspectionResponse.exp
							? Math.max(0, introspectionResponse.exp - Math.floor(Date.now() / 1000))
							: 0,
						scopeCount: introspectionResponse.scope
							? introspectionResponse.scope.split(' ').length
							: 0,
						hasAudience: !!introspectionResponse.aud,
						hasIssuer: !!introspectionResponse.iss,
					};

					setResponse((prev) => ({
						...prev,
						analysis: analysis,
						message: 'Token analysis completed',
					}));
				}
			},
		},
		{
			id: 'step-4',
			title: 'Handle Token Validation',
			description: 'Validate the token and handle different validation scenarios.',
			code: `// Handle Token Validation
const validateToken = (introspectionResponse) => {
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

					setResponse((prev) => ({
						...prev,
						validation: { valid: validations.every((v) => v.type !== 'error'), validations },
						message: 'Token validation completed',
					}));
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
		logger.info('TokenIntrospectionFlow', `Step ${step + 1} completed`, result);
	}, []);

	const handleIntrospectionStart = async () => {
		try {
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
					auth_time: Math.floor(Date.now() / 1000) - 600,
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
					at_hash: 'at_hash_' + Date.now(),
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
					auth_time: Math.floor(Date.now() / 1000) - 3600,
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
					resource: formData.resourceId,
				};
			}

			setIntrospectionResponse(mockIntrospectionResponse);
			setResponse({
				success: true,
				message: 'Token introspection completed successfully',
				introspection: mockIntrospectionResponse,
				authMethod: activeAuthMethod,
				tokenType: activeTab,
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
			<FlowTitle>Token Introspection Flow</FlowTitle>
			<FlowDescription>
				This flow demonstrates token introspection operations to get detailed information about
				access tokens, ID tokens, and refresh tokens. It supports both client-based and
				resource-based introspection.
			</FlowDescription>

			<InfoContainer>
				<h4>🔍 Token Introspection Features</h4>
				<p>
					Token introspection allows you to get detailed information about tokens including their
					validity, expiration, scope, and other claims. This is essential for token validation and
					security analysis.
				</p>
			</InfoContainer>

			<FlowCredentials
				flowType="token-introspection"
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
				<Tab $active={activeTab === 'access_token'} onClick={() => setActiveTab('access_token')}>
					Access Token
				</Tab>
				<Tab $active={activeTab === 'id_token'} onClick={() => setActiveTab('id_token')}>
					ID Token
				</Tab>
				<Tab $active={activeTab === 'refresh_token'} onClick={() => setActiveTab('refresh_token')}>
					Refresh Token
				</Tab>
				<Tab
					$active={activeTab === 'resource_based'}
					onClick={() => setActiveTab('resource_based')}
				>
					Resource-based
				</Tab>
			</TabContainer>

			<div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
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
							<IntrospectionValue>
								{introspectionResponse.token_type || 'Not specified'}
							</IntrospectionValue>
						</IntrospectionDetail>
						<IntrospectionDetail>
							<IntrospectionLabel>Scope</IntrospectionLabel>
							<IntrospectionValue>
								{introspectionResponse.scope || 'Not specified'}
							</IntrospectionValue>
						</IntrospectionDetail>
						<IntrospectionDetail>
							<IntrospectionLabel>Client ID</IntrospectionLabel>
							<IntrospectionValue>
								{introspectionResponse.client_id || 'Not specified'}
							</IntrospectionValue>
						</IntrospectionDetail>
						<IntrospectionDetail>
							<IntrospectionLabel>Subject</IntrospectionLabel>
							<IntrospectionValue>
								{introspectionResponse.sub || 'Not specified'}
							</IntrospectionValue>
						</IntrospectionDetail>
						<IntrospectionDetail>
							<IntrospectionLabel>Username</IntrospectionLabel>
							<IntrospectionValue>
								{introspectionResponse.username || 'Not specified'}
							</IntrospectionValue>
						</IntrospectionDetail>
						<IntrospectionDetail>
							<IntrospectionLabel>Audience</IntrospectionLabel>
							<IntrospectionValue>
								{Array.isArray(introspectionResponse.aud)
									? introspectionResponse.aud.join(', ')
									: introspectionResponse.aud || 'Not specified'}
							</IntrospectionValue>
						</IntrospectionDetail>
						<IntrospectionDetail>
							<IntrospectionLabel>Issuer</IntrospectionLabel>
							<IntrospectionValue>
								{introspectionResponse.iss || 'Not specified'}
							</IntrospectionValue>
						</IntrospectionDetail>
						<IntrospectionDetail>
							<IntrospectionLabel>JTI</IntrospectionLabel>
							<IntrospectionValue>
								{introspectionResponse.jti || 'Not specified'}
							</IntrospectionValue>
						</IntrospectionDetail>
						<IntrospectionDetail>
							<IntrospectionLabel>Issued At</IntrospectionLabel>
							<IntrospectionValue>
								{introspectionResponse.iat
									? new Date(introspectionResponse.iat * 1000).toLocaleString()
									: 'Not specified'}
							</IntrospectionValue>
						</IntrospectionDetail>
						<IntrospectionDetail>
							<IntrospectionLabel>Expires At</IntrospectionLabel>
							<IntrospectionValue>
								{introspectionResponse.exp
									? new Date(introspectionResponse.exp * 1000).toLocaleString()
									: 'Not specified'}
							</IntrospectionValue>
						</IntrospectionDetail>
						<IntrospectionDetail>
							<IntrospectionLabel>Auth Time</IntrospectionLabel>
							<IntrospectionValue>
								{introspectionResponse.auth_time
									? new Date(introspectionResponse.auth_time * 1000).toLocaleString()
									: 'Not specified'}
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
							onChange={(e) => setFormData((prev) => ({ ...prev, environmentId: e.target.value }))}
						/>
					</FormGroup>

					<FormGroup>
						<Label>Token to Introspect</Label>
						<Input
							type="text"
							value={formData.tokenToIntrospect}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, tokenToIntrospect: e.target.value }))
							}
							placeholder="Enter token to introspect"
						/>
					</FormGroup>

					<FormGroup>
						<Label>Token Type Hint</Label>
						<Select
							value={formData.tokenTypeHint}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									tokenTypeHint: e.target.value as 'access_token' | 'id_token' | 'refresh_token',
								}))
							}
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
									onChange={(e) => setFormData((prev) => ({ ...prev, resourceId: e.target.value }))}
									placeholder="Enter resource ID"
								/>
							</FormGroup>

							<FormGroup>
								<Label>Resource Secret</Label>
								<Input
									type="password"
									value={formData.resourceSecret}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, resourceSecret: e.target.value }))
									}
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
