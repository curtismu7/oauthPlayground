/**
 * @file CorporateNavigation.tsx
 * @module protect-portal/components/Shared
 * @description Configurable corporate navigation component
 * @version 9.11.58
 * @since 2026-02-15
 *
 * Universal navigation component that adapts to different company styles.
 */

import React, { useState } from 'react';
import { FiChevronDown, FiMenu, FiSearch } from 'react-icons/fi';
import styled from 'styled-components';
import type { CorporatePortalConfig } from '../../types/CorporatePortalConfig';
import BrandDropdownSelector from '../BrandDropdownSelector';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const Navigation = styled.nav<{ $brandColor: string; $style: string }>`
  background: ${({ $brandColor }) => $brandColor};
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  
  ${({ $style }) =>
		$style === 'modern' &&
		`
    background: linear-gradient(135deg, ${({ $brandColor }) => $brandColor} 0%, ${({ $brandColor }) => $brandColor}dd 100%);
  `}
  
  ${({ $style }) =>
		$style === 'friendly' &&
		`
    border-bottom: 2px solid ${({ $brandColor }) => $brandColor};
  `}
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

const Logo = styled.div<{ $logoColors: Record<string, string> }>`
  display: flex;
  align-items: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  
  .logo-text {
    color: white;
    text-decoration: none;
  }
  
  .logo-accent {
    color: ${({ $logoColors }) => $logoColors.accent || 'white'};
  }
`;

const NavLinks = styled.div<{ $style: string }>`
  display: flex;
  align-items: center;
  gap: 2rem;
  
  @media (max-width: 768px) {
    display: none;
  }
  
  ${({ $style }) =>
		$style === 'friendly' &&
		`
    gap: 1.5rem;
  `}
`;

const NavLink = styled.a<{ $brandColor: string; $style: string }>`
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

const DropdownContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const DropdownTrigger = styled.button<{ $brandColor: string }>`
  background: none;
  border: none;
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.5rem 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  
  &:hover {
    border-bottom-color: white;
  }
`;

const DropdownMenu = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  visibility: ${({ $isOpen }) => ($isOpen ? 'visible' : 'hidden')};
  transform: translateY(${({ $isOpen }) => ($isOpen ? '0' : '-10px')});
  transition: all 0.2s ease;
  z-index: 1000;
  margin-top: 0.5rem;
`;

const DropdownItem = styled.a`
  display: block;
  padding: 0.75rem 1rem;
  color: #374151;
  text-decoration: none;
  font-size: 0.875rem;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid #f3f4f6;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #f9fafb;
    color: #1f2937;
  }
  
  &:first-child {
    border-radius: 8px 8px 0 0;
  }
  
  &:last-child {
    border-radius: 0 0 8px 8px;
  }
`;

const RightNav = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const SearchButton = styled.button`
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-1px);
  }
