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
  background: white; /* Consistent white background for Protect app */
  position: relative;
  overflow: hidden;
`;

const FullWidthHeader = styled.div`
  width: 100%;
  background: white;
  border-bottom: 1px solid #E5E7EB;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
`;

const Navigation = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 0;
  width: 100%;
  background: white;
`;

const HeroBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(77, 20, 140, 0.02) 0%, rgba(255, 102, 0, 0.01) 100%);
  opacity: 1; /* Very subtle background texture, mostly white */
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 2;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
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

const LoginDescription = styled.p`
  color: #666666;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
  line-height: 1.4;
  font-family: 'Helvetica Neue', Arial, sans-serif;
`;

const LoginButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 1rem;
  background: #4D148C; /* FedEx purple */
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #3A0F6B; /* Darker purple on hover */
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const QuickActions = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin: 2rem 0;
`;

const QuickAction = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(77, 20, 140, 0.1);
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: rgba(77, 20, 140, 0.2);
    transform: translateY(-2px);
  }
`;

const ActionIcon = styled.div`
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
`;

const ActionLabel = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: #4D148C;
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
	return (
		<HeroContainer className={className}>
			<HeroBackground />
			<HeroContent>
				{currentStep === 'portal-home' ? (
					<MainContent>
						<LoginContainer>
							<LoginSection>
								<LoginTitle>The World on Time</LoginTitle>
								<LoginSubtitle>
									Ship, track, and manage your shipments with FedEx's reliable global logistics
									network
								</LoginSubtitle>
							</LoginSection>

							<QuickActions>
								<QuickAction>
									<ActionIcon>📦</ActionIcon>
									<ActionLabel>Ship</ActionLabel>
								</QuickAction>

								<QuickAction>
									<ActionIcon>🔍</ActionIcon>
									<ActionLabel>Track</ActionLabel>
								</QuickAction>

								<QuickAction>
									<ActionIcon>📋</ActionIcon>
									<ActionLabel>Manage</ActionLabel>
								</QuickAction>
							</QuickActions>

							<LoginSection>
								<LoginDescription>
									Click below to begin your secure login journey. We'll evaluate your login attempt
									in real-time to provide the appropriate level of security.
								</LoginDescription>
								<LoginButton onClick={() => {}}>🔒 Begin Secure Login →</LoginButton>
							</LoginSection>
						</LoginContainer>
					</MainContent>
				) : (
					<>
						<FullWidthHeader>
							<HeaderContent>
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
							</HeaderContent>
						</FullWidthHeader>
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
					</>
				)}
			</HeroContent>
		</HeroContainer>
	);
};

export default FedExAirlinesHero;
