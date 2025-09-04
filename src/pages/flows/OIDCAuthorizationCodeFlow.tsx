import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { FiUser, FiShield, FiKey } from 'react-icons/fi';
import { useAuth } from '../../contexts/NewAuthContext';
import { ColorCodedURL } from '../../components/ColorCodedURL';
import { StepByStepFlow, FlowStep } from '../../components/StepByStepFlow';
import ConfigurationButton from '../../components/ConfigurationButton';
import { storeOAuthTokens } from '../../utils/tokenStorage';
import TokenDisplayComponent from '../../components/TokenDisplay';
import PageTitle from '../../components/PageTitle';
import FlowBadge from '../../components/FlowBadge';
import { getFlowById } from '../../types/flowTypes';

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

const OIDCInfo = styled.div`
  background-color: #f0fdf4;
  border: 1px solid #22c55e;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  svg {
    color: #22c55e;
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  h3 {
    color: #15803d;
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: #15803d;
    font-size: 0.9rem;
    line-height: 1.5;
  }
`;

const ResultSection = styled.div`
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: ${({ theme }) => theme.colors.gray50};
  border-radius: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
`;

const OIDCAuthorizationCodeFlow = () => {
  const { config, tokens } = useAuth();
  const [demoStatus, setDemoStatus] = useState('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [authUrl, setAuthUrl] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [stepResults, setStepResults] = useState<Record<number, any>>({});
  const [executedSteps, setExecutedSteps] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const generateAuthUrl = () => {
    if (!config) {
      console.warn('⚠️ [OIDCAuthCodeFlow] No configuration available');
      return '';
    }

    if (!config.authorizationEndpoint || !config.clientId || !config.redirectUri) {
      console.warn('⚠️ [OIDCAuthCodeFlow] Missing required configuration:', {
        authorizationEndpoint: !!config.authorizationEndpoint,
        clientId: !!config.clientId,
        redirectUri: !!config.redirectUri
      });
      return '';
    }

    const state = Math.random().toString(36).substring(2, 15);
    const nonce = Math.random().toString(36).substring(2, 15);
    
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: 'openid profile email', // OIDC scope
      state: state,
      nonce: nonce
    });

    const url = `${config.authorizationEndpoint}?${params.toString()}`;
    console.log('✅ [OIDCAuthCodeFlow] Generated OIDC authorization URL:', url);
    return url;
  };

  const startOIDCFlow = async () => {
    setDemoStatus('loading');
    setCurrentStep(0);
    setError(null);
    setStepResults({});
    setExecutedSteps(new Set());
    
    const url = generateAuthUrl();
    if (url) {
      setAuthUrl(url);
      console.log('🚀 [OIDCAuthCodeFlow] Starting OIDC flow with URL:', url);
    }
  };

  const executeStep = async (stepIndex: number) => {
    const step = steps[stepIndex];
    if (!step || !step.execute) return;

    try {
      const result = await step.execute();
      setStepResults(prev => ({
        ...prev,
        [stepIndex]: result
      }));
      setExecutedSteps(prev => new Set(prev).add(stepIndex));
      return result;
    } catch (error) {
      console.error(`❌ [OIDCAuthCodeFlow] Error in step ${stepIndex}:`, error);
      setError(`Error in step ${stepIndex}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const steps: FlowStep[] = useMemo(() => [
    {
      title: 'Generate OIDC Authorization URL',
      description: 'Create the authorization URL with OIDC-specific parameters including openid scope and nonce',
      code: `const params = new URLSearchParams({
  client_id: '${config?.clientId || 'your-client-id'}',
  redirect_uri: '${config?.redirectUri || 'https://your-app.com/callback'}',
  response_type: 'code',
  scope: 'openid profile email',  // OIDC scope
  state: 'random-state-value',
  nonce: 'random-nonce-value'     // OIDC nonce
});

const authUrl = '${config?.authorizationEndpoint || 'https://auth.pingone.com/...'}/as/authorize?' + params.toString();`,
      execute: () => {
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
        setAuthUrl(url);
        return result;
      }
    },
    {
      title: 'Redirect User to Authorization Server',
      description: 'User is redirected to PingOne to authenticate and consent to OIDC scopes',
      code: `// User is redirected to:
${authUrl || 'Generated authorization URL'}

// PingOne will:
// 1. Authenticate the user
// 2. Show consent screen for OIDC scopes (openid, profile, email)
// 3. Return authorization code`,
      execute: () => {
        if (!authUrl) {
          setError('Authorization URL not available. Please complete step 1 first.');
          return { error: 'Authorization URL not available' };
        }
        
        // Store flow type for callback redirect
        localStorage.setItem('oauth_flow_type', 'oidc-authorization-code');
        
        setTimeout(() => {
          window.location.href = authUrl;
        }, 1000);
      }
    },
    {
      title: 'User Authenticates on PingOne',
      description: 'The user is now on PingOne\'s login page where they enter their credentials and click the login button. This step is handled entirely by PingOne.',
      code: `// User is now on PingOne's login page
// They enter their username and password
// They click the "Login" button
// PingOne validates their credentials
// PingOne shows OIDC consent screen (openid, profile, email)
// User clicks "Allow" or "Authorize"`,
      execute: () => {
        console.log('🔍 [OIDCAuthCodeFlow] Step 3 - User authentication on PingOne');
        console.log('ℹ️ [OIDCAuthCodeFlow] This step is handled by PingOne, not our application');
        console.log('ℹ️ [OIDCAuthCodeFlow] User should be on PingOne login page now');
      }
    },
    {
      title: 'Handle OIDC Callback',
      description: 'PingOne redirects back with authorization code. The callback will exchange this for access token, ID token, and fetch user info.',
      code: `// Callback URL: ${config?.redirectUri || 'https://your-app.com/callback'}?code=AUTH_CODE&state=STATE

// The callback handler will:
// 1. Exchange code for tokens (access_token + id_token)
// 2. Validate the ID token
// 3. Fetch user info from UserInfo endpoint
// 4. Store all OIDC data`,
      execute: () => {
        const result = {
          message: 'OIDC callback will be handled automatically when user returns from PingOne',
          callbackUrl: `${config?.redirectUri || 'https://your-app.com/callback'}?code=AUTH_CODE&state=STATE`
        };
        return result;
      }
    },
    {
      title: 'Use OIDC Tokens and User Info',
      description: 'Use the access token for API calls and display the ID token and user information',
      code: `// Access Token: ${tokens?.access_token ? 'Available' : 'Not available'}
// ID Token: ${tokens?.id_token ? 'Available' : 'Not available'}
// User Info: ${tokens?.user_info ? 'Available' : 'Not available'}

// Use access token for API calls
fetch('/api/protected', {
  headers: {
    'Authorization': 'Bearer ' + access_token
  }
});

// Display user information from ID token and UserInfo endpoint`,
      execute: () => {
        const result = {
          accessToken: tokens?.access_token || 'Not available',
          idToken: tokens?.id_token || 'Not available',
          userInfo: tokens?.user_info || 'Not available',
          message: 'OIDC flow completed successfully'
        };
        return result;
      }
    }
  ], [config, authUrl, tokens]);

  const flowType = getFlowById('oidc-authorization-code');

  return (
    <Container>
      <PageTitle 
        title={
          <>
            <FiUser />
            OIDC Authorization Code Flow
          </>
        }
        subtitle="OpenID Connect flow that provides both OAuth 2.0 access tokens and OIDC ID tokens with user information"
      />

      {flowType && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <FlowBadge flow={flowType} size="large" />
        </div>
      )}

      <FlowOverview>
        <CardHeader>
          <h2>OIDC Flow Overview</h2>
        </CardHeader>
        <CardBody>
          <FlowDescription>
            <h2>What is OIDC Authorization Code Flow?</h2>
            <p>
              The OpenID Connect (OIDC) Authorization Code Flow extends OAuth 2.0 to provide 
              authentication and user identity information. It returns both access tokens and 
              ID tokens, plus user profile information.
            </p>
            <p>
              <strong>Key differences from OAuth 2.0:</strong>
            </p>
            <ul>
              <li>Uses <code>openid</code> scope to request ID tokens</li>
              <li>Includes <code>nonce</code> parameter for security</li>
              <li>Returns ID tokens containing user identity claims</li>
              <li>Provides access to UserInfo endpoint for profile data</li>
            </ul>
          </FlowDescription>

          <OIDCInfo>
            <FiShield size={20} />
            <div>
              <h3>🔐 OIDC Security Features</h3>
              <p>
                This flow provides both OAuth 2.0 authorization (access tokens) and OpenID Connect 
                authentication (ID tokens + user info). Perfect for applications that need to know 
                who the user is, not just what they can access.
              </p>
            </div>
          </OIDCInfo>
        </CardBody>
      </FlowOverview>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
        <ConfigurationButton flowType="oidc" />
      </div>

      {error && (
        <ResultSection>
          <h3 style={{ color: '#ef4444', marginBottom: '1rem' }}>Error</h3>
          <p style={{ color: '#ef4444' }}>{error}</p>
        </ResultSection>
      )}

      <StepByStepFlow
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onExecuteStep={executeStep}
        demoStatus={demoStatus}
        onStartDemo={startOIDCFlow}
        stepResults={stepResults}
        executedSteps={executedSteps}
      />

      {tokens && (
        <ResultSection>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiKey />
            OIDC Tokens & User Info
          </h3>
          <TokenDisplayComponent tokens={tokens} />
        </ResultSection>
      )}
    </Container>
  );
};

export default OIDCAuthorizationCodeFlow;
