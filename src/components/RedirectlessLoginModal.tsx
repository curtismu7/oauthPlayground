import { FiLoader, FiLock, FiUser } from '@icons';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { ButtonSpinner } from '@/components/ui/ButtonSpinner';

import { logger } from '../utils/logger';

interface RedirectlessLoginModalProps {
	isOpen: boolean;
	onClose: () => void;
	onLogin: (username: string, password: string) => Promise<void>;
	title?: string;
	subtitle?: string;
	isLoading?: boolean;
	error?: string | null;
}

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(2px);
  display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: V9_COLORS.TEXT.WHITE;
  border-radius: 12px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
  width: 100%;
  max-width: 450px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
`;

const ModalHeader = styled.div`
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  text-align: center;
  background: linear-gradient(135deg, V9_COLORS.BG.WARNING 0%, V9_COLORS.BG.WARNING_BORDER 100%);
  border-radius: 12px 12px 0 0;
  position: relative;

  .close-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    font-size: 1.25rem;
    color: V9_COLORS.TEXT.GRAY_MEDIUM;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.375rem;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background-color: rgba(0, 0, 0, 0.1);
      color: V9_COLORS.TEXT.GRAY_DARK;
    }
  }

  h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: V9_COLORS.TEXT.GRAY_DARK;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  p {
    margin: 0;
    color: V9_COLORS.TEXT.GRAY_MEDIUM;
    font-size: 0.95rem;
    line-height: 1.4;
  }
`;

const IconBadge = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: V9_COLORS.PRIMARY.YELLOW;
  color: white;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
`;

const ModalBody = styled.div`
  padding: 2rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: V9_COLORS.TEXT.GRAY_DARK;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const InputContainer = styled.div`
  position: relative;
  
  .input-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: V9_COLORS.TEXT.GRAY_LIGHT;
    width: 1.125rem;
    height: 1.125rem;
    z-index: 1;
  }
  
  .toggle-password {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: V9_COLORS.TEXT.GRAY_LIGHT;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    
    &:hover {
      color: V9_COLORS.TEXT.GRAY_MEDIUM;
      background-color: #f3f4f6;
    }
  }
`;

const StyledInput = styled.input<{ $hasIcon?: boolean; $hasToggle?: boolean }>`
  width: 100%;
  padding: 0.875rem;
  padding-left: ${({ $hasIcon }) => ($hasIcon ? '2.75rem' : '0.875rem')};
  padding-right: ${({ $hasToggle }) => ($hasToggle ? '2.75rem' : '0.875rem')};
  font-size: 1rem;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 8px;
  transition: all 0.15s ease-in-out;
  background-color: V9_COLORS.TEXT.WHITE;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: V9_COLORS.PRIMARY.YELLOW;
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
  }

  &::placeholder {
    color: V9_COLORS.TEXT.GRAY_LIGHT;
  }

  &.is-invalid {
    border-color: V9_COLORS.PRIMARY.RED;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }
`;

const ErrorMessage = styled.div`
  margin-top: 0.5rem;
  padding: 0.75rem;
  background-color: V9_COLORS.BG.ERROR;
  border: 1px solid V9_COLORS.BG.ERROR_BORDER;
  border-radius: 6px;
  color: V9_COLORS.PRIMARY.RED_DARK;
  font-size: 0.875rem;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  
  svg {
    flex-shrink: 0;
    margin-top: 0.125rem;
  }
`;

const ModalFooter = styled.div`
  padding: 1rem 2rem 2rem;
  border-top: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
`;

const LoginButton = styled.button<{ $isLoading?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, V9_COLORS.PRIMARY.YELLOW 0%, V9_COLORS.PRIMARY.YELLOW_DARK 100%);
  border: none;
  border-radius: 8px;
  cursor: ${({ $isLoading }) => ($isLoading ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease-in-out;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
  opacity: ${({ $isLoading }) => ($isLoading ? 0.7 : 1)};
  min-width: 140px;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, V9_COLORS.PRIMARY.YELLOW_DARK 0%, #b45309 100%);
    box-shadow: 0 6px 16px rgba(245, 158, 11, 0.35);
    transform: translateY(-1px);
  }

  &:disabled {
    cursor: not-allowed;
  }

  svg {
    width: 1rem;
    height: 1rem;
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const CancelButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  background-color: V9_COLORS.TEXT.WHITE;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: #f9fafb;
    border-color: V9_COLORS.TEXT.GRAY_LIGHT;
    color: V9_COLORS.TEXT.GRAY_DARK;
  }
`;

