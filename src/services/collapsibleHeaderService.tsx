// src/services/collapsibleHeaderService.tsx
// Service for consistent collapsible headers with blue background and white arrows

import React, { useState } from 'react';
import styled from 'styled-components';

export interface CollapsibleHeaderConfig {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  defaultCollapsed?: boolean;
  showArrow?: boolean;
  variant?: 'default' | 'compact' | 'large';
  theme?: 'blue' | 'green' | 'orange' | 'purple' | 'yellow' | 'highlight';
}

export interface CollapsibleHeaderProps extends CollapsibleHeaderConfig {
  children: React.ReactNode;
  className?: string;
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

// Header button with theme-based styling
const HeaderButton = styled.button<{ $variant: string; $theme: string }>`
  width: 100%;
  padding: 1.25rem 1.5rem;
  ${({ $theme }) => {
    switch ($theme) {
      case 'highlight':
        return `
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          box-shadow: 0 4px 20px rgba(249, 115, 22, 0.4);
          animation: pulse-glow 2s ease-in-out infinite;
          
          @keyframes pulse-glow {
            0%, 100% {
              box-shadow: 0 4px 20px rgba(249, 115, 22, 0.4);
            }
            50% {
              box-shadow: 0 8px 30px rgba(249, 115, 22, 0.6);
            }
          }
          
          &:hover {
            background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
            box-shadow: 0 6px 25px rgba(249, 115, 22, 0.5);
          }
          
          &:focus {
            outline: 2px solid #fed7aa;
            outline-offset: 2px;
          }
        `;
      case 'green':
        return `
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          &:hover {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
          }
          &:focus {
            outline: 2px solid #d1fae5;
            outline-offset: 2px;
          }
        `;
      case 'orange':
        return `
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          &:hover {
            background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
          }
          &:focus {
            outline: 2px solid #fef3c7;
            outline-offset: 2px;
          }
        `;
      case 'purple':
        return `
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          &:hover {
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          }
          &:focus {
            outline: 2px solid #ede9fe;
            outline-offset: 2px;
          }
        `;
      case 'yellow':
        return `
          background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%);
          &:hover {
            background: linear-gradient(135deg, #ca8a04 0%, #a16207 100%);
          }
          &:focus {
            outline: 2px solid #fef9c3;
            outline-offset: 2px;
          }
        `;
      default: // blue
        return `
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          &:hover {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          }
          &:focus {
            outline: 2px solid #dbeafe;
            outline-offset: 2px;
          }
        `;
    }
  }}
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1.1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  text-align: left;

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
  max-height: ${({ $collapsed }) => $collapsed ? '0' : 'none'};
  overflow: ${({ $collapsed }) => $collapsed ? 'hidden' : 'visible'};
  transition: ${({ $collapsed}) => $collapsed ? 'all 0.3s ease' : 'none'};
  background: #ffffff;
  border-top: ${({ $collapsed }) => $collapsed ? 'none' : '1px solid #f1f5f9'};
  pointer-events: ${({ $collapsed }) => $collapsed ? 'none' : 'auto'};
  position: relative;
  z-index: 1;
  
  /* Ensure all child elements can receive pointer events when not collapsed */
  * {
    pointer-events: ${({ $collapsed }) => $collapsed ? 'none' : 'auto'};
  }
`;

// Icon container
const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

// Default arrow SVG
const DefaultArrowIcon: React.FC<{ collapsed: boolean }> = ({ collapsed }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d={collapsed ? "M6 9L12 15L18 9" : "M18 15L12 9L6 15"}
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
  theme = 'blue',
  children,
  className
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <CollapsibleHeaderContainer $variant={variant} className={className}>
      <HeaderButton
        $variant={variant}
        $theme={theme}
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
export const HighlightCollapsibleHeader = createThemedCollapsibleHeader('highlight');

// Hook for managing collapsible state externally
export const useCollapsibleState = (defaultCollapsed = false) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const toggle = () => setIsCollapsed(!isCollapsed);
  const expand = () => setIsCollapsed(false);
  const collapse = () => setIsCollapsed(true);

  return {
    isCollapsed,
    toggle,
    expand,
    collapse
  };
};

export default {
  CollapsibleHeader,
  BlueCollapsibleHeader,
  GreenCollapsibleHeader,
  OrangeCollapsibleHeader,
  PurpleCollapsibleHeader,
  HighlightCollapsibleHeader,
  useCollapsibleState
};