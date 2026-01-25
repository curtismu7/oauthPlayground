/**
 * Step Navigator Service V8U
 * 
 * Centralized service for managing step navigation in unified flows.
 * Ensures consistent navigation behavior and prevents missing navigation buttons.
 * 
 * @version 8U
 * @since 2026-01-25
 * @author OAuth Playground Team
 */

export interface StepNavigatorConfig {
	totalSteps: number;
	currentStep: number;
	onStepChange?: (step: number) => void;
	onFlowReset?: () => void;
	disabledSteps?: number[];
	completedSteps?: number[];
}

export interface NavigationButtonConfig {
	showPrevious: boolean;
	showNext: boolean;
	showRestart: boolean;
	showStepIndicator: boolean;
	previousDisabled: boolean;
	nextDisabled: boolean;
	restartDisabled: boolean;
}

export class StepNavigatorServiceV8U {
	private static instance: StepNavigatorServiceV8U;
	private config: StepNavigatorConfig;
	private listeners: Set<() => void> = new Set();

	private constructor() {
		this.config = {
			totalSteps: 1,
			currentStep: 0,
		};
	}

	/**
	 * Get singleton instance
	 */
	static getInstance(): StepNavigatorServiceV8U {
		if (!StepNavigatorServiceV8U.instance) {
			StepNavigatorServiceV8U.instance = new StepNavigatorServiceV8U();
		}
		return StepNavigatorServiceV8U.instance;
	}

	/**
	 * Initialize the navigator with configuration
	 */
	initialize(config: StepNavigatorConfig): void {
		this.config = { ...this.config, ...config };
		this.notifyListeners();
	}

	/**
	 * Update current step
	 */
	setCurrentStep(step: number): void {
		if (step < 0 || step >= this.config.totalSteps) {
			console.warn(`StepNavigatorServiceV8U: Invalid step ${step}. Must be between 0 and ${this.config.totalSteps - 1}`);
			return;
		}

		this.config.currentStep = step;
		this.config.onStepChange?.(step);
		this.notifyListeners();
	}

	/**
	 * Navigate to specific step
	 */
	navigateToStep(step: number): void {
		this.setCurrentStep(step);
	}

	/**
	 * Navigate to next step
	 */
	navigateToNext(): void {
		if (this.canGoNext()) {
			this.navigateToStep(this.config.currentStep + 1);
		}
	}

	/**
	 * Navigate to previous step
	 */
	navigateToPrevious(): void {
		if (this.canGoPrevious()) {
			this.navigateToStep(this.config.currentStep - 1);
		}
	}

	/**
	 * Reset flow to first step
	 */
	resetFlow(): void {
		this.setCurrentStep(0);
		this.config.onFlowReset?.();
	}

	/**
	 * Check if can go to next step
	 */
	canGoNext(): boolean {
		return this.config.currentStep < this.config.totalSteps - 1 && 
			   !this.isStepDisabled(this.config.currentStep + 1);
	}

	/**
	 * Check if can go to previous step
	 */
	canGoPrevious(): boolean {
		return this.config.currentStep > 0 && 
			   !this.isStepDisabled(this.config.currentStep - 1);
	}

	/**
	 * Check if step is disabled
	 */
	isStepDisabled(step: number): boolean {
		return this.config.disabledSteps?.includes(step) ?? false;
	}

	/**
	 * Check if step is completed
	 */
	isStepCompleted(step: number): boolean {
		return this.config.completedSteps?.includes(step) ?? false;
	}

	/**
	 * Get navigation button configuration
	 */
	getNavigationButtonConfig(): NavigationButtonConfig {
		const { currentStep, totalSteps } = this.config;

		return {
			showPrevious: true,
			showNext: true,
			showRestart: true,
			showStepIndicator: true,
			previousDisabled: currentStep === 0 || !this.canGoPrevious(),
			nextDisabled: currentStep >= totalSteps - 1 || !this.canGoNext(),
			restartDisabled: false, // Restart is always enabled
		};
	}

	/**
	 * Get current configuration
	 */
	getConfig(): StepNavigatorConfig {
		return { ...this.config };
	}

	/**
	 * Update total steps
	 */
	setTotalSteps(totalSteps: number): void {
		if (totalSteps < 1) {
			console.warn(`StepNavigatorServiceV8U: Invalid totalSteps ${totalSteps}. Must be at least 1.`);
			return;
		}

		this.config.totalSteps = totalSteps;
		// Adjust current step if it's out of bounds
		if (this.config.currentStep >= totalSteps) {
			this.config.currentStep = totalSteps - 1;
		}
		this.notifyListeners();
	}

	/**
	 * Mark step as completed
	 */
	markStepCompleted(step: number): void {
		if (!this.config.completedSteps) {
			this.config.completedSteps = [];
		}
		if (!this.config.completedSteps.includes(step)) {
			this.config.completedSteps.push(step);
			this.notifyListeners();
		}
	}

	/**
	 * Mark step as disabled
	 */
	markStepDisabled(step: number, disabled: boolean = true): void {
		if (!this.config.disabledSteps) {
			this.config.disabledSteps = [];
		}

		const index = this.config.disabledSteps.indexOf(step);
		if (disabled && index === -1) {
			this.config.disabledSteps.push(step);
		} else if (!disabled && index !== -1) {
			this.config.disabledSteps.splice(index, 1);
		}
		this.notifyListeners();
	}

	/**
	 * Subscribe to navigation changes
	 */
	subscribe(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	/**
	 * Notify all listeners of changes
	 */
	private notifyListeners(): void {
		this.listeners.forEach(listener => {
			listener();
		});
	}

	/**
	 * Get step progress percentage
	 */
	getProgressPercentage(): number {
		const completedCount = this.config.completedSteps?.length ?? 0;
		return (completedCount / this.config.totalSteps) * 100;
	}

	/**
	 * Get step label
	 */
	getStepLabel(step: number): string {
		return `Step ${step + 1} of ${this.config.totalSteps}`;
	}

	/**
	 * Validate navigation state
	 */
	validateNavigationState(): { isValid: boolean; errors: string[] } {
		const errors: string[] = [];

		if (this.config.totalSteps < 1) {
			errors.push('Total steps must be at least 1');
		}

		if (this.config.currentStep < 0 || this.config.currentStep >= this.config.totalSteps) {
			errors.push(`Current step ${this.config.currentStep} is out of bounds (0-${this.config.totalSteps - 1})`);
		}

		if (this.config.disabledSteps?.some(step => step < 0 || step >= this.config.totalSteps)) {
			errors.push('Disabled steps contain invalid step numbers');
		}

		if (this.config.completedSteps?.some(step => step < 0 || step >= this.config.totalSteps)) {
			errors.push('Completed steps contain invalid step numbers');
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Reset service to initial state
	 */
	reset(): void {
		this.config = {
			totalSteps: 1,
			currentStep: 0,
		};
		this.listeners.clear();
	}
}

// Export singleton instance for easy access
export const stepNavigatorServiceV8U = StepNavigatorServiceV8U.getInstance();
