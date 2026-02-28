// src/services/v9/core/V9FlowCredentialService.ts
// Credential storage for V9 flows (isolated localStorage key).
//
// Migrated from V7MFlowCredentialService.ts — updated key prefix to v9.

export type V9Credentials = {
	environmentId?: string;
	clientId?: string;
	clientSecret?: string;
	redirectUri?: string;
	scopes?: string[];
	userEmail?: string;
};

const KEY = 'v9:credentials';

export const V9FlowCredentialService = {
	load(): V9Credentials {
		if (typeof window === 'undefined') return {};
		try {
			const raw = window.localStorage.getItem(KEY);
			return raw ? (JSON.parse(raw) as V9Credentials) : {};
		} catch {
			return {};
		}
	},
	save(creds: V9Credentials): void {
		if (typeof window === 'undefined') return;
		try {
			window.localStorage.setItem(KEY, JSON.stringify(creds));
		} catch {
			// ignore
		}
	},
	clear(): void {
		if (typeof window === 'undefined') return;
		try {
			window.localStorage.removeItem(KEY);
		} catch {
			// ignore
		}
	},
};
