/**
 * @file CustomLoginForm.tsx
 * @module protect-portal/components
 * @description Custom login form with embedded PingOne authentication
 * @version 9.6.5
 * @since 2026-02-10
 *
 * This component provides a custom login form that uses PingOne embedded login
 * (pi.flow) instead of redirecting to the PingOne login page.
 */

import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { FiAlertTriangle, FiEye, FiEyeOff, FiLoader, FiUser, FiLock as FiLockIcon } from 'react-icons/fi';

import type { UserContext, LoginContext, PortalError } from '../types/protectPortal.types';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const LoginFormContainer = styled.div`
  width: 100%;
  max-width: 500px;
`;

const FormTitle = styled.h2`
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem 0;
  text-align: center;
`;

const FormDescription = styled.p`
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 2rem 0;
  text-align: center;
  line-height: 1.6;
`;

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InputGroup = styled.div`
  position: relative;
`;

const InputLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  color: #9ca3af;
  pointer-events: none;
  z-index: 1;
`;

const StyledInput = styled.input<{ hasIcon: boolean; hasToggle: boolean }>`
  width: 100%;
  padding: ${props => {
    const leftPadding = props.hasIcon ? '3rem' : '1rem';
    const rightPadding = props.hasToggle ? '3rem' : '1rem';
    return `0.75rem ${rightPadding} 0.75rem ${leftPadding}`;
  }};
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:invalid {
    border-color: #ef4444;
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;

  &:hover {
    color: #374151;
  }

  &:focus {
    outline: none;
    color: #3b82f6;
  }
`;

const SubmitButton = styled.button<{ disabled?: boolean }>`
  background: ${props => props.disabled ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'};
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 1rem;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 56px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
  }
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

const LoadingSpinner = styled(FiLoader)`
  animation: spin 1s linear infinite;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const MockModeIndicator = styled.div`
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  color: #92400e;
  text-align: center;
`;

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface CustomLoginFormProps {
  onLoginSuccess: (userContext: UserContext, loginContext: LoginContext) => void;
  onError: (error: PortalError) => void;
  enableMockMode?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

const CustomLoginForm: React.FC<CustomLoginFormProps> = ({
  onLoginSuccess,
  onError,
  enableMockMode = false
}) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  }, [error]);

  const handlePasswordToggle = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.username || !formData.password) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (enableMockMode) {
        // Mock authentication for testing
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const userContext: UserContext = {
          id: `user-${formData.username}`,
          email: formData.email || `${formData.username}@securecorp.com`,
          name: formData.username.charAt(0).toUpperCase() + formData.username.slice(1),
          username: formData.username,
          type: 'EXTERNAL',
          device: {
            userAgent: navigator.userAgent,
            ipAddress: '192.168.1.100' // Mock IP
          },
          session: {
            id: `session-${Date.now()}`,
            createdAt: new Date().toISOString()
          }
        };

        const loginContext: LoginContext = {
          timestamp: new Date().toISOString(),
          ipAddress: '192.168.1.100',
          userAgent: navigator.userAgent,
          origin: window.location.origin,
          flowType: 'AUTHENTICATION',
          flowSubtype: 'CUSTOM_LOGIN'
        };

        onLoginSuccess(userContext, loginContext);
      } else {
        // TODO: Implement actual PingOne embedded login
        // This would integrate with the PingOne JavaScript SDK
        throw new Error('PingOne embedded login not yet implemented');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      
      const portalError: PortalError = {
        code: 'LOGIN_FAILED',
        message: errorMessage,
        recoverable: true,
        suggestedAction: 'Please check your credentials and try again'
      };
      
      onError(portalError);
    } finally {
      setIsLoading(false);
    }
  }, [formData, enableMockMode, onLoginSuccess, onError]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    console.log('[🔐 CUSTOM-LOGIN] Custom login form initialized', {
      enableMockMode,
      userAgent: navigator.userAgent
    });
  }, [enableMockMode]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <LoginFormContainer>
      <FormTitle>Secure Login</FormTitle>
      <FormDescription>
        Enter your credentials to begin the secure authentication process
      </FormDescription>

      {enableMockMode && (
        <MockModeIndicator>
          <strong>Mock Mode Enabled</strong> - This is a demonstration login for testing purposes
        </MockModeIndicator>
      )}

      {error && (
        <ErrorMessage>
          <FiAlertTriangle />
          {error}
        </ErrorMessage>
      )}

      <LoginForm onSubmit={handleSubmit}>
        <InputGroup>
          <InputLabel htmlFor="username">Username</InputLabel>
          <InputWrapper>
            <InputIcon>
              <FiUser />
            </InputIcon>
            <StyledInput
              id="username"
              name="username"
              type="text"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleInputChange}
              hasIcon={true}
              hasToggle={false}
              required
              disabled={isLoading}
              autoComplete="username"
            />
          </InputWrapper>
        </InputGroup>

        <InputGroup>
          <InputLabel htmlFor="email">Email (Optional)</InputLabel>
          <InputWrapper>
            <InputIcon>
              <FiUser />
            </InputIcon>
            <StyledInput
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleInputChange}
              hasIcon={true}
              hasToggle={false}
              disabled={isLoading}
              autoComplete="email"
            />
          </InputWrapper>
        </InputGroup>

        <InputGroup>
          <InputLabel htmlFor="password">Password</InputLabel>
          <InputWrapper>
            <InputIcon>
              <FiLockIcon />
            </InputIcon>
            <StyledInput
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              hasIcon={true}
              hasToggle={true}
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
            <PasswordToggle
              type="button"
              onClick={handlePasswordToggle}
              disabled={isLoading}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </PasswordToggle>
          </InputWrapper>
        </InputGroup>

        <SubmitButton type="submit" disabled={isLoading || !formData.username || !formData.password}>
          {isLoading ? (
            <>
              <LoadingSpinner />
              Authenticating...
            </>
          ) : (
            <>
              <FiLockIcon />
              Sign In Securely
            </>
          )}
        </SubmitButton>
      </LoginForm>
    </LoginFormContainer>
  );
};

export default CustomLoginForm;
