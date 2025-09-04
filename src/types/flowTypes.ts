// Flow type definitions to distinguish OAuth 2.0 vs OIDC flows

export type FlowProtocol = 'oauth2' | 'oidc';

export interface FlowType {
  id: string;
  name: string;
  protocol: FlowProtocol;
  description: string;
  path: string;
  deprecated?: boolean;
  securityLevel: 'high' | 'medium' | 'low';
}

// OAuth 2.0 Flows (RFC 6749)
export const OAUTH2_FLOWS: FlowType[] = [
  {
    id: 'authorization-code',
    name: 'Authorization Code Flow',
    protocol: 'oauth2',
    description: 'Standard OAuth 2.0 flow for server-side applications',
    path: '/flows/authorization-code',
    securityLevel: 'high'
  },
  {
    id: 'client-credentials',
    name: 'Client Credentials Flow',
    protocol: 'oauth2',
    description: 'Machine-to-machine OAuth 2.0 flow',
    path: '/flows/client-credentials',
    securityLevel: 'high'
  },
  {
    id: 'device-code',
    name: 'Device Code Flow',
    protocol: 'oauth2',
    description: 'OAuth 2.0 flow for input-constrained devices',
    path: '/flows/device-code',
    securityLevel: 'high'
  },
  {
    id: 'implicit-grant',
    name: 'Implicit Grant Flow',
    protocol: 'oauth2',
    description: 'Legacy OAuth 2.0 flow (deprecated in OAuth 2.1)',
    path: '/flows/implicit-grant',
    deprecated: true,
    securityLevel: 'low'
  }
];

// OpenID Connect Flows (OIDC)
export const OIDC_FLOWS: FlowType[] = [
  {
    id: 'oidc-authorization-code',
    name: 'OIDC Authorization Code Flow',
    protocol: 'oidc',
    description: 'OpenID Connect flow with ID tokens and user info',
    path: '/flows/oidc-authorization-code',
    securityLevel: 'high'
  },
  {
    id: 'oidc-implicit',
    name: 'OIDC Implicit Flow',
    protocol: 'oidc',
    description: 'Legacy OIDC flow (deprecated in OAuth 2.1)',
    path: '/flows/oidc-implicit',
    deprecated: true,
    securityLevel: 'low'
  },
  {
    id: 'hybrid-flow',
    name: 'OIDC Hybrid Flow',
    protocol: 'oidc',
    description: 'OIDC flow combining authorization code and implicit',
    path: '/flows/hybrid',
    securityLevel: 'high'
  },
  {
    id: 'userinfo',
    name: 'UserInfo Endpoint',
    protocol: 'oidc',
    description: 'OIDC endpoint for retrieving user profile information',
    path: '/flows/userinfo',
    securityLevel: 'high'
  },
  {
    id: 'id-tokens',
    name: 'ID Tokens',
    protocol: 'oidc',
    description: 'OIDC ID token inspection and validation',
    path: '/flows/id-tokens',
    securityLevel: 'high'
  }
];

// All flows combined
export const ALL_FLOWS: FlowType[] = [...OAUTH2_FLOWS, ...OIDC_FLOWS];

// Helper functions
export const getFlowByPath = (path: string): FlowType | undefined => {
  return ALL_FLOWS.find(flow => flow.path === path);
};

export const getFlowById = (id: string): FlowType | undefined => {
  return ALL_FLOWS.find(flow => flow.id === id);
};

export const isOAuth2Flow = (flow: FlowType): boolean => {
  return flow.protocol === 'oauth2';
};

export const isOIDCFlow = (flow: FlowType): boolean => {
  return flow.protocol === 'oidc';
};

export const isDeprecatedFlow = (flow: FlowType): boolean => {
  return flow.deprecated === true;
};
