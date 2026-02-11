/**
 * @file CompanyHeader.tsx
 * @module protect-portal/components
 * @description Company header component with logo and portal name
 * @version 9.6.5
 * @since 2026-02-11
 *
 * This component displays the company logo and portal name prominently
 * at the top of the Protect Portal for internal company branding.
 */

import React from 'react';
import styled from 'styled-components';
import { useBrandTheme } from '../themes/theme-provider';
import BrandDropdownSelector from './BrandDropdownSelector';
import TextLogo from './TextLogo';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const HeaderContainer = styled.header`
  background: var(--brand-surface);
  border-bottom: 2px solid var(--brand-primary-light);
  padding: 1.5rem 2rem;
  text-align: center;
  position: relative;
  box-shadow: var(--brand-shadow-md);
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 1rem;
`;

const PortalInfo = styled.div`
  text-align: center;
`;

const PortalTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--brand-primary);
  margin: 0 0 0.5rem 0;
  font-family: var(--brand-heading-font);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const PortalSubtitle = styled.p`
  font-size: 0.875rem;
  color: var(--brand-text-secondary);
  margin: 0;
  font-family: var(--brand-body-font);
  font-weight: 400;
`;

const BrandSelectorContainer = styled.div`
  position: absolute;
  top: 1.5rem;
  right: 2rem;
`;

const DecorativeLine = styled.div`
  width: 60px;
  height: 4px;
  background: linear-gradient(90deg, var(--brand-primary), var(--brand-secondary));
  border-radius: var(--brand-radius-sm);
  margin: 1.5rem auto;
`;

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface CompanyHeaderProps {
	showBrandSelector?: boolean;
	className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const CompanyHeader: React.FC<CompanyHeaderProps> = ({ 
	showBrandSelector = true, 
	className 
}) => {
	const { activeTheme } = useBrandTheme();

	return (
		<HeaderContainer className={className}>
			{showBrandSelector && (
				<BrandSelectorContainer>
					<BrandDropdownSelector />
				</BrandSelectorContainer>
			)}
			
			<LogoContainer>
				<TextLogo 
					text={activeTheme.logo.text || activeTheme.displayName}
					colors={activeTheme.logo.colors || {}}
					width={activeTheme.logo.width}
					height={activeTheme.logo.height}
					alt={activeTheme.logo.alt}
				/>
			</LogoContainer>
			
			<PortalInfo>
				<PortalTitle>{activeTheme.portalName}</PortalTitle>
				<PortalSubtitle>Secure Employee Authentication Portal</PortalSubtitle>
			</PortalInfo>
			
			<DecorativeLine />
		</HeaderContainer>
	);
};

export default CompanyHeader;
