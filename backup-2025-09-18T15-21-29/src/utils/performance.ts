/* eslint-disable @typescript-eslint/no-unused-vars */
// src/utils/performance.ts - Performance optimization utilities

import React, { useCallback} from 'react';

/**
 * Debounce hook for performance optimization
 */
export const useDebounce = <T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
};

/**
 * Throttle hook for performance optimization
 */
export const useThrottle = <T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef<number>(0);

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = now;
    }
  }, [callback, delay]) as T;
};

/**
 * Memoized computation hook with dependency tracking
 */
export const useMemoizedComputation = <T>(
  computation: () => T,
  dependencies: React.DependencyList,
  debugLabel?: string
): T => {
  return useMemo(() => {
    const start = performance.now();

    const end = performance.now();
    
    if (debugLabel) {
      console.log(`⚡ [Performance] ${debugLabel} computed in ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  }, dependencies);
};

/**
 * Performance monitoring hook
 */
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const mountTime = useRef<number>(0);

  useEffect(() => {
    mountTime.current = performance.now();
    
    return () => {
      const unmountTime = performance.now();
      console.log(`📊 [Performance] ${componentName} lifecycle: ${(unmountTime - mountTime.current).toFixed(2)}ms`);
    };
  }, [componentName]);

  useEffect(() => {
    renderCount.current++;
    console.log(`🔄 [Performance] ${componentName} render #${renderCount.current}`);
  });

  return {
    renderCount: renderCount.current,
    getLifecycleTime: () => performance.now() - mountTime.current
  };
};

/**
 * Lazy state initialization for expensive computations
 */
export const useLazyState = <T>(
  initializer: () => T,
  debugLabel?: string
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = React.useState<T>(() => {
    const start = performance.now();

    const end = performance.now();
    
    if (debugLabel) {
      console.log(`⚡ [Performance] ${debugLabel} lazy state initialized in ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  });

  return [state, setState];
};

/**
 * Optimized event handler that prevents unnecessary re-renders
 */
export const useOptimizedCallback = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  dependencies: React.DependencyList
): T => {
  const callbackRef = useRef<T>(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, dependencies) as T;
};

/**
 * Memory usage monitoring
 */
export const useMemoryMonitor = (componentName: string) => {
  useEffect(() => {
    if ('memory' in performance) {
      const memory = (performance as unknown).memory;
      console.log(`🧠 [Memory] ${componentName} - Used: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
    }
  });
};

/**
 * Bundle size optimization utilities
 */
export const lazyImport = <T extends React.ComponentType<unknown>>(
  importFunction: () => Promise<{ default: T }>,
  componentName?: string
) => {
  return React.lazy(async () => {
    const start = performance.now();
    const module = await importFunction();
    const end = performance.now();
    
    if (componentName) {
      console.log(`📦 [Performance] ${componentName} loaded in ${(end - start).toFixed(2)}ms`);
    }
    
    return module;
  });
};

/**
 * Network request optimization
 */
export const useOptimizedFetch = () => {
  const abortControllerRef = useRef<AbortController | null>(null);

  const optimizedFetch = useCallback(async (
    url: string,
    options: RequestInit = {},
    timeout: number = 30000
  ): Promise<Response> => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Add timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      const start = performance.now();

      const end = performance.now();

      console.log(`🌐 [Performance] Request to ${url} completed in ${(end - start).toFixed(2)}ms`);
      clearTimeout(timeoutId);
      
      return response;
    } catch (_error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return optimizedFetch;
};

export default {
  useDebounce,
  useThrottle,
  useMemoizedComputation,
  usePerformanceMonitor,
  useLazyState,
  useOptimizedCallback,
  useMemoryMonitor,
  lazyImport,
  useOptimizedFetch
};
