/**
 * Provider-agnostic endpoint resolution.
 *
 * Every flow tool needs OAuth/OIDC endpoints (token, authorize, jwks, etc.). This module
 * resolves them from, in priority order:
 *   1. Explicit endpoint overrides passed on the tool call (`endpoints`)
 *   2. OIDC discovery against an `issuerUrl` (.well-known/openid-configuration) — cached
 *   3. A PingOne preset: { environmentId, region } -> auth.pingone.{region}/{envId}/as/*
 *   4. Environment-variable defaults (OAUTH_ISSUER_URL, PINGONE_ENVIRONMENT_ID, ...)
 *
 * This is what makes the server provider-agnostic: PingOne is just one preset; any
 * OIDC-compliant issuer works via discovery, and non-discovery providers work via
 * explicit endpoint overrides.
 */

import axios from 'axios';
import { ConfigError, ERROR_CODES } from './mcpErrors.js';

export interface ProviderEndpoints {
	issuer?: string;
	authorization_endpoint?: string;
	token_endpoint?: string;
	userinfo_endpoint?: string;
	jwks_uri?: string;
	introspection_endpoint?: string;
	revocation_endpoint?: string;
	device_authorization_endpoint?: string;
	pushed_authorization_request_endpoint?: string;
	backchannel_authentication_endpoint?: string;
	end_session_endpoint?: string;
}

export interface PingOnePreset {
	/** PingOne environment UUID. */
	environmentId: string;
	/** Region suffix: com (US, default) | eu | ca | asia. */
	region?: string;
}

/** Inputs every flow tool accepts for locating endpoints. All optional; falls back to env. */
export interface ProviderResolutionInput {
	/** OIDC issuer URL — discovery is run against `${issuer}/.well-known/openid-configuration`. */
	issuerUrl?: string;
	/** PingOne convenience preset. */
	pingone?: PingOnePreset;
	/** Explicit endpoint overrides — highest priority, win over discovery/preset. */
	endpoints?: Partial<ProviderEndpoints>;
}

const discoveryCache = new Map<string, { value: ProviderEndpoints; expiresAt: number }>();
const DISCOVERY_TTL_MS = 5 * 60 * 1000;

/** Map a PingOne region suffix to its auth host. Accepts com/us, eu, ca, asia/ap. */
function pingOneAuthHost(region?: string): string {
	const r = (region ?? process.env.PINGONE_REGION ?? 'com').toLowerCase().trim();
	if (r === 'eu') return 'auth.pingone.eu';
	if (r === 'ca') return 'auth.pingone.ca';
	if (r === 'ap' || r === 'asia') return 'auth.pingone.asia';
	// 'com', 'us', or anything else defaults to the US tenant
	return 'auth.pingone.com';
}

/** Compute the full PingOne endpoint set from environmentId + region (no network call). */
export function pingOneEndpoints(preset: PingOnePreset): ProviderEndpoints {
	const host = pingOneAuthHost(preset.region);
	const base = `https://${host}/${preset.environmentId}/as`;
	return {
		issuer: base,
		authorization_endpoint: `${base}/authorize`,
		token_endpoint: `${base}/token`,
		userinfo_endpoint: `${base}/userinfo`,
		jwks_uri: `${base}/jwks`,
		introspection_endpoint: `${base}/introspect`,
		revocation_endpoint: `${base}/revoke`,
		device_authorization_endpoint: `${base}/device_authorization`,
		pushed_authorization_request_endpoint: `${base}/par`,
		backchannel_authentication_endpoint: `${base}/bc-authorize`,
		end_session_endpoint: `${base}/signoff`,
	};
}

