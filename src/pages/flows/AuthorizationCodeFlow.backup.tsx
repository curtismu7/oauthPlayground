import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { FiEye, FiAlertCircle, FiKey, FiSettings, FiArrowRight } from 'react-icons/fi';
import TokenDisplayComponent from '../../components/TokenDisplay';
import ColorCodedURL from '../../components/ColorCodedURL';
import JSONHighlighter from '../../components/JSONHighlighter';
import { useAuth } from '../../contexts/NewAuthContext';
import { FlowConfiguration, type FlowConfig } from '../../components/FlowConfiguration';
import { getDefaultConfig, validatePingOneConfig } from '../../utils/flowConfigDefaults';
import { config } from '../../services/config';
import { generateCodeVerifier, generateCodeChallenge } from '../../utils/oauth';
import PageTitle from '../../components/PageTitle';
import { StepByStepFlow, FlowStep } from '../../components/StepByStepFlow';
import FlowCredentials from '../../components/FlowCredentials';
import { logger } from '../../utils/logger';
import AuthorizationRequestModal from '../../components/AuthorizationRequestModal';
import CallbackUrlDisplay from '../../components/CallbackUrlDisplay';
import { getCallbackUrlForFlow } from '../../utils/callbackUrls';
import ContextualHelp from '../../components/ContextualHelp';
import ConfigurationStatus from '../../components/ConfigurationStatus';
// import { SpecCard } from '../../components/SpecCard';
// import { TokenSurface } from '../../components/TokenSurface';

interface StepResult {
  url?: string;
  code?: string;
  tokenData?: Record<string, unknown>;
  tokens?: Record<string, unknown>;
  message?: string;
  error?: string;
}


// Define window interface for PingOne environment variables
interface WindowWithPingOne extends Window {
  __PINGONE_ENVIRONMENT_ID__?: string;
  __PINGONE_API_URL__?: string;
  __PINGONE_CLIENT_ID__?: string;
}

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

const SecurityHighlight = styled.div`
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


const DemoButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &.primary {
    background-color: ${({ theme }) => theme.colors.primary};
    color: white;
    border: 1px solid transparent;

    &:hover {
      background-color: ${({ theme }) => theme.colors.primaryDark};
    }
  }

  &.secondary {
    background-color: transparent;
    color: ${({ theme }) => theme.colors.primary};
    border: 1px solid ${({ theme }) => theme.colors.primary};

    &:hover {
      background-color: ${({ theme }) => theme.colors.primary}10;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;


const StepsContainer = styled.div`
  margin-top: 2rem;
`;

const Step = styled.div<{$active?: boolean; $completed?: boolean; $error?: boolean}>`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  border-radius: 0.5rem;
  background-color: ${({ $active, $completed, $error }) => {
    if ($error) return 'rgba(239, 68, 68, 0.1)';
    if ($completed) return 'rgba(34, 197, 94, 0.1)';
    if ($active) return 'rgba(59, 130, 246, 0.1)';
    return 'transparent';
  }};
  border: 2px solid ${({ $active, $completed, $error }) => {
    if ($error) return '#ef4444';
    if ($completed) return '#22c55e';
    if ($active) return '#3b82f6';
    return 'transparent';
  }};
`;

const StepNumber = styled.div<{$active?: boolean; $completed?: boolean; $error?: boolean}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  font-weight: 600;
  font-size: 1rem;
  flex-shrink: 0;

  ${({ $active, $completed, $error }) => {
    if ($error) {
      return `
        background-color: #ef4444;
        color: white;
      `;
    }
    if ($completed) {
      return `
        background-color: #22c55e;
        color: white;
      `;
    }
    if ($active) {
      return `
        background-color: #3b82f6;
        color: white;
      `;
    }
    return `
      background-color: #e5e7eb;
      color: #6b7280;
    `;
  }}
`;

const StepContent = styled.div`
  flex: 1;
`;

const CodeBlock = styled.pre`
  background-color: #000000;
  border: 1px solid #374151;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  overflow-x: auto;
  font-size: 0.875rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  color: #ffffff;
  white-space: pre-wrap;
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
  color: #ffffff;

  h4 {
    margin: 0 0 0.5rem 0;
    font-family: inherit;
    font-size: 1rem;
    font-weight: 600;
    color: #ffffff;
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
    color: #ffffff !important;
  }
`;


