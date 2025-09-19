/* eslint-disable @typescript-eslint/no-unused-vars */
import { logger } from './logger';

// Service Worker Manager class
export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean = false;
  private isRegistered: boolean = false;

  constructor() {
    this.isSupported = 'serviceWorker' in navigator;
    this.initialize();
  }

  // Initialize service worker
  private async initialize(): Promise<void> {
    if (!this.isSupported) {
      logger.warn('[ServiceWorkerManager] Service workers not supported');
      return;
    }

    try {
      await this.register();
      this.setupEventListeners();
      logger.info('[ServiceWorkerManager] Service worker initialized');
    } catch (_error) {
      logger.error('[ServiceWorkerManager] Failed to initialize service worker:', _error);
    }
  }

  // Register service worker
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported) {
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      this.isRegistered = true;
      logger.info('[ServiceWorkerManager] Service worker registered successfully');
      
      return this.registration;
    } catch (_error) {
      logger.error('[ServiceWorkerManager] Service worker registration failed:', _error);
      throw error;
    }
  }

  // Unregister service worker
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {

      this.isRegistered = false;
      this.registration = null;
      
      logger.info('[ServiceWorkerManager] Service worker unregistered');
      return result;
    } catch (_error) {
      logger.error('[ServiceWorkerManager] Failed to unregister service worker:', _error);
      return false;
    }
  }

  // Setup event listeners
  private setupEventListeners(): void {
    if (!this.registration) return;

    // Handle service worker updates
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration!.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            logger.info('[ServiceWorkerManager] New service worker available');
            this.handleUpdateAvailable();
          }
        });
      }
    });

    // Handle service worker controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      logger.info('[ServiceWorkerManager] Service worker controller changed');
      window.location.reload();
    });
  }

  // Handle update available
  private handleUpdateAvailable(): void {
    // Notify the app that an update is available
    window.dispatchEvent(new CustomEvent('sw-update-available'));
  }

  // Update service worker
  async update(): Promise<void> {
    if (!this.registration) {
      throw new Error('No service worker registration found');
    }

    try {
      await this.registration.update();
      logger.info('[ServiceWorkerManager] Service worker update triggered');
    } catch (_error) {
      logger.error('[ServiceWorkerManager] Failed to update service worker:', _error);
      throw error;
    }
  }

  // Skip waiting and activate new service worker
  async skipWaiting(): Promise<void> {
    if (!this.registration || !this.registration.waiting) {
      throw new Error('No waiting service worker found');
    }

    try {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      logger.info('[ServiceWorkerManager] Skip waiting message sent');
    } catch (_error) {
      logger.error('[ServiceWorkerManager] Failed to skip waiting:', _error);
      throw error;
    }
  }

  // Get cache status
  async getCacheStatus(): Promise<{
    isSupported: boolean;
    isRegistered: boolean;
    isActive: boolean;
    cacheNames: string[];
  }> {
    const status = {
      isSupported: this.isSupported,
      isRegistered: this.isRegistered,
      isActive: !!navigator.serviceWorker.controller,
      cacheNames: []
    };

    if (this.isSupported && 'caches' in window) {
      try {
        const cacheNames = await caches.keys();
        status.cacheNames = cacheNames;
      } catch (_error) {
        logger.error('[ServiceWorkerManager] Failed to get cache names:', _error);
      }
    }

    return status;
  }

  // Clear all caches
  async clearAllCaches(): Promise<void> {
    if (!('caches' in window)) {
      throw new Error('Cache API not supported');
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      
      logger.info('[ServiceWorkerManager] All caches cleared');
    } catch (_error) {
      logger.error('[ServiceWorkerManager] Failed to clear caches:', _error);
      throw error;
    }
  }

  // Clear specific cache
  async clearCache(cacheName: string): Promise<boolean> {
    if (!('caches' in window)) {
      throw new Error('Cache API not supported');
    }

    try {

      logger.info(`[ServiceWorkerManager] Cache cleared: ${cacheName}`);
      return result;
    } catch (_error) {
      logger.error(`[ServiceWorkerManager] Failed to clear cache ${cacheName}:`, _error);
      return false;
    }
  }

  // Get cache size
  async getCacheSize(): Promise<{
    totalSize: number;
    cacheSizes: Record<string, number>;
  }> {
    if (!('caches' in window)) {
      return { totalSize: 0, cacheSizes: {} };
    }

    try {
      const cacheNames = await caches.keys();
      const cacheSizes: Record<string, number> = {};
      let totalSize = 0;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        let cacheSize = 0;

        for (const request of requests) {

          if (response) {
            const blob = await response.blob();
            cacheSize += blob.size;
          }
        }

        cacheSizes[cacheName] = cacheSize;
        totalSize += cacheSize;
      }

      return { totalSize, cacheSizes };
    } catch (_error) {
      logger.error('[ServiceWorkerManager] Failed to get cache size:', _error);
      return { totalSize: 0, cacheSizes: {} };
    }
  }

  // Preload resources
  async preloadResources(urls: string[]): Promise<void> {
    if (!('caches' in window)) {
      throw new Error('Cache API not supported');
    }

    try {
      const cache = await caches.open('oauth-playground-preload-v1');
      
      await Promise.all(
        urls.map(async (url) => {
          try {

            if (response.ok) {
              await cache.put(url, response);
              logger.info(`[ServiceWorkerManager] Preloaded resource: ${url}`);
            }
          } catch (_error) {
            logger.warn(`[ServiceWorkerManager] Failed to preload ${url}:`, _error);
          }
        })
      );
      
      logger.info(`[ServiceWorkerManager] Preloaded ${urls.length} resources`);
    } catch (_error) {
      logger.error('[ServiceWorkerManager] Failed to preload resources:', _error);
      throw error;
    }
  }

  // Check if resource is cached
  async isResourceCached(url: string): Promise<boolean> {
    if (!('caches' in window)) {
      return false;
    }

    try {
      const cacheNames = await caches.keys();
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);

        if (response) {
          return true;
        }
      }
      
      return false;
    } catch (_error) {
      logger.error('[ServiceWorkerManager] Failed to check if resource is cached:', _error);
      return false;
    }
  }

  // Get registration
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  // Check if service worker is supported
  isServiceWorkerSupported(): boolean {
    return this.isSupported;
  }

  // Check if service worker is registered
  isServiceWorkerRegistered(): boolean {
    return this.isRegistered;
  }

  // Check if service worker is active
  isServiceWorkerActive(): boolean {
    return !!navigator.serviceWorker.controller;
  }

  // Get service worker state
  getServiceWorkerState(): string | null {
    if (!this.registration) return null;
    
    if (this.registration.installing) return 'installing';
    if (this.registration.waiting) return 'waiting';
    if (this.registration.active) return 'active';
    
    return null;
  }
}

