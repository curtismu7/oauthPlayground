/* eslint-disable */
import React, { useState} from 'react';
import styled from 'styled-components';
import { StepByStepFlow } from '../../components/StepByStepFlow';
import { SpecCard } from '../../components/SpecCard';
import FlowCredentials from '../../components/FlowCredentials';
import { storeOAuthTokens } from '../../utils/tokenStorage';
import { logger } from '../../utils/logger';

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

const PostForm = styled.form`;
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
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3 b82 f6;
    box-shadow: 0 0 0 3 px rgba(59, 130, 246, 0.1);
  }
`;

const Button = styled.button<{ $variant: 'primary' | 'secondary' | 'success' }>`;
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

const WarningContainer = styled.div`;
  background: #fef3 c7;
  border: 1 px solid #fde68 a;
  border-radius: 0.375 rem;
  padding: 1 rem;
  margin: 1 rem 0;
  color: #92400 e;
`;

interface ImplicitPostFlowProps {
  credentials?: {
    clientId: string;
    redirectUri: string;
    environmentId: string;
  };
}

const ImplicitPostFlow: React.FC<ImplicitPostFlowProps> = ({ credentials }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    clientId: credentials?.clientId || '',
    redirectUri: credentials?.redirectUri || 'http://localhost:3000/callback',
    environmentId: credentials?.environmentId || '',
    responseType: 'token id_token',
    scope: 'openid profile email',
    state: '',
    nonce: '',
    acrValues: '',
    prompt: '',
    maxAge: '',
    uiLocales: '',
    claims: ''
  });

  const generateState = useCallback(() => {;
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setFormData(prev => ({ ...prev, state }));
    return state;
  }, []);

  const generateNonce = useCallback(() => {;
    const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setFormData(prev => ({ ...prev, nonce }));
    return nonce;
  }, []);

  const steps = [
    {
      id: 'step-1',
      title: 'Configure Client Settings',
      description: 'Set up your OAuth client for implicit flow with POST requests.',
      code: `// Client Configuration for Implicit Flow
const clientConfig = {
  clientId: '${formData.clientId}',
  redirectUri: '${formData.redirectUri}',
  environmentId: '${formData.environmentId}',
  responseType: '${formData.responseType}',
  scope: '${formData.scope}';
};

// Note: Implicit flow does not use client secret
console.log('Client configured for implicit flow');`,
      execute: async () => {
        logger.info('ImplicitPostFlow', 'Configuring client settings');
        return { message: 'Client settings configured for implicit flow' };
      }
    },
    {
      id: 'step-2',
      title: 'Generate State and Nonce',
      description: 'Generate state parameter for CSRF protection and nonce for ID token validation.',
      code: `// Generate state and nonce
const state = generateState();
const nonce = generateNonce();

// Store state for validation
localStorage.setItem('oauth_state', state);
localStorage.setItem('oauth_nonce', nonce);

console.log('State:', state);
console.log('Nonce:', nonce);`,
      execute: async () => {
        logger.info('ImplicitPostFlow', 'Generating state and nonce');
        const state = generateState();
        const nonce = generateNonce();
        return { state, nonce };
      }
    },
    {
      id: 'step-3',
      title: 'Create Authorization Request Form',
      description: 'Build the POST form data for the implicit authorization request.',
      code: `// Create form data for POST request
const formData = new FormData();
formData.append('client_id', '${formData.clientId}');
formData.append('response_type', '${formData.responseType}');
formData.append('redirect_uri', '${formData.redirectUri}');
formData.append('scope', '${formData.scope}');
formData.append('state', '${formData.state}');
formData.append('nonce', '${formData.nonce}');
${formData.acrValues ? `formData.append('acr_values', '${formData.acrValues}');` : ''}
${formData.prompt ? `formData.append('prompt', '${formData.prompt}');` : ''}
${formData.maxAge ? `formData.append('max_age', '${formData.maxAge}');` : ''}
${formData.uiLocales ? `formData.append('ui_locales', '${formData.uiLocales}');` : ''}
${formData.claims ? `formData.append('claims', '${formData.claims}');` : ''}`,
      execute: async () => {
        logger.info('ImplicitPostFlow', 'Creating authorization request form');
        return { message: 'Authorization request form created' };
      }
    },
    {
      id: 'step-4',
      title: 'Submit Authorization Request',
      description: 'Submit the POST request to the authorization endpoint.',
      code: `// Submit authorization request
