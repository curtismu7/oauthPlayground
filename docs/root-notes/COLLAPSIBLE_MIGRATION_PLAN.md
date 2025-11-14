# Collapsible Header Service Migration Plan

**Date:** October 11, 2025  
**Scope:** 15+ flows need migration from local components to CollapsibleHeader service  
**Estimated Sections:** ~150+ individual collapsible sections

## ✅ Already Migrated Flows

1. **SAMLBearerAssertionFlowV6.tsx** ✅
2. **WorkerTokenFlowV6.tsx** ✅  
3. **JWTBearerTokenFlowV5.tsx** ✅

## 🔄 Flows Requiring Migration (Priority Order)

### Priority 1: PingOne & Critical Auth Flows (4 flows)
1. **PingOnePARFlowV6_New.tsx** - ~10 sections
2. **PingOnePARFlowV6.tsx** - ~8 sections
3. **OAuthAuthorizationCodeFlowV6.tsx** - ~12 sections
4. **OIDCAuthorizationCodeFlowV6.tsx** - ~12 sections

### Priority 2: RAR & V6 Flows (8 flows)
5. **RARFlowV6_New.tsx** - ~10 sections
6. **RARFlowV6.tsx** - ~10 sections
7. **DeviceAuthorizationFlowV6.tsx** - ~8 sections
8. **OIDCDeviceAuthorizationFlowV6.tsx** - ~8 sections
9. **ClientCredentialsFlowV6.tsx** - ~6 sections
10. **OIDCHybridFlowV6.tsx** - ~10 sections
11. **OAuthImplicitFlowV6.tsx** - ~8 sections
12. **OIDCImplicitFlowV6_Full.tsx** - ~8 sections

### Priority 3: Mock & Special Flows (3 flows)
13. **JWTBearerTokenFlowV6.tsx** (FlowUIService → CollapsibleHeader) - ~6 sections
14. **MockOIDCResourceOwnerPasswordFlow.tsx** - ~6 sections
15. **RedirectlessFlowV5_Mock.tsx** - ~8 sections

## Migration Pattern Per Section

### Before (Local Components):
```typescript
<CollapsibleSection>
    <CollapsibleHeaderButton
        onClick={() => toggleSection('overview')}
        aria-expanded={!collapsedSections.overview}
    >
        <CollapsibleTitle>
            <FiInfo /> OAuth 2.0 Authorization Code Overview
        </CollapsibleTitle>
        <CollapsibleToggleIcon $collapsed={collapsedSections.overview}>
            <FiChevronDown />
        </CollapsibleToggleIcon>
    </CollapsibleHeaderButton>
    {!collapsedSections.overview && (
        <CollapsibleContent>
            {/* content */}
        </CollapsibleContent>
    )}
</CollapsibleSection>
```

### After (CollapsibleHeader Service):
```typescript
<CollapsibleHeader
    title="OAuth 2.0 Authorization Code Overview"
    icon={<FiInfo />}
    defaultCollapsed={false}  // or true based on section type
    showArrow={true}
>
    {/* content */}
</CollapsibleHeader>
```

## Migration Steps Per Flow

1. **Add Import:**
   ```typescript
   import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
   ```

2. **Remove Local Styled Components:**
   - `const CollapsibleSection = styled.section`
   - `const CollapsibleHeaderButton = styled.button`
   - `const CollapsibleTitle = styled.span`
   - `const CollapsibleToggleIcon = styled.span`
   - `const CollapsibleContent = styled.div`

3. **Remove State Management:**
   - Remove `const [collapsedSections, setCollapsedSections] = useState(...)`
   - Remove `const toggleSection = ...`
   - (CollapsibleHeader manages its own state)

4. **Replace Each Section:**
   - Extract: title, icon, content
   - Determine: `defaultCollapsed` based on section type
   - Replace with `<CollapsibleHeader>` structure

5. **Apply Default Collapsed Rules:**
   - `defaultCollapsed={false}` for: `overview`, `credentials`, current step content
   - `defaultCollapsed={true}` for: all other sections

## Default Collapsed Rules Reference

| Section Key | Default State | Reason |
|-------------|---------------|---------|
| `overview` | OPEN (false) | Essential context |
| `credentials` | OPEN (false) | Primary user action |
| `flowDiagram` | COLLAPSED (true) | Reference material |
| `configuration` | COLLAPSED (true) | Advanced settings |
| `pkceOverview` | COLLAPSED (true) | Educational |
| `pkceDetails` | COLLAPSED (true) | Technical details |
| `rarOverview` | COLLAPSED (true) | Educational |
| `parOverview` | COLLAPSED (true) | Educational |
| `*Details` | COLLAPSED (true) | All detail sections |
| `*Overview` (except main) | COLLAPSED (true) | All secondary overviews |
| `flowSummary` | COLLAPSED (true) | Final summary |
| `uiSettings` | COLLAPSED (true) | Advanced settings |

## Estimated Time Per Flow

- Small flow (6 sections): ~15 minutes
- Medium flow (8-10 sections): ~20 minutes
- Large flow (12+ sections): ~30 minutes

**Total Estimated Time: ~6 hours for all 15 flows**

## Benefits of Migration

✅ **Consistency** - All flows use the same collapsible UI pattern  
✅ **Maintainability** - Single source of truth for collapsible behavior  
✅ **Less Code** - Remove ~50-100 lines of duplicate styled components per flow  
✅ **Better UX** - Consistent animations and interactions  
✅ **Future-Proof** - Easy to update collapsible behavior globally  

## Progress Tracking

- **Migrated:** 3/18 flows (16%)
- **Remaining:** 15/18 flows (84%)
- **Total Sections to Migrate:** ~150 sections

---

**This is a substantial migration that will improve consistency across all flows.**

