/**
 * @file apiDisplayServiceV8.ts
 * @module v8/services
 * @description Service to manage SuperSimpleAPIDisplay visibility state across all pages
 * @version 8.0.0
 * @since 2024-11-23
 * 
 * Features:
 * - Centralized visibility state management
 * - Persistent state across page navigation
 * - Event-based updates for reactive UI
 * 
 * @example
 * import { apiDisplayServiceV8 } from '@/v8/services/apiDisplayServiceV8';
 * 
 * // Show/hide the display
 * apiDisplayServiceV8.show();
 * apiDisplayServiceV8.hide();
 * apiDisplayServiceV8.toggle();
 * 
 * // Get current state
 * const isVisible = apiDisplayServiceV8.isVisible();
 * 
 * // Subscribe to changes
 * const unsubscribe = apiDisplayServiceV8.subscribe((isVisible) => {
 *   console.log('Visibility changed:', isVisible);
 * });
 */

const MODULE_TAG = '[🎛️ API-DISPLAY-SERVICE-V8]';

type VisibilityChangeListener = (isVisible: boolean) => void;

class ApiDisplayServiceV8 {
	private visible: boolean = false;
	private listeners: Set<VisibilityChangeListener> = new Set();

	constructor() {
		// Load initial state from localStorage
		try {
			const saved = localStorage.getItem('apiDisplay.visible');
			if (saved !== null) {
				this.visible = saved === 'true';
				console.log(`${MODULE_TAG} Loaded visibility state from localStorage:`, this.visible);
			}
		} catch (error) {
			console.warn(`${MODULE_TAG} Failed to load visibility state:`, error);
		}
	}

	/**
	 * Check if API display is visible
	 */
	isVisible(): boolean {
		return this.visible;
	}

	/**
	 * Show the API display
	 */
	show(): void {
		if (!this.visible) {
			console.log(`${MODULE_TAG} Showing API display`);
			this.visible = true;
			this.saveState();
			this.notifyListeners();
		}
	}

	/**
	 * Hide the API display
	 */
	hide(): void {
		if (this.visible) {
			console.log(`${MODULE_TAG} Hiding API display`);
			this.visible = false;
			this.saveState();
			this.notifyListeners();
		}
	}

	/**
	 * Toggle API display visibility
	 */
	toggle(): void {
		console.log(`${MODULE_TAG} Toggling API display visibility`);
		this.visible = !this.visible;
		this.saveState();
		this.notifyListeners();
	}

	/**
	 * Subscribe to visibility changes
	 * @param listener - Callback function to be called when visibility changes
	 * @returns Unsubscribe function
	 */
	subscribe(listener: VisibilityChangeListener): () => void {
		this.listeners.add(listener);
		console.log(`${MODULE_TAG} Listener subscribed (total: ${this.listeners.size})`);
		
		// Return unsubscribe function
		return () => {
			this.listeners.delete(listener);
			console.log(`${MODULE_TAG} Listener unsubscribed (remaining: ${this.listeners.size})`);
		};
	}

	/**
	 * Notify all listeners of visibility change
	 */
	private notifyListeners(): void {
		console.log(`${MODULE_TAG} Notifying ${this.listeners.size} listeners of visibility change:`, this.visible);
		this.listeners.forEach((listener) => {
			try {
				listener(this.visible);
			} catch (error) {
				console.error(`${MODULE_TAG} Error in listener:`, error);
			}
		});
	}

	/**
	 * Save visibility state to localStorage
	 */
	private saveState(): void {
		try {
			localStorage.setItem('apiDisplay.visible', String(this.visible));
			console.log(`${MODULE_TAG} Saved visibility state to localStorage:`, this.visible);
		} catch (error) {
			console.warn(`${MODULE_TAG} Failed to save visibility state:`, error);
		}
	}
}

// Export singleton instance
export const apiDisplayServiceV8 = new ApiDisplayServiceV8();
export default apiDisplayServiceV8;
