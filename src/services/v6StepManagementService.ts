// src/services/v6StepManagementService.ts
/**
 * V6 Step Management Service
 * 
 * Provides standardized step management utilities
 * - Step validation logic
 * - Step navigation helpers
 * - Step state management
 * - Requirements tracking
 * - Collapsible section state
 */

import { useCallback, useState, useMemo } from 'react';

export interface StepMetadata {
	id?: string;
	title: string;
	subtitle: string;
	description?: string;
}

export interface StepValidationResult {
	isValid: boolean;
	requirements: string[];
	missingRequirements?: string[];
}

export interface CollapsibleSectionState {
	[key: string]: boolean;
}

export class V6StepManagementService {
	/**
	 * Create step validation function
	 */
	static createStepValidator<T>(
		validationRules: Record<number, (data: T) => StepValidationResult>
	): (stepIndex: number, data: T) => StepValidationResult {
		return (stepIndex: number, data: T) => {
			const validator = validationRules[stepIndex];
			if (!validator) {
				return {
					isValid: false,
					requirements: [],
					missingRequirements: ['No validation rules defined for this step'],
				};
			}
			return validator(data);
		};
	}

	/**
	 * Create step requirements getter
	 */
	static createRequirementsGetter(
		requirementsMap: Record<number, string[]>
	): (stepIndex: number) => string[] {
		return (stepIndex: number) => {
			return requirementsMap[stepIndex] || [];
		};
	}

	/**
	 * Restore step from session storage
	 */
	static restoreStep(storageKey: string = 'restore_step'): number {
		const restoreStep = sessionStorage.getItem(storageKey);
		if (restoreStep) {
			const step = parseInt(restoreStep, 10);
			sessionStorage.removeItem(storageKey);
			return step;
		}
		return 0;
	}

	/**
	 * Save step to session storage
	 */
	static saveStep(step: number, storageKey: string = 'restore_step'): void {
		sessionStorage.setItem(storageKey, step.toString());
	}

	/**
	 * Create collapsible section toggle function
	 */
	static createSectionToggle(
		setState: React.Dispatch<React.SetStateAction<CollapsibleSectionState>>
	): (key: string) => void {
		return (key: string) => {
			setState((prev) => ({
				...prev,
				[key]: !prev[key],
			}));
		};
	}

	/**
	 * Create default collapsible state
	 */
	static createDefaultCollapsibleState(
		sections: string[],
		defaultState: boolean = false
	): CollapsibleSectionState {
		return sections.reduce((acc, section) => {
			acc[section] = defaultState;
			return acc;
		}, {} as CollapsibleSectionState);
	}

	/**
	 * Validate all steps up to current
	 */
	static validateAllSteps<T>(
		currentStep: number,
		data: T,
		validator: (stepIndex: number, data: T) => StepValidationResult
	): boolean {
		for (let i = 0; i < currentStep; i++) {
			const result = validator(i, data);
			if (!result.isValid) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Get next incomplete step
	 */
	static getNextIncompleteStep<T>(
		data: T,
		validator: (stepIndex: number, data: T) => StepValidationResult,
		totalSteps: number
	): number {
		for (let i = 0; i < totalSteps; i++) {
			const result = validator(i, data);
			if (!result.isValid) {
				return i;
			}
		}
		return 0;
	}

	/**
	 * Calculate completion percentage
	 */
	static calculateCompletionPercentage<T>(
		data: T,
		validator: (stepIndex: number, data: T) => StepValidationResult,
		totalSteps: number
	): number {
		let completedSteps = 0;
		for (let i = 0; i < totalSteps; i++) {
			const result = validator(i, data);
			if (result.isValid) {
				completedSteps++;
			}
		}
		return Math.round((completedSteps / totalSteps) * 100);
	}
}

/**
 * Hook for step management
 */
export function useV6StepManagement<T>(config: {
	totalSteps: number;
	validator: (stepIndex: number, data: T) => StepValidationResult;
	requirementsGetter: (stepIndex: number) => string[];
	restoreKey?: string;
}) {
	const { totalSteps, validator, requirementsGetter, restoreKey = 'restore_step' } = config;

	// Initialize current step (with restoration)
	const [currentStep, setCurrentStep] = useState(() =>
		V6StepManagementService.restoreStep(restoreKey)
	);

	// Navigation functions
	const goToNext = useCallback(() => {
		setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
	}, [totalSteps]);

	const goToPrevious = useCallback(() => {
		setCurrentStep((prev) => Math.max(prev - 1, 0));
	}, []);

	const goToStep = useCallback(
		(step: number) => {
			if (step >= 0 && step < totalSteps) {
				setCurrentStep(step);
				V6StepManagementService.saveStep(step, restoreKey);
			}
		},
		[totalSteps, restoreKey]
	);

	// Validation helpers
	const isStepValid = useCallback(
		(stepIndex: number, data: T) => {
			return validator(stepIndex, data).isValid;
		},
		[validator]
	);

	const getStepRequirements = useCallback(
		(stepIndex: number) => {
			return requirementsGetter(stepIndex);
		},
		[requirementsGetter]
	);

	const getMissingRequirements = useCallback(
		(stepIndex: number, data: T) => {
			const result = validator(stepIndex, data);
			return result.missingRequirements || [];
		},
		[validator]
	);

	return {
		currentStep,
		setCurrentStep,
		goToNext,
		goToPrevious,
		goToStep,
		isStepValid,
		getStepRequirements,
		getMissingRequirements,
	};
}

/**
 * Simple hook for collapsible sections management
 * Used by V6 components that only need collapsible section state
 */
export function useV6CollapsibleSections(initialState: CollapsibleSectionState = {}) {
	const [collapsedSections, setCollapsedSections] = useState<CollapsibleSectionState>(initialState);

	const toggleSection = useCallback((sectionKey: string) => {
		setCollapsedSections(prev => ({
			...prev,
			[sectionKey]: !prev[sectionKey]
		}));
	}, []);

	const collapseSection = useCallback((sectionKey: string) => {
		setCollapsedSections(prev => ({
			...prev,
			[sectionKey]: true
		}));
	}, []);

	const expandSection = useCallback((sectionKey: string) => {
		setCollapsedSections(prev => ({
			...prev,
			[sectionKey]: false
		}));
	}, []);

	return {
		collapsedSections,
		toggleSection,
		collapseSection,
		expandSection,
		setCollapsedSections
	};
}

export default V6StepManagementService;


