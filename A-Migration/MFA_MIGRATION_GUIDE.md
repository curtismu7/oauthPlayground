# MFA Flow Migration Guide

**Last Updated:** March 2, 2026  
**Scope:** PingOne MFA flows — dependency maps and migration order for V8→V9  
**Prerequisites:**
- [migrate_vscode.md](./migrate_vscode.md) — core migration guide
- [V8_FLOW_MIGRATION_GUIDE.md](./V8_FLOW_MIGRATION_GUIDE.md) — V8-specific import patterns

---

## Overview: MFA Flows to Migrate

| Flow | V8 Source | Target Route | Complexity |
|---|---|---|---|
| PingOne Complete MFA | `src/v8/flows/CompleteMFAFlowV8.tsx` | `/flows/pingone-complete-mfa-v9` | High |
| PingOne MFA Workflow Library | `src/v8/flows/MFAFlowV8.tsx` | `/flows/pingone-mfa-workflow-library-v9` | High |
| MFA Authentication Main Page | `src/v8/flows/MFAAuthenticationMainPageV8.tsx` | `/flows/mfa-auth-v9` | Very High |

> **MFA Authentication Main Page** is the most complex — it directly instantiates 7 services and wraps multiple contexts. Migrate the other two first.

---

## Dependency Map: CompleteMFAFlowV8

```
CompleteMFAFlowV8.tsx
│
├── CONTEXTS (Provider wrappers — must be preserved)
│   ├── @/v8/contexts/GlobalMFAContext → GlobalMFAProvider
│   └── @/v8/contexts/MFACredentialContext → MFACredentialProvider
│
├── SERVICES (all via @/v8/... alias — import directly, no V9 copy needed)
│   ├── @/v8/services/mfaConfigurationServiceV8 → MFAConfigurationServiceV8
│   └── @/v8/services/environmentIdServiceV8 → EnvironmentIdServiceV8
│
├── HOOKS
│   └── @/v8/hooks/useWorkerToken → useWorkerToken
│
├── V8 COMPONENTS
│   ├── @/v8/components/MFAErrorBoundary → MFAErrorBoundary  ← required wrapper
│   ├── @/v8/components/MFAHeaderV8 → MFAHeaderV8
│   ├── @/v8/components/SuperSimpleApiDisplayV8
│   ├── @/v8/components/UserLoginModalV8
│   └── @/v8/utils/toastNotificationsV8 → toastV8
│
└── SHARED (no changes needed)
    ├── @/components/ui/ButtonSpinner
    ├── @icons (icon imports)
    └── React
```

**Migration complexity: Medium**  
All service/component imports already use the `@/v8/...` alias. The main concern is preserving the Context Provider wrapping order.

**Required Provider nesting:**
```tsx
<GlobalMFAProvider>
  <MFACredentialProvider>
    <MFAErrorBoundary>
      {/* flow content */}
    </MFAErrorBoundary>
  </MFACredentialProvider>
</GlobalMFAProvider>
```

---

## Dependency Map: MFAFlowV8 (Workflow Library)

```
MFAFlowV8.tsx
│
├── INTERNAL FACTORY (ref via alias in V9)
│   ├── ./factories/MFAFlowComponentFactory → MFAFlowComponentFactory
│   │   └── src/v8/flows/factories/MFAFlowComponentFactory.ts
│   └── ./factories/MFAFlowControllerFactory (index.ts)
│       └── src/v8/flows/factories/index.ts
│
├── INTERNAL FLOW TYPES
│   └── ./shared/MFATypes → DeviceType
│       └── src/v8/flows/shared/MFATypes.ts
│
├── SERVICES (all via @/v8/... alias)
│   ├── @/v8/services/credentialsServiceV8 → CredentialsServiceV8
│   └── @/v8/services/mfaFeatureFlagsV8 → MFAFeatureFlagsV8, MFAFeatureFlag (type)
│
├── V8 COMPONENTS
│   ├── @/v8/components/MFAErrorBoundary
│   └── @/v8/components/MFASkeletonLoader → MFAFlowSkeleton
│
├── V8 CONFIG
│   └── @/v8/config/deviceFlowConfigTypes → DeviceConfigKey (type)
│
└── SHARED
    └── React (Suspense, useState)
```

