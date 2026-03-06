// src/services/v9/V9CredentialStorageService.ts
// V9 credential storage — 4-layer persistence for all V9 flows.
//
// Layers (in priority order):
//   1. Memory cache   (fastest, session only)
//   2. localStorage   (survives page refresh)
//   3. IndexedDB      (survives browser restart)
//   4. SQLite backup  (server-side, survives device change — requires environmentId)
//
// Usage in any V9 flow:
//   const creds = await V9CredentialStorageService.load('my-flow-v9');
//   await V9CredentialStorageService.save('my-flow-v9', { clientId, environmentId, ... });
//   await V9CredentialStorageService.clear('my-flow-v9');
//
// Migration rule: Replace every direct localStorage.getItem / V9FlowCredentialService
// call with this service. See A-Migration/migrate_vscode.md § Mandatory Credential Storage.

import {
	type UnifiedOAuthCredentials,
	UnifiedOAuthCredentialsServiceV8U,
} from '../../v8u/services/unifiedOAuthCredentialsServiceV8U';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Serializable menu group structure for sidebar persistence
 */
export interface SerializableMenuGroup {
	id: string;
	label: string;
	isOpen: boolean;
	items: Array<{ id: string; path: string; label: string }>;
	subGroups?: Array<SerializableMenuGroup>;
}

/**
 * Canonical credential shape shared by all V9 flows.
 * All fields are optional — flows only fill what they need.
 */
export interface V9FlowCredentials {
	// Identity
	environmentId?: string;
	clientId?: string;
	clientSecret?: string;

	// OAuth endpoints
	redirectUri?: string;
	tokenEndpoint?: string;
	authorizationEndpoint?: string;
	issuer?: string;
	baseUrl?: string;

	// Request parameters
	scope?: string;
	audience?: string;

	// Tokens (transient — saved for display/copy, not re-used as auth)
	accessToken?: string;
	refreshToken?: string;
	idToken?: string;

	// UI Configuration (for sidebar menu and other UI state)
	version?: string;
	menuOrder?: SerializableMenuGroup[]; // Serialized menu groups for sidebar
	uiState?: Record<string, unknown>; // Generic UI state storage

	// Flow metadata
	flowType?: string;
	specVersion?: string;
}

export interface V9SaveOptions {
	/** Required to enable SQLite backup tier */
	environmentId?: string;
	/** Enable server-side SQLite backup (default: true when environmentId provided) */
	enableBackup?: boolean;
}

// ─── Memory cache (module-level, survives component re-mounts) ────────────────

const _memoryCache = new Map<string, V9FlowCredentials>();

// ─── Key helpers ──────────────────────────────────────────────────────────────

const FLOW_KEY_PREFIX = 'v9:';

function toStorageKey(flowKey: string): string {
	return flowKey.startsWith(FLOW_KEY_PREFIX) ? flowKey : `${FLOW_KEY_PREFIX}${flowKey}`;
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * V9 credential storage — 4-layer persistence wrapper.
 *
 * All V9 flows MUST use this service for credential read/write.
 * Do NOT call localStorage directly or use V9FlowCredentialService (localStorage-only).
 */
export const V9CredentialStorageService = {
	/**
	 * Load credentials for a flow.
	 * Checks memory → localStorage → IndexedDB → SQLite in order.
	 *
	 * @param flowKey - Unique key for this flow, e.g. 'token-exchange-v9'
	 * @param options - Optional environmentId to enable SQLite fallback
	 */
	async load(flowKey: string, options?: V9SaveOptions): Promise<V9FlowCredentials> {
		const key = toStorageKey(flowKey);

		// 1. Memory cache
		if (_memoryCache.has(key)) {
			return _memoryCache.get(key) as V9FlowCredentials;
		}

		try {
			// 2–4. localStorage → IndexedDB → SQLite (handled by UnifiedOAuthCredentialsServiceV8U)
			const stored = await UnifiedOAuthCredentialsServiceV8U.loadCredentials(key, {
				enableBackup: options?.enableBackup ?? !!options?.environmentId,
				...(options?.environmentId ? { environmentId: options.environmentId } : {}),
			});

			if (stored) {
				const creds = stored as V9FlowCredentials;
				_memoryCache.set(key, creds);
				return creds;
			}
		} catch {
			// Storage unavailable — return empty, never crash.
		}

		return {};
	},

	/**
	 * Save credentials for a flow.
	 * Writes to memory + localStorage immediately; IndexedDB + SQLite async.
	 *
	 * @param flowKey - Unique key for this flow
	 * @param credentials - Partial credentials to store (merged with existing by caller if needed)
	 * @param options - Optional environmentId to enable SQLite backup
	 */
	async save(
		flowKey: string,
		credentials: V9FlowCredentials,
		options?: V9SaveOptions
	): Promise<void> {
		const key = toStorageKey(flowKey);

		// 1. Memory cache (synchronous)
		_memoryCache.set(key, credentials);

		try {
			// 2–4. localStorage + IndexedDB + SQLite
			await UnifiedOAuthCredentialsServiceV8U.saveCredentials(
				key,
				credentials as UnifiedOAuthCredentials,
				{
					enableBackup: options?.enableBackup ?? !!options?.environmentId,
					...(options?.environmentId ? { environmentId: options.environmentId } : {}),
				}
			);
		} catch {
			// Failed to persist to durable storage — already in memory cache, not fatal.
		}
	},

	/**
	 * Clear credentials for a flow from all layers.
	 */
	async clear(flowKey: string): Promise<void> {
		const key = toStorageKey(flowKey);
		_memoryCache.delete(key);

		try {
			await UnifiedOAuthCredentialsServiceV8U.deleteCredentials(key);
		} catch {
			// Best-effort clear
		}
	},

	/**
	 * Synchronous load from localStorage only (no IndexedDB/SQLite).
	 * Use only when async is not possible (e.g. initial render, non-async context).
	 * Prefer load() in all other cases.
	 */
	loadSync(flowKey: string): V9FlowCredentials {
		const key = toStorageKey(flowKey);

		if (_memoryCache.has(key)) {
			return _memoryCache.get(key) as V9FlowCredentials;
		}

		try {
			const raw = localStorage.getItem(`unified_oauth_${key}`);
			if (raw) {
				const creds = JSON.parse(raw) as V9FlowCredentials;
				_memoryCache.set(key, creds);
				return creds;
			}
		} catch {
			// ignore
		}

		return {};
	},
} as const;

export default V9CredentialStorageService;
