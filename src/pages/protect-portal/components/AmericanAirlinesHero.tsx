/**
 * @file AmericanAirlinesHero.tsx
 * @module protect-portal/components
 * @description American Airlines hero section matching AA.com style
 * @version 9.6.5
 * @since 2026-02-11
 *
 * This component provides an American Airlines-style hero section
 * that matches the actual AA.com website design and functionality.
 */

import React from 'react';
import { FiArrowRight, FiCalendar, FiLock, FiMapPin, FiSearch } from 'react-icons/fi';
import styled from 'styled-components';
import type { LoginContext, PortalError, UserContext } from '../types/protectPortal.types';
import AmericanAirlinesNavigation from './AmericanAirlinesNavigation';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const HeroContainer = styled.section`
  background: linear-gradient(135deg, #0b4aa2 0%, #073a80 50%, #053070 100%);
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
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600"><defs><linearGradient id="sky" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:rgba(255,255,255,0.1)"/><stop offset="100%" style="stop-color:rgba(255,255,255,0.05)"/></linearGradient><path d="M0,300 Q300,200 600,300 T1200,300 L1200,600 L0,600 Z" fill="url(%23sky)" opacity="0.3"/><circle cx="200" cy="100" r="80" fill="rgba(255,255,255,0.05)"/><circle cx="1000" cy="150" r="60" fill="rgba(255,255,255,0.03)"/></svg>');
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
  margin: 0 0 1rem 0;
  line-height: 1.2;
  font-family: var(--brand-heading-font);
  color: var(--brand-accent); /* American Airlines orange accent color */
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.25rem;
  margin: 0 0 2rem 0;
  line-height: 1.6;
  opacity: 0.9;
  font-family: var(--brand-body-font);
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const QuickActions = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin: 3rem 0;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const QuickAction = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const ActionIcon = styled.div`
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
`;

const ActionLabel = styled.div`
  font-size: 0.875rem;
  color: white;
  font-weight: 500;
  margin-top: 0.5rem;
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
  background: var(--brand-accent);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 1rem 2rem;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s ease;
  font-family: var(--brand-body-font);
  
  &:hover {
    background: #cc1429;
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const FlightSearchSection = styled.div`
  margin-top: 3rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const FlightSearchTitle = styled.h3`
  color: white;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const FlightSearchForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const TripType = styled.div`
  display: flex;
  gap: 2rem;
  justify-content: center;
  
  label {
    color: white;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    
    input[type="radio"] {
      accent-color: var(--brand-accent);
    }
  }
`;

const SearchInputs = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  font-weight: 500;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
  
  &:focus {
    outline: none;
    border-color: var(--brand-accent);
    background: rgba(255, 255, 255, 0.15);
  }
`;

const SearchButton = styled.button`
  background: var(--brand-accent);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  margin: 0 auto;
  
  &:hover {
    background: #c01830;
    transform: translateY(-1px);
  }
`;

// ============================================================================
// COMPONENT
// ============================================================================

interface AmericanAirlinesHeroProps {
	currentStep?: string;
	onLoginStart?: () => void;
	onLoginSuccess?: (userContext: UserContext, loginContext: LoginContext) => void;
	onError?: (error: PortalError) => void;
	environmentId?: string;
	clientId?: string;
	clientSecret?: string;
	redirectUri?: string;
}

const AmericanAirlinesHero: React.FC<AmericanAirlinesHeroProps> = ({
	currentStep = 'portal-home',
	onLoginStart,
	onLoginSuccess,
	onError,
	environmentId,
	clientId,
	clientSecret,
	redirectUri,
}) => {
	return (
		<HeroContainer>
			<HeroContent>
				{currentStep === 'portal-home' ? (
					<>
						<HeroTitle>Go Places. Together.</HeroTitle>
						<HeroSubtitle>
							Book flights, check in, manage trips, and more with American Airlines
						</HeroSubtitle>

						<QuickActions>
							<QuickAction>
								<ActionIcon>
									<FiSearch />
								</ActionIcon>
								<ActionLabel>Book a Trip</ActionLabel>
							</QuickAction>

							<QuickAction>
								<ActionIcon>
									<FiCalendar />
								</ActionIcon>
								<ActionLabel>My Trips</ActionLabel>
							</QuickAction>

							<QuickAction>
								<ActionIcon>
									<FiMapPin />
								</ActionIcon>
								<ActionLabel>Check In</ActionLabel>
							</QuickAction>

							<QuickAction>
								<ActionIcon>
									<FiArrowRight />
								</ActionIcon>
								<ActionLabel>AAdvantage®</ActionLabel>
							</QuickAction>
						</QuickActions>

						<LoginSection>
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
					</>
				) : (
					<>
						<AmericanAirlinesNavigation />
						<HeroTitle>Secure Employee Portal</HeroTitle>
						<HeroSubtitle>
							Access your American Airlines employee account with enhanced security
						</HeroSubtitle>

						<LoginSection>
							<LoginDescription>
								Click below to access your secure employee portal. Multi-factor authentication may
								be required based on your security profile.
							</LoginDescription>
							<LoginButton onClick={onLoginStart}>
								<FiLock />
								Sign In to Employee Portal
								<FiArrowRight />
							</LoginButton>
						</LoginSection>

						{/* Flight Search Form for Visual Authenticity */}
						<FlightSearchSection>
							<FlightSearchTitle>Book Your Next Flight</FlightSearchTitle>
							<FlightSearchForm>
								<TripType>
									<label>
										<input type="radio" name="tripType" defaultChecked />
										Round trip
									</label>
									<label>
										<input type="radio" name="tripType" />
										One way
									</label>
									<label>
										<input type="radio" name="tripType" />
										Multi-city
									</label>
								</TripType>
								<SearchInputs>
									<FormGroup>
										<Label>From</Label>
										<Input type="text" placeholder="City or airport" defaultValue="New York (JFK)" />
									</FormGroup>
									<FormGroup>
										<Label>To</Label>
										<Input type="text" placeholder="City or airport" defaultValue="Los Angeles (LAX)" />
									</FormGroup>
									<FormGroup>
										<Label>Depart</Label>
										<Input type="date" defaultValue="2026-03-15" />
									</FormGroup>
									<FormGroup>
										<Label>Return</Label>
										<Input type="date" defaultValue="2026-03-22" />
									</FormGroup>
								</SearchInputs>
								<SearchButton type="button">
									<FiSearch />
									Search flights
								</SearchButton>
							</FlightSearchForm>
						</FlightSearchSection>
					</>
				)}
			</HeroContent>
		</HeroContainer>
	);
};

export default AmericanAirlinesHero;
