# Service Consolidation Strategy

**Purpose:** Detailed consolidation strategy for high-priority service candidates.

**Last Updated:** 2025-02-19  
**Status:** Phase 2 In Progress

---

## 🎯 Strategy Overview

Based on consumer mapping analysis, we'll consolidate services in order of risk and complexity:

### Phase 2.1: Worker Token Services (Week 1)
**Strategy:** Strategy B (Promote winner)
**Risk:** HIGH but manageable
**Timeline:** 1 week

### Phase 2.2: MFA Services (Week 1)  
**Strategy:** Strategy B (Promote winner)
**Risk:** MEDIUM
**Timeline:** 1 week

### Phase 2.3: Token Services (Week 2)
**Strategy:** Strategy A (Canonical + Adapter)
**Risk:** HIGH
**Timeline:** 2 weeks

---

## 🔧 Phase 2.1: Worker Token Services Consolidation

### Current State Analysis
**Canonical Service:** `src/services/unifiedWorkerTokenService.ts`
- **Why it's the winner:** Most comprehensive, 25+ consumers, full feature set
- **Interface:** Complete with KRP support, caching, IndexedDB storage
- **Consumers:** OAuth app, MFA app, Shared services, Legacy V8, Components, Pages

**Wrapper Services to Eliminate:**
- `src/apps/mfa/services/workerTokenServiceV8.ts` (MFA app wrapper)
- `src/shared/services/workerTokenServiceV8.ts` (Shared wrapper)

### Consolidation Plan

#### Step 1: Contract Tests (Day 1)
- ✅ Create comprehensive contract tests for canonical service
- ✅ Verify all public methods work as expected
- ✅ Test cross-app compatibility

#### Step 2: Update Wrappers (Day 2)
- Modify `src/apps/mfa/services/workerTokenServiceV8.ts` to delegate directly
- Modify `src/shared/services/workerTokenServiceV8.ts` to delegate directly
- Maintain backward compatibility

#### Step 3: Consumer Migration (Days 3-4)
- Update 1-2 consumers per PR to use canonical service directly
- Start with low-risk consumers (components, pages)
- End with high-risk consumers (core app services)

#### Step 4: Remove Wrappers (Day 5)
- Remove wrapper services once all consumers migrated
- Update inventory to reflect consolidation
- Add "no new usage" gate

### Implementation Details

#### Contract Test Coverage:
```typescript
// Core methods to test
- getToken(): Promise<string | null>
- getStatus(): Promise<UnifiedWorkerTokenStatus>
- saveCredentials(): Promise<void>
- loadCredentials(): Promise<UnifiedWorkerTokenCredentials | null>
- clearCredentials(): Promise<void>
- clearToken(): Promise<void>
```

#### Migration Pattern:
```typescript
// Before (wrapper)
import { workerTokenServiceV8 } from '@/apps/mfa/services/workerTokenServiceV8';

// After (canonical)
import { unifiedWorkerTokenService } from '@/services/unifiedWorkerTokenService';
```

#### Risk Mitigation:
- **Gradual migration:** 1-2 consumers per PR
- **Backward compatibility:** Wrappers remain during transition
- **Rollback plan:** Keep wrappers until all consumers migrated
- **Testing:** Full test suite after each migration

---

## 🔐 Phase 2.2: MFA Services Consolidation

### Current State Analysis
**Canonical Service:** `src/apps/mfa/services/mfaAuthenticationServiceV8.ts`
- **Why it's the winner:** Successor to deprecated service, modern implementation
- **Consumers:** 2 files in MFA app only

**Deprecated Service:** `src/apps/mfa/services/mfaServiceV8.ts`
- **Status:** Has deprecation notice
- **Consumers:** 12 files in MFA app
- **Issue:** Authentication methods being moved to mfaAuthenticationServiceV8

### Consolidation Plan

#### Step 1: Interface Analysis (Day 1)
- Compare interfaces between old and new services
- Identify missing functionality in new service
- Plan feature parity

#### Step 2: Enhance Canonical Service (Day 2)
- Add missing functionality from deprecated service
- Ensure full feature parity
- Add comprehensive tests

#### Step 3: Consumer Migration (Days 3-4)
- Update consumers to use new service
- Handle interface differences with adapters if needed
- Test all MFA functionality

#### Step 4: Remove Deprecated Service (Day 5)
- Remove deprecated service
- Update documentation
- Add deprecation warnings for any remaining old imports

### Implementation Details

