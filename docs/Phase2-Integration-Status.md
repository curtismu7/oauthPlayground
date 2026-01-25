# Phase 2 OIDC Core Services Integration Status

**Version**: 9.0.0  
**Started**: 2026-01-25  
**Status**: Initial Integration Complete (Pilot)

---

## Overview

Phase 2 integrates OIDC core security services (StateManager, NonceManager, PkceManager, JWKSCacheService) into authorization flows using the `USE_NEW_OIDC_CORE` feature flag.

---

## Integration Scope Analysis

**Total Files Requiring Integration**: 155 files with 328 matches
- State generation: ~100 locations
- Nonce generation: ~80 locations  
- PKCE generation: ~90 locations
- JWKS calls: ~58 locations

**Estimated Total Effort**: 20-30 hours for complete integration across all files

---

## Completed Integrations

### ✅ useAuthActions.ts (Primary Authorization Hook)
**File**: `/src/hooks/useAuthActions.ts`  
**Lines Modified**: 20-23 (imports), 125-183 (integration)  
**Status**: ✅ Complete

**Changes**:
- Added imports for FeatureFlagService, StateManager, NonceManager, PkceManager
- Replaced manual state generation with StateManager.generate()
- Replaced manual nonce generation with NonceManager.generate()
- Replaced manual PKCE generation with PkceManager.generateAsync()
- Added feature flag checks: `USE_NEW_OIDC_CORE`
- Maintained backward compatibility with old methods

**Integration Pattern**:
```typescript
const useNewOidcCore = FeatureFlagService.isEnabled('USE_NEW_OIDC_CORE');

// State
const state = useNewOidcCore
  ? StateManager.generate()
  : Math.random().toString(36).substring(2, 15);

// Nonce
const nonce = useNewOidcCore
  ? NonceManager.generate()
  : Math.random().toString(36).substring(2, 15);

// PKCE
if (useNewOidcCore) {
  const pkce = await PkceManager.generateAsync();
  codeVerifier = pkce.codeVerifier;
  codeChallenge = pkce.codeChallenge;
} else {
  // Old manual generation
}

// Storage
if (useNewOidcCore) {
  StateManager.store(state, flowKey);
  NonceManager.store(nonce, flowKey);
  PkceManager.store({ codeVerifier, codeChallenge, codeChallengeMethod: 'S256' }, flowKey);
} else {
  sessionStorage.setItem('oauth_state', state);
  sessionStorage.setItem('oauth_nonce', nonce);
  sessionStorage.setItem('code_verifier', codeVerifier);
}
```

---

## Remaining Integration Work

### High Priority Files (Need Integration)

1. **NewAuthContext.tsx** (~6 matches)
   - Authorization context provider
   - State/nonce generation in multiple flows

2. **oauth.ts utility** (~4 matches)
   - Core OAuth utility functions
   - generateRandomString, generateCodeVerifier, generateCsrfToken

3. **V8 Integration Services** (~12 matches)
   - oauthIntegrationServiceV8.ts
   - hybridFlowIntegrationServiceV8.ts
   - implicitFlowIntegrationServiceV8.ts

4. **Flow Controllers** (~40 matches)
   - useOAuthFlow.ts
   - useHybridFlow.ts
   - useImplicitFlowController.ts
   - useCibaFlow.ts
   - etc.

5. **Flow Pages** (~80 matches)
   - OAuthAuthorizationCodeFlowV7.tsx
   - ImplicitFlowOIDC.tsx
   - PKCEFlow.tsx
   - HybridPostFlow.tsx
   - etc.

### Medium Priority Files

6. **Locked/Dependencies** (~60 matches)
   - Locked flow dependencies
   - Backup files
   - Test files

### Low Priority

7. **Test Files** (~40 matches)
8. **Backup Files** (~20 matches)
9. **Utility/Helper Files** (~15 matches)

---

## Integration Strategy

### Recommended Approach

