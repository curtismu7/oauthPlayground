/**
 * @file FedExLoginForm.PingUI.tsx
 * @module protect-portal/components
 * @description Ping UI migrated FedEx specific login form with authentic button styling
 * @version 9.6.5
 * @since 2026-02-11
 *
 * This component provides a FedEx-specific login form that matches
 * their actual secure login experience with distinctive button styling and brand colors.
 * Migrated to Ping UI with MDI icons and CSS variables.
 */

import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { ButtonSpinner } from '../../../components/ui/ButtonSpinner';
// import PingOneLoginService from '../services/pingOneLoginService';
import type { PortalError, UserContext } from '../types/protectPortal.types';

// MDI Icon Component with proper accessibility
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	ariaLabel?: string;
	ariaHidden?: boolean;
	className?: string;
	style?: React.CSSProperties;
}> = ({ icon, size = 16, ariaLabel, ariaHidden = false, className = '', style }) => {
	const iconClass = getMDIIconClass(icon);
	const combinedClassName = `mdi ${iconClass} ${className}`.trim();

	return (
		<i
			className={combinedClassName}
			style={{ fontSize: `${size}px`, ...style }}
			{...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
			{...(ariaHidden ? { 'aria-hidden': 'true' } : {})}
		></i>
	);
};

// MDI Icon mapping function
const getMDIIconClass = (iconName: string): string => {
	const iconMap: Record<string, string> = {
		FiAlertTriangle: 'mdi-alert',
		FiEye: 'mdi-eye',
		FiEyeOff: 'mdi-eye-off',
		FiLock: 'mdi-lock',
	};
	return iconMap[iconName] || 'mdi-help-circle';
};

// ============================================================================
// INTERFACES
// ============================================================================

interface FedExLoginFormPingUIProps {
	onLoginSuccess?: (userContext: UserContext) => void;
	onLoginError?: (error: PortalError) => void;
	onLoginStart?: () => void;
	initialEmail?: string;
}

// ============================================================================
// PKCE HELPER FUNCTIONS
// ============================================================================

// PKCE Helper Functions (available for future OAuth implementation)
/*
const generateCodeVerifier = (): string => {
	const array = new Uint8Array(32);
	const randomValues = crypto.getRandomValues(array);
	return btoa(String.fromCharCode(...randomValues))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
};
*/

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
  margin: 0 0 var(--ping-spacing-md, 1rem) 0;
  text-align: center;
  font-family: 'Helvetica Neue', Arial, sans-serif;
`;

const FormDescription = styled.p`
  font-size: 0.875rem;
  color: #666666; /* Medium gray */
  margin: 0 0 var(--ping-spacing-xl, 2rem) 0;
  text-align: center;
  line-height: 1.5;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--ping-spacing-lg, 1.5rem);
`;

const InputGroup = styled.div`
  position: relative;
`;

const InputLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #333333;
  margin-bottom: var(--ping-spacing-xs, 0.5rem);
`;

const Input = styled.input`
  width: 100%;
  padding: var(--ping-spacing-md, 1rem);
  border: 2px solid #e1e5e9;
  border-radius: var(--ping-border-radius-md, 8px);
  font-size: 1rem;
  transition: all var(--ping-transition-fast, 0.15s) ease-in-out;
  background: var(--ping-surface-primary, white);
  
  &:focus {
    outline: none;
    border-color: #ff6600; /* FedEx orange */
    box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.1);
  }
  
  &.error {
    border-color: #dc3545;
    box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: var(--ping-spacing-md, 1rem);
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #666666;
  cursor: pointer;
  padding: var(--ping-spacing-xs, 0.25rem);
  border-radius: var(--ping-border-radius-sm, 4px);
  transition: all var(--ping-transition-fast, 0.15s) ease-in-out;
  
  &:hover {
    color: #ff6600;
    background: rgba(255, 102, 0, 0.1);
  }
`;

const RememberMeGroup = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ping-spacing-sm, 0.75rem);
`;

const Checkbox = styled.input`
  width: 1.25rem;
  height: 1.25rem;
  accent-color: #ff6600; /* FedEx orange */
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  font-size: 0.875rem;
  color: #333333;
  cursor: pointer;
  user-select: none;
