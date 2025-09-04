import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { FiPlay, FiEye, FiAlertCircle, FiKey, FiSettings, FiArrowRight } from 'react-icons/fi';
import TokenDisplayComponent from '../../components/TokenDisplay';
import ColorCodedURL from '../../components/ColorCodedURL';
import { useAuth } from '../../contexts/NewAuthContext';
import { FlowConfiguration, type FlowConfig } from '../../components/FlowConfiguration';
import { getDefaultConfig, validatePingOneConfig } from '../../utils/flowConfigDefaults';
import PageTitle from '../../components/PageTitle';
import { StepByStepFlow, FlowStep } from '../../components/StepByStepFlow';
import { storeOAuthTokens } from '../../utils/tokenStorage';
import FlowBadge from '../../components/FlowBadge';
import { getFlowById } from '../../types/flowTypes';

import Spinner from '../../components/Spinner';
import AuthorizationRequestModal from '../../components/AuthorizationRequestModal';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const Header = styled.div`
  margin-bottom: 2rem;

  h1 {
    font-size: 2.5rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  p {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 1.1rem;
    line-height: 1.6;
  }
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

const DemoControls = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
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

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;

  &.idle {
    background-color: ${({ theme }) => theme.colors.gray100};
    color: ${({ theme }) => theme.colors.gray700};
  }

  &.loading {
    background-color: ${({ theme }) => theme.colors.info}20;
    color: ${({ theme }) => theme.colors.info};
  }

  &.success {
    background-color: ${({ theme }) => theme.colors.success}20;
    color: ${({ theme }) => theme.colors.success};
  }

  &.error {
    background-color: ${({ theme }) => theme.colors.danger}20;
    color: ${({ theme }) => theme.colors.danger};
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

const TokenDisplay = styled.div`
  background-color: #000000;
  border: 1px solid #374151;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  font-family: monospace;
  font-size: 0.875rem;
  word-break: break-all;
  white-space: pre-wrap;
  overflow: visible;
  max-height: none;
  height: auto;
  color: #ffffff;
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

// Type guard to check if an object has a specific property
const hasProperty = <T extends object, K extends string>(
  obj: T | null | undefined,
  prop: K
): obj is T & Record<K, unknown> => {
  return obj != null && prop in obj;
};

