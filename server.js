/* eslint-disable */
console.log('🚀 Starting OAuth Playground Backend Server...'); // OAuth Playground Backend Server

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
import fetch from 'node-fetch';

dotenv.config();

// Ensure fetch is available globally for server handlers that reference global.fetch
if (typeof globalThis.fetch !== 'function') {
	// @ts-expect-error
	globalThis.fetch = fetch;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

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
		exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
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
			username,
			password,
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
		} else if (grant_type === 'urn:ietf:params:oauth:grant-type:device_code') {
			// Device code grant (RFC 8628)
			if (!req.body.device_code || req.body.device_code.trim() === '') {
				console.error('❌ [Server] Missing device_code for device_code grant');
				return res.status(400).json({
					error: 'invalid_request',
					error_description: 'Missing required parameter: device_code',
				});
			}
		} else if (grant_type === 'client_credentials') {
			// Client credentials grant only needs client_id and client_secret (handled by auth method)
			console.log('🔑 [Server] Validating client_credentials grant type');
		} else if (grant_type === 'password') {
			// Resource Owner Password Credentials grant (ROPC) - RFC 6749 Section 4.3
			if (!req.body.username || req.body.username.trim() === '') {
				console.error('❌ [Server] Missing username for password grant');
				return res.status(400).json({
					error: 'invalid_request',
					error_description: 'Missing required parameter: username',
				});
			}
			if (!req.body.password || req.body.password.trim() === '') {
				console.error('❌ [Server] Missing password for password grant');
				return res.status(400).json({
					error: 'invalid_request',
					error_description: 'Missing required parameter: password',
				});
			}
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
		} else if (grant_type === 'urn:ietf:params:oauth:grant-type:device_code') {
			// Device code grant (RFC 8628)
			console.log('📱 [Server] Building device code request body');
			tokenRequestBody = new URLSearchParams({
				grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
				client_id: client_id,
				device_code: req.body.device_code,
			});
		} else if (grant_type === 'password') {
			// Resource Owner Password Credentials grant (ROPC) - RFC 6749 Section 4.3
			console.log('🔐 [Server] Building password grant request body');
			const params = {
				grant_type: 'password',
				client_id: client_id,
				username: req.body.username,
				password: req.body.password,
			};
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
		const tokenResponse = await fetch(tokenEndpoint, {
			method: 'POST',
			headers,
			body: tokenRequestBody.toString(),
		});

		console.log('📥 [Server] PingOne token response:', {
			status: tokenResponse.status,
			statusText: tokenResponse.statusText,
			ok: tokenResponse.ok,
			headers: Object.fromEntries(tokenResponse.headers.entries()),
		});

		const responseData = await tokenResponse.json();

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
		};

		// Only include custom headers (like Authorization for Basic auth) if NOT using JWT-based authentication
		// JWT assertions (client_secret_jwt, private_key_jwt) should be in the request body, NOT in headers
		if (customHeaders && auth_method !== 'client_secret_jwt' && auth_method !== 'private_key_jwt') {
			Object.assign(headers, customHeaders);
		}

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

		let response;
		try {
			response = await global.fetch(introspection_endpoint, {
				method: 'POST',
				headers: headers,
				body: introspectionBody,
			});
		} catch (fetchError) {
			console.error(`[Introspect Token] Fetch failed:`, {
				error: fetchError instanceof Error ? fetchError.message : String(fetchError),
				introspectionEndpoint: introspection_endpoint,
			});
			throw new Error(
				`Failed to connect to introspection endpoint: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`
			);
		}

		let data;
		try {
			const responseText = await response.text();
			if (!responseText) {
				throw new Error('Empty response from introspection endpoint');
			}
			data = JSON.parse(responseText);
		} catch (parseError) {
			console.error(`[Introspect Token] Failed to parse response:`, {
				status: response.status,
				statusText: response.statusText,
				error: parseError instanceof Error ? parseError.message : String(parseError),
			});
			return res.status(500).json({
				error: 'invalid_response',
				error_description: `Failed to parse introspection response: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`,
			});
		}

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
		const errorMessage =
			error instanceof Error ? error.message : String(error || 'Internal server error');
		const errorStack = error instanceof Error ? error.stack : undefined;
		console.error('[Introspect Token] Error details:', {
			message: errorMessage,
			stack: errorStack,
			type: typeof error,
		});
		res.status(500).json({
			error: 'server_error',
			error_description: errorMessage || 'Internal server error during token introspection',
			details: errorStack ? 'Check server logs for details' : undefined,
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
				const directResponse = await global.fetch(
					`${apiBaseUrl}/${encodeURIComponent(trimmedIdentifier)}`,
					{
						headers,
					}
				);
				if (directResponse.ok) {
					const user = await directResponse.json();
					console.log('[PingOne User Lookup] ✅ Direct ID match found');
					return res.json({ user, matchType: 'id' });
				}
				if (directResponse.status !== 404) {
					const errorBody = await directResponse.json().catch(() => ({}));
					return res.status(directResponse.status).json(errorBody);
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

				const searchResponse = await global.fetch(queryUrl, { headers });
				const payloadText = await searchResponse.text();
				let searchData = {};

				try {
					searchData = payloadText ? JSON.parse(payloadText) : {};
				} catch (parseError) {
					console.error(
						`[PingOne User Lookup] Failed to parse response for filter ${filter}:`,
						payloadText.substring(0, 200)
					);
					continue;
				}

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
			client_secret,
			client_auth_method,
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

		// Handle client authentication
		const headers = {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json',
		};

		if (client_secret) {
			const authMethod = client_auth_method || 'client_secret_basic';

			if (authMethod === 'client_secret_basic') {
				const basicAuth = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
				headers['Authorization'] = `Basic ${basicAuth}`;
			} else if (authMethod === 'client_secret_post') {
				formData.append('client_secret', client_secret);
			}
		}

		const response = await global.fetch(deviceEndpoint, {
			method: 'POST',
			headers,
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
		const { environment_id, client_id, client_secret, client_auth_method, ...parParams } = req.body;

		// Log incoming request for debugging
		console.log(`[PAR] Incoming request:`, {
			hasEnvironmentId: !!environment_id,
			hasClientId: !!client_id,
			hasClientSecret: !!client_secret,
			clientSecretLength: client_secret?.length || 0,
			clientAuthMethod: client_auth_method || 'not provided',
			requestBodyKeys: Object.keys(req.body),
		});

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
			clientSecretLength: client_secret?.length || 0,
			clientAuthMethod: parParams.client_auth_method,
			parParams: Object.keys(parParams),
			redirectUri: parParams.redirect_uri,
		});

		// Validate that we have client secret for confidential clients
		// client_auth_method can be in parParams or directly in req.body
		const authMethod = client_auth_method || parParams.client_auth_method || 'client_secret_post';

		const formData = new URLSearchParams();

		// Add PAR parameters to form data (excluding auth-related fields which are handled separately)
		Object.entries(parParams).forEach(([key, value]) => {
			if (
				value !== undefined &&
				value !== null &&
				key !== 'client_auth_method' &&
				key !== 'client_id' &&
				key !== 'client_secret' &&
				key !== 'client_assertion_type' &&
				key !== 'client_assertion'
			) {
				formData.append(key, value.toString());
			}
		});

		const headers = {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json',
		};

		// Add client authentication based on method
		if (authMethod === 'client_secret_basic' && client_secret) {
			// For "Client Secret Basic" method, use Authorization header AND include client_id in form data
			const credentials = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
			headers['Authorization'] = `Basic ${credentials}`;
			formData.append('client_id', client_id);
			console.log(`[PAR] Using Basic authentication for client: ${client_id}`);
		} else if (authMethod === 'client_secret_post' && client_secret) {
			// For "Client Secret Post" method, include both client_id and client_secret in form data
			formData.append('client_id', client_id);
			formData.append('client_secret', client_secret);
			console.log(`[PAR] Using client_secret_post method for client: ${client_id}`);
		} else if (authMethod === 'client_secret_jwt' || authMethod === 'private_key_jwt') {
			// JWT-based authentication methods
			const { client_assertion_type, client_assertion } = req.body;

			if (client_assertion_type && client_assertion) {
				console.log(`[PAR] Using JWT assertion for ${authMethod}:`, {
					clientId: `${client_id?.substring(0, 8)}...`,
					assertionType: client_assertion_type,
					assertionLength: client_assertion?.length || 0,
				});

				formData.append('client_id', client_id);
				formData.append('client_assertion_type', client_assertion_type);
				formData.append('client_assertion', client_assertion);
				// Don't add client_secret for JWT methods
			} else {
				console.error(`[PAR] Missing JWT assertion for ${authMethod}`);
				return res.status(400).json({
					error: 'invalid_request',
					error_description: `client_assertion and client_assertion_type are required for ${authMethod} authentication`,
				});
			}
		} else if (!client_secret) {
			// No client secret provided - this might be a public client or missing secret
			formData.append('client_id', client_id);
			console.warn(`[PAR] ⚠️ No client secret provided for client: ${client_id}`, {
				authMethod,
				note: 'This may cause 401 if the application requires client authentication',
			});
		} else {
			// Unknown auth method or other case
			formData.append('client_id', client_id);
			if (authMethod !== 'none') {
				console.warn(`[PAR] ⚠️ Unhandled authentication method: ${authMethod}`, {
					hasClientSecret: !!client_secret,
				});
			}
		}

		console.log(`[PAR] Sending to PingOne:`, {
			url: parEndpoint,
			headers: { ...headers, Authorization: headers.Authorization ? '[REDACTED]' : undefined },
			body: formData.toString().replace(/client_secret=[^&]*/g, 'client_secret=[REDACTED]'),
			redirectUri: formData.get('redirect_uri'),
			authMethod: authMethod,
			hasClientSecret: !!client_secret,
		});

		const response = await global.fetch(parEndpoint, {
			method: 'POST',
			headers,
			body: formData,
		});

		const responseText = await response.text();
		let data;
		try {
			data = JSON.parse(responseText);
		} catch {
			data = { error: 'parse_error', error_description: responseText };
		}

		if (!response.ok) {
			console.error(`[PAR] PingOne error:`, {
				status: response.status,
				statusText: response.statusText,
				authMethod: authMethod,
				hasClientSecret: !!client_secret,
				clientSecretLength: client_secret?.length || 0,
				error: data,
				responseText: responseText.substring(0, 500),
			});
			return res.status(response.status).json({
				...data,
				debug: {
					authMethod,
					hasClientSecret: !!client_secret,
				},
			});
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
// Set MFA Device Order
// POST /api/pingone/mfa/device-order
// Sets the order of MFA devices for a user
app.post('/api/pingone/mfa/device-order', async (req, res) => {
	try {
		const { environmentId, userId, deviceIds, workerToken } = req.body;

		if (!environmentId || !userId || !Array.isArray(deviceIds) || !workerToken) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description:
					'Missing required parameters: environmentId, userId, deviceIds (array), or workerToken',
				timestamp: new Date().toISOString(),
			});
		}

		// Validate worker token format
		if (typeof workerToken !== 'string') {
			return res.status(400).json({ error: 'Worker token must be a string' });
		}

		// Normalize and validate worker token
		let cleanToken = String(workerToken).trim();

		// Remove any existing "Bearer " prefix if accidentally included
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');

		// Remove all whitespace, newlines, carriage returns, and tabs
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		// Basic JWT format check (should have 3 parts separated by dots)
		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3) {
			console.error('[MFA Device Order] Token does not appear to be a valid JWT format', {
				partsCount: tokenParts.length,
				tokenLength: cleanToken.length,
				tokenStart: cleanToken.substring(0, 30),
			});
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		// Validate token parts are not empty
		if (tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token is malformed. Please generate a new token.',
			});
		}

		console.log(`[MFA Device Order] Setting device order for user ${userId}`, {
			environmentId,
			deviceCount: deviceIds.length,
		});

		// Call PingOne MFA API to set device order
		const response = await global.fetch(
			`https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/order`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${cleanToken}`,
					'Content-Type': 'application/json',
					Accept: 'application/json',
					'X-Request-ID': randomUUID(),
				},
				body: JSON.stringify({
					devices: deviceIds.map((id) => ({ id })),
				}),
			}
		);

		if (!response.ok) {
			let errorData;
			let errorText = '';
			try {
				errorText = await response.text();
				if (errorText) {
					errorData = JSON.parse(errorText);
				}
			} catch (parseError) {
				// If parsing fails, errorData will be undefined, but we have errorText
				console.error(`[MFA Device Order] Failed to parse error response:`, {
					parseError: parseError.message,
					status: response.status,
					statusText: response.statusText,
					bodyPreview: errorText.substring(0, 200),
				});
			}

			console.error(`[MFA Device Order] PingOne error:`, {
				status: response.status,
				error: errorData || errorText.substring(0, 200),
			});

			return res.status(response.status).json({
				error: errorData?.error || 'set_device_order_failed',
				error_description:
					errorData?.error_description ||
					errorData?.message ||
					response.statusText ||
					'Failed to set device order',
				details: errorData || (errorText ? { body: errorText.substring(0, 200) } : {}),
			});
		}

		// Handle successful response
		let responseData;
		try {
			const responseText = await response.text();
			if (responseText && responseText.trim()) {
				responseData = JSON.parse(responseText);
			} else {
				// Some endpoints return 204 No Content on success
				responseData = { success: true };
			}
		} catch (parseError) {
			console.error(`[MFA Device Order] Failed to parse response:`, {
				error: parseError.message,
				status: response.status,
				statusText: response.statusText,
			});
			// If parsing fails but status is 2xx, treat as success
			if (response.status >= 200 && response.status < 300) {
				responseData = { success: true };
			} else {
				return res.status(500).json({
					error: 'Failed to parse response',
					message: 'The server returned an invalid response format',
				});
			}
		}

		console.log(`[MFA Device Order] Successfully set device order for user ${userId}`, {
			environmentId,
			deviceCount: deviceIds.length,
		});

		res.json({
			success: true,
			environmentId,
			userId,
			deviceCount: deviceIds.length,
			updatedAt: new Date().toISOString(),
			...responseData,
		});
	} catch (error) {
		console.error(`[MFA Device Order] Error:`, error);
		res.status(500).json({
			error: 'Failed to set device order',
			message: error.message,
		});
	}
});

// PingOne MFA Challenge Verification Endpoint
app.post('/api/mfa/challenge/verify', async (req, res) => {
	try {
		const { environmentId, challengeId, challengeCode, userId } = req.body;

		console.log(`[PingOne MFA] Challenge verification request:`, {
			environmentId,
			challengeId,
			challengeCode: challengeCode ? `${challengeCode.substring(0, 2)}***` : 'none',
			userId,
		});

		// Make real API call to PingOne for MFA challenge verification
		const pingOneVerifyUrl = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/challenges/${challengeId}/verify`;

		const verifyRequestBody = {
			challengeCode: challengeCode,
		};

		console.log(`[PingOne MFA] Making real API call to PingOne for verification:`, {
			url: pingOneVerifyUrl,
			method: 'POST',
			body: { challengeCode: challengeCode ? `${challengeCode.substring(0, 2)}***` : 'none' },
		});

		const pingOneResponse = await fetch(pingOneVerifyUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${req.headers.authorization?.replace('Bearer ', '')}`,
			},
			body: JSON.stringify(verifyRequestBody),
		});

		if (!pingOneResponse.ok) {
			const errorData = await pingOneResponse.json();
			console.error(`[PingOne MFA] PingOne challenge verification failed:`, errorData);
			return res.status(pingOneResponse.status).json({
				success: false,
				error: errorData.error || 'verification_failed',
				error_description:
					errorData.error_description || errorData.message || 'Failed to verify MFA challenge',
				server_timestamp: new Date().toISOString(),
			});
		}

		const verifyData = await pingOneResponse.json();
		console.log(`[PingOne MFA] PingOne challenge verified successfully:`, verifyData);

		res.json({
			success: true,
			challengeId: challengeId,
			userId: userId,
			status: verifyData.status || 'VERIFIED',
			message: 'MFA challenge completed successfully',
			verifiedAt: new Date().toISOString(),
			server_timestamp: new Date().toISOString(),
			pingOneResponse: verifyData,
		});
	} catch (error) {
		console.error('[PingOne MFA] Challenge verification server error:', error);
		res.status(500).json({
			success: false,
			error: 'server_error',
			error_description: 'Internal server error during MFA challenge verification',
			details: error.message,
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
			environmentId: `${environmentId?.substring(0, 8)}...`,
			userId: `${userId?.substring(0, 8)}...`,
		});

		// PingOne Platform API - Send recovery code
		// Note: PingOne may send recovery code automatically when recover endpoint is called
		// For now, we'll use the password recovery endpoint to trigger code sending
		// This endpoint may need adjustment based on actual PingOne API behavior
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
		} catch (e) {
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
			return res.status(pingOneResponse.status).json({
				error: responseData.error || 'unknown_error',
				error_description:
					responseData.error_description || responseData.message || 'Failed to send recovery code',
			});
		}

		console.log('[🔐 PASSWORD] ✅ Recovery code sent successfully');
		res.json({
			success: true,
			message: 'Recovery code sent successfully',
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
			environmentId: `${environmentId?.substring(0, 8)}...`,
			userId: `${userId?.substring(0, 8)}...`,
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
			environmentId: `${environmentId?.substring(0, 8)}...`,
			userId: `${userId?.substring(0, 8)}...`,
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
			environmentId: `${environmentId?.substring(0, 8)}...`,
			userId: `${userId?.substring(0, 8)}...`,
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
			environmentId: `${environmentId?.substring(0, 8)}...`,
			userId: `${userId?.substring(0, 8)}...`,
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

// Password Unlock
app.post('/api/pingone/password/unlock', async (req, res) => {
	try {
		const { environmentId, userId, workerToken } = req.body;

		if (!environmentId || !userId || !workerToken) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameters: environmentId, userId, workerToken',
			});
		}

		console.log('[🔐 PASSWORD] Unlocking password...', {
			environmentId: `${environmentId?.substring(0, 8)}...`,
			userId: `${userId?.substring(0, 8)}...`,
		});

		const pingOneUrl = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/password/unlock`;

		const pingOneResponse = await fetch(pingOneUrl, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${workerToken}`,
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify({}),
		});

		let responseData;
		try {
			responseData = await pingOneResponse.json();
		} catch (e) {
			if (pingOneResponse.ok) {
				responseData = { success: true };
			} else {
				responseData = { error: 'unknown_error', error_description: 'Failed to unlock password' };
			}
		}

		if (!pingOneResponse.ok) {
			console.error('[🔐 PASSWORD] Password unlock failed:', responseData);
			return res.status(pingOneResponse.status).json({
				error: responseData.error || 'unknown_error',
				error_description:
					responseData.error_description || responseData.message || 'Password unlock failed',
			});
		}

		console.log('[🔐 PASSWORD] ✅ Password unlocked successfully');
		res.json({
			success: true,
			message: 'Password unlocked successfully',
			transactionId: responseData.id || responseData.transactionId,
		});
	} catch (error) {
		console.error('[🔐 PASSWORD] Error unlocking password:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error',
			details: error.message,
		});
	}
});

// Read Password State
app.get('/api/pingone/password/state', async (req, res) => {
	try {
		const { environmentId, userId, workerToken } = req.query;

		if (!environmentId || !userId || !workerToken) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameters: environmentId, userId, workerToken',
			});
		}

		console.log('[🔐 PASSWORD] Reading password state...', {
			environmentId: `${environmentId?.substring(0, 8)}...`,
			userId: `${userId?.substring(0, 8)}...`,
		});

		const pingOneUrl = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/password`;

		const pingOneResponse = await fetch(pingOneUrl, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${workerToken}`,
				Accept: 'application/json',
			},
		});

		const responseData = await pingOneResponse.json();

		if (!pingOneResponse.ok) {
			console.error('[🔐 PASSWORD] Failed to read password state:', responseData);
			return res.status(pingOneResponse.status).json({
				error: responseData.error || 'unknown_error',
				error_description:
					responseData.error_description || responseData.message || 'Failed to read password state',
			});
		}

		console.log('[🔐 PASSWORD] ✅ Password state read successfully');
		res.json({
			success: true,
			passwordState: responseData,
		});
	} catch (error) {
		console.error('[🔐 PASSWORD] Error reading password state:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error',
			details: error.message,
		});
	}
});

// Update Password (Admin) - Set password directly
app.put('/api/pingone/password/admin-set', async (req, res) => {
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

		console.log('[🔐 PASSWORD] Setting password (admin)...', {
			environmentId: `${environmentId?.substring(0, 8)}...`,
			userId: `${userId?.substring(0, 8)}...`,
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
			console.error('[🔐 PASSWORD] Admin password set failed:', responseData);
			return res.status(pingOneResponse.status).json({
				error: responseData.error || 'unknown_error',
				error_description:
					responseData.error_description || responseData.message || 'Admin password set failed',
			});
		}

		console.log('[🔐 PASSWORD] ✅ Password set successfully (admin)');
		res.json({
			success: true,
			message: 'Password set successfully',
			transactionId: responseData.id || responseData.transactionId,
		});
	} catch (error) {
		console.error('[🔐 PASSWORD] Error setting password (admin):', error);
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
			environmentId: `${environmentId?.substring(0, 8)}...`,
			userId: `${userId?.substring(0, 8)}...`,
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

		console.log('[🔐 PASSWORD] Setting password value...', {
			environmentId: `${environmentId?.substring(0, 8)}...`,
			userId: `${userId?.substring(0, 8)}...`,
			forceChange: forceChange || false,
			bypassPasswordPolicy: bypassPasswordPolicy || false,
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
			environmentId: `${environmentId?.substring(0, 8)}...`,
			userId: `${userId?.substring(0, 8)}...`,
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
		if (deviceType.toLowerCase() === 'sms' || deviceType.toLowerCase() === 'voice') {
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
			requestUri, // PAR request_uri (when using PAR)
			request_uri, // Alternative naming
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

		// Check if PAR request_uri is provided (when using PAR)
		const parRequestUri = requestUri || request_uri;
		if (parRequestUri) {
			console.log(
				`[PingOne Redirectless] Using PAR request_uri: ${parRequestUri.substring(0, 50)}...`
			);
			// When using PAR, only send request_uri and client_id
			authParams.set('response_type', 'code');
			authParams.set('response_mode', 'pi.flow'); // CRITICAL: Enable redirectless flow
			authParams.set('client_id', clientId);
			authParams.set('request_uri', parRequestUri);
			if (state) {
				authParams.set('state', state);
			}
			// Don't add other parameters - they're in the PAR request_uri
		} else {
			// Regular flow (not using PAR) - build all parameters
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

			// Add PKCE parameters - Optional for redirectless flows
			// Only add PKCE if codeChallenge is provided and valid
			if (codeChallenge && typeof codeChallenge === 'string' && codeChallenge.trim().length > 0) {
				authParams.set('code_challenge', codeChallenge.trim());
				authParams.set('code_challenge_method', codeChallengeMethod || 'S256');
				console.log(
					`[PingOne Redirectless] Added PKCE: code_challenge=${codeChallenge.substring(0, 20)}... (length: ${codeChallenge.length})`
				);
			} else if (codeChallenge !== undefined && codeChallenge !== null && codeChallenge !== '') {
				// If codeChallenge was provided but is invalid, log warning but don't fail
				console.warn(`[PingOne Redirectless] Invalid code_challenge provided, skipping PKCE:`, {
					hasCodeChallenge: !!codeChallenge,
					type: typeof codeChallenge,
					length: codeChallenge?.length,
					value:
						typeof codeChallenge === 'string'
							? codeChallenge.substring(0, 50)
							: String(codeChallenge),
				});
			} else {
				console.log(
					`[PingOne Redirectless] No PKCE code_challenge provided - proceeding without PKCE`
				);
			}
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
				`${cookieString.substring(0, 150)}${cookieString.length > 150 ? '...' : ''}`
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

		let response;
		try {
			response = await fetch(wellKnownUrl, {
				method: 'GET',
				headers: {
					Accept: 'application/json',
					'User-Agent': 'OAuth-Playground/1.0',
				},
			});
		} catch (fetchError) {
			console.error('[OIDC Discovery] Fetch failed:', {
				error: fetchError instanceof Error ? fetchError.message : String(fetchError),
				wellKnownUrl,
			});
			throw new Error(
				`Failed to connect to discovery endpoint: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`
			);
		}

		if (!response.ok) {
			const errorText = await response.text();
			console.error('[OIDC Discovery] Failed:', response.status, response.statusText);
			return res.status(response.status).json({
				error: 'discovery_failed',
				error_description: `HTTP ${response.status}: ${response.statusText}`,
				details: errorText,
			});
		}

		let data;
		try {
			const responseText = await response.text();
			if (!responseText) {
				throw new Error('Empty response from discovery endpoint');
			}
			data = JSON.parse(responseText);
		} catch (parseError) {
			console.error('[OIDC Discovery] Failed to parse response:', {
				status: response.status,
				statusText: response.statusText,
				error: parseError instanceof Error ? parseError.message : String(parseError),
			});
			return res.status(500).json({
				error: 'invalid_response',
				error_description: `Failed to parse discovery response: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`,
			});
		}

		console.log('[OIDC Discovery] Success:', {
			issuer: data.issuer,
			hasAuthEndpoint: !!data.authorization_endpoint,
			hasTokenEndpoint: !!data.token_endpoint,
			hasUserInfoEndpoint: !!data.userinfo_endpoint,
		});

		res.json(data);
	} catch (error) {
		console.error('[OIDC Discovery] Error:', error);
		const errorMessage =
			error instanceof Error ? error.message : String(error || 'Internal server error');
		const errorStack = error instanceof Error ? error.stack : undefined;
		console.error('[OIDC Discovery] Error details:', {
			message: errorMessage,
			stack: errorStack,
			type: typeof error,
		});
		res.status(500).json({
			error: 'server_error',
			error_description: errorMessage,
			details: errorStack ? 'Check server logs for details' : undefined,
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
			let tokenResponse;
			try {
				tokenResponse = await fetch(tokenEndpoint, {
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
			} catch (fetchError) {
				clearTimeout(timeout1);
				console.error('[Config Checker] Token fetch failed:', {
					error: fetchError instanceof Error ? fetchError.message : String(fetchError),
					tokenEndpoint,
				});
				return res.status(500).json({
					error: 'fetch_error',
					error_description: `Failed to connect to token endpoint: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
				});
			}
			clearTimeout(timeout1);

			if (!tokenResponse.ok) {
				const errorText = await tokenResponse.text();
				console.error('[Config Checker] Token request failed:', {
					status: tokenResponse.status,
					statusText: tokenResponse.statusText,
					errorText,
				});
				return res.status(400).json({
					error: 'invalid_token_request',
					error_description: `Failed to get worker token: ${tokenResponse.status} ${tokenResponse.statusText}`,
					details: errorText,
				});
			}

			let tokenData;
			try {
				const responseText = await tokenResponse.text();
				if (!responseText) {
					throw new Error('Empty response from token endpoint');
				}
				tokenData = JSON.parse(responseText);
			} catch (parseError) {
				console.error('[Config Checker] Failed to parse token response:', parseError);
				return res.status(500).json({
					error: 'invalid_response',
					error_description: `Failed to parse token response: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`,
				});
			}

			if (!tokenData.access_token) {
				console.error('[Config Checker] Token response missing access_token:', tokenData);
				return res.status(500).json({
					error: 'invalid_token_response',
					error_description: 'Token response missing access_token',
				});
			}

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

		let response;
		try {
			const controller2 = new AbortController();
			const timeout2 = setTimeout(() => controller2.abort(), 10000); // 10s timeout
			response = await fetch(applicationsUrl, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${tokenToUse}`,
					'Content-Type': 'application/json',
				},
				signal: controller2.signal,
			});
			clearTimeout(timeout2);
		} catch (fetchError) {
			console.error('[Config Checker] Fetch failed:', {
				error: fetchError instanceof Error ? fetchError.message : String(fetchError),
				applicationsUrl,
			});
			throw new Error(
				`Failed to connect to applications endpoint: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`
			);
		}

		if (!response.ok) {
			const errorText = await response.text();
			console.error('[Config Checker] Applications request failed:', {
				status: response.status,
				statusText: response.statusText,
				errorText,
			});
			return res.status(response.status).json({
				error: 'api_request_failed',
				error_description: `Failed to fetch applications: ${response.status} ${response.statusText}`,
				details: errorText,
			});
		}

		let data;
		try {
			const responseText = await response.text();
			if (!responseText) {
				throw new Error('Empty response from applications endpoint');
			}
			data = JSON.parse(responseText);
		} catch (parseError) {
			console.error('[Config Checker] Failed to parse applications response:', {
				status: response.status,
				statusText: response.statusText,
				error: parseError instanceof Error ? parseError.message : String(parseError),
			});
			return res.status(500).json({
				error: 'invalid_response',
				error_description: `Failed to parse applications response: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`,
			});
		}

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
			const errorMessage =
				error instanceof Error ? error.message : String(error || 'Unknown error');
			const errorStack = error instanceof Error ? error.stack : undefined;
			console.error('[Config Checker] Error fetching applications:', {
				message: errorMessage,
				stack: errorStack,
				type: typeof error,
				name: error?.name,
			});
			res.status(500).json({
				error: 'server_error',
				error_description: errorMessage || 'Internal server error while fetching applications',
				details: errorStack ? 'Check server logs for details' : undefined,
			});
		}
	}
});

// Get a single application with its client secret
// According to PingOne Workflow Library: https://apidocs.pingidentity.com/pingone/workflow-library/v1/api/#get-step-19-get-the-application-secret
app.get('/api/pingone/applications/:appId', async (req, res) => {
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
				console.log('[Application Fetch] Missing clientId or clientSecret for token request');
				return res.status(400).json({
					error: 'invalid_request',
					error_description: 'Missing required parameters: clientId, clientSecret',
				});
			}

			console.log('[Application Fetch] Getting worker token...');
			const tokenEndpoint = `https://auth.pingone.com/${environmentId}/as/token`;
			const controller1 = new AbortController();
			const timeout1 = setTimeout(() => controller1.abort(), 10000);
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
				console.error('[Application Fetch] Token request failed:', errorText);
				return res.status(400).json({
					error: 'invalid_token_request',
					error_description: 'Failed to get worker token',
				});
			}

			const tokenData = await tokenResponse.json();
			tokenToUse = tokenData.access_token;
			console.log('[Application Fetch] Worker token obtained');
		} else {
			console.log('[Application Fetch] Using provided worker token');
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
		const applicationUrl = `${baseUrl}/v1/environments/${environmentId}/applications/${appId}`;

		console.log(`[Application Fetch] Fetching application from: ${applicationUrl}`);

		const controller2 = new AbortController();
		const timeout2 = setTimeout(() => controller2.abort(), 10000);
		const response = await fetch(applicationUrl, {
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
			let errorData = {};
			try {
				errorData = JSON.parse(errorText);
			} catch {
				errorData = { message: errorText };
			}
			console.error('[Application Fetch] Application request failed:', {
				status: response.status,
				statusText: response.statusText,
				url: applicationUrl,
				error: errorData,
				errorText: errorText.substring(0, 500),
			});
			return res.status(response.status).json({
				error: 'api_request_failed',
				error_description: `Failed to fetch application: ${response.status} ${response.statusText}`,
				details: errorData,
			});
		}

		const data = await response.json();

		// Log detailed response to help debug clientSecret availability
		console.log(`[Application Fetch] Successfully fetched application ${appId}`, {
			hasClientSecret: 'clientSecret' in data,
			clientSecretType: typeof data.clientSecret,
			clientSecretLength: data.clientSecret?.length || 0,
		});

		// PingOne Management API does NOT return clientSecret in GET /applications/:id response
		// We need to make a separate call to GET /applications/:id/secret endpoint
		// Reference: https://apidocs.pingidentity.com/pingone/main/v1/api/#get-application-secret
		const secretUrl = `${baseUrl}/v1/environments/${environmentId}/applications/${appId}/secret`;
		console.log(`[Application Fetch] Fetching client secret from: ${secretUrl}`);

		try {
			const secretController = new AbortController();
			const secretTimeout = setTimeout(() => secretController.abort(), 10000);
			const secretResponse = await fetch(secretUrl, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${tokenToUse}`,
					'Content-Type': 'application/json',
				},
				signal: secretController.signal,
			});
			clearTimeout(secretTimeout);

			if (secretResponse.ok) {
				const secretData = await secretResponse.json();
				console.log(`[Application Fetch] ✅ Client secret retrieved successfully`, {
					responseKeys: Object.keys(secretData),
					hasSecret: 'secret' in secretData,
					hasClientSecret: 'clientSecret' in secretData,
					hasValue: 'value' in secretData,
					secretValue: secretData.secret ? `${secretData.secret.substring(0, 10)}...` : 'none',
					fullResponse: JSON.stringify(secretData),
				});
				// According to PingOne API docs: https://apidocs.pingidentity.com/pingone/platform/v1/api/#application-secret
				// The response contains a "secret" field
				const extractedSecret =
					secretData.secret || secretData.clientSecret || secretData.value || secretData.id;
				if (
					extractedSecret &&
					typeof extractedSecret === 'string' &&
					extractedSecret.trim().length > 0
				) {
					data.clientSecret = extractedSecret;
					console.log(`[Application Fetch] ✅ Client secret extracted and added to response`, {
						secretLength: extractedSecret.length,
					});
				} else {
					console.warn(`[Application Fetch] ⚠️ Secret extracted but is empty or invalid`, {
						extractedSecret: extractedSecret
							? `${extractedSecret.substring(0, 10)}...`
							: 'null/undefined',
						type: typeof extractedSecret,
					});
				}
			} else {
				const secretErrorText = await secretResponse.text();
				console.warn(
					`[Application Fetch] ⚠️ Could not retrieve client secret: ${secretResponse.status} ${secretResponse.statusText}`,
					{
						error: secretErrorText.substring(0, 200),
					}
				);
				// Continue without client secret - it's not always available
			}
		} catch (secretError) {
			if (secretError.name === 'AbortError') {
				console.warn(`[Application Fetch] ⚠️ Client secret request timed out`);
			} else {
				console.warn(
					`[Application Fetch] ⚠️ Error fetching client secret:`,
					secretError.message || secretError
				);
			}
			// Continue without client secret - it's not always available
		}

		console.log(`[Application Fetch] Final response`, {
			hasClientSecret: !!data.clientSecret,
			clientSecretLength: data.clientSecret?.length || 0,
		});

		res.json(data);
	} catch (error) {
		if (error.name === 'AbortError') {
			console.error('[Application Fetch] Request timed out');
			res.status(504).json({
				error: 'timeout',
				error_description: 'Request timed out',
			});
		} else {
			console.error('[Application Fetch] Error fetching application:', error);
			res.status(500).json({
				error: 'server_error',
				error_description: 'Internal server error while fetching application',
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

// Lookup User by Username
app.post('/api/pingone/mfa/lookup-user', async (req, res) => {
	try {
		const { environmentId, username, workerToken } = req.body;

		console.log('[MFA Lookup User] Request:', {
			environmentId: `${environmentId?.substring(0, 8)}...`,
			username,
			hasToken: !!workerToken,
		});

		if (!environmentId || !username || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		// Validate worker token format
		if (typeof workerToken !== 'string') {
			return res.status(400).json({ error: 'Worker token must be a string' });
		}

		// Normalize and validate worker token
		const originalToken = String(workerToken);
		let cleanToken = originalToken;

		// Remove any existing "Bearer " prefix if accidentally included
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');

		// Remove all whitespace, newlines, carriage returns, and tabs
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			console.error('[MFA Send OTP] Worker token empty after cleanup', {
				environmentId,
				userId,
				deviceId,
				originalLength: originalToken.length,
			});
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		// Basic JWT format check (should have 3 parts separated by dots)
		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3) {
			console.error('[MFA Lookup User] Token does not appear to be a valid JWT format', {
				partsCount: tokenParts.length,
				tokenLength: cleanToken.length,
				tokenStart: cleanToken.substring(0, 30),
			});
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
				debug: {
					tokenParts: tokenParts.length,
					tokenLength: cleanToken.length,
				},
			});
		}

		// Validate token parts are not empty
		if (tokenParts.some((part) => part.length === 0)) {
			console.error('[MFA Lookup User] Token has empty parts', {
				tokenLength: cleanToken.length,
				partsLength: tokenParts.map((p) => p.length),
			});
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token is malformed. Please generate a new token.',
			});
		}

		// Escape username for SCIM filter (handle special characters)
		const escapedUsername = username.replace(/"/g, '\\"');
		const usersEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users?filter=username eq "${escapedUsername}"`;

		console.log('[MFA Lookup User] Token validation:', {
			tokenLength: cleanToken.length,
			tokenStart: cleanToken.substring(0, 30),
			partsCount: tokenParts.length,
		});

		console.log('[MFA Lookup User] Calling PingOne:', usersEndpoint);

		const response = await global.fetch(usersEndpoint, {
			method: 'GET',
			headers: { Authorization: `Bearer ${cleanToken}` },
		});

		// Clone response BEFORE reading to allow multiple reads if needed
		const responseClone = response.clone();

		if (!response.ok) {
			let errorData;
			try {
				errorData = await response.json();
				console.error('[MFA Lookup User] PingOne error:', {
					status: response.status,
					error: errorData,
				});
				return res.status(response.status).json(errorData);
			} catch (parseError) {
				// If JSON parsing fails, try to get text from cloned response
				try {
					const errorText = await responseClone.text();
					console.error('[MFA Lookup User] PingOne error (non-JSON):', {
						status: response.status,
						statusText: response.statusText,
						body: errorText.substring(0, 200),
					});
					return res.status(response.status).json({
						error: 'User lookup failed',
						message: response.statusText || 'Unknown error',
						status: response.status,
						details: errorText.substring(0, 200),
					});
				} catch (textError) {
					console.error('[MFA Lookup User] Failed to read error response:', textError);
					return res.status(response.status).json({
						error: 'User lookup failed',
						message: response.statusText || 'Unknown error',
						status: response.status,
					});
				}
			}
		}

		// Response is OK, try to parse as JSON
		let data;
		try {
			data = await response.json();
		} catch (parseError) {
			// If JSON parsing fails, try to get text from cloned response for debugging
			let responseText = '';
			try {
				responseText = await responseClone.text();
				console.error('[MFA Lookup User] Failed to parse response as JSON:', {
					error: parseError.message,
					status: response.status,
					statusText: response.statusText,
					contentType: response.headers.get('content-type'),
					bodyPreview: responseText.substring(0, 500),
				});
			} catch (textError) {
				console.error('[MFA Lookup User] Failed to read response body:', textError);
			}

			return res.status(500).json({
				error: 'Failed to parse response',
				message: 'The server returned an invalid response format',
				details: responseText
					? `Response body: ${responseText.substring(0, 200)}`
					: 'Unable to read response body',
			});
		}

		console.log('[MFA Lookup User] PingOne response:', {
			userCount: data._embedded?.users?.length || 0,
		});

		if (!data._embedded?.users || data._embedded.users.length === 0) {
			return res.status(404).json({ error: 'User not found', username });
		}

		const user = data._embedded.users[0];
		console.log('[MFA Lookup User] User found:', { id: user.id, username: user.username });

		res.json({ id: user.id, username: user.username, email: user.email, name: user.name });
	} catch (error) {
		console.error('[MFA Lookup User] Error:', error);
		res.status(500).json({ error: 'Failed to lookup user', message: error.message });
	}
});

// Register MFA Device
app.post('/api/pingone/mfa/register-device', async (req, res) => {
	try {
		const { environmentId, userId, type, phone, email, nickname, name, status, workerToken } =
			req.body;
		if (!environmentId || !userId || !type || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}
		const cleanToken = String(workerToken).trim();
		const devicePayload = { type };

		// Add type-specific fields
		// Phone required for SMS, VOICE, and WHATSAPP devices
		if ((type === 'SMS' || type === 'VOICE' || type === 'WHATSAPP') && phone) {
			devicePayload.phone = phone;
		} else if (type === 'EMAIL' && email) {
			devicePayload.email = email;
		}
		// TOTP, FIDO2, OATH_TOKEN, MOBILE, PLATFORM, SECURITY_KEY devices don't need phone or email

		// PingOne API uses 'nickname' field for device name
		if (nickname || name) devicePayload.nickname = nickname || name;

		// Add status if provided (ACTIVE or ACTIVATION_REQUIRED)
		// ACTIVE: Device is pre-paired (Worker App can set this, user doesn't need to activate)
		// ACTIVATION_REQUIRED: User must activate device before first use
		if (status) {
			devicePayload.status = status;
		}

		// Add notification property if provided (only applicable when status is ACTIVATION_REQUIRED for SMS, Voice, Email)
		// See: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#enable-users-mfa
		const { notification } = req.body;
		if (notification && status === 'ACTIVATION_REQUIRED') {
			devicePayload.notification = notification;
		}

		console.log('[MFA Register Device] Device payload:', {
			type: devicePayload.type,
			status: devicePayload.status,
			hasPhone: !!devicePayload.phone,
			hasEmail: !!devicePayload.email,
			nickname: devicePayload.nickname,
		});
		const deviceEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices`;
		const response = await global.fetch(deviceEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				Authorization: `Bearer ${cleanToken}`,
			},
			body: JSON.stringify(devicePayload),
		});
		if (!response.ok) {
			const errorData = await response.json();
			return res.status(response.status).json(errorData);
		}
		const deviceData = await response.json();
		res.json(deviceData);
	} catch (error) {
		console.error('[MFA Register Device] Error:', error);
		res.status(500).json({ error: 'Failed to register device', message: error.message });
	}
});

// Get All Devices for a User
app.post('/api/pingone/mfa/get-all-devices', async (req, res) => {
	try {
		const { environmentId, userId, workerToken } = req.body;
		if (!environmentId || !userId || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		// Validate worker token format
		if (typeof workerToken !== 'string') {
			return res.status(400).json({ error: 'Worker token must be a string' });
		}

		// Normalize and validate worker token
		let cleanToken = String(workerToken).trim();

		// Remove any existing "Bearer " prefix if accidentally included
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');

		// Remove all whitespace, newlines, carriage returns, and tabs
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		// Basic JWT format check (should have 3 parts separated by dots)
		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3) {
			console.error('[MFA Get All Devices] Token does not appear to be a valid JWT format', {
				partsCount: tokenParts.length,
				tokenLength: cleanToken.length,
				tokenStart: cleanToken.substring(0, 30),
			});
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		// Add cache-busting query parameter to ensure fresh data
		const devicesEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices?_t=${Date.now()}`;

		console.log('[MFA Get All Devices] Calling PingOne:', devicesEndpoint);

		const response = await global.fetch(devicesEndpoint, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${cleanToken}`,
				Accept: 'application/json',
				'Cache-Control': 'no-cache, no-store, must-revalidate',
				Pragma: 'no-cache',
			},
		});

		if (!response.ok) {
			let errorData;
			let errorText = '';
			try {
				errorText = await response.text();
				if (errorText) {
					errorData = JSON.parse(errorText);
				}
			} catch (parseError) {
				// If parsing fails, errorData will be undefined, but we have errorText
				console.error('[MFA Get All Devices] Failed to parse error response:', {
					parseError: parseError.message,
					status: response.status,
					statusText: response.statusText,
					bodyPreview: errorText.substring(0, 200),
				});
			}

			console.error('[MFA Get All Devices] PingOne error:', {
				status: response.status,
				error: errorData || errorText.substring(0, 200),
			});

			return res.status(response.status).json(
				errorData || {
					error: 'Failed to get devices',
					message: response.statusText || 'Unknown error',
					status: response.status,
					details: errorText ? errorText.substring(0, 200) : undefined,
				}
			);
		}

		let data;
		try {
			data = await response.json();
		} catch (parseError) {
			let responseText = '';
			try {
				responseText = await response.text();
				console.error('[MFA Get All Devices] Failed to parse response as JSON:', {
					error: parseError.message,
					status: response.status,
					statusText: response.statusText,
					contentType: response.headers.get('content-type'),
					bodyPreview: responseText.substring(0, 500),
				});
			} catch (textError) {
				console.error('[MFA Get All Devices] Failed to read response body:', textError);
			}

			return res.status(500).json({
				error: 'Failed to parse response',
				message: 'The server returned an invalid response format',
				details: responseText
					? `Response body: ${responseText.substring(0, 200)}`
					: 'Unable to read response body',
			});
		}

		const devices = data._embedded?.devices || [];

		console.log('[MFA Get All Devices] PingOne response:', {
			deviceCount: devices.length,
		});

		// Set cache-control headers to prevent browser caching
		res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
		res.setHeader('Pragma', 'no-cache');
		res.setHeader('Expires', '0');

		res.json({ _embedded: { devices } });
	} catch (error) {
		console.error('[MFA Get All Devices] Error:', error);
		res.status(500).json({ error: 'Failed to get devices', message: error.message });
	}
});

// Update Device
app.post('/api/pingone/mfa/update-device', async (req, res) => {
	try {
		const { environmentId, userId, deviceId, updates, workerToken } = req.body;
		if (!environmentId || !userId || !deviceId || !updates || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		// Validate worker token format
		if (typeof workerToken !== 'string') {
			return res.status(400).json({ error: 'Worker token must be a string' });
		}

		// Normalize and validate worker token
		let cleanToken = String(workerToken).trim();

		// Remove any existing "Bearer " prefix if accidentally included
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');

		// Remove all whitespace, newlines, carriage returns, and tabs
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		// Basic JWT format check (should have 3 parts separated by dots)
		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3) {
			console.error('[MFA Update Device] Token does not appear to be a valid JWT format', {
				partsCount: tokenParts.length,
				tokenLength: cleanToken.length,
				tokenStart: cleanToken.substring(0, 30),
			});
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		// Validate token parts are not empty
		if (tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token is malformed. Please generate a new token.',
			});
		}

		console.log('[MFA Update Device] Updating device:', {
			environmentId,
			userId,
			deviceId,
			updates,
		});

		// Call PingOne MFA API to update device
		const response = await global.fetch(
			`https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}`,
			{
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${cleanToken}`,
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify(updates),
			}
		);

		if (!response.ok) {
			let errorData;
			let errorText = '';
			try {
				errorText = await response.text();
				if (errorText) {
					errorData = JSON.parse(errorText);
				}
			} catch (parseError) {
				// If parsing fails, errorData will be undefined, but we have errorText
				console.error('[MFA Update Device] Failed to parse error response:', {
					parseError: parseError.message,
					status: response.status,
					statusText: response.statusText,
					bodyPreview: errorText.substring(0, 200),
				});
			}

			console.error('[MFA Update Device] PingOne error:', {
				status: response.status,
				error: errorData || errorText.substring(0, 200),
			});

			return res.status(response.status).json({
				error: errorData?.error || 'update_device_failed',
				error_description:
					errorData?.error_description ||
					errorData?.message ||
					response.statusText ||
					'Failed to update device',
				details: errorData || (errorText ? { body: errorText.substring(0, 200) } : {}),
			});
		}

		// Handle successful response
		let responseData;
		try {
			const responseText = await response.text();
			if (responseText && responseText.trim()) {
				responseData = JSON.parse(responseText);
			} else {
				// Some endpoints return 204 No Content on success
				responseData = { success: true };
			}
		} catch (parseError) {
			console.error('[MFA Update Device] Failed to parse response:', {
				error: parseError.message,
				status: response.status,
				statusText: response.statusText,
			});
			// If parsing fails but status is 2xx, treat as success
			if (response.status >= 200 && response.status < 300) {
				responseData = { success: true };
			} else {
				return res.status(500).json({
					error: 'Failed to parse response',
					message: 'The server returned an invalid response format',
				});
			}
		}

		console.log('[MFA Update Device] Successfully updated device:', {
			deviceId,
			environmentId,
		});

		res.json({
			success: true,
			device: responseData,
			environmentId,
			userId,
			deviceId,
			updatedAt: new Date().toISOString(),
			...responseData,
		});
	} catch (error) {
		console.error('[MFA Update Device] Error:', error);
		res.status(500).json({
			error: 'Failed to update device',
			message: error.message,
		});
	}
});

// Send OTP
// Send OTP to Device (Auth Server endpoint)
// POST https://auth.pingone.com/{ENV_ID}/deviceAuthentications/{DEVICE_AUTHENTICATION_ID}/otp
// API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-send-otp-to-device
app.post('/api/pingone/mfa/send-otp-to-device', async (req, res) => {
	try {
		const { environmentId, userId, deviceAuthId, deviceId, workerToken } = req.body;
		if (!environmentId || !deviceAuthId || !deviceId || !workerToken) {
			return res.status(400).json({
				error: 'Missing required fields',
				missing: {
					environmentId: !environmentId,
					deviceAuthId: !deviceAuthId,
					deviceId: !deviceId,
					workerToken: !workerToken,
				},
			});
		}

		// Validate worker token format
		if (typeof workerToken !== 'string') {
			return res.status(400).json({ error: 'Worker token must be a string' });
		}

		// Normalize and validate worker token
		let cleanToken = String(workerToken);
		// Remove any existing "Bearer " prefix if accidentally included
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		// Remove all whitespace, newlines, carriage returns, and tabs
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		// Basic JWT format check (should have 3 parts separated by dots)
		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3) {
			console.error('[MFA Send OTP to Device] Token does not appear to be a valid JWT format', {
				partsCount: tokenParts.length,
				tokenLength: cleanToken.length,
				tokenStart: cleanToken.substring(0, 30),
			});
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
				debug: {
					tokenParts: tokenParts.length,
					tokenLength: cleanToken.length,
				},
			});
		}

		// Validate token parts are not empty
		if (tokenParts.some((part) => part.length === 0)) {
			console.error('[MFA Send OTP to Device] Token has empty parts', {
				tokenLength: cleanToken.length,
				partsLength: tokenParts.map((p) => p.length),
			});
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token is malformed. Please generate a new token.',
			});
		}

		console.log('[MFA Send OTP to Device] Debug:', {
			envId: environmentId,
			deviceAuthId,
			deviceId,
			tokenLength: cleanToken.length,
			tokenStart: cleanToken.substring(0, 30),
			tokenParts: tokenParts.length,
			partsLength: tokenParts.map((p) => p.length),
		});

		// Use Auth Server endpoint per PingOne MFA API documentation
		// POST https://auth.pingone.com/{ENV_ID}/deviceAuthentications/{DEVICE_AUTHENTICATION_ID}/otp
		const region = req.body.region || 'na';
		const tld = region === 'eu' ? 'eu' : region === 'asia' ? 'asia' : 'com';
		const authPath = `https://auth.pingone.${tld}`;

		const otpEndpoint = `${authPath}/${environmentId}/deviceAuthentications/${deviceAuthId}/otp`;

		console.log('[MFA Send OTP to Device] Sending OTP to device', {
			url: otpEndpoint,
			deviceAuthId,
			deviceId,
		});

		const response = await global.fetch(otpEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${cleanToken}`,
			},
			body: JSON.stringify({
				device: { id: deviceId }
			}),
		});

		if (!response.ok) {
			let errorData;
			try {
				errorData = await response.json();
			} catch {
				errorData = { error: 'Unknown error', message: response.statusText };
			}
			return res.status(response.status).json({
				...errorData,
				debug: {
					tokenLength: cleanToken.length,
					tokenStart: cleanToken.substring(0, 10),
					endpoint: otpEndpoint,
				},
			});
		}

		// PingOne returns 204 No Content for successful OTP sends
		if (response.status === 204) {
			return res.status(200).json({ success: true, message: 'OTP sent successfully' });
		}

		// For 200 responses, try to parse JSON, but handle empty responses gracefully
		try {
			const text = await response.text();
			if (text && text.trim()) {
				const otpData = JSON.parse(text);
				return res.json(otpData);
			}
			// Empty response body - treat as success
			return res.status(200).json({ success: true, message: 'OTP sent successfully' });
		} catch (parseError) {
			// If parsing fails, that's okay - return success
			console.log('[MFA Send OTP to Device] Response was not JSON, treating as success');
			return res.status(200).json({ success: true, message: 'OTP sent successfully' });
		}
	} catch (error) {
		console.error('[MFA Send OTP to Device] Error:', error);
		res.status(500).json({ error: 'Failed to send OTP', message: error.message });
	}
});

app.post('/api/pingone/mfa/send-otp', async (req, res) => {
	try {
		const { environmentId, userId, deviceId, workerToken } = req.body;
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

		// Validate worker token format
		if (typeof workerToken !== 'string') {
			return res.status(400).json({ error: 'Worker token must be a string' });
		}

		// Normalize and validate worker token
		let cleanToken = String(workerToken);

		// Remove any existing "Bearer " prefix if accidentally included
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');

		// Remove all whitespace, newlines, carriage returns, and tabs
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		// Basic JWT format check (should have 3 parts separated by dots)
		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3) {
			console.error('[MFA Send OTP] Token does not appear to be a valid JWT format', {
				partsCount: tokenParts.length,
				tokenLength: cleanToken.length,
				tokenStart: cleanToken.substring(0, 30),
			});
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
				debug: {
					tokenParts: tokenParts.length,
					tokenLength: cleanToken.length,
				},
			});
		}

		// Validate token parts are not empty
		if (tokenParts.some((part) => part.length === 0)) {
			console.error('[MFA Send OTP] Token has empty parts', {
				tokenLength: cleanToken.length,
				partsLength: tokenParts.map((p) => p.length),
			});
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token is malformed. Please generate a new token.',
			});
		}

		console.log('[MFA Send OTP] Debug:', {
			envId: environmentId,
			userId,
			deviceId,
			tokenLength: cleanToken.length,
			tokenStart: cleanToken.substring(0, 30),
			tokenParts: tokenParts.length,
			partsLength: tokenParts.map((p) => p.length),
		});

		console.log('[MFA Send OTP] Authorization diagnostics', {
			environmentId,
			userId,
			deviceId,
			originalLength: originalToken.length,
			cleanLength: cleanToken.length,
			tokenPreviewStart: cleanToken.substring(0, 20),
			tokenPreviewEnd: cleanToken.substring(cleanToken.length - 20),
		});

		// PingOne MFA OTP sending uses a different approach
		// We need to create an MFA authentication transaction first, then send OTP
		// Reference: https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-send-one-time-password

		// Step 1: Get device details to determine device type
		const deviceEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}`;
		const authHeader = `Bearer ${cleanToken}`;

		console.log('[MFA Send OTP] Getting device details first');
		const deviceResponse = await global.fetch(deviceEndpoint, {
			method: 'GET',
			headers: {
				Authorization: authHeader,
			},
		});

		if (!deviceResponse.ok) {
			const deviceError = await deviceResponse.json().catch(() => ({ error: 'Unknown error' }));
			return res.status(deviceResponse.status).json({
				error: 'Failed to get device details',
				message: deviceError.message || deviceError.error,
			});
		}

		const device = await deviceResponse.json();
		console.log('[MFA Send OTP] Device type:', device.type);

		// Step 2: Send OTP using the correct endpoint based on device type
		// For SMS/EMAIL, we use the /otp endpoint with POST
		const otpEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}/otp`;

		console.log('[MFA Send OTP] Sending OTP to device');
		const response = await global.fetch(otpEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: authHeader,
			},
			body: JSON.stringify({}),
		});
		if (!response.ok) {
			let errorData;
			try {
				errorData = await response.json();
			} catch {
				errorData = { error: 'Unknown error', message: response.statusText };
			}
			return res.status(response.status).json({
				...errorData,
				debug: {
					tokenLength: cleanToken.length,
					tokenStart: cleanToken.substring(0, 10),
					endpoint: otpEndpoint,
				},
			});
		}

		// PingOne returns 204 No Content for successful OTP sends
		if (response.status === 204) {
			return res.status(200).json({ success: true, message: 'OTP sent successfully' });
		}

		// For 200 responses, try to parse JSON, but handle empty responses gracefully
		try {
			const text = await response.text();
			if (text && text.trim()) {
				const otpData = JSON.parse(text);
				return res.json(otpData);
			}
			// Empty response body - treat as success
			return res.status(200).json({ success: true, message: 'OTP sent successfully' });
		} catch (parseError) {
			// If parsing fails, that's okay - return success
			console.log('[MFA Send OTP] Response was not JSON, treating as success');
			return res.status(200).json({ success: true, message: 'OTP sent successfully' });
		}
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

		// Validate worker token format
		if (typeof workerToken !== 'string') {
			return res.status(400).json({ error: 'Worker token must be a string' });
		}

		// Normalize and validate worker token
		let cleanToken = String(workerToken);

		// Remove any existing "Bearer " prefix if accidentally included
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');

		// Remove all whitespace, newlines, carriage returns, and tabs
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		// Basic JWT format check (should have 3 parts separated by dots)
		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3) {
			console.error('[MFA Validate OTP] Token does not appear to be a valid JWT format', {
				partsCount: tokenParts.length,
				tokenLength: cleanToken.length,
				tokenStart: cleanToken.substring(0, 30),
			});
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
				debug: {
					tokenParts: tokenParts.length,
					tokenLength: cleanToken.length,
				},
			});
		}

		// Validate token parts are not empty
		if (tokenParts.some((part) => part.length === 0)) {
			console.error('[MFA Validate OTP] Token has empty parts', {
				tokenLength: cleanToken.length,
				partsLength: tokenParts.map((p) => p.length),
			});
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token is malformed. Please generate a new token.',
			});
		}

		const validateEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}/otp/check`;

		console.log('[MFA Validate OTP] Sending request to:', validateEndpoint);
		console.log('[MFA Validate OTP] Token validation:', {
			tokenLength: cleanToken.length,
			tokenStart: cleanToken.substring(0, 30),
			partsCount: tokenParts.length,
		});
		const response = await global.fetch(validateEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				Authorization: `Bearer ${cleanToken}`,
			},
			body: JSON.stringify({ otp }),
		});
		if (!response.ok) {
			const errorData = await response.json();
			if (response.status === 400 || response.status === 401) {
				return res.json({
					status: 'INVALID',
					message: errorData.message || 'Invalid OTP code',
					valid: false,
				});
			}
			return res.status(response.status).json(errorData);
		}
		const validationData = await response.json();
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
// ============================================================================
// MFA REPORTING & MANAGEMENT ENDPOINTS
// ============================================================================

