// src/components/OTPValidationFormV6.tsx
// OTP Validation Form Component using V6 Architecture

import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  FiSend,
  FiShield,
  FiLock
} from 'react-icons/fi';
import { V6FlowService } from '../services/v6FlowService';
import { useV6CollapsibleSections } from '../services/v6StepManagementService';
import PingOneMfaService, { 
  type MfaCredentials,
  type MfaDevice,
  type ChallengeResult,
  type ValidationResult
} from '../services/pingOneMfaService';
import styled from 'styled-components';

export interface OTPValidationFormProps {
  credentials: MfaCredentials;
  device: MfaDevice;
  challenge?: ChallengeResult;
  onValidationSuccess: (result: ValidationResult) => void;
  onValidationError: (error: string) => void;
  onCancel: () => void;
  onResendRequest?: () => void;
  theme?: 'blue' | 'green' | 'purple';
  autoFocus?: boolean;
  maxAttempts?: number;
}

const FormContainer = styled.div`
  max-width: 500px;
  margin: 0 auto;
`;

const OTPInputContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin: 2rem 0;
`;

const OTPInput = styled.input<{ $hasError?: boolean; $isValid?: boolean }>`
  width: 3rem;
  height: 3rem;
  text-align: center;
  font-size: 1.25rem;
  font-weight: 600;
  border: 2px solid ${props => {
    if (props.$hasError) return '#ef4444';
    if (props.$isValid) return '#10b981';
    return '#d1d5db';
  }};
  border-radius: 0.5rem;
  background: ${props => {
    if (props.$hasError) return '#fef2f2';
    if (props.$isValid) return '#f0fdf4';
    return '#ffffff';
  }};
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

