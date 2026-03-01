/**
 * @file PortalHome.tsx
 * @module protect-portal/components
 * @description Portal home component with corporate landing page
 * @version 9.6.5
 * @since 2026-02-10
 *
 * This component displays the corporate portal landing page with company selector
 * and educational content about risk-based authentication.
 */

import { FiArrowRight, FiCheckCircle, FiLock, FiShield, FiUser } from '@icons';
import React from 'react';
import styled from 'styled-components';
import type { EducationalContent } from '../types/protectPortal.types';
import CompanySelector from './CompanySelector';
import PortalPageLayout, { PortalPageSection } from './PortalPageLayout';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const WelcomeSection = styled.div`
  text-align: center;
  margin-bottom: 4rem;
`;

const WelcomeIcon = styled.div`
  font-size: 4rem;
  color: var(--brand-primary);
  margin-bottom: 2rem;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const FeatureCard = styled.div`
  background: #f8fafc;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  border: 1px solid #e2e8f0;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const FeatureIcon = styled.div`
  font-size: 2.5rem;
  color: var(--brand-primary);
  margin-bottom: 1rem;
`;

const FeatureTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--brand-text);
  margin: 0 0 1rem 0;
`;

const FeatureDescription = styled.p`
  color: var(--brand-text-secondary);
  line-height: 1.6;
  margin: 0;
`;

const LoginSection = styled.div`
  text-align: center;
  padding: 3rem;
  background: linear-gradient(135deg, var(--brand-primary), var(--brand-primary-dark));
  border-radius: 16px;
  color: white;
`;

const LoginTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
`;

const LoginDescription = styled.p`
  margin: 0 0 2rem 0;
  opacity: 0.9;
  line-height: 1.6;
`;

const CompanySection = styled.div`
  margin-top: 2rem;
`;

const GoToLoginButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--brand-primary);
  color: white;
  border: none;
  border-radius: var(--brand-radius-md);
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--brand-transition);
  font-family: var(--brand-body-font);
  margin-top: 1.5rem;

  &:hover {
    background: var(--brand-primary-dark);
    transform: translateY(-2px);
    box-shadow: var(--brand-shadow-md);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--brand-primary-light);
  }
`;

// ============================================================================
// TYPES
// ============================================================================

interface PortalHomeProps {
	educationalContent: EducationalContent;
	onCompanySelect: (company: {
		id: string;
		name: string;
		description: string;
		logo: string;
		logoColor: string;
		logoBg: string;
		theme: string;
	}) => void;
	onGoToLogin: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

const PortalHome: React.FC<PortalHomeProps> = ({
	educationalContent,
	onCompanySelect,
	onGoToLogin,
}) => {
	return (
		<PortalPageLayout
			title="Welcome to the Protect Portal"
			subtitle="Experience next-generation security with intelligent risk-based authentication"
		>
			<PortalPageSection>
				<WelcomeSection>
					<WelcomeIcon>
						<FiShield />
					</WelcomeIcon>
					<h2>Enterprise-Grade Security Made Simple</h2>
					<p>
						Our protect portal demonstrates advanced authentication flows that adapt to risk levels,
						providing seamless security for your users while protecting your organization.
					</p>
				</WelcomeSection>

				<FeaturesGrid>
					<FeatureCard>
						<FeatureIcon>
							<FiShield />
						</FeatureIcon>
						<FeatureTitle>Intelligent Risk Assessment</FeatureTitle>
						<FeatureDescription>
							AI-powered risk evaluation analyzes user behavior, device characteristics, and
							contextual factors to determine appropriate security measures.
						</FeatureDescription>
					</FeatureCard>

					<FeatureCard>
						<FeatureIcon>
							<FiLock />
						</FeatureIcon>
						<FeatureTitle>Adaptive Authentication</FeatureTitle>
						<FeatureDescription>
							Dynamic authentication flows that scale security requirements based on real-time risk
							scores, from simple access to multi-factor verification.
						</FeatureDescription>
					</FeatureCard>

					<FeatureCard>
						<FeatureIcon>
							<FiUser />
						</FeatureIcon>
						<FeatureTitle>Seamless User Experience</FeatureTitle>
						<FeatureDescription>
							Frictionless authentication for trusted users while maintaining robust security for
							potentially risky access attempts.
						</FeatureDescription>
					</FeatureCard>
				</FeaturesGrid>
			</PortalPageSection>

			<PortalPageSection>
				<LoginSection>
					<LoginTitle>Ready to Experience Smart Security?</LoginTitle>
					<LoginDescription>
						Select your organization and begin your secure journey through our protect portal.
						Experience how risk-based authentication adapts to your security needs.
					</LoginDescription>

					<CompanySection>
						<CompanySelector onCompanyChange={onCompanySelect} />
					</CompanySection>

					<GoToLoginButton onClick={onGoToLogin}>
						<FiArrowRight />
						Go to Login
					</GoToLoginButton>
				</LoginSection>
			</PortalPageSection>

			<PortalPageSection
				title="Key Security Features"
				description="Learn about the advanced security capabilities powering our protect portal"
			>
				<FeaturesGrid>
					{educationalContent.keyPoints.map((point, index) => (
						<FeatureCard key={index}>
							<FeatureIcon>
								<FiCheckCircle />
							</FeatureIcon>
							<FeatureTitle>Security Feature {index + 1}</FeatureTitle>
							<FeatureDescription>{point}</FeatureDescription>
						</FeatureCard>
					))}
				</FeaturesGrid>
			</PortalPageSection>
		</PortalPageLayout>
	);
};

export default PortalHome;
