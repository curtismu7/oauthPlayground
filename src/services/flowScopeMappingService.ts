// src/services/flowScopeMappingService.ts
// Comprehensive scope mapping for all OAuth/OIDC flows

export interface FlowScopeMapping {
  flowType: string;
  flowName: string;
  requiresOpenId: boolean;
  defaultScopes: string[];
  description: string;
  category: 'oidc' | 'oauth2' | 'worker-token' | 'pingone-specific';
}

/**
 * Comprehensive mapping of flow types to their scope requirements
 * This is used to:
 * 1. Validate scopes before generating authorization URIs
 * 2. Display correct scopes in UI components
 * 3. Provide default scopes for flows
 */
export const FLOW_SCOPE_MAPPINGS: Record<string, FlowScopeMapping> = {
  // OIDC Authorization Flows - ALL require 'openid'
  'oidc-authorization-code': {
    flowType: 'oidc-authorization-code',
    flowName: 'OIDC Authorization Code',
    requiresOpenId: true,
    defaultScopes: ['openid', 'profile', 'email'],
    description: 'OpenID Connect Authorization Code Flow with ID tokens',
    category: 'oidc',
  },
  'authorization-code': {
    flowType: 'authorization-code',
    flowName: 'Authorization Code',
    requiresOpenId: true,
    defaultScopes: ['openid', 'profile', 'email'],
    description: 'OAuth 2.0 Authorization Code Flow (PingOne requires openid)',
    category: 'oidc',
  },
  'oauth': {
    flowType: 'oauth',
    flowName: 'OAuth 2.0',
    requiresOpenId: true,
    defaultScopes: ['openid', 'profile', 'email'],
    description: 'OAuth 2.0 flows (PingOne requires openid)',
    category: 'oidc',
  },
  'oidc': {
    flowType: 'oidc',
    flowName: 'OpenID Connect',
    requiresOpenId: true,
    defaultScopes: ['openid', 'profile', 'email'],
    description: 'OpenID Connect flows',
    category: 'oidc',
  },
  'implicit': {
    flowType: 'implicit',
    flowName: 'Implicit Flow',
    requiresOpenId: true,
    defaultScopes: ['openid', 'profile', 'email'],
    description: 'OIDC Implicit Flow',
    category: 'oidc',
  },
  'hybrid': {
    flowType: 'hybrid',
    flowName: 'Hybrid Flow',
    requiresOpenId: true,
    defaultScopes: ['openid', 'profile', 'email'],
    description: 'OIDC Hybrid Flow',
    category: 'oidc',
  },
  'device': {
    flowType: 'device',
    flowName: 'Device Authorization',
    requiresOpenId: true,
    defaultScopes: ['openid', 'profile', 'email'],
    description: 'OAuth 2.0 Device Authorization Grant (PingOne requires openid)',
    category: 'oidc',
  },
  'device-authorization': {
    flowType: 'device-authorization',
    flowName: 'Device Authorization',
    requiresOpenId: true,
    defaultScopes: ['openid', 'profile', 'email'],
    description: 'OAuth 2.0 Device Authorization Grant',
    category: 'oidc',
  },
  'ciba': {
    flowType: 'ciba',
    flowName: 'CIBA (Client-Initiated Backchannel Authentication)',
    requiresOpenId: true,
    defaultScopes: ['openid', 'profile'],
    description: 'CIBA flow requires openid scope',
    category: 'oidc',
  },
  'par': {
    flowType: 'par',
    flowName: 'Pushed Authorization Request (PAR)',
    requiresOpenId: true,
    defaultScopes: ['openid', 'profile', 'email'],
    description: 'PAR flow (PingOne requires openid)',
    category: 'oidc',
  },
  'rar': {
    flowType: 'rar',
    flowName: 'Rich Authorization Request (RAR)',
    requiresOpenId: true,
    defaultScopes: ['openid'],
    description: 'RAR flow (PingOne requires openid)',
    category: 'oidc',
  },
  'redirectless': {
    flowType: 'redirectless',
    flowName: 'Redirectless Flow',
    requiresOpenId: true,
    defaultScopes: ['openid', 'profile', 'email'],
    description: 'Redirectless authentication flow',
    category: 'oidc',
  },

  // Client Credentials - Does NOT require 'openid' (uses API scopes)
  'client-credentials': {
    flowType: 'client-credentials',
    flowName: 'Client Credentials',
    requiresOpenId: false,
    defaultScopes: ['api:read', 'api:write'],
    description: 'OAuth 2.0 Client Credentials Flow for service-to-service',
    category: 'oauth2',
  },
  'client_credentials': {
    flowType: 'client_credentials',
    flowName: 'Client Credentials',
    requiresOpenId: false,
    defaultScopes: ['api:read', 'api:write'],
    description: 'OAuth 2.0 Client Credentials Flow',
    category: 'oauth2',
  },

  // Worker Tokens - Does NOT require 'openid' (uses Management API scopes)
  'worker-token': {
    flowType: 'worker-token',
    flowName: 'Worker Token',
    requiresOpenId: false,
    defaultScopes: ['p1:read:users', 'p1:read:environments', 'p1:read:applications', 'p1:read:connections'],
    description: 'PingOne Worker Token (Management API scopes)',
    category: 'worker-token',
  },
  'pingone-mfa-workflow-library': {
    flowType: 'pingone-mfa-workflow-library',
    flowName: 'PingOne MFA Workflow Library',
    requiresOpenId: false,
    defaultScopes: ['p1:read:users', 'p1:read:environments', 'p1:read:applications', 'p1:read:connections'],
    description: 'PingOne MFA Workflow Library (uses worker token with Management API scopes)',
    category: 'worker-token',
  },
  'pingone-identity-metrics': {
    flowType: 'pingone-identity-metrics',
    flowName: 'PingOne Identity Metrics',
    requiresOpenId: false,
    defaultScopes: ['p1:read:users', 'p1:read:environments'],
    description: 'PingOne Identity Metrics (uses worker token with roles, not scopes)',
    category: 'worker-token',
  },
  'pingone-audit-activities': {
    flowType: 'pingone-audit-activities',
    flowName: 'PingOne Audit Activities',
    requiresOpenId: false,
    defaultScopes: ['p1:read:users', 'p1:read:environments'],
    description: 'PingOne Audit Activities (uses worker token)',
    category: 'worker-token',
  },
  'pingone-user-profile': {
    flowType: 'pingone-user-profile',
    flowName: 'PingOne User Profile',
    requiresOpenId: false,
    defaultScopes: ['p1:read:users', 'p1:read:environments'],
    description: 'PingOne User Profile Management (uses worker token)',
    category: 'worker-token',
  },

  // PingOne-specific flows that use Authorization Code with openid
  'pingone': {
    flowType: 'pingone',
    flowName: 'PingOne Flow',
    requiresOpenId: true,
    defaultScopes: ['openid', 'profile', 'email'],
    description: 'PingOne authentication flow',
    category: 'pingone-specific',
  },
  'pingone-par-v7': {
    flowType: 'pingone-par-v7',
    flowName: 'PingOne PAR V7',
    requiresOpenId: true,
    defaultScopes: ['openid', 'profile', 'email'],
    description: 'PingOne Pushed Authorization Request',
    category: 'pingone-specific',
  },

  // Default fallback
  'flow': {
    flowType: 'flow',
    flowName: 'Generic Flow',
    requiresOpenId: true,
    defaultScopes: ['openid', 'profile', 'email'],
    description: 'Generic OAuth/OIDC flow (defaults to requiring openid)',
    category: 'oidc',
  },
};

