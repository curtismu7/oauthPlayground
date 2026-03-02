# Service Usage & Upgrade Tracking

## 📋 Purpose
Track all services used by V7, V8, V9 flows and their upgrade status. This helps identify:
- Services that can be archived (no longer used)
- Services that have been upgraded to newer versions
- Service dependencies across versions

---

## 🎯 Service Tracking Matrix

### **V7 Services (Side Menu Flows)**

| Service Name | Used By V7 Flows | V9 Equivalent | Upgrade Status | Archive Candidate |
|-------------|------------------|---------------|----------------|------------------|
| ComprehensiveCredentialsService | All 12 flows | V9CredentialService | ⏳ Planned | ✅ After V9 migration |
| CopyButtonService | All 12 flows | Built-in V9 copy | ⏳ Planned | ✅ After V9 migration |
| CredentialGuardService | All 12 flows | V9CredentialValidationService | ⏳ Planned | ✅ After V9 migration |
| FlowHeader Service | All 12 flows | V9FlowHeader | ❌ Missing | ❌ Need V9 equivalent |
| FlowUIService | All 12 flows | V9FlowUI | ❌ Missing | ❌ Need V9 equivalent |
| UnifiedTokenDisplayService | All 12 flows | V9TokenDisplay | ⏳ Planned | ✅ After V9 migration |
| v4ToastManager | All 12 flows | V9MessagingService | ✅ CREATED | ✅ After V9 migration |
| FlowCompletionService | 2 flows | V9FlowCompletion | ❌ Missing | ❌ Need V9 equivalent |
| oidcDiscoveryService | 1 flow | V9DiscoveryService | ❌ Missing | ❌ Need V9 equivalent |
| ModalPresentationService | 1 flow | V9ModalService | ❌ Missing | ❌ Need V9 equivalent |
| OAuthFlowComparisonService | 1 flow | V9FlowComparison | ❌ Missing | ❌ Need V9 equivalent |
| comprehensiveFlowDataService | 1 flow | V9FlowDataService | ❌ Missing | ❌ Need V9 equivalent |

### **V8 Services (Transitional)**

| Service Name | Used By V8 Components | V9 Equivalent | Upgrade Status | Archive Candidate |
|-------------|----------------------|---------------|----------------|------------------|
| WorkerTokenModalV8 | TokenExchangeFlowV7, WorkerTokenFlowV7 | V9WorkerTokenModal | ⏳ Planned | ✅ After V9 migration |
| WorkerTokenExpiryBannerV8 | TokenExchangeFlowV7, WorkerTokenFlowV7 | V9WorkerTokenExpiryBanner | ⏳ Planned | ✅ After V9 migration |
| TokenDisplayV8 | V8 flows | V9TokenDisplay | ⏳ Planned | ✅ After V9 migration |
| JWTConfigV8 | V8 flows | V9JWTConfig | ⏳ Planned | ✅ After V9 migration |
| toastNotificationsV8 | V8 flows | V9MessagingService | ✅ AVAILABLE | ✅ After V9 migration |

### **V9 Services (Target Architecture)**

| Service Name | Status | Used By | Replaces | Notes |
|-------------|--------|---------|----------|-------|
| V9MessagingService | ✅ CREATED | Ready for use | v4ToastManager, toastNotificationsV8 | Modern Messaging API |
| V9CredentialService | ✅ EXISTS | Target | ComprehensiveCredentialsService | Credential management |
| V9CredentialValidationService | ✅ EXISTS | Target | CredentialGuardService | Security validation |
| V9TokenService | ✅ EXISTS | Target | Token services | Token endpoint simulation |
| V9StateStore | ✅ EXISTS | Target | State management | Ephemeral + sessionStorage |
| V9TokenGenerator | ✅ EXISTS | Target | Token generation | JWT token creation |
| V9UserInfoService | ✅ EXISTS | Target | User info services | OIDC userinfo endpoint |
| V9IntrospectionService | ✅ EXISTS | Target | Token introspection | Token validation |
| V9DeviceAuthorizationService | ✅ EXISTS | Target | Device auth | Device code flow |
| V9WorkerTokenStatusService | ✅ EXISTS | Target | Worker token management | Worker token status |
| V9AuthorizeService | ✅ EXISTS | Target | Authorization endpoint | Auth endpoint simulation |
| V9SpecVersionService | ✅ EXISTS | Target | Specification versions | Version management |

---

## 🔄 Upgrade Tracking Log

### **2026-03-02: V9MessagingService Creation**
- **Service**: V9MessagingService
- **Replaces**: v4ToastManager, toastNotificationsV8
- **Status**: ✅ CREATED
- **File**: `src/services/v9/V9MessagingService.ts`
- **Features**: Modern Messaging API, categories (wait, banner, footer, modal, toast)
- **Migration Impact**: All V7/V8 flows using toast notifications
- **Archive Candidates**: v4ToastManager, toastNotificationsV8

