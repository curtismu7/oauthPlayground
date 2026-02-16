/**
 * @file environmentIdServiceV8.ts
 * @module v8/services
 * @description Global environment ID storage and retrieval service
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Stores environment ID globally so it only needs to be entered once.
 * Once saved, it's automatically used across all flows.
 */

const MODULE_TAG = '[🌍 ENVIRONMENT-ID-SERVICE-V8]';
const STORAGE_KEY = 'v8:global_environment_id';

export class EnvironmentIdServiceV8 {
	/**
	 * Get stored environment ID
	 * @returns Environment ID or empty string if not set
	 */
	static getEnvironmentId(): string {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				// Only log if debug mode is enabled or if this is the first call
				if (typeof window !== 'undefined' && !(window as any).__envIdLogged) {
					console.log(`${MODULE_TAG} Retrieved stored environment ID`);
					(window as any).__envIdLogged = true;
				}
				return stored;
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to get environment ID`, error);
		}
		return '';
	}

	/**
	 * Reset logging state (for debugging)
	 */
	static resetLoggingState(): void {
		if (typeof window !== 'undefined') {
			(window as any).__envIdLogged = false;
		}
	}

	// Add debug helper to window object for easy access
	static addDebugHelper(): void {
		if (typeof window !== 'undefined') {
			(window as any).resetEnvironmentIdLogging = () => {
				EnvironmentIdServiceV8.resetLoggingState();
				console.log('🔧 Environment ID logging state reset');
			};
		}
	}

	/**
	 * Save environment ID globally
	 * @param environmentId - Environment ID to save
	 */
	static saveEnvironmentId(environmentId: string): void {
		if (!environmentId?.trim()) {
			console.warn(`${MODULE_TAG} Attempted to save empty environment ID`);
			return;
		}

		try {
			const trimmed = environmentId.trim();
			localStorage.setItem(STORAGE_KEY, trimmed);
			console.log(`${MODULE_TAG} Saved environment ID`);

			// Add to history (new feature)
			EnvironmentIdServiceV8.addToHistory(trimmed);

			// Dispatch event so components can react
			window.dispatchEvent(new Event('environmentIdUpdated'));
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to save environment ID`, error);
		}
	}

	/**
	 * Clear stored environment ID
	 */
	static clearEnvironmentId(): void {
		try {
			localStorage.removeItem(STORAGE_KEY);
			console.log(`${MODULE_TAG} Cleared environment ID`);
			window.dispatchEvent(new Event('environmentIdUpdated'));
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to clear environment ID`, error);
		}
	}

	/**
	 * Check if environment ID is stored
	 * @returns True if environment ID exists
	 */
	static hasEnvironmentId(): boolean {
		return !!EnvironmentIdServiceV8.getEnvironmentId();
	}

	// ============================================================================
	// NEW METHODS - Phase 1 Enhancements (Additive Only, Non-Breaking)
	// ============================================================================

	/**
	 * Validate environment ID format
	 * PingOne environment IDs are UUIDs
	 *
	 * @param envId - Environment ID to validate
	 * @returns Validation result with specific error message
	 *
	 * @example
	 * const result = EnvironmentIdServiceV8.validateEnvironmentId(envId);
	 * if (!result.valid) {
	 *   toastV8.error(result.error);
	 * }
	 */
	static validateEnvironmentId(envId: string): {
		valid: boolean;
		error?: string;
		formatted?: string;
	} {
		if (!envId || !envId.trim()) {
			return {
				valid: false,
				error: 'Environment ID is required',
			};
		}

		const trimmed = envId.trim();

		// UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

		if (!uuidRegex.test(trimmed)) {
			// Check if it's a UUID without dashes
			const noDashRegex = /^[0-9a-f]{32}$/i;
			if (noDashRegex.test(trimmed)) {
				// Format it with dashes
				const formatted = trimmed.replace(
					/^([0-9a-f]{8})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{12})$/i,
					'$1-$2-$3-$4-$5'
				);
				return {
					valid: true,
					formatted,
					error: undefined,
				};
			}

			return {
				valid: false,
				error:
					'Environment ID must be a valid UUID format (e.g., 12345678-1234-1234-1234-123456789012)',
			};
		}

		return {
			valid: true,
			formatted: trimmed.toLowerCase(), // Normalize to lowercase
		};
	}

	/**
	 * Get recently used environment IDs
	 * Useful for quick switching between environments
	 *
	 * @param limit - Maximum number of IDs to return (default: 5)
	 * @returns Array of recent environment IDs (most recent first)
	 *
	 * @example
	 * const recent = EnvironmentIdServiceV8.getRecentEnvironmentIds(5);
	 * // Show in dropdown for quick selection
	 */
	static getRecentEnvironmentIds(limit: number = 5): string[] {
		try {
			const history = localStorage.getItem('v8:env_id_history');
			if (!history) {
				return [];
			}

			const ids = JSON.parse(history) as string[];
			return ids.slice(0, limit);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to get environment ID history`, error);
			return [];
		}
	}

	/**
	 * Add environment ID to history
	 * Automatically called by saveEnvironmentId
	 *
	 * @param envId - Environment ID to add to history
	 */
	private static addToHistory(envId: string): void {
		try {
			const history = EnvironmentIdServiceV8.getRecentEnvironmentIds(10);

			// Remove if already exists (to move to front)
			const filtered = history.filter((id) => id !== envId);

			// Add to front
			const updated = [envId, ...filtered].slice(0, 10);

			localStorage.setItem('v8:env_id_history', JSON.stringify(updated));
			console.log(`${MODULE_TAG} Added to history (total: ${updated.length})`);
		} catch (error) {
			// Silent fail - history is not critical
			console.warn(`${MODULE_TAG} Failed to update history`, error);
		}
	}

	/**
	 * Clear environment ID history
	 */
	static clearHistory(): void {
		try {
			localStorage.removeItem('v8:env_id_history');
			console.log(`${MODULE_TAG} Cleared environment ID history`);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to clear history`, error);
		}
	}

	/**
	 * Format environment ID for display
	 * Provides consistent formatting across the application
	 *
	 * @param envId - Environment ID to format
	 * @param format - Format type ('short', 'medium', 'full')
	 * @returns Formatted environment ID
	 *
	 * @example
	 * const short = EnvironmentIdServiceV8.formatEnvironmentId(envId, 'short');
	 * // "12345678..."
	 *
	 * const medium = EnvironmentIdServiceV8.formatEnvironmentId(envId, 'medium');
	 * // "12345678-1234..."
	 */
	static formatEnvironmentId(envId: string, format: 'short' | 'medium' | 'full' = 'short'): string {
		if (!envId) {
			return '(not set)';
		}

		const trimmed = envId.trim();

		switch (format) {
			case 'short':
				// First 8 characters
				return `${trimmed.substring(0, 8)}...`;

			case 'medium': {
				// First segment + second segment
				const parts = trimmed.split('-');
				if (parts.length >= 2) {
					return `${parts[0]}-${parts[1]}...`;
				}
				return `${trimmed.substring(0, 13)}...`;
			}
			default:
				return trimmed;
		}
	}
}

// Initialize debug helper
EnvironmentIdServiceV8.addDebugHelper();

export default EnvironmentIdServiceV8;
