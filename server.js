// OAuth Playground Backend Server
// Provides secure server-side OAuth flow implementations

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Environment variables endpoint (for frontend to load default credentials)
app.get('/api/env-config', (req, res) => {
  console.log('🔧 [Server] Environment config requested');
  
  const envConfig = {
    environmentId: process.env.PINGONE_ENVIRONMENT_ID || process.env.VITE_PINGONE_ENVIRONMENT_ID || '',
    clientId: process.env.PINGONE_CLIENT_ID || process.env.VITE_PINGONE_CLIENT_ID || '',
    clientSecret: process.env.PINGONE_CLIENT_SECRET || process.env.VITE_PINGONE_CLIENT_SECRET || '',
    redirectUri: process.env.PINGONE_REDIRECT_URI || process.env.VITE_PINGONE_REDIRECT_URI || 'https://localhost:3000/authz-callback',
    scopes: ['openid', 'profile', 'email'],
    apiUrl: process.env.PINGONE_API_URL || process.env.VITE_PINGONE_API_URL || 'https://auth.pingone.com'
  };
  
  console.log('📤 [Server] Sending environment config:', {
    hasEnvironmentId: !!envConfig.environmentId,
    hasClientId: !!envConfig.clientId,
    redirectUri: envConfig.redirectUri
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
    fullBody: req.body
  });

  try {
    const { 
      grant_type, 
      client_id, 
      client_secret, 
      redirect_uri, 
      code, 
      code_verifier,
      scope,
      environment_id
    } = req.body;

    // Validate required parameters
    if (!grant_type || !client_id || client_id.trim() === '') {
      console.error('❌ [Server] Missing required parameters:', {
        hasGrantType: !!grant_type,
        hasClientId: !!client_id,
        grantType: grant_type,
        clientId: client_id,
        clientIdLength: client_id?.length || 0
      });
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing required parameters: grant_type and client_id'
      });
    }

    // Get environment ID from client_id or request
    const environmentId = req.body.environment_id || process.env.PINGONE_ENVIRONMENT_ID;
    if (!environmentId) {
      console.error('❌ [Server] Missing environment_id:', {
        fromRequestBody: !!req.body.environment_id,
        fromEnv: !!process.env.PINGONE_ENVIRONMENT_ID,
        environmentId
      });
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing environment_id'
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
      redirectUri: redirect_uri
    });

    // Prepare request body
    const tokenRequestBody = new URLSearchParams({
      grant_type,
      client_id: client_id,
      redirect_uri: redirect_uri || '',
      code: code || '',
      code_verifier: code_verifier || '',
      scope: scope || 'openid profile email'
    });

    // Prepare headers
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    };

    // For confidential clients, use Basic Auth instead of client_secret in body
    if (client_secret && client_secret.trim() !== '') {
      const credentials = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
      console.log('🔐 [Server] Using Basic Auth for confidential client:', {
        clientId: client_id?.substring(0, 8) + '...',
        clientSecretLength: client_secret?.length || 0,
        hasClientSecret: !!client_secret,
        basicAuthHeader: `Basic ${credentials.substring(0, 20)}...`
      });
      // Don't add client_secret to body when using Basic Auth
    } else {
      // For public clients, client_id is already in the body
      console.log('🔓 [Server] Using public client authentication:', {
        clientId: client_id?.substring(0, 8) + '...',
        hasClientSecret: !!client_secret,
        clientSecretLength: client_secret?.length || 0
      });
    }

    console.log('🌐 [Server] Making request to PingOne token endpoint:', {
      url: tokenEndpoint,
      method: 'POST',
      headers: {
        'Content-Type': headers['Content-Type'],
        'Accept': headers['Accept'],
        'Authorization': headers['Authorization'] ? 'Basic [REDACTED]' : 'None'
      },
      body: tokenRequestBody.toString()
    });

    // Make request to PingOne
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers,
      body: tokenRequestBody
    });

    console.log('📥 [Server] PingOne token response:', {
      status: tokenResponse.status,
      statusText: tokenResponse.statusText,
      ok: tokenResponse.ok,
      headers: Object.fromEntries(tokenResponse.headers.entries())
    });

    const responseData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('❌ [Server] PingOne token exchange error:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        responseData,
        requestBody: tokenRequestBody.toString()
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
      clientId: client_id?.substring(0, 8) + '...'
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
      error
    });
    res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error during token exchange'
    });
  }
});

// Client Credentials Flow Endpoint
app.post('/api/client-credentials', async (req, res) => {
  try {
    const { client_id, client_secret, environment_id, scope } = req.body;

    if (!client_id || !client_secret || !environment_id) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing required parameters: client_id, client_secret, environment_id'
      });
    }

    const tokenEndpoint = `https://auth.pingone.com/${environment_id}/as/token`;
    const credentials = Buffer.from(`${client_id}:${client_secret}`).toString('base64');

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: scope || 'api:read'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[Client Credentials] PingOne error:`, data);
      return res.status(response.status).json(data);
    }

    console.log(`[Client Credentials] Success for client: ${client_id}`);
    
    data.server_timestamp = new Date().toISOString();
    data.grant_type = 'client_credentials';

    res.json(data);

  } catch (error) {
    console.error('[Client Credentials] Server error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error during client credentials flow'
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
        error_description: 'Missing required parameters: access_token, environment_id'
      });
    }

    const userInfoEndpoint = `https://auth.pingone.com/${environment_id}/as/userinfo`;

    const response = await fetch(userInfoEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Accept': 'application/json'
      }
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
      error_description: 'Internal server error during userinfo request'
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
        error_description: 'Missing required parameters: access_token, environment_id'
      });
    }

    // Use UserInfo endpoint to validate token
    const userInfoEndpoint = `https://auth.pingone.com/${environment_id}/as/userinfo`;

    const response = await fetch(userInfoEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const userInfo = await response.json();
      res.json({
        valid: true,
        user_info: userInfo,
        server_timestamp: new Date().toISOString()
      });
    } else {
      const errorData = await response.json();
      res.json({
        valid: false,
        error: errorData,
        server_timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('[Token Validation] Server error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error during token validation'
    });
  }
});