/** Fetch and cache an OIDC discovery document, returning its endpoint set. */
export async function discoverEndpoints(issuerUrl: string): Promise<ProviderEndpoints> {
	const issuer = issuerUrl.replace(/\/+$/, '');
	const cached = discoveryCache.get(issuer);
	if (cached && cached.expiresAt > Date.now()) {
		return cached.value;
	}

	const url = issuer.endsWith('/.well-known/openid-configuration')
		? issuer
		: `${issuer}/.well-known/openid-configuration`;

	try {
		const { data } = await axios.get<ProviderEndpoints>(url, {
			headers: { Accept: 'application/json' },
			timeout: 10000,
		});
		const value: ProviderEndpoints = {
			issuer: data.issuer,
			authorization_endpoint: data.authorization_endpoint,
			token_endpoint: data.token_endpoint,
			userinfo_endpoint: data.userinfo_endpoint,
			jwks_uri: data.jwks_uri,
			introspection_endpoint: data.introspection_endpoint,
			revocation_endpoint: data.revocation_endpoint,
			device_authorization_endpoint: data.device_authorization_endpoint,
			pushed_authorization_request_endpoint: data.pushed_authorization_request_endpoint,
			backchannel_authentication_endpoint: data.backchannel_authentication_endpoint,
			end_session_endpoint: data.end_session_endpoint,
		};
		discoveryCache.set(issuer, { value, expiresAt: Date.now() + DISCOVERY_TTL_MS });
		return value;
	} catch (error) {
		throw new ConfigError(
			`OIDC discovery failed for ${url}: ${(error as Error).message}`,
			ERROR_CODES.DISCOVERY_FAILED
		);
	}
}

/**
 * Resolve the effective endpoint set for a tool call.
 * Layering (later wins for each individual endpoint that is set):
 *   env defaults  <  PingOne preset  <  OIDC discovery  <  explicit overrides
 */
export async function resolveEndpoints(
	input: ProviderResolutionInput = {}
): Promise<ProviderEndpoints> {
	let resolved: ProviderEndpoints = {};

	// Layer 0: environment-variable defaults
	const envIssuer = process.env.OAUTH_ISSUER_URL?.trim();
	const envPingEnv = process.env.PINGONE_ENVIRONMENT_ID?.trim();
	if (envPingEnv) {
		resolved = { ...resolved, ...pingOneEndpoints({ environmentId: envPingEnv }) };
	}
	if (envIssuer) {
		try {
			resolved = { ...resolved, ...stripEmpty(await discoverEndpoints(envIssuer)) };
		} catch {
			// env default discovery is best-effort; per-call inputs may still supply endpoints
		}
	}

	// Layer 1: explicit PingOne preset
	if (input.pingone?.environmentId) {
		resolved = { ...resolved, ...pingOneEndpoints(input.pingone) };
	}

	// Layer 2: OIDC discovery from an explicit issuer
	if (input.issuerUrl) {
		resolved = { ...resolved, ...stripEmpty(await discoverEndpoints(input.issuerUrl)) };
	}

	// Layer 3: explicit endpoint overrides (highest priority)
	if (input.endpoints) {
		resolved = { ...resolved, ...stripEmpty(input.endpoints) };
	}

	return resolved;
}

/** Drop undefined/empty values so a later layer's real value is not overwritten by an empty one. */
function stripEmpty(obj: Partial<ProviderEndpoints>): Partial<ProviderEndpoints> {
	const out: Record<string, string> = {};
	for (const [k, v] of Object.entries(obj)) {
		if (typeof v === 'string' && v.trim().length > 0) out[k] = v;
	}
	return out as Partial<ProviderEndpoints>;
}

/** Require a specific endpoint, throwing a clear ConfigError naming what to set. */
export function requireEndpoint(
	endpoints: ProviderEndpoints,
	key: keyof ProviderEndpoints,
	humanName: string
): string {
	const value = endpoints[key];
	if (!value) {
		throw new ConfigError(
			`No ${humanName} could be resolved. Provide it via endpoints.${key}, an issuerUrl that advertises it, or a PingOne preset.`,
			ERROR_CODES.MISSING_CONFIG
		);
	}
	return value;
}
