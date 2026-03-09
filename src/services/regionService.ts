/**
 * regionService.ts
 * Dual-storage PingOne region service: IndexedDB (fast client read) + SQLite via API.
 *
 * Follows the same pattern as customDomainService and environmentIdService.
 * Storage policy: any config that must survive refresh/restore MUST use IndexedDB + SQLite.
 *
 * Priority on read: IndexedDB → API (SQLite) → localStorage fallback → no default.
 * On save: write to API (SQLite) + IndexedDB + localStorage (compat) simultaneously.
 *
 * The region drives the correct PingOne API base URL:
 *   us/na  → https://api.pingone.com
 *   eu     → https://api.pingone.eu
 *   ca     → https://api.pingone.ca
 *   ap     → https://api.pingone.asia
 *   au     → https://api.pingone.com.au
 */

export type PingOneRegion =
	| 'us'
	| 'na'
	| 'com'
	| 'eu'
	| 'ca'
	| 'ap'
	| 'au'
	| 'com.au'
	| 'sg'
	| 'asia';

/** Map every recognised region token to the correct PingOne Management API base URL. */
export const PINGONE_REGION_MAP: Record<string, string> = {
	us: 'https://api.pingone.com',
	na: 'https://api.pingone.com',
	com: 'https://api.pingone.com',
	eu: 'https://api.pingone.eu',
	ca: 'https://api.pingone.ca',
	ap: 'https://api.pingone.asia',
	asia: 'https://api.pingone.asia',
	au: 'https://api.pingone.com.au',
	'com.au': 'https://api.pingone.com.au',
	sg: 'https://api.pingone.sg',
};

/** Map every region token to the correct PingOne Auth base URL. */
export const PINGONE_AUTH_REGION_MAP: Record<string, string> = {
	us: 'https://auth.pingone.com',
	na: 'https://auth.pingone.com',
	com: 'https://auth.pingone.com',
	eu: 'https://auth.pingone.eu',
	ca: 'https://auth.pingone.ca',
	ap: 'https://auth.pingone.asia',
	asia: 'https://auth.pingone.asia',
	au: 'https://auth.pingone.com.au',
	'com.au': 'https://auth.pingone.com.au',
	sg: 'https://auth.pingone.sg',
};

export const VALID_REGIONS: PingOneRegion[] = [
	'us',
	'na',
	'com',
	'eu',
	'ca',
	'ap',
	'au',
	'com.au',
	'sg',
	'asia',
];

export const REGION_LABELS: Record<PingOneRegion, string> = {
	us: 'North America (api.pingone.com)',
	na: 'North America (api.pingone.com)',
	com: 'North America (api.pingone.com)',
	eu: 'Europe (api.pingone.eu)',
	ca: 'Canada (api.pingone.ca)',
	ap: 'Asia-Pacific (api.pingone.asia)',
	asia: 'Asia-Pacific (api.pingone.asia)',
	au: 'Australia (api.pingone.com.au)',
	'com.au': 'Australia (api.pingone.com.au)',
	sg: 'Singapore (api.pingone.sg)',
};

// ─── Storage keys ─────────────────────────────────────────────────────────────
const IDB_NAME = 'oauth_playground_app_config';
const IDB_STORE = 'settings';
const IDB_KEY = 'pingone_region';
const API_KEY = 'region';
const LS_KEY = 'pingone_region';

function isValidRegion(r: unknown): r is PingOneRegion {
	return typeof r === 'string' && VALID_REGIONS.includes(r.toLowerCase().trim() as PingOneRegion);
}

// ─── In-memory sync cache ──────────────────────────────────────────────────────
let _cachedRegion: PingOneRegion | null = null;

/** Sync getter — returns cached region if initRegionCache() has been called, otherwise null. */
export function getCachedRegion(): PingOneRegion | null {
	return _cachedRegion;
}

/**
 * Call once at startup (e.g. main.tsx) to warm the sync cache so synchronous
 * callers can use getCachedRegion() immediately.
 */
export async function initRegionCache(): Promise<PingOneRegion | null> {
	const region = await loadRegion();
	_cachedRegion = region;
	return region;
}

// ─── IndexedDB helpers ────────────────────────────────────────────────────────
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

