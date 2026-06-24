// src/flows2/framework/types.ts
//
// Core contracts for the flows2 clean-core rebuild. A flow is declarative config
// (steps + a service) rendered by the shared framework. OAuth logic lives in a
// service behind OAuthFlowService — `mode` picks real PingOne vs mock, so swapping
// is a prop, never a rewrite.

export type FlowMode = 'real' | 'mock';

export type OAuthSpec = '2.0' | '2.1';

/** Client-auth method at the token endpoint (RFC 6749 §2.3 / RFC 7617). */
export type ClientAuthMethod = 'client_secret_post' | 'client_secret_basic';

/** Credentials a flow needs to talk to PingOne (or any OIDC issuer). */
export interface FlowCredentials {
	environmentId: string;
	region: string; // com | eu | ca | asia
	clientId: string;
	clientSecret?: string;
	scope?: string;
	authMethod?: ClientAuthMethod;
}

/** Normalized token-endpoint result (RFC 6749 §5.1 + common OIDC fields). */
export interface TokenResult {
	accessToken?: string;
	tokenType?: string;
	expiresIn?: number;
	scope?: string;
	idToken?: string;
	refreshToken?: string;
	raw: Record<string, unknown>;
}

/** A flow's service: same call shape, real or mock chosen by `mode`. */
export interface OAuthFlowService<TParams, TResult> {
	run(params: TParams, mode: FlowMode): Promise<TResult>;
}

/** One step in a multi-step flow. */
export interface StepDefinition {
	id: string;
	title: string;
	/** Short subtitle shown under the title. */
	subtitle?: string;
	/** Description explaining what this step does. */
	description?: string;
}

/** OAuth error surfaced to the UI (RFC 6749 §5.2 shape). */
export interface FlowError {
	error: string;
	error_description?: string;
	status?: number;
}
