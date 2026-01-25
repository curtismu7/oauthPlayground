# Component Integration Guide - Phase 1-2 Services

_Version: 9.0.0_  
_Created: 2026-01-25_  
_Status: Gradual Integration in Progress_

---

## Overview

This guide provides step-by-step instructions for integrating Phase 1-2 services into existing components using feature flags for safe, gradual rollout.

---

## Integration Strategy

### Approach: Gradual Component-by-Component

1. **Start with highest-impact components** (most credential usage)
2. **Add feature flag checks** around service usage
3. **Test thoroughly** before moving to next component
4. **Monitor metrics** after each integration
5. **Rollback instantly** if issues detected (disable feature flag)

### Rollout Phases

**Phase 1 Integration** (CredentialsRepository):
- Week 1: 1-2 high-impact components
- Week 2: 3-5 medium-impact components
- Week 3: Remaining components
- Week 4: Remove old service calls (if stable)

**Phase 2 Integration** (State/Nonce/PKCE):
- Week 5-6: Authorization URL builders
- Week 7-8: Callback handlers
- Week 9: ID token validation
- Week 10: Remove old service calls (if stable)

---

## High-Priority Components for Integration

### CredentialsRepository Integration (Phase 1)

**Priority 1 - Critical Components**:
1. `UnifiedFlowSteps.tsx` (~10,000 lines) - Main flow orchestration
2. `CredentialsFormV8U.tsx` (~3,000 lines) - Credentials input form
3. `UnifiedOAuthFlowV8U.tsx` (~2,300 lines) - Flow entry point
4. `MFAAuthenticationMainPageV8.tsx` (~1,500 lines) - MFA entry point

**Priority 2 - Supporting Components**:
5. `AppDiscoveryModalV8U.tsx` - App discovery
6. `WorkerTokenStatusDisplayV8` - Worker token UI
7. Various MFA flow components

### State/Nonce/PKCE Integration (Phase 2)

**Priority 1 - Authorization**:
1. All authorization URL builders
2. PKCE generation calls
3. State generation calls

**Priority 2 - Callbacks**:
1. All callback handlers
2. State validation
3. Nonce validation

---

## Integration Patterns

### Pattern 1: CredentialsRepository Integration

```typescript
// Before (old service)
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';

const credentials = CredentialsServiceV8.getCredentials('unified-oauth');
CredentialsServiceV8.saveCredentials('unified-oauth', newCredentials);

// After (with feature flag)
import { FeatureFlagService } from '@/services/featureFlagService';
import { CredentialsRepository } from '@/services/credentialsRepository';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';

// Get credentials
const credentials = FeatureFlagService.isEnabled('USE_NEW_CREDENTIALS_REPO')
  ? CredentialsRepository.getFlowCredentials('unified-oauth')
  : CredentialsServiceV8.getCredentials('unified-oauth');

// Save credentials
if (FeatureFlagService.isEnabled('USE_NEW_CREDENTIALS_REPO')) {
  CredentialsRepository.setFlowCredentials('unified-oauth', newCredentials);
} else {
  CredentialsServiceV8.saveCredentials('unified-oauth', newCredentials);
}
```

### Pattern 2: Event Listeners

```typescript
// Before (old service)
// No event system

// After (with feature flag)
import { FeatureFlagService } from '@/services/featureFlagService';
import { CredentialsRepository } from '@/services/credentialsRepository';

if (FeatureFlagService.isEnabled('USE_NEW_CREDENTIALS_REPO')) {
  // Subscribe to credential changes
  const unsubscribe = CredentialsRepository.onCredentialsChanged(
    'unified-oauth',
    (credentials) => {
      console.log('Credentials updated:', credentials);
      // Update UI
    }
  );

  // Cleanup on unmount
  return () => unsubscribe();
}
```

### Pattern 3: StateManager Integration

