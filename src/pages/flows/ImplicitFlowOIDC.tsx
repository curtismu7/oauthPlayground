import React, { useState } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { FiPlay, FiAlertCircle } from 'react-icons/fi';
import PageTitle from '../../components/PageTitle';
import TokenDisplayComponent from '../../components/TokenDisplay';
import ConfigurationButton from '../../components/ConfigurationButton';
import { useAuth } from '../../contexts/NewAuthContext';
import { config } from '../../services/config';
import { StepByStepFlow, FlowStep } from '../../components/StepByStepFlow';
import { ColorCodedURL } from '../../components/ColorCodedURL';
import Typewriter from '../../components/Typewriter';
import { storeOAuthTokens } from '../../utils/tokenStorage';
import FlowCredentials from '../../components/FlowCredentials';
import { getCallbackUrlForFlow } from '../../utils/callbackUrls';

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Title = styled.h1`
  font-size: 1.75rem;
`;

const Description = styled.p`
  color: ${({ theme }) => theme.colors.gray600};
  line-height: 1.6;
`;

const Section = styled.section`
  background: white;
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  padding: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  margin-bottom: 1rem;
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

const ResponseBox = styled.div<{ $backgroundColor?: string; $borderColor?: string }>`
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid ${({ $borderColor }) => $borderColor || '#374151'};
  background-color: ${({ $backgroundColor }) => $backgroundColor || '#1f2937'};
  font-family: monospace;
  font-size: 0.875rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
  overflow: visible;
  max-width: 100%;
  color: #f9fafb;

  h4 {
    margin: 0 0 0.5rem 0;
    font-family: inherit;
    font-size: 1rem;
    font-weight: 600;
    color: #f9fafb;
  }

  pre {
    margin: 0;
    background: none;
    padding: 0;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    white-space: pre-wrap;
    word-break: break-all;
    overflow: visible;
    color: #f9fafb !important;
  }
`;



const ImplicitFlowOIDC: React.FC = () => {
  const { config } = useAuth();
  const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string>('');
  const [stepResults, setStepResults] = useState<Record<number, unknown>>({});
  const [executedSteps, setExecutedSteps] = useState<Set<number>>(new Set());
  const [stepsWithResults, setStepsWithResults] = useState<FlowStep[]>([]);

  const startImplicitFlow = () => {
    setDemoStatus('loading');
    setCurrentStep(0);
    setError(null);
    setStepResults({});
    setExecutedSteps(new Set());
    setStepsWithResults([...steps]); // Initialize with copy of steps
    console.log('🚀 [ImplicitFlowOIDC] Starting implicit flow...');
  };

  const resetDemo = () => {
    setDemoStatus('idle');
    setCurrentStep(0);
    setError('');
    setStepResults({});
    setExecutedSteps(new Set());
    setStepsWithResults([]);
  };

  const handleStepResult = (stepIndex: number, result: unknown) => {
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
      title: 'Client Prepares Authorization Request',
      description: 'The client application prepares an authorization request with OpenID Connect parameters.',
      code: `GET ${config?.authorizationEndpoint || config?.authEndpoint || 'https://auth.pingone.com/YOUR_ENV_ID/as/authorize'}?
  client_id=${config?.clientId || 'your_client_id'}
  &redirect_uri=${config?.redirectUri || 'https://your-app.com/callback'}
  &response_type=id_token token
  &scope=${config?.scopes?.join(' ') || 'openid profile email'}
  &nonce=${Math.random().toString(36).substring(2, 15)}
  &state=${Math.random().toString(36).substring(2, 15)}`,
      execute: () => {
        console.log('🔍 [ImplicitFlowOIDC] Config in execute:', config);
        console.log('🔍 [ImplicitFlowOIDC] authorizationEndpoint:', config.pingone.authEndpoint);
        console.log('🔍 [ImplicitFlowOIDC] authEndpoint:', config.pingone.authEndpoint);
        console.log('🔍 [ImplicitFlowOIDC] environmentId:', config.pingone.environmentId);
        
        if (!config) {
          setError('Configuration required. Please configure your PingOne settings first.');
          return;
        }

        const params = new URLSearchParams({
          client_id: config.pingone.clientId,
          redirect_uri: getCallbackUrlForFlow('implicit'),
          response_type: 'id_token token',
          scope: config.scopes?.join(' ') || 'openid profile email',
          nonce: Math.random().toString(36).substring(2, 15),
          state: Math.random().toString(36).substring(2, 15),
        });

        // Construct authorization endpoint if not available
        const authEndpoint = config.pingone.authEndpoint;
        console.log('🔍 [ImplicitFlowOIDC] Final authEndpoint after replacement:', authEndpoint);
        const url = `${authEndpoint}?${params.toString()}`;
        console.log('🔍 [ImplicitFlowOIDC] Final URL constructed:', url);

        const result = { url };
        setStepResults(prev => ({ ...prev, 0: result }));
        setExecutedSteps(prev => new Set(prev).add(0));

        console.log('✅ [ImplicitFlowOIDC] Authorization URL generated:', url);
        return result;
      }
    },
    {
      title: 'User is Redirected to Authorization Server',
      description: 'The user is redirected to PingOne for authentication and consent.',
      code: `// User clicks the authorization URL and is redirected to PingOne
window.location.href = authUrl;

