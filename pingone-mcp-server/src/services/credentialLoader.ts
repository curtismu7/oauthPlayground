/**
 * Load PingOne credentials from app storage (mcp-config.json) or fall back to process.env.
 * The app backend writes ~/.pingone-playground/credentials/mcp-config.json when credentials are saved.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const MCP_CONFIG_FILENAME = 'mcp-config.json';

function getMcpConfigPath(): string {
	return path.join(os.homedir(), '.pingone-playground', 'credentials', MCP_CONFIG_FILENAME);
}

export interface McpConfig {
	environmentId?: string;
	clientId?: string;
	clientSecret?: string;
	apiUrl?: string;
}

/**
 * Load credentials from storage file (written by app when user saves credentials).
 * Applies values to process.env so existing clients (pingoneAuthClient etc.) use them.
 * Falls back to existing process.env if file is missing or incomplete.
 */
export function loadCredentialsFromStorage(): McpConfig {
	const filePath = getMcpConfigPath();
	let config: McpConfig = {};

	try {
		if (fs.existsSync(filePath)) {
			const raw = fs.readFileSync(filePath, 'utf8');
			const parsed = JSON.parse(raw) as Record<string, unknown>;
			config = {
				environmentId: typeof parsed.environmentId === 'string' ? parsed.environmentId : undefined,
				clientId: typeof parsed.clientId === 'string' ? parsed.clientId : undefined,
				clientSecret: typeof parsed.clientSecret === 'string' ? parsed.clientSecret : undefined,
				apiUrl: typeof parsed.apiUrl === 'string' ? parsed.apiUrl : undefined,
			};
		}
	} catch {
		// File missing or invalid; use env only
	}

	// Apply to process.env so PingOne clients pick them up (they read from env when args not passed)
	if (config.environmentId) process.env.PINGONE_ENVIRONMENT_ID = config.environmentId;
	if (config.clientId) process.env.PINGONE_CLIENT_ID = config.clientId;
	if (config.clientSecret) process.env.PINGONE_CLIENT_SECRET = config.clientSecret;
	if (config.apiUrl) process.env.PINGONE_API_URL = config.apiUrl;

	return config;
}
