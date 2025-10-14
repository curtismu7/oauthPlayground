import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook that scrolls to top of page when route changes
 */
export const useScrollToTop = () => {
	const location = useLocation();

	useEffect(() => {
		console.log(' [useScrollToTop] Route changed, scrolling to top:', location.pathname);

		// Function to scroll all containers to top
		const scrollAllToTop = (useSmooth = true) => {
			const scrollOptions = useSmooth
				? { top: 0, left: 0, behavior: 'smooth' as ScrollBehavior }
				: { top: 0, left: 0 };

			// Scroll window to top
			window.scrollTo(scrollOptions);

			// Scroll main content container (this is likely the main scrollable area)
			const mainContent = document.querySelector('main');
			if (mainContent) {
				console.log(' [useScrollToTop] Scrolling main content to top');
				mainContent.scrollTo(scrollOptions);
			}

			// Scroll any other scrollable containers
			const scrollableContainers = document.querySelectorAll('[data-scrollable]');
			scrollableContainers.forEach((container) => {
				if (container instanceof HTMLElement) {
					console.log(' [useScrollToTop] Scrolling container to top');
					container.scrollTo(scrollOptions);
				}
			});

			// Also try to scroll any elements with overflow-y: auto or scroll
			const autoScrollContainers = document.querySelectorAll('*');
			autoScrollContainers.forEach((element) => {
				if (element instanceof HTMLElement) {
					const style = window.getComputedStyle(element);
					if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
						console.log(' [useScrollToTop] Scrolling overflow container to top');
						element.scrollTo(scrollOptions);
					}
				}
			});
		};

		// Scroll immediately (instant)
		scrollAllToTop(false);

		// Also scroll with smooth behavior after a small delay
		const delayedScroll = setTimeout(() => {
			console.log(' [useScrollToTop] Delayed smooth scroll to top');
			scrollAllToTop(true);
		}, 50);

		// And one more time after a longer delay to ensure it works (instant)
		const finalScroll = setTimeout(() => {
			console.log(' [useScrollToTop] Final instant scroll to top');
			scrollAllToTop(false);
		}, 200);

		return () => {
			clearTimeout(delayedScroll);
			clearTimeout(finalScroll);
		};
	}, [location.pathname]);
};

export default useScrollToTop;
