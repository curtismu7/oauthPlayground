# V8 Design Specification
**Date:** 2024-11-16  
**Scope:** Authorization Code V8 (Template for all V8 flows)  
**Status:** Design Phase

---

## 1. Executive Summary

This document defines the complete design for V8 components and services, focusing on:
- **Reusability**: Components work across all V8 flows
- **Education**: Built-in learning without overwhelming users
- **Simplicity**: Progressive disclosure, pop-ups, minimal main UI
- **Template**: Pattern for converting Device Code, Client Credentials, etc.

---

## 2. Architecture Overview

### 2.1 Component Hierarchy

```
OAuthAuthorizationCodeFlowV8
├── FlowHeader (existing)
├── ComprehensiveCredentialsServiceV8 (existing, needs refactor)
│   ├── CredentialsModalV8 (new)
│   ├── DiscoveryModalV8 (new)
│   └── AdvancedOptionsModalV8 (new)
├── ScopeManagerV8 (new)
│   └── ScopeEducationTooltip (new)
├── FlowSteps (existing)
└── TokenDisplayV8 (new)
    ├── TokenCard (new)
    ├── TokenDecodePanel (new)
    └── TokenActionsMenu (new)
```

### 2.2 Service Layer

```
Services (Reusable across all V8 flows)
├── tokenDisplayServiceV8.ts (new)
├── scopeEducationServiceV8.ts (new)
├── configCheckerServiceV8.ts (new)
├── discoveryServiceV8.ts (enhance existing)
└── credentialValidationServiceV8.ts (new)
```

---

## 3. Component Specifications


### 3.1 TokenDisplayV8 Component

**Purpose:** Unified token display for all V8 flows with education and actions

**Props:**
```typescript
interface TokenDisplayV8Props {
  tokens: {
    access_token?: string;
    id_token?: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
    scope?: string;
  } | null;
  flowType: 'oauth' | 'oidc';
  flowKey: string;
  onTokenAction?: (action: 'copy' | 'decode' | 'manage', token: string) => void;
}
```

**Features:**
- Show/hide based on flow type (ID token only for OIDC)
- Copy button for each token
- Decode button (shows JSON in collapsible panel)
- "Manage Token" button (navigates to Token Management page)
- Educational tooltips explaining each token type
- Syntax-highlighted JSON when decoded
- Token expiry countdown (for access tokens)

**Visual Design:**
```
┌─────────────────────────────────────────┐
│ 🎫 Access Token                    [📋] │
│ ┌─────────────────────────────────────┐ │
│ │ eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXV │ │
│ │ [Token truncated - click to expand] │ │
│ └─────────────────────────────────────┘ │
│ [Copy] [Decode] [Manage]                │
│ ℹ️ Expires in 59:45                     │
└─────────────────────────────────────────┘
```

**Logging:**
```typescript
console.log('[🧪 TOKEN-DISPLAY-V8] Token displayed', {
  flowType,
  hasAccessToken: !!tokens?.access_token,
  hasIdToken: !!tokens?.id_token,
  hasRefreshToken: !!tokens?.refresh_token
});
```

---

### 3.2 ScopeManagerV8 Component

**Purpose:** Manage scopes with education about what each scope does

**Props:**
```typescript
interface ScopeManagerV8Props {
  scopes: string;
  onScopesChange: (scopes: string) => void;
  flowType: 'oauth' | 'oidc';
  showEducation?: boolean;
}
```

**Features:**
- Common scopes as checkboxes (openid, profile, email, offline_access)
- Custom scope input field
- Educational tooltip for each scope
- Special callout for offline_access (explains refresh tokens)
- Visual indicator when offline_access is selected
- Validation (openid required for OIDC)

**Visual Design:**
```
┌─────────────────────────────────────────┐
│ Scopes                                   │
│ ☑ openid     [ℹ️ Required for OIDC]     │
│ ☑ profile    [ℹ️ User profile info]     │
│ ☑ email      [ℹ️ Email address]         │
│ ☑ offline_access [ℹ️ Refresh tokens]    │
│                                          │
│ ⚠️ offline_access selected               │
│ This will request a refresh token for   │
│ long-lived access without re-auth.      │
│ [Learn more about refresh tokens]       │
│                                          │
│ Custom scopes: [________________]       │
└─────────────────────────────────────────┘
```

---

### 3.3 ConfigCheckerModalV8 Component

**Purpose:** Compare user configuration vs PingOne application settings

**Props:**
```typescript
interface ConfigCheckerModalV8Props {
  isOpen: boolean;
  onClose: () => void;
  userConfig: {
    clientId: string;
    redirectUri: string;
    scopes: string[];
    usePkce: boolean;
  };
  pingOneConfig?: PingOneApplication;
}
```

**Features:**
- Fetch app config using worker token
- Side-by-side comparison table
- Visual indicators (✓ match, ✗ mismatch, ⚠️ warning)
- Actionable guidance for mismatches
- "Copy to clipboard" for correct values
- Link to PingOne console

**Visual Design:**
```
┌─────────────────────────────────────────────────────┐
│ Configuration Checker                          [×]  │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Comparing your config with PingOne app settings:    │
│                                                      │
│ ┌──────────────┬──────────────┬──────────────────┐ │
│ │ Setting      │ Your Config  │ PingOne App      │ │
│ ├──────────────┼──────────────┼──────────────────┤ │
│ │ Client ID    │ abc123...    │ ✓ Match          │ │
│ │ Redirect URI │ localhost... │ ✗ Not registered │ │
│ │ Grant Types  │ auth_code    │ ✓ Enabled        │ │
│ │ PKCE         │ Required     │ ⚠️ Optional      │ │
│ │ Scopes       │ openid...    │ ✓ Available      │ │
│ └──────────────┴──────────────┴──────────────────┘ │
│                                                      │
│ ⚠️ Issues Found:                                    │
│ • Redirect URI not registered in PingOne            │
│   → Add: http://localhost:3000/authz-callback       │
│   [Copy URI] [Open PingOne Console]                 │
│                                                      │
│ • PKCE enforcement mismatch                          │
│   → Your app requires PKCE but PingOne allows       │
│     non-PKCE requests. Consider enforcing in        │
│     PingOne for better security.                    │
│                                                      │
│                              [Close] [Re-check]     │
└─────────────────────────────────────────────────────┘
```

---


### 3.4 DiscoveryModalV8 Component

**Purpose:** OIDC Discovery with education about what it does

**Props:**
```typescript
interface DiscoveryModalV8Props {
  isOpen: boolean;
  onClose: () => void;
  issuer: string;
  onDiscoveryComplete: (endpoints: DiscoveryResult) => void;
}
```

**Features:**
- Explain what OIDC Discovery is
- Show discovered endpoints with descriptions
- Visual loading state during discovery
- Error handling with helpful messages
- "Use these endpoints" button to apply
- Link to well-known endpoint

**Visual Design:**
```
┌─────────────────────────────────────────────────────┐
│ OIDC Discovery                                 [×]  │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 🔍 What is OIDC Discovery?                          │
│ OpenID Connect Discovery automatically finds the    │
│ OAuth/OIDC endpoints for your authorization server. │
│ [Learn more]                                         │
│                                                      │
│ Issuer: https://auth.pingone.com/{envId}            │
│                                                      │
│ [Discover Endpoints]                                 │
│                                                      │
│ ✓ Discovery Complete                                │
│                                                      │
│ Found Endpoints:                                     │
│ ┌──────────────────────────────────────────────┐   │
│ │ Authorization: /as/authorize                  │   │
│ │ ℹ️ Where users authenticate                   │   │
│ │                                               │   │
│ │ Token: /as/token                              │   │
│ │ ℹ️ Exchange code for tokens                   │   │
│ │                                               │   │
│ │ UserInfo: /as/userinfo                        │   │
│ │ ℹ️ Get user profile information               │   │
│ │                                               │   │
│ │ JWKS: /as/jwks                                │   │
│ │ ℹ️ Public keys for token validation           │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ [View Full Response] [Use These Endpoints]          │
└─────────────────────────────────────────────────────┘
```

---

### 3.5 CredentialsModalV8 Component

**Purpose:** Simplified credential input with progressive disclosure

**Props:**
```typescript
interface CredentialsModalV8Props {
  isOpen: boolean;
  onClose: () => void;
  credentials: StepCredentials;
  onCredentialsChange: (credentials: Partial<StepCredentials>) => void;
  flowType: 'oauth' | 'oidc';
}
```

**Features:**
- Basic section (always visible): env ID, client ID, secret, redirect URI
- Advanced section (collapsible): JWKS, private key, custom params
- Discovery section (collapsible): issuer, auto-discovery button
- Validation with helpful error messages
- "Load from app" button (uses worker token)
- Save/cancel actions

