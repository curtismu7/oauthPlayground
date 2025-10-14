# Comprehensive Collapsible Service Audit - All V6, Mock & PingOne Flows

**Date:** October 11, 2025  
**Goal:** Ensure ALL flows use CollapsibleHeader service consistently

## Flows Using CollapsibleHeader Service ✅

1. **SAMLBearerAssertionFlowV6.tsx** ✅ (recently migrated)
2. **WorkerTokenFlowV6.tsx** ✅ 
3. **JWTBearerTokenFlowV5.tsx** ✅

## Flows Using LOCAL Components ❌ (Need Migration)

### V6 Flows:
1. **PingOnePARFlowV6_New.tsx** ❌ - Uses local CollapsibleSection
2. **PingOnePARFlowV6.tsx** ❌ - Uses local CollapsibleSection
3. **RARFlowV6_New.tsx** ❌ - Uses local CollapsibleSection
4. **RARFlowV6.tsx** ❌ - Uses local CollapsibleSection
5. **OAuthAuthorizationCodeFlowV6.tsx** ❌ - Uses local CollapsibleSection
6. **OIDCAuthorizationCodeFlowV6.tsx** ❌ - Uses local CollapsibleSection
7. **OAuthImplicitFlowV6.tsx** ❌ - Uses local CollapsibleSection
8. **OIDCImplicitFlowV6_Full.tsx** ❌ - Uses local CollapsibleSection
9. **DeviceAuthorizationFlowV6.tsx** ❌ - Uses local CollapsibleSection
10. **OIDCDeviceAuthorizationFlowV6.tsx** ❌ - Uses local CollapsibleSection
11. **OIDCHybridFlowV6.tsx** ❌ - Uses local CollapsibleSection
12. **ClientCredentialsFlowV6.tsx** ❌ - Uses local CollapsibleSection

### Mock Flows:
13. **MockOIDCResourceOwnerPasswordFlow.tsx** ❌ - Uses local CollapsibleSection
14. **RedirectlessFlowV5_Mock.tsx** ❌ - Uses local CollapsibleSection

## Flows Using FlowUIService Collapsibles (Also Need Migration)

1. **JWTBearerTokenFlowV6.tsx** ⚠️ - Uses FlowUIService.getFlowUIComponents() collapsibles

## Migration Strategy

### Priority 1: PingOne & Critical Flows
1. PingOnePARFlowV6_New.tsx
2. PingOnePARFlowV6.tsx
3. OAuthAuthorizationCodeFlowV6.tsx
4. OIDCAuthorizationCodeFlowV6.tsx

### Priority 2: Other V6 Flows
5. RARFlowV6_New.tsx
6. RARFlowV6.tsx
7. DeviceAuthorizationFlowV6.tsx
8. OIDCDeviceAuthorizationFlowV6.tsx
9. ClientCredentialsFlowV6.tsx
10. OIDCHybridFlowV6.tsx
11. OAuthImplicitFlowV6.tsx
12. OIDCImplicitFlowV6_Full.tsx

### Priority 3: Mock & JWT Bearer
13. JWTBearerTokenFlowV6.tsx (FlowUIService → CollapsibleHeader)
14. MockOIDCResourceOwnerPasswordFlow.tsx
15. RedirectlessFlowV5_Mock.tsx

## Common Local Components to Replace

```typescript
// ❌ REMOVE THESE LOCAL DEFINITIONS:
const CollapsibleSection = styled.section`...`
const CollapsibleHeaderButton = styled.button`...`
const CollapsibleTitle = styled.span`...`
const CollapsibleToggleIcon = styled.span`...`
const CollapsibleContent = styled.div`...`

// ✅ REPLACE WITH:
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';

// ✅ USE LIKE THIS:
<CollapsibleHeader
    title="Section Title"
    icon={<FiIcon />}
    defaultCollapsed={true}
    showArrow={true}
>
    {/* content */}
</CollapsibleHeader>
```

## Default Collapsed State Strategy

**ALL sections default to collapsed** EXCEPT:
- Credentials sections
- Overview/Introduction sections
- Current step in multi-step flows

Will create detailed table after migration.

---

**Total Flows to Migrate:** ~15 flows  
**Estimated Lines to Remove:** ~50-100 lines per flow (duplicate styled components)  
**Impact:** Major - affects most V6 flows

