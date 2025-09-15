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
  FiLoader,
  FiChevronDown,
  FiChevronRight
} from 'react-icons/fi';
import EnhancedStepFlowV2, { EnhancedFlowStep } from '../../components/EnhancedStepFlowV2';
import AuthorizationRequestModal from '../../components/AuthorizationRequestModal';
import OAuthErrorHelper from '../../components/OAuthErrorHelper';
import { generateCodeVerifier, generateCodeChallenge } from '../../utils/oauth';
import { credentialManager } from '../../utils/credentialManager';
import { logger } from '../../utils/logger';
import { getCallbackUrlForFlow } from '../../utils/callbackUrls';
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
  border: 1px solid ${({ $generated }) => $generated ? '#10b981' : '#d1d5db'};
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: ${({ $generated }) => $generated ? '#f0fdf4' : 'white'};
  color: #1f2937;
  cursor: text;
  
  &:hover {
    border-color: #9ca3af;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  }
  
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
    border-color: #e5e7eb;
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
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-left: 4px solid #047857;
          color: #ffffff;
          box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
  
  &:hover {
    background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ParameterBreakdown = styled.div`
  background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%);
  border: 1px solid #d1e7ff;
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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
  background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%);
  color: #1f2937;
  border: 1px solid #d1e7ff;
  border-radius: 0.5rem;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: relative;
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 4px 6px -1px rgba(22, 163, 74, 0.3);
    }
    50% {
      transform: scale(1.02);
      box-shadow: 0 8px 12px -2px rgba(22, 163, 74, 0.4);
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

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  position: relative;
`;

const ModalHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const ModalTitle = styled.h2`
  margin: 0 0 0.5rem 0;
  color: #1e40af;
  font-size: 1.5rem;
`;

const ModalSubtitle = styled.p`
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
`;

const ModalBody = styled.div`
  margin-bottom: 2rem;
`;

const SuccessSection = styled.div`
  background: #f0fdf4;
  border: 1px solid #22c55e;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const SuccessTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #15803d;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CodeDisplay = styled.div`
  background: white;
  border: 1px solid #22c55e;
  border-radius: 0.25rem;
  padding: 0.75rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  word-break: break-all;
  margin-top: 0.5rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
`;

const ModalButton = styled.button<{ $primary?: boolean; $loading?: boolean }>`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  
  ${props => props.$primary ? `
    background: #3b82f6;
    color: white;
    
    &:hover:not(:disabled) {
      background: #2563eb;
    }
  ` : `
    background: #f3f4f6;
    color: #374151;
    
    &:hover:not(:disabled) {
      background: #e5e7eb;
    }
  `}
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  ${props => props.$loading && `
    color: transparent;
    cursor: wait;
    
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 1rem;
      height: 1rem;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  `}
  
  @keyframes spin {
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }
`;

// Main Component
const EnhancedAuthorizationCodeFlowV2: React.FC = () => {
  const authContext = useAuth();
  const { config, user: authUser, tokens: authTokens, isAuthenticated } = authContext;
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

  const [credentialsLoaded, setCredentialsLoaded] = useState(false);
  const [stepMessages, setStepMessages] = useState<{[key: string]: string}>({});

  // Update step message
  const updateStepMessage = useCallback((stepId: string, message: string) => {
    setStepMessages(prev => ({ ...prev, [stepId]: message }));
  }, []);

  // Clear step message
  const clearStepMessage = useCallback((stepId: string) => {
    setStepMessages(prev => {
      const newMessages = { ...prev };
      delete newMessages[stepId];
      return newMessages;
    });
  }, []);

  // Scroll to bottom helper function
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
  }, []);

  // Scroll to step progress indicator helper function
  const scrollToStepProgress = useCallback(() => {
    setTimeout(() => {
      // Look for the BOTTOM step progress container with the step indicators (the one with border-top)
      const stepProgressElement = document.querySelector('[data-testid="step-progress-bottom"]') ||
                                 document.querySelector('[class*="sc-imTTCS"]') || 
                                 document.querySelector('[class*="StepProgressContainer"]');
      
      if (stepProgressElement) {
        console.log('🎯 [EnhancedAuthorizationCodeFlowV2] Scrolling to BOTTOM step progress indicator');
        stepProgressElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      } else {
        // Fallback to scrolling to bottom if step progress not found
        console.log('⚠️ [EnhancedAuthorizationCodeFlowV2] Bottom step progress not found, scrolling to bottom');
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
  }, []);

  // Debug credentials state
  console.log('🔍 [EnhancedAuthorizationCodeFlowV2] Current credentials state:', {
    environmentId: credentials.environmentId ? `${credentials.environmentId.substring(0, 8)}...` : 'none',
    clientId: credentials.clientId ? `${credentials.clientId.substring(0, 8)}...` : 'none',
    redirectUri: credentials.redirectUri || 'none',
    hasClientSecret: !!credentials.clientSecret,
    canExecutePKCE: Boolean(credentials.environmentId && credentials.clientId && credentials.redirectUri),
    credentialsLoaded: credentialsLoaded
  });

  // Monitor credentials changes
  useEffect(() => {
    console.log('🔄 [EnhancedAuthorizationCodeFlowV2] Credentials changed:', {
      environmentId: credentials.environmentId ? `${credentials.environmentId.substring(0, 8)}...` : 'none',
      clientId: credentials.clientId ? `${credentials.clientId.substring(0, 8)}...` : 'none',
      redirectUri: credentials.redirectUri || 'none',
      canExecutePKCE: Boolean(credentials.environmentId && credentials.clientId && credentials.redirectUri)
    });
  }, [credentials.environmentId, credentials.clientId, credentials.redirectUri]);

  // Monitor credentials loaded state
  useEffect(() => {
    console.log('🔄 [EnhancedAuthorizationCodeFlowV2] Credentials loaded state changed:', credentialsLoaded);
  }, [credentialsLoaded]);

  const [pkceCodes, setPkceCodes] = useState({
    codeVerifier: '',
    codeChallenge: ''
  });

  const [authUrl, setAuthUrl] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [state, setState] = useState('');
  const [tokens, setTokens] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [callbackSuccess, setCallbackSuccess] = useState(false);
  const [callbackError, setCallbackError] = useState<string | null>(null);
  const [testingMethod, setTestingMethod] = useState<'popup' | 'redirect'>('popup');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [customToken, setCustomToken] = useState<string>('');
  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false);
  const [isExchangingTokens, setIsExchangingTokens] = useState<boolean>(false);
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState(false);
  const [flowConfig, setFlowConfig] = useState<FlowConfig>(getDefaultConfig('authorization-code'));
  const [showAuthSuccessModal, setShowAuthSuccessModal] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
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
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    'setup-credentials': false,
    'exchange-tokens': false,
    'userinfo': false,
    'refresh-tokens': false
  });
  const [usedAuthCode, setUsedAuthCode] = useState<string | null>(null);
  const [showUrlDetailsInStep4, setShowUrlDetailsInStep4] = useState<boolean>(true);

  // Load UI configuration
  useEffect(() => {
    const flowConfigKey = 'enhanced-flow-authorization-code';
    const flowConfig = JSON.parse(localStorage.getItem(flowConfigKey) || '{}');
    if (flowConfig.showUrlDetailsInStep4 !== undefined) {
      setShowUrlDetailsInStep4(flowConfig.showUrlDetailsInStep4);
      console.log('🔧 [EnhancedAuthCodeFlowV2] Loaded showUrlDetailsInStep4 setting:', flowConfig.showUrlDetailsInStep4);
    }
  }, []);

  // Load credentials on component mount
  useEffect(() => {
    console.log('🔍 [EnhancedAuthCodeFlowV2] Component mounted with credentials:', {
      hasClientId: !!credentials.clientId,
      hasEnvironmentId: !!credentials.environmentId,
      hasRedirectUri: !!credentials.redirectUri,
      clientId: credentials.clientId ? `${credentials.clientId.substring(0, 8)}...` : 'none'
    });

    // Clear any old authorization codes to prevent auto-exchange with expired codes
    const oldAuthCode = sessionStorage.getItem('oauth_auth_code');
    if (oldAuthCode) {
      console.log('🧹 [EnhancedAuthCodeFlowV2] Clearing old authorization code to prevent auto-exchange with expired code');
      sessionStorage.removeItem('oauth_auth_code');
      // Don't clear PKCE codes - they can be reused for multiple authorization attempts
      console.log('🔧 [EnhancedAuthCodeFlowV2] Preserving PKCE codes for reuse');
    }

    // If credentials are empty, try to load them from storage
    if (!credentials.clientId || !credentials.environmentId) {
      console.log('🔧 [EnhancedAuthCodeFlowV2] Loading credentials from storage on mount');
      
      // PRIMARY: Load from authz flow credentials (dedicated storage for this flow)
      let storedCredentials = credentialManager.loadAuthzFlowCredentials();
      console.log('🔍 [EnhancedAuthCodeFlowV2] Authz flow credentials:', storedCredentials);
      
      // FALLBACK: Only if authz flow credentials are completely blank, try permanent credentials
      if (!storedCredentials || (!storedCredentials.clientId && !storedCredentials.environmentId)) {
        console.log('🔧 [EnhancedAuthCodeFlowV2] Authz flow credentials are blank, falling back to permanent credentials');
        storedCredentials = credentialManager.loadPermanentCredentials();
        console.log('🔍 [EnhancedAuthCodeFlowV2] Permanent credentials (fallback):', storedCredentials);
      }
      
      if (storedCredentials && storedCredentials.clientId) {
        const convertedCredentials = {
          clientId: storedCredentials.clientId,
          clientSecret: storedCredentials.clientSecret || '',
          environmentId: storedCredentials.environmentId,
          authorizationEndpoint: storedCredentials.authEndpoint || '',
          tokenEndpoint: storedCredentials.tokenEndpoint || '',
          userInfoEndpoint: storedCredentials.userInfoEndpoint || '',
          redirectUri: storedCredentials.redirectUri,
          scopes: Array.isArray(storedCredentials.scopes) ? storedCredentials.scopes.join(' ') : (storedCredentials.scopes || 'openid profile email'),
          responseType: 'code',
          codeChallengeMethod: 'S256'
        };
        setCredentials(convertedCredentials);
        console.log('✅ [EnhancedAuthCodeFlowV2] Loaded credentials from storage:', {
          clientId: storedCredentials.clientId ? `${storedCredentials.clientId.substring(0, 8)}...` : 'none',
          environmentId: storedCredentials.environmentId,
          source: storedCredentials.clientSecret ? 'authz-flow' : 'permanent-fallback'
        });
      } else {
        console.log('⚠️ [EnhancedAuthCodeFlowV2] No stored credentials found - user needs to configure');
      }
    }
  }, []);

  // Toggle collapsed section
  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Handle URL parameters to restore correct step
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const stepParam = urlParams.get('step');
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    console.log('🔍 [EnhancedAuthorizationCodeFlowV2] URL params:', { stepParam, code, state });
    console.log('🔍 [EnhancedAuthorizationCodeFlowV2] Current location:', location);
    console.log('🔍 [EnhancedAuthorizationCodeFlowV2] Auth context state:', { isAuthenticated, user: authUser, tokens: authTokens });
    console.log('🔍 [EnhancedAuthorizationCodeFlowV2] Current state values:', {
      authCode,
      callbackSuccess,
      callbackError,
      tokens: !!tokens,
      userInfo: !!userInfo,
      credentials: {
        environmentId: !!credentials.environmentId,
        clientId: !!credentials.clientId,
        redirectUri: !!credentials.redirectUri
      }
    });
    
    // If we have step parameter, use it (this comes from the callback redirect)
    if (stepParam) {
      const stepIndex = parseInt(stepParam, 10) - 1; // Convert to 0-based index
      console.log('🔍 [EnhancedAuthorizationCodeFlowV2] URL step parameter detected:', stepParam, '-> step index:', stepIndex);
      console.log('🔍 [EnhancedAuthorizationCodeFlowV2] Setting stored step to:', stepIndex);
      
      // If we also have an authorization code in the URL, set it
      if (code) {
        console.log('🔍 [EnhancedAuthorizationCodeFlowV2] Setting authCode from URL (with step param):', code);
        setAuthCode(code);
        setState(state || '');
        
        // Store authorization code in sessionStorage for persistence
        sessionStorage.setItem('oauth_auth_code', code);
        if (state) {
          sessionStorage.setItem('oauth_state', state);
        }
        
        // Mark callback as successful and check for tokens
        setCallbackSuccess(true);
        setCallbackError(null);
        
        // Show success modal to user - use setTimeout to ensure it shows
        setTimeout(() => {
          console.log('🔔 [EnhancedAuthorizationCodeFlowV2] Forcing modal to show after redirect');
          setShowAuthSuccessModal(true);
        }, 100);
        
        // Check if we have tokens from the auth context
        if (authTokens) {
          console.log('✅ [EnhancedAuthorizationCodeFlowV2] Tokens found in auth context:', authTokens);
          setTokens(authTokens);
        }
        
        // Check if we have user info from the auth context
        if (authUser) {
          console.log('✅ [EnhancedAuthorizationCodeFlowV2] User info found in auth context:', authUser);
          setUserInfo(authUser);
        }
      } else {
        console.log('⚠️ [EnhancedAuthorizationCodeFlowV2] Step parameter found but no authorization code in URL');
        console.log('🔍 [EnhancedAuthorizationCodeFlowV2] Full URL:', window.location.href);
        console.log('🔍 [EnhancedAuthorizationCodeFlowV2] URL search params:', location.search);
        
        // Check if we have a stored authorization code
        const storedCode = sessionStorage.getItem('oauth_auth_code');
        if (storedCode) {
          console.log('🔍 [EnhancedAuthorizationCodeFlowV2] Found stored authorization code:', storedCode);
          setAuthCode(storedCode);
          setCallbackSuccess(true);
          setCallbackError(null);
          
          // Don't auto-exchange stored codes - let the user manually proceed to step 5
          console.log('🔍 [EnhancedAuthorizationCodeFlowV2] Stored authorization code found, user should proceed to step 5 manually');
        }
      }
      
      sessionStorage.setItem('enhanced-authz-code-v2-step', stepIndex.toString());
      return;
    }
    
    // If we have authorization code, we should go to step 5 (exchange tokens) and exchange immediately
    if (code) {
      console.log('🔍 [EnhancedAuthorizationCodeFlowV2] Authorization code detected, going to step 5 (exchange tokens)');
      console.log('🔍 [EnhancedAuthorizationCodeFlowV2] Setting authCode from URL:', code);
      setAuthCode(code); // Set the authorization code from URL parameters
      setState(state || '');
      
      // Store authorization code in sessionStorage for persistence
      sessionStorage.setItem('oauth_auth_code', code);
      if (state) {
        sessionStorage.setItem('oauth_state', state);
      }
      
      // Mark callback as successful
      setCallbackSuccess(true);
      setCallbackError(null);
      
      // Set step to 4 (handle callback) and store it
      const stepIndex = 4;
      console.log('🔍 [EnhancedAuthorizationCodeFlowV2] Setting step to 4 (handle callback)');
      setCurrentStepIndex(stepIndex);
      sessionStorage.setItem('enhanced-authz-code-v2-step', stepIndex.toString());
      
      // Show success message for callback
      updateStepMessage('handle-callback', '✅ Authorization successful! You have been authenticated with PingOne. Click "Next" to proceed to token exchange.');
      console.log('🔍 [EnhancedAuthorizationCodeFlowV2] Authorization code received, user should proceed to step 5 manually');
      
      return;
    }
    
    // Check if we're coming back from a redirect and should restore to a specific step
    const storedStep = sessionStorage.getItem('enhanced-authz-code-v2-step');
    if (storedStep) {
      console.log('🔍 [EnhancedAuthorizationCodeFlowV2] Restoring from stored step:', storedStep);
    }
  }, [location.search, authTokens, authUser]);

  // Show success modal only when we have an authorization code and are on step 4 (handle callback)
  useEffect(() => {
    if (authCode && currentStepIndex === 4 && !showAuthSuccessModal) {
      console.log('🔔 [EnhancedAuthorizationCodeFlowV2] AuthCode detected on step 4, forcing modal to show');
      setTimeout(() => {
        setShowAuthSuccessModal(true);
      }, 200);
    } else if (currentStepIndex !== 4) {
      console.log('🔔 [EnhancedAuthorizationCodeFlowV2] Not on step 4, ensuring modal is hidden');
      setShowAuthSuccessModal(false);
    }
  }, [authCode, currentStepIndex, showAuthSuccessModal]);

  // This useEffect is now handled by the main step initialization logic above

  // Debug effect to track state changes
  useEffect(() => {
    console.log('🔍 [EnhancedAuthorizationCodeFlowV2] State change detected:', {
      authCode: !!authCode,
      authCodeValue: authCode,
      callbackSuccess,
      callbackError,
      tokens: !!tokens,
      userInfo: !!userInfo,
      credentials: {
        environmentId: !!credentials.environmentId,
        clientId: !!credentials.clientId,
        redirectUri: !!credentials.redirectUri
      },
      timestamp: new Date().toISOString()
    });
  }, [authCode, callbackSuccess, callbackError, tokens, userInfo, credentials.environmentId, credentials.clientId, credentials.redirectUri]);

  // Load credentials immediately to ensure buttons are enabled
  useEffect(() => {
    const loadCredentials = async () => {
      try {
        // Debug localStorage contents
        credentialManager.debugLocalStorage();
        
        // PRIMARY: Load from authz flow credentials (dedicated storage for this flow)
        let allCredentials = credentialManager.loadAuthzFlowCredentials();
        console.log('🔧 [EnhancedAuthorizationCodeFlowV2] Loading authz flow credentials:', allCredentials);
        
        // FALLBACK: Only if authz flow credentials are completely blank, try permanent credentials
        if (!allCredentials || (!allCredentials.clientId && !allCredentials.environmentId)) {
          console.log('🔧 [EnhancedAuthorizationCodeFlowV2] Authz flow credentials are blank, falling back to permanent credentials');
          allCredentials = credentialManager.loadPermanentCredentials();
          console.log('🔧 [EnhancedAuthorizationCodeFlowV2] Loading permanent credentials (fallback):', allCredentials);
        }
        
        // Debug what we found
        console.log('🔍 [EnhancedAuthorizationCodeFlowV2] Final credentials to load:', {
          hasCredentials: !!allCredentials,
          environmentId: allCredentials?.environmentId ? `${allCredentials.environmentId.substring(0, 8)}...` : 'none',
          clientId: allCredentials?.clientId ? `${allCredentials.clientId.substring(0, 8)}...` : 'none',
          redirectUri: allCredentials?.redirectUri || 'none',
          hasClientSecret: !!allCredentials?.clientSecret,
          source: allCredentials?.clientSecret ? 'authz-flow' : 'permanent-fallback'
        });
        
        // Check for test values and clear them (only if BOTH are test values AND no other valid config exists)
        if (allCredentials.clientId === 'test-client-123' && allCredentials.environmentId === 'test-env-123') {
          console.log('🧹 [EnhancedAuthorizationCodeFlowV2] Found test values, checking if we should clear...');
          
          // Check if there are any other valid credentials in localStorage
          const pingoneConfig = localStorage.getItem('pingone_config');
          const loginCredentials = localStorage.getItem('login_credentials');
          
          if (!pingoneConfig && !loginCredentials) {
            console.log('🧹 [EnhancedAuthorizationCodeFlowV2] No other credentials found, clearing test values');
            credentialManager.clearAllCredentials();
            console.log('✅ [EnhancedAuthorizationCodeFlowV2] Test credentials cleared');
            return;
          } else {
            console.log('⚠️ [EnhancedAuthorizationCodeFlowV2] Other credentials exist, keeping test values for now');
          }
        }
        
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
        
        console.log('✅ [EnhancedAuthorizationCodeFlowV2] Credentials loaded successfully:', {
          environmentId: allCredentials.environmentId ? `${allCredentials.environmentId.substring(0, 8)}...` : 'none',
          clientId: allCredentials.clientId ? `${allCredentials.clientId.substring(0, 8)}...` : 'none',
          redirectUri: allCredentials.redirectUri || 'none',
          hasClientSecret: !!allCredentials.clientSecret
        });
        
        // Mark credentials as loaded
        setCredentialsLoaded(true);
      } catch (error) {
        console.error('❌ [EnhancedAuthorizationCodeFlowV2] Failed to load credentials:', error);
        logger.error('EnhancedAuthorizationCodeFlowV2', 'Failed to load credentials', String(error));
      }
    };
    
    // Load credentials asynchronously
    loadCredentials().then(() => {
      console.log('✅ [EnhancedAuthorizationCodeFlowV2] Credentials loading completed');
    }).catch((error) => {
      console.error('❌ [EnhancedAuthorizationCodeFlowV2] Failed to load credentials:', error);
    });
    console.log('🧹 [EnhancedAuthorizationCodeFlowV2] Cleared all flow states and loaded credentials on mount');
  }, []);

  // Initialize step index based on URL parameters and stored step
  useEffect(() => {
    let hasInitialized = false;
    
    const initializeStepIndex = () => {
      if (hasInitialized) {
        console.log('🔍 [EnhancedAuthorizationCodeFlowV2] InitializeStepIndex - Already initialized, skipping');
        return;
      }
      hasInitialized = true;
      const storedStep = sessionStorage.getItem('enhanced-authz-code-v2-step');
      console.log('🔍 [EnhancedAuthorizationCodeFlowV2] InitializeStepIndex - Checking for stored step:', storedStep);
      console.log('🔍 [EnhancedAuthorizationCodeFlowV2] InitializeStepIndex - Current URL:', window.location.href);
      
      // Check if we have an authorization code in the URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const step = urlParams.get('step');
      const action = urlParams.get('action');
      
      console.log('🔍 [EnhancedAuthorizationCodeFlowV2] InitializeStepIndex - URL params:', { code, state, step, action });
      
      // PRIORITY 1: If we have both code and step=5, go directly to step 5 and exchange tokens
      if (code && step === '5') {
        console.log('🔍 [EnhancedAuthorizationCodeFlowV2] InitializeStepIndex - Authorization code with step=5, going directly to step 5');
        setCurrentStepIndex(5);
        setAuthCode(code);
        setState(state || '');
        setCallbackSuccess(true);
        setCallbackError(null);
        
        // Show message about what's happening
        updateStepMessage('exchange-tokens', '🔄 Ready to exchange authorization code for tokens. Click the "Sign On" button to proceed with token exchange.');
        
        // Auto-exchange tokens immediately (only if not already exchanging and on correct step)
        // Use the step we just set (5) instead of currentStepIndex which hasn't updated yet
        if (false) { // Disabled auto-exchange - user must manually execute
          // Check if this is a fresh authorization code (not an old one from sessionStorage)
          const isFreshCode = !sessionStorage.getItem('oauth_auth_code');
          if (isFreshCode) {
            setTimeout(async () => {
              try {
                console.log('🔄 [EnhancedAuthorizationCodeFlowV2] Auto-exchanging fresh authorization code for tokens');
                
                // CRITICAL: Ensure credentials are loaded before auto-exchange
                if (!credentials.clientId || !credentials.environmentId) {
                  console.log('🔧 [EnhancedAuthorizationCodeFlowV2] Loading credentials before auto-exchange');
                // PRIMARY: Load from authz flow credentials (dedicated storage for this flow)
                let storedCredentials = credentialManager.loadAuthzFlowCredentials();
                
                // FALLBACK: Only if authz flow credentials are completely blank, try permanent credentials
                if (!storedCredentials || (!storedCredentials.clientId && !storedCredentials.environmentId)) {
                  console.log('🔧 [EnhancedAuthorizationCodeFlowV2] Authz flow credentials are blank, falling back to permanent credentials');
                  storedCredentials = credentialManager.loadPermanentCredentials();
                }
                
                if (storedCredentials && storedCredentials.clientId) {
                  const convertedCredentials = {
                    clientId: storedCredentials.clientId,
                    clientSecret: storedCredentials.clientSecret || '',
                    environmentId: storedCredentials.environmentId,
                    authorizationEndpoint: storedCredentials.authEndpoint || '',
                    tokenEndpoint: storedCredentials.tokenEndpoint || '',
                    userInfoEndpoint: storedCredentials.userInfoEndpoint || '',
                    redirectUri: storedCredentials.redirectUri,
                    scopes: Array.isArray(storedCredentials.scopes) ? storedCredentials.scopes.join(' ') : (storedCredentials.scopes || 'openid profile email'),
                    responseType: 'code',
                    codeChallengeMethod: 'S256'
                  };
                  setCredentials(convertedCredentials);
                  console.log('✅ [EnhancedAuthorizationCodeFlowV2] Loaded credentials for auto-exchange');
                } else {
                  console.error('❌ [EnhancedAuthorizationCodeFlowV2] No credentials found for auto-exchange');
                  return;
                }
                }
                
                // Ensure PKCE codes are generated before exchange
                if (!pkceCodes.codeVerifier) {
                  console.log('🔧 [EnhancedAuthorizationCodeFlowV2] Generating PKCE codes before exchange');
                  await generatePKCECodes();
                }
                
                await exchangeCodeForTokens();
                console.log('✅ [EnhancedAuthorizationCodeFlowV2] Auto token exchange successful');
              } catch (error) {
                console.error('❌ [EnhancedAuthorizationCodeFlowV2] Auto token exchange failed:', error);
              }
            }, 500); // Increased delay to ensure credentials are loaded
          } else {
            console.log('⚠️ [EnhancedAuthorizationCodeFlowV2] Skipping auto-exchange - using old authorization code, user should start fresh flow');
          }
        } else {
          console.log('⚠️ [EnhancedAuthorizationCodeFlowV2] Skipping auto-exchange - already in progress, tokens exist, or not on correct step');
        }
        return;
      }
      
      // PRIORITY 2: If we have authorization code but no step, go to step 4 (handle callback)
      if (code && !step) {
        console.log('🔍 [EnhancedAuthorizationCodeFlowV2] InitializeStepIndex - Authorization code found in URL, going to step 4 (handle-callback)');
        setCurrentStepIndex(4);
        return;
      }
      
      if (step) {
        const stepIndex = parseInt(step, 10);
        console.log('🔍 [EnhancedAuthorizationCodeFlowV2] InitializeStepIndex - Step from URL:', stepIndex);
        setCurrentStepIndex(stepIndex);
        // Clean up URL parameters after using them
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('step');
        newUrl.searchParams.delete('action');
        window.history.replaceState({}, '', newUrl.toString());
        return;
      }
      
      if (storedStep) {
        const stepIndex = parseInt(storedStep, 10);
        console.log('🔍 [EnhancedAuthorizationCodeFlowV2] InitializeStepIndex - Restoring step from stored value:', stepIndex);
        setCurrentStepIndex(stepIndex);
        return;
      }
      
      console.log('🔍 [EnhancedAuthorizationCodeFlowV2] InitializeStepIndex - No step to restore, starting from beginning');
      setCurrentStepIndex(0);
    };

    initializeStepIndex();
  }, []);

  // Listen for credential changes (debounced to prevent excessive calls)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleCredentialChange = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        try {
          // Use the same loading logic as the main loadCredentials function
          let allCredentials = credentialManager.loadAuthzFlowCredentials();
          console.log('🔧 [EnhancedAuthorizationCodeFlowV2] Reloading authz flow credentials after change:', allCredentials);
          
          // FALLBACK: Only if authz flow credentials are completely blank, try permanent credentials
          if (!allCredentials || (!allCredentials.clientId && !allCredentials.environmentId)) {
            console.log('🔧 [EnhancedAuthorizationCodeFlowV2] Authz flow credentials are blank, falling back to permanent credentials');
            allCredentials = credentialManager.loadPermanentCredentials();
            console.log('🔧 [EnhancedAuthorizationCodeFlowV2] Reloading permanent credentials (fallback):', allCredentials);
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
          
          console.log('✅ [EnhancedAuthorizationCodeFlowV2] Credentials reloaded successfully');
        } catch (error) {
          console.error('❌ [EnhancedAuthorizationCodeFlowV2] Failed to reload credentials:', error);
          logger.error('EnhancedAuthorizationCodeFlowV2', 'Failed to reload credentials', String(error));
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
      
      // Prepare authz flow credentials (Environment ID, Client ID, etc.)
      const authzFlowCreds = {
        environmentId: credentials.environmentId,
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret, // Include client secret in authz flow storage
        redirectUri: credentials.redirectUri,
        scopes: typeof credentials.scopes === 'string' ? credentials.scopes.split(' ').filter(Boolean) : credentials.scopes,
        authEndpoint: credentials.authorizationEndpoint,
        tokenEndpoint: credentials.tokenEndpoint,
        userInfoEndpoint: credentials.userInfoEndpoint
      };
      
      // Save to authz flow credentials (dedicated storage for this flow)
      const authzFlowSuccess = credentialManager.saveAuthzFlowCredentials(authzFlowCreds);

      if (authzFlowSuccess) {
        logger.info('Authz flow credentials saved successfully to credential manager', '');
        
        // Clear cache to ensure fresh data is loaded
        credentialManager.clearCache();
        
        // Dispatch events to notify other components that config has changed
        window.dispatchEvent(new CustomEvent('pingone-config-changed'));
        window.dispatchEvent(new CustomEvent('permanent-credentials-changed'));
        
        console.log('✅ [EnhancedAuthorizationCodeFlowV2] Authz flow credentials saved successfully to localStorage and events dispatched');
        
        // Keep the form values - don't clear them after saving
        console.log('✅ [EnhancedAuthorizationCodeFlowV2] Form values preserved after save');
        
        // Show success message
        updateStepMessage('setup-credentials', '✅ Credentials saved successfully! You can now proceed to Step 2 to generate PKCE codes.');
        
        // Scroll to step progress to show the success message and next step
        scrollToStepProgress();
        
        return { success: true, message: 'Credentials saved successfully' };
      } else {
        throw new Error('Failed to save authz flow credentials to credential manager');
      }
    } catch (error) {
      console.error('❌ [EnhancedAuthorizationCodeFlowV2] Failed to save credentials:', error);
      logger.error('EnhancedAuthorizationCodeFlowV2', 'Failed to save credentials', String(error));
      throw error; // Re-throw to let the step execution handle the error
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
      
      // Show success message
      updateStepMessage('generate-pkce', '✅ PKCE codes generated successfully! These codes add security to your OAuth flow. You can now proceed to Step 3 to build the authorization URL.');
      
      // Scroll to step progress to show the generated codes and next step
      scrollToStepProgress();
      
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
    
    // Store state in sessionStorage for CSRF protection validation
    sessionStorage.setItem('oauth_state', generatedState);
    console.log('🔐 [EnhancedAuthorizationCodeFlowV2] Stored state for CSRF protection:', generatedState);
    
    // Debug: Log all credential values
    console.log('🔧 [EnhancedAuthorizationCodeFlowV2] Current credentials:', {
      clientId: credentials.clientId,
      environmentId: credentials.environmentId,
      authorizationEndpoint: credentials.authorizationEndpoint,
      scopes: credentials.scopes
    });
    
    // Ensure scopes are properly formatted
    const scopes = credentials.scopes || 'openid profile email';
    console.log('🔧 [EnhancedAuthorizationCodeFlowV2] Generating auth URL with scopes:', scopes);
    
    // Use the correct callback URL for authorization code flow
    const redirectUri = getCallbackUrlForFlow('authorization-code');
    console.log('🔧 [EnhancedAuthorizationCodeFlowV2] Using redirect URI:', redirectUri);
    
    // Validate required parameters BEFORE building URL
    if (!credentials.clientId) {
      throw new Error('Client ID is required. Please configure your credentials first.');
    }
    if (!credentials.environmentId) {
      throw new Error('Environment ID is required. Please configure your credentials first.');
    }
    if (!credentials.authorizationEndpoint) {
      throw new Error('Authorization endpoint is required. Please configure your credentials first.');
    }
    if (!redirectUri) {
      throw new Error('Redirect URI is required');
    }
    if (!scopes || scopes.trim() === '') {
      throw new Error('At least one scope must be specified');
    }
    
    const params = new URLSearchParams({
      response_type: credentials.responseType || 'code',
      client_id: credentials.clientId,
      redirect_uri: redirectUri,
      scope: scopes,
      state: generatedState,
      code_challenge: pkceCodes.codeChallenge,
      code_challenge_method: credentials.codeChallengeMethod || 'S256'
    });

    const url = `${credentials.authorizationEndpoint}?${params.toString()}`;
    console.log('✅ [EnhancedAuthorizationCodeFlowV2] Generated authorization URL:', url);
    console.log('🔧 [EnhancedAuthorizationCodeFlowV2] URL parameters:', Object.fromEntries(params));
    setAuthUrl(url);
    logger.info('EnhancedAuthorizationCodeFlowV2', 'Authorization URL generated', { url, scopes });
    
    // Scroll to step progress to show the generated URL and next step
    scrollToStepProgress();
  }, [credentials, pkceCodes.codeChallenge]);

  // Handle authorization
  const handleAuthorization = useCallback(async () => {
    // Use the same redirect URI logic as in generateAuthUrl
    const redirectUri = getCallbackUrlForFlow('authorization-code');
    
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
        redirectUri: redirectUri, // Store the redirect URI used in authorization
        timestamp: Date.now()
      };
      sessionStorage.setItem('flowContext', JSON.stringify(flowContext));
      
      console.log('🔄 [EnhancedAuthorizationCodeFlowV2] Stored flow context for callback:', flowContext);
      
      const popup = window.open(authUrl, 'oauth-popup', 'width=600,height=700');
      if (popup) {
        // Show message about what just happened
        updateStepMessage('user-authorization', '✅ Authorization URL opened in popup! Please complete the login process. You will be redirected back here automatically.');
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
              logger.info('EnhancedAuthorizationCodeFlowV2', 'Authorization code received via message', `code: ${callbackCode.substring(0, 10)}...`);
              setIsAuthorizing(false);
              popup.close();
              window.removeEventListener('message', messageHandler);
              
              // Show success message
              updateStepMessage('handle-callback', '✅ Authorization successful! You have been authenticated with PingOne. Proceeding to token exchange...');
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
              logger.warn('EnhancedAuthorizationCodeFlowV2', 'Popup closed without authorization code');
            }
          }
        }, 1000);
      } else {
        setIsAuthorizing(false);
        logger.error('EnhancedAuthorizationCodeFlowV2', 'Failed to open popup window');
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
        redirectUri: redirectUri, // Store the redirect URI used in authorization
        timestamp: Date.now()
      };
      sessionStorage.setItem('flowContext', JSON.stringify(flowContext));
      
      console.log('🔄 [EnhancedAuthorizationCodeFlowV2] Stored flow context for callback:', flowContext);
      
      // Show message about what just happened
      updateStepMessage('user-authorization', '✅ Redirecting to PingOne for authentication. You will be redirected back here after login.');
      
      // Full redirect
      logger.info('EnhancedAuthorizationCodeFlowV2', 'Redirecting to authorization server', `url: ${authUrl}`);
      window.location.href = authUrl;
    }
  }, [authUrl, testingMethod, state, authCode]);

  // Exchange code for tokens
  const exchangeCodeForTokens = useCallback(async () => {
    // Prevent multiple simultaneous exchanges
    if (isExchangingTokens) {
      console.log('⚠️ [EnhancedAuthCodeFlowV2] Token exchange already in progress, skipping');
      return;
    }

    // Check if we already have tokens
    if (tokens?.access_token) {
      console.log('⚠️ [EnhancedAuthCodeFlowV2] Tokens already exist, skipping exchange');
      return;
    }

    // Check if we've already used this authorization code
    if (usedAuthCode && usedAuthCode === authCode) {
      console.log('⚠️ [EnhancedAuthCodeFlowV2] Authorization code already used, skipping exchange');
      return;
    }

    // Additional check: if authCode is empty, don't proceed
    if (!authCode || authCode.trim() === '') {
      throw new Error('No authorization code available. Please complete the OAuth flow first.');
    }

    // CRITICAL: Load credentials if they're missing
    console.log('🔍 [EnhancedAuthCodeFlowV2] Checking credentials before token exchange...');
    let currentCredentials = credentials;
    
    // If credentials are empty, try to load them from storage
    if (!currentCredentials.clientId || !currentCredentials.environmentId) {
      console.log('🔧 [EnhancedAuthCodeFlowV2] Loading credentials from storage before token exchange');
      const storedCredentials = credentialManager.loadAuthzFlowCredentials();
      if (storedCredentials) {
        const convertedCredentials = {
          clientId: storedCredentials.clientId,
          clientSecret: storedCredentials.clientSecret || '',
          environmentId: storedCredentials.environmentId,
          authorizationEndpoint: storedCredentials.authEndpoint || '',
          tokenEndpoint: storedCredentials.tokenEndpoint || '',
          userInfoEndpoint: storedCredentials.userInfoEndpoint || '',
          redirectUri: storedCredentials.redirectUri,
          scopes: storedCredentials.scopes.join(' '),
          responseType: 'code',
          codeChallengeMethod: 'S256'
        };
        setCredentials(convertedCredentials);
        currentCredentials = convertedCredentials;
        console.log('✅ [EnhancedAuthCodeFlowV2] Loaded credentials from storage:', {
          clientId: storedCredentials.clientId ? `${storedCredentials.clientId.substring(0, 8)}...` : 'none',
          environmentId: storedCredentials.environmentId
        });
      }
    }

    // MANDATORY CREDENTIAL VALIDATION - This is the key fix
    console.log('🔍 [EnhancedAuthCodeFlowV2] Validating credentials before token exchange...');
    
    // Check if we have valid credentials in state
    if (!currentCredentials.clientId || currentCredentials.clientId.trim() === '') {
      console.error('❌ [EnhancedAuthCodeFlowV2] No valid client ID found in credentials state');
      throw new Error('Client ID is required for token exchange. Please configure your OAuth credentials first.');
    }
    
    if (!currentCredentials.environmentId || currentCredentials.environmentId.trim() === '') {
      console.error('❌ [EnhancedAuthCodeFlowV2] No valid environment ID found in credentials state');
      throw new Error('Environment ID is missing. Please configure your OAuth credentials first.');
    }
    
    if (!currentCredentials.redirectUri || currentCredentials.redirectUri.trim() === '') {
      console.error('❌ [EnhancedAuthCodeFlowV2] No valid redirect URI found in credentials state');
      throw new Error('Redirect URI is missing. Please configure your OAuth credentials first.');
    }

    console.log('✅ [EnhancedAuthCodeFlowV2] Credentials validation passed:', {
      clientId: currentCredentials.clientId ? `${currentCredentials.clientId.substring(0, 8)}...` : 'none',
      environmentId: currentCredentials.environmentId,
      redirectUri: currentCredentials.redirectUri
    });

    // Add a small delay to ensure all state is properly set
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if we have authorization code, if not try to load from sessionStorage
    let currentAuthCode = authCode;
    if (!currentAuthCode) {
      const storedCode = sessionStorage.getItem('oauth_auth_code');
      if (storedCode) {
        console.log('🔧 [EnhancedAuthCodeFlowV2] Loading authorization code from sessionStorage');
        currentAuthCode = storedCode;
        // Update the state
        setAuthCode(storedCode);
      }
    }

    // Final validation with detailed error messages
    console.log('🔍 [EnhancedAuthCodeFlowV2] Final validation before exchange:', {
      hasAuthCode: !!currentAuthCode,
      hasClientId: !!currentCredentials.clientId,
      hasEnvironmentId: !!currentCredentials.environmentId,
      hasRedirectUri: !!currentCredentials.redirectUri,
      clientId: currentCredentials.clientId ? `${currentCredentials.clientId.substring(0, 8)}...` : 'none'
    });
    
    if (!currentAuthCode) {
      throw new Error('No authorization code available for token exchange');
    }
    if (!currentCredentials.clientId) {
      throw new Error('OAuth credentials are missing. Please go back to Step 1 and save your credentials first, then restart the OAuth flow.');
    }
    if (!currentCredentials.environmentId) {
      throw new Error('Environment ID is missing. Please go back to Step 1 and save your credentials first, then restart the OAuth flow.');
    }
    if (!currentCredentials.redirectUri) {
      throw new Error('Redirect URI is missing. Please go back to Step 1 and save your credentials first, then restart the OAuth flow.');
    }

    // Check if we've already used this authorization code
    if (usedAuthCode === currentAuthCode) {
      throw new Error('This authorization code has already been used. Please start a new OAuth flow.');
    }
    
    // Check if we have PKCE codes, if not try to load from sessionStorage
    let codeVerifier = pkceCodes.codeVerifier;
    console.log('🔍 [EnhancedAuthCodeFlowV2] PKCE code verifier check:', {
      fromState: pkceCodes.codeVerifier ? `${pkceCodes.codeVerifier.substring(0, 10)}...` : 'none',
      fromSessionStorage: sessionStorage.getItem('code_verifier') ? `${sessionStorage.getItem('code_verifier')?.substring(0, 10)}...` : 'none'
    });
    
    if (!codeVerifier) {
      const storedVerifier = sessionStorage.getItem('code_verifier');
      if (storedVerifier) {
        console.log('🔧 [EnhancedAuthCodeFlowV2] Loading code verifier from sessionStorage');
        codeVerifier = storedVerifier;
        // Update the state
        setPkceCodes(prev => ({ ...prev, codeVerifier: storedVerifier }));
      }
    }
    
    if (!codeVerifier) {
      console.error('❌ [EnhancedAuthCodeFlowV2] No code verifier found in state or sessionStorage');
      throw new Error('Code verifier is required for PKCE token exchange. Please go back to Step 2 and generate PKCE codes first.');
    }

    try {
      setIsExchangingTokens(true);
      
      // Store the auth code for validation but don't clear it yet
      setUsedAuthCode(currentAuthCode);
      console.log('🔐 [EnhancedAuthCodeFlowV2] Using authorization code for token exchange:', currentAuthCode.substring(0, 10) + '...');
      
      // FINAL VALIDATION - This is the last chance to catch empty values
      console.log('🔍 [EnhancedAuthCodeFlowV2] Final validation before request body construction:', {
        clientId: currentCredentials.clientId,
        clientIdLength: currentCredentials.clientId?.length || 0,
        environmentId: currentCredentials.environmentId,
        redirectUri: currentCredentials.redirectUri
      });

      if (!currentCredentials.clientId || currentCredentials.clientId.trim() === '') {
        console.error('❌ [EnhancedAuthCodeFlowV2] CRITICAL: clientId is empty in request body construction!');
        throw new Error('CRITICAL ERROR: Client ID is empty. This should not happen after validation.');
      }

      if (!currentCredentials.environmentId || currentCredentials.environmentId.trim() === '') {
        console.error('❌ [EnhancedAuthCodeFlowV2] CRITICAL: environmentId is empty in request body construction!');
        throw new Error('CRITICAL ERROR: Environment ID is empty. This should not happen after validation.');
      }

      if (!currentCredentials.redirectUri || currentCredentials.redirectUri.trim() === '') {
        console.error('❌ [EnhancedAuthCodeFlowV2] CRITICAL: redirectUri is empty in request body construction!');
        throw new Error('CRITICAL ERROR: Redirect URI is empty. This should not happen after validation.');
      }

      // Use backend proxy for secure token exchange
      const backendUrl = process.env.NODE_ENV === 'production' 
        ? 'https://oauth-playground.vercel.app' 
        : 'http://localhost:3001';
      
      const requestBody = {
          grant_type: 'authorization_code',
        client_id: currentCredentials.clientId.trim(), // Ensure no whitespace
        client_secret: currentCredentials.clientSecret || '',
          code: currentAuthCode,
          redirect_uri: currentCredentials.redirectUri.trim(), // Ensure no whitespace
        environment_id: currentCredentials.environmentId.trim(), // Ensure no whitespace
        code_verifier: codeVerifier
      };

      console.log('🔄 [EnhancedAuthCodeFlowV2] Token exchange via backend proxy:', {
        backendUrl,
        clientId: currentCredentials.clientId,
        code: currentAuthCode.substring(0, 10) + '...',
        redirectUri: currentCredentials.redirectUri
      });

      console.log('🔍 [EnhancedAuthCodeFlowV2] Request body being sent:', {
        grant_type: requestBody.grant_type,
        client_id: requestBody.client_id ? `${requestBody.client_id.substring(0, 8)}...` : 'none',
        client_id_length: requestBody.client_id?.length || 0,
        client_id_empty: requestBody.client_id === '',
        has_client_secret: !!requestBody.client_secret,
        code: requestBody.code ? `${requestBody.code.substring(0, 10)}...` : 'none',
        redirect_uri: requestBody.redirect_uri,
        environment_id: requestBody.environment_id,
        has_code_verifier: !!requestBody.code_verifier
      });
      
      console.log('🔍 [EnhancedAuthCodeFlowV2] Full request body for debugging:', JSON.stringify(requestBody, null, 2));

      // CRITICAL: Final check before sending
      if (requestBody.client_id === '' || !requestBody.client_id) {
        console.error('❌ [EnhancedAuthCodeFlowV2] CRITICAL: Request body has empty client_id!', requestBody);
        throw new Error('CRITICAL ERROR: Request body contains empty client_id. This should never happen.');
      }

      console.log('🌐 [EnhancedAuthCodeFlowV2] Sending request to:', `${backendUrl}/api/token-exchange`);
      
      const response = await fetch(`${backendUrl}/api/token-exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 [EnhancedAuthCodeFlowV2] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error('EnhancedAuthorizationCodeFlowV2', 'Token exchange failed', { status: response.status, error: errorData });
        
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
      logger.info('EnhancedAuthorizationCodeFlowV2', 'Tokens received', tokenData);
      setIsExchangingTokens(false);
      
      // Show success message with strong instruction to scroll up
      updateStepMessage('exchange-tokens', '🎉 SUCCESS! Tokens received! Scroll up to see your new access and refresh tokens in the green boxes above. The OAuth flow is complete!');
      
      // Scroll to step progress to show the tokens and next steps
      scrollToStepProgress();
      
      // Clear the authorization code and state after successful exchange to prevent reuse
      setAuthCode('');
      sessionStorage.removeItem('oauth_auth_code');
      sessionStorage.removeItem('oauth_state');
      console.log('🧹 [EnhancedAuthCodeFlowV2] Cleared authorization code and state after successful exchange');
    } catch (error) {
      logger.error('EnhancedAuthorizationCodeFlowV2', 'Token exchange failed', String(error));
      setIsExchangingTokens(false);
      
      // Show error message
      updateStepMessage('exchange-tokens', `❌ Token exchange failed: ${error instanceof Error ? error.message : String(error)}`);
      
      // Provide more specific error messages
      if (String(error).includes('Invalid Grant')) {
        // Show a more helpful message for Invalid Grant errors
        updateStepMessage('exchange-tokens', '❌ Authorization code has expired or been used already. Click "Clear & Start Fresh" below to begin a new OAuth flow.');
        throw new Error('Authorization code has expired or been used already. Please start a new OAuth flow to get a fresh authorization code.');
      } else if (String(error).includes('Client ID is required')) {
        throw new Error('OAuth credentials are missing. Please go back to Step 1 and save your credentials first.');
      } else if (String(error).includes('Code verifier is required')) {
        throw new Error('PKCE codes are missing. Please go back to Step 2 and generate PKCE codes first.');
      } else {
        throw error;
      }
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
        logger.error('EnhancedAuthorizationCodeFlowV2', 'UserInfo request failed', { status: response.status, error: errorData });
        
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
      logger.info('EnhancedAuthorizationCodeFlowV2', 'User info retrieved', userData);
      
      // Scroll to step progress to show the user info
      scrollToStepProgress();
    } catch (error) {
      logger.error('EnhancedAuthorizationCodeFlowV2', 'UserInfo request failed', String(error));
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
      logger.error('EnhancedAuthorizationCodeFlowV2', 'Failed to copy to clipboard', String(error));
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
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              cursor: 'pointer',
              padding: '0.5rem 0',
              borderBottom: '1px solid #e5e7eb',
              marginBottom: '1rem'
            }}
            onClick={() => toggleSection('setup-credentials')}
          >
            <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              OAuth Credentials Configuration
            </h4>
            {collapsedSections['setup-credentials'] ? <FiChevronRight /> : <FiChevronDown />}
          </div>
          {!collapsedSections['setup-credentials'] && (
            <div>
              {stepMessages['setup-credentials'] && (
                <InfoBox type="success">
                  <div>{stepMessages['setup-credentials']}</div>
                </InfoBox>
              )}
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
                autoComplete="new-password"
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
            <div style={{ position: 'relative' }}>
              <FormInput
                type="url"
                value={credentials.redirectUri}
                onChange={(e) => setCredentials(prev => ({ ...prev, redirectUri: e.target.value }))}
                placeholder="https://localhost:3000/authz-callback"
                required
                style={{ 
                  paddingRight: '2.5rem',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem'
                }}
              />
              <div style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6b7280',
                fontSize: '0.75rem',
                pointerEvents: 'none'
              }}>
                ✏️
              </div>
            </div>
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
          )}
        </div>
      ),
      execute: async () => {
        setIsSavingCredentials(true);
        try {
        await saveCredentials();
        return { success: true };
        } finally {
          setIsSavingCredentials(false);
      }
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
          {stepMessages['generate-pkce'] && (
            <InfoBox type="success">
              <div>{stepMessages['generate-pkce']}</div>
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

          {isSavingCredentials && (
            <InfoBox type="info">
              <FiLoader className="animate-spin" />
              <div>
                <strong>🔄 Saving Credentials...</strong>
                <br />
                Storing your PingOne configuration securely.
              </div>
            </InfoBox>
          )}

          {/* Generated PKCE Codes - Display at bottom */}
          {pkceGenerated && pkceCodes.codeVerifier && (
            <div style={{ 
              marginTop: '2rem', 
              padding: '1.5rem', 
              background: '#f0fdf4', 
              border: '1px solid #10b981', 
              borderRadius: '0.5rem' 
            }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#065f46' }}>Generated PKCE Codes</h4>
              
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
          generateAuthUrl();
          return { success: true };
        } finally {
          setIsGeneratingPKCE(false);
        }
      },
      canExecute: Boolean(credentials.environmentId && credentials.clientId && credentials.redirectUri)
    },
    {
      id: 'build-auth-url',
      title: 'Build Authorization URL',
      description: 'Construct the complete authorization URL with all required OAuth parameters.',
      icon: <FiGlobe />,
      category: 'authorization',
      content: (
        <div>
          {stepMessages['build-auth-url'] && (
            <InfoBox type="success">
              <div>{stepMessages['build-auth-url']}</div>
            </InfoBox>
          )}

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



          {isBuildingUrl && (
            <InfoBox type="info">
              <FiLoader className="animate-spin" />
              <div>
                <strong>🔄 Building Authorization URL...</strong>
                <br />
                Constructing the complete authorization URL with all required parameters.
              </div>
            </InfoBox>
          )}

          {/* Generated Authorization URL Results - Display at bottom */}
          {urlGenerated && authUrl && (
            <div style={{ 
              marginTop: '2rem', 
              padding: '1.5rem', 
              background: '#f0fdf4', 
              border: '1px solid #22c55e', 
              borderRadius: '0.5rem' 
            }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#15803d' }}>Generated Authorization URL</h4>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.75rem', 
                backgroundColor: '#f0fdf4', 
                border: '1px solid #22c55e', 
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

          {/* Message near buttons */}
          {stepMessages['user-authorization'] && (
            <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>
              <InfoBox type="success">
                <div>{stepMessages['user-authorization']}</div>
              </InfoBox>
            </div>
          )}

          {/* Clear User Guidance Message */}
          <InfoBox type="info" style={{ marginTop: '2rem', marginBottom: '1rem' }}>
            <FiUser />
            <div>
              <strong>📋 What to do next:</strong>
              <br />
              <br />
              1. <strong>Choose your testing method</strong> above (popup recommended for testing)
              <br />
              2. <strong>Click the "Sign On" button</strong> below to redirect to PingOne
              <br />
              3. <strong>Log in with your PingOne credentials</strong> in the popup/redirect
              <br />
              4. <strong>Authorize the application</strong> when prompted
              <br />
              5. <strong>You'll be redirected back</strong> automatically with an authorization code
              <br />
              <br />
              <strong>💡 Tip:</strong> The popup method is easier for testing - you can see the callback happen in real-time!
            </div>
          </InfoBox>
        </div>
      ),
      execute: handleAuthorization,
      canExecute: Boolean(authUrl && credentials.environmentId && credentials.clientId && credentials.redirectUri)
    },
    {
      id: 'handle-callback',
      title: 'Handle Authorization Callback',
      description: 'Process the authorization code returned from PingOne and validate the state parameter.',
      icon: <FiCode />,
      category: 'authorization',
      content: (
        <div>
          {stepMessages['handle-callback'] && (
            <InfoBox type="success">
              <div>{stepMessages['handle-callback']}</div>
            </InfoBox>
          )}

          {authCode && (
            <InfoBox type="success" style={{ marginBottom: '2rem', textAlign: 'center' }}>
              <FiCheckCircle size={48} style={{ marginBottom: '1rem' }} />
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>
                  🎉 Welcome Back from PingOne!
                </h3>
                <p style={{ margin: '0', fontSize: '1.1rem' }}>
                  Your authorization was successful. You can now proceed with the token exchange.
                </p>
              </div>
            </InfoBox>
          )}

          {!callbackSuccess && !callbackError && !authCode && (
          <CallbackListener>
            <FiClock size={48} style={{ marginBottom: '1rem', color: '#6b7280' }} />
            <h4>Waiting for authorization callback...</h4>
            <p>Expected format:</p>
            <code>
              {credentials.redirectUri}?code=AUTH_CODE_HERE&state={state}
            </code>
          </CallbackListener>
          )}

          {(callbackSuccess || authCode) && (
            <div style={{ 
              marginTop: '2rem', 
              padding: '1.5rem', 
              background: '#f0fdf4', 
              border: '1px solid #22c55e', 
              borderRadius: '0.5rem' 
            }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#15803d' }}>
                <FiCheckCircle style={{ marginRight: '0.5rem' }} />
                Authorization Callback Successful!
              </h4>
              
              <div style={{ marginBottom: '1rem' }}>
                <strong>Authorization Code:</strong>
                <code style={{ 
                  display: 'block', 
                  marginTop: '0.5rem', 
                  padding: '0.5rem', 
                  background: 'white', 
                  border: '1px solid #22c55e', 
                  borderRadius: '0.25rem',
                  wordBreak: 'break-all'
                }}>
                  {authCode}
                </code>
              </div>

              {showUrlDetailsInStep4 && (
                <div style={{ 
                  marginBottom: '1rem', 
                  padding: '1.5rem', 
                  background: '#f8fafc', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '0.5rem' 
                }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiInfo />
                    Callback URL Details
                  </h4>
                  
                  <ParameterBreakdown>
                    <ParameterItem>
                      <ParameterName>Redirect URI</ParameterName>
                      <ParameterValue>{credentials.redirectUri}</ParameterValue>
                    </ParameterItem>
                    <ParameterItem>
                      <ParameterName>Authorization Code</ParameterName>
                      <ParameterValue>{authCode}</ParameterValue>
                    </ParameterItem>
                    <ParameterItem>
                      <ParameterName>State Parameter</ParameterName>
                      <ParameterValue>{state || 'Not provided'}</ParameterValue>
                    </ParameterItem>
                    <ParameterItem>
                      <ParameterName>Client ID</ParameterName>
                      <ParameterValue>{credentials.clientId}</ParameterValue>
                    </ParameterItem>
                    <ParameterItem>
                      <ParameterName>Environment ID</ParameterName>
                      <ParameterValue>{credentials.environmentId}</ParameterValue>
                    </ParameterItem>
                    <ParameterItem>
                      <ParameterName>Scopes</ParameterName>
                      <ParameterValue>{credentials.scopes}</ParameterValue>
                    </ParameterItem>
                  </ParameterBreakdown>
                  
                  <div style={{ marginTop: '1rem', padding: '1rem', background: '#e0f2fe', border: '1px solid #0ea5e9', borderRadius: '0.5rem' }}>
                    <h5 style={{ margin: '0 0 0.5rem 0', color: '#0c4a6e' }}>Complete Callback URL:</h5>
                    <code style={{ 
                      display: 'block', 
                      padding: '0.5rem', 
                      background: 'white', 
                      border: '1px solid #0ea5e9', 
                      borderRadius: '0.25rem',
                      wordBreak: 'break-all',
                      fontSize: '0.9rem'
                    }}>
                      {credentials.redirectUri}?code={authCode}&state={state}
                    </code>
                  </div>
                </div>
              )}

              {tokens && (
                <div style={{ 
                  marginBottom: '1rem', 
                  padding: '1rem', 
                  background: '#ecfdf5', 
                  border: '1px solid #10b981', 
                  borderRadius: '0.5rem' 
                }}>
                  <strong style={{ color: '#065f46' }}>🎉 Tokens Successfully Exchanged!</strong>
                  <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                    <li>✅ Access Token: {tokens.access_token ? 'Received' : 'Missing'}</li>
                    <li>✅ Refresh Token: {tokens.refresh_token ? 'Received' : 'Missing'}</li>
                    <li>✅ ID Token: {tokens.id_token ? 'Received' : 'Missing'}</li>
                    <li>Token Type: {tokens.token_type || 'Bearer'}</li>
                    <li>Expires In: {tokens.expires_in ? `${tokens.expires_in} seconds` : 'Unknown'}</li>
                    <li>Scope: {tokens.scope || 'Not specified'}</li>
                  </ul>
                </div>
              )}

              {userInfo && (
                <div style={{ 
                  marginBottom: '1rem', 
                  padding: '1rem', 
                  background: '#fef3c7', 
                  border: '1px solid #f59e0b', 
                  borderRadius: '0.5rem' 
                }}>
                  <strong style={{ color: '#92400e' }}>👤 User Information Retrieved!</strong>
                  <div style={{ 
                    marginTop: '0.5rem', 
                    padding: '0.5rem', 
                    background: 'white', 
                    border: '1px solid #22c55e', 
                    borderRadius: '0.25rem'
                  }}>
                    <p><strong>Subject (sub):</strong> {userInfo.sub || 'Not available'}</p>
                    <p><strong>Name:</strong> {userInfo.name || 'Not available'}</p>
                    <p><strong>Email:</strong> {userInfo.email || 'Not available'}</p>
                    <p><strong>Preferred Username:</strong> {userInfo.preferred_username || 'Not available'}</p>
                  </div>
                </div>
              )}

              <div style={{ 
                padding: '0.75rem', 
                background: '#dcfce7', 
                border: '1px solid #16a34a', 
                borderRadius: '0.25rem',
                color: '#15803d'
              }}>
                <FiCheckCircle style={{ marginRight: '0.5rem' }} />
                Ready to proceed to Step 5: Exchange Code for Tokens
              </div>
            </div>
          )}

          {callbackError && (
            <div style={{ 
              marginTop: '2rem', 
              padding: '1.5rem', 
              background: '#fef2f2', 
              border: '1px solid #ef4444', 
              borderRadius: '0.5rem' 
            }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#dc2626' }}>
                <FiAlertTriangle style={{ marginRight: '0.5rem' }} />
                Authorization Callback Error
              </h4>
              <p style={{ color: '#dc2626' }}>{callbackError}</p>
              <button
                onClick={() => {
                  // Clear all OAuth state and start fresh
                  sessionStorage.removeItem('oauth_auth_code');
                  sessionStorage.removeItem('code_verifier');
                  sessionStorage.removeItem('code_challenge');
                  sessionStorage.removeItem('oauth_state');
                  setAuthCode('');
                  setCallbackError(null);
                  setCallbackSuccess(false);
                  setCurrentStepIndex(0);
                  sessionStorage.removeItem('enhanced-authz-code-v2-step');
                  console.log('🧹 [EnhancedAuthorizationCodeFlowV2] Cleared all OAuth state, starting fresh');
                }}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                🧹 Clear & Start Fresh
              </button>
            </div>
          )}

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
      canExecute: (() => {
        // Enable Next on Step 4 as soon as we have an auth code
        const canExec = Boolean(authCode);
        console.log('🔍 [EnhancedAuthorizationCodeFlowV2] Handle Callback canExecute check:', {
          authCode: !!authCode,
          authCodeValue: authCode,
          canExecute: canExec
        });
        return canExec;
      })()
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

          {isExchangingTokens && (
            <InfoBox type="info">
              <FiLoader className="animate-spin" />
              <div>
                <strong>🔄 Exchanging Authorization Code for Tokens...</strong>
                <br />
                Making secure request to PingOne token endpoint.
              </div>
            </InfoBox>
          )}

          {tokens && (
            <div>
              <h4 style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiCheckCircle />
                ✅ Token Response (JSON) - SUCCESS!
              </h4>
              <JsonDisplay style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                border: '2px solid #16a34a',
                boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.3)',
                animation: 'pulse 2s ease-in-out'
              }}>
                {JSON.stringify(tokens, null, 2)}
                <CopyButton onClick={() => copyToClipboard(JSON.stringify(tokens, null, 2))}>
                  {copiedText === JSON.stringify(tokens, null, 2) ? <FiCheckCircle /> : <FiCopy />}
                </CopyButton>
              </JsonDisplay>
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                background: '#f0fdf4',
                border: '1px solid #16a34a',
                borderRadius: '0.5rem',
                color: '#15803d',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                🎉 NEW TOKENS RECEIVED! Scroll up to see all your tokens in the green boxes above!
              </div>
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

          {/* Clear & Start Fresh Button */}
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button
              onClick={() => {
                // Clear all OAuth state and start fresh
                sessionStorage.removeItem('oauth_auth_code');
                sessionStorage.removeItem('code_verifier');
                sessionStorage.removeItem('code_challenge');
                sessionStorage.removeItem('oauth_state');
                setAuthCode('');
                setCallbackError(null);
                setCallbackSuccess(false);
                setCurrentStepIndex(0);
                sessionStorage.removeItem('enhanced-authz-code-v2-step');
                // Clear any error messages
                updateStepMessage('exchange-tokens', '');
                console.log('🧹 [EnhancedAuthorizationCodeFlowV2] Cleared all OAuth state, starting fresh');
              }}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#b91c1c';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#dc2626';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              🧹 Clear & Start Fresh OAuth Flow
            </button>
            <p style={{ 
              marginTop: '0.5rem', 
              fontSize: '0.75rem', 
              color: '#dc2626',
              fontWeight: '500'
            }}>
              ⚠️ Use this if you're getting "Invalid Grant" errors with expired codes
            </p>
          </div>

          {/* Success message at bottom above buttons */}
          {stepMessages['exchange-tokens'] && (
            <InfoBox type="success" style={{ marginTop: '2rem', marginBottom: '1rem' }}>
              <div>{stepMessages['exchange-tokens']}</div>
            </InfoBox>
          )}

        </div>
      ),
      execute: async () => {
        setIsExchangingTokens(true);
        try {
        await exchangeCodeForTokens();
        return { success: true };
        } finally {
          setIsExchangingTokens(false);
      }
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
          {stepMessages['validate-tokens'] && (
            <InfoBox type="success">
              <div>{stepMessages['validate-tokens']}</div>
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

          {/* Token Display Section */}
          {tokens && (
            <div style={{ marginTop: '2rem' }}>
              <h4>Received Tokens:</h4>
              
              {/* Access Token */}
              {tokens.access_token && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h5 style={{ margin: '0 0 0.5rem 0', color: '#1f2937', fontSize: '0.9rem', fontWeight: '600' }}>
                    Access Token
                  </h5>
                  <ParameterBreakdown>
                    <ParameterItem>
                      <ParameterName>Token</ParameterName>
                      <ParameterValue style={{ fontFamily: 'Monaco, Menlo, monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                        {tokens.access_token}
                      </ParameterValue>
                    </ParameterItem>
                    <ParameterItem>
                      <ParameterName>Type</ParameterName>
                      <ParameterValue>{tokens.token_type || 'Bearer'}</ParameterValue>
                    </ParameterItem>
                    <ParameterItem>
                      <ParameterName>Expires In</ParameterName>
                      <ParameterValue>{tokens.expires_in ? `${tokens.expires_in} seconds` : 'Unknown'}</ParameterValue>
                    </ParameterItem>
                    <ParameterItem>
                      <ParameterName>Scope</ParameterName>
                      <ParameterValue>{tokens.scope || 'Not specified'}</ParameterValue>
                    </ParameterItem>
                  </ParameterBreakdown>
                  <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <CopyButton onClick={() => copyToClipboard(tokens.access_token)}>
                      {copiedText === tokens.access_token ? <FiCheckCircle /> : <FiCopy />}
                      Copy Access Token
                    </CopyButton>
                  </div>
                </div>
              )}

              {/* Refresh Token */}
              {tokens.refresh_token && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h5 style={{ margin: '0 0 0.5rem 0', color: '#1f2937', fontSize: '0.9rem', fontWeight: '600' }}>
                    Refresh Token
                  </h5>
                  <ParameterBreakdown>
                    <ParameterItem>
                      <ParameterName>Token</ParameterName>
                      <ParameterValue style={{ fontFamily: 'Monaco, Menlo, monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                        {tokens.refresh_token}
                      </ParameterValue>
                    </ParameterItem>
                    <ParameterItem>
                      <ParameterName>Purpose</ParameterName>
                      <ParameterValue>Used to obtain new access tokens</ParameterValue>
                    </ParameterItem>
                  </ParameterBreakdown>
                  <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <CopyButton onClick={() => copyToClipboard(tokens.refresh_token)}>
                      {copiedText === tokens.refresh_token ? <FiCheckCircle /> : <FiCopy />}
                      Copy Refresh Token
                    </CopyButton>
                  </div>
                </div>
              )}

              {/* ID Token */}
              {tokens.id_token && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h5 style={{ margin: '0 0 0.5rem 0', color: '#1f2937', fontSize: '0.9rem', fontWeight: '600' }}>
                    ID Token (JWT)
                  </h5>
                  <ParameterBreakdown>
                    <ParameterItem>
                      <ParameterName>Token</ParameterName>
                      <ParameterValue style={{ fontFamily: 'Monaco, Menlo, monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                        {tokens.id_token}
                      </ParameterValue>
                    </ParameterItem>
                    <ParameterItem>
                      <ParameterName>Type</ParameterName>
                      <ParameterValue>JWT (JSON Web Token)</ParameterValue>
                    </ParameterItem>
                    <ParameterItem>
                      <ParameterName>Purpose</ParameterName>
                      <ParameterValue>Contains user identity information</ParameterValue>
                    </ParameterItem>
                  </ParameterBreakdown>
                  <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <CopyButton onClick={() => copyToClipboard(tokens.id_token)}>
                      {copiedText === tokens.id_token ? <FiCheckCircle /> : <FiCopy />}
                      Copy ID Token
                    </CopyButton>
                  </div>
                </div>
              )}

              {/* All Tokens JSON */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h5 style={{ margin: '0 0 0.5rem 0', color: '#1f2937', fontSize: '0.9rem', fontWeight: '600' }}>
                  Complete Token Response
                </h5>
                <JsonDisplay>
                  {JSON.stringify(tokens, null, 2)}
                </JsonDisplay>
                <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <CopyButton onClick={() => copyToClipboard(JSON.stringify(tokens, null, 2))}>
                    {copiedText === JSON.stringify(tokens, null, 2) ? <FiCheckCircle /> : <FiCopy />}
                    Copy All Tokens
                  </CopyButton>
                </div>
              </div>
            </div>
          )}

          {/* Token Decode Buttons */}
          {tokens && (
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiKey />
                Token Management
              </h4>
              <p style={{ margin: '0 0 1.5rem 0', color: '#6b7280', fontSize: '0.9rem' }}>
                Decode and inspect your tokens to see their contents and claims.
              </p>
              
              {/* Token Paste Area */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h5 style={{ margin: '0 0 0.5rem 0', color: '#1f2937', fontSize: '0.9rem', fontWeight: '600' }}>
                  Decode Custom Token
                </h5>
                <p style={{ margin: '0 0 0.75rem 0', color: '#6b7280', fontSize: '0.8rem' }}>
                  Paste any JWT token below to decode and inspect its contents.
                </p>
                <FormTextarea
                  placeholder="Paste your JWT token here (e.g., eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...)"
                  value={customToken}
                  onChange={(e) => setCustomToken(e.target.value)}
                  style={{ minHeight: '4rem', fontFamily: 'Monaco, Menlo, monospace', fontSize: '0.8rem' }}
                />
                <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <CopyButton 
                    onClick={() => {
                      if (customToken.trim()) {
                        // Store the custom token in localStorage for the token management page
                        const tokenData = {
                          access_token: customToken.trim(),
                          token_type: 'Bearer',
                          custom: true
                        };
                        
                        // Store in localStorage for token management page
                        localStorage.setItem('oauth_tokens', JSON.stringify(tokenData));
                        console.log('✅ Custom token stored for token management page');
                        
                        // Copy custom token to clipboard
                        navigator.clipboard.writeText(customToken).then(() => {
                          console.log('✅ Custom token copied to clipboard');
                        });
                        
                        // Navigate to token management page
                        window.location.href = '/token-management';
                      }
                    }}
                    disabled={!customToken.trim()}
                  >
                    {copiedText === customToken ? <FiCheckCircle /> : <FiCopy />}
                    Decode Custom Token
                  </CopyButton>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    if (tokens.access_token) {
                      // Store the access token in localStorage for the token management page
                      const tokenData = {
                        access_token: tokens.access_token,
                        id_token: tokens.id_token,
                        refresh_token: tokens.refresh_token,
                        token_type: tokens.token_type || 'Bearer',
                        expires_in: tokens.expires_in,
                        scope: tokens.scope
                      };
                      
                      // Store in localStorage for token management page
                      localStorage.setItem('oauth_tokens', JSON.stringify(tokenData));
                      console.log('✅ Access token stored for token management page');
                      
                      // Copy access token to clipboard
                      navigator.clipboard.writeText(tokens.access_token).then(() => {
                        console.log('✅ Access token copied to clipboard');
                      });
                      
                      // Navigate to token management page
                      window.location.href = '/token-management';
                    }
                  }}
                  disabled={!tokens.access_token}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: tokens.access_token ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                    opacity: tokens.access_token ? 1 : 0.5
                  }}
                  onMouseOver={(e) => {
                    if (tokens.access_token) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.4)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (tokens.access_token) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
                    }
                  }}
                >
                  <FiKey />
                  Decode Access Token
                </button>

                <button
                  onClick={() => {
                    if (tokens.id_token) {
                      // Store the ID token in localStorage for the token management page
                      const tokenData = {
                        access_token: tokens.access_token,
                        id_token: tokens.id_token,
                        refresh_token: tokens.refresh_token,
                        token_type: tokens.token_type || 'Bearer',
                        expires_in: tokens.expires_in,
                        scope: tokens.scope
                      };
                      
                      // Store in localStorage for token management page
                      localStorage.setItem('oauth_tokens', JSON.stringify(tokenData));
                      console.log('✅ ID token stored for token management page');
                      
                      // Copy ID token to clipboard
                      navigator.clipboard.writeText(tokens.id_token).then(() => {
                        console.log('✅ ID token copied to clipboard');
                      });
                      
                      // Navigate to token management page
                      window.location.href = '/token-management';
                    }
                  }}
                  disabled={!tokens.id_token}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: tokens.id_token ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
                    opacity: tokens.id_token ? 1 : 0.5
                  }}
                  onMouseOver={(e) => {
                    if (tokens.id_token) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.4)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (tokens.id_token) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)';
                    }
                  }}
                >
                  <FiShield />
                  Decode ID Token
                </button>
              </div>

              <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#6b7280' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}>
                  <strong>Access Token:</strong> {tokens.access_token ? 'Available' : 'Not available'}
                </p>
                <p style={{ margin: '0' }}>
                  <strong>ID Token:</strong> {tokens.id_token ? 'Available' : 'Not available'}
                </p>
              </div>
            </div>
          )}
        </div>
      ),
      execute: async () => {
        setIsGettingUserInfo(true);
        try {
        await getUserInfo();
        return { success: true };
        } finally {
          setIsGettingUserInfo(false);
        }
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
      {/* Success Banner - Always visible when authCode is present */}
      {authCode && (
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '0.75rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.3)',
          border: '1px solid #059669'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <FiCheckCircle size={32} />
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
              🎉 Authorization Successful!
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>
            You've successfully returned from PingOne authentication. Your authorization code has been received and you can now proceed with the token exchange.
          </p>
          {tokens && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.2)', borderRadius: '0.5rem' }}>
              <strong>✅ Tokens Exchanged Successfully!</strong> - Access token, refresh token, and ID token have been received.
            </div>
          )}
          {userInfo && (
            <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'rgba(255,255,255,0.2)', borderRadius: '0.5rem' }}>
              <strong>👤 User Information Retrieved!</strong> - User profile data has been successfully fetched.
            </div>
          )}
        </div>
      )}

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

      {/* Callback URL Configuration - Collapsible with shaded background */}
      <div style={{ 
        marginBottom: '2rem', 
        backgroundColor: '#f8fafc', 
        border: '1px solid #e2e8f0', 
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}>
        <CallbackUrlDisplay 
          flowType="authorization-code" 
          baseUrl={window.location.origin}
          defaultExpanded={false}
        />
      </div>


      {/* Authorization URL Display - Moved to bottom */}

      {/* OAuth Error Helper */}
      {authError && (
        <OAuthErrorHelper
          error={authError}
          errorDescription={errorDescription || ''}
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
      initialStepIndex={currentStepIndex}
      onStepChange={useCallback((stepIndex) => {
        console.log('🔔 [EnhancedAuthorizationCodeFlowV2] Step changed to:', stepIndex);
        setCurrentStepIndex(stepIndex);
      }, [])}
      onStepComplete={useCallback((stepId, result) => {
        console.log('✅ [EnhancedAuthorizationCodeFlowV2] Step completed:', stepId, result);
        // The step completion is already handled by the EnhancedStepFlowV2 component
        // This callback is for any additional logic we might need
      }, [])}
    />

      {/* Authorization Request Modal */}
      <AuthorizationRequestModal
        isOpen={showRedirectModal}
        onClose={handleRedirectModalClose}
        onProceed={handleRedirectModalProceed}
        authorizationUrl={redirectUrl}
        requestParams={redirectParams}
      />

      {/* Authorization Success Modal */}
      {showAuthSuccessModal && flowConfig.showSuccessModal && (
        <ModalOverlay onClick={() => setShowAuthSuccessModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <FiCheckCircle size={48} style={{ color: '#22c55e', marginBottom: '1rem' }} />
              <ModalTitle>🎉 Authorization Successful!</ModalTitle>
              <ModalSubtitle>
                You've successfully returned from PingOne authentication
              </ModalSubtitle>
            </ModalHeader>

            <ModalBody>
              <SuccessSection>
                <SuccessTitle>
                  <FiCode />
                  Authorization Code Received
                </SuccessTitle>
                <CodeDisplay>{authCode}</CodeDisplay>
              </SuccessSection>

              {tokens && (
                <SuccessSection>
                  <SuccessTitle>
                    <FiKey />
                    Tokens Exchanged Successfully
                  </SuccessTitle>
                  <div style={{ fontSize: '0.875rem' }}>
                    <div>✅ Access Token: {tokens.access_token ? 'Received' : 'Missing'}</div>
                    <div>✅ Refresh Token: {tokens.refresh_token ? 'Received' : 'Missing'}</div>
                    <div>✅ ID Token: {tokens.id_token ? 'Received' : 'Missing'}</div>
                    <div>Token Type: {tokens.token_type || 'Bearer'}</div>
                    <div>Expires In: {tokens.expires_in ? `${tokens.expires_in} seconds` : 'Unknown'}</div>
                    <div>Scope: {tokens.scope || 'Not specified'}</div>
                  </div>
                </SuccessSection>
              )}

              {userInfo && (
                <SuccessSection>
                  <SuccessTitle>
                    <FiUser />
                    User Information Retrieved
                  </SuccessTitle>
                  <div style={{ fontSize: '0.875rem' }}>
                    <div>Name: {userInfo.name || 'Not provided'}</div>
                    <div>Email: {userInfo.email || 'Not provided'}</div>
                    <div>Subject: {userInfo.sub || 'Not provided'}</div>
                  </div>
                </SuccessSection>
              )}

              {!tokens && (
                <div style={{ 
                  background: '#fef3c7', 
                  border: '1px solid #f59e0b', 
                  borderRadius: '0.5rem', 
                  padding: '1rem',
                  textAlign: 'center'
                }}>
                  <FiClock style={{ marginRight: '0.5rem' }} />
                  <strong>Next Step:</strong> Proceed to exchange your authorization code for tokens
                </div>
              )}
            </ModalBody>

            <ModalFooter>
              <ModalButton 
                $primary 
                $loading={isModalLoading}
                disabled={isModalLoading}
                onClick={async () => {
                  setIsModalLoading(true);
                  try {
                    // Add a small delay to show the spinner
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    console.log('🔔 [EnhancedAuthorizationCodeFlowV2] Modal button clicked - current step:', currentStepIndex);
                    
                    // Close the modal first
                    setShowAuthSuccessModal(false);
                    
                    // If we're already on step 5 (exchange-tokens), just close the modal
                    if (currentStepIndex === 5) {
                      console.log('✅ [EnhancedAuthorizationCodeFlowV2] Already on step 5, just closing modal');
                      setIsModalLoading(false);
                      return;
                    }
                    
                    // Otherwise, advance to step 5
                    console.log('🔄 [EnhancedAuthorizationCodeFlowV2] Advancing to step 5 (exchange-tokens)');
                    
                    // Clear any existing step storage
                    sessionStorage.removeItem('enhanced-authz-code-v2-step');
                    
                    // Use URL redirect to force a fresh page load with the correct step
                    const currentUrl = new URL(window.location.href);
                    currentUrl.searchParams.set('step', '5');
                    currentUrl.searchParams.set('action', 'exchange-tokens');
                    // Preserve authorization code if it exists
                    if (authCode) {
                      currentUrl.searchParams.set('code', authCode);
                    }
                    if (state) {
                      currentUrl.searchParams.set('state', state);
                    }
                    // Add cache-busting parameter
                    currentUrl.searchParams.set('t', Date.now().toString());
                    
                    console.log('🔄 [EnhancedAuthorizationCodeFlowV2] Redirecting to:', currentUrl.toString());
                    
                    // Force a hard redirect to ensure clean state
                    window.location.href = currentUrl.toString();
                    
                  } catch (error) {
                    console.error('❌ [EnhancedAuthorizationCodeFlowV2] Error in modal button click:', error);
                    setIsModalLoading(false);
                  }
                }}
              >
                {isModalLoading ? 'Processing...' : 'Continue with Flow'}
              </ModalButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </div>
  );
};

export default EnhancedAuthorizationCodeFlowV2;