// PingOne handles:
// - User authentication
// - Consent for requested scopes
// - Redirect back to client with tokens in URL fragment`,
      execute: () => {
        const stepResult = stepResults[0];
        const authUrl = stepResult?.url;
        
        if (!authUrl) {
          setError('Authorization URL not found. Please execute step 1 first.');
          return { error: 'Authorization URL not found' };
        }
        
        logger.flow('ImplicitFlowOIDC', 'Redirecting to PingOne for authentication', { authUrl });
        console.log('✅ [ImplicitFlowOIDC] Redirecting to PingOne for authentication:', authUrl);
        
        // Actually redirect to PingOne
        window.location.href = authUrl;
        
        const result = {
          message: 'Redirecting to PingOne...',
          url: authUrl
        };
        setStepResults(prev => ({
          ...prev,
          1: result
        }));
        setExecutedSteps(prev => new Set(prev).add(1));
        return result;
      }
    },
    {
      title: 'Authorization Server Redirects Back',
      description: 'After successful authentication, PingOne redirects back with tokens in the URL fragment.',
      code: `GET ${config?.redirectUri || 'https://your-app.com/callback'}#access_token=...
  &id_token=...
  &token_type=Bearer
  &expires_in=3600
  &state=xyz123

// Client receives URL like:
// https://your-app.com/callback#access_token=eyJ...&id_token=eyJ...&token_type=Bearer&expires_in=3600&state=xyz123`,
      execute: async () => {
        // This step simulates the callback that would come from PingOne
        // In a real implementation, this would be handled by the callback URL
        const result = {
          message: 'This step simulates the callback from PingOne. In a real implementation, PingOne would redirect to your callback URL with the tokens in the URL fragment.',
          note: 'To test with real tokens, configure your PingOne application and use the actual authorization URL from step 1.'
        };
        setStepResults(prev => ({
          ...prev,
          2: result
        }));
        setExecutedSteps(prev => new Set(prev).add(2));

        // Note: In a real implementation, tokens would be extracted from the URL fragment
        // and stored using the storeOAuthTokens utility
        
        return result;
      }
    },
    {
      title: 'Client Extracts Tokens from Fragment',
      description: 'The client JavaScript extracts the access token and ID token from the URL fragment.',
      code: `// Extract tokens from URL fragment
const hash = window.location.hash.substring(1);
const params = new URLSearchParams(hash);

const accessToken = params.get('access_token');
const idToken = params.get('id_token');
const tokenType = params.get('token_type');
const expiresIn = params.get('expires_in');
const state = params.get('state');

// Store tokens (in memory for security)
const tokens = {
  access_token: accessToken,
  id_token: idToken,
  token_type: tokenType,
  expires_in: parseInt(expiresIn),
  state: state
};

// Clear the fragment from the URL
window.history.replaceState(null, '', window.location.pathname);`,
      execute: () => {
        const hash = '#access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9&token_type=Bearer&expires_in=3600&id_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9&state=xyz789';
        const params = new URLSearchParams(hash.substring(1));

        const extractedTokens = {
          access_token: params.get('access_token'),
          id_token: params.get('id_token'),
          token_type: params.get('token_type'),
          expires_in: parseInt(params.get('expires_in') || '3600'),
          state: params.get('state'),
        };

        const result = {
          extractedTokens,
          message: 'Tokens successfully extracted from URL fragment'
        };
        setStepResults(prev => ({
          ...prev,
          3: result
        }));
        setExecutedSteps(prev => new Set(prev).add(3));

        console.log('✅ [ImplicitFlowOIDC] Tokens extracted from URL fragment');
        return result;
      }
    },
    {
      title: 'Client Validates ID Token',
      description: 'The client validates the ID token signature, issuer, audience, and other claims.',
      code: `// Validate ID token
const payload = JSON.parse(atob(idToken.split('.')[1]));

// Validate issuer
if (payload.iss !== '${config?.authorizationEndpoint?.replace('/as/authorize', '') || 'https://auth.pingone.com/YOUR_ENV_ID'}') {
  throw new Error('Invalid issuer');
}

// Validate audience
if (payload.aud !== '${config?.clientId || 'your_client_id'}') {
  throw new Error('Invalid audience');
}

// Validate expiration
if (payload.exp < Date.now() / 1000) {
  throw new Error('Token expired');
}

// Validate nonce (if provided)
if (payload.nonce !== storedNonce) {
  throw new Error('Invalid nonce');
}

console.log('✅ ID token validation successful');`,
      execute: () => {
        // Simulate ID token validation
        const validationResult = {
          issuer: 'https://auth.pingone.com/YOUR_ENV_ID',
          audience: config?.clientId || 'your_client_id',
          expiration: new Date(Date.now() + 3600000),
          nonce: 'valid_nonce',
          isValid: true
        };

        const result = {
          validation: validationResult,
          message: 'ID token validation completed successfully'
        };
        setStepResults(prev => ({
          ...prev,
          4: result
        }));
        setExecutedSteps(prev => new Set(prev).add(4));
        setDemoStatus('success');

        console.log('✅ [ImplicitFlowOIDC] ID token validation completed');
        return result;
      }
    }
  ];

  return (
    <Page>
            <PageTitle
        title="Implicit Flow (OpenID Connect)"
        subtitle="Implicit Flow for OpenID Connect allows clients to obtain access and ID tokens directly from the authorization endpoint. This flow is suitable for public clients (e.g., SPAs) that cannot securely store client secrets. However, it is considered legacy and less secure than Authorization Code with PKCE."
      />

      <FlowCredentials
        flowType="implicit"
        onCredentialsChange={(credentials) => {
          console.log('Implicit OIDC flow credentials updated:', credentials);
        }}
      />

      <Section>
        <SectionTitle>Security Considerations</SectionTitle>
        <ul>
          <li>Use <code>nonce</code> to prevent replay attacks</li>
          <li>Validate ID token signature and claims</li>
          <li>Do not store tokens in localStorage</li>
          <li>Consider migrating to Authorization Code + PKCE</li>
          <li>Access tokens may be exposed in browser history</li>
        </ul>
      </Section>

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


        </CardBody>
      </DemoSection>
    </Page>
  );
};

export default ImplicitFlowOIDC;
