// src/flows2/framework/useFlowStorage.ts
//
// Persist full flow execution state (tokens, errors, results, step progress)
// to LMDB so learners can refresh the page without losing their work.
//
// Usage:
//   const { saveState, restoreState } = useFlowStorage('flows2:authorization-code');
//   useEffect(() => { restoreState().then(state => { if (state) applyState(state); }); }, []);
//   // After each state change:
//   useEffect(() => {
//     saveState({ code, result, error, pkce, authUrl, ... });
//   }, [code, result, error, pkce, authUrl]);

import { useCallback } from 'react';

export interface UseFlowStorageReturn {
	/** Save the current flow state to LMDB. Called after state changes. */
	saveState: (state: Record<string, unknown>) => Promise<void>;
	/** Restore previously saved flow state from LMDB. Called on mount. */
	restoreState: () => Promise<Record<string, unknown> | null>;
}

/**
 * Persist full flow execution state (tokens, results, errors, step progress)
 * to LMDB via the BFF. Auto-restores on next page load.
 *
 * @param flowKey Unique key for this flow, e.g. 'flows2:authorization-code'
 * @returns { saveState, restoreState } functions
 */
export function useFlowStorage(flowKey: string): UseFlowStorageReturn {
	const saveState = useCallback(
		async (state: Record<string, unknown>) => {
			try {
				await fetch('/api/tokens/store', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						flowKey: `${flowKey}:state`,
						data: state,
					}),
				});
			} catch {
				// Silent fail — storage is nice-to-have, not critical
			}
		},
		[flowKey]
	);

	const restoreState = useCallback(async (): Promise<Record<string, unknown> | null> => {
		try {
			const res = await fetch(
				`/api/tokens/query?flowKey=${encodeURIComponent(`${flowKey}:state`)}`
			);
			if (!res.ok) return null;
			const body = (await res.json()) as {
				tokens?: { credentials?: Record<string, unknown> }[];
			};
			return body.tokens?.[0]?.credentials ?? null;
		} catch {
			return null;
		}
	}, [flowKey]);

	return { saveState, restoreState };
}
