/**
 * @file EmbeddedLogin.tsx
 * @module protect-portal/components/LoginPatterns
 * @description Embedded login component
 * @version 9.11.58
 * @since 2026-02-15
 *
 * Embedded login form within main page for Bank of America pattern.
 */

import React, { useState } from 'react';
import { FiLock, FiShield } from 'react-icons/fi';
import styled from 'styled-components';
import type { CorporatePortalConfig } from '../../types/CorporatePortalConfig';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const LoginCard = styled.div<{ $brandColor: string }>`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  margin: 0 auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
`;

const CardHeader = styled.div<{ $brandColor: string }>`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid ${({ $brandColor }) => $brandColor};
`;

const CardIcon = styled.div<{ $brandColor: string }>`
  width: 48px;
  height: 48px;
  background: ${({ $brandColor }) => $brandColor};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  color: white;
  font-size: 1.2rem;
`;

const CardTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const CardDescription = styled.p`
  color: #666;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
`;

const TrustIndicators = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #666;
`;

const TrustIcon = styled.div`
  color: #059669;
  font-size: 1rem;
`;

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

const LoginButton = styled.button<{ $brandColor: string; $accentColor: string }>`
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

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface EmbeddedLoginProps {
  onSubmit: (credentials: { username: string; password: string }) => void;
  config: CorporatePortalConfig;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const EmbeddedLogin: React.FC<EmbeddedLoginProps> = ({
  onSubmit,
  config,
}) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const brandColor = config.branding.colors.primary;
  const accentColor = config.branding.colors.accent;

  return (
    <LoginCard $brandColor={brandColor}>
      <CardHeader $brandColor={brandColor}>
        <CardIcon $brandColor={brandColor}>
          <FiLock />
        </CardIcon>
        <CardTitle>
          {config.content.customerTerminology ? 'Customer Login' : 'Employee Login'}
        </CardTitle>
      </CardHeader>

      <CardDescription>
        {config.content.customerTerminology 
          ? 'Access your account with our secure banking login system'
          : 'Access your employee account with enhanced security'
        }
      </CardDescription>

      {config.login.security === 'high-trust' && (
        <TrustIndicators>
          <TrustIcon>
            <FiShield />
          </TrustIcon>
          <span>Bank-level security protection</span>
        </TrustIndicators>
      )}

      <LoginForm onSubmit={handleSubmit}>
        <InputGroup>
          <InputLabel htmlFor="username">
            {config.content.customerTerminology ? 'Customer ID' : 'Employee ID'}
          </InputLabel>
          <Input
            id="username"
            type="text"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            placeholder={`Enter your ${config.content.customerTerminology ? 'customer' : 'employee'} ID`}
            required
            $brandColor={brandColor}
          />
        </InputGroup>

        <InputGroup>
          <InputLabel htmlFor="password">Password</InputLabel>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="Enter your password"
            required
            $brandColor={brandColor}
          />
        </InputGroup>

        <LoginButton type="submit" $brandColor={brandColor} $accentColor={accentColor}>
          <FiLock />
          Sign In
        </LoginButton>
      </LoginForm>
    </LoginCard>
  );
};

export default EmbeddedLogin;
