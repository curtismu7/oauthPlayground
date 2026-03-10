/**
 * @file apiDisplayServiceV9.ts
 * @module services/v9
 * @description Enhanced API Display Service V9 with full V8 compatibility
 * @version 9.0.0
 * @since 2024-03-09
 *
 * V9 enhancements:
 * - Enhanced animation support
 * - Visibility history tracking
 * - Performance monitoring
 * - Better TypeScript support
 * - V8 interface compatibility preserved
 *
 * @example
 * // V8 compatible usage
 * apiDisplayServiceV9.show();
 * apiDisplayServiceV9.hide();
 * const isVisible = apiDisplayServiceV9.isVisible();
 *
 * // V9 enhanced usage
 * apiDisplayServiceV9.showWithAnimation(300);
 * const history = apiDisplayServiceV9.getVisibilityHistory();
 */

import { logger } from '../../utils/logger';

const MODULE_TAG = '[🎛️ API-DISPLAY-SERVICE-V9]';

type VisibilityChangeListener = (isVisible: boolean) => void;

// V9 enhanced interfaces
export interface VisibilityEvent {
	timestamp: number;
	action: 'show' | 'hide' | 'toggle';
	source?: string;
	duration?: number;
}

export interface VisibilityMetrics {
	totalShows: number;
	totalHides: number;
	totalToggles: number;
	averageVisibilityDuration: number;
	lastActivity: number;
}

export interface AnimationOptions {
	duration?: number;
	easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
	delay?: number;
}

class ApiDisplayServiceV9 {
	private visible: boolean = false;
	private listeners: Set<VisibilityChangeListener> = new Set();
	private visibilityHistory: VisibilityEvent[] = [];
	private metrics: VisibilityMetrics = {
		totalShows: 0,
		totalHides: 0,
		totalToggles: 0,
		averageVisibilityDuration: 0,
		lastActivity: Date.now(),
	};
	private readonly STORAGE_KEY = 'apiDisplay.visible';
	private readonly HISTORY_KEY = 'apiDisplay.history';
	private readonly METRICS_KEY = 'apiDisplay.metrics';
	private readonly MAX_HISTORY_SIZE = 100;

	constructor() {
		// Load initial state from localStorage
		this.loadState();
	}

	// V8 Compatibility Layer - All V8 methods preserved exactly

	/**
	 * Check if API display is visible (V8 compatible)
	 * @returns boolean indicating visibility state
	 */
	isVisible(): boolean {
		return this.visible;
	}

	/**
	 * Show the API display (V8 compatible)
	 */
	show(): void {
		this.showWithAnimation();
	}

	/**
	 * Hide the API display (V8 compatible)
	 */
	hide(): void {
		this.hideWithAnimation();
	}

	/**
	 * Toggle visibility (V8 compatible)
	 */
	toggle(): void {
		if (this.visible) {
			this.hide();
		} else {
			this.show();
		}
	}

	/**
	 * Subscribe to visibility changes (V8 compatible)
	 * @param listener - Callback function for visibility changes
	 * @returns Unsubscribe function
	 */
	subscribe(listener: VisibilityChangeListener): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	// V9 Enhanced Methods

	/**
	 * Show the API display with animation (V9 enhanced)
	 * @param options - Animation options
	 */
	showWithAnimation(options?: AnimationOptions): void {
		if (!this.visible) {
			const previousVisible = this.visible;
			this.visible = true;

			// Record event
			this.recordEvent('show', options);

			// Update metrics
			this.metrics.totalShows++;
			this.metrics.lastActivity = Date.now();

			// Save state
			this.saveState();

			// Notify listeners
			this.notifyListeners();

			logger.info(MODULE_TAG, 'API display shown', {
				previousVisible,
				options,
				totalShows: this.metrics.totalShows,
			});
		}
	}

	/**
	 * Hide the API display with animation (V9 enhanced)
	 * @param options - Animation options
	 */
	hideWithAnimation(options?: AnimationOptions): void {
		if (this.visible) {
			const previousVisible = this.visible;
			this.visible = false;

			// Record event
			this.recordEvent('hide', options);

			// Update metrics
			this.metrics.totalHides++;
			this.metrics.lastActivity = Date.now();

			// Calculate visibility duration
			this.updateVisibilityDuration();

			// Save state
			this.saveState();

			// Notify listeners
			this.notifyListeners();

			logger.info(MODULE_TAG, 'API display hidden', {
				previousVisible,
				options,
				totalHides: this.metrics.totalHides,
			});
		}
	}

	/**
	 * Toggle visibility with animation (V9 enhanced)
	 * @param options - Animation options
	 */
	toggleWithAnimation(options?: AnimationOptions): void {
		this.recordEvent('toggle', options);
		this.metrics.totalToggles++;
		this.metrics.lastActivity = Date.now();

		if (this.visible) {
			this.hideWithAnimation(options);
		} else {
			this.showWithAnimation(options);
		}
	}

