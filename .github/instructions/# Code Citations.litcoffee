# Code Citations

## License: GPL-3.0
https://github.com/jeffpar/pcjs.v1/blob/52b8cc49176a90335acdbb3ddd6b632754c2b410/pubs/pc/reference/microsoft/mspl13/basic/qbtools/README.md

```
Now I have enough context. The server uses Node's built-in `crypto` module (already imported via `import { randomUUID, randomBytes, createHash } from 'node:crypto'`) — no `jsonwebtoken` needed. I'll use the Web Crypto API approach with Node's `crypto.subtle` since the server is ESM.

Here are all four complete code blocks ready to apply:

---

## 1. `server.js` — Add before `app.listen` (line ~24580)

Find this comment block near the end of `server.js` (just before the `startServer` function or `app.listen`) and insert:

```javascript
// ─── WIMSE — Workload Identity Demo Routes ────────────────────────────────────
// Ephemeral keypair generated per server start — demo only, no persistence needed
import { generateKeyPairSync, createSign, createVerify } from 'node:crypto';

const _wimseKeyPair = generateKeyPairSync('ec', {
	namedCurve: 'P-256',
	publicKeyEncoding: { type: 'spki', format: 'der' },
	privateKeyEncoding: { type: 'pkcs8', format: 'der' },
});

// Build a minimal JWK from the public key for display purposes
function _wimsePublicJwk() {
	const pubKey = crypto.createPublicKey({ key: _wimseKeyPair.publicKey, format: 'der', type: 'spki' });
	const raw = pubKey.export({ format: 'jwk' });
	return { ...raw, use: 'sig', alg: 'ES256', kid: 'wimse-demo-key-1' };
}

function _wimseBase64url(buf) {
	return Buffer.from(buf).toString('base64url');
}

function _wimseSignJwt(header, payload) {
	const h = _wimseBase64url(JSON.stringify(header));
	const p = _wimseBase64url(JSON.stringify(payload));
	const signing = `${h}.${p}`;
	const privKey = crypto.createPrivateKey({ key: _wimseKeyPair.privateKey, format: 'der', type: 'pkcs8' });
	const sign = createSign('SHA256');
	sign.update(signing);
	sign.end();
	// DER → raw R||S for ES256
	const derSig = sign.sign(privKey);
	const r = derSig.slice(4, 4 + derSig[3]);
	const s = derSig.slice(4 + derSig[3] + 2);
	const rPad = Buffer.concat([Buffer.alloc(Math.max(0, 32 - r.length)), r.slice(Math.max(0, r.length - 32))]);
	const sPad = Buffer.concat([Buffer.alloc(Math.max(0, 32 - s.length)), s.slice(Math.max(0, s.length - 32))]);
	const sig = _wimseBase64url(Buffer.concat([rPad, sPad]));
	return `${signing}.${sig}`;
}

