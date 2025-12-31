// src/services/accessibilityService.ts
// Accessibility and Responsive Design Service (function-based singleton)

import { logger } from '../utils/logger';

export interface AccessibilityConfig {
	enableScreenReader: boolean;
	enableKeyboardNavigation: boolean;
	enableHighContrast: boolean;
	enableReducedMotion: boolean;
	fontSize: 'small' | 'medium' | 'large' | 'extra-large';
	colorScheme: 'light' | 'dark' | 'auto';
	announceChanges: boolean;
	focusManagement: boolean;
}

export interface ResponsiveBreakpoints {
	mobile: number;
	tablet: number;
	desktop: number;
	wide: number;
}

export interface AccessibilityFeatures {
	ariaLabels: Record<string, string>;
	keyboardShortcuts: Record<string, () => void>;
	screenReaderText: Record<string, string>;
	focusTraps: string[];
	liveRegions: string[];
}

export interface DeviceCapabilities {
	screenReader: boolean;
	touchScreen: boolean;
	keyboard: boolean;
	mouse: boolean;
	reducedMotion: boolean;
	highContrast: boolean;
	darkMode: boolean;
}

const defaultConfig: AccessibilityConfig = {
	enableScreenReader: true,
	enableKeyboardNavigation: true,
	enableHighContrast: false,
	enableReducedMotion: false,
	fontSize: 'medium',
	colorScheme: 'auto',
	announceChanges: true,
	focusManagement: true,
};

const defaultBreakpoints: ResponsiveBreakpoints = {
	mobile: 768,
	tablet: 1024,
	desktop: 1440,
	wide: 1920,
};

const defaultFeatures: AccessibilityFeatures = {
	ariaLabels: {},
	keyboardShortcuts: {},
	screenReaderText: {},
	focusTraps: [],
	liveRegions: [],
};

const state: {
	config: AccessibilityConfig;
	breakpoints: ResponsiveBreakpoints;
	features: AccessibilityFeatures;
	deviceCapabilities: DeviceCapabilities | null;
	currentBreakpoint: keyof ResponsiveBreakpoints;
	focusHistory: HTMLElement[];
	announcer: HTMLElement | null;
	keyboardListenerAttached: boolean;
} = {
	config: { ...defaultConfig },
	breakpoints: { ...defaultBreakpoints },
	features: { ...defaultFeatures },
	deviceCapabilities: null,
	currentBreakpoint: 'desktop',
	focusHistory: [],
	announcer: null,
	keyboardListenerAttached: false,
};

const detectScreenReader = (): boolean => {
	if (typeof window === 'undefined') return false;
	const userAgent = navigator.userAgent.toLowerCase();
	const screenReaderIndicators = ['nvda', 'jaws', 'voiceover', 'talkback', 'orca'];
	return (
		screenReaderIndicators.some((indicator) => userAgent.includes(indicator)) ||
		window.speechSynthesis !== undefined
	);
};

const detectDeviceCapabilities = (): void => {
	if (typeof window === 'undefined') {
		state.deviceCapabilities = {
			screenReader: false,
			touchScreen: false,
			keyboard: true,
			mouse: true,
			reducedMotion: false,
			highContrast: false,
			darkMode: false,
		};
		return;
	}

	state.deviceCapabilities = {
		screenReader: detectScreenReader(),
		touchScreen: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
		keyboard: true,
		mouse: window.matchMedia('(pointer: fine)').matches,
		reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
		highContrast: window.matchMedia('(prefers-contrast: high)').matches,
		darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
	};
};

const getFontSizeValue = (size: AccessibilityConfig['fontSize']): string => {
	switch (size) {
		case 'small':
			return '14px';
		case 'medium':
			return '16px';
		case 'large':
			return '18px';
		case 'extra-large':
			return '20px';
		default:
			return '16px';
	}
};

const applyUserPreferences = (): void => {
	if (typeof document === 'undefined') return;

	document.documentElement.style.fontSize = getFontSizeValue(state.config.fontSize);

	if (state.config.colorScheme !== 'auto') {
		document.documentElement.setAttribute('data-color-scheme', state.config.colorScheme);
	}

	if (state.config.enableHighContrast) {
		document.body.classList.add('high-contrast');
	} else {
		document.body.classList.remove('high-contrast');
	}

	if (state.config.enableReducedMotion) {
		document.body.classList.add('reduced-motion');
	} else {
		document.body.classList.remove('reduced-motion');
	}

	const classes = getResponsiveClasses();
	document.body.className = document.body.className
		.replace(
			/breakpoint-\w+|touch-device|screen-reader|high-contrast|reduced-motion|font-size-\w+|color-scheme-\w+/g,
			''
		)
		.trim();
	classes.forEach((cls) => {
		document.body.classList.add(cls);
	});
};

