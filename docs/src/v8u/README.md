# V8U - Unified OAuth/OIDC Flow UI

**Version:** 8.0.0 (Unified)  
**Status:** 🚧 In Development

---

## Overview

V8U (V8 Unified) is a **single unified UI** that handles all OAuth 2.0, OAuth 2.1, and OpenID Connect flows using **real PingOne APIs**.

### Key Principles

1. **One UI, All Flows** - Single interface that adapts to different spec versions and flow types
2. **Real APIs** - Uses actual PingOne endpoints (no mocks)
3. **Spec-Aware** - Dynamically adapts to OAuth 2.0, OAuth 2.1, and OIDC requirements
4. **UI Isolated, Services Shared** - V8U has its own UI components but shares V8 services

---

## Architecture

### Directory Structure

```
src/v8u/
├── flows/
│   └── UnifiedOAuthFlowV8U.tsx    # Single unified flow page (V8U-specific)
├── components/
│   ├── SpecVersionSelector.tsx    # OAuth 2.0/2.1/OIDC selector (V8U-specific)
│   ├── FlowTypeSelector.tsx       # Flow type dropdown (V8U-specific)
│   └── UnifiedFlowSteps.tsx       # Unified step navigation (V8U-specific)
├── services/
│   └── unifiedFlowIntegrationV8U.ts  # Facade to V8 services (V8U-specific)
└── README.md
```

### Service Architecture

**V8U shares V8 services** to minimize duplication:

- ✅ **Shared (from V8)**: All integration services, validation, credentials management, spec version logic
- ✅ **Isolated (V8U-only)**: UI components, unified flow integration facade, unified steps component

**Why this approach?**
- **Less maintenance** - Update services once in V8, both V8 and V8U benefit
- **Consistent behavior** - Same API calls and validation logic across V8 and V8U
- **Easy splitting** - When splitting V8U into individual flows, reuse V8 services

### Services Used from V8

V8U imports and uses these V8 services directly:

```typescript
// From V8 services
import { SpecVersionServiceV8 } from '@/v8/services/specVersionServiceV8';
import { UnifiedFlowOptionsServiceV8 } from '@/v8/services/unifiedFlowOptionsServiceV8';
import { OAuthIntegrationServiceV8 } from '@/v8/services/oauthIntegrationServiceV8';
import { ImplicitFlowIntegrationServiceV8 } from '@/v8/services/implicitFlowIntegrationServiceV8';
import { ClientCredentialsIntegrationServiceV8 } from '@/v8/services/clientCredentialsIntegrationServiceV8';
import { DeviceCodeIntegrationServiceV8 } from '@/v8/services/deviceCodeIntegrationServiceV8';
import { ROPCIntegrationServiceV8 } from '@/v8/services/ropcIntegrationServiceV8';
import { HybridFlowIntegrationServiceV8 } from '@/v8/services/hybridFlowIntegrationServiceV8';
import { ValidationServiceV8 } from '@/v8/services/validationServiceV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';

// From V8 components
import CredentialsFormV8 from '@/v8/components/CredentialsFormV8';
import StepNavigationV8 from '@/v8/components/StepNavigationV8';
import StepActionButtonsV8 from '@/v8/components/StepActionButtonsV8';
import StepValidationFeedbackV8 from '@/v8/components/StepValidationFeedbackV8';

// From V8 hooks
import { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
```

### V8U-Specific Services

Only these are V8U-specific:

```typescript
// V8U-specific facade
import { UnifiedFlowIntegrationV8U } from '../services/unifiedFlowIntegrationV8U';
```

---

## Features

### ✅ Phase 1: Core Infrastructure (Complete)
- Spec version service integration (from V8)
- Unified flow options service integration (from V8)
- Credentials form component (from V8)
- V8U-specific unified flow integration facade

### ✅ Phase 2: Unified UI (Complete)
- Spec version selector (V8U-specific)
- Flow type selector (V8U-specific)
- Unified flow steps component (V8U-specific)
- Dynamic field visibility
- Dynamic checkbox availability

### 🚧 Phase 3: All Flow Types (In Progress)
- Authorization Code Flow ✅
- Implicit Flow ✅
- Client Credentials Flow ✅
- Device Code Flow ✅
- ROPC Flow ✅
- Hybrid Flow ✅

### ⏳ Phase 4: Testing & Documentation (Planned)
- Unit tests
- Integration tests
- Documentation

---

## Usage

```tsx
import UnifiedOAuthFlowV8U from './v8u/flows/UnifiedOAuthFlowV8U';

// Route
<Route path="/v8u/unified" element={<UnifiedOAuthFlowV8U />} />
```

---

## Future: Splitting V8U into Individual Flows

When V8U is split into individual flows (like V8 has), each flow will:

1. **Reuse V8 services** - No need to duplicate integration logic
2. **Use V8U UI components** - Share unified UI components (SpecVersionSelector, FlowTypeSelector)
3. **Create flow-specific pages** - Individual pages per flow type in `v8u/flows/`

Example structure after splitting:

```
src/v8u/
├── flows/
│   ├── UnifiedOAuthFlowV8U.tsx          # Keep for testing
│   ├── AuthorizationCodeFlowV8U.tsx     # New - split from unified
│   ├── ImplicitFlowV8U.tsx              # New - split from unified
│   └── ...                               # Other flows
├── components/
│   ├── SpecVersionSelector.tsx          # Shared across all V8U flows
│   ├── FlowTypeSelector.tsx             # Shared across all V8U flows
│   └── UnifiedFlowSteps.tsx             # Shared or flow-specific
└── services/
    └── unifiedFlowIntegrationV8U.ts     # Shared across all V8U flows
```

**Benefits:**
- ✅ Services stay in V8 (update once)
- ✅ V8U UI components shared (update once)
- ✅ Individual flow pages (better UX per flow)
- ✅ Easy to maintain (minimal duplication)

---

## Isolation Strategy

| Layer | Location | Reason |
|-------|----------|--------|
| **Services** | `v8/services/` | Shared - same API calls, validation, credentials |
| **Components** | `v8/components/` | Shared - CredentialsForm, StepNavigation, etc. |
| **Hooks** | `v8/hooks/` | Shared - step navigation logic |
| **UI Components** | `v8u/components/` | Isolated - unified UI specific to V8U |
| **Flows** | `v8u/flows/` | Isolated - unified flow page |
| **Integration** | `v8u/services/` | Isolated - facade layer for unified interface |

---

## Status

✅ **Complete**: Syntax errors fixed, V8U imports from V8 services  
✅ **Complete**: V8U UI components isolated in `v8u/` folder  
✅ **Complete**: All 6 flow types supported via unified interface  
🚧 **In Progress**: Testing all flow types with real PingOne APIs  
⏳ **Planned**: Split V8U into individual flow pages when stable
