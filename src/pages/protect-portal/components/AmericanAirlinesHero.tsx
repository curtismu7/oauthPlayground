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
import { FiSearch, FiMapPin, FiCalendar, FiLock, FiArrowRight } from 'react-icons/fi';
import styled from 'styled-components';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const HeroContainer = styled.section`
  background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-dark) 100%);
  padding: 4rem 2rem;
  text-align: center;
  color: white;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
    opacity: 0.3;
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

const SearchContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 1rem;
  max-width: 600px;
  margin: 0 auto 2rem;
  backdrop-filter: blur(10px);
`;

const SearchForm = styled.form`
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
`;

const SearchInput = styled.input`
  flex: 1;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  padding: 0.75rem 1rem;
  color: #1f2937;
  font-size: 1rem;
  font-family: var(--brand-body-font);
  
  &::placeholder {
    color: #6b7280;
  }
  
  &:focus {
    outline: none;
    border-color: white;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
  }
`;

const SearchButton = styled.button`
  background: var(--brand-accent);
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  color: white;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s ease;
  font-family: var(--brand-body-font);
  
  &:hover {
    background: #cc1429;
  }
`;

const QuickActions = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 2rem;
  
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

// ============================================================================
// COMPONENT
// ============================================================================

interface AmericanAirlinesHeroProps {
  className?: string;
  currentStep?: string;
  onLoginStart?: () => void;
}

const AmericanAirlinesHero: React.FC<AmericanAirlinesHeroProps> = ({ 
  className,
  currentStep,
  onLoginStart
}) => {
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search functionality
    console.log('Search submitted');
  };

  return (
    <HeroContainer className={className}>
      <HeroContent>
        {currentStep === 'portal-home' ? (
          <>
            <HeroTitle>
              Go Places. Together.
            </HeroTitle>
            <HeroSubtitle>
              Book flights, check in, manage trips, and more with American Airlines
            </HeroSubtitle>
            
            <SearchContainer>
              <SearchForm onSubmit={handleSearch}>
                <SearchInput 
                  type="text" 
                  placeholder="Where to?" 
                  aria-label="Search flights"
                />
                <SearchButton type="submit">
                  <FiSearch size={16} />
                  Search
                </SearchButton>
              </SearchForm>
            </SearchContainer>
            
            <QuickActions>
              <QuickAction>
                <ActionIcon>
                  <FiMapPin />
                </ActionIcon>
                <ActionLabel>Explore</ActionLabel>
              </QuickAction>
              
              <QuickAction>
                <ActionIcon>
                  <FiCalendar />
                </ActionIcon>
                <ActionLabel>Trips</ActionLabel>
              </QuickAction>
              
              <QuickAction>
                <ActionIcon>
                  <FiSearch />
                </ActionIcon>
                <ActionLabel>Check-in</ActionLabel>
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
            <HeroTitle>
              Secure Employee Portal
            </HeroTitle>
            <HeroSubtitle>
              Access your American Airlines employee account with enhanced security
            </HeroSubtitle>
          </>
        )}
      </HeroContent>
    </HeroContainer>
  );
};

export default AmericanAirlinesHero;
