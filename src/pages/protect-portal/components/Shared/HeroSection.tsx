/**
 * @file HeroSection.tsx
 * @module protect-portal/components/Shared
 * @description Configurable hero section component with industry-specific experiences
 * @version 9.11.66
 * @since 2026-02-15
 *
 * Universal hero section that adapts to different company styles and provides authentic industry experiences.
 */

import React from 'react';
import {
	FiArrowRight,
	FiAward,
	FiCalendar,
	FiCheckCircle,
	FiCode,
	FiCreditCard,
	FiGlobe,
	FiLock,
	FiMapPin,
	FiPackage,
	FiSearch,
	FiShield,
	FiStar,
	FiTrendingUp,
	FiUsers,
} from 'react-icons/fi';
import styled from 'styled-components';
import type { CorporatePortalConfig } from '../../types/CorporatePortalConfig';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const HeroSectionStyled = styled.section<{
	$brandColor: string;
	$brandSecondary: string;
	$pattern: string;
}>`
  background: ${({ $pattern, $brandColor, $brandSecondary }) => {
		switch ($pattern) {
			case 'gradient-light':
				return `linear-gradient(135deg, ${$brandColor}15 0%, ${$brandSecondary}10 100%)`;
			case 'gradient-medium':
				return `linear-gradient(135deg, ${$brandColor}25 0%, ${$brandSecondary}20 100%)`;
			case 'gradient-dark':
				return `linear-gradient(135deg, ${$brandColor}35 0%, ${$brandSecondary}30 100%)`;
			default:
				return `linear-gradient(135deg, ${$brandColor}25 0%, ${$brandSecondary}20 100%)`;
		}
	}};
  padding: 4rem 2rem;
  min-height: 500px;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="%23ffffff" fill-opacity="0.05"><circle cx="30" cy="30" r="4"/></g></svg>');
    opacity: 0.3;
  }
`;

const HeroContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const HeroSubtitle = styled.p<{ $tone: string }>`
  font-size: ${({ $tone }) => ($tone === 'friendly' ? '1.125rem' : '1.25rem')};
  margin: 0 0 2rem 0;
  line-height: 1.6;
  color: #000000;
  opacity: 0.9;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const LoginAction = styled.div<{ $pattern: string }>`
  margin-top: 2rem;
  
  ${({ $pattern }) =>
		$pattern === 'embedded' &&
		`
    display: none;
  `}
`;

const LoginButton = styled.button<{ $brandColor: string; $accentColor: string; $tone: string }>`
  background: ${({ $brandColor }) => $brandColor};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const Tagline = styled.div<{ $tone: string }>`
  font-size: ${({ $tone }) => ($tone === 'friendly' ? '1rem' : '1.125rem')};
  font-weight: ${({ $tone }) => ($tone === 'friendly' ? '500' : '600')};
  margin: 0 0 3rem 0;
  line-height: 1.5;
  color: #000000;
`;

// Industry-specific hero components
const BankingHero = styled.div<{ $brandColor: string }>`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const BankingContent = styled.div`
  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #000000;
    margin: 0 0 1rem 0;
    line-height: 1.2;
    
    @media (max-width: 768px) {
      font-size: 2rem;
    }
  }
  
  p {
    font-size: 1.125rem;
    color: rgba(0, 0, 0, 0.9);
    margin: 0 0 2rem 0;
    line-height: 1.6;
  }
`;

const BankingFeatures = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin: 2rem 0;
`;

const BankingFeature = styled.div<{ $brandColor: string }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  border-left: 4px solid ${({ $brandColor }) => $brandColor};
  
  .icon {
    color: ${({ $brandColor }) => $brandColor};
    font-size: 1.25rem;
  }
  
  .text {
    flex: 1;
    
    h4 {
      color: #000000;
      font-size: 0.875rem;
      font-weight: 600;
      margin: 0 0 0.25rem 0;
    }
    
    p {
      color: rgba(0, 0, 0, 0.8);
      font-size: 0.75rem;
      margin: 0;
    }
  }
`;

const BankingVisual = styled.div<{ $brandColor: string }>`
  position: relative;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg, ${({ $brandColor }) => $brandColor}, transparent);
    border-radius: 16px;
    z-index: -1;
  }
  
  .visual-content {
    text-align: center;
    color: white;
    
    .icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      color: ${({ $brandColor }) => $brandColor};
    }
    
    h3 {
      font-size: 1.5rem;
      margin: 0 0 0.5rem 0;
    }
    
    p {
      font-size: 0.875rem;
      opacity: 0.9;
      margin: 0;
    }
  }
