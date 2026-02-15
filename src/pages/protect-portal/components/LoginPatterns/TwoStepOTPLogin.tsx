/**
 * @file TwoStepOTPLogin.tsx
 * @module protect-portal/components/LoginPatterns
 * @description Two-step OTP login component
 * @version 9.11.58
 * @since 2026-02-15
 *
 * Two-step OTP login flow for PingIdentity pattern.
 */

import React, { useState } from 'react';
import { FiLock, FiMail, FiArrowRight } from 'react-icons/fi';
import styled from 'styled-components';
import type { CorporatePortalConfig } from '../../types/CorporatePortalConfig';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const LoginContainer = styled.div<{ $brandColor: string }>`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  margin: 0 auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
`;

const StepIndicator = styled.div<{ $brandColor: string }>`
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background: #e0e0e0;
    z-index: 0;
  }
`;

const Step = styled.div<{ $active: boolean; $completed: boolean; $brandColor: string }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ $active, $completed, $brandColor }) => 
    $completed ? $brandColor : $active ? $brandColor : '#e0e0e0'};
  color: ${({ $active, $completed }) => ($active || $completed) ? 'white' : '#666'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  position: relative;
  z-index: 1;
`;

const StepTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.5rem 0;
`;

const StepDescription = styled.p`
  color: #666;
  margin: 0 0 2rem 0;
  line-height: 1.5;
`;

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const InputLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #333;
`;

const Input = styled.input<{ $brandColor: string }>`
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${({ $brandColor }) => $brandColor};
  }
`;

const OTPInput = styled.input<{ $brandColor: string }>`
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1.25rem;
  text-align: center;
  letter-spacing: 0.25rem;
  font-weight: 600;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${({ $brandColor }) => $brandColor};
  }
`;

const ActionButton = styled.button<{ $brandColor: string; $accentColor: string }>`
  background: ${({ $accentColor }) => $accentColor};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover {
    background: ${({ $brandColor }) => $brandColor};
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const ResendLink = styled.button<{ $brandColor: string }>`
  background: none;
  border: none;
  color: ${({ $brandColor }) => $brandColor};
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0.5rem 0;
  
  &:hover {
    color: ${({ $brandColor }) => $brandColor};
    opacity: 0.8;
  }
`;

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface TwoStepOTPLoginProps {
  step: 'username' | 'otp';
  username: string;
  onStepChange: (step: 'username' | 'otp', username: string) => void;
  onSubmit: (credentials: { username: string; otp?: string }) => void;
  config: CorporatePortalConfig;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const TwoStepOTPLogin: React.FC<TwoStepOTPLoginProps> = ({
  step,
  username,
  onStepChange,
  onSubmit,
  config,
}) => {
  const [formData, setFormData] = useState({
    username: username,
    otp: '',
  });

  // Handle username step submission
  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would send OTP
    onStepChange('otp', formData.username);
  };

  // Handle OTP step submission
  const handleOTPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ username: formData.username, otp: formData.otp });
  };

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle resend OTP
  const handleResendOTP = () => {
    // In a real implementation, this would resend OTP
    console.log('Resending OTP to:', formData.username);
  };

  const brandColor = config.branding.colors.primary;
  const accentColor = config.branding.colors.accent;

  return (
    <LoginContainer $brandColor={brandColor}>
      <StepIndicator $brandColor={brandColor}>
        <Step $active={step === 'username'} $completed={step === 'otp'} $brandColor={brandColor}>
          1
        </Step>
        <Step $active={step === 'otp'} $completed={false} $brandColor={brandColor}>
          2
        </Step>
      </StepIndicator>

      {step === 'username' ? (
        <>
          <StepTitle>Enter Your Username</StepTitle>
          <StepDescription>
            Enter your username to receive a one-time verification code
          </StepDescription>

          <LoginForm onSubmit={handleUsernameSubmit}>
            <InputGroup>
              <InputLabel htmlFor="username">Username</InputLabel>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Enter your username"
                required
                $brandColor={brandColor}
              />
            </InputGroup>

            <ActionButton type="submit" $brandColor={brandColor} $accentColor={accentColor}>
              Send Code
              <FiArrowRight />
            </ActionButton>
          </LoginForm>
        </>
      ) : (
        <>
          <StepTitle>Enter Verification Code</StepTitle>
          <StepDescription>
            We've sent a verification code to your device. Enter the code below to continue.
          </StepDescription>

          <LoginForm onSubmit={handleOTPSubmit}>
            <InputGroup>
              <InputLabel htmlFor="otp">Verification Code</InputLabel>
              <OTPInput
                id="otp"
                type="text"
                value={formData.otp}
                onChange={(e) => handleInputChange('otp', e.target.value)}
                placeholder="000000"
                maxLength={6}
                required
                $brandColor={brandColor}
              />
            </InputGroup>

            <ActionButton type="submit" $brandColor={brandColor} $accentColor={accentColor}>
              <FiLock />
              Verify Code
            </ActionButton>

            <ResendLink type="button" onClick={handleResendOTP} $brandColor={brandColor}>
              <FiMail />
              Resend Code
            </ResendLink>
          </LoginForm>
        </>
      )}
    </LoginContainer>
  );
};

export default TwoStepOTPLogin;
