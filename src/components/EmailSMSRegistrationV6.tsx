// src/components/EmailSMSRegistrationV6.tsx
// Email and SMS Device Registration Component using V6 Architecture

import React, { useState, useCallback, useEffect } from 'react';
import { 
  FiMail, 
  FiMessageSquare, 
  FiPhone,
  FiCheck, 
  FiX, 
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiSend
} from 'react-icons/fi';
import { V6FlowService } from '../services/v6FlowService';
import { useV6CollapsibleSections } from '../services/v6StepManagementService';
import PingOneMfaService, { 
  type MfaCredentials,
  type DeviceRegistrationConfig,
  type DeviceRegistrationResult,
  type ChallengeResult,
  type ValidationResult
} from '../services/pingOneMfaService';
import styled from 'styled-components';

export interface EmailSMSRegistrationProps {
  credentials: MfaCredentials;
  deviceType: 'EMAIL' | 'SMS';
  onRegistrationComplete: (result: DeviceRegistrationResult) => void;
  onCancel: () => void;
  theme?: 'blue' | 'green' | 'purple';
  initialValue?: string;
}

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const InputWrapper = styled.div`
  position: relative;
`;

const Input = styled.input<{ $hasError?: boolean; $isValid?: boolean }>`
  width: 100%;
  padding: 0.75rem 1rem;
  padding-left: 2.5rem;
  border: 1px solid ${props => {
    if (props.$hasError) return '#ef4444';
    if (props.$isValid) return '#10b981';
    return '#d1d5db';
  }};
  border-radius: 0.5rem;
  font-size: 0.875rem;
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

const InputIcon = styled.div`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  pointer-events: none;
`;

const ValidationIcon = styled.div<{ $type: 'success' | 'error' | 'loading' }>`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => {
    switch (props.$type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'loading': return '#3b82f6';
    }
  }};
  
  ${props => props.$type === 'loading' && `
    svg {
      animation: spin 1s linear infinite;
    }
  `}
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

const StepIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 0.5rem;
`;

const StepNumber = styled.div<{ $active?: boolean; $completed?: boolean }>`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  
  ${props => {
    if (props.$completed) {
      return `
        background: #10b981;
        color: white;
      `;
    }
    if (props.$active) {
      return `
        background: #3b82f6;
        color: white;
      `;
    }
    return `
      background: #e5e7eb;
      color: #6b7280;
    `;
  }}
`;

const StepText = styled.div<{ $active?: boolean; $completed?: boolean }>`
  font-size: 0.875rem;
  font-weight: ${props => props.$active || props.$completed ? '600' : '400'};
  color: ${props => {
    if (props.$completed) return '#10b981';
    if (props.$active) return '#3b82f6';
    return '#6b7280';
  }};
`;

const CountdownText = styled.span`
  font-family: monospace;
  font-weight: 600;
  color: #3b82f6;
