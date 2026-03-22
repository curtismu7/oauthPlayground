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

		// Track actor sub for act claim injection
		let actorSub = null;

		if (grant_type === 'urn:ietf:params:oauth:grant-type:token-exchange') {
			// RFC 8693 Token Exchange
			if (!subject_token) {
				return res
					.status(400)
					.json({ error: 'subject_token is required for token-exchange grant' });
			}

			// may_act validation: if an actor_token is supplied, confirm the actor's sub
			// is listed in the subject token's may_act claim before forwarding to PingOne.
			if (actor_token) {
				const actorPayload = decodeJwtPayload(actor_token);
				actorSub = actorPayload?.sub ?? null;
				if (actorSub) {
					const subjectPayload = decodeJwtPayload(subject_token);
					const mayActClaim = subjectPayload?.may_act;
					if (mayActClaim) {
						const actorList = Array.isArray(mayActClaim) ? mayActClaim : [mayActClaim];
						const isAllowed = actorList.some(
							(a) => (typeof a === 'object' && a !== null ? a.sub : a) === actorSub
						);
						if (!isAllowed) {
							return res.status(403).json({
								error: 'access_denied',
								error_description: `Actor sub (${actorSub}) is not listed in the subject token's may_act claim`,
							});
						}
					}
				}
			}

			params.append('grant_type', 'urn:ietf:params:oauth:grant-type:token-exchange');
			params.append('subject_token', subject_token);
			params.append(
				'subject_token_type',
				subject_token_type || 'urn:ietf:params:oauth:token-type:access_token'
			);
			if (actor_token && actorSub) {
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
		if (actorSub) {
			data.act = { sub: actorSub };
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
