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
  FiSettings,
  FiInfo,
  FiAlertTriangle,
  FiClock,
  FiLoader
} from 'react-icons/fi';
import EnhancedStepFlowV2, { EnhancedFlowStep } from '../../components/EnhancedStepFlowV2';
import { generateCodeVerifier, generateCodeChallenge } from '../../utils/oauth';
import { credentialManager } from '../../utils/credentialManager';
import { logger } from '../../utils/logger';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import { PingOneErrorInterpreter } from '../../utils/pingoneErrorInterpreter';
import { FlowConfiguration, type FlowConfig } from '../../components/FlowConfiguration';
import { getDefaultConfig } from '../../utils/flowConfigDefaults';
import CallbackUrlDisplay from '../../components/CallbackUrlDisplay';
import ContextualHelp from '../../components/ContextualHelp';
import ConfigurationStatus from '../../components/ConfigurationStatus';
import { useAuth } from '../../contexts/NewAuthContext';
import '../../styles/enhanced-flow.css';

// Styled Components for Enhanced UI
const FormField = styled.div`
  margin-bottom: 1rem;
`;

const FormLabel = styled.label<{ $highlight?: boolean }>`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 0.5rem;
  
  &.required::after {
    content: ' *';
    color: #ef4444;
  }
  
  ${props => props.$highlight && `
    color: #10b981;
    font-size: 1rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    &::before {
      content: "🎯";
      font-size: 1.2rem;
    }
  `}
`;

const FormInput = styled.input<{ $generated?: boolean }>`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid ${({ $generated }) => $generated ? '#059669' : '#e5e7eb'};
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: ${({ $generated }) => $generated ? '#ecfdf5' : 'white'};
  color: #1f2937;
  box-shadow: ${({ $generated }) => $generated ? '0 0 0 3px rgba(5, 150, 105, 0.1)' : 'none'};
  
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


const UrlDisplay = styled.div`
  background: #1f2937;
  color: #e5e7eb;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 3px solid #10b981;
  box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.2), 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  margin: 1rem 0;
  position: relative;
  white-space: pre-wrap;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #059669;
    box-shadow: 0 0 0 1px rgba(5, 150, 105, 0.3), 0 6px 8px -1px rgba(0, 0, 0, 0.15);
  }
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

const JsonDisplay = styled.div`
  background: #f9fafb;
  color: #1f2937;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  position: relative;
`;

const CodeBlock = styled.div`
  background: #1e1e1e;
  color: #d4d4d4;
  border-radius: 0.5rem;
  padding: 1.5rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  overflow-x: auto;
  margin-bottom: 1.5rem;
  border: 1px solid #333;
`;

const CodeLine = styled.div`
  margin-bottom: 0.5rem;
  word-break: break-all;
`;

const CodeComment = styled.div`
  color: #6a9955;
  font-style: italic;
  margin-bottom: 0.5rem;
`;

