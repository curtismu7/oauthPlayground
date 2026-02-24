/**
 * @file feedbackConfigService.ts
 * @module services/feedback
 * @description Feedback system configuration service
 * @version 9.3.6
 * @since 2026-02-23
 *
 * Provides configuration management for the feedback system,
 * including environment variable handling and default settings.
 */

// Default configuration values
export const DEFAULT_FEEDBACK_CONFIG = {
	// Snackbar durations (in milliseconds)
	SNACKBAR_DURATION: {
		success: 4000,
		info: 4000,
		warning: 6000,
		error: 6000,
	},

	// Feature flags
	FEATURES: {
		KEYBOARD_NAVIGATION: true,
		SCREEN_READER_SUPPORT: true,
		AUTO_DISMISS_BANNERS: true,
		DEBUG_MODE: false,
	},

	// Animation settings
	ANIMATION: {
		TRANSITION_DURATION: 150, // 0.15s ease-in-out
		FADE_DURATION: 300,
		SLIDE_DURATION: 200,
	},

	// Accessibility settings
	ACCESSIBILITY: {
		FOCUS_VISIBLE_DURATION: 2000,
		ANNOUNCEMENT_DELAY: 100,
		LIVE_REGION_POLITE: true,
	},
} as const;

// Mutable configuration interface
interface MutableFeedbackConfig {
	SNACKBAR_DURATION: {
		success: number;
		info: number;
		warning: number;
		error: number;
	};
	FEATURES: {
		KEYBOARD_NAVIGATION: boolean;
		SCREEN_READER_SUPPORT: boolean;
		AUTO_DISMISS_BANNERS: boolean;
		DEBUG_MODE: boolean;
	};
	ANIMATION: {
		TRANSITION_DURATION: number;
		FADE_DURATION: number;
		SLIDE_DURATION: number;
	};
	ACCESSIBILITY: {
		FOCUS_VISIBLE_DURATION: number;
		ANNOUNCEMENT_DELAY: number;
		LIVE_REGION_POLITE: boolean;
	};
}

/**
 * Feedback configuration service
 */
export class FeedbackConfigService {
	private static instance: FeedbackConfigService;
	private config: MutableFeedbackConfig;

	private constructor() {
		this.config = { ...DEFAULT_FEEDBACK_CONFIG };
		this.loadEnvironmentVariables();
	}

	static getInstance(): FeedbackConfigService {
		if (!FeedbackConfigService.instance) {
			FeedbackConfigService.instance = new FeedbackConfigService();
		}
		return FeedbackConfigService.instance;
	}

	/**
	 * Load configuration from environment variables
	 */
	private loadEnvironmentVariables(): void {
		// Load snackbar duration
		const snackbarDuration = this.getEnvVar('VITE_FEEDBACK_SNACKBAR_DURATION');
		if (snackbarDuration) {
			const duration = Number(snackbarDuration);
			if (!Number.isNaN(duration) && duration > 0) {
				this.config = {
					...this.config,
					SNACKBAR_DURATION: {
						success: duration,
						info: duration,
						warning: duration * 1.5, // 1.5x for warnings
						error: duration * 1.5, // 1.5x for errors
					},
				};
			}
		}

		// Load feature flags
		const bannerAutoDismiss = this.getEnvVar('VITE_FEEDBACK_BANNER_AUTO_DISMISS');
		if (bannerAutoDismiss) {
			this.config = {
				...this.config,
				FEATURES: {
					...this.config.FEATURES,
					AUTO_DISMISS_BANNERS: bannerAutoDismiss === 'true',
				},
			};
		}

		const enableKeyboardNav = this.getEnvVar('VITE_FEEDBACK_ENABLE_KEYBOARD_NAV');
		if (enableKeyboardNav) {
			this.config = {
				...this.config,
				FEATURES: {
					...this.config.FEATURES,
					KEYBOARD_NAVIGATION: enableKeyboardNav === 'true',
				},
			};
		}

		const enableScreenReader = this.getEnvVar('VITE_FEEDBACK_ENABLE_SCREEN_READER');
		if (enableScreenReader) {
			this.config = {
				...this.config,
				FEATURES: {
					...this.config.FEATURES,
					SCREEN_READER_SUPPORT: enableScreenReader === 'true',
				},
			};
		}

		// Load debug mode
		const debugMode = this.getEnvVar('VITE_FEEDBACK_DEBUG_MODE');
		if (debugMode) {
			this.config = {
				...this.config,
				FEATURES: {
					...this.config.FEATURES,
					DEBUG_MODE: debugMode === 'true',
				},
			};
		}
	}

