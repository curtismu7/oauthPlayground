// src/components/CompleteMFAFlowV6.tsx
// Complete MFA Flow V6 - Based on PingOne_MFA_FullFlow_V6 specification
// Implements full user registration and authentication with MFA enrollment

import React, { useState, useEffect, useCallback } from 'react';
import {
  FiShield,
  FiUser,
  FiSmartphone,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiWifi,
  FiWifiOff,
} from 'react-icons/fi';
import { V5StepperService } from '../services/v5StepperService';

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

  // Callbacks
  onFlowComplete?: (result: {
    success: boolean;
    tokens?: any;
    error?: string;
  }) => void;
  onFlowError?: (error: string, context?: any) => void;
  onStepChange?: (step: string, data?: any) => void;

  // UI customization
  showNetworkStatus?: boolean;
}

type FlowStep =
  | 'create_user'
  | 'username_login'
  | 'mfa_enrollment'
  | 'device_pairing'
  | 'mfa_challenge'
  | 'token_retrieval'
  | 'success'
  | 'error';

// V5Stepper components for consistent UI
const { StepContainer, StepHeader, StepContent, StepNavigation, NavigationButton } = V5StepperService.createStepLayout({ theme: 'purple', showProgress: true });

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
  theme = 'purple',
  allowDeviceRegistration = true,
  requireMFA = true,
  allowedMethods = ['SMS', 'EMAIL', 'TOTP', 'FIDO2'],
  maxRetries = 3,
  onFlowComplete,
  onFlowError,
  onStepChange,
  showNetworkStatus = true,
}) => {
  // Flow state
  const [currentStep, setCurrentStep] = useState<FlowStep>('create_user');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [networkStatus] = useState({ online: true }); // Simplified for demo

  // Flow steps configuration based on specification
  const flowSteps: Array<{ id: FlowStep; title: string; subtitle: string; icon: React.ReactNode }> = [
    { id: 'create_user', title: 'Create User', subtitle: 'Set up new user account', icon: <FiUser size={12} /> },
    { id: 'username_login', title: 'Sign In', subtitle: 'Enter username/email', icon: <FiUser size={12} /> },
    { id: 'mfa_enrollment', title: 'MFA Enrollment', subtitle: 'Set up multi-factor authentication', icon: <FiSmartphone size={12} /> },
    { id: 'device_pairing', title: 'Device Pairing', subtitle: 'Pair your MFA device', icon: <FiSmartphone size={12} /> },
    { id: 'mfa_challenge', title: 'MFA Challenge', subtitle: 'Verify your identity', icon: <FiShield size={12} /> },
    { id: 'token_retrieval', title: 'Token Retrieval', subtitle: 'Get access tokens', icon: <FiCheckCircle size={12} /> },
    { id: 'success', title: 'Complete', subtitle: 'Authentication successful', icon: <FiCheckCircle size={12} /> }
  ];

  // Initialize flow
  useEffect(() => {
    console.log('🔑 [MFA Flow V6] Initializing PingOne MFA flow');
    setCurrentStep('create_user');
    onStepChange?.('create_user');
  }, []);

  const handleUserCreation = useCallback(async (userData: any) => {
    try {
      setIsLoading(true);
      console.log('👤 [MFA Flow V6] Creating user:', userData);

      // Simulate user creation
      await new Promise(resolve => setTimeout(resolve, 1000));

      setCurrentStep('username_login');
      onStepChange?.('username_login', userData);
    } catch (err) {
      console.error('❌ [MFA Flow V6] User creation failed:', err);
      setError('Failed to create user account');
      setCurrentStep('error');
      onFlowError?.('User creation failed', err);
    } finally {
      setIsLoading(false);
    }
  }, [onStepChange, onFlowError]);

  const handleAuthenticationSuccess = useCallback(async (credentials: any) => {
    try {
      setIsLoading(true);
      console.log('🔐 [MFA Flow V6] Authentication successful');

      // Determine next step based on MFA requirements
      if (requireMFA) {
        setCurrentStep('mfa_enrollment');
        onStepChange?.('mfa_enrollment');
      } else {
        setCurrentStep('token_retrieval');
        onStepChange?.('token_retrieval');
      }
    } catch (err) {
      console.error('❌ [MFA Flow V6] Authentication processing failed:', err);
      setError('Authentication processing failed');
      setCurrentStep('error');
      onFlowError?.('Authentication processing failed', err);
    } finally {
      setIsLoading(false);
    }
  }, [requireMFA, onStepChange, onFlowError]);

  const handleDeviceSelection = useCallback(async (device: any) => {
    try {
      setIsLoading(true);
      console.log('📱 [MFA Flow V6] Device selected:', device);

      setCurrentStep('mfa_challenge');
      onStepChange?.('mfa_challenge', { device });
    } catch (err) {
      console.error('❌ [MFA Flow V6] Device selection failed:', err);
      setError('Device selection failed');
      setCurrentStep('error');
      onFlowError?.('Device selection failed', err);
    } finally {
      setIsLoading(false);
    }
  }, [onStepChange, onFlowError]);

  const handleMFASuccess = useCallback(async (result: any, device: any) => {
    try {
      setIsLoading(true);
      console.log('✅ [MFA Flow V6] MFA verification successful');

      setCurrentStep('token_retrieval');
      onStepChange?.('token_retrieval');
    } catch (err) {
      console.error('❌ [MFA Flow V6] MFA verification processing failed:', err);
      setError('MFA verification processing failed');
      setCurrentStep('error');
      onFlowError?.('MFA verification processing failed', err);
    } finally {
      setIsLoading(false);
    }
  }, [onStepChange, onFlowError]);

  const handleTokenRetrieval = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🎫 [MFA Flow V6] Retrieving tokens');

      // Simulate token retrieval
      await new Promise(resolve => setTimeout(resolve, 1000));

      const tokens = {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        idToken: 'eyJraWQiOiJrMTIzIn0.eyJzdWIiOiJ1c2VyXzEyMyJ9...',
        refreshToken: 'def50200a1bcd...'
      };

      setCurrentStep('success');
      onStepChange?.('success', tokens);
      onFlowComplete?.({ success: true, tokens });
    } catch (err) {
      console.error('❌ [MFA Flow V6] Token retrieval failed:', err);
      setError('Token retrieval failed');
      setCurrentStep('error');
      onFlowError?.('Token retrieval failed', err);
    } finally {
      setIsLoading(false);
    }
  }, [onStepChange, onFlowComplete, onFlowError]);

  const handleRetry = useCallback(() => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setError(null);

      // Reset to appropriate step
      setCurrentStep('username_login');
    } else {
      onFlowError?.('Maximum retry attempts exceeded', { retryCount });
    }
  }, [retryCount, maxRetries, onFlowError]);

  const handleRestart = useCallback(() => {
    setRetryCount(0);
    setError(null);
    setCurrentStep('create_user');
    console.log('🔄 [MFA Flow V6] Flow restarted');
  }, []);

  const renderCurrentStep = () => {
    if (isLoading && currentStep === 'create_user') {
      return (
        <FlowContainer>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <FiRefreshCw size={48} color="#8b5cf6" style={{ animation: 'spin 1s linear infinite' }} />
            <h3 style={{ margin: '1rem 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
              Initializing PingOne MFA Flow
            </h3>
            <p style={{ margin: 0, color: '#6b7280' }}>
              Setting up your secure multi-factor authentication flow...
            </p>
          </div>
        </FlowContainer>
      );
    }

    switch (currentStep) {
      case 'create_user':
        return (
          <StepContainer>
            <StepHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'white' }}>
                <FiUser size={24} />
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Create User Account</h2>
                  <p style={{ margin: '0.25rem 0 0 0', opacity: 0.9 }}>Set up your new PingOne user account</p>
                </div>
              </div>
            </StepHeader>
            <StepContent>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <h3>Create New User</h3>
                <p>This step would include user registration form components.</p>
                <NavigationButton
                  onClick={() => handleUserCreation({ username: 'test@example.com' })}
                  disabled={isLoading}
                >
                  {isLoading ? <FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} /> : null}
                  Continue to Login
                </NavigationButton>
              </div>
            </StepContent>
          </StepContainer>
        );

      case 'username_login':
        return (
          <StepContainer>
            <StepHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'white' }}>
                <FiUser size={24} />
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Sign In</h2>
                  <p style={{ margin: '0.25rem 0 0 0', opacity: 0.9 }}>Enter your username and password</p>
                </div>
              </div>
            </StepHeader>
            <StepContent>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <h3>Authentication Form</h3>
                <p>This step would include the PingOne login form.</p>
                <NavigationButton
                  onClick={() => handleAuthenticationSuccess({ userId: 'test-user' })}
                  disabled={isLoading}
                >
                  {isLoading ? <FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} /> : null}
                  Continue to MFA
                </NavigationButton>
              </div>
            </StepContent>
          </StepContainer>
        );

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
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <h3>Enroll in MFA</h3>
                <p>You need to set up multi-factor authentication to continue.</p>
                <NavigationButton onClick={() => setCurrentStep('device_pairing')}>
                  Continue to Device Pairing
                </NavigationButton>
              </div>
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
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <h3>Select Device</h3>
                <p>This step would show available MFA devices for pairing.</p>
                <NavigationButton
                  onClick={() => handleDeviceSelection({ id: 'test-device', type: 'TOTP' })}
                  disabled={isLoading}
                >
                  {isLoading ? <FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} /> : null}
                  Select Device
                </NavigationButton>
              </div>
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
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <h3>MFA Verification</h3>
                <p>This step would include the MFA challenge form.</p>
                <NavigationButton
                  onClick={() => handleMFASuccess({}, { id: 'test-device', type: 'TOTP' })}
                  disabled={isLoading}
                >
                  {isLoading ? <FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} /> : null}
                  Verify Identity
                </NavigationButton>
              </div>
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
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <h3>Retrieving Tokens</h3>
                <p>Getting your access, ID, and refresh tokens...</p>
                <NavigationButton
                  onClick={handleTokenRetrieval}
                  disabled={isLoading}
                >
                  {isLoading ? <FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} /> : null}
                  Get Tokens
                </NavigationButton>
              </div>
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
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <FiCheckCircle size={64} color="#10b981" />
                <h3 style={{ margin: '1rem 0', color: '#10b981' }}>Success!</h3>
                <p>Your MFA authentication is complete. You can now access protected resources.</p>
              </div>
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

  return (
    <FlowContainer>
      {/* Network Status Bar */}
      {showNetworkStatus && (
        <NetworkStatusBar $online={networkStatus.online}>
          {networkStatus.online ? (
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

      {/* Main Flow Content */}
      {renderCurrentStep()}
    </FlowContainer>
  );
};

export default CompleteMFAFlowV6;