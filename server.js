import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Helper function to create JWT assertion for client authentication
function createJWTAssertion(clientId, clientSecret, tokenEndpoint, algorithm = 'HS256') {
  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    iss: clientId,           // issuer (client_id)
    sub: clientId,           // subject (client_id)
    aud: tokenEndpoint,      // audience (token endpoint)
    jti: `jwt-${now}-${Math.random().toString(36).substr(2, 9)}`, // JWT ID
    exp: now + 300,          // expires in 5 minutes
    iat: now                 // issued at
  };

  const options = {
    algorithm: algorithm
  };

  return jwt.sign(payload, clientSecret, options);
}

// Helper function to create JWT assertion with private key
function createPrivateKeyJWTAssertion(clientId, privateKey, tokenEndpoint, algorithm = 'RS256') {
  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    iss: clientId,           // issuer (client_id)
    sub: clientId,           // subject (client_id)
    aud: tokenEndpoint,      // audience (token endpoint)
    jti: `jwt-${now}-${Math.random().toString(36).substr(2, 9)}`, // JWT ID
    exp: now + 300,          // expires in 5 minutes
    iat: now                 // issued at
  };

  const options = {
    algorithm: algorithm
  };

  return jwt.sign(payload, privateKey, options);
}

// Middleware
app.use(cors({
  origin: ['https://localhost:3000', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Token exchange endpoint
app.post('/api/token-exchange', async (req, res) => {
  try {
    console.log('🔄 [Backend] Token exchange request received');
    console.log('🔄 [Backend] Request body:', req.body);
    console.log('🔍 [Backend] Request URL:', req.url);
    console.log('🔍 [Backend] Request headers:', req.headers);

    const { code, redirect_uri, code_verifier, grant_type, config } = req.body;

    // Handle different grant types
    if (grant_type === 'client_credentials') {
      return await handleClientCredentialsFlow(req, res, config);
    } else if (grant_type === 'authorization_code') {
      return await handleAuthorizationCodeFlow(req, res, code, redirect_uri, code_verifier, config);
    } else {
      return res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: 'Unsupported grant type. Supported types: authorization_code, client_credentials'
      });
    }
  } catch (error) {
    console.error('❌ [Backend] Token exchange error:', error);
    console.error('❌ [Backend] Request URL that caused error:', req.url);
    console.error('❌ [Backend] Request body that caused error:', req.body);
    res.status(500).json({
      error: 'server_error',
      error_description: error.message
    });
  }
});

// Handle Client Credentials flow
async function handleClientCredentialsFlow(req, res, config) {
  try {
    console.log('🔄 [Backend] Handling Client Credentials flow');

    // Get configuration from environment variables or frontend config
    const backendConfig = {
      environmentId: process.env.PINGONE_ENVIRONMENT_ID,
      clientId: process.env.PINGONE_CLIENT_ID,
      clientSecret: process.env.PINGONE_CLIENT_SECRET,
      apiUrl: process.env.PINGONE_API_URL || 'https://auth.pingone.com'
    };

    // Use frontend config if provided, otherwise fall back to environment variables
    const frontendConfig = config || {};
    const finalConfig = {
      environmentId: frontendConfig.environmentId || backendConfig.environmentId,
      clientId: frontendConfig.clientId || backendConfig.clientId,
      clientSecret: frontendConfig.clientSecret || backendConfig.clientSecret,
      apiUrl: backendConfig.apiUrl,
      authenticationMethod: frontendConfig.authenticationMethod || 'client_secret_basic',
      applicationType: frontendConfig.applicationType || 'backend'
    };

    if (!finalConfig.environmentId || !finalConfig.clientId || !finalConfig.clientSecret) {
      console.error('❌ [Backend] Missing PingOne configuration for Client Credentials');
      return res.status(500).json({
        error: 'server_error',
        error_description: 'Server configuration error: Missing environment ID, client ID, or client secret'
      });
    }

    const tokenEndpoint = `${finalConfig.apiUrl}/${finalConfig.environmentId}/as/token`;

    // Prepare token request for Client Credentials
    const tokenParams = new URLSearchParams({
      grant_type: 'client_credentials'
    });

    console.log('🔄 [Backend] Token endpoint:', tokenEndpoint);
    console.log('🔄 [Backend] Token params:', tokenParams.toString());
    console.log('🔄 [Backend] Authentication method:', finalConfig.authenticationMethod);
    console.log('🔄 [Backend] Application type:', finalConfig.applicationType);

    // Prepare headers based on authentication method
    let headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    // Add authentication based on configuration
    if (finalConfig.authenticationMethod === 'client_secret_basic') {
      const credentials = `${finalConfig.clientId}:${finalConfig.clientSecret}`;
      const basicAuth = Buffer.from(credentials).toString('base64');
      headers['Authorization'] = `Basic ${basicAuth}`;
      console.log('🔄 [Backend] Using Client Secret Basic authentication');
    } else if (finalConfig.authenticationMethod === 'client_secret_post') {
      tokenParams.append('client_id', finalConfig.clientId);
      tokenParams.append('client_secret', finalConfig.clientSecret);
      console.log('🔄 [Backend] Using Client Secret Post authentication');
    } else if (finalConfig.authenticationMethod === 'client_secret_jwt') {
      try {
        const jwtAssertion = createJWTAssertion(finalConfig.clientId, finalConfig.clientSecret, tokenEndpoint);
        tokenParams.append('client_assertion', jwtAssertion);
        tokenParams.append('client_assertion_type', 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
        console.log('🔄 [Backend] Using Client Secret JWT authentication');
      } catch (error) {
        console.error('❌ [Backend] Error creating JWT assertion:', error);
        return res.status(500).json({
          error: 'server_error',
          error_description: 'Failed to create JWT assertion'
        });
      }
    } else {
      // Default to client_secret_basic
      const credentials = `${finalConfig.clientId}:${finalConfig.clientSecret}`;
      const basicAuth = Buffer.from(credentials).toString('base64');
      headers['Authorization'] = `Basic ${basicAuth}`;
      console.log('🔄 [Backend] Using default Client Secret Basic authentication');
    }

    // Make token request to PingOne
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: headers,
      body: tokenParams.toString()
    });

    console.log('🔄 [Backend] PingOne response status:', response.status);
    console.log('🔄 [Backend] PingOne response headers:', Object.fromEntries(response.headers.entries()));

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ [Backend] Client Credentials token exchange failed:', responseData);
      return res.status(response.status).json(responseData);
    }

    console.log('✅ [Backend] Client Credentials token exchange successful');
    
    // Add expiration timestamps
    const now = Date.now();
    const tokens = {
      ...responseData,
      expires_at: responseData.expires_in ? now + responseData.expires_in * 1000 : undefined
    };

    res.json(tokens);

  } catch (error) {
    console.error('❌ [Backend] Client Credentials flow error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: error.message
    });
  }
}

