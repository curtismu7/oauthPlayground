import React from 'react';

const ErrorDisplay = ({ 
  error, 
  onRetry, 
  onDismiss,
  showDetails = false,
  className = '' 
}) => {
  if (!error) return null;

  const getErrorMessage = (error) => {
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    return 'An unexpected error occurred';
  };

  const getErrorCode = (error) => {
    return error.code || 'UNKNOWN_ERROR';
  };

  const getErrorType = (error) => {
    const code = getErrorCode(error);
    
    switch (code) {
      case 'UNAUTHORIZED':
        return 'auth';
      case 'FORBIDDEN':
        return 'permission';
      case 'NOT_FOUND':
        return 'notfound';
      case 'NETWORK_ERROR':
        return 'network';
      case 'SERVER_ERROR':
        return 'server';
      case 'RATE_LIMITED':
        return 'ratelimit';
      default:
        return 'general';
    }
  };

  const getErrorIcon = (type) => {
    switch (type) {
      case 'auth':
        return '🔒';
      case 'permission':
        return '⛔';
      case 'notfound':
        return '🔍';
      case 'network':
        return '🌐';
      case 'server':
        return '⚠️';
      case 'ratelimit':
        return '⏱️';
      default:
        return '❌';
    }
  };

  const errorType = getErrorType(error);
  const errorMessage = getErrorMessage(error);
  const errorCode = getErrorCode(error);
  const errorIcon = getErrorIcon(errorType);

  return (
    <div className={`error-display error-${errorType} ${className}`}>
      <div className="error-content">
        <div className="error-header">
          <span className="error-icon">{errorIcon}</span>
          <h3 className="error-title">
            {errorType === 'auth' && 'Authentication Required'}
            {errorType === 'permission' && 'Access Denied'}
            {errorType === 'notfound' && 'Not Found'}
            {errorType === 'network' && 'Connection Error'}
            {errorType === 'server' && 'Server Error'}
            {errorType === 'ratelimit' && 'Rate Limited'}
            {errorType === 'general' && 'Error'}
          </h3>
        </div>
        
        <div className="error-message">
          {errorMessage}
        </div>

        {error.details?.requiredScopes && (
          <div className="error-scopes">
            <p>Required permissions:</p>
            <ul>
              {error.details.requiredScopes.map(scope => (
                <li key={scope}>{scope}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="error-actions">
          {onRetry && (
            <button 
              onClick={onRetry}
              className="btn btn-primary"
            >
              Try Again
            </button>
          )}
          
          {onDismiss && (
            <button 
              onClick={onDismiss}
              className="btn btn-secondary"
            >
              Dismiss
            </button>
          )}

          {errorType === 'auth' && (
            <button 
              onClick={() => window.location.href = '/'}
              className="btn btn-primary"
            >
              Login
            </button>
          )}
        </div>

        {showDetails && process.env.NODE_ENV === 'development' && (
          <details className="error-details">
            <summary>Technical Details</summary>
            <div className="error-technical">
              <p><strong>Code:</strong> {errorCode}</p>
              {error.details && (
                <pre>{JSON.stringify(error.details, null, 2)}</pre>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

// Inline error component for smaller spaces
export const InlineError = ({ error, onDismiss }) => {
  if (!error) return null;

  return (
    <div className="inline-error">
      <span className="inline-error-icon">⚠️</span>
      <span className="inline-error-message">
        {typeof error === 'string' ? error : error.message}
      </span>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="inline-error-dismiss"
          aria-label="Dismiss error"
        >
          ×
        </button>
      )}
    </div>
  );
};

// Toast-style error notification
export const ErrorToast = ({ error, onDismiss, autoHide = true }) => {
  React.useEffect(() => {
    if (autoHide && onDismiss) {
      const timer = setTimeout(onDismiss, 5000);
      return () => clearTimeout(timer);
    }
  }, [autoHide, onDismiss]);

  if (!error) return null;

  return (
    <div className="error-toast">
      <div className="error-toast-content">
        <span className="error-toast-icon">❌</span>
        <span className="error-toast-message">
          {typeof error === 'string' ? error : error.message}
        </span>
        {onDismiss && (
          <button 
            onClick={onDismiss}
            className="error-toast-dismiss"
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

// Error page component
export const ErrorPage = ({ error, onRetry }) => (
  <div className="error-page">
    <div className="error-page-content">
      <ErrorDisplay 
        error={error} 
        onRetry={onRetry}
        showDetails={true}
        className="error-page-display"
      />
    </div>
  </div>
);

export default ErrorDisplay;