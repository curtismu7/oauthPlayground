# 🗄️ Storage Standardization Plan

## Date: October 13, 2025
## Status: 📋 **PLANNING**

---

## 🚨 **Problem Statement**

**Current State**: 681 storage operations across 66 files with **NO standardization**

### **Evidence of Chaos:**

#### **Auth Code Keys (32 different variations!):**
```typescript
// Just for auth codes, we have:
'auth_code'
'oauth_auth_code'
'oidc_auth_code'
'oauth_v3_auth_code'
'oidc_v3_auth_code'
'oauth-authorization-code-v6-authCode'
'oidc-authorization-code-v6-authCode'
'par-flow-authCode'
'rar-flow-authCode'
'processed_auth_code'
// ... and MORE!
```

#### **State Keys (16 different variations!):**
```typescript
'state'
'oauth_state'
'oidc_state'
'oauth_v3_state'
'oidc_v3_state'
'oidc-v3-flow-state'
'hybrid_state'
'logout_state'
// ... and MORE!
```

### **Impact:**
- ❌ Flows can't find each other's data
- ❌ Difficult to debug (which key has the data?)
- ❌ Code duplication across flows
- ❌ Naming inconsistencies (snake_case vs kebab-case vs camelCase)
- ❌ No type safety
- ❌ No centralized cleanup

---

## 🎯 **Goals**

1. ✅ **Standardize** all storage keys with consistent naming
2. ✅ **Centralize** storage logic in a service
3. ✅ **Type Safety** for all stored data
4. ✅ **Flow-Specific** namespacing with consistent patterns
5. ✅ **Easy Migration** path for existing flows
6. ✅ **Clear Documentation** of storage schema

---

## 📊 **Current Storage Audit**

### **Storage Types in Use:**

| Storage Type | Count | Usage |
|--------------|-------|-------|
| **sessionStorage** | ~450 | Auth codes, PKCE, state, current step, temp data |
| **localStorage** | ~231 | Credentials, tokens, user info, persistent config |

### **Data Categories Stored:**

| Category | Examples | Current Keys (Sample) |
|----------|----------|----------------------|
| **Auth Codes** | Authorization codes | `oauth_auth_code`, `oidc_auth_code`, `[flow]-authCode` |
| **State** | OAuth state parameter | `oauth_state`, `oidc_state`, `state` |
| **PKCE** | Code verifier/challenge | `pkce_code_verifier`, `oauth_v3_code_verifier`, `[flow]-pkce-codes` |
| **Tokens** | Access, refresh, ID tokens | `pingone_secure_tokens`, `oauth_tokens`, `auth_tokens` |
| **Credentials** | Client ID, secret, etc. | `[flow]-credentials`, `device_flow_credentials` |
| **Flow State** | Current step, config | `[flow]-current-step`, `[flow]-app-config` |
| **User Info** | User profile data | `user_info`, `userInfo` |
| **Timestamps** | Callback times, expiry | `oidc_auth_code_timestamp`, `callback_timestamp` |
| **Navigation** | Return paths, flow context | `restore_step`, `flowContext`, `flow_navigation_state` |

---

## 🏗️ **Proposed Solution: FlowStorageService**

### **Architecture:**

```typescript
FlowStorageService
├── SessionStorage (temporary data)
│   ├── AuthCodes (flow-specific)
│   ├── State (flow-specific)
│   ├── PKCE (flow-specific)
│   ├── Navigation (flow context, return paths)
│   └── Timestamps (callback times)
│
└── LocalStorage (persistent data)
    ├── Credentials (flow-specific)
    ├── Tokens (secure storage)
    ├── Configuration (flow config)
    └── UserInfo (user profile)
```

---

## 📐 **Standardized Key Naming Convention**

### **Pattern:**
```
{storage-type}:{flow-id}:{data-type}:{sub-type?}
```

### **Examples:**

