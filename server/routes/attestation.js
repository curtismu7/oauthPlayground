// Attestation-Based Client Auth routes — moved verbatim from server.js.

import {
	createPrivateKey,
	createPublicKey,
	createSign,
	createVerify,
	generateKeyPairSync,
	randomUUID,
} from 'node:crypto';
import express from 'express';

const router = express.Router();

// ─── Attestation-Based Client Auth Routes ─────────────────────────────────────
// draft-ietf-oauth-attestation-based-client-auth
// Two JWTs: Client Attestation JWT (signed by Attester) + Client Attestation PoP JWT (signed by client ephemeral key)
// Combined as: <attestation>~<pop>  client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-client-attestation

// Attester key pair — simulates a trusted platform attester (MDM, app store, etc.)
const _attesterKeyPair = generateKeyPairSync('ec', {
	namedCurve: 'P-256',
	publicKeyEncoding: { type: 'spki', format: 'der' },
	privateKeyEncoding: { type: 'pkcs8', format: 'der' },
});

function _attesterPublicJwk() {
	const pub = createPublicKey({ key: _attesterKeyPair.publicKey, format: 'der', type: 'spki' });
	const raw = pub.export({ format: 'jwk' });
	return { ...raw, kid: 'attester-key-1' };
}

function _attestBase64url(buf) {
	return Buffer.from(buf)
		.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}

function _attestSignJwt(header, payload, privateKeyDer) {
	const priv = createPrivateKey({ key: privateKeyDer, format: 'der', type: 'pkcs8' });
	const hdr = _attestBase64url(Buffer.from(JSON.stringify(header)));
	const pld = _attestBase64url(Buffer.from(JSON.stringify(payload)));
	const signing = `${hdr}.${pld}`;
	const sign = createSign('SHA256');
	sign.update(signing);
	const derSig = sign.sign(priv);
	// DER SEQUENCE → raw R‖S (64 bytes) for ES256
	let offset = 2;
	const rLen = derSig[offset + 1];
	let rRaw = derSig.slice(offset + 2, offset + 2 + rLen);
	offset += 2 + rLen;
	const sLen = derSig[offset + 1];
	let sRaw = derSig.slice(offset + 2, offset + 2 + sLen);
	if (rRaw.length > 32) rRaw = rRaw.slice(rRaw.length - 32);
	if (sRaw.length > 32) sRaw = sRaw.slice(sRaw.length - 32);
	const rPad = Buffer.alloc(32);
	rRaw.copy(rPad, 32 - rRaw.length);
	const sPad = Buffer.alloc(32);
	sRaw.copy(sPad, 32 - sRaw.length);
	const rawSig = Buffer.concat([rPad, sPad]);
	return `${signing}.${_attestBase64url(rawSig)}`;
}

