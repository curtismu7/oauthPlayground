// src/services/postmanGeneratorService.ts
import { v4 as uuidv4 } from 'uuid';
import { generateCodeChallenge, generateCodeVerifier } from '../utils/oauth';

export type PostmanRegion = 'NA' | 'EU' | 'AP';

export type SupportedPostmanFlow =
	| 'authorization-code-pkce'
	| 'authorization-code-client-secret'
	| 'authorization-code-redirectless'
	| 'hybrid'
	| 'implicit'
	| 'client-credentials'
	| 'device-authorization'
	| 'jwt-bearer'
	| 'token-exchange';

export interface WizardCommonAnswers {
	region: PostmanRegion;
	environmentId: string;
	authHost: string;
	apiHost: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	responseType: string;
	tokenAuthMethod: 'none' | 'client_secret_basic' | 'client_secret_post';
	scopes: string;
	includeUserInfo: boolean;
	includeIntrospect: boolean;
	includeRevoke: boolean;
	includeLogout: boolean;
	enablePAR: boolean;
	enableRAR: boolean;
	enableTokenExchange: boolean;
	enableRedirectless: boolean;
}

export interface FlowSpecificAnswers {
	audience?: string;
	username?: string;
	password?: string;
	mfa_code?: string;
	pollIntervalSeconds?: number;
	iss?: string;
	sub?: string;
	aud?: string;
	kid?: string;
	privateKey?: string;
	assertionLifetimeSeconds?: number;
	subjectToken?: string;
	subjectTokenType?: string;
	actorToken?: string;
	requestedTokenType?: string;
	exchangeAudience?: string;
	parPayload?: string;
	rarPayload?: string;
}

export interface WizardState {
	flowType: SupportedPostmanFlow;
	common: WizardCommonAnswers;
	flowSpecific: FlowSpecificAnswers;
}

export interface PostmanArtifactResult {
	collection: Record<string, unknown>;
	environment: Record<string, unknown>;
	collectionFileName: string;
	environmentFileName: string;
}

interface RegionHosts {
	authHost: string;
	apiHost: string;
}

interface PostmanVariable {
	key: string;
	value: string | number | boolean;
	type: 'default' | 'secret';
	enabled?: boolean;
}

interface PostmanCollectionItem {
	name: string;
	request?: Record<string, unknown>;
	item?: PostmanCollectionItem[];
	description?: string;
	[key: string]: unknown;
}

const REGION_HOSTS: Record<PostmanRegion, RegionHosts> = {
	NA: { authHost: 'auth.pingone.com', apiHost: 'api.pingone.com' },
	EU: { authHost: 'auth.eu.pingone.com', apiHost: 'api.eu.pingone.com' },
	AP: { authHost: 'auth.asia.pingone.com', apiHost: 'api.asia.pingone.com' },
};

const FLOW_LABELS: Record<SupportedPostmanFlow, string> = {
	'authorization-code-pkce': 'Authorization Code + PKCE',
	'authorization-code-client-secret': 'Authorization Code + Client Secret',
	'authorization-code-redirectless': 'Authorization Code (Redirect-less)',
	hybrid: 'Hybrid Flow',
	implicit: 'Implicit Flow',
	'client-credentials': 'Client Credentials',
	'device-authorization': 'Device Authorization',
	'jwt-bearer': 'JWT Bearer',
	'token-exchange': 'Token Exchange',
};

const generateState = () => `state-${uuidv4()}`;
const generateNonce = () => `nonce-${uuidv4()}`;

const encodeBasicCredentials = (clientId: string, clientSecret: string) => {
	if (!clientId || !clientSecret) return '';
	try {
		return typeof btoa === 'function'
			? btoa(`${clientId}:${clientSecret}`)
			: Buffer.from(`${clientId}:${clientSecret}`, 'utf-8').toString('base64');
	} catch {
		return '';
	}
};

const withHost = (
	host: string,
	pathParts: (string | undefined)[],
	query?: Record<string, string>
) => {
	const filteredParts = pathParts.filter(Boolean) as string[];
	const rawBase = `https://${host}/${filteredParts.join('/')}`;
	const queryArray = query
		? Object.entries(query).map(([key, value]) => ({ key, value }))
		: undefined;
	return {
		raw: queryArray
			? `${rawBase}?${queryArray.map((entry) => `${entry.key}=${entry.value}`).join('&')}`
			: rawBase,
		protocol: 'https',
		host: host.split('.'),
		path: filteredParts,
		...(queryArray ? { query: queryArray } : {}),
	};
};

