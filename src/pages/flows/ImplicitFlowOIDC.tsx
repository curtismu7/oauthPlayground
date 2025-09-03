import React, { useState } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { FiPlay, FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import PageTitle from '../../components/PageTitle';
import TokenDisplayComponent from '../../components/TokenDisplay';
import ConfigurationButton from '../../components/ConfigurationButton';
import { useAuth } from '../../contexts/NewAuthContext';
import { StepByStepFlow, FlowStep } from '../../components/StepByStepFlow';
import { ColorCodedURL } from '../../components/ColorCodedURL';
import Typewriter from '../../components/Typewriter';
import { storeOAuthTokens } from '../../utils/tokenStorage';

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
  border: 1px solid ${({ $borderColor }) => $borderColor || '#e2e8f0'};
  background-color: ${({ $backgroundColor }) => $backgroundColor || '#f8fafc'};
  font-family: monospace;
  font-size: 0.875rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
  overflow: visible;
  max-width: 100%;

  h4 {
    margin: 0 0 0.5rem 0;
    font-family: inherit;
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
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
    color: #1f2937 !important;
  }
`;

const StepsContainer = styled.div`
  margin-top: 2rem;
`;

const Step = styled.div<{ $active?: boolean; $completed?: boolean; $error?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  border-radius: 0.5rem;
  background-color: ${({ $active: active, $completed: completed, $error: error }) => {
    if (error) return 'rgba(239, 68, 68, 0.1)';
    if (completed) return 'rgba(34, 197, 94, 0.1)';
    if (active) return 'rgba(59, 130, 246, 0.1)';
    return '#f8f9fa';
  }};
  border: 2px solid ${({ $active: active, $completed: completed, $error: error }) => {
    if (error) return '#ef4444';
    if (completed) return '#22c55e';
    if (active) return '#3b82f6';
    return '#e2e8f0';
  }};
`;

const StepNumber = styled.div<{ $active?: boolean; $completed?: boolean; $error?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  font-weight: 600;
  font-size: 0.875rem;
  color: ${({ $active: active, $completed: completed, $error: error }) => {
    if (error) return '#ef4444';
    if (completed) return '#22c55e';
    if (active) return '#3b82f6';
    return '#6b7280';
  }};
  background-color: ${({ $active: active, $completed: completed, $error: error }) => {
    if (error) return 'rgba(239, 68, 68, 0.1)';
    if (completed) return 'rgba(34, 197, 94, 0.1)';
    if (active) return 'rgba(59, 130, 246, 0.1)';
    return '#f3f4f6';
  }};
  border: 2px solid ${({ $active: active, $completed: completed, $error: error }) => {
    if (error) return '#ef4444';
    if (completed) return '#22c55e';
    if (active) return '#3b82f6';
    return '#d1d5db';
  }};
`;

const StepContent = styled.div`
  flex: 1;
`;

const ImplicitFlowOIDC: React.FC = () => {
  const { config } = useAuth();
  const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string>('');
  const [stepResults, setStepResults] = useState<Record<number, any>>({});
  const [executedSteps, setExecutedSteps] = useState<Set<number>>(new Set());

  const startImplicitFlow = () => {
    setDemoStatus('loading');
    setCurrentStep(0);
    setError(null);
    setStepResults({});
    setExecutedSteps(new Set());
    console.log('🚀 [ImplicitFlowOIDC] Starting implicit flow...');
  };

  const resetDemo = () => {
    setDemoStatus('idle');
    setCurrentStep(0);
    setError('');
    setStepResults({});
    setExecutedSteps(new Set());
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
        console.log('🔍 [ImplicitFlowOIDC] authorizationEndpoint:', config.authorizationEndpoint);
        console.log('🔍 [ImplicitFlowOIDC] authEndpoint:', config.authEndpoint);
        console.log('🔍 [ImplicitFlowOIDC] environmentId:', config.environmentId);
        
        if (!config) {
          setError('Configuration required. Please configure your PingOne settings first.');
          return;
        }

        const params = new URLSearchParams({
          client_id: config.clientId,
          redirect_uri: config.redirectUri,
          response_type: 'id_token token',
          scope: config.scopes?.join(' ') || 'openid profile email',
          nonce: Math.random().toString(36).substring(2, 15),
          state: Math.random().toString(36).substring(2, 15),
        });

        const authEndpoint = (config.authorizationEndpoint || config.authEndpoint || '').replace('{envId}', config.environmentId);
        console.log('🔍 [ImplicitFlowOIDC] Final authEndpoint after replacement:', authEndpoint);
        const url = `${authEndpoint}?${params.toString()}`;
        console.log('🔍 [ImplicitFlowOIDC] Final URL constructed:', url);

        setStepResults(prev => ({ ...prev, 0: { url } }));
        setExecutedSteps(prev => new Set(prev).add(0));

        console.log('✅ [ImplicitFlowOIDC] Authorization URL generated:', url);
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
        console.log('✅ [ImplicitFlowOIDC] User would be redirected to PingOne for authentication');
        setStepResults(prev => ({
          ...prev,
          1: {
            message: 'User redirected to authorization server for authentication and consent'
          }
        }));
        setExecutedSteps(prev => new Set(prev).add(1));
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
      execute: () => {
        const mockTokens = {
          access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.mock_access_token_signature',
          id_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.mock_id_token_signature',
          token_type: 'Bearer',
          expires_in: 3600,
          state: Math.random().toString(36).substring(2, 15),
        };

        const callbackUrl = `${config?.redirectUri || 'https://your-app.com/callback'}#access_token=${mockTokens.access_token}&id_token=${mockTokens.id_token}&token_type=${mockTokens.token_type}&expires_in=${mockTokens.expires_in}&state=${mockTokens.state}`;

        setStepResults(prev => ({
          ...prev,
          2: {
            url: callbackUrl,
            tokens: mockTokens
          }
        }));
        setExecutedSteps(prev => new Set(prev).add(2));

        // Store tokens using the shared utility
        const tokensForStorage = {
          access_token: mockTokens.access_token,
          id_token: mockTokens.id_token,
          token_type: mockTokens.token_type,
          expires_in: mockTokens.expires_in,
          scope: 'openid profile email'
        };
        
        const success = storeOAuthTokens(tokensForStorage, 'implicit_oidc', 'Implicit OIDC Flow');
        if (success) {
          console.log('✅ [ImplicitFlowOIDC] Tokens received and stored successfully');
        } else {
          console.error('❌ [ImplicitFlowOIDC] Failed to store tokens');
        }
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

        setStepResults(prev => ({
          ...prev,
          3: {
            extractedTokens,
            message: 'Tokens successfully extracted from URL fragment'
          }
        }));
        setExecutedSteps(prev => new Set(prev).add(3));

        console.log('✅ [ImplicitFlowOIDC] Tokens extracted from URL fragment');
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

        setStepResults(prev => ({
          ...prev,
          4: {
            validation: validationResult,
            message: 'ID token validation completed successfully'
          }
        }));
        setExecutedSteps(prev => new Set(prev).add(4));
        setDemoStatus('success');

        console.log('✅ [ImplicitFlowOIDC] ID token validation completed');
      }
    }
  ];

  return (
    <Page>
            <PageTitle
        title="Implicit Flow (OpenID Connect)"
        subtitle="Implicit Flow for OpenID Connect allows clients to obtain access and ID tokens directly from the authorization endpoint. This flow is suitable for public clients (e.g., SPAs) that cannot securely store client secrets. However, it is considered legacy and less secure than Authorization Code with PKCE."
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <ConfigurationButton flowType="implicit" />
      </div>

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
            steps={steps}
            onStart={startImplicitFlow}
            onReset={resetDemo}
            status={demoStatus}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            disabled={!config}
            title="Implicit Flow"
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

          <StepsContainer>
            <h3>Flow Steps</h3>
            {steps.map((step, index) => {
              const stepResult = stepResults[index];
              const isExecuted = executedSteps.has(index);

              return (
                <Step
                  key={index}
                  id={`step-${index}`}
                  $active={currentStep === index && demoStatus === 'loading'}
                  $completed={currentStep > index}
                  $error={currentStep === index && demoStatus === 'error'}
                >
                  <StepNumber
                    $active={currentStep === index && demoStatus === 'loading'}
                    $completed={currentStep > index}
                    $error={currentStep === index && demoStatus === 'error'}
                  >
                    {index + 1}
                  </StepNumber>
                  <StepContent>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>

                    {/* Show URL/Code section always */}
                    <Typewriter text={step.code} speed={8} />

                    {/* Show response/result only after step is executed */}
                    {isExecuted && stepResult && (
                      <ResponseBox
                        $backgroundColor="#f8fafc"
                        $borderColor="#e2e8f0"
                      >
                        <h4>Response:</h4>
                        {stepResult.url && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <strong>URL:</strong><br />
                            <ColorCodedURL url={stepResult.url} />
                          </div>
                        )}
                        {stepResult.tokens && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <strong>Tokens in URL Fragment:</strong>
                            <TokenDisplayComponent tokens={stepResult.tokens} />
                          </div>
                        )}
                        {stepResult.extractedTokens && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <strong>Extracted Tokens:</strong>
                            <TokenDisplayComponent tokens={stepResult.extractedTokens} />
                          </div>
                        )}
                        {stepResult.validation && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <strong>ID Token Validation:</strong><br />
                            <pre>{JSON.stringify(stepResult.validation, null, 2)}</pre>
                          </div>
                        )}
                        {stepResult.message && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <strong>Status:</strong><br />
                            <pre>{stepResult.message}</pre>
                          </div>
                        )}
                      </ResponseBox>
                    )}

                    {/* Show execution status */}
                    {isExecuted && (
                      <div style={{
                        marginTop: '1rem',
                        padding: '0.5rem',
                        backgroundColor: '#d4edda',
                        border: '1px solid #c3e6cb',
                        borderRadius: '0.25rem',
                        color: '#155724',
                        fontSize: '0.875rem'
                      }}>
                        ✅ Step completed successfully
                      </div>
                    )}

                    {/* Next button for each step - only show if it can actually advance */}
                    {isExecuted && index < steps.length - 1 && index + 1 > currentStep && (
                      <div style={{ 
                        marginTop: '1rem', 
                        textAlign: 'center',
                        padding: '1rem',
                        borderTop: '1px solid #e5e7eb'
                      }}>
                        <button
                          onClick={() => {
                            const nextStepIndex = index + 1;
                            console.log('🔄 [ImplicitFlowOIDC] Next Step button clicked', { currentIndex: index, nextStep: nextStepIndex, currentStepBefore: currentStep });
                            setCurrentStep(nextStepIndex);
                            console.log('🔄 [ImplicitFlowOIDC] setCurrentStep called with:', nextStepIndex);
                          }}
                          style={{
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            margin: '0 auto',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
                          onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
                        >
                          Next Step
                          <FiArrowRight style={{ width: '1rem', height: '1rem' }} />
                        </button>
                      </div>
                    )}
                  </StepContent>
                </Step>
              );
            })}
          </StepsContainer>
        </CardBody>
      </DemoSection>
    </Page>
  );
};

export default ImplicitFlowOIDC;
