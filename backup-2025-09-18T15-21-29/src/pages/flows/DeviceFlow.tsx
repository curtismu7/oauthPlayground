/* eslint-disable */
import React, { useState} from 'react';
import styled from 'styled-components';
import { StepByStepFlow } from '../../components/StepByStepFlow';
import FlowCredentials from '../../components/FlowCredentials';
import DeviceFlowDisplay from '../../components/DeviceFlowDisplay';
import { deviceFlowService, DeviceFlowState, DeviceAuthorizationRequest } from '../../services/deviceFlowService';
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

interface DeviceFlowProps {
  credentials?: {
    clientId: string;
    clientSecret: string;
    environmentId: string;
  };
}

const DeviceFlow: React.FC<DeviceFlowProps> = ({ credentials }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    clientId: credentials?.clientId || '',
    clientSecret: credentials?.clientSecret || '',
    environmentId: credentials?.environmentId || '',
    scope: 'openid profile email',
    audience: '',
    acrValues: '',
    prompt: '',
    maxAge: '',
    uiLocales: '',
    claims: '',
    appIdentifier: ''
  });
  const [deviceState, setDeviceState] = useState<DeviceFlowState | null>(null);

  // Load existing device flow state on mount
  useEffect(() => {
    const existingState = deviceFlowService.getDeviceFlowState();
    if (existingState) {
      setDeviceState(existingState);
      logger.info('DeviceFlow', 'Loaded existing device flow state', existingState);
    }
  }, []);

  const steps = [
    {
      id: 'step-1',
      title: 'Configure Device Flow Settings',
      description: 'Set up your OAuth client for device authorization flow.',
      code: `// Device Flow Configuration
const deviceConfig = {
  clientId: '${formData.clientId}',
  clientSecret: '${formData.clientSecret}',
  environmentId: '${formData.environmentId}',
  scope: '${formData.scope}',
  audience: '${formData.audience || 'default'}',
  acrValues: '${formData.acrValues || 'default'}',
  prompt: '${formData.prompt || 'consent'}',
  maxAge: ${formData.maxAge || 3600},
  uiLocales: '${formData.uiLocales || 'en'}',
  claims: '${formData.claims || '{}'}',
  appIdentifier: '${formData.appIdentifier || ''}';
};

console.log('Device flow configured:', deviceConfig);`,
      execute: async () => {
        logger.info('DeviceFlow', 'Configuring device flow settings');
      }
    },
    {
      id: 'step-2',
      title: 'Start Device Authorization',
      description: 'Initiate the device authorization flow by requesting device and user codes.',
      code: `// Start Device Authorization
const deviceRequest = {
  client_id: '${formData.clientId}',
  scope: '${formData.scope}',
  audience: '${formData.audience || undefined}',
  acr_values: '${formData.acrValues || undefined}',
  prompt: '${formData.prompt || undefined}',
  max_age: ${formData.maxAge ? parseInt(formData.maxAge) : undefined},
  ui_locales: '${formData.uiLocales || undefined}',
  claims: '${formData.claims || undefined}',
  app_identifier: '${formData.appIdentifier || undefined}';
};

const deviceResponse = await deviceFlowService.startDeviceFlow(
  '${formData.environmentId}',
  deviceRequest;
);

console.log('Device authorization started:', deviceResponse);
console.log('User Code:', deviceResponse.user_code);
console.log('Verification URI:', deviceResponse.verification_uri);`,
      execute: async () => {
        logger.info('DeviceFlow', 'Starting device authorization');
        setDemoStatus('loading');
        
        try {
          const deviceRequest: DeviceAuthorizationRequest = {
            client_id: formData.clientId,
            scope: formData.scope,
            audience: formData.audience || undefined,
            acr_values: formData.acrValues || undefined,
            prompt: formData.prompt || undefined,
            max_age: formData.maxAge ? parseInt(formData.maxAge) : undefined,
            ui_locales: formData.uiLocales || undefined,
            claims: formData.claims || undefined,
            app_identifier: formData.appIdentifier || undefined
          };

          const deviceResponse = await deviceFlowService.startDeviceFlow(
            formData.environmentId,
            deviceRequest;
          );

          // Update device state
          const newState = deviceFlowService.getDeviceFlowState();
          setDeviceState(newState);
          setResponse(deviceResponse);
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
      title: 'Display User Code and Verification URI',
      description: 'Show the user code and verification URI to the user for authorization.',
      code: `// Display device authorization information
console.log('User Code:', deviceResponse.user_code);
console.log('Verification URI:', deviceResponse.verification_uri);
console.log('Complete URI:', deviceResponse.verification_uri_complete);
console.log('Expires in:', deviceResponse.expires_in, 'seconds');
console.log('Poll interval:', deviceResponse.interval, 'seconds');

// Format user code for display
const formattedUserCode = deviceResponse.user_code.replace(/(.{4})/g, '$1-').slice(0, -1);
console.log('Formatted User Code:', formattedUserCode);`,
      execute: async () => {
        logger.info('DeviceFlow', 'Displaying user code and verification URI');
      }
    },
    {
      id: 'step-4',
      title: 'Poll for Authorization',
      description: 'Continuously poll the token endpoint to check if the user has authorized the device.',
      code: `// Poll for device authorization
const pollForTokens = async () => {
  try {
    const tokenResponse = await deviceFlowService.pollForTokens(
      '${formData.environmentId}',
      deviceResponse.device_code,
      '${formData.clientId}',
      '${formData.clientSecret}';
    );
    
    if (tokenResponse.access_token) {
      console.log('Authorization successful!');
      console.log('Access Token:', tokenResponse.access_token);
      console.log('ID Token:', tokenResponse.id_token);
      return tokenResponse;
    } else if (tokenResponse.error === 'authorization_pending') {
      console.log('Still waiting for authorization...');
      // Continue polling
      setTimeout(pollForTokens, deviceResponse.interval * 1000);
    } else {
      console.error('Authorization failed:', tokenResponse.error);
    }
  } catch (_error) {
    console.error('Polling error:', _error);
  }
};

// Start polling
pollForTokens();`,
      execute: async () => {
        logger.info('DeviceFlow', 'Starting polling for authorization');
      }
    },
    {
      id: 'step-5',
      title: 'Handle Token Response',
      description: 'Process the received tokens and store them for future use.',
      code: `// Handle successful token response
if (tokenResponse.access_token) {

  // Store tokens using standardized method
  localStorage.setItem('oauth_tokens', JSON.stringify(tokens));
  
  console.log('Tokens stored successfully:', tokens);
  
  // Update device flow state
  deviceFlowService.updateDeviceFlowState({
    status: 'authorized',
    tokens: tokens
  });
}`,
      execute: async () => {
        logger.info('DeviceFlow', 'Handling token response');
        
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
          const success = storeOAuthTokens(mockTokens, 'device', 'Device Flow');
          
          if (success) {
            setResponse({ tokens: mockTokens, message: 'Tokens stored successfully' });
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
    logger.info('DeviceFlow', `Step ${step + 1} completed`, result);
  }, []);

  const handleDeviceStateUpdate = useCallback((newState: DeviceFlowState) => {;
    setDeviceState(newState);
    logger.info('DeviceFlow', 'Device state updated', newState);
  }, []);

  const handleDeviceComplete = useCallback((tokens: Record<string, unknown>) => {;
    logger.success('DeviceFlow', 'Device authorization completed', tokens);
    setResponse({ tokens, message: 'Device authorization completed successfully' });
  }, []);

  const handleDeviceError = useCallback((error: Error) => {;
    logger.error('DeviceFlow', 'Device authorization error', error);
    setError(error.message);
  }, []);

  const handleStartDeviceFlow = async () => {
    try {;
      setDemoStatus('loading');
      setError(null);
      
      const deviceRequest: DeviceAuthorizationRequest = {
        client_id: formData.clientId,
        scope: formData.scope,
        audience: formData.audience || undefined,
        acr_values: formData.acrValues || undefined,
        prompt: formData.prompt || undefined,
        max_age: formData.maxAge ? parseInt(formData.maxAge) : undefined,
        ui_locales: formData.uiLocales || undefined,
        claims: formData.claims || undefined,
        app_identifier: formData.appIdentifier || undefined
      };

      const deviceResponse = await deviceFlowService.startDeviceFlow(
        formData.environmentId,
        deviceRequest;
      );

      const newState = deviceFlowService.getDeviceFlowState();
      setDeviceState(newState);
      setResponse(deviceResponse);
      setDemoStatus('success');
    } catch (_error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      setDemoStatus('error');
    }
  };

  return (
    <FlowContainer>
      <FlowTitle>Device Authorization Grant Flow</FlowTitle>
      <FlowDescription>
        The Device Authorization Grant flow is designed for devices that either lack a browser 
        or are input-constrained. It allows users to authorize the application on a separate device 
        by entering a user code or scanning a QR code.
      </FlowDescription>

      <InfoContainer>
        <h4>ℹ️ Device Flow Benefits</h4>
        <p>
          The Device Flow is perfect for smart TVs, IoT devices, command-line tools, and other 
          applications where traditional OAuth flows are not feasible. Users can authorize the 
          application using their smartphone or computer.
        </p>
      </InfoContainer>

      <FlowCredentials
        flowType="device"
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
        }}
        status={demoStatus}
        disabled={demoStatus === 'loading'}
        title="Device Flow Steps"
      />

      {deviceState && (
        <DeviceFlowDisplay
          state={deviceState}
          onStateUpdate={handleDeviceStateUpdate}
          onComplete={handleDeviceComplete}
          onError={handleDeviceError}
        />
      )}

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

      <FormContainer>
        <h3>Manual Device Flow Configuration</h3>
        <p>You can also manually configure and start the device flow:</p>
        
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
            <Label>Scope</Label>
            <Input
              type="text"
              value={formData.scope}
              onChange={(e) => setFormData(prev => ({ ...prev, scope: e.target.value }))}
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Audience</Label>
            <Input
              type="text"
              value={formData.audience}
              onChange={(e) => setFormData(prev => ({ ...prev, audience: e.target.value }))}
            />
          </FormGroup>
          
          <FormGroup>
            <Label>ACR Values</Label>
            <Input
              type="text"
              value={formData.acrValues}
              onChange={(e) => setFormData(prev => ({ ...prev, acrValues: e.target.value }))}
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Prompt</Label>
            <Select
              value={formData.prompt}
              onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
            >
              <option value="">None</option>
              <option value="none">none</option>
              <option value="login">login</option>
              <option value="consent">consent</option>
              <option value="select_account">select_account</option>
            </Select>
          </FormGroup>
          
          <FormGroup>
            <Label>Max Age (seconds)</Label>
            <Input
              type="number"
              value={formData.maxAge}
              onChange={(e) => setFormData(prev => ({ ...prev, maxAge: e.target.value }))}
            />
          </FormGroup>
          
          <FormGroup>
            <Label>UI Locales</Label>
            <Input
              type="text"
              value={formData.uiLocales}
              onChange={(e) => setFormData(prev => ({ ...prev, uiLocales: e.target.value }))}
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Claims (JSON)</Label>
            <TextArea
              value={formData.claims}
              onChange={(e) => setFormData(prev => ({ ...prev, claims: e.target.value }))}
              placeholder='{"userinfo": {"email": null}}'
            />
          </FormGroup>
          
          <FormGroup>
            <Label>App Identifier</Label>
            <Input
              type="text"
              value={formData.appIdentifier}
              onChange={(e) => setFormData(prev => ({ ...prev, appIdentifier: e.target.value }))}
            />
          </FormGroup>
        </div>
        
        <Button $variant="primary" onClick={handleStartDeviceFlow}>
          Start Device Flow
        </Button>
      </FormContainer>
    </FlowContainer>
  );
};

export default DeviceFlow;
