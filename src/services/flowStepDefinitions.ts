// src/services/flowStepDefinitions.ts
/**
 * Flow Step Definitions Service
 *
 * Central repository of step definitions for all OAuth/OIDC flows.
 * Used by FlowSequenceDisplay and error handling to show consistent step information.
 */

export interface FlowStep {
	number: number;
	title: string;
	description: string;
	optional?: boolean;
}

export type FlowType =
	| 'authorization-code'
	| 'implicit'
	| 'hybrid'
	| 'device-authorization'
	| 'client-credentials'
	| 'resource-owner-password'
	| 'jwt-bearer'
	| 'saml-bearer'
	| 'par'
	| 'rar'
	| 'redirectless'
	| 'ciba'
	| 'token-introspection'
	| 'token-revocation'
	| 'user-info';

/**
 * Complete step definitions for all flow types
 */
export const FLOW_STEP_DEFINITIONS: Record<FlowType, FlowStep[]> = {
	'authorization-code': [
		{ number: 0, title: 'Setup', description: 'Configure credentials and application settings' },
		{ number: 1, title: 'PKCE', description: 'Generate PKCE code verifier and challenge' },
		{
			number: 2,
			title: 'Authorization',
			description: 'Build authorization URL and redirect to PingOne',
		},
		{ number: 3, title: 'Callback', description: 'Process authorization response and code' },
		{ number: 4, title: 'Exchange', description: 'Exchange authorization code for tokens' },
		{
			number: 5,
			title: 'Introspect',
			description: 'Validate and inspect access token',
			optional: true,
		},
		{
			number: 6,
			title: 'User Info',
			description: 'Fetch user information endpoint',
			optional: true,
		},
		{
			number: 7,
			title: 'Refresh',
			description: 'Refresh access token using refresh token',
			optional: true,
		},
	],

	implicit: [
		{ number: 0, title: 'Setup', description: 'Configure credentials and application settings' },
		{
			number: 1,
			title: 'Authorization',
			description: 'Build authorization URL with token/id_token response',
		},
		{ number: 2, title: 'Redirect', description: 'Redirect to PingOne for authentication' },
		{ number: 3, title: 'Callback', description: 'Process tokens from URL fragment' },
		{ number: 4, title: 'Validate', description: 'Validate tokens and decode JWT' },
		{ number: 5, title: 'Introspect', description: 'Introspect access token', optional: true },
		{ number: 6, title: 'User Info', description: 'Fetch user information', optional: true },
	],

	hybrid: [
		{ number: 0, title: 'Setup', description: 'Configure credentials and application settings' },
		{ number: 1, title: 'PKCE', description: 'Generate PKCE parameters' },
		{
			number: 2,
			title: 'Authorization',
			description: 'Build authorization URL with hybrid response type',
		},
		{ number: 3, title: 'Callback', description: 'Process authorization code and tokens' },
		{
			number: 4,
			title: 'Exchange',
			description: 'Exchange authorization code for additional tokens',
		},
		{ number: 5, title: 'Validate', description: 'Validate all tokens' },
		{ number: 6, title: 'User Info', description: 'Fetch user information', optional: true },
	],

	'device-authorization': [
		{ number: 0, title: 'Setup', description: 'Configure credentials and device settings' },
		{ number: 1, title: 'Device Code', description: 'Request device code and user code' },
		{
			number: 2,
			title: 'User Authorization',
			description: 'Display user code and poll for authorization',
		},
		{ number: 3, title: 'Token Exchange', description: 'Exchange device code for tokens' },
		{ number: 4, title: 'Validate', description: 'Validate tokens and decode JWT' },
		{ number: 5, title: 'User Info', description: 'Fetch user information', optional: true },
	],

	'client-credentials': [
		{ number: 0, title: 'Setup', description: 'Configure client credentials' },
		{
			number: 1,
			title: 'Token Request',
			description: 'Request access token with client credentials',
		},
		{ number: 2, title: 'Validate', description: 'Validate and decode access token' },
		{ number: 3, title: 'Introspect', description: 'Introspect access token', optional: true },
	],

	'resource-owner-password': [
		{ number: 0, title: 'Setup', description: 'Configure credentials and user credentials' },
		{ number: 1, title: 'Token Request', description: 'Request tokens with username and password' },
		{ number: 2, title: 'Validate', description: 'Validate tokens and decode JWT' },
		{ number: 3, title: 'User Info', description: 'Fetch user information', optional: true },
		{ number: 4, title: 'Refresh', description: 'Refresh access token', optional: true },
	],

	'jwt-bearer': [
		{ number: 0, title: 'Setup', description: 'Configure credentials and JWT settings' },
		{ number: 1, title: 'Generate JWT', description: 'Create and sign JWT assertion' },
		{ number: 2, title: 'Token Request', description: 'Exchange JWT for access token' },
		{ number: 3, title: 'Validate', description: 'Validate and decode tokens' },
	],

	'saml-bearer': [
		{ number: 0, title: 'Setup', description: 'Configure credentials and SAML settings' },
		{ number: 1, title: 'SAML Assertion', description: 'Create SAML assertion' },
		{ number: 2, title: 'Token Request', description: 'Exchange SAML assertion for access token' },
		{ number: 3, title: 'Validate', description: 'Validate and decode tokens' },
	],

	par: [
		{ number: 0, title: 'Setup', description: 'Configure credentials' },
		{ number: 1, title: 'PKCE', description: 'Generate PKCE parameters' },
		{ number: 2, title: 'PAR Request', description: 'Push authorization request to PingOne' },
		{ number: 3, title: 'Authorization', description: 'Redirect with request_uri' },
		{ number: 4, title: 'Callback', description: 'Process authorization code' },
		{ number: 5, title: 'Exchange', description: 'Exchange code for tokens' },
		{ number: 6, title: 'Validate', description: 'Validate tokens' },
	],

	rar: [
		{ number: 0, title: 'Setup', description: 'Configure credentials' },
		{ number: 1, title: 'PKCE', description: 'Generate PKCE parameters' },
		{
			number: 2,
			title: 'Authorization Details',
			description: 'Define authorization details (RAR)',
		},
		{ number: 3, title: 'Authorization', description: 'Request authorization with RAR' },
		{ number: 4, title: 'Callback', description: 'Process authorization code' },
		{ number: 5, title: 'Exchange', description: 'Exchange code for tokens' },
		{ number: 6, title: 'Validate', description: 'Validate tokens and authorization details' },
	],

	redirectless: [
		{ number: 0, title: 'Setup', description: 'Configure credentials' },
		{ number: 1, title: 'Initialize', description: 'Initialize redirectless flow' },
		{ number: 2, title: 'Authenticate', description: 'Authenticate without redirect' },
		{ number: 3, title: 'Token Request', description: 'Request tokens' },
		{ number: 4, title: 'Validate', description: 'Validate tokens' },
	],

	ciba: [
		{ number: 0, title: 'Setup', description: 'Configure credentials' },
		{
			number: 1,
			title: 'Authentication Request',
			description: 'Initiate backchannel authentication',
		},
		{ number: 2, title: 'User Authorization', description: 'Wait for user authorization' },
		{ number: 3, title: 'Token Request', description: 'Exchange auth_req_id for tokens' },
		{ number: 4, title: 'Validate', description: 'Validate tokens' },
	],

	'token-introspection': [
		{ number: 0, title: 'Setup', description: 'Configure credentials and token' },
		{ number: 1, title: 'Introspect', description: 'Introspect access token' },
		{ number: 2, title: 'Results', description: 'Review introspection results' },
	],

	'token-revocation': [
		{ number: 0, title: 'Setup', description: 'Configure credentials and token' },
		{ number: 1, title: 'Revoke', description: 'Revoke access or refresh token' },
		{ number: 2, title: 'Verify', description: 'Verify token is revoked' },
	],

	'user-info': [
		{ number: 0, title: 'Setup', description: 'Configure credentials and access token' },
		{ number: 1, title: 'Request', description: 'Request user information' },
		{ number: 2, title: 'Results', description: 'Review user claims' },
	],
};

