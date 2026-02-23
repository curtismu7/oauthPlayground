/**
 * @file StandardHeader.tsx
 * @module components
 * @description Standardized header component with unified blue styling and collapsible functionality
 * @version 1.0.0
 * @since 2026-02-23
 */

import React from 'react';

export interface StandardHeaderProps {
  title: string;
  description?: string;
  icon?: string; // MDI icon name
  isCollapsible?: boolean;
  isCollapsed?: boolean;
  onToggle?: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
  badge?: {
    text: string;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  };
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const StandardHeader: React.FC<StandardHeaderProps> = ({
  title,
  description,
  icon,
  isCollapsible = true,
  isCollapsed = false,
  onToggle,
  variant = 'primary',
  badge,
  className = '',
  style,
  children,
}) => {
  const handleClick = () => {
    if (isCollapsible && onToggle) {
      onToggle();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isCollapsible && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onToggle?.();
    }
  };

  return (
    <>
      <style>
        {`
          /* Standard Header CSS Variables */
          :root {
            /* Primary Blue Header Colors */
            --header-bg-primary: #2563EB;
            --header-bg-hover: #1D4ED8;
            --header-bg-active: #1E40AF;
            --header-text-primary: #FFFFFF;
            --header-text-secondary: #F3F4F6;
            --header-border: #1E40AF;
            --header-icon: #FFFFFF;

            /* Secondary Header Colors */
            --header-secondary-bg: #64748B;
            --header-secondary-hover: #475569;
            --header-secondary-active: #334155;
            --header-secondary-border: #334155;

            /* Accent Header Colors */
            --header-accent-bg: #7C3AED;
            --header-accent-hover: #6D28D9;
            --header-accent-active: #5B21B6;
            --header-accent-border: #5B21B6;

            /* Header Typography */
            --header-title-size: 1.125rem;
            --header-title-weight: 600;
            --header-title-line-height: 1.5;
            --header-desc-size: 0.875rem;
            --header-desc-weight: 400;
            --header-desc-line-height: 1.4;
            --header-spacing: 1rem;

            /* Header Dimensions */
            --header-height: 3.5rem;
            --header-padding-x: 0.75rem;
            --header-padding-y: 0.875rem;
            --header-border-radius: 0.5rem;
            --header-margin-bottom: 1rem;
            --icon-size: 1.25rem;
            --icon-margin: 0.75rem;
          }

          /* Base Header Styles */
          .standard-header {
            background: var(--header-bg-primary);
            border: 1px solid var(--header-border);
            border-radius: var(--header-border-radius);
            min-height: var(--header-height);
            padding: var(--header-padding-y) var(--header-padding-x);
            margin-bottom: var(--header-margin-bottom);
            cursor: pointer;
            transition: all 0.2s ease-in-out;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            z-index: 1; /* Ensure header doesn't cover sidebar */
          }

          .standard-header:hover {
            background: var(--header-bg-hover);
            border-color: var(--header-bg-hover);
            /* Remove translateY transform to prevent overlapping sidebar */
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
          }

          .standard-header:active {
            background: var(--header-bg-active);
            /* Remove transform to prevent layout shifts */
          }

          .standard-header--secondary {
            background: var(--header-secondary-bg);
            border-color: var(--header-secondary-border);
          }

          .standard-header--secondary:hover {
            background: var(--header-secondary-hover);
            border-color: var(--header-secondary-hover);
            box-shadow: 0 4px 12px rgba(100, 116, 139, 0.15);
          }

          .standard-header--secondary:active {
            background: var(--header-secondary-active);
          }

          .standard-header--accent {
            background: var(--header-accent-bg);
            border-color: var(--header-accent-border);
          }

          .standard-header--accent:hover {
            background: var(--header-accent-hover);
            border-color: var(--header-accent-hover);
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.15);
          }

          .standard-header--accent:active {
            background: var(--header-accent-active);
          }

          /* Header Content Layout */
          .standard-header__content {
            display: flex;
            align-items: center;
            gap: var(--icon-margin);
            width: 100%;
          }

          /* Icon Styles */
          .standard-header__icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: var(--icon-size);
            height: var(--icon-size);
            color: #FFFFFF !important;
            flex-shrink: 0;
          }

          /* Text Styles */
          .standard-header__text {
            flex: 1;
            min-width: 0;
          }

          .standard-header__title {
            font-size: var(--header-title-size);
            font-weight: var(--header-title-weight);
            line-height: var(--header-title-line-height);
            color: #FFFFFF !important;
            margin: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .standard-header__description {
            font-size: var(--header-desc-size);
            font-weight: var(--header-desc-weight);
            line-height: var(--header-desc-line-height);
            color: #F3F4F6 !important;
            margin: 0.25rem 0 0 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          /* Badge Styles */
          .standard-header__badge {
            padding: 0.25rem 0.5rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
            flex-shrink: 0;
          }

          .standard-header__badge--default {
            background: rgba(255, 255, 255, 0.2);
            color: var(--header-text-primary);
          }

          .standard-header__badge--primary {
            background: rgba(59, 130, 246, 0.2);
            color: #93C5FD;
          }

          .standard-header__badge--success {
            background: rgba(34, 197, 94, 0.2);
            color: #4ADE80;
          }

          .standard-header__badge--warning {
            background: rgba(251, 146, 60, 0.2);
            color: #FCD34D;
          }

          .standard-header__badge--danger {
            background: rgba(239, 68, 68, 0.2);
            color: #F87171;
          }

          /* Toggle Styles */
          .standard-header__toggle {
            display: flex;
            align-items: center;
            justify-content: center;
            width: var(--icon-size);
            height: var(--icon-size);
            color: #FFFFFF !important;
            transition: transform 0.2s ease-in-out;
            flex-shrink: 0;
          }

          .standard-header__toggle.collapsed {
            transform: rotate(-90deg);
          }

          .standard-header__toggle.expanded {
            transform: rotate(0deg);
          }

          /* Responsive Design */
          @media (max-width: 768px) {
            .standard-header {
              padding: 0.75rem 1rem;
              min-height: auto;
            }

            .standard-header__title {
              font-size: 1rem;
            }

            .standard-header__description {
              font-size: 0.8rem;
            }

            .standard-header__icon,
            .standard-header__toggle {
              width: 1rem;
              height: 1rem;
            }

            .standard-header__badge {
              font-size: 0.7rem;
              padding: 0.2rem 0.4rem;
            }
          }

          /* Accessibility */
          .standard-header:focus-visible {
            outline: 2px solid var(--header-text-primary);
            outline-offset: 2px;
          }

          /* Non-clickable variant */
          .standard-header:not([role="button"]):not([tabindex]) {
            cursor: default;
          }

          .standard-header:not([role="button"]):not([tabindex]):hover {
            transform: none;
            box-shadow: none;
          }
        `}
      </style>

      <div
        className={`standard-header standard-header--${variant} ${className}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role={isCollapsible ? "button" : "heading"}
        tabIndex={isCollapsible ? 0 : undefined}
        aria-expanded={isCollapsible ? !isCollapsed : undefined}
        aria-label={isCollapsible ? `${title}, ${isCollapsed ? 'expand' : 'collapse'}` : title}
        style={style}
      >
        <div className="standard-header__content">
          {icon && (
            <div className="standard-header__icon">
              <span className={`mdi mdi-${icon}`}></span>
            </div>
          )}
          
          <div className="standard-header__text">
            <h3 className="standard-header__title">{title}</h3>
            {description && (
              <p className="standard-header__description">{description}</p>
            )}
          </div>
          
          {badge && (
            <div className={`standard-header__badge standard-header__badge--${badge.variant || 'default'}`}>
              {badge.text}
            </div>
          )}
          
          {isCollapsible && (
            <div className={`standard-header__toggle ${isCollapsed ? 'collapsed' : 'expanded'}`}>
              <span className="mdi mdi-chevron-down"></span>
            </div>
          )}
        </div>
      </div>
      
      {children && !isCollapsed && (
        <div className="standard-header__content">
          {children}
        </div>
      )}
    </>
  );
};

export default StandardHeader;