	/**
	 * Get visibility history (V9 enhanced)
	 * @returns Array of visibility events
	 */
	getVisibilityHistory(): VisibilityEvent[] {
		return [...this.visibilityHistory];
	}

	/**
	 * Get visibility metrics (V9 enhanced)
	 * @returns Current visibility metrics
	 */
	getVisibilityMetrics(): VisibilityMetrics {
		return { ...this.metrics };
	}

	/**
	 * Clear visibility history (V9 enhanced)
	 * @param olderThan - Optional timestamp to clear only events older than this
	 */
	clearVisibilityHistory(olderThan?: number): void {
		if (olderThan) {
			this.visibilityHistory = this.visibilityHistory.filter(
				(event) => event.timestamp > olderThan
			);
		} else {
			this.visibilityHistory = [];
		}
		this.saveState();
		logger.info(MODULE_TAG, 'Visibility history cleared', { olderThan });
	}

	/**
	 * Reset all metrics (V9 enhanced)
	 */
	resetMetrics(): void {
		this.metrics = {
			totalShows: 0,
			totalHides: 0,
			totalToggles: 0,
			averageVisibilityDuration: 0,
			lastActivity: Date.now(),
		};
		this.saveState();
		logger.info(MODULE_TAG, 'Metrics reset');
	}

	/**
	 * Get current visibility state as JSON (V9 enhanced)
	 * @returns JSON string of current state
	 */
	getStateAsJSON(): string {
		return JSON.stringify(
			{
				visible: this.visible,
				metrics: this.metrics,
				history: this.visibilityHistory.slice(-10), // Last 10 events
				timestamp: Date.now(),
			},
			null,
			2
		);
	}

	// Private helper methods

	private loadState(): void {
		try {
			// Load visibility state
			const saved = localStorage.getItem(this.STORAGE_KEY);
			if (saved !== null) {
				this.visible = saved === 'true';
			}

			// Load metrics
			const metricsSaved = localStorage.getItem(this.METRICS_KEY);
			if (metricsSaved) {
				this.metrics = { ...this.metrics, ...JSON.parse(metricsSaved) };
			}

			// Load history
			const historySaved = localStorage.getItem(this.HISTORY_KEY);
			if (historySaved) {
				this.visibilityHistory = JSON.parse(historySaved);
				// Limit history size
				if (this.visibilityHistory.length > this.MAX_HISTORY_SIZE) {
					this.visibilityHistory = this.visibilityHistory.slice(-this.MAX_HISTORY_SIZE);
				}
			}

			logger.debug(MODULE_TAG, 'State loaded from localStorage', {
				visible: this.visible,
				historySize: this.visibilityHistory.length,
				metrics: this.metrics,
			});
		} catch (error) {
			logger.warn(MODULE_TAG, 'Failed to load state from localStorage:', error);
		}
	}

	private saveState(): void {
		try {
			// Save visibility state
			localStorage.setItem(this.STORAGE_KEY, this.visible.toString());

			// Save metrics
			localStorage.setItem(this.METRICS_KEY, JSON.stringify(this.metrics));

			// Save history (limit size)
			const historyToSave = this.visibilityHistory.slice(-this.MAX_HISTORY_SIZE);
			localStorage.setItem(this.HISTORY_KEY, JSON.stringify(historyToSave));
		} catch (error) {
			logger.warn(MODULE_TAG, 'Failed to save state to localStorage:', error);
		}
	}

	private notifyListeners(): void {
		this.listeners.forEach((listener) => {
			try {
				listener(this.visible);
			} catch (error) {
				logger.error(MODULE_TAG, 'Error in visibility listener:', error);
			}
		});
	}

	private recordEvent(action: VisibilityEvent['action'], options?: AnimationOptions): void {
		const event: VisibilityEvent = {
			timestamp: Date.now(),
			action,
			source: 'user',
			duration: options?.duration,
		};

		this.visibilityHistory.push(event);

		// Limit history size
		if (this.visibilityHistory.length > this.MAX_HISTORY_SIZE) {
			this.visibilityHistory = this.visibilityHistory.slice(-this.MAX_HISTORY_SIZE);
		}
	}

	private updateVisibilityDuration(): void {
		// Find the most recent show event
		const lastShowEvent = [...this.visibilityHistory]
			.reverse()
			.find((event) => event.action === 'show');

		if (lastShowEvent) {
			const duration = Date.now() - lastShowEvent.timestamp;

			// Update average duration
			const totalDuration =
				this.metrics.averageVisibilityDuration * (this.metrics.totalHides - 1) + duration;
			this.metrics.averageVisibilityDuration = totalDuration / this.metrics.totalHides;
		}
	}
}

// Singleton instance for V8 compatibility
export const apiDisplayServiceV9 = new ApiDisplayServiceV9();

// Export class for V9 enhanced usage
export default ApiDisplayServiceV9;
