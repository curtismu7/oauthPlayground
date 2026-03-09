/**
 * @file CompanyLogoHeader.tsx
 * @module protect-portal/components
 * @description Shared company logo header component for all pages
 * @version 9.6.5
 * @since 2026-02-11
 *
 * This component provides a consistent company logo header that can be used
 * across all portal pages to maintain brand consistency.
 */

import React from 'react';
import styled from 'styled-components';
import { useBrandTheme } from '../themes/theme-provider';
import TextLogo from './TextLogo';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const LogoHeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 2rem;
  background: var(--brand-surface);
  border-bottom: 1px solid var(--brand-text-secondary);
  margin-bottom: 2rem;
`;

const LogoContent = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const LogoText = styled.div`
  text-align: left;
`;

const CompanyName = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--brand-text);
  margin: 0 0 0.25rem 0;
  font-family: var(--brand-heading-font);
`;

const PortalTagline = styled.p`
  font-size: 0.875rem;
  color: var(--brand-text-secondary);
  margin: 0;
  font-family: var(--brand-body-font);
`;

const LogoImage = styled.img<{ width: string; height: string }>`
  width: ${({ width }) => width};
  height: ${({ height }) => height};
  object-fit: contain;
  transition: var(--brand-transition);

  &:hover {
    transform: scale(1.05);
  }
`;

// ============================================================================
// COMPONENT
// ============================================================================

interface CompanyLogoHeaderProps {
	className?: string;
	showTagline?: boolean;
	size?: 'small' | 'medium' | 'large';
}

const CompanyLogoHeader: React.FC<CompanyLogoHeaderProps> = ({
	className,
	showTagline = true,
	size = 'medium',
}) => {
	const { activeTheme } = useBrandTheme();

	const getLogoSize = () => {
		switch (size) {
			case 'small':
				return { width: '120px', height: '40px' };
			case 'large':
				return { width: '200px', height: '80px' };
			default:
				return { width: '160px', height: '60px' };
		}
	};

	const logoSize = getLogoSize();

	return (
		<LogoHeaderContainer className={className}>
			<LogoContent>
				{activeTheme.logo.url ? (
					<LogoImage
						src={activeTheme.logo.url}
						alt={activeTheme.logo.alt}
						width={logoSize.width}
						height={logoSize.height}
					/>
				) : (
					<TextLogo
						text={activeTheme.logo.text || activeTheme.displayName}
						colors={activeTheme.logo.colors || {}}
						width={logoSize.width}
						height={logoSize.height}
						alt={activeTheme.logo.alt}
					/>
				)}
				{showTagline && (
					<LogoText>
						<CompanyName>{activeTheme.displayName}</CompanyName>
						<PortalTagline>Secure Employee Portal</PortalTagline>
					</LogoText>
				)}
			</LogoContent>
		</LogoHeaderContainer>
	);
};

export default CompanyLogoHeader;
