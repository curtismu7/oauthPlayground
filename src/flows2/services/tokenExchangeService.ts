// src/flows2/services/tokenExchangeService.ts
//
// Token Exchange grant (RFC 8693) as a flows2 service.
// real mode → POST the BFF /api/pingone/token-exchange proxy, which validates may_act
//             delegation (when an actor token is supplied) and forwards to PingOne.
// mock mode → return a deterministic exchanged token offline, for teaching the
//             subject/actor + act-claim mechanics without live tokens.

import type { FlowCredentials, FlowMode, TokenResult } from '../framework/types';
import { decodeJwtPayload } from './pingone';
import { tokenIntrospectionService } from './tokenIntrospectionService';

export interface TokenExchangeParams {
	credentials: FlowCredentials;
	/** RFC 8693 §2.1 subject_token — the token being exchanged (whose identity is preserved). */
	subjectToken: string;
	/** Optional actor_token — the delegate acting on the subject's behalf (drives the act claim). */
	actorToken?: string;
	/** Optional narrowed scope for the issued token. */
	requestedScopes?: string;
	/** Optional RFC 8707 audience / resource indicator. */
	audience?: string;
	authMethod?: string;
	tokenLifetimes?: {
		accessTokenSeconds?: number;
		idTokenSeconds?: number;
		refreshTokenSeconds?: number;
	};
}

/** Result of validating a subject+actor pair against the subject's may_act rule. */
export interface MayActResult {
	valid: boolean;
	actClaim?: Record<string, unknown> | null;
	error?: string;
	errorDescription?: string;
	diagnostics?: Record<string, unknown>;
}

function toTokenResult(data: Record<string, unknown>): TokenResult {
	return {
		accessToken: typeof data.access_token === 'string' ? data.access_token : undefined,
		tokenType: typeof data.token_type === 'string' ? data.token_type : undefined,
		expiresIn: typeof data.expires_in === 'number' ? data.expires_in : undefined,
		scope: typeof data.scope === 'string' ? data.scope : undefined,
		idToken: typeof data.id_token === 'string' ? data.id_token : undefined,
		refreshToken: typeof data.refresh_token === 'string' ? data.refresh_token : undefined,
		raw: data,
	};
}

/** Local stand-in for the BFF's may_act check: the subject's may_act must name the actor. */
function mockValidateMayAct(subjectToken: string, actorToken: string): MayActResult {
	const subject = decodeJwtPayload(subjectToken);
	const actor = decodeJwtPayload(actorToken);
	if (!subject || !actor) {
		return {
			valid: false,
			error: 'invalid_token',
			errorDescription: 'Unable to decode subject_token or actor_token — tokens may be malformed.',
			diagnostics: { subject: null, actor: null },
		};
	}
	const mayAct = (subject.may_act as Record<string, unknown> | undefined) || undefined;
	const actorSub = actor.sub;
	const actorClient = actor.client_id ?? actor.azp;
	const diagnostics = {
		subject: { sub: subject.sub ?? null, may_act: mayAct ?? null },
		actor: { sub: actorSub ?? null, client_id: actorClient ?? null },
	};
	if (!mayAct) {
		return {
			valid: false,
			error: 'invalid_request',
			errorDescription: 'subject_token has no may_act claim — delegation is not permitted.',
			diagnostics,
		};
	}
	const matches = (mayAct.sub == null || mayAct.sub === actorSub) &&
		(mayAct.client_id == null || mayAct.client_id === actorClient);
	if (!matches) {
		return {
			valid: false,
			error: 'invalid_actor',
			errorDescription: 'actor identity does not match the subject_token may_act constraint.',
			diagnostics,
		};
	}
	return { valid: true, actClaim: { sub: actorSub, client_id: actorClient }, diagnostics };
}

export const tokenExchangeService = {
	/** RFC 8693 §2 — exchange a subject (and optional actor) token for a narrowed/delegated token. */
	async run({ credentials, subjectToken, actorToken, requestedScopes, audience }: TokenExchangeParams, mode: FlowMode): Promise<TokenResult> {
		if (mode === 'mock') {
			const now = Math.floor(Date.now() / 1000);
			const subject = decodeJwtPayload(subjectToken) || {};
			const actor = actorToken ? decodeJwtPayload(actorToken) || {} : null;
			const claims: Record<string, unknown> = {
				sub: subject.sub ?? 'mock-subject',
				aud: audience || credentials.clientId,
				scope: requestedScopes || subject.scope || 'openid profile',
				iat: now,
				exp: now + 3600,
				iss: `https://auth.pingone.${credentials.region}/${credentials.environmentId}/as`,
				token_use: 'mock',
			};
			if (actor) {
				claims.act = { sub: actor.sub, client_id: actor.client_id ?? actor.azp };
			}
			const fake = `${btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))}.${btoa(JSON.stringify(claims))}.`;
			return toTokenResult({
				access_token: fake,
				issued_token_type: 'urn:ietf:params:oauth:token-type:access_token',
				token_type: 'Bearer',
				expires_in: 3600,
				scope: claims.scope,
				...(actor ? { act: claims.act } : {}),
				_mock: true,
			});
		}

		const res = await fetch('/api/pingone/token-exchange', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				environmentId: credentials.environmentId,
				region: credentials.region,
				clientId: credentials.clientId,
				clientSecret: credentials.clientSecret,
				subjectToken,
				...(actorToken ? { actorToken } : {}),
				...(requestedScopes?.trim() ? { requestedScopes: requestedScopes.trim() } : {}),
				...(audience?.trim() ? { audience: audience.trim() } : {}),
			}),
		});
		let data: Record<string, unknown> = {};
		try {
			data = (await res.json()) as Record<string, unknown>;
		} catch {
			throw {
				error: 'invalid_response',
				error_description: `Token exchange failed (HTTP ${res.status}) — response was not valid JSON`,
				status: res.status,
			};
		}
		if (!res.ok || data.error) {
			throw {
				error: (data.error as string) || 'token_exchange_failed',
				error_description: (data.error_description as string) || `Token exchange failed (HTTP ${res.status})`,
				status: res.status,
			};
		}
		return toTokenResult(data);
	},

	/** RFC 8693 §2.1 may_act check — surfaces whether the actor may act for the subject. */
	async validateMayAct(subjectToken: string, actorToken: string, mode: FlowMode): Promise<MayActResult> {
		if (mode === 'mock') return mockValidateMayAct(subjectToken, actorToken);
		const res = await fetch('/api/may-act/validate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ subject_token: subjectToken, actor_token: actorToken }),
		});
		let data: Record<string, unknown> = {};
		try {
			data = (await res.json()) as Record<string, unknown>;
		} catch {
			return {
				valid: false,
				actClaim: null,
				error: 'invalid_response',
			};
		}
		return {
			valid: Boolean(data.valid),
			actClaim: (data.act_claim as Record<string, unknown>) ?? null,
			error: typeof data.error === 'string' ? data.error : undefined,
			errorDescription: typeof data.error_description === 'string' ? data.error_description : undefined,
			diagnostics: (data.diagnostics as Record<string, unknown>) ?? undefined,
		};
	},

	/** RFC 7662 introspection of the exchanged token — delegates to the introspection service.
	 *  Errors come back as data: the inspect step renders the JSON either way. */
	async introspect(accessToken: string, credentials: FlowCredentials, mode: FlowMode): Promise<Record<string, unknown>> {
		return tokenIntrospectionService
			.run({ credentials, token: accessToken }, mode)
			.catch((e) => e as Record<string, unknown>);
	},
};
