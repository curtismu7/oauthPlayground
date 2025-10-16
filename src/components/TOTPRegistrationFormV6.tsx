// src/components/TOTPRegistrationFormV6.tsx
// TOTP Device Registration Form Component using V6 Architecture

import React, { useState, useCallback, useEffect } from 'react';
import { 
  FiSmartphone, 
  FiQrCode, 
  FiKey, 
  FiCopy,
  FiCheck, 
  FiX, 
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiDownload,
  FiShield,
  FiLock
} from 'react-icons/fi';
import { V6FlowService } from '../services/v6FlowService';
import { useV6CollapsibleSections } from '../services/v6StepManagementService';
import PingOneMfaService, { 
  type MfaCredentials,
  type DeviceRegistrationConfig,
  type DeviceRegistrationResult,
  type DeviceSetupData
} from '../services/pingOneMfaService';
import QRCodeService, { type QRCodeResult } from '../services/qrCodeService';
import styled from 'styled-components';

export interface TOTPRegistrationFormProps {
  credentials: MfaCredentials;
  onRegistrationComplete: (result: DeviceRegistrationResult) => void;
  onCancel: () => void;
  theme?: 'blue' | 'green' | 'purple';
  initialNickname?: string;
  issuer?: string;
  accountName?: string;
}

const FormContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const QRCodeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  margin: 1.5rem 0;
`;

const QRCodeImage = styled.img`
  max-width: 200px;
  height: auto;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  background: white;
  padding: 0.5rem;
`;

const QRCodePlaceholder = styled.div`
  width: 200px;
  height: 200px;
  border: 2px dashed #d1d5db;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  margin-bottom: 1rem;
  
  svg {
    color: #9ca3af;
  }
`;

const ManualEntryBox = styled.div`
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  word-break: break-all;
  position: relative;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  &:hover {
    background: #2563eb;
  }
`;

const BackupCodesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin: 1rem 0;
`;

const BackupCode = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  padding: 0.5rem;
  text-align: center;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  font-weight: 600;
`;

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

const Input = styled.input<{ $hasError?: boolean }>`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid ${props => props.$hasError ? '#ef4444' : '#d1d5db'};
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? '#ef4444' : '#3b82f6'};
    box-shadow: 0 0 0 3px ${props => props.$hasError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)'};
  }
  
  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
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

