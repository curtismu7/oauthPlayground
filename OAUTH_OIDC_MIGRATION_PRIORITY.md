# OAuth & OIDC Flows - Priority Migration Plan

**Date:** October 11, 2025  
**Strategy:** Migrate OAuth & OIDC flows first, test thoroughly, then plan PingOne & Mock

## 🎯 Phase 1: OAuth & OIDC Flows (Priority)

### Authorization Code Flows (Highest Priority)
1. **OAuthAuthorizationCodeFlowV6.tsx** ⏳ (~12 sections)
2. **OIDCAuthorizationCodeFlowV6.tsx** ⏳ (~12 sections)

### Implicit Flows
3. **OAuthImplicitFlowV6.tsx** ⏳ (~8 sections)
4. **OIDCImplicitFlowV6.tsx** ⏳ (~6 sections)
5. **OIDCImplicitFlowV6_Full.tsx** ⏳ (~8 sections)

### Device Authorization Flows
6. **DeviceAuthorizationFlowV6.tsx** ⏳ (~8 sections)
7. **OIDCDeviceAuthorizationFlowV6.tsx** ⏳ (~8 sections)

### Other OAuth/OIDC Flows
8. **ClientCredentialsFlowV6.tsx** ⏳ (~6 sections)
9. **OIDCHybridFlowV6.tsx** ⏳ (~10 sections)

### RAR Flows (OAuth-based)
10. **RARFlowV6_New.tsx** ⏳ (~10 sections)
11. **RARFlowV6.tsx** ⏳ (~10 sections)

**Total OAuth/OIDC Sections:** ~98 sections  
**Estimated Time:** ~3-4 hours

---

## 🧪 Phase 2: Testing & Validation

After migrating OAuth/OIDC flows:

- [ ] Test Authorization Code flows (OAuth & OIDC)
- [ ] Test Implicit flows (OAuth & OIDC)
- [ ] Test Device Authorization flows (OAuth & OIDC)
- [ ] Test Client Credentials flow
- [ ] Test Hybrid flow
- [ ] Test RAR flows
- [ ] Verify all sections default to correct collapsed state
- [ ] Verify overview and credentials sections are open by default
- [ ] Check for any visual regressions

---

## 📋 Phase 3: PingOne & Mock Flows (After Testing)

### PingOne Flows
- **PingOnePARFlowV6_New.tsx** (partially done)
- **PingOnePARFlowV6.tsx**
- **PingOneMFAFlowV5.tsx**
- **RedirectlessFlowV6_Real.tsx**

### Mock Flows
- **MockOIDCResourceOwnerPasswordFlow.tsx**
- **RedirectlessFlowV5_Mock.tsx**

### Special Flows
- **JWTBearerTokenFlowV6.tsx** (FlowUIService → CollapsibleHeader)

**Total PingOne/Mock Sections:** ~40 sections  
**Estimated Time:** ~1.5 hours

---

## 🚀 Execution Plan

### Starting Now:
1. ✅ Complete OAuthAuthorizationCodeFlowV6.tsx
2. ✅ Complete OIDCAuthorizationCodeFlowV6.tsx
3. ✅ Complete OAuthImplicitFlowV6.tsx
4. ✅ Complete OIDCImplicitFlowV6.tsx
5. Continue through remaining OAuth/OIDC flows...

### After OAuth/OIDC Complete:
- User tests and validates
- Report any issues
- Plan PingOne & Mock migration based on learnings

---

## Implementation Checklist Per Flow

For each flow:
- [ ] Add `CollapsibleHeader` import
- [ ] Remove local `Collapsible*` styled components
- [ ] Replace each section with `<CollapsibleHeader>`
- [ ] Set `defaultCollapsed={false}` for `overview` and `credentials`
- [ ] Set `defaultCollapsed={true}` for all other sections
- [ ] Remove unused `collapsedSections` state (if fully migrated)
- [ ] Test the flow

---

**Let's start with the Authorization Code flows - they're the most critical! 🎯**

