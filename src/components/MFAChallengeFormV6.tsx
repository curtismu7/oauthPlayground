// src/components/MFAChallengeFormV6.tsx
// MFA Challenge Form Component using V6 Architecture

import React, { useState, useCallback, useEffect } from 'react';
import { 
  FiShield, 
  FiSmartphone, 
  FiMail, 
  FiMessageSquare, 
  FiPhone,
  FiKey,
  FiCheck, 
  FiX, 
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiLock,
  FiArrowLeft
} from 'react-icons/fi';
import { V6FlowService } from '../services/v6FlowService';
import { useV6CollapsibleSections } from '../services/v6StepManagementService';
import PingOneMfaService, { 
  type MfaCredentials,
  type MfaDevice,
  type ChallengeResult,
  type ValidationResult
} from '../services/pingOneMfaService';
import FIDOService, { type FIDOChallenge, type FIDOAuthResult } from '../services/fidoService';
import OTPValidationFormV6 from './OTPValidationFormV6';
import styled from 'styled-components';

export interface MFAChallengeFormProps {
  credentials: MfaCredentials;
  devices: MfaDevice[];
  onChallengeSuccess: (result: ValidationResult, device: MfaDevice) => void;
  onChallengeError: (error: string) => void;
  onCancel: () => void;
  onBackToDeviceSelection?: () => void;
  theme?: 'blue' | 'green' | 'purple';
  preselectedDeviceId?: string;
}

const FormContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const DeviceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
`;

const DeviceCard = styled.div<{ $selected?: boolean; $disabled?: boolean }>`
  padding: 1.5rem;
  border: 2px solid ${props => {
    if (props.$disabled) return '#e5e7eb';
    if (props.$selected) return '#3b82f6';
    return '#d1d5db';
  }};
  border-radius: 0.75rem;
  background: ${props => {
    if (props.$disabled) return '#f9fafb';
    if (props.$selected) return '#eff6ff';
    return '#ffffff';
  }};
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  opacity: ${props => props.$disabled ? 0.6 : 1};

  &:hover {
    ${props => !props.$disabled && !props.$selected && `
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      border-color: #9ca3af;
    `}
  }
`;

const DeviceIcon = styled.div<{ $type: string }>`
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: ${props => {
    switch (props.$type) {
      case 'TOTP': return '#3b82f6';
      case 'SMS': return '#10b981';
      case 'EMAIL': return '#f59e0b';
      case 'VOICE': return '#8b5cf6';
      case 'FIDO2': return '#ef4444';
      case 'MOBILE': return '#06b6d4';
      default: return '#6b7280';
    }
  }};
  margin-bottom: 1rem;
`;

const DeviceInfo = styled.div`
  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
  }
  
  p {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.4;
  }