**Migration complexity: Medium**  
Key issue: `./factories/` and `./shared/` imports are V8-internal relative paths that need to become `@/v8/flows/factories/` and `@/v8/flows/shared/`.

**Fix for factory imports:**
```bash
FLOW="src/pages/flows/v9/MFAFlowV9.tsx"
sed -i '' "s|from './factories/|from '@/v8/flows/factories/|g" "$FLOW"
sed -i '' "s|from './shared/|from '@/v8/flows/shared/|g" "$FLOW"
```

---

## Dependency Map: MFAAuthenticationMainPageV8 (Most Complex)

```
MFAAuthenticationMainPageV8.tsx
│
├── SERVICES (7 services — all @/v8/... alias)
│   ├── @/v8/services/mfaServiceV8 → MFAServiceV8               ← core orchestrator
│   ├── @/v8/services/mfaAuthenticationServiceV8 → MfaAuthenticationServiceV8
│   ├── @/v8/services/mfaConfigurationServiceV8 → MFAConfigurationServiceV8
│   ├── @/v8/services/mfaRedirectUriServiceV8 → MFARedirectUriServiceV8
│   ├── @/v8/services/credentialsServiceV8 → CredentialsServiceV8
│   ├── @/v8/services/webAuthnAuthenticationServiceV8 → WebAuthnAuthenticationServiceV8
│   └── @/services/environmentService → environmentService     ← shared (not V8)
│
├── EXTERNAL SERVICE (v8u module)
│   └── @/v8u/services/returnTargetServiceV8U → ReturnTargetServiceV8U
│
├── V8 COMPONENTS (12 components)
│   ├── @/v8/components/WorkerTokenStatusDisplayV8
│   ├── @/v8/components/WorkerTokenExpiryBannerV8
│   ├── @/v8/components/WorkerTokenModalV8
│   ├── @/v8/components/ConfirmModalV8
│   ├── @/v8/components/DeviceFailureModalV8
│   ├── @/v8/components/MFACooldownModalV8
│   ├── @/v8/components/MFAInfoButtonV8
│   ├── @/v8/components/MFANavigationV8
│   ├── @/v8/components/SuperSimpleApiDisplayV8
│   └── @/v8/components/UserSearchDropdownV8
│
├── SHARED FLOW TYPES
│   └── @/v8/flows/shared/MFATypes → DeviceAuthenticationPolicy, DeviceType
│
├── SHARED COMPONENTS (from src/ root, not v8/)
│   ├── @/components/ui/ButtonSpinner
│   ├── @/components/education/EducationModeToggle
│   └── @/components/education/MasterEducationSection
│
└── UTILS / STORAGE
    ├── @/utils/storage → oauthStorage
    └── React (useCallback, useEffect, useId, useRef, useState)
```

**Migration complexity: Very High**  
- 7 services instantiated directly (not just imported)  
- 12 V8 components  
- `@/v8u/` import present — confirm `v8u` alias is configured in `tsconfig.json` / `vite.config.ts`
- `MFAServiceV8` is a stateful singleton — do **not** create a V9 copy; import it directly via `@/v8/services/mfaServiceV8`

---

## Service Status: Safe to Import Directly vs Needs V9 Equivalent

All MFA services can be imported directly from `@/v8/services/` without creating V9 copies. None of them have hard V7 dependencies.

