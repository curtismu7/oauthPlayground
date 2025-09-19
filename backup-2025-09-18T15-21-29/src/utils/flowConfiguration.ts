 
// src/utils/flowConfiguration.ts - Reusable flow configuration system

export interface FlowType {
  id: string;
  name: string;
  description: string;
  category: 'oidc' | 'oauth2';
  supportsPKCE: boolean;
  supportsUserInfo: boolean;
  supportsRefreshTokens: boolean;
  defaultScopes: string[];
  steps: string[]; // Step IDs in order
}

/**
 * OAuth Flow Type Definitions
 */
export const FLOW_TYPES: Record<string, FlowType> = {
  'oidc-authorization-code': {
    id: 'oidc-authorization-code',
    name: 'OIDC Authorization Code',
    description: 'OpenID Connect Authorization Code Flow with ID tokens and UserInfo',
    category: 'oidc',
    supportsPKCE: true,
    supportsUserInfo: true,
    supportsRefreshTokens: true,
    defaultScopes: ['openid', 'profile', 'email'],
    steps: ['setup-credentials', 'generate-pkce', 'build-auth-url', 'user-authorization', 'handle-callback', 'exchange-tokens', 'validate-tokens']
  },
  
  'oauth2-authorization-code': {
    id: 'oauth2-authorization-code',
    name: 'OAuth 2.0 Authorization Code',
    description: 'Pure OAuth 2.0 Authorization Code Flow (no OIDC features)',
    category: 'oauth2',
    supportsPKCE: true,
    supportsUserInfo: false,
    supportsRefreshTokens: true,
    defaultScopes: ['profile', 'email'],
    steps: ['setup-credentials', 'generate-pkce', 'build-auth-url', 'user-authorization', 'handle-callback', 'exchange-tokens']
  },
  
  'client-credentials': {
    id: 'client-credentials',
    name: 'Client Credentials',
    description: 'OAuth 2.0 Client Credentials Flow for service-to-service authentication',
    category: 'oauth2',
    supportsPKCE: false,
    supportsUserInfo: false,
    supportsRefreshTokens: false,
    defaultScopes: ['api:read', 'api:write'],
    steps: ['setup-credentials', 'get-client-token']
  },
  
  'device-code': {
    id: 'device-code',
    name: 'Device Code Flow',
    description: 'OAuth 2.0 Device Authorization Grant for devices without browsers',
    category: 'oauth2',
    supportsPKCE: false,
    supportsUserInfo: true,
    supportsRefreshTokens: true,
    defaultScopes: ['openid', 'profile'],
    steps: ['setup-credentials', 'initiate-device-flow', 'poll-for-tokens', 'validate-tokens']
  },
  
  'implicit': {
    id: 'implicit',
    name: 'Implicit Flow',
    description: 'OAuth 2.0 Implicit Grant (deprecated, for educational purposes)',
    category: 'oauth2',
    supportsPKCE: false,
    supportsUserInfo: true,
    supportsRefreshTokens: false,
    defaultScopes: ['profile', 'email'],
    steps: ['setup-credentials', 'build-auth-url', 'parse-token-fragment']
  },
  
  'hybrid': {
    id: 'hybrid',
    name: 'Hybrid Flow',
    description: 'OIDC Hybrid Flow combining authorization code and implicit flows',
    category: 'oidc',
    supportsPKCE: true,
    supportsUserInfo: true,
    supportsRefreshTokens: true,
    defaultScopes: ['openid', 'profile', 'email'],
    steps: ['setup-credentials', 'generate-pkce', 'build-auth-url', 'user-authorization', 'process-hybrid-response', 'validate-tokens']
  }
};

/**
 * Get flow configuration by ID
 */
export const getFlowConfig = (flowId: string): FlowType | null => {
  return FLOW_TYPES[flowId] || null;
};

/**
 * Get flows by category
 */
export const getFlowsByCategory = (category: 'oidc' | 'oauth2'): FlowType[] => {
  return Object.values(FLOW_TYPES).filter(flow => flow.category === category);
};

/**
 * Check if flow supports a feature
 */
export const flowSupports = (flowId: string, feature: 'pkce' | 'userinfo' | 'refresh'): boolean => {
  const flow = getFlowConfig(flowId);
  if (!flow) return false;
  
  switch (feature) {
    case 'pkce':
      return flow.supportsPKCE;
    case 'userinfo':
      return flow.supportsUserInfo;
    case 'refresh':
      return flow.supportsRefreshTokens;
    default:
      return false;
  }
};
