# Restore Documentation - Version 9.0.0

**Date**: 2026-01-25  
**Version**: 9.0.0  
**Type**: Phase 1-2 Integration & Phase 2 OIDC Core Services

---

## Overview

This document provides complete restore instructions for all files modified during the Phase 1-2 integration and Phase 2 OIDC core services integration. Use this guide to restore any file to its pre-integration state if needed.

---

## Quick Restore Commands

### Restore All Modified Files

```bash
# Restore all Phase 1-2 integration files
git checkout HEAD~10 -- \
  src/locked/unified-flow-v8u/feature/v8u/components/UnifiedFlowSteps.tsx \
  src/locked/unified-flow-v8u/feature/v8u/components/CredentialsFormV8U.tsx \
  src/locked/unified-flow-v8u/feature/v8u/flows/UnifiedOAuthFlowV8U.tsx \
  src/v8/flows/MFAAuthenticationMainPageV8.tsx

# Restore all Phase 2 integration files
git checkout HEAD~10 -- \
  src/hooks/useAuthActions.ts \
  src/contexts/NewAuthContext.tsx \
  src/v8/services/oauthIntegrationServiceV8.ts \
  src/v8/services/hybridFlowIntegrationServiceV8.ts \
  src/v8/services/implicitFlowIntegrationServiceV8.ts
```

### Restore Individual Files

```bash
# Restore specific file
git checkout HEAD~10 -- <file-path>
```

---

## Modified Files Registry

### Phase 1: CredentialsRepository Integration

#### 1. UnifiedFlowSteps.tsx

**Location**: `/src/locked/unified-flow-v8u/feature/v8u/components/UnifiedFlowSteps.tsx`

**Modifications**:
- Lines 1-50: Added imports for FeatureFlagService, CredentialsRepository
- Lines 500-550: Integrated 6 credential save/load operations
- Feature flag: USE_NEW_CREDENTIALS_REPO

**Restore Command**:
```bash
git checkout HEAD~10 -- src/locked/unified-flow-v8u/feature/v8u/components/UnifiedFlowSteps.tsx
```

**Restore Verification**:
```bash
# Check imports - should NOT have CredentialsRepository
grep "CredentialsRepository" src/locked/unified-flow-v8u/feature/v8u/components/UnifiedFlowSteps.tsx
# Should return no results

# Check feature flag usage
grep "USE_NEW_CREDENTIALS_REPO" src/locked/unified-flow-v8u/feature/v8u/components/UnifiedFlowSteps.tsx
# Should return no results
```

**Alternative**: Disable feature flag instead of restoring file
```typescript
// In admin UI or code
FeatureFlagService.setEnabled('USE_NEW_CREDENTIALS_REPO', false);
```

---

#### 2. CredentialsFormV8U.tsx

**Location**: `/src/locked/unified-flow-v8u/feature/v8u/components/CredentialsFormV8U.tsx`

**Modifications**:
- Lines 1-50: Added imports
- Lines 200-250: Integrated 4 credential operations
- Feature flag: USE_NEW_CREDENTIALS_REPO

**Restore Command**:
```bash
git checkout HEAD~10 -- src/locked/unified-flow-v8u/feature/v8u/components/CredentialsFormV8U.tsx
```

**Restore Verification**:
```bash
grep "CredentialsRepository" src/locked/unified-flow-v8u/feature/v8u/components/CredentialsFormV8U.tsx
# Should return no results
```

---

#### 3. UnifiedOAuthFlowV8U.tsx

**Location**: `/src/locked/unified-flow-v8u/feature/v8u/flows/UnifiedOAuthFlowV8U.tsx`

**Modifications**:
- Lines 1-50: Added imports
- Lines 319-321: Initial credential load
- Lines 365-369: Scopes type conversion
- Lines 619-631: Async credential load
- Lines 687-691: Scopes type conversion
- Lines 1329-1338: MFA credential load
- Feature flag: USE_NEW_CREDENTIALS_REPO

**Restore Command**:
```bash
git checkout HEAD~10 -- src/locked/unified-flow-v8u/feature/v8u/flows/UnifiedOAuthFlowV8U.tsx
```

**Restore Verification**:
```bash
grep "CredentialsRepository" src/locked/unified-flow-v8u/feature/v8u/flows/UnifiedOAuthFlowV8U.tsx
# Should return no results

# Check for scopes type conversion
grep "Array.isArray.*scopes" src/locked/unified-flow-v8u/feature/v8u/flows/UnifiedOAuthFlowV8U.tsx
# Should return no results
```

---

#### 4. MFAAuthenticationMainPageV8.tsx

