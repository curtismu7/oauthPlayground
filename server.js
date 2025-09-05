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
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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

// OAuth Token Exchange Endpoint
app.post('/api/token-exchange', async (req, res) => {
  try {
    const { 
      grant_type, 
      client_id, 
      client_secret, 
      redirect_uri, 
      code, 
      code_verifier,
      scope 
    } = req.body;

    // Validate required parameters
    if (!grant_type || !client_id) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing required parameters: grant_type and client_id'
      });
    }

    // Get environment ID from client_id or request
    const environmentId = req.body.environment_id || process.env.PINGONE_ENVIRONMENT_ID;
    if (!environmentId) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing environment_id'
      });
    }

    // Build token endpoint URL
    const tokenEndpoint = `https://auth.pingone.com/${environmentId}/as/token`;

    // Prepare request body
    const tokenRequestBody = new URLSearchParams({
      grant_type,
      client_id,
      redirect_uri: redirect_uri || '',
      code: code || '',
      code_verifier: code_verifier || '',
      scope: scope || 'openid profile email'
    });

    // Add client_secret for confidential clients
    if (client_secret) {
      tokenRequestBody.append('client_secret', client_secret);
    }

    // Prepare headers
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    };

    // For client credentials flow, use Basic Auth
    if (grant_type === 'client_credentials' && client_secret) {
      const credentials = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
      // Remove client_secret from body for Basic Auth
      tokenRequestBody.delete('client_secret');
    }

    console.log(`[Token Exchange] ${grant_type} flow for client: ${client_id}`);
    console.log(`[Token Exchange] Token endpoint: ${tokenEndpoint}`);

    // Make request to PingOne
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers,
      body: tokenRequestBody
    });

    const responseData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error(`[Token Exchange] PingOne error:`, responseData);
      return res.status(tokenResponse.status).json(responseData);
    }

    console.log(`[Token Exchange] Success for client: ${client_id}`);
    
    // Add server-side metadata
    responseData.server_timestamp = new Date().toISOString();
    responseData.grant_type = grant_type;

    res.json(responseData);

  } catch (error) {
    console.error('[Token Exchange] Server error:', error);
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

// API endpoint not found handler
app.use('/api', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('[Server] Unhandled error:', error);
  res.status(500).json({
    error: 'server_error',
    error_description: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 OAuth Playground Backend Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Token exchange: http://localhost:${PORT}/api/token-exchange`);
  console.log(`👤 UserInfo: http://localhost:${PORT}/api/userinfo`);
  console.log(`✅ Token validation: http://localhost:${PORT}/api/validate-token`);
});

export default app;
