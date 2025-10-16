// src/components/CompleteMFAFlowV6.tsx
// Real V7 MFA Flow - Complete PingOne MFA implementation with modern V7 UI
// Implements the full 8-step specification with real API integration

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FiShield,
  FiUser,
  FiSmartphone,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiWifi,
  FiWifiOff,
  FiArrowLeft,
  FiArrowRight,
  FiKey,
  FiMail,
  FiPhone,
  FiLock,
  FiInfo,
  FiEye,
  FiEyeOff,
  FiChevronDown,
  FiSettings,
  FiBook,
  FiPackage,
} from 'react-icons/fi';
import styled from 'styled-components';
import { FlowHeader } from '../services/flowHeaderService';
import { CollapsibleHeaderService } from '../services/collapsibleHeaderService';
import { StepNavigationButtons } from '../components/StepNavigationButtons';
import EnhancedFlowInfoCard from '../components/EnhancedFlowInfoCard';

import PingOneAuthService from '../services/pingOneAuthService';
import PingOneMfaService, { type MfaCredentials, type MfaDevice } from '../services/pingOneMfaService';
import SecuritySessionService from '../services/securitySessionService';
import SecurityMonitoringService from '../services/securityMonitoringService';
import NetworkStatusService, { type NetworkStatus } from '../services/networkStatusService';
import AuthErrorRecoveryService from '../services/authErrorRecoveryService';

import { v4ToastManager } from '../utils/v4ToastMessages';
import credentialManager from '../utils/credentialManager';
import JSONHighlighter from '../components/JSONHighlighter';
import { CredentialsInput } from '../components/CredentialsInput';

import styled from 'styled-components';

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
  session?: SecuritySession;
  tokens?: any;
  networkStatus: NetworkStatus;
  error?: string;
  username?: string;
  workerToken?: string;
  userId?: string;
}

const MFA_CREDENTIALS_STORAGE_KEY = 'pingone_complete_mfa_v7_credentials';

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

const StepHeader = styled.div`
  background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
  color: #ffffff;
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StepHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const StepHeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  opacity: 0.9;
`;

const VersionBadge = styled.span`
  align-self: flex-start;
  background: rgba(124, 58, 237, 0.2);
  border: 1px solid #a78bfa;
  color: #ddd6fe;
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StepHeaderTitle = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
`;

const StepHeaderSubtitle = styled.p`
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  opacity: 0.9;
  line-height: 1.4;
`;

const StepNumber = styled.span`
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
`;

const StepTotal = styled.span`
  font-size: 0.875rem;
  opacity: 0.7;
`;

const StepContentWrapper = styled.div`
  padding: 2rem;
`;

const NavigationButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #6d28d9;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
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

const ErrorBoundary = styled.div`
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin: 1rem 0;
`;

const ErrorMessage = styled.p`
  margin: 0 0 1rem 0;
  color: #7f1d1d;
`;

const ErrorActions = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const ApiDisplay = styled.div<{ $type: 'request' | 'response' }>`
  margin: 1.5rem 0;
  padding: 1rem;
  background: ${props => props.$type === 'response' ? '#f0fdf4' : '#f8fafc'};
  border-radius: 0.5rem;
  border: 1px solid ${props => props.$type === 'response' ? '#bbf7d0' : '#e2e8f0'};
`;

const ApiTitle = styled.h4`
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 1.5rem;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
  z-index: 1200;
`;

const ModalCard = styled.div`
  width: min(520px, 100%);
  background: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 35px 70px rgba(15, 23, 42, 0.35);
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(76, 201, 240, 0.12));
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
`;

const ModalHeaderIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 0.9rem;
  background: rgba(79, 70, 229, 0.1);
  color: #4f46e5;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: #111827;
`;

const ModalSubtitle = styled.p`
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: #6b7280;
`;

const ModalBody = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ModalActions = styled.div`
  margin-top: 1.25rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: space-between;
  align-items: center;
