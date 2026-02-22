/**
 * @file SouthwestAirlinesLoginForm.PingUI.tsx
 * @module protect-portal/components
 * @description Southwest Airlines specific login form with authentic button styling - Ping UI version
 * @version 9.6.5
 * @since 2026-02-11
 *
 * This component provides a Southwest Airlines-specific login form that matches
 * their actual login experience with distinctive button styling and brand colors.
 */

import React, { useCallback, useState } from 'react';
import { ButtonSpinner } from '../../../components/ui/ButtonSpinner';
import type { LoginContext, PortalError, UserContext } from '../types/protectPortal.types';
import CompanyLogoHeader from './CompanyLogoHeader';

// MDI Icon component
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	className?: string;
	'aria-label'?: string;
	'aria-hidden'?: boolean;
}> = ({ icon, size = 24, className = '', 'aria-label': ariaLabel, 'aria-hidden': ariaHidden }) => {
	const style: React.CSSProperties = {
		width: size,
		height: size,
		fontSize: size,
		lineHeight: 1,
	};

	return (
		<span
			role="img"
			aria-label={ariaLabel}
			aria-hidden={ariaHidden}
			className={`mdi mdi-${icon} ${className}`}
			style={style}
		/>
	);
};

// ============================================================================
// INLINE STYLES FUNCTIONS
// ============================================================================

const getLoginContainerStyle = () => ({
	width: '100%',
	maxWidth: '500px',
	margin: '0 auto',
});

const getFormTitleStyle = () => ({
	fontSize: '1.875rem',
	fontWeight: 700,
	color: 'var(--brand-text, #1a1a1a)',
	margin: '0 0 1rem 0',
	textAlign: 'center' as const,
	fontFamily: 'var(--brand-heading-font, system-ui)',
});

const getFormDescriptionStyle = () => ({
	fontSize: '1rem',
	color: 'var(--brand-text-secondary, #666)',
	margin: '0 0 2rem 0',
	textAlign: 'center' as const,
	lineHeight: 1.6,
});

const getFormStyle = () => ({
	display: 'flex',
	flexDirection: 'column' as const,
	gap: '1.5rem',
});

const getFieldGroupStyle = () => ({
	display: 'flex',
	flexDirection: 'column' as const,
	gap: '0.5rem',
});

const getLabelStyle = () => ({
	fontSize: '0.875rem',
	fontWeight: 600,
	color: 'var(--brand-text, #1a1a1a)',
	fontFamily: 'var(--brand-font, system-ui)',
});

const getInputWrapperStyle = () => ({
	position: 'relative' as const,
	display: 'flex',
	alignItems: 'center' as const,
});

const getInputStyle = (hasError: boolean) => ({
	width: '100%',
	padding: '0.875rem 3rem 0.875rem 1rem',
	border: hasError ? '2px solid #dc2626' : '2px solid #e5e7eb',
	borderRadius: '8px',
	fontSize: '1rem',
	fontFamily: 'var(--brand-font, system-ui)',
	transition: 'all 0.15s ease-in-out',
	outline: 'none',
	backgroundColor: 'white',
});

const getInputIconStyle = () => ({
	position: 'absolute' as const,
	right: '1rem',
	color: '#6b7280',
});

const getTogglePasswordButtonStyle = () => ({
	position: 'absolute' as const,
	right: '1rem',
	background: 'none',
	border: 'none',
	color: '#6b7280',
	cursor: 'pointer',
	padding: '0.25rem',
	borderRadius: '4px',
});

const getErrorMessageStyle = () => ({
	display: 'flex',
	alignItems: 'center' as const,
	gap: '0.5rem',
	color: '#dc2626',
	fontSize: '0.875rem',
	fontWeight: 500,
	marginTop: '0.25rem',
});

const getLoginButtonStyle = (isLoading: boolean) => ({
	width: '100%',
	padding: '1rem',
	background: isLoading ? '#9ca3af' : '#304CB2',
	border: 'none',
	borderRadius: '8px',
	color: 'white',
	fontSize: '1.125rem',
	fontWeight: '700',
	fontFamily: "'Benton Sans', 'Helvetica Neue', Arial, sans-serif",
	cursor: isLoading ? 'not-allowed' : 'pointer',
	transition: 'all 0.15s ease-in-out',
	display: 'flex',
	alignItems: 'center' as const,
	justifyContent: 'center',
	gap: '0.5rem',
	opacity: isLoading ? 0.7 : 1,
});

const getQuickLinksStyle = () => ({
	display: 'flex',
	justifyContent: 'space-between',
	marginTop: '1.5rem',
	paddingTop: '1.5rem',
	borderTop: '1px solid #e5e7eb',
});

