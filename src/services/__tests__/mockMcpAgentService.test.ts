// src/services/__tests__/mockMcpAgentService.test.ts
// Unit tests for Mock MCP Agent Flow service (listTools, callTool).

import { callTool, listTools } from '../mockMcpAgentService';

describe('mockMcpAgentService', () => {
	describe('listTools', () => {
		it('returns three tools with expected names and descriptions', () => {
			const result = listTools();
			expect(result.tools).toHaveLength(3);
			expect(result.tools.map((t) => t.name)).toEqual([
				'mock_get_token',
				'mock_token_exchange',
				'mock_list_users',
			]);
			expect(result.tools[0].description).toContain('worker token');
			expect(result.tools[1].description).toMatch(/Exchange|Token Exchange/);
			expect(result.tools[2].description).toContain('mock users');
		});

		it('each tool has inputSchema', () => {
			const result = listTools();
			for (const tool of result.tools) {
				expect(tool.inputSchema).toBeDefined();
				expect(typeof tool.inputSchema).toBe('object');
			}
		});
	});

	describe('callTool - mock_get_token', () => {
		it('returns success with access_token and expires_in', () => {
			const result = callTool('mock_get_token', {
				clientId: 'test-client',
				clientSecret: 'secret',
			});
			expect(result.success).toBe(true);
			expect(result.tool).toBe('mock_get_token');
			expect(result.request).toEqual({ clientId: 'test-client', clientSecret: 'secret' });
			expect(result.response).toBeDefined();
			expect(result.response).toHaveProperty('access_token');
			expect((result.response as { access_token: string }).access_token).toMatch(/^mock_wt_/);
			expect((result.response as { expires_in: number }).expires_in).toBe(3600);
			expect((result.response as { token_type: string }).token_type).toBe('Bearer');
		});

		it('returns token with mock_wt_ prefix and numeric suffix', () => {
			const r = callTool('mock_get_token', { clientId: 'a', clientSecret: 'b' });
			const token = (r.response as { access_token: string }).access_token;
			expect(token).toMatch(/^mock_wt_\d+$/);
		});
	});

	describe('callTool - mock_token_exchange', () => {
		it('returns success with new access_token and scope when subject_token provided', () => {
			const result = callTool('mock_token_exchange', {
				subject_token: 'mock_wt_123',
				requested_scope: 'p1:read:user',
			});
			expect(result.success).toBe(true);
			expect(result.tool).toBe('mock_token_exchange');
			expect(result.response).toHaveProperty('access_token');
			expect((result.response as { access_token: string }).access_token).toMatch(/^mock_te_/);
			expect((result.response as { scope: string }).scope).toBe('p1:read:user');
		});

		it('defaults requested_scope to p1:read:user when omitted', () => {
			const result = callTool('mock_token_exchange', { subject_token: 'any' });
			expect(result.success).toBe(true);
			expect((result.response as { scope: string }).scope).toBe('p1:read:user');
		});

		it('returns error when subject_token is missing', () => {
			const result = callTool('mock_token_exchange', { requested_scope: 'read' });
			expect(result.success).toBe(false);
			expect(result.error).toContain('subject_token');
		});

		it('returns error when subject_token is empty string', () => {
			const result = callTool('mock_token_exchange', {
				subject_token: '',
				requested_scope: 'read',
			});
			expect(result.success).toBe(false);
		});
	});

	describe('callTool - mock_list_users', () => {
		it('returns success with count and users when access_token provided', () => {
			const result = callTool('mock_list_users', { access_token: 'mock_te_456' });
			expect(result.success).toBe(true);
			expect(result.tool).toBe('mock_list_users');
			expect((result.response as { count: number }).count).toBe(2);
			expect((result.response as { users: unknown[] }).users).toHaveLength(2);
			const users = (
				result.response as { users: Array<{ id: string; name: { given: string; family: string } }> }
			).users;
			expect(users[0].id).toBe('u1');
			expect(users[0].name.given).toBe('Alice');
			expect(users[1].name.family).toBe('Demo');
		});

		it('returns error when access_token is missing', () => {
			const result = callTool('mock_list_users', {});
			expect(result.success).toBe(false);
			expect(result.error).toContain('access_token');
		});
	});

	describe('callTool - unknown tool', () => {
		it('returns success false and error for unknown tool name', () => {
			// Type allows only known tools; cast to trigger the implementation's fallback branch
			type MockToolName = Parameters<typeof callTool>[0];
			const unknownResult = callTool('unknown_tool' as MockToolName, {});
			expect(unknownResult.success).toBe(false);
			expect(unknownResult.error).toBe('Unknown tool');
			expect(unknownResult.tool).toBe('unknown_tool');
		});
	});
});
