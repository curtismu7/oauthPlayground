#!/usr/bin/env node
/**
 * Extracts MCP tool names from pingone-mcp-server source and writes
 * mcp-tool-names.json. Server and frontend use this as the canonical list.
 *
 * Run: node scripts/generate-mcp-tool-names.mjs
 * Or: npm run mcp:tools:generate
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const MCP_SRC = path.join(ROOT, 'pingone-mcp-server', 'src');
const OUTPUT = path.join(ROOT, 'pingone-mcp-server', 'mcp-tool-names.json');

// Match server.registerTool('name', or server.registerTool("name", or tool.name from practiceTools
const REGISTER_PATTERN = /server\.registerTool\s*\(\s*['"]([^'"]+)['"]/g;

function* walkDir(dir) {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const e of entries) {
		const full = path.join(dir, e.name);
		if (e.isDirectory()) {
			yield* walkDir(full);
		} else if (e.name.endsWith('.ts') && !e.name.endsWith('.d.ts')) {
			yield full;
		}
	}
}

function extractToolNames() {
	const names = new Set();
	for (const file of walkDir(MCP_SRC)) {
		const content = fs.readFileSync(file, 'utf8');
		let m;
		REGISTER_PATTERN.lastIndex = 0;
		while ((m = REGISTER_PATTERN.exec(content)) !== null) {
			names.add(m[1]);
		}
	}
	return [...names].sort();
}

const tools = extractToolNames();
fs.writeFileSync(OUTPUT, JSON.stringify(tools, null, 2), 'utf8');
console.log(`Wrote ${tools.length} tools to ${path.relative(ROOT, OUTPUT)}`);
