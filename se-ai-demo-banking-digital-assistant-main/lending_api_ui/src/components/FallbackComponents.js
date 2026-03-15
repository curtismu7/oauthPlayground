import React from 'react';
import ErrorDisplay from './ErrorDisplay';
import { LoadingSpinner } from './LoadingComponents';

/**
 * Service Unavailable Fallback Component
 */
export const ServiceUnavailableFallback = ({ 
  serviceName = 'Service', 
  onRetry = null,
  className = '' 
}) => {
  return (
    <div className={`service-unavailable-fallback ${className}`}>
      <div className="fallback-content">
        <div className="fallback-icon">🚫</div>
        <h2>{serviceName} Unavailable</h2>
        <p>
          The {serviceName.toLowerCase()} is currently unavailable. 
          This might be due to maintenance or a temporary issue.
        </p>
        <div className="fallback-actions">
          {onRetry && (
            <button onClick={onRetry} className="btn btn-primary">
              Try Again
            </button>
          )}
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-secondary"
          >
            Refresh Page
          </button>
        </div>
        <div className="fallback-help">
          <p>If the problem persists, please contact support.</p>
        </div>
      </div>
    </div>
  );
};

/**
 * API Error Fallback Component
 */
export const APIErrorFallback = ({ 
  error, 
  onRetry = null, 
  onDismiss = null,
  className = '' 
}) => {
  const getErrorType = (error) => {
    if (error?.response?.status >= 500) return 'server';
    if (error?.response?.status === 404) return 'notfound';
    if (error?.response?.status === 403) return 'permission';
    if (error?.response?.status === 401) return 'auth';
    if (error?.code === 'NETWORK_ERROR') return 'network';
    return 'general';
  };

  const errorType = getErrorType(error);

  return (
    <div className={`api-error-fallback ${className}`}>
      <ErrorDisplay 
        error={error}
        onRetry={onRetry}
        onDismiss={onDismiss}
        showDetails={true}
      />
      
      {errorType === 'server' && (
        <div className="error-suggestions">
          <h4>What you can do:</h4>
          <ul>
            <li>Wait a few minutes and try again</li>
            <li>Check if other parts of the application work</li>
            <li>Contact support if the issue persists</li>
          </ul>
        </div>
      )}
      
      {errorType === 'network' && (
        <div className="error-suggestions">
          <h4>Connection issues:</h4>
          <ul>
            <li>Check your internet connection</li>
            <li>Try refreshing the page</li>
            <li>Disable any VPN or proxy</li>
          </ul>
        </div>
      )}
    </div>
  );
};

/**
 * Data Loading Fallback Component
 */
export const DataLoadingFallback = ({ 
  message = 'Loading data...', 
  timeout = 30000,
  onTimeout = null,
  className = '' 
}) => {
  const [hasTimedOut, setHasTimedOut] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setHasTimedOut(true);
      if (onTimeout) {
        onTimeout();
      }
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout, onTimeout]);

  if (hasTimedOut) {
    return (
      <div className={`data-loading-timeout ${className}`}>
        <div className="timeout-content">
          <div className="timeout-icon">⏱️</div>
          <h3>Taking longer than expected</h3>
          <p>The data is taking longer to load than usual.</p>
          <div className="timeout-actions">
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-primary"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`data-loading-fallback ${className}`}>
      <LoadingSpinner message={message} size="large" />
    </div>
  );
};

/**
 * Empty State Fallback Component
 */
