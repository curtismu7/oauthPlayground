// src/services/v7m/V7MStateStore.ts
// Ephemeral in-memory + sessionStorage-backed store for V7M mock flows.
// Tracks authorization codes, tokens, nonces with expirations and safe consumption.

export type V7MAuthorizationCodeRecord = {
	code: string;
	clientId: string;
	redirectUri: string;
	scope: string;
	state?: string;
	nonce?: string;
	codeChallenge?: string;
	codeChallengeMethod?: 'S256' | 'plain';
	userEmail?: string;
	userId?: string;
	createdAt: number; // epoch seconds
	expiresAt: number; // epoch seconds
	consumed: boolean;
};

export type V7MTokenRecord = {
	accessToken: string;
	refreshToken?: string;
	clientId: string;
	scope: string;
	subject: string;
	issuedAt: number;
	expiresAt: number;
};

export type V7MDeviceCodeRecord = {
	deviceCode: string;
	userCode: string;
	clientId: string;
	scope: string;
	userEmail?: string;
	userId?: string;
	createdAt: number; // epoch seconds
	expiresAt: number; // epoch seconds
	approved: boolean;
	interval: number; // polling interval in seconds
};

type StoreShape = {
	authCodes: Record<string, V7MAuthorizationCodeRecord>;
	tokens: Record<string, V7MTokenRecord>;
	deviceCodes: Record<string, V7MDeviceCodeRecord>;
};

const SESSION_KEY = 'v7m:state';
let memoryStore: StoreShape = loadFromSession();

export const V7MStateStore = {
	// Authorization Codes
	saveAuthorizationCode(record: V7MAuthorizationCodeRecord): void {
		memoryStore.authCodes[record.code] = record;
		persist();
	},
	getAuthorizationCode(code: string): V7MAuthorizationCodeRecord | undefined {
		const rec = memoryStore.authCodes[code];
		if (!rec) return undefined;
		if (isExpired(rec.expiresAt)) {
			delete memoryStore.authCodes[code];
			persist();
			return undefined;
		}
		return rec;
	},
	consumeAuthorizationCode(code: string): V7MAuthorizationCodeRecord | undefined {
		const rec = this.getAuthorizationCode(code);
		if (!rec) return undefined;
		if (rec.consumed) return undefined;
		rec.consumed = true;
		persist();
		return rec;
	},

	// Tokens
	saveToken(key: string, record: V7MTokenRecord): void {
		memoryStore.tokens[key] = record;
		persist();
	},
	getToken(key: string): V7MTokenRecord | undefined {
		const rec = memoryStore.tokens[key];
		if (!rec) return undefined;
		if (isExpired(rec.expiresAt)) {
			delete memoryStore.tokens[key];
			persist();
			return undefined;
		}
		return rec;
	},
	deleteToken(key: string): void {
		delete memoryStore.tokens[key];
		persist();
	},

	// Device Codes (RFC 8628)
	saveDeviceCode(record: V7MDeviceCodeRecord): void {
		memoryStore.deviceCodes[record.deviceCode] = record;
		persist();
	},
	getDeviceCode(deviceCode: string): V7MDeviceCodeRecord | undefined {
		const rec = memoryStore.deviceCodes[deviceCode];
		if (!rec) return undefined;
		if (isExpired(rec.expiresAt)) {
			delete memoryStore.deviceCodes[deviceCode];
			persist();
			return undefined;
		}
		return rec;
	},
	getDeviceCodeByUserCode(userCode: string): V7MDeviceCodeRecord | undefined {
		for (const rec of Object.values(memoryStore.deviceCodes)) {
			if (rec.userCode === userCode && !isExpired(rec.expiresAt)) {
				return rec;
			}
		}
		return undefined;
	},
	approveDeviceCode(deviceCode: string): boolean {
		const rec = this.getDeviceCode(deviceCode);
		if (!rec) return false;
		rec.approved = true;
		persist();
		return true;
	},
	deleteDeviceCode(deviceCode: string): void {
		delete memoryStore.deviceCodes[deviceCode];
		persist();
	},

	// Housekeeping
	cleanup(): void {
		const now = nowSeconds();
		for (const [code, rec] of Object.entries(memoryStore.authCodes)) {
			if (rec.expiresAt <= now) delete memoryStore.authCodes[code];
		}
		for (const [k, rec] of Object.entries(memoryStore.tokens)) {
			if (rec.expiresAt <= now) delete memoryStore.tokens[k];
		}
		for (const [dc, rec] of Object.entries(memoryStore.deviceCodes)) {
			if (rec.expiresAt <= now) delete memoryStore.deviceCodes[dc];
		}
		persist();
	},
	clearAll(): void {
		memoryStore = { authCodes: {}, tokens: {}, deviceCodes: {} };
		persist();
	},
};

function nowSeconds(): number {
	return Math.floor(Date.now() / 1000);
}

function isExpired(expiresAt: number): boolean {
	return expiresAt <= nowSeconds();
}

function loadFromSession(): StoreShape {
	if (typeof window === 'undefined') {
		return { authCodes: {}, tokens: {}, deviceCodes: {} };
	}
	try {
		const raw = window.sessionStorage.getItem(SESSION_KEY);
		if (!raw) return { authCodes: {}, tokens: {}, deviceCodes: {} };
		const parsed = JSON.parse(raw) as StoreShape;
		return parsed ?? { authCodes: {}, tokens: {}, deviceCodes: {} };
	} catch {
		return { authCodes: {}, tokens: {}, deviceCodes: {} };
	}
}

function persist(): void {
	if (typeof window === 'undefined') return;
	try {
		window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(memoryStore));
	} catch {
		// ignore
	}
}
