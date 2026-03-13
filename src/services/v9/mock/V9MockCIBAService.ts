// src/services/v7m/V9MockCIBAService.ts
// CIBA (Client Initiated Backchannel Authentication) simulator for V7M educational flows.
// Implements OpenID Connect CIBA Core 1.0 in-browser mock — no external API calls.

import {
	generateV9MockTokens,
	type V9MockTokenSeed,
	type V9MockTokenTtls,
} from './V9MockTokenGenerator';

export type V9MockCIBADeliveryMode = 'poll' | 'ping' | 'push';

export type V9MockCIBABackchannelRequest = {
	client_id: string;
	scope: string;
	login_hint?: string;
	id_token_hint?: string;
	user_email?: string;
	binding_message?: string;
	delivery_mode?: V9MockCIBADeliveryMode;
};

export type V9MockCIBABackchannelResponse =
	| { auth_req_id: string; expires_in: number; interval: number }
	| { error: string; error_description?: string };

export type V9MockCIBATokenResult =
	| {
			access_token: string;
			id_token: string;
			token_type: 'Bearer';
			expires_in: number;
			scope?: string;
	  }
	| { error: 'authorization_pending'; error_description: string }
	| { error: 'expired_token'; error_description: string }
	| { error: string; error_description?: string };

type CIBARecord = {
	auth_req_id: string;
	client_id: string;
	scope: string;
	login_hint?: string;
	user_email?: string;
	binding_message?: string;
	delivery_mode: V9MockCIBADeliveryMode;
	approved: boolean;
	expiresAt: number; // epoch seconds
	interval: number; // polling interval seconds
};

// In-memory store (lives as long as the page session)
const store = new Map<string, CIBARecord>();
let _counter = 0;

function generateAuthReqId(clientId: string): string {
	_counter += 1;
	// Deterministic-looking ID derived from clientId + timestamp + counter
	const input = `ciba.${clientId}.${Date.now()}.${_counter}`;
	let h = 0x811c9dc5;
	for (let i = 0; i < input.length; i++) {
		h ^= input.charCodeAt(i);
		h = Math.imul(h, 0x01000193) >>> 0;
	}
	return `v7m-ciba-${h.toString(16).padStart(8, '0')}-${_counter.toString(16).padStart(4, '0')}`;
}

export const V9MockCIBAService = {
	/**
	 * Simulate the backchannel authentication endpoint (BC-Authorize).
	 * Returns auth_req_id that the client polls with.
	 */
	requestBackchannelAuth(
		req: V9MockCIBABackchannelRequest,
		expiresInSeconds = 120,
		intervalSeconds = 5
	): V9MockCIBABackchannelResponse {
		if (!req.client_id) {
			return { error: 'invalid_request', error_description: 'client_id is required' };
		}
		if (!req.scope) {
			return { error: 'invalid_request', error_description: 'scope is required' };
		}
		if (!req.login_hint && !req.user_email && !req.id_token_hint) {
			return {
				error: 'invalid_request',
				error_description: 'login_hint or user_email is required to identify the user',
			};
		}

		const auth_req_id = generateAuthReqId(req.client_id);
		const now = Math.floor(Date.now() / 1000);

		const record: CIBARecord = {
			auth_req_id,
			client_id: req.client_id,
			scope: req.scope,
			login_hint: req.login_hint,
			user_email: req.user_email ?? req.login_hint ?? undefined,
			binding_message: req.binding_message,
			delivery_mode: req.delivery_mode ?? 'poll',
			approved: false,
			expiresAt: now + expiresInSeconds,
			interval: intervalSeconds,
		};
		store.set(auth_req_id, record);

		return { auth_req_id, expires_in: expiresInSeconds, interval: intervalSeconds };
	},

	/**
	 * Simulate the user authenticating on their out-of-band device.
	 * In a real flow, this happens on the user's phone via a push notification.
	 */
	approveRequest(auth_req_id: string): boolean {
		const rec = store.get(auth_req_id);
		if (!rec) return false;
		if (Math.floor(Date.now() / 1000) > rec.expiresAt) {
			store.delete(auth_req_id);
			return false;
		}
		rec.approved = true;
		return true;
	},

	/**
	 * Simulate the token endpoint poll (grant_type = urn:openid:params:grant-type:ciba).
	 * Returns tokens if approved, or authorization_pending / expired_token errors.
	 */
	pollForToken(auth_req_id: string, ttls?: Partial<V9MockTokenTtls>): V9MockCIBATokenResult {
		const rec = store.get(auth_req_id);
		const now = Math.floor(Date.now() / 1000);

		if (!rec) {
			return {
				error: 'expired_token',
				error_description: 'auth_req_id not found or already consumed',
			};
		}
		if (now > rec.expiresAt) {
			store.delete(auth_req_id);
			return { error: 'expired_token', error_description: 'The auth_req_id has expired' };
		}
		if (!rec.approved) {
			return {
				error: 'authorization_pending',
				error_description: 'The end-user authentication and authorization is pending',
			};
		}

		const defaultTtls: V9MockTokenTtls = {
			accessTokenSeconds: 3600,
			idTokenSeconds: 3600,
			refreshTokenSeconds: 86400,
		};
		const resolvedTtls = { ...defaultTtls, ...(ttls ?? {}) };

		const seed: V9MockTokenSeed = {
			clientId: rec.client_id,
			issuer: 'https://mock.issuer/v7m/ciba',
			userEmail: rec.user_email ?? rec.login_hint ?? 'user@example.com',
			scope: rec.scope,
		};

		const tokens = generateV9MockTokens(seed, now, resolvedTtls, true);
		store.delete(auth_req_id); // consume — each auth_req_id is single-use

		return {
			access_token: tokens.access_token,
			id_token: tokens.id_token as string,
			token_type: 'Bearer',
			expires_in: resolvedTtls.accessTokenSeconds,
			scope: rec.scope,
		};
	},

	/** Check if a request exists and is not yet expired (for UI display). */
	getStatus(auth_req_id: string): 'pending' | 'approved' | 'expired' | 'not_found' {
		const rec = store.get(auth_req_id);
		if (!rec) return 'not_found';
		if (Math.floor(Date.now() / 1000) > rec.expiresAt) return 'expired';
		return rec.approved ? 'approved' : 'pending';
	},
};