// Delete Device
app.post('/api/pingone/mfa/delete-device', async (req, res) => {
	try {
		const { environmentId, userId, deviceId, workerToken } = req.body;
		if (!environmentId || !userId || !deviceId || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}
		const cleanToken = String(workerToken).trim();
		const deleteEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}`;
		const response = await global.fetch(deleteEndpoint, {
			method: 'DELETE',
			headers: {
				Accept: 'application/json',
				Authorization: `Bearer ${cleanToken}`,
			},
		});
		if (!response.ok && response.status !== 204) {
			const errorData = await response.json();
			return res.status(response.status).json(errorData);
		}
		res.status(204).send();
	} catch (error) {
		console.error('[MFA Delete Device] Error:', error);
		res.status(500).json({ error: 'Failed to delete device', message: error.message });
	}
});

// Get Device Details
app.post('/api/pingone/mfa/get-device', async (req, res) => {
	try {
		const { environmentId, userId, deviceId, workerToken } = req.body;
		if (!environmentId || !userId || !deviceId || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}
		const deviceEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}`;
		const response = await global.fetch(deviceEndpoint, {
			method: 'GET',
			headers: { Authorization: `Bearer ${workerToken}` },
		});
		if (!response.ok) {
			const errorData = await response.json();
			return res.status(response.status).json(errorData);
		}
		const deviceData = await response.json();
		res.json(deviceData);
	} catch (error) {
		console.error('[MFA Get Device] Error:', error);
		res.status(500).json({ error: 'Failed to get device', message: error.message });
	}
});

