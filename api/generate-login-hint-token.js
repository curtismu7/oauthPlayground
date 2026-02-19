// api/generate-login-hint-token.js
// Backend endpoint for generating properly signed login_hint_token JWTs for CIBA

import crypto from 'crypto';

export default async function handler(req, res) {
	// Set CORS headers
	res.setHeader('Access-Control-Allow-Credentials', 'true');
	res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
	res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

	// Handle preflight
	if (req.method === 'OPTIONS') {
		return res.status(200).end();
	}

	// Only allow POST requests
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		const { clientId, environmentId, loginHint } = req.body;

		if (!clientId || !environmentId || !loginHint) {
			return res.status(400).json({
				error: 'bad_request',
				error_description: 'Missing required fields: clientId, environmentId, loginHint',
			});
		}

		// JWT Header
		const header = {
			alg: 'RS256',
			typ: 'JWT',
			kid: 'demo-key-id', // In production, use your actual key ID
		};

		// JWT Payload
		const now = Math.floor(Date.now() / 1000);
		const payload = {
			iss: clientId, // Issuer (your client ID)
			sub: loginHint, // Subject (user identifier)
			aud: `https://auth.pingone.com/${environmentId}`, // Audience (PingOne environment)
			exp: now + 3600, // Expires in 1 hour
			iat: now, // Issued at
			nbf: now, // Not before
			login_hint: loginHint, // The actual login hint
			jti: crypto.randomBytes(16).toString('hex'), // Unique token ID
		};

		// Base64URL encode header and payload
		const base64UrlEncode = (obj) => {
			return Buffer.from(JSON.stringify(obj))
				.toString('base64')
				.replace(/\+/g, '-')
				.replace(/\//g, '_')
				.replace(/=/g, '');
		};

		const encodedHeader = base64UrlEncode(header);
		const encodedPayload = base64UrlEncode(payload);

		// For DEMO purposes, we'll create a self-signed token
		// In PRODUCTION, you MUST use your actual private key that PingOne can validate
		
		// Generate a demo RSA key pair (for demonstration only)
		// In production, load your actual private key from secure storage
		const { privateKey } = crypto.generateKeyPairSync('rsa', {
			modulusLength: 2048,
			publicKeyEncoding: {
				type: 'spki',
				format: 'pem',
			},
			privateKeyEncoding: {
				type: 'pkcs8',
				format: 'pem',
			},
		});

		// Sign the token
		const signatureInput = `${encodedHeader}.${encodedPayload}`;
		const sign = crypto.createSign('RSA-SHA256');
		sign.update(signatureInput);
		sign.end();

		const signature = sign
			.sign(privateKey)
			.toString('base64')
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=/g, '');

		// Construct the JWT
		const jwt = `${encodedHeader}.${encodedPayload}.${signature}`;

		return res.status(200).json({
			success: true,
			token: jwt,
			payload: payload,
			warning: 'This is a DEMO token signed with a temporary key. For production, configure PingOne to trust your public key.',
			instructions: [
				'1. Generate an RSA key pair (RS256)',
				'2. Upload your public key to PingOne',
				'3. Configure your application to use the private key for signing',
				'4. Use the kid (key ID) that matches your PingOne configuration',
			],
		});
	} catch (error) {
		console.error('[API /generate-login-hint-token] Error:', error);
		return res.status(500).json({
			error: 'internal_error',
			error_description: error.message,
		});
	}
}
