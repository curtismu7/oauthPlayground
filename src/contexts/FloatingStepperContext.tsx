/**
 * @file FloatingStepperContext.tsx
 * @module contexts
 * @description Global FloatingStepper context — lets any page register its steps
 *   and show the floating stepper widget without adding the component per-page.
 *
 * Usage in a page:
 *   const { registerSteps, setCurrentStep, completeStep } = usePageStepper();
 *
 *   useEffect(() => {
 *     registerSteps([
 *       { id: 'setup',    title: 'Setup',       description: 'Configure credentials' },
 *       { id: 'fetch',    title: 'Fetch Data',  description: 'Load licensing info' },
 *       { id: 'done',     title: 'Done',        description: 'Review results' },
 *     ]);
 *   }, [registerSteps]);
 *
 * @version 1.0.0
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
	FloatingStepper,
	FloatingStepperService,
	type FloatingStepperStep,
} from '../services/FloatingStepperService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PageStepperControls {
	/** Register (or replace) the step list for the current page. */
	registerSteps: (steps: FloatingStepperStep[]) => void;
	/** Jump to a specific step by index. */
	setCurrentStep: (index: number) => void;
	/** Mark a step completed (by index). */
	completeStep: (index: number) => void;
	/** Advance one step forward. */
	nextStep: () => void;
	/** Go one step back. */
	prevStep: () => void;
	/** Reset to step 0, clear all completions. */
	resetSteps: () => void;
	/** Hide the stepper (clear all steps). */
	clearSteps: () => void;
	/** Current step index. */
	currentStep: number;
}

interface FloatingStepperContextValue extends PageStepperControls {
	steps: FloatingStepperStep[];
}

const FloatingStepperContext = createContext<FloatingStepperContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const FloatingStepperProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [steps, setSteps] = useState<FloatingStepperStep[]>([]);
	const [currentStep, setCurrentStepState] = useState(0);
	const location = useLocation();
	const prevPath = useRef(location.pathname);

	// Auto-clear on route change (each page re-registers its own steps)
	useEffect(() => {
		if (location.pathname !== prevPath.current) {
			prevPath.current = location.pathname;
			setSteps([]);
			setCurrentStepState(0);
		}
	}, [location.pathname]);

	const registerSteps = useCallback((newSteps: FloatingStepperStep[]) => {
		setSteps(
			newSteps.map((s, i) => ({
				...s,
				completed: s.completed ?? false,
				current: s.current ?? false,
			}))
		);
		setCurrentStepState(0);
	}, []);

	const setCurrentStep = useCallback((index: number) => {
		setCurrentStepState(index);
		setSteps((prev) =>
			prev.map((s, i) => ({
				...s,
				current: i === index,
				completed: i < index ? true : s.completed,
			}))
		);
	}, []);

	const completeStep = useCallback((index: number) => {
		setSteps((prev) =>
			prev.map((s, i) => (i === index ? { ...s, completed: true } : s))
		);
	}, []);

	const nextStep = useCallback(() => {
		setCurrentStepState((prev) => {
			const next = Math.min(prev + 1, steps.length - 1);
			setSteps((s) =>
				s.map((step, i) => ({
					...step,
					current: i === next,
					completed: i < next ? true : step.completed,
				}))
			);
			return next;
		});
	}, [steps.length]);

	const prevStep = useCallback(() => {
		setCurrentStepState((prev) => {
			const p = Math.max(prev - 1, 0);
			setSteps((s) =>
				s.map((step, i) => ({
					...step,
					current: i === p,
				}))
			);
			return p;
		});
	}, []);

	const resetSteps = useCallback(() => {
		setCurrentStepState(0);
		setSteps((prev) =>
			prev.map((s, i) => ({ ...s, completed: false, current: i === 0 }))
		);
	}, []);

	const clearSteps = useCallback(() => {
		setSteps([]);
		setCurrentStepState(0);
	}, []);

	const value: FloatingStepperContextValue = {
		steps,
		currentStep,
		registerSteps,
		setCurrentStep,
		completeStep,
		nextStep,
		prevStep,
		resetSteps,
		clearSteps,
	};

	return (
		<FloatingStepperContext.Provider value={value}>
			{children}
			{steps.length > 0 && (
				<FloatingStepper
					{...FloatingStepperService.getDefaultPosition
						? { position: FloatingStepperService.getDefaultPosition() }
						: { position: { x: 20, y: window.innerHeight - 180 } }}
					steps={steps}
					currentStep={currentStep}
					onStepChange={setCurrentStep}
					onPrevious={prevStep}
					onNext={nextStep}
					onReset={resetSteps}
					onComplete={() => {
						completeStep(currentStep);
					}}
					draggable={true}
					showStepIndicator={true}
				/>
			)}
		</FloatingStepperContext.Provider>
	);
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * usePageStepper — call this in any page to register steps into the global
 * floating stepper widget.
 */
export function usePageStepper(): PageStepperControls {
	const ctx = useContext(FloatingStepperContext);
	if (!ctx) {
		throw new Error('usePageStepper must be used inside FloatingStepperProvider');
	}
	const {
		registerSteps,
		setCurrentStep,
		completeStep,
		nextStep,
		prevStep,
		resetSteps,
		clearSteps,
		currentStep,
	} = ctx;
	return {
		registerSteps,
		setCurrentStep,
		completeStep,
		nextStep,
		prevStep,
		resetSteps,
		clearSteps,
		currentStep,
	};
}
