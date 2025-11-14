/**
 * AI Agent Service
 * Searches through app capabilities, documentation, and code to help users find information
 */

interface SearchResult {
  title: string;
  content: string;
  path: string;
  type: 'doc' | 'code' | 'flow' | 'feature' | 'api' | 'spec' | 'workflow' | 'guide';
  relevance: number;
  external?: boolean;
}

interface SearchOptions {
  includeApiDocs?: boolean;
  includeSpecs?: boolean;
  includeWorkflows?: boolean;
  includeUserGuide?: boolean;
}

interface CapabilityIndex {
  flows: Array<{
    name: string;
    description: string;
    path: string;
    keywords: string[];
  }>;
  features: Array<{
    name: string;
    description: string;
    path: string;
    keywords: string[];
  }>;
  docs: Array<{
    title: string;
    content: string;
    path: string;
    keywords: string[];
  }>;
  apiDocs: Array<{
    title: string;
    content: string;
    path: string;
    keywords: string[];
  }>;
  specs: Array<{
    title: string;
    content: string;
    path: string;
    keywords: string[];
  }>;
  workflows: Array<{
    title: string;
    content: string;
    path: string;
    keywords: string[];
  }>;
  userGuide: Array<{
    title: string;
    content: string;
    path: string;
    keywords: string[];
  }>;
}

class AIAgentService {
  private capabilityIndex: CapabilityIndex;

  constructor() {
    this.capabilityIndex = this.buildCapabilityIndex();
  }