// POST /api/wimse/issue-wit — issue a Workload Identity Token
app.post('/api/wimse/issue-wit', (req, res) => {
	try {
		const {
			workloadId = 'spiffe://demo.local/payments-processor',
			audience = 'https://api.example.com/inventory',
			platform = 'generic',
			ttlSeconds = 300,
		} = req.body || {};

		const now = Math.floor(Date.now() / 1000);
		const header = { alg: 'ES256', typ: 'JWT', kid: 'wimse-demo-key-1' };
		const payload = {
			iss: 'https://wimse-demo.local/issuer',
			sub: workloadId,
			aud: audience,
			iat: now,
			exp: now + ttlSeconds,
			jti: randomUUID(),
			// WIMSE-specific claims (draft-ietf-wimse-workload-identity-token)
			wid: workloadId,
			platform,
			platform_attestation: {
				type: platform,
				verified: true,
				timestamp: new Date().toISOString(),
			},
		};

		const wit = _wimseSignJwt(header, payload);
		res.json({ success: true, wit, header, payload, publicJwk: _wimsePublicJwk() });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
});

// POST /api/wimse/token-exchange — RFC 8693 token exchange using WIT
app.post('/api/wimse/token-exchange', (req, res) => {
	try {
		const {
			subject_token,
			subject_token_type = 'urn:ietf:params:oauth:token-type:jwt',
			requested_token_type = 'urn:ietf:params:oauth:token-type:access_token',
			audience,
			scope = 'read',
		} = req.body || {};

		if (!subject_token) {
			return res.status(400).json({ error: 'invalid_request', error_description: 'subject_token is required' });
		}
		if (subject_token_type !== 'urn:ietf:params:oauth:token-type:jwt') {
			return res.status(400).json({ error: 'invalid_request', error_description: 'subject_token_type must be urn:ietf:params:oauth:token-type:jwt' });
		}

		// Decode and verify the WIT (signature + expiry)
		const parts = subject_token.split('.');
		if (parts.length !== 3) {
			return res.status(400).json({ error: 'invalid_token', error_description: 'Malformed JWT' });
		}

		let witPayload;
		try {
			witPayload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
		} catch {
			return res.status(400).json({ error: 'invalid_token', error_description: 'Cannot decode WIT payload' });
		}

		// Verify expiry
		const now = Math.floor(Date.now() / 1000);
		if (witPayload.exp && witPayload.exp < now) {
			return res.status(400).json({ error: 'invalid_token', error_description: 'WIT has expired' });
		}

		// Verify signature using local public key
		const signing = `${parts[0]}.${parts[1]}`;
		const pubKey = crypto.createPublicKey({ key: _wimseKeyPair.publicKey, format: 'der', type: 'spki' });
		// Convert raw R||S sig back to DER for Node verify
		const rawSig = Buffer.from(parts[2], 'base64url');
		const r = rawSig.slice(0, 32);
		const s = rawSig.slice(32);
		const rTrim = r[0] & 0x80 ? Buffer.concat([Buffer.from([0x00]), r]) : r;
		const sTrim = s[0] & 0x80 ? Buffer.concat([Buffer.from([0x00]), s]) : s;
		const derSig = Buffer.concat([
			Buffer.from([0x30, rTrim.length + sTrim.length + 4, 0x02, rTrim.length]),
			rTrim,
			Buffer.from([0x02, sTrim.length]),
			sTrim,
		]);
		const verify = createVerify('SHA256');
		verify.update(signing);
		verify.end();
		const sigValid = verify.verify(pubKey, derSig);
		if (!sigValid) {
			return res.status(400).json({ error: 'invalid_token', error_description: 'WIT signature verification failed' });
		}

		// Issue scoped access token
		const targetAud = audience || witPayload.aud;
		const atHeader = { alg: 'ES256', typ: 'at+JWT', kid: 'wimse-demo-key-1' };
		const atPayload = {
			iss: 'https://wimse-demo.local/issuer',
			sub: witPayload.sub,
			aud: targetAud,
			iat: now,
			exp: now + 3600,
			jti: randomUUID(),
			scope,
			// Records the exchange lineage
			act: { sub: witPayload.sub },
			client_id: 'wimse-demo-exchange',
		};
		const accessToken = _wimseSignJwt(atHeader, atPayload);

		res.json({
			access_token: accessToken,
			issued_token_type: requested_token_type,
			token_type: 'Bearer',
			expires_in: 3600,
			scope,
			atPayload,
		});
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
});
// ─── End WIMSE Routes ─────────────────────────────────────────────────────────
```

> **Note:** `createSign`/`createVerify` are not in the existing import — add them to the existing `import { randomUUID, randomBytes, createHash } from 'node:crypto'` line → `import { randomUUID, randomBytes, createHash, createSign, createVerify, generateKeyPairSync } from 'node:crypto'`. Also add `import crypto from 'node:crypto'` if not already present (for `crypto.createPublicKey`/`createPrivateKey`). Check the existing import — the file uses named imports from `node:crypto`, so add `createPublicKey, createPrivateKey` to that same import.

---

## 2. New file: `src/pages/flows/v9/WIMSEFlow.tsx`

```tsx
// src/pages/flows/v9/WIMSEFlow.tsx
// WIMSE — Workload Identity in Multi-System Environments demo
// draft-ietf-wimse-arch + draft-ietf-wimse-workload-identity-token + RFC 8693

import type React from 'react';
import { useCallback, useState } from 'react';
import styled from 'styled-components';

// ─── Types ───────────────────────────────────────────────────────────────────

interface WitResult {
	wit: string;
	header: Record<string, unknown>;
	payload: Record<string, unknown>;
	publicJwk: Record<string, unknown>;
}

interface ExchangeResult {
	access_token: string;
	token_type: string;
	expires_in: number;
	scope: string;
	issued_token_type: string;
	atPayload: Record<string, unknown>;
}

type Step = 0 | 1 | 2 | 3;

const PLATFORMS = ['generic', 'aws', 'gcp', 'azure', 'kubernetes'] as const;
type Platform = (typeof PLATFORMS)[number];

const PLATFORM_LABELS: Record<Platform, string> = {
	generic: 'Generic (SPIFFE)',
	aws: 'AWS (EC2 Instance Identity)',
	gcp: 'GCP (Workload Identity)',
	azure: 'Azure (Managed Identity)',
	kubernetes: 'Kubernetes (ServiceAccount)',
};

// ─── Styled components ────────────────────────────────────────────────────────

const Page = styled.div`
	max-width: 860px;
	margin: 0 auto;
	padding: 2rem 1
```


## License: GPL-3.0
https://github.com/jeffpar/pcjs.v1/blob/52b8cc49176a90335acdbb3ddd6b632754c2b410/pubs/pc/reference/microsoft/mspl13/basic/qbtools/README.md

```
Now I have enough context. The server uses Node's built-in `crypto` module (already imported via `import { randomUUID, randomBytes, createHash } from 'node:crypto'`) — no `jsonwebtoken` needed. I'll use the Web Crypto API approach with Node's `crypto.subtle` since the server is ESM.

Here are all four complete code blocks ready to apply:

---

## 1. `server.js` — Add before `app.listen` (line ~24580)

Find this comment block near the end of `server.js` (just before the `startServer` function or `app.listen`) and insert:

```javascript
// ─── WIMSE — Workload Identity Demo Routes ────────────────────────────────────
// Ephemeral keypair generated per server start — demo only, no persistence needed
import { generateKeyPairSync, createSign, createVerify } from 'node:crypto';

const _wimseKeyPair = generateKeyPairSync('ec', {
	namedCurve: 'P-256',
	publicKeyEncoding: { type: 'spki', format: 'der' },
	privateKeyEncoding: { type: 'pkcs8', format: 'der' },
});

// Build a minimal JWK from the public key for display purposes
function _wimsePublicJwk() {
	const pubKey = crypto.createPublicKey({ key: _wimseKeyPair.publicKey, format: 'der', type: 'spki' });
	const raw = pubKey.export({ format: 'jwk' });
	return { ...raw, use: 'sig', alg: 'ES256', kid: 'wimse-demo-key-1' };
}

function _wimseBase64url(buf) {
	return Buffer.from(buf).toString('base64url');
}

function _wimseSignJwt(header, payload) {
	const h = _wimseBase64url(JSON.stringify(header));
	const p = _wimseBase64url(JSON.stringify(payload));
	const signing = `${h}.${p}`;
	const privKey = crypto.createPrivateKey({ key: _wimseKeyPair.privateKey, format: 'der', type: 'pkcs8' });
	const sign = createSign('SHA256');
	sign.update(signing);
	sign.end();
	// DER → raw R||S for ES256
	const derSig = sign.sign(privKey);
	const r = derSig.slice(4, 4 + derSig[3]);
	const s = derSig.slice(4 + derSig[3] + 2);
	const rPad = Buffer.concat([Buffer.alloc(Math.max(0, 32 - r.length)), r.slice(Math.max(0, r.length - 32))]);
	const sPad = Buffer.concat([Buffer.alloc(Math.max(0, 32 - s.length)), s.slice(Math.max(0, s.length - 32))]);
	const sig = _wimseBase64url(Buffer.concat([rPad, sPad]));
	return `${signing}.${sig}`;
}

// POST /api/wimse/issue-wit — issue a Workload Identity Token
app.post('/api/wimse/issue-wit', (req, res) => {
	try {
		const {
			workloadId = 'spiffe://demo.local/payments-processor',
			audience = 'https://api.example.com/inventory',
			platform = 'generic',
			ttlSeconds = 300,
		} = req.body || {};

		const now = Math.floor(Date.now() / 1000);
		const header = { alg: 'ES256', typ: 'JWT', kid: 'wimse-demo-key-1' };
		const payload = {
			iss: 'https://wimse-demo.local/issuer',
			sub: workloadId,
			aud: audience,
			iat: now,
			exp: now + ttlSeconds,
			jti: randomUUID(),
			// WIMSE-specific claims (draft-ietf-wimse-workload-identity-token)
			wid: workloadId,
			platform,
			platform_attestation: {
				type: platform,
				verified: true,
				timestamp: new Date().toISOString(),
			},
		};

		const wit = _wimseSignJwt(header, payload);
		res.json({ success: true, wit, header, payload, publicJwk: _wimsePublicJwk() });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
});

// POST /api/wimse/token-exchange — RFC 8693 token exchange using WIT
app.post('/api/wimse/token-exchange', (req, res) => {
	try {
		const {
			subject_token,
			subject_token_type = 'urn:ietf:params:oauth:token-type:jwt',
			requested_token_type = 'urn:ietf:params:oauth:token-type:access_token',
			audience,
			scope = 'read',
		} = req.body || {};

		if (!subject_token) {
			return res.status(400).json({ error: 'invalid_request', error_description: 'subject_token is required' });
		}
		if (subject_token_type !== 'urn:ietf:params:oauth:token-type:jwt') {
			return res.status(400).json({ error: 'invalid_request', error_description: 'subject_token_type must be urn:ietf:params:oauth:token-type:jwt' });
		}

		// Decode and verify the WIT (signature + expiry)
		const parts = subject_token.split('.');
		if (parts.length !== 3) {
			return res.status(400).json({ error: 'invalid_token', error_description: 'Malformed JWT' });
		}

		let witPayload;
		try {
			witPayload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
		} catch {
			return res.status(400).json({ error: 'invalid_token', error_description: 'Cannot decode WIT payload' });
		}

		// Verify expiry
		const now = Math.floor(Date.now() / 1000);
		if (witPayload.exp && witPayload.exp < now) {
			return res.status(400).json({ error: 'invalid_token', error_description: 'WIT has expired' });
		}

		// Verify signature using local public key
		const signing = `${parts[0]}.${parts[1]}`;
		const pubKey = crypto.createPublicKey({ key: _wimseKeyPair.publicKey, format: 'der', type: 'spki' });
		// Convert raw R||S sig back to DER for Node verify
		const rawSig = Buffer.from(parts[2], 'base64url');
		const r = rawSig.slice(0, 32);
		const s = rawSig.slice(32);
		const rTrim = r[0] & 0x80 ? Buffer.concat([Buffer.from([0x00]), r]) : r;
		const sTrim = s[0] & 0x80 ? Buffer.concat([Buffer.from([0x00]), s]) : s;
		const derSig = Buffer.concat([
			Buffer.from([0x30, rTrim.length + sTrim.length + 4, 0x02, rTrim.length]),
			rTrim,
			Buffer.from([0x02, sTrim.length]),
			sTrim,
		]);
		const verify = createVerify('SHA256');
		verify.update(signing);
		verify.end();
		const sigValid = verify.verify(pubKey, derSig);
		if (!sigValid) {
			return res.status(400).json({ error: 'invalid_token', error_description: 'WIT signature verification failed' });
		}

		// Issue scoped access token
		const targetAud = audience || witPayload.aud;
		const atHeader = { alg: 'ES256', typ: 'at+JWT', kid: 'wimse-demo-key-1' };
		const atPayload = {
			iss: 'https://wimse-demo.local/issuer',
			sub: witPayload.sub,
			aud: targetAud,
			iat: now,
			exp: now + 3600,
			jti: randomUUID(),
			scope,
			// Records the exchange lineage
			act: { sub: witPayload.sub },
			client_id: 'wimse-demo-exchange',
		};
		const accessToken = _wimseSignJwt(atHeader, atPayload);

		res.json({
			access_token: accessToken,
			issued_token_type: requested_token_type,
			token_type: 'Bearer',
			expires_in: 3600,
			scope,
			atPayload,
		});
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
});
// ─── End WIMSE Routes ─────────────────────────────────────────────────────────
```

> **Note:** `createSign`/`createVerify` are not in the existing import — add them to the existing `import { randomUUID, randomBytes, createHash } from 'node:crypto'` line → `import { randomUUID, randomBytes, createHash, createSign, createVerify, generateKeyPairSync } from 'node:crypto'`. Also add `import crypto from 'node:crypto'` if not already present (for `crypto.createPublicKey`/`createPrivateKey`). Check the existing import — the file uses named imports from `node:crypto`, so add `createPublicKey, createPrivateKey` to that same import.

---

## 2. New file: `src/pages/flows/v9/WIMSEFlow.tsx`

```tsx
// src/pages/flows/v9/WIMSEFlow.tsx
// WIMSE — Workload Identity in Multi-System Environments demo
// draft-ietf-wimse-arch + draft-ietf-wimse-workload-identity-token + RFC 8693

import type React from 'react';
import { useCallback, useState } from 'react';
import styled from 'styled-components';

// ─── Types ───────────────────────────────────────────────────────────────────

interface WitResult {
	wit: string;
	header: Record<string, unknown>;
	payload: Record<string, unknown>;
	publicJwk: Record<string, unknown>;
}

interface ExchangeResult {
	access_token: string;
	token_type: string;
	expires_in: number;
	scope: string;
	issued_token_type: string;
	atPayload: Record<string, unknown>;
}

type Step = 0 | 1 | 2 | 3;

const PLATFORMS = ['generic', 'aws', 'gcp', 'azure', 'kubernetes'] as const;
type Platform = (typeof PLATFORMS)[number];

const PLATFORM_LABELS: Record<Platform, string> = {
	generic: 'Generic (SPIFFE)',
	aws: 'AWS (EC2 Instance Identity)',
	gcp: 'GCP (Workload Identity)',
	azure: 'Azure (Managed Identity)',
	kubernetes: 'Kubernetes (ServiceAccount)',
};

// ─── Styled components ────────────────────────────────────────────────────────

const Page = styled.div`
	max-width: 860px;
	margin: 0 auto;
	padding: 2rem 1
```


## License: GPL-3.0
https://github.com/jeffpar/pcjs.v1/blob/52b8cc49176a90335acdbb3ddd6b632754c2b410/pubs/pc/reference/microsoft/mspl13/basic/qbtools/README.md

```
Now I have enough context. The server uses Node's built-in `crypto` module (already imported via `import { randomUUID, randomBytes, createHash } from 'node:crypto'`) — no `jsonwebtoken` needed. I'll use the Web Crypto API approach with Node's `crypto.subtle` since the server is ESM.

Here are all four complete code blocks ready to apply:

---

## 1. `server.js` — Add before `app.listen` (line ~24580)

Find this comment block near the end of `server.js` (just before the `startServer` function or `app.listen`) and insert:

```javascript
// ─── WIMSE — Workload Identity Demo Routes ────────────────────────────────────
// Ephemeral keypair generated per server start — demo only, no persistence needed
import { generateKeyPairSync, createSign, createVerify } from 'node:crypto';

const _wimseKeyPair = generateKeyPairSync('ec', {
	namedCurve: 'P-256',
	publicKeyEncoding: { type: 'spki', format: 'der' },
	privateKeyEncoding: { type: 'pkcs8', format: 'der' },
});

// Build a minimal JWK from the public key for display purposes
function _wimsePublicJwk() {
	const pubKey = crypto.createPublicKey({ key: _wimseKeyPair.publicKey, format: 'der', type: 'spki' });
	const raw = pubKey.export({ format: 'jwk' });
	return { ...raw, use: 'sig', alg: 'ES256', kid: 'wimse-demo-key-1' };
}

function _wimseBase64url(buf) {
	return Buffer.from(buf).toString('base64url');
}

function _wimseSignJwt(header, payload) {
	const h = _wimseBase64url(JSON.stringify(header));
	const p = _wimseBase64url(JSON.stringify(payload));
	const signing = `${h}.${p}`;
	const privKey = crypto.createPrivateKey({ key: _wimseKeyPair.privateKey, format: 'der', type: 'pkcs8' });
	const sign = createSign('SHA256');
	sign.update(signing);
	sign.end();
	// DER → raw R||S for ES256
	const derSig = sign.sign(privKey);
	const r = derSig.slice(4, 4 + derSig[3]);
	const s = derSig.slice(4 + derSig[3] + 2);
	const rPad = Buffer.concat([Buffer.alloc(Math.max(0, 32 - r.length)), r.slice(Math.max(0, r.length - 32))]);
	const sPad = Buffer.concat([Buffer.alloc(Math.max(0, 32 - s.length)), s.slice(Math.max(0, s.length - 32))]);
	const sig = _wimseBase64url(Buffer.concat([rPad, sPad]));
	return `${signing}.${sig}`;
}

// POST /api/wimse/issue-wit — issue a Workload Identity Token
app.post('/api/wimse/issue-wit', (req, res) => {
	try {
		const {
			workloadId = 'spiffe://demo.local/payments-processor',
			audience = 'https://api.example.com/inventory',
			platform = 'generic',
			ttlSeconds = 300,
		} = req.body || {};

		const now = Math.floor(Date.now() / 1000);
		const header = { alg: 'ES256', typ: 'JWT', kid: 'wimse-demo-key-1' };
		const payload = {
			iss: 'https://wimse-demo.local/issuer',
			sub: workloadId,
			aud: audience,
			iat: now,
			exp: now + ttlSeconds,
			jti: randomUUID(),
			// WIMSE-specific claims (draft-ietf-wimse-workload-identity-token)
			wid: workloadId,
			platform,
			platform_attestation: {
				type: platform,
				verified: true,
				timestamp: new Date().toISOString(),
			},
		};

		const wit = _wimseSignJwt(header, payload);
		res.json({ success: true, wit, header, payload, publicJwk: _wimsePublicJwk() });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
});

// POST /api/wimse/token-exchange — RFC 8693 token exchange using WIT
app.post('/api/wimse/token-exchange', (req, res) => {
	try {
		const {
			subject_token,
			subject_token_type = 'urn:ietf:params:oauth:token-type:jwt',
			requested_token_type = 'urn:ietf:params:oauth:token-type:access_token',
			audience,
			scope = 'read',
		} = req.body || {};

		if (!subject_token) {
			return res.status(400).json({ error: 'invalid_request', error_description: 'subject_token is required' });
		}
		if (subject_token_type !== 'urn:ietf:params:oauth:token-type:jwt') {
			return res.status(400).json({ error: 'invalid_request', error_description: 'subject_token_type must be urn:ietf:params:oauth:token-type:jwt' });
		}

		// Decode and verify the WIT (signature + expiry)
		const parts = subject_token.split('.');
		if (parts.length !== 3) {
			return res.status(400).json({ error: 'invalid_token', error_description: 'Malformed JWT' });
		}

		let witPayload;
		try {
			witPayload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
		} catch {
			return res.status(400).json({ error: 'invalid_token', error_description: 'Cannot decode WIT payload' });
		}

		// Verify expiry
		const now = Math.floor(Date.now() / 1000);
		if (witPayload.exp && witPayload.exp < now) {
			return res.status(400).json({ error: 'invalid_token', error_description: 'WIT has expired' });
		}

		// Verify signature using local public key
		const signing = `${parts[0]}.${parts[1]}`;
		const pubKey = crypto.createPublicKey({ key: _wimseKeyPair.publicKey, format: 'der', type: 'spki' });
		// Convert raw R||S sig back to DER for Node verify
		const rawSig = Buffer.from(parts[2], 'base64url');
		const r = rawSig.slice(0, 32);
		const s = rawSig.slice(32);
		const rTrim = r[0] & 0x80 ? Buffer.concat([Buffer.from([0x00]), r]) : r;
		const sTrim = s[0] & 0x80 ? Buffer.concat([Buffer.from([0x00]), s]) : s;
		const derSig = Buffer.concat([
			Buffer.from([0x30, rTrim.length + sTrim.length + 4, 0x02, rTrim.length]),
			rTrim,
			Buffer.from([0x02, sTrim.length]),
			sTrim,
		]);
		const verify = createVerify('SHA256');
		verify.update(signing);
		verify.end();
		const sigValid = verify.verify(pubKey, derSig);
		if (!sigValid) {
			return res.status(400).json({ error: 'invalid_token', error_description: 'WIT signature verification failed' });
		}

		// Issue scoped access token
		const targetAud = audience || witPayload.aud;
		const atHeader = { alg: 'ES256', typ: 'at+JWT', kid: 'wimse-demo-key-1' };
		const atPayload = {
			iss: 'https://wimse-demo.local/issuer',
			sub: witPayload.sub,
			aud: targetAud,
			iat: now,
			exp: now + 3600,
			jti: randomUUID(),
			scope,
			// Records the exchange lineage
			act: { sub: witPayload.sub },
			client_id: 'wimse-demo-exchange',
		};
		const accessToken = _wimseSignJwt(atHeader, atPayload);

		res.json({
			access_token: accessToken,
			issued_token_type: requested_token_type,
			token_type: 'Bearer',
			expires_in: 3600,
			scope,
			atPayload,
		});
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
});
// ─── End WIMSE Routes ─────────────────────────────────────────────────────────
```

> **Note:** `createSign`/`createVerify` are not in the existing import — add them to the existing `import { randomUUID, randomBytes, createHash } from 'node:crypto'` line → `import { randomUUID, randomBytes, createHash, createSign, createVerify, generateKeyPairSync } from 'node:crypto'`. Also add `import crypto from 'node:crypto'` if not already present (for `crypto.createPublicKey`/`createPrivateKey`). Check the existing import — the file uses named imports from `node:crypto`, so add `createPublicKey, createPrivateKey` to that same import.

---

## 2. New file: `src/pages/flows/v9/WIMSEFlow.tsx`

```tsx
// src/pages/flows/v9/WIMSEFlow.tsx
// WIMSE — Workload Identity in Multi-System Environments demo
// draft-ietf-wimse-arch + draft-ietf-wimse-workload-identity-token + RFC 8693

import type React from 'react';
import { useCallback, useState } from 'react';
import styled from 'styled-components';

// ─── Types ───────────────────────────────────────────────────────────────────

interface WitResult {
	wit: string;
	header: Record<string, unknown>;
	payload: Record<string, unknown>;
	publicJwk: Record<string, unknown>;
}

interface ExchangeResult {
	access_token: string;
	token_type: string;
	expires_in: number;
	scope: string;
	issued_token_type: string;
	atPayload: Record<string, unknown>;
}

type Step = 0 | 1 | 2 | 3;

const PLATFORMS = ['generic', 'aws', 'gcp', 'azure', 'kubernetes'] as const;
type Platform = (typeof PLATFORMS)[number];

const PLATFORM_LABELS: Record<Platform, string> = {
	generic: 'Generic (SPIFFE)',
	aws: 'AWS (EC2 Instance Identity)',
	gcp: 'GCP (Workload Identity)',
	azure: 'Azure (Managed Identity)',
	kubernetes: 'Kubernetes (ServiceAccount)',
};

// ─── Styled components ────────────────────────────────────────────────────────

const Page = styled.div`
	max-width: 860px;
	margin: 0 auto;
	padding: 2rem 1
```

