/**
 * @file UnitedAirlinesHero.tsx
 * @module protect-portal/components
 * @description United Airlines hero section matching authentic united.com style
 * @version 9.6.5
 * @since 2026-02-13
 *
 * This component provides an authentic United Airlines website experience
 * with proper navigation, branding, and customer portal access.
 */

import React, { useEffect, useRef, useState } from 'react';
import { FiLock, FiMail, FiMenu, FiSearch, FiUser, FiX } from '@icons';
import styled from 'styled-components';
import { useBrandTheme } from '../themes/theme-provider';
import type { LoginContext, PortalError, UserContext } from '../types/protectPortal.types';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const UnitedContainer = styled.div`
  min-height: 100vh;
  background: #ffffff;
  font-family: 'United', 'Helvetica Neue', Arial, sans-serif;
`;

const Navigation = styled.nav`
  background: #0033A0;
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const NavContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  height: 60px;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  
  .logo-text {
    color: white;
    text-decoration: none;
  }
  
  .logo-globe {
    width: 24px;
    height: 24px;
    margin-right: 0.5rem;
    background: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    color: #0033A0;
    font-weight: 700;
  }
`;

const UpdateStamp = styled.div`
  display: inline-block;
  margin: -1.5rem 0 2rem 0;
  padding: 0.4rem 0.7rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.35);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.02em;
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled.a`
  color: white;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.5rem 0;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  
  &:hover {
    border-bottom-color: white;
  }
`;

const RightNav = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const SearchButton = styled.button`
  background: none;
  border: none;
  color: white;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(255,255,255,0.1);
  }
`;

const MobileMenuButton = styled.button`
  background: none;
  border: none;
  color: white;
  padding: 0.5rem;
  cursor: pointer;
  display: none;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const HeroSection = styled.section`
  background: linear-gradient(135deg, #0033A0 0%, #002880 50%, #001f60 100%);
  padding: 4rem 2rem;
  text-align: center;
  color: white;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600"><defs><linearGradient id="unitedSky" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:rgba(255,255,255,0.1)"/><stop offset="100%" style="stop-color:rgba(255,255,255,0.05)"/></linearGradient><path d="M0,200 Q400,100 800,200 T1200,200 L1200,600 L0,600 Z" fill="url(%23unitedSky)" opacity="0.3"/><circle cx="300" cy="80" r="60" fill="rgba(255,255,255,0.05)"/><circle cx="900" cy="120" r="40" fill="rgba(255,255,255,0.03)"/></svg>');
    opacity: 0.4;
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
  font-size: 3rem;
  font-weight: 700;
  color: #ff4d4f;
  margin: 0 0 1rem 0;
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.25rem;
  color: #ffb3b3;
  margin: 0 0 3rem 0;
  line-height: 1.6;
  opacity: 0.9;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const EmployeePortalCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  margin: 0 auto;
  box-shadow: 0 8px 32px rgba(0,51,160,0.15);
  text-align: left;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
`;

const CardIcon = styled.div`
  width: 48px;
  height: 48px;
  background: #0033A0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  color: white;
  font-size: 1.2rem;
`;

const CardTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #0033A0;
  margin: 0;
`;

const CardDescription = styled.p`
  color: #666;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
`;

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const InputLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #333;
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #0033A0;
  }
`;

const LoginButton = styled.button`
  background: #FF6600;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
  
  &:hover {
    background: #E55A00;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const FeaturesSection = styled.section`
  padding: 4rem 2rem;
  background: #f8f9fa;
`;

const FeaturesContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const FeaturesTitle = styled.h2`
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
  color: #0033A0;
  margin: 0 0 3rem 0;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
`;

const FeatureCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  text-align: center;
`;

const FeatureIcon = styled.div`
  width: 64px;
  height: 64px;
  background: #0033A0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  color: white;
  font-size: 1.5rem;
`;

const FeatureTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #0033A0;
  margin: 0 0 1rem 0;
`;

const FeatureDescription = styled.p`
  color: #666;
  line-height: 1.6;
  margin: 0;
`;

// Dropdown Login Components (for mobile/tablet)
const LoginDropdown = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: white;
  border-bottom: 3px solid #0033A0;
  box-shadow: 0 4px 20px rgba(0, 51, 160, 0.15);
  z-index: 9999;
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  visibility: ${({ $isOpen }) => ($isOpen ? 'visible' : 'hidden')};
  transform: translateY(${({ $isOpen }) => ($isOpen ? '0' : '-100%')});
  transition: all 0.3s ease;
`;

const DropdownHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: #0033A0;
  color: white;
`;

const DropdownTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #ff4d4f;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const DropdownContent = styled.div`
  padding: 2rem;
  max-width: 400px;
  margin: 0 auto;
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
// MAIN COMPONENT
// ============================================================================

