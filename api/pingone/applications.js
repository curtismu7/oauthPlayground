// api/pingone/applications.js
// Backend endpoint for fetching PingOne applications

export default async function handler(req, res) {
	// Set CORS headers
	res.setHeader('Access-Control-Allow-Credentials', 'true');
	res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

	// Handle preflight
	if (req.method === 'OPTIONS') {
		return res.status(200).end();
	}

	// Only allow GET requests
	if (req.method !== 'GET') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		const { environmentId, region, workerToken, clientId, clientSecret } = req.query;

		if (!environmentId) {
			return res.status(400).json({
				error: 'bad_request',
				error_description: 'Missing required parameter: environmentId',
			});
		}

		let accessToken = workerToken;

		// If no worker token provided, get one using client credentials
		if (!accessToken && clientId && clientSecret) {
			const tokenResponse = await fetch('https://auth.pingone.com/as/token.oauth2', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					grant_type: 'client_credentials',
					client_id: clientId,
					client_secret: clientSecret,
					scope: 'p1:read:environments p1:read:applications',
				}),
			});

			if (!tokenResponse.ok) {
				const errorData = await tokenResponse.json().catch(() => ({}));
				return res.status(400).json({
					error: 'token_error',
					error_description: errorData.error_description || 'Failed to get worker token',
				});
			}

			const tokenData = await tokenResponse.json();
			accessToken = tokenData.access_token;
		}

		if (!accessToken) {
			return res.status(400).json({
				error: 'bad_request',
				error_description: 'Either workerToken or (clientId + clientSecret) required',
			});
		}

		// Determine region-specific API URL
		const regionMap = {
			na: 'api.pingone.com',
			eu: 'api.pingone.eu',
			ap: 'api.pingone.asia',
			ca: 'api.pingone.ca',
		};
		const apiDomain = regionMap[region] || regionMap.na;

		// Fetch applications from PingOne
		const appsUrl = `https://${apiDomain}/v1/environments/${environmentId}/applications`;
		const appsResponse = await fetch(appsUrl, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
		});

		if (!appsResponse.ok) {
			const errorData = await appsResponse.json().catch(() => ({}));
			return res.status(appsResponse.status).json({
				error: 'pingone_error',
				error_description: errorData.message || `PingOne API error (${appsResponse.status})`,
			});
		}

		const appsData = await appsResponse.json();
		return res.status(200).json(appsData);
	} catch (error) {
		console.error('[API /pingone/applications] Error:', error);
		return res.status(500).json({
			error: 'internal_error',
			error_description: error.message,
		});
	}
}
