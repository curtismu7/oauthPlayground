// src/hooks/useAutoEnvironmentId.ts
// Single hook that reads the environment ID from all known storage sources,
// in priority order, and stays reactive to updates.
//
// Storage priority (per prompt-all.md dual-storage policy):
//   1. IndexedDB (client-side, fast, via environmentIdService)
//   2. localStorage canonical key (v8:global_environment_id)
//   3. unified worker token credentials (localStorage)
//   4. shared environment (localStorage)
//   5. persistence service (localStorage)
//   6. legacy worker_credentials key
//
// On save: writes to IndexedDB + SQLite (via /api/settings) + localStorage.

import { useCallback, useEffect, useState } from 'react';
import { loadEnvironmentId, saveEnvironmentId } from '../services/environmentIdService';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Read environmentId synchronously from localStorage only (for use in useState initializer). */
export function readBestEnvironmentId(): string {
	// 1. Canonical global store (EnvironmentIdServiceV8 / environmentIdService)
	const v8Global = localStorage.getItem('v8:global_environment_id');
	if (v8Global && UUID_RE.test(v8Global.trim())) return v8Global.trim();

	// 2. Unified worker token
	try {
		const raw = localStorage.getItem('unified_worker_token');
		if (raw) {
			const parsed = JSON.parse(raw) as { credentials?: { environmentId?: string } };
			const id = parsed?.credentials?.environmentId;
			if (id && UUID_RE.test(id.trim())) return id.trim();
		}
	} catch {}

	// 3. Shared environment (comprehensiveFlowDataService)
	try {
		const raw = localStorage.getItem('pingone_shared_environment');
		if (raw) {
			const parsed = JSON.parse(raw) as { environmentId?: string };
			const id = parsed?.environmentId;
			if (id && UUID_RE.test(id.trim())) return id.trim();
		}
	} catch {}

	// 4. Persistence service
	try {
		const raw = localStorage.getItem('pingone_environment_id_persistence');
		if (raw) {
			const parsed = JSON.parse(raw) as { environmentId?: string };
			const id = parsed?.environmentId;
			if (id && UUID_RE.test(id.trim())) return id.trim();
		}
	} catch {}

	// 5. Legacy worker credentials
	try {
		const raw = localStorage.getItem('worker_credentials');
		if (raw) {
			const parsed = JSON.parse(raw) as { environmentId?: string };
			const id = parsed?.environmentId;
			if (id && UUID_RE.test(id.trim())) return id.trim();
		}
	} catch {}

	return '';
}

/**
 * Returns the best available environment ID from all storage sources.
 * Stays reactive: re-reads when any relevant storage event fires.
 *
 * On mount: hydrates synchronously from localStorage, then async from
 * IndexedDB/API (dual-storage per prompt-all.md).
 *
 * @param saveOnChange - When true, calling setEnvironmentId() also writes
 *   to IndexedDB + SQLite + localStorage so other pages benefit.
 */
export function useAutoEnvironmentId(saveOnChange = true) {
	const [environmentId, setEnvironmentIdState] = useState<string>(readBestEnvironmentId);

	/** Refresh state from localStorage (sync, fast) */
	const refresh = useCallback(() => {
		setEnvironmentIdState(readBestEnvironmentId());
	}, []);

	// On mount: load from IndexedDB/API in case localStorage is stale or empty
	useEffect(() => {
		loadEnvironmentId().then((id) => {
			if (id && id !== readBestEnvironmentId()) {
				setEnvironmentIdState(id);
			}
		});
	}, []);

	useEffect(() => {
		// React to explicit saves from any page
		window.addEventListener('environmentIdUpdated', refresh);
		// React to storage changes from other tabs
		window.addEventListener('storage', refresh);
		return () => {
			window.removeEventListener('environmentIdUpdated', refresh);
			window.removeEventListener('storage', refresh);
		};
	}, [refresh]);

	/** Save to all stores (IndexedDB + SQLite + localStorage) and propagate */
	const setEnvironmentId = useCallback(
		(id: string) => {
			setEnvironmentIdState(id);
			if (saveOnChange && id.trim()) {
				// Async dual-storage write — fire and forget, UI is already updated
				saveEnvironmentId(id.trim()).catch(() => {});
			}
		},
		[saveOnChange]
	);

	return { environmentId, setEnvironmentId, refresh };
}

export default useAutoEnvironmentId;
