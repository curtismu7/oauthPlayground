// src/flows2/framework/useFlowCredentials.ts
//
// Persist and restore a flow's Configure-step credentials to the central LMDB
// store via the BFF (POST /api/tokens/store, GET /api/tokens/query).
//
// Usage with CredentialsForm (FlowCredentials object):
//   const { save, saving, saved } = useFlowCredentials('flows2:authorization-code', creds, setCreds);
//   <CredentialsForm ... onSave={save} saving={saving} saved={saved} />
//
// Usage with individual state vars (userInfo, samlBearer):
//   const { save, saving, saved, load } = useFlowCredentials('flows2:userinfo');
//   useEffect(() => { load().then(d => { if (d) { setEnvId(d.environmentId ?? ''); ... } }); }, [load]);

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FlowCredentials } from './types';

export interface UseFlowCredentialsReturn {
	/** Persist the given data to LMDB under this flow's key. */
	save: (data?: Record<string, unknown>) => Promise<void>;
	/** Fetch previously saved data from LMDB. Returns null if nothing saved yet. */
	load: () => Promise<Record<string, unknown> | null>;
	saving: boolean;
	/** True for 2 s after a successful save, then resets. */
	saved: boolean;
}

/**
 * @param flowKey  Unique key for this flow, e.g. 'flows2:authorization-code'
 * @param creds    Optional: current creds state — if provided alongside setCreds,
 *                 auto-loads saved credentials into state on mount (only when
 *                 creds.environmentId is empty so real env vars are not overwritten).
 * @param setCreds Optional: state setter for auto-load to call with saved credentials.
 */
export function useFlowCredentials(
	flowKey: string,
	creds?: FlowCredentials,
	setCreds?: React.Dispatch<React.SetStateAction<FlowCredentials>>
): UseFlowCredentialsReturn {
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	// Stable ref for setCreds — avoids stale closure in the mount effect.
	const setCredsRef = useRef(setCreds);
	setCredsRef.current = setCreds;
	const credsRef = useRef(creds);
	credsRef.current = creds;

	const load = useCallback(async (): Promise<Record<string, unknown> | null> => {
		try {
			const res = await fetch(
				`/api/tokens/query?flowKey=${encodeURIComponent(flowKey)}`
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

	// Auto-load saved credentials on mount. Only fills in if environmentId is empty
	// (no real env var was set), so configured environments are not overwritten.
	// `load` is stable (useCallback over fixed flowKey) so this runs exactly once.
	useEffect(() => {
		const setter = setCredsRef.current;
		if (!setter) return;
		load().then((data) => {
			if (!data) return;
			const cur = credsRef.current;
			// Respect real env vars — only restore when the field is empty.
			if (cur?.environmentId) return;
			setter((prev) => ({
				...prev,
				...(data as Partial<FlowCredentials>),
			}));
		});
	}, [load]);

	const save = useCallback(
		async (data?: Record<string, unknown>) => {
			const payload = data ?? (credsRef.current as Record<string, unknown> | undefined);
			if (!payload) return;
			setSaving(true);
			setSaved(false);
			try {
				await fetch('/api/tokens/store', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ flowKey, data: payload }),
				});
				setSaved(true);
				setTimeout(() => setSaved(false), 2000);
			} catch {
				// Silently swallow — playground, not critical
			} finally {
				setSaving(false);
			}
		},
		[flowKey]
	);

	return { save, load, saving, saved };
}