  /**
   * Build searchable index of all app capabilities
   */
  private buildCapabilityIndex(): CapabilityIndex {
    return {
      flows: [
        {
          name: 'Authorization Code Flow',
          description: 'Complete OAuth 2.0 Authorization Code flow with PKCE support. Best for web and mobile apps.',
          path: '/flows/oauth-authorization-code-v7',
          keywords: ['authorization', 'code', 'pkce', 'oauth', 'web', 'mobile', 'redirect', 'secure']
        },
        {
          name: 'Client Credentials Flow',
          description: 'Machine-to-machine authentication for backend services and APIs.',
          path: '/flows/client-credentials-v7',
          keywords: ['client', 'credentials', 'm2m', 'machine', 'backend', 'api', 'service']
        },
        {
          name: 'Device Code Flow',
          description: 'OAuth flow for input-constrained devices like smart TVs, IoT devices, and printers.',
          path: '/flows/device-authorization-v7',
          keywords: ['device', 'tv', 'iot', 'printer', 'limited', 'input', 'constrained', 'rfc8628']
        },
        {
          name: 'Implicit Flow',
          description: 'Legacy OAuth flow for single-page applications (deprecated, use Authorization Code with PKCE instead).',
          path: '/flows/implicit-v7',
          keywords: ['implicit', 'spa', 'legacy', 'deprecated', 'browser', 'javascript']
        },
        {
          name: 'JWT Bearer Token Flow',
          description: 'Token exchange using JWT assertions for service-to-service authentication.',
          path: '/flows/jwt-bearer-token-v7',
          keywords: ['jwt', 'bearer', 'assertion', 'token', 'exchange', 'service']
        },
        {
          name: 'CIBA (Client Initiated Backchannel Authentication)',
          description: 'Decoupled authentication flow where authentication happens on a different device.',
          path: '/flows/ciba-v7',
          keywords: ['ciba', 'backchannel', 'decoupled', 'authentication', 'mobile', 'push']
        },
        {
          name: 'Hybrid Flow',
          description: 'Combination of Authorization Code and Implicit flows for advanced scenarios.',
          path: '/flows/oidc-hybrid-v7',
          keywords: ['hybrid', 'mixed', 'authorization', 'implicit', 'advanced']
        },
        {
          name: 'Resource Owner Password Credentials (ROPC)',
          description: 'Direct username/password authentication (use only when redirect flows are not possible).',
          path: '/flows/oauth-ropc-v7',
          keywords: ['password', 'ropc', 'username', 'credentials', 'direct', 'legacy']
        },
        {
          name: 'Token Introspection',
          description: 'Validate and inspect OAuth tokens to check their status and claims.',
          path: '/flows/token-introspection',
          keywords: ['introspection', 'validate', 'check', 'token', 'active', 'claims']
        },
        {
          name: 'Token Revocation',
          description: 'Revoke access or refresh tokens to invalidate them.',
          path: '/flows/token-revocation',
          keywords: ['revoke', 'invalidate', 'cancel', 'token', 'logout']
        },
        {
          name: 'UserInfo Endpoint',
          description: 'Retrieve user profile information using an access token.',
          path: '/flows/userinfo',
          keywords: ['userinfo', 'profile', 'claims', 'user', 'information', 'oidc']
        },
        {
          name: 'SAML Bearer Flow',
          description: 'Exchange SAML assertions for OAuth tokens.',
          path: '/flows/saml-bearer-assertion-v7',
          keywords: ['saml', 'assertion', 'bearer', 'exchange', 'sso']
        },
        {
          name: 'PAR (Pushed Authorization Request)',
          description: 'Enhanced security by pushing authorization parameters directly to the authorization server.',
          path: '/flows/pingone-par-v7',
          keywords: ['par', 'pushed', 'authorization', 'security', 'request', 'rfc9126']
        },
        {
          name: 'Worker Token Flow',
          description: 'PingOne-specific flow for obtaining worker application tokens.',
          path: '/flows/worker-token-v7',
          keywords: ['worker', 'pingone', 'application', 'management', 'api']
        },
        {
          name: 'Token Exchange Flow',
          description: 'Exchange one token type for another using OAuth 2.0 Token Exchange.',
          path: '/flows/token-exchange-v7',
          keywords: ['token', 'exchange', 'swap', 'convert', 'delegation']
        }
      ],
      features: [
        {
          name: 'Token Management',
          description: 'Manage, inspect, and analyze OAuth tokens including access tokens, refresh tokens, and ID tokens.',
          path: '/token-management',
          keywords: ['token', 'management', 'jwt', 'decode', 'inspect', 'claims', 'debug', 'access', 'refresh', 'id']
        },
        {
          name: 'Code Generator',
          description: 'Generate working code examples in multiple languages for OAuth flows.',
          path: '/oauth-code-generator',
          keywords: ['code', 'generator', 'examples', 'javascript', 'python', 'curl', 'sample']
        },
        {
          name: 'Application Generator',
          description: 'Generate complete OAuth application configurations for various platforms.',
          path: '/application-generator',
          keywords: ['application', 'generator', 'config', 'setup', 'create']
        },
        {
          name: 'Configuration',
          description: 'Configure your OAuth/OIDC settings, credentials, and environment.',
          path: '/configuration',
          keywords: ['configuration', 'settings', 'credentials', 'environment', 'setup']
        },
        {
          name: 'Credential Management',
          description: 'Manage and store OAuth credentials securely.',
          path: '/credential-management',
          keywords: ['credentials', 'management', 'client', 'secret', 'storage', 'security']
        },
        {
          name: 'PingOne Scopes Reference',
          description: 'Complete reference of available PingOne OAuth scopes and their permissions.',
          path: '/pingone-scopes-reference',
          keywords: ['scopes', 'pingone', 'permissions', 'reference', 'openid', 'profile', 'email']
        },
        {
          name: 'OAuth 2.1',
          description: 'Learn about OAuth 2.1 and the latest security best practices.',
          path: '/oauth-2-1',
          keywords: ['oauth', '2.1', 'security', 'best', 'practices', 'modern']
        },
        {
          name: 'Auto Discover',
          description: 'Automatically discover OAuth/OIDC endpoints from the issuer URL.',
          path: '/auto-discover',
          keywords: ['discovery', 'oidc', 'metadata', 'well-known', 'endpoints', 'automatic']
        },
        {
          name: 'Documentation',
          description: 'Browse complete documentation for OAuth, OIDC, and the playground features.',
          path: '/documentation',
          keywords: ['documentation', 'docs', 'help', 'guide', 'reference']
        },
        {
          name: 'OAuth 2.0 Security Best Practices',
          description: 'Security best practices for implementing OAuth 2.0.',
          path: '/docs/oauth2-security-best-practices',
          keywords: ['security', 'best', 'practices', 'oauth', 'safe', 'secure']
        },
        {
          name: 'Scopes Best Practices',
          description: 'Best practices for using and managing OAuth scopes.',
          path: '/docs/scopes-best-practices',
          keywords: ['scopes', 'best', 'practices', 'permissions', 'claims']
        },
        {
          name: 'OIDC Specifications',
          description: 'OpenID Connect specifications and standards reference.',
          path: '/docs/oidc-specs',
          keywords: ['oidc', 'openid', 'connect', 'specifications', 'standards', 'reference']
        }
      ],
      docs: [
        {
          title: 'Playground User Guide',
          content: 'Complete guide to using the OAuth Playground, including all features, flows, and best practices.',
          path: '/about',
          keywords: ['guide', 'user', 'playground', 'overview', 'getting', 'started', 'introduction', 'help', 'how', 'to', 'use']
        },
        {
          title: 'Documentation',
          content: 'Browse complete documentation for OAuth, OIDC, and all playground features.',
          path: '/documentation',
          keywords: ['documentation', 'docs', 'help', 'guide', 'reference', 'manual']
        },
        {
          title: 'OAuth 2.0 Security Best Practices',
          content: 'Learn security best practices for implementing OAuth 2.0 securely.',
          path: '/docs/oauth2-security-best-practices',
          keywords: ['security', 'best', 'practices', 'oauth', 'safe', 'secure', 'recommendations']
        },
        {
          title: 'Scopes Best Practices',
          content: 'Best practices for using and managing OAuth scopes effectively.',
          path: '/docs/scopes-best-practices',
          keywords: ['scopes', 'best', 'practices', 'permissions', 'claims', 'openid']
        },
        {
          title: 'OIDC Specifications',
          content: 'OpenID Connect specifications and standards reference documentation.',
          path: '/docs/oidc-specs',
          keywords: ['oidc', 'openid', 'connect', 'specifications', 'standards', 'reference']
        },
        {
          title: 'OAuth & OIDC for AI',
          content: 'Learn how OAuth and OpenID Connect apply to AI agents and systems.',
          path: '/docs/oauth-oidc-for-ai',
          keywords: ['ai', 'artificial', 'intelligence', 'agents', 'oauth', 'oidc']
        },
        {
          title: 'PingOne Scopes Reference',
          content: 'Complete reference of available PingOne OAuth scopes and their permissions.',
          path: '/pingone-scopes-reference',
          keywords: ['pingone', 'scopes', 'reference', 'permissions', 'claims']
        },
        {
          title: 'Configuration',
          content: 'Configure your OAuth/OIDC settings, credentials, and environment.',
          path: '/configuration',
          keywords: ['configuration', 'settings', 'setup', 'credentials', 'environment']
        }
      ],
      apiDocs: [
        {
          title: 'PingOne API Overview',
          content: 'Complete PingOne Platform API documentation including authentication, authorization, and management APIs.',
          path: 'https://apidocs.pingidentity.com/pingone/platform/v1/api/',
          keywords: ['api', 'pingone', 'platform', 'rest', 'endpoints', 'reference']
        },
        {
          title: 'PingOne Authentication API',
          content: 'Authentication and authorization endpoints for OAuth 2.0, OpenID Connect, and SAML flows.',
          path: 'https://apidocs.pingidentity.com/pingone/platform/v1/api/#authentication-apis',
          keywords: ['authentication', 'oauth', 'oidc', 'authorize', 'token', 'userinfo']
        },
        {
          title: 'PingOne Users API',
          content: 'Manage users, including creation, updates, password management, and user attributes.',
          path: 'https://apidocs.pingidentity.com/pingone/platform/v1/api/#users',
          keywords: ['users', 'user', 'management', 'create', 'update', 'password', 'profile']
        },
        {
          title: 'PingOne Applications API',
          content: 'Manage OAuth/OIDC applications, including client credentials, redirect URIs, and application settings.',
          path: 'https://apidocs.pingidentity.com/pingone/platform/v1/api/#applications',
          keywords: ['applications', 'app', 'client', 'oauth', 'oidc', 'redirect', 'uri']
        },
        {
          title: 'PingOne Environments API',
          content: 'Manage PingOne environments, including creation, configuration, and environment settings.',
          path: 'https://apidocs.pingidentity.com/pingone/platform/v1/api/#environments',
          keywords: ['environments', 'environment', 'tenant', 'organization', 'settings']
        },
        {
          title: 'PingOne Populations API',
          content: 'Manage user populations for organizing and segmenting users within an environment.',
          path: 'https://apidocs.pingidentity.com/pingone/platform/v1/api/#populations',
          keywords: ['populations', 'population', 'groups', 'segmentation', 'users']
        },
        {
          title: 'PingOne MFA API',
          content: 'Multi-factor authentication APIs for SMS, email, TOTP, and FIDO2 authentication methods.',
          path: 'https://apidocs.pingidentity.com/pingone/platform/v1/api/#mfa',
          keywords: ['mfa', 'multi-factor', '2fa', 'totp', 'sms', 'email', 'fido2', 'authentication']
        },
        {
          title: 'PingOne Credentials API',
          content: 'Manage digital credentials and verifiable credentials for decentralized identity.',
          path: 'https://apidocs.pingidentity.com/pingone/platform/v1/api/#credentials',
          keywords: ['credentials', 'digital', 'verifiable', 'wallet', 'identity']
        },
        {
          title: 'PingOne Risk API',
          content: 'Risk management and policy evaluation for adaptive authentication and fraud detection.',
          path: 'https://apidocs.pingidentity.com/pingone/platform/v1/api/#risk',
          keywords: ['risk', 'fraud', 'detection', 'policy', 'adaptive', 'security']
        },
        {
          title: 'PingOne Authorize API',
          content: 'Policy-based authorization and fine-grained access control APIs.',
          path: 'https://apidocs.pingidentity.com/pingone/platform/v1/api/#authorize',
          keywords: ['authorize', 'authorization', 'policy', 'access', 'control', 'permissions']
        },
        {
          title: 'PingOne Scopes',
          content: 'Complete reference of OAuth scopes available in PingOne for API access control.',
          path: 'https://apidocs.pingidentity.com/pingone/platform/v1/api/#scopes',
          keywords: ['scopes', 'scope', 'permissions', 'oauth', 'access', 'control']
        },
        {
          title: 'PingOne Error Codes',
          content: 'Reference guide for PingOne API error codes and troubleshooting.',
          path: 'https://apidocs.pingidentity.com/pingone/platform/v1/api/#errors',
          keywords: ['errors', 'error', 'codes', 'troubleshooting', 'debugging', 'issues']
        }
      ],
      specs: [
        {
          title: 'OAuth 2.0 Framework (RFC 6749)',
          content: 'The OAuth 2.0 authorization framework specification defining the core protocol.',
          path: 'https://datatracker.ietf.org/doc/html/rfc6749',
          keywords: ['oauth', '2.0', 'rfc', '6749', 'specification', 'standard', 'authorization']
        },
        {
          title: 'OAuth 2.1 (Draft)',
          content: 'OAuth 2.1 consolidates best practices and security recommendations into a single specification.',
          path: 'https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1',
          keywords: ['oauth', '2.1', 'draft', 'specification', 'modern', 'security']
        },
        {
          title: 'OpenID Connect Core 1.0',
          content: 'OpenID Connect 1.0 is a simple identity layer on top of the OAuth 2.0 protocol.',
          path: 'https://openid.net/specs/openid-connect-core-1_0.html',
          keywords: ['oidc', 'openid', 'connect', 'core', 'specification', 'authentication', 'identity']
        },
        {
          title: 'OpenID Connect Discovery',
          content: 'Defines how clients dynamically discover information about OpenID Providers.',
          path: 'https://openid.net/specs/openid-connect-discovery-1_0.html',
          keywords: ['oidc', 'discovery', 'metadata', 'well-known', 'configuration']
        },
        {
          title: 'PKCE (RFC 7636)',
          content: 'Proof Key for Code Exchange by OAuth Public Clients specification.',
          path: 'https://datatracker.ietf.org/doc/html/rfc7636',
          keywords: ['pkce', 'rfc', '7636', 'proof', 'key', 'code', 'exchange', 'security']
        },
        {
          title: 'JWT (RFC 7519)',
          content: 'JSON Web Token specification for representing claims securely.',
          path: 'https://datatracker.ietf.org/doc/html/rfc7519',
          keywords: ['jwt', 'json', 'web', 'token', 'rfc', '7519', 'claims']
        },
        {
          title: 'Device Authorization Grant (RFC 8628)',
          content: 'OAuth 2.0 Device Authorization Grant for browserless and input-constrained devices.',
          path: 'https://datatracker.ietf.org/doc/html/rfc8628',
          keywords: ['device', 'authorization', 'grant', 'rfc', '8628', 'tv', 'iot']
        },
        {
          title: 'Token Introspection (RFC 7662)',
          content: 'OAuth 2.0 Token Introspection specification for validating tokens.',
          path: 'https://datatracker.ietf.org/doc/html/rfc7662',
          keywords: ['token', 'introspection', 'rfc', '7662', 'validation', 'verify']
        },
        {
          title: 'Token Revocation (RFC 7009)',
          content: 'OAuth 2.0 Token Revocation specification for invalidating tokens.',
          path: 'https://datatracker.ietf.org/doc/html/rfc7009',
          keywords: ['token', 'revocation', 'rfc', '7009', 'invalidate', 'cancel']
        },
        {
          title: 'PAR - Pushed Authorization Requests (RFC 9126)',
          content: 'OAuth 2.0 Pushed Authorization Requests for enhanced security.',
          path: 'https://datatracker.ietf.org/doc/html/rfc9126',
          keywords: ['par', 'pushed', 'authorization', 'rfc', '9126', 'security']
        },
        {
          title: 'CIBA - Client Initiated Backchannel Authentication',
          content: 'OpenID Connect Client Initiated Backchannel Authentication Flow specification.',
          path: 'https://openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0.html',
          keywords: ['ciba', 'backchannel', 'authentication', 'decoupled', 'openid']
        },
        {
          title: 'OAuth 2.0 Security Best Current Practice',
          content: 'Security best practices and recommendations for OAuth 2.0.',
          path: 'https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics',
          keywords: ['oauth', 'security', 'best', 'practices', 'recommendations', 'bcp']
        }
      ],
      workflows: [
        {
          title: 'PingOne Workflow Library Overview',
          content: 'Complete guide to PingOne workflow library for common identity and access management scenarios.',
          path: 'https://apidocs.pingidentity.com/pingone/workflow-library/v1/api/',
          keywords: ['workflow', 'library', 'pingone', 'guide', 'scenarios', 'setup']
        },
        {
          title: 'MFA Sign-On Policy Workflow',
          content: 'Step-by-step workflow for assigning MFA sign-on policies to web applications in PingOne.',
          path: 'https://apidocs.pingidentity.com/pingone/workflow-library/v1/api/#post-step-7-assign-the-mfa-sign-on-policy-to-the-web-application',
          keywords: ['mfa', 'sign-on', 'policy', 'workflow', 'application', 'authentication']
        },
        {
          title: 'User Registration Workflow',
          content: 'Complete workflow for implementing user self-registration in PingOne.',
          path: 'https://apidocs.pingidentity.com/pingone/workflow-library/v1/api/#user-registration',
          keywords: ['user', 'registration', 'signup', 'workflow', 'self-service']
        },
        {
          title: 'Password Reset Workflow',
          content: 'Workflow for implementing self-service password reset functionality.',
          path: 'https://apidocs.pingidentity.com/pingone/workflow-library/v1/api/#password-reset',
          keywords: ['password', 'reset', 'recovery', 'workflow', 'self-service']
        },
        {
          title: 'Social Login Integration Workflow',
          content: 'Workflow for integrating social identity providers (Google, Facebook, etc.) with PingOne.',
          path: 'https://apidocs.pingidentity.com/pingone/workflow-library/v1/api/#social-login',
          keywords: ['social', 'login', 'identity', 'provider', 'google', 'facebook', 'workflow']
        },
        {
          title: 'OIDC Application Setup Workflow',
          content: 'Complete workflow for setting up an OpenID Connect application in PingOne.',
          path: 'https://apidocs.pingidentity.com/pingone/workflow-library/v1/api/#oidc-application-setup',
          keywords: ['oidc', 'application', 'setup', 'workflow', 'configuration']
        },
        {
          title: 'Risk-Based Authentication Workflow',
          content: 'Workflow for implementing risk-based authentication and adaptive policies.',
          path: 'https://apidocs.pingidentity.com/pingone/workflow-library/v1/api/#risk-based-authentication',
          keywords: ['risk', 'authentication', 'adaptive', 'policy', 'workflow', 'security']
        },
        {
          title: 'Device Management Workflow',
          content: 'Workflow for managing user devices and device authentication in PingOne.',
          path: 'https://apidocs.pingidentity.com/pingone/workflow-library/v1/api/#device-management',
          keywords: ['device', 'management', 'workflow', 'authentication', 'mobile']
        }
      ],
      userGuide: [
        {
          title: 'Playground User Guide - Complete Overview',
          content: 'Comprehensive guide covering all OAuth Playground features, flows, educational content, developer tools, and PingOne API best practices.',
          path: '/about',
          keywords: ['guide', 'user', 'help', 'how', 'to', 'use', 'playground', 'overview', 'getting', 'started', 'tutorial', 'learn']
        },
        {
          title: 'Interactive OAuth Flows Guide',
          content: 'Learn about all available OAuth flows including Authorization Code, Client Credentials, Device Code, JWT Bearer, RAR, CIBA, and more.',
          path: '/about',
          keywords: ['flows', 'oauth', 'authorization', 'code', 'client', 'credentials', 'device', 'jwt', 'bearer', 'ciba', 'rar']
        },
        {
          title: 'OpenID Connect Integration Guide',
          content: 'Complete guide to OIDC features including user authentication, ID token validation, user profile retrieval, and session management.',
          path: '/about',
          keywords: ['oidc', 'openid', 'connect', 'authentication', 'id', 'token', 'session', 'profile', 'user']
        },
        {
          title: 'Educational Features Guide',
          content: 'Step-by-step guides, visual flow diagrams, code examples, best practices, and multiple flow versions (V1-V7) for learning.',
          path: '/about',
          keywords: ['educational', 'learning', 'tutorial', 'guide', 'examples', 'diagrams', 'best', 'practices', 'versions']
        },
        {
          title: 'Developer Tools Guide',
          content: 'Token analysis tools including JWT decoder, token introspection, claims inspection, signature validation, and API testing capabilities.',
          path: '/about',
          keywords: ['developer', 'tools', 'jwt', 'decoder', 'token', 'introspection', 'claims', 'validation', 'api', 'testing']
        },
        {
          title: 'PingOne API Best Practices',
          content: 'Essential best practices for PingOne APIs including user lookup, filter syntax, password operations, content-type patterns, and common field names.',
          path: '/about',
          keywords: ['pingone', 'api', 'best', 'practices', 'user', 'lookup', 'filter', 'password', 'operations', 'content-type']
        },
        {
          title: 'User Lookup & Search Best Practices',
          content: 'Filter syntax rules, URL encoding, supported attributes, UUID validation, and fallback search mechanisms for PingOne user lookups.',
          path: '/about',
          keywords: ['user', 'lookup', 'search', 'filter', 'syntax', 'uuid', 'username', 'email', 'scim']
        },
        {
          title: 'Password Operations Guide',
          content: 'Critical content-type patterns for password operations: force change, unlock, check password, and set password with proper field names.',
          path: '/about',
          keywords: ['password', 'operations', 'force', 'change', 'unlock', 'check', 'set', 'reset', 'content-type']
        }
      ]
    };
  }