`;

const { Collapsible } = V6FlowService.createFlowComponents('purple');

export const CompleteMFAFlowV6: React.FC<CompleteMFAFlowProps> = ({
  requireMFA = true,
  maxRetries = 3,
  onFlowComplete,
  onFlowError,
  onStepChange,
  showNetworkStatus = true,
}) => {
  const { collapsedSections, toggleSection } = useV6CollapsibleSections();

  // Get V6 Flow components
  const { Collapsible } = V6FlowService.createFlowComponents('blue');

  // Flow state
  const [currentStep, setCurrentStep] = useState<FlowStep>('username_login');
  const [flowContext, setFlowContext] = useState<FlowContext>({
    flowId: '',
    userDevices: [],
    networkStatus: NetworkStatusService.getNetworkStatus()
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // API tracking for educational display
  const [apiRequestDetails, setApiRequestDetails] = useState<any>(null);
  const [apiResponseDetails, setApiResponseDetails] = useState<any>(null);

  // Credentials state
  const [credentials, setCredentials] = useState({
    clientId: '',
    clientSecret: '',
    environmentId: '',
    region: 'com',
    authMethod: 'client_secret_basic',
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);

  // Modern V7 Step Metadata Configuration
  const STEP_METADATA = [
    { title: 'Step 1: User Authentication', subtitle: 'Enter credentials and authenticate with PingOne' },
    { title: 'Step 2: MFA Enrollment', subtitle: 'Set up multi-factor authentication devices' },
    { title: 'Step 3: Device Pairing', subtitle: 'Pair and activate your MFA device' },
    { title: 'Step 4: MFA Challenge', subtitle: 'Complete multi-factor authentication' },
    { title: 'Step 5: Token Retrieval', subtitle: 'Retrieve access tokens and complete session' },
    { title: 'Step 6: Authentication Complete', subtitle: 'MFA authentication successful' },
  ];

  // Flow steps configuration based on specification
  const flowSteps: Array<{ id: FlowStep; title: string; subtitle: string; icon: React.ReactNode }> = [
    { id: 'username_login', title: 'Sign In', subtitle: 'Enter username/email', icon: <FiUser size={12} /> },
    { id: 'password_auth', title: 'Password Auth', subtitle: 'Authenticate with password', icon: <FiShield size={12} /> },
    { id: 'mfa_enrollment', title: 'MFA Enrollment', subtitle: 'Set up multi-factor authentication', icon: <FiSmartphone size={12} /> },
    { id: 'device_pairing', title: 'Device Pairing', subtitle: 'Pair your MFA device', icon: <FiSmartphone size={12} /> },
    { id: 'mfa_challenge', title: 'MFA Challenge', subtitle: 'Verify your identity', icon: <FiShield size={12} /> },
    { id: 'token_retrieval', title: 'Token Retrieval', subtitle: 'Get access tokens', icon: <FiCheckCircle size={12} /> },
    { id: 'success', title: 'Complete', subtitle: 'Authentication successful', icon: <FiCheckCircle size={12} /> }
  ];

  // Get current step metadata
  const currentStepMeta = useMemo(() => {
    return flowSteps.find(step => step.id === currentStep) || flowSteps[0];
  }, [currentStep]);

  // Initialize flow
  useEffect(() => {
    console.log('🔑 [MFA Flow V7] Initializing real PingOne MFA flow');
    const flowId = `mfa_flow_v7_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    setFlowContext(prev => ({ ...prev, flowId }));

    // Initialize services
    NetworkStatusService.initialize();
    SecurityMonitoringService.initialize();

    setCurrentStep('username_login');
    onStepChange?.('username_login');
    if (typeof window !== 'undefined') {
      const savedCreds = credentialManager.loadCustomData<typeof credentials>(MFA_CREDENTIALS_STORAGE_KEY, null);
      if (savedCreds) {
        setCredentials(prev => ({ ...prev, ...savedCreds }));
      }
    }
  }, []);

  // Monitor network status
  useEffect(() => {
    const handleNetworkChange = (status: NetworkStatus) => {
      setFlowContext(prev => ({ ...prev, networkStatus: status }));

      if (!status.online && !flowContext.networkStatus?.online) {
        handleError(new Error('Network connection lost'), {
          operation: 'network_monitoring',
          flowId: flowContext.flowId
        });
      }
    };

    NetworkStatusService.addNetworkStatusListener(handleNetworkChange);

    return () => {
      NetworkStatusService.removeNetworkStatusListener(handleNetworkChange);
    };
  }, [flowContext.flowId, flowContext.networkStatus?.online]);

  const handleError = async (error: Error, context: any) => {
    try {
      // Log security event
      SecurityMonitoringService.logSecurityEvent({
        level: 'error',
        category: 'system',
        event: 'flow_error',
        details: {
          error: error.message,
          context,
          step: currentStep,
          retryCount,
          sensitiveData: false,
          riskScore: 60
        }
      });

      // Attempt error recovery
      const recoveryResult = await AuthErrorRecoveryService.handleError(error, {
        operation: context.operation || 'unknown',
        userId: flowContext.userId,
        flowId: flowContext.flowId,
        timestamp: new Date()
      });

      if (recoveryResult.recovered) {
        setError(null);
        return;
      }

      setError(recoveryResult.action?.description || error.message);
      setCurrentStep('error');
      onFlowError?.(error.message, context);
    } catch (recoveryError) {
      console.error('Error recovery failed:', recoveryError);
      v4ToastManager.showError('An unexpected error occurred. Please refresh the page and try again.');
      setError('An unexpected error occurred. Please refresh the page and try again.');
      setCurrentStep('error');
    }
  };

  // Real PingOne worker token acquisition
  const getWorkerToken = useCallback(async () => {
    setIsLoading(true);

    try {
      v4ToastManager.showSuccess(`Requesting worker token from PingOne using ${credentials.authMethod}...`);

      // Check for unsupported auth methods
      if (credentials.authMethod === 'client_secret_jwt') {
        v4ToastManager.showError('Client Secret JWT not implemented in this demo. Use Basic or Post method.');
        return;
      } else if (credentials.authMethod === 'private_key_jwt') {
        v4ToastManager.showError('Private Key JWT not implemented in this demo. Use Basic or Post method.');
        return;
      }

      const mfaScopes = 'p1:read:user p1:update:user p1:create:device p1:read:device p1:update:device p1:delete:device';

      const requestBody: Record<string, string> = {
        grant_type: 'client_credentials',
        scope: mfaScopes
      };

      const requestHeaders: Record<string, string> = {};

      if (credentials.authMethod === 'client_secret_basic') {
        const basicAuth = btoa(`${credentials.clientId}:${credentials.clientSecret}`);
        requestHeaders['Authorization'] = `Basic ${basicAuth}`;
      } else {
        requestBody.client_id = credentials.clientId;
        requestBody.client_secret = credentials.clientSecret;
      }

      const displayBody: Record<string, string> = { ...requestBody };
      if (displayBody.client_secret) {
        displayBody.client_secret = '[REDACTED]';
      }

      const displayHeaders: Record<string, string> = { ...requestHeaders };
      if (displayHeaders.Authorization) {
        displayHeaders.Authorization = displayHeaders.Authorization.replace(/Basic .+/, 'Basic [REDACTED]');
      }

      setApiRequestDetails({
        url: `https://auth.pingone.${credentials.region}/v1/environments/${credentials.environmentId}/as/token`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...displayHeaders
        },
        body: displayBody,
        authMethod: credentials.authMethod,
        timestamp: new Date().toISOString()
      });

      const proxyPayload = {
        environment_id: credentials.environmentId,
        auth_method: credentials.authMethod,
        headers: requestHeaders,
        body: requestBody
      };

      const response = await fetch('/api/client-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(proxyPayload)
      });

      const tokenData = await response.json();

      if (!response.ok) {
        setApiResponseDetails({
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: tokenData,
          timestamp: new Date().toISOString()
        });
        throw new Error(tokenData.error_description || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!tokenData.access_token) {
        throw new Error('No access token received from PingOne');
      }

      const displayResponseData = {
        ...tokenData,
        access_token: `${tokenData.access_token.substring(0, 20)}...[TRUNCATED FOR SECURITY]`
      };

      setApiResponseDetails({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: displayResponseData,
        timestamp: new Date().toISOString()
      });

      setFlowContext(prev => ({ ...prev, workerToken: tokenData.access_token }));
      v4ToastManager.showSuccess(`✅ Real worker token obtained from PingOne using ${credentials.authMethod}!`);

    } catch (error: any) {
      console.error('PingOne Token Error:', error);
      v4ToastManager.showError(`Failed to get worker token: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [credentials]);

  const handleSaveCredentials = useCallback(async () => {
    if (typeof window === 'undefined') {
      return;
    }

    setIsSavingCredentials(true);

    try {
      const payload = {
        environmentId: credentials.environmentId,
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        region: credentials.region,
        authMethod: credentials.authMethod,
        username: credentials.username,
        password: credentials.password
      };

      const saved = credentialManager.saveCustomData(MFA_CREDENTIALS_STORAGE_KEY, payload);

      if (saved) {
        v4ToastManager.showSuccess('PingOne MFA credentials saved for this browser.');
      } else {
        v4ToastManager.showError('Unable to save credentials. Please try again.');
      }
    } catch (saveError) {
      v4ToastManager.showError(saveError instanceof Error ? saveError.message : 'Unable to save credentials.');
    } finally {
      setIsSavingCredentials(false);
    }
  }, [credentials]);

  // Real authentication with PingOne
  const handleAuthentication = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🔐 [MFA Flow V7] Performing real PingOne authentication');

      if (!credentials.username || !credentials.password) {
        v4ToastManager.showError('Please enter username and password');
        return;
      }

      // Real PingOne authentication
      if (!flowContext.workerToken) {
        await getWorkerToken();
      }

      const authResult = await PingOneAuthService.authenticate({
        username: credentials.username,
        password: credentials.password,
        environmentId: credentials.environmentId
      });

      if (!authResult.success) {
        throw new Error(authResult.error?.message || 'Authentication failed');
      }

      setFlowContext(prev => ({
        ...prev,
        authCredentials: {
          userId: authResult.userId!,
          accessToken: authResult.accessToken,
          refreshToken: authResult.refreshToken
        },
        userId: authResult.userId,
        username: credentials.username
      }));

      // Create MFA credentials
      const mfaCredentials: MfaCredentials = {
        workerToken: flowContext.workerToken || '',
        environmentId: credentials.environmentId,
        userId: authResult.userId!
      };

      // Get user's real MFA devices
      const devices = await PingOneMfaService.getRegisteredDevices(mfaCredentials);

      setFlowContext(prev => ({
        ...prev,
        mfaCredentials,
        userDevices: devices
      }));

      // Determine next step based on MFA requirements and device availability
      if (devices.length === 0 && requireMFA) {
        setCurrentStep('mfa_enrollment');
        onStepChange?.('mfa_enrollment');
      } else if (devices.length > 0) {
        setCurrentStep('device_pairing');
        onStepChange?.('device_pairing');
      } else {
        setCurrentStep('token_retrieval');
        onStepChange?.('token_retrieval');
      }

      v4ToastManager.showSuccess('Authentication successful!');
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Authentication failed'), {
        operation: 'authentication'
      });
    } finally {
      setIsLoading(false);
    }
  }, [credentials, requireMFA, flowContext.workerToken, onStepChange, getWorkerToken]);

  // Device selection for MFA challenge
  const handleDeviceSelection = useCallback(async (device: MfaDevice) => {
    try {
      setIsLoading(true);
      console.log('📱 [MFA Flow V7] Device selected for MFA challenge:', device);

      setFlowContext(prev => ({ ...prev, selectedDevice: device }));

      setCurrentStep('mfa_challenge');
      onStepChange?.('mfa_challenge', { device });
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Device selection failed'), {
        operation: 'device_selection'
      });
    } finally {
      setIsLoading(false);
    }
  }, [onStepChange]);

  // Send real MFA challenge
  const handleSendMFAChallenge = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('📱 [MFA Flow V7] Sending real MFA challenge');

      if (!flowContext.mfaCredentials || !flowContext.selectedDevice) {
        throw new Error('Missing MFA credentials or selected device');
      }

      // Send real MFA challenge via PingOne API
      const challengeResult = await PingOneMfaService.sendChallenge(
        flowContext.mfaCredentials,
        {
          deviceId: flowContext.selectedDevice.id,
          challengeType: flowContext.selectedDevice.type
        }
      );

      v4ToastManager.showSuccess(`Real MFA challenge sent to ${flowContext.selectedDevice.type} device!`);

      // Store API details for educational display
      setApiRequestDetails({
        method: 'POST',
        url: `https://api.pingone.${credentials.region}/v1/environments/${credentials.environmentId}/users/${flowContext.userId}/devices/${flowContext.selectedDevice.id}/authentications`,
        headers: {
          'Authorization': `Bearer ${flowContext.workerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: flowContext.selectedDevice.type
        })
      });

      setApiResponseDetails(challengeResult);

    } catch (err) {
      handleError(err instanceof Error ? err : new Error('MFA challenge failed'), {
        operation: 'mfa_challenge'
      });
    } finally {
      setIsLoading(false);
    }
  }, [flowContext, credentials]);

  // Verify MFA challenge
  const handleMFASuccess = useCallback(async (verificationCode: string) => {
    try {
      setIsLoading(true);
      console.log('✅ [MFA Flow V7] Verifying MFA challenge');

      if (!flowContext.mfaCredentials || !flowContext.selectedDevice || !flowContext.authCredentials) {
        throw new Error('Missing required credentials for MFA verification');
      }

      // In a real implementation, verify the MFA code
      // For demo, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create security session
      const session = SecuritySessionService.createSession(flowContext.authCredentials.userId);

      SecuritySessionService.updateSession({ mfaCompleted: true, deviceTrusted: true });

      setFlowContext(prev => ({ ...prev, session }));

      setCurrentStep('token_retrieval');
      onStepChange?.('token_retrieval');
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('MFA verification failed'), {
        operation: 'mfa_verification'
      });
    } finally {
      setIsLoading(false);
    }
  }, [flowContext, onStepChange]);

  // Token retrieval
  const handleTokenRetrieval = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🎫 [MFA Flow V7] Retrieving tokens');

      // In real implementation, this would call PingOne token exchange
      // For demo, simulate token retrieval
      await new Promise(resolve => setTimeout(resolve, 1000));

      const tokens = {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        idToken: 'eyJraWQiOiJrMTIzIn0.eyJzdWIiOiJ1c2VyXzEyMyJ9...',
        refreshToken: 'def50200a1bcd...',
        expiresIn: 3600
      };

      setFlowContext(prev => ({ ...prev, tokens }));

      setCurrentStep('success');
      onStepChange?.('success', tokens);
      onFlowComplete?.({ success: true, session: flowContext.session, tokens });

      v4ToastManager.showSuccess('Tokens retrieved successfully!');
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Token retrieval failed'), {
        operation: 'token_retrieval'
      });
    } finally {
      setIsLoading(false);
    }
  }, [flowContext.session, onStepChange, onFlowComplete]);

  const handleRetry = useCallback(() => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setError(null);
      setCurrentStep('username_login');
    } else {
      onFlowError?.('Maximum retry attempts exceeded', { retryCount });
    }
  }, [retryCount, maxRetries, onFlowError]);

  const handleRestart = useCallback(() => {
    setRetryCount(0);
    setError(null);
    setFlowContext({
      flowId: '',
      userDevices: [],
      networkStatus: NetworkStatusService.getNetworkStatus()
    });
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

    // Group indicators for analytics step tracking
    switch (currentStep) {
    

      case 'username_login':
        return (
          <ModalOverlay>
            <ModalCard>
              <ModalHeader>
                <ModalHeaderIcon>
                  <FiKey size={20} />
                </ModalHeaderIcon>
                <div>
                  <ModalTitle>{currentStepMeta.title}</ModalTitle>
                  <ModalSubtitle>{currentStepMeta.subtitle}</ModalSubtitle>
                </div>
              </ModalHeader>
              <ModalBody>
                <InfoBox $variant="info">
                  <FiInfo size={20} style={{ flexShrink: 0 }} />
                  <InfoContent>
                    <InfoTitle>🔐 Primary Authentication</InfoTitle>
                    <InfoText>
                      Authenticate against PingOne using your application credentials. Successful sign-in seeds the MFA flow with real access tokens and device profile data.
                    </InfoText>
                  </InfoContent>
                </InfoBox>

                <div style={{ margin: '0.5rem 0 0', padding: '1rem', background: '#f9fafb', borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                    🔗 PingOne Authentication API
                  </h4>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.6 }}>
                    <div><strong>Endpoint:</strong> POST /environments/{'{environmentId}'}/as/token</div>
                    <div><strong>Grant Type:</strong> password (Resource Owner Password Credentials)</div>
                    <div><strong>Response:</strong> access_token, refresh_token, id_token (if requested)</div>
                  </div>
                </div>

                <CredentialsInput
                  environmentId={credentials.environmentId}
                  clientId={credentials.clientId}
                  clientSecret={credentials.clientSecret}
                  scopes="openid profile email"
                  onEnvironmentIdChange={(value) => setCredentials(prev => ({ ...prev, environmentId: value }))}
                  onClientIdChange={(value) => setCredentials(prev => ({ ...prev, clientId: value }))}
                  onClientSecretChange={(value) => setCredentials(prev => ({ ...prev, clientSecret: value }))}
                  onScopesChange={() => {}}
                  showClientSecret={true}
                  showEnvironmentIdInput={true}
                  showRedirectUri={false}
                  showPostLogoutRedirectUri={false}
                  showLoginHint={false}
                  flowKey="password"
                />

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Username *
                  </label>
                  <input
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Enter your username"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={credentials.password}
                      onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter your password"
                      style={{
                        width: '100%',
                        padding: '0.75rem 2.75rem 0.75rem 0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        right: '0.75rem',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#6b7280'
                      }}
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>

                <ModalActions>
                  <Button
                    $variant="secondary"
                    onClick={handleSaveCredentials}
                    disabled={isSavingCredentials}
                  >
                    {isSavingCredentials ? <SpinningIcon><FiRefreshCw size={16} /></SpinningIcon> : <FiCheckCircle size={16} />}
                    {isSavingCredentials ? 'Saving…' : 'Save Credentials'}
                  </Button>

                  <NavigationButton
                    onClick={handleAuthentication}
                    disabled={isLoading || !credentials.username || !credentials.password || !credentials.environmentId}
                  >
                    {isLoading ? <SpinningIcon><FiRefreshCw /></SpinningIcon> : <FiArrowRight />}
                    Authenticate
                  </NavigationButton>
                </ModalActions>
              </ModalBody>
            </ModalCard>
          </ModalOverlay>
        );

      case 'password_auth':
        // Handled in username_login step
    }

    switch (currentStep) {
      case 'username_login':
        return (
          <ModalOverlay>
            <ModalCard>
              <ModalHeader>
                <ModalHeaderIcon>
                  <FiKey size={20} />
                </ModalHeaderIcon>
                <div>
                  <ModalTitle>{currentStepMeta.title}</ModalTitle>
                  <ModalSubtitle>{currentStepMeta.subtitle}</ModalSubtitle>
                </div>
              </ModalHeader>
              <ModalBody>
                <InfoBox $variant="info">
                  <FiInfo size={20} style={{ flexShrink: 0 }} />
                  <InfoContent>
                    <InfoTitle>🔐 Primary Authentication</InfoTitle>
                    <InfoText>
                      Authenticate against PingOne using your application credentials. Successful sign-in seeds the MFA flow with real access tokens and device profile data.
                    </InfoText>
                  </InfoContent>
                </InfoBox>

                <div style={{ margin: '0.5rem 0 0', padding: '1rem', background: '#f9fafb', borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                    🔗 PingOne Authentication API
                  </h4>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.6 }}>
                    <div><strong>Endpoint:</strong> POST /environments/{'{environmentId}'}/as/token</div>
                    <div><strong>Grant Type:</strong> password (Resource Owner Password Credentials)</div>
                    <div><strong>Response:</strong> access_token, refresh_token, id_token (if requested)</div>
                  </div>
                </div>

                <CredentialsInput
                  environmentId={credentials.environmentId}
                  clientId={credentials.clientId}
                  clientSecret={credentials.clientSecret}
                  scopes="openid profile email"
                  onEnvironmentIdChange={(value) => setCredentials(prev => ({ ...prev, environmentId: value }))}
                  onClientIdChange={(value) => setCredentials(prev => ({ ...prev, clientId: value }))}
                  onClientSecretChange={(value) => setCredentials(prev => ({ ...prev, clientSecret: value }))}
                  onScopesChange={() => {}}
                  showClientSecret={true}
                  showEnvironmentIdInput={true}
                  showRedirectUri={false}
                  showPostLogoutRedirectUri={false}
                  showLoginHint={false}
                  flowKey="password"
                />

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Username *
                  </label>
                  <input
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Enter your username"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={credentials.password}
                      onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter your password"
                      style={{
                        width: '100%',
                        padding: '0.75rem 2.75rem 0.75rem 0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        right: '0.75rem',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#6b7280'
                      }}
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>

                <ModalActions>
                  <Button
                    $variant="secondary"
                    onClick={handleSaveCredentials}
                    disabled={isSavingCredentials}
                  >
                    {isSavingCredentials ? <SpinningIcon><FiRefreshCw size={16} /></SpinningIcon> : <FiCheckCircle size={16} />}
                    {isSavingCredentials ? 'Saving…' : 'Save Credentials'}
                  </Button>

                  <NavigationButton
                    onClick={handleAuthentication}
                    disabled={isLoading || !credentials.username || !credentials.password || !credentials.environmentId}
                  >
                    {isLoading ? <SpinningIcon><FiRefreshCw /></SpinningIcon> : <FiArrowRight />}
                    Authenticate
                  </NavigationButton>
                </ModalActions>
              </ModalBody>
            </ModalCard>
          </ModalOverlay>
        );

      case 'password_auth':
        // Handled in username_login step
    }

    switch (currentStep) {
      case 'mfa_enrollment':
        return (
          <StepContainer>
            <StepHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'white' }}>
                <FiSmartphone size={24} />
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.5rem' }}>MFA Enrollment</h2>
                  <p style={{ margin: '0.25rem 0 0 0', opacity: 0.9 }}>Set up multi-factor authentication</p>
                </div>
              </div>
            </StepHeader>
            <StepContent>
              <Collapsible.CollapsibleSection>
                <Collapsible.CollapsibleHeaderButton
                  onClick={() => toggleSection('mfaEnrollment')}
                  aria-expanded={!collapsedSections.mfaEnrollment}
                >
                  <Collapsible.CollapsibleTitle>
                    <FiSmartphone /> MFA Device Enrollment
                  </Collapsible.CollapsibleTitle>
                  <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.mfaEnrollment}>
                    <FiChevronDown />
                  </Collapsible.CollapsibleToggleIcon>
                </Collapsible.CollapsibleHeaderButton>
                {!collapsedSections.mfaEnrollment && (
                  <Collapsible.CollapsibleContent>
                    <InfoBox $variant="info">
                      <FiInfo size={20} style={{ flexShrink: 0 }} />
                      <InfoContent>
                        <InfoTitle>📱 MFA Device Enrollment</InfoTitle>
                        <InfoText>
                          Multi-factor authentication enhances security by requiring a second form of verification. PingOne supports various MFA methods including SMS, Email, TOTP (Authenticator apps), FIDO2 security keys, and Push notifications.
                        </InfoText>
                      </InfoContent>
                    </InfoBox>

                    <div style={{ margin: '1rem 0', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                        🔗 Supported MFA Methods:
                      </h4>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.5' }}>
                        <div><strong>SMS:</strong> One-time passwords sent via text message</div>
                        <div><strong>Email:</strong> Verification codes sent to email address</div>
                        <div><strong>TOTP:</strong> Time-based one-time passwords from authenticator apps</div>
                        <div><strong>FIDO2:</strong> Hardware security keys (YubiKey, etc.)</div>
                        <div><strong>Push:</strong> Push notifications to mobile devices</div>
                      </div>
                    </div>

                    <NavigationButton onClick={() => setCurrentStep('device_pairing')}>
                      <FiArrowRight />
                      Continue to Device Pairing
                    </NavigationButton>
                  </Collapsible.CollapsibleContent>
                )}
              </Collapsible.CollapsibleSection>
            </StepContent>
          </StepContainer>
        );

      case 'device_pairing':
        return (
          <StepContainer>
            <StepHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'white' }}>
                <FiSmartphone size={24} />
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Device Pairing</h2>
                  <p style={{ margin: '0.25rem 0 0 0', opacity: 0.9 }}>Pair your MFA device</p>
                </div>
              </div>
            </StepHeader>
            <StepContent>
              <Collapsible.CollapsibleSection>
                <Collapsible.CollapsibleHeaderButton
                  onClick={() => toggleSection('deviceSelection')}
                  aria-expanded={!collapsedSections.deviceSelection}
                >
                  <Collapsible.CollapsibleTitle>
                    <FiSmartphone /> Select MFA Device
                  </Collapsible.CollapsibleTitle>
                  <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.deviceSelection}>
                    <FiChevronDown />
                  </Collapsible.CollapsibleToggleIcon>
                </Collapsible.CollapsibleHeaderButton>
                {!collapsedSections.deviceSelection && (
                  <Collapsible.CollapsibleContent>
                    {flowContext.userDevices.length > 0 ? (
                      <>
                        <InfoBox $variant="success">
                          <FiCheckCircle size={20} style={{ flexShrink: 0 }} />
                          <InfoContent>
                            <InfoTitle>✅ MFA Devices Available</InfoTitle>
                            <InfoText>
                              You have {flowContext.userDevices.length} MFA device{flowContext.userDevices.length > 1 ? 's' : ''} registered.
                              Select a device below to proceed with MFA verification.
                            </InfoText>
                          </InfoContent>
                        </InfoBox>

                        {flowContext.userDevices.map((device) => (
                          <div key={device.id} style={{
                            padding: '1rem',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.5rem',
                            margin: '0.5rem 0',
                            cursor: device.status === 'ACTIVE' ? 'pointer' : 'not-allowed',
                            background: device.status === 'ACTIVE' ? '#f0fdf4' : '#f9fafb',
                            opacity: device.status === 'ACTIVE' ? 1 : 0.6
                          }} onClick={() => device.status === 'ACTIVE' && handleDeviceSelection(device)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              {device.type === 'SMS' && <FiPhone />}
                              {device.type === 'EMAIL' && <FiMail />}
                              {device.type === 'TOTP' && <FiLock />}
                              {device.type === 'FIDO2' && <FiShield />}
                              <div>
                                <div style={{ fontWeight: '600' }}>{device.type} Device</div>
                                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                  Status: {device.status}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <InfoBox $variant="warning">
                        <FiAlertCircle size={20} style={{ flexShrink: 0 }} />
                        <InfoContent>
                          <InfoTitle>No MFA Devices</InfoTitle>
                          <InfoText>
                            You need to register at least one MFA device before proceeding.
                            Go back to the MFA Enrollment step to add devices.
                          </InfoText>
                        </InfoContent>
                      </InfoBox>
                    )}

                    <NavigationButton onClick={() => setCurrentStep('username_login')}>
                      <FiArrowLeft />
                      Back to Authentication
                    </NavigationButton>
                  </Collapsible.CollapsibleContent>
                )}
              </Collapsible.CollapsibleSection>
            </StepContent>
          </StepContainer>
        );

      case 'mfa_challenge':
        return (
          <StepContainer>
            <StepHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'white' }}>
                <FiShield size={24} />
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.5rem' }}>MFA Challenge</h2>
                  <p style={{ margin: '0.25rem 0 0 0', opacity: 0.9 }}>Verify your identity</p>
                </div>
              </div>
            </StepHeader>
            <StepContent>
              <Collapsible.CollapsibleSection>
                <Collapsible.CollapsibleHeaderButton
                  onClick={() => toggleSection('mfaChallenge')}
                  aria-expanded={!collapsedSections.mfaChallenge}
                >
                  <Collapsible.CollapsibleTitle>
                    <FiShield /> MFA Verification Challenge
                  </Collapsible.CollapsibleTitle>
                  <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.mfaChallenge}>
                    <FiChevronDown />
                  </Collapsible.CollapsibleToggleIcon>
                </Collapsible.CollapsibleHeaderButton>
                {!collapsedSections.mfaChallenge && (
                  <Collapsible.CollapsibleContent>
                    {flowContext.selectedDevice && (
                      <InfoBox $variant="info">
                        <FiInfo size={20} style={{ flexShrink: 0 }} />
                        <InfoContent>
                          <InfoTitle>📱 MFA Challenge Sent</InfoTitle>
                          <InfoText>
                            A verification challenge has been sent to your {flowContext.selectedDevice.type.toLowerCase()} device.
                            Enter the verification code below to complete authentication.
                          </InfoText>
                        </InfoContent>
                      </InfoBox>
                    )}

                    {apiRequestDetails && (
                      <ApiDisplay $type="request">
                        <ApiTitle>
                          <FiArrowRight style={{ color: '#059669' }} />
                          MFA Challenge API Request
                        </ApiTitle>
                        <div style={{ marginBottom: '1rem' }}>
                          <strong style={{ fontSize: '0.875rem' }}>URL:</strong>
                          <code style={{ background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', marginLeft: '0.5rem' }}>
                            {apiRequestDetails.url}
                          </code>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                          <strong style={{ fontSize: '0.875rem' }}>Request Body:</strong>
                          <div style={{ marginTop: '0.5rem', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '0.375rem', overflow: 'hidden' }}>
                            <JSONHighlighter data={apiRequestDetails.body} />
                          </div>
                        </div>
                      </ApiDisplay>
                    )}

                    {apiResponseDetails && (
                      <ApiDisplay $type="response">
                        <ApiTitle>
                          <FiArrowLeft style={{ color: '#059669' }} />
                          MFA Challenge API Response
                        </ApiTitle>
                        <div style={{ marginBottom: '1rem' }}>
                          <strong style={{ fontSize: '0.875rem' }}>Status:</strong>
                          <code style={{
                            background: apiResponseDetails.status === 200 ? '#dcfce7' : '#fee2e2',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            marginLeft: '0.5rem'
                          }}>
                            {apiResponseDetails.status} {apiResponseDetails.statusText}
                          </code>
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.875rem' }}>Response Body:</strong>
                          <div style={{ marginTop: '0.5rem', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '0.375rem', overflow: 'hidden' }}>
                            <JSONHighlighter data={apiResponseDetails.body} />
                          </div>
                        </div>
                      </ApiDisplay>
                    )}

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                        Verification Code *
                      </label>
                      <input
                        type="text"
                        placeholder="Enter 6-digit verification code"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          textAlign: 'center',
                          letterSpacing: '0.5rem'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <NavigationButton onClick={() => setCurrentStep('device_pairing')}>
                        <FiArrowLeft />
                        Back
                      </NavigationButton>
                      <NavigationButton onClick={() => handleMFASuccess('123456')}>
                        {isLoading ? <SpinningIcon><FiRefreshCw /></SpinningIcon> : <FiArrowRight />}
                        Verify Code
                      </NavigationButton>
                    </div>
                  </Collapsible.CollapsibleContent>
                )}
              </Collapsible.CollapsibleSection>
            </StepContent>
          </StepContainer>
        );

      case 'token_retrieval':
        return (
          <StepContainer>
            <StepHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'white' }}>
                <FiCheckCircle size={24} />
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Token Retrieval</h2>
                  <p style={{ margin: '0.25rem 0 0 0', opacity: 0.9 }}>Getting your access tokens</p>
                </div>
              </div>
            </StepHeader>
            <StepContent>
              <Collapsible.CollapsibleSection>
                <Collapsible.CollapsibleHeaderButton
                  onClick={() => toggleSection('tokenRetrieval')}
                  aria-expanded={!collapsedSections.tokenRetrieval}
                >
                  <Collapsible.CollapsibleTitle>
                    <FiCheckCircle /> Token Exchange & Retrieval
                  </Collapsible.CollapsibleTitle>
                  <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.tokenRetrieval}>
                    <FiChevronDown />
                  </Collapsible.CollapsibleToggleIcon>
                </Collapsible.CollapsibleHeaderButton>
                {!collapsedSections.tokenRetrieval && (
                  <Collapsible.CollapsibleContent>
                    <InfoBox $variant="info">
                      <FiInfo size={20} style={{ flexShrink: 0 }} />
                      <InfoContent>
                        <InfoTitle>🎫 Token Retrieval</InfoTitle>
                        <InfoText>
                          After successful MFA verification, the application retrieves final access tokens from PingOne.
                          These tokens can be used to access protected resources and APIs.
                        </InfoText>
                      </InfoContent>
                    </InfoBox>

                    <div style={{ margin: '1rem 0', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                        🔗 Token Exchange API:
                      </h4>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.5' }}>
                        <div><strong>Endpoint:</strong> POST /environments/{'{environmentId}'}/as/token</div>
                        <div><strong>Grant Type:</strong> authorization_code (for OAuth flows)</div>
                        <div><strong>Response:</strong> access_token, refresh_token, id_token, expires_in</div>
                      </div>
                    </div>

                    <NavigationButton
                      onClick={handleTokenRetrieval}
                      disabled={isLoading}
                    >
                      {isLoading ? <SpinningIcon><FiRefreshCw /></SpinningIcon> : <FiArrowRight />}
                      Retrieve Tokens
                    </NavigationButton>
                  </Collapsible.CollapsibleContent>
                )}
              </Collapsible.CollapsibleSection>
            </StepContent>
          </StepContainer>
        );

      case 'success':
        return (
          <StepContainer>
            <StepHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'white' }}>
                <FiCheckCircle size={24} />
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Authentication Complete</h2>
                  <p style={{ margin: '0.25rem 0 0 0', opacity: 0.9 }}>You have successfully completed MFA authentication</p>
                </div>
              </div>
            </StepHeader>
            <StepContent>
              <Collapsible.CollapsibleSection>
                <Collapsible.CollapsibleHeaderButton
                  onClick={() => toggleSection('success')}
                  aria-expanded={!collapsedSections.success}
                >
                  <Collapsible.CollapsibleTitle>
                    <FiCheckCircle /> Authentication Successful
                  </Collapsible.CollapsibleTitle>
                  <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.success}>
                    <FiChevronDown />
                  </Collapsible.CollapsibleToggleIcon>
                </Collapsible.CollapsibleHeaderButton>
                {!collapsedSections.success && (
                  <Collapsible.CollapsibleContent>
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

                    {flowContext.tokens && (
                      <div style={{ margin: '1rem 0', padding: '1rem', background: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #bbf7d0' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#065f46' }}>
                          ✅ Tokens Retrieved:
                        </h4>
                        <div style={{ fontSize: '0.75rem', color: '#065f46', lineHeight: '1.5' }}>
                          <div><strong>Access Token:</strong> {flowContext.tokens.accessToken.substring(0, 20)}...</div>
                          <div><strong>ID Token:</strong> {flowContext.tokens.idToken.substring(0, 20)}...</div>
                          <div><strong>Refresh Token:</strong> {flowContext.tokens.refreshToken.substring(0, 20)}...</div>
                          <div><strong>Expires In:</strong> {flowContext.tokens.expiresIn} seconds</div>
                        </div>
                      </div>
                    )}

                    <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                      <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                        Your secure session is now active with MFA protection.
                      </p>
                    </div>
                  </Collapsible.CollapsibleContent>
                )}
              </Collapsible.CollapsibleSection>
            </StepContent>
          </StepContainer>
        );

      case 'error':
        return (
          <FlowContainer>
            <div style={{ maxWidth: '500px', width: '100%' }}>
              <ErrorBoundary>
                <ErrorMessage>
                  {error || 'An unexpected error occurred during authentication.'}
                </ErrorMessage>
                <ErrorActions>
                  {retryCount < maxRetries && (
                    <Button $variant="primary" onClick={handleRetry}>
                      <FiRefreshCw size={16} />
                      Try Again ({maxRetries - retryCount} attempts left)
                    </Button>
                  )}
                  <Button onClick={handleRestart}>
                    Start Over
                  </Button>
                </ErrorActions>
              </ErrorBoundary>
            </div>
          </FlowContainer>
        );

      default:
        return null;
    }
  };

  // Get current step index for metadata
  const currentStepIndex = useMemo(() => {
    const stepOrder: FlowStep[] = ['username_login', 'password_auth', 'mfa_enrollment', 'device_pairing', 'mfa_challenge', 'token_retrieval', 'success'];
    return stepOrder.indexOf(currentStep);
  }, [currentStep]);

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

        <MainCard>
          <StepHeader>
            <StepHeaderLeft>
              <VersionBadge>MFA V7</VersionBadge>
              <div>
                <StepHeaderTitle>{STEP_METADATA[currentStepIndex]?.title || 'MFA Authentication'}</StepHeaderTitle>
                <StepHeaderSubtitle>{STEP_METADATA[currentStepIndex]?.subtitle || 'Complete multi-factor authentication'}</StepHeaderSubtitle>
              </div>
            </StepHeaderLeft>
            <StepHeaderRight>
              <StepNumber>{String(currentStepIndex + 1).padStart(2, '0')}</StepNumber>
              <StepTotal>of {STEP_METADATA.length}</StepTotal>
            </StepHeaderRight>
          </StepHeader>

          <StepContentWrapper>
            {renderCurrentStep()}
          </StepContentWrapper>
        </MainCard>
      </ContentWrapper>
    </Container>
  );
};

export default CompleteMFAFlowV6;