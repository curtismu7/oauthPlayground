# V8 Migration — Remaining TODOs

**Last Updated:** March 2, 2026 — Service migration and V9 integration planning  
**Reference:** [migrate_vscode.md](./migrate_vscode.md) — full migration guide  
**Status:** V8 flows are stable - focus on service migration to V9 and V9 flow integration

---

## 🚨 CRITICAL — Service Migration Dependencies *(March 2, 2026)*

### V8 Services Blocking V9 Migration
| V8 Service | V9 Target | Consumers | Priority | Status |
|------------|-----------|-----------|----------|--------|
| `mfaServiceV8` | `V9MFAService` | ~75 imports | **High** | 🔄 Planning |
| `credentialsServiceV8` | `V9CredentialService` | ~70 imports | **High** | 🔄 Planning |
| `workerTokenServiceV8` | `V9TokenService` | ~45 imports | **Medium** | 🔄 Planning |
| `unifiedFlowLoggerServiceV8` | `V9LoggingService` | ~30 imports | **Low** | 🔄 Next up |

### Service Migration Impact
- **MFA Service**: Critical for PingOne flows, complex lifecycle management
- **Credentials Service**: Core storage, affects all flows
- **Worker Token Service**: Token management and discovery
- **Logger Service**: Debugging and audit trails

---

## 🟠 High Priority — V8 Flow V9 Integration

### V8 Flows Without V9 Equivalents
| V8 Flow | Route | V9 Status | Complexity | Action |
|---------|-------|-----------|------------|--------|
| OAuth Authorization Code V8 | `/flows/oauth-authorization-code-v8` | 🔄 Exists | **Medium** | Compare & Merge |
| Implicit Flow V8 | `/flows/implicit-v8` | 🔄 Exists | **Medium** | Compare & Merge |
| DPoP Authorization Code V8 | `/flows/dpop-authorization-code-v8` | ❌ Missing | **High** | Create V9 |
| PingOne PAR V8 | `/flows/pingone-par-v8` | ❌ Missing | **High** | Create V9 |
| Complete MFA V8 | `/flows/pingone-complete-mfa-v8` | ❌ Missing | **High** | Create V9 |
| MFA Workflow Library V8 | `/flows/pingone-mfa-workflow-library-v8` | ❌ Missing | **High** | Create V9 |

### V8 vs V9 Feature Comparison
- [ ] **OAuth Authorization Code V8 vs V9** - Identify unique V8 features
- [ ] **Implicit Flow V8 vs V9** - Check for missing functionality
- [ ] **DPoP Implementation** - V8 only, needs V9 creation
- [ ] **MFA Integration** - Complex service dependencies

---

## 🟡 Medium Priority — V8 Service Modernization

### Service Architecture Updates
- [ ] **mfaServiceV8 Refactor** - Prepare for V9 migration
- [ ] **credentialsServiceV8 Enhancement** - Add missing V9 features
- [ ] **workerTokenServiceV8 Update** - Align with V9 patterns
- [ ] **unifiedFlowLoggerServiceV8 Simplify** - Reduce complexity

### Service Integration Testing
```bash
# Test V8 service compatibility
npm test -- --testPathPattern="services.*v8"

# Check V8 service imports
grep -r "import.*ServiceV8" src/ | wc -l
```

---

## 🟢 Low Priority — V8 Flow Maintenance

### V8 Flow Health Monitoring
| Flow | TypeScript | Lint | Performance | Accessibility |
|------|------------|------|-------------|---------------|
| OAuthAuthorizationCodeFlowV8 | ✅ | ✅ | 🟡 Needs Review | 🟡 Missing |
| ImplicitFlowV8 | ✅ | ✅ | 🟡 Needs Review | 🟡 Missing |
| CompleteMFAFlowV8 | ✅ | ✅ | 🟡 Needs Review | 🟡 Missing |
| MFAFlowV8 | ✅ | ✅ | 🟡 Needs Review | 🟡 Missing |

### Code Quality Improvements
- [ ] **Add TypeScript strict mode** - Improve type safety
- [ ] **Performance optimization** - Memoize expensive operations
- [ ] **Accessibility enhancements** - Add ARIA labels and keyboard navigation
- [ ] **Error boundary implementation** - Better error handling

---

## 🔵 V8 Services — Migration Progress

### mfaServiceV8 → V9MFAService
**Complexity:** High - 75+ consumers, complex MFA lifecycle

**Migration Steps:**
1. [ ] **Audit all consumers** - Map usage patterns
2. [ ] **Design V9 interface** - Maintain compatibility
3. [ ] **Implement V9MFAService** - Core functionality
4. [ ] **Create adapter** - Backward compatibility layer
5. [ ] **Gradual rollout** - Update consumers flow by flow

**Critical Consumers:**
- `CompleteMFAFlowV8.tsx`
- `MFAFlowV8.tsx`
- `MFALoginHintFlowV9.tsx` (already V9, uses V8 service)

### credentialsServiceV8 → V9CredentialService
**Complexity:** High - 70+ consumers, core storage functionality

**Migration Steps:**
1. [ ] **Compare implementations** - Identify gaps
2. [ ] **Merge missing features** - Enhance V9 service
3. [ ] **Update import paths** - Gradual migration
4. [ ] **Test data migration** - Ensure compatibility

**Known Gaps:**
- [ ] Legacy credential formats
- [ ] Migration helpers
- [ ] Backup/restore functionality

### workerTokenServiceV8 → V9TokenService
**Complexity:** Medium - 45+ consumers, partial V9 implementation exists

