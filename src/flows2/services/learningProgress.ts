// src/flows2/services/learningProgress.ts
//
// Local progress store for Learning Paths. One namespaced localStorage key, one module —
// components never touch localStorage directly (see docs/STORAGE_CANONICAL.md). No backend
// and no accounts: progress is per-browser, consistent with the app's local-educational
// threat model. Every function is defensive — a corrupt or absent value reads as empty
// progress, never throws.

const STORAGE_KEY = 'flows2:learning-progress';

export interface Progress {
	/** The track the learner is currently following, or null when free-roaming. */
	activePathId: string | null;
	/** PathStep ids the learner has completed (order-insensitive). */
	completedStepIds: string[];
}

const EMPTY: Progress = { activePathId: null, completedStepIds: [] };

function safeStorage(): Storage | null {
	try {
		if (typeof localStorage === 'undefined') return null;
		return localStorage;
	} catch {
		// Access to localStorage can throw in sandboxed/blocked contexts.
		return null;
	}
}

function normalize(raw: unknown): Progress {
	if (!raw || typeof raw !== 'object') return { ...EMPTY };
	const obj = raw as Record<string, unknown>;
	const activePathId = typeof obj.activePathId === 'string' ? obj.activePathId : null;
	const completedStepIds = Array.isArray(obj.completedStepIds)
		? obj.completedStepIds.filter((id): id is string => typeof id === 'string')
		: [];
	// De-dupe defensively.
	return { activePathId, completedStepIds: Array.from(new Set(completedStepIds)) };
}

export function getProgress(): Progress {
	const store = safeStorage();
	if (!store) return { ...EMPTY };
	try {
		const raw = store.getItem(STORAGE_KEY);
		if (!raw) return { ...EMPTY };
		return normalize(JSON.parse(raw));
	} catch {
		return { ...EMPTY };
	}
}

function write(progress: Progress): void {
	const store = safeStorage();
	if (!store) return;
	try {
		store.setItem(STORAGE_KEY, JSON.stringify(progress));
	} catch {
		// Quota or blocked storage — progress is best-effort, so swallow.
	}
}

/** Mark a step complete (idempotent) and set it as the active path in one write. */
export function markStepComplete(pathId: string, stepId: string): Progress {
	const current = getProgress();
	const completedStepIds = current.completedStepIds.includes(stepId)
		? current.completedStepIds
		: [...current.completedStepIds, stepId];
	const next: Progress = { activePathId: pathId, completedStepIds };
	write(next);
	return next;
}

export function setActivePath(pathId: string | null): Progress {
	const next: Progress = { ...getProgress(), activePathId: pathId };
	write(next);
	return next;
}

export function resetProgress(): Progress {
	write({ ...EMPTY });
	return { ...EMPTY };
}

/** Convenience: is a given step completed? */
export function isStepComplete(stepId: string): boolean {
	return getProgress().completedStepIds.includes(stepId);
}

/** Count of a track's steps that are complete, given the track's step ids. */
export function completedCount(stepIds: string[]): number {
	const done = new Set(getProgress().completedStepIds);
	return stepIds.reduce((n, id) => (done.has(id) ? n + 1 : n), 0);
}
