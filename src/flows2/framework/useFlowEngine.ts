// src/flows2/framework/useFlowEngine.ts
//
// Step navigation + completion state for a multi-step flow. Replaces the hand-rolled
// `currentStep` + switch statement that every old V9 flow reimplemented (~1000 LOC each).

import { useCallback, useMemo, useState } from 'react';
import type { StepDefinition } from './types';

export interface FlowEngine {
	steps: StepDefinition[];
	index: number;
	current: StepDefinition;
	isFirst: boolean;
	isLast: boolean;
	completed: ReadonlySet<string>;
	goNext: () => void;
	goPrev: () => void;
	goTo: (i: number) => void;
	reset: () => void;
	markComplete: (id: string) => void;
}

export function useFlowEngine(steps: StepDefinition[]): FlowEngine {
	const [index, setIndex] = useState(0);
	const [completed, setCompleted] = useState<Set<string>>(new Set());

	const goTo = useCallback(
		(i: number) => setIndex(Math.max(0, Math.min(steps.length - 1, i))),
		[steps]
	);
	const goNext = useCallback(() => setIndex((i) => Math.min(steps.length - 1, i + 1)), [steps]);
	const goPrev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
	const reset = useCallback(() => {
		setIndex(0);
		setCompleted(new Set());
	}, []);
	const markComplete = useCallback((id: string) => {
		setCompleted((prev) => {
			const next = new Set(prev);
			next.add(id);
			return next;
		});
	}, []);

	return useMemo(
		() => ({
			steps,
			index,
			current: index >= 0 && index < steps.length ? steps[index] : steps[0],
			isFirst: index === 0,
			isLast: index === steps.length - 1,
			completed,
			goNext,
			goPrev,
			goTo,
			reset,
			markComplete,
		}),
		[steps, index, completed, goNext, goPrev, goTo, reset, markComplete]
	);
}
