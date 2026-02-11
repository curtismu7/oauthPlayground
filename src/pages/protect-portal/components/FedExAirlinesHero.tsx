/**
 * @file FedExAirlinesHero.tsx
 * @module protect-portal/components
 * @description FedEx Airlines hero section with authentic login page layout
 * @version 9.6.5
 * @since 2026-02-11
 *
 * This component provides a FedEx Airlines-specific hero section that matches
 * their actual login page layout with navigation, hero content, and login integration.
 */

import React from 'react';
import styled from 'styled-components';
import type { LoginContext, PortalError, UserContext } from '../types/protectPortal.types';
import FedExLoginForm from './FedExLoginForm';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const HeroContainer = styled.div`
  width: 100%;
  background: white; /* FedEx secure login uses white background */
  position: relative;
  overflow: hidden;
`;

const HeroBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #4D148C 0%, #660066 50%, #FF6600 100%);
  opacity: 0.02; /* Very subtle background, mostly white */
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 2;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0;
`;

const Navigation = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #E5E7EB;
  margin-bottom: 2rem;
  width: 100%;
  background: white;
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const LogoText = styled.div`
  color: #4D148C; /* FedEx purple text */
  font-size: 1.75rem;
  font-weight: 700;
  font-family: 'Helvetica Neue', Arial, sans-serif;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
`;

const NavLink = styled.a`
  color: #666666; /* Medium gray text for FedEx secure login */
  text-decoration: none;
  font-weight: 500;
  font-size: 0.875rem;
  transition: color 0.2s;
  font-family: 'Helvetica Neue', Arial, sans-serif;

  &:hover {
    color: #FF6600; /* FedEx orange on hover */
  }
`;

const MainContent = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem;
  min-height: calc(100vh - 200px);
`;

const LoginContainer = styled.div`
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 2rem;
`;

const LoginSection = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const LoginTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333333; /* Dark gray for secure login */
  margin-bottom: 0.5rem;
  font-family: 'Helvetica Neue', Arial, sans-serif;
`;

const LoginSubtitle = styled.p`
  color: #666666; /* Medium gray */
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
  font-family: 'Helvetica Neue', Arial, sans-serif;
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

interface FedExAirlinesHeroProps {
	className?: string;
	currentStep?: string;
	onLoginSuccess?: (userContext: UserContext, loginContext: LoginContext) => void;
	onError?: (error: PortalError) => void;
	environmentId: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const FedExAirlinesHero: React.FC<FedExAirlinesHeroProps> = ({
	className,
	currentStep,
	onLoginSuccess,
	onError,
	environmentId,
	clientId,
	clientSecret,
	redirectUri,
}) => {
	// Show different content based on current step
	if (currentStep && currentStep !== 'portal-home') {
		return (
			<HeroContainer className={className}>
				<HeroBackground />
				<HeroContent>
					<Navigation>
						<LogoSection>
							<LogoText>FedEx</LogoText>
						</LogoSection>
						<NavLinks>
							<NavLink href="#">Ship</NavLink>
							<NavLink href="#">Track</NavLink>
							<NavLink href="#">Manage</NavLink>
							<NavLink href="#">Support</NavLink>
						</NavLinks>
					</Navigation>
					<MainContent>
						<LoginContainer>
							<LoginSection>
								<LoginTitle>Secure Employee Portal</LoginTitle>
								<LoginSubtitle>
									Access your FedEx employee account with enhanced security features.
								</LoginSubtitle>
							</LoginSection>

							<FedExLoginForm
								onLoginSuccess={onLoginSuccess || (() => {})}
								onError={onError || (() => {})}
								environmentId={environmentId}
								clientId={clientId}
								clientSecret={clientSecret}
								redirectUri={redirectUri}
							/>

							<QuickLinks>
								<QuickLink href="#">Forgot Username?</QuickLink>
								<QuickLink href="#">Forgot Password?</QuickLink>
								<QuickLink href="#">Need Help?</QuickLink>
							</QuickLinks>
						</LoginContainer>
					</MainContent>
				</HeroContent>
			</HeroContainer>
		);
	}

	return (
		<HeroContainer className={className}>
			<HeroBackground />
			<HeroContent>
				<MainContent>
					<LoginContainer>
						<LoginSection>
							<LoginTitle>Secure Employee Portal</LoginTitle>
							<LoginSubtitle>
								Access your FedEx employee account with enhanced security features.
							</LoginSubtitle>
						</LoginSection>

						<FedExLoginForm
							onLoginSuccess={onLoginSuccess || (() => {})}
							onError={onError || (() => {})}
							environmentId={environmentId}
							clientId={clientId}
							clientSecret={clientSecret}
							redirectUri={redirectUri}
						/>
					</LoginContainer>
				</MainContent>
			</HeroContent>
		</HeroContainer>
	);
};

export default FedExAirlinesHero;
