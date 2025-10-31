// src/components/FIDORegistrationFormV6.tsx
// FIDO Device Registration Form Component using V6 Architecture

import React, { useState, useCallback, useEffect } from 'react';
import { 
  FiKey, 
  FiShield, 
  FiSmartphone,
  FiCheck, 
  FiX, 
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiMonitor,
  FiUsb,
  FiFingerprint,
  FiLock
} from 'react-icons/fi';
import { V6FlowService } from '../services/v6FlowService';
import { useV6CollapsibleSections } from '../services/v6StepManagementService';
import FIDOService, { 
  type WebAuthnSupport,
  type FIDORegistrationOptions,
  type FIDORegistrationResult
} from '../services/fidoService';
import PingOneMfaService, { 
  type MfaCredentials,
  type DeviceRegistrationConfig,
  type DeviceRegistrationResult
} from '../services/pingOneMfaService';
import styled from 'styled-components';

export interface FIDORegistrationFormProps {
  credentials: MfaCredentials;
  onRegistrationComplete: (result: DeviceRegistrationResult) => void;
  onCancel: () => void;
  theme?: 'blue' | 'green' | 'purple';
  initialNickname?: string;
  userName?: string;
  userDisplayName?: string;
}const F
ormContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const CompatibilityCard = styled.div<{ $status: 'supported' | 'unsupported' | 'partial' }>`
  padding: 1.5rem;
  border-radius: 0.75rem;
  margin: 1rem 0;
  border: 1px solid ${props => {
    switch (props.$status) {
      case 'supported': return '#10b981';
      case 'partial': return '#f59e0b';
      case 'unsupported': return '#ef4444';
    }
  }};
  background: ${props => {
    switch (props.$status) {
      case 'supported': return '#f0fdf4';
      case 'partial': return '#fffbeb';
      case 'unsupported': return '#fef2f2';
    }
  }};
`;

const AuthenticatorTypeCard = styled.div<{ $selected?: boolean; $disabled?: boolean }>`
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
    ${props => !props.$disabled && `
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    `}
  }
`;

const AuthenticatorIcon = styled.div<{ $type: string }>`
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: ${props => {
    switch (props.$type) {
      case 'platform': return '#3b82f6';
      case 'cross-platform': return '#10b981';
      case 'both': return '#8b5cf6';
      default: return '#6b7280';
    }
  }};
  margin-bottom: 1rem;
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

const Select = styled.select<{ $hasError?: boolean }>`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid ${props => props.$hasError ? '#ef4444' : '#d1d5db'};
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: white;
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

