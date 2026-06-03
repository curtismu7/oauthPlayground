/**
 * Compliance rule definitions for OAuth 2.0 and OIDC
 */

export type Severity = 'error' | 'warn';

export interface ComplianceCheck {
  id: string;
  spec: string;
  section: string;
  severity: Severity;
  check: (input: Record<string, unknown>) => boolean;
  remediation: string;
  description: string;
}

export const complianceRules: Record<string, ComplianceCheck> = {
  RFC7636_VERIFIER_LENGTH: {
    id: 'RFC7636_VERIFIER_LENGTH',
    spec: 'RFC 7636',
    section: 'Section 4.1',
    severity: 'error',
    description: 'Code verifier must be between 43 and 128 characters',
    check: (input) => {
      const verifier = input.codeVerifier as string | undefined;
      if (!verifier) return true; // Not required to have verifier in all cases
      return verifier.length >= 43 && verifier.length <= 128;
    },
    remediation: 'Generate code verifier with 43-128 characters using unreserved characters [A-Z] [a-z] [0-9] - . _ ~',
  },

  RFC7636_CHALLENGE_S256_PREFERRED: {
    id: 'RFC7636_CHALLENGE_S256_PREFERRED',
    spec: 'RFC 7636',
    section: 'Section 4.2',
    severity: 'warn',
    description: 'S256 (SHA-256) code challenge method is preferred over plain',
    check: (input) => {
      const method = input.codeChallengeMethod as string | undefined;
      return method === 'S256' || !method; // S256 is best practice
    },
    remediation: 'Use code_challenge_method=S256 with SHA-256 hash of code verifier',
  },

  RFC6749_NO_WILDCARD_REDIRECT: {
    id: 'RFC6749_NO_WILDCARD_REDIRECT',
    spec: 'RFC 6749',
    section: 'Section 3.1.2.1',
    severity: 'error',
    description: 'Redirect URIs must not contain wildcards or port wildcards',
    check: (input) => {
      const uris = input.redirectUris as string[] | undefined;
      if (!uris || !Array.isArray(uris)) return true;
      return !uris.some((uri) => uri.includes('*'));
    },
    remediation: 'Remove wildcard characters from redirect URIs; explicitly list all allowed URIs',
  },

  RFC8252_LOCALHOST_REDIRECT: {
    id: 'RFC8252_LOCALHOST_REDIRECT',
    spec: 'RFC 8252',
    section: 'Section 7.1',
    severity: 'warn',
    description: 'Native apps should use localhost or loopback address for redirects',
    check: (input) => {
      const clientType = input.clientType as string | undefined;
      const uris = input.redirectUris as string[] | undefined;
      if (clientType !== 'native' || !uris) return true;
      return uris.some((uri) => uri.includes('localhost') || uri.includes('127.0.0.1'));
    },
    remediation: 'For native applications, use http://localhost:PORT or http://127.0.0.1:PORT for redirect URIs',
  },

  RFC9700_PKCE_REQUIRED_PUBLIC: {
    id: 'RFC9700_PKCE_REQUIRED_PUBLIC',
    spec: 'RFC 9700',
    section: 'Section 4.1',
    severity: 'error',
    description: 'PKCE is required for public clients (native, SPA)',
    check: (input) => {
      const clientType = input.clientType as string | undefined;
      const pkceEnabled = input.pkceEnabled as boolean | undefined;
      if (clientType === 'confidential') return true; // Not required for confidential clients
      if (clientType === 'native' || clientType === 'spa') {
        return pkceEnabled === true;
      }
      return true;
    },
    remediation: 'Enable PKCE for public clients by setting pkceEnabled=true and implementing code challenge flow',
  },

  RFC9700_NO_IMPLICIT: {
    id: 'RFC9700_NO_IMPLICIT',
    spec: 'RFC 9700',
    section: 'Section 2.1',
    severity: 'error',
    description: 'Implicit grant flow is deprecated; use authorization code with PKCE instead',
    check: (input) => {
      const grants = input.grantTypes as string[] | undefined;
      if (!grants) return true;
      return !grants.includes('implicit');
    },
    remediation: 'Remove implicit grant type; use authorization_code with PKCE for all flows',
  },

  TOKEN_EXP_TOO_LONG: {
    id: 'TOKEN_EXP_TOO_LONG',
    spec: 'OAuth 2.0 BCP',
    section: 'Token Lifetime',
    severity: 'warn',
    description: 'Token expiration lifetime should not exceed 1 hour for access tokens',
    check: (input) => {
      const tokenExp = input.tokenLifetimeSeconds as number | undefined;
      if (!tokenExp) return true;
      return tokenExp <= 3600; // 1 hour
    },
    remediation: 'Set token expiration to <= 3600 seconds (1 hour) for access tokens',
  },

  TOKEN_MISSING_AUD: {
    id: 'TOKEN_MISSING_AUD',
    spec: 'RFC 6749',
    section: 'Access Token Scope',
    severity: 'error',
    description: 'Access tokens should include aud (audience) claim',
    check: (input) => {
      const payload = input.payload as Record<string, unknown> | undefined;
      if (!payload) return true;
      return 'aud' in payload && payload.aud !== null && payload.aud !== undefined;
    },
    remediation: 'Configure token endpoint to include aud claim specifying resource server audience',
  },

  TOKEN_MISSING_SUB: {
    id: 'TOKEN_MISSING_SUB',
    spec: 'OIDC',
    section: 'ID Token Claims',
    severity: 'error',
    description: 'ID tokens must include sub (subject) claim',
    check: (input) => {
      const payload = input.payload as Record<string, unknown> | undefined;
      if (!payload) return true;
      return 'sub' in payload && payload.sub !== null && payload.sub !== undefined;
    },
    remediation: 'Configure OIDC provider to include sub claim in ID tokens',
  },

  OIDC_REQUIRED_FIELDS: {
    id: 'OIDC_REQUIRED_FIELDS',
    spec: 'OIDC Core',
    section: 'Section 3',
    severity: 'error',
    description: 'OIDC discovery should include required fields',
    check: (input) => {
      const discovery = input.discovery as Record<string, unknown> | undefined;
      if (!discovery) return true;
      const required = ['issuer', 'authorization_endpoint', 'token_endpoint', 'jwks_uri'];
      return required.every((field) => field in discovery && discovery[field] !== null);
    },
    remediation: 'Ensure OIDC discovery endpoint returns issuer, authorization_endpoint, token_endpoint, and jwks_uri',
  },

  RESPONSE_TYPE_CODE_PREFERRED: {
    id: 'RESPONSE_TYPE_CODE_PREFERRED',
    spec: 'RFC 9700',
    section: 'Section 2.1',
    severity: 'warn',
    description: 'response_type should be code for authorization code flow',
    check: (input) => {
      const responseTypes = input.responseTypes as string[] | undefined;
      if (!responseTypes) return true;
      return responseTypes.includes('code');
    },
    remediation: 'Use response_type=code for authorization code flow',
  },
};

export function getAllRules(): ComplianceCheck[] {
  return Object.values(complianceRules);
}

export function getRuleById(id: string): ComplianceCheck | undefined {
  return complianceRules[id];
}
