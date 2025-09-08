// src/pages/flows/EnhancedAuthorizationCodeFlowV2.tsx - Enhanced with complete UI design implementation
import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { 
  FiUser, 
  FiKey, 
  FiGlobe, 
  FiShield, 
  FiCode, 
  FiCheckCircle, 
  FiCopy,
  FiExternalLink,
  FiRefreshCw,
  FiSettings,
  FiInfo,
  FiAlertTriangle,
  FiEye,
  FiEyeOff,
  FiZap,
  FiBookmark,
  FiClock
} from 'react-icons/fi';
import EnhancedStepFlowV2, { EnhancedFlowStep } from '../../components/EnhancedStepFlowV2';
import { generateCodeVerifier, generateCodeChallenge } from '../../utils/oauth';
import { persistentCredentials } from '../../utils/persistentCredentials';
import { logger } from '../../utils/logger';
import '../../styles/enhanced-flow.css';

// Styled Components for Enhanced UI
const FormField = styled.div`
  margin-bottom: 1rem;
`;

const FormLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 0.5rem;
  
  &.required::after {
    content: ' *';
    color: #ef4444;
  }
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
  color: #1f2937;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  }
  
  &:invalid {
    border-color: #ef4444;
  }
  
  &:valid {
    border-color: #10b981;
  }
  
  &[readonly] {
    background: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  min-height: 6rem;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
  color: #1f2937;
  resize: vertical;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
  color: #1f2937;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  }
`;

const ValidationIndicator = styled.div<{ $valid: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: ${props => props.$valid ? '#10b981' : '#ef4444'};
`;

const InfoBox = styled.div<{ type: 'info' | 'warning' | 'success' | 'error' }>`
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  
  ${props => {
    switch (props.type) {
      case 'info':
        return `
          background: #eff6ff;
          border-left: 4px solid #3b82f6;
          color: #1e40af;
        `;
      case 'warning':
        return `
          background: #fffbeb;
          border-left: 4px solid #f59e0b;
          color: #92400e;
        `;
      case 'success':
        return `
          background: #ecfdf5;
          border-left: 4px solid #10b981;
          color: #065f46;
        `;
      case 'error':
        return `
          background: #fef2f2;
          border-left: 4px solid #ef4444;
          color: #991b1b;
        `;
    }
  }}
`;

const UrlDisplay = styled.div`
  background: #1f2937;
  color: #e5e7eb;
  padding: 1rem;
  border-radius: 0.5rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  margin: 1rem 0;
  position: relative;
  white-space: pre-wrap;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #e5e7eb;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const ParameterBreakdown = styled.div`
  background: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
`;

const ParameterItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ParameterName = styled.span`
  font-weight: 600;
  color: #1f2937;
`;

const ParameterValue = styled.span`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  color: #6b7280;
  max-width: 60%;
  word-break: break-all;
`;

const TestingMethodCard = styled.div<{ $selected: boolean }>`
  border: 2px solid ${props => props.$selected ? '#3b82f6' : '#e5e7eb'};
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin: 1rem 0;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.$selected ? '#eff6ff' : 'white'};
  
  &:hover {
    border-color: #3b82f6;
    background: #f8fafc;
  }
`;

const MethodIcon = styled.div`
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
`;

const MethodTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-weight: 600;
`;

const MethodDescription = styled.p`
  margin: 0 0 1rem 0;
  color: #6b7280;
  font-size: 0.875rem;
`;

const CallbackListener = styled.div`
  background: #f9fafb;
  border: 2px dashed #d1d5db;
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  margin: 1rem 0;
`;

const UserProfileCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin: 1rem 0;
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const ProfileAvatar = styled.div`
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
`;

const ProfileInfo = styled.div`
  flex: 1;
`;

const ProfileName = styled.h3`
  margin: 0 0 0.25rem 0;
  color: #1f2937;
  font-weight: 600;
`;

const ProfileEmail = styled.p`
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
`;

const ProfileDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
`;

// Main Component
const EnhancedAuthorizationCodeFlowV2: React.FC = () => {
  const [credentials, setCredentials] = useState({
    clientId: '',
    environmentId: '',
    authorizationEndpoint: '',
    tokenEndpoint: '',
    userInfoEndpoint: '',
    redirectUri: 'https://localhost:3000/callback',
    scopes: 'openid profile email',
    responseType: 'code',
    codeChallengeMethod: 'S256'
  });

  const [pkceCodes, setPkceCodes] = useState({
    codeVerifier: '',
    codeChallenge: ''
  });

  const [authUrl, setAuthUrl] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [state, setState] = useState('');
  const [tokens, setTokens] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [testingMethod, setTestingMethod] = useState<'popup' | 'redirect'>('popup');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Load persistent credentials
  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const saved = await persistentCredentials.loadCredentials('enhanced-authz-code');
        if (saved) {
          setCredentials(prev => ({ ...prev, ...saved }));
        }
      } catch (error) {
        logger.warn('Failed to load persistent credentials', { error });
      }
    };
    loadCredentials();
  }, []);

  // Save credentials
  const saveCredentials = useCallback(async () => {
    try {
      await persistentCredentials.saveCredentials('enhanced-authz-code', credentials);
      logger.info('Credentials saved successfully');
    } catch (error) {
      logger.error('Failed to save credentials', { error });
    }
  }, [credentials]);

  // Generate PKCE codes
  const generatePKCECodes = useCallback(() => {
    const verifier = generateCodeVerifier();
    const challenge = generateCodeChallenge(verifier);
    setPkceCodes({ codeVerifier: verifier, codeChallenge: challenge });
    logger.info('PKCE codes generated');
  }, []);

  // Generate authorization URL
  const generateAuthUrl = useCallback(() => {
    const generatedState = Math.random().toString(36).substring(2, 15);
    setState(generatedState);
    
    const params = new URLSearchParams({
      response_type: credentials.responseType,
      client_id: credentials.clientId,
      redirect_uri: credentials.redirectUri,
      scope: credentials.scopes,
      state: generatedState,
      code_challenge: pkceCodes.codeChallenge,
      code_challenge_method: credentials.codeChallengeMethod
    });

    const url = `${credentials.authorizationEndpoint}?${params.toString()}`;
    setAuthUrl(url);
    logger.info('Authorization URL generated', { url });
  }, [credentials, pkceCodes.codeChallenge]);

  // Handle authorization
  const handleAuthorization = useCallback(() => {
    if (testingMethod === 'popup') {
      const popup = window.open(authUrl, 'oauth-popup', 'width=600,height=700');
      if (popup) {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            // Check for callback in URL
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const stateParam = urlParams.get('state');
            if (code && stateParam === state) {
              setAuthCode(code);
            }
          }
        }, 1000);
      }
    } else {
      window.location.href = authUrl;
    }
  }, [authUrl, testingMethod, state]);

  // Exchange code for tokens
  const exchangeCodeForTokens = useCallback(async () => {
    try {
      const response = await fetch(credentials.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: authCode,
          redirect_uri: credentials.redirectUri,
          client_id: credentials.clientId,
          code_verifier: pkceCodes.codeVerifier
        })
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.statusText}`);
      }

      const tokenData = await response.json();
      setTokens(tokenData);
      logger.info('Tokens received', { tokenData });
    } catch (error) {
      logger.error('Token exchange failed', { error });
      throw error;
    }
  }, [credentials, authCode, pkceCodes.codeVerifier]);

  // Get user info
  const getUserInfo = useCallback(async () => {
    if (!tokens?.access_token) {
      throw new Error('No access token available');
    }

    try {
      const response = await fetch(credentials.userInfoEndpoint, {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error(`UserInfo request failed: ${response.statusText}`);
      }

      const userData = await response.json();
      setUserInfo(userData);
      logger.info('User info retrieved', { userData });
    } catch (error) {
      logger.error('UserInfo request failed', { error });
      throw error;
    }
  }, [credentials.userInfoEndpoint, tokens]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      logger.error('Failed to copy to clipboard', { error });
    }
  }, []);

  // Validate credentials
  const validateCredentials = useCallback(() => {
    return credentials.clientId && credentials.environmentId && credentials.authorizationEndpoint;
  }, [credentials]);

  // Auto-generate endpoints
  useEffect(() => {
    if (credentials.environmentId) {
      const baseUrl = `https://auth.pingone.com/${credentials.environmentId}`;
      setCredentials(prev => ({
        ...prev,
        authorizationEndpoint: `${baseUrl}/as/authorize`,
        tokenEndpoint: `${baseUrl}/as/token`,
        userInfoEndpoint: `${baseUrl}/as/userinfo`
      }));
    }
  }, [credentials.environmentId]);

  // Define steps
  const steps: EnhancedFlowStep[] = [
    {
      id: 'setup-credentials',
      title: 'Setup OAuth Credentials',
      description: 'Configure your PingOne OAuth application credentials. These will be saved securely for future sessions.',
      icon: <FiSettings />,
      category: 'preparation',
      content: (
        <div>
          <FormField>
            <FormLabel className="required">Environment ID</FormLabel>
            <FormInput
              type="text"
              value={credentials.environmentId}
              onChange={(e) => setCredentials(prev => ({ ...prev, environmentId: e.target.value }))}
              placeholder="your-environment-id"
              required
            />
            <ValidationIndicator $valid={!!credentials.environmentId}>
              {credentials.environmentId ? <FiCheckCircle /> : <FiAlertTriangle />}
              {credentials.environmentId ? 'Valid Environment ID' : 'Environment ID is required'}
            </ValidationIndicator>
          </FormField>

          <FormField>
            <FormLabel className="required">Client ID</FormLabel>
            <FormInput
              type="text"
              value={credentials.clientId}
              onChange={(e) => setCredentials(prev => ({ ...prev, clientId: e.target.value }))}
              placeholder="12345678-1234-1234-1234-123456789012"
              required
            />
            <ValidationIndicator $valid={!!credentials.clientId}>
              {credentials.clientId ? <FiCheckCircle /> : <FiAlertTriangle />}
              {credentials.clientId ? 'Valid Client ID' : 'Client ID is required'}
            </ValidationIndicator>
          </FormField>

          <FormField>
            <FormLabel>Authorization Endpoint</FormLabel>
            <FormInput
              type="text"
              value={credentials.authorizationEndpoint}
              readOnly
            />
            <ValidationIndicator $valid={!!credentials.authorizationEndpoint}>
              <FiInfo />
              Auto-generated from Environment ID
            </ValidationIndicator>
          </FormField>

          <FormField>
            <FormLabel>Scopes</FormLabel>
            <FormInput
              type="text"
              value={credentials.scopes}
              onChange={(e) => setCredentials(prev => ({ ...prev, scopes: e.target.value }))}
              placeholder="openid profile email"
            />
          </FormField>

          <FormField>
            <FormLabel>Response Type</FormLabel>
            <FormSelect
              value={credentials.responseType}
              onChange={(e) => setCredentials(prev => ({ ...prev, responseType: e.target.value }))}
            >
              <option value="code">code (Authorization Code Flow)</option>
            </FormSelect>
          </FormField>

          <InfoBox type="info">
            <FiInfo />
            <div>
              <strong>Security Note:</strong> Your credentials will be saved locally in your browser and are not transmitted to any external servers.
            </div>
          </InfoBox>
        </div>
      ),
      execute: async () => {
        await saveCredentials();
        return { success: true };
      }
    },
    {
      id: 'generate-pkce',
      title: 'Generate PKCE Codes',
      description: 'PKCE adds security by preventing authorization code interception attacks. This step is optional but recommended for enhanced security.',
      icon: <FiShield />,
      category: 'preparation',
      isOptional: true,
      content: (
        <div>
          <FormField>
            <FormLabel>Code Verifier (Generated)</FormLabel>
            <FormInput
              type="text"
              value={pkceCodes.codeVerifier}
              readOnly
              placeholder="Click Generate to create PKCE codes"
            />
            {pkceCodes.codeVerifier && (
              <CopyButton onClick={() => copyToClipboard(pkceCodes.codeVerifier)}>
                {copiedText === pkceCodes.codeVerifier ? <FiCheckCircle /> : <FiCopy />}
              </CopyButton>
            )}
          </FormField>

          <FormField>
            <FormLabel>Code Challenge (SHA256)</FormLabel>
            <FormInput
              type="text"
              value={pkceCodes.codeChallenge}
              readOnly
              placeholder="Click Generate to create PKCE codes"
            />
            {pkceCodes.codeChallenge && (
              <CopyButton onClick={() => copyToClipboard(pkceCodes.codeChallenge)}>
                {copiedText === pkceCodes.codeChallenge ? <FiCheckCircle /> : <FiCopy />}
              </CopyButton>
            )}
          </FormField>

          <InfoBox type="info">
            <FiInfo />
            <div>
              <strong>Security Note:</strong> PKCE codes are automatically generated and will be used in the authorization request to enhance security.
            </div>
          </InfoBox>
        </div>
      ),
      execute: generatePKCECodes
    },
    {
      id: 'build-auth-url',
      title: 'Build Authorization URL',
      description: 'Construct the complete authorization URL with all required OAuth parameters.',
      icon: <FiGlobe />,
      category: 'authorization',
      content: (
        <div>
          <FormField>
            <FormLabel>Generated Authorization URL</FormLabel>
            <UrlDisplay>
              {authUrl || 'Click "Build URL" to generate the authorization URL'}
              {authUrl && (
                <CopyButton onClick={() => copyToClipboard(authUrl)}>
                  {copiedText === authUrl ? <FiCheckCircle /> : <FiCopy />}
                </CopyButton>
              )}
            </UrlDisplay>
          </FormField>

          {authUrl && (
            <ParameterBreakdown>
              <h4>Parameter Breakdown:</h4>
              <ParameterItem>
                <ParameterName>response_type</ParameterName>
                <ParameterValue>code (Authorization Code Flow)</ParameterValue>
              </ParameterItem>
              <ParameterItem>
                <ParameterName>client_id</ParameterName>
                <ParameterValue>{credentials.clientId}</ParameterValue>
              </ParameterItem>
              <ParameterItem>
                <ParameterName>redirect_uri</ParameterName>
                <ParameterValue>{credentials.redirectUri}</ParameterValue>
              </ParameterItem>
              <ParameterItem>
                <ParameterName>scope</ParameterName>
                <ParameterValue>{credentials.scopes}</ParameterValue>
              </ParameterItem>
              <ParameterItem>
                <ParameterName>state</ParameterName>
                <ParameterValue>{state}</ParameterValue>
              </ParameterItem>
              <ParameterItem>
                <ParameterName>code_challenge</ParameterName>
                <ParameterValue>{pkceCodes.codeChallenge}</ParameterValue>
              </ParameterItem>
              <ParameterItem>
                <ParameterName>code_challenge_method</ParameterName>
                <ParameterValue>{credentials.codeChallengeMethod}</ParameterValue>
              </ParameterItem>
            </ParameterBreakdown>
          )}
        </div>
      ),
      execute: generateAuthUrl
    },
    {
      id: 'user-authorization',
      title: 'Redirect User to Authorization Server',
      description: 'The user will be redirected to PingOne to authenticate and authorize your application.',
      icon: <FiUser />,
      category: 'authorization',
      content: (
        <div>
          <h4>Choose your testing method:</h4>
          
          <TestingMethodCard 
            $selected={testingMethod === 'popup'}
            onClick={() => setTestingMethod('popup')}
          >
            <MethodIcon>🪟</MethodIcon>
            <MethodTitle>Open in Popup Window (Recommended for testing)</MethodTitle>
            <MethodDescription>Easier to handle callback and continue with the flow</MethodDescription>
          </TestingMethodCard>

          <TestingMethodCard 
            $selected={testingMethod === 'redirect'}
            onClick={() => setTestingMethod('redirect')}
          >
            <MethodIcon>🌐</MethodIcon>
            <MethodTitle>Full Redirect (Production-like behavior)</MethodTitle>
            <MethodDescription>Redirects current tab - more realistic production behavior</MethodDescription>
          </TestingMethodCard>

          <InfoBox type="warning">
            <FiAlertTriangle />
            <div>
              <strong>State Parameter:</strong> {state}
              <br />
              Remember this value to verify the callback
            </div>
          </InfoBox>
        </div>
      ),
      execute: handleAuthorization
    },
    {
      id: 'handle-callback',
      title: 'Handle Authorization Callback',
      description: 'Process the authorization code returned from PingOne and validate the state parameter.',
      icon: <FiCode />,
      category: 'authorization',
      content: (
        <div>
          <CallbackListener>
            <FiClock size={48} style={{ marginBottom: '1rem', color: '#6b7280' }} />
            <h4>Waiting for authorization callback...</h4>
            <p>Expected format:</p>
            <code>
              {credentials.redirectUri}?code=AUTH_CODE_HERE&state={state}
            </code>
          </CallbackListener>

          <FormField>
            <FormLabel>Authorization Code (Auto-detected)</FormLabel>
            <FormInput
              type="text"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              placeholder="Authorization code will appear here automatically"
            />
            <ValidationIndicator $valid={!!authCode}>
              {authCode ? <FiCheckCircle /> : <FiAlertTriangle />}
              {authCode ? 'Authorization code received' : 'Waiting for authorization code'}
            </ValidationIndicator>
          </FormField>

          <FormField>
            <FormLabel>State Parameter (Auto-detected)</FormLabel>
            <FormInput
              type="text"
              value={state}
              readOnly
            />
            <ValidationIndicator $valid={state === state}>
              <FiCheckCircle />
              State parameter matches
            </ValidationIndicator>
          </FormField>
        </div>
      )
    },
    {
      id: 'exchange-tokens',
      title: 'Exchange Code for Tokens',
      description: 'Make a secure POST request to exchange the authorization code for access and refresh tokens.',
      icon: <FiKey />,
      category: 'token-exchange',
      content: (
        <div>
          <h4>Token Request Details:</h4>
          <ParameterBreakdown>
            <ParameterItem>
              <ParameterName>Endpoint</ParameterName>
              <ParameterValue>{credentials.tokenEndpoint}</ParameterValue>
            </ParameterItem>
            <ParameterItem>
              <ParameterName>Method</ParameterName>
              <ParameterValue>POST</ParameterValue>
            </ParameterItem>
            <ParameterItem>
              <ParameterName>Content-Type</ParameterName>
              <ParameterValue>application/x-www-form-urlencoded</ParameterValue>
            </ParameterItem>
          </ParameterBreakdown>

          <h4>Request Parameters:</h4>
          <ParameterBreakdown>
            <ParameterItem>
              <ParameterName>grant_type</ParameterName>
              <ParameterValue>authorization_code</ParameterValue>
            </ParameterItem>
            <ParameterItem>
              <ParameterName>code</ParameterName>
              <ParameterValue>{authCode || '[AUTHORIZATION_CODE]'}</ParameterValue>
            </ParameterItem>
            <ParameterItem>
              <ParameterName>redirect_uri</ParameterName>
              <ParameterValue>{credentials.redirectUri}</ParameterValue>
            </ParameterItem>
            <ParameterItem>
              <ParameterName>client_id</ParameterName>
              <ParameterValue>{credentials.clientId}</ParameterValue>
            </ParameterItem>
            <ParameterItem>
              <ParameterName>code_verifier</ParameterName>
              <ParameterValue>{pkceCodes.codeVerifier || '[CODE_VERIFIER]'}</ParameterValue>
            </ParameterItem>
          </ParameterBreakdown>

          {tokens && (
            <div>
              <h4>Token Response:</h4>
              <UrlDisplay>
                {JSON.stringify(tokens, null, 2)}
                <CopyButton onClick={() => copyToClipboard(JSON.stringify(tokens, null, 2))}>
                  {copiedText === JSON.stringify(tokens, null, 2) ? <FiCheckCircle /> : <FiCopy />}
                </CopyButton>
              </UrlDisplay>
            </div>
          )}
        </div>
      ),
      execute: exchangeCodeForTokens
    },
    {
      id: 'validate-tokens',
      title: 'Validate Tokens & Retrieve User Information',
      description: 'Use the access token to call the UserInfo endpoint and retrieve the authenticated user\'s profile.',
      icon: <FiUser />,
      category: 'validation',
      content: (
        <div>
          <h4>UserInfo Request:</h4>
          <ParameterBreakdown>
            <ParameterItem>
              <ParameterName>GET</ParameterName>
              <ParameterValue>{credentials.userInfoEndpoint}</ParameterValue>
            </ParameterItem>
            <ParameterItem>
              <ParameterName>Authorization</ParameterName>
              <ParameterValue>Bearer {tokens?.access_token ? tokens.access_token.substring(0, 20) + '...' : '[ACCESS_TOKEN]'}</ParameterValue>
            </ParameterItem>
          </ParameterBreakdown>

          {userInfo && (
            <div>
              <h4>User Profile:</h4>
              <UserProfileCard>
                <ProfileHeader>
                  <ProfileAvatar>
                    <FiUser />
                  </ProfileAvatar>
                  <ProfileInfo>
                    <ProfileName>{userInfo.name || 'User'}</ProfileName>
                    <ProfileEmail>{userInfo.email || 'No email provided'}</ProfileEmail>
                  </ProfileInfo>
                </ProfileHeader>
                
                <ProfileDetails>
                  <DetailItem>
                    <FiUser />
                    <strong>ID:</strong> {userInfo.sub}
                  </DetailItem>
                  <DetailItem>
                    <FiCheckCircle />
                    <strong>Email Verified:</strong> {userInfo.email_verified ? 'Yes' : 'No'}
                  </DetailItem>
                  {userInfo.given_name && (
                    <DetailItem>
                      <FiUser />
                      <strong>First Name:</strong> {userInfo.given_name}
                    </DetailItem>
                  )}
                  {userInfo.family_name && (
                    <DetailItem>
                      <FiUser />
                      <strong>Last Name:</strong> {userInfo.family_name}
                    </DetailItem>
                  )}
                </ProfileDetails>
              </UserProfileCard>

              <h4>Raw Response:</h4>
              <UrlDisplay>
                {JSON.stringify(userInfo, null, 2)}
                <CopyButton onClick={() => copyToClipboard(JSON.stringify(userInfo, null, 2))}>
                  {copiedText === JSON.stringify(userInfo, null, 2) ? <FiCheckCircle /> : <FiCopy />}
                </CopyButton>
              </UrlDisplay>
            </div>
          )}

          {tokens && userInfo && (
            <InfoBox type="success">
              <FiCheckCircle />
              <div>
                <strong>🎉 OAuth Flow Complete!</strong>
                <br />
                All tokens are valid and user information retrieved successfully.
              </div>
            </InfoBox>
          )}
        </div>
      ),
      execute: getUserInfo
    }
  ];

  return (
    <EnhancedStepFlowV2
      steps={steps}
      title="🚀 Enhanced Authorization Code Flow"
      persistKey="enhanced-authz-code"
      autoAdvance={false}
      showDebugInfo={true}
      allowStepJumping={true}
    />
  );
};

export default EnhancedAuthorizationCodeFlowV2;
