/**
 * @file SouthwestAirlinesLoginForm.tsx
 * @module protect-portal/components
 * @description Southwest Airlines specific login form with authentic button styling
 * @version 9.6.5
 * @since 2026-02-11
 *
 * This component provides a Southwest Airlines-specific login form that matches
 * their actual login experience with distinctive button styling and brand colors.
 */

import React, { useCallback, useState } from 'react';
import {
	FiAlertTriangle,
	FiEye,
	FiEyeOff,
	FiLock as FiLockIcon,
	FiLockIcon
} from 'react-icons/fi';
import styled from 'styled-components';
import { ButtonSpinner } from '../../../components/ui/ButtonSpinner';
import PingOneLoginService from '../services/pingOneLoginService';
import type { LoginContext, PortalError, UserContext } from '../types/protectPortal.types';
import CompanyLogoHeader from './CompanyLogoHeader';

// ============================================================================
// PKCE HELPER FUNCTIONS
// ============================================================================

const generateCodeVerifier = (): string => {
	const array = new Uint8Array(32);
	const randomValues = crypto.getRandomValues(array);
	return Array.from(randomValues, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const LoginContainer = styled.div`
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
`;

const FormTitle = styled.h2`
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--brand-text);
  margin: 0 0 1rem 0;
  text-align: center;
  font-family: var(--brand-heading-font);
`;

const FormDescription = styled.p`
  font-size: 1rem;
  color: var(--brand-text-secondary);
  margin: 0 0 2rem 0;
  text-align: center;
  line-height: 1.6;
  font-family: var(--brand-body-font);
`;

const Form = styled.form`
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
  font-weight: 500;
  color: var(--brand-text);
  margin-bottom: 0.5rem;
  font-family: var(--brand-body-font);
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  background: white;
  border: 2px solid var(--brand-text-secondary);
  border-radius: var(--brand-radius-md);
  font-size: 1rem;
  color: var(--brand-text);
  transition: var(--brand-transition);
  font-family: var(--brand-body-font);

  &:focus {
    outline: none;
    border-color: var(--brand-primary);
    box-shadow: var(--brand-shadow-md);
  }

  &:invalid {
    border-color: var(--brand-error);
  }

  &::placeholder {
    color: var(--brand-text-secondary);
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--brand-text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: var(--brand-radius-xs);
  transition: var(--brand-transition);

  &:hover {
    color: var(--brand-text);
  }

  &:focus {
    outline: none;
    color: var(--brand-primary);
  }
`;

const ErrorMessage = styled.div`
  background: var(--brand-error-light);
  border: 1px solid var(--brand-error);
  border-radius: var(--brand-radius-sm);
  padding: 1rem;
  color: var(--brand-error);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-family: var(--brand-body-font);
`;

// Southwest Airlines specific button styling
const SouthwestLoginButton = styled.button`
  background: #E51D23; /* Southwest Heart Red */
  color: white;
  border: none;
  border-radius: 8px;
  padding: 1rem 2rem;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Benton Sans', 'Helvetica Neue', Arial, sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 6px rgba(229, 29, 35, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 56px;
  position: relative;
  overflow: hidden;

  &:hover {
    background: #C41824; /* Darker red on hover */
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(229, 29, 35, 0.3);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 4px rgba(229, 29, 35, 0.3), 0 4px 6px rgba(229, 29, 35, 0.2);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(229, 29, 35, 0.2);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 2px 4px rgba(229, 29, 35, 0.1);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s;
  }

  &:hover::before {
    left: 100%;
  }
`;

const SouthwestIcon = styled.div`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
`;

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface SouthwestAirlinesLoginFormProps {
	onLoginSuccess: (userContext: UserContext, loginContext: LoginContext) => void;
	onError: (error: PortalError) => void;
	environmentId: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const SouthwestAirlinesLoginForm: React.FC<SouthwestAirlinesLoginFormProps> = ({
	onLoginSuccess,
	onError,
	environmentId,
	clientId,
	clientSecret,
	redirectUri,
}) => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);

	// Form state
	const [formData, setFormData] = useState({
		username: '',
		password: '',
	});

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const { name, value } = e.target;
			setFormData((prev) => ({ ...prev, [name]: value }));
			if (error) setError(null);
		},
		[error]
	);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			setIsLoading(true);
			setError(null);

			try {
				// Validate form
				if (!formData.username.trim()) {
					throw new Error('Please enter your username or email');
				}

				if (!formData.password.trim()) {
					throw new Error('Please enter your password');
				}

				// Generate PKCE parameters
				const codeVerifier = generateCodeVerifier();

				// Initialize PingOne embedded login
				const loginResult = await PingOneLoginService.initializeEmbeddedLogin(
					environmentId,
					clientId,
					redirectUri
				);

				if (loginResult.success && loginResult.data) {
					// Submit credentials to PingOne
					const submitResult = await PingOneLoginService.submitCredentials(
						loginResult.data.flowId,
						formData.username,
						formData.password
					);

					if (submitResult.success && submitResult.data) {
						// Resume flow to get authorization code
						const resumeResult = await PingOneLoginService.resumeFlow(loginResult.data.flowId);

						if (resumeResult.success && resumeResult.data) {
							// Exchange code for tokens
							const tokenResult = await PingOneLoginService.exchangeCodeForTokens(
								environmentId,
								clientId,
								clientSecret,
								redirectUri,
								resumeResult.data.authorizationCode,
								codeVerifier
							);

							if (tokenResult.success && tokenResult.data) {
								// Create user context and login context
								const userContext: UserContext = {
									id: formData.username,
									email: formData.username.includes('@')
										? formData.username
										: `${formData.username}@southwest.com`,
									name: formData.username,
									username: formData.username,
									type: 'PING_ONE',
								};

								const loginContext: LoginContext = {
									timestamp: new Date().toISOString(),
									ipAddress: '127.0.0.1', // This would be populated from request
									userAgent: navigator.userAgent,
									origin: window.location.origin,
									flowType: 'AUTHENTICATION',
									flowSubtype: 'CUSTOM_LOGIN',
								};

								onLoginSuccess(userContext, loginContext);
							} else {
								throw new Error(tokenResult.error?.message || 'Failed to exchange tokens');
							}
						} else {
							throw new Error(resumeResult.error?.message || 'Failed to complete login');
						}
					} else {
						throw new Error(submitResult.error?.message || 'Invalid credentials');
					}
				} else {
					throw new Error(loginResult.error?.message || 'Failed to initialize login');
				}
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Login failed';
				setError(errorMessage);
				onError({
					message: errorMessage,
					code: 'AUTHENTICATION_ERROR',
					recoverable: true,
					suggestedAction: 'Please check your credentials and try again.',
				});
			} finally {
				setIsLoading(false);
			}
		},
		[formData, environmentId, clientId, clientSecret, redirectUri, onLoginSuccess, onError]
	);

	const togglePasswordVisibility = useCallback(() => {
		setShowPassword((prev) => !prev);
	}, []);

	return (
		<LoginContainer>
			<CompanyLogoHeader size="large" showTagline={false} />

			<FormTitle>Sign In to Southwest</FormTitle>

			<FormDescription>
				Access your Southwest Airlines account to manage bookings, check in, and more.
			</FormDescription>

			{error && (
				<ErrorMessage>
					<FiAlertTriangle />
					{error}
				</ErrorMessage>
			)}

			<Form onSubmit={handleSubmit}>
				<InputLabel>Username or Email</InputLabel>
				<InputGroup>
					<StyledInput
						type="text"
						name="username"
						value={formData.username}
						onChange={handleInputChange}
						placeholder="Enter your username or email"
						autoFocus
						required
						disabled={isLoading}
					/>
				</InputGroup>

				<InputLabel>Password</InputLabel>
				<InputGroup>
					<StyledInput
						type={showPassword ? 'text' : 'password'}
						name="password"
						value={formData.password}
						onChange={handleInputChange}
						placeholder="Enter your password"
						required
						disabled={isLoading}
					/>
					<PasswordToggle type="button" onClick={togglePasswordVisibility} disabled={isLoading}>
						{showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
					</PasswordToggle>
				</InputGroup>

				<SouthwestLoginButton type="submit" disabled={isLoading}>
					{isLoading ? (
						<ButtonSpinner loading={true} spinnerSize={20}>
							Signing In...
						</ButtonSpinner>
					) : (
						<>
							<SouthwestIcon>
								<FiLockIcon />
							</SouthwestIcon>
							Sign In
						</>
					)}
				</SouthwestLoginButton>
			</Form>
		</LoginContainer>
	);
};

export default SouthwestAirlinesLoginForm;
