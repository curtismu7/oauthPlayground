// api/token-exchange.js
// Vercel Serverless Function for OAuth token exchange

/**
 * Decode a JWT payload without verifying the signature.
 * Used only for may_act / act claim inspection — not for trust decisions.
 */
function decodeJwtPayload(token) {
	try {
		const parts = String(token).split('.');
		if (parts.length < 2) return null;
		const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
		return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
	} catch {
		return null;
	}
}

/**
 * Validate RFC 8693 may_act claim with full AND semantics.
 *
 * Rules (per spec pseudocode):
 *  1. may_act must be present when actor_token is supplied → delegation_not_permitted
 *  2. may_act must be a plain object (not array/string) → invalid_may_act
 *  3. For each recognised field (client_id, sub, iss) ALL present values must match the
 *     actor's identity → actor_mismatch  (AND semantics, not OR)
 *  4. At least one recognised field must be present → unsupported_may_act
 *  5. Wildcard values ('*') are never permitted → actor_mismatch
 *
 * @param {string} subjectToken  Raw JWT of the subject being delegated
 * @param {string} actorToken    Raw JWT of the requesting actor
 * @returns {{ actorClientId: string|null, actorSub: string|null, actClaim: object }}
 * @throws {{ status: number, error: string, error_description: string }}
 */
function validateMayAct(subjectToken, actorToken) {
	const subjectPayload = decodeJwtPayload(subjectToken);
	const actorPayload = decodeJwtPayload(actorToken);

	const mayAct = subjectPayload?.may_act;

	// Rule 1: delegation requested but no may_act claim
	if (!mayAct) {
		throw {
			status: 403,
			error: 'delegation_not_permitted',
			error_description:
				'Subject token does not contain a may_act claim; delegation is not permitted',
		};
	}

	// Rule 2: may_act must be a plain non-array object
	if (typeof mayAct !== 'object' || Array.isArray(mayAct)) {
		throw {
			status: 400,
			error: 'invalid_may_act',
			error_description: 'may_act claim must be a JSON object, not an array or scalar',
		};
	}

	// Extract actor identity from actor token
	// client_id may appear as azp (Authorized Party) in some IdP tokens
	const actorClientId = actorPayload?.client_id ?? actorPayload?.azp ?? null;
	const actorSub = actorPayload?.sub ?? null;
	const actorIss = actorPayload?.iss ?? null;

	// Rule 3 + 4: AND matching — every field that appears in may_act must match
	let supported = false;

	if (Object.prototype.hasOwnProperty.call(mayAct, 'client_id')) {
		supported = true;
		const expected = mayAct.client_id;
		if (expected === '*' || !actorClientId || actorClientId !== expected) {
			throw {
				status: 403,
				error: 'actor_mismatch',
				error_description: `Actor client_id does not match may_act.client_id (expected: ${expected})`,
			};
		}
	}

	if (Object.prototype.hasOwnProperty.call(mayAct, 'sub')) {
		supported = true;
		const expected = mayAct.sub;
		if (expected === '*' || !actorSub || actorSub !== expected) {
			throw {
				status: 403,
				error: 'actor_mismatch',
				error_description: `Actor sub does not match may_act.sub (expected: ${expected})`,
			};
		}
	}

	if (Object.prototype.hasOwnProperty.call(mayAct, 'iss')) {
		supported = true;
		const expected = mayAct.iss;
		if (expected === '*' || !actorIss || actorIss !== expected) {
			throw {
				status: 403,
				error: 'actor_mismatch',
				error_description: `Actor iss does not match may_act.iss (expected: ${expected})`,
			};
		}
	}

	// Rule 4: no recognised fields found in may_act
	if (!supported) {
		throw {
			status: 400,
			error: 'unsupported_may_act',
			error_description:
				'may_act claim contains no supported identity fields (client_id, sub, iss)',
		};
	}

	// Build the act claim for the issued token (RFC 8693 §4.4)
	const actClaim = {};
	if (actorClientId) actClaim.client_id = actorClientId;
	if (actorSub) actClaim.sub = actorSub;

	return { actorClientId, actorSub, actClaim };
}

