export type JsonPrimitive = string | number | boolean | null | undefined;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = Array<JsonValue>;

export interface StorageInterface {
	setItem: <T = JsonValue>(key: string, value: T) => void;
	getItem: <T = JsonValue>(key: string, defaultValue?: T | null) => T | null;
	removeItem: (key: string) => void;
	clear: () => void;
}

// Base OAuth 2.0 token response according to RFC 6749
export interface OAuthTokenResponse {
	access_token: string;
	token_type: string;
	expires_in?: number;
	refresh_token?: string;
	scope?: string;
	[key: string]: unknown; // Allow additional properties
}

// Extended token response that includes ID token and timestamps
export interface OAuthTokens extends OAuthTokenResponse {
	id_token?: string;
	expires_at?: number; // Timestamp when the access token expires
	refresh_expires_at?: number; // Timestamp when the refresh token expires
}

// User information from the UserInfo endpoint (OpenID Connect)
export interface UserInfo {
	// Required subject identifier
	sub: string;

	// Standard claims (OpenID Connect Core 1.0)
	name?: string;
	given_name?: string;
	family_name?: string;
	middle_name?: string;
	nickname?: string;
	preferred_username?: string;
	profile?: string;
	picture?: string;
	website?: string;
	email?: string;
	email_verified?: boolean;
	gender?: string;
	birthdate?: string;
	zoneinfo?: string;
	locale?: string;
	phone_number?: string;
	phone_number_verified?: boolean;
	address?: {
		formatted?: string;
		street_address?: string;
		locality?: string;
		region?: string;
		postal_code?: string;
		country?: string;
	};

	// Allow additional claims
	[key: string]: unknown;
}

export interface OAuthConfig extends JsonObject {
	client_id?: string;
	client_secret?: string;
	redirect_uri?: string;
	authorization_endpoint?: string;
	token_endpoint?: string;
	userinfo_endpoint?: string;
	end_session_endpoint?: string;
	[key: string]: JsonValue | undefined;
}

export interface OAuthStorage {
	// Base storage methods
	setItem: <T extends JsonValue = JsonValue>(key: string, value: T) => boolean;
	getItem: <T extends JsonValue = JsonValue>(key: string, defaultValue?: T | null) => T | null;
	removeItem: (key: string) => boolean;
	clear: () => void;

	// State management
	setState: (state: string) => boolean;
	getState: () => string | null;
	clearState: () => boolean;

	// Nonce management
	setNonce: (nonce: string) => boolean;
	getNonce: () => string | null;
	clearNonce: () => boolean;

	// PKCE code verifier
	setCodeVerifier: (verifier: string) => boolean;
	getCodeVerifier: () => string | null;
	clearCodeVerifier: () => boolean;

	// Token management
	setTokens: (tokens: OAuthTokenResponse) => boolean;
	getTokens: () => OAuthTokenResponse | null;
	clearTokens: () => boolean;

	// User info
	setUserInfo: (userInfo: UserInfo) => boolean;
	getUserInfo: () => UserInfo | null;
	clearUserInfo: () => boolean;

	// Configuration
	setConfig: (config: OAuthConfig) => boolean;
	getConfig: () => OAuthConfig | null;
	clearConfig: () => boolean;

	// Session management
	setSessionStartTime: (timestamp: number) => boolean;
	getSessionStartTime: () => number | null;
	clearSessionStartTime: () => boolean;

	// Clear all storage
	clearAll: () => void;
}
