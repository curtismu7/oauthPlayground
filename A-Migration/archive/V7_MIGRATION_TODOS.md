# V7 Migration — Remaining TODOs

**Last Updated:** March 2, 2026 — Legacy flow maintenance and deprecation planning  
**Reference:** [migrate_vscode.md](./migrate_vscode.md) — full migration guide  
**Status:** V7 flows are legacy - focus on deprecation, critical fixes, and migration to V9

---

## 🚨 CRITICAL — Infinite Loop Prevention *(March 2, 2026)*

### Fixed Issues
- ✅ **useImplicitFlowController infinite loop** - Fixed useEffect dependency array
- ✅ **TokenRevocationFlow export issue** - Fixed component naming mismatch  
- ✅ **FlowCredentials Environment ID field** - Expanded for full width display

### Prevention Tests Added
- ✅ **Test File**: `src/test/infinite-loop-prevention.test.tsx`
- ✅ **Script**: `scripts/tests/test-infinite-loop-prevention-simple.sh`
- ✅ **Migration Framework**: Added to `MIGRATION_TESTING_FRAMEWORK.md`

**Run Prevention Test:**
```bash
./scripts/tests/test-infinite-loop-prevention-simple.sh
```

---

## 🟠 High Priority — Deprecation Planning

### V7 Flows Requiring V9 Migration
| V7 Flow | V9 Status | Priority | Action |
|--------|-----------|----------|--------|
| `/flows/token-exchange-v7` | ✅ Migrated | **Completed** | Remove V7 entry |
| `/flows/implicit-v7` | ✅ Migrated | **Completed** | Remove V7 entry |
| `/flows/oauth-authorization-code-v7` | ✅ Migrated | **Completed** | Remove V7 entry |
| `/flows/oauth-client-credentials-v7` | ✅ Migrated | **Completed** | Remove V7 entry |
| `/flows/device-authorization-v7` | ✅ Migrated | **Completed** | Remove V7 entry |
| `/flows/oidc-hybrid-v7` | ✅ Migrated | **Completed** | Remove V7 entry |
| `/flows/jwt-bearer-token-v7` | ✅ Migrated | **Completed** | Remove V7 entry |
| `/flows/saml-bearer-assertion-v7` | ✅ Migrated | **Completed** | Remove V7 entry |
| `/flows/rar-flow-v7` | ✅ Migrated | **Completed** | Remove V7 entry |
| `/flows/ciba-flow-v7` | ✅ Migrated | **Completed** | Remove V7 entry |

### V7 Flows Still Active
| V7 Flow | V9 Status | Priority | Action |
|--------|-----------|----------|--------|
| `/flows/pingone-par-v7` | 🔄 Not Migrated | **High** | Migrate to V9 |
| `/flows/pingone-complete-mfa-v7` | 🔄 Not Migrated | **High** | Migrate to V9 |
| `/flows/pingone-mfa-workflow-library-v7` | 🔄 Not Migrated | **High** | Migrate to V9 |
| `/flows/worker-token-v7` | 🔄 Not Migrated | **Medium** | Migrate to V9 |
| `/flows/oauth-ropc-v7` | 🔄 Not Migrated | **Low** | Deprecate (OAuth 2.1) |

---

## 🟡 Medium Priority — Code Quality & Maintenance

### Critical Code Issues in V7 Flows
- [ ] **TypeScript `any` types** - Replace with proper interfaces
- [ ] **Console.error usage** - Replace with proper error handling
- [ ] **Missing error boundaries** - Add for better UX
- [ ] **Accessibility issues** - Add ARIA labels and keyboard navigation
- [ ] **Performance optimizations** - Memoize expensive operations

### V7 Flow Health Check
```bash
# Run health check on remaining V7 flows
npx tsc --noEmit src/pages/flows/*V7.tsx
npx biome check src/pages/flows/*V7.tsx
```

---

## 🟢 Low Priority — Documentation & Cleanup

### Documentation Updates
- [ ] **V7 Flow Documentation** - Add deprecation notices
- [ ] **Migration Guides** - Update with V9 equivalents
- [ ] **API Documentation** - Mark V7 endpoints as legacy

### Code Cleanup
- [ ] **Remove unused imports** - Clean up V7 flow files
- [ ] **Standardize naming** - Consistent component and variable names
- [ ] **Remove dead code** - Eliminate unused functions and components

---

## 🔵 V7 Flows Requiring Immediate Attention

### PingOne PAR V7
- **File:** `src/pages/flows/PingOnePARFlowV7.tsx`
- **Issues:** 
  - [ ] Check for infinite loop patterns
  - [ ] Verify component exports
  - [ ] Test functionality
  - [ ] Plan V9 migration

### PingOne MFA V7
- **File:** `src/v8/flows/CompleteMFAFlowV8.tsx` (used by V7)
- **Issues:**
  - [ ] Complex MFA lifecycle dependencies
  - [ ] Service integration testing
  - [ ] Plan V9 migration strategy

### Worker Token V7
- **File:** `src/pages/flows/WorkerTokenFlowV7.tsx`
- **Issues:**
  - [ ] Legacy worker token service usage
  - [ ] Test current functionality
  - [ ] Plan V9 migration

---

## ⚙️ V7 Services — Legacy Maintenance

