import { useState, useEffect, useCallback } from 'react';
import { 
  serviceWorkerManager,
  getCacheStatus,
  getCacheSize,
  clearAllCaches,
  preloadResources,
  isResourceCached
} from '../utils/serviceWorkerManager';
import { logger } from '../utils/logger';

// Service worker state interface
export interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isActive: boolean;
  state: string | null;
  cacheNames: string[];
  cacheSize: {
    totalSize: number;
    cacheSizes: Record<string, number>;
  };
  updateAvailable: boolean;
}

// Service worker hook configuration
export interface UseServiceWorkerConfig {
  autoRegister?: boolean;
  autoUpdate?: boolean;
  preloadUrls?: string[];
  onUpdateAvailable?: () => void;
  onUpdateInstalled?: () => void;
}

// useServiceWorker hook
export const useServiceWorker = (config: UseServiceWorkerConfig = {}) => {
  const {
    autoRegister = true,
    autoUpdate = false,
    preloadUrls = [],
    onUpdateAvailable,
    onUpdateInstalled
  } = config;

  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isActive: false,
    state: null,
    cacheNames: [],
    cacheSize: {
      totalSize: 0,
      cacheSizes: {}
    },
    updateAvailable: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Update service worker state
  const updateState = useCallback(async () => {
    try {
      const cacheStatus = await getCacheStatus();
      const cacheSize = await getCacheSize();
      const serviceWorkerState = serviceWorkerManager.getServiceWorkerState();

      setState(prev => ({
        ...prev,
        isSupported: cacheStatus.isSupported,
        isRegistered: cacheStatus.isRegistered,
        isActive: cacheStatus.isActive,
        state: serviceWorkerState,
        cacheNames: cacheStatus.cacheNames,
        cacheSize
      }));
    } catch (err) {
      setError(err as Error);
      logger.error('[useServiceWorker] Failed to update state:', err);
    }
  }, []);

  // Register service worker
  const register = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await serviceWorkerManager.register();
      await updateState();
      logger.info('[useServiceWorker] Service worker registered');
    } catch (err) {
      setError(err as Error);
      logger.error('[useServiceWorker] Failed to register service worker:', err);
    } finally {
      setIsLoading(false);
    }
  }, [updateState]);

  // Unregister service worker
  const unregister = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await serviceWorkerManager.unregister();
      await updateState();
      logger.info('[useServiceWorker] Service worker unregistered');
    } catch (err) {
      setError(err as Error);
      logger.error('[useServiceWorker] Failed to unregister service worker:', err);
    } finally {
      setIsLoading(false);
    }
  }, [updateState]);

  // Update service worker
  const update = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await serviceWorkerManager.update();
      await updateState();
      logger.info('[useServiceWorker] Service worker updated');
    } catch (err) {
      setError(err as Error);
      logger.error('[useServiceWorker] Failed to update service worker:', err);
    } finally {
      setIsLoading(false);
    }
  }, [updateState]);

  // Skip waiting and activate new service worker
  const skipWaiting = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await serviceWorkerManager.skipWaiting();
      setState(prev => ({ ...prev, updateAvailable: false }));
      logger.info('[useServiceWorker] Service worker skip waiting');
    } catch (err) {
      setError(err as Error);
      logger.error('[useServiceWorker] Failed to skip waiting:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear all caches
  const clearCaches = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await clearAllCaches();
      await updateState();
      logger.info('[useServiceWorker] All caches cleared');
    } catch (err) {
      setError(err as Error);
      logger.error('[useServiceWorker] Failed to clear caches:', err);
    } finally {
      setIsLoading(false);
    }
  }, [updateState]);

  // Preload resources
  const preload = useCallback(async (urls: string[]) => {
    setIsLoading(true);
    setError(null);

    try {
      await preloadResources(urls);
      await updateState();
      logger.info('[useServiceWorker] Resources preloaded');
    } catch (err) {
      setError(err as Error);
      logger.error('[useServiceWorker] Failed to preload resources:', err);
    } finally {
      setIsLoading(false);
    }
  }, [updateState]);

  // Check if resource is cached
  const checkResourceCached = useCallback(async (url: string): Promise<boolean> => {
    try {
      return await isResourceCached(url);
    } catch (err) {
      logger.error('[useServiceWorker] Failed to check if resource is cached:', err);
      return false;
    }
  }, []);

  // Handle update available
  const handleUpdateAvailable = useCallback(() => {
    setState(prev => ({ ...prev, updateAvailable: true }));
    onUpdateAvailable?.();
    logger.info('[useServiceWorker] Update available');
  }, [onUpdateAvailable]);

  // Handle update installed
  const handleUpdateInstalled = useCallback(() => {
    setState(prev => ({ ...prev, updateAvailable: false }));
    onUpdateInstalled?.();
    logger.info('[useServiceWorker] Update installed');
  }, [onUpdateInstalled]);

  // Initialize service worker
  useEffect(() => {
    const initialize = async () => {
      if (autoRegister && state.isSupported && !state.isRegistered) {
        await register();
      }

      if (preloadUrls.length > 0) {
        await preload(preloadUrls);
      }
    };

    initialize();
  }, [autoRegister, state.isSupported, state.isRegistered, register, preloadUrls, preload]);

  // Setup event listeners
  useEffect(() => {
    const handleUpdateAvailableEvent = () => {
      handleUpdateAvailable();
    };

    const handleUpdateInstalledEvent = () => {
      handleUpdateInstalled();
    };

    window.addEventListener('sw-update-available', handleUpdateAvailableEvent);
    window.addEventListener('sw-update-installed', handleUpdateInstalledEvent);

    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailableEvent);
      window.removeEventListener('sw-update-installed', handleUpdateInstalledEvent);
    };
  }, [handleUpdateAvailable, handleUpdateInstalled]);

  // Auto-update if enabled
  useEffect(() => {
    if (autoUpdate && state.updateAvailable) {
      skipWaiting();
    }
  }, [autoUpdate, state.updateAvailable, skipWaiting]);

  // Periodic state updates
  useEffect(() => {
    const interval = setInterval(updateState, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [updateState]);

  return {
    // State
    ...state,
    isLoading,
    error,
    
    // Actions
    register,
    unregister,
    update,
    skipWaiting,
    clearCaches,
    preload,
    checkResourceCached,
    updateState,
    
    // Utilities
    formatCacheSize: (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    getCacheSizeFormatted: () => {
      return state.cacheSize.totalSize > 0 
        ? `${(state.cacheSize.totalSize / 1024 / 1024).toFixed(2)} MB`
        : '0 MB';
    }
  };
};

// Hook for service worker notifications
export const useServiceWorkerNotifications = () => {
  const [notifications, setNotifications] = useState<{
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    timestamp: number;
  }[]>([]);

  const addNotification = useCallback((type: 'info' | 'success' | 'warning' | 'error', message: string) => {
    const notification = {
      type,
      message,
      timestamp: Date.now()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.timestamp !== notification.timestamp));
    }, 5000);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    clearNotifications
  };
};

export default useServiceWorker;
