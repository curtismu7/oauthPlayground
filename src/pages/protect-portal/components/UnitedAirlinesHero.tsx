/**
 * @file UnitedAirlinesHero.tsx
 * @module protect-portal/components
 * @description United Airlines hero section matching united.com style
 * @version 9.6.5
 * @since 2026-02-13
 *
 * This component provides a United Airlines-style hero section
 * that matches the actual United Airlines website design and functionality.
 */

import React from 'react';
import { FiGlobe, FiLock, FiMapPin, FiSend } from 'react-icons/fi';
import styled from 'styled-components';
import type { LoginContext, PortalError, UserContext } from '../types/protectPortal.types';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const HeroContainer = styled.section`
  background: linear-gradient(135deg, #0033A0 0%, #002880 100%);
  padding: 3rem 2rem;
  text-align: center;
  color: white;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23dots)"/></svg>');
    opacity: 0.3;
  }
`;

const HeroContent = styled.div`
  max-width: 900px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const HeroTitle = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  line-height: 1.2;
  font-family: 'United', 'Helvetica Neue', Arial, sans-serif;
  color: white;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.25rem;
  margin: 0 0 3rem 0;
  line-height: 1.6;
  opacity: 0.9;
  font-family: 'United', 'Helvetica Neue', Arial, sans-serif;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const GlobalFeatures = styled.div`
  display: flex;
  justify-content: center;
  gap: 3rem;
  margin: 3rem 0;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 2rem;
  }
`;

const GlobalFeature = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  max-width: 200px;
`;

const GlobeIcon = styled.div`
  width: 80px;
  height: 80px;
  background: rgba(255, 102, 0, 0.1);
  border: 3px solid #FF6600;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: -5px;
    left: -5px;
    right: -5px;
    bottom: -5px;
    border: 1px solid rgba(255, 102, 0, 0.3);
    border-radius: 50%;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.7;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

const FeatureIcon = styled.div`
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
`;

const FeatureTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: white;
  text-align: center;
`;

const FeatureDescription = styled.p`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  text-align: center;
  line-height: 1.4;
`;

const RoutesList = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin: 2rem 0;
  flex-wrap: wrap;
`;

const Route = styled.span`
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  font-size: 0.875rem;
  color: white;
`;

const LoginSection = styled.div`
  margin-top: 3rem;
  text-align: center;
`;

const LoginDescription = styled.p`
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2rem;
  line-height: 1.6;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const LoginButton = styled.button`
  background: #FF6600;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 1rem 2rem;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s ease;
  font-family: 'United', 'Helvetica Neue', Arial, sans-serif;
  
  &:hover {
    background: #E55A00;
    transform: translateY(-1px);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.3);
  }
`;

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface UnitedAirlinesHeroProps {
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
// COMPONENT
// ============================================================================

const UnitedAirlinesHero: React.FC<UnitedAirlinesHeroProps> = ({
	currentStep = 'portal-home',
	onLoginStart,
	_onLoginSuccess,
	_onError,
	_environmentId,
	_clientId,
	_clientSecret,
	_redirectUri,
}) => {
	return (
		<HeroContainer>
			<HeroContent>
				<HeroTitle>United Airlines Employee Portal</HeroTitle>
				<HeroSubtitle>
					Connecting the world. Your gateway to global operations and employee resources
				</HeroSubtitle>

				<GlobalFeatures>
					<GlobalFeature>
						<GlobeIcon>
							<FiGlobe />
						</GlobeIcon>
						<FeatureTitle>Global Network</FeatureTitle>
						<FeatureDescription>Access routes and operations worldwide</FeatureDescription>
					</GlobalFeature>

					<GlobalFeature>
						<FeatureIcon>
							<FiSend />
						</FeatureIcon>
						<FeatureTitle>Fleet Operations</FeatureTitle>
						<FeatureDescription>Manage and monitor our aircraft fleet</FeatureDescription>
					</GlobalFeature>

					<GlobalFeature>
						<FeatureIcon>
							<FiMapPin />
						</FeatureIcon>
						<FeatureTitle>Route Planning</FeatureTitle>
						<FeatureDescription>Optimize routes and schedules</FeatureDescription>
					</GlobalFeature>
				</GlobalFeatures>

				<RoutesList>
					<Route>New York → London</Route>
					<Route>San Francisco → Tokyo</Route>
					<Route>Chicago → Hong Kong</Route>
					<Route>Los Angeles → Sydney</Route>
				</RoutesList>

				{currentStep === 'portal-home' ? (
					<LoginSection>
						<LoginDescription>
							Sign in to access your United Airlines employee portal with secure authentication
						</LoginDescription>
						<LoginButton onClick={onLoginStart}>
							<FiLock />
							Sign In to Employee Portal
						</LoginButton>
					</LoginSection>
				) : (
					<LoginSection>
						<LoginDescription>
							Complete your authentication with United's secure employee system
						</LoginDescription>
					</LoginSection>
				)}
			</HeroContent>
		</HeroContainer>
	);
};

export default UnitedAirlinesHero;
