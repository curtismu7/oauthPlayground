/**
 * @file useApiDisplayPadding.ts
 * @module v8/hooks
 * @description Hook to get API display height and visibility for adding bottom padding to pages
 * @version 8.0.0
 */

import { useEffect, useState } from 'react';
import { apiDisplayServiceV8 } from '@/v8/services/apiDisplayServiceV8';

const MODULE_TAG = '[📏 API-DISPLAY-PADDING-HOOK]';

/**
 * Hook to get API display visibility and height for page padding
 * @returns Object with isVisible, height, and paddingBottom values
 */
export function useApiDisplayPadding() {
	const [isVisible, setIsVisible] = useState(apiDisplayServiceV8.isVisible());
	const [height, setHeight] = useState(0);

	useEffect(() => {
		const checkVisibility = () => {
			const visible = apiDisplayServiceV8.isVisible();
			setIsVisible(visible);
			
			// Get actual height from DOM element using getBoundingClientRect for accurate measurement
			if (visible) {
				const apiDisplay = document.querySelector('.super-simple-api-display') as HTMLElement;
				if (apiDisplay) {
					// Use getBoundingClientRect to get actual rendered height including borders
					const rect = apiDisplay.getBoundingClientRect();
					const actualHeight = rect.height > 0 ? rect.height : apiDisplay.offsetHeight;
					setHeight(actualHeight);
				} else {
					// Fallback: use default height if element not found
					setHeight(400);
				}
			} else {
				setHeight(0);
			}
		};

		// Check initial state
		checkVisibility();

		// Subscribe to visibility changes
		const unsubscribe = apiDisplayServiceV8.subscribe(() => {
			// Small delay to allow DOM to update
			setTimeout(checkVisibility, 100);
		});

		// Use ResizeObserver to track height changes more accurately
		let resizeObserver: ResizeObserver | null = null;
		if (isVisible) {
			const apiDisplay = document.querySelector('.super-simple-api-display') as HTMLElement;
			if (apiDisplay) {
				resizeObserver = new ResizeObserver(() => {
					checkVisibility();
				});
				resizeObserver.observe(apiDisplay);
			}
		}

		// Also check height periodically when visible (in case ResizeObserver doesn't catch all changes)
		const interval = isVisible ? setInterval(checkVisibility, 200) : null;

		return () => {
			unsubscribe();
			if (resizeObserver) resizeObserver.disconnect();
			if (interval) clearInterval(interval);
		};
	}, [isVisible]);

	// Calculate padding bottom (height + 40px buffer to ensure buttons are visible)
	const paddingBottom = isVisible && height > 0 ? `${height + 40}px` : '0';

	return {
		isVisible,
		height,
		paddingBottom,
	};
}

