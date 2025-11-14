import { logger } from './logger';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

// Accessibility configuration interface
export interface AccessibilityConfig {
	enableARIA: boolean;
	enableKeyboardNavigation: boolean;
	enableScreenReader: boolean;
	enableFocusManagement: boolean;
	enableColorContrast: boolean;
	enableReducedMotion: boolean;
	enableHighContrast: boolean;
	announcePageChanges: boolean;
	announceErrors: boolean;
	announceSuccess: boolean;
}

// Default accessibility configuration
const defaultConfig: AccessibilityConfig = {
	enableARIA: true,
	enableKeyboardNavigation: true,
	enableScreenReader: true,
	enableFocusManagement: true,
	enableColorContrast: true,
	enableReducedMotion: true,
	enableHighContrast: false,
	announcePageChanges: true,
	announceErrors: true,
	announceSuccess: true,
};

// ARIA roles and properties
export const ARIA_ROLES = {
	BUTTON: 'button',
	LINK: 'link',
	MENU: 'menu',
	MENUITEM: 'menuitem',
	DIALOG: 'dialog',
	ALERT: 'alert',
	ALERTDIALOG: 'alertdialog',
	BANNER: 'banner',
	COMPLEMENTARY: 'complementary',
	CONTENTINFO: 'contentinfo',
	FORM: 'form',
	MAIN: 'main',
	NAVIGATION: 'navigation',
	REGION: 'region',
	SEARCH: 'search',
	TAB: 'tab',
	TABLIST: 'tablist',
	TABPANEL: 'tabpanel',
	TOOLBAR: 'toolbar',
	TREE: 'tree',
	TREEITEM: 'treeitem',
} as const;

export const ARIA_PROPERTIES = {
	LABELLEDBY: 'aria-labelledby',
	DESCRIBEDBY: 'aria-describedby',
	EXPANDED: 'aria-expanded',
	SELECTED: 'aria-selected',
	CHECKED: 'aria-checked',
	DISABLED: 'aria-disabled',
	HIDDEN: 'aria-hidden',
	REQUIRED: 'aria-required',
	INVALID: 'aria-invalid',
	LIVE: 'aria-live',
	ATOMIC: 'aria-atomic',
	RELEVANT: 'aria-relevant',
	BUSY: 'aria-busy',
	PRESSED: 'aria-pressed',
	CURRENT: 'aria-current',
	LEVEL: 'aria-level',
	POSINSET: 'aria-posinset',
	SETSIZE: 'aria-setsize',
	ORIENTATION: 'aria-orientation',
	SORT: 'aria-sort',
	VALUENOW: 'aria-valuenow',
	VALUEMIN: 'aria-valuemin',
	VALUEMAX: 'aria-valuemax',
	VALUETEXT: 'aria-valuetext',
} as const;

// Keyboard navigation keys
export const KEYBOARD_KEYS = {
	ENTER: 'Enter',
	SPACE: ' ',
	ESCAPE: 'Escape',
	TAB: 'Tab',
	ARROW_UP: 'ArrowUp',
	ARROW_DOWN: 'ArrowDown',
	ARROW_LEFT: 'ArrowLeft',
	ARROW_RIGHT: 'ArrowRight',
	HOME: 'Home',
	END: 'End',
	PAGE_UP: 'PageUp',
	PAGE_DOWN: 'PageDown',
} as const;

// Focus management class
export class FocusManager {
	private focusHistory: HTMLElement[] = [];
	private currentFocusIndex = -1;
	private trapElements: HTMLElement[] = [];

	// Set focus to element
	focus(element: HTMLElement): void {
		if (element && typeof element.focus === 'function') {
			element.focus();
			this.addToHistory(element);
			logger.info('[FocusManager] Focus set to element:', element);
		}
	}

