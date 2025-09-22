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
  FiLoader,
  FiEye,
  FiEyeOff,
  FiChevronDown,
  FiSave,
  FiRefreshCw
} from 'react-icons/fi';
import EnhancedStepFlowV2, { EnhancedFlowStep } from '../../components/EnhancedStepFlowV2';
import AuthorizationRequestModal from '../../components/AuthorizationRequestModal';
import { generateCodeVerifier, generateCodeChallenge } from '../../utils/oauth';
import { credentialManager } from '../../utils/credentialManager';
import { logger } from '../../utils/logger';
import { usePageScroll } from '../../hooks/usePageScroll';
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

// Collapsible Credentials Section
const CollapsibleSection = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  background: white;
  overflow: hidden;
`;

const CollapsibleHeader = styled.button`
  width: 100%;
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border: none;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background: #f3f4f6;
  }
  
  &:focus {
    outline: 2px solid #3b82f6;
    outline-offset: -2px;
  }
`;

const CollapsibleTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  color: #1f2937;
  font-size: 1rem;
`;

const CollapsibleIcon = styled.div<{ $isOpen: boolean }>`
  color: #6b7280;
  transition: transform 0.2s;
  transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const CollapsibleContent = styled.div<{ $isOpen: boolean }>`
  max-height: ${props => props.$isOpen ? '2000px' : '0'};
  overflow: hidden;
  opacity: ${props => props.$isOpen ? '1' : '0'};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
  padding: ${props => props.$isOpen ? '1.5rem' : '0'};
