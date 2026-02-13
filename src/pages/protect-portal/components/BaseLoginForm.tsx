/**
 * @file BaseLoginForm.tsx
 * @module protect-portal/components
 * @description Base login form component - single source of truth for login UI
 * @version 9.6.6
 * @since 2026-02-12
 *
 * This component provides a consolidated login form that eliminates duplicate
 * username/password fields across company-specific components. Follows the
 * company-portal-login-mocks pattern with theme-based styling.
 *
 * CRITICAL: This is the ONLY component that should render username/password inputs.
 * All company-specific forms should use this component, not duplicate the fields.
 */

import React, { useCallback, useState } from 'react';
import { FiAlertTriangle, FiEye, FiEyeOff, FiLock as FiLockIcon, FiUser } from 'react-icons/fi';
import styled from 'styled-components';
import { ButtonSpinner } from '../../../components/ui/ButtonSpinner';
import PingOneLoginService from '../services/pingOneLoginService';
import type { LoginContext, PortalError, UserContext } from '../types/protectPortal.types';

// ============================================================================
// STYLED COMPONENTS - Theme-aware using CSS variables
// ============================================================================

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
`;

const InputGroup = styled.div`
  position: relative;
  width: 100%;
`;

const InputLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--brand-text);
  margin-bottom: 0.5rem;
  font-family: var(--brand-body-font);
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  color: var(--brand-text-secondary);
  pointer-events: none;
  z-index: 1;
`;

