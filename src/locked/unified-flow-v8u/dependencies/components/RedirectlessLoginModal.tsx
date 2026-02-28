import React, { useEffect, useState } from 'react';
import { FiEye, FiEyeOff, FiLoader, FiLock, FiShield, FiUser, FiX } from '@icons';
import styled from 'styled-components';

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
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
  width: 100%;
  max-width: 450px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid #e5e7eb;
`;

const ModalHeader = styled.div`
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  text-align: center;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 12px 12px 0 0;
  position: relative;

  .close-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    font-size: 1.25rem;
    color: #6b7280;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.375rem;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background-color: rgba(0, 0, 0, 0.1);
      color: #374151;
    }
  }

  h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  p {
    margin: 0;
    color: #6b7280;
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
  background: #f59e0b;
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
    color: #374151;
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
    color: #9ca3af;
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
    color: #9ca3af;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    
    &:hover {
      color: #6b7280;
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
  border: 1px solid #d1d5db;
  border-radius: 8px;
  transition: all 0.15s ease-in-out;
  background-color: #ffffff;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #f59e0b;
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }

  &.is-invalid {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }
`;

const ErrorMessage = styled.div`
  margin-top: 0.5rem;
  padding: 0.75rem;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
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
  border-top: 1px solid #e5e7eb;
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
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: none;
  border-radius: 8px;
  cursor: ${({ $isLoading }) => ($isLoading ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease-in-out;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
  opacity: ${({ $isLoading }) => ($isLoading ? 0.7 : 1)};
  min-width: 140px;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
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
  color: #6b7280;
  background-color: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: #f9fafb;
    border-color: #9ca3af;
    color: #374151;
  }
`;

const SecurityNote = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  font-size: 0.8rem;
  color: #1e40af;
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
			console.error('Login failed:', err);
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
					<button className="close-button" onClick={onClose} disabled={isLoading}>
						<FiX />
					</button>
					<IconBadge>
						<FiShield />
					</IconBadge>
					<h2>{title}</h2>
					<p>{subtitle}</p>
				</ModalHeader>

				<form onSubmit={handleSubmit}>
					<ModalBody>
						<FormGroup>
							<label htmlFor="username">
								<FiUser size={14} />
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
								<FiLock size={14} />
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
								<button
									type="button"
									className="toggle-password"
									onClick={() => setShowPassword(!showPassword)}
									disabled={isLoading}
								>
									{showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
								</button>
							</InputContainer>
						</FormGroup>

						{displayError && (
							<ErrorMessage>
								<FiX size={16} />
								<span>{displayError}</span>
							</ErrorMessage>
						)}

						<SecurityNote>
							<FiShield size={14} />
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
									<FiShield />
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
