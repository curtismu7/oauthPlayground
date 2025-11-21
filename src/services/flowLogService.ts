// src/services/flowLogService.ts
import { FLOW_LOG_STORAGE_PREFIX, PINGONE_AUTH_FLOW_LOG_KEY } from '../constants/resultStorageKeys';
import type { FlowStep } from './resultPageService';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;

const LEGACY_FLOW_LOG_KEYS: Record<string, string[]> = {
	'pingone-authentication': [PINGONE_AUTH_FLOW_LOG_KEY],
};

/**
 * Manages storage and retrieval of flow log entries for result pages.
 */
class FlowLogService {
	private readonly storage: StorageLike;

	/**
	 * Creates a new flow log service that optionally accepts a custom storage implementation.
	 */
	constructor(storage?: StorageLike) {
		this.storage = storage ?? window.localStorage;
	}

	/**
	 * Saves the full log collection for a flow key, overwriting existing entries.
	 */
	public setSteps(flowKey: string, steps: FlowStep[]): void {
		const serialized = JSON.stringify(steps);
		this.storage.setItem(this.createFlowLogKey(flowKey), serialized);
		for (const legacyKey of LEGACY_FLOW_LOG_KEYS[flowKey] ?? []) {
			this.storage.setItem(legacyKey, serialized);
		}
	}

	/**
	 * Appends a new step to the existing flow log.
	 */
	public addStep(flowKey: string, step: FlowStep): void {
		const existing = this.getSteps(flowKey);
		const nextSteps = [...existing, step];
		this.setSteps(flowKey, nextSteps);
	}

	/**
	 * Retrieves all saved steps for a given flow key.
	 */
	public getSteps(flowKey: string): FlowStep[] {
		const keysToTry = [this.createFlowLogKey(flowKey), ...(LEGACY_FLOW_LOG_KEYS[flowKey] ?? [])];
		for (const key of keysToTry) {
			const raw = this.storage.getItem(key);
			if (!raw) {
				continue;
			}
			try {
				return JSON.parse(raw) as FlowStep[];
			} catch {
				return [];
			}
		}
		return [];
	}

	/**
	 * Removes flow log entries for the given flow key, including legacy keys.
	 */
	public clearSteps(flowKey: string): void {
		this.storage.removeItem(this.createFlowLogKey(flowKey));
		for (const legacyKey of LEGACY_FLOW_LOG_KEYS[flowKey] ?? []) {
			this.storage.removeItem(legacyKey);
		}
	}

	/**
	 * Serializes flow log entries to a human-readable JSON string.
	 */
	public exportSteps(flowKey: string): string | null {
		const steps = this.getSteps(flowKey);
		if (steps.length === 0) {
			return null;
		}
		return JSON.stringify(steps, null, 2);
	}

	private createFlowLogKey(flowKey: string): string {
		return `${FLOW_LOG_STORAGE_PREFIX}${flowKey}`;
	}
}

const flowLogService = new FlowLogService();

export default flowLogService;
