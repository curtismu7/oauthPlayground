// src/services/collapsibleHeaderService.tsx
// ⭐ V6 SERVICE - Service for consistent collapsible headers with blue background and white arrows
// Used in: OAuthAuthorizationCodeFlowV6, Configuration page, Dashboard

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import styled from 'styled-components';

export interface CollapsibleHeaderConfig {
	title: string;
	subtitle?: string;
	icon?: React.ReactNode;
	defaultCollapsed?: boolean;
	showArrow?: boolean;
	variant?: 'default' | 'compact' | 'large';
	theme?: 'blue' | 'green' | 'orange' | 'purple';
}

export interface CollapsibleHeaderProps extends CollapsibleHeaderConfig {
	children: React.ReactNode;
	className?: string;
	onToggle?: () => void;
	isCollapsed?: boolean;
}

// Arrow icon component with the requested styling
const ArrowIcon = styled.div<{ $collapsed: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  transition: transform 0.2s ease, background-color 0.2s ease;
  cursor: pointer;

  transform: ${props => props.$collapsed ? 'rotate(0deg)' : 'rotate(180deg)'};

  &:hover {
    background: #2563eb;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

// Main collapsible header container
const CollapsibleHeaderContainer = styled.div<{ $variant: string }>`
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  background-color: #ffffff;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
  overflow: hidden;

  ${({ $variant }) => {
    switch ($variant) {
      case 'compact':
        return `
          margin-bottom: 1rem;
        `;
      case 'large':
        return `
          margin-bottom: 2rem;
        `;
      default:
        return '';
    }
  }}
`;

// Header button with blue styling
const HeaderButton = styled.button<{ $variant: string }>`
  width: 100%;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1.1rem;
  font-weight: 600;
  transition: background 0.2s ease;
  text-align: left;

  &:hover {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  }

  &:focus {
    outline: 2px solid #dbeafe;
    outline-offset: 2px;
  }

  ${({ $variant }) => {
    switch ($variant) {
      case 'compact':
        return `
          padding: 1rem 1.25rem;
          font-size: 1rem;
        `;
      case 'large':
        return `
          padding: 1.5rem 2rem;
          font-size: 1.25rem;
        `;
      default:
        return '';
    }
  }}
`;

// Header content area
const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
`;

// Header text container
const HeaderText = styled.div`
  flex: 1;
`;

// Header title
const HeaderTitle = styled.h3<{ $variant: string }>`
  margin: 0;
  font-weight: 600;
  line-height: 1.3;

  ${({ $variant }) => {
    switch ($variant) {
      case 'compact':
        return `
          font-size: 1rem;
        `;
      case 'large':
        return `
          font-size: 1.4rem;
        `;
      default:
        return `
          font-size: 1.1rem;
        `;
    }
  }}
`;

// Header subtitle
const HeaderSubtitle = styled.p`
  margin: 0.25rem 0 0 0;
  font-size: 0.9rem;
  opacity: 0.9;
  line-height: 1.4;
`;

// Content area with smooth animation
const ContentArea = styled.div<{ $collapsed: boolean; $variant: string }>`
  padding: ${({ $collapsed, $variant }) => {
    if ($collapsed) return '0';
    switch ($variant) {
      case 'compact':
        return '1rem 1.25rem';
      case 'large':
        return '2rem';
      default:
        return '1.5rem';
    }
  }};
  max-height: ${({ $collapsed }) => $collapsed ? '0' : '2000px'};
  overflow: hidden;
  transition: all 0.3s ease;
  background: #ffffff;
  border-top: ${({ $collapsed }) => $collapsed ? 'none' : '1px solid #f1f5f9'};
`;

// Icon container
const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

// Default arrow SVG - Right arrow when collapsed, Down arrow when expanded
const DefaultArrowIcon: React.FC<{ collapsed: boolean }> = ({ collapsed }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d={collapsed ? "M9 6L15 12L9 18" : "M6 9L12 15L18 9"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Main collapsible header component
export const CollapsibleHeader: React.FC<CollapsibleHeaderProps> = ({
	title,
	subtitle,
	icon,
	defaultCollapsed = false,
	showArrow = true,
	variant = 'default',
	children,
	className,
	onToggle,
	isCollapsed: controlledCollapsed = undefined
}) => {
	// Support both controlled and uncontrolled modes
	const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
	
	// Use controlled value if provided, otherwise use internal state
	const isControlled = controlledCollapsed !== undefined;
	const isCollapsed = isControlled ? controlledCollapsed : internalCollapsed;

	// Sync internal state with defaultCollapsed only on mount or when switching from controlled to uncontrolled
	useEffect(() => {
		if (!isControlled) {
			setInternalCollapsed(defaultCollapsed);
		}
	}, [defaultCollapsed, isControlled]);

	const toggleCollapsed = useCallback(() => {
		if (!isControlled) {
			setInternalCollapsed(prev => !prev);
		}
		// Always call onToggle if provided
		onToggle?.();
	}, [isControlled, onToggle]);

	return (
		<CollapsibleHeaderContainer $variant={variant} className={className}>
			<HeaderButton
				$variant={variant}
				onClick={toggleCollapsed}
				aria-expanded={!isCollapsed}
				aria-controls={`content-${title?.replace(/\s+/g, '-').toLowerCase()}`}
			>
				<HeaderContent>
					{icon && <IconContainer>{icon}</IconContainer>}
					<HeaderText>
						<HeaderTitle $variant={variant}>{title}</HeaderTitle>
						{subtitle && <HeaderSubtitle>{subtitle}</HeaderSubtitle>}
					</HeaderText>
				</HeaderContent>
				{showArrow && (
					<ArrowIcon $collapsed={isCollapsed}>
						<DefaultArrowIcon collapsed={isCollapsed} />
					</ArrowIcon>
				)}
			</HeaderButton>
			<ContentArea
				$collapsed={isCollapsed}
				$variant={variant}
				id={`content-${title?.replace(/\s+/g, '-').toLowerCase()}`}
				aria-labelledby={`header-${title?.replace(/\s+/g, '-').toLowerCase()}`}
			>
				{children}
			</ContentArea>
		</CollapsibleHeaderContainer>
	);
};

// Utility function to create themed collapsible headers
export const createThemedCollapsibleHeader = (theme: CollapsibleHeaderConfig['theme'] = 'blue') => {
  return (props: Omit<CollapsibleHeaderProps, 'theme'>) => (
    <CollapsibleHeader {...props} theme={theme} />
  );
};

// Pre-configured header variants
export const BlueCollapsibleHeader = createThemedCollapsibleHeader('blue');
export const GreenCollapsibleHeader = createThemedCollapsibleHeader('green');
export const OrangeCollapsibleHeader = createThemedCollapsibleHeader('orange');
export const PurpleCollapsibleHeader = createThemedCollapsibleHeader('purple');

// Hook for managing collapsible state externally
export const useCollapsibleState = (defaultCollapsed = false) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const toggle = useCallback(() => setIsCollapsed(!isCollapsed), [isCollapsed]);
  const expand = useCallback(() => setIsCollapsed(false), []);
  const collapse = useCallback(() => setIsCollapsed(true), []);

  return useMemo(() => ({
    isCollapsed,
    toggle,
    expand,
    collapse
  }), [isCollapsed, toggle, expand, collapse]);
};

export default {
  CollapsibleHeader,
  BlueCollapsibleHeader,
  GreenCollapsibleHeader,
  OrangeCollapsibleHeader,
  PurpleCollapsibleHeader,
  useCollapsibleState
};

