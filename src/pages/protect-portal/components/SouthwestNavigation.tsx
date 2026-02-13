/**
 * @file SouthwestNavigation.tsx
 * @module protect-portal/components
 * @description Southwest Airlines navigation component matching southwest.com style
 * @version 9.6.5
 * @since 2026-02-13
 */

import React, { useState } from 'react';
import { FiMenu, FiPlane, FiSearch, FiX } from 'react-icons/fi';
import styled from 'styled-components';
import { useBrandTheme } from '../themes/theme-provider';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const NavContainer = styled.nav`
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
`;

const NavMain = styled.div`
  background: #304cb2;
  padding: 1rem 0;
`;

const NavMainContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1.5rem;
  color: white;
  
  img {
    height: 40px;
    width: auto;
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled.a`
  color: white;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
  padding: 0.5rem 0;
  border-bottom: 2px solid transparent;
  
  &:hover {
    border-bottom-color: #f4c542;
  }
`;

const NavActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const SearchButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const BookButton = styled.button`
  background: #f4c542;
  color: #304cb2;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 50px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e4b532;
    transform: translateY(-1px);
  }
`;

const MobileMenuButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  display: none;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileMenu = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  z-index: 2000;
  transform: translateX(${props => props.isOpen ? '0' : '100%'});
  transition: transform 0.3s ease;
  
  @media (min-width: 769px) {
    display: none;
  }
`;

const MobileMenuHeader = styled.div`
  background: #304cb2;
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MobileMenuContent = styled.div`
  padding: 1rem;
`;

const MobileNavLink = styled.a`
  display: block;
  padding: 1rem 0;
  color: #333;
  text-decoration: none;
  font-weight: 500;
  border-bottom: 1px solid #eee;
  
  &:hover {
    color: #304cb2;
  }
`;

// ============================================================================
// COMPONENT
// ============================================================================

const SouthwestNavigation: React.FC = () => {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const theme = useBrandTheme();

	const toggleMobileMenu = () => {
		setMobileMenuOpen(!mobileMenuOpen);
	};

	return (
		<>
			<NavContainer>
				<NavMain>
					<NavMainContent>
						<Logo>
							{theme.logo?.url && (
								<img src={theme.logo.url} alt={theme.logo.alt} />
							)}
							{!theme.logo?.url && theme.logo?.text}
						</Logo>
						
						<NavLinks>
							<NavLink href="#book">Book</NavLink>
							<NavLink href="#checkin">Check-In</NavLink>
							<NavLink href="#mytrips">My Trips</NavLink>
							<NavLink href="#rapidrewards">Rapid Rewards</NavLink>
							<NavLink href="#employee">Employee Portal</NavLink>
						</NavLinks>
						
						<NavActions>
							<SearchButton title="Search">
								<FiSearch size={20} />
							</SearchButton>
							<BookButton>
								<FiPlane size={16} />
								Book Flight
							</BookButton>
							<MobileMenuButton onClick={toggleMobileMenu}>
								<FiMenu size={24} />
							</MobileMenuButton>
						</NavActions>
					</NavMainContent>
				</NavMain>
			</NavContainer>
			
			<MobileMenu isOpen={mobileMenuOpen}>
				<MobileMenuHeader>
					<Logo>
						{theme.logo?.text}
					</Logo>
					<button type="button" onClick={toggleMobileMenu} style={{ background: 'none', border: 'none', color: 'white' }}>
						<FiX size={24} />
					</button>
				</MobileMenuHeader>
				<MobileMenuContent>
					<MobileNavLink href="#book">Book</MobileNavLink>
					<MobileNavLink href="#checkin">Check-In</MobileNavLink>
					<MobileNavLink href="#mytrips">My Trips</MobileNavLink>
					<MobileNavLink href="#rapidrewards">Rapid Rewards</MobileNavLink>
					<MobileNavLink href="#employee">Employee Portal</MobileNavLink>
				</MobileMenuContent>
			</MobileMenu>
		</>
	);
};

export default SouthwestNavigation;
