// src/services/resultPageService.ts
import { PINGONE_AUTH_RESULT_KEY, RESULT_STORAGE_PREFIX } from '../constants/resultStorageKeys';

export type FlowResultStatus = 'success' | 'error';

export interface FlowStep {
	step: number | string;
	title?: string;
	method?: string;
	url?: string;
	params?: Record<string, unknown>;
	requestBody?: Record<string, unknown>;
	requestHeaders?: Record<string, string>;
	response?: Record<string, unknown>;
	responseHeaders?: Record<string, string>;
	status?: number;
	duration?: number;
	timestamp: number;
	note?: string;
}

export interface FlowResult {
	flowType: string;
	flowName: string;
	timestamp: number;
	status: FlowResultStatus;
	config: Record<string, unknown>;
	tokens?: Record<string, unknown>;
	steps?: FlowStep[];
	metadata?: Record<string, unknown>;
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;

const LEGACY_RESULT_KEYS: Record<string, string[]> = {
	'pingone-authentication': [PINGONE_AUTH_RESULT_KEY],
};

/**
 * Provides helpers for persisting and retrieving flow result payloads.
 * The service normalizes storage keys and maintains compatibility with legacy keys.
 */
class ResultPageService {
	private readonly storage: StorageLike;

	/**
	 * Creates a new result page service instance.
	 * Accepting an optional storage object allows easier testing.
	 */
	constructor(storage?: StorageLike) {
		this.storage = storage ?? window.localStorage;
	}

	/**
	 * Stores a flow result using the canonical storage key.
	 * Legacy keys are also updated to maintain backwards compatibility.
	 */
	public storeResult(flowKey: string, result: FlowResult): void {
		const serialized = JSON.stringify(result);
		this.storage.setItem(this.createResultKey(flowKey), serialized);
		for (const legacyKey of LEGACY_RESULT_KEYS[flowKey] ?? []) {
			this.storage.setItem(legacyKey, serialized);
		}
	}

	/**
	 * Loads a flow result, checking both the new key and any legacy keys.
	 */
	public getResult(flowKey: string): FlowResult | null {
		const keysToTry = [this.createResultKey(flowKey), ...(LEGACY_RESULT_KEYS[flowKey] ?? [])];
		for (const key of keysToTry) {
			const item = this.storage.getItem(key);
			if (item) {
				try {
					return JSON.parse(item) as FlowResult;
				} catch {
					return null;
				}
			}
		}
		return null;
	}

	/**
	 * Removes stored results for the provided flow key, including legacy entries.
	 */
	public clearResult(flowKey: string): void {
		this.storage.removeItem(this.createResultKey(flowKey));
		for (const legacyKey of LEGACY_RESULT_KEYS[flowKey] ?? []) {
			this.storage.removeItem(legacyKey);
		}
	}

	/**
	 * Returns all stored results that use the standardized prefix.
	 */
	public getAllResults(): Record<string, FlowResult> {
		const results: Record<string, FlowResult> = {};
		for (let index = 0; index < this.storage.length; index += 1) {
			const key = this.storage.key(index);
			if (!key || !key.startsWith(RESULT_STORAGE_PREFIX)) {
				continue;
			}
			const flowKey = key.replace(RESULT_STORAGE_PREFIX, '');
			const raw = this.storage.getItem(key);
			if (!raw) {
				continue;
			}
			try {
				results[flowKey] = JSON.parse(raw) as FlowResult;
			} catch {
				// Ignore malformed entries.
			}
		}
		return results;
	}

	/**
	 * Serializes a flow result to a JSON string suitable for downloads.
	 */
	public exportResult(flowKey: string): string | null {
		const result = this.getResult(flowKey);
		if (!result) {
			return null;
		}
		return JSON.stringify(result, null, 2);
	}

	private createResultKey(flowKey: string): string {
		return `${RESULT_STORAGE_PREFIX}${flowKey}`;
	}
}

const resultPageService = new ResultPageService();

export default resultPageService;
