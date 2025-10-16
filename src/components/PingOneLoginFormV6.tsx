// src/components/PingOneLoginFormV6.tsx
// PingOne Login Form Component using V6 Architecture

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FiUser, FiLock, FiGlobe, FiEye, FiEyeOff, FiLogIn, FiAlertCircle, FiCheckCircle, FiLoader, FiChevronDown } from 'react-icons/fi';
import { V6FlowService } from '../services/v6FlowService';
import { useV6CollapsibleSections } from '../services/v6StepManagementService';
import ComprehensiveDiscoveryInput from './ComprehensiveDiscoveryInput';
import PingOneAuthService, { 
  type LoginCredentials, 
  type AuthenticationResult, 
  type AuthenticationError,
  type EnvironmentConfig 
} from '../services/pingOneAuthService';
import { DiscoveryResult } from '../services/comprehensiveDiscoveryService';
import { v4ToastManager } from '../utils/v4ToastMessages';
import styled from 'styled-components';

export interface PingOneLoginFormProps {
  onAuthenticationSuccess: (result: AuthenticationResult) => void;
  onAuthenticationError: (error: AuthenticationError) => void;
  environmentId?: string;
  theme?: 'blue' | 'green' | 'purple';
  initialUsername?: string;
  showEnvironmentConfig?: boolean;
  autoFocus?: boolean;
}

// Additional styled components for form elements
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

