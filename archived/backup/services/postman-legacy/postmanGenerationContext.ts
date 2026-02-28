// src/services/postmanGenerationContext.ts

import type { GenerationIssues } from './postmanIssues';

let activeIssues: GenerationIssues | undefined;
let activeContextLabel: string | undefined;

/**
 * Set the active generation context for shared validators.
 */
export const setActiveGenerationContext = (
	issues?: GenerationIssues,
	contextLabel?: string
): void => {
	activeIssues = issues;
	activeContextLabel = contextLabel;
};

/**
 * Get the active issues collector, if any.
 */
export const getActiveIssues = (): GenerationIssues | undefined => {
	return activeIssues;
};

/**
 * Get the active context label, if any.
 */
export const getActiveContextLabel = (): string | undefined => {
	return activeContextLabel;
};
