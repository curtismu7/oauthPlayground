/**
 * Generic OAuth 2.0 token client — provider-agnostic.
 *
 * One uniform way to POST to a token endpoint with any grant, applying the chosen
 * client authentication method (RFC 6749 §2.3, RFC 7617). Used by every grant-based
 * flow tool (password, refresh, client_credentials, authorization_code, token-exchange,
 * device_code, CIBA). DPoP proofs (RFC 9449) are attached when supplied.
 */

import axios from 'axios';
import { Logger } from './logger.js';

export type ClientAuthMethod = 'client_secret_basic' | 'client_secret_post' | 'none';

export interface TokenEndpointRequest {
	tokenEndpoint: string;
	/** Grant-specific body parameters (e.g. grant_type, code, refresh_token, scope). */
	params: Record<string, string>;
	clientId?: string;
	clientSecret?: string;
	authMethod?: ClientAuthMethod;
	/** Optional DPoP proof JWT (RFC 9449) — sent as the `DPoP` header. */
	dpopProof?: string;
	/** Extra headers (rarely needed). */
	headers?: Record<string, string>;
}

/** Normalized token endpoint response (RFC 6749 §5.1 + common OIDC/extension fields). */
export interface TokenResponse {
	success: true;
	access_token?: string;
	token_type?: string;
	expires_in?: number;
	expires_at?: string;
	refresh_token?: string;
	id_token?: string;
	scope?: string;
	issued_token_type?: string;
	raw: Record<string, unknown>;
}

const DEFAULT_AUTH_METHOD: ClientAuthMethod =
	(process.env.OAUTH_CLIENT_AUTH_METHOD as ClientAuthMethod) || 'client_secret_post';

/**
 * Apply client authentication to a token-endpoint request, mutating params/headers.
 * - client_secret_basic: Authorization: Basic base64(id:secret)   (RFC 7617)
 * - client_secret_post : client_id + client_secret in the body
 * - none               : public client; client_id in the body only
 */
export function applyClientAuth(
	params: URLSearchParams,
	headers: Record<string, string>,
	clientId: string | undefined,
	clientSecret: string | undefined,
	method: ClientAuthMethod
): void {
	if (method === 'client_secret_basic') {
		if (clientId && clientSecret) {
			const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
			headers.Authorization = `Basic ${creds}`;
		}
		return;
	}

	if (method === 'client_secret_post') {
		if (clientId) params.set('client_id', clientId);
		if (clientSecret) params.set('client_secret', clientSecret);
		return;
	}

	// none — public client
	if (clientId) params.set('client_id', clientId);
}

function computeExpiresAt(expiresIn?: number): string | undefined {
	if (!expiresIn || Number.isNaN(expiresIn)) return undefined;
	return new Date(Date.now() + expiresIn * 1000).toISOString();
}

const logger = new Logger('OAuthClient');

/** POST to a token endpoint and normalize the response. Throws on HTTP/OAuth error. */
export async function postToken(req: TokenEndpointRequest): Promise<TokenResponse> {
	const method = req.authMethod ?? DEFAULT_AUTH_METHOD;
	const params = new URLSearchParams(req.params);
	const headers: Record<string, string> = {
		'Content-Type': 'application/x-www-form-urlencoded',
		Accept: 'application/json',
		...(req.headers ?? {}),
	};

	applyClientAuth(params, headers, req.clientId, req.clientSecret, method);
	if (req.dpopProof) headers.DPoP = req.dpopProof;

	logger.info('POST token endpoint', {
		endpoint: req.tokenEndpoint,
		grant_type: req.params.grant_type,
		authMethod: method,
		dpop: Boolean(req.dpopProof),
	});

	const { data } = await axios.post<Record<string, unknown>>(
		req.tokenEndpoint,
		params.toString(),
		{ headers, timeout: 15000 }
	);

	const rawExpires = data.expires_in;
	const expiresIn =
		typeof rawExpires === 'number'
			? rawExpires
			: typeof rawExpires === 'string'
				? parseInt(rawExpires, 10)
				: undefined;

	return {
		success: true,
		access_token: typeof data.access_token === 'string' ? data.access_token : undefined,
		token_type: typeof data.token_type === 'string' ? data.token_type : undefined,
		expires_in: expiresIn != null && !Number.isNaN(expiresIn) ? expiresIn : undefined,
		expires_at: computeExpiresAt(expiresIn),
		refresh_token: typeof data.refresh_token === 'string' ? data.refresh_token : undefined,
		id_token: typeof data.id_token === 'string' ? data.id_token : undefined,
		scope: typeof data.scope === 'string' ? data.scope : undefined,
		issued_token_type:
			typeof data.issued_token_type === 'string' ? data.issued_token_type : undefined,
		raw: data,
	};
}

/** Resolve default client credentials from env when not supplied per-call. */
export function resolveClientCredentials(input: {
	clientId?: string;
	clientSecret?: string;
	authMethod?: ClientAuthMethod;
}): { clientId?: string; clientSecret?: string; authMethod: ClientAuthMethod } {
	return {
		clientId: input.clientId ?? process.env.OAUTH_CLIENT_ID ?? undefined,
		clientSecret: input.clientSecret ?? process.env.OAUTH_CLIENT_SECRET ?? undefined,
		authMethod: input.authMethod ?? DEFAULT_AUTH_METHOD,
	};
}

/** Default scope from env (OAUTH_DEFAULT_SCOPE) when a tool omits scope. */
export function defaultScope(scope?: string): string | undefined {
	if (scope && scope.trim()) return scope;
	const env = process.env.OAUTH_DEFAULT_SCOPE?.trim();
	return env || undefined;
}
