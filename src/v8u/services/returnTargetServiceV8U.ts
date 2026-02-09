/**
 * @file returnTargetServiceV8U.ts
 * @module v8u/services
 * @description Flow-aware return target management for V8U unified flows
 * @version 8.0.0
 * @since 2026-02-06
 *
 * This service manages structured return targets stored in sessionStorage,
 * separating redirect URI (IdP callback endpoint) from in-app return target
 * (what screen/step to resume after callback).
 */

const MODULE_TAG = '[🎯 RETURN-TARGET-SERVICE-V8U]';

export type ReturnTargetKind =
	| 'mfa_device_registration'
	| 'mfa_device_authentication'
	| 'oauth_v8u';

export interface ReturnTarget {
	/** The flow kind */
	kind: ReturnTargetKind;
	/** Absolute in-app path (may include query params) */
	path: string;
	/** Explicit numeric step (for traceability) */
	step: number;
	/** Creation timestamp (epoch ms) - useful for debugging */
	createdAt: number;
}

/** Session storage keys - separate per flow kind */
const STORAGE_KEYS = {
	mfa_device_registration: 'v8u_return_target_device_registration',
	mfa_device_authentication: 'v8u_return_target_device_authentication',
	oauth_v8u: 'v8u_return_target_oauth',
} as const satisfies Record<ReturnTargetKind, string>;

/**
 * Return Target Service
 *
 * Manages flow-aware return targets with structured storage and single-consumption semantics.
 */
export class ReturnTargetServiceV8U {
	/**
	 * Set a return target for a specific flow kind
	 *
	 * @param kind - The flow kind
	 * @param path - Absolute in-app path (may include query params)
	 * @param step - Explicit numeric step (for traceability)
	 */
	static setReturnTarget(kind: ReturnTargetKind, path: string, step: number): void {
		const target: ReturnTarget = {
			kind,
			path,
			step,
			createdAt: Date.now(),
		};

		const key = STORAGE_KEYS[kind];
		sessionStorage.setItem(key, JSON.stringify(target));

		console.log(`${MODULE_TAG} Set return target for ${kind}:`, {
			path,
			step,
			key,
		});
	}

	/**
	 * Peek at a return target without consuming it
	 *
	 * @param kind - The flow kind
	 * @returns The return target if it exists, null otherwise
	 */
	static peekReturnTarget(kind: ReturnTargetKind): ReturnTarget | null {
		const key = STORAGE_KEYS[kind];
		const stored = sessionStorage.getItem(key);

		if (!stored) {
			return null;
		}

		try {
			const target = JSON.parse(stored) as ReturnTarget;

			// Validate the structure
			if (!target.kind || !target.path || typeof target.step !== 'number') {
				console.warn(`${MODULE_TAG} Invalid return target structure for ${kind}:`, target);
				return null;
			}

			return target;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to parse return target for ${kind}:`, error);
			return null;
		}
	}

	/**
	 * Consume a return target (returns and clears it)
	 *
	 * @param kind - The flow kind
	 * @returns The return target if it exists, null otherwise
	 */
	static consumeReturnTarget(kind: ReturnTargetKind): ReturnTarget | null {
		const target = ReturnTargetServiceV8U.peekReturnTarget(kind);

		if (target) {
			const key = STORAGE_KEYS[kind];
			sessionStorage.removeItem(key);

			console.log(`${MODULE_TAG} Consumed return target for ${kind}:`, {
				path: target.path,
				step: target.step,
				age: Date.now() - target.createdAt,
			});
		}

		return target;
	}

	/**
	 * Clear all return targets (useful for cleanup)
	 */
	static clearAllReturnTargets(): void {
		Object.values(STORAGE_KEYS).forEach((key) => {
			sessionStorage.removeItem(key);
		});

		console.log(`${MODULE_TAG} Cleared all return targets`);
	}

	/**
	 * Get all existing return targets (for debugging)
	 *
	 * @returns Record of flow kind to return target (or null)
	 */
	static getAllReturnTargets(): Record<ReturnTargetKind, ReturnTarget | null> {
		const result = {} as Record<ReturnTargetKind, ReturnTarget | null>;

		Object.keys(STORAGE_KEYS).forEach((kind) => {
			const flowKind = kind as ReturnTargetKind;
			result[flowKind] = ReturnTargetServiceV8U.peekReturnTarget(flowKind);
		});

		return result;
	}

	/**
	 * Check if any return target exists (for debugging)
	 *
	 * @returns True if at least one return target exists
	 */
	static hasAnyReturnTarget(): boolean {
		return Object.values(STORAGE_KEYS).some((key) => sessionStorage.getItem(key) !== null);
	}
}