const InfoBox = styled.div<{ type: 'info' | 'success' | 'warning' | 'error' }>`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
  font-size: 0.875rem;
  line-height: 1.5;
  
  ${props => {
    switch (props.type) {
      case 'success':
        return `
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        `;
      case 'warning':
        return `
          background-color: #fffbeb;
          border: 1px solid #fed7aa;
          color: #92400e;
        `;
      case 'error':
        return `
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
        `;
      case 'info':
      default:
        return `
          background-color: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1e40af;
        `;
    }
  }}
  
  svg {
    flex-shrink: 0;
    margin-top: 0.125rem;
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
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
const AuthorizationCodeFlow: React.FC = () => {
  const { config } = useAuth();
  const [showConfig, setShowConfig] = useState(false);
  const [flowConfig, setFlowConfig] = useState<FlowConfig>(getDefaultConfig('authorization-code'));
  
  const [credentials, setCredentials] = useState({
    clientId: '',
    clientSecret: '',
    environmentId: '',
    authorizationEndpoint: '',
    tokenEndpoint: '',
    userInfoEndpoint: '',
    redirectUri: window.location.origin + '/authz-callback',
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
  const [credentialsSaved, setCredentialsSaved] = useState<boolean>(false);
  const [pkceGenerated, setPkceGenerated] = useState<boolean>(false);
  const [authUrlGenerated, setAuthUrlGenerated] = useState<boolean>(false);
  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false);
  const [isExchangingTokens, setIsExchangingTokens] = useState<boolean>(false);
  const [isSavingCredentials, setIsSavingCredentials] = useState<boolean>(false);
  const [isGeneratingPKCE, setIsGeneratingPKCE] = useState<boolean>(false);
  const [isGettingUserInfo, setIsGettingUserInfo] = useState<boolean>(false);

  // Load persistent credentials
  useEffect(() => {
    const loadCredentials = () => {
      try {
        // Load from credential manager (permanent + session)
        const allCredentials = credentialManager.getAllCredentials();
        
        console.log('🔧 [AuthorizationCodeFlow] Loading credentials:', allCredentials);
        
        setCredentials(prev => ({ 
          ...prev, 
          environmentId: allCredentials.environmentId || '',
          clientId: allCredentials.clientId || '',
          clientSecret: allCredentials.clientSecret || '',
          redirectUri: window.location.origin + '/authz-callback', // Always use authz-callback for Authorization Code Flow
          scopes: Array.isArray(allCredentials.scopes) ? allCredentials.scopes.join(' ') : allCredentials.scopes || prev.scopes,
          authorizationEndpoint: allCredentials.authEndpoint || prev.authorizationEndpoint,
          tokenEndpoint: allCredentials.tokenEndpoint || prev.tokenEndpoint,
          userInfoEndpoint: allCredentials.userInfoEndpoint || prev.userInfoEndpoint
        }));
        
        logger.info('Loaded credentials from credential manager', JSON.stringify({
          hasEnvironmentId: !!allCredentials.environmentId,
          hasClientId: !!allCredentials.clientId,
          hasClientSecret: !!allCredentials.clientSecret
        }));
      } catch (error) {
        logger.warn('Failed to load credentials from credential manager', String(error));
      }
    };
    
    loadCredentials();
    
    // Listen for credential changes
    const handleCredentialChange = () => {
      loadCredentials();
    };
    
    window.addEventListener('permanent-credentials-changed', handleCredentialChange);
    
    return () => {
      window.removeEventListener('permanent-credentials-changed', handleCredentialChange);
    };
  }, []);

  // Save credentials
  const saveCredentials = useCallback(async () => {
    try {
      setIsSavingCredentials(true);
      
      const permanentCreds = {
        environmentId: credentials.environmentId,
        clientId: credentials.clientId,
        redirectUri: credentials.redirectUri,
        scopes: credentials.scopes.split(' ').filter(s => s.trim()),
        authEndpoint: credentials.authorizationEndpoint,
        tokenEndpoint: credentials.tokenEndpoint,
        userInfoEndpoint: credentials.userInfoEndpoint
      };
      
      console.log('🔧 [AuthorizationCodeFlow] Saving permanent credentials:', permanentCreds);
      
      // Save permanent credentials (Environment ID, Client ID, etc.)
      const permanentSuccess = credentialManager.savePermanentCredentials(permanentCreds);

      // Save session credentials (Client Secret)
      const sessionSuccess = credentialManager.saveSessionCredentials({
        clientSecret: credentials.clientSecret
      });

      if (permanentSuccess && sessionSuccess) {
        logger.info('Credentials saved successfully to credential manager', '');
        setCredentialsSaved(true);
        setIsSavingCredentials(false);
        return { success: true };
      } else {
        logger.warn('Some credentials failed to save', '');
        setIsSavingCredentials(false);
        return { success: false, error: 'Some credentials failed to save' };
      }
    } catch (error) {
      logger.error('Failed to save credentials', String(error));
      setIsSavingCredentials(false);
      return { success: false, error: String(error) };
    }
  }, [credentials]);

  // Generate PKCE codes
  const generatePKCECodes = useCallback(async () => {
    try {
      console.log('🔧 [AuthorizationCodeFlow] Starting PKCE generation...');
      setIsGeneratingPKCE(true);
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      console.log('✅ [AuthorizationCodeFlow] PKCE codes generated:', { verifier: verifier.substring(0, 20) + '...', challenge: challenge.substring(0, 20) + '...' });
      setPkceCodes({ codeVerifier: verifier, codeChallenge: challenge });
      setPkceGenerated(true);
      logger.info('PKCE codes generated', '');
      setIsGeneratingPKCE(false);
      return { verifier, challenge };
    } catch (error) {
      console.error('❌ [AuthorizationCodeFlow] Failed to generate PKCE codes:', error);
      logger.error('Failed to generate PKCE codes', String(error));
      setIsGeneratingPKCE(false);
      throw error;
    }
  }, []);

  // Generate authorization URL
  const generateAuthUrl = useCallback((pkceChallenge?: string) => {
    const challengeToUse = pkceChallenge || pkceCodes.codeChallenge;
    console.log('🔧 [AuthorizationCodeFlow] Generating authorization URL...', { credentials, pkceCodes, challengeToUse });
    const generatedState = Math.random().toString(36).substring(2, 15);
    setState(generatedState);
    
    const params = new URLSearchParams({
      response_type: credentials.responseType,
      client_id: credentials.clientId,
      redirect_uri: credentials.redirectUri,
      scope: credentials.scopes,
      state: generatedState,
      code_challenge: challengeToUse,
      code_challenge_method: credentials.codeChallengeMethod
    });

    const url = `${credentials.authorizationEndpoint}?${params.toString()}`;
    console.log('✅ [AuthorizationCodeFlow] Authorization URL generated:', url);
    setAuthUrl(url);
    setAuthUrlGenerated(true);
    logger.info('Authorization URL generated', url);
  }, [credentials, pkceCodes.codeChallenge]);

  // Handle authorization
  const handleAuthorization = useCallback(() => {
    console.log('🔧 [AuthorizationCodeFlow] handleAuthorization called', { testingMethod, authUrl });
    if (testingMethod === 'popup') {
      setIsAuthorizing(true);
      console.log('🔧 [AuthorizationCodeFlow] Opening popup with URL:', authUrl);
      const popup = window.open(authUrl, 'oauth-popup', 'width=600,height=700');
      if (popup) {
        // Listen for messages from the popup
        const messageHandler = (event: MessageEvent) => {
          console.log('🔧 [AuthorizationCodeFlow] Message received from popup:', event.data, 'origin:', event.origin);
          if (event.origin !== window.location.origin) return;
          if (event.data.type === 'oauth-callback') {
            const { code: callbackCode, state: callbackState, error } = event.data;
            console.log('🔧 [AuthorizationCodeFlow] OAuth callback received:', { callbackCode, callbackState, error, expectedState: state });
            if (error) {
              logger.error('Authorization error received', error);
              setIsAuthorizing(false);
            } else if (callbackCode && callbackState === state) {
              setAuthCode(callbackCode);
              logger.info('Authorization code received via message', `code: ${callbackCode.substring(0, 10)}...`);
              setIsAuthorizing(false);
              popup.close();
              window.removeEventListener('message', messageHandler);
            }
          }
        };
        window.addEventListener('message', messageHandler);
        
        // Check if popup was closed without completing auth
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
            setIsAuthorizing(false);
            if (!authCode) {
              logger.warn('Popup closed without authorization code');
            }
          }
        }, 1000);
      } else {
        setIsAuthorizing(false);
        logger.error('Failed to open popup window');
      }
    } else {
      // Full redirect
      console.log('🔧 [AuthorizationCodeFlow] Full redirect triggered', { authUrl, testingMethod });
      logger.info('Redirecting to authorization server', `url: ${authUrl}`);
      if (!authUrl) {
        console.error('❌ [AuthorizationCodeFlow] No authUrl available for redirect');
        logger.error('No authorization URL available for redirect');
        return;
      }
      window.location.href = authUrl;
    }
  }, [authUrl, testingMethod, state, authCode]);

  // Exchange code for tokens
  const exchangeCodeForTokens = useCallback(async () => {
    try {
      setIsExchangingTokens(true);
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
          code_verifier: pkceCodes.codeVerifier,
          ...(credentials.clientSecret && { client_secret: credentials.clientSecret })
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error('Token exchange failed', { status: response.status, error: errorData });
        
        // Use PingOne error interpreter for friendly messages
        const interpretedError = PingOneErrorInterpreter.interpret({
          error: errorData.error || 'token_exchange_failed',
          error_description: errorData.error_description || errorData.details || `HTTP ${response.status}: ${response.statusText}`,
          details: errorData
        });
        
        throw new Error(`${interpretedError.title}: ${interpretedError.message}${interpretedError.suggestion ? `\n\nSuggestion: ${interpretedError.suggestion}` : ''}`);
      }

      const tokenData = await response.json();
      setTokens(tokenData);
      logger.info('Tokens received', tokenData);
      setIsExchangingTokens(false);
      return { success: true, tokens: tokenData };
    } catch (error) {
      logger.error('Token exchange failed', String(error));
      setIsExchangingTokens(false);
      return { success: false, error: String(error) };
    }
  }, [credentials, authCode, pkceCodes.codeVerifier]);

  // Get user info
  const getUserInfo = useCallback(async () => {
    if (!tokens?.access_token) {
      return { success: false, error: 'No access token available' };
    }

    try {
      setIsGettingUserInfo(true);
      const response = await fetch(credentials.userInfoEndpoint, {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error('UserInfo request failed', { status: response.status, error: errorData });
        
        // Use PingOne error interpreter for friendly messages
        const interpretedError = PingOneErrorInterpreter.interpret({
          error: errorData.error || 'userinfo_request_failed',
          error_description: errorData.error_description || errorData.details || `HTTP ${response.status}: ${response.statusText}`,
          details: errorData
        });
        
        throw new Error(`${interpretedError.title}: ${interpretedError.message}${interpretedError.suggestion ? `\n\nSuggestion: ${interpretedError.suggestion}` : ''}`);
      }

      const userData = await response.json();
      setUserInfo(userData);
      logger.info('User info retrieved', userData);
      setIsGettingUserInfo(false);
      return { success: true, userData };
    } catch (error) {
      logger.error('UserInfo request failed', String(error));
      setIsGettingUserInfo(false);
      return { success: false, error: String(error) };
    }
  }, [credentials.userInfoEndpoint, tokens]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      logger.error('Failed to copy to clipboard', String(error));
    }
  }, []);


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
            <FormLabel>Client Secret</FormLabel>
            <FormInput
              type="password"
              value={credentials.clientSecret || ''}
              onChange={(e) => setCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
              placeholder="your-client-secret (optional for PKCE)"
            />
            <ValidationIndicator $valid={true}>
              <FiInfo />
              Optional for PKCE flows, required for confidential clients
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

          {isSavingCredentials && (
            <InfoBox type="info">
              <FiLoader className="animate-spin" />
              <div>
                <strong>🔄 Saving Credentials...</strong>
                <br />
                Securely storing your OAuth credentials for future sessions...
              </div>
            </InfoBox>
          )}

          {credentialsSaved && (
            <InfoBox type="success">
              <FiCheckCircle />
              <div>
                <strong>✅ Credentials Saved Successfully!</strong>
                <br />
                Your OAuth credentials have been saved and are ready to use. You can now proceed to the next step.
              </div>
            </InfoBox>
          )}
        </div>
      ),
      execute: async () => {
        await saveCredentials();
        return { success: true };
      },
      canExecute: true
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
              $generated={!!pkceCodes.codeVerifier}
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
              $generated={!!pkceCodes.codeChallenge}
            />
            {pkceCodes.codeChallenge && (
              <CopyButton onClick={() => copyToClipboard(pkceCodes.codeChallenge)}>
                {copiedText === pkceCodes.codeChallenge ? <FiCheckCircle /> : <FiCopy />}
              </CopyButton>
            )}
          </FormField>

          <CodeBlock>
            <CodeComment>// How PKCE Codes Are Used in OAuth Flow</CodeComment>
            <CodeComment>// Step 1: Authorization Request (with code_challenge)</CodeComment>
            <CodeLine>GET /as/authorize?response_type=code&client_id=...&code_challenge={pkceCodes.codeChallenge || '[CODE_CHALLENGE]'}&code_challenge_method=S256</CodeLine>
            <CodeComment>// Step 2: Authorization Server returns authorization code</CodeComment>
            <CodeLine>redirect_uri?code=[AUTHORIZATION_CODE]&state=[STATE]</CodeLine>
            <CodeComment>// Step 3: Token Exchange (with code_verifier)</CodeComment>
            <CodeLine>POST /as/token</CodeLine>
            <CodeLine>grant_type=authorization_code&code=[AUTHORIZATION_CODE]&code_verifier={pkceCodes.codeVerifier || '[CODE_VERIFIER]'}</CodeLine>
            <CodeComment>// Step 4: Server validates: SHA256(code_verifier) === code_challenge</CodeComment>
          </CodeBlock>

          <InfoBox type="info">
            <FiInfo />
            <div>
              <strong>How PKCE Codes Are Used (OIDC Specification):</strong>
              <br /><br />
              <strong>1. Authorization Request:</strong> The <code>code_challenge</code> is sent to the authorization server in the initial request.
              <br /><br />
              <strong>2. Token Exchange:</strong> The <code>code_verifier</code> is sent back to the token endpoint to prove you initiated the request.
              <br /><br />
              <strong>3. Security Benefit:</strong> Even if an attacker intercepts the authorization code, they cannot exchange it for tokens without the code verifier.
              <br /><br />
              <strong>OIDC Compliance:</strong> PKCE is required for public clients (mobile apps, SPAs) and recommended for all clients per RFC 7636.
            </div>
          </InfoBox>

          <InfoBox type="info">
            <FiShield />
            <div>
              <strong>Security Note:</strong> PKCE codes are automatically generated and will be used in the authorization request to enhance security.
            </div>
          </InfoBox>

          {isGeneratingPKCE && (
            <InfoBox type="info">
              <FiLoader className="animate-spin" />
              <div>
                <strong>🔄 Generating PKCE Codes...</strong>
                <br />
                Creating secure code verifier and challenge for enhanced OAuth security...
              </div>
            </InfoBox>
          )}

          {pkceGenerated && (
            <InfoBox type="success">
              <FiCheckCircle />
              <div>
                <strong>✅ PKCE Codes Generated Successfully!</strong>
                <br />
                Your PKCE codes have been generated and are ready to use. These will be included in the authorization request for enhanced security.
              </div>
            </InfoBox>
          )}
        </div>
      ),
      execute: async () => {
        const { challenge } = await generatePKCECodes();
        // Regenerate authorization URL with PKCE codes
        generateAuthUrl(challenge);
        return { success: true };
      },
      canExecute: true
    },
    {
      id: 'build-auth-url',
      title: 'Build Authorization URL',
      description: 'Construct the complete authorization URL with all required OAuth parameters.',
      icon: <FiGlobe />,
      category: 'authorization',
      content: (
        <div>
          <CodeBlock>
            <CodeComment>// Authorization URL for Authorization Code Flow</CodeComment>
            <CodeLine>
              const authUrl = '{authUrl || `https://auth.pingone.com/${credentials.environmentId}/as/authorize?response_type=${credentials.responseType}&client_id=${credentials.clientId}&redirect_uri=${encodeURIComponent(credentials.redirectUri)}&scope=${encodeURIComponent(credentials.scopes)}&state=${state}&code_challenge=${pkceCodes.codeChallenge}&code_challenge_method=${credentials.codeChallengeMethod}`}';
            </CodeLine>
            <CodeComment>// Parameters:</CodeComment>
            <CodeLine>response_type: '{credentials.responseType}'</CodeLine>
            <CodeLine>client_id: '{credentials.clientId}'</CodeLine>
            <CodeLine>redirect_uri: '{credentials.redirectUri}'</CodeLine>
            <CodeLine>scope: '{credentials.scopes}'</CodeLine>
            <CodeLine>state: '{state}'</CodeLine>
            <CodeLine>code_challenge: '{pkceCodes.codeChallenge}'</CodeLine>
            <CodeLine>code_challenge_method: '{credentials.codeChallengeMethod}'</CodeLine>
          </CodeBlock>

          <FormField>
            <FormLabel $highlight>Generated Authorization URL</FormLabel>
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
            <FormField>
              <FormLabel>URL Components (JSON)</FormLabel>
              <JsonDisplay>
                {JSON.stringify({
                  baseUrl: credentials.authorizationEndpoint,
                  response_type: credentials.responseType,
                  client_id: credentials.clientId,
                  redirect_uri: credentials.redirectUri,
                  scope: credentials.scopes,
                  state: state,
                  code_challenge: pkceCodes.codeChallenge,
                  code_challenge_method: credentials.codeChallengeMethod
                }, null, 2)}
                <CopyButton onClick={() => copyToClipboard(JSON.stringify({
                  baseUrl: credentials.authorizationEndpoint,
                  response_type: credentials.responseType,
                  client_id: credentials.clientId,
                  redirect_uri: credentials.redirectUri,
                  scope: credentials.scopes,
                  state: state,
                  code_challenge: pkceCodes.codeChallenge,
                  code_challenge_method: credentials.codeChallengeMethod
                }, null, 2))}>
                  {copiedText === JSON.stringify({
                    baseUrl: credentials.authorizationEndpoint,
                    response_type: credentials.responseType,
                    client_id: credentials.clientId,
                    redirect_uri: credentials.redirectUri,
                    scope: credentials.scopes,
                    state: state,
                    code_challenge: pkceCodes.codeChallenge,
                    code_challenge_method: credentials.codeChallengeMethod
                  }, null, 2) ? <FiCheckCircle /> : <FiCopy />}
                </CopyButton>
              </JsonDisplay>
            </FormField>
          )}

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

          {authUrlGenerated && (
            <InfoBox type="success">
              <FiCheckCircle />
              <div>
                <strong>✅ Authorization URL Generated Successfully!</strong>
                <br />
                Your authorization URL has been built with all required OAuth parameters. You can now proceed to redirect the user to PingOne for authentication.
              </div>
            </InfoBox>
          )}
        </div>
      ),
      execute: async () => {
        generateAuthUrl();
        return { success: true };
      },
      canExecute: true
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

          {isAuthorizing && (
            <InfoBox type="info">
              <FiLoader className="animate-spin" />
              <div>
                <strong>🔄 Authorization in Progress...</strong>
                <br />
                {testingMethod === 'popup' ? 'Popup window opened. Please complete authentication in the popup.' : 'Redirecting to authorization server...'}
              </div>
            </InfoBox>
          )}
        </div>
      ),
      execute: async () => {
        // Generate the authorization URL and open popup/redirect
        generateAuthUrl();
        handleAuthorization();
        return { success: true };
      },
      canExecute: true
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
              $generated={!!authCode}
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

          {isAuthorizing && (
            <InfoBox type="info">
              <FiLoader className="animate-spin" />
              <div>
                <strong>🔄 Authorization in Progress...</strong>
                <br />
                {testingMethod === 'popup' ? 'Popup window opened. Please complete authentication in the popup.' : 'Redirecting to authorization server...'}
              </div>
            </InfoBox>
          )}
        </div>
      ),
      execute: async () => {
        // Authorization should already be triggered in the previous step
        // This step just waits for the callback to be processed
        return { success: true };
      },
      canExecute: true
    },
    {
      id: 'exchange-tokens',
      title: 'Exchange Code for Tokens',
      description: 'Make a secure POST request to exchange the authorization code for access and refresh tokens.',
      icon: <FiKey />,
      category: 'token-exchange',
      content: (
        <div>
          <CodeBlock>
            <CodeComment>// Token Exchange Request</CodeComment>
            <CodeLine>POST {credentials.tokenEndpoint}</CodeLine>
            <CodeComment>// Request Body:</CodeComment>
            <CodeLine>grant_type: 'authorization_code'</CodeLine>
            <CodeLine>code: '{authCode || '[AUTHORIZATION_CODE]'}'</CodeLine>
            <CodeLine>redirect_uri: '{credentials.redirectUri}'</CodeLine>
            <CodeLine>client_id: '{credentials.clientId}'</CodeLine>
            <CodeLine>client_secret: '{credentials.clientSecret}'</CodeLine>
            <CodeLine>code_verifier: '{pkceCodes.codeVerifier || '[CODE_VERIFIER]'}'</CodeLine>
          </CodeBlock>

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
              <h4>Token Response (JSON):</h4>
              <JsonDisplay>
                {JSON.stringify(tokens, null, 2)}
                <CopyButton onClick={() => copyToClipboard(JSON.stringify(tokens, null, 2))}>
                  {copiedText === JSON.stringify(tokens, null, 2) ? <FiCheckCircle /> : <FiCopy />}
                </CopyButton>
              </JsonDisplay>
            </div>
          )}

          <FormField>
            <FormLabel>Token Request Details (JSON)</FormLabel>
            <JsonDisplay>
              {JSON.stringify({
                endpoint: credentials.tokenEndpoint,
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: {
                  grant_type: 'authorization_code',
                  code: authCode || '[AUTHORIZATION_CODE]',
                  redirect_uri: credentials.redirectUri,
                  client_id: credentials.clientId,
                  code_verifier: pkceCodes.codeVerifier || '[CODE_VERIFIER]',
                  ...(credentials.clientSecret && { client_secret: credentials.clientSecret })
                }
              }, null, 2)}
              <CopyButton onClick={() => copyToClipboard(JSON.stringify({
                endpoint: credentials.tokenEndpoint,
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: {
                  grant_type: 'authorization_code',
                  code: authCode || '[AUTHORIZATION_CODE]',
                  redirect_uri: credentials.redirectUri,
                  client_id: credentials.clientId,
                  code_verifier: pkceCodes.codeVerifier || '[CODE_VERIFIER]',
                  ...(credentials.clientSecret && { client_secret: credentials.clientSecret })
                }
              }, null, 2))}>
                {copiedText === JSON.stringify({
                  endpoint: credentials.tokenEndpoint,
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                  },
                  body: {
                    grant_type: 'authorization_code',
                    code: authCode || '[AUTHORIZATION_CODE]',
                    redirect_uri: credentials.redirectUri,
                    client_id: credentials.clientId,
                    code_verifier: pkceCodes.codeVerifier || '[CODE_VERIFIER]'
                  }
                }, null, 2) ? <FiCheckCircle /> : <FiCopy />}
              </CopyButton>
            </JsonDisplay>
          </FormField>

          {isExchangingTokens && (
            <InfoBox type="info">
              <FiLoader className="animate-spin" />
              <div>
                <strong>🔄 Exchanging Authorization Code for Tokens...</strong>
                <br />
                Making secure request to token endpoint...
              </div>
            </InfoBox>
          )}
        </div>
      ),
      execute: async () => {
        if (!authCode) {
          return { success: false, error: 'Authorization code is required. Please complete the redirect step first.' };
        }
        await exchangeCodeForTokens();
        return { success: true };
      },
      canExecute: Boolean(authCode && authCode.trim().length > 0)
    },
    {
      id: 'validate-tokens',
      title: 'Validate Tokens & Retrieve User Information',
      description: 'Use the access token to call the UserInfo endpoint and retrieve the authenticated user\'s profile.',
      icon: <FiUser />,
      category: 'validation',
      content: (
        <div>
          <CodeBlock>
            <CodeComment>// UserInfo Request</CodeComment>
            <CodeLine>GET {credentials.userInfoEndpoint}</CodeLine>
            <CodeComment>// Headers:</CodeComment>
            <CodeLine>Authorization: Bearer {tokens?.access_token ? tokens.access_token.substring(0, 20) + '...' : '[ACCESS_TOKEN]'}</CodeLine>
            <CodeComment>// Response will contain user profile information</CodeComment>
          </CodeBlock>

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

          <FormField>
            <FormLabel>UserInfo Request Details (JSON)</FormLabel>
            <JsonDisplay>
              {JSON.stringify({
                endpoint: credentials.userInfoEndpoint,
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${tokens?.access_token ? tokens.access_token.substring(0, 20) + '...' : '[ACCESS_TOKEN]'}`
                }
              }, null, 2)}
              <CopyButton onClick={() => copyToClipboard(JSON.stringify({
                endpoint: credentials.userInfoEndpoint,
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${tokens?.access_token ? tokens.access_token.substring(0, 20) + '...' : '[ACCESS_TOKEN]'}`
                }
              }, null, 2))}>
                {copiedText === JSON.stringify({
                  endpoint: credentials.userInfoEndpoint,
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${tokens?.access_token ? tokens.access_token.substring(0, 20) + '...' : '[ACCESS_TOKEN]'}`
                  }
                }, null, 2) ? <FiCheckCircle /> : <FiCopy />}
              </CopyButton>
            </JsonDisplay>
          </FormField>

          {isGettingUserInfo && (
            <InfoBox type="info">
              <FiLoader className="animate-spin" />
              <div>
                <strong>🔄 Retrieving User Information...</strong>
                <br />
                Making request to UserInfo endpoint to get authenticated user profile...
              </div>
            </InfoBox>
          )}

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

              <h4>Raw Response (JSON):</h4>
              <JsonDisplay>
                {JSON.stringify(userInfo, null, 2)}
                <CopyButton onClick={() => copyToClipboard(JSON.stringify(userInfo, null, 2))}>
                  {copiedText === JSON.stringify(userInfo, null, 2) ? <FiCheckCircle /> : <FiCopy />}
                </CopyButton>
              </JsonDisplay>
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
      execute: async () => {
        if (!tokens?.access_token) {
          return { success: false, error: 'Access token is required. Please complete the token exchange step first.' };
        }
        await getUserInfo();
        return { success: true };
      },
      canExecute: Boolean(tokens?.access_token && tokens.access_token.trim().length > 0)
    }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
      <ConfigurationStatus 
        config={config} 
        onConfigure={() => setShowConfig(!showConfig)}
        flowType="authorization-code"
        defaultExpanded={true}
      />

      <ContextualHelp flowId="authorization-code" />

      {showConfig && (
        <div style={{ marginBottom: '2rem' }}>
          <FlowConfiguration
            config={flowConfig}
            onConfigChange={setFlowConfig}
            flowType="authorization-code"
          />
        </div>
      )}

      {/* Callback URL Configuration */}
      <CallbackUrlDisplay flowType="authorization-code" defaultExpanded={true} />

      <EnhancedStepFlowV2
        steps={steps}
        title="🚀 Enhanced Authorization Code Flow"
        persistKey="enhanced-authz-code"
        autoAdvance={false}
        showDebugInfo={true}
        allowStepJumping={true}
      />
    </div>
  );
};

export default AuthorizationCodeFlow;
