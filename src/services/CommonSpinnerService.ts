/**
 * @file CommonSpinnerService.ts
 * @module services
 * @description Centralized service for managing spinner states across Production apps
 * @version 1.0.0
 */

import type { CommonSpinnerConfig, CommonSpinnerState, SpinnerInstance } from '@/types/spinner';

const MODULE_TAG = '[🔄 COMMON-SPINNER-SERVICE]';

// Internal state
const instances = new Map<string, SpinnerInstance>();
const globalConfig: Partial<CommonSpinnerConfig> = {
	theme: 'blue',
	type: 'inline',
	size: 'md',
	allowDismiss: false,
};

/**
 * Create a new spinner instance
 */
function createInstance(
	appId: string,
	initialState?: Partial<CommonSpinnerConfig>
): SpinnerInstance {
	const defaultState: CommonSpinnerState = {
		show: false,
		message: 'Loading...',
		type: 'inline',
		theme: 'blue',
		size: 'md',
		allowDismiss: false,
		startTime: undefined,
		...globalConfig,
		...initialState,
	};

	let state = { ...defaultState };

	const instance: SpinnerInstance = {
		id: appId,
		get state() {
			return { ...state };
		},

		show: (config?: Partial<CommonSpinnerConfig>) => {
			state = {
				...state,
				...config,
				show: true,
				startTime: Date.now(),
			};

			console.log(`${MODULE_TAG} [${appId}] Spinner shown:`, {
				message: state.message,
				type: state.type,
				theme: state.theme,
			});

			// Dispatch custom event for global listeners
			window.dispatchEvent(
				new CustomEvent('spinner:show', {
					detail: { appId, state: { ...state } },
				})
			);
		},

		hide: () => {
			const duration = state.startTime ? Date.now() - state.startTime : 0;

			console.log(`${MODULE_TAG} [${appId}] Spinner hidden after ${duration}ms`);

			state = { ...state, show: false, startTime: undefined };

			// Dispatch custom event for global listeners
			window.dispatchEvent(
				new CustomEvent('spinner:hide', {
					detail: { appId, duration },
				})
			);
		},

		updateMessage: (message: string) => {
			state = { ...state, message };

			console.log(`${MODULE_TAG} [${appId}] Message updated: ${message}`);

			// Dispatch custom event for global listeners
			window.dispatchEvent(
				new CustomEvent('spinner:update', {
					detail: { appId, state: { ...state }, field: 'message' },
				})
			);
		},

		updateProgress: (progress: number) => {
			state = { ...state, progress };

			console.log(`${MODULE_TAG} [${appId}] Progress updated: ${progress}%`);

			// Dispatch custom event for global listeners
			window.dispatchEvent(
				new CustomEvent('spinner:update', {
					detail: { appId, state: { ...state }, field: 'progress' },
				})
			);
		},

		updateConfig: (config: Partial<CommonSpinnerConfig>) => {
			state = { ...state, ...config };

			console.log(`${MODULE_TAG} [${appId}] Config updated:`, config);

			// Dispatch custom event for global listeners
			window.dispatchEvent(
				new CustomEvent('spinner:update', {
					detail: { appId, state: { ...state }, field: 'config' },
				})
			);
		},
	};

	return instance;
}

/**
 * Common service for managing spinner states across all Production applications
 * Provides consistent spinner behavior and centralized state management
 */
export const CommonSpinnerService = {
	/**
	 * Get or create a spinner instance for a specific app
	 */
	getInstance(appId: string, initialState?: Partial<CommonSpinnerConfig>): SpinnerInstance {
		if (!instances.has(appId)) {
			const instance = createInstance(appId, initialState);
			instances.set(appId, instance);
			console.log(`${MODULE_TAG} Created spinner instance for app: ${appId}`);
		}

		return instances.get(appId)!;
	},

	/**
	 * Show spinner for a specific app
	 */
	showSpinner(appId: string, config?: Partial<CommonSpinnerConfig>): void {
		const instance = this.getInstance(appId);
		instance.show(config);
	},

	/**
	 * Hide spinner for a specific app
	 */
	hideSpinner(appId: string): void {
		const instance = this.getInstance(appId);
		instance.hide();
	},

	/**
	 * Update spinner message for a specific app
	 */
	updateMessage(appId: string, message: string): void {
		const instance = this.getInstance(appId);
		instance.updateMessage(message);
	},

	/**
	 * Update spinner progress for a specific app
	 */
	updateProgress(appId: string, progress: number): void {
		const instance = this.getInstance(appId);
		instance.updateProgress(progress);
	},

	/**
	 * Get all active spinner instances
	 */
	getAllInstances(): SpinnerInstance[] {
		return Array.from(instances.values());
	},

	/**
	 * Get all active spinner states
	 */
	getAllStates(): Record<string, CommonSpinnerState> {
		const states: Record<string, CommonSpinnerState> = {};

		instances.forEach((instance, appId) => {
			states[appId] = instance.state;
		});

		return states;
	},

	/**
	 * Hide all spinners (useful for navigation or cleanup)
	 */
	hideAllSpinners(): void {
		console.log(`${MODULE_TAG} Hiding all spinners (${instances.size} instances)`);

		instances.forEach((instance) => {
			instance.hide();
		});
	},

	/**
	 * Set global configuration for all new spinner instances
	 */
	setGlobalConfig(config: Partial<CommonSpinnerConfig>): void {
		Object.assign(globalConfig, config);
		console.log(`${MODULE_TAG} Global config updated:`, globalConfig);
	},

	/**
	 * Get global configuration
	 */
	getGlobalConfig(): Partial<CommonSpinnerConfig> {
		return { ...globalConfig };
	},

	/**
	 * Remove a spinner instance (cleanup)
	 */
	removeInstance(appId: string): void {
		if (instances.has(appId)) {
			instances.delete(appId);
			console.log(`${MODULE_TAG} Removed spinner instance for app: ${appId}`);
		}
	},

	/**
	 * Clear all instances (cleanup)
	 */
	clearAllInstances(): void {
		console.log(`${MODULE_TAG} Clearing all spinner instances`);
		instances.clear();
	},

	/**
	 * Get performance metrics for debugging
	 */
	getMetrics(): {
		totalInstances: number;
		activeInstances: number;
		averageShowTime: number;
		instanceDetails: Array<{ appId: string; showTime: number; isActive: boolean }>;
	} {
		const allInstances = this.getAllInstances();
		const activeInstances = allInstances.filter((instance) => instance.state.show);
		const totalShowTime = allInstances
			.filter((instance) => instance.state.startTime)
			.reduce((total, instance) => {
				const showTime = instance.state.startTime ? Date.now() - instance.state.startTime : 0;
				return total + showTime;
			}, 0);

		return {
			totalInstances: allInstances.length,
			activeInstances: activeInstances.length,
			averageShowTime: activeInstances.length > 0 ? totalShowTime / activeInstances.length : 0,
			instanceDetails: allInstances.map((instance) => ({
				appId: instance.id,
				showTime: instance.state.startTime ? Date.now() - instance.state.startTime : 0,
				isActive: instance.state.show,
			})),
		};
	},
};

export default CommonSpinnerService;
