# Restore Procedures: V8/V8U Service Refactor

_Created: 2026-01-25_  
_Purpose: Document restore points and recovery procedures for V8/V8U service refactor_

---

## Restore Points Created

### 1. Git Tag: `pre-refactor-v8-v8u-full`

**Created**: 2026-01-25  
**Commit**: 7239e417  
**Branch**: unified-mfa-pre-refactor  
**Status**: ✅ Pushed to GitHub

**Scope**:
- 811 files (308 V8/V8U + 503 locked dependencies)
- All services: Worker token, Credentials, Flow integration, PKCE, OIDC core, MFA
- Documentation: Refactor-Impact-Analysis.md, Unified-MFA-Service-Architecture.md
- Last stable state before 9-week phased refactor

**Tag Message**:
```
Full restore point before V8/V8U service refactor

Scope: 811 files (308 V8/V8U + 503 locked dependencies)
Impacted services: Worker token, Credentials, Flow integration, PKCE, OIDC core, MFA
Analysis: docs/Refactor-Impact-Analysis.md
Architecture: docs/Unified-MFA-Service-Architecture.md

This tag marks the last stable state before implementing the 9-week phased refactor.
Restore with: git checkout pre-refactor-v8-v8u-full
```

### 2. Git Branch: `backup-pre-refactor-v8-v8u`

**Created**: 2026-01-25  
**Commit**: 7239e417  
**Status**: ✅ Pushed to GitHub  
**URL**: https://github.com/curtismu7/oauthPlayground/tree/backup-pre-refactor-v8-v8u

**Purpose**: Long-term backup branch for impacted files

---

## Quick Restore Commands

### Option 1: Restore to Tag (Recommended)

```bash
# Full restore to pre-refactor state
git checkout pre-refactor-v8-v8u-full

# Create new branch from tag to continue work
git checkout -b my-work-branch pre-refactor-v8-v8u-full
```

### Option 2: Restore to Backup Branch

```bash
# Switch to backup branch
git checkout backup-pre-refactor-v8-v8u

# Create new branch from backup
git checkout -b my-work-branch backup-pre-refactor-v8-v8u
```

### Option 3: Cherry-pick Specific Files

```bash
# Restore specific files from tag
git checkout pre-refactor-v8-v8u-full -- path/to/file.ts

# Restore entire directory
git checkout pre-refactor-v8-v8u-full -- src/v8/services/

# Restore all V8/V8U files
git checkout pre-refactor-v8-v8u-full -- src/v8/ src/v8u/
```

---

## Detailed Restore Procedures

### Scenario 1: Full Rollback (Abort Refactor)

**When to use**: Refactor failed, need to return to stable state

**Steps**:
```bash
# 1. Stash any uncommitted work
git stash save "WIP before rollback"

# 2. Checkout tag
git checkout pre-refactor-v8-v8u-full

# 3. Create new branch (don't work on detached HEAD)
git checkout -b rollback-to-stable

# 4. Force push to main branch (if needed)
# WARNING: Only do this if you're sure
git push origin rollback-to-stable:main --force

# 5. Verify restore
npm install
npm run build
npm run test
```

**Verification Checklist**:
- [ ] All V8/V8U flows working
- [ ] All MFA flows working
- [ ] Worker token service operational
- [ ] Credentials persistence working
- [ ] No console errors
- [ ] Build passes
- [ ] Tests pass

### Scenario 2: Partial Rollback (Specific Phase Failed)

**When to use**: One phase failed, need to restore specific services

**Example: Phase 2 (OIDC Core) failed, rollback OIDC changes only**

```bash
# 1. Identify files changed in Phase 2
git diff pre-refactor-v8-v8u-full HEAD --name-only | grep -E "(Discovery|JWKS|IDToken|Pkce|State|Nonce)"

# 2. Restore specific files
git checkout pre-refactor-v8-v8u-full -- src/services/discoveryService.ts
git checkout pre-refactor-v8-v8u-full -- src/services/jwksCacheService.ts
git checkout pre-refactor-v8-v8u-full -- src/services/idTokenValidationService.ts
git checkout pre-refactor-v8-v8u-full -- src/services/pkceManager.ts
git checkout pre-refactor-v8-v8u-full -- src/services/stateManager.ts
git checkout pre-refactor-v8-v8u-full -- src/services/nonceManager.ts

# 3. Restore all components importing these services
git checkout pre-refactor-v8-v8u-full -- src/v8u/components/
git checkout pre-refactor-v8-v8u-full -- src/v8/components/

# 4. Commit rollback
git commit -m "Rollback Phase 2 (OIDC Core) changes"

# 5. Test
npm run build
npm run test
```