**Option A: Incremental Integration** (Recommended)
- Integrate 5-10 high-priority files per session
- Test after each batch
- Gradual rollout with feature flag
- Estimated: 3-4 sessions to complete

**Option B: Utility-First Integration**
- Integrate core utilities (oauth.ts) first
- Then flow controllers
- Then individual flow pages
- Estimated: 2-3 sessions to complete

**Option C: Current State (Pilot Complete)**
- Primary auth hook integrated
- Feature flag ready for testing
- Remaining files use old methods
- Can be integrated as needed

---

## Testing Strategy

### Phase 2A: Pilot Testing (Current)
1. Enable `USE_NEW_OIDC_CORE` flag in dev
2. Test login flow via useAuthActions
3. Verify state/nonce/PKCE generation
4. Confirm storage and validation

### Phase 2B: Expanded Testing
1. Integrate additional high-priority files
2. Test multiple flow types
3. Verify backward compatibility (flag off)
4. Monitor for security issues

### Phase 2C: Production Rollout
1. Enable flag at 10% rollout
2. Monitor for errors
3. Gradual increase to 100%
4. Remove old code after stable

---

## Security Improvements

### StateManager Benefits
- ✅ Cryptographically secure random (32 bytes)
- ✅ Automatic cleanup after validation
- ✅ CSRF attack detection and rejection
- ✅ Consistent storage in sessionStorage

### NonceManager Benefits
- ✅ Cryptographically secure random (32 bytes)
- ✅ Replay attack protection
- ✅ Automatic cleanup after validation
- ✅ ID token nonce validation

### PkceManager Benefits
- ✅ RFC 7636 compliant generation
- ✅ S256 challenge method (SHA-256)
- ✅ Proper verifier length (43-128 chars)
- ✅ Automatic storage management

---

## Feature Flag Control

**Flag Name**: `USE_NEW_OIDC_CORE`  
**Default**: Disabled (false)  
**Scope**: All Phase 2 OIDC services

**Admin UI**: `/admin/feature-flags`
- Toggle flag on/off
- Set rollout percentage
- View current status

---

## Current Status Summary

| Service | Integration Status | Files Integrated | Files Remaining |
|---------|-------------------|------------------|-----------------|
| StateManager | 🟡 Pilot | 1 | ~100 |
| NonceManager | 🟡 Pilot | 1 | ~80 |
| PkceManager | 🟡 Pilot | 1 | ~90 |
| JWKSCacheService | 🔴 Not Started | 0 | ~58 |

**Overall Progress**: ~1% (1/155 files)  
**Pilot Status**: ✅ Complete and ready for testing  
**Production Ready**: 🟡 Pilot only (primary auth hook)

---

## Next Steps

### Immediate (If Continuing Integration)
1. Integrate NewAuthContext.tsx (auth context provider)
2. Integrate oauth.ts utilities (core functions)
3. Integrate V8 integration services
4. Test with multiple flow types

### Alternative (Pilot Testing)
1. Test current integration with flag enabled
2. Verify security improvements
3. Decide on full rollout based on results
4. Continue integration if successful

### Long-term
1. Complete integration across all 155 files
2. Add validation in callback handlers
3. Integrate JWKSCacheService for token validation
4. Remove old code after stable rollout

---

## Conclusion

**Phase 2 Pilot Integration: ✅ Complete**

The primary authorization hook (`useAuthActions.ts`) now uses Phase 2 OIDC core services when the `USE_NEW_OIDC_CORE` feature flag is enabled. This provides:

- Enhanced CSRF protection via StateManager
- Replay attack protection via NonceManager  
- RFC-compliant PKCE via PkceManager
- Backward compatibility when flag is disabled

The integration pattern is proven and can be replicated across the remaining 154 files as needed. The pilot is ready for testing to validate the approach before continuing with full integration.

**Recommendation**: Test pilot integration, then decide whether to continue with full integration or maintain current hybrid approach.

---

**Version**: 9.0.0  
**Last Updated**: 2026-01-25  
**Next Review**: After pilot testing or continued integration
