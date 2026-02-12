/**
 * @file BrandSelector.tsx
 * @module protect-portal/components
 * @description Brand selector component for switching corporate themes
 * @version 9.6.5
 * @since 2026-02-10
 *
 * This component provides a user interface for switching between different
 * corporate brand themes in the Protect Portal.
 */

import React from 'react';
import styled from 'styled-components';
import type { BrandSelectorProps } from '../themes/brand-theme.interface';
import { useBrandTheme } from '../themes/theme-provider';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const SelectorContainer = styled.div<{ compact?: boolean }>`
	display: flex;
	flex-direction: ${({ compact }) => (compact ? 'row' : 'column')};
	gap: ${({ compact }) => (compact ? '0.5rem' : '1rem')};
	padding: ${({ compact }) => (compact ? '0.5rem' : '1rem')};
	background: var(--brand-surface);
	border-radius: var(--brand-radius-lg);
	border: 1px solid rgba(0, 0, 0, 0.1);
	box-shadow: var(--brand-shadow-sm);
`;

const SelectorTitle = styled.h3<{ compact?: boolean }>`
	font-size: ${({ compact }) => (compact ? '0.875rem' : '1rem')};
	font-weight: 600;
	color: var(--brand-text);
	margin: 0 0 ${({ compact }) => (compact ? '0.5rem' : '1rem')} 0;
	text-align: center;
`;

const BrandGrid = styled.div<{ compact?: boolean }>`
	display: grid;
	grid-template-columns: ${({ compact }) => (compact ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)')};
	gap: ${({ compact }) => (compact ? '0.25rem' : '0.75rem')};
	width: 100%;
`;

const BrandOption = styled.button.withConfig({
	shouldForwardProp: (prop) => !['isActive', 'compact'].includes(prop),
})<{ isActive: boolean; compact?: boolean }>`
	display: flex;
	flex-direction: ${({ compact }) => (compact ? 'column' : 'row')};
	align-items: center;
	justify-content: ${({ compact }) => (compact ? 'center' : 'flex-start')};
	gap: ${({ compact }) => (compact ? '0.25rem' : '0.75rem')};
	padding: ${({ compact }) => (compact ? '0.5rem' : '1rem')};
	background: ${({ isActive }) => (isActive ? 'var(--brand-primary)' : 'var(--brand-surface)')};
	color: ${({ isActive }) => (isActive ? 'white' : 'var(--brand-text)')};
	border: 2px solid ${({ isActive }) => (isActive ? 'var(--brand-primary)' : 'rgba(0, 0, 0, 0.1)')};
	border-radius: var(--brand-radius-md);
	cursor: pointer;
	transition: var(--brand-transition);
	font-size: ${({ compact }) => (compact ? '0.75rem' : '0.875rem')};
	font-weight: 500;
	min-height: ${({ compact }) => (compact ? '60px' : '80px')};

	&:hover {
		background: ${({ isActive }) => (isActive ? 'var(--brand-primary)' : 'var(--brand-accent)')};
		color: white;
		transform: translateY(-2px);
		box-shadow: var(--brand-shadow-md);
	}

	&:focus {
		outline: 2px solid var(--brand-primary);
		outline-offset: 2px;
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}
`;

const BrandLogo = styled.span<{ compact?: boolean }>`
	font-size: ${({ compact }) => (compact ? '1.5rem' : '2rem')};
	line-height: 1;
`;

const BrandInfo = styled.div<{ compact?: boolean }>`
	display: flex;
	flex-direction: column;
	align-items: ${({ compact }) => (compact ? 'center' : 'flex-start')};
`;

const BrandName = styled.span<{ compact?: boolean }>`
	font-weight: 600;
	font-size: ${({ compact }) => (compact ? '0.75rem' : '0.875rem')};
	line-height: 1.2;
`;

const BrandDescription = styled.span<{ compact?: boolean }>`
	font-size: ${({ compact }) => (compact ? '0.625rem' : '0.75rem')};
	opacity: 0.8;
	line-height: 1.2;
	display: ${({ compact }) => (compact ? 'none' : 'block')};
`;

// ============================================================================
// COMPONENT
// ============================================================================

export const BrandSelector: React.FC<BrandSelectorProps> = ({ onThemeChange, compact = false }) => {
	const { activeTheme, switchTheme, availableThemes, isTransitioning } = useBrandTheme();

	const handleThemeSelect = (themeName: string) => {
		if (isTransitioning) return;

		const theme = availableThemes.find((t) => t.name === themeName);
		if (theme) {
			switchTheme(themeName);
			onThemeChange?.(theme);
		}
	};

	return (
		<SelectorContainer compact={compact}>
			{!compact && <SelectorTitle>Select Corporate Brand</SelectorTitle>}

			<BrandGrid compact={compact}>
				{availableThemes.map((theme) => (
					<BrandOption
						key={theme.name}
						isActive={theme.name === activeTheme.name}
						compact={compact}
						onClick={() => handleThemeSelect(theme.name)}
						disabled={isTransitioning}
						aria-label={`Switch to ${theme.displayName} theme`}
						aria-pressed={theme.name === activeTheme.name}
					>
						<BrandLogo compact={compact}>{theme.brandSpecific.logo}</BrandLogo>
						<BrandInfo compact={compact}>
							<BrandName compact={compact}>{theme.displayName}</BrandName>
							{!compact && (
								<BrandDescription compact={compact}>
									{theme.brandSpecific.messaging.welcome}
								</BrandDescription>
							)}
						</BrandInfo>
					</BrandOption>
				))}
			</BrandGrid>
		</SelectorContainer>
	);
};

export default BrandSelector;