export const EmptyStateFallback = ({ 
  title = 'No data available',
  message = 'There is no data to display at this time.',
  actionText = null,
  onAction = null,
  icon = '📭',
  className = '' 
}) => {
  return (
    <div className={`empty-state-fallback ${className}`}>
      <div className="empty-state-content">
        <div className="empty-state-icon">{icon}</div>
        <h3>{title}</h3>
        <p>{message}</p>
        {actionText && onAction && (
          <div className="empty-state-actions">
            <button onClick={onAction} className="btn btn-primary">
              {actionText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Permission Denied Fallback Component
 */
export const PermissionDeniedFallback = ({ 
  requiredPermissions = [],
  onRequestAccess = null,
  className = '' 
}) => {
  return (
    <div className={`permission-denied-fallback ${className}`}>
      <div className="fallback-content">
        <div className="fallback-icon">🔒</div>
        <h2>Access Denied</h2>
        <p>
          You don't have the necessary permissions to access this content.
        </p>
        
        {requiredPermissions.length > 0 && (
          <div className="required-permissions">
            <h4>Required permissions:</h4>
            <ul>
              {requiredPermissions.map((permission, index) => (
                <li key={index}>{permission}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="fallback-actions">
          {onRequestAccess && (
            <button onClick={onRequestAccess} className="btn btn-primary">
              Request Access
            </button>
          )}
          <button 
            onClick={() => window.history.back()} 
            className="btn btn-secondary"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Maintenance Mode Fallback Component
 */
export const MaintenanceFallback = ({ 
  estimatedTime = null,
  message = 'We are currently performing scheduled maintenance.',
  className = '' 
}) => {
  return (
    <div className={`maintenance-fallback ${className}`}>
      <div className="fallback-content">
        <div className="fallback-icon">🔧</div>
        <h2>Under Maintenance</h2>
        <p>{message}</p>
        
        {estimatedTime && (
          <div className="maintenance-time">
            <p><strong>Estimated completion:</strong> {estimatedTime}</p>
          </div>
        )}
        
        <div className="fallback-actions">
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-primary"
          >
            Check Again
          </button>
        </div>
        
        <div className="fallback-help">
          <p>Thank you for your patience. We'll be back shortly!</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Generic Fallback Component
 */
export const GenericFallback = ({ 
  title = 'Something went wrong',
  message = 'An unexpected error occurred.',
  icon = '⚠️',
  actions = [],
  className = '' 
}) => {
  return (
    <div className={`generic-fallback ${className}`}>
      <div className="fallback-content">
        <div className="fallback-icon">{icon}</div>
        <h2>{title}</h2>
        <p>{message}</p>
        
        {actions.length > 0 && (
          <div className="fallback-actions">
            {actions.map((action, index) => (
              <button 
                key={index}
                onClick={action.onClick}
                className={`btn ${action.variant || 'btn-primary'}`}
              >
                {action.text}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Fallback Router Component
 * Routes to appropriate fallback based on error type
 */
export const FallbackRouter = ({ 
  error, 
  isLoading = false,
  isEmpty = false,
  isOffline = false,
  onRetry = null,
  className = '' 
}) => {
  // Loading state
  if (isLoading) {
    return <DataLoadingFallback className={className} />;
  }

  // Offline state
  if (isOffline) {
    return (
      <ServiceUnavailableFallback 
        serviceName="Network Connection"
        onRetry={onRetry}
        className={className}
      />
    );
  }

  // Empty state
  if (isEmpty) {
    return <EmptyStateFallback className={className} />;
  }

  // Error states
  if (error) {
    const status = error?.response?.status;
    
    switch (status) {
      case 401:
        return (
          <PermissionDeniedFallback 
            className={className}
            onRequestAccess={() => window.location.href = '/'}
          />
        );
      case 403:
        return (
          <PermissionDeniedFallback 
            requiredPermissions={error?.details?.requiredScopes || []}
            className={className}
          />
        );
      case 404:
        return (
          <EmptyStateFallback 
            title="Not Found"
            message="The requested resource could not be found."
            icon="🔍"
            className={className}
          />
        );
      case 503:
        return (
          <MaintenanceFallback 
            className={className}
          />
        );
      default:
        return (
          <APIErrorFallback 
            error={error}
            onRetry={onRetry}
            className={className}
          />
        );
    }
  }

  return null;
};

export default FallbackRouter;