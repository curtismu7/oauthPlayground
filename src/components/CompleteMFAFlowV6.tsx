// src/components/CompleteMFAFlowV6.tsx
// Main MFA Flow Orchestrator using V6 Architecture

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FiShield, 
  FiUser, 
  FiSmartphone, 
  FiCheckCircle, 
  FiAlertCircle,
  FiRefreshCw,
  FiArrowLeft,
  FiInfo,
  FiWifi,
  FiWifiOff,
} from 'react-icons/fi';
import { V6FlowService } from '../services/v6FlowService';
import { useV6CollapsibleSections } from '../services/v6StepManagementService';
import SecuritySessionService, { type SecuritySession } from '../services/securitySessionService';
import NetworkStatusService, { type NetworkStatus } from '../services/networkStatusService';
import AuthErrorRecoveryService from '../services/authErrorRecoveryService';
import SecurityMonitoringService from '../services/securityMonitoringService';
import { FlowStepNavigationService } from '../services/flowStepNavigationService';
import { V5StepperService } from '../services/v5StepperService';

import PingOneLoginFormV6 from './PingOneLoginFormV6';
import MFADeviceSelectorV6 from './MFADeviceSelectorV6';
import MFAChallengeFormV6 from './MFAChallengeFormV6';
import SuccessPageV6 from './SuccessPageV6';

import PingOneAuthService, { type AuthCredentials } from '../services/pingOneAuthService';
import PingOneMfaService, { type MfaCredentials, type MfaDevice } from '../services/pingOneMfaService';
import { v4ToastManager } from '../utils/v4ToastMessages';

import styled from 'styled-components';

export interface CompleteMFAFlowProps {
  // Configuration
  environmentId?: string;
  clientId?: string;
  redirectUri?: string;
  theme?: 'blue' | 'green' | 'purple';
  
  // Flow options
  allowDeviceRegistration?: boolean;
  requireMFA?: boolean;
  allowedMethods?: string[];
  maxRetries?: number;
  sessionTimeout?: number;
  
  // Callbacks
  onFlowComplete?: (result: {
    success: boolean;
    session?: SecuritySession;
    flowState?: FlowState;
    error?: string;
  }) => void;
  onFlowError?: (error: string, context?: any) => void;
  onStepChange?: (step: string, data?: any) => void;
  
  // UI customization
  showProgress?: boolean;
  showNetworkStatus?: boolean;
  enableOfflineMode?: boolean;
  customBranding?: {
    logo?: string;
    companyName?: string;
    primaryColor?: string;
  };
}

type FlowStep = 
  | 'initialization'
  | 'authentication' 
  | 'device_selection' 
  | 'device_registration' 
  | 'mfa_challenge' 
  | 'verification' 
  | 'success' 
  | 'error';

interface FlowContext {
  flowId: string;
  authCredentials?: AuthCredentials;
  mfaCredentials?: MfaCredentials;
  userDevices: MfaDevice[];
  selectedDevice?: MfaDevice;
  session?: SecuritySession;
  networkStatus: NetworkStatus;
  error?: string;
}

const FlowContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
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

const ProgressIndicator = styled.div`
  position: fixed;
  top: ${props => props.theme.showNetworkStatus ? '3rem' : '1rem'};
  right: 1rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 0.75rem;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  z-index: 999;
`;

const ProgressStep = styled.div<{ $active: boolean; $completed: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  font-size: 0.875rem;
  color: ${props => {
    if (props.$completed) return '#10b981';
    if (props.$active) return '#3b82f6';
    return '#6b7280';
  }};
  font-weight: ${props => props.$active ? '600' : '400'};
`;

const StepIcon = styled.div<{ $active: boolean; $completed: boolean }>`
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    if (props.$completed) return '#10b981';
    if (props.$active) return '#3b82f6';
    return '#e5e7eb';
  }};
  color: ${props => (props.$active || props.$completed) ? 'white' : '#6b7280'};
  font-size: 0.75rem;
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