| Service | V9 Equivalent Needed? | Reason |
|---|---|---|
| `mfaServiceV8` | ❌ No | Stateful singleton, import via alias |
| `mfaAuthenticationServiceV8` | ❌ No | Pure V8, no V7 deps, import via alias |
| `mfaConfigurationServiceV8` | ❌ No | Import via alias |
| `mfaRedirectUriServiceV8` | ❌ No | Import via alias |
| `mfaFeatureFlagsV8` | ❌ No | Import via alias |
| `credentialsServiceV8` | ⚠️ Eventually | Priority 1 service migration — but V8 version is fine for now |
| `webAuthnAuthenticationServiceV8` | ❌ No | Import via alias |
| `environmentIdServiceV8` | ❌ No | `environmentIdServiceV9.ts` exists but V8 is fine |

---

## V8 MFA Contexts — Usage Reference

Three contexts live in `src/v8/contexts/`:

### `GlobalMFAContext` — `GlobalMFAProvider`
- **Used by:** `CompleteMFAFlowV8`, `MFAAuthenticationMainPageV8`
- **Provides:** Global MFA state (current step, device list, auth status)
- **Must wrap:** The entire flow component tree
- **Import:** `import { GlobalMFAProvider } from '@/v8/contexts/GlobalMFAContext'`

### `MFACredentialContext` — `MFACredentialProvider`
- **Used by:** `CompleteMFAFlowV8`
- **Provides:** Credential state scoped to MFA (env ID, client ID, worker token)
- **Must wrap:** Inside `GlobalMFAProvider`, outside MFA step components
- **Import:** `import { MFACredentialProvider } from '@/v8/contexts/MFACredentialContext'`

### `FlowStateContext`
- **Used by:** General flow state tracking
- **Import:** `import { FlowStateContext } from '@/v8/contexts/FlowStateContext'`

---

## MFA Shared Types Reference

`src/v8/flows/shared/MFATypes.ts` exports:

```typescript
// Import in V9 via:
import type { DeviceType, DeviceAuthenticationPolicy } from '@/v8/flows/shared/MFATypes';
```

Key types used across MFA flows:
- `DeviceType` — `'SMS' | 'EMAIL' | 'TOTP' | 'FIDO2' | 'PUSH'` etc.
- `DeviceAuthenticationPolicy` — policy config shape
- `MFAStep` — flow step enum

---

## MFA Flow Factory Pattern

`src/v8/flows/factories/`:
- `MFAFlowComponentFactory.ts` — creates the correct step component for a given `DeviceType`
- `MFAFlowControllerFactory.ts` — creates the correct controller

In V9 files, import via alias:
```typescript
import { MFAFlowComponentFactory } from '@/v8/flows/factories/MFAFlowComponentFactory';
```

The factories themselves use `@/v8/...` alias internally and require no changes.

---

## Recommended Migration Order

1. **`CompleteMFAFlowV8`** — minimal service deps, context pattern established, good first MFA migration
2. **`MFAFlowV8`** — factory pattern, once context pattern is confirmed working
3. **`MFAAuthenticationMainPageV8`** — only after the above two are stable; most service deps

Do **not** attempt `MFAAuthenticationMainPageV8` first — it wraps and consumes state from the other flows.

---

## Pre-Migration Checklist for MFA Flows

```bash
FLOW_FILE="src/v8/flows/CompleteMFAFlowV8.tsx"  # change per flow

echo "=== Context providers (must preserve nesting order) ==="
grep "Provider\|Context" "$FLOW_FILE" | grep import

echo "=== All services imported ==="
grep "ServiceV8\|serviceV8" "$FLOW_FILE" | grep import

echo "=== Factory/shared imports ==="
grep "factories/\|flows/shared/" "$FLOW_FILE" | grep import

echo "=== Any v8u imports? ==="
grep "v8u/" "$FLOW_FILE" | grep import

echo "=== Relative imports that need fixing ==="
grep "from '\.\./services\|from '\.\./utils\|from '\.\./components\|from '\.\./types\|from '\.\./contexts\|from '\.\./hooks" "$FLOW_FILE"
```
