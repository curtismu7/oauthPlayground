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
 * Get the real scroll container for this app.
 *
 * The root layout in App.tsx uses a ContentColumn div with:
 *   height: 100vh; overflow-y: auto;
 * That element — not `window` — is what actually scrolls. Previous approaches
 * targeting window.scrollTo / document.documentElement.scrollTop were no-ops
 * because the window itself never overflows in this layout.
 *
 * The element is identified by the `data-content-column` attribute set
 * directly on <ContentColumn data-content-column> in App.tsx.
 */
const getScrollContainer = (): HTMLElement | null =>
	document.querySelector<HTMLElement>('[data-content-column]');

/**
 * Core scroll-to-top routine — always targets the real scroll container.
 * Falls back to window only if the container is not mounted yet (e.g. tests).
 */
const applyScrollToTop = (smooth: boolean) => {
	const container = getScrollContainer();
	if (container) {
		container.scrollTop = 0;
		container.scrollLeft = 0;
	} else {
		// Fallback: container not in DOM (unit tests / SSR)
		window.scrollTo({ top: 0, left: 0, behavior: smooth ? 'smooth' : 'instant' });
		document.documentElement.scrollTop = 0;
		document.body.scrollTop = 0;
	}
};

/**
 * Scroll to top of page with options.
 *
 * force: true adds retry attempts at 50 / 100 / 200 ms so late-rendering
 * content does not push the page back down after the initial scroll.
 */
export const scrollToTop = (options: ScrollOptions = {}) => {
	const { smooth = false, delay = 0, force = false } = options;

	const performScroll = () => {
		applyScrollToTop(smooth);

		if (force) {
			// Retry to handle late-mounting content (async data loads that
			// extend page height after the first scroll fires).
			setTimeout(() => applyScrollToTop(smooth), 50);
			setTimeout(() => applyScrollToTop(smooth), 100);
			setTimeout(() => applyScrollToTop(smooth), 200);
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
		const container = getScrollContainer();
		if (container) {
			container.scrollTop = container.scrollHeight;
		} else {
			window.scrollTo({
				top: document.documentElement.scrollHeight,
				left: 0,
				behavior: smooth ? 'smooth' : 'instant',
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
 * Scroll to a specific element
 */
export const scrollToElement = (elementId: string, options: ScrollOptions = {}) => {
	const { smooth = true, delay = 0 } = options;

	const performScroll = () => {
		const element = document.getElementById(elementId);
		if (element) {
			element.scrollIntoView({
				behavior: smooth ? 'smooth' : 'instant',
				block: 'start',
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
