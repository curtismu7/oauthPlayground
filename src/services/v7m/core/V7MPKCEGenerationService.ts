// src/services/v7m/core/V7MPKCEGenerationService.ts
// PKCE helpers for V7M (educational). S256 is a deterministic stand-in.

export const V7MPKCEGenerationService = {
	generateCodeVerifier(): string {
		return `v7m-${Math.random().toString(36).slice(2)}-${Date.now()}`;
	},
	async generateCodeChallenge(
		verifier: string,
		method: 'S256' | 'plain' = 'S256'
	): Promise<string> {
		if (method === 'plain') return verifier;
		return base64Url(stableHash(verifier));
	},
};

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