const updateBreakpoint = (): void => {
	if (typeof window === 'undefined') return;
	const width = window.innerWidth;

	if (width < state.breakpoints.mobile) {
		state.currentBreakpoint = 'mobile';
	} else if (width < state.breakpoints.tablet) {
		state.currentBreakpoint = 'tablet';
	} else if (width < state.breakpoints.desktop) {
		state.currentBreakpoint = 'desktop';
	} else {
		state.currentBreakpoint = 'wide';
	}

	document.body.className = document.body.className.replace(/breakpoint-\w+/g, '').trim();
	document.body.classList.add(`breakpoint-${state.currentBreakpoint}`);
};

const setupResponsiveBreakpoints = (): void => {
	if (typeof window === 'undefined') return;
	updateBreakpoint();
	window.addEventListener('resize', updateBreakpoint);
};

const addSkipLinks = (): void => {
	if (typeof document === 'undefined') return;
	if (document.querySelector('.skip-links')) return;

	const container = document.createElement('nav');
	container.className = 'skip-links sr-only sr-only-focusable';
	container.innerHTML = `
		<a href="#main-content">Skip to main content</a>
		<a href="#primary-navigation">Skip to primary navigation</a>
	`;
	document.body.prepend(container);
};

const setupFocusIndicators = (): void => {
	if (typeof document === 'undefined') return;

	const style = document.createElement('style');
	style.textContent = `
    :focus {
      outline: 3px solid #2563eb;
      outline-offset: 2px;
    }
  `;
	document.head.appendChild(style);
};

const setupAccessibilityFeatures = (): void => {
	if (typeof document === 'undefined') return;

	if (!state.announcer) {
		state.announcer = document.createElement('div');
		state.announcer.setAttribute('aria-live', 'polite');
		state.announcer.setAttribute('aria-atomic', 'true');
		state.announcer.style.position = 'absolute';
		state.announcer.style.left = '-10000px';
		state.announcer.style.width = '1px';
		state.announcer.style.height = '1px';
		state.announcer.style.overflow = 'hidden';
		document.body.appendChild(state.announcer);
	}

	addSkipLinks();
	setupFocusIndicators();
};

const getShortcutKey = (event: KeyboardEvent): string => {
	const modifiers = [
		event.metaKey ? 'meta' : null,
		event.ctrlKey ? 'ctrl' : null,
		event.altKey ? 'alt' : null,
		event.shiftKey ? 'shift' : null,
	];
	return [...modifiers.filter(Boolean), event.key.toLowerCase()].join('+');
};

const handleEscapeKey = (): void => {
	const activeElement = document.activeElement as HTMLElement | null;
	if (!activeElement) return;

	if (activeElement.getAttribute('role') === 'dialog') {
		activeElement.dispatchEvent(new Event('close'));
	}
};

const setupKeyboardNavigation = (): void => {
	if (typeof document === 'undefined' || state.keyboardListenerAttached) return;

	document.addEventListener('keydown', (event) => {
		const shortcutKey = getShortcutKey(event);
		const handler = state.features.keyboardShortcuts[shortcutKey];

		if (handler) {
			event.preventDefault();
			handler();
			return;
		}

		switch (event.key) {
			case 'Escape':
				handleEscapeKey();
				break;
			default:
				break;
		}
	});

	state.keyboardListenerAttached = true;
};

const setupScreenReaderSupport = (): void => {
	if (typeof document === 'undefined') return;

	const style = document.createElement('style');
	style.textContent = `
    .sr-only {
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    }
    .sr-only-focusable:focus {
      position: static !important;
      width: auto !important;
      height: auto !important;
      padding: inherit !important;
      margin: inherit !important;
      overflow: visible !important;
      clip: auto !important;
      white-space: inherit !important;
    }
  `;
	document.head.appendChild(style);
};

const initialize = (config?: Partial<AccessibilityConfig>): void => {
	state.config = { ...state.config, ...config };

	detectDeviceCapabilities();
	setupResponsiveBreakpoints();
	setupAccessibilityFeatures();

	if (state.config.enableKeyboardNavigation) {
		setupKeyboardNavigation();
	}

	if (state.config.enableScreenReader) {
		setupScreenReaderSupport();
	}

	applyUserPreferences();
};

const getDeviceCapabilities = (): DeviceCapabilities => {
	if (!state.deviceCapabilities) {
		detectDeviceCapabilities();
	}
	return state.deviceCapabilities!;
};

const getCurrentBreakpoint = (): keyof ResponsiveBreakpoints => state.currentBreakpoint;

const matchesBreakpoint = (breakpoint: keyof ResponsiveBreakpoints): boolean => {
	if (typeof window === 'undefined') return false;

	switch (breakpoint) {
		case 'mobile':
			return window.innerWidth < state.breakpoints.mobile;
		case 'tablet':
			return (
				window.innerWidth >= state.breakpoints.mobile &&
				window.innerWidth < state.breakpoints.tablet
			);
		case 'desktop':
			return (
				window.innerWidth >= state.breakpoints.tablet &&
				window.innerWidth < state.breakpoints.desktop
			);
		case 'wide':
			return window.innerWidth >= state.breakpoints.desktop;
		default:
			return false;
	}
};

