/**
 * @file PingIdentityHero.tsx
 * @module protect-portal/components
 * @description PingIdentity hero section for identity and access management
 * @version 9.6.5
 * @since 2026-02-16
 *
 * This component provides a PingIdentity-style hero section that showcases
 * identity and access management capabilities with enterprise security features.
 */

import React from 'react';
import {
	FiArrowRight,
	FiDatabase,
	FiKey,
	FiLock,
	FiSettings,
	FiShield,
	FiUsers,
} from 'react-icons/fi';
import styled from 'styled-components';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const HeroContainer = styled.section`
  background: #ffffff;
  padding: 4rem 2rem;
  text-align: center;
  color: #1e293b;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(180deg, rgba(0, 102, 204, 0.05) 0%, rgba(0, 102, 204, 0.01) 100%);
    opacity: 1;
  }
  
  @media (max-width: 768px) {
    padding: 3rem 1rem;
  }
`;

const HeroContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const HeroTitle = styled.h1`
  font-size: 3.5rem;
  font-weight: 700;
  color: #0066cc;
  margin-bottom: 1.5rem;
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.25rem;
  color: #64748b;
  margin-bottom: 3rem;
  line-height: 1.6;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const QuickActions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
`;

const QuickAction = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 102, 204, 0.15);
    border-color: #0066cc;
  }
`;

const ActionIcon = styled.div`
  width: 48px;
  height: 48px;
  background: #e6f2ff;
  border: 1px solid #bfdbfe;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0066cc;
  font-size: 1.25rem;
`;

const ActionLabel = styled.div`
  font-size: 0.875rem;
  color: #1e3a8a;
  font-weight: 500;
  margin-top: 0.5rem;
`;

const LoginSection = styled.div`
  margin-top: 3rem;
  text-align: center;
`;

const LoginDescription = styled.p`
  font-size: 1.125rem;
  color: #334155;
  margin-bottom: 2rem;
  line-height: 1.6;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const LoginButton = styled.button`
  background: var(--brand-primary);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 1rem 2rem;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  margin: 0 auto;
  
  &:hover {
    background: #0052a3;
    transform: translateY(-1px);
  }
`;

const FeaturesSection = styled.div`
  margin-top: 4rem;
  padding: 3rem 2rem;
  background: #f8fafc;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
`;

const FeaturesTitle = styled.h2`
  font-size: 2rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 2rem;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  text-align: left;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const FeatureIcon = styled.div`
  width: 48px;
  height: 48px;
  background: #e6f2ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0066cc;
  font-size: 1.25rem;
  margin-bottom: 1rem;
`;

const FeatureTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
`;

const FeatureDescription = styled.p`
  color: #64748b;
  line-height: 1.6;
`;

// ============================================================================
// COMPONENT
// ============================================================================

interface PingIdentityHeroProps {
	currentStep?: string;
	onLoginStart?: () => void;
}

const PingIdentityHero: React.FC<PingIdentityHeroProps> = ({
	currentStep = 'portal-home',
	onLoginStart,
}) => {
	return (
		<>
			<HeroContainer>
				<HeroContent>
					{currentStep === 'portal-home' ? (
						<>
							<HeroTitle>Secure Digital Identity</HeroTitle>
							<HeroSubtitle>
								Enterprise-grade identity and access management for modern applications
							</HeroSubtitle>

							<QuickActions>
								<QuickAction>
									<ActionIcon>
										<FiShield />
									</ActionIcon>
									<ActionLabel>Security</ActionLabel>
								</QuickAction>

								<QuickAction>
									<ActionIcon>
										<FiUsers />
									</ActionIcon>
									<ActionLabel>Users</ActionLabel>
								</QuickAction>

								<QuickAction>
									<ActionIcon>
										<FiKey />
									</ActionIcon>
									<ActionLabel>Access</ActionLabel>
								</QuickAction>

								<QuickAction>
									<ActionIcon>
										<FiDatabase />
									</ActionIcon>
									<ActionLabel>Directory</ActionLabel>
								</QuickAction>
							</QuickActions>

							<LoginSection>
								<LoginDescription>
									Click below to begin your secure authentication journey. We'll evaluate your login
									attempt in real-time to provide the appropriate level of security based on risk
									assessment.
								</LoginDescription>
								<LoginButton onClick={onLoginStart}>
									<FiLock />
									Begin Secure Login
									<FiArrowRight />
								</LoginButton>
							</LoginSection>
						</>
					) : (
						<>
							<HeroTitle>Secure Identity Portal</HeroTitle>
							<HeroSubtitle>
								Access your PingIdentity services with enterprise-grade security and multi-factor
								authentication
							</HeroSubtitle>

							<LoginSection>
								<LoginDescription>
									Click below to access your secure identity portal. Multi-factor authentication may
									be required based on your security profile and access requirements.
								</LoginDescription>
								<LoginButton onClick={onLoginStart}>
									<FiLock />
									Sign In to Identity Portal
									<FiArrowRight />
								</LoginButton>
							</LoginSection>
						</>
					)}
				</HeroContent>
			</HeroContainer>

			{currentStep === 'portal-home' && (
				<FeaturesSection>
					<FeaturesTitle>Enterprise Identity Solutions</FeaturesTitle>
					<FeaturesGrid>
						<FeatureCard>
							<FeatureIcon>
								<FiShield />
							</FeatureIcon>
							<FeatureTitle>Advanced Security</FeatureTitle>
							<FeatureDescription>
								Multi-factor authentication, risk-based access control, and adaptive security
								policies
							</FeatureDescription>
						</FeatureCard>

						<FeatureCard>
							<FeatureIcon>
								<FiUsers />
							</FeatureIcon>
							<FeatureTitle>User Management</FeatureTitle>
							<FeatureDescription>
								Centralized user directory, self-service password reset, and lifecycle management
							</FeatureDescription>
						</FeatureCard>

						<FeatureCard>
							<FeatureIcon>
								<FiKey />
							</FeatureIcon>
							<FeatureTitle>Single Sign-On</FeatureTitle>
							<FeatureDescription>
								Seamless access to all applications with one set of credentials across your
								enterprise
							</FeatureDescription>
						</FeatureCard>

						<FeatureCard>
							<FeatureIcon>
								<FiDatabase />
							</FeatureIcon>
							<FeatureTitle>Directory Integration</FeatureTitle>
							<FeatureDescription>
								Connect with existing directories and sync user data across your organization
							</FeatureDescription>
						</FeatureCard>

						<FeatureCard>
							<FeatureIcon>
								<FiSettings />
							</FeatureIcon>
							<FeatureTitle>API Security</FeatureTitle>
							<FeatureDescription>
								OAuth 2.0, OpenID Connect, and API access management for modern applications
							</FeatureDescription>
						</FeatureCard>

						<FeatureCard>
							<FeatureIcon>
								<FiLock />
							</FeatureIcon>
							<FeatureTitle>Risk Assessment</FeatureTitle>
							<FeatureDescription>
								Real-time threat detection and behavioral analytics for enhanced security
							</FeatureDescription>
						</FeatureCard>
					</FeaturesGrid>
				</FeaturesSection>
			)}
		</>
	);
};

export default PingIdentityHero;