**Migration Steps:**
1. [ ] **Diff services** - Identify missing methods
2. [ ] **Enhance V9TokenService** - Add missing functionality
3. [ ] **Create adapter** - Smooth transition
4. [ ] **Update consumers** - Replace V8 imports

### unifiedFlowLoggerServiceV8 → V9LoggingService
**Complexity:** Low - 30+ consumers, simple logging interface

**Migration Steps:**
1. [ ] **Locate source file** - Find V8 implementation
2. [ ] **Create V9LoggingService** - Copy and modernize
3. [ ] **Fix import paths** - Update consumers
4. [ ] **Add adapter** - Backward compatibility

---

## 🔍 V8 Flow Analysis *(March 2, 2026)*

### V8 Flow Inventory
| Flow | File | Lines | Complexity | V9 Status |
|------|------|-------|------------|------------|
| OAuth Authorization Code | `src/v8/flows/OAuthAuthorizationCodeFlowV8.tsx` | ~2000 | Medium | 🔄 Exists |
| Implicit | `src/v8/flows/ImplicitFlowV8.tsx` | ~1500 | Medium | 🔄 Exists |
| Complete MFA | `src/v8/flows/CompleteMFAFlowV8.tsx` | ~3000 | High | ❌ Missing |
| MFA Workflow | `src/v8/flows/MFAFlowV8.tsx` | ~2500 | High | ❌ Missing |
| DPoP Auth Code | `src/v8/flows/DPoPAuthorizationCodeFlowV8.tsx` | ~1800 | High | ❌ Missing |

### V8 Unique Features
- **Enhanced MFA flows** - Comprehensive lifecycle management
- **DPoP support** - Demonstration of OAuth 2.1 features
- **Advanced error handling** - Better user experience
- **Service integration** - Deep V8 service usage

---

## 🚀 V8 to V9 Migration Strategy

### Phase 1: Service Foundation (March 2026)
- [ ] Complete V9MFAService implementation
- [ ] Enhance V9CredentialService
- [ ] Finalize V9TokenService
- [ ] Create V9LoggingService

### Phase 2: Flow Migration (April-May 2026)
- [ ] Migrate DPoP Authorization Code V8 → V9
- [ ] Migrate PingOne PAR V8 → V9
- [ ] Migrate Complete MFA V8 → V9
- [ ] Migrate MFA Workflow V8 → V9

### Phase 3: Integration & Cleanup (June 2026)
- [ ] Compare existing V9 flows with V8 versions
- [ ] Merge unique V8 features into V9
- [ ] Remove redundant V8 flows
- [ ] Update sidebar configuration

### Phase 4: Service Migration (July-August 2026)
- [ ] Migrate all V8 service consumers
- [ ] Remove V8 service dependencies
- [ ] Archive V8 service files
- [ ] Update documentation

---

## 📋 V8 Service Migration Checklist

### Before Migration
- [ ] Audit all service consumers
- [ ] Document V8-specific features
- [ ] Create V9 service interfaces
- [ ] Plan backward compatibility

### During Migration
- [ ] Implement V9 service with V8 features
- [ ] Create adapter for smooth transition
- [ ] Update consumers gradually
- [ ] Test functionality at each step

### After Migration
- [ ] Remove V8 service imports
- [ ] Archive V8 service files
- [ ] Update documentation
- [ ] Run integration tests

---

## 🔧 V8 Service Commands

### Service Usage Analysis
```bash
# Find all V8 service imports
grep -r "ServiceV8" src/ --include="*.tsx" --include="*.ts"

# Count consumers per service
grep -r "mfaServiceV8" src/ | wc -l
grep -r "credentialsServiceV8" src/ | wc -l
grep -r "workerTokenServiceV8" src/ | wc -l
```

### Service Testing
```bash
# Test V8 services in isolation
npm test -- --testPathPattern="v8.*service"

# Check V8 service TypeScript compilation
npx tsc --noEmit src/v8/services/*.ts
```

### Migration Validation
```bash
# Verify V9 service compatibility
npm test -- --testPathPattern="v9.*service"

# Check for remaining V8 imports
grep -r "from.*v8" src/pages/flows/v9/ || echo "No V8 imports in V9 flows"
```

---

## ✅ Completed V8 Work

| Service/Flow | V9 Status | Date | Notes |
|--------------|-----------|------|-------|
| V9CredentialStorageService | ✅ Complete | Mar 2, 2026 | 4-layer storage |
| V9AppDiscoveryService | ✅ Complete | Mar 2, 2026 | App picker integration |
| V9WorkerTokenStatusService | ✅ Complete | Feb 28, 2026 | Status monitoring |
| V9SpecVersionService | ✅ Complete | Feb 28, 2026 | Version management |
| V8 Flow UI Patterns | ✅ Documented | Feb 26, 2026 | Migration guide |

---

## 🎯 V8 Success Metrics

### Service Migration Progress
- **Services Migrated**: 2/4 (50%)
- **Consumers Updated**: 0/220 (0%)
- **V9 Flows Using V8 Services**: 3/13 (23%)

### Flow Migration Progress
- **V8 Flows Analyzed**: 5/5 (100%)
- **V9 Equivalents Created**: 2/5 (40%)
- **Unique Features Merged**: 0/5 (0%)

### Quality Metrics
- **TypeScript Errors**: 0 in V8 flows
- **Lint Errors**: 0 in V8 flows
- **Test Coverage**: Needs improvement

---

**Status:** 🟡 **TRANSITION PHASE** - V8 flows stable, focus on service migration to V9  
**Next Milestone:** Complete V9MFAService implementation and begin MFA flow migration
