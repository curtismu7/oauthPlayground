// src/services/fieldEditingService.ts
// Service to prevent and fix field editing issues across all flows
// This service monitors and automatically fixes issues where form fields become disabled or readonly,
// which can prevent users from editing credentials and configuration values.

import { useCallback, useEffect, useRef } from 'react';

/**
 * Configuration options for field editing protection
 */
interface FieldEditingConfig {
	/** Prevent fields from being set to disabled state */
	preventDisabledState?: boolean;
	/** Prevent fields from being set to readonly state */
	preventReadonlyState?: boolean;
	/** Ensure pointer events are enabled for interactive fields */
	ensurePointerEvents?: boolean;
	/** Monitor DOM changes for field editing issues */
	monitorChanges?: boolean;
	/** Automatically fix detected issues */
	autoFix?: boolean;
}

/**
 * Current state of the field editing service
 */
interface FieldEditingState {
	/** Whether the service is currently monitoring for changes */
	isMonitoring: boolean;
	/** Last diagnostic information (can be null) */
	lastDiagnostic: Record<string, unknown> | null;
	/** Number of issues found and fixed */
	issuesFound: number;
}

class FieldEditingService {
	private static instance: FieldEditingService;
	private config: FieldEditingConfig;
	private state: FieldEditingState;
	private observers: Set<MutationObserver> = new Set();

	constructor() {
		this.config = {
			preventDisabledState: true,
			preventReadonlyState: true,
			ensurePointerEvents: true,
			monitorChanges: true,
			autoFix: true,
		};

		this.state = {
			isMonitoring: false,
			lastDiagnostic: null,
			issuesFound: 0,
		};
	}

	static getInstance(): FieldEditingService {
		if (!FieldEditingService.instance) {
			FieldEditingService.instance = new FieldEditingService();
		}
		return FieldEditingService.instance;
	}

	/**
	 * Initialize field editing protection with optional configuration
	 * @param config - Partial configuration to override defaults
	 */
	initialize(config: Partial<FieldEditingConfig> = {}): void {
		// Merge provided config with defaults
		this.config = { ...this.config, ...config };

		// Start monitoring DOM changes if enabled
		if (this.config.monitorChanges) {
			this.startMonitoring();
		}

		// Apply protection to existing fields if auto-fix is enabled
		if (this.config.autoFix) {
			this.applyProtection();
		}
	}

	/**
	 * Apply protection to all existing form fields in the document
	 * Scans for input, textarea, and select elements and removes disabled/readonly states
	 */
	applyProtection(): void {

		// Get all form input elements from the document
		const allInputs = this.getAllInputElements();
		let protectedCount = 0;

		// Apply protection to each field
		allInputs.forEach((input) => {
			if (this.protectField(input)) {
				protectedCount++;
			}
		});

	}

	/**
	 * Protect a single field by removing disabled/readonly attributes and ensuring pointer events
	 * @param element - The HTML element to protect
	 * @returns true if any protection was applied, false otherwise
	 */
	private protectField(element: HTMLElement): boolean {
		let protected_ = false;

		// Prevent disabled state - remove disabled attribute and set disabled property to false
		if (this.config.preventDisabledState) {
			if (element.hasAttribute('disabled')) {
				element.removeAttribute('disabled');
				// Type assertion needed because HTMLElement doesn't have disabled property
				// but HTMLInputElement, HTMLSelectElement, and HTMLTextAreaElement do
				const inputElement = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
				if ('disabled' in inputElement) {
					inputElement.disabled = false;
				}
				protected_ = true;
			}
		}

		// Prevent readonly state - remove readonly attribute and set readOnly property to false
		if (this.config.preventReadonlyState) {
			if (element.hasAttribute('readonly')) {
				element.removeAttribute('readonly');
				// Type assertion needed because HTMLElement doesn't have readOnly property
				// but HTMLInputElement and HTMLTextAreaElement do
				const inputElement = element as HTMLInputElement | HTMLTextAreaElement;
				if ('readOnly' in inputElement) {
					inputElement.readOnly = false;
				}
				protected_ = true;
			}
		}

		// Ensure pointer events are enabled - allows user interaction with the field
		if (this.config.ensurePointerEvents) {
			const computedStyle = window.getComputedStyle(element);
			if (computedStyle.pointerEvents === 'none') {
				// Type assertion needed to access style property
				const styledElement = element as HTMLElement & { style: CSSStyleDeclaration };
				styledElement.style.pointerEvents = 'auto';
				protected_ = true;
			}
		}

		return protected_;
	}

