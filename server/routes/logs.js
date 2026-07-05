// Log file viewer API endpoints — moved verbatim from server.js.
// Shared logging state (log paths, width, formatters) is injected by server.js
// via createLogsRouter so behavior is identical to the original inline routes.

import fs from 'node:fs';
import path from 'node:path';
import express from 'express';

export function createLogsRouter({
	logsDir,
	authzRedirectLogFile,
	clientLogFile,
	LOG_WIDTH,
	prefixLogLines,
	originalError,
}) {
	const router = express.Router();

	/**
	 * Persist callback redirect diagnostics for MFA/OAuth callback debugging
	 * POST /api/logs/authz-redirect
	 */
	router.post('/api/logs/authz-redirect', (req, res) => {
		try {
			const payload = req.body && typeof req.body === 'object' ? req.body : { value: req.body };
			const now = new Date();
			const timestamp = now.toISOString();
			const localTime = now.toLocaleString('en-US', {
				timeZone: 'America/Chicago',
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				hour12: false,
			});
			const logEntry = {
				timestamp,
				requestPath: req.path,
				requestMethod: req.method,
				clientIp: req.ip,
				...payload,
			};

			fs.appendFileSync(
				authzRedirectLogFile,
				`[${timestamp}] [${localTime}] ${JSON.stringify(logEntry)}\n`,
				'utf8'
			);
			return res.status(200).json({ success: true });
		} catch (error) {
			console.error('[AuthzRedirectLog] Failed to append authz redirect log:', error);
			return res.status(500).json({
				success: false,
				error: 'failed_to_append_authz_redirect_log',
				message: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	});

	/**
	 * List available log files
	 * GET /api/logs/list
	 */
	router.get('/api/logs/list', (req, res) => {
		try {
			const files = fs.readdirSync(logsDir);
			const serverLogFiles = new Set(['server.log', 'server-error.log', 'backend.log']);
			const apiLogFiles = new Set(['pingone-api.log', 'real-api.log', 'api-log.log']);
			const frontendLogFiles = new Set(['client.log']);
			const mfaLogFiles = new Set(['fido.log', 'sms.log', 'email.log', 'whatsapp.log', 'voice.log']);
			const oauthLogFiles = new Set(['authz-redirects.log', 'oauth.log', 'oidc.log']);
			const mcpLogFiles = new Set(['mcp-server.log']);
			const logFiles = files
				.filter((f) => f.endsWith('.log'))
				.map((f) => {
					const filePath = path.join(logsDir, f);
					const stats = fs.statSync(filePath);

					// Categorize log files
					let category = 'other';
					if (serverLogFiles.has(f) || /^server(-|_).+\.log$/i.test(f)) {
						category = 'server';
					} else if (mcpLogFiles.has(f) || /^mcp.+\.log$/i.test(f)) {
						category = 'mcp';
						category = 'mfa';
					} else if (oauthLogFiles.has(f) || /(authz|oauth|oidc|redirect).+\.log$/i.test(f)) {
						category = 'oauth';
					}

					return {
						name: f,
						size: stats.size,
						modified: stats.mtime,
						category,
					};
				});

			// Prefer order for main log streams so Log Viewer shows them first
			const streamOrder = [
				'server.log',
				'pingone-api.log',
				'mcp-server.log',
				'client.log',
				'authz-redirects.log',
			];
			logFiles.sort((a, b) => {
				const ai = streamOrder.indexOf(a.name);
				const bi = streamOrder.indexOf(b.name);
				if (ai !== -1 && bi !== -1) return ai - bi;
				if (ai !== -1) return -1;
				if (bi !== -1) return 1;
				return b.modified - a.modified; // Most recent first for others
			});

			res.json(logFiles);
		} catch (error) {
			console.error('[Log Viewer] Failed to list log files:', error);
			res.status(500).json({ error: 'Failed to list log files', message: error.message });
		}
	});

	/**
	 * Read log file content
	 * GET /api/logs/read?file=server.log&lines=100&tail=true
	 */
	router.get('/api/logs/read', (req, res) => {
		try {
			const { file, lines = '100', tail = 'false' } = req.query;

			if (!file) {
				return res.status(400).json({ error: 'Missing required parameter: file' });
			}

			const filePath = path.join(logsDir, file);

			// Security: validate file path is within logs directory
			const resolvedPath = path.resolve(filePath);
			const resolvedLogsDir = path.resolve(logsDir);
			if (resolvedPath !== resolvedLogsDir && !resolvedPath.startsWith(resolvedLogsDir + path.sep)) {
				return res.status(403).json({ error: 'Access denied' });
			}

			// If file does not exist (e.g. pingone-api.log not created yet), return 200 with empty content
			if (!fs.existsSync(filePath)) {
				return res.status(200).json({
					content: '',
					totalLines: 0,
					fileSize: 0,
					modified: null,
				});
			}

			const stats = fs.statSync(filePath);
			const lineCount = parseInt(lines, 10);

			// For large files (>100MB), enforce streaming
			if (stats.size > 100 * 1024 * 1024 && tail === 'false') {
				return res.status(400).json({
					error: 'File too large',
					message: 'This file is too large. Please use tail mode or reduce line count.',
					size: stats.size,
				});
			}

			let content;
			if (tail === 'true') {
				// Read last N lines
				const fileContent = fs.readFileSync(filePath, 'utf8');
				const allLines = fileContent.split('\n');
				const startIndex = Math.max(0, allLines.length - lineCount);
				content = allLines.slice(startIndex).join('\n');
			} else {
				// Read first N lines
				const fileContent = fs.readFileSync(filePath, 'utf8');
				const allLines = fileContent.split('\n');
				content = allLines.slice(0, lineCount).join('\n');
			}

			// Ensure content is a string and handle empty files
			if (typeof content !== 'string') {
				content = '';
			}

			const response = {
				content: content || '', // Ensure content is never undefined
				totalLines: content ? content.split('\n').length : 0,
				fileSize: stats.size,
				modified: stats.mtime,
			};

			res.json(response);
		} catch (error) {
			console.error('[Log Viewer] Failed to read log file:', error);
			res.status(500).json({ error: 'Failed to read log file', message: error.message });
		}
	});

	/**
	 * Tail log file with Server-Sent Events
	 * GET /api/logs/tail?file=server.log
	 */
	router.get('/api/logs/tail', (req, res) => {
		try {
			const { file } = req.query;

			if (!file) {
				return res.status(400).json({ error: 'Missing required parameter: file' });
			}

			const filePath = path.join(logsDir, file);

			// Security: validate file path
			const resolvedPath = path.resolve(filePath);
			const resolvedLogsDir = path.resolve(logsDir);
			if (resolvedPath !== resolvedLogsDir && !resolvedPath.startsWith(resolvedLogsDir + path.sep)) {
				return res.status(403).json({ error: 'Access denied' });
			}

			// Check if file exists
			if (!fs.existsSync(filePath)) {
				return res.status(404).json({ error: 'Log file not found' });
			}

			// Setup SSE
			res.setHeader('Content-Type', 'text/event-stream');
			res.setHeader('Cache-Control', 'no-cache');
			res.setHeader('Connection', 'keep-alive');
			res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

			// Send initial connection message
			res.write('data: {"type":"connected"}\n\n');
			res.flush(); // Ensure initial message is sent immediately

			let lastSize = fs.statSync(filePath).size;

			// Poll for changes every 1 second
			const interval = setInterval(() => {
				try {
					const stats = fs.statSync(filePath);
					const currentSize = stats.size;

					if (currentSize > lastSize) {
						// File has grown, read new content
						const stream = fs.createReadStream(filePath, {
							start: lastSize,
							end: currentSize - 1,
							encoding: 'utf8',
						});

						let newContent = '';
						stream.on('data', (chunk) => {
							newContent += chunk;
						});

						stream.on('end', () => {
							if (newContent) {
								const lines = newContent.split('\n').filter((line) => line.trim());
								if (lines.length > 0) {
									res.write(`data: ${JSON.stringify({ type: 'update', lines })}\n\n`);
									res.flush(); // Ensure update is sent immediately
								}
							}
							lastSize = currentSize;
						});
					}
				} catch (error) {
					console.error('[Log Tail] Error reading file:', error);
					clearInterval(interval);
					res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
					res.end();
				}
			}, 1000); // 1 second poll rate as requested

			// Cleanup on client disconnect
			req.on('close', () => {
				clearInterval(interval);
				console.log(`[Log Tail] Client disconnected from ${file}`);
			});
		} catch (error) {
			console.error('[Log Viewer] Failed to setup tail:', error);
			// Don't send JSON response if headers might already be set
			if (!res.headersSent) {
				res.status(500).json({ error: 'Failed to setup tail', message: error.message });
			} else {
				// If headers already sent, send error via SSE
				res.write(
					`data: ${JSON.stringify({ type: 'error', message: 'Failed to setup tail: ' + error.message })}\n\n`
				);
				res.end();
			}
		}
	});

	/**
	 * Client-side logging endpoint
	 * Receives logs from the frontend and writes them to client.log with enhanced formatting
	 */
	router.post('/__client-log', async (req, res) => {
		try {
			const { level, message, meta } = req.body;

			if (!level || !message) {
				return res.status(400).json({ error: 'Missing required fields: level, message' });
			}

			const now = new Date();
			const timestamp = now.toISOString();
			const localTime = now.toLocaleString('en-US', {
				timeZone: 'America/Chicago',
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				hour12: false,
			});

			const levelEmoji =
				level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'info' ? 'ℹ️' : '🔍';
			const levelUpper = level.toUpperCase();

			// Format client log with enhanced structure - NO TRUNCATION, wider box
			let logMessage = `\n${'*'.repeat(LOG_WIDTH)}\n`;
			logMessage += `* ${levelEmoji} CLIENT LOG: ${levelUpper}\n`;
			logMessage += `* 📅 Date/Time: ${localTime} (${timestamp})\n`;
			logMessage += `* 📝 Message: ${message}\n`;

			if (meta && Object.keys(meta).length > 0) {
				const metaJSON = JSON.stringify(meta, null, 2);
				const metaLines = metaJSON.split('\n');
				logMessage += `* 📊 Metadata:\n`;
				metaLines.forEach((line) => {
					logMessage += `*   ${line}\n`;
				});
			}

			logMessage += `* ${'─'.repeat(LOG_WIDTH - 4)} *\n`;
			logMessage += `* END OF CLIENT LOG ENTRY\n`;
			logMessage += `${'*'.repeat(LOG_WIDTH)}\n`;

			// Prefix every line with date/time so all log entries show date and time like startup logs
			logMessage = prefixLogLines(logMessage, timestamp, localTime);

			// Write to client.log file (async, non-blocking)
			fs.appendFile(clientLogFile, logMessage, 'utf8', (err) => {
				if (err) {
					originalError('[Client Logging Error] Failed to write to client.log:', {
						error: err,
						file: clientLogFile,
						message: err.message,
					});
				}
			});

			// Also log to server.log for visibility
			console.log(`[CLIENT:${levelUpper}] ${message}`, meta || {});

			res.status(200).json({ success: true });
		} catch (error) {
			originalError('[Client Logging Error] Failed to process client log:', error);
			res.status(500).json({ error: 'Failed to process client log', message: error.message });
		}
	});

	return router;
}
