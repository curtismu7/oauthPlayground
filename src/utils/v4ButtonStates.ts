// src/utils/v4ButtonStates.ts - Button State Management for V4 Flows

import { ButtonStates } from '../types/v4FlowTemplate';

export class V4ButtonStatesManager {
	private states: ButtonStates;

	constructor() {
		this.states = {
			saveConfiguration: {
				loading: false,
				disabled: false,
				variant: 'primary' as const
			},
			generateAuthUrl: {
				loading: false,
				disabled: false,
				hasUrl: false
			},
			exchangeTokens: {
				loading: false,
				disabled: false,
				hasTokens: false
			},
			generatePKCE: {
				loading: false,
				disabled: false
			},
			copyToClipboard: {
				loading: false,
				disabled: false
			},
			navigation: {
				canGoNext: true,
				canGoPrevious: false
			}
		};
	}

	/**
	 * Get current button states
	 */
	getStates(): ButtonStates {
		return { ...this.states };
	}

	/**
	 * Update save configuration button state
	 */
	updateSaveConfiguration(updates: Partial<ButtonStates['saveConfiguration']>): void {
		this.states.saveConfiguration = { ...this.states.saveConfiguration, ...updates };
	}

	/**
	 * Update generate auth URL button state
	 */
	updateGenerateAuthUrl(updates: Partial<ButtonStates['generateAuthUrl']>): void {
		this.states.generateAuthUrl = { ...this.states.generateAuthUrl, ...updates };
	}

	/**
	 * Update exchange tokens button state
	 */
	updateExchangeTokens(updates: Partial<ButtonStates['exchangeTokens']>): void {
		this.states.exchangeTokens = { ...this.states.exchangeTokens, ...updates };
	}

	/**
	 * Update generate PKCE button state
	 */
	updateGeneratePKCE(updates: Partial<ButtonStates['generatePKCE']>): void {
		this.states.generatePKCE = { ...this.states.generatePKCE, ...updates };
	}

	/**
	 * Update copy to clipboard button state
	 */
	updateCopyToClipboard(updates: Partial<ButtonStates['copyToClipboard']>): void {
		this.states.copyToClipboard = { ...this.states.copyToClipboard, ...updates };
	}

	/**
	 * Update navigation button states
	 */
	updateNavigation(updates: Partial<ButtonStates['navigation']>): void {
		this.states.navigation = { ...this.states.navigation, ...updates };
	}

	/**
	 * Set loading state for a specific button
	 */
	setLoading(buttonType: keyof ButtonStates, loading: boolean): void {
		switch (buttonType) {
			case 'saveConfiguration':
				this.updateSaveConfiguration({ loading, disabled: loading });
				break;
			case 'generateAuthUrl':
				this.updateGenerateAuthUrl({ loading, disabled: loading });
				break;
			case 'exchangeTokens':
				this.updateExchangeTokens({ loading, disabled: loading });
				break;
			case 'generatePKCE':
				this.updateGeneratePKCE({ loading, disabled: loading });
				break;
			case 'copyToClipboard':
				this.updateCopyToClipboard({ loading, disabled: loading });
				break;
		}
	}

	/**
	 * Set disabled state for a specific button
	 */
	setDisabled(buttonType: keyof ButtonStates, disabled: boolean): void {
		switch (buttonType) {
			case 'saveConfiguration':
				this.updateSaveConfiguration({ disabled });
				break;
			case 'generateAuthUrl':
				this.updateGenerateAuthUrl({ disabled });
				break;
			case 'exchangeTokens':
				this.updateExchangeTokens({ disabled });
				break;
			case 'generatePKCE':
				this.updateGeneratePKCE({ disabled });
				break;
			case 'copyToClipboard':
				this.updateCopyToClipboard({ disabled });
				break;
		}
	}

	/**
	 * Reset all button states to default
	 */
	reset(): void {
		this.states = {
			saveConfiguration: {
				loading: false,
				disabled: false,
				variant: 'primary'
			},
			generateAuthUrl: {
				loading: false,
				disabled: false,
				hasUrl: false
			},
			exchangeTokens: {
				loading: false,
				disabled: false,
				hasTokens: false
			},
			generatePKCE: {
				loading: false,
				disabled: false
			},
			copyToClipboard: {
				loading: false,
				disabled: false
			},
			navigation: {
				canGoNext: true,
				canGoPrevious: false
			}
		};
	}

	/**
	 * Update navigation states based on current step
	 */
	updateNavigationForStep(currentStep: number, totalSteps: number): void {
		this.updateNavigation({
			canGoNext: currentStep < totalSteps - 1,
			canGoPrevious: currentStep > 0
		});
	}

	/**
	 * Check if any button is currently loading
	 */
	isAnyButtonLoading(): boolean {
		return Object.values(this.states).some(state => 
			'loading' in state && state.loading === true
		);
	}

	/**
	 * Get button variant based on state
	 */
	getButtonVariant(buttonType: keyof ButtonStates): string {
		const state = this.states[buttonType];
		
		if ('variant' in state) {
			return state.variant;
		}
		
		if ('loading' in state && state.loading) {
			return 'loading';
		}
		
		if ('disabled' in state && state.disabled) {
			return 'disabled';
		}
		
		return 'default';
	}
}

// Create default instance
export const v4ButtonStates = new V4ButtonStatesManager();