const Input = styled.input<{ $hasError?: boolean }>`
  width: 100%;
  padding: 0.75rem 1rem;
  padding-left: 2.5rem;
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

const InputIcon = styled.div`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  pointer-events: none;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  
  &:hover {
    color: #374151;
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary'; $loading?: boolean }>`
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
    if (props.$variant === 'secondary') {
      return `
        background: #f3f4f6;
        color: #374151;
        border: 1px solid #d1d5db;
        
        &:hover:not(:disabled) {
          background: #e5e7eb;
        }
      `;
    }
    
    return `
      background: #3b82f6;
      color: white;
      
      &:hover:not(:disabled) {
        background: #2563eb;
      }
    `;
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

export const PingOneLoginFormV6: React.FC<PingOneLoginFormProps> = ({
  onAuthenticationSuccess,
  onAuthenticationError,
  environmentId: initialEnvironmentId,
  theme = 'blue',
  initialUsername = '',
  showEnvironmentConfig = true,
  autoFocus = true
}) => {
  const { Layout, Collapsible, Info, Cards } = V6FlowService.createFlowComponents(theme);
  const { collapsedSections, toggleSection } = useV6CollapsibleSections();

  // Form state
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: initialUsername,
    password: '',
    environmentId: initialEnvironmentId || ''
  });
  
  // Track if initial focus has been applied
  const [hasInitialFocus, setHasInitialFocus] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [environmentConfig, setEnvironmentConfig] = useState<EnvironmentConfig | null>(null);
  const [discoveryComplete, setDiscoveryComplete] = useState(false);

  // Load environment config when environmentId changes
  useEffect(() => {
    if (credentials.environmentId) {
      loadEnvironmentConfig(credentials.environmentId);
    }
  }, [credentials.environmentId]);

  const loadEnvironmentConfig = useCallback(async (envId: string) => {
    try {
      const config = await PingOneAuthService.getEnvironmentConfig(envId);
      setEnvironmentConfig(config);
      setDiscoveryComplete(!!config);
    } catch (error) {
      console.error('Failed to load environment config:', error);
      v4ToastManager.showError('Failed to load environment configuration');
      setEnvironmentConfig(null);
      setDiscoveryComplete(false);
    }
  }, []);

  const handleDiscoveryComplete = useCallback((result: DiscoveryResult) => {
    if (result.success && result.environmentId) {
      setCredentials(prev => ({
        ...prev,
        environmentId: result.environmentId!
      }));
      setDiscoveryComplete(true);
      setErrors(prev => ({ ...prev, environmentId: '' }));
    }
  }, []);

  const handleInputChange = useCallback((field: keyof LoginCredentials, value: string) => {
    setCredentials(prev => {
      if (prev[field] === value) return prev; // Prevent unnecessary updates
      return { ...prev, [field]: value };
    });
    
    // Clear field-specific errors only if there was an error
    setErrors(prev => {
      if (prev[field]) {
        return { ...prev, [field]: '' };
      }
      return prev;
    });
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!credentials.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!credentials.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (credentials.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!credentials.environmentId.trim()) {
      newErrors.environmentId = 'Environment ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [credentials]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await PingOneAuthService.authenticate(credentials);
      
      if (result.success) {
        onAuthenticationSuccess(result);
      } else {
        onAuthenticationError(result.error!);
        
        // Set field-specific errors based on error code
        if (result.error?.code === 'INVALID_CREDENTIALS') {
          setErrors({
            username: 'Invalid username or password',
            password: 'Invalid username or password'
          });
        } else if (result.error?.code === 'INVALID_ENVIRONMENT') {
          setErrors({
            environmentId: result.error.message
          });
        }
      }
    } catch (error) {
      const authError: AuthenticationError = {
        code: 'AUTHENTICATION_ERROR',
        message: 'Authentication request failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
        suggestedAction: 'Please check your network connection and try again'
      };
      
      onAuthenticationError(authError);
    } finally {
      setIsLoading(false);
    }
  }, [credentials, validateForm, onAuthenticationSuccess, onAuthenticationError]);



  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  return (
    <Layout.Container>
      <Layout.ContentWrapper>
        <Layout.MainCard>
          <Layout.StepHeader>
            <Layout.StepHeaderLeft>
              <Layout.VersionBadge>V6.0 - Service Architecture</Layout.VersionBadge>
              <Layout.StepHeaderTitle>PingOne Authentication</Layout.StepHeaderTitle>
              <Layout.StepHeaderSubtitle>Sign in to access MFA configuration</Layout.StepHeaderSubtitle>
            </Layout.StepHeaderLeft>
          </Layout.StepHeader>

          <Layout.StepContentWrapper>
            <Info.InfoBox $variant="info">
              <FiUser size={20} />
              <div>
                <Info.InfoTitle>PingOne Authentication Required</Info.InfoTitle>
                <Info.InfoText>
                  Please sign in with your PingOne credentials to access MFA device registration and management features.
                </Info.InfoText>
              </div>
            </Info.InfoBox>

            {showEnvironmentConfig && (
              <Collapsible.CollapsibleSection>
                <Collapsible.CollapsibleHeaderButton
                  onClick={() => toggleSection('environment')}
                  aria-expanded={!collapsedSections.environment}
                >
                  <Collapsible.CollapsibleTitle>
                    <FiGlobe /> Environment Configuration
                  </Collapsible.CollapsibleTitle>
                  <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.environment}>
                    <FiChevronDown />
                  </Collapsible.CollapsibleToggleIcon>
                </Collapsible.CollapsibleHeaderButton>
                {!collapsedSections.environment && (
                  <Collapsible.CollapsibleContent>
                    <ComprehensiveDiscoveryInput
                      onDiscoveryComplete={handleDiscoveryComplete}
                      initialInput={credentials.environmentId}
                      placeholder="Enter PingOne Environment ID or issuer URL..."
                      showProviderInfo={true}
                    />
                    
                    {environmentConfig && (
                      <Cards.GeneratedContentBox>
                        <Cards.GeneratedLabel>Environment Details</Cards.GeneratedLabel>
                        <Cards.ParameterGrid>
                          <Cards.ParameterLabel>Environment ID</Cards.ParameterLabel>
                          <Cards.ParameterValue>{environmentConfig.environmentId}</Cards.ParameterValue>
                          
                          <Cards.ParameterLabel>Region</Cards.ParameterLabel>
                          <Cards.ParameterValue>{environmentConfig.region}</Cards.ParameterValue>
                          
                          <Cards.ParameterLabel>Auth URL</Cards.ParameterLabel>
                          <Cards.ParameterValue>{environmentConfig.authUrl}</Cards.ParameterValue>
                          
                          <Cards.ParameterLabel>MFA API URL</Cards.ParameterLabel>
                          <Cards.ParameterValue>{environmentConfig.mfaUrl}</Cards.ParameterValue>
                        </Cards.ParameterGrid>
                      </Cards.GeneratedContentBox>
                    )}
                  </Collapsible.CollapsibleContent>
                )}
              </Collapsible.CollapsibleSection>
            )}

            <Collapsible.CollapsibleSection>
              <Collapsible.CollapsibleHeaderButton
                onClick={() => toggleSection('credentials')}
                aria-expanded={!collapsedSections.credentials}
              >
                <Collapsible.CollapsibleTitle>
                  <FiLock /> Login Credentials
                </Collapsible.CollapsibleTitle>
                <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.credentials}>
                  <FiChevronDown />
                </Collapsible.CollapsibleToggleIcon>
              </Collapsible.CollapsibleHeaderButton>
              {!collapsedSections.credentials && (
                <Collapsible.CollapsibleContent>
                  <form onSubmit={handleSubmit}>
                    <FormGroup>
                      <Label htmlFor="username">Username</Label>
                      <InputWrapper>
                        <InputIcon>
                          <FiUser size={16} />
                        </InputIcon>
                        <Input
                          ref={usernameRef}
                          id="username"
                          type="text"
                          value={credentials.username}
                          onChange={(e) => handleInputChange('username', e.target.value)}
                          placeholder="Enter your username"
                          $hasError={!!errors.username}
                          disabled={isLoading}
                          autoFocus={autoFocus && !hasInitialFocus}
                          autoComplete="username"
                          onFocus={() => setHasInitialFocus(true)}
                        />
                      </InputWrapper>
                      {errors.username && (
                        <ErrorText>
                          <FiAlertCircle size={12} />
                          {errors.username}
                        </ErrorText>
                      )}
                    </FormGroup>

                    <FormGroup>
                      <Label htmlFor="password">Password</Label>
                      <InputWrapper>
                        <InputIcon>
                          <FiLock size={16} />
                        </InputIcon>
                        <Input
                          ref={passwordRef}
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={credentials.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          placeholder="Enter your password"
                          $hasError={!!errors.password}
                          disabled={isLoading}
                          autoComplete="current-password"
                        />
                        <PasswordToggle
                          type="button"
                          onClick={togglePasswordVisibility}
                          disabled={isLoading}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                        </PasswordToggle>
                      </InputWrapper>
                      {errors.password && (
                        <ErrorText>
                          <FiAlertCircle size={12} />
                          {errors.password}
                        </ErrorText>
                      )}
                    </FormGroup>

                    {!showEnvironmentConfig && (
                      <FormGroup>
                        <Label htmlFor="environmentId">Environment ID</Label>
                        <InputWrapper>
                          <InputIcon>
                            <FiGlobe size={16} />
                          </InputIcon>
                          <Input
                            id="environmentId"
                            type="text"
                            value={credentials.environmentId}
                            onChange={(e) => handleInputChange('environmentId', e.target.value)}
                            placeholder="12345678-1234-1234-1234-123456789012"
                            $hasError={!!errors.environmentId}
                            disabled={isLoading}
                          />
                        </InputWrapper>
                        {errors.environmentId && (
                          <ErrorText>
                            <FiAlertCircle size={12} />
                            {errors.environmentId}
                          </ErrorText>
                        )}
                      </FormGroup>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '2rem' }}>
                      <Button
                        type="submit"
                        $variant="primary"
                        disabled={isLoading || !discoveryComplete}
                        $loading={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <FiLoader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                            Signing In...
                          </>
                        ) : (
                          <>
                            <FiLogIn size={16} />
                            Sign In
                          </>
                        )}
                      </Button>

                      {discoveryComplete && environmentConfig && (
                        <SuccessText>
                          <FiCheckCircle size={12} />
                          Environment configured
                        </SuccessText>
                      )}
                    </div>
                  </form>

                  {showEnvironmentConfig && !discoveryComplete && (
                    <Info.InfoBox $variant="warning" style={{ marginTop: '1rem' }}>
                      <FiAlertCircle size={20} />
                      <div>
                        <Info.InfoTitle>Environment Configuration Required</Info.InfoTitle>
                        <Info.InfoText>
                          Please configure your PingOne environment above before signing in.
                        </Info.InfoText>
                      </div>
                    </Info.InfoBox>
                  )}
                </Collapsible.CollapsibleContent>
              )}
            </Collapsible.CollapsibleSection>

            <Info.InfoBox $variant="info">
              <FiUser size={20} />
              <div>
                <Info.InfoTitle>Authentication Flow</Info.InfoTitle>
                <Info.InfoText>
                  After successful authentication, you'll be able to register and manage MFA devices including:
                </Info.InfoText>
                <Info.InfoList>
                  <li>Email and SMS verification</li>
                  <li>TOTP authenticator apps with QR codes</li>
                  <li>FIDO security keys and biometric authentication</li>
                  <li>Complete MFA challenge flows</li>
                </Info.InfoList>
              </div>
            </Info.InfoBox>
          </Layout.StepContentWrapper>
        </Layout.MainCard>
      </Layout.ContentWrapper>
    </Layout.Container>
  );
};

export default PingOneLoginFormV6;