// Update Device (Nickname, Status, etc.)
app.post('/api/pingone/mfa/update-device', async (req, res) => {
	try {
		const { environmentId, userId, deviceId, updates, workerToken } = req.body;
		if (!environmentId || !userId || !deviceId || !updates || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}
		const updateEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}`;
		const response = await global.fetch(updateEndpoint, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${workerToken}` },
			body: JSON.stringify(updates),
		});
		if (!response.ok) {
			const errorData = await response.json();
			return res.status(response.status).json(errorData);
		}
		const deviceData = await response.json();
		res.json(deviceData);
	} catch (error) {
		console.error('[MFA Update Device] Error:', error);
		res.status(500).json({ error: 'Failed to update device', message: error.message });
	}
});

// Get MFA Methods
app.post('/api/pingone/mfa/get-methods', async (req, res) => {
	try {
		const { environmentId, accessToken } = req.body;
		if (!environmentId || !accessToken) {
			return res.status(400).json({ error: 'Missing environmentId or accessToken' });
		}

		console.log('[MFA Get Methods] Getting MFA methods for environment:', environmentId);

		const response = await global.fetch(
			`https://api.pingone.com/v1/environments/${environmentId}/mfa/methods`,
			{
				method: 'GET',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			return res.status(response.status).json(errorData);
		}

		const methodsData = await response.json();
		res.json(methodsData);
	} catch (error) {
		console.error('[MFA Get Methods] Error:', error);
		res.status(500).json({ error: 'Failed to get MFA methods', message: error.message });
	}
});

// Select MFA Method
app.post('/api/pingone/mfa/select-method', async (req, res) => {
	try {
		const { environmentId, method, accessToken } = req.body;
		if (!environmentId || !method || !accessToken) {
			return res.status(400).json({ error: 'Missing environmentId, method, or accessToken' });
		}

		console.log('[MFA Select Method] Selecting MFA method:', { environmentId, method });

		const response = await global.fetch(
			`https://api.pingone.com/v1/environments/${environmentId}/mfa/methods/${method}/select`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({}),
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			return res.status(response.status).json(errorData);
		}

		const selectionData = await response.json();
		res.json(selectionData);
	} catch (error) {
		console.error('[MFA Select Method] Error:', error);
		res.status(500).json({ error: 'Failed to select MFA method', message: error.message });
	}
});

// Verify MFA Code
app.post('/api/pingone/mfa/verify-code', async (req, res) => {
	try {
		const { environmentId, method, code, accessToken, userId, sessionId } = req.body;
		if (!environmentId || !method || !code || !accessToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		console.log('[MFA Verify Code] Verifying MFA code:', { environmentId, method });

		const requestBody = {
			method,
			code,
			userId: userId || 'current-user-id',
			sessionId: sessionId || 'current-session-id',
		};

		const response = await global.fetch(
			`https://api.pingone.com/v1/environments/${environmentId}/mfa/methods/${method}/verify`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			return res.status(response.status).json(errorData);
		}

		const verificationData = await response.json();
		res.json(verificationData);
	} catch (error) {
		console.error('[MFA Verify Code] Error:', error);
		res.status(500).json({ error: 'Failed to verify MFA code', message: error.message });
	}
});

// Get Environment Licensing
app.post('/api/pingone/environment/licensing', async (req, res) => {
	try {
		const { environmentId, accessToken } = req.body;
		if (!environmentId || !accessToken) {
			return res.status(400).json({ error: 'Missing environmentId or accessToken' });
		}

		console.log('[Environment Licensing] Getting licensing info for environment:', environmentId);

		const response = await global.fetch(
			`https://api.pingone.com/v1/environments/${environmentId}`,
			{
				method: 'GET',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			return res.status(response.status).json(errorData);
		}

		const environmentData = await response.json();
		res.json(environmentData);
	} catch (error) {
		console.error('[Environment Licensing] Error:', error);
		res.status(500).json({ error: 'Failed to get environment licensing', message: error.message });
	}
});

// Worker Token Test - Get Environment
app.post('/api/pingone/worker-test/environment', async (req, res) => {
	try {
		const { environmentId, token } = req.body;
		if (!environmentId || !token) {
			return res.status(400).json({ error: 'Missing environmentId or token' });
		}

		console.log('[Worker Test] Testing environment access:', environmentId);

		const response = await global.fetch(
			`https://api.pingone.com/v1/environments/${environmentId}`,
			{
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			}
		);

		const environmentData = await response.json();
		res.status(response.status).json(environmentData);
	} catch (error) {
		console.error('[Worker Test - Environment] Error:', error);
		res.status(500).json({ error: 'Failed to test environment', message: error.message });
	}
});

// Worker Token Test - Get Users
app.post('/api/pingone/worker-test/users', async (req, res) => {
	try {
		const { environmentId, token } = req.body;
		if (!environmentId || !token) {
			return res.status(400).json({ error: 'Missing environmentId or token' });
		}

		console.log('[Worker Test] Testing users access:', environmentId);

		const response = await global.fetch(
			`https://api.pingone.com/v1/environments/${environmentId}/users?limit=1`,
			{
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			}
		);

		const usersData = await response.json();
		res.status(response.status).json(usersData);
	} catch (error) {
		console.error('[Worker Test - Users] Error:', error);
		res.status(500).json({ error: 'Failed to test users', message: error.message });
	}
});

// Worker Token Test - Get Applications
app.post('/api/pingone/worker-test/applications', async (req, res) => {
	try {
		const { environmentId, token } = req.body;
		if (!environmentId || !token) {
			return res.status(400).json({ error: 'Missing environmentId or token' });
		}

		console.log('[Worker Test] Testing applications access:', environmentId);

		const response = await global.fetch(
			`https://api.pingone.com/v1/environments/${environmentId}/applications?limit=1`,
			{
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			}
		);

		const applicationsData = await response.json();
		res.status(response.status).json(applicationsData);
	} catch (error) {
		console.error('[Worker Test - Applications] Error:', error);
		res.status(500).json({ error: 'Failed to test applications', message: error.message });
	}
});

// Enhanced PingOne MFA Service - Get Device
app.post('/api/pingone/enhanced-mfa/get-device', async (req, res) => {
	try {
		const { environmentId, userId, deviceId, accessToken } = req.body;
		if (!environmentId || !userId || !deviceId || !accessToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		console.log('[Enhanced MFA Service] Getting device:', { environmentId, userId, deviceId });

		const response = await global.fetch(
			`https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}`,
			{
				method: 'GET',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			return res.status(response.status).json(errorData);
		}

		const deviceData = await response.json();
		res.json(deviceData);
	} catch (error) {
		console.error('[Enhanced MFA Service - Get Device] Error:', error);
		res.status(500).json({ error: 'Failed to get device', message: error.message });
	}
});

// Enhanced PingOne MFA Service - Send Challenge (Enhanced version)
app.post('/api/pingone/enhanced-mfa/send-challenge', async (req, res) => {
	try {
		const { environmentId, userId, deviceId, challengeType, accessToken } = req.body;
		if (!environmentId || !userId || !deviceId || !accessToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		console.log('[Enhanced MFA Service] Sending challenge:', {
			environmentId,
			userId,
			deviceId,
			challengeType,
		});

		const requestBody = challengeType ? { type: challengeType } : {};
		const response = await global.fetch(
			`https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}/challenges`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify(requestBody),
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			return res.status(response.status).json(errorData);
		}

		const challengeData = await response.json();
		res.json(challengeData);
	} catch (error) {
		console.error('[Enhanced MFA Service - Send Challenge] Error:', error);
		res.status(500).json({ error: 'Failed to send challenge', message: error.message });
	}
});

// Enhanced PingOne MFA Service - Verify Challenge
app.post('/api/pingone/enhanced-mfa/verify-challenge', async (req, res) => {
	try {
		const { environmentId, userId, challengeId, code, accessToken } = req.body;
		if (!environmentId || !userId || !challengeId || !code || !accessToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		console.log('[Enhanced MFA Service] Verifying challenge:', {
			environmentId,
			userId,
			challengeId,
		});

		const response = await global.fetch(
			`https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/authentications/${challengeId}`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify({ code }),
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			return res.status(response.status).json(errorData);
		}

		const verificationData = await response.json();
		res.json(verificationData);
	} catch (error) {
		console.error('[Enhanced MFA Service - Verify Challenge] Error:', error);
		res.status(500).json({ error: 'Failed to verify challenge', message: error.message });
	}
});

// Enhanced PingOne MFA Service - Create TOTP Device
app.post('/api/pingone/enhanced-mfa/create-totp-device', async (req, res) => {
	try {
		const { environmentId, userId, deviceName, accessToken } = req.body;
		if (!environmentId || !userId || !accessToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		console.log('[Enhanced MFA Service] Creating TOTP device:', {
			environmentId,
			userId,
			deviceName,
		});

		const requestBody = deviceName ? { name: deviceName } : {};
		const response = await global.fetch(
			`https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify({
					type: 'TOTP',
					...requestBody,
				}),
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			return res.status(response.status).json(errorData);
		}

		const deviceData = await response.json();
		res.json(deviceData);
	} catch (error) {
		console.error('[Enhanced MFA Service - Create TOTP Device] Error:', error);
		res.status(500).json({ error: 'Failed to create TOTP device', message: error.message });
	}
});

// Enhanced PingOne MFA Service - Create SMS Device
app.post('/api/pingone/enhanced-mfa/create-sms-device', async (req, res) => {
	try {
		const { environmentId, userId, phoneNumber, deviceName, accessToken } = req.body;
		if (!environmentId || !userId || !phoneNumber || !accessToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		console.log('[Enhanced MFA Service] Creating SMS device:', {
			environmentId,
			userId,
			phoneNumber,
		});

		const response = await global.fetch(
			`https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify({
					type: 'SMS',
					phoneNumber,
					name: deviceName || `SMS Device - ${phoneNumber}`,
				}),
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			return res.status(response.status).json(errorData);
		}

		const deviceData = await response.json();
		res.json(deviceData);
	} catch (error) {
		console.error('[Enhanced MFA Service - Create SMS Device] Error:', error);
		res.status(500).json({ error: 'Failed to create SMS device', message: error.message });
	}
});

// Enhanced PingOne MFA Service - Create Email Device
app.post('/api/pingone/enhanced-mfa/create-email-device', async (req, res) => {
	try {
		const { environmentId, userId, email, deviceName, accessToken } = req.body;
		if (!environmentId || !userId || !email || !accessToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		console.log('[Enhanced MFA Service] Creating email device:', { environmentId, userId, email });

		const response = await global.fetch(
			`https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify({
					type: 'EMAIL',
					email,
					name: deviceName || `Email Device - ${email}`,
				}),
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			return res.status(response.status).json(errorData);
		}

		const deviceData = await response.json();
		res.json(deviceData);
	} catch (error) {
		console.error('[Enhanced MFA Service - Create Email Device] Error:', error);
		res.status(500).json({ error: 'Failed to create email device', message: error.message });
	}
});

// Enhanced PingOne MFA Service - Create FIDO2 Device
app.post('/api/pingone/enhanced-mfa/create-fido2-device', async (req, res) => {
	try {
		const { environmentId, userId, deviceName, publicKey, accessToken } = req.body;
		if (!environmentId || !userId || !publicKey || !accessToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		console.log('[Enhanced MFA Service] Creating FIDO2 device:', {
			environmentId,
			userId,
			deviceName,
		});

		const response = await global.fetch(
			`https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify({
					type: 'FIDO2',
					name: deviceName || 'FIDO2 Security Key',
					publicKey,
				}),
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			return res.status(response.status).json(errorData);
		}

		const deviceData = await response.json();
		res.json(deviceData);
	} catch (error) {
		console.error('[Enhanced MFA Service - Create FIDO2 Device] Error:', error);
		res.status(500).json({ error: 'Failed to create FIDO2 device', message: error.message });
	}
});

// Enhanced PingOne MFA Service - Get MFA Policies
app.post('/api/pingone/enhanced-mfa/get-policies', async (req, res) => {
	try {
		const { environmentId, accessToken } = req.body;
		if (!environmentId || !accessToken) {
			return res.status(400).json({ error: 'Missing environmentId or accessToken' });
		}

		console.log('[Enhanced MFA Service] Getting MFA policies for environment:', environmentId);

		const response = await global.fetch(
			`https://api.pingone.com/v1/environments/${environmentId}/mfaPolicies`,
			{
				method: 'GET',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			return res.status(response.status).json(errorData);
		}

		const policiesData = await response.json();
		res.json(policiesData);
	} catch (error) {
		console.error('[Enhanced MFA Service - Get Policies] Error:', error);
		res.status(500).json({ error: 'Failed to get MFA policies', message: error.message });
	}
});

// Get Device Authentication Policy
app.post('/api/pingone/mfa/get-device-auth-policy', async (req, res) => {
	try {
		const { environmentId, userId, deviceId, workerToken } = req.body;
		if (!environmentId || !userId || !deviceId || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}
		const policyEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}/authenticationPolicy`;
		const response = await global.fetch(policyEndpoint, {
			method: 'GET',
			headers: { Authorization: `Bearer ${workerToken}` },
		});
		if (!response.ok) {
			const errorData = await response.json();
			return res.status(response.status).json(errorData);
		}
		const policyData = await response.json();
		res.json(policyData);
	} catch (error) {
		console.error('[MFA Get Device Auth Policy] Error:', error);
		res.status(500).json({ error: 'Failed to get device auth policy', message: error.message });
	}
});

// Get FIDO2 Policies
app.post('/api/pingone/mfa/get-fido2-policies', async (req, res) => {
	try {
		const { environmentId, workerToken } = req.body;
		if (!environmentId || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}
		const policyEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/fido2Policies`;
		const response = await global.fetch(policyEndpoint, {
			method: 'GET',
			headers: { Authorization: `Bearer ${workerToken}` },
		});
		if (!response.ok) {
			const errorData = await response.json();
			return res.status(response.status).json(errorData);
		}
		const policyData = await response.json();
		res.json(policyData);
	} catch (error) {
		console.error('[MFA Get FIDO2 Policies] Error:', error);
		res.status(500).json({ error: 'Failed to get FIDO2 policies', message: error.message });
	}
});

// Get MFA Settings
app.post('/api/pingone/mfa/get-mfa-settings', async (req, res) => {
	try {
		const { environmentId, workerToken } = req.body;
		if (!environmentId || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}
		const settingsEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/mfaSettings`;
		const response = await global.fetch(settingsEndpoint, {
			method: 'GET',
			headers: { Authorization: `Bearer ${workerToken}` },
		});
		if (!response.ok) {
			const errorData = await response.json();
			return res.status(response.status).json(errorData);
		}
		const settingsData = await response.json();
		res.json(settingsData);
	} catch (error) {
		console.error('[MFA Get Settings] Error:', error);
		res.status(500).json({ error: 'Failed to get MFA settings', message: error.message });
	}
});

// List Device Authentication Policies
app.post('/api/pingone/mfa/device-authentication-policies', async (req, res) => {
	try {
		const { environmentId, workerToken } = req.body;
		if (!environmentId || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the \"Manage Token\" button.',
			});
		}

		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
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

		console.log('[MFA Device Auth Policies] Request:', {
			url: policiesEndpoint,
			environmentId,
		});

		const response = await global.fetch(policiesEndpoint, {
			method: 'GET',
			headers: { Authorization: `Bearer ${cleanToken}` },
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			console.error('[MFA Device Auth Policies] Error:', errorData);
			return res.status(response.status).json(errorData);
		}

		const policiesData = await response.json();
		res.json(policiesData);
	} catch (error) {
		console.error('[MFA Device Auth Policies] Error:', error);
		res.status(500).json({
			error: 'Failed to list device authentication policies',
			message: error.message,
		});
	}
});
// Resend Pairing Code (POST /environments/{environmentId}/users/{userId}/devices/{deviceId}/otp)
app.post('/api/pingone/mfa/resend-pairing-code', async (req, res) => {
	try {
		const { environmentId, userId, deviceId, workerToken } = req.body;
		if (!environmentId || !userId || !deviceId || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		// Validate worker token format
		if (typeof workerToken !== 'string') {
			return res.status(400).json({ error: 'Worker token must be a string' });
		}

		// Normalize and validate worker token
		let cleanToken = String(workerToken);

		// Remove any existing "Bearer " prefix if accidentally included
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');

		// Remove all whitespace, newlines, carriage returns, and tabs
		// BUT preserve the token structure - only remove whitespace between characters
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		// DO NOT remove '=' characters - they are valid in JWT tokens
		// JWT tokens can have '=' padding in base64url encoding

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		// Basic JWT format check (should have 3 parts separated by dots)
		// JWT tokens contain: base64url characters (A-Z, a-z, 0-9, -, _)
		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3) {
			console.error('[MFA Resend Pairing Code] Token does not appear to be a valid JWT format', {
				partsCount: tokenParts.length,
				tokenLength: cleanToken.length,
				tokenStart: cleanToken.substring(0, 30),
				tokenEnd: cleanToken.substring(cleanToken.length - 10),
				fullToken: cleanToken,
				originalToken: workerToken,
			});
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
				debug: {
					tokenParts: tokenParts.length,
					tokenLength: cleanToken.length,
					expectedFormat: 'JWT (3 parts separated by dots)',
				},
			});
		}

		// Validate token parts are not empty
		if (tokenParts.some((part) => part.length === 0)) {
			console.error('[MFA Resend Pairing Code] Token has empty parts', {
				tokenLength: cleanToken.length,
				partsLength: tokenParts.map((p) => p.length),
			});
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token is malformed. Please generate a new token.',
			});
		}

		const otpEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}/otp`;

		console.log('[MFA Resend Pairing Code] Sending request to:', otpEndpoint);
		console.log('[MFA Resend Pairing Code] Token validation:', {
			tokenLength: cleanToken.length,
			tokenStart: cleanToken.substring(0, 30),
			tokenEnd: cleanToken.substring(cleanToken.length - 10),
			partsCount: tokenParts.length,
			hasEquals: cleanToken.includes('='),
		});

		// Ensure Authorization header is properly formatted
		const authHeader = `Bearer ${cleanToken}`;

		console.log('[MFA Resend Pairing Code] Authorization header format:', {
			headerLength: authHeader.length,
			headerStart: authHeader.substring(0, 40),
			hasBearer: authHeader.startsWith('Bearer '),
			tokenPartLength: cleanToken.length,
			tokenParts: cleanToken.split('.').length,
			tokenStart: cleanToken.substring(0, 30),
			tokenEnd: cleanToken.substring(cleanToken.length - 10),
			hasEquals: cleanToken.includes('='),
			originalTokenLength: workerToken.length,
			originalTokenStart: workerToken.substring(0, 30),
			originalTokenEnd: workerToken.substring(workerToken.length - 10),
		});

		const response = await global.fetch(otpEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				Authorization: authHeader,
			},
			body: JSON.stringify({}),
		});

		if (!response.ok && response.status !== 204) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			console.error('[MFA Resend Pairing Code] Error:', errorData);
			return res.status(response.status).json(errorData);
		}

		console.log('[MFA Resend Pairing Code] Success');
		res.status(200).json({ success: true, message: 'Pairing code resent successfully' });
	} catch (error) {
		console.error('[MFA Resend Pairing Code] Error:', error);
		res.status(500).json({ error: 'Failed to resend pairing code', message: error.message });
	}
});

// Activate MFA User Device (POST /environments/{environmentId}/users/{userId}/devices/{deviceId})
app.post('/api/pingone/mfa/activate-device', async (req, res) => {
	try {
		const { environmentId, userId, deviceId, otp, workerToken } = req.body;
		if (!environmentId || !userId || !deviceId || !otp || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}
		// Normalize and validate worker token
		let cleanToken = String(workerToken);
		// Remove any existing "Bearer " prefix if accidentally included
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		// Remove all whitespace, newlines, carriage returns, and tabs (but preserve = for base64 padding)
		cleanToken = cleanToken.replace(/[\s\n\r\t]/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		// Basic JWT format check (should have 3 parts separated by dots)
		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3) {
			console.error('[MFA Activate Device] Token does not appear to be a valid JWT format', {
				partsCount: tokenParts.length,
				tokenLength: cleanToken.length,
			});
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		// Validate token parts are not empty
		if (tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token is malformed. Please generate a new token.',
			});
		}

		// Use the correct activate operation endpoint per Phase 1 spec
		// POST /v1/environments/{environmentId}/users/{userId}/devices/{deviceId}/operations/activate
		const { otp } = req.body; // OTP is required for activation
		if (!otp) {
			return res.status(400).json({ error: 'Missing OTP for device activation' });
		}

		const deviceEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}/operations/activate`;

		console.log('[MFA Activate Device] Activating device with OTP:', deviceId);

		const response = await global.fetch(deviceEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${cleanToken}`,
			},
			body: JSON.stringify({ otp }), // Send OTP in request body
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			console.error('[MFA Activate Device] Error:', errorData);
			return res.status(response.status).json(errorData);
		}

		const deviceData = await response.json();
		console.log('[MFA Activate Device] Success:', {
			deviceId: deviceData.id,
			status: deviceData.status,
		});
		res.json(deviceData);
	} catch (error) {
		console.error('[MFA Activate Device] Error:', error);
		res.status(500).json({ error: 'Failed to activate device', message: error.message });
	}
});

// Activate FIDO2 MFA User Device
// POST /mfa/v1/environments/{environmentId}/users/{userId}/devices/{deviceId}/fido2/activate
app.post('/api/pingone/mfa/activate-fido2-device', async (req, res) => {
	try {
		const { environmentId, userId, deviceId, fido2Data, workerToken } = req.body;
		if (!environmentId || !userId || !deviceId || !workerToken) {
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
		const deviceEndpoint = `${apiBase}/mfa/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}/fido2/activate`;

		console.log('[MFA Activate FIDO2 Device] Activating FIDO2 device:', deviceId);

		const requestBody = fido2Data || {};
		const response = await global.fetch(deviceEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${cleanToken}`,
			},
			body: JSON.stringify(requestBody),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			console.error('[MFA Activate FIDO2 Device] Error:', errorData);
			return res.status(response.status).json(errorData);
		}

		const deviceData = await response.json();
		console.log('[MFA Activate FIDO2 Device] Success:', {
			deviceId: deviceData.id,
			status: deviceData.status,
		});
		res.json(deviceData);
	} catch (error) {
		console.error('[MFA Activate FIDO2 Device] Error:', error);
		res.status(500).json({ error: 'Failed to activate FIDO2 device', message: error.message });
	}
});

// Start MFA Device Authentication
// POST /mfa/v1/environments/{environmentId}/users/{userId}/devices/{deviceId}/authentications
app.post('/api/pingone/mfa/start-authentication', async (req, res) => {
	try {
		const { environmentId, userId, deviceId, workerToken } = req.body;
		if (!environmentId || !userId || !deviceId || !workerToken) {
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
		const authEndpoint = `${apiBase}/mfa/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}/authentications`;

		console.log('[MFA Start Authentication] Starting authentication for device:', deviceId);

		const response = await global.fetch(authEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${cleanToken}`,
			},
			body: JSON.stringify({}),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			console.error('[MFA Start Authentication] Error:', errorData);
			return res.status(response.status).json(errorData);
		}

		const authData = await response.json();
		console.log('[MFA Start Authentication] Success:', {
			authenticationId: authData.id,
			status: authData.status,
		});
		res.json(authData);
	} catch (error) {
		console.error('[MFA Start Authentication] Error:', error);
		res.status(500).json({ error: 'Failed to start authentication', message: error.message });
	}
});

// Complete MFA Device Authentication
// POST /mfa/v1/environments/{environmentId}/users/{userId}/devices/{deviceId}/authentications/{authenticationId}
app.post('/api/pingone/mfa/complete-authentication', async (req, res) => {
	try {
		const { environmentId, userId, deviceId, authenticationId, otp, fido2Assertion, workerToken } =
			req.body;
		if (!environmentId || !userId || !deviceId || !authenticationId || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}
		if (!otp && !fido2Assertion) {
			return res.status(400).json({ error: 'Either otp or fido2Assertion must be provided' });
		}
		const cleanToken = String(workerToken).trim();
		const region = req.body.region || 'na';
		const apiBase =
			region === 'eu'
				? 'https://api.pingone.eu'
				: region === 'asia'
					? 'https://api.pingone.asia'
					: 'https://api.pingone.com';
		const authEndpoint = `${apiBase}/mfa/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}/authentications/${authenticationId}`;

		console.log('[MFA Complete Authentication] Completing authentication:', {
			deviceId,
			authenticationId,
			hasOTP: !!otp,
			hasFIDO2: !!fido2Assertion,
		});

		const requestBody = {};
		if (otp) {
			requestBody.otp = otp;
		}
		if (fido2Assertion) {
			requestBody.fido2Assertion = fido2Assertion;
		}

		const response = await global.fetch(authEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${cleanToken}`,
			},
			body: JSON.stringify(requestBody),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			console.error('[MFA Complete Authentication] Error:', errorData);
			return res.status(response.status).json(errorData);
		}

		const resultData = await response.json();
		console.log('[MFA Complete Authentication] Success:', {
			authenticationId: resultData.id,
			status: resultData.status,
		});
		res.json(resultData);
	} catch (error) {
		console.error('[MFA Complete Authentication] Error:', error);
		res.status(500).json({ error: 'Failed to complete authentication', message: error.message });
	}
});

// Get User Authentication Reports
// GET /environments/{environmentId}/userMfaDeviceAuthentications
app.post('/api/pingone/mfa/user-authentication-reports', async (req, res) => {
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
		const reportsEndpoint = `${apiBase}/v1/environments/${environmentId}/userMfaDeviceAuthentications${queryParams ? `?${queryParams}` : ''}`;

		console.log('[MFA User Authentication Reports] Fetching reports:', {
			environmentId,
			hasQueryParams: !!queryParams,
		});

		const response = await global.fetch(reportsEndpoint, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${cleanToken}`,
			},
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			console.error('[MFA User Authentication Reports] Error:', errorData);
			return res.status(response.status).json(errorData);
		}

		const reportsData = await response.json();
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

// Update MFA Settings
app.post('/api/pingone/mfa/update-mfa-settings', async (req, res) => {
	try {
		const { environmentId, settings, workerToken } = req.body;
		if (!environmentId || !settings || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}
		const settingsEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/mfaSettings`;
		const response = await global.fetch(settingsEndpoint, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${workerToken}` },
			body: JSON.stringify(settings),
		});
		if (!response.ok) {
			const errorData = await response.json();
			return res.status(response.status).json(errorData);
		}
		const settingsData = await response.json();
		res.json(settingsData);
	} catch (error) {
		console.error('[MFA Update Settings] Error:', error);
		res.status(500).json({ error: 'Failed to update MFA settings', message: error.message });
	}
});