	// Add element to focus history
	private addToHistory(element: HTMLElement): void {
		const index = this.focusHistory.indexOf(element);
		if (index > -1) {
			this.focusHistory.splice(index, 1);
		}
		this.focusHistory.push(element);
		this.currentFocusIndex = this.focusHistory.length - 1;
	}

	// Get next focusable element
	getNextFocusable(currentElement?: HTMLElement): HTMLElement | null {
		const focusableElements = this.getFocusableElements();
		if (focusableElements.length === 0) return null;

		if (!currentElement) {
			return focusableElements[0];
		}

		const currentIndex = focusableElements.indexOf(currentElement);
		if (currentIndex === -1) return focusableElements[0];

		return focusableElements[(currentIndex + 1) % focusableElements.length];
	}

	// Get previous focusable element
	getPreviousFocusable(currentElement?: HTMLElement): HTMLElement | null {
		const focusableElements = this.getFocusableElements();
		if (focusableElements.length === 0) return null;

		if (!currentElement) {
			return focusableElements[focusableElements.length - 1];
		}

		const currentIndex = focusableElements.indexOf(currentElement);
		if (currentIndex === -1) return focusableElements[focusableElements.length - 1];

		return focusableElements[currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1];
	}

	// Get all focusable elements
	getFocusableElements(): HTMLElement[] {
		const focusableSelectors = [
			'button:not([disabled])',
			'input:not([disabled])',
			'select:not([disabled])',
			'textarea:not([disabled])',
			'a[href]',
			'[tabindex]:not([tabindex="-1"])',
			'[contenteditable="true"]',
		].join(', ');

		const elements = document.querySelectorAll(focusableSelectors);
		return Array.from(elements) as HTMLElement[];
	}

	// Trap focus within element
	trapFocus(container: HTMLElement): void {
		this.trapElements.push(container);

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === KEYBOARD_KEYS.TAB) {
				const focusableElements = this.getFocusableElements().filter((el) =>
					container.contains(el)
				);

				if (focusableElements.length === 0) return;

				const firstElement = focusableElements[0];
				const lastElement = focusableElements[focusableElements.length - 1];

				if (event.shiftKey) {
					// Shift + Tab
					if (document.activeElement === firstElement) {
						event.preventDefault();
						lastElement.focus();
					}
				} else {
					// Tab
					if (document.activeElement === lastElement) {
						event.preventDefault();
						firstElement.focus();
					}
				}
			}
		};

		container.addEventListener('keydown', handleKeyDown);

		// Store cleanup function
		(container as any).__focusTrapCleanup = () => {
			container.removeEventListener('keydown', handleKeyDown);
			const index = this.trapElements.indexOf(container);
			if (index > -1) {
				this.trapElements.splice(index, 1);
			}
		};
	}

	// Release focus trap
	releaseFocusTrap(container: HTMLElement): void {
		const cleanup = (container as any).__focusTrapCleanup;
		if (cleanup) {
			cleanup();
		}
	}

	// Clear focus history
	clearHistory(): void {
		this.focusHistory = [];
		this.currentFocusIndex = -1;
	}
}

// Screen reader announcements
export class ScreenReaderAnnouncer {
	private announcerElement: HTMLElement | null = null;

	constructor() {
		this.createAnnouncer();
	}

	private createAnnouncer(): void {
		this.announcerElement = document.createElement('div');
		this.announcerElement.setAttribute('aria-live', 'polite');
		this.announcerElement.setAttribute('aria-atomic', 'true');
		this.announcerElement.style.position = 'absolute';
		this.announcerElement.style.left = '-10000px';
		this.announcerElement.style.width = '1px';
		this.announcerElement.style.height = '1px';
		this.announcerElement.style.overflow = 'hidden';
		document.body.appendChild(this.announcerElement);
	}

	// Announce message to screen readers
	announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
		if (!this.announcerElement) return;

		this.announcerElement.setAttribute('aria-live', priority);
		this.announcerElement.textContent = message;