`;

const MobileMenuButton = styled.button`
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: none;
  backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.5);
  }
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const LoginButton = styled.button<{ $brandColor: string; $accentColor: string; $style: string }>`
  background: ${({ $accentColor }) => $accentColor};
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: ${({ $style }) => ($style === 'friendly' ? '20px' : '6px')};
  padding: ${({ $style }) => ($style === 'friendly' ? '0.6rem 1.2rem' : '0.6rem 1rem')};
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  
  &:hover {
    background: ${({ $brandColor }) => $brandColor};
    border-color: rgba(255, 255, 255, 0.4);
    transform: ${({ $style }) => ($style === 'friendly' ? 'translateY(-2px)' : 'translateY(-1px)')};
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface CorporateNavigationProps {
	config: CorporatePortalConfig;
	onLoginClick: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CorporateNavigation: React.FC<CorporateNavigationProps> = ({ config, onLoginClick }) => {
	const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
	const brandColor = config.branding.colors.primary;
	const accentColor = config.branding.colors.accent;
	const navStyle = config.navigation.style;

	// Generate navigation links based on industry - matching real websites
	const getNavLinks = () => {
		switch (config.company.industry) {
			case 'aviation':
				return [
					{
						text: 'Book',
						href: '#book',
						hasDropdown: true,
						dropdownItems: ['Flights', 'Hotels', 'Cars', 'Vacations'],
					},
					{ text: 'My Trips', href: '#my-trips', hasDropdown: false },
					{ text: 'Check-in', href: '#checkin', hasDropdown: false },
					{ text: 'Flight Status', href: '#flight-status', hasDropdown: false },
					{
						text: 'Travel Info',
						href: '#travel-info',
						hasDropdown: true,
						dropdownItems: ['Baggage', 'Check-in Options', 'Travel Requirements'],
					},
				];
			case 'banking':
				return [
					{
						text: 'Accounts',
						href: '#accounts',
						hasDropdown: true,
						dropdownItems: ['Checking', 'Savings', 'Credit Cards', 'Loans'],
					},
					{ text: 'Transfer', href: '#transfer', hasDropdown: false },
					{ text: 'Bill Pay', href: '#bill-pay', hasDropdown: false },
					{
						text: 'Investing',
						href: '#investing',
						hasDropdown: true,
						dropdownItems: ['Merrill Edge', 'Automated Investing', 'Small Business'],
					},
					{
						text: 'Customer Service',
						href: '#service',
						hasDropdown: true,
						dropdownItems: ['Contact Us', 'Help Center', 'Security Center'],
					},
				];
			case 'logistics':
				return [
					{
						text: 'Ship',
						href: '#ship',
						hasDropdown: true,
						dropdownItems: ['Create a Shipment', 'Schedule a Pickup', 'Get Rates'],
					},
					{ text: 'Track', href: '#track', hasDropdown: false },
					{
						text: 'Rates & Transit Times',
						href: '#rates',
						hasDropdown: true,
						dropdownItems: ['Get Rates', 'Transit Times', 'Surcharges'],
					},
					{
						text: 'International',
						href: '#international',
						hasDropdown: true,
						dropdownItems: ['International Services', 'Customs Clearance'],
					},
					{ text: 'Support', href: '#support', hasDropdown: false },
				];
			case 'tech':
				return [
					{
						text: 'Products',
						href: '#products',
						hasDropdown: true,
						dropdownItems: ['PingOne', 'PingFederate', 'PingDirectory'],
					},
					{
						text: 'Solutions',
						href: '#solutions',
						hasDropdown: true,
						dropdownItems: ['Identity', 'Access', 'Security'],
					},
					{
						text: 'Developers',
						href: '#developers',
						hasDropdown: true,
						dropdownItems: ['APIs', 'SDKs', 'Documentation'],
					},
					{
						text: 'Resources',
						href: '#resources',
						hasDropdown: true,
						dropdownItems: ['Blog', 'Webinars', 'Case Studies'],
					},
					{
						text: 'Company',
						href: '#company',
						hasDropdown: true,
						dropdownItems: ['About Us', 'Careers', 'Contact'],
					},
				];
			default:
				return [
					{ text: 'Home', href: '#home', hasDropdown: false },
					{
						text: 'Services',
						href: '#services',
						hasDropdown: true,
						dropdownItems: ['Service 1', 'Service 2'],
					},
					{ text: 'About', href: '#about', hasDropdown: false },
					{ text: 'Contact', href: '#contact', hasDropdown: false },
				];
		}
	};

	const navLinks = getNavLinks();

	const handleDropdownToggle = (linkText: string) => {
		setActiveDropdown(activeDropdown === linkText ? null : linkText);
	};

	const _handleDropdownClose = () => {
		setActiveDropdown(null);
	};

	return (
		<Navigation $brandColor={brandColor} $style={navStyle}>
			<NavContainer>
				<Logo $logoColors={config.company.logo.colors}>
					<span className="logo-text">
						{config.company.logo.text.split(' ').map((word, index) => (
							<span key={index} className={index === 1 ? 'logo-accent' : ''}>
								{word}{' '}
							</span>
						))}
					</span>
				</Logo>

				<NavLinks $style={navStyle}>
					{navLinks.map((link, index) =>
						link.hasDropdown ? (
							<DropdownContainer key={index}>
								<DropdownTrigger
									$brandColor={brandColor}
									onClick={() => handleDropdownToggle(link.text)}
								>
									{link.text}
									<FiChevronDown size={14} />
								</DropdownTrigger>
								<DropdownMenu $isOpen={activeDropdown === link.text}>
									{link.dropdownItems?.map((item, itemIndex) => (
										<DropdownItem key={itemIndex} href="#">
											{item}
										</DropdownItem>
									))}
								</DropdownMenu>
							</DropdownContainer>
						) : (
							<NavLink key={index} href={link.href} $brandColor={brandColor}>
								{link.text}
							</NavLink>
						)
					)}
				</NavLinks>

				<RightNav>
					{config.navigation.showBrandSelector && <BrandDropdownSelector />}

					<SearchButton>
						<FiSearch size={20} />
					</SearchButton>

					<LoginButton
						onClick={onLoginClick}
						$brandColor={brandColor}
						$accentColor={accentColor}
						$style={navStyle}
					>
						{config.content.customerTerminology ? 'Customer Login' : 'Employee Login'}
					</LoginButton>

					<MobileMenuButton>
						<FiMenu size={20} />
					</MobileMenuButton>
				</RightNav>
			</NavContainer>
		</Navigation>
	);
};

export default CorporateNavigation;
