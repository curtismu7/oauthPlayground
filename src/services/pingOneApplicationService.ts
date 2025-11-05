// src/services/pingOneApplicationService.ts
// Provides functions to obtain a worker token and fetch PingOne applications.

export interface PingOneApplication {
	id: string;
	name: string;
	description?: string;
	clientId: string;
	clientSecret?: string;
	redirectUris?: string[];
	postLogoutRedirectUris?: string[];
	scopes?: string[];
	tokenEndpointAuthMethod?: string;
	grantTypes?: string[];
	pkceEnforcement?: string;
	parStatus?: string;
	type?: string;
}

export interface GetWorkerTokenParams {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	tokenEndpointAuthMethod?: string;
}

export interface FetchApplicationsParams {
	environmentId: string;
	region?: string;
	workerToken?: string;
	clientId?: string;
	clientSecret?: string;
}

/**
 * Requests a PingOne worker token via the backend token-exchange endpoint.
 */
export async function getWorkerToken(params: GetWorkerTokenParams): Promise<string> {
	const response = await fetch('/api/token-exchange', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			grant_type: 'client_credentials',
			client_id: params.clientId,
			client_secret: params.clientSecret,
			environment_id: params.environmentId,
			token_endpoint_auth_method: params.tokenEndpointAuthMethod,
			scope: 'p1:read:environments p1:read:applications p1:read:connections'
		})
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.error_description || `Failed to get worker token (${response.status})`);
	}

	const tokenData = await response.json();
	const accessToken = tokenData.access_token as string | undefined;
	if (!accessToken) throw new Error('No access token in response');
	return accessToken;
}

/**
 * Fetches PingOne applications via the backend proxy. Accepts a worker token or client credentials.
 */
export async function fetchApplications(params: FetchApplicationsParams): Promise<PingOneApplication[]> {
	const searchParams = new URLSearchParams({
		environmentId: params.environmentId,
		region: params.region || 'na',
		...(params.workerToken ? { workerToken: params.workerToken } : {}),
		...(params.clientId ? { clientId: params.clientId } : {}),
		...(params.clientSecret ? { clientSecret: params.clientSecret } : {}),
	});

	const response = await fetch(`/api/pingone/applications?${searchParams.toString()}`);
	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.error_description || `Failed to fetch applications (${response.status})`);
	}

	const data = await response.json();
	const apps = data._embedded?.applications || [];
	return (apps as any[]).map((app) => ({
		id: app.id,
		name: app.name,
		description: app.description,
		clientId: app.clientId,
		clientSecret: app.clientSecret,
		redirectUris: app.redirectUris || [],
		postLogoutRedirectUris: app.postLogoutRedirectUris || [],
		scopes: app.scopes || [],
		tokenEndpointAuthMethod: app.tokenEndpointAuthMethod || 'client_secret_post',
		grantTypes: app.grantTypes || [],
		pkceEnforcement: app.pkceEnforcement,
		parStatus: app.parStatus,
		type: app.type,
	})) as PingOneApplication[];
}




