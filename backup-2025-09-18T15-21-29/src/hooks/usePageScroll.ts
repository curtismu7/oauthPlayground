 
// src/hooks/usePageScroll.ts
import { useEffect} from 'react';
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
    console.log(`📜 [PageScroll] UNIVERSAL scroll to top for: ${pageName || 'Unknown Page'}`);
    
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
    console.log(`📜 [PageScroll] Action scroll to top for: ${pageName || 'Unknown Page'}`);
    scrollToTop({ force: true, smooth: false });
  }, [pageName]);

  const scrollToBottomAfterAction = useCallback(() => {
    console.log(`📜 [PageScroll] Action scroll to bottom for: ${pageName || 'Unknown Page'}`);
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
    console.log(`🔐 [AuthFlowScroll] Starting at top for: ${flowName}`);
    scrollToTop({ force: true, delay: 100 });
  }, [flowName]);

  const scrollToTopAfterAction = useCallback(() => {
    console.log(`🔐 [AuthFlowScroll] Action completed, returning to top for: ${flowName}`);
    scrollToTop({ force: true, delay: 50 });
  }, [flowName]);

  const scrollToBottomAfterAction = useCallback(() => {
    console.log(`🔐 [AuthFlowScroll] Action completed, scrolling to bottom for: ${flowName}`);
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
    console.log(`🎫 [TokenPageScroll] Starting at top for: ${pageName}`);
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
    console.log(`🎫 [TokenPageScroll] Action scroll to top for: ${pageName}`);
    scrollToTop({ force: true });
  }, [pageName]);

  return {
    scrollToTopAfterAction
  };
};