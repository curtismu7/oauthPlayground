/* eslint-disable */
import React, { useState} from 'react';
import styled from 'styled-components';
import { StepByStepFlow } from '../../components/StepByStepFlow';
import FlowCredentials from '../../components/FlowCredentials';
import { storeOAuthTokens } from '../../utils/tokenStorage';
import { logger } from '../utils/logger';
import JSONHighlighter from '../../components/JSONHighlighter';

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

const SignoffContainer = styled.div`;
  background: #f8 fafc;
  border: 2 px solid #e2 e8 f0;
  border-radius: 0.5 rem;
  padding: 1.5 rem;
  margin: 1 rem 0;
`;

const SignoffTitle = styled.h4`;
  margin: 0 0 1 rem 0;
  color: #1 f2937;
  font-size: 1.125 rem;
  font-weight: 600;
`;

const SignoffDetails = styled.div`;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200 px, 1 fr));
  gap: 1 rem;
  margin-bottom: 1 rem;
`;

const SignoffDetail = styled.div`;
  display: flex;
  flex-direction: column;
`;

const SignoffLabel = styled.span`;
  font-size: 0.75 rem;
  color: #6 b7280;
  font-weight: 500;
  text-transform: uppercase;
  margin-bottom: 0.25 rem;
`;

const SignoffValue = styled.span`;
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

interface SignoffFlowProps {
  credentials?: {
    clientId: string;
    clientSecret: string;
    environmentId: string;
  };
}

const SignoffFlow: React.FC<SignoffFlowProps> = ({ credentials }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'signoff' | 'idp-signoff'>('signoff');
  const [formData, setFormData] = useState({
    clientId: credentials?.clientId || '',
    clientSecret: credentials?.clientSecret || '',
    environmentId: credentials?.environmentId || '',
    idToken: '',
    postLogoutRedirectUri: 'http://localhost:3000/logout',
    state: '',
    uiLocales: 'en',
    idpId: '',
    idpLogoutUri: ''
  });

  const generateState = useCallback(() => {;
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setFormData(prev => ({ ...prev, state }));
    return state;
  }, []);

  const steps = [
    {
      id: 'step-1',
      title: 'Configure Signoff Settings',
      description: 'Set up your OAuth client for signoff flow.',
      code: `// Signoff Configuration
const signoffConfig = {
  clientId: '${formData.clientId}',
  clientSecret: '${formData.clientSecret}',
  environmentId: '${formData.environmentId}',
  idToken: '${formData.idToken}',
  postLogoutRedirectUri: '${formData.postLogoutRedirectUri}',
  state: '${formData.state}',
  uiLocales: '${formData.uiLocales}',
  idpId: '${formData.idpId}',
  idpLogoutUri: '${formData.idpLogoutUri}';
};

console.log('Signoff configured:', signoffConfig);`,
      execute: async () => {
        logger.info('SignoffFlow', 'Configuring signoff settings');
        generateState();
      }
    },
    {
      id: 'step-2',
      title: activeTab === 'signoff' ? 'Initiate Signoff' : 'Initiate IdP Signoff',
      description: activeTab === 'signoff' 
        ? 'Initiate the standard signoff flow to end the user session.'
        : 'Initiate the Identity Provider signoff flow to end the IdP session.',
      code: activeTab === 'signoff' 
        ? `// Standard Signoff
