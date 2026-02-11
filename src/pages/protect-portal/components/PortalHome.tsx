/**
 * @file PortalHome.tsx
 * @module protect-portal/components
 * @description Portal home component with corporate landing page
 * @version 9.6.5
 * @since 2026-02-10
 *
 * This component displays the corporate portal landing page with login button
 * and educational content about risk-based authentication.
 */

import React from 'react';
import { FiArrowRight, FiCheckCircle, FiInfo, FiLock, FiShield, FiUser } from 'react-icons/fi';
import styled from 'styled-components';
import { useBrandTheme } from '../themes/theme-provider';
import CompanySelector from './CompanySelector';

import type { EducationalContent } from '../types/protectPortal.types';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const HomeContainer = styled.div`
  width: 100%;
  max-width: 800px;
  text-align: center;
`;

const WelcomeSection = styled.div`
  margin-bottom: 3rem;
`;

const WelcomeTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--brand-text);
  margin: 0 0 1rem 0;
  line-height: 1.2;
  font-family: var(--brand-heading-font);
`;

const WelcomeSubtitle = styled.p`
  font-size: 1.25rem;
  color: var(--brand-text-secondary);
  margin: 0 0 2rem 0;
  line-height: 1.6;
  font-family: var(--brand-body-font);
`;

const CompanyBranding = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const CompanyLogo = styled.div`
  width: 80px;
  height: 80px;
  background: var(--brand-primary);
  border-radius: var(--brand-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
  font-weight: 700;
`;

const CompanyName = styled.div`
  text-align: left;
`;

const CompanyTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--brand-text);
  margin: 0 0 0.25rem 0;
  font-family: var(--brand-heading-font);
`;

const CompanyTagline = styled.p`
  font-size: 1rem;
  color: var(--brand-text-secondary);
  margin: 0;
  font-family: var(--brand-body-font);
`;

const LoginSection = styled.div`
  background: var(--brand-surface);
  border: 1px solid var(--brand-text-secondary);
  border-radius: var(--brand-radius-lg);
  padding: 2rem;
  margin-bottom: 3rem;
`;

const LoginTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--brand-text);
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--brand-heading-font);
  justify-content: center;
  gap: 0.5rem;
`;

const LoginDescription = styled.p`
  font-size: 1rem;
  color: var(--brand-text-secondary);
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
  font-family: var(--brand-body-font);
`;

const LoginButton = styled.button`
  background: var(--brand-primary);
  color: white;
  border: none;
  border-radius: var(--brand-radius-md);
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--brand-transition);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--brand-body-font);

  &:hover {
    background: var(--brand-accent);
    transform: translateY(-2px);
    box-shadow: var(--brand-shadow-md);
  }

  &:active {
    transform: translateY(0);
  }
`;

const SecurityFeatures = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
`;

const SecurityFeature = styled.div`
  background: var(--brand-surface);
  border: 1px solid var(--brand-text-secondary);
  border-radius: var(--brand-radius-md);
  padding: 1.5rem;
  text-align: left;
  transition: var(--brand-transition);

  &:hover {
    border-color: var(--brand-primary);
    box-shadow: var(--brand-shadow-md);
  }
`;

const FeatureIcon = styled.div<{ color: string }>`
  width: 48px;
  height: 48px;
  background: ${(props) => props.color};
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
  margin-bottom: 1rem;
`;

const FeatureTitle = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--brand-text);
  margin: 0 0 0.5rem 0;
  font-family: var(--brand-heading-font);
`;

const FeatureDescription = styled.p`
  font-size: 0.875rem;
  color: var(--brand-text-secondary);
  margin: 0;
  line-height: 1.5;
  font-family: var(--brand-body-font);
`;

const EducationalSection = styled.div`
  background: var(--brand-surface);
  border: 1px solid var(--brand-primary);
  border-radius: var(--brand-radius-lg);
  padding: 2rem;
  text-align: left;
`;

const EducationalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const EducationalTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--brand-primary);
  margin: 0;
  font-family: var(--brand-heading-font);
`;

const EducationalDescription = styled.p`
  font-size: 1rem;
  color: var(--brand-primary);
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
  font-family: var(--brand-body-font);
`;

const KeyPoints = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const KeyPoint = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  color: var(--brand-text);
  line-height: 1.5;
  font-family: var(--brand-body-font);
`;

const KeyPointIcon = styled(FiCheckCircle)`
  color: var(--brand-success);
  flex-shrink: 0;
  margin-top: 0.125rem;
