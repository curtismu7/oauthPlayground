// api/token-exchange.js
// Vercel Serverless Function for OAuth token exchange

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
			client_secret,
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
		} = req.body;

		// Validate required fields based on grant type
		if (!environment_id) {
			return res.status(400).json({ error: 'environment_id is required' });
		}

		const tokenEndpoint = `https://auth.pingone.com/${environment_id}/as/token`;

		// Build request body based on grant type
		const params = new URLSearchParams();

		if (grant_type === 'refresh_token') {
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

		return res.status(200).json(data);
	} catch (error) {
		console.error('Token exchange error:', error);
		return res.status(500).json({
			error: 'internal_server_error',
			error_description: error.message,
		});
	}
}
