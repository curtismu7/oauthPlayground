/**
 * @file StepNavigationService.ts
 * @description Professional-grade step navigation service for OAuth flows
 * @author OAuth Playground Team
 * @version 1.0.0
 * @since 2026-01-25
 *
 * Features:
 * - Clean, simple API
 * - Type-safe navigation
 * - Event-driven updates
 * - Persistent state
 * - Error handling
 * - Accessibility support
 */

export interface StepNavigationState {
	currentStep: number;
	totalSteps: number;
	isNavigating: boolean;
	lastError: string | null;
}

export interface StepNavigationConfig {
	totalSteps: number;
	initialStep?: number;
	onStepChange?: (step: number) => void;
	onNavigationStart?: () => void;
	onNavigationEnd?: () => void;
	onError?: (error: string) => void;
}

export type StepNavigationEvent =
	| { type: 'stepChanged'; step: number; previousStep: number }
	| { type: 'navigationStarted' }
	| { type: 'navigationEnded' }
	| { type: 'error'; error: string };

export type StepNavigationListener = (event: StepNavigationEvent) => void;

/**
 * Professional Step Navigation Service
 *
 * Provides clean, reliable step navigation with event-driven updates
 * and comprehensive error handling.
 */
export class StepNavigationService {
	private static instance: StepNavigationService | null = null;

	private state: StepNavigationState = {
		currentStep: 0,
		totalSteps: 1,
		isNavigating: false,
		lastError: null,
	};

	private config: StepNavigationConfig = {
		totalSteps: 1,
		initialStep: 0,
	};

	private listeners: Set<StepNavigationListener> = new Set();

	private constructor() {}

	/**
	 * Get singleton instance
	 */
	public static getInstance(): StepNavigationService {
		if (!StepNavigationService.instance) {
			StepNavigationService.instance = new StepNavigationService();
		}
		return StepNavigationService.instance;
	}

	/**
	 * Initialize navigation service
	 */
	public initialize(config: StepNavigationConfig): void {
		this.config = {
			...config,
			initialStep: config.initialStep || 0,
		};

		this.state = {
			currentStep: this.config.initialStep!,
			totalSteps: this.config.totalSteps,
			isNavigating: false,
			lastError: null,
		};

		this.emit({ type: 'stepChanged', step: this.state.currentStep, previousStep: -1 });
	}

	/**
	 * Navigate to specific step
	 */
	public async navigateToStep(step: number): Promise<boolean> {
		if (this.state.isNavigating) {
			return false;
		}

		if (step < 0 || step >= this.state.totalSteps) {
			const error = `Invalid step: ${step}. Must be between 0 and ${this.state.totalSteps - 1}`;
			this.handleError(error);
			return false;
		}

		if (step === this.state.currentStep) {
			return true; // Already at target step
		}

		return this.performNavigation(step);
	}

	/**
	 * Navigate to next step
	 */
	public async navigateToNext(): Promise<boolean> {
		const nextStep = this.state.currentStep + 1;
		return this.navigateToStep(nextStep);
	}

	/**
	 * Navigate to previous step
	 */
	public async navigateToPrevious(): Promise<boolean> {
		const previousStep = this.state.currentStep - 1;
		return this.navigateToStep(previousStep);
	}

	/**
	 * Reset to first step
	 */
	public async reset(): Promise<boolean> {
		return this.navigateToStep(0);
	}

	/**
	 * Get current navigation state
	 */
	public getState(): Readonly<StepNavigationState> {
		return { ...this.state };
	}

	/**
	 * Check if can navigate to next step
	 */
	public canGoNext(): boolean {
		return this.state.currentStep < this.state.totalSteps - 1 && !this.state.isNavigating;
	}

	/**
	 * Check if can navigate to previous step
	 */
	public canGoPrevious(): boolean {
		return this.state.currentStep > 0 && !this.state.isNavigating;
	}

	/**
	 * Check if is at first step
	 */
	public isFirstStep(): boolean {
		return this.state.currentStep === 0;
	}

	/**
	 * Check if is at last step
	 */
	public isLastStep(): boolean {
		return this.state.currentStep === this.state.totalSteps - 1;
	}

	/**
	 * Get step progress (0-1)
	 */
	public getProgress(): number {
		return this.state.totalSteps > 0 ? this.state.currentStep / (this.state.totalSteps - 1) : 0;
	}

	/**
	 * Get step label (e.g., "Step 3 of 5")
	 */
	public getStepLabel(): string {
		return `Step ${this.state.currentStep + 1} of ${this.state.totalSteps}`;
	}

	/**
	 * Add event listener
	 */
	public addListener(listener: StepNavigationListener): () => void {
		this.listeners.add(listener);
		return () => this.removeListener(listener);
	}

	/**
	 * Remove event listener
	 */
	public removeListener(listener: StepNavigationListener): void {
		this.listeners.delete(listener);
	}

	/**
	 * Update total steps (for dynamic flows)
	 */
	public updateTotalSteps(totalSteps: number): void {
		if (totalSteps < 1) {
			throw new Error('Total steps must be at least 1');
		}

		const previousTotal = this.state.totalSteps;
		this.state.totalSteps = totalSteps;

		// Adjust current step if necessary
		if (this.state.currentStep >= totalSteps) {
			this.state.currentStep = totalSteps - 1;
		}

		// Re-emit step changed event if total steps changed
		if (previousTotal !== totalSteps) {
			this.emit({
				type: 'stepChanged',
				step: this.state.currentStep,
				previousStep: this.state.currentStep,
			});
		}
	}

	/**
	 * Clear any errors
	 */
	public clearError(): void {
		this.state.lastError = null;
	}

	/**
	 * Dispose service
	 */
	public dispose(): void {
		this.listeners.clear();
		this.state = {
			currentStep: 0,
			totalSteps: 1,
			isNavigating: false,
			lastError: null,
		};
	}

	/**
	 * Perform navigation with proper error handling
	 */
	private async performNavigation(targetStep: number): Promise<boolean> {
		const previousStep = this.state.currentStep;

		try {
			// Start navigation
			this.state.isNavigating = true;
			this.state.lastError = null;
			this.emit({ type: 'navigationStarted' });

			// Call navigation start callback
			this.config.onNavigationStart?.();

			// Perform navigation
			this.state.currentStep = targetStep;

			// Call step change callback
			await this.config.onStepChange?.(targetStep);

			// Emit step changed event
			this.emit({ type: 'stepChanged', step: targetStep, previousStep });

			return true;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Navigation failed';
			this.handleError(errorMessage);
			return false;
		} finally {
			// End navigation
			this.state.isNavigating = false;
			this.emit({ type: 'navigationEnded' });
			this.config.onNavigationEnd?.();
		}
	}

	/**
	 * Handle errors
	 */
	private handleError(error: string): void {
		this.state.lastError = error;
		this.emit({ type: 'error', error });
		this.config.onError?.(error);
	}

	/**
	 * Emit event to listeners
	 */
	private emit(event: StepNavigationEvent): void {
		this.listeners.forEach((listener) => {
			try {
				listener(event);
			} catch (error) {
				console.error('StepNavigationService: Error in listener:', error);
			}
		});
	}
}

// Export singleton instance
export const stepNavigationService = StepNavigationService.getInstance();