export const FIDORegistrationFormV6: React.FC<FIDORegistrationFormProps> = ({
  credentials,
  onRegistrationComplete,
  onCancel,
  theme = 'blue',
  initialNickname = 'My Security Key',
  userName,
  userDisplayName
}) => {
  const { Layout, Collapsible, Info, Cards } = V6FlowService.createFlowComponents(theme);
  const { collapsedSections, toggleSection } = useV6CollapsibleSections();

  // Form state
  const [nickname, setNickname] = useState(initialNickname);
  const [authenticatorType, setAuthenticatorType] = useState<'platform' | 'cross-platform' | 'both'>('both');
  const [userVerification, setUserVerification] = useState<'required' | 'preferred' | 'discouraged'>('preferred');
  
  // Registration state
  const [currentStep, setCurrentStep] = useState<'compatibility' | 'configure' | 'register' | 'complete'>('compatibility');
  const [webAuthnSupport, setWebAuthnSupport] = useState<WebAuthnSupport | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<FIDORegistrationResult | null>(null);
  
  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check WebAuthn support on mount
  useEffect(() => {
    const support = FIDOService.checkWebAuthnSupport();
    setWebAuthnSupport(support);
    
    if (support.supported) {
      setCurrentStep('configure');
    }
  }, []);

  const handleRegister = useCallback(async () => {
    if (!nickname.trim()) {
      setErrors({ nickname: 'Device nickname is required' });
      return;
    }

    if (!webAuthnSupport?.supported) {
      setErrors({ webauthn: 'WebAuthn is not supported in this browser' });
      return;
    }

    setIsRegistering(true);
    setErrors({});
    setCurrentStep('register');

    try {
      const options: FIDORegistrationOptions = {
        nickname: nickname.trim(),
        authenticatorType,
        userVerification,
        attestation: 'none',
        timeout: 60000
      };

      const fidoResult = await FIDOService.registerDevice(
        credentials.userId,
        userName || credentials.userId,
        userDisplayName || credentials.userId,
        options
      );

      setRegistrationResult(fidoResult);

      if (fidoResult.success) {
        // Register with PingOne MFA service
        const config: DeviceRegistrationConfig = {
          type: 'FIDO2',
          nickname: nickname.trim()
        };

        const mfaResult = await PingOneMfaService.registerDevice(credentials, config);
        
        if (mfaResult.success) {
          setCurrentStep('complete');
          onRegistrationComplete(mfaResult);
        } else {
          setErrors({ registration: mfaResult.error || 'Failed to register with PingOne MFA' });
        }
      } else {
        setErrors({ fido: fidoResult.error || 'FIDO registration failed' });
      }
    } catch (error) {
      console.error('FIDO registration failed:', error);
      setErrors({ registration: error instanceof Error ? error.message : 'Registration failed' });
    } finally {
      setIsRegistering(false);
    }
  }, [nickname, authenticatorType, userVerification, webAuthnSupport, credentials, userName, userDisplayName, onRegistrationComplete]);

  const getCompatibilityStatus = (): 'supported' | 'partial' | 'unsupported' => {
    if (!webAuthnSupport) return 'unsupported';
    if (webAuthnSupport.supported && webAuthnSupport.platformAuthenticator && webAuthnSupport.crossPlatformAuthenticator) {
      return 'supported';
    }
    if (webAuthnSupport.supported) {
      return 'partial';
    }
    return 'unsupported';
  };

  const getAuthenticatorIcon = (type: string) => {
    switch (type) {
      case 'platform':
        return <FiFingerprint size={20} />;
      case 'cross-platform':
        return <FiUsb size={20} />;
      case 'both':
        return <FiKey size={20} />;
      default:
        return <FiShield size={20} />;
    }
  };

  const getAuthenticatorDescription = (type: 'platform' | 'cross-platform' | 'both'): string => {
    switch (type) {
      case 'platform':
        return 'Built-in authenticators like Touch ID, Face ID, or Windows Hello';
      case 'cross-platform':
        return 'External security keys like YubiKey or other FIDO2 devices';
      case 'both':
        return 'Allow both built-in and external authenticators';
    }
  };

  if (!webAuthnSupport) {
    return (
      <Layout.Container>
        <Layout.ContentWrapper>
          <Layout.MainCard>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
              <FiRefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ marginLeft: '0.5rem' }}>Checking WebAuthn support...</span>
            </div>
          </Layout.MainCard>
        </Layout.ContentWrapper>
      </Layout.Container>
    );
  }  ret
