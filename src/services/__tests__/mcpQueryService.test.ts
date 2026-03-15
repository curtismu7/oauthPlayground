/**
 * mcpQueryService — predicate function unit tests
 *
 * Verifies that every query classifier (isXxxQuery / predictMcpTool) matches
 * the right phrases and does NOT over-match unrelated phrases.
 *
 * These are pure-function tests — no network, no mocks needed.
 */

import { describe, expect, it } from 'vitest';
import {
	predictMcpTool,
	isMcpQuery,
	isHelpQuery,
	isListToolsQuery,
	isWorkerTokenQuery,
	isAdminLoginQuery,
	isUserLoginQuery,
	isShowMyTokenQuery,
	isShowIdTokenQuery,
	isShowWorkerTokenQuery,
	isDecodeTokenQuery,
	isShowApiCallsQuery,
	isLastToolQuery,
	isClearTokensQuery,
	isIntrospectUserTokenQuery,
	isUserInfoQuery,
	isWebSearchQuery,
	isAgentEducationQuery,
	isMcpExplainQuery,
	isMcpRolesQuery,
	isThisAgentExplainQuery,
	isMcpToolExplainQuery,
	isJsonRpcExplainQuery,
	isGroqExplainQuery,
	decodeJwtPayload,
	decodeJwtHeader,
} from '../mcpQueryService';

// ── predictMcpTool / LOCAL_PATTERNS ──────────────────────────────────────────