// Get User MFA Enabled Status
app.post('/api/pingone/mfa/get-user-mfa-enabled', async (req, res) => {
	try {
		const { environmentId, userId, workerToken } = req.body;
		if (!environmentId || !userId || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}
		const mfaEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/mfaEnabled`;
		const response = await global.fetch(mfaEndpoint, {
			method: 'GET',
			headers: { Authorization: `Bearer ${workerToken}` },
		});
		if (!response.ok) {
			const errorData = await response.json();
			return res.status(response.status).json(errorData);
		}
		const mfaData = await response.json();
		res.json(mfaData);
	} catch (error) {
		console.error('[MFA Get User MFA Enabled] Error:', error);
		res
			.status(500)
			.json({ error: 'Failed to get user MFA enabled status', message: error.message });
	}
});

// Update User MFA Enabled Status
app.post('/api/pingone/mfa/update-user-mfa-enabled', async (req, res) => {
	try {
		const { environmentId, userId, mfaEnabled, workerToken } = req.body;
		if (!environmentId || !userId || typeof mfaEnabled !== 'boolean' || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}
		const mfaEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/mfaEnabled`;
		const response = await global.fetch(mfaEndpoint, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${workerToken}` },
			body: JSON.stringify({ mfaEnabled }),
		});
		if (!response.ok) {
			const errorData = await response.json();
			return res.status(response.status).json(errorData);
		}
		const mfaData = await response.json();
		res.json(mfaData);
	} catch (error) {
		console.error('[MFA Update User MFA Enabled] Error:', error);
		res
			.status(500)
			.json({ error: 'Failed to update user MFA enabled status', message: error.message });
	}
});

// Enable Users MFA (Bulk Operation)
app.post('/api/pingone/mfa/enable-users-mfa', async (req, res) => {
	try {
		const { environmentId, userIds, workerToken } = req.body;
		if (!environmentId || !Array.isArray(userIds) || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}
		const results = [];
		for (const userId of userIds) {
			try {
				const mfaEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/mfaEnabled`;
				const response = await global.fetch(mfaEndpoint, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${workerToken}` },
					body: JSON.stringify({ mfaEnabled: true }),
				});
				const data = await response.json();
				results.push({ userId, success: response.ok, data });
			} catch (error) {
				results.push({ userId, success: false, error: error.message });
			}
		}
		res.json({ results });
	} catch (error) {
		console.error('[MFA Enable Users] Error:', error);
		res.status(500).json({ error: 'Failed to enable users MFA', message: error.message });
	}
});

// Set MFA Bypass for User
app.post('/api/pingone/mfa/set-user-bypass', async (req, res) => {
	try {
		const { environmentId, userId, bypassEnabled, expiresAt, workerToken } = req.body;
		if (!environmentId || !userId || typeof bypassEnabled !== 'boolean' || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}
		const bypassEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}`;
		const payload = { mfa: { bypass: { enabled: bypassEnabled } } };
		if (bypassEnabled && expiresAt) {
			payload.mfa.bypass.expiresAt = expiresAt;
		}
		const response = await global.fetch(bypassEndpoint, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${workerToken}` },
			body: JSON.stringify(payload),
		});
		if (!response.ok) {
			const errorData = await response.json();
			return res.status(response.status).json(errorData);
		}
		const userData = await response.json();
		res.json(userData);
	} catch (error) {
		console.error('[MFA Set User Bypass] Error:', error);
		res.status(500).json({ error: 'Failed to set user MFA bypass', message: error.message });
	}
});

// Initialize Device Authentication (Auth Server Endpoint)
// POST {{authPath}}/{{envID}}/deviceAuthentications
// This is called BEFORE device creation per PingOne MFA Native SDK flow
app.post('/api/pingone/mfa/initialize-device-authentication-auth', async (req, res) => {
	try {
		const { environmentId, userId, workerToken } = req.body;
		if (!environmentId || !userId || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		// Normalize and validate worker token
		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/[\s\n\r\t]/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		// Basic JWT format check
		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		// Determine region/TLD from environmentId or use default
		const region = req.body.region || 'na';
		const tld = region === 'eu' ? 'eu' : region === 'asia' ? 'asia' : 'com';
		const authPath = `https://auth.pingone.${tld}`;

		// Auth server endpoint: {{authPath}}/{{envID}}/deviceAuthentications
		const authEndpoint = `${authPath}/${environmentId}/deviceAuthentications`;

		// Request body per master-sms.md guidance:
		// - user.id: Required
		// - policy.id: Device Authentication Policy ID (optional but recommended)
		// - device.id: Optional - if provided, immediately triggers authentication for that device
		const requestBody = {
			user: {
				id: userId,
			},
		};

		// Include policy.id if provided (Device Authentication Policy)
		if (req.body.policyId) {
			requestBody.policy = {
				id: req.body.policyId,
			};
		}

		// If deviceId is provided, include it in the request to immediately trigger authentication
		if (req.body.deviceId) {
			requestBody.device = {
				id: req.body.deviceId,
			};
		}

		console.log('[MFA Initialize Device Auth (Auth Server)] Request:', {
			url: authEndpoint,
			userId,
			deviceId: req.body.deviceId || 'not provided',
		});

		const response = await global.fetch(authEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${cleanToken}`,
			},
			body: JSON.stringify(requestBody),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			console.error('[MFA Initialize Device Auth (Auth Server)] Error:', errorData);
			return res.status(response.status).json(errorData);
		}

		const authData = await response.json();
		console.log('[MFA Initialize Device Auth (Auth Server)] Success:', {
			id: authData.id,
			status: authData.status,
			nextStep: authData.nextStep,
		});
		res.json(authData);
	} catch (error) {
		console.error('[MFA Initialize Device Auth (Auth Server)] Error:', error);
		res
			.status(500)
			.json({ error: 'Failed to initialize device authentication', message: error.message });
	}
});

// Initialize Device Authentication (API Server Endpoint - for existing devices)
// POST /mfa/v1/environments/{environmentId}/users/{userId}/deviceAuthentications
app.post('/api/pingone/mfa/initialize-device-authentication', async (req, res) => {
	try {
		const {
			environmentId,
			userId,
			deviceId,
			workerToken,
			policyId,
			deviceAuthenticationPolicyId,
			region,
		} = req.body;
		if (!environmentId || !userId || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
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
		if (tokenParts.length !== 3) {
			console.error('[MFA Initialize Device Auth] Token does not appear to be a valid JWT format', {
				partsCount: tokenParts.length,
				tokenLength: cleanToken.length,
			});
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		if (tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token is malformed. Please generate a new token.',
			});
		}

		const normalizedRegion = region || 'na';
		const apiBase =
			normalizedRegion === 'eu'
				? 'https://api.pingone.eu'
				: normalizedRegion === 'asia'
					? 'https://api.pingone.asia'
					: 'https://api.pingone.com';

		const requestBody = {};
		if (deviceId) {
			requestBody.device = { id: deviceId };
		}

		const resolvedPolicyId = policyId || deviceAuthenticationPolicyId;
		if (resolvedPolicyId) {
			requestBody.policy = { id: resolvedPolicyId };
		}

		const mfaEndpoint = `${apiBase}/mfa/v1/environments/${environmentId}/users/${userId}/deviceAuthentications`;

		console.log('[MFA Initialize Device Auth] Request details', {
			url: mfaEndpoint,
			method: 'POST',
			environmentId,
			userId,
			hasDeviceId: !!deviceId,
			hasPolicyId: !!resolvedPolicyId,
			region: normalizedRegion,
			tokenLength: cleanToken.length,
			tokenStart: cleanToken.substring(0, 30),
		});

		const response = await global.fetch(mfaEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${cleanToken}`,
			},
			body: JSON.stringify(requestBody),
		});

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

		console.log('[MFA Initialize Device Auth] Response summary', {
			status: response.status,
			statusText: response.statusText,
			ok: response.ok,
		});

		if (!response.ok) {
			return res.status(response.status).json({
				error: authData.error || 'Failed to initialize device authentication',
				message: authData.message || response.statusText,
				details: authData,
			});
		}

		return res.json(authData);
	} catch (error) {
		console.error('[MFA Initialize Device Auth] Error:', error);
		res
			.status(500)
			.json({ error: 'Failed to initialize device authentication', message: error.message });
	}
});

// Read Device Authentication details
// GET /mfa/v1/environments/{environmentId}/deviceAuthentications/{deviceAuthenticationId}
app.post('/api/pingone/mfa/read-device-authentication', async (req, res) => {
	try {
		const { environmentId, authenticationId, workerToken, region } = req.body;
		if (!environmentId || !authenticationId || !workerToken) {
			return res.status(400).json({
				error: 'Missing required fields',
				missing: {
					environmentId: !environmentId,
					authenticationId: !authenticationId,
					workerToken: !workerToken,
				},
			});
		}

		if (typeof workerToken !== 'string') {
			return res.status(400).json({ error: 'Worker token must be a string' });
		}

		let cleanToken = String(workerToken);
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3) {
			console.error('[MFA Read Device Auth] Token does not appear to be a valid JWT format', {
				partsCount: tokenParts.length,
				tokenLength: cleanToken.length,
			});
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
				debug: {
					tokenParts: tokenParts.length,
					tokenLength: cleanToken.length,
				},
			});
		}

		if (tokenParts.some((part) => part.length === 0)) {
			console.error('[MFA Read Device Auth] Token has empty parts', {
				tokenLength: cleanToken.length,
				partsLength: tokenParts.map((p) => p.length),
			});
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token is malformed. Please generate a new token.',
			});
		}

		const normalizedRegion = region || 'na';
		const apiBase =
			normalizedRegion === 'eu'
				? 'https://api.pingone.eu'
				: normalizedRegion === 'asia'
					? 'https://api.pingone.asia'
					: 'https://api.pingone.com';

		const detailsEndpoint = `${apiBase}/mfa/v1/environments/${environmentId}/deviceAuthentications/${authenticationId}`;

		console.log('[MFA Read Device Auth] Request details', {
			url: detailsEndpoint,
			environmentId,
			authenticationId,
			region: normalizedRegion,
			tokenLength: cleanToken.length,
			tokenStart: cleanToken.substring(0, 30),
		});

		const response = await global.fetch(detailsEndpoint, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${cleanToken}`,
			},
		});

		const rawText = await response.text();
		let responseData = {};
		if (rawText && rawText.trim()) {
			try {
				responseData = JSON.parse(rawText);
			} catch (parseError) {
				console.error('[MFA Read Device Auth] Failed to parse response JSON', {
					error: parseError instanceof Error ? parseError.message : String(parseError),
					bodyPreview: rawText.substring(0, 200),
				});
				responseData = { raw: rawText };
			}
		}

		console.log('[MFA Read Device Auth] Response summary', {
			status: response.status,
			statusText: response.statusText,
			ok: response.ok,
			hasBody: !!rawText,
		});

		if (!response.ok) {
			return res.status(response.status).json({
				error: responseData.error || 'Failed to read device authentication',
				message: responseData.message || response.statusText,
				details: responseData,
			});
		}

		return res.json({
			success: true,
			environmentId,
			authenticationId,
			region: normalizedRegion,
			response: responseData,
		});
	} catch (error) {
		console.error('[MFA Read Device Auth] Error:', error);
		res
			.status(500)
			.json({ error: 'Failed to read device authentication', message: error.message });
	}
});
// Validate OTP for Device Authentication (Auth Server endpoint)
// POST https://auth.pingone.com/{ENV_ID}/deviceAuthentications/{DEVICE_AUTHENTICATION_ID}
// Per documentation: Use the deviceAuthId endpoint with application/vnd.pingidentity.otp.check+json content type
app.post('/api/pingone/mfa/validate-otp-for-device', async (req, res) => {
	try {
		const { environmentId, userId, authenticationId, otp, workerToken } = req.body;
		if (!environmentId || !userId || !authenticationId || !otp || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		// Validate worker token format
		if (typeof workerToken !== 'string') {
			return res.status(400).json({ error: 'Worker token must be a string' });
		}

		// Normalize and validate worker token
		let cleanToken = String(workerToken);

		// Remove any existing "Bearer " prefix if accidentally included
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');

		// Remove all whitespace, newlines, carriage returns, and tabs
		cleanToken = cleanToken.replace(/\s+/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		// Basic JWT format check (should have 3 parts separated by dots)
		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3) {
			console.error(
				'[MFA Validate OTP for Device] Token does not appear to be a valid JWT format',
				{
					partsCount: tokenParts.length,
					tokenLength: cleanToken.length,
					tokenStart: cleanToken.substring(0, 30),
				}
			);
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
				debug: {
					tokenParts: tokenParts.length,
					tokenLength: cleanToken.length,
				},
			});
		}

		// Validate token parts are not empty
		if (tokenParts.some((part) => part.length === 0)) {
			console.error('[MFA Validate OTP for Device] Token has empty parts', {
				tokenLength: cleanToken.length,
				partsLength: tokenParts.map((p) => p.length),
			});
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token is malformed. Please generate a new token.',
			});
		}

		// Use Auth Server endpoint for OTP validation per Phase 1 spec
		// Use the otp.check operation on the device authentication resource
		const region = req.body.region || 'na';
		const tld = region === 'eu' ? 'eu' : region === 'asia' ? 'asia' : 'com';
		const authPath = `https://auth.pingone.${tld}`;

		// Per Phase 1 spec: Use the otp.check operation for the deviceAuthenticationId
		// This is the standard PingOne MFA endpoint for OTP validation
		const otpCheckEndpoint = `${authPath}/${environmentId}/deviceAuthentications/${authenticationId}/otp/check`;

		// Request body per PingOne MFA API docs for otp.check
		const requestBody = {
			otp: otp
		};

		console.log('[MFA Validate OTP for Device] Sending request to:', otpCheckEndpoint);
		console.log('[MFA Validate OTP for Device] Token validation:', {
			tokenLength: cleanToken.length,
			tokenStart: cleanToken.substring(0, 30),
			partsCount: tokenParts.length,
		});

		const response = await global.fetch(otpCheckEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/vnd.pingidentity.otp.check+json',
				Authorization: `Bearer ${cleanToken}`,
			},
			body: JSON.stringify(requestBody),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			// Return error in consistent format
			return res.status(response.status).json({
				status: 'FAILED',
				error: errorData.error || errorData.message || 'OTP validation failed',
				message: errorData.message || errorData.error || 'Invalid OTP code',
				...errorData,
			});
		}

		const validationData = await response.json();
		// Return in consistent format
		res.json({
			status: validationData.status || 'COMPLETED',
			message: validationData.message || 'OTP validated successfully',
			...validationData,
		});
	} catch (error) {
		console.error('[MFA Validate OTP for Device] Error:', error);
		res.status(500).json({ error: 'Failed to validate OTP', message: error.message });
	}
});