function _attestVerifyJwt(token, publicKeyDer) {
	const parts = token.split('.');
	if (parts.length !== 3) throw new Error('Invalid JWT structure');
	const [hdrB64, pldB64, sigB64] = parts;
	const pub = createPublicKey({ key: publicKeyDer, format: 'der', type: 'spki' });
	const rawSig = Buffer.from(sigB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
	// raw R‖S → DER SEQUENCE
	const r = rawSig.slice(0, 32);
	const s = rawSig.slice(32, 64);
	const rPadded = r[0] & 0x80 ? Buffer.concat([Buffer.from([0x00]), r]) : r;
	const sPadded = s[0] & 0x80 ? Buffer.concat([Buffer.from([0x00]), s]) : s;
	const inner = Buffer.concat([
		Buffer.from([0x02, rPadded.length]),
		rPadded,
		Buffer.from([0x02, sPadded.length]),
		sPadded,
	]);
	const der = Buffer.concat([Buffer.from([0x30, inner.length]), inner]);
	const verify = createVerify('SHA256');
	verify.update(`${hdrB64}.${pldB64}`);
	return verify.verify(pub, der);
}

// POST /api/attestation/attester-jwks — public JWK set for the attester (AS can fetch to verify attestation JWTs)
router.get('/api/attestation/attester-jwks', (_req, res) => {
	res.json({ keys: [_attesterPublicJwk()] });
});

// POST /api/attestation/issue-attestation
// Simulates the Attester signing a Client Attestation JWT.
// In production: MDM, app store, or trusted platform does this out-of-band.
router.post('/api/attestation/issue-attestation', (req, res) => {
	try {
		const { clientId, clientEphemeralPublicJwk, attester = 'demo-mdm', policies = [] } = req.body;
		if (!clientId || !clientEphemeralPublicJwk) {
			return res.status(400).json({ error: 'clientId and clientEphemeralPublicJwk required' });
		}
		const now = Math.floor(Date.now() / 1000);
		// Client Attestation JWT — signed by Attester, cnf binds client ephemeral key
		const header = { alg: 'ES256', typ: 'JWT', kid: 'attester-key-1' };
		const payload = {
			iss: `https://demo-attester.example.com/${attester}`,
			sub: clientId,
			iat: now,
			exp: now + 300, // 5 min
			cnf: { jwk: clientEphemeralPublicJwk }, // binds client ephemeral key
			'policy-ids': policies,
			attester,
			// draft claim: client software attestation
			client_attestation: {
				app_id: clientId,
				platform: attester,
				integrity: 'pass',
				version: '1.0.0',
			},
		};
		const attestationJwt = _attestSignJwt(header, payload, _attesterKeyPair.privateKey);
		const decodedHeader = header;
		const decodedPayload = payload;
		const attesterPublicJwk = _attesterPublicJwk();
		res.json({ success: true, attestationJwt, decodedHeader, decodedPayload, attesterPublicJwk });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
});

// POST /api/attestation/token
// Simulates the AS receiving client_assertion_type=jwt-client-attestation
// client_assertion = <attestation-jwt>~<pop-jwt>
// Verifies: (1) attestation JWT signed by trusted attester, (2) PoP JWT signed by ephemeral key in cnf
router.post('/api/attestation/token', (req, res) => {
	try {
		const {
			client_assertion_type,
			client_assertion,
			grant_type = 'client_credentials',
			scope = 'read',
			audience,
		} = req.body;

		const EXPECTED_TYPE = 'urn:ietf:params:oauth:client-assertion-type:jwt-client-attestation';
		if (client_assertion_type !== EXPECTED_TYPE) {
			return res.status(400).json({
				error: 'invalid_client',
				error_description: `client_assertion_type must be ${EXPECTED_TYPE}`,
			});
		}
		if (!client_assertion || !client_assertion.includes('~')) {
			return res.status(400).json({
				error: 'invalid_client',
				error_description: 'client_assertion must be <attestation-jwt>~<pop-jwt>',
			});
		}

		const [attestationJwt, popJwt] = client_assertion.split('~');

		// 1. Verify attestation JWT signature (trusted attester key)
		const attIsValid = _attestVerifyJwt(attestationJwt, _attesterKeyPair.publicKey);
		if (!attIsValid) {
			return res
				.status(401)
				.json({ error: 'invalid_client', error_description: 'Attestation JWT signature invalid' });
		}

		// 2. Decode attestation JWT and extract cnf.jwk (client ephemeral public key)
		const attPayloadB64 = attestationJwt.split('.')[1];
		const attPayload = JSON.parse(
			Buffer.from(attPayloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
		);

		// Check expiry
		const now = Math.floor(Date.now() / 1000);
		if (attPayload.exp < now) {
			return res
				.status(401)
				.json({ error: 'invalid_client', error_description: 'Attestation JWT expired' });
		}

		// 3. Reconstruct client ephemeral public key DER from cnf.jwk
		const cnfJwk = attPayload?.cnf?.jwk;
		if (!cnfJwk) {
			return res
				.status(400)
				.json({ error: 'invalid_client', error_description: 'Attestation JWT missing cnf.jwk' });
		}
		const ephemeralPubKey = createPublicKey({ key: cnfJwk, format: 'jwk' });
		const ephemeralPubDer = ephemeralPubKey.export({ type: 'spki', format: 'der' });

		// 4. Verify PoP JWT signed by client ephemeral key
		const popIsValid = _attestVerifyJwt(popJwt, ephemeralPubDer);
		if (!popIsValid) {
			return res.status(401).json({
				error: 'invalid_client',
				error_description: 'Client Attestation PoP JWT signature invalid',
			});
		}

		// 5. Decode PoP JWT, validate aud/iat/exp
		const popPayloadB64 = popJwt.split('.')[1];
		const popPayload = JSON.parse(
			Buffer.from(popPayloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
		);

		if (popPayload.exp < now) {
			return res
				.status(401)
				.json({ error: 'invalid_client', error_description: 'PoP JWT expired' });
		}

		// 6. Both verified — issue access token
		const clientId = attPayload.sub;
		const issuedAt = now;
		const expiry = now + 3600;
		const atHeader = { alg: 'ES256', typ: 'at+JWT' };
		const atPayload = {
			iss: 'https://demo-as.example.com',
			sub: clientId,
			client_id: clientId,
			aud: audience || popPayload.aud || 'https://api.example.com',
			iat: issuedAt,
			exp: expiry,
			scope,
			grant_type,
			jti: randomUUID(),
			// draft: record attestation binding
			cnf: { jwk: cnfJwk },
			attester: attPayload.attester,
		};
		const accessToken = _attestSignJwt(atHeader, atPayload, _attesterKeyPair.privateKey);

		res.json({
			access_token: accessToken,
			token_type: 'Bearer',
			expires_in: 3600,
			scope,
			issued_token_type: 'urn:ietf:params:oauth:token-type:access_token',
			atPayload,
			verificationSteps: {
				step1_attestation_signature: 'PASS',
				step2_cnf_jwk_extracted: 'PASS',
				step3_pop_signature: 'PASS',
				step4_pop_expiry: 'PASS',
			},
		});
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
});
// ─── End Attestation-Based Client Auth Routes ─────────────────────────────────

export default router;