const getLinkStyle = () => ({
	color: '#304CB2',
	textDecoration: 'none',
	fontSize: '0.875rem',
	fontWeight: '500',
	transition: 'color 0.2s',
	fontFamily: "'Benton Sans', 'Helvetica Neue', Arial, sans-serif",
});

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface SouthwestAirlinesLoginFormProps {
	onLoginSuccess?: (userContext: UserContext, loginContext: LoginContext) => void;
	onError?: (error: PortalError) => void;
	environmentId?: string;
	clientId?: string;
	redirectUri?: string;
	isCustomer?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

const SouthwestAirlinesLoginForm: React.FC<SouthwestAirlinesLoginFormProps> = ({
	onLoginSuccess,
	onError,
	environmentId,
	clientId,
	redirectUri,
	isCustomer = true,
}) => {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleLogin = useCallback(async () => {
		if (!username || !password) {
			setError('Please enter both username and password');
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			// Simulate API call delay
			await new Promise((resolve) => setTimeout(resolve, 2000));

			const userContext: UserContext = {
				id: 'southwest_user_123',
				username: username,
				email: `${username}@southwest.com`,
				name: 'Southwest Customer',
				type: 'EXTERNAL',
			};

			const loginContext: LoginContext = {
				timestamp: new Date().toISOString(),
				ipAddress: '127.0.0.1',
				userAgent: navigator.userAgent,
				origin: window.location.origin,
				flowType: 'AUTHENTICATION',
				flowSubtype: 'CUSTOM_LOGIN',
			};

			onLoginSuccess?.(userContext, loginContext);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Login failed';
			setError(errorMessage);
			onError?.({
				code: 'LOGIN_FAILED',
				message: errorMessage,
				details: err as Record<string, unknown>,
				recoverable: true,
				suggestedAction: 'Please check your credentials and try again',
			});
		} finally {
			setIsLoading(false);
		}
	}, [username, password, onLoginSuccess, onError]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		handleLogin();
	};

	const togglePasswordVisibility = () => {
		setShowPassword(!showPassword);
	};

	return (
		<div className="end-user-nano">
			<div style={getLoginContainerStyle()}>
				<CompanyLogoHeader />

				<h2 style={getFormTitleStyle()}>{isCustomer ? 'Customer Sign In' : 'Employee Sign In'}</h2>

				<p style={getFormDescriptionStyle()}>
					{isCustomer
						? 'Access your Southwest Airlines customer account'
						: 'Access your Southwest Airlines employee account'}
				</p>

				<form onSubmit={handleSubmit} style={getFormStyle()}>
					<div style={getFieldGroupStyle()}>
						<label htmlFor="username" style={getLabelStyle()}>
							Username or Rapid Rewards Number
						</label>
						<div style={getInputWrapperStyle()}>
							<input
								id="username"
								type="text"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								placeholder="Enter username or Rapid Rewards number"
								style={getInputStyle(!!error)}
								disabled={isLoading}
								aria-label="Username or Rapid Rewards Number"
							/>
							<div style={getInputIconStyle()}>
								<MDIIcon icon="account" size={20} aria-hidden={true} />
							</div>
						</div>
					</div>

					<div style={getFieldGroupStyle()}>
						<label htmlFor="password" style={getLabelStyle()}>
							Password
						</label>
						<div style={getInputWrapperStyle()}>
							<input
								id="password"
								type={showPassword ? 'text' : 'password'}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Enter your password"
								style={getInputStyle(!!error)}
								disabled={isLoading}
								aria-label="Password"
							/>
							<button
								type="button"
								onClick={togglePasswordVisibility}
								style={getTogglePasswordButtonStyle()}
								disabled={isLoading}
								aria-label={showPassword ? 'Hide password' : 'Show password'}
							>
								<MDIIcon icon={showPassword ? 'eye-off' : 'eye'} size={20} aria-hidden={true} />
							</button>
						</div>
					</div>

					{error && (
						<div style={getErrorMessageStyle()} role="alert">
							<MDIIcon icon="alert-triangle" size={16} aria-hidden={true} />
							{error}
						</div>
					)}

					<button
						type="submit"
						disabled={isLoading || !username || !password}
						style={getLoginButtonStyle(isLoading)}
						aria-label={isCustomer ? 'Sign In to Customer Account' : 'Sign In to Employee Account'}
					>
						{isLoading ? (
							<ButtonSpinner loading={true}>Signing In...</ButtonSpinner>
						) : (
							<>
								<MDIIcon icon="shield" aria-hidden={true} />
								{isCustomer ? 'Sign In to Customer Account' : 'Sign In to Employee Account'}
							</>
						)}
					</button>
				</form>

				<div style={getQuickLinksStyle()}>
					<a href="#" style={getLinkStyle()}>
						Forgot Username?
					</a>
					<a href="#" style={getLinkStyle()}>
						Forgot Password?
					</a>
					<a href="#" style={getLinkStyle()}>
						Need Help?
					</a>
				</div>
			</div>
		</div>
	);
};

export default SouthwestAirlinesLoginForm;
