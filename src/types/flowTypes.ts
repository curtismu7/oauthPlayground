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

// OpenID Connect Flows (OIDC)
export const OIDC_FLOWS: FlowType[] = [
  {
    id: 'authorization-code',
    name: 'Authorization Code Flow',
    protocol: 'oidc',
    description: 'OIDC Authorization Code Flow with ID tokens and user info',
    path: '/flows/authorization-code',
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

// All flows combined (OIDC only)
export const ALL_FLOWS: FlowType[] = [...OIDC_FLOWS];

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
