/**
 * @file CorporatePortalHero.PingUI.tsx
 * @module protect-portal/components
 * @description Universal corporate portal hero component (PingUI version)
 * @version 9.11.58
 * @since 2026-02-15
 *
 * This is the universal base component for all corporate portals that supports
 * multiple login patterns and company customizations through configuration.
 */

import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BrandTheme } from '../themes/brand-theme.interface';
import { useBrandTheme } from '../themes/theme-provider';
import type { CorporatePortalConfig } from '../types/CorporatePortalConfig';
import type { LoginContext, PortalError, UserContext } from '../types/protectPortal.types';
import DropdownLogin from './LoginPatterns/DropdownLogin';
import EmbeddedLogin from './LoginPatterns/EmbeddedLogin';
// Import login pattern components
import RightPopoutLogin from './LoginPatterns/RightPopoutLogin';
import TwoStepOTPLogin from './LoginPatterns/TwoStepOTPLogin';
import CorporateFooter from './Shared/CorporateFooter';
// Import shared components
import CorporateNavigation from './Shared/CorporateNavigation';
import FeaturesSection from './Shared/FeaturesSection';
import HeroSection from './Shared/HeroSection';

// ============================================================================
// MDI ICON COMPONENT
// ============================================================================

const _MDIIcon: React.FC<{
	icon: string;
	size?: number;
	className?: string;
	'aria-label'?: string;
	'aria-hidden'?: boolean;
}> = ({ icon, size = 24, className = '', 'aria-label': ariaLabel, 'aria-hidden': ariaHidden }) => {
	return (
		<div
			className={`mdi mdi-${icon} ${className}`}
			style={{ fontSize: size }}
			aria-label={ariaLabel}
			aria-hidden={ariaHidden}
			title={ariaLabel}
		/>
	);
};

// ============================================================================
// INLINE STYLES
// ============================================================================

const getCorporateContainerStyle = (theme: BrandTheme) => ({
	minHeight: '100vh',
	background: theme.colors.background || '#ffffff',
	fontFamily: theme.typography?.bodyFont || 'Inter, sans-serif',
	color: theme.colors.text || '#1F2937',
});

const getMainContentStyle = () => ({
	flex: 1,
	display: 'flex',
	flexDirection: 'column' as const,
});

const getEmbeddedLoginWrapperStyle = () => ({
	maxWidth: '800px',
	margin: '0 auto 3rem auto',
	padding: '0 2rem',
});

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface CorporatePortalHeroProps {
	currentStep?: string;
	onLoginStart?: () => void;
	_onLoginSuccess?: (userContext: UserContext, loginContext: LoginContext) => void;
	_onError?: (error: PortalError) => void;
	_environmentId?: string;
	_clientId?: string;
	_clientSecret?: string;
	_redirectUri?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CorporatePortalHero: React.FC<CorporatePortalHeroProps> = ({
	currentStep = 'portal-home',
	onLoginStart,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_onLoginSuccess,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_onError,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_environmentId,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_clientId,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_clientSecret,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_redirectUri,
}) => {
	const navigate = useNavigate();
	const themeContext = useBrandTheme();
	const theme = themeContext.activeTheme;
	const [loginState, setLoginState] = useState({
		isOpen: false,
		step: 'username' as 'username' | 'otp',
		username: '',
	});

	// Get portal configuration from theme
	const portalConfig = theme.portalConfig as CorporatePortalConfig;

	// Handle login pattern navigation
	const handleLoginNavigation = useCallback(() => {
		const { pattern, route } = portalConfig.login;

		switch (pattern) {
			case 'new-page':
				if (route) {
					navigate(route);
				} else {
					navigate(`/${portalConfig.company.name}/login`);
				}
				break;
			case 'right-popout':
			case 'dropdown':
				setLoginState((prev) => ({ ...prev, isOpen: true }));
				break;
			case 'embedded':
			case 'two-step-otp':
				// These are handled within the main component
				break;
			default:
				onLoginStart?.();
		}
	}, [navigate, portalConfig, onLoginStart]);

	// Handle login form submission
	const handleLoginSubmit = useCallback(
		(_credentials: unknown) => {
			onLoginStart?.();
			setLoginState((prev) => ({ ...prev, isOpen: false }));
		},
		[onLoginStart]
	);

	// Handle missing portal configuration gracefully
	if (!portalConfig || !portalConfig.login) {
		// Only log in development mode to reduce console noise in production
		if (process.env.NODE_ENV === 'development') {
			console.info('[CorporatePortalHero] No portal configuration found for theme:', theme.name);
		}
		return (
			<div className="end-user-nano" style={getCorporateContainerStyle(theme)}>
				<div style={{ padding: '2rem', textAlign: 'center' }}>
					<h2>Portal Configuration Loading...</h2>
					<p>Please wait while the portal configuration loads.</p>
				</div>
			</div>
		);
	}

	// Render login pattern component
	const renderLoginPattern = () => {
		const { pattern } = portalConfig.login;

		switch (pattern) {
			case 'right-popout':
				return (
					<RightPopoutLogin
						isOpen={loginState.isOpen}
						onClose={() => setLoginState((prev) => ({ ...prev, isOpen: false }))}
						onSubmit={handleLoginSubmit}
						config={portalConfig}
					/>
				);
			case 'new-page':
				return null; // Handled by navigation
			case 'dropdown':
				return (
					<DropdownLogin
						isOpen={loginState.isOpen}
						onClose={() => setLoginState((prev) => ({ ...prev, isOpen: false }))}
						onSubmit={handleLoginSubmit}
						config={portalConfig}
					/>
				);
			case 'embedded':
				return <EmbeddedLogin onSubmit={handleLoginSubmit} config={portalConfig} />;
			case 'two-step-otp':
				return (
					<TwoStepOTPLogin
						step={loginState.step}
						username={loginState.username}
						onStepChange={(step, username) =>
							setLoginState((prev) => ({ ...prev, step, username }))
						}
						onSubmit={handleLoginSubmit}
						config={portalConfig}
					/>
				);
			default:
				return null;
		}
	};

	return (
		<div className="end-user-nano" style={getCorporateContainerStyle(theme)}>
			<CorporateNavigation config={portalConfig} onLoginClick={handleLoginNavigation} />

			<main style={getMainContentStyle()}>
				<HeroSection
					config={portalConfig}
					onLoginClick={handleLoginNavigation}
					currentStep={currentStep}
				/>

				{portalConfig.login.pattern === 'embedded' && (
					<div style={getEmbeddedLoginWrapperStyle()}>
						<EmbeddedLogin onSubmit={handleLoginSubmit} config={portalConfig} />
					</div>
				)}

				<FeaturesSection config={portalConfig} />
			</main>

			{portalConfig.login.pattern !== 'embedded' && renderLoginPattern()}

			<CorporateFooter config={portalConfig} />
		</div>
	);
};

export default CorporatePortalHero;
