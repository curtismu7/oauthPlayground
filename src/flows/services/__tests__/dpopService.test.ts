// src/flows/services/__tests__/dpopService.test.ts
import { describe, expect, it } from 'vitest';
import { dpopService } from '../dpopService';
import type { FlowCredentials } from '../../framework/types';

const creds: FlowCredentials = {
	environmentId: 'test-env-456',
	region: 'com',
	clientId: 'dpop-client',
	clientSecret: 'dpop-secret',
	scope: 'openid',
	authMethod: 'client_secret_post',
};

/** base64url-decode a segment to an object (no padding needed). */
function decodeSegment(segment: string): Record<string, unknown> {
	const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
	const pad = padded.length % 4;
	const decoded = atob(pad ? padded + '='.repeat(4 - pad) : padded);
	return JSON.parse(decoded) as Record<string, unknown>;
}

describe('dpopService — mock path (offline)', () => {
	it('generateKeyPair returns a public JWK with kty EC and a non-empty thumbprint', async () => {
		const result = await dpopService.generateKeyPair('mock');
		expect(result.publicJwk.kty).toBe('EC');
		expect(result.publicJwk.crv).toBe('P-256');
		expect(result.thumbprint).toBeTruthy();
	});

	it('createProof returns a JWT with exactly 3 dot-separated segments', async () => {
		const keyPairResult = await dpopService.generateKeyPair('mock');
		const htu = dpopService._tokenEndpointUrl(creds.environmentId, creds.region);
		const { proof } = await dpopService.createProof({ htm: 'POST', htu }, keyPairResult, 'mock');

		const segments = proof.split('.');
		expect(segments).toHaveLength(3);
	});

	it('decoding the header yields typ dpop+jwt and a jwk object', async () => {
		const keyPairResult = await dpopService.generateKeyPair('mock');
		const htu = dpopService._tokenEndpointUrl(creds.environmentId, creds.region);
		const { proof, header } = await dpopService.createProof({ htm: 'POST', htu }, keyPairResult, 'mock');

		const segments = proof.split('.');
		const decodedHeader = decodeSegment(segments[0]);

		expect(decodedHeader.typ).toBe('dpop+jwt');
		expect(decodedHeader.alg).toBe('ES256');
		expect(typeof decodedHeader.jwk).toBe('object');
		expect(decodedHeader.jwk).not.toBeNull();

		// Return value header matches decoded segment.
		expect(header.typ).toBe('dpop+jwt');
		expect(typeof header.jwk).toBe('object');
	});

	it('decoding the payload yields htm, htu, jti, and iat', async () => {
		const keyPairResult = await dpopService.generateKeyPair('mock');
		const htu = dpopService._tokenEndpointUrl(creds.environmentId, creds.region);
		const { proof, payload } = await dpopService.createProof({ htm: 'POST', htu }, keyPairResult, 'mock');

		const segments = proof.split('.');
		const decodedPayload = decodeSegment(segments[1]);

		expect(decodedPayload.htm).toBe('POST');
		expect(decodedPayload.htu).toBe(htu);
		expect(typeof decodedPayload.jti).toBe('string');
		expect((decodedPayload.jti as string).length).toBeGreaterThan(0);
		expect(typeof decodedPayload.iat).toBe('number');
		expect(decodedPayload.iat as number).toBeGreaterThan(0);

		// Return value payload matches decoded segment.
		expect(payload.htm).toBe('POST');
		expect(payload.htu).toBe(htu);
	});

	it('requestTokenWithDpop returns a DPoP-bound token with cnf.jkt', async () => {
		const keyPairResult = await dpopService.generateKeyPair('mock');
		const htu = dpopService._tokenEndpointUrl(creds.environmentId, creds.region);
		const { proof } = await dpopService.createProof({ htm: 'POST', htu }, keyPairResult, 'mock');

		const result = await dpopService.requestTokenWithDpop(creds, proof, keyPairResult.thumbprint, 'mock');

		expect(result.accessToken).toBeTruthy();
		expect(result.tokenType).toBe('DPoP');
		expect(result.raw._dpop_bound).toBe(true);
		expect((result.raw.cnf as Record<string, unknown>)?.jkt).toBe(keyPairResult.thumbprint);
	});

	it('createProof forwards an optional nonce into the payload', async () => {
		const keyPairResult = await dpopService.generateKeyPair('mock');
		const htu = dpopService._tokenEndpointUrl(creds.environmentId, creds.region);
		const { payload } = await dpopService.createProof({ htm: 'POST', htu, nonce: 'server-nonce-123' }, keyPairResult, 'mock');

		expect(payload.nonce).toBe('server-nonce-123');
	});
});
