/**
 * @file workerTokenAcquisitionService.ts
 * @description Self-contained Client Credentials worker-token acquisition.
 *   Endpoint resolution + auth-method header/body construction + POST +
 *   auth-method auto-retry + token/credential persistence. Extracted faithfully
 *   from WorkerTokenModal so the canonical <WorkerTokenCredentials> dialog and
 *   (later) every other call-site share one generation path.
 */
import { environmentService } from './environmentService';
import { unifiedWorkerTokenService } from './unifiedWorkerTokenService';
import { logger } from '@/utils/logger';
import pingOneFetch from '@/utils/pingOneFetch';

const MODULE_TAG = '[WorkerTokenAcquisition]';

export type WorkerTokenRegion = 'us' | 'eu' | 'ap' | 'ca';
export type WorkerTokenAuthMethod = 'client_secret_basic' | 'client_secret_post';

export interface AcquireWorkerTokenParams {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	scopes: string[];
	region: WorkerTokenRegion;
	authMethod: WorkerTokenAuthMethod;
	customDomain?: string;
}

export interface AcquireWorkerTokenResult {
	token: string;
	expiresAt?: number | undefined;
	/** The auth method that actually succeeded (may differ after auto-retry). */
	authMethodUsed: WorkerTokenAuthMethod;
}

const REGION_DOMAINS: Record<WorkerTokenRegion, string> = {
	us: 'auth.pingone.com',
	eu: 'auth.pingone.eu',
	ap: 'auth.pingone.asia',
	ca: 'auth.pingone.ca',
};

function resolveTokenEndpoint(p: AcquireWorkerTokenParams): string {
	const domain = p.customDomain?.trim() || REGION_DOMAINS[p.region];
	return `https://${domain}/${p.environmentId.trim()}/as/token`;
}

/** UTF-8-safe base64 — plain btoa() throws on non-Latin1 characters in a secret. */
function toBase64Utf8(input: string): string {
	const bytes = new TextEncoder().encode(input);
	let binary = '';
	for (const b of bytes) {
		binary += String.fromCharCode(b);
	}
	return btoa(binary);
}

function buildRequest(
	p: AcquireWorkerTokenParams,
	authMethod: WorkerTokenAuthMethod
): { headers: Record<string, string>; body: string } {
	const params = new URLSearchParams({
		grant_type: 'client_credentials',
		client_id: p.clientId.trim(),
		scope: p.scopes.join(' '),
	});
	const headers: Record<string, string> = {
		'Content-Type': 'application/x-www-form-urlencoded',
	};
	if (authMethod === 'client_secret_post') {
		params.set('client_secret', p.clientSecret.trim());
	} else {
		headers.Authorization = `Basic ${toBase64Utf8(`${p.clientId.trim()}:${p.clientSecret.trim()}`)}`;
	}
	return { headers, body: params.toString() };
}

function persistCredentials(
	p: AcquireWorkerTokenParams,
	authMethod: WorkerTokenAuthMethod
): Promise<unknown> {
	return unifiedWorkerTokenService.saveCredentials({
		environmentId: p.environmentId.trim(),
		clientId: p.clientId.trim(),
		clientSecret: p.clientSecret.trim(),
		scopes: p.scopes,
		region: p.region,
		customDomain: p.customDomain?.trim() || '',
		tokenEndpointAuthMethod: authMethod,
	});
}

async function parseResponse(response: Response): Promise<Record<string, unknown> | null> {
	try {
		return (await response.json()) as Record<string, unknown>;
	} catch {
		const raw = await response.text();
		return raw ? { raw } : null;
	}
}

function errorMessageFrom(data: Record<string, unknown> | null, status: number): string {
	const err = data as { error_description?: string; error?: string } | null;
	return err?.error_description || err?.error || `Token generation failed (HTTP ${status})`;
}

function isAuthMethodMismatch(message: string): boolean {
	return (
		/unsupported authentication method/i.test(message) ||
		/client authentication failed/i.test(message)
	);
}

/**
 * Acquire a worker token via the OAuth 2.0 Client Credentials grant.
 * Persists credentials + token and updates the global environment service,
 * mirroring WorkerTokenModal's execute path. Throws on failure with a
 * user-presentable message.
 */
export async function acquireWorkerToken(
	p: AcquireWorkerTokenParams
): Promise<AcquireWorkerTokenResult> {
	if (!p.environmentId.trim() || !p.clientId.trim() || !p.clientSecret.trim()) {
		throw new Error('Environment ID, Client ID, and Client Secret are required');
	}
	if (p.scopes.length === 0) {
		throw new Error('Please provide at least one scope for the worker token');
	}

	const endpoint = resolveTokenEndpoint(p);
	let authMethodUsed = p.authMethod;
	const first = buildRequest(p, authMethodUsed);

	let response = await pingOneFetch(endpoint, {
		method: 'POST',
		headers: first.headers,
		body: first.body,
	});
	let data = await parseResponse(response);

	if (!response.ok) {
		const message = errorMessageFrom(data, response.status);
		if (isAuthMethodMismatch(message)) {
			// Auto-retry with the opposite client authentication method.
			authMethodUsed =
				p.authMethod === 'client_secret_basic' ? 'client_secret_post' : 'client_secret_basic';
			logger.debug(`${MODULE_TAG} Auth method mismatch — retrying with ${authMethodUsed}`, '');
			const retry = buildRequest(p, authMethodUsed);
			response = await pingOneFetch(endpoint, {
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

	const token = (data as { access_token?: string } | null)?.access_token;
	if (!token) {
		throw new Error('No access token received in response');
	}

	// Persist credentials only after a successful fetch, using the auth method
	// that actually worked (which may differ from p.authMethod after auto-retry).
	await persistCredentials(p, authMethodUsed);

	const expiresIn = (data as { expires_in?: number } | null)?.expires_in;
	const expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : undefined;
	await unifiedWorkerTokenService.saveToken(token, expiresAt);

	const options: { region: WorkerTokenRegion; customDomain?: string } = { region: p.region };
	if (p.customDomain?.trim()) {
		options.customDomain = p.customDomain.trim();
	}
	environmentService.setEnvironmentId(p.environmentId.trim(), options);

	return { token, expiresAt, authMethodUsed };
}

