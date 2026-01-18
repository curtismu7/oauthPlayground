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
				console.log(`${MODULE_TAG} Retrieved stored environment ID`);
				return stored;
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to get environment ID`, error);
		}
		return '';
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
			localStorage.setItem(STORAGE_KEY, environmentId.trim());
			console.log(`${MODULE_TAG} Saved environment ID`);
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
}

export default EnvironmentIdServiceV8;