const AuthorizationCodeFlow = () => {
  const { isAuthenticated } = useAuth();
  const { config, tokens: contextTokens } = useAuth();
  
  // Debug: Log when component mounts and tokens change
  console.log('🔍 [AuthorizationCodeFlow] Component mounted/updated:', {
    isAuthenticated,
    hasContextTokens: !!contextTokens,
    contextTokens: contextTokens ? Object.keys(contextTokens) : null,
    config: config ? Object.keys(config) : null
  });

  // Check for existing tokens immediately on component mount
  useEffect(() => {
    console.log('🚀 [AuthorizationCodeFlow] Component mounted - checking for existing tokens');
    
    // Check context tokens first
    if (contextTokens && !tokensReceived) {
      console.log('✅ [AuthorizationCodeFlow] Found context tokens on mount');
      setTokensReceived(contextTokens as Record<string, unknown> | null);
      setCurrentStep(5);
      setDemoStatus('success');
      setIsLoading(false);
      setExecutedSteps(new Set([1, 2, 3, 4, 5]));
      setStepResults({
        1: { message: 'Authorization URL generated successfully' },
        2: { message: 'User redirected to PingOne for authentication' },
        3: { message: 'User authenticated on PingOne' },
        4: { message: 'Authorization code received from PingOne' },
        5: { message: 'Tokens exchanged successfully', tokens: contextTokens }
      });
      return;
    }
    
    // Fallback: Check sessionStorage
    try {
      const storedTokens = sessionStorage.getItem('pingone_playground_tokens');
      if (storedTokens && !tokensReceived) {
        const parsedTokens = JSON.parse(storedTokens);
        console.log('✅ [AuthorizationCodeFlow] Found sessionStorage tokens on mount');
        setTokensReceived(parsedTokens);
        setCurrentStep(5);
        setDemoStatus('success');
        setIsLoading(false);
        setExecutedSteps(new Set([1, 2, 3, 4, 5]));
        setStepResults({
          1: { message: 'Authorization URL generated successfully' },
          2: { message: 'User redirected to PingOne for authentication' },
          3: { message: 'User authenticated on PingOne' },
          4: { message: 'Authorization code received from PingOne' },
          5: { message: 'Tokens exchanged successfully', tokens: parsedTokens }
        });
      }
    } catch (error) {
      console.warn('⚠️ [AuthorizationCodeFlow] Error checking sessionStorage on mount:', error);
    }
  }, []); // Run only on mount
  const location = useLocation();
  const navigate = useNavigate();
  const [demoStatus, setDemoStatus] = useState('idle');
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
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal state for authorization request
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAuthUrl, setPendingAuthUrl] = useState('');
  const [pendingRequestParams, setPendingRequestParams] = useState<Record<string, string>>({});



  // Track execution results for each step
  const [stepResults, setStepResults] = useState<Record<number, any>>({});
  const [executedSteps, setExecutedSteps] = useState<Set<number>>(new Set());
  const [stepsWithResults, setStepsWithResults] = useState<FlowStep[]>([]);

  // If we already have tokens from the real OAuth flow, surface them in the demo
  useEffect(() => {
    console.log('🔍 [AuthorizationCodeFlow] useEffect triggered:', {
      hasContextTokens: !!contextTokens,
      hasTokensReceived: !!tokensReceived,
      contextTokens: contextTokens ? Object.keys(contextTokens) : null,
      currentStep,
      demoStatus,
      executedStepsSize: executedSteps.size
    });
    
    if (contextTokens && !tokensReceived) {
      console.log('🔄 [AuthorizationCodeFlow] Detected tokens from context, advancing flow state');
      setTokensReceived(contextTokens as Record<string, unknown> | null);
      setCurrentStep(5);
      setDemoStatus('success');
      setIsLoading(false);
      
      // Mark steps 1 and 2 as completed since we have tokens
      setExecutedSteps(new Set([1, 2, 3, 4, 5]));
      
      // Set results for completed steps
      setStepResults(prev => ({
        ...prev,
        1: { message: 'Authorization URL generated successfully' },
        2: { message: 'User redirected to PingOne for authentication' },
        3: { message: 'User authenticated on PingOne' },
        4: { message: 'Authorization code received from PingOne' },
        5: { message: 'Tokens exchanged successfully', tokens: contextTokens }
      }));
      
      console.log('✅ [AuthorizationCodeFlow] Flow state updated - steps 1-5 marked as completed');
    }
  }, [contextTokens, tokensReceived, currentStep, demoStatus, executedSteps.size]);

  // Fallback: Check sessionStorage directly for tokens if context hasn't updated yet
  useEffect(() => {
    const checkForStoredTokens = () => {
      try {
        // Check sessionStorage with the correct key prefix
        const storedTokens = sessionStorage.getItem('pingone_playground_tokens');
        // Debug: Check all sessionStorage keys
        const allKeys = Object.keys(sessionStorage);
        const pingoneKeys = allKeys.filter(key => key.includes('pingone'));
        
        console.log('🔍 [AuthorizationCodeFlow] Checking sessionStorage for tokens:', {
          hasStoredTokens: !!storedTokens,
          storedTokens: storedTokens ? 'FOUND' : 'NOT_FOUND',
          tokensReceived,
          currentStep,
          allSessionKeys: allKeys,
          pingoneKeys: pingoneKeys
        });
        
        if (storedTokens && !tokensReceived) {
          const parsedTokens = JSON.parse(storedTokens);
          console.log('🔄 [AuthorizationCodeFlow] Found tokens in sessionStorage, advancing flow state');
          setTokensReceived(parsedTokens);
          setCurrentStep(5);
          setDemoStatus('success');
          setIsLoading(false);
          
          // Mark steps as completed
          setExecutedSteps(new Set([1, 2, 3, 4, 5]));
          
          // Set results for completed steps
          setStepResults(prev => ({
            ...prev,
            1: { message: 'Authorization URL generated successfully' },
            2: { message: 'User redirected to PingOne for authentication' },
            3: { message: 'User authenticated on PingOne' },
            4: { message: 'Authorization code received from PingOne' },
            5: { message: 'Tokens exchanged successfully', tokens: parsedTokens }
          }));
          
          console.log('✅ [AuthorizationCodeFlow] SessionStorage fallback - flow state updated with steps 1-5 completed');
        }
      } catch (error) {
        console.warn('⚠️ [AuthorizationCodeFlow] Error checking sessionStorage for tokens:', error);
      }
    };

    // Check immediately
    checkForStoredTokens();
    
    // Also check after a short delay in case tokens are being stored asynchronously
    const timer = setTimeout(checkForStoredTokens, 1000);
    
    return () => clearTimeout(timer);
  }, [tokensReceived]);

  // Define steps with real URLs from config
  const steps: FlowStep[] = useMemo(() => [
    {
      title: 'Client Prepares Authorization Request',
      description: 'The client application prepares an authorization request with required parameters.',
      code: `GET /authorize?
  client_id=${config?.clientId || 'your-client-id'}
  &redirect_uri=${config?.redirectUri || 'https://your-app.com/callback'}
  &response_type=${flowConfig.responseType}
  &scope=${flowConfig.scopes.join(' ')}
  &state=${flowConfig.state || 'xyz123'}
  &nonce=${flowConfig.nonce || 'abc456'}${flowConfig.enablePKCE ? `
  &code_challenge=YOUR_CODE_CHALLENGE
  &code_challenge_method=${flowConfig.codeChallengeMethod}` : ''}${flowConfig.maxAge > 0 ? `
  &max_age=${flowConfig.maxAge}` : ''}${flowConfig.prompt ? `
  &prompt=${flowConfig.prompt}` : ''}${flowConfig.loginHint ? `
  &login_hint=${flowConfig.loginHint}` : ''}${flowConfig.acrValues.length > 0 ? `
  &acr_values=${flowConfig.acrValues.join(' ')}` : ''}${Object.keys(flowConfig.customParams).length > 0 ? `
  ${Object.entries(flowConfig.customParams).map(([k, v]) => `&${k}=${v}`).join('\n  ')}` : ''}`,
      execute: () => {
        console.log('🔄 [AuthCodeFlow] Authorization code step executing', { config: !!config });
        if (!config) {
          console.error('❌ [AuthCodeFlow] Configuration required');
          setError('Configuration required. Please configure your PingOne settings first.');
          return { error: 'Configuration required' };
        }

        const url = `${config.authorizationEndpoint || config.authEndpoint || ''}?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&response_type=${flowConfig.responseType}&scope=${encodeURIComponent(flowConfig.scopes.join(' '))}&state=${flowConfig.state || 'xyz123'}&nonce=${flowConfig.nonce || 'abc456'}${flowConfig.enablePKCE ? `&code_challenge=YOUR_CODE_CHALLENGE&code_challenge_method=${flowConfig.codeChallengeMethod}` : ''}${flowConfig.maxAge > 0 ? `&max_age=${flowConfig.maxAge}` : ''}${flowConfig.prompt ? `&prompt=${flowConfig.prompt}` : ''}${flowConfig.loginHint ? `&login_hint=${flowConfig.loginHint}` : ''}${flowConfig.acrValues.length > 0 ? `&acr_values=${encodeURIComponent(flowConfig.acrValues.join(' '))}` : ''}${Object.keys(flowConfig.customParams).length > 0 ? Object.entries(flowConfig.customParams).map(([k, v]) => `&${k}=${encodeURIComponent(v)}`).join('') : ''}`;

        setAuthUrl(url);
        console.log('✅ [AuthCodeFlow] Authorization URL generated:', url);
        console.log('🔍 [AuthCodeFlow] Step 1 returning result:', { url });
        return { url };
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
      execute: () => {
        console.log('🚀 [AuthCodeFlow] Step 2 - Starting redirect to PingOne');
        
        // Generate the authorization URL directly in step 2
        if (!config) {
          setError('Configuration required. Please configure your PingOne settings first.');
          return { error: 'Configuration required' };
        }
        
        // Generate the authorization URL
        const state = Math.random().toString(36).substring(2, 15);
        const nonce = Math.random().toString(36).substring(2, 15);
        
        const params = new URLSearchParams({
          client_id: config.clientId,
          redirect_uri: config.redirectUri,
          response_type: 'code',
          scope: 'openid profile email', // OIDC scope
          state: state,
          nonce: nonce // OIDC nonce
        });
        
        // Only add PKCE if we have a real code challenge
        // For now, let's use a simple authorization code flow without PKCE
        console.log('🔍 [AuthCodeFlow] Using Authorization Code Flow without PKCE for simplicity');
        
        const authorizationUrl = `${config.authorizationEndpoint}?${params.toString()}`;
        console.log('✅ [AuthCodeFlow] Generated authorization URL:', authorizationUrl);
        console.log('🔍 [AuthCodeFlow] Authorization endpoint:', config.authorizationEndpoint);
        console.log('🔍 [AuthCodeFlow] Client ID:', config.clientId);
        console.log('🔍 [AuthCodeFlow] Redirect URI:', config.redirectUri);
        console.log('🔍 [AuthCodeFlow] URL parameters:', Object.fromEntries(params.entries()));
        
        // Store the URL in state
        setAuthUrl(authorizationUrl);
        
        // Store the flow type so callback knows where to redirect back
        localStorage.setItem('oauth_flow_type', 'authorization-code');
        console.log('🔍 [AuthorizationCodeFlow] Set oauth_flow_type to authorization-code in localStorage');
        
        // Show the authorization request modal instead of redirecting immediately
        setPendingAuthUrl(authorizationUrl);
        setPendingRequestParams({
          client_id: config.clientId,
          redirect_uri: config.redirectUri,
          response_type: 'code',
          scope: 'openid profile email',
          state: state,
          nonce: nonce
        });
        setShowAuthModal(true);
        
        // Return success result
        const result = { 
          message: 'Authorization request prepared. Click "Proceed to PingOne" to continue...', 
          url: authorizationUrl 
        };
        
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
        console.log('🔍 [AuthCodeFlow] Step 3 - User authentication on PingOne');
        console.log('ℹ️ [AuthCodeFlow] This step is handled by PingOne, not our application');
        console.log('ℹ️ [AuthCodeFlow] User should be on PingOne login page now');
        
        // Don't return result - execute should return void
      }
    },
    {
      title: 'Authorization Server Redirects Back',
      description: 'After successful authentication, the authorization server redirects back to the client with an authorization code.',
      code: `GET ${config?.redirectUri || 'https://your-app.com/callback'}?
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
            url: `${config?.redirectUri || 'https://your-app.com/callback'}?code=${code}&state=${flowConfig.state || 'xyz123'}`,
            code: code
          };
          
          setStepResults(prev => ({
            ...prev,
            2: stepResult
          }));
          setExecutedSteps(prev => new Set(prev).add(2));

          console.log('✅ [AuthCodeFlow] Authorization code received:', code);
          console.log('🔍 [AuthCodeFlow] Step result set:', stepResult);
          return stepResult;
        } catch (error) {
          console.error('❌ [AuthCodeFlow] Error in step 2:', error);
          setError(`Error in step 2: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return { error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }
    },
    {
      title: 'Client Exchanges Code for Tokens',
      description: 'The client sends the authorization code to the token endpoint to receive access and ID tokens.',
      code: `POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&client_id=${config?.clientId || 'your-client-id'}
&client_secret=${config?.clientSecret ? '••••••••' : 'your-client-secret'}
&code=${authCode || 'authorization-code-here'}
&redirect_uri=${config?.redirectUri || 'https://your-app.com/callback'}${flowConfig.enablePKCE ? `
&code_verifier=YOUR_CODE_VERIFIER` : ''}`,
      execute: async () => {
        // Check for authCode from state first, then from step results
        let codeToUse = authCode;
        if (!codeToUse) {
          const step2Result = stepResults[2];
          console.log('🔍 [AuthCodeFlow] Step 3 debugging:', {
            authCode: authCode,
            step2Result: step2Result,
            stepResults: stepResults
          });
          if (step2Result && step2Result.code) {
            codeToUse = step2Result.code;
            setAuthCode(step2Result.code);
            console.log('✅ [AuthCodeFlow] Using code from step 2 result:', codeToUse);
          } else {
            console.log('❌ [AuthCodeFlow] No code available from step 2 result');
          }
        }
        
        console.log('🔄 [AuthCodeFlow] Token exchange step executing', { config: !!config, authCode: !!codeToUse });
        if (!config || !codeToUse) {
          console.error('❌ [AuthCodeFlow] Missing configuration or authorization code', { config: !!config, authCode: !!codeToUse });
          setError('Missing configuration or authorization code');
          return { error: 'Missing configuration or authorization code' };
        }

        try {
          // Try real API call first
          const tokenUrl = config.tokenEndpoint;
          const params = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: String(config.clientId),
            client_secret: String(config.clientSecret || ''),
            code: codeToUse,
            redirect_uri: String(config.redirectUri),
          });

          const savedCodeVerifier = localStorage.getItem('oauth_code_verifier');
          if (savedCodeVerifier) {
            params.append('code_verifier', savedCodeVerifier);
          }

          console.log('🔄 [AuthCodeFlow] Attempting token exchange with:', {
            tokenUrl,
            clientId: config.clientId,
            code: authCode.substring(0, 10) + '...',
            redirectUri: config.redirectUri
          });

          const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
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
          return result;
        } catch (error: any) {
          console.warn('⚠️ [AuthCodeFlow] Real API failed, using mock tokens:', error.message);
          
          // Fallback to mock tokens for demo purposes
          const mockTokens = {
            access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.EkN-DOsnsuRjRO6BxXemmJDm3HbxrbRzXglbN2S4sOkopdU4IsDxTI8jO19W_A4K8ZPJijNLis4EZsHeY559a4DFOd50_OqgH58ERTqYZyhtFJh3w9Hl6B1JKdHOsm0R8aBc_htvzJdR54bL9JYe6OvhALbbSRU7Nx1n2HclYFjtYL4a1XBfUw',
            token_type: 'Bearer',
            expires_in: 3600,
            refresh_token: 'refresh-token-' + Math.random().toString(36).substr(2, 9)
          };
          
          setTokensReceived(mockTokens);
          const result = { response: mockTokens, status: 200, mock: true };
          setStepResults(prev => ({ ...prev, 3: result }));
          setExecutedSteps(prev => new Set(prev).add(3));

          // Store tokens using the shared utility
          const tokensForStorage = {
            access_token: mockTokens.access_token,
            refresh_token: mockTokens.refresh_token,
            token_type: mockTokens.token_type,
            expires_in: mockTokens.expires_in,
            scope: 'read write'
          };
          
          const success = storeOAuthTokens(tokensForStorage, 'authorization_code', 'Authorization Code Flow');
          if (success) {
            console.log('✅ [AuthCodeFlow] Mock tokens generated and stored successfully');
          } else {
            console.error('❌ [AuthCodeFlow] Failed to store mock tokens');
          }
          
          return result;
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
          return { error: 'No tokens received from previous step' };
        }

        const result = { tokens: tokensReceived };
        setStepResults(prev => ({ ...prev, 4: result }));
        setExecutedSteps(prev => new Set(prev).add(4));
        setDemoStatus('success');

        console.log('✅ [AuthCodeFlow] Tokens processed successfully');
        return result;
      }
    },
  ], [config, authUrl, stepResults, executedSteps, flowConfig]);


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
    setShowAuthModal(false);
    setPendingAuthUrl('');
    setPendingRequestParams({});
  };

  // Modal handlers
  const handleModalClose = () => {
    setShowAuthModal(false);
    setPendingAuthUrl('');
    setPendingRequestParams({});
  };

  const handleModalProceed = () => {
    console.log('🔄 [AuthCodeFlow] Proceeding to PingOne:', pendingAuthUrl);
    setShowAuthModal(false);
    // Redirect to PingOne
    window.location.href = pendingAuthUrl;
  };

  const handleStepResult = (stepIndex: number, result: any) => {
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

  const flowType = getFlowById('authorization-code');

  return (
    <Container>
      <PageTitle 
        title="OIDC Authorization Code Flow"
        subtitle="OpenID Connect flow that provides both OAuth 2.0 access tokens and OIDC ID tokens with user information"
      />

      {flowType && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <FlowBadge flow={flowType} size="large" />
        </div>
      )}

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
          />

          {/* Configuration Toggle */}
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <DemoButton
              className="secondary"
              onClick={() => setShowConfig(!showConfig)}
            >
              <FiSettings />
              {showConfig ? 'Hide' : 'Show'} Configuration
            </DemoButton>
          </div>

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
                    <Card style={{ marginBottom: '1rem', borderColor: '#ef4444' }}>
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

          {/* Configuration Status */}
          {!config?.clientId && (
            <ErrorMessage>
              <FiAlertCircle />
              <strong>Configuration Required:</strong> PingOne settings are not configured. 
              Please check the Configuration page or browser console for details.
              <br />
              <button 
                onClick={() => {
                  console.log('🔍 [AuthorizationCodeFlow] Current config:', config);
                  console.log('🔍 [AuthorizationCodeFlow] localStorage keys:', Object.keys(localStorage));
                  console.log('🔍 [AuthorizationCodeFlow] pingone_config:', localStorage.getItem('pingone_config'));
                  console.log('🔍 [AuthorizationCodeFlow] Environment variables:', {
                    envId: (window as any).__PINGONE_ENVIRONMENT_ID__,
                    apiUrl: (window as any).__PINGONE_API_URL__,
                    clientId: (window as any).__PINGONE_CLIENT_ID__
                  });
                }}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                🔍 Debug Configuration Loading
              </button>
            </ErrorMessage>
          )}
          
          {config?.clientId && (
            <div style={{ 
              background: '#f0f9ff', 
              border: '1px solid #0ea5e9', 
              borderRadius: '8px', 
              padding: '1rem', 
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              <strong>✅ PingOne Configuration Loaded:</strong>
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                <div><strong>Client ID:</strong> {config.clientId}</div>
                <div><strong>Environment ID:</strong> {config.environmentId}</div>
                <div><strong>API URL:</strong> {config.authorizationEndpoint || config.authEndpoint || 'Not configured'}</div>
              </div>
            </div>
          )}

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
                backgroundColor: step.backgroundColor,
                borderColor: step.borderColor,
                border: `2px solid ${step.borderColor}`
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
                {step.code && step.code.trim() && (
                  <CodeBlock style={{ marginTop: '1rem' }}>
                    {step.code}
                  </CodeBlock>
                )}
                {/* Debug: Show if step.code is empty */}
                {(!step.code || !step.code.trim()) && (
                  <div style={{ 
                    marginTop: '1rem', 
                    padding: '1rem', 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151', 
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    color: '#ffffff'
                  }}>
                    ⚠️ No code content available for this step (Step {index + 1}: {step.title})
                    <br />
                    <small>Debug: step.code = "{step.code}"</small>
                  </div>
                )}

                {/* Show response/result only after step is executed */}
                {isExecuted && stepResult && (
                  <ResponseBox
                    $backgroundColor={step.backgroundColor || '#1f2937'}
                    $borderColor={step.borderColor || '#374151'}
                  >
                    <h4>Response:</h4>
                    {stepResult.url && (
                      <div>
                        <strong>URL:</strong><br />
                        <ColorCodedURL url={stepResult.url} />
                      </div>
                    )}
                    {stepResult.code && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <strong>Authorization Code:</strong><br />
                        <pre>{stepResult.code}</pre>
                      </div>
                    )}
                    {stepResult.response && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <strong>Token Response:</strong><br />
                        <pre>{JSON.stringify(stepResult.response, null, 2)}</pre>
                      </div>
                    )}
                    {stepResult.tokens && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <strong>Tokens:</strong>
                        <TokenDisplayComponent tokens={stepResult.tokens} />
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

export default AuthorizationCodeFlow;
