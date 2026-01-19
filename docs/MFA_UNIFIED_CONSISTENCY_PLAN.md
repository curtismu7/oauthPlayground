# MFA & Unified Flow Consistency Plan

**Date:** 2026-01-19  
**Goal:** Make MFA and Unified flows appear written by the same programmer  
**Status:** Analysis Complete, Plan Ready for Implementation

---

## Current State Analysis

### Architecture Comparison

| Aspect | Unified Flow | MFA Flow | Match? |
|--------|--------------|----------|--------|
| **Page Width** | 1400px | 1400px | ✅ YES |
| **Navigation Style** | Separated buttons, colored outlines | Separated buttons, colored outlines | ✅ YES |
| **Documentation Page** | Category cards, live tracking | Category cards, live tracking | ✅ YES |
| **Component Pattern** | Container + Steps | Router + Factory + Controller | ❌ DIFFERENT |
| **Main Component Size** | 13,832 lines (UnifiedFlowSteps) | 6,603 lines (MFAAuthenticationMainPageV8) | ⚠️ BOTH LARGE |
| **Service Layer** | Direct service calls | Controller layer → Services | ❌ DIFFERENT |
| **State Management** | React state + URL params | React state + Controllers | ⚠️ SIMILAR |
| **Storage Services** | Dedicated (PKCE, Credentials) | Generic (Credentials) | ⚠️ SIMILAR |
| **Error Handling** | UnifiedFlowErrorHandler | Inline try-catch | ❌ DIFFERENT |
| **Logging Service** | UnifiedFlowLoggerService | Console.log | ❌ DIFFERENT |
| **API Tracking** | apiCallTrackerService | apiCallTrackerService | ✅ YES |

### File Structure Comparison

**Unified:**
```
src/v8u/
├── flows/
│   └── UnifiedOAuthFlowV8U.tsx (Container, 2k lines)
├── components/
│   ├── UnifiedFlowSteps.tsx (Step logic, 13.8k lines)
│   ├── UnifiedNavigationV8U.tsx
│   ├── CredentialsFormV8U.tsx
│   └── FlowTypeSelector.tsx
└── services/
    ├── unifiedFlowIntegrationV8U.ts (Facade)
    ├── pkceStorageServiceV8U.ts
    ├── flowSettingsServiceV8U.ts
    ├── unifiedFlowErrorHandlerV8U.ts
    └── unifiedFlowLoggerServiceV8U.ts
```

**MFA:**
```
src/v8/flows/
├── MFAAuthenticationMainPageV8.tsx (6.6k lines)
├── MFAHubV8.tsx
├── factories/
│   ├── MFAFlowComponentFactory.ts
│   └── MFAFlowControllerFactory.ts
├── controllers/
│   ├── MFAFlowController.ts
│   ├── SMSFlowController.ts
│   ├── EmailFlowController.ts
│   └── [others]
├── types/
│   ├── SMS specific (SMSFlowV8.tsx)
│   ├── Email specific (EmailFlowV8.tsx)
│   └── [8 device types]
└── shared/
    └── MFAFlowBaseV8.tsx
```

---

## Key Differences Analysis

### 1. Architecture Pattern

**Unified:** Direct Component → Service Pattern
```typescript
// Unified approach
UnifiedFlowSteps (Component)
  → calls UnifiedFlowIntegrationV8U.generateAuthorizationUrl()
    → delegates to OAuthIntegrationServiceV8
```

**MFA:** Router → Factory → Controller → Service Pattern
```typescript
// MFA approach
MFAFlowV8 (Router)
  → MFAFlowComponentFactory.create('SMS')
    → SMSFlowV8 (Component)
      → SMSFlowController (Controller)
        → MFAServiceV8 (Service)
```

**Impact:** MFA has an extra controller layer that Unified doesn't have.

---

### 2. Component Size & Organization

**Unified:**
- **Single monolithic step component:** 13,832 lines
- All steps in one file
- Switch statement for step routing

**MFA:**
- **Multiple device-specific components:** Each 2-4k lines
- Each device type in separate file
- Factory pattern for component selection

**Impact:** MFA is more modular per device type, but each component is still large.

---

### 3. Error Handling

