// src/pages/PingOneAuthentication.tsx
// Dedicated PingOne Authentication Page with inline and popup options

import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import {
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiArrowRight,
  FiRefreshCw,
  FiX,
  FiMaximize2,
  FiMinimize2,
} from 'react-icons/fi';
import { v4ToastManager } from '../utils/v4ToastManager';
import { FlowHeader } from '../services/flowHeaderService';
import { AuthenticationModalService } from '../services/authenticationModalService';
import LoginSuccessModal from '../components/LoginSuccessModal';

interface AuthenticationCredentials {
  username: string;
  password: string;
  environmentId: string;
}

interface PingOneAuthenticationProps {
  onAuthenticate?: (credentials: AuthenticationCredentials) => Promise<void>;
  onCancel?: () => void;
  mode?: 'inline' | 'popup';
  showModeSelector?: boolean;
}

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const AuthCard = styled.div<{ $mode: 'inline' | 'popup' }>`
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 100%;
  max-width: ${props => props.$mode === 'popup' ? '400px' : '500px'};
  overflow: hidden;
  position: relative;
`;

const AuthHeader = styled.div`
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const AuthTitle = styled.h1`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
`;

const AuthSubtitle = styled.p`
  font-size: 0.875rem;
  opacity: 0.9;
  margin: 0.25rem 0 0 0;
`;

const AuthBody = styled.div`
  padding: 2rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
`;

const InputContainer = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background: white;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
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
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #374151;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 2rem;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;

  ${props => props.$variant === 'primary' ? `
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    color: white;
    
    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
      transform: translateY(-1px);
    }
  ` : `
    background: #f3f4f6;
    color: #374151;
    
    &:hover:not(:disabled) {
      background: #e5e7eb;
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const SpinningIcon = styled.div`
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ModeSelector = styled.div`
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
`;

const ModeTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.75rem 0;
`;

const ModeOptions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ModeOption = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 0.75rem;
  border: 2px solid ${props => props.$active ? '#3b82f6' : '#e5e7eb'};
  border-radius: 6px;
  background: ${props => props.$active ? '#eff6ff' : 'white'};
  color: ${props => props.$active ? '#1d4ed8' : '#6b7280'};
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    border-color: #3b82f6;
    background: #eff6ff;
    color: #1d4ed8;
  }
`;

const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
`;

const PopupCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  width: 100%;
  max-width: 400px;
  position: relative;
  animation: popupIn 0.3s ease-out;
  
  @keyframes popupIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