`;

const AirlineHero = styled.div<{ $brandColor: string }>`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const FlightSearch = styled.div<{ $brandColor: string }>`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  
  h2 {
    color: ${({ $brandColor }) => $brandColor};
    font-size: 1.5rem;
    margin: 0 0 1.5rem 0;
    text-align: center;
  }
  
  .search-form {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
    
    .form-group {
      label {
        display: block;
        color: #374151;
        font-size: 0.875rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
      }
      
      input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 1rem;
        
        &:focus {
          outline: none;
          border-color: ${({ $brandColor }) => $brandColor};
          box-shadow: 0 0 0 3px ${({ $brandColor }) => $brandColor}20;
        }
      }
    }
    
    .search-button {
      grid-column: 1 / -1;
      background: ${({ $brandColor }) => $brandColor};
      color: white;
      border: none;
      border-radius: 8px;
      padding: 1rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
      }
    }
  }
`;

const AirlineContent = styled.div`
  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: white;
    margin: 0 0 1rem 0;
    line-height: 1.2;
    
    @media (max-width: 768px) {
      font-size: 2rem;
    }
  }
  
  p {
    font-size: 1.125rem;
    color: rgba(255, 255, 255, 0.9);
    margin: 0 0 2rem 0;
    line-height: 1.6;
  }
  
  .features {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin: 2rem 0;
    
    .feature {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: white;
      
      .icon {
        color: ${({ $brandColor }) => $brandColor};
        font-size: 1.25rem;
      }
      
      .text {
        font-size: 0.875rem;
        line-height: 1.4;
      }
    }
  }
`;

const LogisticsHero = styled.div<{ $brandColor: string }>`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const TrackingInterface = styled.div<{ $brandColor: string }>`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  
  h2 {
    color: ${({ $brandColor }) => $brandColor};
    font-size: 1.5rem;
    margin: 0 0 1.5rem 0;
    text-align: center;
  }
  
  .tracking-form {
    .form-group {
      margin-bottom: 1rem;
      
      label {
        display: block;
        color: #374151;
        font-size: 0.875rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
      }
      
      input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 1rem;
        
        &:focus {
          outline: none;
          border-color: ${({ $brandColor }) => $brandColor};
          box-shadow: 0 0 0 3px ${({ $brandColor }) => $brandColor}20;
        }
      }
    }
    
    .buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      
      button {
        background: ${({ $brandColor }) => $brandColor};
        color: white;
        border: none;
        border-radius: 8px;
        padding: 0.75rem;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        transition: all 0.2s ease;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        }
        
        &.secondary {
          background: white;
          color: ${({ $brandColor }) => $brandColor};
          border: 1px solid ${({ $brandColor }) => $brandColor};
          
          &:hover {
            background: ${({ $brandColor }) => $brandColor}10;
          }
        }
      }
    }
  }
`;

const TechHero = styled.div<{ $brandColor: string }>`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const TechContent = styled.div`
  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: white;
    margin: 0 0 1rem 0;
    line-height: 1.2;
    
    @media (max-width: 768px) {
      font-size: 2rem;
    }
  }
  
  p {
    font-size: 1.125rem;
    color: rgba(255, 255, 255, 0.9);
    margin: 0 0 2rem 0;
    line-height: 1.6;
  }
  
  .tech-features {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin: 2rem 0;
    
    .feature {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      border-left: 4px solid ${({ $brandColor }) => $brandColor};
      
      .icon {
        color: ${({ $brandColor }) => $brandColor};
        font-size: 1.25rem;
      }
      
      .text {
        flex: 1;
        color: white;
        
        h4 {
          font-size: 0.875rem;
          font-weight: 600;
          margin: 0 0 0.25rem 0;
        }
        
        p {
          font-size: 0.75rem;
          opacity: 0.8;
          margin: 0;
        }
      }
    }
  }
`;