**Visual Design:**
```
┌─────────────────────────────────────────────────────┐
│ Configure Credentials                          [×]  │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Basic Configuration                                  │
│ ┌──────────────────────────────────────────────┐   │
│ │ Environment ID: [_________________________]  │   │
│ │ Client ID:      [_________________________]  │   │
│ │ Client Secret:  [_________________________]  │   │
│ │ Redirect URI:   [_________________________]  │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ [Load from PingOne App ▼]                           │
│                                                      │
│ ▶ Advanced Options                                  │
│   (JWKS URL, Private Key, Custom Parameters)        │
│                                                      │
│ ▶ OIDC Discovery                                    │
│   (Auto-discover endpoints from issuer)             │
│                                                      │
│                              [Cancel] [Save]        │
└─────────────────────────────────────────────────────┘
```

---

## 4. Service Specifications

### 4.1 tokenDisplayServiceV8.ts

**Purpose:** Business logic for token display and manipulation

**Functions:**
```typescript
class TokenDisplayServiceV8 {
  // Copy token to clipboard
  static async copyToken(token: string, label: string): Promise<void>
  
  // Decode JWT token
  static decodeToken(token: string): DecodedToken | null
  
  // Check if token is JWT
  static isJWT(token: string): boolean
  
  // Format token for display (truncate, etc)
  static formatToken(token: string, maxLength?: number): string
  
  // Calculate time until expiry
  static getExpiryInfo(expiresIn: number): {
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }
  
  // Navigate to token management
  static sendToTokenManagement(
    token: string, 
    tokenType: 'access' | 'id' | 'refresh',
    flowKey: string
  ): void
}
```

**Logging:**
```typescript
console.log('[🧪 TOKEN-DISPLAY-V8] Action', { action, tokenType });
```

---

### 4.2 scopeEducationServiceV8.ts

**Purpose:** Provide educational content about OAuth/OIDC scopes

**Functions:**
```typescript
class ScopeEducationServiceV8 {
  // Get description for a scope
  static getScopeDescription(scope: string): string
  
  // Get detailed explanation
  static getScopeDetails(scope: string): {
    title: string;
    description: string;
    example: string;
    learnMoreUrl?: string;
  }
  
  // Check if scope requires special handling
  static requiresEducation(scope: string): boolean
  
  // Get all common scopes for flow type
  static getCommonScopes(flowType: 'oauth' | 'oidc'): Array<{
    value: string;
    label: string;
    description: string;
    recommended: boolean;
  }>
}
```

**Scope Definitions:**
```typescript
const SCOPE_DEFINITIONS = {
  openid: {
    title: 'OpenID Connect',
    description: 'Required for OIDC flows. Enables ID token.',
    required: true,
    flowTypes: ['oidc']
  },
  profile: {
    title: 'Profile Information',
    description: 'Access to user profile (name, picture, etc)',
    required: false,
    flowTypes: ['oauth', 'oidc']
  },
  email: {
    title: 'Email Address',
    description: 'Access to user email address',
    required: false,
    flowTypes: ['oauth', 'oidc']
  },
  offline_access: {
    title: 'Offline Access (Refresh Token)',
    description: 'Request a refresh token for long-lived access',
    required: false,
    flowTypes: ['oauth', 'oidc'],
    education: {
      why: 'Allows your app to access resources when user is offline',
      when: 'Use for: background sync, long sessions, mobile apps',
      security: 'Refresh tokens are long-lived - store securely'
    }
  }
};
```

---


### 4.3 configCheckerServiceV8.ts

**Purpose:** Compare user config with PingOne application settings

**Functions:**
```typescript
class ConfigCheckerServiceV8 {
  // Fetch app config from PingOne
  static async fetchAppConfig(
    environmentId: string,
    clientId: string,
    workerToken: string
  ): Promise<PingOneApplication>
  
  // Compare configurations
  static compareConfigs(
    userConfig: UserConfig,
    pingOneConfig: PingOneApplication
  ): ConfigComparison
  
  // Generate fix suggestions
  static generateFixSuggestions(
    comparison: ConfigComparison
  ): FixSuggestion[]
  
  // Validate configuration
  static validateConfig(config: UserConfig): ValidationResult
}

interface ConfigComparison {
  clientId: { match: boolean; message?: string };
  redirectUris: { match: boolean; missing?: string[]; message?: string };
  grantTypes: { match: boolean; message?: string };
  scopes: { match: boolean; unavailable?: string[]; message?: string };
  pkce: { match: boolean; level: 'required' | 'optional' | 'disabled'; message?: string };
}

interface FixSuggestion {
  field: string;
  issue: string;
  action: string;
  copyValue?: string;
  severity: 'error' | 'warning' | 'info';
}
```

---

### 4.4 discoveryServiceV8.ts

**Purpose:** Enhanced OIDC Discovery with education

**Functions:**
```typescript
class DiscoveryServiceV8 {
  // Perform OIDC discovery
  static async discover(issuer: string): Promise<DiscoveryResult>
  
  // Get endpoint description
  static getEndpointDescription(endpoint: string): string
  
  // Validate discovery response
  static validateDiscoveryResponse(response: any): ValidationResult
  
  // Get educational content about discovery
  static getDiscoveryEducation(): {
    what: string;
    why: string;
    how: string;
    learnMoreUrl: string;
  }
}

interface DiscoveryResult {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
  jwks_uri: string;
  end_session_endpoint?: string;
  // ... other endpoints
}
```

---

## 5. Integration Plan

### 5.1 Phase 1: Token Display (Week 1)

**Steps:**
1. Create `TokenDisplayV8` component
2. Create `tokenDisplayServiceV8.ts`
3. Add to `OAuthAuthorizationCodeFlowV8`
4. Test with both OAuth and OIDC variants
5. Add logging and error handling
6. Document usage

**Success Criteria:**
- Tokens display correctly for both flow types
- Copy, decode, and manage actions work
- ID token only shows for OIDC
- Educational tooltips present
- No regressions in existing functionality

---

### 5.2 Phase 2: Scope Education (Week 1)

**Steps:**
1. Create `ScopeManagerV8` component
2. Create `scopeEducationServiceV8.ts`
3. Add to `ComprehensiveCredentialsServiceV8`
4. Add special handling for offline_access
5. Test scope validation
6. Add logging

**Success Criteria:**
- Common scopes show as checkboxes
- Educational tooltips for each scope
- offline_access shows special callout
- Custom scopes can be added
- Validation works (openid required for OIDC)

---

### 5.3 Phase 3: Config Checker (Week 2)

**Steps:**
1. Create `ConfigCheckerModalV8` component
2. Create `configCheckerServiceV8.ts`
3. Add button to flow UI
4. Integrate with worker token
5. Test comparison logic
6. Add fix suggestions

**Success Criteria:**
- Modal opens and fetches app config
- Comparison table shows correctly
- Fix suggestions are actionable
- Copy to clipboard works
- Links to PingOne console work

---

### 5.4 Phase 4: Discovery & Credentials (Week 2)

**Steps:**
1. Create `DiscoveryModalV8` component
2. Enhance `discoveryServiceV8.ts`
3. Create `CredentialsModalV8` component
4. Refactor `ComprehensiveCredentialsServiceV8`
5. Test progressive disclosure
6. Add education content

**Success Criteria:**
- Discovery modal works with education
- Credentials modal uses pop-up pattern
- Progressive disclosure works
- All existing functionality preserved
- Simpler UX than before

---

## 6. Testing Strategy

### 6.1 Unit Tests

**Components:**
- TokenDisplayV8: render, actions, conditional display
- ScopeManagerV8: validation, education, custom scopes
- ConfigCheckerModalV8: comparison logic, fix suggestions
- DiscoveryModalV8: discovery flow, error handling
- CredentialsModalV8: validation, save/cancel

**Services:**
- tokenDisplayServiceV8: decode, format, expiry
- scopeEducationServiceV8: descriptions, validation
- configCheckerServiceV8: comparison, suggestions
- discoveryServiceV8: discovery, validation

---

### 6.2 Integration Tests

**Scenarios:**
1. Complete Authorization Code flow (OAuth variant)
2. Complete Authorization Code flow (OIDC variant)
3. Token display with all token types
4. Config checker with mismatched config
5. Discovery with valid/invalid issuer
6. Scope selection with offline_access

---

### 6.3 Manual Testing Checklist

- [ ] Token display shows correct tokens for flow type
- [ ] Copy buttons work for all tokens
- [ ] Decode shows syntax-highlighted JSON
- [ ] Manage token navigates correctly
- [ ] Scope checkboxes work
- [ ] offline_access shows education
- [ ] Custom scopes can be added
- [ ] Config checker fetches app config
- [ ] Comparison table shows correctly
- [ ] Fix suggestions are helpful
- [ ] Discovery modal works
- [ ] Endpoints are explained
- [ ] Credentials modal saves correctly
- [ ] Progressive disclosure works
- [ ] No regressions in existing flows

