/**
 * @file modalSpinnerServiceV8U.tsx
 * @module v8/services
 * @description Common service for managing modal spinner states across the application
 * @version 8.0.0
 */

export interface ModalSpinnerState {
	show: boolean;
	message: string;
	theme?: 'blue' | 'green' | 'orange' | 'purple';
}

export interface ModalSpinnerConfig {
	key: string;
	initialState: ModalSpinnerState;
}

/**
 * Common service for managing modal spinner states
 * Provides consistent modal spinner behavior across all components
 */
class ModalSpinnerServiceV8U {
	private static instances: Map<string, ModalSpinnerState> = new Map();

	/**
	 * Get or create a modal spinner instance
	 */
	static getInstance(key: string, initialState?: Partial<ModalSpinnerState>): ModalSpinnerState {
		if (!ModalSpinnerServiceV8U.instances.has(key)) {
			ModalSpinnerServiceV8U.instances.set(key, {
				show: false,
				message: '',
				theme: 'blue',
				...initialState,
			});
		}
		return ModalSpinnerServiceV8U.instances.get(key)!;
	}

	/**
	 * Update modal spinner state
	 */
	static updateState(key: string, updates: Partial<ModalSpinnerState>): void {
		const current = ModalSpinnerServiceV8U.instances.get(key);
		if (current) {
			ModalSpinnerServiceV8U.instances.set(key, { ...current, ...updates });
		}
	}

	/**
	 * Show modal spinner
	 */
	static show(key: string, message: string, theme?: ModalSpinnerState['theme']): void {
		ModalSpinnerServiceV8U.updateState(key, { show: true, message, theme });
	}

	/**
	 * Hide modal spinner
	 */
	static hide(key: string): void {
		ModalSpinnerServiceV8U.updateState(key, { show: false, message: '' });
	}

	/**
	 * Update message
	 */
	static updateMessage(key: string, message: string): void {
		ModalSpinnerServiceV8U.updateState(key, { message });
	}

	/**
	 * Get current state
	 */
	static getState(key: string): ModalSpinnerState | undefined {
		return ModalSpinnerServiceV8U.instances.get(key);
	}

	/**
	 * Clean up instance
	 */
	static cleanup(key: string): void {
		ModalSpinnerServiceV8U.instances.delete(key);
	}

	/**
	 * Get all active modal spinners
	 */
	static getAllActive(): Map<string, ModalSpinnerState> {
		const active = new Map<string, ModalSpinnerState>();
		for (const [key, state] of ModalSpinnerServiceV8U.instances) {
			if (state.show) {
				active.set(key, state);
			}
		}
		return active;
	}

	/**
	 * Hide all modal spinners
	 */
	static hideAll(): void {
		for (const [key] of ModalSpinnerServiceV8U.instances.keys()) {
			ModalSpinnerServiceV8U.hide(key);
		}
	}
}

export default ModalSpinnerServiceV8U;