describe('predictMcpTool', () => {
	describe('admin login', () => {
		it.each(['admin login', 'login as admin', 'Login Admin'])('matches "%s"', (q) =>
			expect(predictMcpTool(q)).toBe('admin_login')
		);
	});

	describe('worker token', () => {
		it.each([
			'Get worker token',
			'worker token',
			'client credentials',
			'access token',
			'get token',
		])('matches "%s"', (q) => expect(predictMcpTool(q)).toBe('pingone_get_worker_token'));
		it('does not match "admin login" as worker token', () => {
			expect(predictMcpTool('admin login')).not.toBe('pingone_get_worker_token');
		});
	});

	describe('list tools', () => {
		it.each(['List MCP tools', 'list tools', 'show mcp tools', 'available tools', 'mcp tools'])(
			'matches "%s"',
			(q) => expect(predictMcpTool(q)).toBe('mcp_list_tools')
		);
	});

	describe('help', () => {
		it.each(['help', 'What can you do', 'what can I do', 'what commands are there'])(
			'matches "%s"',
			(q) => expect(predictMcpTool(q)).toBe('ai_assistant_help')
		);
	});

	describe('applications', () => {
		it('list apps', () =>
			expect(predictMcpTool('Show all apps')).toBe('pingone.applications.list'));
		it('list applications', () =>
			expect(predictMcpTool('list applications')).toBe('pingone.applications.list'));
		it('app secret', () =>
			expect(predictMcpTool('Get app secret for abc')).toBe('pingone_get_application_secret'));
		it('rotate secret', () =>
			expect(predictMcpTool('rotate secret for abc')).toBe('pingone_rotate_application_secret'));
		it('create app', () =>
			expect(predictMcpTool('Create application named MyApp')).toBe('pingone_create_application'));
		it('delete app', () =>
			expect(predictMcpTool('Delete application named MyApp')).toBe('pingone_delete_application'));
		it('find app', () =>
			expect(predictMcpTool('Find app named MyApp')).toBe('pingone_get_application'));
	});

	describe('users', () => {
		it('list users', () => expect(predictMcpTool('List all users')).toBe('pingone_list_users'));
		it('create user', () =>
			expect(predictMcpTool('Create user john@acme.com')).toBe('pingone_create_user'));
		it('delete user', () =>
			expect(predictMcpTool('Delete user john@acme.com')).toBe('pingone_delete_user'));
		it('get user', () =>
			expect(predictMcpTool('Find user john@acme.com')).toBe('pingone_get_user'));
		it('get userid for username', () =>
			expect(predictMcpTool('Get userid for alice')).toBe('pingone_get_user'));
		it('user id for username', () =>
			expect(predictMcpTool('user id for bob')).toBe('pingone_get_user'));
		it('get userid', () => expect(predictMcpTool('get userid')).toBe('pingone_get_user'));
		it('userinfo beats get_user', () =>
			expect(predictMcpTool('Get userinfo')).toBe('pingone_userinfo'));
		it('user groups', () =>
			expect(predictMcpTool('What groups is user abc in?')).toBe('pingone_get_user_groups'));
		it('add to group', () =>
			expect(predictMcpTool('Add user abc to group xyz')).toBe('pingone_add_user_to_group'));
		it('remove from group', () =>
			expect(predictMcpTool('Remove user abc from group xyz')).toBe(
				'pingone_remove_user_from_group'
			));
	});

	describe('groups', () => {
		it('list groups', () => expect(predictMcpTool('List groups')).toBe('pingone_list_groups'));
		it('get group', () =>
			expect(predictMcpTool('Find group named Admins')).toBe('pingone_get_group'));
		it('create group', () =>
			expect(predictMcpTool('Create group named DevTeam')).toBe('pingone_create_group'));
		it('delete group', () =>
			expect(predictMcpTool('Delete group named DevTeam')).toBe('pingone_delete_group'));
	});

	describe('populations', () => {
		it('list populations', () =>
			expect(predictMcpTool('List populations')).toBe('pingone_list_populations'));
		it('add user to population by name', () =>
			expect(predictMcpTool('Add alice to population Employees')).toBe('pingone_update_user'));
		it('move user into population', () =>
			expect(predictMcpTool('Move bob into population Default')).toBe('pingone_update_user'));
		it('set user population', () =>
			expect(predictMcpTool('Set population for alice to Employees')).toBe('pingone_update_user'));
		it('change user population', () =>
			expect(predictMcpTool('Change population for john@acme.com')).toBe('pingone_update_user'));
	});

	describe('MFA', () => {
		it('mfa policies', () =>
			expect(predictMcpTool('List MFA policies')).toBe('pingone.mfa.policy.list'));
		it('mfa devices', () =>
			expect(predictMcpTool('List MFA devices for user abc')).toBe('pingone.mfa.devices.list'));
	});

	describe('subscriptions', () => {
		it('list subscriptions', () =>
			expect(predictMcpTool('List subscriptions')).toBe('pingone_list_subscriptions'));
		it('create subscription', () =>
			expect(predictMcpTool('Create subscription')).toBe('pingone_create_subscription'));
		it('delete subscription', () =>
			expect(predictMcpTool('Delete subscription abc')).toBe('pingone_delete_subscription'));
	});

	describe('auth / OIDC', () => {
		it('introspect', () =>
			expect(predictMcpTool('Introspect token')).toBe('pingone_introspect_token'));
		it('oidc discovery', () =>
			expect(predictMcpTool('Get OIDC discovery document')).toBe('pingone_oidc_config'));
		it('risk evaluation', () =>
			expect(predictMcpTool('Evaluate risk')).toBe('pingone_risk_evaluation'));
		it('org licenses', () =>
			expect(predictMcpTool('Show org licenses')).toBe('pingone_get_organization_licenses'));
	});

	it('returns null for unrecognised queries', () => {
		expect(predictMcpTool('What is the weather today?')).toBeNull();
		expect(predictMcpTool('Tell me a joke')).toBeNull();
		expect(predictMcpTool('')).toBeNull();
	});
});

// ── isMcpQuery ─────────────────────────────────────────────────────────────

describe('isMcpQuery', () => {
	it('returns true for PingOne queries', () => {
		expect(isMcpQuery('List all users')).toBe(true);
		expect(isMcpQuery('Get worker token')).toBe(true);
		expect(isMcpQuery('Show all apps')).toBe(true);
	});
	it('returns false for general questions', () => {
		expect(isMcpQuery('What is OAuth?')).toBe(false);
		expect(isMcpQuery('Tell me about PKCE')).toBe(false);
	});
});

// ── Panel / token predicates ─────────────────────────────────────────────────

describe('isAdminLoginQuery', () => {
	it.each(['admin login', 'login as admin'])('matches "%s"', (q) =>
		expect(isAdminLoginQuery(q)).toBe(true)
	);
	it('does not match "user login"', () => expect(isAdminLoginQuery('user login')).toBe(false));
});