export default async function handler(req, res) {
	// Set CORS headers
	res.setHeader('Access-Control-Allow-Credentials', 'true');
	res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
	res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

	// Handle preflight
	if (req.method === 'OPTIONS') {
		return res.status(200).end();
	}

	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		const {
			environment_id,
			client_id,
			client_auth_method,
			code,
			redirect_uri,
			code_verifier,
			grant_type,
			refresh_token,
			scope,
			device_code,
			username,
			password,
			// RFC 8693 token-exchange fields
			subject_token,
			subject_token_type,
			actor_token,
			actor_token_type,
			requested_token_type,
			audience,
			resource,
		} = req.body;

		// Fall back to server-side env secret when the client omits it (Vercel pre-configured mode)
		const client_secret = req.body.client_secret || process.env.PINGONE_CLIENT_SECRET || '';

		// Validate required fields based on grant type
		if (!environment_id) {
			return res.status(400).json({ error: 'environment_id is required' });
		}

		const tokenEndpoint = `https://auth.pingone.com/${environment_id}/as/token`;

		// Build request body based on grant type
		const params = new URLSearchParams();
		// act claim to inject into the response envelope (RFC 8693 §4.4); set below
		let actClaim = null;

		if (grant_type === 'urn:ietf:params:oauth:grant-type:token-exchange') {
			// RFC 8693 Token Exchange
			if (!subject_token) {
				return res
					.status(400)
					.json({ error: 'subject_token is required for token-exchange grant' });
			}

			// may_act validation (RFC 8693 §2.1 + spec AND semantics):
			// When an actor_token is supplied the subject token MUST contain a valid may_act
			// object whose every identity field matches the actor.  Hard-fail with specific
			// error codes; never silently allow unconstrained delegation.
			if (actor_token) {
				try {
					const validated = validateMayAct(subject_token, actor_token);
					actClaim = validated.actClaim;
				} catch (mayActErr) {
					return res.status(mayActErr.status ?? 403).json({
						error: mayActErr.error,
						error_description: mayActErr.error_description,
					});
				}
			}

			params.append('grant_type', 'urn:ietf:params:oauth:grant-type:token-exchange');
			params.append('subject_token', subject_token);
			params.append(
				'subject_token_type',
				subject_token_type || 'urn:ietf:params:oauth:token-type:access_token'
			);
			if (actor_token && actClaim) {
				params.append('actor_token', actor_token);
				params.append(
					'actor_token_type',
					actor_token_type || 'urn:ietf:params:oauth:token-type:access_token'
				);
			}
			if (requested_token_type) params.append('requested_token_type', requested_token_type);
			if (audience) params.append('audience', audience);
			if (resource) params.append('resource', resource);
			if (scope) params.append('scope', scope);
			if (client_id) params.append('client_id', client_id);
		} else if (grant_type === 'refresh_token') {
			params.append('grant_type', 'refresh_token');
			params.append('refresh_token', refresh_token);
			if (client_id) params.append('client_id', client_id);
		} else if (grant_type === 'client_credentials') {
			params.append('grant_type', 'client_credentials');
			if (client_id) params.append('client_id', client_id);
			if (scope) params.append('scope', scope);
		} else if (grant_type === 'urn:ietf:params:oauth:grant-type:device_code') {
			params.append('grant_type', 'urn:ietf:params:oauth:grant-type:device_code');
			params.append('device_code', device_code);
			if (client_id) params.append('client_id', client_id);
		} else if (grant_type === 'password') {
			params.append('grant_type', 'password');
			params.append('username', username);
			params.append('password', password);
			if (client_id) params.append('client_id', client_id);
			if (scope) params.append('scope', scope);
		} else {
			// Authorization code grant
			params.append('grant_type', 'authorization_code');
			params.append('code', code);
			params.append('redirect_uri', redirect_uri);
			if (client_id) params.append('client_id', client_id);
			if (code_verifier) params.append('code_verifier', code_verifier);
		}

		// Handle authentication method
		const headers = {
			'Content-Type': 'application/x-www-form-urlencoded',
		};

		if (client_auth_method === 'client_secret_basic' && client_id && client_secret) {
			// Basic Auth
			const credentials = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
			headers['Authorization'] = `Basic ${credentials}`;
		} else if (client_auth_method === 'client_secret_post' && client_secret) {
			// Post body
			params.append('client_secret', client_secret);
		}

		// Make request to PingOne
		const response = await fetch(tokenEndpoint, {
			method: 'POST',
			headers,
			body: params.toString(),
		});

		const data = await response.json();

		if (!response.ok) {
			return res.status(response.status).json(data);
		}

		// RFC 8693 §4.4: inject act claim to represent the delegation chain
		if (actClaim) {
			data.act = actClaim;
		}

		return res.status(200).json(data);
	} catch (error) {
		console.error('Token exchange error:', error);
		return res.status(500).json({
			error: 'internal_server_error',
			error_description: error.message,
		});
	}
}
