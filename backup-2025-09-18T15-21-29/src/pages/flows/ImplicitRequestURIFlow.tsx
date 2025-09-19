/* eslint-disable */
import React, { useState} from 'react';
import styled from 'styled-components';
import { StepByStepFlow } from '../../components/StepByStepFlow';
import FlowCredentials from '../../components/FlowCredentials';
import { storeOAuthTokens } from '../../utils/tokenStorage';
import { logger } from '../../utils/logger';
import JSONHighlighter from '../../components/JSONHighlighter';
import { PARService, PARRequest, PARAuthMethod } from '../../services/parService';

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

const WarningContainer = styled.div`;
  background: #fef3 c7;
  border: 1 px solid #fde68 a;
  border-radius: 0.375 rem;
  padding: 1 rem;
  margin: 1 rem 0;
  color: #92400 e;
`;

const RequestURIContainer = styled.div`;
  background: #f8 fafc;
  border: 2 px solid #e2 e8 f0;
  border-radius: 0.5 rem;
  padding: 1.5 rem;
  margin: 1 rem 0;
`;

const RequestURITitle = styled.h4`;
  margin: 0 0 1 rem 0;
  color: #1 f2937;
  font-size: 1.125 rem;
  font-weight: 600;
`;

const RequestURIDetails = styled.div`;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200 px, 1 fr));
  gap: 1 rem;
  margin-bottom: 1 rem;
`;

const RequestURIDetail = styled.div`;
  display: flex;
  flex-direction: column;
`;

const RequestURILabel = styled.span`;
  font-size: 0.75 rem;
  color: #6 b7280;
  font-weight: 500;
  text-transform: uppercase;
  margin-bottom: 0.25 rem;
`;

const RequestURIValue = styled.span`;
  font-size: 0.875 rem;
  color: #1 f2937;
  font-weight: 500;
  word-break: break-all;
`;

interface ImplicitRequestURIFlowProps {
  credentials?: {
    clientId: string;
    clientSecret: string;
    environmentId: string;
  };
}

