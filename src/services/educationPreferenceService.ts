/**
 * @file educationPreferenceService.ts
 * @module services
 * @description Education Preference Service for managing user education content display preferences
 * @version 1.0.0
 * @since 2024-11-16
 *
 * This service manages user preferences for hiding/showing educational content
 * across OAuth flows with persistent storage.
 */

export type EducationMode = 'full' | 'compact' | 'hidden';

export interface EducationPreference {
	mode: EducationMode;
	lastUpdated: number;
}

const STORAGE_KEY = 'oauth_education_preference';
const DEFAULT_MODE: EducationMode = 'full';

/**
 * Education Preference Service
 * 
 * Manages user preferences for educational content display modes:
 * - full: Show all educational content (default)
 * - compact: Show one-liner summaries that can be expanded
 * - hidden: Show minimal content with expand options
 */
export class EducationPreferenceService {
	/**
	 * Get the current education mode preference
	 * @returns {EducationMode} Current education mode
	 */
	static getEducationMode(): EducationMode {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const preference: EducationPreference = JSON.parse(stored);
				// Validate the stored mode
				if (['full', 'compact', 'hidden'].includes(preference.mode)) {
					return preference.mode;
				}
			}
		} catch (error) {
			console.warn('[EducationPreferenceService] Failed to load preference, using default:', error);
		}
		return DEFAULT_MODE;
	}

	/**
	 * Validate if a mode is valid
	 * @param {EducationMode} mode - The mode to validate
	 * @returns {boolean} True if mode is valid
	 */
	static isValidMode(mode: EducationMode): boolean {
		return ['full', 'compact', 'hidden'].includes(mode);
	}

	/**
	 * Set the education mode preference
	 * @param {EducationMode} mode - The education mode to set
	 */
	static setEducationMode(mode: EducationMode): void {
		if (!this.isValidMode(mode)) {
			console.warn('[EducationPreferenceService] Invalid education mode:', mode);
			return;
		}

		try {
			const preference: EducationPreference = {
				mode,
				lastUpdated: Date.now(),
			};
			localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
			console.log('[EducationPreferenceService] Education mode updated to:', mode);
			
			// Dispatch storage event to notify other components
			window.dispatchEvent(new StorageEvent('storage', {
				key: STORAGE_KEY,
				newValue: JSON.stringify(preference),
				url: window.location.href,
			}));
		} catch (error) {
			console.error('[EducationPreferenceService] Failed to save preference:', error);
		}
	}

	/**
	 * Get the full preference object
	 * @returns {EducationPreference | null} Complete preference object or null
	 */
	static getPreference(): EducationPreference | null {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const preference: EducationPreference = JSON.parse(stored);
				// Validate the stored mode
				if (['full', 'compact', 'hidden'].includes(preference.mode)) {
					return preference;
				}
			}
		} catch (error) {
			console.warn('[EducationPreferenceService] Failed to load preference:', error);
		}
		return null;
	}

	/**
	 * Clear the stored preference (reset to default)
	 */
	static clearPreference(): void {
		try {
			localStorage.removeItem(STORAGE_KEY);
			console.log('[EducationPreferenceService] Preference cleared, using default mode');
		} catch (error) {
			console.error('[EducationPreferenceService] Failed to clear preference:', error);
		}
	}

	/**
	 * Check if the current mode is compact
	 * @returns {boolean} True if in compact mode
	 */
	static isCompactMode(): boolean {
		return this.getEducationMode() === 'compact';
	}

	/**
	 * Check if the current mode is hidden
	 * @returns {boolean} True if in hidden mode
	 */
	static isHiddenMode(): boolean {
		return this.getEducationMode() === 'hidden';
	}

	/**
	 * Check if the current mode is full
	 * @returns {boolean} True if in full mode
	 */
	static isFullMode(): boolean {
		return this.getEducationMode() === 'full';
	}

	/**
	 * Toggle to the next mode in sequence: full -> compact -> hidden -> full
	 * @returns {EducationMode} The new mode after toggling
	 */
	static toggleMode(): EducationMode {
		const currentMode = this.getEducationMode();
		let newMode: EducationMode;
		
		switch (currentMode) {
			case 'full':
				newMode = 'compact';
				break;
			case 'compact':
				newMode = 'hidden';
				break;
			case 'hidden':
				newMode = 'full';
				break;
			default:
				newMode = DEFAULT_MODE;
		}
		
		this.setEducationMode(newMode);
		return newMode;
	}

	/**
	 * Get user-friendly label for the current mode
	 * @returns {string} Human-readable mode label
	 */
	static getModeLabel(): string {
		const mode = this.getEducationMode();
		switch (mode) {
			case 'full':
				return 'Full Education';
			case 'compact':
				return 'Compact Summaries';
			case 'hidden':
				return 'Hidden';
			default:
				return 'Unknown';
		}
	}

	/**
	 * Get description for the current mode
	 * @returns {string} Description of what the mode does
	 */
	static getModeDescription(): string {
		const mode = this.getEducationMode();
		switch (mode) {
			case 'full':
				return 'Show all educational content with detailed explanations';
			case 'compact':
				return 'Show one-liner summaries that can be expanded';
			case 'hidden':
				return 'Hide educational content, show only when expanded';
			default:
				return 'Unknown mode';
		}
	}
}

export default EducationPreferenceService;