### Scenario 3: Compare Changes (Audit What Changed)

**When to use**: Need to see what changed during refactor

```bash
# Compare current state to pre-refactor tag
git diff pre-refactor-v8-v8u-full HEAD

# Compare specific file
git diff pre-refactor-v8-v8u-full HEAD -- src/v8/services/workerTokenServiceV8.ts

# List all changed files
git diff pre-refactor-v8-v8u-full HEAD --name-only

# Show stats
git diff pre-refactor-v8-v8u-full HEAD --stat

# Compare specific directory
git diff pre-refactor-v8-v8u-full HEAD -- src/v8/services/
```

### Scenario 4: Restore Lockdown Snapshots

**When to use**: Lockdown system corrupted, need to restore snapshots

```bash
# Restore FIDO2 lockdown
git checkout pre-refactor-v8-v8u-full -- src/v8/lockdown/fido2/

# Restore MFA config lockdown
git checkout pre-refactor-v8-v8u-full -- src/v8/lockdown/mfa-config/

# Restore all locked dependencies
git checkout pre-refactor-v8-v8u-full -- src/locked/

# Verify lockdown
npm run verify:fido2-lockdown
npm run verify:mfa-config-lockdown

# If verification fails, restore from snapshot
npm run fido2:lockdown:restore
```

---

## Emergency Procedures

### Production Incident: Immediate Rollback

**If refactor causes production issues**:

```bash
# 1. IMMEDIATE: Disable feature flags (if implemented)
# Edit localStorage or environment variables:
USE_NEW_CREDENTIALS_REPO=false
USE_NEW_OIDC_CORE=false
USE_NEW_TOKEN_SERVICES=false
USE_V8_WORKER_TOKEN=false
USE_NEW_MFA_CLIENT=false

# 2. Deploy rollback branch
git checkout backup-pre-refactor-v8-v8u
npm install
npm run build
# Deploy to production

# 3. Verify production
# Test all critical flows:
# - Unified OAuth Authorization Code
# - MFA SMS enrollment
# - Worker token generation
# - Credentials persistence

# 4. Post-incident
# - Document what failed
# - Update risk assessment
# - Plan remediation
```

### Data Recovery: Lost Credentials

**If credentials migration failed**:

```bash
# 1. Check localStorage backup (if migration script created one)
# Browser DevTools → Application → Local Storage
# Look for keys: credentials_backup_*, shared_credentials_backup

# 2. Restore from tag (resets storage keys)
git checkout pre-refactor-v8-v8u-full

# 3. Clear new storage keys
# Browser DevTools → Application → Local Storage
# Delete: credentials_repo_*, pkce_manager_*, worker_token_v8

# 4. Reload application
# Old storage keys should be read automatically
```

---

## Verification Procedures

### After Any Restore

**Always run these checks**:

```bash
# 1. Clean install
rm -rf node_modules package-lock.json
npm install

# 2. Build
npm run build

# 3. Lint
npm run lint

# 4. Type check
npm run type-check

# 5. Tests
npm run test

# 6. Start dev server
npm run dev
```

**Manual QA Checklist**:
- [ ] Unified OAuth flows (6 flow types)
  - [ ] Authorization Code
  - [ ] Implicit
  - [ ] Hybrid
  - [ ] Device Code
  - [ ] Client Credentials
  - [ ] ROPC (if not deprecated)
- [ ] MFA flows (8 modalities)
  - [ ] SMS
  - [ ] Email
  - [ ] FIDO2
  - [ ] Voice
  - [ ] WhatsApp
  - [ ] TOTP
  - [ ] Push
  - [ ] Device Management
- [ ] Worker token lifecycle
  - [ ] Generation
  - [ ] Refresh
  - [ ] Status display
  - [ ] Expiration handling
- [ ] Credentials persistence
  - [ ] Save credentials
  - [ ] Load credentials
  - [ ] Shared credentials
  - [ ] Flow-specific credentials
- [ ] Lockdown systems
  - [ ] FIDO2 lockdown operational
  - [ ] MFA config lockdown operational
  - [ ] No drift detected

---

## File Inventory (Impacted Files)

### Critical Files (Restore First)

