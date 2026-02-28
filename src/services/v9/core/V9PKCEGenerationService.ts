// src/services/v9/core/V9PKCEGenerationService.ts
// PKCE helpers for V9 flows. Supports real WebCrypto SHA-256 for production
// and a deterministic fallback for educational/test environments.
//
// Migrated from V7MPKCEGenerationService.ts — added real WebCrypto support.

export const V9PKCEGenerationService = {
	generateCodeVerifier(): string {
		// Use crypto.getRandomValues when available for real entropy
		if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
			const array = new Uint8Array(32);
			window.crypto.getRandomValues(array);
			return base64UrlFromBytes(array);
		}
		// Fallback for environments without WebCrypto
		return `v9-${Math.random().toString(36).slice(2)}-${Date.now()}`;
	},

	async generateCodeChallenge(
		verifier: string,
		method: 'S256' | 'plain' = 'S256'
	): Promise<string> {
		if (method === 'plain') return verifier;
		// Use real SHA-256 via WebCrypto when available
		if (typeof window !== 'undefined' && window.crypto?.subtle) {
			const encoder = new TextEncoder();
			const data = encoder.encode(verifier);
			const digest = await window.crypto.subtle.digest('SHA-256', data);
			return base64UrlFromBytes(new Uint8Array(digest));
		}
		// Deterministic fallback
		return base64Url(stableHash(verifier));
	},
};

function base64UrlFromBytes(bytes: Uint8Array): string {
	let binary = '';
	for (const b of bytes) binary += String.fromCharCode(b);
	return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function stableHash(input: string): string {
	let h = 0x811c9dc5;
	for (let i = 0; i < input.length; i++) {
		h ^= input.charCodeAt(i);
		h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
	}
	return h.toString(16).padStart(8, '0');
}

function base64Url(input: string): string {
	const b64 = Buffer.from(input, 'utf8').toString('base64');
	return b64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