// Cancel Device Authentication (Auth Server endpoint)
// POST https://auth.pingone.com/{ENV_ID}/deviceAuthentications/{DEVICE_AUTHENTICATION_ID}/cancel
// API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-cancel-device-authentication
app.post('/api/pingone/mfa/cancel-device-authentication', async (req, res) => {
	try {
		const { environmentId, userId, authenticationId, workerToken, reason } = req.body;
		if (!environmentId || !userId || !authenticationId || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		// Normalize and validate worker token
		let cleanToken = String(workerToken).trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/[\s\n\r\t]/g, '').trim();

		if (cleanToken.length === 0) {
			return res.status(400).json({
				error: 'Worker token is empty',
				message: 'Please generate a new worker token using the "Manage Token" button.',
			});
		}

		// Basic JWT format check
		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
			return res.status(400).json({
				error: 'Invalid worker token format',
				message: 'Worker token does not appear to be a valid JWT. Please generate a new token.',
			});
		}

		// Use Auth Server endpoint per master-sms.md guidance
		// POST https://auth.pingone.com/{ENV_ID}/deviceAuthentications/{DEVICE_AUTHENTICATION_ID}/cancel
		const region = req.body.region || 'na';
		const tld = region === 'eu' ? 'eu' : region === 'asia' ? 'asia' : 'com';
		const authPath = `https://auth.pingone.${tld}`;

		const cancelEndpoint = `${authPath}/${environmentId}/deviceAuthentications/${authenticationId}/cancel`;

		console.log('[MFA Cancel Device Authentication] Request:', {
			url: cancelEndpoint,
			authenticationId,
			userId,
			reason: reason || 'USER_CANCELLED',
		});

		const response = await global.fetch(cancelEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${cleanToken}`,
			},
			body: JSON.stringify({
				reason: reason || 'USER_CANCELLED',
			}),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			console.error('[MFA Cancel Device Authentication] Error:', errorData);
			return res.status(response.status).json(errorData);
		}

		const cancelData = await response.json();
		console.log('[MFA Cancel Device Authentication] Success:', cancelData);
		res.json(cancelData);
	} catch (error) {
		console.error('[MFA Cancel Device Authentication] Error:', error);
		res.status(500).json({ error: 'Failed to cancel device authentication', message: error.message });
	}
});

// Select Device for Authentication (Auth Server endpoint)
// POST https://auth.pingone.com/{ENV_ID}/deviceAuthentications/{DEVICE_AUTHENTICATION_ID}/selection
// Per master-sms.md: Use /selection endpoint
app.post('/api/pingone/mfa/select-device-for-authentication', async (req, res) => {
	try {
		const { environmentId, userId, authenticationId, deviceId, workerToken } = req.body;
		if (!environmentId || !userId || !authenticationId || !deviceId || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		let cleanToken = String(workerToken).trim();
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

		const region = req.body.region || 'na';
		const tld = region === 'eu' ? 'eu' : region === 'asia' ? 'asia' : 'com';
		const authPath = `https://auth.pingone.${tld}`;

		const selectionEndpoint = `${authPath}/${environmentId}/deviceAuthentications/${authenticationId}/selection`;

		const requestBody = {
			device: { id: deviceId },
		};

		console.log('[MFA Select Device] Request:', {
			url: selectionEndpoint,
			authenticationId,
			deviceId,
		});

		const response = await global.fetch(selectionEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${cleanToken}`,
			},
			body: JSON.stringify(requestBody),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			return res.status(response.status).json(errorData);
		}

		const selectData = await response.json();
		res.json(selectData);
	} catch (error) {
		console.error('[MFA Select Device] Error:', error);
		res.status(500).json({ error: 'Failed to select device', message: error.message });
	}
});

// Get User MFA Bypass Status
app.post('/api/pingone/mfa/get-user-bypass', async (req, res) => {
	try {
		const { environmentId, userId, workerToken } = req.body;
		if (!environmentId || !userId || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}
		const userEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}`;
		const response = await global.fetch(userEndpoint, {
			method: 'GET',
			headers: { Authorization: `Bearer ${workerToken}` },
		});
		if (!response.ok) {
			const errorData = await response.json();
			return res.status(response.status).json(errorData);
		}
		const userData = await response.json();
		res.json({ bypass: userData.mfa?.bypass || { enabled: false } });
	} catch (error) {
		console.error('[MFA Get User Bypass] Error:', error);
		res.status(500).json({ error: 'Failed to get user MFA bypass', message: error.message });
	}
});

// Update Device Nickname (Dedicated Endpoint)
app.post('/api/pingone/mfa/update-device-nickname', async (req, res) => {
	try {
		const { environmentId, userId, deviceId, nickname, workerToken } = req.body;
		if (!environmentId || !userId || !deviceId || !nickname || !workerToken) {
			return res.status(400).json({ error: 'Missing required fields' });
		}
		const nicknameEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}`;
		const response = await global.fetch(nicknameEndpoint, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${workerToken}` },
			body: JSON.stringify({ nickname }),
		});
		if (!response.ok) {
			const errorData = await response.json();
			return res.status(response.status).json(errorData);
		}
		const deviceData = await response.json();
		res.json(deviceData);
	} catch (error) {
		console.error('[MFA Update Device Nickname] Error:', error);
		res.status(500).json({ error: 'Failed to update device nickname', message: error.message });
	}
});

