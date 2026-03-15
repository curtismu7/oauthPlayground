import React from 'react';

const LoadingSpinner = ({ 
  size = 'medium', 
  message = 'Loading...', 
  overlay = false,
  className = '' 
}) => {
  const sizeClasses = {
    small: 'loading-spinner-small',
    medium: 'loading-spinner-medium',
    large: 'loading-spinner-large'
  };

  const spinnerClass = `loading-spinner ${sizeClasses[size]} ${className}`;
  const containerClass = overlay ? 'loading-overlay' : 'loading-container';

  return (
    <div className={containerClass}>
      <div className={spinnerClass}>
        <div className="spinner"></div>
        {message && <div className="loading-message">{message}</div>}
      </div>
    </div>
  );
};

// Inline loading component for smaller spaces
export const InlineLoader = ({ message = 'Loading...' }) => (
  <div className="inline-loader">
    <div className="inline-spinner"></div>
    <span className="inline-message">{message}</span>
  </div>
);

// Button loading state
export const LoadingButton = ({ 
  children, 
  loading = false, 
  disabled = false,
  onClick,
  className = '',
  ...props 
}) => (
  <button
    className={`btn ${className} ${loading ? 'loading' : ''}`}
    disabled={disabled || loading}
    onClick={loading ? undefined : onClick}
    {...props}
  >
    {loading ? (
      <>
        <div className="btn-spinner"></div>
        Loading...
      </>
    ) : (
      children
    )}
  </button>
);

// Page loading overlay
export const PageLoader = ({ message = 'Loading page...' }) => (
  <div className="page-loader">
    <div className="page-loader-content">
      <LoadingSpinner size="large" message={message} />
    </div>
  </div>
);

// Section loading placeholder
export const SectionLoader = ({ message = 'Loading section...' }) => (
  <div className="section-loader">
    <LoadingSpinner size="medium" message={message} />
  </div>
);

export default LoadingSpinner;