const TechVisual = styled.div<{ $brandColor: string }>`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
  color: white;
  
  .icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: ${({ $brandColor }) => $brandColor};
  }
  
  h3 {
    font-size: 1.5rem;
    margin: 0 0 0.5rem 0;
  }
  
  p {
    font-size: 0.875rem;
    opacity: 0.9;
    margin: 0;
  }
`;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface HeroSectionProps {
	config: CorporatePortalConfig;
	onLoginClick: () => void;
	currentStep?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({
	config,
	onLoginClick,
	currentStep = 'portal-home',
}) => {
	const brandColor = config.branding.colors.primary;
	const accentColor = config.branding.colors.accent;
	const brandSecondary = config.branding.colors.secondary || brandColor;
	const loginPattern = config.login.pattern;
	const tone = config.content.tone || 'corporate';

	// Get background pattern based on login pattern
	const getBackgroundPattern = () => {
		switch (loginPattern) {
			case 'embedded':
				return 'gradient-light';
			case 'dropdown':
				return 'gradient-medium';
			case 'right-popout':
				return 'gradient-dark';
			case 'new-page':
				return 'gradient-medium';
			case 'two-step-otp':
				return 'gradient-dark';
			default:
				return 'gradient-medium';
		}
	};

	// Render industry-specific hero content
	const renderIndustryHero = () => {
		switch (config.company.industry) {
			case 'banking':
				return (
					<BankingHero $brandColor={brandColor}>
						<BankingContent>
							<h1>Bank confidently with industry-standard security</h1>
							<p>
								Manage your accounts, pay bills, transfer money, and access powerful financial tools
								all in one secure place. Your information is protected with advanced encryption and
								multi-factor authentication.
							</p>
							<BankingFeatures>
								<BankingFeature $brandColor={brandColor}>
									<div className="icon">
										<FiShield />
									</div>
									<div className="text">
										<h4>Advanced Security</h4>
										<p>Bank with confidence using our security features</p>
									</div>
								</BankingFeature>
								<BankingFeature $brandColor={brandColor}>
									<div className="icon">
										<FiCreditCard />
									</div>
									<div className="text">
										<h4>Digital Wallet</h4>
										<p>Manage cards and digital payment options</p>
									</div>
								</BankingFeature>
								<BankingFeature $brandColor={brandColor}>
									<div className="icon">
										<FiTrendingUp />
									</div>
									<div className="text">
										<h4>Investing Tools</h4>
										<p>Build wealth with automated investing options</p>
									</div>
								</BankingFeature>
								<BankingFeature $brandColor={brandColor}>
									<div className="icon">
										<FiCheckCircle />
									</div>
									<div className="text">
										<h4>Bill Pay</h4>
										<p>Pay bills easily and set up recurring payments</p>
									</div>
								</BankingFeature>
							</BankingFeatures>
							<LoginAction $pattern={loginPattern}>
								<LoginButton
									onClick={onLoginClick}
									$brandColor={brandColor}
									$accentColor={accentColor}
									$tone={tone}
								>
									<FiLock />
									{loginPattern === 'new-page'
										? `Go to ${config.content.customerTerminology ? 'Customer' : 'Employee'} Login`
										: `${config.content.customerTerminology ? 'Customer' : 'Employee'} Login`}
									<FiArrowRight />
								</LoginButton>
							</LoginAction>
						</BankingContent>
						<BankingVisual $brandColor={brandColor}>
							<div className="visual-content">
								<div className="icon">
									<FiShield />
								</div>
								<h3>Online Banking</h3>
								<p>Secure, convenient, and designed for you</p>
							</div>
						</BankingVisual>
					</BankingHero>
				);

			case 'aviation':
				return (
					<AirlineHero $brandColor={brandColor}>
						<AirlineContent>
							<h1>Book your next adventure with confidence</h1>
							<p>
								Search flights, manage your trips, check in, and access your loyalty program all in
								one place. Enjoy exclusive deals and seamless travel planning.
							</p>
							<div className="features">
								<div className="feature">
									<div className="icon">
										<FiAward />
									</div>
									<div className="text">Earn miles on every flight</div>
								</div>
								<div className="feature">
									<div className="icon">
										<FiMapPin />
									</div>
									<div className="text">Track flight status in real-time</div>
								</div>
								<div className="feature">
									<div className="icon">
										<FiCalendar />
									</div>
									<div className="text">Manage your travel calendar</div>
								</div>
								<div className="feature">
									<div className="icon">
										<FiStar />
									</div>
									<div className="text">Access premium benefits</div>
								</div>
							</div>
							<LoginAction $pattern={loginPattern}>
								<LoginButton
									onClick={onLoginClick}
									$brandColor={brandColor}
									$accentColor={accentColor}
									$tone={tone}
								>
									<FiLock />
									{loginPattern === 'new-page'
										? `Go to ${config.content.customerTerminology ? 'Customer' : 'Employee'} Login`
										: `${config.content.customerTerminology ? 'Customer' : 'Employee'} Login`}
									<FiArrowRight />
								</LoginButton>
							</LoginAction>
						</AirlineContent>
						<FlightSearch $brandColor={brandColor}>
							<h2>Search Flights</h2>
							<div className="search-form">
								<div className="form-group">
									<label htmlFor="from">From</label>
									<input id="from" type="text" placeholder="Departure city" />
								</div>
								<div className="form-group">
									<label htmlFor="to">To</label>
									<input id="to" type="text" placeholder="Destination city" />
								</div>
								<div className="form-group">
									<label htmlFor="departure">Departure</label>
									<input id="departure" type="date" />
								</div>
								<div className="form-group">
									<label htmlFor="return">Return</label>
									<input id="return" type="date" />
								</div>
								<button type="button" className="search-button">
									<FiSearch />
									Search Flights
								</button>
							</div>
						</FlightSearch>
					</AirlineHero>
				);

			case 'logistics':
				return (
					<LogisticsHero $brandColor={brandColor}>
						<div className="content">
							<h1>Ship, manage, track, deliver</h1>
							<p>
								Whether you're shipping or receiving, you've got support. Create shipments, track
								packages, and manage your logistics with our comprehensive shipping tools.
							</p>
							<LoginAction $pattern={loginPattern}>
								<LoginButton
									onClick={onLoginClick}
									$brandColor={brandColor}
									$accentColor={accentColor}
									$tone={tone}
								>
									<FiLock />
									{loginPattern === 'new-page'
										? `Go to ${config.content.customerTerminology ? 'Customer' : 'Employee'} Login`
										: `${config.content.customerTerminology ? 'Customer' : 'Employee'} Login`}
									<FiArrowRight />
								</LoginButton>
							</LoginAction>
						</div>
						<TrackingInterface $brandColor={brandColor}>
							<h2>Track Your Package</h2>
							<div className="tracking-form">
								<div className="form-group">
									<label htmlFor="tracking">Tracking Number</label>
									<input id="tracking" type="text" placeholder="Enter tracking number" />
								</div>
								<div className="buttons">
									<button type="button">
										<FiSearch />
										Track
									</button>
									<button type="button" className="secondary">
										<FiPackage />
										Ship
									</button>
								</div>
							</div>
						</TrackingInterface>
					</LogisticsHero>
				);

			case 'tech':
				return (
					<TechHero $brandColor={brandColor}>
						<TechContent>
							<h1>Identity security for the digital enterprise</h1>
							<p>
								Protect your digital assets with enterprise-grade identity solutions. Secure access,
								streamline authentication, and ensure compliance across your organization.
							</p>
							<div className="tech-features">
								<div className="feature">
									<div className="icon">
										<FiShield />
									</div>
									<div className="text">
										<h4>Advanced Security</h4>
										<p>Multi-factor authentication and threat protection</p>
									</div>
								</div>
								<div className="feature">
									<div className="icon">
										<FiCode />
									</div>
									<div className="text">
										<h4>Developer Tools</h4>
										<p>APIs and SDKs for seamless integration</p>
									</div>
								</div>
								<div className="feature">
									<div className="icon">
										<FiUsers />
									</div>
									<div className="text">
										<h4>User Management</h4>
										<p>Comprehensive identity and access management</p>
									</div>
								</div>
								<div className="feature">
									<div className="icon">
										<FiGlobe />
									</div>
									<div className="text">
										<h4>Global Scale</h4>
										<p>Worldwide coverage with localized support</p>
									</div>
								</div>
							</div>
							<LoginAction $pattern={loginPattern}>
								<LoginButton
									onClick={onLoginClick}
									$brandColor={brandColor}
									$accentColor={accentColor}
									$tone={tone}
								>
									<FiLock />
									{loginPattern === 'new-page'
										? `Go to ${config.content.customerTerminology ? 'Customer' : 'Employee'} Login`
										: `${config.content.customerTerminology ? 'Customer' : 'Employee'} Login`}
									<FiArrowRight />
								</LoginButton>
							</LoginAction>
						</TechContent>
						<TechVisual $brandColor={brandColor}>
							<div className="icon">
								<FiShield />
							</div>
							<h3>Enterprise Security</h3>
							<p>Protect your digital identity with confidence</p>
						</TechVisual>
					</TechHero>
				);

			default:
				return (
					<HeroContent>
						<HeroSubtitle $tone={tone}>{config.content.heroSubtitle}</HeroSubtitle>

						{config.content.tagline && <Tagline $tone={tone}>{config.content.tagline}</Tagline>}

						<LoginAction $pattern={loginPattern}>
							<LoginButton
								onClick={onLoginClick}
								$brandColor={brandColor}
								$accentColor={accentColor}
								$tone={tone}
							>
								<FiLock />
								{loginPattern === 'new-page'
									? `Go to ${config.content.customerTerminology ? 'Customer' : 'Employee'} Login`
									: `${config.content.customerTerminology ? 'Customer' : 'Employee'} Login`}
								<FiArrowRight />
							</LoginButton>
						</LoginAction>
					</HeroContent>
				);
		}
	};

	// Show different content based on current step
	if (currentStep !== 'portal-home') {
		return (
			<HeroSectionStyled
				$brandColor={brandColor}
				$brandSecondary={brandSecondary}
				$pattern={getBackgroundPattern()}
			>
				<HeroContent>
					<HeroSubtitle $tone={tone}>
						Complete your secure authentication with {config.company.displayName}
					</HeroSubtitle>
				</HeroContent>
			</HeroSectionStyled>
		);
	}

	return (
		<HeroSectionStyled
			$brandColor={brandColor}
			$brandSecondary={brandSecondary}
			$pattern={getBackgroundPattern()}
		>
			{renderIndustryHero()}
		</HeroSectionStyled>
	);
};

export default HeroSection;
