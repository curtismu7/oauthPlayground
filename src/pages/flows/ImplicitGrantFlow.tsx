import { useState } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { FiAlertCircle, FiLock } from 'react-icons/fi';
import { useAuth } from '../../contexts/NewAuthContext';
import { ColorCodedURL } from '../../components/ColorCodedURL';
import { URLParamExplainer } from '../../components/URLParamExplainer';
import { StepByStepFlow, FlowStep } from '../../components/StepByStepFlow';
import ConfigurationButton from '../../components/ConfigurationButton';
import { storeOAuthTokens } from '../../utils/tokenStorage';
import TokenDisplayComponent from '../../components/TokenDisplay';
import PageTitle from '../../components/PageTitle';
import FlowCredentials from '../../components/FlowCredentials';
import { logger } from '../../utils/logger';
import AuthorizationRequestModal from '../../components/AuthorizationRequestModal';

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

const SecurityWarning = styled.div`
  background-color: ${({ theme }) => theme.colors.warning}10;
  border: 1px solid ${({ theme }) => theme.colors.warning}30;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  svg {
    color: ${({ theme }) => theme.colors.warning};
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  h3 {
    color: ${({ theme }) => theme.colors.warning};
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.warning};
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
`;

const ImplicitGrantFlow = () => {
  const { config } = useAuth();
  const [demoStatus, setDemoStatus] = useState('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [authUrl, setAuthUrl] = useState('');
  const [tokensReceived, setTokensReceived] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stepResults, setStepResults] = useState<Record<number, any>>({});
  const [executedSteps, setExecutedSteps] = useState<Set<number>>(new Set());
  const [stepsWithResults, setStepsWithResults] = useState<FlowStep[]>([]);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('');
  const [redirectParams, setRedirectParams] = useState<Record<string, string>>({});

  // Generate authorization URL
  const generateAuthUrl = () => {
    if (!config) {
      logger.warn('ImplicitGrantFlow', 'No config available for generating auth URL');
      return '';
    }

    logger.flow('ImplicitGrantFlow', 'Generating authorization URL', { config: !!config });

    const params = new URLSearchParams({
      response_type: 'token',
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: 'read write',
      state: Math.random().toString(36).substring(2, 15),
      nonce: Math.random().toString(36).substring(2, 15)
    });

    // Construct authorization endpoint if not available
    const authEndpoint = config.authorizationEndpoint || config.authEndpoint || 
      `https://auth.pingone.com/${config.environmentId}/as/authorize`;

    logger.config('ImplicitGrantFlow', 'Using authorization endpoint', { authEndpoint });

    const url = `${authEndpoint}?${params.toString()}`;
    logger.success('ImplicitGrantFlow', 'Authorization URL generated', { url });
    
    return url;
  };

  const startImplicitFlow = async () => {
    logger.flow('ImplicitGrantFlow', 'Starting implicit flow');
    setDemoStatus('loading');
    setCurrentStep(0);
    setError(null);
    setTokensReceived(null);
    setAuthUrl('');
    setStepResults({});
    setExecutedSteps(new Set());
    setStepsWithResults([...steps]); // Initialize with copy of steps
    logger.success('ImplicitGrantFlow', 'Implicit flow started successfully');
  };

  const resetDemo = () => {
    logger.flow('ImplicitGrantFlow', 'Resetting demo');
    setDemoStatus('idle');
    setCurrentStep(0);
    setTokensReceived(null);
    setError(null);
    setAuthUrl('');
    setStepResults({});
    setExecutedSteps(new Set());
    setStepsWithResults([]);
    logger.success('ImplicitGrantFlow', 'Demo reset completed');
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

  const handleRedirectModalClose = () => {
    setShowRedirectModal(false);
    setRedirectUrl('');
    setRedirectParams({});
  };

  const handleRedirectModalProceed = () => {
    logger.flow('ImplicitGrantFlow', 'Proceeding with redirect to PingOne', { url: redirectUrl });
    window.location.href = redirectUrl;
  };

  const steps: FlowStep[] = [
    {
      title: 'Generate Authorization URL',
      description: 'Create the authorization URL with the implicit grant parameters',
      code: `// Authorization URL for Implicit Grant
const authUrl = '${generateAuthUrl()}';

// Parameters:
response_type: 'token'
client_id: '${config?.clientId || 'your_client_id'}'
redirect_uri: '${config?.redirectUri || 'https://yourapp.com/callback'}'
scope: 'read write'
state: 'random_state_value'
nonce: 'random_nonce_value'`,
      execute: () => {
        logger.flow('ImplicitGrantFlow', 'Executing authorization URL generation step');
        const url = generateAuthUrl();
        setAuthUrl(url);
        const result = { url };
        setStepResults(prev => ({ ...prev, 0: result }));
        setExecutedSteps(prev => new Set(prev).add(0));
        logger.success('ImplicitGrantFlow', 'Authorization URL step completed', { url });
        return result;
      }
    },
    {
      title: 'Redirect User to Authorization Server',
      description: 'User is redirected to PingOne to authenticate and consent',
      code: `// User clicks login link or is redirected
window.location.href = authUrl;

// PingOne handles:
// - User authentication
// - Consent for requested scopes
// - Redirect back with tokens in URL fragment`,
      execute: () => {
        if (!authUrl) {
          setError('Authorization URL not found. Please execute step 1 first.');
          return { error: 'Authorization URL not found' };
        }
        
        logger.flow('ImplicitGrantFlow', 'Preparing redirect modal for PingOne authentication', { authUrl });
        console.log('✅ [ImplicitGrantFlow] Preparing redirect modal for PingOne authentication:', authUrl);
        
        // Parse URL to extract parameters
        const url = new URL(authUrl);
        const params: Record<string, string> = {};
        url.searchParams.forEach((value, key) => {
          params[key] = value;
        });
        
        // Set modal data and show modal
        setRedirectUrl(authUrl);
        setRedirectParams(params);
        setShowRedirectModal(true);
        
        const result = { message: 'Redirect modal prepared', url: authUrl };
        setStepResults(prev => ({ ...prev, 1: result }));
        setExecutedSteps(prev => new Set(prev).add(1));
        return result;
      }
    },
    {
      title: 'Handle Redirect with Tokens',
      description: 'PingOne redirects back with access token and ID token in URL fragment',
      code: `// Callback URL with tokens in fragment
https://yourapp.com/callback#access_token=eyJ...

// JavaScript extracts tokens from URL fragment
const hash = window.location.hash.substring(1);
const params = new URLSearchParams(hash);

const accessToken = params.get('access_token');
const tokenType = params.get('token_type');
const expiresIn = params.get('expires_in');

// Store tokens securely
localStorage.setItem('access_token', accessToken);`,
      execute: () => {
        // Simulate receiving tokens from the redirect
        const mockTokens = {
          access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'read write'
        };
        setTokensReceived(mockTokens);
        const result = { tokens: mockTokens };
        setStepResults(prev => ({ ...prev, 2: result }));
        setExecutedSteps(prev => new Set(prev).add(2));
        
        // Store tokens using the shared utility
        const tokensForStorage = {
          access_token: mockTokens.access_token,
          token_type: mockTokens.token_type,
          expires_in: mockTokens.expires_in,
          scope: mockTokens.scope
        };
        
        const success = storeOAuthTokens(tokensForStorage, 'implicit', 'Implicit Grant Flow');
        if (success) {
          console.log('✅ [ImplicitGrantFlow] Tokens received and stored successfully');
        } else {
          console.error('❌ [ImplicitGrantFlow] Failed to store tokens');
        }
        
        return result;
      }
    },
    {
      title: 'Use Tokens for API Calls',
      description: 'Use the access token to authenticate API requests',
      code: `// Make authenticated API calls
const headers = {
  'Authorization': 'Bearer ' + accessToken,
  'Content-Type': 'application/json'
};

fetch('/api/user/profile', { headers })
  .then(response => response.json())
  .then(data => console.log('User profile:', data));

// Validate ID token if needed
const decodedIdToken = parseJwt(idToken);
console.log('User ID:', decodedIdToken.sub);`,
      execute: () => {
        const result = { message: 'Tokens ready for API calls' };
        setStepResults(prev => ({ ...prev, 3: result }));
        setExecutedSteps(prev => new Set(prev).add(3));
        setDemoStatus('success');
        return result;
      }
    }
  ];

  return (
    <Container>
      <PageTitle 
        title={
          <>
            <FiLock />
            Implicit Grant Flow
          </>
        }
        subtitle="Learn how the Implicit Grant flow works with real API calls to PingOne. This flow is suitable for client-side applications but has security limitations."
      />

      <FlowCredentials
        flowType="implicit"
                    onCredentialsChange={(credentials) => {
              logger.config('ImplicitGrantFlow', 'Flow credentials updated', credentials);
            }}
      />

      <FlowOverview>
        <CardHeader>
          <h2>Flow Overview</h2>
        </CardHeader>
        <CardBody>
          <FlowDescription>
            <h2>What is Implicit Grant?</h2>
            <p>
              The Implicit Grant flow is a simplified OAuth 2.0 flow designed for public clients
              (typically browser-based applications) that cannot securely store client secrets.
              Access tokens are returned immediately without an extra authorization code exchange step.
            </p>
            <p>
              <strong>How it works:</strong> The client redirects the user to the authorization server,
              which authenticates the user and immediately returns access tokens in the redirect URL fragment.
            </p>
          </FlowDescription>

          <SecurityWarning>
            <FiAlertCircle size={20} />
            <div>
              <h3>Security Warning</h3>
              <p>
                The Implicit Grant flow has security limitations and is generally not recommended
                for new applications. Consider using the Authorization Code flow with PKCE instead.
              </p>
            </div>
          </SecurityWarning>
        </CardBody>
      </FlowOverview>

      <DemoSection>
        <CardHeader>
          <h2>Interactive Demo</h2>
        </CardHeader>
        <CardBody>
          <StepByStepFlow
            steps={stepsWithResults.length > 0 ? stepsWithResults : steps}
            onStart={startImplicitFlow}
            onReset={resetDemo}
            status={demoStatus}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            onStepResult={handleStepResult}
            disabled={!config}
            title="Implicit Flow"
            configurationButton={
              <ConfigurationButton flowType="implicit" />
            }
          />

          {!config && (
            <ErrorMessage>
              <FiAlertCircle />
              <strong>Configuration Required:</strong> Please configure your PingOne settings
              in the Configuration page before running this demo.
            </ErrorMessage>
          )}

          {error && (
            <ErrorMessage>
              <FiAlertCircle />
              <strong>Error:</strong> {error}
            </ErrorMessage>
          )}

          {authUrl && (
            <div>
              <h3>Authorization URL Generated:</h3>
              <ColorCodedURL url={authUrl} />
              <URLParamExplainer url={authUrl} />
            </div>
          )}

          {tokensReceived && (
            <div>
              <h3>Tokens Received:</h3>
              <TokenDisplayComponent tokens={tokensReceived} />
            </div>
          )}
        </CardBody>
      </DemoSection>
      {/* Redirect Modal */}
      <AuthorizationRequestModal
        isOpen={showRedirectModal}
        onClose={handleRedirectModalClose}
        onProceed={handleRedirectModalProceed}
        authorizationUrl={redirectUrl}
        requestParams={redirectParams}
      />
    </Container>
  );
};

export default ImplicitGrantFlow;