`;

const PopupHeader = styled.div`
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const PingOneAuthentication: React.FC<PingOneAuthenticationProps> = ({
  onAuthenticate,
  onCancel,
  mode = 'inline',
  showModeSelector = true,
}) => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<AuthenticationCredentials>({
    username: '',
    password: '',
    environmentId: 'b9817c16-9910-4415-b67e-4ac687da74d9', // Default environment ID
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [authMode, setAuthMode] = useState<'inline' | 'popup'>(mode);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [authUrl, setAuthUrl] = useState<string>('');

  const handleInputChange = useCallback((field: keyof AuthenticationCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSaveCredentials = useCallback(async () => {
    setIsSaving(true);
    try {
      // Save credentials to localStorage
      localStorage.setItem('pingone_auth_credentials', JSON.stringify(credentials));
      v4ToastManager.showSuccess('Credentials saved successfully');
    } catch (error) {
      console.error('Failed to save credentials:', error);
      v4ToastManager.showError('Failed to save credentials');
    } finally {
      setIsSaving(false);
    }
  }, [credentials]);

  const handleAuthenticate = useCallback(async () => {
    if (!credentials.username || !credentials.password) {
      v4ToastManager.showError('Please enter username and password');
      return;
    }

    // Generate a mock authorization URL for demonstration
    const mockAuthUrl = `https://auth.pingone.com/${credentials.environmentId}/as/authorize?` +
      `client_id=your-client-id&` +
      `response_type=code&` +
      `scope=openid+profile+email&` +
      `redirect_uri=${encodeURIComponent('https://localhost:3000/authz-callback')}&` +
      `state=pingone-auth-${Date.now()}`;

    setAuthUrl(mockAuthUrl);
    setShowRedirectModal(true);
  }, [credentials]);

  const handleConfirmRedirect = useCallback(async () => {
    setShowRedirectModal(false);
    setIsLoading(true);
    
    try {
      if (onAuthenticate) {
        await onAuthenticate(credentials);
      } else {
        // Simulate authentication process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Show success modal
        setShowSuccessModal(true);
        v4ToastManager.showSuccess('Authentication successful!');
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      v4ToastManager.showError('Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  }, [credentials, onAuthenticate]);

  const handleSuccessModalClose = useCallback(() => {
    setShowSuccessModal(false);
    // Navigate to MFA flow after successful authentication
    navigate('/flows/pingone-complete-mfa-v7');
  }, [navigate]);

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(-1);
    }
  }, [onCancel, navigate]);

  const renderAuthForm = () => (
    <>
      {showModeSelector && (
        <ModeSelector>
          <ModeTitle>Authentication Mode</ModeTitle>
          <ModeOptions>
            <ModeOption
              $active={authMode === 'inline'}
              onClick={() => setAuthMode('inline')}
            >
              <FiMaximize2 size={16} />
              Inline
            </ModeOption>
            <ModeOption
              $active={authMode === 'popup'}
              onClick={() => setAuthMode('popup')}
            >
              <FiMinimize2 size={16} />
              Popup
            </ModeOption>
          </ModeOptions>
        </ModeSelector>
      )}

      <FormGroup>
        <Label>Username *</Label>
        <InputContainer>
          <Input
            type="text"
            placeholder="Enter your username"
            value={credentials.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
          />
        </InputContainer>
      </FormGroup>

      <FormGroup>
        <Label>Password *</Label>
        <InputContainer>
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={credentials.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
          />
          <PasswordToggle
            type="button"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </PasswordToggle>
        </InputContainer>
      </FormGroup>

      <FormGroup>
        <Label>Environment ID</Label>
        <Input
          type="text"
          placeholder="Enter environment ID"
          value={credentials.environmentId}
          onChange={(e) => handleInputChange('environmentId', e.target.value)}
        />
      </FormGroup>

      <ButtonGroup>
        <Button
          type="button"
          onClick={handleSaveCredentials}
          disabled={isSaving}
        >
          {isSaving ? <SpinningIcon><FiRefreshCw /></SpinningIcon> : <FiCheck />}
          {isSaving ? 'Saving…' : 'Save Credentials'}
        </Button>

        <Button
          type="button"
          $variant="primary"
          onClick={handleAuthenticate}
          disabled={isLoading || !credentials.username || !credentials.password}
        >
          {isLoading ? <SpinningIcon><FiRefreshCw /></SpinningIcon> : <FiArrowRight />}
          {isLoading ? 'Authenticating…' : 'Authenticate'}
        </Button>
      </ButtonGroup>
    </>
  );

  if (authMode === 'popup') {
    return (
      <PopupOverlay>
        <PopupCard>
          <PopupHeader>
            <div>
              <AuthTitle>User Authentication</AuthTitle>
              <AuthSubtitle>Enter your username and password to authenticate</AuthSubtitle>
            </div>
            <CloseButton onClick={handleCancel}>
              <FiX size={20} />
            </CloseButton>
          </PopupHeader>
          <AuthBody>
            {renderAuthForm()}
          </AuthBody>
        </PopupCard>
      </PopupOverlay>
    );
  }

  return (
    <PageContainer>
      <AuthCard $mode={authMode}>
        <AuthHeader>
          <FiUser size={24} />
          <div>
            <AuthTitle>User Authentication</AuthTitle>
            <AuthSubtitle>Enter your username and password to authenticate</AuthSubtitle>
          </div>
        </AuthHeader>
        <AuthBody>
          {renderAuthForm()}
        </AuthBody>
      </AuthCard>

      {/* Authentication Modal - Before redirect */}
      {AuthenticationModalService.showModal(
        showRedirectModal,
        () => setShowRedirectModal(false),
        handleConfirmRedirect,
        authUrl,
        'pingone',
        'PingOne Authentication',
        {
          description: 'You\'re about to be redirected to PingOne for authentication. This will open in a new window for secure authentication.',
          redirectMode: authMode === 'popup' ? 'popup' : 'redirect'
        }
      )}

      {/* Success Modal - After authentication */}
      <LoginSuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="🎉 Authentication Successful!"
        message="You have been successfully authenticated with PingOne. You can now proceed to the MFA flow to complete your authentication setup."
        autoCloseDelay={5000}
      />
    </PageContainer>
  );
};

export default PingOneAuthentication;
