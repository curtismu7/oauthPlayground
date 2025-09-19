/* eslint-disable */
import React, { useState} from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../../components/Card';
import PageTitle from '../../components/PageTitle';
import TokenDisplayComponent from '../../components/TokenDisplay';
import ConfigurationButton from '../../components/ConfigurationButton';
import { useAuth } from '../../contexts/NewAuthContext';
import { config } from '../../services/config';
import { getUserInfo, isTokenExpired } from '../../utils/oauth';
import { decodeJwt } from '../../utils/jwt';
import type { UserInfo as OIDCUserInfo } from '../../types/oauth';
import { StepByStepFlow, FlowStep } from '../../components/StepByStepFlow';
import { ColorCodedURL } from '../../components/ColorCodedURL';
import Typewriter from '../../components/Typewriter';
import { storeOAuthTokens } from '../../utils/tokenStorage';
import FlowCredentials from '../../components/FlowCredentials';

const Container = styled.div`;
  max-width: 1200 px;
  margin: 0 auto;
  padding: 1.5 rem;
`;

const Header = styled.div`;
  margin-bottom: 2 rem;

  h1 {
    font-size: 2.5 rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 0.5 rem;
    display: flex;
    align-items: center;
    gap: 0.75 rem;
  }

  p {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 1.1 rem;
    line-height: 1.6;
  }
`;

const FlowOverview = styled(Card)`;
  margin-bottom: 2 rem;
`;

const FlowDescription = styled.div`;
  margin-bottom: 2 rem;

  h2 {
    color: ${({ theme }) => theme.colors.gray900};
    font-size: 1.5 rem;
    margin-bottom: 1 rem;
  }

  p {
    color: ${({ theme }) => theme.colors.gray600};
    line-height: 1.6;
    margin-bottom: 1 rem;
  }
`;

const UseCaseHighlight = styled.div`;
  background-color: ${({ theme }) => theme.colors.success}10;
  border: 1 px solid ${({ theme }) => theme.colors.success}30;
  border-radius: 0.5 rem;
  padding: 1 rem;
  margin-bottom: 2 rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75 rem;

  svg {
    color: ${({ theme }) => theme.colors.success};
    flex-shink: 0;
    margin-top: 0.1 rem;
  }

  h3 {
    color: ${({ theme }) => theme.colors.success};
    margin: 0 0 0.5 rem 0;
    font-size: 1 rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.success};
    font-size: 0.9 rem;
  }
`;

const DemoSection = styled(Card)`;
  margin-bottom: 2 rem;
`;

  gap: 1 rem;
  align-items: center;
  margin-bottom: 1.5 rem;
  flex-wrap: wrap;
`;

  align-items: center;
  gap: 0.5 rem;
  padding: 0.75 rem 1.5 rem;
  border: none;
  border-radius: 0.375 rem;
  font-size: 0.875 rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2 s;
  text-decoration: none;

  ${({ variant }) =>
    variant === 'primary'
      ? `
        background-color: #3 b82 f6;
        color: white;
        &:hover:not(:disabled) {
          background-color: #2563 eb;
        }
        &:disabled {
          background-color: #9 ca3 af;
          cursor: not-allowed;
        }
      `
      : `
        background-color: #f3 f4 f6;
        color: #374151;
        &:hover:not(:disabled) {
          background-color: #e5 e7 eb;
        }
        &:disabled {
          background-color: #f3 f4 f6;
          color: #9 ca3 af;
          cursor: not-allowed;
        }
      `}
`;

  border-radius: 0.375 rem;
  font-size: 0.875 rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5 rem;

  &.idle {
    background-color: #f3 f4 f6;
    color: #6 b7280;
  }

  &.loading {
    background-color: #dbeafe;
    color: #1 e40 af;
  }

  &.success {
    background-color: #d1 fae5;
    color: #065 f46;
  }

  &.error {
    background-color: #fee2 e2;
    color: #991 b1 b;
  }
`;

const ErrorMessage = styled.div`;
  background-color: #fee2 e2;
  border: 1 px solid #fecaca;
  border-radius: 0.375 rem;
  padding: 1 rem;
  margin: 1 rem 0;
  color: #991 b1 b;
  display: flex;
  align-items: flex-start;
  gap: 0.75 rem;

  svg {
    flex-shink: 0;
    margin-top: 0.1 rem;
  }