		// Clear after announcement
		setTimeout(() => {
			if (this.announcerElement) {
				this.announcerElement.textContent = '';
			}
		}, 1000);

		logger.info(`[ScreenReaderAnnouncer] Announced: ${message}`);
	}

	// Announce page change
	announcePageChange(pageTitle: string): void {
		this.announce(`Navigated to ${pageTitle}`, 'polite');
	}

	// Announce error
	announceError(errorMessage: string): void {
		this.announce(`Error: ${errorMessage}`, 'assertive');
	}

	// Announce success
	announceSuccess(successMessage: string): void {
		this.announce(`Success: ${successMessage}`, 'polite');
	}

	// Destroy announcer
	destroy(): void {
		if (this.announcerElement && this.announcerElement.parentNode) {
			this.announcerElement.parentNode.removeChild(this.announcerElement);
			this.announcerElement = null;
		}
	}
}

// Color contrast checker
export class ColorContrastChecker {
	// Calculate relative luminance
	private getLuminance(r: number, g: number, b: number): number {
		const [rs, gs, bs] = [r, g, b].map((c) => {
			c = c / 255;
			return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
		});
		return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
	}

	// Parse hex color to RGB
	private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result
			? {
					r: parseInt(result[1], 16),
					g: parseInt(result[2], 16),
					b: parseInt(result[3], 16),
				}
			: null;
	}

	// Calculate contrast ratio
	getContrastRatio(color1: string, color2: string): number {
		const rgb1 = this.hexToRgb(color1);
		const rgb2 = this.hexToRgb(color2);

		if (!rgb1 || !rgb2) return 0;

		const lum1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
		const lum2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);

		const brightest = Math.max(lum1, lum2);
		const darkest = Math.min(lum1, lum2);

		return (brightest + 0.05) / (darkest + 0.05);
	}

	// Check if contrast meets WCAG standards
	meetsWCAG(
		color1: string,
		color2: string,
		level: 'AA' | 'AAA' = 'AA',
		size: 'normal' | 'large' = 'normal'
	): boolean {
		const ratio = this.getContrastRatio(color1, color2);

		if (level === 'AA') {
			return size === 'large' ? ratio >= 3 : ratio >= 4.5;
		} else {
			return size === 'large' ? ratio >= 4.5 : ratio >= 7;
		}
	}

	// Get contrast level description
	getContrastLevel(ratio: number): string {
		if (ratio >= 7) return 'AAA (Excellent)';
		if (ratio >= 4.5) return 'AA (Good)';
		if (ratio >= 3) return 'AA Large (Acceptable)';
		return 'Fail (Poor)';
	}
}

// Accessibility Manager class
export class AccessibilityManager {
	private config: AccessibilityConfig;
	private focusManager: FocusManager;
	private announcer: ScreenReaderAnnouncer;
	private contrastChecker: ColorContrastChecker;

	constructor(config: Partial<AccessibilityConfig> = {}) {
		this.config = { ...defaultConfig, ...config };
		this.focusManager = new FocusManager();
		this.announcer = new ScreenReaderAnnouncer();
		this.contrastChecker = new ColorContrastChecker();

		if (isBrowser) {
			this.initialize();
		}
	}

	// Initialize accessibility features
	private initialize(): void {
		if (!isBrowser) return;

		if (this.config.enableReducedMotion) {
			this.handleReducedMotion();
		}

		if (this.config.enableKeyboardNavigation) {
			this.setupKeyboardNavigation();
		}

		if (this.config.enableFocusManagement) {
			this.setupFocusManagement();
		}

		logger.info('[AccessibilityManager] Accessibility features initialized');
	}

