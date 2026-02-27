/**
 * environmentIdService.ts
 * Dual-storage environment ID service: IndexedDB (fast client read) + SQLite via API.
 *
 * Follows the same pattern as customDomainService per prompt-all.md storage policy.
 * Storage policy: any config that must survive refresh/restore MUST use IndexedDB + SQLite.
 *
 * Priority on read: IndexedDB → API (SQLite) → localStorage fallback.
 * On save: write to API (SQLite) + IndexedDB + localStorage (compat) simultaneously.
 */

const IDB_NAME = 'oauth_playground_app_config';
const IDB_STORE = 'settings';
const IDB_KEY = 'environment_id';
const API_KEY = 'environment-id';
const LS_KEY = 'v8:global_environment_id';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidEnvId(id: unknown): id is string {
	return typeof id === 'string' && UUID_RE.test(id.trim());
}

// ─── IndexedDB helpers ───────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(IDB_NAME, 1);
		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);
		request.onupgradeneeded = (e) => {
			const db = (e.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains(IDB_STORE)) {
				db.createObjectStore(IDB_STORE, { keyPath: 'key' });
			}
		};
	});
}

export async function getEnvIdFromIndexedDB(): Promise<string | null> {
	if (typeof indexedDB === 'undefined') return null;
	try {
		const db = await openDB();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(IDB_STORE, 'readonly');
			const store = tx.objectStore(IDB_STORE);
			const req = store.get(IDB_KEY);
			req.onsuccess = () => {
				const row = req.result as { key: string; value: string } | undefined;
				resolve(row && isValidEnvId(row.value) ? row.value : null);
			};
			req.onerror = () => reject(req.error);
			tx.oncomplete = () => db.close();
		});
	} catch {
		return null;
	}
}

async function setEnvIdInIndexedDB(id: string): Promise<void> {
	if (typeof indexedDB === 'undefined') return;
	try {
		const db = await openDB();
		await new Promise<void>((resolve, reject) => {
			const tx = db.transaction(IDB_STORE, 'readwrite');
			tx.objectStore(IDB_STORE).put({ key: IDB_KEY, value: id });
			tx.oncomplete = () => {
				db.close();
				resolve();
			};
			tx.onerror = () => reject(tx.error);
		});
	} catch {
		// non-critical — localStorage is the fallback
	}
}

// ─── API (SQLite) helpers ─────────────────────────────────────────────────────

async function getEnvIdFromApi(): Promise<string | null> {
	try {
		const res = await fetch(`/api/settings/${API_KEY}`);
		if (!res.ok) return null;
		const data = (await res.json()) as { value?: string };
		return isValidEnvId(data.value) ? data.value.trim() : null;
	} catch {
		return null;
	}
}

async function setEnvIdInApi(id: string): Promise<void> {
	try {
		await fetch(`/api/settings/${API_KEY}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ value: id }),
		});
	} catch {
		// best-effort — IndexedDB + localStorage provide local fallback
	}
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Load environment ID from all sources in priority order.
 * IndexedDB first (fast, local), then API/SQLite (backend), then localStorage fallback.
 *
 * Also backfills IndexedDB from API if IDB was empty.
 */
export async function loadEnvironmentId(): Promise<string | null> {
	// 1. IndexedDB (fastest, no network)
	const fromIdb = await getEnvIdFromIndexedDB();
	if (fromIdb) return fromIdb;

	// 2. API / SQLite
	const fromApi = await getEnvIdFromApi();
	if (fromApi) {
		// Backfill IndexedDB for next load
		await setEnvIdInIndexedDB(fromApi);
		return fromApi;
	}

	// 3. localStorage fallback (compat with EnvironmentIdServiceV8 and other legacy keys)
	const ls = localStorage.getItem(LS_KEY);
	if (isValidEnvId(ls)) return ls!.trim();

	return null;
}

/**
 * Save environment ID to all stores simultaneously:
 *   SQLite (API) + IndexedDB + localStorage (compat).
 *
 * Dispatches 'environmentIdUpdated' window event so reactive hooks update.
 */
export async function saveEnvironmentId(id: string): Promise<void> {
	if (!isValidEnvId(id)) return;
	const trimmed = id.trim();

	// Write to all stores concurrently (best-effort for API)
	await Promise.allSettled([setEnvIdInApi(trimmed), setEnvIdInIndexedDB(trimmed)]);

	// localStorage compat — EnvironmentIdServiceV8 reads from here
	try {
		localStorage.setItem(LS_KEY, trimmed);
		window.dispatchEvent(new Event('environmentIdUpdated'));
	} catch {
		// ignore
	}
}