---

## 7. Documentation Requirements

### 7.1 Component Documentation

Each component needs:
- Purpose and usage
- Props interface with descriptions
- Examples
- Accessibility notes
- Logging behavior

### 7.2 Service Documentation

Each service needs:
- Purpose
- Function signatures
- Examples
- Error handling
- Logging behavior

### 7.3 User Documentation

- How to use new features
- Educational content about OAuth/OIDC concepts
- Troubleshooting guide
- Migration guide from V7

---

## 8. Success Metrics

### 8.1 Functionality
- [ ] All 15 gap analysis items addressed
- [ ] No regressions in existing flows
- [ ] Reusable across both V8 flows
- [ ] Ready as template for future conversions

### 8.2 Code Quality
- [ ] All components have tests
- [ ] All services have tests
- [ ] Logging consistent across all modules
- [ ] TypeScript strict mode passes
- [ ] No linting errors

### 8.3 UX
- [ ] Simpler than V7 (fewer clicks for common tasks)
- [ ] More educational (users understand what they're doing)
- [ ] Progressive disclosure works
- [ ] Accessible (keyboard nav, screen readers)

---

## 9. Next Steps

1. **Review this design** - Get feedback and approval
2. **Create component stubs** - Empty components with props
3. **Implement services** - Business logic first
4. **Build components** - UI with service integration
5. **Add tests** - Unit and integration
6. **Document** - Component docs and user guides
7. **Deploy** - Roll out to Authorization Code V8
8. **Validate** - Test with real users
9. **Extend** - Apply to Implicit V8
10. **Template** - Use for Device Code, Client Credentials, etc.

---

## 10. Open Questions

1. Should Config Checker be automatic or manual trigger?
2. Should Discovery be automatic on issuer change?
3. Should we add "Quick Start" presets for common scenarios?
4. Should we add export/import for configurations?
5. Should we add a "What's New in V8" tour?

---

**Status:** Ready for review and approval  
**Next:** Get stakeholder feedback, then proceed to implementation


---

## 11. Education System (NEW)

### 11.1 educationServiceV8.ts

**Purpose:** Centralized educational content for all V8 flows - tooltips, modals, explanations

**Why Needed:**
- Consistent educational content across all flows
- Reusable by Device Code, Client Credentials, etc.
- Single source of truth for OAuth/OIDC concepts
- Easy to update and maintain
- Supports multiple languages (future)

**Architecture:**
```typescript
class EducationServiceV8 {
  // Get tooltip content
  static getTooltip(key: string): TooltipContent
  
  // Get detailed explanation (for modals/expandable sections)
  static getExplanation(key: string): ExplanationContent
  
  // Get quick start preset
  static getQuickStartPreset(presetName: string): QuickStartPreset
  
  // Get all available presets
  static getAvailablePresets(): QuickStartPreset[]
  
  // Export configuration
  static exportConfig(config: any, format: 'json' | 'yaml'): string
  
  // Import configuration
  static importConfig(data: string, format: 'json' | 'yaml'): any
  
  // Get contextual help for current step
  static getContextualHelp(flowType: string, step: string): ContextualHelp
}

interface TooltipContent {
  title: string;
  description: string;
  icon?: string;
  learnMoreUrl?: string;
}

interface ExplanationContent {
  title: string;
  summary: string;
  details: string;
  example?: string;
  codeSnippet?: string;
  learnMoreUrl?: string;
  relatedTopics?: string[];
}

interface QuickStartPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  config: Partial<StepCredentials>;
  scopes: string[];
  flowType: 'oauth' | 'oidc';
  tags: string[];
}

interface ContextualHelp {
  title: string;
  description: string;
  tips: string[];
  commonIssues?: Array<{
    issue: string;
    solution: string;
  }>;
}
```

---

### 11.2 Content Definitions

**Tooltip Keys:**
```typescript
const TOOLTIPS = {
  // Credentials
  'credential.environmentId': {
    title: 'Environment ID',
    description: 'Your PingOne environment identifier (UUID format)',
    icon: '🌍'
  },
  'credential.clientId': {
    title: 'Client ID',
    description: 'Public identifier for your application',
    icon: '🔑'
  },
  'credential.clientSecret': {
    title: 'Client Secret',
    description: 'Secret key for authenticating your application. Keep this secure!',
    icon: '🔐',
    learnMoreUrl: '/docs/security/client-secrets'
  },
  
  // Scopes
  'scope.openid': {
    title: 'OpenID Connect',
    description: 'Required for OIDC flows. Enables ID token with user identity.',
    icon: '🆔'
  },
  'scope.offline_access': {
    title: 'Offline Access',
    description: 'Requests a refresh token for long-lived access without re-authentication.',
    icon: '🔄',
    learnMoreUrl: '/docs/tokens/refresh-tokens'
  },
  
  // Tokens
  'token.access': {
    title: 'Access Token',
    description: 'Used to access protected resources on behalf of the user.',
    icon: '🎫'
  },
  'token.id': {
    title: 'ID Token',
    description: 'Contains user identity information (OIDC only).',
    icon: '🆔'
  },
  'token.refresh': {
    title: 'Refresh Token',
    description: 'Used to obtain new access tokens without re-authentication.',
    icon: '🔄'
  },
  
  // PKCE
  'pkce.what': {
    title: 'PKCE (Proof Key for Code Exchange)',
    description: 'Security extension that prevents authorization code interception attacks.',
    icon: '🔒',
    learnMoreUrl: '/docs/security/pkce'
  },
  
  // Discovery
  'discovery.what': {
    title: 'OIDC Discovery',
    description: 'Automatically finds OAuth/OIDC endpoints from the issuer URL.',
    icon: '🔍',
    learnMoreUrl: '/docs/oidc/discovery'
  }
};
```

**Explanation Keys:**
```typescript
const EXPLANATIONS = {
  'offline_access': {
    title: 'Understanding offline_access Scope',
    summary: 'The offline_access scope requests a refresh token for long-lived access.',
    details: `
When you request the offline_access scope, the authorization server will 
issue a refresh token along with the access token. This refresh token can 
be used to obtain new access tokens without requiring the user to 
re-authenticate.

This is essential for:
- Background synchronization
- Long-running sessions
- Mobile applications
- Offline access to user data

Security Note: Refresh tokens are long-lived credentials. Store them 
securely and never expose them in client-side code or logs.
    `,
    example: 'scopes: "openid profile email offline_access"',
    codeSnippet: `
// Request with offline_access
const authUrl = buildAuthUrl({
  scopes: 'openid profile email offline_access',
  // ... other params
});

// Later, use refresh token to get new access token
const newTokens = await refreshAccessToken(refreshToken);
    `,
    learnMoreUrl: '/docs/tokens/refresh-tokens',
    relatedTopics: ['token.refresh', 'token.access', 'scope.openid']
  },
  
  'pkce': {
    title: 'PKCE: Proof Key for Code Exchange',
    summary: 'PKCE prevents authorization code interception attacks.',
    details: `
PKCE (RFC 7636) is a security extension to OAuth 2.0 that prevents 
authorization code interception attacks. It's required for:
- Public clients (SPAs, mobile apps)
- Any client that can't securely store a client secret

How it works:
1. Client generates a random code_verifier
2. Client creates code_challenge = SHA256(code_verifier)
3. Authorization request includes code_challenge
4. Token request includes code_verifier
5. Server verifies: SHA256(code_verifier) == code_challenge

This ensures that even if an attacker intercepts the authorization code,
they cannot exchange it for tokens without the code_verifier.
    `,
    codeSnippet: `
// Generate PKCE codes
const codeVerifier = generateCodeVerifier();
const codeChallenge = await generateCodeChallenge(codeVerifier);

// Authorization request
const authUrl = buildAuthUrl({
  code_challenge: codeChallenge,
  code_challenge_method: 'S256',
  // ... other params
});

// Token request
const tokens = await exchangeCode(code, {
  code_verifier: codeVerifier
});
    `,
    learnMoreUrl: '/docs/security/pkce',
    relatedTopics: ['security', 'authorization_code']
  }
};
```

**Quick Start Presets:**
```typescript
const QUICK_START_PRESETS: QuickStartPreset[] = [
  {
    id: 'pingone-oidc',
    name: 'PingOne OIDC',
    description: 'Standard OpenID Connect flow with PingOne',
    icon: '🔐',
    config: {
      issuer: 'https://auth.pingone.com/{environmentId}',
      responseType: 'code',
      grantType: 'authorization_code',
      clientAuthMethod: 'client_secret_post',
      usePkce: true
    },
    scopes: ['openid', 'profile', 'email'],
    flowType: 'oidc',
    tags: ['pingone', 'oidc', 'recommended']
  },
  {
    id: 'pingone-oauth-refresh',
    name: 'PingOne OAuth with Refresh Token',
    description: 'OAuth 2.0 flow with refresh token support',
    icon: '🔄',
    config: {
      issuer: 'https://auth.pingone.com/{environmentId}',
      responseType: 'code',
      grantType: 'authorization_code',
      clientAuthMethod: 'client_secret_post',
      usePkce: true
    },
    scopes: ['openid', 'profile', 'email', 'offline_access'],
    flowType: 'oauth',
    tags: ['pingone', 'oauth', 'refresh-token']
  },
  {
    id: 'generic-oidc',
    name: 'Generic OIDC Provider',
    description: 'Works with any OIDC-compliant provider',
    icon: '🌐',
    config: {
      responseType: 'code',
      grantType: 'authorization_code',
      clientAuthMethod: 'client_secret_post',
      usePkce: true
    },
    scopes: ['openid', 'profile', 'email'],
    flowType: 'oidc',
    tags: ['generic', 'oidc']
  },
  {
    id: 'spa-public-client',
    name: 'SPA / Public Client',
    description: 'For single-page apps without client secret',
    icon: '📱',
    config: {
      responseType: 'code',
      grantType: 'authorization_code',
      clientAuthMethod: 'none',
      usePkce: true
    },
    scopes: ['openid', 'profile', 'email'],
    flowType: 'oidc',
    tags: ['spa', 'public-client', 'pkce-required']
  }
];
```

---

### 11.3 EducationTooltip Component

**Purpose:** Reusable tooltip component for all V8 flows

**Props:**
```typescript
interface EducationTooltipProps {
  contentKey: string;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  showIcon?: boolean;
  expandable?: boolean; // If true, clicking opens detailed modal
}
```

**Usage:**
```tsx
<EducationTooltip contentKey="credential.clientId">
  <Label>Client ID</Label>
</EducationTooltip>

<EducationTooltip 
  contentKey="scope.offline_access" 
  expandable={true}
>
  <Checkbox>offline_access</Checkbox>
</EducationTooltip>
```

**Visual Design:**
```
┌─────────────────────────────────┐
│ Client ID [ℹ️]                  │
│ [_____________________________] │
└─────────────────────────────────┘
     ↓ (hover on ℹ️)
┌─────────────────────────────────┐
│ 🔑 Client ID                    │
│ Public identifier for your      │
│ application                     │
│                                 │
│ [Learn more →]                  │
└─────────────────────────────────┘
```

---

### 11.4 QuickStartModal Component

**Purpose:** Help users get started quickly with presets

**Props:**
```typescript
interface QuickStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: QuickStartPreset) => void;
  currentFlowType: 'oauth' | 'oidc';
}
```

**Visual Design:**
```
┌─────────────────────────────────────────────────────┐
│ Quick Start                                    [×]  │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Choose a preset to get started quickly:             │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ 🔐 PingOne OIDC                              │   │
│ │ Standard OpenID Connect flow with PingOne    │   │
│ │ Scopes: openid, profile, email               │   │
│ │                                    [Select]  │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ 🔄 PingOne OAuth with Refresh Token          │   │
│ │ OAuth 2.0 flow with refresh token support    │   │
│ │ Scopes: openid, profile, email, offline_...  │   │
│ │                                    [Select]  │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ 📱 SPA / Public Client                       │   │
│ │ For single-page apps without client secret   │   │
│ │ Scopes: openid, profile, email               │   │
│ │                                    [Select]  │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ [Skip - Configure Manually]                         │
└─────────────────────────────────────────────────────┘
```

---

### 11.5 ConfigExportImport Component

**Purpose:** Export/import configurations for sharing and backup

**Props:**
```typescript
interface ConfigExportImportProps {
  config: any;
  onImport: (config: any) => void;
  flowType: string;
}
```

**Features:**
- Export as JSON or YAML
- Import from JSON or YAML
- Validate imported config
- Sanitize sensitive data (client secret)
- Copy to clipboard
- Download as file

**Visual Design:**
```
┌─────────────────────────────────────────────────────┐
│ Export / Import Configuration                  [×]  │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Export Configuration                                 │
│ ┌──────────────────────────────────────────────┐   │
│ │ Format: [JSON ▼]                             │   │
│ │                                               │   │
│ │ ☑ Include credentials (sanitized)            │   │
│ │ ☑ Include scopes                             │   │
│ │ ☑ Include advanced options                   │   │
│ │                                               │   │
│ │ [Copy to Clipboard] [Download File]          │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ Import Configuration                                 │
│ ┌──────────────────────────────────────────────┐   │
│ │ Paste configuration JSON or YAML:            │   │
│ │ ┌──────────────────────────────────────────┐ │   │
│ │ │ {                                        │ │   │
│ │ │   "environmentId": "...",                │ │   │
│ │ │   "clientId": "...",                     │ │   │
│ │ │   ...                                    │ │   │
│ │ │ }                                        │ │   │
│ │ └──────────────────────────────────────────┘ │   │
│ │                                               │   │
│ │ [Validate] [Import]                          │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│                                        [Close]      │
└─────────────────────────────────────────────────────┘
```

---

### 11.6 Integration with Existing Components

**Update ComprehensiveCredentialsServiceV8:**
```tsx
// Add tooltips to all fields
<EducationTooltip contentKey="credential.environmentId">
  <Label>Environment ID</Label>
</EducationTooltip>

// Add Quick Start button
<Button onClick={() => setShowQuickStart(true)}>
  ⚡ Quick Start
</Button>

// Add Export/Import button
<Button onClick={() => setShowExportImport(true)}>
  📤 Export/Import
</Button>
```

**Update ScopeManagerV8:**
```tsx
// Add expandable education for special scopes
<EducationTooltip 
  contentKey="scope.offline_access" 
  expandable={true}
>
  <Checkbox>offline_access</Checkbox>
</EducationTooltip>
```

---

### 11.7 Logging

```typescript
console.log('[📚 EDUCATION-V8] Tooltip shown', { key: contentKey });
console.log('[📚 EDUCATION-V8] Explanation opened', { key: contentKey });
console.log('[⚡ QUICK-START-V8] Preset selected', { presetId });
console.log('[📤 EXPORT-V8] Config exported', { format, includeCredentials });
console.log('[📥 IMPORT-V8] Config imported', { valid, errors });
```

---

## 12. Updated Implementation Plan

### Phase 1: Foundation (Week 1)
1. **EducationServiceV8** - Core service with all content
2. **EducationTooltip** - Reusable tooltip component
3. **TokenDisplayV8** - With integrated tooltips
4. **ScopeManagerV8** - With integrated education

### Phase 2: Advanced Features (Week 2)
5. **QuickStartModal** - Preset selection
6. **ConfigExportImport** - Export/import functionality
7. **ConfigCheckerModalV8** - With tooltips
8. **DiscoveryModalV8** - With education

### Phase 3: Polish (Week 3)
9. Integration testing
10. Documentation
11. User testing
12. Refinement

---

**Updated Answers to Open Questions:**
1. Config Checker: **Manual** ✓
2. Auto-discovery: **No** ✓
3. Quick Start presets: **Yes** ✓
4. Export/Import: **Yes** ✓
5. What's New tour: **No** ✓
6. **NEW:** Centralized education service: **Yes** ✓



---

## 13. Additional Reusable Services & Components

Based on code analysis, here are additional components that should be extracted into reusable V8 services:

### 13.1 Modal Management Service

**Purpose:** Centralized modal state and behavior management

**Current Problem:**
- Every flow duplicates modal state: `showRedirectModal`, `showLoginSuccessModal`, etc.
- Modal guards (preventing reopening) duplicated
- Modal callbacks duplicated

**Solution: modalManagerV8.ts**

```typescript
class ModalManagerV8 {
  private static modals = new Map<string, ModalState>();
  
  // Register a modal
  static registerModal(id: string, config: ModalConfig): void
  
  // Show modal
  static show(id: string, data?: any): void
  
  // Hide modal
  static hide(id: string): void
  
  // Check if modal is open
  static isOpen(id: string): boolean
  
  // Get modal data
  static getData(id: string): any
  
  // Guard against reopening (for LoginSuccessModal)
  static showOnce(id: string, guardKey: string, data?: any): void
}

interface ModalState {
  isOpen: boolean;
  data?: any;
  guardKeys: Set<string>;
}

interface ModalConfig {
  id: string;
  component: React.ComponentType<any>;
  defaultProps?: any;
}
```

**Usage:**
```tsx
// In flow component
const modalManager = useModalManager();

// Show login success modal (only once per auth code)
modalManager.showOnce('loginSuccess', authCode);

// Show redirect modal
modalManager.show('redirect', { authUrl });

// In JSX
<LoginSuccessModal 
  isOpen={modalManager.isOpen('loginSuccess')}
  onClose={() => modalManager.hide('loginSuccess')}
/>
```

**Logging:**
```typescript
console.log('[🪟 MODAL-MANAGER-V8] Modal shown', { id, guardKey });
console.log('[🪟 MODAL-MANAGER-V8] Modal hidden', { id });
```

---

### 13.2 Error Handling Service

**Purpose:** Consistent error handling and user-friendly messages

**Current Problem:**
- `v4ToastManager.showError()` called everywhere
- Error messages inconsistent
- No centralized error categorization
- No error recovery suggestions

**Solution: errorHandlerV8.ts**

```typescript
class ErrorHandlerV8 {
  // Handle error with context
  static handleError(
    error: Error | string,
    context: ErrorContext
  ): void
  
  // Get user-friendly message
  static getUserMessage(error: Error | string): string
  
  // Get recovery suggestions
  static getRecoverySuggestions(error: Error | string): string[]
  
  // Log error with context
  static logError(
    error: Error | string,
    context: ErrorContext
  ): void
  
  // Check if error is recoverable
  static isRecoverable(error: Error | string): boolean
}

interface ErrorContext {
  flowType: string;
  step: string;
  action: string;
  credentials?: Partial<StepCredentials>;
}

interface ErrorCategory {
  type: 'auth' | 'network' | 'validation' | 'config' | 'unknown';
  severity: 'error' | 'warning' | 'info';
  userMessage: string;
  technicalMessage: string;
  recoverySuggestions: string[];
  learnMoreUrl?: string;
}
```

**Error Definitions:**
```typescript
const ERROR_DEFINITIONS = {
  'missing_credentials': {
    type: 'validation',
    severity: 'error',
    userMessage: 'Missing required credentials',
    technicalMessage: 'One or more required credential fields are empty',
    recoverySuggestions: [
      'Complete all required fields in Step 0',
      'Use Quick Start to load a preset',
      'Import a saved configuration'
    ]
  },
  'invalid_grant': {
    type: 'auth',
    severity: 'error',
    userMessage: 'Authorization code is invalid or expired',
    technicalMessage: 'Token endpoint returned invalid_grant error',
    recoverySuggestions: [
      'Authorization codes expire quickly (usually 60 seconds)',
      'Try the flow again from the beginning',
      'Check that PKCE codes match'
    ],
    learnMoreUrl: '/docs/errors/invalid-grant'
  },
  'network_error': {
    type: 'network',
    severity: 'error',
    userMessage: 'Network request failed',
    technicalMessage: 'Unable to reach the authorization server',
    recoverySuggestions: [
      'Check your internet connection',
      'Verify the environment ID is correct',
      'Check if the authorization server is accessible'
    ]
  }
};
```

**Usage:**
```tsx
try {
  await exchangeTokens();
} catch (error) {
  ErrorHandlerV8.handleError(error, {
    flowType: 'authorization_code',
    step: 'token_exchange',
    action: 'exchange_code_for_tokens',
    credentials: controller.credentials
  });
}
```

**Logging:**
```typescript
console.log('[🚨 ERROR-HANDLER-V8] Error handled', {
  category: errorCategory.type,
  severity: errorCategory.severity,
  recoverable: isRecoverable
});
```

---

### 13.3 Validation Service

**Purpose:** Centralized validation logic for credentials, scopes, URLs

**Current Problem:**
- Validation logic scattered across components
- Inconsistent validation messages
- No validation for common patterns (URLs, UUIDs, etc.)

**Solution: validationServiceV8.ts**

```typescript
class ValidationServiceV8 {
  // Validate credentials
  static validateCredentials(
    credentials: Partial<StepCredentials>,
    flowType: 'oauth' | 'oidc'
  ): ValidationResult
  
  // Validate scopes
  static validateScopes(
    scopes: string,
    flowType: 'oauth' | 'oidc'
  ): ValidationResult
  
  // Validate URL
  static validateUrl(url: string, type: 'redirect' | 'issuer'): ValidationResult
  
  // Validate UUID
  static validateUUID(value: string, field: string): ValidationResult
  
  // Get required fields for flow type
  static getRequiredFields(flowType: 'oauth' | 'oidc'): string[]
  
  // Check if field is empty
  static isEmpty(value: any): boolean
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  field: string;
  message: string;
  suggestion?: string;
}

interface ValidationWarning {
  field: string;
  message: string;
  canProceed: boolean;
}
```

**Validation Rules:**
```typescript
const VALIDATION_RULES = {
  environmentId: {
    required: true,
    pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    message: 'Must be a valid UUID',
    example: '12345678-1234-1234-1234-123456789012'
  },
  clientId: {
    required: true,
    minLength: 1,
    message: 'Client ID is required'
  },
  redirectUri: {
    required: true,
    pattern: /^https?:\/\/.+/,
    message: 'Must be a valid HTTP(S) URL',
    warnings: [
      {
        pattern: /^http:\/\/(?!localhost|127\.0\.0\.1)/,
        message: 'Using HTTP (not HTTPS) for non-localhost URLs is insecure'
      }
    ]
  },
  scopes: {
    required: true,
    custom: (scopes: string, flowType: string) => {
      if (flowType === 'oidc' && !scopes.includes('openid')) {
        return {
          valid: false,
          message: 'OIDC flows require the "openid" scope'
        };
      }
      return { valid: true };
    }
  }
};
```

**Usage:**
```tsx
const result = ValidationServiceV8.validateCredentials(
  controller.credentials,
  flowType
);

if (!result.valid) {
  result.errors.forEach(error => {
    console.error(`Validation error: ${error.field} - ${error.message}`);
  });
}
```

---

### 13.4 URL Builder Service

**Purpose:** Build authorization URLs with proper encoding and validation

**Current Problem:**
- URL building logic in controller
- Hard to test
- Inconsistent parameter handling

**Solution: urlBuilderV8.ts**

```typescript
class UrlBuilderV8 {
  // Build authorization URL
  static buildAuthorizationUrl(params: AuthUrlParams): string
  
  // Build token endpoint URL
  static buildTokenUrl(issuer: string): string
  
  // Build userinfo endpoint URL
  static buildUserInfoUrl(issuer: string): string
  
  // Parse callback URL
  static parseCallbackUrl(url: string): CallbackParams
  
  // Validate URL parameters
  static validateParams(params: AuthUrlParams): ValidationResult
}

interface AuthUrlParams {
  authorizationEndpoint: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  responseType: string;
  state?: string;
  nonce?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  customParams?: Record<string, string>;
}

interface CallbackParams {
  code?: string;
  state?: string;
  error?: string;
  errorDescription?: string;
  // ... other params
}
```

**Usage:**
```tsx
const authUrl = UrlBuilderV8.buildAuthorizationUrl({
  authorizationEndpoint: endpoints.authorization_endpoint,
  clientId: credentials.clientId,
  redirectUri: credentials.redirectUri,
  scope: credentials.scopes,
  responseType: 'code',
  state: generateState(),
  codeChallenge: pkceCodes.codeChallenge,
  codeChallengeMethod: 'S256'
});
```

---

### 13.5 Storage Service (Enhanced)

**Purpose:** Unified storage with versioning and migration

**Current Problem:**
- Multiple storage keys scattered across code
- No versioning
- No migration strategy
- Inconsistent serialization

**Solution: storageServiceV8.ts**

```typescript
class StorageServiceV8 {
  // Save with versioning
  static save<T>(key: string, data: T, version: number): void
  
  // Load with migration
  static load<T>(key: string, migrations?: Migration[]): T | null
  
  // Clear specific key
  static clear(key: string): void
  
  // Clear all V8 data
  static clearAll(): void
  
  // Export all data
  static exportAll(): string
  
  // Import data
  static importAll(data: string): void
  
  // Get storage size
  static getSize(): number
}

interface Migration {
  fromVersion: number;
  toVersion: number;
  migrate: (data: any) => any;
}
```

**Storage Keys Convention:**
```typescript
const STORAGE_KEYS = {
  // V8 prefix for all keys
  PREFIX: 'v8',
  
  // Flow-specific
  AUTHZ_CODE: 'v8:authz-code',
  IMPLICIT: 'v8:implicit',
  
  // Shared
  CREDENTIALS: 'v8:credentials',
  DISCOVERY: 'v8:discovery',
  TOKENS: 'v8:tokens',
  PREFERENCES: 'v8:preferences'
};
```

---

### 13.6 API Call Display Service (Enhanced)

**Purpose:** Unified API call logging and display

**Current Problem:**
- API call display logic duplicated
- Inconsistent formatting
- No request/response correlation

**Solution: apiCallDisplayV8.ts**

```typescript
class ApiCallDisplayV8 {
  // Log API call
  static logCall(call: ApiCall): string // Returns call ID
  
  // Get call by ID
  static getCall(id: string): ApiCall | null
  
  // Get all calls for flow
  static getCallsForFlow(flowKey: string): ApiCall[]
  
  // Clear calls
  static clearCalls(flowKey?: string): void
  
  // Export calls
  static exportCalls(format: 'json' | 'har'): string
  
  // Format for display
  static formatCall(call: ApiCall): FormattedApiCall
}

interface ApiCall {
  id: string;
  timestamp: number;
  flowKey: string;
  step: string;
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
  };
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body?: any;
  };
  error?: string;
  duration?: number;
}
```

---

## 14. Updated Component Architecture

```
V8 Shared Services (Reusable across ALL flows)
├── educationServiceV8.ts          [📚 EDUCATION-V8]
├── modalManagerV8.ts               [🪟 MODAL-MANAGER-V8]
├── errorHandlerV8.ts               [🚨 ERROR-HANDLER-V8]
├── validationServiceV8.ts          [✅ VALIDATION-V8]
├── urlBuilderV8.ts                 [🔗 URL-BUILDER-V8]
├── storageServiceV8.ts             [💾 STORAGE-V8]
├── apiCallDisplayV8.ts             [📡 API-CALL-V8]
├── tokenDisplayServiceV8.ts        [🧪 TOKEN-DISPLAY-V8]
├── scopeEducationServiceV8.ts      [🔑 SCOPE-EDUCATION-V8]
├── configCheckerServiceV8.ts       [🔍 CONFIG-CHECKER-V8]
└── discoveryServiceV8.ts           [📡 DISCOVERY-V8]

V8 Shared Components (Reusable across ALL flows)
├── EducationTooltip                (tooltips everywhere)
├── QuickStartModal                 (preset selection)
├── ConfigExportImport              (export/import configs)
├── TokenDisplayV8                  (token display)
├── ScopeManagerV8                  (scope selection)
├── ConfigCheckerModalV8            (config comparison)
├── DiscoveryModalV8                (OIDC discovery)
├── CredentialsModalV8              (credential input)
└── ErrorDisplay                    (error messages with recovery)

Flow-Specific Components
├── OAuthAuthorizationCodeFlowV8
├── ImplicitFlowV8
└── [Future: DeviceCodeV8, ClientCredentialsV8, etc.]
```

---

## 15. Benefits of Extraction

### 15.1 Code Reuse
- Write once, use in all flows
- Consistent behavior across flows
- Easier to maintain

### 15.2 Testing
- Test services independently
- Mock services in component tests
- Higher test coverage

### 15.3 Consistency
- Same UX across all flows
- Same error messages
- Same validation rules

### 15.4 Maintainability
- Single source of truth
- Easy to update
- Clear dependencies

### 15.5 Future-Proofing
- Easy to add new flows
- Easy to add new features
- Easy to migrate

---

## 16. Implementation Priority

### Phase 1: Foundation (Week 1)
1. **educationServiceV8** - Core education system
2. **validationServiceV8** - Validation rules
3. **errorHandlerV8** - Error handling
4. **storageServiceV8** - Enhanced storage

### Phase 2: UI Services (Week 2)
5. **modalManagerV8** - Modal management
6. **tokenDisplayServiceV8** - Token display
7. **scopeEducationServiceV8** - Scope education
8. **urlBuilderV8** - URL building

### Phase 3: Advanced (Week 3)
9. **configCheckerServiceV8** - Config checking
10. **discoveryServiceV8** - OIDC discovery
11. **apiCallDisplayV8** - API call logging

### Phase 4: Components (Week 4)
12. All shared components
13. Integration testing
14. Documentation

---

**Summary:**
We've identified **11 reusable services** and **9 reusable components** that should be extracted. This will dramatically reduce code duplication and make future flow conversions much easier.



---

## 17. Directory Structure & Migration Plan

### 17.1 New V8 Directory Structure

**Decision:** Create dedicated `src/v8/` directory for all V8 code

**Rationale:**
- Clear separation from V7 code
- Prevents accidental V7 modifications
- Easy to identify V8 code
- Supports parallel development
- Future-proof for V9, V10, etc.

**Structure:**
```
src/v8/
├── README.md                        # V8 architecture overview
├── components/                      # Reusable V8 components
│   ├── __tests__/
│   ├── TokenDisplayV8.tsx
│   ├── ScopeManagerV8.tsx
│   ├── EducationTooltip.tsx
│   ├── QuickStartModal.tsx
│   ├── ConfigCheckerModalV8.tsx
│   ├── DiscoveryModalV8.tsx
│   ├── CredentialsModalV8.tsx
│   └── ErrorDisplay.tsx
│
├── services/                        # V8 business logic
│   ├── __tests__/
│   ├── educationServiceV8.ts
│   ├── modalManagerV8.ts
│   ├── errorHandlerV8.ts
│   ├── validationServiceV8.ts
│   ├── urlBuilderV8.ts
│   ├── storageServiceV8.ts
│   ├── apiCallDisplayV8.ts
│   ├── tokenDisplayServiceV8.ts
│   ├── scopeEducationServiceV8.ts
│   ├── configCheckerServiceV8.ts
│   └── discoveryServiceV8.ts
│
├── hooks/                           # V8 React hooks
│   ├── __tests__/
│   ├── useModalManagerV8.ts
│   ├── useEducationV8.ts
│   ├── useValidationV8.ts
│   └── useStorageV8.ts
│
├── types/                           # V8 TypeScript types
│   ├── education.ts
│   ├── modal.ts
│   ├── validation.ts
│   ├── token.ts
│   └── index.ts
│
├── utils/                           # V8 utilities
│   ├── formatters.ts
│   ├── validators.ts
│   ├── constants.ts
│   └── helpers.ts
│
└── flows/                           # V8 flow implementations
    ├── OAuthAuthorizationCodeFlowV8.tsx
    ├── ImplicitFlowV8.tsx
    └── [future: DeviceCodeV8, ClientCredentialsV8, etc.]
```

---

### 17.2 Migration Strategy

**Phase 1: Create V8 Directory Structure** ✅ DONE
```bash
mkdir -p src/v8/{components,services,hooks,types,utils,flows}/__tests__
```

**Phase 2: Move Existing V8 Flows**
```bash
# Move flows to V8 directory
mv src/pages/flows/OAuthAuthorizationCodeFlowV8.tsx src/v8/flows/
mv src/pages/flows/ImplicitFlowV8.tsx src/v8/flows/

# Update imports in App.tsx
```

**Phase 3: Extract Services**
```bash
# Create new V8 services (don't move existing V7 services)
# Build from scratch following V8 patterns
```

**Phase 4: Build Components**
```bash
# Create new V8 components
# Reuse V7 logic but with V8 UX patterns
```

**Phase 5: Update Routes**
```typescript
// Update App.tsx to import from v8 directory
const OAuthAuthorizationCodeFlowV8 = lazy(() => 
  import('@/v8/flows/OAuthAuthorizationCodeFlowV8')
);
```

---

### 17.3 Import Path Aliases

**Add to tsconfig.json:**
```json
{
  "compilerOptions": {
    "paths": {
      "@/v8/*": ["./src/v8/*"],
      "@/*": ["./src/*"]
    }
  }
}
```

**Usage:**
```typescript
// ✅ CORRECT - Clean imports
import { EducationServiceV8 } from '@/v8/services/educationServiceV8';
import { TokenDisplayV8 } from '@/v8/components/TokenDisplayV8';

// ❌ WRONG - Relative imports
import { EducationServiceV8 } from '../../v8/services/educationServiceV8';
```

---

## 18. Kiro Steering Rules

**Created:** `.kiro/steering/v8-development-rules.md`

**Purpose:** Enforce V8 development standards in Kiro IDE

**Key Rules:**
1. All V8 code must have "V8" suffix
2. All V8 code must be in `src/v8/` directory
3. Never modify V7 code when building V8
4. All V8 logs must use module tags
5. All V8 code must have tests
6. All V8 code must be documented

**Enforcement:** Kiro will automatically include these rules in all AI interactions

---

## 19. Final Implementation Plan

### Week 1: Foundation
**Day 1-2: Directory Setup & Core Services**
- [x] Create `src/v8/` directory structure
- [x] Create Kiro steering rules
- [ ] Create `educationServiceV8.ts` with all content
- [ ] Create `validationServiceV8.ts` with all rules
- [ ] Create `errorHandlerV8.ts` with error definitions
- [ ] Create `storageServiceV8.ts` with versioning

**Day 3-4: Basic Components**
- [ ] Create `EducationTooltip.tsx`
- [ ] Create `ErrorDisplay.tsx`
- [ ] Create `QuickStartModal.tsx`
- [ ] Create `ConfigExportImport.tsx`

**Day 5: Integration**
- [ ] Move existing V8 flows to `src/v8/flows/`
- [ ] Update imports in App.tsx
- [ ] Add path aliases to tsconfig.json
- [ ] Test that flows still work

### Week 2: Token & Scope UX
**Day 1-2: Token Display**
- [ ] Create `tokenDisplayServiceV8.ts`
- [ ] Create `TokenDisplayV8.tsx`
- [ ] Integrate into Authorization Code V8
- [ ] Test with OAuth and OIDC variants

**Day 3-4: Scope Management**
- [ ] Create `scopeEducationServiceV8.ts`
- [ ] Create `ScopeManagerV8.tsx`
- [ ] Add offline_access education
- [ ] Integrate into flows

**Day 5: Testing**
- [ ] Write tests for all new components
- [ ] Write tests for all new services
- [ ] Integration testing

### Week 3: Advanced Features
**Day 1-2: Config Checker**
- [ ] Create `configCheckerServiceV8.ts`
- [ ] Create `ConfigCheckerModalV8.tsx`
- [ ] Integrate into flows

**Day 3-4: Discovery & Credentials**
- [ ] Create `discoveryServiceV8.ts`
- [ ] Create `DiscoveryModalV8.tsx`
- [ ] Create `CredentialsModalV8.tsx`
- [ ] Refactor credential management

**Day 5: Polish**
- [ ] Add Quick Start presets
- [ ] Add Export/Import functionality
- [ ] Final testing
- [ ] Documentation

### Week 4: Rollout
**Day 1-2: Implicit V8**
- [ ] Apply all V8 components to Implicit flow
- [ ] Test thoroughly
- [ ] Document differences

**Day 3-4: Documentation**
- [ ] User documentation
- [ ] Developer documentation
- [ ] Migration guide

**Day 5: Release**
- [ ] Final review
- [ ] Deploy
- [ ] Monitor for issues

---

## 20. Success Criteria

### Code Quality
- [ ] All V8 code in `src/v8/` directory
- [ ] All files have "V8" suffix
- [ ] All code has tests (>80% coverage)
- [ ] All code is documented
- [ ] No V7 code modified
- [ ] All imports use path aliases
- [ ] All logging uses module tags

### Functionality
- [ ] All 15 gap analysis items addressed
- [ ] Authorization Code V8 fully functional
- [ ] Implicit V8 fully functional
- [ ] All components reusable
- [ ] All services reusable

### UX
- [ ] Simpler than V7
- [ ] More educational than V7
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Responsive design
- [ ] Fast performance

---

---

## 21. Step Navigation & Progress System (NEW)

### 21.1 Problem Statement

**Current Issues:**
- Users can click any step at any time (confusing)
- No visual indication of step completion
- No clear "Next Step" button
- Hard to know what to do next
- Can proceed with incomplete data

**V8 Solution:**
- Clear step progression (Step 0 → Step 1 → Step 2 → Step 3)
- Visual completion indicators
- Disabled "Next" buttons until step is complete
- Progress bar showing overall completion
- Clear error states blocking progress

---

### 21.2 StepNavigationV8 Component

**Purpose:** Unified step navigation with validation and progress tracking

**Props:**
```typescript
interface StepNavigationV8Props {
  currentStep: number;
  totalSteps: number;
  steps: StepDefinition[];
  onStepChange: (step: number) => void;
  allowSkip?: boolean; // Allow jumping to completed steps
}

interface StepDefinition {
  id: number;
  label: string;
  shortLabel?: string;
  description: string;
  required: boolean;
  validation: () => ValidationResult;
  completed: boolean;
  hasError: boolean;
  errorMessage?: string;
}
```

**Visual Design:**
```
┌─────────────────────────────────────────────────────────────┐
│ OAuth Authorization Code Flow                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Progress: ████████░░░░░░░░░░░░░░░░░░░░░░░░░░ 33% (1 of 3) │
│                                                              │
│ ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐ │
│ │ ✓ Step 0 │───│ ▶ Step 1 │───│   Step 2 │───│   Step 3 │ │
│ │ Config   │   │ Auth URL │   │ Callback │   │  Tokens  │ │
│ └──────────┘   └──────────┘   └──────────┘   └──────────┘ │
│   Complete       Active         Locked         Locked      │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Step 1: Generate Authorization URL                     │ │
│ │                                                         │ │
│ │ [Step content here...]                                 │ │
│ │                                                         │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ⚠️ Complete Step 0 (Configure Credentials) before          │
│    proceeding to Step 1                                     │
│                                                              │
│ [◀ Previous]                          [Next Step ▶] (disabled)│
└─────────────────────────────────────────────────────────────┘
```

**States:**
```typescript
enum StepState {
  LOCKED = 'locked',       // Cannot access yet (gray)
  AVAILABLE = 'available', // Can access (blue)
  ACTIVE = 'active',       // Currently viewing (blue + bold)
  COMPLETED = 'completed', // Finished (green + checkmark)
  ERROR = 'error'          // Has validation errors (red + warning)
}
```

---

### 21.3 Step Validation Rules

**Step 0: Configure Credentials**
```typescript
const validateStep0 = (): ValidationResult => {
  const errors: string[] = [];
  
  // Required fields
  if (!credentials.environmentId) {
    errors.push('Environment ID is required');
  }
  if (!credentials.clientId) {
    errors.push('Client ID is required');
  }
  if (!credentials.redirectUri) {
    errors.push('Redirect URI is required');
  }
  if (!credentials.scopes) {
    errors.push('At least one scope is required');
  }
  
  // Format validation
  if (credentials.environmentId && !isValidUUID(credentials.environmentId)) {
    errors.push('Environment ID must be a valid UUID');
  }
  if (credentials.redirectUri && !isValidUrl(credentials.redirectUri)) {
    errors.push('Redirect URI must be a valid URL');
  }
  
  // OIDC-specific
  if (flowType === 'oidc' && !credentials.scopes.includes('openid')) {
    errors.push('OIDC flows require the "openid" scope');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    canProceed: errors.length === 0
  };
};
```

**Step 1: Generate Authorization URL**
```typescript
const validateStep1 = (): ValidationResult => {
  const errors: string[] = [];
  
  // Must have auth URL
  if (!authorizationUrl) {
    errors.push('Authorization URL not generated');
  }
  
  // Must have PKCE codes (if enabled)
  if (credentials.usePkce && !pkceCodes.codeVerifier) {
    errors.push('PKCE codes not generated');
  }
  
  // Must have state parameter
  if (!state) {
    errors.push('State parameter not generated');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    canProceed: errors.length === 0
  };
};
```

**Step 2: Handle Callback**
```typescript
const validateStep2 = (): ValidationResult => {
  const errors: string[] = [];
  
  // Must have authorization code
  if (!authorizationCode) {
    errors.push('Authorization code not received');
  }
  
  // Must validate state
  if (callbackState !== state) {
    errors.push('State parameter mismatch (CSRF protection)');
  }
  
  // Check for errors in callback
  if (callbackError) {
    errors.push(`Authorization failed: ${callbackError}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    canProceed: errors.length === 0
  };
};
```

**Step 3: Exchange for Tokens**
```typescript
const validateStep3 = (): ValidationResult => {
  const errors: string[] = [];
  
  // Must have tokens
  if (!tokens?.access_token) {
    errors.push('Access token not received');
  }
  
  // OIDC must have ID token
  if (flowType === 'oidc' && !tokens?.id_token) {
    errors.push('ID token not received (required for OIDC)');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    canProceed: false // Final step, no "next"
  };
};
```

---

### 21.4 StepProgressBar Component

**Purpose:** Visual progress indicator

**Props:**
```typescript
interface StepProgressBarProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
}
```

**Visual Design:**
```
Progress: ████████████░░░░░░░░░░░░░░ 50% (2 of 4)

