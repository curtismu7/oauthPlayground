/* eslint-disable */
// OAuth Playground Backend Server
// Provides secure server-side OAuth flow implementations

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import https from 'https';
import fs from 'node:fs';
import { execSync } from 'child_process';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware with enhanced CORS and CSP
app.use(
  cors({
    origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'https://localhost:3000', 'http://localhost:3001', 'https://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
  })
);

// Add CSP headers
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', 
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

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/api/health', (req, res) => {
	res.json({
		status: 'ok',
		timestamp: new Date().toISOString(),
		version: '1.0.0',
	});
});

// Environment variables endpoint (for frontend to load default credentials)
app.get('/api/env-config', (req, res) => {
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
		code: req.body.code?.substring(0, 20) + '...',
		codeVerifier: req.body.code_verifier?.substring(0, 20) + '...',
		clientId: req.body.client_id?.substring(0, 8) + '...',
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
		}

		// Get environment ID from client_id or request
		const environmentId = req.body.environment_id || process.env.PINGONE_ENVIRONMENT_ID;
		if (!environmentId) {
			console.error('❌ [Server] Missing environment_id:', {
				fromRequestBody: !!req.body.environment_id,
				fromEnv: !!process.env.PINGONE_ENVIRONMENT_ID,
				environmentId,
			});
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing environment_id',
			});
		}

		// Build token endpoint URL
		const tokenEndpoint = `https://auth.pingone.com/${environmentId}/as/token`;

		console.log('🔧 [Server] Token exchange configuration:', {
			environmentId,
			tokenEndpoint,
			grantType: grant_type,
			clientId: client_id?.substring(0, 8) + '...',
			hasClientSecret: !!client_secret,
			hasCode: !!code,
			hasCodeVerifier: !!code_verifier,
			redirectUri: redirect_uri,
			clientAuthMethod: req.body.client_auth_method || 'client_secret_post',
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
			
			tokenRequestBody = new URLSearchParams(params);
		}

		// Prepare headers
		const headers = {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json',
		};

		// Handle client authentication based on the specified method
		const client_auth_method = req.body.client_auth_method || 'client_secret_post';

		if (client_secret && client_secret.trim() !== '') {
			if (client_auth_method === 'client_secret_basic') {
				// Use Basic Auth
				const credentials = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
				headers['Authorization'] = `Basic ${credentials}`;
				console.log('🔐 [Server] Using Basic Auth for confidential client:', {
					clientId: client_id?.substring(0, 8) + '...',
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
					clientId: client_id?.substring(0, 8) + '...',
					clientSecretLength: client_secret?.length || 0,
					hasClientSecret: !!client_secret,
					authMethod: client_auth_method,
				});
			}
		} else {
			// For public clients, client_id is already in the body
			console.log('🔓 [Server] Using public client authentication:', {
				clientId: client_id?.substring(0, 8) + '...',
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
			body: tokenRequestBody,
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
			clientId: client_id?.substring(0, 8) + '...',
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
		});
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error during token exchange',
		});
	}
});

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

		const response = await fetch(tokenEndpoint, {
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
		} = req.body;

		console.log(`[Introspect Token] Received request:`, {
			hasToken: !!token,
			hasClientId: !!client_id,
			hasClientSecret: !!client_secret,
			hasIntrospectionEndpoint: !!introspection_endpoint,
			tokenAuthMethod: token_auth_method,
			clientAssertionType: client_assertion_type,
			tokenPreview: token ? token.substring(0, 20) + '...' : 'none',
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
		let introspectionBody = new URLSearchParams({
			token: token,
			client_id: client_id,
		});

		// Add authentication based on method
		if (authMethod === 'client_secret_basic' || authMethod === 'client_secret_post') {
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
				console.log(`[Introspect Token] Using JWT assertion for ${authMethod}`);
				introspectionBody.append('client_assertion_type', assertionType);
				introspectionBody.append('client_assertion', client_assertion);
			} else {
				console.log(
					`[Introspect Token] Missing JWT assertion, falling back to client_secret for ${authMethod}`
				);
				if (client_secret) {
					introspectionBody.append('client_secret', client_secret);
				}
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

		const response = await fetch(introspection_endpoint, {
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

		const response = await fetch(userInfoEndpoint, {
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

		const response = await fetch(userInfoEndpoint, {
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

		const response = await fetch(deviceEndpoint, {
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

		// Add client authentication if secret provided
		if (client_secret) {
			const credentials = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
			headers['Authorization'] = `Basic ${credentials}`;
		}

		const response = await fetch(parEndpoint, {
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

		const response = await fetch(jwksUri, {
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

// OAuth Playground JWKS Endpoint (serves our generated keys)
app.get('/jwks', async (req, res) => {
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
app.get('/api/playground-jwks', async (req, res) => {
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

// OpenID Discovery Endpoint (proxy to PingOne)
app.get('/api/discovery', async (req, res) => {
	try {
		const { environment_id, region = 'us' } = req.query;

		if (!environment_id) {
			return res.status(400).json({
				error: 'invalid_request',
				error_description: 'Missing required parameter: environment_id',
			});
		}

		// Determine the base URL based on region
		const regionMap = {
			us: 'https://auth.pingone.com',
			eu: 'https://auth.pingone.eu',
			ca: 'https://auth.pingone.ca',
			ap: 'https://auth.pingone.asia',
		};

		const baseUrl = regionMap[region.toLowerCase()] || regionMap['us'];
		const discoveryUrl = `${baseUrl}/${environment_id}/.well-known/openid_configuration`;

		console.log(`[Discovery] Fetching configuration from: ${discoveryUrl}`);

		const response = await fetch(discoveryUrl, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				'User-Agent': 'PingOne-OAuth-Playground/1.0',
			},
		});

		if (!response.ok) {
			console.error(`[Discovery] PingOne error: ${response.status} ${response.statusText}`);

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
		console.error('[Discovery] Server error:', error);
		res.status(500).json({
			error: 'server_error',
			error_description: 'Internal server error during discovery',
			details: error.message,
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

// Error handling middleware
app.use((error, req, res, next) => {
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

// Start HTTPS server
const certs = generateSelfSignedCert();
let server;

if (certs) {
	try {
		const options = {
			key: fs.readFileSync(certs.keyPath),
			cert: fs.readFileSync(certs.certPath),
		};

		server = https.createServer(options, app).listen(PORT, '0.0.0.0', () => {
			console.log(`🚀 OAuth Playground Backend Server running on port ${PORT} (HTTPS)`);
			console.log(`📡 Health check: https://localhost:${PORT}/api/health`);
			console.log(`🔐 Token exchange: https://localhost:${PORT}/api/token-exchange`);
			console.log(`👤 UserInfo: https://localhost:${PORT}/api/userinfo`);
			console.log(`✅ Token validation: https://localhost:${PORT}/api/validate-token`);
		});
	} catch (error) {
		console.error('❌ Failed to start HTTPS server:', error.message);
		console.log('🔄 Falling back to HTTP server...');
		server = app.listen(PORT, '0.0.0.0', () => {
			console.log(`🚀 OAuth Playground Backend Server running on port ${PORT} (HTTP)`);
			console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
			console.log(`🔐 Token exchange: http://localhost:${PORT}/api/token-exchange`);
			console.log(`👤 UserInfo: http://localhost:${PORT}/api/userinfo`);
			console.log(`✅ Token validation: http://localhost:${PORT}/api/validate-token`);
		});
	}
} else {
	server = app.listen(PORT, '0.0.0.0', () => {
		console.log(`🚀 OAuth Playground Backend Server running on port ${PORT} (HTTP)`);
		console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
		console.log(`🔐 Token exchange: http://localhost:${PORT}/api/token-exchange`);
		console.log(`👤 UserInfo: http://localhost:${PORT}/api/userinfo`);
		console.log(`✅ Token validation: http://localhost:${PORT}/api/validate-token`);
	});
}

// Add error handling
server.on('error', (err) => {
	console.error('❌ Server error:', err);
});

server.on('listening', () => {
	const addr = server.address();
	console.log(`🌐 Server listening on:`, addr);
});

export default app;
