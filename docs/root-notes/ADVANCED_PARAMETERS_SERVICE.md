# Advanced Parameters Service Implementation

## Summary
Created `AdvancedParametersService` to replace the old navigation-based approach with an inline collapsible section.

## Changes Made

### 1. Created Components & Service
- ✅ **`src/components/AdvancedParametersSection.tsx`** - Collapsible section component with all advanced parameters
- ✅ **`src/services/advancedParametersService.tsx`** - Service to provide the section to flows

### 2. Updated Flows (3 of 11 V6 flows)
- ✅ **OAuth Authorization Code V6** - Uses `AdvancedParametersService.getSimpleSection('oauth-authorization-code')`
- ✅ **OIDC Authorization Code V6** - Uses `AdvancedParametersService.getSimpleSection('oidc-authorization-code')`
- ✅ **PingOne PAR Flow V6 (New)** - Uses `AdvancedParametersService.getSimpleSection('oauth-authorization-code')`

### 3. Remaining Flows to Update
- ⏳ **RAR Flow V6 (New)** - `src/pages/flows/RARFlowV6_New.tsx`
- ⏳ **OIDC Hybrid Flow V6** - `src/pages/flows/OIDCHybridFlowV6.tsx`
- ⏳ **OAuth Implicit V6** - `src/pages/flows/OAuthImplicitFlowV6.tsx`
- ⏳ **OIDC Implicit V6 Full** - `src/pages/flows/OIDCImplicitFlowV6_Full.tsx`

Other V6 flows (Device, Client Credentials, JWT Bearer, SAML Bearer, Worker) don't typically need advanced parameters.

## Usage

### Simple Usage (No State Management)
```tsx
import AdvancedParametersService from '../../services/advancedParametersService';

// In your flow component's return statement:
{AdvancedParametersService.getSimpleSection('oauth-authorization-code')}
```

### Advanced Usage (With State Management)
```tsx
import AdvancedParametersService from '../../services/advancedParametersService';
import { ClaimsRequestStructure } from '../../components/ClaimsRequestBuilder';

// In your component:
const [claims, setClaims] = useState<ClaimsRequestStructure | null>(null);
const [resources, setResources] = useState<string[]>([]);

// In return statement:
{AdvancedParametersService.getSection({
  flowType: 'oidc-authorization-code',
  onClaimsChange: setClaims,
  onResourcesChange: setResources,
  initialClaims: claims,
  initialResources: resources,
  defaultCollapsed: true
})}
```

## Advanced Parameters Included

### OIDC-Specific
1. **Claims Request Builder** - Structured claims requests
2. **Display Parameter** - Controls UI presentation (page, popup, touch, wap)

### OAuth Parameters  
3. **Resource Indicators (RFC 8707)** - Target resource servers
4. **Prompt Parameter** - Authentication UI behavior (none, login, consent, select_account, create)
5. **Audience Parameter** - Target API for access token

## Benefits

### Before (Navigation Button)
- ❌ Separate page (`/flows/advanced-parameters-v6/:flowType`)
- ❌ Loses context when navigating away
- ❌ Complex state management across pages
- ❌ Extra navigation step for users

### After (Inline Section)
- ✅ Collapsible section on same page
- ✅ Maintains flow context
- ✅ Simple state management
- ✅ One-click access to advanced parameters
- ✅ All parameters visible in one place

## Migration Steps for Remaining Flows

For each remaining flow:

1. **Add import:**
```tsx
import AdvancedParametersService from '../../services/advancedParametersService';
```

2. **Add usage after FlowHeader:**
```tsx
<FlowHeader flowId="your-flow-id" />

{AdvancedParametersService.getSimpleSection('your-flow-type')}

<EnhancedFlowInfoCard ... />
```

3. **Flow type mapping:**
   - RAR: `'oauth-authorization-code'`
   - OIDC Hybrid: `'oidc-hybrid'`
   - OAuth Implicit: `'oauth-implicit'`
   - OIDC Implicit: `'oidc-implicit'`

## Next Steps

1. ✅ Service and component created
2. ✅ 3 flows updated
3. ⏳ Update remaining 4 flows
4. ⏳ Test all flows
5. ⏳ Remove old `AdvancedParametersNavigation` component
6. ⏳ Remove old `AdvancedParametersV6` standalone page (optional - keep for backwards compatibility)

## Status
🟡 **IN PROGRESS** - Core infrastructure complete, migration in progress

---

**Date:** October 12, 2025  
**Created By:** AI Assistant  
**Approved By:** [Pending]