```typescript
// Before (old approach)
const state = generateRandomString();
sessionStorage.setItem('oauth_state', state);

// After (with feature flag)
import { FeatureFlagService } from '@/services/featureFlagService';
import { StateManager } from '@/services/stateManager';

const state = FeatureFlagService.isEnabled('USE_NEW_OIDC_CORE')
  ? StateManager.generate()
  : generateRandomString();

if (FeatureFlagService.isEnabled('USE_NEW_OIDC_CORE')) {
  StateManager.store(state, 'unified-oauth');
} else {
  sessionStorage.setItem('oauth_state', state);
}

// Validation in callback
if (FeatureFlagService.isEnabled('USE_NEW_OIDC_CORE')) {
  const isValid = StateManager.validate(receivedState, 'unified-oauth');
  if (!isValid) {
    throw new Error('Invalid state - possible CSRF attack');
  }
} else {
  // Old validation logic
}
```

### Pattern 4: PkceManager Integration

```typescript
// Before (old service)
import { pkceService } from '@/services/pkceService';

const { codeVerifier, codeChallenge } = await pkceService.generatePKCE();

// After (with feature flag)
import { FeatureFlagService } from '@/services/featureFlagService';
import { PkceManager } from '@/services/pkceManager';
import { pkceService } from '@/services/pkceService';

const pkce = FeatureFlagService.isEnabled('USE_NEW_OIDC_CORE')
  ? await PkceManager.generateAsync()
  : await pkceService.generatePKCE();

// Store PKCE
if (FeatureFlagService.isEnabled('USE_NEW_OIDC_CORE')) {
  PkceManager.store(pkce, 'unified-oauth');
} else {
  // Old storage logic
}
```

---

## Step-by-Step Integration Process

### Step 1: Identify Component

1. Choose component from priority list
2. Review all credential/state/PKCE usage
3. Identify all service calls to replace

### Step 2: Add Feature Flag Imports

```typescript
import { FeatureFlagService } from '@/services/featureFlagService';
import { CredentialsRepository } from '@/services/credentialsRepository';
// Keep old imports for fallback
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
```

### Step 3: Wrap Service Calls

Replace each service call with feature flag check:

```typescript
// Old
const creds = OldService.get();

// New
const creds = FeatureFlagService.isEnabled('USE_NEW_CREDENTIALS_REPO')
  ? CredentialsRepository.getFlowCredentials('flow-key')
  : OldService.get();
```

### Step 4: Test Thoroughly

**With Flag Disabled** (default):
- [ ] All flows work identically
- [ ] No console errors
- [ ] No data loss
- [ ] UI behaves correctly

**With Flag Enabled**:
- [ ] All flows work identically
- [ ] New services used correctly
- [ ] Migration happens automatically
- [ ] No regressions

### Step 5: Deploy and Monitor

1. Deploy component changes
2. Keep flag disabled initially
3. Enable for 10% of users
4. Monitor for 24-48 hours
5. Increase rollout if stable

---

## Testing Checklist

### Per-Component Testing

**Before Integration**:
- [ ] Document current behavior
- [ ] Capture baseline metrics
- [ ] Create test plan

**After Integration**:
- [ ] Test with flag disabled (old behavior)
- [ ] Test with flag enabled (new behavior)
- [ ] Verify no visual changes
- [ ] Verify no functional changes
- [ ] Check console for errors
- [ ] Verify storage migration

### Flow Testing

**Unified OAuth Flow**:
- [ ] Authorization code flow
- [ ] Implicit flow
- [ ] Hybrid flow
- [ ] Client credentials flow

**MFA Flows**:
- [ ] SMS authentication
- [ ] Email authentication
- [ ] TOTP authentication
- [ ] FIDO2 authentication
- [ ] Voice authentication

---

## Rollback Procedures

### Instant Rollback (Feature Flag)

```typescript
// In browser console or admin UI
FeatureFlagService.disable('USE_NEW_CREDENTIALS_REPO');
FeatureFlagService.disable('USE_NEW_OIDC_CORE');

// Verify
console.log(FeatureFlagService.getAllFlags());
```

### Component Rollback (Git)

```bash
# Revert specific component
git checkout HEAD~1 -- src/path/to/component.tsx

# Commit revert
git commit -m "Rollback: Revert component integration"
git push
```

### Full Rollback (Git Tag)

```bash
# Restore to pre-integration state
git checkout pre-refactor-v8-v8u-full

# Or restore specific files
git checkout pre-refactor-v8-v8u-full -- src/services/
```

