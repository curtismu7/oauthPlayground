/**
 * Token Exchange Utility
 * 
 * Centralized token exchange functionality that uses effective configuration
 * from the config store and handles different authentication methods correctly.
 */

import { configStore, FlowType, EffectiveConfig, TokenAuthMethod } from './configStore';

export interface TokenExchangeParams {
  grant_type: 'authorization_code' | 'client_credentials' | 'refresh_token';
  code?: string;
  redirect_uri?: string;
  code_verifier?: string;
  refresh_token?: string;
  scope?: string;
}

export interface TokenExchangeResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
}

export interface TokenExchangeError {
  error: string;
  error_description?: string;
  error_uri?: string;
}

/**
 * Build authorization header for token endpoint authentication
 */
const buildAuthHeader = (config: EffectiveConfig): Record<string, string> => {
  const headers: Record<string, string> = {};

  switch (config.tokenAuthMethod) {
    case 'client_secret_basic':
      if (config.clientSecret) {
        const credentials = btoa(`${config.clientId}:${config.clientSecret}`);
        headers['Authorization'] = `Basic ${credentials}`;
      }
      break;
    
    case 'client_secret_post':
      // No authorization header needed, credentials go in body
      break;
    
    case 'private_key_jwt':
      // TODO: Implement JWT client assertion
      console.warn('🔐 [TOKEN-EXCHANGE] Private Key JWT authentication not yet implemented');
      break;
    
    case 'none':
    default:
      // No authorization header needed
      break;
  }

  return headers;
};

/**
 * Build request body for token endpoint
 */
const buildRequestBody = (
  config: EffectiveConfig,
  params: TokenExchangeParams
): URLSearchParams => {
  const body = new URLSearchParams();

  // Add grant type
  body.append('grant_type', params.grant_type);

  // Add grant-specific parameters
  if (params.code) body.append('code', params.code);
  if (params.redirect_uri) body.append('redirect_uri', params.redirect_uri);
  if (params.code_verifier) body.append('code_verifier', params.code_verifier);
  if (params.refresh_token) body.append('refresh_token', params.refresh_token);
  if (params.scope) body.append('scope', params.scope);

  // Add client credentials based on authentication method
  switch (config.tokenAuthMethod) {
    case 'client_secret_post':
      body.append('client_id', config.clientId);
      if (config.clientSecret) {
        body.append('client_secret', config.clientSecret);
      }
      break;
    
    case 'none':
      body.append('client_id', config.clientId);
      break;
    
    case 'client_secret_basic':
    case 'private_key_jwt':
      // Client credentials are in Authorization header or JWT assertion
      break;
  }

  return body;
};

/**
 * Exchange authorization code for tokens
 */
export const exchangeCodeForTokens = async (
  flowType: FlowType,
  params: Omit<TokenExchangeParams, 'grant_type'> & { code: string }
): Promise<TokenExchangeResponse> => {
  try {
    console.log(`🔄 [TOKEN-EXCHANGE] Starting code exchange for flow: ${flowType}`);
    
    // Get effective configuration
    const { config } = configStore.resolveConfig(flowType);
    
    console.log(`🔍 [TOKEN-EXCHANGE] Using effective config:`, {
      environmentId: config.environmentId,
      clientId: config.clientId,
      hasClientSecret: !!config.clientSecret,
      tokenAuthMethod: config.tokenAuthMethod,
      tokenEndpoint: config.tokenEndpoint
    });

    // Build request
    const tokenParams: TokenExchangeParams = {
      grant_type: 'authorization_code',
      ...params
    };

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...buildAuthHeader(config)
    };

    const body = buildRequestBody(config, tokenParams);

    console.log(`📤 [TOKEN-EXCHANGE] Request details:`, {
      url: config.tokenEndpoint,
      method: 'POST',
      headers: { ...headers, Authorization: headers.Authorization ? '[REDACTED]' : undefined },
      body: body.toString()
    });

    // Make request
    const response = await fetch(config.tokenEndpoint, {
      method: 'POST',
      headers,
      body
    });

    console.log(`📥 [TOKEN-EXCHANGE] Response status: ${response.status}`);

    if (!response.ok) {
      const errorData: TokenExchangeError = await response.json().catch(() => ({}));
      console.error(`❌ [TOKEN-EXCHANGE] Token exchange failed:`, errorData);
      
      const error = new Error(errorData.error_description || errorData.error || 'Token exchange failed');
      (error as any).pingoneError = errorData;
      (error as any).statusCode = response.status;
      throw error;
    }

    const tokenData: TokenExchangeResponse = await response.json();
    console.log(`✅ [TOKEN-EXCHANGE] Token exchange successful`);

    return tokenData;
  } catch (error) {
    console.error(`❌ [TOKEN-EXCHANGE] Error in code exchange:`, error);
    throw error;
  }
};

/**
 * Exchange client credentials for tokens
 */