// Handle Authorization Code flow
async function handleAuthorizationCodeFlow(req, res, code, redirect_uri, code_verifier, config) {
  try {
    console.log('🔄 [Backend] Handling Authorization Code flow');

    if (!code || !redirect_uri || !code_verifier) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing required parameters: code, redirect_uri, code_verifier'
      });
    }

    // Get configuration from environment variables or frontend config
    const backendConfig = {
      environmentId: process.env.PINGONE_ENVIRONMENT_ID,
      clientId: process.env.PINGONE_CLIENT_ID,
      clientSecret: process.env.PINGONE_CLIENT_SECRET,
      apiUrl: process.env.PINGONE_API_URL || 'https://auth.pingone.com'
    };

    // Use frontend config if provided, otherwise fall back to environment variables
    const frontendConfig = config || {};
    const finalConfig = {
      environmentId: frontendConfig.environmentId || backendConfig.environmentId,
      clientId: frontendConfig.clientId || backendConfig.clientId,
      clientSecret: frontendConfig.clientSecret || backendConfig.clientSecret,
      apiUrl: backendConfig.apiUrl,
      authenticationMethod: frontendConfig.authenticationMethod || 'client_secret_basic',
      usePKCE: frontendConfig.usePKCE !== undefined ? frontendConfig.usePKCE : true,
      applicationType: frontendConfig.applicationType || 'spa',
      // PAR settings
      requirePar: frontendConfig.requirePar || false,
      parTimeout: frontendConfig.parTimeout || 60
    };

    if (!finalConfig.environmentId || !finalConfig.clientId) {
      console.error('❌ [Backend] Missing PingOne configuration');
      return res.status(500).json({
        error: 'server_error',
        error_description: 'Server configuration error'
      });
    }

    const tokenEndpoint = `${finalConfig.apiUrl}/${finalConfig.environmentId}/as/token`;

    // Prepare token request
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirect_uri,
      code_verifier: code_verifier
    });

    console.log('🔄 [Backend] Token endpoint:', tokenEndpoint);
    console.log('🔄 [Backend] Token params:', tokenParams.toString());
    console.log('🔄 [Backend] Authentication method:', finalConfig.authenticationMethod);
    console.log('🔄 [Backend] Application type:', finalConfig.applicationType);
    console.log('🔄 [Backend] Use PKCE:', finalConfig.usePKCE);
    console.log('🔄 [Backend] Require PAR:', finalConfig.requirePar);
    console.log('🔄 [Backend] PAR Timeout:', finalConfig.parTimeout, 'seconds');

    // Prepare headers based on authentication method
    let headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    // Add authentication based on configuration
    // CRITICAL: For SPA applications with PKCE, PingOne requires:
    // - Token Endpoint Authentication Method = None
    // - No Authorization header
    // - client_id in request body (not headers)
    // - Content-Type: application/x-www-form-urlencoded
    if (!finalConfig.authenticationMethod || finalConfig.authenticationMethod === 'pkce') {
      // No authentication method specified (SPA with PKCE)
      // For SPA with PKCE, client_id goes in the body, no Authorization header
      tokenParams.append('client_id', finalConfig.clientId);
      console.log('🔄 [Backend] Using PKCE authentication (no client secret, client_id in body)');
    } else if (finalConfig.authenticationMethod === 'client_secret_basic' && finalConfig.clientSecret) {
      // Use Client Secret Basic authentication
      // WARNING: Do NOT use this for SPA applications with PKCE
      if (finalConfig.applicationType === 'spa' && finalConfig.usePKCE) {
        console.error('❌ [Backend] ERROR: Cannot use Client Secret Basic with SPA + PKCE. Use no authentication method instead.');
        throw new Error('Invalid configuration: SPA applications with PKCE must use no authentication method');
      }
      const credentials = `${finalConfig.clientId}:${finalConfig.clientSecret}`;
      const basicAuth = Buffer.from(credentials).toString('base64');
      headers['Authorization'] = `Basic ${basicAuth}`;
      console.log('🔄 [Backend] Using Client Secret Basic authentication');
    } else if (finalConfig.authenticationMethod === 'client_secret_post' && finalConfig.clientSecret) {
      // Use Client Secret Post authentication (add client_secret to body)
      // WARNING: Do NOT use this for SPA applications with PKCE
      if (finalConfig.applicationType === 'spa' && finalConfig.usePKCE) {
        console.error('❌ [Backend] ERROR: Cannot use Client Secret Post with SPA + PKCE. Use no authentication method instead.');
        throw new Error('Invalid configuration: SPA applications with PKCE must use no authentication method');
      }
      tokenParams.append('client_id', finalConfig.clientId);
      tokenParams.append('client_secret', finalConfig.clientSecret);
      console.log('🔄 [Backend] Using Client Secret Post authentication');
    } else if (finalConfig.authenticationMethod === 'client_secret_jwt' && finalConfig.clientSecret) {
      // Use Client Secret JWT authentication
      // WARNING: Do NOT use this for SPA applications with PKCE
      if (finalConfig.applicationType === 'spa' && finalConfig.usePKCE) {
        console.error('❌ [Backend] ERROR: Cannot use Client Secret JWT with SPA + PKCE. Use no authentication method instead.');
        throw new Error('Invalid configuration: SPA applications with PKCE must use no authentication method');
      }
      try {
        const jwtAssertion = createJWTAssertion(finalConfig.clientId, finalConfig.clientSecret, tokenEndpoint);
        tokenParams.append('client_assertion', jwtAssertion);
        tokenParams.append('client_assertion_type', 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
        console.log('🔄 [Backend] Using Client Secret JWT authentication');
      } catch (error) {
        console.error('❌ [Backend] Error creating JWT assertion:', error);
        return res.status(500).json({
          error: 'server_error',
          error_description: 'Failed to create JWT assertion'
        });
      }
    } else if (finalConfig.authenticationMethod === 'private_key_jwt') {
      // Use Private Key JWT authentication
      // WARNING: Do NOT use this for SPA applications with PKCE
      if (finalConfig.applicationType === 'spa' && finalConfig.usePKCE) {
        console.error('❌ [Backend] ERROR: Cannot use Private Key JWT with SPA + PKCE. Use no authentication method instead.');
        throw new Error('Invalid configuration: SPA applications with PKCE must use no authentication method');
      }
      // For now, we'll use the client secret as a fallback since we don't have private key management
      // In a real implementation, you'd load the private key from a secure location
      if (!finalConfig.clientSecret) {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'Private key or client secret required for Private Key JWT authentication'
        });
      }
      
      try {
        // Note: In a real implementation, you'd use an actual private key
        // For demo purposes, we're using the client secret as the signing key
        const jwtAssertion = createPrivateKeyJWTAssertion(finalConfig.clientId, finalConfig.clientSecret, tokenEndpoint, 'HS256');
        tokenParams.append('client_assertion', jwtAssertion);
        tokenParams.append('client_assertion_type', 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
        console.log('🔄 [Backend] Using Private Key JWT authentication (demo mode with client secret)');
      } catch (error) {
        console.error('❌ [Backend] Error creating JWT assertion:', error);
        return res.status(500).json({
          error: 'server_error',
          error_description: 'Failed to create JWT assertion'
        });
      }
    } else if (!finalConfig.authenticationMethod || finalConfig.authenticationMethod === 'none') {
      // Use PKCE (no client secret in header or body)
      console.log('🔄 [Backend] Using PKCE authentication (no client secret)');
    } else {
      // Fallback for unknown authentication methods
      console.log('🔄 [Backend] Unknown authentication method, using PKCE fallback');
    }

    // Make token request to PingOne
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: headers,
      body: tokenParams.toString()
    });

    console.log('🔄 [Backend] PingOne response status:', response.status);
    console.log('🔄 [Backend] PingOne response headers:', Object.fromEntries(response.headers.entries()));

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ [Backend] Token exchange failed:', responseData);
      return res.status(response.status).json(responseData);
    }

    console.log('✅ [Backend] Token exchange successful');
    
    // Add expiration timestamps
    const now = Date.now();
    const tokens = {
      ...responseData,
      expires_at: responseData.expires_in ? now + responseData.expires_in * 1000 : undefined,
      refresh_expires_at: responseData.refresh_token ? now + 5 * 24 * 60 * 60 * 1000 : undefined // 5 days
    };

    res.json(tokens);

  } catch (error) {
    console.error('❌ [Backend] Authorization Code flow error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: error.message
    });
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 [Backend] Server running on port ${PORT} (HTTP)`);
  console.log(`🔗 [Backend] Token exchange endpoint: http://localhost:${PORT}/api/token-exchange`);
  console.log(`💚 [Backend] Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔄 [Backend] Proxied through Vite at: https://localhost:3000/api/*`);
});
