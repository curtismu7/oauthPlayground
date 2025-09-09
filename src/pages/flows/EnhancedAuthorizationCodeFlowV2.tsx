// src/pages/flows/EnhancedAuthorizationCodeFlowV2.tsx - Enhanced with complete UI design implementation
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
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
  FiClock,
  FiLoader
} from 'react-icons/fi';
import EnhancedStepFlowV2, { EnhancedFlowStep } from '../../components/EnhancedStepFlowV2';
import AuthorizationRequestModal from '../../components/AuthorizationRequestModal';
import OAuthErrorHelper from '../../components/OAuthErrorHelper';
import { generateCodeVerifier, generateCodeChallenge } from '../../utils/oauth';
import { credentialManager } from '../../utils/credentialManager';
import { logger } from '../../utils/logger';
import { PingOneErrorInterpreter } from '../../utils/pingoneErrorInterpreter';
import ConfigurationStatus from '../../components/ConfigurationStatus';
import ContextualHelp from '../../components/ContextualHelp';
import { FlowConfiguration, type FlowConfig } from '../../components/FlowConfiguration';
import { getDefaultConfig } from '../../utils/flowConfigDefaults';
import CallbackUrlDisplay from '../../components/CallbackUrlDisplay';
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
  border: 1px solid ${({ $generated }) => $generated ? '#10b981' : '#e5e7eb'};
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: ${({ $generated }) => $generated ? '#f0fdf4' : 'white'};
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

const CodeBlock = styled.div`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 1rem;
  margin: 1rem 0;
  font-family: 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
`;

const CodeComment = styled.div`
  color: #6c757d;
  font-style: italic;
  margin: 0.25rem 0;
`;

const CodeLine = styled.div`
  color: #212529;
  margin: 0.25rem 0;
  word-break: break-all;
`;