Step 0: ✓ Complete
Step 1: ✓ Complete  
Step 2: ▶ In Progress
Step 3: ⏸ Not Started
```

---

### 21.5 StepActionButtons Component

**Purpose:** Consistent navigation buttons with validation

**Props:**
```typescript
interface StepActionButtonsProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onReset?: () => void;
  nextLabel?: string;
  previousLabel?: string;
  showReset?: boolean;
}
```

**Visual Design:**
```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│ [◀ Previous]              [Reset Flow]    [Next Step ▶] │
│   (enabled)                 (enabled)       (disabled)   │
│                                                          │
│ ⚠️ Complete all required fields before proceeding       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Button States:**
```typescript
// Previous button
- Disabled on Step 0
- Enabled on Steps 1-3
- Always allows going back

// Next button  
- Disabled until step validation passes
- Shows tooltip explaining what's missing
- Changes label on final step ("Finish" instead of "Next")

// Reset button
- Always enabled
- Shows confirmation modal
- Clears all data and returns to Step 0
```

---

### 21.6 StepValidationFeedback Component

**Purpose:** Show validation errors blocking progress

**Props:**
```typescript
interface StepValidationFeedbackProps {
  validation: ValidationResult;
  step: number;
}
```

**Visual Design:**
```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ Cannot proceed to next step                          │
│                                                          │
│ Please fix the following issues:                        │
│ • Environment ID is required                            │
│ • Redirect URI must be a valid URL                      │
│ • OIDC flows require the "openid" scope                 │
│                                                          │
│ [Fix Issues in Step 0]                                  │
└─────────────────────────────────────────────────────────┘
```

