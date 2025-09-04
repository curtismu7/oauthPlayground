import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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

    const { code, redirect_uri, code_verifier, config } = req.body;

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
      applicationType: frontendConfig.applicationType || 'spa'
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

    // Prepare headers based on authentication method
    let headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    // Add authentication header based on configuration
    if (finalConfig.authenticationMethod === 'client_secret_basic' && finalConfig.clientSecret) {
      // Use Client Secret Basic authentication
      const credentials = `${finalConfig.clientId}:${finalConfig.clientSecret}`;
      const basicAuth = Buffer.from(credentials).toString('base64');
      headers['Authorization'] = `Basic ${basicAuth}`;
      console.log('🔄 [Backend] Using Client Secret Basic authentication');
    } else {
      // Use PKCE (no client secret in header)
      console.log('🔄 [Backend] Using PKCE authentication (no client secret)');
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
    console.error('❌ [Backend] Token exchange error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 [Backend] Server running on port ${PORT}`);
  console.log(`🔗 [Backend] Token exchange endpoint: http://localhost:${PORT}/api/token-exchange`);
  console.log(`💚 [Backend] Health check: http://localhost:${PORT}/api/health`);
});