`;

const DeviceStatus = styled.div<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  margin-top: 0.75rem;
  
  ${props => {
    switch (props.$status) {
      case 'ACTIVE':
        return `
          background: #dcfce7;
          color: #166534;
        `;
      case 'PENDING_ACTIVATION':
        return `
          background: #fef3c7;
          color: #92400e;
        `;
      default:
        return `
          background: #f3f4f6;
          color: #374151;
        `;
    }
  }}
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' | 'danger' }>`
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
  min-width: 120px;
  
  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: #3b82f6;
          color: white;
          &:hover:not(:disabled) { background: #2563eb; }
        `;
      case 'success':
        return `
          background: #10b981;
          color: white;
          &:hover:not(:disabled) { background: #059669; }
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

const TOTPInput = styled.input<{ $hasError?: boolean; $isValid?: boolean }>`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid ${props => {
    if (props.$hasError) return '#ef4444';
    if (props.$isValid) return '#10b981';
    return '#d1d5db';
  }};
  border-radius: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  text-align: center;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  letter-spacing: 0.1em;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${props => {
      if (props.$hasError) return '#ef4444';
      if (props.$isValid) return '#10b981';
      return '#3b82f6';
    }};
    box-shadow: 0 0 0 3px ${props => {
      if (props.$hasError) return 'rgba(239, 68, 68, 0.1)';
      if (props.$isValid) return 'rgba(16, 185, 129, 0.1)';
      return 'rgba(59, 130, 246, 0.1)';
    }};
  }
  
  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }
`;

const ErrorText = styled.div`
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const SuccessText = styled.div`
  color: #10b981;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const ChallengeContainer = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 2rem;
  margin: 1.5rem 0;
  text-align: center;
`;

const FIDOPrompt = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  
  .icon {
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    background: #3b82f6;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

export const MFAChallengeFormV6: React.FC<MFAChallengeFormProps> = ({
  credentials,
  devices,
  onChallengeSuccess,
  onChallengeError,
  onCancel,
  onBackToDeviceSelection,
  theme = 'blue',
  preselectedDeviceId
}) => {
  const { Layout, Collapsible, Info, Cards } = V6FlowService.createFlowComponents(theme);
  const { collapsedSections, toggleSection } = useV6CollapsibleSections();

  // State management
  const [selectedDevice, setSelectedDevice] = useState<MfaDevice | null>(
    preselectedDeviceId ? devices.find(d => d.id === preselectedDeviceId) || null : null
  );
  const [currentStep, setCurrentStep] = useState<'select' | 'challenge' | 'verify'>('select');
  const [challengeResult, setChallengeResult] = useState<ChallengeResult | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [isInitiatingChallenge, setIsInitiatingChallenge] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isFIDOActive, setIsFIDOActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-advance to challenge if device is preselected
  useEffect(() => {
    if (preselectedDeviceId && selectedDevice) {
      setCurrentStep('challenge');
      initiateChallenge(selectedDevice);
    }
  }, [preselectedDeviceId, selectedDevice]);

  const handleDeviceSelect = useCallback((device: MfaDevice) => {
    if (device.status !== 'ACTIVE') {
      setError('This device is not active and cannot be used for authentication');
      return;
    }

    setSelectedDevice(device);
    setCurrentStep('challenge');
    setError(null);
    initiateChallenge(device);
  }, []);

  const initiateChallenge = useCallback(async (device: MfaDevice) => {
    setIsInitiatingChallenge(true);
    setError(null);

    try {
      if (device.type === 'FIDO2') {
        // Handle FIDO challenge
        await handleFIDOChallenge(device);
      } else if (['EMAIL', 'SMS', 'VOICE'].includes(device.type)) {
        // Handle OTP challenge
        const challenge = await PingOneMfaService.initiateChallenge(
          credentials,
          device.id,
          device.type as 'EMAIL' | 'SMS' | 'VOICE'
        );
        setChallengeResult(challenge);
        setCurrentStep('verify');
      } else if (device.type === 'TOTP') {
        // TOTP doesn't need challenge initiation, go directly to verify
        setCurrentStep('verify');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate challenge';
      setError(errorMessage);
      onChallengeError(errorMessage);
    } finally {
      setIsInitiatingChallenge(false);
    }
  }, [credentials, onChallengeError]);

  const handleFIDOChallenge = useCallback(async (device: MfaDevice) => {
    try {
      setIsFIDOActive(true);
      
      // Get authentication options from PingOne or create mock challenge
      const challengeData: FIDOChallenge = {
        challengeId: `fido_challenge_${Date.now()}`,
        challenge: btoa(crypto.getRandomValues(new Uint8Array(32)).toString()),
        allowCredentials: [{
          type: 'public-key',
          id: new TextEncoder().encode(device.id).buffer,
          transports: ['usb', 'nfc', 'ble', 'internal']
        }],
        timeout: 60000,
        userVerification: 'preferred',
        rpId: window.location.hostname
      };

      const authResult = await FIDOService.authenticateDevice(credentials.userId, challengeData);
      
      if (authResult.success) {
        const validationResult: ValidationResult = {
          valid: true,
          challengeId: authResult.challengeId,
          deviceId: device.id
        };
        
        onChallengeSuccess(validationResult, device);
      } else {
        throw new Error(authResult.error || 'FIDO authentication failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'FIDO authentication failed';
      setError(errorMessage);
      onChallengeError(errorMessage);
    } finally {
      setIsFIDOActive(false);
    }
  }, [credentials.userId, onChallengeSuccess, onChallengeError]);

  const handleTOTPVerify = useCallback(async () => {
    if (!selectedDevice || !totpCode.trim() || totpCode.length !== 6) {
      setError('Please enter a valid 6-digit TOTP code');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const validation = await PingOneMfaService.activateDeviceWithCode(
        credentials,
        selectedDevice.id,
        { totpCode }
      );

      if (validation.valid) {
        onChallengeSuccess(validation, selectedDevice);
      } else {
        setError(validation.error || 'Invalid TOTP code');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'TOTP verification failed';
      setError(errorMessage);
      onChallengeError(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  }, [selectedDevice, totpCode, credentials, onChallengeSuccess, onChallengeError]);

  const handleOTPValidationSuccess = useCallback((result: ValidationResult) => {
    if (selectedDevice) {
      onChallengeSuccess(result, selectedDevice);
    }
  }, [selectedDevice, onChallengeSuccess]);

  const handleOTPValidationError = useCallback((error: string) => {
    setError(error);
    onChallengeError(error);
  }, [onChallengeError]);

  const getDeviceIcon = (type: MfaDevice['type']) => {
    switch (type) {
      case 'TOTP':
        return <FiSmartphone size={20} />;
      case 'SMS':
        return <FiMessageSquare size={20} />;
      case 'EMAIL':
        return <FiMail size={20} />;
      case 'VOICE':
        return <FiPhone size={20} />;
      case 'FIDO2':
        return <FiKey size={20} />;
      case 'MOBILE':
        return <FiShield size={20} />;
      default:
        return <FiShield size={20} />;
    }
  };

  const getDeviceDescription = (device: MfaDevice): string => {
    switch (device.type) {
      case 'TOTP':
        return 'Enter code from your authenticator app';
      case 'SMS':
        return `SMS code will be sent to ${device.phoneNumber || 'your phone'}`;
      case 'EMAIL':
        return `Email code will be sent to ${device.emailAddress || 'your email'}`;
      case 'VOICE':
        return `Voice code will be called to ${device.phoneNumber || 'your phone'}`;
      case 'FIDO2':
        return 'Use your security key or biometric authentication';
      case 'MOBILE':
        return 'Use the PingID mobile app';
      default:
        return 'Multi-factor authentication device';
    }
  };

  const formatTOTPCode = (value: string): string => {
    return value.replace(/\D/g, '').slice(0, 6);
  };

  const activeDevices = devices.filter(device => device.status === 'ACTIVE');

  if (activeDevices.length === 0) {
    return (
      <Layout.Container>
        <Layout.ContentWrapper>
          <Layout.MainCard>
            <Layout.StepHeader>
              <Layout.StepHeaderLeft>
                <Layout.VersionBadge>V6.0 - Service Architecture</Layout.VersionBadge>
                <Layout.StepHeaderTitle>No Active MFA Devices</Layout.StepHeaderTitle>
                <Layout.StepHeaderSubtitle>You need to register at least one MFA device</Layout.StepHeaderSubtitle>
              </Layout.StepHeaderLeft>
            </Layout.StepHeader>

            <Layout.StepContentWrapper>
              <Info.InfoBox $variant="warning">
                <FiAlertCircle size={20} />
                <div>
                  <Info.InfoTitle>No MFA Devices Available</Info.InfoTitle>
                  <Info.InfoText>
                    You don't have any active MFA devices registered. Please register at least one device to continue.
                  </Info.InfoText>
                </div>
              </Info.InfoBox>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <Button $variant="primary" onClick={onCancel}>
                  <FiShield size={16} />
                  Register MFA Device
                </Button>
              </div>
            </Layout.StepContentWrapper>
          </Layout.MainCard>
        </Layout.ContentWrapper>
      </Layout.Container>
    );
  }  
  return (
    <Layout.Container>
      <Layout.ContentWrapper>
        <Layout.MainCard>
          <Layout.StepHeader>
            <Layout.StepHeaderLeft>
              <Layout.VersionBadge>V6.0 - Service Architecture</Layout.VersionBadge>
              <Layout.StepHeaderTitle>Multi-Factor Authentication</Layout.StepHeaderTitle>
              <Layout.StepHeaderSubtitle>
                {currentStep === 'select' && 'Choose your authentication method'}
                {currentStep === 'challenge' && 'Initiating authentication challenge'}
                {currentStep === 'verify' && `Verify with ${selectedDevice?.nickname || 'your device'}`}
              </Layout.StepHeaderSubtitle>
            </Layout.StepHeaderLeft>
          </Layout.StepHeader>

          <Layout.StepContentWrapper>
            <FormContainer>
              {error && (
                <Info.InfoBox $variant="danger" style={{ marginBottom: '1.5rem' }}>
                  <FiAlertCircle size={20} />
                  <div>
                    <Info.InfoTitle>Authentication Error</Info.InfoTitle>
                    <Info.InfoText>{error}</Info.InfoText>
                  </div>
                </Info.InfoBox>
              )}

              {currentStep === 'select' && (
                <Collapsible.CollapsibleSection>
                  <Collapsible.CollapsibleHeaderButton
                    onClick={() => toggleSection('deviceSelection')}
                    aria-expanded={!collapsedSections.deviceSelection}
                  >
                    <Collapsible.CollapsibleTitle>
                      <FiShield /> Select Authentication Method
                    </Collapsible.CollapsibleTitle>
                    <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.deviceSelection}>
                      <FiRefreshCw />
                    </Collapsible.CollapsibleToggleIcon>
                  </Collapsible.CollapsibleHeaderButton>
                  {!collapsedSections.deviceSelection && (
                    <Collapsible.CollapsibleContent>
                      <DeviceGrid>
                        {activeDevices.map((device) => (
                          <DeviceCard
                            key={device.id}
                            $selected={selectedDevice?.id === device.id}
                            onClick={() => handleDeviceSelect(device)}
                          >
                            <DeviceIcon $type={device.type}>
                              {getDeviceIcon(device.type)}
                            </DeviceIcon>
                            <DeviceInfo>
                              <h3>{device.nickname || device.deviceName}</h3>
                              <p>{getDeviceDescription(device)}</p>
                            </DeviceInfo>
                            <DeviceStatus $status={device.status}>
                              <FiCheckCircle size={12} />
                              Active
                            </DeviceStatus>
                          </DeviceCard>
                        ))}
                      </DeviceGrid>

                      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        {onBackToDeviceSelection && (
                          <Button onClick={onBackToDeviceSelection}>
                            <FiArrowLeft size={16} />
                            Back to Device Management
                          </Button>
                        )}
                        
                        <Button onClick={onCancel}>
                          <FiX size={16} />
                          Cancel
                        </Button>
                      </div>
                    </Collapsible.CollapsibleContent>
                  )}
                </Collapsible.CollapsibleSection>
              )}

              {currentStep === 'challenge' && selectedDevice && (
                <Collapsible.CollapsibleSection>
                  <Collapsible.CollapsibleHeaderButton
                    onClick={() => toggleSection('challenge')}
                    aria-expanded={!collapsedSections.challenge}
                  >
                    <Collapsible.CollapsibleTitle>
                      <FiLock /> Initiating Challenge
                    </Collapsible.CollapsibleTitle>
                    <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.challenge}>
                      <FiRefreshCw />
                    </Collapsible.CollapsibleToggleIcon>
                  </Collapsible.CollapsibleHeaderButton>
                  {!collapsedSections.challenge && (
                    <Collapsible.CollapsibleContent>
                      <ChallengeContainer>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                          <DeviceIcon $type={selectedDevice.type}>
                            {getDeviceIcon(selectedDevice.type)}
                          </DeviceIcon>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
                              {selectedDevice.nickname || selectedDevice.deviceName}
                            </h3>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                              {getDeviceDescription(selectedDevice)}
                            </p>
                          </div>
                        </div>

                        {isInitiatingChallenge && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <FiRefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
                            <span>Initiating authentication challenge...</span>
                          </div>
                        )}

                        {isFIDOActive && (
                          <FIDOPrompt>
                            <div className="icon">
                              <FiKey size={24} />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
                              Activate Your Security Key
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', textAlign: 'center' }}>
                              Follow the prompts on your device or insert your security key and activate it.
                            </p>
                          </FIDOPrompt>
                        )}
                      </ChallengeContainer>

                      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <Button onClick={() => setCurrentStep('select')} disabled={isInitiatingChallenge || isFIDOActive}>
                          <FiArrowLeft size={16} />
                          Back to Device Selection
                        </Button>
                        
                        <Button onClick={onCancel} disabled={isInitiatingChallenge || isFIDOActive}>
                          <FiX size={16} />
                          Cancel
                        </Button>
                      </div>
                    </Collapsible.CollapsibleContent>
                  )}
                </Collapsible.CollapsibleSection>
              )}

              {currentStep === 'verify' && selectedDevice && (
                <>
                  {['EMAIL', 'SMS', 'VOICE'].includes(selectedDevice.type) && challengeResult && (
                    <OTPValidationFormV6
                      credentials={credentials}
                      device={selectedDevice}
                      challenge={challengeResult}
                      onValidationSuccess={handleOTPValidationSuccess}
                      onValidationError={handleOTPValidationError}
                      onCancel={() => setCurrentStep('select')}
                      theme={theme}
                    />
                  )}

                  {selectedDevice.type === 'TOTP' && (
                    <Collapsible.CollapsibleSection>
                      <Collapsible.CollapsibleHeaderButton
                        onClick={() => toggleSection('totpVerify')}
                        aria-expanded={!collapsedSections.totpVerify}
                      >
                        <Collapsible.CollapsibleTitle>
                          <FiSmartphone /> TOTP Verification
                        </Collapsible.CollapsibleTitle>
                        <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.totpVerify}>
                          <FiRefreshCw />
                        </Collapsible.CollapsibleToggleIcon>
                      </Collapsible.CollapsibleHeaderButton>
                      {!collapsedSections.totpVerify && (
                        <Collapsible.CollapsibleContent>
                          <Info.InfoBox $variant="info">
                            <FiSmartphone size={20} />
                            <div>
                              <Info.InfoTitle>Enter TOTP Code</Info.InfoTitle>
                              <Info.InfoText>
                                Open your authenticator app and enter the 6-digit code for {selectedDevice.nickname}.
                              </Info.InfoText>
                            </div>
                          </Info.InfoBox>

                          <div style={{ margin: '1.5rem 0' }}>
                            <TOTPInput
                              type="text"
                              inputMode="numeric"
                              value={totpCode}
                              onChange={(e) => setTotpCode(formatTOTPCode(e.target.value))}
                              placeholder="123456"
                              maxLength={6}
                              $hasError={!!error}
                              $isValid={totpCode.length === 6 && !error}
                              disabled={isVerifying}
                              autoFocus
                            />
                            {totpCode.length === 6 && !error && (
                              <SuccessText>
                                <FiCheckCircle size={12} />
                                Code format is valid
                              </SuccessText>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <Button
                              $variant="success"
                              onClick={handleTOTPVerify}
                              disabled={totpCode.length !== 6 || isVerifying}
                            >
                              {isVerifying ? (
                                <>
                                  <FiRefreshCw size={16} />
                                  Verifying...
                                </>
                              ) : (
                                <>
                                  <FiCheckCircle size={16} />
                                  Verify Code
                                </>
                              )}
                            </Button>

                            <Button onClick={() => setCurrentStep('select')} disabled={isVerifying}>
                              <FiArrowLeft size={16} />
                              Back to Device Selection
                            </Button>

                            <Button onClick={onCancel} disabled={isVerifying}>
                              <FiX size={16} />
                              Cancel
                            </Button>
                          </div>
                        </Collapsible.CollapsibleContent>
                      )}
                    </Collapsible.CollapsibleSection>
                  )}
                </>
              )}

              <Info.InfoBox $variant="info">
                <FiShield size={20} />
                <div>
                  <Info.InfoTitle>Multi-Factor Authentication</Info.InfoTitle>
                  <Info.InfoText>
                    Complete the verification process using one of your registered MFA devices to secure your account.
                  </Info.InfoText>
                  <Info.InfoList>
                    <li>Choose the most convenient authentication method</li>
                    <li>Follow the prompts for your selected device type</li>
                    <li>Codes are time-limited for security</li>
                    <li>Contact support if you're unable to access any devices</li>
                  </Info.InfoList>
                </div>
              </Info.InfoBox>
            </FormContainer>
          </Layout.StepContentWrapper>
        </Layout.MainCard>
      </Layout.ContentWrapper>
    </Layout.Container>
  );
};

export default MFAChallengeFormV6;