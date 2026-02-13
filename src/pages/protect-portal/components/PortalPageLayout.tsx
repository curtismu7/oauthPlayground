/**
 * @file PortalPageLayout.tsx
 * @module protect-portal/components
 * @description Unified page layout component for all portal pages
 * @version 9.6.5
 * @since 2026-02-11
 *
 * This component provides a consistent layout structure for all portal pages
 * with full-width headers, proper spacing, and responsive design.
 */

import React from 'react';
import styled from 'styled-components';
import CompanyLogoHeader from './CompanyLogoHeader';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const PageWrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
`;

const PageHeader = styled.header`
  width: 100%;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderBrand = styled.div`
  flex: 1;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const PageMain = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 2rem;
  width: 100%;
`;

const PageContainer = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 3rem;
  margin-bottom: 2rem;
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--brand-text);
  margin: 0 0 1rem 0;
  line-height: 1.2;
  font-family: var(--brand-heading-font);
  text-align: center;
`;

const PageSubtitle = styled.p`
  font-size: 1.25rem;
  color: var(--brand-text-secondary);
  margin: 0 0 2rem 0;
  line-height: 1.6;
  text-align: center;
  font-family: var(--brand-body-font);
`;

const PageSection = styled.section`
  margin-bottom: 3rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.875rem;
  font-weight: 600;
  color: var(--brand-text);
  margin: 0 0 1rem 0;
  font-family: var(--brand-heading-font);
`;

const SectionDescription = styled.p`
  font-size: 1.125rem;
  color: var(--brand-text-secondary);
  margin: 0 0 2rem 0;
  line-height: 1.6;
  font-family: var(--brand-body-font);
`;

// ============================================================================
// TYPES
// ============================================================================

interface PortalPageLayoutProps {
	title: string;
	subtitle?: string;
	children: React.ReactNode;
	showHeader?: boolean;
	headerActions?: React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

const PortalPageLayout: React.FC<PortalPageLayoutProps> = ({
	title,
	subtitle,
	children,
	showHeader = true,
	headerActions,
}) => {
	return (
		<PageWrapper>
			{showHeader && (
				<PageHeader>
					<HeaderContent>
						<HeaderBrand>
							<CompanyLogoHeader />
						</HeaderBrand>
						{headerActions && <HeaderActions>{headerActions}</HeaderActions>}
					</HeaderContent>
				</PageHeader>
			)}

			<PageMain>
				<PageContainer>
					<PageTitle>{title}</PageTitle>
					{subtitle && <PageSubtitle>{subtitle}</PageSubtitle>}
					{children}
				</PageContainer>
			</PageMain>
		</PageWrapper>
	);
};

export default PortalPageLayout;

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

export const PortalPageSection: React.FC<{
	title?: string;
	description?: string;
	children: React.ReactNode;
}> = ({ title, description, children }) => {
	return (
		<PageSection>
			{title && <SectionTitle>{title}</SectionTitle>}
			{description && <SectionDescription>{description}</SectionDescription>}
			{children}
		</PageSection>
	);
};
