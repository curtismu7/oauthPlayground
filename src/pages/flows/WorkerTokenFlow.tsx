import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { FiPlay, FiEye, FiCheckCircle, FiAlertCircle, FiCode, FiServer, FiKey, FiShield } from 'react-icons/fi';
import { useAuth } from '../../contexts/NewAuthContext';
import Spinner from '../../components/Spinner';
import { StepByStepFlow, FlowStep } from '../../components/StepByStepFlow';
import ConfigurationButton from '../../components/ConfigurationButton';
import TokenDisplayComponent from '../../components/TokenDisplay';
import { storeOAuthTokens } from '../../utils/tokenStorage';
import ColorCodedURL from '../../components/ColorCodedURL';
import PageTitle from '../../components/PageTitle';
import FlowCredentials from '../../components/FlowCredentials';
import { EffectiveConfig } from '../../utils/configStore';
import { exchangeClientCredentialsForTokens } from '../../utils/tokenExchange';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const FlowOverview = styled(Card)`
  margin-bottom: 2rem;
`;

const FlowDescription = styled.div`
  margin-bottom: 2rem;

  h2 {
    color: ${({ theme }) => theme.colors.gray900};
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  p {
    color: ${({ theme }) => theme.colors.gray600};
    line-height: 1.6;
    margin-bottom: 1rem;
  }
`;

const UseCaseHighlight = styled.div`
  background-color: ${({ theme }) => theme.colors.success}10;
  border: 1px solid ${({ theme }) => theme.colors.success}30;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  svg {
    color: ${({ theme }) => theme.colors.success};
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  h3 {
    color: ${({ theme }) => theme.colors.success};
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.success};
    font-size: 0.9rem;
  }
`;

const DemoSection = styled(Card)`
  margin-bottom: 2rem;
`;

const ErrorMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.danger}10;
  border: 1px solid ${({ theme }) => theme.colors.danger}30;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 0.9rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  svg {
    flex-shrink: 0;
    margin-top: 0.1rem;
  }
`;

const SuccessMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.success}10;
  border: 1px solid ${({ theme }) => theme.colors.success}30;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: ${({ theme }) => theme.colors.success};
  font-size: 0.9rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  svg {
    flex-shrink: 0;
    margin-top: 0.1rem;
  }
`;