---

### 21.7 Implementation in Flow Components

**Update OAuthAuthorizationCodeFlowV8:**
```tsx
const OAuthAuthorizationCodeFlowV8: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Define steps with validation
  const steps: StepDefinition[] = [
    {
      id: 0,
      label: 'Configure Credentials',
      shortLabel: 'Config',
      description: 'Set up your OAuth/OIDC application credentials',
      required: true,
      validation: validateStep0,
      completed: isStep0Complete(),
      hasError: false
    },
    {
      id: 1,
      label: 'Generate Authorization URL',
      shortLabel: 'Auth URL',
      description: 'Create the URL to redirect users for authentication',
      required: true,
      validation: validateStep1,
      completed: isStep1Complete(),
      hasError: false
    },
    {
      id: 2,
      label: 'Handle Callback',
      shortLabel: 'Callback',
      description: 'Process the authorization code from the callback',
      required: true,
      validation: validateStep2,
      completed: isStep2Complete(),
      hasError: false
    },
    {
      id: 3,
      label: 'Exchange for Tokens',
      shortLabel: 'Tokens',
      description: 'Exchange authorization code for access tokens',
      required: true,
      validation: validateStep3,
      completed: isStep3Complete(),
      hasError: false
    }
  ];
  
  // Validate current step
  const currentValidation = steps[currentStep].validation();
  
  // Handle step change
  const handleStepChange = (newStep: number) => {
    // Can always go back
    if (newStep < currentStep) {
      setCurrentStep(newStep);
      return;
    }
    
    // Can only go forward if current step is valid
    if (currentValidation.canProceed) {
      setCurrentStep(newStep);
    } else {
      v4ToastManager.showError(
        'Please complete the current step before proceeding'
      );
    }
  };
  
  return (
    <div className="flow-container">
      {/* Progress Bar */}
      <StepProgressBar
        currentStep={currentStep}
        totalSteps={steps.length}
        completedSteps={steps.filter(s => s.completed).map(s => s.id)}
      />
      
      {/* Step Navigation */}
      <StepNavigationV8
        currentStep={currentStep}
        totalSteps={steps.length}
        steps={steps}
        onStepChange={handleStepChange}
        allowSkip={false}
      />
      
      {/* Step Content */}
      <div className="step-content">
        {currentStep === 0 && <Step0ConfigureCredentials />}
        {currentStep === 1 && <Step1GenerateAuthUrl />}
        {currentStep === 2 && <Step2HandleCallback />}
        {currentStep === 3 && <Step3ExchangeTokens />}
      </div>
      
      {/* Validation Feedback */}
      {!currentValidation.valid && (
        <StepValidationFeedback
          validation={currentValidation}
          step={currentStep}
        />
      )}
      
      {/* Action Buttons */}
      <StepActionButtons
        currentStep={currentStep}
        totalSteps={steps.length}
        canProceed={currentValidation.canProceed}
        onPrevious={() => handleStepChange(currentStep - 1)}
        onNext={() => handleStepChange(currentStep + 1)}
        onReset={handleReset}
        showReset={true}
      />
    </div>
  );
};
```

