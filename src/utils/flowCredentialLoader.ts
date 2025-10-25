// src/utils/flowCredentialLoader.ts
// Flow-specific credential loading utility to prevent credential conflicts

export interface FlowCredentials {
  environmentId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  apiUrl?: string;
}

export interface FlowCredentialConfig {
  flowKey: string;
  fallbackToShared?: boolean;
}

/**
 * Loads flow-specific credentials with optional fallback to shared credentials
 * This prevents credential conflicts between different flows
 * Set fallbackToShared = false to use only flow-specific credentials
 */
export const loadFlowCredentials = (config: FlowCredentialConfig): FlowCredentials => {
  const { flowKey, fallbackToShared = false } = config;
  
  // Flow-specific environment variable prefixes
  const flowPrefix = getFlowPrefix(flowKey);
  
  // Load flow-specific credentials
  const flowCredentials: FlowCredentials = {
    environmentId: import.meta.env[`VITE_${flowPrefix}_ENVIRONMENT_ID`] || '',
    clientId: import.meta.env[`VITE_${flowPrefix}_CLIENT_ID`] || '',
    clientSecret: import.meta.env[`VITE_${flowPrefix}_CLIENT_SECRET`] || '',
    redirectUri: import.meta.env[`VITE_${flowPrefix}_REDIRECT_URI`] || '',
    apiUrl: import.meta.env[`VITE_${flowPrefix}_API_URL`] || '',
  };
  
  // If flow-specific credentials are not complete and fallback is enabled
  if (fallbackToShared && (!flowCredentials.environmentId || !flowCredentials.clientId)) {
    console.log(`🔄 [FlowCredentialLoader:${flowKey}] Flow-specific credentials incomplete, falling back to shared credentials`);
    
    // Fallback to shared credentials
    flowCredentials.environmentId = flowCredentials.environmentId || import.meta.env.VITE_PINGONE_ENVIRONMENT_ID || '';
    flowCredentials.clientId = flowCredentials.clientId || import.meta.env.VITE_PINGONE_CLIENT_ID || '';
    flowCredentials.clientSecret = flowCredentials.clientSecret || import.meta.env.VITE_PINGONE_CLIENT_SECRET || '';
    flowCredentials.redirectUri = flowCredentials.redirectUri || import.meta.env.VITE_PINGONE_REDIRECT_URI || getDefaultRedirectUri(flowKey);
    flowCredentials.apiUrl = flowCredentials.apiUrl || import.meta.env.VITE_PINGONE_API_URL || 'https://auth.pingone.com';
  }
  
  console.log(`🔐 [FlowCredentialLoader:${flowKey}] Loaded credentials:`, {
    flowKey,
    hasEnvironmentId: !!flowCredentials.environmentId,
    hasClientId: !!flowCredentials.clientId,
    hasClientSecret: !!flowCredentials.clientSecret,
    redirectUri: flowCredentials.redirectUri,
    isFlowSpecific: !fallbackToShared || (!!import.meta.env[`VITE_${flowPrefix}_ENVIRONMENT_ID`] && !!import.meta.env[`VITE_${flowPrefix}_CLIENT_ID`])
  });
  
  return flowCredentials;
};

/**
 * Gets the environment variable prefix for a flow key
 */
const getFlowPrefix = (flowKey: string): string => {
  const flowPrefixMap: Record<string, string> = {
    // PAR Flow
    'pingone-par-flow-v7': 'PAR',
    
    // OAuth Authorization Code Flows
    'oauth-authorization-code-v7': 'AUTHZ_V7',
    'oauth-authorization-code-v7-1': 'AUTHZ_V7_1',
    
    // OIDC Flows
    'oidc-hybrid-flow-v7': 'HYBRID_V7',
    'implicit-flow-v7': 'IMPLICIT_V7',
    
    // Device Authorization
    'device-authorization-v7': 'DEVICE_V7',
    
    // Client Credentials
    'client-credentials-v7': 'CLIENT_CREDS_V7',
    
    // CIBA Flow
    'ciba-v7': 'CIBA_V7',
    
    // Worker Token
    'worker-token-v7': 'WORKER_V7',
    
    // MFA Flow
    'pingone-complete-mfa-v7': 'MFA_V7',
    
    // RAR Flow
    'rar-v7': 'RAR_V7',
    
    // JWT Bearer Token
    'jwt-bearer-v7': 'JWT_BEARER_V7',
    
    // SAML Bearer Assertion
    'saml-bearer-v7': 'SAML_BEARER_V7',
    
    // Redirectless Flow
    'redirectless-v7': 'REDIRECTLESS_V7',
    
    // ROPC Flow
    'ropc-v7': 'ROPC_V7',
    
    // Token Exchange
    'token-exchange-v7': 'TOKEN_EXCHANGE_V7',
  };
  
  return flowPrefixMap[flowKey] || flowKey.toUpperCase().replace(/-/g, '_');
};

