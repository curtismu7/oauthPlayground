/**
 * @file stepNavigation.ts
 * @module v8/types
 * @description Type definitions for step navigation system
 * @version 8.0.0
 * @since 2024-11-16
 */

/**
 * Represents a single step in a flow
 */
export interface FlowStep {
	/** Unique step identifier (0-based) */
	id: number;
	/** Display name of the step */
	label: string;
	/** Detailed description of what happens in this step */
	description: string;
	/** Whether this step is currently active */
	isActive: boolean;
	/** Whether this step has been completed */
	isCompleted: boolean;
	/** Whether this step can be accessed (not locked) */
	isAccessible: boolean;
	/** Validation errors preventing progression */
	validationErrors: string[];
	/** Warnings that don't prevent progression */
	validationWarnings: string[];
}

/**
 * State of the entire step navigation system
 */
export interface StepNavigationState {
	/** Current active step (0-based) */
	currentStep: number;
	/** Total number of steps */
	totalSteps: number;
	/** Array of all steps */
	steps: FlowStep[];
	/** Whether user can go to previous step */
	canGoPrevious: boolean;
	/** Whether user can go to next step */
	canGoNext: boolean;
	/** Overall progress percentage (0-100) */
	progressPercentage: number;
	/** Whether the entire flow is complete */
	isFlowComplete: boolean;
}

/**
 * Props for StepNavigationV8 component
 */
export interface StepNavigationV8Props {
	/** Current step number (0-based) */
	currentStep: number;
	/** Total number of steps */
	totalSteps: number;
	/** Array of step labels */
	stepLabels: string[];
	/** Array of completed step indices */
	completedSteps: number[];
	/** Callback when user clicks on a step */
	onStepClick?: (stepId: number) => void;
	/** CSS class name for styling */
	className?: string;
}

/**
 * Props for StepProgressBar component
 */
export interface StepProgressBarProps {
	/** Current step number (0-based) */
	currentStep: number;
	/** Total number of steps */
	totalSteps: number;
	/** Array of completed step indices */
	completedSteps: number[];
	/** CSS class name for styling */
	className?: string;
}

/**
 * Props for StepActionButtons component
 */
export interface StepActionButtonsProps {
	/** Current step number (0-based) */
	currentStep: number;
	/** Total number of steps */
	totalSteps: number;
	/** Whether the next button should be disabled */
	isNextDisabled: boolean;
	/** Reason why next button is disabled (for tooltip) */
	nextDisabledReason?: string;
	/** Whether to hide the next button entirely (e.g., when a custom action button is shown) */
	hideNextButton?: boolean;
	/** Whether to hide the previous button entirely (temporarily disabled as it's broken) */
	hidePreviousButton?: boolean;
	/** Callback when user clicks previous */
	onPrevious: () => void;
	/** Callback when user clicks next */
	onNext: () => void;
	/** Optional callback for final step (e.g., "Start New Flow") */
	onFinal?: () => void;
	/** Label for next button (default: "Next Step") */
	nextLabel?: string;
	/** Label for final button (default: "Start New Flow") */
	finalLabel?: string;
	/** CSS class name for styling */
	className?: string;
}

/**
 * Props for StepValidationFeedback component
 */
export interface StepValidationFeedbackProps {
	/** Array of validation errors */
	errors: string[];
	/** Array of validation warnings */
	warnings: string[];
	/** Whether to show errors */
	showErrors?: boolean;
	/** Whether to show warnings */
	showWarnings?: boolean;
	/** CSS class name for styling */
	className?: string;
	/** Optional callback to trigger worker token refresh */
	onWorkerTokenRefresh?: () => Promise<void>;
	/** Optional callback to trigger validation recheck */
	onValidationRecheck?: () => void;
}

/**
 * Step configuration for a flow
 */
export interface StepConfig {
	/** Step ID (0-based) */
	id: number;
	/** Display label */
	label: string;
	/** Detailed description */
	description: string;
	/** Function to validate if step can proceed */
	validate: () => Promise<{ valid: boolean; errors: string[]; warnings: string[] }>;
	/** Optional: Function to execute when entering step */
	onEnter?: () => void;
	/** Optional: Function to execute when leaving step */
	onExit?: () => void;
}

/**
 * Context for step navigation
 */
export interface StepNavigationContext {
	/** Current step state */
	state: StepNavigationState;
	/** Go to specific step */
	goToStep: (stepId: number) => Promise<void>;
	/** Go to next step */
	goToNext: () => Promise<void>;
	/** Go to previous step */
	goToPrevious: () => void;
	/** Mark step as completed */
	markStepComplete: (stepId: number) => void;
	/** Update step validation errors */
	setStepErrors: (stepId: number, errors: string[]) => void;
	/** Update step validation warnings */
	setStepWarnings: (stepId: number, warnings: string[]) => void;
	/** Reset navigation to first step */
	reset: () => void;
}
