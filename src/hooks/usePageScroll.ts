// src/hooks/usePageScroll.ts
import { useEffect, useCallback } from 'react';
import { scrollToTop, scrollToBottom } from '../utils/scrollManager';

/**
 * Page scroll management hooks for consistent behavior
 */

export interface PageScrollOptions {
  pageName?: string;
  force?: boolean;
  delay?: number;
}

/**
 * Hook for general pages that should start at the top
 * UNIVERSAL: Use this on ALL pages for consistent behavior
 */
export const usePageScroll = (options: PageScrollOptions = {}) => {
  const { pageName, force = true, delay = 0 } = options; // Default force = true
  
  useEffect(() => {
    
    // Immediate scroll
    scrollToTop({ force, delay: 0, smooth: false });
    
    // Additional scroll after delay to catch late-loading content
    if (delay > 0) {
      setTimeout(() => {
        scrollToTop({ force, delay: 0, smooth: false });
      }, delay);
    }
    
    // One more scroll after 100ms to ensure it works
    setTimeout(() => {
      scrollToTop({ force, delay: 0, smooth: false });
    }, 100);
    
  }, [pageName, force, delay]);

  const scrollToTopAfterAction = useCallback(() => {
    scrollToTop({ force: true, smooth: false });
  }, [pageName]);

  const scrollToBottomAfterAction = useCallback(() => {
    scrollToBottom({ smooth: true });
  }, [pageName]);

  return {
    scrollToTopAfterAction,
    scrollToBottomAfterAction
  };
};

/**
 * Hook specifically for Authorization flow pages
 * Always returns to top after any action
 */
export const useAuthorizationFlowScroll = (flowName: string) => {
  useEffect(() => {
    scrollToTop({ force: true, delay: 100 });
  }, [flowName]);

  const scrollToTopAfterAction = useCallback(() => {
    scrollToTop({ force: true, delay: 50 });
  }, [flowName]);

  const scrollToBottomAfterAction = useCallback(() => {
    scrollToBottom({ delay: 50 });
  }, [flowName]);

  return {
    scrollToTopAfterAction,
    scrollToBottomAfterAction
  };
};

/**
 * Hook for Token Management and similar pages
 * Always starts at top, provides action callbacks
 */
export const useTokenPageScroll = (pageName: string) => {
  useEffect(() => {
    // More aggressive scroll for token pages
    setTimeout(() => {
      scrollToTop({ force: true });
    }, 0);
    setTimeout(() => {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 50);
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  }, [pageName]);

  const scrollToTopAfterAction = useCallback(() => {
    scrollToTop({ force: true });
  }, [pageName]);

  return {
    scrollToTopAfterAction
  };
};