/* eslint-disable */
// Provides secure server-side OAuth flow implementations

import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import https from 'node:https';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { AsyncLocalStorage } from 'node:async_hooks';
import fetch from 'node-fetch';

dotenv.config();

// Setup file logging
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDir = path.join(__dirname, 'logs');
const logFile = path.join(logsDir, 'server.log');
const clientLogFile = path.join(logsDir, 'client.log');

// Create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
	fs.mkdirSync(logsDir, { recursive: true });
}

// Separate log file for PingOne API calls
const pingOneApiLogFile = path.join(logsDir, 'pingone-api.log');
const apiLogFile = path.join(logsDir, 'api-log.log');
const realApiLogFile = path.join(logsDir, 'real-api.log');

// Log width constant - wider for better readability, no truncation
const LOG_WIDTH = 150;

// Helper function to format log message with enhanced timestamp and structure
const formatLogMessage = (level, ...args) => {
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
		hour12: false 
	});
	
	const message = args.map(arg => {
		if (typeof arg === 'object' && arg !== null) {
			try {
				return JSON.stringify(arg, null, 2);
			} catch {
				return String(arg);
			}
		}
		return String(arg);
	}).join(' ');
	
	// Enhanced format with date/time and level indicator
	const levelEmoji = level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : 'ℹ️';
	return `[${timestamp}] [${localTime}] [${levelEmoji} ${level}] ${message}\n`;
};

// Override console.log to write to both console and file (async, non-blocking)
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = (...args) => {
	originalLog(...args);
	// Write to file asynchronously to avoid blocking
	fs.appendFile(logFile, formatLogMessage('LOG', ...args), 'utf8', (err) => {
		if (err) {
			originalError('[Logging Error] Failed to write to log file:', err);
		}
	});
};

console.error = (...args) => {
	originalError(...args);
	// Write to file asynchronously to avoid blocking
	fs.appendFile(logFile, formatLogMessage('ERROR', ...args), 'utf8', (err) => {
		if (err) {
			originalError('[Logging Error] Failed to write to log file:', err);
		}
	});
};

console.warn = (...args) => {
	originalWarn(...args);
	// Write to file asynchronously to avoid blocking
	fs.appendFile(logFile, formatLogMessage('WARN', ...args), 'utf8', (err) => {
		if (err) {
			originalError('[Logging Error] Failed to write to log file:', err);
		}
	});
};

console.log('🚀 Starting OAuth Playground Backend Server...'); // OAuth Playground Backend Server
console.log(`📝 Server logs: ${logFile}`);
console.log(`📝 PingOne API logs: ${pingOneApiLogFile}`);
console.log(`📝 Real API logs (no proxy): ${realApiLogFile}`);
console.log(`📝 Client logs: ${clientLogFile}`);

// Ensure fetch is available globally for server handlers that reference global.fetch
if (typeof globalThis.fetch !== 'function') {
	// @ts-expect-error
	globalThis.fetch = fetch;
}

const pingOneRequestContext = new AsyncLocalStorage();
const pingOneCallStore = new Map();
const PINGONE_CALL_TTL_MS = 5 * 60 * 1000; // 5 minutes

setInterval(() => {
	const now = Date.now();
	for (const [id, entry] of pingOneCallStore.entries()) {
		if (entry.expiresAt <= now) {
			pingOneCallStore.delete(id);
		}
	}
}, 60 * 1000).unref();

const isPingOneUrl = (url) => {
	if (!url) {
		return false;
	}
	return url.includes('pingone.com') || url.includes('auth.pingone') || url.includes('directory.pingone');
};

const getRequestUrl = (input) => {
	if (!input) {
		return '';
	}
	if (typeof input === 'string') {
		return input;
	}
	if (input instanceof URL) {
		return input.toString();
	}
	if (typeof input === 'object' && 'url' in input && typeof input.url === 'string') {
		return input.url;
	}
	try {
		return input?.url?.toString?.() ?? '';
	} catch {
		return '';
	}
};

const getRequestMethod = (input, init = {}) => {
	if (init?.method) {
		return init.method.toString();
	}
	if (typeof input === 'object' && input?.method) {
		return input.method.toString();
	}
	return 'GET';
};

const recordPingOneCall = (res, call) => {
	if (!res?.locals) {
		return;
	}
	if (!Array.isArray(res.locals.__pingOneCalls)) {
		res.locals.__pingOneCalls = [];
	}
	res.locals.__pingOneCalls.push(call);
};

const originalGlobalFetch = globalThis.fetch.bind(globalThis);
const normalizeHeaderObject = (inputHeaders) => {
	if (!inputHeaders) {
		return undefined;
	}
	const headers = new Headers();
	if (inputHeaders instanceof Headers) {
		inputHeaders.forEach((value, key) => headers.set(key, value));
	} else if (Array.isArray(inputHeaders)) {
		inputHeaders.forEach(([key, value]) => headers.set(key, value));
	} else if (typeof inputHeaders === 'object') {
		for (const [key, value] of Object.entries(inputHeaders)) {
			if (typeof value === 'string') {
				headers.set(key, value);
			} else if (Array.isArray(value)) {
				headers.set(key, value.join(', '));
			} else if (value !== undefined && value !== null) {
				headers.set(key, String(value));
			}
		}
	}
	if (headers.size === 0) {
		return undefined;
	}
	const normalized = {};
	headers.forEach((value, key) => {
		normalized[key] = value;
	});
	return normalized;
};

const encodeBodyToBase64 = (body) => {
	if (body === undefined || body === null) {
		return undefined;
	}
	if (typeof body === 'string') {
		return Buffer.from(body).toString('base64');
	}
	if (Buffer.isBuffer(body)) {
		return body.toString('base64');
	}
	if (body instanceof URLSearchParams) {
		return Buffer.from(body.toString()).toString('base64');
	}
	if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
		return Buffer.from(body).toString('base64');
	}
	if (typeof body === 'object' && body !== null && typeof body.toString === 'function') {
		try {
			return Buffer.from(body.toString()).toString('base64');
		} catch {
			return undefined;
		}
	}
	return undefined;
};

globalThis.fetch = async (input, init = {}) => {
	const startTime = Date.now();
	const requestHeaders = (() => {
		const headers = new Headers();
		if (input instanceof Request) {
			input.headers.forEach((value, key) => headers.set(key, value));
		}
		if (init?.headers) {
			if (init.headers instanceof Headers) {
				init.headers.forEach((value, key) => headers.set(key, value));
			} else if (Array.isArray(init.headers)) {
				init.headers.forEach(([key, value]) => headers.set(key, value));
			} else if (typeof init.headers === 'object') {
				for (const [key, value] of Object.entries(init.headers)) {
					if (typeof value === 'string') {
						headers.set(key, value);
					} else if (Array.isArray(value)) {
						headers.set(key, value.join(', '));
					} else if (value !== undefined && value !== null) {
						headers.set(key, String(value));
					}
				}
			}
		}
		if (headers.size === 0) {
			return undefined;
		}
		const normalized = {};
		headers.forEach((value, key) => {
			normalized[key] = value;
		});
		return normalized;
	})();
	const requestBodyBase64 = encodeBodyToBase64(init?.body);
	
	// CRITICAL: Log headers being sent to PingOne for FIDO2 activation
	const url = getRequestUrl(input);
	if (isPingOneUrl(url) && url.includes('/activate/fido2')) {
		console.log('[FETCH WRAPPER] 🔍 FIDO2 Activation - Headers being sent to originalGlobalFetch:', {
			url,
			headersType: typeof init?.headers,
			headersIsObject: init?.headers && typeof init?.headers === 'object' && !Array.isArray(init?.headers),
			headersKeys: init?.headers ? Object.keys(init.headers) : [],
			authorizationHeader: init?.headers?.Authorization || init?.headers?.authorization || 'NOT FOUND',
			authorizationLength: (init?.headers?.Authorization || init?.headers?.authorization || '').length,
			authorizationPreview: (init?.headers?.Authorization || init?.headers?.authorization || '').substring(0, 50),
			authorizationStartsWithBearer: (init?.headers?.Authorization || init?.headers?.authorization || '').startsWith('Bearer '),
			// Check if it's already a hash
			authorizationIsHash: (() => {
				const auth = (init?.headers?.Authorization || init?.headers?.authorization || '').replace(/^Bearer\s+/i, '');
				return auth.length === 44 && /^[A-Za-z0-9+/=]+$/.test(auth);
			})(),
			// Full headers object
			allHeaders: JSON.stringify(init?.headers || {}).substring(0, 500),
		});
	}
	
	const response = await originalGlobalFetch(input, init);
	try {
		const store = pingOneRequestContext.getStore();
		const res = store?.res;
		if (!res) {
			return response;
		}
		const url = getRequestUrl(input);
		if (!isPingOneUrl(url)) {
			return response;
		}
		const method = getRequestMethod(input, init).toUpperCase();
		let responseBodyBase64;
		try {
			const responseClone = response.clone();
			const raw = await responseClone.text();
			if (raw) {
				responseBodyBase64 = Buffer.from(raw).toString('base64');
			}
		} catch (error) {
			console.warn('[PingOne Call Tracker] Failed to read PingOne response body', error);
		}
		recordPingOneCall(res, {
			url,
			method,
			status: response.status,
			statusText: response.statusText,
			requestId: response.headers.get('pingone-request-id') || response.headers.get('x-request-id') || undefined,
			duration: Date.now() - startTime,
			timestamp: Date.now(),
			requestHeaders,
			requestBodyBase64,
			responseBodyBase64,
		});
	} catch (error) {
		console.warn('[PingOne Call Tracker] Unable to record PingOne call metadata', error);
	}
	return response;
};

// __filename and __dirname already defined above for logging setup

const app = express();

const attachPingOneHeaderMetadata = (res) => {
	if (res.locals.__pingOneHeadersFlushed || res.headersSent) {
		return;
	}
	res.locals.__pingOneHeadersFlushed = true;
	if (!Array.isArray(res.locals.__pingOneCalls) || res.locals.__pingOneCalls.length === 0) {
		return;
	}
	try {
		const callId = randomUUID();
		pingOneCallStore.set(callId, {
			calls: res.locals.__pingOneCalls,
			expiresAt: Date.now() + PINGONE_CALL_TTL_MS,
		});
		res.set('x-pingone-calls-id', callId);
	} catch (error) {
		console.warn('[PingOne Call Tracker] Failed to serialize call metadata', error);
	}
};

app.use((req, res, next) => {
	pingOneRequestContext.enterWith({ res });
	res.locals.__pingOneCalls = [];
	const wrapResponseMethod = (methodName) => {
		const original = res[methodName];
		if (typeof original !== 'function') {
			return;
		}
		res[methodName] = (...args) => {
			attachPingOneHeaderMetadata(res);
			return original.apply(res, args);
		};
	};
	wrapResponseMethod('json');
	wrapResponseMethod('send');
	wrapResponseMethod('end');
	res.on('close', () => attachPingOneHeaderMetadata(res));
	next();
});

const packageJsonPath = path.join(__dirname, 'package.json');
let APP_VERSION = '0.0.0-dev';
try {
	if (fs.existsSync(packageJsonPath)) {
		const packageJsonRaw = fs.readFileSync(packageJsonPath, 'utf8');
		const packageJson = JSON.parse(packageJsonRaw);
		APP_VERSION = packageJson.version ?? APP_VERSION;
	} else {
		console.warn('[Server] package.json not found when deriving version metadata');
	}
} catch (error) {
	console.warn('[Server] Unable to read package.json for version metadata:', error);
}
const PORT = process.env.PORT || 3001;
const serverStartTime = new Date();

/**
 * Comprehensive PingOne API call logger
 * Logs all details of PingOne API calls to a separate log file for debugging
 * @param {string} operationName - Name of the operation (e.g., "Register MFA Device")
 * @param {string} url - Full PingOne API URL
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {object} headers - Request headers (token will be truncated)
 * @param {object|string} body - Request body (will be stringified if object)
 * @param {Response} response - Fetch Response object
 * @param {object} responseData - Parsed response data
 * @param {number} duration - Request duration in milliseconds
 * @param {object} metadata - Additional metadata to log
 */
/**
 * Helper function to log request/response summary to server.log
 * Adds clear markers with date/time and operation summary
 */
function logRequestResponseSummary(endpoint, method, status, statusText, duration, operationName = '', metadata = {}) {
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
		hour12: false 
	});
	
	const isSuccess = status >= 200 && status < 300;
	const statusEmoji = isSuccess ? '✅' : status >= 400 ? '❌' : '⚠️';
	const statusDesc = isSuccess ? 'SUCCESS' : status >= 400 ? 'ERROR' : 'UNKNOWN';
	
	// NO TRUNCATION - show full endpoint and metadata
	const summary = [
		`\n${'='.repeat(LOG_WIDTH)}`,
		`📋 BACKEND REQUEST/RESPONSE SUMMARY`,
		`${'='.repeat(LOG_WIDTH)}`,
		`📍 Endpoint: ${endpoint}`,
		`🔧 Method: ${method}`,
		`${statusEmoji} Status: ${status} ${statusText} (${statusDesc})`,
		`⏱️  Duration: ${duration}ms`,
		operationName ? `📝 Operation: ${operationName}` : '',
		Object.keys(metadata).length > 0 ? `📊 Metadata: ${JSON.stringify(metadata, null, 2)}` : '',
		`📅 Date/Time: ${localTime} (${timestamp})`,
		`${'='.repeat(LOG_WIDTH)}`,
		`END OF REQUEST/RESPONSE SUMMARY`,
		`${'='.repeat(LOG_WIDTH)}\n`,
	].filter(Boolean).join('\n');
	
	console.log(summary);
}

/**
 * Helper function to log operation start/end markers
 * Useful for marking the beginning and end of major operations
 */
function logOperationMarker(operationName, type = 'START', metadata = {}) {
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
		hour12: false 
	});
	
	const emoji = type === 'START' ? '🚀' : type === 'END' ? '🏁' : '📍';
	// NO TRUNCATION - show full metadata
	const marker = [
		`\n${'─'.repeat(LOG_WIDTH)}`,
		`${emoji} ${type}: ${operationName}`,
		`📅 Date/Time: ${localTime} (${timestamp})`,
		Object.keys(metadata).length > 0 ? `📊 Context: ${JSON.stringify(metadata, null, 2)}` : '',
		`${'─'.repeat(LOG_WIDTH)}\n`,
	].filter(Boolean).join('\n');
	
	console.log(marker);
}

function logPingOneApiCall(operationName, url, method, headers, body, response, responseData, duration, metadata = {}) {
	const requestBody = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
	const requestBodyObj = typeof body === 'string' ? (() => { try { return JSON.parse(body); } catch { return body; } })() : body;
	
	// For FIDO2 activation, show full token for debugging
	// For other operations, truncate token in headers for security
	const safeHeaders = { ...headers };
	if (safeHeaders.Authorization) {
		const isFIDO2Activation = (operationName.includes('FIDO2') && operationName.includes('Activate')) || 
		                           url.includes('/activate/fido2');
		if (isFIDO2Activation) {
			// Show full token for FIDO2 activation debugging
			// Keep the full Authorization header as-is (no truncation)
			console.log('[logPingOneApiCall] 🔍 FIDO2 Activation detected - showing full token in log');
		} else {
			// Truncate token for other operations
			const token = safeHeaders.Authorization.replace('Bearer ', '');
			safeHeaders.Authorization = `Bearer ${token.substring(0, 20)}...${token.substring(token.length - 10)}`;
		}
	}

	// Extract response headers
	const responseHeaders = {};
	if (response && response.headers) {
		response.headers.forEach((value, key) => {
			responseHeaders[key] = value;
		});
	}

	const responseBody = typeof responseData === 'string' ? responseData : JSON.stringify(responseData, null, 2);

	// Build log message for PingOne API log file
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
		hour12: false 
	});
	
	// Header with asterisks for better visibility - wider box, no truncation
	const headerPadding = LOG_WIDTH - 4; // Account for "* " and " *" on each side
	let logMessage = `\n${'*'.repeat(LOG_WIDTH)}\n`;
	logMessage += `* ${' '.repeat(headerPadding)} *\n`;
	logMessage += `*  🌐 PINGONE API CALL: ${operationName}\n`;
	logMessage += `*  📅 Timestamp: ${timestamp}\n`;
	logMessage += `*  🕐 Local Time: ${localTime}\n`;
	logMessage += `* ${' '.repeat(headerPadding)} *\n`;
	logMessage += `${'*'.repeat(LOG_WIDTH)}\n\n`;
	
	// Request section
	logMessage += `═══════════════════════════════════════════════════════════════════════════════\n`;
	logMessage += `📤 REQUEST\n`;
	logMessage += `═══════════════════════════════════════════════════════════════════════════════\n`;
	logMessage += `📍 URL: ${url}\n`;
	logMessage += `🔧 METHOD: ${method}\n`;
	logMessage += `📋 REQUEST HEADERS: ${JSON.stringify(safeHeaders, null, 2)}\n`;
	logMessage += `📦 REQUEST BODY (JSON): ${JSON.stringify(requestBodyObj, null, 2)}\n`;
	logMessage += `📦 REQUEST BODY (Raw): ${requestBody}\n`;
	if (Object.keys(metadata).length > 0) {
		logMessage += `📊 REQUEST METADATA: ${JSON.stringify(metadata, null, 2)}\n`;
	}
	
	// Response section
	if (response) {
		logMessage += `\n${'─'.repeat(65)}\n\n`;
		logMessage += `═══════════════════════════════════════════════════════════════════════════════\n`;
		logMessage += `📥 RESPONSE\n`;
		logMessage += `═══════════════════════════════════════════════════════════════════════════════\n`;
		logMessage += `📊 STATUS: ${response.status} ${response.statusText}\n`;
		logMessage += `⏱️  DURATION: ${duration}ms\n`;
		logMessage += `📋 RESPONSE HEADERS: ${JSON.stringify(responseHeaders, null, 2)}\n`;
		logMessage += `📦 RESPONSE BODY (JSON): ${JSON.stringify(responseData, null, 2)}\n`;
		logMessage += `📦 RESPONSE BODY (Raw): ${responseBody}\n`;
	}
	
	// Footer separator with date, time, and operation summary
	logMessage += `\n${'*'.repeat(LOG_WIDTH)}\n`;
	
	// Determine operation status and summary
	const status = response ? response.status : 'NO_RESPONSE';
	const statusText = response ? response.statusText : 'No response received';
	const isSuccess = response && response.status >= 200 && response.status < 300;
	const statusEmoji = isSuccess ? '✅' : response && response.status >= 400 ? '❌' : '⚠️';
	const statusDescription = isSuccess 
		? 'SUCCESS' 
		: response && response.status >= 400 
			? 'ERROR' 
			: 'UNKNOWN';
	
	// Build summary lines - NO TRUNCATION, wider box
	const summaryLine = `* ${statusEmoji} ${operationName} - ${statusDescription} (${status} ${statusText})`;
	logMessage += `${summaryLine}\n`;
	
	// Add date/time line
	const dateTimeLine = `* 📅 Date/Time: ${localTime} (${timestamp})`;
	logMessage += `${dateTimeLine}\n`;
	
	// Add duration line
	const durationLine = `* ⏱️  Duration: ${duration}ms`;
	logMessage += `${durationLine}\n`;
	
	// Add URL line - NO TRUNCATION
	const urlLine = `* 🔗 URL: ${url}`;
	logMessage += `${urlLine}\n`;
	
	// Add method line
	const methodLine = `* 🔧 Method: ${method}`;
	logMessage += `${methodLine}\n`;
	
	// Add full metadata if available - NO TRUNCATION
	if (metadata && Object.keys(metadata).length > 0) {
		const metadataKeys = Object.keys(metadata).filter(k => 
			!['requestHeaders', 'requestBody', 'responseHeaders', 'responseBody'].includes(k)
		);
		if (metadataKeys.length > 0) {
			const metadataObj = {};
			metadataKeys.forEach(k => {
				metadataObj[k] = metadata[k];
			});
			const metadataJSON = JSON.stringify(metadataObj, null, 2);
			// Split metadata across multiple lines if needed, with proper indentation
			const metadataLines = metadataJSON.split('\n');
			logMessage += `* 📊 Metadata:\n`;
			metadataLines.forEach(line => {
				logMessage += `*   ${line}\n`;
			});
		}
	}
	
	// End marker
	logMessage += `* ${'─'.repeat(LOG_WIDTH - 4)} *\n`;
	logMessage += `* END OF API CALL: ${operationName}\n`;
	logMessage += `${'*'.repeat(LOG_WIDTH)}\n`;

	// Check if this is a proxy call (case-insensitive check on operation name and URL)
	const isProxyCall = operationName.toLowerCase().includes('proxy') || 
	                    url.toLowerCase().includes('/proxy/') ||
	                    url.toLowerCase().includes('/api/pingone/proxy') ||
	                    (metadata && typeof metadata.endpoint === 'string' && metadata.endpoint.toLowerCase().includes('proxy'));
	
	// Write to both PingOne API log file and api-log.log (async, non-blocking)
	// Note: fs.appendFile will create the file if it doesn't exist
	console.log('[DEBUG] logPingOneApiCall: Writing to files:', pingOneApiLogFile, apiLogFile, isProxyCall ? '(skipping real-api.log - proxy call)' : realApiLogFile);
	console.log('[DEBUG] logPingOneApiCall: Log message length:', logMessage.length);
	console.log('[DEBUG] logPingOneApiCall: Is proxy call?', isProxyCall);
	
	// Write to pingone-api.log (all calls)
	fs.appendFile(pingOneApiLogFile, logMessage, 'utf8', (err) => {
		if (err) {
			originalError('[PingOne API Logging Error] Failed to write to pingone-api.log:', {
				error: err,
				file: pingOneApiLogFile,
				message: err.message,
				code: err.code,
				stack: err.stack,
			});
		} else {
			console.log(`[DEBUG] Successfully wrote to ${pingOneApiLogFile}`);
		}
	});
	
	// Write to api-log.log (all calls)
	fs.appendFile(apiLogFile, logMessage, 'utf8', (err) => {
		if (err) {
			originalError('[PingOne API Logging Error] Failed to write to api-log.log:', {
				error: err,
				file: apiLogFile,
				message: err.message,
				code: err.code,
				stack: err.stack,
			});
		} else {
			console.log(`[DEBUG] Successfully wrote to ${apiLogFile}`);
		}
	});
	
	// Write to real-api.log (only non-proxy calls)
	if (!isProxyCall) {
		fs.appendFile(realApiLogFile, logMessage, 'utf8', (err) => {
			if (err) {
				originalError('[PingOne API Logging Error] Failed to write to real-api.log:', {
					error: err,
					file: realApiLogFile,
					message: err.message,
					code: err.code,
					stack: err.stack,
				});
			} else {
				console.log(`[DEBUG] Successfully wrote to ${realApiLogFile}`);
			}
		});
	}
}
const requestStats = {
	totalRequests: 0,
	activeConnections: 0,
	totalResponseTimeMs: 0,
	errorCount: 0,
};

// Middleware with enhanced CORS and CSP
app.use(
	cors({
		origin: process.env.FRONTEND_URL || [
			'http://localhost:3000',
			'https://localhost:3000',
			'http://localhost:3001',
			'https://localhost:3001',
		],
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
		exposedHeaders: ['x-pingone-calls', 'x-pingone-calls-id', 'Content-Length', 'X-Foo', 'X-Bar'],
	})
);

// Add CSP headers
app.use((_req, res, next) => {
	res.setHeader(
		'Content-Security-Policy',
		"default-src 'self'; " +
			"script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
			"style-src 'self' 'unsafe-inline'; " +
			"font-src 'self' data:; " +
			"img-src 'self' data:; " +
			"connect-src 'self' http://localhost:3000 http://localhost:3001 https://localhost:3000 https://localhost:3001 wss://localhost:3000 wss://localhost:3001; " +
			"frame-ancestors 'none'; " +
			"base-uri 'self'"
	);
	next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Client-side logging endpoint
 * Receives logs from the frontend and writes them to client.log with enhanced formatting
 */
app.post('/__client-log', async (req, res) => {
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
			hour12: false 
		});
		
		const levelEmoji = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'info' ? 'ℹ️' : '🔍';
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
			metaLines.forEach(line => {
				logMessage += `*   ${line}\n`;
			});
		}
		
		logMessage += `* ${'─'.repeat(LOG_WIDTH - 4)} *\n`;
		logMessage += `* END OF CLIENT LOG ENTRY\n`;
		logMessage += `${'*'.repeat(LOG_WIDTH)}\n`;
		
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

app.get('/api/pingone/calls/:id', (req, res) => {
	const { id } = req.params;
	if (!id) {
		return res.status(400).json({ error: 'missing_call_id' });
	}
	const record = pingOneCallStore.get(id);
	if (!record) {
		return res.status(404).json({ error: 'not_found' });
	}
	pingOneCallStore.delete(id);
	return res.json({ calls: record.calls });
});

// In-memory cookie jar for PingOne redirectless flows (per-user session)
// Keyed by sessionId returned to the frontend; values are arrays of "name=value" cookie strings
const cookieJar = new Map();

/**
 * Merges two arrays of cookies (formatted as "name=value") with later values winning by name.
 */
const mergeCookieArrays = (existing = [], incoming = []) => {
	const byName = new Map();
	for (const c of existing) {
		const [name] = c.split('=');
		byName.set(name, c);
	}
	for (const c of incoming) {
		const [name] = c.split('=');
		byName.set(name, c);
	}
	return Array.from(byName.values());
};

// Request statistics tracking middleware
app.use((req, res, next) => {
	const startTime = process.hrtime.bigint();
	requestStats.totalRequests += 1;
	requestStats.activeConnections += 1;
	let finalized = false;

	const finalize = (isError = false) => {
		if (finalized) {
			return;
		}
		finalized = true;
		requestStats.activeConnections = Math.max(0, requestStats.activeConnections - 1);
		const durationNs = process.hrtime.bigint() - startTime;
		const durationMs = Number(durationNs) / 1_000_000;
		if (Number.isFinite(durationMs)) {
			requestStats.totalResponseTimeMs += durationMs;
		}
		if (isError || res.statusCode >= 400) {
			requestStats.errorCount += 1;
		}
	};

	res.on('finish', () => finalize());
	res.on('close', () => finalize(true));
	res.on('error', () => finalize(true));

	next();
});

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/api/health', (_req, res) => {
	const now = Date.now();
	const uptimeSeconds = Math.max(0, Math.floor((now - serverStartTime.getTime()) / 1000));
	const memoryUsage = process.memoryUsage();
	const arrayBuffers = typeof memoryUsage.arrayBuffers === 'number' ? memoryUsage.arrayBuffers : 0;
	const totalSystemMemory = os.totalmem();
	const freeSystemMemory = os.freemem();
	const cpuCount = os.cpus().length || 1;
	const loadAverage = os.loadavg();
	const cpuUsage = {
		avg1mPercent: Number(((loadAverage[0] / cpuCount) * 100).toFixed(2)),
		avg5mPercent: Number(((loadAverage[1] / cpuCount) * 100).toFixed(2)),
		avg15mPercent: Number(((loadAverage[2] / cpuCount) * 100).toFixed(2)),
	};
	const averageResponseTimeMs =
		requestStats.totalRequests > 0
			? requestStats.totalResponseTimeMs / requestStats.totalRequests
			: 0;
	const errorRatePercent =
		requestStats.totalRequests > 0
			? (requestStats.errorCount / requestStats.totalRequests) * 100
			: 0;

	res.json({
		status: 'ok',
		timestamp: new Date(now).toISOString(),
		version: APP_VERSION,
		pid: process.pid,
		startTime: serverStartTime.toISOString(),
		uptimeSeconds,
		environment: process.env.NODE_ENV || 'development',
		node: {
			version: process.version,
			platform: process.platform,
			arch: process.arch,
		},
		memory: {
			rss: memoryUsage.rss,
			heapTotal: memoryUsage.heapTotal,
			heapUsed: memoryUsage.heapUsed,
			external: memoryUsage.external,
			arrayBuffers,
		},
		systemMemory: {
			total: totalSystemMemory,
			free: freeSystemMemory,
			used: totalSystemMemory - freeSystemMemory,
		},
		loadAverage,
		cpuUsage,
		requestStats: {
			totalRequests: requestStats.totalRequests,
			activeConnections: requestStats.activeConnections,
			avgResponseTime: Number(averageResponseTimeMs.toFixed(2)),
			errorRate: Number(errorRatePercent.toFixed(2)),
		},
	});
});

// Ensure errors are returned as JSON (prevents empty/plain 500s)
app.use((err, _req, res, _next) => {
	try {
		console.error('[Server] Unhandled error:', err);
		if (res.headersSent) return;
		const message = err && err.message ? err.message : 'Internal Server Error';
		res.status(500).json({
			error: 'internal_server_error',
			error_description: message,
		});
	} catch {
		try {
			res.status(500).json({ error: 'internal_server_error' });
		} catch {}
	}
});

// Generic OAuth callback handler - redirects to frontend callback component
app.get('/callback', (req, res) => {
	console.log('🔄 [Server] OAuth callback received:', {
		code: req.query.code ? `${req.query.code.substring(0, 20)}...` : 'none',
		state: req.query.state,
		error: req.query.error,
		error_description: req.query.error_description,
	});

	// Redirect to the frontend callback handler
	res.redirect(`https://localhost:3001/callback?${req.url.split('?')[1] || ''}`);
});

// Favicon handler - return 204 No Content to prevent 404 errors
app.get('/favicon.ico', (_req, res) => {
	res.status(204).end();
});

// Environment variables endpoint (for frontend to load default credentials)
app.get('/api/env-config', (_req, res) => {
	console.log('🔧 [Server] Environment config requested');

	const envConfig = {
		environmentId:
			process.env.PINGONE_ENVIRONMENT_ID || process.env.VITE_PINGONE_ENVIRONMENT_ID || '',
		clientId: process.env.PINGONE_CLIENT_ID || process.env.VITE_PINGONE_CLIENT_ID || '',
		clientSecret: process.env.PINGONE_CLIENT_SECRET || process.env.VITE_PINGONE_CLIENT_SECRET || '',
		redirectUri:
			process.env.PINGONE_REDIRECT_URI ||
			process.env.VITE_PINGONE_REDIRECT_URI ||
			'https://localhost:3000/authz-callback',
		scopes: ['openid', 'profile', 'email'],
		apiUrl:
			process.env.PINGONE_API_URL || process.env.VITE_PINGONE_API_URL || 'https://auth.pingone.com',
	};

	console.log('📤 [Server] Sending environment config:', {
		hasEnvironmentId: !!envConfig.environmentId,
		hasClientId: !!envConfig.clientId,
		redirectUri: envConfig.redirectUri,
	});

	res.json(envConfig);
});

// ============================================================================
// Credential File Storage API Endpoints
// ============================================================================
// These endpoints provide file-based credential storage that persists across
// server restarts. Credentials are stored in ~/.pingone-playground/credentials/
// directory on the server filesystem.

const CREDENTIALS_DIR = path.join(os.homedir(), '.pingone-playground', 'credentials');

// Ensure credentials directory exists
try {
	if (!fs.existsSync(CREDENTIALS_DIR)) {
		fs.mkdirSync(CREDENTIALS_DIR, { recursive: true });
		console.log(`📁 [Server] Created credentials directory: ${CREDENTIALS_DIR}`);
	}
} catch (error) {
	console.error(`❌ [Server] Failed to create credentials directory:`, error);
}

/**
 * Save credentials to file
 * POST /api/credentials/save
 * Body: { directory: string, filename: string, data: any }
 */
app.post('/api/credentials/save', (req, res) => {
	try {
		const { directory, filename, data } = req.body;

		if (!directory || !filename) {
			return res.status(400).json({
				success: false,
				error: 'Missing required parameters: directory and filename',
			});
		}

		// Validate directory path (prevent directory traversal attacks)
		const safeDirectory = path.normalize(directory).replace(/^(\.\.(\/|\\|$))+/, '');
		if (safeDirectory.includes('..')) {
			return res.status(400).json({
				success: false,
				error: 'Invalid directory path',
			});
		}

		const dirPath = path.join(CREDENTIALS_DIR, safeDirectory);
		const filePath = path.join(dirPath, filename);

		// Ensure directory exists
		if (!fs.existsSync(dirPath)) {
			fs.mkdirSync(dirPath, { recursive: true });
		}

		// Add metadata
		const dataWithMetadata = {
			...data,
			savedAt: Date.now(),
		};

		// Write to file
		fs.writeFileSync(filePath, JSON.stringify(dataWithMetadata, null, 2), 'utf8');

		console.log(`📁 [Server] Saved credentials to: ${safeDirectory}/${filename}`);

		res.json({
			success: true,
			path: `${safeDirectory}/${filename}`,
		});
	} catch (error) {
		console.error(`❌ [Server] Failed to save credentials:`, error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

/**
 * Load credentials from file
 * GET /api/credentials/load?directory=xxx&filename=xxx
 */
app.get('/api/credentials/load', (req, res) => {
	try {
		const { directory, filename } = req.query;

		if (!directory || !filename) {
			return res.status(400).json({
				success: false,
				error: 'Missing required parameters: directory and filename',
			});
		}

		// Validate directory path (prevent directory traversal attacks)
		const safeDirectory = path.normalize(String(directory)).replace(/^(\.\.(\/|\\|$))+/, '');
		if (safeDirectory.includes('..')) {
			return res.status(400).json({
				success: false,
				error: 'Invalid directory path',
			});
		}

		const filePath = path.join(CREDENTIALS_DIR, safeDirectory, String(filename));

		if (!fs.existsSync(filePath)) {
			return res.status(404).json({
				success: false,
				error: 'File not found',
			});
		}

		const fileContent = fs.readFileSync(filePath, 'utf8');
		const data = JSON.parse(fileContent);

		console.log(`📁 [Server] Loaded credentials from: ${safeDirectory}/${filename}`);

		res.json({
			success: true,
			data,
		});
	} catch (error) {
		console.error(`❌ [Server] Failed to load credentials:`, error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

/**
 * Delete credentials file
 * DELETE /api/credentials/delete?directory=xxx&filename=xxx
 */
app.delete('/api/credentials/delete', (req, res) => {
	try {
		const { directory, filename } = req.query;

		if (!directory || !filename) {
			return res.status(400).json({
				success: false,
				error: 'Missing required parameters: directory and filename',
			});
		}

		// Validate directory path (prevent directory traversal attacks)
		const safeDirectory = path.normalize(String(directory)).replace(/^(\.\.(\/|\\|$))+/, '');
		if (safeDirectory.includes('..')) {
			return res.status(400).json({
				success: false,
				error: 'Invalid directory path',
			});
		}

		const filePath = path.join(CREDENTIALS_DIR, safeDirectory, String(filename));

		if (!fs.existsSync(filePath)) {
			return res.status(404).json({
				success: false,
				error: 'File not found',
			});
		}

		fs.unlinkSync(filePath);

		console.log(`📁 [Server] Deleted credentials file: ${safeDirectory}/${filename}`);

		res.json({
			success: true,
		});
	} catch (error) {
		console.error(`❌ [Server] Failed to delete credentials:`, error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

// OAuth Token Exchange Endpoint
app.post('/api/token-exchange', async (req, res) => {
	console.log('🚀 [Server] Token exchange request received');
	console.log('📥 [Server] Request body:', {
		grant_type: req.body.grant_type,
		client_id: req.body.client_id,
		redirect_uri: req.body.redirect_uri,
		hasCode: !!req.body.code,
		hasCodeVerifier: !!req.body.code_verifier,
		hasClientSecret: !!req.body.client_secret,
		hasEnvironmentId: !!req.body.environment_id,
		code: `${req.body.code?.substring(0, 20)}...`,
		codeVerifier: `${req.body.code_verifier?.substring(0, 20)}...`,
		clientId: `${req.body.client_id?.substring(0, 8)}...`,
		fullBody: req.body,
	});

	try {
		const {
			grant_type,
			client_id,
			client_secret,
			redirect_uri,
			code,
			code_verifier,
			refresh_token,
			scope,
			environment_id,
			token_endpoint,
			subject_token,
			subject_token_type,
			requested_token_type,
			audience,
			resource,
		} = req.body;

		// Validate required parameters
		if (!grant_type || !client_id || client_id.trim() === '') {
			console.error('❌ [Server] Missing required parameters:', {
				hasGrantType: !!grant_type,
				hasClientId: !!client_id,
				grantType: grant_type,
				clientId: client_id,
				clientIdLength: client_id?.length || 0,
			});
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameters: grant_type and client_id',
			});
		}

		// Validate grant type specific parameters
		if (grant_type === 'refresh_token') {
			if (!refresh_token || refresh_token.trim() === '') {
				console.error('❌ [Server] Missing refresh_token for refresh_token grant');
				return res.status(400).json({
					error: 'invalid_request',
					error_description: 'Missing required parameter: refresh_token',
				});
			}
		} else if (grant_type === 'authorization_code') {
			if (!code || code.trim() === '') {
				console.error('❌ [Server] Missing authorization code for authorization_code grant');
				return res.status(400).json({
					error: 'invalid_request',
					error_description: 'Missing required parameter: code',
				});
			}
		} else if (grant_type === 'client_credentials') {
			// Client credentials grant only needs client_id and client_secret (handled by auth method)
			console.log('🔑 [Server] Validating client_credentials grant type');
		} else if (grant_type === 'urn:ietf:params:oauth:grant-type:token-exchange') {
			// RFC 8693 Token Exchange
			if (!subject_token || subject_token.trim() === '') {
				console.error('❌ [Server] Missing subject_token for token-exchange grant');
				return res.status(400).json({
					error: 'invalid_request',
					error_description: 'Missing required parameter: subject_token',
				});
			}
			if (!subject_token_type || subject_token_type.trim() === '') {
				console.error('❌ [Server] Missing subject_token_type for token-exchange grant');
				return res.status(400).json({
					error: 'invalid_request',
					error_description: 'Missing required parameter: subject_token_type',
				});
			}
		}

		// Get environment ID from request or environment (skip env fallback in test)
		const environmentId =
			req.body.environment_id ||
			(process.env.NODE_ENV !== 'test' ? process.env.PINGONE_ENVIRONMENT_ID : undefined);

		// Build token endpoint URL - use provided token_endpoint or construct from environment_id
		let tokenEndpoint;
		if (token_endpoint && token_endpoint.trim() !== '') {
			tokenEndpoint = token_endpoint;
			console.log('🔧 [Server] Using provided token endpoint:', tokenEndpoint);
		} else {
			if (!environmentId) {
				return res.status(400).json({
					error: 'invalid_request',
					error_description:
						'Missing environment_id (required when token_endpoint is not provided)',
				});
			}
			tokenEndpoint = `https://auth.pingone.com/${environmentId}/as/token`;
		}

		console.log('🔧 [Server] Token exchange configuration:', {
			environmentId,
			tokenEndpoint,
			grantType: grant_type,
			clientId: `${client_id?.substring(0, 8)}...`,
			hasClientSecret: !!client_secret,
			hasCode: !!code,
			hasCodeVerifier: !!code_verifier,
			redirectUri: redirect_uri,
			clientAuthMethod: req.body.client_auth_method || 'client_secret_post',
			scope: scope,
			allParams: req.body,
		});

		// Prepare request body based on grant type
		let tokenRequestBody;

		if (grant_type === 'refresh_token') {
			// Refresh token grant - only include refresh_token, client_id, and scope
			console.log('🔄 [Server] Building refresh token request body');
			tokenRequestBody = new URLSearchParams({
				grant_type: 'refresh_token',
				client_id: client_id,
				refresh_token: refresh_token,
				scope: scope || 'openid profile email',
			});
		} else if (grant_type === 'client_credentials') {
			// Client credentials grant - only include grant_type, client_id, and scope
			// NOTE: Worker tokens use p1:* scopes (Management API), NEVER openid (which is for OIDC user auth)
			console.log('🔑 [Server] Building client credentials request body');

			// If no scope provided, require it - don't default to invalid 'openid'
			if (!scope) {
				console.error(
					'❌ [Server] No scope provided for client_credentials grant - this will likely fail'
				);
				console.error(
					'❌ [Server] Worker tokens require p1:* scopes (e.g., p1:read:user, p1:read:environment)'
				);
			}

			const finalScope = scope || '';
			console.log('🔑 [Server] Using scope for client_credentials:', {
				providedScope: scope,
				finalScope,
				warning: !scope ? 'NO SCOPE PROVIDED' : null,
			});
			tokenRequestBody = new URLSearchParams({
				grant_type: 'client_credentials',
				client_id: client_id,
				...(finalScope ? { scope: finalScope } : {}), // Only include scope if provided
			});
		} else if (grant_type === 'urn:ietf:params:oauth:grant-type:token-exchange') {
			// RFC 8693 Token Exchange
			console.log('🔄 [Server] Building token exchange request body');
			const params = {
				grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
				client_id: client_id,
				subject_token: subject_token,
				subject_token_type: subject_token_type,
			};
			if (requested_token_type) params.requested_token_type = requested_token_type;
			if (audience) params.audience = audience;
			if (resource) params.resource = resource;
			if (scope) params.scope = scope;
			tokenRequestBody = new URLSearchParams(params);
		} else {
			// Authorization code grant - include code, redirect_uri, code_verifier (only if PKCE is used)
			console.log('🔐 [Server] Building authorization code request body');
			const params = {
				grant_type,
				client_id: client_id,
				redirect_uri: redirect_uri || '',
				code: code || '',
				scope: scope || 'openid profile email',
			};

			// Only include code_verifier if it has a valid value (PKCE is being used)
			if (code_verifier && code_verifier.trim() !== '') {
				params.code_verifier = code_verifier;
				console.log('🔐 [Server] Including PKCE code_verifier in request');
			} else {
				console.log('🔐 [Server] PKCE not used - omitting code_verifier parameter');
			}

			// Add x5t request parameter if includeX5tParameter is enabled
			if (req.body.includeX5tParameter === true || req.body.includeX5tParameter === 'true') {
				params.request_x5t = 'true';
				console.log('🔐 [Server] Including x5t request parameter for JWT headers');
			}

			tokenRequestBody = new URLSearchParams(params);
		}

		// Prepare headers
		const headers = {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json',
		};

		// Handle client authentication based on the specified method
		const client_auth_method = req.body.client_auth_method || 'client_secret_post';

		if (client_auth_method === 'client_secret_jwt' || client_auth_method === 'private_key_jwt') {
			// JWT-based authentication methods
			const { client_assertion_type, client_assertion } = req.body;

			if (client_assertion_type && client_assertion) {
				console.log(`🔐 [Server] Using JWT assertion for ${client_auth_method}:`, {
					clientId: `${client_id?.substring(0, 8)}...`,
					assertionType: client_assertion_type,
					assertionLength: client_assertion?.length || 0,
				});

				tokenRequestBody.append('client_assertion_type', client_assertion_type);
				tokenRequestBody.append('client_assertion', client_assertion);
				// Don't add client_secret for JWT methods
			} else {
				console.error(`❌ [Server] Missing JWT assertion for ${client_auth_method}`);
				return res.status(400).json({
					error: 'invalid_request',
					error_description: `client_assertion and client_assertion_type are required for ${client_auth_method} authentication`,
				});
			}
		} else if (client_secret && client_secret.trim() !== '') {
			if (client_auth_method === 'client_secret_basic') {
				// Use Basic Auth
				const credentials = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
				headers['Authorization'] = `Basic ${credentials}`;
				console.log('🔐 [Server] Using Basic Auth for confidential client:', {
					clientId: `${client_id?.substring(0, 8)}...`,
					clientSecretLength: client_secret?.length || 0,
					hasClientSecret: !!client_secret,
					basicAuthHeader: `Basic ${credentials.substring(0, 20)}...`,
					authMethod: client_auth_method,
				});
				// Don't add client_secret to body when using Basic Auth
			} else {
				// Use client_secret_post (default) - add client_secret to body
				tokenRequestBody.append('client_secret', client_secret);
				console.log('🔐 [Server] Using client_secret_post for confidential client:', {
					clientId: `${client_id?.substring(0, 8)}...`,
					clientSecretLength: client_secret?.length || 0,
					hasClientSecret: !!client_secret,
					authMethod: client_auth_method,
				});
			}
		} else {
			// For public clients, client_id is already in the body
			console.log('🔓 [Server] Using public client authentication:', {
				clientId: `${client_id?.substring(0, 8)}...`,
				hasClientSecret: !!client_secret,
				clientSecretLength: client_secret?.length || 0,
				authMethod: client_auth_method,
			});
		}

		console.log('🌐 [Server] Making request to PingOne token endpoint:', {
			url: tokenEndpoint,
			method: 'POST',
			headers: {
				'Content-Type': headers['Content-Type'],
				Accept: headers['Accept'],
				Authorization: headers['Authorization'] ? 'Basic [REDACTED]' : 'None',
			},
			body: tokenRequestBody.toString(),
		});

		// Make request to PingOne
		const startTime = Date.now();
		const tokenResponse = await fetch(tokenEndpoint, {
			method: 'POST',
			headers,
			body: tokenRequestBody.toString(),
		});
		const duration = Date.now() - startTime;

		// Clone response for logging
		const responseClone = tokenResponse.clone();
		let responseData;
		try {
			const responseText = await responseClone.text();
			try {
				responseData = JSON.parse(responseText);
			} catch {
				responseData = { raw: responseText };
			}
		} catch (e) {
			responseData = { error: 'Failed to parse response', status: tokenResponse.status, statusText: tokenResponse.statusText };
		}

		// Parse request body for logging (URLSearchParams to object)
		const requestBodyObj = {};
		tokenRequestBody.forEach((value, key) => {
			// Redact sensitive values
			if (key === 'client_secret') {
				requestBodyObj[key] = '[REDACTED]';
			} else {
				requestBodyObj[key] = value;
			}
		});

		// Comprehensive PingOne API call logging
		// Use more descriptive operation name for worker tokens
		const operationName = grant_type === 'client_credentials' 
			? `Worker Token Request (client_credentials)`
			: `Token Exchange (${grant_type})`;
		
		logPingOneApiCall(
			operationName,
			tokenEndpoint,
			'POST',
			headers,
			requestBodyObj,
			tokenResponse,
			responseData,
			duration,
			{
				grantType: grant_type,
				clientId: `${client_id?.substring(0, 8)}...`,
				clientAuthMethod: client_auth_method,
				environmentId: req.body.environment_id || 'N/A',
				isWorkerToken: grant_type === 'client_credentials',
				scope: scope || 'N/A',
			}
		);

		console.log('📥 [Server] PingOne token response:', {
			status: tokenResponse.status,
			statusText: tokenResponse.statusText,
			ok: tokenResponse.ok,
			headers: Object.fromEntries(tokenResponse.headers.entries()),
		});

		if (!tokenResponse.ok) {
			console.error('❌ [Server] PingOne token exchange error:', {
				status: tokenResponse.status,
				statusText: tokenResponse.statusText,
				responseData,
				requestBody: tokenRequestBody.toString(),
			});
			return res.status(tokenResponse.status).json(responseData);
		}

		console.log('✅ [Server] Token exchange successful:', {
			hasAccessToken: !!responseData.access_token,
			hasRefreshToken: !!responseData.refresh_token,
			hasIdToken: !!responseData.id_token,
			tokenType: responseData.token_type,
			expiresIn: responseData.expires_in,
			scope: responseData.scope,
			clientId: `${client_id?.substring(0, 8)}...`,
		});

		// Add server-side metadata
		responseData.server_timestamp = new Date().toISOString();
		responseData.grant_type = grant_type;

		console.log('📤 [Server] Sending response to client');
		res.json(responseData);
	} catch (error) {
		console.error('❌ [Server] Token exchange server error:', {
			message: error.message,
			stack: error.stack,
			error,
			requestBody: req.body,
		});
		res.status(500).json({
			error: 'server_error',
			error_description: error.message || 'Internal server error during token exchange',
			details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
		});
	}
});

// PingOne Active Identity Counts API (time-series with sampling periods)
app.get('/api/pingone/active-identity-counts', async (req, res) => {
	try {
		const {
			environmentId,
			region,
			startDate,
			samplingPeriod,
			limit,
			licenseId,
			clientId,
			clientSecret,
			workerToken,
		} = req.query;

		if (!environmentId) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'environmentId is required',
			});
		}

		let tokenToUse = workerToken;

		// If no worker token provided, generate one using client credentials
		if (!tokenToUse) {
			if (!clientId || !clientSecret) {
				return res.status(400).json({
					error: 'invalid_request',
					error_description: 'Missing client credentials and no worker token provided',
				});
			}

			console.log('[PingOne Active Identity Counts] Fetching worker token...');

			// Map region to auth domain
			const authDomainMap = {
				us: 'auth.pingone.com',
				na: 'auth.pingone.com',
				eu: 'auth.pingone.eu',
				ca: 'auth.pingone.ca',
				ap: 'auth.pingone.asia',
				asia: 'auth.pingone.asia',
			};
			const authDomain = authDomainMap[String(region).toLowerCase()] || 'auth.pingone.com';
			const tokenEndpoint = `https://${authDomain}/${environmentId}/as/token`;

			console.log('[PingOne Active Identity Counts] Using token endpoint:', tokenEndpoint);

			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 10000);

			const tokenResponse = await fetch(tokenEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					grant_type: 'client_credentials',
					client_id: clientId,
					client_secret: clientSecret,
					// Note: Metrics API uses roles, not scopes. Any valid token will work.
					scope: 'p1:read:users',
				}),
				signal: controller.signal,
			});

			clearTimeout(timeout);

			if (!tokenResponse.ok) {
				const errorText = await tokenResponse.text();
				console.error('[PingOne Active Identity Counts] Worker token request failed:', errorText);
				return res.status(tokenResponse.status).json({
					error: 'authentication_failed',
					error_description: 'Failed to obtain worker token',
					details: errorText,
				});
			}

			const tokenData = await tokenResponse.json();
			tokenToUse = tokenData.access_token;
			console.log('[PingOne Active Identity Counts] Worker token obtained successfully');
		} else {
			console.log('[PingOne Active Identity Counts] Using provided worker token');
		}

		const regionMap = {
			us: 'https://api.pingone.com',
			na: 'https://api.pingone.com',
			eu: 'https://api.pingone.eu',
			ca: 'https://api.pingone.ca',
			ap: 'https://api.pingone.asia',
			asia: 'https://api.pingone.asia',
		};

		const baseUrl = regionMap[String(region).toLowerCase()] || regionMap.na;
		const metricsUrl = new URL(`${baseUrl}/v1/environments/${environmentId}/activeIdentityCounts`);

		// Build filter for activeIdentityCounts (following PingOne API docs format)
		// Support two modes: byDateRange (with filter) or byLicense (with licenseId parameter)
		const filters = [];
		if (startDate) {
			// Ensure ISO 8601 format with Z suffix
			const formattedDate = startDate.includes('T') ? startDate : `${startDate}T00:00:00Z`;
			filters.push(`startDate ge "${formattedDate}"`);
		}
		if (samplingPeriod) {
			filters.push(`samplingPeriod eq "${samplingPeriod}"`);
		}

		if (filters.length > 0) {
			metricsUrl.searchParams.set('filter', filters.join(' and '));
		}

		// Add licenseId parameter if provided (for byLicense endpoint type)
		if (licenseId) {
			metricsUrl.searchParams.set('licenseId', licenseId);
		}

		// Add samplingPeriod as query param if not in filter (for byLicense endpoint)
		if (samplingPeriod && !startDate) {
			metricsUrl.searchParams.set('samplingPeriod', samplingPeriod);
		}

		// Add limit parameter (default to 100, max from query or 100)
		metricsUrl.searchParams.set('limit', limit || '100');

		console.log('[PingOne Active Identity Counts] Requesting metrics from:', metricsUrl.toString());
		console.log('[PingOne Active Identity Counts] Using region:', region, '| Base URL:', baseUrl);
		console.log(
			'[PingOne Active Identity Counts] Token preview:',
			tokenToUse ? `${tokenToUse.substring(0, 20)}...` : 'NONE'
		);

		const metricsController = new AbortController();
		const metricsTimeout = setTimeout(() => metricsController.abort(), 10000);

		const metricsResponse = await fetch(metricsUrl, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${tokenToUse}`,
				Accept: 'application/json',
			},
			signal: metricsController.signal,
		});

		clearTimeout(metricsTimeout);

		if (!metricsResponse.ok) {
			const errorText = await metricsResponse.text();
			console.error(
				'[PingOne Active Identity Counts] ❌ Metrics request failed:',
				metricsResponse.status,
				metricsResponse.statusText
			);
			console.error('[PingOne Active Identity Counts] ❌ URL:', metricsUrl.toString());
			console.error('[PingOne Active Identity Counts] ❌ Region:', region);
			console.error('[PingOne Active Identity Counts] ❌ Error details:', errorText);
			return res.status(metricsResponse.status).json({
				error: 'api_request_failed',
				error_description: `Failed to retrieve active identity counts: ${metricsResponse.status} ${metricsResponse.statusText}`,
				details: errorText,
			});
		}

		const metricsData = await metricsResponse.json();
		console.log('[PingOne Active Identity Counts] Metrics retrieved successfully');
		res.json(metricsData);
	} catch (error) {
		if (error.name === 'AbortError') {
			console.error('[PingOne Active Identity Counts] Request timed out');
			return res.status(504).json({
				error: 'timeout',
				error_description: 'PingOne active identity counts request timed out',
			});
		}

		console.error('[PingOne Active Identity Counts] Unexpected server error:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error while retrieving active identity counts',
			details: error.message,
		});
	}
});

// Redirectless authorize proxy to avoid frontend CORS issues

// Client Credentials Flow Endpoint
app.post('/api/client-credentials', async (req, res) => {
	try {
		console.log(`[Client Credentials] Received request:`, {
			hasEnvironmentId: !!req.body.environment_id,
			authMethod: req.body.auth_method,
			hasCustomHeaders: !!req.body.headers,
			hasRequestBody: !!req.body.body,
			requestBodyKeys: req.body.body ? Object.keys(req.body.body) : 'none',
		});

		const { environment_id, auth_method, headers: customHeaders, body: requestBody } = req.body;

		if (!environment_id) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameter: environment_id',
			});
		}

		const tokenEndpoint = `https://auth.pingone.com/${environment_id}/as/token`;

		// Prepare headers for the request to PingOne
		const headers = {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json',
			...customHeaders, // Include any custom headers from client authentication
		};

		// Prepare body for the request to PingOne
		const body = new URLSearchParams(requestBody);

		console.log(`[Client Credentials] Using auth method: ${auth_method || 'client_secret_post'}`);
		console.log(`[Client Credentials] Token endpoint URL:`, tokenEndpoint);
		console.log(`[Client Credentials] Request headers:`, headers);
		console.log(`[Client Credentials] Request body keys:`, Array.from(body.keys()));
		console.log(`[Client Credentials] Request body values:`, Object.fromEntries(body.entries()));
		console.log(`[Client Credentials] Full request URL:`, `${tokenEndpoint}`);
		console.log(`[Client Credentials] Request method: POST`);

		const response = await global.fetch(tokenEndpoint, {
			method: 'POST',
			headers: headers,
			body: body,
		});

		const data = await response.json();

		if (!response.ok) {
			console.error(`[Client Credentials] PingOne error (${response.status}):`, {
				status: response.status,
				statusText: response.statusText,
				errorData: data,
				requestHeaders: headers,
				requestBody: Object.fromEntries(body.entries()),
				tokenEndpoint,
			});
			return res.status(response.status).json(data);
		}

		console.log(
			`[Client Credentials] Success for client: ${requestBody.clientId || requestBody.client_id || 'unknown'}`
		);

		data.server_timestamp = new Date().toISOString();
		data.grant_type = 'client_credentials';

		res.json(data);
	} catch (error) {
		console.error('[Client Credentials] Server error:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error during client credentials flow',
		});
	}
});

// Token Introspection Endpoint (proxy to PingOne)
app.post('/api/introspect-token', async (req, res) => {
	try {
		const {
			token,
			client_id,
			client_secret,
			introspection_endpoint,
			token_auth_method,
			client_assertion_type,
			token_type_hint,
		} = req.body;

		console.log(`[Introspect Token] Received request:`, {
			hasToken: !!token,
			hasClientId: !!client_id,
			hasClientSecret: !!client_secret,
			hasIntrospectionEndpoint: !!introspection_endpoint,
			tokenAuthMethod: token_auth_method,
			clientAssertionType: client_assertion_type,
			tokenTypeHint: token_type_hint,
			tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
		});

		if (!token || !client_id || !introspection_endpoint) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameters: token, client_id, introspection_endpoint',
			});
		}

		const authMethod = token_auth_method || 'client_secret_basic';
		console.log(`[Introspect Token] Using authentication method: ${authMethod}`);

		// Prepare request body for token introspection based on auth method
		const introspectionBody = new URLSearchParams({
			token: token,
			client_id: client_id,
		});

		// Add token_type_hint if provided
		if (token_type_hint) {
			introspectionBody.append('token_type_hint', token_type_hint);
		}

		// Add authentication based on method
		if (authMethod === 'none') {
			// Public client - no authentication required
			console.log(`[Introspect Token] Using public client (no authentication)`);
			// Only client_id and token are sent
		} else if (authMethod === 'client_secret_basic' || authMethod === 'client_secret_post') {
			if (!client_secret) {
				return res.status(400).json({
					error: 'invalid_request',
					error_description:
						'Client secret required for client_secret_basic/client_secret_post authentication',
				});
			}
			introspectionBody.append('client_secret', client_secret);
		} else if (authMethod === 'client_secret_jwt' || authMethod === 'private_key_jwt') {
			const { client_assertion_type: assertionType, client_assertion } = req.body;

			if (assertionType && client_assertion) {
				console.log(`[Introspect Token] Using JWT assertion for ${authMethod}:`, {
					assertionType,
					assertionLength: client_assertion.length,
				});
				introspectionBody.append('client_assertion_type', assertionType);
				introspectionBody.append('client_assertion', client_assertion);
				// Don't add client_secret for JWT methods
			} else {
				console.error(`[Introspect Token] Missing JWT assertion for ${authMethod}`);
				return res.status(400).json({
					error: 'invalid_request',
					error_description: `client_assertion and client_assertion_type are required for ${authMethod} authentication`,
				});
			}
		}

		// Prepare headers
		const headers = {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json',
		};

		// For client_secret_basic, use Basic Auth in headers
		if (authMethod === 'client_secret_basic' && client_secret) {
			const basicAuth = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
			headers['Authorization'] = `Basic ${basicAuth}`;
			// Remove client_secret from body for basic auth
			introspectionBody.delete('client_secret');
		}

		console.log(`[Introspect Token] Request body keys:`, Array.from(introspectionBody.keys()));
		console.log(`[Introspect Token] Request headers:`, headers);

		const response = await global.fetch(introspection_endpoint, {
			method: 'POST',
			headers: headers,
			body: introspectionBody,
		});

		const data = await response.json();

		if (!response.ok) {
			console.error(`[Introspect Token] PingOne error (${response.status}):`, {
				status: response.status,
				statusText: response.statusText,
				errorData: data,
				introspectionEndpoint: introspection_endpoint,
			});
			return res.status(response.status).json(data);
		}

		console.log(`[Introspect Token] Success for client: ${client_id}`);

		// Add server timestamp
		data.server_timestamp = new Date().toISOString();

		res.json(data);
	} catch (error) {
		console.error('[Introspect Token] Server error:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error during token introspection',
		});
	}
});

// PingOne User Profile Endpoint
app.get('/api/pingone/user/:userId', async (req, res) => {
	try {
		const { userId } = req.params;
		const { environmentId, accessToken } = req.query;

		if (!environmentId || !accessToken) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameters: environmentId, accessToken',
			});
		}

		const userEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}`;

		const response = await global.fetch(userEndpoint, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: 'application/json',
			},
		});

		const data = await response.json();

		if (!response.ok) {
			console.error(`[PingOne User] API error (${response.status}):`, data);
			return res.status(response.status).json(data);
		}

		console.log(`[PingOne User] Successfully fetched user profile for: ${userId}`);
		console.log(`[PingOne User] Profile structure:`, {
			hasAuthoritativeIdentityProfile: !!data.authoritativeIdentityProfile,
			hasIdentityProvider: !!data.identityProvider,
			authoritativeIdentityProfileKeys: data.authoritativeIdentityProfile
				? Object.keys(data.authoritativeIdentityProfile)
				: [],
			identityProviderKeys: data.identityProvider ? Object.keys(data.identityProvider) : [],
			hasMfaEnabled: 'mfaEnabled' in data,
			mfaEnabled: data.mfaEnabled,
			hasMfaStatus: 'mfaStatus' in data,
			mfaStatus: data.mfaStatus,
			allKeys: Object.keys(data).filter(
				(k) =>
					k.toLowerCase().includes('mfa') ||
					k.toLowerCase().includes('auth') ||
					k.toLowerCase().includes('identity')
			),
		});
		res.json(data);
	} catch (error) {
		console.error('[PingOne User] Server error:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error during user profile fetch',
			details: error.message,
		});
	}
});

app.post('/api/pingone/users/lookup', async (req, res) => {
	try {
		const { environmentId, accessToken, identifier } = req.body || {};

		console.log('[PingOne User Lookup] Request received:', {
			hasEnvironmentId: !!environmentId,
			hasAccessToken: !!accessToken,
			hasIdentifier: !!identifier,
			environmentIdType: typeof environmentId,
			accessTokenType: typeof accessToken,
			identifierType: typeof identifier,
			environmentIdValue: environmentId
				? typeof environmentId === 'string'
					? environmentId.substring(0, 20)
					: String(environmentId).substring(0, 20)
				: 'undefined',
			accessTokenValue: accessToken
				? typeof accessToken === 'string'
					? `${accessToken.substring(0, 20)}...`
					: `${String(accessToken).substring(0, 20)}...`
				: 'undefined',
			identifierValue: identifier
				? typeof identifier === 'string'
					? identifier.substring(0, 20)
					: String(identifier).substring(0, 20)
				: 'undefined',
		});

		// Validate and trim all required fields
		const trimmedEnvironmentId = environmentId ? String(environmentId).trim() : '';
		const trimmedAccessToken = accessToken ? String(accessToken).trim() : '';
		const trimmedIdentifier = identifier ? String(identifier).trim() : '';

		if (!trimmedEnvironmentId || !trimmedAccessToken || !trimmedIdentifier) {
			const missing = [];
			if (!trimmedEnvironmentId) missing.push('environmentId');
			if (!trimmedAccessToken) missing.push('accessToken');
			if (!trimmedIdentifier) missing.push('identifier');
			console.error('[PingOne User Lookup] Missing or empty required parameters:', missing);
			console.error('[PingOne User Lookup] Request body details:', {
				rawEnvironmentId: environmentId,
				rawAccessToken: accessToken ? `${accessToken.substring(0, 20)}...` : 'undefined',
				rawIdentifier: identifier,
				trimmedEnvironmentId: trimmedEnvironmentId || '(empty)',
				trimmedAccessToken: trimmedAccessToken
					? `${trimmedAccessToken.substring(0, 20)}...`
					: '(empty)',
				trimmedIdentifier: trimmedIdentifier || '(empty)',
			});
			return res.status(400).json({
				error: 'invalid_request',
				error_description: `Missing or empty required parameters: ${missing.join(', ')}`,
				details: {
					hasEnvironmentId: !!trimmedEnvironmentId,
					hasAccessToken: !!trimmedAccessToken,
					hasIdentifier: !!trimmedIdentifier,
					missing: missing,
				},
			});
		}

		// Use Management API for direct ID lookups
		const apiBaseUrl = `https://api.pingone.com/v1/environments/${trimmedEnvironmentId}/users`;

		const headers = {
			Authorization: `Bearer ${trimmedAccessToken}`,
			Accept: 'application/json',
		};

		// Escape identifier for SCIM filter (escape quotes and backslashes)
		const escapeIdentifier = (value) => {
			return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
		};
		const escapedIdentifier = escapeIdentifier(trimmedIdentifier);

		// Check if identifier looks like a UUID (for direct ID lookup)
		// UUID format: 8-4-4-4-12 hex characters (e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890")
		const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		const looksLikeUuid = uuidPattern.test(trimmedIdentifier);

		// 1. Direct lookup by ID (only if identifier looks like a UUID)
		if (looksLikeUuid) {
			try {
				console.log('[PingOne User Lookup] Attempting direct ID lookup (UUID format detected)');
				const directUrl = `${apiBaseUrl}/${encodeURIComponent(trimmedIdentifier)}`;
				const startTime = Date.now();
				const directResponse = await global.fetch(directUrl, {
					headers,
				});
				const duration = Date.now() - startTime;
				
				// Clone response for logging
				const responseClone = directResponse.clone();
				let responseData = null;
				if (directResponse.ok) {
					try {
						responseData = await responseClone.json();
					} catch {
						responseData = { error: 'Failed to parse response' };
					}
				} else {
					try {
						responseData = await responseClone.json();
					} catch {
						responseData = { error: 'Unknown error' };
					}
				}
				
				// Log the actual PingOne API call
				logPingOneApiCall(
					'Lookup User by ID',
					directUrl,
					'GET',
					headers,
					null, // No request body for GET
					directResponse,
					responseData,
					duration,
					{
						operation: 'lookup-user-by-id',
						environmentId: trimmedEnvironmentId,
						identifier: trimmedIdentifier,
						matchType: 'id',
					}
				);
				
				if (directResponse.ok) {
					const user = responseData;
					console.log('[PingOne User Lookup] ✅ Direct ID match found');
					return res.json({ user, matchType: 'id' });
				}
				if (directResponse.status !== 404) {
					return res.status(directResponse.status).json(responseData);
				}
				console.log(
					'[PingOne User Lookup] Direct ID lookup returned 404, proceeding to SCIM filter search'
				);
			} catch (error) {
				console.warn('[PingOne User Lookup] Direct lookup failed:', error);
			}
		} else {
			console.log(
				'[PingOne User Lookup] Identifier does not look like a UUID, skipping direct lookup and using SCIM filter search'
			);
		}

		// 2. Management API filter-based searches for username and email
		// PingOne Management API uses SCIM filter syntax
		// Reference: https://apidocs.pingidentity.com/pingone/platform/v1/api/#get-users
		const filters = [];

		// Determine if identifier looks like an email
		const isEmail = typeof trimmedIdentifier === 'string' && trimmedIdentifier.includes('@');

		if (isEmail) {
			// Email filters - SCIM syntax per PingOne API docs
			// Try primary email first (most common)
			filters.push({
				filter: `emails[primary eq true].value eq "${escapedIdentifier}"`,
				matchType: 'email',
			});
			// Try any email value
			filters.push({
				filter: `emails.value eq "${escapedIdentifier}"`,
				matchType: 'email',
			});
			// Try direct email attribute (if supported)
			filters.push({
				filter: `email eq "${escapedIdentifier}"`,
				matchType: 'email',
			});
		}

		// Username filters - try both lowercase and camelCase (PingOne may support either)
		// Try lowercase first (was working before)
		filters.push({
			filter: `username eq "${escapedIdentifier}"`,
			matchType: 'username',
		});
		// Try camelCase as fallback (per some PingOne API docs)
		filters.push({
			filter: `userName eq "${escapedIdentifier}"`,
			matchType: 'username',
		});

		console.log(
			`[PingOne User Lookup] 🔍 Attempting Management API SCIM filter searches for: ${trimmedIdentifier}`
		);
		console.log(`[PingOne User Lookup] Will try ${filters.length} SCIM filter variations`);

		for (const { filter, matchType } of filters) {
			try {
				// Use Management API endpoint with SCIM filter parameter
				// Per PingOne API docs: GET /v1/environments/{envId}/users?filter=username eq "value"
				// Reference: https://apidocs.pingidentity.com/pingone/platform/v1/api/#get-users
				// Note: PingOne Management API supports GET with filter query parameter for SCIM-style filtering
				const encodedFilter = encodeURIComponent(filter);
				const queryUrl = `${apiBaseUrl}?filter=${encodedFilter}&limit=10`;
				console.log(`[PingOne User Lookup] 🔍 SCIM Filter (${matchType}): ${filter}`);
				console.log(`[PingOne User Lookup] 📤 SCIM Filter URL-encoded: ${encodedFilter}`);
				console.log(`[PingOne User Lookup] 🌐 Full SCIM Query URL: ${queryUrl}`);

				const startTime = Date.now();
				const searchResponse = await global.fetch(queryUrl, { headers });
				const duration = Date.now() - startTime;
				
				const payloadText = await searchResponse.text();
				let searchData = {};

				try {
					searchData = payloadText ? JSON.parse(payloadText) : {};
				} catch (parseError) {
					console.error(
						`[PingOne User Lookup] Failed to parse response for filter ${filter}:`,
						payloadText.substring(0, 200)
					);
					// Log even if parsing fails
					logPingOneApiCall(
						'Lookup User by Username/Email',
						queryUrl,
						'GET',
						headers,
						null, // No request body for GET
						searchResponse,
						{ error: 'Failed to parse response', rawText: payloadText.substring(0, 200) },
						duration,
						{
							operation: 'lookup-user-by-username-email',
							environmentId: trimmedEnvironmentId,
							identifier: trimmedIdentifier,
							matchType,
							filter,
						}
					);
					continue;
				}
				
				// Log the actual PingOne API call
				logPingOneApiCall(
					'Lookup User by Username/Email',
					queryUrl,
					'GET',
					headers,
					null, // No request body for GET
					searchResponse,
					searchData,
					duration,
					{
						operation: 'lookup-user-by-username-email',
						environmentId: trimmedEnvironmentId,
						identifier: trimmedIdentifier,
						matchType,
						filter,
						userCount: searchData?._embedded?.users?.length || searchData?.Resources?.length || 0,
					}
				);

				if (searchResponse.ok) {
					// Management API returns users in _embedded.users
					let users = [];

					if (searchData?._embedded?.users && Array.isArray(searchData._embedded.users)) {
						users = searchData._embedded.users;
					} else if (searchData?.Resources && Array.isArray(searchData.Resources)) {
						// SCIM format (fallback)
						users = searchData.Resources;
					} else if (Array.isArray(searchData)) {
						// Direct array response
						users = searchData;
					} else if (searchData?.items && Array.isArray(searchData.items)) {
						// Alternative response format
						users = searchData.items;
					}

					if (users.length > 0) {
						const foundUser = users[0];
						console.log(`[PingOne User Lookup] ✅ Match found via ${matchType}:`, {
							id: foundUser.id,
							username: foundUser.username || foundUser.userName,
							email: foundUser.email || foundUser.emails?.[0]?.value,
						});
						return res.json({ user: foundUser, matchType });
					}
					console.log(`[PingOne User Lookup] Filter returned no results: ${filter}`);
				} else if (searchResponse.status === 400) {
					const errorMsg =
						searchData?.detail ||
						searchData?.message ||
						searchData?.error_description ||
						searchData?.error ||
						'Invalid filter syntax';
					console.warn(`[PingOne User Lookup] Filter ${filter} returned 400:`, errorMsg);
				} else if (searchResponse.status === 404) {
					console.log(`[PingOne User Lookup] Filter returned 404: ${filter}`);
				} else {
					console.error(
						`[PingOne User Lookup] Filter returned ${searchResponse.status}:`,
						searchData
					);
				}
			} catch (error) {
				console.warn(`[PingOne User Lookup] Filter lookup failed for ${filter}:`, error.message);
			}
		}

		console.log(`[PingOne User Lookup] No user found for identifier: ${trimmedIdentifier}`);

		// Return a more helpful error message
		return res.status(404).json({
			error: 'not_found',
			error_description: `No user found matching identifier: ${trimmedIdentifier}. Please verify the user ID, username, or email address is correct.`,
			identifier: trimmedIdentifier,
			triedFilters: filters.map((f) => f.filter),
			note: 'Used Management API SCIM filter syntax (tried username/userName eq "value" and email filters)',
		});
	} catch (error) {
		console.error('[PingOne User Lookup] Server error:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error during user lookup',
			details: error.message,
		});
	}
});

// PingOne Population Endpoint
app.get('/api/pingone/population/:populationId', async (req, res) => {
	try {
		const { populationId } = req.params;
		const { environmentId, accessToken } = req.query;

		if (!environmentId || !accessToken) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameters: environmentId, accessToken',
			});
		}

		const populationEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/populations/${populationId}`;

		const response = await global.fetch(populationEndpoint, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: 'application/json',
			},
		});

		const data = await response.json();

		if (!response.ok) {
			console.error(`[PingOne Population] API error (${response.status}):`, data);
			return res.status(response.status).json(data);
		}

		console.log(`[PingOne Population] Successfully fetched population: ${populationId}`);
		res.json(data);
	} catch (error) {
		console.error('[PingOne Population] Server error:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error during population fetch',
			details: error.message,
		});
	}
});

// PingOne User Groups Endpoint
app.get('/api/pingone/user/:userId/groups', async (req, res) => {
	try {
		const { userId } = req.params;
		const { environmentId, accessToken } = req.query;

		if (!environmentId || !accessToken) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameters: environmentId, accessToken',
			});
		}

		const groupsEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/memberOfGroups`;

		const response = await global.fetch(groupsEndpoint, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: 'application/json',
			},
		});

		const data = await response.json();

		if (!response.ok) {
			console.error(`[PingOne User Groups] API error (${response.status}):`, data);
			return res.status(response.status).json(data);
		}

		// Expand memberOfGroups or groupMemberships to extract group details
		const expandedData = { ...data };
		let groups = [];

		// Check for both memberOfGroups and groupMemberships (PingOne uses both)
		const groupMembershipData = data._embedded?.memberOfGroups || data._embedded?.groupMemberships;

		if (groupMembershipData && Array.isArray(groupMembershipData)) {
			// Extract group objects from memberOfGroups/groupMemberships
			groups = groupMembershipData
				.map((item) => {
					// Check if item has a nested group object (most common case)
					if (item.group && typeof item.group === 'object' && item.group !== null) {
						return item.group;
					}
					// Check if item itself is the group (has name/id/displayName)
					if (item.id && (item.name || item.displayName || item.description)) {
						return item;
					}
					// Check if item has _links.group.href for expansion
					if (item._links && item._links.group && item._links.group.href) {
						// Extract group ID from href or mark for fetching via href
						const href = item._links.group.href;
						const groupIdMatch = href.match(/\/groups\/([^/?]+)/);
						if (groupIdMatch) {
							return { id: groupIdMatch[1], _needsFetch: true, _href: href };
						}
					}
					// If we only have a group ID reference (string), mark for fetching
					if (item.group && typeof item.group === 'string') {
						return { id: item.group, _needsFetch: true };
					}
					// Check for group ID in the item itself but no name
					if (item.id && typeof item.id === 'string' && !item.name && !item.displayName) {
						return { ...item, _needsFetch: true };
					}
					// Return item as-is if it has any structure
					return item;
				})
				.filter(Boolean);

			// Fetch group details for any groups that only have IDs
			const groupsNeedingFetch = groups.filter((g) => g._needsFetch);
			if (groupsNeedingFetch.length > 0) {
				console.log(
					`[PingOne User Groups] Fetching details for ${groupsNeedingFetch.length} groups with only IDs`
				);
				const fetchedGroups = await Promise.all(
					groupsNeedingFetch.map(async (group) => {
						try {
							const groupResponse = await global.fetch(
								`https://api.pingone.com/v1/environments/${environmentId}/groups/${group.id}`,
								{
									method: 'GET',
									headers: {
										Authorization: `Bearer ${accessToken}`,
										Accept: 'application/json',
									},
								}
							);
							if (groupResponse.ok) {
								return await groupResponse.json();
							}
						} catch (err) {
							console.warn(`[PingOne User Groups] Failed to fetch group ${group.id}:`, err);
						}
						return group; // Return original if fetch fails
					})
				);
				// Replace groups that needed fetching with fetched ones
				groups = groups.map((g) => {
					if (g._needsFetch) {
						const fetched = fetchedGroups.find((fg) => fg.id === g.id);
						return fetched || g;
					}
					return g;
				});
			}

			expandedData._embedded = {
				...data._embedded,
				groups: groups,
				memberOfGroups: groupMembershipData, // Keep original for reference
			};
		} else if (data._embedded?.groups && Array.isArray(data._embedded.groups)) {
			groups = data._embedded.groups;
			// Ensure expandedData._embedded exists and has groups
			if (!expandedData._embedded) {
				expandedData._embedded = {};
			}
			expandedData._embedded.groups = groups;
		} else if (data._embedded?.items && Array.isArray(data._embedded.items)) {
			groups = data._embedded.items;
			// Ensure expandedData._embedded exists and has groups
			if (!expandedData._embedded) {
				expandedData._embedded = {};
			}
			expandedData._embedded.groups = groups;
		}

		// Ensure groups are always in the response, even if we found them in memberOfGroups
		// This handles edge cases where groups might be empty or _embedded might not exist
		if (!expandedData._embedded) {
			expandedData._embedded = {};
		}
		// Always set groups array in the response (even if empty)
		expandedData._embedded.groups = groups;

		console.log(`[PingOne User Groups] Successfully fetched groups for user: ${userId}`);
		console.log(
			`[PingOne User Groups] Raw API response:`,
			JSON.stringify(data, null, 2).substring(0, 2000)
		); // First 2000 chars
		console.log(`[PingOne User Groups] Response structure:`, {
			hasEmbedded: !!data._embedded,
			embeddedKeys: data._embedded ? Object.keys(data._embedded) : [],
			rootKeys: Object.keys(data),
			groupsCount: groups.length,
			memberOfGroupsCount: data._embedded?.memberOfGroups?.length || 0,
			groupMembershipsCount: data._embedded?.groupMemberships?.length || 0,
			usedGroupMembershipData: groupMembershipData ? 'found' : 'not found',
			sampleGroup: groups[0] || null,
			sampleMemberOfGroup: groupMembershipData?.[0] || null,
			sampleGroupKeys: groups[0] ? Object.keys(groups[0]) : [],
			sampleGroupName: groups[0]?.name || groups[0]?.displayName || groups[0]?.id,
			fullMemberOfGroupSample: groupMembershipData?.[0]
				? JSON.stringify(groupMembershipData[0], null, 2)
				: null,
			expandedDataHasGroups: !!expandedData._embedded?.groups,
			expandedDataGroupsCount: expandedData._embedded?.groups?.length || 0,
		});
		res.json(expandedData);
	} catch (error) {
		console.error('[PingOne User Groups] Server error:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error during user groups fetch',
			details: error.message,
		});
	}
});

// PingOne User Roles Endpoint
app.get('/api/pingone/user/:userId/roles', async (req, res) => {
	try {
		const { userId } = req.params;
		const { environmentId, accessToken } = req.query;

		if (!environmentId || !accessToken) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameters: environmentId, accessToken',
			});
		}

		const rolesEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/roleAssignments`;

		const response = await global.fetch(rolesEndpoint, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: 'application/json',
			},
		});

		const data = await response.json();

		if (!response.ok) {
			console.error(`[PingOne User Roles] API error (${response.status}):`, data);
			return res.status(response.status).json(data);
		}

		// Expand roleAssignments to extract role details
		const expandedData = { ...data };
		let roles = [];

		if (data._embedded?.roleAssignments && Array.isArray(data._embedded.roleAssignments)) {
			// Extract role objects from roleAssignments
			roles = data._embedded.roleAssignments
				.map((assignment) => {
					// Check if assignment has a nested role object (most common case)
					if (assignment.role && typeof assignment.role === 'object' && assignment.role !== null) {
						return assignment.role;
					}
					// Check if assignment itself is the role (has name/id/displayName)
					if (
						assignment.id &&
						(assignment.name || assignment.displayName || assignment.description)
					) {
						return assignment;
					}
					// Check if assignment has _links.role.href for expansion
					if (assignment._links && assignment._links.role && assignment._links.role.href) {
						const href = assignment._links.role.href;
						const roleIdMatch = href.match(/\/roles\/([^/?]+)/);
						if (roleIdMatch) {
							return { id: roleIdMatch[1], _needsFetch: true, _href: href };
						}
					}
					// If we only have a role ID reference (string), mark for fetching
					if (assignment.role && typeof assignment.role === 'string') {
						return { id: assignment.role, _needsFetch: true };
					}
					// Check for role ID in the assignment itself but no name
					if (
						assignment.id &&
						typeof assignment.id === 'string' &&
						!assignment.name &&
						!assignment.displayName
					) {
						return { ...assignment, _needsFetch: true };
					}
					return assignment;
				})
				.filter(Boolean);

			// Fetch role details for any roles that only have IDs
			const rolesNeedingFetch = roles.filter((r) => r._needsFetch);
			if (rolesNeedingFetch.length > 0) {
				console.log(
					`[PingOne User Roles] Fetching details for ${rolesNeedingFetch.length} roles with only IDs`
				);
				const fetchedRoles = await Promise.all(
					rolesNeedingFetch.map(async (role) => {
						try {
							const roleResponse = await global.fetch(
								`https://api.pingone.com/v1/environments/${environmentId}/roles/${role.id}`,
								{
									method: 'GET',
									headers: {
										Authorization: `Bearer ${accessToken}`,
										Accept: 'application/json',
									},
								}
							);
							if (roleResponse.ok) {
								return await roleResponse.json();
							}
						} catch (err) {
							console.warn(`[PingOne User Roles] Failed to fetch role ${role.id}:`, err);
						}
						return role; // Return original if fetch fails
					})
				);
				// Replace roles that needed fetching with fetched ones
				roles = roles.map((r) => {
					if (r._needsFetch) {
						const fetched = fetchedRoles.find((fr) => fr.id === r.id);
						return fetched || r;
					}
					return r;
				});
			}

			expandedData._embedded = {
				...data._embedded,
				roles: roles,
				roleAssignments: data._embedded.roleAssignments, // Keep original for reference
			};
		} else if (data._embedded?.roles && Array.isArray(data._embedded.roles)) {
			roles = data._embedded.roles;
		} else if (data._embedded?.items && Array.isArray(data._embedded.items)) {
			roles = data._embedded.items;
		}

		console.log(`[PingOne User Roles] Successfully fetched roles for user: ${userId}`);
		console.log(
			`[PingOne User Roles] Raw API response:`,
			JSON.stringify(data, null, 2).substring(0, 2000)
		); // First 2000 chars
		console.log(`[PingOne User Roles] Response structure:`, {
			hasEmbedded: !!data._embedded,
			embeddedKeys: data._embedded ? Object.keys(data._embedded) : [],
			rootKeys: Object.keys(data),
			rolesCount: roles.length,
			roleAssignmentsCount: data._embedded?.roleAssignments?.length || 0,
			sampleRoleAssignment: data._embedded?.roleAssignments?.[0] || null,
			sampleRole: roles[0] || null,
			sampleRoleKeys: roles[0] ? Object.keys(roles[0]) : [],
			sampleRoleName: roles[0]?.name || roles[0]?.displayName || roles[0]?.id,
			fullRoleAssignmentSample: data._embedded?.roleAssignments?.[0]
				? JSON.stringify(data._embedded.roleAssignments[0], null, 2)
				: null,
			allRoleNames: roles
				.slice(0, 5)
				.map((r) => ({ id: r.id, name: r.name, displayName: r.displayName, keys: Object.keys(r) })),
		});
		res.json(expandedData);
	} catch (error) {
		console.error('[PingOne User Roles] Server error:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error during user roles fetch',
			details: error.message,
		});
	}
});

// PingOne User Consents Endpoint
app.get('/api/pingone/user/:userId/consents', async (req, res) => {
	try {
		const { userId } = req.params;
		const { environmentId, accessToken } = req.query;

		if (!environmentId || !accessToken) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameters: environmentId, accessToken',
			});
		}

		const consentsEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/consents?limit=200`;

		const response = await global.fetch(consentsEndpoint, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: 'application/json',
			},
		});

		const data = await response.json();

		if (!response.ok) {
			// If worker token doesn't have permission to access consents (403), return empty array gracefully
			if (response.status === 403) {
				console.log(
					`[PingOne User Consents] Worker token lacks consent permissions (403). Returning empty consents.`
				);
				return res.json({ _embedded: { consents: [] } });
			}
			console.error(`[PingOne User Consents] API error (${response.status}):`, data);
			return res.status(response.status).json(data);
		}

		console.log(`[PingOne User Consents] Successfully fetched consents for user: ${userId}`);
		res.json(data);
	} catch (error) {
		console.error('[PingOne User Consents] Server error:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error during user consents fetch',
			details: error.message,
		});
	}
});

// PingOne User MFA Status Endpoint
// Uses correct PingOne MFA API: /mfaEnabled and /devices
app.get('/api/pingone/user/:userId/mfa', async (req, res) => {
	try {
		const { userId } = req.params;
		const { environmentId, accessToken } = req.query;

		if (!environmentId || !accessToken) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameters: environmentId, accessToken',
			});
		}

		// Step 1: Check if MFA is enabled for the user (correct endpoint per PingOne API docs)
		const mfaEnabledEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/mfaEnabled`;

		const mfaEnabledResponse = await global.fetch(mfaEnabledEndpoint, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: 'application/json',
			},
		});

		let mfaEnabled = false;
		let mfaEnabledData = null;

		if (mfaEnabledResponse.ok) {
			mfaEnabledData = await mfaEnabledResponse.json();
			mfaEnabled = mfaEnabledData.mfaEnabled === true;
			console.log(`[PingOne User MFA] MFA enabled status: ${mfaEnabled}`, mfaEnabledData);
		} else {
			console.warn(
				`[PingOne User MFA] Could not fetch mfaEnabled status (${mfaEnabledResponse.status})`
			);
		}

		// Step 2: Get all MFA devices for the user (correct endpoint per PingOne API docs)
		const devicesEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices`;

		const devicesResponse = await global.fetch(devicesEndpoint, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: 'application/json',
			},
		});

		let devices = [];
		let devicesData = null;

		if (devicesResponse.ok) {
			devicesData = await devicesResponse.json();
			devices = devicesData._embedded?.devices || devicesData.devices || [];
			console.log(
				`[PingOne User MFA] Found ${devices.length} devices:`,
				devices.map((d) => ({
					id: d.id,
					type: d.type,
					status: d.status,
					enabled: d.enabled,
					name: d.name,
				}))
			);
		} else {
			console.warn(`[PingOne User MFA] Could not fetch devices (${devicesResponse.status})`);
			if (devicesResponse.status !== 404) {
				const errorData = await devicesResponse.json().catch(() => ({}));
				console.error(`[PingOne User MFA] Devices API error:`, errorData);
			}
		}

		// Determine final MFA status
		// MFA is enabled if: mfaEnabled is true OR if there are active devices
		const hasActiveDevices = devices.some((device) => {
			const status = typeof device.status === 'string' ? device.status.toUpperCase() : '';
			return status === 'ACTIVE' || device.enabled === true;
		});

		const finalEnabled = mfaEnabled || hasActiveDevices;
		const status = mfaEnabled ? 'ENABLED' : hasActiveDevices ? 'ACTIVE_DEVICES' : 'DISABLED';

		console.log(
			`[PingOne User MFA] Final status for user ${userId}: enabled=${finalEnabled}, status=${status}, deviceCount=${devices.length}`
		);

		res.json({
			enabled: finalEnabled,
			status: status,
			deviceCount: devices.length,
			devices: devices,
			mfaEnabled: mfaEnabled, // From mfaEnabled endpoint
		});
	} catch (error) {
		console.error('[PingOne User MFA] Server error:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error during MFA status fetch',
			details: error.message,
		});
	}
});

// UserInfo Endpoint (proxy to PingOne)
app.get('/api/userinfo', async (req, res) => {
	try {
		const { access_token, environment_id } = req.query;

		if (!access_token || !environment_id) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameters: access_token, environment_id',
			});
		}

		const userInfoEndpoint = `https://auth.pingone.com/${environment_id}/as/userinfo`;

		const response = await global.fetch(userInfoEndpoint, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${access_token}`,
				Accept: 'application/json',
			},
		});

		const data = await response.json();

		if (!response.ok) {
			console.error(`[UserInfo] PingOne error:`, data);
			return res.status(response.status).json(data);
		}

		console.log(`[UserInfo] Success for token: ${access_token.substring(0, 10)}...`);

		data.server_timestamp = new Date().toISOString();

		res.json(data);
	} catch (error) {
		console.error('[UserInfo] Server error:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error during userinfo request',
		});
	}
});

// Token Validation Endpoint
app.post('/api/validate-token', async (req, res) => {
	try {
		const { access_token, environment_id } = req.body;

		if (!access_token || !environment_id) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameters: access_token, environment_id',
			});
		}

		// Use UserInfo endpoint to validate token
		const userInfoEndpoint = `https://auth.pingone.com/${environment_id}/as/userinfo`;

		const response = await global.fetch(userInfoEndpoint, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${access_token}`,
				Accept: 'application/json',
			},
		});

		if (response.ok) {
			const userInfo = await response.json();
			res.json({
				valid: true,
				user_info: userInfo,
				server_timestamp: new Date().toISOString(),
			});
		} else {
			const errorData = await response.json();
			res.json({
				valid: false,
				error: errorData,
				server_timestamp: new Date().toISOString(),
			});
		}
	} catch (error) {
		console.error('[Token Validation] Server error:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error during token validation',
		});
	}
});

// Device Authorization Endpoint (proxy to PingOne)
app.post('/api/device-authorization', async (req, res) => {
	try {
		const {
			environment_id,
			client_id,
			scope,
			audience,
			acr_values,
			prompt,
			max_age,
			ui_locales,
			claims,
			app_identifier,
		} = req.body;

		if (!environment_id || !client_id) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameters: environment_id, client_id',
			});
		}

		const deviceEndpoint = `https://auth.pingone.com/${environment_id}/as/device`;

		console.log(`[Device Authorization] Starting device flow for client: ${client_id}`);

		const formData = new URLSearchParams();
		formData.append('client_id', client_id);
		if (scope) formData.append('scope', scope);
		if (audience) formData.append('audience', audience);
		if (acr_values) formData.append('acr_values', acr_values);
		if (prompt) formData.append('prompt', prompt);
		if (max_age) formData.append('max_age', max_age.toString());
		if (ui_locales) formData.append('ui_locales', ui_locales);
		if (claims) formData.append('claims', claims);
		if (app_identifier) formData.append('app_identifier', app_identifier);

		const response = await global.fetch(deviceEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json',
			},
			body: formData,
		});

		const data = await response.json();

		if (!response.ok) {
			console.error(`[Device Authorization] PingOne error:`, data);
			return res.status(response.status).json(data);
		}

		console.log(`[Device Authorization] Success for client: ${client_id}`);

		data.server_timestamp = new Date().toISOString();

		res.json(data);
	} catch (error) {
		console.error('[Device Authorization] Server error:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error during device authorization',
		});
	}
});

// Device UserInfo Endpoint (for OIDC Device Authorization flow)
app.get('/api/device-userinfo', async (req, res) => {
	try {
		const { access_token, environment_id } = req.query;

		console.log(`[Device UserInfo] Request received:`, {
			hasAccessToken: !!access_token,
			accessTokenLength: access_token?.length,
			environment_id,
			accessTokenPreview: access_token ? `${access_token.substring(0, 20)}...` : 'none',
		});

		if (!access_token || !environment_id) {
			console.log(`[Device UserInfo] Missing required parameters`);
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameters: access_token, environment_id',
			});
		}

		const userInfoEndpoint = `https://auth.pingone.com/${environment_id}/as/userinfo`;
		console.log(`[Device UserInfo] Calling PingOne endpoint: ${userInfoEndpoint}`);

		const response = await global.fetch(userInfoEndpoint, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${access_token}`,
				Accept: 'application/json',
			},
		});

		console.log(`[Device UserInfo] PingOne response:`, {
			status: response.status,
			statusText: response.statusText,
			ok: response.ok,
		});

		const data = await response.json();

		console.log(`[Device UserInfo] PingOne response data:`, {
			hasData: !!data,
			error: data.error,
			error_description: data.error_description,
		});

		if (!response.ok) {
			console.error(`[Device UserInfo] PingOne error:`, data);
			return res.status(response.status).json(data);
		}

		console.log(`[Device UserInfo] Success for token: ${access_token.substring(0, 10)}...`);

		data.server_timestamp = new Date().toISOString();

		res.json(data);
	} catch (error) {
		console.error('[Device UserInfo] Server error:', {
			message: error.message,
			stack: error.stack,
			error,
		});
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error during device userinfo request',
			details: error.message,
		});
	}
});

// PAR (Pushed Authorization Request) Endpoint (proxy to PingOne)
app.post('/api/par', async (req, res) => {
	try {
		const { environment_id, client_id, client_secret, ...parParams } = req.body;

		if (!environment_id || !client_id) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameters: environment_id, client_id',
			});
		}

		const parEndpoint = `https://auth.pingone.com/${environment_id}/as/par`;

		console.log(`[PAR] Generating PAR request for client: ${client_id}`);
		console.log(`[PAR] Debug Info:`, {
			environmentId: environment_id,
			clientId: client_id,
			hasClientSecret: !!client_secret,
			parParams: parParams,
			redirectUri: parParams.redirect_uri,
		});

		const formData = new URLSearchParams();
		Object.entries(parParams).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				formData.append(key, value.toString());
			}
		});

		const headers = {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json',
		};

		// Add client authentication based on PingOne configuration
		// For "Client Secret Basic" method, use Authorization header AND include client_id in form data
		if (client_secret) {
			const credentials = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
			headers['Authorization'] = `Basic ${credentials}`;
			// PingOne still requires client_id in the form data even with Basic auth
			formData.append('client_id', client_id);
			console.log(`[PAR] Using Basic authentication for client: ${client_id}`);
		} else {
			// Fallback to client_secret_post method if no client_secret provided
			formData.append('client_id', client_id);
			console.log(`[PAR] Using client_secret_post method for client: ${client_id}`);
		}

		console.log(`[PAR] Sending to PingOne:`, {
			url: parEndpoint,
			headers: headers,
			body: formData.toString(),
			redirectUri: formData.get('redirect_uri'),
			authMethod: client_secret ? 'Basic' : 'client_secret_post',
		});

		const response = await global.fetch(parEndpoint, {
			method: 'POST',
			headers,
			body: formData,
		});

		const data = await response.json();

		if (!response.ok) {
			console.error(`[PAR] PingOne error:`, data);
			return res.status(response.status).json(data);
		}

		console.log(`[PAR] Success for client: ${client_id}`);

		data.server_timestamp = new Date().toISOString();

		res.json(data);
	} catch (error) {
		console.error('[PAR] Server error:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error during PAR request',
		});
	}
});

// ============================================
// PINGONE PASSWORD RESET ENDPOINTS
// ============================================

// Send Recovery Code
app.post('/api/pingone/password/send-recovery-code', async (req, res) => {
	try {
		const { environmentId, userId, workerToken } = req.body;

		if (!environmentId || !userId || !workerToken) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameters: environmentId, userId, workerToken',
			});
		}

		console.log('[🔐 PASSWORD] Sending recovery code...', {
			environmentId: `${environmentId?.substring(0, 20)}...`,
			userId: `${userId?.substring(0, 20)}...`,
		});

		// PingOne Platform API - Send recovery code
		const pingOneUrl = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/password/recovery`;

		const pingOneResponse = await fetch(pingOneUrl, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${workerToken}`,
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify({}), // Empty body to trigger recovery code sending
		});

		let responseData;
		try {
			responseData = await pingOneResponse.json();
		} catch {
			// If response is not JSON (e.g., 204 No Content), treat as success
			if (pingOneResponse.ok) {
				responseData = { success: true };
			} else {
				responseData = {
					error: 'unknown_error',
					error_description: 'Failed to send recovery code',
				};
			}
		}

		if (!pingOneResponse.ok) {
			console.error('[🔐 PASSWORD] Failed to send recovery code:', responseData);
			return res.status(pingOneResponse.status).json(responseData);
		}

		console.log('[🔐 PASSWORD] Recovery code sent successfully');
		res.json({
			success: true,
			message: 'Recovery code sent successfully',
			userId: userId,
		});
	} catch (error) {
		console.error('[🔐 PASSWORD] Error sending recovery code:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error',
			details: error.message,
		});
	}
});

// Recover Password
app.post('/api/pingone/password/recover', async (req, res) => {
	try {
		const { environmentId, userId, workerToken, recoveryCode, newPassword } = req.body;

		if (!environmentId || !userId || !workerToken || !recoveryCode || !newPassword) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description:
					'Missing required parameters: environmentId, userId, workerToken, recoveryCode, newPassword',
			});
		}

		console.log('[🔐 PASSWORD] Recovering password...', {
			environmentId: `${environmentId?.substring(0, 20)}...`,
			userId: `${userId?.substring(0, 20)}...`,
		});

		const pingOneUrl = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/password`;

		const pingOneResponse = await fetch(pingOneUrl, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${workerToken}`,
				'Content-Type': 'application/vnd.pingidentity.password.recover+json',
				Accept: 'application/json',
			},
			body: JSON.stringify({
				recoveryCode,
				newPassword,
			}),
		});

		const responseData = await pingOneResponse.json();

		if (!pingOneResponse.ok) {
			console.error('[🔐 PASSWORD] Password recovery failed:', responseData);
			return res.status(pingOneResponse.status).json({
				error: responseData.error || 'unknown_error',
				error_description:
					responseData.error_description || responseData.message || 'Password recovery failed',
			});
		}

		console.log('[🔐 PASSWORD] ✅ Password recovered successfully');
		res.json({
			success: true,
			message: 'Password recovered successfully',
			transactionId: responseData.id || responseData.transactionId,
		});
	} catch (error) {
		console.error('[🔐 PASSWORD] Error recovering password:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error',
			details: error.message,
		});
	}
});

// Force Password Change
app.post('/api/pingone/password/force-change', async (req, res) => {
	try {
		const { environmentId, userId, workerToken } = req.body;

		if (!environmentId || !userId || !workerToken) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameters: environmentId, userId, workerToken',
			});
		}

		console.log('[🔐 PASSWORD] Forcing password change...', {
			environmentId: `${environmentId?.substring(0, 20)}...`,
			userId: `${userId?.substring(0, 20)}...`,
		});

		const pingOneUrl = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/password`;

		const pingOneResponse = await fetch(pingOneUrl, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${workerToken}`,
				'Content-Type': 'application/vnd.pingidentity.password.forceChange+json',
				Accept: 'application/json',
			},
			body: JSON.stringify({
				forceChange: true,
			}),
		});

		const responseData = await pingOneResponse.json();

		if (!pingOneResponse.ok) {
			console.error('[🔐 PASSWORD] Force password change failed:', responseData);
			return res.status(pingOneResponse.status).json({
				error: responseData.error || 'unknown_error',
				error_description:
					responseData.error_description || responseData.message || 'Force password change failed',
			});
		}

		console.log('[🔐 PASSWORD] ✅ Password change forced successfully');
		res.json({
			success: true,
			message: 'User will be required to change password on next sign-on',
			transactionId: responseData.id || responseData.transactionId,
		});
	} catch (error) {
		console.error('[🔐 PASSWORD] Error forcing password change:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error',
			details: error.message,
		});
	}
});

// Change Password
app.post('/api/pingone/password/change', async (req, res) => {
	try {
		const { environmentId, userId, accessToken, oldPassword, newPassword } = req.body;

		if (!environmentId || !userId || !accessToken || !oldPassword || !newPassword) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description:
					'Missing required parameters: environmentId, userId, accessToken, oldPassword, newPassword',
			});
		}

		console.log('[🔐 PASSWORD] Changing password...', {
			environmentId: `${environmentId?.substring(0, 20)}...`,
			userId: `${userId?.substring(0, 20)}...`,
		});

		const pingOneUrl = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/password`;

		const pingOneResponse = await fetch(pingOneUrl, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/vnd.pingidentity.password.change+json',
				Accept: 'application/json',
			},
			body: JSON.stringify({
				oldPassword,
				newPassword,
			}),
		});

		const responseData = await pingOneResponse.json();

		if (!pingOneResponse.ok) {
			console.error('[🔐 PASSWORD] Password change failed:', responseData);
			return res.status(pingOneResponse.status).json({
				error: responseData.error || 'unknown_error',
				error_description:
					responseData.error_description || responseData.message || 'Password change failed',
			});
		}

		console.log('[🔐 PASSWORD] ✅ Password changed successfully');
		res.json({
			success: true,
			message: 'Password changed successfully',
			transactionId: responseData.id || responseData.transactionId,
		});
	} catch (error) {
		console.error('[🔐 PASSWORD] Error changing password:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error',
			details: error.message,
		});
	}
});

// Password Check
app.post('/api/pingone/password/check', async (req, res) => {
	try {
		const { environmentId, userId, workerToken, password } = req.body;

		if (!environmentId || !userId || !workerToken || !password) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description:
					'Missing required parameters: environmentId, userId, workerToken, password',
			});
		}

		console.log('[🔐 PASSWORD] Checking password...', {
			environmentId: `${environmentId?.substring(0, 20)}...`,
			userId: `${userId?.substring(0, 20)}...`,
		});

		const pingOneUrl = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/password/check`;

		const pingOneResponse = await fetch(pingOneUrl, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${workerToken}`,
				'Content-Type': 'application/vnd.pingidentity.password.check+json',
				Accept: 'application/json',
			},
			body: JSON.stringify({
				password,
			}),
		});

		const responseData = await pingOneResponse.json();

		if (!pingOneResponse.ok) {
			console.error('[🔐 PASSWORD] Password check failed:', responseData);
			return res.status(pingOneResponse.status).json({
				error: responseData.error || 'unknown_error',
				error_description:
					responseData.error_description || responseData.message || 'Password check failed',
			});
		}

		console.log('[🔐 PASSWORD] ✅ Password check successful');
		res.json({
			success: true,
			message: 'Password check successful',
			valid: responseData.valid || true,
		});
	} catch (error) {
		console.error('[🔐 PASSWORD] Error checking password:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error',
			details: error.message,
		});
	}
});

// Update Password (Set)
app.put('/api/pingone/password/set', async (req, res) => {
	try {
		const { environmentId, userId, workerToken, newPassword, forceChange, bypassPasswordPolicy } =
			req.body;

		if (!environmentId || !userId || !workerToken || !newPassword) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description:
					'Missing required parameters: environmentId, userId, workerToken, newPassword',
			});
		}

		console.log('[🔐 PASSWORD] Setting password...', {
			environmentId: `${environmentId?.substring(0, 20)}...`,
			userId: `${userId?.substring(0, 20)}...`,
			forceChange: forceChange || false,
			bypassPasswordPolicy: bypassPasswordPolicy || false,
		});

		const pingOneUrl = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/password`;

		const requestBody = {
			password: newPassword,
		};

		// Add forceChange option if provided
		if (forceChange === true) {
			requestBody.forceChange = true;
		}

		// Add bypassPasswordPolicy option if provided
		if (bypassPasswordPolicy === true) {
			requestBody.bypassPasswordPolicy = true;
		}

		const pingOneResponse = await fetch(pingOneUrl, {
			method: 'PUT',
			headers: {
				Authorization: `Bearer ${workerToken}`,
				'Content-Type': 'application/vnd.pingidentity.password.set+json',
				Accept: 'application/json',
			},
			body: JSON.stringify(requestBody),
		});

		const responseData = await pingOneResponse.json();

		if (!pingOneResponse.ok) {
			console.error('[🔐 PASSWORD] Password set failed:', responseData);
			return res.status(pingOneResponse.status).json({
				error: responseData.error || 'unknown_error',
				error_description:
					responseData.error_description || responseData.message || 'Password set failed',
			});
		}

		console.log('[🔐 PASSWORD] ✅ Password set successfully');
		res.json({
			success: true,
			message: 'Password set successfully',
			transactionId: responseData.id || responseData.transactionId,
		});
	} catch (error) {
		console.error('[🔐 PASSWORD] Error setting password:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error',
			details: error.message,
		});
	}
});

// Update Password (Set Value)
app.put('/api/pingone/password/set-value', async (req, res) => {
	try {
		const { environmentId, userId, workerToken, passwordValue, forceChange, bypassPasswordPolicy } =
			req.body;

		if (!environmentId || !userId || !workerToken || !passwordValue) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description:
					'Missing required parameters: environmentId, userId, workerToken, passwordValue',
			});
		}

		console.log('[🔐 PASSWORD] Reading password state...', {
			environmentId: `${environmentId?.substring(0, 20)}...`,
			userId: `${userId?.substring(0, 20)}...`,
		});

		const pingOneUrl = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/password`;

		const requestBody = {
			value: passwordValue,
		};

		// Add forceChange option if provided
		if (forceChange === true) {
			requestBody.forceChange = true;
		}

		// Add bypassPasswordPolicy option if provided
		if (bypassPasswordPolicy === true) {
			requestBody.bypassPasswordPolicy = true;
		}

		const pingOneResponse = await fetch(pingOneUrl, {
			method: 'PUT',
			headers: {
				Authorization: `Bearer ${workerToken}`,
				'Content-Type': 'application/vnd.pingidentity.password.setValue+json',
				Accept: 'application/json',
			},
			body: JSON.stringify(requestBody),
		});

		const responseData = await pingOneResponse.json();

		if (!pingOneResponse.ok) {
			console.error('[🔐 PASSWORD] Password value set failed:', responseData);
			return res.status(pingOneResponse.status).json({
				error: responseData.error || 'unknown_error',
				error_description:
					responseData.error_description || responseData.message || 'Password value set failed',
			});
		}

		console.log('[🔐 PASSWORD] ✅ Password value set successfully');
		res.json({
			success: true,
			message: 'Password value set successfully',
			transactionId: responseData.id || responseData.transactionId,
		});
	} catch (error) {
		console.error('[🔐 PASSWORD] Error setting password value:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error',
			details: error.message,
		});
	}
});

// Update Password (LDAP Gateway)
app.put('/api/pingone/password/ldap-gateway', async (req, res) => {
	try {
		const {
			environmentId,
			userId,
			workerToken,
			newPassword,
			ldapGatewayId,
			forceChange,
			bypassPasswordPolicy,
		} = req.body;

		if (!environmentId || !userId || !workerToken || !newPassword) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description:
					'Missing required parameters: environmentId, userId, workerToken, newPassword',
			});
		}

		console.log('[🔐 PASSWORD] Setting password via LDAP Gateway...', {
			environmentId: `${environmentId?.substring(0, 20)}...`,
			userId: `${userId?.substring(0, 20)}...`,
			forceChange: forceChange || false,
			bypassPasswordPolicy: bypassPasswordPolicy || false,
		});

		const pingOneUrl = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/password`;

		const requestBody = {
			password: newPassword,
		};

		// Add optional fields
		if (ldapGatewayId) {
			requestBody.ldapGatewayId = ldapGatewayId;
		}
		if (forceChange === true) {
			requestBody.forceChange = true;
		}
		if (bypassPasswordPolicy === true) {
			requestBody.bypassPasswordPolicy = true;
		}

		const pingOneResponse = await fetch(pingOneUrl, {
			method: 'PUT',
			headers: {
				Authorization: `Bearer ${workerToken}`,
				'Content-Type': 'application/vnd.pingidentity.password.ldapGateway+json',
				Accept: 'application/json',
			},
			body: JSON.stringify(requestBody),
		});

		const responseData = await pingOneResponse.json();

		if (!pingOneResponse.ok) {
			console.error('[🔐 PASSWORD] LDAP Gateway password set failed:', responseData);
			return res.status(pingOneResponse.status).json({
				error: responseData.error || 'unknown_error',
				error_description:
					responseData.error_description ||
					responseData.message ||
					'LDAP Gateway password set failed',
			});
		}

		console.log('[🔐 PASSWORD] ✅ Password set successfully via LDAP Gateway');
		res.json({
			success: true,
			message: 'Password set successfully via LDAP Gateway',
			transactionId: responseData.id || responseData.transactionId,
		});
	} catch (error) {
		console.error('[🔐 PASSWORD] Error setting password via LDAP Gateway:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error',
			details: error.message,
		});
	}
});

// PingOne MFA Challenge Initiation Endpoint (simplified for frontend)
app.post('/api/mfa/challenge/initiate', async (req, res) => {
	try {
		const { environmentId, userId, deviceId, deviceType, challengeType } = req.body;

		console.log(`[PingOne MFA] Challenge initiation request:`, {
			environmentId,
			userId,
			deviceId,
			deviceType,
			challengeType,
		});

		// Make real API call to PingOne for MFA challenge initiation
		const pingOneChallengeUrl = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}/challenges`;

		const challengeRequestBody = {
			challengeType: challengeType,
			deviceType: deviceType,
		};

		console.log(`[PingOne MFA] Making real API call to PingOne:`, {
			url: pingOneChallengeUrl,
			method: 'POST',
			body: challengeRequestBody,
		});

		const pingOneResponse = await fetch(pingOneChallengeUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${req.headers.authorization?.replace('Bearer ', '')}`,
			},
			body: JSON.stringify(challengeRequestBody),
		});

		if (!pingOneResponse.ok) {
			const errorData = await pingOneResponse.json();
			console.error(`[PingOne MFA] PingOne challenge initiation failed:`, errorData);
			return res.status(pingOneResponse.status).json({
				success: false,
				error: errorData.error || 'challenge_initiation_failed',
				error_description:
					errorData.error_description || errorData.message || 'Failed to initiate MFA challenge',
				server_timestamp: new Date().toISOString(),
			});
		}

		const challengeData = await pingOneResponse.json();
		console.log(`[PingOne MFA] PingOne challenge initiated successfully:`, challengeData);

		const message =
			challengeType === 'SMS'
				? `Verification code sent to your phone`
				: challengeType === 'EMAIL'
					? `Verification code sent to your email`
					: `Verification code generated for your ${challengeType} device`;

		res.json({
			success: true,
			challengeId: challengeData.challengeId || challengeData.id,
			userId: userId,
			deviceId: deviceId,
			type: challengeType,
			status: challengeData.status || 'PENDING',
			message: message,
			expiresAt: challengeData.expiresAt || new Date(Date.now() + 5 * 60 * 1000).toISOString(),
			server_timestamp: new Date().toISOString(),
			pingOneResponse: challengeData,
		});
	} catch (error) {
		console.error('[PingOne MFA] Challenge initiation server error:', error);
		res.status(500).json({
			success: false,
			error: 'server_error',
			error_description: 'Internal server error during MFA challenge initiation',
			details: error.message,
		});
	}
});

// JWKS Endpoint (proxy to PingOne)
app.get('/api/jwks', async (req, res) => {
	try {
		const { environment_id } = req.query;

		if (!environment_id) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameter: environment_id',
			});
		}

		const jwksUri = `https://auth.pingone.com/${environment_id}/as/jwks`;

		console.log(`[JWKS] Fetching JWKS for environment: ${environment_id}`);

		const response = await global.fetch(jwksUri, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				'User-Agent': 'OAuth-Playground/1.0',
			},
		});

		if (!response.ok) {
			console.error(`[JWKS] PingOne error: ${response.status} ${response.statusText}`);
			return res.status(response.status).json({
				error: 'jwks_fetch_failed',
				error_description: `Failed to fetch JWKS: ${response.status} ${response.statusText}`,
			});
		}

		const jwks = await response.json();

		console.log(`[JWKS] Success for environment: ${environment_id}`);

		res.json({
			...jwks,
			server_timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error('[JWKS] Server error:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error during JWKS fetch',
		});
	}
});

// Device Registration Endpoint (proxy to PingOne)
app.post('/api/device/register', async (req, res) => {
	try {
		const {
			environmentId,
			userId,
			deviceType,
			deviceName,
			contactInfo,
			verificationCode,
			workerToken,
		} = req.body;

		console.log(`[Device Registration] Request received:`, {
			environmentId,
			userId,
			deviceType,
			deviceName,
			contactInfo: contactInfo
				? `${contactInfo.substring(0, 3)}***${contactInfo.substring(contactInfo.length - 4)}`
				: 'none',
			hasVerificationCode: !!verificationCode,
			hasWorkerToken: !!workerToken,
		});

		if (!environmentId || !userId || !deviceType || !deviceName || !workerToken) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description:
					'Missing required parameters: environmentId, userId, deviceType, deviceName, workerToken',
			});
		}

		// Make API call to PingOne for device registration
		// Use device-type-specific endpoint according to PingOne MFA API documentation
		const deviceTypeEndpoint = deviceType.toLowerCase(); // e.g., 'sms', 'email', 'totp', 'fido2'
		const deviceRegistrationUrl = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceTypeEndpoint}`;

		// Build request body according to device type
		const requestBody = {
			nickname: deviceName,
		};

		// Add device-specific fields
		if (deviceType.toLowerCase() === 'sms' || deviceType.toLowerCase() === 'voice' || deviceType.toLowerCase() === 'whatsapp') {
			requestBody.phone = contactInfo;
		} else if (deviceType.toLowerCase() === 'email') {
			requestBody.email = contactInfo;
		} else if (deviceType.toLowerCase() === 'totp') {
			// TOTP doesn't require additional fields
		} else if (deviceType.toLowerCase() === 'fido2') {
			// FIDO2 registration is handled differently (client-side WebAuthn API)
		}

		console.log(`[Device Registration] Making API call to PingOne:`, {
			url: deviceRegistrationUrl,
			method: 'POST',
			body: requestBody,
		});

		const deviceRegistrationResponse = await fetch(deviceRegistrationUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${workerToken}`,
			},
			body: JSON.stringify(requestBody),
		});

		const responseData = await deviceRegistrationResponse.json();

		if (!deviceRegistrationResponse.ok) {
			console.error(`[Device Registration] PingOne API error:`, responseData);
			return res.status(deviceRegistrationResponse.status).json({
				error: 'device_registration_failed',
				error_description:
					responseData.message || responseData.error || 'Device registration failed',
				details: responseData,
			});
		}

		console.log(`[Device Registration] Success:`, responseData);
		res.json(responseData);
	} catch (error) {
		console.error(`[Device Registration] Error:`, error);
		res.status(500).json({
			error: 'internal_server_error',
			error_description: 'Internal server error during device registration',
			details: error.message,
		});
	}
});

// Network connectivity check endpoint
app.get('/api/network/check', async (req, res) => {
	try {
		console.log(`[Network Check] Testing connectivity to PingOne...`);

		// Test DNS resolution and basic connectivity
		const testUrl = 'https://auth.pingone.com';
		const response = await fetch(testUrl, {
			method: 'HEAD',
			timeout: 5000,
		});

		console.log(`[Network Check] PingOne connectivity test result:`, {
			status: response.status,
			statusText: response.statusText,
			headers: Object.fromEntries(response.headers.entries()),
		});

		res.json({
			status: 'success',
			message: 'Network connectivity to PingOne is working',
			pingone_status: response.status,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error(`[Network Check] Connectivity test failed:`, error);

		res.status(500).json({
			status: 'error',
			message: 'Network connectivity to PingOne failed',
			error: {
				code: error.code,
				message: error.message,
				errno: error.errno,
				syscall: error.syscall,
				hostname: error.hostname,
			},
			timestamp: new Date().toISOString(),
		});
	}
});

// PingOne Redirectless Authorization Endpoint (for starting redirectless authentication)
app.post('/api/pingone/redirectless/authorize', async (req, res) => {
	try {
		console.log(`[PingOne Redirectless] Received request body:`, JSON.stringify(req.body, null, 2));

		const {
			environmentId,
			clientId,
			clientSecret,
			redirectUri,
			scopes,
			codeChallenge,
			codeChallengeMethod,
			state,
			username,
			password,
		} = req.body;

		if (!environmentId || !clientId) {
			console.log(`[PingOne Redirectless] Validation failed: Missing required parameters`);
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameters: environmentId, clientId',
			});
		}

		console.log(`[PingOne Redirectless] Starting authorization request`);
		console.log(`[PingOne Redirectless] Environment ID:`, environmentId);
		console.log(
			`[PingOne Redirectless] Client ID:`,
			clientId ? `${clientId.substring(0, 8)}...` : 'none'
		);
		console.log(`[PingOne Redirectless] Has Client Secret:`, !!clientSecret);
		console.log(`[PingOne Redirectless] Redirect URI:`, redirectUri || '(using default)');
		console.log(`[PingOne Redirectless] Scopes:`, scopes);
		console.log(`[PingOne Redirectless] Has PKCE:`, !!codeChallenge);

		// Build authorization request parameters (per PingOne pi.flow documentation)
		const authParams = new URLSearchParams();
		authParams.set('response_type', 'code');
		authParams.set('response_mode', 'pi.flow'); // CRITICAL: Enable redirectless flow
		authParams.set('client_id', clientId);
		// Ensure 'openid' is included in scopes for OIDC flows
		const scopeList = (scopes || 'openid').trim().split(/\s+/);
		if (!scopeList.includes('openid')) {
			scopeList.unshift('openid'); // Add 'openid' at the beginning if missing
		}
		const finalScopes = scopeList.join(' ');
		authParams.set('scope', finalScopes);
		console.log(`[PingOne Redirectless] Final scopes: ${finalScopes}`);
		authParams.set('state', state || `pi-flow-${Date.now()}`);

		// CRITICAL: Even though docs say redirect_uri is optional for pi.flow,
		// PingOne may still require it for validation if it's registered in the app
		// Include it if provided to match registered redirect URIs exactly
		if (redirectUri) {
			authParams.set('redirect_uri', redirectUri);
			console.log(`[PingOne Redirectless] Including redirect_uri: ${redirectUri}`);
		} else {
			console.log(
				`[PingOne Redirectless] No redirect_uri provided - using pi.flow without redirect_uri`
			);
		}

		// Add PKCE parameters - REQUIRED for redirectless flows with PKCE
		if (codeChallenge && typeof codeChallenge === 'string' && codeChallenge.trim().length > 0) {
			authParams.set('code_challenge', codeChallenge.trim());
			authParams.set('code_challenge_method', codeChallengeMethod || 'S256');
			console.log(
				`[PingOne Redirectless] Added PKCE: code_challenge=${codeChallenge.substring(0, 20)}... (length: ${codeChallenge.length})`
			);
		} else {
			console.error(`[PingOne Redirectless] ERROR: Invalid code_challenge provided:`, {
				hasCodeChallenge: !!codeChallenge,
				type: typeof codeChallenge,
				length: codeChallenge?.length,
				value: codeChallenge?.substring(0, 50),
			});
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'code_challenge is required for PKCE flow',
			});
		}

		// CORRECT pi.flow PATTERN (per documentation):
		// 4-Step Pattern: Request flow WITHOUT credentials in Step 1, then use Flow API in Step 2
		// - Step 1 (authorize): NO credentials - returns flow object with flowId
		// - Step 2 (flows/{flowId}): Credentials sent DIRECTLY to PingOne Flow API (over HTTPS)
		// - Step 3 (resume): Get authorization code
		// - Step 4 (token): Exchange code for tokens (NO credentials here)
		//
		// IMPORTANT: Credentials are ONLY sent to PingOne's Flow API endpoint in Step 2.
		// They are NEVER sent to /as/authorize, /as/token, or our backend.

		// Check if credentials provided - if yes, we allow it (legacy pattern)
		// But per documentation, the 4-step pattern sends NO credentials in Step 1
		if (username && password) {
			console.log(
				`[PingOne Redirectless] WARNING: Credentials provided in Step 1. Per documentation, 4-step pattern should send credentials in Step 2 (Flow API) instead.`
			);
			authParams.set('username', username);
			authParams.set('password', password);
		} else {
			console.log(
				`[PingOne Redirectless] No credentials in Step 1 - following 4-step pattern (Flow API in Step 2)`
			);
		}

		// Debug: Log all parameters to check for duplicates
		console.log(`[PingOne Redirectless] All URL parameters:`, Array.from(authParams.entries()));
		console.log(`[PingOne Redirectless] Checking for duplicate client_id:`, {
			count: authParams.getAll('client_id').length,
			values: authParams.getAll('client_id'),
		});

		// For redirectless flow, send parameters in the POST body, NOT in URL query string
		const authorizeUrl = `https://auth.pingone.com/${environmentId}/as/authorize`;
		console.log(`[PingOne Redirectless] Authorization URL:`, authorizeUrl);
		console.log(`[PingOne Redirectless] POST Body:`, authParams.toString());

		// Make the authorization request with retry logic
		let authResponse;
		let lastError;
		const maxRetries = 3;

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				console.log(`[PingOne Redirectless] Attempt ${attempt}/${maxRetries} to PingOne`);
				// Use AbortController for timeout (native fetch doesn't support timeout option)
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

				try {
					authResponse = await fetch(authorizeUrl, {
						method: 'POST',
						headers: {
							Accept: 'application/json',
							'Content-Type': 'application/x-www-form-urlencoded',
							'User-Agent': 'OAuth-Playground/1.0',
						},
						body: authParams.toString(),
						signal: controller.signal,
					});
					clearTimeout(timeoutId);
				} catch (fetchError) {
					clearTimeout(timeoutId);
					if (fetchError.name === 'AbortError') {
						throw new Error('Request timeout after 10 seconds');
					}
					throw fetchError;
				}
				break; // Success, exit retry loop
			} catch (error) {
				lastError = error;
				console.log(`[PingOne Redirectless] Attempt ${attempt} failed:`, error.message);

				if (attempt < maxRetries) {
					const delay = attempt * 1000; // Exponential backoff: 1s, 2s, 3s
					console.log(`[PingOne Redirectless] Retrying in ${delay}ms...`);
					await new Promise((resolve) => setTimeout(resolve, delay));
				}
			}
		}

		if (!authResponse) {
			throw lastError || new Error('All retry attempts failed');
		}

		// Check content-type to handle both JSON and HTML responses
		const contentType = authResponse.headers.get('content-type') || '';
		let responseData;
		let parseError = null;
		let responseText = '';

		try {
			if (contentType.includes('application/json')) {
				responseData = await authResponse.json();
			} else {
				// If not JSON, get text first (we need to store it for error reporting)
				responseText = await authResponse.text();
				try {
					responseData = JSON.parse(responseText);
				} catch (e) {
					// If it's HTML or other text, log it
					console.error(
						`[PingOne Redirectless] Response is not valid JSON:`,
						responseText.substring(0, 500)
					);
					parseError = e;
				}
			}
		} catch (error) {
			console.error(`[PingOne Redirectless] Failed to parse response:`, error.message);
			parseError = error;
			// Try to get text for error reporting if we haven't already
			if (!responseText) {
				try {
					responseText = await authResponse.text();
				} catch (e) {
					responseText = 'Unable to read response body';
				}
			}
		}

		// If we couldn't parse the response as JSON, return error now
		if (parseError || !responseData) {
			console.error(`[PingOne Redirectless] Invalid response format detected`);
			console.error(`[PingOne Redirectless] Response status:`, authResponse.status);
			console.error(`[PingOne Redirectless] Response statusText:`, authResponse.statusText);
			console.error(
				`[PingOne Redirectless] Response headers:`,
				Object.fromEntries(authResponse.headers.entries())
			);
			console.error(
				`[PingOne Redirectless] Response body (first 1000 chars):`,
				responseText.substring(0, 1000)
			);

			return res.status(500).json({
				error: 'invalid_response',
				error_description:
					'PingOne returned an invalid response format. This usually indicates a server configuration issue or invalid request parameters.',
				details: {
					message: parseError?.message || 'Unable to parse response',
					contentType: contentType || 'unknown',
					status: authResponse.status,
					statusText: authResponse.statusText,
					responsePreview: responseText.substring(0, 500),
				},
			});
		}

		if (!authResponse.ok) {
			console.error(`[PingOne Redirectless] PingOne API Error:`, {
				status: authResponse.status,
				statusText: authResponse.statusText,
				responseData: responseData,
				requestUrl: authorizeUrl,
			});
			return res.status(authResponse.status).json({
				error: 'authorization_failed',
				error_description:
					responseData.message || responseData.error || 'Failed to start authorization flow',
				details: responseData,
			});
		}

		// Extract session tokens - check BOTH JSON response AND Set-Cookie headers
		// PingOne may return tokens in JSON (interactionId/interactionToken) OR as Set-Cookie headers
		const interactionId = responseData.interactionId;
		const interactionToken = responseData.interactionToken;

		// Also check Set-Cookie headers
		const setCookieHeaders = authResponse.headers.raw()['set-cookie'] || [];

		console.log(`\n🍪 ====== SESSION TOKEN ANALYSIS ======`);
		console.log(`[PingOne Redirectless] Checking for session tokens...`);
		console.log(`   JSON - Has interactionId:`, !!interactionId);
		console.log(`   JSON - Has interactionToken:`, !!interactionToken);
		console.log(`   Headers - Set-Cookie count:`, setCookieHeaders.length);

		if (setCookieHeaders.length > 0) {
			console.log(`✅ Found Set-Cookie headers from PingOne:`);
			setCookieHeaders.forEach((cookie, idx) => {
				const cookieName = cookie.split('=')[0];
				console.log(`   Cookie ${idx + 1}: ${cookieName}`);
			});
		}

		if (interactionId && interactionToken) {
			console.log(`✅ Session tokens found in JSON response`);
			console.log(`   interactionId: ${interactionId.substring(0, 8)}...`);
			console.log(`   interactionToken: ${interactionToken.substring(0, 20)}...`);
		}

		if (!interactionId && !interactionToken && setCookieHeaders.length === 0) {
			console.log(`⚠️  No session tokens found in JSON or headers`);
			console.log(`   This flow may use flowId-based authentication instead`);
		}
		console.log(`🍪 ======================================\n`);

		console.log(`[PingOne Redirectless] Success:`, {
			hasResumeUrl: !!responseData.resumeUrl,
			hasFlowId: !!responseData.id,
			hasTokens: !!(responseData.access_token || responseData.id_token),
			hasSessionTokens: !!(interactionId && interactionToken),
			flowStatus: responseData.status,
		});

		// Format session tokens as cookies for Flow API calls
		let sessionCookies = [];

		// First, check for JSON tokens (interactionId/interactionToken)
		if (interactionId && interactionToken) {
			sessionCookies = [`interactionId=${interactionId}`, `interactionToken=${interactionToken}`];
		}

		// Also include Set-Cookie headers if present (PingOne may send these instead)
		if (setCookieHeaders.length > 0) {
			const cookieStrings = setCookieHeaders.map((cookie) => cookie.split(';')[0]); // Extract name=value only
			sessionCookies = [...sessionCookies, ...cookieStrings];
		}

		// Store cookies server-side and return only a sessionId to the frontend
		const sessionId = req.body.sessionId || randomUUID();
		const existing = cookieJar.get(sessionId) || [];
		const merged = mergeCookieArrays(existing, sessionCookies);
		cookieJar.set(sessionId, merged);

		const result = {
			...responseData,
			_sessionId: sessionId,
		};

		res.json(result);
	} catch (error) {
		console.error(`[PingOne Redirectless] Error:`, error);

		// Provide more specific error information
		let errorDescription = 'Internal server error during redirectless authorization';
		let errorCode = 'internal_server_error';

		if (error.code === 'ENOTFOUND') {
			errorDescription = 'DNS resolution failed - cannot reach PingOne servers';
			errorCode = 'dns_resolution_failed';
		} else if (error.code === 'ECONNREFUSED') {
			errorDescription = 'Connection refused - PingOne servers may be down';
			errorCode = 'connection_refused';
		} else if (error.code === 'ETIMEDOUT') {
			errorDescription = 'Request timeout - PingOne servers are not responding';
			errorCode = 'request_timeout';
		} else if (error.message) {
			errorDescription = error.message;
		}

		res.status(500).json({
			error: errorCode,
			error_description: errorDescription,
			details: {
				message: error.message,
				code: error.code,
				errno: error.errno,
				syscall: error.syscall,
				hostname: error.hostname,
			},
		});
	}
});

// PingOne Redirectless Poll Endpoint (for polling redirectless authentication status)
app.post('/api/pingone/redirectless/poll', async (req, res) => {
	try {
		const { resumeUrl } = req.body;

		if (!resumeUrl) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing resumeUrl parameter',
			});
		}

		console.log(`[PingOne Redirectless Poll] Polling resume URL:`, resumeUrl);

		// For redirectless flow, polling is done by calling the resume URL with GET
		// PingOne returns JSON with status: PENDING, COMPLETED, or FAILED
		const resumeUrlObj = new URL(resumeUrl);

		// Add response_mode=pi.flow for JSON response
		if (!resumeUrlObj.searchParams.has('response_mode')) {
			resumeUrlObj.searchParams.set('response_mode', 'pi.flow');
		}

		const finalResumeUrl = resumeUrlObj.toString();

		const pingOneResponse = await fetch(finalResumeUrl, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				'User-Agent': 'OAuth-Playground/1.0',
			},
		});

		let responseData;
		try {
			responseData = await pingOneResponse.json();
		} catch (e) {
			// If response is not JSON, treat as error
			return res.status(pingOneResponse.status).json({
				error: 'invalid_response',
				error_description: 'Failed to parse PingOne response',
			});
		}

		// Return the PingOne response directly (status, code, etc.)
		res.status(pingOneResponse.status).json(responseData);
	} catch (error) {
		console.error('[PingOne Redirectless Poll] Error:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error',
			details: error.message,
		});
	}
});

// PingOne Resume URL Endpoint (for completing redirectless authentication)
app.post('/api/pingone/resume', async (req, res) => {
	try {
		console.log(`[PingOne Resume] Received request body:`, JSON.stringify(req.body, null, 2));

		const {
			resumeUrl,
			flowId,
			flowState,
			clientId,
			clientSecret,
			codeVerifier,
			cookies,
			sessionId,
		} = req.body;

		if (!resumeUrl) {
			console.log(`[PingOne Resume] Validation failed: Missing resumeUrl`);
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing resumeUrl parameter',
			});
		}

		console.log(`[PingOne Resume] Calling resume URL:`, resumeUrl);
		console.log(`[PingOne Resume] Flow ID:`, flowId);
		console.log(`[PingOne Resume] Flow State:`, flowState);
		console.log(
			`[PingOne Resume] Client ID:`,
			clientId ? `${clientId.substring(0, 8)}...` : 'none'
		);
		console.log(`[PingOne Resume] Has Client Secret:`, !!clientSecret);
		console.log(`[PingOne Resume] Has Code Verifier:`, !!codeVerifier);
		const storedCookies = sessionId ? cookieJar.get(sessionId) || [] : [];
		console.log(`[PingOne Resume] Using stored cookies:`, storedCookies.length);

		// For redirectless flow (pi.flow), resume is a GET request
		// The flowId is already in the resumeUrl query string
		// Per PingOne docs: GET /as/resume?flowId={flowId}
		// PingOne returns either:
		// - JSON with authorization code (for pi.flow)
		// - Redirect with Location header (for regular flows)

		// For pi.flow, we need to include additional params for code exchange
		// But flowId should NOT be duplicated if already in URL
		const resumeUrlObj = new URL(resumeUrl);

		// CRITICAL: Add response_mode=pi.flow to resume request for JSON response
		// Per docs: "PingOne responds with either a 302 redirect with ?code=... or a JSON response (if you also set response_mode=pi.flow here)"
		if (!resumeUrlObj.searchParams.has('response_mode')) {
			resumeUrlObj.searchParams.set('response_mode', 'pi.flow');
		}

		// Only add params that aren't already in the URL
		// NOTE: redirect_uri is NOT required for pi.flow (redirectless flows)
		// Per PingOne docs, redirect_uri can be omitted when using response_mode=pi.flow
		if (!resumeUrlObj.searchParams.has('state') && flowState) {
			resumeUrlObj.searchParams.set('state', flowState);
		}
		// Do NOT add redirect_uri for redirectless flows - PingOne doesn't need it
		if (req.body.codeVerifier) {
			resumeUrlObj.searchParams.set('code_verifier', req.body.codeVerifier);
		}

		const finalResumeUrl = resumeUrlObj.toString();
		console.log(`[PingOne Resume] Final resume URL:`, finalResumeUrl);
		console.log(`[PingOne Resume] Resume URL parameters:`, {
			hasFlowId: resumeUrlObj.searchParams.has('flowId'),
			hasResponseMode: resumeUrlObj.searchParams.has('response_mode'),
			responseMode: resumeUrlObj.searchParams.get('response_mode'),
			hasState: resumeUrlObj.searchParams.has('state'),
			hasCodeVerifier: resumeUrlObj.searchParams.has('code_verifier'),
			codeVerifierLength: resumeUrlObj.searchParams.get('code_verifier')?.length || 0,
			allParams: Array.from(resumeUrlObj.searchParams.entries()),
		});

		// CRITICAL: Include session cookies from Step 1/Step 2
		// PingOne resume endpoint requires session cookies to maintain flow state
		const resumeHeaders = {
			Accept: 'application/json',
			'User-Agent': 'OAuth-Playground/1.0',
		};

		if (storedCookies && Array.isArray(storedCookies) && storedCookies.length > 0) {
			// Convert Set-Cookie headers to Cookie header
			const cookieString = storedCookies
				.map((cookie) => {
					// Handle both full Set-Cookie format and simple name=value format
					const nameValue = cookie.split(';')[0].trim();
					return nameValue;
				})
				.filter((c) => c) // Remove empty strings
				.join('; ');
			resumeHeaders['Cookie'] = cookieString;
			console.log(
				`[PingOne Resume] ✅ Including ${storedCookies.length} cookies in request (REQUIRED for session continuity)`
			);
			console.log(
				`[PingOne Resume] Cookie names:`,
				storedCookies
					.map((c) => {
						const [name] = c.split('=');
						return name;
					})
					.join(', ')
			);
			console.log(
				`[PingOne Resume] Cookie header preview:`,
				`${cookieString.substring(0, 100)}...`
			);
		} else {
			console.error(
				`[PingOne Resume] ❌ NO COOKIES PROVIDED! This will likely cause "Session token cookie value does not match" error.`
			);
			console.error(
				`[PingOne Resume] PingOne resume endpoint REQUIRES session cookies from Step 1/2.`
			);
			console.error(
				`[PingOne Resume] Check that Step 1 stored cookies server-side and a valid sessionId is being used.`
			);
		}

		const resumeResponse = await fetch(finalResumeUrl, {
			method: 'GET',
			headers: resumeHeaders,
			redirect: 'manual', // Don't follow redirects automatically
		});

		// Handle redirects (3xx) - PingOne may redirect with Location header containing code
		if (resumeResponse.status >= 300 && resumeResponse.status < 400) {
			const locationHeader = resumeResponse.headers.get('Location');
			console.log(`[PingOne Resume] Redirect received:`, {
				status: resumeResponse.status,
				location: locationHeader,
			});

			if (locationHeader) {
				// Extract code from Location header (e.g., ?code=abc123&state=xyz or /callback?code=abc123)
				let code = null;
				let state = null;

				try {
					// Try parsing as absolute URL first
					const locationUrl = new URL(locationHeader);
					code = locationUrl.searchParams.get('code');
					state = locationUrl.searchParams.get('state');
				} catch (urlError) {
					// If not absolute URL, try as relative URL (e.g., /callback?code=abc123)
					try {
						const baseUrl = new URL(finalResumeUrl);
						const locationUrl = new URL(locationHeader, baseUrl.origin);
						code = locationUrl.searchParams.get('code');
						state = locationUrl.searchParams.get('state');
					} catch (relativeError) {
						// Fallback: try to extract code using regex
						const codeMatch = locationHeader.match(/[?&]code=([^&]+)/);
						const stateMatch = locationHeader.match(/[?&]state=([^&]+)/);
						if (codeMatch && codeMatch[1]) {
							code = decodeURIComponent(codeMatch[1]);
						}
						if (stateMatch && stateMatch[1]) {
							state = decodeURIComponent(stateMatch[1]);
						}
						console.log(`[PingOne Resume] Extracted code using regex fallback:`, {
							hasCode: !!code,
							hasState: !!state,
						});
					}
				}

				console.log(`[PingOne Resume] Extracted from Location header:`, {
					hasCode: !!code,
					code: code ? `${code.substring(0, 20)}...` : null,
					hasState: !!state,
					state: state ? `${state.substring(0, 20)}...` : null,
					location: locationHeader,
					locationLength: locationHeader?.length || 0,
					isErrorRedirect:
						locationHeader?.includes('error') || locationHeader?.includes('Error') || false,
				});

				// If Location header contains error, extract error details from URL
				if (
					locationHeader &&
					(locationHeader.includes('/error') ||
						locationHeader.includes('error=') ||
						locationHeader.includes('/signon/?error'))
				) {
					console.error(
						`[PingOne Resume] Location header appears to be an error redirect:`,
						locationHeader
					);

					// Try to extract error details from the URL
					let errorDetails = null;
					try {
						const errorUrl = new URL(locationHeader);
						const errorParam = errorUrl.searchParams.get('error');
						if (errorParam) {
							try {
								errorDetails = JSON.parse(decodeURIComponent(errorParam));
							} catch {
								// If not JSON, treat as string
								errorDetails = { message: decodeURIComponent(errorParam) };
							}
						}
					} catch (urlError) {
						console.error(`[PingOne Resume] Failed to parse error URL:`, urlError);
					}

					// Extract readable error message
					const errorCode = errorDetails?.code || errorDetails?.error || 'UNKNOWN_ERROR';
					const errorMessage =
						errorDetails?.message || errorDetails?.error_description || 'PingOne returned an error';

					console.error(`[PingOne Resume] PingOne error details:`, {
						errorCode: errorCode,
						errorMessage: errorMessage,
						errorDetails: errorDetails,
					});

					return res.status(500).json({
						error: 'resume_error',
						error_code: errorCode,
						error_description: `${errorCode}: ${errorMessage}`,
						pingone_error: errorDetails,
						redirect: true,
						location: locationHeader,
						code: null,
						state: null,
					});
				}

				return res.json({
					code: code,
					state: state,
					redirect: true,
					location: locationHeader,
				});
			}
		}

		// For pi.flow, PingOne returns JSON directly
		// But check content type first - might be HTML error page
		const contentType = resumeResponse.headers.get('content-type') || '';
		const isJSON = contentType.includes('application/json') || contentType.includes('text/json');
		const isHTML = contentType.includes('text/html') || contentType.includes('text/plain');

		let responseData;
		try {
			const text = await resumeResponse.text();

			if ((isHTML && text.includes('<!DOCTYPE')) || text.includes('<html')) {
				console.error(`[PingOne Resume] Response is HTML instead of JSON - likely an error page`);
				console.error(`[PingOne Resume] HTML preview:`, text.substring(0, 500));
				return res.status(500).json({
					error: 'html_response',
					error_description:
						'PingOne returned HTML instead of JSON. This usually indicates an error or misconfiguration.',
					contentType: contentType,
					htmlPreview: text.substring(0, 500),
				});
			}

			if (
				!isJSON &&
				text.trim().length > 0 &&
				!text.trim().startsWith('{') &&
				!text.trim().startsWith('[')
			) {
				console.warn(`[PingOne Resume] Response may not be JSON. Content-Type: ${contentType}`);
				console.warn(`[PingOne Resume] Response preview:`, text.substring(0, 200));
			}

			responseData = text ? JSON.parse(text) : {};
			console.log(`[PingOne Resume] Successfully parsed response as JSON`);
		} catch (parseError) {
			console.error(`[PingOne Resume] Failed to parse response:`, parseError);
			console.error(`[PingOne Resume] Content-Type:`, contentType);
			// Note: text() can only be called once, so we can't get it here if we already called it above
			// But the text variable should still be available from the try block
			return res.status(500).json({
				error: 'parse_error',
				error_description: 'Failed to parse PingOne response as JSON',
				contentType: contentType,
				parseError: parseError.message,
			});
		}

		if (!resumeResponse.ok) {
			console.error(`[PingOne Resume] PingOne API Error:`, {
				status: resumeResponse.status,
				statusText: resumeResponse.statusText,
				responseData: responseData,
				finalResumeUrl: finalResumeUrl,
			});
			return res.status(resumeResponse.status).json({
				error: 'resume_failed',
				error_description:
					responseData.message || responseData.error || 'Failed to resume authentication flow',
				details: responseData,
			});
		}

		// Log ALL response keys and values first to see what we're working with
		console.log(`[PingOne Resume] Response analysis (200 OK):`, {
			status: resumeResponse.status,
			statusText: resumeResponse.statusText,
			contentType: resumeResponse.headers.get('content-type'),
			responseKeys: Object.keys(responseData),
			responseKeyCount: Object.keys(responseData).length,
			responseIsEmpty: Object.keys(responseData).length === 0,
			responseIsObject: typeof responseData === 'object',
			responseType: typeof responseData,
			hasCode: !!responseData.code,
			codeValue: responseData.code,
			hasRedirect: !!(responseData.redirect || responseData.location),
			hasAccessToken: !!responseData.access_token,
			hasIdToken: !!responseData.id_token,
			hasUserId: !!responseData.userId,
			// Check ALL keys for common patterns
			allStringValues: Object.entries(responseData)
				.filter(([k, v]) => typeof v === 'string' && v.length > 0)
				.map(([k, v]) => `${k}:${v.substring(0, 30)}...`)
				.slice(0, 10),
		});

		// Log the full response data for debugging - THIS IS CRITICAL TO SEE WHAT PINGONE ACTUALLY RETURNS
		console.log(
			`[PingOne Resume] Full response data (JSON):`,
			JSON.stringify(responseData, null, 2)
		);

		// CRITICAL: If response is empty or only has metadata, this is suspicious
		if (Object.keys(responseData).length === 0) {
			console.error(`[PingOne Resume] ❌ CRITICAL: Response is completely empty!`);
			console.error(
				`[PingOne Resume] This suggests PingOne didn't return any data. Possible causes:`
			);
			console.error(`  - Missing ST cookie (Session Token cookie from Step 2)`);
			console.error(`  - Invalid flowId or state parameter`);
			console.error(`  - PingOne application not configured for pi.flow mode`);
			console.error(`  - Resume URL parameters incorrect`);
		} else if (!responseData.code && Object.keys(responseData).length > 0) {
			console.warn(
				`[PingOne Resume] ⚠️  Response has ${Object.keys(responseData).length} keys but no 'code' field`
			);
			console.warn(`[PingOne Resume] Available keys:`, Object.keys(responseData).join(', '));
			console.warn(
				`[PingOne Resume] All key-value pairs:`,
				Object.entries(responseData)
					.map(([k, v]) => {
						if (typeof v === 'string') {
							return `${k}: "${v.substring(0, 50)}${v.length > 50 ? '...' : ''}"`;
						} else if (typeof v === 'object' && v !== null) {
							return `${k}: ${JSON.stringify(v).substring(0, 100)}${JSON.stringify(v).length > 100 ? '...' : ''}`;
						}
						return `${k}: ${v}`;
					})
					.join(', ')
			);
		}

		// Check if response has Location header even for 200 status (PingOne might do this)
		const locationHeader = resumeResponse.headers.get('Location');
		if (locationHeader && !responseData.code && !responseData.location) {
			console.log(
				`[PingOne Resume] Found Location header in 200 OK response (unusual):`,
				locationHeader
			);
			// Extract code from Location header
			try {
				const locationUrl = new URL(locationHeader);
				const codeFromLocation = locationUrl.searchParams.get('code');
				if (codeFromLocation) {
					console.log(
						`[PingOne Resume] Extracted code from Location header:`,
						`${codeFromLocation.substring(0, 20)}...`
					);
					responseData.code = codeFromLocation;
					responseData.location = locationHeader;
					responseData.redirect = true;
				}
			} catch (urlError) {
				console.warn(`[PingOne Resume] Could not parse Location header URL:`, urlError);
			}
		}

		// If we still don't have a code, check if it's nested somewhere or in different field names
		if (!responseData.code) {
			console.warn(`[PingOne Resume] WARNING: Response does not contain 'code' field`);
			console.warn(`[PingOne Resume] Response structure:`, Object.keys(responseData));
			console.warn(`[PingOne Resume] Response type:`, typeof responseData);
			console.warn(
				`[PingOne Resume] Response values preview:`,
				JSON.stringify(responseData, null, 2).substring(0, 1000)
			);

			// Check for alternative field names that might contain the code
			const possibleCodeFields = [
				'authorization_code',
				'authCode',
				'auth_code',
				'authorizationCode',
				'token',
				'access_code',
				'authorization',
			];

			for (const fieldName of possibleCodeFields) {
				if (responseData[fieldName] && typeof responseData[fieldName] === 'string') {
					console.log(
						`[PingOne Resume] Found code in alternative field '${fieldName}':`,
						`${responseData[fieldName].substring(0, 20)}...`
					);
					responseData.code = responseData[fieldName];
					break;
				}
			}

			// Check for nested code (e.g., in flow object, result object, data object)
			const nestedPaths = [
				['flow', 'code'],
				['result', 'code'],
				['data', 'code'],
				['response', 'code'],
				['body', 'code'],
				['payload', 'code'],
			];

			for (const [parent, child] of nestedPaths) {
				if (responseData[parent] && typeof responseData[parent] === 'object') {
					const nestedCode = responseData[parent][child];
					if (nestedCode && typeof nestedCode === 'string') {
						console.log(
							`[PingOne Resume] Found code nested in ${parent}.${child}:`,
							`${nestedCode.substring(0, 20)}...`
						);
						responseData.code = nestedCode;
						break;
					}
				}
			}

			// Check if the entire response is a redirect URL string
			if (typeof responseData === 'string' && responseData.includes('code=')) {
				console.log(`[PingOne Resume] Response appears to be a redirect URL string`);
				try {
					const urlObj = new URL(responseData);
					const codeFromString = urlObj.searchParams.get('code');
					if (codeFromString) {
						console.log(
							`[PingOne Resume] Extracted code from string response:`,
							`${codeFromString.substring(0, 20)}...`
						);
						responseData = { code: codeFromString, location: responseData, redirect: true };
					}
				} catch {
					// If not a valid URL, try regex
					const codeMatch = responseData.match(/[?&]code=([^&]+)/);
					if (codeMatch && codeMatch[1]) {
						const codeFromRegex = decodeURIComponent(codeMatch[1]);
						console.log(
							`[PingOne Resume] Extracted code from string using regex:`,
							`${codeFromRegex.substring(0, 20)}...`
						);
						responseData = { code: codeFromRegex, location: responseData, redirect: true };
					}
				}
			}

			// Check if response is an error (might indicate why code is missing)
			if (responseData.error || responseData.error_code || responseData.message) {
				console.error(`[PingOne Resume] ERROR detected in response:`, {
					error: responseData.error || responseData.error_code,
					error_description: responseData.error_description || responseData.message,
					details: responseData.details || responseData,
				});

				// If it's an error, make sure we're returning it properly so frontend can see it
				// Don't overwrite if code was already found
				if (!responseData.code) {
					console.error(
						`[PingOne Resume] Response contains error and no code - this is a failed request`
					);
				}
			}

			// Final check: if we STILL don't have a code after all extraction attempts
			if (!responseData.code) {
				console.error(
					`[PingOne Resume] ❌ FINAL CHECK: No authorization code found after all extraction attempts`
				);
				console.error(`[PingOne Resume] Response keys:`, Object.keys(responseData));
				console.error(`[PingOne Resume] Response values:`, JSON.stringify(responseData, null, 2));
				console.error(`[PingOne Resume] This may indicate:`);
				console.error(`  1. PingOne requires additional parameters in resume URL`);
				console.error(`  2. Session cookies (ST) are invalid or expired`);
				console.error(`  3. Flow ID or state mismatch`);
				console.error(`  4. PingOne application configuration issue`);
			}
		} else {
			console.log(
				`[PingOne Resume] ✅ Code found in response:`,
				`${responseData.code.substring(0, 20)}...`
			);
		}

		res.json(responseData);
	} catch (error) {
		console.error(`[PingOne Resume] Error:`, error);
		res.status(500).json({
			error: 'internal_server_error',
			error_description: 'Internal server error during resume URL call',
			details: error.message,
		});
	}
});

// ============================================================================
// OIDC Discovery Proxy Endpoint
// ============================================================================
// Proxies OIDC well-known configuration requests to avoid CORS issues
app.post('/api/pingone/oidc-discovery', async (req, res) => {
	try {
		const { issuerUrl } = req.body;

		if (!issuerUrl) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'issuerUrl is required',
			});
		}

		console.log('[OIDC Discovery] Fetching well-known configuration for:', issuerUrl);

		// Normalize issuer URL (remove trailing slashes)
		let normalized = issuerUrl.trim();
		while (normalized.endsWith('/')) {
			normalized = normalized.slice(0, -1);
		}

		// Remove .well-known/openid-configuration if present
		if (normalized.endsWith('/.well-known/openid-configuration')) {
			normalized = normalized.replace('/.well-known/openid-configuration', '');
		}

		const wellKnownUrl = `${normalized}/.well-known/openid-configuration`;

		console.log('[OIDC Discovery] Requesting:', wellKnownUrl);

		const response = await fetch(wellKnownUrl, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
			},
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('[OIDC Discovery] Failed:', response.status, response.statusText);
			return res.status(response.status).json({
				error: 'discovery_failed',
				message: `HTTP ${response.status}: ${response.statusText}`,
				details: errorText,
			});
		}

		const data = await response.json();

		console.log('[OIDC Discovery] Success:', {
			issuer: data.issuer,
			hasAuthEndpoint: !!data.authorization_endpoint,
			hasTokenEndpoint: !!data.token_endpoint,
			hasUserInfoEndpoint: !!data.userinfo_endpoint,
		});

		res.json(data);
	} catch (error) {
		console.error('[OIDC Discovery] Error:', error);
		res.status(500).json({
			error: 'server_error',
			message: error.message || 'Internal server error',
		});
	}
});

// ============================================================================
// UserInfo Proxy Endpoint
// ============================================================================
// Proxies UserInfo requests to avoid CORS issues
app.post('/api/pingone/userinfo', async (req, res) => {
	try {
		const { userInfoEndpoint, accessToken } = req.body;

		if (!userInfoEndpoint || !accessToken) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'userInfoEndpoint and accessToken are required',
			});
		}

		console.log('[UserInfo] Fetching user information from:', userInfoEndpoint);
		console.log('[UserInfo] Token preview:', `${accessToken.substring(0, 20)}...`);

		const response = await fetch(userInfoEndpoint, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: 'application/json',
			},
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('[UserInfo] Failed:', response.status, response.statusText);

			let errorBody;
			try {
				errorBody = JSON.parse(errorText);
			} catch {
				errorBody = { error: errorText };
			}

			return res.status(response.status).json({
				error: 'userinfo_failed',
				message:
					errorBody.error ||
					errorBody.error_description ||
					`HTTP ${response.status}: ${response.statusText}`,
				details: errorBody,
			});
		}

		const userInfo = await response.json();

		console.log('[UserInfo] Success:', {
			hasSub: !!userInfo.sub,
			hasEmail: !!userInfo.email,
			hasName: !!userInfo.name,
		});

		res.json(userInfo);
	} catch (error) {
		console.error('[UserInfo] Error:', error);
		res.status(500).json({
			error: 'server_error',
			message: error.message || 'Internal server error',
		});
	}
});

// PingOne Flow Username/Password Check Endpoint
// NOTE: This endpoint proxies credentials directly to PingOne's Flow API over HTTPS.
// Credentials are NOT stored or used by our backend - they go ONLY to PingOne.
// The backend proxy is used only to avoid CORS issues from the frontend.
// Helper function to sanitize sensitive data from request body for logging
const sanitizeRequestBody = (body) => {
	const sanitized = { ...body };
	// Redact sensitive fields
	if (sanitized.password) sanitized.password = '***REDACTED***';
	if (sanitized.clientSecret) sanitized.clientSecret = '***REDACTED***';
	if (sanitized.client_secret) sanitized.client_secret = '***REDACTED***';
	if (sanitized.access_token) sanitized.access_token = '***REDACTED***';
	if (sanitized.refresh_token) sanitized.refresh_token = '***REDACTED***';
	if (sanitized.id_token) sanitized.id_token = '***REDACTED***';
	if (sanitized.code) sanitized.code = '***REDACTED***';
	// Redact username but show partial
	if (sanitized.username) {
		sanitized.username =
			sanitized.username.length > 3
				? `${sanitized.username.substring(0, 3)}... (${sanitized.username.length} chars)`
				: '***REDACTED***';
	}
	return sanitized;
};

app.post('/api/pingone/flows/check-username-password', async (req, res) => {
	try {
		// SECURITY: Sanitize sensitive data before logging
		console.log(
			`[PingOne Flow Check] Received request body:`,
			JSON.stringify(sanitizeRequestBody(req.body), null, 2)
		);

		const { flowUrl, username, password, cookies, sessionId } = req.body;

		if (!flowUrl) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing flowUrl parameter',
			});
		}

		if (!username || !password) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing username or password',
			});
		}

		// Extract client credentials (may be needed if no session cookies)
		const { clientId, clientSecret } = req.body;

		console.log(`[PingOne Flow Check] Calling flow URL:`, flowUrl);
		console.log(
			`[PingOne Flow Check] Username (length):`,
			username ? `${username.substring(0, 3)}... (${username.length} chars)` : 'none'
		);
		console.log(
			`[PingOne Flow Check] Password (length):`,
			password ? `*** (${password.length} chars)` : 'none'
		);
		const storedCookies = sessionId ? cookieJar.get(sessionId) || [] : [];
		console.log(`[PingOne Flow Check] Using stored cookies:`, storedCookies.length);
		console.log(`[PingOne Flow Check] Has client credentials:`, !!(clientId && clientSecret));

		// POST to PingOne's Flow API with username/password
		// Per documentation: POST /flows/{flowId} with action: "usernamePassword.check"
		// CRITICAL: Credentials go DIRECTLY to PingOne (over HTTPS) - not stored or used by our backend
		// Per documentation, this should be JSON:
		// {
		//   "action": "usernamePassword.check",
		//   "username": "...",
		//   "password": "..."
		// }
		// IMPORTANT: Do NOT trim or modify username/password - send exactly as received
		const checkBody = JSON.stringify({
			action: 'usernamePassword.check',
			username: username, // Send as-is, no trimming
			password: password, // Send as-is, no trimming
		});

		console.log(`[PingOne Flow Check] Request body (credentials redacted):`, {
			action: 'usernamePassword.check',
			username: username ? `${username.substring(0, 3)}... (${username.length} chars)` : 'none',
			password: `*** (${password ? password.length : 0} chars)`,
			bodyLength: checkBody.length,
		});

		const headers = {
			Accept: 'application/json',
			'Content-Type': 'application/vnd.pingidentity.usernamePassword.check+json',
			'User-Agent': 'OAuth-Playground/1.0',
		};

		// CRITICAL: Cookies/session from the initial /as/authorize call MUST be sent
		// Flow API is stateful per flowId/session - cookies maintain the session state
		// Per PingOne docs: credentials: 'include' in fetch, or manually forward Set-Cookie headers
		if (storedCookies && Array.isArray(storedCookies) && storedCookies.length > 0) {
			// Convert Set-Cookie headers to Cookie header
			// Extract just the name=value part (before first semicolon)
			const cookieString = storedCookies
				.map((cookie) => {
					// Handle both full Set-Cookie format and simple name=value format
					const nameValue = cookie.split(';')[0].trim();
					return nameValue;
				})
				.filter((c) => c) // Remove empty strings
				.join('; ');
			headers['Cookie'] = cookieString;
			console.log(
				`[PingOne Flow Check] ✅ Including ${storedCookies.length} cookies in request (REQUIRED for stateful flow)`
			);
			console.log(
				`[PingOne Flow Check] Cookie header preview:`,
				`${cookieString.substring(0, 100)}...`
			);
		} else {
			console.warn(
				`[PingOne Flow Check] ⚠️  NO COOKIES PROVIDED! PingOne Flow API requires cookies from Step 1's /as/authorize response.`
			);
			console.warn(
				`[PingOne Flow Check] The flowId in URL is not sufficient - cookies maintain session state for stateful flows.`
			);
		}

		console.log(`[PingOne Flow Check] Making request to PingOne Flow API...`);
		const checkResponse = await fetch(flowUrl, {
			method: 'POST',
			headers: headers,
			body: checkBody,
		});

		console.log(
			`[PingOne Flow Check] Response status:`,
			checkResponse.status,
			checkResponse.statusText
		);

		// Capture Set-Cookie headers from PingOne response (cookies may be updated after authentication)
		// CRITICAL: The Step 2 response should include the ST (Session Token) cookie in Set-Cookie headers
		// This ST cookie MUST be sent to the resume endpoint in Step 3
		const setCookieHeaders = checkResponse.headers.raw()['set-cookie'] || [];
		console.log(`[PingOne Flow Check] Response headers:`, {
			contentType: checkResponse.headers.get('content-type'),
			setCookieCount: setCookieHeaders.length,
		});

		const responseData = await checkResponse.json();

		// Capture updated cookies and store in cookie jar for this session
		let updatedCookies = [];

		// Check for interactionId/interactionToken in JSON (PingOne may return these instead of Set-Cookie)
		const interactionId = responseData.interactionId;
		const interactionToken = responseData.interactionToken;
		if (interactionId && interactionToken) {
			updatedCookies.push(`interactionId=${interactionId}`, `interactionToken=${interactionToken}`);
			console.log(`[PingOne Flow Check] ✅ Found interactionId/interactionToken in JSON response`);
		}

		// CRITICAL: Capture Set-Cookie headers - these should include the ST cookie
		if (setCookieHeaders.length > 0) {
			const cookieStrings = setCookieHeaders.map((cookie) => cookie.split(';')[0]); // Extract name=value only
			updatedCookies = [...updatedCookies, ...cookieStrings];

			// Log cookie names to identify ST cookie
			const cookieNames = cookieStrings.map((c) => {
				const [name] = c.split('=');
				return name;
			});
			const hasSTCookie = cookieNames.some(
				(name) => name === 'ST' || name.toLowerCase() === 'st' || name.includes('ST')
			);

			console.log(
				`[PingOne Flow Check] ✅ Captured ${cookieStrings.length} cookies from Set-Cookie headers`
			);
			console.log(`[PingOne Flow Check] Cookie names:`, cookieNames.join(', '));
			console.log(
				`[PingOne Flow Check] ${hasSTCookie ? '✅ FOUND ST cookie in response' : '⚠️  ST cookie NOT found in response'} - ${hasSTCookie ? 'Will be forwarded to resume endpoint' : 'This may cause "Session token cookie value does not match" error'}`
			);
		} else {
			console.warn(`[PingOne Flow Check] ⚠️  NO Set-Cookie headers in Step 2 response!`);
			console.warn(
				`[PingOne Flow Check] This means no ST cookie was returned. Resume endpoint will likely fail.`
			);
		}

		// Merge and persist cookies server-side (create session if missing)
		const sid = sessionId || randomUUID();
		const prior = cookieJar.get(sid) || [];
		const merged = mergeCookieArrays(prior, updatedCookies);
		cookieJar.set(sid, merged);
		responseData._sessionId = sid;

		console.log(`[PingOne Flow Check] Response data:`, {
			status: responseData.status,
			hasId: !!responseData.id,
			hasResumeUrl: !!responseData.resumeUrl,
			hasError: !!responseData.error,
			errorCode: responseData.code || responseData.error,
			message: responseData.message || responseData.error_description,
			hasUpdatedCookies: updatedCookies.length > 0,
		});

		if (!checkResponse.ok) {
			console.error(`[PingOne Flow Check] PingOne API Error:`, {
				status: checkResponse.status,
				statusText: checkResponse.statusText,
				responseData: responseData,
			});
			return res.status(checkResponse.status).json({
				error: 'check_failed',
				error_description:
					responseData.message || responseData.error || 'Failed to check username/password',
				details: responseData,
			});
		}

		console.log(`[PingOne Flow Check] Success:`, {
			status: responseData.status,
			hasResumeUrl: !!responseData.resumeUrl,
			hasUpdatedCookies: updatedCookies.length > 0,
		});

		res.json(responseData);
	} catch (error) {
		console.error(`[PingOne Flow Check] Error:`, error);
		res.status(500).json({
			error: 'internal_server_error',
			error_description: 'Internal server error during username/password check',
			details: error.message,
		});
	}
});

// CIBA Backchannel Authentication Endpoint (RFC 9436)
app.post('/api/ciba-backchannel', async (req, res) => {
	try {
		const {
			environment_id,
			client_id,
			client_secret,
			scope,
			login_hint,
			binding_message,
			requested_context,
			auth_method = 'client_secret_post',
		} = req.body;

		console.log(`[CIBA Backchannel] Received request:`, {
			hasEnvironmentId: !!environment_id,
			hasClientId: !!client_id,
			hasClientSecret: !!client_secret,
			hasScope: !!scope,
			hasLoginHint: !!login_hint,
			hasBindingMessage: !!binding_message,
			hasRequestedContext: !!requested_context,
			authMethod: auth_method,
		});

		if (!environment_id || !client_id || !scope || !login_hint) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description:
					'Missing required parameters: environment_id, client_id, scope, login_hint',
			});
		}

		// Validate client_secret is provided (required for authentication)
		if (!client_secret) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description:
					'Missing required parameter: client_secret. Client secret is required for CIBA backchannel authentication.',
			});
		}

		const backchannelEndpoint = `https://auth.pingone.com/${environment_id}/as/bc-authorize`;

		// Build form data for backchannel request
		const formData = new URLSearchParams();
		formData.append('client_id', client_id);
		formData.append('scope', scope);
		formData.append('login_hint', login_hint);
		if (binding_message) formData.append('binding_message', binding_message);
		if (requested_context) {
			// requested_context should be JSON string if provided as object
			const contextValue =
				typeof requested_context === 'string'
					? requested_context
					: JSON.stringify(requested_context);
			formData.append('requested_context', contextValue);
		}

		// Prepare headers with client authentication
		const headers = {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json',
		};

		// Handle client authentication based on auth_method
		// CIBA requires client authentication, so we must have client_secret
		if (auth_method === 'client_secret_basic') {
			const credentials = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
			headers.Authorization = `Basic ${credentials}`;
			console.log(
				`[CIBA Backchannel] Using Basic authentication (credentials length: ${credentials.length})`
			);
		} else {
			// Default to client_secret_post if not specified or method is post
			formData.append('client_secret', client_secret);
			console.log(`[CIBA Backchannel] Using client_secret_post authentication`);
		}

		console.log(`[CIBA Backchannel] Calling PingOne endpoint: ${backchannelEndpoint}`);
		console.log(`[CIBA Backchannel] Request body:`, {
			client_id: formData.get('client_id'),
			scope: formData.get('scope'),
			login_hint: formData.get('login_hint'),
			hasBindingMessage: !!formData.get('binding_message'),
			hasRequestedContext: !!formData.get('requested_context'),
			hasClientSecret: !!formData.get('client_secret'),
		});

		const response = await global.fetch(backchannelEndpoint, {
			method: 'POST',
			headers,
			body: formData,
		});

		let data;
		try {
			const text = await response.text();
			try {
				data = JSON.parse(text);
			} catch (parseError) {
				// Response is not JSON - might be HTML error page or plain text
				console.error(
					`[CIBA Backchannel] Non-JSON response from PingOne (${response.status}):`,
					text.substring(0, 500)
				);
				data = {
					error: 'invalid_response',
					error_description: `PingOne returned non-JSON response (${response.status}): ${text.substring(0, 200)}`,
					raw_response: text.substring(0, 500),
				};
			}
		} catch (err) {
			console.error(`[CIBA Backchannel] Failed to read response:`, err);
			data = {
				error: 'network_error',
				error_description: `Failed to read response from PingOne: ${err.message}`,
			};
		}

		if (!response.ok) {
			console.error(`[CIBA Backchannel] PingOne error (${response.status}):`, {
				status: response.status,
				statusText: response.statusText,
				headers: Object.fromEntries(response.headers.entries()),
				data: data,
			});
			return res.status(response.status).json(data);
		}

		console.log(
			`[CIBA Backchannel] Success - auth_req_id: ${data.auth_req_id?.substring(0, 20)}...`
		);

		// Add server metadata
		data.server_timestamp = new Date().toISOString();

		res.json(data);
	} catch (error) {
		console.error('[CIBA Backchannel] Server error:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error during CIBA backchannel authentication',
			details: error.message,
		});
	}
});

// CIBA Token Endpoint (RFC 9436) - Polling for tokens
app.post('/api/ciba-token', async (req, res) => {
	try {
		const {
			environment_id,
			client_id,
			client_secret,
			auth_req_id,
			auth_method = 'client_secret_post',
		} = req.body;

		console.log(`[CIBA Token] Received polling request:`, {
			hasEnvironmentId: !!environment_id,
			hasClientId: !!client_id,
			hasClientSecret: !!client_secret,
			hasAuthReqId: !!auth_req_id,
			authMethod: auth_method,
			authReqIdPreview: auth_req_id ? `${auth_req_id.substring(0, 20)}...` : 'none',
		});

		if (!environment_id || !client_id || !auth_req_id) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameters: environment_id, client_id, auth_req_id',
			});
		}

		const tokenEndpoint = `https://auth.pingone.com/${environment_id}/as/token`;

		// Build form data for token request (RFC 9436)
		const formData = new URLSearchParams();
		formData.append('grant_type', 'urn:openid:params:grant-type:ciba');
		formData.append('client_id', client_id);
		formData.append('auth_req_id', auth_req_id);

		// Prepare headers with client authentication
		const headers = {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json',
		};

		// Handle client authentication based on auth_method
		if (auth_method === 'client_secret_basic' && client_secret) {
			const credentials = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
			headers.Authorization = `Basic ${credentials}`;
		} else if (auth_method === 'client_secret_post' && client_secret) {
			formData.append('client_secret', client_secret);
		}

		console.log(`[CIBA Token] Calling PingOne token endpoint: ${tokenEndpoint}`);
		console.log(`[CIBA Token] Grant type: urn:openid:params:grant-type:ciba`);
		console.log(`[CIBA Token] Auth req ID: ${auth_req_id.substring(0, 20)}...`);

		const response = await global.fetch(tokenEndpoint, {
			method: 'POST',
			headers,
			body: formData,
		});

		const data = await response.json();

		// CIBA-specific error handling (RFC 9436)
		if (!response.ok) {
			const errorCode = data.error;

			// Handle CIBA-specific errors
			if (response.status === 400 || response.status === 401) {
				if (errorCode === 'authorization_pending') {
					console.log(`[CIBA Token] Authorization pending - continue polling`);
					// Return the interval if provided
					return res.status(400).json({
						error: 'authorization_pending',
						error_description:
							data.error_description || 'The authorization request is still pending',
						interval: data.interval || 2, // Default interval if not provided
					});
				}

				if (errorCode === 'slow_down') {
					console.log(`[CIBA Token] Slow down - increase polling interval`);
					return res.status(400).json({
						error: 'slow_down',
						error_description: data.error_description || 'Polling too frequently, please slow down',
						interval: data.interval || 5, // Recommended slower interval
					});
				}

				if (errorCode === 'expired_token') {
					console.log(`[CIBA Token] Request expired`);
					return res.status(400).json({
						error: 'expired_token',
						error_description: data.error_description || 'The authorization request has expired',
					});
				}

				if (errorCode === 'access_denied') {
					console.log(`[CIBA Token] Access denied by user`);
					return res.status(400).json({
						error: 'access_denied',
						error_description:
							data.error_description || 'The user denied the authentication request',
					});
				}
			}

			// For other errors, return as-is
			console.error(`[CIBA Token] PingOne error (${response.status}):`, data);
			return res.status(response.status).json(data);
		}

		console.log(`[CIBA Token] Success - tokens issued`);
		console.log(`[CIBA Token] Token preview:`, {
			hasAccessToken: !!data.access_token,
			hasIdToken: !!data.id_token,
			hasRefreshToken: !!data.refresh_token,
		});

		// Add server metadata
		data.server_timestamp = new Date().toISOString();
		data.grant_type = 'urn:openid:params:grant-type:ciba';

		res.json(data);
	} catch (error) {
		console.error('[CIBA Token] Server error:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error during CIBA token polling',
			details: error.message,
		});
	}
});

// User-Configured JWKS Endpoint (serves user's public key for private_key_jwt)
app.post('/api/user-jwks', async (req, res) => {
	try {
		const { privateKey, keyId = 'oauth-playground-user-key' } = req.body;

		if (!privateKey) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing private key - cannot generate JWKS',
			});
		}

		console.log(`[UserJWKS] Generating JWKS from user's private key`);

		// Import jose library to extract public key from private key
		const jose = await import('jose');

		try {
			// Import the private key
			const privateKeyObj = await jose.importPKCS8(privateKey, 'RS256');

			// Export as JWK to get the public key components
			const jwk = await jose.exportJWK(privateKeyObj);

			// Build JWKS response with public key components
			const jwks = {
				keys: [
					{
						kty: 'RSA',
						kid: keyId,
						use: 'sig',
						alg: 'RS256',
						n: jwk.n, // Modulus (public key component)
						e: jwk.e, // Exponent (public key component)
					},
				],
			};

			console.log(`[UserJWKS] JWKS generated successfully with kid: ${keyId}`);
			res.json(jwks);
		} catch (error) {
			console.error('[UserJWKS] Failed to parse private key:', error);
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Invalid private key format - must be PKCS8 PEM format',
			});
		}
	} catch (error) {
		console.error('[UserJWKS] Server error:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error generating JWKS',
		});
	}
});

// User's Public JWKS Endpoint - Static public key for private_key_jwt
// This endpoint serves the public key that corresponds to the private key configured in the UI
app.get('/.well-known/jwks.json', async (_req, res) => {
	try {
		console.log(`[UserJWKS] Serving user's configured public JWKS`);

		// Set proper headers for JWKS
		res.set({
			'Content-Type': 'application/json',
			'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
			'Access-Control-Allow-Origin': '*', // Allow PingOne to fetch
		});

		// For now, return an empty JWKS - users need to configure via UI
		// This will be updated when we implement JWKS management
		const jwks = {
			keys: [
				// Keys will be added here when user configures private_key_jwt
				// For now, include a placeholder message
			],
		};

		console.log(`[UserJWKS] Serving JWKS with ${jwks.keys.length} keys`);
		console.log(
			`[UserJWKS] Note: To use private_key_jwt, configure your private key in the UI first`
		);

		res.json(jwks);
	} catch (error) {
		console.error('[UserJWKS] Server error:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error serving JWKS',
		});
	}
});

// OAuth Playground JWKS Endpoint (serves our generated keys)
app.get('/jwks', async (_req, res) => {
	try {
		console.log(`[OAuthPlaygroundJWKS] Serving our generated public keys`);

		// Set proper headers for JWKS
		res.set({
			'Content-Type': 'application/json',
			'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET',
			'Access-Control-Allow-Headers': 'Content-Type',
		});

		// For now, generate a valid-looking RSA modulus for demonstration
		// In a real implementation, this would extract actual RSA components from stored public keys
		const generateValidRSAComponents = () => {
			// Generate a valid-looking 2048-bit RSA modulus (base64url-encoded without padding)
			const bytes = new Uint8Array(256); // 256 bytes = 2048 bits
			for (let i = 0; i < bytes.length; i++) {
				bytes[i] = Math.floor(Math.random() * 256);
			}
			// Ensure first bit is set (for valid RSA modulus)
			bytes[0] |= 0x80;

			// Convert to base64url without padding
			const base64 = Buffer.from(bytes).toString('base64');
			const modulus = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

			return {
				n: modulus,
				e: 'AQAB', // Standard RSA exponent (65537)
			};
		};

		const components = generateValidRSAComponents();

		const jwks = {
			keys: [
				{
					kty: 'RSA',
					kid: 'oauth-playground-default',
					use: 'sig',
					alg: 'RS256',
					n: components.n,
					e: components.e,
				},
			],
		};

		console.log(`[OAuthPlaygroundJWKS] Serving JWKS with ${jwks.keys.length} keys`);
		res.json(jwks);
	} catch (error) {
		console.error('[OAuthPlaygroundJWKS] Server error:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error serving JWKS',
		});
	}
});

// Alternative JWKS endpoint at /api/playground-jwks
app.get('/api/playground-jwks', async (_req, res) => {
	try {
		console.log(`[PlaygroundJWKS] Serving our generated public keys via API endpoint`);

		// Set proper headers for JWKS
		res.set({
			'Content-Type': 'application/json',
			'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET',
			'Access-Control-Allow-Headers': 'Content-Type',
		});

		// Generate a valid-looking RSA modulus for demonstration
		const generateValidRSAComponents = () => {
			const bytes = new Uint8Array(256); // 256 bytes = 2048 bits
			for (let i = 0; i < bytes.length; i++) {
				bytes[i] = Math.floor(Math.random() * 256);
			}
			bytes[0] |= 0x80; // Ensure first bit is set

			const base64 = Buffer.from(bytes).toString('base64');
			const modulus = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

			return {
				n: modulus,
				e: 'AQAB',
			};
		};

		const components = generateValidRSAComponents();

		const jwks = {
			keys: [
				{
					kty: 'RSA',
					kid: 'oauth-playground-default',
					use: 'sig',
					alg: 'RS256',
					n: components.n,
					e: components.e,
				},
			],
		};

		console.log(`[PlaygroundJWKS] Serving JWKS with ${jwks.keys.length} keys`);
		res.json(jwks);
	} catch (error) {
		console.error('[PlaygroundJWKS] Server error:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error serving JWKS',
		});
	}
});

// OAuth Authorization Server Metadata Endpoint (proxy to PingOne)
app.get('/api/oauth-metadata', async (req, res) => {
	try {
		const { environment_id, region = 'us' } = req.query;

		console.log('[OAuth Metadata] Request received:', {
			environment_id,
			region,
			query: req.query,
		});

		if (!environment_id) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameter: environment_id',
			});
		}

		// Determine the base URL based on region
		const regionMap = {
			us: 'https://auth.pingone.com',
			na: 'https://auth.pingone.com', // North America -> US
			eu: 'https://auth.pingone.eu',
			ca: 'https://auth.pingone.ca',
			ap: 'https://auth.pingone.asia',
			asia: 'https://auth.pingone.asia',
		};

		const baseUrl = regionMap[region.toLowerCase()] || regionMap['us'];
		const oauthMetadataUrl = `${baseUrl}/${environment_id}/.well-known/oauth-authorization-server`;

		console.log(`[OAuth Metadata] Fetching OAuth metadata from: ${oauthMetadataUrl}`);

		console.log('[OAuth Metadata] Fetching from PingOne...');

		const response = await global.fetch(oauthMetadataUrl, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				'User-Agent': 'PingOne-OAuth-Playground/1.0',
			},
			timeout: 10000, // 10 second timeout
		});

		console.log(`[OAuth Metadata] PingOne response: ${response.status} ${response.statusText}`);

		if (!response.ok) {
			console.error(`[OAuth Metadata] PingOne error: ${response.status} ${response.statusText}`);
			const errorBody = await response.text().catch(() => 'Unable to read error');
			console.error('[OAuth Metadata] Error body:', errorBody);

			// Return a fallback configuration based on known PingOne OAuth patterns
			const fallbackConfig = {
				issuer: `https://auth.pingone.com/${environment_id}`,
				authorization_endpoint: `https://auth.pingone.com/${environment_id}/as/authorize`,
				token_endpoint: `https://auth.pingone.com/${environment_id}/as/token`,
				jwks_uri: `https://auth.pingone.com/${environment_id}/as/jwks`,
				response_types_supported: [
					'code',
					'token',
					'id_token',
					'code token',
					'code id_token',
					'token id_token',
					'code token id_token',
				],
				grant_types_supported: [
					'authorization_code',
					'implicit',
					'client_credentials',
					'refresh_token',
					'urn:ietf:params:oauth:grant-type:device_code',
				],
				subject_types_supported: ['public'],
				id_token_signing_alg_values_supported: ['RS256', 'RS384', 'RS512'],
				token_endpoint_auth_methods_supported: [
					'client_secret_basic',
					'client_secret_post',
					'private_key_jwt',
					'client_secret_jwt',
				],
				claims_supported: [
					'sub',
					'iss',
					'aud',
					'exp',
					'iat',
					'auth_time',
					'nonce',
					'acr',
					'amr',
					'azp',
					'at_hash',
					'c_hash',
				],
				code_challenge_methods_supported: ['S256', 'plain'],
				request_parameter_supported: true,
				request_uri_parameter_supported: true,
				require_request_uri_registration: false,
				end_session_endpoint: `https://auth.pingone.com/${environment_id}/as/signoff`,
				revocation_endpoint: `https://auth.pingone.com/${environment_id}/as/revoke`,
				introspection_endpoint: `https://auth.pingone.com/${environment_id}/as/introspect`,
				device_authorization_endpoint: `https://auth.pingone.com/${environment_id}/as/device`,
				pushed_authorization_request_endpoint: `https://auth.pingone.com/${environment_id}/as/par`,
			};

			console.log(
				`[OAuth Metadata] Using fallback OAuth metadata configuration for environment: ${environment_id}`
			);

			return res.json({
				success: true,
				configuration: fallbackConfig,
				environmentId: environment_id,
				server_timestamp: new Date().toISOString(),
				fallback: true,
			});
		}

		const configuration = await response.json();

		// Validate required fields for OAuth metadata
		if (
			!configuration.issuer ||
			!configuration.authorization_endpoint ||
			!configuration.token_endpoint
		) {
			throw new Error('Invalid OAuth metadata configuration: missing required fields');
		}

		console.log(`[OAuth Metadata] Success for environment: ${environment_id}`);

		res.json({
			success: true,
			configuration,
			environmentId: environment_id,
			server_timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error('[OAuth Metadata] Server error:', {
			message: error.message,
			stack: error.stack,
			error,
		});
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error during OAuth metadata discovery',
			details: error.message,
		});
	}
});

// OpenID Discovery Endpoint (proxy to PingOne)
app.get('/api/discovery', async (req, res) => {
	try {
		const { environment_id, region = 'us' } = req.query;

		console.log('[Discovery] Request received:', {
			environment_id,
			region,
			query: req.query,
		});

		if (!environment_id) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameter: environment_id',
			});
		}

		// Determine the base URL based on region
		const regionMap = {
			us: 'https://auth.pingone.com',
			na: 'https://auth.pingone.com', // North America -> US
			eu: 'https://auth.pingone.eu',
			ca: 'https://auth.pingone.ca',
			ap: 'https://auth.pingone.asia',
			asia: 'https://auth.pingone.asia',
		};

		const baseUrl = regionMap[region.toLowerCase()] || regionMap['us'];
		const discoveryUrl = `${baseUrl}/${environment_id}/.well-known/openid_configuration`;

		console.log(`[Discovery] Fetching configuration from: ${discoveryUrl}`);

		console.log('[Discovery] Fetching from PingOne...');

		const response = await global.fetch(discoveryUrl, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				'User-Agent': 'PingOne-OAuth-Playground/1.0',
			},
			timeout: 10000, // 10 second timeout
		});

		console.log(`[Discovery] PingOne response: ${response.status} ${response.statusText}`);

		if (!response.ok) {
			console.error(`[Discovery] PingOne error: ${response.status} ${response.statusText}`);
			const errorBody = await response.text().catch(() => 'Unable to read error');
			console.error('[Discovery] Error body:', errorBody);

			// Return a fallback configuration based on known PingOne patterns
			const fallbackConfig = {
				issuer: `https://auth.pingone.com/${environment_id}`,
				authorization_endpoint: `https://auth.pingone.com/${environment_id}/as/authorize`,
				token_endpoint: `https://auth.pingone.com/${environment_id}/as/token`,
				userinfo_endpoint: `https://auth.pingone.com/${environment_id}/as/userinfo`,
				jwks_uri: `https://auth.pingone.com/${environment_id}/as/jwks`,
				scopes_supported: ['openid', 'profile', 'email', 'address', 'phone'],
				response_types_supported: [
					'code',
					'id_token',
					'token',
					'id_token token',
					'code id_token',
					'code token',
					'code id_token token',
				],
				grant_types_supported: [
					'authorization_code',
					'implicit',
					'client_credentials',
					'refresh_token',
					'urn:ietf:params:oauth:grant-type:device_code',
				],
				subject_types_supported: ['public'],
				id_token_signing_alg_values_supported: ['RS256', 'RS384', 'RS512'],
				token_endpoint_auth_methods_supported: [
					'client_secret_basic',
					'client_secret_post',
					'private_key_jwt',
					'client_secret_jwt',
				],
				claims_supported: [
					'sub',
					'iss',
					'aud',
					'exp',
					'iat',
					'auth_time',
					'nonce',
					'acr',
					'amr',
					'azp',
					'at_hash',
					'c_hash',
				],
				code_challenge_methods_supported: ['S256', 'plain'],
				request_parameter_supported: true,
				request_uri_parameter_supported: true,
				require_request_uri_registration: false,
				end_session_endpoint: `https://auth.pingone.com/${environment_id}/as/signoff`,
				revocation_endpoint: `https://auth.pingone.com/${environment_id}/as/revoke`,
				introspection_endpoint: `https://auth.pingone.com/${environment_id}/as/introspect`,
				device_authorization_endpoint: `https://auth.pingone.com/${environment_id}/as/device`,
				pushed_authorization_request_endpoint: `https://auth.pingone.com/${environment_id}/as/par`,
			};

			console.log(`[Discovery] Using fallback configuration for environment: ${environment_id}`);

			return res.json({
				success: true,
				configuration: fallbackConfig,
				environmentId: environment_id,
				server_timestamp: new Date().toISOString(),
				fallback: true,
			});
		}

		const configuration = await response.json();

		// Validate required fields
		if (
			!configuration.issuer ||
			!configuration.authorization_endpoint ||
			!configuration.token_endpoint
		) {
			throw new Error('Invalid OpenID configuration: missing required fields');
		}

		console.log(`[Discovery] Success for environment: ${environment_id}`);

		res.json({
			success: true,
			configuration,
			environmentId: environment_id,
			server_timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error('[Discovery] Server error:', {
			message: error.message,
			stack: error.stack,
			error,
		});
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error during discovery',
			details: error.message,
		});
	}
});

// PingOne Management API proxy endpoints for Config Checker
app.get('/api/pingone/applications', async (req, res) => {
	console.log('[Config Checker] Handler called with query:', req.query);
	try {
		const { environmentId, clientId, clientSecret, region = 'na', workerToken } = req.query;

		if (!environmentId) {
			console.log('[Config Checker] Missing environmentId');
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameter: environmentId',
			});
		}

		let tokenToUse = workerToken;
		if (!tokenToUse) {
			// Get worker token using app credentials
			if (!clientId || !clientSecret) {
				console.log('[Config Checker] Missing clientId or clientSecret for token request');
				return res.status(400).json({
					error: 'invalid_request',
					error_description: 'Missing required parameters: clientId, clientSecret',
				});
			}

			console.log('[Config Checker] Getting worker token...');
			// Get worker token first
			const tokenEndpoint = `https://auth.pingone.com/${environmentId}/as/token`;
			const controller1 = new AbortController();
			const timeout1 = setTimeout(() => controller1.abort(), 10000); // 10s timeout
			const tokenResponse = await fetch(tokenEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					grant_type: 'client_credentials',
					client_id: clientId,
					client_secret: clientSecret,
					scope: 'p1:read:environments p1:read:applications p1:read:connections',
				}),
				signal: controller1.signal,
			});
			clearTimeout(timeout1);

			if (!tokenResponse.ok) {
				const errorText = await tokenResponse.text();
				console.error('[Config Checker] Token request failed:', errorText);
				return res.status(400).json({
					error: 'invalid_token_request',
					error_description: 'Failed to get worker token',
				});
			}

			const tokenData = await tokenResponse.json();
			tokenToUse = tokenData.access_token;
			console.log('[Config Checker] Worker token obtained');
		} else {
			console.log('[Config Checker] Using provided worker token');
		}

		// Determine the base URL based on region
		const regionMap = {
			us: 'https://api.pingone.com',
			na: 'https://api.pingone.com',
			eu: 'https://api.pingone.eu',
			ca: 'https://api.pingone.ca',
			ap: 'https://api.pingone.asia',
			asia: 'https://api.pingone.asia',
		};

		const baseUrl = regionMap[region.toLowerCase()] || regionMap['na'];
		const applicationsUrl = `${baseUrl}/v1/environments/${environmentId}/applications`;

		console.log(`[Config Checker] Fetching applications from: ${applicationsUrl}`);

		const controller2 = new AbortController();
		const timeout2 = setTimeout(() => controller2.abort(), 10000); // 10s timeout
		const response = await fetch(applicationsUrl, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${tokenToUse}`,
				'Content-Type': 'application/json',
			},
			signal: controller2.signal,
		});
		clearTimeout(timeout2);

		if (!response.ok) {
			const errorText = await response.text();
			console.error('[Config Checker] Applications request failed:', errorText);
			return res.status(response.status).json({
				error: 'api_request_failed',
				error_description: `Failed to fetch applications: ${response.status} ${response.statusText}`,
			});
		}

		const data = await response.json();
		console.log(
			`[Config Checker] Successfully fetched ${data._embedded?.applications?.length || 0} applications`
		);

		res.json(data);
	} catch (error) {
		if (error.name === 'AbortError') {
			console.error('[Config Checker] Request timed out');
			res.status(504).json({
				error: 'timeout',
				error_description: 'Request timed out',
			});
		} else {
			console.error('[Config Checker] Error fetching applications:', error);
			res.status(500).json({
				error: 'server_error',
				error_description: 'Internal server error while fetching applications',
			});
		}
	}
});

app.get('/api/pingone/applications/:appId/resources', async (req, res) => {
	try {
		const { appId } = req.params;
		const { environmentId, clientId, clientSecret, region = 'na', workerToken } = req.query;

		if (!environmentId || !appId) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameters: environmentId, appId',
			});
		}

		let tokenToUse = workerToken;
		if (!tokenToUse) {
			// Get worker token using app credentials
			if (!clientId || !clientSecret) {
				console.log('[Config Checker] Missing clientId or clientSecret for token request');
				return res.status(400).json({
					error: 'invalid_request',
					error_description: 'Missing required parameters: clientId, clientSecret',
				});
			}

			console.log('[Config Checker] Getting worker token...');
			// Get worker token first
			const tokenEndpoint = `https://auth.pingone.com/${environmentId}/as/token`;
			const controller1 = new AbortController();
			const timeout1 = setTimeout(() => controller1.abort(), 10000); // 10s timeout
			const tokenResponse = await fetch(tokenEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					grant_type: 'client_credentials',
					client_id: clientId,
					client_secret: clientSecret,
					scope: 'p1:read:environments p1:read:applications p1:read:connections',
				}),
				signal: controller1.signal,
			});
			clearTimeout(timeout1);

			if (!tokenResponse.ok) {
				const errorText = await tokenResponse.text();
				console.error('[Config Checker] Token request failed:', errorText);
				return res.status(400).json({
					error: 'invalid_token_request',
					error_description: 'Failed to get worker token',
				});
			}

			const tokenData = await tokenResponse.json();
			tokenToUse = tokenData.access_token;
			console.log('[Config Checker] Worker token obtained');
		} else {
			console.log('[Config Checker] Using provided worker token');
		}

		// Determine the base URL based on region
		const regionMap = {
			us: 'https://api.pingone.com',
			na: 'https://api.pingone.com',
			eu: 'https://api.pingone.eu',
			ca: 'https://api.pingone.ca',
			ap: 'https://api.pingone.asia',
			asia: 'https://api.pingone.asia',
		};

		const baseUrl = regionMap[region.toLowerCase()] || regionMap['na'];
		const resourcesUrl = `${baseUrl}/v1/environments/${environmentId}/applications/${appId}/resources`;

		console.log(`[Config Checker] Fetching resources from: ${resourcesUrl}`);

		const controller2 = new AbortController();
		const timeout2 = setTimeout(() => controller2.abort(), 10000); // 10s timeout
		const response = await fetch(resourcesUrl, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${tokenToUse}`,
				'Content-Type': 'application/json',
			},
			signal: controller2.signal,
		});
		clearTimeout(timeout2);

		if (!response.ok) {
			const errorText = await response.text();
			console.error('[Config Checker] Resources request failed:', errorText);
			return res.status(response.status).json({
				error: 'api_request_failed',
				error_description: `Failed to fetch resources: ${response.status} ${response.statusText}`,
			});
		}

		const data = await response.json();
		console.log(`[Config Checker] Successfully fetched resources for app ${appId}`);

		res.json(data);
	} catch (error) {
		if (error.name === 'AbortError') {
			console.error('[Config Checker] Request timed out');
			res.status(504).json({
				error: 'timeout',
				error_description: 'Request timed out',
			});
		} else {
			console.error('[Config Checker] Error fetching resources:', error);
			res.status(500).json({
				error: 'server_error',
				error_description: 'Internal server error while fetching resources',
			});
		}
	}
});

// PingOne Organization Licensing Endpoints
app.post('/api/pingone/organization-licensing', async (req, res) => {
	try {
		console.log('[PingOne Org Licensing] Request received');
		const { workerToken, organizationId } = req.body;

		if (!workerToken) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameter: workerToken',
			});
		}

		const baseUrl = 'https://api.pingone.com/v1';

		// Get organization details
		let organizationInfo;
		if (organizationId) {
			const orgResponse = await fetch(`${baseUrl}/organizations/${organizationId}`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${workerToken}`,
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
			});

			if (!orgResponse.ok) {
				const errorText = await orgResponse.text().catch(() => '');
				console.error('[PingOne Org Licensing] Failed to fetch organization:', errorText);
				return res.status(orgResponse.status).json({
					error: 'api_request_failed',
					error_description: `Failed to fetch organization: ${orgResponse.status} ${orgResponse.statusText}`,
					details: errorText,
				});
			}

			organizationInfo = await orgResponse.json();
		} else {
			// Get first organization if ID not provided
			const organizations = await fetch(`${baseUrl}/organizations?limit=1`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${workerToken}`,
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
			});

			if (!organizations.ok) {
				const errorText = await organizations.text().catch(() => '');
				console.error('[PingOne Org Licensing] Failed to fetch organizations:', errorText);
				return res.status(organizations.status).json({
					error: 'api_request_failed',
					error_description: `Failed to fetch organizations: ${organizations.status} ${organizations.statusText}`,
					details: errorText,
				});
			}

			const orgsData = await organizations.json();
			const orgsList = orgsData._embedded?.organizations || [];

			if (orgsList.length === 0) {
				return res.status(404).json({
					error: 'not_found',
					error_description: 'No organizations found',
				});
			}

			organizationInfo = orgsList[0];
		}

		if (!organizationInfo || !organizationInfo.id) {
			return res.status(500).json({
				error: 'invalid_data',
				error_description: 'Invalid organization data received',
			});
		}

		// Log organization info structure for debugging
		console.log('[PingOne Org Licensing] Organization info received:', {
			id: organizationInfo.id,
			name: organizationInfo.name,
			region: organizationInfo.region,
			hasRegion: 'region' in organizationInfo,
			keys: Object.keys(organizationInfo),
			fullResponse: JSON.stringify(organizationInfo, null, 2).substring(0, 500), // First 500 chars for debugging
		});

		// Try to extract region from worker token JWT (if not in organization response)
		let regionFromToken = null;
		try {
			if (workerToken && workerToken.includes('.')) {
				const parts = workerToken.split('.');
				if (parts.length >= 2) {
					// Decode base64url (PingOne uses base64url, not standard base64)
					const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
					const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'));

					console.log('[PingOne Org Licensing] Token payload claims:', {
						iss: payload.iss,
						env: payload.env,
						org: payload.org,
						aud: payload.aud,
					});

					// Extract region from issuer URL: https://auth.pingone.{region}/{envId}/as
					if (payload.iss && payload.iss.includes('auth.pingone.')) {
						const issMatch = payload.iss.match(/auth\.pingone\.([a-z0-9-]+)/);
						if (issMatch && issMatch[1]) {
							regionFromToken = issMatch[1];
							console.log(
								'[PingOne Org Licensing] Extracted region from token issuer:',
								regionFromToken
							);
						}
					}

					// Alternative: Check if env claim has region info (unlikely but possible)
					if (!regionFromToken && payload.env) {
						console.log('[PingOne Org Licensing] Found env claim in token:', payload.env);
					}
				}
			}
		} catch (err) {
			console.warn('[PingOne Org Licensing] Could not parse token for region:', err.message);
		}

		// Get license information
		let licenses = [];
		const environmentLicenseMap = {};
		try {
			const licenseResponse = await fetch(
				`${baseUrl}/organizations/${organizationInfo.id}/licenses`,
				{
					method: 'GET',
					headers: {
						Authorization: `Bearer ${workerToken}`,
						'Content-Type': 'application/json',
						Accept: 'application/json',
					},
				}
			);

			if (licenseResponse.ok) {
				const licensesData = await licenseResponse.json();
				licenses = licensesData._embedded?.licenses || [];

				await Promise.all(
					licenses.map(async (licenseItem) => {
						const licenseId = licenseItem.id;
						if (!licenseId) return;

						try {
							const assignedResponse = await fetch(
								`${baseUrl}/licenses/${licenseId}/environments?limit=200`,
								{
									method: 'GET',
									headers: {
										Authorization: `Bearer ${workerToken}`,
										'Content-Type': 'application/json',
										Accept: 'application/json',
									},
								}
							);

							if (assignedResponse.ok) {
								const assignedData = await assignedResponse.json();
								const assignedEnvs = assignedData._embedded?.environments || [];
								assignedEnvs.forEach((assignedEnv) => {
									const assignedEnvId = assignedEnv.id || assignedEnv.environment?.id;
									if (!assignedEnvId) {
										return;
									}

									environmentLicenseMap[assignedEnvId] = {
										licenseId,
										licenseName: licenseItem.name || 'Unknown License',
										licenseStatus: licenseItem.status || 'unknown',
										licenseType: licenseItem.type,
									};
								});
							} else {
								const assignedError = await assignedResponse.text().catch(() => '');
								console.warn('[PingOne Org Licensing] Failed to fetch license assignments:', {
									licenseId,
									status: assignedResponse.status,
									error: assignedError.substring(0, 200),
								});
							}
						} catch (assignmentErr) {
							console.warn(
								'[PingOne Org Licensing] Error fetching license assignments:',
								assignmentErr.message
							);
						}
					})
				);
			} else {
				console.warn('[PingOne Org Licensing] Failed to fetch licenses:', licenseResponse.status);
			}
		} catch (err) {
			console.warn('[PingOne Org Licensing] Error fetching licenses:', err.message);
		}

		// Get environments
		let environments = [];
		try {
			const envResponse = await fetch(
				`${baseUrl}/organizations/${organizationInfo.id}/environments?limit=100`,
				{
					method: 'GET',
					headers: {
						Authorization: `Bearer ${workerToken}`,
						'Content-Type': 'application/json',
						Accept: 'application/json',
					},
				}
			);

			if (envResponse.ok) {
				const envData = await envResponse.json();
				environments = envData._embedded?.environments || [];
				console.log('[PingOne Org Licensing] Environments fetched:', {
					count: environments.length,
					status: envResponse.status,
					hasEmbedded: !!envData._embedded,
					responseStructure: Object.keys(envData),
				});
			} else {
				const errorText = await envResponse.text().catch(() => '');
				const errorJson = errorText
					? (() => {
							try {
								return JSON.parse(errorText);
							} catch {
								return null;
							}
						})()
					: null;
				console.error('[PingOne Org Licensing] Failed to fetch environments:', {
					status: envResponse.status,
					statusText: envResponse.statusText,
					error: errorText.substring(0, 200),
					errorDetails: errorJson,
					url: `${baseUrl}/organizations/${organizationInfo.id}/environments?limit=100`,
				});

				// Try alternative endpoint: direct environments list (not scoped to organization)
				console.log('[PingOne Org Licensing] Attempting alternative: direct environments endpoint');
				try {
					const altEnvResponse = await fetch(`${baseUrl}/environments?limit=100`, {
						method: 'GET',
						headers: {
							Authorization: `Bearer ${workerToken}`,
							'Content-Type': 'application/json',
							Accept: 'application/json',
						},
					});

					if (altEnvResponse.ok) {
						const altEnvData = await altEnvResponse.json();
						const allEnvs = altEnvData._embedded?.environments || [];
						// Filter to only environments belonging to this organization
						environments = allEnvs.filter((env) => {
							// Check if environment belongs to this organization (may need orgId field)
							return (
								env.organizationId === organizationInfo.id ||
								env.organization?.id === organizationInfo.id ||
								!env.organizationId
							); // If no org filter, include all
						});
						console.log('[PingOne Org Licensing] Alternative endpoint worked:', {
							totalEnvs: allEnvs.length,
							filteredEnvs: environments.length,
						});
					} else {
						const altErrorText = await altEnvResponse.text().catch(() => '');
						console.warn(
							'[PingOne Org Licensing] Alternative endpoint also failed:',
							altEnvResponse.status,
							altErrorText.substring(0, 200)
						);
					}
				} catch (altErr) {
					console.warn('[PingOne Org Licensing] Alternative endpoint error:', altErr.message);
				}
			}
		} catch (err) {
			console.error('[PingOne Org Licensing] Error fetching environments:', err.message);
		}

		// Map the license data
		const license = licenses[0]
			? {
					id: licenses[0].id || 'unknown',
					name: licenses[0].name || 'Unknown License',
					type: licenses[0].type || 'standard',
					status: licenses[0].status || 'pending',
					startDate: licenses[0].startsAt || new Date().toISOString(),
					endDate: licenses[0].endsAt,
					features: licenses[0].features || [],
					users: licenses[0].users
						? {
								total: licenses[0].users.total || 0,
								used: licenses[0].users.used || 0,
								available: (licenses[0].users.total || 0) - (licenses[0].users.used || 0),
							}
						: undefined,
					applications: licenses[0].applications
						? {
								total: licenses[0].applications.total || 0,
								used: licenses[0].applications.used || 0,
								available:
									(licenses[0].applications.total || 0) - (licenses[0].applications.used || 0),
							}
						: undefined,
				}
			: {
					id: 'no-license',
					name: 'No License Found',
					type: 'none',
					status: 'pending',
					startDate: new Date().toISOString(),
					features: [],
				};

		// Try to extract region from various possible locations
		let region = 'unknown';
		if (organizationInfo.region) {
			region = organizationInfo.region;
			console.log('[PingOne Org Licensing] Using region from organizationInfo.region:', region);
		} else if (organizationInfo.organization && organizationInfo.organization.region) {
			region = organizationInfo.organization.region;
			console.log(
				'[PingOne Org Licensing] Using region from organizationInfo.organization.region:',
				region
			);
		} else if (regionFromToken) {
			region = regionFromToken;
			console.log('[PingOne Org Licensing] Using region from token:', region);
		} else if (environments.length > 0 && environments[0].region) {
			// Use region from first environment as fallback
			region = environments[0].region;
			console.log('[PingOne Org Licensing] Using region from first environment:', region);
		} else {
			console.warn('[PingOne Org Licensing] Could not determine region from any source');
		}

		const orgInfo = {
			id: organizationInfo.id,
			name: organizationInfo.name,
			region: region,
			license,
			environments: environments.map((env) => ({
				id: env.id,
				name: env.name,
				region: env.region || region,
				licenseName: environmentLicenseMap[env.id]?.licenseName || env.license?.name,
				licenseStatus: environmentLicenseMap[env.id]?.licenseStatus || env.license?.status,
				licenseId: environmentLicenseMap[env.id]?.licenseId || env.license?.id,
				licenseType: environmentLicenseMap[env.id]?.licenseType || env.license?.type,
			})),
			createdAt:
				organizationInfo.createdAt || organizationInfo.created_at || new Date().toISOString(),
			updatedAt:
				organizationInfo.updatedAt || organizationInfo.updated_at || new Date().toISOString(),
		};

		console.log('[PingOne Org Licensing] Successfully retrieved organization info:', {
			id: orgInfo.id,
			name: orgInfo.name,
			region: orgInfo.region,
			environmentsCount: orgInfo.environments.length,
		});
		res.json(orgInfo);
	} catch (error) {
		console.error('[PingOne Org Licensing] Unexpected server error:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error while retrieving organization licensing',
			details: error.message,
		});
	}
});

app.post('/api/pingone/all-licenses', async (req, res) => {
	try {
		const { workerToken, organizationId } = req.body;

		if (!workerToken) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameter: workerToken',
			});
		}

		const baseUrl = 'https://api.pingone.com/v1';
		let licenseUrl = `${baseUrl}/licenses`;

		if (organizationId) {
			licenseUrl = `${baseUrl}/organizations/${organizationId}/licenses`;
			console.log('[PingOne All Licenses] Using organization-specific endpoint:', licenseUrl);
		} else {
			console.log('[PingOne All Licenses] Using global licenses endpoint');
		}

		const response = await fetch(`${licenseUrl}?limit=200`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${workerToken}`,
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
		});

		if (!response.ok) {
			const errorText = await response.text().catch(() => '');
			console.error('[PingOne All Licenses] Failed to fetch licenses:', {
				status: response.status,
				statusText: response.statusText,
				url: licenseUrl,
				error: errorText,
			});
			return res.status(response.status).json({
				error: 'api_request_failed',
				error_description: `Failed to fetch licenses: ${response.status} ${response.statusText}`,
				details: errorText,
			});
		}

		const data = await response.json();
		const licenses = data._embedded?.licenses || [];

		console.log(`[PingOne All Licenses] Retrieved ${licenses.length} licenses`);

		const mappedLicenses = licenses.map((license) => ({
			id: license.id || 'unknown',
			name: license.name || 'Unknown License',
			type: license.type || 'standard',
			status: license.status || 'pending',
			startDate: license.startsAt || new Date().toISOString(),
			endDate: license.endsAt,
			features: license.features || [],
			users: license.users
				? {
						total: license.users.total || 0,
						used: license.users.used || 0,
						available: (license.users.total || 0) - (license.users.used || 0),
					}
				: undefined,
			applications: license.applications
				? {
						total: license.applications.total || 0,
						used: license.applications.used || 0,
						available: (license.applications.total || 0) - (license.applications.used || 0),
					}
				: undefined,
		}));

		res.json(mappedLicenses);
	} catch (error) {
		console.error('[PingOne All Licenses] Unexpected server error:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error while retrieving licenses',
			details: error.message,
		});
	}
});

app.get('/api/pingone/oidc-config', async (req, res) => {
	try {
		const { environmentId, region = 'na' } = req.query;

		if (!environmentId) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameter: environmentId',
			});
		}

		// Determine the base URL based on region
		const regionMap = {
			us: 'https://auth.pingone.com',
			na: 'https://auth.pingone.com',
			eu: 'https://auth.pingone.eu',
			ca: 'https://auth.pingone.ca',
			ap: 'https://auth.pingone.asia',
			asia: 'https://auth.pingone.asia',
		};

		const baseUrl = regionMap[region.toLowerCase()] || regionMap['na'];
		const oidcConfigUrl = `${baseUrl}/${environmentId}/as/.well-known/openid_configuration`;

		console.log(`[Config Checker] Fetching OIDC config from: ${oidcConfigUrl}`);

		const response = await fetch(oidcConfigUrl, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('[Config Checker] OIDC config request failed:', errorText);
			return res.status(response.status).json({
				error: 'api_request_failed',
				error_description: `Failed to fetch OIDC config: ${response.status} ${response.statusText}`,
			});
		}

		const data = await response.json();
		console.log(`[Config Checker] Successfully fetched OIDC config`);

		res.json(data);
	} catch (error) {
		console.error('[Config Checker] Error fetching OIDC config:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error while fetching OIDC config',
		});
	}
});

// ============================================================================
// MFA PROXY ENDPOINTS
// ============================================================================

// NOTE: Legacy endpoint removed - the more complete endpoint below (line 9281) is now used.
// The endpoint below has:
// - Better token decoding and validation
// - More detailed error logging with debug info
// - Response metadata for frontend API call tracking
// - Comprehensive PingOne API call logging
// - Status mismatch warnings

// Register MFA Device with raw payload (demo use only)
// NOTE: This endpoint accepts a raw payload and sends it directly to PingOne.
// For production use, use /api/pingone/mfa/register-device instead, which properly handles nickname updates.
app.post('/api/pingone/mfa/create-device-payload', async (req, res) => {
	try {
		const { environmentId, userId, workerToken, payload } = req.body;

		if (!environmentId || !userId || !workerToken || !payload) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required fields: environmentId, userId, workerToken, payload',
			});
		}

		if (typeof payload !== 'object' || Array.isArray(payload)) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Payload must be a JSON object representing the PingOne device body',
			});
		}

		// Extract nickname if present (nickname is not valid in create request)
		// See: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#put-update-device-nickname
		const deviceNickname = payload.nickname || payload.name;
		const devicePayload = { ...payload };
		delete devicePayload.nickname; // Remove nickname from creation payload
		delete devicePayload.name; // Also remove name if present (use nickname instead)

		const deviceEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices`;
		console.log('[MFA Create Device Demo] Sending raw payload to PingOne', {
			environmentId: `${environmentId?.substring(0, 8)}...`,
			userId: `${userId?.substring(0, 8)}...`,
			type: devicePayload?.type,
			status: devicePayload?.status,
			hasNickname: !!deviceNickname,
		});

		const response = await global.fetch(deviceEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${workerToken}`,
			},
			body: JSON.stringify(devicePayload),
		});

		let responseBody = null;
		try {
			responseBody = await response.json();
		} catch {
			if (response.ok) {
				responseBody = { success: true };
			}
		}

		if (!response.ok) {
			console.error('[MFA Create Device Demo] PingOne error response', responseBody);
			return res.status(response.status).json(
				responseBody || {
					error: 'PingOneError',
					error_description: 'PingOne returned an error without a response body',
				}
			);
		}

		// Update device nickname if provided (nickname is not valid in create request)
		// See: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#put-update-device-nickname
		if (deviceNickname && deviceNickname.trim() && responseBody?.id) {
			try {
				const nicknameEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${responseBody.id}/nickname`;
				const nicknamePayload = { nickname: deviceNickname.trim() };
				
				const nicknameResponse = await global.fetch(nicknameEndpoint, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${workerToken}`,
					},
					body: JSON.stringify(nicknamePayload),
				});

				if (nicknameResponse.ok) {
					const nicknameResponseData = await nicknameResponse.json();
					console.log('[MFA Create Device Demo] Device nickname updated:', {
						deviceId: responseBody.id,
						nickname: deviceNickname.trim(),
					});
					// Update responseBody with nickname from the response
					if (nicknameResponseData && typeof nicknameResponseData === 'object' && 'nickname' in nicknameResponseData) {
						responseBody.nickname = nicknameResponseData.nickname;
					}
				} else {
					console.warn('[MFA Create Device Demo] Failed to update device nickname:', {
						deviceId: responseBody.id,
						status: nicknameResponse.status,
						note: 'Device was created successfully, but nickname update failed',
					});
					// Don't fail the entire request if nickname update fails
				}
			} catch (nicknameError) {
				console.error('[MFA Create Device Demo] Error updating device nickname:', {
					deviceId: responseBody.id,
					error: nicknameError.message,
					note: 'Device was created successfully, but nickname update failed',
				});
				// Don't fail the entire request if nickname update fails
			}
		}

		return res.json(responseBody ?? { success: true });
	} catch (error) {
		console.error('[MFA Create Device Demo] Error creating device', error);
		return res.status(500).json({
			error: 'server_error',
			error_description: 'Failed to create device with provided payload',
			message: error instanceof Error ? error.message : String(error),
		});
	}
});

// NOTE: Legacy send-otp and validate-otp endpoints removed.
// The more complete endpoints below (around line 8414 and 8483) are now used.
// They include comprehensive logging, API call tracking, and better error handling.

// Login Hint Token Generation for MFA-Only Flow
app.post('/api/pingone/login-hint-token', async (req, res) => {
	try {
		const { environmentId, userId, workerToken } = req.body;

		if (!environmentId || !userId || !workerToken) {
			return res.status(400).json({
				error: 'Missing required fields: environmentId, userId, workerToken',
			});
		}

		console.log('[Login Hint Token] Request:', {
			environmentId: `${environmentId?.substring(0, 8)}...`,
			userId: `${userId?.substring(0, 8)}...`,
		});

		// Call PingOne's actual login hint token API
		const loginHintUrl = `https://auth.pingone.com/${environmentId}/login-hint-token`;

		const loginHintResponse = await fetch(loginHintUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${workerToken}`,
			},
			body: JSON.stringify({
				userId: userId,
				loginHintType: 'USER_ID',
			}),
		});

		if (!loginHintResponse.ok) {
			const errorData = await loginHintResponse.json();
			console.error('[Login Hint Token] API Error:', errorData);
			return res.status(loginHintResponse.status).json({
				error: 'Failed to generate login hint token',
				message: errorData.message || 'PingOne API error',
				details: errorData,
			});
		}

		const loginHintData = await loginHintResponse.json();
		console.log('[Login Hint Token] Generated successfully');
		res.json(loginHintData);
	} catch (error) {
		console.error('[Login Hint Token] Error:', error);
		res.status(500).json({
			error: 'Failed to generate login hint token',
			message: error.message,
		});
	}
});

// Initialize Device Authentication
app.post('/api/pingone/mfa/initiate-device-auth', async (req, res) => {
	try {
		const { environmentId, userId, workerToken } = req.body;

		if (!environmentId || !userId || !workerToken) {
			return res.status(400).json({
				error: 'Missing required fields: environmentId, userId, workerToken',
			});
		}

		console.log('[MFA Device Auth] Initialize request:', {
			environmentId: `${environmentId?.substring(0, 8)}...`,
			userId: `${userId?.substring(0, 8)}...`,
		});

		// Call PingOne's actual device authentication initialization API
		const deviceAuthUrl = `https://auth.pingone.com/${environmentId}/mfa/deviceAuthentications`;

		const deviceAuthResponse = await fetch(deviceAuthUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${workerToken}`,
			},
			body: JSON.stringify({
				userId: userId,
			}),
		});

		if (!deviceAuthResponse.ok) {
			const errorData = await deviceAuthResponse.json();
			console.error('[MFA Device Auth] Initialize API Error:', errorData);
			return res.status(deviceAuthResponse.status).json({
				error: 'Failed to initialize device authentication',
				message: errorData.message || 'PingOne API error',
				details: errorData,
			});
		}

		const deviceAuthData = await deviceAuthResponse.json();
		console.log('[MFA Device Auth] Initialized successfully');
		res.json(deviceAuthData);
	} catch (error) {
		console.error('[MFA Device Auth] Initialize Error:', error);
		res.status(500).json({
			error: 'Failed to initialize device authentication',
			message: error.message,
		});
	}
});

// Get User's MFA Devices
app.get('/api/pingone/mfa/user-devices', async (req, res) => {
	try {
		const { environmentId, userId, workerToken } = req.query;

		if (!environmentId || !userId || !workerToken) {
			return res.status(400).json({
				error: 'Missing required query parameters: environmentId, userId, workerToken',
			});
		}

		console.log('[MFA Devices] Get user devices:', {
			environmentId: `${environmentId?.substring(0, 8)}...`,
			userId: `${userId?.substring(0, 8)}...`,
		});

		// Call PingOne's actual devices API
		const devicesUrl = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices`;

		const devicesResponse = await fetch(devicesUrl, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${workerToken}`,
				'Content-Type': 'application/json',
			},
		});

		if (!devicesResponse.ok) {
			const errorData = await devicesResponse.json();
			console.error('[MFA Devices] API Error:', errorData);
			return res.status(devicesResponse.status).json({
				error: 'Failed to fetch user devices',
				message: errorData.message || 'PingOne API error',
				details: errorData,
			});
		}

		const devicesData = await devicesResponse.json();
		console.log('[MFA Devices] Retrieved successfully');
		res.json(devicesData);
	} catch (error) {
		console.error('[MFA Devices] Error:', error);
		res.status(500).json({
			error: 'Failed to fetch user devices',
			message: error.message,
		});
	}
});

// Get All User Devices (POST version for frontend compatibility)
app.post('/api/pingone/mfa/get-all-devices', async (req, res) => {
	try {
		const { environmentId, userId, workerToken, username } = req.body;

		if (!environmentId || !userId || !workerToken) {
			return res.status(400).json({
				error: 'Missing required fields: environmentId, userId, workerToken',
			});
		}

		// Clean and validate worker token
		let cleanToken = String(workerToken).trim();
		if (cleanToken.startsWith('Bearer ')) {
			cleanToken = cleanToken.substring(7);
		}
		if (!cleanToken) {
			return res.status(400).json({
				error: 'Invalid worker token: token is empty',
			});
		}
		// Validate JWT format (3 dot-separated parts)
		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3) {
			return res.status(400).json({
				error: 'Invalid worker token: not a valid JWT format',
			});
		}

		// Extract SCIM filter from request body (optional)
		const { filter } = req.body;

		console.log('[MFA Devices] Get all devices:', {
			environmentId: `${environmentId?.substring(0, 8)}...`,
			userId: `${userId?.substring(0, 8)}...`,
			username: username || 'N/A',
			hasFilter: !!filter,
			filter: filter || 'none',
		});
		console.log('[MFA Devices] 📋 Will log to pingone-api.log and api-log.log');

		// Call PingOne's actual devices API with optional SCIM filter
		let devicesUrl = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices`;
		
		// Add SCIM filter query parameter if provided
		// SCIM filters use format: filter=type eq "SMS" or filter=status eq "ACTIVE"
		if (filter && typeof filter === 'string' && filter.trim()) {
			// URL encode the filter parameter
			devicesUrl += `?filter=${encodeURIComponent(filter.trim())}`;
		}

		const startTime = Date.now();
		const devicesResponse = await fetch(devicesUrl, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/json',
			},
		});

		const duration = Date.now() - startTime;

		// Clone response for logging
		const responseClone = devicesResponse.clone();
		let responseData = null;
		if (devicesResponse.ok) {
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}
		} else {
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Unknown error' };
			}
		}

		// Log the actual PingOne API call
		console.log('[MFA Devices] 📝 Logging API call to pingone-api.log and api-log.log');
		logPingOneApiCall(
			'Get All MFA Devices',
			devicesUrl,
			'GET',
			{ Authorization: `Bearer ${cleanToken}`, 'Content-Type': 'application/json' },
			null, // No request body for GET
			devicesResponse,
			responseData,
			duration,
			{
				operation: 'get-all-devices',
				environmentId,
				userId,
				username: username || 'N/A',
				hasFilter: !!filter,
				filter: filter || undefined,
				deviceCount: responseData?._embedded?.devices?.length || 0,
			}
		);
		console.log('[MFA Devices] ✅ API call logged successfully');

		if (!devicesResponse.ok) {
			const errorData = responseData || { error: 'Unknown error' };
			console.error('[MFA Devices] API Error:', errorData);
			return res.status(devicesResponse.status).json({
				error: 'Failed to fetch user devices',
				message: errorData.message || errorData.error || 'PingOne API error',
				details: errorData,
			});
		}

		const devicesData = responseData;
		console.log('[MFA Devices] Retrieved successfully', {
			userId: `${userId?.substring(0, 8)}...`,
			username: username || 'N/A',
			deviceCount: devicesData._embedded?.devices?.length || 0,
		});
		res.json(devicesData);
	} catch (error) {
		console.error('[MFA Devices] Error:', error);
		res.status(500).json({
			error: 'Failed to fetch user devices',
			message: error instanceof Error ? error.message : String(error),
		});
	}
});

// Select Device for Authentication
app.post('/api/pingone/mfa/select-device', async (req, res) => {
	try {
		// Accept both deviceAuthId and authenticationId for compatibility
		const { environmentId, deviceAuthId, authenticationId, deviceId, workerToken } = req.body;
		const resolvedDeviceAuthId = deviceAuthId || authenticationId;

		if (!environmentId || !resolvedDeviceAuthId || !deviceId || !workerToken) {
			return res.status(400).json({
				error: 'Missing required fields: environmentId, deviceAuthId (or authenticationId), deviceId, workerToken',
				received: {
					environmentId: !!environmentId,
					deviceAuthId: !!deviceAuthId,
					authenticationId: !!authenticationId,
					deviceId: !!deviceId,
					workerToken: !!workerToken,
				},
			});
		}

		console.log('[MFA Device Auth] Select device request:', {
			environmentId: `${environmentId?.substring(0, 8)}...`,
			deviceAuthId: `${resolvedDeviceAuthId?.substring(0, 8)}...`,
			deviceId: `${deviceId?.substring(0, 8)}...`,
		});

		// Clean and validate worker token
		let cleanToken = workerToken?.trim() || '';
		if (cleanToken.startsWith('Bearer ')) {
			cleanToken = cleanToken.substring(7);
		}

		// Validate JWT format (3 dot-separated parts)
		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3) {
			console.error('[MFA Device Auth] Invalid worker token format (not a JWT)');
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token must be a valid JWT (3 dot-separated parts)',
			});
		}

		// Call PingOne's actual device selection API
		// Based on user's curl example: POST /{envID}/deviceAuthentications/{deviceAuthID}
		// Content-Type: application/vnd.pingidentity.device.select+json
		// Body: { "device": { "id": "{deviceID}" }, "compatibility": "FULL" }
		// This matches the unified MFA flow format
		const selectDeviceUrl = `https://auth.pingone.com/${environmentId}/deviceAuthentications/${resolvedDeviceAuthId}`;

		const requestBody = {
			device: { id: deviceId },
			compatibility: 'FULL',
		};

		console.log('[MFA Device Auth] Calling PingOne API:', {
			url: selectDeviceUrl,
			method: 'POST',
			contentType: 'application/vnd.pingidentity.device.select+json',
			body: requestBody,
			authorizationHeader: `Bearer ${cleanToken.substring(0, 20)}...`,
		});

		const startTime = Date.now();
		const selectDeviceResponse = await fetch(selectDeviceUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/vnd.pingidentity.device.select+json',
				Authorization: `Bearer ${cleanToken}`,
			},
			body: JSON.stringify(requestBody),
		});
		const duration = Date.now() - startTime;
		
		const selectDeviceResponseClone = selectDeviceResponse.clone();
		let selectDeviceData;
		try {
			selectDeviceData = await selectDeviceResponseClone.json();
		} catch {
			selectDeviceData = { error: 'Failed to parse response' };
		}
		
		logPingOneApiCall(
			'Select Device for Authentication',
			selectDeviceUrl,
			'POST',
			{
				'Content-Type': 'application/vnd.pingidentity.device.select+json',
				Authorization: `Bearer ${cleanToken.substring(0, 20)}...***REDACTED***`,
			},
			requestBody,
			selectDeviceResponse,
			selectDeviceData,
			duration,
			{ environmentId, deviceAuthId: resolvedDeviceAuthId, deviceId }
		);

		if (!selectDeviceResponse.ok) {
			const errorData = selectDeviceData || { error: 'Unknown error' };
			console.error('[MFA Device Auth] Select device API Error:', errorData);
			
			// Check for NO_USABLE_DEVICES error
			if (errorData.error?.code === 'NO_USABLE_DEVICES') {
				console.error('[MFA Device Auth] NO_USABLE_DEVICES error detected:', {
					message: errorData.error.message,
					unavailableDevices: errorData.error.unavailableDevices || [],
				});
				return res.status(400).json({
					error: 'NO_USABLE_DEVICES',
					message: errorData.error.message || 'No usable devices found for authentication',
					unavailableDevices: errorData.error.unavailableDevices || [],
					status: 'FAILED',
					details: errorData,
				});
			}

			return res.status(selectDeviceResponse.status).json({
				error: 'Failed to select device for authentication',
				message: errorData.message || errorData.error?.message || 'PingOne API error',
				details: errorData,
			});
		}

		// selectDeviceData was already parsed above for logging
		console.log('[MFA Device Auth] Device selected successfully:', {
			status: selectDeviceData.status,
			nextStep: selectDeviceData.nextStep,
			challengeId: selectDeviceData.challengeId,
			hasLinks: !!selectDeviceData._links,
		});
		res.json(selectDeviceData);
	} catch (error) {
		console.error('[MFA Device Auth] Select device Error:', error);
		res.status(500).json({
			error: 'Failed to select device for authentication',
			message: error.message,
		});
	}
});

// Complete MFA Flow with OTP
app.post('/api/pingone/mfa/complete', async (req, res) => {
	try {
		const { environmentId, deviceAuthId, otp, workerToken } = req.body;

		if (!environmentId || !deviceAuthId || !otp || !workerToken) {
			return res.status(400).json({
				error: 'Missing required fields: environmentId, deviceAuthId, otp, workerToken',
			});
		}

		console.log('[MFA Complete] Request:', {
			environmentId: `${environmentId?.substring(0, 8)}...`,
			deviceAuthId: `${deviceAuthId?.substring(0, 8)}...`,
			otp: `${otp?.substring(0, 2)}***`,
		});

		// Call PingOne's actual OTP verification API
		const completeUrl = `https://auth.pingone.com/${environmentId}/mfa/deviceAuthentications/${deviceAuthId}/complete`;

		const completeResponse = await fetch(completeUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${workerToken}`,
			},
			body: JSON.stringify({
				otp: otp,
			}),
		});

		if (!completeResponse.ok) {
			const errorData = await completeResponse.json();
			console.error('[MFA Complete] API Error:', errorData);
			return res.status(completeResponse.status).json({
				error: 'Failed to complete MFA flow',
				message: errorData.message || 'PingOne API error',
				details: errorData,
			});
		}

		const completeData = await completeResponse.json();
		console.log('[MFA Complete] Completed successfully');
		res.json(completeData);
	} catch (error) {
		console.error('[MFA Complete] Error:', error);
		res.status(500).json({
			error: 'Failed to complete MFA flow',
			message: error.message,
		});
	}
});

// Resume MFA Flow to Get Authorization Code
app.get('/api/pingone/mfa/resume', async (req, res) => {
	try {
		const { environmentId, deviceAuthId, workerToken } = req.query;

		if (!environmentId || !deviceAuthId || !workerToken) {
			return res.status(400).json({
				error: 'Missing required query parameters: environmentId, deviceAuthId, workerToken',
			});
		}

		console.log('[MFA Resume] Request:', {
			environmentId: `${environmentId?.substring(0, 8)}...`,
			deviceAuthId: `${deviceAuthId?.substring(0, 8)}...`,
		});

		// Call PingOne's actual resume API
		const resumeUrl = `https://auth.pingone.com/${environmentId}/mfa/deviceAuthentications/${deviceAuthId}/resume`;

		const resumeResponse = await fetch(resumeUrl, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${workerToken}`,
				'Content-Type': 'application/json',
			},
		});

		if (!resumeResponse.ok) {
			const errorData = await resumeResponse.json();
			console.error('[MFA Resume] API Error:', errorData);
			return res.status(resumeResponse.status).json({
				error: 'Failed to resume MFA flow',
				message: errorData.message || 'PingOne API error',
				details: errorData,
			});
		}

		const resumeData = await resumeResponse.json();
		console.log('[MFA Resume] Resumed successfully');
		res.json(resumeData);
	} catch (error) {
		console.error('[MFA Resume] Error:', error);
		res.status(500).json({
			error: 'Failed to resume MFA flow',
			message: error.message,
		});
	}
});

// List Device Authentication Policies
app.post('/api/pingone/mfa/device-authentication-policies', async (req, res) => {
	const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(7)}`;
	console.log(`[MFA Device Auth Policies] [${requestId}] Request received`, {
		timestamp: new Date().toISOString(),
		hasEnvironmentId: !!req.body?.environmentId,
		hasWorkerToken: !!req.body?.workerToken,
		region: req.body?.region || 'na',
	});

	try {
		const { environmentId, workerToken } = req.body;

		if (!environmentId || !workerToken) {
			console.error(`[MFA Device Auth Policies] [${requestId}] Missing required fields`, {
				hasEnvironmentId: !!environmentId,
				hasWorkerToken: !!workerToken,
			});
			return res
				.status(400)
				.json({ error: 'Missing required fields: environmentId and workerToken' });
		}

		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			console.error(`[MFA Device Auth Policies] [${requestId}] Worker token is empty`);
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
			console.error(`[MFA Device Auth Policies] [${requestId}] Invalid worker token format`, {
				tokenParts: tokenParts.length,
			});
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		const region = req.body.region || 'na';
		const apiBase =
			region === 'eu'
				? 'https://api.pingone.eu'
				: region === 'asia'
					? 'https://api.pingone.asia'
					: 'https://api.pingone.com';

		const policiesEndpoint = `${apiBase}/v1/environments/${environmentId}/deviceAuthenticationPolicies`;

		console.log(`[MFA Device Auth Policies] [${requestId}] Calling PingOne API:`, {
			url: policiesEndpoint,
			environmentId,
			region,
			tokenLength: cleanToken.length,
		});

		let response;
		try {
			response = await global.fetch(policiesEndpoint, {
				method: 'GET',
				headers: { Authorization: `Bearer ${cleanToken}` },
			});
			console.log(`[MFA Device Auth Policies] [${requestId}] PingOne API response:`, {
				status: response.status,
				statusText: response.statusText,
				ok: response.ok,
			});
		} catch (fetchError) {
			console.error(`[MFA Device Auth Policies] [${requestId}] Fetch error:`, {
				error: fetchError instanceof Error ? fetchError.message : String(fetchError),
				stack: fetchError instanceof Error ? fetchError.stack : undefined,
			});
			return res.status(500).json({
				error: 'Failed to connect to PingOne API',
				message: fetchError instanceof Error ? fetchError.message : String(fetchError),
			});
		}

		if (!response.ok) {
			let errorData;
			try {
				errorData = await response.json();
			} catch (parseError) {
				const errorText = await response.text().catch(() => 'Unable to read error response');
				console.error(`[MFA Device Auth Policies] [${requestId}] Error response (non-JSON):`, {
					status: response.status,
					statusText: response.statusText,
					body: errorText.substring(0, 500),
				});
				errorData = { error: 'Unknown error', message: errorText.substring(0, 200) };
			}
			console.error(`[MFA Device Auth Policies] [${requestId}] PingOne API error:`, errorData);
			return res.status(response.status).json(errorData);
		}

		let policiesData;
		try {
			policiesData = await response.json();
			console.log(`[MFA Device Auth Policies] [${requestId}] Success:`, {
				policiesCount: policiesData?._embedded?.deviceAuthenticationPolicies?.length || 
					policiesData?.items?.length || 
					policiesData?.deviceAuthenticationPolicies?.length || 0,
			});
		} catch (parseError) {
			console.error(`[MFA Device Auth Policies] [${requestId}] Failed to parse response:`, {
				error: parseError instanceof Error ? parseError.message : String(parseError),
				status: response.status,
				statusText: response.statusText,
			});
			return res.status(500).json({
				error: 'Failed to parse response from PingOne API',
				message: parseError instanceof Error ? parseError.message : String(parseError),
			});
		}

		return res.json(policiesData);
	} catch (error) {
		console.error(`[MFA Device Auth Policies] [${requestId}] Unexpected error:`, {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});
		
		// Ensure response is sent even if there's an error
		if (!res.headersSent) {
			return res.status(500).json({
				error: 'Failed to list device authentication policies',
				message: error instanceof Error ? error.message : String(error),
			});
		} else {
			// If headers were already sent, log the error but can't send response
			console.error(`[MFA Device Auth Policies] [${requestId}] Response already sent, cannot send error response`);
		}
	}
});

// Error handling middleware
app.use((error, _req, res, _next) => {
	console.error('[Server] Unhandled error:', error);
	res.status(500).json({
		error: 'server_error',
		error_description: 'Internal server error',
	});
});

// Generate self-signed certificates for HTTPS
function generateSelfSignedCert() {
	const certDir = path.join(__dirname, 'certs');

	// Create certs directory if it doesn't exist
	if (!fs.existsSync(certDir)) {
		fs.mkdirSync(certDir, { recursive: true });
	}

	const keyPath = path.join(certDir, 'server.key');
	const certPath = path.join(certDir, 'server.crt');

	// Check if certificates already exist
	if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
		console.log('🔐 Using existing self-signed certificates');
		return { keyPath, certPath };
	}

	try {
		console.log('🔐 Generating self-signed certificates for HTTPS...');
		execSync(
			`openssl req -x509 -newkey rsa:4096 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`,
			{ stdio: 'inherit' }
		);
		console.log('✅ Self-signed certificates generated successfully');
		return { keyPath, certPath };
	} catch (error) {
		console.error('❌ Failed to generate certificates:', error.message);
		console.log('🔄 Falling back to HTTP server...');
		return null;
	}
}

// In-memory storage for webhook events (for demo purposes)
// In production, you'd want to use a database or persistent storage
const webhookEvents = [];
const MAX_WEBHOOK_EVENTS = 1000; // Keep last 1000 events

/**
 * PingOne Webhook Subscriptions API - List all subscriptions
 * GET /api/pingone/subscriptions
 */
app.get('/api/pingone/subscriptions', async (req, res) => {
	try {
		const { environmentId, region = 'na', workerToken } = req.query;

		if (!environmentId) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameter: environmentId',
			});
		}

		if (!workerToken) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameter: workerToken',
			});
		}

		const regionMap = { na: 'us', eu: 'eu', asia: 'ap' };
		const apiRegion = regionMap[region] || 'us';
		const apiUrl = `https://api.pingone.${apiRegion}/v1/environments/${environmentId}/subscriptions`;

		console.log(`[Webhook Subscriptions] Fetching subscriptions from: ${apiUrl}`);

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

		const response = await fetch(apiUrl, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${workerToken}`,
				'Content-Type': 'application/json',
			},
			signal: controller.signal,
		});

		clearTimeout(timeout);

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`[Webhook Subscriptions] API error (${response.status}):`, errorText);
			return res.status(response.status).json({
				error: 'api_error',
				error_description: `PingOne API returned ${response.status}`,
				details: errorText,
			});
		}

		const data = await response.json();
		console.log(
			`[Webhook Subscriptions] Successfully fetched ${data._embedded?.subscriptions?.length || 0} subscriptions`
		);

		res.json(data);
	} catch (error) {
		console.error('[Webhook Subscriptions] Error:', error);
		if (error.name === 'AbortError') {
			return res.status(504).json({
				error: 'timeout',
				error_description: 'Request to PingOne API timed out',
			});
		}
		res.status(500).json({
			error: 'internal_error',
			error_description: 'Failed to fetch webhook subscriptions',
			details: error.message,
		});
	}
});

/**
 * PingOne Webhook Subscriptions API - Get a specific subscription
 * GET /api/pingone/subscriptions/:subscriptionId
 */
app.get('/api/pingone/subscriptions/:subscriptionId', async (req, res) => {
	try {
		const { subscriptionId } = req.params;
		const { environmentId, region = 'na', workerToken } = req.query;

		if (!environmentId || !subscriptionId) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameters: environmentId, subscriptionId',
			});
		}

		if (!workerToken) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameter: workerToken',
			});
		}

		const regionMap = { na: 'us', eu: 'eu', asia: 'ap' };
		const apiRegion = regionMap[region] || 'us';
		const apiUrl = `https://api.pingone.${apiRegion}/v1/environments/${environmentId}/subscriptions/${subscriptionId}`;

		console.log(`[Webhook Subscriptions] Fetching subscription ${subscriptionId} from: ${apiUrl}`);

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 30000);

		const response = await fetch(apiUrl, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${workerToken}`,
				'Content-Type': 'application/json',
			},
			signal: controller.signal,
		});

		clearTimeout(timeout);

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`[Webhook Subscriptions] API error (${response.status}):`, errorText);
			return res.status(response.status).json({
				error: 'api_error',
				error_description: `PingOne API returned ${response.status}`,
				details: errorText,
			});
		}

		const data = await response.json();
		console.log(`[Webhook Subscriptions] Successfully fetched subscription ${subscriptionId}`);

		res.json(data);
	} catch (error) {
		console.error('[Webhook Subscriptions] Error:', error);
		if (error.name === 'AbortError') {
			return res.status(504).json({
				error: 'timeout',
				error_description: 'Request to PingOne API timed out',
			});
		}
		res.status(500).json({
			error: 'internal_error',
			error_description: 'Failed to fetch webhook subscription',
			details: error.message,
		});
	}
});

/**
 * PingOne Webhook Subscriptions API - Create a new subscription
 * POST /api/pingone/subscriptions
 */
app.post('/api/pingone/subscriptions', express.json(), async (req, res) => {
	try {
		const { environmentId, region = 'na', workerToken } = req.query;
		const subscriptionData = req.body;

		if (!environmentId) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameter: environmentId',
			});
		}

		if (!workerToken) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameter: workerToken',
			});
		}

		if (
			!subscriptionData ||
			!subscriptionData.name ||
			!subscriptionData.enabled ||
			!subscriptionData.destination
		) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required fields: name, enabled, destination',
			});
		}

		const regionMap = { na: 'us', eu: 'eu', asia: 'ap' };
		const apiRegion = regionMap[region] || 'us';
		const apiUrl = `https://api.pingone.${apiRegion}/v1/environments/${environmentId}/subscriptions`;

		console.log(`[Webhook Subscriptions] Creating subscription:`, subscriptionData.name);

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 30000);

		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${workerToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(subscriptionData),
			signal: controller.signal,
		});

		clearTimeout(timeout);

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`[Webhook Subscriptions] API error (${response.status}):`, errorText);
			return res.status(response.status).json({
				error: 'api_error',
				error_description: `PingOne API returned ${response.status}`,
				details: errorText,
			});
		}

		const data = await response.json();
		console.log(`[Webhook Subscriptions] Successfully created subscription:`, data.id);

		res.status(201).json(data);
	} catch (error) {
		console.error('[Webhook Subscriptions] Error:', error);
		if (error.name === 'AbortError') {
			return res.status(504).json({
				error: 'timeout',
				error_description: 'Request to PingOne API timed out',
			});
		}
		res.status(500).json({
			error: 'internal_error',
			error_description: 'Failed to create webhook subscription',
			details: error.message,
		});
	}
});

/**
 * PingOne Webhook Subscriptions API - Update a subscription
 * PUT /api/pingone/subscriptions/:subscriptionId
 */
app.put('/api/pingone/subscriptions/:subscriptionId', express.json(), async (req, res) => {
	try {
		const { subscriptionId } = req.params;
		const { environmentId, region = 'na', workerToken } = req.query;
		const subscriptionData = req.body;

		if (!environmentId || !subscriptionId) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameters: environmentId, subscriptionId',
			});
		}

		if (!workerToken) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameter: workerToken',
			});
		}

		const regionMap = { na: 'us', eu: 'eu', asia: 'ap' };
		const apiRegion = regionMap[region] || 'us';
		const apiUrl = `https://api.pingone.${apiRegion}/v1/environments/${environmentId}/subscriptions/${subscriptionId}`;

		console.log(`[Webhook Subscriptions] Updating subscription ${subscriptionId}`);

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 30000);

		const response = await fetch(apiUrl, {
			method: 'PUT',
			headers: {
				Authorization: `Bearer ${workerToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(subscriptionData),
			signal: controller.signal,
		});

		clearTimeout(timeout);

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`[Webhook Subscriptions] API error (${response.status}):`, errorText);
			return res.status(response.status).json({
				error: 'api_error',
				error_description: `PingOne API returned ${response.status}`,
				details: errorText,
			});
		}

		const data = await response.json();
		console.log(`[Webhook Subscriptions] Successfully updated subscription ${subscriptionId}`);

		res.json(data);
	} catch (error) {
		console.error('[Webhook Subscriptions] Error:', error);
		if (error.name === 'AbortError') {
			return res.status(504).json({
				error: 'timeout',
				error_description: 'Request to PingOne API timed out',
			});
		}
		res.status(500).json({
			error: 'internal_error',
			error_description: 'Failed to update webhook subscription',
			details: error.message,
		});
	}
});

/**
 * PingOne Webhook Subscriptions API - Delete a subscription
 * DELETE /api/pingone/subscriptions/:subscriptionId
 */
app.delete('/api/pingone/subscriptions/:subscriptionId', async (req, res) => {
	try {
		const { subscriptionId } = req.params;
		const { environmentId, region = 'na', workerToken } = req.query;

		if (!environmentId || !subscriptionId) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameters: environmentId, subscriptionId',
			});
		}

		if (!workerToken) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameter: workerToken',
			});
		}

		const regionMap = { na: 'us', eu: 'eu', asia: 'ap' };
		const apiRegion = regionMap[region] || 'us';
		const apiUrl = `https://api.pingone.${apiRegion}/v1/environments/${environmentId}/subscriptions/${subscriptionId}`;

		console.log(`[Webhook Subscriptions] Deleting subscription ${subscriptionId}`);

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 30000);

		const response = await fetch(apiUrl, {
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${workerToken}`,
				'Content-Type': 'application/json',
			},
			signal: controller.signal,
		});

		clearTimeout(timeout);

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`[Webhook Subscriptions] API error (${response.status}):`, errorText);
			return res.status(response.status).json({
				error: 'api_error',
				error_description: `PingOne API returned ${response.status}`,
				details: errorText,
			});
		}

		// DELETE requests typically return 204 No Content
		if (response.status === 204) {
			console.log(`[Webhook Subscriptions] Successfully deleted subscription ${subscriptionId}`);
			return res.status(204).send();
		}

		const data = await response.json();
		console.log(`[Webhook Subscriptions] Successfully deleted subscription ${subscriptionId}`);

		res.json(data);
	} catch (error) {
		console.error('[Webhook Subscriptions] Error:', error);
		if (error.name === 'AbortError') {
			return res.status(504).json({
				error: 'timeout',
				error_description: 'Request to PingOne API timed out',
			});
		}
		res.status(500).json({
			error: 'internal_error',
			error_description: 'Failed to delete webhook subscription',
			details: error.message,
		});
	}
});

/**
 * Pushed Authorization Request (PAR) Endpoint - RFC 9126
 * POST /api/par-request
 */
app.post('/api/par-request', async (req, res) => {
	console.log('🚀 [Server] PAR request received');
	console.log('📥 [Server] PAR request body:', {
		hasClientId: !!req.body.client_id,
		responseType: req.body.response_type,
		hasRedirectUri: !!req.body.redirect_uri,
		scopes: req.body.scope,
		hasState: !!req.body.state,
		hasNonce: !!req.body.nonce,
		hasClaims: !!req.body.claims,
	});

	try {
		const {
			client_id,
			response_type,
			redirect_uri,
			scope,
			state,
			nonce,
			response_mode,
			prompt,
			login_hint,
			audience,
			claims,
		} = req.body;

		// Validate required parameters
		if (!client_id || !response_type || !redirect_uri) {
			console.error('❌ [Server] Missing required PAR parameters:', {
				hasClientId: !!client_id,
				hasResponseType: !!response_type,
				hasRedirectUri: !!redirect_uri,
			});
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameters: client_id, response_type, redirect_uri',
			});
		}

		// Get environment ID from request body or environment variable
		const environment_id = req.body.environment_id || process.env.PINGONE_ENVIRONMENT_ID;

		if (!environment_id) {
			console.error('❌ [Server] Missing environment_id for PAR request');
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameter: environment_id',
			});
		}

		// Build PAR endpoint URL
		const parEndpoint = `https://auth.pingone.com/${environment_id}/as/par`;

		console.log('🔧 [Server] PAR endpoint:', parEndpoint);
		console.log('🔧 [Server] Environment ID:', environment_id);

		// Prepare PAR request body
		const parRequestBody = new URLSearchParams({
			client_id: client_id,
			response_type: response_type,
			redirect_uri: redirect_uri,
			scope: scope || 'openid',
			...(state && { state }),
			...(nonce && { nonce }),
			...(response_mode && { response_mode }),
			...(prompt && { prompt }),
			...(login_hint && { login_hint }),
			...(audience && { audience }),
		});

		// Add claims if provided
		if (claims) {
			try {
				// Validate that claims is valid JSON
				JSON.parse(claims);
				parRequestBody.append('claims', claims);
			} catch (error) {
				console.warn('⚠️ [Server] Invalid claims JSON, ignoring:', error.message);
			}
		}

		console.log('📤 [Server] Sending PAR request to PingOne:', {
			url: parEndpoint,
			method: 'POST',
			body: parRequestBody.toString(),
		});

		// Make request to PingOne PAR endpoint
		const parResponse = await global.fetch(parEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json',
			},
			body: parRequestBody.toString(),
		});

		console.log('📥 [Server] PingOne PAR response:', {
			status: parResponse.status,
			statusText: parResponse.statusText,
			ok: parResponse.ok,
			headers: Object.fromEntries(parResponse.headers.entries()),
		});

		const parResponseData = await parResponse.json();

		if (!parResponse.ok) {
			console.error('❌ [Server] PingOne PAR error:', {
				status: parResponse.status,
				statusText: parResponse.statusText,
				responseData: parResponseData,
				requestBody: parRequestBody.toString(),
			});
			return res.status(parResponse.status).json(parResponseData);
		}

		console.log('✅ [Server] PAR request successful:', {
			hasRequestUri: !!parResponseData.request_uri,
			expiresIn: parResponseData.expires_in,
			requestUri: parResponseData.request_uri,
		});

		// Return the PAR response from PingOne
		res.json(parResponseData);
	} catch (error) {
		console.error('❌ [Server] PAR request server error:', {
			message: error.message,
			stack: error.stack,
			error,
			requestBody: req.body,
		});
		res.status(500).json({
			error: 'server_error',
			error_description: error.message || 'Internal server error during PAR request',
			details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
		});
	}
});
app.post('/api/webhooks/pingone', express.json({ limit: '10mb' }), async (req, res) => {
	try {
		const timestamp = new Date();
		const eventId = randomUUID();

		console.log(
			`[Webhook Receiver] Received webhook event ${eventId} at ${timestamp.toISOString()}`
		);

		// Store the webhook event
		const webhookEvent = {
			id: eventId,
			timestamp: timestamp.toISOString(),
			timestampMs: timestamp.getTime(),
			type: req.body?.type || req.body?.event || 'unknown',
			event: req.body?.event || 'webhook.event',
			data: req.body,
			headers: req.headers,
			status: 'success',
			source: 'pingone-api',
			rawBody: req.body,
		};

		// Add to beginning of array (newest first)
		webhookEvents.unshift(webhookEvent);

		// Keep only the last MAX_WEBHOOK_EVENTS
		if (webhookEvents.length > MAX_WEBHOOK_EVENTS) {
			webhookEvents.splice(MAX_WEBHOOK_EVENTS);
		}

		console.log(
			`[Webhook Receiver] Stored webhook event ${eventId}, total events: ${webhookEvents.length}`
		);

		// Return 200 OK to PingOne
		res.status(200).json({
			success: true,
			eventId: eventId,
			receivedAt: timestamp.toISOString(),
		});
	} catch (error) {
		console.error('[Webhook Receiver] Error processing webhook:', error);
		res.status(500).json({
			success: false,
			error: 'Internal server error processing webhook',
			details: error.message,
		});
	}
});

/**
 * Webhook Events API - Get all stored webhook events
 * GET /api/webhooks/events
 */
app.get('/api/webhooks/events', (req, res) => {
	try {
		const { limit = 100, offset = 0 } = req.query;
		const limitNum = Math.min(parseInt(limit, 10) || 100, 1000);
		const offsetNum = parseInt(offset, 10) || 0;

		const events = webhookEvents.slice(offsetNum, offsetNum + limitNum);

		res.json({
			events: events,
			total: webhookEvents.length,
			limit: limitNum,
			offset: offsetNum,
		});
	} catch (error) {
		console.error('[Webhook Events API] Error fetching events:', error);
		res.status(500).json({
			error: 'Failed to fetch webhook events',
			details: error.message,
		});
	}
});

/**
 * Clear Webhook Events API
 * DELETE /api/webhooks/events
 */
app.delete('/api/webhooks/events', (req, res) => {
	try {
		const clearedCount = webhookEvents.length;
		webhookEvents.length = 0; // Clear array
		console.log(`[Webhook Events API] Cleared ${clearedCount} webhook events`);
		res.json({
			success: true,
			cleared: clearedCount,
		});
	} catch (error) {
		console.error('[Webhook Events API] Error clearing events:', error);
		res.status(500).json({
			error: 'Failed to clear webhook events',
			details: error.message,
		});
	}
});

// ============================================================================
// MFA PROXY ENDPOINTS
// ============================================================================

// Register MFA Device
// This is the primary endpoint for MFA device registration.
// It includes comprehensive error handling, token decoding, response metadata,
// and full PingOne API call logging.
// Per PingOne API docs: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-fido2
// Endpoint: POST /environments/{environmentId}/users/{userId}/devices
// Request body includes: { "type": "FIDO2", "status": "ACTIVATION_REQUIRED", "policy": { "id": "..." }, ... }
app.post('/api/pingone/mfa/register-device', async (req, res) => {
	try {
		console.log('[MFA Register Device] Request received:', {
			deviceType: req.body.type,
			status: req.body.status,
			hasPolicy: !!req.body.policy,
			environmentId: req.body.environmentId,
			userId: req.body.userId,
			requestBodyKeys: Object.keys(req.body),
		});
		const { environmentId, userId, type, phone, email, name, nickname, status, policy, rp, workerToken, userToken, tokenType } = req.body;

		console.log('[MFA Register Device] 🔍 REGISTER BACKEND STEP 1: Token received from frontend:', {
			hasWorkerToken: !!workerToken,
			hasUserToken: !!userToken,
			workerTokenType: typeof workerToken,
			workerTokenLength: workerToken ? String(workerToken).length : 0,
			workerTokenPreview: workerToken ? `${String(workerToken).substring(0, 30)}...${String(workerToken).substring(Math.max(0, String(workerToken).length - 30))}` : 'MISSING',
			userTokenLength: userToken ? String(userToken).length : 0,
			tokenType,
		});

		// Accept either workerToken or userToken (client sends as workerToken but it could be either)
		const accessToken = workerToken || userToken;
		
		console.log('[MFA Register Device] 🔍 REGISTER BACKEND STEP 2: Selected token:', {
			hasAccessToken: !!accessToken,
			accessTokenType: typeof accessToken,
			accessTokenLength: accessToken ? String(accessToken).length : 0,
			accessTokenPreview: accessToken ? `${String(accessToken).substring(0, 30)}...${String(accessToken).substring(Math.max(0, String(accessToken).length - 30))}` : 'MISSING',
			selectedFrom: workerToken ? 'workerToken' : 'userToken',
		});

		if (!environmentId || !userId || !type || !accessToken) {
			console.error('[MFA Register Device] Missing required fields:', {
				hasEnvironmentId: !!environmentId,
				hasUserId: !!userId,
				hasType: !!type,
				hasWorkerToken: !!workerToken,
				hasUserToken: !!userToken,
				hasAccessToken: !!accessToken,
			});
			return res.status(400).json({ error: 'Missing required fields' });
		}

		// Decode token to get info (without exposing full token)
		let tokenInfo = { type: 'unknown', hasExp: false, exp: null, sub: null, clientId: null };
		try {
			const tokenParts = accessToken.split('.');
			if (tokenParts.length === 3) {
				const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
				tokenInfo = {
					type: tokenType || (payload.client_id ? 'worker' : 'user'),
					hasExp: !!payload.exp,
					exp: payload.exp || null,
					sub: payload.sub || null,
					clientId: payload.client_id || payload.aud || null,
				};
			}
		} catch (e) {
			// Token decode failed, continue anyway
			console.warn('[MFA Register Device] Could not decode token for info:', e.message);
		}

		// Initialize devicePayload with type field (required for all device types)
		// For WhatsApp, the request body structure should be:
		// {
		//   "type": "WHATSAPP",
		//   "phone": "+1.5125551234",
		//   "policy": { "id": "{{deviceAuthenticationPolicyID}}" }
		// }
		// Note: For non-FIDO2 devices, "status" will also be included (ACTIVE or ACTIVATION_REQUIRED)
		const devicePayload = { type };
		
		// FIDO2-specific: Include RP (Relying Party) information if provided
		// Per PingOne API docs: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-fido2
		// Format: { "rp": { "id": "localhost", "name": "Local Development" } }
		// The RP ID should match the application's domain (per fido2.md)
		if (type === 'FIDO2' && req.body.rp) {
			if (typeof req.body.rp === 'object' && req.body.rp !== null) {
				devicePayload.rp = {
					id: String(req.body.rp.id || 'localhost').trim(),
					name: String(req.body.rp.name || req.body.rp.id || 'Local Development').trim(),
				};
			}
		}
		
		const normalizePhoneNumber = (value) => {
			// Handle both string and object formats
			// PingOne API accepts multiple phone formats as strings:
			// - +1.5125201234 (dot after country code)
			// - +15125201234 (no separators)
			// - +1.512.520.1234 (dots between groups)
			// - +1 (512) 520-1234 (parentheses and dashes)
			// We normalize to: +1.XXXXXXXXXX (dot after country code, rest is digits)
			// See: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-sms
			let num = null;
			if (typeof value === 'object' && value !== null && value.number) {
				// Already an object with number property, extract the number
				num = String(value.number).trim();
			} else if (typeof value === 'string') {
				// String format
				num = value.trim();
			}
			
			if (!num) return null;
			
			// Extract all digits and the + sign
			const hasPlus = num.startsWith('+');
			const digitsOnly = num.replace(/\D/g, '');
			
			if (!digitsOnly || digitsOnly.length === 0) return null;
			
			// Ensure it starts with +
			const withPlus = hasPlus ? `+${digitsOnly}` : `+${digitsOnly}`;
			
			// Normalize to +1.XXXXXXXXXX format (dot after country code, rest is digits)
			// Handle US/Canada numbers (country code 1, followed by 10 digits = 11 total)
			if (digitsOnly.startsWith('1') && digitsOnly.length === 11) {
				// US/Canada: +1.XXXXXXXXXX
				return `+1.${digitsOnly.substring(1)}`;
			} else if (digitsOnly.startsWith('1') && digitsOnly.length > 11) {
				// US/Canada with extra digits, take first 11
				return `+1.${digitsOnly.substring(1, 11)}`;
			} else {
				// For other countries, try to detect country code
				// Most country codes are 1-3 digits
				// For now, if it starts with 1 and has more than 10 digits, assume US/Canada
				if (digitsOnly.length >= 11 && digitsOnly.startsWith('1')) {
					return `+1.${digitsOnly.substring(1, 11)}`;
				}
				// For international numbers, preserve the format but ensure + prefix
				// Return as-is if it already has valid format, otherwise format minimally
				return withPlus;
			}
		};

		if ((type === 'SMS' || type === 'VOICE' || type === 'WHATSAPP') && phone) {
			// Handle phone - can be string or object
			// PingOne API requires phone as a STRING, not an object
			// Format: "+1.5125201234" (with dot after country code)
			const normalizedPhone = normalizePhoneNumber(phone);
			if (normalizedPhone) {
				devicePayload.phone = normalizedPhone; // Send as string, not object
			} else {
				console.error('[MFA Register Device] ⚠️ Failed to normalize phone number:', {
					phone,
					deviceType: type,
				});
			}
		} else if (type === 'EMAIL' && email) {
			// Handle email - can be string or object
			if (typeof email === 'object' && email !== null && email.address) {
				devicePayload.email = {
					address: String(email.address).trim(),
				};
			} else if (typeof email === 'string') {
				const trimmedEmail = email.trim();
				if (trimmedEmail) {
					devicePayload.email = {
						address: trimmedEmail,
					};
				}
			}
		}
		// NOTE: nickname is NOT included in device creation payload
		// It will be set via separate PUT /devices/{deviceId}/nickname API call after device creation
		// See: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#put-update-device-nickname
		const deviceNickname = nickname || name; // Store for later use (from request body, not devicePayload)
		
		console.log('[MFA Register Device] Device nickname for update:', {
			hasNickname: !!nickname,
			hasName: !!name,
			deviceNickname: deviceNickname || 'NOT PROVIDED',
			deviceNicknameTrimmed: deviceNickname ? deviceNickname.trim() : 'NOT PROVIDED',
			willUpdateNickname: !!(deviceNickname && deviceNickname.trim()),
		});
		
		// Remove nickname and name from devicePayload before sending to PingOne
		// These fields are not valid in the device creation request
		delete devicePayload.nickname;
		delete devicePayload.name;
		
		// For FIDO2 devices, only include: type, rp, and policy (per API docs)
		// Valid format: { "type": "FIDO2", "rp": { "id": "...", "name": "..." }, "policy": { "id": "..." } }
		// See: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-fido2
		// Do NOT include status, name, or nickname for FIDO2
		if (type !== 'FIDO2') {
			// Always include status explicitly for educational purposes (for non-FIDO2 devices including WhatsApp)
			// Status selection logic (same as SMS):
			// - Admin Flow (worker token): User can choose ACTIVE or ACTIVATION_REQUIRED via adminDeviceStatus dropdown
			// - User Flow (user token): Always ACTIVATION_REQUIRED (enforced by PingOne API)
			// 
			// Per PingOne API docs:
			// - If actor makes request on behalf of another user (Worker App/Admin Flow): Can use ACTIVE or ACTIVATION_REQUIRED
			// - If actor is the same user (User Flow): Can only use ACTIVATION_REQUIRED
			//
			// The frontend calculates the correct status based on registrationFlowType:
			// - Admin Flow: Uses adminDeviceStatus (user's selection: ACTIVE or ACTIVATION_REQUIRED)
			// - User Flow: Always ACTIVATION_REQUIRED
			// 
			// We respect the status from the request body (which comes from user's selection)
			if (status) {
				// Use the status from request body (respects user's selection in Admin Flow or User Flow)
				devicePayload.status = status;
				console.log('[MFA Register Device] ✅ Status from user selection included in device payload:', {
					deviceType: type,
					status: devicePayload.status,
					statusSource: 'user-selection',
					tokenType: tokenType,
					isWhatsApp: type === 'WHATSAPP',
					note: 'Status comes from user\'s selection: Admin Flow (user chooses ACTIVE/ACTIVATION_REQUIRED) or User Flow (always ACTIVATION_REQUIRED)',
				});
			} else if (tokenType === 'worker') {
				// Fallback: For Admin Flow, default to ACTIVE if status not provided
				// (This should not happen as frontend always sends status, but included for safety)
				devicePayload.status = 'ACTIVE';
				console.warn('[MFA Register Device] ⚠️ Status not provided in request - defaulting to ACTIVE for Admin Flow:', {
					deviceType: type,
					status: devicePayload.status,
					statusSource: 'default-ACTIVE',
					tokenType: tokenType,
					isWhatsApp: type === 'WHATSAPP',
					note: 'Frontend should always provide status - this is a fallback',
				});
			} else {
				// Fallback: For User Flow, default to ACTIVATION_REQUIRED (enforced by PingOne)
				// (This should not happen as frontend always sends status, but included for safety)
				devicePayload.status = 'ACTIVATION_REQUIRED';
				console.warn('[MFA Register Device] ⚠️ Status not provided in request - defaulting to ACTIVATION_REQUIRED for User Flow:', {
					deviceType: type,
					status: devicePayload.status,
					statusSource: 'default-ACTIVATION_REQUIRED',
					tokenType: tokenType,
					isWhatsApp: type === 'WHATSAPP',
					note: 'Frontend should always provide status - this is a fallback',
				});
			}
		}
		// According to API docs: policy should be an object with id property
		// Format: { "policy": { "id": "policy-id-string" } }
		// See: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-sms
		// NOTE: For educational purposes, we always include policy.id when available
		// The policy.id comes from the Device Authentication Policy dropdown selection
		// Even though API docs may say it's optional, it's required for proper MFA device configuration
		if (policy) {
			if (typeof policy === 'object' && policy.id) {
				// Already in correct format: { id: "..." }
				// This should be the policy ID selected from the dropdown
				devicePayload.policy = policy;
				console.log('[MFA Register Device] ✅ Policy included in device payload (from dropdown selection):', {
					policyId: policy.id,
					policyObject: policy,
					deviceType: type,
					isWhatsApp: type === 'WHATSAPP',
					note: 'Policy ID comes from Device Authentication Policy dropdown selection',
				});
			} else if (typeof policy === 'string') {
				// Convert string to object format
				devicePayload.policy = { id: policy };
				console.log('[MFA Register Device] ✅ Policy converted from string to object:', {
					policyId: policy,
					deviceType: type,
					isWhatsApp: type === 'WHATSAPP',
				});
			} else {
				// Fallback: use as-is
				devicePayload.policy = policy;
				console.log('[MFA Register Device] ⚠️ Policy used as-is (fallback - unexpected format):', {
					policyType: typeof policy,
					policyValue: policy,
					deviceType: type,
					isWhatsApp: type === 'WHATSAPP',
				});
			}
		} else {
			// Log warning if policy is missing (for educational purposes, we should always include it)
			console.warn('[MFA Register Device] ⚠️ Policy not provided in request body:', {
				deviceType: type,
				isWhatsApp: type === 'WHATSAPP',
				requestBodyKeys: Object.keys(req.body),
				hasPolicyInReqBody: 'policy' in req.body,
				note: 'For educational purposes, policy.id should be included when available. Policy ID should come from Device Authentication Policy dropdown selection.',
			});
		}

		// PingOne API endpoint for device creation
		// Per API docs: POST /environments/{environmentId}/users/{userId}/devices
		// See: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-fido2
		// Note: This is a generic endpoint that works for all device types (SMS, EMAIL, TOTP, FIDO2, etc.)
		// The device type is specified in the request body: { "type": "FIDO2", ... }
		const deviceEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices`;

		console.log('[MFA Register Device] 🔍 REGISTER BACKEND STEP 3: Cleaning token...');
		console.log('[MFA Register Device] 🔍 REGISTER BACKEND STEP 3a: Original token:', {
			originalValue: String(accessToken),
			originalLength: String(accessToken).length,
			originalPreview: `${String(accessToken).substring(0, 30)}...${String(accessToken).substring(Math.max(0, String(accessToken).length - 30))}`,
			hasWhitespace: /\s/.test(String(accessToken)),
			hasNewlines: /[\r\n]/.test(String(accessToken)),
			hasBearerPrefix: /^Bearer\s+/i.test(String(accessToken)),
		});
		
		// Clean token to ensure no whitespace or encoding issues
		const cleanToken = String(accessToken).trim().replace(/^Bearer\s+/i, '').replace(/\s+/g, '').trim();
		
		console.log('[MFA Register Device] 🔍 REGISTER BACKEND STEP 3b: Cleaned token:', {
			cleanedLength: cleanToken.length,
			cleanedPreview: `${cleanToken.substring(0, 30)}...${cleanToken.substring(Math.max(0, cleanToken.length - 30))}`,
			hasWhitespace: /\s/.test(cleanToken),
			hasNewlines: /[\r\n]/.test(cleanToken),
			tokenParts: cleanToken.split('.').length,
			allPartsValid: cleanToken.split('.').length === 3 && cleanToken.split('.').every(p => p.length > 0),
		});

		const requestHeaders = {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${cleanToken}`,
		};
		
		console.log('[MFA Register Device] 🔍 REGISTER BACKEND STEP 4: Request headers constructed:', {
			authorizationHeader: requestHeaders['Authorization'],
			authorizationHeaderLength: requestHeaders['Authorization'].length,
			authorizationPreview: `${requestHeaders['Authorization'].substring(0, 30)}...${requestHeaders['Authorization'].substring(Math.max(0, requestHeaders['Authorization'].length - 30))}`,
			startsWithBearer: requestHeaders['Authorization'].startsWith('Bearer '),
			expectedLength: 'Bearer '.length + cleanToken.length,
			actualLength: requestHeaders['Authorization'].length,
			lengthMatch: requestHeaders['Authorization'].length === ('Bearer '.length + cleanToken.length),
		});
		const requestBody = devicePayload;

		// Log the request details before making the call
		// Explicitly verify type field is present for WhatsApp (and all device types)
		// For WhatsApp: Required fields are type, phone, and policy.id (for educational purposes)
		console.log('[MFA Register Device] Making PingOne API call:', {
			endpoint: deviceEndpoint,
			method: 'POST',
			deviceType: type,
			hasType: 'type' in requestBody,
			typeValue: requestBody.type,
			status: devicePayload.status,
			hasPolicy: !!devicePayload.policy,
			policyId: devicePayload.policy?.id || 'NOT PROVIDED',
			policyObject: devicePayload.policy || null,
			hasPhone: 'phone' in requestBody,
			phoneValue: requestBody.phone,
			hasEmail: 'email' in requestBody,
			emailValue: requestBody.email,
			requestBodyKeys: Object.keys(requestBody),
			requestBodyFull: JSON.stringify(requestBody, null, 2),
			requestBodyPreview: JSON.stringify(requestBody, null, 2).substring(0, 500),
			// WhatsApp-specific validation
			isWhatsApp: type === 'WHATSAPP',
			whatsAppHasRequiredFields: type === 'WHATSAPP' ? (
				requestBody.type === 'WHATSAPP' &&
				!!requestBody.phone &&
				!!requestBody.policy?.id
			) : null,
		});

		const startTime = Date.now();
		const response = await global.fetch(deviceEndpoint, {
			method: 'POST',
			headers: requestHeaders,
			body: JSON.stringify(requestBody),
		});
		const duration = Date.now() - startTime;
		
		console.log('[MFA Register Device] PingOne API call completed:', {
			status: response.status,
			statusText: response.statusText,
			duration: `${duration}ms`,
			deviceType: type,
		});

		// Clone response for logging (before consuming it)
		const responseClone = response.clone();
		
		// Parse response body
		let responseData;
		try {
			const responseText = await responseClone.text();
			try {
				responseData = JSON.parse(responseText);
			} catch {
				responseData = { raw: responseText };
			}
		} catch (e) {
			responseData = { error: 'Failed to parse response', status: response.status, statusText: response.statusText };
		}

		// Comprehensive PingOne API call logging
		// This logs to both console and pingone-api.log file
		// Per PingOne API docs: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-fido2
		// Endpoint: POST /environments/{environmentId}/users/{userId}/devices
		// Request body includes: { "type": "FIDO2", "status": "ACTIVATION_REQUIRED", "policy": { "id": "..." }, ... }
		console.log('[MFA Register Device] Logging PingOne API call:', {
			logFile: pingOneApiLogFile,
			operation: 'Register MFA Device',
			endpoint: deviceEndpoint,
			method: 'POST',
			deviceType: type,
			status: response.status,
		});
		
		logPingOneApiCall(
			'Register MFA Device',
			deviceEndpoint,
			'POST',
			requestHeaders,
			requestBody,
			response,
			responseData,
			duration,
			{
				environmentId,
				userId,
				deviceType: type,
				requestedStatus: status,
				payloadStatus: devicePayload.status,
				statusMatch: status === responseData?.status,
				hasPolicy: !!devicePayload.policy,
				policyId: typeof devicePayload.policy === 'object' && devicePayload.policy?.id 
					? devicePayload.policy.id 
					: devicePayload.policy || 'NOT PROVIDED',
				tokenType: tokenInfo.type,
				tokenLength: accessToken.length,
				tokenHasExp: tokenInfo.hasExp,
				returnedStatus: responseData?.status,
				deviceId: responseData?.id,
				hasDeviceActivateUri: !!responseData?.links?.deviceActivate,
				// FIDO2-specific logging
				isFIDO2: type === 'FIDO2',
				hasPublicKeyCredentialCreationOptions: !!responseData?.publicKeyCredentialCreationOptions,
				publicKeyCredentialCreationOptionsLength: responseData?.publicKeyCredentialCreationOptions?.length || 0,
			}
		);
		console.log('[MFA Register Device] PingOne API call logged successfully');

		if (!response.ok) {
			console.error(' [PINGONE API ERROR] Register MFA Device Failed:', {
				status: response.status,
				statusText: response.statusText,
				error: responseData.error || responseData.message || 'Unknown error',
				details: responseData.details || responseData,
				environmentId,
				userId,
				type,
				tokenType: tokenInfo.type,
				tokenLength: accessToken.length,
				tokenHasExp: tokenInfo.hasExp,
				tokenExpired: tokenInfo.exp ? tokenInfo.exp < Math.floor(Date.now() / 1000) : null,
				requestPayload: {
					type: devicePayload.type,
					status: devicePayload.status,
					hasPhone: !!devicePayload.phone,
					phone: devicePayload.phone || 'MISSING',
					hasEmail: !!devicePayload.email,
					email: devicePayload.email || 'MISSING',
					hasNickname: !!deviceNickname, // Nickname will be set via separate PUT call
					hasPolicy: !!devicePayload.policy,
					policyId: devicePayload.policy?.id || 'MISSING',
					policyObject: devicePayload.policy || null,
				},
				// WhatsApp-specific error details
				isWhatsApp: type === 'WHATSAPP',
				whatsAppValidation: type === 'WHATSAPP' ? {
					hasType: !!devicePayload.type,
					typeValue: devicePayload.type,
					hasPhone: !!devicePayload.phone,
					phoneValue: devicePayload.phone,
					hasPolicy: !!devicePayload.policy,
					policyId: devicePayload.policy?.id || 'MISSING',
					allRequiredFieldsPresent: !!devicePayload.type && !!devicePayload.phone && !!devicePayload.policy?.id,
				} : null,
			});

			// Derive a friendly error message for common WhatsApp configuration issues
			let clientResponseData = responseData || {};
			try {
				const errorCode = clientResponseData.code;
				const details = Array.isArray(clientResponseData.details) ? clientResponseData.details : [];
				const hasWhatsAppDeviceTypeError =
					type === 'WHATSAPP' &&
					(
						errorCode === 'INVALID_DATA' ||
						details.some(
							(detail) =>
								detail &&
								detail.code === 'INVALID_VALUE' &&
								detail.target === 'deviceType' &&
								typeof detail.message === 'string' &&
								detail.message.toLowerCase().includes('whatsapp')
						)
					);

				if (hasWhatsAppDeviceTypeError) {
					const friendlyMessage =
						'WhatsApp MFA is not enabled or not allowed for this environment or Device Authentication Policy. ' +
						'Enable WhatsApp MFA in the PingOne Admin Console (MFA Settings) or select a different policy that allows WhatsApp.';
					clientResponseData = {
						...clientResponseData,
						message: friendlyMessage,
						friendlyCode: 'WHATSAPP_DEVICE_TYPE_NOT_ALLOWED',
						friendlyMessage,
					};
				}
			} catch (e) {
				console.warn('[MFA Register Device] Failed to derive friendly WhatsApp error message:', e);
			}

			return res.status(response.status).json({
				...clientResponseData,
				debug: {
					tokenType: tokenInfo.type,
					tokenLength: accessToken.length,
					tokenExpired: tokenInfo.exp ? tokenInfo.exp < Math.floor(Date.now() / 1000) : null,
					environmentId,
					userId,
					deviceType: type,
				},
			});
		}

		// Parse response data (already parsed above)
		const deviceData = responseData;
		
		// FIDO2-specific: Check for publicKeyCredentialCreationOptions
		const hasPublicKeyOptions = type === 'FIDO2' && !!deviceData.publicKeyCredentialCreationOptions;
		const publicKeyOptionsLength = deviceData.publicKeyCredentialCreationOptions?.length || 0;
		
		console.log('✅ [PINGONE API SUCCESS] Register MFA Device:', {
			deviceId: deviceData.id,
			type: deviceData.type,
			requestedStatus: status,
			returnedStatus: deviceData.status,
			statusMatch: status === deviceData.status,
			hasProperties: !!deviceData.properties,
			hasSecret: !!deviceData.properties?.secret,
			hasKeyUri: !!deviceData.properties?.keyUri,
			hasDeviceActivateUri: !!deviceData.links?.deviceActivate,
			deviceActivateUri: deviceData.links?.deviceActivate?.href,
			tokenType: tokenInfo.type,
			// FIDO2-specific logging
			isFIDO2: type === 'FIDO2',
			hasPublicKeyCredentialCreationOptions: hasPublicKeyOptions,
			publicKeyCredentialCreationOptionsLength: publicKeyOptionsLength,
			publicKeyCredentialCreationOptionsPreview: deviceData.publicKeyCredentialCreationOptions?.substring(0, 100) || 'N/A',
			rpId: deviceData.rp?.id,
			rpName: deviceData.rp?.name,
			fullResponse: deviceData, // Log full response for debugging
		});
		
		// Warn if FIDO2 device is missing publicKeyCredentialCreationOptions
		if (type === 'FIDO2' && !hasPublicKeyOptions) {
			console.warn('[MFA Register Device] ⚠️ FIDO2 DEVICE MISSING publicKeyCredentialCreationOptions:', {
				deviceId: deviceData.id,
				status: deviceData.status,
				deviceDataKeys: Object.keys(deviceData),
				note: 'FIDO2 devices with ACTIVATION_REQUIRED status should return publicKeyCredentialCreationOptions',
			});
		}
		
		// Warn if status doesn't match what was requested
		if (status && status !== deviceData.status) {
			console.warn('[MFA Register Device] ⚠️ STATUS MISMATCH:', {
				requested: status,
				returned: deviceData.status,
				deviceId: deviceData.id,
				deviceType: deviceData.type,
				note: 'PingOne may have auto-activated the device or overridden the status based on policy configuration',
			});
		}
		
		// Update device nickname if provided (nickname is not valid in create request)
		// See: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#put-update-device-nickname
		if (deviceNickname && deviceNickname.trim() && deviceData.id) {
			try {
				const nicknameEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceData.id}/nickname`;
				const nicknamePayload = { nickname: deviceNickname.trim() };
				
				const nicknameStartTime = Date.now();
				const nicknameResponse = await global.fetch(nicknameEndpoint, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${accessToken}`,
					},
					body: JSON.stringify(nicknamePayload),
				});
				const nicknameDuration = Date.now() - nicknameStartTime;
				
				// Clone response for logging
				const nicknameResponseClone = nicknameResponse.clone();
				let nicknameResponseData;
				try {
					const nicknameResponseText = await nicknameResponseClone.text();
					try {
						nicknameResponseData = JSON.parse(nicknameResponseText);
					} catch {
						nicknameResponseData = { raw: nicknameResponseText };
					}
				} catch (e) {
					nicknameResponseData = { error: 'Failed to parse response', status: nicknameResponse.status, statusText: nicknameResponse.statusText };
				}
				
				// Log the nickname update API call
				logPingOneApiCall(
					'Update Device Nickname',
					nicknameEndpoint,
					'PUT',
					{
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${accessToken.substring(0, 20)}...`,
					},
					nicknamePayload,
					nicknameResponse,
					nicknameResponseData,
					nicknameDuration,
					{
						environmentId,
						userId,
						deviceId: deviceData.id,
						nickname: deviceNickname.trim(),
					}
				);
				
				if (nicknameResponse.ok) {
					console.log('✅ [PINGONE API SUCCESS] Device nickname updated:', {
						deviceId: deviceData.id,
						nickname: deviceNickname.trim(),
					});
					// Update deviceData with the nickname from the response
					if (nicknameResponseData && typeof nicknameResponseData === 'object' && 'nickname' in nicknameResponseData) {
						deviceData.nickname = nicknameResponseData.nickname;
					}
				} else {
					console.warn('⚠️ [PINGONE API WARNING] Failed to update device nickname:', {
						deviceId: deviceData.id,
						status: nicknameResponse.status,
						error: nicknameResponseData,
						note: 'Device was created successfully, but nickname update failed',
					});
					// Don't fail the entire request if nickname update fails
				}
			} catch (nicknameError) {
				console.error('❌ [PINGONE API ERROR] Error updating device nickname:', {
					deviceId: deviceData.id,
					error: nicknameError.message,
					note: 'Device was created successfully, but nickname update failed',
				});
				// Don't fail the entire request if nickname update fails
			}
		}
		
		// FIDO2-specific: Verify publicKeyCredentialCreationOptions is in response
		if (type === 'FIDO2') {
			const hasPublicKeyOptions = !!deviceData.publicKeyCredentialCreationOptions;
			console.log('[FIDO2 Register Device] Response includes publicKeyCredentialCreationOptions:', {
				hasPublicKeyOptions,
				deviceId: deviceData.id,
				status: deviceData.status,
				deviceDataKeys: Object.keys(deviceData),
				publicKeyOptionsLength: deviceData.publicKeyCredentialCreationOptions?.length || 0,
			});
			
			if (!hasPublicKeyOptions && deviceData.status === 'ACTIVATION_REQUIRED') {
				console.error('[FIDO2 Register Device] ⚠️ WARNING: FIDO2 device with ACTIVATION_REQUIRED status missing publicKeyCredentialCreationOptions!', {
					deviceId: deviceData.id,
					status: deviceData.status,
					deviceDataKeys: Object.keys(deviceData),
					note: 'This field is required for WebAuthn registration ceremony',
				});
			}
		}
		
		// Include actual PingOne API call details in response for frontend tracking
		// This allows the frontend to display the actual PingOne API call, not just the proxy
		res.json({
			...deviceData,
			_metadata: {
				actualPingOneUrl: deviceEndpoint,
				actualPingOneMethod: 'POST',
				actualPingOnePayload: devicePayload,
				actualPingOneHeaders: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${accessToken.substring(0, 20)}...` // Truncated for security
				},
				actualPingOneResponse: {
					status: response.status,
					statusText: response.statusText,
					data: deviceData
				}
			}
		});
	} catch (error) {
		console.error('[MFA Register Device] Error:', {
			message: error.message,
			stack: error.stack,
			body: req.body ? {
				hasEnvironmentId: !!req.body.environmentId,
				hasUserId: !!req.body.userId,
				hasType: !!req.body.type,
				hasWorkerToken: !!req.body.workerToken,
				hasUserToken: !!req.body.userToken,
				tokenType: req.body.tokenType,
			} : 'No body',
		});
		res.status(500).json({ error: 'Failed to register device', message: error.message });
	}
});

// Send OTP
// Block MFA Device
app.post('/api/pingone/mfa/block-device', async (req, res) => {
	try {
		const { environmentId, userId, deviceId, workerToken } = req.body;

		if (!environmentId || !userId || !deviceId || !workerToken) {
			return res.status(400).json({ 
				error: 'Missing required fields',
				message: 'environmentId, userId, deviceId, and workerToken are required'
			});
		}

		// Clean and validate token
		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		const blockEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}`;

		console.log('[MFA Block Device] Blocking device:', { environmentId, userId, deviceId });

		const startTime = Date.now();
		const response = await global.fetch(blockEndpoint, {
			method: 'POST',
			headers: { 
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/vnd.pingidentity.device.block+json',
			},
		});

		const duration = Date.now() - startTime;

		// Clone response for logging
		const responseClone = response.clone();
		let responseData = null;
		if (response.status !== 204 && response.status < 300) {
			try {
				const responseText = await responseClone.text();
				if (responseText) {
					try {
						responseData = JSON.parse(responseText);
					} catch {
						responseData = { raw: responseText };
					}
				}
			} catch {
				responseData = { error: 'Failed to parse response' };
			}
		}

		// Log the API call
		logPingOneApiCall(
			'Block MFA Device',
			blockEndpoint,
			'POST',
			{
				Authorization: `Bearer ${cleanToken.substring(0, 30)}...`,
				'Content-Type': 'application/vnd.pingidentity.device.block+json',
			},
			null,
			response,
			responseData,
			duration,
			{
				operation: 'block-device',
				environmentId,
				userId,
				deviceId,
			}
		);

		if (!response.ok && response.status !== 204) {
			let errorData;
			try {
				errorData = await response.json();
			} catch {
				errorData = { message: response.statusText };
			}
			console.error('[MFA Block Device] PingOne API Error:', {
				status: response.status,
				statusText: response.statusText,
				error: errorData,
			});
			return res.status(response.status).json({
				error: 'Failed to block device',
				message: errorData.message || errorData.error || response.statusText,
			});
		}

		console.log('[MFA Block Device] Device blocked successfully');
		res.status(204).send();
	} catch (error) {
		console.error('[MFA Block Device] Error:', error);
		res.status(500).json({
			error: 'Internal server error',
			message: error.message || 'Failed to block device',
		});
	}
});

// Unlock MFA Device
app.post('/api/pingone/mfa/unlock-device', async (req, res) => {
	try {
		const { environmentId, userId, deviceId, workerToken } = req.body;

		if (!environmentId || !userId || !deviceId || !workerToken) {
			return res.status(400).json({ 
				error: 'Missing required fields',
				message: 'environmentId, userId, deviceId, and workerToken are required'
			});
		}

		// Clean and validate token
		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		const unlockEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}`;

		console.log('[MFA Unlock Device] Unlocking device:', { environmentId, userId, deviceId });

		const startTime = Date.now();
		const response = await global.fetch(unlockEndpoint, {
			method: 'POST',
			headers: { 
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/vnd.pingidentity.device.unlock+json',
			},
		});

		const duration = Date.now() - startTime;

		// Clone response for logging
		const responseClone = response.clone();
		let responseData = null;
		if (response.status !== 204 && response.status < 300) {
			try {
				const responseText = await responseClone.text();
				if (responseText) {
					try {
						responseData = JSON.parse(responseText);
					} catch {
						responseData = { raw: responseText };
					}
				}
			} catch {
				responseData = { error: 'Failed to parse response' };
			}
		}

		// Log the API call
		logPingOneApiCall(
			'Unlock MFA Device',
			unlockEndpoint,
			'POST',
			{
				Authorization: `Bearer ${cleanToken.substring(0, 30)}...`,
				'Content-Type': 'application/vnd.pingidentity.device.unlock+json',
			},
			null,
			response,
			responseData,
			duration,
			{
				operation: 'unlock-device',
				environmentId,
				userId,
				deviceId,
			}
		);

		if (!response.ok && response.status !== 204) {
			let errorData;
			try {
				errorData = await response.json();
			} catch {
				errorData = { message: response.statusText };
			}
			console.error('[MFA Unlock Device] PingOne API Error:', {
				status: response.status,
				statusText: response.statusText,
				error: errorData,
			});
			return res.status(response.status).json({
				error: 'Failed to unlock device',
				message: errorData.message || errorData.error || response.statusText,
			});
		}

		console.log('[MFA Unlock Device] Device unlocked successfully');
		res.status(204).send();
	} catch (error) {
		console.error('[MFA Unlock Device] Error:', error);
		res.status(500).json({
			error: 'Internal server error',
			message: error.message || 'Failed to unlock device',
		});
	}
});

// Unblock MFA Device
app.post('/api/pingone/mfa/unblock-device', async (req, res) => {
	try {
		const { environmentId, userId, deviceId, workerToken } = req.body;

		if (!environmentId || !userId || !deviceId || !workerToken) {
			return res.status(400).json({ 
				error: 'Missing required fields',
				message: 'environmentId, userId, deviceId, and workerToken are required'
			});
		}

		// Clean and validate token
		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		const unblockEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}`;

		console.log('[MFA Unblock Device] Unblocking device:', { environmentId, userId, deviceId });

		const startTime = Date.now();
		const response = await global.fetch(unblockEndpoint, {
			method: 'POST',
			headers: { 
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/vnd.pingidentity.device.unblock+json',
			},
		});

		const duration = Date.now() - startTime;

		// Clone response for logging
		const responseClone = response.clone();
		let responseData = null;
		if (response.status !== 204 && response.status < 300) {
			try {
				const responseText = await responseClone.text();
				if (responseText) {
					try {
						responseData = JSON.parse(responseText);
					} catch {
						responseData = { raw: responseText };
					}
				}
			} catch (e) {
				responseData = { error: 'Failed to parse response' };
			}
		}

		// Log the API call
		logPingOneApiCall(
			'Unblock MFA Device',
			unblockEndpoint,
			'POST',
			{
				Authorization: `Bearer ${cleanToken.substring(0, 30)}...`,
				'Content-Type': 'application/vnd.pingidentity.device.unblock+json',
			},
			null,
			response,
			responseData,
			duration,
			{
				operation: 'unblock-device',
				environmentId,
				userId,
				deviceId,
			}
		);

		if (!response.ok && response.status !== 204) {
			let errorData;
			try {
				errorData = await response.json();
			} catch {
				errorData = { message: response.statusText };
			}
			console.error('[MFA Unblock Device] PingOne API Error:', {
				status: response.status,
				statusText: response.statusText,
				error: errorData,
			});
			return res.status(response.status).json({
				error: 'Failed to unblock device',
				message: errorData.message || errorData.error || response.statusText,
			});
		}

		console.log('[MFA Unblock Device] Device unblocked successfully');
		res.status(204).send();
	} catch (error) {
		console.error('[MFA Unblock Device] Error:', error);
		res.status(500).json({
			error: 'Internal server error',
			message: error.message || 'Failed to unblock device',
		});
	}
});

// Delete MFA Device
app.post('/api/pingone/mfa/delete-device', async (req, res) => {
	try {
		const { environmentId, userId, deviceId, workerToken } = req.body;

		if (!environmentId || !userId || !deviceId || !workerToken) {
			return res.status(400).json({ 
				error: 'Missing required fields',
				message: 'environmentId, userId, deviceId, and workerToken are required'
			});
		}

		// Clean and validate token
		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		const deleteEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}`;

		console.log('[MFA Delete Device] Deleting device:', { environmentId, userId, deviceId });

		const startTime = Date.now();
		const response = await global.fetch(deleteEndpoint, {
			method: 'DELETE',
			headers: { 
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/json',
			},
		});

		const duration = Date.now() - startTime;

		// Clone response for logging (DELETE typically returns 204 No Content)
		const responseClone = response.clone();
		let responseData = null;
		if (response.status !== 204 && response.status < 300) {
			try {
				const responseText = await responseClone.text();
				if (responseText) {
					try {
						responseData = JSON.parse(responseText);
					} catch {
						responseData = { raw: responseText };
					}
				}
			} catch (e) {
				responseData = { error: 'Failed to parse response' };
			}
		}

		// Log the API call
		logPingOneApiCall(
			'Delete MFA Device',
			deleteEndpoint,
			'DELETE',
			{
				Authorization: `Bearer ${cleanToken.substring(0, 30)}...`,
				'Content-Type': 'application/json',
			},
			null,
			response,
			responseData,
			duration,
			{
				operation: 'delete-device',
				environmentId,
				userId,
				deviceId,
			}
		);

		if (!response.ok && response.status !== 204) {
			let errorData;
			try {
				errorData = await response.json();
			} catch {
				errorData = { message: response.statusText };
			}
			console.error('[MFA Delete Device] PingOne API Error:', {
				status: response.status,
				statusText: response.statusText,
				error: errorData,
			});
			return res.status(response.status).json({
				error: 'Failed to delete device',
				message: errorData.message || errorData.error || response.statusText,
			});
		}

		console.log('[MFA Delete Device] Device deleted successfully');
		res.status(204).send();
	} catch (error) {
		console.error('[MFA Delete Device] Error:', error);
		res.status(500).json({
			error: 'Internal server error',
			message: error.message || 'Failed to delete device',
		});
	}
});

// Update Device Nickname
app.post('/api/pingone/mfa/update-device-nickname', async (req, res) => {
	try {
		const { environmentId, userId, deviceId, nickname, workerToken } = req.body;

		if (!environmentId || !userId || !deviceId || !nickname || !workerToken) {
			return res.status(400).json({ 
				error: 'Missing required fields',
				message: 'environmentId, userId, deviceId, nickname, and workerToken are required'
			});
		}

		// Clean and validate token
		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		const nicknameEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}/nickname`;

		console.log('[MFA Update Device Nickname] Updating nickname:', { environmentId, userId, deviceId, nickname });

		const startTime = Date.now();
		const response = await global.fetch(nicknameEndpoint, {
			method: 'PUT',
			headers: { 
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ nickname: nickname.trim() }),
		});

		const duration = Date.now() - startTime;

		// Clone response for logging
		const responseClone = response.clone();
		let responseData = null;
		if (response.status !== 204 && response.status < 300) {
			try {
				const responseText = await responseClone.text();
				if (responseText) {
					try {
						responseData = JSON.parse(responseText);
					} catch {
						responseData = { raw: responseText };
					}
				}
			} catch {
				responseData = { error: 'Failed to parse response' };
			}
		}

		// Log the API call
		logPingOneApiCall(
			'Update Device Nickname',
			nicknameEndpoint,
			'PUT',
			{
				Authorization: `Bearer ${cleanToken.substring(0, 30)}...`,
				'Content-Type': 'application/json',
			},
			{ nickname: nickname.trim() },
			response,
			responseData,
			duration,
			{
				operation: 'update-device-nickname',
				environmentId,
				userId,
				deviceId,
				nickname: nickname.trim(),
			}
		);

		if (!response.ok) {
			let errorData;
			try {
				errorData = await response.json();
			} catch {
				errorData = { message: response.statusText };
			}
			console.error('[MFA Update Device Nickname] PingOne API Error:', {
				status: response.status,
				statusText: response.statusText,
				error: errorData,
			});
			return res.status(response.status).json({
				error: 'Failed to update device nickname',
				message: errorData.message || errorData.error || response.statusText,
			});
		}

		// Return the response data (PingOne returns the updated device with nickname)
		if (responseData) {
			res.json(responseData);
		} else {
			res.status(204).send();
		}
	} catch (error) {
		console.error('[MFA Update Device Nickname] Error:', error);
		res.status(500).json({
			error: 'Internal server error',
			message: error.message || 'Failed to update device nickname',
		});
	}
});

// Allow MFA Bypass for User
app.post('/api/pingone/mfa/allow-bypass', async (req, res) => {
	try {
		const { environmentId, userId, workerToken } = req.body;

		if (!environmentId || !userId || !workerToken) {
			return res.status(400).json({ 
				error: 'Missing required fields',
				message: 'environmentId, userId, and workerToken are required'
			});
		}

		// Clean and validate token
		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		const bypassEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/mfaBypass`;

		console.log('[MFA Allow Bypass] Allowing bypass for user:', { environmentId, userId });

		const startTime = Date.now();
		const response = await global.fetch(bypassEndpoint, {
			method: 'PUT',
			headers: { 
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ enabled: true }),
		});

		const duration = Date.now() - startTime;

		// Clone response for logging
		const responseClone = response.clone();
		let responseData = null;
		if (response.status !== 204 && response.status < 300) {
			try {
				const responseText = await responseClone.text();
				if (responseText) {
					try {
						responseData = JSON.parse(responseText);
					} catch {
						responseData = { raw: responseText };
					}
				}
			} catch {
				responseData = { error: 'Failed to parse response' };
			}
		}

		// Log the API call
		logPingOneApiCall(
			'Allow MFA Bypass',
			bypassEndpoint,
			'PUT',
			{
				Authorization: `Bearer ${cleanToken.substring(0, 30)}...`,
				'Content-Type': 'application/json',
			},
			{ enabled: true },
			response,
			responseData,
			duration,
			{
				operation: 'allow-bypass',
				environmentId,
				userId,
			}
		);

		if (!response.ok) {
			let errorData;
			try {
				errorData = await response.json();
			} catch {
				errorData = { message: response.statusText };
			}
			console.error('[MFA Allow Bypass] PingOne API Error:', {
				status: response.status,
				statusText: response.statusText,
				error: errorData,
			});
			return res.status(response.status).json({
				error: 'Failed to allow MFA bypass',
				message: errorData.message || errorData.error || response.statusText,
			});
		}

		if (responseData) {
			res.json(responseData);
		} else {
			res.status(204).send();
		}
	} catch (error) {
		console.error('[MFA Allow Bypass] Error:', error);
		res.status(500).json({
			error: 'Internal server error',
			message: error.message || 'Failed to allow MFA bypass',
		});
	}
});

// Check MFA Bypass Status for User
app.post('/api/pingone/mfa/check-bypass', async (req, res) => {
	try {
		const { environmentId, userId, workerToken } = req.body;

		if (!environmentId || !userId || !workerToken) {
			return res.status(400).json({ 
				error: 'Missing required fields',
				message: 'environmentId, userId, and workerToken are required'
			});
		}

		// Clean and validate token
		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		const bypassEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/mfaBypass`;

		console.log('[MFA Check Bypass] Checking bypass status for user:', { environmentId, userId });

		const startTime = Date.now();
		const response = await global.fetch(bypassEndpoint, {
			method: 'GET',
			headers: { 
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/json',
			},
		});

		const duration = Date.now() - startTime;

		// Clone response for logging
		const responseClone = response.clone();
		let responseData = null;
		try {
			const responseText = await responseClone.text();
			if (responseText) {
				try {
					responseData = JSON.parse(responseText);
				} catch {
					responseData = { raw: responseText };
				}
			}
		} catch {
			responseData = { error: 'Failed to parse response' };
		}

		// Log the API call
		logPingOneApiCall(
			'Check MFA Bypass Status',
			bypassEndpoint,
			'GET',
			{
				Authorization: `Bearer ${cleanToken.substring(0, 30)}...`,
				'Content-Type': 'application/json',
			},
			null,
			response,
			responseData,
			duration,
			{
				operation: 'check-bypass',
				environmentId,
				userId,
			}
		);

		if (!response.ok) {
			let errorData;
			try {
				errorData = await response.json();
			} catch {
				errorData = { message: response.statusText };
			}
			console.error('[MFA Check Bypass] PingOne API Error:', {
				status: response.status,
				statusText: response.statusText,
				error: errorData,
			});
			return res.status(response.status).json({
				error: 'Failed to check MFA bypass status',
				message: errorData.message || errorData.error || response.statusText,
			});
		}

		res.json(responseData || {});
	} catch (error) {
		console.error('[MFA Check Bypass] Error:', error);
		res.status(500).json({
			error: 'Internal server error',
			message: error.message || 'Failed to check MFA bypass status',
		});
	}
});

// Set Device Order
app.post('/api/pingone/mfa/set-device-order', async (req, res) => {
	try {
		console.log('[MFA Set Device Order] Request received:', {
			method: req.method,
			path: req.path,
			contentType: req.get('Content-Type'),
			bodyKeys: Object.keys(req.body || {}),
			hasBody: !!req.body,
		});

		const { environmentId, userId, deviceIds, workerToken } = req.body;

		if (!environmentId || !userId || !deviceIds || !Array.isArray(deviceIds) || !workerToken) {
			console.error('[MFA Set Device Order] Missing required fields:', {
				environmentId: !!environmentId,
				userId: !!userId,
				deviceIds: Array.isArray(deviceIds),
				deviceIdsLength: deviceIds?.length,
				workerToken: !!workerToken,
			});
			return res.status(400).json({ 
				error: 'Missing required fields',
				message: 'environmentId, userId, deviceIds (array), and workerToken are required'
			});
		}

		// Clean and validate token
		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		// Per PingOne MFA docs, device order is set via:
		// POST {{apiPath}}/environments/{{envID}}/users/{{userID}}/devices/order
		// Content-Type: application/vnd.pingidentity.devices.reorder+json
		// Body: { "order": [ { "id": "deviceId1" }, { "id": "deviceId2" }, ... ] }
		// Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-set-device-order
		const orderEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/order`;

		console.log('[MFA Set Device Order] Setting device order:', { environmentId, userId, deviceIds });

		const requestHeaders = {
			Authorization: `Bearer ${cleanToken}`,
			'Content-Type': 'application/vnd.pingidentity.devices.reorder+json',
		};
		// PingOne expects order array with objects containing id property: { "order": [ { "id": "deviceId1" }, { "id": "deviceId2" }, ... ] }
		const requestBody = { 
			order: deviceIds.map((deviceId) => ({ id: deviceId }))
		};
		
		console.log('[MFA Set Device Order] Request body:', JSON.stringify(requestBody, null, 2));

		const startTime = Date.now();
		const response = await global.fetch(orderEndpoint, {
			method: 'POST',
			headers: requestHeaders,
			body: JSON.stringify(requestBody),
		});

		const duration = Date.now() - startTime;

		// Clone response for logging
		const responseClone = response.clone();
		let responseData = null;
		if (response.status !== 204 && response.status < 300) {
			try {
				const responseText = await responseClone.text();
				if (responseText) {
					try {
						responseData = JSON.parse(responseText);
					} catch {
						responseData = { raw: responseText };
					}
				}
			} catch {
				responseData = { error: 'Failed to parse response' };
			}
		}

		// Log the API call
		logPingOneApiCall(
			'Set Device Order',
			orderEndpoint,
			'POST',
			{
				Authorization: `Bearer ${cleanToken.substring(0, 30)}...`,
				'Content-Type': 'application/vnd.pingidentity.devices.reorder+json',
			},
			requestBody,
			response,
			responseData,
			duration,
			{
				operation: 'set-device-order',
				environmentId,
				userId,
				deviceCount: deviceIds.length,
			}
		);

		if (!response.ok && response.status !== 204) {
			let errorData;
			try {
				errorData = await response.json();
			} catch {
				errorData = { message: response.statusText };
			}
			console.error('[MFA Set Device Order] PingOne API Error:', {
				status: response.status,
				statusText: response.statusText,
				error: errorData,
			});
			return res.status(response.status).json({
				error: 'Failed to set device order',
				message: errorData.message || errorData.error || response.statusText,
			});
		}

		if (responseData) {
			res.json(responseData);
		} else {
			res.status(204).send();
		}
	} catch (error) {
		console.error('[MFA Set Device Order] Error:', error);
		res.status(500).json({
			error: 'Internal server error',
			message: error.message || 'Failed to set device order',
		});
	}
});

// Remove Device Order
// Note: Frontend sends Content-Type: application/json with body (environmentId, userId, workerToken)
// Backend forwards to PingOne with Content-Type: application/vnd.pingidentity.devices.order.remove+json (no body)
app.post('/api/pingone/mfa/remove-device-order', async (req, res) => {
	try {
		console.log('[MFA Remove Device Order] Received request:', {
			method: req.method,
			path: req.path,
			contentType: req.get('Content-Type'),
			hasBody: !!req.body,
			bodyKeys: req.body ? Object.keys(req.body) : [],
		});
		
		const { environmentId, userId, workerToken } = req.body;

		if (!environmentId || !userId || !workerToken) {
			return res.status(400).json({ 
				error: 'Missing required fields',
				message: 'environmentId, userId, and workerToken are required'
			});
		}

		// Clean and validate token
		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		// According to PingOne API docs: POST /environments/{envID}/users/{userID}/devices
		// with Content-Type: application/vnd.pingidentity.devices.order.remove+json
		// No body is sent - the Content-Type header indicates the operation
		const orderEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices`;

		console.log('[MFA Remove Device Order] Removing device order:', { environmentId, userId });

		const startTime = Date.now();
		const response = await global.fetch(orderEndpoint, {
			method: 'POST',
			headers: { 
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/vnd.pingidentity.devices.order.remove+json',
			},
			// No body - the Content-Type header indicates the operation
		});

		const duration = Date.now() - startTime;

		// Clone response for logging
		const responseClone = response.clone();
		let responseData = null;
		if (response.status !== 204 && response.status < 300) {
			try {
				const responseText = await responseClone.text();
				if (responseText) {
					try {
						responseData = JSON.parse(responseText);
					} catch {
						responseData = { raw: responseText };
					}
				}
			} catch {
				responseData = { error: 'Failed to parse response' };
			}
		}

		// Log the API call
		logPingOneApiCall(
			'Remove Device Order',
			orderEndpoint,
			'POST',
			{
				Authorization: `Bearer ${cleanToken.substring(0, 30)}...`,
				'Content-Type': 'application/vnd.pingidentity.devices.order.remove+json',
			},
			null,
			response,
			responseData,
			duration,
			{
				operation: 'remove-device-order',
				environmentId,
				userId,
			}
		);

		if (!response.ok && response.status !== 204) {
			let errorData;
			try {
				errorData = await response.json();
			} catch {
				errorData = { message: response.statusText };
			}
			console.error('[MFA Remove Device Order] PingOne API Error:', {
				status: response.status,
				statusText: response.statusText,
				error: errorData,
			});
			return res.status(response.status).json({
				error: 'Failed to remove device order',
				message: errorData.message || errorData.error || response.statusText,
			});
		}

		if (responseData) {
			res.json(responseData);
		} else {
			res.status(204).send();
		}
	} catch (error) {
		console.error('[MFA Remove Device Order] Error:', error);
		res.status(500).json({
			error: 'Internal server error',
			message: error.message || 'Failed to remove device order',
		});
	}
});

app.post('/api/pingone/mfa/send-otp', async (req, res) => {
	try {
		const { environmentId, userId, deviceId, workerToken } = req.body;

		if (!environmentId || !userId || !deviceId || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		const otpEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}/otp`;

		const requestHeaders = {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${workerToken}`,
		};
		const requestBody = {};

		const startTime = Date.now();
		const response = await global.fetch(otpEndpoint, {
			method: 'POST',
			headers: requestHeaders,
			body: JSON.stringify(requestBody),
		});
		const duration = Date.now() - startTime;

		// Clone response for logging
		const responseClone = response.clone();
		let responseData;
		try {
			const responseText = await responseClone.text();
			try {
				responseData = JSON.parse(responseText);
			} catch {
				responseData = { raw: responseText };
			}
		} catch (e) {
			responseData = { error: 'Failed to parse response', status: response.status, statusText: response.statusText };
		}

		// Comprehensive PingOne API call logging
		logPingOneApiCall(
			'Send OTP to MFA Device',
			otpEndpoint,
			'POST',
			requestHeaders,
			requestBody,
			response,
			responseData,
			duration,
			{
				environmentId,
				userId,
				deviceId,
			}
		);

		if (!response.ok) {
			return res.status(response.status).json(responseData);
		}

		// Parse response data (already parsed above)
		const otpData = responseData;
		res.json(otpData);
	} catch (error) {
		console.error('[MFA Send OTP] Error:', error);
		res.status(500).json({ error: 'Failed to send OTP', message: error.message });
	}
});

// Validate OTP
app.post('/api/pingone/mfa/validate-otp', async (req, res) => {
	try {
		const { environmentId, userId, deviceId, otp, workerToken } = req.body;

		if (!environmentId || !userId || !deviceId || !otp || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		const validateEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}/otp/check`;

		const requestHeaders = {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${workerToken}`,
		};
		const requestBody = { otp };

		const startTime = Date.now();
		const response = await global.fetch(validateEndpoint, {
			method: 'POST',
			headers: requestHeaders,
			body: JSON.stringify(requestBody),
		});
		const duration = Date.now() - startTime;

		// Clone response for logging
		const responseClone = response.clone();
		let responseData;
		try {
			const responseText = await responseClone.text();
			try {
				responseData = JSON.parse(responseText);
			} catch {
				responseData = { raw: responseText };
			}
		} catch (e) {
			responseData = { error: 'Failed to parse response', status: response.status, statusText: response.statusText };
		}

		// Comprehensive PingOne API call logging
		logPingOneApiCall(
			'Validate OTP for MFA Device',
			validateEndpoint,
			'POST',
			requestHeaders,
			requestBody,
			response,
			responseData,
			duration,
			{
				environmentId,
				userId,
				deviceId,
				hasOtp: !!otp,
				otpLength: otp ? String(otp).length : 0,
			}
		);

		if (!response.ok) {
			// Return 200 with validation result for invalid OTP (not a server error)
			if (response.status === 400 || response.status === 401) {
				return res.json({
					status: 'INVALID',
					message: responseData.message || 'Invalid OTP code',
					valid: false,
				});
			}
			return res.status(response.status).json(responseData);
		}

		// Parse response data (already parsed above)
		const validationData = responseData;
		res.json({
			status: validationData.status || 'VALID',
			message: validationData.message || 'OTP verified successfully',
			valid: true,
		});
	} catch (error) {
		console.error('[MFA Validate OTP] Error:', error);
		res.status(500).json({ error: 'Failed to validate OTP', message: error.message });
	}
});

// Read Device Authentication Status
app.get('/api/pingone/mfa/read-device-authentication', async (req, res) => {
	try {
		const { environmentId, userId, authenticationId, workerToken } = req.query;

		if (!environmentId || !userId || !authenticationId || !workerToken) {
			return res.status(400).json({
				error: 'Missing required fields: environmentId, userId, authenticationId, workerToken',
			});
		}

		// Clean and validate worker token
		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		// PingOne API endpoint for reading device authentication status
		// GET {{authPath}}/{{envID}}/deviceAuthentications/{{deviceAuthID}}
		// API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#get-read-device-authentication
		// Note: This endpoint uses auth.pingone.com, not api.pingone.com
		const region = req.query.region || 'na';
		const tld = region === 'eu' ? 'eu' : region === 'asia' ? 'asia' : 'com';
		const authPath = `https://auth.pingone.${tld}`;
		const readEndpoint = `${authPath}/${environmentId}/deviceAuthentications/${authenticationId}`;

		console.log('[MFA Read Device Auth] Request:', {
			url: readEndpoint,
			environmentId,
			userId,
			authenticationId,
		});

		const startTime = Date.now();
		const response = await global.fetch(readEndpoint, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/json',
			},
		});
		const duration = Date.now() - startTime;
		
		const responseClone = response.clone();
		let responseData;
		try {
			responseData = await responseClone.json();
		} catch {
			responseData = { error: 'Failed to parse response' };
		}
		
		logPingOneApiCall(
			'Read Device Authentication',
			readEndpoint,
			'GET',
			{
				Authorization: `Bearer ${cleanToken.substring(0, 20)}...***REDACTED***`,
				'Content-Type': 'application/json',
			},
			null,
			response,
			responseData,
			duration,
			{ environmentId, userId, authenticationId }
		);

		if (!response.ok) {
			const errorData = responseData || { error: 'Unknown error' };
			console.error('[MFA Read Device Auth] Error:', {
				status: response.status,
				statusText: response.statusText,
				error: errorData,
			});
			return res.status(response.status).json(errorData);
		}

		// responseData was already parsed above for logging
		const authData = responseData;
		console.log('[MFA Read Device Auth] Success:', {
			status: authData.status,
			nextStep: authData.nextStep,
			challengeId: authData.challengeId,
		});
		res.json(authData);
	} catch (error) {
		console.error('[MFA Read Device Auth] Error:', error);
		res.status(500).json({ error: 'Failed to read device authentication', message: error.message });
	}
});

// Activate FIDO2 Device
app.post('/api/pingone/mfa/activate-fido2-device', async (req, res) => {
	const requestStartTime = Date.now();
	logOperationMarker('Activate FIDO2 Device', 'START', {
		endpoint: '/api/pingone/mfa/activate-fido2-device',
		method: 'POST',
		hasBody: !!req.body,
	});
	
	try {
		const { environmentId, userId, deviceId, workerToken, fido2Data } = req.body;

		console.log('[MFA Activate FIDO2 Device] 🔍 BACKEND STEP 1: Request received from frontend:', {
			hasEnvironmentId: !!environmentId,
			hasUserId: !!userId,
			hasDeviceId: !!deviceId,
			hasWorkerToken: !!workerToken,
			workerTokenType: typeof workerToken,
			workerTokenLength: workerToken ? String(workerToken).length : 0,
			workerTokenPreview: workerToken ? `${String(workerToken).substring(0, 30)}...${String(workerToken).substring(Math.max(0, String(workerToken).length - 30))}` : 'MISSING',
			hasFido2Data: !!fido2Data,
			rawRequestBody: JSON.stringify(req.body).substring(0, 1000),
			workerTokenInBody: JSON.stringify(req.body).includes('workerToken'),
		});
		
		// Log the raw request body to see exactly what we received
		console.log('[MFA Activate FIDO2 Device] 🔍 BACKEND STEP 1a: Raw request body analysis:', {
			bodyKeys: Object.keys(req.body || {}),
			workerTokenValue: req.body?.workerToken ? String(req.body.workerToken).substring(0, 100) : 'NOT FOUND',
			workerTokenLength: req.body?.workerToken ? String(req.body.workerToken).length : 0,
			workerTokenType: typeof req.body?.workerToken,
			workerTokenHasWhitespace: req.body?.workerToken ? /\s/.test(String(req.body.workerToken)) : false,
			workerTokenHasNewlines: req.body?.workerToken ? /[\r\n]/.test(String(req.body.workerToken)) : false,
		});

		if (!environmentId || !userId || !deviceId || !workerToken) {
			return res.status(400).json({ 
				error: 'Missing required fields',
				missing: {
					environmentId: !environmentId,
					userId: !userId,
					deviceId: !deviceId,
					workerToken: !workerToken,
				},
			});
		}

		console.log('[MFA Activate FIDO2 Device] 🔍 BACKEND STEP 2: Starting token cleaning process...');
		console.log('[MFA Activate FIDO2 Device] 🔍 BACKEND STEP 2a: Original token (before cleaning):', {
			originalValue: String(workerToken),
			originalLength: String(workerToken).length,
			originalType: typeof workerToken,
			originalPreview: `${String(workerToken).substring(0, 30)}...${String(workerToken).substring(Math.max(0, String(workerToken).length - 30))}`,
			originalBytes: Buffer.from(String(workerToken)).toString('hex').substring(0, 100),
			originalBase64: Buffer.from(String(workerToken)).toString('base64').substring(0, 50),
			hasWhitespace: /\s/.test(String(workerToken)),
			hasNewlines: /[\r\n]/.test(String(workerToken)),
			hasTabs: /\t/.test(String(workerToken)),
			hasBearerPrefix: /^Bearer\s+/i.test(String(workerToken)),
			// Check if it's already the hash from the error
			containsErrorHash: String(workerToken).includes('9WEfItUR1YHLDgcRRN7ijRqt6L+jVulECODxvje/+Lg='),
			// Check if it looks like a JWT
			startsWithEyJ: String(workerToken).trim().replace(/^Bearer\s+/i, '').substring(0, 3) === 'eyJ',
		});
		
		// Clean and validate worker token
		// Ensure we have a clean token without any extra whitespace or encoding issues
		let cleanToken = String(workerToken).trim();
		console.log('[MFA Activate FIDO2 Device] 🔍 BACKEND STEP 2b: After trim:', {
			length: cleanToken.length,
			preview: `${cleanToken.substring(0, 30)}...${cleanToken.substring(Math.max(0, cleanToken.length - 30))}`,
			hasWhitespace: /\s/.test(cleanToken),
		});
		
		// Remove "Bearer " prefix if present
		const beforeBearerRemoval = cleanToken;
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		if (beforeBearerRemoval !== cleanToken) {
			console.log('[MFA Activate FIDO2 Device] 🔍 BACKEND STEP 2c: Removed Bearer prefix');
		}
		
		// Remove all whitespace (spaces, newlines, tabs) - JWT tokens should not have whitespace
		const beforeWhitespaceRemoval = cleanToken;
		cleanToken = cleanToken.replace(/\s+/g, '');
		if (beforeWhitespaceRemoval !== cleanToken) {
			console.log('[MFA Activate FIDO2 Device] 🔍 BACKEND STEP 2d: Removed whitespace:', {
				beforeLength: beforeWhitespaceRemoval.length,
				afterLength: cleanToken.length,
			});
		}
		
		// Remove any control characters (newlines, tabs, carriage returns)
		const beforeControlRemoval = cleanToken;
		cleanToken = cleanToken.replace(/[\r\n\t]/g, '');
		if (beforeControlRemoval !== cleanToken) {
			console.log('[MFA Activate FIDO2 Device] 🔍 BACKEND STEP 2e: Removed control characters');
		}
		
		// Final trim to ensure no leading/trailing whitespace
		cleanToken = cleanToken.trim();

		console.log('[MFA Activate FIDO2 Device] 🔍 BACKEND STEP 2f: Final cleaned token:', {
			originalLength: String(workerToken).length,
			cleanedLength: cleanToken.length,
			lengthDifference: String(workerToken).length - cleanToken.length,
			preview: cleanToken ? `${cleanToken.substring(0, 30)}...${cleanToken.substring(Math.max(0, cleanToken.length - 30))}` : 'EMPTY',
			hasNewlines: cleanToken.includes('\n') || cleanToken.includes('\r'),
			hasTabs: cleanToken.includes('\t'),
			hasSpaces: cleanToken.includes(' '),
			tokenParts: cleanToken.split('.').length,
			allPartsValid: cleanToken.split('.').length === 3 && cleanToken.split('.').every(p => p.length > 0),
			// CRITICAL: Verify this is a JWT token, not a hash
			startsWithEyJ: cleanToken.substring(0, 3) === 'eyJ',
			isJWTFormat: cleanToken.split('.').length === 3,
			// Check if it looks like a hash (44 chars, Base64) - this would be WRONG
			isHashFormat: cleanToken.length === 44 && /^[A-Za-z0-9+/=]+$/.test(cleanToken),
			// Verify token structure
			firstPartLength: cleanToken.split('.')[0]?.length || 0,
			secondPartLength: cleanToken.split('.')[1]?.length || 0,
			thirdPartLength: cleanToken.split('.')[2]?.length || 0,
		});

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		// PingOne API endpoint for FIDO2 device activation
		// Per PingOne API docs: POST /environments/{environmentId}/users/{userId}/devices/{deviceId}
		// The activation action is specified by Content-Type: application/vnd.pingidentity.device.activate+json
		// See: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-activate-mfa-user-device-fido2
		// Note: FIDO2 activation is WebAuthn-based, NOT OTP-based (per fido2-2.md section 1)
		const activateEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}`;

		console.log('[MFA Activate FIDO2 Device] Request:', {
			url: activateEndpoint,
			environmentId,
			userId,
			deviceId,
			hasFido2Data: !!fido2Data,
		});

		// Build request body according to PingOne API docs
		// PingOne expects: { "origin": "...", "attestation": "<JSON.stringify(attestationObj)>" }
		// attestation should be a JSON string containing the full PublicKeyCredential object
		// See: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-activate-mfa-user-device-fido2
		const requestBody = {};
		if (fido2Data) {
			// origin: the RP origin (e.g., "https://your-rp-origin.example.com") - required per rightFIDO2.md
			if (fido2Data.origin) {
				requestBody.origin = fido2Data.origin;
			} else {
				// Extract origin from referer header if available, otherwise use default
				const referer = req.headers.referer || '';
				const originMatch = referer.match(/^https?:\/\/[^\/]+/);
				requestBody.origin = originMatch ? originMatch[0] : 'https://localhost:3000';
			}
			
			// attestation: JSON string containing the full PublicKeyCredential object
			// The frontend should send attestation as JSON.stringify(attestationObj)
			// See: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-activate-mfa-user-device-fido2
			if (fido2Data.attestation) {
				// If it's already a JSON string, use it directly
				// If it's an object, stringify it
				if (typeof fido2Data.attestation === 'string') {
					requestBody.attestation = fido2Data.attestation;
				} else {
					requestBody.attestation = JSON.stringify(fido2Data.attestation);
				}
			} else if (fido2Data.attestationObject) {
				// Legacy support: if attestationObject is provided directly, construct the attestation object
				// This is for backward compatibility but should not be used in new code
				console.warn('[MFA Activate FIDO2 Device] Using legacy attestationObject format. Frontend should send attestation as JSON string per rightFIDO2.md');
				const attestationObj = {
					id: fido2Data.credentialId || '',
					type: 'public-key',
					rawId: fido2Data.rawId || fido2Data.credentialId || '',
					response: {
						clientDataJSON: fido2Data.clientDataJSON || '',
						attestationObject: fido2Data.attestationObject,
					},
					clientExtensionResults: {},
				};
				requestBody.attestation = JSON.stringify(attestationObj);
			}
		}
		
		console.log('[MFA Activate FIDO2 Device] Request body details:', {
			hasAttestation: !!requestBody.attestation,
			attestationLength: requestBody.attestation ? String(requestBody.attestation).length : 0,
			attestationPreview: requestBody.attestation ? `${String(requestBody.attestation).substring(0, 50)}...` : 'MISSING',
			attestationType: typeof requestBody.attestation,
			attestationHasPlus: requestBody.attestation ? String(requestBody.attestation).includes('+') : false,
			attestationHasSlash: requestBody.attestation ? String(requestBody.attestation).includes('/') : false,
			attestationHasEquals: requestBody.attestation ? String(requestBody.attestation).includes('=') : false,
			attestationHasDash: requestBody.attestation ? String(requestBody.attestation).includes('-') : false,
			attestationHasUnderscore: requestBody.attestation ? String(requestBody.attestation).includes('_') : false,
			origin: requestBody.origin,
			hasClientDataJSON: !!requestBody.clientDataJSON,
			clientDataJSONLength: requestBody.clientDataJSON ? String(requestBody.clientDataJSON).length : 0,
			clientDataJSONPreview: requestBody.clientDataJSON ? `${String(requestBody.clientDataJSON).substring(0, 50)}...` : 'MISSING',
			originIsLocalhost: requestBody.origin && requestBody.origin.includes('localhost'),
		});

		// Log request details for debugging
		console.log('[MFA Activate FIDO2 Device] Request body:', {
			hasAttestation: !!requestBody.attestation,
			hasOrigin: !!requestBody.origin,
			hasClientDataJSON: !!requestBody.clientDataJSON,
			attestationLength: requestBody.attestation ? String(requestBody.attestation).length : 0,
			origin: requestBody.origin,
			clientDataJSONLength: requestBody.clientDataJSON ? String(requestBody.clientDataJSON).length : 0,
		});

		// Log the exact JSON body being sent (for debugging)
		const jsonBody = JSON.stringify(requestBody);
		console.log('[MFA Activate FIDO2 Device] JSON Body being sent:', {
			bodyLength: jsonBody.length,
			bodyPreview: jsonBody.substring(0, 300),
			hasAttestation: jsonBody.includes('"attestation"'),
			hasOrigin: jsonBody.includes('"origin"'),
			hasClientDataJSON: jsonBody.includes('"clientDataJSON"'),
			attestationValuePreview: requestBody.attestation ? `${String(requestBody.attestation).substring(0, 50)}...` : 'MISSING',
		});

		console.log('[MFA Activate FIDO2 Device] 🔍 BACKEND STEP 3: Building request headers...');
		// Build headers object explicitly to ensure proper formatting
		const requestHeaders = {
			'Content-Type': 'application/vnd.pingidentity.device.activate+json',
			'Authorization': `Bearer ${cleanToken}`,
			'Accept': 'application/json',
		};

		console.log('[MFA Activate FIDO2 Device] 🔍 BACKEND STEP 3a: Authorization header constructed:', {
			headerValue: requestHeaders['Authorization'],
			headerLength: requestHeaders['Authorization'].length,
			headerPreview: `${requestHeaders['Authorization'].substring(0, 30)}...${requestHeaders['Authorization'].substring(Math.max(0, requestHeaders['Authorization'].length - 30))}`,
			startsWithBearer: requestHeaders['Authorization'].startsWith('Bearer '),
			bearerPrefixLength: 'Bearer '.length,
			tokenPartLength: cleanToken.length,
			expectedHeaderLength: 'Bearer '.length + cleanToken.length,
			actualHeaderLength: requestHeaders['Authorization'].length,
			lengthMatch: requestHeaders['Authorization'].length === ('Bearer '.length + cleanToken.length),
		});

		// Validate Authorization header format before sending
		const authHeader = requestHeaders['Authorization'];
		if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.length < 20) {
			console.error('[MFA Activate FIDO2 Device] ❌ Invalid Authorization header format:', {
				hasHeader: !!authHeader,
				headerPreview: authHeader ? `${authHeader.substring(0, 50)}...` : 'MISSING',
				startsWithBearer: authHeader?.startsWith('Bearer '),
				headerLength: authHeader?.length || 0,
				cleanTokenLength: cleanToken.length,
				cleanTokenPreview: `${cleanToken.substring(0, 30)}...`,
			});
			return res.status(400).json({
				error: 'Invalid Authorization header',
				message: 'Authorization header must be in format: Bearer <token>',
			});
		}

		console.log('[MFA Activate FIDO2 Device] 🔍 BACKEND STEP 3b: Request headers validated:', {
			hasContentType: !!requestHeaders['Content-Type'],
			contentType: requestHeaders['Content-Type'],
			hasAuthorization: !!requestHeaders['Authorization'],
			authorizationPreview: requestHeaders['Authorization'] ? `${requestHeaders['Authorization'].substring(0, 30)}...` : 'MISSING',
			authorizationStartsWithBearer: requestHeaders['Authorization']?.startsWith('Bearer '),
			authorizationLength: requestHeaders['Authorization']?.length || 0,
			tokenLength: cleanToken.length,
			tokenPreview: `${cleanToken.substring(0, 20)}...${cleanToken.substring(cleanToken.length - 20)}`,
			// Verify token parts are valid
			tokenPartsCount: cleanToken.split('.').length,
			tokenPartsValid: cleanToken.split('.').length === 3 && cleanToken.split('.').every(part => part.length > 0),
			fullAuthHeader: requestHeaders['Authorization'],
		});

		console.log('[MFA Activate FIDO2 Device] 🔍 BACKEND STEP 4: Sending request to PingOne API...');
		
		// CRITICAL: Log the EXACT Authorization header bytes/characters before sending
		const authHeaderBeforeSend = requestHeaders['Authorization'];
		console.log('[MFA Activate FIDO2 Device] 🔍 BACKEND STEP 4a: EXACT Authorization header before fetch:', {
			headerValue: authHeaderBeforeSend,
			headerLength: authHeaderBeforeSend.length,
			headerBytes: Buffer.from(authHeaderBeforeSend).toString('hex'),
			headerBase64: Buffer.from(authHeaderBeforeSend).toString('base64'),
			headerCharCodes: Array.from(authHeaderBeforeSend).slice(0, 50).map(c => c.charCodeAt(0)),
			startsWithBearer: authHeaderBeforeSend.startsWith('Bearer '),
			bearerPart: authHeaderBeforeSend.substring(0, 7),
			tokenPart: authHeaderBeforeSend.substring(7),
			tokenPartLength: authHeaderBeforeSend.substring(7).length,
			tokenPartPreview: `${authHeaderBeforeSend.substring(7, 37)}...${authHeaderBeforeSend.substring(Math.max(7, authHeaderBeforeSend.length - 30))}`,
			// Check if token part looks like a JWT (starts with eyJ)
			tokenPartStartsWithEyJ: authHeaderBeforeSend.substring(7, 10) === 'eyJ',
			// Check if it looks like the hash from the error
			containsErrorHash: authHeaderBeforeSend.includes('9WEfItUR1YHLDgcRRN7ijRqt6L+jVulECODxvje/+Lg='),
		});
		
		console.log('[MFA Activate FIDO2 Device] 🔍 BACKEND STEP 4b: Final request details:', {
			endpoint: activateEndpoint,
			method: 'POST',
			headers: {
				'Content-Type': requestHeaders['Content-Type'],
				'Authorization': `${requestHeaders['Authorization'].substring(0, 30)}...${requestHeaders['Authorization'].substring(Math.max(0, requestHeaders['Authorization'].length - 30))}`,
				'Accept': requestHeaders['Accept'],
			},
			authorizationHeaderFull: requestHeaders['Authorization'],
			authorizationHeaderLength: requestHeaders['Authorization'].length,
			bodyLength: jsonBody.length,
			bodyPreview: jsonBody.substring(0, 200),
		});
		
		// CRITICAL: Verify headers object one more time right before fetch
		console.log('[MFA Activate FIDO2 Device] 🔍 BACKEND STEP 4c: Headers object verification:', {
			headersType: typeof requestHeaders,
			headersKeys: Object.keys(requestHeaders),
			authorizationKey: 'Authorization' in requestHeaders,
			authorizationValue: requestHeaders['Authorization'],
			authorizationValueType: typeof requestHeaders['Authorization'],
			authorizationValueLength: requestHeaders['Authorization']?.length || 0,
			// Check if headers object was modified
			headersStringified: JSON.stringify(requestHeaders).substring(0, 500),
		});
		
		// CRITICAL: Log what we're actually passing to fetch
		const fetchOptions = {
			method: 'POST',
			headers: requestHeaders,
			body: jsonBody,
		};
		
		// CRITICAL: Log the EXACT Authorization header bytes before fetch
		const authHeaderForFetch = fetchOptions.headers['Authorization'];
		console.log('[MFA Activate FIDO2 Device] 🔍 BACKEND STEP 4d: Authorization header EXACT bytes before fetch:', {
			headerValue: authHeaderForFetch,
			headerLength: authHeaderForFetch?.length || 0,
			headerBytesHex: authHeaderForFetch ? Buffer.from(authHeaderForFetch).toString('hex').substring(0, 200) : 'MISSING',
			headerBytesBase64: authHeaderForFetch ? Buffer.from(authHeaderForFetch).toString('base64').substring(0, 100) : 'MISSING',
			headerCharCodes: authHeaderForFetch ? Array.from(authHeaderForFetch).slice(0, 50).map(c => c.charCodeAt(0)) : [],
			startsWithBearer: authHeaderForFetch?.startsWith('Bearer '),
			bearerPart: authHeaderForFetch?.substring(0, 7),
			tokenPart: authHeaderForFetch?.substring(7),
			tokenPartLength: authHeaderForFetch?.substring(7)?.length || 0,
			tokenPartStartsWithEyJ: authHeaderForFetch?.substring(7, 10) === 'eyJ',
			// Check if token part could be the hash from error
			tokenPartIsHash: authHeaderForFetch?.substring(7)?.length === 44 && /^[A-Za-z0-9+/=]+$/.test(authHeaderForFetch.substring(7)),
		});
		
		console.log('[MFA Activate FIDO2 Device] 🔍 BACKEND STEP 4e: Full fetch options:', {
			method: fetchOptions.method,
			headersKeys: Object.keys(fetchOptions.headers),
			headersAuth: fetchOptions.headers['Authorization'],
			headersAuthLength: fetchOptions.headers['Authorization']?.length || 0,
			headersAuthType: typeof fetchOptions.headers['Authorization'],
			bodyLength: fetchOptions.body.length,
			// Log all headers to see if anything is modifying them
			allHeaders: JSON.stringify(fetchOptions.headers).substring(0, 500),
		});
		
		// CRITICAL: Create a copy of headers to ensure they're not modified
		const headersCopy = JSON.parse(JSON.stringify(fetchOptions.headers));
		console.log('[MFA Activate FIDO2 Device] 🔍 BACKEND STEP 4f: Headers copy verification:', {
			originalAuth: fetchOptions.headers['Authorization'],
			copyAuth: headersCopy['Authorization'],
			areEqual: fetchOptions.headers['Authorization'] === headersCopy['Authorization'],
			copyAuthLength: headersCopy['Authorization']?.length || 0,
		});
		
		// CRITICAL: Log right before the actual fetch call
		console.log('[MFA Activate FIDO2 Device] 🔍 BACKEND STEP 4g: About to call fetch with:', {
			url: activateEndpoint,
			method: 'POST',
			headersAuthValue: headersCopy['Authorization'],
			headersAuthLength: headersCopy['Authorization']?.length || 0,
			headersAuthBytes: headersCopy['Authorization'] ? Buffer.from(headersCopy['Authorization']).toString('hex').substring(0, 100) : 'MISSING',
			bodyLength: jsonBody.length,
		});
		
		// CRITICAL: Verify headers one final time and ensure they're in the correct format for node-fetch
		// node-fetch expects headers as a plain object, not Headers instance
		const finalHeaders = {
			'Content-Type': headersCopy['Content-Type'],
			'Authorization': headersCopy['Authorization'],
			'Accept': headersCopy['Accept'],
		};
		
		console.log('[MFA Activate FIDO2 Device] 🔍 BACKEND STEP 4h: Final headers for node-fetch:', {
			headersType: typeof finalHeaders,
			headersKeys: Object.keys(finalHeaders),
			authorizationValue: finalHeaders['Authorization'],
			authorizationLength: finalHeaders['Authorization']?.length || 0,
			authorizationStartsWithBearer: finalHeaders['Authorization']?.startsWith('Bearer '),
			authorizationTokenPart: finalHeaders['Authorization']?.substring(7),
			tokenPartLength: finalHeaders['Authorization']?.substring(7)?.length || 0,
			tokenPartStartsWithEyJ: finalHeaders['Authorization']?.substring(7, 10) === 'eyJ',
			// Verify it's not a hash
			tokenPartIsHash: (() => {
				const tokenPart = finalHeaders['Authorization']?.substring(7) || '';
				return tokenPart.length === 44 && /^[A-Za-z0-9+/=]+$/.test(tokenPart) && !tokenPart.startsWith('eyJ');
			})(),
			// Full headers as JSON
			headersJSON: JSON.stringify(finalHeaders).substring(0, 500),
		});
		
		// CRITICAL: Use node-fetch directly (imported at top) to bypass wrapper
		// This ensures headers are passed exactly as we construct them
		console.log('[MFA Activate FIDO2 Device] 🔍 BACKEND STEP 4i: Using direct node-fetch import:', {
			url: activateEndpoint,
			method: 'POST',
			headersAuth: finalHeaders['Authorization'],
			headersAuthLength: finalHeaders['Authorization']?.length || 0,
			headersAuthPreview: finalHeaders['Authorization']?.substring(0, 50),
		});
		
		// CRITICAL: Use node-fetch directly with explicit header handling
		// Create a new Headers object to ensure proper formatting
		const nodeFetchHeaders = new Headers();
		nodeFetchHeaders.set('Content-Type', finalHeaders['Content-Type']);
		nodeFetchHeaders.set('Authorization', finalHeaders['Authorization']);
		nodeFetchHeaders.set('Accept', finalHeaders['Accept']);
		
		// Verify the Headers object has the correct token
		const authFromHeaders = nodeFetchHeaders.get('Authorization');
		console.log('[MFA Activate FIDO2 Device] 🔍 BACKEND STEP 4j: Headers object before fetch:', {
			authValue: authFromHeaders,
			authLength: authFromHeaders?.length || 0,
			authStartsWithBearer: authFromHeaders?.startsWith('Bearer '),
			tokenPart: authFromHeaders?.substring(7),
			tokenPartLength: authFromHeaders?.substring(7)?.length || 0,
			tokenPartStartsWithEyJ: authFromHeaders?.substring(7, 10) === 'eyJ',
			// Check if it's already a hash
			tokenPartIsHash: (() => {
				const tokenPart = authFromHeaders?.substring(7) || '';
				return tokenPart.length === 44 && /^[A-Za-z0-9+/=]+$/.test(tokenPart) && !tokenPart.startsWith('eyJ');
			})(),
		});
		
		// CRITICAL FIX: Use https module directly to avoid any header normalization issues
		// This ensures the Authorization header is sent exactly as we construct it
		// IMPORTANT: Use cleanToken directly to avoid any corruption from JSON.stringify/parse cycles
		const url = new URL(activateEndpoint);
		const postData = jsonBody;
		
		// Build Authorization header directly from cleanToken (the validated JWT)
		// This avoids any potential corruption from multiple header copies
		const authorizationHeader = `Bearer ${cleanToken}`;
		
		console.log('[MFA Activate FIDO2 Device] 🔍 BACKEND STEP 4m: Direct Authorization header construction:', {
			cleanTokenLength: cleanToken.length,
			cleanTokenPreview: `${cleanToken.substring(0, 30)}...${cleanToken.substring(Math.max(0, cleanToken.length - 30))}`,
			authorizationHeader: authorizationHeader,
			authorizationHeaderLength: authorizationHeader.length,
			authorizationHeaderStartsWithBearer: authorizationHeader.startsWith('Bearer '),
			tokenPartMatches: authorizationHeader.substring(7) === cleanToken,
		});
		
		const options = {
			hostname: url.hostname,
			port: url.port || 443,
			path: url.pathname + url.search,
			method: 'POST',
			headers: {
				'Content-Type': 'application/vnd.pingidentity.device.activate+json',
				'Authorization': authorizationHeader, // Use cleanToken directly - no intermediate copies
				'Accept': 'application/json',
				'Content-Length': Buffer.byteLength(postData),
			},
		};
		
		console.log('[MFA Activate FIDO2 Device] 🔍 BACKEND STEP 4k: Using https module directly:', {
			hostname: options.hostname,
			path: options.path,
			authorizationHeader: options.headers['Authorization'],
			authorizationLength: options.headers['Authorization']?.length || 0,
			authorizationPreview: options.headers['Authorization']?.substring(0, 50),
		});
		
		// CRITICAL: Log the EXACT bytes that will be sent in the Authorization header
		const authHeaderBytes = Buffer.from(options.headers['Authorization'], 'utf8');
		console.log('[MFA Activate FIDO2 Device] 🔍 BACKEND STEP 4l: EXACT bytes being sent to PingOne:', {
			authHeaderString: options.headers['Authorization'],
			authHeaderBytesHex: authHeaderBytes.toString('hex').substring(0, 200),
			authHeaderBytesLength: authHeaderBytes.length,
			authHeaderFirstBytes: Array.from(authHeaderBytes.slice(0, 20)),
			authHeaderLastBytes: Array.from(authHeaderBytes.slice(-20)),
			// Verify it's still a JWT
			authHeaderStartsWithBearer: options.headers['Authorization'].startsWith('Bearer '),
			tokenPart: options.headers['Authorization'].substring(7),
			tokenPartStartsWithEyJ: options.headers['Authorization'].substring(7, 10) === 'eyJ',
			tokenPartLength: options.headers['Authorization'].substring(7).length,
		});
		
		const startTime = Date.now();
		const response = await new Promise((resolve, reject) => {
			// CRITICAL: Add request listener to log what's actually being sent
			const req = https.request(options, (res) => {
				let data = '';
				res.on('data', (chunk) => { data += chunk; });
				res.on('end', () => {
					// Convert plain headers object to Headers-like object with entries() method
					const headersObj = res.headers;
					
					// Create headers object with entries() method
					const createHeadersObject = (headers) => {
						return {
							...headers,
							entries: function() {
								return Object.entries(headers);
							},
							forEach: function(callback) {
								Object.entries(headers).forEach(([key, value]) => callback(value, key));
							},
							get: function(name) {
								return headers[name.toLowerCase()] || headers[name];
							},
						};
					};
					
					const headersWithEntries = createHeadersObject(headersObj);
					
					const responseObj = {
						ok: res.statusCode >= 200 && res.statusCode < 300,
						status: res.statusCode,
						statusText: res.statusMessage,
						headers: headersWithEntries,
						json: async () => {
							try {
								return JSON.parse(data);
							} catch {
								return { error: 'Failed to parse response', raw: data };
							}
						},
						text: async () => data,
						clone: function() { 
							// Return a new object with the same data, preserving headers structure
							// Recreate headers object to ensure entries() method is available
							const clonedHeaders = createHeadersObject(headersObj);
							return {
								ok: this.ok,
								status: this.status,
								statusText: this.statusText,
								headers: clonedHeaders,
								text: async () => data,
								json: async () => {
									try {
										return JSON.parse(data);
									} catch {
										return { error: 'Failed to parse response', raw: data };
									}
								},
							};
						},
					};
					resolve(responseObj);
				});
			});
			req.on('error', (error) => {
				console.error('[MFA Activate FIDO2 Device] ❌ HTTPS request error:', {
					error: error.message,
					code: error.code,
					stack: error.stack,
				});
				reject(error);
			});
			
			// Log the actual request being sent (headers are already set)
			console.log('[MFA Activate FIDO2 Device] 🔍 BACKEND STEP 4m: About to send HTTPS request:', {
				hostname: options.hostname,
				path: options.path,
				method: options.method,
				headersKeys: Object.keys(options.headers),
				authorizationHeader: options.headers['Authorization'],
				authorizationLength: options.headers['Authorization']?.length || 0,
				bodyLength: postData.length,
			});
			
			req.write(postData);
			req.end();
		});
		const duration = Date.now() - startTime;
		
		// CRITICAL: Log immediately after fetch to see if anything changed
		console.log('[MFA Activate FIDO2 Device] 🔍 BACKEND STEP 4h: After fetch call:', {
			status: response.status,
			statusText: response.statusText,
			responseHeaders: response.headers && typeof response.headers.entries === 'function' 
				? Object.fromEntries(response.headers.entries())
				: response.headers,
		});
		
		console.log('[MFA Activate FIDO2 Device] 🔍 BACKEND STEP 5: PingOne API response received:', {
			status: response.status,
			statusText: response.statusText,
			duration: `${duration}ms`,
			hasBody: !!response.body,
		});

		// Clone response for logging (before consuming the body)
		const responseClone = response.clone();
		let responseData;
		let responseText;
		try {
			responseText = await responseClone.text();
			try {
				responseData = JSON.parse(responseText);
			} catch {
				responseData = { raw: responseText };
			}
		} catch (e) {
			responseData = { error: 'Failed to parse response', status: response.status, statusText: response.statusText };
			responseText = '';
		}

		// Log the PingOne API call - use the actual headers that were sent (options.headers)
		// CRITICAL: Use options.headers (the actual headers sent via https.request) not headersCopy
		logPingOneApiCall(
			'Activate FIDO2 Device',
			activateEndpoint,
			'POST',
			options.headers, // Use the actual headers that were sent to PingOne (built from cleanToken)
			requestBody,
			response,
			responseData,
			duration,
			{
				environmentId,
				userId,
				deviceId,
				hasAttestation: !!requestBody.attestation,
				attestationLength: requestBody.attestation ? String(requestBody.attestation).length : 0,
				hasOrigin: !!requestBody.origin,
				origin: requestBody.origin,
				isFIDO2: true,
				// Add token debugging info
				tokenLength: cleanToken.length,
				tokenStartsWithEyJ: cleanToken.substring(0, 3) === 'eyJ',
				tokenIsJWT: cleanToken.split('.').length === 3,
			}
		);

		// Log request/response summary to server.log for easier reading
		logRequestResponseSummary(
			activateEndpoint,
			'POST',
			response.status,
			response.statusText,
			duration,
			`Activate FIDO2 Device - ${response.ok ? 'SUCCESS' : 'FAILED'}`,
			{
				environmentId,
				userId,
				deviceId,
				hasAttestation: !!requestBody.attestation,
				origin: requestBody.origin,
			}
		);

		if (!response.ok) {
			// Use already parsed error data from logging
			const errorData = responseData;
			const errorText = (typeof responseText === 'string' ? responseText : JSON.stringify(responseData)) || '';
			// Log detailed attestation format info
			const attestationStr = requestBody.attestation ? String(requestBody.attestation) : '';
			const attestationInfo = attestationStr ? {
				length: attestationStr.length,
				preview: `${attestationStr.substring(0, 50)}...`,
				hasPlus: attestationStr.includes('+'),
				hasSlash: attestationStr.includes('/'),
				hasEquals: attestationStr.includes('='),
				hasDash: attestationStr.includes('-'),
				hasUnderscore: attestationStr.includes('_'),
				isBase64url: !attestationStr.includes('+') && !attestationStr.includes('/') && !attestationStr.includes('='),
				firstChars: attestationStr.substring(0, 20),
			} : null;

		console.error('[MFA Activate FIDO2 Device] PingOne API Error:', {
			status: response.status,
			statusText: response.statusText,
			url: activateEndpoint,
			error: errorData,
			errorText: errorText.substring(0, 500),
			requestBodyKeys: Object.keys(requestBody),
			attestationInfo,
			requestBody: {
				...requestBody,
				// Don't log full attestation/clientDataJSON (too long), just lengths
				attestation: requestBody.attestation ? `[${String(requestBody.attestation).length} chars]` : undefined,
				clientDataJSON: requestBody.clientDataJSON ? `[${String(requestBody.clientDataJSON).length} chars]` : undefined,
			},
			origin: requestBody.origin,
			originIsLocalhost: requestBody.origin && requestBody.origin.includes('localhost'),
			workerTokenPreview: cleanToken ? `${cleanToken.substring(0, 20)}...` : 'MISSING',
			// Check if error mentions origin/RPID
			errorMentionsOrigin: errorText.toLowerCase().includes('origin') || errorText.toLowerCase().includes('rpid') || errorText.toLowerCase().includes('relying party'),
		});
			return res.status(response.status).json({
				error: 'Failed to activate FIDO2 device',
				message: (errorData && typeof errorData === 'object' && (errorData.message || errorData.error)) || response.statusText,
				details: errorData,
				// Include origin info in error response for debugging
				debugInfo: {
					origin: requestBody.origin,
					originIsLocalhost: requestBody.origin && requestBody.origin.includes('localhost'),
					hint: 'If origin is localhost, you may need to configure allowed origins in PingOne FIDO2 policy settings',
				},
			});
		}

		// Use already parsed response data from logging
		const activationData = responseData;
		const totalDuration = Date.now() - requestStartTime;
		console.log('[MFA Activate FIDO2 Device] Success:', {
			deviceId,
			status: activationData.status,
		});
		
		// Log operation end marker
		logOperationMarker('Activate FIDO2 Device', 'END', {
			status: 'SUCCESS',
			deviceId,
			totalDuration: `${totalDuration}ms`,
		});
		
		res.json(activationData);
	} catch (error) {
		const totalDuration = Date.now() - requestStartTime;
		console.error('[MFA Activate FIDO2 Device] Error:', error);
		
		// Log operation end marker with error
		logOperationMarker('Activate FIDO2 Device', 'END', {
			status: 'ERROR',
			error: error.message,
			totalDuration: `${totalDuration}ms`,
		});
		
		res.status(500).json({ error: 'Failed to activate FIDO2 device', message: error.message });
	}
});

// Check Assertion (FIDO Device)
// POST {{authPath}}/{{envID}}/deviceAuthentications/{{deviceAuthID}}
// Content-Type: application/vnd.pingidentity.assertion.check+json
app.post('/api/pingone/mfa/check-fido2-assertion', async (req, res) => {
	try {
		const { deviceAuthId, assertion } = req.body;

		console.log('[MFA Check FIDO2 Assertion] Received request:', {
			hasDeviceAuthId: !!deviceAuthId,
			hasAssertion: !!assertion,
			assertionKeys: assertion ? Object.keys(assertion) : [],
		});

		if (!deviceAuthId || !assertion) {
			return res.status(400).json({
				error: 'Missing required fields',
				missing: {
					deviceAuthId: !deviceAuthId,
					assertion: !assertion,
				},
			});
		}

		// Extract worker token from request
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(401).json({
				error: 'Missing or invalid Authorization header',
				message: 'Bearer token is required',
			});
		}

		let cleanToken = authHeader.replace(/^Bearer\s+/i, '').trim();
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		// Extract environment ID from deviceAuthId or request
		// The deviceAuthId format is typically: {{envID}}/deviceAuthentications/{{id}}
		// Or we might need to get it from the request body
		const envIdMatch = deviceAuthId.match(/^([^/]+)\//);
		const environmentId = envIdMatch ? envIdMatch[1] : req.body.environmentId;

		if (!environmentId) {
			return res.status(400).json({
				error: 'Missing environment ID',
				message: 'Could not extract environment ID from deviceAuthId or request body',
			});
		}

		// PingOne API endpoint for Check Assertion (FIDO Device)
		// POST {{authPath}}/{{envID}}/deviceAuthentications/{{deviceAuthID}}
		// Content-Type: application/vnd.pingidentity.assertion.check+json
		// Note: authPath is typically https://auth.pingone.com (or .eu, .asia, .ca)
		const region = req.body.region || 'us';
		const authPath = region === 'us' 
			? 'https://auth.pingone.com'
			: `https://auth.pingone.${region}`;
		
		// Extract the actual deviceAuthId (remove envId prefix if present)
		const actualDeviceAuthId = deviceAuthId.includes('/') 
			? deviceAuthId.split('/').pop() 
			: deviceAuthId;

		const checkAssertionEndpoint = `${authPath}/${environmentId}/deviceAuthentications/${actualDeviceAuthId}`;

		console.log('[MFA Check FIDO2 Assertion] Request:', {
			url: checkAssertionEndpoint,
			environmentId,
			deviceAuthId: actualDeviceAuthId,
			hasAssertion: !!assertion,
		});

		// Build request body according to PingOne API spec
		// The body should contain the assertion object with id, rawId, type, and response
		const requestBody = {
			assertion: {
				id: assertion.id,
				rawId: assertion.rawId,
				type: assertion.type || 'public-key',
				response: {
					clientDataJSON: assertion.response.clientDataJSON,
					authenticatorData: assertion.response.authenticatorData,
					signature: assertion.response.signature,
					...(assertion.response.userHandle && { userHandle: assertion.response.userHandle }),
				},
			},
		};

		console.log('[MFA Check FIDO2 Assertion] Request body:', {
			hasId: !!requestBody.assertion.id,
			hasRawId: !!requestBody.assertion.rawId,
			hasClientDataJSON: !!requestBody.assertion.response.clientDataJSON,
			hasAuthenticatorData: !!requestBody.assertion.response.authenticatorData,
			hasSignature: !!requestBody.assertion.response.signature,
			hasUserHandle: !!requestBody.assertion.response.userHandle,
		});

		// Log the exact request body structure for debugging
		console.log('[MFA Check FIDO2 Assertion] Request body structure (matching PingOne API spec):', {
			assertion: {
				id: requestBody.assertion.id ? `${requestBody.assertion.id.substring(0, 20)}...` : 'missing',
				rawId: requestBody.assertion.rawId ? `${requestBody.assertion.rawId.substring(0, 20)}...` : 'missing',
				type: requestBody.assertion.type,
				response: {
					clientDataJSON: requestBody.assertion.response.clientDataJSON ? `${requestBody.assertion.response.clientDataJSON.substring(0, 20)}...` : 'missing',
					authenticatorData: requestBody.assertion.response.authenticatorData ? `${requestBody.assertion.response.authenticatorData.substring(0, 20)}...` : 'missing',
					signature: requestBody.assertion.response.signature ? `${requestBody.assertion.response.signature.substring(0, 20)}...` : 'missing',
					userHandle: requestBody.assertion.response.userHandle ? `${requestBody.assertion.response.userHandle.substring(0, 20)}...` : 'not included',
				},
			},
		});

		const startTime = Date.now();
		const response = await global.fetch(checkAssertionEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/vnd.pingidentity.assertion.check+json',
				Authorization: `Bearer ${cleanToken}`,
				Accept: 'application/json',
			},
			body: JSON.stringify(requestBody),
		});
		
		const duration = Date.now() - startTime;
		
		// Clone response for logging (before consuming body)
		const responseClone = response.clone();
		let responseData;
		try {
			responseData = await responseClone.json();
		} catch {
			responseData = { error: 'Failed to parse response' };
		}
		
		// Log the actual PingOne API call
		logPingOneApiCall(
			'Check Assertion (FIDO Device)',
			checkAssertionEndpoint,
			'POST',
			{
				'Content-Type': 'application/vnd.pingidentity.assertion.check+json',
				Authorization: `Bearer ${cleanToken.substring(0, 20)}...***REDACTED***`,
				Accept: 'application/json',
			},
			requestBody,
			response,
			responseData,
			duration,
			{
				environmentId,
				deviceAuthId: actualDeviceAuthId,
				hasAssertion: !!assertion,
			}
		);

		if (!response.ok) {
			// responseData was already parsed above for logging
			const errorData = responseData || { error: { message: response.statusText } };

			// Check for NO_USABLE_DEVICES error
			if (errorData.error?.code === 'NO_USABLE_DEVICES') {
				console.error('[MFA Check FIDO2 Assertion] NO_USABLE_DEVICES error detected:', {
					message: errorData.error.message,
					unavailableDevices: errorData.error.unavailableDevices || [],
				});
				return res.status(400).json({
					error: 'NO_USABLE_DEVICES',
					message: errorData.error.message || 'No usable devices found for authentication',
					unavailableDevices: errorData.error.unavailableDevices || [],
					status: 'FAILED',
					details: errorData,
				});
			}

			console.error('[MFA Check FIDO2 Assertion] PingOne API Error:', {
				status: response.status,
				statusText: response.statusText,
				url: checkAssertionEndpoint,
				error: errorData,
			});
			return res.status(response.status).json({
				error: 'Failed to check FIDO2 assertion',
				message: errorData.error?.message || errorData.message || response.statusText,
				details: errorData,
			});
		}

		// responseData was already parsed above for logging
		const assertionData = responseData;
		console.log('[MFA Check FIDO2 Assertion] Success:', {
			status: assertionData.status,
			nextStep: assertionData.nextStep,
		});
		res.json(assertionData);
	} catch (error) {
		console.error('[MFA Check FIDO2 Assertion] Error:', error);
		res.status(500).json({ 
			error: 'Failed to check FIDO2 assertion', 
			message: error.message 
		});
	}
});

// Activate TOTP Device
// According to totp.md section 1.4:
// POST {{apiPath}}/environments/{{envID}}/users/{{userID}}/devices/{{deviceID}}
// Content-Type: application/vnd.pingidentity.device.activate+json
// Body: { "otp": "123456" }
app.post('/api/pingone/mfa/activate-totp-device', async (req, res) => {
	try {
		const { environmentId, userId, deviceId, workerToken, otp } = req.body;

		console.log('[MFA Activate TOTP Device] Received request:', {
			hasEnvironmentId: !!environmentId,
			hasUserId: !!userId,
			hasDeviceId: !!deviceId,
			hasWorkerToken: !!workerToken,
			hasOtp: !!otp,
			otpLength: otp ? String(otp).length : 0,
		});

		if (!environmentId || !userId || !deviceId || !workerToken || !otp) {
			return res.status(400).json({
				error: 'Missing required fields',
				missing: {
					environmentId: !environmentId,
					userId: !userId,
					deviceId: !deviceId,
					workerToken: !workerToken,
					otp: !otp,
				},
			});
		}

		// Clean and validate worker token
		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		// PingOne API endpoint for TOTP device activation
		// POST {{apiPath}}/environments/{{envID}}/users/{{userID}}/devices/{{deviceID}}
		// Content-Type: application/vnd.pingidentity.device.activate+json
		const activateEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}`;

		console.log('[MFA Activate TOTP Device] Request:', {
			url: activateEndpoint,
			environmentId,
			userId,
			deviceId,
			hasOtp: !!otp,
		});

		// Build request body according to totp.md spec
		const requestBody = {
			otp: String(otp).trim(),
		};

		const response = await global.fetch(activateEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/vnd.pingidentity.device.activate+json',
				Authorization: `Bearer ${cleanToken}`,
				Accept: 'application/json',
			},
			body: JSON.stringify(requestBody),
		});

		if (!response.ok) {
			const errorText = await response.text();
			let errorData;
			try {
				errorData = JSON.parse(errorText);
			} catch {
				errorData = { error: 'Unknown error', message: errorText || response.statusText };
			}
			console.error('[MFA Activate TOTP Device] PingOne API Error:', {
				status: response.status,
				statusText: response.statusText,
				url: activateEndpoint,
				error: errorData,
			});
			return res.status(response.status).json({
				error: 'Failed to activate TOTP device',
				message: errorData.message || errorData.error || response.statusText,
				details: errorData,
			});
		}

		const activationData = await response.json();
		console.log('[MFA Activate TOTP Device] Success:', {
			deviceId,
			status: activationData.status,
		});
		res.json(activationData);
	} catch (error) {
		console.error('[MFA Activate TOTP Device] Error:', error);
		res.status(500).json({
			error: 'Failed to activate TOTP device',
			message: error.message,
		});
	}
});

// Activate SMS/EMAIL Device with OTP
// Per rightOTP.md: Use the exact activation URI returned by PingOne if provided
// Otherwise use: POST {{apiPath}}/environments/{{envID}}/users/{{userID}}/devices/{{deviceID}}
// Content-Type: application/vnd.pingidentity.device.activate+json
// Body: { "otp": "123456" }
// Same pattern as TOTP activation
app.post('/api/pingone/mfa/activate-device', async (req, res) => {
	try {
		const { environmentId, userId, deviceId, workerToken, otp, deviceActivateUri } = req.body;

		console.log('[MFA Activate Device] Received request:', {
			hasEnvironmentId: !!environmentId,
			hasUserId: !!userId,
			hasDeviceId: !!deviceId,
			hasWorkerToken: !!workerToken,
			hasOtp: !!otp,
			otpLength: otp ? String(otp).length : 0,
		});

		if (!environmentId || !userId || !deviceId || !workerToken || !otp) {
			return res.status(400).json({
				error: 'Missing required fields',
				missing: {
					environmentId: !environmentId,
					userId: !userId,
					deviceId: !deviceId,
					workerToken: !workerToken,
					otp: !otp,
				},
			});
		}

		// Clean and validate worker token
		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		// PingOne API endpoint for SMS/EMAIL device activation
		// Per rightOTP.md: Use the exact activation URI returned by PingOne if provided
		// Otherwise use standard endpoint pattern (same as TOTP)
		// Content-Type: application/vnd.pingidentity.device.activate+json
		const activateEndpoint = deviceActivateUri || `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}`;

		// Build request body according to rightOTP.md
		const requestBody = {
			otp: String(otp).trim(),
		};

		const requestHeaders = {
			'Content-Type': 'application/vnd.pingidentity.device.activate+json',
			'Authorization': `Bearer ${cleanToken}`,
			'Accept': 'application/json',
		};

		const startTime = Date.now();
		const response = await global.fetch(activateEndpoint, {
			method: 'POST',
			headers: requestHeaders,
			body: JSON.stringify(requestBody),
		});
		const duration = Date.now() - startTime;

		// Clone response for logging
		const responseClone = response.clone();
		let responseData;
		try {
			const responseText = await responseClone.text();
			try {
				responseData = JSON.parse(responseText);
			} catch {
				responseData = { raw: responseText };
			}
		} catch (e) {
			responseData = { error: 'Failed to parse response', status: response.status, statusText: response.statusText };
		}

		// Comprehensive PingOne API call logging
		logPingOneApiCall(
			'Activate MFA Device (SMS/EMAIL)',
			activateEndpoint,
			'POST',
			requestHeaders,
			requestBody,
			response,
			responseData,
			duration,
			{
				environmentId,
				userId,
				deviceId,
				hasOtp: !!otp,
				otpLength: otp ? String(otp).length : 0,
				usedDeviceActivateUri: !!deviceActivateUri,
			}
		);

		if (!response.ok) {
			console.error('[MFA Activate Device] PingOne API Error:', {
				status: response.status,
				statusText: response.statusText,
				url: activateEndpoint,
				error: responseData,
			});
			return res.status(response.status).json({
				error: 'Failed to activate device',
				message: responseData.message || responseData.error || response.statusText,
				details: responseData,
			});
		}

		// Parse response data (already parsed above)
		const activationData = responseData;
		console.log('[MFA Activate Device] Success:', {
			deviceId,
			status: activationData.status,
		});
		res.json(activationData);
	} catch (error) {
		console.error('[MFA Activate Device] Error:', error);
		res.status(500).json({
			error: 'Failed to activate device',
			message: error.message,
		});
	}
});

// Lookup User by Username
app.post('/api/pingone/mfa/lookup-user', async (req, res) => {
	try {
		const { environmentId, username, workerToken } = req.body;

		if (!environmentId || !username || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		const usersEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users?filter=username eq "${username}"`;

		const requestHeaders = {
			'Authorization': `Bearer ${workerToken}`,
		};

		const startTime = Date.now();
		const response = await global.fetch(usersEndpoint, {
			method: 'GET',
			headers: requestHeaders,
		});
		const duration = Date.now() - startTime;

		// Clone response for logging
		const responseClone = response.clone();
		let responseData;
		try {
			const responseText = await responseClone.text();
			try {
				responseData = JSON.parse(responseText);
			} catch {
				responseData = { raw: responseText };
			}
		} catch (e) {
			responseData = { error: 'Failed to parse response', status: response.status, statusText: response.statusText };
		}

		// Comprehensive PingOne API call logging
		logPingOneApiCall(
			'Lookup User by Username',
			usersEndpoint,
			'GET',
			requestHeaders,
			null, // No body for GET request
			response,
			responseData,
			duration,
			{
				environmentId,
				username,
				filter: `username eq "${username}"`,
			}
		);

		if (!response.ok) {
			return res.status(response.status).json(responseData);
		}

		// Parse response data (already parsed above)
		const data = responseData;

		if (!data._embedded?.users || data._embedded.users.length === 0) {
			return res.status(404).json({ error: 'User not found', username });
		}

		const user = data._embedded.users[0];
		res.json({
			id: user.id,
			username: user.username,
			email: user.email,
			name: user.name,
		});
	} catch (error) {
		console.error('[MFA Lookup User] Error:', error);
		res.status(500).json({ error: 'Failed to lookup user', message: error.message });
	}
});

// Read Single Device Authentication Policy (GET with policyId param)
app.get('/api/pingone/mfa/device-authentication-policies/:policyId', async (req, res) => {
	try {
		const { policyId } = req.params;
		const { environmentId, workerToken } = req.query;

		if (!environmentId || !workerToken) {
			return res
				.status(400)
				.json({ error: 'Missing required fields: environmentId and workerToken' });
		}

		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		const region = req.query.region || 'na';
		const apiBase =
			region === 'eu'
				? 'https://api.pingone.eu'
				: region === 'asia'
					? 'https://api.pingone.asia'
					: 'https://api.pingone.com';

		const policyEndpoint = `${apiBase}/v1/environments/${environmentId}/deviceAuthenticationPolicies/${policyId}`;

		console.log('[MFA Device Auth Policy] Request:', {
			url: policyEndpoint,
			environmentId,
			policyId,
		});

		const response = await global.fetch(policyEndpoint, {
			method: 'GET',
			headers: { Authorization: `Bearer ${cleanToken}` },
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			console.error('[MFA Device Auth Policy] Error:', errorData);
			return res.status(response.status).json(errorData);
		}

		const policyData = await response.json();
		res.json(policyData);
	} catch (error) {
		console.error('[MFA Device Auth Policy] Error:', error);
		res
			.status(500)
			.json({ error: 'Failed to read device authentication policy', message: error.message });
	}
});

// Get User Authentication Reports
// Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#reporting
// Endpoint: GET /v1/environments/{environmentId}/userMfaDeviceAuthentications
app.post('/api/pingone/mfa/user-authentication-reports', async (req, res) => {
	try {
		const { environmentId, queryParams, workerToken } = req.body;
		if (!environmentId || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}
		
		// Clean token: remove Bearer prefix, whitespace, and ensure it's a valid JWT
		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();
		
		// Log token diagnostics before validation
		const tokenParts = cleanToken.split('.');
		console.log('[MFA User Authentication Reports] Token diagnostics:', {
			originalLength: String(workerToken).length,
			cleanedLength: cleanToken.length,
			tokenParts: tokenParts.length,
			firstPartLength: tokenParts[0]?.length || 0,
			secondPartLength: tokenParts[1]?.length || 0,
			thirdPartLength: tokenParts[2]?.length || 0,
			tokenPreview: cleanToken.substring(0, 50),
			tokenEnd: cleanToken.substring(cleanToken.length - 20),
			hasDots: cleanToken.includes('.'),
		});
		
		// Validate JWT format (should have 3 parts separated by dots)
		if (tokenParts.length !== 3) {
			return res.status(400).json({
				error: 'Invalid token format',
				message: `Worker token must be a valid JWT (3 parts separated by dots). Found ${tokenParts.length} parts.`,
				diagnostics: {
					tokenLength: cleanToken.length,
					tokenParts: tokenParts.length,
					tokenPreview: cleanToken.substring(0, 50),
				},
			});
		}
		
		// Additional validation: JWT parts should not be empty
		if (tokenParts.some((part) => !part || part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid token format',
				message: 'Worker token JWT parts cannot be empty',
				diagnostics: {
					tokenParts: tokenParts.length,
					partLengths: tokenParts.map((p) => p.length),
				},
			});
		}
		
		const region = req.body.region || 'na';
		const apiBase =
			region === 'eu'
				? 'https://api.pingone.eu'
				: region === 'asia'
					? 'https://api.pingone.asia'
					: 'https://api.pingone.com';
		// Note: According to PingOne MFA API docs, user authentication reports endpoint is:
		// GET /v1/environments/{envID}/userMfaDeviceAuthentications
		// This is NOT a reporting endpoint, it's a direct query endpoint
		const reportsEndpoint = `${apiBase}/v1/environments/${environmentId}/userMfaDeviceAuthentications${queryParams ? `?${queryParams}` : ''}`;
		
		console.log('[MFA User Authentication Reports] Endpoint details:', {
			apiBase,
			environmentId,
			hasQueryParams: !!queryParams,
			fullEndpoint: reportsEndpoint,
			endpointPath: `/v1/environments/${environmentId}/userMfaDeviceAuthentications`,
		});

		console.log('[MFA User Authentication Reports] Fetching reports:', {
			environmentId,
			hasQueryParams: !!queryParams,
			tokenLength: cleanToken.length,
			tokenPreview: cleanToken.substring(0, 20) + '...',
			tokenParts: cleanToken.split('.').length,
			tokenStartsWith: cleanToken.substring(0, 10),
			endpoint: reportsEndpoint,
		});

		// Ensure token is a valid JWT (3 parts separated by dots)
		if (cleanToken.split('.').length !== 3) {
			return res.status(400).json({
				error: 'Invalid token format',
				message: `Worker token must be a valid JWT (3 parts separated by dots). Found ${cleanToken.split('.').length} parts.`,
				tokenPreview: cleanToken.substring(0, 50),
			});
		}

		const startTime = Date.now();
		// Ensure Authorization header is exactly "Bearer <token>" with no extra spaces
		const authHeader = `Bearer ${cleanToken}`.trim();
		
		// Validate the token one more time before sending
		const finalTokenParts = cleanToken.split('.');
		if (finalTokenParts.length !== 3 || finalTokenParts.some((part) => !part || part.length === 0)) {
			console.error('[MFA User Authentication Reports] Token validation failed before sending:', {
				parts: finalTokenParts.length,
				partLengths: finalTokenParts.map((p) => p.length),
				tokenPreview: cleanToken.substring(0, 50),
			});
			return res.status(400).json({
				error: 'Invalid token format',
				message: 'Worker token failed final validation before sending to PingOne',
			});
		}
		
		// Verify authHeader format is exactly "Bearer <token>" with valid JWT structure
		if (!authHeader.startsWith('Bearer ') || authHeader.length <= 7) {
			console.error('[MFA User Authentication Reports] Invalid Authorization header format:', {
				authHeaderLength: authHeader.length,
				authHeaderPreview: authHeader.substring(0, 30),
				hasBearer: authHeader.startsWith('Bearer '),
				tokenParts: cleanToken.split('.').length,
			});
			return res.status(400).json({
				error: 'Invalid Authorization header format',
				message: 'Authorization header must be in format: Bearer <token>',
			});
		}
		
		// Build headers object explicitly
		const requestHeaders = {
			Authorization: authHeader,
			Accept: 'application/json',
		};

		console.log('[MFA User Authentication Reports] Making request to PingOne:', {
			method: 'GET',
			url: reportsEndpoint,
			authHeaderLength: authHeader.length,
			authHeaderStartsWith: authHeader.substring(0, 20),
			tokenLength: cleanToken.length,
			tokenParts: finalTokenParts.length,
			tokenFirstChars: cleanToken.substring(0, 20),
			tokenLastChars: cleanToken.substring(cleanToken.length - 20),
			authHeaderFormat: authHeader.startsWith('Bearer ') ? 'correct' : 'incorrect',
			authHeaderExact: authHeader.substring(0, 30) + '...',
			requestHeadersKeys: Object.keys(requestHeaders),
			requestHeadersAuthorizationType: typeof requestHeaders.Authorization,
			requestHeadersAuthorizationValue: requestHeaders.Authorization.substring(0, 50) + '...',
			requestHeadersAuthorizationLength: requestHeaders.Authorization.length,
		});

		// Log the exact request configuration before sending
		console.log('[MFA User Authentication Reports] Sending request to PingOne:', {
			method: 'GET',
			url: reportsEndpoint,
			headers: {
				Authorization: `${requestHeaders.Authorization.substring(0, 30)}...***REDACTED***`,
				Accept: requestHeaders.Accept,
			},
			headerCount: Object.keys(requestHeaders).length,
			authorizationHeaderType: typeof requestHeaders.Authorization,
			authorizationHeaderLength: requestHeaders.Authorization.length,
		});

		// For GET requests, do NOT include Content-Type header
		// Only include Authorization and Accept headers
		// Use explicit headers object to ensure no modification
		// IMPORTANT: Do NOT send a body for GET requests
		const fetchOptions = {
			method: 'GET',
			headers: requestHeaders,
		};
		
		// Ensure no body is sent (explicitly set to undefined)
		// Some fetch implementations might add a body if not explicitly set
		console.log('[MFA User Authentication Reports] Fetch options:', {
			method: fetchOptions.method,
			hasBody: 'body' in fetchOptions,
			headerCount: Object.keys(fetchOptions.headers).length,
			headerKeys: Object.keys(fetchOptions.headers),
		});
		
		const response = await global.fetch(reportsEndpoint, fetchOptions);
		
		const duration = Date.now() - startTime;
		
		// Log the actual PingOne API call
		const responseClone = response.clone();
		let responseData;
		try {
			responseData = await responseClone.json();
		} catch {
			responseData = { error: 'Failed to parse response' };
		}
		
		logPingOneApiCall(
			'MFA User Authentication Reports',
			reportsEndpoint,
			'GET',
			{
				Authorization: `Bearer ${cleanToken.substring(0, 20)}...***REDACTED***`,
				Accept: 'application/json',
			},
			null,
			response,
			responseData,
			duration,
			{
				environmentId,
				hasQueryParams: !!queryParams,
			}
		);

		if (!response.ok) {
			// Use responseData that was already parsed for logging
			const errorData = responseData || { error: 'Unknown error' };
			console.error('[MFA User Authentication Reports] Error:', {
				status: response.status,
				statusText: response.statusText,
				endpoint: reportsEndpoint,
				error: errorData,
				authHeaderSent: authHeader.substring(0, 30) + '...',
				tokenLength: cleanToken.length,
				tokenParts: cleanToken.split('.').length,
			});
			
			// Provide more helpful error messages
			if (response.status === 403) {
				const errorMessage = errorData.message || errorData.error || errorData.error_description || 'Forbidden';
				
				// Check if the error is about Authorization header format
				if (errorMessage.includes('Invalid key=value pair') || errorMessage.includes('missing equal-sign')) {
					console.error('[MFA User Authentication Reports] Authorization header format issue detected:', {
						authHeaderLength: authHeader.length,
						authHeaderStartsWith: authHeader.substring(0, 20),
						tokenLength: cleanToken.length,
						tokenIsValidJWT: cleanToken.split('.').length === 3,
						fullAuthHeader: authHeader, // Log full header for debugging
					});
					
					return res.status(403).json({
						error: 'Authorization Header Format Error',
						message: `403 Forbidden: ${errorMessage}. ` +
							`The worker token may be corrupted or invalid. ` +
							`Please generate a new worker token using the "Manage Token" button. ` +
							`If the issue persists, ensure your worker token has the 'p1:read:report' or 'p1:read:environment' scope.`,
						details: {
							...errorData,
							tokenLength: cleanToken.length,
							tokenParts: cleanToken.split('.').length,
							diagnostics: 'Token validation passed, but PingOne rejected the Authorization header format',
						},
						endpoint: reportsEndpoint,
					});
				}
				
				return res.status(403).json({
					error: 'Access Denied',
					message: `403 Forbidden: ${errorMessage}. ` +
						`This endpoint requires specific permissions. ` +
						`Ensure your worker token has the 'p1:read:report' or 'p1:read:environment' scope. ` +
						`Note: User authentication reports may require additional MFA reporting permissions.`,
					details: errorData,
					endpoint: reportsEndpoint,
				});
			}
			
			return res.status(response.status).json({
				error: errorData.error || 'Unknown error',
				message: errorData.message || errorData.error_description || response.statusText,
				details: errorData,
			});
		}

		// responseData was already parsed above for logging
		const reportsData = responseData;
		console.log('[MFA User Authentication Reports] Success:', {
			count: reportsData._embedded?.userMfaDeviceAuthentications?.length || 0,
		});
		res.json(reportsData);
	} catch (error) {
		console.error('[MFA User Authentication Reports] Error:', error);
		res
			.status(500)
			.json({ error: 'Failed to get user authentication reports', message: error.message });
	}
});

// ============================================================================
// PingOne MFA Reporting API Endpoints
// API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#reporting
// ============================================================================

/**
 * Create Report of SMS Devices - Entries in Response
 * POST /v1/environments/{envID}/reports/smsDevices
 * Creates a report of SMS devices with entries returned directly in the response
 */
app.post('/api/pingone/mfa/reports/create-sms-devices-report', async (req, res) => {
	try {
		const { environmentId, workerToken, filter, limit } = req.body;
		if (!environmentId || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields: environmentId, workerToken' });
		}

		// Clean and validate token
		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();
		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3) {
			return res.status(400).json({
				error: 'Invalid token format',
				message: 'Worker token must be a valid JWT (3 parts separated by dots)',
			});
		}

		const region = req.body.region || 'na';
		const apiBase =
			region === 'eu'
				? 'https://api.pingone.eu'
				: region === 'asia'
					? 'https://api.pingone.asia'
					: 'https://api.pingone.com';
		
		// Build query parameters
		const queryParams = new URLSearchParams();
		if (filter) queryParams.append('filter', filter);
		if (limit) queryParams.append('limit', limit.toString());

		const reportsEndpoint = `${apiBase}/v1/environments/${environmentId}/reports/smsDevices${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

		console.log('[MFA Reports] Creating SMS devices report:', {
			environmentId,
			hasFilter: !!filter,
			hasLimit: !!limit,
		});

		const startTime = Date.now();
		const response = await global.fetch(reportsEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${cleanToken}`,
			},
		});

		const duration = Date.now() - startTime;
		const responseClone = response.clone();
		let responseData;
		try {
			responseData = await responseClone.json();
		} catch {
			responseData = { error: 'Failed to parse response' };
		}

		logPingOneApiCall(
			'Create SMS Devices Report',
			reportsEndpoint,
			'POST',
			{
				'Content-Type': 'application/json',
				Authorization: `Bearer ${cleanToken.substring(0, 20)}...***REDACTED***`,
			},
			{ filter, limit },
			response,
			responseData,
			duration,
			{ environmentId, hasFilter: !!filter, hasLimit: !!limit }
		);

		if (!response.ok) {
			const errorData = responseData || { error: 'Unknown error' };
			if (response.status === 403) {
				const errorMessage = errorData.message || errorData.error || errorData.error_description || 'Forbidden';
				return res.status(403).json({
					error: 'Access Denied',
					message: `403 Forbidden: ${errorMessage}. ` +
						`This endpoint requires specific permissions. ` +
						`Ensure your worker token has the 'p1:read:report' or 'p1:read:environment' scope.`,
					details: errorData,
					endpoint: reportsEndpoint,
				});
			}
			return res.status(response.status).json({
				error: errorData.error || 'Unknown error',
				message: errorData.message || errorData.error_description || response.statusText,
				details: errorData,
			});
		}

		console.log('[MFA Reports] SMS devices report created successfully');
		res.json(responseData);
	} catch (error) {
		console.error('[MFA Reports] Create SMS devices report error:', error);
		res.status(500).json({ error: 'Failed to create SMS devices report', message: error.message });
	}
});

/**
 * Get Report Results - Entries in Response
 * GET /v1/environments/{envID}/reports/{reportID}
 * Retrieves report results when entries are in the response
 */
app.post('/api/pingone/mfa/reports/get-report-results', async (req, res) => {
	try {
		const { environmentId, reportId, workerToken } = req.body;
		if (!environmentId || !reportId || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields: environmentId, reportId, workerToken' });
		}

		// Clean and validate token
		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();
		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3) {
			return res.status(400).json({
				error: 'Invalid token format',
				message: 'Worker token must be a valid JWT (3 parts separated by dots)',
			});
		}

		const region = req.body.region || 'na';
		const apiBase =
			region === 'eu'
				? 'https://api.pingone.eu'
				: region === 'asia'
					? 'https://api.pingone.asia'
					: 'https://api.pingone.com';

		const reportsEndpoint = `${apiBase}/v1/environments/${environmentId}/reports/${reportId}`;

		console.log('[MFA Reports] Getting report results:', {
			environmentId,
			reportId,
		});

		const startTime = Date.now();
		// For GET requests, do NOT include Content-Type header
		// Only include Authorization and Accept headers
		const response = await global.fetch(reportsEndpoint, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${cleanToken}`,
				Accept: 'application/json',
			},
		});

		const duration = Date.now() - startTime;
		const responseClone = response.clone();
		let responseData;
		try {
			responseData = await responseClone.json();
		} catch {
			responseData = { error: 'Failed to parse response' };
		}

		logPingOneApiCall(
			'Get Report Results',
			reportsEndpoint,
			'GET',
			{
				'Content-Type': 'application/json',
				Authorization: `Bearer ${cleanToken.substring(0, 20)}...***REDACTED***`,
			},
			null,
			response,
			responseData,
			duration,
			{ environmentId, reportId }
		);

		if (!response.ok) {
			const errorData = responseData || { error: 'Unknown error' };
			if (response.status === 403) {
				const errorMessage = errorData.message || errorData.error || errorData.error_description || 'Forbidden';
				return res.status(403).json({
					error: 'Access Denied',
					message: `403 Forbidden: ${errorMessage}. ` +
						`This endpoint requires specific permissions. ` +
						`Ensure your worker token has the 'p1:read:report' or 'p1:read:environment' scope.`,
					details: errorData,
					endpoint: reportsEndpoint,
				});
			}
			return res.status(response.status).json({
				error: errorData.error || 'Unknown error',
				message: errorData.message || errorData.error_description || response.statusText,
				details: errorData,
			});
		}

		console.log('[MFA Reports] Report results retrieved successfully');
		res.json(responseData);
	} catch (error) {
		console.error('[MFA Reports] Get report results error:', error);
		res.status(500).json({ error: 'Failed to get report results', message: error.message });
	}
});

/**
 * Create Report of MFA-Enabled Devices - Results in File
 * POST /v1/environments/{envID}/reports/mfaEnabledDevices
 * Creates a report of MFA-enabled devices with results stored in a file (requires polling)
 */
app.post('/api/pingone/mfa/reports/create-mfa-enabled-devices-report', async (req, res) => {
	try {
		const { environmentId, workerToken, filter, limit } = req.body;
		if (!environmentId || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields: environmentId, workerToken' });
		}

		// Clean and validate token
		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();
		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3) {
			return res.status(400).json({
				error: 'Invalid token format',
				message: 'Worker token must be a valid JWT (3 parts separated by dots)',
			});
		}

		const region = req.body.region || 'na';
		const apiBase =
			region === 'eu'
				? 'https://api.pingone.eu'
				: region === 'asia'
					? 'https://api.pingone.asia'
					: 'https://api.pingone.com';

		// Build query parameters
		const queryParams = new URLSearchParams();
		if (filter) queryParams.append('filter', filter);
		if (limit) queryParams.append('limit', limit.toString());

		const reportsEndpoint = `${apiBase}/v1/environments/${environmentId}/reports/mfaEnabledDevices${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

		console.log('[MFA Reports] Creating MFA-enabled devices report:', {
			environmentId,
			hasFilter: !!filter,
			hasLimit: !!limit,
		});

		const startTime = Date.now();
		const response = await global.fetch(reportsEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${cleanToken}`,
			},
		});

		const duration = Date.now() - startTime;
		const responseClone = response.clone();
		let responseData;
		try {
			responseData = await responseClone.json();
		} catch {
			responseData = { error: 'Failed to parse response' };
		}

		logPingOneApiCall(
			'Create MFA-Enabled Devices Report',
			reportsEndpoint,
			'POST',
			{
				'Content-Type': 'application/json',
				Authorization: `Bearer ${cleanToken.substring(0, 20)}...***REDACTED***`,
			},
			{ filter, limit },
			response,
			responseData,
			duration,
			{ environmentId, hasFilter: !!filter, hasLimit: !!limit }
		);

		if (!response.ok) {
			const errorData = responseData || { error: 'Unknown error' };
			if (response.status === 403) {
				const errorMessage = errorData.message || errorData.error || errorData.error_description || 'Forbidden';
				return res.status(403).json({
					error: 'Access Denied',
					message: `403 Forbidden: ${errorMessage}. ` +
						`This endpoint requires specific permissions. ` +
						`Ensure your worker token has the 'p1:read:report' or 'p1:read:environment' scope.`,
					details: errorData,
					endpoint: reportsEndpoint,
				});
			}
			return res.status(response.status).json({
				error: errorData.error || 'Unknown error',
				message: errorData.message || errorData.error_description || response.statusText,
				details: errorData,
			});
		}

		console.log('[MFA Reports] MFA-enabled devices report created successfully', {
			reportId: responseData.id,
			status: responseData.status,
		});
		res.json(responseData);
	} catch (error) {
		console.error('[MFA Reports] Create MFA-enabled devices report error:', error);
		res.status(500).json({ error: 'Failed to create MFA-enabled devices report', message: error.message });
	}
});

// Get Device Authentication Reports
app.post('/api/pingone/mfa/device-authentication-reports', async (req, res) => {
	try {
		const { environmentId, queryParams, workerToken } = req.body;
		if (!environmentId || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}
		const cleanToken = String(workerToken).trim();
		const region = req.body.region || 'na';
		const apiBase =
			region === 'eu'
				? 'https://api.pingone.eu'
				: region === 'asia'
					? 'https://api.pingone.asia'
					: 'https://api.pingone.com';
		const reportsEndpoint = `${apiBase}/v1/environments/${environmentId}/mfaDeviceAuthentications${queryParams ? `?${queryParams}` : ''}`;

		console.log('[MFA Device Authentication Reports] Fetching reports:', {
			environmentId,
			hasQueryParams: !!queryParams,
		});

		const startTime = Date.now();
		// For GET requests, do NOT include Content-Type header
		// Only include Authorization and Accept headers
		const response = await global.fetch(reportsEndpoint, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${cleanToken}`,
				Accept: 'application/json',
			},
		});

		const duration = Date.now() - startTime;
		const responseClone = response.clone();
		let responseData;
		try {
			responseData = await responseClone.json();
		} catch {
			responseData = { error: 'Failed to parse response' };
		}

		logPingOneApiCall(
			'MFA Device Authentication Reports',
			reportsEndpoint,
			'GET',
			{
				Authorization: `Bearer ${cleanToken.substring(0, 20)}...***REDACTED***`,
				Accept: 'application/json',
			},
			null,
			response,
			responseData,
			duration,
			{
				environmentId,
				hasQueryParams: !!queryParams,
			}
		);

		if (!response.ok) {
			const errorData = responseData || { error: 'Unknown error' };
			console.error('[MFA Device Authentication Reports] Error:', errorData);
			return res.status(response.status).json(errorData);
		}

		console.log('[MFA Device Authentication Reports] Success:', {
			count: responseData._embedded?.mfaDeviceAuthentications?.length || 0,
		});
		res.json(responseData);
	} catch (error) {
		console.error('[MFA Device Authentication Reports] Error:', error);
		res
			.status(500)
			.json({ error: 'Failed to get device authentication reports', message: error.message });
	}
});

// Get FIDO2 Device Reports
app.post('/api/pingone/mfa/fido2-device-reports', async (req, res) => {
	try {
		const { environmentId, queryParams, workerToken } = req.body;
		if (!environmentId || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}
		const cleanToken = String(workerToken).trim();
		const region = req.body.region || 'na';
		const apiBase =
			region === 'eu'
				? 'https://api.pingone.eu'
				: region === 'asia'
					? 'https://api.pingone.asia'
					: 'https://api.pingone.com';
		const reportsEndpoint = `${apiBase}/v1/environments/${environmentId}/fido2Devices${queryParams ? `?${queryParams}` : ''}`;

		console.log('[MFA FIDO2 Device Reports] Fetching reports:', {
			environmentId,
			hasQueryParams: !!queryParams,
		});

		const startTime = Date.now();
		// For GET requests, do NOT include Content-Type header
		// Only include Authorization and Accept headers
		const response = await global.fetch(reportsEndpoint, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${cleanToken}`,
				Accept: 'application/json',
			},
		});

		const duration = Date.now() - startTime;
		const responseClone = response.clone();
		let responseData;
		try {
			responseData = await responseClone.json();
		} catch {
			responseData = { error: 'Failed to parse response' };
		}

		logPingOneApiCall(
			'MFA FIDO2 Device Reports',
			reportsEndpoint,
			'GET',
			{
				Authorization: `Bearer ${cleanToken.substring(0, 20)}...***REDACTED***`,
				Accept: 'application/json',
			},
			null,
			response,
			responseData,
			duration,
			{
				environmentId,
				hasQueryParams: !!queryParams,
			}
		);

		if (!response.ok) {
			const errorData = responseData || { error: 'Unknown error' };
			console.error('[MFA FIDO2 Device Reports] Error:', errorData);
			return res.status(response.status).json(errorData);
		}

		console.log('[MFA FIDO2 Device Reports] Success:', {
			count: responseData._embedded?.fido2Devices?.length || 0,
		});
		res.json(responseData);
	} catch (error) {
		console.error('[MFA FIDO2 Device Reports] Error:', error);
		res
			.status(500)
			.json({ error: 'Failed to get FIDO2 device reports', message: error.message });
	}
});

// Initialize Device Authentication (API Server Endpoint - for existing devices)
app.post('/api/pingone/mfa/initialize-device-authentication', async (req, res) => {
	try {
		const {
			environmentId,
			userId,
			username,
			deviceId,
			workerToken,
			policyId,
			deviceAuthenticationPolicyId,
			region,
		} = req.body;
		if (!environmentId || (!userId && !username) || !workerToken) {
			return res
				.status(400)
				.json({
					error:
						'Missing required fields: environmentId, userId (or username), and workerToken are required',
				});
		}

		let resolvedUserId = userId;
		if (!resolvedUserId && username) {
			try {
				const lookupResponse = await global.fetch(
					`https://api.pingone.com/v1/environments/${environmentId}/users?filter=username eq "${encodeURIComponent(username)}"`,
					{
						method: 'GET',
						headers: {
							Authorization: `Bearer ${String(workerToken)
								.trim()
								.replace(/^Bearer\s+/i, '')}`,
							'Content-Type': 'application/json',
						},
					}
				);

				if (lookupResponse.ok) {
					const usersData = await lookupResponse.json();
					const user = usersData._embedded?.users?.[0];
					if (user) {
						resolvedUserId = user.id;
					} else {
						return res
							.status(404)
							.json({
								error: 'User not found',
								message: `User with username "${username}" not found`,
							});
					}
				} else {
					return res
						.status(lookupResponse.status)
						.json({ error: 'Failed to lookup user', message: 'Could not find user by username' });
				}
			} catch (lookupError) {
				console.error('[MFA Initialize Device Auth] User lookup error:', lookupError);
				return res
					.status(500)
					.json({
						error: 'Failed to lookup user',
						message: lookupError instanceof Error ? lookupError.message : 'Unknown error',
					});
			}
		}

		if (!resolvedUserId) {
			return res
				.status(400)
				.json({ error: 'Missing userId', message: 'Either userId or username must be provided' });
		}

		let cleanToken = String(workerToken);
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/[\s\n\r\t]/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		const normalizedRegion = region || 'na';
		const tld = normalizedRegion === 'eu' ? 'eu' : normalizedRegion === 'asia' ? 'asia' : 'com';
		const authPath = `https://auth.pingone.${tld}`;

		const mfaEndpoint = `${authPath}/${environmentId}/deviceAuthentications`;

		const requestBody = {
			user: {
				id: resolvedUserId,
			},
		};

		if (deviceId) {
			requestBody.device = { id: deviceId };
		}

		const resolvedPolicyId = policyId || deviceAuthenticationPolicyId;
		if (resolvedPolicyId) {
			requestBody.policy = { id: resolvedPolicyId };
		}

		console.log('[MFA Initialize Device Auth] Request details', {
			url: mfaEndpoint,
			method: 'POST',
			environmentId,
			userId: resolvedUserId,
			username: username || 'N/A',
			deviceId: deviceId || 'not provided',
			policyId: resolvedPolicyId || 'not provided',
			requestBody: JSON.stringify(requestBody, null, 2),
		});

		const startTime = Date.now();
		const response = await global.fetch(mfaEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${cleanToken}`,
			},
			body: JSON.stringify(requestBody),
		});
		const duration = Date.now() - startTime;

		const rawText = await response.text();
		let authData = {};
		if (rawText && rawText.trim()) {
			try {
				authData = JSON.parse(rawText);
			} catch (parseError) {
				console.error('[MFA Initialize Device Auth] Failed to parse JSON response', {
					error: parseError instanceof Error ? parseError.message : String(parseError),
					bodyPreview: rawText.substring(0, 200),
				});
				authData = { raw: rawText };
			}
		}

		// Log devices returned from PingOne
		if (authData.devices && Array.isArray(authData.devices)) {
			console.log('[MFA Initialize Device Auth] 📋 Devices returned from PingOne:', {
				userId: resolvedUserId,
				username: username || 'N/A',
				deviceCount: authData.devices.length,
				devices: authData.devices.map((d) => ({
					id: d.id,
					type: d.type,
					nickname: d.nickname || d.name,
					status: d.status,
					userId: d.user?.id || 'N/A',
					userUsername: d.user?.username || 'N/A',
					userName: d.user?.name || 'N/A',
					allKeys: Object.keys(d),
				})),
			});
		} else {
			console.log('[MFA Initialize Device Auth] No devices in response or devices is not an array', {
				hasDevices: !!authData.devices,
				devicesType: typeof authData.devices,
				isArray: Array.isArray(authData.devices),
			});
		}

		// Log the actual PingOne API call
		logPingOneApiCall(
			'Initialize Device Authentication',
			mfaEndpoint,
			'POST',
			{ Authorization: `Bearer ${cleanToken}`, 'Content-Type': 'application/json' },
			requestBody,
			response,
			authData,
			duration,
			{
				operation: 'initialize-device-authentication',
				environmentId,
				userId: resolvedUserId,
				username: username || 'N/A',
				deviceId: deviceId || undefined,
				policyId: resolvedPolicyId || undefined,
				deviceCount: authData.devices?.length || 0,
			}
		);

		if (!response.ok) {
			// Check for NO_USABLE_DEVICES error
			if (authData.error?.code === 'NO_USABLE_DEVICES') {
				console.error('[MFA Initialize Device Auth] NO_USABLE_DEVICES error detected:', {
					message: authData.error.message,
					unavailableDevices: authData.error.unavailableDevices || [],
				});
				return res.status(400).json({
					error: 'NO_USABLE_DEVICES',
					message: authData.error.message || 'No usable devices found for authentication',
					unavailableDevices: authData.error.unavailableDevices || [],
					status: 'FAILED',
					details: authData,
				});
			}

			const errorResponse = {
				error: authData.error || 'Failed to initialize device authentication',
				message: authData.message || response.statusText,
				details: authData,
			};
			return res.status(response.status).json(errorResponse);
		}

		console.log('[MFA Initialize Device Auth] ✅ Success - returning auth data with devices', {
			userId: resolvedUserId,
			username: username || 'N/A',
			deviceCount: authData.devices?.length || 0,
		});

		return res.json(authData);
	} catch (error) {
		console.error('[MFA Initialize Device Auth] Error:', error);
		res
			.status(500)
			.json({ error: 'Failed to initialize device authentication', message: error.message });
	}
});

// ============================================================================
// OATH TOKEN MANAGEMENT ENDPOINTS
// ============================================================================

// List OATH Tokens
app.get('/api/pingone/mfa/oath-tokens', async (req, res) => {
	try {
		const { environmentId, workerToken, region } = req.query;

		if (!environmentId || !workerToken) {
			return res
				.status(400)
				.json({ error: 'Missing required fields: environmentId and workerToken' });
		}

		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		const normalizedRegion = region || 'na';
		const apiBase =
			normalizedRegion === 'eu'
				? 'https://api.pingone.eu'
				: normalizedRegion === 'asia'
					? 'https://api.pingone.asia'
					: 'https://api.pingone.com';

		const tokensEndpoint = `${apiBase}/v1/environments/${environmentId}/oathTokens`;

		console.log('[OATH Tokens] Listing tokens:', { environmentId, url: tokensEndpoint });

		const response = await global.fetch(tokensEndpoint, {
			method: 'GET',
			headers: { Authorization: `Bearer ${cleanToken}` },
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			console.error('[OATH Tokens] Error:', errorData);
			return res.status(response.status).json(errorData);
		}

		const tokensData = await response.json();
		res.json(tokensData);
	} catch (error) {
		console.error('[OATH Tokens] Error:', error);
		res.status(500).json({ error: 'Failed to list OATH tokens', message: error.message });
	}
});

// Create OATH Token
app.post('/api/pingone/mfa/oath-tokens', async (req, res) => {
	try {
		const { environmentId, workerToken, region, tokenData } = req.body;

		if (!environmentId || !workerToken || !tokenData) {
			return res.status(400).json({
				error: 'Missing required fields: environmentId, workerToken, and tokenData',
			});
		}

		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		const normalizedRegion = region || 'na';
		const apiBase =
			normalizedRegion === 'eu'
				? 'https://api.pingone.eu'
				: normalizedRegion === 'asia'
					? 'https://api.pingone.asia'
					: 'https://api.pingone.com';

		const tokensEndpoint = `${apiBase}/v1/environments/${environmentId}/oathTokens`;

		console.log('[OATH Tokens] Creating token:', { environmentId, tokenType: tokenData.type });

		const response = await global.fetch(tokensEndpoint, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(tokenData),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			console.error('[OATH Tokens] Error:', errorData);
			return res.status(response.status).json(errorData);
		}

		const tokenDataResponse = await response.json();
		res.json(tokenDataResponse);
	} catch (error) {
		console.error('[OATH Tokens] Error:', error);
		res.status(500).json({ error: 'Failed to create OATH token', message: error.message });
	}
});

// Resync OATH Token
app.post('/api/pingone/mfa/oath-tokens/:tokenId/resync', async (req, res) => {
	try {
		const { tokenId } = req.params;
		const { environmentId, workerToken, region, resyncData } = req.body;

		if (!environmentId || !workerToken || !resyncData) {
			return res.status(400).json({
				error: 'Missing required fields: environmentId, workerToken, and resyncData',
			});
		}

		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		const normalizedRegion = region || 'na';
		const apiBase =
			normalizedRegion === 'eu'
				? 'https://api.pingone.eu'
				: normalizedRegion === 'asia'
					? 'https://api.pingone.asia'
					: 'https://api.pingone.com';

		const resyncEndpoint = `${apiBase}/v1/environments/${environmentId}/oathTokens/${tokenId}/resync`;

		console.log('[OATH Tokens] Resyncing token:', { environmentId, tokenId });

		const response = await global.fetch(resyncEndpoint, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(resyncData),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			console.error('[OATH Tokens] Error:', errorData);
			return res.status(response.status).json(errorData);
		}

		const resyncResponse = await response.json();
		res.json(resyncResponse);
	} catch (error) {
		console.error('[OATH Tokens] Error:', error);
		res.status(500).json({ error: 'Failed to resync OATH token', message: error.message });
	}
});

// Delete/Revoke OATH Token
app.delete('/api/pingone/mfa/oath-tokens/:tokenId', async (req, res) => {
	try {
		const { tokenId } = req.params;
		const { environmentId, workerToken, region } = req.query;

		if (!environmentId || !workerToken) {
			return res
				.status(400)
				.json({ error: 'Missing required fields: environmentId and workerToken' });
		}

		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		const normalizedRegion = region || 'na';
		const apiBase =
			normalizedRegion === 'eu'
				? 'https://api.pingone.eu'
				: normalizedRegion === 'asia'
					? 'https://api.pingone.asia'
					: 'https://api.pingone.com';

		const tokenEndpoint = `${apiBase}/v1/environments/${environmentId}/oathTokens/${tokenId}`;

		console.log('[OATH Tokens] Deleting token:', { environmentId, tokenId });

		const response = await global.fetch(tokenEndpoint, {
			method: 'DELETE',
			headers: { Authorization: `Bearer ${cleanToken}` },
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			console.error('[OATH Tokens] Error:', errorData);
			return res.status(response.status).json(errorData);
		}

		// DELETE may return 204 No Content
		if (response.status === 204) {
			return res.status(204).send();
		}

		const deleteResponse = await response.json().catch(() => ({}));
		res.json(deleteResponse);
	} catch (error) {
		console.error('[OATH Tokens] Error:', error);
		res.status(500).json({ error: 'Failed to delete OATH token', message: error.message });
	}
});

// Batch OATH Token Operations
app.post('/api/pingone/mfa/oath-tokens/batch', async (req, res) => {
	try {
		const { environmentId, workerToken, region, batchData } = req.body;

		if (!environmentId || !workerToken || !batchData) {
			return res.status(400).json({
				error: 'Missing required fields: environmentId, workerToken, and batchData',
			});
		}

		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		const normalizedRegion = region || 'na';
		const apiBase =
			normalizedRegion === 'eu'
				? 'https://api.pingone.eu'
				: normalizedRegion === 'asia'
					? 'https://api.pingone.asia'
					: 'https://api.pingone.com';

		const batchEndpoint = `${apiBase}/v1/environments/${environmentId}/oathTokens/batch`;

		console.log('[OATH Tokens] Batch operation:', { environmentId, type: batchData.type });

		const response = await global.fetch(batchEndpoint, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(batchData),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			console.error('[OATH Tokens] Error:', errorData);
			return res.status(response.status).json(errorData);
		}

		const batchResponse = await response.json();
		res.json(batchResponse);
	} catch (error) {
		console.error('[OATH Tokens] Error:', error);
		res
			.status(500)
			.json({ error: 'Failed to execute batch OATH token operation', message: error.message });
	}
});

// ============================================================================
// FIDO2 POLICY MANAGEMENT ENDPOINTS
// ============================================================================

// List FIDO2 Policies
app.get('/api/pingone/mfa/fido2-policies', async (req, res) => {
	try {
		const { environmentId, workerToken, region } = req.query;

		if (!environmentId || !workerToken) {
			return res
				.status(400)
				.json({ error: 'Missing required fields: environmentId and workerToken' });
		}

		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		const normalizedRegion = region || 'na';
		const apiBase =
			normalizedRegion === 'eu'
				? 'https://api.pingone.eu'
				: normalizedRegion === 'asia'
					? 'https://api.pingone.asia'
					: 'https://api.pingone.com';

		const policiesEndpoint = `${apiBase}/v1/environments/${environmentId}/fido2Policies`;

		console.log('[FIDO2 Policies] Listing policies:', { environmentId, url: policiesEndpoint });

		const response = await global.fetch(policiesEndpoint, {
			method: 'GET',
			headers: { Authorization: `Bearer ${cleanToken}` },
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			console.error('[FIDO2 Policies] Error:', errorData);
			return res.status(response.status).json(errorData);
		}

		const policiesData = await response.json();
		res.json(policiesData);
	} catch (error) {
		console.error('[FIDO2 Policies] Error:', error);
		res.status(500).json({ error: 'Failed to list FIDO2 policies', message: error.message });
	}
});

// Get FIDO2 Policy by ID
app.get('/api/pingone/mfa/fido2-policies/:policyId', async (req, res) => {
	try {
		const { policyId } = req.params;
		const { environmentId, workerToken, region } = req.query;

		if (!environmentId || !workerToken) {
			return res
				.status(400)
				.json({ error: 'Missing required fields: environmentId and workerToken' });
		}

		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		const normalizedRegion = region || 'na';
		const apiBase =
			normalizedRegion === 'eu'
				? 'https://api.pingone.eu'
				: normalizedRegion === 'asia'
					? 'https://api.pingone.asia'
					: 'https://api.pingone.com';

		const policyEndpoint = `${apiBase}/v1/environments/${environmentId}/fido2Policies/${policyId}`;

		console.log('[FIDO2 Policies] Getting policy:', { environmentId, policyId });

		const response = await global.fetch(policyEndpoint, {
			method: 'GET',
			headers: { Authorization: `Bearer ${cleanToken}` },
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			console.error('[FIDO2 Policies] Error:', errorData);
			return res.status(response.status).json(errorData);
		}

		const policyData = await response.json();
		res.json(policyData);
	} catch (error) {
		console.error('[FIDO2 Policies] Error:', error);
		res.status(500).json({ error: 'Failed to get FIDO2 policy', message: error.message });
	}
});

// Create FIDO2 Policy
app.post('/api/pingone/mfa/fido2-policies', async (req, res) => {
	try {
		const { environmentId, workerToken, region, policyData } = req.body;

		if (!environmentId || !workerToken || !policyData) {
			return res.status(400).json({
				error: 'Missing required fields: environmentId, workerToken, and policyData',
			});
		}

		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		const normalizedRegion = region || 'na';
		const apiBase =
			normalizedRegion === 'eu'
				? 'https://api.pingone.eu'
				: normalizedRegion === 'asia'
					? 'https://api.pingone.asia'
					: 'https://api.pingone.com';

		const policiesEndpoint = `${apiBase}/v1/environments/${environmentId}/fido2Policies`;

		console.log('[FIDO2 Policies] Creating policy:', {
			environmentId,
			policyName: policyData.name,
		});

		const response = await global.fetch(policiesEndpoint, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(policyData),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			console.error('[FIDO2 Policies] Error:', errorData);
			return res.status(response.status).json(errorData);
		}

		const createResponse = await response.json();
		res.json(createResponse);
	} catch (error) {
		console.error('[FIDO2 Policies] Error:', error);
		res.status(500).json({ error: 'Failed to create FIDO2 policy', message: error.message });
	}
});

// Update FIDO2 Policy
app.put('/api/pingone/mfa/fido2-policies/:policyId', async (req, res) => {
	try {
		const { policyId } = req.params;
		const { environmentId, workerToken, region, policyData } = req.body;

		if (!environmentId || !workerToken || !policyData) {
			return res.status(400).json({
				error: 'Missing required fields: environmentId, workerToken, and policyData',
			});
		}

		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		const normalizedRegion = region || 'na';
		const apiBase =
			normalizedRegion === 'eu'
				? 'https://api.pingone.eu'
				: normalizedRegion === 'asia'
					? 'https://api.pingone.asia'
					: 'https://api.pingone.com';

		const policyEndpoint = `${apiBase}/v1/environments/${environmentId}/fido2Policies/${policyId}`;

		console.log('[FIDO2 Policies] Updating policy:', { environmentId, policyId });

		const response = await global.fetch(policyEndpoint, {
			method: 'PUT',
			headers: {
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(policyData),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			console.error('[FIDO2 Policies] Error:', errorData);
			return res.status(response.status).json(errorData);
		}

		const updateResponse = await response.json();
		res.json(updateResponse);
	} catch (error) {
		console.error('[FIDO2 Policies] Error:', error);
		res.status(500).json({ error: 'Failed to update FIDO2 policy', message: error.message });
	}
});

// Delete FIDO2 Policy
app.delete('/api/pingone/mfa/fido2-policies/:policyId', async (req, res) => {
	try {
		const { policyId } = req.params;
		const { environmentId, workerToken, region } = req.query;

		if (!environmentId || !workerToken) {
			return res
				.status(400)
				.json({ error: 'Missing required fields: environmentId and workerToken' });
		}

		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		const normalizedRegion = region || 'na';
		const apiBase =
			normalizedRegion === 'eu'
				? 'https://api.pingone.eu'
				: normalizedRegion === 'asia'
					? 'https://api.pingone.asia'
					: 'https://api.pingone.com';

		const policyEndpoint = `${apiBase}/v1/environments/${environmentId}/fido2Policies/${policyId}`;

		console.log('[FIDO2 Policies] Deleting policy:', { environmentId, policyId });

		const response = await global.fetch(policyEndpoint, {
			method: 'DELETE',
			headers: { Authorization: `Bearer ${cleanToken}` },
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			console.error('[FIDO2 Policies] Error:', errorData);
			return res.status(response.status).json(errorData);
		}

		// DELETE may return 204 No Content
		if (response.status === 204) {
			return res.status(204).send();
		}

		const deleteResponse = await response.json().catch(() => ({}));
		res.json(deleteResponse);
	} catch (error) {
		console.error('[FIDO2 Policies] Error:', error);
		res.status(500).json({ error: 'Failed to delete FIDO2 policy', message: error.message });
	}
});

// ============================================================================
// EMAIL MFA SIGN-ON FLOW PROXY ENDPOINTS
// ============================================================================

// Step 1: Create Application
app.post('/api/pingone/email-mfa-signon/create-application', async (req, res) => {
	try {
		const { environmentId, workerToken, name, description, type, redirectUris, grantTypes, responseTypes, tokenEndpointAuthMethod } = req.body;

		if (!environmentId || !workerToken || !name) {
			return res.status(400).json({ error: 'Missing required fields: environmentId, workerToken, name' });
		}

		let cleanToken = String(workerToken).trim().replace(/^Bearer\s+/i, '');
		const apiUrl = `https://api.pingone.com/v1/environments/${environmentId}/applications`;

		const payload = {
			name,
			description: description || `Email MFA Sign-On Application - ${new Date().toISOString()}`,
			type: type || 'OIDC_WEB_APP',
			enabled: true,
			...(redirectUris && { redirectUris }),
			...(grantTypes && { grantTypes }),
			...(responseTypes && { responseTypes }),
			...(tokenEndpointAuthMethod && { tokenEndpointAuthMethod }),
		};

		console.log('[📧 EMAIL-MFA-SIGNON] Creating application:', { environmentId, name });

		const response = await global.fetch(apiUrl, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		});

		const data = await response.json();
		if (!response.ok) {
			return res.status(response.status).json(data);
		}

		res.json(data);
	} catch (error) {
		console.error('[📧 EMAIL-MFA-SIGNON] Error creating application:', error);
		res.status(500).json({ error: 'Failed to create application', message: error.message });
	}
});

// Step 2: Get Resources
app.get('/api/pingone/email-mfa-signon/get-resources', async (req, res) => {
	try {
		const { environmentId, workerToken } = req.query;

		if (!environmentId || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields: environmentId, workerToken' });
		}

		let cleanToken = String(workerToken).trim().replace(/^Bearer\s+/i, '');
		const apiUrl = `https://api.pingone.com/v1/environments/${environmentId}/resources`;

		const response = await global.fetch(apiUrl, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/json',
			},
		});

		const data = await response.json();
		if (!response.ok) {
			return res.status(response.status).json(data);
		}

		res.json(data);
	} catch (error) {
		console.error('[📧 EMAIL-MFA-SIGNON] Error getting resources:', error);
		res.status(500).json({ error: 'Failed to get resources', message: error.message });
	}
});

// Step 3: Get Resource Scopes
app.get('/api/pingone/email-mfa-signon/get-resource-scopes', async (req, res) => {
	try {
		const { environmentId, resourceId, workerToken } = req.query;

		if (!environmentId || !resourceId || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields: environmentId, resourceId, workerToken' });
		}

		let cleanToken = String(workerToken).trim().replace(/^Bearer\s+/i, '');
		const apiUrl = `https://api.pingone.com/v1/environments/${environmentId}/resources/${resourceId}/scopes`;

		const response = await global.fetch(apiUrl, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/json',
			},
		});

		const data = await response.json();
		if (!response.ok) {
			return res.status(response.status).json(data);
		}

		res.json(data);
	} catch (error) {
		console.error('[📧 EMAIL-MFA-SIGNON] Error getting resource scopes:', error);
		res.status(500).json({ error: 'Failed to get resource scopes', message: error.message });
	}
});

// Step 4: Create Resource Access Grant
app.post('/api/pingone/email-mfa-signon/create-resource-grant', async (req, res) => {
	try {
		const { environmentId, applicationId, resourceId, scopes, workerToken } = req.body;

		if (!environmentId || !applicationId || !resourceId || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields: environmentId, applicationId, resourceId, workerToken' });
		}

		let cleanToken = String(workerToken).trim().replace(/^Bearer\s+/i, '');
		const apiUrl = `https://api.pingone.com/v1/environments/${environmentId}/applications/${applicationId}/grants`;

		const payload = {
			resource: { id: resourceId },
			...(scopes && scopes.length > 0 && { scopes: scopes.map((s) => ({ name: s })) }),
		};

		const response = await global.fetch(apiUrl, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		});

		const data = await response.json();
		if (!response.ok) {
			return res.status(response.status).json(data);
		}

		res.json(data);
	} catch (error) {
		console.error('[📧 EMAIL-MFA-SIGNON] Error creating resource grant:', error);
		res.status(500).json({ error: 'Failed to create resource grant', message: error.message });
	}
});

// Step 5: Create Sign-On Policy
app.post('/api/pingone/email-mfa-signon/create-signon-policy', async (req, res) => {
	try {
		const { environmentId, workerToken, name, description, default: isDefault } = req.body;

		if (!environmentId || !workerToken || !name) {
			return res.status(400).json({ error: 'Missing required fields: environmentId, workerToken, name' });
		}

		let cleanToken = String(workerToken).trim().replace(/^Bearer\s+/i, '');
		const apiUrl = `https://api.pingone.com/v1/environments/${environmentId}/signOnPolicies`;

		const payload = {
			name,
			description: description || `Email MFA Sign-On Policy - ${new Date().toISOString()}`,
			default: isDefault || false,
		};

		const response = await global.fetch(apiUrl, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		});

		const data = await response.json();
		if (!response.ok) {
			return res.status(response.status).json(data);
		}

		res.json(data);
	} catch (error) {
		console.error('[📧 EMAIL-MFA-SIGNON] Error creating sign-on policy:', error);
		res.status(500).json({ error: 'Failed to create sign-on policy', message: error.message });
	}
});

// Step 6: Create Email MFA Sign-On Policy Action
app.post('/api/pingone/email-mfa-signon/create-email-mfa-action', async (req, res) => {
	try {
		const { environmentId, signOnPolicyId, workerToken, priority, configuration } = req.body;

		if (!environmentId || !signOnPolicyId || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields: environmentId, signOnPolicyId, workerToken' });
		}

		let cleanToken = String(workerToken).trim().replace(/^Bearer\s+/i, '');
		const apiUrl = `https://api.pingone.com/v1/environments/${environmentId}/signOnPolicies/${signOnPolicyId}/actions`;

		const payload = {
			type: 'EMAIL',
			priority: priority || 1,
			configuration: configuration || {
				attempts: 3,
				resendInterval: 60,
			},
		};

		const response = await global.fetch(apiUrl, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		});

		const data = await response.json();
		if (!response.ok) {
			return res.status(response.status).json(data);
		}

		res.json(data);
	} catch (error) {
		console.error('[📧 EMAIL-MFA-SIGNON] Error creating Email MFA action:', error);
		res.status(500).json({ error: 'Failed to create Email MFA action', message: error.message });
	}
});

// Step 7: Assign Sign-On Policy to Application
app.post('/api/pingone/email-mfa-signon/assign-signon-policy', async (req, res) => {
	try {
		const { environmentId, applicationId, signOnPolicyId, workerToken } = req.body;

		if (!environmentId || !applicationId || !signOnPolicyId || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields: environmentId, applicationId, signOnPolicyId, workerToken' });
		}

		let cleanToken = String(workerToken).trim().replace(/^Bearer\s+/i, '');
		const apiUrl = `https://api.pingone.com/v1/environments/${environmentId}/applications/${applicationId}/signOnPolicyAssignments`;

		const payload = {
			signOnPolicy: { id: signOnPolicyId },
		};

		const response = await global.fetch(apiUrl, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		});

		const data = await response.json();
		if (!response.ok) {
			return res.status(response.status).json(data);
		}

		res.json(data);
	} catch (error) {
		console.error('[📧 EMAIL-MFA-SIGNON] Error assigning sign-on policy:', error);
		res.status(500).json({ error: 'Failed to assign sign-on policy', message: error.message });
	}
});

// Step 8: Create Population
app.post('/api/pingone/email-mfa-signon/create-population', async (req, res) => {
	try {
		const { environmentId, workerToken, name, description } = req.body;

		if (!environmentId || !workerToken || !name) {
			return res.status(400).json({ error: 'Missing required fields: environmentId, workerToken, name' });
		}

		let cleanToken = String(workerToken).trim().replace(/^Bearer\s+/i, '');
		const apiUrl = `https://api.pingone.com/v1/environments/${environmentId}/populations`;

		const payload = {
			name,
			description: description || `Email MFA Sign-On Population - ${new Date().toISOString()}`,
		};

		const response = await global.fetch(apiUrl, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		});

		const data = await response.json();
		if (!response.ok) {
			return res.status(response.status).json(data);
		}

		res.json(data);
	} catch (error) {
		console.error('[📧 EMAIL-MFA-SIGNON] Error creating population:', error);
		res.status(500).json({ error: 'Failed to create population', message: error.message });
	}
});

// Step 9: Create User
app.post('/api/pingone/email-mfa-signon/create-user', async (req, res) => {
	try {
		const { environmentId, populationId, workerToken, username, email, givenName, familyName } = req.body;

		if (!environmentId || !populationId || !workerToken || !username) {
			return res.status(400).json({ error: 'Missing required fields: environmentId, populationId, workerToken, username' });
		}

		let cleanToken = String(workerToken).trim().replace(/^Bearer\s+/i, '');
		const apiUrl = `https://api.pingone.com/v1/environments/${environmentId}/users`;

		const payload = {
			username,
			...(email && { email }),
			...(givenName && { name: { given: givenName, ...(familyName && { family: familyName }) } }),
			population: { id: populationId },
		};

		const response = await global.fetch(apiUrl, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		});

		const data = await response.json();
		if (!response.ok) {
			return res.status(response.status).json(data);
		}

		res.json(data);
	} catch (error) {
		console.error('[📧 EMAIL-MFA-SIGNON] Error creating user:', error);
		res.status(500).json({ error: 'Failed to create user', message: error.message });
	}
});

// Step 10: Set User Password
app.post('/api/pingone/email-mfa-signon/set-user-password', async (req, res) => {
	try {
		const { environmentId, userId, workerToken, password, forceChange } = req.body;

		if (!environmentId || !userId || !workerToken || !password) {
			return res.status(400).json({ error: 'Missing required fields: environmentId, userId, workerToken, password' });
		}

		let cleanToken = String(workerToken).trim().replace(/^Bearer\s+/i, '');
		const apiUrl = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/password`;

		const payload = {
			value: password,
			...(forceChange && { forceChange: true }),
		};

		const response = await global.fetch(apiUrl, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/vnd.pingidentity.password.setValue+json',
			},
			body: JSON.stringify(payload),
		});

		const data = await response.json();
		if (!response.ok) {
			return res.status(response.status).json(data);
		}

		res.json(data);
	} catch (error) {
		console.error('[📧 EMAIL-MFA-SIGNON] Error setting user password:', error);
		res.status(500).json({ error: 'Failed to set user password', message: error.message });
	}
});

// Step 11: Enable MFA for User
app.post('/api/pingone/email-mfa-signon/enable-mfa', async (req, res) => {
	try {
		const { environmentId, userId, workerToken } = req.body;

		if (!environmentId || !userId || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields: environmentId, userId, workerToken' });
		}

		let cleanToken = String(workerToken).trim().replace(/^Bearer\s+/i, '');
		const apiUrl = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/mfaEnabled`;

		const response = await global.fetch(apiUrl, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/json',
			},
		});

		const data = await response.json();
		if (!response.ok) {
			return res.status(response.status).json(data);
		}

		res.json(data);
	} catch (error) {
		console.error('[📧 EMAIL-MFA-SIGNON] Error enabling MFA:', error);
		res.status(500).json({ error: 'Failed to enable MFA', message: error.message });
	}
});

// Step 12: Create Device Authentication Policy
app.post('/api/pingone/email-mfa-signon/create-device-auth-policy', async (req, res) => {
	try {
		const { environmentId, workerToken, name, description, rememberDevice, rememberDeviceForSeconds } = req.body;

		if (!environmentId || !workerToken || !name) {
			return res.status(400).json({ error: 'Missing required fields: environmentId, workerToken, name' });
		}

		let cleanToken = String(workerToken).trim().replace(/^Bearer\s+/i, '');
		const apiUrl = `https://api.pingone.com/v1/environments/${environmentId}/deviceAuthenticationPolicies`;

		const payload = {
			name,
			description: description || `Email MFA Device Auth Policy - ${new Date().toISOString()}`,
			...(rememberDevice !== undefined && { rememberDevice }),
			...(rememberDeviceForSeconds && { rememberDeviceForSeconds }),
		};

		const response = await global.fetch(apiUrl, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		});

		const data = await response.json();
		if (!response.ok) {
			return res.status(response.status).json(data);
		}

		res.json(data);
	} catch (error) {
		console.error('[📧 EMAIL-MFA-SIGNON] Error creating device auth policy:', error);
		res.status(500).json({ error: 'Failed to create device auth policy', message: error.message });
	}
});

// Step 13: Register Email Device
app.post('/api/pingone/email-mfa-signon/register-email-device', async (req, res) => {
	try {
		const { environmentId, userId, workerToken, email, name, nickname, status } = req.body;

		if (!environmentId || !userId || !workerToken || !email) {
			return res.status(400).json({ error: 'Missing required fields: environmentId, userId, workerToken, email' });
		}

		let cleanToken = String(workerToken).trim().replace(/^Bearer\s+/i, '');
		const apiUrl = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices`;

		const payload = {
			type: 'EMAIL',
			email,
			...(name && { name }),
			...(nickname && { nickname }),
			...(status && { status }),
		};

		const response = await global.fetch(apiUrl, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		});

		const data = await response.json();
		if (!response.ok) {
			return res.status(response.status).json(data);
		}

		res.json(data);
	} catch (error) {
		console.error('[📧 EMAIL-MFA-SIGNON] Error registering email device:', error);
		res.status(500).json({ error: 'Failed to register email device', message: error.message });
	}
});

// Step 14: Initiate Authorization Request
app.post('/api/pingone/email-mfa-signon/initiate-authorization', async (req, res) => {
	try {
		const { environmentId, clientId, redirectUri, responseType, scope, state, codeChallenge, codeChallengeMethod } = req.body;

		if (!environmentId || !clientId || !redirectUri) {
			return res.status(400).json({ error: 'Missing required fields: environmentId, clientId, redirectUri' });
		}

		const authUrl = `https://auth.pingone.com/${environmentId}/as/authorize`;
		const params = new URLSearchParams({
			client_id: clientId,
			redirect_uri: redirectUri,
			response_type: responseType || 'code',
			scope: scope || 'openid profile email',
			...(state && { state }),
			...(codeChallenge && { code_challenge: codeChallenge }),
			...(codeChallengeMethod && { code_challenge_method: codeChallengeMethod }),
		});

		// POST to authorize endpoint
		const response = await global.fetch(authUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: params.toString(),
		});

		// Extract cookies from response
		const cookies = [];
		response.headers.forEach((value, key) => {
			if (key.toLowerCase() === 'set-cookie') {
				cookies.push(value);
			}
		});

		const responseData = await response.json().catch(() => ({}));
		
		if (!response.ok) {
			return res.status(response.status).json(responseData);
		}

		res.json({
			...responseData,
			cookies,
		});
	} catch (error) {
		console.error('[📧 EMAIL-MFA-SIGNON] Error initiating authorization:', error);
		res.status(500).json({ error: 'Failed to initiate authorization', message: error.message });
	}
});

// Step 15: Get Flow Status
app.post('/api/pingone/email-mfa-signon/get-flow-status', async (req, res) => {
	try {
		const { environmentId, flowId, cookies } = req.body;

		if (!environmentId || !flowId) {
			return res.status(400).json({ error: 'Missing required fields: environmentId, flowId' });
		}

		const flowUrl = `https://auth.pingone.com/${environmentId}/flows/${flowId}`;

		const headers = {
			'Content-Type': 'application/json',
		};

		// Add cookies if provided
		if (cookies && Array.isArray(cookies) && cookies.length > 0) {
			headers['Cookie'] = cookies.map((c) => c.split(';')[0]).join('; ');
		}

		const response = await global.fetch(flowUrl, {
			method: 'GET',
			headers,
		});

		const data = await response.json();
		if (!response.ok) {
			return res.status(response.status).json(data);
		}

		res.json(data);
	} catch (error) {
		console.error('[📧 EMAIL-MFA-SIGNON] Error getting flow status:', error);
		res.status(500).json({ error: 'Failed to get flow status', message: error.message });
	}
});

// Step 16: Complete Flow Action (User Lookup or OTP Check)
app.post('/api/pingone/email-mfa-signon/complete-flow-action', async (req, res) => {
	try {
		const { environmentId, flowId, action, data, cookies } = req.body;

		if (!environmentId || !flowId || !action) {
			return res.status(400).json({ error: 'Missing required fields: environmentId, flowId, action' });
		}

		const flowUrl = `https://auth.pingone.com/${environmentId}/flows/${flowId}`;

		const headers = {
			'Content-Type': 'application/json',
		};

		// Add cookies if provided
		if (cookies && Array.isArray(cookies) && cookies.length > 0) {
			headers['Cookie'] = cookies.map((c) => c.split(';')[0]).join('; ');
		}

		const payload = {
			action,
			...(data && data),
		};

		const response = await global.fetch(flowUrl, {
			method: 'POST',
			headers,
			body: JSON.stringify(payload),
		});

		const responseData = await response.json();
		if (!response.ok) {
			return res.status(response.status).json(responseData);
		}

		res.json(responseData);
	} catch (error) {
		console.error('[📧 EMAIL-MFA-SIGNON] Error completing flow action:', error);
		res.status(500).json({ error: 'Failed to complete flow action', message: error.message });
	}
});

// Step 17: Resume Flow
app.post('/api/pingone/email-mfa-signon/resume-flow', async (req, res) => {
	try {
		const { environmentId, flowId, state, codeVerifier } = req.body;

		if (!environmentId || !flowId) {
			return res.status(400).json({ error: 'Missing required fields: environmentId, flowId' });
		}

		const resumeUrl = new URL(`https://auth.pingone.com/${environmentId}/as/resume`);
		resumeUrl.searchParams.set('flowId', flowId);
		if (state) resumeUrl.searchParams.set('state', state);
		if (codeVerifier) resumeUrl.searchParams.set('code_verifier', codeVerifier);

		const response = await global.fetch(resumeUrl.toString(), {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		const data = await response.json();
		if (!response.ok) {
			return res.status(response.status).json(data);
		}

		res.json(data);
	} catch (error) {
		console.error('[📧 EMAIL-MFA-SIGNON] Error resuming flow:', error);
		res.status(500).json({ error: 'Failed to resume flow', message: error.message });
	}
});

// Step 18: Get Application Secret
app.get('/api/pingone/email-mfa-signon/get-application-secret', async (req, res) => {
	try {
		const { environmentId, applicationId, workerToken } = req.query;

		if (!environmentId || !applicationId || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields: environmentId, applicationId, workerToken' });
		}

		let cleanToken = String(workerToken).trim().replace(/^Bearer\s+/i, '');
		const apiUrl = `https://api.pingone.com/v1/environments/${environmentId}/applications/${applicationId}/secret`;

		const response = await global.fetch(apiUrl, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/json',
			},
		});

		const data = await response.json();
		if (!response.ok) {
			return res.status(response.status).json(data);
		}

		res.json(data);
	} catch (error) {
		console.error('[📧 EMAIL-MFA-SIGNON] Error getting application secret:', error);
		res.status(500).json({ error: 'Failed to get application secret', message: error.message });
	}
});

// Step 19: Exchange Auth Code for Token
app.post('/api/pingone/email-mfa-signon/exchange-code-for-token', async (req, res) => {
	try {
		const { environmentId, code, clientId, clientSecret, redirectUri, codeVerifier } = req.body;

		if (!environmentId || !code || !clientId || !clientSecret || !redirectUri) {
			return res.status(400).json({ error: 'Missing required fields: environmentId, code, clientId, clientSecret, redirectUri' });
		}

		const tokenUrl = `https://auth.pingone.com/${environmentId}/as/token`;
		const params = new URLSearchParams({
			grant_type: 'authorization_code',
			code,
			client_id: clientId,
			client_secret: clientSecret,
			redirect_uri: redirectUri,
			...(codeVerifier && { code_verifier: codeVerifier }),
		});

		const response = await global.fetch(tokenUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: params.toString(),
		});

		const data = await response.json();
		if (!response.ok) {
			return res.status(response.status).json(data);
		}

		res.json(data);
	} catch (error) {
		console.error('[📧 EMAIL-MFA-SIGNON] Error exchanging code for token:', error);
		res.status(500).json({ error: 'Failed to exchange code for token', message: error.message });
	}
});

// ============================================================================
// USERNAME-LESS PASSKEY ENDPOINTS
// ============================================================================
// These endpoints implement username-less passkey authentication using PingOne MFA FIDO2 APIs
// Flow: Authentication first (discoverable credentials), then registration fallback if needed

/**
 * Get passkey authentication options (username-less)
 * POST /api/auth/passkey/options/authentication
 * 
 * For username-less authentication, we request authentication options without a specific user.
 * PingOne MFA API requires a user, so we'll need to handle this differently:
 * - Option 1: Request options for all users (if PingOne supports this)
 * - Option 2: Use WebAuthn's discoverable credentials directly (no PingOne options needed)
 * 
 * For now, we'll return minimal options that allow discoverable credentials.
 */
app.post('/api/auth/passkey/options/authentication', async (req, res) => {
	try {
		const { environmentId, deviceAuthenticationPolicyId } = req.body;

		if (!environmentId || !deviceAuthenticationPolicyId) {
			return res.status(400).json({
				error: 'Missing required fields',
				message: 'environmentId and deviceAuthenticationPolicyId are required',
			});
		}

		// For username-less authentication with discoverable credentials,
		// we don't need to call PingOne API upfront - we can use WebAuthn directly
		// The userHandle from the WebAuthn response will identify the user
		
		// Generate a challenge for WebAuthn authentication
		const challenge = Array.from(crypto.getRandomValues(new Uint8Array(32)))
			.map(b => String.fromCharCode(b))
			.join('');
		const challengeBase64 = Buffer.from(challenge).toString('base64url');

		// Return WebAuthn authentication options that allow discoverable credentials
		// No allowCredentials restriction = browser will discover any passkey
		const publicKeyOptions = {
			challenge: challengeBase64,
			timeout: 60000,
			rpId: req.headers.host?.split(':')[0] || 'localhost', // Use current host
			userVerification: 'preferred', // Allow biometrics/PIN
			// Don't set allowCredentials - this allows discoverable credentials
		};

		console.log('[Passkey Auth Options] Generated authentication options for username-less flow', {
			environmentId,
			rpId: publicKeyOptions.rpId,
		});

		res.json({
			publicKey: publicKeyOptions,
		});
	} catch (error) {
		console.error('[Passkey Auth Options] Error:', error);
		res.status(500).json({
			error: 'Failed to get authentication options',
			message: error.message,
		});
	}
});

/**
 * Verify passkey authentication (username-less)
 * POST /api/auth/passkey/verify-authentication
 * 
 * Flow:
 * 1. Extract userHandle from WebAuthn response
 * 2. Decode userHandle to get userId/username
 * 3. Lookup user in PingOne
 * 4. Initialize MFA authentication for that user
 * 5. Verify WebAuthn assertion with PingOne
 * 6. Complete authentication
 */
app.post('/api/auth/passkey/verify-authentication', async (req, res) => {
	console.log('[Passkey Verify Auth] Request received:', {
		method: req.method,
		path: req.path,
		hasBody: !!req.body,
		bodyKeys: req.body ? Object.keys(req.body) : [],
	});

	try {
		const {
			environmentId,
			deviceAuthenticationPolicyId,
			credentialId,
			rawId,
			response: webauthnResponse,
		} = req.body;

		if (!environmentId || !deviceAuthenticationPolicyId || !webauthnResponse || !webauthnResponse.userHandle) {
			console.error('[Passkey Verify Auth] Missing required fields:', {
				hasEnvironmentId: !!environmentId,
				hasDeviceAuthenticationPolicyId: !!deviceAuthenticationPolicyId,
				hasWebauthnResponse: !!webauthnResponse,
				hasUserHandle: !!webauthnResponse?.userHandle,
			});
			return res.status(400).json({
				error: 'Missing required fields',
				message: 'environmentId, deviceAuthenticationPolicyId, response.userHandle are required',
			});
		}

		// Get worker token
		// Note: In a real implementation, you'd get this from the request or session
		// For now, we'll require it in the request body
		const { workerToken } = req.body;
		if (!workerToken) {
			return res.status(400).json({
				error: 'Missing worker token',
				message: 'workerToken is required for authentication verification',
			});
		}

		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		// Step 1: Decode userHandle to get userId
		// userHandle is typically base64-encoded userId or username
		const userHandleBuffer = Buffer.from(webauthnResponse.userHandle, 'base64');
		const userHandleString = userHandleBuffer.toString('utf-8');
		
		// Try to parse as JSON (userId might be encoded as JSON)
		let userId;
		let username;
		try {
			const parsed = JSON.parse(userHandleString);
			userId = parsed.userId || parsed.id || userHandleString;
			username = parsed.username;
		} catch {
			// If not JSON, assume it's directly the userId or username
			userId = userHandleString;
		}

		// Step 2: Lookup user in PingOne if we only have userId
		if (!username) {
			try {
				const userLookupEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}`;
				const startTime = Date.now();
				const lookupResponse = await global.fetch(userLookupEndpoint, {
					method: 'GET',
					headers: {
						Authorization: `Bearer ${cleanToken}`,
						'Content-Type': 'application/json',
					},
				});
				const duration = Date.now() - startTime;
				
				const lookupResponseClone = lookupResponse.clone();
				let lookupData;
				try {
					lookupData = await lookupResponseClone.json();
				} catch {
					lookupData = { error: 'Failed to parse response' };
				}
				
				logPingOneApiCall(
					'Get User (Passkey Verify)',
					userLookupEndpoint,
					'GET',
					{
						Authorization: `Bearer ${cleanToken.substring(0, 20)}...***REDACTED***`,
						'Content-Type': 'application/json',
					},
					null,
					lookupResponse,
					lookupData,
					duration,
					{ environmentId, userId }
				);

				if (lookupResponse.ok) {
					const userData = lookupData;
					username = userData.username;
					userId = userData.id; // Use the actual userId from PingOne
				} else {
					// Try looking up by username if userId lookup failed
					const usernameLookupEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users?filter=username eq "${encodeURIComponent(userId)}"`;
					const usernameStartTime = Date.now();
					const usernameLookupResponse = await global.fetch(usernameLookupEndpoint, {
						method: 'GET',
						headers: {
							Authorization: `Bearer ${cleanToken}`,
							'Content-Type': 'application/json',
						},
					});
					const usernameDuration = Date.now() - usernameStartTime;
					
					const usernameLookupResponseClone = usernameLookupResponse.clone();
					let usernameLookupData;
					try {
						usernameLookupData = await usernameLookupResponseClone.json();
					} catch {
						usernameLookupData = { error: 'Failed to parse response' };
					}
					
					logPingOneApiCall(
						'Get User by Username (Passkey Verify)',
						usernameLookupEndpoint,
						'GET',
						{
							Authorization: `Bearer ${cleanToken.substring(0, 20)}...***REDACTED***`,
							'Content-Type': 'application/json',
						},
						null,
						usernameLookupResponse,
						usernameLookupData,
						usernameDuration,
						{ environmentId, username: userId }
					);

					if (usernameLookupResponse.ok) {
						const usersData = usernameLookupData;
						const user = usersData._embedded?.users?.[0];
						if (user) {
							userId = user.id;
							username = user.username;
						} else {
							return res.status(404).json({
								error: 'User not found',
								message: `Could not find user with identifier from passkey`,
							});
						}
					} else {
						return res.status(404).json({
							error: 'User not found',
							message: `Could not find user with identifier from passkey`,
						});
					}
				}
			} catch (lookupError) {
				console.error('[Passkey Verify Auth] User lookup error:', lookupError);
				return res.status(500).json({
					error: 'Failed to lookup user',
					message: lookupError instanceof Error ? lookupError.message : 'Unknown error',
				});
			}
		}

		// Step 3: Initialize MFA authentication for the user
		const normalizedRegion = 'na'; // Default to na, could be configurable
		const tld = normalizedRegion === 'eu' ? 'eu' : normalizedRegion === 'asia' ? 'asia' : 'com';
		const authPath = `https://auth.pingone.${tld}`;
		const mfaEndpoint = `${authPath}/${environmentId}/deviceAuthentications`;

		const initRequestBody = {
			user: { id: userId },
			deviceAuthenticationPolicy: { id: deviceAuthenticationPolicyId },
		};

		const initStartTime = Date.now();
		const initResponse = await global.fetch(mfaEndpoint, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(initRequestBody),
		});
		const initDuration = Date.now() - initStartTime;
		
		const initResponseClone = initResponse.clone();
		let initData;
		try {
			initData = await initResponseClone.json();
		} catch {
			initData = { error: 'Failed to parse response' };
		}
		
		logPingOneApiCall(
			'Initialize Device Authentication (Passkey Verify)',
			mfaEndpoint,
			'POST',
			{
				Authorization: `Bearer ${cleanToken.substring(0, 20)}...***REDACTED***`,
				'Content-Type': 'application/json',
			},
			initRequestBody,
			initResponse,
			initData,
			initDuration,
			{ environmentId, userId, deviceAuthenticationPolicyId }
		);

		if (!initResponse.ok) {
			const errorData = initData || {};
			return res.status(initResponse.status).json({
				error: 'Failed to initialize authentication',
				message: errorData.message || errorData.error || initResponse.statusText,
			});
		}
		const authenticationId = initData.id;
		const status = initData.status || '';
		const nextStep = initData.nextStep || '';
		const devices = initData.devices || initData._embedded?.devices || [];

		// Check for NO_USABLE_DEVICES error in initialization response
		if (initData.status === 'FAILED' && initData.error?.code === 'NO_USABLE_DEVICES') {
			console.error('[Passkey Verify Auth] NO_USABLE_DEVICES error detected:', {
				message: initData.error.message,
				unavailableDevices: initData.error.unavailableDevices || [],
			});
			return res.status(400).json({
				error: 'NO_USABLE_DEVICES',
				message: initData.error.message || 'No usable devices found for authentication',
				unavailableDevices: initData.error.unavailableDevices || [],
				status: 'FAILED',
			});
		}

		// Step 4: Check if device selection is required
		// For username-less passkeys, we need to find the FIDO2 device that matches the credentialId
		let fido2DeviceId = null;
		
		if (status === 'DEVICE_SELECTION_REQUIRED' || nextStep === 'DEVICE_SELECTION_REQUIRED') {
			// Find FIDO2 device - for username-less, we'll use the first FIDO2 device
			// In a real implementation, you might match by credentialId, but PingOne doesn't expose that
			const fido2Devices = devices.filter((d) => d.type === 'FIDO2');
			if (fido2Devices.length > 0) {
				fido2DeviceId = fido2Devices[0].id;
				console.log('[Passkey Verify Auth] Found FIDO2 device for selection:', {
					deviceId: fido2DeviceId,
					deviceCount: fido2Devices.length,
				});

				// Select the FIDO2 device
				const selectEndpoint = `${authPath}/${environmentId}/deviceAuthentications/${authenticationId}`;
				const selectRequestBody = {
					device: { id: fido2DeviceId },
					compatibility: 'FULL',
				};

				const selectStartTime = Date.now();
				const selectResponse = await global.fetch(selectEndpoint, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${cleanToken}`,
						'Content-Type': 'application/vnd.pingidentity.device.select+json',
					},
					body: JSON.stringify(selectRequestBody),
				});
				const selectDuration = Date.now() - selectStartTime;
				
				const selectResponseClone = selectResponse.clone();
				let selectData;
				try {
					selectData = await selectResponseClone.json();
				} catch {
					selectData = { error: 'Failed to parse response' };
				}
				
				logPingOneApiCall(
					'Select Device (Passkey Verify)',
					selectEndpoint,
					'POST',
					{
						Authorization: `Bearer ${cleanToken.substring(0, 20)}...***REDACTED***`,
						'Content-Type': 'application/vnd.pingidentity.device.select+json',
					},
					selectRequestBody,
					selectResponse,
					selectData,
					selectDuration,
					{ environmentId, authenticationId, fido2DeviceId }
				);

				if (!selectResponse.ok) {
					const errorData = selectData || {};
					
					// Check for NO_USABLE_DEVICES error
					if (errorData.error?.code === 'NO_USABLE_DEVICES') {
						return res.status(400).json({
							error: 'NO_USABLE_DEVICES',
							message: errorData.error.message || 'No usable devices found for authentication',
							unavailableDevices: errorData.error.unavailableDevices || [],
							status: 'FAILED',
						});
					}

					return res.status(selectResponse.status).json({
						error: 'Failed to select device',
						message: errorData.message || errorData.error || selectResponse.statusText,
					});
				}

				// Update authentication data after device selection
				// selectData was already parsed above for logging
				Object.assign(initData, selectData);
			} else {
				return res.status(400).json({
					error: 'No FIDO2 device found',
					message: 'Device selection is required but no FIDO2 devices are available',
				});
			}
		} else if (initData.device?.id) {
			// Device was auto-selected, use it
			fido2DeviceId = initData.device.id;
		}

		// Step 5: Verify WebAuthn assertion with PingOne
		// Use the Check Assertion endpoint (not /fido2 endpoint)
		// POST {{authPath}}/{{envID}}/deviceAuthentications/{{deviceAuthID}}
		// Content-Type: application/vnd.pingidentity.assertion.check+json
		// API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-check-assertion-fido-device
		const checkAssertionEndpoint = `${authPath}/${environmentId}/deviceAuthentications/${authenticationId}`;
		
		// Build assertion object according to PingOne API spec
		// Request body structure per PingOne API docs:
		// {
		//   "assertion": {
		//     "id": "credential-id",
		//     "rawId": "base64-encoded-raw-id",
		//     "type": "public-key",
		//     "response": {
		//       "clientDataJSON": "base64-encoded-client-data",
		//       "authenticatorData": "base64-encoded-authenticator-data",
		//       "signature": "base64-encoded-signature",
		//       "userHandle": "base64-encoded-user-handle" (optional, for discoverable credentials)
		//     }
		//   }
		// }
		const assertionRequestBody = {
			assertion: {
				id: credentialId, // WebAuthn credential ID
				rawId: rawId, // Base64-encoded raw credential ID
				type: 'public-key',
				response: {
					clientDataJSON: webauthnResponse.clientDataJSON,
					authenticatorData: webauthnResponse.authenticatorData,
					signature: webauthnResponse.signature,
					...(webauthnResponse.userHandle && { userHandle: webauthnResponse.userHandle }),
				},
			},
		};

		console.log('[Passkey Verify Auth] Checking assertion with PingOne:', {
			endpoint: checkAssertionEndpoint,
			authenticationId,
			hasCredentialId: !!credentialId,
			hasRawId: !!rawId,
			hasClientDataJSON: !!webauthnResponse.clientDataJSON,
			hasAuthenticatorData: !!webauthnResponse.authenticatorData,
			hasSignature: !!webauthnResponse.signature,
			hasUserHandle: !!webauthnResponse.userHandle,
		});

		const startTime = Date.now();
		const verifyResponse = await global.fetch(checkAssertionEndpoint, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/vnd.pingidentity.assertion.check+json',
				Accept: 'application/json',
			},
			body: JSON.stringify(assertionRequestBody),
		});
		
		const duration = Date.now() - startTime;
		
		// Clone response for logging (before consuming body)
		const verifyResponseClone = verifyResponse.clone();
		let verifyResponseData;
		try {
			verifyResponseData = await verifyResponseClone.json();
		} catch {
			verifyResponseData = { error: 'Failed to parse response' };
		}
		
		// Log the actual PingOne API call
		logPingOneApiCall(
			'Check Assertion (FIDO Device) - Passkey Verify',
			checkAssertionEndpoint,
			'POST',
			{
				'Content-Type': 'application/vnd.pingidentity.assertion.check+json',
				Authorization: `Bearer ${cleanToken.substring(0, 20)}...***REDACTED***`,
				Accept: 'application/json',
			},
			assertionRequestBody,
			verifyResponse,
			verifyResponseData,
			duration,
			{
				environmentId,
				authenticationId,
				hasUserHandle: !!webauthnResponse.userHandle,
			}
		);

		if (!verifyResponse.ok) {
			// verifyResponseData was already parsed above for logging
			const errorData = verifyResponseData || { error: { message: verifyResponse.statusText } };

			// Check for NO_USABLE_DEVICES error
			if (errorData.error?.code === 'NO_USABLE_DEVICES') {
				console.error('[Passkey Verify Auth] NO_USABLE_DEVICES error during assertion check:', {
					message: errorData.error.message,
					unavailableDevices: errorData.error.unavailableDevices || [],
				});
				return res.status(400).json({
					error: 'NO_USABLE_DEVICES',
					message: errorData.error.message || 'No usable devices found for authentication',
					unavailableDevices: errorData.error.unavailableDevices || [],
					status: 'FAILED',
				});
			}

			return res.status(verifyResponse.status).json({
				error: 'Failed to verify authentication',
				message: errorData.error?.message || errorData.message || verifyResponse.statusText,
				details: errorData,
			});
		}

		// verifyResponseData was already parsed above for logging
		const verifyData = verifyResponseData;

		console.log('[Passkey Verify Auth] Authentication verified successfully', {
			userId,
			username,
			authenticationId,
			status: verifyData.status,
			nextStep: verifyData.nextStep,
		});

		res.json({
			success: true,
			userId,
			username,
			authenticationId,
			status: verifyData.status,
			nextStep: verifyData.nextStep,
			_links: verifyData._links,
		});
	} catch (error) {
		console.error('[Passkey Verify Auth] Error:', error);
		res.status(500).json({
			error: 'Failed to verify authentication',
			message: error.message,
		});
	}
});

/**
 * Get passkey registration options
 * POST /api/auth/passkey/options/registration
 * 
 * Flow:
 * 1. Lookup user in PingOne by username
 * 2. Create FIDO2 device in PingOne (ACTIVATION_REQUIRED status)
 * 3. Get publicKeyCredentialCreationOptions from PingOne response
 * 4. Return options to frontend for WebAuthn create()
 */
app.post('/api/auth/passkey/options/registration', async (req, res) => {
	try {
		const { environmentId, username, deviceAuthenticationPolicyId, deviceName } = req.body;

		if (!environmentId || !username || !deviceAuthenticationPolicyId) {
			return res.status(400).json({
				error: 'Missing required fields',
				message: 'environmentId, username, and deviceAuthenticationPolicyId are required',
			});
		}

		// Get worker token
		const { workerToken } = req.body;
		if (!workerToken) {
			return res.status(400).json({
				error: 'Missing worker token',
				message: 'workerToken is required for device registration',
			});
		}

		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		// Step 1: Lookup user
		const lookupResponse = await global.fetch(
			`https://api.pingone.com/v1/environments/${environmentId}/users?filter=username eq "${encodeURIComponent(username)}"`,
			{
				method: 'GET',
				headers: {
					Authorization: `Bearer ${cleanToken}`,
					'Content-Type': 'application/json',
				},
			}
		);

		if (!lookupResponse.ok) {
			return res.status(lookupResponse.status).json({
				error: 'Failed to lookup user',
				message: 'Could not find user by username',
			});
		}

		const usersData = await lookupResponse.json();
		const user = usersData._embedded?.users?.[0];
		if (!user) {
			return res.status(404).json({
				error: 'User not found',
				message: `User with username "${username}" not found`,
			});
		}

		const userId = user.id;

		// Step 2: Create FIDO2 device in PingOne
		const deviceEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices`;
		const rpId = req.headers.host?.split(':')[0] || 'localhost';
		
		const devicePayload = {
			type: 'FIDO2',
			status: 'ACTIVATION_REQUIRED',
			policy: {
				id: deviceAuthenticationPolicyId,
			},
			rp: {
				id: rpId,
				name: rpId, // Use RP ID as name (no spaces)
			},
		};

		const deviceResponse = await global.fetch(deviceEndpoint, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(devicePayload),
		});

		if (!deviceResponse.ok) {
			const errorData = await deviceResponse.json().catch(() => ({}));
			return res.status(deviceResponse.status).json({
				error: 'Failed to create FIDO2 device',
				message: errorData.message || errorData.error || deviceResponse.statusText,
			});
		}

		const deviceData = await deviceResponse.json();
		const deviceId = deviceData.id;
		const publicKeyCredentialCreationOptions = deviceData.publicKeyCredentialCreationOptions;

		if (!publicKeyCredentialCreationOptions) {
			return res.status(500).json({
				error: 'Missing registration options',
				message: 'PingOne did not return publicKeyCredentialCreationOptions',
			});
		}

		// Parse the options string from PingOne
		let publicKeyOptions;
		try {
			publicKeyOptions = JSON.parse(publicKeyCredentialCreationOptions);
		} catch (parseError) {
			return res.status(500).json({
				error: 'Invalid registration options',
				message: 'Failed to parse publicKeyCredentialCreationOptions from PingOne',
			});
		}

		console.log('[Passkey Reg Options] Generated registration options', {
			environmentId,
			userId,
			deviceId,
			rpId: publicKeyOptions.rp?.id,
		});

		res.json({
			publicKey: publicKeyOptions,
			deviceId,
			userId,
		});
	} catch (error) {
		console.error('[Passkey Reg Options] Error:', error);
		res.status(500).json({
			error: 'Failed to get registration options',
			message: error.message,
		});
	}
});

/**
 * Verify passkey registration
 * POST /api/auth/passkey/verify-registration
 * 
 * Flow:
 * 1. Activate FIDO2 device in PingOne with WebAuthn attestation
 * 2. Return success with deviceId and userId
 */
app.post('/api/auth/passkey/verify-registration', async (req, res) => {
	try {
		const {
			environmentId,
			username,
			deviceId,
			credentialId,
			rawId,
			response: webauthnResponse,
		} = req.body;

		if (!environmentId || !username || !deviceId || !webauthnResponse) {
			return res.status(400).json({
				error: 'Missing required fields',
				message: 'environmentId, username, deviceId, and response are required',
			});
		}

		// Get worker token
		const { workerToken } = req.body;
		if (!workerToken) {
			return res.status(400).json({
				error: 'Missing worker token',
				message: 'workerToken is required for device activation',
			});
		}

		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		// Step 1: Lookup user
		const lookupResponse = await global.fetch(
			`https://api.pingone.com/v1/environments/${environmentId}/users?filter=username eq "${encodeURIComponent(username)}"`,
			{
				method: 'GET',
				headers: {
					Authorization: `Bearer ${cleanToken}`,
					'Content-Type': 'application/json',
				},
			}
		);

		if (!lookupResponse.ok) {
			return res.status(lookupResponse.status).json({
				error: 'Failed to lookup user',
				message: 'Could not find user by username',
			});
		}

		const usersData = await lookupResponse.json();
		const user = usersData._embedded?.users?.[0];
		if (!user) {
			return res.status(404).json({
				error: 'User not found',
				message: `User with username "${username}" not found`,
			});
		}

		const userId = user.id;

		// Step 2: Activate FIDO2 device with attestation
		const activateEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}/activate/fido2`;
		const origin = `${req.protocol}://${req.headers.host}`;
		
		const activatePayload = {
			origin: origin,
			attestation: webauthnResponse.attestationObject,
		};

		const activateResponse = await global.fetch(activateEndpoint, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${cleanToken}`,
				'Content-Type': 'application/vnd.pingidentity.device.activate+json',
			},
			body: JSON.stringify(activatePayload),
		});

		if (!activateResponse.ok) {
			const errorData = await activateResponse.json().catch(() => ({}));
			return res.status(activateResponse.status).json({
				error: 'Failed to activate device',
				message: errorData.message || errorData.error || activateResponse.statusText,
			});
		}

		const activateData = await activateResponse.json();

		console.log('[Passkey Verify Reg] Device activated successfully', {
			deviceId,
			userId,
			status: activateData.status,
		});

		res.json({
			success: true,
			deviceId,
			userId,
			status: activateData.status,
		});
	} catch (error) {
		console.error('[Passkey Verify Reg] Error:', error);
		res.status(500).json({
			error: 'Failed to verify registration',
			message: error.message,
		});
	}
});

// ============================================================================
// MFA SETTINGS ENDPOINTS
// ============================================================================
// Get MFA Settings
// GET /v1/environments/{envID}/mfaSettings
// API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#read-mfa-settings
app.post('/api/pingone/mfa/get-mfa-settings', async (req, res) => {
	try {
		const { environmentId, workerToken } = req.body;
		if (!environmentId || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		const region = req.body.region || 'na';
		const apiBase =
			region === 'eu'
				? 'https://api.pingone.eu'
				: region === 'asia'
					? 'https://api.pingone.asia'
					: 'https://api.pingone.com';
		const settingsEndpoint = `${apiBase}/v1/environments/${environmentId}/mfaSettings`;

		console.log('[MFA Settings] Fetching settings:', { environmentId });

		const response = await global.fetch(settingsEndpoint, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${cleanToken}`,
			},
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			console.error('[MFA Settings] Error:', errorData);
			return res.status(response.status).json(errorData);
		}

		const settingsData = await response.json();
		console.log('[MFA Settings] Success');
		res.json(settingsData);
	} catch (error) {
		console.error('[MFA Settings] Error:', error);
		res.status(500).json({ error: 'Failed to get MFA settings', message: error.message });
	}
});

// Update MFA Settings
// PUT /v1/environments/{envID}/mfaSettings
// API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#update-mfa-settings
app.post('/api/pingone/mfa/update-mfa-settings', async (req, res) => {
	try {
		const { environmentId, settings, workerToken } = req.body;
		if (!environmentId || !settings || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		const region = req.body.region || 'na';
		const apiBase =
			region === 'eu'
				? 'https://api.pingone.eu'
				: region === 'asia'
					? 'https://api.pingone.asia'
					: 'https://api.pingone.com';
		const settingsEndpoint = `${apiBase}/v1/environments/${environmentId}/mfaSettings`;

		console.log('[MFA Settings] Updating settings:', { environmentId });

		const response = await global.fetch(settingsEndpoint, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${cleanToken}`,
			},
			body: JSON.stringify(settings),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			console.error('[MFA Settings] Error:', errorData);
			return res.status(response.status).json(errorData);
		}

		const settingsData = await response.json();
		console.log('[MFA Settings] Updated successfully');
		res.json(settingsData);
	} catch (error) {
		console.error('[MFA Settings] Error:', error);
		res.status(500).json({ error: 'Failed to update MFA settings', message: error.message });
	}
});

// Reset MFA Settings
// DELETE /v1/environments/{envID}/mfaSettings
// API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#reset-mfa-settings
app.post('/api/pingone/mfa/reset-mfa-settings', async (req, res) => {
	try {
		const { environmentId, workerToken } = req.body;
		if (!environmentId || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		const region = req.body.region || 'na';
		const apiBase =
			region === 'eu'
				? 'https://api.pingone.eu'
				: region === 'asia'
					? 'https://api.pingone.asia'
					: 'https://api.pingone.com';
		const settingsEndpoint = `${apiBase}/v1/environments/${environmentId}/mfaSettings`;

		console.log('[MFA Settings] Resetting settings:', { environmentId });

		const response = await global.fetch(settingsEndpoint, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${cleanToken}`,
			},
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			console.error('[MFA Settings] Error:', errorData);
			return res.status(response.status).json(errorData);
		}

		// DELETE typically returns 204 No Content
		if (response.status === 204) {
			console.log('[MFA Settings] Reset successfully');
			return res.status(204).send();
		}

		const settingsData = await response.json();
		console.log('[MFA Settings] Reset successfully');
		res.json(settingsData);
	} catch (error) {
		console.error('[MFA Settings] Error:', error);
		res.status(500).json({ error: 'Failed to reset MFA settings', message: error.message });
	}
});

// API endpoint not found handler - MUST be after all API route definitions
app.use('/api', (req, res) => {
	console.error('[API 404] Endpoint not found:', {
		method: req.method,
		path: req.path,
		query: req.query,
		body: req.body,
	});
	res.status(404).json({
		error: 'endpoint_not_found',
		message: `API endpoint not found: ${req.method} ${req.path}`,
		path: req.path,
		method: req.method,
	});
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

// Start both HTTP and HTTPS servers
const certs = generateSelfSignedCert();
let httpsServer;
let httpServer;

// Start HTTP server for proxy
httpServer = app.listen(PORT, '0.0.0.0', () => {
	console.log(`🚀 OAuth Playground Backend Server running on port ${PORT} (HTTP)`);
	console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
	console.log(`🔐 Token exchange: http://localhost:${PORT}/api/token-exchange`);
	console.log(`👤 UserInfo: http://localhost:${PORT}/api/userinfo`);
	console.log(`🔌 Device UserInfo: http://localhost:${PORT}/api/device-userinfo`);
	console.log(`✅ Token validation: http://localhost:${PORT}/api/validate-token`);
});

// Start HTTPS server if certificates are available
if (certs) {
	try {
		const options = {
			key: fs.readFileSync(certs.keyPath),
			cert: fs.readFileSync(certs.certPath),
		};

		httpsServer = https.createServer(options, app).listen(PORT + 1, '0.0.0.0', () => {
			console.log(`🔐 OAuth Playground Backend Server running on port ${PORT + 1} (HTTPS)`);
			console.log(`📡 Health check: https://localhost:${PORT + 1}/api/health`);
			console.log(`🔐 Token exchange: https://localhost:${PORT + 1}/api/token-exchange`);
			console.log(`👤 UserInfo: https://localhost:${PORT + 1}/api/userinfo`);
			console.log(`🔌 Device UserInfo: https://localhost:${PORT + 1}/api/device-userinfo`);
			console.log(`✅ Token validation: https://localhost:${PORT + 1}/api/validate-token`);
		});
	} catch (error) {
		console.error('❌ Failed to start HTTPS server:', error.message);
		console.log('🔄 Continuing with HTTP server only...');
	}
}

// Add error handling for both servers
httpServer.on('error', (err) => {
	console.error('❌ HTTP Server error:', err);
});

httpServer.on('listening', () => {
	const addr = httpServer.address();
	console.log(`🌐 HTTP Server listening on:`, addr);
});

if (httpsServer) {
	httpsServer.on('error', (err) => {
		console.error('❌ HTTPS Server error:', err);
	});

	httpsServer.on('listening', () => {
		const addr = httpsServer.address();
		console.log(`🌐 HTTPS Server listening on:`, addr);
	});
}

export default app;
