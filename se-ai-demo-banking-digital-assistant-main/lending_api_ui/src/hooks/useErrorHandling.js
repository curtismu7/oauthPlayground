import { useState, useCallback, useEffect } from 'react';
import { useErrorNotification } from '../components/NotificationSystem';
import { useOfflineStatus } from '../components/OfflineHandler';

/**
 * Comprehensive Error Handling Hook
 */
export const useErrorHandling = (options = {}) => {
  const {
    showNotifications = true,
    autoRetry = false,
    maxRetries = 3,
    retryDelay = 1000,
    onError = null,
    onRetry = null
  } = options;

  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const { isOnline } = useOfflineStatus();
  const { handleApiError, handleNetworkError } = useErrorNotification();

  // Clear error when coming back online
  useEffect(() => {
    if (isOnline && error?.code === 'NETWORK_ERROR') {
      setError(null);
      setRetryCount(0);
    }
  }, [isOnline, error]);

  const retry = useCallback(async (retryFunction) => {
    if (!retryFunction || isRetrying) return;

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      if (onRetry) {
        onRetry(retryCount + 1);
      }

      const result = await retryFunction();
      
      // Success - clear error state
      setError(null);
      setRetryCount(0);
      setIsRetrying(false);
      
      return result;
    } catch (retryError) {
      setIsRetrying(false);
      
      // If we've exceeded max retries, don't handle the error again
      if (retryCount >= maxRetries - 1) {
        console.error('Max retries exceeded:', retryError);
        return;
      }
      
      throw retryError;
    }
  }, [isRetrying, retryCount, maxRetries, onRetry]);

  const handleError = useCallback((error, context = {}) => {
    console.error('Error handled:', error, context);
    
    setError(error);
    
    // Call custom error handler
    if (onError) {
      onError(error, context);
    }

    // Show notification if enabled
    if (showNotifications) {
      if (error?.code === 'NETWORK_ERROR' || !isOnline) {
        handleNetworkError();
      } else {
        handleApiError(error, context.customMessage);
      }
    }

    // Auto-retry logic
    if (autoRetry && retryCount < maxRetries && context.retryFunction) {
      setTimeout(() => {
        retry(context.retryFunction).catch(retryError => {
          // Handle retry errors without creating circular dependency
          console.error('Retry failed:', retryError);
        });
      }, retryDelay * Math.pow(2, retryCount)); // Exponential backoff
    }
  }, [
    showNotifications, 
    autoRetry, 
    maxRetries, 
    retryCount, 
    retryDelay, 
    onError, 
    handleApiError, 
    handleNetworkError, 
    isOnline,
    retry
  ]);

  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  const canRetry = useCallback(() => {
    return retryCount < maxRetries && isOnline && !isRetrying;
  }, [retryCount, maxRetries, isOnline, isRetrying]);

  return {
    error,
    retryCount,
    isRetrying,
    isOnline,
    handleError,
    retry,
    clearError,
    canRetry: canRetry()
  };
};

/**
 * API Error Handling Hook
 * Specialized for API operations
 */
export const useApiErrorHandling = (options = {}) => {
  const errorHandling = useErrorHandling({
    showNotifications: true,
    autoRetry: false,
    maxRetries: 3,
    ...options
  });

  const executeWithErrorHandling = useCallback(async (apiCall, context = {}) => {
    try {
      errorHandling.clearError();
      const result = await apiCall();
      return result;
    } catch (error) {
      errorHandling.handleError(error, {
        ...context,
        retryFunction: () => apiCall()
      });
      throw error;
    }
  }, [errorHandling]);

  return {
    ...errorHandling,
    executeWithErrorHandling
  };
};

/**
 * Form Error Handling Hook
 * Specialized for form validation and submission
 */
export const useFormErrorHandling = () => {
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const { handleValidationError } = useErrorNotification();

  const setFieldError = useCallback((field, error) => {
    setFieldErrors(prev => ({
      ...prev,
      [field]: error
    }));
  }, []);

  const clearFieldError = useCallback((field) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllFieldErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  const handleSubmitError = useCallback((error) => {
    setSubmitError(error);
    
    // Handle validation errors
    if (error?.response?.status === 400 && error?.response?.data?.errors) {
      const validationErrors = error.response.data.errors;
      
      // Set field-specific errors
      Object.entries(validationErrors).forEach(([field, message]) => {
        setFieldError(field, message);
      });
      
      // Show general validation notification
      handleValidationError(Object.values(validationErrors));
    } else {
      // Show general error notification
      handleValidationError(
        typeof error === 'string' ? error : error?.message || 'Submission failed'
      );
    }
  }, [setFieldError, handleValidationError]);

  const clearSubmitError = useCallback(() => {
    setSubmitError(null);
  }, []);

  const hasErrors = Object.keys(fieldErrors).length > 0 || submitError !== null;

  return {
    fieldErrors,
    submitError,
    hasErrors,
    setFieldError,
    clearFieldError,
    clearAllFieldErrors,
    handleSubmitError,
    clearSubmitError
  };
};

/**
 * Global Error Handler Hook
 * For handling unhandled promise rejections and global errors
 */
export const useGlobalErrorHandler = () => {
  const { handleApiError } = useErrorNotification();

  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Prevent the default browser error handling
      event.preventDefault();
      
      // Handle the error through our system
      handleApiError(event.reason, 'An unexpected error occurred');
    };

    const handleGlobalError = (event) => {
      console.error('Global error:', event.error);
      
      // Handle the error through our system
      handleApiError(event.error, 'A JavaScript error occurred');
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
    };
  }, [handleApiError]);
};

export default useErrorHandling;