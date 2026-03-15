import { useState, useEffect } from 'react';
import { apiClient } from '../services';

/**
 * Custom hook for managing loading states
 * Can track global API loading state or manage local loading state
 */
export function useLoading(trackGlobal = false) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (trackGlobal) {
      // Track global API loading state
      const unsubscribe = apiClient.onLoadingChange((loading) => {
        setIsLoading(loading);
      });

      // Set initial state
      setIsLoading(apiClient.isLoading());

      return unsubscribe;
    }
  }, [trackGlobal]);

  const startLoading = () => {
    setIsLoading(true);
    setError(null);
  };

  const stopLoading = () => {
    setIsLoading(false);
  };

  const setLoadingError = (error) => {
    setIsLoading(false);
    setError(error);
  };

  const clearError = () => {
    setError(null);
  };

  const executeAsync = async (asyncFunction) => {
    try {
      startLoading();
      const result = await asyncFunction();
      stopLoading();
      return result;
    } catch (error) {
      setLoadingError(error);
      throw error;
    }
  };

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    clearError,
    executeAsync
  };
}

export default useLoading;