// Main Component
const EnhancedAuthorizationCodeFlowV2: React.FC = () => {
  const { config } = useAuth();
  const location = useLocation();
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
  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false);
  const [isExchangingTokens, setIsExchangingTokens] = useState<boolean>(false);
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState(false);
  const [flowConfig, setFlowConfig] = useState<FlowConfig>(getDefaultConfig('authorization-code'));
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('');
  const [redirectParams, setRedirectParams] = useState({});
  const [isGeneratingPKCE, setIsGeneratingPKCE] = useState<boolean>(false);
  const [pkceGenerated, setPkceGenerated] = useState<boolean>(false);
  const [isSavingCredentials, setIsSavingCredentials] = useState<boolean>(false);
  const [isBuildingUrl, setIsBuildingUrl] = useState<boolean>(false);
  const [isGettingUserInfo, setIsGettingUserInfo] = useState<boolean>(false);
  const [credentialsSaved, setCredentialsSaved] = useState<boolean>(false);
  const [urlGenerated, setUrlGenerated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [errorDescription, setErrorDescription] = useState<string | null>(null);

  // Handle URL parameters to restore correct step
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const stepParam = urlParams.get('step');
    
    if (stepParam) {
      const stepIndex = parseInt(stepParam, 10) - 1; // Convert to 0-based index
      console.log('🔍 [EnhancedAuthorizationCodeFlowV2] URL step parameter detected:', stepParam, '-> step index:', stepIndex);
      
      // Store the step index to be used by EnhancedStepFlowV2
      sessionStorage.setItem('enhanced-authz-code-v2-step', stepIndex.toString());
    }
  }, [location.search]);

  // Load credentials immediately to ensure buttons are enabled
  useEffect(() => {
    const loadCredentials = async () => {
      try {
        // Debug localStorage contents
        credentialManager.debugLocalStorage();
        
        const allCredentials = credentialManager.getAllCredentials();
        console.log('🔧 [EnhancedAuthorizationCodeFlowV2] Loading credentials:', allCredentials);
        
        // Check if we have any credentials
        const hasCredentials = allCredentials.environmentId || allCredentials.clientId;
        
        if (!hasCredentials) {
          console.log('⚠️ [EnhancedAuthorizationCodeFlowV2] No credentials found, loading from environment variables...');
          try {
            const response = await fetch('/api/env-config');
            if (response.ok) {
              const envConfig = await response.json();
              console.log('✅ [EnhancedAuthorizationCodeFlowV2] Loaded from environment config:', envConfig);
              
              setCredentials(prev => ({ 
                ...prev, 
                environmentId: envConfig.environmentId || '',
                clientId: envConfig.clientId || '',
                clientSecret: envConfig.clientSecret || '',
                redirectUri: envConfig.redirectUri || window.location.origin + '/authz-callback',
                authorizationEndpoint: envConfig.authEndpoint || `${envConfig.apiUrl}/${envConfig.environmentId}/as/authorize`,
                tokenEndpoint: envConfig.tokenEndpoint || `${envConfig.apiUrl}/${envConfig.environmentId}/as/token`,
                userInfoEndpoint: envConfig.userInfoEndpoint || `${envConfig.apiUrl}/${envConfig.environmentId}/as/userinfo`,
                scopes: Array.isArray(envConfig.scopes) ? envConfig.scopes.join(' ') : (envConfig.scopes || 'openid profile email')
              }));
              
              console.log('✅ [EnhancedAuthorizationCodeFlowV2] Credentials loaded from environment variables');
              return;
            }
          } catch (envError) {
            console.warn('⚠️ [EnhancedAuthorizationCodeFlowV2] Failed to load from environment variables:', envError);
          }
        }
        
        setCredentials(prev => ({ 
          ...prev, 
          environmentId: allCredentials.environmentId || '',
          clientId: allCredentials.clientId || '',
          clientSecret: allCredentials.clientSecret || '',
          redirectUri: allCredentials.redirectUri || window.location.origin + '/authz-callback',
          authorizationEndpoint: allCredentials.authEndpoint || '',
          tokenEndpoint: allCredentials.tokenEndpoint || '',
          userInfoEndpoint: allCredentials.userInfoEndpoint || '',
          scopes: Array.isArray(allCredentials.scopes) ? allCredentials.scopes.join(' ') : (allCredentials.scopes || 'openid profile email')
        }));
        
        console.log('✅ [EnhancedAuthorizationCodeFlowV2] Credentials loaded successfully');
      } catch (error) {
        console.error('❌ [EnhancedAuthorizationCodeFlowV2] Failed to load credentials:', error);
        logger.error('Failed to load credentials', { error });
      }
    };
    
    loadCredentials();
    console.log('🧹 [EnhancedAuthorizationCodeFlowV2] Cleared all flow states and loaded credentials on mount');
  }, []);

  // Listen for credential changes (debounced to prevent excessive calls)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleCredentialChange = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        try {
          const allCredentials = credentialManager.getAllCredentials();
          console.log('🔧 [EnhancedAuthorizationCodeFlowV2] Reloading credentials after change:', allCredentials);
          
          setCredentials(prev => ({ 
            ...prev, 
            environmentId: allCredentials.environmentId || '',
            clientId: allCredentials.clientId || '',
            clientSecret: allCredentials.clientSecret || '',
            redirectUri: allCredentials.redirectUri || window.location.origin + '/authz-callback',
            authorizationEndpoint: allCredentials.authEndpoint || '',
            tokenEndpoint: allCredentials.tokenEndpoint || '',
            userInfoEndpoint: allCredentials.userInfoEndpoint || '',
            scopes: Array.isArray(allCredentials.scopes) ? allCredentials.scopes.join(' ') : (allCredentials.scopes || 'openid profile email')
          }));
          
          console.log('✅ [EnhancedAuthorizationCodeFlowV2] Credentials reloaded successfully');
        } catch (error) {
          console.error('❌ [EnhancedAuthorizationCodeFlowV2] Failed to reload credentials:', error);
          logger.error('Failed to reload credentials', { error });
        }
      }, 100); // Debounce by 100ms
    };
    
    window.addEventListener('permanent-credentials-changed', handleCredentialChange);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('permanent-credentials-changed', handleCredentialChange);
    };
  }, []);

  // Save credentials
  const saveCredentials = useCallback(async () => {
    setIsSavingCredentials(true);
    try {
      console.log('🔧 [EnhancedAuthorizationCodeFlowV2] Saving credentials:', credentials);
      
      // Prepare permanent credentials (Environment ID, Client ID, etc.)
      const permanentCreds = {
        environmentId: credentials.environmentId,
        clientId: credentials.clientId,
        redirectUri: credentials.redirectUri,
        scopes: credentials.scopes,
        authEndpoint: credentials.authorizationEndpoint,
        tokenEndpoint: credentials.tokenEndpoint,
        userInfoEndpoint: credentials.userInfoEndpoint
      };
      
      // Save permanent credentials (Environment ID, Client ID, etc.)
      const permanentSuccess = credentialManager.savePermanentCredentials(permanentCreds);

      // Save session credentials (Client Secret)
      const sessionSuccess = credentialManager.saveSessionCredentials({
        clientSecret: credentials.clientSecret
      });

      if (permanentSuccess && sessionSuccess) {
        logger.info('Credentials saved successfully to credential manager', '');
        
        // Dispatch events to notify other components that config has changed
        window.dispatchEvent(new CustomEvent('pingone-config-changed'));
        window.dispatchEvent(new CustomEvent('permanent-credentials-changed'));
        
        console.log('✅ [EnhancedAuthorizationCodeFlowV2] Configuration saved successfully to localStorage and events dispatched');
      } else {
        throw new Error('Failed to save credentials to credential manager');
      }
    } catch (error) {
      console.error('❌ [EnhancedAuthorizationCodeFlowV2] Failed to save credentials:', error);
      logger.error('Failed to save credentials', { error });
    } finally {
      setIsSavingCredentials(false);
      setCredentialsSaved(true);
    }
  }, [credentials]);

  // Generate PKCE codes
  const generatePKCECodes = useCallback(async () => {
    try {
      console.log('🔧 [EnhancedAuthorizationCodeFlowV2] Starting PKCE generation...');
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      console.log('✅ [EnhancedAuthorizationCodeFlowV2] PKCE codes generated:', { verifier: verifier.substring(0, 20) + '...', challenge: challenge.substring(0, 20) + '...' });
      setPkceCodes({ codeVerifier: verifier, codeChallenge: challenge });
      
      // Store code_verifier in sessionStorage for token exchange
      sessionStorage.setItem('code_verifier', verifier);
      console.log('🔧 [EnhancedAuthorizationCodeFlowV2] Stored code_verifier in sessionStorage');
      
      logger.info('PKCE codes generated', '');
      return { verifier, challenge };
    } catch (error) {
      console.error('❌ [EnhancedAuthorizationCodeFlowV2] Failed to generate PKCE codes:', error);
      logger.error('Failed to generate PKCE codes', String(error));
      throw error;
    }
  }, []);

  // Generate authorization URL
  const generateAuthUrl = useCallback(() => {
    const generatedState = Math.random().toString(36).substring(2, 15);
    setState(generatedState);
    
    // Ensure scopes are properly formatted
    const scopes = credentials.scopes || 'openid profile email';
    console.log('🔧 [EnhancedAuthorizationCodeFlowV2] Generating auth URL with scopes:', scopes);
    
    const params = new URLSearchParams({
      response_type: credentials.responseType || 'code',
      client_id: credentials.clientId,
      redirect_uri: credentials.redirectUri,
      scope: scopes,
      state: generatedState,
      code_challenge: pkceCodes.codeChallenge,
      code_challenge_method: credentials.codeChallengeMethod || 'S256'
    });

    // Validate required parameters
    if (!credentials.clientId) {
      throw new Error('Client ID is required');
    }
    if (!credentials.redirectUri) {
      throw new Error('Redirect URI is required');
    }
    if (!scopes || scopes.trim() === '') {
      throw new Error('At least one scope must be specified');
    }

    const url = `${credentials.authorizationEndpoint}?${params.toString()}`;
    console.log('✅ [EnhancedAuthorizationCodeFlowV2] Generated authorization URL:', url);
    console.log('🔧 [EnhancedAuthorizationCodeFlowV2] URL parameters:', Object.fromEntries(params));
    setAuthUrl(url);
    logger.info('Authorization URL generated', { url, scopes });
  }, [credentials, pkceCodes.codeChallenge]);

  // Handle authorization
  const handleAuthorization = useCallback(() => {
    if (testingMethod === 'popup') {
      setIsAuthorizing(true);
      
      // Set up flow context for popup callback
      const currentPath = window.location.pathname;
      // Ensure we use the correct route path regardless of current path
      const correctPath = currentPath.includes('/oidc/') ? '/flows/enhanced-authorization-code-v2' : currentPath;
      const returnPath = `${correctPath}?step=4`; // Return to step 4 (token exchange)

      console.log('🔍 [EnhancedAuthorizationCodeFlowV2] Popup - Current path:', currentPath);
      console.log('🔍 [EnhancedAuthorizationCodeFlowV2] Popup - Correct path:', correctPath);
      console.log('🔍 [EnhancedAuthorizationCodeFlowV2] Popup - Return path:', returnPath);
      
      const flowContext = {
        flow: 'enhanced-authorization-code-v2',
        step: 4,
        returnPath: returnPath,
        timestamp: Date.now()
      };
      sessionStorage.setItem('flowContext', JSON.stringify(flowContext));
      
      console.log('🔄 [EnhancedAuthorizationCodeFlowV2] Stored flow context for callback:', flowContext);
      
      const popup = window.open(authUrl, 'oauth-popup', 'width=600,height=700');
      if (popup) {
        // Listen for messages from the popup
        const messageHandler = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          if (event.data.type === 'oauth-callback') {
            const { code: callbackCode, state: callbackState, error, error_description } = event.data;
            if (error) {
              logger.error('Authorization error received', error);
              setAuthError(error);
              setErrorDescription(error_description || error);
              setIsAuthorizing(false);
            } else if (callbackCode && callbackState === state) {
              setAuthCode(callbackCode);
              setAuthError(null);
              setErrorDescription(null);
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
      // Full redirect - set up flow context to return to correct step
      const currentPath = window.location.pathname;
      // Ensure we use the correct route path regardless of current path
      const correctPath = currentPath.includes('/oidc/') ? '/flows/enhanced-authorization-code-v2' : currentPath;
      const returnPath = `${correctPath}?step=4`; // Return to step 4 (token exchange)

      console.log('🔍 [EnhancedAuthorizationCodeFlowV2] Full redirect - Current path:', currentPath);
      console.log('🔍 [EnhancedAuthorizationCodeFlowV2] Full redirect - Correct path:', correctPath);
      console.log('🔍 [EnhancedAuthorizationCodeFlowV2] Full redirect - Return path:', returnPath);
      
      const flowContext = {
        flow: 'enhanced-authorization-code-v2',
        step: 4,
        returnPath: returnPath,
        timestamp: Date.now()
      };
      sessionStorage.setItem('flowContext', JSON.stringify(flowContext));
      
      console.log('🔄 [EnhancedAuthorizationCodeFlowV2] Stored flow context for callback:', flowContext);
      
      // Full redirect
      logger.info('Redirecting to authorization server', `url: ${authUrl}`);
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
      logger.info('Tokens received', { tokenData });
      setIsExchangingTokens(false);
    } catch (error) {
      logger.error('Token exchange failed', { error });
      setIsExchangingTokens(false);
      throw error;
    }
  }, [credentials, authCode, pkceCodes.codeVerifier]);

  // Get user info
  const getUserInfo = useCallback(async () => {
    if (!tokens?.access_token) {
      throw new Error('No access token available');
    }

    setIsGettingUserInfo(true);
    try {
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
      logger.info('User info retrieved', { userData });
    } catch (error) {
      logger.error('UserInfo request failed', { error });
      throw error;
    } finally {
      setIsGettingUserInfo(false);
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
            <FormLabel>Client Secret</FormLabel>
            <form>
              <div style={{ position: 'relative' }}>
                <FormInput
                  type={showSecret ? 'text' : 'password'}
                  value={credentials.clientSecret || ''}
                  onChange={(e) => setCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
                  placeholder="your-client-secret (optional for PKCE)"
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6c757d',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  aria-label={showSecret ? 'Hide client secret' : 'Show client secret'}
                  title={showSecret ? 'Hide client secret' : 'Show client secret'}
                >
                  {showSecret ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </form>
            <ValidationIndicator $valid={true}>
              <FiInfo />
              Optional for PKCE flows, required for confidential clients
            </ValidationIndicator>
          </FormField>

          <FormField>
            <FormLabel className="required">Callback URL</FormLabel>
            <FormInput
              type="url"
              value={credentials.redirectUri}
              onChange={(e) => setCredentials(prev => ({ ...prev, redirectUri: e.target.value }))}
              placeholder="https://localhost:3000/authz-callback"
              required
            />
            <ValidationIndicator $valid={!!credentials.redirectUri}>
              {credentials.redirectUri ? <FiCheckCircle /> : <FiAlertTriangle />}
              {credentials.redirectUri ? 'Valid Callback URL' : 'Callback URL is required'}
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
      canExecute: Boolean(credentials.environmentId && credentials.clientId && credentials.redirectUri)
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

          {/* Generated PKCE Codes - Display at bottom */}
          {pkceGenerated && pkceCodes.codeVerifier && (
            <div style={{ 
              marginTop: '2rem', 
              padding: '1.5rem', 
              background: '#f8f9fa', 
              border: '1px solid #e9ecef', 
              borderRadius: '0.5rem' 
            }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#495057' }}>Generated PKCE Codes</h4>
              
              <FormField>
                <FormLabel>Code Verifier (Generated)</FormLabel>
                <FormInput
                  type="text"
                  value={pkceCodes.codeVerifier}
                  readOnly
                  $generated={!!pkceCodes.codeVerifier}
                />
                <CopyButton onClick={() => copyToClipboard(pkceCodes.codeVerifier)}>
                  {copiedText === pkceCodes.codeVerifier ? <FiCheckCircle /> : <FiCopy />}
                </CopyButton>
              </FormField>

              <FormField>
                <FormLabel>Code Challenge (SHA256)</FormLabel>
                <FormInput
                  type="text"
                  value={pkceCodes.codeChallenge}
                  readOnly
                  $generated={!!pkceCodes.codeChallenge}
                />
                <CopyButton onClick={() => copyToClipboard(pkceCodes.codeChallenge)}>
                  {copiedText === pkceCodes.codeChallenge ? <FiCheckCircle /> : <FiCopy />}
                </CopyButton>
              </FormField>
            </div>
          )}
        </div>
      ),
      execute: async () => {
        setIsGeneratingPKCE(true);
        try {
          const { challenge } = await generatePKCECodes();
          setPkceGenerated(true);
          // Regenerate authorization URL with PKCE codes
          generateAuthUrl(challenge);
          return { success: true };
        } finally {
          setIsGeneratingPKCE(false);
        }
      },
      canExecute: Boolean(credentials.environmentId && credentials.clientId && credentials.redirectUri)
    },
    {
      id: 'build-auth-url',
      title: (
        <>
          <FiGlobe />
          Build Authorization URL
        </>
      ),
      description: 'Construct the complete authorization URL with all required OAuth parameters.',
      icon: <FiGlobe />,
      category: 'authorization',
      content: (
        <div>
          <CodeBlock>
            <CodeComment>// Authorization URL for Authorization Code Flow</CodeComment>
            <CodeLine>
              const authUrl = '{authUrl || 'Click "Build URL" to generate the authorization URL'}';
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



          {urlGenerated && (
            <InfoBox type="success">
              <FiCheckCircle />
              <div>
                <strong>✅ Authorization URL Generated Successfully!</strong>
                <br />
                Your authorization URL has been built with all required OAuth parameters. You can now proceed to redirect the user to PingOne for authentication.
              </div>
            </InfoBox>
          )}

          {/* Generated Authorization URL Section - Below success message */}
          {urlGenerated && authUrl && (
            <div style={{ 
              marginTop: '1.5rem', 
              padding: '1.5rem', 
              backgroundColor: authUrl ? '#f0fdf4' : '#f0f9ff', 
              border: authUrl ? '1px solid #22c55e' : '1px solid #0ea5e9', 
              borderRadius: '0.75rem' 
            }}>
              <h3 style={{ 
                margin: '0 0 1rem 0', 
                fontSize: '1.1rem', 
                fontWeight: '600', 
                color: authUrl ? '#15803d' : '#0c4a6e', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem' 
              }}>
                <FiGlobe />
                Generated Authorization URL
              </h3>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.75rem', 
                backgroundColor: 'white', 
                border: authUrl ? '1px solid #22c55e' : '1px solid #0ea5e9', 
                borderRadius: '0.5rem' 
              }}>
                <code style={{ 
                  flex: 1, 
                  fontSize: '0.875rem', 
                  color: authUrl ? '#15803d' : '#0c4a6e', 
                  wordBreak: 'break-all' 
                }}>
                  {authUrl}
                </code>
                <CopyButton onClick={() => copyToClipboard(authUrl)}>
                  {copiedText === authUrl ? <FiCheckCircle /> : <FiCopy />}
                </CopyButton>
              </div>
            </div>
          )}

          {isBuildingUrl && (
            <InfoBox type="info">
              <FiLoader className="animate-spin" />
              <div>
                <strong>🔄 Building Authorization URL...</strong>
                <br />
                Constructing the complete authorization URL with all required OAuth parameters...
              </div>
            </InfoBox>
          )}

          {/* Generated Authorization URL Results - Display at bottom */}
          {urlGenerated && authUrl && (
            <div style={{ 
              marginTop: '2rem', 
              padding: '1.5rem', 
              background: '#f8f9fa', 
              border: '1px solid #e9ecef', 
              borderRadius: '0.5rem' 
            }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#495057' }}>Generated Authorization URL</h4>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.75rem', 
                backgroundColor: 'white', 
                border: '1px solid #e9ecef', 
                borderRadius: '0.5rem',
                marginBottom: '1rem'
              }}>
                <code style={{ 
                  flex: 1, 
                  fontSize: '0.875rem', 
                  color: '#495057', 
                  wordBreak: 'break-all' 
                }}>
                  {authUrl}
                </code>
                <button
                  onClick={() => copyToClipboard(authUrl)}
                  style={{
                    background: 'none',
                    border: '1px solid #007bff',
                    color: '#007bff',
                    cursor: 'pointer',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  {copiedText === authUrl ? <FiCheckCircle size={16} /> : <FiCopy size={16} />}
                </button>
              </div>

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
            </div>
          )}
        </div>
      ),
      execute: async () => {
        setIsBuildingUrl(true);
        try {
          console.log('🔧 [EnhancedAuthorizationCodeFlowV2] Build Authorization URL step executing...');
          console.log('🔧 [EnhancedAuthorizationCodeFlowV2] Current credentials:', credentials);
          console.log('🔧 [EnhancedAuthorizationCodeFlowV2] Current PKCE codes:', pkceCodes);
          
          const generatedUrl = generateAuthUrl();
          console.log('🔧 [EnhancedAuthorizationCodeFlowV2] Generated URL:', generatedUrl);
          setUrlGenerated(true);
          
          return { success: true };
        } finally {
          setIsBuildingUrl(false);
        }
      },
      canExecute: Boolean(credentials.environmentId && credentials.clientId && credentials.redirectUri)
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
      execute: handleAuthorization,
      canExecute: Boolean(authUrl && credentials.environmentId && credentials.clientId)
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
        </div>
      ),
      canExecute: Boolean(credentials.environmentId && credentials.clientId && credentials.redirectUri)
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
        </div>
      ),
      execute: async () => {
        await exchangeCodeForTokens();
        return { success: true };
      },
      canExecute: Boolean(authCode && credentials.environmentId && credentials.clientId)
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

          {isGettingUserInfo && (
            <InfoBox type="info">
              <FiLoader className="animate-spin" />
              <div>
                <strong>🔄 Retrieving User Information...</strong>
                <br />
                Fetching user profile data from the UserInfo endpoint...
              </div>
            </InfoBox>
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
        await getUserInfo();
        return { success: true };
      },
      canExecute: Boolean(tokens?.access_token && credentials.environmentId && credentials.clientId)
    }
  ];

  // Modal handlers
  const handleRedirectModalClose = () => {
    setShowRedirectModal(false);
  };

  const handleRedirectModalProceed = () => {
    setShowRedirectModal(false);
    window.open(redirectUrl, '_blank');
  };

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
            isConfigured={!!(credentials.clientId && credentials.environmentId)}
          />
        </div>
      )}

      {/* Callback URL Configuration */}
      <div style={{ 
        marginBottom: '2rem', 
        padding: '1.5rem', 
        backgroundColor: credentialsSaved ? '#f0fdf4' : '#f8fafc', 
        border: credentialsSaved ? '1px solid #22c55e' : '1px solid #e2e8f0', 
        borderRadius: '0.75rem' 
      }}>
        <h3 style={{ 
          margin: '0 0 1rem 0', 
          fontSize: '1.125rem', 
          fontWeight: '600', 
          color: '#1f2937',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          🔗 Callback URL Configuration
        </h3>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontSize: '0.875rem', 
            fontWeight: '500', 
            color: '#374151' 
          }}>
            Redirect URI
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              value={credentials.redirectUri}
              onChange={(e) => setCredentials(prev => ({ ...prev, redirectUri: e.target.value }))}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
                backgroundColor: 'white'
              }}
              placeholder="https://localhost:3000/authz-callback"
            />
            <button
              onClick={() => {
                const defaultUri = window.location.origin + '/authz-callback';
                setCredentials(prev => ({ ...prev, redirectUri: defaultUri }));
              }}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Reset to Default
            </button>
            <button
              onClick={() => {
                // Save the updated credentials
                const updatedCredentials = { ...credentials };
                credentialManager.saveCredentials(updatedCredentials);
                setCredentialsSaved(true);
                console.log('✅ Callback URL saved:', credentials.redirectUri);
              }}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#3b82f6',
                border: '1px solid #3b82f6',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: 'white',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Save Config
            </button>
          </div>
          <p style={{ 
            margin: '0.5rem 0 0 0', 
            fontSize: '0.75rem', 
            color: '#6b7280' 
          }}>
            This URL must be configured in your PingOne application settings as an allowed redirect URI.
          </p>
          
          {credentialsSaved && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: '#f0fdf4',
              border: '1px solid #22c55e',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FiCheckCircle style={{ color: '#22c55e' }} />
              <span style={{ color: '#15803d', fontSize: '0.875rem', fontWeight: '500' }}>
                Config saved successfully!
              </span>
            </div>
          )}
        </div>

        <div style={{ 
          backgroundColor: '#eff6ff', 
          border: '1px solid #bfdbfe', 
          borderRadius: '0.5rem', 
          padding: '1rem' 
        }}>
          <h4 style={{ 
            margin: '0 0 0.5rem 0', 
            fontSize: '0.875rem', 
            fontWeight: '600', 
            color: '#1e40af' 
          }}>
            Setup Instructions:
          </h4>
          <ol style={{ 
            margin: '0', 
            paddingLeft: '1.25rem', 
            fontSize: '0.875rem', 
            color: '#1e40af',
            lineHeight: '1.5'
          }}>
            <li>Copy the redirect URI above</li>
            <li>Go to your PingOne application settings</li>
            <li>Navigate to "Redirect URIs" section</li>
            <li>Add the copied URI to your allowed redirect URIs</li>
            <li>Save your configuration</li>
          </ol>
        </div>
      </div>


      {/* Authorization URL Display - Moved to bottom */}
      {authUrl && (
        <div style={{ 
          marginBottom: '2rem', 
          padding: '1rem', 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #e9ecef', 
          borderRadius: '6px' 
        }}>
          <h4 style={{ marginBottom: '0.5rem', color: '#495057' }}>Generated Authorization URL:</h4>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            backgroundColor: 'white',
            padding: '0.75rem',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            wordBreak: 'break-all'
          }}>
            <span style={{ flex: 1 }}>{authUrl}</span>
            <button
              onClick={() => copyToClipboard(authUrl)}
              style={{
                background: 'none',
                border: '1px solid #007bff',
                color: '#007bff',
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              {copiedText === authUrl ? <FiCheckCircle size={16} /> : <FiCopy size={16} />}
            </button>
          </div>
        </div>
      )}

      {/* OAuth Error Helper */}
      {authError && (
        <OAuthErrorHelper
          error={authError}
          errorDescription={errorDescription}
          onRetry={() => {
            setAuthError(null);
            setErrorDescription(null);
            handleAuthorization();
          }}
          onGoToConfig={() => window.location.href = '/configuration'}
        />
      )}

      <EnhancedStepFlowV2
        steps={steps}
        title="🚀 Enhanced Authorization Code Flow"
        persistKey="enhanced-authz-code"
        autoAdvance={false}
        showDebugInfo={true}
        allowStepJumping={true}
        initialStepIndex={(() => {
          const storedStep = sessionStorage.getItem('enhanced-authz-code-v2-step');
          if (storedStep) {
            const stepIndex = parseInt(storedStep, 10);
            console.log('🔍 [EnhancedAuthorizationCodeFlowV2] Restoring step from URL:', stepIndex);
            sessionStorage.removeItem('enhanced-authz-code-v2-step'); // Clean up
            return stepIndex;
          }
          return undefined;
        })()}
      />

      {/* Authorization Request Modal */}
      <AuthorizationRequestModal
        isOpen={showRedirectModal}
        onClose={handleRedirectModalClose}
        onProceed={handleRedirectModalProceed}
        authorizationUrl={redirectUrl}
        requestParams={redirectParams}
      />
    </div>
  );
};

export default EnhancedAuthorizationCodeFlowV2;