// API endpoint not found handler
app.use('/api', (req, res) => {
	// Check if request accepts HTML
	const acceptsHtml = req.accepts('html');

	if (acceptsHtml) {
		// Return HTML page with cartoon
		res.status(404).send(`
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>404 - Feature Coming Soon</title>
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			min-height: 100vh;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 20px;
		}
		.container {
			background: white;
			border-radius: 20px;
			padding: 40px;
			max-width: 600px;
			box-shadow: 0 20px 60px rgba(0,0,0,0.3);
			text-align: center;
		}
		.cartoon {
			font-size: 120px;
			margin-bottom: 20px;
			animation: float 3s ease-in-out infinite;
		}
		@keyframes float {
			0%, 100% { transform: translateY(0px); }
			50% { transform: translateY(-20px); }
		}
		h1 {
			color: #667eea;
			font-size: 48px;
			margin-bottom: 10px;
		}
		h2 {
			color: #764ba2;
			font-size: 24px;
			margin-bottom: 20px;
		}
		p {
			color: #666;
			font-size: 16px;
			line-height: 1.6;
			margin-bottom: 15px;
		}
		.code {
			background: #f5f5f5;
			padding: 15px;
			border-radius: 8px;
			font-family: 'Courier New', monospace;
			font-size: 14px;
			color: #333;
			margin: 20px 0;
			border-left: 4px solid #667eea;
		}
		.btn {
			display: inline-block;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: white;
			padding: 12px 30px;
			border-radius: 25px;
			text-decoration: none;
			font-weight: 600;
			margin-top: 20px;
			transition: transform 0.2s;
		}
		.btn:hover {
			transform: scale(1.05);
		}
		.speech-bubble {
			background: #f0f0f0;
			border-radius: 15px;
			padding: 15px 20px;
			margin: 20px 0;
			position: relative;
			font-style: italic;
			color: #555;
		}
		.speech-bubble:before {
			content: '';
			position: absolute;
			bottom: -10px;
			left: 50%;
			transform: translateX(-50%);
			width: 0;
			height: 0;
			border-left: 10px solid transparent;
			border-right: 10px solid transparent;
			border-top: 10px solid #f0f0f0;
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="cartoon">🤖💻</div>
		<h1>404</h1>
		<h2>Oops! Feature Under Construction</h2>
		
		<div class="speech-bubble">
			"Have you tried turning it off and on again?" 🔌
		</div>
		
		<p>Sorry for the inconvenience, this feature is coming soon! 🚀</p>
		
		<div class="code">
			${req.method} ${req.path}
		</div>
		
		<p>Our developers are working hard to bring you this feature.</p>
		<p>In the meantime, why not try one of our other awesome features?</p>
		
		<a href="/" class="btn">← Back to Home</a>
	</div>
</body>
</html>
		`);
	} else {
		// Return JSON for API clients
		res.status(404).json({
			error: 'endpoint_not_found',
			message: 'Sorry for the inconvenience, this feature is coming soon! 🚀',
			details: `The endpoint ${req.method} ${req.path} is not yet available.`,
			path: req.path,
			method: req.method,
		});
	}
});

// Catch-all for non-API routes (source files, etc.) - return 404 instead of 500
app.use((req, res, next) => {
	// If it's not an API route and not a static file, return 404
	if (!req.path.startsWith('/api')) {
		return res.status(404).send('Not Found');
	}
	next();
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
		const parResponse = await fetch(parEndpoint, {
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