/**
 * Get scope mapping for a flow type
 */
export function getFlowScopeMapping(flowType: string): FlowScopeMapping {
  // Try exact match first
  if (FLOW_SCOPE_MAPPINGS[flowType]) {
    return FLOW_SCOPE_MAPPINGS[flowType];
  }

  // Try partial matches for flow types like 'pingone-mfa-workflow-library'
  const matchingKey = Object.keys(FLOW_SCOPE_MAPPINGS).find(key => 
    flowType.includes(key) || key.includes(flowType)
  );

  if (matchingKey) {
    return FLOW_SCOPE_MAPPINGS[matchingKey];
  }

  // Default to OIDC flow (requires openid)
  return FLOW_SCOPE_MAPPINGS['flow'];
}

/**
 * Get default scopes for a flow type as a string
 */
export function getDefaultScopesForFlow(flowType: string): string {
  const mapping = getFlowScopeMapping(flowType);
  return mapping.defaultScopes.join(' ');
}

/**
 * Get default scopes for a flow type as an array
 */
export function getDefaultScopesArrayForFlow(flowType: string): string[] {
  const mapping = getFlowScopeMapping(flowType);
  return [...mapping.defaultScopes];
}

/**
 * Check if a flow type requires 'openid' scope
 */
export function requiresOpenIdScope(flowType: string): boolean {
  const mapping = getFlowScopeMapping(flowType);
  return mapping.requiresOpenId;
}

/**
 * Validate scopes for a flow type
 * Returns errors if required scopes are missing
 */
export function validateScopesForFlow(flowType: string, scopes: string | string[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  normalizedScopes: string[];
} {
  const mapping = getFlowScopeMapping(flowType);
  const scopeArray = Array.isArray(scopes) ? scopes : scopes.split(/\s+/).filter(Boolean);
  const normalizedScopes = scopeArray.map(s => s.trim()).filter(Boolean);
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for required openid scope
  if (mapping.requiresOpenId && !normalizedScopes.includes('openid')) {
    errors.push(`Flow "${mapping.flowName}" requires "openid" scope`);
  }

  // Warn if openid is included but flow doesn't require it (worker tokens, client credentials)
  if (!mapping.requiresOpenId && normalizedScopes.includes('openid')) {
    warnings.push(`Flow "${mapping.flowName}" does not require "openid" scope. Worker tokens use Management API scopes (p1:read:*, p1:write:*).`);
  }

  // Warn if OIDC scopes (profile, email) are used in worker token flows
  if (mapping.category === 'worker-token') {
    const oidcScopes = ['profile', 'email', 'address', 'phone'];
    const foundOidcScopes = normalizedScopes.filter(s => oidcScopes.includes(s));
    if (foundOidcScopes.length > 0) {
      warnings.push(`Worker tokens should use Management API scopes, not OIDC scopes (${foundOidcScopes.join(', ')}).`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    normalizedScopes: mapping.requiresOpenId && !normalizedScopes.includes('openid')
      ? ['openid', ...normalizedScopes]
      : normalizedScopes,
  };
}