`;

const LearnMoreLink = styled.a`
  color: var(--brand-primary);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.875rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: var(--brand-transition);

  &:hover {
    color: var(--brand-accent);
    text-decoration: underline;
  }
`;

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface PortalHomeProps {
	onLoginStart: () => void;
	educationalContent: EducationalContent;
}

// ============================================================================
// COMPONENT
// ============================================================================

const PortalHome: React.FC<PortalHomeProps> = ({ onLoginStart, educationalContent }) => {
	const { activeTheme } = useBrandTheme();
	
	// Debug logging
	console.log('[🚀 PORTAL-HOME] Component rendering:', {
		activeTheme: activeTheme.name,
		onLoginStart: typeof onLoginStart,
		educationalContent: !!educationalContent,
	});
	
	return (
		<HomeContainer>
			{/* Company Selection */}
			<CompanySelector 
				onCompanyChange={(company) => {
					console.log('[🚀 PROTECT-PORTAL] Company selected:', company.name);
				}}
				selectedCompany={activeTheme.name}
			/>

			{/* Welcome Section */}
			<WelcomeSection>
				<CompanyBranding>
					<CompanyLogo>
						{activeTheme.brandSpecific.logo}
					</CompanyLogo>
					<CompanyName>
						<CompanyTitle>{activeTheme.displayName}</CompanyTitle>
						<CompanyTagline>{activeTheme.brandSpecific.messaging.welcome}</CompanyTagline>
					</CompanyName>
				</CompanyBranding>
				
				<WelcomeTitle>{activeTheme.brandSpecific.messaging.welcome}</WelcomeTitle>
				<WelcomeSubtitle>{activeTheme.brandSpecific.messaging.security}</WelcomeSubtitle>
			</WelcomeSection>

			{/* Login Section */}
			<LoginSection>
				<LoginTitle>
					<FiUser />
					Secure Login
				</LoginTitle>
				<LoginDescription>
					Click below to begin your secure login journey. We'll evaluate your login attempt in
					real-time to provide the appropriate level of security.
				</LoginDescription>
				<LoginButton onClick={onLoginStart}>
					<FiLock />
					Begin Secure Login
					<FiArrowRight />
				</LoginButton>
			</LoginSection>

			{/* Security Features */}
			<SecurityFeatures>
				<SecurityFeature>
					<FeatureIcon color="var(--brand-success)">
						<FiShield />
					</FeatureIcon>
					<FeatureTitle>Risk-Based Authentication</FeatureTitle>
					<FeatureDescription>
						Intelligent risk evaluation analyzes your login patterns, device information, and
						location to determine the appropriate security level.
					</FeatureDescription>
				</SecurityFeature>

				<SecurityFeature>
					<FeatureIcon color="var(--brand-primary)">
						<FiLock />
					</FeatureIcon>
					<FeatureTitle>Multi-Factor Security</FeatureTitle>
					<FeatureDescription>
						Advanced multi-factor authentication methods including device-based, biometric,
						and time-based one-time passwords for enhanced security.
					</FeatureDescription>
				</SecurityFeature>

				<SecurityFeature>
					<FeatureIcon color="var(--brand-warning)">
						<FiUser />
					</FeatureIcon>
					<FeatureTitle>Seamless User Experience</FeatureTitle>
					<FeatureDescription>
						Frictionless authentication experience with adaptive security that only
						intervenes when necessary, maintaining user convenience.
					</FeatureDescription>
				</SecurityFeature>
			</SecurityFeatures>

			{/* Educational Section */}
			<EducationalSection>
				<EducationalHeader>
					<FiInfo style={{ color: 'var(--brand-primary)' }} />
					<EducationalTitle>{educationalContent.title}</EducationalTitle>
				</EducationalHeader>
				<EducationalDescription>{educationalContent.description}</EducationalDescription>
				
				<KeyPoints>
					{educationalContent.keyPoints.map((point, index) => (
						<KeyPoint key={index}>
							<KeyPointIcon />
							{point}
						</KeyPoint>
					))}
				</KeyPoints>
				
				<LearnMoreLink href={educationalContent.learnMore.url} target="_blank" rel="noopener noreferrer">
					Learn More About {activeTheme.displayName} Security
					<FiArrowRight />
				</LearnMoreLink>
			</EducationalSection>
		</HomeContainer>
	);
};

export default PortalHome;