	// Handle reduced motion preference
	private handleReducedMotion(): void {
		if (!isBrowser) return;

		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

		const handleChange = (e: MediaQueryListEvent) => {
			if (e.matches) {
				document.documentElement.style.setProperty('--animation-duration', '0.01ms');
				document.documentElement.style.setProperty('--animation-iteration-count', '1');
			} else {
				document.documentElement.style.removeProperty('--animation-duration');
				document.documentElement.style.removeProperty('--animation-iteration-count');
			}
		};

		mediaQuery.addEventListener('change', handleChange);
		handleChange(mediaQuery);
	}

	// Setup keyboard navigation
	private setupKeyboardNavigation(): void {
		if (!isBrowser) return;

		document.addEventListener('keydown', (event) => {
			// Skip if user is typing in input
			if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
				return;
			}

			// Handle common keyboard shortcuts
			switch (event.key) {
				case KEYBOARD_KEYS.ESCAPE:
					this.handleEscapeKey();
					break;
				case 'h':
					if (event.ctrlKey || event.metaKey) {
						event.preventDefault();
						this.announcer.announce(
							'Help: Press Tab to navigate, Enter to activate, Escape to close'
						);
					}
					break;
			}
		});
	}

	// Setup focus management
	private setupFocusManagement(): void {
		// Track focus changes
		document.addEventListener('focusin', (event) => {
			if (event.target instanceof HTMLElement) {
				this.focusManager.focus(event.target);
			}
		});

		// Handle focus trap for modals
		document.addEventListener('keydown', (event) => {
			if (event.key === KEYBOARD_KEYS.TAB) {
				const activeElement = document.activeElement as HTMLElement;
				const modal = activeElement.closest('[role="dialog"]') as HTMLElement;

				if (modal) {
					this.focusManager.trapFocus(modal);
				}
			}
		});
	}

	// Handle escape key
	private handleEscapeKey(): void {
		// Close any open modals
		const openModal = document.querySelector('[role="dialog"][aria-hidden="false"]');
		if (openModal) {
			const closeButton = openModal.querySelector(
				'[aria-label*="close"], [aria-label*="Close"]'
			) as HTMLElement;
			if (closeButton) {
				closeButton.click();
			}
		}
	}

	// Get focus manager
	getFocusManager(): FocusManager {
		return this.focusManager;
	}

	// Get screen reader announcer
	getAnnouncer(): ScreenReaderAnnouncer {
		return this.announcer;
	}

	// Get color contrast checker
	getContrastChecker(): ColorContrastChecker {
		return this.contrastChecker;
	}

	// Update configuration
	updateConfig(newConfig: Partial<AccessibilityConfig>): void {
		this.config = { ...this.config, ...newConfig };
		logger.info('[AccessibilityManager] Configuration updated');
	}

	// Get current configuration
	getConfig(): AccessibilityConfig {
		return { ...this.config };
	}

	// Announce message to screen reader
	announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
		if (!isBrowser) return;
		this.announcer.announce(message, priority);
	}

	// Destroy accessibility manager
	destroy(): void {
		this.announcer.destroy();
		this.focusManager.clearHistory();
		logger.info('[AccessibilityManager] Destroyed');
	}
}

// Create global accessibility manager instance
export const accessibilityManager = new AccessibilityManager();

// Utility functions
export const getFocusManager = (): FocusManager => {
	return accessibilityManager.getFocusManager();
};

export const getAnnouncer = (): ScreenReaderAnnouncer => {
	return accessibilityManager.getAnnouncer();
};

export const announceToScreenReader = (
	message: string,
	priority: 'polite' | 'assertive' = 'polite'
): void => {
	if (!isBrowser) return;
	accessibilityManager.announce(message, priority);
};

export const getContrastChecker = (): ColorContrastChecker => {
	return accessibilityManager.getContrastChecker();
};

export const updateAccessibilityConfig = (config: Partial<AccessibilityConfig>): void => {
	accessibilityManager.updateConfig(config);
};

export const getAccessibilityConfig = (): AccessibilityConfig => {
	return accessibilityManager.getConfig();
};

export default accessibilityManager;