#### **Session Storage (Temporary):**
```typescript
// Auth Codes
'session:oauth-authz-v6:auth-code'
'session:oidc-authz-v6:auth-code'
'session:device-auth:device-code'

// State
'session:oauth-authz-v6:state'
'session:oidc-authz-v6:state'

// PKCE
'session:oauth-authz-v6:pkce:verifier'
'session:oauth-authz-v6:pkce:challenge'

// Flow State
'session:oauth-authz-v6:current-step'
'session:oidc-authz-v6:current-step'

// Navigation
'session:global:flow-context'
'session:global:return-path'
'session:global:restore-step'
```

#### **Local Storage (Persistent):**
```typescript
// Credentials
'local:oauth-authz-v6:credentials'
'local:oidc-authz-v6:credentials'
'local:device-auth:credentials'

// Tokens
'local:secure:access-token'
'local:secure:refresh-token'
'local:secure:id-token'

// Configuration
'local:oauth-authz-v6:config'
'local:oidc-authz-v6:config'

// User Info
'local:global:user-info'
```

---

## 🎨 **Service Design**

### **File:** `src/services/flowStorageService.ts`

```typescript
/**
 * Flow Storage Service
 * Centralized storage management for OAuth/OIDC flows
 */

// ============================================
// Type Definitions
// ============================================

export type FlowId = 
  | 'oauth-authz-v6'
  | 'oidc-authz-v6'
  | 'oauth-implicit-v6'
  | 'oidc-implicit-v6'
  | 'device-auth'
  | 'client-credentials'
  | 'jwt-bearer'
  | 'saml-bearer'
  | 'par'
  | 'rar'
  | 'redirectless';

export interface AuthCodeData {
  code: string;
  timestamp: number;
  expiresAt?: number;
}

export interface StateData {
  state: string;
  timestamp: number;
}

export interface PKCEData {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256' | 'plain';
}

export interface TokenData {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

export interface CredentialsData {
  environmentId: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes: string;
  [key: string]: any;
}

export interface FlowNavigationData {
  flowId: FlowId;
  currentStep: number;
  returnPath?: string;
  context?: Record<string, any>;
}

// ============================================
// Storage Keys
// ============================================

class StorageKeys {
  // Auth Codes
  static authCode(flowId: FlowId): string {
    return `session:${flowId}:auth-code`;
  }

  // State
  static state(flowId: FlowId): string {
    return `session:${flowId}:state`;
  }

  // PKCE
  static pkceVerifier(flowId: FlowId): string {
    return `session:${flowId}:pkce:verifier`;
  }

  static pkceChallenge(flowId: FlowId): string {
    return `session:${flowId}:pkce:challenge`;
  }

  static pkceMethod(flowId: FlowId): string {
    return `session:${flowId}:pkce:method`;
  }

  // Flow State
  static currentStep(flowId: FlowId): string {
    return `session:${flowId}:current-step`;
  }

  // Credentials
  static credentials(flowId: FlowId): string {
    return `local:${flowId}:credentials`;
  }

  // Tokens
  static tokens(): string {
    return 'local:secure:tokens';
  }

  // User Info
  static userInfo(): string {
    return 'local:global:user-info';
  }

  // Navigation
  static flowContext(): string {
    return 'session:global:flow-context';
  }

  static returnPath(): string {
    return 'session:global:return-path';
  }

  static restoreStep(): string {
    return 'session:global:restore-step';
  }
}

// ============================================
// Auth Code Management
// ============================================

export class AuthCodeStorage {
  /**
   * Store authorization code for a flow
   */
  static set(flowId: FlowId, code: string): void {
    const data: AuthCodeData = {
      code,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(StorageKeys.authCode(flowId), JSON.stringify(data));
    console.log(`🔑 [FlowStorage] Stored auth code for ${flowId}`);
  }

  /**
   * Get authorization code for a flow
   */
  static get(flowId: FlowId): string | null {
    const stored = sessionStorage.getItem(StorageKeys.authCode(flowId));
    if (!stored) return null;

    try {
      const data: AuthCodeData = JSON.parse(stored);
      return data.code;
    } catch (e) {
      console.warn(`[FlowStorage] Failed to parse auth code for ${flowId}`, e);
      return null;
    }
  }

  /**
   * Remove authorization code for a flow
   */
  static remove(flowId: FlowId): void {
    sessionStorage.removeItem(StorageKeys.authCode(flowId));
    console.log(`🗑️ [FlowStorage] Removed auth code for ${flowId}`);
  }

  /**
   * Check if auth code exists and is fresh (< 5 minutes old)
   */
  static isFresh(flowId: FlowId, maxAgeMs: number = 5 * 60 * 1000): boolean {
    const stored = sessionStorage.getItem(StorageKeys.authCode(flowId));
    if (!stored) return false;

    try {
      const data: AuthCodeData = JSON.parse(stored);
      const age = Date.now() - data.timestamp;
      return age < maxAgeMs;
    } catch (e) {
      return false;
    }
  }
}

// ============================================
// State Management
// ============================================

export class StateStorage {
  static set(flowId: FlowId, state: string): void {
    const data: StateData = {
      state,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(StorageKeys.state(flowId), JSON.stringify(data));
  }

  static get(flowId: FlowId): string | null {
    const stored = sessionStorage.getItem(StorageKeys.state(flowId));
    if (!stored) return null;

    try {
      const data: StateData = JSON.parse(stored);
      return data.state;
    } catch (e) {
      return null;
    }
  }

  static remove(flowId: FlowId): void {
    sessionStorage.removeItem(StorageKeys.state(flowId));
  }
}

// ============================================
// PKCE Management
// ============================================

export class PKCEStorage {
  static set(flowId: FlowId, pkce: PKCEData): void {
    sessionStorage.setItem(StorageKeys.pkceVerifier(flowId), pkce.codeVerifier);
    sessionStorage.setItem(StorageKeys.pkceChallenge(flowId), pkce.codeChallenge);
    sessionStorage.setItem(StorageKeys.pkceMethod(flowId), pkce.codeChallengeMethod);
    console.log(`🔐 [FlowStorage] Stored PKCE for ${flowId}`);
  }

  static get(flowId: FlowId): PKCEData | null {
    const verifier = sessionStorage.getItem(StorageKeys.pkceVerifier(flowId));
    const challenge = sessionStorage.getItem(StorageKeys.pkceChallenge(flowId));
    const method = sessionStorage.getItem(StorageKeys.pkceMethod(flowId)) as 'S256' | 'plain' | null;

    if (!verifier || !challenge) return null;

    return {
      codeVerifier: verifier,
      codeChallenge: challenge,
      codeChallengeMethod: method || 'S256',
    };
  }

  static remove(flowId: FlowId): void {
    sessionStorage.removeItem(StorageKeys.pkceVerifier(flowId));
    sessionStorage.removeItem(StorageKeys.pkceChallenge(flowId));
    sessionStorage.removeItem(StorageKeys.pkceMethod(flowId));
  }
}

// ============================================
// Flow State Management
// ============================================

export class FlowStateStorage {
  static setCurrentStep(flowId: FlowId, step: number): void {
    sessionStorage.setItem(StorageKeys.currentStep(flowId), step.toString());
  }

  static getCurrentStep(flowId: FlowId): number | null {
    const stored = sessionStorage.getItem(StorageKeys.currentStep(flowId));
    if (!stored) return null;
    const parsed = parseInt(stored, 10);
    return isNaN(parsed) ? null : parsed;
  }

  static removeCurrentStep(flowId: FlowId): void {
    sessionStorage.removeItem(StorageKeys.currentStep(flowId));
  }
}

// ============================================
// Credentials Management
// ============================================

export class CredentialsStorage {
  static set(flowId: FlowId, credentials: CredentialsData): void {
    localStorage.setItem(StorageKeys.credentials(flowId), JSON.stringify(credentials));
    console.log(`💾 [FlowStorage] Saved credentials for ${flowId}`);
  }

  static get(flowId: FlowId): CredentialsData | null {
    const stored = localStorage.getItem(StorageKeys.credentials(flowId));
    if (!stored) return null;

    try {
      return JSON.parse(stored) as CredentialsData;
    } catch (e) {
      console.warn(`[FlowStorage] Failed to parse credentials for ${flowId}`, e);
      return null;
    }
  }

  static remove(flowId: FlowId): void {
    localStorage.removeItem(StorageKeys.credentials(flowId));
  }
}

// ============================================
// Token Management
// ============================================

export class TokenStorage {
  static set(tokens: TokenData): void {
    localStorage.setItem(StorageKeys.tokens(), JSON.stringify(tokens));
    console.log(`🎫 [FlowStorage] Stored tokens securely`);
  }

  static get(): TokenData | null {
    const stored = localStorage.getItem(StorageKeys.tokens());
    if (!stored) return null;

    try {
      return JSON.parse(stored) as TokenData;
    } catch (e) {
      console.warn(`[FlowStorage] Failed to parse tokens`, e);
      return null;
    }
  }

  static remove(): void {
    localStorage.removeItem(StorageKeys.tokens());
  }
}

// ============================================
// Navigation Management
// ============================================

export class NavigationStorage {
  static setFlowContext(context: FlowNavigationData): void {
    sessionStorage.setItem(StorageKeys.flowContext(), JSON.stringify(context));
  }

  static getFlowContext(): FlowNavigationData | null {
    const stored = sessionStorage.getItem(StorageKeys.flowContext());
    if (!stored) return null;

    try {
      return JSON.parse(stored) as FlowNavigationData;
    } catch (e) {
      return null;
    }
  }

  static removeFlowContext(): void {
    sessionStorage.removeItem(StorageKeys.flowContext());
  }

  static setRestoreStep(step: number): void {
    sessionStorage.setItem(StorageKeys.restoreStep(), step.toString());
  }

  static getRestoreStep(): number | null {
    const stored = sessionStorage.getItem(StorageKeys.restoreStep());
    if (!stored) return null;
    const parsed = parseInt(stored, 10);
    return isNaN(parsed) ? null : parsed;
  }

  static removeRestoreStep(): void {
    sessionStorage.removeItem(StorageKeys.restoreStep());
  }
}

// ============================================
// Cleanup Utilities
// ============================================

export class StorageCleanup {
  /**
   * Clear all flow-specific data (for flow reset)
   */
  static clearFlow(flowId: FlowId): void {
    console.log(`🧹 [FlowStorage] Clearing all data for ${flowId}`);
    
    // Session storage
    AuthCodeStorage.remove(flowId);
    StateStorage.remove(flowId);
    PKCEStorage.remove(flowId);
    FlowStateStorage.removeCurrentStep(flowId);
    
    // Keep credentials and tokens by default (user may want to reuse)
    console.log(`✅ [FlowStorage] Cleared session data for ${flowId}`);
  }

  /**
   * Clear all flow data including credentials
   */
  static clearFlowCompletely(flowId: FlowId): void {
    this.clearFlow(flowId);
    CredentialsStorage.remove(flowId);
    console.log(`✅ [FlowStorage] Completely cleared ${flowId}`);
  }

  /**
   * Clear all navigation data
   */
  static clearNavigation(): void {
    NavigationStorage.removeFlowContext();
    NavigationStorage.removeRestoreStep();
  }

  /**
   * Clear ALL storage (nuclear option)
   */
  static clearAll(): void {
    console.warn(`☢️ [FlowStorage] CLEARING ALL STORAGE`);
    sessionStorage.clear();
    localStorage.clear();
  }
}

// ============================================
// Main Service Export
// ============================================

export const FlowStorageService = {
  AuthCode: AuthCodeStorage,
  State: StateStorage,
  PKCE: PKCEStorage,
  FlowState: FlowStateStorage,
  Credentials: CredentialsStorage,
  Tokens: TokenStorage,
  Navigation: NavigationStorage,
  Cleanup: StorageCleanup,
  
  // Utility: Get flow ID from flow key
  getFlowId(flowKey: string): FlowId | null {
    // Map flow keys to flow IDs
    const mapping: Record<string, FlowId> = {
      'oauth-authorization-code-v6': 'oauth-authz-v6',
      'oidc-authorization-code-v6': 'oidc-authz-v6',
      'oauth-implicit-v6': 'oauth-implicit-v6',
      'oidc-implicit-v6': 'oidc-implicit-v6',
      'device-authorization-flow-v6': 'device-auth',
      'oidc-device-authorization-flow-v6': 'device-auth',
      'client-credentials-v6': 'client-credentials',
      'jwt-bearer-token-v6': 'jwt-bearer',
      'saml-bearer-assertion-v6': 'saml-bearer',
      'pingone-par-flow-v6': 'par',
      'rar-flow-v6': 'rar',
      'redirectless-flow-v6': 'redirectless',
    };
    
    return mapping[flowKey] || null;
  },
};

export default FlowStorageService;
```