const StyledInput = styled.input.withConfig({
	shouldForwardProp: (prop) => !['hasIcon', 'hasToggle'].includes(prop),
})<{ hasIcon: boolean; hasToggle: boolean }>`
  width: 100%;
  padding: ${(props) => {
		const leftPadding = props.hasIcon ? '3rem' : '1rem';
		const rightPadding = props.hasToggle ? '3rem' : '1rem';
		return `0.75rem ${rightPadding} 0.75rem ${leftPadding}`;
	}};
  border: 2px solid var(--brand-text-secondary);
  border-radius: var(--brand-radius-sm);
  font-size: 1rem;
  transition: var(--brand-transition);
  background: white;
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

// ============================================================================
// PROPS INTERFACE
// ============================================================================

export interface BaseLoginFormProps {
	onLoginSuccess: (userContext: UserContext, loginContext: LoginContext) => void;
	onError: (error: PortalError) => void;
	environmentId: string;
	clientId: string;
	redirectUri: string;
	buttonText?: string;
	buttonStyle?: React.CSSProperties;
	showIcons?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const BaseLoginForm: React.FC<BaseLoginFormProps> = ({
	onLoginSuccess,
	onError,
	environmentId,
	clientId,
	redirectUri,
	buttonText = 'Sign In',
	buttonStyle,
	showIcons = true,
}) => {
	// ============================================================================
	// STATE MANAGEMENT
	// ============================================================================

	const [formData, setFormData] = useState({
		username: '',
		password: '',
	});

	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// ============================================================================
	// EVENT HANDLERS
	// ============================================================================

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const { name, value } = e.target;
			setFormData((prev) => ({
				...prev,
				[name]: value,
			}));

			// Clear error when user starts typing
			if (error) {
				setError(null);
			}
		},
		[error]
	);

	const handlePasswordToggle = useCallback(() => {
		setShowPassword((prev) => !prev);
	}, []);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();

			// Enhanced validation
			if (!formData.username || !formData.password) {
				setError('Please enter both username and password');
				return;
			}

			if (formData.username.length < 3) {
				setError('Username must be at least 3 characters long');
				return;
			}

			if (formData.password.length < 8) {
				setError('Password must be at least 8 characters long');
				return;
			}

			setIsLoading(true);
			setError(null);

			try {
				console.log('[🔐 BASE-LOGIN] Starting PingOne authentication');

				// Step 1: Initialize embedded login flow
				const flowResponse = await PingOneLoginService.initializeEmbeddedLogin(
					environmentId,
					clientId,
					redirectUri,
					['openid', 'profile', 'email', 'pingone:manage']
				);

				if (!flowResponse.success || !flowResponse.data) {
					throw new Error('Failed to initialize PingOne flow');
				}

				const { flowId } = flowResponse.data;
				console.log('[🔐 BASE-LOGIN] Flow started:', `${flowId.substring(0, 8)}...`);

				// Step 2: Submit credentials
				const credsResponse = await PingOneLoginService.submitCredentials(
					flowId,
					formData.username,
					formData.password
				);

				if (!credsResponse.success) {
					const errorDetails = credsResponse.error?.details || {};
					console.error('[🔐 BASE-LOGIN] Credential submission failed:', errorDetails);

					if (credsResponse.error?.code === 'INVALID_CREDENTIALS') {
						throw new Error('Invalid username or password. Please check your credentials and try again.');
					} else if (credsResponse.error?.code === 'ACCOUNT_LOCKED') {
						throw new Error('Your account has been locked. Please contact your administrator.');
					} else if (credsResponse.error?.code === 'MFA_REQUIRED') {
						console.log('[🔐 BASE-LOGIN] MFA required, proceeding to MFA flow');
					}

					throw new Error(credsResponse.error?.message || 'Authentication failed. Please try again.');
				}

				// Step 3: Prepare user and login context from successful authentication
				console.log('[🔐 BASE-LOGIN] Authentication successful');

				// Prepare user context using actual UserContext type
				const userContext: UserContext = {
					id: formData.username, // Use username as ID for now
					username: formData.username,
					email: formData.username.includes('@') ? formData.username : `${formData.username}@example.com`,
					name: formData.username,
					type: 'PING_ONE',
				};

				// Prepare login context using actual LoginContext type
				const loginContext: LoginContext = {
					timestamp: new Date().toISOString(),
					ipAddress: '127.0.0.1',
					userAgent: navigator.userAgent,
					origin: window.location.origin,
					flowType: 'AUTHENTICATION',
					flowSubtype: 'CUSTOM_LOGIN',
				};

				onLoginSuccess(userContext, loginContext);
			} catch (err) {
				console.error('[🔐 BASE-LOGIN] Authentication error:', err);
				const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
				setError(errorMessage);
				onError({
					code: 'AUTH_ERROR',
					message: errorMessage,
					details: { error: err },
					recoverable: true,
				});
			} finally {
				setIsLoading(false);
			}
		},
		[formData, environmentId, clientId, redirectUri, onLoginSuccess, onError]
	);

	// ============================================================================
	// RENDER
	// ============================================================================

	return (
		<>
			{error && (
				<ErrorMessage>
					<FiAlertTriangle />
					{error}
				</ErrorMessage>
			)}

			<LoginForm onSubmit={handleSubmit}>
				{/* Username Field */}
				<InputGroup>
					<InputLabel htmlFor="username">Username or Email</InputLabel>
					<InputWrapper>
						{showIcons && (
							<InputIcon>
								<FiUser />
							</InputIcon>
						)}
						<StyledInput
							id="username"
							name="username"
							type="text"
							placeholder="Enter your username or email"
							value={formData.username}
							onChange={handleInputChange}
							hasIcon={showIcons}
							hasToggle={false}
							required
							disabled={isLoading}
							autoComplete="username"
						/>
					</InputWrapper>
				</InputGroup>

				{/* Password Field */}
				<InputGroup>
					<InputLabel htmlFor="password">Password</InputLabel>
					<InputWrapper>
						{showIcons && (
							<InputIcon>
								<FiLockIcon />
							</InputIcon>
						)}
						<StyledInput
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							placeholder="Enter your password"
							value={formData.password}
							onChange={handleInputChange}
							hasIcon={showIcons}
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

				{/* Submit Button */}
				<ButtonSpinner
					loading={isLoading}
					loadingText="Authenticating..."
					spinnerPosition="center"
					spinnerSize={20}
					disabled={!formData.username || !formData.password}
					style={{
						width: '100%',
						padding: '0.875rem 1.5rem',
						background: isLoading ? '#9ca3af' : 'var(--brand-primary)',
						color: 'white',
						border: 'none',
						borderRadius: 'var(--brand-radius-sm)',
						fontSize: '1rem',
						fontWeight: '600',
						cursor: isLoading ? 'not-allowed' : 'pointer',
						transition: 'var(--brand-transition)',
						fontFamily: 'var(--brand-body-font)',
						...buttonStyle,
					}}
				>
					{!isLoading && buttonText}
				</ButtonSpinner>
			</LoginForm>
		</>
	);
};

export default BaseLoginForm;
