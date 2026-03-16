// src/services/mockMcpAgentService.ts
// In-memory simulated MCP server for the Mock MCP Agent Flow (educational).

export type MockToolName = 'mock_get_token' | 'mock_token_exchange' | 'mock_list_users';

export interface MockToolsListResponse {
	tools: Array<{ name: MockToolName; description: string; inputSchema: object }>;
}

export interface MockToolCallResult {
	success: boolean;
	content?: string;
	error?: string;
	tool: MockToolName;
	request?: object;
	response?: object;
}

const MOCK_TOOLS: MockToolsListResponse['tools'] = [
	{
		name: 'mock_get_token',
		description: 'Obtain a mock worker token (simulated client credentials)',
		inputSchema: {
			type: 'object',
			properties: { clientId: { type: 'string' }, clientSecret: { type: 'string' } },
		},
	},
	{
		name: 'mock_token_exchange',
		description: 'Exchange a subject token for a new token with broader scope (RFC 8693)',
		inputSchema: {
			type: 'object',
			properties: { subject_token: { type: 'string' }, requested_scope: { type: 'string' } },
		},
	},
	{
		name: 'mock_list_users',
		description: 'List mock users (requires access token)',
		inputSchema: { type: 'object', properties: { access_token: { type: 'string' } } },
	},
];

export function listTools(): MockToolsListResponse {
	return { tools: MOCK_TOOLS };
}

export function callTool(name: MockToolName, args: Record<string, unknown>): MockToolCallResult {
	if (name === 'mock_get_token') {
		const accessToken = `mock_wt_${Date.now()}`;
		return {
			success: true,
			tool: 'mock_get_token',
			request: args,
			response: { access_token: accessToken, expires_in: 3600, token_type: 'Bearer' },
			content: JSON.stringify({ access_token: accessToken, expires_in: 3600 }),
		};
	}
	if (name === 'mock_token_exchange') {
		const subjectToken = args.subject_token as string;
		const scope = (args.requested_scope as string) || 'p1:read:user';
		if (!subjectToken) {
			return {
				success: false,
				tool: 'mock_token_exchange',
				error: 'subject_token required',
				request: args,
			};
		}
		const newToken = `mock_te_${Date.now()}`;
		return {
			success: true,
			tool: 'mock_token_exchange',
			request: args,
			response: { access_token: newToken, scope, token_type: 'Bearer' },
			content: JSON.stringify({ access_token: newToken, scope }),
		};
	}
	if (name === 'mock_list_users') {
		const token = args.access_token as string;
		if (!token) {
			return {
				success: false,
				tool: 'mock_list_users',
				error: 'access_token required',
				request: args,
			};
		}
		const users = [
			{ id: 'u1', name: { given: 'Alice', family: 'User' } },
			{ id: 'u2', name: { given: 'Bob', family: 'Demo' } },
		];
		return {
			success: true,
			tool: 'mock_list_users',
			request: args,
			response: { count: 2, users },
			content: JSON.stringify({ count: 2, users }),
		};
	}
	return { success: false, tool: name, error: 'Unknown tool', request: args };
}
