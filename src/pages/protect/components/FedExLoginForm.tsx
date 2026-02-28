/**
 * @file FedExLoginForm.tsx
 * @module protect-portal/components
 * @description FedEx specific login form with authentic button styling
 * @version 9.6.5
 * @since 2026-02-11
 *
 * This component provides a FedEx-specific login form that matches
 * their actual secure login experience with distinctive button styling and brand colors.
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
  max-width: 400px;
`;

const FormTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333333; /* Dark gray for secure login */
  margin: 0 0 1rem 0;
  text-align: center;
  font-family: 'Helvetica Neue', Arial, sans-serif;
`;

const FormDescription = styled.p`
  font-size: 0.875rem;
  color: #666666; /* Medium gray */
  margin: 0 0 2rem 0;
  text-align: center;
  line-height: 1.5;
  font-family: 'Helvetica Neue', Arial, sans-serif;
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
  color: #333333; /* Dark gray */
  margin-bottom: 0.5rem;
  font-family: 'Helvetica Neue', Arial, sans-serif;
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #CCCCCC; /* Light gray border */
  border-radius: 4px;
  font-size: 1rem;
  color: #333333; /* Dark gray text */
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: 'Helvetica Neue', Arial, sans-serif;

  &:focus {
    outline: none;
    border-color: #4D148C; /* FedEx purple on focus */
    box-shadow: 0 0 0 2px rgba(77, 20, 140, 0.1);
  }

  &:invalid {
    border-color: #CC0000; /* Red for errors */
  }

  &::placeholder {
    color: #999999; /* Light gray placeholder */
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #666666; /* Medium gray */
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 2px;
  transition: color 0.2s;

  &:hover {
    color: #4D148C; /* FedEx purple on hover */
  }

  &:focus {
    outline: none;
    color: #4D148C; /* FedEx purple on focus */
  }
`;

const ErrorMessage = styled.div`
  background: #FFF8F8; /* Very light red background */
  border: 1px solid #FFCCCC; /* Light red border */
  border-radius: 4px;
  padding: 0.75rem;
  color: #CC0000; /* Red text */
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-family: 'Helvetica Neue', Arial, sans-serif;
`;

// FedEx specific button styling
const FedExLoginButton = styled.button`
  background: #4D148C; /* FedEx Purple */
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  text-transform: none;
  letter-spacing: normal;
  box-shadow: 0 2px 4px rgba(77, 20, 140, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 48px;
  position: relative;
  overflow: hidden;

  &:hover {
    background: #3A0F66; /* Darker purple on hover */
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(77, 20, 140, 0.3);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(77, 20, 140, 0.3), 0 2px 4px rgba(77, 20, 140, 0.2);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(77, 20, 140, 0.2);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 1px 2px rgba(77, 20, 140, 0.1);
  }
`;

const FedExIcon = styled.div`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1rem;
`;

const QuickLinks = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #E5E7EB;
`;

const QuickLink = styled.a`
  color: #4D148C; /* FedEx purple */
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 0.2s;
  font-family: 'Helvetica Neue', Arial, sans-serif;

  &:hover {
    color: #FF6600; /* FedEx orange on hover */
  }
`;

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface FedExLoginFormProps {
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

const FedExLoginForm: React.FC<FedExLoginFormProps> = ({
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
	const [_flowId, setFlowId] = useState<string | null>(null);
	const [_codeVerifier, setCodeVerifier] = useState<string>('');

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

				// Generate PKCE code verifier
				const verifier = generateCodeVerifier();
				setCodeVerifier(verifier);

				// Initialize PingOne embedded login
				const loginResult = await PingOneLoginService.initializeEmbeddedLogin(
					environmentId,
					clientId,
					redirectUri
				);

				if (loginResult.success && loginResult.data) {
					setFlowId(loginResult.data.flowId);

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
								verifier
							);

							if (tokenResult.success && tokenResult.data) {
								// Create user context and login context
								const userContext: UserContext = {
									id: formData.username,
									email: formData.username.includes('@')
										? formData.username
										: `${formData.username}@fedex.com`,
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
			<FormTitle>Secure Employee Portal</FormTitle>

			<FormDescription>
				Access your FedEx employee account with enhanced security features.
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

				<FedExLoginButton type="submit" disabled={isLoading}>
					{isLoading ? (
						<ButtonSpinner loading={true} spinnerSize={20}>
							Signing In...
						</ButtonSpinner>
					) : (
						<>
							<FedExIcon>
								<FiLockIcon />
							</FedExIcon>
							Sign In
						</>
					)}
				</FedExLoginButton>
			</Form>

			<QuickLinks>
				<QuickLink href="#">Forgot Username?</QuickLink>
				<QuickLink href="#">Forgot Password?</QuickLink>
				<QuickLink href="#">Need Help?</QuickLink>
			</QuickLinks>
		</LoginContainer>
	);
};

export default FedExLoginForm;
