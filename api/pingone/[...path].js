// api/pingone/[...path].js
// Vercel Serverless Function - PingOne API proxy

// Origins allowed to make credentialed cross-origin requests to this proxy.
// Add your Vercel deployment URL(s) here.
const ALLOWED_ORIGINS = [
	'https://api.pingdemo.com',
	'http://localhost:3000',
	'http://localhost:3001',
	'https://localhost:3000',
	'https://localhost:3001',
];

export default async function handler(req, res) {
	const requestOrigin = req.headers.origin || '';
	const isAllowed = ALLOWED_ORIGINS.includes(requestOrigin);

	// Set CORS headers — reflect origin only for known-good origins; never allow wildcard + credentials
	if (isAllowed) {
		res.setHeader('Access-Control-Allow-Credentials', 'true');
		res.setHeader('Access-Control-Allow-Origin', requestOrigin);
	}
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

	// Handle preflight
	if (req.method === 'OPTIONS') {
		return res.status(isAllowed ? 200 : 403).end();
	}

	try {
		// Extract path from query params
		const { path: pathSegments } = req.query;
		const apiPath = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments;

		// Build PingOne API URL
		const pingoneUrl = `https://api.pingone.com/${apiPath}`;

		// Forward headers (especially Authorization)
		const headers = {
			'Content-Type': req.headers['content-type'] || 'application/json',
		};

		if (req.headers.authorization) {
			headers['Authorization'] = req.headers.authorization;
		}

		// Make request to PingOne
		const fetchOptions = {
			method: req.method,
			headers,
		};

		// Add body for POST/PUT/PATCH
		if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
			fetchOptions.body = JSON.stringify(req.body);
		}

		const response = await fetch(pingoneUrl, fetchOptions);
		const data = await response.json().catch(() => ({}));

		// Forward response
		return res.status(response.status).json(data);
	} catch (error) {
		console.error('PingOne API proxy error:', error);
		return res.status(500).json({
			error: 'proxy_error',
			error_description: error.message,
		});
	}
}