`;

const ResponseBox = styled.div<{ $backgroundColor?: string; $borderColor?: string }>`
  margin: 1 rem 0;
  padding: 1 rem;
  border-radius: 0.5 rem;
  border: 1 px solid ${({ $borderColor }) => $borderColor || '#374151'};
  background-color: ${({ $backgroundColor }) => $backgroundColor || '#1 f2937'};
  font-family: monospace;
  font-size: 0.875 rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
  overflow: visible;
  max-width: 100%;
  color: #f9 fafb;

  h4 {
    margin: 0 0 0.5 rem 0;
    font-family: inherit;
    font-size: 1 rem;
    font-weight: 600;
    color: #f9 fafb;
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
    color: #f9 fafb;
  }
`;

const RequestResponseSection = styled.div`;
  margin: 2 rem 0;
  border: 1 px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.5 rem;
  overflow: hidden;
`;

const RequestSection = styled.div`;
  background-color: #1 f2937;
  border-bottom: 1 px solid #374151;
  padding: 1.5 rem;
  color: #f9 fafb;

  h3 {
    margin: 0 0 1 rem 0;
    color: #f9 fafb;
    font-size: 1.125 rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5 rem;
  }
`;

const ResponseSection = styled.div`;
  background-color: #1 f2937;
  padding: 1.5 rem;
  color: #f9 fafb;

  h3 {
    margin: 0 0 1 rem 0;
    color: #f9 fafb;
    font-size: 1.125 rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5 rem;
  }
`;

const CodeBlock = styled.pre`;
  background-color: ${({ theme }) => theme.colors.gray900};
  color: ${({ theme }) => theme.colors.gray100};
  padding: 1 rem;
  border-radius: 0.375 rem;
  overflow-x: auto;
  font-size: 0.875 rem;
  margin: 1 rem 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  border: 1 px solid ${({ theme }) => theme.colors.gray800};
  position: relative;
  white-space: pre-wrap;
`;

const CopyButton = styled.button`;
  position: absolute;
  top: 0.5 rem;
  right: 0.5 rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  border-radius: 0.25 rem;
  padding: 0.25 rem 0.5 rem;
  font-size: 0.75 rem;
  cursor: pointer;
  transition: all 0.2 s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const JsonResponse = styled.div`;
  background-color: white;
  border: 1 px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.375 rem;
  padding: 1.5 rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875 rem;
  color: ${({ theme }) => theme.colors.gray800};
  overflow-x: auto;
  max-height: 400 px;
  overflow-y: auto;
`;

const JsonKey = styled.span`;
  color: #059669;
  font-weight: 600;
`;

const JsonString = styled.span`;
  color: #dc2626;
`;

const JsonNumber = styled.span`;
  color: #7 c3 aed;
`;

const JsonBoolean = styled.span`;
  color: #ea580 c;
`;

const JsonNull = styled.span`;
  color: #6 b7280;
  font-style: italic;
`;



  border: 2 px solid #374151;
  border-radius: 0.375 rem;
  padding: 1 rem;
  margin: 1 rem 0;
  font-family: monospace;
  font-size: 0.875 rem;
  color: #ffffff;
  word-break: break-all;
  box-shadow: inset 0 2 px 4 px 0 rgba(0, 0, 0, 0.3);
