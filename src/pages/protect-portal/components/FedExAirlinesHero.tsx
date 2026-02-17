/**
 * @file FedExAirlinesHero.tsx
 * @module protect-portal/components
 * @description FedEx Airlines hero section with authentic login page layout
 * @version 9.6.5
 * @since 2026-02-11
 *
 * This component provides a FedEx Airlines-specific hero section that matches
 * their actual login page layout with navigation, hero content, and login integration.
 */

import React from 'react';
import styled from 'styled-components';
import BrandDropdownSelector from './BrandDropdownSelector';
import type { LoginContext, PortalError, UserContext } from '../types/protectPortal.types';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const HeroContainer = styled.div`
  width: 100%;
  background: white; /* Consistent white background for Protect app */
  position: relative;
  overflow: hidden;
`;

const FullWidthHeader = styled.div`
  width: 100%;
  background: white;
  border-bottom: 1px solid #E5E7EB;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
`;

const Navigation = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 0;
  width: 100%;
  background: white;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const HeroBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(77, 20, 140, 0.02) 0%, rgba(255, 102, 0, 0.01) 100%);
  opacity: 1; /* Very subtle background texture, mostly white */
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 2;
  max-width: 100%;
  margin: 0 auto;
  padding: 0;
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const LogoText = styled.div`
  color: #4D148C; /* FedEx purple text */
  font-size: 1.75rem;
  font-weight: 700;
  font-family: 'Helvetica Neue', Arial, sans-serif;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
`;

const NavLink = styled.a`
  color: #666666; /* Medium gray text for FedEx secure login */
  text-decoration: none;
  font-weight: 500;
  font-size: 0.875rem;
  transition: color 0.2s;
  font-family: 'Helvetica Neue', Arial, sans-serif;

  &:hover {
    color: #FF6600; /* FedEx orange on hover */
  }
`;

const MainContent = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem;
  min-height: calc(100vh - 200px);
`;

const LoginContainer = styled.div`
  width: 100%;
  max-width: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 2rem 2.25rem;
`;

const LoginSection = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const LoginTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333333; /* Dark gray for secure login */
  margin-bottom: 0.5rem;
  font-family: 'Helvetica Neue', Arial, sans-serif;
`;

const LoginSubtitle = styled.p`
  color: #666666; /* Medium gray */
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
  font-family: 'Helvetica Neue', Arial, sans-serif;
`;

const LoginDescription = styled.p`
  color: #666666;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
  line-height: 1.4;
  font-family: 'Helvetica Neue', Arial, sans-serif;
`;

const LoginButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 1rem;
  background: #4D148C; /* FedEx purple */
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #3A0F6B; /* Darker purple on hover */
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const QuickActions = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.9rem;
  margin: 1.5rem 0;
  flex-wrap: wrap;
`;

const QuickAction = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
  padding: 0.9rem;
  background: rgba(77, 20, 140, 0.07);
  border-radius: 8px;
  border: 1px solid rgba(77, 20, 140, 0.15);
  transition: all 0.2s;
  min-width: 150px;
  flex: 1 1 170px;

  &:hover {
    background: rgba(77, 20, 140, 0.14);
    transform: translateY(-2px);
  }
`;

const ActionIcon = styled.div`
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
`;

const ActionLabel = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: #4D148C;
  font-family: 'Helvetica Neue', Arial, sans-serif;
`;

const ActionMeta = styled.span`
  font-size: 0.78rem;
  color: #6B7280;
  font-family: 'Helvetica Neue', Arial, sans-serif;
`;

const StatusStrip = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-bottom: 1rem;
`;

const StatusBadge = styled.span`
  padding: 0.38rem 0.62rem;
  border-radius: 999px;
  border: 1px solid rgba(77, 20, 140, 0.18);
  background: rgba(77, 20, 140, 0.06);
  color: #4D148C;
  font-size: 0.75rem;
  font-weight: 600;
`;

const ServiceHighlightsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
  margin: 0.5rem 0 1.3rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const HighlightCard = styled.div`
  background: linear-gradient(180deg, rgba(77, 20, 140, 0.06) 0%, rgba(255, 102, 0, 0.05) 100%);
  border: 1px solid rgba(77, 20, 140, 0.14);
  border-radius: 10px;
  padding: 0.8rem 0.9rem;
`;

const HighlightTitle = styled.h4`
  margin: 0 0 0.35rem;
  color: #4D148C;
  font-size: 0.92rem;
  font-weight: 700;
`;

const HighlightText = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: #4B5563;
  line-height: 1.35;
`;

const QuickLinks = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #E5E7EB;
`;

const QuickLink = styled.a`
  color: #4D148C; /* FedEx purple */
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 0.2s;
  font-family: 'Helvetica Neue', Arial, sans-serif;

  &:hover {
    color: #FF6600; /* FedEx orange on hover */
  }
`;

// ============================================================================
// PROPS INTERFACE
// ============================================================================

// Additional styled components for tracking form
const TrackingSection = styled.div`
  margin-top: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const TrackingTitle = styled.h3`
  color: #4D148C;
  font-size: 1.25rem;
  margin-bottom: 1rem;
  text-align: center;
`;

const TrackingForm = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const TrackingInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #E5E7EB;
  border-radius: 8px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #4D148C;
  }
`;

const TrackButton = styled.button`
  background: #FF6600;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #E55A00;
  }
`;

const TrackingOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const TrackingOption = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #4D148C;
  font-size: 0.875rem;
  cursor: pointer;
  
  input[type="radio"] {
    accent-color: #4D148C;
  }