---

## 📋 **Migration Plan**

### **Phase 1: Service Creation** (Week 1)
- ✅ Create `flowStorageService.ts`
- ✅ Add comprehensive TypeScript types
- ✅ Implement all storage classes
- ✅ Add unit tests
- ✅ Create migration guide document

### **Phase 2: High-Priority Flows** (Week 2)
Migrate V6 flows (most actively used):
1. OAuth Authorization Code V6
2. OIDC Authorization Code V6
3. Device Authorization Flow V6
4. OIDC Device Authorization Flow V6
5. Client Credentials V6

### **Phase 3: Medium-Priority Flows** (Week 3)
1. PAR Flow V6
2. RAR Flow V6
3. Implicit Flows V6 (OAuth & OIDC)
4. JWT Bearer V6
5. SAML Bearer V6

### **Phase 4: Context & Callbacks** (Week 4)
1. NewAuthContext
2. AuthzCallback
3. ImplicitCallback
4. AuthorizationCallback

### **Phase 5: Legacy Cleanup** (Week 5)
1. Deprecate old storage keys
2. Add migration utilities
3. Clean up unused storage
4. Update documentation

---

## 🔄 **Migration Example**

### **Before (Old Way):**
```typescript
// In OIDCAuthorizationCodeFlowV6.tsx
sessionStorage.setItem('oidc_auth_code', code);
const code = sessionStorage.getItem('oidc_auth_code');
```

