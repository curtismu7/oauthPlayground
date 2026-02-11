/**
 * @file SouthwestAirlinesHero.tsx
 * @module protect-portal/components
 * @description Southwest Airlines hero section with authentic login page layout
 * @version 9.6.5
 * @since 2026-02-11
 *
 * This component provides a Southwest Airlines-specific hero section that matches
 * their actual login page layout with navigation, hero content, and login integration.
 */

import React from 'react';
import {
	FiCalendar,
	FiCheckCircle,
	FiCreditCard,
	FiGift,
	FiHeadphones,
	FiHeart,
	FiShield,
} from 'react-icons/fi';
import styled from 'styled-components';
import { useBrandTheme } from '../themes/theme-provider';
import type { LoginContext, PortalError, UserContext } from '../types/protectPortal.types';
import SouthwestAirlinesLoginForm from './SouthwestAirlinesLoginForm';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const HeroContainer = styled.div`
  width: 100%;
  background: white; /* Changed to mostly white background like real Southwest site */
  position: relative;
  overflow: hidden;
`;

const HeroBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #2E4BB1 0%, #1E3A8A 50%, #E51D23 100%);
  opacity: 0.05; /* Very subtle background, mostly white */
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 2;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Navigation = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #E5E7EB; /* Light border for white background */
  margin-bottom: 3rem;
  width: 100%;
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const LogoText = styled.div`
  color: #1E3A8A; /* Southwest blue text */
  font-size: 1.5rem;
  font-weight: 700;
  font-family: 'Benton Sans', 'Helvetica Neue', Arial, sans-serif;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
`;

const NavLink = styled.a`
  color: #4B5563; /* Dark gray text for white background */
  text-decoration: none;
  font-weight: 500;
  font-size: 0.875rem;
  transition: color 0.2s;
  font-family: 'Benton Sans', 'Helvetica Neue', Arial, sans-serif;

  &:hover {
    color: #E51D23; /* Southwest heart red on hover */
  }
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const LeftContent = styled.div`
  color: #1F2937; /* Dark text for white background */
`;

const HeroTitle = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  line-height: 1.2;
  color: #1E3A8A; /* Southwest blue title */
  font-family: 'Benton Sans', 'Helvetica Neue', Arial, sans-serif;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.25rem;
  margin-bottom: 2rem;
  color: #4B5563; /* Dark gray subtitle */
  line-height: 1.6;
  font-family: 'Benton Sans', 'Helvetica Neue', Arial, sans-serif;
`;

const Features = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Feature = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #6B7280; /* Medium gray for features */
`;

const FeatureIcon = styled.div`
  color: #E51D23; /* Southwest heart red */
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RightContent = styled.div`
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const LoginSection = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const LoginTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1E3A8A; /* Southwest blue */
  margin-bottom: 0.5rem;
  font-family: 'Benton Sans', 'Helvetica Neue', Arial, sans-serif;
`;

const LoginSubtitle = styled.p`
  color: #6B7280; /* Medium gray */
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
  font-family: 'Benton Sans', 'Helvetica Neue', Arial, sans-serif;
`;

const QuickLinks = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #E5E7EB;
`;

const QuickLink = styled.a`
  color: #2E4BB1; /* Southwest blue */
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 0.2s;
  font-family: 'Benton Sans', 'Helvetica Neue', Arial, sans-serif;

  &:hover {
    color: #E51D23; /* Southwest heart red on hover */
  }
`;

const TrustBadges = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #E5E7EB;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }
`;

const TrustBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6B7280; /* Medium gray */
  font-size: 0.875rem;
`;

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface SouthwestAirlinesHeroProps {
	className?: string;
	currentStep?: string;
	onLoginStart?: () => void;
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

const SouthwestAirlinesHero: React.FC<SouthwestAirlinesHeroProps> = ({
	className,
	currentStep,
	onLoginStart,
	onLoginSuccess,
	onError,
	environmentId,
	clientId,
	clientSecret,
	redirectUri,
}) => {
	const { activeTheme } = useBrandTheme();

	// Show different content based on current step
	if (currentStep && currentStep !== 'portal-home') {
		return (
			<HeroContainer className={className}>
				<HeroBackground />
				<HeroContent>
					<Navigation>
						<LogoSection>
							<LogoText>SOUTHWEST</LogoText>
						</LogoSection>
						<NavLinks>
							<NavLink href="#">Book</NavLink>
							<NavLink href="#">Check In</NavLink>
							<NavLink href="#">My Trips</NavLink>
							<NavLink href="#">Rapid Rewards</NavLink>
						</NavLinks>
					</Navigation>
					<MainContent>
						<LeftContent>
							<HeroTitle>Secure Employee Portal</HeroTitle>
							<HeroSubtitle>
								Access your Southwest Airlines employee account with enhanced security features.
							</HeroSubtitle>
							<Features>
								<Feature>
									<FeatureIcon>
										<FiShield />
									</FeatureIcon>
									<span>Enhanced Security</span>
								</Feature>
								<Feature>
									<FeatureIcon>
										<FiCheckCircle />
									</FeatureIcon>
									<span>Quick Access</span>
								</Feature>
							</Features>
						</LeftContent>
						<RightContent>
							<SouthwestAirlinesLoginForm
								onLoginSuccess={onLoginSuccess}
								onError={onError}
								environmentId={environmentId}
								clientId={clientId}
								clientSecret={clientSecret}
								redirectUri={redirectUri}
							/>
						</RightContent>
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
					<LeftContent>
						<HeroTitle>Transfarency. No Hidden Fees.</HeroTitle>
						<HeroSubtitle>
							Experience Southwest's legendary customer service with no change fees, no cancellation
							fees, and bags fly free®.
						</HeroSubtitle>

						<Features>
							<Feature>
								<FeatureIcon>
									<FiHeart />
								</FeatureIcon>
								<span>Bags Fly Free®</span>
							</Feature>
							<Feature>
								<FeatureIcon>
									<FiCreditCard />
								</FeatureIcon>
								<span>No Change Fees</span>
							</Feature>
							<Feature>
								<FeatureIcon>
									<FiCalendar />
								</FeatureIcon>
								<span>Flexible Booking</span>
							</Feature>
							<Feature>
								<FeatureIcon>
									<FiGift />
								</FeatureIcon>
								<span>Rapid Rewards</span>
							</Feature>
						</Features>

						<TrustBadges>
							<TrustBadge>
								<FiShield />
								<span>Secure Booking</span>
							</TrustBadge>
							<TrustBadge>
								<FiHeadphones />
								<span>24/7 Support</span>
							</TrustBadge>
							<TrustBadge>
								<FiCheckCircle />
								<span>Customer First</span>
							</TrustBadge>
						</TrustBadges>
					</LeftContent>

					<RightContent>
						<LoginSection>
							<LoginTitle>Employee Sign In</LoginTitle>
							<LoginSubtitle>Access your Southwest Airlines employee account</LoginSubtitle>
						</LoginSection>

						<SouthwestAirlinesLoginForm
							onLoginSuccess={onLoginSuccess}
							onError={onError}
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
					</RightContent>
				</MainContent>
			</HeroContent>
		</HeroContainer>
	);
};

export default SouthwestAirlinesHero;