const UnitedAirlinesHero: React.FC<UnitedAirlinesHeroProps> = ({
	currentStep,
	onLoginStart,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_onLoginSuccess,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_onError,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_environmentId,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_clientId,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_clientSecret,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_redirectUri,
}) => {
	const { activeTheme } = useBrandTheme();
	const isCustomer = activeTheme.content?.customerTerminology ?? true; // Default to customer terminology
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const uiLastUpdated = '2026-02-15 4:19 PM CT';
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsDropdownOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const _handleLoginClick = () => {
		setIsDropdownOpen(true);
	};

	const handleCloseDropdown = () => {
		setIsDropdownOpen(false);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// Call the original login start function
		onLoginStart?.();
		// Close dropdown
		setIsDropdownOpen(false);
	};

	return (
		<>
			<UnitedContainer>
				<Navigation>
					<NavContainer>
						<Logo>
							<div className="logo-globe">U</div>
							<span className="logo-text">United Airlines</span>
						</Logo>
						<NavLinks>
							<NavLink href="#book">Book</NavLink>
							<NavLink href="#travel-info">Travel Info</NavLink>
							<NavLink href="#my-trips">My Trips</NavLink>
							<NavLink href="#mileageplus">MileagePlus</NavLink>
							<NavLink href="#deals">Deals</NavLink>
						</NavLinks>
						<RightNav>
							<SearchButton>
								<FiSearch size={20} />
							</SearchButton>
							<MobileMenuButton>
								<FiMenu size={20} />
							</MobileMenuButton>
						</RightNav>
					</NavContainer>
				</Navigation>

				<HeroSection>
					<HeroContent>
						<HeroTitle>
							{isCustomer ? 'United Airlines Customer Portal' : 'United Airlines Employee Portal'}
						</HeroTitle>
						<HeroSubtitle>
							{isCustomer
								? 'Connecting the world. Your gateway to global travel and customer services'
								: 'Connecting the world. Your gateway to global operations and employee resources'}
						</HeroSubtitle>
						<UpdateStamp>Last UI update: {uiLastUpdated}</UpdateStamp>

						{currentStep === 'portal-home' ? (
							<EmployeePortalCard>
								<CardHeader>
									<CardIcon>
										<FiLock />
									</CardIcon>
									<CardTitle>{isCustomer ? 'Customer Login' : 'Employee Login'}</CardTitle>
								</CardHeader>
								<CardDescription>
									{isCustomer
										? 'Access your United Airlines customer portal with secure authentication'
										: 'Access your United Airlines employee portal with secure authentication'}
								</CardDescription>
								<LoginForm onSubmit={handleSubmit}>
									<InputGroup>
										<InputLabel htmlFor="email">
											{isCustomer ? 'Customer Email' : 'Employee Email'}
										</InputLabel>
										<Input
											id="email"
											type="email"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											placeholder={isCustomer ? 'customer@united.com' : 'employee@united.com'}
											required
										/>
									</InputGroup>
									<InputGroup>
										<InputLabel htmlFor="password">Password</InputLabel>
										<Input
											id="password"
											type="password"
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											placeholder="Enter your password"
											required
										/>
									</InputGroup>
									<LoginButton type="submit">
										<FiLock />
										{isCustomer ? 'Sign In to Customer Portal' : 'Sign In to Employee Portal'}
									</LoginButton>
								</LoginForm>
							</EmployeePortalCard>
						) : (
							<EmployeePortalCard>
								<CardHeader>
									<CardIcon>
										<FiLock />
									</CardIcon>
									<CardTitle>Authentication in Progress</CardTitle>
								</CardHeader>
								<CardDescription>
									{isCustomer
										? "Complete your authentication with United's secure customer system"
										: "Complete your authentication with United's secure employee system"}
								</CardDescription>
							</EmployeePortalCard>
						)}
					</HeroContent>
				</HeroSection>

				<FeaturesSection>
					<FeaturesContainer>
						<FeaturesTitle>
							{isCustomer ? 'Customer Resources' : 'Employee Resources'}
						</FeaturesTitle>
						<FeaturesGrid>
							<FeatureCard>
								<FeatureIcon>
									<FiMail />
								</FeatureIcon>
								<FeatureTitle>
									{isCustomer ? 'Travel Communications' : 'Employee Communications'}
								</FeatureTitle>
								<FeatureDescription>
									{isCustomer
										? 'Access travel alerts, itinerary updates, and account notifications'
										: 'Access company announcements, policies, and internal communications'}
								</FeatureDescription>
							</FeatureCard>
							<FeatureCard>
								<FeatureIcon>
									<FiUser />
								</FeatureIcon>
								<FeatureTitle>{isCustomer ? 'Account Services' : 'HR Services'}</FeatureTitle>
								<FeatureDescription>
									{isCustomer
										? 'Manage your profile, preferences, and trip details securely'
										: 'Manage your benefits, schedule, and employee information'}
								</FeatureDescription>
							</FeatureCard>
							<FeatureCard>
								<FeatureIcon>
									<FiLock />
								</FeatureIcon>
								<FeatureTitle>Secure Access</FeatureTitle>
								<FeatureDescription>
									Multi-factor authentication and advanced security features
								</FeatureDescription>
							</FeatureCard>
						</FeaturesGrid>
					</FeaturesContainer>
				</FeaturesSection>
			</UnitedContainer>

			<LoginDropdown $isOpen={isDropdownOpen} ref={dropdownRef}>
				<DropdownHeader>
					<DropdownTitle>
						<FiLock />
						{isCustomer ? 'Customer Login' : 'Employee Login'}
					</DropdownTitle>
					<CloseButton onClick={handleCloseDropdown}>
						<FiX />
					</CloseButton>
				</DropdownHeader>
				<DropdownContent>
					<LoginForm onSubmit={handleSubmit}>
						<InputGroup>
							<InputLabel htmlFor="dropdown-email">
								{isCustomer ? 'Customer Email' : 'Employee Email'}
							</InputLabel>
							<Input
								id="dropdown-email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder={isCustomer ? 'customer@united.com' : 'employee@united.com'}
								required
							/>
						</InputGroup>
						<InputGroup>
							<InputLabel htmlFor="dropdown-password">Password</InputLabel>
							<Input
								id="dropdown-password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Enter your password"
								required
							/>
						</InputGroup>
						<LoginButton type="submit">Sign In</LoginButton>
					</LoginForm>
				</DropdownContent>
			</LoginDropdown>
		</>
	);
};

export default UnitedAirlinesHero;
