import React, { createContext, useContext, useReducer, useCallback } from 'react';

/**
 * Notification Types
 */
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

/**
 * Notification Actions
 */
const NOTIFICATION_ACTIONS = {
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_ALL: 'CLEAR_ALL'
};

/**
 * Notification Reducer
 */
const notificationReducer = (state, action) => {
  switch (action.type) {
    case NOTIFICATION_ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, action.payload]
      };
    case NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.id !== action.payload
        )
      };
    case NOTIFICATION_ACTIONS.CLEAR_ALL:
      return {
        ...state,
        notifications: []
      };
    default:
      return state;
  }
};

/**
 * Notification Context
 */
const NotificationContext = createContext();

/**
 * Notification Provider Component
 */
export const NotificationProvider = ({ children, maxNotifications = 5 }) => {
  const [state, dispatch] = useReducer(notificationReducer, {
    notifications: []
  });

  const removeNotification = useCallback((id) => {
    dispatch({
      type: NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION,
      payload: id
    });
  }, []);

  const addNotification = useCallback((notification) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const newNotification = {
      id,
      timestamp: new Date(),
      autoHide: true,
      duration: 5000,
      ...notification
    };

    dispatch({
      type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION,
      payload: newNotification
    });

    // Auto-hide notification
    if (newNotification.autoHide) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    // Remove oldest notification if we exceed max
    if (state.notifications.length >= maxNotifications) {
      const oldestId = state.notifications[0]?.id;
      if (oldestId) {
        removeNotification(oldestId);
      }
    }

    return id;
  }, [state.notifications, maxNotifications, removeNotification]);

  const clearAll = useCallback(() => {
    dispatch({
      type: NOTIFICATION_ACTIONS.CLEAR_ALL
    });
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      message,
      ...options
    });
  }, [addNotification]);

  const showError = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.ERROR,
      message,
      autoHide: false, // Errors should be manually dismissed
      ...options
    });
  }, [addNotification]);

  const showWarning = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.WARNING,
      message,
      duration: 7000, // Warnings stay longer
      ...options
    });
  }, [addNotification]);

  const showInfo = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.INFO,
      message,
      ...options
    });
  }, [addNotification]);

  const value = {
    notifications: state.notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

/**
 * Notification Hook
 */
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

/**
 * Individual Notification Component
 */
const NotificationItem = ({ notification, onRemove }) => {
  const getIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return '✅';
      case NOTIFICATION_TYPES.ERROR:
        return '❌';
      case NOTIFICATION_TYPES.WARNING:
        return '⚠️';
      case NOTIFICATION_TYPES.INFO:
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  const handleClose = () => {
    onRemove(notification.id);
  };

  return (
    <div className={`notification notification-${notification.type}`}>
      <div className="notification-content">
        <span className="notification-icon">
          {notification.icon || getIcon(notification.type)}
        </span>
        <div className="notification-body">
          {notification.title && (
            <div className="notification-title">{notification.title}</div>
          )}
          <div className="notification-message">{notification.message}</div>
          {notification.details && (
            <div className="notification-details">{notification.details}</div>
          )}
        </div>
        <button 
          className="notification-close"
          onClick={handleClose}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
      
      {notification.actions && notification.actions.length > 0 && (
        <div className="notification-actions">
          {notification.actions.map((action, index) => (
            <button
              key={index}
              className={`btn btn-sm ${action.variant || 'btn-secondary'}`}
              onClick={() => {
                action.onClick();
                if (action.closeOnClick !== false) {
                  handleClose();
                }
              }}
            >
              {action.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Notification Container Component
 */
const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}
    </div>
  );
};

/**
 * Error Notification Hook
 * Specialized hook for handling API errors
 */
export const useErrorNotification = () => {
  const { showError, showWarning } = useNotifications();

  const handleApiError = useCallback((error, customMessage = null) => {
    let message = customMessage;
    let title = 'Error';
    let details = null;

    if (!message) {
      if (typeof error === 'string') {
        message = error;
      } else if (error?.message) {
        message = error.message;
      } else {
        message = 'An unexpected error occurred';
      }
    }

    // Add specific handling for different error types
    if (error?.response?.status) {
      const status = error.response.status;
      switch (status) {
        case 401:
          title = 'Authentication Required';
          message = 'Please log in to continue';
          break;
        case 403:
          title = 'Access Denied';
          message = 'You don\'t have permission to perform this action';
          if (error.details?.requiredScopes) {
            details = `Required permissions: ${error.details.requiredScopes.join(', ')}`;
          }
          break;
        case 404:
          title = 'Not Found';
          message = 'The requested resource was not found';
          break;
        case 429:
          title = 'Rate Limited';
          message = 'Too many requests. Please try again later';
          break;
        case 500:
          title = 'Server Error';
          message = 'Internal server error. Please try again later';
          break;
      }
    }

    return showError(message, {
      title,
      details,
      actions: error?.response?.status === 401 ? [
        {
          text: 'Login',
          variant: 'btn-primary',
          onClick: () => window.location.href = '/'
        }
      ] : undefined
    });
  }, [showError]);

  const handleNetworkError = useCallback(() => {
    return showError('Network connection failed', {
      title: 'Connection Error',
      details: 'Please check your internet connection and try again',
      actions: [
        {
          text: 'Retry',
          variant: 'btn-primary',
          onClick: () => window.location.reload()
        }
      ]
    });
  }, [showError]);

  const handleValidationError = useCallback((errors) => {
    const message = Array.isArray(errors) 
      ? errors.join(', ')
      : typeof errors === 'string' 
        ? errors 
        : 'Please check your input and try again';

    return showWarning(message, {
      title: 'Validation Error',
      duration: 7000
    });
  }, [showWarning]);

  return {
    handleApiError,
    handleNetworkError,
    handleValidationError
  };
};

export default NotificationProvider;