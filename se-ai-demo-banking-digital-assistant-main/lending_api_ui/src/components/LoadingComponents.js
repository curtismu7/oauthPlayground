import React from 'react';

/**
 * Loading Spinner Component
 */
export const LoadingSpinner = ({ 
  size = 'medium', 
  message = 'Loading...', 
  className = '',
  showMessage = true 
}) => {
  return (
    <div className={`loading-spinner loading-spinner-${size} ${className}`}>
      <div className="spinner"></div>
      {showMessage && message && (
        <div className="loading-message">{message}</div>
      )}
    </div>
  );
};

/**
 * Inline Loading Component
 */
export const InlineLoader = ({ message = 'Loading...', className = '' }) => {
  return (
    <div className={`inline-loader ${className}`}>
      <div className="inline-spinner"></div>
      <span>{message}</span>
    </div>
  );
};

/**
 * Loading Overlay Component
 */
export const LoadingOverlay = ({ 
  isVisible = true, 
  message = 'Loading...', 
  className = '' 
}) => {
  if (!isVisible) return null;

  return (
    <div className={`loading-overlay ${className}`}>
      <LoadingSpinner size="large" message={message} />
    </div>
  );
};

/**
 * Page Loading Component
 */
export const PageLoader = ({ 
  message = 'Loading application...', 
  className = '' 
}) => {
  return (
    <div className={`page-loader ${className}`}>
      <div className="page-loader-content">
        <LoadingSpinner size="large" message={message} />
      </div>
    </div>
  );
};

/**
 * Section Loading Component
 */
export const SectionLoader = ({ 
  message = 'Loading content...', 
  className = '' 
}) => {
  return (
    <div className={`section-loader ${className}`}>
      <LoadingSpinner size="medium" message={message} />
    </div>
  );
};

/**
 * Loading Button Component
 */
export const LoadingButton = ({ 
  isLoading = false, 
  children, 
  className = '', 
  disabled = false,
  ...props 
}) => {
  return (
    <button 
      {...props}
      className={`btn ${className} ${isLoading ? 'loading' : ''}`}
      disabled={disabled || isLoading}
    >
      {isLoading && <div className="btn-spinner"></div>}
      {children}
    </button>
  );
};

/**
 * Loading Container Component
 */
export const LoadingContainer = ({ 
  isLoading = false, 
  error = null, 
  children, 
  loadingMessage = 'Loading...', 
  errorComponent = null,
  className = '' 
}) => {
  if (error) {
    return errorComponent || (
      <div className={`loading-container error ${className}`}>
        <div className="error-message">
          {typeof error === 'string' ? error : error.message}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`loading-container ${className}`}>
        <LoadingSpinner message={loadingMessage} />
      </div>
    );
  }

  return children;
};

/**
 * Skeleton Loading Component
 */
export const SkeletonLoader = ({ 
  lines = 3, 
  width = '100%', 
  height = '1rem', 
  className = '' 
}) => {
  return (
    <div className={`skeleton-loader ${className}`}>
      {Array.from({ length: lines }, (_, index) => (
        <div 
          key={index}
          className="skeleton-line"
          style={{ 
            width: Array.isArray(width) ? width[index] || '100%' : width,
            height: Array.isArray(height) ? height[index] || '1rem' : height
          }}
        />
      ))}
    </div>
  );
};

/**
 * Card Skeleton Component
 */
export const CardSkeleton = ({ className = '' }) => {
  return (
    <div className={`card skeleton-card ${className}`}>
      <div className="skeleton-header">
        <SkeletonLoader lines={1} width="60%" height="1.5rem" />
      </div>
      <div className="skeleton-content">
        <SkeletonLoader 
          lines={3} 
          width={['100%', '80%', '90%']} 
          height="1rem" 
        />
      </div>
    </div>
  );
};

/**
 * Table Skeleton Component
 */
export const TableSkeleton = ({ 
  rows = 5, 
  columns = 4, 
  className = '' 
}) => {
  return (
    <div className={`table-skeleton ${className}`}>
      <div className="skeleton-table-header">
        {Array.from({ length: columns }, (_, index) => (
          <div key={index} className="skeleton-table-cell">
            <SkeletonLoader lines={1} width="80%" height="1rem" />
          </div>
        ))}
      </div>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table-row">
          {Array.from({ length: columns }, (_, colIndex) => (
            <div key={colIndex} className="skeleton-table-cell">
              <SkeletonLoader lines={1} width="70%" height="1rem" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * Loading State Hook
 */
export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = React.useState(initialState);
  const [error, setError] = React.useState(null);

  const startLoading = React.useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const stopLoading = React.useCallback(() => {
    setIsLoading(false);
  }, []);

  const setLoadingError = React.useCallback((error) => {
    setIsLoading(false);
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  const executeAsync = React.useCallback(async (asyncFunction) => {
    try {
      startLoading();
      const result = await asyncFunction();
      stopLoading();
      return result;
    } catch (error) {
      setLoadingError(error);
      throw error;
    }
  }, [startLoading, stopLoading, setLoadingError]);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    clearError,
    executeAsync
  };
};

export default LoadingSpinner;