---

## 📊 Service Usage Analysis

### **High Priority Services (Used by >50% of flows)**
1. **ComprehensiveCredentialsService** - 12/12 V7 flows (100%)
2. **CopyButtonService** - 12/12 V7 flows (100%)
3. **CredentialGuardService** - 12/12 V7 flows (100%)
4. **FlowHeader Service** - 12/12 V7 flows (100%)
5. **FlowUIService** - 12/12 V7 flows (100%)
6. **UnifiedTokenDisplayService** - 12/12 V7 flows (100%)
7. **v4ToastManager** - 12/12 V7 flows (100%)

### **Medium Priority Services (Used by 2-5 flows)**
1. **FlowCompletionService** - 2/12 V7 flows (17%)
2. **oidcDiscoveryService** - 1/12 V7 flows (8%)
3. **ModalPresentationService** - 1/12 V7 flows (8%)
4. **OAuthFlowComparisonService** - 1/12 V7 flows (8%)
5. **comprehensiveFlowDataService** - 1/12 V7 flows (8%)

### **V8 Dependencies**
- **WorkerTokenModalV8** - Used by 2 V7 flows
- **WorkerTokenExpiryBannerV8** - Used by 2 V7 flows

---

## 🗄️ Archive Candidates

### **Ready for Archive (After V9 Migration)**
- ✅ **v4ToastManager** - Replaced by V9MessagingService
- ✅ **toastNotificationsV8** - Replaced by V9MessagingService
- ✅ **WorkerTokenModalV8** - Replaced by V9WorkerTokenModal
- ✅ **WorkerTokenExpiryBannerV8** - Replaced by V9WorkerTokenExpiryBanner
- ⏳ **ComprehensiveCredentialsService** - After V9CredentialService migration
- ⏳ **CopyButtonService** - After V9 copy implementation
- ⏳ **CredentialGuardService** - After V9CredentialValidationService migration
- ⏳ **UnifiedTokenDisplayService** - After V9TokenDisplay migration

### **Need V9 Equivalents First**
- ❌ **FlowHeader Service** - Critical (100% usage)
- ❌ **FlowUIService** - Critical (100% usage)
- ❌ **FlowCompletionService** - Medium priority
- ❌ **oidcDiscoveryService** - Low priority
- ❌ **ModalPresentationService** - Low priority
- ❌ **OAuthFlowComparisonService** - Low priority
- ❌ **comprehensiveFlowDataService** - Low priority

---

## 🎯 Migration Priority

### **Phase 1: Critical Services (100% Usage)**
1. Create V9FlowHeader (replaces FlowHeader Service)
2. Create V9FlowUI (replaces FlowUIService)
3. Migrate V7 flows to use V9CredentialService
4. Migrate V7 flows to use V9CredentialValidationService
5. Replace v4ToastManager with V9MessagingService

### **Phase 2: High Impact Services**
1. Create V9FlowCompletion (replaces FlowCompletionService)
2. Migrate UnifiedTokenDisplayService to V9TokenDisplay
3. Replace CopyButtonService with V9 copy implementation

### **Phase 3: Low Usage Services**
1. Create V9DiscoveryService (replaces oidcDiscoveryService)
2. Create V9ModalService (replaces ModalPresentationService)
3. Create V9FlowComparison (replaces OAuthFlowComparisonService)
4. Create V9FlowDataService (replaces comprehensiveFlowDataService)

### **Phase 4: V8 Dependencies**
1. Create V9WorkerTokenModal (replaces WorkerTokenModalV8)
2. Create V9WorkerTokenExpiryBanner (replaces WorkerTokenExpiryBannerV8)
3. Update all V7 flows using V8 components

---

## 📈 Success Metrics

### **Migration Progress Tracking**
- **Services Analyzed**: 23 total services
- **V9 Equivalents Available**: 10 services
- **V9 Equivalents Needed**: 13 services
- **Services Created**: 1 (V9MessagingService)
- **Services Ready for Archive**: 5 (after migration)

### **Quality Gates**
- ✅ No breaking changes during migration
- ✅ All V7 flows maintain functionality
- ✅ V9 services provide equivalent or better functionality
- ✅ Modern Messaging compliance achieved
- ✅ Biome linting maintained

---

## 🔄 Update Guidelines

### **When Services Are Upgraded**
1. Update this tracking document
2. Mark old service as "Archive Candidate"
3. Document migration date and method
4. Update service usage matrix
5. Commit changes with service upgrade details

### **When New Services Are Created**
1. Add to V9 services table
2. Document what it replaces
3. Update migration priority
4. Track usage in V7/V8 flows
5. Plan archival of old services

### **When Services Are Archived**
1. Mark as "ARCHIVED" with date
2. Document archival reason
3. Confirm no active usage
4. Remove from active service list
5. Update migration completion status

---

*Last Updated: 2026-03-02*
*Next Update: After each service upgrade*