const SecurityNote = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, V9_COLORS.BG.GRAY_LIGHT 0%, #dbeafe 100%);
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 8px;
  font-size: 0.8rem;
  color: V9_COLORS.PRIMARY.BLUE_DARK;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  
  svg {
    flex-shrink: 0;
    margin-top: 0.125rem;
  }
`;

const RedirectlessLoginModal: React.FC<RedirectlessLoginModalProps> = ({
	isOpen,
	onClose,
	onLogin,
	title = 'PingOne Authentication',
	subtitle = 'Enter your credentials to continue with redirectless authentication',
	isLoading = false,
	error = null,
}) => {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [validationError, setValidationError] = useState<string | null>(null);

	// Reset form when modal opens/closes
	useEffect(() => {
		if (isOpen) {
			setUsername('');
			setPassword('');
			setShowPassword(false);
			setValidationError(null);
		}
	}, [isOpen]);

	// Clear validation error when user types
	useEffect(() => {
		if (validationError && (username || password)) {
			setValidationError(null);
		}
	}, [username, password, validationError]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Client-side validation
		if (!username.trim()) {
			setValidationError('Username is required');
			return;
		}
		if (!password.trim()) {
			setValidationError('Password is required');
			return;
		}

		try {
			await onLogin(username.trim(), password);
		} catch (err) {
			// Error will be handled by parent component
			logger.error('RedirectlessLoginModal', 'Login failed:', undefined, err as Error);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Escape') {
			onClose();
		}
	};

	if (!isOpen) return null;

	const displayError = error || validationError;

	return (
		<ModalOverlay $isOpen={isOpen} onKeyDown={handleKeyDown}>
			<ModalContent onClick={(e) => e.stopPropagation()}>
				<ModalHeader>
					<ButtonSpinner
						loading={false}
						onClick={onClose}
						disabled={isLoading}
						spinnerSize={10}
						spinnerPosition="left"
						loadingText="Closing..."
						className="close-button"
					>
						<span>❌</span>
					</ButtonSpinner>
					<IconBadge>
						<span>🛡️</span>
					</IconBadge>
					<h2>{title}</h2>
					<p>{subtitle}</p>
				</ModalHeader>

				<form onSubmit={handleSubmit}>
					<ModalBody>
						<FormGroup>
							<label htmlFor="username">
								<span style={{ fontSize: '14px' }}>👤</span>
								Username
							</label>
							<InputContainer>
								<FiUser className="input-icon" />
								<StyledInput
									id="username"
									type="text"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									placeholder="Enter your PingOne username"
									disabled={isLoading}
									$hasIcon
									className={displayError && !username.trim() ? 'is-invalid' : ''}
									autoComplete="username"
									autoFocus
								/>
							</InputContainer>
						</FormGroup>

						<FormGroup>
							<label htmlFor="password">
								<span style={{ fontSize: '14px' }}>🔒</span>
								Password
							</label>
							<InputContainer>
								<FiLock className="input-icon" />
								<StyledInput
									id="password"
									type={showPassword ? 'text' : 'password'}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="Enter your PingOne password"
									disabled={isLoading}
									$hasIcon
									$hasToggle
									className={displayError && !password.trim() ? 'is-invalid' : ''}
									autoComplete="current-password"
								/>
								<ButtonSpinner
									loading={false}
									onClick={() => setShowPassword(!showPassword)}
									disabled={isLoading}
									spinnerSize={10}
									spinnerPosition="left"
									loadingText="Toggling..."
									className="toggle-password"
								>
									{showPassword ? (
										<span style={{ fontSize: '16px' }}>🙈</span>
									) : (
										<span style={{ fontSize: '16px' }}>👁️</span>
									)}
								</ButtonSpinner>
							</InputContainer>
						</FormGroup>

						{displayError && (
							<ErrorMessage>
								<span style={{ fontSize: '16px' }}>❌</span>
								<span>{displayError}</span>
							</ErrorMessage>
						)}

						<SecurityNote>
							<span style={{ fontSize: '14px' }}>🛡️</span>
							<span>
								Your credentials are sent securely to PingOne via HTTPS. This app does not store
								your password.
							</span>
						</SecurityNote>
					</ModalBody>

					<ModalFooter>
						<CancelButton type="button" onClick={onClose} disabled={isLoading}>
							Cancel
						</CancelButton>
						<LoginButton type="submit" disabled={isLoading} $isLoading={isLoading}>
							{isLoading ? (
								<>
									<FiLoader className="animate-spin" />
									Authenticating...
								</>
							) : (
								<>
									<span>🛡️</span>
									Sign In
								</>
							)}
						</LoginButton>
					</ModalFooter>
				</form>
			</ModalContent>
		</ModalOverlay>
	);
};

export default RedirectlessLoginModal;