**Services** (60+ files):
```
src/v8/services/workerTokenServiceV8.ts
src/v8/services/credentialsServiceV8.ts
src/v8/services/sharedCredentialsServiceV8.ts
src/v8/services/clientCredentialsIntegrationServiceV8.ts
src/v8/services/deviceCodeIntegrationServiceV8.ts
src/v8/services/implicitFlowIntegrationServiceV8.ts
src/v8/services/hybridFlowIntegrationServiceV8.ts
src/v8/services/oauthIntegrationServiceV8.ts
src/v8/services/tokenOperationsServiceV8.ts
src/v8/services/oidcDiscoveryServiceV8.ts
src/v8/services/idTokenValidationServiceV8.ts
src/v8/services/mfaConfigurationServiceV8.ts
src/v8/services/mfaAuthenticationServiceV8.ts
src/v8/services/mfaServiceV8.ts
src/v8/services/mfaReportingServiceV8.ts
src/services/unifiedWorkerTokenServiceV2.ts
src/services/flowCredentialService.ts
src/services/pkceService.tsx
src/v8u/services/pkceStorageServiceV8U.ts
src/v8u/services/credentialReloadServiceV8U.ts
```

**High-Impact Components** (6 files, 19,000+ lines):
```
src/v8u/components/UnifiedFlowSteps.tsx (10,000+ lines)
src/v8u/components/CredentialsFormV8U.tsx (3,000+ lines)
src/v8u/flows/UnifiedOAuthFlowV8U.tsx (2,300+ lines)
src/v8/flows/MFAAuthenticationMainPageV8.tsx (1,500+ lines)
src/v8/flows/MFAConfigurationPageV8.tsx (1,200+ lines)
src/v8/flows/types/FIDO2FlowV8.tsx (1,000+ lines)
```

**Lockdown Systems** (503 files):
```
src/locked/fido2-v8/
src/locked/mfa-hub-v8/
src/locked/unified-flow-v8u/
src/locked/email-v8/
src/locked/device-code-v8/
src/v8/lockdown/fido2/
src/v8/lockdown/mfa-config/
```

### Restore by Category

**Worker Token Services** (101 files):
```bash
git checkout pre-refactor-v8-v8u-full -- $(git diff pre-refactor-v8-v8u-full HEAD --name-only | grep -i "workertoken")
```

**Credentials Services** (117 files):
```bash
git checkout pre-refactor-v8-v8u-full -- $(git diff pre-refactor-v8-v8u-full HEAD --name-only | grep -i "credential")
```

**Flow Integration Services** (80+ files):
```bash
git checkout pre-refactor-v8-v8u-full -- $(git diff pre-refactor-v8-v8u-full HEAD --name-only | grep -i "integration")
```

**PKCE Services** (40+ files):
```bash
git checkout pre-refactor-v8-v8u-full -- $(git diff pre-refactor-v8-v8u-full HEAD --name-only | grep -i "pkce")
```

---

## Contact & Escalation

### If Restore Fails

1. **Check Git status**: `git status`
2. **Check for conflicts**: `git diff`
3. **Check remote**: `git remote -v`
4. **Verify tag exists**: `git tag -l | grep pre-refactor`
5. **Verify branch exists**: `git branch -a | grep backup-pre-refactor`

### GitHub Repository

- **URL**: https://github.com/curtismu7/oauthPlayground
- **Tag**: https://github.com/curtismu7/oauthPlayground/releases/tag/pre-refactor-v8-v8u-full
- **Branch**: https://github.com/curtismu7/oauthPlayground/tree/backup-pre-refactor-v8-v8u

### Documentation References

- **Impact Analysis**: `docs/Refactor-Impact-Analysis.md`
- **Architecture**: `docs/Unified-MFA-Service-Architecture.md`
- **This Document**: `docs/RESTORE-PROCEDURES.md`

---

## Version Information

**Restore Point Versions**:
- APP: 7.7.4
- MFA: 8.4.2
- Unified: 8.0.1
- Server: 7.7.4

**Git Information**:
- Commit: 7239e417
- Branch: unified-mfa-pre-refactor
- Tag: pre-refactor-v8-v8u-full
- Backup Branch: backup-pre-refactor-v8-v8u

---

## Notes

- **Tag is immutable**: Once pushed, tag cannot be changed (good for restore points)
- **Branch can evolve**: Backup branch can receive updates if needed
- **Both pushed to GitHub**: Available on all machines
- **Lockdown systems**: Require separate restore procedures
- **Feature flags**: Provide instant rollback without code changes
- **Storage migration**: May require manual cleanup if failed

---

**Last Updated**: 2026-01-25  
**Status**: ✅ Active restore points available  
**Next Review**: After each refactor phase completion