const getResponsiveClasses = (): string[] => {
	const classes: string[] = [`breakpoint-${state.currentBreakpoint}`];

	if (state.deviceCapabilities?.touchScreen) {
		classes.push('touch-device');
	}

	if (state.deviceCapabilities?.screenReader) {
		classes.push('screen-reader');
	}

	if (state.config.enableHighContrast) {
		classes.push('high-contrast');
	}

	if (state.config.enableReducedMotion) {
		classes.push('reduced-motion');
	}

	classes.push(`font-size-${state.config.fontSize}`);
	classes.push(`color-scheme-${state.config.colorScheme}`);

	return classes;
};

const announce = (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
	if (!state.config.announceChanges || !state.announcer) {
		return;
	}

	state.announcer.setAttribute('aria-live', priority);
	state.announcer.textContent = message;

	setTimeout(() => {
		if (state.announcer) {
			state.announcer.textContent = '';
		}
	}, 1000);

	logger.debug('AccessibilityService', 'Screen reader announcement', {
		message,
		priority,
	});
};

const setFocus = (
	element: HTMLElement | string,
	options?: { preventScroll?: boolean; restoreFocus?: boolean }
): void => {
	if (!state.config.focusManagement || typeof document === 'undefined') {
		return;
	}

	const targetElement =
		typeof element === 'string' ? (document.querySelector(element) as HTMLElement) : element;

	if (!targetElement) {
		logger.warn('AccessibilityService', 'Focus target not found', { element });
		return;
	}

	if (options?.restoreFocus && document.activeElement instanceof HTMLElement) {
		state.focusHistory.push(document.activeElement);
	}

	targetElement.focus({ preventScroll: options?.preventScroll });

	const ariaLabel =
		targetElement.getAttribute('aria-label') ||
		targetElement.getAttribute('title') ||
		targetElement.textContent?.trim();

	if (ariaLabel) {
		announce(`Focused on ${ariaLabel}`);
	}

	logger.debug('AccessibilityService', 'Focus set', {
		element: targetElement.tagName,
		ariaLabel,
	});
};

const restoreFocus = (): void => {
	if (!state.config.focusManagement || state.focusHistory.length === 0) {
		return;
	}

	const previousElement = state.focusHistory.pop();
	previousElement?.focus();
};

const createFocusTrap = (container: HTMLElement): (() => void) => {
	const focusableSelectors =
		'a[href], button:not([disabled]), textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])';
	const focusableElements = Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));

	const firstElement = focusableElements[0];
	const lastElement = focusableElements[focusableElements.length - 1];

	const handleKeyDown = (event: KeyboardEvent) => {
		if (event.key !== 'Tab') return;

		if (event.shiftKey) {
			if (document.activeElement === firstElement) {
				event.preventDefault();
				lastElement?.focus();
			}
		} else if (document.activeElement === lastElement) {
			event.preventDefault();
			firstElement?.focus();
		}
	};

	container.addEventListener('keydown', handleKeyDown);
	setFocus(firstElement || container);

	return () => {
		container.removeEventListener('keydown', handleKeyDown);
		restoreFocus();
	};
};

const addAriaLabels = (labels: Record<string, string>): void => {
	state.features.ariaLabels = {
		...state.features.ariaLabels,
		...labels,
	};
};

const registerKeyboardShortcuts = (shortcuts: Record<string, () => void>): void => {
	Object.entries(shortcuts).forEach(([key, handler]) => {
		state.features.keyboardShortcuts[key.toLowerCase()] = handler;
	});
};

const updatePreferences = (preferences: Partial<AccessibilityConfig>): void => {
	state.config = { ...state.config, ...preferences };
	applyUserPreferences();
};

const getComplianceReport = (): {
	wcagLevel: 'AA';
	issues: string[];
	score: number;
	recommendations: string[];
} => {
	const wcagLevel: 'AA' = 'AA';
	const issues: string[] = [];

	if (!state.config.enableKeyboardNavigation) {
		issues.push('Keyboard navigation is disabled');
	}

	if (!state.config.enableScreenReader) {
		issues.push('Screen reader support is disabled');
	}

	const score = Math.max(0, 100 - issues.length * 10);

	return {
		wcagLevel,
		issues,
		score,
		recommendations: [
			'Review WCAG guidelines',
			'Run automated accessibility tests',
			'Perform manual screen reader testing',
		],
	};
};

export const AccessibilityService = {
	initialize,
	getDeviceCapabilities,
	getCurrentBreakpoint,
	matchesBreakpoint,
	getResponsiveClasses,
	announce,
	setFocus,
	restoreFocus,
	createFocusTrap,
	addAriaLabels,
	registerKeyboardShortcuts,
	updatePreferences,
	getComplianceReport,
};

export default AccessibilityService;