**Unified:**
```typescript
// Centralized error handler
UnifiedFlowErrorHandler.handleError(error, context, {
  showToast: true,
  setValidationErrors,
  logError: true
});

// Parsed errors with recovery suggestions
{
  message: 'Invalid client credentials',
  userFriendlyMessage: 'Please check your Client ID and Client Secret',
  recoverySuggestion: 'Verify credentials in Step 0',
  errorCode: 'invalid_client'
}
```

**MFA:**
```typescript
// Inline try-catch
try {
  const result = await MFAServiceV8.registerDevice(...);
} catch (error) {
  console.error('Failed to register device', error);
  toastV8.error(error.message);
  setError(error.message);
}
```

**Impact:** Unified has more sophisticated error handling with recovery suggestions.

---

### 4. Logging & Debugging

**Unified:**
```typescript
// Dedicated logging service
UnifiedFlowLoggerService.info('Step completed', { step: 2, flowType });
UnifiedFlowLoggerService.error('Validation failed', context, error);
UnifiedFlowLoggerService.performance('Authorization URL generated', timing);
```

**MFA:**
```typescript
// Direct console.log
console.log(`${MODULE_TAG} Device registered`, { deviceId });
console.error(`${MODULE_TAG} Registration failed`, error);
```

**Impact:** Unified has structured logging with context and performance tracking.

---

## Consistency Plan

### Phase 1: Align Service Layer Patterns ⭐⭐⭐

**Goal:** Make service layer consistent between MFA and Unified

**Actions:**

1. **Extract MFA Integration Service (like Unified)**
   ```typescript
   // Create: src/v8/services/mfaFlowIntegrationV8.ts
   export class MFAFlowIntegrationV8 {
     static async registerDevice(deviceType, credentials) {
       // Delegates to device-specific services
       switch (deviceType) {
         case 'SMS': return SMSMFAServiceV8.registerDevice(credentials);
         case 'EMAIL': return EmailMFAServiceV8.registerDevice(credentials);
         // ...
       }
     }
     
     static async authenticateDevice(deviceType, credentials) {
       // Delegates to authentication services
     }
   }
   ```

2. **Adopt Unified Error Handler in MFA**
   ```typescript
   // Update all MFA flows to use:
   import { UnifiedFlowErrorHandler } from '@/v8u/services/unifiedFlowErrorHandlerV8U';
   
   // Or create MFA-specific handler that follows same pattern:
   export class MFAFlowErrorHandler {
     static handleError(error, context, options) {
       // Same structure as Unified
     }
   }
   ```

3. **Adopt Unified Logger in MFA**
   ```typescript
   // Update all MFA flows to use:
   import { UnifiedFlowLoggerService } from '@/v8u/services/unifiedFlowLoggerServiceV8U';
   
   // Or rename to shared:
   // src/v8/services/flowLoggerServiceV8.ts (used by both)
   ```

**Effort:** 16-24 hours  
**Benefit:** Consistent service patterns, better error handling, structured logging  
**Priority:** HIGH

---

### Phase 2: Align Component Patterns ⭐⭐

**Goal:** Make component structure more similar

**Options:**

**Option A: Keep Both Patterns (Recommended)**
- MFA: Router + Factory + Controller (works well for multiple device types)
- Unified: Container + Steps (works well for parameter variations)
- **Action:** Document why different patterns are used
- **Effort:** 2-4 hours (documentation only)

**Option B: Unify to Single Pattern**
- **B1:** Convert MFA to Unified pattern (Container + Steps)
  - Effort: 40-60 hours
  - Risk: HIGH (complete rewrite)
  - Benefit: Identical patterns

- **B2:** Convert Unified to MFA pattern (Router + Factory + Controller)
  - Effort: 60-80 hours
  - Risk: VERY HIGH (complete rewrite)
  - Benefit: Identical patterns

**Recommendation:** **Option A** - Document architectural decisions, keep both patterns.

**Rationale:**
- MFA needs per-device-type flexibility (Factory pattern appropriate)
- Unified needs per-parameter flexibility (Steps pattern appropriate)
- Both patterns are valid and serve their use cases well

---

### Phase 3: Align Styling & UI Components ⭐⭐⭐

**Goal:** Ensure visual consistency (ALREADY MOSTLY COMPLETE)

**Status:**
- ✅ Navigation: Identical styling
- ✅ Page width: Both 1400px
- ✅ Documentation: Category cards, live tracking
- ⏳ Page headers: Similar but slight differences
- ⏳ Button styles: Similar but slight differences
- ⏳ Modal styles: Similar but can be more consistent

