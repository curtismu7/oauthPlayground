// src/pages/flows/PingOnePARFlowV8/types/parFlowTypes.ts
// PAR Flow V8 Types - Based on Authorization Code Flow V7.1 pattern

import type { StepCredentials } from '../../../../components/steps/CommonSteps';

export type FlowVariant = 'oauth' | 'oidc';

export interface PARFlowState {
	currentStep: number;
	flowVariant: FlowVariant;
	collapsedSections: Record<string, boolean>;
	parRequestUri: string | null;
	parExpiresIn: number | null;
	authCode: string | null;
}

export interface PKCECodes {
	codeVerifier: string;
	codeChallenge: string;
	codeChallengeMethod: string;
}

export interface PARRequest {
	clientId: string;
	clientSecret?: string;
	environmentId: string;
	responseType: string;
	redirectUri: string;
	scope: string;
	state: string;
	nonce?: string;
	codeChallenge?: string;
	codeChallengeMethod?: string;
	[key: string]: any;
}

export interface PARResponse {
	request_uri: string;
	expires_in: number;
}

export interface TokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token?: string;
	id_token?: string;
	scope?: string;
}

export interface UserInfo {
	sub: string;
	name?: string;
	given_name?: string;
	family_name?: string;
	email?: string;
	email_verified?: boolean;
	[key: string]: any;
}

export interface FlowCredentials extends StepCredentials {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scope: string;
}

export interface StepCompletionState {
	[step: number]: boolean;
}
