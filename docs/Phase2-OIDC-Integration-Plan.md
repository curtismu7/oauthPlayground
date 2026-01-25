# Phase 2 OIDC Core Services Integration Plan

**Version**: 9.0.0  
**Created**: 2026-01-25  
**Status**: In Progress

---

## Overview

Integrate Phase 2 OIDC core services (StateManager, NonceManager, PkceManager, JWKSCacheService) into authorization flows using the `USE_NEW_OIDC_CORE` feature flag.

---

## Services to Integrate

### 1. StateManager
**Purpose**: CSRF protection via state parameter  
**Current Usage**: Manual `Math.random()` or `crypto.randomUUID()`  
**New Service**: Cryptographically secure state generation + validation  
**Feature Flag**: `USE_NEW_OIDC_CORE`

**Integration Points**:
- Authorization URL builders (state generation)
- Callback handlers (state validation)
- Session storage management

### 2. NonceManager
**Purpose**: Replay attack protection for ID tokens  
**Current Usage**: Manual random string generation  
**New Service**: Secure nonce generation + validation  
**Feature Flag**: `USE_NEW_OIDC_CORE`

**Integration Points**:
- OIDC authorization requests
- ID token validation
- Session storage management

### 3. PkceManager
**Purpose**: Authorization code interception protection  
**Current Usage**: `pkceService` or manual generation  
**New Service**: Standardized PKCE challenge/verifier management  
**Feature Flag**: `USE_NEW_OIDC_CORE`

**Integration Points**:
- PKCE-enabled authorization flows
- Token exchange with code_verifier
- Session storage management

### 4. JWKSCacheService
**Purpose**: Efficient JWKS caching with rotation support  
**Current Usage**: Direct JWKS endpoint calls  
**New Service**: Cached JWKS with automatic refresh  
**Feature Flag**: `USE_NEW_OIDC_CORE`

**Integration Points**:
- ID token signature validation
- Access token validation (if JWT)
- JWKS endpoint calls

---

## Integration Strategy

### Phase 2A: StateManager Integration
**Priority**: High (CSRF protection)  
**Estimated Effort**: 2-3 hours  
**Components**:
1. Authorization URL builders in all flows
2. Callback handlers (state validation)
3. Error handling for CSRF attacks

### Phase 2B: NonceManager Integration
**Priority**: High (Replay protection)  
**Estimated Effort**: 2-3 hours  
**Components**:
1. OIDC authorization requests
2. ID token validation logic
3. Nonce mismatch error handling

### Phase 2C: PkceManager Integration
**Priority**: Medium (Already have pkceService)  
**Estimated Effort**: 1-2 hours  
**Components**:
1. PKCE-enabled flows
2. Token exchange handlers
3. PKCE storage management

### Phase 2D: JWKSCacheService Integration
**Priority**: Low (Performance optimization)  
**Estimated Effort**: 1-2 hours  
**Components**:
1. ID token validation
2. JWKS fetching logic
3. Cache invalidation

---

## Target Files for Integration

### High-Priority Authorization Flows
1. `/src/hooks/useAuthActions.ts` - Main authorization hook
2. `/src/contexts/NewAuthContext.tsx` - Auth context provider
3. `/src/utils/oauth.ts` - OAuth utility functions
4. `/src/pages/flows/OAuthAuthorizationCodeFlowV7.tsx` - V7 flow

### Supporting Files
5. `/src/v8/services/oauthIntegrationServiceV8.ts` - V8 OAuth service
6. `/src/v8/services/hybridFlowIntegrationServiceV8.ts` - V8 Hybrid service
7. `/src/v8/services/implicitFlowIntegrationServiceV8.ts` - V8 Implicit service

---

## Integration Pattern

```typescript
// Pattern: StateManager Integration
import { FeatureFlagService } from '@/services/featureFlagService';
import { StateManager } from '@/services/stateManager';

// Generate state
const state = FeatureFlagService.isEnabled('USE_NEW_OIDC_CORE')
  ? StateManager.generate()
  : generateRandomString();

// Store state
if (FeatureFlagService.isEnabled('USE_NEW_OIDC_CORE')) {
  StateManager.store(state, flowKey);
} else {
  sessionStorage.setItem('oauth_state', state);
}

// Validate state (in callback)
if (FeatureFlagService.isEnabled('USE_NEW_OIDC_CORE')) {
  if (!StateManager.validate(receivedState, flowKey)) {
    throw new Error('Invalid state - possible CSRF attack');
  }
} else {
  // Old validation
}
```

---

## Success Criteria

- [ ] All state generation uses StateManager (when flag enabled)
- [ ] All nonce generation uses NonceManager (when flag enabled)
- [ ] All PKCE generation uses PkceManager (when flag enabled)
- [ ] All JWKS calls use JWKSCacheService (when flag enabled)
- [ ] Feature flag `USE_NEW_OIDC_CORE` controls all Phase 2 services
- [ ] Backward compatibility maintained (flag disabled = old behavior)
- [ ] All tests pass with flag enabled and disabled
- [ ] Documentation updated

---

## Rollout Plan

1. **Development**: Integrate services with feature flag (disabled by default)
2. **Testing**: Enable flag in dev environment, test all flows
3. **Staging**: Enable flag at 10% rollout, monitor for issues
4. **Production**: Gradual rollout (10% → 25% → 50% → 100%)
5. **Cleanup**: Remove old code after 2 weeks of stable 100% rollout

---

## Risk Mitigation

- Feature flag allows instant rollback
- Comprehensive testing before rollout
- Gradual percentage-based rollout
- Monitoring and alerting for errors
- Keep old code until fully stable

---

**Status**: Ready to begin integration  
**Next Step**: Integrate StateManager into authorization flows