**Location**: `/src/v8/flows/MFAAuthenticationMainPageV8.tsx`

**Modifications**:
- Lines 60-62: Added imports
- Lines 234-243: Initial credential load
- Lines 887-906: Auto-select policy save
- Lines 1008-1027: Policy selection save
- Lines 1410-1431: Clear tokens save
- Lines 1509-1518: MFA Postman load
- Lines 1560-1579: Complete Postman loads
- Lines 2054-2073: Environment ID save
- Lines 2108-2127, 3781-3800: Username save operations
- Feature flag: USE_NEW_CREDENTIALS_REPO

**Restore Command**:
```bash
git checkout HEAD~10 -- src/v8/flows/MFAAuthenticationMainPageV8.tsx
```

**Restore Verification**:
```bash
grep "CredentialsRepository" src/v8/flows/MFAAuthenticationMainPageV8.tsx
# Should return no results

# Count feature flag checks (should be 0)
grep -c "USE_NEW_CREDENTIALS_REPO" src/v8/flows/MFAAuthenticationMainPageV8.tsx
# Should return 0
```

---

### Phase 2: OIDC Core Services Integration

#### 5. useAuthActions.ts

**Location**: `/src/hooks/useAuthActions.ts`

**Modifications**:
- Lines 20-23: Added imports for FeatureFlagService, StateManager, NonceManager, PkceManager
- Lines 125-183: Integrated state, nonce, and PKCE generation
- Feature flag: USE_NEW_OIDC_CORE

**Restore Command**:
```bash
git checkout HEAD~10 -- src/hooks/useAuthActions.ts
```

**Restore Verification**:
```bash
# Check for Phase 2 imports
grep "StateManager\|NonceManager\|PkceManager" src/hooks/useAuthActions.ts
# Should return no results

# Check for feature flag
grep "USE_NEW_OIDC_CORE" src/hooks/useAuthActions.ts
# Should return no results

# Verify old random generation
grep "Math.random().toString(36)" src/hooks/useAuthActions.ts
# Should return results (old method)
```

---

#### 6. NewAuthContext.tsx

**Location**: `/src/contexts/NewAuthContext.tsx`

**Modifications**:
- Lines 18-21: Added imports
- Lines 635-688: Integrated state, nonce, and PKCE generation
- Flow key: 'new-auth-context'
- Feature flag: USE_NEW_OIDC_CORE

**Restore Command**:
```bash
git checkout HEAD~10 -- src/contexts/NewAuthContext.tsx
```

**Restore Verification**:
```bash
grep "StateManager\|NonceManager\|PkceManager" src/contexts/NewAuthContext.tsx
# Should return no results

grep "new-auth-context" src/contexts/NewAuthContext.tsx
# Should return no results (flow key added in v9.0.0)
```

---

#### 7. oauthIntegrationServiceV8.ts

**Location**: `/src/v8/services/oauthIntegrationServiceV8.ts`

**Modifications**:
- Lines 21-23: Added imports
- Lines 103-123: Integrated PKCE generation
- Lines 169-173: Integrated state generation
- Feature flag: USE_NEW_OIDC_CORE

**Restore Command**:
```bash
git checkout HEAD~10 -- src/v8/services/oauthIntegrationServiceV8.ts
```

**Restore Verification**:
```bash
grep "PkceManager\|StateManager" src/v8/services/oauthIntegrationServiceV8.ts
# Should return no results

# Check for old random generation
grep "generateRandomString" src/v8/services/oauthIntegrationServiceV8.ts
# Should return results (old method)
```

---

#### 8. hybridFlowIntegrationServiceV8.ts

**Location**: `/src/v8/services/hybridFlowIntegrationServiceV8.ts`

**Modifications**:
- Lines 21-24: Added imports
- Lines 114-123: Integrated state and nonce generation
- Lines 606-625: Integrated PKCE generation
- Feature flag: USE_NEW_OIDC_CORE

**Restore Command**:
```bash
git checkout HEAD~10 -- src/v8/services/hybridFlowIntegrationServiceV8.ts
```

**Restore Verification**:
```bash
grep "StateManager\|NonceManager\|PkceManager" src/v8/services/hybridFlowIntegrationServiceV8.ts
# Should return no results
```

---

#### 9. implicitFlowIntegrationServiceV8.ts

**Location**: `/src/v8/services/implicitFlowIntegrationServiceV8.ts`

**Modifications**:
- Lines 19-21: Added imports
- Lines 99-108: Integrated state and nonce generation
- Feature flag: USE_NEW_OIDC_CORE

**Restore Command**:
```bash
git checkout HEAD~10 -- src/v8/services/implicitFlowIntegrationServiceV8.ts
```

