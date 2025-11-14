# FlowStorageService Migration Guide

## Overview

This guide documents the migration from direct `sessionStorage`/`localStorage` calls to the centralized `FlowStorageService`. The migration standardizes storage keys, adds type safety, and provides a consistent API across all OAuth/OIDC flows.

## Table of Contents

1. [Why Migrate?](#why-migrate)
2. [Before & After Examples](#before--after-examples)
3. [Migration Status](#migration-status)
4. [How to Migrate a Flow](#how-to-migrate-a-flow)
5. [Storage Classes Reference](#storage-classes-reference)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Why Migrate?

### Problems with Direct Storage Calls

- **🔴 100+ unique storage keys** across the codebase
- **🔴 No type safety** - typos cause silent failures
- **🔴 Inconsistent naming** - `oauth_auth_code` vs `oidc_auth_code` vs `oauth-authz-v6-auth-code`
- **🔴 Manual expiration checks** scattered throughout code
- **🔴 Hard to debug** - no centralized logging
- **🔴 Cleanup is manual** and often forgotten

### Benefits of FlowStorageService

- **✅ ~20 standardized keys** (from 100+)
- **✅ Full TypeScript type safety**
- **✅ Consistent naming** across all flows
- **✅ Automatic expiration handling**
- **✅ Centralized logging** for debugging
- **✅ Automatic cleanup utilities**
- **✅ Single source of truth** for storage operations

---

## Before & After Examples

### Example 1: Storing an Authorization Code

#### ❌ Before (Direct Storage)
```typescript
// Inconsistent keys, no type safety, manual management
sessionStorage.setItem('oauth_auth_code', authCode);
// or
sessionStorage.setItem('oidc_auth_code', authCode);
// or
sessionStorage.setItem('oauth-authorization-code-v6-auth-code', authCode);
```

#### ✅ After (FlowStorageService)
```typescript
import FlowStorageService from '../services/flowStorageService';

// Type-safe, consistent, automatic logging
FlowStorageService.AuthCode.set('oauth-authz-v6', authCode);
// or
FlowStorageService.AuthCode.set('oidc-authz-v6', authCode);
```

### Example 2: Managing PKCE Values

#### ❌ Before (Direct Storage)
```typescript
// Manual management, easy to forget cleanup
const codeVerifier = generateCodeVerifier();
const codeChallenge = await generateCodeChallenge(codeVerifier);
sessionStorage.setItem('code_verifier', codeVerifier);
sessionStorage.setItem('code_challenge', codeChallenge);

// Later...
const storedVerifier = sessionStorage.getItem('code_verifier');
// Manual cleanup
sessionStorage.removeItem('code_verifier');
sessionStorage.removeItem('code_challenge');
```

#### ✅ After (FlowStorageService)
```typescript
import FlowStorageService from '../services/flowStorageService';

// Automatic management with utilities
const pkce = FlowStorageService.PKCE.set('oauth-authz-v6', {
  codeVerifier,
  codeChallenge,
  codeChallengeMethod: 'S256'
});

// Later...
const storedPKCE = FlowStorageService.PKCE.get('oauth-authz-v6');

// Automatic cleanup
FlowStorageService.PKCE.remove('oauth-authz-v6');
```

### Example 3: Retrieving Current Step

#### ❌ Before (Direct Storage)
```typescript
// Parsing, null checks, type conversion all manual
const storedStep = sessionStorage.getItem('oauth-authorization-code-v6-current-step');
const currentStep = storedStep ? parseInt(storedStep, 10) : 0;
```

#### ✅ After (FlowStorageService)
```typescript
import FlowStorageService from '../services/flowStorageService';

// Type-safe, automatic parsing, with default fallback
const currentStep = FlowStorageService.FlowState.getCurrentStep('oauth-authz-v6') ?? 0;
```

### Example 4: Token Management

#### ❌ Before (Direct Storage)
```typescript
// Multiple storage keys, manual serialization
sessionStorage.setItem('pingone_secure_tokens', JSON.stringify(tokens));
localStorage.setItem('oauth_tokens', JSON.stringify(tokens));

// Later...
const storedTokens = sessionStorage.getItem('pingone_secure_tokens') || 
                     localStorage.getItem('oauth_tokens');
const tokens = storedTokens ? JSON.parse(storedTokens) : null;
```

#### ✅ After (FlowStorageService)
```typescript
import FlowStorageService from '../services/flowStorageService';

// Single, consistent API
FlowStorageService.Tokens.set('oauth-authz-v6', tokens);

// Later...
const tokens = FlowStorageService.Tokens.get('oauth-authz-v6');
```

---

## Migration Status

### ✅ Completed Migrations

| Flow | Storage Calls Migrated | Status |
|------|------------------------|--------|
| OAuth Authorization Code V6 | 14 | ✅ Complete |
| OIDC Authorization Code V6 | 8 (partial) | ✅ Complete (key operations) |
| Device Authorization Flow V6 | 5 | ✅ Complete |
| PAR Flow V6 | 7 | ✅ Complete |
| RAR Flow V6 | 7 | ✅ Complete |
| OAuth Implicit V6 | 0 | ✅ N/A (uses controllers) |
| OIDC Implicit V6 | 0 | ✅ N/A (uses controllers) |

**Total: 41 storage operations standardized**

### ⏭️ Deferred / Not Applicable

| Component | Reason | Status |
|-----------|--------|--------|
| NewAuthContext | Complex legacy component (37 calls), working as-is | ⏭️ Deferred |
| Callback Components | Already use services, temporary storage only | ⏭️ N/A |

### 🔄 Remaining Work

| Task | Priority | Complexity |
|------|----------|------------|
| Complete OIDC Authorization Code V6 migration | Medium | Low |
| Add FlowStorageService to remaining flows | Low | Low |
| Create automated migration script | Low | Medium |

---

## How to Migrate a Flow

### Step-by-Step Process

#### 1. Import FlowStorageService

```typescript
import FlowStorageService from '../../services/flowStorageService';
```

#### 2. Identify the Flow Key

Each flow has a standardized key:

| Flow | Key |
|------|-----|
| OAuth Authorization Code V6 | `'oauth-authz-v6'` |
| OIDC Authorization Code V6 | `'oidc-authz-v6'` |
| OAuth Implicit V6 | `'oauth-implicit-v6'` |
| OIDC Implicit V6 | `'oidc-implicit-v6'` |
| Device Authorization V6 | `'device-authz-v6'` |
| PAR V6 | `'par-v6'` |
| RAR V6 | `'rar-v6'` |
| JWT Bearer V6 | `'jwt-bearer-v6'` |
| SAML Bearer V6 | `'saml-bearer-v6'` |
| Client Credentials V6 | `'client-credentials-v6'` |
| OIDC Hybrid V6 | `'oidc-hybrid-v6'` |
| ROPC V6 | `'ropc-v6'` |
| Redirectless V6 | `'redirectless-v6'` |
| PingOne Enhanced V2 | `'pingone-enhanced-v2'` |

#### 3. Replace Storage Calls

Use the appropriate storage class based on what you're storing:

```typescript
// Authorization Code
sessionStorage.getItem('oauth_auth_code')
// becomes
FlowStorageService.AuthCode.get('oauth-authz-v6')

// Current Step
sessionStorage.setItem('oauth-authorization-code-v6-current-step', '2')
// becomes
FlowStorageService.FlowState.setCurrentStep('oauth-authz-v6', 2)

// PKCE
sessionStorage.getItem('code_verifier')
// becomes
FlowStorageService.PKCE.get('oauth-authz-v6')?.codeVerifier

// State
sessionStorage.setItem('oauth_state', state)
// becomes
FlowStorageService.State.set('oauth-authz-v6', state)

// Tokens
sessionStorage.setItem('pingone_secure_tokens', JSON.stringify(tokens))
// becomes
FlowStorageService.Tokens.set('oauth-authz-v6', tokens)
```

#### 4. Test the Migration

1. Clear all browser storage (`localStorage.clear()`, `sessionStorage.clear()`)
2. Run the flow from start to finish
3. Check that:
   - Flow state persists across page refreshes
   - Tokens are stored and retrieved correctly
   - Step navigation works
   - Cleanup (Reset Flow / Start Over) works

#### 5. Verify Console Logs

FlowStorageService automatically logs all operations. Check the console for:

```
💾 [Storage Service] Stored auth code for flow: oauth-authz-v6
📖 [Storage Service] Retrieved auth code for flow: oauth-authz-v6
🧹 [Storage Service] Removed auth code for flow: oauth-authz-v6
```

---

## Storage Classes Reference

### 1. AuthCode

Manages authorization codes from OAuth/OIDC redirects.

```typescript
// Set
FlowStorageService.AuthCode.set('oauth-authz-v6', 'code_abc123');

// Get
const code = FlowStorageService.AuthCode.get('oauth-authz-v6');
// Returns: string | null

// Remove
FlowStorageService.AuthCode.remove('oauth-authz-v6');
```

**Storage Key Pattern**: `{flowKey}-auth-code`  
**Example**: `oauth-authz-v6-auth-code`

---

### 2. DeviceCode

Manages device authorization codes and user codes.

```typescript
// Set
FlowStorageService.DeviceCode.set('device-authz-v6', {
  device_code: 'GmRhmhcxhwAzkoEqiMEg_DnyEysNkuNhszIySk9eS',
  user_code: 'WDJB-MJHT',
  verification_uri: 'https://example.com/device',
  verification_uri_complete: 'https://example.com/device?user_code=WDJB-MJHT',
  expires_in: 600,
  interval: 5
});

// Get
const deviceData = FlowStorageService.DeviceCode.get('device-authz-v6');
// Returns: DeviceCodeData | null

// Remove
FlowStorageService.DeviceCode.remove('device-authz-v6');
```

**Storage Key Pattern**: `{flowKey}-device-code`  
**Example**: `device-authz-v6-device-code`

---

### 3. State

Manages OAuth state parameters for CSRF protection.

```typescript
// Set
FlowStorageService.State.set('oauth-authz-v6', 'random_state_abc123');

// Get
const state = FlowStorageService.State.get('oauth-authz-v6');
// Returns: string | null

// Remove
FlowStorageService.State.remove('oauth-authz-v6');
```

**Storage Key Pattern**: `{flowKey}-state`  
**Example**: `oauth-authz-v6-state`

---

### 4. PKCE

Manages PKCE (Proof Key for Code Exchange) values.

```typescript
// Set
FlowStorageService.PKCE.set('oauth-authz-v6', {
  codeVerifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
  codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
  codeChallengeMethod: 'S256'
});

// Get
const pkce = FlowStorageService.PKCE.get('oauth-authz-v6');
// Returns: { codeVerifier: string, codeChallenge: string, codeChallengeMethod: string } | null

// Remove
FlowStorageService.PKCE.remove('oauth-authz-v6');
```

**Storage Key Pattern**: `{flowKey}-pkce`  
**Example**: `oauth-authz-v6-pkce`

---

### 5. FlowState

Manages flow-specific state (current step, configuration).

```typescript
// Set current step
FlowStorageService.FlowState.setCurrentStep('oauth-authz-v6', 2);

// Get current step
const step = FlowStorageService.FlowState.getCurrentStep('oauth-authz-v6');
// Returns: number | null

// Set flow config
FlowStorageService.FlowState.setConfig('oauth-authz-v6', {
  usePKCE: true,
  responseType: 'code',
  scopes: ['openid', 'profile', 'email']
});

// Get flow config
const config = FlowStorageService.FlowState.getConfig('oauth-authz-v6');
// Returns: FlowConfig | null

// Remove current step
FlowStorageService.FlowState.removeCurrentStep('oauth-authz-v6');

// Remove config
FlowStorageService.FlowState.removeConfig('oauth-authz-v6');
```

**Storage Key Patterns**:
- Current Step: `{flowKey}-current-step`
- Config: `{flowKey}-config`

**Examples**:
- `oauth-authz-v6-current-step`
- `oauth-authz-v6-config`

---

### 6. Credentials

Manages flow credentials (client ID, environment ID, etc.).

```typescript
// Set
FlowStorageService.Credentials.set('oauth-authz-v6', {
  environmentId: 'abc-123-def',
  clientId: 'my-client-id',
  clientSecret: 'my-client-secret',
  redirectUri: 'https://localhost:3000/callback',
  scopes: 'openid profile email'
});

// Get
const credentials = FlowStorageService.Credentials.get('oauth-authz-v6');
// Returns: FlowCredentials | null

// Remove
FlowStorageService.Credentials.remove('oauth-authz-v6');
```

**Storage Key Pattern**: `{flowKey}-credentials`  
**Example**: `oauth-authz-v6-credentials`

---

### 7. Tokens

Manages OAuth/OIDC tokens (access, refresh, ID tokens).

```typescript
// Set
FlowStorageService.Tokens.set('oauth-authz-v6', {
  access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
  token_type: 'Bearer',
  expires_in: 3600,
  refresh_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
  id_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
  scope: 'openid profile email'
});

// Get
const tokens = FlowStorageService.Tokens.get('oauth-authz-v6');
// Returns: OAuthTokens | null

// Remove
FlowStorageService.Tokens.remove('oauth-authz-v6');
```

**Storage Key Pattern**: `{flowKey}-tokens`  
**Example**: `oauth-authz-v6-tokens`

---

### 8. Navigation

Manages navigation state for flow transitions.

```typescript
// Set flow source (where we came from)
FlowStorageService.Navigation.setFlowSource('oauth-authz-v6');

// Get flow source
const source = FlowStorageService.Navigation.getFlowSource();
// Returns: FlowKey | null

// Set flow context (additional metadata)
FlowStorageService.Navigation.setFlowContext({
  returnUrl: '/dashboard',
  previousStep: 2,
  metadata: { /* ... */ }
});

// Get flow context
const context = FlowStorageService.Navigation.getFlowContext();
// Returns: FlowContext | null

// Set token to analyze
FlowStorageService.Navigation.setTokenToAnalyze('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...');

// Get token to analyze
const token = FlowStorageService.Navigation.getTokenToAnalyze();
// Returns: string | null

// Remove all navigation data
FlowStorageService.Navigation.removeFlowSource();
FlowStorageService.Navigation.removeFlowContext();
FlowStorageService.Navigation.removeTokenToAnalyze();
```

**Storage Key Patterns**:
- Flow Source: `flow_source`
- Flow Context: `tokenManagementFlowContext`
- Token to Analyze: `token_to_analyze`

---

### 9. Cleanup

Utilities for cleaning up storage.

```typescript
// Remove all storage for a specific flow
FlowStorageService.Cleanup.removeAllForFlow('oauth-authz-v6');

// Remove all storage for all flows (nuclear option)
FlowStorageService.Cleanup.removeAll();
```

---

## Best Practices

### 1. Always Use Type-Safe Methods

✅ **Do:**
```typescript
const step = FlowStorageService.FlowState.getCurrentStep('oauth-authz-v6') ?? 0;
```

❌ **Don't:**
```typescript
const step = parseInt(sessionStorage.getItem('oauth-authz-v6-current-step') || '0');
```

### 2. Use the Correct Flow Key

✅ **Do:**
```typescript
// In OAuth Authorization Code V6 flow
FlowStorageService.AuthCode.set('oauth-authz-v6', code);
```

❌ **Don't:**
```typescript
// Wrong flow key!
FlowStorageService.AuthCode.set('oidc-authz-v6', code);
```

### 3. Clean Up When Done

✅ **Do:**
```typescript
const handleReset = () => {
  FlowStorageService.Cleanup.removeAllForFlow('oauth-authz-v6');
  navigate('/flows/oauth-authorization-code-v6');
};
```

❌ **Don't:**
```typescript
// Forget to clean up - leads to stale data
navigate('/flows/oauth-authorization-code-v6');
```

### 4. Use Null Coalescing for Defaults

✅ **Do:**
```typescript
const step = FlowStorageService.FlowState.getCurrentStep('oauth-authz-v6') ?? 0;
const state = FlowStorageService.State.get('oauth-authz-v6') ?? generateState();
```

❌ **Don't:**
```typescript
const step = FlowStorageService.FlowState.getCurrentStep('oauth-authz-v6') || 0; // Wrong for step 0!
```

### 5. Log Important Operations

```typescript
const code = FlowStorageService.AuthCode.get('oauth-authz-v6');
if (code) {
  console.log('✅ [MyFlow] Authorization code retrieved:', code.substring(0, 10) + '...');
} else {
  console.warn('⚠️ [MyFlow] No authorization code found in storage');
}
```

---

## Troubleshooting

### Problem: Storage data not persisting across refreshes

**Solution**: Ensure you're using the correct storage (sessionStorage vs localStorage):
- `FlowStorageService` uses `sessionStorage` by default
- Use the `Credentials` class for `localStorage` (persists across sessions)

### Problem: "Cannot read property 'codeVerifier' of null"

**Solution**: Always check for null before accessing nested properties:

```typescript
const pkce = FlowStorageService.PKCE.get('oauth-authz-v6');
if (pkce?.codeVerifier) {
  // Safe to use pkce.codeVerifier
}
```

### Problem: Old keys still present in storage

**Solution**: Use the cleanup utilities or clear storage manually:

```typescript
// Clean up specific flow
FlowStorageService.Cleanup.removeAllForFlow('oauth-authz-v6');

// Or clear all storage (dev only)
sessionStorage.clear();
localStorage.clear();
```

### Problem: "Flow key not found" errors

**Solution**: Ensure you're using a valid flow key from the supported list (see [Step 2](#2-identify-the-flow-key) above).

### Problem: Tokens not showing after redirect

**Solution**: Check console logs for storage operations. Ensure tokens are being set before navigation:

```typescript
// Set tokens BEFORE navigating
FlowStorageService.Tokens.set('oauth-authz-v6', tokens);
console.log('✅ Tokens stored:', tokens);

// THEN navigate
setCurrentStep(5);
```

---

## Additional Resources

- **FlowStorageService Source**: `src/services/flowStorageService.ts`
- **Storage Standardization Plan**: `STORAGE_STANDARDIZATION_PLAN.md`
- **Example Migration**: `src/pages/flows/OAuthAuthorizationCodeFlowV6.tsx`

---

## Questions or Issues?

If you encounter issues during migration or have questions:

1. Check the console for `[Storage Service]` logs
2. Review this guide's [Troubleshooting](#troubleshooting) section
3. Look at completed migrations for examples
4. Reach out to the development team

---

**Last Updated**: October 13, 2025  
**Version**: 1.0.0