const authUrl = \`https://auth.pingone.com/\${environmentId}/as/authorize\`;

try {

  if (response.ok) {

    console.log('Authorization response:', result);
  } else {
    throw new Error(\`Authorization failed: \${response.status}\`);
  }
} catch (_error) {
  console.error('Authorization error:', _error);
}`,
      execute: async () => {
        logger.info('ImplicitPostFlow', 'Submitting authorization request');
        setDemoStatus('loading');
        
        try {
          // Simulate POST request to authorization endpoint
          const authUrl = `https://auth.pingone.com/${formData.environmentId}/as/authorize`;
          
          const formDataObj = new FormData();
          formDataObj.append('client_id', formData.clientId);
          formDataObj.append('response_type', formData.responseType);
          formDataObj.append('redirect_uri', formData.redirectUri);
          formDataObj.append('scope', formData.scope);
          formDataObj.append('state', formData.state);
          formDataObj.append('nonce', formData.nonce);
          
          if (formData.acrValues) formDataObj.append('acr_values', formData.acrValues);
          if (formData.prompt) formDataObj.append('prompt', formData.prompt);
          if (formData.maxAge) formDataObj.append('max_age', formData.maxAge);
          if (formData.uiLocales) formDataObj.append('ui_locales', formData.uiLocales);
          if (formData.claims) formDataObj.append('claims', formData.claims);

          // For demo purposes, simulate a successful response
          const mockResponse = {
            success: true,
            message: 'Authorization request submitted successfully',
            authUrl: authUrl,
            formData: Object.fromEntries(formDataObj.entries());
          };

          setResponse(mockResponse);
          setDemoStatus('success');
          return mockResponse;
        } catch (_error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setError(errorMessage);
          setDemoStatus('error');
          throw error;
        }
      }
    },
    {
      id: 'step-5',
      title: 'Handle Token Response',
      description: 'Extract tokens from the URL fragment in the callback.',
      code: `// Handle token response from URL fragment
const hashParams = new URLSearchParams(window.location.hash.substring(1));
const accessToken = hashParams.get('access_token');
const idToken = hashParams.get('id_token');
const tokenType = hashParams.get('token_type');
const expiresIn = hashParams.get('expires_in');
const scope = hashParams.get('scope');
const state = hashParams.get('state');

// Validate state parameter
const storedState = localStorage.getItem('oauth_state');
if (state !== storedState) {
  throw new Error('Invalid state parameter');
}

console.log('Access Token:', accessToken);
console.log('ID Token:', idToken);
console.log('Token Type:', tokenType);
console.log('Expires In:', expiresIn);
console.log('Scope:', scope);`,
      execute: async () => {
        logger.info('ImplicitPostFlow', 'Handling token response');
        return { message: 'Token response handling implemented' };
      }
    },
    {
      id: 'step-6',
      title: 'Store Tokens',
      description: 'Store the received tokens for future use.',
      code: `// Store tokens

// Store using standardized method
localStorage.setItem('oauth_tokens', JSON.stringify(tokens));

console.log('Tokens stored successfully:', tokens);`,
      execute: async () => {
        logger.info('ImplicitPostFlow', 'Storing tokens');
        
        try {
          // Simulate token storage
          const mockTokens = {
            access_token: 'mock_access_token_' + Date.now(),
            id_token: 'mock_id_token_' + Date.now(),
            token_type: 'Bearer',
            expires_in: 3600,
            scope: formData.scope;
          };

          // Store tokens using the standardized method
          const success = storeOAuthTokens(mockTokens, 'implicit', 'Implicit POST Flow');
          
          if (success) {
            setResponse({ tokens: mockTokens, message: 'Tokens stored successfully' });
            return { tokens: mockTokens };
          } else {
            throw new Error('Failed to store tokens');
          }
        } catch (_error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setError(errorMessage);
          throw error;
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
    logger.info('ImplicitPostFlow', `Step ${step + 1} completed`, result);
  }, []);

  return (
    <FlowContainer>
      <FlowTitle>Implicit Flow (POST)</FlowTitle>
      <FlowDescription>
        This flow demonstrates the Implicit flow using POST requests. The Implicit flow is designed 
        for public clients (like SPAs) that cannot securely store client secrets. Tokens are returned 
        directly in the URL fragment.
      </FlowDescription>

      <WarningContainer>
        <h4>⚠️ Security Warning</h4>
        <SpecCard>
          <p>
            The Implicit flow is less secure than the Authorization Code flow because tokens are 
            exposed in the URL. It's recommended to use Authorization Code flow with PKCE for 
            better security, especially for new applications.
          </p>
        </SpecCard>
      </WarningContainer>

      <FlowCredentials
        flowType="implicit-post"
        onCredentialsChange={(newCredentials) => {
          setFormData(prev => ({
            ...prev,
            clientId: newCredentials.clientId || prev.clientId,
            redirectUri: newCredentials.redirectUri || prev.redirectUri,
            environmentId: newCredentials.environmentId || prev.environmentId
          }));
        }}
      />

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
        }}
        status={demoStatus}
        disabled={demoStatus === 'loading'}
        title="Implicit POST Flow Steps"
      />

      {response && (
        <ResponseContainer>
          <h4>Response:</h4>
          <CodeBlock>{JSON.stringify(response, null, 2)}</CodeBlock>
        </ResponseContainer>
      )}

      {error && (
        <ErrorContainer>
          <h4>Error:</h4>
          <p>{error}</p>
        </ErrorContainer>
      )}

      <PostForm>
        <h3>Manual Form Submission</h3>
        <p>You can also manually submit the authorization request using the form below:</p>
        
        <FormGroup>
          <Label>Client ID</Label>
          <Input
            type="text"
            value={formData.clientId}
            onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Response Type</Label>
          <Select
            value={formData.responseType}
            onChange={(e) => setFormData(prev => ({ ...prev, responseType: e.target.value }))}
          >
            <option value="token">token</option>
            <option value="id_token">id_token</option>
            <option value="token id_token">token id_token</option>
          </Select>
        </FormGroup>
        
        <FormGroup>
          <Label>Redirect URI</Label>
          <Input
            type="url"
            value={formData.redirectUri}
            onChange={(e) => setFormData(prev => ({ ...prev, redirectUri: e.target.value }))}
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Scope</Label>
          <Input
            type="text"
            value={formData.scope}
            onChange={(e) => setFormData(prev => ({ ...prev, scope: e.target.value }))}
          />
        </FormGroup>
        
        <FormGroup>
          <Label>State</Label>
          <Input
            type="text"
            value={formData.state}
            onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Nonce</Label>
          <Input
            type="text"
            value={formData.nonce}
            onChange={(e) => setFormData(prev => ({ ...prev, nonce: e.target.value }))}
          />
        </FormGroup>
        
        <Button $variant="primary" type="submit">
          Submit Authorization Request
        </Button>
      </PostForm>
    </FlowContainer>
  );
};

export default ImplicitPostFlow;