---

## Monitoring & Metrics

### Key Metrics to Track

**Functional Metrics**:
- Flow completion rates (should remain stable)
- Error rates (should not increase)
- API call success rates
- Storage migration success rate

**Performance Metrics**:
- Page load times
- Component render times
- Service call latency

**User Experience**:
- User feedback/complaints
- Support ticket volume
- Feature flag adoption rate

### Monitoring Tools

```typescript
// Add telemetry to track feature flag usage
if (FeatureFlagService.isEnabled('USE_NEW_CREDENTIALS_REPO')) {
  console.log('[Telemetry] Using new CredentialsRepository');
  // Track success/failure
}
```

---

## Common Issues & Solutions

### Issue 1: Storage Key Mismatch

**Problem**: Old keys not migrating correctly

**Solution**:
```typescript
// Force migration
CredentialsRepository.migrate();

// Verify migration
const migrated = CredentialsRepository.getFlowCredentials('unified-oauth');
console.log('Migrated credentials:', migrated);
```

### Issue 2: Event Listeners Not Firing

**Problem**: UI not updating when credentials change

**Solution**:
```typescript
// Ensure proper cleanup
useEffect(() => {
  if (FeatureFlagService.isEnabled('USE_NEW_CREDENTIALS_REPO')) {
    const unsubscribe = CredentialsRepository.onCredentialsChanged(
      flowKey,
      handleCredentialsChange
    );
    return () => unsubscribe();
  }
}, [flowKey]);
```

### Issue 3: Feature Flag Not Persisting

**Problem**: Flag resets on page reload

**Solution**:
```typescript
// Flags are stored in localStorage automatically
// Verify storage
console.log(localStorage.getItem('feature_flag_USE_NEW_CREDENTIALS_REPO'));

// Set flag explicitly
FeatureFlagService.enable('USE_NEW_CREDENTIALS_REPO');
```

---

## Integration Timeline

### Week 1: Foundation Setup
- [x] Create all services
- [x] Create feature flag system
- [x] Update version to 9.0.0
- [ ] Integrate first component (UnifiedFlowSteps.tsx)

### Week 2-3: Core Components
- [ ] Integrate CredentialsFormV8U.tsx
- [ ] Integrate UnifiedOAuthFlowV8U.tsx
- [ ] Integrate MFAAuthenticationMainPageV8.tsx
- [ ] Test all Unified flows

### Week 4: Supporting Components
- [ ] Integrate AppDiscoveryModalV8U.tsx
- [ ] Integrate WorkerTokenStatusDisplayV8
- [ ] Test all MFA flows

### Week 5-6: OIDC Core Integration
- [ ] Integrate StateManager
- [ ] Integrate NonceManager
- [ ] Integrate PkceManager
- [ ] Test security compliance

### Week 7-8: Stabilization
- [ ] Monitor metrics
- [ ] Fix any issues
- [ ] Increase rollout to 100%
- [ ] Remove old service calls

---

## Success Criteria

### Per-Component Success
- [ ] Feature flag integration complete
- [ ] All tests passing (old and new behavior)
- [ ] No regressions detected
- [ ] Metrics stable for 48 hours

### Overall Success
- [ ] All high-priority components integrated
- [ ] 100% rollout achieved
- [ ] No P0/P1 bugs
- [ ] Performance benchmarks met
- [ ] Team trained on new services

---

## Next Steps

1. **Start with UnifiedFlowSteps.tsx** (highest impact)
2. **Add feature flag checks** around credential calls
3. **Test thoroughly** with flag on/off
4. **Deploy and monitor** for 48 hours
5. **Move to next component** if stable

---

## Resources

- **Architecture**: `docs/Unified-MFA-Service-Architecture.md`
- **Deployment Summary**: `docs/Phase1-2-Deployment-Summary.md`
- **Restore Procedures**: `docs/RESTORE-PROCEDURES.md`
- **Service Documentation**: `src/services/` (inline JSDoc)

---

**Integration Status**: 🟡 IN PROGRESS  
**Current Phase**: Component Integration Week 1  
**Next Action**: Integrate UnifiedFlowSteps.tsx with CredentialsRepository  
**Version**: 9.0.0