const StatusMessage = styled.div<{ $type: 'success' | 'error' | 'info' | 'warning' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  margin: 1rem 0;
  
  ${props => {
    switch (props.$type) {
      case 'success':
        return `
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        `;
      case 'error':
        return `
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        `;
      case 'warning':
        return `
          background: #fffbeb;
          border: 1px solid #fed7aa;
          color: #92400e;
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

const CountdownText = styled.span`
  font-family: monospace;
  font-weight: 600;
  color: #3b82f6;
`;

const DeviceInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
`;

const DeviceIcon = styled.div<{ $type: string }>`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: ${props => {
    switch (props.$type) {
      case 'SMS': return '#10b981';
      case 'EMAIL': return '#f59e0b';
      case 'VOICE': return '#8b5cf6';
      default: return '#6b7280';
    }
  }};
`;

const DeviceDetails = styled.div`
  flex: 1;
  
  h3 {
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
  }
  
  p {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
  }
`;

const ProgressBar = styled.div<{ $progress: number }>`
  width: 100%;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
  margin: 1rem 0;
  
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${props => props.$progress}%;
    background: #3b82f6;
    transition: width 0.3s ease;
  }
`;

export const OTPValidationFormV6: React.FC<OTPValidationFormProps> = ({
  credentials,
  device,
  challenge: initialChallenge,
  onValidationSuccess,
  onValidationError,
  onCancel,
  onResendRequest,
  theme = 'blue',
  autoFocus = true,
  maxAttempts = 3
}) => {
  const { Layout, Collapsible, Info, Cards } = V6FlowService.createFlowComponents(theme);
  const { collapsedSections, toggleSection } = useV6CollapsibleSections();

  // State management
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [challenge, setChallenge] = useState<ChallengeResult | null>(initialChallenge || null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSendingChallenge, setIsSendingChallenge] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(maxAttempts);
  const [resendCountdown, setResendCountdown] = useState<number | null>(null);
  const [expiryCountdown, setExpiryCountdown] = useState<number | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<'SENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | null>(null);

  // Refs for OTP inputs
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize challenge if not provided
  useEffect(() => {
    if (!challenge && !isSendingChallenge) {
      sendInitialChallenge();
    }
  }, []);

  // Handle expiry countdown
  useEffect(() => {
    if (challenge?.expiresAt) {
      const updateCountdown = () => {
        const now = new Date();
        const expiry = new Date(challenge.expiresAt);
        const remaining = Math.max(0, Math.floor((expiry.getTime() - now.getTime()) / 1000));
        
        setExpiryCountdown(remaining);
        
        if (remaining === 0) {
          setValidationError('Verification code has expired. Please request a new code.');
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [challenge]);

  // Handle resend countdown
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

  // Auto-focus first input
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const sendInitialChallenge = useCallback(async () => {
    setIsSendingChallenge(true);
    setDeliveryStatus('SENDING');
    setValidationError(null);

    try {
      const challengeResult = await PingOneMfaService.sendOTP(
        credentials,
        device.id,
        device.type as 'EMAIL' | 'SMS' | 'VOICE'
      );
      
      setChallenge(challengeResult);
      setDeliveryStatus(challengeResult.deliveryStatus || 'SENT');
      setResendCountdown(60); // 60 seconds before allowing resend
    } catch (error) {
      console.error('Failed to send initial challenge:', error);
      setDeliveryStatus('FAILED');
      setValidationError(error instanceof Error ? error.message : 'Failed to send verification code');
    } finally {
      setIsSendingChallenge(false);
    }
  }, [credentials, device]);

  const handleOTPChange = useCallback((index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    
    const newOtpCode = [...otpCode];
    newOtpCode[index] = digit;
    setOtpCode(newOtpCode);
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null);
    }
    
    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [otpCode, validationError]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [otpCode]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length > 0) {
      const newOtpCode = [...otpCode];
      for (let i = 0; i < Math.min(pastedData.length, 6); i++) {
        newOtpCode[i] = pastedData[i];
      }
      setOtpCode(newOtpCode);
      
      // Focus the next empty input or the last input
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  }, [otpCode]);

  const handleValidate = useCallback(async () => {
    if (!challenge) {
      setValidationError('No active challenge found. Please request a new code.');
      return;
    }

    const code = otpCode.join('');
    if (code.length !== 6) {
      setValidationError('Please enter a complete 6-digit code');
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      const result = await PingOneMfaService.validateOTP(
        credentials,
        device.id,
        challenge.challengeId,
        code
      );

      if (result.valid) {
        onValidationSuccess(result);
      } else {
        const remaining = result.attemptsRemaining ?? Math.max(0, attemptsRemaining - 1);
        setAttemptsRemaining(remaining);
        
        if (remaining === 0) {
          setValidationError('Maximum attempts exceeded. Please request a new code.');
        } else {
          setValidationError(result.error || `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
        }
        
        // Clear the OTP inputs on error
        setOtpCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Validation failed:', error);
      setValidationError(error instanceof Error ? error.message : 'Validation failed');
      onValidationError(error instanceof Error ? error.message : 'Validation failed');
    } finally {
      setIsValidating(false);
    }
  }, [challenge, otpCode, credentials, device.id, attemptsRemaining, onValidationSuccess, onValidationError]);

  const handleResend = useCallback(async () => {
    if (resendCountdown !== null) return;

    setIsSendingChallenge(true);
    setDeliveryStatus('SENDING');
    setValidationError(null);
    setOtpCode(['', '', '', '', '', '']);

    try {
      const challengeResult = await PingOneMfaService.sendOTP(
        credentials,
        device.id,
        device.type as 'EMAIL' | 'SMS' | 'VOICE'
      );
      
      setChallenge(challengeResult);
      setDeliveryStatus(challengeResult.deliveryStatus || 'SENT');
      setResendCountdown(60);
      setAttemptsRemaining(maxAttempts); // Reset attempts on resend
      
      if (onResendRequest) {
        onResendRequest();
      }
    } catch (error) {
      console.error('Resend failed:', error);
      setDeliveryStatus('FAILED');
      setValidationError(error instanceof Error ? error.message : 'Failed to resend verification code');
    } finally {
      setIsSendingChallenge(false);
    }
  }, [resendCountdown, credentials, device, maxAttempts, onResendRequest]);

  const getDeviceIcon = () => {
    switch (device.type) {
      case 'EMAIL':
        return <FiMail size={20} />;
      case 'SMS':
        return <FiMessageSquare size={20} />;
      case 'VOICE':
        return <FiPhone size={20} />;
      default:
        return <FiShield size={20} />;
    }
  };

  const getDeviceDescription = (): string => {
    switch (device.type) {
      case 'EMAIL':
        return `Email to ${device.emailAddress || 'registered email'}`;
      case 'SMS':
        return `SMS to ${device.phoneNumber || 'registered number'}`;
      case 'VOICE':
        return `Voice call to ${device.phoneNumber || 'registered number'}`;
      default:
        return 'Multi-factor authentication device';
    }
  };

  const getDeliveryStatusMessage = (): { type: 'success' | 'error' | 'info' | 'warning'; message: string } | null => {
    switch (deliveryStatus) {
      case 'SENDING':
        return { type: 'info', message: 'Sending verification code...' };
      case 'SENT':
        return { type: 'success', message: 'Verification code sent successfully' };
      case 'DELIVERED':
        return { type: 'success', message: 'Verification code delivered' };
      case 'FAILED':
        return { type: 'error', message: 'Failed to send verification code' };
      default:
        return null;
    }
  };

  const isCodeComplete = otpCode.every(digit => digit !== '');
  const canValidate = isCodeComplete && !isValidating && attemptsRemaining > 0 && expiryCountdown !== 0;
  const canResend = !isSendingChallenge && resendCountdown === null && attemptsRemaining > 0;

  return (
    <Layout.Container>
      <Layout.ContentWrapper>
        <Layout.MainCard>
          <Layout.StepHeader>
            <Layout.StepHeaderLeft>
              <Layout.VersionBadge>V6.0 - Service Architecture</Layout.VersionBadge>
              <Layout.StepHeaderTitle>Verify {device.type} Device</Layout.StepHeaderTitle>
              <Layout.StepHeaderSubtitle>Enter the verification code to complete authentication</Layout.StepHeaderSubtitle>
            </Layout.StepHeaderLeft>
          </Layout.StepHeader>

          <Layout.StepContentWrapper>
            <FormContainer>
              <DeviceInfo>
                <DeviceIcon $type={device.type}>
                  {getDeviceIcon()}
                </DeviceIcon>
                <DeviceDetails>
                  <h3>{device.nickname || device.deviceName}</h3>
                  <p>{getDeviceDescription()}</p>
                </DeviceDetails>
              </DeviceInfo>

              {deliveryStatus && (
                <StatusMessage $type={getDeliveryStatusMessage()?.type || 'info'}>
                  {deliveryStatus === 'SENDING' && <FiRefreshCw size={16} />}
                  {deliveryStatus === 'SENT' && <FiCheckCircle size={16} />}
                  {deliveryStatus === 'DELIVERED' && <FiCheckCircle size={16} />}
                  {deliveryStatus === 'FAILED' && <FiAlertCircle size={16} />}
                  {getDeliveryStatusMessage()?.message}
                </StatusMessage>
              )}

              <Collapsible.CollapsibleSection>
                <Collapsible.CollapsibleHeaderButton
                  onClick={() => toggleSection('verification')}
                  aria-expanded={!collapsedSections.verification}
                >
                  <Collapsible.CollapsibleTitle>
                    <FiLock /> Enter Verification Code
                  </Collapsible.CollapsibleTitle>
                  <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.verification}>
                    <FiRefreshCw />
                  </Collapsible.CollapsibleToggleIcon>
                </Collapsible.CollapsibleHeaderButton>
                {!collapsedSections.verification && (
                  <Collapsible.CollapsibleContent>
                    <OTPInputContainer>
                      {otpCode.map((digit, index) => (
                        <OTPInput
                          key={index}
                          ref={(el) => (inputRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOTPChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          onPaste={handlePaste}
                          $hasError={!!validationError}
                          $isValid={isCodeComplete && !validationError}
                          disabled={isValidating || isSendingChallenge || attemptsRemaining === 0}
                        />
                      ))}
                    </OTPInputContainer>

                    {expiryCountdown !== null && expiryCountdown > 0 && (
                      <StatusMessage $type="info">
                        <FiClock size={16} />
                        Code expires in <CountdownText>{Math.floor(expiryCountdown / 60)}:{(expiryCountdown % 60).toString().padStart(2, '0')}</CountdownText>
                      </StatusMessage>
                    )}

                    {validationError && (
                      <StatusMessage $type="error">
                        <FiAlertCircle size={16} />
                        {validationError}
                      </StatusMessage>
                    )}

                    {attemptsRemaining < maxAttempts && attemptsRemaining > 0 && (
                      <StatusMessage $type="warning">
                        <FiAlertCircle size={16} />
                        {attemptsRemaining} attempt{attemptsRemaining === 1 ? '' : 's'} remaining
                      </StatusMessage>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                      <Button
                        $variant="success"
                        onClick={handleValidate}
                        disabled={!canValidate}
                      >
                        {isValidating ? (
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
                        disabled={!canResend}
                      >
                        {isSendingChallenge ? (
                          <>
                            <FiRefreshCw size={16} />
                            Sending...
                          </>
                        ) : resendCountdown !== null ? (
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

                      <Button onClick={onCancel} disabled={isValidating || isSendingChallenge}>
                        <FiX size={16} />
                        Cancel
                      </Button>
                    </div>
                  </Collapsible.CollapsibleContent>
                )}
              </Collapsible.CollapsibleSection>

              <Info.InfoBox $variant="info">
                <FiShield size={20} />
                <div>
                  <Info.InfoTitle>Verification Code Security</Info.InfoTitle>
                  <Info.InfoText>
                    For your security, verification codes are time-limited and can only be used once.
                  </Info.InfoText>
                  <Info.InfoList>
                    <li>Codes expire after 5 minutes</li>
                    <li>Each code can only be used once</li>
                    <li>You have {maxAttempts} attempts per code</li>
                    <li>Request a new code if the current one expires</li>
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

export default OTPValidationFormV6;