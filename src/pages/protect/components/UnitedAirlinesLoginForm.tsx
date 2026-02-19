/**
 * @file UnitedAirlinesLoginForm.tsx
 * @module protect-portal/components
 * @description United Airlines specific two-step login form
 * @version 9.6.5
 * @since 2026-02-11
 *
 * This component provides a United Airlines-specific two-step login form that matches
 * their actual login experience: first email/mileage plus/phone number, then password.
 */

import React, { useCallback, useState } from 'react';
import {
	FiAlertTriangle,
	FiArrowRight,
	FiEye,
	FiEyeOff,
	FiLock as FiLockIcon,
	FiPhone,
	FiUser,
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

const _generateCodeChallenge = async (verifier: string): Promise<string> => {
	const encoder = new TextEncoder();
	const data = encoder.encode(verifier);
	const digest = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(digest));
	return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
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

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  gap: 1rem;
`;

const StepDot = styled.div<{ $active: boolean; $completed: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${({ $active, $completed }) =>
		$active
			? 'var(--brand-primary)'
			: $completed
				? 'var(--brand-success)'
				: 'var(--brand-text-secondary)'};
  transition: var(--brand-transition);
`;

const StepLine = styled.div<{ $completed: boolean }>`
  width: 40px;
  height: 2px;
  background: ${({ $completed }) =>
		$completed ? 'var(--brand-success)' : 'var(--brand-text-secondary)'};
  margin: 0 0.5rem;
  transition: var(--brand-transition);
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

const SubmitButton = styled.button`
  background: var(--brand-primary);
  color: white;
  border: none;
  border-radius: var(--brand-radius-md);
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--brand-transition);
  font-family: var(--brand-body-font);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background: var(--brand-primary-dark);
    transform: translateY(-1px);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px var(--brand-primary-light);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const PhoneButton = styled.button`
  background: transparent;
  border: 2px solid var(--brand-primary);
  color: var(--brand-primary);
  border-radius: var(--brand-radius-md);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--brand-transition);
  font-family: var(--brand-body-font);
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background: var(--brand-primary);
    color: white;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px var(--brand-primary-light);
  }
`;

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface UnitedAirlinesLoginFormProps {
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

const UnitedAirlinesLoginForm: React.FC<UnitedAirlinesLoginFormProps> = ({
	onLoginSuccess,
	onError,
	environmentId,
	clientId,
	clientSecret,
	redirectUri,
}) => {
	const [currentStep, setCurrentStep] = useState<1 | 2>(1);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);
	const [usePhone, setUsePhone] = useState(false);
	const [flowId, setFlowId] = useState<string | null>(null);
	const [codeVerifier, setCodeVerifier] = useState<string>('');

	// Form state
	const [formData, setFormData] = useState({
		identifier: '', // email, mileage plus, or phone number
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

	const handleStep1Submit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			setIsLoading(true);
			setError(null);

			try {
				// Validate identifier
				if (!formData.identifier.trim()) {
					throw new Error('Please enter your email, MileagePlus number, or phone number');
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
					setCurrentStep(2);
				} else {
					throw new Error(loginResult.error?.message || 'Failed to initialize login');
				}
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'An error occurred';
				setError(errorMessage);
				onError({
					message: errorMessage,
					code: 'VALIDATION_ERROR',
					recoverable: true,
					suggestedAction: 'Please check your input and try again.',
				});
			} finally {
				setIsLoading(false);
			}
		},
		[formData.identifier, environmentId, clientId, redirectUri, onError]
	);

	const handleStep2Submit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			setIsLoading(true);
			setError(null);

			try {
				// Validate password
				if (!formData.password.trim()) {
					throw new Error('Please enter your password');
				}

				if (!flowId) {
					throw new Error('Login session expired. Please start over.');
				}

				// Submit credentials to PingOne
				const submitResult = await PingOneLoginService.submitCredentials(
					flowId,
					formData.identifier,
					formData.password
				);

				if (submitResult.success && submitResult.data) {
					// Resume flow to get authorization code
					const resumeResult = await PingOneLoginService.resumeFlow(flowId);

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
								id: formData.identifier,
								email: formData.identifier.includes('@')
									? formData.identifier
									: `${formData.identifier}@united.com`,
								name: formData.identifier,
								username: formData.identifier,
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
		[
			formData,
			flowId,
			environmentId,
			clientId,
			clientSecret,
			onLoginSuccess,
			onError,
			codeVerifier,
			redirectUri,
		]
	);

	const handleBack = useCallback(() => {
		setCurrentStep(1);
		setFormData((prev) => ({ ...prev, password: '' }));
		setError(null);
	}, []);

	const togglePasswordVisibility = useCallback(() => {
		setShowPassword((prev) => !prev);
	}, []);

	const togglePhoneMode = useCallback(() => {
		setUsePhone((prev) => !prev);
		setFormData((prev) => ({ ...prev, identifier: '' }));
	}, []);

	return (
		<LoginContainer>
			<CompanyLogoHeader size="large" showTagline={false} />

			<FormTitle>{currentStep === 1 ? 'Sign In to United' : 'Enter Password'}</FormTitle>

			<FormDescription>
				{currentStep === 1
					? 'Enter your email, MileagePlus number, or phone number to continue'
					: 'Enter your password to complete sign in'}
			</FormDescription>

			<StepIndicator>
				<StepDot $active={currentStep === 1} $completed={currentStep > 1} />
				<StepLine $completed={currentStep > 1} />
				<StepDot $active={currentStep === 2} $completed={false} />
			</StepIndicator>

			{error && (
				<ErrorMessage>
					<FiAlertTriangle />
					{error}
				</ErrorMessage>
			)}

			<Form onSubmit={currentStep === 1 ? handleStep1Submit : handleStep2Submit}>
				{currentStep === 1 ? (
					<>
						<InputLabel>{usePhone ? 'Phone Number' : 'Email or MileagePlus Number'}</InputLabel>
						<InputGroup>
							<StyledInput
								type={usePhone ? 'tel' : 'text'}
								name="identifier"
								value={formData.identifier}
								onChange={handleInputChange}
								placeholder={usePhone ? 'Enter phone number' : 'Enter email or MileagePlus number'}
								autoFocus
								required
								disabled={isLoading}
							/>
							{!usePhone && (
								<PhoneButton type="button" onClick={togglePhoneMode} disabled={isLoading}>
									<FiPhone size={16} />
									Use Phone
								</PhoneButton>
							)}
						</InputGroup>

						{usePhone && (
							<PhoneButton type="button" onClick={togglePhoneMode} disabled={isLoading}>
								<FiUser size={16} />
								Use Email or MileagePlus
							</PhoneButton>
						)}
					</>
				) : (
					<>
						<InputLabel>Password</InputLabel>
						<InputGroup>
							<StyledInput
								type={showPassword ? 'text' : 'password'}
								name="password"
								value={formData.password}
								onChange={handleInputChange}
								placeholder="Enter your password"
								autoFocus
								required
								disabled={isLoading}
							/>
							<PasswordToggle type="button" onClick={togglePasswordVisibility} disabled={isLoading}>
								{showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
							</PasswordToggle>
						</InputGroup>

						<PhoneButton type="button" onClick={handleBack} disabled={isLoading}>
							Back
						</PhoneButton>
					</>
				)}

				<SubmitButton type="submit" disabled={isLoading}>
					{isLoading ? (
						<ButtonSpinner loading={true} spinnerSize={16}>
							Processing...
						</ButtonSpinner>
					) : currentStep === 1 ? (
						<>
							Next
							<FiArrowRight />
						</>
					) : (
						<>
							<FiLockIcon />
							Sign In
						</>
					)}
				</SubmitButton>
			</Form>
		</LoginContainer>
	);
};

export default UnitedAirlinesLoginForm;