**Actions:**

1. **Create Shared UI Component Library**
   ```typescript
   // src/v8/components/shared/
   ├── PageHeader.tsx          // Gradient header (used by both)
   ├── StepIndicator.tsx       // Step counter (used by both)
   ├── ActionButton.tsx        // Consistent button styles
   ├── SectionCard.tsx         // White cards with borders
   └── CategorySummaryCard.tsx // API category cards
   ```

2. **Extract Common Styles**
   ```typescript
   // src/v8/styles/flowStyles.ts
   export const FLOW_STYLES = {
     pageContainer: {
       maxWidth: '1400px',
       margin: '0 auto',
       padding: '2rem',
       background: '#f8fafc',
       minHeight: '100vh',
     },
     pageHeader: {
       background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
       borderRadius: '12px',
       padding: '24px',
       // ...
     },
     // ... more shared styles
   };
   ```

3. **Standardize Modal Components**
   - LoadingSpinnerModalV8U (already shared ✅)
   - Create shared: ConfirmModalV8, SuccessModalV8, ErrorModalV8

**Effort:** 12-16 hours  
**Benefit:** Perfect visual consistency  
**Priority:** HIGH

---

### Phase 4: Align Naming Conventions ⭐⭐

**Goal:** Consistent naming across both flows

**Current Inconsistencies:**

| Pattern | Unified | MFA | Suggested |
|---------|---------|-----|-----------|
| **Module Tags** | `[🎯 UNIFIED-OAUTH-FLOW-V8U]` | `[🔐 MFA-AUTHN-MAIN-V8]` | Keep distinct (for clarity) |
| **Service Names** | `UnifiedFlowIntegrationV8U` | `MFAServiceV8` | Harmonize: `*IntegrationV8` |
| **File Naming** | `*V8U.tsx` | `*V8.tsx` | Keep (distinguishes v8 vs v8u) |
| **Function Names** | `handleGenerateAuthUrl` | `handleStartMFA` | Align: `handle{Action}` ✅ |
| **State Interfaces** | `UnifiedFlowCredentials` | `MFACredentials` | Align: `*Credentials` ✅ |

**Actions:**

1. **Rename MFA Services to Match Pattern**
   ```typescript
   // Current
   MFAServiceV8
   MFAAuthenticationServiceV8
   
   // Suggested
   MFAFlowIntegrationV8 (facade, like Unified)
   MFAAuthenticationServiceV8 (keep specific services)
   ```

2. **Align Handler Naming**
   - Ensure all use `handle{Action}` pattern (mostly already consistent)

3. **Align Interface Naming**
   - Use `{Flow}Credentials`, `{Flow}State` pattern consistently

**Effort:** 8-12 hours  
**Benefit:** Easier code navigation, clearer structure  
**Priority:** MEDIUM

---

### Phase 5: Align State Management Patterns ⭐⭐⭐

**Goal:** Consistent state management approach

**Current State:**

**Unified:**
```typescript
// URL-driven state
const currentStep = useMemo(() => parseInt(urlStep), [urlStep]);
const [flowType, setFlowType] = useState<FlowType>(() => urlFlowType || 'oauth-authz');

// Multiple storage layers with priority
const credentials = useMemo(() => {
  // Priority 1: Flow-specific (localStorage)
  // Priority 2: Shared (localStorage + IndexedDB)
  // Priority 3: Defaults
}, [flowKey]);

// PKCE: Quadruple redundancy storage
PKCEStorageServiceV8U.savePKCECodes(flowKey, codes);
```

**MFA:**
```typescript
// Direct state management
const [authState, setAuthState] = useState({
  step: 0,
  isLoading: false,
  error: null,
  // ...
});

// Credentials from storage
const credentials = CredentialsServiceV8.loadCredentials('mfa-v8', config);

// Standard storage
localStorage.setItem('mfa_state', JSON.stringify(authState));
```

**Alignment Actions:**

1. **Adopt URL-Driven State in MFA**
   ```typescript
   // Current: /v8/mfa-hub
   // Suggested: /v8/mfa/{deviceType}/{step}
   // Example: /v8/mfa/sms/2
   
   // Benefits:
   // - Bookmarkable steps
   // - Browser back/forward support
   // - Consistent with Unified
   ```