### Service Dependencies
| Service | V7 Usage | V9 Status | Action |
|---------|----------|-----------|--------|
| `credentialsServiceV7` | Active | Replaced | Migrate consumers |
| `workerTokenServiceV7` | Active | Partial | Migrate consumers |
| `mfaServiceV7` | Active | Planning | Migrate consumers |
| `flowLoggerServiceV7` | Active | Planning | Migrate consumers |

### Service Migration Priority
1. **credentialsServiceV7** → V9CredentialService
2. **workerTokenServiceV7** → V9TokenService  
3. **mfaServiceV7** → V9MFAService
4. **flowLoggerServiceV7** → V9LoggingService

---

## 🔍 V7 Flow Audit Results *(March 2, 2026)*

### Code Quality Issues Found
| Flow | TypeScript Errors | Lint Errors | Infinite Loop Risk | Accessibility |
|------|------------------|-------------|-------------------|---------------|
| `PingOnePARFlowV7` | 0 | 0 | ✅ Low | 🟡 Missing |
| `CompleteMFAFlowV7` | 0 | 0 | ✅ Low | 🟡 Missing |
| `WorkerTokenFlowV7` | 0 | 0 | ✅ Low | 🟡 Missing |
| `OAuthROPCFlowV7` | 0 | 0 | ✅ Low | 🟡 Missing |

### Performance Issues
- [ ] **Unnecessary re-renders** - Add React.memo where appropriate
- [ ] **Large bundle sizes** - Code splitting for heavy flows
- [ ] **Memory leaks** - Add cleanup to useEffect hooks

---

## 🚀 Deprecation Timeline

### Phase 1: Immediate (March 2026)
- [ ] Add deprecation notices to V7 flow headers
- [ ] Create V9 equivalents for remaining flows
- [ ] Update sidebar to highlight V9 versions

### Phase 2: Short Term (April-May 2026)
- [ ] Migrate PingOne PAR V7 → V9
- [ ] Migrate PingOne MFA V7 → V9
- [ ] Migrate Worker Token V7 → V9

### Phase 3: Medium Term (June-July 2026)
- [ ] Remove migrated V7 flows from sidebar
- [ ] Add redirect notices for removed V7 routes
- [ ] Archive V7 flow files

### Phase 4: Long Term (August 2026+)
- [ ] Complete V7 deprecation
- [ ] Remove V7 service dependencies
- [ ] Clean up V7 documentation

---

## 📋 V7 Migration Checklist

### Before V9 Migration
- [ ] Run infinite loop prevention test
- [ ] Verify TypeScript compilation
- [ ] Check lint errors
- [ ] Test flow functionality
- [ ] Document V7-specific features

### During V9 Migration
- [ ] Copy V7 logic to V9 structure
- [ ] Update imports to use V9 services
- [ ] Replace V7 UI patterns with V9 patterns
- [ ] Add V9 credential storage and app picker
- [ ] Test V9 functionality

### After V9 Migration
- [ ] Remove V7 sidebar entry
- [ ] Add V7 route redirect to V9
- [ ] Archive V7 flow file
- [ ] Update documentation
- [ ] Run regression tests

---

## ✅ Completed V7 Migrations

| V7 Flow | V9 Flow | Date | Notes |
|---------|---------|------|-------|
| Token Exchange V7 | TokenExchangeFlowV9 | Feb 26, 2026 | 5-step wizard |
| Implicit Flow V7 | ImplicitFlowV9 | Feb 26, 2026 | Fixed infinite loop |
| Client Credentials V7 | ClientCredentialsFlowV9 | Feb 26, 2026 | Added V9 services |
| Authorization Code V7 | OAuthAuthorizationCodeFlowV9 | Feb 26, 2026 | Enhanced UI |
| Device Authorization V7 | DeviceAuthorizationFlowV9 | Feb 26, 2026 | Multi-variant support |
| OIDC Hybrid V7 | OIDCHybridFlowV9 | Feb 26, 2026 | Improved messaging |
| JWT Bearer Token V7 | JWTBearerTokenFlowV9 | Feb 26, 2026 | Fixed TypeScript issues |
| SAML Bearer Assertion V7 | SAMLBearerAssertionFlowV9 | Feb 26, 2026 | Enhanced validation |
| RAR Flow V7 | RARFlowV9 | Feb 26, 2026 | Added V9 patterns |
| CIBA Flow V7 | CIBAFlowV9 | Feb 28, 2026 | Back-channel support |

---

## 🔧 Quick Fix Commands

### Infinite Loop Prevention
```bash
# Run prevention test
./scripts/tests/test-infinite-loop-prevention-simple.sh

# Check for problematic patterns
grep -r "useEffect.*\[.*credentials.*\]" src/pages/flows/*V7.tsx
```

### TypeScript Check
```bash
# Check all V7 flows
npx tsc --noEmit src/pages/flows/*V7.tsx

# Fix common issues
npx biome check --fix src/pages/flows/*V7.tsx
```

### Accessibility Check
```bash
# Check for missing ARIA labels
grep -r "button.*>" src/pages/flows/*V7.tsx | grep -v "aria-"
```

---

**Status:** 🟡 **MAINTENANCE MODE** - V7 flows are legacy, focus on deprecation and critical fixes only  
**Next Milestone:** Complete V9 migration for all remaining V7 flows by May 2026