describe('isUserLoginQuery', () => {
	it.each(['user login', 'login as user', 'user sign-in', 'get user access token'])(
		'matches "%s"',
		(q) => expect(isUserLoginQuery(q)).toBe(true)
	);
	it('does not match "admin login"', () => expect(isUserLoginQuery('admin login')).toBe(false));
	it('does not match general "get worker token"', () =>
		expect(isUserLoginQuery('get worker token')).toBe(false));
});

describe('isShowMyTokenQuery', () => {
	it.each(['show my token', 'view my user token', "what's my access token"])('matches "%s"', (q) =>
		expect(isShowMyTokenQuery(q)).toBe(true)
	);
	it('does not match "show worker token"', () =>
		expect(isShowMyTokenQuery('show worker token')).toBe(false));
});

describe('isShowIdTokenQuery', () => {
	it.each(['show my id token', 'show id-token', 'id token claims', 'decode my id token'])(
		'matches "%s"',
		(q) => expect(isShowIdTokenQuery(q)).toBe(true)
	);
	it('does not match "show my token"', () =>
		expect(isShowIdTokenQuery('show my token')).toBe(false));
});

describe('isShowWorkerTokenQuery', () => {
	it.each(['show worker token', 'show the admin token', 'view worker token'])('matches "%s"', (q) =>
		expect(isShowWorkerTokenQuery(q)).toBe(true)
	);
	it('does not match "show my token"', () =>
		expect(isShowWorkerTokenQuery('show my token')).toBe(false));
});

describe('isDecodeTokenQuery', () => {
	it('matches "decode token eyJ..."', () =>
		expect(isDecodeTokenQuery('decode token eyJhbGciOiJSUzI1NiJ9')).toBe(true));
	it('matches "parse this jwt"', () => expect(isDecodeTokenQuery('parse this jwt')).toBe(true));
	it('matches a bare pasted JWT', () => {
		const jwt = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyMTIzIn0.signature_here_padding_more';
		expect(isDecodeTokenQuery(jwt)).toBe(true);
	});
	it('does not match plain text', () => expect(isDecodeTokenQuery('What is a JWT?')).toBe(false));
});

describe('isShowApiCallsQuery', () => {
	it.each(['show api calls', 'api call history', 'recent api calls', 'show my last calls'])(
		'matches "%s"',
		(q) => expect(isShowApiCallsQuery(q)).toBe(true)
	);
});

describe('isLastToolQuery', () => {
	it.each([
		'last mcp tool',
		'what was the last call',
		'inspect last call',
		'last mcp call',
		'what did you just call',
	])('matches "%s"', (q) => expect(isLastToolQuery(q)).toBe(true));
	it('does not match "show api calls"', () =>
		expect(isLastToolQuery('show api calls')).toBe(false));
});

describe('isClearTokensQuery', () => {
	it.each(['clear tokens', 'clear all tokens', 'forget my tokens', 'remove stored tokens'])(
		'matches "%s"',
		(q) => expect(isClearTokensQuery(q)).toBe(true)
	);
});

describe('isIntrospectUserTokenQuery', () => {
	it.each(['introspect user token', "introspect user's token", 'user token introspect'])(
		'matches "%s"',
		(q) => expect(isIntrospectUserTokenQuery(q)).toBe(true)
	);
	it('does not match plain "introspect token"', () =>
		expect(isIntrospectUserTokenQuery('introspect token')).toBe(false));
});

describe('isUserInfoQuery', () => {
	it('matches "Get userinfo"', () => expect(isUserInfoQuery('Get userinfo')).toBe(true));
	it('matches "userinfo"', () => expect(isUserInfoQuery('userinfo')).toBe(true));
	it('does not match "get user"', () => expect(isUserInfoQuery('get user john')).toBe(false));
});

describe('isHelpQuery', () => {
	it('matches "help"', () => expect(isHelpQuery('help')).toBe(true));
	it('matches "what can you do"', () => expect(isHelpQuery('what can you do')).toBe(true));
});