const normalizeState = (state: WizardState): WizardState => {
	const regionDefaults = REGION_HOSTS[state.common.region];
	return {
		flowType: state.flowType,
		common: {
			...state.common,
			authHost: state.common.authHost || regionDefaults.authHost,
			apiHost: state.common.apiHost || regionDefaults.apiHost,
		},
		flowSpecific: state.flowSpecific ?? {},
	};
};

const sanitizePayload = (value: string | undefined, fallback: string) => {
	if (!value || typeof value !== 'string') return fallback;
	return value.trim() || fallback;
};

const buildEnvironmentValues = async (state: WizardState): Promise<PostmanVariable[]> => {
	const { common, flowSpecific } = state;
	const values: PostmanVariable[] = [
		{ key: 'region', value: common.region, type: 'default', enabled: true },
		{ key: 'environmentId', value: common.environmentId, type: 'default', enabled: true },
		{ key: 'authHost', value: common.authHost, type: 'default', enabled: true },
		{ key: 'apiHost', value: common.apiHost, type: 'default', enabled: true },
		{ key: 'client_id', value: common.clientId, type: 'default', enabled: true },
		{
			key: 'client_secret',
			value: common.clientSecret,
			type: common.clientSecret ? 'secret' : 'default',
			enabled: true,
		},
		{ key: 'redirect_uri', value: common.redirectUri, type: 'default', enabled: true },
		{ key: 'scope', value: common.scopes, type: 'default', enabled: true },
		{ key: 'state', value: generateState(), type: 'default', enabled: true },
		{ key: 'nonce', value: generateNonce(), type: 'default', enabled: true },
		{ key: 'authorization_code', value: '', type: 'default', enabled: true },
		{ key: 'access_token', value: '', type: 'default', enabled: true },
		{ key: 'refresh_token', value: '', type: 'default', enabled: true },
	];

	if (common.tokenAuthMethod === 'client_secret_basic' && common.clientId && common.clientSecret) {
		values.push({
			key: 'client_credentials_basic',
			value: encodeBasicCredentials(common.clientId, common.clientSecret),
			type: 'secret',
			enabled: true,
		});
	}

	if (state.flowType === 'authorization-code-pkce') {
		const codeVerifier = generateCodeVerifier();
		const codeChallenge = await generateCodeChallenge(codeVerifier);
		values.push(
			{ key: 'code_verifier', value: codeVerifier, type: 'secret', enabled: true },
			{ key: 'code_challenge', value: codeChallenge, type: 'default', enabled: true },
			{ key: 'code_challenge_method', value: 'S256', type: 'default', enabled: true }
		);
	}

	if (state.flowType === 'client-credentials' && flowSpecific.audience) {
		values.push({ key: 'audience', value: flowSpecific.audience, type: 'default', enabled: true });
	}

	if (state.flowType === 'authorization-code-redirectless' || common.enableRedirectless) {
		values.push(
			{ key: 'pi_flow_enabled', value: 'true', type: 'default', enabled: true },
			{ key: 'username', value: flowSpecific.username ?? '', type: 'default', enabled: true },
			{ key: 'password', value: flowSpecific.password ?? '', type: 'secret', enabled: true },
			{ key: 'mfa_code', value: flowSpecific.mfa_code ?? '', type: 'default', enabled: true },
			{ key: 'pi_flow_resume_url', value: '', type: 'default', enabled: true },
			{ key: 'pi_flow_step', value: '', type: 'default', enabled: true }
		);
	}

	if (state.flowType === 'device-authorization') {
		values.push(
			{ key: 'device_code', value: '', type: 'default', enabled: true },
			{ key: 'user_code', value: '', type: 'default', enabled: true },
			{ key: 'verification_uri', value: '', type: 'default', enabled: true },
			{
				key: 'poll_interval_sec',
				value: flowSpecific.pollIntervalSeconds ?? 5,
				type: 'default',
				enabled: true,
			}
		);
	}

	if (state.flowType === 'jwt-bearer') {
		values.push(
			{ key: 'jwt_iss', value: flowSpecific.iss ?? '', type: 'default', enabled: true },
			{ key: 'jwt_sub', value: flowSpecific.sub ?? '', type: 'default', enabled: true },
			{
				key: 'jwt_aud',
				value: flowSpecific.aud ?? `https://${common.authHost}/${common.environmentId}/as/token`,
				type: 'default',
				enabled: true,
			},
			{ key: 'jwt_kid', value: flowSpecific.kid ?? '', type: 'default', enabled: true },
			{ key: 'private_key', value: flowSpecific.privateKey ?? '', type: 'secret', enabled: true },
			{
				key: 'assertion_lifetime_sec',
				value: flowSpecific.assertionLifetimeSeconds ?? 300,
				type: 'default',
				enabled: true,
			},
			{ key: 'signed_jwt_assertion', value: '', type: 'secret', enabled: true }
		);
	}

	if (state.flowType === 'token-exchange' || common.enableTokenExchange) {
		values.push(
			{
				key: 'subject_token',
				value: flowSpecific.subjectToken ?? '',
				type: 'secret',
				enabled: true,
			},
			{
				key: 'subject_token_type',
				value: flowSpecific.subjectTokenType ?? 'urn:ietf:params:oauth:token-type:access_token',
				type: 'default',
				enabled: true,
			},
			{ key: 'actor_token', value: flowSpecific.actorToken ?? '', type: 'secret', enabled: true },
			{
				key: 'requested_token_type',
				value: flowSpecific.requestedTokenType ?? '',
				type: 'default',
				enabled: true,
			},
			{
				key: 'exchange_audience',
				value: flowSpecific.exchangeAudience ?? '',
				type: 'default',
				enabled: true,
			}
		);
	}

	if (common.enableRAR) {
		values.push({
			key: 'rar_payload',
			value: sanitizePayload(flowSpecific.rarPayload, '{ "type": "pingone_account_admin" }'),
			type: 'default',
			enabled: true,
		});
	}

	if (common.enablePAR) {
		values.push({ key: 'par_request_uri', value: '', type: 'default', enabled: true });
	}

	return values;
};

