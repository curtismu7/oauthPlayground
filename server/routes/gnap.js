// GNAP (RFC 9635) demo routes — moved verbatim from server.js.

import { randomUUID } from 'node:crypto';
import express from 'express';

const router = express.Router();

// ─── GNAP — Grant Negotiation and Authorization Protocol (RFC 9635) ───────────
// https://www.rfc-editor.org/rfc/rfc9635
// GNAP replaces OAuth's redirect-based dance with a richer JSON negotiation:
//   1. Client POSTs a grant request (resources, subjects, interact)
//   2. AS returns interact redirect + pending grant
//   3. User approves; AS issues interaction finish notification
//   4. Client POSTs continuation request → receives access tokens + subject claims

const _gnapStore = new Map(); // transactionId → grant state

function _gnapId() {
	return randomUUID();
}

// POST /api/gnap/grant  — Initial grant request
router.post('/api/gnap/grant', (req, res) => {
	try {
		const { access, subject, interact, client } = req.body;
		if (!access && !subject) {
			return res
				.status(400)
				.json({ error: 'invalid_request', error_description: 'access or subject required' });
		}
		const txId = _gnapId();
		const interactRef = _gnapId().replace(/-/g, '').slice(0, 16);

		// Store pending grant
		_gnapStore.set(txId, {
			status: 'pending',
			access: access ?? [],
			subject: subject ?? null,
			client: client ?? { display: { name: 'Demo Client' } },
			interact: interact ?? null,
			interactRef,
			approvedAt: null,
		});

		const response = {
			// RFC 9635 §2.2 — interact if requested
			...(interact && {
				interact: {
					redirect: `${req.protocol}://${req.get('host')}/gnap/interact/${interactRef}`,
					finish: {
						method: 'redirect',
						uri: interact?.finish?.uri ?? 'https://client.example.com/callback',
						nonce: interact?.finish?.nonce ?? _gnapId().slice(0, 8),
					},
				},
			}),
			// RFC 9635 §2.3 — continuation handle
			continue: {
				access_token: { value: `gnap-cont-${txId}` },
				uri: `${req.protocol}://${req.get('host')}/api/gnap/continue/${txId}`,
				wait: 5,
			},
			instance_id: txId,
		};

		res.status(200).json(response);
	} catch (err) {
		res.status(500).json({ error: 'server_error', error_description: err.message });
	}
});

// POST /api/gnap/interact/:interactRef/approve  — Simulate user approval
router.post('/api/gnap/interact/:interactRef/approve', (req, res) => {
	try {
		const { interactRef } = req.params;
		let found = null;
		for (const [id, grant] of _gnapStore.entries()) {
			if (grant.interactRef === interactRef) {
				found = [id, grant];
				break;
			}
		}
		if (!found) return res.status(404).json({ error: 'unknown_ref' });
		const [txId, grant] = found;
		grant.status = 'approved';
		grant.approvedAt = Date.now();
		_gnapStore.set(txId, grant);
		res.json({ status: 'approved', txId });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// POST /api/gnap/continue/:txId  — Continuation request after user approval
router.post('/api/gnap/continue/:txId', (req, res) => {
	try {
		const { txId } = req.params;
		const grant = _gnapStore.get(txId);
		if (!grant) return res.status(404).json({ error: 'unknown_transaction' });
		if (grant.status !== 'approved') {
			return res.status(200).json({
				continue: {
					access_token: { value: `gnap-cont-${txId}` },
					uri: `${req.protocol}://${req.get('host')}/api/gnap/continue/${txId}`,
					wait: 5,
				},
				status: 'pending',
			});
		}

		const now = Math.floor(Date.now() / 1000);
		// Build access tokens per requested resource
		const accessTokens = (grant.access ?? []).map((resourceReq, i) => {
			const label =
				typeof resourceReq === 'string' ? resourceReq : (resourceReq.type ?? `resource-${i}`);
			return {
				value: `gnap-at-${_gnapId().slice(0, 8)}`,
				label,
				expires_in: 3600,
				manage: `${req.protocol}://${req.get('host')}/api/gnap/token/${_gnapId().slice(0, 8)}`,
				access: [resourceReq],
				flags: ['bearer'],
			};
		});

		// Subject info if requested
		const subjectInfo = grant.subject
			? {
					sub_ids: [{ format: 'email', email: 'user@demo.example.com' }],
					assertions: { id_token: `demo.id.token.${_gnapId().slice(0, 8)}` },
					updated_at: new Date().toISOString(),
				}
			: undefined;

		_gnapStore.delete(txId); // clean up after issuance

		res.json({
			access_token: accessTokens.length === 1 ? accessTokens[0] : undefined,
			multiple_access_tokens:
				accessTokens.length > 1
					? Object.fromEntries(accessTokens.map((t) => [t.label, t]))
					: undefined,
			...(subjectInfo && { subject: subjectInfo }),
			instance_id: txId,
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// GET /api/gnap/status/:txId  — Poll grant status
router.get('/api/gnap/status/:txId', (req, res) => {
	const grant = _gnapStore.get(req.params.txId);
	if (!grant) return res.status(404).json({ error: 'unknown_transaction' });
	res.json({ status: grant.status, interactRef: grant.interactRef });
});
// ─── End GNAP Routes ──────────────────────────────────────────────────────────

export default router;
