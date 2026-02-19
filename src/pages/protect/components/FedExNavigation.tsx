/**
 * @file FedExNavigation.tsx
 * @module protect-portal/components
 * @description FedEx navigation component matching fedex.com style
 * @version 9.6.5
 * @since 2026-02-13
 */

import React, { useState } from 'react';
import { FiMenu, FiSearch, FiTracking, FiX } from 'react-icons/fi';
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

const NavTop = styled.div`
  background: #4d148c;
  color: white;
  padding: 0.5rem 0;
  font-size: 0.875rem;
`;

const NavTopContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const NavMain = styled.div`
  background: white;
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
  color: #4d148c;
  
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
  color: #333;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
  
  &:hover {
    color: #4d148c;
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
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f5f5f5;
    color: #4d148c;
  }
`;

const TrackingButton = styled.button`
  background: #ff6600;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e55a00;
    transform: translateY(-1px);
  }
`;

const MobileMenuButton = styled.button`
  background: none;
  border: none;
  color: #333;
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
  transform: translateX(${(props) => (props.isOpen ? '0' : '100%')});
  transition: transform 0.3s ease;
  
  @media (min-width: 769px) {
    display: none;
  }
`;

const MobileMenuHeader = styled.div`
  background: #4d148c;
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
    color: #4d148c;
  }
`;

// ============================================================================
// COMPONENT
// ============================================================================

const FedExNavigation: React.FC = () => {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const { activeTheme } = useBrandTheme();

	const toggleMobileMenu = () => {
		setMobileMenuOpen(!mobileMenuOpen);
	};

	return (
		<>
			<NavContainer>
				<NavTop>
					<NavTopContent>
						<span>
							{activeTheme.content?.customerTerminology ? 'Customer Portal' : 'Employee Portal'}
						</span>
						<span>
							Need help? Contact{' '}
							{activeTheme.content?.customerTerminology ? 'Customer Support' : 'IT Support'}
						</span>
					</NavTopContent>
				</NavTop>

				<NavMain>
					<NavMainContent>
						<Logo>
							{activeTheme.logo?.url && (
								<img src={activeTheme.logo.url} alt={activeTheme.logo.alt} />
							)}
							{!activeTheme.logo?.url && activeTheme.logo?.text}
						</Logo>

						<NavLinks>
							<NavLink href="#shipping">Shipping</NavLink>
							<NavLink href="#tracking">Tracking</NavLink>
							<NavLink href="#locations">Locations</NavLink>
							<NavLink href="#support">Support</NavLink>
							<NavLink href="#account">Account</NavLink>
						</NavLinks>

						<NavActions>
							<SearchButton title="Search">
								<FiSearch size={20} />
							</SearchButton>
							<TrackingButton>
								<FiTracking size={16} />
								Track Package
							</TrackingButton>
							<MobileMenuButton onClick={toggleMobileMenu}>
								<FiMenu size={24} />
							</MobileMenuButton>
						</NavActions>
					</NavMainContent>
				</NavMain>
			</NavContainer>

			<MobileMenu isOpen={mobileMenuOpen}>
				<MobileMenuHeader>
					<Logo>{activeTheme.logo?.text}</Logo>
					<button
						type="button"
						onClick={toggleMobileMenu}
						style={{ background: 'none', border: 'none', color: 'white' }}
					>
						<FiX size={24} />
					</button>
				</MobileMenuHeader>
				<MobileMenuContent>
					<MobileNavLink href="#shipping">Shipping</MobileNavLink>
					<MobileNavLink href="#tracking">Tracking</MobileNavLink>
					<MobileNavLink href="#locations">Locations</MobileNavLink>
					<MobileNavLink href="#support">Support</MobileNavLink>
					<MobileNavLink href="#account">Account</MobileNavLink>
				</MobileMenuContent>
			</MobileMenu>
		</>
	);
};

export default FedExNavigation;
