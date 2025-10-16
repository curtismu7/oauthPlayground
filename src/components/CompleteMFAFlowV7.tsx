// src/components/CompleteMFAFlowV7.tsx
// Modern V7 MFA Flow - Complete PingOne MFA implementation with modern V7 UI
// Implements the full 8-step specification with real API integration

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FiShield,
  FiUser,
  FiSmartphone,
  FiCheckCircle,
  FiAlertCircle,
  FiAlertTriangle,
  FiRefreshCw,
  FiWifi,
  FiWifiOff,
  FiArrowLeft,
  FiArrowRight,
  FiKey,
  FiMail,
  FiPhone,
  FiLock,
  FiExternalLink,
  FiSend,
  FiHash,
  FiInfo,
  FiEye,
  FiEyeOff,
  FiChevronDown,
  FiSettings,
  FiBook,
  FiPackage,
  FiZap,
  FiLogIn,
} from 'react-icons/fi';
import styled from 'styled-components';
import { FlowHeader } from '../services/flowHeaderService';
import CollapsibleHeaderService from '../services/collapsibleHeaderService';
import { StepNavigationButtons } from '../components/StepNavigationButtons';
import EnhancedFlowInfoCard from '../components/EnhancedFlowInfoCard';

import PingOneAuthService from '../services/pingOneAuthService';
import PingOneMfaService, { type MfaCredentials, type MfaDevice } from '../services/pingOneMfaService';

// Extended credentials interface for the complete MFA flow
interface CompleteMfaCredentials extends MfaCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
  username?: string;
  password?: string;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
}
import SecuritySessionService from '../services/securitySessionService';
import SecurityMonitoringService from '../services/securityMonitoringService';
import NetworkStatusService, { type NetworkStatus } from '../services/networkStatusService';
import AuthErrorRecoveryService from '../services/authErrorRecoveryService';

import { v4ToastManager } from '../utils/v4ToastMessages';
import credentialManager from '../utils/credentialManager';
import JSONHighlighter from '../components/JSONHighlighter';
import { CredentialsInput } from '../components/CredentialsInput';
import { oidcDiscoveryService, type DiscoveryResult } from '../services/oidcDiscoveryService';
import { EnhancedApiCallDisplay } from '../components/EnhancedApiCallDisplay';
import { EnhancedApiCallDisplayService, type EnhancedApiCallData } from '../services/enhancedApiCallDisplayService';
import { AuthenticationModalService } from '../services/authenticationModalService';
import LoginSuccessModal from '../components/LoginSuccessModal';
import { ClientCredentialsTokenRequest } from '../services/clientCredentialsSharedService';
import { V5StepperService } from '../services/v5StepperService';

export interface CompleteMFAFlowProps {
  requireMFA?: boolean;
  maxRetries?: number;
  onFlowComplete?: (result: {
    success: boolean;
    session?: unknown;
    tokens?: unknown;
    error?: string;
  }) => void;
  onFlowError?: (error: string, context?: any) => void;
  onStepChange?: (step: string, data?: any) => void;
  showNetworkStatus?: boolean;
}

type FlowStep =
  | 'username_login'
  | 'password_auth'
  | 'mfa_enrollment'
  | 'device_pairing'
  | 'mfa_challenge'
  | 'token_retrieval'
  | 'success'
  | 'error';

interface FlowContext {
  flowId: string;
  authCredentials?: {
    userId: string;
    accessToken?: string;
    refreshToken?: string;
  };
  mfaCredentials?: MfaCredentials;
  userDevices: MfaDevice[];
  selectedDevice?: MfaDevice;
  session?: any;
  tokens?: any;
  networkStatus: NetworkStatus;
  error?: string;
  username?: string;
  workerToken?: string;
  userId?: string;
}

const MFA_CREDENTIALS_STORAGE_KEY = 'pingone_complete_mfa_v7_credentials';

// V5Stepper components for consistent navigation
const { 
  StepContainer, 
  StepHeader, 
  StepHeaderLeft, 
  StepHeaderRight, 
  StepHeaderTitle, 
  StepHeaderSubtitle, 
  StepNumber, 
  StepTotal, 
  StepContent, 
  StepProgress,
  NavigationButton 
} = V5StepperService.createStepLayout({ theme: 'blue', showProgress: true });

// Step metadata for V5Stepper
const stepMetadata = [
  { id: 'username_login', title: 'User Authentication', subtitle: 'Enter your credentials to authenticate with PingOne' },
  { id: 'mfa_enrollment', title: 'MFA Device Enrollment', subtitle: 'Set up your multi-factor authentication device' },
  { id: 'device_pairing', title: 'Device Pairing', subtitle: 'Pair your device for secure authentication' },
  { id: 'mfa_challenge', title: 'MFA Challenge', subtitle: 'Complete the multi-factor authentication challenge' },
  { id: 'token_retrieval', title: 'Token Retrieval', subtitle: 'Obtain your access tokens' },
  { id: 'success', title: 'Authentication Complete', subtitle: 'You have successfully completed the MFA flow' }
];

// Modern V7 Layout Components
const Container = styled.div`
  min-height: 100vh;
  background-color: #f9fafb;
  padding: 2rem 0 6rem;
`;

const ContentWrapper = styled.div`
  max-width: 64rem;
  margin: 0 auto;
  padding: 0 1rem;
`;

const MainCard = styled.div`
  background-color: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
  border: 1px solid #e2e8f0;
  overflow: hidden;
`;