const ensureArray = <T>(value: T | T[] | undefined): T[] => {
	if (!value) return [];
	return Array.isArray(value) ? value : [value];
};

const createPostmanItem = (item: PostmanCollectionItem): PostmanCollectionItem => item;

const buildAuthorizationRequests = (state: WizardState): PostmanCollectionItem[] => {
	const { common } = state;
	const baseAuthorizeQuery: Record<string, string> = {
		client_id: '{{client_id}}',
		response_type: common.responseType,
		redirect_uri: '{{redirect_uri}}',
		scope: '{{scope}}',
		state: '{{state}}',
	};

	const items: PostmanCollectionItem[] = [];

	if (state.flowType === 'authorization-code-redirectless') {
		items.push(
			createPostmanItem({
				name: 'Start pi.flow Authorization (response=pi.flow)',
				description:
					'Initiate the PingOne redirect-less flow. Capture the resumeUrl and flowId from the response, then update the environment variables.',
				request: {
					method: 'POST',
					header: [{ key: 'Content-Type', value: 'application/json' }],
					body: {
						mode: 'raw',
						raw: JSON.stringify(
							{
								client_id: '{{client_id}}',
								response_type: 'code',
								scope: '{{scope}}',
								redirect_uri: '{{redirect_uri}}',
								response: 'pi.flow',
								state: '{{state}}',
								acr_values: ['urn:pingidentity:acr:password'],
							},
							null,
							2
						),
						options: { raw: { language: 'json' } },
					},
					url: withHost(common.authHost, [common.environmentId, 'as', 'authorize']),
				},
			})
		);

		items.push(
			createPostmanItem({
				name: 'Resume pi.flow Authentication',
				description:
					'POST the captured credentials to the latest pi_flow_resume_url. Environment variables will track each step.',
				request: {
					method: 'POST',
					header: [{ key: 'Content-Type', value: 'application/json' }],
					body: {
						mode: 'raw',
						raw: JSON.stringify(
							{
								username: '{{username}}',
								password: '{{password}}',
								mfaCode: '{{mfa_code}}',
							},
							null,
							2
						),
						options: { raw: { language: 'json' } },
					},
					url: {
						raw: '{{pi_flow_resume_url}}',
					},
				},
			})
		);

		items.push(
			createPostmanItem({
				name: 'Exchange pi.flow Authorization Code for Tokens',
				request: {
					method: 'POST',
					header: [{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' }],
					body: {
						mode: 'urlencoded',
						urlencoded: ensureArray([
							{ key: 'grant_type', value: 'authorization_code' },
							{ key: 'code', value: '{{authorization_code}}' },
							{ key: 'redirect_uri', value: '{{redirect_uri}}' },
							common.tokenAuthMethod !== 'client_secret_basic' && {
								key: 'client_id',
								value: '{{client_id}}',
							},
							common.tokenAuthMethod === 'client_secret_post' && {
								key: 'client_secret',
								value: '{{client_secret}}',
							},
						]).filter(Boolean),
					},
					url: withHost(common.authHost, [common.environmentId, 'as', 'token']),
				},
			})
		);

		return items;
	}

	items.push(
		createPostmanItem({
			name: 'Authorization Request',
			description:
				'Initiate the authorization request. Open the generated URL in a browser (or Postman console) to authenticate.',
			request: {
				method: 'GET',
				header: [],
				url: withHost(
					common.authHost,
					[common.environmentId, 'as', 'authorize'],
					baseAuthorizeQuery
				),
			},
		})
	);

	return items;
};

const buildTokenExchangeItem = (
	state: WizardState,
	name = 'Token Exchange Request'
): PostmanCollectionItem => ({
	name,
	request: {
		method: 'POST',
		header: [{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' }],
		url: withHost(state.common.authHost, [state.common.environmentId, 'as', 'token']),
		body: {
			mode: 'urlencoded',
			urlencoded: ensureArray([
				{ key: 'grant_type', value: 'urn:ietf:params:oauth:grant-type:token-exchange' },
				{ key: 'subject_token', value: '{{subject_token}}' },
				{ key: 'subject_token_type', value: '{{subject_token_type}}' },
				{ key: 'actor_token', value: '{{actor_token}}', disabled: false },
				{ key: 'requested_token_type', value: '{{requested_token_type}}', disabled: false },
				{ key: 'audience', value: '{{exchange_audience}}', disabled: false },
			]).filter(Boolean),
		},
	},
});

const buildCollectionItems = (state: WizardState): PostmanCollectionItem[] => {
	const { common } = state;
	const items: PostmanCollectionItem[] = [];

	items.push(...buildAuthorizationRequests(state));

	const tokenHeaders = [{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' }];

	if (common.tokenAuthMethod === 'client_secret_basic') {
		tokenHeaders.push({ key: 'Authorization', value: 'Basic {{client_credentials_basic}}' });
	}

	switch (state.flowType) {
		case 'authorization-code-pkce':
		case 'authorization-code-client-secret':
		case 'hybrid':
			items.push(
				createPostmanItem({
					name: 'Exchange Authorization Code for Tokens',
					request: {
						method: 'POST',
						header: tokenHeaders,
						body: {
							mode: 'urlencoded',
							urlencoded: ensureArray([
								{ key: 'grant_type', value: 'authorization_code' },
								{ key: 'code', value: '{{authorization_code}}' },
								{ key: 'redirect_uri', value: '{{redirect_uri}}' },
								common.tokenAuthMethod !== 'client_secret_basic' && {
									key: 'client_id',
									value: '{{client_id}}',
								},
								common.tokenAuthMethod === 'client_secret_post' && {
									key: 'client_secret',
									value: '{{client_secret}}',
								},
								state.flowType === 'authorization-code-pkce' && {
									key: 'code_verifier',
									value: '{{code_verifier}}',
								},
							]).filter(Boolean),
						},
						url: withHost(common.authHost, [common.environmentId, 'as', 'token']),
					},
				})
			);
			break;
		case 'implicit':
			items.push(
				createPostmanItem({
					name: 'Parse Implicit Callback',
					description:
						'After completing the implicit flow in a browser, paste the callback URL here to populate access_token and id_token environment variables.',
				})
			);
			break;
		case 'client-credentials':
			items.push(
				createPostmanItem({
					name: 'Client Credentials Token Request',
					request: {
						method: 'POST',
						header: tokenHeaders,
						body: {
							mode: 'urlencoded',
							urlencoded: ensureArray([
								{ key: 'grant_type', value: 'client_credentials' },
								common.tokenAuthMethod !== 'client_secret_basic' && {
									key: 'client_id',
									value: '{{client_id}}',
								},
								common.tokenAuthMethod === 'client_secret_post' && {
									key: 'client_secret',
									value: '{{client_secret}}',
								},
								common.scopes && { key: 'scope', value: '{{scope}}' },
								state.flowSpecific.audience && { key: 'audience', value: '{{audience}}' },
							]).filter(Boolean),
						},
						url: withHost(common.authHost, [common.environmentId, 'as', 'token']),
					},
				})
			);
			break;
		case 'device-authorization':
			items.push(
				createPostmanItem({
					name: 'Device Authorization Request',
					request: {
						method: 'POST',
						header: tokenHeaders,
						body: {
							mode: 'urlencoded',
							urlencoded: ensureArray([
								common.tokenAuthMethod !== 'client_secret_basic' && {
									key: 'client_id',
									value: '{{client_id}}',
								},
								common.tokenAuthMethod === 'client_secret_post' && {
									key: 'client_secret',
									value: '{{client_secret}}',
								},
								{ key: 'scope', value: '{{scope}}' },
							]).filter(Boolean),
						},
						url: withHost(common.authHost, [common.environmentId, 'as', 'device_authorization']),
					},
				})
			);
			items.push(
				createPostmanItem({
					name: 'Poll Token Endpoint',
					description:
						'Poll at {{poll_interval_sec}} second intervals until PingOne issues tokens.',
					request: {
						method: 'POST',
						header: tokenHeaders,
						body: {
							mode: 'urlencoded',
							urlencoded: ensureArray([
								{ key: 'grant_type', value: 'urn:ietf:params:oauth:grant-type:device_code' },
								{ key: 'device_code', value: '{{device_code}}' },
								common.tokenAuthMethod !== 'client_secret_basic' && {
									key: 'client_id',
									value: '{{client_id}}',
								},
								common.tokenAuthMethod === 'client_secret_post' && {
									key: 'client_secret',
									value: '{{client_secret}}',
								},
							]).filter(Boolean),
						},
						url: withHost(common.authHost, [common.environmentId, 'as', 'token']),
					},
				})
			);
			break;
		case 'jwt-bearer':
			items.push(
				createPostmanItem({
					name: 'JWT Bearer Token Request',
					request: {
						method: 'POST',
						header: tokenHeaders,
						body: {
							mode: 'urlencoded',
							urlencoded: ensureArray([
								{ key: 'grant_type', value: 'urn:ietf:params:oauth:grant-type:jwt-bearer' },
								{ key: 'assertion', value: '{{signed_jwt_assertion}}' },
								common.tokenAuthMethod !== 'client_secret_basic' && {
									key: 'client_id',
									value: '{{client_id}}',
								},
								common.tokenAuthMethod === 'client_secret_post' && {
									key: 'client_secret',
									value: '{{client_secret}}',
								},
							]).filter(Boolean),
						},
						url: withHost(common.authHost, [common.environmentId, 'as', 'token']),
					},
				})
			);
			break;
		case 'token-exchange':
			items.push(buildTokenExchangeItem(state));
			break;
		default:
			break;
	}

	if (common.enablePAR) {
		items.push(
			createPostmanItem({
				name: 'Push Authorization Request (PAR)',
				description:
					'Submit authorization details to PingOne for PAR. Capture request_uri from the response.',
				request: {
					method: 'POST',
					header: tokenHeaders,
					body: {
						mode: 'urlencoded',
						urlencoded: ensureArray([
							{ key: 'client_id', value: '{{client_id}}' },
							{ key: 'response_type', value: common.responseType },
							{ key: 'redirect_uri', value: '{{redirect_uri}}' },
							{ key: 'scope', value: '{{scope}}' },
							{ key: 'state', value: '{{state}}' },
						]).filter(Boolean),
					},
					url: withHost(common.authHost, [common.environmentId, 'as', 'par']),
				},
			})
		);
	}

	if (common.enableRAR) {
		items.push(
			createPostmanItem({
				name: 'Rich Authorization Request (RAR)',
				description: 'Use RAR payload to request fine-grained authorization.',
				request: {
					method: 'POST',
					header: [{ key: 'Content-Type', value: 'application/json' }],
					body: {
						mode: 'raw',
						raw: '{{rar_payload}}',
						options: { raw: { language: 'json' } },
					},
					url: withHost(common.apiHost, [
						'v1',
						'environments',
						'{{environmentId}}',
						'authorizationRequests',
					]),
				},
			})
		);
	}

	if (common.enableTokenExchange && state.flowType !== 'token-exchange') {
		items.push(buildTokenExchangeItem(state));
	}

	if (common.includeUserInfo) {
		items.push(
			createPostmanItem({
				name: 'UserInfo',
				description: 'Call PingOne UserInfo endpoint using the issued access token.',
				request: {
					method: 'GET',
					header: [{ key: 'Authorization', value: 'Bearer {{access_token}}' }],
					url: withHost(common.authHost, [common.environmentId, 'as', 'userinfo']),
				},
			})
		);
	}

	if (common.includeIntrospect) {
		items.push(
			createPostmanItem({
				name: 'Introspect Token',
				request: {
					method: 'POST',
					header: tokenHeaders,
					body: {
						mode: 'urlencoded',
						urlencoded: ensureArray([{ key: 'token', value: '{{access_token}}' }]).filter(Boolean),
					},
					url: withHost(common.authHost, [common.environmentId, 'as', 'introspect']),
				},
			})
		);
	}

	if (common.includeRevoke) {
		items.push(
			createPostmanItem({
				name: 'Revoke Refresh Token',
				request: {
					method: 'POST',
					header: tokenHeaders,
					body: {
						mode: 'urlencoded',
						urlencoded: ensureArray([{ key: 'token', value: '{{refresh_token}}' }]).filter(Boolean),
					},
					url: withHost(common.authHost, [common.environmentId, 'as', 'revoke']),
				},
			})
		);
	}

	if (common.includeLogout) {
		items.push(
			createPostmanItem({
				name: 'Initiate OIDC Logout',
				request: {
					method: 'GET',
					header: [],
					url: withHost(common.authHost, [common.environmentId, 'as', 'signoff'], {
						client_id: '{{client_id}}',
						post_logout_redirect_uri: '{{redirect_uri}}',
						id_token_hint: '{{id_token}}',
					}),
				},
			})
		);
	}

	return items;
};

const buildCollection = (state: WizardState): Record<string, unknown> => ({
	info: {
		name: `PingOne ${FLOW_LABELS[state.flowType]} (${state.common.region})`,
		description:
			'Generated by the PingOne Postman Wizard. Update environment variables before running requests. Secrets are stored as Postman secret variables where possible.',
		schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
	},
	item: buildCollectionItems(state),
});

const buildEnvironment = (
	state: WizardState,
	values: PostmanVariable[]
): Record<string, unknown> => ({
	id: uuidv4(),
	name: `PingOne ${FLOW_LABELS[state.flowType]} Environment`,
	values,
	_postman_variable_scope: 'environment',
	enabled: true,
});

export const getDefaultCommonAnswers = (
	overrides?: Partial<WizardCommonAnswers>
): WizardCommonAnswers => ({
	region: overrides?.region ?? 'NA',
	environmentId: overrides?.environmentId ?? '',
	authHost: overrides?.authHost ?? REGION_HOSTS.NA.authHost,
	apiHost: overrides?.apiHost ?? REGION_HOSTS.NA.apiHost,
	clientId: overrides?.clientId ?? '',
	clientSecret: overrides?.clientSecret ?? '',
	redirectUri: overrides?.redirectUri ?? '',
	responseType: overrides?.responseType ?? 'code',
	tokenAuthMethod: overrides?.tokenAuthMethod ?? 'none',
	scopes: overrides?.scopes ?? 'openid profile email',
	includeUserInfo: overrides?.includeUserInfo ?? true,
	includeIntrospect: overrides?.includeIntrospect ?? false,
	includeRevoke: overrides?.includeRevoke ?? false,
	includeLogout: overrides?.includeLogout ?? false,
	enablePAR: overrides?.enablePAR ?? false,
	enableRAR: overrides?.enableRAR ?? false,
	enableTokenExchange: overrides?.enableTokenExchange ?? false,
	enableRedirectless: overrides?.enableRedirectless ?? false,
});

export const generatePostmanArtifacts = async (
	inputState: WizardState
): Promise<PostmanArtifactResult> => {
	const state = normalizeState(inputState);
	const environmentValues = await buildEnvironmentValues(state);
	const collection = buildCollection(state);
	const environment = buildEnvironment(state, environmentValues);
	const baseName = FLOW_LABELS[state.flowType].replace(/\s+/g, '-').toLowerCase();

	return {
		collection,
		environment,
		collectionFileName: `${baseName}-collection.json`,
		environmentFileName: `${baseName}-environment.json`,
	};
};
