/**
 * @file workerTokenAcquisitionService.js
 * @description Server-side worker token acquisition via client_credentials grant.
 *   Node-only — no browser storage (IndexedDB/localStorage/unifiedWorkerTokenService).
 */

const REGION_DOMAINS = {
	us: 'auth.pingone.com',
	eu: 'auth.pingone.eu',
	ap: 'auth.pingone.asia',
	ca: 'auth.pingone.ca',
};

function resolveTokenEndpoint(params) {
	const domain = params.customDomain?.trim() || REGION_DOMAINS[params.region] || REGION_DOMAINS.us;
	return `https://${domain}/${params.environmentId.trim()}/as/token`;
}

function toBase64Utf8(input) {
	return Buffer.from(input, 'utf8').toString('base64');
}

function buildRequest(params, authMethod) {
	const bodyParams = new URLSearchParams({
		grant_type: 'client_credentials',
		client_id: params.clientId.trim(),
		scope: params.scopes.join(' '),
	});
	const headers = {
		'Content-Type': 'application/x-www-form-urlencoded',
	};
	if (authMethod === 'client_secret_post') {
		bodyParams.set('client_secret', params.clientSecret.trim());
	} else {
		headers.Authorization = `Basic ${toBase64Utf8(`${params.clientId.trim()}:${params.clientSecret.trim()}`)}`;
	}
	return { headers, body: bodyParams.toString() };
}

async function parseResponse(response) {
	try {
		return await response.json();
	} catch {
		const raw = await response.text();
		return raw ? { raw } : null;
	}
}

function errorMessageFrom(data, status) {
	return data?.error_description || data?.error || `Token generation failed (HTTP ${status})`;
}

function isAuthMethodMismatch(message) {
	return (
		/unsupported authentication method/i.test(message) ||
		/client authentication failed/i.test(message)
	);
}

export async function acquireWorkerToken(params) {
	if (!params.environmentId?.trim() || !params.clientId?.trim() || !params.clientSecret?.trim()) {
		throw new Error('Environment ID, Client ID, and Client Secret are required');
	}
	if (!params.scopes?.length) {
		throw new Error('Please provide at least one scope for the worker token');
	}

	const endpoint = resolveTokenEndpoint(params);
	let authMethodUsed = params.authMethod || 'client_secret_basic';
	const first = buildRequest(params, authMethodUsed);

	let response = await global.fetch(endpoint, {
		method: 'POST',
		headers: first.headers,
		body: first.body,
	});
	let data = await parseResponse(response);

	if (!response.ok) {
		const message = errorMessageFrom(data, response.status);
		if (isAuthMethodMismatch(message)) {
			authMethodUsed =
				authMethodUsed === 'client_secret_basic' ? 'client_secret_post' : 'client_secret_basic';
			const retry = buildRequest(params, authMethodUsed);
			response = await global.fetch(endpoint, {
				method: 'POST',
				headers: retry.headers,
				body: retry.body,
			});
			if (!response.ok) {
				throw new Error(
					'Authentication method mismatch: tried both Client Secret Basic and Client Secret Post — ' +
						'both rejected by PingOne. In PingOne Admin → Applications → your Worker app → ' +
						'Configuration, set "Token Endpoint Auth Method" to match.'
				);
			}
			data = await parseResponse(response);
		} else if (/unsupported_grant_type/i.test(message)) {
			throw new Error(
				`${message}. Double-check that the Worker app allows the client_credentials grant.`
			);
		} else {
			throw new Error(message);
		}
	}

	const token = data?.access_token;
	if (!token) {
		throw new Error('No access token received in response');
	}

	const expiresIn = data?.expires_in;
	const expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : undefined;

	return { token, expiresAt, authMethodUsed };
}
