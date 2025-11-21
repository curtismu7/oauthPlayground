// src/services/v7m/core/V7MFlowCredentialService.ts
// Minimal credential storage for V7M flows (isolated keys)
export type V7MCredentials = {
	environmentId?: string;
	clientId?: string;
	clientSecret?: string;
	redirectUri?: string;
	scopes?: string[];
	userEmail?: string;
};

const KEY = 'v7m:credentials';

export const V7MFlowCredentialService = {
	load(): V7MCredentials {
		if (typeof window === 'undefined') return {};
		try {
			const raw = window.localStorage.getItem(KEY);
			return raw ? (JSON.parse(raw) as V7MCredentials) : {};
		} catch {
			return {};
		}
	},
	save(creds: V7MCredentials): void {
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