urn (
    <Layout.Container>
      <Layout.ContentWrapper>
        <Layout.MainCard>
          <Layout.StepHeader>
            <Layout.StepHeaderLeft>
              <Layout.VersionBadge>V6.0 - Service Architecture</Layout.VersionBadge>
              <Layout.StepHeaderTitle>Register FIDO Security Key</Layout.StepHeaderTitle>
              <Layout.StepHeaderSubtitle>
                {currentStep === 'compatibility' && 'Checking browser compatibility'}
                {currentStep === 'configure' && 'Configure your security key'}
                {currentStep === 'register' && 'Activate your security key'}
                {currentStep === 'complete' && 'Registration complete'}
              </Layout.StepHeaderSubtitle>
            </Layout.StepHeaderLeft>
          </Layout.StepHeader>

          <Layout.StepContentWrapper>
            <FormContainer>
              <StepIndicator>
                <StepNumber $completed={currentStep !== 'compatibility'} $active={currentStep === 'compatibility'}>
                  {currentStep !== 'compatibility' ? <FiCheck size={14} /> : '1'}
                </StepNumber>
                <StepText $completed={currentStep !== 'compatibility'} $active={currentStep === 'compatibility'}>
                  Compatibility Check
                </StepText>

                <StepNumber $completed={!['compatibility', 'configure'].includes(currentStep)} $active={currentStep === 'configure'}>
                  {!['compatibility', 'configure'].includes(currentStep) ? <FiCheck size={14} /> : '2'}
                </StepNumber>
                <StepText $completed={!['compatibility', 'configure'].includes(currentStep)} $active={currentStep === 'configure'}>
                  Configuration
                </StepText>

                <StepNumber $completed={currentStep === 'complete'} $active={currentStep === 'register'}>
                  {currentStep === 'complete' ? <FiCheck size={14} /> : '3'}
                </StepNumber>
                <StepText $completed={currentStep === 'complete'} $active={currentStep === 'register'}>
                  Registration
                </StepText>
              </StepIndicator>

              {(currentStep === 'compatibility' || !webAuthnSupport.supported) && (
                <Collapsible.CollapsibleSection>
                  <Collapsible.CollapsibleHeaderButton
                    onClick={() => toggleSection('compatibility')}
                    aria-expanded={!collapsedSections.compatibility}
                  >
                    <Collapsible.CollapsibleTitle>
                      <FiShield /> Browser Compatibility
                    </Collapsible.CollapsibleTitle>
                    <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.compatibility}>
                      <FiRefreshCw />
                    </Collapsible.CollapsibleToggleIcon>
                  </Collapsible.CollapsibleHeaderButton>
                  {!collapsedSections.compatibility && (
                    <Collapsible.CollapsibleContent>
                      <CompatibilityCard $status={getCompatibilityStatus()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                          {getCompatibilityStatus() === 'supported' && <FiCheckCircle size={24} color="#10b981" />}
                          {getCompatibilityStatus() === 'partial' && <FiAlertCircle size={24} color="#f59e0b" />}
                          {getCompatibilityStatus() === 'unsupported' && <FiX size={24} color="#ef4444" />}
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
                              {getCompatibilityStatus() === 'supported' && 'Full WebAuthn Support'}
                              {getCompatibilityStatus() === 'partial' && 'Partial WebAuthn Support'}
                              {getCompatibilityStatus() === 'unsupported' && 'WebAuthn Not Supported'}
                            </h3>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', opacity: 0.8 }}>
                              Browser: {webAuthnSupport.browserInfo}
                            </p>
                          </div>
                        </div>

                        <Cards.ParameterGrid>
                          <Cards.ParameterLabel>WebAuthn API</Cards.ParameterLabel>
                          <Cards.ParameterValue>
                            {webAuthnSupport.supported ? (
                              <span style={{ color: '#10b981' }}>✓ Supported</span>
                            ) : (
                              <span style={{ color: '#ef4444' }}>✗ Not Supported</span>
                            )}
                          </Cards.ParameterValue>
                          
                          <Cards.ParameterLabel>Platform Authenticator</Cards.ParameterLabel>
                          <Cards.ParameterValue>
                            {webAuthnSupport.platformAuthenticator ? (
                              <span style={{ color: '#10b981' }}>✓ Available</span>
                            ) : (
                              <span style={{ color: '#f59e0b' }}>⚠ Not Available</span>
                            )}
                          </Cards.ParameterValue>
                          
                          <Cards.ParameterLabel>Security Keys</Cards.ParameterLabel>
                          <Cards.ParameterValue>
                            {webAuthnSupport.crossPlatformAuthenticator ? (
                              <span style={{ color: '#10b981' }}>✓ Supported</span>
                            ) : (
                              <span style={{ color: '#f59e0b' }}>⚠ Limited Support</span>
                            )}
                          </Cards.ParameterValue>
                          
                          <Cards.ParameterLabel>Conditional UI</Cards.ParameterLabel>
                          <Cards.ParameterValue>
                            {webAuthnSupport.conditionalMediation ? (
                              <span style={{ color: '#10b981' }}>✓ Available</span>
                            ) : (
                              <span style={{ color: '#6b7280' }}>- Not Available</span>
                            )}
                          </Cards.ParameterValue>
                        </Cards.ParameterGrid>

                        {!webAuthnSupport.supported && (
                          <Info.InfoBox $variant="danger" style={{ marginTop: '1rem' }}>
                            <FiAlertCircle size={20} />
                            <div>
                              <Info.InfoTitle>WebAuthn Not Supported</Info.InfoTitle>
                              <Info.InfoText>
                                Your browser does not support WebAuthn/FIDO2. Please use a modern browser like Chrome, Firefox, Safari, or Edge.
                              </Info.InfoText>
                            </div>
                          </Info.InfoBox>
                        )}

                        {webAuthnSupport.supported && (
                          <div style={{ marginTop: '1rem' }}>
                            <Button
                              $variant="primary"
                              onClick={() => setCurrentStep('configure')}
                            >
                              <FiCheckCircle size={16} />
                              Continue to Configuration
                            </Button>
                          </div>
                        )}
                      </CompatibilityCard>
                    </Collapsible.CollapsibleContent>
                  )}
                </Collapsible.CollapsibleSection>
              )} 
             {currentStep === 'configure' && webAuthnSupport.supported && (
                <Collapsible.CollapsibleSection>
                  <Collapsible.CollapsibleHeaderButton
                    onClick={() => toggleSection('configure')}
                    aria-expanded={!collapsedSections.configure}
                  >
                    <Collapsible.CollapsibleTitle>
                      <FiKey /> Device Configuration
                    </Collapsible.CollapsibleTitle>
                    <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.configure}>
                      <FiRefreshCw />
                    </Collapsible.CollapsibleToggleIcon>
                  </Collapsible.CollapsibleHeaderButton>
                  {!collapsedSections.configure && (
                    <Collapsible.CollapsibleContent>
                      <FormGroup>
                        <Label htmlFor="nickname">Device Nickname</Label>
                        <Input
                          id="nickname"
                          type="text"
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                          placeholder="My Security Key"
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

                      <FormGroup>
                        <Label>Authenticator Type</Label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                          <AuthenticatorTypeCard
                            $selected={authenticatorType === 'platform'}
                            $disabled={!webAuthnSupport.platformAuthenticator}
                            onClick={() => webAuthnSupport.platformAuthenticator && setAuthenticatorType('platform')}
                          >
                            <AuthenticatorIcon $type="platform">
                              <FiFingerprint size={20} />
                            </AuthenticatorIcon>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>
                              Platform Authenticator
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.4 }}>
                              {getAuthenticatorDescription('platform')}
                            </p>
                            {!webAuthnSupport.platformAuthenticator && (
                              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#ef4444' }}>
                                Not available on this device
                              </p>
                            )}
                          </AuthenticatorTypeCard>

                          <AuthenticatorTypeCard
                            $selected={authenticatorType === 'cross-platform'}
                            onClick={() => setAuthenticatorType('cross-platform')}
                          >
                            <AuthenticatorIcon $type="cross-platform">
                              <FiUsb size={20} />
                            </AuthenticatorIcon>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>
                              Security Key
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.4 }}>
                              {getAuthenticatorDescription('cross-platform')}
                            </p>
                          </AuthenticatorTypeCard>

                          <AuthenticatorTypeCard
                            $selected={authenticatorType === 'both'}
                            onClick={() => setAuthenticatorType('both')}
                          >
                            <AuthenticatorIcon $type="both">
                              <FiKey size={20} />
                            </AuthenticatorIcon>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>
                              Any Authenticator
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.4 }}>
                              {getAuthenticatorDescription('both')}
                            </p>
                          </AuthenticatorTypeCard>
                        </div>
                      </FormGroup>

                      <FormGroup>
                        <Label htmlFor="userVerification">User Verification</Label>
                        <Select
                          id="userVerification"
                          value={userVerification}
                          onChange={(e) => setUserVerification(e.target.value as 'required' | 'preferred' | 'discouraged')}
                          disabled={isRegistering}
                        >
                          <option value="preferred">Preferred (Recommended)</option>
                          <option value="required">Required</option>
                          <option value="discouraged">Discouraged</option>
                        </Select>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                          {userVerification === 'required' && 'PIN, biometric, or gesture verification required'}
                          {userVerification === 'preferred' && 'Use verification if available'}
                          {userVerification === 'discouraged' && 'Skip verification when possible'}
                        </div>
                      </FormGroup>

                      {errors.webauthn && (
                        <ErrorText style={{ marginBottom: '1rem' }}>
                          <FiAlertCircle size={12} />
                          {errors.webauthn}
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
                              Registering...
                            </>
                          ) : (
                            <>
                              <FiKey size={16} />
                              Register Security Key
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
  {currentStep === 'register' && (
                <Collapsible.CollapsibleSection>
                  <Collapsible.CollapsibleHeaderButton
                    onClick={() => toggleSection('register')}
                    aria-expanded={!collapsedSections.register}
                  >
                    <Collapsible.CollapsibleTitle>
                      <FiLock /> Security Key Registration
                    </Collapsible.CollapsibleTitle>
                    <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.register}>
                      <FiRefreshCw />
                    </Collapsible.CollapsibleToggleIcon>
                  </Collapsible.CollapsibleHeaderButton>
                  {!collapsedSections.register && (
                    <Collapsible.CollapsibleContent>
                      <Info.InfoBox $variant="info">
                        <FiKey size={20} />
                        <div>
                          <Info.InfoTitle>Activate Your Security Key</Info.InfoTitle>
                          <Info.InfoText>
                            {authenticatorType === 'platform' && 'Use your device\'s built-in authenticator (Touch ID, Face ID, Windows Hello, etc.)'}
                            {authenticatorType === 'cross-platform' && 'Insert your security key and follow the prompts to activate it'}
                            {authenticatorType === 'both' && 'Use any available authenticator method'}
                          </Info.InfoText>
                        </div>
                      </Info.InfoBox>

                      {errors.fido && (
                        <ErrorText style={{ marginTop: '1rem' }}>
                          <FiAlertCircle size={12} />
                          {errors.fido}
                        </ErrorText>
                      )}

                      {errors.registration && (
                        <ErrorText style={{ marginTop: '1rem' }}>
                          <FiAlertCircle size={12} />
                          {errors.registration}
                        </ErrorText>
                      )}

                      {isRegistering && (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          padding: '2rem',
                          flexDirection: 'column',
                          gap: '1rem'
                        }}>
                          <FiRefreshCw size={32} style={{ animation: 'spin 1s linear infinite', color: '#3b82f6' }} />
                          <p style={{ margin: 0, textAlign: 'center', color: '#6b7280' }}>
                            Waiting for security key activation...
                          </p>
                          <p style={{ margin: 0, fontSize: '0.875rem', textAlign: 'center', color: '#9ca3af' }}>
                            Follow the prompts on your device or security key
                          </p>
                        </div>
                      )}
                    </Collapsible.CollapsibleContent>
                  )}
                </Collapsible.CollapsibleSection>
              )}

              {currentStep === 'complete' && registrationResult?.success && (
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
                          <Info.InfoTitle>FIDO Security Key Successfully Registered</Info.InfoTitle>
                          <Info.InfoText>
                            Your security key has been registered and is ready for use. 
                            You can now use it for multi-factor authentication.
                          </Info.InfoText>
                        </div>
                      </Info.InfoBox>

                      <Cards.GeneratedContentBox>
                        <Cards.GeneratedLabel>Device Details</Cards.GeneratedLabel>
                        <Cards.ParameterGrid>
                          <Cards.ParameterLabel>Device Type</Cards.ParameterLabel>
                          <Cards.ParameterValue>FIDO2 Security Key</Cards.ParameterValue>
                          
                          <Cards.ParameterLabel>Nickname</Cards.ParameterLabel>
                          <Cards.ParameterValue>{nickname}</Cards.ParameterValue>
                          
                          <Cards.ParameterLabel>Authenticator Type</Cards.ParameterLabel>
                          <Cards.ParameterValue>
                            {authenticatorType === 'platform' && 'Platform Authenticator'}
                            {authenticatorType === 'cross-platform' && 'Security Key'}
                            {authenticatorType === 'both' && 'Any Authenticator'}
                          </Cards.ParameterValue>
                          
                          <Cards.ParameterLabel>User Verification</Cards.ParameterLabel>
                          <Cards.ParameterValue>{userVerification}</Cards.ParameterValue>
                          
                          <Cards.ParameterLabel>Status</Cards.ParameterLabel>
                          <Cards.ParameterValue>Active</Cards.ParameterValue>
                          
                          {registrationResult.deviceId && (
                            <>
                              <Cards.ParameterLabel>Device ID</Cards.ParameterLabel>
                              <Cards.ParameterValue>{registrationResult.deviceId}</Cards.ParameterValue>
                            </>
                          )}
                        </Cards.ParameterGrid>
                      </Cards.GeneratedContentBox>
                    </Collapsible.CollapsibleContent>
                  )}
                </Collapsible.CollapsibleSection>
              )}

              <Info.InfoBox $variant="info">
                <FiShield size={20} />
                <div>
                  <Info.InfoTitle>FIDO2 Security Benefits</Info.InfoTitle>
                  <Info.InfoText>
                    FIDO2 provides the highest level of security for multi-factor authentication.
                  </Info.InfoText>
                  <Info.InfoList>
                    <li>Phishing-resistant authentication</li>
                    <li>No shared secrets or passwords</li>
                    <li>Hardware-backed cryptographic security</li>
                    <li>Works across devices and platforms</li>
                    <li>Privacy-preserving design</li>
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

export default FIDORegistrationFormV6;