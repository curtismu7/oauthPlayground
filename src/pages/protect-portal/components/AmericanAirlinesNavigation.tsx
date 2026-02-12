/**
 * @file AmericanAirlinesNavigation.tsx
 * @module protect-portal/components
 * @description American Airlines navigation component matching AA.com style
 * @version 9.6.5
 * @since 2026-02-11
 *
 * This component provides an American Airlines-style navigation header
 * that matches the actual AA.com website design and functionality.
 */

import React, { useState } from 'react';
import { FiChevronDown, FiMenu, FiSearch, FiUser, FiX } from 'react-icons/fi';
import styled from 'styled-components';
import { useBrandTheme } from '../themes/theme-provider';
import BrandDropdownSelector from './BrandDropdownSelector';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const NavigationContainer = styled.nav`
  background: var(--brand-primary);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
  position: sticky;
  top: 0;
  z-index: 1000;
`;

const NavigationContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  height: 64px;
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const NavigationLinks = styled.div`
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
  font-weight: 500;
  font-size: 0.875rem;
  font-family: var(--brand-body-font);
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 0.8;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const SearchButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 0.5rem;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const UserMenu = styled.div`
  position: relative;
`;

const UserButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 0.5rem 1rem;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const MobileMenuButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  
  @media (min-width: 769px) {
    display: none;
  }
`;

const MobileMenu = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 64px;
  left: 0;
  right: 0;
  background: var(--brand-primary);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem;
  display: ${({ $isOpen }) => ($isOpen ? 'block' : 'none')};
  z-index: 999;
  
  @media (min-width: 769px) {
    display: none;
  }
`;

const MobileNavLink = styled.a`
  display: block;
  color: white;
  text-decoration: none;
  padding: 0.75rem 0;
  font-weight: 500;
  font-size: 0.875rem;
  font-family: var(--brand-body-font);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

// ============================================================================
// COMPONENT
// ============================================================================

interface AmericanAirlinesNavigationProps {
	className?: string;
}

const AmericanAirlinesNavigation: React.FC<AmericanAirlinesNavigationProps> = ({ className }) => {
	const { activeTheme } = useBrandTheme();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const toggleMobileMenu = () => {
		setMobileMenuOpen(!mobileMenuOpen);
	};

	return (
		<NavigationContainer className={className}>
			<NavigationContent>
				<LogoSection>
					<BrandDropdownSelector />
				</LogoSection>

				<NavigationLinks>
					<NavLink href="#book">Book</NavLink>
					<NavLink href="#checkin">Check-in</NavLink>
					<NavLink href="#mytrips">My Trips</NavLink>
					<NavLink href="#aadvantage">AAdvantage</NavLink>
				</NavigationLinks>

				<RightSection>
					<SearchButton>
						<FiSearch size={16} />
					</SearchButton>

					<UserMenu>
						<UserButton>
							<FiUser size={16} />
							<span>Sign In</span>
							<FiChevronDown size={12} />
						</UserButton>
					</UserMenu>

					<MobileMenuButton onClick={toggleMobileMenu}>
						{mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
					</MobileMenuButton>
				</RightSection>
			</NavigationContent>

			<MobileMenu $isOpen={mobileMenuOpen}>
				<MobileNavLink href="#book">Book</MobileNavLink>
				<MobileNavLink href="#checkin">Check-in</MobileNavLink>
				<MobileNavLink href="#mytrips">My Trips</MobileNavLink>
				<MobileNavLink href="#aadvantage">AAdvantage</MobileNavLink>
				<MobileNavLink href="#signin">Sign In</MobileNavLink>
			</MobileMenu>
		</NavigationContainer>
	);
};

export default AmericanAirlinesNavigation;