2. **Implement Multi-Layer Storage for MFA**
   ```typescript
   // Create: MFAStorageServiceV8 (similar to PKCEStorageServiceV8U)
   export class MFAStorageServiceV8 {
     static saveMFAState(deviceType: DeviceType, state: MFAState) {
       // Layer 1: Memory (React state)
       // Layer 2: localStorage (primary)
       // Layer 3: sessionStorage (backup)
       // Layer 4: IndexedDB (persistent)
     }
   }
   ```

3. **Adopt FlowSettings Pattern for MFA**
   ```typescript
   // Similar to FlowSettingsServiceV8U
   export class MFAFlowSettingsV8 {
     static getDeviceType(): DeviceType { ... }
     static saveDeviceType(deviceType: DeviceType) { ... }
     static getLastUsedTimestamp(deviceType: DeviceType) { ... }
   }
   ```

**Effort:** 20-30 hours  
**Benefit:** Consistent state management, better persistence, URL navigation  
**Priority:** HIGH

---

### Phase 6: Align Documentation Patterns ⭐

**Goal:** Consistent documentation style

**Status:** MOSTLY ALIGNED ✅

- ✅ Both have UI Contract docs
- ✅ Both have UI Documentation (user-facing)
- ✅ Both have API documentation pages
- ✅ Both use same markdown format
- ⏳ Unified has more comprehensive docs (Restore docs, etc.)

**Actions:**

1. **Add Missing MFA Documentation**
   - Create MFA Restore documentation (like Unified)
   - Create MFA Architecture documentation
   - Create MFA Security analysis

2. **Standardize Documentation Templates**
   ```markdown
   # [Feature] - [Type] Documentation
   
   **Version:** X.Y
   **Last Updated:** YYYY-MM-DD
   **Flow Type:** [MFA/Unified]
   
   ## Table of Contents
   [standard sections]
   
   ## Overview
   [description]
   
   // ... standardized structure
   ```

3. **Cross-Reference Documentation**
   - Add links from MFA docs to Unified docs
   - Add architecture comparison doc
   - Document why patterns differ (when they do)

**Effort:** 6-8 hours  
**Benefit:** Easier onboarding, clearer architecture understanding  
**Priority:** MEDIUM

---

## Consistency Checklist

### ✅ Already Aligned

- [x] Page width (1400px)
- [x] Navigation buttons (separated, colored)
- [x] API Documentation page (category cards)
- [x] API call tracking (same service)
- [x] Loading spinners (LoadingSpinnerModalV8U)
- [x] Toast notifications (toastV8)
- [x] Handler naming (`handle{Action}`)
- [x] Interface naming (`{Type}Credentials`, `{Type}State`)

### ⏳ Partially Aligned

- [ ] Error handling (Unified has centralized, MFA inline)
- [ ] Logging (Unified has service, MFA uses console.log)
- [ ] State management (Unified URL-driven, MFA direct)
- [ ] Service layer (Unified has facade, MFA uses controllers)
- [ ] Component size (both have large components)
- [ ] Storage patterns (Unified multi-layer, MFA single-layer)

### ❌ Different (By Design)

- [x] Architecture pattern (Container+Steps vs Router+Factory+Controller)
- [x] File organization (monolithic vs modular by device type)
- [x] Flow routing (URL params vs component switching)

*Note: "Different (By Design)" items are intentionally different and serve their specific use cases. Keep these differences but document why.*

---

## Implementation Roadmap

### Sprint 1: Service Layer Alignment (2 weeks)

**Week 1:**
1. Extract MFAFlowIntegrationV8 service (facade pattern)
2. Adopt UnifiedFlowErrorHandler in MFA
3. Adopt UnifiedFlowLoggerService in MFA
4. Update all MFA flows to use new services

**Week 2:**
5. Add unit tests for new MFA services
6. Update documentation
7. Test all MFA device types
8. Deploy and verify

**Deliverables:**
- `src/v8/services/mfaFlowIntegrationV8.ts`
- Updated MFA controllers to use error handler
- Updated MFA flows to use logger
- Test coverage report

---

### Sprint 2: State Management Alignment (2 weeks)

**Week 1:**
1. Implement URL-based routing for MFA: `/v8/mfa/{deviceType}/{step}`
2. Create MFAStorageServiceV8 (multi-layer storage)
3. Create MFAFlowSettingsV8 (device type preferences)
4. Update MFA main page to use URL parameters

**Week 2:**
5. Migrate device-specific flows to URL routing
6. Test browser navigation (back/forward)
7. Test bookmarking and direct navigation
8. Update documentation

