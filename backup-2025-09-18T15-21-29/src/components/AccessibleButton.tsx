 
import React from 'react';
import styled, { css } from 'styled-components';
import { useAccessibility } from '../hooks/useAccessibility';
import { ARIA_ROLES } from '../utils/accessibility';

// Button variants
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost';

// Button sizes
export type ButtonSize = 'sm' | 'md' | 'lg';

// Button props interface
export interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  ariaLabel?: string;
  ariaDescription?: string;
  announceOnClick?: boolean;
  announceLoading?: boolean;
}

// Styled button component
const StyledButton = styled.button<{
  variant: ButtonVariant;
  size: ButtonSize;
  fullWidth: boolean;
  loading: boolean;
  isFocused: boolean;
  isKeyboardUser: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1px solid transparent;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  
  /* Focus styles */
  outline: none;
  ${({ isFocused, isKeyboardUser }) => isFocused && isKeyboardUser && css`
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
  `}
  
  /* Disabled styles */
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  }
  
  /* Loading styles */
  ${({ loading }) => loading && css`
    pointer-events: none;
    opacity: 0.8;
  `}
  
  /* Full width */
  ${({ fullWidth }) => fullWidth && css`
    width: 100%;
  `}
  
  /* Size variants */
  ${({ size }) => {
    switch (size) {
      case 'sm':
        return css`
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          min-height: 2rem;
        `;
      case 'lg':
        return css`
          padding: 1rem 1.5rem;
          font-size: 1.125rem;
          min-height: 3rem;
        `;
      default: // md
        return css`
          padding: 0.75rem 1rem;
          font-size: 1rem;
          min-height: 2.5rem;
        `;
    }
  }}
  
  /* Color variants */
  ${({ variant, theme }) => {
    switch (variant) {
      case 'primary':
        return css`
          background: ${theme.colors.primary};
          color: white;
          border-color: ${theme.colors.primary};
          
          &:hover:not(:disabled) {
            background: ${theme.colors.primaryDark};
            border-color: ${theme.colors.primaryDark};
            transform: translateY(-1px);
          }
          
          &:active:not(:disabled) {
            transform: translateY(0);
          }
        `;
      case 'secondary':
        return css`
          background: ${theme.colors.gray200};
          color: ${theme.colors.gray900};
          border-color: ${theme.colors.gray300};
          
          &:hover:not(:disabled) {
            background: ${theme.colors.gray300};
            border-color: ${theme.colors.gray400};
            transform: translateY(-1px);
          }
          
          &:active:not(:disabled) {
            transform: translateY(0);
          }
        `;
      case 'danger':
        return css`
          background: ${theme.colors.danger};
          color: white;
          border-color: ${theme.colors.danger};
          
          &:hover:not(:disabled) {
            background: #dc2626;
            border-color: #dc2626;
            transform: translateY(-1px);
          }
          
          &:active:not(:disabled) {
            transform: translateY(0);
          }
        `;
      case 'success':
        return css`
          background: ${theme.colors.success};
          color: white;
          border-color: ${theme.colors.success};
          
          &:hover:not(:disabled) {
            background: #059669;
            border-color: #059669;
            transform: translateY(-1px);
          }
          
          &:active:not(:disabled) {
            transform: translateY(0);
          }
        `;
      case 'warning':
        return css`
          background: ${theme.colors.warning};
          color: white;
          border-color: ${theme.colors.warning};
          
          &:hover:not(:disabled) {
            background: #d97706;
            border-color: #d97706;
            transform: translateY(-1px);
          }
          
          &:active:not(:disabled) {
            transform: translateY(0);
          }
        `;
      case 'ghost':
        return css`
          background: transparent;
          color: ${theme.colors.primary};
          border-color: transparent;
          
          &:hover:not(:disabled) {
            background: ${theme.colors.gray100};
            color: ${theme.colors.primaryDark};
          }
          
          &:active:not(:disabled) {
            background: ${theme.colors.gray200};
          }
        `;
    }
  }}
`;

// Loading spinner
const LoadingSpinner = styled.div`
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Icon container
const IconContainer = styled.span<{ position: 'left' | 'right' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  ${({ position }) => position === 'right' && css`
    order: 1;
  `}
`;

// Screen reader only text
const ScreenReaderText = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

// AccessibleButton component
export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = 'left',
  ariaLabel,
  ariaDescription,
  announceOnClick = true,
  announceLoading = true,
  children,
  onClick,
  disabled,
  ...props
}) => {
  const {
    ariaProps,
    onKeyDown,
    onFocus,
    onBlur,
    announce,
    isFocused,
    isKeyboardUser
  } = useAccessibility({
    role: ARIA_ROLES.BUTTON,
    label: ariaLabel,
    description: ariaDescription,
    announceChanges: true,
    keyboardNavigation: true,
    screenReader: true
  });

  // Handle click with announcements
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) {
      event.preventDefault();
      return;
    }

    if (announceOnClick) {
      if (loading) {
        announce('Button clicked, loading...');
      } else {
        announce('Button clicked');
      }
    }

    onClick?.(event);
  };

  // Handle loading state announcements
  React.useEffect(() => {
    if (loading && announceLoading) {
      announce('Loading...', 'polite');
    }
  }, [loading, announceLoading, announce]);

  // Generate accessible label
  const accessibleLabel = ariaLabel || (typeof children === 'string' ? children : 'Button');
  const accessibleDescription = ariaDescription;

  return (
    <StyledButton
      {...props}
      {...ariaProps}
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      loading={loading}
      isFocused={isFocused}
      isKeyboardUser={isKeyboardUser}
      disabled={disabled || loading}
      onClick={handleClick}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      aria-label={accessibleLabel}
      aria-describedby={accessibleDescription ? `${accessibleLabel}-desc` : undefined}
      aria-disabled={disabled || loading}
      aria-busy={loading}
    >
      {/* Screen reader description */}
      {accessibleDescription && (
        <ScreenReaderText id={`${accessibleLabel}-desc`}>
          {accessibleDescription}
        </ScreenReaderText>
      )}
      
      {/* Loading state */}
      {loading && (
        <>
          <LoadingSpinner aria-hidden="true" />
          <ScreenReaderText>Loading...</ScreenReaderText>
        </>
      )}
      
      {/* Icon */}
      {icon && !loading && (
        <IconContainer position={iconPosition} aria-hidden="true">
          {icon}
        </IconContainer>
      )}
      
      {/* Button text */}
      {children && !loading && (
        <span>{children}</span>
      )}
      
      {/* Loading text */}
      {loading && children && (
        <ScreenReaderText>{children} - Loading...</ScreenReaderText>
      )}
    </StyledButton>
  );
};

export default AccessibleButton;
