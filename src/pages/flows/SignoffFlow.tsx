import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { StepByStepFlow } from '../../components/StepByStepFlow';
import FlowCredentials from '../../components/FlowCredentials';
import { storeOAuthTokens } from '../../utils/tokenStorage';
import { logger } from '../utils/logger';
import JSONHighlighter from '../../components/JSONHighlighter';

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

const WarningContainer = styled.div`
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: #92400e;
`;

const SignoffContainer = styled.div`
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
`;

const SignoffTitle = styled.h4`
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.125rem;
  font-weight: 600;
`;

const SignoffDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const SignoffDetail = styled.div`
  display: flex;
  flex-direction: column;
`;

const SignoffLabel = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
`;

const SignoffValue = styled.span`
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
  border-bottom: 2px solid ${({ $active }) => $active ? '#3b82f6' : 'transparent'};
  color: ${({ $active }) => $active ? '#3b82f6' : '#6b7280'};
  
  &:hover {
    color: #3b82f6;
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
  const [response, setResponse] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateState = useCallback(() => {
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
  idpLogoutUri: '${formData.idpLogoutUri}'
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
  ui_locales: '${formData.uiLocales}'
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
  idp_logout_uri: '${formData.idpLogoutUri}'
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
            state: formData.state
          };

          setResponse(mockResponse);
          setDemoStatus('success');
        } catch (error) {
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
const error = urlParams.get('error');
const errorDescription = urlParams.get('error_description');

// Validate state parameter
const storedState = localStorage.getItem('oauth_state');
if (state !== storedState) {
  throw new Error('Invalid state parameter');
}

if (error) {
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
  // Clear OAuth tokens
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
  
  // Clear any other session data
  const sessionKeys = Object.keys(localStorage).filter(key => 
    key.startsWith('pingone_') || key.startsWith('oauth_')
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
            ]
          };

          setResponse(prev => ({ ...prev, cleanup: mockResponse }));
        } catch (error) {
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
            state: formData.state
          };

          setResponse(prev => ({ ...prev, redirect: mockResponse }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setError(errorMessage);
          throw error;
        }
      }
    }
  ];

  const handleStepChange = useCallback((step: number) => {
    setCurrentStep(step);
    setDemoStatus('idle');
    setResponse(null);
    setError(null);
  }, []);

  const handleStepResult = useCallback((step: number, result: unknown) => {
    logger.info('SignoffFlow', `Step ${step + 1} completed`, result);
  }, []);

  const handleSignoffStart = async () => {
    try {
      setDemoStatus('loading');
      setError(null);
      
      const signoffUrl = `https://auth.pingone.com/${formData.environmentId}/as/signoff`;
      
      const mockResponse = {
        success: true,
        message: `${activeTab === 'signoff' ? 'Standard' : 'IdP'} signoff initiated successfully`,
        signoffUrl: signoffUrl,
        method: 'GET',
        state: formData.state
      };

      setResponse(mockResponse);
      setDemoStatus('success');
    } catch (error) {
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
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
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
