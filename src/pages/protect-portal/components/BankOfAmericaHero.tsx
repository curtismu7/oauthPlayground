/**
 * @file BankOfAmericaHero.tsx
 * @module protect-portal/components
 * @description Bank of America hero section with authentic banking portal styling
 * @version 9.6.5
 * @since 2026-02-11
 *
 * This component provides a Bank of America-specific hero section that matches
 * their actual online banking portal with proper branding and customer focus.
 */

import React from 'react';
import { FiDollarSign, FiLock, FiShield, FiUser } from 'react-icons/fi';
import styled from 'styled-components';
import { useBrandTheme } from '../themes/theme-provider';
import type { LoginContext, PortalError, UserContext } from '../types/protectPortal.types';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const HeroContainer = styled.section`
  background: linear-gradient(135deg, #012169 0%, #003d7a 100%);
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
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
    opacity: 0.5;
  }
`;

const HeroContent = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const HeroTitle = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  line-height: 1.2;
  font-family: 'Helvetica Neue', Arial, sans-serif;
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
  font-family: 'Helvetica Neue', Arial, sans-serif;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const SecurityFeatures = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin: 3rem 0;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const SecurityFeature = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }
`;

const FeatureIcon = styled.div`
  width: 60px;
  height: 60px;
  background: rgba(227, 24, 55, 0.1);
  border: 2px solid #E31837;
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
`;

const FeatureDescription = styled.p`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  text-align: center;
  line-height: 1.4;
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
  background: #E31837;
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
  font-family: 'Helvetica Neue', Arial, sans-serif;
  
  &:hover {
    background: #c11430;
    transform: translateY(-1px);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(227, 24, 55, 0.3);
  }
`;

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface BankOfAmericaHeroProps {
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

const BankOfAmericaHero: React.FC<BankOfAmericaHeroProps> = ({
	currentStep = 'portal-home',
	onLoginStart,
	_onLoginSuccess,
	_onError,
	_environmentId,
	_clientId,
	_clientSecret,
	_redirectUri,
}) => {
	const { activeTheme } = useBrandTheme();
	const isCustomer = activeTheme.content?.customerTerminology ?? true; // Default to customer terminology

	return (
		<HeroContainer>
			<HeroContent>
				<HeroTitle>Bank of America Secure Portal</HeroTitle>
				<HeroSubtitle>
					{isCustomer
						? 'Access your account with industry-leading security features and 24/7 monitoring'
						: 'Access your employee account with industry-leading security features and 24/7 monitoring'}
				</HeroSubtitle>

				<SecurityFeatures>
					<SecurityFeature>
						<FeatureIcon>
							<FiShield />
						</FeatureIcon>
						<FeatureTitle>Advanced Security</FeatureTitle>
						<FeatureDescription>
							Multi-layer authentication and real-time fraud monitoring
						</FeatureDescription>
					</SecurityFeature>

					<SecurityFeature>
						<FeatureIcon>
							<FiLock />
						</FeatureIcon>
						<FeatureTitle>Encrypted Access</FeatureTitle>
						<FeatureDescription>
							End-to-end encryption for all your sensitive data
						</FeatureDescription>
					</SecurityFeature>

					<SecurityFeature>
						<FeatureIcon>
							<FiUser />
						</FeatureIcon>
						<FeatureTitle>Identity Protection</FeatureTitle>
						<FeatureDescription>
							Biometric verification and identity theft protection
						</FeatureDescription>
					</SecurityFeature>

					<SecurityFeature>
						<FeatureIcon>
							<FiDollarSign />
						</FeatureIcon>
						<FeatureTitle>Secure Transactions</FeatureTitle>
						<FeatureDescription>
							Safe and secure financial transactions every time
						</FeatureDescription>
					</SecurityFeature>
				</SecurityFeatures>

				{currentStep === 'portal-home' ? (
					<LoginSection>
						<LoginDescription>
							{isCustomer
								? 'Sign in to access your secure customer portal with enhanced security features'
								: 'Sign in to access your secure employee portal with enhanced security features'}
						</LoginDescription>
						<LoginButton onClick={onLoginStart}>
							<FiLock />
							{isCustomer ? 'Sign In to Customer Portal' : 'Sign In to Employee Portal'}
						</LoginButton>
					</LoginSection>
				) : (
					<LoginSection>
						<LoginDescription>
							Complete your authentication with Bank of America's secure login system
						</LoginDescription>
					</LoginSection>
				)}
			</HeroContent>
		</HeroContainer>
	);
};

export default BankOfAmericaHero;