`;

interface FedExAirlinesHeroProps {
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

const FedExAirlinesHero: React.FC<FedExAirlinesHeroProps> = ({
	currentStep = 'portal-home',
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
	return (
		<HeroContainer>
			<HeroBackground />
			<HeroContent>
				{currentStep === 'portal-home' ? (
					<>
						<FullWidthHeader>
							<HeaderContent>
								<Navigation>
									<LogoSection>
										<LogoText>FedEx</LogoText>
									</LogoSection>
									<NavLinks>
										<NavLink href="#">Ship</NavLink>
										<NavLink href="#">Track</NavLink>
										<NavLink href="#">Manage</NavLink>
										<NavLink href="#">Support</NavLink>
									</NavLinks>
									<HeaderActions>
										<BrandDropdownSelector />
									</HeaderActions>
								</Navigation>
							</HeaderContent>
						</FullWidthHeader>
						<MainContent>
							<LoginContainer>
								<LoginSection>
									<LoginTitle>The World on Time</LoginTitle>
									<LoginSubtitle>
										Ship, track, and manage your shipments with FedEx's reliable global logistics
										network
									</LoginSubtitle>
								</LoginSection>
								<StatusStrip>
									<StatusBadge>On-Time Priority 97.8%</StatusBadge>
									<StatusBadge>220+ Countries</StatusBadge>
									<StatusBadge>Customs Tools Active</StatusBadge>
									<StatusBadge>24/7 Shipment Visibility</StatusBadge>
								</StatusStrip>

								<QuickActions>
									<QuickAction>
										<ActionIcon>📦</ActionIcon>
										<ActionLabel>Ship</ActionLabel>
										<ActionMeta>Create labels fast</ActionMeta>
									</QuickAction>

									<QuickAction>
										<ActionIcon>🔍</ActionIcon>
										<ActionLabel>Track</ActionLabel>
										<ActionMeta>Live package timelines</ActionMeta>
									</QuickAction>

									<QuickAction>
										<ActionIcon>📋</ActionIcon>
										<ActionLabel>Manage</ActionLabel>
										<ActionMeta>Billing and pickups</ActionMeta>
									</QuickAction>

									<QuickAction>
										<ActionIcon>↩️</ActionIcon>
										<ActionLabel>Returns</ActionLabel>
										<ActionMeta>Print return labels</ActionMeta>
									</QuickAction>
								</QuickActions>

								<ServiceHighlightsGrid>
									<HighlightCard>
										<HighlightTitle>Global Network Snapshot</HighlightTitle>
										<HighlightText>
											Monitor regional lane performance and transit milestones across express and
											ground services.
										</HighlightText>
									</HighlightCard>
									<HighlightCard>
										<HighlightTitle>Smart Customs Workflow</HighlightTitle>
										<HighlightText>
											Pre-clearance and trade document readiness indicators for smoother
											international delivery.
										</HighlightText>
									</HighlightCard>
									<HighlightCard>
										<HighlightTitle>Delivery Management</HighlightTitle>
										<HighlightText>
											Route critical packages, set notifications, and coordinate destination
											instructions in one view.
										</HighlightText>
									</HighlightCard>
								</ServiceHighlightsGrid>

								<LoginSection>
									<LoginDescription>
										Click below to begin your secure login journey. We'll evaluate your login
										attempt in real-time to provide the appropriate level of security.
									</LoginDescription>
									<LoginButton onClick={onLoginStart}>🔒 Begin Secure Login →</LoginButton>
								</LoginSection>
							</LoginContainer>
						</MainContent>
					</>
				) : (
					<>
						<FullWidthHeader>
							<HeaderContent>
								<Navigation>
									<LogoSection>
										<LogoText>FedEx</LogoText>
									</LogoSection>
									<NavLinks>
										<NavLink href="#">Ship</NavLink>
										<NavLink href="#">Track</NavLink>
										<NavLink href="#">Manage</NavLink>
										<NavLink href="#">Support</NavLink>
									</NavLinks>
									<HeaderActions>
										<BrandDropdownSelector />
									</HeaderActions>
								</Navigation>
							</HeaderContent>
						</FullWidthHeader>
						<MainContent>
							<LoginContainer>
								<LoginSection>
									<LoginTitle>Employee Sign In</LoginTitle>
									<LoginSubtitle>
										Access your FedEx employee account with enhanced security features.
									</LoginSubtitle>
								</LoginSection>

								<LoginButton onClick={onLoginStart}>Sign In to Employee Portal</LoginButton>

								{/* Package Tracking Form for Visual Authenticity */}
								<TrackingSection>
									<TrackingTitle>Track Your Shipment</TrackingTitle>
									<TrackingForm>
										<TrackingInput
											type="text"
											placeholder="Enter tracking number"
											defaultValue="123456789012"
										/>
										<TrackButton type="button">Track</TrackButton>
									</TrackingForm>
									<TrackingOptions>
										<TrackingOption>
											<input type="radio" name="trackType" id="track" defaultChecked />
											<label htmlFor="track">Track by tracking number</label>
										</TrackingOption>
										<TrackingOption>
											<input type="radio" name="trackType" id="reference" />
											<label htmlFor="reference">Track by reference</label>
										</TrackingOption>
										<TrackingOption>
											<input type="radio" name="trackType" id="tnot" />
											<label htmlFor="tnot">Track by Transport Order / TNOT number</label>
										</TrackingOption>
									</TrackingOptions>
								</TrackingSection>

								<QuickLinks>
									<QuickLink href="#">Forgot Username?</QuickLink>
									<QuickLink href="#">Forgot Password?</QuickLink>
									<QuickLink href="#">Need Help?</QuickLink>
								</QuickLinks>
							</LoginContainer>
						</MainContent>
					</>
				)}
			</HeroContent>
		</HeroContainer>
	);
};

export default FedExAirlinesHero;
