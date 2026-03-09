# Flows Structure Guide

**Date:** March 9, 2026  
**Purpose:** Help developers navigate the distributed flow architecture  
**Status:** Current structure is optimal - this is documentation only

---

## Overview

The application uses a **version-based distributed architecture** for flows. There is no single `src/flows/` directory because flows are organized by version and purpose.

---

## Flow Directory Structure

### V9 Flows (Latest) - `src/pages/flows/v9/`
**Purpose:** Current production flows with latest features
**Files:** 17 OAuth flow implementations

| File | Flow Type | Purpose |
|---|---|---|
| `ClientCredentialsFlowV9.tsx` | OAuth 2.0 | Client credentials grant |
| `DPoPAuthorizationCodeFlowV9.tsx` | OAuth 2.0 + DPoP | Authorization code with proof |
| `DeviceAuthorizationFlowV9.tsx` | OAuth 2.0 | Device authorization grant |
| `ImplicitFlowV9.tsx` | OAuth 2.0 | Implicit flow (legacy) |
| `JWTBearerTokenFlowV9.tsx` | OAuth 2.0 | JWT bearer token flow |
| `MFALoginHintFlowV9.tsx` | OIDC + MFA | Login hint with MFA |
| `MFAWorkflowLibraryFlowV9.tsx` | OIDC + MFA | MFA workflow library |
| `OAuthAuthorizationCodeFlowV9.tsx` | OAuth 2.0 | Standard authorization code |
| `OAuthAuthorizationCodeFlowV9_Condensed.tsx` | OAuth 2.0 | Compact version |
| `OAuthROPCFlowV9.tsx` | OAuth 2.0 | Resource owner password |
| `OIDCHybridFlowV9.tsx` | OIDC | Hybrid flow |
| `PingOnePARFlowV9.tsx` | OAuth 2.0 | Pushed authorization request |
| `RARFlowV9.tsx` | OAuth 2.0 | Rich authorization requests |
| `ResourcesAPIFlowV9.tsx` | OAuth 2.0 | Resources API integration |
| `SAMLBearerAssertionFlowV9.tsx` | OAuth 2.0 | SAML bearer assertion |
| `TokenExchangeFlowV9.tsx` | OAuth 2.0 | Token exchange |
| `WorkerTokenFlowV9.tsx` | OAuth 2.0 | Worker token flow |

### V8 Flows (Legacy) - `src/v8/flows/`
**Purpose:** V8 implementation for backward compatibility
**Status:** Maintained for existing V8 users

### V8 Migration - `src/v8m/pages/`
**Purpose:** Migration helpers for V8 → V9 transition
**Status:** Transitional support

### Top-level Entry Points - `src/pages/`
**Purpose:** Main navigation and flow selection
**Files:** Flow entry points and routing

---

## Navigation Guide

### Finding Flows by Version

#### For V9 (Latest) Flows:
```bash
# Navigate to V9 flows
cd src/pages/flows/v9/

# List all V9 flows
ls -la *.tsx

# Open a specific flow
code OAuthAuthorizationCodeFlowV9.tsx
```

#### For V8 (Legacy) Flows:
```bash
# Navigate to V8 flows
cd src/v8/flows/

# List V8 flows
ls -la *.tsx
```

#### For Migration Helpers:
```bash
# Navigate to V8 migration
cd src/v8m/pages/

# List migration flows
ls -la *.tsx
```

### Finding Flows by OAuth Grant Type

#### Authorization Code Flow:
- **V9:** `src/pages/flows/v9/OAuthAuthorizationCodeFlowV9.tsx`
- **V8:** `src/v8/flows/` (check for equivalent)

#### Client Credentials Flow:
- **V9:** `src/pages/flows/v9/ClientCredentialsFlowV9.tsx`

#### Device Authorization Flow:
- **V9:** `src/pages/flows/v9/DeviceAuthorizationFlowV9.tsx`

#### Implicit Flow:
- **V9:** `src/pages/flows/v9/ImplicitFlowV9.tsx`
- **Note:** Considered legacy, use authorization code when possible

#### Resource Owner Password:
- **V9:** `src/pages/flows/v9/OAuthROPCFlowV9.tsx`
- **Note:** Use only for trusted applications

#### Token Exchange:
- **V9:** `src/pages/flows/v9/TokenExchangeFlowV9.tsx`

---

## Import Patterns

### From V9 Flows:
```typescript
// Correct import depth from V9 flows (3 levels up)
import { someService } from '../../../services/someService';

// From: src/pages/flows/v9/SomeFlow.tsx
// To:   src/services/someService.ts
```

### From V8 Flows:
```typescript
// Import depth varies by V8 flow location
import { someService } from '../../services/someService';
```

### From Top-level Pages:
```typescript
// Standard import from pages
import { someService } from '../services/someService';
```

---

## Version Isolation Rules

### ✅ Allowed Cross-version Imports:
- V8 flows can import V8 services
- V9 flows can import V9 services
- Common utilities can be shared

### ❌ Prohibited Cross-version Imports:
- V9 flows should NOT import V8 services
- V8 flows should NOT import V9 services (unless intentional migration)
- Maintain version boundaries

---

## Adding New Flows

### For V9 (Recommended):
1. Create file in `src/pages/flows/v9/`
2. Follow naming convention: `FlowNameFlowV9.tsx`
3. Use V9 services: `src/services/v9/` or `src/services/`
4. Test with V9 components

### For V8 (Legacy only):
1. Create file in `src/v8/flows/`
2. Follow naming convention: `FlowNameFlowV8.tsx`
3. Use V8 services: `src/v8/services/`
4. Maintain V8 compatibility

---

## Migration Path (V8 → V9)

When migrating flows from V8 to V9:

1. **Create V9 version** in `src/pages/flows/v9/`
2. **Update imports** to use V9 services
3. **Test functionality** with V9 components
4. **Update routing** to point to V9 version
5. **Archive V8 version** when ready

---

## Best Practices

### File Naming:
- Use PascalCase: `OAuthAuthorizationCodeFlowV9.tsx`
- Include version suffix: `...FlowV9.tsx`
- Be descriptive: `MFALoginHintFlowV9.tsx`

### Import Organization:
```typescript
// React imports first
import React from 'react';

// V9 services next
import { someService } from '../../../services/someService';

// Components last
import { SomeComponent } from '../components/SomeComponent';
```

### Version Consistency:
- V9 flows use V9 components and services
- V8 flows use V8 components and services
- Don't mix versions unless intentional

---

## Troubleshooting

### Import Errors:
```typescript
// Wrong: Wrong depth from V9 flows
import { service } from '../../services/service'; // ❌

// Correct: Right depth from V9 flows  
import { service } from '../../../services/service'; // ✅
```

### Version Conflicts:
- Ensure flow version matches service version
- Check component compatibility
- Verify routing points to correct version

---

## Future Considerations

### When to Restructure:
Consider creating unified `src/flows/` directory only when:
1. V8 is fully deprecated
2. Major version change (V10+)
3. Architectural decision for unified approach

### Migration Strategy (If Needed):
1. Create `src/flows/v9/`, `src/flows/v10/`
2. Migrate incrementally by version
3. Update import paths systematically
4. Test each version independently

---

## Summary

The current distributed flow structure is **well-architected** and **future-proof**:

✅ **Version isolation** prevents conflicts  
✅ **Clear organization** by version and purpose  
✅ **Migration support** for V8 → V9 transition  
✅ **Scalable** for future versions  

**Recommendation:** Maintain current structure - it's optimal for the application's needs.
