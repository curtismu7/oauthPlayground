/**
 * Logger that writes to console and optionally appends to project logs/mcp-server.log.
 * When run via MCP Inspector (from project root), logs appear in the Log Viewer.
 */

import fs from 'node:fs';
import path from 'node:path';

let logFilePath: string | null = null;

function getLogFilePath(): string | null {
	if (logFilePath != null) return logFilePath;
	const dir = process.env.MCP_LOG_DIR;
	const custom = process.env.MCP_LOG_PATH;
	if (custom) {
		logFilePath = custom;
		return logFilePath;
	}
	const logsDir = dir ? path.resolve(dir) : path.join(process.cwd(), 'logs');
	const file = path.join(logsDir, 'mcp-server.log');
	try {
		if (!fs.existsSync(logsDir)) {
			fs.mkdirSync(logsDir, { recursive: true });
		}
		logFilePath = file;
		return logFilePath;
	} catch {
		logFilePath = null;
		return null;
	}
}

function appendToLog(level: string, scope: string, message: string, meta?: unknown): void {
	const file = getLogFilePath();
	if (!file) return;
	try {
		const now = new Date();
		const ts = now.toISOString();
		const local = now.toLocaleString('en-US', {
			timeZone: 'America/Chicago',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false,
		});
		const metaStr = meta != null && meta !== '' ? ` ${JSON.stringify(meta)}` : '';
		const line = `[${ts}] [${local}] [MCP] [${level}] [${scope}] ${message}${metaStr}\n`;
		fs.appendFile(file, line, 'utf8', () => {});
	} catch {
		// Ignore write failures
	}
}

export class Logger {
	constructor(private readonly scope: string) {}

	info(message: string, meta?: unknown) {
		console.log(`[${this.scope}] INFO: ${message}`, meta ?? '');
		appendToLog('INFO', this.scope, message, meta);
	}

	warn(message: string, meta?: unknown) {
		console.warn(`[${this.scope}] WARN: ${message}`, meta ?? '');
		appendToLog('WARN', this.scope, message, meta);
	}

	error(message: string, meta?: unknown) {
		console.error(`[${this.scope}] ERROR: ${message}`, meta ?? '');
		appendToLog('ERROR', this.scope, message, meta);
	}
}