const AuthorizationCodeFlow = () => {
  const { tokens: contextTokens } = useAuth();
  const navigate = useNavigate();
  const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  
  // Debug currentStep changes
  useEffect(() => {
    console.log('🔄 [AuthorizationCodeFlow] currentStep changed to:', currentStep);
  }, [currentStep]);
  
  // Flow configuration state
  const [flowConfig, setFlowConfig] = useState<FlowConfig>(() => getDefaultConfig('authorization-code'));
  const [showConfig, setShowConfig] = useState(false);
  interface TokenResponse {
    access_token?: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
    [key: string]: unknown;
  }

  const [tokensReceived, setTokensReceived] = useState<TokenResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authCode, setAuthCode] = useState<string>('');
  const [authUrl, setAuthUrl] = useState<string>('');
  const [codeVerifier, setCodeVerifier] = useState<string>('');
  const [codeChallenge, setCodeChallenge] = useState<string>('');



  // Track execution results for each step
  const [stepResults, setStepResults] = useState<Record<number, unknown>>({});
  const [executedSteps, setExecutedSteps] = useState<Set<number>>(new Set());

  // Generate PKCE codes
  const generatePKCECodes = async () => {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    setCodeVerifier(verifier);
    setCodeChallenge(challenge);
    return { verifier, challenge };
  };

  // Generate PKCE codes early when PKCE is enabled
  useEffect(() => {
    if (flowConfig.enablePKCE && !codeChallenge) {
      console.log('🔑 [AuthCodeFlow] Auto-generating PKCE codes on mount...');
      generatePKCECodes().then(({ challenge }) => {
        console.log('🔑 [AuthCodeFlow] PKCE codes auto-generated:', { 
          challenge: challenge?.substring(0, 20) + '...',
          method: flowConfig.codeChallengeMethod 
        });
      }).catch(error => {
        console.error('🔑 [AuthCodeFlow] Failed to auto-generate PKCE codes:', error);
      });
    }
  }, [flowConfig.enablePKCE, codeChallenge, flowConfig.codeChallengeMethod]);
  const [stepsWithResults, setStepsWithResults] = useState<FlowStep[]>([]);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('');
  const [redirectParams, setRedirectParams] = useState<Record<string, string>>({});

  // Debug modal state changes
  useEffect(() => {
    console.log('🔍 [AuthCodeFlow] Modal state changed:', { showRedirectModal, redirectUrl: redirectUrl ? 'present' : 'empty' });
  }, [showRedirectModal, redirectUrl]);

  // If we already have tokens from the real OAuth flow, surface them in the demo
  useEffect(() => {
    if (contextTokens && !tokensReceived) {
      setTokensReceived(contextTokens as Record<string, unknown> | null);
      setCurrentStep(5);
      setDemoStatus('success');
      setDemoStatus('idle');
    }
  }, [contextTokens, tokensReceived]);

  // Define steps with real URLs from config
  const steps: FlowStep[] = [
    {
      title: 'Client Prepares Authorization Request',
      description: 'The client application prepares an authorization request with required parameters.',
      code: `GET /authorize?
  client_id=${config?.pingone?.clientId || 'your-client-id'}
  &redirect_uri=${getCallbackUrlForFlow('authorization-code')}
  &response_type=${flowConfig.responseType}
  &scope=${flowConfig.scopes.join(' ')}
  &state=${flowConfig.state || 'xyz123'}
  &nonce=${flowConfig.nonce || 'abc456'}${flowConfig.enablePKCE ? `
  &code_challenge=${codeChallenge || 'YOUR_CODE_CHALLENGE'}
  &code_challenge_method=${flowConfig.codeChallengeMethod}` : ''}${flowConfig.maxAge > 0 ? `
  &max_age=${flowConfig.maxAge}` : ''}${flowConfig.prompt ? `
  &prompt=${flowConfig.prompt}` : ''}${flowConfig.loginHint ? `
  &login_hint=${flowConfig.loginHint}` : ''}${flowConfig.acrValues.length > 0 ? `
  &acr_values=${flowConfig.acrValues.join(' ')}` : ''}${Object.keys(flowConfig.customParams).length > 0 ? `
  ${Object.entries(flowConfig.customParams).map(([k, v]) => `&${k}=${v}`).join('\n  ')}` : ''}`,
      execute: async () => {
        logger.flow('AuthorizationCodeFlow', 'Authorization code step executing', { config: !!config });
        if (!config) {
          logger.error('AuthorizationCodeFlow', 'Configuration required');
          setError('Configuration required. Please configure your PingOne settings first.');
        }

        // Construct authorization endpoint if not available
        const authEndpoint = config.pingone.authEndpoint;
        
        logger.config('AuthorizationCodeFlow', 'Using authorization endpoint', { authEndpoint });
        
        // Generate PKCE codes if needed
        let currentCodeChallenge = codeChallenge;
        if (flowConfig.enablePKCE && !currentCodeChallenge) {
          console.log('🔑 [AuthCodeFlow] Step 1: Generating PKCE codes synchronously...');
          const pkceCodes = await generatePKCECodes();
          currentCodeChallenge = pkceCodes.challenge;
          console.log('🔑 [AuthCodeFlow] Step 1: PKCE codes generated:', { 
            challenge: currentCodeChallenge?.substring(0, 20) + '...',
            method: flowConfig.codeChallengeMethod 
          });
        } else if (flowConfig.enablePKCE && currentCodeChallenge) {
          console.log('🔑 [AuthCodeFlow] Step 1: Using existing PKCE challenge:', currentCodeChallenge.substring(0, 20) + '...');
        } else {
          console.log('🔑 [AuthCodeFlow] Step 1: PKCE disabled or not needed');
        }

        // Safety check: if PKCE is enabled but no challenge available, throw error
        if (flowConfig.enablePKCE && !currentCodeChallenge) {
          throw new Error('PKCE is enabled but code challenge could not be generated');
        }
        
        // Use the correct callback URL for this flow
        const callbackUrl = getCallbackUrlForFlow('authorization-code');
        const url = `${authEndpoint}?client_id=${config.pingone.clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=${flowConfig.responseType}&scope=${encodeURIComponent(flowConfig.scopes.join(' '))}&state=${flowConfig.state || 'xyz123'}&nonce=${flowConfig.nonce || 'abc456'}${flowConfig.enablePKCE ? `&code_challenge=${currentCodeChallenge}&code_challenge_method=${flowConfig.codeChallengeMethod}` : ''}${flowConfig.maxAge > 0 ? `&max_age=${flowConfig.maxAge}` : ''}${flowConfig.prompt ? `&prompt=${flowConfig.prompt}` : ''}${flowConfig.loginHint ? `&login_hint=${flowConfig.loginHint}` : ''}${flowConfig.acrValues.length > 0 ? `&acr_values=${encodeURIComponent(flowConfig.acrValues.join(' '))}` : ''}${Object.keys(flowConfig.customParams).length > 0 ? Object.entries(flowConfig.customParams).map(([k, v]) => `&${k}=${encodeURIComponent(v)}`).join('') : ''}`;

        console.log('🔗 [AuthCodeFlow] Step 1: Generated authorization URL:', url);
        console.log('🔗 [AuthCodeFlow] Step 1: URL contains code_challenge:', url.includes('code_challenge'));

        setAuthUrl(url);
        setStepResults(prev => ({ ...prev, 0: { url } }));
        setExecutedSteps(prev => new Set(prev).add(0));

        logger.success('AuthorizationCodeFlow', 'Authorization URL generated', { url });
      }
    },
    {
      title: 'User is Redirected to Authorization Server',
      description: 'The user is redirected to the authorization server where they authenticate and authorize the client.',
      code: `// User clicks the authorization URL and is redirected to PingOne
window.location.href = authUrl;

// PingOne handles:
// - User authentication
// - Consent for requested scopes
// - Redirect back to client with authorization code`,
      execute: async () => {
        try {
          // Generate the authorization URL directly instead of relying on step 1
          const flowConfig = getDefaultConfig('authorization-code');
          const authEndpoint = config.pingone.authEndpoint;
          
          if (!authEndpoint) {
            setError('Authorization endpoint not configured. Please check your PingOne configuration.');
          }
          
          // Generate PKCE codes if needed
          let currentCodeChallenge = codeChallenge;
          if (flowConfig.enablePKCE && !currentCodeChallenge) {
            console.log('🔑 [AuthCodeFlow] Step 2: Generating PKCE codes synchronously...');
            const pkceCodes = await generatePKCECodes();
            currentCodeChallenge = pkceCodes.challenge;
            console.log('🔑 [AuthCodeFlow] Step 2: PKCE codes generated:', { 
              challenge: currentCodeChallenge?.substring(0, 20) + '...',
              method: flowConfig.codeChallengeMethod 
            });
          } else if (flowConfig.enablePKCE && currentCodeChallenge) {
            console.log('🔑 [AuthCodeFlow] Step 2: Using existing PKCE challenge:', currentCodeChallenge.substring(0, 20) + '...');
          } else {
            console.log('🔑 [AuthCodeFlow] Step 2: PKCE disabled or not needed');
          }

          // Safety check: if PKCE is enabled but no challenge available, throw error
          if (flowConfig.enablePKCE && !currentCodeChallenge) {
            throw new Error('PKCE is enabled but code challenge could not be generated');
          }
          
          // Use the correct callback URL for this flow
          const callbackUrl = getCallbackUrlForFlow('authorization-code');
          // Generate the URL with current flow configuration
          const url = `${authEndpoint}?client_id=${config.pingone.clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=${flowConfig.responseType}&scope=${encodeURIComponent(flowConfig.scopes.join(' '))}&state=${flowConfig.state || 'xyz123'}&nonce=${flowConfig.nonce || 'abc456'}${flowConfig.enablePKCE ? `&code_challenge=${currentCodeChallenge}&code_challenge_method=${flowConfig.codeChallengeMethod}` : ''}${flowConfig.maxAge > 0 ? `&max_age=${flowConfig.maxAge}` : ''}${flowConfig.prompt ? `&prompt=${flowConfig.prompt}` : ''}${flowConfig.loginHint ? `&login_hint=${flowConfig.loginHint}` : ''}${flowConfig.acrValues.length > 0 ? `&acr_values=${encodeURIComponent(flowConfig.acrValues.join(' '))}` : ''}${Object.keys(flowConfig.customParams).length > 0 ? Object.entries(flowConfig.customParams).map(([k, v]) => `&${k}=${encodeURIComponent(v)}`).join('') : ''}`;

          console.log('🔗 [AuthCodeFlow] Step 2: Generated authorization URL:', url);
          console.log('🔗 [AuthCodeFlow] Step 2: URL contains code_challenge:', url.includes('code_challenge'));

          logger.flow('AuthorizationCodeFlow', 'Preparing redirect modal for PingOne authentication', { url });
          console.log('✅ [AuthCodeFlow] Preparing redirect modal for PingOne authentication:', url);
          
          // Parse URL to extract parameters
          const urlObj = new URL(url);
          const params: Record<string, string> = {};
          urlObj.searchParams.forEach((value, key) => {
            params[key] = value;
          });
          
          // Set modal data and show modal
          console.log('🔓 [AuthCodeFlow] Opening redirect modal with URL:', url);
          setRedirectUrl(url);
          setRedirectParams(params);
          setShowRedirectModal(true);
          
          const result = { message: 'Redirect modal prepared', url: url };
          setStepResults(prev => ({ ...prev, 1: result }));
          setExecutedSteps(prev => new Set(prev).add(1));
          return result;
        } catch (error) {
          console.error('❌ [AuthCodeFlow] Error in step 2:', error);
          setError(`Error in step 2: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return;
        }
      }
    },
    {
      title: 'Authorization Server Redirects Back',
      description: 'After successful authentication, the authorization server redirects back to the client with an authorization code.',
      code: `GET ${getCallbackUrlForFlow('authorization-code')}?
  code=authorization-code-here
  &state=${flowConfig.state || 'xyz123'}`,
      execute: () => {
        try {
          // Simulate getting authorization code from URL or generate one
          const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search || '' : '');
          const codeFromUrl = searchParams.get('code');
          const code = codeFromUrl || ('auth-code-' + Math.random().toString(36).substr(2, 9));

          setAuthCode(code);
          const stepResult = {
            url: `${getCallbackUrlForFlow('authorization-code')}?code=${code}&state=${flowConfig.state || 'xyz123'}`,
            code: code
          };
          
          setStepResults(prev => ({
            ...prev,
            2: stepResult
          }));
          setExecutedSteps(prev => new Set(prev).add(2));

          console.log('✅ [AuthCodeFlow] Authorization code received:', code);
          console.log('🔍 [AuthCodeFlow] Step result set:', stepResult);
        } catch (error) {
          console.error('❌ [AuthCodeFlow] Error in step 2:', error);
          setError(`Error in step 2: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return;
        }
      }
    },
    {
      title: 'Client Exchanges Code for Tokens',
      description: 'The client sends the authorization code to the token endpoint to receive access and ID tokens.',
      code: `POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&client_id=${config?.pingone?.clientId || 'your-client-id'}
&client_secret=${config?.pingone?.clientSecret ? '••••••••' : 'your-client-secret'}
&code=${authCode || 'authorization-code-here'}
&redirect_uri=${getCallbackUrlForFlow('authorization-code')}${flowConfig.enablePKCE ? `
&code_verifier=${codeVerifier || 'YOUR_CODE_VERIFIER'}` : ''}`,
      execute: async () => {
        console.log('🔄 [AuthCodeFlow] Token exchange step executing', { config: !!config, authCode: !!authCode });
        if (!config || !authCode) {
          console.error('❌ [AuthCodeFlow] Missing configuration or authorization code', { config: !!config, authCode: !!authCode });
          setError('Missing configuration or authorization code');
          return;
        }

        try {
          // Make real API call via backend proxy
          const backendUrl = process.env.NODE_ENV === 'production' 
            ? 'https://oauth-playground.vercel.app' 
            : 'http://localhost:3001';
          
          const requestBody: Record<string, string> = {
            grant_type: 'authorization_code',
            client_id: String(config.pingone.clientId),
            client_secret: String(config.pingone.clientSecret || ''),
            code: authCode,
            redirect_uri: getCallbackUrlForFlow('authorization-code'),
            environment_id: config.pingone.environmentId
          };

          // Add PKCE code verifier if enabled
          if (flowConfig.enablePKCE && codeVerifier) {
            requestBody.code_verifier = codeVerifier;
          }

          console.log('🔄 [AuthCodeFlow] Attempting token exchange via backend proxy:', {
            backendUrl,
            clientId: config.pingone.clientId,
            code: authCode.substring(0, 10) + '...',
            redirectUri: getCallbackUrlForFlow('authorization-code')
          });

          const response = await fetch(`${backendUrl}/api/token-exchange`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
          }

          const tokenData = await response.json();
          setTokensReceived(tokenData);
          const result = { response: tokenData, status: response.status };
          setStepResults(prev => ({ ...prev, 3: result }));
          setExecutedSteps(prev => new Set(prev).add(3));

          console.log('✅ [AuthCodeFlow] Tokens received from API:', tokenData);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('❌ [AuthCodeFlow] Real API call failed:', errorMessage);
          setError(errorMessage);
        }
      }
    },
    {
      title: 'Client Receives Tokens',
      description: 'The authorization server validates the code and returns access token and optionally refresh token.',
      code: `{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "refresh-token-here"
}`,
      execute: () => {
        if (!tokensReceived) {
          setError('No tokens received from previous step');
        }

        const result = { tokens: tokensReceived };
        setStepResults(prev => ({ ...prev, 4: result }));
        setExecutedSteps(prev => new Set(prev).add(4));
        setDemoStatus('success');

        console.log('✅ [AuthCodeFlow] Tokens processed successfully');
      }
    },
    {
      title: 'Token Refresh Demonstration',
      description: 'Demonstrates how to use the refresh token to obtain new access tokens when the current one expires.',
      code: `// When access token expires, use refresh token to get new tokens
POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=your-refresh-token
&client_id=your-client-id
&client_secret=your-client-secret

// Response:
{
  "access_token": "new-access-token",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "new-refresh-token" // Optional
}`,
      execute: async () => {
        try {
          if (!tokensReceived?.refresh_token) {
            setError('No refresh token available for demonstration');
            return;
          }

          if (!config?.pingone?.tokenEndpoint) {
            setError('Token endpoint not configured');
            return;
          }

          logger.info('AuthorizationCodeFlow', 'Demonstrating token refresh');

          // Simulate token refresh request
          const refreshRequestBody = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: tokensReceived.refresh_token,
            client_id: config.pingone.clientId,
            client_secret: config.pingone.clientSecret
          });

          const refreshResponse = await fetch(config.pingone.tokenEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json'
            },
            body: refreshRequestBody.toString()
          });

          if (!refreshResponse.ok) {
            const errorText = await refreshResponse.text();
            throw new Error(`Refresh failed: ${refreshResponse.status} ${errorText}`);
          }

          const refreshTokenData = await refreshResponse.json();
          
          const result = { 
            refreshRequest: {
              grant_type: 'refresh_token',
              refresh_token: tokensReceived.refresh_token.substring(0, 20) + '...',
              client_id: config.pingone.clientId
            },
            refreshResponse: refreshTokenData
          };

          setStepResults(prev => ({ ...prev, 5: result }));
          setExecutedSteps(prev => new Set(prev).add(5));

          logger.info('AuthorizationCodeFlow', 'Token refresh demonstration completed', {
            newAccessToken: refreshTokenData.access_token ? 'received' : 'not received',
            newRefreshToken: refreshTokenData.refresh_token ? 'received' : 'not received'
          });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error('AuthorizationCodeFlow', 'Token refresh demonstration failed', { error: errorMessage });
          setError(`Token refresh failed: ${errorMessage}`);
        }
      }
    }
  ];


  const startAuthFlow = () => {
    setDemoStatus('loading');
    setCurrentStep(0);
    setError('');
    setTokensReceived(null);
    setStepResults({});
    setExecutedSteps(new Set());
    setStepsWithResults([...steps]); // Initialize with the steps array
    console.log('🚀 [AuthCodeFlow] Starting authorization code flow...');
  };



  const resetDemo = () => {
    setDemoStatus('idle');
    setCurrentStep(0);
    setTokensReceived(null);
    setError('');
    setStepResults({});
    setExecutedSteps(new Set());
    setStepsWithResults([]);
  };

  const handleStepResult = (stepIndex: number, result: unknown) => {
    console.log('🔄 [AuthCodeFlow] Step result received:', { stepIndex, result });
    setStepResults(prev => ({ ...prev, [stepIndex]: result }));
    setExecutedSteps(prev => new Set(prev).add(stepIndex));
    
    // Update the steps array with the result
    setStepsWithResults(prev => {
      const newSteps = [...prev];
      if (newSteps[stepIndex]) {
        newSteps[stepIndex] = { ...newSteps[stepIndex], result };
      }
      return newSteps;
    });
  };

  const handleRedirectModalClose = () => {
    console.log('🔒 [AuthCodeFlow] Closing redirect modal');
    setShowRedirectModal(false);
    setRedirectUrl('');
    setRedirectParams({});
  };

  const handleRedirectModalProceed = () => {
    logger.flow('AuthorizationCodeFlow', 'Proceeding with redirect to PingOne', { url: redirectUrl });
    
    // Store the return path for after callback
    const currentPath = window.location.pathname;
    // Ensure we use the correct route path regardless of current path
    const correctPath = currentPath.includes('/oidc/') ? '/flows-old/authorization-code' : currentPath;
    const returnPath = `${correctPath}?step=2`; // Return to step 2 (token exchange)
    sessionStorage.setItem('redirect_after_login', returnPath);
    
    // Store flow context in state parameter
    const stateParam = new URLSearchParams(redirectUrl.split('?')[1]?.split('#')[0] || '').get('state');
    if (stateParam) {
      // Encode flow context in the state parameter
      const flowContext = {
        flow: 'authorization-code',
        step: 2,
        returnPath: returnPath,
        timestamp: Date.now()
      };
      sessionStorage.setItem(`flow_context_${stateParam}`, JSON.stringify(flowContext));
    }
    
    console.log('🔄 [AuthCodeFlow] Stored return path:', returnPath);
    window.location.href = redirectUrl;
  };

  return (
    <Container>
      <PageTitle 
        title="Authorization Code Flow"
        subtitle="The most secure and widely used OAuth 2.0 flow for web applications. Perfect for server-side applications that can securely store client secrets."
      />

      <ConfigurationStatus 
        config={config} 
        onConfigure={() => setShowConfig(!showConfig)}
        flowType="authorization-code"
      />

      <ContextualHelp flowId="authorization-code" />

      <FlowOverview>
        <CardHeader>
          <h2>Flow Overview</h2>
        </CardHeader>
        <CardBody>
          <FlowDescription>
            <h2>What is the Authorization Code Flow?</h2>
            <p>
              The Authorization Code flow is the most secure OAuth 2.0 flow for applications that can
              securely store client secrets. It's designed for web applications with a backend server
              that can make secure API calls.
            </p>
            <p>
              <strong>How it works:</strong> Instead of returning tokens directly in the redirect,
              the authorization server returns a temporary authorization code. The client then
              exchanges this code for tokens by making a secure server-to-server request.
            </p>
            <p>
              <strong>PKCE Extension:</strong> For public clients (mobile apps, SPAs) that cannot securely store client secrets,
              the Authorization Code flow can be enhanced with PKCE (Proof Key for Code Exchange) to prevent authorization code
              interception attacks. PKCE uses dynamically generated code verifiers and challenges instead of static client secrets.
            </p>
          </FlowDescription>

          <SecurityHighlight>
              <FiKey size={20} />
            <div>
              <h3>Why It's Secure</h3>
              <p>
                The authorization code is short-lived and can only be used once.
                The actual token exchange happens server-side, keeping sensitive
                information away from the user's browser.
              </p>
            </div>
          </SecurityHighlight>
        </CardBody>
      </FlowOverview>

      <DemoSection>
        <CardHeader>
          <h2>Interactive Demo</h2>
        </CardHeader>
        <CardBody>
          <StepByStepFlow
            steps={stepsWithResults.length > 0 ? stepsWithResults : steps}
            onStart={startAuthFlow}
            onReset={resetDemo}
            status={demoStatus}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            onStepResult={handleStepResult}
            disabled={!config}
            title="Authorization Code Flow"
            configurationButton={
              <DemoButton
                className="secondary"
                onClick={() => setShowConfig(!showConfig)}
              >
                <FiSettings />
                {showConfig ? 'Hide' : 'Show'} Configuration
              </DemoButton>
            }
          />

          {/* Flow Configuration Panel */}
          {showConfig && (
            <>
              <FlowConfiguration
                config={flowConfig}
                onConfigChange={setFlowConfig}
                flowType="authorization-code"
              />
              
              {/* Configuration Validation */}
              {(() => {
                const validation = validatePingOneConfig(flowConfig);
                if (!validation.isValid) {
                  return (
                    <Card accent="danger">
                      <CardHeader>
                        <h4 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FiAlertCircle />
                          Configuration Issues
                        </h4>
                      </CardHeader>
                      <CardBody>
                        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#ef4444' }}>
                          {validation.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </CardBody>
                    </Card>
                  );
                }
                return null;
              })()}
            </>
          )}

          {/* Flow Credentials - Always Visible */}
          <FlowCredentials
            flowType="authorization-code"
            onCredentialsChange={(credentials) => {
              console.log('Flow credentials updated:', credentials);
            }}
          />

          {/* Callback URL Configuration */}
          <CallbackUrlDisplay flowType="authorization-code" />


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
              <p><em>In a real app, the user would be redirected to this URL</em></p>
            </div>
          )}

          {authCode && (
            <div>
              <h3>Authorization Code Received:</h3>
              <CodeBlock>{authCode}</CodeBlock>
              <p><em>This code would be exchanged for tokens server-side</em></p>
            </div>
          )}

          {tokensReceived && (
            <div style={{ 
              marginTop: '2rem', 
              padding: '1.5rem', 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: '0.75rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
            }}>
              <h3 style={{ 
                marginTop: '0', 
                marginBottom: '1.5rem', 
                color: '#1e293b', 
                fontSize: '1.5rem',
                fontWeight: '600',
                borderBottom: '2px solid #3b82f6',
                paddingBottom: '0.75rem'
              }}>
                🎉 Tokens Received Successfully!
              </h3>
              <TokenDisplayComponent tokens={tokensReceived} />
              <div style={{ 
                marginTop: '2rem', 
                display: 'flex', 
                gap: '1rem',
                justifyContent: 'center',
                paddingTop: '1rem',
                borderTop: '1px solid #e2e8f0'
              }}>
                <button
                  onClick={() => navigate(`/token-management`)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#2563eb';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                  }}
                >
                  <FiEye size={18} />
                  View Token Management
                </button>
              </div>
            </div>
          )}
        </CardBody>
      </DemoSection>

      <StepsContainer>
        <h3>Flow Steps</h3>
        {steps.map((step, index) => {
          const stepResult = stepResults[index];
          const isExecuted = executedSteps.has(index);
          
          // Debug logging for step 2 (authorization code step)
          if (index === 2) {
            console.log('🔍 [AuthCodeFlow] Rendering step 2:', {
              stepTitle: step.title,
              stepResult,
              isExecuted,
              allStepResults: stepResults
            });
          }

          return (
            <Step
              key={index}
              id={`step-${index}`}
              $active={currentStep === index && demoStatus === 'loading'}
              $completed={currentStep > index}
              $error={currentStep === index && demoStatus === 'error'}
              style={{
                backgroundColor: '#f9fafb',
                borderColor: '#e5e7eb',
                border: '2px solid #e5e7eb'
              }}
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

                {/* Show request code section always (this is the template/example) */}
                {step.code && (
                  <CodeBlock style={{ marginTop: '1rem' }}>
                    {typeof step.code === 'string' ? step.code : (step.code as React.ReactNode)}
                  </CodeBlock>
                )}

                {/* Show response/result only after step is executed */}
                {isExecuted && stepResult && (
                  <ResponseBox
                    $backgroundColor="#1f2937"
                    $borderColor="#374151"
                  >
                    <h4>Response:</h4>
                    {(stepResult as StepResult).url && (
                      <div>
                        <strong>URL:</strong><br />
                        <ColorCodedURL url={(stepResult as StepResult).url!} />
                      </div>
                    )}
                    {(stepResult as StepResult).code && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <strong>Authorization Code:</strong><br />
                        <pre>{(stepResult as StepResult).code}</pre>
                      </div>
                    )}
                    {(stepResult as StepResult).tokenData && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <strong>Token Response:</strong><br />
                        <JSONHighlighter data={JSON.parse(JSON.stringify((stepResult as StepResult).tokenData!))} />
                      </div>
                    )}
                    {(stepResult as StepResult).tokens && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <strong>Tokens:</strong>
                        <TokenDisplayComponent tokens={(stepResult as StepResult).tokens!} />
                      </div>
                    )}
                    {(stepResult as StepResult).message && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <strong>Status:</strong><br />
                        <pre>{(stepResult as StepResult).message}</pre>
                      </div>
                    )}
                  </ResponseBox>
                )}

                {/* Show execution status */}
                {isExecuted && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.5rem',
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '0.25rem',
                    color: '#ffffff',
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
                        console.log('🔄 [AuthorizationCodeFlow] Next Step button clicked', { 
                          currentIndex: index, 
                          nextStep: nextStepIndex, 
                          currentStepBefore: currentStep
                        });
                        setCurrentStep(nextStepIndex);
                        console.log('🔄 [AuthorizationCodeFlow] setCurrentStep called with:', nextStepIndex);
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

const AuthorizationCodeFlowBackup = AuthorizationCodeFlow;
export default AuthorizationCodeFlowBackup;
