// src/flows2/services/__tests__/oidcDiscoveryService.test.ts
import { describe, expect, it } from 'vitest';
import { oidcDiscoveryService } from '../oidcDiscoveryService';
import type { FlowCredentials } from '../../framework/types';

const creds: FlowCredentials = {
	environmentId: 'test-env-456',
	region: 'com',
	clientId: '',
};

describe('oidcDiscoveryService — mock path (offline)', () => {
	it('discover() returns a document with issuer, authorization_endpoint, token_endpoint, and jwks_uri', async () => {
		const doc = await oidcDiscoveryService.discover(creds, 'mock');
		expect(typeof doc.issuer).toBe('string');
		expect((doc.issuer as string).length).toBeGreaterThan(0);
		expect(typeof doc.authorization_endpoint).toBe('string');
		expect(typeof doc.token_endpoint).toBe('string');
		expect(typeof doc.jwks_uri).toBe('string');
	});

	it('discover() issuer contains the environment id', async () => {
		const doc = await oidcDiscoveryService.discover(creds, 'mock');
		expect(doc.issuer as string).toContain('test-env-456');
	});

	it('fetchJwks() returns keys array with at least one entry', async () => {
		const result = await oidcDiscoveryService.fetchJwks(creds, 'mock');
		expect(Array.isArray(result.keys)).toBe(true);
		expect(result.keys.length).toBeGreaterThanOrEqual(1);
	});

	it('each key has kid and kty', async () => {
		const result = await oidcDiscoveryService.fetchJwks(creds, 'mock');
		for (const key of result.keys) {
			expect(typeof key.kid).toBe('string');
			expect(key.kid.length).toBeGreaterThan(0);
			expect(typeof key.kty).toBe('string');
			expect(key.kty.length).toBeGreaterThan(0);
		}
	});
});
