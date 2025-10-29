import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FiEye, FiEyeOff } from 'react-icons/fi';

// HEB Brand Colors
const HEB_COLORS = {
  red: '#E31837',
  darkRed: '#C41E3A',
  blue: '#0066CC',
  darkBlue: '#004499',
  green: '#00A651',
  darkGreen: '#008A42',
  yellow: '#FFD700',
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  darkGray: '#333333',
  black: '#000000'
};

const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
`;

const PopupContainer = styled.div`
  background: ${HEB_COLORS.white};
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 420px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  color: ${HEB_COLORS.darkGray};
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${HEB_COLORS.lightGray};
  }
`;

const CancelLink = styled.button`
  background: none;
  border: none;
  color: ${HEB_COLORS.blue};
  font-size: 14px;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
  margin-top: 12px;
  align-self: center;

  &:hover {
    color: ${HEB_COLORS.darkBlue};
  }
`;

const Header = styled.div`
  background: linear-gradient(135deg, ${HEB_COLORS.red} 0%, ${HEB_COLORS.darkRed} 100%);
  padding: 24px 24px 20px;
  border-radius: 12px 12px 0 0;
  text-align: center;
  position: relative;
`;

const HEBLogo = styled.div`
  font-size: 32px;
  font-weight: bold;
  color: ${HEB_COLORS.white};
  margin-bottom: 8px;
  letter-spacing: 2px;
`;

const Subtitle = styled.div`
  font-size: 14px;
  color: ${HEB_COLORS.white};
  opacity: 0.9;
  font-weight: 500;
`;

const Content = styled.div`
  padding: 32px 24px 24px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: ${HEB_COLORS.darkGray};
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 2px solid #E5E5E5;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  background: ${HEB_COLORS.white};

  &:focus {
    outline: none;
    border-color: ${HEB_COLORS.blue};
    box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
  }

  &::placeholder {
    color: #999;
  }
`;

const PasswordInput = styled(Input)`
  padding-right: 44px;
`;

const PasswordFieldWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const PasswordToggleButton = styled.button`
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  background: none;
  border: none;
  cursor: pointer;
  padding: 12px 14px;
  color: ${HEB_COLORS.darkGray};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border-radius: 0 8px 8px 0;

  &:hover {
    background-color: #F0F0F0;
    color: ${HEB_COLORS.blue};
  }

  &:active {
    background-color: #E5E5E5;
  }
`;

const LoginButton = styled.button`
  background: linear-gradient(135deg, ${HEB_COLORS.green} 0%, ${HEB_COLORS.darkGreen} 100%);
  color: ${HEB_COLORS.white};
  border: none;
  padding: 14px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 166, 81, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Footer = styled.div`
  padding: 16px 24px 24px;
  text-align: center;
  border-top: 1px solid #E5E5E5;
  background: ${HEB_COLORS.lightGray};
  border-radius: 0 0 12px 12px;
`;

const FooterText = styled.div`
  font-size: 12px;
  color: ${HEB_COLORS.darkGray};
  line-height: 1.4;
`;

const ErrorMessage = styled.div`
  background: #FEF2F2;
  border: 1px solid #FECACA;
  color: #DC2626;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid ${HEB_COLORS.white};
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s ease-in-out infinite;
  margin-right: 8px;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export interface HEBLoginCredentials {
  username: string;
  password: string;
}

export interface HEBLoginPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (credentials: HEBLoginCredentials) => Promise<void>;
  title?: string;
  subtitle?: string;
}

export const HEBLoginPopup: React.FC<HEBLoginPopupProps> = ({
  isOpen,
  onClose,
  onLogin,
  title = "HEB",
  subtitle = "Sign in to your account"
}) => {
  const DEFAULT_USERNAME = 'curtis7';
  const DEFAULT_PASSWORD = 'Wolverine7&';

  const [username, setUsername] = useState(DEFAULT_USERNAME);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);

  // Focus username field when popup opens
  useEffect(() => {
    if (isOpen && usernameRef.current) {
      setTimeout(() => usernameRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset form when popup closes
  useEffect(() => {
    if (!isOpen) {
      setUsername(DEFAULT_USERNAME);
      setPassword(DEFAULT_PASSWORD);
      setError(null);
      setIsLoading(false);
      setShowPassword(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onLogin({ username: username.trim(), password });
      // Success - the parent component will handle closing
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <PopupOverlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <PopupContainer onKeyDown={handleKeyDown}>
        <CloseButton onClick={onClose} aria-label="Close">
          ×
        </CloseButton>
        
        <Header>
          <HEBLogo>{title}</HEBLogo>
          <Subtitle>{subtitle}</Subtitle>
        </Header>

        <Content>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <Form onSubmit={handleSubmit}>
            <InputGroup>
              <Label htmlFor="heb-username">Username or Email</Label>
              <Input
                id="heb-username"
                ref={usernameRef}
                type="text"
                placeholder="Enter your username or email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
              />
            </InputGroup>

            <InputGroup>
              <Label htmlFor="heb-password">Password</Label>
              <PasswordFieldWrapper>
                <PasswordInput
                  id="heb-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <PasswordToggleButton
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </PasswordToggleButton>
              </PasswordFieldWrapper>
            </InputGroup>

            <LoginButton type="submit" disabled={isLoading}>
              {isLoading && <LoadingSpinner />}
              {isLoading ? 'Signing In...' : 'Sign In'}
            </LoginButton>
            <CancelLink type="button" onClick={onClose}>
              Cancel
            </CancelLink>
          </Form>
        </Content>

        <Footer>
          <FooterText>
            This is a demo login page for testing purposes.<br />
            Your credentials are used for OAuth flow demonstration only.
          </FooterText>
        </Footer>
      </PopupContainer>
    </PopupOverlay>
  );
};

export default HEBLoginPopup;
