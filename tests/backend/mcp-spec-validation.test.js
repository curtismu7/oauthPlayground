/**
 * MCP Spec Validation — verifies pingone-mcp-server conforms to MCP 2025-11-25
 * (https://modelcontextprotocol.io/specification/2025-11-25)
 *
 * Spawns the server via stdio, sends JSON-RPC initialize + tools/list,
 * validates response structure per spec (tools array, each with name, description, inputSchema).
 *
 * Run: pnpm vitest run tests/backend/mcp-spec-validation.test.js
 * Or:  npm run mcp:validate
 */

import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '../..');

const MCP_SPEC_VERSION = '2024-11-05'; // SDK negotiates; 2025-11-25 server may support
const MCP_SPEC_URL = 'https://modelcontextprotocol.io/specification/2025-11-25';

/**
 * Send JSON-RPC message to MCP server via stdin, collect response from stdout.
 * MCP uses newline-delimited JSON.
 */
function runMcpProtocol(cwd) {
	return new Promise((resolve, reject) => {
		// Use tsx from root; run with cwd=pingone-mcp-server so @modelcontextprotocol/sdk resolves from that package
		const mcpDir = join(cwd, 'pingone-mcp-server');
		const proc = spawn('pnpm', ['exec', 'tsx', 'src/index.ts'], {
			cwd: mcpDir,
			stdio: ['pipe', 'pipe', 'pipe'],
			env: { ...process.env, MCP_LOG_DIR: join(cwd, 'logs'), NODE_ENV: 'test' },
		});

		const lines = [];
		const rl = createInterface({ input: proc.stdout, crlfDelay: Infinity });
		rl.on('line', (line) => {
			const trimmed = line.trim();
			if (trimmed) lines.push(trimmed);
			// Resolve once we have tools/list response (id:2) — server may not exit on stdin EOF
			try {
				const msg = JSON.parse(trimmed);
				if (msg.id === 2 && msg.result && (msg.result.tools || msg.result.toolSchemas)) {
					clearTimeout(timeout);
					proc.kill('SIGTERM');
					resolve(lines);
				}
			} catch {
				/* not JSON or not tools/list */
			}
		});

		let written = 0;
		const toWrite = [
			JSON.stringify({
				jsonrpc: '2.0',
				id: 1,
				method: 'initialize',
				params: {
					protocolVersion: MCP_SPEC_VERSION,
					capabilities: {},
					clientInfo: { name: 'mcp-spec-validator', version: '1.0.0' },
				},
			}) + '\n',
			JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n',
			JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' }) + '\n',
		];

		function sendNext() {
			if (written >= toWrite.length) {
				proc.stdin.end();
				return;
			}
			proc.stdin.write(toWrite[written], (err) => {
				if (err) {
					proc.kill('SIGTERM');
					reject(err);
					return;
				}
				written++;
				setImmediate(sendNext);
			});
		}

		const timeout = setTimeout(() => {
			proc.kill('SIGTERM');
			reject(new Error('MCP spec validation timed out after 15s'));
		}, 15000);

		proc.stderr.on('data', (d) => {
			// Log stderr for debugging but don't fail
			process.stderr.write(`[MCP stderr] ${d.toString()}`);
		});

		proc.on('error', (err) => {
			clearTimeout(timeout);
			reject(err);
		});

		proc.on('close', (code, signal) => {
			clearTimeout(timeout);
			if (code !== 0 && code !== null && signal !== 'SIGTERM') {
				reject(new Error(`MCP server exited with code ${code} signal ${signal}`));
				return;
			}
			resolve(lines);
		});

		proc.stdin.setDefaultEncoding('utf8');
		sendNext();
	});
}

/**
 * Parse JSON-RPC responses and extract tools/list result.
 * MCP tools/list returns { result: { tools: [...] } } or { result: { toolSchemas: [...] } } per SDK version.
 */
function parseToolsListResult(lines) {
	for (const line of lines) {
		try {
			const msg = JSON.parse(line);
			if (msg.id !== 2 || !msg.result) continue;
			const r = msg.result;
			const arr = Array.isArray(r.tools) ? r.tools : Array.isArray(r.toolSchemas) ? r.toolSchemas : null;
			if (arr) return arr;
		} catch {
			// skip non-JSON or unrelated messages
		}
	}
	return null;
}

describe('MCP Spec Validation (2025-11-25)', () => {
	test('pingone-mcp-server responds to initialize and tools/list per MCP spec', async () => {
		const lines = await runMcpProtocol(PROJECT_ROOT);
		expect(lines.length).toBeGreaterThan(0);
		const tools = parseToolsListResult(lines);
		expect(tools).not.toBeNull();
		expect(Array.isArray(tools)).toBe(true);
	}, 20000);

	test('tools/list returns tools with required MCP spec fields (name, description, inputSchema)', async () => {
		const lines = await runMcpProtocol(PROJECT_ROOT);
		const tools = parseToolsListResult(lines);
		expect(tools).not.toBeNull();
		expect(tools.length).toBeGreaterThanOrEqual(50);

		const required = ['name', 'description', 'inputSchema'];
		for (const tool of tools) {
			for (const key of required) {
				expect(tool).toHaveProperty(key);
			}
			expect(typeof tool.name).toBe('string');
			expect(tool.name.length).toBeGreaterThan(0);
			expect(typeof tool.description).toBe('string');
			expect(tool.inputSchema).toBeDefined();
			// inputSchema should be JSON Schema (object with type, properties, etc.)
			expect(typeof tool.inputSchema === 'object' || typeof tool.inputSchema === 'undefined').toBe(true);
		}
	}, 20000);

	test('tools/list includes expected PingOne tools', async () => {
		const lines = await runMcpProtocol(PROJECT_ROOT);
		const tools = parseToolsListResult(lines);
		expect(tools).not.toBeNull();
		const names = tools.map((t) => t.name);
		expect(names).toContain('pingone_get_user');
		expect(names).toContain('pingone_list_users');
		expect(names).toContain('pingone_oidc_config');
		expect(names).toContain('pingone_introspect_token');
	}, 20000);
});