describe('isListToolsQuery', () => {
	it('matches "List MCP tools"', () => expect(isListToolsQuery('List MCP tools')).toBe(true));
	it('matches "list tools"', () => expect(isListToolsQuery('list tools')).toBe(true));
});

describe('isWorkerTokenQuery', () => {
	it('matches "Get worker token"', () => expect(isWorkerTokenQuery('Get worker token')).toBe(true));
	it('matches "client credentials"', () =>
		expect(isWorkerTokenQuery('client credentials')).toBe(true));
});

// ── Education predicates ─────────────────────────────────────────────────────

describe('isAgentEducationQuery', () => {
	it.each(['what is an agent', 'what is an AI agent', 'explain agent'])('matches "%s"', (q) =>
		expect(isAgentEducationQuery(q)).toBe(true)
	);
});

describe('isMcpExplainQuery', () => {
	it.each([
		'what is MCP',
		'explain MCP',
		'what is the model context protocol',
		'how does MCP work',
	])('matches "%s"', (q) => expect(isMcpExplainQuery(q)).toBe(true));
});

describe('isMcpRolesQuery', () => {
	it.each(['mcp host client server', 'explain mcp host', 'mcp roles', 'host and client'])(
		'matches "%s"',
		(q) => expect(isMcpRolesQuery(q)).toBe(true)
	);
});

describe('isThisAgentExplainQuery', () => {
	it.each(['how does this agent work', 'show agent architecture', 'agent architecture'])(
		'matches "%s"',
		(q) => expect(isThisAgentExplainQuery(q)).toBe(true)
	);
});

describe('isMcpToolExplainQuery', () => {
	it.each([
		'what is a tool call',
		'what is a mcp tool',
		'explain mcp tool call',
		'how do tool calls work',
	])('matches "%s"', (q) => expect(isMcpToolExplainQuery(q)).toBe(true));
});

describe('isJsonRpcExplainQuery', () => {
	it.each(['what is JSON-RPC', 'what is jsonrpc 2.0', 'explain json rpc'])('matches "%s"', (q) =>
		expect(isJsonRpcExplainQuery(q)).toBe(true)
	);
});

describe('isGroqExplainQuery', () => {
	it.each(['what is groq', 'how does groq fit', 'what llm does this use', 'groq api'])(
		'matches "%s"',
		(q) => expect(isGroqExplainQuery(q)).toBe(true)
	);
});

// ── Web search predicate ──────────────────────────────────────────────────────

describe('isWebSearchQuery', () => {
	it.each([
		'find the RFC for PKCE',
		'show me the specification',
		"what's the latest version",
		'search for OIDC documentation',
		'where can I find the spec',
		'link to the docs',
	])('matches "%s"', (q) => expect(isWebSearchQuery(q)).toBe(true));

	it('does not match generic questions', () => {
		expect(isWebSearchQuery('list all users')).toBe(false);
		expect(isWebSearchQuery('what is pkce')).toBe(false);
	});
});

// ── JWT decode utilities ──────────────────────────────────────────────────────

describe('decodeJwtPayload', () => {
	// Header: {"alg":"none"}, Payload: {"sub":"user123","iss":"test"}, no sig
	const jwt = 'eyJhbGciOiJub25lIn0.eyJzdWIiOiJ1c2VyMTIzIiwiaXNzIjoidGVzdCJ9.';

	it('decodes a valid JWT payload', () => {
		const payload = decodeJwtPayload(jwt);
		expect(payload).not.toBeNull();
		expect(payload?.sub).toBe('user123');
		expect(payload?.iss).toBe('test');
	});

	it('returns null for a non-JWT string', () => {
		expect(decodeJwtPayload('not-a-jwt')).toBeNull();
		expect(decodeJwtPayload('only.one')).toBeNull();
	});
});

describe('decodeJwtHeader', () => {
	const jwt = 'eyJhbGciOiJub25lIn0.eyJzdWIiOiJ1c2VyMTIzIn0.';

	it('decodes the header', () => {
		const header = decodeJwtHeader(jwt);
		expect(header).not.toBeNull();
		expect(header?.alg).toBe('none');
	});

	it('returns null for a non-JWT string', () => {
		expect(decodeJwtHeader('not-a-jwt')).toBeNull();
	});
});