**Restore Verification**:
```bash
grep "StateManager\|NonceManager" src/v8/services/implicitFlowIntegrationServiceV8.ts
# Should return no results
```

---

## Documentation Files

### Created Documentation

1. **Component-Integration-Guide.md** - Integration patterns and instructions
2. **Integration-Status-Summary.md** - Overall progress tracking
3. **Phase2-OIDC-Integration-Plan.md** - Phase 2 strategy
4. **Phase2-Integration-Status.md** - Phase 2 progress
5. **UI-Documentation-Update-v9.0.0.md** - UI changes documentation
6. **UI-Contract-Update-v9.0.0.md** - UI contracts
7. **Restore-Documentation-v9.0.0.md** - This file

**Restore Command** (delete all new docs):
```bash
rm docs/Component-Integration-Guide.md
rm docs/Phase2-OIDC-Integration-Plan.md
rm docs/Phase2-Integration-Status.md
rm docs/UI-Documentation-Update-v9.0.0.md
rm docs/UI-Contract-Update-v9.0.0.md
rm docs/Restore-Documentation-v9.0.0.md
```

**Restore Integration-Status-Summary.md** (was modified):
```bash
git checkout HEAD~10 -- docs/Integration-Status-Summary.md
```

---

## Configuration Files

### Modified Configuration

**.gitignore** - Added deployment exclusions

**Restore Command**:
```bash
git checkout HEAD~10 -- .gitignore
```

---

## Complete System Restore

### Option 1: Restore to Pre-Integration State

```bash
# Create a backup of current state first
git branch backup-v9.0.0

# Restore to pre-integration commit
git reset --hard HEAD~10

# Or restore to specific tag
git reset --hard pre-refactor-v8-v8u-full
```

### Option 2: Selective Restore (Recommended)

```bash
# Restore only Phase 1 files
git checkout HEAD~10 -- \
  src/locked/unified-flow-v8u/feature/v8u/components/UnifiedFlowSteps.tsx \
  src/locked/unified-flow-v8u/feature/v8u/components/CredentialsFormV8U.tsx \
  src/locked/unified-flow-v8u/feature/v8u/flows/UnifiedOAuthFlowV8U.tsx \
  src/v8/flows/MFAAuthenticationMainPageV8.tsx

# Restore only Phase 2 files
git checkout HEAD~10 -- \
  src/hooks/useAuthActions.ts \
  src/contexts/NewAuthContext.tsx \
  src/v8/services/oauthIntegrationServiceV8.ts \
  src/v8/services/hybridFlowIntegrationServiceV8.ts \
  src/v8/services/implicitFlowIntegrationServiceV8.ts

# Commit the restore
git add .
git commit -m "Restore files to pre-v9.0.0 state"
```

### Option 3: Feature Flag Disable (No Code Changes)

```bash
# Disable Phase 1 integration
# In admin UI: /admin/feature-flags
# Set USE_NEW_CREDENTIALS_REPO = false

# Disable Phase 2 integration
# Set USE_NEW_OIDC_CORE = false

# Or programmatically
node -e "
const fs = require('fs');
const config = {
  USE_NEW_CREDENTIALS_REPO: { enabled: false, rolloutPercentage: 0 },
  USE_NEW_OIDC_CORE: { enabled: false, rolloutPercentage: 0 }
};
fs.writeFileSync('feature-flags.json', JSON.stringify(config, null, 2));
"
```

---

## Restore Verification Checklist

### After Restoring Files

- [ ] Run `npm install` to ensure dependencies are correct
- [ ] Run `npm run type-check` to verify TypeScript compiles
- [ ] Run `npm test` to verify tests pass
- [ ] Run `npm run build` to verify build succeeds
- [ ] Start dev server and verify application loads
- [ ] Test credential persistence (should use old service)
- [ ] Test OAuth/OIDC flows (should use old random generation)
- [ ] Verify no console errors
- [ ] Check that feature flags are disabled or removed

### Verification Commands

```bash
# Check for Phase 1 integration remnants
grep -r "CredentialsRepository" src/ --include="*.tsx" --include="*.ts" | grep -v "__tests__" | grep -v "services/"
# Should return no results (except in services directory)

# Check for Phase 2 integration remnants
grep -r "StateManager\|NonceManager\|PkceManager" src/ --include="*.tsx" --include="*.ts" | grep -v "__tests__" | grep -v "services/"
# Should return no results (except in services directory)

# Check feature flag usage
grep -r "USE_NEW_CREDENTIALS_REPO\|USE_NEW_OIDC_CORE" src/ --include="*.tsx" --include="*.ts"
# Should return no results

# Verify version number
grep '"version"' package.json
# Should show version (may need to update if restoring)
```

