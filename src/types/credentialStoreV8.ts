export interface V8AppConfig {
	appId: string; // internal ID for the tool
	label: string; // "My SPA App"
	name?: string; // Optional display name
	id?: string; // Optional external ID
	environmentId: string; // PingOne envId
	clientId: string;
	clientSecret?: string; // Optional for public clients
	defaultRedirectUri?: string;
	redirectUris?: string[];
	logoutUris?: string[];
	scopes?: string[]; // OAuth scopes for the app
	// For cross-flow use (Authz/PAR/etc.)
	tokenEndpointAuthMethods?: string[]; // e.g. ["none", "client_secret_basic"]
}

export interface V8WorkerToken {
	environmentId: string;
	accessToken: string;
	expiresAt: number; // epoch ms
}

export interface V8CredentialStoreState {
	apps: V8AppConfig[];
	selectedAppId?: string;
	workerTokens: V8WorkerToken[];
}
