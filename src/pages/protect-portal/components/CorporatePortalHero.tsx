/**
 * @file CorporatePortalHero.tsx
 * @module protect-portal/components
 * @description Universal corporate portal hero component
 * @version 9.11.58
 * @since 2026-02-15
 *
 * This is the universal base component for all corporate portals that supports
 * multiple login patterns and company customizations through configuration.
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useBrandTheme } from '../themes/theme-provider';
import type { CorporatePortalConfig, LoginPattern } from '../types/CorporatePortalConfig';
import type { LoginContext, PortalError, UserContext } from '../types/protectPortal.types';

// Import login pattern components
import RightPopoutLogin from './LoginPatterns/RightPopoutLogin';
import NewPageLogin from './LoginPatterns/NewPageLogin';
import DropdownLogin from './LoginPatterns/DropdownLogin';
import EmbeddedLogin from './LoginPatterns/EmbeddedLogin';
import TwoStepOTPLogin from './LoginPatterns/TwoStepOTPLogin';

// Import shared components
import CorporateNavigation from './Shared/CorporateNavigation';
import HeroSection from './Shared/HeroSection';
import FeaturesSection from './Shared/FeaturesSection';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const CorporateContainer = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.typography.body};
  color: ${({ theme }) => theme.colors.text};
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const EmbeddedLoginWrapper = styled.div`
  max-width: 800px;
  margin: 0 auto 3rem auto;
  padding: 0 2rem;
`;

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface CorporatePortalHeroProps {
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

const CorporatePortalHero: React.FC<CorporatePortalHeroProps> = ({
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
  const navigate = useNavigate();
  const theme = useBrandTheme();
  const [loginState, setLoginState] = useState({
    isOpen: false,
    step: 'username' as 'username' | 'otp',
    username: '',
  });

  // Get portal configuration from theme
  const portalConfig = theme.portalConfig as CorporatePortalConfig;

  // Handle login pattern navigation
  const handleLoginNavigation = useCallback(() => {
    const { pattern, route } = portalConfig.login;
    
    switch (pattern) {
      case 'new-page':
        if (route) {
          navigate(route);
        } else {
          navigate(`/${portalConfig.company.name}/login`);
        }
        break;
      case 'right-popout':
      case 'dropdown':
        setLoginState(prev => ({ ...prev, isOpen: true }));
        break;
      case 'embedded':
      case 'two-step-otp':
        // These are handled within the main component
        break;
      default:
        onLoginStart?.();
    }
  }, [navigate, portalConfig, onLoginStart]);

  // Handle login form submission
  const handleLoginSubmit = useCallback((credentials: any) => {
    onLoginStart?.();
    setLoginState(prev => ({ ...prev, isOpen: false }));
  }, [onLoginStart]);

  // Render login pattern component
  const renderLoginPattern = () => {
    const { pattern } = portalConfig.login;

    switch (pattern) {
      case 'right-popout':
        return (
          <RightPopoutLogin
            isOpen={loginState.isOpen}
            onClose={() => setLoginState(prev => ({ ...prev, isOpen: false }))}
            onSubmit={handleLoginSubmit}
            config={portalConfig}
          />
        );
      case 'new-page':
        return null; // Handled by navigation
      case 'dropdown':
        return (
          <DropdownLogin
            isOpen={loginState.isOpen}
            onClose={() => setLoginState(prev => ({ ...prev, isOpen: false }))}
            onSubmit={handleLoginSubmit}
            config={portalConfig}
          />
        );
      case 'embedded':
        return (
          <EmbeddedLogin
            onSubmit={handleLoginSubmit}
            config={portalConfig}
          />
        );
      case 'two-step-otp':
        return (
          <TwoStepOTPLogin
            step={loginState.step}
            username={loginState.username}
            onStepChange={(step, username) => setLoginState(prev => ({ ...prev, step, username }))}
            onSubmit={handleLoginSubmit}
            config={portalConfig}
          />
        );
      default:
        return null;
    }
  };

  return (
    <CorporateContainer>
      <CorporateNavigation
        config={portalConfig}
        onLoginClick={handleLoginNavigation}
      />
      
      <MainContent>
        <HeroSection
          config={portalConfig}
          onLoginClick={handleLoginNavigation}
          currentStep={currentStep}
        />
        
        {portalConfig.login.pattern === 'embedded' && (
          <EmbeddedLoginWrapper>
            <EmbeddedLogin
              onSubmit={handleLoginSubmit}
              config={portalConfig}
            />
          </EmbeddedLoginWrapper>
        )}
        
        <FeaturesSection
          config={portalConfig}
        />
      </MainContent>

      {portalConfig.login.pattern !== 'embedded' && renderLoginPattern()}
    </CorporateContainer>
  );
};

export default CorporatePortalHero;
