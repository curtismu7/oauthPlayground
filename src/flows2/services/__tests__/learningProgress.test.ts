// src/flows2/services/__tests__/learningProgress.test.ts

import { beforeEach, describe, expect, it } from 'vitest';
import {
	completedCount,
	getProgress,
	isStepComplete,
	markStepComplete,
	resetProgress,
	setActivePath,
} from '../learningProgress';

// The shared test setup (tests/setup.ts) stubs localStorage with no-op vi.fn() mocks,
// so writes don't persist. Install a real in-memory Storage for this file so we can
// exercise the actual round-trip behavior of the store.
function installMemoryStorage(): void {
	const map = new Map<string, string>();
	const storage: Storage = {
		get length() {
			return map.size;
		},
		clear: () => map.clear(),
		getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
		key: (i: number) => Array.from(map.keys())[i] ?? null,
		removeItem: (k: string) => {
			map.delete(k);
		},
		setItem: (k: string, v: string) => {
			map.set(k, String(v));
		},
	};
	Object.defineProperty(globalThis, 'localStorage', {
		value: storage,
		configurable: true,
		writable: true,
	});
}

describe('learningProgress store', () => {
	beforeEach(() => {
		installMemoryStorage();
	});

	it('returns empty progress when nothing is stored', () => {
		expect(getProgress()).toEqual({ activePathId: null, completedStepIds: [] });
	});

	it('marks a step complete and sets the active path', () => {
		const next = markStepComplete('oauth-fundamentals', 'fund-client-credentials');
		expect(next.activePathId).toBe('oauth-fundamentals');
		expect(next.completedStepIds).toEqual(['fund-client-credentials']);
		// Persists across reads.
		expect(getProgress()).toEqual(next);
	});

	it('is idempotent — marking the same step twice does not duplicate it', () => {
		markStepComplete('oauth-fundamentals', 'fund-client-credentials');
		markStepComplete('oauth-fundamentals', 'fund-client-credentials');
		expect(getProgress().completedStepIds).toEqual(['fund-client-credentials']);
	});

	it('accumulates multiple completed steps', () => {
		markStepComplete('oauth-fundamentals', 'fund-client-credentials');
		markStepComplete('oauth-fundamentals', 'fund-authorization-code');
		expect(getProgress().completedStepIds).toEqual([
			'fund-client-credentials',
			'fund-authorization-code',
		]);
	});

	it('setActivePath preserves completed steps', () => {
		markStepComplete('oidc', 'oidc-discovery');
		setActivePath('advanced-pingone');
		const p = getProgress();
		expect(p.activePathId).toBe('advanced-pingone');
		expect(p.completedStepIds).toEqual(['oidc-discovery']);
	});

	it('setActivePath(null) clears the active path but keeps progress', () => {
		markStepComplete('oidc', 'oidc-discovery');
		setActivePath(null);
		expect(getProgress()).toEqual({ activePathId: null, completedStepIds: ['oidc-discovery'] });
	});

	it('resetProgress wipes everything', () => {
		markStepComplete('oauth-fundamentals', 'fund-client-credentials');
		resetProgress();
		expect(getProgress()).toEqual({ activePathId: null, completedStepIds: [] });
	});

	it('isStepComplete reflects stored state', () => {
		expect(isStepComplete('fund-refresh-token')).toBe(false);
		markStepComplete('oauth-fundamentals', 'fund-refresh-token');
		expect(isStepComplete('fund-refresh-token')).toBe(true);
	});

	it('completedCount intersects a track’s step ids with completed steps', () => {
		markStepComplete('oauth-fundamentals', 'fund-client-credentials');
		markStepComplete('oauth-fundamentals', 'fund-refresh-token');
		const trackSteps = [
			'fund-client-credentials',
			'fund-authorization-code',
			'fund-refresh-token',
			'fund-token-introspection',
			'fund-token-revocation',
		];
		expect(completedCount(trackSteps)).toBe(2);
	});

	it('tolerates a corrupt stored value by reading as empty', () => {
		localStorage.setItem('flows2:learning-progress', '{not valid json');
		expect(getProgress()).toEqual({ activePathId: null, completedStepIds: [] });
	});

	it('normalizes non-string entries out of completedStepIds', () => {
		localStorage.setItem(
			'flows2:learning-progress',
			JSON.stringify({ activePathId: 'oidc', completedStepIds: ['ok', 42, null, 'ok'] })
		);
		expect(getProgress()).toEqual({ activePathId: 'oidc', completedStepIds: ['ok'] });
	});
});
