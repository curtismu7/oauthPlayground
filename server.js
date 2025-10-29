/* eslint-disable */
console.log("🚀 Starting OAuth Playground Backend Server...");// OAuth Playground Backend Server
// Provides secure server-side OAuth flow implementations

import { execSync } from 'node:child_process';
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
	const averageResponseTimeMs = requestStats.totalRequests > 0
		? requestStats.totalResponseTimeMs / requestStats.totalRequests
		: 0;
	const errorRatePercent = requestStats.totalRequests > 0
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
		}

		// Get environment ID from request or environment (skip env fallback in test)
		const environmentId = req.body.environment_id || (process.env.NODE_ENV !== 'test' ? process.env.PINGONE_ENVIRONMENT_ID : undefined);
		
		// Build token endpoint URL - use provided token_endpoint or construct from environment_id
		let tokenEndpoint;
		if (token_endpoint && token_endpoint.trim() !== '') {
			tokenEndpoint = token_endpoint;
			console.log('🔧 [Server] Using provided token endpoint:', tokenEndpoint);
		} else {
			if (!environmentId) {
				return res.status(400).json({
					error: 'invalid_request',
					error_description: 'Missing environment_id (required when token_endpoint is not provided)',
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
			console.log('🔑 [Server] Building client credentials request body');
			const finalScope = scope || 'openid';
			console.log('🔑 [Server] Using scope for client_credentials:', { providedScope: scope, finalScope });
			tokenRequestBody = new URLSearchParams({
				grant_type: 'client_credentials',
				client_id: client_id,
				scope: finalScope,
			});
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
			accessTokenPreview: access_token ? `${access_token.substring(0, 20)}...` : 'none'
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
			ok: response.ok
		});

		const data = await response.json();

		console.log(`[Device UserInfo] PingOne response data:`, {
			hasData: !!data,
			error: data.error,
			error_description: data.error_description
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
			error
		});
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error during device userinfo request',
			details: error.message
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
			redirectUri: parParams.redirect_uri
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
			authMethod: client_secret ? 'Basic' : 'client_secret_post'
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

// PingOne MFA Device Registration Endpoint
app.post('/api/pingone/mfa/register-device', async (req, res) => {
	try {
		const {
			environmentId,
			clientId,
			clientSecret,
			username,
			type,
			phone,
			email,
		} = req.body;

		console.log(`[PingOne MFA] Device registration request:`, {
			environmentId,
			clientId: clientId ? `${clientId.substring(0, 8)}...` : 'none',
			username,
			type,
			phone: phone ? `${phone.substring(0, 3)}***${phone.substring(phone.length - 4)}` : 'none',
			email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'none',
		});

		if (!environmentId || !clientId || !username || !type) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameters: environmentId, clientId, username, type',
			});
		}

		// First, get a worker token for management API access
		const tokenEndpoint = `https://auth.pingone.com/${environmentId}/as/token`;
		
		const tokenResponse = await fetch(tokenEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
			},
			body: new URLSearchParams({
				grant_type: 'client_credentials',
				scope: 'p1:read:user p1:update:user p1:create:device p1:read:device p1:update:device',
			}),
		});

		if (!tokenResponse.ok) {
			const tokenError = await tokenResponse.json();
			console.error(`[PingOne MFA] Worker token error:`, tokenError);
			return res.status(tokenResponse.status).json({
				error: 'authentication_failed',
				error_description: 'Failed to obtain worker token for MFA operations',
				details: tokenError,
			});
		}

		const tokenData = await tokenResponse.json();
		const workerToken = tokenData.access_token;

		console.log(`[PingOne MFA] Worker token obtained successfully`);

		// Find or create user
		const usersEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users`;
		
		// Search for existing user
		const userSearchResponse = await fetch(`${usersEndpoint}?filter=username eq "${username}"`, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${workerToken}`,
				'Content-Type': 'application/json',
			},
		});

		let userId;
		if (userSearchResponse.ok) {
			const userSearchData = await userSearchResponse.json();
			if (userSearchData._embedded && userSearchData._embedded.users && userSearchData._embedded.users.length > 0) {
				userId = userSearchData._embedded.users[0].id;
				console.log(`[PingOne MFA] Found existing user: ${userId}`);
			}
		}

		// Create user if not found
		if (!userId) {
			const createUserResponse = await fetch(usersEndpoint, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${workerToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					username: username,
					email: email || `${username}@example.com`,
					population: {
						id: 'default', // You may need to adjust this based on your environment
					},
					...(phone && { mobilePhone: phone }),
				}),
			});

			if (!createUserResponse.ok) {
				const createUserError = await createUserResponse.json();
				console.error(`[PingOne MFA] User creation error:`, createUserError);
				return res.status(createUserResponse.status).json({
					error: 'user_creation_failed',
					error_description: 'Failed to create user for MFA enrollment',
					details: createUserError,
				});
			}

			const userData = await createUserResponse.json();
			userId = userData.id;
			console.log(`[PingOne MFA] Created new user: ${userId}`);
		}

		// Register MFA device
		const devicesEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices`;
		
		const deviceData = {
			type: type.toUpperCase(),
			...(type.toLowerCase() === 'sms' && phone && { phone: phone }),
			...(type.toLowerCase() === 'email' && email && { email: email }),
		};

		const deviceResponse = await fetch(devicesEndpoint, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${workerToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(deviceData),
		});

		if (!deviceResponse.ok) {
			const deviceError = await deviceResponse.json();
			console.error(`[PingOne MFA] Device registration error:`, deviceError);
			return res.status(deviceResponse.status).json({
				error: 'device_registration_failed',
				error_description: 'Failed to register MFA device',
				details: deviceError,
			});
		}

		const deviceResult = await deviceResponse.json();
		console.log(`[PingOne MFA] Device registered successfully: ${deviceResult.id}`);

		res.json({
			success: true,
			deviceId: deviceResult.id,
			userId: userId,
			type: type.toUpperCase(),
			status: 'ACTIVE',
			message: `${type.toUpperCase()} device registered successfully`,
			server_timestamp: new Date().toISOString(),
		});

	} catch (error) {
		console.error('[PingOne MFA] Device registration server error:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error during MFA device registration',
			details: error.message,
		});
	}
});

// PingOne MFA Challenge Initiation Endpoint
app.post('/api/pingone/mfa/initiate-challenge', async (req, res) => {
	try {
		const {
			environmentId,
			clientId,
			clientSecret,
			username,
			deviceId,
			type,
			phone,
			email,
		} = req.body;

		console.log(`[PingOne MFA] Challenge initiation request:`, {
			environmentId,
			clientId: clientId ? `${clientId.substring(0, 8)}...` : 'none',
			username,
			deviceId,
			type,
			phone: phone ? `${phone.substring(0, 3)}***${phone.substring(phone.length - 4)}` : 'none',
			email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'none',
		});

		if (!environmentId || !clientId || !username || !type) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameters: environmentId, clientId, username, type',
			});
		}

		// Get worker token for management API access
		const tokenEndpoint = `https://auth.pingone.com/${environmentId}/as/token`;
		
		const tokenResponse = await fetch(tokenEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
			},
			body: new URLSearchParams({
				grant_type: 'client_credentials',
				scope: 'p1:read:user p1:update:user p1:create:device p1:read:device p1:update:device',
			}),
		});

		if (!tokenResponse.ok) {
			const tokenError = await tokenResponse.json();
			console.error(`[PingOne MFA] Worker token error:`, tokenError);
			return res.status(tokenResponse.status).json({
				error: 'authentication_failed',
				error_description: 'Failed to obtain worker token for MFA operations',
				details: tokenError,
			});
		}

		const tokenData = await tokenResponse.json();
		const workerToken = tokenData.access_token;

		// Find user
		const usersEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users`;
		const userSearchResponse = await fetch(`${usersEndpoint}?filter=username eq "${username}"`, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${workerToken}`,
				'Content-Type': 'application/json',
			},
		});

		if (!userSearchResponse.ok) {
			return res.status(404).json({
				error: 'user_not_found',
				error_description: 'User not found for MFA challenge',
			});
		}

		const userSearchData = await userSearchResponse.json();
		if (!userSearchData._embedded || !userSearchData._embedded.users || userSearchData._embedded.users.length === 0) {
			return res.status(404).json({
				error: 'user_not_found',
				error_description: 'User not found for MFA challenge',
			});
		}

		const userId = userSearchData._embedded.users[0].id;

		// Initiate MFA challenge
		const challengeEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/mfa/challenges`;
		
		const challengeData = {
			deviceId: deviceId,
			type: type.toUpperCase(),
		};

		const challengeResponse = await fetch(challengeEndpoint, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${workerToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(challengeData),
		});

		if (!challengeResponse.ok) {
			const challengeError = await challengeResponse.json();
			console.error(`[PingOne MFA] Challenge initiation error:`, challengeError);
			return res.status(challengeResponse.status).json({
				error: 'challenge_initiation_failed',
				error_description: 'Failed to initiate MFA challenge',
				details: challengeError,
			});
		}

		const challengeResult = await challengeResponse.json();
		console.log(`[PingOne MFA] Challenge initiated successfully: ${challengeResult.id}`);

		const message = type.toLowerCase() === 'sms' 
			? `Verification code sent to ${phone}` 
			: `Verification code sent to ${email}`;

		res.json({
			success: true,
			challengeId: challengeResult.id,
			userId: userId,
			type: type.toUpperCase(),
			status: 'PENDING',
			message: message,
			expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
			server_timestamp: new Date().toISOString(),
		});

	} catch (error) {
		console.error('[PingOne MFA] Challenge initiation server error:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error during MFA challenge initiation',
			details: error.message,
		});
	}
});

// PingOne MFA Challenge Verification Endpoint
app.post('/api/mfa/challenge/verify', async (req, res) => {
	try {
		const {
			environmentId,
			challengeId,
			challengeCode,
			userId
		} = req.body;

		console.log(`[PingOne MFA] Challenge verification request:`, {
			environmentId,
			challengeId,
			challengeCode: challengeCode ? `${challengeCode.substring(0, 2)}***` : 'none',
			userId
		});

		// Make real API call to PingOne for MFA challenge verification
		const pingOneVerifyUrl = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/challenges/${challengeId}/verify`;
		
		const verifyRequestBody = {
			challengeCode: challengeCode
		};

		console.log(`[PingOne MFA] Making real API call to PingOne for verification:`, {
			url: pingOneVerifyUrl,
			method: 'POST',
			body: { challengeCode: challengeCode ? `${challengeCode.substring(0, 2)}***` : 'none' }
		});

		const pingOneResponse = await fetch(pingOneVerifyUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${req.headers.authorization?.replace('Bearer ', '')}`
			},
			body: JSON.stringify(verifyRequestBody)
		});

		if (!pingOneResponse.ok) {
			const errorData = await pingOneResponse.json();
			console.error(`[PingOne MFA] PingOne challenge verification failed:`, errorData);
			return res.status(pingOneResponse.status).json({
				success: false,
				error: errorData.error || 'verification_failed',
				error_description: errorData.error_description || errorData.message || 'Failed to verify MFA challenge',
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
			pingOneResponse: verifyData
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

// PingOne MFA Challenge Initiation Endpoint (simplified for frontend)
app.post('/api/mfa/challenge/initiate', async (req, res) => {
	try {
		const {
			environmentId,
			userId,
			deviceId,
			deviceType,
			challengeType
		} = req.body;

		console.log(`[PingOne MFA] Challenge initiation request:`, {
			environmentId,
			userId,
			deviceId,
			deviceType,
			challengeType
		});

		// Make real API call to PingOne for MFA challenge initiation
		const pingOneChallengeUrl = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}/challenges`;
		
		const challengeRequestBody = {
			challengeType: challengeType,
			deviceType: deviceType
		};

		console.log(`[PingOne MFA] Making real API call to PingOne:`, {
			url: pingOneChallengeUrl,
			method: 'POST',
			body: challengeRequestBody
		});

		const pingOneResponse = await fetch(pingOneChallengeUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${req.headers.authorization?.replace('Bearer ', '')}`
			},
			body: JSON.stringify(challengeRequestBody)
		});

		if (!pingOneResponse.ok) {
			const errorData = await pingOneResponse.json();
			console.error(`[PingOne MFA] PingOne challenge initiation failed:`, errorData);
			return res.status(pingOneResponse.status).json({
				success: false,
				error: errorData.error || 'challenge_initiation_failed',
				error_description: errorData.error_description || errorData.message || 'Failed to initiate MFA challenge',
				server_timestamp: new Date().toISOString(),
			});
		}

		const challengeData = await pingOneResponse.json();
		console.log(`[PingOne MFA] PingOne challenge initiated successfully:`, challengeData);

		const message = challengeType === 'SMS' 
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
			pingOneResponse: challengeData
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
			workerToken
		} = req.body;

		console.log(`[Device Registration] Request received:`, {
			environmentId,
			userId,
			deviceType,
			deviceName,
			contactInfo: contactInfo ? `${contactInfo.substring(0, 3)}***${contactInfo.substring(contactInfo.length - 4)}` : 'none',
			hasVerificationCode: !!verificationCode,
			hasWorkerToken: !!workerToken
		});

		if (!environmentId || !userId || !deviceType || !deviceName || !workerToken) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameters: environmentId, userId, deviceType, deviceName, workerToken'
			});
		}

		// Make API call to PingOne for device registration
		// Use device-type-specific endpoint according to PingOne MFA API documentation
		const deviceTypeEndpoint = deviceType.toLowerCase(); // e.g., 'sms', 'email', 'totp', 'fido2'
		const deviceRegistrationUrl = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceTypeEndpoint}`;
		
		// Build request body according to device type
		const requestBody = {
			nickname: deviceName
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
			body: requestBody
		});

		const deviceRegistrationResponse = await fetch(deviceRegistrationUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${workerToken}`
			},
			body: JSON.stringify(requestBody)
		});

		const responseData = await deviceRegistrationResponse.json();

		if (!deviceRegistrationResponse.ok) {
			console.error(`[Device Registration] PingOne API error:`, responseData);
			return res.status(deviceRegistrationResponse.status).json({
				error: 'device_registration_failed',
				error_description: responseData.message || responseData.error || 'Device registration failed',
				details: responseData
			});
		}

		console.log(`[Device Registration] Success:`, responseData);
		res.json(responseData);

	} catch (error) {
		console.error(`[Device Registration] Error:`, error);
		res.status(500).json({
			error: 'internal_server_error',
			error_description: 'Internal server error during device registration',
			details: error.message
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
			timeout: 5000
		});
		
		console.log(`[Network Check] PingOne connectivity test result:`, {
			status: response.status,
			statusText: response.statusText,
			headers: Object.fromEntries(response.headers.entries())
		});
		
		res.json({
			status: 'success',
			message: 'Network connectivity to PingOne is working',
			pingone_status: response.status,
			timestamp: new Date().toISOString()
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
				hostname: error.hostname
			},
			timestamp: new Date().toISOString()
		});
	}
});

// PingOne Redirectless Authorization Endpoint (for starting redirectless authentication)
app.post('/api/pingone/redirectless/authorize', async (req, res) => {
	try {
		console.log(`[PingOne Redirectless] Received request body:`, JSON.stringify(req.body, null, 2));
		
		const { environmentId, clientId, clientSecret, scopes, codeChallenge, codeChallengeMethod, state, username, password } = req.body;

		if (!environmentId || !clientId) {
			console.log(`[PingOne Redirectless] Validation failed: Missing required parameters`);
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameters: environmentId, clientId'
			});
		}

		console.log(`[PingOne Redirectless] Starting authorization request`);
		console.log(`[PingOne Redirectless] Environment ID:`, environmentId);
		console.log(`[PingOne Redirectless] Client ID:`, clientId ? `${clientId.substring(0, 8)}...` : 'none');
		console.log(`[PingOne Redirectless] Has Client Secret:`, !!clientSecret);
		console.log(`[PingOne Redirectless] Scopes:`, scopes);
		console.log(`[PingOne Redirectless] Has PKCE:`, !!codeChallenge);

	// Build authorization request parameters
	const authParams = new URLSearchParams();
	authParams.set('response_type', 'code');
	authParams.set('client_id', clientId);
	authParams.set('redirect_uri', 'urn:pingidentity:redirectless');
	authParams.set('scope', scopes || 'openid');
	authParams.set('state', state || `pi-flow-${Date.now()}`);

	// Add PKCE parameters only if they exist
	if (codeChallenge) {
		authParams.set('code_challenge', codeChallenge);
		authParams.set('code_challenge_method', codeChallengeMethod || 'S256');
	}

	// Add username/password if provided
	if (username) authParams.set('username', username);
	if (password) authParams.set('password', password);

	// Debug: Log all parameters to check for duplicates
	console.log(`[PingOne Redirectless] All URL parameters:`, Array.from(authParams.entries()));
	console.log(`[PingOne Redirectless] Checking for duplicate client_id:`, {
		count: authParams.getAll('client_id').length,
		values: authParams.getAll('client_id')
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
				authResponse = await fetch(authorizeUrl, {
					method: 'POST',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/x-www-form-urlencoded',
						'User-Agent': 'OAuth-Playground/1.0'
					},
					body: authParams.toString(),
					timeout: 10000 // 10 second timeout
				});
				break; // Success, exit retry loop
			} catch (error) {
				lastError = error;
				console.log(`[PingOne Redirectless] Attempt ${attempt} failed:`, error.message);
				
				if (attempt < maxRetries) {
					const delay = attempt * 1000; // Exponential backoff: 1s, 2s, 3s
					console.log(`[PingOne Redirectless] Retrying in ${delay}ms...`);
					await new Promise(resolve => setTimeout(resolve, delay));
				}
			}
		}
		
		if (!authResponse) {
			throw lastError || new Error('All retry attempts failed');
		}

		// Check content-type to handle both JSON and HTML responses
		const contentType = authResponse.headers.get('content-type') || '';
		let responseData;
		
		try {
			if (contentType.includes('application/json')) {
				responseData = await authResponse.json();
			} else {
				// If not JSON, try to get text and attempt JSON parse as fallback
				const responseText = await authResponse.text();
				try {
					responseData = JSON.parse(responseText);
				} catch (parseError) {
					// If it's HTML or other text, log it and return error
					console.error(`[PingOne Redirectless] Response is not valid JSON:`, responseText.substring(0, 500));
					throw new Error(`PingOne returned ${contentType || 'text/html'} instead of JSON`);
				}
			}
		} catch (parseError) {
			console.error(`[PingOne Redirectless] Failed to parse response:`, parseError.message);
			return res.status(500).json({
				error: 'invalid_response',
				error_description: 'PingOne returned an invalid response format',
				details: {
					message: parseError.message,
					contentType: contentType
				}
			});
		}

		if (!authResponse.ok) {
			console.error(`[PingOne Redirectless] PingOne API Error:`, {
				status: authResponse.status,
				statusText: authResponse.statusText,
				responseData: responseData,
				requestUrl: authorizeUrl
			});
			return res.status(authResponse.status).json({
				error: 'authorization_failed',
				error_description: responseData.message || responseData.error || 'Failed to start authorization flow',
				details: responseData
			});
		}

		console.log(`[PingOne Redirectless] Success:`, {
			hasResumeUrl: !!responseData.resumeUrl,
			hasFlowId: !!responseData.id,
			hasTokens: !!(responseData.access_token || responseData.id_token)
		});

		res.json(responseData);

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
				hostname: error.hostname
			}
		});
	}
});

// PingOne Resume URL Endpoint (for completing redirectless authentication)
app.post('/api/pingone/resume', async (req, res) => {
	try {
		console.log(`[PingOne Resume] Received request body:`, JSON.stringify(req.body, null, 2));
		
		const { resumeUrl, flowId, flowState, clientId, clientSecret } = req.body;

		if (!resumeUrl) {
			console.log(`[PingOne Resume] Validation failed: Missing resumeUrl`);
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing resumeUrl parameter'
			});
		}

		console.log(`[PingOne Resume] Calling resume URL:`, resumeUrl);
		console.log(`[PingOne Resume] Flow ID:`, flowId);
		console.log(`[PingOne Resume] Flow State:`, flowState);
		console.log(`[PingOne Resume] Client ID:`, clientId ? `${clientId.substring(0, 8)}...` : 'none');
		console.log(`[PingOne Resume] Has Client Secret:`, !!clientSecret);

		// For redirectless flow, we need to POST to the resumeUrl with flow completion data
		// PingOne expects form-encoded data with specific parameter names
		const resumeBody = new URLSearchParams();
		if (flowId) resumeBody.append('flowId', flowId);
		if (flowState) resumeBody.append('state', flowState);
		if (clientId) resumeBody.append('client_id', clientId);
		if (clientSecret) resumeBody.append('client_secret', clientSecret);
		// Note: environmentId is not needed for resume - it's already in the resumeUrl
		// if (req.body.environmentId) resumeBody.append('environmentId', req.body.environmentId);
		if (req.body.redirectUri) resumeBody.append('redirect_uri', req.body.redirectUri);
		if (req.body.codeVerifier) resumeBody.append('code_verifier', req.body.codeVerifier);
		
		console.log(`[PingOne Resume] Request body being sent to PingOne:`, resumeBody.toString());
		console.log(`[PingOne Resume] Resume URL:`, resumeUrl);
		
		const resumeResponse = await fetch(resumeUrl, {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/x-www-form-urlencoded',
				'User-Agent': 'OAuth-Playground/1.0'
			},
			body: resumeBody.toString()
		});

		const responseData = await resumeResponse.json();

		if (!resumeResponse.ok) {
			console.error(`[PingOne Resume] PingOne API Error:`, {
				status: resumeResponse.status,
				statusText: resumeResponse.statusText,
				responseData: responseData,
				requestBody: resumeBody.toString(),
				resumeUrl: resumeUrl
			});
			return res.status(resumeResponse.status).json({
				error: 'resume_failed',
				error_description: responseData.message || responseData.error || 'Failed to resume authentication flow',
				details: responseData
			});
		}

		console.log(`[PingOne Resume] Success:`, {
			hasAccessToken: !!responseData.access_token,
			hasIdToken: !!responseData.id_token,
			hasUserId: !!responseData.userId
		});

		res.json(responseData);

	} catch (error) {
		console.error(`[PingOne Resume] Error:`, error);
		res.status(500).json({
			error: 'internal_server_error',
			error_description: 'Internal server error during resume URL call',
			details: error.message
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
			query: req.query
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
				'Accept': 'application/json',
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

			console.log(`[OAuth Metadata] Using fallback OAuth metadata configuration for environment: ${environment_id}`);

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
			error
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
			query: req.query
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
				'Accept': 'application/json',
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
			error
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
				error_description: 'Missing required parameter: environmentId'
			});
		}

		let tokenToUse = workerToken;
		if (!tokenToUse) {
			// Get worker token using app credentials
			if (!clientId || !clientSecret) {
				console.log('[Config Checker] Missing clientId or clientSecret for token request');
				return res.status(400).json({
					error: 'invalid_request',
					error_description: 'Missing required parameters: clientId, clientSecret'
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
					scope: 'p1:read:environment p1:read:application p1:read:resource'
					}),
				signal: controller1.signal,
				});
			clearTimeout(timeout1);

			if (!tokenResponse.ok) {
				const errorText = await tokenResponse.text();
				console.error('[Config Checker] Token request failed:', errorText);
				return res.status(400).json({
					error: 'invalid_token_request',
					error_description: 'Failed to get worker token'
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
				'Authorization': `Bearer ${tokenToUse}`,
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
				error_description: `Failed to fetch applications: ${response.status} ${response.statusText}`
			});
		}

		const data = await response.json();
		console.log(`[Config Checker] Successfully fetched ${data._embedded?.applications?.length || 0} applications`);
		
		res.json(data);
	} catch (error) {
		if (error.name === 'AbortError') {
			console.error('[Config Checker] Request timed out');
			res.status(504).json({
				error: 'timeout',
				error_description: 'Request timed out'
			});
		} else {
			console.error('[Config Checker] Error fetching applications:', error);
			res.status(500).json({
				error: 'server_error',
				error_description: 'Internal server error while fetching applications'
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
				error_description: 'Missing required parameters: environmentId, appId'
			});
		}

		let tokenToUse = workerToken;
		if (!tokenToUse) {
			// Get worker token using app credentials
			if (!clientId || !clientSecret) {
				console.log('[Config Checker] Missing clientId or clientSecret for token request');
				return res.status(400).json({
					error: 'invalid_request',
					error_description: 'Missing required parameters: clientId, clientSecret'
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
					scope: 'p1:read:environment p1:read:application p1:read:resource'
					}),
				signal: controller1.signal,
				});
			clearTimeout(timeout1);

			if (!tokenResponse.ok) {
				const errorText = await tokenResponse.text();
				console.error('[Config Checker] Token request failed:', errorText);
				return res.status(400).json({
					error: 'invalid_token_request',
					error_description: 'Failed to get worker token'
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
				'Authorization': `Bearer ${tokenToUse}`,
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
				error_description: `Failed to fetch resources: ${response.status} ${response.statusText}`
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
				error_description: 'Request timed out'
			});
		} else {
			console.error('[Config Checker] Error fetching resources:', error);
			res.status(500).json({
				error: 'server_error',
				error_description: 'Internal server error while fetching resources'
			});
		}
	}
});

app.get('/api/pingone/oidc-config', async (req, res) => {
	try {
		const { environmentId, region = 'na' } = req.query;
		
		if (!environmentId) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameter: environmentId'
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
				error_description: `Failed to fetch OIDC config: ${response.status} ${response.statusText}`
			});
		}

		const data = await response.json();
		console.log(`[Config Checker] Successfully fetched OIDC config`);
		
		res.json(data);
	} catch (error) {
		console.error('[Config Checker] Error fetching OIDC config:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error while fetching OIDC config'
		});
	}
});

// API endpoint not found handler
app.use('/api', (req, res) => {
	res.status(404).json({
		error: 'API endpoint not found',
		path: req.path,
		method: req.method,
	});
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