`;

const UserInfoFlow: React.FC = () => {
  const { tokens, config, updateTokens } = useAuth();
  
  // Debug logging
  console.log('🔍 [UserInfoFlow] Config:', config);
  console.log('🔍 [UserInfoFlow] Tokens:', tokens);
  console.log('🔍 [UserInfoFlow] Tokens type:', typeof tokens);
  console.log('🔍 [UserInfoFlow] Tokens keys:', tokens ? Object.keys(tokens) : 'NO_TOKENS');
  console.log('🔍 [UserInfoFlow] localStorage pingone_config:', localStorage.getItem('pingone_config'));
  console.log('🔍 [UserInfoFlow] localStorage oauth_tokens:', localStorage.getItem('oauth_tokens'));
  console.log('🔍 [UserInfoFlow] localStorage access_token:', localStorage.getItem('access_token'));
  console.log('🔍 [UserInfoFlow] localStorage pingone_playground_tokens:', localStorage.getItem('pingone_playground_tokens'));
  console.log('🔍 [UserInfoFlow] All localStorage keys:', Object.keys(localStorage));
  console.log('🔍 [UserInfoFlow] Config check result:', {
    hasConfig: !!config,
    configKeys: config ? Object.keys(config) : 'NO_CONFIG',
    configDetails: config ? {
      clientId: config.pingone.clientId,
      environmentId: config.pingone.environmentId,
      userInfoEndpoint: config.pingone.userInfoEndpoint
    } : 'NO_CONFIG'
  });

  // Check if tokens exist in any form
  const hasTokens = tokens && tokens.access_token;
  console.log('🔍 [UserInfoFlow] Has tokens:', hasTokens);
  console.log('🔍 [UserInfoFlow] Token check:', {
    tokensExist: !!tokens,
    accessTokenExists: !!(tokens?.access_token),
    tokenExpired: tokens?.access_token ? isTokenExpired(tokens.access_token) : 'N/A'
  });

  // Enhanced token detection and loading system
  const [localTokens, setLocalTokens] = useState<OAuthTokens | null>(null);
  
  // Function to scan localStorage for tokens
  const scanForTokens = useCallback(() => {;
    console.log('🔍 [UserInfoFlow] Scanning localStorage for tokens...');
    
    const possibleTokenKeys = [
      'pingone_playground_tokens', // Official storage key
      'oauth_tokens',              // Alternative key
      'access_token',              // Direct token storage
      'tokens'                     // Generic tokens key;
    ];

    for (const key of possibleTokenKeys) {
      const storedTokens = localStorage.getItem(key);
      if (storedTokens) {
        try {
          let parsedTokens;
          if (key === 'access_token') {
            // Handle direct token storage
            parsedTokens = { access_token: storedTokens };
          } else {
            parsedTokens = JSON.parse(storedTokens);
          }

          if (parsedTokens.access_token) {
            console.log(`✅ [UserInfoFlow] Found tokens in localStorage key '${key}':`, parsedTokens);
            setLocalTokens(parsedTokens);
            
            // Also update the auth context if it doesn't have tokens
            if (!tokens?.access_token) {
              updateTokens(parsedTokens);
            }
            return parsedTokens;
          }
        } catch (_error) {
          console.warn(`🔍 [UserInfoFlow] Failed to parse stored tokens for key '${key}':`, _error);
        }
      }
    }
    
    console.log('ℹ️ [UserInfoFlow] No tokens found in localStorage');
    setLocalTokens(null);
    return null;
  }, [tokens, updateTokens]);

  // Load tokens on mount and when tokens change
  useEffect(() => {
    scanForTokens();
  }, [scanForTokens]);

  // Listen for storage changes (when tokens are added/removed from other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.includes('token') || e.key === 'pingone_playground_tokens') {;
        console.log('🔄 [UserInfoFlow] Storage changed, rescanning for tokens:', e.key);
        scanForTokens();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [scanForTokens]);

  // Function to manually refresh tokens
  const refreshTokens = useCallback(() => {;
    console.log('🔄 [UserInfoFlow] Manually refreshing tokens...');
    scanForTokens();
  }, [scanForTokens]);
  const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [userInfo, setUserInfo] = useState<OIDCUserInfo | null>(null);

  const [accessToken, setAccessToken] = useState('');
  const [requestDetails, setRequestDetails] = useState<{
    url: string;
    headers: Record<string, string>;
    method: string;
  } | null>(null);
  const [decodedToken, setDecodedToken] = useState<Record<string, unknown> | null>(null);

  // Track execution results for each step
  const [stepResults, setStepResults] = useState<Record<number, unknown>>({});
  const [executedSteps, setExecutedSteps] = useState<Set<number>>(new Set());
  const [stepsWithResults, setStepsWithResults] = useState<FlowStep[]>([]);

  // UserInfo authentication mode
  const [useAuthentication, setUseAuthentication] = useState(false);

  // Function to format JSON with color coding
  const formatJson = (obj: unknown, indent: number = 0): React.ReactNode[] => {;
    const spaces = '  '.repeat(indent);
    const elements: React.ReactNode[] = [];
    
    if (obj === null) {
      elements.push(<JsonNull>null</JsonNull>);
      return elements;
    }
    
    if (typeof obj === 'string') {
      elements.push(<JsonString>"{obj}"</JsonString>);
      return elements;
    }
    
    if (typeof obj === 'number') {
      elements.push(<JsonNumber>{obj}</JsonNumber>);
      return elements;
    }
    
    if (typeof obj === 'boolean') {
      elements.push(<JsonBoolean>{obj.toString()}</JsonBoolean>);
      return elements;
    }
    
    if (Array.isArray(obj)) {
      elements.push('[\n');
      obj.forEach((item, index) => {
        elements.push(spaces + '  ');
        elements.push(...formatJson(item, indent + 1));
        if (index < obj.length - 1) elements.push(',');
        elements.push('\n');
      });
      elements.push(spaces + ']');
      return elements;
    }
    
    if (typeof obj === 'object') {
      elements.push('{\n');
      const keys = Object.keys(obj);
      keys.forEach((key, index) => {
        elements.push(spaces + '  ');
        elements.push(<JsonKey>"{key}"</JsonKey>);
        elements.push(': ');
        elements.push(...formatJson(obj[key], indent + 1));
        if (index < keys.length - 1) elements.push(',');
        elements.push('\n');
      });
      elements.push(spaces + '}');
      return elements;
    }
    
    return elements;
  };

  // Function to copy text to clipboard
  const copyToClipboard = async (text: string) => {
    try {;
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (_error) {
      console.error('Failed to copy:', _error);
    }
  };

  const startUserInfoFlow = () => {;
    setDemoStatus('loading');
    setCurrentStep(0);
    setError(null);
    setUserInfo(null);
    setRequestDetails(null);
    setStepResults({});
    setExecutedSteps(new Set());
    setStepsWithResults([]);
    setStepsWithResults([...steps]); // Initialize with copy of steps
    console.log('🚀 [UserInfoFlow] Starting UserInfo flow...');
  };

  const resetDemo = () => {;
    setDemoStatus('idle');
    setCurrentStep(0);
    setUserInfo(null);
    setError(null);
    setAccessToken('');
    setRequestDetails(null);
    setStepResults({});
    setExecutedSteps(new Set());
  };

  const handleStepResult = (stepIndex: number, result: unknown) => {;
    setStepResults(prev => ({ ...prev, [stepIndex]: result }));
    setStepsWithResults(prev => {
      const newSteps = [...prev];
      if (newSteps[stepIndex]) {
        newSteps[stepIndex] = { ...newSteps[stepIndex], result };
      }
      return newSteps;
    });
  };

  const maskedToken = accessToken ? `${accessToken.slice(0, 16)}...${accessToken.slice(-8)}` : '';

  const steps: FlowStep[] = [
    ...(useAuthentication ? [{
      title: 'Obtain Access Token',
      description: 'First, obtain an access token through any OAuth flow with openid scope',
      code: `// Access token obtained from OAuth flow
