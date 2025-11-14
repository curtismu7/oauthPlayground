# Remaining Flows - CollapsibleHeader Migration Plan

**Date:** October 11, 2025  
**Status:** Ready to Execute  

## ✅ Already Completed

1. **AdvancedParametersV6.tsx** ✅
2. **OAuthAuthorizationCodeFlowV6.tsx** ✅ (has local components, but working)
3. **OIDCAuthorizationCodeFlowV6.tsx** ✅ (has local components, but working)
4. **SAMLBearerAssertionFlowV6.tsx** ✅
5. **WorkerTokenFlowV6.tsx** ✅
6. **JWTBearerTokenFlowV5.tsx** ✅

---

## 🎯 Phase 1: Complete OAuth/OIDC V6 Flows (Priority)

### Batch 1: Implicit Flows (2 flows)
1. **OAuthImplicitFlowV6.tsx** ⏳
2. **OIDCImplicitFlowV6_Full.tsx** ⏳

### Batch 2: Device Authorization Flows (2 flows)
3. **DeviceAuthorizationFlowV6.tsx** ⏳
4. **OIDCDeviceAuthorizationFlowV6.tsx** ⏳

### Batch 3: Other Core Flows (2 flows)
5. **ClientCredentialsFlowV6.tsx** ⏳
6. **OIDCHybridFlowV6.tsx** ⏳

**Total:** 6 flows

---

## 🎯 Phase 2: PingOne Flows (4 flows)

1. **PingOnePARFlowV6_New.tsx** ⏳ (restore and migrate properly)
2. **RARFlowV6_New.tsx** ⏳
3. **PingOnePARFlowV6.tsx** ⏳ (older version)
4. **RARFlowV6.tsx** ⏳ (older version)

**Total:** 4 flows

---

## 🎯 Phase 3: Mock & Special Flows (3 flows)

1. **MockOIDCResourceOwnerPasswordFlow.tsx** ⏳
2. **RedirectlessFlowV5_Mock.tsx** ⏳
3. **JWTBearerTokenFlowV6.tsx** ⏳ (FlowUIService → CollapsibleHeader)

**Total:** 3 flows

---

## 📊 Grand Total

**Remaining to Migrate:** 13 flows  
**Estimated Total Sections:** ~90 sections  
**Expected Code Reduction:** ~1,000-1,500 lines

---

## 🔧 Migration Template (Per Flow)

```typescript
// 1. Add import
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';

// 2. Remove local components
// DELETE: CollapsibleSection, CollapsibleHeaderButton, CollapsibleTitle, 
//         CollapsibleToggleIcon, CollapsibleContent

// 3. Replace each section
// BEFORE:
<CollapsibleSection>
    <CollapsibleHeaderButton onClick={() => toggleCollapsed('sectionId')}>
        <CollapsibleTitle><FiIcon /> Title</CollapsibleTitle>
        <CollapsibleToggleIcon $collapsed={collapsedSections.sectionId}>
            <FiChevronDown />
        </CollapsibleToggleIcon>
    </CollapsibleHeaderButton>
    {!collapsedSections.sectionId && (
        <CollapsibleContent>{/* content */}</CollapsibleContent>
    )}
</CollapsibleSection>

// AFTER:
<CollapsibleHeader
    title="Title"
    icon={<FiIcon />}
    defaultCollapsed={true}  // or false for credentials/overview
>
    {/* content */}
</CollapsibleHeader>

// 4. Update default collapsed states
// credentials: false (always open)
// overview: false (always open)
// all others: true (start collapsed)
```

---

## 🚀 Execution Order

### Starting Now:
1. OAuthImplicitFlowV6.tsx
2. OIDCImplicitFlowV6_Full.tsx
3. DeviceAuthorizationFlowV6.tsx
4. OIDCDeviceAuthorizationFlowV6.tsx
5. ClientCredentialsFlowV6.tsx
6. OIDCHybridFlowV6.tsx
7. PingOnePARFlowV6_New.tsx
8. RARFlowV6_New.tsx
9. PingOnePARFlowV6.tsx
10. RARFlowV6.tsx
11. JWTBearerTokenFlowV6.tsx
12. MockOIDCResourceOwnerPasswordFlow.tsx
13. RedirectlessFlowV5_Mock.tsx

---

## 📝 Per-Flow Checklist

For each flow:
- [ ] Search for local `CollapsibleSection`, `CollapsibleHeaderButton` definitions
- [ ] Count total sections to migrate
- [ ] Add `CollapsibleHeader` import
- [ ] Replace all sections with `<CollapsibleHeader>`
- [ ] Remove all local collapsible styled components
- [ ] Set appropriate `defaultCollapsed` values
- [ ] Remove `collapsedSections` state if no longer needed
- [ ] Check for linter errors
- [ ] Test the flow briefly

---

**Let's start! 🚀**