`;

const SubmitButton = styled.button<{ $loading?: boolean }>`
  background: linear-gradient(135deg, #ff6600 0%, #e55a00 100%);
  color: white;
  border: none;
  padding: var(--ping-spacing-md, 1rem) var(--ping-spacing-xl, 2rem);
  border-radius: var(--ping-border-radius-md, 8px);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--ping-transition-fast, 0.15s) ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--ping-spacing-sm, 0.75rem);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  &:hover {
    background: linear-gradient(135deg, #e55a00 0%, #cc5200 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 102, 0, 0.3);
  }
  
  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #dc3545;
  border-radius: var(--ping-border-radius-md, 8px);
  padding: var(--ping-spacing-md, 1rem);
  margin-bottom: var(--ping-spacing-lg, 1.5rem);
  display: flex;
  align-items: flex-start;
  gap: var(--ping-spacing-sm, 0.75rem);
  color: #dc3545;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const SuccessMessage = styled.div`
  background: #d1fae5;
  border: 1px solid #10b981;
  border-radius: var(--ping-border-radius-md, 8px);
  padding: var(--ping-spacing-md, 1rem);
  margin-bottom: var(--ping-spacing-lg, 1.5rem);
  display: flex;
  align-items: flex-start;
  gap: var(--ping-spacing-sm, 0.75rem);
  color: #065f46;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const HelpLinks = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: var(--ping-spacing-lg, 1.5rem);
  padding-top: var(--ping-spacing-lg, 1.5rem);
  border-top: 1px solid #e1e5e9;
`;

const HelpLink = styled.a`
  color: #ff6600;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all var(--ping-transition-fast, 0.15s) ease-in-out;
  
  &:hover {
    color: #cc5200;
    text-decoration: underline;
  }
`;

const SecurityBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--ping-spacing-xs, 0.5rem);
  margin-top: var(--ping-spacing-lg, 1.5rem);
  padding: var(--ping-spacing-sm, 0.75rem);
  background: #f8f9fa;
  border: 1px solid #e1e5e9;
  border-radius: var(--ping-border-radius-md, 8px);
  font-size: 0.75rem;
  color: #666666;
`;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const FedExLoginFormPingUI: React.FC<FedExLoginFormPingUIProps> = ({
	onLoginSuccess,
	onLoginError,
	onLoginStart,
	initialEmail = '',
}) => {
	const [email, setEmail] = useState(initialEmail);
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const handleEmailChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setEmail(e.target.value);
			if (error) setError(null);
		},
		[error]
	);

	const handlePasswordChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setPassword(e.target.value);
			if (error) setError(null);
		},
		[error]
	);

	const togglePasswordVisibility = useCallback(() => {
		setShowPassword((prev) => !prev);
	}, []);

	const handleRememberMeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setRememberMe(e.target.checked);
	}, []);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();

			if (!email.trim() || !password.trim()) {
				setError('Please enter both email and password');
				return;
			}

			setError(null);
			setSuccess(null);
			setIsLoading(true);
			onLoginStart?.();

			try {
				// Simulate FedEx login process
				await new Promise((resolve) => setTimeout(resolve, 2000));

				// Mock successful login
				const mockUserContext: UserContext = {
					id: 'fedex-user-123',
					email: email.trim(),
					name: 'FedEx User',
					authenticated: true,
					loginTime: new Date().toISOString(),
				};

				setSuccess('Login successful! Redirecting...');
				onLoginSuccess?.(mockUserContext);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
				setError(errorMessage);
				onLoginError?.({ code: 'LOGIN_FAILED', message: errorMessage, recoverable: true });
			} finally {
				setIsLoading(false);
			}
		},
		[email, password, onLoginSuccess, onLoginError, onLoginStart]
	);

	return (
		<div className="end-user-nano">
			<LoginContainer>
				<FormTitle>FedEx Secure Login</FormTitle>
				<FormDescription>Enter your credentials to access your FedEx account</FormDescription>

				{error && (
					<ErrorMessage>
						<MDIIcon icon="FiAlertTriangle" size={16} ariaLabel="Error" />
						{error}
					</ErrorMessage>
				)}

				{success && (
					<SuccessMessage>
						<MDIIcon icon="FiCheckCircle" size={16} ariaLabel="Success" />
						{success}
					</SuccessMessage>
				)}

				<Form onSubmit={handleSubmit}>
					<InputGroup>
						<InputLabel htmlFor="email">User ID / Email</InputLabel>
						<Input
							id="email"
							type="email"
							value={email}
							onChange={handleEmailChange}
							placeholder="Enter your user ID or email"
							autoComplete="username"
							className={error ? 'error' : ''}
							disabled={isLoading}
						/>
					</InputGroup>

					<InputGroup>
						<InputLabel htmlFor="password">Password</InputLabel>
						<Input
							id="password"
							type={showPassword ? 'text' : 'password'}
							value={password}
							onChange={handlePasswordChange}
							placeholder="Enter your password"
							autoComplete="current-password"
							className={error ? 'error' : ''}
							disabled={isLoading}
						/>
						<PasswordToggle
							type="button"
							onClick={togglePasswordVisibility}
							aria-label={showPassword ? 'Hide password' : 'Show password'}
							disabled={isLoading}
						>
							<MDIIcon
								icon={showPassword ? 'FiEyeOff' : 'FiEye'}
								size={16}
								ariaLabel={showPassword ? 'Hide password' : 'Show password'}
							/>
						</PasswordToggle>
					</InputGroup>

					<RememberMeGroup>
						<Checkbox
							id="remember-me"
							type="checkbox"
							checked={rememberMe}
							onChange={handleRememberMeChange}
							disabled={isLoading}
						/>
						<CheckboxLabel htmlFor="remember-me">Remember my user ID</CheckboxLabel>
					</RememberMeGroup>

					<SubmitButton type="submit" disabled={isLoading}>
						{isLoading ? (
							<>
								<ButtonSpinner />
								Signing In...
							</>
						) : (
							<>
								<MDIIcon icon="FiLock" size={16} ariaLabel="Lock" />
								Sign In
							</>
						)}
					</SubmitButton>
				</Form>

				<HelpLinks>
					<HelpLink href="#" onClick={(e) => e.preventDefault()}>
						Forgot User ID?
					</HelpLink>
					<HelpLink href="#" onClick={(e) => e.preventDefault()}>
						Forgot Password?
					</HelpLink>
				</HelpLinks>

				<SecurityBadge>
					<MDIIcon icon="FiLock" size={12} ariaLabel="Security" />
					Secure Connection • SSL Encrypted
				</SecurityBadge>
			</LoginContainer>
		</div>
	);
};

export default FedExLoginFormPingUI;
