/**
 * Shared helpers for action tools: a common set of provider-location input fields
 * (so every flow tool accepts issuerUrl / PingOne preset / explicit endpoint overrides
 * the same way) and a mapper into ProviderResolutionInput.
 */

import { z } from 'zod';
import {
	resolveEndpoints,
	type ProviderEndpoints,
	type ProviderResolutionInput,
} from './providerConfig.js';

/**
 * Zod fields every flow tool spreads into its inputShape to locate endpoints.
 * Spread like: `const inputShape = { ...providerInputShape, code: z.string(), ... }`.
 */
export const providerInputShape = {
	issuerUrl: z
		.string()
		.trim()
		.optional()
		.describe('OIDC issuer URL; endpoints are discovered from its .well-known document.'),
	pingoneEnvironmentId: z
		.string()
		.trim()
		.optional()
		.describe('PingOne environment UUID (convenience preset; endpoints computed from it).'),
	pingoneRegion: z
		.string()
		.trim()
		.optional()
		.describe('PingOne region suffix: com (US, default) | eu | ca | asia.'),
	tokenEndpoint: z.string().trim().optional().describe('Explicit token endpoint override.'),
	authorizationEndpoint: z
		.string()
		.trim()
		.optional()
		.describe('Explicit authorization endpoint override.'),
	jwksUri: z.string().trim().optional().describe('Explicit JWKS URI override.'),
	userinfoEndpoint: z.string().trim().optional().describe('Explicit userinfo endpoint override.'),
	introspectionEndpoint: z
		.string()
		.trim()
		.optional()
		.describe('Explicit introspection endpoint override.'),
	revocationEndpoint: z
		.string()
		.trim()
		.optional()
		.describe('Explicit revocation endpoint override.'),
	deviceAuthorizationEndpoint: z
		.string()
		.trim()
		.optional()
		.describe('Explicit device authorization endpoint override.'),
	parEndpoint: z
		.string()
		.trim()
		.optional()
		.describe('Explicit pushed authorization request (PAR) endpoint override.'),
	backchannelAuthenticationEndpoint: z
		.string()
		.trim()
		.optional()
		.describe('Explicit CIBA backchannel authentication endpoint override.'),
} as const;

/** Subset of parsed args carrying provider-location fields. */
export interface ProviderArgs {
	issuerUrl?: string;
	pingoneEnvironmentId?: string;
	pingoneRegion?: string;
	tokenEndpoint?: string;
	authorizationEndpoint?: string;
	jwksUri?: string;
	userinfoEndpoint?: string;
	introspectionEndpoint?: string;
	revocationEndpoint?: string;
	deviceAuthorizationEndpoint?: string;
	parEndpoint?: string;
	backchannelAuthenticationEndpoint?: string;
}

/** Map flat tool args into a ProviderResolutionInput. */
export function toResolutionInput(args: ProviderArgs): ProviderResolutionInput {
	const endpoints: Partial<ProviderEndpoints> = {};
	if (args.tokenEndpoint) endpoints.token_endpoint = args.tokenEndpoint;
	if (args.authorizationEndpoint) endpoints.authorization_endpoint = args.authorizationEndpoint;
	if (args.jwksUri) endpoints.jwks_uri = args.jwksUri;
	if (args.userinfoEndpoint) endpoints.userinfo_endpoint = args.userinfoEndpoint;
	if (args.introspectionEndpoint) endpoints.introspection_endpoint = args.introspectionEndpoint;
	if (args.revocationEndpoint) endpoints.revocation_endpoint = args.revocationEndpoint;
	if (args.deviceAuthorizationEndpoint)
		endpoints.device_authorization_endpoint = args.deviceAuthorizationEndpoint;
	if (args.parEndpoint) endpoints.pushed_authorization_request_endpoint = args.parEndpoint;
	if (args.backchannelAuthenticationEndpoint)
		endpoints.backchannel_authentication_endpoint = args.backchannelAuthenticationEndpoint;

	return {
		issuerUrl: args.issuerUrl,
		pingone: args.pingoneEnvironmentId
			? { environmentId: args.pingoneEnvironmentId, region: args.pingoneRegion }
			: undefined,
		endpoints: Object.keys(endpoints).length ? endpoints : undefined,
	};
}

/** Convenience: resolve endpoints directly from flat tool args. */
export function resolveFromArgs(args: ProviderArgs): Promise<ProviderEndpoints> {
	return resolveEndpoints(toResolutionInput(args));
}
