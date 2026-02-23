/**
 * @file bootstrap-button.tsx
 * @module components/bootstrap
 * @description PingOne Bootstrap Button component
 * @version 1.0.0
 * @since 2026-02-23
 */

import React from 'react';

interface BootstrapButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  whiteBorder?: boolean;
  outline?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  id?: string;
  'aria-label'?: string;
  'aria-disabled'?: boolean;
}

const BootstrapButton: React.FC<BootstrapButtonProps> = ({
  variant = 'primary',
  size = 'md',
  whiteBorder = false,
  outline = false,
  disabled = false,
  loading = false,
  className = '',
  children,
  onClick,
  type = 'button',
  id,
  'aria-label': ariaLabel,
  'aria-disabled': ariaDisabled,
}) => {
  const baseClasses = [
    'btn',
    outline ? `btn-outline-${variant}` : `btn-${variant}`,
    size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '',
    whiteBorder ? 'border-white' : '',
    loading ? 'btn-loading' : '',
    'ping-btn',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      id={id}
      className={baseClasses}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-disabled={ariaDisabled || disabled || loading}
    >
      {loading && (
        <>
          <span
            className="spinner-border spinner-border-sm me-2"
            aria-hidden="true"
          ></span>
          <span className="visually-hidden">Loading...</span>
        </>
      )}
      {children}
    </button>
  );
};

export default BootstrapButton;