// Create global service worker manager instance
export const serviceWorkerManager = new ServiceWorkerManager();

// Utility functions
export const registerServiceWorker = (): Promise<ServiceWorkerRegistration | null> => {
  return serviceWorkerManager.register();
};

export const unregisterServiceWorker = (): Promise<boolean> => {
  return serviceWorkerManager.unregister();
};

export const updateServiceWorker = (): Promise<void> => {
  return serviceWorkerManager.update();
};

export const skipWaiting = (): Promise<void> => {
  return serviceWorkerManager.skipWaiting();
};

export const getCacheStatus = () => {
  return serviceWorkerManager.getCacheStatus();
};

export const clearAllCaches = (): Promise<void> => {
  return serviceWorkerManager.clearAllCaches();
};

export const clearCache = (cacheName: string): Promise<boolean> => {
  return serviceWorkerManager.clearCache(cacheName);
};

export const getCacheSize = () => {
  return serviceWorkerManager.getCacheSize();
};

export const preloadResources = (urls: string[]): Promise<void> => {
  return serviceWorkerManager.preloadResources(urls);
};

export const isResourceCached = (url: string): Promise<boolean> => {
  return serviceWorkerManager.isResourceCached(url);
};

export const isServiceWorkerSupported = (): boolean => {
  return serviceWorkerManager.isServiceWorkerSupported();
};

export const isServiceWorkerRegistered = (): boolean => {
  return serviceWorkerManager.isServiceWorkerRegistered();
};

export const isServiceWorkerActive = (): boolean => {
  return serviceWorkerManager.isServiceWorkerActive();
};

export const getServiceWorkerState = (): string | null => {
  return serviceWorkerManager.getServiceWorkerState();
};

export default serviceWorkerManager;