---

## Rollback Scenarios

### Scenario 1: Production Issue with Phase 1

**Symptoms**:
- Credentials not persisting
- Data loss
- Form submission failures

**Solution**:
```bash
# Option A: Disable feature flag (instant, no code changes)
# In admin UI: Set USE_NEW_CREDENTIALS_REPO = false

# Option B: Restore files
git checkout HEAD~10 -- \
  src/locked/unified-flow-v8u/feature/v8u/components/UnifiedFlowSteps.tsx \
  src/locked/unified-flow-v8u/feature/v8u/components/CredentialsFormV8U.tsx \
  src/locked/unified-flow-v8u/feature/v8u/flows/UnifiedOAuthFlowV8U.tsx \
  src/v8/flows/MFAAuthenticationMainPageV8.tsx
git commit -m "Rollback Phase 1 integration"
git push
```

---

### Scenario 2: Production Issue with Phase 2

**Symptoms**:
- OAuth/OIDC flows failing
- Authorization errors
- CSRF/nonce validation failures

**Solution**:
```bash
# Option A: Disable feature flag (instant, no code changes)
# In admin UI: Set USE_NEW_OIDC_CORE = false

# Option B: Restore files
git checkout HEAD~10 -- \
  src/hooks/useAuthActions.ts \
  src/contexts/NewAuthContext.tsx \
  src/v8/services/oauthIntegrationServiceV8.ts \
  src/v8/services/hybridFlowIntegrationServiceV8.ts \
  src/v8/services/implicitFlowIntegrationServiceV8.ts
git commit -m "Rollback Phase 2 integration"
git push
```

---

### Scenario 3: Complete Rollback

**Symptoms**:
- Multiple issues
- System instability
- Need to revert everything

**Solution**:
```bash
# Create safety backup
git branch backup-before-rollback

# Restore to pre-integration state
git reset --hard pre-refactor-v8-v8u-full

# Or use specific commit
git reset --hard <commit-hash-before-integration>

# Force push (use with caution)
git push --force-with-lease
```

---

## Data Migration

### Migrating Credentials Back to Old Format

If you need to migrate credentials from new format back to old format:

```javascript
// Run this script to convert credentials
const CredentialsRepository = require('./src/services/credentialsRepository').CredentialsRepository;
const CredentialsServiceV8 = require('./src/v8/services/credentialsServiceV8').CredentialsServiceV8;

// Get all flow keys
const flowKeys = ['unified-oauth', 'mfa-v8', 'oauth-authz-v8u'];

flowKeys.forEach(flowKey => {
  // Load from new repository
  const newCreds = CredentialsRepository.getFlowCredentials(flowKey);
  
  if (newCreds) {
    // Convert scopes from array to string
    const oldCreds = {
      ...newCreds,
      scopes: Array.isArray(newCreds.scopes) 
        ? newCreds.scopes.join(' ') 
        : newCreds.scopes
    };
    
    // Save to old service
    CredentialsServiceV8.saveCredentials(flowKey, oldCreds);
    
    console.log(`Migrated ${flowKey}`);
  }
});
```

---

## Emergency Contacts

**For Critical Issues**:
1. Disable feature flags immediately via admin UI
2. Check GitHub for latest stable commit
3. Review this restore documentation
4. Execute appropriate rollback scenario
5. Verify system stability
6. Document issue for post-mortem

---

## Restore History Log

**Template for logging restores**:

```markdown
### Restore Event: [Date]

**Reason**: [Why restore was needed]
**Scope**: [Which files/features were restored]
**Method**: [Feature flag disable / File restore / Complete rollback]
**Duration**: [How long system was affected]
**Resolution**: [What fixed the issue]
**Prevention**: [How to prevent in future]
```

---

## Version Control

**Git Tags for Restore Points**:
```bash
# Tag before integration (already exists)
git tag -a pre-refactor-v8-v8u-full -m "Before Phase 1-2 integration"

# Tag after Phase 1
git tag -a post-phase1-v9.0.0 -m "After Phase 1 CredentialsRepository integration"

# Tag after Phase 2
git tag -a post-phase2-v9.0.0 -m "After Phase 2 OIDC core services integration"

# Push tags
git push --tags
```

**Restore to Specific Tag**:
```bash
git checkout pre-refactor-v8-v8u-full
# Or
git reset --hard pre-refactor-v8-v8u-full
```

---

**Status**: ✅ All restore documentation complete  
**Version**: 9.0.0  
**Last Updated**: 2026-01-25  
**Restore Points**: 3 (pre-integration, post-phase1, post-phase2)