export const exchangeClientCredentialsForTokens = async (
  flowType: FlowType,
  params: Omit<TokenExchangeParams, 'grant_type'> & { scope?: string }
): Promise<TokenExchangeResponse> => {
  try {
    console.log(`🔄 [TOKEN-EXCHANGE] Starting client credentials exchange for flow: ${flowType}`);
    
    // Get effective configuration
    const { config } = configStore.resolveConfig(flowType);
    
    console.log(`🔍 [TOKEN-EXCHANGE] Using effective config:`, {
      environmentId: config.environmentId,
      clientId: config.clientId,
      hasClientSecret: !!config.clientSecret,
      tokenAuthMethod: config.tokenAuthMethod,
      tokenEndpoint: config.tokenEndpoint
    });

    // Build request
    const tokenParams: TokenExchangeParams = {
      grant_type: 'client_credentials',
      ...params
    };

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...buildAuthHeader(config)
    };

    const body = buildRequestBody(config, tokenParams);

    console.log(`📤 [TOKEN-EXCHANGE] Request details:`, {
      url: config.tokenEndpoint,
      method: 'POST',
      headers: { ...headers, Authorization: headers.Authorization ? '[REDACTED]' : undefined },
      body: body.toString()
    });

    // Make request
    const response = await fetch(config.tokenEndpoint, {
      method: 'POST',
      headers,
      body
    });

    console.log(`📥 [TOKEN-EXCHANGE] Response status: ${response.status}`);

    if (!response.ok) {
      const errorData: TokenExchangeError = await response.json().catch(() => ({}));
      console.error(`❌ [TOKEN-EXCHANGE] Token exchange failed:`, errorData);
      
      const error = new Error(errorData.error_description || errorData.error || 'Token exchange failed');
      (error as any).pingoneError = errorData;
      (error as any).statusCode = response.status;
      throw error;
    }

    const tokenData: TokenExchangeResponse = await response.json();
    console.log(`✅ [TOKEN-EXCHANGE] Client credentials exchange successful`);

    return tokenData;
  } catch (error) {
    console.error(`❌ [TOKEN-EXCHANGE] Error in client credentials exchange:`, error);
    throw error;
  }
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (
  flowType: FlowType,
  params: Omit<TokenExchangeParams, 'grant_type'> & { refresh_token: string; scope?: string }
): Promise<TokenExchangeResponse> => {
  try {
    console.log(`🔄 [TOKEN-EXCHANGE] Starting token refresh for flow: ${flowType}`);
    
    // Get effective configuration
    const { config } = configStore.resolveConfig(flowType);
    
    console.log(`🔍 [TOKEN-EXCHANGE] Using effective config:`, {
      environmentId: config.environmentId,
      clientId: config.clientId,
      hasClientSecret: !!config.clientSecret,
      tokenAuthMethod: config.tokenAuthMethod,
      tokenEndpoint: config.tokenEndpoint
    });

    // Build request
    const tokenParams: TokenExchangeParams = {
      grant_type: 'refresh_token',
      ...params
    };

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...buildAuthHeader(config)
    };

    const body = buildRequestBody(config, tokenParams);

    console.log(`📤 [TOKEN-EXCHANGE] Request details:`, {
      url: config.tokenEndpoint,
      method: 'POST',
      headers: { ...headers, Authorization: headers.Authorization ? '[REDACTED]' : undefined },
      body: body.toString()
    });

    // Make request
    const response = await fetch(config.tokenEndpoint, {
      method: 'POST',
      headers,
      body
    });

    console.log(`📥 [TOKEN-EXCHANGE] Response status: ${response.status}`);

    if (!response.ok) {
      const errorData: TokenExchangeError = await response.json().catch(() => ({}));
      console.error(`❌ [TOKEN-EXCHANGE] Token refresh failed:`, errorData);
      
      const error = new Error(errorData.error_description || errorData.error || 'Token refresh failed');
      (error as any).pingoneError = errorData;
      (error as any).statusCode = response.status;
      throw error;
    }

    const tokenData: TokenExchangeResponse = await response.json();
    console.log(`✅ [TOKEN-EXCHANGE] Token refresh successful`);

    return tokenData;
  } catch (error) {
    console.error(`❌ [TOKEN-EXCHANGE] Error in token refresh:`, error);
    throw error;
  }
};

/**
 * Test connectivity to token endpoint
 */
export const testTokenEndpointConnectivity = async (
  flowType: FlowType
): Promise<{ success: boolean; message: string; details?: any }> => {
  try {
    console.log(`🧪 [TOKEN-EXCHANGE] Testing connectivity for flow: ${flowType}`);
    
    // Get effective configuration
    const { config } = configStore.resolveConfig(flowType);
    
    if (!config.environmentId || !config.clientId) {
      return {
        success: false,
        message: 'Missing required configuration (Environment ID or Client ID)'
      };
    }

    // Test with a minimal request (this will likely fail with 400, but that's expected)
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...buildAuthHeader(config)
    };

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.clientId,
      ...(config.tokenAuthMethod === 'client_secret_post' && config.clientSecret ? {
        client_secret: config.clientSecret
      } : {})
    });

    const response = await fetch(config.tokenEndpoint, {
      method: 'POST',
      headers,
      body
    });

    // Even if the request fails with 400/401, if we get a response, the endpoint is reachable
    if (response.status >= 200 && response.status < 500) {
      return {
        success: true,
        message: 'Token endpoint is reachable and responding',
        details: {
          status: response.status,
          statusText: response.statusText
        }
      };
    } else {
      return {
        success: false,
        message: `Token endpoint returned error: ${response.status} ${response.statusText}`,
        details: {
          status: response.status,
          statusText: response.statusText
        }
      };
    }
  } catch (error) {
    console.error(`❌ [TOKEN-EXCHANGE] Connectivity test failed:`, error);
    return {
      success: false,
      message: `Connectivity test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
};

export default {
  exchangeCodeForTokens,
  exchangeClientCredentialsForTokens,
  refreshAccessToken,
  testTokenEndpointConnectivity
};