---

### 21.8 Accessibility Features

**Keyboard Navigation:**
```typescript
// Arrow keys to navigate steps
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && currentStep > 0) {
      handleStepChange(currentStep - 1);
    }
    if (e.key === 'ArrowRight' && currentValidation.canProceed) {
      handleStepChange(currentStep + 1);
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [currentStep, currentValidation]);
```

**Screen Reader Support:**
```tsx
<nav aria-label="Flow steps">
  <ol>
    {steps.map(step => (
      <li key={step.id}>
        <button
          aria-current={step.id === currentStep ? 'step' : undefined}
          aria-disabled={!canAccessStep(step.id)}
          aria-label={`${step.label}. ${step.completed ? 'Completed' : 'Not completed'}`}
        >
          {step.label}
        </button>
      </li>
    ))}
  </ol>
</nav>
```

---

### 21.9 Visual States

**Step Indicator Colors:**
```css
/* Locked - Cannot access yet */
.step-locked {
  background: #e0e0e0;
  color: #9e9e9e;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Available - Can access */
.step-available {
  background: #2196f3;
  color: white;
  cursor: pointer;
}

/* Active - Currently viewing */
.step-active {
  background: #1976d2;
  color: white;
  font-weight: bold;
  border: 2px solid #0d47a1;
}

/* Completed - Finished */
.step-completed {
  background: #4caf50;
  color: white;
  cursor: pointer;
}

/* Error - Has validation errors */
.step-error {
  background: #f44336;
  color: white;
  cursor: pointer;
}
```