	/**
	 * Start monitoring DOM for field editing issues using MutationObserver
	 * Watches for disabled/readonly attributes being added to form fields
	 */
	startMonitoring(): void {
		// Prevent duplicate monitoring
		if (this.state.isMonitoring) {
			return;
		}

		// Create MutationObserver to watch for attribute and DOM changes
		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				// Handle attribute changes (disabled/readonly being added)
				if (mutation.type === 'attributes') {
					const target = mutation.target as HTMLElement;
					if (this.isInputElement(target)) {
						this.handleFieldChange(target, mutation);
					}
				}

				// Handle new elements being added to DOM
				if (mutation.type === 'childList') {
					mutation.addedNodes.forEach((node) => {
						if (node.nodeType === Node.ELEMENT_NODE) {
							const element = node as HTMLElement;
							// Protect the element itself if it's an input
							if (this.isInputElement(element)) {
								this.protectField(element);
							}

							// Check for input elements within the added node (nested forms)
							const inputs = element.querySelectorAll('input, textarea, select');
							inputs.forEach((input) => this.protectField(input as HTMLElement));
						}
					});
				}
			});
		});

		// Observe the entire document body for changes
		observer.observe(document.body, {
			attributes: true, // Watch for attribute changes
			attributeFilter: ['disabled', 'readonly'], // Only watch these specific attributes
			childList: true, // Watch for new elements being added
			subtree: true, // Watch all descendants, not just direct children
		});

		// Store observer for cleanup later
		this.observers.add(observer);
		this.state.isMonitoring = true;
	}

	/**
	 * Stop monitoring DOM changes and disconnect all MutationObservers
	 */
	stopMonitoring(): void {

		// Disconnect all active observers
		this.observers.forEach((observer) => observer.disconnect());
		this.observers.clear();
		this.state.isMonitoring = false;
	}

	/**
	 * Handle field attribute changes detected by MutationObserver
	 * @param element - The element that changed
	 * @param mutation - The mutation record containing change details
	 */
	private handleFieldChange(element: HTMLElement, mutation: MutationRecord): void {
		const attributeName = mutation.attributeName;

		// Only handle disabled and readonly attribute changes
		if (attributeName === 'disabled' || attributeName === 'readonly') {
			const newValue = element.getAttribute(attributeName);

			// Only log if the attribute is being set (not removed by our service)
			// When we remove the attribute, newValue will be null, which is expected
			// This prevents logging when our own service removes the attribute
			if (newValue !== null) {
				// Increment issue counter
				this.state.issuesFound++;

				// Auto-fix if enabled
				if (this.config.autoFix) {
					this.protectField(element);
				}
			}
		}
	}

	/**
	 * Check if an element is a form input element (input, textarea, or select)
	 * @param element - The element to check
	 * @returns true if the element is an input, textarea, or select element
	 */
	private isInputElement(element: HTMLElement): boolean {
		const tagName = element.tagName.toLowerCase();
		return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
	}

	/**
	 * Get all form input elements from the document
	 * @returns Array of all input, textarea, and select elements found
	 */
	private getAllInputElements(): HTMLElement[] {
		// Selectors for all types of form input elements
		const selectors = [
			'input[type="text"]',
			'input[type="email"]',
			'input[type="password"]',
			'input[type="url"]',
			'input[type="tel"]',
			'input[type="search"]',
			'textarea',
			'select',
		];

		const elements: HTMLElement[] = [];
		// Query for each selector and collect all results
		selectors.forEach((selector) => {
			const found = document.querySelectorAll(selector) as NodeListOf<HTMLElement>;
			elements.push(...Array.from(found));
		});

		return elements;
	}

	/**
	 * Get current service state (monitoring status and issue count)
	 * @returns Copy of the current state object
	 */
	getState(): FieldEditingState {
		return { ...this.state };
	}

	/**
	 * Update service configuration at runtime
	 * @param config - Partial configuration to merge with existing config
	 */
	updateConfig(config: Partial<FieldEditingConfig>): void {
		this.config = { ...this.config, ...config };
	}

	/**
	 * Cleanup service - stops monitoring and disconnects observers
	 */
	cleanup(): void {
		this.stopMonitoring();
	}
}

/**
 * React hook for field editing protection
 * Provides access to the field editing service within React components
 * @param config - Optional configuration to pass to the service
 * @returns Object with protectField function, getState function, and service instance
 */
export const useFieldEditingProtection = (config: Partial<FieldEditingConfig> = {}) => {
	const serviceRef = useRef<FieldEditingService | null>(null);

	useEffect(() => {
		// Get singleton instance and initialize with config
		const service = FieldEditingService.getInstance();
		serviceRef.current = service;

		service.initialize(config);

		return () => {
			// Don't cleanup the singleton service here as it's shared
			// Individual components should not stop the global monitoring
		};
	}, [config]);

	/**
	 * Protect a single field element
	 * @param element - The HTML element to protect
	 * @returns true if protection was applied, false otherwise
	 */
	const protectField = useCallback((element: HTMLElement) => {
		if (serviceRef.current) {
			// Access private method through type assertion (service is singleton)
			// Use unknown as intermediate type to bypass private method access restrictions
			return (
				serviceRef.current as unknown as {
					protectField: (element: HTMLElement) => boolean;
				}
			).protectField(element);
		}
		return false;
	}, []);

	/**
	 * Get current service state
	 * @returns Current state object or null if service not initialized
	 */
	const getState = useCallback(() => {
		if (serviceRef.current) {
			return serviceRef.current.getState();
		}
		return null;
	}, []);

	return {
		protectField,
		getState,
		service: serviceRef.current,
	};
};

/**
 * Global access for debugging in browser console
 * Exposes service instance and convenience functions to window object
 */
if (typeof window !== 'undefined') {
	const service = FieldEditingService.getInstance();

	// Type definition for window extensions
	interface WindowWithFieldEditingService extends Window {
		FieldEditingService: FieldEditingService;
		protectFields: () => void;
		startFieldMonitoring: () => void;
		stopFieldMonitoring: () => void;
		getFieldState: () => FieldEditingState;
	}

	// Expose service instance to window for debugging
	(window as unknown as WindowWithFieldEditingService).FieldEditingService = service;

	// Convenience functions for console debugging
	(window as unknown as WindowWithFieldEditingService).protectFields = () =>
		service.applyProtection();
	(window as unknown as WindowWithFieldEditingService).startFieldMonitoring = () =>
		service.startMonitoring();
	(window as unknown as WindowWithFieldEditingService).stopFieldMonitoring = () =>
		service.stopMonitoring();
	(window as unknown as WindowWithFieldEditingService).getFieldState = () => service.getState();

}

export default FieldEditingService;
