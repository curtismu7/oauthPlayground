# V8U Architecture Summary

**Version:** 8.0.0 (Unified)  
**Last Updated:** 2024-11-16

---

## Overview

V8U (V8 Unified) is a **single unified UI** that handles all OAuth 2.0, OAuth 2.1, and OpenID Connect flows using **real PingOne APIs**. The architecture separates **UI components** from **business logic/services** to ensure that UI changes don't impact backend functionality.

---

## Core Principle: UI Separation from Services

### Key Architectural Decision

**UI Components are Isolated, Services are Shared**

- ✅ **UI Components** → Copied to V8U (isolated from V8)
- ✅ **Services/Business Logic** → Shared from V8 (single source of truth)

This ensures:
- **UI Independence**: Changes to V8 UI don't break V8U
- **Service Consistency**: Business logic updates benefit both V8 and V8U
- **Easy Maintenance**: Update services once, both versions benefit
- **Future Flexibility**: Can split V8U into individual flows while reusing services

---

## Directory Structure

```
src/
├── v8/
│   ├── services/              # Business Logic (SHARED) ✅
│   │   ├── oauthIntegrationServiceV8.ts
│   │   ├── specVersionServiceV8.ts
│   │   ├── validationServiceV8.ts
│   │   ├── credentialsServiceV8.ts
│   │   └── ... (all integration services)
│   │
│   ├── components/            # V8 UI Components (SEPARATE) ✅
│   │   ├── CredentialsFormV8.tsx
│   │   ├── StepNavigationV8.tsx
│   │   ├── StepActionButtonsV8.tsx
│   │   └── ...
│   │
│   └── hooks/                 # V8 Hooks (SEPARATE) ✅
│       └── useStepNavigationV8.ts
│
└── v8u/
    ├── services/              # V8U-Specific Services
    │   └── unifiedFlowIntegrationV8U.ts  # Facade to V8 services
    │
    ├── components/            # V8U UI Components (ISOLATED) ✅
    │   ├── CredentialsFormV8U.tsx        # Copy of V8 version
    │   ├── StepNavigationV8U.tsx         # Copy of V8 version
    │   ├── StepActionButtonsV8U.tsx      # Copy of V8 version
    │   ├── StepValidationFeedbackV8U.tsx # Copy of V8 version
    │   ├── StepProgressBarV8U.tsx        # Copy of V8 version
    │   ├── SpecVersionSelector.tsx       # V8U-specific
    │   ├── FlowTypeSelector.tsx          # V8U-specific
    │   └── UnifiedFlowSteps.tsx          # V8U-specific
    │
    ├── hooks/                 # V8U Hooks (ISOLATED) ✅
    │   └── useStepNavigationV8U.ts       # Copy of V8 version
    │
    └── flows/                 # V8U Flows (ISOLATED) ✅
        └── UnifiedOAuthFlowV8U.tsx       # Main unified flow page
```

---

## Service Architecture (Shared)

### V8 Services Used by V8U

V8U imports and uses these **V8 services directly** (business logic layer):

```typescript
// Spec & Flow Management
import { SpecVersionServiceV8 } from '@/v8/services/specVersionServiceV8';
import { UnifiedFlowOptionsServiceV8 } from '@/v8/services/unifiedFlowOptionsServiceV8';

// OAuth Integration Services (Real PingOne API Calls)
import { OAuthIntegrationServiceV8 } from '@/v8/services/oauthIntegrationServiceV8';
import { ImplicitFlowIntegrationServiceV8 } from '@/v8/services/implicitFlowIntegrationServiceV8';
import { ClientCredentialsIntegrationServiceV8 } from '@/v8/services/clientCredentialsIntegrationServiceV8';
import { DeviceCodeIntegrationServiceV8 } from '@/v8/services/deviceCodeIntegrationServiceV8';
import { ROPCIntegrationServiceV8 } from '@/v8/services/ropcIntegrationServiceV8';
import { HybridFlowIntegrationServiceV8 } from '@/v8/services/hybridFlowIntegrationServiceV8';

// Validation & Credentials
import { ValidationServiceV8 } from '@/v8/services/validationServiceV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
```

**Why Shared?**
- These services contain **business logic** (API calls, validation, state management)
- They represent **contracts with PingOne APIs** (not UI concerns)
- Updating them once benefits both V8 and V8U
- Ensures **consistent behavior** across both versions

### V8U-Specific Services

Only **one service** is V8U-specific:

```typescript
// Facade layer - provides unified interface to V8 services
import { UnifiedFlowIntegrationV8U } from '../services/unifiedFlowIntegrationV8U';
```