export const TOTPRegistrationFormV6: React.FC<TOTPRegistrationFormProps> = ({
  credentials,
  onRegistrationComplete,
  onCancel,
  theme = 'blue',
  initialNickname = 'My Authenticator App',
  issuer = 'PingOne MFA',
  accountName
}) => {
  const { Layout, Collapsible, Info, Cards } = V6FlowService.createFlowComponents(theme);
  const { collapsedSections, toggleSection } = useV6CollapsibleSections();

  // Form state
  const [nickname, setNickname] = useState(initialNickname);
  const [totpCode, setTotpCode] = useState('');
  
  // Registration state
  const [currentStep, setCurrentStep] = useState<'setup' | 'scan' | 'verify' | 'complete'>('setup');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<DeviceRegistrationResult | null>(null);
  const [setupData, setSetupData] = useState<DeviceSetupData | null>(null);
  
  // UI state
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleRegister = useCallback(async () => {
    if (!nickname.trim()) {
      setErrors({ nickname: 'Device nickname is required' });
      return;
    }

    setIsRegistering(true);
    setErrors({});

    try {
      const config: DeviceRegistrationConfig = {
        type: 'TOTP',
        nickname: nickname.trim(),
        issuer,
        accountName: accountName || `${credentials.userId}@${issuer.toLowerCase().replace(/\s+/g, '-')}`
      };

      const result = await PingOneMfaService.registerDevice(credentials, config);
      setRegistrationResult(result);

      if (result.success && result.setupData) {
        setSetupData(result.setupData);
        setCurrentStep('scan');
      } else {
        setErrors({ registration: result.error || 'Failed to register TOTP device' });
      }
    } catch (error) {
      console.error('TOTP registration failed:', error);
      setErrors({ registration: error instanceof Error ? error.message : 'Registration failed' });
    } finally {
      setIsRegistering(false);
    }
  }, [nickname, issuer, accountName, credentials]);

  const handleVerify = useCallback(async () => {
    if (!totpCode.trim() || totpCode.length !== 6 || !registrationResult?.device) {
      setErrors({ totp: 'Please enter a valid 6-digit code' });
      return;
    }

    setIsVerifying(true);
    setErrors({});

    try {
      const validation = await PingOneMfaService.activateDevice(
        credentials,
        registrationResult.device.id,
        { totpCode }
      );

      if (validation.valid) {
        setCurrentStep('complete');
        onRegistrationComplete({
          ...registrationResult,
          device: {
            ...registrationResult.device,
            status: 'ACTIVE'
          }
        });
      } else {
        setErrors({ totp: validation.error || 'Invalid TOTP code. Please try again.' });
      }
    } catch (error) {
      console.error('TOTP verification failed:', error);
      setErrors({ totp: error instanceof Error ? error.message : 'Verification failed' });
    } finally {
      setIsVerifying(false);
    }
  }, [totpCode, registrationResult, credentials, onRegistrationComplete]);

  const handleCopy = useCallback(async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set([...prev, itemId]));
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, []);

  const handleDownloadBackupCodes = useCallback(() => {
    if (!setupData?.qrCodeData?.backupCodes) return;

    const content = [
      `TOTP Backup Codes for ${nickname}`,
      `Generated: ${new Date().toLocaleString()}`,
      `Device ID: ${registrationResult?.device?.id}`,
      '',
      'Backup Codes:',
      ...setupData.qrCodeData.backupCodes.map((code, index) => `${index + 1}. ${code}`),
      '',
      'Important:',
      '- Each code can only be used once',
      '- Store these codes in a secure location',
      '- Generate new codes if you use more than half of them'
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `totp-backup-codes-${nickname.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [setupData, nickname, registrationResult]);

  const formatTOTPCode = (value: string): string => {
    // Remove non-digits and limit to 6 characters
    return value.replace(/\D/g, '').slice(0, 6);
  };

  return (
    <Layout.Container>
      <Layout.ContentWrapper>
        <Layout.MainCard>
          <Layout.StepHeader>
            <Layout.StepHeaderLeft>
              <Layout.VersionBadge>V6.0 - Service Architecture</Layout.VersionBadge>
              <Layout.StepHeaderTitle>Register TOTP Authenticator</Layout.StepHeaderTitle>
              <Layout.StepHeaderSubtitle>
                {currentStep === 'setup' && 'Configure your authenticator app'}
                {currentStep === 'scan' && 'Scan QR code or enter setup key'}
                {currentStep === 'verify' && 'Verify your authenticator app'}
                {currentStep === 'complete' && 'Registration complete'}
              </Layout.StepHeaderSubtitle>
            </Layout.StepHeaderLeft>
          </Layout.StepHeader>

          <Layout.StepContentWrapper>
            <FormContainer>
              <StepIndicator>
                <StepNumber $completed={currentStep !== 'setup'} $active={currentStep === 'setup'}>
                  {currentStep !== 'setup' ? <FiCheck size={14} /> : '1'}
                </StepNumber>
                <StepText $completed={currentStep !== 'setup'} $active={currentStep === 'setup'}>
                  Device Setup
                </StepText>

                <StepNumber $completed={!['setup', 'scan'].includes(currentStep)} $active={currentStep === 'scan'}>
                  {!['setup', 'scan'].includes(currentStep) ? <FiCheck size={14} /> : '2'}
                </StepNumber>
                <StepText $completed={!['setup', 'scan'].includes(currentStep)} $active={currentStep === 'scan'}>
                  Scan QR Code
                </StepText>

                <StepNumber $completed={currentStep === 'complete'} $active={currentStep === 'verify'}>
                  {currentStep === 'complete' ? <FiCheck size={14} /> : '3'}
                </StepNumber>
                <StepText $completed={currentStep === 'complete'} $active={currentStep === 'verify'}>
                  Verify Code
                </StepText>
              </StepIndicator>

              {currentStep === 'setup' && (
                <Collapsible.CollapsibleSection>
                  <Collapsible.CollapsibleHeaderButton
                    onClick={() => toggleSection('setup')}
                    aria-expanded={!collapsedSections.setup}
                  >
                    <Collapsible.CollapsibleTitle>
                      <FiSmartphone /> Device Configuration
                    </Collapsible.CollapsibleTitle>
                    <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.setup}>
                      <FiRefreshCw />
                    </Collapsible.CollapsibleToggleIcon>
                  </Collapsible.CollapsibleHeaderButton>
                  {!collapsedSections.setup && (
                    <Collapsible.CollapsibleContent>
                      <FormGroup>
                        <Label htmlFor="nickname">Device Nickname</Label>
                        <Input
                          id="nickname"
                          type="text"
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                          placeholder="My Authenticator App"
                          $hasError={!!errors.nickname}
                          disabled={isRegistering}
                        />
                        {errors.nickname && (
                          <ErrorText>
                            <FiAlertCircle size={12} />
                            {errors.nickname}
                          </ErrorText>
                        )}
                      </FormGroup>

                      {errors.registration && (
                        <ErrorText style={{ marginBottom: '1rem' }}>
                          <FiAlertCircle size={12} />
                          {errors.registration}
                        </ErrorText>
                      )}

                      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <Button
                          $variant="primary"
                          onClick={handleRegister}
                          disabled={!nickname.trim() || isRegistering}
                        >
                          {isRegistering ? (
                            <>
                              <FiRefreshCw size={16} />
                              Creating Device...
                            </>
                          ) : (
                            <>
                              <FiQrCode size={16} />
                              Create TOTP Device
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

              {currentStep === 'scan' && setupData && (
                <>
                  <Collapsible.CollapsibleSection>
                    <Collapsible.CollapsibleHeaderButton
                      onClick={() => toggleSection('qrcode')}
                      aria-expanded={!collapsedSections.qrcode}
                    >
                      <Collapsible.CollapsibleTitle>
                        <FiQrCode /> QR Code Setup
                      </Collapsible.CollapsibleTitle>
                      <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.qrcode}>
                        <FiRefreshCw />
                      </Collapsible.CollapsibleToggleIcon>
                    </Collapsible.CollapsibleHeaderButton>
                    {!collapsedSections.qrcode && (
                      <Collapsible.CollapsibleContent>
                        <QRCodeContainer>
                          {setupData.qrCodeData?.qrCodeDataUrl ? (
                            <QRCodeImage 
                              src={setupData.qrCodeData.qrCodeDataUrl} 
                              alt="TOTP QR Code" 
                            />
                          ) : (
                            <QRCodePlaceholder>
                              <FiQrCode size={48} />
                            </QRCodePlaceholder>
                          )}
                          <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', textAlign: 'center' }}>
                            Scan this QR code with your authenticator app
                          </p>
                        </QRCodeContainer>

                        <Info.InfoBox $variant="info">
                          <FiSmartphone size={20} />
                          <div>
                            <Info.InfoTitle>Setup Instructions</Info.InfoTitle>
                            <Info.InfoList>
                              {setupData.setupInstructions.map((instruction, index) => (
                                <li key={index}>{instruction}</li>
                              ))}
                            </Info.InfoList>
                          </div>
                        </Info.InfoBox>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                          <Button onClick={() => setShowManualEntry(!showManualEntry)}>
                            <FiKey size={16} />
                            {showManualEntry ? 'Hide' : 'Show'} Manual Entry
                          </Button>
                          
                          <Button onClick={() => setCurrentStep('verify')}>
                            <FiCheckCircle size={16} />
                            Continue to Verification
                          </Button>
                        </div>
                      </Collapsible.CollapsibleContent>
                    )}
                  </Collapsible.CollapsibleSection>

                  {showManualEntry && setupData.alternativeMethods?.manualEntry && (
                    <Collapsible.CollapsibleSection>
                      <Collapsible.CollapsibleHeaderButton
                        onClick={() => toggleSection('manual')}
                        aria-expanded={!collapsedSections.manual}
                      >
                        <Collapsible.CollapsibleTitle>
                          <FiKey /> Manual Entry Key
                        </Collapsible.CollapsibleTitle>
                        <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.manual}>
                          <FiRefreshCw />
                        </Collapsible.CollapsibleToggleIcon>
                      </Collapsible.CollapsibleHeaderButton>
                      {!collapsedSections.manual && (
                        <Collapsible.CollapsibleContent>
                          <ManualEntryBox>
                            {setupData.alternativeMethods.manualEntry.key}
                            <CopyButton
                              onClick={() => handleCopy(
                                setupData.alternativeMethods!.manualEntry!.key,
                                'manual-key'
                              )}
                            >
                              {copiedItems.has('manual-key') ? (
                                <>
                                  <FiCheck size={12} />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <FiCopy size={12} />
                                  Copy
                                </>
                              )}
                            </CopyButton>
                          </ManualEntryBox>

                          <Info.InfoBox $variant="info">
                            <FiKey size={20} />
                            <div>
                              <Info.InfoTitle>Manual Entry Instructions</Info.InfoTitle>
                              <Info.InfoList>
                                {setupData.alternativeMethods.manualEntry.instructions.map((instruction, index) => (
                                  <li key={index}>{instruction}</li>
                                ))}
                              </Info.InfoList>
                            </div>
                          </Info.InfoBox>
                        </Collapsible.CollapsibleContent>
                      )}
                    </Collapsible.CollapsibleSection>
                  )}
                </>
              )}

              {currentStep === 'verify' && (
                <Collapsible.CollapsibleSection>
                  <Collapsible.CollapsibleHeaderButton
                    onClick={() => toggleSection('verify')}
                    aria-expanded={!collapsedSections.verify}
                  >
                    <Collapsible.CollapsibleTitle>
                      <FiLock /> Verify TOTP Code
                    </Collapsible.CollapsibleTitle>
                    <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.verify}>
                      <FiRefreshCw />
                    </Collapsible.CollapsibleToggleIcon>
                  </Collapsible.CollapsibleHeaderButton>
                  {!collapsedSections.verify && (
                    <Collapsible.CollapsibleContent>
                      <Info.InfoBox $variant="info">
                        <FiSmartphone size={20} />
                        <div>
                          <Info.InfoTitle>Enter Verification Code</Info.InfoTitle>
                          <Info.InfoText>
                            Open your authenticator app and enter the 6-digit code for {nickname}.
                          </Info.InfoText>
                        </div>
                      </Info.InfoBox>

                      <FormGroup>
                        <Label htmlFor="totpCode">6-Digit TOTP Code</Label>
                        <TOTPInput
                          id="totpCode"
                          type="text"
                          inputMode="numeric"
                          value={totpCode}
                          onChange={(e) => setTotpCode(formatTOTPCode(e.target.value))}
                          placeholder="123456"
                          maxLength={6}
                          $hasError={!!errors.totp}
                          $isValid={totpCode.length === 6 && !errors.totp}
                          disabled={isVerifying}
                          autoFocus
                        />
                        {errors.totp && (
                          <ErrorText>
                            <FiAlertCircle size={12} />
                            {errors.totp}
                          </ErrorText>
                        )}
                        {totpCode.length === 6 && !errors.totp && (
                          <SuccessText>
                            <FiCheckCircle size={12} />
                            Code format is valid
                          </SuccessText>
                        )}
                      </FormGroup>

                      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <Button
                          $variant="success"
                          onClick={handleVerify}
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
                              Verify & Activate
                            </>
                          )}
                        </Button>

                        <Button onClick={() => setCurrentStep('scan')} disabled={isVerifying}>
                          <FiQrCode size={16} />
                          Back to QR Code
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
                          <Info.InfoTitle>TOTP Device Successfully Registered</Info.InfoTitle>
                          <Info.InfoText>
                            Your authenticator app has been registered and activated. 
                            You can now use it for multi-factor authentication.
                          </Info.InfoText>
                        </div>
                      </Info.InfoBox>

                      <Cards.GeneratedContentBox>
                        <Cards.GeneratedLabel>Device Details</Cards.GeneratedLabel>
                        <Cards.ParameterGrid>
                          <Cards.ParameterLabel>Device Type</Cards.ParameterLabel>
                          <Cards.ParameterValue>TOTP Authenticator</Cards.ParameterValue>
                          
                          <Cards.ParameterLabel>Nickname</Cards.ParameterLabel>
                          <Cards.ParameterValue>{registrationResult.device.nickname}</Cards.ParameterValue>
                          
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

              {setupData?.alternativeMethods?.backupCodes && (
                <Collapsible.CollapsibleSection>
                  <Collapsible.CollapsibleHeaderButton
                    onClick={() => toggleSection('backup')}
                    aria-expanded={!collapsedSections.backup}
                  >
                    <Collapsible.CollapsibleTitle>
                      <FiShield /> Backup Codes
                    </Collapsible.CollapsibleTitle>
                    <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.backup}>
                      <FiRefreshCw />
                    </Collapsible.CollapsibleToggleIcon>
                  </Collapsible.CollapsibleHeaderButton>
                  {!collapsedSections.backup && (
                    <Collapsible.CollapsibleContent>
                      <Info.InfoBox $variant="warning">
                        <FiShield size={20} />
                        <div>
                          <Info.InfoTitle>Important: Save Your Backup Codes</Info.InfoTitle>
                          <Info.InfoText>
                            These backup codes can be used if you lose access to your authenticator app. 
                            Store them in a secure location.
                          </Info.InfoText>
                        </div>
                      </Info.InfoBox>

                      <BackupCodesGrid>
                        {setupData.alternativeMethods.backupCodes.codes.map((code, index) => (
                          <BackupCode key={index}>{code}</BackupCode>
                        ))}
                      </BackupCodesGrid>

                      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <Button
                          onClick={() => handleCopy(
                            setupData.alternativeMethods!.backupCodes!.codes.join('\n'),
                            'backup-codes'
                          )}
                        >
                          {copiedItems.has('backup-codes') ? (
                            <>
                              <FiCheck size={16} />
                              Copied
                            </>
                          ) : (
                            <>
                              <FiCopy size={16} />
                              Copy All Codes
                            </>
                          )}
                        </Button>

                        <Button onClick={handleDownloadBackupCodes}>
                          <FiDownload size={16} />
                          Download Codes
                        </Button>
                      </div>

                      <Info.InfoBox $variant="info">
                        <FiShield size={20} />
                        <div>
                          <Info.InfoTitle>Backup Code Instructions</Info.InfoTitle>
                          <Info.InfoList>
                            {setupData.alternativeMethods.backupCodes.instructions.map((instruction, index) => (
                              <li key={index}>{instruction}</li>
                            ))}
                          </Info.InfoList>
                        </div>
                      </Info.InfoBox>
                    </Collapsible.CollapsibleContent>
                  )}
                </Collapsible.CollapsibleSection>
              )}

              <Info.InfoBox $variant="info">
                <FiSmartphone size={20} />
                <div>
                  <Info.InfoTitle>TOTP Authenticator Security</Info.InfoTitle>
                  <Info.InfoText>
                    Time-based One-Time Passwords (TOTP) provide strong security for your account.
                  </Info.InfoText>
                  <Info.InfoList>
                    <li>Codes change every 30 seconds for maximum security</li>
                    <li>Works offline - no internet connection required</li>
                    <li>Compatible with Google Authenticator, Authy, and other TOTP apps</li>
                    <li>Backup codes provide recovery if you lose your device</li>
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

export default TOTPRegistrationFormV6;