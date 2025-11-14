// src/hooks/usePageScroll.ts
import { useCallback, useEffect } from 'react';
import { scrollToBottom, scrollToTop } from '../utils/scrollManager';

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
	}, [force, delay]);

	const scrollToTopAfterAction = useCallback(() => {
		scrollToTop({ force: true, smooth: false });
	}, []);

	const scrollToBottomAfterAction = useCallback(() => {
		scrollToBottom({ smooth: true });
	}, []);

	return {
		scrollToTopAfterAction,
		scrollToBottomAfterAction,
	};
};

/**
 * Hook specifically for Authorization flow pages
 * Always returns to top after any action
 */
export const useAuthorizationFlowScroll = (_flowName: string) => {
	useEffect(() => {
		scrollToTop({ force: true, delay: 100 });
	}, []);

	const scrollToTopAfterAction = useCallback(() => {
		scrollToTop({ force: true, delay: 50 });
	}, []);

	const scrollToBottomAfterAction = useCallback(() => {
		scrollToBottom({ delay: 50 });
	}, []);

	return {
		scrollToTopAfterAction,
		scrollToBottomAfterAction,
	};
};

/**
 * Hook for Token Management and similar pages
 * Always starts at top, provides action callbacks
 */
export const useTokenPageScroll = (_pageName: string) => {
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
	}, []);

	const scrollToTopAfterAction = useCallback(() => {
		scrollToTop({ force: true });
	}, []);

	return {
		scrollToTopAfterAction,
	};
};
