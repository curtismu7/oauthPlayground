// src/services/v7m/core/V9MockFlowCredentialService.ts
// Minimal credential storage for V7M flows (isolated keys)
export type V9MockCredentials = {
	environmentId?: string;
	clientId?: string;
	clientSecret?: string;
	redirectUri?: string;
	scopes?: string[];
	userEmail?: string;
};

const KEY = 'v7m:credentials';

export const V9MockFlowCredentialService = {
	load(): V9MockCredentials {
		if (typeof window === 'undefined') return {};
		try {
			const raw = window.localStorage.getItem(KEY);
			return raw ? (JSON.parse(raw) as V9MockCredentials) : {};
		} catch {
			return {};
		}
	},
	save(creds: V9MockCredentials): void {
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