const signoffUrl = \`https://auth.pingone.com/\${environmentId}/as/signoff\`;

const signoffParams = new URLSearchParams({
  client_id: '${formData.clientId}',
  id_token_hint: '${formData.idToken}',
  post_logout_redirect_uri: '${formData.postLogoutRedirectUri}',
  state: '${formData.state}',
  ui_locales: '${formData.uiLocales}';
});

const fullSignoffUrl = \`\${signoffUrl}?\${signoffParams.toString()}\`;
console.log('Signoff URL:', fullSignoffUrl);

// Redirect to signoff URL
window.location.href = fullSignoffUrl;`
        : `// IdP Signoff
const idpSignoffUrl = \`https://auth.pingone.com/\${environmentId}/as/signoff\`;

const idpSignoffParams = new URLSearchParams({
  client_id: '${formData.clientId}',
  id_token_hint: '${formData.idToken}',
  post_logout_redirect_uri: '${formData.postLogoutRedirectUri}',
  state: '${formData.state}',
  ui_locales: '${formData.uiLocales}',
  idp_id: '${formData.idpId}',
  idp_logout_uri: '${formData.idpLogoutUri}';
});

const fullIdpSignoffUrl = \`\${idpSignoffUrl}?\${idpSignoffParams.toString()}\`;
console.log('IdP Signoff URL:', fullIdpSignoffUrl);

// Redirect to IdP signoff URL
window.location.href = fullIdpSignoffUrl;`,
      execute: async () => {
        logger.info('SignoffFlow', `Initiating ${activeTab} flow`);
        setDemoStatus('loading');
        
        try {
          const signoffUrl = `https://auth.pingone.com/${formData.environmentId}/as/signoff`;
          
          const mockResponse = {
            success: true,
            message: `${activeTab === 'signoff' ? 'Standard' : 'IdP'} signoff initiated successfully`,
            signoffUrl: signoffUrl,
            method: 'GET',
            state: formData.state;
          };

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
      title: 'Handle Signoff Response',
      description: 'Process the response from the signoff endpoint.',
      code: `// Handle Signoff Response
const urlParams = new URLSearchParams(window.location.search);
const state = urlParams.get('state');

const errorDescription = urlParams.get('error_description');

// Validate state parameter
const storedState = localStorage.getItem('oauth_state');
if (state !== storedState) {
  throw new Error('Invalid state parameter');
}

if (_error) {
  console.error('Signoff error:', error, errorDescription);
  throw new Error(\`Signoff failed: \${error}\`);
}

console.log('Signoff successful, state:', state);
console.log('State validated:', state === storedState);

// Clear local session data
localStorage.removeItem('oauth_tokens');
localStorage.removeItem('oauth_state');
localStorage.removeItem('user_info');
localStorage.removeItem('user_data');`,
      execute: async () => {
        logger.info('SignoffFlow', 'Handling signoff response');
      }
    },
    {
      id: 'step-4',
      title: 'Clean Up Session Data',
      description: 'Clear all local session data and tokens.',
      code: `// Clean Up Session Data
const cleanupSession = () => {
  // Clear OAuth tokens;
  localStorage.removeItem('oauth_tokens');
  localStorage.removeItem('oauth_state');
  localStorage.removeItem('oauth_nonce');
  localStorage.removeItem('pkce_code_verifier');
  
  // Clear user data
  localStorage.removeItem('user_info');
  localStorage.removeItem('user_data');
  localStorage.removeItem('user_preferences');
  
  // Clear device flow data
  localStorage.removeItem('device_flow_state');
  localStorage.removeItem('resume_token');
  
  // Clear any other session data (but preserve permanent credentials)
  const sessionKeys = Object.keys(localStorage).filter(key => 
    (key.startsWith('pingone_') && key !== 'pingone_permanent_credentials') || 
    key.startsWith('oauth_');
  );
  sessionKeys.forEach(key => localStorage.removeItem(key));
  
  console.log('Session cleanup completed');
  console.log('Cleared keys:', sessionKeys);
};

// Execute cleanup
cleanupSession();`,
      execute: async () => {
        logger.info('SignoffFlow', 'Cleaning up session data');
        
        try {
          // Simulate session cleanup
          const mockResponse = {
            success: true,
            message: 'Session cleanup completed',
            clearedKeys: [
              'oauth_tokens',
              'oauth_state',
              'oauth_nonce',
              'pkce_code_verifier',
              'user_info',
              'user_data',
              'device_flow_state',
              'resume_token'
            ];
          };

          setResponse(prev => ({ ...prev, cleanup: mockResponse }));
        } catch (_error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setError(errorMessage);
          throw error;
        }
      }
    },
    {
      id: 'step-5',
      title: 'Redirect to Post-Logout URI',
      description: 'Redirect the user to the post-logout redirect URI.',
      code: `// Redirect to Post-Logout URI
const postLogoutRedirectUri = '${formData.postLogoutRedirectUri}';
const state = '${formData.state}';

// Build redirect URL with state parameter
const redirectUrl = new URL(postLogoutRedirectUri);
if (state) {
  redirectUrl.searchParams.set('state', state);
}

console.log('Redirecting to:', redirectUrl.toString());

// Perform redirect
window.location.href = redirectUrl.toString();

// Alternative: Use replace to prevent back button issues
// window.location.replace(redirectUrl.toString());`,
      execute: async () => {
        logger.info('SignoffFlow', 'Redirecting to post-logout URI');
        
        try {
          const mockResponse = {
            success: true,
            message: 'Redirecting to post-logout URI',
            redirectUri: formData.postLogoutRedirectUri,
            state: formData.state;
          };

          setResponse(prev => ({ ...prev, redirect: mockResponse }));
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
    logger.info('SignoffFlow', `Step ${step + 1} completed`, result);
  }, []);

  const handleSignoffStart = async () => {
    try {;
      setDemoStatus('loading');
      setError(null);
      
      const signoffUrl = `https://auth.pingone.com/${formData.environmentId}/as/signoff`;
      
      const mockResponse = {
        success: true,
        message: `${activeTab === 'signoff' ? 'Standard' : 'IdP'} signoff initiated successfully`,
        signoffUrl: signoffUrl,
        method: 'GET',
        state: formData.state;
      };

      setResponse(mockResponse);
      setDemoStatus('success');
    } catch (_error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      setDemoStatus('error');
    }
  };

  return (
    <FlowContainer>
      <FlowTitle>Signoff Flow</FlowTitle>
      <FlowDescription>
        The Signoff flow allows users to securely end their OAuth session and log out 
        from both the application and the identity provider. It supports both standard 
        signoff and Identity Provider (IdP) signoff flows.
      </FlowDescription>

      <WarningContainer>
        <h4>⚠️ Signoff Security</h4>
        <p>
          The Signoff flow ensures secure session termination by clearing all local 
          session data and redirecting users to a post-logout URI. This prevents 
          unauthorized access to user data after logout.
        </p>
      </WarningContainer>

      <FlowCredentials
        flowType="signoff"
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
        <Tab $active={activeTab === 'signoff'} onClick={() => setActiveTab('signoff')}>
          Standard Signoff
        </Tab>
        <Tab $active={activeTab === 'idp-signoff'} onClick={() => setActiveTab('idp-signoff')}>
          IdP Signoff
        </Tab>
      </TabContainer>

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
        title={`Signoff Flow Steps (${activeTab === 'signoff' ? 'Standard' : 'IdP'})`}
      />

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

      <SignoffContainer>
        <SignoffTitle>Signoff Details</SignoffTitle>
        
        <SignoffDetails>
          <SignoffDetail>
            <SignoffLabel>Type</SignoffLabel>
            <SignoffValue>{activeTab === 'signoff' ? 'Standard Signoff' : 'IdP Signoff'}</SignoffValue>
          </SignoffDetail>
          <SignoffDetail>
            <SignoffLabel>State</SignoffLabel>
            <SignoffValue>{formData.state || 'Not generated yet'}</SignoffValue>
          </SignoffDetail>
          <SignoffDetail>
            <SignoffLabel>Post-Logout URI</SignoffLabel>
            <SignoffValue>{formData.postLogoutRedirectUri}</SignoffValue>
          </SignoffDetail>
          <SignoffDetail>
            <SignoffLabel>IdP ID</SignoffLabel>
            <SignoffValue>{formData.idpId || 'Not specified'}</SignoffValue>
          </SignoffDetail>
        </SignoffDetails>
        
        <Button $variant="danger" onClick={handleSignoffStart}>
          Start Signoff Flow
        </Button>
      </SignoffContainer>

      <FormContainer>
        <h3>Manual Signoff Configuration</h3>
        <p>You can also manually configure the signoff flow:</p>
        
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
            <Label>ID Token</Label>
            <Input
              type="text"
              value={formData.idToken}
              onChange={(e) => setFormData(prev => ({ ...prev, idToken: e.target.value }))}
              placeholder="Enter ID token"
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Post-Logout Redirect URI</Label>
            <Input
              type="url"
              value={formData.postLogoutRedirectUri}
              onChange={(e) => setFormData(prev => ({ ...prev, postLogoutRedirectUri: e.target.value }))}
            />
          </FormGroup>
          
          {activeTab === 'idp-signoff' && (
            <>
              <FormGroup>
                <Label>IdP ID</Label>
                <Input
                  type="text"
                  value={formData.idpId}
                  onChange={(e) => setFormData(prev => ({ ...prev, idpId: e.target.value }))}
                  placeholder="Enter IdP ID"
                />
              </FormGroup>
              
              <FormGroup>
                <Label>IdP Logout URI</Label>
                <Input
                  type="url"
                  value={formData.idpLogoutUri}
                  onChange={(e) => setFormData(prev => ({ ...prev, idpLogoutUri: e.target.value }))}
                  placeholder="Enter IdP logout URI"
                />
              </FormGroup>
            </>
          )}
        </div>
      </FormContainer>
    </FlowContainer>
  );
};

export default SignoffFlow;
