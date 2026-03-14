/**
 * environmentIdService.ts
 * Dual-storage environment ID service: IndexedDB (fast client read) + SQLite via API.
 *
 * Standalone AI Assistant copy — keeps environmentId in sync when worker credentials are saved.
 * Uses same storage keys as main app for cross-app consistency.
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
		// non-critical
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
		// best-effort
	}
}

/**
 * Save environment ID to all stores (API/SQLite, IndexedDB, localStorage).
 * Called when worker token credentials are saved so other pages pick it up.
 */
export async function saveEnvironmentId(id: string): Promise<void> {
	if (!isValidEnvId(id)) return;
	const trimmed = id.trim();

	await Promise.allSettled([setEnvIdInApi(trimmed), setEnvIdInIndexedDB(trimmed)]);

	try {
		localStorage.setItem(LS_KEY, trimmed);
		window.dispatchEvent(new Event('environmentIdUpdated'));
	} catch {
		// ignore
	}
}
