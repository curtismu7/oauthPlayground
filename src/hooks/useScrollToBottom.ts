import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook that scrolls to bottom of page when route changes
 */
export const useScrollToBottom = () => {
  const location = useLocation();

  useEffect(() => {
    console.log('🔄 [useScrollToBottom] Route changed, scrolling to bottom:', location.pathname);
    
    // Function to scroll all containers to bottom
    const scrollAllToBottom = (useSmooth = true) => {
      const scrollOptions = useSmooth 
        ? { top: document.documentElement.scrollHeight, left: 0, behavior: 'smooth' as ScrollBehavior } 
        : { top: document.documentElement.scrollHeight, left: 0 };
      
      // Scroll window to bottom
      window.scrollTo(scrollOptions);
      
      // Scroll main content container to bottom
      const mainContent = document.querySelector('main');
      if (mainContent) {
        console.log('🔄 [useScrollToBottom] Scrolling main content to bottom');
        mainContent.scrollTo({
          top: mainContent.scrollHeight,
          left: 0,
          behavior: useSmooth ? 'smooth' : 'auto'
        });
      }
      
      // Scroll any other scrollable containers to bottom
      const scrollableContainers = document.querySelectorAll('[data-scrollable]');
      scrollableContainers.forEach(container => {
        if (container instanceof HTMLElement) {
          console.log('🔄 [useScrollToBottom] Scrolling container to bottom');
          container.scrollTo({
            top: container.scrollHeight,
            left: 0,
            behavior: useSmooth ? 'smooth' : 'auto'
          });
        }
      });
      
      // Also try to scroll any elements with overflow-y: auto or scroll to bottom
      const autoScrollContainers = document.querySelectorAll('*');
      autoScrollContainers.forEach(element => {
        if (element instanceof HTMLElement) {
          const style = window.getComputedStyle(element);
          if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
            console.log('🔄 [useScrollToBottom] Scrolling overflow container to bottom');
            element.scrollTo({
              top: element.scrollHeight,
              left: 0,
              behavior: useSmooth ? 'smooth' : 'auto'
            });
          }
        }
      });
    };
    
    // Scroll immediately (instant)
    scrollAllToBottom(false);
    
    // Also scroll with smooth behavior after a small delay
    const delayedScroll = setTimeout(() => {
      console.log('🔄 [useScrollToBottom] Delayed smooth scroll to bottom');
      scrollAllToBottom(true);
    }, 50);
    
    // And one more time after a longer delay to ensure it works (instant)
    const finalScroll = setTimeout(() => {
      console.log('🔄 [useScrollToBottom] Final instant scroll to bottom');
      scrollAllToBottom(false);
    }, 200);
    
    return () => {
      clearTimeout(delayedScroll);
      clearTimeout(finalScroll);
    };
  }, [location.pathname]);
};

export default useScrollToBottom;
