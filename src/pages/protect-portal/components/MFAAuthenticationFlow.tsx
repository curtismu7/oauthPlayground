/**
 * @file MFAAuthenticationFlow.tsx
 * @module protect-portal/components
 * @description MFA authentication flow component
 * @version 9.6.5
 * @since 2026-02-10
 *
 * This component handles MFA authentication for medium risk evaluations,
 * including device selection and authentication methods.
 */

import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { FiAlertTriangle, FiCheckCircle, FiLoader, FiShield, FiSmartphone, FiMail, FiKey, FiLock } from 'react-icons/fi';

import type {
  UserContext,
  RiskEvaluationResult,
  MFADevice,
  TokenSet,
  PortalError,
  EducationalContent
} from '../types/protectPortal.types';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const MFAContainer = styled.div`
  width: 100%;
  max-width: 600px;
  text-align: center;
`;

const MFATitle = styled.h2`
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem 0;
`;

const MFADescription = styled.p`
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 2rem 0;
  line-height: 1.6;
`;

const RiskWarning = styled.div`
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const WarningIcon = styled.div`
  color: #f59e0b;
  font-size: 1.5rem;
  flex-shrink: 0;
`;

const WarningContent = styled.div`
  text-align: left;
  flex: 1;
`;

const WarningTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #92400e;
  margin: 0 0 0.5rem 0;
`;

const WarningText = styled.p`
  font-size: 0.875rem;
  color: #78350f;
  margin: 0;
  line-height: 1.5;
`;

