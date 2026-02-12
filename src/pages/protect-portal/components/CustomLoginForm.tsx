/**
 * @file CustomLoginForm.tsx
 * @module protect-portal/components
 * @description Custom login form with embedded PingOne authentication
 * @version 9.6.5
 * @since 2026-02-10
 *
 * This component provides a custom login form that uses PingOne embedded login
 * (pi.flow) instead of redirecting to the PingOne login page.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { FiAlertTriangle, FiEye, FiEyeOff, FiLock as FiLockIcon, FiUser } from 'react-icons/fi';
import styled from 'styled-components';
import { ButtonSpinner } from '../../../components/ui/ButtonSpinner';
import PingOneLoginService from '../services/pingOneLoginService';
import type { LoginContext, PortalError, UserContext } from '../types/protectPortal.types';
import PortalPageLayout, { PortalPageSection } from './PortalPageLayout';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const LoginForm = styled.form`
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
  font-weight: 600;
  color: var(--brand-text);
  margin-bottom: 0.5rem;
  font-family: var(--brand-body-font);
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
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

interface CustomLoginFormProps {
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

const CustomLoginForm: React.FC<CustomLoginFormProps> = ({
	onLoginSuccess,
	onError,
	environmentId,
	clientId,
	clientSecret,
	redirectUri,
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
				console.log(
					'[🔐 CUSTOM-LOGIN] Starting embedded PingOne authentication (pi.flow simulation)'
				);

				// Simulate pi.flow embedded login initialization
				console.log('[🔐 PI.FLOW] Initializing embedded login flow');
				console.log('[🔐 PI.FLOW] Environment:', environmentId);
				console.log('[🔐 PI.FLOW] Client ID:', `${clientId.substring(0, 8)}...`);

				// Step 1: Start PingOne flow with embedded login parameters
				const flowResponse = await PingOneLoginService.initializeEmbeddedLogin(
					environmentId,
					clientId,
					redirectUri,
					['openid', 'profile', 'email', 'pingone:manage']
				);

				if (!flowResponse.success || !flowResponse.data) {
					throw new Error('Failed to initialize embedded PingOne flow');
				}

				const { flowId } = flowResponse.data;
				console.log('[🔐 PI.FLOW] Flow started successfully:', `${flowId.substring(0, 8)}...`);

				// Step 2: Submit user credentials through embedded flow
				console.log('[🔐 PI.FLOW] Submitting credentials through embedded flow');
				const credsResponse = await PingOneLoginService.submitCredentials(
					flowId,
					formData.username,
					formData.password
				);

				if (!credsResponse.success) {
					const errorDetails = credsResponse.error?.details || {};
					console.error('[🔐 PI.FLOW] Credential submission failed:', errorDetails);

					// Provide more specific error messages based on error type
					if (credsResponse.error?.code === 'INVALID_CREDENTIALS') {
						throw new Error(
							'Invalid username or password. Please check your credentials and try again.'
						);
					} else if (credsResponse.error?.code === 'ACCOUNT_LOCKED') {
						throw new Error(
							'Account is temporarily locked. Please try again later or contact support.'
						);
					} else if (credsResponse.error?.code === 'ACCOUNT_SUSPENDED') {
						throw new Error('Account is suspended. Please contact your administrator.');
					} else {
						throw new Error(credsResponse.error?.message || 'Authentication failed');
					}
				}

				console.log('[🔐 PI.FLOW] Credentials validated successfully');

				// Step 3: Resume embedded flow to get authorization code
				console.log('[🔐 PI.FLOW] Resuming embedded flow for authorization code');
				const resumeResponse = await PingOneLoginService.resumeFlow(flowId);

				if (!resumeResponse.success || !resumeResponse.data) {
					throw new Error('Failed to complete embedded authentication flow');
				}

				const { authorizationCode } = resumeResponse.data;
				console.log('[🔐 PI.FLOW] Authorization code received successfully');

				// Step 4: Exchange authorization code for tokens (PKCE flow)
				console.log('[🔐 PI.FLOW] Exchanging authorization code for tokens');
				const tokenResponse = await PingOneLoginService.exchangeCodeForTokens(
					environmentId,
					clientId,
					clientSecret,
					redirectUri,
					authorizationCode,
					flowId // Use flowId to retrieve the stored code verifier
				);

				if (!tokenResponse.success || !tokenResponse.data) {
					throw new Error('Failed to exchange authorization code for tokens');
				}

				console.log('[🔐 PI.FLOW] Token exchange successful');
				const { id_token } = tokenResponse.data;

				// Step 5: Extract user context from ID token
				console.log('[🔐 PI.FLOW] Extracting user context from ID token');
				const userContext = id_token
					? PingOneLoginService.extractUserFromIdToken(id_token)
					: {
							id: formData.username,
							email: formData.username.includes('@')
								? formData.username
								: `${formData.username}@example.com`,
							name: formData.username.charAt(0).toUpperCase() + formData.username.slice(1),
							username: formData.username,
							type: 'PING_ONE' as const,
							groups: [{ name: 'Default Group' }],
							device: {
								userAgent: navigator.userAgent,
								ipAddress: 'unknown', // Would be obtained from server headers
							},
							session: {
								id: flowId,
								createdAt: new Date().toISOString(),
							},
						};

				const loginContext: LoginContext = {
					timestamp: new Date().toISOString(),
					ipAddress: 'unknown', // Would be obtained from server headers
					userAgent: navigator.userAgent,
					origin: window.location.origin,
					flowType: 'AUTHENTICATION',
					flowSubtype: 'CUSTOM_LOGIN',
				};

				console.log('[🔐 CUSTOM-LOGIN] Embedded PingOne authentication successful');
				console.log('[🔐 CUSTOM-LOGIN] User authenticated:', userContext.username);
				console.log('[🔐 CUSTOM-LOGIN] Flow type:', loginContext.flowSubtype);

				onLoginSuccess(userContext, loginContext);
			} catch (err) {
				console.error('[🔐 CUSTOM-LOGIN] Embedded authentication failed:', err);

				const errorMessage = err instanceof Error ? err.message : 'Login failed';
				setError(errorMessage);

				const portalError: PortalError = {
					code: 'EMBEDDED_LOGIN_FAILED',
					message: errorMessage,
					recoverable: true,
					suggestedAction:
						'Please check your credentials and try again, or contact support if the issue persists',
					details: {
						flowType: 'EMBEDDED_PI_FLOW',
						timestamp: new Date().toISOString(),
					},
				};

				onError(portalError);
			} finally {
				setIsLoading(false);
			}
		},
		[formData, environmentId, clientId, clientSecret, redirectUri, onLoginSuccess, onError]
	);

	// ============================================================================
	// EFFECTS
	// ============================================================================

	useEffect(() => {
		console.log('[🔐 CUSTOM-LOGIN] Custom login form initialized', {
			environmentId,
			clientId,
			userAgent: navigator.userAgent,
		});
	}, [environmentId, clientId]);

	// ============================================================================
	// RENDER
	// ============================================================================

	return (
		<PortalPageLayout
			title="Secure Login"
			subtitle="Enter your credentials to begin the secure authentication process"
		>
			<PortalPageSection>
				{error && (
					<ErrorMessage>
						<FiAlertTriangle />
						{error}
					</ErrorMessage>
				)}

				<LoginForm onSubmit={handleSubmit}>
					<InputGroup>
						<InputLabel htmlFor="username">Username or Email</InputLabel>
						<InputWrapper>
							<InputIcon>
								<FiUser />
							</InputIcon>
							<StyledInput
								id="username"
								name="username"
								type="text"
								placeholder="Enter your username or email address"
								value={formData.username}
								onChange={handleInputChange}
								hasIcon={true}
								hasToggle={false}
								required
								disabled={isLoading}
								autoComplete="username"
							/>
						</InputWrapper>
					</InputGroup>

					<InputGroup>
						<InputLabel htmlFor="password">Password</InputLabel>
						<InputWrapper>
							<InputIcon>
								<FiLockIcon />
							</InputIcon>
							<StyledInput
								id="password"
								name="password"
								type={showPassword ? 'text' : 'password'}
								placeholder="Enter your password"
								value={formData.password}
								onChange={handleInputChange}
								hasIcon={true}
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

					<ButtonSpinner
						loading={isLoading}
						loadingText="Authenticating..."
						spinnerPosition="center"
						spinnerSize={20}
						disabled={!formData.username || !formData.password}
						style={{
							width: '100%',
							padding: '0.875rem 1.5rem',
							background: isLoading ? '#9ca3af' : '#1f2937',
							color: 'white',
							border: 'none',
							borderRadius: '0.5rem',
							fontSize: '1rem',
							fontWeight: '600',
							cursor: isLoading ? 'not-allowed' : 'pointer',
							transition: 'all 0.2s ease',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: '0.5rem',
						}}
					>
						{!isLoading && (
							<>
								<FiLockIcon />
								Sign In Securely
							</>
						)}
					</ButtonSpinner>
				</LoginForm>
			</PortalPageSection>
		</PortalPageLayout>
	);
};

export default CustomLoginForm;
