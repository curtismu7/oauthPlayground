import { describe, expect, it } from 'vitest';
import {
	useCaseThemes,
	useCases,
	getUseCase,
	useCasesByTheme,
} from '../useCases';

const VALID_FLOW_ROUTES = new Set([
	'/v2/flows/authorization-code',
	'/v2/flows/client-credentials',
	'/v2/flows/device-authorization',
	'/v2/flows/token-exchange',
	'/v2/flows/token-introspection',
	'/v2/flows/token-revocation',
	'/v2/flows/refresh-token',
	'/v2/flows/dpop',
	'/v2/flows/par',
	'/v2/flows/ropc',
	'/v2/flows/implicit-hybrid',
	'/v2/flows/hybrid',
	'/v2/flows/redirectless',
	'/v2/flows/oidc-discovery',
	'/v2/flows/userinfo',
	'/v2/flows/saml-bearer',
]);

describe('useCases catalog', () => {
	it('has exactly 7 themes with unique ids and orders 1..7', () => {
		expect(useCaseThemes).toHaveLength(7);
		const ids = new Set(useCaseThemes.map((t) => t.id));
		expect(ids.size).toBe(7);
		const orders = useCaseThemes.map((t) => t.order).sort((a, b) => a - b);
		expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7]);
	});

	it('has unique use-case ids', () => {
		const ids = useCases.map((u) => u.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('every use case references a real theme', () => {
		const themeIds = new Set(useCaseThemes.map((t) => t.id));
		for (const u of useCases) {
			expect(themeIds.has(u.themeId)).toBe(true);
		}
	});

	it('every use case points at a real flow route', () => {
		for (const u of useCases) {
			expect(VALID_FLOW_ROUTES.has(u.flowRoute)).toBe(true);
		}
	});

	it('every use case has a non-empty scenario and at least one lesson', () => {
		for (const u of useCases) {
			expect(u.scenario.trim().length).toBeGreaterThan(0);
			expect(u.lessons.length).toBeGreaterThan(0);
		}
	});

	it('every theme has at least one use case', () => {
		for (const t of useCaseThemes) {
			expect(useCasesByTheme(t.id).length).toBeGreaterThan(0);
		}
	});

	it('getUseCase returns the matching use case or undefined', () => {
		expect(getUseCase('spa-login')?.title).toBeTruthy();
		expect(getUseCase('does-not-exist')).toBeUndefined();
	});

	it('covers all 16 distinct flow routes', () => {
		const covered = new Set(useCases.map((u) => u.flowRoute));
		expect(covered.size).toBe(16);
	});
});