/**
 * Get step definitions for a specific flow type
 */
export function getFlowSteps(flowType: FlowType): FlowStep[] {
	return FLOW_STEP_DEFINITIONS[flowType] || [];
}

/**
 * Get a specific step by number for a flow type
 */
export function getFlowStep(flowType: FlowType, stepNumber: number): FlowStep | undefined {
	const steps = getFlowSteps(flowType);
	return steps.find((step) => step.number === stepNumber);
}

/**
 * Get the total number of steps for a flow
 */
export function getFlowStepCount(flowType: FlowType): number {
	return getFlowSteps(flowType).length;
}

/**
 * Map flow key to flow type
 * Flow keys are like 'oauth-authorization-code-v6', we need to extract the flow type
 */
export function getFlowTypeFromKey(flowKey: string): FlowType {
	// Remove version suffix
	const baseKey = flowKey.replace(/-(v[0-9]+)$/, '');

	// Remove oauth/oidc prefix
	const cleanKey = baseKey.replace(/^(oauth|oidc)-/, '');

	// Map to flow type
	const typeMap: Record<string, FlowType> = {
		'authorization-code': 'authorization-code',
		implicit: 'implicit',
		hybrid: 'hybrid',
		'device-authorization': 'device-authorization',
		'client-credentials': 'client-credentials',
		'resource-owner-password': 'resource-owner-password',
		'jwt-bearer-token': 'jwt-bearer',
		'saml-bearer-assertion': 'saml-bearer',
		par: 'par',
		rar: 'rar',
		redirectless: 'redirectless',
		ciba: 'ciba',
	};

	return typeMap[cleanKey] || 'authorization-code'; // Default fallback
}

/**
 * Get step status based on current step and completion state
 */
export function getStepStatus(
	stepNumber: number,
	currentStep: number,
	hasError: boolean = false
): 'completed' | 'current' | 'error' | 'upcoming' {
	if (hasError && stepNumber === currentStep) {
		return 'error';
	}
	if (stepNumber < currentStep) {
		return 'completed';
	}
	if (stepNumber === currentStep) {
		return 'current';
	}
	return 'upcoming';
}

export default {
	FLOW_STEP_DEFINITIONS,
	getFlowSteps,
	getFlowStep,
	getFlowStepCount,
	getFlowTypeFromKey,
	getStepStatus,
};