const ImplicitRequestURIFlow: React.FC<ImplicitRequestURIFlowProps> = ({ credentials }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    clientId: credentials?.clientId || '',
    clientSecret: credentials?.clientSecret || '',
    environmentId: credentials?.environmentId || '',
    redirectUri: 'http://localhost:3000/callback',
    scope: 'openid profile email',
    state: '',
    nonce: '',
    acrValues: '',
    prompt: 'consent',
    maxAge: '3600',
    uiLocales: 'en',
    claims: '{"userinfo": {"email": null, "phone_number": null}}',
    requestUri: ''
  });

  const [requestUri, setRequestUri] = useState<string>('');

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
      title: 'Configure Implicit Request URI Settings',
      description: 'Set up your OAuth client for Implicit flow with request URI.',
      code: `// Implicit Request URI Configuration
const implicitConfig = {
  clientId: '${formData.clientId}',
  clientSecret: '${formData.clientSecret}',
  environmentId: '${formData.environmentId}',
  redirectUri: '${formData.redirectUri}',
  scope: '${formData.scope}',
  state: '${formData.state}',
  nonce: '${formData.nonce}',
  acrValues: '${formData.acrValues}',
  prompt: '${formData.prompt}',
  maxAge: ${formData.maxAge},
  uiLocales: '${formData.uiLocales}',
  claims: ${formData.claims};
};

console.log('Implicit Request URI configured:', implicitConfig);`,
      execute: async () => {
        logger.info('ImplicitRequestURIFlow', 'Configuring Implicit Request URI settings');
        generateState();
        generateNonce();
      }
    },
    {
      id: 'step-2',
      title: 'Generate PAR Request',
      description: 'Generate a Pushed Authorization Request for the Implicit flow.',
      code: `// Generate PAR Request for Implicit Flow
const parRequest: PARRequest = {
  clientId: '${formData.clientId}',
  clientSecret: '${formData.clientSecret}',
  environmentId: '${formData.environmentId}',
  responseType: 'token id_token',
  redirectUri: '${formData.redirectUri}',
  scope: '${formData.scope}',
  state: '${formData.state}',
  nonce: '${formData.nonce}',
  acrValues: '${formData.acrValues}',
  prompt: '${formData.prompt}',
  maxAge: '${formData.maxAge}',
  uiLocales: '${formData.uiLocales}',
  claims: '${formData.claims}'
};

const authMethod: PARAuthMethod = {
  type: 'CLIENT_SECRET_POST',
  clientId: '${formData.clientId}',
  clientSecret: '${formData.clientSecret}'
};

const parService = new PARService('${formData.environmentId}');
const parResponse = await parService.generatePARRequest(parRequest, authMethod);
console.log('PAR Response:', parResponse);`,
      execute: async () => {
        logger.info('ImplicitRequestURIFlow', 'Generating PAR request for Implicit flow');
        setDemoStatus('loading');
        
        try {
          // Simulate PAR request for Implicit flow
          const mockRequestUri = `urn:ietf:params:oauth:request_uri:${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          
          const mockResponse = {
            success: true,
            message: 'PAR request generated for Implicit flow',
            requestUri: mockRequestUri,
            expiresIn: 600,
            expiresAt: Date.now() + 600000;
          };

          setRequestUri(mockRequestUri);
          setResponse(mockResponse);
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
      title: 'Generate Implicit Authorization URL',
      description: 'Generate the authorization URL using the request URI for Implicit flow.',
      code: `// Generate Implicit Authorization URL with Request URI
const authUrl = \`https://auth.pingone.com/\${environmentId}/as/authorize\`;

const authParams = new URLSearchParams({
  request_uri: '${requestUri || 'urn:ietf:params:oauth:request_uri:example'}',
  response_type: 'token id_token',
  client_id: '${formData.clientId}',
  redirect_uri: '${formData.redirectUri}',
  scope: '${formData.scope}',
  state: '${formData.state}',
  nonce: '${formData.nonce}';
});

const fullAuthUrl = \`\${authUrl}?\${authParams.toString()}\`;
console.log('Implicit Authorization URL:', fullAuthUrl);

// Redirect to authorization URL
window.location.href = fullAuthUrl;`,
      execute: async () => {
        logger.info('ImplicitRequestURIFlow', 'Generating Implicit authorization URL');
        
        if (requestUri) {
          const authUrl = `https://auth.pingone.com/${formData.environmentId}/as/authorize`;
          const authParams = new URLSearchParams({
            request_uri: requestUri,
            response_type: 'token id_token',
            client_id: formData.clientId,
            redirect_uri: formData.redirectUri,
            scope: formData.scope,
            state: formData.state,
            nonce: formData.nonce;
          });

          const fullAuthUrl = `${authUrl}?${authParams.toString()}`;
          
          setResponse(prev => ({ 
            ...prev, 
            authorizationUrl: fullAuthUrl,
            message: 'Implicit authorization URL generated successfully'
          }));
        }
      }
    },
    {
      id: 'step-4',
      title: 'Handle Implicit Response',
      description: 'Process the response from the Implicit authorization endpoint.',
      code: `// Handle Implicit Authorization Response
const urlParams = new URLSearchParams(window.location.hash.substring(1));
const accessToken = urlParams.get('access_token');
const idToken = urlParams.get('id_token');
const tokenType = urlParams.get('token_type');
const expiresIn = urlParams.get('expires_in');
const scope = urlParams.get('scope');
const state = urlParams.get('state');

const errorDescription = urlParams.get('error_description');

// Validate state parameter
const storedState = localStorage.getItem('oauth_state');
if (state !== storedState) {
  throw new Error('Invalid state parameter');
}

if (_error) {
  console.error('Implicit authorization error:', error, errorDescription);
  throw new Error(\`Implicit authorization failed: \${error}\`);
}

console.log('Implicit authorization successful');
console.log('Access Token:', accessToken);
console.log('ID Token:', idToken);
console.log('State validated:', state === storedState);`,
      execute: async () => {
        logger.info('ImplicitRequestURIFlow', 'Handling Implicit authorization response');
      }
    },
    {
      id: 'step-5',
      title: 'Store Implicit Tokens',
      description: 'Store the received access and ID tokens from the Implicit flow.',
      code: `// Store Implicit Tokens

// Store tokens
localStorage.setItem('oauth_tokens', JSON.stringify(tokens));

console.log('Implicit tokens stored:', tokens);`,
      execute: async () => {
        logger.info('ImplicitRequestURIFlow', 'Storing Implicit tokens');
        
        try {
          // Simulate token storage
          const mockTokens = {
            access_token: 'mock_access_token_' + Date.now(),
            id_token: 'mock_id_token_' + Date.now(),
            token_type: 'Bearer',
            expires_in: 3600,
            scope: formData.scope,
            state: formData.state,
            nonce: formData.nonce,
            flow_type: 'implicit_request_uri',
            par_used: true;
          };

          // Store tokens using the standardized method
          const success = storeOAuthTokens(mockTokens, 'implicit-request-uri', 'Implicit Request URI Flow');
          
          if (success) {
            setResponse(prev => ({ ...prev, tokens: mockTokens }));
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
    logger.info('ImplicitRequestURIFlow', `Step ${step + 1} completed`, result);
  }, []);

  const handleImplicitStart = async () => {
    try {;
      setDemoStatus('loading');
      setError(null);
      
      const mockRequestUri = `urn:ietf:params:oauth:request_uri:${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      
      setRequestUri(mockRequestUri);
      setResponse({
        success: true,
        message: 'Implicit Request URI flow initiated',
        requestUri: mockRequestUri
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
      <FlowTitle>Implicit Flow with Request URI</FlowTitle>
      <FlowDescription>
        This flow demonstrates the Implicit flow using a request URI from a Pushed 
        Authorization Request (PAR). The client first pushes authorization parameters 
        to the server, then uses the returned request URI in the Implicit authorization flow.
      </FlowDescription>

      <WarningContainer>
        <h4>⚠️ Implicit Flow Security Considerations</h4>
        <p>
          The Implicit flow is less secure than the Authorization Code flow because tokens 
          are returned directly in the URL fragment. However, using PAR with the Implicit 
          flow can enhance security by reducing parameter tampering risks.
        </p>
      </WarningContainer>

      <FlowCredentials
        flowType="implicit-request-uri"
        onCredentialsChange={(newCredentials) => {
          setFormData(prev => ({
            ...prev,
            clientId: newCredentials.clientId || prev.clientId,
            clientSecret: newCredentials.clientSecret || prev.clientSecret,
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
          setRequestUri('');
        }}
        status={demoStatus}
        disabled={demoStatus === 'loading'}
        title="Implicit Request URI Flow Steps"
      />

      {requestUri && (
        <RequestURIContainer>
          <RequestURITitle>Request URI Details</RequestURITitle>
          
          <RequestURIDetails>
            <RequestURIDetail>
              <RequestURILabel>Request URI</RequestURILabel>
              <RequestURIValue>{requestUri}</RequestURIValue>
            </RequestURIDetail>
            <RequestURIDetail>
              <RequestURILabel>Response Type</RequestURILabel>
              <RequestURIValue>token id_token</RequestURIValue>
            </RequestURIDetail>
            <RequestURIDetail>
              <RequestURILabel>Client ID</RequestURILabel>
              <RequestURIValue>{formData.clientId}</RequestURIValue>
            </RequestURIDetail>
            <RequestURIDetail>
              <RequestURILabel>Scope</RequestURILabel>
              <RequestURIValue>{formData.scope}</RequestURIValue>
            </RequestURIDetail>
          </RequestURIDetails>
          
          <Button $variant="primary" onClick={handleImplicitStart}>
            Start Implicit Request URI Flow
          </Button>
        </RequestURIContainer>
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
        <h3>Manual Implicit Request URI Configuration</h3>
        <p>You can also manually configure the Implicit Request URI flow:</p>
        
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
        </div>
        
        <FormGroup>
          <Label>Claims (JSON)</Label>
          <TextArea
            value={formData.claims}
            onChange={(e) => setFormData(prev => ({ ...prev, claims: e.target.value }))}
            placeholder='{"userinfo": {"email": null, "phone_number": null}}'
          />
        </FormGroup>
      </FormContainer>
    </FlowContainer>
  );
};

export default ImplicitRequestURIFlow;