export const CompleteMFAFlowV6: React.FC<CompleteMFAFlowProps> = ({
  environmentId = 'default',
  clientId = 'default',
  redirectUri = window.location.origin,
  theme = 'blue',
  allowDeviceRegistration = true,
  requireMFA = true,
  allowedMethods = ['SMS', 'EMAIL', 'TOTP', 'FIDO2'],
  maxRetries = 3,
  sessionTimeout = 30 * 60 * 1000, // 30 minutes
  onFlowComplete,
  onFlowError,
  onStepChange,
  showProgress = true,
  showNetworkStatus = true,
  enableOfflineMode = false,
  customBranding
}) => {
  const { Layout, Collapsible, Info, Cards } = V6FlowService.createFlowComponents(theme);
  const { collapsedSections, toggleSection } = useV6CollapsibleSections();

  // Flow state
  const [currentStep, setCurrentStep] = useState<FlowStep>('initialization');
  const [flowContext, setFlowContext] = useState<FlowContext>({
    flowId: '',
    userDevices: [],
    networkStatus: NetworkStatusService.getNetworkStatus()
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Flow steps configuration
  const flowSteps: Array<{ id: FlowStep; title: string; icon: React.ReactNode }> = [
    { id: 'authentication', title: 'Sign In', icon: <FiUser size={12} /> },
    { id: 'device_selection', title: 'Select Device', icon: <FiSmartphone size={12} /> },
    { id: 'mfa_challenge', title: 'Verify Identity', icon: <FiShield size={12} /> },
    { id: 'success', title: 'Complete', icon: <FiCheckCircle size={12} /> }
  ];

  // Initialize flow
  useEffect(() => {
    initializeFlow();
  }, []);

  // Monitor network status
  useEffect(() => {
    const handleNetworkChange = (status: NetworkStatus) => {
      setFlowContext(prev => ({ ...prev, networkStatus: status }));
      
      if (!status.online && !enableOfflineMode) {
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
  }, [enableOfflineMode, flowContext.flowId]);

  const initializeFlow = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize services
      NetworkStatusService.initialize();
      SecurityMonitoringService.initialize();

      // Create flow state
      const flowState = FlowStateService.initializeFlow(
        'anonymous', // Will be updated after authentication
        'complete_mfa',
        {
          allowedMethods,
          requireMultipleFactors: false,
          sessionTimeout,
          maxRetries
        }
      );

      setFlowContext(prev => ({
        ...prev,
        flowId: flowState.flowId,
        networkStatus: NetworkStatusService.getNetworkStatus()
      }));

      // Start authentication step
      FlowStateService.startStep(flowState.flowId, 'authentication');
      setCurrentStep('authentication');
      
      // Log security event
      SecurityMonitoringService.logSecurityEvent({
        level: 'info',
        category: 'authentication',
        event: 'mfa_flow_started',
        details: {
          flowId: flowState.flowId,
          environmentId,
          allowedMethods
        },
        sensitiveData: false,
        riskScore: 10
      });

      onStepChange?.('authentication');
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Flow initialization failed'), {
        operation: 'flow_initialization'
      });
    } finally {
      setIsLoading(false);
    }
  };

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
          retryCount
        },
        sensitiveData: false,
        riskScore: 60
      });

      // Attempt error recovery
      const recoveryResult = await AuthErrorRecoveryService.handleError(error, {
        operation: context.operation || 'unknown',
        userId: flowContext.authCredentials?.userId,
        flowId: flowContext.flowId,
        timestamp: new Date()
      });

      if (recoveryResult.success) {
        // Recovery successful, continue flow
        setError(null);
        return;
      }

      // Recovery failed, show error to user
      setError(recoveryResult.message);
      setCurrentStep('error');
      
      // Fail the flow step
      if (flowContext.flowId) {
        FlowStateService.failStep(
          flowContext.flowId,
          currentStep,
          error.message
        );
      }

      onFlowError?.(error.message, context);
    } catch (recoveryError) {
      console.error('Error recovery failed:', recoveryError);
      v4ToastManager.showError('An unexpected error occurred. Please refresh the page and try again.');
      setError('An unexpected error occurred. Please refresh the page and try again.');
      setCurrentStep('error');
    }
  };

  const handleAuthenticationSuccess = async (credentials: AuthCredentials) => {
    try {
      setIsLoading(true);
      
      // Complete authentication step
      FlowStateService.completeStep(flowContext.flowId, 'authentication', {
        userId: credentials.userId
      });

      // Create MFA credentials
      const mfaCredentials: MfaCredentials = {
        userId: credentials.userId,
        accessToken: credentials.accessToken,
        environmentId: credentials.environmentId
      };

      // Get user's MFA devices
      const devices = await PingOneMfaService.getRegisteredDevices(mfaCredentials);

      setFlowContext(prev => ({
        ...prev,
        authCredentials: credentials,
        mfaCredentials,
        userDevices: devices
      }));

      // Log security event
      SecurityMonitoringService.logSecurityEvent({
        level: 'info',
        category: 'authentication',
        event: 'authentication_success',
        userId: credentials.userId,
        details: {
          deviceCount: devices.length,
          hasActiveDevices: devices.some(d => d.status === 'ACTIVE')
        },
        sensitiveData: false,
        riskScore: 20
      });

      // Determine next step
      if (devices.length === 0 && allowDeviceRegistration) {
        // No devices, go to registration
        FlowStateService.startStep(flowContext.flowId, 'device_registration');
        setCurrentStep('device_registration');
        onStepChange?.('device_registration');
      } else if (devices.length > 0) {
        // Has devices, go to selection
        FlowStateService.startStep(flowContext.flowId, 'device_selection');
        setCurrentStep('device_selection');
        onStepChange?.('device_selection');
      } else {
        throw new Error('No MFA devices available and registration is disabled');
      }
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Authentication processing failed'), {
        operation: 'authentication_processing',
        userId: credentials.userId
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeviceSelection = async (device: MfaDevice) => {
    try {
      setIsLoading(true);
      
      // Complete device selection step
      FlowStateService.completeStep(flowContext.flowId, 'device_selection', {
        deviceId: device.id,
        deviceType: device.type
      });

      setFlowContext(prev => ({
        ...prev,
        selectedDevice: device
      }));

      // Start MFA challenge
      FlowStateService.startStep(flowContext.flowId, 'challenge');
      setCurrentStep('mfa_challenge');
      onStepChange?.('mfa_challenge', { device });
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Device selection failed'), {
        operation: 'device_selection',
        deviceId: device.id
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFASuccess = async (result: any, device: MfaDevice) => {
    try {
      setIsLoading(true);
      
      // Complete verification step
      FlowStateService.completeStep(flowContext.flowId, 'verification', {
        deviceId: device.id,
        verificationMethod: device.type,
        challengeId: result.challengeId
      });

      // Create security session
      if (flowContext.authCredentials) {
        const session = await SecuritySessionService.createSession(
          flowContext.authCredentials.userId,
          {
            accessToken: flowContext.authCredentials.accessToken,
            refreshToken: flowContext.authCredentials.refreshToken || '',
            expiresIn: 3600 // 1 hour
          },
          {
            ipAddress: '127.0.0.1', // In real implementation, get actual IP
            userAgent: navigator.userAgent,
            mfaDevices: [device.id]
          }
        );

        setFlowContext(prev => ({
          ...prev,
          session
        }));

        // Mark MFA as completed
        SecuritySessionService.completeMFA(session.sessionId, [device.id]);
      }

      // Complete the flow
      FlowStateService.completeFlow(flowContext.flowId);
      
      // Log security event
      SecurityMonitoringService.logSecurityEvent({
        level: 'info',
        category: 'mfa',
        event: 'mfa_verification_success',
        userId: flowContext.authCredentials?.userId,
        deviceId: device.id,
        details: {
          deviceType: device.type,
          flowId: flowContext.flowId
        },
        sensitiveData: false,
        riskScore: 5
      });

      setCurrentStep('success');
      onStepChange?.('success');
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('MFA verification processing failed'), {
        operation: 'mfa_verification',
        deviceId: device.id
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlowComplete = (sessionData: any) => {
    const flowState = FlowStateService.getFlowState(flowContext.flowId);
    
    onFlowComplete?.({
      success: true,
      session: flowContext.session,
      flowState: flowState || undefined
    });
  };

  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setError(null);
      
      // Reset to appropriate step based on context
      if (flowContext.authCredentials) {
        setCurrentStep('device_selection');
      } else {
        setCurrentStep('authentication');
      }
    } else {
      onFlowError?.('Maximum retry attempts exceeded', { retryCount });
    }
  };

  const handleRestart = () => {
    setRetryCount(0);
    setError(null);
    setFlowContext({
      flowId: '',
      userDevices: [],
      networkStatus: NetworkStatusService.getNetworkStatus()
    });
    initializeFlow();
  };

  const getStepIndex = (step: FlowStep): number => {
    return flowSteps.findIndex(s => s.id === step);
  };

  const isStepCompleted = (step: FlowStep): boolean => {
    const currentIndex = getStepIndex(currentStep);
    const stepIndex = getStepIndex(step);
    return stepIndex < currentIndex || currentStep === 'success';
  };

  const isStepActive = (step: FlowStep): boolean => {
    return step === currentStep;
  };

  const renderCurrentStep = () => {
    if (isLoading && currentStep === 'initialization') {
      return (
        <Layout.Container>
          <Layout.ContentWrapper>
            <Layout.MainCard>
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <FiRefreshCw size={48} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
                <h3 style={{ margin: '1rem 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
                  Initializing Secure Authentication
                </h3>
                <p style={{ margin: 0, color: '#6b7280' }}>
                  Setting up your secure multi-factor authentication flow...
                </p>
              </div>
            </Layout.MainCard>
          </Layout.ContentWrapper>
        </Layout.Container>
      );
    }

    switch (currentStep) {
      case 'authentication':
        return (
          <PingOneLoginFormV6
            environmentId={environmentId}
            clientId={clientId}
            redirectUri={redirectUri}
            onAuthenticationSuccess={handleAuthenticationSuccess}
            onAuthenticationError={(error) => handleError(new Error(error), { operation: 'authentication' })}
            theme={theme}
            customBranding={customBranding}
          />
        );

      case 'device_selection':
        if (!flowContext.mfaCredentials) {
          return null;
        }
        return (
          <MFADeviceSelectorV6
            credentials={flowContext.mfaCredentials}
            devices={flowContext.userDevices}
            allowedMethods={allowedMethods}
            onDeviceSelected={handleDeviceSelection}
            onRegisterDevice={() => setCurrentStep('device_registration')}
            onCancel={() => setCurrentStep('authentication')}
            theme={theme}
            allowRegistration={allowDeviceRegistration}
          />
        );

      case 'mfa_challenge':
        if (!flowContext.mfaCredentials || !flowContext.selectedDevice) {
          return null;
        }
        return (
          <MFAChallengeFormV6
            credentials={flowContext.mfaCredentials}
            devices={[flowContext.selectedDevice]}
            selectedDeviceId={flowContext.selectedDevice.id}
            autoInitiateChallenge={true}
            onChallengeSuccess={handleMFASuccess}
            onChallengeError={(error) => handleError(new Error(error), { 
              operation: 'mfa_challenge',
              deviceId: flowContext.selectedDevice?.id 
            })}
            onCancel={() => setCurrentStep('device_selection')}
            theme={theme}
          />
        );

      case 'success':
        return (
          <SuccessPageV6
            flowId={flowContext.flowId}
            sessionId={flowContext.session?.sessionId}
            onRegisterAdditionalDevice={() => setCurrentStep('device_registration')}
            onManageDevices={() => v4ToastManager.showInfo('Device management feature coming soon')}
            onReturnToApplication={handleFlowComplete}
            theme={theme}
            returnUrl={redirectUri}
          />
        );

      case 'error':
        return (
          <Layout.Container>
            <Layout.ContentWrapper>
              <Layout.MainCard>
                <Collapsible.CollapsibleSection>
                  <Collapsible.CollapsibleHeaderButton
                    onClick={() => toggleSection('error')}
                    aria-expanded={!collapsedSections.error}
                  >
                    <Collapsible.CollapsibleTitle>
                      <FiAlertCircle /> Authentication Error
                    </Collapsible.CollapsibleTitle>
                    <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.error}>
                      <FiRefreshCw />
                    </Collapsible.CollapsibleToggleIcon>
                  </Collapsible.CollapsibleHeaderButton>
                  {!collapsedSections.error && (
                    <Collapsible.CollapsibleContent>
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
                            <FiArrowLeft size={16} />
                            Start Over
                          </Button>
                          <Button onClick={() => onFlowError?.(error || 'Unknown error', { step: currentStep })}>
                            <FiInfo size={16} />
                            Get Help
                          </Button>
                        </ErrorActions>
                      </ErrorBoundary>
                    </Collapsible.CollapsibleContent>
                  )}
                </Collapsible.CollapsibleSection>
              </Layout.MainCard>
            </Layout.ContentWrapper>
          </Layout.Container>
        );

      default:
        return null;
    }
  };

  return (
    <FlowContainer>
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
              {enableOfflineMode && ' - Limited functionality available'}
            </>
          )}
        </NetworkStatusBar>
      )}

      {/* Progress Indicator */}
      {showProgress && currentStep !== 'initialization' && currentStep !== 'error' && (
        <ProgressIndicator theme={{ showNetworkStatus }}>
          <div style={{ marginBottom: '0.5rem', fontWeight: '600', color: '#1f2937' }}>
            Authentication Progress
          </div>
          {flowSteps.map((step, index) => (
            <ProgressStep
              key={step.id}
              $active={isStepActive(step.id)}
              $completed={isStepCompleted(step.id)}
            >
              <StepIcon
                $active={isStepActive(step.id)}
                $completed={isStepCompleted(step.id)}
              >
                {isStepCompleted(step.id) ? <FiCheckCircle size={12} /> : step.icon}
              </StepIcon>
              {step.title}
            </ProgressStep>
          ))}
        </ProgressIndicator>
      )}

      {/* Main Flow Content */}
      {renderCurrentStep()}
    </FlowContainer>
  );
};

export default CompleteMFAFlowV6;