interface Tokens {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

const WorkerTokenFlow = () => {
  const { config } = useAuth();
  const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [tokensReceived, setTokensReceived] = useState<Tokens | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [effectiveConfig, setEffectiveConfig] = useState<EffectiveConfig | null>(null);

  // Track execution results for each step
  const [stepResults, setStepResults] = useState<Record<number, any>>({});
  const [executedSteps, setExecutedSteps] = useState<Set<number>>(new Set());
  const [stepsWithResults, setStepsWithResults] = useState<FlowStep[]>([]);

  const startWorkerTokenFlow = async () => {
    setDemoStatus('loading');
    setCurrentStep(0);
    setError(null);
    setTokensReceived(null);
    setStepResults({});
    setExecutedSteps(new Set());
    setStepsWithResults([]);

    try {
      console.log('🚀 [WorkerTokenFlow] Starting Worker Token flow...');
      
      if (!effectiveConfig) {
        throw new Error('Effective configuration not available');
      }

      // Step 1: Prepare worker credentials
      const credentials = btoa(`${effectiveConfig.clientId}:${effectiveConfig.clientSecret}`);
      
      const step1Result = {
        message: 'Worker credentials prepared successfully',
        clientId: effectiveConfig.clientId,
        hasClientSecret: !!effectiveConfig.clientSecret,
        tokenAuthMethod: effectiveConfig.tokenAuthMethod,
        credentials: credentials ? `${credentials.substring(0, 20)}...` : 'missing'
      };
      
      setStepResults(prev => ({ ...prev, 1: step1Result }));
      setExecutedSteps(prev => new Set(prev).add(1));
      setCurrentStep(1);

      // Step 2: Exchange credentials for worker token
      console.log('🔄 [WorkerTokenFlow] Exchanging credentials for worker token...');
      
      const tokens = await exchangeClientCredentialsForTokens('worker_token', {
        scope: effectiveConfig.scopes || 'api:read'
      });

      const step2Result = {
        message: 'Worker token obtained successfully',
        tokens: {
          access_token: tokens.access_token,
          token_type: tokens.token_type,
          expires_in: tokens.expires_in,
          scope: tokens.scope
        },
        response: tokens
      };

      setTokensReceived(tokens);
      setStepResults(prev => ({ ...prev, 2: step2Result }));
      setExecutedSteps(prev => new Set(prev).add(2));
      setCurrentStep(2);
      setDemoStatus('success');

      // Store tokens
      const success = storeOAuthTokens(tokens, 'worker_token', 'Worker Token Flow');
      if (success) {
        console.log('✅ [WorkerTokenFlow] Worker token stored successfully');
      }

    } catch (error: any) {
      console.error('❌ [WorkerTokenFlow] Worker token flow failed:', error);
      setError(error.message || 'Failed to obtain worker token');
      setDemoStatus('error');
    }
  };

  const resetDemo = () => {
    setDemoStatus('idle');
    setCurrentStep(0);
    setTokensReceived(null);
    setError(null);
    setStepResults({});
    setExecutedSteps(new Set());
    setStepsWithResults([]);
  };

  const handleStepResult = (stepIndex: number, result: any) => {
    setStepResults(prev => ({ ...prev, [stepIndex]: result }));
    setStepsWithResults(prev => {
      const newSteps = [...prev];
      if (newSteps[stepIndex]) {
        newSteps[stepIndex] = { ...newSteps[stepIndex], result };
      }
      return newSteps;
    });
  };

  const steps: FlowStep[] = [
    {
      title: 'Prepare Worker Credentials',
      description: 'Prepare client credentials for worker token exchange',
      code: `// Worker credentials from PingOne application
const clientId = '${effectiveConfig?.clientId || 'your_client_id'}';
const clientSecret = '${effectiveConfig?.clientSecret ? '••••••••••••' : 'your_client_secret'}';
const tokenAuthMethod = '${effectiveConfig?.tokenAuthMethod || 'client_secret_post'}';

// For client_secret_post, credentials go in request body
// For client_secret_basic, credentials go in Authorization header
const credentials = btoa(\`\${clientId}:\${clientSecret}\`);`,
      execute: async () => {
        if (!effectiveConfig) {
          setError('Effective configuration not available');
          return { error: 'Configuration required' };
        }

        const credentials = btoa(`${effectiveConfig.clientId}:${effectiveConfig.clientSecret}`);
        
        const result = { 
          message: 'Worker credentials prepared successfully',
          clientId: effectiveConfig.clientId,
          hasClientSecret: !!effectiveConfig.clientSecret,
          tokenAuthMethod: effectiveConfig.tokenAuthMethod,
          credentials: credentials ? `${credentials.substring(0, 20)}...` : 'missing'
        };
        
        setStepResults(prev => ({ ...prev, 1: result }));
        setExecutedSteps(prev => new Set(prev).add(1));
        return result;
      }
    },
    {
      title: 'Exchange Credentials for Worker Token',
      description: 'Send client credentials to token endpoint to obtain worker token',
      code: `// POST to token endpoint with worker credentials
POST ${effectiveConfig?.tokenEndpoint || 'https://auth.pingone.com/your-env/as/token'}
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=${effectiveConfig?.clientId || 'your_client_id'}
&client_secret=${effectiveConfig?.clientSecret ? '••••••••••••' : 'your_client_secret'}
&scope=${effectiveConfig?.scopes || 'api:read'}

// Response:
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "api:read"
}`,
      execute: async () => {
        if (!effectiveConfig) {
          setError('Effective configuration not available');
          return { error: 'Configuration required' };
        }

        try {
          console.log('🔄 [WorkerTokenFlow] Exchanging credentials for worker token...');
          
          const tokens = await exchangeClientCredentialsForTokens('worker_token', {
            scope: effectiveConfig.scopes || 'api:read'
          });

          const result = {
            message: 'Worker token obtained successfully',
            tokens: {
              access_token: tokens.access_token,
              token_type: tokens.token_type,
              expires_in: tokens.expires_in,
              scope: tokens.scope
            },
            response: tokens
          };

          setTokensReceived(tokens);
          setStepResults(prev => ({ ...prev, 2: result }));
          setExecutedSteps(prev => new Set(prev).add(2));
          setDemoStatus('success');

          // Store tokens
          const success = storeOAuthTokens(tokens, 'worker_token', 'Worker Token Flow');
          if (success) {
            console.log('✅ [WorkerTokenFlow] Worker token stored successfully');
          }

          return result;
        } catch (error: any) {
          setError(`Failed to obtain worker token: ${error.message}`);
          console.error('❌ [WorkerTokenFlow] Token exchange error:', error);
          return { error: error.message };
        }
      }
    },
    {
      title: 'Use Worker Token for API Calls',
      description: 'Use the worker token to authenticate API requests',
      code: `// Use worker token in API requests
const apiResponse = await fetch('https://api.example.com/protected-resource', {
  method: 'GET',
  headers: {
    'Authorization': \`Bearer \${tokens.access_token}\`,
    'Content-Type': 'application/json'
  }
});

// Worker tokens are typically used for:
// - Background processing
// - Server-to-server communication
// - Automated API calls
// - System integrations`,
      execute: async () => {
        if (!tokensReceived) {
          setError('No worker token available. Please complete step 2 first.');
          return { error: 'No worker token available' };
        }

        try {
          // Simulate API call with worker token
          const apiResponse = {
            data: "Protected resource accessed with worker token",
            timestamp: new Date().toISOString(),
            scope: tokensReceived.scope || 'api:read',
            client_id: effectiveConfig?.clientId || 'worker_client',
            token_type: tokensReceived.token_type
          };

          const result = { 
            message: 'API call successful with worker token',
            apiResponse,
            tokenUsed: {
              type: tokensReceived.token_type,
              scope: tokensReceived.scope,
              expires_in: tokensReceived.expires_in
            }
          };
          
          setStepResults(prev => ({ ...prev, 3: result }));
          setExecutedSteps(prev => new Set(prev).add(3));
          
          console.log('✅ [WorkerTokenFlow] API call completed with worker token');
          return result;
        } catch (error: any) {
          setError(`Failed to make API call: ${error.message}`);
          console.error('❌ [WorkerTokenFlow] API call error:', error);
          return { error: error.message };
        }
      }
    }
  ];

  return (
    <Container>
      <PageTitle 
        title={
          <>
            <FiServer />
            Worker Token Flow
          </>
        }
        subtitle="Learn how the Worker Token flow works for machine-to-machine authentication with background processing and system integrations."
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', marginBottom: '3rem', padding: '1.5rem 0' }}>
        <ConfigurationButton flowType="worker_token" />
      </div>

      <FlowOverview>
        <CardHeader>
          <h2>Flow Overview</h2>
        </CardHeader>
        <CardBody>
          <FlowDescription>
            <h2>What is Worker Token Flow?</h2>
            <p>
              The Worker Token flow is a specialized variant of the Client Credentials flow designed
              for background processing, system integrations, and automated tasks. It provides
              long-lived access tokens for worker processes that need to operate without user interaction.
            </p>
            <p>
              <strong>How it works:</strong> The worker process authenticates using client credentials
              and receives a worker token that can be used for API calls. These tokens typically have
              longer lifetimes and specific scopes for background operations.
            </p>
          </FlowDescription>

          <UseCaseHighlight>
            <FiShield size={20} />
            <div>
              <h3>Perfect For</h3>
              <p>
                Background workers, system integrations, automated data processing,
                scheduled tasks, and any scenario requiring unattended API access.
              </p>
            </div>
          </UseCaseHighlight>
        </CardBody>
      </FlowOverview>

      {/* Security Warning */}
      <div style={{
        background: '#fef3cd',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        padding: '1rem',
        margin: '1rem 0',
        borderLeft: '4px solid #f59e0b'
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>🔒 Security Notice</h4>
        <p style={{ margin: '0', color: '#92400e', fontSize: '0.9rem' }}>
          <strong>Worker tokens are configured with a 5-minute lifetime for security.</strong> 
          This ensures that if a token is compromised, it will expire quickly. 
          Applications should implement proper token refresh mechanisms for long-running operations.
        </p>
      </div>

      {/* Flow Credentials Configuration */}
      <FlowCredentials 
        flowType="worker_token"
        onConfigChange={setEffectiveConfig}
      />

      <DemoSection>
        <CardHeader>
          <h2>Interactive Demo</h2>
        </CardHeader>
        <CardBody>
          <StepByStepFlow
            steps={stepsWithResults.length > 0 ? stepsWithResults : steps}
            onStart={startWorkerTokenFlow}
            onReset={resetDemo}
            status={demoStatus}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            onStepResult={handleStepResult}
            disabled={!effectiveConfig}
            title="Worker Token Flow"
          />

          {!effectiveConfig && (
            <ErrorMessage>
              <FiAlertCircle />
              <strong>Configuration Required:</strong> Please configure your PingOne settings
              in the Flow Credentials section above before running this demo.
            </ErrorMessage>
          )}

          {error && (
            <ErrorMessage>
              <FiAlertCircle />
              <strong>Error:</strong> {error}
            </ErrorMessage>
          )}

          {tokensReceived && (
            <SuccessMessage>
              <FiCheckCircle />
              <strong>Worker Token Obtained:</strong> Successfully received worker token for API access.
            </SuccessMessage>
          )}

          {tokensReceived && (
            <div style={{ marginTop: '2rem' }}>
              <h3>Worker Token Details</h3>
              <TokenDisplayComponent 
                tokens={tokensReceived} 
                showRaw={true}
                title="Worker Token Response"
              />
            </div>
          )}
        </CardBody>
      </DemoSection>
    </Container>
  );
};

export default WorkerTokenFlow;