**Deliverables:**
- URL-based navigation for MFA
- Multi-layer storage service
- Flow settings service
- Updated routing logic

---

### Sprint 3: UI Component Extraction (1 week)

1. Create shared UI component library:
   - `src/v8/components/shared/PageHeader.tsx`
   - `src/v8/components/shared/StepIndicator.tsx`
   - `src/v8/components/shared/ActionButton.tsx`
   - `src/v8/components/shared/SectionCard.tsx`

2. Update Unified and MFA to use shared components

3. Extract common styles to `flowStyles.ts`

**Deliverables:**
- Shared UI component library
- Consistent visual components
- Shared style constants

---

### Sprint 4: Documentation & Testing (1 week)

1. Complete MFA documentation to match Unified
2. Add architecture comparison document
3. Create consistency guidelines for future development
4. Add integration tests
5. Code review and final adjustments

**Deliverables:**
- Complete documentation set
- Architecture decision records
- Consistency guidelines
- Test suite

---

## Success Criteria

### Code Consistency ✅

- [ ] Same error handling pattern across both flows
- [ ] Same logging pattern across both flows
- [ ] Same state management principles
- [ ] Same service layer structure (facade pattern)
- [ ] Shared UI components where possible

### Visual Consistency ✅

- [x] Same navigation styling
- [x] Same page width
- [x] Same documentation page layout
- [ ] Same modal styles
- [ ] Same button styles
- [ ] Same section card styles

### Developer Experience ✅

- [ ] Clear architecture documentation explaining differences
- [ ] Consistency guidelines for future development
- [ ] Easy to navigate between similar patterns
- [ ] Reduced cognitive load when switching between flows

### Maintainability ✅

- [ ] Shared services reduce duplication
- [ ] Consistent patterns easier to maintain
- [ ] Clear separation of concerns
- [ ] Test coverage >80%

---

## Estimated Total Effort

| Phase | Effort | Priority | Status |
|-------|--------|----------|--------|
| **Phase 1:** Service Layer | 2 weeks | HIGH | Not Started |
| **Phase 2:** State Management | 2 weeks | HIGH | Not Started |
| **Phase 3:** UI Components | 1 week | HIGH | Not Started |
| **Phase 4:** Documentation | 1 week | MEDIUM | Not Started |
| **Total** | **6 weeks** | - | - |

---

## Quick Wins (Can Do Immediately)

### 1. Adopt Error Handler in MFA (4 hours)
```typescript
// Find/Replace in all MFA files:
// Before:
try { ... } catch (error) {
  console.error('...', error);
  toastV8.error(error.message);
}

// After:
try { ... } catch (error) {
  UnifiedFlowErrorHandler.handleError(error, { 
    flowType: 'mfa', 
    deviceType, 
    step 
  });
}
```

### 2. Adopt Logger in MFA (4 hours)
```typescript
// Find/Replace in all MFA files:
// Before:
console.log(`${MODULE_TAG} ...`, data);

// After:
UnifiedFlowLoggerService.info('...', data);
```

### 3. Extract Page Header Component (2 hours)
```typescript
// Create shared PageHeader
export const PageHeader: React.FC<{
  title: string;
  subtitle: string;
  gradient: string;
}> = ({ title, subtitle, gradient }) => (
  <div style={{ background: gradient, borderRadius: '12px', ... }}>
    <h1>{title}</h1>
    <p>{subtitle}</p>
  </div>
);

// Use in both Unified and MFA
<PageHeader 
  title="🎯 Unified OAuth/OIDC Flow"
  subtitle="Single UI for all flows"
  gradient="linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)"
/>
```

### 4. Standardize Button Styles (2 hours)
```typescript
// Extract to: src/v8/components/shared/ActionButton.tsx
export const ActionButton: React.FC<{
  onClick: () => void;
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ onClick, variant, children, icon }) => {
  const variants = {
    primary: { bg: '#3b82f6', hover: '#2563eb' },
    success: { bg: '#10b981', hover: '#059669' },
    // ...
  };
  // ... consistent button implementation
};
```

**Total Quick Wins Effort:** 12 hours  
**Immediate Benefit:** Noticeable consistency improvement

---

## Long-Term Vision

### Ideal End State (After All Phases)