This facade:
- Wraps V8 services with a unified API
- Handles flow type routing
- Provides a single interface for all OAuth flow types

---

## UI Architecture (Isolated)

### V8U UI Components

All UI components are **copied to V8U** with `V8U` suffix:

| V8 Component | V8U Component | Status |
|-------------|---------------|--------|
| `CredentialsFormV8.tsx` | `CredentialsFormV8U.tsx` | ✅ Isolated |
| `StepNavigationV8.tsx` | `StepNavigationV8U.tsx` | ✅ Isolated |
| `StepActionButtonsV8.tsx` | `StepActionButtonsV8U.tsx` | ✅ Isolated |
| `StepValidationFeedbackV8.tsx` | `StepValidationFeedbackV8U.tsx` | ✅ Isolated |
| `StepProgressBarV8.tsx` | `StepProgressBarV8U.tsx` | ✅ Isolated |
| `useStepNavigationV8.ts` | `useStepNavigationV8U.ts` | ✅ Isolated |

**V8U-Specific UI Components:**
- `SpecVersionSelector.tsx` - OAuth 2.0/2.1/OIDC selector
- `FlowTypeSelector.tsx` - Flow type dropdown
- `UnifiedFlowSteps.tsx` - Unified step navigation for all flow types

### Why Isolated?

1. **UI Independence**: Changes to V8 UI (styling, layout, behavior) don't affect V8U
2. **Future Customization**: V8U can evolve its UI independently
3. **Risk Mitigation**: UI bugs in V8 don't break V8U
4. **Separation of Concerns**: UI is presentation, services are logic

---

## Import Strategy

### V8U Imports

```typescript
// ✅ Shared Services (from V8)
import { SpecVersionServiceV8 } from '@/v8/services/specVersionServiceV8';
import { OAuthIntegrationServiceV8 } from '@/v8/services/oauthIntegrationServiceV8';
import { ValidationServiceV8 } from '@/v8/services/validationServiceV8';

// ✅ Isolated UI (from V8U)
import CredentialsFormV8U from '../components/CredentialsFormV8U';
import StepNavigationV8U from '../components/StepNavigationV8U';
import { useStepNavigationV8U } from '../hooks/useStepNavigationV8U';

// ✅ V8U-Specific
import { UnifiedFlowIntegrationV8U } from '../services/unifiedFlowIntegrationV8U';
import { SpecVersionSelector } from '../components/SpecVersionSelector';
import { FlowTypeSelector } from '../components/FlowTypeSelector';
```

**Rule**: 
- Services → Import from `@/v8/services/*`
- UI Components → Import from `../components/*` (V8U)
- Hooks → Import from `../hooks/*` (V8U)

---

## Benefits of This Architecture

### 1. **UI Changes Don't Break Services**

**Scenario**: V8 UI team updates `StepNavigationV8.tsx` styling
- ✅ V8U continues working (uses its own `StepNavigationV8U.tsx`)
- ✅ Services remain unchanged (business logic untouched)

### 2. **Service Updates Benefit Both**

**Scenario**: Bug fix in `OAuthIntegrationServiceV8.ts`
- ✅ Both V8 and V8U automatically benefit
- ✅ Single source of truth for API logic

### 3. **Easy Future Splitting**

When splitting V8U into individual flows:
- ✅ Reuse same V8 services
- ✅ Share V8U UI components
- ✅ Each flow just a different page

### 4. **Clear Separation of Concerns**

- **Services** = Business logic, API calls, validation
- **UI** = Presentation, user interaction, styling
- **Clear boundary** = Easier to maintain and test

---

## Type Sharing

### Types Imported from V8

V8U imports **type definitions** from V8 (these are contracts, not implementation):

```typescript
// Types (contracts, not implementation)
import type { SpecVersion, FlowType } from '@/v8/services/specVersionServiceV8';
import type { StepNavigationV8Props } from '@/v8/types/stepNavigation';
import type { StepProgressBarProps } from '@/v8/types/stepNavigation';
```

**Why?**
- Types are **contracts** (interfaces, not logic)
- Sharing types ensures **compatibility**
- No risk of divergence (types define structure, not behavior)

---

## Future: Splitting V8U into Individual Flows

When V8U is split into individual flows (like V8 has), the architecture will be:

```
src/v8u/
├── flows/
│   ├── UnifiedOAuthFlowV8U.tsx          # Keep for testing
│   ├── AuthorizationCodeFlowV8U.tsx     # New - split from unified
│   ├── ImplicitFlowV8U.tsx              # New - split from unified
│   ├── ClientCredentialsFlowV8U.tsx     # New - split from unified
│   └── ...                               # Other flows
│
├── components/                           # Shared UI components
│   ├── CredentialsFormV8U.tsx          # All flows use this
│   ├── StepNavigationV8U.tsx           # All flows use this
│   ├── SpecVersionSelector.tsx         # All flows use this
│   └── FlowTypeSelector.tsx            # All flows use this
│
└── services/                             # Shared services
    └── unifiedFlowIntegrationV8U.ts     # All flows use this
```

**Each flow will:**
- ✅ Import V8 services (business logic) - `@/v8/services/*`
- ✅ Use V8U UI components - `../components/*`
- ✅ Use V8U hooks - `../hooks/*`
- ✅ Have its own page - `../flows/*`

**Result**: Services stay shared, UI stays isolated, flows are separate pages.

---

## Service vs UI Boundary

### Services Layer (Shared)
- **What**: Business logic, API calls, validation, state management
- **Where**: `src/v8/services/*`
- **Shared With**: V8, V8U
- **Changes Impact**: Both V8 and V8U

### UI Layer (Isolated)
- **What**: React components, hooks, styling, user interaction
- **Where**: `src/v8/components/*` (V8) or `src/v8u/components/*` (V8U)
- **Isolated**: V8 UI ≠ V8U UI
- **Changes Impact**: Only the version they belong to

### Example: Changing Step Navigation

**Changing V8 StepNavigationV8.tsx:**
```typescript
// In src/v8/components/StepNavigationV8.tsx
export const StepNavigationV8: React.FC<...> = ({ ... }) => {
  // Change styling, add features, etc.
}
```
- ✅ V8 flows affected
- ✅ V8U flows **NOT** affected (uses `StepNavigationV8U.tsx`)

**Changing V8 ValidationServiceV8.ts:**
```typescript
// In src/v8/services/validationServiceV8.ts
static validateCredentials(credentials, flowType) {
  // Fix validation bug, add new rules
}
```
- ✅ V8 flows benefit
- ✅ V8U flows **ALSO** benefit (uses same service)

---

## Migration Strategy

### When to Copy UI to V8U

1. **Initial Setup** ✅ Done
   - Copy all V8 UI components used by V8U
   - Rename with `V8U` suffix
   - Update imports in V8U

2. **Future Updates**
   - If V8 UI component has bug fix → Copy updated version to V8U
   - If V8 UI component adds feature → Decide if V8U needs it
   - If V8U needs different UI → Modify V8U version independently

### When to Share Services

**Always share services** because:
- Services are business logic (not presentation)
- Single source of truth prevents divergence
- Updates benefit both versions automatically
- Easier to maintain and test

**Exception**: Only create V8U-specific service if:
- It provides a unified interface (like `unifiedFlowIntegrationV8U.ts`)
- It wraps multiple V8 services for V8U-specific needs
- It doesn't duplicate existing V8 service logic

---

## Testing Strategy

### Service Tests
- Test in `src/v8/services/__tests__/`
- Tests apply to both V8 and V8U (services are shared)

### UI Tests
- V8 UI tests: `src/v8/components/__tests__/`
- V8U UI tests: `src/v8u/components/__tests__/` (when added)
- Each UI version tested independently

---

## Summary

| Layer | Location | Shared/Isolated | Why |
|-------|----------|----------------|-----|
| **Services** | `v8/services/` | ✅ **Shared** | Business logic, API calls, validation |
| **Types** | `v8/types/`, `v8/services/` | ✅ **Shared** | Contracts/interfaces, ensure compatibility |
| **UI Components** | `v8u/components/` | 🔒 **Isolated** | Presentation, user interaction, styling |
| **Hooks** | `v8u/hooks/` | 🔒 **Isolated** | React hooks for UI state |
| **Flows** | `v8u/flows/` | 🔒 **Isolated** | V8U-specific unified flow page |

**Key Principle**: 
- ✅ **Services** = Shared (single source of truth)
- 🔒 **UI** = Isolated (independent evolution)
- ✅ **Types** = Shared (ensure compatibility)

This architecture ensures that **UI changes don't impact backend services**, while **service updates benefit both V8 and V8U**.

---

## Related Documents

- `src/v8u/README.md` - V8U overview and usage
- `docs/V8_UNIFIED_IMPLEMENTATION_ROADMAP.md` - Implementation plan
- `V8U_IMPLEMENTATION_STATUS.md` - Current status
- `V8U_ALL_FLOWS_IMPLEMENTATION_PLAN.md` - Future plans
