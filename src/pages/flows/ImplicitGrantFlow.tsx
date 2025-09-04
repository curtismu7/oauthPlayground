import React, { useState, useMemo, useEffect } from 'react';
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
import FlowBadge from '../../components/FlowBadge';
import { getFlowById } from '../../types/flowTypes';
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
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  svg {
    color: #dc2626;
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  h3 {
    color: #dc2626;
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: #dc2626;
    font-size: 0.9rem;
  }
`;

const DeprecationWarning = styled.div`
  background-color: #fffbeb;
  border: 1px solid #fed7aa;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  svg {
    color: #ea580c;
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  h3 {
    color: #ea580c;
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: #9a3412;
    font-size: 0.9rem;
    line-height: 1.5;
  }
`;

const ResultSection = styled.div`
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: ${({ theme }) => theme.colors.gray50};
  border-radius: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};

  h3 {
    color: ${({ theme }) => theme.colors.gray900};
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &:last-child {
    margin-bottom: 0;
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
  const { config, tokens: contextTokens } = useAuth();
  const [demoStatus, setDemoStatus] = useState('idle');
  
  // Debug configuration loading
  console.log('🔍 [ImplicitGrantFlow] Config debug:', {
    hasConfig: !!config,
    config: config ? {
      hasAuthorizationEndpoint: !!config.authorizationEndpoint,
      hasClientId: !!config.clientId,
      hasRedirectUri: !!config.redirectUri,
      authorizationEndpoint: config.authorizationEndpoint,
      clientId: config.clientId,
      redirectUri: config.redirectUri
    } : null
  });

  // Check for existing tokens immediately on component mount
  useEffect(() => {
    console.log('🚀 [ImplicitGrantFlow] Component mounted - checking for existing tokens');
    
    // Check context tokens first
    if (contextTokens && !tokensReceived) {
      console.log('✅ [ImplicitGrantFlow] Found context tokens on mount');
      setTokensReceived(contextTokens as Record<string, unknown> | null);
      setCurrentStep(3);
      setDemoStatus('success');
      setIsLoading(false);
      setExecutedSteps(new Set([1, 2, 3]));
      setStepResults({
        1: { message: 'Authorization URL generated successfully' },
        2: { message: 'User redirected to PingOne for authentication' },
        3: { message: 'User authenticated and tokens received from PingOne', tokens: contextTokens }
      });
      return;
    }
    
    // Fallback: Check sessionStorage
    try {
      const storedTokens = sessionStorage.getItem('pingone_playground_tokens');
      if (storedTokens && !tokensReceived) {
        const parsedTokens = JSON.parse(storedTokens);
        console.log('✅ [ImplicitGrantFlow] Found sessionStorage tokens on mount');
        setTokensReceived(parsedTokens);
        setCurrentStep(3);
        setDemoStatus('success');
        setIsLoading(false);
        setExecutedSteps(new Set([1, 2, 3]));
        setStepResults({
          1: { message: 'Authorization URL generated successfully' },
          2: { message: 'User redirected to PingOne for authentication' },
          3: { message: 'User authenticated and tokens received from PingOne', tokens: parsedTokens }
        });
      }
    } catch (error) {
      console.warn('⚠️ [ImplicitGrantFlow] Error checking sessionStorage on mount:', error);
    }
  }, []); // Run only on mount

  const [currentStep, setCurrentStep] = useState(0);
  const [authUrl, setAuthUrl] = useState('');
  const [tokensReceived, setTokensReceived] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stepResults, setStepResults] = useState<Record<number, any>>({});
  const [executedSteps, setExecutedSteps] = useState<Set<number>>(new Set());
  const [stepsWithResults, setStepsWithResults] = useState<FlowStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal state for authorization request
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAuthUrl, setPendingAuthUrl] = useState('');
  const [pendingRequestParams, setPendingRequestParams] = useState<Record<string, string>>({});

  // If we already have tokens from the real OAuth flow, surface them in the demo
  useEffect(() => {
    console.log('🔍 [ImplicitGrantFlow] useEffect triggered:', {
      hasContextTokens: !!contextTokens,
      hasTokensReceived: !!tokensReceived,
      contextTokens: contextTokens ? Object.keys(contextTokens) : null,
      currentStep,
      demoStatus,
      executedStepsSize: executedSteps.size
    });
    
    if (contextTokens && !tokensReceived) {
      console.log('🔄 [ImplicitGrantFlow] Detected tokens from context, advancing flow state');
      setTokensReceived(contextTokens as Record<string, unknown> | null);
      setCurrentStep(3);
      setDemoStatus('success');
      setIsLoading(false);
      
      // Mark steps 1 and 2 as completed since we have tokens
      setExecutedSteps(new Set([1, 2, 3]));
      
      // Set results for completed steps
      setStepResults(prev => ({
        ...prev,
        1: { message: 'Authorization URL generated successfully' },
        2: { message: 'User redirected to PingOne for authentication' },
        3: { message: 'User authenticated and tokens received from PingOne', tokens: contextTokens }
      }));
      
      console.log('✅ [ImplicitGrantFlow] Flow state updated - steps 1-3 marked as completed');
    }
  }, [contextTokens, tokensReceived, currentStep, demoStatus, executedSteps.size]);

  // Fallback: Check sessionStorage directly for tokens if context hasn't updated yet
  useEffect(() => {
    const checkForStoredTokens = () => {
      try {
        // Check sessionStorage with the correct key prefix
        const storedTokens = sessionStorage.getItem('pingone_playground_tokens');
        if (storedTokens && !tokensReceived) {
          const parsedTokens = JSON.parse(storedTokens);
          console.log('🔄 [ImplicitGrantFlow] Found tokens in sessionStorage, advancing flow state');
          setTokensReceived(parsedTokens);
          setCurrentStep(3);
          setDemoStatus('success');
          setIsLoading(false);
          
          // Mark steps as completed
          setExecutedSteps(new Set([1, 2, 3]));
          
          // Set results for completed steps
          setStepResults(prev => ({
            ...prev,
            1: { message: 'Authorization URL generated successfully' },
            2: { message: 'User redirected to PingOne for authentication' },
            3: { message: 'User authenticated and tokens received from PingOne', tokens: parsedTokens }
          }));
          
          console.log('✅ [ImplicitGrantFlow] SessionStorage fallback - flow state updated with steps 1-3 completed');
        }
      } catch (error) {
        console.warn('⚠️ [ImplicitGrantFlow] Error checking sessionStorage for tokens:', error);
      }
    };

    // Check immediately
    checkForStoredTokens();
    
    // Also check after a short delay in case tokens are being stored asynchronously
    const timer = setTimeout(checkForStoredTokens, 1000);
    
    return () => clearTimeout(timer);
  }, [tokensReceived]);

  // Debug authUrl state changes
  React.useEffect(() => {
    console.log('🔍 [ImplicitGrantFlow] authUrl state changed:', authUrl);
  }, [authUrl]);

  // Generate authorization URL
  const generateAuthUrl = () => {
    if (!config) {
      console.warn('⚠️ [ImplicitGrantFlow] Configuration not available');
      return '';
    }

    if (!config.authorizationEndpoint || !config.clientId || !config.redirectUri) {
      console.warn('⚠️ [ImplicitGrantFlow] Missing required configuration:', {
        authorizationEndpoint: !!config.authorizationEndpoint,
        clientId: !!config.clientId,
        redirectUri: !!config.redirectUri
      });
      return '';
    }

    const params = new URLSearchParams({
      response_type: 'id_token token',
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: 'openid profile email',
      state: Math.random().toString(36).substring(2, 15),
      nonce: Math.random().toString(36).substring(2, 15)
    });

    const url = `${config.authorizationEndpoint}?${params.toString()}`;
    console.log('✅ [ImplicitGrantFlow] Generated authorization URL:', url);
    return url;
  };

  const startImplicitFlow = async () => {
    setDemoStatus('loading');
    setCurrentStep(0);
    setError(null);
    setTokensReceived(null);
    setAuthUrl('');
    setStepResults({});
    setExecutedSteps(new Set());
    setStepsWithResults([...steps]); // Initialize with copy of steps
    console.log('🚀 [ImplicitGrantFlow] Starting implicit flow...');
  };

  const resetDemo = () => {
    setDemoStatus('idle');
    setCurrentStep(0);
    setTokensReceived(null);
    setError(null);
    setAuthUrl('');
    setStepResults({});
    setExecutedSteps(new Set());
    setStepsWithResults([]);
  };

  const handleStepResult = (stepIndex: number, result: any) => {
    console.log('🔍 [ImplicitGrantFlow] handleStepResult called:', { stepIndex, result });
    setStepResults(prev => {
      const newResults = { ...prev, [stepIndex]: result };
      console.log('🔍 [ImplicitGrantFlow] Updated stepResults:', newResults);
      return newResults;
    });
    setStepsWithResults(prev => {
      const newSteps = [...prev];
      if (newSteps[stepIndex]) {
        newSteps[stepIndex] = { ...newSteps[stepIndex], result };
      }
      console.log('🔍 [ImplicitGrantFlow] Updated stepsWithResults:', newSteps);
      return newSteps;
    });
  };

  // Modal handlers
  const handleModalClose = () => {
    setShowAuthModal(false);
    setPendingAuthUrl('');
    setPendingRequestParams({});
  };

  const handleModalProceed = () => {
    console.log('🔄 [ImplicitGrantFlow] Proceeding to PingOne:', pendingAuthUrl);
    setShowAuthModal(false);
    // Redirect to PingOne
    window.location.href = pendingAuthUrl;
  };

  const steps: FlowStep[] = useMemo(() => [
    {
      title: 'Generate Authorization URL',
      description: 'Create the authorization URL with authorization code parameters',
      code: `// Authorization URL for Simplified Authorization Code Flow
const authUrl = '${generateAuthUrl()}';

// Parameters:
response_type: 'code'
client_id: '${config?.clientId || 'your_client_id'}'
redirect_uri: '${config?.redirectUri || 'https://yourapp.com/callback'}'
scope: 'openid profile email'
state: 'random_state_value'
nonce: 'random_nonce_value'

// Full URL:
${config?.authorizationEndpoint || 'https://auth.pingone.com/env_id/as/authorize'}?response_type=code&client_id=${config?.clientId || 'your_client_id'}&redirect_uri=${config?.redirectUri || 'https://yourapp.com/callback'}&scope=openid%20profile%20email&state=random_state_value&nonce=random_nonce_value`,
      execute: () => {
        console.log('🔍 [ImplicitGrantFlow] Step 1 execute called:', {
          hasConfig: !!config,
          config: config ? {
            hasAuthorizationEndpoint: !!config.authorizationEndpoint,
            hasClientId: !!config.clientId,
            hasRedirectUri: !!config.redirectUri,
            authorizationEndpoint: config.authorizationEndpoint,
            clientId: config.clientId,
            redirectUri: config.redirectUri
          } : null
        });
        
        if (!config) {
          setError('Configuration required. Please configure your PingOne settings first.');
          return { error: 'Configuration required' };
        }
        
        const url = generateAuthUrl();
        if (!url) {
          setError('Failed to generate authorization URL. Please check your configuration.');
          return { error: 'Failed to generate authorization URL' };
        }
        
        const result = { url };
        console.log('🔍 [ImplicitGrantFlow] Step 1 - About to set authUrl state:', url);
        setAuthUrl(url);
        console.log('✅ [ImplicitGrantFlow] Authorization URL generated and stored:', url);
        console.log('🔍 [ImplicitGrantFlow] Step 1 returning result:', result);
        console.log('🔍 [ImplicitGrantFlow] Step 1 state updates completed:', { url, result });
        console.log('🔍 [ImplicitGrantFlow] Step 1 result will be stored at index 0');
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
// - Redirect back with authorization code`,
      execute: () => {
        console.log('🚀 [ImplicitGrantFlow] Step 2 - Starting redirect to PingOne');
        if (!config) {
          setError('Configuration required. Please configure your PingOne settings first.');
          return { error: 'Configuration required' };
        }
        const params = new URLSearchParams({
          response_type: 'code',
          client_id: config.clientId,
          redirect_uri: config.redirectUri,
          scope: 'openid profile email',
          state: Math.random().toString(36).substring(2, 15),
          nonce: Math.random().toString(36).substring(2, 15)
        });
        const authorizationUrl = `${config.authorizationEndpoint}?${params.toString()}`;
        console.log('✅ [ImplicitGrantFlow] Generated authorization URL:', authorizationUrl);
        console.log('🔍 [ImplicitGrantFlow] Authorization endpoint:', config.authorizationEndpoint);
        console.log('🔍 [ImplicitGrantFlow] Client ID:', config.clientId);
        console.log('🔍 [ImplicitGrantFlow] Redirect URI:', config.redirectUri);
        console.log('🔍 [ImplicitGrantFlow] URL parameters:', Object.fromEntries(params.entries()));
        setAuthUrl(authorizationUrl);
        localStorage.setItem('oauth_flow_type', 'simplified-auth-code');
        console.log('🔍 [ImplicitGrantFlow] Set oauth_flow_type to simplified-auth-code in localStorage');
        
        // Show the authorization request modal instead of redirecting immediately
        setPendingAuthUrl(authorizationUrl);
        setPendingRequestParams({
          client_id: config.clientId,
          redirect_uri: config.redirectUri,
          response_type: 'code',
          scope: 'openid profile email',
          state: Math.random().toString(36).substring(2, 15),
          nonce: Math.random().toString(36).substring(2, 15)
        });
        setShowAuthModal(true);
        // Don't return result - execute should return void
      }
    },
    {
      title: 'User Authenticates on PingOne',
      description: 'The user is now on PingOne\'s login page where they enter their credentials and click the login button. This step is handled entirely by PingOne.',
      code: `// User is now on PingOne's login page
// They enter their username and password
// They click the "Login" button
// PingOne validates their credentials
// PingOne shows consent screen (if required)
// User clicks "Allow" or "Authorize"`,
      execute: () => {
        console.log('🔍 [ImplicitGrantFlow] Step 3 - User authentication on PingOne');
        console.log('ℹ️ [ImplicitGrantFlow] This step is handled by PingOne, not our application');
        console.log('ℹ️ [ImplicitGrantFlow] User should be on PingOne login page now');
        
        // Don't return result - execute should return void
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
    },
  ], [config, authUrl, stepResults, executedSteps, generateAuthUrl]);

  const flowType = getFlowById('simplified-auth-code');

  return (
    <Container>
      <PageTitle 
        title={
          <>
            <FiLock />
            Simplified Authorization Code Flow
          </>
        }
        subtitle="Learn how a simplified authorization code flow works with PingOne. This demonstrates the core OAuth concepts with a working implementation."
      />

      {flowType && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <FlowBadge flow={flowType} size="large" />
        </div>
      )}

      <DeprecationWarning>
        <FiAlertCircle size={20} />
        <div>
          <h3>✅ Working Flow - PingOne Compatible</h3>
          <p>
            This flow now uses <code>response_type=code</code> which is supported by PingOne. 
            It demonstrates a simplified authorization code flow that works with modern OAuth 2.1 standards.
            <br /><br />
            <strong>This flow will work successfully with PingOne!</strong>
          </p>
        </div>
      </DeprecationWarning>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', marginBottom: '3rem', padding: '1.5rem 0' }}>
        <ConfigurationButton flowType="implicit" />
      </div>

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
          />

          {!config && (
            <ErrorMessage>
              <FiAlertCircle />
              <strong>Configuration Required:</strong> Please configure your PingOne settings
              in the Configuration page before running this demo.
              <br />
              <button 
                onClick={() => {
                  console.log('🔍 [ImplicitGrantFlow] Debug Configuration Loading');
                  console.log('localStorage keys:', Object.keys(localStorage));
                  console.log('pingone_config:', localStorage.getItem('pingone_config'));
                  console.log('pingoneConfig:', localStorage.getItem('pingoneConfig'));
                  console.log('pingone:', localStorage.getItem('pingone'));
                  console.log('config:', localStorage.getItem('config'));
                  console.log('login_credentials:', localStorage.getItem('login_credentials'));
                }}
                style={{ marginTop: '10px', padding: '5px 10px', fontSize: '12px' }}
              >
                Debug Configuration Loading
              </button>
            </ErrorMessage>
          )}

          {error && (
            <ErrorMessage>
              <FiAlertCircle />
              <strong>Error:</strong> {error}
            </ErrorMessage>
          )}

          {authUrl && (
            <ResultSection>
              <h3>Authorization URL Generated:</h3>
              <ColorCodedURL url={authUrl} />
              <URLParamExplainer url={authUrl} />
            </ResultSection>
          )}

          {tokensReceived && (
            <ResultSection>
              <h3>Tokens Received:</h3>
              <TokenDisplayComponent tokens={tokensReceived} />
            </ResultSection>
          )}
        </CardBody>
      </DemoSection>
      
      {/* Authorization Request Modal */}
      <AuthorizationRequestModal
        isOpen={showAuthModal}
        onClose={handleModalClose}
        onProceed={handleModalProceed}
        authorizationUrl={pendingAuthUrl}
        requestParams={pendingRequestParams}
      />
    </Container>
  );
};

export default ImplicitGrantFlow;