**Next Button States:**
```css
/* Disabled - Cannot proceed */
.next-button:disabled {
  background: #e0e0e0;
  color: #9e9e9e;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Enabled - Can proceed */
.next-button:enabled {
  background: #2196f3;
  color: white;
  cursor: pointer;
}

/* Hover - Interactive feedback */
.next-button:enabled:hover {
  background: #1976d2;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
```

---

### 21.10 Tooltip on Disabled Next Button

**Purpose:** Explain why "Next" is disabled

```tsx
<Tooltip
  content={
    <div>
      <strong>Cannot proceed</strong>
      <ul>
        {currentValidation.errors.map(error => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </div>
  }
  placement="top"
>
  <button disabled={!currentValidation.canProceed}>
    Next Step ▶
  </button>
</Tooltip>
```

---

### 21.11 Auto-Advance Option

**Purpose:** Automatically move to next step when current step completes

```typescript
interface StepNavigationV8Props {
  // ... other props
  autoAdvance?: boolean; // Auto-advance when step completes
  autoAdvanceDelay?: number; // Delay in ms (default: 1000)
}

// Implementation
useEffect(() => {
  if (autoAdvance && currentValidation.valid && currentStep < totalSteps - 1) {
    const timer = setTimeout(() => {
      handleStepChange(currentStep + 1);
      v4ToastManager.showSuccess('Step completed! Moving to next step...');
    }, autoAdvanceDelay || 1000);
    
    return () => clearTimeout(timer);
  }
}, [currentValidation.valid, currentStep]);
```