/**
 * Gets the default redirect URI for a flow
 */
const getDefaultRedirectUri = (flowKey: string): string => {
  const defaultRedirectUris: Record<string, string> = {
    // PAR Flow
    'pingone-par-flow-v7': 'https://localhost:3000/par-callback',
    
    // OAuth Authorization Code Flows
    'oauth-authorization-code-v7': 'https://localhost:3000/authz-callback',
    'oauth-authorization-code-v7-1': 'https://localhost:3000/authz-v7-1-callback',
    
    // OIDC Flows
    'oidc-hybrid-flow-v7': 'https://localhost:3000/hybrid-callback',
    'implicit-flow-v7': 'https://localhost:3000/implicit-callback',
    
    // Device Authorization
    'device-authorization-v7': 'https://localhost:3000/device-callback',
    
    // Client Credentials
    'client-credentials-v7': 'https://localhost:3000/client-creds-callback',
    
    // CIBA Flow
    'ciba-v7': 'https://localhost:3000/ciba-callback',
    
    // Worker Token
    'worker-token-v7': 'https://localhost:3000/worker-callback',
    
    // MFA Flow
    'pingone-complete-mfa-v7': 'https://localhost:3000/mfa-callback',
    
    // RAR Flow
    'rar-v7': 'https://localhost:3000/rar-callback',
    
    // JWT Bearer Token
    'jwt-bearer-v7': 'https://localhost:3000/jwt-bearer-callback',
    
    // SAML Bearer Assertion
    'saml-bearer-v7': 'https://localhost:3000/saml-bearer-callback',
    
    // Redirectless Flow
    'redirectless-v7': 'https://localhost:3000/redirectless-callback',
    
    // ROPC Flow
    'ropc-v7': 'https://localhost:3000/ropc-callback',
    
    // Token Exchange
    'token-exchange-v7': 'https://localhost:3000/token-exchange-callback',
  };
  
  return defaultRedirectUris[flowKey] || 'https://localhost:3000/authz-callback';
};

/**
 * Validates that flow credentials are complete
 */
export const validateFlowCredentials = (credentials: FlowCredentials): { isValid: boolean; missingFields: string[] } => {
  const missingFields: string[] = [];
  
  if (!credentials.environmentId) missingFields.push('environmentId');
  if (!credentials.clientId) missingFields.push('clientId');
  if (!credentials.clientSecret) missingFields.push('clientSecret');
  if (!credentials.redirectUri) missingFields.push('redirectUri');
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

/**
 * Gets credential source information for debugging
 */
export const getCredentialSource = (flowKey: string): { source: string; isFlowSpecific: boolean; hasFallback: boolean } => {
  const flowPrefix = getFlowPrefix(flowKey);
  const hasFlowSpecific = !!(import.meta.env[`VITE_${flowPrefix}_ENVIRONMENT_ID`] && import.meta.env[`VITE_${flowPrefix}_CLIENT_ID`]);
  const hasShared = !!(import.meta.env.VITE_PINGONE_ENVIRONMENT_ID && import.meta.env.VITE_PINGONE_CLIENT_ID);
  
  let source = 'none';
  if (hasFlowSpecific) {
    source = 'flow-specific';
  } else if (hasShared) {
    source = 'shared';
  }
  
  return {
    source,
    isFlowSpecific: hasFlowSpecific,
    hasFallback: hasShared
  };
};