#### Feature Parity Checklist:
- [ ] Device registration methods
- [ ] Authentication flows
- [ ] Error handling
- [ ] Token management
- [ ] Configuration management

#### Migration Pattern:
```typescript
// Before (deprecated)
import { mfaServiceV8 } from '@/apps/mfa/services/mfaServiceV8';

// After (canonical)
import { mfaAuthenticationServiceV8 } from '@/apps/mfa/services/mfaAuthenticationServiceV8';
```

---

## 🔄 Phase 2.3: Token Services Consolidation

### Current State Analysis
**Most Complex:** Multiple token services across different locations
- `src/apps/oauth/services/tokenMonitoringService.ts` (OAuth app)
- `src/shared/services/tokenOperationsServiceV8.ts` (Shared)
- `src/services/tokenManagementService.ts` (Legacy)
- Plus 5+ other token-related services

### Consolidation Plan

#### Step 1: Create Canonical Service (Days 1-2)
- Design unified token service interface
- Implement canonical service in `src/shared/services/`
- Add comprehensive contract tests

#### Step 2: Create Adapters (Day 3)
- Create adapter for OAuth app token monitoring
- Create adapter for shared token operations
- Maintain backward compatibility

#### Step 3: Gradual Migration (Days 4-6)
- Migrate consumers 1-2 at a time
- Start with low-risk services
- End with critical OAuth app services

#### Step 4: Remove Old Services (Days 7-10)
- Remove legacy services once all consumers migrated
- Clean up adapters
- Update documentation

### Implementation Details

#### Canonical Service Interface:
```typescript
interface UnifiedTokenService {
  // Core token operations
  getToken(): Promise<TokenData | null>;
  setToken(token: TokenData): Promise<void>;
  removeToken(): Promise<void>;
  
  // Token monitoring
  getTokenStatus(): Promise<TokenStatus>;
  refreshToken(): Promise<TokenData>;
  
  // Token validation
  validateToken(token: string): Promise<boolean>;
}
```

#### Adapter Pattern:
```typescript
// Adapter for OAuth app
class TokenMonitoringAdapter {
  constructor(private unifiedService: UnifiedTokenService) {}
  
  async monitorToken(): Promise<TokenInfo> {
    // Delegate to unified service
    return this.unifiedService.getTokenStatus();
  }
}
```

---

## 📊 Success Metrics

### Phase 2.1 (Worker Token Services):
- **Services Reduced:** 3 → 1 (67% reduction)
- **Consumers Migrated:** 25+ files
- **Risk:** HIGH → LOW (after consolidation)

### Phase 2.2 (MFA Services):
- **Services Reduced:** 2 → 1 (50% reduction)
- **Deprecation Resolved:** ✅
- **Risk:** MEDIUM → LOW

### Phase 2.3 (Token Services):
- **Services Reduced:** 8 → 2 (75% reduction)
- **Complexity:** HIGH → MEDIUM
- **Maintenance:** Significantly reduced

---

## 🚨 Stop-Ship Rules

### Before Each Consolidation:
1. **Contract Tests Pass:** ✅ Required
2. **Consumer Mapping Complete:** ✅ Required
3. **Rollback Plan Ready:** ✅ Required
4. **Cross-App Testing:** ✅ Required

### During Consolidation:
1. **One Service at a Time:** No parallel consolidations
2. **Gradual Migration:** 1-2 consumers per PR
3. **Full Testing:** Build + lint + functional tests
4. **Rollback Ready:** <5 minute rollback capability

### After Consolidation:
1. **Remove Old Services:** Only when zero consumers
2. **Update Documentation:** Inventory and service docs
3. **Add Gates:** "No new usage" checks
4. **Monitor:** Watch for regressions

---

## 📋 Next Steps

1. **Execute Phase 2.1:** Worker Token Services (Week 1)
2. **Execute Phase 2.2:** MFA Services (Week 1)
3. **Execute Phase 2.3:** Token Services (Week 2)
4. **Update Inventory:** Reflect all consolidations
5. **Prepare Phase 3:** Next round of consolidations

---

## 🎯 Expected Outcomes

### After Phase 2 Complete:
- **Total Services Reduced:** 139 → ~115 (17% reduction)
- **Maintenance Overhead:** Significantly reduced
- **Code Clarity:** Single source of truth for each domain
- **Developer Experience:** Easier to understand and maintain
- **Risk:** Lower regression risk with consolidated services

---

*Phase 2 Strategy Complete: Ready for implementation with detailed plans and risk mitigation*
