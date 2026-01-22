/**
 * @file modalSpinnerServiceV8U.tsx
 * @module v8/services
 * @description Common service for managing modal spinner states across the application
 * @version 8.0.0
 */

import { useState, useCallback } from 'react';

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
		if (!this.instances.has(key)) {
			this.instances.set(key, {
				show: false,
				message: '',
				theme: 'blue',
				...initialState,
			});
		}
		return this.instances.get(key)!;
	}

	/**
	 * Update modal spinner state
	 */
	static updateState(key: string, updates: Partial<ModalSpinnerState>): void {
		const current = this.instances.get(key);
		if (current) {
			this.instances.set(key, { ...current, ...updates });
		}
	}

	/**
	 * Show modal spinner
	 */
	static show(key: string, message: string, theme?: ModalSpinnerState['theme']): void {
		this.updateState(key, { show: true, message, theme });
	}

	/**
	 * Hide modal spinner
	 */
	static hide(key: string): void {
		this.updateState(key, { show: false, message: '' });
	}

	/**
	 * Update message
	 */
	static updateMessage(key: string, message: string): void {
		this.updateState(key, { message });
	}

	/**
	 * Get current state
	 */
	static getState(key: string): ModalSpinnerState | undefined {
		return this.instances.get(key);
	}

	/**
	 * Clean up instance
	 */
	static cleanup(key: string): void {
		this.instances.delete(key);
	}

	/**
	 * Get all active modal spinners
	 */
	static getAllActive(): Map<string, ModalSpinnerState> {
		const active = new Map<string, ModalSpinnerState>();
		for (const [key, state] of this.instances) {
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
		for (const [key] of this.instances.keys()) {
			this.hide(key);
		}
	}
}

export default ModalSpinnerServiceV8U;