export async function getRegionFromIndexedDB(): Promise<PingOneRegion | null> {
	if (typeof indexedDB === 'undefined') return null;
	try {
		const db = await openDB();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(IDB_STORE, 'readonly');
			const store = tx.objectStore(IDB_STORE);
			const req = store.get(IDB_KEY);
			req.onsuccess = () => {
				const row = req.result as { key: string; value: string } | undefined;
				const val = row?.value?.toLowerCase().trim();
				resolve(isValidRegion(val) ? (val as PingOneRegion) : null);
			};
			req.onerror = () => reject(req.error);
			tx.oncomplete = () => db.close();
		});
	} catch {
		return null;
	}
}

async function setRegionInIndexedDB(region: PingOneRegion): Promise<void> {
	if (typeof indexedDB === 'undefined') return;
	try {
		const db = await openDB();
		await new Promise<void>((resolve, reject) => {
			const tx = db.transaction(IDB_STORE, 'readwrite');
			tx.objectStore(IDB_STORE).put({ key: IDB_KEY, value: region });
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
async function getRegionFromApi(): Promise<PingOneRegion | null> {
	try {
		const res = await fetch(`/api/settings/${API_KEY}`);
		if (!res.ok) return null;
		const data = (await res.json()) as { value?: string };
		const val = data.value?.toLowerCase().trim();
		return isValidRegion(val) ? (val as PingOneRegion) : null;
	} catch {
		return null;
	}
}

async function setRegionInApi(region: PingOneRegion): Promise<void> {
	try {
		await fetch(`/api/settings/${API_KEY}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ value: region }),
		});
	} catch {
		// best-effort — IndexedDB + localStorage provide local fallback
	}
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Load the stored PingOne region from all sources in priority order.
 * Returns null if no region has been saved yet (caller must require the user to set it).
 */
export async function loadRegion(): Promise<PingOneRegion | null> {
	// 1. IndexedDB (fastest, no network)
	const fromIdb = await getRegionFromIndexedDB();
	if (fromIdb) {
		_cachedRegion = fromIdb;
		return fromIdb;
	}

	// 2. API / SQLite
	const fromApi = await getRegionFromApi();
	if (fromApi) {
		await setRegionInIndexedDB(fromApi); // backfill IDB
		_cachedRegion = fromApi;
		return fromApi;
	}

	// 3. localStorage fallback
	const ls = localStorage.getItem(LS_KEY);
	if (isValidRegion(ls)) {
		const r = ls!.toLowerCase().trim() as PingOneRegion;
		_cachedRegion = r;
		return r;
	}

	return null;
}

/**
 * Save the PingOne region to all stores simultaneously and update the sync cache.
 * Dispatches 'pingOneRegionUpdated' window event so reactive hooks update.
 */
export async function saveRegion(region: PingOneRegion): Promise<void> {
	if (!isValidRegion(region)) return;
	const r = region.toLowerCase().trim() as PingOneRegion;

	await Promise.allSettled([setRegionInApi(r), setRegionInIndexedDB(r)]);

	try {
		localStorage.setItem(LS_KEY, r);
		_cachedRegion = r;
		window.dispatchEvent(new CustomEvent('pingOneRegionUpdated', { detail: r }));
	} catch {
		// ignore
	}
}

/**
 * Return the PingOne Management API base URL for the stored region.
 * Falls back to the cached region, then to whatever was stored in localStorage.
 * Returns null when no region is configured — never returns a hardcoded default.
 */
export function getPingOneApiBaseUrl(): string | null {
	const r = _cachedRegion ?? (localStorage.getItem(LS_KEY) as PingOneRegion | null);
	if (!r) return null;
	return PINGONE_REGION_MAP[r.toLowerCase()] ?? null;
}

/**
 * Return the PingOne Auth base URL for the stored region.
 * Returns null when no region is configured.
 */
export function getPingOneAuthBaseUrl(): string | null {
	const r = _cachedRegion ?? (localStorage.getItem(LS_KEY) as PingOneRegion | null);
	if (!r) return null;
	return PINGONE_AUTH_REGION_MAP[r.toLowerCase()] ?? null;
}

/**
 * Get the default region (North America - us/com)
 */
export function getDefaultRegion(): PingOneRegion {
	return 'us';
}

/**
 * Get the current region for API calls (with fallback to default)
 * This is the main function that should be used throughout the app
 */
export async function getCurrentRegion(): Promise<PingOneRegion> {
	const region = await loadRegion();
	return region || getDefaultRegion();
}

/**
 * Get the current region synchronously (with fallback to default)
 * Use this when you need the region immediately and can't wait for async
 */
export function getCurrentRegionSync(): PingOneRegion {
	return _cachedRegion || getDefaultRegion();
}
