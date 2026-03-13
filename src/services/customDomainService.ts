/**
 * Custom domain service: persist app URL in IndexedDB and SQLite (via API).
 * Dashboard reads/writes here; app uses getAppUrl() for display and redirect after save.
 *
 * Domain resolution order:
 *   1. In-memory cache (set by initDomainCache / saveCustomDomain)
 *   2. IndexedDB
 *   3. Backend API (SQLite)
 *   4. VITE_APP_DOMAIN env variable
 *   5. Built-in default (api.pingdemo.com, matches run.sh)
 */

const STORAGE_KEY = 'custom_domain';
const DEFAULT_DOMAIN = 'api.pingdemo.com';
const IDB_NAME = 'oauth_playground_app_config';
const IDB_STORE = 'settings';
const API_GET = '/api/settings/custom-domain';
const API_POST = '/api/settings/custom-domain';

// ─── In-memory sync cache ───────────────────────────────────────────────────
// Set once by initDomainCache() at startup, and kept current by saveCustomDomain().
let _cachedDomain: string | null = null;

/** Sync getter — returns the cached domain (null if initDomainCache not yet called). */
export function getCachedDomain(): string | null {
	return _cachedDomain;
}

/**
 * Load the effective domain from storage (IndexedDB → API → env → default) and
 * cache it so that synchronous callers like getBaseUrl() can use it immediately.
 * Call once during app startup (main.tsx) before rendering.
 */
export async function initDomainCache(): Promise<string> {
	const domain = await getCustomDomain();
	_cachedDomain = domain;
	return domain;
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

/** Get domain from IndexedDB (sync-style via promise). */
export async function getDomainFromIndexedDB(): Promise<string | null> {
	if (typeof indexedDB === 'undefined') return null;
	try {
		const db = await openDB();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(IDB_STORE, 'readonly');
			const store = tx.objectStore(IDB_STORE);
			const req = store.get(STORAGE_KEY);
			req.onsuccess = () => {
				const row = req.result;
				resolve(row && typeof row.value === 'string' ? row.value : null);
			};
			req.onerror = () => reject(req.error);
			tx.oncomplete = () => db.close();
		});
	} catch {
		return null;
	}
}

/** Save domain to IndexedDB. */
export async function setDomainInIndexedDB(domain: string): Promise<void> {
	if (typeof indexedDB === 'undefined') return;
	try {
		const db = await openDB();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(IDB_STORE, 'readwrite');
			const store = tx.objectStore(IDB_STORE);
			store.put({ key: STORAGE_KEY, value: domain });
			tx.oncomplete = () => {
				db.close();
				resolve();
			};
			tx.onerror = () => reject(tx.error);
		});
	} catch {
		// ignore
	}
}

/** Fetch domain from backend (SQLite). Returns default when backend is unavailable (e.g. 404). */
export async function getDomainFromApi(): Promise<string> {
	try {
		const res = await fetch(API_GET);
		if (!res.ok) return DEFAULT_DOMAIN;
		const data = (await res.json()) as { domain?: string };
		return data.domain && typeof data.domain === 'string' ? data.domain : DEFAULT_DOMAIN;
	} catch {
		return DEFAULT_DOMAIN;
	}
}

/** Save domain to backend (SQLite) and return saved domain. */
export async function setDomainInApi(domain: string): Promise<string> {
	const normalized = normalizeDomain(domain);
	const res = await fetch(API_POST, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ domain: normalized }),
	});
	if (!res.ok) {
		if (res.status === 404) {
			throw new Error(
				'Backend not available. Start the backend server (e.g. ./run.sh) to save the custom domain.'
			);
		}
		let errMsg: string;
		try {
			const err = (await res.json()) as { error?: string };
			errMsg = err.error || `Failed to save: ${res.status}`;
		} catch {
			errMsg = `Failed to save: ${res.status} ${res.statusText}`;
		}
		throw new Error(errMsg);
	}
	const data = (await res.json()) as { domain?: string };
	return data.domain && typeof data.domain === 'string' ? data.domain : normalized;
}

function normalizeDomain(domain: string): string {
	return (
		domain
			.trim()
			.toLowerCase()
			.replace(/^https?:\/\//, '')
			.replace(/\/.*$/, '')
			.split(':')[0] || DEFAULT_DOMAIN
	);
}

/** Get the effective custom domain: IndexedDB → API → VITE_APP_DOMAIN → VITE_PUBLIC_APP_URL → default. Keeps sync cache warm. */
export async function getCustomDomain(): Promise<string> {
	const fromIdb = await getDomainFromIndexedDB();
	if (fromIdb) {
		_cachedDomain = fromIdb;
		return fromIdb;
	}
	const fromApi = await getDomainFromApi();
	if (fromApi && fromApi !== DEFAULT_DOMAIN) {
		await setDomainInIndexedDB(fromApi);
		_cachedDomain = fromApi;
		return fromApi;
	}
	// Check VITE_APP_DOMAIN (set in .env.local to canonical public domain, e.g. https://api.pingone.com)
	const appDomainEnv = (import.meta.env.VITE_APP_DOMAIN as string | undefined)?.trim();
	if (appDomainEnv) {
		const stripped = appDomainEnv
			.replace(/^https?:\/\//i, '')
			.split('/')[0]
			.split(':')[0]
			.trim();
		if (stripped) {
			_cachedDomain = stripped;
			return stripped;
		}
	}
	// Legacy env fallback
	const legacyEnv = (import.meta.env.VITE_PUBLIC_APP_URL as string) || '';
	const fromLegacyEnv = legacyEnv
		.replace(/^https?:\/\//i, '')
		.split('/')[0]
		.split(':')[0]
		.trim();
	if (fromLegacyEnv) {
		_cachedDomain = fromLegacyEnv;
		return fromLegacyEnv;
	}
	_cachedDomain = DEFAULT_DOMAIN;
	return DEFAULT_DOMAIN;
}

/** Full app URL (HTTPS) for the given domain; uses port 3000 for frontend. */
export function getAppUrlForDomain(domain: string): string {
	const host = domain
		.replace(/^https?:\/\//, '')
		.split('/')[0]
		.split(':')[0];
	return `https://${host}:3000`;
}

/** Get app URL (HTTPS) using stored/effective domain. */
export async function getAppUrl(): Promise<string> {
	const domain = await getCustomDomain();
	return getAppUrlForDomain(domain);
}

/**
 * Save custom domain to SQLite (API), IndexedDB, and the in-memory cache;
 * then return the new app URL. Caller can redirect to that URL.
 */
export async function saveCustomDomain(domain: string): Promise<string> {
	const normalized = normalizeDomain(domain);
	await setDomainInApi(normalized);
	await setDomainInIndexedDB(normalized);
	_cachedDomain = normalized; // keep sync cache current
	return getAppUrlForDomain(normalized);
}
