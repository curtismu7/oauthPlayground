# Field Rules Implementation Plan

## Overview
Implement proper field visibility and editability based on OAuth 2.0 and OIDC specifications.

---

## Phase 1: Create Field Rules Service ⏳ NEXT

### Task 1.1: Create fieldRulesService.ts
**File:** `src/services/fieldRulesService.ts`

**Purpose:** Central service that determines field visibility and editability for each flow type.

**Interface:**
```typescript
interface FieldRule {
  visible: boolean;
  editable: boolean;
  required: boolean;
  validValues?: string[];
  explanation?: string;
  enforcedValue?: string;
}

interface FlowFieldRules {
  environmentId: FieldRule;
  clientId: FieldRule;
  clientSecret: FieldRule;
  redirectUri: FieldRule;
  scope: FieldRule;
  responseType: FieldRule;
  loginHint: FieldRule;
  postLogoutRedirectUri: FieldRule;
  clientAuthMethod: FieldRule;
}

function getFieldRules(flowType: string, isOIDC: boolean): FlowFieldRules;
```

### Task 1.2: Implement Rules for Each Flow Type
- Authorization Code (OAuth & OIDC)
- Implicit (OAuth & OIDC)
- Client Credentials
- Device Authorization
- CIBA
- Hybrid

---

## Phase 2: Update CredentialsInput Component ⏳

### Task 2.1: Add Read-Only Field Support
**File:** `src/components/CredentialsInput.tsx`

**Changes:**
- Add `readOnly` prop support (different from `disabled`)
- Add lock icon (🔒) for read-only fields
- Add explanation text below read-only fields
- Style read-only fields differently (gray background)

### Task 2.2: Add Hidden Field Explanations
- Show info panel when field is hidden
- Explain WHY field is hidden
- Link to specification

---

## Phase 3: Integrate with ComprehensiveCredentialsService ⏳

### Task 3.1: Use Field Rules Service
**File:** `src/services/comprehensiveCredentialsService.tsx`

**Changes:**
```typescript
const fieldRules = useMemo(() => {
  return getFieldRules(flowType, isOIDC);
}, [flowType, isOIDC]);

// Pass rules to CredentialsInput
<CredentialsInput
  {...props}
  fieldRules={fieldRules}
/>
```

### Task 3.2: Enforce OIDC Scope Rules
- Auto-add `openid` to scopes for OIDC flows
- Show warning if user tries to remove it
- Make scope field read-only with explanation

### Task 3.3: Handle Response Type
- Show response type selector
- Disable if only one valid value
- Show explanation for fixed values

---

## Phase 4: Visual Enhancements 🎨

### Task 4.1: Create ReadOnlyField Component
```typescript
<ReadOnlyField
  label="Response Type"
  value="code"
  explanation="Fixed by OAuth 2.0 specification"
  icon={<FiLock />}
/>
```

### Task 4.2: Create HiddenFieldExplanation Component
```typescript
<HiddenFieldExplanation
  fieldName="Redirect URI"
  reason="Client Credentials is a machine-to-machine flow that doesn't use browser redirects."
  specReference="RFC 6749 Section 4.4"
/>
```

### Task 4.3: Add Tooltips
- Hover tooltips for all fields
- Explain what each field does
- Link to relevant spec sections

---

## Phase 5: Testing 🧪

### Task 5.1: Unit Tests
- Test field rules for each flow type
- Test OIDC scope enforcement
- Test response type rules

### Task 5.2: Integration Tests
- Test each flow type end-to-end
- Verify fields are hidden/shown correctly
- Verify read-only fields can't be edited

### Task 5.3: Manual Testing
- Test all 8 flow types
- Verify against specification
- Check visual indicators

---

## Implementation Order

### Week 1: Foundation
1. Create `fieldRulesService.ts` with all flow rules
2. Add unit tests for field rules
3. Document the service

### Week 2: UI Components
1. Update `CredentialsInput` for read-only support
2. Create `ReadOnlyField` component
3. Create `HiddenFieldExplanation` component

### Week 3: Integration
1. Integrate field rules into `ComprehensiveCredentialsService`
2. Implement OIDC scope enforcement
3. Add response type handling

### Week 4: Polish & Testing
1. Add tooltips and visual enhancements
2. Complete integration testing
3. Manual testing of all flows
4. Documentation

---

## Success Criteria

✅ **Correctness:**
- All fields follow OAuth 2.0 / OIDC specifications exactly
- No fields shown that shouldn't be
- No fields hidden that should be shown

✅ **Usability:**
- Clear visual distinction between editable and read-only
- Explanations for all fixed/hidden fields
- Users understand why fields are locked

✅ **Maintainability:**
- Centralized field rules (single source of truth)
- Easy to add new flow types
- Well-documented and tested

---

## Risk Mitigation

### Risk: Breaking existing flows
**Mitigation:** 
- Feature flag for new field rules
- Gradual rollout per flow type
- Comprehensive testing before deployment

### Risk: Spec interpretation errors
**Mitigation:**
- Reference official RFCs for each rule
- Peer review of field rules
- Test against real OAuth providers

### Risk: User confusion
**Mitigation:**
- Clear explanations for all restrictions
- Link to specifications
- Provide examples

---

## Next Action

**START HERE:** Create `src/services/fieldRulesService.ts` with the field rules for all flow types.

Would you like me to proceed with Phase 1, Task 1.1?
