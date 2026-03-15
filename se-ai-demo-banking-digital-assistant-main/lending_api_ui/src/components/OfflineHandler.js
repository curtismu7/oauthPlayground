import React, { useState, useEffect } from 'react';

/**
 * Offline State Hook
 */
export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Trigger reconnection logic
        window.dispatchEvent(new CustomEvent('app:reconnected'));
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      window.dispatchEvent(new CustomEvent('app:disconnected'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
};

/**
 * Offline Banner Component
 */
export const OfflineBanner = ({ className = '' }) => {
  const { isOnline, wasOffline } = useOfflineStatus();
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div className={`offline-banner ${isOnline ? 'reconnected' : 'offline'} ${className}`}>
      <div className="offline-banner-content">
        {isOnline ? (
          <>
            <span className="offline-icon">✅</span>
            <span className="offline-message">Connection restored</span>
          </>
        ) : (
          <>
            <span className="offline-icon">📡</span>
            <span className="offline-message">
              You're offline. Some features may not be available.
            </span>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Offline Wrapper Component
 */
export const OfflineWrapper = ({ 
  children, 
  fallback = null, 
  showBanner = true,
  className = '' 
}) => {
  const { isOnline } = useOfflineStatus();

  return (
    <div className={`offline-wrapper ${className}`}>
      {showBanner && <OfflineBanner />}
      {isOnline ? children : (fallback || <OfflineFallback />)}
    </div>
  );
};

/**
 * Default Offline Fallback Component
 */
export const OfflineFallback = ({ className = '' }) => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className={`offline-fallback ${className}`}>
      <div className="offline-fallback-content">
        <div className="offline-fallback-icon">📡</div>
        <h2>You're offline</h2>
        <p>
          Please check your internet connection and try again.
          Some features may not be available while offline.
        </p>
        <div className="offline-fallback-actions">
          <button onClick={handleRetry} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Network Status Component
 */
export const NetworkStatus = ({ className = '' }) => {
  const { isOnline } = useOfflineStatus();
  const [connectionType, setConnectionType] = useState('unknown');

  useEffect(() => {
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        setConnectionType(connection.effectiveType || 'unknown');
        
        const handleConnectionChange = () => {
          setConnectionType(connection.effectiveType || 'unknown');
        };
        
        connection.addEventListener('change', handleConnectionChange);
        return () => connection.removeEventListener('change', handleConnectionChange);
      }
    }
  }, []);

  return (
    <div className={`network-status ${isOnline ? 'online' : 'offline'} ${className}`}>
      <span className="network-indicator">
        {isOnline ? '🟢' : '🔴'}
      </span>
      <span className="network-text">
        {isOnline ? `Online (${connectionType})` : 'Offline'}
      </span>
    </div>
  );
};

/**
 * Retry Component for Failed Requests
 */
export const RetryComponent = ({ 
  onRetry, 
  error = null, 
  retryCount = 0, 
  maxRetries = 3,
  className = '' 
}) => {
  const { isOnline } = useOfflineStatus();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (!isOnline) {
      return;
    }

    setIsRetrying(true);
    try {
      await onRetry();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const canRetry = isOnline && retryCount < maxRetries;

  return (
    <div className={`retry-component ${className}`}>
      <div className="retry-content">
        <div className="retry-icon">⚠️</div>
        <div className="retry-message">
          {!isOnline ? (
            'Connection lost. Please check your internet connection.'
          ) : error ? (
            `Failed to load: ${typeof error === 'string' ? error : error.message}`
          ) : (
            'Something went wrong. Please try again.'
          )}
        </div>
        
        {canRetry && (
          <div className="retry-actions">
            <button 
              onClick={handleRetry}
              disabled={isRetrying || !isOnline}
              className="btn btn-primary"
            >
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </button>
          </div>
        )}
        
        {retryCount >= maxRetries && (
          <div className="retry-limit">
            <p>Maximum retry attempts reached. Please refresh the page.</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn btn-secondary"
            >
              Refresh Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Higher-order component for offline handling
 */
export const withOfflineHandling = (Component) => {
  const WrappedComponent = (props) => {
    const { isOnline } = useOfflineStatus();
    
    return (
      <OfflineWrapper>
        <Component {...props} isOnline={isOnline} />
      </OfflineWrapper>
    );
  };
  
  WrappedComponent.displayName = `withOfflineHandling(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default OfflineWrapper;