const accessToken = 'eyJhbGciOiJSUzI1 NiIsInR5 cCI6 IkpXVCJ9...';

// This token contains:
// - User identity information
// - Granted scopes (including 'openid')
// - Expiration time
// - Token type (Bearer)`,
      execute: () => {
        // Try to get tokens from multiple sources
        const availableTokens = tokens?.access_token ? tokens : localTokens;
        
        if (!availableTokens?.access_token) {
          setError('No access token available. Complete an OAuth flow with openid scope first, or check if tokens are stored in localStorage.');
          return;
        }

        if (isTokenExpired(availableTokens.access_token)) {
          setError('Access token is expired. Please sign in again.');
          return;
        }

        setAccessToken(availableTokens.access_token);

        setStepResults(prev => ({
          ...prev,
          0: result
        }));
        setExecutedSteps(prev => new Set(prev).add(0));

        console.log('✅ [UserInfoFlow] Access token validated:', availableTokens.access_token.substring(0, 20) + '...');
        return result;
      }
    }] : []),
    {
      title: 'Prepare UserInfo Request',
      description: useAuthentication ? 'Prepare GET request to UserInfo endpoint with Bearer token' : 'Prepare GET request to UserInfo endpoint (no authentication)',
      code: useAuthentication ? `// UserInfo endpoint URL (from OpenID Connect discovery)
const userInfoUrl = '${config?.userInfoEndpoint || 'https://auth.pingone.com/{envId}/as/userinfo'}';

// Prepare request headers with Bearer token
const headers = {
  'Authorization': 'Bearer ${maskedToken}',
  'Accept': 'application/json',
  'Content-Type': 'application/json';
};

// Optional: Include DPoP proof for enhanced security
// headers['DPoP'] = generateDPoPProof(userInfoUrl, 'GET', accessToken);` : `// UserInfo endpoint URL (from OpenID Connect discovery)
const userInfoUrl = '${config?.userInfoEndpoint || 'https://auth.pingone.com/{envId}/as/userinfo'}';

// Prepare request headers (no authentication)
const headers = {
  'Accept': 'application/json',
  'Content-Type': 'application/json';
};

// For unprotected UserInfo endpoints, no Authorization header needed`,
      execute: () => {
        if (!config?.pingone?.userInfoEndpoint) {
          setError('UserInfo endpoint is not configured. Check Configuration page.');
          return;
        }

        const userInfoUrl = config.pingone.userInfoEndpoint.replace('{envId}', config.pingone.environmentId);
        const headers: Record<string, string> = {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        };

        if (useAuthentication) {
          if (!accessToken) {
            setError('Access token not available. Please execute previous step first.');
            return;
          }
          headers['Authorization'] = `Bearer ${accessToken}`;
        }

        setRequestDetails({
          url: userInfoUrl,
          headers,
          method: 'GET'
        });

        setStepResults(prev => ({
          ...prev,
          [useAuthentication ? 1 : 0]: result
        }));
        setExecutedSteps(prev => new Set(prev).add(useAuthentication ? 1 : 0));

        console.log('✅ [UserInfoFlow] UserInfo request prepared:', { url: userInfoUrl, method: 'GET', authenticated: useAuthentication });
        return result;
      }
    },
    {
      title: 'Make UserInfo API Call',
      description: useAuthentication ? 'Send authenticated request to UserInfo endpoint' : 'Send request to UserInfo endpoint (no authentication)',
      code: useAuthentication ? `// Make authenticated GET request

// Handle response
if (!response.ok) {
  if (response.status === 401) {
    // Token expired or invalid
    throw new Error('Access token expired or invalid');
  }
  if (response.status === 403) {
    // Insufficient scope
    throw new Error('Access token does not have openid scope');
  }
  throw new Error('UserInfo request failed');
}

const userInfo = await response.json();` : `// Make unauthenticated GET request

// Handle response
if (!response.ok) {
  if (response.status === 401) {
    // Endpoint requires authentication
    throw new Error('Endpoint requires authentication. Try enabling authentication mode.');
  }
  if (response.status === 403) {
    // Access forbidden
    throw new Error('Access forbidden. Check endpoint permissions.');
  }
  throw new Error('UserInfo request failed');
}

const userInfo = await response.json();`,
      execute: async () => {
        if (!requestDetails?.url || (useAuthentication && !accessToken)) {
          setError('Request details not available. Please execute previous steps first.');
          return;
        }

        try {

          if (!response.ok) {
            if (useAuthentication && response.status === 401) {
              throw new Error('Access token expired or invalid');
            }
            if (useAuthentication && response.status === 403) {
              throw new Error('Access token does not have openid scope');
            }
            if (!useAuthentication && response.status === 401) {
              throw new Error('Endpoint requires authentication. Try enabling authentication mode.');
            }
            if (response.status === 403) {
              throw new Error('Access forbidden. Check endpoint permissions.');
            }
            throw new Error(`UserInfo request failed: ${response.status} ${response.statusText}`);
          }

          const userInfoData = await response.json();
          setUserInfo(userInfoData);

          const stepIndex = useAuthentication ? 2 : 1;

          setStepResults(prev => ({
            ...prev,
            [stepIndex]: result
          }));
          setExecutedSteps(prev => new Set(prev).add(stepIndex));

          console.log('✅ [UserInfoFlow] UserInfo API call successful:', userInfoData);
          return result;
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setError(`Failed to call UserInfo endpoint: ${errorMessage}`);
          console.error('❌ [UserInfoFlow] UserInfo API call failed:', _error);
        }
      }
    },
    {
      title: 'Process UserInfo Response',
      description: 'Handle and validate the user information returned',
      code: `// Validate response structure
if (!userInfo.sub) {
  throw new Error('Invalid UserInfo response: missing subject');
}

// Standard OpenID Connect claims
const user = {
  id: userInfo.sub,                    // Subject identifier
  name: userInfo.name,                 // Full name
  givenName: userInfo.given_name,      // First name
  familyName: userInfo.family_name,    // Last name
  email: userInfo.email,               // Email address
  emailVerified: userInfo.email_verified, // Email verification status
  picture: userInfo.picture,           // Profile picture URL
  locale: userInfo.locale,             // User locale
  updatedAt: userInfo.updated_at       // Last update timestamp;
};

// Store user information securely
// Avoid storing tokens; store minimal, non-sensitive user profile if needed
localStorage.setItem('user_profile', JSON.stringify({ id: user.id, name: user.name, email: user.email }));

// Use user information in your application
console.log('Welcome, ' + user.name + '!');`,
      execute: () => {
        if (!userInfo) {
          setError('No user information received. Please execute the API call first.');
          return;
        }

        // Validate UserInfo response
        if (!userInfo.sub) {
          setError('Invalid UserInfo response: missing subject claim');
          return;
        }

        setStepResults(prev => ({
          ...prev,
          3: result
        }));
        setExecutedSteps(prev => new Set(prev).add(3));
        setDemoStatus('success');

        console.log('✅ [UserInfoFlow] User information processed successfully:', userInfo);
        return result;
      }
    }
  ];

  return (
    <Container>
      <PageTitle 
        title="OpenID Connect UserInfo"
        subtitle="Learn how to retrieve user profile information using the UserInfo endpoint. This endpoint provides detailed user claims and supports both authenticated and unauthenticated requests."
      />

      <FlowCredentials
        flowType="userinfo"
        onCredentialsChange={(credentials) => {
          console.log('UserInfo flow credentials updated:', credentials);
        }}
      />

      <FlowOverview>
        <CardHeader>
          <h2>UserInfo Endpoint Overview</h2>
        </CardHeader>
        <CardBody>
          <FlowDescription>
            <h2>What is the UserInfo Endpoint?</h2>
            <p>
              The UserInfo endpoint in OpenID Connect allows clients to retrieve additional
              information about the authenticated user beyond what's included in the ID token.
              Unlike other OAuth endpoints, UserInfo can be either <strong>protected</strong> or
              <strong>unprotected</strong> depending on your implementation.
            </p>
            <p>
              <strong>How it works:</strong> You can make a GET request to the UserInfo endpoint
              to get detailed user profile information including name, email, profile picture,
              and other claims. This can be done with or without authentication depending on
              your server's configuration.
            </p>

            <div style={{ marginTop: '1 rem', padding: '1 rem', backgroundColor: '#f8 f9 fa', borderRadius: '6 px', border: '1 px solid #dee2 e6' }}>
              <h3 style={{ margin: '0 0 0.5 rem 0', fontSize: '1 rem', color: '#495057' }}>Authentication Mode</h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5 rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={useAuthentication}
                  onChange={(e) => setUseAuthentication(e.target.checked)}
                  style={{ margin: 0 }}
                />
                <span>Use Bearer token authentication</span>
              </label>
              <p style={{ margin: '0.5 rem 0 0 0', fontSize: '0.9 rem', color: '#6 c757 d' }}>
                {useAuthentication
                  ? 'Will include Bearer token in request (requires valid access token)'
                  : 'Will make unauthenticated request (endpoint must be unprotected)'
                }
              </p>
            </div>
          </FlowDescription>

          <UseCaseHighlight>
            <FiInfo size={20} />
            <div>
              <h3>Perfect For</h3>
              <p>
                Getting detailed user profiles, email addresses, profile pictures,
                and other user attributes beyond the basic ID token claims.
              </p>
            </div>
          </UseCaseHighlight>
        </CardBody>
      </FlowOverview>

      <DemoSection>
        <CardHeader>
          <h2>Interactive Demo</h2>
        </CardHeader>
        <CardBody>
          <StepByStepFlow
            steps={stepsWithResults.length > 0 ? stepsWithResults : steps}
            onStart={startUserInfoFlow}
            onReset={resetDemo}
            status={demoStatus}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            onStepResult={handleStepResult}
            disabled={!config || (useAuthentication && (!tokens?.access_token || isTokenExpired(tokens.access_token)))}
            title="UserInfo Flow"
            configurationButton={
              <ConfigurationButton flowType="userinfo" />
            }
          />

          {!config && (
            <ErrorMessage>
              <FiAlertCircle />
              <strong>Configuration Required:</strong> Please configure your PingOne settings
              in the Configuration page before running this demo.
              <br />
              <button 
                onClick={() => {
                  console.log('🔄 [UserInfoFlow] Manual refresh button clicked');
                  window.location.reload();
                }}
                style={{
                  marginTop: '10 px',
                  padding: '8 px 16 px',
                  backgroundColor: '#007 bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4 px',
                  cursor: 'pointer'
                }}
              >
                🔄 Refresh Page
              </button>
            </ErrorMessage>
          )}

          {config && useAuthentication && (!tokens?.access_token || (tokens?.access_token && isTokenExpired(tokens.access_token))) && (
            <>
              {/* Enhanced Token Detection Debug Panel */}
              <div style={{ 
                marginBottom: '1 rem', 
                padding: '1 rem', 
                backgroundColor: '#f0 f9 ff', 
                border: '2 px solid #0 ea5 e9', 
                borderRadius: '0.5 rem',
                fontSize: '0.875 rem'
              }}>
                <h4 style={{ margin: '0 0 0.5 rem 0', color: '#0 c4 a6 e' }}>🔍 Enhanced Token Detection System</h4>
                <div style={{ color: '#0 c4 a6 e', lineHeight: '1.6' }}>
                  <strong>🔐 Auth Context Tokens:</strong> {tokens ? '✅ Available' : '❌ Not available'}<br />
                  <strong>💾 Local Storage Tokens:</strong> {localTokens ? '✅ Available' : '❌ Not available'}<br />
                  <strong>🎯 Active Access Token:</strong> {accessToken ? `${accessToken.substring(0, 20)}...` : 'None'}<br />
                  <strong>📍 Token Source:</strong> {tokens?.access_token ? 'Auth Context' : localTokens?.access_token ? 'Local Storage' : 'None'}<br />
                  <strong>⚙️ Config:</strong> {config ? '✅ Loaded' : '❌ Not loaded'}<br />
                  <strong>⏰ Token expired:</strong> {accessToken ? (isTokenExpired(accessToken) ? '❌ Yes' : '✅ No') : 'N/A'}<br />
                  <strong>🔑 Scope:</strong> {(tokens?.scope || localTokens?.scope) || 'None'}<br />
                  <strong>🗂️ localStorage keys:</strong> {Object.keys(localStorage).filter(key => key.includes('token') || key.includes('pingone')).join(', ') || 'None'}
                </div>
              </div>
              <ErrorMessage>
                <FiAlertCircle />
                <strong>Sign-in Required:</strong> Authentication mode is enabled. Complete an OAuth login with openid scope to obtain a valid access token before calling UserInfo.
                <br /><br />
                <strong>To get tokens:</strong>
                <ul style={{ marginTop: '10 px', paddingLeft: '20 px' }}>
                  <li>Go to any OAuth flow page (e.g., Authorization Code Flow)</li>
                  <li>Complete the OAuth flow to get tokens</li>
                  <li>Return here to use the UserInfo endpoint</li>
                </ul>
                <br />
                <div style={{ display: 'flex', gap: '10 px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => window.location.href = '/flows/authorization-code'}
                    style={{
                      padding: '8 px 16 px',
                      backgroundColor: '#28 a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4 px',
                      cursor: 'pointer',
                      fontSize: '14 px'
                    }}
                  >
                    🔐 Go to Authorization Code Flow
                  </button>
                  <button
                    onClick={() => window.location.href = '/flows/implicit'}
                    style={{
                      padding: '8 px 16 px',
                      backgroundColor: '#17 a2 b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4 px',
                      cursor: 'pointer',
                      fontSize: '14 px'
                    }}
                  >
                    🎯 Go to Implicit Flow
                  </button>
                  <button
                    onClick={() => {
                      console.log('🔍 [UserInfoFlow] Debug info:');
                      console.log('Config:', config);
                      console.log('Tokens:', tokens);
                      console.log('Token expired check:', tokens?.access_token ? isTokenExpired(tokens.access_token) : 'No token');
                      alert('Check browser console for debug information');
                    }}
                    style={{
                      padding: '8 px 16 px',
                      backgroundColor: '#6 c757 d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4 px',
                      cursor: 'pointer',
                      fontSize: '14 px'
                    }}
                  >
                    🔍 Debug Info
                  </button>
                  <button
                    onClick={refreshTokens}
                    style={{
                      padding: '8 px 16 px',
                      backgroundColor: '#ffc107',
                      color: '#212529',
                      border: 'none',
                      borderRadius: '4 px',
                      cursor: 'pointer',
                      fontSize: '14 px'
                    }}
                  >
                    🔄 Refresh Token Detection
                  </button>
                  <button
                    onClick={() => {
                      // Force refresh the page to reload auth context
                      console.log('🔄 [UserInfoFlow] Force refreshing page to reload auth context...');
                      window.location.reload();
                    }}
                    style={{
                      padding: '8 px 16 px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4 px',
                      cursor: 'pointer',
                      fontSize: '14 px'
                    }}
                  >
                    🔄 Force Refresh Page
                  </button>
                </div>
              </ErrorMessage>
            </>
          )}

          {error && (
            <ErrorMessage>
              <FiAlertCircle />
              <strong>Error:</strong> {error}
            </ErrorMessage>
          )}

          {accessToken && (
            <div>
              <h3>Access Token:</h3>
              <TokenDisplay>
                <strong>Bearer Token (masked):</strong><br />
                {maskedToken}
              </TokenDisplay>
            </div>
          )}

          {/* Request/Response Section */}
          {(requestDetails || userInfo) && (
            <RequestResponseSection>
              {requestDetails && (
                <RequestSection>
                  <h3>
                    <FiSend />
                    Request Details
                  </h3>
                  <CodeBlock>
                    <CopyButton onClick={() => copyToClipboard(JSON.stringify(requestDetails, null, 2))}>
                      Copy
                    </CopyButton>
                    <strong>URL:</strong> {requestDetails.url}
                    <br />
                    <strong>Method:</strong> {requestDetails.method}
                    <br />
                    <strong>Headers:</strong>
                    <br />
                    {Object.entries(requestDetails.headers).map(([key, value]) => (
                      <div key={key} style={{ marginLeft: '1 rem' }}>
                        {key}: {key === 'Authorization' ? 'Bearer [REDACTED]' : value}
                      </div>
                    ))}
                  </CodeBlock>
                </RequestSection>
              )}

              {userInfo && (
                <ResponseSection>
                  <h3>
                    <FiDownload />
                    Response Data
                  </h3>
                  <JsonResponse>
                    {formatJson(userInfo)}
                  </JsonResponse>
                  
                  <div style={{ marginTop: '1 rem', fontSize: '0.9 rem', color: '#6 b7280' }}>
                    <strong>Standard Claims:</strong><br />
                    • <strong>sub:</strong> Subject identifier ({userInfo?.sub || '—'})<br />
                    • <strong>name:</strong> Full name ({userInfo?.name || '—'})<br />
                    • <strong>email:</strong> Email address ({userInfo?.email || '—'})<br />
                    • <strong>email_verified:</strong> Email verification status ({userInfo?.email_verified ? 'Verified' : 'Unverified'})<br />
                    • <strong>updated_at:</strong> Last update ({userInfo?.updated_at ? new Date((userInfo.updated_at as number) * 1000).toLocaleString() : '—'})
                  </div>
                </ResponseSection>
              )}
            </RequestResponseSection>
          )}


        </CardBody>
      </DemoSection>
    </Container>
  );
};

export default UserInfoFlow;
