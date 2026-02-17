/**
 * @file CorporatePortalHero.tsx
 * @module protect-portal/components
 * @description Universal corporate portal hero component
 * @version 9.11.58
 * @since 2026-02-15
 *
 * This is the universal base component for all corporate portals that supports
 * multiple login patterns and company customizations through configuration.
 */

import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import type { BrandTheme } from '../themes/brand-theme.interface';
import { useBrandTheme } from '../themes/theme-provider';
import type { CorporatePortalConfig, LoginPattern } from '../types/CorporatePortalConfig';
import type { LoginContext, PortalError, UserContext } from '../types/protectPortal.types';
import DropdownLogin from './LoginPatterns/DropdownLogin';
import EmbeddedLogin from './LoginPatterns/EmbeddedLogin';
import NewPageLogin from './LoginPatterns/NewPageLogin';
// Import login pattern components
import RightPopoutLogin from './LoginPatterns/RightPopoutLogin';
import TwoStepOTPLogin from './LoginPatterns/TwoStepOTPLogin';
import CorporateFooter from './Shared/CorporateFooter';
// Import shared components
import CorporateNavigation from './Shared/CorporateNavigation';
import FeaturesSection from './Shared/FeaturesSection';
import HeroSection from './Shared/HeroSection';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const CorporateContainer = styled.div<{ theme: BrandTheme }>`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background || '#ffffff'};
  font-family: ${({ theme }) => theme.typography?.bodyFont || 'Inter, sans-serif'};
  color: ${({ theme }) => theme.colors.text || '#1F2937'};
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const EmbeddedLoginWrapper = styled.div`
  max-width: 800px;
  margin: 0 auto 3rem auto;
  padding: 0 2rem;
`;

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

	// Handle missing portal configuration gracefully
	if (!portalConfig || !portalConfig.login) {
		// Only log in development mode to reduce console noise in production
		if (process.env.NODE_ENV === 'development') {
			console.info('[CorporatePortalHero] No portal configuration found for theme:', theme.name);
		}
		return (
			<CorporateContainer theme={theme}>
				<div style={{ padding: '2rem', textAlign: 'center' }}>
					<h2>Portal Configuration Loading...</h2>
					<p>Please wait while the portal configuration loads.</p>
				</div>
			</CorporateContainer>
		);
	}

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
		(credentials: any) => {
			onLoginStart?.();
			setLoginState((prev) => ({ ...prev, isOpen: false }));
		},
		[onLoginStart]
	);

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
		<CorporateContainer theme={theme}>
			<CorporateNavigation config={portalConfig} onLoginClick={handleLoginNavigation} />

			<MainContent>
				<HeroSection
					config={portalConfig}
					onLoginClick={handleLoginNavigation}
					currentStep={currentStep}
				/>

				{portalConfig.login.pattern === 'embedded' && (
					<EmbeddedLoginWrapper>
						<EmbeddedLogin onSubmit={handleLoginSubmit} config={portalConfig} />
					</EmbeddedLoginWrapper>
				)}

				<FeaturesSection config={portalConfig} />
			</MainContent>

			{portalConfig.login.pattern !== 'embedded' && renderLoginPattern()}

			<CorporateFooter config={portalConfig} />
		</CorporateContainer>
	);
};

export default CorporatePortalHero;
