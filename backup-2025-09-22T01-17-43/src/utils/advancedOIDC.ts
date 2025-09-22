// src/utils/advancedOIDC.ts - Advanced OIDC features beyond Core 1.0

import { generateCodeVerifier } from './oauth';

/**
 * OIDC Discovery Document interface
 */
export interface OIDCDiscoveryDocument {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  jwks_uri: string;
  registration_endpoint?: string;
  scopes_supported: string[];
  response_types_supported: string[];
  response_modes_supported?: string[];
  grant_types_supported: string[];
  subject_types_supported: string[];
  id_token_signing_alg_values_supported: string[];
  token_endpoint_auth_methods_supported: string[];
  claims_supported: string[];
  code_challenge_methods_supported?: string[];
  introspection_endpoint?: string;
  revocation_endpoint?: string;
  end_session_endpoint?: string;
}

/**
 * Advanced OIDC Request Object support
 */
export interface RequestObject {
  iss: string;
  aud: string;
  response_type: string;
  client_id: string;
  redirect_uri: string;
  scope: string;
  state: string;
  nonce: string;
  max_age?: number;
  prompt?: string;
  login_hint?: string;
  acr_values?: string;
  claims?: Record<string, unknown>;
  iat: number;
  exp: number;
  jti: string;
}

/**
 * OIDC Claims Request structure
 */
export interface ClaimsRequest {
  userinfo?: {
    [claim: string]: {
      essential?: boolean;
      value?: string;
      values?: string[];
    };
  };
  id_token?: {
    [claim: string]: {
      essential?: boolean;
      value?: string;
      values?: string[];
    };
  };
}

/**
 * Fetch OIDC Discovery Document
 */
export const fetchOIDCDiscovery = async (issuer: string): Promise<OIDCDiscoveryDocument> => {
  const discoveryUrl = `${issuer.replace(/\/$/, '')}/.well-known/openid_configuration`;
  
  console.log('🔍 [AdvancedOIDC] Fetching discovery document:', discoveryUrl);
  
  try {
    const response = await fetch(discoveryUrl);
    if (!response.ok) {
      throw new Error(`Discovery failed: ${response.status} ${response.statusText}`);
    }
    
    const discovery = await response.json() as OIDCDiscoveryDocument;
    console.log('✅ [AdvancedOIDC] Discovery document retrieved:', discovery);
    
    return discovery;
  } catch (error) {
    console.error('❌ [AdvancedOIDC] Discovery failed:', error);
    throw new Error(`Failed to fetch OIDC discovery document: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Generate Request Object JWT for advanced OIDC flows
 */
export const createRequestObject = async (
  params: Partial<RequestObject>,
  clientSecret: string,
  algorithm: 'HS256' | 'RS256' = 'HS256'
): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);
  
  const requestObject: RequestObject = {
    iss: params.client_id || '',
    aud: params.aud || '',
    response_type: params.response_type || 'code',
    client_id: params.client_id || '',
    redirect_uri: params.redirect_uri || '',
    scope: params.scope || 'openid',
    state: params.state || generateCodeVerifier().substring(0, 32),
    nonce: params.nonce || generateCodeVerifier().substring(0, 32),
    iat: now,
    exp: now + 3600, // 1 hour expiration
    jti: generateCodeVerifier().substring(0, 16),
    ...params
  };

  try {
    if (algorithm === 'HS256') {
      const { SignJWT } = await import('jose');
      const secretKey = new TextEncoder().encode(clientSecret);
      
      return await new SignJWT(requestObject as any)
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secretKey);
    } else {
      // RS256 implementation would require private key
      throw new Error('RS256 Request Objects require private key implementation');
    }
  } catch (error) {
    throw new Error(`Failed to create Request Object: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Advanced Claims Request builder
 */
export const buildClaimsRequest = (
  userinfoClaimsConfig: Record<string, { essential?: boolean; value?: string }> = {},
  idTokenClaimsConfig: Record<string, { essential?: boolean; value?: string }> = {}
): ClaimsRequest => {
  const claimsRequest: ClaimsRequest = {};

  if (Object.keys(userinfoClaimsConfig).length > 0) {
    claimsRequest.userinfo = userinfoClaimsConfig;
  }

  if (Object.keys(idTokenClaimsConfig).length > 0) {
    claimsRequest.id_token = idTokenClaimsConfig;
  }

  return claimsRequest;
};

/**
 * OIDC Session Management utilities
 */
export const checkSessionStatus = async (
  checkSessionEndpoint: string,
  clientId: string,
  sessionState?: string
): Promise<'unchanged' | 'changed' | 'error'> => {
  try {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = `${checkSessionEndpoint}?client_id=${clientId}&session_state=${sessionState || ''}`;
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        document.body.removeChild(iframe);
        resolve('error');
      }, 5000);

      iframe.onload = () => {
        clearTimeout(timeout);
        // Session check logic would go here
        document.body.removeChild(iframe);
        resolve('unchanged');
      };

      document.body.appendChild(iframe);
    });
  } catch (error) {
    console.error('❌ [AdvancedOIDC] Session check failed:', error);
    return 'error';
  }
};

