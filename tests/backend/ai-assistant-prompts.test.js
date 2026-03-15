/**
 * AI Assistant prompts — verify all MCP-actionable prompts return real data
 * when worker token is provided. Uses mocked PingOne API responses.
 *
 * Run: pnpm vitest run tests/backend/ai-assistant-prompts.test.js
 */

import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { vi } from 'vitest';
import request from 'supertest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import app, { _testResetTokenCache } from '../../server.js';

const MCP_CRED_FILE = join(homedir(), '.pingone-playground', 'credentials', 'mcp-config.json');
let storedCreds = {};
try {
	storedCreds = JSON.parse(readFileSync(MCP_CRED_FILE, 'utf8'));
} catch {}

const ENV_ID = storedCreds.environmentId || 'test-env-id';
const TOKEN_URL = `https://auth.pingone.com/${ENV_ID}/as/token`;
const API_BASE = `https://api.pingone.com/v1/environments/${ENV_ID}`;
const AUTH_BASE = `https://auth.pingone.com/${ENV_ID}`;

/** Worker token + env for all MCP requests that need credentials */
const MCP_CTX = {
	workerToken: 'mock_worker_token_abc123',
	environmentId: ENV_ID,
	region: 'us',
};

/** Mock fetch to return realistic PingOne responses by URL pattern */
function mockPingOneResponses() {
	mockFetch.mockImplementation((url, opts = {}) => {
		const urlStr = typeof url === 'string' ? url : url?.href || '';
		// Token endpoint
		if (urlStr.includes('/as/token') && urlStr.includes('auth.pingone')) {
			return Promise.resolve({
				ok: true,
				status: 200,
				json: () =>
					Promise.resolve({
						access_token: MCP_CTX.workerToken,
						token_type: 'Bearer',
						expires_in: 3600,
						scope: 'openid p1:read:environment p1:read:application',
					}),
			});
		}
		// OIDC discovery (.well-known)
		if (urlStr.includes('.well-known/openid-configuration')) {
			return Promise.resolve({
				ok: true,
				status: 200,
				json: () =>
					Promise.resolve({
						issuer: `${AUTH_BASE}/as`,
						authorization_endpoint: `${AUTH_BASE}/as/authorize`,
						token_endpoint: `${AUTH_BASE}/as/token`,
					}),
			});
		}
		// Management API
		if (urlStr.includes(API_BASE)) {
			const path = urlStr.replace(API_BASE, '');
			// Single application by ID (GET /applications/{id}) — return object, not list
			if (/^\/applications\/[^/]+$/.test(path) && opts.method === 'GET' && !path.includes('/secret')) {
				return Promise.resolve({
					ok: true,
					status: 200,
					json: () =>
						Promise.resolve({
							id: 'app-1',
							name: 'MyApp',
							protocol: 'OPENID_CONNECT',
						}),
				});
			}
			// Application secret
			if (path.includes('/applications/') && path.endsWith('/secret') && opts.method === 'GET') {
				return Promise.resolve({
					ok: true,
					status: 200,
					json: () =>
						Promise.resolve({
							secret: { value: 'mock-secret-value' },
						}),
				});
			}
			// Applications list
			if (path.startsWith('/applications') && opts.method !== 'POST' && opts.method !== 'DELETE') {
				return Promise.resolve({
					ok: true,
					status: 200,
					json: () =>
						Promise.resolve({
							_embedded: {
								applications: [
									{ id: 'app-1', name: 'MyApp', protocol: 'OPENID_CONNECT' },
									{ id: 'app-2', name: 'TestApp', protocol: 'OPENID_CONNECT' },
								],
							},
						}),
				});
			}
			// Users list
			if (path.startsWith('/users') && opts.method === 'GET' && !path.includes('/memberOfGroups')) {
				return Promise.resolve({
					ok: true,
					status: 200,
					json: () =>
						Promise.resolve({
							_embedded: {
								users: [
									{ id: 'user-1', username: 'john@acme.com' },
									{ id: 'user-2', username: 'jane@acme.com' },
								],
							},
						}),
				});
			}
			// User memberOfGroups
			if (path.includes('/memberOfGroups') && opts.method === 'GET') {
				return Promise.resolve({
					ok: true,
					status: 200,
					json: () =>
						Promise.resolve({
							_embedded: {
								groupMemberships: [
									{ id: 'gm-1', name: 'Admins' },
								],
							},
						}),
				});
			}
			// Groups list
			if (path.startsWith('/groups') && opts.method === 'GET') {
				return Promise.resolve({
					ok: true,
					status: 200,
					json: () =>
						Promise.resolve({
							_embedded: {
								groups: [
									{ id: 'grp-1', name: 'Admins' },
									{ id: 'grp-2', name: 'DevTeam' },
								],
							},
						}),
				});
			}
			// Populations list
			if (path.startsWith('/populations')) {
				return Promise.resolve({
					ok: true,
					status: 200,
					json: () =>
						Promise.resolve({
							_embedded: {
								populations: [
									{ id: 'pop-1', name: 'Default' },
								],
							},
						}),
				});
			}
			// MFA policies (deviceAuthenticationPolicies)
			if (path.includes('deviceAuthenticationPolicies')) {
				return Promise.resolve({
					ok: true,
					status: 200,
					json: () =>
						Promise.resolve({
							_embedded: {
								deviceAuthenticationPolicies: [
									{ id: 'mfa-1', name: 'Default MFA Policy' },
								],
							},
						}),
				});
			}
			// MFA devices for user
			if (path.includes('/devices') && path.includes('/users/')) {
				return Promise.resolve({
					ok: true,
					status: 200,
					json: () =>
						Promise.resolve({
							_embedded: {
								devices: [
									{ id: 'dev-1', type: 'SMS' },
								],
							},
						}),
				});
			}
			// Subscriptions
			if (path.startsWith('/subscriptions')) {
				return Promise.resolve({
					ok: true,
					status: 200,
					json: () =>
						Promise.resolve({
							_embedded: {
								subscriptions: [
									{ id: 'sub-1', name: 'Webhook 1' },
								],
							},
						}),
				});
			}
			// Licenses
			if (path.includes('/licenses')) {
				return Promise.resolve({
					ok: true,
					status: 200,
					json: () =>
						Promise.resolve({
							_embedded: {
								licenses: [
									{ id: 'lic-1', name: 'PingOne MFA' },
								],
							},
						}),
				});
			}
			// Single application (get by id) — path like /applications/app-uuid
			if (/\/applications\/[a-z0-9-]+$/.test(path)) {
				if (path.includes('/secret')) {
					return Promise.resolve({
						ok: true,
						status: 200,
						json: () =>
							Promise.resolve({
								secret: { value: 'mock-secret-value' },
							}),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					json: () =>
						Promise.resolve({
							id: 'app-1',
							name: 'MyApp',
							protocol: 'OPENID_CONNECT',
						}),
				});
			}
			// Single group
			if (path.match(/\/groups\/[a-z0-9-]+$/)) {
				return Promise.resolve({
					ok: true,
					status: 200,
					json: () =>
						Promise.resolve({
							id: 'grp-1',
							name: 'Admins',
						}),
				});
			}
			// DELETE
			if (opts.method === 'DELETE') {
				return Promise.resolve({ ok: true, status: 204 });
			}
			// POST create
			if (opts.method === 'POST') {
				const body = opts.body ? JSON.parse(opts.body) : {};
				if (path.includes('/applications')) {
					return Promise.resolve({
						ok: true,
						status: 201,
						json: () =>
							Promise.resolve({
								id: 'app-new',
								name: body.name || 'NewApp',
								protocol: body.protocol || 'OPENID_CONNECT',
							}),
					});
				}
				if (path.includes('/groups')) {
					return Promise.resolve({
						ok: true,
						status: 201,
						json: () =>
							Promise.resolve({
								id: 'grp-new',
								name: body.name || 'NewGroup',
							}),
					});
				}
			}
		}
		// Fallback — avoid unhandled
		return Promise.resolve({
			ok: false,
			status: 404,
			json: () => Promise.resolve({ error: 'Not mocked' }),
		});
	});
}

describe('AI Assistant prompts — real data with worker token', () => {
	beforeEach(() => {
		mockFetch.mockClear();
		_testResetTokenCache();
		mockPingOneResponses();
	});

	describe('no token required', () => {
		test('"List MCP tools" returns tool list', async () => {
			const res = await request(app)
				.post('/api/mcp/query')
				.send({ query: 'List MCP tools' })
				.expect(200);

			expect(res.body.success).toBe(true);
			expect(res.body.answer).toContain('MCP tools available');
			expect(res.body.data).toBeInstanceOf(Array);
			expect(res.body.data.length).toBeGreaterThan(5);
			expect(mockFetch).not.toHaveBeenCalled();
		});

		test('"What can I do in chat?" returns help', async () => {
			const res = await request(app)
				.post('/api/mcp/query')
				.send({ query: 'What can I do in chat?' })
				.expect(200);

			expect(res.body.success).toBe(true);
			expect(res.body.answer).toContain("Here's what you can do");
			expect(res.body.mcpTool).toBe('ai_assistant_help');
			expect(mockFetch).not.toHaveBeenCalled();
		});
	});

	describe('with worker token', () => {
		test('"Get worker token" returns token data', async () => {
			const res = await request(app)
				.post('/api/mcp/query')
				.send({ query: 'Get worker token' })
				.expect(200);

			expect(res.body.success).toBe(true);
			expect(res.body.data).toMatchObject({
				tokenType: 'Bearer',
				expiresIn: 3600,
			});
			expect(mockFetch).toHaveBeenCalledWith(
				TOKEN_URL,
				expect.objectContaining({
					method: 'POST',
					body: expect.stringContaining('grant_type=client_credentials'),
				})
			);
		});

		test('"Show all apps" returns applications array', async () => {
			const res = await request(app)
				.post('/api/mcp/query')
				.send({
					query: 'Show all apps',
					...MCP_CTX,
				})
				.expect(200);

			expect(res.body.success).toBe(true);
			expect(res.body.mcpTool).toBe('pingone.applications.list');
			expect(res.body.data).toBeInstanceOf(Array);
			expect(res.body.data.length).toBeGreaterThan(0);
			expect(res.body.data[0]).toHaveProperty('name');
			expect(res.body.answer).toMatch(/Found \d+ application/);
		});

		test('"List all users" returns users array', async () => {
			const res = await request(app)
				.post('/api/mcp/query')
				.send({
					query: 'List all users',
					...MCP_CTX,
				})
				.expect(200);

			expect(res.body.success).toBe(true);
			expect(res.body.mcpTool).toBe('pingone_list_users');
			expect(res.body.data).toBeInstanceOf(Array);
			expect(res.body.data.length).toBeGreaterThan(0);
			expect(res.body.answer).toMatch(/Found \d+ user/);
		});

		test('"List groups" returns groups array', async () => {
			const res = await request(app)
				.post('/api/mcp/query')
				.send({
					query: 'List groups',
					...MCP_CTX,
				})
				.expect(200);

			expect(res.body.success).toBe(true);
			expect(res.body.mcpTool).toBe('pingone_list_groups');
			expect(res.body.data).toBeInstanceOf(Array);
			expect(res.body.data.length).toBeGreaterThan(0);
			expect(res.body.answer).toMatch(/Found \d+ group/);
		});

		test('"List populations" returns populations array', async () => {
			const res = await request(app)
				.post('/api/mcp/query')
				.send({
					query: 'List populations',
					...MCP_CTX,
				})
				.expect(200);

			expect(res.body.success).toBe(true);
			expect(res.body.data).toBeInstanceOf(Array);
			expect(res.body.data.length).toBeGreaterThan(0);
		});

		test('"List MFA policies" returns MFA policies array', async () => {
			const res = await request(app)
				.post('/api/mcp/query')
				.send({
					query: 'List MFA policies',
					...MCP_CTX,
				})
				.expect(200);

			expect(res.body.success).toBe(true);
			expect(res.body.data).toBeInstanceOf(Array);
			expect(res.body.answer).toMatch(/Found \d+ MFA/);
		});

		test('"List subscriptions" returns subscriptions array', async () => {
			const res = await request(app)
				.post('/api/mcp/query')
				.send({
					query: 'List subscriptions',
					...MCP_CTX,
				})
				.expect(200);

			expect(res.body.success).toBe(true);
			expect(res.body.data).toBeInstanceOf(Array);
			expect(res.body.answer).toMatch(/Found \d+ webhook/);
		});

		test('"Show org licenses" returns licenses array', async () => {
			const res = await request(app)
				.post('/api/mcp/query')
				.send({
					query: 'Show org licenses',
					...MCP_CTX,
				})
				.expect(200);

			expect(res.body.success).toBe(true);
			expect(res.body.data).toBeInstanceOf(Array);
			expect(res.body.answer).toMatch(/Found \d+ license/);
		});

		test('"Get OIDC discovery document" returns discovery data', async () => {
			const res = await request(app)
				.post('/api/mcp/query')
				.send({
					query: 'Get OIDC discovery document',
					...MCP_CTX,
				})
				.expect(200);

			expect(res.body.success).toBe(true);
			expect(res.body.data).toBeTruthy();
			expect(res.body.data.issuer || res.body.data.token_endpoint).toBeTruthy();
		});

		test('"Find app named MyApp" returns application', async () => {
			const res = await request(app)
				.post('/api/mcp/query')
				.send({
					query: 'Find app named MyApp',
					...MCP_CTX,
				})
				.expect(200);

			expect(res.body.success).toBe(true);
			expect(res.body.mcpTool).toBe('pingone_get_application');
			expect(res.body.data).toBeTruthy();
			// Server returns array when searching by name (list + filter)
			const apps = Array.isArray(res.body.data) ? res.body.data : [res.body.data];
			expect(apps.length).toBeGreaterThan(0);
			expect(apps[0]).toHaveProperty('name');
		});

		test('"Find group named Admins" returns group', async () => {
			const res = await request(app)
				.post('/api/mcp/query')
				.send({
					query: 'Find group named Admins',
					...MCP_CTX,
				})
				.expect(200);

			expect(res.body.success).toBe(true);
			expect(res.body.mcpTool).toBe('pingone_get_group');
			// Server returns array when searching by name (SCIM filter)
			const groups = Array.isArray(res.body.data) ? res.body.data : [res.body.data];
			expect(groups.length).toBeGreaterThan(0);
			expect(groups[0]).toHaveProperty('name');
		});
	});

	describe('prompts needing placeholder substitution', () => {
		test('"What groups is user <user-uuid> in?" with UUID returns group memberships', async () => {
			// Must use valid UUID format for _extractUuid to match
			const userId = '550e8400-e29b-41d4-a716-446655440001';
			const res = await request(app)
				.post('/api/mcp/query')
				.send({
					query: `What groups is user ${userId} in?`,
					...MCP_CTX,
				})
				.expect(200);

			expect(res.body.success).toBe(true);
			expect(res.body.mcpTool).toBe('pingone_get_user_groups');
			expect(res.body.data).toBeInstanceOf(Array);
		});

		test('"List MFA devices for user <user-uuid>" with UUID returns devices', async () => {
			const userId = 'user-1-uuid-here';
			const res = await request(app)
				.post('/api/mcp/query')
				.send({
					query: `List MFA devices for user ${userId}`,
					...MCP_CTX,
				})
				.expect(200);

			expect(res.body.success).toBe(true);
			expect(res.body.data).toBeInstanceOf(Array);
		});
	});

	describe('without token returns credentialsRequired', () => {
		test('"Show all apps" without token returns credentialsRequired', async () => {
			const res = await request(app)
				.post('/api/mcp/query')
				.send({
					query: 'Show all apps',
					environmentId: ENV_ID,
					// no workerToken
				})
				.expect(200);

			expect(res.body.success).toBe(false);
			expect(res.body.credentialsRequired).toBe(true);
			expect(res.body.answer).toContain('Get worker token');
		});
	});
});
