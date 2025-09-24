// src/utils/scrollManager.ts
import { useEffect } from 'react';

/**
 * Scroll management utilities for consistent behavior across the application
 */

export interface ScrollOptions {
  smooth?: boolean;
  delay?: number;
  force?: boolean;
}

/**
 * Scroll to top of page with options
 * Enhanced with multiple scroll attempts for stubborn cases
 */
export const scrollToTop = (options: ScrollOptions = {}) => {
  const { smooth = true, delay = 0, force = false } = options;
  
  const performScroll = () => {
    
    // Primary scroll method
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: smooth ? 'smooth' : 'instant'
    });
    
    if (force) {
      // Aggressive multi-method scroll for stubborn cases
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // Additional attempts with timeouts to catch late-loading content
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 50);
      
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 100);
      
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 200);
    }
  };

  if (delay > 0) {
    setTimeout(performScroll, delay);
  } else {
    performScroll();
  }
};

/**
 * Scroll to bottom of page with options
 */
export const scrollToBottom = (options: ScrollOptions = {}) => {
  const { smooth = true, delay = 0 } = options;
  
  const performScroll = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      left: 0,
      behavior: smooth ? 'smooth' : 'instant'
    });
  };

  if (delay > 0) {
    setTimeout(performScroll, delay);
  } else {
    performScroll();
  }
};

/**
 * Scroll to a specific element
 */
export const scrollToElement = (elementId: string, options: ScrollOptions = {}) => {
  const { smooth = true, delay = 0 } = options;
  
  const performScroll = () => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({
        behavior: smooth ? 'smooth' : 'instant',
        block: 'start'
      });
    }
  };

  if (delay > 0) {
    setTimeout(performScroll, delay);
  } else {
    performScroll();
  }
};

/**
 * Hook for pages that should always start at the top
 */
export const useScrollToTop = (force = false) => {
  useEffect(() => {
    scrollToTop({ force });
  }, [force]);
};

/**
 * Hook for pages that should scroll to bottom after actions
 */
export const useScrollToBottom = () => {
  useEffect(() => {
    scrollToBottom();
  }, []);
};