// Device Authorization Endpoint (proxy to PingOne)
app.post('/api/device-authorization', async (req, res) => {
  try {
    const { environment_id, client_id, scope, audience, acr_values, prompt, max_age, ui_locales, claims, app_identifier } = req.body;

    if (!environment_id || !client_id) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing required parameters: environment_id, client_id'
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
        'Accept': 'application/json'
      },
      body: formData
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
      error_description: 'Internal server error during device authorization'
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
        error_description: 'Missing required parameters: environment_id, client_id'
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
      'Accept': 'application/json'
    };

    // Add client authentication if secret provided
    if (client_secret) {
      const credentials = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    }

    const response = await fetch(parEndpoint, {
      method: 'POST',
      headers,
      body: formData
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
      error_description: 'Internal server error during PAR request'
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
        error_description: 'Missing required parameter: environment_id'
      });
    }

    const jwksUri = `https://auth.pingone.com/${environment_id}/as/jwks`;

    console.log(`[JWKS] Fetching JWKS for environment: ${environment_id}`);

    const response = await fetch(jwksUri, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'OAuth-Playground/1.0'
      }
    });

    if (!response.ok) {
      console.error(`[JWKS] PingOne error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({
        error: 'jwks_fetch_failed',
        error_description: `Failed to fetch JWKS: ${response.status} ${response.statusText}`
      });
    }

    const jwks = await response.json();

    console.log(`[JWKS] Success for environment: ${environment_id}`);

    res.json({
      ...jwks,
      server_timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[JWKS] Server error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error during JWKS fetch'
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
        error_description: 'Missing required parameter: environment_id'
      });
    }

    // Determine the base URL based on region
    const regionMap = {
      'us': 'https://auth.pingone.com',
      'eu': 'https://auth.pingone.eu',
      'ca': 'https://auth.pingone.ca',
      'ap': 'https://auth.pingone.asia'
    };

    const baseUrl = regionMap[region.toLowerCase()] || regionMap['us'];
    const discoveryUrl = `${baseUrl}/${environment_id}/.well-known/openid_configuration`;

    console.log(`[Discovery] Fetching configuration from: ${discoveryUrl}`);

    const response = await fetch(discoveryUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PingOne-OAuth-Playground/1.0'
      }
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
        response_types_supported: ['code', 'id_token', 'token', 'id_token token', 'code id_token', 'code token', 'code id_token token'],
        grant_types_supported: ['authorization_code', 'implicit', 'client_credentials', 'refresh_token', 'urn:ietf:params:oauth:grant-type:device_code'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256', 'RS384', 'RS512'],
        token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'private_key_jwt', 'client_secret_jwt'],
        claims_supported: ['sub', 'iss', 'aud', 'exp', 'iat', 'auth_time', 'nonce', 'acr', 'amr', 'azp', 'at_hash', 'c_hash'],
        code_challenge_methods_supported: ['S256', 'plain'],
        request_parameter_supported: true,
        request_uri_parameter_supported: true,
        require_request_uri_registration: false,
        end_session_endpoint: `https://auth.pingone.com/${environment_id}/as/signoff`,
        revocation_endpoint: `https://auth.pingone.com/${environment_id}/as/revoke`,
        introspection_endpoint: `https://auth.pingone.com/${environment_id}/as/introspect`,
        device_authorization_endpoint: `https://auth.pingone.com/${environment_id}/as/device`,
        pushed_authorization_request_endpoint: `https://auth.pingone.com/${environment_id}/as/par`
      };

      console.log(`[Discovery] Using fallback configuration for environment: ${environment_id}`);
      
      return res.json({
        success: true,
        configuration: fallbackConfig,
        environmentId: environment_id,
        server_timestamp: new Date().toISOString(),
        fallback: true
      });
    }

    const configuration = await response.json();

    // Validate required fields
    if (!configuration.issuer || !configuration.authorization_endpoint || !configuration.token_endpoint) {
      throw new Error('Invalid OpenID configuration: missing required fields');
    }

    console.log(`[Discovery] Success for environment: ${environment_id}`);

    res.json({
      success: true,
      configuration,
      environmentId: environment_id,
      server_timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Discovery] Server error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error during discovery',
      details: error.message
    });
  }
});

// API endpoint not found handler
app.use('/api', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware
app.use((error, req, res) => {
  console.error('[Server] Unhandled error:', error);
  res.status(500).json({
    error: 'server_error',
    error_description: 'Internal server error'
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 OAuth Playground Backend Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Token exchange: http://localhost:${PORT}/api/token-exchange`);
  console.log(`👤 UserInfo: http://localhost:${PORT}/api/userinfo`);
  console.log(`✅ Token validation: http://localhost:${PORT}/api/validate-token`);
});

// Add error handling
server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

server.on('listening', () => {
  const addr = server.address();
  console.log(`🌐 Server listening on:`, addr);
});

export default app;
