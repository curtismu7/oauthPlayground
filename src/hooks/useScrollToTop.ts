import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook that scrolls to top of page when route changes
 */
export const useScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    // Scroll to top immediately when pathname changes
    window.scrollTo(0, 0);
    
    // Also scroll any main content containers
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.scrollTo(0, 0);
    }
    
    // Scroll any other scrollable containers
    const scrollableContainers = document.querySelectorAll('[data-scrollable]');
    scrollableContainers.forEach(container => {
      if (container instanceof HTMLElement) {
        container.scrollTo(0, 0);
      }
    });
    
    // Also scroll to top after a small delay to handle any async rendering
    const delayedScroll = setTimeout(() => {
      window.scrollTo(0, 0);
      if (mainContent) {
        mainContent.scrollTo(0, 0);
      }
    }, 100);
    
    return () => clearTimeout(delayedScroll);
  }, [location.pathname]);
};

export default useScrollToTop;
