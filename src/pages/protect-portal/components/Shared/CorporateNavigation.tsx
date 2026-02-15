/**
 * @file CorporateNavigation.tsx
 * @module protect-portal/components/Shared
 * @description Configurable corporate navigation component
 * @version 9.11.58
 * @since 2026-02-15
 *
 * Universal navigation component that adapts to different company styles.
 */

import React from 'react';
import { FiMenu, FiSearch, FiChevronDown } from 'react-icons/fi';
import styled from 'styled-components';
import BrandDropdownSelector from '../BrandDropdownSelector';
import type { CorporatePortalConfig } from '../../types/CorporatePortalConfig';

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
  
  ${({ $style }) => $style === 'modern' && `
    background: linear-gradient(135deg, ${({ $brandColor }) => $brandColor} 0%, ${({ $brandColor }) => $brandColor}dd 100%);
  `}
  
  ${({ $style }) => $style === 'friendly' && `
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
  
  ${({ $style }) => $style === 'friendly' && `
    gap: 1.5rem;
  `}
`;

const NavLink = styled.a<{ $brandColor: string }>`
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
  border-radius: ${({ $style }) => $style === 'friendly' ? '20px' : '6px'};
  padding: ${({ $style }) => $style === 'friendly' ? '0.6rem 1.2rem' : '0.6rem 1rem'};
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  
  &:hover {
    background: ${({ $brandColor }) => $brandColor};
    border-color: rgba(255, 255, 255, 0.4);
    transform: ${({ $style }) => $style === 'friendly' ? 'translateY(-2px)' : 'translateY(-1px)'};
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

const CorporateNavigation: React.FC<CorporateNavigationProps> = ({
  config,
  onLoginClick,
}) => {
  const brandColor = config.branding.colors.primary;
  const accentColor = config.branding.colors.accent;
  const navStyle = config.navigation.style;

  // Generate navigation links based on industry
  const getNavLinks = () => {
    switch (config.company.industry) {
      case 'aviation':
        return [
          { text: 'Book', href: '#book' },
          { text: 'Travel Info', href: '#travel-info' },
          { text: 'My Trips', href: '#my-trips' },
          { text: 'MileagePlus', href: '#mileageplus' },
        ];
      case 'banking':
        return [
          { text: 'Accounts', href: '#accounts' },
          { text: 'Transfer', href: '#transfer' },
          { text: 'Cards', href: '#cards' },
          { text: 'Investments', href: '#investments' },
        ];
      case 'logistics':
        return [
          { text: 'Ship', href: '#ship' },
          { text: 'Track', href: '#track' },
          { text: 'Rates', href: '#rates' },
          { text: 'Support', href: '#support' },
        ];
      case 'tech':
        return [
          { text: 'Products', href: '#products' },
          { text: 'Solutions', href: '#solutions' },
          { text: 'Docs', href: '#docs' },
          { text: 'Support', href: '#support' },
        ];
      default:
        return [
          { text: 'Home', href: '#home' },
          { text: 'Services', href: '#services' },
          { text: 'About', href: '#about' },
          { text: 'Contact', href: '#contact' },
        ];
    }
  };

  const navLinks = getNavLinks();

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
          {navLinks.map((link, index) => (
            <NavLink key={index} href={link.href} $brandColor={brandColor}>
              {link.text}
            </NavLink>
          ))}
        </NavLinks>

        <RightNav>
          {config.navigation.showBrandSelector && (
            <BrandDropdownSelector />
          )}
          
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