```
src/
├── v8/                     # Core V8 services (OAuth, MFA)
│   ├── services/           # Business logic
│   │   ├── oauth*/         # OAuth-specific
│   │   ├── mfa*/           # MFA-specific
│   │   └── shared/         # Shared services ← NEW
│   │       ├── flowErrorHandler.ts
│   │       ├── flowLogger.ts
│   │       └── flowStorage.ts
│   ├── components/
│   │   └── shared/         # Shared UI components ← NEW
│   │       ├── PageHeader.tsx
│   │       ├── ActionButton.tsx
│   │       └── CategoryCard.tsx
│   └── styles/             # Shared styles ← NEW
│       └── flowStyles.ts
│
├── v8u/                    # Unified OAuth flows
│   ├── flows/              # Flow containers
│   ├── components/         # Unified-specific components
│   └── services/           # Unified-specific services
│       └── (uses shared from v8/services/shared/)
│
└── mfa/                    # MFA flows (future: v8m?)
    ├── flows/              # Device-specific flows
    ├── components/         # MFA-specific components
    └── services/           # MFA-specific services
        └── (uses shared from v8/services/shared/)
```

---

## Recommendations

### Immediate Actions (This Week)

1. **Quick Win #1:** Adopt UnifiedFlowErrorHandler in MFA (4 hours)
2. **Quick Win #2:** Adopt UnifiedFlowLoggerService in MFA (4 hours)
3. **Quick Win #3:** Extract PageHeader component (2 hours)

**Total:** 10 hours  
**Impact:** Significant consistency improvement

### Next Month

1. **Phase 1:** Service Layer Alignment (2 weeks)
2. **Phase 3:** UI Component Extraction (1 week)

**Total:** 3 weeks  
**Impact:** Major consistency improvement

### Next Quarter

1. **Phase 2:** State Management Alignment (2 weeks)
2. **Phase 4:** Documentation (1 week)

**Total:** 3 weeks  
**Impact:** Complete consistency

---

## Decision: Keep or Merge?

### Keep Separate (Recommended) ✅

**Rationale:**
- MFA and Unified serve different purposes
- MFA: Device-type variability (SMS, Email, FIDO2, etc.)
- Unified: Spec/flow-type variability (OAuth 2.0, 2.1, OIDC)
- Both patterns are valid for their use cases

**Strategy:**
- ✅ Share services (error handling, logging, storage)
- ✅ Share UI components (headers, buttons, modals)
- ✅ Share styling constants
- ❌ Don't force same architecture pattern
- ✅ Document architectural decisions

### Merge into One (Not Recommended) ❌

**Why Not:**
- Would require complete rewrite (100+ hours)
- High risk of introducing bugs
- Lose benefits of specialized patterns
- Not worth the effort

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Decide on priority phases** to implement
3. **Start with Quick Wins** (10 hours for immediate impact)
4. **Schedule Sprint 1** when ready for major work

---

## Appendix: Side-by-Side Comparison

### Component Structure

**Unified Flow:**
```
UnifiedOAuthFlowV8U (Container)
  ├── UnifiedNavigationV8U
  ├── SpecVersionSelector
  ├── FlowTypeSelector
  ├── CredentialsFormV8U
  └── UnifiedFlowSteps
      ├── renderStep0() - Configuration
      ├── renderStep1PKCE() - PKCE
      ├── renderStep1AuthUrl() - Authorization URL
      ├── renderStep2Callback() - Callback
      ├── renderStep3ExchangeTokens() - Token Exchange
      └── renderStep6IntrospectionUserInfo() - Introspection
```

**MFA Flow:**
```
MFAAuthenticationMainPageV8 (All-in-one)
  ├── MFANavigationV8
  ├── Environment/Token/Policy Controls
  ├── Device Selection
  ├── Username Input
  ├── Authentication Challenge
  ├── Device Dashboard
  └── Success/Error Handling

OR (Device-specific flows):

MFAFlowV8 (Router)
  └── Factory.create(deviceType)
      └── SMSFlowV8 (Device Component)
          ├── Configuration
          ├── Registration
          ├── Activation
          └── Authentication
```

---

**Analysis Complete**  
**Plan Status:** Ready for Review & Implementation  
**Estimated Total Effort:** 6 weeks (or 10 hours for quick wins only)  
**Recommended Approach:** Implement Quick Wins first, then decide on major phases

---

*Created: 2026-01-19*  
*For: Consistency Improvement Initiative*
