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
import styled from 'styled-components';
import { FiArrowRight, FiLock, FiShield, FiUser, FiInfo, FiCheckCircle } from 'react-icons/fi';

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
  color: #1f2937;
  margin: 0 0 1rem 0;
  line-height: 1.2;
`;

const WelcomeSubtitle = styled.p`
  font-size: 1.25rem;
  color: #6b7280;
  margin: 0 0 2rem 0;
  line-height: 1.6;
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
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  border-radius: 1rem;
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
  color: #1f2937;
  margin: 0 0 0.25rem 0;
`;

const CompanyTagline = styled.p`
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
`;

const LoginSection = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 3rem;
`;

const LoginTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const LoginDescription = styled.p`
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
`;

const LoginButton = styled.button`
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 1rem 2rem;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
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
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: left;
  transition: all 0.2s ease;

  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
  }
`;

const FeatureIcon = styled.div<{ color: string }>`
  width: 48px;
  height: 48px;
  background: ${props => props.color};
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
  color: #1f2937;
  margin: 0 0 0.5rem 0;
`;

const FeatureDescription = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
`;

const EducationalSection = styled.div`
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 1rem;
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
  color: #1e40af;
  margin: 0;
`;

const EducationalDescription = styled.p`
  font-size: 1rem;
  color: #1e40af;
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
`;

const KeyPoints = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem 0;
`;

const KeyPoint = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.5;
`;

const KeyPointIcon = styled(FiCheckCircle)`
  color: #10b981;
  flex-shrink: 0;
  margin-top: 0.125rem;
`;

const LearnMoreLink = styled.a`
  color: #3b82f6;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.875rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.2s ease;

  &:hover {
    color: #2563eb;
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
  return (
    <HomeContainer>
      {/* Welcome Section */}
      <WelcomeSection>
        <CompanyBranding>
          <CompanyLogo>
            <FiShield />
          </CompanyLogo>
          <CompanyName>
            <CompanyTitle>SecureCorp Portal</CompanyTitle>
            <CompanyTagline>Enterprise Security Solutions</CompanyTagline>
          </CompanyName>
        </CompanyBranding>
        
        <WelcomeTitle>Welcome to Your Secure Portal</WelcomeTitle>
        <WelcomeSubtitle>
          Experience next-generation authentication with intelligent risk evaluation 
          and adaptive security measures tailored to your login context.
        </WelcomeSubtitle>
      </WelcomeSection>

      {/* Login Section */}
      <LoginSection>
        <LoginTitle>
          <FiUser />
          Secure Login
        </LoginTitle>
        <LoginDescription>
          Click below to begin your secure login journey. We'll evaluate your login 
          attempt in real-time to provide the appropriate level of security.
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
          <FeatureIcon color="#10b981">
            <FiShield />
          </FeatureIcon>
          <FeatureTitle>Risk-Based Authentication</FeatureTitle>
          <FeatureDescription>
            Intelligent risk evaluation analyzes your login patterns, device information, 
            and location to determine the appropriate security level.
          </FeatureDescription>
        </SecurityFeature>

        <SecurityFeature>
          <FeatureIcon color="#3b82f6">
            <FiLock />
          </FeatureIcon>
          <FeatureTitle>Multi-Factor Security</FeatureTitle>
          <FeatureDescription>
            When additional security is needed, we offer multiple authentication methods 
            including SMS, email, authenticator apps, and security keys.
          </FeatureDescription>
        </SecurityFeature>

        <SecurityFeature>
          <FeatureIcon color="#f59e0b">
            <FiUser />
          </FeatureIcon>
          <FeatureTitle>Seamless User Experience</FeatureTitle>
          <FeatureDescription>
          Low-risk logins proceed without interruption, while high-risk attempts are 
          appropriately challenged to maintain security without unnecessary friction.
          </FeatureDescription>
        </SecurityFeature>
      </SecurityFeatures>

      {/* Educational Section */}
      <EducationalSection>
        <EducationalHeader>
          <FiInfo style={{ color: '#3b82f6' }} />
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
        
        <LearnMoreLink 
          href={educationalContent.learnMore.url} 
          target="_blank" 
          rel="noopener noreferrer"
        >
          {educationalContent.learnMore.title}
          <FiArrowRight />
        </LearnMoreLink>
      </EducationalSection>
    </HomeContainer>
  );
};

export default PortalHome;