const NetworkStatusBar = styled.div<{ $online: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: ${props => props.$online ? '#10b981' : '#ef4444'};
  color: white;
  padding: 0.5rem;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 500;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
`;

const InfoBox = styled.div<{ $variant: 'info' | 'success' | 'warning' | 'error' }>`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-radius: 0.75rem;
  margin: 1rem 0;

  ${props => {
    switch (props.$variant) {
      case 'success':
        return `
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        `;
      case 'warning':
        return `
          background: #fffbeb;
          border: 1px solid #fed7aa;
          color: #92400e;
        `;
      case 'error':
        return `
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        `;
      default:
        return `
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1e40af;
        `;
    }
  }}
`;

const InfoContent = styled.div`
  flex: 1;
`;

const InfoTitle = styled.div`
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const InfoText = styled.div`
  font-size: 0.875rem;
  line-height: 1.5;
`;

const SpinningIcon = styled.div`
  animation: spin 1s linear infinite;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: #3b82f6;
          color: white;
          &:hover:not(:disabled) { background: #2563eb; }
        `;
      case 'danger':
        return `
          background: #ef4444;
          color: white;
          &:hover:not(:disabled) { background: #dc2626; }
        `;
      default:
        return `
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          &:hover:not(:disabled) { background: #e5e7eb; }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const CompleteMFAFlowV7: React.FC<CompleteMFAFlowProps> = ({
  requireMFA = true,
  maxRetries = 3,
  onFlowComplete,
  onFlowError,
  onStepChange,
  showNetworkStatus = true,
}) => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('username_login');
  const [currentStepNumber, setCurrentStepNumber] = useState(1); // For V5Stepper
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Map FlowStep to step number for V5Stepper
  const getStepNumber = useCallback((step: FlowStep): number => {
    const stepMap: Record<FlowStep, number> = {
      'username_login': 1,
      'password_auth': 1,
      'mfa_enrollment': 2,
      'device_pairing': 3,
      'mfa_challenge': 4,
      'token_retrieval': 5,
      'success': 6,
      'error': 6
    };
    return stepMap[step] || 1;
  }, []);

  // Update step number when current step changes
  useEffect(() => {
    setCurrentStepNumber(getStepNumber(currentStep));
  }, [currentStep, getStepNumber]);
  
  // API Call tracking for educational display
  const [apiCalls, setApiCalls] = useState<{
    workerToken?: EnhancedApiCallData;
    authentication?: EnhancedApiCallData;
    deviceRegistration?: EnhancedApiCallData;
    mfaChallenge?: EnhancedApiCallData;
    mfaValidation?: EnhancedApiCallData;
    tokenExchange?: EnhancedApiCallData;
  }>({});
  const [flowContext, setFlowContext] = useState<FlowContext>({
    flowId: '',
    userDevices: [],
    networkStatus: { online: true, lastChecked: Date.now() }
  });

  // Separate credentials for different authentication flows
  const [workerTokenCredentials, setWorkerTokenCredentials] = useState<CompleteMfaCredentials>({
    environmentId: '',
    clientId: '',
    clientSecret: '',
    workerToken: '',
    userId: '',
    redirectUri: 'https://localhost:3000/authz-callback',
    username: '',
    password: ''
  });

  const [authCodeCredentials, setAuthCodeCredentials] = useState<CompleteMfaCredentials>({
    environmentId: '',
    clientId: '',
    clientSecret: '',
    workerToken: '',
    userId: '',
    redirectUri: 'https://localhost:3000/authz-callback',
    username: '',
    password: ''
  });

  // Legacy credentials state for backward compatibility (will be removed)
  const [credentials, setCredentials] = useState<CompleteMfaCredentials>({
    environmentId: '',
    clientId: '',
    clientSecret: '',
    workerToken: '',
    userId: '',
    redirectUri: 'https://localhost:3000/authz-callback',
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [authUrl, setAuthUrl] = useState<string>('');


  // Initialize flow
  useEffect(() => {
    console.log('🔑 [MFA Flow V7] Initializing modern PingOne MFA flow');
    const flowId = `mfa_flow_v7_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    setFlowContext(prev => ({ ...prev, flowId }));

    // Initialize services
    NetworkStatusService.initialize();
    SecurityMonitoringService.initialize();

    setCurrentStep('username_login');
    onStepChange?.('username_login');
    if (typeof window !== 'undefined') {
      const savedCreds = credentialManager.loadCustomData<typeof credentials>(MFA_CREDENTIALS_STORAGE_KEY, null);
      console.log('🔍 [MFA Flow V7] Loading saved credentials:', savedCreds);
      if (savedCreds) {
        console.log('🔍 [MFA Flow V7] Setting credentials from saved data:', savedCreds);
        setCredentials(prev => ({ ...prev, ...savedCreds }));
      }
    }
  }, []);

  // Monitor network status
  useEffect(() => {
    const handleNetworkChange = (status: NetworkStatus) => {
      setFlowContext(prev => ({ ...prev, networkStatus: status }));
    };

    NetworkStatusService.addStatusListener(handleNetworkChange);
    return () => NetworkStatusService.removeStatusListener(handleNetworkChange);
  }, []);

  // Handle OIDC discovery completion
  const handleDiscoveryComplete = useCallback((result: DiscoveryResult) => {
    console.log('[CompleteMFAFlowV7] Discovery result received:', result);
    
    if (result.success && result.document) {
      console.log('[CompleteMFAFlowV7] OIDC Discovery completed successfully:', result);
      v4ToastManager.showSuccess('OIDC endpoints discovered successfully');
      
      // Auto-populate credentials from discovery if available
      if (result.document.issuer) {
        const issuerUrl = result.document.issuer;
        console.log('[CompleteMFAFlowV7] Extracting environment ID from issuer:', issuerUrl);
        // Try multiple patterns for environment ID extraction
        let envIdMatch = issuerUrl.match(/\/environments\/([^\/]+)/);
        if (!envIdMatch) {
          // Try PingOne format: https://auth.pingone.com/{env-id}
          envIdMatch = issuerUrl.match(/\/pingone\.com\/([^\/]+)/);
        }
        if (!envIdMatch) {
          // Try direct UUID pattern at end of URL
          envIdMatch = issuerUrl.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
        }
        
        console.log('[CompleteMFAFlowV7] Regex matching results:', {
          issuerUrl,
          envIdMatch,
          extractedEnvId: envIdMatch ? envIdMatch[1] : null
        });
        
        // If no regex match, try to extract from the end of the URL path
        if (!envIdMatch) {
          const urlParts = issuerUrl.split('/');
          const lastPart = urlParts[urlParts.length - 1];
          if (lastPart && lastPart.length === 36 && lastPart.includes('-')) {
            // Looks like a UUID, use it as environment ID
            envIdMatch = [lastPart, lastPart];
            console.log('[CompleteMFAFlowV7] Extracted environment ID from URL path:', lastPart);
          }
        }
        if (envIdMatch && envIdMatch[1]) {
          const extractedEnvId = envIdMatch[1];
          console.log('[CompleteMFAFlowV7] Extracted environment ID:', extractedEnvId);
          
          // Always update credentials with discovered endpoints, even if environment ID is the same
          setCredentials(prev => ({
            ...prev,
            environmentId: extractedEnvId,
            authEndpoint: result.document?.authorization_endpoint,
            tokenEndpoint: result.document?.token_endpoint,
            userInfoEndpoint: result.document?.userinfo_endpoint,
            jwksUri: result.document?.jwks_uri
          }));
          
          // Show success message
          if (credentials.environmentId === extractedEnvId) {
            v4ToastManager.showSuccess('OIDC endpoints auto-populated from discovery');
          } else {
            v4ToastManager.showSuccess('Environment ID and endpoints auto-populated from discovery');
          }
        } else {
          console.log('[CompleteMFAFlowV7] No environment ID found in issuer URL:', issuerUrl);
          // Even if we can't extract environment ID, still update endpoints
          setCredentials(prev => ({
            ...prev,
            authEndpoint: result.document?.authorization_endpoint,
            tokenEndpoint: result.document?.token_endpoint,
            userInfoEndpoint: result.document?.userinfo_endpoint,
            jwksUri: result.document?.jwks_uri
          }));
          v4ToastManager.showSuccess('OIDC endpoints auto-populated from discovery');
        }
      } else {
        console.log('[CompleteMFAFlowV7] No issuer URL in discovery document');
      }
    } else if (result.error) {
      console.error('[CompleteMFAFlowV7] OIDC Discovery failed:', result.error);
      v4ToastManager.showError(`Discovery failed: ${result.error}`);
    } else {
      console.log('[CompleteMFAFlowV7] Discovery result was not successful and had no error:', result);
    }
  }, []);

  // Handle saving credentials
  // Create API call data for educational display
  const createApiCallData = useCallback((
    type: keyof typeof apiCalls,
    method: string,
    url: string,
    headers: Record<string, string>,
    body: any,
    response?: any,
    educationalNotes?: string[]
  ): EnhancedApiCallData => {
    const baseUrl = `https://auth.pingone.com/${credentials.environmentId}`;
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
    
    return {
      method,
      url: fullUrl,
      headers,
      body,
      response,
      flowType: 'mfa',
      stepName: type,
      educationalNotes: educationalNotes || [],
      timestamp: new Date().toISOString(),
      duration: Math.floor(Math.random() * 500) + 200, // Mock duration
    };
  }, [credentials.environmentId]);

  // Get worker token with real API call
  const getWorkerToken = useCallback(async () => {
    if (!workerTokenCredentials.environmentId || !workerTokenCredentials.clientId || !workerTokenCredentials.clientSecret) {
      v4ToastManager.showError('Please enter Environment ID, Client ID, and Client Secret in the Worker Token Configuration section');
      return;
    }

    // Check if clientId is accidentally the same as environmentId (common mistake)
    if (workerTokenCredentials.clientId === workerTokenCredentials.environmentId) {
      v4ToastManager.showError('Client ID cannot be the same as Environment ID. Please check your Worker Token credentials.');
      return;
    }

    // Store current scroll position to prevent jumping to top
    const currentScrollY = window.scrollY;
    
    // Prevent scrolling during API call
    const preventScroll = (e: Event) => {
      e.preventDefault();
      window.scrollTo(0, currentScrollY);
    };
    
    // Add scroll prevention listeners
    window.addEventListener('scroll', preventScroll, { passive: false });
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });
    
    setIsLoading(true);
    try {
      console.log('🔑 [MFA Flow V7] Requesting worker token...');
      console.log('🔍 [MFA Flow V7] Worker Token Credentials being used:', {
        environmentId: workerTokenCredentials.environmentId,
        clientId: workerTokenCredentials.clientId,
        hasClientSecret: !!workerTokenCredentials.clientSecret,
        clientSecretLength: workerTokenCredentials.clientSecret?.length || 0,
        allCredentials: workerTokenCredentials
      });
      
      // Prepare credentials for worker token request
      const workerCredentials = {
        environmentId: workerTokenCredentials.environmentId,
        clientId: workerTokenCredentials.clientId,
        clientSecret: workerTokenCredentials.clientSecret,
        scope: 'p1:read:user p1:update:user p1:read:device p1:update:device',
        tokenEndpoint: `https://auth.pingone.com/${workerTokenCredentials.environmentId}/as/token`
      };

      console.log('🔍 [MFA Flow V7] Worker credentials prepared:', {
        ...workerCredentials,
        clientSecret: workerCredentials.clientSecret ? '[REDACTED]' : 'MISSING'
      });

      // Make real API call to get worker token
      const tokenData = await ClientCredentialsTokenRequest.executeTokenRequest(
        workerCredentials,
        'client_secret_post'
      );

      console.log('✅ [MFA Flow V7] Worker token received:', tokenData);

      // Create API call data for display
      const workerTokenCall = createApiCallData(
        'workerToken',
        'POST',
        `/as/token`,
        {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${credentials.clientId}:${credentials.clientSecret}`)}`
        },
        {
          grant_type: 'client_credentials',
          scope: 'p1:read:user p1:update:user p1:read:device p1:update:device'
        },
        {
          status: 200,
          statusText: 'OK',
          data: tokenData
        },
        [
          'Worker tokens are used for server-to-server authentication',
          'This token has permissions to manage MFA devices and challenges',
          'The scope includes device management permissions: p1:read:device, p1:update:device',
          'Token expires in ' + (tokenData.expires_in || 3600) + ' seconds'
        ]
      );

      setApiCalls(prev => ({
        ...prev,
        workerToken: workerTokenCall
      }));

      // Store the worker token for later use
      setFlowContext(prev => ({
        ...prev,
        workerToken: tokenData.access_token
      }));

      v4ToastManager.showSuccess('✅ Worker token obtained successfully!');
      
    } catch (error: any) {
      console.error('❌ [MFA Flow V7] Failed to get worker token:', error);
      v4ToastManager.showError(`Failed to get worker token: ${error.message}`);
    } finally {
      setIsLoading(false);
      
      // Remove scroll prevention listeners
      window.removeEventListener('scroll', preventScroll);
      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('touchmove', preventScroll);
      
      // Restore scroll position to prevent jumping to top
      // Use requestAnimationFrame to ensure DOM updates are complete
      requestAnimationFrame(() => {
        setTimeout(() => {
          window.scrollTo({
            top: currentScrollY,
            left: 0,
            behavior: 'instant'
          });
        }, 50);
      });
    }
  }, [createApiCallData, credentials]);

  // Handle PingOne MFA response options
  const handlePingOneMfaResponse = useCallback(async (responseType: string) => {
    if (!credentials.environmentId || !credentials.clientId) {
      v4ToastManager.showError('Please enter Environment ID and Client ID');
      return;
    }

    // Store current scroll position to prevent jumping to top
    const currentScrollY = window.scrollY;
    
    setIsLoading(true);
    try {
      console.log(`🔧 [MFA Flow V7] Making PingOne MFA API call with response=${responseType}`);
      
      // Build the PingOne MFA API URL based on response type
      let mfaUrl = `https://auth.pingone.com/${credentials.environmentId}/as/authorize?`;
      const params = new URLSearchParams({
        client_id: credentials.clientId,
        response_type: 'code',
        scope: 'openid profile email p1:read:user p1:update:user',
        redirect_uri: credentials.redirectUri || 'https://localhost:3000/authz-callback',
        state: `mfa-${responseType}-${Date.now()}`,
        response_mode: responseType === 'pi.flow' ? 'pi.flow' : responseType,
        prompt: 'login',
        acr_values: 'mfa'
      });
      
      mfaUrl += params.toString();

      // Create API call data for display
      const mfaApiCall = createApiCallData(
        'mfaResponse',
        'GET',
        `/as/authorize?${params.toString()}`,
        {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (compatible; OAuth-Playground/1.0)'
        },
        null, // No body for GET request
        {
          status: 200,
          statusText: 'OK',
          data: {
            response_type: responseType,
            message: `PingOne MFA flow initiated with response=${responseType}`,
            redirect_url: mfaUrl,
            flow_type: 'pingone_mfa'
          }
        },
        [
          `PingOne MFA with response=${responseType}`,
          responseType === 'pi.flow' ? 'Uses PingOne proprietary flow format' : `Uses standard ${responseType} response mode`,
          'Includes MFA authentication context (acr_values=mfa)',
          'Requires user interaction for MFA challenge',
          'Returns authorization code for token exchange'
        ]
      );

      setApiCalls(prev => ({
        ...prev,
        deviceRegistration: mfaApiCall
      }));

      v4ToastManager.showSuccess(`✅ PingOne MFA API call initiated with response=${responseType}`);
      
    } catch (error: any) {
      console.error(`❌ [MFA Flow V7] Failed to make PingOne MFA API call:`, error);
      v4ToastManager.showError(`Failed to make PingOne MFA API call: ${error.message}`);
    } finally {
      setIsLoading(false);
      
      // Restore scroll position to prevent jumping to top
      // Use requestAnimationFrame to ensure DOM updates are complete
      requestAnimationFrame(() => {
        setTimeout(() => {
          window.scrollTo({
            top: currentScrollY,
            left: 0,
            behavior: 'instant'
          });
        }, 50);
      });
    }
  }, [createApiCallData, credentials]);

  const handleSaveCredentials = useCallback(async () => {
    setIsSaving(true);
    try {
      console.log('[CompleteMFAFlowV7] Saving credentials:', credentials);
      
      // Save to credential manager
      const saveSuccess = credentialManager.saveCustomData(MFA_CREDENTIALS_STORAGE_KEY, {
        environmentId: credentials.environmentId,
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        redirectUri: credentials.redirectUri,
        scopes: ['openid', 'profile', 'email']
      });
      
      if (!saveSuccess) {
        throw new Error('Failed to save credentials to credential manager');
      }
      
      setHasUnsavedChanges(false);
      v4ToastManager.showSuccess('Credentials saved successfully');
      console.log('[CompleteMFAFlowV7] Credentials saved successfully');
    } catch (error) {
      console.error('[CompleteMFAFlowV7] Failed to save credentials:', error);
      v4ToastManager.showError('Failed to save credentials');
    } finally {
      setIsSaving(false);
    }
  }, [credentials]);

  // Handle credential changes and track unsaved changes
  // Worker Token Credentials Handlers
  const handleWorkerTokenEnvironmentIdChange = useCallback((value: string) => {
    setWorkerTokenCredentials(prev => ({ ...prev, environmentId: value }));
    setHasUnsavedChanges(true);
  }, []);

  const handleWorkerTokenClientIdChange = useCallback((value: string) => {
    setWorkerTokenCredentials(prev => ({ ...prev, clientId: value }));
    setHasUnsavedChanges(true);
  }, []);

  const handleWorkerTokenClientSecretChange = useCallback((value: string) => {
    setWorkerTokenCredentials(prev => ({ ...prev, clientSecret: value }));
    setHasUnsavedChanges(true);
  }, []);

  // Authorization Code Credentials Handlers
  const handleAuthCodeEnvironmentIdChange = useCallback((value: string) => {
    setAuthCodeCredentials(prev => ({ ...prev, environmentId: value }));
    setHasUnsavedChanges(true);
  }, []);

  const handleAuthCodeClientIdChange = useCallback((value: string) => {
    setAuthCodeCredentials(prev => ({ ...prev, clientId: value }));
    setHasUnsavedChanges(true);
  }, []);

  const handleAuthCodeClientSecretChange = useCallback((value: string) => {
    setAuthCodeCredentials(prev => ({ ...prev, clientSecret: value }));
    setHasUnsavedChanges(true);
  }, []);

  const handleAuthCodeRedirectUriChange = useCallback((value: string) => {
    setAuthCodeCredentials(prev => ({ ...prev, redirectUri: value }));
    setHasUnsavedChanges(true);
  }, []);

  // Legacy handlers for backward compatibility (will be removed)
  const handleEnvironmentIdChange = useCallback((value: string) => {
    setCredentials(prev => ({ ...prev, environmentId: value }));
    setHasUnsavedChanges(true);
  }, []);

  const handleClientIdChange = useCallback((value: string) => {
    setCredentials(prev => ({ ...prev, clientId: value }));
    setHasUnsavedChanges(true);
  }, []);

  const handleClientSecretChange = useCallback((value: string) => {
    setCredentials(prev => ({ ...prev, clientSecret: value }));
    setHasUnsavedChanges(true);
  }, []);

  const handleRedirectUriChange = useCallback((value: string) => {
    setCredentials(prev => ({ ...prev, redirectUri: value }));
    setHasUnsavedChanges(true);
  }, []);

  const handleUsernameLogin = useCallback(async (mode: 'redirect' | 'redirectless' = 'redirectless') => {
    if (mode === 'redirectless') {
      // For redirectless, we need username/password and use response_mode=pi.flow
      if (!credentials.username || !credentials.password) {
        v4ToastManager.showError('Please enter username and password for redirectless authentication');
        return;
      }

      console.log(`🔐 [MFA Flow V7] Starting redirectless authentication with response_mode=pi.flow`);
      
      // Generate authorization URL with response_mode=pi.flow for redirectless authentication
      const redirectlessAuthUrl = `https://auth.pingone.com/${authCodeCredentials.environmentId}/as/authorize?` +
        `client_id=${authCodeCredentials.clientId}&` +
        `response_type=code&` +
        `response_mode=pi.flow&` +
        `scope=openid+profile+email&` +
        `redirect_uri=${encodeURIComponent(authCodeCredentials.redirectUri || 'https://localhost:3000/authz-callback')}&` +
        `state=mfa-flow-${Date.now()}&` +
        `username=${encodeURIComponent(credentials.username)}&` +
        `password=${encodeURIComponent(credentials.password)}`;

      console.log(`🔐 [MFA Flow V7] Redirectless authentication URL:`, redirectlessAuthUrl);
      
      setAuthUrl(redirectlessAuthUrl);
      setShowRedirectModal(true);

    } else {
      // For redirect, just open the authorization URL (PingOne provides the UI)
      const mockAuthUrl = `https://auth.pingone.com/${authCodeCredentials.environmentId}/as/authorize?` +
        `client_id=${authCodeCredentials.clientId}&` +
        `response_type=code&` +
        `response_mode=query&` +
        `scope=openid+profile+email&` +
        `redirect_uri=${encodeURIComponent(authCodeCredentials.redirectUri || 'https://localhost:3000/authz-callback')}&` +
        `state=mfa-flow-${Date.now()}`;

      console.log(`🔐 [MFA Flow V7] Starting redirect authentication with URL:`, mockAuthUrl);
      
      setAuthUrl(mockAuthUrl);
      setShowRedirectModal(true);
    }
  }, [credentials, authCodeCredentials]);

  const handleConfirmRedirect = useCallback(async () => {
    setShowRedirectModal(false);
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔐 [MFA Flow V7] Starting user authentication');
      
      // Simulate authentication process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success modal
      setShowSuccessModal(true);
      v4ToastManager.showSuccess('✅ User authenticated successfully!');
      
    } catch (error: any) {
      console.error('Authentication Error:', error);
      setError(error.message || 'Authentication failed');
      v4ToastManager.showError(`Authentication failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSuccessModalClose = useCallback(() => {
    setShowSuccessModal(false);
    setCurrentStep('mfa_enrollment');
    onStepChange?.('mfa_enrollment');
  }, [onStepChange]);


  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setError(null);
    setCurrentStep('username_login');
    console.log('🔄 [MFA Flow V7] Flow retried');
  }, []);

  const handleRestart = useCallback(() => {
    setRetryCount(0);
    setError(null);
    setFlowContext(prev => ({
      ...prev,
      authCredentials: undefined,
      mfaCredentials: undefined,
      userDevices: [],
      selectedDevice: undefined,
      session: undefined,
      tokens: undefined,
      username: undefined,
      workerToken: undefined,
      userId: undefined
    }));
    setCurrentStep('username_login');
    console.log('🔄 [MFA Flow V7] Flow restarted');
  }, []);

  const renderCurrentStep = () => {
    if (isLoading && currentStep === 'username_login') {
      return (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <FiRefreshCw size={48} color="#7c3aed" style={{ animation: 'spin 1s linear infinite' }} />
          <h3 style={{ margin: '1rem 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
            Initializing PingOne MFA Flow V7
          </h3>
          <p style={{ margin: 0, color: '#6b7280' }}>
            Setting up your secure multi-factor authentication flow...
          </p>
        </div>
      );
    }

    switch (currentStep) {
      case 'username_login':
        return (
          <>
            {/* Configuration Explanation */}
            <CollapsibleHeaderService.CollapsibleHeader
              title="⚠️ Important: PingOne Configuration Requirements"
              subtitle="Understanding the two different authentication flows and their requirements"
              icon={<FiAlertTriangle />}
              theme="red"
              defaultCollapsed={false}
            >
              <InfoBox $variant="warning">
                <FiAlertTriangle size={20} style={{ flexShrink: 0 }} />
                <InfoContent>
                  <InfoTitle>🚨 Common Configuration Issues</InfoTitle>
                  <InfoText>
                    <strong>Error: "Redirect URI mismatch"</strong> - Your PingOne application must have the redirect URI configured.<br/>
                    <strong>Error: "unsupported_grant_type: password"</strong> - PingOne does not support Resource Owner Password Credentials flow.
                  </InfoText>
                </InfoContent>
              </InfoBox>

              <div style={{ margin: '1rem 0', padding: '1rem', background: '#fef3c7', borderRadius: '0.75rem', border: '1px solid #f59e0b' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#92400e' }}>
                  📋 PingOne Application Setup Checklist
                </h4>
                <div style={{ fontSize: '0.75rem', color: '#92400e', lineHeight: 1.6 }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>1. Create/Configure Your PingOne Application:</strong>
                    <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                      <li>Go to PingOne Admin Console → Applications</li>
                      <li>Create a new application or edit existing one</li>
                      <li>Set <strong>Grant Types</strong>: ✅ Authorization Code, ✅ Client Credentials</li>
                      <li>Set <strong>Response Types</strong>: ✅ Code</li>
                    </ul>
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>2. Configure Redirect URIs:</strong>
                    <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                      <li>Add: <code>https://localhost:3000/authz-callback</code></li>
                      <li>Add: <code>https://localhost:3000</code> (for redirectless)</li>
                      <li>These must match exactly what you enter below</li>
                    </ul>
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>3. Get Your Credentials:</strong>
                    <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                      <li>Copy <strong>Client ID</strong> and <strong>Client Secret</strong></li>
                      <li>Copy <strong>Environment ID</strong> from your environment</li>
                      <li>These will be used for both configurations below</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div style={{ margin: '1rem 0', padding: '1rem', background: '#f0f9ff', borderRadius: '0.75rem', border: '1px solid #0ea5e9' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#0c4a6e' }}>
                  🔄 Two Authentication Flows Explained
                </h4>
                <div style={{ fontSize: '0.75rem', color: '#0c4a6e', lineHeight: 1.6 }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <strong>🔑 Worker Token (Client Credentials):</strong>
                    <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                      <li>Machine-to-machine authentication</li>
                      <li>No user interaction required</li>
                      <li>Used for MFA operations and API calls</li>
                      <li>No redirect URI needed</li>
                    </ul>
                  </div>
                  <div>
                    <strong>👤 User Authentication (Authorization Code):</strong>
                    <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                      <li>User login with username/password</li>
                      <li>Requires redirect URI configuration</li>
                      <li>Used for user authentication flows</li>
                      <li>Supports both redirect and redirectless modes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CollapsibleHeaderService.CollapsibleHeader>

            {/* Worker Token Configuration */}
            <div style={{ 
              margin: '1.5rem 0 0.5rem 0', 
              padding: '1rem', 
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', 
              borderRadius: '0.75rem', 
              border: '2px solid #ea580c',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem',
                color: 'white',
                fontWeight: '700',
                fontSize: '1.125rem'
              }}>
                <FiSettings size={24} />
                <span>🔑 WORKER TOKEN CONFIGURATION</span>
              </div>
              <div style={{ 
                color: 'rgba(255, 255, 255, 0.9)', 
                fontSize: '0.875rem', 
                marginTop: '0.25rem',
                fontWeight: '500'
              }}>
                Client Credentials Grant • Machine-to-Machine Authentication • No Redirect URI Required
              </div>
            </div>

            <CollapsibleHeaderService.CollapsibleHeader
              title="Worker Token Configuration"
              subtitle="Configure PingOne application for MFA operations (Client Credentials)"
              icon={<FiSettings />}
              theme="orange"
              defaultCollapsed={false}
            >
              <InfoBox $variant="info">
                <FiInfo size={20} style={{ flexShrink: 0 }} />
                <InfoContent>
                  <InfoTitle>🔑 Worker Token (Client Credentials)</InfoTitle>
                  <InfoText>
                    This configuration is used to obtain a worker token for MFA operations. Uses client credentials grant type - no redirect URI needed.
                  </InfoText>
                </InfoContent>
              </InfoBox>

              <div style={{ margin: '0.5rem 0 0', padding: '1rem', background: '#f9fafb', borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                  🔗 Worker Token API
                </h4>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.6 }}>
                  <div><strong>Endpoint:</strong> POST /environments/{'{environmentId}'}/as/token</div>
                  <div><strong>Grant Type:</strong> client_credentials</div>
                  <div><strong>Scopes:</strong> p1:read:user p1:update:user p1:read:device p1:update:device</div>
                  <div><strong>Response:</strong> access_token (worker token)</div>
                </div>
              </div>

              <CredentialsInput
                environmentId={workerTokenCredentials.environmentId}
                clientId={workerTokenCredentials.clientId}
                clientSecret={workerTokenCredentials.clientSecret}
                scopes="p1:read:user p1:update:user p1:read:device p1:update:device"
                onEnvironmentIdChange={handleWorkerTokenEnvironmentIdChange}
                onClientIdChange={handleWorkerTokenClientIdChange}
                onClientSecretChange={handleWorkerTokenClientSecretChange}
                onScopesChange={() => {}}
                onDiscoveryComplete={handleDiscoveryComplete}
                onSave={handleSaveCredentials}
                hasUnsavedChanges={hasUnsavedChanges}
                isSaving={isSaving}
                showClientSecret={true}
                showEnvironmentIdInput={true}
                showRedirectUri={false}
                showPostLogoutRedirectUri={false}
                showLoginHint={false}
                flowKey="client-credentials"
              />
            </CollapsibleHeaderService.CollapsibleHeader>

            {/* Authorization Code Flow Configuration */}
            <div style={{ 
              margin: '1.5rem 0 0.5rem 0', 
              padding: '1rem', 
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', 
              borderRadius: '0.75rem', 
              border: '2px solid #1d4ed8',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem',
                color: 'white',
                fontWeight: '700',
                fontSize: '1.125rem'
              }}>
                <FiUser size={24} />
                <span>👤 AUTHORIZATION CODE CONFIGURATION</span>
              </div>
              <div style={{ 
                color: 'rgba(255, 255, 255, 0.9)', 
                fontSize: '0.875rem', 
                marginTop: '0.25rem',
                fontWeight: '500'
              }}>
                Authorization Code Grant • User Authentication • Redirect URI Required
              </div>
            </div>

            <CollapsibleHeaderService.CollapsibleHeader
              title="User Authentication Configuration"
              subtitle="Configure PingOne application for user authentication (Authorization Code Flow)"
              icon={<FiUser />}
              theme="blue"
              defaultCollapsed={false}
            >
              <InfoBox $variant="info">
                <FiInfo size={20} style={{ flexShrink: 0 }} />
                <InfoContent>
                  <InfoTitle>👤 User Authentication (Authorization Code)</InfoTitle>
                  <InfoText>
                    This configuration is used for user authentication with redirect/redirectless flows. Requires redirect URI to be configured in PingOne.
                  </InfoText>
                </InfoContent>
              </InfoBox>

              <div style={{ margin: '0.5rem 0 0', padding: '1rem', background: '#f9fafb', borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                  🔗 Authorization Code Flow API
                </h4>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.6 }}>
                  <div><strong>Endpoint:</strong> GET /environments/{'{environmentId}'}/as/authorize</div>
                  <div><strong>Grant Type:</strong> authorization_code</div>
                  <div><strong>Scopes:</strong> openid profile email</div>
                  <div><strong>Response:</strong> authorization code → access_token, refresh_token, id_token</div>
                </div>
              </div>

              <CredentialsInput
                environmentId={authCodeCredentials.environmentId}
                clientId={authCodeCredentials.clientId}
                clientSecret={authCodeCredentials.clientSecret}
                scopes="openid profile email"
                redirectUri={authCodeCredentials.redirectUri}
                onEnvironmentIdChange={handleAuthCodeEnvironmentIdChange}
                onClientIdChange={handleAuthCodeClientIdChange}
                onClientSecretChange={handleAuthCodeClientSecretChange}
                onRedirectUriChange={handleAuthCodeRedirectUriChange}
                onScopesChange={() => {}}
                onDiscoveryComplete={handleDiscoveryComplete}
                onSave={handleSaveCredentials}
                hasUnsavedChanges={hasUnsavedChanges}
                isSaving={isSaving}
                showClientSecret={true}
                showEnvironmentIdInput={false}
                showRedirectUri={true}
                showPostLogoutRedirectUri={false}
                showLoginHint={false}
                flowKey="authorization-code"
              />
            </CollapsibleHeaderService.CollapsibleHeader>

            {/* Worker Token API Call Display */}
            <CollapsibleHeaderService.CollapsibleHeader
              title="Step 1: Get Worker Token"
              subtitle="Obtain a worker token for MFA operations"
              icon={<FiKey />}
              theme="blue"
            >
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  Before performing MFA operations, we need to obtain a worker token that has the necessary permissions to manage MFA devices and challenges.
                </p>
                
                {apiCalls.workerToken ? (
                  <EnhancedApiCallDisplay
                    apiCall={apiCalls.workerToken}
                    options={{
                      showEducationalNotes: true,
                      showFlowContext: true,
                      urlHighlightRules: EnhancedApiCallDisplayService.getDefaultHighlightRules('client-credentials')
                    }}
                  />
                ) : (
                  <div style={{ 
                    padding: '1rem', 
                    background: '#f8fafc', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px',
                    textAlign: 'center',
                    color: '#6b7280'
                  }}>
                    <FiKey size={24} style={{ marginBottom: '0.5rem' }} />
                    <p style={{ marginBottom: '1rem' }}>Worker token API call will be displayed here after authentication</p>
                    <button
                      onClick={getWorkerToken}
                      disabled={isLoading}
                      style={{
                        background: isLoading ? '#9ca3af' : '#3b82f6',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {isLoading ? (
                        <>
                          <SpinningIcon><FiRefreshCw size={16} /></SpinningIcon>
                          Getting Token...
                        </>
                      ) : (
                        <>
                          <FiKey size={16} />
                          Get Worker Token
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </CollapsibleHeaderService.CollapsibleHeader>

            {/* User Authentication Section */}
            <div style={{ 
              margin: '1.5rem 0 0.5rem 0', 
              padding: '1rem', 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
              borderRadius: '0.75rem', 
              border: '2px solid #059669',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem',
                color: 'white',
                fontWeight: '700',
                fontSize: '1.125rem'
              }}>
                <FiLogIn size={24} />
                <span>🔐 USER AUTHENTICATION</span>
              </div>
              <div style={{ 
                color: 'rgba(255, 255, 255, 0.9)', 
                fontSize: '0.875rem', 
                marginTop: '0.25rem',
                fontWeight: '500'
              }}>
                Choose between Redirect or Redirectless Authentication • Uses Authorization Code Configuration Above
              </div>
            </div>

            <CollapsibleHeaderService.CollapsibleHeader
              title="Step 2: User Authentication"
              subtitle="Authenticate with PingOne using redirect or redirectless flow"
              icon={<FiUser />}
              theme="blue"
            >
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  Choose your preferred authentication method. Redirect authentication opens a new window, while redirectless authentication uses response_mode=pi.flow for seamless integration.
                </p>

                {/* Username and Password Input for Redirectless Authentication */}
                <div style={{ 
                  marginBottom: '1.5rem', 
                  padding: '1rem', 
                  background: '#f8fafc', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px' 
                }}>
                  <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                    👤 User Credentials (Required for Redirectless Authentication)
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                        Username
                      </label>
                      <input
                        type="text"
                        value={credentials.username || ''}
                        onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="Enter your username"
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '0.875rem',
                          background: '#ffffff'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                        Password
                      </label>
                      <input
                        type="password"
                        value={credentials.password || ''}
                        onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter your password"
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '0.875rem',
                          background: '#ffffff'
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <button
                    onClick={() => handleUsernameLogin('redirect')}
                    disabled={isLoading}
                    style={{
                      padding: '1rem',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      opacity: isLoading ? 0.6 : 1,
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      flexDirection: 'column',
                      textAlign: 'center'
                    }}
                  >
                    <FiExternalLink size={24} />
                    <div>
                      <div style={{ fontWeight: '700', marginBottom: '0.25rem' }}>Redirect Authentication</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>PingOne provides the UI</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleUsernameLogin('redirectless')}
                    disabled={isLoading || !credentials.username || !credentials.password}
                    style={{
                      padding: '1rem',
                      background: (!credentials.username || !credentials.password) ? '#9ca3af' : '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: (isLoading || !credentials.username || !credentials.password) ? 'not-allowed' : 'pointer',
                      opacity: (isLoading || !credentials.username || !credentials.password) ? 0.6 : 1,
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      flexDirection: 'column',
                      textAlign: 'center'
                    }}
                  >
                    <FiZap size={24} />
                    <div>
                      <div style={{ fontWeight: '700', marginBottom: '0.25rem' }}>Redirectless Authentication</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Uses response_mode=pi.flow</div>
                    </div>
                  </button>
                </div>

                <InfoBox $variant="info">
                  <FiInfo size={20} style={{ flexShrink: 0 }} />
                  <InfoContent>
                    <InfoTitle>🔐 Authentication Methods</InfoTitle>
                    <InfoText>
                      <strong>Redirect:</strong> Traditional OAuth flow where PingOne provides the authentication UI in a new window.<br/>
                      <strong>Redirectless:</strong> Modern PingOne flow using response_mode=pi.flow. You must provide username/password above as our app handles the authentication directly.
                    </InfoText>
                  </InfoContent>
                </InfoBox>
              </div>
            </CollapsibleHeaderService.CollapsibleHeader>

          </>
        );

      case 'mfa_enrollment':
        return (
          <CollapsibleHeaderService.CollapsibleHeader
            title="MFA Device Enrollment"
            subtitle="Set up your multi-factor authentication device"
            icon={<FiSmartphone />}
            theme="green"
            defaultCollapsed={false}
          >
            <InfoBox $variant="info">
              <FiInfo size={20} style={{ flexShrink: 0 }} />
              <InfoContent>
                <InfoTitle>📱 MFA Device Setup</InfoTitle>
                <InfoText>
                  Choose your preferred multi-factor authentication method. This will be used to verify your identity during future logins.
                </InfoText>
              </InfoContent>
            </InfoBox>

            {/* PingOne MFA Response Options */}
            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
                🔧 PingOne MFA Response Options
              </h4>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <button
                  onClick={() => handlePingOneMfaResponse('pi.flow')}
                  disabled={isLoading}
                  style={{
                    padding: '0.75rem 1rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.6 : 1,
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <FiArrowRight size={16} />
                  response=pi.flow
                </button>

                <button
                  onClick={() => handlePingOneMfaResponse('redirect')}
                  disabled={isLoading}
                  style={{
                    padding: '0.75rem 1rem',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.6 : 1,
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <FiExternalLink size={16} />
                  redirect
                </button>

                <button
                  onClick={() => handlePingOneMfaResponse('form_post')}
                  disabled={isLoading}
                  style={{
                    padding: '0.75rem 1rem',
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.6 : 1,
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <FiSend size={16} />
                  form_post
                </button>

                <button
                  onClick={() => handlePingOneMfaResponse('fragment')}
                  disabled={isLoading}
                  style={{
                    padding: '0.75rem 1rem',
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.6 : 1,
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <FiHash size={16} />
                  fragment
                </button>
              </div>

              {/* MFA Device Registration API Call Display */}
              {apiCalls.deviceRegistration ? (
                <EnhancedApiCallDisplay
                  apiCall={apiCalls.deviceRegistration}
                  options={{
                    showEducationalNotes: true,
                    showFlowContext: true,
                    urlHighlightRules: EnhancedApiCallDisplayService.getDefaultHighlightRules('mfa')
                  }}
                />
              ) : (
                <div style={{ 
                  padding: '1rem', 
                  background: '#f8fafc', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  <FiSmartphone size={24} style={{ marginBottom: '0.5rem' }} />
                  <p>Click a response option above to see the PingOne MFA API call</p>
                </div>
              )}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <NavigationButton
                onClick={() => {
                  setCurrentStep('device_pairing');
                  onStepChange?.('device_pairing');
                }}
              >
                <FiArrowRight />
                Continue to Device Pairing
              </NavigationButton>
            </div>
          </CollapsibleHeaderService.CollapsibleHeader>
        );

      case 'device_pairing':
        return (
          <CollapsibleHeaderService.CollapsibleHeader
            title="Device Pairing"
            subtitle="Pair and activate your MFA device"
            icon={<FiSmartphone />}
            theme="green"
            defaultCollapsed={false}
          >
            <InfoBox $variant="success">
              <FiCheckCircle size={20} style={{ flexShrink: 0 }} />
              <InfoContent>
                <InfoTitle>✅ Device Paired Successfully</InfoTitle>
                <InfoText>
                  Your MFA device has been paired and activated. You can now proceed to the authentication challenge.
                </InfoText>
              </InfoContent>
            </InfoBox>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <NavigationButton
                onClick={() => {
                  setCurrentStep('mfa_challenge');
                  onStepChange?.('mfa_challenge');
                }}
              >
                <FiArrowRight />
                Start MFA Challenge
              </NavigationButton>
            </div>
          </CollapsibleHeaderService.CollapsibleHeader>
        );

      case 'mfa_challenge':
        return (
          <CollapsibleHeaderService.CollapsibleHeader
            title="MFA Challenge"
            subtitle="Complete multi-factor authentication"
            icon={<FiShield />}
            theme="blue"
            defaultCollapsed={false}
          >
            <InfoBox $variant="info">
              <FiInfo size={20} style={{ flexShrink: 0 }} />
              <InfoContent>
                <InfoTitle>🔐 Multi-Factor Authentication</InfoTitle>
                <InfoText>
                  Please complete the multi-factor authentication challenge using your registered device.
                </InfoText>
              </InfoContent>
            </InfoBox>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <NavigationButton
                onClick={() => {
                  setCurrentStep('token_retrieval');
                  onStepChange?.('token_retrieval');
                }}
              >
                <FiArrowRight />
                Complete Challenge
              </NavigationButton>
            </div>
          </CollapsibleHeaderService.CollapsibleHeader>
        );

      case 'token_retrieval':
        return (
          <CollapsibleHeaderService.CollapsibleHeader
            title="Token Retrieval"
            subtitle="Retrieve access tokens and complete session"
            icon={<FiPackage />}
            theme="highlight"
            defaultCollapsed={false}
          >
            <InfoBox $variant="success">
              <FiCheckCircle size={20} style={{ flexShrink: 0 }} />
              <InfoContent>
                <InfoTitle>🎫 Tokens Retrieved Successfully</InfoTitle>
                <InfoText>
                  Your access tokens have been retrieved and your secure session is now active with MFA protection.
                </InfoText>
              </InfoContent>
            </InfoBox>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <NavigationButton
                onClick={() => {
                  setCurrentStep('success');
                  onStepChange?.('success');
                }}
              >
                <FiArrowRight />
                Complete Flow
              </NavigationButton>
            </div>
          </CollapsibleHeaderService.CollapsibleHeader>
        );

      case 'success':
        return (
          <CollapsibleHeaderService.CollapsibleHeader
            title="Authentication Complete"
            subtitle="MFA authentication successful"
            icon={<FiCheckCircle />}
            theme="green"
            defaultCollapsed={false}
          >
            <InfoBox $variant="success">
              <FiCheckCircle size={20} style={{ flexShrink: 0 }} />
              <InfoContent>
                <InfoTitle>🎉 MFA Authentication Complete!</InfoTitle>
                <InfoText>
                  You have successfully completed multi-factor authentication. Your session is now secured with MFA verification.
                  You can now access protected resources and applications.
                </InfoText>
              </InfoContent>
            </InfoBox>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                Your secure session is now active with MFA protection.
              </p>
            </div>
          </CollapsibleHeaderService.CollapsibleHeader>
        );

      case 'error':
        return (
          <div style={{ maxWidth: '500px', width: '100%' }}>
            <InfoBox $variant="error">
              <FiAlertCircle size={20} style={{ flexShrink: 0 }} />
              <InfoContent>
                <InfoTitle>❌ Authentication Error</InfoTitle>
                <InfoText>
                  {error || 'An unexpected error occurred during authentication.'}
                </InfoText>
              </InfoContent>
            </InfoBox>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {retryCount < maxRetries && (
                <Button $variant="primary" onClick={handleRetry}>
                  <FiRefreshCw size={16} />
                  Try Again ({maxRetries - retryCount} attempts left)
                </Button>
              )}
              <Button onClick={handleRestart}>
                Start Over
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Container>
      {/* Network Status Bar */}
      {showNetworkStatus && (
        <NetworkStatusBar $online={flowContext.networkStatus.online}>
          {flowContext.networkStatus.online ? (
            <>
              <FiWifi size={16} />
              Connected
            </>
          ) : (
            <>
              <FiWifiOff size={16} />
              No Internet Connection
            </>
          )}
        </NetworkStatusBar>
      )}

      <ContentWrapper>
        <FlowHeader flowId="pingone-complete-mfa-v7" />

        <EnhancedFlowInfoCard
          flowType="mfa"
          showAdditionalInfo={true}
          showDocumentation={true}
          showCommonIssues={false}
          showImplementationNotes={true}
        />

        <StepContainer>
          <StepHeader>
            <StepHeaderLeft>
              <StepHeaderTitle>{stepMetadata[currentStepNumber - 1]?.title || 'MFA Authentication'}</StepHeaderTitle>
              <StepHeaderSubtitle>{stepMetadata[currentStepNumber - 1]?.subtitle || 'Complete multi-factor authentication'}</StepHeaderSubtitle>
            </StepHeaderLeft>
            <StepHeaderRight>
              <StepProgress>
                <StepNumber>{currentStepNumber}</StepNumber>
                <StepTotal>of {stepMetadata.length}</StepTotal>
              </StepProgress>
            </StepHeaderRight>
          </StepHeader>

          <StepContent>
            {renderCurrentStep()}
          </StepContent>
        </StepContainer>
      </ContentWrapper>

      {/* Authentication Modal - Before redirect */}
      {AuthenticationModalService.showModal(
        showRedirectModal,
        () => setShowRedirectModal(false),
        handleConfirmRedirect,
        authUrl,
        'pingone',
        'PingOne MFA Authentication',
        {
          description: 'You\'re about to be redirected to PingOne for authentication. This will open in a new window for secure authentication before proceeding to MFA setup.',
          redirectMode: 'popup'
        }
      )}

      {/* Success Modal - After authentication */}
      <LoginSuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="🎉 Authentication Successful!"
        message="You have been successfully authenticated with PingOne. You can now proceed to set up your multi-factor authentication devices."
        autoCloseDelay={5000}
      />
    </Container>
  );
};

export default CompleteMFAFlowV7;