  /**
   * Search for relevant content based on user query
   */
  public search(query: string, options: SearchOptions = {}): SearchResult[] {
    const normalizedQuery = query.toLowerCase().trim();
    const results: SearchResult[] = [];
    const { includeApiDocs = false, includeSpecs = false, includeWorkflows = false, includeUserGuide = false } = options;

    // Search flows
    for (const flow of this.capabilityIndex.flows) {
      const relevance = this.calculateRelevance(normalizedQuery, flow.name, flow.description, flow.keywords);
      if (relevance > 0) {
        results.push({
          title: flow.name,
          content: flow.description,
          path: flow.path,
          type: 'flow',
          relevance,
          external: false
        });
      }
    }

    // Search features
    for (const feature of this.capabilityIndex.features) {
      const relevance = this.calculateRelevance(normalizedQuery, feature.name, feature.description, feature.keywords);
      if (relevance > 0) {
        results.push({
          title: feature.name,
          content: feature.description,
          path: feature.path,
          type: 'feature',
          relevance,
          external: false
        });
      }
    }

    // Search docs
    for (const doc of this.capabilityIndex.docs) {
      const relevance = this.calculateRelevance(normalizedQuery, doc.title, doc.content, doc.keywords);
      if (relevance > 0) {
        results.push({
          title: doc.title,
          content: doc.content,
          path: doc.path,
          type: 'doc',
          relevance,
          external: false
        });
      }
    }

    // Search API docs (if enabled)
    if (includeApiDocs) {
      for (const apiDoc of this.capabilityIndex.apiDocs) {
        const relevance = this.calculateRelevance(normalizedQuery, apiDoc.title, apiDoc.content, apiDoc.keywords);
        if (relevance > 0) {
          results.push({
            title: apiDoc.title,
            content: apiDoc.content,
            path: apiDoc.path,
            type: 'api',
            relevance,
            external: true
          });
        }
      }
    }

    // Search specifications (if enabled)
    if (includeSpecs) {
      for (const spec of this.capabilityIndex.specs) {
        const relevance = this.calculateRelevance(normalizedQuery, spec.title, spec.content, spec.keywords);
        if (relevance > 0) {
          results.push({
            title: spec.title,
            content: spec.content,
            path: spec.path,
            type: 'spec',
            relevance,
            external: true
          });
        }
      }
    }

    // Search workflows (if enabled)
    if (includeWorkflows) {
      for (const workflow of this.capabilityIndex.workflows) {
        const relevance = this.calculateRelevance(normalizedQuery, workflow.title, workflow.content, workflow.keywords);
        if (relevance > 0) {
          results.push({
            title: workflow.title,
            content: workflow.content,
            path: workflow.path,
            type: 'workflow',
            relevance,
            external: true
          });
        }
      }
    }

    // Search user guide (if enabled)
    if (includeUserGuide) {
      for (const guide of this.capabilityIndex.userGuide) {
        const relevance = this.calculateRelevance(normalizedQuery, guide.title, guide.content, guide.keywords);
        if (relevance > 0) {
          results.push({
            title: guide.title,
            content: guide.content,
            path: guide.path,
            type: 'guide',
            relevance,
            external: false
          });
        }
      }
    }

    // Sort by relevance (highest first)
    return results.sort((a, b) => b.relevance - a.relevance).slice(0, 10);
  }