	/**
	 * Get environment variable value
	 */
	private getEnvVar(key: string): string | undefined {
		// Client-side (Vite)
		if (typeof import.meta !== 'undefined' && import.meta.env) {
			return import.meta.env[key];
		}

		// Server-side (Node.js)
		if (typeof process !== 'undefined' && process.env) {
			return process.env[key];
		}

		return undefined;
	}

	/**
	 * Get snackbar duration for message type
	 */
	getSnackbarDuration(type: 'success' | 'info' | 'warning' | 'error'): number {
		return this.config.SNACKBAR_DURATION[type];
	}

	/**
	 * Check if keyboard navigation is enabled
	 */
	isKeyboardNavigationEnabled(): boolean {
		return this.config.FEATURES.KEYBOARD_NAVIGATION;
	}

	/**
	 * Check if screen reader support is enabled
	 */
	isScreenReaderSupportEnabled(): boolean {
		return this.config.FEATURES.SCREEN_READER_SUPPORT;
	}

	/**
	 * Check if auto-dismiss for banners is enabled
	 */
	isBannerAutoDismissEnabled(): boolean {
		return this.config.FEATURES.AUTO_DISMISS_BANNERS;
	}

	/**
	 * Check if debug mode is enabled
	 */
	isDebugModeEnabled(): boolean {
		return this.config.FEATURES.DEBUG_MODE;
	}

	/**
	 * Get animation duration
	 */
	getAnimationDuration(): number {
		return this.config.ANIMATION.TRANSITION_DURATION;
	}

	/**
	 * Get accessibility settings
	 */
	getAccessibilitySettings() {
		return this.config.ACCESSIBILITY;
	}

	/**
	 * Get current configuration (for debugging)
	 */
	getConfig() {
		return { ...this.config };
	}

	/**
	 * Update configuration (for testing)
	 */
	updateConfig(newConfig: Partial<MutableFeedbackConfig>): void {
		this.config = { ...this.config, ...newConfig };
	}

	/**
	 * Reset to default configuration
	 */
	resetToDefaults(): void {
		this.config = { ...DEFAULT_FEEDBACK_CONFIG };
		this.loadEnvironmentVariables();
	}

	/**
	 * Validate configuration
	 */
	validateConfig(): { isValid: boolean; errors: string[] } {
		const errors: string[] = [];

		// Validate durations
		Object.entries(this.config.SNACKBAR_DURATION).forEach(([type, duration]) => {
			if (duration < 1000) {
				errors.push(`${type} duration too short (minimum 1000ms)`);
			}
			if (duration > 30000) {
				errors.push(`${type} duration too long (maximum 30000ms)`);
			}
		});

		// Validate feature flags
		Object.entries(this.config.FEATURES).forEach(([feature, enabled]) => {
			if (typeof enabled !== 'boolean') {
				errors.push(`${feature} must be a boolean`);
			}
		});

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Get configuration summary for display
	 */
	getConfigSummary() {
		return {
			snackbarDurations: this.config.SNACKBAR_DURATION,
			features: this.config.FEATURES,
			animation: this.config.ANIMATION,
			accessibility: this.config.ACCESSIBILITY,
			source: 'Environment Variables + Defaults',
		};
	}
}

// Export singleton instance
export const feedbackConfig = FeedbackConfigService.getInstance();

// Export types for external use
export type FeedbackConfig = MutableFeedbackConfig;
export type SnackbarDurations = MutableFeedbackConfig['SNACKBAR_DURATION'];
export type FeedbackFeatures = MutableFeedbackConfig['FEATURES'];

export default feedbackConfig;