`;

export const EmailSMSRegistrationV6: React.FC<EmailSMSRegistrationProps> = ({
  credentials,
  deviceType,
  onRegistrationComplete,
  onCancel,
  theme = 'blue',
  initialValue = ''
}) => {
  const { Layout, Collapsible, Info, Cards } = V6FlowService.createFlowComponents(theme);
  const { collapsedSections, toggleSection } = useV6CollapsibleSections();

  // Form state
  const [contactInfo, setContactInfo] = useState(initialValue);
  const [nickname, setNickname] = useState(`My ${deviceType} Device`);
  
  // Validation state
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Registration state
  const [currentStep, setCurrentStep] = useState<'input' | 'verify' | 'complete'>('input');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<DeviceRegistrationResult | null>(null);
  
  // Verification state
  const [verificationCode, setVerificationCode] = useState('');
  const [challengeResult, setChallengeResult] = useState<ChallengeResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState<number | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number>(3);

  // Real-time validation
  useEffect(() => {
    if (!contactInfo.trim()) {
      setIsValid(false);
      setValidationError(null);
      return;
    }

    const validateInput = async () => {
      setIsValidating(true);
      setValidationError(null);

      try {
        await new Promise(resolve => setTimeout(resolve, 500)); // Debounce

        if (deviceType === 'EMAIL') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(contactInfo)) {
            setValidationError('Please enter a valid email address');
            setIsValid(false);
          } else {
            setIsValid(true);
          }
        } else if (deviceType === 'SMS') {
          const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
          if (!phoneRegex.test(contactInfo)) {
            setValidationError('Please enter a valid phone number');
            setIsValid(false);
          } else {
            setIsValid(true);
          }
        }
      } catch (error) {
        setValidationError('Validation failed');
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    const timeoutId = setTimeout(validateInput, 300);
    return () => clearTimeout(timeoutId);
  }, [contactInfo, deviceType]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown !== null && resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (resendCountdown === 0) {
      setResendCountdown(null);
    }
  }, [resendCountdown]);

  const handleRegister = useCallback(async () => {
    if (!isValid || !contactInfo.trim()) return;

    setIsRegistering(true);
    setValidationError(null);

    try {
      const config: DeviceRegistrationConfig = {
        type: deviceType,
        nickname,
        ...(deviceType === 'EMAIL' ? { emailAddress: contactInfo } : { phoneNumber: contactInfo })
      };

      const result = await PingOneMfaService.registerDevice(credentials, config);
      setRegistrationResult(result);

      if (result.success && result.device) {
        // Automatically send verification code
        const challenge = await PingOneMfaService.sendOTP(
          credentials,
          result.device.id,
          deviceType
        );
        
        setChallengeResult(challenge);
        setCurrentStep('verify');
        setResendCountdown(60); // 60 seconds before allowing resend
      } else {
        setValidationError(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      setValidationError(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsRegistering(false);
    }
  }, [isValid, contactInfo, nickname, deviceType, credentials]);

  const handleVerify = useCallback(async () => {
    if (!verificationCode.trim() || !challengeResult || !registrationResult?.device) return;

    setIsVerifying(true);
    setVerificationError(null);

    try {
      const validation = await PingOneMfaService.validateOTP(
        credentials,
        registrationResult.device.id,
        challengeResult.challengeId,
        verificationCode
      );

      if (validation.valid) {
        // Activate the device
        const activation = await PingOneMfaService.activateDevice(
          credentials,
          registrationResult.device.id,
          { otp: verificationCode }
        );

        if (activation.valid) {
          setCurrentStep('complete');
          onRegistrationComplete({
            ...registrationResult,
            device: {
              ...registrationResult.device,
              status: 'ACTIVE'
            }
          });
        } else {
          setVerificationError(activation.error || 'Device activation failed');
          setAttemptsRemaining(prev => Math.max(0, prev - 1));
        }
      } else {
        setVerificationError(validation.error || 'Invalid verification code');
        setAttemptsRemaining(validation.attemptsRemaining || Math.max(0, attemptsRemaining - 1));
      }
    } catch (error) {
      console.error('Verification failed:', error);
      setVerificationError(error instanceof Error ? error.message : 'Verification failed');
      setAttemptsRemaining(prev => Math.max(0, prev - 1));
    } finally {
      setIsVerifying(false);
    }
  }, [verificationCode, challengeResult, registrationResult, credentials, attemptsRemaining, onRegistrationComplete]);

  const handleResend = useCallback(async () => {
    if (!registrationResult?.device || resendCountdown !== null) return;

    try {
      const challenge = await PingOneMfaService.sendOTP(
        credentials,
        registrationResult.device.id,
        deviceType
      );
      
      setChallengeResult(challenge);
      setResendCountdown(60);
      setVerificationError(null);
    } catch (error) {
      console.error('Resend failed:', error);
      setVerificationError('Failed to resend verification code');
    }
  }, [registrationResult, resendCountdown, credentials, deviceType]);

  const getInputPlaceholder = (): string => {
    return deviceType === 'EMAIL' 
      ? 'user@example.com' 
      : '+1 (555) 123-4567';
  };

  const getInputLabel = (): string => {
    return deviceType === 'EMAIL' ? 'Email Address' : 'Phone Number';
  };

  const getDeviceIcon = () => {
    return deviceType === 'EMAIL' ? <FiMail size={16} /> : <FiMessageSquare size={16} />;
  };

  return (
    <Layout.Container>
      <Layout.ContentWrapper>
        <Layout.MainCard>
          <Layout.StepHeader>
            <Layout.StepHeaderLeft>
              <Layout.VersionBadge>V6.0 - Service Architecture</Layout.VersionBadge>
              <Layout.StepHeaderTitle>Register {deviceType} Device</Layout.StepHeaderTitle>
              <Layout.StepHeaderSubtitle>
                {currentStep === 'input' && `Enter your ${deviceType.toLowerCase()} information`}
                {currentStep === 'verify' && 'Verify your device'}
                {currentStep === 'complete' && 'Registration complete'}
              </Layout.StepHeaderSubtitle>
            </Layout.StepHeaderLeft>
          </Layout.StepHeader>

          <Layout.StepContentWrapper>
            <StepIndicator>
              <StepNumber $completed={currentStep !== 'input'} $active={currentStep === 'input'}>
                {currentStep !== 'input' ? <FiCheck size={14} /> : '1'}
              </StepNumber>
              <StepText $completed={currentStep !== 'input'} $active={currentStep === 'input'}>
                Enter {deviceType.toLowerCase()} information
              </StepText>

              <StepNumber $completed={currentStep === 'complete'} $active={currentStep === 'verify'}>
                {currentStep === 'complete' ? <FiCheck size={14} /> : '2'}
              </StepNumber>
              <StepText $completed={currentStep === 'complete'} $active={currentStep === 'verify'}>
                Verify device
              </StepText>

              <StepNumber $active={currentStep === 'complete'}>
                {currentStep === 'complete' ? <FiCheck size={14} /> : '3'}
              </StepNumber>
              <StepText $active={currentStep === 'complete'}>
                Complete setup
              </StepText>
            </StepIndicator>

            {currentStep === 'input' && (
              <Collapsible.CollapsibleSection>
                <Collapsible.CollapsibleHeaderButton
                  onClick={() => toggleSection('deviceInfo')}
                  aria-expanded={!collapsedSections.deviceInfo}
                >
                  <Collapsible.CollapsibleTitle>
                    {getDeviceIcon()} Device Information
                  </Collapsible.CollapsibleTitle>
                  <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.deviceInfo}>
                    <FiRefreshCw />
                  </Collapsible.CollapsibleToggleIcon>
                </Collapsible.CollapsibleHeaderButton>
                {!collapsedSections.deviceInfo && (
                  <Collapsible.CollapsibleContent>
                    <FormGroup>
                      <Label htmlFor="contactInfo">{getInputLabel()}</Label>
                      <InputWrapper>
                        <InputIcon>
                          {getDeviceIcon()}
                        </InputIcon>
                        <Input
                          id="contactInfo"
                          type={deviceType === 'EMAIL' ? 'email' : 'tel'}
                          value={contactInfo}
                          onChange={(e) => setContactInfo(e.target.value)}
                          placeholder={getInputPlaceholder()}
                          $hasError={!!validationError}
                          $isValid={isValid && !isValidating}
                          disabled={isRegistering}
                        />
                        <ValidationIcon $type={
                          isValidating ? 'loading' : 
                          validationError ? 'error' : 
                          isValid ? 'success' : 'loading'
                        }>
                          {isValidating ? (
                            <FiRefreshCw size={16} />
                          ) : validationError ? (
                            <FiX size={16} />
                          ) : isValid ? (
                            <FiCheck size={16} />
                          ) : null}
                        </ValidationIcon>
                      </InputWrapper>
                      {validationError && (
                        <ErrorText>
                          <FiAlertCircle size={12} />
                          {validationError}
                        </ErrorText>
                      )}
                      {isValid && !validationError && (
                        <SuccessText>
                          <FiCheckCircle size={12} />
                          {deviceType === 'EMAIL' ? 'Valid email address' : 'Valid phone number'}
                        </SuccessText>
                      )}
                    </FormGroup>

                    <FormGroup>
                      <Label htmlFor="nickname">Device Nickname</Label>
                      <InputWrapper>
                        <InputIcon>
                          <FiPhone size={16} />
                        </InputIcon>
                        <Input
                          id="nickname"
                          type="text"
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                          placeholder="My SMS Device"
                          disabled={isRegistering}
                        />
                      </InputWrapper>
                    </FormGroup>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                      <Button
                        $variant="primary"
                        onClick={handleRegister}
                        disabled={!isValid || isRegistering || isValidating}
                      >
                        {isRegistering ? (
                          <>
                            <FiRefreshCw size={16} />
                            Registering...
                          </>
                        ) : (
                          <>
                            <FiSend size={16} />
                            Register Device
                          </>
                        )}
                      </Button>

                      <Button onClick={onCancel} disabled={isRegistering}>
                        <FiX size={16} />
                        Cancel
                      </Button>
                    </div>
                  </Collapsible.CollapsibleContent>
                )}
              </Collapsible.CollapsibleSection>
            )}

            {currentStep === 'verify' && challengeResult && (
              <Collapsible.CollapsibleSection>
                <Collapsible.CollapsibleHeaderButton
                  onClick={() => toggleSection('verification')}
                  aria-expanded={!collapsedSections.verification}
                >
                  <Collapsible.CollapsibleTitle>
                    <FiCheckCircle /> Verification Code
                  </Collapsible.CollapsibleTitle>
                  <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.verification}>
                    <FiRefreshCw />
                  </Collapsible.CollapsibleToggleIcon>
                </Collapsible.CollapsibleHeaderButton>
                {!collapsedSections.verification && (
                  <Collapsible.CollapsibleContent>
                    <Info.InfoBox $variant="info">
                      <FiClock size={20} />
                      <div>
                        <Info.InfoTitle>Verification Code Sent</Info.InfoTitle>
                        <Info.InfoText>
                          We've sent a verification code to {contactInfo}. 
                          Enter the code below to complete device registration.
                        </Info.InfoText>
                      </div>
                    </Info.InfoBox>

                    <FormGroup>
                      <Label htmlFor="verificationCode">Verification Code</Label>
                      <InputWrapper>
                        <InputIcon>
                          <FiCheckCircle size={16} />
                        </InputIcon>
                        <Input
                          id="verificationCode"
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="123456"
                          maxLength={6}
                          $hasError={!!verificationError}
                          disabled={isVerifying}
                          autoFocus
                        />
                      </InputWrapper>
                      {verificationError && (
                        <ErrorText>
                          <FiAlertCircle size={12} />
                          {verificationError}
                        </ErrorText>
                      )}
                      {attemptsRemaining < 3 && (
                        <ErrorText>
                          <FiAlertCircle size={12} />
                          {attemptsRemaining} attempt{attemptsRemaining === 1 ? '' : 's'} remaining
                        </ErrorText>
                      )}
                    </FormGroup>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '2rem' }}>
                      <Button
                        $variant="success"
                        onClick={handleVerify}
                        disabled={verificationCode.length !== 6 || isVerifying || attemptsRemaining === 0}
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

                      <Button
                        onClick={handleResend}
                        disabled={resendCountdown !== null || isVerifying}
                      >
                        {resendCountdown !== null ? (
                          <>
                            <FiClock size={16} />
                            Resend in <CountdownText>{resendCountdown}s</CountdownText>
                          </>
                        ) : (
                          <>
                            <FiSend size={16} />
                            Resend Code
                          </>
                        )}
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

            {currentStep === 'complete' && registrationResult?.device && (
              <Collapsible.CollapsibleSection>
                <Collapsible.CollapsibleHeaderButton
                  onClick={() => toggleSection('complete')}
                  aria-expanded={!collapsedSections.complete}
                >
                  <Collapsible.CollapsibleTitle>
                    <FiCheckCircle /> Registration Complete
                  </Collapsible.CollapsibleTitle>
                  <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.complete}>
                    <FiRefreshCw />
                  </Collapsible.CollapsibleToggleIcon>
                </Collapsible.CollapsibleHeaderButton>
                {!collapsedSections.complete && (
                  <Collapsible.CollapsibleContent>
                    <Info.InfoBox $variant="success">
                      <FiCheckCircle size={20} />
                      <div>
                        <Info.InfoTitle>Device Successfully Registered</Info.InfoTitle>
                        <Info.InfoText>
                          Your {deviceType} device has been registered and activated. 
                          You can now use it for multi-factor authentication.
                        </Info.InfoText>
                      </div>
                    </Info.InfoBox>

                    <Cards.GeneratedContentBox>
                      <Cards.GeneratedLabel>Device Details</Cards.GeneratedLabel>
                      <Cards.ParameterGrid>
                        <Cards.ParameterLabel>Device Type</Cards.ParameterLabel>
                        <Cards.ParameterValue>{deviceType}</Cards.ParameterValue>
                        
                        <Cards.ParameterLabel>Nickname</Cards.ParameterLabel>
                        <Cards.ParameterValue>{registrationResult.device.nickname}</Cards.ParameterValue>
                        
                        <Cards.ParameterLabel>Contact Info</Cards.ParameterLabel>
                        <Cards.ParameterValue>{contactInfo}</Cards.ParameterValue>
                        
                        <Cards.ParameterLabel>Status</Cards.ParameterLabel>
                        <Cards.ParameterValue>Active</Cards.ParameterValue>
                        
                        <Cards.ParameterLabel>Device ID</Cards.ParameterLabel>
                        <Cards.ParameterValue>{registrationResult.device.id}</Cards.ParameterValue>
                      </Cards.ParameterGrid>
                    </Cards.GeneratedContentBox>
                  </Collapsible.CollapsibleContent>
                )}
              </Collapsible.CollapsibleSection>
            )}

            <Info.InfoBox $variant="info">
              <FiCheckCircle size={20} />
              <div>
                <Info.InfoTitle>{deviceType} Device Security</Info.InfoTitle>
                <Info.InfoText>
                  {deviceType === 'EMAIL' 
                    ? 'Email-based MFA sends verification codes to your registered email address.'
                    : 'SMS-based MFA sends verification codes to your registered phone number.'
                  }
                </Info.InfoText>
                <Info.InfoList>
                  <li>Codes are valid for 5 minutes after being sent</li>
                  <li>Each code can only be used once</li>
                  <li>You can request a new code if the previous one expires</li>
                  <li>Multiple failed attempts may temporarily lock the device</li>
                </Info.InfoList>
              </div>
            </Info.InfoBox>
          </Layout.StepContentWrapper>
        </Layout.MainCard>
      </Layout.ContentWrapper>
    </Layout.Container>
  );
};

export default EmailSMSRegistrationV6;