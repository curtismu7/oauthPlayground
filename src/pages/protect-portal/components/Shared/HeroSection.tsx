/**
 * @file HeroSection.tsx
 * @module protect-portal/components/Shared
 * @description Configurable hero section component
 * @version 9.11.58
 * @since 2026-02-15
 *
 * Universal hero section that adapts to different company styles and login patterns.
 */

import React from 'react';
import { FiArrowRight, FiLock } from 'react-icons/fi';
import styled from 'styled-components';
import type { CorporatePortalConfig } from '../../types/CorporatePortalConfig';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const HeroSectionStyled = styled.section<{ $brandColor: string; $brandSecondary: string; $pattern: string }>`
  background: ${({ $pattern, $brandColor, $brandSecondary }) => {
    switch ($pattern) {
      case 'gradient':
        return `linear-gradient(135deg, ${$brandColor} 0%, ${$brandSecondary} 100%)`;
      case 'subtle':
        return `linear-gradient(135deg, ${$brandColor}02 0%, ${$brandSecondary}01 100%)`;
      default:
        return $brandColor;
    }
  }};
  padding: 4rem 2rem;
  text-align: center;
  color: white;
  position: relative;
  min-height: 400px;
  display: flex;
  align-items: center;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23dots)"/></svg>');
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
  font-size: ${({ $tone }) => $tone === 'friendly' ? '1.125rem' : '1.25rem'};
  margin: 0 0 2rem 0;
  line-height: 1.6;
  opacity: 0.9;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const Tagline = styled.div<{ $tone: string }>`
  font-size: ${({ $tone }) => $tone === 'friendly' ? '1rem' : '1.125rem'};
  font-weight: ${({ $tone }) => $tone === 'friendly' ? '500' : '600'};
  margin: 0 0 3rem 0;
  opacity: 0.8;
  font-style: ${({ $tone }) => $tone === 'friendly' ? 'italic' : 'normal'};
`;

const LoginAction = styled.div<{ $pattern: string }>`
  margin-top: 2rem;
  
  ${({ $pattern }) => $pattern === 'embedded' && `
    display: none;
  `}
`;

const LoginButton = styled.button<{ $brandColor: string; $accentColor: string; $tone: string }>`
  background: ${({ $accentColor }) => $accentColor};
  color: white;
  border: none;
  border-radius: ${({ $tone }) => $tone === 'friendly' ? '25px' : '6px'};
  padding: ${({ $tone }) => $tone === 'friendly' ? '0.75rem 2rem' : '1rem 2rem'};
  font-size: ${({ $tone }) => $tone === 'friendly' ? '1rem' : '1.125rem'};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  
  &:hover {
    background: ${({ $brandColor }) => $brandColor};
    transform: ${({ $tone }) => $tone === 'friendly' ? 'translateY(-2px)' : 'translateY(-1px)'};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface HeroSectionProps {
  config: CorporatePortalConfig;
  onLoginClick: () => void;
  currentStep?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const HeroSection: React.FC<HeroSectionProps> = ({
  config,
  onLoginClick,
  currentStep = 'portal-home',
}) => {
  const brandColor = config.branding.colors.primary;
  const accentColor = config.branding.colors.accent;
  const brandSecondary = config.branding.colors.secondary || brandColor;
  const tone = config.content.tone;
  const loginPattern = config.login.pattern;

  // Determine background pattern based on industry and tone
  const getBackgroundPattern = () => {
    if (tone === 'professional-trustworthy') return 'subtle';
    if (tone === 'modern') return 'gradient';
    return 'solid';
  };

  // Show different content based on current step
  if (currentStep !== 'portal-home') {
    return (
      <HeroSection 
        $brandColor={brandColor} 
        $brandSecondary={brandSecondary} 
        $pattern={getBackgroundPattern()}
      >
        <HeroContent>
          <HeroSubtitle $tone={tone}>
            Complete your secure authentication with {config.company.displayName}
          </HeroSubtitle>
        </HeroContent>
      </HeroSection>
    );
  }

  return (
    <HeroSectionStyled 
      $brandColor={brandColor} 
      $brandSecondary={brandSecondary} 
      $pattern={getBackgroundPattern()}
    >
      <HeroContent>
        <HeroSubtitle $tone={tone}>
          {config.content.heroSubtitle}
        </HeroSubtitle>

        {config.content.tagline && (
          <Tagline $tone={tone}>
            {config.content.tagline}
          </Tagline>
        )}

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
              : `${config.content.customerTerminology ? 'Customer' : 'Employee'} Login`
            }
            <FiArrowRight />
          </LoginButton>
        </LoginAction>
      </HeroContent>
    </HeroSectionStyled>
  );
};

export default HeroSection;