/**
 * OIDC Logout with session termination
 */
export const performOIDCLogout = async (
  endSessionEndpoint: string,
  idToken?: string,
  postLogoutRedirectUri?: string,
  state?: string
): Promise<void> => {
  const params = new URLSearchParams();
  
  if (idToken) {
    params.set('id_token_hint', idToken);
  }
  
  if (postLogoutRedirectUri) {
    params.set('post_logout_redirect_uri', postLogoutRedirectUri);
  }
  
  if (state) {
    params.set('state', state);
  }

  const logoutUrl = `${endSessionEndpoint}?${params.toString()}`;
  console.log('🚪 [AdvancedOIDC] Performing OIDC logout:', logoutUrl);
  
  window.location.href = logoutUrl;
};

/**
 * Advanced scope validation
 */
export const validateAdvancedScopes = (
  requestedScopes: string[],
  supportedScopes: string[],
  discovery: OIDCDiscoveryDocument
): {
  valid: string[];
  invalid: string[];
  recommendations: string[];
} => {
  const valid: string[] = [];
  const invalid: string[] = [];
  const recommendations: string[] = [];

  for (const scope of requestedScopes) {
    if (discovery.scopes_supported.includes(scope)) {
      valid.push(scope);
    } else {
      invalid.push(scope);
    }
  }

  // Recommendations
  if (!requestedScopes.includes('openid')) {
    recommendations.push('Add "openid" scope for OIDC compliance');
  }

  if (!requestedScopes.includes('profile') && discovery.scopes_supported.includes('profile')) {
    recommendations.push('Consider adding "profile" scope for user information');
  }

  if (!requestedScopes.includes('email') && discovery.scopes_supported.includes('email')) {
    recommendations.push('Consider adding "email" scope for user email');
  }

  return { valid, invalid, recommendations };
};

/**
 * Token introspection utility
 */
export const introspectToken = async (
  introspectionEndpoint: string,
  token: string,
  clientId: string,
  clientSecret: string
): Promise<{
  active: boolean;
  scope?: string;
  client_id?: string;
  username?: string;
  token_type?: string;
  exp?: number;
  iat?: number;
  nbf?: number;
  sub?: string;
  aud?: string;
  iss?: string;
  jti?: string;
}> => {
  const credentials = btoa(`${clientId}:${clientSecret}`);
  
  const response = await fetch(introspectionEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      token: token,
      token_type_hint: 'access_token'
    })
  });

  if (!response.ok) {
    throw new Error(`Token introspection failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

/**
 * Dynamic Client Registration (if supported)
 */
export const registerDynamicClient = async (
  registrationEndpoint: string,
  clientMetadata: {
    redirect_uris: string[];
    client_name: string;
    client_uri?: string;
    logo_uri?: string;
    scope?: string;
    contacts?: string[];
    tos_uri?: string;
    policy_uri?: string;
    token_endpoint_auth_method?: string;
    application_type?: 'web' | 'native';
  }
): Promise<{
  client_id: string;
  client_secret?: string;
  client_id_issued_at?: number;
  client_secret_expires_at?: number;
}> => {
  const response = await fetch(registrationEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(clientMetadata)
  });

  if (!response.ok) {
    throw new Error(`Dynamic client registration failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export default {
  fetchOIDCDiscovery,
  createRequestObject,
  buildClaimsRequest,
  checkSessionStatus,
  performOIDCLogout,
  validateAdvancedScopes,
  introspectToken,
  registerDynamicClient
};