const DeviceSelectionContainer = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const DeviceSelectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1.5rem 0;
`;

const DeviceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const DeviceCard = styled.button<{ selected?: boolean }>`
  background: ${props => props.selected ? '#eff6ff' : 'white'};
  border: 2px solid ${props => props.selected ? '#3b82f6' : '#e5e7eb'};
  border-radius: 0.75rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  text-align: center;

  &:hover {
    border-color: ${props => props.selected ? '#3b82f6' : '#9ca3af'};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const DeviceIcon = styled.div<{ deviceType: string }>`
  width: 48px;
  height: 48px;
  background: ${props => {
    switch (props.deviceType) {
      case 'SMS':
        return '#dbeafe';
      case 'EMAIL':
        return '#dcfce7';
      case 'TOTP':
        return '#fef3c7';
      case 'FIDO2':
        return '#ede9fe';
      default:
        return '#f3f4f6';
    }
  }};
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => {
    switch (props.deviceType) {
      case 'SMS':
        return '#1e40af';
      case 'EMAIL':
        return '#166534';
      case 'TOTP':
        return '#92400e';
      case 'FIDO2':
        return '#5b21b6';
      default:
        return '#374151';
    }
  }};
  font-size: 1.25rem;
`;

const DeviceName = styled.div`
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const DeviceStatus = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
`;

const NoDevicesMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6b7280;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  background: ${props => props.variant === 'secondary' ? '#f3f4f6' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'};
  color: ${props => props.variant === 'secondary' ? '#374151' : 'white'};
  border: none;
  border-radius: 0.5rem;
  padding: 1rem 2rem;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
`;

const LoadingSpinner = styled(FiLoader)`
  animation: spin 1s linear infinite;
  font-size: 2rem;
  color: #3b82f6;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  color: #6b7280;
  font-size: 1rem;
  margin: 0;
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1rem;
  color: #dc2626;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const EducationalSection = styled.div`
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: left;
  margin-top: 2rem;
`;

const EducationalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const EducationalTitle = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e40af;
  margin: 0;
`;

const EducationalDescription = styled.p`
  font-size: 0.875rem;
  color: #1e40af;
  margin: 0 0 1rem 0;
  line-height: 1.5;
`;

const KeyPoints = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 1rem 0;
`;

const KeyPoint = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.4;
`;

const KeyPointIcon = styled(FiCheckCircle)`
  color: #10b981;
  flex-shrink: 0;
  margin-top: 0.125rem;
`;

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface MFAAuthenticationFlowProps {
  userContext: UserContext;
  riskEvaluation: RiskEvaluationResult;
  onComplete: (tokens: TokenSet) => void;
  onError: (error: PortalError) => void;
  enableMockMode?: boolean;
  educationalContent: EducationalContent;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockDevices: MFADevice[] = [
  {
    id: 'sms-device-1',
    type: 'SMS',
    name: 'iPhone 13 Pro',
    status: 'ACTIVE',
    phone: '+1***-***-1234',
    createdAt: '2024-01-15T10:30:00Z',
    lastUsedAt: '2024-02-08T14:22:00Z'
  },
  {
    id: 'email-device-1',
    type: 'EMAIL',
    name: 'Personal Email',
    status: 'ACTIVE',
    email: 'user@example.com',
    createdAt: '2024-01-20T09:15:00Z',
    lastUsedAt: '2024-02-05T16:45:00Z'
  },
  {
    id: 'totp-device-1',
    type: 'TOTP',
    name: 'Google Authenticator',
    status: 'ACTIVE',
    createdAt: '2024-01-10T11:00:00Z',
    lastUsedAt: '2024-02-09T08:30:00Z'
  },
  {
    id: 'fido2-device-1',
    type: 'FIDO2',
    name: 'YubiKey 5',
    status: 'ACTIVE',
    createdAt: '2024-01-25T13:45:00Z',
    lastUsedAt: '2024-02-07T10:15:00Z'
  }
];

// ============================================================================
// COMPONENT
// ============================================================================

const MFAAuthenticationFlow: React.FC<MFAAuthenticationFlowProps> = ({
  userContext,
  riskEvaluation,
  onComplete,
  onError,
  enableMockMode = false,
  educationalContent
}) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [availableDevices, setAvailableDevices] = useState<MFADevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<MFADevice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'loading' | 'device-selection' | 'authenticating' | 'complete'>('loading');

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const loadDevices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (enableMockMode) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setAvailableDevices(mockDevices);
      } else {
        // TODO: Implement actual device loading
        throw new Error('Device loading not yet implemented');
      }

      setCurrentStep('device-selection');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load devices';
      setError(errorMessage);
      
      const portalError: PortalError = {
        code: 'DEVICE_LOAD_FAILED',
        message: errorMessage,
        recoverable: true,
        suggestedAction: 'Please try again or contact support'
      };

      onError(portalError);
    } finally {
      setIsLoading(false);
    }
  }, [enableMockMode, onError]);

  const handleDeviceSelect = useCallback((device: MFADevice) => {
    setSelectedDevice(device);
    setError(null);
  }, []);

  const handleAuthenticate = useCallback(async () => {
    if (!selectedDevice) {
      setError('Please select a device');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentStep('authenticating');

    try {
      if (enableMockMode) {
        // Simulate authentication based on device type
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock token generation
        const mockTokens: TokenSet = {
          accessToken: `mock-access-token-${Date.now()}`,
          tokenType: 'Bearer',
          expiresIn: 3600,
          scope: 'openid profile email',
          idToken: `mock-id-token-${Date.now()}`
        };

        setCurrentStep('complete');
        onComplete(mockTokens);
      } else {
        // TODO: Implement actual MFA authentication
        throw new Error('MFA authentication not yet implemented');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      setCurrentStep('device-selection');
      
      const portalError: PortalError = {
        code: 'MFA_AUTH_FAILED',
        message: errorMessage,
        recoverable: true,
        suggestedAction: 'Please try again or select a different device'
      };

      onError(portalError);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDevice, enableMockMode, onComplete, onError]);

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'SMS':
        return <FiSmartphone />;
      case 'EMAIL':
        return <FiMail />;
      case 'TOTP':
        return <FiKey />;
      case 'FIDO2':
        return <FiLock />;
      default:
        return <FiShield />;
    }
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    console.log('[🔐 MFA-AUTHENTICATION] MFA flow initialized', {
      userId: userContext.id,
      riskLevel: riskEvaluation.result.level,
      enableMockMode
    });

    loadDevices();
  }, [loadDevices, userContext.id, riskEvaluation.result.level, enableMockMode]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <MFAContainer>
      <MFATitle>Multi-Factor Authentication</MFATitle>
      <MFADescription>
        Additional verification is required to protect your account
      </MFADescription>

      {/* Risk Warning */}
      <RiskWarning>
        <WarningIcon>
          <FiAlertTriangle />
        </WarningIcon>
        <WarningContent>
          <WarningTitle>Medium Risk Detected</WarningTitle>
          <WarningText>
            Your login attempt shows some unusual patterns. For your security, 
            we require additional verification before proceeding.
          </WarningText>
        </WarningContent>
      </RiskWarning>

      {error && (
        <ErrorMessage>
          <FiAlertTriangle />
          {error}
        </ErrorMessage>
      )}

      {/* Loading State */}
      {currentStep === 'loading' && (
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Loading your authentication devices...</LoadingText>
        </LoadingContainer>
      )}

      {/* Device Selection */}
      {currentStep === 'device-selection' && (
        <DeviceSelectionContainer>
          <DeviceSelectionTitle>Select Authentication Method</DeviceSelectionTitle>
          
          {availableDevices.length > 0 ? (
            <>
              <DeviceGrid>
                {availableDevices.map(device => (
                  <DeviceCard
                    key={device.id}
                    selected={selectedDevice?.id === device.id}
                    onClick={() => handleDeviceSelect(device)}
                    disabled={isLoading}
                  >
                    <DeviceIcon deviceType={device.type}>
                      {getDeviceIcon(device.type)}
                    </DeviceIcon>
                    <DeviceName>{device.name}</DeviceName>
                    <DeviceStatus>
                      {device.type} • {device.status.toLowerCase()}
                    </DeviceStatus>
                  </DeviceCard>
                ))}
              </DeviceGrid>

              <ActionButton
                onClick={handleAuthenticate}
                disabled={!selectedDevice || isLoading}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <FiShield />
                    Authenticate with {selectedDevice?.name || 'Selected Device'}
                  </>
                )}
              </ActionButton>
            </>
          ) : (
            <NoDevicesMessage>
              <FiShield style={{ fontSize: '2rem', marginBottom: '1rem', color: '#9ca3af' }} />
              <p>No authentication devices found</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Please register an MFA device first
              </p>
            </NoDevicesMessage>
          )}
        </DeviceSelectionContainer>
      )}

      {/* Authenticating State */}
      {currentStep === 'authenticating' && (
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>
            Authenticating with {selectedDevice?.name}...
          </LoadingText>
          <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '0.5rem' }}>
            Please follow the instructions on your device
          </p>
        </LoadingContainer>
      )}

      {/* Educational Section */}
      <EducationalSection>
        <EducationalHeader>
          <FiShield style={{ color: '#3b82f6' }} />
          <EducationalTitle>{educationalContent.title}</EducationalTitle>
        </EducationalHeader>
        
        <EducationalDescription>{educationalContent.description}</EducationalDescription>
        
        <KeyPoints>
          {educationalContent.keyPoints.map((point, index) => (
            <KeyPoint key={index}>
              <KeyPointIcon />
              {point}
            </KeyPoint>
          ))}
        </KeyPoints>
      </EducationalSection>
    </MFAContainer>
  );
};

export default MFAAuthenticationFlow;