---

### 21.12 Step Completion Persistence

**Purpose:** Remember completed steps across page refreshes

```typescript
// Save step completion state
const saveStepProgress = () => {
  StorageServiceV8.save('step-progress', {
    flowKey: 'authz-code-v8',
    currentStep,
    completedSteps: steps.filter(s => s.completed).map(s => s.id),
    timestamp: Date.now()
  }, 1);
};

// Load step progress
const loadStepProgress = () => {
  const progress = StorageServiceV8.load('step-progress');
  if (progress && progress.flowKey === 'authz-code-v8') {
    setCurrentStep(progress.currentStep);
    // Restore completed steps
  }
};
```

---

### 21.13 Mobile-Responsive Design

**Desktop:**
```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ ✓ Step 0 │───│ ▶ Step 1 │───│   Step 2 │───│   Step 3 │
│ Config   │   │ Auth URL │   │ Callback │   │  Tokens  │
└──────────┘   └──────────┘   └──────────┘   └──────────┘
```

**Mobile:**
```
┌─────────────────┐
│ Step 1 of 4     │
│ ▶ Auth URL      │
│                 │
│ ✓ Step 0        │
│ ▶ Step 1 (You)  │
│ ⏸ Step 2        │
│ ⏸ Step 3        │
└─────────────────┘
```

---

### 21.14 Updated Implementation Priority

**Week 1: Foundation + Navigation**
- Day 1-2: Core services (education, validation, error, storage)
- Day 3: **StepNavigationV8 system** ⭐ NEW
- Day 4: Basic components (tooltips, error display)
- Day 5: Integration testing

**Benefits:**
- Clear user guidance
- Prevents errors from incomplete data
- Better UX than V7
- Accessible and responsive
- Reusable across all V8 flows

---

**Status:** Design Complete - Ready for Implementation  
**Next Step:** Begin Week 1, Day 1 - Create core services + step navigation system