  /**
   * Calculate relevance score for a search result
   */
  private calculateRelevance(query: string, title: string, description: string, keywords: string[]): number {
    let score = 0;
    const queryWords = query.split(/\s+/);

    // Exact title match (highest score)
    if (title.toLowerCase().includes(query)) {
      score += 100;
    }

    // Title word matches
    for (const word of queryWords) {
      if (title.toLowerCase().includes(word)) {
        score += 50;
      }
    }

    // Description matches
    if (description.toLowerCase().includes(query)) {
      score += 30;
    }

    for (const word of queryWords) {
      if (description.toLowerCase().includes(word)) {
        score += 10;
      }
    }

    // Keyword matches
    for (const keyword of keywords) {
      if (query.includes(keyword) || keyword.includes(query)) {
        score += 40;
      }
      for (const word of queryWords) {
        if (keyword.includes(word)) {
          score += 15;
        }
      }
    }

    return score;
  }

  /**
   * Get answer for common questions
   */
  public getAnswer(query: string, options: SearchOptions = {}): { answer: string; relatedLinks: SearchResult[] } {
    const normalizedQuery = query.toLowerCase();
    
    // Common question patterns
    const patterns = [
      {
        pattern: /how (do|can) i (configure|setup|set up) (authorization code|auth code)/i,
        answer: 'To configure the Authorization Code flow:\n\n1. Navigate to Flows → OAuth Authorization Code Flow\n2. Enter your PingOne credentials (Environment ID, Client ID, Client Secret)\n3. Configure your redirect URI (must match PingOne app configuration)\n4. Enable PKCE for enhanced security (recommended)\n5. Click "Start Flow" to begin\n\nThe flow will guide you through each step with explanations.',
        searchTerms: 'authorization code flow'
      },
      {
        pattern: /(what is|what's|explain) (the difference|difference) between oauth (and|&) oidc/i,
        answer: 'OAuth 2.0 and OpenID Connect (OIDC) serve different purposes:\n\n**OAuth 2.0** is for authorization - it lets apps access resources on behalf of a user without sharing passwords.\n\n**OpenID Connect** is for authentication - it\'s built on top of OAuth 2.0 and adds identity verification, providing information about who the user is.\n\nThink of it this way:\n- OAuth: "Can I access your photos?"\n- OIDC: "Who are you?" + "Can I access your photos?"\n\nOIDC adds an ID token (JWT) that contains user identity information.',
        searchTerms: 'oauth oidc difference'
      },
      {
        pattern: /how (do|can) i (test|try) (device|tv|iot)/i,
        answer: 'To test the Device Code flow:\n\n1. Navigate to Flows → Device Authorization Flow\n2. Select a device type (Smart TV, Printer, IoT device, etc.)\n3. Enter your PingOne credentials\n4. Click "Start Flow"\n5. The app will display a user code and verification URL\n6. Open the verification URL on another device (phone/computer)\n7. Enter the user code to complete authentication\n\nThis flow is perfect for devices with limited input capabilities.',
        searchTerms: 'device code flow'
      },
      {
        pattern: /(what is|explain) pkce/i,
        answer: 'PKCE (Proof Key for Code Exchange) is a security extension for OAuth 2.0:\n\n**Why it matters:** Prevents authorization code interception attacks, especially important for mobile and single-page apps.\n\n**How it works:**\n1. App generates a random "code verifier"\n2. Creates a "code challenge" (hash of the verifier)\n3. Sends challenge with authorization request\n4. Sends verifier with token request\n5. Server verifies they match\n\n**When to use:** Always use PKCE for public clients (mobile apps, SPAs). It\'s now recommended for all OAuth flows.',
        searchTerms: 'pkce security'
      },
      {
        pattern: /how (do|can) i (decode|inspect|view) (a |)token/i,
        answer: 'To inspect JWT tokens:\n\n1. Go to Token Management page (from the main menu)\n2. Paste your JWT token (access token or ID token)\n3. The inspector will show:\n   - Header (algorithm, token type)\n   - Payload (claims, expiration, issuer)\n   - Signature verification status\n\nYou can also inspect tokens directly in flow result pages - they\'re automatically decoded and displayed with color-coded sections.',
        searchTerms: 'token management'
      },
      {
        pattern: /(what|which) flow should i use/i,
        answer: 'Choose your OAuth flow based on your application type:\n\n**Web Applications:** Authorization Code Flow with PKCE\n**Mobile Apps:** Authorization Code Flow with PKCE\n**Single Page Apps (SPA):** Authorization Code Flow with PKCE\n**Backend Services (M2M):** Client Credentials Flow\n**IoT/Smart Devices:** Device Code Flow\n**Legacy SPAs:** Implicit Flow (deprecated, migrate to Auth Code + PKCE)\n\nFor most modern applications, Authorization Code Flow with PKCE is the recommended choice.',
        searchTerms: 'flow comparison'
      },
      {
        pattern: /redirect uri (error|mismatch|invalid)/i,
        answer: 'Redirect URI errors occur when the URI in your request doesn\'t match PingOne configuration:\n\n**To fix:**\n1. Check your PingOne application settings\n2. Ensure the redirect URI exactly matches (including protocol, domain, port, path)\n3. Common issues:\n   - http vs https\n   - localhost vs 127.0.0.1\n   - Missing or extra trailing slash\n   - Port number mismatch\n\n**In the playground:** The redirect URI is shown in the configuration section of each flow. Copy it and add it to your PingOne app\'s allowed redirect URIs.',
        searchTerms: 'configuration'
      },
      {
        pattern: /how (do|can) i (generate|get) code (examples|samples)/i,
        answer: 'To generate code examples:\n\n1. Complete any OAuth flow in the playground\n2. On the results page, look for the "Code Examples" section\n3. Select your programming language (JavaScript, Python, cURL, etc.)\n4. Copy the generated code\n\nThe code examples include:\n- Complete working implementations\n- Your actual configuration values\n- Comments explaining each step\n- Error handling\n\nYou can also visit the OAuth Code Generator page from the main menu for standalone code generation.',
        searchTerms: 'code generator'
      }
    ];

    // Find matching pattern
    for (const { pattern, answer, searchTerms } of patterns) {
      if (pattern.test(query)) {
        const relatedLinks = this.search(searchTerms, options);
        return { answer, relatedLinks };
      }
    }

    // No specific pattern matched, do a general search
    const results = this.search(query, options);
    
    if (results.length === 0) {
      return {
        answer: 'I couldn\'t find specific information about that. Try:\n\n- Browsing the flows menu to see all available OAuth flows\n- Checking the About page for general information\n- Searching for specific terms like "authorization code", "token", "PKCE", etc.\n\nWhat specific aspect of OAuth or OIDC would you like to learn about?',
        relatedLinks: []
      };
    }

    // Generate answer from top results
    const topResult = results[0];
    return {
      answer: `Based on your question, you might be interested in **${topResult.title}**:\n\n${topResult.content}\n\nYou can find more information at the link below.`,
      relatedLinks: results
    };
  }
}

export const aiAgentService = new AIAgentService();