### **After (New Service):**
```typescript
// In OIDCAuthorizationCodeFlowV6.tsx
import { FlowStorageService } from '../../services/flowStorageService';

FlowStorageService.AuthCode.set('oidc-authz-v6', code);
const code = FlowStorageService.AuthCode.get('oidc-authz-v6');
```

---

## ✅ **Benefits**

### **Developer Experience:**
1. ✅ **Type Safety** - Know what's stored and where
2. ✅ **Autocomplete** - IDE suggests available methods
3. ✅ **Consistency** - Same pattern across all flows
4. ✅ **Debugging** - Easy to see what's stored
5. ✅ **Testing** - Centralized mocking

### **Maintainability:**
1. ✅ **Single Source of Truth** - One place for storage logic
2. ✅ **Easy Updates** - Change storage logic in one place
3. ✅ **Clear Naming** - Standardized key naming
4. ✅ **Cleanup Utilities** - Easy to clear data
5. ✅ **Migration Path** - Gradual adoption possible

### **Performance:**
1. ✅ **Efficient Storage** - Only store what's needed
2. ✅ **Easy Cleanup** - Remove stale data
3. ✅ **Cache Management** - Clear expired data

---

## 📊 **Success Metrics**

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| **Unique Storage Keys** | ~100+ | ~20 | 5 weeks |
| **Direct Storage Calls** | 681 | <50 | 5 weeks |
| **Flows Using Service** | 0 | 15 | 5 weeks |
| **Type Safety Coverage** | 0% | 100% | 5 weeks |
| **Documentation Coverage** | 0% | 100% | 5 weeks |

---

## 🎯 **Next Steps**

1. **Review Plan** - Get approval from team
2. **Create Service** - Implement `flowStorageService.ts`
3. **Write Tests** - Unit tests for all storage operations
4. **Migrate OAuth/OIDC V6** - Start with high-priority flows
5. **Monitor & Iterate** - Track adoption and issues

---

## 📚 **Documentation Needed**

1. ✅ This plan document
2. ⏳ Service API documentation
3. ⏳ Migration guide for developers
4. ⏳ Storage key reference
5. ⏳ Cleanup utilities guide

---

**Plan Created**: October 13, 2025  
**Status**: 📋 **AWAITING APPROVAL**  
**Estimated Effort**: 5 weeks  
**Priority**: 🔥 **HIGH**