`;

// Button Components
const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  
  ${props => props.$variant === 'primary' ? `
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
    
    &:hover:not(:disabled) {
      background: #2563eb;
      border-color: #2563eb;
    }
  ` : `
    background: white;
    color: #374151;
    
    &:hover:not(:disabled) {
      background: #f9fafb;
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const ToggleButton = styled.button`
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #6b7280;
  transition: all 0.2s;
  
  &:hover {
    background: #f9fafb;
    color: #374151;
  }
`;

// Main Component
const AuthorizationCodeFlow: React.FC = () => {
  // Centralized scroll management - ALL pages start at top
  usePageScroll({ pageName: 'Authorization Code Flow', force: true });
  
  const { config } = useAuth();
  const [showConfig, setShowConfig] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);
  
  // Debug log for initial state
  console.log('AuthorizationCodeFlow: showCredentials initial state:', showCredentials);
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
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [isGeneratingPKCE, setIsGeneratingPKCE] = useState<boolean>(false);
  const [isGettingUserInfo, setIsGettingUserInfo] = useState<boolean>(false);
  const [hasAttemptedAuthorization, setHasAttemptedAuthorization] = useState<boolean>(false);
  const [showRedirectModal, setShowRedirectModal] = useState<boolean>(false);
  const [redirectUrl, setRedirectUrl] = useState<string>('');
  const [redirectParams, setRedirectParams] = useState<Record<string, string>>({});

  // Clear authUrl and related states on component mount, then load credentials
  useEffect(() => {
    setAuthUrl('');
    setAuthUrlGenerated(false);
    setState('');
    setAuthCode('');
    setTokens(null);
    setUserInfo(null);
    setPkceGenerated(false);
    setHasAttemptedAuthorization(false);
    
    // Clear persisted step history to ensure clean start
    try {
      localStorage.removeItem('enhanced-flow-enhanced-authz-code');
      console.log('🧹 [AuthorizationCodeFlow] Cleared persisted step history');
    } catch (error) {
      console.warn('⚠️ [AuthorizationCodeFlow] Could not clear persisted history:', error);
    }
    
    // Load credentials immediately to ensure buttons are enabled
    const loadCredentials = () => {
      try {
        // Debug localStorage contents
        credentialManager.debugLocalStorage();
        
        const allCredentials = credentialManager.getAllCredentials();
        console.log('🔧 [AuthorizationCodeFlow] Loading credentials:', allCredentials);
        
        setCredentials(prev => ({ 
          ...prev, 
          environmentId: allCredentials.environmentId || '',
          clientId: allCredentials.clientId || '',
          clientSecret: allCredentials.clientSecret || '',
          redirectUri: window.location.origin + '/authz-callback',
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
    console.log('🧹 [AuthorizationCodeFlow] Cleared all flow states and loaded credentials on mount');
  }, []);

  // Listen for credential changes
  useEffect(() => {
    const handleCredentialChange = () => {
      const loadCredentials = () => {
        try {
          const allCredentials = credentialManager.getAllCredentials();
          console.log('🔧 [AuthorizationCodeFlow] Reloading credentials after change:', allCredentials);
          
          setCredentials(prev => ({ 
            ...prev, 
            environmentId: allCredentials.environmentId || '',
            clientId: allCredentials.clientId || '',
            clientSecret: allCredentials.clientSecret || '',
            redirectUri: window.location.origin + '/authz-callback',
            scopes: Array.isArray(allCredentials.scopes) ? allCredentials.scopes.join(' ') : allCredentials.scopes || prev.scopes,
            authorizationEndpoint: allCredentials.authEndpoint || prev.authorizationEndpoint,
            tokenEndpoint: allCredentials.tokenEndpoint || prev.tokenEndpoint,
            userInfoEndpoint: allCredentials.userInfoEndpoint || prev.userInfoEndpoint
          }));
        } catch (error) {
          logger.warn('Failed to reload credentials from credential manager', String(error));
        }
      };
      
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

  // Load credentials
  const loadCredentials = useCallback(() => {
    try {
      // Debug localStorage contents
      credentialManager.debugLocalStorage();
      
      const allCredentials = credentialManager.getAllCredentials();
      console.log('🔧 [AuthorizationCodeFlow] Loading credentials:', allCredentials);
      
      setCredentials(prev => ({ 
        ...prev, 
        environmentId: allCredentials.environmentId || '',
        clientId: allCredentials.clientId || '',
        clientSecret: allCredentials.clientSecret || '',
        redirectUri: window.location.origin + '/authz-callback',
        scopes: Array.isArray(allCredentials.scopes) ? allCredentials.scopes.join(' ') : allCredentials.scopes || prev.scopes,
        authorizationEndpoint: allCredentials.authEndpoint || prev.authorizationEndpoint,
        tokenEndpoint: allCredentials.tokenEndpoint || prev.tokenEndpoint,
        userInfoEndpoint: allCredentials.userInfoEndpoint || prev.userInfoEndpoint
      }));
      
      console.log('✅ [AuthorizationCodeFlow] Credentials loaded successfully');
      logger.info('Credentials loaded', '');
    } catch (error) {
      console.error('❌ [AuthorizationCodeFlow] Failed to load credentials:', error);
      logger.error('Failed to load credentials', String(error));
    }
  }, []);

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
      
      // Store code_verifier in sessionStorage for token exchange
      sessionStorage.setItem('code_verifier', verifier);
      console.log('🔧 [AuthorizationCodeFlow] Stored code_verifier in sessionStorage');
      
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
    
    // Store state in sessionStorage for callback validation
    sessionStorage.setItem('oauth_state', generatedState);
    console.log('🔧 [AuthorizationCodeFlow] Stored state in sessionStorage:', generatedState);
    
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
    return url; // Return the URL so it can be used immediately
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

  // Modal handlers
  const handleRedirectModalClose = useCallback(() => {
    setShowRedirectModal(false);
  }, []);

  const handleRedirectModalProceed = useCallback(() => {
    if (testingMethod === 'popup') {
      setIsAuthorizing(true);
      
      // Set up flow context for popup callback
      const currentPath = window.location.pathname;
      // Ensure we use the correct route path regardless of current path
      const correctPath = currentPath.includes('/oidc/') ? '/flows/authorization-code' : currentPath;
      const returnPath = `${correctPath}?step=4`; // Return to step 4 (token exchange)
      
      console.log('🔍 [AuthorizationCodeFlow] Popup - Current path:', currentPath);
      console.log('🔍 [AuthorizationCodeFlow] Popup - Correct path:', correctPath);
      console.log('🔍 [AuthorizationCodeFlow] Popup - Return path:', returnPath);
      
      const flowContext = {
        flow: 'authorization-code',
        step: 4,
        returnPath: returnPath,
        timestamp: Date.now()
      };
      sessionStorage.setItem('flowContext', JSON.stringify(flowContext));
      
      console.log('🔄 [AuthorizationCodeFlow] Stored flow context for popup callback:', flowContext);
      console.log('🔍 [AuthorizationCodeFlow] Popup - Flow context stored in sessionStorage:', sessionStorage.getItem('flowContext'));
      console.log('🔧 [AuthorizationCodeFlow] Opening popup with URL:', redirectUrl);
      const popup = window.open(redirectUrl, 'oauth-popup', 'width=600,height=700');
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
      // Full redirect - set up flow context to return to correct step
      const currentPath = window.location.pathname;
      // Ensure we use the correct route path regardless of current path
      const correctPath = currentPath.includes('/oidc/') ? '/flows/authorization-code' : currentPath;
      const returnPath = `${correctPath}?step=4`; // Return to step 4 (token exchange)
      
      console.log('🔍 [AuthorizationCodeFlow] Current path:', currentPath);
      console.log('🔍 [AuthorizationCodeFlow] Correct path:', correctPath);
      console.log('🔍 [AuthorizationCodeFlow] Return path:', returnPath);
      
      // Store flow context for callback
      const flowContext = {
        flow: 'authorization-code',
        step: 4,
        returnPath: returnPath,
        timestamp: Date.now()
      };
      sessionStorage.setItem('flowContext', JSON.stringify(flowContext));
      
      console.log('🔄 [AuthorizationCodeFlow] Stored flow context for callback:', flowContext);
      console.log('🔍 [AuthorizationCodeFlow] Flow context stored in sessionStorage:', sessionStorage.getItem('flowContext'));
      logger.info('Redirecting to authorization server', `url: ${redirectUrl}`);
      window.location.href = redirectUrl;
    }
  }, [redirectUrl, testingMethod, state, authCode]);


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
      canExecute: Boolean(credentials.clientId && credentials.environmentId && credentials.clientSecret)
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

          {/* PKCE Fields - Always visible, populated when generated */}
          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1.5rem', 
            backgroundColor: pkceCodes.codeVerifier ? '#f0fdf4' : '#f8f9fa', 
            border: pkceCodes.codeVerifier ? '1px solid #22c55e' : '1px solid #e5e7eb', 
            borderRadius: '0.75rem' 
          }}>
            <h3 style={{ 
              margin: '0 0 1rem 0', 
              fontSize: '1.1rem', 
              fontWeight: '600', 
              color: pkceCodes.codeVerifier ? '#15803d' : '#374151', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem' 
            }}>
              <FiShield />
              PKCE Codes
            </h3>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <FormField>
                <FormLabel>Code Verifier (Generated)</FormLabel>
                <FormInput
                  type="text"
                  value={pkceCodes.codeVerifier || ''}
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
                  value={pkceCodes.codeChallenge || ''}
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
            </div>
          </div>

        </div>
      ),
      execute: async () => {
        const { challenge } = await generatePKCECodes();
        // Regenerate authorization URL with PKCE codes
        generateAuthUrl(challenge);
        return { success: true };
      },
      canExecute: Boolean(credentials.clientId && credentials.environmentId && credentials.authorizationEndpoint)
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

          {authUrlGenerated && authUrl && (
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

          {authUrlGenerated && authUrl && (
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

          {/* Generated Authorization URL Section - Below success message */}
          {authUrlGenerated && authUrl && (
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
        </div>
      ),
      execute: async () => {
        generateAuthUrl();
        return { success: true };
      },
      canExecute: Boolean(credentials.clientId && credentials.environmentId && credentials.authorizationEndpoint)
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

          {/* Action Buttons */}
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setHasAttemptedAuthorization(true);
                
                // Parse URL to extract parameters for the modal
                const urlObj = new URL(authUrl);
                const params: Record<string, string> = {};
                urlObj.searchParams.forEach((value, key) => {
                  params[key] = value;
                });
                
                // Set modal data and show modal
                console.log('🔓 [AuthorizationCodeFlow] Opening redirect modal with URL:', authUrl);
                setRedirectUrl(authUrl);
                setRedirectParams(params);
                setShowRedirectModal(true);
              }}
              disabled={!authUrl || isAuthorizing}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: testingMethod === 'popup' ? '#3b82f6' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: !authUrl || isAuthorizing ? 'not-allowed' : 'pointer',
                opacity: !authUrl || isAuthorizing ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {testingMethod === 'popup' ? '🪟 Open Popup' : '🌐 Redirect to PingOne'}
            </button>

            <button
              onClick={() => copyToClipboard(authUrl)}
              disabled={!authUrl}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: copiedText === authUrl ? '#10b981' : '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: !authUrl ? 'not-allowed' : 'pointer',
                opacity: !authUrl ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background-color 0.2s ease'
              }}
            >
              {copiedText === authUrl ? <FiCheckCircle /> : <FiCopy />}
              {copiedText === authUrl ? 'Copied!' : 'Copy URL'}
            </button>
          </div>
        </div>
      ),
      execute: async () => {
        // Generate the authorization URL and open popup/redirect
        console.log('🔧 [AuthorizationCodeFlow] Build Authorization URL step executing...');
        console.log('🔧 [AuthorizationCodeFlow] Current credentials:', credentials);
        console.log('🔧 [AuthorizationCodeFlow] Current PKCE codes:', pkceCodes);
        
        const generatedUrl = generateAuthUrl();
        console.log('🔧 [AuthorizationCodeFlow] Generated URL:', generatedUrl);
        
        // Use the generated URL directly for authorization
        if (testingMethod === 'popup') {
          setIsAuthorizing(true);
          console.log('🔧 [AuthorizationCodeFlow] Opening popup with URL:', generatedUrl);
          const popup = window.open(generatedUrl, 'oauth-popup', 'width=600,height=700');
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
          console.log('🔧 [AuthorizationCodeFlow] Full redirect triggered', { generatedUrl, testingMethod });
          logger.info('Redirecting to authorization server', `url: ${generatedUrl}`);
          window.location.href = generatedUrl;
        }
        
        return { success: true };
      },
      canExecute: Boolean(authUrl && authUrl.trim().length > 0 && hasAttemptedAuthorization)
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
      canExecute: Boolean(authCode && authCode.trim().length > 0)
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
      <CallbackUrlDisplay flowType="authorization-code" />

      {/* Collapsible OAuth Credentials Section */}
      <CollapsibleSection>
        <CollapsibleHeader onClick={() => {
          console.log('Toggling showCredentials from', showCredentials, 'to', !showCredentials);
          setShowCredentials(!showCredentials);
        }}>
          <CollapsibleTitle>
            <FiSettings />
            Setup OAuth Credentials
          </CollapsibleTitle>
          <CollapsibleIcon $isOpen={showCredentials}>
            <FiChevronDown />
          </CollapsibleIcon>
        </CollapsibleHeader>
        <CollapsibleContent $isOpen={showCredentials}>
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
                placeholder="your-client-id"
                required
              />
              <ValidationIndicator $valid={!!credentials.clientId}>
                {credentials.clientId ? <FiCheckCircle /> : <FiAlertTriangle />}
                {credentials.clientId ? 'Valid Client ID' : 'Client ID is required'}
              </ValidationIndicator>
            </FormField>

            <FormField>
              <FormLabel>Client Secret (Optional for Public Clients)</FormLabel>
              <FormInput
                type={showClientSecret ? 'text' : 'password'}
                value={credentials.clientSecret}
                onChange={(e) => setCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
                placeholder="your-client-secret"
              />
              <ValidationIndicator $valid={true}>
                <FiCheckCircle />
                {credentials.clientSecret ? 'Client Secret provided' : 'Public client (no secret required)'}
              </ValidationIndicator>
              <ToggleButton onClick={() => setShowClientSecret(!showClientSecret)}>
                {showClientSecret ? <FiEyeOff /> : <FiEye />}
                {showClientSecret ? 'Hide' : 'Show'} Secret
              </ToggleButton>
            </FormField>

            <FormField>
              <FormLabel className="required">Redirect URI</FormLabel>
              <FormInput
                type="text"
                value={credentials.redirectUri}
                onChange={(e) => setCredentials(prev => ({ ...prev, redirectUri: e.target.value }))}
                placeholder="https://your-app.com/callback"
                required
              />
              <ValidationIndicator $valid={!!credentials.redirectUri}>
                {credentials.redirectUri ? <FiCheckCircle /> : <FiAlertTriangle />}
                {credentials.redirectUri ? 'Valid Redirect URI' : 'Redirect URI is required'}
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
              <ValidationIndicator $valid={!!credentials.scopes}>
                <FiCheckCircle />
                {credentials.scopes || 'Using default scopes'}
              </ValidationIndicator>
            </FormField>

            <ButtonGroup>
              <Button 
                onClick={saveCredentials}
                disabled={isSavingCredentials || !credentials.environmentId || !credentials.clientId}
                $variant="primary"
              >
                {isSavingCredentials ? <FiLoader className="animate-spin" /> : <FiSave />}
                {isSavingCredentials ? 'Saving...' : 'Save Credentials'}
              </Button>
              
              <Button 
                onClick={loadCredentials}
                $variant="secondary"
              >
                <FiRefreshCw />
                Load Saved
              </Button>
            </ButtonGroup>

            {credentials.environmentId && (
              <InfoBox type="info" style={{ marginTop: '1rem' }}>
                <FiInfo />
                <div>
                  <strong>Auto-generated endpoints:</strong>
                  <br />
                  Authorization: {credentials.authorizationEndpoint}
                  <br />
                  Token: {credentials.tokenEndpoint}
                  <br />
                  UserInfo: {credentials.userInfoEndpoint}
                </div>
              </InfoBox>
            )}
          </div>
        </CollapsibleContent>
      </CollapsibleSection>

      <EnhancedStepFlowV2
        steps={steps}
        title="🚀 Enhanced Authorization Code Flow"
        persistKey="enhanced-authz-code"
        autoAdvance={false}
        showDebugInfo={true}
        allowStepJumping={true}
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

export default AuthorizationCodeFlow;
